/*!
 * Open Historia Map Editor
 * Copyright (c) 2026 Nicholas Krol - MIT License (see src/Editor/LICENSE).
 */

// Plan F, stage F-2 — the assembler. Reads an F-1 lines dump, welds and walks
// it into faces (lib/assembleFaces.mjs), names the faces from a polity file,
// optionally clips the result to the modern land mask, and writes:
//
//   era-borders-<date>.geojson        one Feature per polity (MultiPolygon)
//   era-borders-<date>-report.json    every face, every discard, every reason
//
//   node scripts/ohm/assemble-era-borders.mjs scripts/ohm/out/era-lines-1939-09-01-z4.geojson \
//        --polities scripts/ohm/out/era-polities-1939-09-01.json
//
//   --polities FILE     era-polities json (fetch-era-polities.mjs) OR an F-1
//                       centroids dump — both shapes are understood
//   --land-mask FILE    modern land source (default: public/assets/
//                       regions-seed.geojson IF present). NOT a post-clip:
//                       measured 2026-08-09, OHM line tiles carry land
//                       borders and essentially NO coastlines (the Gulf of
//                       Riga had 10 vertices, all of them the Estonia–Latvia
//                       land border), so the modern coast is FUSED INTO THE
//                       GRAPH as closing geometry — era borders end on it,
//                       sea-facing countries close against it. This is the
//                       source ladder's rung-2 hybrid: era land borders +
//                       modern coasts. --no-land-mask = landlocked-only
//                       assembly, and it says so loudly.
//   --snap N            weld tolerance in degrees (default: the measured 0.06)
//   --out DIR           default scripts/ohm/out
//
// This is offline work on local files — safe to run anywhere, including the
// cloud session. Only the two fetching scripts are PC-only.
//
// The land union runs per COUNTRY first and then tree-merges with graceful
// failure (polygon-clipping can choke on continent-scale input — measured: 2
// country + 6 merge failures across the calibration window, each kept as
// separate pieces and counted rather than sinking the run).

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";
import { bboxToTileRange, isoToDecdate, resolveWindow, tileToBbox } from "./lib/eraBorders.mjs";
import { SNAP_TOLERANCE, assembleEraBorders } from "./lib/assembleFaces.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, "..", "..");
const DEFAULT_LAND_MASK = path.join(PROJECT_ROOT, "public", "assets", "regions-seed.geojson");

const usage = (message) => {
  if (message) console.error(`[ohm] ${message}\n`);
  console.error(
    "사용법: node scripts/ohm/assemble-era-borders.mjs <lines-dump.geojson>" +
      " --polities <era-polities.json | centroids-dump.geojson>" +
      " [--land-mask FILE | --no-land-mask] [--snap 0.06] [--out DIR]",
  );
  process.exit(1);
};

const DEFAULT_OVERRIDES = path.join(__dirname, "data", "center-overrides.json");

const parseArgs = (argv) => {
  const options = {
    lines: null,
    polities: null,
    landMask: existsSync(DEFAULT_LAND_MASK) ? DEFAULT_LAND_MASK : null,
    overrides: existsSync(DEFAULT_OVERRIDES) ? DEFAULT_OVERRIDES : null,
    snap: SNAP_TOLERANCE,
    out: path.join("scripts", "ohm", "out"),
  };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--polities") options.polities = String(argv[(i += 1)] ?? "");
    else if (arg === "--land-mask") options.landMask = String(argv[(i += 1)] ?? "");
    else if (arg === "--no-land-mask") options.landMask = null;
    else if (arg === "--override-centers") options.overrides = String(argv[(i += 1)] ?? "");
    else if (arg === "--snap") options.snap = Number(argv[(i += 1)]);
    else if (arg === "--out") options.out = String(argv[(i += 1)] ?? "");
    else if (!arg.startsWith("--") && options.lines === null) options.lines = arg;
    else usage(`알 수 없는 인자: ${arg}`);
  }
  if (!options.lines) usage("선 덤프 경로가 없다");
  if (!options.polities) usage("--polities가 없다 (이름 없는 면은 조립해도 나라가 못 된다)");
  if (!Number.isFinite(options.snap) || options.snap < 0) usage("--snap은 0 이상의 수");
  return options;
};

// OHM carries a few BORDER-LINE relations mistagged as admin_level-2 polities
// ("Граница СССР-Финляндия" ×3 in the first Europe run) — a border is not a
// country, and one of them promptly joined a conflict face. Filtered by name
// shape, counted out loud.
const BORDER_RELATION_NAME = /^(граница|border of|border between|boundary of|frontière|국경)\b/i;

// Accept either polity-file shape and normalise to { name, names, center, start }.
const readPolities = (file) => {
  const parsed = JSON.parse(readFileSync(file, "utf8"));
  let raw;
  if (Array.isArray(parsed.polities)) {
    raw = parsed.polities.map((p) => ({
      name: p.name,
      names: p.names ?? {},
      center: p.center,
      start: resolveWindow(p).start,
      start_date: p.start_date ?? "",
      end_date: p.end_date ?? "",
    }));
  } else if (Array.isArray(parsed.features)) {
    raw = parsed.features
      .filter((f) => f?.geometry?.type === "Point" && f?.properties?.name)
      .map((f) => ({
        name: f.properties.name,
        names: {},
        center: f.geometry.coordinates,
        start: resolveWindow(f.properties).start,
        start_date: f.properties.start_date ?? "",
        end_date: f.properties.end_date ?? "",
      }));
  } else {
    throw new Error(`정치체 파일 형식을 모른다: ${file}`);
  }
  const polities = raw.filter((p) => !BORDER_RELATION_NAME.test(p.name));
  const borderRelations = raw.length - polities.length;
  if (borderRelations > 0) {
    console.log(`[ohm] 경계선 관계 ${borderRelations}개 제외 (정치체 아님): ${raw.filter((p) => BORDER_RELATION_NAME.test(p.name)).map((p) => p.name).join(", ")}`);
  }
  return polities;
};

// Overpass centers are BBOX centers and bbox centers lie: the 1939 French
// Republic legally includes Algeria, so its center lands south of the
// Mediterranean; the UK's lands in the North Channel. This file pins honest
// interior points for known liars — hand-placed coordinates, our own data.
const applyCenterOverrides = (polities, overridePath) => {
  if (!overridePath || !existsSync(overridePath)) return [];
  const overrides = JSON.parse(readFileSync(overridePath, "utf8"));
  const applied = [];
  for (const p of polities) {
    const pin = overrides[p.name];
    if (Array.isArray(pin) && pin.length === 2 && pin.every(Number.isFinite)) {
      p.center = pin;
      applied.push(p.name);
    }
  }
  return applied;
};

const bboxOfCoords = (coords, bbox = [Infinity, Infinity, -Infinity, -Infinity]) => {
  if (typeof coords[0] === "number") {
    if (coords[0] < bbox[0]) bbox[0] = coords[0];
    if (coords[1] < bbox[1]) bbox[1] = coords[1];
    if (coords[0] > bbox[2]) bbox[2] = coords[0];
    if (coords[1] > bbox[3]) bbox[3] = coords[1];
    return bbox;
  }
  for (const c of coords) bboxOfCoords(c, bbox);
  return bbox;
};

const bboxesOverlap = (a, b) => a[0] <= b[2] && b[0] <= a[2] && a[1] <= b[3] && b[1] <= a[3];

// faces -> GeoJSON MultiPolygon coordinates (rings closed).
const facesToMultiPolygon = (faces) =>
  faces.map((face) => [[...face.outer, face.outer[0]], ...face.holes.map((h) => [...h, h[0]])]);

// Modern land source -> dissolved coastline for graph fusion, WITHOUT boolean
// ops. First tried polygon-clipping union: continent-scale merges failed
// nondeterministically, the graceful fallback kept overlapping pieces, and
// per-ring decimation then desynced the duplicated modern borders into
// thousands of near-parallel crossings (measured: 4,676 splits, 697 anomalous
// walks, Latvia lost). The cure is the EDGE-PARITY DISSOLVE the data was
// built for: extract-regions guarantees neighbouring regions share
// bit-identical border vertices, so every segment appearing an EVEN number of
// times is an internal modern border (drop) and every ODD one is exterior —
// coast or lake shore (keep). Exact, linear, no failure mode. Kept segments
// are chained back into parts so decimation sees whole coastlines.
const dissolveByParity = (maskPath, windowBbox) => {
  const mask = JSON.parse(readFileSync(maskPath, "utf8"));
  const count = new Map(); // canonical segment -> { a, b, n }
  let regions = 0;
  for (const f of mask.features ?? []) {
    if (!f?.geometry || (f.geometry.type !== "Polygon" && f.geometry.type !== "MultiPolygon")) continue;
    if (windowBbox && !bboxesOverlap(bboxOfCoords(f.geometry.coordinates), windowBbox)) continue;
    regions += 1;
    const polys = f.geometry.type === "Polygon" ? [f.geometry.coordinates] : f.geometry.coordinates;
    for (const poly of polys) {
      for (const ring of poly) {
        for (let i = 0; i + 1 < ring.length; i += 1) {
          const a = ring[i];
          const b = ring[i + 1];
          const ka = `${a[0]},${a[1]}`;
          const kb = `${b[0]},${b[1]}`;
          if (ka === kb) continue;
          const key = ka < kb ? `${ka}|${kb}` : `${kb}|${ka}`;
          const cur = count.get(key);
          if (cur) cur.n += 1;
          else count.set(key, { a, b, n: 1 });
        }
      }
    }
  }
  const ptOf = new Map();
  const adj = new Map();
  let internalDropped = 0;
  let weirdParity = 0;
  let keptSegments = 0;
  for (const { a, b, n } of count.values()) {
    if (n % 2 === 0) {
      internalDropped += 1;
      continue;
    }
    if (n > 1) weirdParity += 1;
    keptSegments += 1;
    const ka = `${a[0]},${a[1]}`;
    const kb = `${b[0]},${b[1]}`;
    ptOf.set(ka, a);
    ptOf.set(kb, b);
    if (!adj.has(ka)) adj.set(ka, new Set());
    if (!adj.has(kb)) adj.set(kb, new Set());
    adj.get(ka).add(kb);
    adj.get(kb).add(ka);
  }
  const segKeyOf = (x, y) => (x < y ? `${x}|${y}` : `${y}|${x}`);
  const visited = new Set();
  const chains = [];
  const walk = (start, next) => {
    const part = [ptOf.get(start), ptOf.get(next)];
    visited.add(segKeyOf(start, next));
    let cur = next;
    while (cur !== start && adj.get(cur).size === 2) {
      const forward = [...adj.get(cur)].find((k) => !visited.has(segKeyOf(cur, k)));
      if (!forward) break;
      visited.add(segKeyOf(cur, forward));
      part.push(ptOf.get(forward));
      cur = forward;
    }
    return part;
  };
  for (const [k, nbrs] of adj) {
    if (nbrs.size === 2) continue;
    for (const nb of nbrs) if (!visited.has(segKeyOf(k, nb))) chains.push(walk(k, nb));
  }
  for (const [k, nbrs] of adj) {
    for (const nb of nbrs) if (!visited.has(segKeyOf(k, nb))) chains.push(walk(k, nb));
  }
  return { rings: chains, stats: { regions, keptSegments, internalDropped, weirdParity, chains: chains.length } };
};

const main = () => {
  const options = parseArgs(process.argv.slice(2));
  const linesPath = path.resolve(PROJECT_ROOT, options.lines);
  const dump = JSON.parse(readFileSync(linesPath, "utf8"));
  const date = dump?.meta?.date ?? "unknown-date";
  const targetDec = dump?.meta?.decdate ?? isoToDecdate(date);
  if (!Array.isArray(dump.features)) usage(`선 덤프에 features가 없다: ${options.lines}`);
  if (dump?.meta?.layer && dump.meta.layer !== "land_ohm_lines") {
    console.warn(`[ohm] 주의: 입력 레이어가 ${dump.meta.layer} — 선 덤프가 맞는지 확인하라`);
  }

  const polities = readPolities(path.resolve(PROJECT_ROOT, options.polities));
  const overridden = applyCenterOverrides(polities, options.overrides ? path.resolve(PROJECT_ROOT, options.overrides) : null);
  if (overridden.length > 0) console.log(`[ohm] 중심 오버라이드 ${overridden.length}건 적용: ${overridden.join(", ")}`);

  // The frame rule needs the dump's TILE coverage, which is wider than the
  // requested bbox (tiles are fetched whole). Rebuild it exactly the way the
  // extractor chose its tiles.
  let windowBbox = null;
  if (Array.isArray(dump?.meta?.bbox) && Number.isInteger(dump?.meta?.zoom)) {
    const range = bboxToTileRange(dump.meta.bbox, dump.meta.zoom);
    const nw = tileToBbox(dump.meta.zoom, range.xMin, range.yMin);
    const se = tileToBbox(dump.meta.zoom, range.xMax, range.yMax);
    windowBbox = [nw[0], se[1], se[2], nw[3]];
  } else {
    console.warn("[ohm] 주의: meta.bbox/zoom이 없어 창 프레임 없이 조립 — 가장자리 국가는 소실될 수 있다");
  }

  // The coast fusion input (see header).
  let coastRings = null;
  let coastStats = null;
  if (options.landMask) {
    const t0 = Date.now();
    ({ rings: coastRings, stats: coastStats } = dissolveByParity(path.resolve(PROJECT_ROOT, options.landMask), windowBbox));
    console.log(
      `[ohm] 해안 패리티 디졸브 ${Date.now() - t0}ms: 지역 ${coastStats.regions} · 내부 국경 세그먼트 ${coastStats.internalDropped} 제거 · ` +
        `해안 세그먼트 ${coastStats.keptSegments} → 사슬 ${coastStats.chains}개 (홀수 3+ 특이 ${coastStats.weirdParity})`,
    );
  }

  console.log(
    `[ohm] 조립 시작: ${date} · 선 ${dump.features.length} · 정치체 후보 ${polities.length} · ` +
      `스냅 ${options.snap}° · 창 ${windowBbox ? windowBbox.map((v) => v.toFixed(2)).join(",") : "없음"} · ` +
      `해안 ${options.landMask ? path.relative(PROJECT_ROOT, options.landMask) : "없음 — 내륙국만 닫힌다!"}`,
  );

  const { byPolity, unassigned, conflicts, lostLabels, report } = assembleEraBorders(dump.features, polities, {
    snapTolerance: options.snap,
    windowBbox,
    coastRings,
  });

  const features = [];
  for (const [name, entry] of byPolity) {
    features.push({
      type: "Feature",
      properties: {
        name,
        names: entry.polity.names ?? {},
        admin_level: 2,
        start_date: entry.polity.start_date ?? "",
        end_date: entry.polity.end_date ?? "",
        faces: entry.faces.length,
        source: "ohm-face-assembly",
        coast: coastRings ? "modern-fused" : "none",
      },
      geometry: { type: "MultiPolygon", coordinates: facesToMultiPolygon(entry.faces) },
    });
  }
  features.sort((a, b) => a.properties.name.localeCompare(b.properties.name));

  const outDir = path.resolve(PROJECT_ROOT, options.out);
  mkdirSync(outDir, { recursive: true });
  const stem = path.basename(linesPath, ".geojson").replace(/^era-lines-/, "");
  const bordersPath = path.join(outDir, `era-borders-${stem}.geojson`);
  writeFileSync(bordersPath, JSON.stringify({
    type: "FeatureCollection",
    meta: {
      source: "OpenHistoricalMap (data: CC0 1.0 public-domain dedication)",
      attribution: "OpenHistoricalMap contributors",
      date,
      decdate: targetDec,
      stage: "F-2 face assembly",
      linesDump: path.relative(PROJECT_ROOT, linesPath),
      snapTolerance: options.snap,
      landMask: options.landMask ? path.relative(PROJECT_ROOT, options.landMask) : null,
    },
    features,
  }));

  const namedFaceless = polities
    .filter((p) => !byPolity.has(p.name))
    .map((p) => p.name);
  const reportPath = path.join(outDir, `era-borders-${stem}-report.json`);
  const inWindow = ([x, y]) => !windowBbox || (x >= windowBbox[0] && x <= windowBbox[2] && y >= windowBbox[1] && y <= windowBbox[3]);
  writeFileSync(reportPath, JSON.stringify({
    report,
    coastStats,
    centerOverridesApplied: overridden,
    conflicts: conflicts.map((c) => ({ names: c.names, area: c.face.area, bbox: bboxOfCoords(c.face.outer) })),
    // The diagnosis list: labels inside the window that landed in NO face —
    // either that region's walk failed or the center is a liar. Out-of-window
    // labels are expected misses, kept separate.
    lostLabelsInWindow: lostLabels.filter((p) => inWindow(p.center)).map((p) => ({ name: p.name, center: p.center })),
    unassignedFaces: unassigned.map((f) => ({ area: f.area, bbox: bboxOfCoords(f.outer) })).sort((a, b) => b.area - a.area),
    politiesWithoutFaces: namedFaceless,
  }, null, 1));

  console.log(
    `[ohm] 면 ${report.faces} = 배정 ${report.assignedFaces} + 미배정 ${report.unassignedFaces} + ` +
      `충돌 ${report.conflictFaces} · 이름 붙은 나라 ${report.politiesNamed} · ` +
      `면적 커버리지 ${(report.assignedShare * 100).toFixed(1)}%`,
  );
  console.log(
    `[ohm] 교차 노딩 ${report.crossingsSplit}(공선 ${report.collinearPairs}) · 용접 ${report.welds}(최대 ${report.weldMax.toFixed(3)}°) · ` +
      `해안 접합 ${report.edgeJoins}(분할 ${report.edgeSplits}) · 가지치기 ${report.prunedEdges}엣지 · ` +
      `이상 보행 ${report.anomalies} · 슬리버 제거 ${report.sliversDropped}`,
  );
  const lostInWindow = lostLabels.filter((p) => inWindow(p.center));
  if (lostInWindow.length > 0) {
    console.log(`[ohm] 창 내 라벨 유실 ${lostInWindow.length}건 (면 추적 실패 또는 중심 거짓말): ${lostInWindow.map((p) => p.name).join(", ")}`);
  }
  if (!options.landMask) console.log("[ohm] 해안 없음 — 바다에 면한 나라는 닫히지 못했다. regions-seed.geojson을 --land-mask로 주라");
  console.log(`[ohm] 면 없는 정치체 ${namedFaceless.length}개 (→ F-3에서 사다리 2·3단 폴백 후보) — 목록은 리포트에`);
  console.log(`[ohm] 기록:\n  ${path.relative(PROJECT_ROOT, bordersPath)}\n  ${path.relative(PROJECT_ROOT, reportPath)}`);
};

main();

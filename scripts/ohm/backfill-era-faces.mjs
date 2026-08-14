/*! Open Historia — source-ladder rung 3: the crude world fills what OHM cannot close © 2026 Nicholas Krol, MIT (see src/Editor/LICENSE). */
// Plan F, the medieval hybrid (design: PLAN-F-OHM.md, 2026-08-14).
//
// OHM's coverage before ~1500 is partial by nature — the 1444 assembly names
// 28 faces at 14.1% of the window, and the German core is absent from the
// data itself (settled 2026-08-12, both transports agreeing). The remedy is
// the source ladder's rung 3: aourednik/historical-basemaps, a per-year world
// GeoJSON at continent-scale accuracy (GPL-3.0; the repo itself warns it is
// not scholarly — good enough for a game skeleton, and says so in the report).
//
// This pass sits ON TOP of the assembler's output and changes none of it:
//
//   node scripts/ohm/backfill-era-faces.mjs scripts/ohm/out/era-borders-1444-11-11-z4.geojson \
//        --world scripts/ohm/data/world_1400.geojson [--window -15,30,50,72] [--zoom 4] [--out DIR]
//
//   1. rung-1 faces pass through UNTOUCHED, byte for byte.
//   2. world polygons are clipped to the same frame rectangle the assembler
//      closes against (frameOf(window, zoom) — if the frames differed, the
//      two rungs would not be speaking about the same map).
//   3. a world polygon mostly covered by rung-1 faces is SKIPPED (rung 1 is
//      the better source wherever it exists); coverage is measured by the
//      same plastic-number lattice the sea guard uses, never by boolean
//      algebra — continent-scale difference() is the exact trap the coastal
//      union died in (2026-08-09).
//   4. what survives is appended with `rung: 3` and its NAME; the graft's
//      region-level precedence rule does the rest (a region rung 1 touches
//      ignores rung 3 entirely).
//
// Every polygon lands in the report exactly once: added, or skipped with the
// measured coverage that skipped it. No silent caps.

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";
import polygonClipping from "polygon-clipping";
import { frameOf } from "./fetch-era-boundaries.mjs";
import { decimateRing } from "./lib/assembleFaces.mjs";

const { intersection } = polygonClipping;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const usage = (message) => {
  if (message) console.error(`[ohm] ${message}\n`);
  console.error(
    "사용법: node scripts/ohm/backfill-era-faces.mjs <era-borders.geojson>" +
      " --world <world_YYYY.geojson> [--window W,S,E,N] [--zoom 4]" +
      " [--coverage-skip 0.9] [--exclude \"이름,이름\"] [--out DIR]",
  );
  process.exit(1);
};

const parseArgs = (argv) => {
  const options = {
    faces: null,
    world: null,
    window: [-15, 30, 50, 72], // the fleet's Europe window — printed, overridable
    zoom: 4,
    // Calibrated on the first real run (1444 + world_1400, 2026-08-14): world
    // polygons a real rung-1 face covers measure 93–100% (France 100, Sicily 98,
    // Portugal 97, Brittany/Navarre 97, Castile/Scotland/England 95, Granada 93);
    // partial-but-real faces leave their crude twin at 57–85% (HRE 57 — its
    // uncovered 43% IS the German core this hybrid exists for — Novgorod 78,
    // Siberians 82, Cyprus 85). 0.9 splits the two populations cleanly, and
    // over-adding is harmless by construction: the graft's region-level rule
    // suppresses rung 3 wherever any rung-1 face touches.
    coverageSkip: 0.9,
    exclude: [], // rung-1 face names a spec will excludeFaces — they must not count as cover (else their world twin is skipped and the excluded region has no rung-3 filler: a hole)
    out: null,
  };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--world") options.world = String(argv[(i += 1)] ?? "");
    else if (arg === "--window") options.window = String(argv[(i += 1)] ?? "").split(",").map(Number);
    else if (arg === "--zoom") options.zoom = Number(argv[(i += 1)]);
    else if (arg === "--coverage-skip") options.coverageSkip = Number(argv[(i += 1)]);
    else if (arg === "--exclude") options.exclude = String(argv[(i += 1)] ?? "").split(",").map((s) => s.trim()).filter(Boolean);
    else if (arg === "--out") options.out = String(argv[(i += 1)] ?? "");
    else if (!arg.startsWith("--") && options.faces === null) options.faces = arg;
    else usage(`알 수 없는 인자: ${arg}`);
  }
  if (!options.faces) usage("조립 산출물(era-borders) 경로가 없다");
  if (!options.world) usage("--world가 없다 (rung-3 원천 없이 백필할 것이 없다)");
  if (options.window.length !== 4 || options.window.some((n) => !Number.isFinite(n))) usage("--window는 W,S,E,N 네 수");
  if (!Number.isFinite(options.zoom)) usage("--zoom은 수");
  if (!(options.coverageSkip > 0 && options.coverageSkip <= 1)) usage("--coverage-skip은 (0,1]");
  return options;
};

// ── geometry helpers (pure, exported for the pin suite) ─────────────────────

export const toMp = (geometry) => {
  if (!geometry) return null;
  if (geometry.type === "Polygon") return [geometry.coordinates];
  if (geometry.type === "MultiPolygon") return geometry.coordinates;
  return null;
};

const pointInRing = ([px, py], ring) => {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i, i += 1) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    if (yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
};

export const pointInMp = (pt, mp) => {
  for (const poly of mp ?? []) {
    if (pointInRing(pt, poly[0]) && !poly.slice(1).some((h) => pointInRing(pt, h))) return true;
  }
  return false;
};

const mpBbox = (mp) => {
  let w = Infinity; let s = Infinity; let e = -Infinity; let n = -Infinity;
  for (const poly of mp) for (const ring of poly) for (const [x, y] of ring) {
    if (x < w) w = x;
    if (y < s) s = y;
    if (x > e) e = x;
    if (y > n) n = y;
  }
  return [w, s, e, n];
};

// The sea guard's lattice (assembleFaces.faceLandFraction), reused verbatim:
// the plastic-number sequence covers the bbox evenly without a grid's aliasing
// and without Math.random (resume determinism). Points outside the polygon are
// discarded until `wanted` interior samples exist (or the attempt budget ends —
// degenerate slivers get whatever samples they yielded, counted).
const PHI2 = { x: 0.7548776662466927, y: 0.5698402909980532 };
export const coverageInside = (mp, testers, wanted = 60) => {
  const [w, s, e, n] = mpBbox(mp);
  const spanX = e - w;
  const spanY = n - s;
  if (!(spanX > 0) || !(spanY > 0)) return { coverage: 0, samples: 0 };
  let inside = 0;
  let samples = 0;
  for (let k = 1; samples < wanted && k <= wanted * 40; k += 1) {
    const pt = [w + ((k * PHI2.x) % 1) * spanX, s + ((k * PHI2.y) % 1) * spanY];
    if (!pointInMp(pt, mp)) continue;
    samples += 1;
    if (testers.some((t) => pointInMp(pt, t))) inside += 1;
  }
  return { coverage: samples > 0 ? inside / samples : 0, samples };
};

// Radial decimation WITH collapse: a ring that thins below a closable
// triangle is a micro fragment and must DIE counted, not survive protected.
// The assembler's decimateRing deliberately returns the original ring when
// the result would drop under 4 points (a coast ring must never unravel);
// here the opposite is wanted — world-file noise at continent scale has no
// business becoming a face — so this is a local pass, same predicate, other
// collapse policy (the graft loader made the same choice, eraGeometry.mjs).
const decimateRingCollapsing = (ring, tol) => {
  const dec = decimateRing(ring, tol);
  if (dec !== ring) return dec; // thinned and still closable
  // decimateRing protected it — measure whether it is genuinely micro.
  let [w, s, e, n] = [Infinity, Infinity, -Infinity, -Infinity];
  for (const [x, y] of ring) {
    if (x < w) w = x;
    if (y < s) s = y;
    if (x > e) e = x;
    if (y > n) n = y;
  }
  return (e - w) < tol && (n - s) < tol ? [] : ring;
};

export const decimateMp = (mp, tol = 0.01) => {
  const out = [];
  for (const poly of mp) {
    const rings = [];
    let outerDead = false;
    for (let r = 0; r < poly.length; r += 1) {
      if (outerDead) continue;
      const dec = decimateRingCollapsing(poly[r], tol);
      if (dec.length < 4) {
        if (r === 0) outerDead = true;
        continue;
      }
      rings.push(dec);
    }
    if (rings.length > 0) out.push(rings);
  }
  return out;
};

// ── the pass ────────────────────────────────────────────────────────────────

export const backfillEraFaces = (facesFc, worldFc, { window, zoom, coverageSkip = 0.9, exclude = [] } = {}) => {
  const frame = frameOf(window, zoom);
  const frameMp = [[[[frame[0], frame[1]], [frame[2], frame[1]], [frame[2], frame[3]], [frame[0], frame[3]], [frame[0], frame[1]]]]];
  // Faces a spec will excludeFaces are NOT coverage testers: the graft drops
  // them at load, so whatever they cover is uncovered at build time — their
  // world twin must be free to backfill it. They still pass through to the
  // output untouched (the pass changes no rung-1 bytes, excluded or not).
  const excludeSet = new Set(exclude);
  const excludeMatched = new Set();
  const rung1 = [];
  for (const f of facesFc.features ?? []) {
    const faceName = String(f.properties?.name ?? f.properties?.NAME ?? "").trim();
    if (excludeSet.has(faceName)) {
      excludeMatched.add(faceName);
      continue;
    }
    const mp = toMp(f.geometry);
    if (mp) rung1.push(mp);
  }
  // an exclude name that matches no face is a typo about to become a silent
  // no-op — surfaced here, carried in the return, printed by the CLI
  const excludeUnmatched = exclude.filter((n) => !excludeMatched.has(n));

  const added = [];
  const skipped = [];
  for (const feature of worldFc.features ?? []) {
    const name = String(feature.properties?.NAME ?? feature.properties?.name ?? "").trim();
    const raw = toMp(feature.geometry);
    if (!raw || !name) {
      skipped.push({ name: name || "(무명)", why: name ? "면 아닌 지오메트리" : "이름 없음" });
      continue;
    }
    let clipped;
    try {
      clipped = intersection(raw, frameMp);
    } catch (error) {
      skipped.push({ name, why: `프레임 클립 실패: ${String(error?.message ?? error)}` });
      continue;
    }
    if (!clipped || clipped.length === 0) {
      skipped.push({ name, why: "창 밖" });
      continue;
    }
    const mp = decimateMp(clipped);
    if (mp.length === 0) {
      skipped.push({ name, why: "데시메이션 후 잔여 없음(마이크로 조각)" });
      continue;
    }
    const { coverage, samples } = coverageInside(mp, rung1);
    if (coverage >= coverageSkip) {
      skipped.push({ name, why: `rung-1이 이미 담당 (커버 ${(coverage * 100).toFixed(0)}%, 표본 ${samples})` });
      continue;
    }
    added.push({
      type: "Feature",
      geometry: mp.length === 1 ? { type: "Polygon", coordinates: mp[0] } : { type: "MultiPolygon", coordinates: mp },
      properties: {
        name,
        rung: 3,
        source: "historical-basemaps",
        rung1Coverage: Number(coverage.toFixed(3)),
      },
    });
  }
  return { added, skipped, frame, excludeUnmatched };
};

// ── CLI ─────────────────────────────────────────────────────────────────────

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const options = parseArgs(process.argv.slice(2));
  const facesFc = JSON.parse(readFileSync(options.faces, "utf8"));
  const worldFc = JSON.parse(readFileSync(options.world, "utf8"));
  const { added, skipped, frame, excludeUnmatched } = backfillEraFaces(facesFc, worldFc, {
    window: options.window,
    zoom: options.zoom,
    coverageSkip: options.coverageSkip,
    exclude: options.exclude,
  });

  const worldName = path.basename(options.world, ".geojson");
  const outDir = options.out ? path.resolve(options.out) : path.dirname(path.resolve(options.faces));
  mkdirSync(outDir, { recursive: true });
  const base = path.basename(options.faces, ".geojson");
  const outPath = path.join(outDir, `${base}-hybrid.geojson`);
  const reportPath = path.join(outDir, `${base}-hybrid-report.json`);

  const merged = {
    ...facesFc,
    meta: {
      ...(facesFc.meta ?? {}),
      hybrid: {
        world: worldName,
        worldLicense: "GPL-3.0 (aourednik/historical-basemaps — 대륙 스케일, 학술 아님)",
        frame,
        coverageSkip: options.coverageSkip,
        excludedFaces: options.exclude,
        rung3Added: added.length,
        rung3Skipped: skipped.length,
      },
    },
    features: [...(facesFc.features ?? []), ...added],
  };
  writeFileSync(outPath, JSON.stringify(merged));
  writeFileSync(reportPath, JSON.stringify({ added: added.map((f) => f.properties), skipped, excludedFaces: options.exclude, excludeUnmatched, frame }, null, 1));

  console.log(`[ohm] rung-3 백필: ${options.world} → rung-1 면 ${facesFc.features?.length ?? 0} 위에 추가 ${added.length} · 스킵 ${skipped.length}`);
  if (options.exclude.length > 0) console.log(`[ohm]   커버 판정 제외(스펙 excludeFaces 동반 전제): ${options.exclude.join(", ")}`);
  if (excludeUnmatched.length > 0) console.warn(`[ohm]   경고: --exclude 이름이 어떤 면과도 일치하지 않음(오타?): ${excludeUnmatched.join(", ")}`);
  const whyCounts = skipped.reduce((acc, x) => ({ ...acc, [x.why.split(" (")[0]]: (acc[x.why.split(" (")[0]] ?? 0) + 1 }), {});
  console.log(`[ohm]   스킵 사유: ${Object.entries(whyCounts).map(([k, v]) => `${k} ${v}`).join(" · ")}`);
  console.log(`[ohm]   추가 목록: ${added.map((f) => f.properties.name).join(", ") || "(없음)"}`);
  console.log(`[ohm] 기록:\n  ${outPath}\n  ${reportPath}`);
}

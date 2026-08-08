/*!
 * Open Historia Map Editor
 * Copyright (c) 2026 Nicholas Krol - MIT License (see src/Editor/LICENSE).
 */

// Plan F, stage F-1 — OHM era-border extractor, the fetching half.
//
// Dumps the raw material for one historical date: every boundary LINE and
// polity CENTROID that existed on date D, filtered out of OpenHistoricalMap's
// vector tiles, as two inspectable GeoJSON files. No polygonisation yet — that
// is stage F-2; this stage exists so the assembly can be calibrated against
// real, eyeballable data first.
//
//   node scripts/ohm/extract-era-borders.mjs 1939-09-01
//   node scripts/ohm/extract-era-borders.mjs 1939-09-01 --zoom 3
//   node scripts/ohm/extract-era-borders.mjs 1444-01-01 --bbox 100,20,145,50
//   node scripts/ohm/extract-era-borders.mjs 1939-09-01 --max-admin-level 4
//
//   flags: --zoom N (default 2)          --bbox lonW,latS,lonE,latN (default world)
//          --out DIR (default scripts/ohm/out)
//          --max-admin-level N (default 2 = national borders)
//          --include-maritime            (sea borders, normally dropped)
//
// WHERE THIS RUNS. On a machine that may fetch tiles — the player's PC or a
// dev clone. The cloud (Cowork) session must NOT run this: its environment
// forbids programmatic fetching, by policy. It verifies the pure half offline
// (tests/ohm.mjs) instead.
//
// POLITENESS. OHM is a volunteer project serving the same tiles the game
// already streams. Fetches are sequential with a fixed delay, carry an
// identifying User-Agent, and a run is refused outright if it would ask for
// more than MAX_TILES_PER_RUN tiles — narrow the bbox or lower the zoom
// instead. z2 world = 16 tiles; the refusal message does the arithmetic.
//
// OUTPUT. era-lines-<date>-z<zoom>.geojson + era-centroids-<date>-z<zoom>
// .geojson in --out (zoom is in the name so dumps at different zooms never
// overwrite each other). Features are clipped to their tile's exact bounds
// (buffer trimmed), fragments are NOT stitched across seams (meta.stitched:
// false), and coordinates are rounded to 5 decimals so the F-2 weld can
// dissolve seams exactly as scripts/extract-regions.mjs does. Every dropped
// feature is tallied by reason and printed — nothing vanishes silently.

import { mkdirSync, writeFileSync } from "fs";
import { gunzipSync } from "zlib";
import { fileURLToPath } from "url";
import path from "path";
import * as vtmod from "@mapbox/vector-tile";
import * as pbfmod from "pbf";
import {
  WEB_MERCATOR_MAX_LAT,
  bboxToTileRange,
  clipPartToBbox,
  eraCollection,
  eraFeature,
  featureFilter,
  isoToDecdate,
  tileToBbox,
} from "./lib/eraBorders.mjs";

const VectorTile = vtmod.VectorTile ?? vtmod.default?.VectorTile;
const Pbf = pbfmod.default ?? pbfmod;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, "..", "..");

const TILE_URL = (z, x, y) => `https://vtiles.openhistoricalmap.org/maps/ohm/${z}/${x}/${y}.pbf`;
const USER_AGENT = "open-historia-era-extractor/0.1 (personal project; Plan F)";
const TILE_DELAY_MS = 150;
const MAX_TILES_PER_RUN = 1024;
const WORLD_BBOX = [-180, -WEB_MERCATOR_MAX_LAT, 180, WEB_MERCATOR_MAX_LAT];

// The two OHM layers this stage reads: boundary lines (the geometry) and
// polity centroids (the names F-2 will assign faces with). requireName only
// on centroids — a nameless centroid can never label a face.
const LAYERS = [
  { role: "lines", layerName: "land_ohm_lines", requireName: false },
  { role: "centroids", layerName: "land_ohm_centroids", requireName: true },
];

const usage = (message) => {
  if (message) console.error(`[ohm] ${message}\n`);
  console.error(
    "사용법: node scripts/ohm/extract-era-borders.mjs <YYYY-MM-DD>" +
      " [--zoom 2] [--bbox lonW,latS,lonE,latN] [--out DIR]" +
      " [--max-admin-level 2] [--include-maritime]",
  );
  process.exit(1);
};

const parseArgs = (argv) => {
  const options = {
    date: null,
    zoom: 2,
    bbox: null,
    out: path.join("scripts", "ohm", "out"),
    maxAdminLevel: 2,
    includeMaritime: false,
  };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--zoom") options.zoom = Number(argv[(i += 1)]);
    else if (arg === "--bbox") options.bbox = String(argv[(i += 1)] ?? "").split(",");
    else if (arg === "--out") options.out = String(argv[(i += 1)] ?? "");
    else if (arg === "--max-admin-level") options.maxAdminLevel = Number(argv[(i += 1)]);
    else if (arg === "--include-maritime") options.includeMaritime = true;
    else if (!arg.startsWith("--") && options.date === null) options.date = arg;
    else usage(`알 수 없는 인자: ${arg}`);
  }
  if (!options.date) usage("날짜가 없다");
  if (!Number.isInteger(options.zoom) || options.zoom < 0 || options.zoom > 8) {
    usage(`--zoom은 0–8 정수여야 한다 (받은 값: ${options.zoom})`);
  }
  if (!Number.isInteger(options.maxAdminLevel) || options.maxAdminLevel < 1) {
    usage(`--max-admin-level은 1 이상의 정수여야 한다 (받은 값: ${options.maxAdminLevel})`);
  }
  return options;
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Clip a decoded feature to its tile's EXACT bounds. Measured (z4m rerun,
// 2026-08-09): the tiler ships some geometries with their MVT buffer, planting
// line endpoints exactly tileWidth/16 past the seam — which duplicates
// geometry across neighbouring tiles and fakes dangles. Trimming to the tile
// keeps every seam vertex shared and byte-identical after rounding, which is
// what lets stage F-2 weld tiles back together. Returns null when nothing of
// the feature lies inside the tile proper (buffer-only content).
const clipToTile = (geometry, bbox) => {
  if (!geometry) return null;
  if (geometry.type === "Point") {
    const [px, py] = geometry.coordinates;
    const [w, s, e, n] = bbox;
    return px >= w && px <= e && py >= s && py <= n ? geometry : null;
  }
  if (geometry.type !== "LineString" && geometry.type !== "MultiLineString") return geometry;
  const parts = geometry.type === "LineString" ? [geometry.coordinates] : geometry.coordinates;
  const kept = [];
  for (const part of parts) kept.push(...clipPartToBbox(part, bbox));
  if (kept.length === 0) return null;
  return kept.length === 1
    ? { type: "LineString", coordinates: kept[0] }
    : { type: "MultiLineString", coordinates: kept };
};

const fetchTile = async (z, x, y) => {
  const url = TILE_URL(z, x, y);
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const res = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
      // An absent tile (open ocean at low zoom) is data, not an error.
      if (res.status === 404 || res.status === 204) return null;
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      let bytes = new Uint8Array(await res.arrayBuffer());
      if (bytes.byteLength === 0) return null;
      // fetch un-gzips when the server says Content-Encoding; some tile
      // servers ship gzip bytes without saying so — the magic number tells.
      if (bytes[0] === 0x1f && bytes[1] === 0x8b) bytes = new Uint8Array(gunzipSync(bytes));
      return bytes;
    } catch (err) {
      if (attempt === 1) throw new Error(`${url} — ${err.message}`);
      await sleep(1000);
    }
  }
  return null;
};

const main = async () => {
  const options = parseArgs(process.argv.slice(2));
  const targetDec = isoToDecdate(options.date);
  if (targetDec === null) usage(`날짜를 읽을 수 없다: ${options.date} (YYYY-MM-DD)`);

  let range;
  try {
    range = bboxToTileRange(options.bbox ?? WORLD_BBOX, options.zoom);
  } catch (err) {
    usage(err.message);
  }
  if (range.count > MAX_TILES_PER_RUN) {
    usage(
      `이 실행은 타일 ${range.count}장을 요청한다 (z${options.zoom}, ` +
        `x ${range.xMin}–${range.xMax} × y ${range.yMin}–${range.yMax}) — ` +
        `상한 ${MAX_TILES_PER_RUN}장. OHM은 자원봉사 서버다: --zoom을 낮추거나 --bbox를 좁혀라`,
    );
  }

  console.log(
    `[ohm] ${options.date} (decdate ${targetDec.toFixed(4)}) · z${options.zoom} · ` +
      `타일 ${range.count}장 · admin_level ≤ ${options.maxAdminLevel}` +
      `${options.includeMaritime ? " · maritime 포함" : ""}`,
  );

  const kept = { lines: [], centroids: [] };
  const dropReasons = { lines: new Map(), centroids: new Map() };
  const seen = { lines: 0, centroids: 0 };
  let fetched = 0;
  let emptyTiles = 0;

  for (let x = range.xMin; x <= range.xMax; x += 1) {
    for (let y = range.yMin; y <= range.yMax; y += 1) {
      const bytes = await fetchTile(options.zoom, x, y);
      fetched += 1;
      if (!bytes) {
        emptyTiles += 1;
      } else {
        const vt = new VectorTile(new Pbf(bytes));
        const tileBounds = tileToBbox(options.zoom, x, y);
        for (const { role, layerName, requireName } of LAYERS) {
          const layer = vt.layers[layerName];
          if (!layer) continue;
          for (let i = 0; i < layer.length; i += 1) {
            const feature = layer.feature(i);
            seen[role] += 1;
            const verdict = featureFilter(feature.properties, targetDec, {
              maxAdminLevel: options.maxAdminLevel,
              includeMaritime: options.includeMaritime,
              requireName,
            });
            if (!verdict.keep) {
              dropReasons[role].set(verdict.why, (dropReasons[role].get(verdict.why) ?? 0) + 1);
              continue;
            }
            const gj = feature.toGeoJSON(x, y, options.zoom);
            const clipped = clipToTile(gj.geometry, tileBounds);
            if (!clipped) {
              const why = "타일 버퍼 전용(이웃 타일이 본체 보유)";
              dropReasons[role].set(why, (dropReasons[role].get(why) ?? 0) + 1);
              continue;
            }
            kept[role].push(eraFeature(clipped, feature.properties, feature.id));
          }
        }
      }
      process.stdout.write(
        `\r[ohm] 타일 ${fetched}/${range.count} (${x},${y}) · ` +
          `선 ${kept.lines.length}/${seen.lines} · 중심점 ${kept.centroids.length}/${seen.centroids}`,
      );
      if (fetched < range.count) await sleep(TILE_DELAY_MS);
    }
  }
  process.stdout.write("\n");

  const outDir = path.resolve(PROJECT_ROOT, options.out);
  mkdirSync(outDir, { recursive: true });
  const meta = {
    date: options.date,
    decdate: targetDec,
    zoom: options.zoom,
    bbox: options.bbox ? options.bbox.map(Number) : WORLD_BBOX,
    maxAdminLevel: options.maxAdminLevel,
    includeMaritime: options.includeMaritime,
    clippedToTileBounds: true,
    stitched: false,
  };
  const written = [];
  for (const { role, layerName } of LAYERS) {
    // Zoom in the filename: a z2 world dump and a z4 window dump of the same
    // date must never overwrite each other (it happened live, 2026-08-09).
    const file = path.join(outDir, `era-${role}-${options.date}-z${options.zoom}.geojson`);
    const body = JSON.stringify(eraCollection(kept[role], { ...meta, layer: layerName }));
    writeFileSync(file, body);
    written.push(`  ${path.relative(PROJECT_ROOT, file)} · ${kept[role].length} features · ${(body.length / 1e6).toFixed(1)} MB`);
  }

  console.log(`[ohm] 빈 타일 ${emptyTiles}장. 기록:`);
  for (const line of written) console.log(line);
  for (const { role } of LAYERS) {
    const reasons = [...dropReasons[role].entries()].sort((a, b) => b[1] - a[1]);
    if (reasons.length === 0) continue;
    console.log(`[ohm] ${role} 드롭 사유 (합 ${seen[role] - kept[role].length}):`);
    for (const [why, count] of reasons) console.log(`    ${count} × ${why}`);
  }
  console.log(
    "[ohm] 이 덤프는 조립 전 원자재다 — 타일 이음매 미봉합(meta.stitched: false). " +
      "다음 단계 F-2가 폴리곤화·정치체 배정·스티칭을 맡는다 (docs/PLAN-F-OHM.md).",
  );
};

main().catch((err) => {
  console.error("[ohm] FAILED:", err);
  process.exit(1);
});

/*!
 * Open Historia Map Editor
 * Copyright (c) 2026 Nicholas Krol - MIT License (see src/Editor/LICENSE).
 */

// One-time builder for scripts/presets/data/coastline-reference.json — the
// "where is water, really" reference the coast filter judges against (긁힘
// species 3, 2026-08-19: state borders, Nepal's outline and dead DE/AT
// frontiers were shipping as kind:"coast" because "no neighbouring region"
// does not mean "sea"; see ownerBorders.mjs).
//
//   node scripts/presets/build-coastline-reference.mjs <ne_10m_land.json> <ne_10m_lakes.json>
//
// Inputs are Natural Earth 10m physical layers (PUBLIC DOMAIN — this is open
// data, not the Omniatlas/GeaCron class 절대원칙 8 forbids). They are NOT
// committed (25MB combined); only this derivative is, and this script is what
// makes the derivative reproducible from a fresh download.
//
// The derivative is a VERTEX CLOUD, not geometry: every land-boundary vertex,
// plus the ring vertices of lakes large enough to keep their shorelines under
// the Caspian rule (bbox diagonal ≥ 0.5° — Ladoga, Baikal, the Great Lakes;
// puddles are excluded so they cannot vouch for a scratch near them). Points
// are snapped to a 0.05° grid and deduplicated: the filter's question is "is
// there real water within 0.25°", so 0.05° resolution leaves 5x margin,
// and snapping is what makes the file small enough to commit.

import { readFileSync, writeFileSync, mkdirSync } from "fs";
import path from "path";
import url from "url";

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const OUT_PATH = path.join(__dirname, "data", "coastline-reference.json");
const GRID = 0.05;
const LAKE_MIN_DIAG = 0.5;

const [landPath, lakesPath] = process.argv.slice(2);
if (!landPath || !lakesPath) {
  console.error("usage: node build-coastline-reference.mjs <ne_10m_land.json> <ne_10m_lakes.json>");
  process.exit(1);
}

const ringsOf = (geometry) => {
  if (geometry?.type === "Polygon") return geometry.coordinates ?? [];
  if (geometry?.type === "MultiPolygon") return (geometry.coordinates ?? []).flat();
  return [];
};

const snapped = new Set();
const addRing = (ring) => {
  for (const [x, y] of ring) {
    snapped.add(`${Math.round(x / GRID)},${Math.round(y / GRID)}`);
  }
};

const land = JSON.parse(readFileSync(landPath, "utf8"));
for (const feature of land.features ?? []) for (const ring of ringsOf(feature.geometry)) addRing(ring);
const landCount = snapped.size;

const lakes = JSON.parse(readFileSync(lakesPath, "utf8"));
let lakesKept = 0;
for (const feature of lakes.features ?? []) {
  const rings = ringsOf(feature.geometry);
  let minX = Infinity; let minY = Infinity; let maxX = -Infinity; let maxY = -Infinity;
  for (const ring of rings) {
    for (const [x, y] of ring) {
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
    }
  }
  if (Math.hypot(maxX - minX, maxY - minY) < LAKE_MIN_DIAG) continue;
  lakesKept += 1;
  for (const ring of rings) addRing(ring);
}

const points = [...snapped].map((key) => {
  const cut = key.indexOf(",");
  return [Number(key.slice(0, cut)), Number(key.slice(cut + 1))];
});
mkdirSync(path.dirname(OUT_PATH), { recursive: true });
writeFileSync(OUT_PATH, `${JSON.stringify({
  source: "Natural Earth 10m land + lakes (public domain), snapped",
  grid: GRID,
  lakeMinDiag: LAKE_MIN_DIAG,
  // Grid-cell integers: multiply by `grid` to get degrees.
  points,
})}\n`, "utf8");
console.log(`[coastline-reference] 육지 경계 정점 ${landCount} · 호수 ${lakesKept}개 포함 → 격자점 ${points.length} · ${(JSON.stringify(points).length / 1e6).toFixed(2)}MB → ${OUT_PATH}`);

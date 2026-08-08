/*!
 * Open Historia Map Editor
 * Copyright (c) 2026 Nicholas Krol - MIT License (see src/Editor/LICENSE).
 */

// Plan F — human-eye QA for an assembly run. Draws the named polity faces in
// colour (Korean names when OHM carries them) over the raw admin_2 skeleton,
// Web-Mercator, one self-contained SVG. This is the F-4 review tool: open the
// picture, compare against Omniatlas/GeaCron BY EYE ONLY (links, no data),
// and read the unnamed skeleton as the honest gap list.
//
//   node scripts/ohm/render-era-preview.mjs scripts/ohm/out/era-borders-<...>.geojson \
//        scripts/ohm/out/era-lines-<...>.geojson [--bbox -10,35,45,71] [--out preview.svg]

import { readFileSync, writeFileSync } from "fs";

const args = process.argv.slice(2);
const positional = [];
let bbox = [-10, 35, 45, 71];
let outPath = "scripts/ohm/out/era-preview.svg";
for (let i = 0; i < args.length; i += 1) {
  if (args[i] === "--bbox") bbox = String(args[(i += 1)]).split(",").map(Number);
  else if (args[i] === "--out") outPath = String(args[(i += 1)]);
  else positional.push(args[i]);
}
const [bordersPath, linesPath] = positional;
if (!bordersPath) {
  console.error("사용법: node scripts/ohm/render-era-preview.mjs <era-borders.geojson> [era-lines.geojson] [--bbox W,S,E,N] [--out FILE.svg]");
  process.exit(1);
}
const borders = JSON.parse(readFileSync(bordersPath, "utf8"));
const lines = linesPath ? JSON.parse(readFileSync(linesPath, "utf8")) : null;

const [WX, SY, EX, NY] = bbox;
const mercY = (lat) => Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360));
const Y0 = mercY(SY);
const Y1 = mercY(NY);
const WIDTH = 1500;
const HEIGHT = Math.round((WIDTH * (Y1 - Y0)) / ((EX - WX) * (Math.PI / 180)));
const px = (lng) => ((lng - WX) / (EX - WX)) * WIDTH;
const py = (lat) => HEIGHT - ((mercY(lat) - Y0) / (Y1 - Y0)) * HEIGHT;

const colorOf = (name) => {
  let h = 0;
  for (const ch of name) h = (h * 31 + ch.codePointAt(0)) % 0xffffffff;
  return `hsl(${h % 360} ${55 + (h % 25)}% ${52 + ((h >> 3) % 18)}%)`;
};
const ringPath = (ring) => {
  let d = "";
  for (let i = 0; i < ring.length; i += 1) {
    d += `${i === 0 ? "M" : "L"}${px(ring[i][0]).toFixed(1)} ${py(ring[i][1]).toFixed(1)}`;
  }
  return `${d}Z`;
};

const parts = [];
parts.push(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${WIDTH} ${HEIGHT}" font-family="sans-serif">`);
parts.push(`<rect width="${WIDTH}" height="${HEIGHT}" fill="#dbe9f4"/>`);
const labels = [];
for (const f of borders.features) {
  const name = f.properties.names?.["name:ko"] ?? f.properties.name;
  let d = "";
  let bestArea = 0;
  let bestBbox = null;
  for (const poly of f.geometry.coordinates) {
    for (const ring of poly) d += ringPath(ring);
    const outer = poly[0];
    const bb = [Infinity, Infinity, -Infinity, -Infinity];
    for (const [x, y] of outer) {
      if (x < bb[0]) bb[0] = x;
      if (y < bb[1]) bb[1] = y;
      if (x > bb[2]) bb[2] = x;
      if (y > bb[3]) bb[3] = y;
    }
    const area = (bb[2] - bb[0]) * (bb[3] - bb[1]);
    if (area > bestArea) {
      bestArea = area;
      bestBbox = bb;
    }
  }
  parts.push(`<path d="${d}" fill="${colorOf(f.properties.name)}" fill-opacity="0.72" stroke="#ffffff" stroke-width="1" fill-rule="evenodd"/>`);
  if (bestBbox && bestArea > 0.8) {
    labels.push({ name, x: (bestBbox[0] + bestBbox[2]) / 2, y: (bestBbox[1] + bestBbox[3]) / 2, size: Math.max(11, Math.min(24, Math.sqrt(bestArea) * 4)) });
  }
}
if (lines) {
  let lineD = "";
  for (const f of lines.features) {
    if (Number(f.properties.admin_level) !== 2) continue;
    const geoms = f.geometry.type === "LineString" ? [f.geometry.coordinates] : f.geometry.coordinates;
    for (const part of geoms) {
      for (let i = 0; i < part.length; i += 1) {
        lineD += `${i === 0 ? "M" : "L"}${px(part[i][0]).toFixed(1)} ${py(part[i][1]).toFixed(1)}`;
      }
    }
  }
  parts.push(`<path d="${lineD}" fill="none" stroke="#5a4632" stroke-width="0.7" stroke-opacity="0.55"/>`);
}
for (const l of labels) {
  parts.push(`<text x="${px(l.x).toFixed(0)}" y="${py(l.y).toFixed(0)}" font-size="${l.size.toFixed(0)}" text-anchor="middle" fill="#1c1c1c" stroke="#ffffff" stroke-width="2.5" paint-order="stroke" font-weight="600">${l.name}</text>`);
}
const date = borders.meta?.date ?? "?";
parts.push(`<text x="16" y="30" font-size="21" fill="#333" font-weight="700">${date} — OHM 시대 국경 조립 미리보기</text>`);
parts.push(`<text x="16" y="52" font-size="13" fill="#555">채색 = 자동 배정 ${borders.features.length}개 정치체 · 갈색 선 = admin_2 골격(무배정 포함) · 데이터: OpenHistoricalMap(CC0)</text>`);
parts.push("</svg>");
writeFileSync(outPath, parts.join("\n"));
console.log(`[ohm] ${outPath} · ${WIDTH}x${HEIGHT} · 정치체 ${borders.features.length} · 라벨 ${labels.length}`);

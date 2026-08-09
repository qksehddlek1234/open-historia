/*! Open Historia — merge GADM level-2 subdivisions into the region seed © 2026 Nicholas Krol, MIT (see src/Editor/LICENSE). */
// WHY THIS EXISTS.
//
// The player asked why Britain is four provinces. It is four because that is
// all the shipped geometry has: regions-seed.geojson carries GBR.1_1 (England,
// whose GADM NAME_1 is literally "NA"), Scotland, Wales and Northern Ireland —
// GADM level 1. Counties are level 2, and the seed carries level-2 rows for
// only six countries (Colombia, Uruguay, Isle of Man, Ghana, Åland, Djibouti),
// none of them Britain.
//
// Geographic data is FETCHED ON THE USER'S OWN MACHINE in this project — the
// same standing rule that governs the OpenHistoricalMap pipeline. So this does
// not download anything. You put a GADM level-2 file next to it and it merges,
// reporting every row it takes and every row it refuses.
//
// HOW TO USE
//   1. Download the level-2 GeoJSON for a country from gadm.org
//      (e.g. gadm41_GBR_2.json — "GeoJSON" under Country → Level 2).
//   2. Put it anywhere and point this at it:
//
//        node scripts/regions/merge-level2.mjs path/to/gadm41_GBR_2.json --replace GBR
//        node scripts/regions/merge-level2.mjs path/to/gadm41_GBR_2.json --replace GBR --write
//
//      --replace GBR drops that country's existing level-1 rows, so England
//      becomes its counties instead of sitting underneath them. Omit it to ADD
//      the level-2 rows alongside what is already there (rarely what you want:
//      two layers of geometry will both render).
//   3. Rebuild the presets: node scripts/presets/rebuild-all.mjs
//
// The map draws from the seed, so new rows appear immediately and take their
// owner from the era-sovereignty fallback. A preset that wants to assign an
// individual county by id additionally needs that id in regions.pmtiles (the
// validation catalog) — the build will say so plainly rather than guess.
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import path from "node:path";
import url from "node:url";

const ROOT = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), "..", "..");
const SEED = path.join(ROOT, "public", "assets", "regions-seed.geojson");

const argv = process.argv.slice(2);
const sourcePath = argv.find((arg) => !arg.startsWith("--"));
const WRITE = argv.includes("--write");
const replaceAt = argv.indexOf("--replace");
const replaceCountry = replaceAt >= 0 ? String(argv[replaceAt + 1] ?? "").toUpperCase() : "";

if (!sourcePath) {
  console.error("usage: node scripts/regions/merge-level2.mjs <gadm-level2.json> [--replace GID_0] [--write]");
  process.exit(1);
}
const resolved = path.resolve(process.cwd(), sourcePath);
if (!existsSync(resolved)) {
  console.error(`not found: ${resolved}`);
  process.exit(1);
}

const seed = JSON.parse(readFileSync(SEED, "utf8"));
const source = JSON.parse(readFileSync(resolved, "utf8"));
const incoming = source.features ?? [];
if (incoming.length === 0) {
  console.error("that file has no features — is it a GADM GeoJSON?");
  process.exit(1);
}

// The seed's own row shape, taken from a real row rather than assumed.
const existingIds = new Set(seed.features.map((f) => String(f.properties?.id ?? "")));
const taken = [];
const refused = [];

for (const feature of incoming) {
  const props = feature.properties ?? {};
  const id = String(props.GID_2 ?? props.gid2 ?? props.GID_1 ?? "").trim();
  const gid0 = String(props.GID_0 ?? props.gid0 ?? "").trim();
  const name = String(props.NAME_2 ?? props.name_2 ?? props.NAME_1 ?? "").trim();
  if (!id || !gid0 || !feature.geometry) {
    refused.push(`${id || "(no id)"}: missing id, country or geometry`);
    continue;
  }
  if (existingIds.has(id)) {
    refused.push(`${id}: already in the seed`);
    continue;
  }
  taken.push({
    type: "Feature",
    geometry: feature.geometry,
    properties: { id, gid0, name, country: String(props.COUNTRY ?? props.country ?? "").trim() },
  });
  existingIds.add(id);
}

// A NAMELESS SUBDIVISION IS WORSE THAN NO SUBDIVISION, AND THAT IS NOT
// HYPOTHETICAL. Measured on gadm41_GBR_2.json (GADM 4.1, the GeoJSON build):
// 183 rows, of which 82 — 45%, and 67 of England's own — carry NAME_2 "NA"
// with VARNAME_2 empty too. Merging it replaced four large provinces with a
// map that says "NA" eighty-two times. The tool must refuse that on the
// player's behalf rather than write it and let them discover it on the map.
const NAMELESS = /^(NA|N\/A|)$/i;
const nameless = taken.filter((row) => NAMELESS.test(row.properties.name));
const namelessShare = taken.length > 0 ? nameless.length / taken.length : 0;
if (nameless.length > 0) {
  console.log(
    `\n⚠  ${nameless.length} of ${taken.length} row(s) (${Math.round(namelessShare * 100)}%) have NO NAME in this file `
    + "— they would render as \"NA\" on the map.",
  );
  console.log(`   e.g. ${nameless.slice(0, 5).map((r) => `${r.properties.id} (${r.properties.country || "?"})`).join(", ")}`);
}
if (namelessShare > 0.1 && !argv.includes("--force")) {
  console.error(
    "\nrefusing to merge: more than 10% of the incoming rows are nameless.\n"
    + "This GADM GeoJSON build is known to ship empty NAME_2 for much of England.\n"
    + "Try another source — GADM's GeoPackage/shapefile build, or the ONS Open\n"
    + "Geography Portal (OGL) for the UK — or pass --force if you truly want it.",
  );
  process.exit(2);
}

let dropped = 0;
let features = seed.features;
if (replaceCountry) {
  const before = features.length;
  // Only level-1 rows of that country go: its level-2 rows (if any) and every
  // other country are untouched.
  features = features.filter((f) => {
    const gid0 = String(f.properties?.gid0 ?? "");
    const id = String(f.properties?.id ?? "");
    return !(gid0 === replaceCountry && /_1$/.test(id));
  });
  dropped = before - features.length;
}

const merged = { ...seed, features: [...features, ...taken] };

console.log(`source:   ${path.relative(ROOT, resolved)}`);
console.log(`taken:    ${taken.length} level-2 row(s)`);
if (replaceCountry) console.log(`replaced: ${dropped} level-1 row(s) of ${replaceCountry}`);
if (refused.length > 0) {
  console.log(`refused:  ${refused.length}`);
  for (const line of refused.slice(0, 10)) console.log(`  - ${line}`);
  if (refused.length > 10) console.log(`  … and ${refused.length - 10} more`);
}
console.log(`seed:     ${seed.features.length} → ${merged.features.length} feature(s)`);

if (!WRITE) {
  console.log("\n(report only — pass --write to apply, then run scripts/presets/rebuild-all.mjs)");
} else {
  writeFileSync(SEED, JSON.stringify(merged), "utf8");
  console.log(`\nwritten to ${path.relative(ROOT, SEED)} — now run: node scripts/presets/rebuild-all.mjs`);
}

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
// --only CHN keeps just the rows whose OWN id starts with that prefix.
//
// A GADM country file is not only that country. gadm41_CHN_2.json carries 344
// Chinese prefectures AND Hong Kong's 18 districts, Macau's 2, and four rows of
// disputed ground (Z02/Z03/Z08) — all stamped GID_0 "CHN". gadm41_IND_2.json
// carries 634 Indian districts plus 42 rows of Z01/Z04/Z05/Z07/Z09, which is
// Kashmir, Arunachal and the rest. Taking those wholesale subdivides a colony
// that is one city and doubles up on disputed ground the seed already models as
// single curated rows. The prefix is the surgical instrument.
const onlyAt = argv.indexOf("--only");
const onlyPrefix = onlyAt >= 0 ? String(argv[onlyAt + 1] ?? "").toUpperCase() : "";

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

// TWO SOURCE VOCABULARIES, BECAUSE THE BETTER SOURCE SPEAKS THE OTHER ONE.
// GADM names its fields GID_2/NAME_2/GID_0. The ONS Open Geography Portal
// (OGL) — which is the source that actually has complete UK names, where
// GADM's GeoJSON build leaves 45% of England blank — names them CTYUA23CD /
// CTYUA23NM and carries no country column at all, since every row is British.
// The ONS code's first letter IS the constituent nation (E/W/S/N).
// GADM 4.1's GeoJSON BUILD SHIPS NAMES WITH THE SPACES STRIPPED.
//
// Measured: 46 of China's 368 prefectures and 87 of India's 676 districts come
// through as "NicobarIslands", "NorthandMiddleAndaman", "QiandongnanMiaoandDong",
// "ShamShuiPo". The geometry is fine and the names are not — and on a map whose
// whole point is how the board LOOKS, 133 run-together labels is not a detail.
//
// Un-glue on the camel boundary, but split the connectives FIRST: "MiaoandDong"
// only has a boundary at "dD", so a plain camel split yields "Miaoand Dong".
// Doing "and/of/the" first turns it into "Miao and Dong" and the camel pass then
// has nothing left to get wrong.
// Unicode-aware, because GADM is full of diacritics: "GarzêTibetan" has its
// boundary at "êT", and an ASCII [a-z][A-Z] never sees it. Measured — that one
// name and its kind were the only ones a plain ASCII pass left glued.
const CONNECTIVES = /(\p{Ll})(and|of|the|de|del|da)(\p{Lu})/gu;
const CAMEL = /(\p{Ll})(\p{Lu})/gu;
// And one row of gadm41_CHN_2.json is simply corrupt: "Neijiang]]" sits beside
// a clean "Neijiang". Stray brackets are not a name.
const JUNK = /[[\]{}]+/g;
export const prettifyGadmName = (raw) => {
  const text = String(raw ?? "").replace(JUNK, "").trim();
  if (!text) return "";
  return text
    .replace(CONNECTIVES, (_, before, word, after) => `${before} ${word} ${after}`)
    .replace(CAMEL, "$1 $2")
    .replace(/\s+/g, " ")
    .trim();
};

const readRow = (props) => {
  const gadmId = String(props.GID_2 ?? props.gid2 ?? props.GID_1 ?? "").trim();
  if (gadmId) {
    return {
      id: gadmId,
      gid0: String(props.GID_0 ?? props.gid0 ?? "").trim(),
      name: prettifyGadmName(props.NAME_2 ?? props.name_2 ?? props.NAME_1),
      country: String(props.COUNTRY ?? props.country ?? "").trim(),
    };
  }
  // ONS: any *CD/*NM pair (CTYUA23CD/NM, LAD23CD/NM, RGN22CD/NM…).
  const codeKey = Object.keys(props).find((key) => /CD$/.test(key) && typeof props[key] === "string");
  const nameKey = Object.keys(props).find((key) => /(?<!NMW)NM$/.test(key) && typeof props[key] === "string");
  if (!codeKey || !nameKey) return null;
  const code = String(props[codeKey]).trim();
  return {
    id: code ? `GBR.${code}` : "",
    gid0: "GBR",
    name: String(props[nameKey]).trim(),
    country: "United Kingdom",
  };
};

for (const feature of incoming) {
  const props = feature.properties ?? {};
  const row = readRow(props);
  if (!row) {
    refused.push("(unrecognised property shape — neither GADM nor ONS)");
    continue;
  }
  const { id, gid0, name } = row;
  if (!id || !gid0 || !feature.geometry) {
    refused.push(`${id || "(no id)"}: missing id, country or geometry`);
    continue;
  }
  if (onlyPrefix && !id.startsWith(`${onlyPrefix}.`)) {
    refused.push(`${id}: outside --only ${onlyPrefix}`);
    continue;
  }
  if (existingIds.has(id)) {
    refused.push(`${id}: already in the seed`);
    continue;
  }
  taken.push({
    type: "Feature",
    geometry: feature.geometry,
    properties: { id, gid0, name, country: row.country },
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

// A SUBDIVIDED PARENT MUST GO, OR BOTH LAYERS DRAW.
//
// The UK taught this once: 218 ONS counties merged over four provinces left the
// provinces underneath, and the map rendered both. --replace GID_0 handled that
// by country, which is too blunt here — dropping every CHN row would take Hong
// Kong and Macau with it, and they have no level-2 children in this file. So the
// parent of each row actually TAKEN is what gets dropped, and a level-1 row that
// was not subdivided survives untouched.
const subdividedParents = new Set();
for (const row of taken) {
  const match = /^([A-Z0-9]{3}\.\d+)\.\d+_\d+$/.exec(row.properties.id);
  if (match) subdividedParents.add(`${match[1]}_1`);
}

let dropped = 0;
let features = seed.features;
if (replaceCountry) {
  const before = features.length;
  // Only level-1 rows of that country go: its level-2 rows (if any) and every
  // other country are untouched.
  // EVERY existing row of that country, not just its level-1 ones. The first
  // cut only dropped ids ending "_1", which was right when replacing GADM
  // provinces and wrong the moment we replaced one subdivision set with a
  // coarser one (218 ONS counties → 46 ITL2 regions): the counties do not end
  // in "_1", so they survived and both layers rendered on top of each other.
  features = features.filter((f) => String(f.properties?.gid0 ?? "") !== replaceCountry);
  dropped = before - features.length;
}

const beforeParents = features.length;
features = features.filter((f) => !subdividedParents.has(String(f.properties?.id ?? "")));
const parentsDropped = beforeParents - features.length;

const merged = { ...seed, features: [...features, ...taken] };

console.log(`source:   ${path.relative(ROOT, resolved)}`);
console.log(`taken:    ${taken.length} level-2 row(s)`);
if (replaceCountry) console.log(`replaced: ${dropped} level-1 row(s) of ${replaceCountry}`);
if (parentsDropped > 0) console.log(`parents:  ${parentsDropped} subdivided level-1 row(s) removed`);
if (onlyPrefix) console.log(`only:     ${onlyPrefix}`);
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

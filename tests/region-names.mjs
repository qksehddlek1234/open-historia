// Region names reach the screen through translateLabel, which returns cached
// Korean if it has it and raw English if it does not — so a board showed
// "경기도" beside "Gyeonggi-do" beside "Hokkaido" depending on what happened to
// be cached. A place name is a fixed fact, not a sentence: it ships in the pack.
//
// These pins hold the two ways this breaks: a key that drifts from the
// catalog's exact spelling (one apostrophe or diacritic and it never matches),
// and a name that ships without Korean at all.
import assert from "node:assert/strict";
import fs from "node:fs";

let pass = 0;
const test = (name, fn) => { fn(); pass += 1; console.log(`  ok  ${name}`); };

const { REGION_KO } = await import("../scripts/i18n/ko-region-names.mjs");
const { loadRegionCatalog } = await import("../scripts/presets/lib/regionCatalog.mjs");
const catalog = await loadRegionCatalog();
const rows = Array.isArray(catalog) ? catalog : catalog.regions ?? [];

// GBR joined the moment its geometry did: the ONS merge turned four provinces
// into 218 counties, and 218 untranslated names would have been a far bigger
// 한영혼용 than the four it replaced.
const COVERED = ["RUS", "UKR", "KOR", "PRK", "JPN", "CHN", "DEU", "FRA", "GBR", "ITA", "POL", "USA"];

test("every key matches a real catalog or seed name, character for character", () => {
  const catalogNames = new Set(rows.map((r) => r.name ?? r.NAME_1).filter(Boolean));
  // The seed is the layer the map draws from, and it can run ahead of the
  // pmtiles catalog (the ONS UK merge did exactly that).
  const seed = JSON.parse(fs.readFileSync(new URL("../public/assets/regions-seed.geojson", import.meta.url), "utf8"));
  for (const feature of seed.features ?? []) {
    const name = feature?.properties?.name;
    if (name) catalogNames.add(name);
  }
  const orphans = Object.keys(REGION_KO).filter((key) => !catalogNames.has(key));
  assert.deepEqual(orphans, [], "a key the catalog does not contain can never match");
});

test("the covered countries are covered completely", () => {
  const missing = [];
  const seed = JSON.parse(fs.readFileSync(new URL("../public/assets/regions-seed.geojson", import.meta.url), "utf8"));
  for (const feature of seed.features ?? []) {
    const gid0 = feature?.properties?.gid0;
    const name = feature?.properties?.name;
    // GADM ships one Ukrainian row whose name is literally "?" — not a place,
    // and not something a dictionary can answer.
    if (!COVERED.includes(gid0) || !name || name === "?") continue;
    if (!REGION_KO[name]) missing.push(`${gid0}:${name}`);
  }
  assert.deepEqual(missing, [], "a covered country with a gap is exactly the 한영혼용 this fixes");
});

test("every dictionary entry actually ships in the pack", () => {
  const pack = JSON.parse(fs.readFileSync(new URL("../public/lang/ko.json", import.meta.url), "utf8"));
  const unshipped = Object.entries(REGION_KO).filter(([en, ko]) => pack[en] !== ko).map(([en]) => en);
  assert.deepEqual(unshipped, [], "run scripts/i18n/ko-region-names.mjs");
});

test("the Korean is Korean — no entry left as its English self", () => {
  const untranslated = Object.entries(REGION_KO)
    .filter(([en, ko]) => en === ko || !/[가-힣]/.test(ko))
    .map(([en]) => en);
  assert.deepEqual(untranslated, []);
});

test("GADM's two known data faults are carried as keys, not corrected away", () => {
  // England's NAME_1 is literally "NA", and Nagasaki is misspelled "Naoasaki".
  // Fixing the key would stop it matching the catalog — the fix is the VALUE.
  assert.equal(REGION_KO.NA, "잉글랜드");
  assert.equal(REGION_KO.Naoasaki, "나가사키현");
});

console.log(`\n${pass} passed\n`);

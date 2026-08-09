// THE TRAP BRITAIN SPRANG ONCE, DISARMED BEFORE CHINA AND INDIA SPRING IT AGAIN.
//
// Replacing the seed's four UK provinces with 46 ONS regions made four specs
// that wrote "GBR.3_1" for Scotland match nothing, and the 1444 build came out
// with Britain unowned. The fix then was a UK-shaped table; the next
// subdivisions are much bigger — 33 Chinese provinces into ~340 prefectures and
// 35 Indian states into ~660 districts — and the WWII specs address every
// Chinese warlord clique by its level-1 id.
//
// GADM's id scheme is what makes this general: a level-2 id is its level-1
// parent plus one segment, so the parent is recoverable from the child.
import assert from "node:assert/strict";
import fs from "node:fs";

let pass = 0;
const test = (name, fn) => { fn(); pass += 1; console.log(`  ok  ${name}`); };

const { buildLevel2Index, expandLegacyLevel1 } =
  await import("../scripts/presets/lib/level2Expansion.mjs");
const BUILD = fs.readFileSync(new URL("../scripts/presets/build-preset.mjs", import.meta.url), "utf8");
const NUTS = await import("../scripts/presets/lib/level2Expansion.mjs");

const feature = (id) => ({ properties: { id } });
// Real GADM 4.1 ids: a level-2 GID ends "_1" exactly like its parent, and it is
// the extra SEGMENT that makes it level-2. Taken from gadm41_CHN_2.json.
const SEED = [
  feature("CHN.25.1_1"), feature("CHN.25.2_1"), feature("CHN.25.11_1"),
  feature("CHN.28.1_1"),
  feature("IND.32.4_1"),
  feature("FRA.1_1"),          // never subdivided
  feature("GBR.TLM_1"),        // ONS, not GADM
  feature("GBR.S12000033"),    // ONS council area
];

test("A LEVEL-1 KEY MEANS ALL ITS LEVEL-2 CHILDREN", () => {
  const index = buildLevel2Index(SEED);
  assert.deepEqual(expandLegacyLevel1("CHN.25_1", index),
    ["CHN.25.1_1", "CHN.25.2_1", "CHN.25.11_1"]);
  assert.deepEqual(expandLegacyLevel1("CHN.28_1", index), ["CHN.28.1_1"]);
  assert.deepEqual(expandLegacyLevel1("IND.32_1", index), ["IND.32.4_1"]);
});

test("…and a country that was never subdivided is left exactly alone", () => {
  const index = buildLevel2Index(SEED);
  assert.deepEqual(expandLegacyLevel1("FRA.1_1", index), ["FRA.1_1"]);
  // The key is returned unchanged rather than dropped: an unsubdivided country
  // must keep assigning by its own id.
  assert.deepEqual(expandLegacyLevel1("DEU.9_1", index), ["DEU.9_1"]);
});

test("…nor does it touch anything that is not a GADM level-1 id", () => {
  const index = buildLevel2Index(SEED);
  for (const key of ["GBR.TLM_1", "GBR.S12000033", "CHN.25.1_1", "sea_baltic", "", null]) {
    assert.deepEqual(expandLegacyLevel1(key, index), [key], String(key));
  }
});

test("the index only ever collects level-2 rows", () => {
  const index = buildLevel2Index(SEED);
  assert.deepEqual([...index.keys()].sort(), ["CHN.25", "CHN.28", "IND.32"]);
  // ONS codes have no parent segment and must not invent one.
  assert.equal(index.has("GBR"), false);
});

test("an empty or absent seed degrades to identity, never to a crash", () => {
  assert.deepEqual(expandLegacyLevel1("CHN.25_1", buildLevel2Index([])), ["CHN.25_1"]);
  assert.deepEqual(expandLegacyLevel1("CHN.25_1", buildLevel2Index(undefined)), ["CHN.25_1"]);
  assert.deepEqual(expandLegacyLevel1("CHN.25_1", null), ["CHN.25_1"]);
});

// ---- the builder actually uses it ----------------------------------------------------

test("THE BUILDER EXPANDS THREE WAYS, most specific first", () => {
  assert.match(BUILD, /buildLevel2Index, buildNutsIndex, expandLegacyLevel1, expandLegacyNuts,/);
  assert.match(BUILD, /const level2Index = buildLevel2Index\(seedFeatures\);/);
  assert.match(BUILD, /const nutsIndex = buildNutsIndex\(seedFeatures\);/);
  assert.match(BUILD, /return expandLegacyLevel1\(key, level2Index\);/);
  // Order matters: the UK's ONS table, then the NUTS table (Germany), then the
  // general GADM parent-segment rule. The tables are exact and the rule is a
  // pattern, so an exact answer must never be overtaken by a pattern.
  const fn = BUILD.slice(BUILD.indexOf("const expandRegionKey"), BUILD.indexOf("const overrides = {}"));
  assert.ok(fn.indexOf("UK_NATION_OF_LEGACY_ID") < fn.indexOf("expandLegacyNuts"));
  assert.ok(fn.indexOf("expandLegacyNuts") < fn.indexOf("expandLegacyLevel1"));
});

test("A NUTS KEY EXPANDS THROUGH THE TABLE, because the id has no parent", () => {
  const { buildNutsIndex, expandLegacyNuts, NUTS_PREFIX_OF_LEGACY_ID } = NUTS;
  const seed = ["DEU.DE11", "DEU.DE12", "DEU.DE21", "DEU.DE30", "FRA.11"]
    .map((id) => ({ properties: { id } }));
  const index = buildNutsIndex(seed);
  assert.deepEqual(expandLegacyNuts("DEU.1_1", index), ["DEU.DE11", "DEU.DE12"]);
  assert.deepEqual(expandLegacyNuts("DEU.2_1", index), ["DEU.DE21"]);
  assert.deepEqual(expandLegacyNuts("DEU.3_1", index), ["DEU.DE30"]);
  // A prefix must not reach across a border, and an unmapped key is untouched.
  assert.deepEqual(expandLegacyNuts("FRA.1_1", index), ["FRA.1_1"]);
  assert.deepEqual(expandLegacyNuts("CHN.25_1", index), ["CHN.25_1"]);
  // All sixteen German Länder are mapped, and only Germany is in the table —
  // Poland's NUTS-3 is statistical, not administrative, and was reverted.
  const keys = Object.keys(NUTS_PREFIX_OF_LEGACY_ID);
  assert.equal(keys.length, 16, keys.join(", "));
  assert.ok(keys.every((k) => k.startsWith("DEU.")), "only Germany belongs here");
});

test("…and a spec may name an id the SEED has, even before the tiles catch up", () => {
  // regions.pmtiles is the validation catalog and lags the seed by a heavy
  // regeneration. Rejecting a seed id would mean no spec could name a Chinese
  // prefecture until that job was done.
  assert.match(BUILD, /const seedIds = new Set\(/);
  assert.match(BUILD, /!validGid1\.has\(gid1\) && !seedIds\.has\(gid1\) && !UK_LEGACY_KEYS\.has\(gid1\)/);
});

console.log(`\n${pass} passed\n`);

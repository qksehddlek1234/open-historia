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

const feature = (id) => ({ properties: { id } });
const SEED = [
  feature("CHN.25.1_2"), feature("CHN.25.2_2"), feature("CHN.25.11_2"),
  feature("CHN.28.1_2"),
  feature("IND.32.4_2"),
  feature("FRA.1_1"),          // never subdivided
  feature("GBR.TLM_1"),        // ONS, not GADM
  feature("GBR.S12000033"),    // ONS council area
];

test("A LEVEL-1 KEY MEANS ALL ITS LEVEL-2 CHILDREN", () => {
  const index = buildLevel2Index(SEED);
  assert.deepEqual(expandLegacyLevel1("CHN.25_1", index),
    ["CHN.25.1_2", "CHN.25.2_2", "CHN.25.11_2"]);
  assert.deepEqual(expandLegacyLevel1("CHN.28_1", index), ["CHN.28.1_2"]);
  assert.deepEqual(expandLegacyLevel1("IND.32_1", index), ["IND.32.4_2"]);
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
  for (const key of ["GBR.TLM_1", "GBR.S12000033", "CHN.25.1_2", "sea_baltic", "", null]) {
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

test("THE BUILDER EXPANDS BOTH WAYS, UK table first then the general rule", () => {
  assert.match(BUILD, /import \{ buildLevel2Index, expandLegacyLevel1 \}/);
  assert.match(BUILD, /const level2Index = buildLevel2Index\(seedFeatures\);/);
  assert.match(BUILD, /return expandLegacyLevel1\(key, level2Index\);/);
  // The UK's ONS codes are not GADM ids, so their own mapping has to win first.
  const fn = BUILD.slice(BUILD.indexOf("const expandRegionKey"), BUILD.indexOf("const overrides = {}"));
  assert.ok(fn.indexOf("UK_NATION_OF_LEGACY_ID") < fn.indexOf("expandLegacyLevel1"));
});

test("…and a spec may name an id the SEED has, even before the tiles catch up", () => {
  // regions.pmtiles is the validation catalog and lags the seed by a heavy
  // regeneration. Rejecting a seed id would mean no spec could name a Chinese
  // prefecture until that job was done.
  assert.match(BUILD, /const seedIds = new Set\(/);
  assert.match(BUILD, /!validGid1\.has\(gid1\) && !seedIds\.has\(gid1\) && !UK_LEGACY_KEYS\.has\(gid1\)/);
});

console.log(`\n${pass} passed\n`);

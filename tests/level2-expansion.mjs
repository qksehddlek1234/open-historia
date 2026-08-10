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

test("THE RESOLVER EXPANDS THREE WAYS, most specific first", () => {
  // This used to read build-preset's inline assembly. The assembly moved into
  // lib/level2Expansion.mjs when build-default-map needed the same resolution,
  // so the pin follows it — what it protects is the ORDER, not which file holds
  // the lines. The UK's ONS table, then the NUTS table (Germany), then the
  // general GADM parent-segment rule: the tables are exact and the rule is a
  // pattern, and an exact answer must never be overtaken by a pattern.
  const LIB = fs.readFileSync(new URL("../scripts/presets/lib/level2Expansion.mjs", import.meta.url), "utf8");
  const fn = LIB.slice(LIB.indexOf("export function buildRegionKeyExpander"));
  assert.ok(fn.indexOf("UK_NATION_OF_LEGACY_ID") < fn.indexOf("expandLegacyNuts"),
    "the UK table is consulted before the NUTS table");
  assert.ok(fn.indexOf("expandLegacyNuts") < fn.indexOf("expandLegacyLevel1"),
    "and the NUTS table before the general GADM rule");
  assert.match(LIB, /const level2Index = buildLevel2Index\(features\);/);
  assert.match(LIB, /const nutsIndex = buildNutsIndex\(features\);/);
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

console.log("\nOne resolver, and the 168 facts it rescues");

test("BOTH BUILDERS USE THE SHARED EXPANDER — no second copy of the rule", () => {
  // build-preset assembled this inline (UK table + NUTS table + GADM parent)
  // and build-default-map had none, which was survivable only while specs were
  // the sole thing naming legacy keys. Two builders holding their own copy of a
  // resolution rule is the same class of damage as two holding their own idea of
  // what a region is — that one un-shared all 22 maps in a single rebuild.
  const DEFAULT_MAP = fs.readFileSync(new URL("../scripts/build-default-map.mjs", import.meta.url), "utf8");
  assert.match(BUILD, /buildRegionKeyExpander/, "build-preset must call the shared resolver");
  assert.match(DEFAULT_MAP, /buildRegionKeyExpander/, "build-default-map must call the same one");
  // And build-preset must NOT have grown its own copy back.
  assert.doesNotMatch(BUILD, /const UK_NATION_OF_LEGACY_ID = \{/,
    "the UK table lives in level2Expansion now — a copy here is the bug this pin exists for");
});

test("…and the resolver still answers for all three tiers", () => {
  const seed = new URL("../public/assets/regions-seed.geojson", import.meta.url);
  if (!fs.existsSync(seed)) return; // gitignored; only measurable where it exists
  const ids = JSON.parse(fs.readFileSync(seed, "utf8")).features.map((f) => String(f.properties?.id ?? ""));
  const expand = NUTS.buildRegionKeyExpander(ids);
  assert.ok(expand("GBR.1_1").length > 1, "the UK table: England becomes its counties");
  assert.ok(expand("CHN.11_1").length > 1, "the GADM rule: a province becomes its prefectures");
  // Baden-Württemberg, not Brandenburg: a NUTS expansion is a CHANGE OF ID, and
  // it does not have to be a change of COUNT. Brandenburg is exactly one NUTS-2
  // region, so a `> 1` check here fails on a resolver that is working correctly.
  assert.deepEqual(expand("DEU.1_1").length > 1, true, "Baden-Württemberg has four");
  assert.deepEqual(expand("DEU.4_1"), ["DEU.DE40"], "and Brandenburg's single row still resolves");
  assert.deepEqual(expand("FRA.1_1"), expand("FRA.1_1"), "and it is stable");
});

test("THE 168 SUPERSEDED FACTS ARE EXPANDED, NOT DELETED", () => {
  // The Modern Day campaign records ownership on coarse ids that the
  // subdivision passes replaced. Deleting them would retire 168 facts about the
  // board the app opens on; every one of them resolves, so none is retired.
  const DEFAULT_MAP = fs.readFileSync(new URL("../scripts/build-default-map.mjs", import.meta.url), "utf8");
  assert.match(DEFAULT_MAP, /expanded \$\{expandedKeys\} superseded override\(s\)/,
    "the build has to say what it moved");
  assert.match(DEFAULT_MAP, /if \(target in world\.regionOwnershipOverrides\) continue;/,
    "a finer fact the campaign already has must win over the coarse key");

  const map = new URL("../server/data/scenarios/default/regions.geojson", import.meta.url);
  const world = new URL("../server/data/scenarios/default/world.json", import.meta.url);
  if (!fs.existsSync(map) || !fs.existsSync(world)) return;
  const featureIds = new Set(JSON.parse(fs.readFileSync(map, "utf8")).features.map((f) => String(f.properties?.id ?? "")));
  const overrides = JSON.parse(fs.readFileSync(world, "utf8")).regionOwnershipOverrides ?? {};
  const stale = Object.keys(overrides).filter((key) => !featureIds.has(key));
  assert.deepEqual(stale, [], `${stale.length} override(s) still point at nothing`);
});

console.log(`\n${pass} passed\n`);

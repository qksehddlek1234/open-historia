// The shared base map, and the two things that must never happen:
// a board redrawn because sharing was cleared on a bad plan, and a conquest
// undone because an overlay overwrote a save's own ownership table.
//
// The extra-feature pin below is not hypothetical. It is the check that caught
// {id:"NA", gid0:"NA", name:"NA"} on the default map — a magenta polity named
// after R's missing-value token holding 31 pieces of northern Britain in the
// built-in campaign's start-country picker.
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import url from "node:url";
import { indexBase, planOverlay, reconstructOwners, verifyReconstruction, mergeOverrides } from "../scripts/presets/lib/mapOverlay.mjs";

let pass = 0;
const pending = [];
const test = (name, fn) => { pending.push(Promise.resolve(fn()).then(() => { pass += 1; console.log(`  ok  ${name}`); })); };
const ROOT = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), "..");

const box = (n) => ({ type: "Polygon", coordinates: [[[n, n], [n + 1, n], [n + 1, n + 1], [n, n]]] });
const feat = (id, owner, n = 0) => ({ type: "Feature", geometry: box(n), properties: { id, owner, gid0: id.slice(0, 3), name: id } });

const BASE = { features: [feat("AAA.1_1", "Alpha", 0), feat("BBB.1_1", "Beta", 1), feat("CCC.1_1", "Gamma", 2)] };

console.log("\nShared base map — share only what is provably identical");

test("an overlay records divergence and nothing else", () => {
  const base = indexBase(BASE);
  const plan = planOverlay([feat("AAA.1_1", "Alpha", 0), feat("BBB.1_1", "Delta", 1), feat("CCC.1_1", "Gamma", 2)], base);
  assert.equal(plan.eligible, true, plan.reason);
  assert.deepEqual(plan.overrides, { "BBB.1_1": "Delta" }, "agreement is not restated");
  assert.equal(plan.overrideCount, 1);
});

test("an explicitly unowned region is recorded, not folded into the override table", () => {
  // It gets its own channel because the obvious encoding is taken: gameState
  // drops any override with an empty owner, since a save damaged by the old
  // owner-blanking bug carries exactly those. Roman 117 has 3,300 of these.
  const base = indexBase(BASE);
  const plan = planOverlay([feat("AAA.1_1", "", 0), feat("BBB.1_1", "Beta", 1), feat("CCC.1_1", "Gamma", 2)], base);
  assert.equal(plan.eligible, true, plan.reason);
  assert.deepEqual(plan.unownedIds, ["AAA.1_1"]);
  assert.equal(plan.overrides["AAA.1_1"], undefined, "an unowned region never becomes a blank override");
});

test("reconstruction leaves an unowned region unowned, against the base's own owner", () => {
  const base = indexBase(BASE);
  const owners = reconstructOwners(base, { "BBB.1_1": "Delta" }, ["AAA.1_1"]);
  assert.equal(owners.get("AAA.1_1"), "", "the base said Alpha; the board says nobody");
  assert.equal(owners.get("BBB.1_1"), "Delta");
  assert.equal(owners.get("CCC.1_1"), "Gamma");
});

test("a board of nothing but unclaimed ground still verifies clean", () => {
  const base = indexBase(BASE);
  const features = [feat("AAA.1_1", "", 0), feat("BBB.1_1", "", 1), feat("CCC.1_1", "", 2)];
  const plan = planOverlay(features, base);
  assert.equal(plan.unownedIds.length, 3);
  const check = verifyReconstruction(features, base, plan.overrides, { unownedIds: plan.unownedIds });
  assert.equal(check.count, 0, JSON.stringify(check.mismatches));
});

test("unowned where the base is ALSO unowned is not a blocker", () => {
  const base = indexBase({ features: [feat("AAA.1_1", "", 0), feat("BBB.1_1", "Beta", 1)] });
  const plan = planOverlay([feat("AAA.1_1", "", 0), feat("BBB.1_1", "Beta", 1)], base);
  assert.equal(plan.eligible, true, plan.reason);
  assert.deepEqual(plan.unownedIds, [], "nothing to cancel means nothing to express");
});

test("geometry is the only hard blocker", () => {
  const base = indexBase(BASE);
  const novel = planOverlay([...BASE.features, feat("DDD.1_1", "Delta", 9)], base);
  assert.equal(novel.eligible, false);
  assert.deepEqual(novel.novelIds, ["DDD.1_1"]);

  const moved = planOverlay([feat("AAA.1_1", "Alpha", 7), feat("BBB.1_1", "Beta", 1), feat("CCC.1_1", "Gamma", 2)], base);
  assert.equal(moved.eligible, false);
  assert.deepEqual(moved.changedGeometryIds, ["AAA.1_1"]);
});

test("a feature the base has and the scenario does not is a mismatch, not a rounding error", () => {
  // The NA case: every preset came out one feature short of default, and the
  // extra one was a phantom. A shared base would have added it to 13 boards.
  const base = indexBase(BASE);
  const scenarioFeatures = [feat("AAA.1_1", "Alpha", 0), feat("BBB.1_1", "Beta", 1)];
  const plan = planOverlay(scenarioFeatures, base);
  assert.equal(plan.eligible, true, "the PLAN cannot see it — nothing in the scenario is wrong");
  const check = verifyReconstruction(scenarioFeatures, base, plan.overrides);
  assert.equal(check.count, 1, "but the reconstruction can, which is why it runs");
  assert.deepEqual(check.extraInBase, ["CCC.1_1"]);
});

test("reconstruction resolves exactly the way the renderer does", () => {
  const base = indexBase(BASE);
  const owners = reconstructOwners(base, { "BBB.1_1": "Delta" });
  assert.equal(owners.get("AAA.1_1"), "Alpha", "no override — the base stands");
  assert.equal(owners.get("BBB.1_1"), "Delta", "an override wins");
  assert.equal(owners.get("CCC.1_1"), "Gamma");
});

console.log("\nSave safety — an overlay is a statement about the STARTING map");

test("merging never overwrites an entry that is already there", () => {
  // A game's table has absorbed the player's conquests. If the overlay won,
  // every conquered region would revert the moment the file it used to read
  // stopped existing — a save silently rolled back by a build script.
  const { merged, added } = mergeOverrides({ "AAA.1_1": "Conqueror" }, { "AAA.1_1": "Alpha", "BBB.1_1": "Delta" });
  assert.equal(merged["AAA.1_1"], "Conqueror", "the conquest survives");
  assert.equal(merged["BBB.1_1"], "Delta", "the untouched region gets its overlay");
  assert.equal(added, 1);
});

test("merging an overlay into nothing yields the overlay", () => {
  const { merged, added } = mergeOverrides(undefined, { "AAA.1_1": "Alpha" });
  assert.deepEqual(merged, { "AAA.1_1": "Alpha" });
  assert.equal(added, 1);
});

console.log("\nThe built map — a country code is three characters");

test("no shipped region has a gid0 that is not a country code, or an id that is not its own", () => {
  const file = path.join(ROOT, "server", "data", "scenarios", "default", "regions.geojson");
  if (!fs.existsSync(file)) {
    console.log("      (default map not built — skipped)");
    return;
  }
  const collection = JSON.parse(fs.readFileSync(file, "utf8"));
  const bad = collection.features.filter((f) => !/^[A-Z0-9]{3}$/.test(String(f.properties?.gid0 ?? "")));
  assert.deepEqual(bad.map((f) => f.properties.id), [], "a missing value became a country here once already");
  // The second half. The gid0 rule alone passed {id:"?", gid0:"UKR"} — a real
  // country code carrying an id that is a question mark — straight onto Kyiv.
  const orphan = collection.features.filter((f) => {
    const id = String(f.properties?.id ?? "");
    const gid0 = String(f.properties?.gid0 ?? "");
    return !id.startsWith(gid0);
  });
  assert.deepEqual(orphan.map((f) => f.properties.id), [], "a region must begin with the country it claims");
  // Z01…Z09 are the disputed-territory pseudo-codes and must SURVIVE the rule.
  const disputed = collection.features.filter((f) => /^Z\d\d$/.test(String(f.properties?.gid0 ?? "")));
  assert.ok(disputed.length > 0, "the three-character rule must not take Kashmir, Xinjiang and Tibet with it");
});

test("the default map ships no ownership override for a region it does not contain", () => {
  const dir = path.join(ROOT, "server", "data", "scenarios", "default");
  if (!fs.existsSync(path.join(dir, "regions.geojson"))) {
    console.log("      (default map not built — skipped)");
    return;
  }
  const ids = new Set(JSON.parse(fs.readFileSync(path.join(dir, "regions.geojson"), "utf8")).features.map((f) => String(f.properties.id)));
  const world = JSON.parse(fs.readFileSync(path.join(dir, "world.json"), "utf8"));
  const skipped = Object.keys(world.regionOwnershipOverrides ?? {})
    .filter((id) => !ids.has(id) && !id.startsWith("sea_") && !/^[A-Z]{3}\./.test(id));
  // Scoped the same way the build is: ids that look like real GADM references
  // are the subdivision passes' business, not this one's. What must never come
  // back is a bare token like "NA".
  assert.deepEqual(skipped, [], "a dangling override for a non-GADM id resurrects the polity that made it");
});

console.log("\nWorld state — the sentinel and the baseline survive a round trip");

test("an unowned id survives normalisation, and a conquest of it does not", async () => {
  const { normalizeWorldState } = await import("../src/runtime/gameState.js");
  const clean = normalizeWorldState({ unownedRegionIds: ["CCC.1_1", "AAA.1_1", "AAA.1_1", " "] });
  assert.deepEqual(clean.unownedRegionIds, ["AAA.1_1", "CCC.1_1"], "deduped, sorted, blanks dropped");

  // The two channels can only disagree after something was taken, and taking it
  // is the newer fact.
  const taken = normalizeWorldState({
    unownedRegionIds: ["AAA.1_1", "CCC.1_1"],
    regionOwnershipOverrides: { "AAA.1_1": "Conqueror" },
  });
  assert.deepEqual(taken.unownedRegionIds, ["CCC.1_1"], "a region with an owner is not unowned");
  assert.equal(taken.regionOwnershipOverrides["AAA.1_1"], "Conqueror");
});

test("a save written before any of this normalises to the same world it was", async () => {
  const { normalizeWorldState } = await import("../src/runtime/gameState.js");
  const legacy = normalizeWorldState({ regionOwnershipOverrides: { "AAA.1_1": "Alpha" } });
  assert.deepEqual(legacy.unownedRegionIds, [], "no list means nothing to cancel");
  assert.deepEqual(legacy.baselineOwnership, {}, "no baseline means the geometry IS the baseline");
  assert.equal(legacy.regionOwnershipOverrides["AAA.1_1"], "Alpha");
});

test("every shared scenario ships a baseline, and every kept one does not", () => {
  const dir = path.join(ROOT, "server", "data", "scenarios");
  if (!fs.existsSync(dir)) {
    console.log("      (scenarios not built — skipped)");
    return;
  }
  for (const id of fs.readdirSync(dir)) {
    const worldPath = path.join(dir, id, "world.json");
    if (!fs.existsSync(worldPath)) continue;
    const sharesBase = !fs.existsSync(path.join(dir, id, "regions.geojson"));
    const world = JSON.parse(fs.readFileSync(worldPath, "utf8"));
    const hasBaseline = Object.keys(world.baselineOwnership ?? {}).length > 0;
    if (sharesBase) {
      // Without it the conquest-border layer reads the modern geometry as the
      // starting map and outlines the entire board on turn 1.
      assert.ok(hasBaseline, `${id}: borrows the base map with no baseline ownership`);
    } else {
      assert.ok(!hasBaseline, `${id}: carries its own map, so its geometry is already the baseline`);
    }
  }
});

await Promise.all(pending);
console.log(`\n${pass} passed\n`);

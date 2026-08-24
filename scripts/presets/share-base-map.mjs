#!/usr/bin/env node
/*! Open Historia — point eligible scenarios at the shared base map © 2026 Nicholas Krol, MIT (see src/Editor/LICENSE). */
// Run AFTER build-default-map, because the base this compares against is the
// map libraryStore will actually serve — default/regions.geojson — not the seed
// both were cut from. Comparing against the seed would clear a scenario whose
// owners disagree with the file it is about to start borrowing.
//
//   node scripts/presets/share-base-map.mjs            apply
//   node scripts/presets/share-base-map.mjs --dry-run  measure and change nothing
//
// SAFE ORDER, and the order is the whole design:
//   1. plan the overlay, 2. reconstruct the map from base+overlay and compare it
//   feature-for-feature against the real one, 3. write the scenario's overlay,
//   4. backfill every EXISTING GAME built on this scenario, 5. only then remove
//   the file. A game reads regions.geojson from its SCENARIO, not from its own
//   directory (server/libraryStore.js, ensureGameOwnerSchema) — so deleting it
//   before step 4 would change the map under a save in progress.
import fs from "node:fs";
import path from "node:path";
import url from "node:url";
import { indexBase, planOverlay, verifyReconstruction, mergeOverrides } from "./lib/mapOverlay.mjs";

const ROOT = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), "..", "..");
const SCENARIOS = path.join(ROOT, "server", "data", "scenarios");
const GAMES = path.join(ROOT, "server", "data", "games");
const BASE_ID = "default";

const DRY = process.argv.includes("--dry-run");

const readJson = (file, fallback = null) => {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return fallback;
  }
};
const writeJson = (file, value) => fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`, "utf8");
const mb = (bytes) => bytes / 1048576;

const basePath = path.join(SCENARIOS, BASE_ID, "regions.geojson");
if (!fs.existsSync(basePath)) {
  console.error(`[share-base-map] no base map at ${basePath} — run build-default-map first.`);
  process.exit(1);
}
const baseById = indexBase(readJson(basePath, { features: [] }));
console.log(`[share-base-map] base ${BASE_ID}: ${baseById.size} features, ${mb(fs.statSync(basePath).size).toFixed(1)}MB`);
if (DRY) console.log("[share-base-map] DRY RUN — nothing will be written or removed.\n");

// Games are indexed once, by the scenario they were started from, so a preset
// with three saves on it backfills all three.
const gamesByScenario = new Map();
if (fs.existsSync(GAMES)) {
  for (const gameId of fs.readdirSync(GAMES)) {
    const meta = readJson(path.join(GAMES, gameId, "game-instance.json"));
    const scenarioId = meta?.scenarioId;
    if (!scenarioId) continue;
    if (!gamesByScenario.has(scenarioId)) gamesByScenario.set(scenarioId, []);
    gamesByScenario.get(scenarioId).push(gameId);
  }
}

const shared = [];
const kept = [];
let freedBytes = 0;
let gamesBackfilled = 0;

for (const scenarioId of fs.readdirSync(SCENARIOS).sort()) {
  if (scenarioId === BASE_ID) continue;
  const regionsPath = path.join(SCENARIOS, scenarioId, "regions.geojson");
  const worldPath = path.join(SCENARIOS, scenarioId, "world.json");
  if (!fs.existsSync(regionsPath)) {
    // Already sharing from an earlier run. Idempotent, and worth saying out
    // loud: a silent skip here reads identically to a scenario that was never
    // considered.
    //
    // The overlay cannot be recomputed from here — the file it was derived from
    // is gone — so a scenario that somehow arrived in this state WITHOUT a
    // baseline is reported rather than passed over. It means an older run of
    // this script removed the map before baselines existed, and the fix is a
    // full rebuild-all, which regenerates every map and re-plans from scratch.
    const world = readJson(worldPath, {});
    const hasBaseline = Object.keys(world.baselineOwnership ?? {}).length > 0;
    console.log(`  ${scenarioId.padEnd(18)} already shared${hasBaseline ? "" : "  ⚠ NO BASELINE — run rebuild-all"}`);
    shared.push(scenarioId);
    continue;
  }

  const collection = readJson(regionsPath, { features: [] });
  const features = collection.features ?? [];
  const plan = planOverlay(features, baseById);

  if (!plan.eligible) {
    kept.push({ scenarioId, reason: plan.reason });
    console.log(`  ${scenarioId.padEnd(18)} KEEPS its map — ${plan.reason}`);
    continue;
  }

  const check = verifyReconstruction(features, baseById, plan.overrides, { unownedIds: plan.unownedIds });
  if (check.count > 0) {
    // The plan said yes and the reconstruction disagreed. Refuse, loudly: this
    // is the case where sharing would silently redraw a board.
    kept.push({ scenarioId, reason: `reconstruction mismatch ×${check.count}` });
    console.log(`  ${scenarioId.padEnd(18)} KEEPS its map — reconstruction mismatch ×${check.count}`);
    for (const m of check.mismatches) console.log(`      ${m.id}: expected "${m.expected}", base+overlay gives "${m.actual}"`);
    continue;
  }

  const bytes = fs.statSync(regionsPath).size;
  const world = readJson(worldPath, {});
  const { merged, added } = mergeOverrides(world.regionOwnershipOverrides, plan.overrides);
  const games = gamesByScenario.get(scenarioId) ?? [];
  const gameAdds = [];

  if (!DRY) {
    world.regionOwnershipOverrides = merged;
    // THE STARTING MAP, kept apart from the live one.
    //
    // Nations.jsx draws a conquest border wherever a live override disagrees
    // with the served geometry's own owner. On a board with its own map those
    // two agree at turn 1, so the layer is empty until something is taken. On a
    // BORROWED base they disagree everywhere by construction — the geometry says
    // 2026 and the overlay says 1962 — and TNO would open with 3,948 conquest
    // borders drawn across a world at peace. Measured, not feared.
    //
    // So the baseline the layer compares against is recorded here, once, and
    // never mutated: ~100KB against the 64MB the board stopped shipping.
    world.baselineOwnership = plan.overrides;
    if (plan.unownedIds.length) world.unownedRegionIds = plan.unownedIds;
    writeJson(worldPath, world);
    // Saves first, file last.
    for (const gameId of games) {
      const gameWorldPath = path.join(GAMES, gameId, "world.json");
      const gameWorld = readJson(gameWorldPath);
      if (!gameWorld) continue;
      const gameMerge = mergeOverrides(gameWorld.regionOwnershipOverrides, plan.overrides);
      gameWorld.regionOwnershipOverrides = gameMerge.merged;
      // A save in progress needs the baseline too, or every region its scenario
      // ever differed from the modern world reads as conquered ground.
      gameWorld.baselineOwnership = { ...plan.overrides, ...(gameWorld.baselineOwnership ?? {}) };
      // Union, never replace: a region the player has since taken carries an
      // override, and normalizeWorldState drops it from this list on read.
      if (plan.unownedIds.length) {
        gameWorld.unownedRegionIds = [...new Set([...(gameWorld.unownedRegionIds ?? []), ...plan.unownedIds])].sort();
      }
      writeJson(gameWorldPath, gameWorld);
      gameAdds.push(`${gameId}+${gameMerge.added}`);
      gamesBackfilled += 1;
    }
    fs.rmSync(regionsPath);
    // The far lane's simplified copy goes with it (added 2026-08-20). A board
    // that borrows the base map must not keep a private second copy of the
    // geometry — it would be 27MB of a map the store never serves, and the far
    // lane would draw THIS board's shapes under the base board's ownership.
    const farPath = path.join(SCENARIOS, scenarioId, "regions-far.geojson");
    if (fs.existsSync(farPath)) fs.rmSync(farPath);
  } else {
    for (const gameId of games) {
      const gameWorld = readJson(path.join(GAMES, gameId, "world.json"));
      if (!gameWorld) continue;
      gameAdds.push(`${gameId}+${mergeOverrides(gameWorld.regionOwnershipOverrides, plan.overrides).added}`);
    }
  }

  freedBytes += bytes;
  shared.push(scenarioId);
  const gameNote = gameAdds.length ? ` · games ${gameAdds.join(" ")}` : "";
  console.log(
    `  ${scenarioId.padEnd(18)} shared — overlay ${plan.overrideCount} entries (+${added} new)`
    + `${plan.unownedIds.length ? ` · ${plan.unownedIds.length} unowned` : ""}, freed ${mb(bytes).toFixed(0)}MB${gameNote}`,
  );
}

console.log(`\n[share-base-map] ${shared.length} sharing · ${kept.length} keeping their own map`);
if (kept.length) {
  console.log("  keeping (nothing here is a size decision — every one is a correctness blocker):");
  for (const k of kept) console.log(`    ${k.scenarioId.padEnd(18)} ${k.reason}`);
}
console.log(`[share-base-map] freed ${mb(freedBytes).toFixed(0)}MB${DRY ? " (dry run — not actually freed)" : ""} · ${gamesBackfilled} game(s) backfilled`);

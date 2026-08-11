#!/usr/bin/env node
/*! Open Historia — give the dotless Ghanaian ids their dot, everywhere at once © 2026 Nicholas Krol, MIT (see src/Editor/LICENSE). */
// THE FLEET-WIDE HALF OF THE SEED-HYGIENE BATCH, done as its own migration.
//
//   node scripts/regions/remap-dotless-ids.mjs            measure, change nothing
//   node scripts/regions/remap-dotless-ids.mjs --apply    write everything back
//
// Sixteen Ghanaian level-2 rows came out of their merge as `GHA13_2` where
// GADM's grammar says `GHA.13_2`. Fixing the seed alone was refused in the
// hygiene batch for a reason that still holds: the id is a KEY, and the fleet
// holds facts under it — ownership overrides in fifteen scenarios, baselines in
// the shared boards, unowned lists on the historical ones, and sixteen facts in
// each LIVE SAVE, one of which (wwii-1935-buildup) has play-diverged values
// ("British Empire" where the scenario says "British West Africa"). Renaming
// the feature without renaming every key orphans all of it — the exact
// "one file learned, the fleet collapsed" failure this repo has now had twice.
//
// So one migration renames the id and every reference in the same run:
//   · seed feature ids                    (public/assets/regions-seed.geojson)
//   · every scenario's world.json         (overrides · baseline · unowned)
//   · every LIVE SAVE's world.json        (same three — the values are campaign
//                                          state and are preserved verbatim)
//   · wwii-1939's own regions.geojson     (the one board with its own map; it
//                                          is NOT rebuilt, because a rebuild
//                                          would collide with the in-flight
//                                          F-3 era-geometry work)
// default/regions.geojson is NOT edited here: it is regenerated from the seed
// by build-default-map, which is the standard path. Run afterwards:
//
//   node scripts/build-default-map.mjs && node scripts/presets/share-base-map.mjs
//
// The rename is mechanical on purpose — `GHA` + digit → `GHA.` + digit, values
// untouched — so the whole migration is reversible by the inverse rename.
import fs from "node:fs";
import path from "node:path";
import url from "node:url";

const ROOT = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), "..", "..");
const APPLY = process.argv.includes("--apply");

const DOTLESS = /^([A-Z]{3})(\d)/;
const remapId = (id) => String(id).replace(DOTLESS, "$1.$2");
const needsRemap = (id) => DOTLESS.test(String(id));

const report = [];
let touchedFiles = 0;

const remapKeys = (obj) => {
  if (!obj || typeof obj !== "object") return 0;
  let count = 0;
  for (const key of Object.keys(obj)) {
    if (!needsRemap(key)) continue;
    const next = remapId(key);
    // A collision would silently merge two facts; refuse loudly instead.
    if (next in obj && obj[next] !== obj[key]) {
      throw new Error(`collision: ${key} → ${next} already holds "${obj[next]}" (incoming "${obj[key]}")`);
    }
    obj[next] = obj[key];
    delete obj[key];
    count += 1;
  }
  return count;
};

const remapWorld = (file, label) => {
  if (!fs.existsSync(file)) return;
  const world = JSON.parse(fs.readFileSync(file, "utf8"));
  let count = 0;
  count += remapKeys(world.regionOwnershipOverrides);
  count += remapKeys(world.baselineOwnership);
  if (Array.isArray(world.unownedRegionIds)) {
    for (let i = 0; i < world.unownedRegionIds.length; i += 1) {
      if (needsRemap(world.unownedRegionIds[i])) {
        world.unownedRegionIds[i] = remapId(world.unownedRegionIds[i]);
        count += 1;
      }
    }
  }
  if (count === 0) return;
  report.push(`  ${label.padEnd(42)} ${count} key(s)`);
  touchedFiles += 1;
  if (APPLY) fs.writeFileSync(file, `${JSON.stringify(world, null, 2)}\n`, "utf8");
};

const remapGeojson = (file, label) => {
  if (!fs.existsSync(file)) return;
  const collection = JSON.parse(fs.readFileSync(file, "utf8"));
  let count = 0;
  for (const feature of collection.features ?? []) {
    const id = feature?.properties?.id;
    if (id != null && needsRemap(id)) {
      feature.properties.id = remapId(id);
      count += 1;
    }
  }
  if (count === 0) return;
  report.push(`  ${label.padEnd(42)} ${count} feature id(s)`);
  touchedFiles += 1;
  if (APPLY) fs.writeFileSync(file, `${JSON.stringify(collection)}\n`, "utf8");
};

// ── the sweep ────────────────────────────────────────────────────────────────
remapGeojson(path.join(ROOT, "public", "assets", "regions-seed.geojson"), "seed");

const SCENARIOS = path.join(ROOT, "server", "data", "scenarios");
for (const id of fs.readdirSync(SCENARIOS)) {
  remapWorld(path.join(SCENARIOS, id, "world.json"), `scenario ${id}`);
  // Only boards carrying their own map have this file; default's is regenerated
  // from the seed instead (see header).
  if (id !== "default") remapGeojson(path.join(SCENARIOS, id, "regions.geojson"), `scenario ${id} (own map)`);
}

const GAMES = path.join(ROOT, "server", "data", "games");
if (fs.existsSync(GAMES)) {
  for (const id of fs.readdirSync(GAMES)) {
    remapWorld(path.join(GAMES, id, "world.json"), `LIVE SAVE ${id}`);
  }
}

console.log(`\n[remap-dotless-ids] ${APPLY ? "applied" : "dry run"} — ${touchedFiles} file(s):`);
for (const line of report) console.log(line);
if (!APPLY) {
  console.log("\n  pass --apply to write, then:");
  console.log("  node scripts/build-default-map.mjs && node scripts/presets/share-base-map.mjs");
}

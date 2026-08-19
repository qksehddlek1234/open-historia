// An ownership row must name a region the board actually draws.
//
// The countryAssignments expansion in build-preset.mjs used to emit whatever
// GID_1 the pmtiles catalog listed, and the catalog lags the seed: for
// countries the seed subdivided (China 31 L1 → 344 prefectures, Spain, France,
// Greece, Finland, Belgium, the UK) the old L1 ids name nothing any fill lane
// reads — paint keys off geojson features (Nations.jsx ownerByRegionId), so
// the rows were invisible on screen while conquest and stat logic saw regions
// that do not exist. victorian-1836 carried 81, the fleet carried ~1,500
// (measured 2026-08-19). The builder now TRANSLATES a catalog id the seed
// dropped (L2 parent-segment / ONS / NUTS / the Ghana dot repair) and prints
// anything it must drop.
//
// scripts/presets/audit-owner-rows.mjs is the detector; this pins its
// classification on synthetic data (the built boards are gitignored, so a test
// reading them would pass here and fail on a fresh clone) plus the two source
// pins that keep the builder honest.
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import url from "node:url";
import { auditOwnerRows } from "../scripts/presets/audit-owner-rows.mjs";

let pass = 0;
const test = (name, fn) => { fn(); pass += 1; console.log(`  ok  ${name}`); };
const ROOT = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), "..");

console.log("\nAn ownership row must name a region the board draws");

test("a row the geojson knows is healthy, wherever the catalog stands", () => {
  const { ghost, tileOnly } = auditOwnerRows(
    { "CHN.10.1_1": "Qing Dynasty", "SVK.1_1": "Habsburg Monarchy" },
    new Set(["CHN.10.1_1", "SVK.1_1"]),
    new Set(["SVK.1_1"]),
  );
  assert.deepEqual(ghost, []);
  assert.deepEqual(tileOnly, []);
});

test("a row only the tile catalog knows is a logic ghost, and says which kind", () => {
  const { ghost, tileOnly } = auditOwnerRows(
    { "CHN.10_1": "Qing Dynasty", "XXX.1_1": "Nowhereland" },
    new Set(["CHN.10.1_1"]),
    new Set(["CHN.10_1"]),
  );
  // CHN.10_1: the seed replaced it with prefectures — tile-drawable, geojson-blind.
  assert.deepEqual(tileOnly, ["CHN.10_1"]);
  // XXX.1_1: nothing anywhere knows it — dead weight outright.
  assert.deepEqual(ghost, ["XXX.1_1"]);
});

test("the builder translates catalog ids instead of emitting them raw", () => {
  const src = fs.readFileSync(path.join(ROOT, "scripts", "presets", "build-preset.mjs"), "utf8");
  // The seed filter and the printed drop list — remove either and the ghosts
  // return silently on the next rebuild.
  assert.match(src, /catalogGhostDrops/,
    "an untranslatable catalog id must be dropped WITH ITS NAME PRINTED, never silently");
  assert.match(src, /expandRegionKey\(gid1\)\.filter\(\(t\) => seedIds\.has\(t\)\)/,
    "countryAssignments expansion must translate catalog ids through the shared resolver and keep only seed-known targets");
  // The Ghana dot repair: "GHA13_2" is the catalog's malformation of "GHA.13_2".
  // Dropping instead of repairing would leave Ghana's table empty on five boards.
  assert.match(src, /replace\(\/\^\(\[A-Z\]\{3\}\)\(\?=\\d\)\//,
    "the missing-dot catalog family (GHA13_2) must be repaired, not dropped");
});

console.log(`\n${pass} passed\n`);

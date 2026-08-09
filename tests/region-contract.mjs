// A region is a unit of SOVEREIGNTY, not of area — and on our own boards that
// distinction is load-bearing. The 1935 build has Britain at 46 regions, China
// at 33, and EIGHT polities owning exactly one region each (the Shanxi,
// Xinjiang, Guangxi, Yunnan and Shandong cliques, Tibet, Mengjiang, the Chinese
// Soviet Republic) — plus Ethiopia. Without the contract, "took a region" reads
// as the same event in both cases and a border clash annexes a country.
//
// Mined from the original's own WWII preset rules (its public page), stated in
// our own words, and attached at BUILD time so one wording fixes thirteen specs.
import assert from "node:assert/strict";
import fs from "node:fs";

let pass = 0;
const test = (name, fn) => { fn(); pass += 1; console.log(`  ok  ${name}`); };

const { REGION_CONTRACT, HISTORICAL_PRIOR } = await import("../scripts/presets/lib/regionContract.mjs");

const scenarioRules = (id) => {
  const path = new URL(`../server/data/scenarios/${id}/world.json`, import.meta.url);
  if (!fs.existsSync(path)) return null; // preset folders are build products
  return String(JSON.parse(fs.readFileSync(path, "utf8")).simulationRules ?? "");
};

const PRESETS = [
  "bronze-1200bc", "roman-117", "medieval-1200", "mongol-1300", "magna-1444",
  "colonial-1650", "napoleonic-1804", "victorian-1836", "ww1-1914",
  "wwii-1935", "wwii-1939", "coldwar-1946", "millennium-2000",
];

test("the contract states the single-region rule in both directions", () => {
  assert.match(REGION_CONTRACT, /that region IS the whole country/);
  assert.match(REGION_CONTRACT, /entire country has actually been occupied/);
  // …and the other side, or every advance becomes a conquest.
  assert.match(REGION_CONTRACT, /a front-line advance, not a conquest/);
});

test("it rules out the two transfer failures a front produces", () => {
  assert.match(REGION_CONTRACT, /never a distant region with untaken ground behind it/);
  assert.match(REGION_CONTRACT, /transfer EVERY region it has actually overrun/);
});

test("occupation is distinguished from annexation, with a polity as the remedy", () => {
  assert.match(REGION_CONTRACT, /OCCUPATION IS NOT ANNEXATION/);
  assert.match(REGION_CONTRACT, /create that polity rather than painting the ground/);
});

test("every built preset carries both clauses", () => {
  for (const id of PRESETS) {
    const rules = scenarioRules(id);
    if (rules === null) continue;
    assert.ok(rules.includes("HOW REGIONS WORK HERE"), `${id} carries the region contract`);
    assert.ok(rules.includes("EVERYTHING BEFORE THE START DATE"), `${id} carries the historical prior`);
    // The preset's OWN rules must survive in front of it.
    assert.ok(rules.indexOf("HOW REGIONS WORK HERE") > 200, `${id} keeps its own rules first`);
  }
});

test("the boards this protects really do have single-region polities", () => {
  // THIS USED TO READ THE 1935 BOARD AND FIND EIGHT. It finds none there now:
  // China and India were subdivided to prefecture and district level, and the
  // cliques that held one province each hold ten to twenty-seven prefectures.
  // The contract is not stale — the CASE simply moved to the older boards,
  // where a one-region polity is a small kingdom rather than a warlord. Measured
  // 2026-08-09: magna-1444 6, colonial-1650 3, mongol-1300 3, napoleonic-1804 3,
  // victorian-1836 2, medieval-1200 1, bronze-1200bc 1.
  const boards = new Map();
  for (const id of fs.readdirSync(new URL("../server/data/scenarios/", import.meta.url))) {
    const path = new URL(`../server/data/scenarios/${id}/regions.geojson`, import.meta.url);
    if (!fs.existsSync(path)) continue;
    const counts = new Map();
    for (const feature of JSON.parse(fs.readFileSync(path, "utf8")).features ?? []) {
      const owner = feature.properties?.owner;
      if (owner) counts.set(owner, (counts.get(owner) ?? 0) + 1);
    }
    boards.set(id, counts);
  }
  if (boards.size === 0) return; // preset folders are build products

  const withSingles = [...boards].filter(([, counts]) =>
    [...counts.values()].some((n) => n === 1));
  assert.ok(withSingles.length >= 3,
    `a one-region polity should still exist somewhere; found on ${withSingles.length} board(s)`);

  // And the spread the contract actually exists for, which subdividing made
  // WIDER rather than narrower: the 1935 board runs from Tibet's handful to the
  // Raj's hundreds.
  for (const id of ["wwii-1935", "wwii-1939"]) {
    const counts = boards.get(id);
    if (!counts) continue;
    const values = [...counts.values()];
    assert.ok(Math.max(...values) > 100, `${id} should have polities with hundreds of regions`);
    assert.ok(Math.min(...values) < 10, `${id} should still have polities with a handful`);
  }
});

test("a spec can opt out, so the contract is never a straitjacket", () => {
  const builder = fs.readFileSync(new URL("../scripts/presets/build-preset.mjs", import.meta.url), "utf8");
  assert.match(builder, /spec\.regionContract === false/);
  assert.match(builder, /spec\.historicalPrior === false/);
});

console.log(`\n${pass} passed\n`);

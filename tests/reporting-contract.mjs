// WHAT THE ORIGINAL'S BEST SYSTEM PRESETS DEMAND AND WE NEVER ASKED FOR.
//
// From the 2026-08-09 re-audit. Comparing rule lengths spec by spec found three
// boards where the original carries several times our text, and the difference
// turned out to be specific obligations rather than padding:
//   Victorian 1836 — ours 2,641 · original 13,771
//   1946           — ours 2,203 · original 7,790  ("the textbook system preset")
//   Millennium     — ours 2,679 · original 8,060
//
// Three of those obligations generalise to every board and are now a shared
// contract. The rest are engine features and are recorded as backlog in the
// module's own comment rather than faked in prose.
import assert from "node:assert/strict";
import fs from "node:fs";

let pass = 0;
const test = (name, fn) => { fn(); pass += 1; console.log(`  ok  ${name}`); };

const { REPORTING_CONTRACT } = await import("../scripts/presets/lib/reportingContract.mjs");
const BUILD = fs.readFileSync(new URL("../scripts/presets/build-preset.mjs", import.meta.url), "utf8");
const MODULE = fs.readFileSync(new URL("../scripts/presets/lib/reportingContract.mjs", import.meta.url), "utf8");

test("A BATTLE IS REPORTED WITH NUMBERS, at the period's own precision", () => {
  assert.match(REPORTING_CONTRACT, /A BATTLE IS REPORTED WITH NUMBERS/);
  assert.match(REPORTING_CONTRACT, /what each side committed and what each side lost/);
  // The reason, which is the part a model actually needs: consistency across
  // turns, not decoration.
  assert.match(REPORTING_CONTRACT, /Keep the arithmetic consistent from\s+\+?\s*"?turn to turn/);
  assert.match(REPORTING_CONTRACT, /twenty\s+"?\s*\+?\s*"?turns of adjectives/);
});

test("…and a contested figure is attributed rather than asserted", () => {
  assert.match(REPORTING_CONTRACT, /contested or\s+"?\s*\+?\s*"?propagandised, say whose figure it is/);
});

test("A WAR ENDS IN A NAMED TREATY — because later turns need something to invoke", () => {
  assert.match(REPORTING_CONTRACT, /Treaty of <place>/);
  assert.match(REPORTING_CONTRACT, /invoke, revise, evade or resent/);
  // An armistice is not a treaty; calling one a treaty invents a settlement.
  assert.match(REPORTING_CONTRACT, /armistice or ceasefire that settles\s+"?\s*\+?\s*"?nothing is NOT a treaty/);
});

test("A TURN IS MOSTLY BUT NOT ONLY THE PLAYER'S — both failure modes named", () => {
  assert.match(REPORTING_CONTRACT, /two thirds/);
  assert.match(REPORTING_CONTRACT, /one third/);
  assert.match(REPORTING_CONTRACT, /quietly deleted\s+"?\s*\+?\s*"?the world/);
  assert.match(REPORTING_CONTRACT, /deleted the player/);
});

test("what was NOT taken is written down, not silently dropped", () => {
  // 1946's five-tier ranking, its Budget stat and its "(27/30)" strength
  // notation are engine features. Prose that pretends otherwise would put two
  // scoring systems at odds with each other.
  assert.match(MODULE, /Deliberately NOT taken/);
  assert.match(MODULE, /five-tier/);
  assert.match(MODULE, /Budget stat/);
  assert.match(MODULE, /\(27\/30\)/);
});

test("the builder attaches it, and a preset can opt out", () => {
  assert.match(BUILD, /import \{ REPORTING_CONTRACT \} from "\.\/lib\/reportingContract\.mjs"/);
  assert.match(BUILD, /spec\.reportingContract === false \? "" : REPORTING_CONTRACT/);
});

test("every built board carries it", () => {
  const dir = new URL("../server/data/scenarios/", import.meta.url);
  if (!fs.existsSync(dir)) return; // scenario folders are build products
  let checked = 0;
  for (const id of fs.readdirSync(dir)) {
    if (id === "default") continue; // the shipped base scenario, not a preset
    const path = new URL(`../server/data/scenarios/${id}/world.json`, import.meta.url);
    if (!fs.existsSync(path)) continue;
    const world = JSON.parse(fs.readFileSync(path, "utf8"));
    if (!world.simulationRules) continue;
    assert.match(world.simulationRules, /A BATTLE IS REPORTED WITH NUMBERS/, id);
    checked += 1;
  }
  assert.ok(checked >= 10, `expected the fleet, checked ${checked}`);
});

console.log(`\n${pass} passed\n`);

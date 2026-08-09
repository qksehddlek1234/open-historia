// THREE THINGS THE ORIGINAL DOES AT THE EDGES OF A TURN, AND WE DID NOT.
//
// From the World War II++ audit (docs/analysis/wwii-plus-plus-audit.md):
//   1. Occupations are NAMED, "<Occupier> Occupation of <Occupied>", so the
//      land is giveable back without reconstructing who used to own it.
//   2. Every turn ends with one card listing what is already on the calendar,
//      with the time left on each — so a player can price a jump BEFORE making
//      it instead of finding out afterwards that they skipped an election.
//   3. A blocked historical plan does not evaporate; it looks for another
//      route. The original names three WWII cases outright.
import assert from "node:assert/strict";
import fs from "node:fs";

let pass = 0;
const test = (name, fn) => { fn(); pass += 1; console.log(`  ok  ${name}`); };

const read = (rel) => fs.readFileSync(new URL(`../${rel}`, import.meta.url), "utf8");
const { REGION_CONTRACT } = await import("../scripts/presets/lib/regionContract.mjs");
const BUILD = read("scripts/presets/build-preset.mjs");
// The battle and treaty clauses moved OUT of simulationRules into a call-time
// injection for the jump tasks, and the calendar card became a pass of its own —
// see docs/analysis/contract-ab-2026-08-09.md.
const GAMEPLAY = read("src/Game/AI/gameplay.js");

// ---- 1. occupation naming -----------------------------------------------------------

test("AN OCCUPATION IS NAMED THE SAME WAY EVERY TIME", () => {
  assert.match(REGION_CONTRACT, /<Occupier> Occupation of <Occupied>/);
  // The reason, not just the rule: the name is what makes the land returnable.
  assert.match(REGION_CONTRACT, /what makes the land giveable back/);
});

test("…but a named puppet regime keeps its own name", () => {
  // "Vichy France" must not become "German Occupation of France" — the
  // convention is for the ordinary case, and the original's own timeline is
  // full of the exceptions.
  assert.match(REGION_CONTRACT, /Vichy France/);
  assert.match(REGION_CONTRACT, /the convention is for the ordinary case/);
});

// ---- 2. the calendar card moved out ---------------------------------------------------
//
// It used to be pinned here as prose in the rules. It is a pass of its own now
// (runtime/scheduledCard.js + the scheduledEvents task) because prose never got
// the 12B to emit it — see tests/scheduled-card.mjs and the A/B write-up.

test("THE CARD IS NO LONGER PROSE IN THE RULES", () => {
  assert.ok(!/import \{ SCHEDULED_EVENTS \}/.test(BUILD), "the builder no longer imports it");
  assert.ok(!/: SCHEDULED_EVENTS,/.test(BUILD), "nor appends it to every task's rules");
  assert.match(GAMEPLAY, /runJsonTask\("scheduledEvents"/, "it is a pass now");
  // The battle and treaty clauses stayed as prose but moved to the jump tasks,
  // where they measured better than they did inside the contract block.
  assert.match(GAMEPLAY, /\[Battles Are Reported With Numbers\]/);
  assert.match(GAMEPLAY, /\[Named Treaties\]/);
});

// ---- 3. blocked history ---------------------------------------------------------------

// These read the ASSEMBLED rules string, not the source: the specs build their
// rules by concatenating dozens of quoted fragments, so a source-level regex
// breaks on wherever the line happened to wrap. What reaches the model is the
// joined value, and that is what is worth pinning.
const rulesOf = async (id) =>
  (await import(`../scripts/presets/${id}.spec.mjs`)).default.simulationRules;
const RULES_35 = await rulesOf("wwii-1935");
const RULES_39 = await rulesOf("wwii-1939");

test("A BLOCKED PLAN LOOKS FOR ANOTHER ROUTE — both WWII boards say so", () => {
  for (const [id, rules] of [["wwii-1935", RULES_35], ["wwii-1939", RULES_39]]) {
    assert.match(rules, /WHEN HISTORY IS BLOCKED, IT DOES NOT EVAPORATE/, id);
    // The generalisation matters more than the named cases: the player will
    // block something nobody wrote a case for.
    assert.match(rules, /name the interest that was frustrated/, id);
  }
});

test("…the 1935 board carries all three cases; 1939 drops the one it is past", () => {
  assert.match(RULES_35, /Austria refuses the Anschluss/);
  assert.match(RULES_35, /appease the invasion of Poland/);
  assert.match(RULES_35, /three months late into Norway/);
  // The Anschluss is eighteen months past on the 1939 board — a case for it
  // there would be a rule about something that cannot happen.
  assert.ok(!/refuses the Anschluss/.test(RULES_39), "1939 is past the Anschluss");
  assert.match(RULES_39, /appease the invasion of Poland/);
  assert.match(RULES_39, /three months late into Norway/);
});

console.log(`\n${pass} passed\n`);

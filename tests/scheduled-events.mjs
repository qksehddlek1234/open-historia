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
const { SCHEDULED_EVENTS } = await import("../scripts/presets/lib/scheduledEvents.mjs");
const BUILD = read("scripts/presets/build-preset.mjs");

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

// ---- 2. the scheduled events card ---------------------------------------------------

test("EVERY TURN ENDS WITH WHAT IS ALREADY ON THE CALENDAR", () => {
  assert.match(SCHEDULED_EVENTS, /titled exactly "Scheduled Events"/);
  assert.match(SCHEDULED_EVENTS, /<Name> \(<whose>\): <date>: in <time remaining>/);
  assert.match(SCHEDULED_EVENTS, /EVERYTHING GOES IN THE ONE CARD/);
});

test("…it is a notice board, so it may not move the map", () => {
  assert.match(SCHEDULED_EVENTS, /no map changes, no transfers/);
});

test("…an empty calendar prints nothing, and dates may still move", () => {
  assert.match(SCHEDULED_EVENTS, /omit the card entirely rather than printing an empty one/);
  assert.match(SCHEDULED_EVENTS, /FORECASTS, not promises/);
});

test("the builder attaches it, and a preset can opt out", () => {
  assert.match(BUILD, /import \{ SCHEDULED_EVENTS \} from "\.\/lib\/scheduledEvents\.mjs"/);
  assert.match(BUILD, /spec\.scheduledEvents === false \? "" : SCHEDULED_EVENTS/);
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

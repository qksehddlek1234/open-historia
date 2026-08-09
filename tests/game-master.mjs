// THE GAME MASTER WAS A STUB, AND IT WAS BEING HANDED THE WRONG CONTEXT.
//
// Measured against the WWII++ copy (docs/analysis/wwii-plus-plus-audit.md §4):
// of the twelve prompt slots, eleven were ours-or-better and gameMaster was
// 1,006 characters against the original's 7,784 — the one real gap.
//
// The size was the smaller half of the problem. The task interpolates
// HISTORICAL_PRESET_SIMULATION_RULES with no framing, and those rules now carry
// four common contracts written for the SIMULATOR: player sovereignty ("the
// player's country does nothing the player did not order"), the historical
// prior, the end-of-turn scheduled-events card, and the territory-less voices.
// Handed to a GM with no explanation, they say: refuse the player's cheat
// because it is ahistorical, refuse it again because the player's country may
// not act unprompted, and print a calendar card nobody asked for.
import assert from "node:assert/strict";
import fs from "node:fs";

let pass = 0;
const test = (name, fn) => { fn(); pass += 1; console.log(`  ok  ${name}`); };

const PROMPTS = JSON.parse(
  fs.readFileSync(new URL("../src/Game/AI/defaultPrompts.json", import.meta.url), "utf8"),
);
const GM = PROMPTS.tasks.gameMaster;
const { PROMPT_SECTION_DEFINITIONS } = await import("../src/Game/AI/gameplayPrompts.js");

// ---- 1. it is no longer a stub -------------------------------------------------------

test("THE GM PROMPT IS THE SIZE OF THE JOB NOW", () => {
  assert.ok(GM.length > 6000, `gameMaster is ${GM.length} characters`);
});

test("every placeholder it uses is a real helper, and all declared ones are used", () => {
  const used = [...new Set([...GM.matchAll(/\$\{([A-Z_]+)\}/g)].map(([, name]) => name))];
  const declared = PROMPT_SECTION_DEFINITIONS.find((def) => def.key === "gameMaster").helpers;
  for (const name of used) {
    assert.ok(PROMPTS.helpers[name] !== undefined, `${name} is not a helper in the pack`);
    assert.ok(declared.includes(name), `${name} is used but not declared — Settings hides it`);
  }
  for (const name of declared) assert.ok(used.includes(name), `${name} is declared but unused`);
});

// ---- 2. the framing fix ----------------------------------------------------------------

test("IT KNOWS IT IS NOT THE SIMULATOR", () => {
  assert.match(GM, /You are NOT the simulator/);
  assert.match(GM, /you do not advance time/);
});

test("…and it is told the preset rules are CONTEXT, clause by clause", () => {
  assert.match(GM, /The Rules Below Are CONTEXT, Not Orders/);
  // Each of the four contracts build-preset.mjs appends gets named, because a
  // general "these may not apply" is exactly the instruction a 12B ignores.
  assert.match(GM, /Player sovereignty/);
  assert.match(GM, /A GM request IS the player ordering it/);
  assert.match(GM, /Historical fidelity clauses do not bind you/);
  assert.match(GM, /scheduled-events card/);
  assert.match(GM, /Emit NONE of them/);
  assert.match(GM, /Internal: …|Internal: /);
});

test("…and it does not argue with the player", () => {
  assert.match(GM, /Never argue with the request/);
  assert.match(GM, /genuinely harmful outside this game/);
});

// ---- 3. the map contracts a GM edit needs -----------------------------------------------

test("A REGION, NEVER A CITY — the failure that moves nothing and says it did", () => {
  assert.match(GM, /Name A REGION, Never A City/);
  assert.match(GM, /silently discarded/);
  assert.match(GM, /wholeCountry.*true|"wholeCountry": true/);
});

test("…create, update and dissolve are spelled apart", () => {
  assert.match(GM, /UPDATE is the common case/);
  assert.match(GM, /CREATE is for an entity that did not exist/);
  assert.match(GM, /DISSOLVE removes a polity and leaves its regions UNOCCUPIED/);
});

test("…unitOps exist at all now, with the null-island rule", () => {
  // The old prompt named three levers and unitOps was not one of them, so
  // "give me ten divisions at Warsaw" had nowhere to go.
  assert.match(GM, /impacts\.unitOps/);
  assert.match(GM, /0,0 is open ocean off West Africa/);
  assert.match(GM, /PLAIN DECIMAL/);
});

test("…and collateral edits are named as the main danger", () => {
  assert.match(GM, /Change Exactly What Was Asked/);
  assert.match(GM, /a correct edit plus an uninvited one/);
});

test("a vague request is acted on, not interrogated", () => {
  assert.match(GM, /Act; do not interrogate/);
  assert.match(GM, /pick the smaller, more reversible one/);
});

test("the output is a change set and a note, not an event", () => {
  assert.match(GM, /Return JSON only/);
  assert.match(GM, /It is not an event and not a story/);
});

console.log(`\n${pass} passed\n`);

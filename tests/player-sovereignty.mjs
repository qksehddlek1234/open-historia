// Read off World War II++ (natriumchl) — the preset the player actually plays.
// Its rules OPEN with "Absolute Player Sovereignty [NON-NEGOTIABLE]" and name a
// concrete failure: playing Germany, the simulation must not remilitarise the
// Rhineland on its own.
//
// We had "the player is the player, not the head of state", but that governs
// how the player is ADDRESSED — it never said the simulation may not act FOR
// them. On a historical preset that difference is the whole game: an engine
// that helpfully runs the player's country down its historical rails leaves the
// player watching a documentary about themselves.
import assert from "node:assert/strict";
import fs from "node:fs";

let pass = 0;
const test = (name, fn) => { fn(); pass += 1; console.log(`  ok  ${name}`); };

const { PLAYER_SOVEREIGNTY } = await import("../scripts/presets/lib/playerSovereignty.mjs");
const { CONTRACTS, assembleRules } = await import("../src/runtime/simulationContracts.js");

test("the player's own country is inert until ordered", () => {
  assert.match(PLAYER_SOVEREIGNTY, /DOES NOTHING THE PLAYER DID NOT ORDER/);
  assert.match(PLAYER_SOVEREIGNTY, /check that the player actually ordered it this turn/);
  // The trap this closes: "it would have happened historically" is not consent.
  assert.match(PLAYER_SOVEREIGNTY, /however historical it would be/);
});

test("inaction is simulated, not ignored", () => {
  // Silence must cost something, or the rule just freezes the player's country
  // in amber while the world politely waits.
  assert.match(PLAYER_SOVEREIGNTY, /rivals move\s+\+?\s*"?into the vacuum/);
  assert.match(PLAYER_SOVEREIGNTY, /deadlines expire/);
});

test("and the wall stands the other way — no commanding other states", () => {
  assert.match(PLAYER_SOVEREIGNTY, /commands their own state and nobody else's/);
  assert.match(PLAYER_SOVEREIGNTY, /never an instruction that other governments carry out/);
});

test("every built preset carries it, and a spec can opt out", () => {
  const builder = fs.readFileSync(new URL("../scripts/presets/build-preset.mjs", import.meta.url), "utf8");
  // Moved, not removed: build-preset records which contracts a board carries and
  // simulationContracts.js injects them. The opt-out flag is still read, from the
  // one table both sides share.
  assert.match(builder, /CONTRACTS\s*\n?\s*\.filter\(\(contract\) => spec\[contract\.flag\] !== false\)/);
  assert.ok(
    CONTRACTS.some((contract) => contract.flag === "playerSovereignty" && contract.text === PLAYER_SOVEREIGNTY),
    "the playerSovereignty flag must still name this contract",
  );
  for (const id of ["wwii-1935", "magna-1444", "millennium-2000", "roman-117"]) {
    const path = new URL(`../server/data/scenarios/${id}/world.json`, import.meta.url);
    if (!fs.existsSync(path)) continue;
    // ASSEMBLED, not the raw field — the contract is injected per consumer now
    // rather than stored in simulationRules. And asked of a NON-VARIANT
    // consumer: the jump tasks deliberately receive only the other-states half,
    // because their own [Player Agency — critical] section already states the
    // own-state half clause for clause (duplicate-scan.mjs found all four probe
    // phrases there and nowhere else). Asking jumpForward for the full text
    // would demand the duplication this split exists to remove.
    const world = JSON.parse(fs.readFileSync(path, "utf8"));
    const rules = assembleRules(world, "advisor");
    assert.ok(rules.includes("DOES NOTHING THE PLAYER DID NOT ORDER"), `${id} carries it`);
    // The jump task keeps the half its base prompt does NOT say. Losing this
    // was the reason the measured cell could not simply be switched off.
    const jump = assembleRules(world, "jumpForward");
    assert.ok(jump.includes("THE SAME WALL STANDS THE OTHER"), `${id}: the jump keeps the unique half`);
    assert.ok(!jump.includes("DOES NOTHING THE PLAYER DID NOT ORDER"),
      `${id}: the duplicated half must NOT ride the jump prompt twice`);
  }
});

test("1935 gives internal politics only to the countries that get them", () => {
  const path = new URL("../server/data/scenarios/wwii-1935/world.json", import.meta.url);
  if (!fs.existsSync(path)) return;
  const rules = assembleRules(JSON.parse(fs.readFileSync(path, "utf8")), "jumpForward");
  assert.ok(rules.includes("INTERNAL POLITICS"));
  // The player's country only — another polity's factions are its own business.
  assert.match(rules, /Never show another polity's internal/);
  // And the explicit floor: no mechanic gets invented for an unlisted country.
  assert.match(rules, /has no such mechanic and gets none invented for it|no\s+"\s*\+\s*"such mechanic/);
  for (const mechanic of ["STALIN'S", "COLLECTIVE LEADERSHIP", "WARLORD AUTONOMY", "DUCE'S STANDING"]) {
    assert.ok(rules.includes(mechanic), `1935 carries ${mechanic}`);
  }
});

test("THE COUPLING THE VARIANT CREATED: the jump prompt must keep saying the own-state half", () => {
  // The trimmed cell is only safe while the base prompt states the rule the
  // contract no longer sends there. That is now a live dependency between two
  // files that have never needed each other before: if [Player Agency —
  // critical] leaves defaultPrompts.json, the jump tasks lose the own-state
  // rule ENTIRELY — the contract sends them only the other half. This pin is
  // what makes that removal loud instead of silent.
  const prompts = JSON.parse(fs.readFileSync(new URL("../src/Game/AI/defaultPrompts.json", import.meta.url), "utf8"));
  for (const task of ["jumpForward", "autoJumpForward"]) {
    const text = prompts.tasks?.[task] ?? "";
    assert.ok(text.includes("[Player Agency"), `${task} must keep its [Player Agency] section`);
    assert.ok(text.includes("Never execute actions FOR the player"), `${task}: the own-state rule lives HERE now`);
    assert.ok(text.includes("IF AND ONLY IF the player specifically took an action"), `${task}: clause intact`);
  }
  // And the split itself stays byte-exact: the two halves must reassemble into
  // the string every save-migration hash and byte pin was computed from.
  const halves = fs.readFileSync(new URL("../scripts/presets/lib/playerSovereignty.mjs", import.meta.url), "utf8");
  assert.match(halves, /PLAYER_SOVEREIGNTY = PLAYER_SOVEREIGNTY_OWN_STATE \+ PLAYER_SOVEREIGNTY_OTHER_STATES/);
  assert.equal(PLAYER_SOVEREIGNTY.length, 1145, "the concatenation is the exact pre-split string");
});

console.log(`\n${pass} passed\n`);

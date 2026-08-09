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
  assert.match(builder, /spec\.playerSovereignty === false/);
  for (const id of ["wwii-1935", "magna-1444", "millennium-2000", "roman-117"]) {
    const path = new URL(`../server/data/scenarios/${id}/world.json`, import.meta.url);
    if (!fs.existsSync(path)) continue;
    const rules = String(JSON.parse(fs.readFileSync(path, "utf8")).simulationRules ?? "");
    assert.ok(rules.includes("DOES NOTHING THE PLAYER DID NOT ORDER"), `${id} carries it`);
  }
});

test("1935 gives internal politics only to the countries that get them", () => {
  const path = new URL("../server/data/scenarios/wwii-1935/world.json", import.meta.url);
  if (!fs.existsSync(path)) return;
  const rules = String(JSON.parse(fs.readFileSync(path, "utf8")).simulationRules ?? "");
  assert.ok(rules.includes("INTERNAL POLITICS"));
  // The player's country only — another polity's factions are its own business.
  assert.match(rules, /Never show another polity's internal/);
  // And the explicit floor: no mechanic gets invented for an unlisted country.
  assert.match(rules, /has no such mechanic and gets none invented for it|no\s+"\s*\+\s*"such mechanic/);
  for (const mechanic of ["STALIN'S", "COLLECTIVE LEADERSHIP", "WARLORD AUTONOMY", "DUCE'S STANDING"]) {
    assert.ok(rules.includes(mechanic), `1935 carries ${mechanic}`);
  }
});

console.log(`\n${pass} passed\n`);

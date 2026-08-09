// The action board's depth contract. Measured against the original's own 1935
// Soviet board (the player's capture): its options run 4-6 sentences dense with
// named agencies, officials, plants and formations. Ours measured a 71-character
// median of era-less policy prose — "강력한 공공 메시지를 통해 민심을 달래고…",
// an instruction any government in any decade could have issued.
//
// Two halves, and both must hold: the contract is stated in the prompt, AND the
// engine measures what came back (the 12B pattern — a prompt alone does not
// hold). The names it asks for must also be IN the prompt, or asking for them
// is the exact circumstance that invented "총리 스탠리 메이너드 맥도널드".
import assert from "node:assert/strict";
import fs from "node:fs";

let pass = 0;
const test = (name, fn) => { fn(); pass += 1; console.log(`  ok  ${name}`); };

const GAMEPLAY = fs.readFileSync(new URL("../src/Game/AI/gameplay.js", import.meta.url), "utf8");
const SCHEMAS = fs.readFileSync(new URL("../src/Game/AI/gameplaySchemas.js", import.meta.url), "utf8");

test("the depth contract names what a deep action must carry", () => {
  assert.match(GAMEPLAY, /\[Depth\]/);
  assert.match(GAMEPLAY, /3 to 6 sentences/);
  for (const required of ["INSTRUMENT", "PEOPLE", "PLACES and THINGS", "SEQUENCE", "COST"]) {
    assert.ok(GAMEPLAY.includes(required), `the contract names ${required}`);
  }
  // Padding is the failure mode a length rule invites — it is ruled out.
  assert.match(GAMEPLAY, /Never pad/);
  assert.match(GAMEPLAY, /never invented/);
});

test("the engine measures depth instead of trusting the prompt", () => {
  assert.match(GAMEPLAY, /const SHORT_ACTION_CHARS = 140;/);
  assert.match(GAMEPLAY, /const measureDepth =/);
  // One re-ask, then accept: a thin board must never cost the whole board.
  assert.match(GAMEPLAY, /thinShare > 0\.5 && !finalAttempt/);
  assert.match(GAMEPLAY, /a thin board beats no board/);
  // And the accepted result is never silent.
  assert.match(GAMEPLAY, /\[actions\] depth: median/);
});

test("the officeholder record rides with the board, through the same alias chain", () => {
  assert.match(GAMEPLAY, /Who actually holds office on/);
  assert.match(GAMEPLAY, /resolveLeadership\(country, boardDate, \{/);
  assert.match(GAMEPLAY, /seed: record\?\.leadership \?\? null/);
  assert.match(GAMEPLAY, /do NOT invent an officeholder/);
  // Sentinels are not people and must not be offered as names to write with.
  assert.match(GAMEPLAY, /!isRoleSentinel\(value\)/);
});

test("the schema states the shape too, for a model that reads only the schema", () => {
  assert.match(SCHEMAS, /3-6 sentences naming the ministry or agency/);
  assert.match(SCHEMAS, /what it trades away or the risk it accepts/);
});

console.log(`\n${pass} passed\n`);

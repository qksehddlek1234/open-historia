// Round 42's report: "요즘 들어서 AI들이 선 채팅을 안치는거 같네" — measured
// against the live save, 42 rounds had produced FOUR chats and exactly ONE
// AI-initiated approach. The jump's optional diplomaticOutreach list is the
// same 12B dead letter actionOutcomes was; outreach now gets the same remedy.
// Plus: the idle drip loses its designed silence, and a misspelled stat field
// ("internationalReputaion", live twice in round 42) is repaired, not dropped.
import assert from "node:assert/strict";
import fs from "node:fs";
import { GAMEPLAY_SCHEMAS } from "../src/Game/AI/gameplaySchemas.js";
import { applyStatChanges } from "../src/runtime/countryStatLedger.js";

let pass = 0;
const test = (name, fn) => { fn(); pass += 1; console.log(`  ok  ${name}`); };

const GAMEPLAY = fs.readFileSync(new URL("../src/Game/AI/gameplay.js", import.meta.url), "utf8");

console.log("\nWho speaks first is now its own question");

test("the pass has a registered flat schema demanding country, message and reason", () => {
  const schema = GAMEPLAY_SCHEMAS.diplomaticOutreachPass;
  assert.ok(schema, "diplomaticOutreachPass is a registered task schema");
  assert.deepEqual(schema.required, ["outreach"]);
  assert.deepEqual(schema.properties.outreach.items.required, ["country", "title", "message", "reason"]);
});

test("the prompt carries the whole task at call time, empty list allowed", () => {
  const at = GAMEPLAY.indexOf('if (taskKey === "diplomaticOutreachPass")');
  assert.notEqual(at, -1);
  const block = GAMEPLAY.slice(at, at + 3600);
  assert.match(block, /ZERO or ONE approach is the NORMAL period/);
  assert.match(block, /Two is the ceiling, never the default/);
  assert.match(block, /An empty list is a valid answer/);
  assert.match(block, /\[Already waiting on the player\]/);
  assert.match(block, /a demand or an ultimatum is outreach too/);
});

test("the pass runs only when the jump opened no chat, and says so otherwise", () => {
  const at = GAMEPLAY.indexOf("WHO SPEAKS FIRST");
  assert.notEqual(at, -1);
  const block = GAMEPLAY.slice(at, at + 6200);
  assert.match(block, /if \(generatedChats\.length > 0\) \{/);
  assert.match(block, /already opened \$\{generatedChats\.length\} chat\(s\) — no extra outreach pass/);
});

test("a country already waiting on the player's reply is never approached again", () => {
  const at = GAMEPLAY.indexOf("WHO SPEAKS FIRST");
  const block = GAMEPLAY.slice(at, at + 6200);
  assert.match(block, /const lastSpeaker = normalizeString\(chatEntry\?\.messages\?\.at\?\.\(-1\)\?\.speaker\);/);
  assert.match(block, /!waiting\.has\(name\)/);
  assert.match(block, /outreachWaiting: \[\.\.\.waiting\]\.join\(", "\)/);
});

test("Korean answers bridge to listed names, the cap is two, chats are real", () => {
  const at = GAMEPLAY.indexOf("WHO SPEAKS FIRST");
  const block = GAMEPLAY.slice(at, at + 7200);
  assert.match(block, /listedNameFor\.set\(normalizeString\(translateLabel\(candidate\)\), candidate\);/);
  assert.match(block, /approaches\.length >= 2\) continue;/);
  assert.match(block, /source: "outreach"/);
  assert.match(block, /generatedChats\.unshift\(built\);/);
});

test("every outcome of the pass is spoken: sent, declined, dropped, failed", () => {
  const at = GAMEPLAY.indexOf("WHO SPEAKS FIRST");
  const block = GAMEPLAY.slice(at, at + 7200);
  assert.match(block, /reached out first: /);
  assert.match(block, /nobody reached out this period — the model saw no reason/);
  assert.match(block, /dropped an approach from/);
  assert.match(block, /the outreach pass failed; nobody reaches out this period/);
});

console.log("\nThe idle drip no longer fails in silence");

test("a consult that declines, a note that lands, a failure — each gets a line", () => {
  assert.match(GAMEPLAY, /idle consult: nobody sends a note right now/);
  assert.match(GAMEPLAY, /sent an unprompted note/);
  assert.match(GAMEPLAY, /\[diplomacy\] idle outreach attempt failed:/);
});

console.log("\nA misspelled stat field is repaired, not dropped");

test("the live case: internationalReputaion lands on the real field, guarded as usual", () => {
  const result = applyStatChanges({}, [
    { code: "Saudi Arabia", field: "internationalReputaion", value: 67, reason: "정상 외교" },
  ], {
    baselines: { "Saudi Arabia": { indices: { internationalReputation: 64 } } },
  });
  assert.deepEqual(result.repaired, [{ code: "Saudi Arabia", from: "internationalReputaion", to: "internationalReputation" }]);
  assert.equal(result.applied.length, 1);
  assert.equal(result.applied[0].field, "internationalReputation");
  assert.equal(result.dropped.length, 0);
});

test("short fields never fuzzy-match, and the genuinely unknown still drops", () => {
  const result = applyStatChanges({}, [
    { code: "Saudi Arabia", field: "gpd", value: 100 },
    { code: "Saudi Arabia", field: "researchAndDevelopment", value: 50 },
  ], {
    baselines: { "Saudi Arabia": { economy: { gdp: "$800B" } } },
  });
  assert.equal(result.repaired.length, 0);
  assert.equal(result.dropped.length, 2);
  assert.ok(result.dropped.every((row) => row.why === "not a field on the sheet"));
});

test("the console names each repair before the moves", () => {
  assert.match(GAMEPLAY, /repaired \$\{merged\.repaired\.length\} misspelled field name\(s\)/);
});

test("initials land on the one shown country they spell — SK is South Korea here, not Slovakia", () => {
  // Round 44 live: three real changes for "SK" dropped as "no stat sheet".
  // Initials resolve against the sheets the model was SHOWN, and only when
  // exactly one matches.
  const result = applyStatChanges({}, [
    { code: "SK", field: "internalSecurity", value: 91 },
  ], {
    baselines: { "South Korea": { indices: { internalSecurity: 88 } }, "Saudi Arabia": { indices: { internalSecurity: 70 } } },
  });
  assert.equal(result.applied.length, 1);
  assert.equal(result.applied[0].code, "South Korea");
  // Ambiguous initials still refuse: two shown countries spelling the same
  // initials means the token names neither. (Real ISO-2 codes like "SA" for
  // Saudi Arabia resolve EARLIER via the flag layer and never reach initials.)
  const ambiguous = applyStatChanges({}, [
    { code: "NR", field: "internalSecurity", value: 50 },
  ], {
    baselines: { "North Region": { indices: { internalSecurity: 60 } }, "New Republic": { indices: { internalSecurity: 70 } } },
  });
  assert.equal(ambiguous.applied.length, 0);
  assert.equal(ambiguous.dropped.length, 1);
});

console.log(`\n${pass} passed\n`);

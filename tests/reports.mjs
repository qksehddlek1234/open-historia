// Secret reports (Pax parity: the Reports feature). The 12B containment is
// STRUCTURAL, and these pins hold the structure: the schema exposes no impacts
// channel (a report reveals, it never enacts), the pass writes only
// world.secretReports, the normalizer keeps the field alive across every write
// path, and the advisor is the only conversational surface that sees the
// reports.
import assert from "node:assert/strict";
import fs from "node:fs";

let pass = 0;
const test = (name, fn) => { fn(); pass += 1; console.log(`  ok  ${name}`); };

const read = (path) => fs.readFileSync(new URL(path, import.meta.url), "utf8");

const SCHEMAS = read("../src/Game/AI/gameplaySchemas.js");
const GAMEPLAY = read("../src/Game/AI/gameplay.js");
const GAME_STATE = read("../src/runtime/gameState.js");
const MAIN = read("../src/Game/AI/main.jsx");
const ADVISOR_UI = read("../src/Game/GameUI/advisor.jsx");

test("the schema is flat, required, closed — and has NO impacts channel", () => {
  const at = SCHEMAS.indexOf("SECRET_REPORTS_SCHEMA");
  assert.notEqual(at, -1, "schema exported");
  const block = SCHEMAS.slice(at, at + 1600);
  assert.match(block, /required: \["kind", "title", "body", "source"\]/);
  assert.match(block, /additionalProperties: false/);
  // The whole reveal-never-enact contract in one line: no field of the schema
  // may carry a state change. If someone adds "impacts" here, this fires.
  assert.ok(!/impacts/.test(block), "no impacts channel in the reports schema");
  assert.match(SCHEMAS, /secretReportsPass: SECRET_REPORTS_SCHEMA/, "registered for runJsonTask");
});

test("the pass carries its whole prompt at call time, with the contract stated", () => {
  assert.match(GAMEPLAY, /taskKey === "secretReportsPass"/);
  assert.match(GAMEPLAY, /A report REVEALS, it never ENACTS/);
  assert.match(GAMEPLAY, /an empty list is a valid answer/i);
  // Difficulty is an intel-quality axis, not an on/off switch.
  assert.match(GAMEPLAY, /reportsQualityDirective/);
  assert.match(GAMEPLAY, /stretched thin/);
});

test("the pass writes world.secretReports and nothing else, and never costs the turn", () => {
  const at = GAMEPLAY.indexOf("SECRET REPORTS (Pax parity");
  assert.notEqual(at, -1, "execution block present");
  const block = GAMEPLAY.slice(at, at + 5200);
  assert.match(block, /fallback: \(\) => \(\{ reports: \[\] \}\)/, "empty period is the safe fallback");
  assert.match(block, /repairPayload: \(raw\) => \(Array\.isArray\(raw\) \? \{ reports: raw \} : raw\)/, "bare-array salvage");
  assert.match(block, /secretReports: \[\.\.\.normalizeArray\(nextWorld\.secretReports\), \.\.\.accepted\]/, "appends, never replaces");
  assert.match(block, /two reports per period is the ceiling/, "cap is logged, not silent");
  assert.match(block, /console\.warn\("\[reports\] the intelligence pass failed/, "failure is contained");
  // Nothing in the block touches events, units, relations or stats.
  for (const forbidden of ["diplomaticRelations:", "countryStats:", "nextEvents.push", "units:"]) {
    assert.ok(!block.includes(forbidden), `the pass must not write ${forbidden}`);
  }
});

test("normalizeWorldState carries secretReports by name (the new-field trap)", () => {
  assert.match(GAME_STATE, /const normalizeSecretReports =/);
  assert.match(GAME_STATE, /secretReports: normalizeSecretReports\(nextWorld\.secretReports\)/);
  // Malformed rows drop; an off-list kind folds to "intelligence".
  assert.match(GAME_STATE, /SECRET_REPORT_KINDS\.has\(kind\) \? kind : "intelligence"/);
});

test("the advisor sees the reports; the injection labels them private", () => {
  assert.match(MAIN, /\[Secret reports known ONLY to the player's government/);
  assert.match(MAIN, /worldData\?\.secretReports/);
});

test("the Reports pane exists as the advisor's fourth tab", () => {
  assert.match(ADVISOR_UI, /const ReportsPane =/);
  assert.match(ADVISOR_UI, /label="Reports"/);
  assert.match(ADVISOR_UI, /world\.secretReports\.slice\(\)\.reverse\(\)/);
});

test("the new pane strings ship Korean in both packs", () => {
  for (const path of ["../public/lang/ko.json", "../server/data/lang/ko.json"]) {
    const pack = JSON.parse(read(path));
    for (const key of ["Reports", "Secret", "Military", "Political", "Economic", "Intelligence", "Foreign"]) {
      assert.ok(pack[key], `${path} has "${key}"`);
    }
  }
});

console.log(`\n${pass} passed\n`);

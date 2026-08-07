// A 12B does not know who governs — round 11 live: China's deputy came back
// "국무원총리 장관정 (장가정)" (an invention wearing a hedge) with 리커창 in
// office, after a direct re-ask. The engine's answer to a knowledge failure is
// a record, not a better plea: leaderReference.js ships the modern era's real
// officeholders, term-windowed, and the sheet task consults it wherever the
// campaign has no recorded person of its own.
import assert from "node:assert/strict";
import fs from "node:fs";
import { referenceLeadership, referencePoliticalFigures } from "../src/runtime/leaderReference.js";

let pass = 0;
const test = (name, fn) => { fn(); pass += 1; console.log(`  ok  ${name}`); };

const GAMEPLAY = fs.readFileSync(new URL("../src/Game/AI/gameplay.js", import.meta.url), "utf8");

console.log("\nThe record knows the officeholders the model invents");

test("the live failure cases resolve to the real people", () => {
  assert.equal(referenceLeadership("China", "2016-09-27").deputy, "국무원 총리 리커창");
  assert.equal(referenceLeadership("South Korea", "2016-09-27").deputy, "국무총리 황교안");
  assert.equal(referenceLeadership("Russia", "2016-09-27").deputy, "총리 드미트리 메드베데프");
  assert.equal(referenceLeadership("Australia", "2016-09-27").leader, "총리 맬컴 턴불");
  assert.equal(referenceLeadership("Philippines", "2016-09-27").leader, "대통령 로드리고 두테르테");
});

test("term windows are inclusive and a lapsed term stops applying", () => {
  // The Philippines hand over on exactly 2016-06-30.
  assert.equal(referenceLeadership("Philippines", "2016-06-29").leader, "대통령 베니그노 아키노 3세");
  assert.equal(referenceLeadership("Philippines", "2016-07-01").leader, "대통령 로드리고 두테르테");
  // 캐머런 leaves 2016-07-13; the record then says nothing about the UK's
  // leader rather than installing 메이 — successions are the campaign's to
  // make (this campaign made this one through its own timeline event).
  assert.equal(referenceLeadership("United Kingdom", "2016-09-27").leader, undefined);
  assert.equal(referenceLeadership("United Kingdom", "2016-09-27").headOfState, "여왕 엘리자베스 2세");
});

test("a structural absence is itself a fact on record", () => {
  assert.equal(referenceLeadership("South Korea", "2016-09-27").headOfState, "(없음)");
  assert.equal(referenceLeadership("Brazil", "2016-09-27").deputy, "(없음)", "테메르 승계로 부통령 공석");
});

test("uncovered countries and unreadable dates degrade to nothing quietly", () => {
  assert.deepEqual(referenceLeadership("Atlantis", "2016-09-27"), {});
  assert.deepEqual(referenceLeadership("China", "nonsense"), {});
  assert.deepEqual(referenceLeadership("", ""), {});
});

console.log("\nThe palette for divergence — real contenders, never inventions");

test("the era's real contenders surface, window-gated, and vanish once in office", () => {
  const figures2016 = referencePoliticalFigures("South Korea", "2016-09-27");
  assert.ok(figures2016.some((name) => name.startsWith("문재인")), "the era's leading contender is on the palette");
  // Once a contender takes office they move to the officeholder record.
  const figures2018 = referencePoliticalFigures("South Korea", "2018-01-15");
  assert.ok(!figures2018.some((name) => name.startsWith("문재인")), "an inaugurated contender leaves the palette");
  assert.deepEqual(referencePoliticalFigures("Atlantis", "2016-09-27"), []);
});

test("the palette rides in the sheet prompt as a palette, never an instruction", () => {
  assert.match(GAMEPLAY, /MAJOR REAL POLITICAL FIGURES of \$\{target\}/);
  assert.match(GAMEPLAY, /never an invented name/);
  // No validator enforcement exists for figures — grep would find a correction
  // pass if one were added; the record corrects, the palette only offers.
  assert.doesNotMatch(GAMEPLAY, /politicalFigures\[/);
});

console.log("\nThe sheet task actually consults it");

test("wired into prompt, backfill, and the validator's correction pass", () => {
  assert.match(GAMEPLAY, /referenceLeadership\(toCountryName\(statCode\) \|\| normalizeString\(target\), sheetDate\)/);
  assert.match(GAMEPLAY, /OFFICEHOLDERS ON RECORD for \$\{target\}/);
  // Campaign record → era record → honest unknown, in that order.
  assert.match(GAMEPLAY, /\|\| normalizeString\(reference\[field\]\) \|\| "\(미확인\)"/);
  assert.match(GAMEPLAY, /is not the officeholder on record for/);
  // The campaign's own DIFFERENT person always stands — alternate history wins.
  assert.match(GAMEPLAY, /if \(priorOwn && !isRoleSentinel\(priorOwn\) && !sameLeaderPerson\(priorOwn, recorded\)\) continue;/);
});

console.log(`\n${pass} passed\n`);

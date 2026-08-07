// A 12B does not know who governs — round 11 live: China's deputy came back
// "국무원총리 장관정 (장가정)" (an invention wearing a hedge) with 리커창 in
// office, after a direct re-ask. The engine's answer to a knowledge failure is
// a record, not a better plea: leaderReference.js ships the modern era's real
// officeholders, term-windowed, and the sheet task consults it wherever the
// campaign has no recorded person of its own.
import assert from "node:assert/strict";
import fs from "node:fs";
import { REFERENCE, referenceLeadership, referencePoliticalFigures } from "../src/runtime/leaderReference.js";

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
  // The worldwide record carries real successions (캐머런 → 메이 on
  // 2016-07-13) — but ONLY as background truth: the validator consults it
  // solely where the campaign has no recorded person of its own, so a
  // campaign that kept 캐머런 keeps him. (This campaign installed 메이
  // through its own timeline event; record and canon happen to agree.)
  assert.equal(referenceLeadership("United Kingdom", "2016-09-27").leader, "총리 테리사 메이");
  assert.equal(referenceLeadership("United Kingdom", "2016-09-27").headOfState, "여왕 엘리자베스 2세");
});

test("a structural absence is itself a fact on record", () => {
  assert.equal(referenceLeadership("South Korea", "2016-09-27").headOfState, "(없음)");
  assert.equal(referenceLeadership("Brazil", "2016-09-27").deputy, "(없음)", "테메르 승계로 부통령 공석");
});

console.log("\nWorldwide, 2016 → the present day");

test("succession chains hold across the decade — sampled worldwide", () => {
  // 미국: 오바마 → 트럼프 → 바이든 → 트럼프.
  assert.equal(referenceLeadership("United States", "2018-06-01").leader, "대통령 도널드 트럼프");
  assert.equal(referenceLeadership("United States", "2022-06-01").leader, "대통령 조 바이든");
  assert.equal(referenceLeadership("United States", "2025-06-01").leader, "대통령 도널드 트럼프");
  // 한국: 문재인 → 윤석열 → 이재명, 총리 체인 동행.
  assert.equal(referenceLeadership("South Korea", "2019-01-01").leader, "대통령 문재인");
  assert.equal(referenceLeadership("South Korea", "2023-01-01").leader, "대통령 윤석열");
  assert.equal(referenceLeadership("South Korea", "2025-08-01").leader, "대통령 이재명");
  assert.equal(referenceLeadership("South Korea", "2019-01-01").deputy, "국무총리 이낙연");
  // 영국: 메이 → 존슨 → 트러스 → 수낵 → 스타머.
  assert.equal(referenceLeadership("United Kingdom", "2020-01-01").leader, "총리 보리스 존슨");
  assert.equal(referenceLeadership("United Kingdom", "2025-01-01").leader, "총리 키어 스타머");
  assert.equal(referenceLeadership("United Kingdom", "2023-01-01").headOfState, "국왕 찰스 3세");
  // 독일 2025, 시리아 정권 붕괴, 미얀마 쿠데타, 아프간 함락.
  assert.equal(referenceLeadership("Germany", "2025-08-01").leader, "총리 프리드리히 메르츠");
  assert.equal(referenceLeadership("Syria", "2020-01-01").leader, "대통령 바샤르 알아사드");
  assert.equal(referenceLeadership("Myanmar", "2022-01-01").leader, "국가행정평의회 의장 민 아웅 흘라잉");
  assert.equal(referenceLeadership("Afghanistan", "2020-01-01").leader, "대통령 아슈라프 가니");
});

test("the table is genuinely worldwide", () => {
  const countryCount = Object.keys(REFERENCE).length;
  assert.ok(countryCount >= 180, `${countryCount} countries on record (expected ≥ 180)`);
  // High-invention-risk regions are covered with real people.
  assert.equal(referenceLeadership("Nigeria", "2024-01-01").leader, "대통령 볼라 티누부");
  assert.equal(referenceLeadership("Kenya", "2019-01-01").leader, "대통령 우후루 케냐타");
  assert.equal(referenceLeadership("Argentina", "2024-06-01").leader, "대통령 하비에르 밀레이");
  assert.equal(referenceLeadership("Mexico", "2025-01-01").leader, "대통령 클라우디아 셰인바움");
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

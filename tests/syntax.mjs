// The salvage stack fuses two fields into one and the result reads as prose.
// Live: an order whose title was 111 characters with a JSON key in the middle,
// shown on the suggestion board, submitted by the player, and carried in every
// prompt after. 1 of 520 orders — rare, and it reached everything.
import assert from "node:assert/strict";
import fs from "node:fs";
import {
  GLUED_FIELD,
  TRAILING_SCAR,
  repairGluedAction,
  splitGluedFields,
  stripMachineSyntax,
} from "../src/runtime/machineSyntax.js";
import { normalizeActionEntry } from "../src/runtime/gameState.js";

let pass = 0;
const test = (name, fn) => { fn(); pass += 1; console.log(`  ok  ${name}`); };

const STATE = fs.readFileSync(new URL("../src/runtime/gameState.js", import.meta.url), "utf8");
const GAMEPLAY = fs.readFileSync(new URL("../src/Game/AI/gameplay.js", import.meta.url), "utf8");

// The live record, verbatim.
const LIVE_TITLE = '원격지 정밀 타격 모의 훈련", "text": "실제 발사 없이도 K-Shield와의 협력을 통한 동북아 감시망 공유 및 한·미·일 공동 대응 매뉴얼을 주기적으로 게시하여 억제 효과를 극대화하십시오.';
const LIVE_TEXT = "K-Shield 기반의 실시간 정보 공유 채널을 활성화하여, 조기 경보 시 한국과 파트너 모두가 동시에 방어 태세를 갖추는 기계적 자동 반응 체계를 구축하십시오.";

// ---- 1. the live case ---------------------------------------------------------

test("THE LIVE ORDER: a title 111 characters long with a JSON key inside it", () => {
  assert.equal(LIVE_TITLE.length, 111);
  assert.match(LIVE_TITLE, GLUED_FIELD);
  assert.ok(!TRAILING_SCAR.test(LIVE_TITLE), "and the end-anchored cleaner never saw it — the scar is in the middle");
});

test("THE FIX: it splits into the two fields it always was", () => {
  const split = splitGluedFields(LIVE_TITLE);
  assert.equal(split.key, "text");
  assert.equal(split.head, "원격지 정밀 타격 모의 훈련");
  assert.match(split.tail, /^실제 발사 없이도 K-Shield/);
  assert.match(split.tail, /극대화하십시오\.$/);
});

test("…and the body the record already had is KEPT, not overwritten", () => {
  // On the live case that body turned out to be a SECOND order the same salvage
  // had swallowed. Dropping it would be the quiet loss this file exists to stop.
  const repaired = repairGluedAction({ title: LIVE_TITLE, text: LIVE_TEXT });
  assert.equal(repaired.title, "원격지 정밀 타격 모의 훈련");
  assert.match(repaired.text, /^실제 발사 없이도/);
  assert.ok(repaired.text.includes(LIVE_TEXT), "both halves survive");
});

test("…and when there was no body, the tail simply becomes it", () => {
  const repaired = repairGluedAction({ title: LIVE_TITLE, text: "" });
  assert.equal(repaired.text, splitGluedFields(LIVE_TITLE).tail);
  assert.ok(!repaired.text.includes('"text"'));
});

test("a body that already equals the tail is not doubled", () => {
  const tail = splitGluedFields(LIVE_TITLE).tail;
  assert.equal(repairGluedAction({ title: LIVE_TITLE, text: tail }).text, tail);
});

// ---- 2. what must NOT be torn in half -------------------------------------------

test("ORDINARY KOREAN WITH A QUOTE AND A COLON IS LEFT ALONE", () => {
  for (const clean of [
    '대통령은 "국가핵무력 완성"을 선언했다',
    '그는 "가자", 라고 말했다',
    "목표: 반도체 공급망 자립",
    '"블루 카펫" 계획: 동남아 항만 확보',
    "K-Shield 해상 안보 (2단계)",
  ]) {
    assert.equal(splitGluedFields(clean), null, clean);
    assert.equal(repairGluedAction({ title: clean, text: "본문" }), null);
  }
});

test("…it needs ALL the parts — a quote, a comma, a QUOTED key, a colon, a quote", () => {
  assert.equal(splitGluedFields('제목", text: "본문'), null, "unquoted key");
  assert.equal(splitGluedFields('제목" "text": "본문'), null, "no comma");
  assert.equal(splitGluedFields('제목", "text" "본문'), null, "no colon");
  assert.equal(splitGluedFields('제목", "text": 본문'), null, "no opening quote");
});

test("half a repair is worse than none", () => {
  assert.equal(splitGluedFields('", "text": "본문'), null, "no title left");
  assert.equal(splitGluedFields('제목", "text": "'), null, "no body left");
  assert.equal(splitGluedFields(""), null);
  assert.equal(splitGluedFields(null), null);
});

test("a key of a plausible length, so a stray colon in a sentence is not one", () => {
  assert.equal(splitGluedFields('제목", "a": "본문'), null, "one letter is not a field name");
  assert.ok(splitGluedFields('제목", "rawInput": "본문'), "a real one is");
});

// ---- 3. the trailing scar still works, unchanged ---------------------------------

test("THE OTHER SHAPE is cut, because nothing follows it", () => {
  assert.equal(stripMachineSyntax('핵심 반도체 클러스터에 대한 강력한 보안 조치",[actionIds'),
    "핵심 반도체 클러스터에 대한 강력한 보안 조치");
  assert.equal(stripMachineSyntax("강원(KOR.6_1) 및 경상(KOR.9_1)에 거점을 세웠다"), "강원 및 경상에 거점을 세웠다");
});

test("…and never hands back an empty string", () => {
  assert.equal(stripMachineSyntax('",[actionIds'), '",[actionIds');
  assert.equal(stripMachineSyntax("(KOR.6_1)"), "(KOR.6_1)");
  assert.equal(stripMachineSyntax(""), "");
});

// ---- 4. wired where every order passes ------------------------------------------

test("EVERY ORDER COMES THROUGH normalizeActionEntry, so that is where it sits", () => {
  // Suggested, hand-typed, AI-refined, or read back from a save that already
  // holds one — repairing at the brainstormer would have missed three of those.
  const fixed = normalizeActionEntry({ title: LIVE_TITLE, text: LIVE_TEXT, id: "a1" });
  assert.equal(fixed.title, "원격지 정밀 타격 모의 훈련");
  assert.ok(!fixed.title.includes('"text"'));
  assert.match(fixed.text, /^실제 발사 없이도/);
  assert.ok(fixed.text.includes(LIVE_TEXT));
});

test("…including a save that already holds the damage — it heals on read", () => {
  const stored = normalizeActionEntry({ id: "a1", status: "resolved", title: LIVE_TITLE, text: LIVE_TEXT, source: "suggested" });
  assert.equal(stored.status, "resolved", "and nothing else about the order changes");
  assert.equal(stored.title, "원격지 정밀 타격 모의 훈련");
});

test("a clean order is untouched, title and body both", () => {
  const clean = normalizeActionEntry({ title: "반도체 공급망 자립", text: "핵심 광물 비축을 자동화하십시오.", id: "a2" });
  assert.equal(clean.title, "반도체 공급망 자립");
  assert.equal(clean.text, "핵심 광물 비축을 자동화하십시오.");
});

test("the repair is announced, not silent", () => {
  assert.match(STATE, /TWO FIELDS THE SALVAGE STACK FUSED INTO ONE\./);
  assert.match(STATE, /\[actions\] repaired an order whose title had/);
});

test("ONE COPY OF THE PATTERNS, not two", () => {
  // collapseForCompare joined the import for the duplicate-founding fold.
  assert.match(GAMEPLAY, /import \{ collapseForCompare, stripMachineSyntax \} from "\.\.\/\.\.\/runtime\/machineSyntax\.js";/);
  assert.ok(!GAMEPLAY.includes("const JSON_SCAR ="), "the event scrubber's private copy is gone");
  assert.ok(!GAMEPLAY.includes("const REGION_ID_IN_PROSE ="));
  assert.match(GAMEPLAY, /MACHINE SYNTAX IN PLAYER-FACING PROSE\./, "and it still runs over events");
});

console.log(`\n${pass} passed`);

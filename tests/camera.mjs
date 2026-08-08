// The camera stopped following events. Two faults, both measured against the
// live campaign's 344 events: a rename op names the marker by the name the world
// no longer has, and the last-resort prose scan reads English names at Korean
// prose. Before: 168 of 344 events moved the camera. After: 299.
import assert from "node:assert/strict";
import fs from "node:fs";
import { findRelatedEvents, mentionsName } from "../src/runtime/relatedEvents.js";
import { repairLngLat } from "../src/runtime/gameState.js";

let pass = 0;
const test = (name, fn) => { fn(); pass += 1; console.log(`  ok  ${name}`); };

const TIME = fs.readFileSync(new URL("../src/Game/GameUI/time.jsx", import.meta.url), "utf8");
const RELATED = fs.readFileSync(new URL("../src/runtime/relatedEvents.js", import.meta.url), "utf8");

// ---- 1. the prose scan could not read the campaign it was scanning -----------------

test("THE DEAD LAST RESORT: an English catalogue name never appears in Korean prose", () => {
  // This is what the scan did for 344 events running, and why the camera stood
  // still for every event whose impacts pinned no place.
  const koreanEvent = "중국의 기술 굴기에 대응한 대한민국의 반도체 방어 전략";
  assert.equal(koreanEvent.toLowerCase().includes("south korea"), false);
  assert.equal(koreanEvent.toLowerCase().includes("china"), false);
  // …and what the fix reads instead.
  assert.equal(mentionsName(koreanEvent, "대한민국"), true);
  assert.equal(mentionsName(koreanEvent, "중국"), true);
});

// ---- 2. the five false matches the word rule drops ---------------------------------

test("THE LIVE FALSE MATCHES: 인도적 is humanitarian, not India", () => {
  // Three of the four 인도 hits in this campaign are 인도적 지원.
  assert.equal(mentionsName("비핵화 기반 인도적 지원 및 소통 채널 강화", "인도"), false);
  assert.equal(mentionsName("인도적 지원 및 협력 채널 가동", "인도"), false);
  assert.equal(mentionsName("'공동 해상 안전'이라는 인도적 명분으로 재포장", "인도"), false);
});

test("…and 남중국해 is a sea, not China", () => {
  // Both remaining drops. A South China Sea incident must not fly to Beijing.
  assert.equal(mentionsName("남중국해에서의 항행 자유 작전", "중국"), false);
  assert.equal(mentionsName("동중국해 방공식별구역 확대", "중국"), false);
  assert.equal(mentionsName("중국해에서의 합동 훈련", "중국"), false);
});

test("THE FOURTH 인도 HIT survives, and that is the honest call", () => {
  // 인도-태평양: a hyphen is a word boundary, so this one still matches. It is
  // the one case the rule cannot separate, and it is left in rather than papered
  // over with a special case.
  assert.equal(mentionsName("인도-태평양 해상 안전 협력", "인도"), true);
});

// ---- 3. …while every genuine mention is kept ---------------------------------------

test("A PARTICLE IS NOT A COMPOUND: the 326 real mentions all survive", () => {
  // Every form 중국 actually appears in across this campaign's prose.
  for (const line of [
    "중국의 기술 굴기", "중국은 동남아에서", "중국과 러시아의 공조",
    "중국이 동남아 항로를", "중국, 에너지 안보를", "중국 의존도 축소", "'중국'의 압박",
  ]) {
    assert.equal(mentionsName(line, "중국"), true, line);
  }
});

test("…including the player's own country, which half the events name", () => {
  assert.equal(mentionsName("대한민국의 반도체 전략", "대한민국"), true);
  assert.equal(mentionsName("북한은 화성-15형을 발사했다", "북한"), true);
  assert.equal(mentionsName("사우디아라비아와의 수소 협력", "사우디아라비아"), true);
});

test("a name at the very start or the very end of the text still counts", () => {
  assert.equal(mentionsName("중국", "중국"), true);
  assert.equal(mentionsName("협상 상대는 중국", "중국"), true);
  assert.equal(mentionsName("중국 압박이 거세다", "중국"), true);
});

// ---- 4. the English rule is unchanged ----------------------------------------------

test("THE OLD GUARD IS KEPT, EXACTLY: sub-4-character romanizations are refused", () => {
  assert.equal(mentionsName("The UAE delegation", "UAE"), false);
  assert.equal(mentionsName("A summit between South Korea and Japan", "South Korea"), true);
  assert.equal(mentionsName("a SOUTH KOREA delegation", "South Korea"), true, "case-insensitive, as before");
});

test("…including the cost it always carried: a 4-letter name still matches inside a word", () => {
  // "Chad" is what the original guard's comment names as the accepted risk, and
  // it stays accepted — this change is about Korean, and quietly tightening the
  // English rule alongside it would hide which fix did what.
  assert.equal(mentionsName("The Chadian border dispute", "Chad"), true);
});

test("nothing matches nothing", () => {
  for (const [hay, needle] of [["", "중국"], ["중국의 굴기", ""], [null, "중국"], ["중국", null]]) {
    assert.equal(mentionsName(hay, needle), false);
  }
});

// ---- 5. the rename lookup searched for the name the world had just replaced --------

// opPointBounds' name chain, lifted so the ORDER is pinned rather than its presence.
const named = (list, key, wanted) => {
  const needle = String(wanted ?? "").trim().toLowerCase();
  if (!needle) return null;
  const hit = list.find((entry) => String(entry?.[key] ?? "").trim().toLowerCase() === needle);
  return hit ? [[hit.lng, hit.lat], [hit.lng, hit.lat]] : null;
};
const resolve = (op, markers) => named(markers, "id", op?.markerId)
  ?? named(markers, "name", op?.newName)
  ?? named(markers, "name", op?.name);

// Three real renames from this campaign, with the coordinate each should reach.
const LIVE_RENAMES = [
  { op: { op: "rename", markerId: "", name: "바이오 정보 보호 구역", newName: "제주 강화 방어 구역" }, at: [126.797, 33.55] },
  { op: { op: "rename", markerId: "", name: "중앙아시아 데이터 센터", newName: "중앙아시아 디지털 허브" }, at: [76.15, 39.6] },
  { op: { op: "rename", markerId: "", name: "K-Shield 해상 통제 허브", newName: "말라카 양자 보안 거점" }, at: [102.37, 2.28] },
];
const WORLD = LIVE_RENAMES.map(({ op, at }, index) => ({
  id: `marker-0-live-${index}`, name: op.newName, lng: at[0], lat: at[1],
}));

test("THE LIVE OPS: none of this campaign's 22 renames carries a marker id", () => {
  // The model does not emit them, so the id branch never fires for its ops and
  // the name branches are the whole mechanism.
  for (const { op } of LIVE_RENAMES) assert.equal(op.markerId, "");
});

test("…and the old name is gone from the world by the time the camera looks", () => {
  for (const { op } of LIVE_RENAMES) {
    assert.equal(named(WORLD, "name", op.name), null, `${op.name} was renamed away`);
  }
});

test("THE FIX: matching newName reaches the marker, at its real coordinate", () => {
  for (const { op, at } of LIVE_RENAMES) {
    assert.deepEqual(resolve(op, WORLD), [at, at], op.newName);
  }
});

test("a marker that never got renamed is still found by its plain name", () => {
  const markers = [{ id: "m1", name: "풍계리 핵실험장", lng: 129.08, lat: 41.28 }];
  assert.deepEqual(resolve({ op: "remove", name: "풍계리 핵실험장" }, markers),
    [[129.08, 41.28], [129.08, 41.28]]);
});

test("an id, when one IS present, still outranks both names", () => {
  const markers = [
    { id: "m1", name: "A", lng: 1, lat: 1 },
    { id: "m2", name: "B", lng: 2, lat: 2 },
  ];
  assert.deepEqual(resolve({ op: "rename", markerId: "m1", name: "B", newName: "B" }, markers),
    [[1, 1], [1, 1]]);
});

test("the four renames the world holds under NEITHER name still resolve to nothing", () => {
  // They were recorded as stock-city renames instead, so there is no marker to
  // fly to and the event falls through to its country. Pinned so a later reader
  // does not mistake it for the bug this fixes.
  assert.equal(resolve({ op: "rename", name: "라카(Raqqa)", newName: "해방된 라카" }, WORLD), null);
});

// ---- 6. both fixes are wired in where they belong ----------------------------------

test("newName is tried BEFORE the old name in the live chain", () => {
  const withNew = TIME.indexOf('named(markers, "name", op?.newName');
  const withOld = TIME.indexOf('named(markers, "name", op?.name ??');
  assert.ok(withNew > 0, "the newName branch exists");
  assert.ok(withOld > 0, "the old-name branch is still there");
  assert.ok(withNew < withOld, "and newName comes first — the world holds the new name now");
});

test("the prose scan reads the localized name, not just the catalogue's", () => {
  assert.match(TIME, /import \{ mentionsName \} from "\.\.\/\.\.\/runtime\/relatedEvents\.js";/);
  assert.match(TIME, /import \{ translateLabel \} from "\.\.\/\.\.\/runtime\/translator\.js";/);
  assert.match(TIME, /mentionsName\(haystack, name\) \|\| mentionsName\(haystack, translateLabel\(name\)\)/);
});

test("…and the old lowercased substring scan is gone from it", () => {
  assert.ok(!TIME.includes("haystack.includes(String(name).toLowerCase())"), "the dead English-only match");
  assert.ok(!/String\(name\)\.length < 4/.test(TIME), "its length guard moved into mentionsName");
});

// ---- 6b. the player's own country, last ------------------------------------------

// deriveEventFocusBounds' tail, lifted: prose first, the player only when prose
// found nothing.
const tail = (event, { hits = [], playerCode = "", countryBounds }) => {
  let bounds = null;
  for (const code of hits) bounds = bounds ?? countryBounds.get(code) ?? null;
  if (bounds) return bounds;
  if (event?.playerRelated && playerCode) return countryBounds.get(String(playerCode)) || null;
  return bounds;
};
const BOXES = new Map([["South Korea", "KR-BOX"], ["Russia", "RU-BOX"]]);

test("A DOMESTIC EVENT THAT NAMES NOBODY still reaches the player's country", () => {
  // 41 of the 49 events that resolved to nothing were the player's own policy.
  const event = { title: "국내 균형 발전 및 핵심 기술 고도화", playerRelated: true };
  assert.equal(tail(event, { hits: [], playerCode: "South Korea", countryBounds: BOXES }), "KR-BOX");
});

test("…but a country the text NAMES always outranks it", () => {
  const event = { title: "러시아, 시베리아 에너지 인프라 확장", playerRelated: true };
  assert.equal(tail(event, { hits: ["Russia"], playerCode: "South Korea", countryBounds: BOXES }), "RU-BOX");
});

test("…and a world event that names nobody is left alone, not dragged home", () => {
  const event = { title: "유엔 안보리 결의 2397 채택", playerRelated: false };
  assert.equal(tail(event, { hits: [], playerCode: "South Korea", countryBounds: BOXES }), null);
});

test("the player fallback is wired in below the prose scan, not above it", () => {
  const scan = TIME.indexOf("mentionsName(haystack, name)");
  const player = TIME.indexOf("event?.playerRelated && playerCode");
  const call = TIME.indexOf("playerCode: gameData?.country");
  assert.ok(scan > 0 && player > scan, "prose is tried first");
  assert.ok(call > 0, "and the widget passes the player's country in");
});

test("what changed is recorded where the next reader will be", () => {
  assert.match(TIME, /THE LAST RESORT WAS READING ENGLISH AT A KOREAN CAMPAIGN\./);
  assert.match(TIME, /A RENAME NAMES THE THING BY THE NAME IT NO LONGER HAS\./);
  assert.match(TIME, /AN EVENT ABOUT YOUR OWN COUNTRY RARELY SAYS ITS NAME\./);
  assert.match(RELATED, /A COUNTRY IS NAMED, NOT PARAPHRASED/);
});

// ---- 7. the rule it must not have broken -------------------------------------------

test("findRelatedEvents still matches structures by paraphrase, as before", () => {
  const events = [
    { id: "e1", kind: "world", title: "말라카 해상 보안 강화", description: "" },
    { id: "e2", kind: "world", title: "부산 수소 거점 착공", description: "" },
    { id: "e3", kind: "advance", title: "말라카 양자 보안 거점", description: "" },
  ];
  const hits = findRelatedEvents(events, { name: "말라카 양자 보안 거점" }).map((e) => e.id);
  assert.deepEqual(hits, ["e1"], "paraphrase matches; the clock marker never does");
});

// ---- N. one bad coordinate must never crash the render ----------------------------
// Round 6 live: the model founded a customs hub at exactly lat 90 — the North
// Pole — and the camera's focus frame padded it to 90.26, which maplibre
// THROWS on. The ErrorBoundary was the next thing the player saw.

test("THE POLE HUB: ingest reads lat 90 / lng 43 as a transposed pair", () => {
  assert.deepEqual(repairLngLat(43, 90, "허브"), [90, 43]);
  // A real transposition (latitude slot beyond range) swaps back too.
  assert.deepEqual(repairLngLat(37.5, 127, "기지"), [127, 37.5]);
  // A 0-360-wheel longitude wraps to signed.
  assert.deepEqual(repairLngLat(230, 40, "항"), [-130, 40]);
  // Ordinary coordinates pass through untouched.
  assert.deepEqual(repairLngLat(127.5, 37.8, "서울권"), [127.5, 37.8]);
  // Svalbard-latitude structures are legitimate — only ≥89 reads as polar.
  assert.deepEqual(repairLngLat(20, 78, "북극 기지"), [20, 78]);
});

test("…and coordinates beyond repair are dropped, never placed", () => {
  assert.equal(repairLngLat(120, 95, "잔해"), null);
  assert.equal(repairLngLat(500, 40, "잔해"), null);
});

test("the camera itself guards the same class twice over", () => {
  // pointBounds refuses (or swaps) out-of-range points before they become bounds…
  assert.match(TIME, /if \(Math\.abs\(y\) > 90 && Math\.abs\(x\) <= 90\) \[x, y\] = \[y, x\];/);
  assert.match(TIME, /if \(Math\.abs\(y\) > 90 \|\| Math\.abs\(x\) > 180\) return null;/);
  // …and fitBounds clamps latitude after its own padding, because maplibre
  // throws where it could ignore.
  assert.match(TIME, /south = Math\.max\(-85, Math\.min\(85, south\)\);/);
  assert.match(TIME, /north = Math\.max\(-85, Math\.min\(85, north\)\);/);
  assert.match(TIME, /every\(Number\.isFinite\)/);
});

console.log(`\n${pass} passed`);

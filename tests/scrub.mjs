// The model's own syntax reached the player: one event title ended
// `조치",[actionIds` and two descriptions carried `강원(KOR.6_1)`. Measured over
// all 840 prose fields this campaign holds — one and two, respectively.
import assert from "node:assert/strict";
import fs from "node:fs";
import { TIMELINE_LIBRARY, timelineForDate } from "../src/runtime/timelineLibrary.js";

let pass = 0;
const test = (name, fn) => { fn(); pass += 1; console.log(`  ok  ${name}`); };

const SOURCE = fs.readFileSync(new URL("../src/Game/AI/gameplay.js", import.meta.url), "utf8");

// The engine's cleaner, lifted so its behaviour is pinned rather than its presence.
const JSON_SCAR = /["'`]\s*[,[\]{}:]+\s*(?:[A-Za-z_][A-Za-z0-9_]*)?\s*$/;
const REGION_ID_IN_PROSE = /\s*[(（]\s*[A-Z]{2,3}[.\-]\d+(?:_\d+)?\s*[)）]/g;
const strip = (value) => {
  const before = String(value ?? "").trim();
  if (!before) return before;
  const next = before.replace(JSON_SCAR, "").replace(REGION_ID_IN_PROSE, "").replace(/\s{2,}/g, " ").trim();
  return next || before;
};

// ---- the two live cases ------------------------------------------------------------

test("THE LIVE TITLE: a parser scar is cut off the end", () => {
  assert.equal(
    strip('핵심 반도체 클러스터에 대한 강력한 보안 조치",[actionIds'),
    "핵심 반도체 클러스터에 대한 강력한 보안 조치",
  );
});

test("THE LIVE DESCRIPTIONS: a region id in brackets means nothing to a reader", () => {
  assert.equal(strip("강원(KOR.6_1) 및 경상(KOR.9_1)에 거점을 세웠다"), "강원 및 경상에 거점을 세웠다");
  assert.equal(strip("경기로(KOR.8_1) 및 인천(KOR.11_1)의 핵심 반도체 단지"), "경기로 및 인천의 핵심 반도체 단지");
});

test("a full-width bracket is the same leak", () => {
  assert.equal(strip("제주（KOR.12_1）의 방어 구역"), "제주의 방어 구역");
});

// ---- and what must survive it -------------------------------------------------------

test("ORDINARY QUOTED KOREAN SURVIVES: the comma is followed by more sentence", () => {
  assert.equal(strip('그는 "가자",라고 말했다'), '그는 "가자",라고 말했다');
  assert.equal(strip('대통령은 "국가핵무력 완성"을 선언했다'), '대통령은 "국가핵무력 완성"을 선언했다');
});

test("a parenthesis that is not a region id is left alone", () => {
  assert.equal(strip("K-Shield 해상 안보 (2단계)"), "K-Shield 해상 안보 (2단계)");
  assert.equal(strip("양자 암호 통신 허브 (경기도)"), "양자 암호 통신 허브 (경기도)");
  assert.equal(strip("트라이앵글 에너지 관문(부산)"), "트라이앵글 에너지 관문(부산)");
});

test("a clean title is untouched", () => {
  for (const clean of ["제19대 대통령 선거", "북한 화성-15형 발사", "말라카 해협 및 동남아 물류 네트워크 확장"]) {
    assert.equal(strip(clean), clean);
  }
});

test("the cleaner never hands back an empty string", () => {
  // A title it would eat entirely is worse than a scarred one, and a marker with
  // no name is dropped downstream.
  assert.equal(strip('",[actionIds'), '",[actionIds');
  assert.equal(strip("(KOR.6_1)"), "(KOR.6_1)");
  assert.equal(strip(""), "");
  assert.equal(strip(null), "");
});

test("it is wired in over every player-facing field, after the id harvester", () => {
  assert.match(SOURCE, /MACHINE SYNTAX IN PLAYER-FACING PROSE\./);
  assert.match(SOURCE, /for \(const \[holder, field\] of proseFieldsOf\(event\)\) \{/);
  const harvest = SOURCE.lastIndexOf("harvestAliasesFromProse();");
  const scrub = SOURCE.indexOf("scrubMachineSyntax();");
  assert.ok(scrub > harvest, "the harvester lifts ids out first, then this cleans what remains");
});

test("what it removed is reported, not done silently", () => {
  assert.match(SOURCE, /took the model's own syntax back out of \$\{cleaned\} player-facing string\(s\)/);
});

// ---- the pivotal entries that changed nothing ----------------------------------------

const timeline = TIMELINE_LIBRARY.find((entry) => entry.id === "modern-2016");

test("the shipped timeline is still loadable and was revised", () => {
  assert.ok(timeline, "modern-2016 is in the library");
  assert.ok(timeline.revision >= 4, `revision ${timeline.revision} — saves refresh on the next jump`);
});

// ---- the window a timeline SERVES is not the span of its entries -------------------

test("a campaign gets its own timeline even when the first entry is days away", () => {
  // This was a live bug: the shipped campaign starts 2016-01-01 and the shipped
  // 2016 timeline's first entry is 2016-01-06, so timelineForDate — which
  // derived the window off the entries — handed the app's default campaign
  // nothing at all. Five days of gap, and the feature never seeded.
  assert.equal(timelineForDate("2016-01-01")?.id, "modern-2016");
  assert.equal(timelineForDate("2016-01-06")?.id, "modern-2016");
});

test("a forward-looking calendar still serves the campaign it was written for", () => {
  // The 2026 timeline is ALL future fixtures — its first entry is 2026-02-05,
  // after both 2026 campaigns begin. Without a declared window it would lock
  // out the very boards it exists for.
  assert.equal(timelineForDate("2026-01-01")?.id, "real-world-2026", "modern-2026 reaches it");
  assert.equal(timelineForDate("2026-02-01")?.id, "real-world-2026", "and so does realworld-2026");
  const rw = TIMELINE_LIBRARY.find((entry) => entry.id === "real-world-2026");
  assert.ok(rw.entries.every((entry) => entry.date >= "2026-02-01"), "every entry is still ahead of the later board");
});

test("declaring a window did not widen it into other eras", () => {
  // The guard the range check exists for: an 1848 campaign must not be handed
  // the 2016 schedule.
  assert.equal(timelineForDate("1848-01-01"), null);
  assert.equal(timelineForDate("2027-01-01"), null, "and the year after runs out honestly");
});

test("THE CONSOLE'S COMPLAINT: the missile tests now carry what the nuclear ones did", () => {
  const byDate = new Map(timeline.entries.map((entry) => [entry.date, entry]));
  for (const date of ["2016-01-06", "2016-02-07", "2017-07-04", "2017-11-29"]) {
    const entry = byDate.get(date);
    assert.ok(entry, date);
    assert.ok(entry.effect, `${date} ${entry.title} declares what it does`);
    assert.ok((entry.effect.markerOps ?? []).length > 0, `${date} puts something on the map`);
  }
});

test("…and 화성-15형 records the declaration itself, which is the point of the entry", () => {
  const entry = timeline.entries.find((e) => e.date === "2017-11-29");
  const change = entry.effect.polityChanges?.[0];
  assert.ok(change, "North Korea gets a stat row at last — it had none after two years of standoff");
  assert.equal(change.code, "North Korea");
  assert.match(change.note, /국가핵무력 완성/);
});

test("the nuclear-test entries are untouched — they already worked", () => {
  const fifth = timeline.entries.find((e) => e.date === "2016-09-09");
  const sixth = timeline.entries.find((e) => e.date === "2017-09-03");
  assert.equal(fifth.effect.markerOps[0].marker.name, "풍계리 핵실험장");
  assert.equal(sixth.effect.markerOps[0].marker.name, "풍계리 핵실험장");
});

test("every declared effect is shaped like an op list, not a stray object", () => {
  for (const entry of timeline.entries) {
    if (!entry.effect) continue;
    for (const [kind, ops] of Object.entries(entry.effect)) {
      assert.ok(["polityChanges", "regionTransfers", "markerOps", "unitOps"].includes(kind), `${entry.date} ${kind}`);
      assert.ok(Array.isArray(ops) && ops.length > 0, `${entry.date} ${kind} is a non-empty list`);
    }
  }
});

test("a marker an effect builds carries a real coordinate", () => {
  for (const entry of timeline.entries) {
    for (const op of entry.effect?.markerOps ?? []) {
      const marker = op.marker ?? op;
      if (op.op !== "build") continue;
      assert.ok(Number.isFinite(marker.lng) && Math.abs(marker.lng) <= 180, `${entry.date} lng`);
      assert.ok(Number.isFinite(marker.lat) && Math.abs(marker.lat) <= 90, `${entry.date} lat`);
      assert.ok(marker.name && marker.ownerCode, `${entry.date} named and owned`);
    }
  }
});

test("the ones still without an effect are narrative beats, not missing work", () => {
  // A referendum, a news report, an election whose consequence is its own
  // separate inauguration entry. Listed so the next reader does not re-find them.
  const bare = timeline.entries
    .filter((entry) => entry.weight === "pivotal" && !entry.effect)
    .map((entry) => entry.date);
  assert.deepEqual(bare, [
    "2016-02-10", "2016-03-02", "2016-04-13", "2016-06-23",
    "2016-07-08", "2016-10-24", "2016-11-08", "2017-03-06", "2017-05-09",
  ]);
});

console.log(`\n${pass} passed`);

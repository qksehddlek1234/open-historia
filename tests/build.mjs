// The map had become a list of announcements. Measured over this campaign's 30
// rounds (two and a half years): 143 structures founded, at least one in EVERY
// round, 116 of them the player's — one every eight days — and not one ever
// closed, cancelled or mothballed.
import assert from "node:assert/strict";
import fs from "node:fs";
import {
  DEFAULT_LEAD_MONTHS,
  LEAD_MONTHS,
  MAX_CONCURRENT_PROJECTS,
  UNDER_CONSTRUCTION,
  addMonths,
  beginConstruction,
  buildPipelineText,
  completeDueProjects,
  isUnderConstruction,
  leadMonthsFor,
  nextSlotDate,
} from "../src/runtime/construction.js";
import { normalizeMarkerEntry } from "../src/runtime/gameState.js";

let pass = 0;
const test = (name, fn) => { fn(); pass += 1; console.log(`  ok  ${name}`); };

const GAMEPLAY = fs.readFileSync(new URL("../src/Game/AI/gameplay.js", import.meta.url), "utf8");
const LAYER = fs.readFileSync(new URL("../src/Game/Map/MarkersLayer.jsx", import.meta.url), "utf8");

// The five structures round 31 opened in a single month, verbatim.
const ROUND_31 = [
  { name: "블루 카펫 통합 항구(베트남)", kind: "port", ownerCode: "South Korea", lng: 106.7, lat: 20.85 },
  { name: "블루 카펫 제1항구(태국)", kind: "port", ownerCode: "South Korea", lng: 100.9, lat: 13.1 },
  { name: "강원 양자-AI 통합 연구소", kind: "research center", ownerCode: "South Korea", lng: 128.2, lat: 37.9 },
  { name: "경상 양자-AI 연구 거점", kind: "research center", ownerCode: "South Korea", lng: 128.7, lat: 36.2 },
  { name: "로봇/양자 스마트 공장 (경상)", kind: "factory", ownerCode: "South Korea", lng: 128.6, lat: 35.9 },
];

// ---- 1. date arithmetic, because everything below rests on it ---------------------

test("adding months rolls the year and never overflows a short one", () => {
  assert.equal(addMonths("2018-06-19", 24), "2020-06-19");
  assert.equal(addMonths("2018-01-31", 1), "2018-02-28", "the 31st of January plus a month is not March");
  assert.equal(addMonths("2016-01-31", 1), "2016-02-29", "…and a leap year is still handled");
  assert.equal(addMonths("2018-12-01", 1), "2019-01-01");
  assert.equal(addMonths("2018-06-19", 0), "2018-06-19");
});

test("…and something that is not a date comes back untouched", () => {
  assert.equal(addMonths("1200 BCE", 12), "1200 BCE");
  assert.equal(addMonths("", 12), "");
});

// ---- 2. how long a thing takes -----------------------------------------------------

test("A PORT IS NOT A RADAR MAST", () => {
  assert.equal(leadMonthsFor("port"), 24);
  assert.equal(leadMonthsFor("power plant"), 24);
  assert.equal(leadMonthsFor("research center"), 12);
  assert.equal(leadMonthsFor("radar station"), 6);
  assert.equal(leadMonthsFor("factory"), 15);
});

test("a kind nobody has catalogued still takes time", () => {
  assert.equal(leadMonthsFor("양자 허브"), DEFAULT_LEAD_MONTHS);
  assert.equal(leadMonthsFor(""), DEFAULT_LEAD_MONTHS);
  assert.equal(leadMonthsFor(undefined), DEFAULT_LEAD_MONTHS);
  assert.equal(leadMonthsFor("PORT"), 24, "case does not decide how long a port takes");
});

test("every lead time is a real number of months, none instant", () => {
  for (const [kind, months] of Object.entries(LEAD_MONTHS)) {
    assert.ok(Number.isInteger(months) && months >= 6, `${kind}: ${months}`);
  }
});

// ---- 3. THE CASE THIS EXISTS FOR ---------------------------------------------------

test("THE LIVE TURN: two overseas ports no longer open the month they are announced", () => {
  const begun = beginConstruction(ROUND_31[0], { markers: [], date: "2018-06-19" });
  assert.equal(begun.marker.status, UNDER_CONSTRUCTION);
  assert.equal(begun.startedAt, "2018-06-19");
  assert.equal(begun.readyAt, "2020-06-19", "a port takes two years, not thirty days");
  assert.equal(begun.marker.foundedAt, "2020-06-19", "founded is when it opens, not when it is announced");
  assert.equal(begun.queued, false);
});

test("…and the whole turn's five sites land on five different dates", () => {
  let markers = [];
  const dates = [];
  for (const marker of ROUND_31) {
    const begun = beginConstruction(marker, { markers, date: "2018-06-19" });
    markers = [...markers, begun.marker];
    dates.push([begun.marker.name.slice(0, 8), begun.readyAt]);
  }
  assert.deepEqual(dates.map(([, date]) => date),
    ["2020-06-19", "2020-06-19", "2019-06-19", "2019-06-19", "2019-09-19"]);
  assert.equal(new Set(dates.map(([, date]) => date)).size, 3, "a pipeline, not a single ribbon-cutting");
});

// ---- 4. the throttle ---------------------------------------------------------------

const running = (count, readyAt = "2020-01-01") => Array.from({ length: count }, (_, index) => ({
  name: `p${index}`, ownerCode: "South Korea", status: UNDER_CONSTRUCTION,
  readyAt: addMonths(readyAt, index),
}));

test("under the cap, work starts today", () => {
  assert.equal(nextSlotDate(running(MAX_CONCURRENT_PROJECTS - 1), "South Korea", "2018-06-19"), "2018-06-19");
  assert.equal(nextSlotDate([], "South Korea", "2018-06-19"), "2018-06-19");
});

test("AT THE CAP, THE NEXT PROJECT WAITS FOR A SLOT — it is not refused", () => {
  const markers = running(MAX_CONCURRENT_PROJECTS);
  const start = nextSlotDate(markers, "South Korea", "2018-06-19");
  assert.equal(start, "2020-01-01", "the first project to finish is when the sixth can start");
  const begun = beginConstruction(ROUND_31[2], { markers, date: "2018-06-19" });
  assert.equal(begun.queued, true);
  assert.equal(begun.startedAt, "2020-01-01");
  assert.equal(begun.readyAt, "2021-01-01");
});

test("…and the queue deepens rather than collapsing", () => {
  const markers = running(MAX_CONCURRENT_PROJECTS + 2);
  const start = nextSlotDate(markers, "South Korea", "2018-06-19");
  assert.equal(start, "2020-03-01", "the third-earliest, because two are already waiting ahead");
});

test("another country's projects never take this one's slots", () => {
  const markers = [...running(MAX_CONCURRENT_PROJECTS).map((m) => ({ ...m, ownerCode: "China" }))];
  assert.equal(nextSlotDate(markers, "South Korea", "2018-06-19"), "2018-06-19");
});

test("a FINISHED structure occupies no slot — only live projects do", () => {
  const finished = Array.from({ length: 90 }, (_, i) => ({ name: `done${i}`, ownerCode: "South Korea" }));
  assert.equal(nextSlotDate(finished, "South Korea", "2018-06-19"), "2018-06-19",
    "99 markers already on the map must not block the 100th");
});

// ---- 5. completion -----------------------------------------------------------------

test("THE RIBBON: a project whose date has come becomes a real building", () => {
  const markers = [
    { name: "항구", ownerCode: "KR", status: UNDER_CONSTRUCTION, startedAt: "2018-06-19", readyAt: "2020-06-19" },
    { name: "연구소", ownerCode: "KR", status: UNDER_CONSTRUCTION, startedAt: "2018-06-19", readyAt: "2019-06-19" },
  ];
  const { markers: after, completed } = completeDueProjects(markers, "2019-07-18");
  assert.deepEqual(completed.map((m) => m.name), ["연구소"]);
  const opened = after.find((m) => m.name === "연구소");
  assert.equal(opened.status, undefined, "no leftover status");
  assert.equal(opened.startedAt, undefined);
  assert.equal(opened.readyAt, undefined);
  assert.equal(opened.foundedAt, "2019-06-19", "and it records when it actually opened");
  assert.ok(isUnderConstruction(after.find((m) => m.name === "항구")), "the port keeps building");
});

test("…exactly on the day, not a day early", () => {
  const one = [{ name: "x", status: UNDER_CONSTRUCTION, readyAt: "2019-06-19" }];
  assert.equal(completeDueProjects(one, "2019-06-18").completed.length, 0);
  assert.equal(completeDueProjects(one, "2019-06-19").completed.length, 1);
});

test("a finished building is never touched again", () => {
  const done = [{ name: "x", foundedAt: "2016-01-01" }];
  const { markers, completed } = completeDueProjects(done, "2030-01-01");
  assert.deepEqual(completed, []);
  assert.deepEqual(markers, done);
});

test("nothing in, nothing out", () => {
  assert.deepEqual(completeDueProjects(null, "2019-01-01"), { markers: [], completed: [] });
});

// ---- 6. the fields survive a round trip through the world ---------------------------

test("THE SAVE KEEPS THE THREE CONSTRUCTION FIELDS, and only those", () => {
  const stored = normalizeMarkerEntry({
    name: "블루 카펫 통합 항구", kind: "port", ownerCode: "South Korea", lng: 106.7, lat: 20.85,
    status: UNDER_CONSTRUCTION, startedAt: "2018-06-19", readyAt: "2020-06-19", foundedAt: "2020-06-19",
  });
  assert.equal(stored.status, UNDER_CONSTRUCTION);
  assert.equal(stored.startedAt, "2018-06-19");
  assert.equal(stored.readyAt, "2020-06-19");
});

test("…and a finished structure carries none of them", () => {
  const stored = normalizeMarkerEntry({ name: "풍계리 핵실험장", kind: "military base", ownerCode: "North Korea", lng: 129.08, lat: 41.28 });
  assert.ok(!("status" in stored), "a scenario's own structures are standing, not being built");
  assert.ok(!("readyAt" in stored));
});

test("a junk status is not smuggled in as construction", () => {
  const stored = normalizeMarkerEntry({ name: "x", lng: 1, lat: 1, status: "whatever", readyAt: "2020-01-01" });
  assert.ok(!("status" in stored));
});

// ---- 7. what the model is told ------------------------------------------------------

test("THE PIPELINE IS SHOWN so a sixth version of the same site is not founded", () => {
  const text = buildPipelineText([
    { name: "블루 카펫 통합 항구", kind: "port", ownerCode: "South Korea", status: UNDER_CONSTRUCTION, startedAt: "2018-06-19", readyAt: "2020-06-19" },
    { name: "강원 양자-AI 통합 연구소", kind: "research center", ownerCode: "South Korea", status: UNDER_CONSTRUCTION, startedAt: "2018-06-19", readyAt: "2019-06-19" },
    { name: "남의 것", kind: "port", ownerCode: "China", status: UNDER_CONSTRUCTION, readyAt: "2019-01-01" },
  ], { ownerCode: "South Korea", date: "2018-06-19" });
  assert.match(text, /2 of 5 construction slots/);
  assert.match(text, /강원 양자-AI 통합 연구소/);
  assert.ok(!text.includes("남의 것"), "another country's works are not the player's pipeline");
  assert.match(text, /3 slot\(s\) free/);
  assert.match(text, /준공 예정 2019-06-19[\s\S]*준공 예정 2020-06-19/, "soonest first");
});

test("…and an empty pipeline says nothing at all", () => {
  assert.equal(buildPipelineText([], { ownerCode: "KR" }), "");
  assert.equal(buildPipelineText([{ name: "done", ownerCode: "KR" }], { ownerCode: "KR" }), "");
});

test("a full pipeline says so plainly", () => {
  assert.match(buildPipelineText(running(MAX_CONCURRENT_PROJECTS), { ownerCode: "South Korea" }), /No slots free/);
});

// ---- 8. wiring ---------------------------------------------------------------------

test("every AI build breaks ground instead of opening", () => {
  assert.match(GAMEPLAY, /GROUND IS BROKEN, NOT RIBBON CUT\./);
  assert.match(GAMEPLAY, /const begun = beginConstruction\(op\.marker, \{/);
  assert.match(GAMEPLAY, /op\.marker = begun\.marker;/);
});

test("…except a scenario timeline's own structures, which are already standing", () => {
  assert.match(GAMEPLAY, /if \(normalizeString\(event\?\.source\) === "timeline"\) continue;/);
});

test("NOTHING IS SILENT: what broke ground, and what is queued behind it", () => {
  assert.match(GAMEPLAY, /\[build\] \$\{all\.length\} project\(s\) broke ground/);
  // Round 8 (the player's Victoria 3 call): the fixed constant became a
  // derived national capacity — the log names the derived number instead.
  assert.match(GAMEPLAY, /wait for one of \$\{buildCapacity\.slots\} slots to free/);
  assert.match(GAMEPLAY, /\[build\] \$\{completed\.length\} project\(s\) came due and opened/);
});

test("a completion is narrated, because the map never changes without an event", () => {
  assert.match(GAMEPLAY, /THE RIBBON, WRITTEN BY THE ENGINE\./);
  assert.match(GAMEPLAY, /freshEvents\.push\(normalizeGeneratedEvent\(\{/);
  assert.match(GAMEPLAY, /개 사업 준공/);
  assert.match(GAMEPLAY, /markers: openedMarkers,/, "and the opened ones are in the world it writes");
});

test("the model is told what a programme leaves behind, and what it costs", () => {
  assert.match(GAMEPLAY, /\[What A Programme Actually Leaves Behind\]/);
  assert.match(GAMEPLAY, /A policy, a doctrine, a standard, a training regime, a law/);
  assert.match(GAMEPLAY, /\[Already Under Construction\]/);
  assert.match(GAMEPLAY, /constructionPipeline: buildPipelineText\(/);
});

test("the map draws an unfinished site as unfinished", () => {
  assert.match(LAYER, /A SITE UNDER CONSTRUCTION IS NOT A SITE YET/);
  assert.match(LAYER, /const buildingOpacity = \["case", \["==", \["get", "building"\], 1\], 0\.45, 1\];/);
  assert.match(LAYER, /"text-field": \["get", "label"\]/);
  assert.equal((LAYER.match(/"text-opacity": buildingOpacity/g) || []).length, 2, "glyph and label both");
});

console.log(`\n${pass} passed`);

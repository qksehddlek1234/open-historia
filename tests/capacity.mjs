// Construction capacity, the Victoria 3 way — the player's round-8 call after
// 21 projects queued against 5 fixed slots and the newest completion landed
// four game-years out. Capacity is a national quantity read from the country's
// own merged sheet, so the player's orders (which move GDP, industry and
// stability through the delta store) feed the pace of their own construction.
import assert from "node:assert/strict";
import {
  MAX_CONCURRENT_PROJECTS,
  beginConstruction,
  buildPipelineText,
  constructionCapacity,
  nextSlotDate,
} from "../src/runtime/construction.js";

let pass = 0;
const test = (name, fn) => { fn(); pass += 1; console.log(`  ok  ${name}`); };

console.log("\nCapacity derives from the sheet the campaign already keeps");

test("the live 2016 sheets land where the player's pick expects", () => {
  // South Korea, live values: the picked expansion was 5 → 8, and the formula
  // is calibrated so exactly these numbers produce it.
  const kr = constructionCapacity({
    stability: 89,
    economy: { gdp: "1조 4100억 달러" },
    gdpBreakdown: { industry: "38%" },
  });
  assert.equal(kr.slots, 8);
  assert.match(kr.why, /GDP/);
  // A superpower runs more; a small or shaky state runs fewer.
  assert.equal(constructionCapacity({ stability: 95, economy: { gdp: "18조 4200억 달러" }, gdpBreakdown: { industry: "19%" } }).slots, 9);
  assert.equal(constructionCapacity({ stability: 75, economy: { gdp: "170억 달러" }, gdpBreakdown: { industry: "40%" } }).slots, 4);
  assert.equal(constructionCapacity({ stability: 85, economy: { gdp: "160.2억 달러" } }).slots, 4);
});

test("no sheet means the old constant, exactly — nothing regresses", () => {
  assert.deepEqual(constructionCapacity(null).slots, MAX_CONCURRENT_PROJECTS);
  assert.deepEqual(constructionCapacity(undefined).slots, MAX_CONCURRENT_PROJECTS);
  assert.equal(constructionCapacity({}).slots, 4, "an empty sheet is a poor state, not a default one");
});

test("collapse and prosperity both bend the number, inside hard bounds", () => {
  const shaky = constructionCapacity({ stability: 20, economy: { gdp: "300억 달러" }, gdpBreakdown: { industry: "10%" } });
  assert.equal(shaky.slots, 2, "clamped at the floor — a state at war with itself still builds SOMETHING");
  const titan = constructionCapacity({ stability: 99, economy: { gdp: "25조 달러" }, gdpBreakdown: { industry: "45%" } });
  assert.equal(titan.slots, 10);
});

test("an unknown GDP gets no bonus, no penalty — and says so", () => {
  // Round 12, live: a malformed regeneration blanked the player's GDP, the
  // blank was stored, and capacity quietly fell 8 → 6 — misread as a
  // stability penalty. Unknown is neutral, and the reason names it.
  const blank = constructionCapacity({ stability: 84, economy: { gdp: "" }, gdpBreakdown: { industry: "37%" } });
  assert.equal(blank.slots, 6);
  assert.match(blank.why, /GDP 미상 — 보너스 없음/);
  // The healed sheet lands back on 8.
  const healed = constructionCapacity({ stability: 84, economy: { gdp: "1조 6400억 달러" }, gdpBreakdown: { industry: "37%" } });
  assert.equal(healed.slots, 8);
});

test("a regeneration's blank can never replace a recorded economy figure", async () => {
  const { readFileSync } = await import("node:fs");
  const src = readFileSync(new URL("../src/Game/AI/gameplay.js", import.meta.url), "utf8");
  assert.match(src, /A BLANK NEVER BEATS A RECORD/);
  assert.match(src, /carried the campaign's own values forward/);
});

console.log("\nThe queue math honours the derived number");

const project = (name, readyAt) => ({ name, ownerCode: "South Korea", status: "under-construction", readyAt });

test("a capacity of 8 seats three more before anyone waits", () => {
  const markers = [
    project("a", "2017-01-01"), project("b", "2017-02-01"), project("c", "2017-03-01"),
    project("d", "2017-04-01"), project("e", "2017-05-01"),
  ];
  // Old law: five running → the sixth waits for the first completion.
  assert.equal(nextSlotDate(markers, "South Korea", "2016-08-01"), "2017-01-01");
  // Derived capacity 8: three seats still open, it starts today.
  assert.equal(nextSlotDate(markers, "South Korea", "2016-08-01", 8), "2016-08-01");
});

test("beginConstruction threads the capacity through to the schedule", () => {
  const markers = [
    project("a", "2017-01-01"), project("b", "2017-02-01"), project("c", "2017-03-01"),
    project("d", "2017-04-01"), project("e", "2017-05-01"),
  ];
  const queuedUnderOld = beginConstruction({ name: "f", kind: "port", ownerCode: "South Korea" }, { markers, date: "2016-08-01" });
  assert.equal(queuedUnderOld.queued, true);
  const seated = beginConstruction({ name: "f", kind: "port", ownerCode: "South Korea" }, { markers, date: "2016-08-01", capacity: 8 });
  assert.equal(seated.queued, false);
  assert.equal(seated.startedAt, "2016-08-01");
});

test("the pipeline text states the derived capacity and its reason", () => {
  const markers = [project("a", "2017-01-01")];
  const text = buildPipelineText(markers, { ownerCode: "South Korea", date: "2016-08-01", capacity: 8, capacityWhy: "GDP 1조 4100억 달러 +2, 산업 38% +1, 안정 89 +1" });
  assert.match(text, /1 of 8 construction slots/);
  assert.match(text, /capacity from national strength: GDP/);
  // And the no-capacity call reads exactly as it always did.
  assert.match(buildPipelineText(markers, { ownerCode: "South Korea", date: "2016-08-01" }), /1 of 5 construction slots/);
});

console.log("\nThe hooks: the numbers finally touch the game (docs/STAT-HOOKS.md)");

import fs from "node:fs";
const GAMEPLAY = fs.readFileSync(new URL("../src/Game/AI/gameplay.js", import.meta.url), "utf8");

test("hook 1: the setback quota reads the player's own order", () => {
  assert.match(GAMEPLAY, /const playerSetbackModulation = \(world, game\)/);
  assert.match(GAMEPLAY, /totalSetbacksOwed\(baseGame\.difficulty, rated\.length, owed\) \+ modulation\.delta/);
  assert.match(GAMEPLAY, /totalSetbacksOwed\(baseGame\.difficulty, unrated\.length, owedBefore\) \+ modulationHere\.delta/);
  // Bands: order helps, disorder hurts, collapse hurts badly — and the
  // modulated quota can never go negative.
  assert.match(GAMEPLAY, /stability >= 85 && security >= 85\) return \{ delta: -1/);
  assert.match(GAMEPLAY, /stability < 25\) return \{ delta: 2/);
  assert.match(GAMEPLAY, /Math\.max\(0, totalSetbacksOwed/);
});

test("hook 2: reputation shapes outreach and the idle drip", () => {
  assert.match(GAMEPLAY, /\[The player's international reputation\]/);
  assert.match(GAMEPLAY, /Below 40: approaches are RARER and harsher/);
  assert.match(GAMEPLAY, /let idleReputationFactor = 1;/);
  assert.match(GAMEPLAY, /chance \* idleReputationFactor/);
  assert.match(GAMEPLAY, /reputation >= 70 \? 1\.5 : reputation < 40 \? 0\.5 : 1/);
});

test("hook 3+4: the player's sheet rides the turn prompts, vulnerabilities named", () => {
  assert.match(GAMEPLAY, /const buildPlayerStatSummaryText = \(bundle\)/);
  assert.match(GAMEPLAY, /playerStatSummary: buildPlayerStatSummaryText\(bundle\)/);
  assert.match(GAMEPLAY, /\[Your Nation's Standing\]/);
  // Sentinels are omitted like the pane hides them; vulnerability only below 50.
  assert.match(GAMEPLAY, /text\.startsWith\("\("\) \? "" : text/);
  assert.match(GAMEPLAY, /food !== null && food < 50/);
  assert.match(GAMEPLAY, /이 의존은 공격면이다/);
});

test("the capacity is wired: founding, pipeline text, and the backlog is loud", () => {
  assert.match(GAMEPLAY, /capacity: buildCapacity\.slots/);
  assert.match(GAMEPLAY, /construction capacity \$\{buildCapacity\.slots\} slot\(s\)/);
  assert.match(GAMEPLAY, /of \$\{buildCapacity\.slots\} slots to free/);
  assert.match(GAMEPLAY, /건설 대기열 적체 \$\{backlogMonths\}개월/);
  assert.match(GAMEPLAY, /\[Construction backlog\]/, "the advisor board raises a year-deep queue");
});

console.log(`\n${pass} passed\n`);

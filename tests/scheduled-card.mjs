// THE CARD THE PROMPT COULD NOT GET THE MODEL TO EMIT, BUILT BY THE ENGINE.
//
// Measured (docs/analysis/contract-ab-2026-08-09.md): the clause produced the
// card 0 times out of 7 sitting in simulationRules, 0 out of 2 as the only
// contract in the prompt, and 1 out of 3 moved to the end of the jump prompt.
// Position helped and never fixed it — which is the signature of a rule #2
// problem: the engine has to do the work, not the prompt ask harder.
//
// So the model answers ONE small question (what is already on the calendar) and
// everything else is here: the ordering, the de-duplication, the "in 1 month
// 7 days" arithmetic and the guarantee that the card exists at all.
import assert from "node:assert/strict";
import fs from "node:fs";

let pass = 0;
const test = (name, fn) => { fn(); pass += 1; console.log(`  ok  ${name}`); };

const { formatInterval, formatScheduledLine, buildScheduledCard } =
  await import("../src/runtime/scheduledCard.js");
const GAMEPLAY = fs.readFileSync(new URL("../src/Game/AI/gameplay.js", import.meta.url), "utf8");
const PROMPTS = JSON.parse(
  fs.readFileSync(new URL("../src/Game/AI/defaultPrompts.json", import.meta.url), "utf8"),
);

// ---- the arithmetic the model kept getting wrong ------------------------------------

test("INTERVALS ARE WHOLE CALENDAR MONTHS, not 30-day blocks", () => {
  assert.equal(formatInterval("1941-06-04", "1941-06-07"), "3 days");
  assert.equal(formatInterval("1941-06-04", "1941-07-11"), "1 month 7 days");
  assert.equal(formatInterval("1941-06-04", "1941-07-04"), "1 month");
  // February is why: 30-day months make "in 2 months" mean a different span
  // depending on where in the year you stand, and a card nobody can trust is
  // worse than no card.
  assert.equal(formatInterval("1939-01-31", "1939-03-31"), "2 months");
  assert.equal(formatInterval("1940-01-31", "1940-02-29"), "29 days");
});

test("…and a year is said as a year", () => {
  assert.equal(formatInterval("1939-09-01", "1941-09-01"), "2 years");
  assert.equal(formatInterval("1939-09-01", "1940-11-15"), "1 year 2 months 14 days");
});

test("…a date that has passed is not a forecast", () => {
  assert.equal(formatInterval("1941-06-07", "1941-06-04"), "now");
  assert.equal(formatInterval("1941-06-07", "1941-06-07"), "now");
  assert.equal(formatInterval("", "1941-06-07"), "");
  assert.equal(formatInterval("1941-06-07", "not a date"), "");
});

// ---- the line ------------------------------------------------------------------------

test("A LINE IS THE ORIGINAL'S OWN SHAPE", () => {
  assert.equal(
    formatScheduledLine({ name: "Next Election", whose: "France", date: "1941-06-07" }, "1941-06-04"),
    "Next Election (France): 1941-06-07: in 3 days",
  );
  // Something nobody owns reads better without an empty bracket pair.
  assert.equal(
    formatScheduledLine({ name: "Montreux Convention takes effect", date: "1936-11-09" }, "1936-08-01"),
    "Montreux Convention takes effect: 1936-11-09: in 3 months 8 days",
  );
  assert.equal(formatScheduledLine({ name: "", date: "1941-06-07" }, "1941-06-04"), "");
  assert.equal(formatScheduledLine({ name: "Something", date: "soon" }, "1941-06-04"), "");
});

// ---- the card ------------------------------------------------------------------------

test("THE CARD IS SORTED, DE-DUPLICATED, AND FUTURE-ONLY", () => {
  const card = buildScheduledCard([
    { name: "Late thing", date: "1941-12-01" },
    { name: "Soon thing", date: "1941-06-10" },
    { name: "Soon thing", date: "1941-06-10" },   // the model repeats itself
    { name: "Already happened", date: "1941-01-01" },
    { name: "Today", date: "1941-06-04" },        // not future
  ], "1941-06-04");
  const lines = card.split("\n");
  assert.equal(lines.length, 2, card);
  assert.match(lines[0], /^Soon thing: 1941-06-10: in 6 days$/);
  assert.match(lines[1], /^Late thing: 1941-12-01: in 5 months 27 days$/);
});

test("…and an empty calendar prints nothing at all", () => {
  assert.equal(buildScheduledCard([], "1941-06-04"), "");
  assert.equal(buildScheduledCard(null, "1941-06-04"), "");
  assert.equal(buildScheduledCard([{ name: "x", date: "1930-01-01" }], "1941-06-04"), "");
  assert.equal(buildScheduledCard([{ name: "x", date: "1950-01-01" }], "not a date"), "");
});

// ---- the wiring ------------------------------------------------------------------------

test("IT IS A PASS OF ITS OWN NOW, and the prose clause is gone", () => {
  assert.ok(PROMPTS.tasks.scheduledEvents, "the task exists");
  assert.match(PROMPTS.tasks.scheduledEvents, /DATE IS ALREADY DETERMINED/);
  // A war that might start is not a calendar entry — the distinction the whole
  // pass turns on.
  assert.match(PROMPTS.tasks.scheduledEvents, /a war that might start is not a calendar entry/);
  assert.match(GAMEPLAY, /runJsonTask\("scheduledEvents"/);
  assert.ok(!GAMEPLAY.includes("[Scheduled Events Card]"),
    "the jump prompt no longer asks for it, or the turn would carry two");
});

test("THE AUTHORED TIMELINE LEADS, and the model only fills the gaps", () => {
  // data/timelines/*.json already holds dated entries a scenario knows about.
  // Asking a 12B to recall them is asking it to guess at data we hold — measured
  // cold it returns one entry, sometimes none, usually the next US election.
  const block = GAMEPLAY.slice(GAMEPLAY.indexOf("AND THE AUTHORED TIMELINE GOES IN FIRST"));
  assert.match(block.slice(0, 1400), /normalizeTimeline\(bundle\.world\?\.periodTimeline\)/);
  assert.match(block.slice(0, 1400), /entry\?\.date\) > stopDate/);
  assert.match(GAMEPLAY, /buildScheduledCard\(\[\.\.\.authored, \.\.\.normalizeArray\(schedulePayload\?\.entries\)\], stopDate\)/);
  // And if the model pass dies the authored rows still print.
  assert.match(GAMEPLAY, /falling back to the authored timeline alone/);
});

test("…and it can never cost the turn", () => {
  const block = GAMEPLAY.slice(GAMEPLAY.indexOf("THE CALENDAR CARD, BUILT BY THE ENGINE"));
  assert.match(block.slice(0, 2600), /try \{/);
  assert.match(block.slice(0, 2600), /the turn is unaffected and simply carries no card/);
  assert.match(block.slice(0, 2600), /timeoutMs: 120000/);
});

console.log(`\n${pass} passed\n`);

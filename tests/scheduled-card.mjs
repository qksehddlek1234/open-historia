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
  // CHANGED, and deliberately. This used to read "29 days", which was not a
  // decision anyone made — it fell out of the overflow bug below: 31 Jan plus
  // one month became 2 March, overshot the target, and the month was dropped.
  // With the arithmetic clamped, 31 January plus one month is 29 February in a
  // leap year, which is exactly what this is. The property the old comment was
  // defending — that a stated interval can be trusted — is now pinned directly
  // by the round-trip test at the bottom of this section.
  assert.equal(formatInterval("1940-01-31", "1940-02-29"), "1 month");
});

test("MONTH-END STARTS DO NOT LOSE DAYS — the overflow Cowork caught", () => {
  // `Date.UTC(2026, 1, 31)` is 3 March in JavaScript, not an error. That silently
  // pushed `settled` PAST the target, made the day count negative, and `days > 0`
  // dropped the day term entirely.
  assert.equal(formatInterval("2026-01-31", "2026-03-01"), "1 month 1 day", "was '1 month' for a 29-day gap");
  // The same overflow with a zero remainder rather than a negative one, which a
  // negative-day guard alone would not have caught: 31 Apr became 1 May exactly.
  assert.equal(formatInterval("2026-03-31", "2026-05-01"), "1 month 1 day", "was '1 month' for a 31-day gap");
  assert.equal(formatInterval("2026-01-30", "2026-03-02"), "1 month 2 days", "was '1 month' for a 31-day gap");
  // Clamping must not invent a remainder where the calendar month lands exactly.
  assert.equal(formatInterval("2026-01-31", "2026-02-28"), "1 month");
  assert.equal(formatInterval("2026-05-31", "2026-06-30"), "1 month");
  assert.equal(formatInterval("2024-01-31", "2024-02-29"), "1 month");
});

test("…and the interval always adds back up to the date it describes", () => {
  // The invariant, swept rather than sampled: take the printed years/months/days,
  // add them to the start date, and land ON the target. Reconstruction here is
  // written out longhand on purpose — it must not borrow the implementation it
  // is checking.
  const clamp = (y, m, d) => {
    const last = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
    return new Date(Date.UTC(y, m, Math.min(d, last)));
  };
  const iso = (date) => date.toISOString().slice(0, 10);
  let checked = 0;
  // Every start day of 2024 (a leap year) against a spread of horizons, which
  // puts every month-end start against every month length.
  for (let startDay = 0; startDay < 366; startDay += 1) {
    const from = new Date(Date.UTC(2024, 0, 1 + startDay));
    for (const horizon of [1, 27, 28, 29, 30, 31, 32, 59, 60, 89, 365, 366, 400]) {
      const to = new Date(from.getTime() + horizon * 86400000);
      const text = formatInterval(iso(from), iso(to));
      assert.doesNotMatch(text, /-\d/, `${iso(from)} → ${iso(to)}: negative term in "${text}"`);
      const years = Number(/(\d+) years?/.exec(text)?.[1] ?? 0);
      const months = Number(/(\d+) months?/.exec(text)?.[1] ?? 0);
      const days = Number(/(\d+) days?/.exec(text)?.[1] ?? 0);
      const rebuilt = clamp(from.getUTCFullYear(), from.getUTCMonth() + years * 12 + months, from.getUTCDate());
      const landed = new Date(rebuilt.getTime() + days * 86400000);
      assert.equal(iso(landed), iso(to), `${iso(from)} → ${iso(to)} printed "${text}", which lands on ${iso(landed)}`);
      checked += 1;
    }
  }
  assert.ok(checked > 4000, `swept ${checked} pairs`);
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
  // The window widened from 1400 when the opt-out gate and its explanation went
  // in between the heading and the code. What is pinned is the ORDER — authored
  // rows are built before the model is asked — not how much comment sits above
  // it, so the window may grow again; the two matches below are the invariant.
  const block = GAMEPLAY.slice(GAMEPLAY.indexOf("AND THE AUTHORED TIMELINE GOES IN FIRST"));
  assert.match(block.slice(0, 2400), /normalizeTimeline\(bundle\.world\?\.periodTimeline\)/);
  assert.match(block.slice(0, 2400), /entry\?\.date\) > stopDate/);
  assert.match(GAMEPLAY, /buildScheduledCard\(\[\.\.\.authored, \.\.\.normalizeArray\(schedulePayload\?\.entries\)\], stopDate\)/);
  // And if the model pass dies the authored rows still print.
  assert.match(GAMEPLAY, /falling back to the authored timeline alone/);
});

test("…and it can never cost the turn", () => {
  // Widened with the pin above, for the same reason and with the same caveat:
  // the invariant is bounded-and-optional (a try, a timeout, no cost on
  // failure), not the distance from the heading to the call.
  const block = GAMEPLAY.slice(GAMEPLAY.indexOf("THE CALENDAR CARD, BUILT BY THE ENGINE"));
  assert.match(block.slice(0, 3600), /try \{/);
  assert.match(block.slice(0, 3600), /the turn is unaffected and simply carries no card/);
  assert.match(block.slice(0, 3600), /timeoutMs: 120000/);
});

console.log(`\n${pass} passed\n`);

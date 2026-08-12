// The period-timeline library, as a set rather than one file at a time.
//
// Four things can go wrong here and only one of them shows up as an error. A
// timeline that overlaps another silently depends on array order; one whose
// actors name nobody on its board silently never marks an entry as the player's;
// one carrying an entry from before its campaign starts silently drops it; and
// one carrying a war silently ends the board. All four are quiet, so they are
// pinned rather than watched for.
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import url from "node:url";
import { TIMELINE_LIBRARY, timelineForDate } from "../src/runtime/timelineLibrary.js";

let pass = 0;
const pending = [];
const test = (name, fn) => { pending.push(Promise.resolve(fn()).then(() => { pass += 1; console.log(`  ok  ${name}`); })); };
const ROOT = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), "..");

const SPECS = path.join(ROOT, "scripts", "presets");
const loadSpecs = async () => {
  const out = [];
  for (const name of fs.readdirSync(SPECS).filter((n) => n.endsWith(".spec.mjs"))) {
    out.push((await import(url.pathToFileURL(path.join(SPECS, name)).href)).default);
  }
  return out;
};

console.log("\nThe library as a set");

test("no two timelines cover the same day", () => {
  // timelineForDate returns the FIRST match, so an overlap makes the answer a
  // function of the array's order instead of a designer's decision.
  const sorted = [...TIMELINE_LIBRARY].sort((a, b) => (a.from < b.from ? -1 : 1));
  for (let i = 1; i < sorted.length; i += 1) {
    const prev = sorted[i - 1];
    const next = sorted[i];
    assert.ok(next.from > prev.to, `${prev.id} (…${prev.to}) overlaps ${next.id} (${next.from}…)`);
  }
});

test("every timeline declares a window, and the window is a window", () => {
  for (const timeline of TIMELINE_LIBRARY) {
    assert.match(timeline.from, /^\d{4}-\d{2}-\d{2}$/, `${timeline.id}: from`);
    assert.match(timeline.to, /^\d{4}-\d{2}-\d{2}$/, `${timeline.id}: to`);
    assert.ok(timeline.from < timeline.to, `${timeline.id}: ${timeline.from} is not before ${timeline.to}`);
    assert.ok(timeline.entries.length > 0, `${timeline.id}: no entries`);
  }
});

console.log("\nWhat a calendar may carry");

test("nothing that reaches the player is a war, an attack or a collapse", () => {
  // Scoped to what is FORESEEABLE, which is the thing that actually reaches
  // them: foreseeableOutlook drops every entry with no `foreseeable` phrasing,
  // so an entry without one is a record of a surprise and may name it plainly.
  // That is how modern-2016 carries a failed coup without spoiling it, and the
  // first draft of this pin — a blanket sweep of every title — called that a
  // violation. The rule was never "the file may not mention a war"; it is
  // "the calendar may not promise one".
  const forbidden = /attack|invasion|war begins|outbreak|bombing|9\/11|September 11|collapse|revolution|coup|남침|봉기|쿠데타|붕괴|개전/i;
  for (const timeline of TIMELINE_LIBRARY) {
    for (const entry of timeline.entries) {
      if (!entry.foreseeable) continue;
      assert.doesNotMatch(entry.title, forbidden, `${timeline.id} ${entry.date} "${entry.title}" is on the calendar and should not be`);
      assert.doesNotMatch(entry.foreseeable, forbidden, `${timeline.id} ${entry.date} foreseeable text promises an outcome`);
    }
  }
});

test("a timeline whose entries are all fixtures says so on every entry", () => {
  // The silent no-op this file exists to stop. An entry with no `foreseeable`
  // NEVER reaches the outlook — not an error, just nothing — so a timeline
  // written entirely of calendar fixtures and shipped without the phrasing is a
  // file that does nothing at all. Every entry of the four boards added for
  // that purpose must carry it.
  for (const id of ["coldwar-1946", "korea-1950", "tno-1962", "coldwar-1989"]) {
    const timeline = TIMELINE_LIBRARY.find((t) => t.id === id);
    assert.ok(timeline, `${id} is in the library`);
    const silent = timeline.entries.filter((entry) => !entry.foreseeable);
    assert.deepEqual(silent.map((e) => `${e.date} ${e.title}`), [], `${id}: entries that would never surface`);
  }
});

test("the two boards whose drama is undated carry none of it", () => {
  // 1950 and 1989 are the strictest cases in the fleet, because the thing the
  // board is ABOUT has a real date that everyone reading this knows.
  const korea = TIMELINE_LIBRARY.find((t) => t.id === "korea-1950");
  const cw89 = TIMELINE_LIBRARY.find((t) => t.id === "coldwar-1989");
  assert.ok(korea && cw89);
  for (const entry of korea.entries) {
    assert.notEqual(entry.date, "1950-06-25", "the 25th of June is not a calendar fixture");
  }
  for (const entry of cw89.entries) {
    for (const date of ["1989-11-09", "1989-06-04", "1989-12-25", "1991-12-25", "1990-10-03"]) {
      assert.notEqual(entry.date, date, `${date} was on nobody's calendar on 1989-01-01`);
    }
  }
});

console.log("\nEvery entry reaches the board it was written for");

test("no entry is dated before the campaign that receives it", () => {
  // buildScheduledCard drops anything not in the future, so a past-dated entry
  // is not an error — it is invisible, which is worse.
  const starts = {
    "coldwar-1946": "1946-03-05",
    "korea-1950": "1950-01-01",
    "tno-1962": "1962-01-01",
    "coldwar-1989": "1989-01-01",
    "millennium-2000": "2000-01-01",
    "real-world-2026": "2026-01-01",
  };
  for (const [id, start] of Object.entries(starts)) {
    const timeline = TIMELINE_LIBRARY.find((t) => t.id === id);
    if (!timeline) continue;
    const stale = timeline.entries.filter((entry) => entry.date < start);
    assert.deepEqual(stale.map((e) => `${e.date} ${e.title}`), [], `${id}: dated before its earliest campaign`);
  }
});

test("every actor names a polity that exists on a board this timeline serves", async () => {
  // An actor that matches nothing never sets playerRelated, so the entry that
  // was written FOR the player reads to them as somebody else's news.
  //
  // Checked against the BUILT board's ownerCodes rather than the spec's declared
  // polities. On a near-modern board most countries are never declared — they
  // keep their modern owner from the seed — so the spec lists the era's
  // exceptions, not the world. Reading the spec here called "United States" an
  // unknown actor on the 2026 board.
  const specs = await loadSpecs();
  const byTimeline = new Map();
  for (const spec of specs) {
    const timeline = timelineForDate(spec.game?.startDate);
    if (!timeline) continue;
    const worldPath = path.join(ROOT, "server", "data", "scenarios", spec.id, "world.json");
    if (!fs.existsSync(worldPath)) continue;
    if (!byTimeline.has(timeline.id)) byTimeline.set(timeline.id, new Set());
    const names = byTimeline.get(timeline.id);
    for (const owner of JSON.parse(fs.readFileSync(worldPath, "utf8")).ownerCodes ?? []) {
      names.add(String(owner).toLowerCase());
    }
  }
  // Supranational bodies are legitimate actors that own no ground. Explicit,
  // so the list cannot quietly become a place to hide typos.
  const SUPRANATIONAL = new Set(["european union", "european community", "united nations", "nato", "warsaw pact"]);
  const unknown = [];
  for (const timeline of TIMELINE_LIBRARY) {
    const names = byTimeline.get(timeline.id);
    if (!names || names.size === 0) continue;
    for (const entry of timeline.entries) {
      for (const actor of entry.actors ?? []) {
        const key = String(actor).toLowerCase();
        if (!names.has(key) && !SUPRANATIONAL.has(key)) unknown.push(`${timeline.id} ${entry.date} "${actor}"`);
      }
    }
  }
  assert.deepEqual(unknown, [], "an actor naming nobody is an entry the player never sees as theirs");
});

console.log("\nThe division of labour, where it was actually applied");

test("TNO states the Smuta dates once — on the timeline, not in the rules", async () => {
  // The board's own principle: WHEN goes on the calendar, HOW TO BEHAVE stays in
  // the rules. The rules kept the behaviour and dropped the four date literals.
  const spec = (await import(url.pathToFileURL(path.join(SPECS, "tno-1962.spec.mjs")).href)).default;
  const rules = spec.simulationRules ?? "";
  for (const date of ["1 April 1963", "1 May 1963", "1 November 1963", "1 March 1964"]) {
    assert.ok(!rules.includes(date), `the rules still print "${date}" — the card would say it twice`);
  }
  assert.match(rules, /SMUTA/, "the behaviour clause itself must stay");
  assert.match(rules, /consolidates, arms and postures/, "including what happens BEFORE the date");
  const timeline = TIMELINE_LIBRARY.find((t) => t.id === "tno-1962");
  assert.deepEqual(
    timeline.entries.map((e) => e.date),
    ["1963-04-01", "1963-05-01", "1963-11-01", "1964-03-01"],
    "and the dates must actually be on the calendar instead",
  );
});

test("a board with no fixtures gets no timeline rather than an invented one", () => {
  // Rome, the Mongols and Magna Mundi have no elections, no treaty deadlines and
  // no Olympics. Inventing fixtures to raise the coverage number would be worse
  // than the gap.
  for (const date of ["0117-01-01", "1300-01-01", "1444-11-11", "1650-01-01", "1836-01-01"]) {
    assert.equal(timelineForDate(date), null, `${date} must not be handed somebody else's calendar`);
  }
});

await Promise.all(pending);
console.log(`\n${pass} passed\n`);

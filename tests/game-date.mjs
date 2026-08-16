// A SCENARIO DATE THAT NO PARSER ACCEPTS IS NOT A DATE.
//
// bronze-1200bc shipped `startDate: "1200 BCE"`. Date.parse returns NaN for it,
// ensureReferenceEra returns before loading anything, and the board resolved 0
// of 24 leaders — not for want of an era pack, but because nothing downstream of
// the parse ever ran. These pins hold the fix and, more importantly, the two
// measured traps inside it.
import assert from "node:assert/strict";
import fs from "node:fs";
import {
  formatGameYear, gameDateLabel, gameYear, isGameDate, parseGameDate,
} from "../src/runtime/gameDate.js";

let pass = 0;
const test = (name, fn) => { fn(); pass += 1; console.log(`  ok  ${name}`); };

console.log("\nThe two traps, measured");

test("A FOUR-DIGIT NEGATIVE YEAR IS THE MIDDLE AGES, NOT THE BRONZE AGE", () => {
  // ISO extended years are sign + SIX digits. "-1200-01-01" is not a Bronze Age
  // date that needs a sign; it is read as an ordinary CE date, so a board
  // "fixed" that way would quietly load the high-medieval pack and seat a
  // European monarch on the Hittite throne.
  assert.equal(new Date(Date.parse("-1200-01-01")).getUTCFullYear(), 1199);
  assert.ok(!isGameDate("-1200-01-01"), "and this module refuses to call it a date");
});

test("ISO COUNTS ASTRONOMICALLY — 1200 BCE IS -1199, NOT -1200", () => {
  // There is a year zero: 0000 is 1 BCE. So BCE year N is the ISO year -(N-1),
  // and writing -001200 for this board would place it in 1201 BCE — a silent
  // one-year error that no screen would ever show.
  assert.equal(new Date(Date.parse("-001199-01-01")).getUTCFullYear(), -1199);
  assert.equal(formatGameYear(-1199), "1200 BCE");
  assert.equal(formatGameYear(-1200), "1201 BCE");
  assert.equal(gameYear("-001199-01-01"), -1199);
});

console.log("\nThe reader the old regexes could not be");

test("…is right on all three of this board's candidate strings", () => {
  // The retired `^(-?\d{1,4})` read "1200 BCE" as +1200 (wrong sign), and the
  // correct extended form as -0011 (wrong magnitude).
  assert.equal(gameYear("1200 BCE"), -1199);
  assert.equal(gameYear("-001199-01-01"), -1199);
  assert.equal(gameYear("1935-12-01"), 1935);
  assert.equal(gameYear("0117-01-01"), 117);
});

test("both machine forms parse; textual dates stay textual", () => {
  assert.ok(Number.isFinite(parseGameDate("-001199-01-01")));
  assert.ok(Number.isFinite(parseGameDate("1935-12-01")));
  assert.ok(Number.isNaN(parseGameDate("1200 BCE")), "the lenient branch still owns text");
  assert.ok(isGameDate("-001199-01-01") && isGameDate("1935-12-01") && !isGameDate("1200 BCE"));
});

console.log("\nThe label is authored, not derived");

test("a scenario's own spelling wins over any formatter", () => {
  assert.equal(gameDateLabel("-001199-01-01", "1200 BCE"), "1200 BCE");
  // Without one, the deep past still reads as a year rather than as -001199.
  assert.equal(gameDateLabel("-001199-01-01"), "1200 BCE");
});

console.log("\nThe wiring");

const read = (rel) => fs.readFileSync(new URL(`../${rel}`, import.meta.url), "utf8");

test("the bronze board carries the machine date AND the label", () => {
  const spec = read("scripts/presets/bronze-1200bc.spec.mjs");
  assert.match(spec, /startDate: "-001199-01-01"/, "the machine value, six digits and off-by-one aware");
  // The ASSIGNMENT, not the word — the spec explains the old value in prose
  // right above the new one, and a bare-string pin fails on the explanation.
  // (Third time today a pin caught its own comment; the rule is now reflex.)
  assert.doesNotMatch(spec, /game: \{[^}]*startDate: "1200 BCE"/, "the unparseable form may not come back");
  assert.match(spec, /dateLabel: "1200 BCE"/, "and the authored spelling rides beside it");
  // The built scenario has to carry it too, or the clock has nothing to show.
  const built = "server/data/scenarios/bronze-1200bc/scenario.json";
  if (fs.existsSync(new URL(`../${built}`, import.meta.url))) {
    assert.equal(JSON.parse(read(built)).dateLabel, "1200 BCE");
  }
});

test("date regexes accept the extended form", () => {
  // A regex that only knows \d{4} rejects every deep-past date and sends it
  // down the textual path the fix exists to leave.
  assert.match(read("src/runtime/periodTimeline.js"), /\[\+-\]\\d\{6\}/);
  assert.match(read("src/runtime/gameState.js"), /\[\+-\]\\d\{6\}/);
});

test("the shared reader replaced the spec-side regex", () => {
  const era = read("scripts/presets/lib/eraSovereignty.mjs");
  assert.match(era, /gameYear\(dateISO\)/, "eraSovereignty asks the shared reader");
  assert.doesNotMatch(era, /\/\^\(-\?\\d\{1,4\}\)\//, "the wrong regex may not return");
});

console.log(`\n${pass} passed\n`);

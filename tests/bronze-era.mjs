// TWELVE EMPTY THRONES ON THE OLDEST BOARD, AND A DATE THAT IS OFF BY ONE.
//
// bronze-1200bc seeded 0 leaders of 12: the era packs began at year 1 and the
// board opens in 1200 BC, so every polity on it went to the model with "(없음)"
// where its ruler should be. That is the roman-117 fault again (classical-era.mjs
// is its pin), one era further back.
//
// The second fault is the one that makes this file worth more than a copy of
// that one. ISO 8601 extended years are ASTRONOMICAL — there is a year zero —
// so 1200 BC is -001199, not -001200. Write a reign as -001200 and it lands on
// 1201 BC; write the whole file that way and every window misses the board's
// opening day by exactly one year, silently, in the direction that looks right.
import assert from "node:assert/strict";
import fs from "node:fs";
import { isRoleSentinel } from "../src/runtime/countryStatLedger.js";
import { ensureReferenceEra, referenceLeadership } from "../src/runtime/leaderReference.js";
import { formatGameYear, gameYear } from "../src/runtime/gameDate.js";

let pass = 0;
const test = (name, fn) => { fn(); pass += 1; console.log(`  ok  ${name}`); };

const read = (rel) => fs.readFileSync(new URL(`../${rel}`, import.meta.url), "utf8");
const REF = read("src/runtime/leaderReference.js");
const SPEC = read("scripts/presets/bronze-1200bc.spec.mjs");
const PACK = read("src/runtime/leaderEras/bronze.js");

// The board's opening day, read from the spec rather than restated here — a
// spec that moves must move this file with it.
//
// Read out of the `game:` block, not off a bare `startDate:`. The spec keeps a
// comment explaining that this board used to carry startDate: "1200 BCE", and a
// looser pattern reads THAT — the broken value, quoted inside the note about
// how it was broken.
const START = /game:\s*\{[^}]*startDate:\s*"([^"]+)"/.exec(SPEC)?.[1] ?? "";

console.log("\nThe Bronze Age is on the record");

await ensureReferenceEra(START);

test("the board opens in 1200 BC, and the ISO date says so", () => {
  assert.equal(START, "-001199-01-01", "1200 BC is -001199 — astronomical years have a zero");
  assert.equal(formatGameYear(gameYear(START)), "1200 BCE");
});

test("the pack is registered before classical, and reaches back past year 1", () => {
  const at = REF.indexOf("const ERA_PACK_LOADERS");
  assert.notEqual(at, -1);
  const block = REF.slice(at, REF.indexOf("];", at));
  assert.match(block, /key: "bronze", from: "-003000-01-01"/);
  assert.ok(block.indexOf('"bronze"') < block.indexOf('"classical"'), "packs are listed oldest first");
  // The loader compares with Date.parse, which is the whole reason an extended
  // year had to be used here rather than a "1200 BC" string.
  assert.ok(Date.parse("-003000-01-01") < Date.parse(START), "the window must actually contain the board");
});

test("every polity the spec declares can be answered", () => {
  // Parsed from the spec, so adding a polity there without an entry here fails
  // in the suite instead of on the board. The voices (Internal:/Domestic:) are
  // not countries and are not leadership rows.
  const block = SPEC.slice(SPEC.indexOf("polities: {"), SPEC.indexOf("countryAssignments"));
  const names = [...block.matchAll(/name: "([^"]+)"/g)].map((m) => m[1])
    .filter((name) => !/^(Internal|Domestic):/.test(name));
  assert.ok(names.length >= 12, `only ${names.length} polities parsed — the reader is wrong, not the spec`);
  const unanswered = names.filter((name) => {
    const row = referenceLeadership(name, START);
    return !row.leader && !row.headOfState;
  });
  assert.deepEqual(unanswered, [], "an empty throne is one the model fills in for itself, every jump");
});

test("…and none of those answers is a sentinel wearing a crown", () => {
  // The roman-117 fault: "(없음)" reads as an answer, ends the alias search, and
  // puts a king on the board with no name. Reused test, not a restated spelling.
  const block = SPEC.slice(SPEC.indexOf("polities: {"), SPEC.indexOf("countryAssignments"));
  for (const [, name] of block.matchAll(/name: "([^"]+)"/g)) {
    if (/^(Internal|Domestic):/.test(name)) continue;
    const value = referenceLeadership(name, START).leader ?? "";
    assert.ok(!isRoleSentinel(value), `${name} answered with a sentinel: ${value}`);
  }
});

console.log("\nEvery window contains the day the board opens");

test("no reign is off by one, in either direction", () => {
  // THE POINT OF THIS FILE. Each window is checked against the board's opening
  // day directly — the failure this catches is a file written in BC years with
  // a minus in front, which puts every ruler one year early.
  const windows = [...PACK.matchAll(/from: "(-\d{6}-\d{2}-\d{2})",\s*\n?\s*until: "(-\d{6}-\d{2}-\d{2})"/g)];
  assert.ok(windows.length >= 12, `only ${windows.length} windows parsed`);
  const day = Date.parse(START);
  for (const [, from, until] of windows) {
    assert.ok(Date.parse(from) <= day && day <= Date.parse(until),
      `${from} → ${until} does not contain ${START} (${formatGameYear(gameYear(from))} → ${formatGameYear(gameYear(until))})`);
  }
});

test("and a year the pack does NOT claim answers with nothing", () => {
  // Windows, not a table that answers every date it is asked about. 900 BC is
  // past every entry here and before the classical pack — honestly uncovered.
  const row = referenceLeadership("Hittite Empire", "-000899-01-01");
  assert.ok(!row.leader, `1200 BC's Great King must not answer for 900 BC: ${row.leader}`);
});

console.log("\nWhat is named is named, and what is not is an office");

test("the five seats the evidence fills, are filled", () => {
  // One line of evidence each, in the pack's comments; here only that the
  // answer is the person and not a hedge.
  assert.match(referenceLeadership("Shang Dynasty", START).leader ?? "", /무정/);
  assert.match(referenceLeadership("Hittite Empire", START).leader ?? "", /슈필룰리우마 2세/);
  assert.match(referenceLeadership("Kassite Babylonia", START).leader ?? "", /아다드슈마우수르/);
  assert.match(referenceLeadership("Middle Assyrian Empire", START).leader ?? "", /아슈르니라리 3세/);
  // Tukulti-Ninurta I is the name one reaches for and he is seven years dead.
  assert.doesNotMatch(referenceLeadership("Middle Assyrian Empire", START).leader ?? "", /투쿨티니누르타/);
});

test("the seven that have no holder on record carry their office and the reason", () => {
  for (const name of ["Mycenaean Kingdoms", "Wilusa", "Alashiya", "Elam", "Libu Tribes", "Kingdom of Shu", "Olmec"]) {
    const value = referenceLeadership(name, START).leader ?? "";
    assert.match(value, /\(/, `${name} must say why its seat is empty`);
    assert.ok(value.length > 12, `${name} is a bare title with no reason attached: ${value}`);
  }
  // The Linear B case, stated: the title is written thousands of times and the
  // name never once.
  assert.match(referenceLeadership("Mycenaean Kingdoms", START).leader ?? "", /와낙스/);
  // And no epic names, from either end of the world.
  const all = Object.values(["Wilusa", "Mycenaean Kingdoms", "Kingdom of Shu"]
    .map((n) => referenceLeadership(n, START).leader ?? "")).join(" ");
  assert.doesNotMatch(all, /프리아모스|헥토르|아가멤논|잠총|두우/, "epic and late-legend names may not be seated");
});

test("Libu carries the title its own century used", () => {
  // Overturned by both checking passes: "대추장" (wr ꜥꜣ n Rbw) is a 22nd-Dynasty
  // hereditary title first documented around 795 BC — four centuries after this
  // board. The Merneptah-era form is "추장" (wr n Rbw).
  const value = referenceLeadership("Libu Tribes", START).leader ?? "";
  assert.match(value, /리부의 추장/);
  assert.doesNotMatch(value, /대추장/, "a title four centuries too late is an invented one");
});

test("the contested seat carries its rival, because that is the state of Egypt", () => {
  // The Parthian precedent from classical.js. Seti II is named by first-hand
  // evidence, and Amenmesse holds Thebes at this moment — on a competing
  // arrangement the seat is his outright. Drop the rival from the string and
  // this entry should not stand as a person at all.
  const value = referenceLeadership("New Kingdom Egypt", START).leader ?? "";
  assert.match(value, /세티 2세/);
  assert.match(value, /아멘메세/, "the contest is the fact, not a footnote");
});

console.log(`\n${pass} passed\n`);

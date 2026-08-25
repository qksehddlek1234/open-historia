// The record used to begin in 1000 AD, and a sentinel was standing in for a king.
//
// roman-117 reported "era leaders seeded: 1/13". The twelve misses were real —
// no pack covered antiquity at all — and the one hit was worse than a miss:
// "Han Dynasty" found nothing under its own name, fell through to its alias
// "China", and matched a row in the MODERN table whose window is unbounded. The
// name it matched was "(없음)" — the codebase's sentinel for "this system has no
// separate such office" — so Emperor An of Han went onto the board with a head
// of state of "(none)" and no emperor, and the alias loop stopped there without
// trying anything else.
//
// Two pins, because there were two faults: the pack has to exist, and a
// sentinel must never be read as a person.
import assert from "node:assert/strict";
import fs from "node:fs";
import { isRoleSentinel } from "../src/runtime/countryStatLedger.js";
import { ensureReferenceEra, referenceLeadership } from "../src/runtime/leaderReference.js";

let pass = 0;
const test = (name, fn) => { fn(); pass += 1; console.log(`  ok  ${name}`); };
const BUILD = fs.readFileSync(new URL("../scripts/presets/build-preset.mjs", import.meta.url), "utf8");
const REF = fs.readFileSync(new URL("../src/runtime/leaderReference.js", import.meta.url), "utf8");
const SPEC = fs.readFileSync(new URL("../scripts/presets/roman-117.spec.mjs", import.meta.url), "utf8");

console.log("\nAntiquity is on the record");

await ensureReferenceEra("0117-01-01");

test("the era packs reach back past 1000, and the classical pack is first", () => {
  const at = REF.indexOf("const ERA_PACK_LOADERS");
  assert.notEqual(at, -1);
  const block = REF.slice(at, REF.indexOf("];", at));
  assert.match(block, /key: "classical", from: "0001-01-01"/);
  assert.ok(block.indexOf('"classical"') < block.indexOf('"high-medieval"'),
    "packs are listed oldest first");
});

test("every polity roman-117 declares can be answered", () => {
  // Parsed from the spec rather than hard-coded, so adding a polity there
  // without a leader entry fails here instead of on the board.
  const block = SPEC.slice(SPEC.indexOf("polities: {"), SPEC.indexOf("countryAssignments"));
  const names = [...block.matchAll(/name: "([^"]+)"/g)].map((m) => m[1]);
  assert.ok(names.length >= 13, `only ${names.length} polities parsed — the reader is wrong, not the spec`);
  const unanswered = names.filter((name) => {
    const row = referenceLeadership(name, "0117-01-01");
    return !row.leader && !row.headOfState;
  });
  assert.deepEqual(unanswered, [],
    "a polity with no entry leaves its throne for the model to invent, every jump");
});

test("what is named is named, and what is not is an institution", () => {
  // The two halves of the doctrine, one example each. Trajan's dates are firm;
  // Aksum's 117 king is not on record at all, and the file says so rather than
  // picking a plausible name off a late regnal list.
  assert.match(referenceLeadership("Roman Empire", "0117-01-01").leader ?? "", /트라야누스/);
  assert.match(referenceLeadership("Kingdom of Aksum", "0117-01-01").leader ?? "", /기록에 없다/);
  // And the succession is there, so a campaign that runs past August 117 gets
  // Hadrian from the record instead of from the model.
  assert.match(referenceLeadership("Roman Empire", "0117-12-01").leader ?? "", /하드리아누스/);
});

test("the Han emperor is an emperor, not a sentinel", () => {
  const row = referenceLeadership("Han Dynasty", "0117-01-01");
  assert.match(row.leader ?? "", /안제/);
  assert.ok(!isRoleSentinel(row.leader ?? ""), "the fault this pin exists for");
  // The dowager actually governed — the deputy slot is for exactly that.
  assert.match(row.deputy ?? "", /등태후/);
});

console.log("\nA sentinel is not an officeholder");

test("the preset builder tests for a real person before accepting a match", () => {
  assert.match(BUILD, /const \{ isRoleSentinel \} = await import\(/,
    "reuse the codebase's own test rather than restating the spellings");
  assert.match(BUILD, /hasOfficeholder\(r\.leader\) \|\| hasOfficeholder\(r\.headOfState\)/);
  assert.doesNotMatch(BUILD, /if \(r && \(r\.leader \|\| r\.headOfState\)\)/,
    "the bare truthiness test is what let '(없음)' end the alias search");
});

test("board lore outranks the record, and sentinel-only lore is not lore", () => {
  // ㄴ-1 (2026-08-25): alt-history boards (kaiserreich/TNO/zombie) hold their
  // rulers in the SPEC, because both other homes are wrong — lore in the real
  // packs poisons historical boards, and without lore the alias chain leaks
  // real leaders into alt boards ("Belgium" answering for Flanders-Wallonia).
  // The lore branch must run BEFORE the reference loop and must apply the same
  // officeholder test — sentinel-only lore falls through to an honest miss.
  assert.match(BUILD, /p\.leadership && \(hasOfficeholder\(p\.leadership\.leader\) \|\| hasOfficeholder\(p\.leadership\.headOfState\)\)/,
    "spec lore is gated by the same real-person test as the reference");
  assert.match(BUILD, /보드 로어\(스펙\)/, "and the seeded via names its source");
});

test("every spelling of the sentinel is refused, and a real name is not", () => {
  for (const value of ["(없음)", "없음", "(미확인)", "공석", "vacant", "n/a", "—"]) {
    assert.ok(isRoleSentinel(value), `${value} must read as a sentinel`);
  }
  for (const value of ["황제 안제 (유호)", "황제 트라야누스 (옵티무스 프린켑스)"]) {
    assert.ok(!isRoleSentinel(value), `${value} is a person`);
  }
});

console.log(`\n${pass} passed\n`);

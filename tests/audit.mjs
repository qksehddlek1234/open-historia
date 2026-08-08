// The audit sweep: id shapes the scrubber had never met, ledger topics filed
// under "other", a promoted capital drawn monumental, and a rename table keyed
// so nothing could ever read it.
import assert from "node:assert/strict";
import fs from "node:fs";
import { stripMachineSyntax, repairHalfRomanized } from "../src/runtime/machineSyntax.js";
import { normalizeLedgerEntry, normalizeLedger } from "../src/runtime/campaignLedger.js";
import { citySize, cityToMarker } from "../src/runtime/cityFeatures.js";

let pass = 0;
const test = (name, fn) => { fn(); pass += 1; console.log(`  ok  ${name}`); };

const GAMESTATE = fs.readFileSync(new URL("../src/runtime/gameState.js", import.meta.url), "utf8");
const CHEATS = fs.readFileSync(new URL("../src/Game/GameUI/cheats.jsx", import.meta.url), "utf8");

console.log("\nEvery id shape the live save actually held comes out clean");

test("a paren LIST of ids — the shape the single-id pattern missed", () => {
  assert.equal(
    stripMachineSyntax("강원과 경상도(KOR.9_1, KOR.10_1)를 잇는 자동화된 물류망"),
    "강원과 경상도를 잇는 자동화된 물류망");
});

test("the id-first form keeps the NAME and drops the id", () => {
  assert.equal(stripMachineSyntax("KOR.6_1(강원도) 일대에 특구를"), "강원도 일대에 특구를");
});

test("bare ids die with the list separators that carried them", () => {
  assert.equal(
    stripMachineSyntax("KOR.6_1(강원도), KOR.9_1, KOR.10_1 지역에 연구소를"),
    "강원도 지역에 연구소를");
  assert.equal(stripMachineSyntax("KOR.1_1, KOR.8_1 인근에 배치"), "인근에 배치");
});

test("what must never match, does not", () => {
  for (const line of [
    "AI.5와 Web2.0, 그리고 GPT",       // dot-number tokens without the _N suffix
    "부산, 울산 항만을 중심으로",        // ordinary Korean list
    "한-미 동맹, 한-일 협력",           // hyphenated pairs
    "Gangwon-do (KOR.14_1)",           // untranslated name keeps working as before
  ]) {
    const got = stripMachineSyntax(line);
    const noIds = line.replace(/\s*[(（]\s*[A-Z]{2,3}[.\-]\d+(?:_\d+)?\s*[)）]/g, "");
    assert.equal(got, noIds.trim(), line);
  }
});

test("the consolidation scar found live is the list shape, now covered", () => {
  assert.equal(
    stripMachineSyntax("강원 및 경상 지역(KOR.9_1, KOR.10_1)에는 파격적인 세제"),
    "강원 및 경상 지역에는 파격적인 세제");
});

console.log("\nA ledger key's meaning is its topic, even through a synonym");

test("the four live orphan prefixes each find their topic", () => {
  const topicOf = (key) => normalizeLedgerEntry({ key, fact: "x" }).topic;
  assert.equal(topicOf("policy-k-growth-2030"), "programme");
  assert.equal(topicOf("security-k-shield-protocol"), "programme");
  assert.equal(topicOf("defense-seomgang-protocol"), "programme");
  assert.equal(topicOf("trade-hydrogen-alliance"), "economy");
});

test("an exact topic prefix still wins as itself", () => {
  assert.equal(normalizeLedgerEntry({ key: "relation-kr-us", fact: "x" }).topic, "relation");
  assert.equal(normalizeLedgerEntry({ key: "programme-three-axis", fact: "x" }).topic, "programme");
});

test("an unrecognized prefix still files as other, never guessed", () => {
  assert.equal(normalizeLedgerEntry({ key: "zzz-something", fact: "x" }).topic, "");
});

test("a stated topic is never overridden by the key", () => {
  assert.equal(normalizeLedgerEntry({ key: "policy-x", topic: "crisis", fact: "x" }).topic, "crisis");
});

test("normalize dedupes by key, later wins, since survives", () => {
  const merged = normalizeLedger([
    { key: "leader-x", fact: "old", since: "2016-01-01" },
    { key: "leader-x", fact: "new" },
  ]);
  assert.equal(merged.length, 1);
  assert.equal(merged[0].fact, "new");
  assert.equal(merged[0].since, "2016-01-01");
});

console.log("\nA promoted capital reads as a city, not a monument");

test("the order survives, the amplitude shrank", () => {
  const capital = citySize({ capital: true, population: 100_000 });
  const mega = citySize({ population: 8_000_000 });
  const major = citySize({ population: 3_400_000 });
  const town = citySize({ population: 3_000 });
  assert.ok(capital > mega && mega > major && major > town, "the ranking is the invariant");
  assert.ok(capital <= 1.6, `a capital at ${capital} must stay on the city band`);
});

test("Seoul promotes at 1.6 now — the size the live marker was healed to", () => {
  const marker = cityToMarker({ name: "Seoul", coord: [126.98, 37.57], population: 23_016_000, capital: true });
  assert.equal(marker.size, 1.6);
});

console.log("\nA rename either gets a key the tiles can match, or it dies out loud");

test("the fallback extracts the latin name that rode in parens", () => {
  const block = GAMESTATE.slice(GAMESTATE.indexOf("const latinInParens"), GAMESTATE.indexOf("dropped rather than filed") + 60);
  assert.match(block, /\[(（|\()/);
  assert.match(block, /toLowerCase\(\)/);
});

test("a key that nothing can read is dropped and named, not filed", () => {
  assert.match(GAMESTATE, /matched no structure and carries no stock-city name — dropped/);
});

test("an ASCII name still files as itself", () => {
  assert.match(GAMESTATE, /\/\^\[\\x20-\\x7E\]\+\$\/\.test\(op\.name\)/);
});

console.log("\nThe city search says what clicking does");

test("the section is headed as a promotion, and each row carries the action", () => {
  assert.match(CHEATS, /Promote a stock city/);
  assert.match(CHEATS, /"make editable"/);
  assert.match(CHEATS, /"already a feature"/);
});

console.log(`\n${pass} passed\n`);

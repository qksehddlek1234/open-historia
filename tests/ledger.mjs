// Audited the campaign ledger at round 30, on the 21 standing facts it holds.
// Three faults, all traceable to the same root: [Standing Facts Now] was being
// dropped by buildTemplateVariables before it reached the prompt, so every
// consolidation invented keys blind.
import assert from "node:assert/strict";
import fs from "node:fs";
import {
  LEDGER_TOPICS,
  buildLedgerText,
  buildNearDuplicateText,
  findLedgerNearDuplicates,
  mergeLedger,
  normalizeLedger,
  repairLeaderFacts,
} from "../src/runtime/campaignLedger.js";

let pass = 0;
const test = (name, fn) => { fn(); pass += 1; console.log(`  ok  ${name}`); };

const GAMEPLAY = fs.readFileSync(new URL("../src/Game/AI/gameplay.js", import.meta.url), "utf8");

// The live ledger at round 30, verbatim.
const LIVE = [
  { key: "relation-kr-us", topic: "", fact: "한미 동맹 내 사이버 방어 및 기술 안보 협력 지속", updated: "2018-03-20" },
  { key: "programme-three-axis", topic: "programme", fact: "3축 체계와 정밀 타격 능력 확보. AI 기반 분석·자동화 국방 인프라로 병력 부족 보완.", updated: "2018-02-02" },
  { key: "programme-smr-hydrogen", topic: "", fact: "사우디, UAE와 연계한 수소 경제 및 SMR 기반 에너지 파트너십 유지", updated: "2018-03-20" },
  { key: "relation-kr-gcc", topic: "", fact: "중동 국가들과의 양자 스마트 시티 및 수소 공급망 파트너십 구축", updated: "2018-03-20" },
  { key: "leader-south-korea", topic: "", fact: "대한민국 정부 (2018-01-10)", updated: "2018-03-20" },
  { key: "policy-k-growth-2030", topic: "", fact: "강원, 경상 지역 양자 및 AI 기술 인력 육성을 위한 특별법 시행 중", updated: "2018-01-10" },
  { key: "programme-regional-balance", topic: "", fact: "강원·경상 지역 중심의 양자/AI 특구 및 핵심 인력 육성 정책 진행", updated: "2018-03-20" },
  { key: "trade-hydrogen-alliance", topic: "", fact: "사우디아라비아, UAE와 협력하는 수소 경제 파트너십 구축", updated: "2018-01-10" },
];

// ---- 1. two thirds of the ledger had no topic, and the key held it all along ----

test("THE LIVE AUDIT: most facts carried no topic at all", () => {
  // 14 of 21 in the live save. Rendered before the fix they all fell into one
  // undifferentiated "other", which is the grouping doing nothing.
  assert.equal(LIVE.filter((entry) => !entry.topic).length, 7, "in this sample");
});

test("THE FIX: the topic is read off the key prefix when the model omits it", () => {
  assert.equal(normalizeLedger([{ key: "relation-kr-us", fact: "한미 동맹" }])[0].topic, "relation");
  assert.equal(normalizeLedger([{ key: "leader-south-korea", fact: "문재인" }])[0].topic, "leader");
  for (const topic of LEDGER_TOPICS) {
    assert.equal(normalizeLedger([{ key: `${topic}-x`, fact: "y" }])[0].topic, topic);
  }
});

test("…and an invented prefix maps through the synonym table, measured not guessed", () => {
  // This test used to demand these stay blank "rather than move the sprawl".
  // Then the live ledger held exactly four of them — policy-k-growth-2030,
  // security-k-shield-protocol, defense-seomgang-protocol, trade-hydrogen-
  // alliance — every one filed under "other", which is the sprawl. Each maps
  // cleanly to a real topic; only a prefix with no clean mapping stays blank.
  assert.equal(normalizeLedger([{ key: "policy-x", fact: "y" }])[0].topic, "programme");
  assert.equal(normalizeLedger([{ key: "security-x", fact: "y" }])[0].topic, "programme");
  assert.equal(normalizeLedger([{ key: "defense-x", fact: "y" }])[0].topic, "programme");
  assert.equal(normalizeLedger([{ key: "trade-x", fact: "y" }])[0].topic, "economy");
  assert.equal(normalizeLedger([{ key: "misc-x", fact: "y" }])[0].topic, "");
});

test("a topic the model DID state always wins over the prefix", () => {
  assert.equal(normalizeLedger([{ key: "relation-kr-us", topic: "treaty", fact: "조약" }])[0].topic, "treaty");
});

test("…so the live ledger now groups instead of piling into 'other'", () => {
  const text = buildLedgerText(LIVE);
  assert.match(text, /\[leader\]/);
  assert.match(text, /\[relation\]/);
  assert.match(text, /\[programme\]/);
  // Was 1 when policy-/security-/defense-/trade- keys had no topic; the synonym
  // table now files every key in this fixture somewhere real.
  assert.equal(text.split("\n").filter((line) => line === "[other]").length, 0,
    "nothing in this fixture is genuinely un-prefixed any more");
});

// ---- 2. who leads is recorded, not paraphrased --------------------------------

test("THE WORST ONE: leader-south-korea said 'the government' while the sheet said 문재인", () => {
  const before = LIVE.find((entry) => entry.key === "leader-south-korea");
  assert.ok(!before.fact.includes("문재인"), "the campaign's word on who leads names nobody");
});

test("THE FIX: the ledger restates it from the country's own sheet", () => {
  const { entries, repaired } = repairLeaderFacts(LIVE, { "South Korea": "문재인" }, { date: "2018-03-20" });
  const after = entries.find((entry) => entry.key === "leader-south-korea");
  assert.deepEqual(repaired, ["leader-south-korea"]);
  assert.ok(after.fact.startsWith("문재인"));
  assert.equal(after.topic, "leader");
});

test("…keeping whatever context the model wrote, rather than throwing it away", () => {
  const { entries } = repairLeaderFacts(LIVE, { "South Korea": "문재인" }, {});
  assert.match(entries.find((entry) => entry.key === "leader-south-korea").fact, /2018-01-10/);
});

test("a fact that ALREADY names the leader is left exactly as it is", () => {
  const ledger = [{ key: "leader-south-korea", topic: "leader", fact: "문재인 대통령, 2017-05-10 취임", updated: "2017-05-10" }];
  const { entries, repaired } = repairLeaderFacts(ledger, { "South Korea": "문재인" }, {});
  assert.deepEqual(repaired, []);
  assert.equal(entries[0].fact, "문재인 대통령, 2017-05-10 취임");
});

test("a country with no leader fact yet gets one", () => {
  const { entries, repaired } = repairLeaderFacts([], { "North Korea": "김정은" }, { date: "2018-03-20" });
  assert.deepEqual(repaired, ["leader-north-korea"]);
  assert.equal(entries[0].fact, "김정은");
  assert.equal(entries[0].since, "2018-03-20");
});

test("and a country the game knows nothing about is left alone", () => {
  const { entries, repaired } = repairLeaderFacts(LIVE, { Nowhere: "", "": "x" }, {});
  assert.deepEqual(repaired, []);
  assert.equal(entries.length, LIVE.length);
});

// ---- 3. two keys, one subject -------------------------------------------------

test("THE LIVE DUPLICATES: the hydrogen partnership is in the ledger twice", () => {
  const pairs = findLedgerNearDuplicates(LIVE).map((pair) => pair.keys.join("/"));
  assert.ok(pairs.includes("programme-smr-hydrogen/trade-hydrogen-alliance"), pairs.join(", "));
});

test("…and so is the 강원·경상 quantum/AI programme", () => {
  const pairs = findLedgerNearDuplicates(LIVE).map((pair) => pair.keys.join("/"));
  assert.ok(pairs.includes("policy-k-growth-2030/programme-regional-balance"), pairs.join(", "));
});

test("FILLER WORDS DO NOT MAKE A DUPLICATE", () => {
  // Nearly every fact here contains 협력 or 강화 or 지속 or 구축; matching on those
  // would report almost every pair in the ledger.
  assert.deepEqual(findLedgerNearDuplicates([
    { key: "a-x", fact: "해상 안보 협력 강화 지속 구축" },
    { key: "b-y", fact: "반도체 공급망 협력 강화 지속 구축" },
  ]), [], "협력/강화/지속/구축 are filler; 해상·안보 vs 반도체·공급망 are the subjects");
});

test("…and genuinely different subjects are not paired", () => {
  assert.deepEqual(findLedgerNearDuplicates([
    { key: "crisis-kaesong", fact: "개성공단 가동이 전면 중단됐다" },
    { key: "treaty-thaad", fact: "사드 배치, 성주에 방어 구역" },
  ]), []);
});

test("IT NAMES THEM, IT DOES NOT MERGE THEM", () => {
  // Deciding which of two facts is the truer one is a judgement, not a string
  // operation, so nothing is removed behind the player's back.
  assert.equal(mergeLedger(LIVE, [], {}).entries.length, LIVE.length);
  assert.match(buildNearDuplicateText(LIVE), /programme-smr-hydrogen \/ trade-hydrogen-alliance/);
  assert.equal(buildNearDuplicateText([]), "");
});

// ---- 4. wiring ---------------------------------------------------------------

test("the pairs reach the console AND the next consolidation's prompt", () => {
  assert.match(GAMEPLAY, /pair\(s\) of facts look like the same subject under two keys/);
  assert.match(GAMEPLAY, /\[Facts That May Be Duplicates\]/);
  assert.match(GAMEPLAY, /duplicateFacts: buildNearDuplicateText\(/);
});

test("the leader repair runs on every consolidation and says what it restated", () => {
  assert.match(GAMEPLAY, /const repaired = repairLeaderFacts\(merged\.entries, leaders/);
  assert.match(GAMEPLAY, /restated \$\{repaired\.repaired\.length\} leader fact\(s\)/);
  assert.match(GAMEPLAY, /campaignLedger: repaired\.entries,/, "and what is saved is the repaired list");
});

test("the leaders come from the sheet PLUS what the campaign changed", () => {
  assert.match(GAMEPLAY, /mergeStatSheet\(sheet, world\.countryStatChanges\?\.\[code\]\)\?\.leader/);
});

console.log(`\n${pass} passed`);

// The fresh campaign's first sheets mixed every money convention at once, one
// sheet arrived as another country's entirely, and the player's side-by-side
// with the original showed the narrative gap: no regime voice, no horizon, no
// memory of what just succeeded. Round-2-of-the-new-campaign batch — extended
// at round 6, when a mid-turn crash exposed the snapshot-after-writes ordering,
// the leadership trio came back blended, and the conversion system was retired
// for good ("환산 시스템 제거하고 달러로만").
import assert from "node:assert/strict";
import fs from "node:fs";
import { STAT_FIELDS, stripMoneyConversions, tidyMoneyText, tidyStatSheetMoney } from "../src/runtime/countryStatLedger.js";
import { normalizeWorldState } from "../src/runtime/gameState.js";
import { buildRecentOutcomesText } from "../src/Game/AI/promptContext.js";
import { GAMEPLAY_SCHEMAS } from "../src/Game/AI/gameplaySchemas.js";

let pass = 0;
const test = (name, fn) => { fn(); pass += 1; console.log(`  ok  ${name}`); };

const GAMEPLAY = fs.readFileSync(new URL("../src/Game/AI/gameplay.js", import.meta.url), "utf8");
const ACTIONS_UI = fs.readFileSync(new URL("../src/Game/GameUI/actions.jsx", import.meta.url), "utf8");
const EVENTS_UI = fs.readFileSync(new URL("../src/Game/GameUI/events.jsx", import.meta.url), "utf8");
const STATS_UI = fs.readFileSync(new URL("../src/Game/GameUI/stats.jsx", import.meta.url), "utf8");

console.log("\nMoney the player can read");

test("the live wreckage repairs deterministically", () => {
  assert.equal(tidyMoneyText("-587_billion_usd"), "-5870억 달러");
  assert.equal(tidyMoneyText("1.126T"), "1조 1260억");
  assert.equal(tidyMoneyText("--0.5% (GDP 대비)"), "-0.5% (GDP 대비)");
  assert.equal(tidyMoneyText("10.3조 CNY"), "10.3조 위안");
  assert.equal(tidyMoneyText("KRW"), "원");
});

test("the sanctioned name (CODE) form survives the code sweep", () => {
  assert.equal(tidyMoneyText("유로 (EUR)"), "유로 (EUR)");
  assert.equal(tidyMoneyText("유로(EUR)"), "유로(EUR)");
});

test("a sheet's economy block is tidied in place and names what changed", () => {
  const sheet = { economy: { gdp: "1.126T", currency: "KRW", publicDebt: "35.1%", budgetBalance: "-587_billion_usd" } };
  const touched = tidyStatSheetMoney(sheet);
  assert.deepEqual(touched.sort(), ["budgetBalance", "currency", "gdp"]);
  assert.equal(sheet.economy.gdp, "1조 1260억");
  assert.equal(sheet.economy.publicDebt, "35.1%", "already-clean fields stay untouched");
});

test("the sheet prompt states one money format — dollars that stand alone", () => {
  const at = GAMEPLAY.indexOf("[Money Format]");
  assert.notEqual(at, -1);
  const block = GAMEPLAY.slice(at, at + 1800);
  assert.match(block, /NEVER Latin letters like T, B or M/);
  assert.match(block, /ISO code alone \(USD, CNY, KRW\) is not a currency name/);
  assert.match(block, /stated in the era's benchmark currency/);
  // Round 6: the conversion system is RETIRED — no rate, no equivalents.
  assert.match(block, /The dollar figure stands ALONE: no conversions, no parenthetical equivalents, no exchange rates anywhere on the sheet/);
  assert.doesNotMatch(block, /exchangeRate/, "the retired field is not even named");
  assert.match(block, /ALWAYS percentages of GDP/);
});

console.log("\nThe conversion system is retired — dollars stand alone");

test("the scrubber strips every conversion shape the live sheets wrote", () => {
  // ≈ form (round 3 live) and 약 form (also round 3 live) both come off.
  assert.equal(stripMoneyConversions("1조 3300억 달러 (≈ 1조 5900억 원)"), "1조 3300억 달러");
  assert.equal(stripMoneyConversions("11.06조 달러 (약 13,520조 원)"), "11.06조 달러");
  assert.equal(stripMoneyConversions("18조 4900억 달러 (~22,000조 원)"), "18조 4900억 달러");
  // Two conversions on one value — both go.
  assert.equal(stripMoneyConversions("3만 달러 (≈ 3600만 원) (약 3.6천만 원)"), "3만 달러");
});

test("legitimate parentheticals are not conversions and survive", () => {
  assert.equal(stripMoneyConversions("유로 (EUR)"), "유로 (EUR)");
  assert.equal(stripMoneyConversions("원 (KRW)"), "원 (KRW)");
  assert.equal(stripMoneyConversions("35% (GDP 대비)"), "35% (GDP 대비)");
  assert.equal(stripMoneyConversions("1조 5000억 달러 (명목)"), "1조 5000억 달러 (명목)");
  assert.equal(stripMoneyConversions(""), "");
});

test("tidyStatSheetMoney strips conversions and buries a leftover exchangeRate", () => {
  const sheet = { economy: {
    gdp: "11.06조 달러 (약 13,520조 원)",
    gdpPerCapita: "3만 달러 (≈ 3600만 원)",
    currency: "원 (KRW)",
    exchangeRate: "1 달러 ≈ 1,200원",
  } };
  const touched = tidyStatSheetMoney(sheet);
  assert.equal(sheet.economy.gdp, "11.06조 달러");
  assert.equal(sheet.economy.gdpPerCapita, "3만 달러");
  assert.equal(sheet.economy.currency, "원 (KRW)", "the name (CODE) form is untouched");
  assert.equal("exchangeRate" in sheet.economy, false, "the retired field is deleted, not displayed");
  assert.deepEqual(touched.sort(), ["exchangeRate", "gdp", "gdpPerCapita"]);
});

test("the retired field is gone from schema, catalogue, and display", () => {
  assert.equal(GAMEPLAY_SCHEMAS.countryStatSheet.properties.economy.properties.exchangeRate, undefined);
  assert.ok(!GAMEPLAY_SCHEMAS.countryStatSheet.properties.economy.required.includes("exchangeRate"));
  assert.equal(STAT_FIELDS.exchangeRate, undefined, "deltas can no longer move a rate that no longer exists");
  assert.doesNotMatch(STATS_UI, /exchangeRate/, "the stats tab neither reads nor renders it");
  assert.match(STATS_UI, /stripMoneyConversions\(sheet\.economy\?\.gdp\)/, "display strips what stored sheets still carry");
  assert.match(STATS_UI, /stripMoneyConversions\(sheet\.economy\?\.gdpPerCapita\)/);
});

console.log("\nA sheet that is another country's sheet is refused");

test("capital collision refuses outright; leader collision still downgrades", () => {
  const at = GAMEPLAY.indexOf("A CAPITAL BORROWED FROM ANOTHER SHEET");
  assert.notEqual(at, -1);
  const block = GAMEPLAY.slice(at, at + 3200);
  assert.match(block, /foreignCapitals\.get\(claimedCapital\)/);
  assert.match(block, /refusing the sheet rather than storing another country's/);
  assert.match(block, /candidate\.leader = "\(미확인\)";/);
});

test("own-country comparison is canonical, and an empty leader gets one more ask", () => {
  assert.match(GAMEPLAY, /canonicalCountry === canonicalTarget \|\| canonicalCountry === canonicalDisplayTarget\) continue;/);
  assert.match(GAMEPLAY, /The "leader" field is empty\. Name/);
  // The money tidy runs inside the validator, before the sanity check.
  assert.match(GAMEPLAY, /tidied \$\{tidied\.length\} money value\(s\)/);
});

console.log("\nThe briefing finds its voice, its horizon, and its memory");

test("regime voice and regime constraints are stated for the board", () => {
  const at = GAMEPLAY.indexOf("[Voice]");
  assert.notEqual(at, -1);
  const block = GAMEPLAY.slice(at, at + 1400);
  assert.match(block, /terse, urgent situation-report prose/);
  assert.match(block, /public opinion, the legislature, coalition partners/);
  assert.match(block, /A policy no such government could enact is not a suggestion, it is a costume/);
});

test("actions within a topic are rival strategies, not synonyms", () => {
  // The player's third capture of the original (round 6): each option inside
  // a topic is scored on named tradeoff axes with its main risk stated —
  // 야고다 유지 / 예조프 승격 / 집단 지도체제, not three purge intensities.
  // The attribution comment mentions the section name too — anchor on the
  // template text itself (escaped newline prefix).
  const at = GAMEPLAY.indexOf("[Action Spread]\\nWithin one topic");
  assert.notEqual(at, -1);
  const block = GAMEPLAY.slice(at, at + 1400);
  assert.match(block, /RIVAL STRATEGIES/);
  assert.match(block, /choosing between COSTS, not between synonyms/);
  assert.match(block, /DIFFERENT CHANNEL/);
  assert.match(block, /names, in one clause, what it trades away or the main risk it accepts/);
  assert.match(block, /differ by arena rather than by intensity alone/);
});

test("horizon is schema, prompt, normalize and UI, end to end", () => {
  const items = GAMEPLAY_SCHEMAS.actions.properties.topics.items;
  assert.deepEqual(items.properties.horizon.enum, ["immediate", "long"]);
  assert.ok(!items.required.includes("horizon"), "optional — a 12B may omit it and the board still stands");
  assert.match(GAMEPLAY, /\[Horizon\]/);
  assert.match(GAMEPLAY, /List the immediate topics FIRST/);
  const world = normalizeWorldState({
    actionSuggestions: [
      { title: "장기 과제", horizon: "LONG", actions: [{ title: "a", text: "b" }] },
      { title: "이상한 값", horizon: "someday", actions: [{ title: "a", text: "b" }] },
    ],
  });
  assert.equal(world.actionSuggestions[0].horizon, "long", "case-folded");
  assert.equal("horizon" in world.actionSuggestions[1], false, "junk label = unlabeled");
  assert.match(ACTIONS_UI, /topic\.horizon === "immediate" \? "Now" : "Long-term"/);
  assert.match(ACTIONS_UI, /rank\(left\) - rank\(right\)/);
});

test("last period's verdicts feed the next board — successes included", () => {
  const text = buildRecentOutcomesText([
    { title: "옛 라운드", text: "x", status: "resolved", outcome: "succeeded", resolvedRound: 1 },
    { title: "성공한 정책", text: "x", status: "resolved", outcome: "succeeded", resolvedRound: 3, outcomeNote: "순조로운 이행" },
    { title: "반쪽 성과", text: "x", status: "resolved", outcome: "partial", resolvedRound: 3 },
    { title: "아직 큐", text: "x", status: "planned" },
  ]);
  assert.match(text, /성공한 정책 — 성공 \(순조로운 이행\)/);
  assert.match(text, /반쪽 성과 — 부분 성공/);
  assert.doesNotMatch(text, /옛 라운드/, "only the LATEST round's verdicts ride");
  assert.match(GAMEPLAY, /\[Last Period's Verdicts\]/);
  assert.match(GAMEPLAY, /a success earns its next stage/);
});

console.log("\nContamination flows FROM the player — arbitration follows the flow");

test("the player's own sheet keeps its leader; the borrower is healed instead", () => {
  assert.match(GAMEPLAY, /leaderBelongsTo && canonicalTarget === playerCanonical/);
  assert.match(GAMEPLAY, /contaminatedLeaderOwner = leaderBelongsTo;/);
  assert.match(GAMEPLAY, /stored sheet was holding \$\{target\}'s leader/);
});

test("foreign construction lands standing — the slot discipline paces the player only", () => {
  assert.match(GAMEPLAY, /markerOwner !== playerPolityName/);
  assert.match(GAMEPLAY, /foreign structure\(s\) stand complete on arrival/);
});

test("round 5: dollars for every GDP, one-name leaders, a floor under stability", () => {
  const at = GAMEPLAY.indexOf('if (taskKey === "countryStatSheet")');
  const block = GAMEPLAY.slice(at, at + 7000);
  assert.match(block, /does not belong on another country's sheet: not its leader, not its capital/);
  assert.match(block, /stated in the era's benchmark currency/);
  assert.match(block, /NEVER an invented name and NEVER a second name in parentheses/);
  assert.match(block, /A functioning country is never 0/);
  // Validator (lives in generateCountryStatSheet, not the prompt builder):
  // the hedge keeps the parenthetical truth; stability 0 gets one more ask.
  assert.match(GAMEPLAY, /keeping the parenthetical name the model was hedging toward/);
  assert.match(GAMEPLAY, /came back 0, which means the state has COLLAPSED/);
});

test("the leadership picture is three roles, schema to display", () => {
  const S = GAMEPLAY_SCHEMAS;
  assert.ok(S.countryStatSheet.properties.headOfState);
  assert.ok(S.countryStatSheet.properties.deputy);
  assert.ok(!S.countryStatSheet.required.includes("headOfState"), "omitted where the system has none");
  assert.ok(STAT_FIELDS.headOfState && STAT_FIELDS.deputy, "catalogued, so deltas can move a succession");
  // The values carry their own official titles ("대통령 …", "국왕 …") since the
  // titled-leader change, so the UI shows them bare — a generic "Leader:" or
  // "Deputy:" prefix (지도자/대리인 in the language pack) must NOT come back.
  assert.match(STATS_UI, /\{sheet\.headOfState\}/);
  assert.match(STATS_UI, /\{sheet\.deputy\}/);
  assert.ok(!/Head of state: \{sheet\.headOfState\}/.test(STATS_UI), "no generic prefix before the titled name");
  assert.ok(!/Deputy: \{sheet\.deputy\}/.test(STATS_UI), "no generic prefix before the titled name");
  // And the identity guard holds the ceremonial head too.
  assert.match(GAMEPLAY, /\["leader", "headOfState", "government", "capital"\]/);
});

test("round 6: the wider roles are certainty-gated, and wrong ones are dropped", () => {
  // Prompt: fill only when certain — omission is the honest default.
  assert.match(GAMEPLAY, /ONLY when you are CERTAIN of the actual person on this date/);
  assert.match(GAMEPLAY, /OMIT the field when unsure/);
  // Validator: a repeat of the leader, another country's recorded leader, or
  // a parenthetical hedge is dropped and logged, never displayed.
  assert.match(GAMEPLAY, /for \(const field of \["headOfState", "deputy"\]\)/);
  assert.match(GAMEPLAY, /dropped \$\{target\}'s \$\{field\}/);
  assert.match(GAMEPLAY, /it is \$\{collidesWith\}'s recorded leader/);
  assert.match(GAMEPLAY, /it repeats the leader/);
  assert.match(GAMEPLAY, /a hedged double name/);
});

test("the same founding announced twice in one turn folds to one project", () => {
  assert.match(GAMEPLAY, /const foundedThisTurn = new Set\(\);/);
  assert.match(GAMEPLAY, /op\.op = "skip-duplicate-build"/);
  assert.match(GAMEPLAY, /folded \$\{foldedFoundings\} duplicate founding/);
});

console.log("\nA crash cannot eat the way back");

test("the snapshot lands BEFORE the first write — the crash window is closed", () => {
  const marker = GAMEPLAY.indexOf("SNAPSHOT FIRST, WRITES SECOND");
  assert.notEqual(marker, -1);
  const captureAt = GAMEPLAY.indexOf("await captureRollbackSnapshot({", marker);
  const writeAt = GAMEPLAY.indexOf("await writeEventsState(nextEvents)", marker);
  assert.ok(captureAt !== -1 && writeAt !== -1 && captureAt < writeAt,
    "capture must precede the events write");
  // Exactly ONE call site — the old after-the-writes capture is gone.
  assert.equal(GAMEPLAY.split("await captureRollbackSnapshot({").length - 1, 1);
});

test("a retried turn replaces its head snapshot instead of stacking a twin", () => {
  const at = GAMEPLAY.indexOf("same restore point, replaced rather than stacked");
  assert.notEqual(at, -1);
  const block = GAMEPLAY.slice(at, at + 400);
  assert.match(block, /String\(list\[0\]\.round\) === String\(round\) && String\(list\[0\]\.fromDate\) === String\(fromDate\)/);
  assert.match(block, /list = list\.slice\(1\);/);
});

test("the round chip finds its snapshot by the turn's own dates, not its number", () => {
  // History rounds carry the PRODUCED round; snapshots carry the REPLACED
  // round — the numeric match left the newest chip with no restore button.
  assert.match(EVENTS_UI, /String\(snap\?\.fromDate\) === String\(activeGroup\.fromDate\)/);
  assert.match(EVENTS_UI, /String\(snap\?\.toDate\) === String\(activeGroup\.toDate\)/);
  assert.match(EVENTS_UI, /String\(snap\?\.round\) === String\(Number\(activeGroup\.round\) - 1\)/, "legacy snapshots without dates still map");
});

console.log("\nA wiped base cannot hide behind the device cache");

test("the cache is eligible only while the save still knows the country", () => {
  assert.match(STATS_UI, /const baseKnown = Boolean\(worldNow\?\.countryStats\?\.\[code\]\);/);
  assert.match(STATS_UI, /cached && baseKnown && sheetDescribesNow/);
  assert.match(STATS_UI, /dropping the cached copy and regenerating/);
});

console.log(`\n${pass} passed\n`);

// The stat sheet stopped moving. Measured on the live campaign's 28 rollback
// snapshots: GDP unchanged for 27 rounds, energyAutonomy never changed once,
// five of six indices changed exactly once (in round 2) and never again — while
// the player spent those rounds building four energy facilities.
import assert from "node:assert/strict";
import fs from "node:fs";
import {
  RESCUED_FIELDS,
  STAT_FIELDS,
  applyStatChanges,
  buildStatSheetText,
  canonicalRoleSentinel,
  isRoleSentinel,
  mergeStatSheet,
  readStatField,
  rescueLegacySheet,
  sameLeaderPerson,
  writeStatField,
} from "../src/runtime/countryStatLedger.js";
import { GAMEPLAY_SCHEMAS, validateGameplayPayload } from "../src/Game/AI/gameplaySchemas.js";

let pass = 0;
const test = (name, fn) => { fn(); pass += 1; console.log(`  ok  ${name}`); };

const GAMEPLAY = fs.readFileSync(new URL("../src/Game/AI/gameplay.js", import.meta.url), "utf8");
const BREAKDOWN_ROWS = ([agriculture, industry, services]) => [
  { code: "X", field: "agriculture", value: String(agriculture) },
  { code: "X", field: "industry", value: String(industry) },
  { code: "X", field: "services", value: String(services) },
];
const STATS_UI = fs.readFileSync(new URL("../src/Game/GameUI/stats.jsx", import.meta.url), "utf8");
const STATE = fs.readFileSync(new URL("../src/runtime/gameState.js", import.meta.url), "utf8");

// The live sheet, as the campaign actually holds it at round 29.
const LIVE_SHEET = {
  capital: "서울특별시", continent: "아시아", government: "민주공화국", leader: "문재인",
  stability: 85,
  indices: {
    sovereignty: 85, foodAutonomy: 40, energyAutonomy: 35,
    economicIndependence: 90, internalSecurity: 88, internationalReputation: 86,
  },
  economy: {
    gdp: "1,250조 원", gdpGrowth: "+2.8%", gdpPerCapita: "34,000 달러", currency: "대한민국 원 (KRW)",
    inflation: "1.9%", unemployment: "3.7%", publicDebt: "35.3% (GDP 대비)", budgetBalance: "-2.1% (GDP 대비 deficit)",
  },
  gdpBreakdown: { agriculture: 45, industry: 76, services: 32 },
};

// ---- 1. every leaf of the sheet is reachable by a flat name ------------------------

test("THE FIELD CATALOGUE covers every leaf the sheet schema declares", () => {
  const sheet = GAMEPLAY_SCHEMAS.countryStatSheet.properties;
  const declared = [];
  for (const [key, spec] of Object.entries(sheet)) {
    if (spec.type === "object") declared.push(...Object.keys(spec.properties));
    else declared.push(key);
  }
  assert.deepEqual(declared.sort(), Object.keys(STAT_FIELDS).sort(),
    "a leaf with no flat name can never be moved by the pass");
});

test("…and each one reads out of the live sheet, wherever it nests", () => {
  assert.equal(readStatField(LIVE_SHEET, "leader"), "문재인");
  assert.equal(readStatField(LIVE_SHEET, "energyAutonomy"), 35);
  assert.equal(readStatField(LIVE_SHEET, "gdp"), "1,250조 원");
  assert.equal(readStatField(LIVE_SHEET, "industry"), 76);
  assert.equal(readStatField(LIVE_SHEET, "nonsense"), undefined);
});

test("writing a leaf never edits the sheet it was given", () => {
  const store = { indices: { energyAutonomy: 35 } };
  const next = writeStatField(store, "energyAutonomy", 38);
  assert.equal(store.indices.energyAutonomy, 35, "the original is untouched");
  assert.equal(next.indices.energyAutonomy, 38);
  assert.equal(writeStatField({}, "leader", "문재인").leader, "문재인");
});

// ---- 2. THE CASE THIS EXISTS FOR --------------------------------------------------

test("THE FROZEN NUMBER: four energy facilities finally move energyAutonomy", () => {
  const { entries, applied, dropped } = applyStatChanges({ "South Korea": LIVE_SHEET }, [
    { code: "South Korea", field: "energyAutonomy", value: "38", reason: "부산 수소 에너지 거점 가동" },
  ], { date: "2018-04-20" });
  assert.deepEqual(dropped, []);
  assert.equal(entries["South Korea"].indices.energyAutonomy, 38);
  assert.equal(applied[0].from, 35);
  assert.equal(applied[0].to, 38);
  assert.match(applied[0].reason, /수소/);
});

test("…and a money figure moves too, which no event has ever managed", () => {
  const { entries } = applyStatChanges({ "South Korea": LIVE_SHEET }, [
    { code: "South Korea", field: "gdp", value: "1,340조 원", reason: "반도체 수출 확대" },
  ], {});
  assert.equal(entries["South Korea"].economy.gdp, "1,340조 원");
});

test("a value that has not actually changed records nothing", () => {
  const { applied, dropped } = applyStatChanges({ "South Korea": LIVE_SHEET },
    [{ code: "South Korea", field: "energyAutonomy", value: "35" }], {});
  assert.deepEqual(applied, []);
  assert.deepEqual(dropped, [], "unchanged is not an error, just nothing to record");
});

// ---- 3. the ways a row can be wrong, none of them silent ---------------------------

test("A FIELD NAME THE MODEL INVENTED is dropped and named", () => {
  const { entries, dropped } = applyStatChanges({}, [
    { code: "South Korea", field: "militaryStrength", value: "70" },
    { code: "South Korea", field: "", value: "70" },
  ], {});
  assert.deepEqual(entries, {});
  assert.equal(dropped.length, 2);
  assert.match(dropped[0].why, /not a field on the sheet/);
});

test("a row with no country goes nowhere", () => {
  const { dropped } = applyStatChanges({}, [{ field: "stability", value: "70" }], {});
  assert.match(dropped[0].why, /no country/);
});

test("A SENTENCE IN A NUMBER'S SLOT is refused — that wreckage reached the pane once", () => {
  const { entries, dropped } = applyStatChanges({}, [
    { code: "South Korea", field: "gdp", value: "약 1,250조 원 수준으로 추정되나 반도체 수출 호조에 따라 상향 여지가 있음" },
    { code: "South Korea", field: "gdp", value: ")}}'*, {" },
    { code: "South Korea", field: "gdpGrowth", value: ",2.5" },
  ], {});
  assert.deepEqual(entries, {});
  assert.equal(dropped.length, 3);
  for (const row of dropped) assert.match(row.why, /unusable value/);
});

test("\"매우 높음\" IN A 0-100 SLOT USED TO MEAN ZERO", () => {
  // Number("") is 0 and Number.isFinite(0) is true, so a model answering "very
  // high" would have set that country's stability to the floor.
  const { entries, dropped } = applyStatChanges({ "South Korea": LIVE_SHEET },
    [{ code: "South Korea", field: "stability", value: "매우 높음" }], {});
  assert.equal(entries["South Korea"].stability, 85, "the old value stands");
  assert.equal(dropped.length, 1);
});

test("…and the same bar applies to a name field", () => {
  const { dropped } = applyStatChanges({}, [
    { code: "A", field: "leader", value: "\"},{" },
    { code: "A", field: "leader", value: "" },
  ], {});
  assert.equal(dropped.length, 2);
});

test("every real value the live campaign holds still passes", () => {
  const rows = [
    ["gdp", "1,250조 원"], ["gdpPerCapita", "34,000 달러"], ["publicDebt", "35.3% (GDP 대비)"],
    ["budgetBalance", "-2.1% (GDP 대비 deficit)"], ["currency", "대한민국 원 (KRW)"],
    ["gdp", "128.5B USD"], ["leader", "조르주 카사야나카"], ["government", "민주공화국"],
    ["capital", "서울특별시"], ["inflation", "1.9%"], ["unemployment", "3.7%"], ["gdpGrowth", "+2.8%"],
  ];
  const { entries, dropped } = applyStatChanges({}, rows.map(([field, value]) => ({ code: "X", field, value })), {});
  assert.deepEqual(dropped, [], "the length cap must not cost a single real figure");
  assert.equal(entries.X.economy.budgetBalance, "-2.1% (GDP 대비 deficit)");
});

test("a 0-100 field is clamped, never stored out of range", () => {
  const { entries } = applyStatChanges({}, [
    { code: "A", field: "stability", value: "140" },
    { code: "B", field: "stability", value: "-20" },
    { code: "C", field: "stability", value: "62.6%" },
  ], {});
  assert.equal(entries.A.stability, 100);
  assert.equal(entries.B.stability, 0);
  assert.equal(entries.C.stability, 63, "a stray unit is stripped, not rejected");
});

// ---- 3b. what the first live run exposed --------------------------------------------

test("THE FIRST LIVE RUN measured every move against an EMPTY store", () => {
  // Console, round 30: "South Korea internalSecurity — → 91". The em dash is the
  // previous value, and it was missing because previous was read only from the
  // delta store, which starts empty. acceptStanding waves through anything with
  // no previous value, so the guard was silently skipped on each field's first
  // move — one free pass per field for a delta written into an absolute slot.
  const refuse = ({ next, previous }) => !(Number.isFinite(previous) && Math.abs(next - previous) > 8);
  const withoutBaseline = applyStatChanges({}, [{ code: "South Korea", field: "stability", value: "3" }], { accept: refuse });
  assert.equal(withoutBaseline.entries["South Korea"].stability, 3, "…which is how a delta got in");

  const withBaseline = applyStatChanges({}, [{ code: "South Korea", field: "stability", value: "3" }],
    { accept: refuse, baselines: { "South Korea": LIVE_SHEET } });
  assert.equal(withBaseline.entries["South Korea"], undefined, "the guard now sees 85 → 3 and refuses it");
  assert.match(withBaseline.dropped[0].why, /not a move this turn accounts for/);
});

test("…and the real before-value is what gets reported", () => {
  const { applied } = applyStatChanges({}, [{ code: "South Korea", field: "internalSecurity", value: "91" }],
    { baselines: { "South Korea": LIVE_SHEET } });
  assert.equal(applied[0].from, 88, "not undefined, which the console printed as an em dash");
  assert.equal(applied[0].to, 91);
});

test("a field the campaign has ALREADY moved measures from the campaign's value", () => {
  const { applied } = applyStatChanges({ "South Korea": { indices: { internalSecurity: 91 } } },
    [{ code: "South Korea", field: "internalSecurity", value: "93" }],
    { baselines: { "South Korea": LIVE_SHEET } });
  assert.equal(applied[0].from, 91, "the delta store is newer than the generated sheet");
});

test("A COUNTRY NEVER SHOWN A SHEET CANNOT HAVE ITS NUMBERS INVENTED", () => {
  // Live: the pass reported Saudi Arabia's energyAutonomy as 45 — for a country
  // with no sheet in the prompt at all, and 45 is a poor guess for the world's
  // largest oil exporter.
  const { entries, dropped } = applyStatChanges({}, [
    { code: "Saudi Arabia", field: "energyAutonomy", value: "45" },
    { code: "South Korea", field: "energyAutonomy", value: "38" },
  ], { baselines: { "South Korea": LIVE_SHEET } });
  assert.equal(entries["Saudi Arabia"], undefined);
  assert.equal(entries["South Korea"].indices.energyAutonomy, 38);
  assert.equal(dropped.length, 1);
  assert.match(dropped[0].why, /no stat sheet was shown/);
});

test("…and with no baselines given at all, nothing is gated on them", () => {
  const { entries } = applyStatChanges({}, [{ code: "Anywhere", field: "stability", value: "50" }], {});
  assert.equal(entries.Anywhere.stability, 50);
});

// ---- 3c. a GDP share cannot move on its own ------------------------------------------

test("THE LIVE RUN MOVED ONE SHARE ALONE, which is always wrong", () => {
  // industry 76 → 78 by itself would leave the sheet reading 45 / 78 / 32.
  const { entries, dropped } = applyStatChanges({}, [{ code: "South Korea", field: "industry", value: "78" }],
    { baselines: { "South Korea": LIVE_SHEET } });
  assert.equal(entries["South Korea"], undefined);
  assert.match(dropped[0].why, /moves only with the other two/);
  assert.match(dropped[0].why, /industry alone/);
});

test("THE FIX: all three together, and they have to add up", () => {
  const { entries, dropped } = applyStatChanges({}, [
    { code: "South Korea", field: "agriculture", value: "2" },
    { code: "South Korea", field: "industry", value: "38" },
    { code: "South Korea", field: "services", value: "60" },
  ], { baselines: { "South Korea": LIVE_SHEET } });
  assert.deepEqual(dropped, []);
  assert.deepEqual(entries["South Korea"].gdpBreakdown, { agriculture: 2, industry: 38, services: 60 });
});

test("…and three that do NOT add up are refused as a set", () => {
  const { entries, dropped } = applyStatChanges({}, [
    { code: "South Korea", field: "agriculture", value: "45" },
    { code: "South Korea", field: "industry", value: "78" },
    { code: "South Korea", field: "services", value: "32" },
  ], { baselines: { "South Korea": LIVE_SHEET } });
  assert.equal(entries["South Korea"], undefined);
  assert.equal(dropped.length, 3);
  assert.match(dropped[0].why, /total 155, not ~100/);
});

test("the rounding tolerance is the one the sheet already uses, not a new one", () => {
  for (const total of [[2, 38, 59], [3, 38, 60]]) {
    const { dropped } = applyStatChanges({}, BREAKDOWN_ROWS(total), { baselines: { X: LIVE_SHEET } });
    assert.deepEqual(dropped, [], `${total.join("+")} = ${total.reduce((a, b) => a + b)}`);
  }
});

test("…and one country's bad breakdown never blocks another's good one", () => {
  const { entries, dropped } = applyStatChanges({}, [
    { code: "X", field: "industry", value: "78" },
    { code: "Y", field: "agriculture", value: "2" },
    { code: "Y", field: "industry", value: "38" },
    { code: "Y", field: "services", value: "60" },
    { code: "X", field: "stability", value: "70" },
  ], { baselines: { X: LIVE_SHEET, Y: LIVE_SHEET } });
  assert.equal(entries.Y.gdpBreakdown.industry, 38);
  assert.equal(entries.X.stability, 70, "and a non-share field on X is unaffected");
  assert.equal(dropped.length, 1);
});

test("THE DELTA MISTAKE: the engine's own guard is applied to every bounded field", () => {
  // Writing 3 to mean "+3" is the single most common way this goes wrong, and it
  // has already happened once on this campaign's stability.
  const refuse = ({ next, previous }) => !(Number.isFinite(previous) && Math.abs(next - previous) > 8);
  const { entries, dropped } = applyStatChanges({ "South Korea": LIVE_SHEET }, [
    { code: "South Korea", field: "stability", value: "3" },
    { code: "South Korea", field: "sovereignty", value: "87" },
  ], { accept: refuse });
  assert.equal(entries["South Korea"].stability, 85, "the delta is refused, the old value stands");
  assert.equal(entries["South Korea"].indices.sovereignty, 87, "an ordinary move is kept");
  assert.equal(dropped.length, 1);
  assert.match(dropped[0].why, /not a move this turn accounts for/);
});

test("…but the guard never runs on a free-text field, which has no range", () => {
  const never = () => false;
  const { entries } = applyStatChanges({}, [{ code: "A", field: "gdp", value: "1,340조 원" }], { accept: never });
  assert.equal(entries.A.economy.gdp, "1,340조 원");
});

test("nothing in, nothing out", () => {
  for (const input of [null, undefined, [], "not a list", {}]) {
    const { entries, applied, dropped } = applyStatChanges({ A: { stability: 1 } }, input, {});
    assert.deepEqual(entries, { A: { stability: 1 } });
    assert.deepEqual(applied, []);
    assert.deepEqual(dropped, []);
  }
});

// ---- 4. what the player ends up seeing ---------------------------------------------

test("THE CAMPAIGN ALWAYS WINS over a freshly generated base", () => {
  const changes = { indices: { energyAutonomy: 38 }, leader: "문재인" };
  const regenerated = { ...LIVE_SHEET, leader: "박근혜", indices: { ...LIVE_SHEET.indices, energyAutonomy: 35 } };
  const shown = mergeStatSheet(regenerated, changes);
  assert.equal(shown.leader, "문재인", "a generated sheet must not reinstate a leader the campaign replaced");
  assert.equal(shown.indices.energyAutonomy, 38);
  assert.equal(shown.economy.gdp, "1,250조 원", "and everything untouched comes from the base");
});

test("a merge with nothing on either side degrades quietly", () => {
  assert.deepEqual(mergeStatSheet(LIVE_SHEET, null), LIVE_SHEET);
  assert.deepEqual(mergeStatSheet(null, { leader: "문재인" }), { leader: "문재인" });
});

// ---- 4b. one person, many spellings — the comparisons every gate shares ------------

test("sameLeaderPerson sees through titles in every arrangement", () => {
  // bare ↔ roster order ↔ news order — the transition's three live spellings.
  assert.ok(sameLeaderPerson("박근혜", "대통령 박근혜"));
  assert.ok(sameLeaderPerson("박근혜 대통령", "박근혜"));
  assert.ok(sameLeaderPerson("대통령 박근혜", "박근혜 대통령"), "roster vs news order is the same person");
  // A different office on the same person (a reshuffle, a promotion).
  assert.ok(sameLeaderPerson("총리 황교안", "대통령 권한대행 황교안"));
  // A patronymic inserted mid-name.
  assert.ok(sameLeaderPerson("블라디미르 푸틴", "블라디미르 블라디미로비치 푸틴"));
  // Different people stay different.
  assert.ok(!sameLeaderPerson("박근혜", "문재인"));
  assert.ok(!sameLeaderPerson("대통령 박근혜", "대통령 문재인"));
  assert.ok(!sameLeaderPerson("김이재명", "이재명"), "no space boundary, no match");
  assert.ok(!sameLeaderPerson("", "대통령 박근혜"));
});

test("role sentinels are recognized in their common spellings, and bucketed honestly", () => {
  for (const spelling of ["(없음)", "없음", "해당 없음", "겸직", "(미확인)", "미확인", "공석", "미상", "불명", "알 수 없음", "none", "N/A", "unknown", "—", "-"]) {
    assert.ok(isRoleSentinel(spelling), `${spelling} is a sentinel`);
  }
  assert.ok(!isRoleSentinel("대통령 박근혜"));
  assert.ok(!isRoleSentinel("노네"), "a real name that merely contains letters is not a sentinel");
  // "no such office" vs "office exists, holder unknown" — and "—" is this
  // codebase's own UNKNOWN_STAT, so it sides with unknown.
  assert.equal(canonicalRoleSentinel("겸직"), "(없음)");
  assert.equal(canonicalRoleSentinel("none"), "(없음)");
  assert.equal(canonicalRoleSentinel("미확인"), "(미확인)");
  assert.equal(canonicalRoleSentinel("공석"), "(미확인)");
  assert.equal(canonicalRoleSentinel("—"), "(미확인)");
});

test("a spelling change is not a leadership move, and a sentinel cannot erase a leader", () => {
  const baselines = { "South Korea": { leader: "대통령 박근혜" } };
  // Same person, shorter spelling → no move recorded.
  const same = applyStatChanges({}, [{ code: "South Korea", field: "leader", value: "박근혜" }], { baselines });
  assert.deepEqual(same.applied, []);
  assert.equal(same.entries["South Korea"]?.leader, undefined);
  // A sentinel arriving in leader is a shrug, not a succession.
  const shrug = applyStatChanges({}, [{ code: "South Korea", field: "leader", value: "(미확인)" }], { baselines });
  assert.equal(shrug.applied.length, 0);
  assert.equal(shrug.dropped.length, 1);
  assert.match(shrug.dropped[0].why, /sentinel/);
  // A REAL succession still lands.
  const coup = applyStatChanges({}, [{ code: "South Korea", field: "leader", value: "대통령 권한대행 황교안" }], { baselines });
  assert.equal(coup.applied.length, 1);
  assert.equal(coup.entries["South Korea"].leader, "대통령 권한대행 황교안");
});

// ---- 5. the one-time rescue of existing saves ---------------------------------------

test("THE RESCUE keeps exactly the fields events were measured to write", () => {
  // stability in 17 of 28 rounds, leader in 4. economy in 0, indices in 0.
  const rescued = rescueLegacySheet(LIVE_SHEET);
  assert.deepEqual(Object.keys(rescued).sort(), ["capital", "government", "leader", "stability"]);
  assert.equal(rescued.leader, "문재인", "the AI-installed president survives the split");
  assert.equal(rescued.stability, 85);
  assert.equal(rescued.indices, undefined, "and the numbers events never wrote go back to being generated");
  assert.equal(rescued.economy, undefined);
  assert.deepEqual(RESCUED_FIELDS.sort(), ["capital", "government", "leader", "stability"]);
});

test("…and a save with nothing to rescue rescues nothing", () => {
  assert.equal(rescueLegacySheet(null), null);
  assert.equal(rescueLegacySheet({}), null);
  assert.equal(rescueLegacySheet({ indices: { energyAutonomy: 35 } }), null);
});

// ---- 6. what the model is shown, and what it may answer -------------------------------

test("the sheet is rendered FLAT, because the answer asked for is flat", () => {
  const text = buildStatSheetText(LIVE_SHEET);
  assert.match(text, /energyAutonomy \(domestic energy autonomy\): 35/);
  assert.match(text, /gdp \(GDP\): 1,250조 원/);
  assert.ok(!text.includes("indices"), "no nesting appears anywhere in it");
  assert.equal(buildStatSheetText(null), "");
});

test("AN EMPTY ANSWER IS A VALID ANSWER — a quiet period must not fail the turn", () => {
  assert.equal(validateGameplayPayload("countryStatShift", { changes: [] }).valid, true);
  assert.equal(validateGameplayPayload("countryStatShift", {
    changes: [{ code: "South Korea", field: "energyAutonomy", value: "38", reason: "수소 거점 가동" }],
  }).valid, true);
});

test("…and reason is optional, because a row without one is still a real move", () => {
  assert.equal(validateGameplayPayload("countryStatShift", {
    changes: [{ code: "South Korea", field: "gdp", value: "1,340조 원" }],
  }).valid, true);
});

test("the schema takes values as TEXT, so \"1,340조 원\" and \"38\" arrive intact", () => {
  const item = GAMEPLAY_SCHEMAS.countryStatShift.properties.changes.items;
  assert.equal(item.properties.value.type, "string");
  assert.deepEqual(item.required, ["code", "field", "value"]);
  assert.equal(item.additionalProperties, false);
});

// ---- 7. wiring --------------------------------------------------------------------

test("THE PASS RUNS ON EVERY JUMP, and cannot cost the turn", () => {
  assert.match(GAMEPLAY, /const recordStatShifts = async/);
  assert.match(GAMEPLAY, /const statChanges = await recordStatShifts\(/);
  assert.match(GAMEPLAY, /\[stats\] the national-statistics pass failed; the completed turn will still be saved\./);
});

test("…and the baselines it passes are exactly the sheets it SHOWED", () => {
  assert.match(GAMEPLAY, /const baselines = Object\.fromEntries\(sheets\.map\(\(entry\) => \[entry\.code, entry\.sheet\]\)\);/);
  assert.match(GAMEPLAY, /\n    baselines,\n    date,/);
});

test("…and reports what moved AND what it threw away", () => {
  assert.match(GAMEPLAY, /\[stats\] \$\{merged\.applied\.length\} statistic\(s\) moved/);
  assert.match(GAMEPLAY, /this period moved no national statistics/);
  assert.match(GAMEPLAY, /dropped \$\{merged\.dropped\.length\} reported change\(s\)/);
});

test("THE TWO STORES ARE SEPARATE, in the world and in its normalizer", () => {
  assert.match(STATE, /countryStatChanges: \{\},/);
  assert.match(STATE, /const countryStatChanges = Object\.fromEntries\(/);
  assert.match(STATE, /^\s+countryStatChanges,$/m, "and it survives normalizeWorldState");
});

test("THE EARLY RETURN IS DATE-GATED NOW — that is what froze the sheet", () => {
  // Was an exact-date match — which staled every sheet every turn and
  // regenerated the base per country per turn (see /tmp/sheets.mjs). The gate
  // is a freshness WINDOW now; what this test still pins is that a gate exists
  // and the persisted sheet must pass it before being shown.
  assert.match(STATS_UI, /const describesNow = sheetDescribesNow\(asOf, player\.date\)/);
  // The gate gained the format stamp and the sentinel-leader check with the
  // titled-leader change: a pre-format base regenerates once to pick its
  // titles up, and a healed "(미확인)" leader must never be served as fresh.
  assert.match(STATS_UI, /if \(describesNow && format === SHEET_FORMAT && persisted && !isRoleSentinel\(persisted\.leader\)/);
  // The device cache gained the same gates (plus baseKnown — a wiped base must
  // not hide behind a cached copy); the date gate this test pins still stands.
  assert.match(STATS_UI, /const cachedIsCurrent = cached && baseKnown && cached\.format === SHEET_FORMAT/);
  assert.match(STATS_UI, /&& !isRoleSentinel\(cached\.sheet\?\.leader\) && sheetDescribesNow\(cached\.date, player\.date\)/);
});

test("…and the base is stamped when it is written, or the gate can never open", () => {
  assert.match(GAMEPLAY, /const stamped = \{ \.\.\.payload, __asOf: sheetDate, __format: SHEET_FORMAT \};/);
  assert.match(STATS_UI, /const \{ __asOf: asOf, __format: format, \.\.\.rest \} = world\?\.countryStats\?\.\[code\] \?\? \{\};/);
});

test("a failed refresh shows last year's sheet rather than an error", () => {
  assert.match(STATS_UI, /A LAST YEAR'S SHEET BEATS AN ERROR MESSAGE\./);
  assert.match(STATS_UI, /could not refresh \$\{code\}'s sheet for \$\{player\.date\}/);
});

// ---- 8. the bug this work uncovered in the ledger -------------------------------------

test("CALL-SITE EXTRAS REACH THE PROMPT: the ledger was never shown its own facts", () => {
  // buildPromptContext destructures a fixed option list, so standingFacts —
  // and statSheets after it — were dropped before runJsonTask could read them.
  assert.match(GAMEPLAY, /CALL-SITE EXTRAS HAVE TO SURVIVE THIS\./);
  const spread = GAMEPLAY.indexOf("    ...options,\n    ...variables,");
  assert.ok(spread > 0, "options are spread first so a real context variable still wins");
});

console.log(`\n${pass} passed`);

// Three things at once: the settings the engine supported and never exposed, a
// city that could not be edited, and a difficulty setting that did nothing.
import assert from "node:assert/strict";
import { MAP_RENDER_DEFAULTS, MAP_RENDER_KEYS, getMapRenderValue } from "../src/runtime/mapSettings.js";
import { buildLeaderPlacement } from "../src/runtime/labelLeaders.js";
import fs from "node:fs";
import {
  ACTION_OUTCOMES,
  DIFFICULTY_LEVELS,
  SETBACK_SHARE,
  countOrderOutcomes,
  difficultyChatDirective,
  isCleanSuccess,
  normalizeActionOutcome,
  normalizeDifficulty,
  setbackDirective,
  capShortfall,
  setbackQuota,
  setbackShare,
} from "../src/runtime/difficulty.js";
import {
  CITY_KIND,
  citySize,
  cityToMarker,
  hidePromotedCitiesFilter,
  promotedCityNames,
  searchCitySeed,
} from "../src/runtime/cityFeatures.js";
import { normalizeMarkerEntry, normalizeWorldState } from "../src/runtime/gameState.js";
import { applyStatChanges, resolveStatCountry } from "../src/runtime/countryStatLedger.js";
import { GAMEPLAY_SCHEMAS } from "../src/Game/AI/gameplaySchemas.js";

let pass = 0;
const test = (name, fn) => { fn(); pass += 1; console.log(`  ok  ${name}`); };

const SETTINGS = fs.readFileSync(new URL("../src/Game/GameUI/settings.jsx", import.meta.url), "utf8");
const WORLD = fs.readFileSync(new URL("../src/Game/Map/World.jsx", import.meta.url), "utf8");
const CITIES = fs.readFileSync(new URL("../src/Game/Map/Cities.jsx", import.meta.url), "utf8");
const CHEATS = fs.readFileSync(new URL("../src/Game/GameUI/cheats.jsx", import.meta.url), "utf8");
const MAPSET = fs.readFileSync(new URL("../src/runtime/mapSettings.js", import.meta.url), "utf8");
const GAMEPLAY = fs.readFileSync(new URL("../src/Game/AI/gameplay.js", import.meta.url), "utf8");
const ASSETS = fs.readFileSync(new URL("../src/runtime/assets.js", import.meta.url), "utf8");
const NATIONS = fs.readFileSync(new URL("../src/Game/Map/Nations.jsx", import.meta.url), "utf8");
const LAYER = fs.readFileSync(new URL("../src/Game/Map/MarkersLayer.jsx", import.meta.url), "utf8");
const SCHEMAS = fs.readFileSync(new URL("../src/Game/AI/gameplaySchemas.js", import.meta.url), "utf8");
const ESLINT = fs.readFileSync(new URL("../eslint.config.js", import.meta.url), "utf8");

// ---- 1. the basemap picker that was never there --------------------------------

test("TEN BASEMAPS SHIP, and until now nothing could pick one", () => {
  const ids = [...ASSETS.matchAll(/\{ id: "([a-z-]+)", label: "[^"]+", service:/g)].map((m) => m[1]);
  assert.equal(ids.length, 10, ids.join(", "));
  assert.ok(ids.includes("ocean"), "the default everyone has been stuck on");
  assert.ok(ids.includes("imagery") && ids.includes("dark-gray"));
});

test("THE FIX: a stored choice, and the map honours it", () => {
  assert.match(MAPSET, /basemapStyle: "map_basemap_style"/);
  assert.match(MAPSET, /export function getMapChoice\(key\)/);
  assert.match(MAPSET, /export function setMapChoice\(key, value\)/);
  assert.match(MAPSET, /export function useMapChoice\(key\)/);
  assert.match(WORLD, /const chosenBasemap = useMapChoice\(MAP_SETTING_KEYS\.basemapStyle\);/);
  // The chain gained a name (activeBasemap) when the OHM branch arrived; the
  // precedence it pins is unchanged.
  assert.match(WORLD, /const activeBasemap = chosenBasemap \|\| worldBasemap \|\| DEFAULT_BASEMAP_ID;/);
  assert.match(WORLD, /buildWorldStyle\(activeBasemap/);
});

test("…and the comment that said it was impossible is gone", () => {
  assert.ok(!WORLD.includes("the in-game basemap picker was removed"));
});

test("the picker is in Settings, with a way back to the scenario's own", () => {
  assert.match(SETTINGS, /const BasemapPicker = \(\) => \{/);
  assert.match(SETTINGS, /\{ id: "", label: "Scenario default" \}/);
  assert.match(SETTINGS, /<BasemapPicker \/>/);
});

// ---- 2. difficulty stays a CHEAT ---------------------------------------------

test("DIFFICULTY IS A CHEAT, not a setting — the original classifies it there", () => {
  // It is chosen when a campaign starts and steers every prompt after that;
  // changing it halfway leaves the model's picture at odds with the run so far.
  assert.match(CHEATS, /A CHEAT, NOT A SETTING — the original classifies it here for a reason\./);
  assert.match(CHEATS, /\{ id: "difficulty", title: "Difficulty"/);
  assert.ok(!SETTINGS.includes("DifficultyPicker"), "and it is not duplicated in Settings");
  assert.ok(!SETTINGS.includes("DIFFICULTY_LEVELS"));
});

test("…and every level is still offered, in order", () => {
  assert.deepEqual(DIFFICULTY_LEVELS.map((level) => level.id),
    ["very-easy", "easy", "medium", "hard", "very-hard", "impossible"]);
  assert.match(CHEATS, /\{DIFFICULTY_LEVELS\.map\(\(level\) => \(/);
});

// ---- 3. THE AUDIT: what "impossible" was actually doing ---------------------------

test("THE DIAL IS ABOUT PREPARATION NOW, not about the world's mood", () => {
  // The original's own axis: "you will always be able to attempt anything,
  // however your success is dependent on the difficulty and how much planning
  // you needed to do". The old text said the world "conspires against" you,
  // which is a mood — and 31 rounds of it changed nothing.
  const impossible = DIFFICULTY_LEVELS.find((level) => level.id === "impossible");
  assert.match(impossible.directive, /WITHOUT the minor actions that prepare the ground first/);
  assert.match(impossible.directive, /long-term, possibly irreparable damage/);
  for (const level of DIFFICULTY_LEVELS) {
    assert.ok(!/conspires against|favors the player|hostile to the player/.test(level.directive), level.id);
  }
});

test("EVERY LEVEL NOW ALSO SPEAKS IN THE CHAT — the half that was missing", () => {
  // A difficulty that shapes simulation but leaves diplomacy alone is one you
  // talk your way around, which the original's wiki names as the reason players
  // find hard modes easy.
  for (const level of DIFFICULTY_LEVELS) {
    assert.ok(level.chatDirective && level.chatDirective.length > 40, level.id);
    assert.equal(difficultyChatDirective(level.id), level.chatDirective);
  }
  assert.match(difficultyChatDirective("impossible"), /overwhelming, concrete evidence/);
  assert.match(difficultyChatDirective("very-easy"), /extremely receptive/);
});

test("…and every level above Easy forces a direct answer rather than a runaround", () => {
  for (const id of ["medium", "hard", "very-hard", "impossible"]) {
    assert.match(difficultyChatDirective(id), /direct, official answer quickly/, id);
  }
});

// ---- 4. an order can finally come out badly ----------------------------------------

test("FOUR OUTCOMES, and anything unrated is a clean success", () => {
  assert.deepEqual(ACTION_OUTCOMES, ["succeeded", "partial", "failed", "backfired"]);
  assert.equal(normalizeActionOutcome(undefined), "succeeded");
  assert.equal(normalizeActionOutcome(""), "succeeded", "every event written before this field existed");
  assert.equal(normalizeActionOutcome("nonsense"), "succeeded");
});

test("…and the words a model reaches for map onto them", () => {
  assert.equal(normalizeActionOutcome("SUCCESS"), "succeeded");
  assert.equal(normalizeActionOutcome("delayed"), "partial");
  assert.equal(normalizeActionOutcome("mixed"), "partial");
  assert.equal(normalizeActionOutcome("blocked"), "failed");
  assert.equal(normalizeActionOutcome("rejected"), "failed");
  assert.equal(normalizeActionOutcome("counterproductive"), "backfired");
  assert.equal(isCleanSuccess("partial"), false);
  assert.equal(isCleanSuccess("succeeded"), true);
});

test("THE SHARE LADDER follows the original's own wording", () => {
  // Easy is "minimum chance of failure"; Normal has "a high chance to backfire";
  // Hard is "often fail or backfire"; Impossible is "all major actions fail".
  assert.equal(setbackShare("very-easy"), 0);
  assert.ok(setbackShare("easy") > 0 && setbackShare("easy") < setbackShare("medium"));
  assert.ok(setbackShare("medium") < setbackShare("hard"));
  assert.ok(setbackShare("hard") < setbackShare("very-hard"));
  assert.ok(setbackShare("very-hard") < setbackShare("impossible"));
  assert.deepEqual(Object.keys(SETBACK_SHARE).sort(), DIFFICULTY_LEVELS.map((l) => l.id).sort());
});

test("A SHARE, NOT A COUNT — two orders never owe the same as twenty", () => {
  // The arbitrary-punishment failure mode this replaces: a fixed quota made a
  // quiet turn owe as many disasters as a busy one.
  assert.equal(setbackQuota("impossible", 2), 1);
  assert.equal(setbackQuota("impossible", 20), 15);
  assert.equal(setbackQuota("medium", 2), 0, "one order on Medium owes nothing");
  assert.equal(setbackQuota("medium", 8), 2);
  assert.equal(setbackQuota("very-easy", 20), 0);
});

test("…and it rounds DOWN, so a small turn is never forced into a failure", () => {
  assert.equal(setbackQuota("hard", 1), 0);
  assert.equal(setbackQuota("hard", 2), 0);
  assert.equal(setbackQuota("hard", 3), 1);
});

test("an unknown or legacy difficulty falls back to medium", () => {
  assert.equal(normalizeDifficulty("standard"), "medium");
  assert.equal(setbackShare("standard"), setbackShare("medium"));
  assert.equal(setbackShare("nonsense"), setbackShare("medium"));
});

// The live campaign's actual shape: every order eventually lands, nothing fails.
const CLEAN_TURN = [
  { status: "resolved", resolvedRound: 31, outcome: "succeeded" },
  { status: "resolved", resolvedRound: 31, outcome: "succeeded" },
  { status: "resolved", resolvedRound: 31 },
];

test("THE LIVE SHAPE: a turn where everything landed counts zero setbacks", () => {
  const seen = countOrderOutcomes(CLEAN_TURN);
  assert.equal(seen.resolved, 3);
  assert.equal(seen.setbacks, 0, "31 rounds of this is what 'impossible' has been");
  assert.equal(seen.succeeded, 3, "an unrated order is a clean success");
});

test("…and a turn with real friction counts it", () => {
  const seen = countOrderOutcomes([
    { status: "resolved", resolvedRound: 32, outcome: "succeeded" },
    { status: "resolved", resolvedRound: 32, outcome: "partial" },
    { status: "resolved", resolvedRound: 32, outcome: "backfired" },
    { status: "planned" },
  ]);
  assert.equal(seen.resolved, 3, "a still-queued order has no outcome to count");
  assert.equal(seen.setbacks, 2);
  assert.equal(seen.partial, 1);
  assert.equal(seen.backfired, 1);
});

test("a round filter counts only that round", () => {
  const actions = [
    { status: "resolved", resolvedRound: 30, outcome: "failed" },
    { status: "resolved", resolvedRound: 31, outcome: "succeeded" },
  ];
  assert.equal(countOrderOutcomes(actions, { round: 31 }).resolved, 1);
  assert.equal(countOrderOutcomes(actions, { round: 31 }).setbacks, 0);
});

test("nothing in, nothing out", () => {
  assert.equal(countOrderOutcomes([]).resolved, 0);
  assert.equal(countOrderOutcomes(null).setbacks, 0);
});

test("THE DIRECTIVE ASKS ABOUT THE PLAYER'S OWN ATTEMPTS", () => {
  const text = setbackDirective("impossible", { playerPolity: "대한민국", shortfall: 0 });
  assert.match(text, /\[How The Player's Orders Come Out\]/);
  assert.match(text, /"actionOutcomes": a flat list/);
  assert.match(text, /roughly 75% of the orders/);
  assert.match(text, /how realistic it was, whether the groundwork for it exists/);
  assert.match(text, /backfire with no impact is a story about nothing/);
  assert.match(text, /A failed order STAYS the player's to retry/);
});

test("…a debt from last period is stated outright", () => {
  assert.match(setbackDirective("hard", { shortfall: 2 }), /returned 2 fewer/);
  assert.ok(!setbackDirective("hard", { shortfall: 0 }).includes("fewer than"));
});

test("…and Very Easy asks for nothing at all", () => {
  assert.equal(setbackDirective("very-easy", { shortfall: 5 }), "");
});

test("A FAILED ORDER GOES BACK IN THE QUEUE rather than being ticked off", () => {
  assert.match(GAMEPLAY, /A FAILURE MUST NOT SILENTLY CLEAR THE ORDER\./);
  assert.match(GAMEPLAY, /if \(outcome === "failed" \|\| outcome === "backfired"\) \{/);
  assert.match(GAMEPLAY, /order\(s\) did not come off and go back in the queue/);
});

test("IT IS APPENDED LAST, because the tonal one has been buried for 31 rounds", () => {
  const tonal = GAMEPLAY.indexOf("systemPrompt = `${systemPrompt}\\n\\n${difficultyDirective(game.difficulty)}`;");
  const reference = GAMEPLAY.indexOf("${ACTIONS_REFERENCE}");
  const owed = GAMEPLAY.indexOf("const owed = setbackDirective(difficultyForTask");
  assert.ok(tonal > 0 && reference > tonal, "the tonal line comes first, as it always did");
  assert.ok(owed > reference, "and the countable one comes after even the actions reference");
});

test("the engine checks afterwards and carries the shortfall forward", () => {
  assert.match(GAMEPLAY, /DID THE DIFFICULTY ACTUALLY HAPPEN\?/);
  assert.match(GAMEPLAY, /const setbacks = rated\.filter\(\(action\) => !isCleanSuccess\(action\.outcome\)\)\.length;/);
  assert.match(GAMEPLAY, /nextWorld = \{ \.\.\.nextWorld, setbackShortfall: shortfall \};/);
  assert.match(GAMEPLAY, /setbackShortfall: Number\(bundle\.world\?\.setbackShortfall\) \|\| 0,/);
});

test("…and the debt survives a save, clamped to a whole non-negative number", () => {
  assert.equal(normalizeWorldState({ setbackShortfall: 3 }).setbackShortfall, 3);
  assert.equal(normalizeWorldState({ setbackShortfall: -2 }).setbackShortfall, 0);
  assert.equal(normalizeWorldState({}).setbackShortfall, 0);
});

// ---- 5. a city is a feature -------------------------------------------------------

const SEOUL = { name: "Seoul", coord: [126.99, 37.56], population: 9_776_000, capital: "primary", tags: ["city"] };
const BUSAN = { name: "Busan", coord: [129.07, 35.18], population: 3_400_000, capital: false, tags: ["city"] };
const NOWHERE = { name: "Broken", coord: [null, null], population: 10 };

test("SEARCH RANKS THE CITY YOU MEAN FIRST", () => {
  const seed = [{ name: "Seoul Gardens", coord: [1, 1], population: 900 }, SEOUL, { name: "New Seoul", coord: [2, 2], population: 50_000 }];
  assert.deepEqual(searchCitySeed(seed, "seoul").map((c) => c.name), ["Seoul", "Seoul Gardens", "New Seoul"],
    "exact, then prefix by size, then substring");
});

test("…a one-letter query searches nothing, and a broken row is never offered", () => {
  assert.deepEqual(searchCitySeed([SEOUL], "s"), []);
  assert.deepEqual(searchCitySeed([NOWHERE], "broken"), [], "no coordinate, no place");
  assert.deepEqual(searchCitySeed(null, "seoul"), []);
});

test("A PROMOTED CITY IS AN ORDINARY FEATURE", () => {
  const marker = cityToMarker(SEOUL, { ownerCode: "South Korea" });
  assert.equal(marker.kind, CITY_KIND);
  assert.equal(marker.ownerCode, "South Korea");
  assert.deepEqual([marker.lng, marker.lat], [126.99, 37.56]);
  assert.equal(marker.note, "수도");
  // …and survives the world's own normalizer, which is what makes it editable.
  const stored = normalizeMarkerEntry(marker);
  assert.equal(stored.kind, "city");
  assert.equal(stored.name, "Seoul");
  assert.ok(!("status" in stored), "a city that already exists is not under construction");
});

test("size follows what the city IS, on the 0.5–3 scale every feature uses", () => {
  // Retuned onto the CITY band after the first promoted capital (Seoul)
  // ballooned to "monumental". The ORDER is the invariant; amplitude shrank.
  assert.equal(citySize(SEOUL), 1.6, "a capital, whatever its population");
  assert.equal(citySize({ population: 8_000_000 }), 1.4, "a megacity");
  assert.equal(citySize(BUSAN), 1.2, "3.4M — a major city, not a megacity");
  assert.equal(citySize({ population: 300_000 }), 1);
  assert.equal(citySize({ population: 60_000 }), 0.8);
  assert.equal(citySize({ population: 900 }), 0.6);
  assert.equal(citySize({}), 0.6, "unknown population reads as small, never as large");
});

test("an unusable row promotes to nothing rather than to a broken marker", () => {
  assert.equal(cityToMarker(NOWHERE, {}), null);
  assert.equal(cityToMarker(null, {}), null);
});

// ---- 6. and the stock layer stops drawing its copy -----------------------------------

test("THE DOUBLE DRAW: a promoted city is filtered out of the tiles", () => {
  const markers = [{ name: "Seoul", kind: "city" }, { name: "부산 수소 거점", kind: "port" }];
  assert.deepEqual([...promotedCityNames(markers)], ["seoul"], "only city-kind features count");
  const filter = hidePromotedCitiesFilter(markers, {});
  assert.deepEqual(filter, ["!", ["in", ["downcase", ["coalesce", ["get", "city"], ""]], ["literal", ["seoul"]]]]);
});

test("…including one the AI had renamed before it was promoted", () => {
  // The tiles still say "Seoul"; the feature is called 서울특별시. Both have to go.
  const filter = hidePromotedCitiesFilter([{ name: "서울특별시", kind: "city" }], { seoul: "서울특별시" });
  const names = filter[1][2][1];
  assert.deepEqual(names.sort(), ["seoul", "서울특별시"]);
});

test("NOTHING PROMOTED COSTS NOTHING", () => {
  assert.equal(hidePromotedCitiesFilter([], {}), null);
  assert.equal(hidePromotedCitiesFilter([{ name: "항구", kind: "port" }], {}), null);
  assert.equal(hidePromotedCitiesFilter(null, null), null);
});

test("both city layers take the filter, and both kinds of map", () => {
  // Both take fontStack too now (the original's map-text-font setting), but the
  // invariant here is the FILTER reaching both layers on both kinds of map.
  //
  // Since A-2 (2026-08-19, Cowork) the label layers take a COMPOSED filter —
  // the same base filter ∧ the rank on/off ladder — so "4 × filter={filter}"
  // became 2 dots + 2 labels. The invariant did not change: the promoted-city
  // hide must reach all four layers, and the two composition lines pinned last
  // are what keep the base filter from falling out of the label side.
  assert.match(CITIES, /const StockCities = \(\{ label, filter, labelFilter, fontStack \}\) => \(/);
  assert.match(CITIES, /const CustomCities = \(\{ data, label, filter, labelFilter, fontStack \}\) => \(/);
  assert.match(CITIES, /const stockFilter = React\.useMemo\(/);
  assert.match(CITIES, /const customFilter = React\.useMemo\(/);
  assert.equal((CITIES.match(/filter=\{filter\}/g) || []).length, 2, "the dot layers, stock and custom");
  assert.equal((CITIES.match(/filter=\{labelFilter\}/g) || []).length, 2, "the label layers, stock and custom");
  assert.match(CITIES, /\["all", stockFilter, stockLabelGateFilter\]/,
    "the stock label filter must compose the base filter, or promoted-city hiding dies on stock maps");
  assert.match(CITIES, /\["all", customFilter, customLabelTierFilter\]/,
    "the custom label filter must compose the base filter, or promoted-city hiding dies on custom maps");
});

test("the editor offers the search instead of saying it cannot be done", () => {
  assert.match(CHEATS, /A CITY IS A FEATURE NOW/);
  assert.match(CHEATS, /const StockCityPromoter = \(\{ busy, markers, onPromote \}\)/);
  assert.match(CHEATS, /<StockCityPromoter/);
  assert.ok(!CHEATS.includes("can't be edited directly"), "the old dead end is gone");
});

test("…and a promoted city is owned by the ground it stands on", () => {
  assert.match(CHEATS, /locateRegion\(index, city\.coord\[0\], city\.coord\[1\]/);
});

// ---- 7. consolidation, which the original exposes and this did not ------------------

test("THE FOUR CONSTANTS ARE SETTINGS NOW, with the original's own defaults", () => {
  assert.match(MAPSET, /startRound: 15,/, "the original holds consolidation off until round 15");
  assert.match(MAPSET, /intervalRounds: 5,/, "and runs in 5-round chunks after that");
  assert.match(MAPSET, /retainEvents: 24,/);
  assert.match(MAPSET, /sizeThreshold: 48,/);
  assert.match(MAPSET, /export function getConsolidationSettings\(\)/);
});

test("…every one is bounded, because below the floor it stops meaning anything", () => {
  // Scoped to CONSOLIDATION_BOUNDS rather than the whole file: the map-rendering
  // dials landed in the same file with the same `name: [min, max],` shape, and a
  // file-wide scan quietly started counting those too.
  const block = MAPSET.slice(
    MAPSET.indexOf("export const CONSOLIDATION_BOUNDS"),
    MAPSET.indexOf("export function getConsolidationSetting"),
  );
  const bounds = [...block.matchAll(/^\s{4}(\w+): \[(\d+), (\d+)\],$/gm)]
    .map(([, name, min, max]) => [name, Number(min), Number(max)]);
  assert.equal(bounds.length, 4);
  for (const [name, min, max] of bounds) assert.ok(min >= 1 && max > min, `${name} ${min}-${max}`);
  assert.ok(bounds.find(([n]) => n === "retainEvents")[1] >= 4,
    "0 recent events kept would hand the model a campaign with no recent memory");
});

test("THE START ROUND ACTUALLY GATES IT — that is the new behaviour", () => {
  assert.match(GAMEPLAY, /const startedConsolidating = round >= tuning\.startRound;/);
  assert.match(GAMEPLAY, /const shouldCompactEvents = startedConsolidating && \(/);
});

// The original states the cadence as "startsOnRound, startsOnRound + chunkSize,
// …" and its own WWII++ ships 10 and 7 — so it fires on 10, 17, 24. Ours read
// `round % intervalRounds === 0`, which is anchored to round ZERO, not to the
// start round: the same 10/7 would have fired on 14, 21, 28. The shipped
// defaults (15, 5) hid it because 15 is a multiple of 5.
test("…and the chunks are counted FROM the start round, not from round zero", () => {
  assert.match(GAMEPLAY, /\(round - tuning\.startRound\) % tuning\.intervalRounds === 0/);
  assert.ok(!/\bround % tuning\.intervalRounds === 0/.test(GAMEPLAY),
    "round % interval is anchored to round zero and drifts off the start round");
});

test("…and the tuning is read per turn, not frozen at import", () => {
  assert.match(GAMEPLAY, /const tuning = getConsolidationSettings\(\);/);
  assert.ok(!GAMEPLAY.includes("const CONSOLIDATION_INTERVAL_ROUNDS ="), "the constants are gone");
  assert.ok(!GAMEPLAY.includes("const CONSOLIDATION_RETAIN_EVENTS ="));
  assert.ok(!GAMEPLAY.includes("const CONSOLIDATION_SIZE_THRESHOLD ="));
  assert.match(GAMEPLAY, /const CONSOLIDATION_BATCH_SIZE = 60;/, "the batch ceiling stays a constant on purpose");
});

test("the panel is in Settings and says nothing is destroyed", () => {
  assert.match(SETTINGS, /CONSOLIDATION, WHICH THE ORIGINAL EXPOSES AND THIS DID NOT\./);
  assert.match(SETTINGS, /<Section title="History Consolidation"/);
  assert.match(SETTINGS, /events stay in the save and in the Event Manager/);
});


// ---- 8. what the first live turn exposed --------------------------------------------

test("\"KR\" AND \"CN\" ARE COUNTRIES — six real changes were lost to a spelling", () => {
  // The pass was shown "## South Korea" and "## China" and answered KR and CN,
  // so every row was refused for naming a country with no sheet.
  const baselines = { "South Korea": { stability: 85 }, China: { stability: 70 } };
  assert.equal(resolveStatCountry("KR", baselines), "South Korea");
  assert.equal(resolveStatCountry("CN", baselines), "China");
  assert.equal(resolveStatCountry("KOR", baselines), "South Korea", "the GADM code too");
  assert.equal(resolveStatCountry("south korea", baselines), "South Korea", "and any casing");
  assert.equal(resolveStatCountry("South Korea", baselines), "South Korea");
});

test("…and a country that really has no sheet is still refused", () => {
  const baselines = { "South Korea": { stability: 85 } };
  assert.equal(resolveStatCountry("Vietnam", baselines), "Vietnam", "unresolved, so the gate still rejects it");
  const { entries, dropped } = applyStatChanges({}, [
    { code: "KR", field: "stability", value: "80" },
    { code: "Vietnam", field: "stability", value: "50" },
  ], { baselines });
  assert.equal(entries["South Korea"].stability, 80, "KR now lands");
  assert.equal(entries.Vietnam, undefined);
  assert.equal(dropped.length, 1);
});

test("THE DEBT IS CAPPED — 0 of 15 rated carried 11 forward, uncapped", () => {
  // Three such turns would demand thirty failures of a fifteen-order period,
  // which is not a hard game but a broken one.
  assert.equal(capShortfall("impossible", 11, 15), 11, "one period's worth is allowed");
  assert.equal(capShortfall("impossible", 30, 15), 11, "and no more");
  assert.equal(capShortfall("hard", 99, 10), 4);
  assert.equal(capShortfall("impossible", -3, 15), 0, "never negative");
  assert.equal(capShortfall("medium", 5, 2), 1, "a floor of 1 so a tiny turn can still owe something");
});

test("ACTION OUTCOMES ARE TOP-LEVEL NOW — nested came back empty on the live turn", () => {
  // Third time this session the same shape failed the same way: nested optional
  // objects go unfilled, flat top-level arrays get filled on the first turn.
  const jump = GAMEPLAY_SCHEMAS.jumpForward.properties;
  assert.ok(jump.actionOutcomes, "beside events, not inside one");
  assert.equal(jump.actionOutcomes.type, "array");
  assert.deepEqual(jump.actionOutcomes.items.required, ["id", "outcome"]);
  assert.deepEqual(jump.actionOutcomes.items.properties.outcome.enum,
    ["succeeded", "partial", "failed", "backfired"]);
  assert.match(SCHEMAS, /TOP LEVEL, NOT NESTED IN AN EVENT'S IMPACTS/);
});

test("…and the engine reads the top-level list, with the nested one still honoured", () => {
  assert.match(GAMEPLAY, /for \(const entry of normalizeArray\(result\.actionOutcomes\)\)/);
  assert.match(GAMEPLAY, /event\?\.impacts\?\.actionOutcomes/, "a turn generated while it was nested still lands");
});

test("the directive asks for it at the top level too", () => {
  assert.match(setbackDirective("hard", {}), /At the TOP LEVEL of your answer — beside "events", not inside one/);
});

// ---- 9. the three display dials ------------------------------------------------------

test("EACH DIAL MULTIPLIES THE TUNED CURVE rather than replacing it", () => {
  assert.match(MAPSET, /zoomSensitivity: "map_zoom_sensitivity"/);
  assert.match(MAPSET, /borderWidth: "map_border_width"/);
  assert.match(MAPSET, /featureSize: "map_feature_size"/);
  assert.match(MAPSET, /DISPLAY_DEFAULTS = \{ zoomSensitivity: 1, borderWidth: 1, featureSize: 1 \}/);
});

test("…and every one is bounded so no setting can make the map unusable", () => {
  const bounds = [...MAPSET.matchAll(/(\w+): \[([\d.]+), ([\d.]+)\]/g)]
    .map(([, name, min, max]) => [name, Number(min), Number(max)])
    .filter(([name]) => ["zoomSensitivity", "borderWidth", "featureSize"].includes(name));
  assert.equal(bounds.length, 3);
  for (const [name, min, max] of bounds) {
    assert.ok(min > 0, `${name} can never be 0 — that hides the thing entirely`);
    assert.ok(max > 1 && max <= 5, `${name} max ${max}`);
  }
});

test("A COUNTRY BORDER IS WEIGHTED BY ZOOM NOW, not a flat hairline", () => {
  assert.match(NATIONS, /A COUNTRY BORDER IS THE LINE THE MAP IS ABOUT\./);
  assert.ok(!NATIONS.includes('"line-width": 1,'), "the flat 1px is gone");
  assert.match(NATIONS, /2, 0\.6 \* borderScale/);
  assert.match(NATIONS, /13, 3\.0 \* borderScale/);
});

test("…and every border layer scales, provinces included", () => {
  // 23 width stops across six layers, plus the 3 province OPACITY stops.
  // Was 16 before the national border was revived and the diverged-region
  // border added (+5), 21 until the owner-coasts layer landed (B-7,
  // 2026-08-19: coastlines at 0.6× national weight — five more width stops,
  // every one riding borderScale, which is exactly what this pin demands).
  // 29 since ㄷ-3 (2026-08-26): the authored internal-line lane joined the
  // tile lane's fade curve — its three stops ride borderScale too, so the
  // Border Fade Range slider moves BOTH lanes together (the one-zoom gap
  // between them was the "들쭉날쭉 재발" the player saw).
  assert.equal((NATIONS.match(/\* borderScale/g) || []).length, 29);
  assert.match(NATIONS, /const borderScale = useDisplayScale\("borderWidth"\);/);
});

test("PROVINCE LINES STAY UNDER COUNTRY LINES at every zoom", () => {
  // Whatever the player sets, both scale together — a province hairline can
  // never outweigh a border, which is what keeps the political map political.
  const country = [[2, 0.6], [4, 1.0], [6, 1.5], [9, 2.2], [13, 3.0]];
  const province = [[7.5, 0.45], [12, 1.0], [14, 1.3]];
  for (const [zoom, width] of province) {
    const countryAt = country.filter(([z]) => z <= zoom).pop()?.[1] ?? 0.6;
    assert.ok(width < countryAt, `z${zoom}: province ${width} vs country ${countryAt}`);
  }
});

test("FEATURE SIZE: relative by default, uniform when asked", () => {
  assert.match(LAYER, /HOW BIG A FEATURE DRAWS, and whether its own size attribute counts\./);
  assert.match(LAYER, /const sizeExpr = absoluteSize\s*\?\s*featureScale\s*:\s*\["\*", \["coalesce", \["get", "size"\], 1\], featureScale\]/);
  assert.match(MAPSET, /featureSizeAbsolute: "map_feature_size_absolute"/);
});

test("ZOOM SENSITIVITY is applied to the live handler, since there is no prop", () => {
  assert.match(WORLD, /HOW FAR ONE WHEEL CLICK GOES\./);
  assert.match(WORLD, /scrollZoom\.setWheelZoomRate\(\(1 \/ 450\) \* zoomSensitivity\);/);
  assert.match(WORLD, /scrollZoom\.setZoomRate\(\(1 \/ 100\) \* zoomSensitivity\);/);
  assert.match(WORLD, /\}, \[zoomSensitivity, mapRef, projection, loading\]\);/, "and re-applied when the map is rebuilt");
});

test("all three are in Settings, with a reset each", () => {
  assert.match(SETTINGS, /const DisplayScalePanel = \(\) => \{/);
  assert.match(SETTINGS, /<DisplayScalePanel \/>/);
  assert.match(SETTINGS, /Uniform feature size/);
  assert.match(SETTINGS, /reset/);
});


// ---- 10. the crash, and the rule that should have caught it -------------------------

test("THE CRASH: a settings panel called useMapSetting without importing it", () => {
  // ReferenceError the moment the player opened Display & Map, and the whole
  // menu came down with it. The panel uses it for the uniform-size toggle.
  assert.match(SETTINGS, /useMapSetting\(MAP_SETTING_KEYS\.featureSizeAbsolute\)/);
  assert.match(SETTINGS, /^\s+useMapSetting,$/m, "and now imports it");
});

test("NO-UNDEF IS ON FOR js/jsx NOW — `eslint src` said the tree was clean", () => {
  // Same lesson as the hooks rule: a violation here is a crash, never an
  // opinion, which is the bar for turning a rule on.
  assert.match(ESLINT, /'no-undef': 'error',/);
  assert.match(ESLINT, /AND NEITHER HAD THIS ONE\./);
});

test("…and the server gets Node globals, or the rule flags 31 correct uses", () => {
  assert.match(ESLINT, /files: \['server\/\*\*\/\*\.js', 'scripts\/\*\*\/\*\.js', '\*\.config\.js'\]/);
  assert.match(ESLINT, /globals: \{ \.\.\.globals\.node \}/);
});

// ---- 11. what "thicker" means for a line drawn at 14% opacity -----------------------

test("WIDTH ALONE IS NOT THICKER: province lines move opacity too", () => {
  // Raised from 0.14/0.4/0.55 once a national border existed to be judged
  // against — at the old values a province edge read as barely there.
  assert.match(NATIONS, /WIDTH ALONE IS NOT WHAT "THICKER" MEANS HERE\./);
  // The zooms these sit at are the player's now (the original's "Border Fade
  // Range"), so they are named stops; the OPACITY values this pin guards are
  // untouched, and the default range resolves them back to 9/12/14.
  assert.match(NATIONS, /fadeStops\[1\], Math\.min\(0\.85, 0\.35 \* borderScale\)/);
  assert.match(NATIONS, /fadeStops\[2\], Math\.min\(0\.85, 0\.65 \* borderScale\)/);
  assert.match(NATIONS, /fadeStops\[3\], Math\.min\(0\.85, 0\.8 \* borderScale\)/);
});

test("…capped, so they never read as hard borders however far it is pushed", () => {
  const at = (scale) => [0.35, 0.65, 0.8].map((stop) => Math.min(0.85, stop * scale));
  assert.deepEqual(at(1), [0.35, 0.65, 0.8], "1.0 is exactly as shipped");
  for (const v of at(4)) assert.ok(v <= 0.85, `${v} must stay under a hard border`);
  assert.ok(at(0.25)[0] < 0.35, "and turning it down really does fade them");
});

test("…while the z7.5 anchor stays at zero, because that one is the design", () => {
  // "Not while you are looking at a continent" is a decision, not a value.
  assert.match(NATIONS, /fadeStops\[0\], 0,\n/);
  assert.match(NATIONS, /the z7\.5 anchor stays at zero/);
});

test("A COUNTRY BORDER NEEDS NO OPACITY LIFT — it already draws at full", () => {
  // This test used to assert `showStockCountries ? 1 : 0` and called that
  // "draws at full". It never drew at all: normalizeRuntimeWorld forces
  // customRegions onto every served world, so showStockCountries is always
  // false and the border was permanently invisible. The test was green the
  // whole time, because it checked the expression and not the pixel.
  assert.match(NATIONS, /"line-opacity": worldKnown \? 1 : 0,/);
  assert.doesNotMatch(NATIONS, /"line-opacity": showStockCountries/);
});

console.log("\nA default is what an untouched setting reads as");

// AN ABSENT KEY IS NOT ZERO, and for the whole life of this file it was.
//
// getMapRenderValue read localStorage.getItem(...) straight into Number().
// getItem returns null for a key nobody has written, Number(null) is 0, and 0
// is finite — so the fallback was unreachable and every value in
// MAP_RENDER_DEFAULTS was dead on arrival for a player who had never moved
// that slider. Measured on a running board before the fix:
//
//   labelLineExtension  table 0.5  ·  map 0   → every leader line zero-length,
//                                              and a zero-length line is dropped
//                                              by the tiler, so none drew at all
//   borderFadeStart/End table 7.5/14 · map 2.25/2.25 (clamped to the floor)
//                                            → the province hairlines this file
//                                              tunes came up at world zoom
//
// These run against a stub localStorage because the getter is browser code;
// the point of the pin is the null branch, which needs no browser.
test("an unwritten key falls back to the documented default, not to 0", () => {
  const original = globalThis.localStorage;
  const store = new Map();
  globalThis.localStorage = {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
  };
  try {
    for (const [name, expected] of Object.entries(MAP_RENDER_DEFAULTS)) {
      assert.equal(getMapRenderValue(name), expected,
        `${name} must read its default while nothing is stored`);
    }
    // A stored value still wins, and an empty string is not a number either.
    store.set(MAP_RENDER_KEYS.labelLineExtension, "1.25");
    assert.equal(getMapRenderValue("labelLineExtension"), 1.25);
    store.set(MAP_RENDER_KEYS.labelLineExtension, "");
    assert.equal(getMapRenderValue("labelLineExtension"), MAP_RENDER_DEFAULTS.labelLineExtension);
    // And a real 0 the player chose is honoured — the bug was reading ABSENCE
    // as 0, not the number itself.
    store.set(MAP_RENDER_KEYS.labelLineExtension, "0");
    assert.equal(getMapRenderValue("labelLineExtension"), 0);
    // Garbage still falls back rather than clamping to a bound.
    store.set(MAP_RENDER_KEYS.labelLineExtension, "abc");
    assert.equal(getMapRenderValue("labelLineExtension"), MAP_RENDER_DEFAULTS.labelLineExtension);
  } finally {
    globalThis.localStorage = original;
  }
});

test("…and the leader line the map draws is therefore not zero-length", () => {
  // The symptom that found it: promoted labels drew, their lines did not.
  const corners = [[12.40, 43.89], [12.51, 43.89], [12.51, 43.99], [12.40, 43.99]];
  const placed = buildLeaderPlacement(corners, [12.455, 43.94], 0, MAP_RENDER_DEFAULTS.labelLineExtension);
  assert.ok(placed, "a real bbox must place");
  const length = Math.hypot(placed.anchor[0] - placed.edge[0], placed.anchor[1] - placed.edge[1]);
  assert.ok(length > 0.4, `San Marino's line is ${length}° long`);
});

console.log(`\n${pass} passed`);

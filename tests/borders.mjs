// The country border that never drew, the quota that asked 24 of 18, the one bad
// row that threw away eighteen verdicts, and the sentence cut into four nodes.
import assert from "node:assert/strict";
import fs from "node:fs";
import { totalSetbacksOwed, setbackQuota, capShortfall } from "../src/runtime/difficulty.js";
import { TOP_LEVEL_ITEM_SCHEMAS, validateAgainstSchema } from "../src/Game/AI/gameplaySchemas.js";

let pass = 0;
const test = (name, fn) => { fn(); pass += 1; console.log(`  ok  ${name}`); };

const NATIONS = fs.readFileSync(new URL("../src/Game/Map/Nations.jsx", import.meta.url), "utf8");
const ACTIONS = fs.readFileSync(new URL("../src/Game/GameUI/actions.jsx", import.meta.url), "utf8");
const GAMEPLAY = fs.readFileSync(new URL("../src/Game/AI/gameplay.js", import.meta.url), "utf8");
const SETTINGS = fs.readFileSync(new URL("../src/Game/GameUI/settings.jsx", import.meta.url), "utf8");
const MAPSET = fs.readFileSync(new URL("../src/runtime/mapSettings.js", import.meta.url), "utf8");

// ---------------------------------------------------------------------------
// A tiny evaluator for the ["interpolate", ["linear"], ["zoom"], z, v, ...]
// curves, so the width tests measure the actual shipped numbers rather than
// matching a string that could drift from them.
const stopsOf = (block) => {
  const nums = [...block.matchAll(/(-?[\d.]+),\s*([\d.]+)\s*\*\s*borderScale/g)]
    .map(([, z, v]) => [Number(z), Number(v)]);
  assert.ok(nums.length >= 2, `expected stops in: ${block.slice(0, 80)}`);
  return nums;
};
const evalCurve = (stops, zoom) => {
  if (zoom <= stops[0][0]) return stops[0][1];
  if (zoom >= stops[stops.length - 1][0]) return stops[stops.length - 1][1];
  for (let i = 1; i < stops.length; i += 1) {
    const [z0, v0] = stops[i - 1];
    const [z1, v1] = stops[i];
    if (zoom <= z1) return v0 + ((v1 - v0) * (zoom - z0)) / (z1 - z0);
  }
  return stops[stops.length - 1][1];
};
const blockAfter = (name, chars = 500) => {
  const at = NATIONS.indexOf(name);
  assert.notEqual(at, -1, `${name} not found`);
  return NATIONS.slice(at, at + chars);
};
// Just the WIDTH clause of a paint. Slicing a fixed number of characters used to
// reach it; the comments above these curves have since grown, and slicing WIDER
// would swallow the opacity clause, whose Math.min(0.85, 0.25 * borderScale)
// parses as a stop at zoom 0.85. Cut on the property names instead.
const widthOf = (name) => {
  const from = NATIONS.indexOf('"line-width"', NATIONS.indexOf(name));
  const to = NATIONS.indexOf('"line-opacity"', from);
  assert.ok(from !== -1 && to > from, `${name} width clause not found`);
  return NATIONS.slice(from, to);
};

console.log("\nA country border exists at all");

test("countries-outline no longer hides behind showStockCountries", () => {
  const block = blockAfter("const countriesOutlinePaint");
  assert.match(block, /"line-opacity":\s*worldKnown\s*\?\s*1\s*:\s*0/);
  assert.doesNotMatch(block, /"line-opacity":\s*showStockCountries/);
});

test("the countries source is mounted unconditionally, not gated on !customFlag", () => {
  // normalizeRuntimeWorld forces customRegions onto every served world, so a
  // !customFlag gate is the same as never.
  const at = NATIONS.indexOf('<Source id="countries-source"');
  assert.notEqual(at, -1, "countries-source must still be mounted");
  const before = NATIONS.slice(Math.max(0, at - 400), at);
  assert.doesNotMatch(before, /\{!customFlag && \(\s*$/);
});

test("the border draws ABOVE the fills it divides", () => {
  // Layer order in the style follows source order in the JSX. As the first
  // source in the file its lines sat under 0.72-opacity fills.
  const border = NATIONS.indexOf('<Source id="countries-source"');
  const customFills = NATIONS.indexOf('<Source id="custom-regions-source"');
  const stockFills = NATIONS.indexOf('<Source id="regions-source"');
  const labels = NATIONS.indexOf('<Source id="country-curved-label-source"');
  assert.ok(border > customFills, "border must come after the custom region fills");
  assert.ok(border > stockFills, "border must come after the stock region fills");
  assert.ok(border < labels, "border must stay under the labels");
});

test("the stock country FILL keeps its !customFlag gate and its own source", () => {
  // Only the border was revived; painting modern country fills over live
  // ownership would be a different bug.
  assert.match(NATIONS, /\{!customFlag && \(\s*\n\s*<Source id="countries-fill-source"/);
  assert.ok(!NATIONS.includes('id="countries-fill"\n') || NATIONS.includes("countriesFillPaint"));
});

console.log("\nA national border reads differently from a province line");

test("country width beats province width at every zoom both draw", () => {
  const country = stopsOf(widthOf("const countriesOutlinePaint"));
  const province = stopsOf(widthOf("const regionsOutlinePaint"));
  // 2.0x, down from 2.5x — see editor.mjs: the second province raise trades
  // some of the gap for visibility, and full-opacity-vs-0.85-cap carries the
  // rest of the distinction.
  for (const zoom of [7.5, 9, 10, 12, 13, 14, 16]) {
    const c = evalCurve(country, zoom);
    const p = evalCurve(province, zoom);
    assert.ok(c >= p * 2.0, `z${zoom}: country ${c} must be >= 2x province ${p}`);
  }
});

test("the country line is opaque where the province line is a whisper", () => {
  // 2700, not 2400: the fade-range note (the zoom ends are the player's now,
  // the shape is not) sits above the opacity block and pushed it out of the
  // old window. The invariant being pinned is unchanged — three capped stops.
  const province = blockAfter("const regionsOutlinePaint", 2700);
  const opacity = province.slice(province.indexOf('"line-opacity"'));
  assert.ok(opacity.length > 0, "the province opacity block must be in range");
  const caps = [...opacity.matchAll(/Math\.min\(([\d.]+),/g)].map(([, n]) => Number(n));
  assert.ok(caps.length >= 3, "province opacity stops must stay capped");
  for (const cap of caps) assert.ok(cap <= 0.85, `province opacity cap ${cap} must stay under a hard border`);
});

test("every border stop is scaled by the player's setting", () => {
  // 5 country + 5 diverged + 3 province width + 3 province opacity + 2 far + 3 authored
  const scaled = NATIONS.match(/\* borderScale/g) ?? [];
  assert.ok(scaled.length >= 21, `expected every stop scaled, found ${scaled.length}`);
  const unscaledCountry = blockAfter("const countriesOutlinePaint")
    .match(/\n\s+\d+,\s*[\d.]+,\s*$/gm);
  assert.equal(unscaledCountry, null, "a country stop escaped the scale");
});

test("the setting the slider writes is the one the map reads", () => {
  assert.match(MAPSET, /borderWidth:\s*"map_border_width"/);
  assert.match(MAPSET, /borderWidth:\s*\[0\.25,\s*4\]/);
  assert.match(NATIONS, /useDisplayScale\("borderWidth"\)/);
  assert.match(SETTINGS, /borderWidth/);
  // The map only re-reads on this event, so a setter that skips it is a dead dial.
  assert.match(MAPSET, /dispatchEvent\(new Event\("mapSettings:updated"\)\)/);
  assert.match(MAPSET, /addEventListener\("mapSettings:updated"/);
});

console.log("\nA conquest is never invisible");

test("diverged regions are compared through toCountryName, not raw", () => {
  const block = blockAfter("const divergedRegionIds = useMemo", 900);
  assert.match(block, /toCountryName\(live\)\s*!==\s*toCountryName\(props\.owner/);
  assert.match(block, /props\.kind === "sea"/);
  assert.match(block, /live === undefined \|\| live === ""/);
});

test("the diverged layer is only mounted when land has actually changed hands", () => {
  assert.match(NATIONS, /\{divergedRegionIds\.length > 0 && \(/);
});

test("a diverged border carries the national weight, not the province weight", () => {
  const country = stopsOf(widthOf("const countriesOutlinePaint"));
  const diverged = stopsOf(widthOf("const divergedBorderPaint"));
  assert.deepEqual(diverged, country);
});

console.log("\nThe quota cannot exceed the orders there are");

test("18 orders can never owe 24 setbacks", () => {
  // The live line: "0 of 18 order(s) came out less than cleanly, against 24 expected".
  assert.equal(totalSetbacksOwed("impossible", 18, 11), 18);
  assert.ok(setbackQuota("impossible", 18) + 11 > 18, "the unclamped sum must still exceed 18");
});

test("carried debt is added, then clamped — not dropped", () => {
  const base = setbackQuota("medium", 10);
  assert.equal(totalSetbacksOwed("medium", 10, 2), Math.min(base + 2, 10));
  assert.ok(totalSetbacksOwed("medium", 10, 2) > base, "the debt must actually raise the demand");
});

test("no orders means nothing owed, whatever the debt", () => {
  assert.equal(totalSetbacksOwed("impossible", 0, 99), 0);
  assert.equal(totalSetbacksOwed("very-easy", 0, 0), 0);
});

test("junk carried values do not poison the quota", () => {
  for (const junk of [null, undefined, NaN, -5, "x"]) {
    const owed = totalSetbacksOwed("hard", 10, junk);
    assert.ok(Number.isInteger(owed) && owed >= 0 && owed <= 10, `carried ${junk} -> ${owed}`);
  }
});

test("the shortfall that follows stays inside the same ceiling", () => {
  const rated = 18;
  const quota = totalSetbacksOwed("impossible", rated, 11);
  assert.ok(capShortfall("impossible", quota - 0, rated) <= rated);
});

test("gameplay.js uses the clamped total, not the raw sum", () => {
  assert.match(GAMEPLAY, /totalSetbacksOwed\(baseGame\.difficulty, rated\.length, owed\)/);
  assert.doesNotMatch(GAMEPLAY, /setbackQuota\(baseGame\.difficulty, rated\.length\) \+ owed/);
});

console.log("\nOne bad row costs one row");

test("actionOutcomes and diplomaticOutreach have item schemas to prune against", () => {
  assert.ok(TOP_LEVEL_ITEM_SCHEMAS.actionOutcomes, "actionOutcomes item schema");
  assert.ok(TOP_LEVEL_ITEM_SCHEMAS.diplomaticOutreach, "diplomaticOutreach item schema");
  assert.equal(TOP_LEVEL_ITEM_SCHEMAS.actionOutcomes.type, "object");
});

test("the row that failed live is the row the schema rejects", () => {
  const schema = TOP_LEVEL_ITEM_SCHEMAS.actionOutcomes;
  const bad = { id: "act_7" }; // no `outcome` — this is the live "$.actionOutcomes[7]"
  assert.match(validateAgainstSchema(schema, bad, "$") ?? "", /outcome is required/);
});

test("its 17 good siblings survive", () => {
  const schema = TOP_LEVEL_ITEM_SCHEMAS.actionOutcomes;
  const good = { id: "act_3", outcome: "partial", note: "예산이 절반만 배정됐다." };
  assert.equal(validateAgainstSchema(schema, good, "$"), "", "an empty string is this validator's pass");
});

test("a whole batch loses exactly the one row, not all eighteen", () => {
  // What the pruning loop does, on the shape that actually came back.
  const schema = TOP_LEVEL_ITEM_SCHEMAS.actionOutcomes;
  const batch = Array.from({ length: 18 }, (_, i) =>
    i === 7 ? { id: "act_7" } : { id: `act_${i}`, outcome: "succeeded" });
  const survivors = batch.filter((row) => !validateAgainstSchema(schema, row, "$"));
  assert.equal(survivors.length, 17);
  assert.ok(!survivors.some((row) => row.id === "act_7"));
});

test("an order left out is a clean success, so a dropped row is not a lost verdict", () => {
  // The schema says so in words; this is what makes dropping the row safe.
  assert.match(TOP_LEVEL_ITEM_SCHEMAS.actionOutcomes.properties.id.description, /order's id/);
});

test("the pruning loop drops the row and names it, rather than failing the payload", () => {
  const at = GAMEPLAY.indexOf("TOP_LEVEL_ITEM_SCHEMAS)");
  assert.notEqual(at, -1, "the top-level pruning loop must exist");
  const block = GAMEPLAY.slice(at, at + 700);
  assert.match(block, /droppedFields\.push\(\.\.\.pruneOpToSchema\(item, itemSchema\)\)/);
  assert.match(block, /droppedOps\.push\(`\$\{key\}: \$\{error\}`\)/);
  assert.match(block, /parsed\[key\] = survivors/);
});

test("nothing is dropped silently", () => {
  assert.match(GAMEPLAY, /dropped \$\{droppedFields\.length\} field\(s\)/);
  assert.match(GAMEPLAY, /droppedOps/);
});

console.log("\nThe order panel says one sentence, in one node");

test("no sentence is cut across an interpolation any more", () => {
  assert.ok(!ACTIONS.includes("Submit actions for {countryDisplayName} for {gameDate}"),
    "the split sentence must be gone");
  assert.ok(!/for \{countryDisplayName\}/.test(ACTIONS), "no prose may wrap the country name");
  assert.ok(!/for \{gameDate\}/.test(ACTIONS), "no prose may wrap the date");
});

test("the country and the date each stand as their own whole node", () => {
  assert.match(ACTIONS, /<span>\{countryDisplayName\}<\/span>/);
  assert.match(ACTIONS, /<span>\{gameDate\}<\/span>/);
});

test("neither is opted out of translation — the Korean comes from the translator", () => {
  assert.doesNotMatch(ACTIONS, /<span data-no-translate>\{countryDisplayName\}<\/span>/);
  assert.doesNotMatch(ACTIONS, /<span data-no-translate>\{gameDate\}<\/span>/);
  // Only the separator glyph opts out.
  assert.match(ACTIONS, /<span data-no-translate style=\{\{ color: "rgba\(255,255,255,0\.4\)"/);
});

test("the placeholder date no longer reads as a date", () => {
  assert.doesNotMatch(ACTIONS, /useState\("the current date"\)/);
  assert.match(ACTIONS, /const \[gameDate, setGameDate\] = React\.useState\(""\)/);
  assert.match(ACTIONS, /\{gameDate && \(/);
});

test("the replacement sentence survives being translated whole", () => {
  const at = ACTIONS.indexOf("Everything you order here");
  assert.notEqual(at, -1);
  const line = ACTIONS.slice(at, ACTIONS.indexOf("\n", at));
  assert.ok(!line.includes("{"), "the sentence must contain no interpolation");
  assert.ok(line.trim().endsWith("."), "and must be a whole sentence");
});

console.log(`\n${pass} passed\n`);

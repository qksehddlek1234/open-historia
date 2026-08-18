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
  const block = blockAfter("const divergedRegionIds = useMemo", 1400);
  assert.match(block, /toCountryName\(live\)\s*!==\s*toCountryName\(started\)/);
  assert.match(block, /props\.kind === "sea"/);
  assert.match(block, /live === undefined \|\| live === ""/);
});

test("and against where the BOARD started, not against the geometry it borrowed", () => {
  // 22 of 23 scenarios now share the default map, whose features carry MODERN
  // owners. Comparing a 1962 override against a 2026 feature calls the whole
  // world conquered — measured at 3,948 regions on TNO — so the baseline the
  // scenario shipped wins, and props.owner is only the fallback for a board
  // still carrying its own map.
  const block = blockAfter("const divergedRegionIds = useMemo", 1400);
  assert.match(block, /const started = baselineOwnership\[id\] \?\? props\.owner/);
  assert.match(block, /\}, \[customActive, regionData, regionOwnershipOverrides, baselineOwnership\]\)/);
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


console.log("\nLevel 0 draws only where level 0 is still true");

test("countries-outline is filtered to the board's intact countries", () => {
  const at = NATIONS.indexOf("const countriesOutlineFilter");
  assert.notEqual(at, -1, "the modern outline must be filtered, not mounted whole");
  const block = NATIONS.slice(at, at + 400);
  assert.match(block, /ownerBordersReady/, "the filter has to key on the board actually shipping one");
  assert.match(block, /"GID_0"/, "level 0 is filtered by country code");
  // A board built before borders.geojson existed must draw exactly what it drew
  // yesterday — an empty intact list would erase every border it has.
  assert.match(block, /:\s*\["all"\]/, "no border file means no filter, not an empty one");
  assert.match(NATIONS, /id="countries-outline"[\s\S]{0,200}filter=\{countriesOutlineFilter\}/);
});

test("the board's own border is drawn at the national weight, not a weight of its own", () => {
  const at = NATIONS.indexOf('<Source id="owner-border-source"');
  assert.notEqual(at, -1, "the frontier layer must be mounted");
  const block = NATIONS.slice(at, at + 400);
  assert.match(block, /paint=\{countriesOutlinePaint\}/,
    "a border is a border — same curve, same player setting");
});

test("a conquest's line sits above the line the board shipped with", () => {
  const fills = NATIONS.indexOf('<Source id="custom-regions-source"');
  const frontier = NATIONS.indexOf('<Source id="owner-border-source"');
  const diverged = NATIONS.indexOf('<Source id="diverged-borders-source"');
  const labels = NATIONS.indexOf('<Source id="country-curved-label-source"');
  assert.ok(frontier > fills, "the frontier must come after the fills it divides");
  assert.ok(diverged > frontier, "in-play changes must draw over the board's own border");
  assert.ok(frontier < labels, "and all of it stays under the labels");
});

console.log("\nA possession's label is not the country's label");

test("the two ranks are two layers, and the minor one is drawn second", () => {
  const major = NATIONS.indexOf('id="country-labels"');
  const minor = NATIONS.indexOf('id="country-labels-minor"');
  assert.notEqual(minor, -1, "the second rank must exist as its own layer");
  assert.ok(major < minor, "the possession's repeat is the one that yields on collision");
});

test("a feature with no tier is a full-rank label — the stock set has only one rank", () => {
  assert.match(NATIONS, /const LABEL_TIER = \["coalesce", \["get", "tier"\], 0\]/,
    "absent must read as 0, never as minor");
  assert.match(NATIONS, /id="country-labels"[\s\S]{0,240}\["!=", LABEL_TIER, 1\]/);
  assert.match(NATIONS, /id="country-labels-minor"[\s\S]{0,240}\["==", LABEL_TIER, 1\]/);
});

test("every label rank is its own layer — allow-overlap cannot be an expression", () => {
  // MapLibre takes text-allow-overlap as a layout property only, and only as a
  // constant: a data expression there is rejected on every style pass and every
  // label silently falls back to false. One case expression would have taken the
  // country labels down with the ranks that are supposed to be cullable.
  for (const layer of ["country-labels", "country-labels-leaders", "country-labels-minor"]) {
    assert.ok(NATIONS.includes(`id="${layer}"`), `${layer} must be its own layer`);
  }
  for (const layout of ["pointLabelLayerLayout", "leaderLabelLayerLayout", "minorPointLabelLayerLayout"]) {
    const at = NATIONS.indexOf(`const ${layout}`);
    assert.notEqual(at, -1, `${layout} not found`);
    const overlap = NATIONS.slice(at, at + 420).match(/"text-allow-overlap":\s*(\w+)/);
    assert.ok(overlap && /^(true|false)$/.test(overlap[1]),
      `${layout} must set allow-overlap to a literal, got ${overlap?.[1]}`);
  }
});

test("the country's own name never yields to a possession or a leader line", () => {
  // Only the two subordinate ranks are cullable.
  const major = NATIONS.slice(NATIONS.indexOf("const pointLabelLayerLayout"), NATIONS.indexOf("const leaderLabelLayerLayout"));
  assert.match(major, /"text-allow-overlap": true/);
});

test("the minor rank is smaller, thinner-haloed, and cullable", () => {
  const at = NATIONS.indexOf("const minorPointLabelLayerLayout");
  assert.notEqual(at, -1);
  const layout = NATIONS.slice(at, at + 600);
  assert.match(layout, /buildCountryTextSize\(MINOR_LABEL_SCALE, isGlobe\)/);
  assert.match(layout, /"text-allow-overlap": false/,
    "an archipelago prints one repeat per island group; they must be allowed to lose");
  const paintAt = NATIONS.indexOf("const minorLabelLayerPaint");
  assert.match(NATIONS.slice(paintAt, paintAt + 300), /"text-halo-width": 0\.5/);
  const scale = Number(NATIONS.match(/const MINOR_LABEL_SCALE = ([\d.]+)/)?.[1]);
  assert.ok(scale > 0 && scale < 1, `the minor rank must actually be smaller (got ${scale})`);
});

test("a possession prints at its own weight — the seat ceiling is RETIRED", () => {
  // This test spent its life asserting the opposite, and the reversal is the
  // record. The ceiling (min(ownScale, seatScale)) was built because British
  // Australia out-printed the British Isles — but while the seat was the
  // LARGEST cluster it never actually bit. The day the seat rule landed
  // (seat = home cluster, 2026-08-18) it bit hard: Greenland's DENMARK fell to
  // 7px. Measured against the original game, the original has NO cap — it
  // prints Greenland's DENMARK at Greenland's size and leaves the homeland
  // unnamed at that zoom — and the disease this ceiling was built for is held
  // by the tier-1 layer's 0.6 factor instead (Canada 90k < Britain's 112k).
  // User-approved, k read from the original, not invented: k = 1, no cap.
  //
  // So this pin now asserts the ABSENCE — whoever reintroduces a seat ceiling
  // must come through this comment first.
  assert.equal(NATIONS.indexOf("const seatScale"), -1,
    "the seat ceiling is retired — a possession prints at its own weight");
  assert.doesNotMatch(NATIONS, /Math\.min\(ownScale,\s*seatScale\)/,
    "the cap must not return by another spelling");
  const at = NATIONS.indexOf("const ownScale");
  assert.notEqual(at, -1, "the builder loop is where the remaining claims live");
  // Sliced to the END OF THE BUILDER, not a byte count: a fixed 1400-char
  // window broke the moment the rotation note was written above `tier`, and a
  // pin that fails because a comment grew is a pin measuring the wrong thing.
  // The builder now returns two collections (the labels and their leader
  // lines), so the anchor is the object it returns rather than the bare one.
  const block = NATIONS.slice(at, NATIONS.indexOf("labels: { type: \"FeatureCollection\"", at));
  assert.notEqual(block.length, 0, "the builder's return is where this block ends");
  // What SURVIVES the retirement: every in-territory label still goes through
  // the fitter (long names must not draw wider than the countries they name),
  // and the two ranks still exist — that separation was never the cap's job.
  assert.match(block, /fitNameToTerritory\(\s*ownScale/,
    "own weight, but still inside the fitter");
  assert.match(block, /tier: index === 0 \? 0 : 1/);

  // AND THE LABEL LIES ALONG THE TERRITORY. This was hardcoded flat, which
  // is what put BELGIAN CONGO on top of BRITISH EAST AFRICA — both single
  // clusters, so the tier split above cannot separate them. Country labels
  // already rotate by principal axis; this brings the owner lane into line.
  // The angle comes off the cluster's accumulated AREA, and only where the
  // shape has a direction to give. label-leaders.mjs holds that behaviour;
  // this holds the wiring.
  // The two halves were hoisted into named locals the same day so the shrinker
  // could reuse the elongation (`fitNameToTerritory` gives a long name more room
  // when the label lies along the shape). The wiring is unchanged — measure the
  // area moments, compare against the floor, angle or flat — so this pin follows
  // the claim to the locals instead of pinning one spelling of it.
  assert.match(block, /const elongation = axisElongationOfMoments\(cluster\.axis\)/,
    "the angle must still come off accumulated AREA, not vertices");
  assert.match(block, /elongation >= AXIS_ELONGATION_FLOOR\s*\?\s*axisAngleOfMoments\(cluster\.axis\)\s*:\s*0/,
    "a shape with no direction to give must draw flat, not at a noise angle");
  assert.match(block, /\? axisAngleOfMoments\(cluster\.axis\)/);
  assert.doesNotMatch(block, /rotation: 0,/, "flat-for-everyone may not come back");
});


test("a country label outranks a city label at the zoom a player reads at", () => {
  // Measured against the original at z ~6.8 (Riga to Moscow, 13.5 deg of
  // longitude in ~1060 CSS px): it draws country names solid there. The old
  // ramp — 0.75 at z5 falling to 0 at z8 — was at 0.30, so the country's own
  // name was three times fainter than the city names beside it, which never
  // faded. That inversion is what "province and country labels are the same
  // weight" described.
  const at = NATIONS.indexOf("const labelLayerPaint");
  assert.notEqual(at, -1);
  const paint = NATIONS.slice(at, NATIONS.indexOf("}), [labelHaloColor", at));
  assert.match(paint, /"text-opacity": 0\.75/, "the country label must not fade with zoom");
  assert.doesNotMatch(paint, /"text-opacity": \[/, "no zoom ramp may return to this property");

  // TRACKING IS THE OTHER HALF, AND IT LIVES IN LAYOUT. This pin first asked
  // for it inside labelLayerPaint, where it had in fact been written — and
  // MapLibre rejected it there as an unknown property on every style pass (76
  // errors in one page load, four label layers × nineteen passes), so the
  // tracking the pin was guarding never reached the screen. The invariant is
  // unchanged: country names are letterspaced. Only its address is corrected,
  // and paint is now fenced off so the value cannot drift back.
  // The ASSIGNMENT, not the word: the paint object carries a comment explaining
  // why the property is not here, and a bare-name pin would fail on its own
  // explanation.
  assert.doesNotMatch(paint, /"text-letter-spacing"\s*:/,
    "letter-spacing is layout — in paint it is silently dropped");
  // AND ITS ADDRESS MOVED AGAIN, for a good reason: fitNameToTerritory has to
  // know the tracking to work out how many letters cross a territory, and a dial
  // declared in two files splits the first time someone tunes one of them. It now
  // lives in runtime/labelLeaders.js and Nations.jsx imports it.
  //
  // So this pin stops asking WHERE it is declared and asks what it was always
  // for: exactly one declaration exists, and this file uses that one.
  const LEADERS = fs.readFileSync(new URL("../src/runtime/labelLeaders.js", import.meta.url), "utf8");
  assert.match(LEADERS, /export const LABEL_LETTER_SPACING = [\d.]+;/,
    "tracking is what makes it read as the top rank");
  assert.doesNotMatch(NATIONS, /const LABEL_LETTER_SPACING = [\d.]+;/,
    "one dial, one declaration — a second copy drifts the moment it is tuned");
  assert.match(NATIONS, /LABEL_LETTER_SPACING,/,
    "Nations.jsx must import the one declaration, not restate it");
  const base = NATIONS.slice(NATIONS.indexOf("const pointLabelLayoutBase"), at);
  assert.match(base, /"text-letter-spacing": LABEL_LETTER_SPACING/,
    "…and every point label rank inherits it from the shared layout");
});

console.log(`\n${pass} passed\n`);

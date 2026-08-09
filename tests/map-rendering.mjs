// THE ORIGINAL'S "MAP RENDERING OPTIONS" AND "DOCUMENT SIZE" PAGES, PORTED.
//
// Measured off the WWII++ copy on 2026-08-09 (docs/analysis/wwii-plus-plus-audit.md
// §5). Six of the seven rendering dials land here. The seventh — label line
// extension — had nothing to scale when this suite was written and now does:
// see tests/label-leaders.mjs for the leader lines it moves.
import assert from "node:assert/strict";
import fs from "node:fs";

let pass = 0;
const test = (name, fn) => { fn(); pass += 1; console.log(`  ok  ${name}`); };

const read = (rel) => fs.readFileSync(new URL(`../${rel}`, import.meta.url), "utf8");
const MAPSET = read("src/runtime/mapSettings.js");
const WORLD = read("src/Game/Map/World.jsx");
const NATIONS = read("src/Game/Map/Nations.jsx");
const CITIES = read("src/Game/Map/Cities.jsx");
const MARKERS = read("src/Game/Map/MarkersLayer.jsx");
const UNITS = read("src/Game/Map/Units.jsx");
const SETTINGS = read("src/Game/GameUI/settings.jsx");

// mapSettings.js reaches for localStorage and React; the pure function under
// test does not, so a minimal stub is enough to import it.
globalThis.localStorage = { getItem: () => null, removeItem() {}, setItem() {} };
globalThis.window = { addEventListener() {}, removeEventListener() {}, dispatchEvent() {} };
const { borderFadeStops, MAP_RENDER_DEFAULTS, FEATURE_LABEL_FONTS, DEFAULT_FEATURE_LABEL_STACK } =
  await import("../src/runtime/mapSettings.js");

// ---- the fade range keeps the curve --------------------------------------------------

test("DEFAULTS REPRODUCE THE SHIPPED RAMP EXACTLY — 7.5/9/12/14", () => {
  assert.deepEqual(borderFadeStops(7.5, 14), [7.5, 9, 12, 14]);
  assert.equal(MAP_RENDER_DEFAULTS.borderFadeStart, 7.5);
  assert.equal(MAP_RENDER_DEFAULTS.borderFadeEnd, 14);
});

test("…and a chosen range keeps the measured stops at their PLACE in the span", () => {
  // The original's own numbers. 9 sits 23.08% along the shipped span and 12
  // sits 69.23%; the same fractions of 2.4→7 are 3.46 and 5.58.
  const [a, b, c, d] = borderFadeStops(2.4, 7);
  assert.equal(a, 2.4);
  assert.equal(d, 7);
  assert.ok(Math.abs(b - 3.4615) < 0.001, `inner stop drifted: ${b}`);
  assert.ok(Math.abs(c - 5.5846) < 0.001, `inner stop drifted: ${c}`);
});

test("…an inverted or zero-width range falls back rather than flattening the ramp", () => {
  assert.deepEqual(borderFadeStops(12, 4), [7.5, 9, 12, 14]);
  assert.deepEqual(borderFadeStops(9, 9), [7.5, 9, 12, 14]);
  assert.deepEqual(borderFadeStops(NaN, undefined), [7.5, 9, 12, 14]);
});

test("Nations draws the ramp from those stops, not from hard-coded zooms", () => {
  assert.match(NATIONS, /const fadeStops = useMemo\(\(\) => borderFadeStops\(fadeStart, fadeEnd\)/);
  assert.match(NATIONS, /fadeStops\[0\], 0,/);
  assert.match(NATIONS, /fadeStops\[3\], Math\.min\(0\.85, 0\.8 \* borderScale\)\]/);
});

// ---- the camera dials -----------------------------------------------------------------

test("HIDE PARALLEL WORLDS actually reaches renderWorldCopies", () => {
  assert.match(WORLD, /renderWorldCopies=\{!hideParallelWorlds\}/);
  assert.ok(!/^\s+renderWorldCopies$/m.test(WORLD), "the unconditional prop is gone");
});

test("…and the world rectangle reaches maxBounds, with a safe fallback", () => {
  assert.match(WORLD, /maxBounds=\{cameraBounds\}/);
  assert.match(WORLD, /if \(!usable\) return \[\[-Infinity, -80\], \[Infinity, 85\]\]/);
  assert.match(WORLD, /boundsEast > boundsWest && boundsNorth > boundsSouth/);
});

// ---- the font -------------------------------------------------------------------------

test("THE FONT LIST IS THE ORIGINAL'S NINE, plus our own default", () => {
  const labels = FEATURE_LABEL_FONTS.map((option) => option.label);
  for (const expected of [
    "Serif", "Sans-serif", "Georgia", "Palatino", "Times New Roman",
    "Arial", "Trebuchet MS", "Poppins", "Courier New",
  ]) assert.ok(labels.includes(expected), `${expected} is missing`);
  assert.equal(FEATURE_LABEL_FONTS[0].value, "", "the default must be the empty choice");
  assert.deepEqual(DEFAULT_FEATURE_LABEL_STACK, ["Open Sans Semibold", "Arial Unicode MS Bold"]);
});

test("…every feature layer draws with it, and no hard-coded stack survives", () => {
  for (const [name, source] of [["Cities", CITIES], ["Markers", MARKERS], ["Units", UNITS]]) {
    assert.ok(!/"text-font": \["Open Sans/.test(source), `${name} still hard-codes a stack`);
    assert.match(source, /"text-font": (fontStack|glyphStack)/, name);
  }
  // Units shipped its glyph and strength readout in BOLD; keeping that is what
  // makes "no font chosen" pixel-identical to before.
  assert.match(UNITS, /useFeatureLabelStack\(DEFAULT_UNIT_LABEL_STACK\)/);
  assert.match(MAPSET, /DEFAULT_UNIT_LABEL_STACK = \["Open Sans Bold"/);
});

// ---- the panel and the gauge ------------------------------------------------------------

test("the settings panel exists and carries all seven dials", () => {
  assert.match(SETTINGS, /const MapRenderingPanel = \(\) => \{/);
  assert.match(SETTINGS, /<MapRenderingPanel \/>/);
  assert.match(SETTINGS, /label line extension/);
  assert.match(SETTINGS, /All seven dials/);
});

test("THE ONE DOCUMENT-SIZE GAUGE THAT APPLIES TO US IS THERE", () => {
  // Two of the original's three gauges measure a Firestore document limit we do
  // not have. The third — what the rules and timeline cost in every prompt —
  // matters more on a local model than it does there.
  assert.match(SETTINGS, /const RulesBudgetGauge = /);
  assert.match(SETTINGS, /<RulesBudgetGauge rules=\{scenarioText\.rules\}/);
  assert.match(SETTINGS, /getContextTokens\(\) \* 4/);
});

test("THE MAP CREDITS ITS DATA — two of those credits are licence conditions", () => {
  // EuroGeographics (NUTS, which is how Germany's 38 Regierungsbezirke arrived)
  // and the ONS Open Geography Portal (OGL, Britain's 46) both require
  // attribution as a condition of use. The control was switched off entirely.
  assert.match(WORLD, /attributionControl=\{\{ compact: true, customAttribution: MAP_DATA_CREDIT \}\}/);
  assert.match(WORLD, /EuroGeographics \(NUTS\)/);
  assert.match(WORLD, /ONS\/OGL/);
  assert.match(WORLD, /GADM/);
  assert.ok(!/attributionControl=\{false\}/.test(WORLD), "the switch-off is gone");
});

console.log(`\n${pass} passed\n`);

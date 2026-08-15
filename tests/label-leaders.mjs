// LABELS FOR COUNTRIES THAT CANNOT HOLD THEIR OWN NAME.
//
// Every country label is sized by its shape (areaScale = sqrt(area in deg²) ×
// 17500), which is why the map reads as a map — and why, at the zoom a player
// reads Europe at, Germany's label is ~27px and Luxembourg's is ~2px. On a 1935
// board that means Danzig, Memel, Luxembourg, Andorra, Liechtenstein, San
// Marino, Monaco and the Vatican are simply not on the map until you zoom into
// each one, and the interwar map IS those small states.
//
// So: below a floor the label leaves the shape, draws at a legible size, and a
// hairline runs back to the country. This is also what the original's otherwise
// unusable "label line extension" dial turns out to be for.
import assert from "node:assert/strict";
import fs from "node:fs";

let pass = 0;
const test = (name, fn) => { fn(); pass += 1; console.log(`  ok  ${name}`); };

const read = (rel) => fs.readFileSync(new URL(`../${rel}`, import.meta.url), "utf8");
const LABELS = read("src/runtime/countryLabels.js");
const LEADERS = read("src/runtime/labelLeaders.js");
const NATIONS = read("src/Game/Map/Nations.jsx");
const SETTINGS = read("src/Game/GameUI/settings.jsx");

const {
  buildLeaderPlacement, LEADER_AREA_SCALE_FLOOR, LEADER_LABEL_AREA_SCALE, LEADER_EXTENSION_DEFAULT,
} = await import("../src/runtime/labelLeaders.js");

// A rectangle in lng/lat around (0,0): `halfW` east-west, `halfH` north-south.
const box = (halfW, halfH) => [
  [-halfW, -halfH], [halfW, -halfH], [halfW, halfH], [-halfW, halfH], [-halfW, -halfH],
];

// ---- the geometry -------------------------------------------------------------------

test("AN EAST-WEST SLIVER SENDS ITS LABEL NORTH — the short way out", () => {
  // Tile-space principal angle 0 = the shape runs along x. Its normal points
  // south in lng/lat (tile y grows southward), so the rule must flip it.
  const { anchor, edge } = buildLeaderPlacement(box(2, 0.1), [0, 0], 0, 0.5);
  assert.ok(anchor[1] > 0, `label went south: ${anchor}`);
  assert.ok(Math.abs(anchor[0]) < 1e-9, "and stayed on the same meridian");
  // It leaves from the shape's own edge, not its middle.
  assert.ok(Math.abs(edge[1] - 0.1) < 1e-9, `line starts at the edge, got ${edge[1]}`);
  assert.ok(Math.abs(anchor[1] - 0.6) < 1e-9, "edge (0.1) + extension (0.5)");
});

test("…and a north-south sliver sends it EAST, because north is the long way", () => {
  const { anchor } = buildLeaderPlacement(box(0.1, 2), [0, 0], 90, 0.5);
  assert.ok(anchor[0] > 0, `label went west: ${anchor}`);
  assert.ok(Math.abs(anchor[1]) < 1e-9, "and stayed on the same parallel");
  assert.ok(Math.abs(anchor[0] - 0.6) < 1e-9, "edge (0.1) + extension (0.5)");
});

test("the extension is the only thing the player moves", () => {
  const near = buildLeaderPlacement(box(2, 0.1), [0, 0], 0, 0);
  const far = buildLeaderPlacement(box(2, 0.1), [0, 0], 0, 2);
  // 0 pins the name to the border rather than hiding it.
  assert.ok(Math.abs(near.anchor[1] - 0.1) < 1e-9, "0 puts the label on the edge");
  assert.ok(Math.abs(far.anchor[1] - 2.1) < 1e-9);
  assert.deepEqual(near.edge, far.edge, "the line always starts at the same place");
});

test("…and no label is pushed off the projection", () => {
  const { anchor } = buildLeaderPlacement(box(2, 0.1), [0, 83], 0, 4);
  assert.ok(anchor[1] <= 84, `Mercator cannot draw ${anchor[1]}`);
});

test("a degenerate ring gets no line rather than a broken one", () => {
  assert.equal(buildLeaderPlacement([], [0, 0], 0, 0.5), null);
  assert.equal(buildLeaderPlacement(null, [0, 0], 0, 0.5), null);
  assert.equal(buildLeaderPlacement([[0, 0], [1, 1]], [0, 0], 0, 0.5), null);
});

// ---- which countries get one ----------------------------------------------------------

test("THE FLOOR IS SET WHERE IT SEPARATES THE SMALL FROM THE TINY", () => {
  const areaScale = (deg2) => Math.sqrt(deg2) * 17500;
  // Measured on the shipped tiles and written into the module's own comment.
  assert.ok(areaScale(0.26) < LEADER_AREA_SCALE_FLOOR, "Luxembourg goes on a line");
  assert.ok(areaScale(0.2) < LEADER_AREA_SCALE_FLOOR, "so does Danzig");
  assert.ok(areaScale(3.3) > LEADER_AREA_SCALE_FLOOR, "Albania keeps its name inside");
  assert.ok(areaScale(40) > LEADER_AREA_SCALE_FLOOR, "and so, obviously, does Germany");
  // Out on a line the label stops being sized by an area it no longer sits in.
  assert.ok(LEADER_LABEL_AREA_SCALE > LEADER_AREA_SCALE_FLOOR);
});

test("…only the point branch, so no curved label is ever stolen", () => {
  assert.match(LABELS, /const needsLeader = !curvedGlyphFeatures && areaScale < LEADER_AREA_SCALE_FLOOR;/);
});

test("…and a leader label draws horizontally, not on a shape it left", () => {
  assert.match(LABELS, /rotation: leader \? 0 : rotation/);
  assert.match(LABELS, /areaScale: leader \? LEADER_LABEL_AREA_SCALE : areaScale/);
});

// ---- the wiring -------------------------------------------------------------------------

test("the extension rides the CACHE KEY, because the anchor is baked geometry", () => {
  assert.match(LABELS, /extensionSuffix = extension === LEADER_EXTENSION_DEFAULT \? "" : `-lx\$\{extension\}`/);
  assert.match(LABELS, /country-labels-v4/, "a v3 cache has no leader lines in it");
  assert.match(LABELS, /value\.leaderLineData\?\.type === "FeatureCollection"/);
  assert.equal(LEADER_EXTENSION_DEFAULT, 0.5);
});

test("the map draws the line under the labels and fades it with them", () => {
  assert.match(NATIONS, /id="country-leader-lines"/);
  assert.match(NATIONS, /leaderExtension: labelLineExtension/);
  // The LINE still fades out by z8 — a leader is punctuation for a label that
  // has been moved off its country, and once the country fills the screen it
  // has nothing left to point at. The label itself no longer fades (see
  // labelLayerPaint), so the invariant this pin holds — the line never outlives
  // its text — is now satisfied with room to spare.
  const paint = NATIONS.slice(NATIONS.indexOf("const leaderLinePaint"), NATIONS.indexOf("const labelLayerPaint"));
  assert.match(paint, /5, 0\.38,/);
  assert.match(paint, /8, 0,/);
  // Hiding country labels hides their leader lines too.
  assert.match(NATIONS, /!mapDisplaySettings\.hideCountryLabels\n\s*\? leaderLineData/);
});

test("A LEADER LABEL YIELDS TO COLLISION, a country's own never does", () => {
  // 71 countries fall under the floor world-wide and most are islands packed
  // into the Caribbean and the Pacific. A country standing on its own ground has
  // the best claim to that spot and always draws; a label that has been moved
  // off its country into shared space has to take its chances.
  //
  // The split MUST be two layers filtered on `leader`, never one case
  // expression: text-allow-overlap is layout, MapLibre takes it only as a
  // constant, and a data expression is rejected on every style pass while
  // every label falls back to the default (false) — the country half loses
  // exactly the guarantee this pin exists to hold.
  assert.match(NATIONS, /\.\.\.pointLabelLayoutBase, "text-allow-overlap": true/,
    "the country layer allows overlap unconditionally");
  assert.match(NATIONS, /\.\.\.pointLabelLayoutBase, "text-allow-overlap": false/,
    "the leader layer submits to collision unconditionally");
  assert.doesNotMatch(NATIONS, /"text-allow-overlap": \["case"/,
    "no data expression may return to this property");
  // And the filters route each feature to exactly one layer. A THIRD rank has
  // since joined them (country-labels-minor, an owner's outlying clusters), so
  // the country layer's filter is now a conjunction rather than the bare leader
  // test this pin was written against. The invariant is unchanged and is what is
  // pinned: no layer but the leader one may draw a leader label.
  const source = NATIONS.slice(NATIONS.indexOf('id="country-point-label-source"'));
  const filterOf = (id) => {
    const at = source.indexOf(`id="${id}"`);
    assert.notEqual(at, -1, `${id} must be its own layer`);
    const from = source.indexOf("filter={", at);
    return source.slice(from, source.indexOf("layout=", from));
  };
  assert.match(filterOf("country-labels"), /\["!=", \["get", "leader"\], 1\]/);
  assert.match(filterOf("country-labels-minor"), /\["!=", \["get", "leader"\], 1\]/);
  assert.match(filterOf("country-labels-leaders"), /\["==", \["get", "leader"\], 1\]/);
});

test("and the setting is in the panel with the rest of the rendering dials", () => {
  assert.match(SETTINGS, /name: "labelLineExtension"/);
  assert.match(SETTINGS, /All seven dials/);
});

console.log(`\n${pass} passed\n`);

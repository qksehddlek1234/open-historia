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

const {
  addAxisMoments, addAxisPolygon, axisAngleOfMoments, axisElongationOfMoments,
  createAxisMoments, getPrincipalAxisAngle, lngLatToTile, AXIS_ELONGATION_FLOOR,
} = await import("../src/runtime/countryLabels.js");

// Exactly what the owner lane hands the layer: every region's outline,
// projected, accumulated as area, and drawn on only if there is a direction.
const ownerMoments = (...rings) => {
  const total = createAxisMoments();
  for (const ring of rings) {
    // (point) => …, never map(lngLatToTile): map hands the index along as the
    // tile extent, which silently rescales every ring by its position.
    const projected = ring.map((point) => lngLatToTile(point));
    addAxisMoments(total, addAxisPolygon(createAxisMoments(), projected));
  }
  return total;
};
const ownerRotation = (...rings) => {
  const moments = ownerMoments(...rings);
  return axisElongationOfMoments(moments) >= AXIS_ELONGATION_FLOOR
    ? axisAngleOfMoments(moments)
    : 0;
};

// A rectangle, corner to corner. `steps` subdivides the west edge — the same
// rectangle, drawn with more pen strokes.
const rect = (west, south, east, north, steps = 1) => {
  const ring = [[west, south], [east, south], [east, north], [west, north]];
  for (let i = 1; i < steps; i += 1) {
    ring.push([west, north - ((north - south) * i) / steps]);
  }
  ring.push([west, south]);
  return ring;
};
// A strip running corner to corner, as a thin quadrilateral.
const strip = (fromLng, fromLat, toLng, toLat, width = 1) => [
  [fromLng, fromLat + width], [toLng, toLat + width],
  [toLng, toLat - width], [fromLng, fromLat - width], [fromLng, fromLat + width],
];
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

console.log("\nAnd a label lies along the territory it names");

test("a territory running down to the east tilts DOWN to the east", () => {
  // MapLibre text-rotate is CLOCKWISE-positive. Measured in lng/lat this came
  // out negative — the label rose over a territory that falls — because
  // latitude points up where tile y points down. Caught on the 1935 map:
  // FRENCH WEST AFRICA, running from Mauritania down to Niger, drew rising.
  assert.ok(ownerRotation(strip(-15, 20, 12, 13)) > 0,
    "a territory that descends eastward must tilt clockwise");
  assert.ok(ownerRotation(strip(-15, 13, 12, 20)) < 0,
    "and its mirror image must mirror, so this is a direction");
});

test("HOW FINELY A BORDER WAS DRAWN IS NOT A DIRECTION", () => {
  // The reading that looked equivalent and was not. Counting outline points
  // measures the cartographer's pen: a coast brings thousands of vertices and a
  // straight inland border a dozen. On wwii-1935 that put ITALY at -19°, tilted
  // the wrong way across the most obviously angled country in Europe, and
  // PORTUGAL at +55° across a strip that runs north-south. Same rectangle, one
  // edge drawn with 200 strokes instead of 1 — the country has not changed.
  const plain = rect(-10, 36, 10, 44);
  const detailed = rect(-10, 36, 10, 44, 200);
  assert.ok(Math.abs(ownerRotation(plain) - ownerRotation(detailed)) < 0.001,
    `detail moved the label (${ownerRotation(plain)} vs ${ownerRotation(detailed)})`);
  // The old vertex reading is still in the file for the curved lane, and this
  // is what it says about those two — 27° apart, for the same shape.
  const vertexAngle = (ring) => getPrincipalAxisAngle(ring.map((p) => lngLatToTile(p)));
  assert.ok(Math.abs(vertexAngle(plain) - vertexAngle(detailed)) > 20,
    "if these agreed, this test would be proving nothing");
});

test("a province cannot outvote the country it is part of", () => {
  // Moments are area-weighted, so a small piece moves the axis a small amount.
  // This is also what lets an island join its mainland without swinging it.
  const mainland = strip(-15, 20, 12, 13, 4);
  const alone = ownerRotation(mainland);
  const withIsland = ownerRotation(mainland, rect(-25, 15, -24, 16));
  assert.ok(Math.abs(withIsland - alone) < 5,
    `an island may not swing the label (${alone} -> ${withIsland})`);
  // And the sum does not care what order the pieces arrived in.
  const ab = createAxisMoments();
  addAxisMoments(ab, ownerMoments(mainland));
  addAxisMoments(ab, ownerMoments(rect(-25, 15, -24, 16)));
  const ba = createAxisMoments();
  addAxisMoments(ba, ownerMoments(rect(-25, 15, -24, 16)));
  addAxisMoments(ba, ownerMoments(mainland));
  assert.equal(axisAngleOfMoments(ab).toFixed(9), axisAngleOfMoments(ba).toFixed(9));
});

test("A ROUND COUNTRY IS LEFT ALONE, because it has no direction to draw along", () => {
  // A square's two eigenvalues are equal and the angle falls out of
  // atan2(0, -epsilon) — a hard 90° read off a shape with no vertical in it.
  // That is how SPAIN came to stand on end. The gate is elongation, measured:
  // see AXIS_ELONGATION_FLOOR for the 1935 board it was read off.
  const square = rect(-4, 36, 4, 44);
  assert.ok(axisElongationOfMoments(ownerMoments(square)) < AXIS_ELONGATION_FLOOR);
  assert.equal(ownerRotation(square), 0, "a square must not print vertically");
  // Not a rule about small countries — a small elongated one still lies down.
  const sliver = rect(-0.2, 36, 0.2, 38);
  assert.ok(axisElongationOfMoments(ownerMoments(sliver)) > AXIS_ELONGATION_FLOOR);
  assert.ok(Math.abs(ownerRotation(sliver)) > 80);
});

test("the same run of degrees reads steeper up north, because it draws steeper", () => {
  // A degree of latitude is worth 1/cos(lat) tile units. These two strips are
  // the SAME diagonal in degrees, so unprojected they measure the same angle.
  // On screen the northern one is far the steeper. Not a tuned constant: the
  // 15° bar sits under a measured 21.5° gap.
  const equator = strip(0, 0, 20, 14, 2);
  const nordic = strip(0, 55, 20, 69, 2);
  assert.equal(
    getPrincipalAxisAngle(equator).toFixed(1),
    getPrincipalAxisAngle(nordic).toFixed(1),
    "unprojected, the two are indistinguishable — that is the bug",
  );
  const flat = Math.abs(ownerRotation(equator));
  const steep = Math.abs(ownerRotation(nordic));
  assert.ok(steep > flat + 15, `north must read steeper (${flat} -> ${steep})`);
});

test("and the tilt never flips the text upside down", () => {
  // Folded into (-90, 90]. Text draws with text-keep-upright false, so
  // anything outside that prints inverted.
  for (const ring of [strip(0, 0, 1, 40), strip(0, 0, -1, 40), strip(0, 0, 40, 1)]) {
    const angle = ownerRotation(ring);
    assert.ok(angle > -91 && angle <= 91, `${angle} would print upside down`);
  }
});
console.log(`\n${pass} passed\n`);

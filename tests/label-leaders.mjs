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
  fitNameToTerritory, NAME_FIT_LETTERS, NAME_FIT_EM, LABEL_MAX_WIDTH_EM, LABEL_LINE_HEIGHT_EM,
  nameWidthEm, widestLineEm, wrapNameLines, leaderPlacementCandidates, LEADER_EXTENSION_STEPS,
} = await import("../src/runtime/labelLeaders.js");
const {
  LABEL_FADE_IN_PX, LABEL_FADE_OUT_PX, LEADER_LINE_OPACITY_RAMP, buildCountryTextOpacity, buildLeaderLineOpacity, fadeWindowOf,
} = await import("../src/runtime/labelPaint.js");
const { buildClusterCurvePath, layoutGlyphsAlongPath } = await import("../src/runtime/labelCurves.js");
const {
  REGION_ADJACENCY_DEGREES, buildRegionAdjacency, snapshotClusterPart, largestClusterPart, seatIndex,
  LABEL_FIT_CELLS, LABEL_FIT_PULL, largestPolygonOf, labelBox, projectPolygon, placeLabelInPiece, boxesOverlap,
} = await import("../src/runtime/labelClusters.js");
const CLUSTERS = read("src/runtime/labelClusters.js");

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
  // The LINE still fades out once the country is big enough to point at itself
  // — a leader is punctuation for a label that has been moved off its country.
  // What changed is the dial: it was a zoom ramp (z5 0.38 → z8 0) and is now the
  // country's own on-screen size, because zoom was a poor proxy for "fills the
  // screen" and a cluster of small states at z6.6 lost every line to it. The
  // expression itself lives in labelPaint.js now (buildLeaderLineOpacity), where
  // MapLibre's validator can be asked about it — see the pins at the end of
  // this file for why that mattered.
  const paint = NATIONS.slice(NATIONS.indexOf("const leaderLinePaint"), NATIONS.indexOf("const labelLayerPaint"));
  assert.match(paint, /"line-opacity": buildLeaderLineOpacity\(\),/);
  assert.deepEqual(LEADER_LINE_OPACITY_RAMP, [20, 0.38, 60, 0], "0.38 at 20 px of country, gone at 60");
  // Hiding country labels hides their leader lines too — now the FIRST test in
  // that expression, because which collection follows depends on the lane.
  assert.match(NATIONS, /const activeLeaderLineData = !worldKnown \|\| mapDisplaySettings\.hideCountryLabels/);
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

// ── AND THE LANE THAT ACTUALLY DRAWS ────────────────────────────────────────
//
// Everything above was written for the stock lane, and the stock lane has never
// run. `activeLeaderLineData` was gated on `!customFlag`, and
// normalizeRuntimeWorld forces customRegions onto every served world — measured
// 2026-08-16, 24 of 24 built boards. So the feature this file's header names —
// "Danzig, Memel, Luxembourg, Andorra, Liechtenstein, San Marino, Monaco and
// the Vatican are simply ABSENT from the 1935 map" — was true of the map for
// every day this file has existed, and every pin above passed the whole time.
//
// The owner lane now promotes below the same floor. Counted on the built boards
// by summing each owner's regions (the builder additionally splits an owner by
// contiguity and promotes only the seat, which can only raise these):
//
//   wwii-1935      6 of 109 owners   San Marino 589 · Liechtenstein 1,954 ·
//                                    St Vincent 3,062 · Andorra 3,893 ·
//                                    FREE CITY OF DANZIG 9,116 · Luxembourg 9,940
//   victorian-1836 15 of 59          the Bund's minors, thirteen of them added
//                                    to that board the same week
//   magna-1444     19 of 157         Ragusa, Lucca, Athens, Brunei, Bahrain…
//   korea-1950      7 of 115         + the Saar Protectorate, 9,884
//
// An earlier note in the WORKLOG put 1935 at 24 of 109. That used each owner's
// LARGEST RING where the builder uses its summed area, so it read every
// multi-province country as smaller than it is and promoted countries that can
// hold their own names. Six is the number.
console.log("\nThe owner lane promotes too, which is the lane the player sees");

test("THE GATE IS GONE — each lane brings its own lines", () => {
  // Not un-gated to "always the stock collection": that would draw the modern
  // world's leader lines under a 1935 board's labels. The lane picks.
  const at = NATIONS.indexOf("const activeLeaderLineData");
  const expression = NATIONS.slice(at, NATIONS.indexOf(";", at));
  assert.match(expression, /customFlag\s*\n?\s*\?\s*ownerLeaderLineData/,
    "a custom world draws the owner lane's lines");
  assert.match(expression, /:\s*leaderLineData/, "and the stock world its own");
});

test("…and the owner lane no longer imports the leader half of that module — it RETIRED leader labels", () => {
  // 2026-08-18, the player's call against the original as it draws today:
  // every name inside its own country, sized to it, none out on a line at a
  // fixed size. The owner lane takes only the fit and width helpers now; the
  // floor, the fixed leader size and the placement belong to the stock lane.
  const imports = NATIONS.slice(0, NATIONS.indexOf("ensurePmtilesProtocol()"));
  assert.match(imports, /from "\.\.\/\.\.\/runtime\/labelLeaders\.js"/);
  assert.match(imports, /fitNameToTerritory/);
  assert.doesNotMatch(imports, /LEADER_AREA_SCALE_FLOOR/);
  assert.doesNotMatch(imports, /LEADER_LABEL_AREA_SCALE/);
  assert.doesNotMatch(imports, /LEADER_EXTENSION_DEFAULT/);
  assert.doesNotMatch(imports, /buildLeaderPlacement/);
  assert.doesNotMatch(imports, /leaderPlacementCandidates/);
});

test("NO SEAT IS PROMOTED — a small country's name gets small and stays inside", () => {
  // The whole of what the leader lane did in this file is gone: no promotion
  // test, no anchor off the shape, no fixed size, no horizontal override, no
  // pending list of leader labels, no placement pass, no line features. Every
  // feature still carries `leader: 0` because the layers, shared with the stock
  // lane, route on the property.
  const block = NATIONS.slice(NATIONS.indexOf("const buildOwnerLabelCollection"),
    NATIONS.indexOf("const WorldMap"));
  assert.doesNotMatch(block, /ownScale < LEADER_AREA_SCALE_FLOOR/, "no promotion test");
  assert.doesNotMatch(block, /buildLeaderPlacement\(/, "no anchor off the shape");
  assert.doesNotMatch(block, /\? LEADER_LABEL_AREA_SCALE/, "no fixed size");
  assert.doesNotMatch(block, /pendingLeaders/, "no pending list of leader labels");
  assert.doesNotMatch(block, /leaderPlacementCandidates\(/, "no placement pass");
  assert.doesNotMatch(block, /leaderFeatures/, "no line features");
  assert.match(block, /geometry: \{ type: "Point", coordinates: \[cluster\.cx, cluster\.cy\] \}/,
    "every label starts on its own piece");
  assert.match(block, /areaScale: fitNameToTerritory\(ownScale, name, tilt \? elongation : 1\),/,
    "and is sized to its own country, fit to the shape");
  assert.match(block, /rotation: tilt,/, "along its own axis");
  assert.match(block, /leader: 0,/, "and never routed to the leader layer");
  assert.match(block, /leaderLines: \{ type: "FeatureCollection", features: \[\] \},/,
    "the owner lane's line collection is empty by construction");
});

test("the extent no longer rides the fold — it only ever served the leader line", () => {
  // A bounding box was carried through the union-find and the island merge so
  // the leader placement could ask "how far does this territory reach that
  // way". Nothing asks now; the rings are read back from allFeatures where a
  // shape is needed (the curve, the placement raster). The AXIS still travels.
  const block = NATIONS.slice(NATIONS.indexOf("const buildOwnerLabelCollection"),
    NATIONS.indexOf("const WorldMap"));
  assert.doesNotMatch(block, /ringBbox\(/);
  assert.doesNotMatch(NATIONS, /const unionBbox/);
  assert.match(NATIONS, /if \(a\.axis && b\.axis\) addAxisMoments\(a\.axis, b\.axis\);/,
    "the axis still travels with the merge");
});

test("bbox corners answer 'how far that way' exactly", () => {
  // The reason a box is enough: buildLeaderPlacement projects every point it is
  // given onto the outward normal and keeps the furthest. For a box the corners
  // ARE the extremes, so the four of them give the same reach the full outline
  // would — never short, which is the failure that would matter.
  const corners = [[10, 40], [12, 40], [12, 44], [10, 44]];
  const fromRing = buildLeaderPlacement([...corners, [10, 45], [11, 44.5]], [11, 42], 0, 0.5);
  const fromCorners = buildLeaderPlacement(corners, [11, 42], 0, 0.5);
  assert.ok(fromRing.anchor[1] >= fromCorners.anchor[1],
    "a ring reaching past its own box may go further; the box never goes short");
  // And the anchor is outside the shape it left, which is the whole point.
  assert.ok(fromCorners.anchor[1] > 44, `${fromCorners.anchor[1]} is still inside`);
});

test("the player's extension dial no longer reaches the owner lane — only the stock one", () => {
  // It was a dependency of the owner memo while small states went out on
  // lines. With the lane retired the dial moves nothing there, so it is out
  // of the call and out of the deps; the stock lane's loader still takes it.
  assert.doesNotMatch(NATIONS, /regionAdjacency,\n\s*labelLineExtension,\n\s*\);/);
  assert.match(NATIONS, /regionAdjacency, labelEpoch\]/, "the memo's deps");
  assert.match(NATIONS, /leaderExtension: labelLineExtension/, "the stock loader still takes the dial");
});

console.log("\nA label has to fit inside the country it names");

test("the em-across-a-territory constant is the derivation, not a guess", () => {
  // If this drifts, one of the inputs moved and the comment above it is
  // describing a number that no longer exists. 5.33 em is what falls out of
  // areaScale → degrees and the 17500 sizing rule; 7.9 is the same width in
  // upper-case Latin letters once tracking is added per glyph.
  assert.ok(Math.abs(NAME_FIT_EM - 5.33) < 0.02, `NAME_FIT_EM is ${NAME_FIT_EM}`);
  assert.ok(Math.abs(NAME_FIT_LETTERS - 7.95) < 0.05, `NAME_FIT_LETTERS is ${NAME_FIT_LETTERS}`);
  // And it must be DERIVED. A literal here would survive a change to the
  // tracking untouched, which is the drift that moving the dial into this file
  // was meant to stop.
  assert.match(LEADERS, /NAME_FIT_EM = 1 \/ \(DEG_PER_AREA_SCALE \* 17500\)/, "the em constant is computed");
  assert.match(LEADERS, /NAME_FIT_LETTERS = NAME_FIT_EM \/ \(NAME_FIT_CHAR_WIDTH \+ LABEL_LETTER_SPACING\)/,
    "and the letter count is derived from it, not restated");
});

test("THE FIT MEASURES EM, NOT LETTERS — Hangul is full-width", () => {
  // The game is played in Korean; every polity carries a Korean alias and the
  // label lane draws it. The first cap counted letters × 0.55 and so saw
  // 바이에른 왕국 as 3.9 em when it is 7.1 — the reported view in Korean kept
  // exactly one overlapping pair, and it was that one. Seven Hangul syllables
  // must measure wider than seven Latin capitals — half again as wide (1.52×;
  // not the raw 1.0/0.55 because a space and per-glyph tracking dilute it).
  assert.ok(nameWidthEm("바이에른 왕국") > nameWidthEm("BAVARIA") * 1.4,
    `${nameWidthEm("바이에른 왕국")} vs ${nameWidthEm("BAVARIA")}`);
  // …and therefore the SAME areaScale that leaves BAVARIA alone caps 바이에른 왕국.
  assert.equal(fitNameToTerritory(120000, "BAVARIA"), 120000);
  assert.ok(fitNameToTerritory(120000, "바이에른 왕국") < 120000, "the Korean name is capped");
});

test("…and it measures the WIDEST LINE, because MapLibre wraps at 10 em", () => {
  // Nothing sets text-max-width, so the default applies and a long name breaks
  // at spaces and hyphens. GRAND DUCHY OF SAXE-WEIMAR-EISENACH is three lines
  // of at most ~9 em, not one of ~19; measured whole, the first cap shrank it
  // twice as hard as the screen ever needed. Pin the wrap, then pin that the
  // fit reads the wrapped width and not the string.
  const whole = nameWidthEm("GRAND DUCHY OF SAXE-WEIMAR-EISENACH");
  const line = widestLineEm("GRAND DUCHY OF SAXE-WEIMAR-EISENACH");
  assert.ok(whole > 17 && line < 10, `whole ${whole}, widest line ${line}`);
  assert.ok(line <= LABEL_MAX_WIDTH_EM, "no line may exceed the wrap width where a break exists");
  const fitted = fitNameToTerritory(400000, "GRAND DUCHY OF SAXE-WEIMAR-EISENACH") / 400000;
  assert.ok(Math.abs(fitted - (NAME_FIT_EM / line)) < 0.01, `fit follows the widest line: ${fitted}`);
  // A name with no break point cannot wrap and is measured whole.
  assert.equal(widestLineEm("작센바이마르아이제나흐"), nameWidthEm("작센바이마르아이제나흐"));
});

test("a short name is left alone", () => {
  // BAVARIA fits inside Bavaria with room to spare, and a cap that touches it
  // has started shrinking labels for no reason.
  assert.equal(fitNameToTerritory(120000, "BAVARIA"), 120000);
  assert.equal(fitNameToTerritory(120000, "BELGIUM"), 120000);
  assert.equal(fitNameToTerritory(120000, "SPAIN"), 120000);
  assert.equal(fitNameToTerritory(120000, "프로이센"), 120000);
});

test("a long name is cut to the width of its own country", () => {
  // The RATIO is what is pinned, not a pixel count, because pixels move with
  // zoom and this does not. Both names below wrap, so the ratio follows the
  // widest line — see the wrap pin above.
  const prussia = fitNameToTerritory(120000, "KINGDOM OF PRUSSIA") / 120000;
  assert.ok(Math.abs(prussia - (NAME_FIT_EM / widestLineEm("KINGDOM OF PRUSSIA"))) < 0.01, `${prussia}`);
  const mecklenburg = fitNameToTerritory(400000, "GRAND DUCHY OF MECKLENBURG-SCHWERIN") / 400000;
  assert.ok(Math.abs(mecklenburg - (NAME_FIT_EM / widestLineEm("GRAND DUCHY OF MECKLENBURG-SCHWERIN"))) < 0.01, `${mecklenburg}`);
});

test("lying along the long axis buys room — but only where the label turns", () => {
  // A country four times as long as it is wide holds twice the letters. The
  // caller spends that ONLY where the tilt was actually applied; a horizontal
  // label on a diagonal shape gets the round-country allowance.
  // Measured on a name wide enough that neither reading is clamped back to
  // the input or down to the floor — every real name in the roster wraps to
  // under 10 em and fits whole at elongation 4, which is correct but proves
  // nothing about the ratio. Sixty unbreakable glyphs on a huge territory do.
  const wide = "A".repeat(60);
  const flat = fitNameToTerritory(4e6, wide, 1);
  const long = fitNameToTerritory(4e6, wide, 4);
  assert.ok(long > flat, "an elongated country keeps more of its size");
  assert.ok(Math.abs((long / flat) - 2) < 0.01, "√4 = twice the width");
  // …and a name that already fits at elongation 4 is left alone, not inflated.
  assert.equal(fitNameToTerritory(120000, "KINGDOM OF PRUSSIA", 4), 120000);
  assert.match(NATIONS, /fitNameToTerritory\(ownScale, name, tilt \? elongation : 1\)/,
    "and the caller only spends it when the label actually turns");
});

test("THE FLOOR IS GONE — a name shrinks as far as its shape demands", () => {
  // Until 2026-08-18 the fit stopped at LEADER_AREA_SCALE_FLOOR ("a name that
  // still will not fit there stays too wide rather than going unreadable"),
  // and a seat under the floor went out on a leader line at a fixed size. The
  // player chose the original's current rule instead: every name inside its
  // own country at whatever size that takes; the label paint fades it in as
  // it reaches legible size (see the fade pins below). So a 60-letter name on
  // a 120,000 country asks for a twelfth of the size and GETS it, and a small
  // country's long name goes below the old floor rather than over its border.
  const width60 = widestLineEm("A".repeat(60));
  const expected = 120000 * (NAME_FIT_EM / width60);
  assert.ok(Math.abs(fitNameToTerritory(120000, "A".repeat(60)) - expected) < 1e-6);
  assert.ok(fitNameToTerritory(120000, "A".repeat(60)) < LEADER_AREA_SCALE_FLOOR,
    "well under the floor that used to catch it");
  assert.ok(fitNameToTerritory(9000, "A".repeat(60)) < 9000, "and a small country shrinks too");
  assert.equal(fitNameToTerritory(9000, "AB"), 9000, "a name that fits is left alone, as before");
});

test("the leader line fades on the COUNTRY's size, not on zoom — and the expression is one MapLibre accepts", () => {
  // The old ramp was z5 0.38 → z8 0, which put every line at 0.18 by z6.6 — the
  // zoom a player reads a cluster of small states at, and the zoom the overlap
  // was reported from. Andorra on an empty coast showed; the same line in
  // central Germany did not. The reason for fading was never zoom, it was "the
  // shape is now big enough to point at itself", so that is what it reads.
  //
  // BUT NOT AS ARITHMETIC ON ["zoom"]. That was the first version —
  // ["*", ownScale, ["^", 2, ["-", ["zoom"], 16]]] as the interpolate input —
  // and MapLibre refuses it: "zoom" may only be the input of a TOP-LEVEL step
  // or interpolate. The layer was never added; every leader line on every
  // board was invisible, and the console said why once per style pass (found
  // on the live screen 2026-08-18). The valid shape is the composite: a
  // top-level interpolate on ["zoom"] whose output at each integer zoom is the
  // data expression with that zoom's 2^(z−16) already a number.
  const expr = buildLeaderLineOpacity();
  assert.doesNotMatch(JSON.stringify(expr).slice(30), /"zoom"/, "no [\"zoom\"] anywhere but the top");
  assert.equal(expr[0], "interpolate");
  assert.deepEqual(expr[2], ["zoom"]);
  assert.equal(expr.length, 3 + 25 * 2, "one output per integer zoom, 0..24");
  assert.deepEqual(expr[3 + 16 * 2 + 1], ["interpolate", ["linear"], ["*", ["coalesce", ["get", "ownScale"], 0], 1], 20, 0.38, 60, 0],
    "each output interpolates on the country's own on-screen size at that zoom (an em is areaScale px at z16)");
  assert.doesNotMatch(NATIONS, /"line-opacity": \[\s*\n?\s*"interpolate", \["linear"\], \["zoom"\],\s*\n?\s*5, 0\.38/,
    "the zoom ramp is gone, not left sitting beside it");
  assert.doesNotMatch(NATIONS, /\["\^", 2, \["-", \["zoom"\], 16\]\]/, "and the arithmetic-on-zoom form is gone from Nations.jsx");
  // The composite helper itself: integer stops 0..24, linear, on ["zoom"].
  const PAINT = read("src/runtime/labelPaint.js");
  assert.match(PAINT, /export const perZoomStops = \(outputAt\) => \{\n\s*const stops = \[\];\n\s*for \(let zoom = 0; zoom <= 24; zoom \+= 1\) stops\.push\(zoom, outputAt\(zoom\)\);\n\s*return \["interpolate", \["linear"\], \["zoom"\], \.\.\.stops\];/);
});

console.log("\nA label that BENDS along the country — the owner lane's own curve");

// A strip that bends: an L-shaped band, in tile-ish units. Wide enough along
// its axis to hold a name, narrow enough that a flat label would spill.
const bentBand = () => {
  const pts = [];
  // A quarter-arc of radius 100 centred on (0,0), swept from 0° to 90°, band
  // width 14 — the outer edge forward, the inner edge back.
  for (let i = 0; i <= 20; i += 1) { const a = (i / 20) * (Math.PI / 2); pts.push([107 * Math.cos(a), 107 * Math.sin(a)]); }
  for (let i = 20; i >= 0; i -= 1) { const a = (i / 20) * (Math.PI / 2); pts.push([93 * Math.cos(a), 93 * Math.sin(a)]); }
  pts.push(pts[0]);
  return pts;
};
const bandCentroid = [100 * Math.cos(Math.PI / 4), 100 * Math.sin(Math.PI / 4)];

test("the stock builder could not be reused: the owner lane's curve takes the AXIS as an argument", () => {
  // The whole reason the density-biased vertex axis was replaced (Italy −19°,
  // Portugal +55°). Two calls with two axes must trace two different paths —
  // if the function recomputed the axis from the ring it would ignore this.
  const ring = bentBand();
  const a = buildClusterCurvePath([ring], bandCentroid, -45, 6, { needed: true, glyphCount: 6 });
  const b = buildClusterCurvePath([ring], bandCentroid, 30, 6, { needed: true, glyphCount: 6 });
  assert.ok(a, "the arc along its own axis yields a path");
  assert.ok(!b || Math.abs(a.length - b.length) > 1e-6, "a different axis is a different path");
});

test("…and it measures a CLUSTER: a border shared between two rings is not a gap", () => {
  // The same band split at its middle into two rings that touch. Sliced along
  // the axis, the touching edge would read as two intervals; merged, it is one.
  // The United Kingdom's mainland came out 0.5% as wide as it is long before
  // this merge existed (measured, 1836) — every large country was a "strip".
  const whole = bentBand();
  const outer = []; const inner = [];
  for (let i = 0; i <= 10; i += 1) { const a = (i / 20) * (Math.PI / 2); outer.push([107 * Math.cos(a), 107 * Math.sin(a)]); inner.push([93 * Math.cos(a), 93 * Math.sin(a)]); }
  const half1 = [...outer, ...inner.reverse(), outer[0]];
  const outer2 = []; const inner2 = [];
  for (let i = 10; i <= 20; i += 1) { const a = (i / 20) * (Math.PI / 2); outer2.push([107 * Math.cos(a), 107 * Math.sin(a)]); inner2.push([93 * Math.cos(a), 93 * Math.sin(a)]); }
  const half2 = [...outer2, ...inner2.reverse(), outer2[0]];
  const one = buildClusterCurvePath([whole], bandCentroid, -45, 6, { needed: true, glyphCount: 6 });
  const two = buildClusterCurvePath([half1, half2], bandCentroid, -45, 6, { needed: true, glyphCount: 6 });
  assert.ok(one && two, "both trace");
  assert.ok(Math.abs(one.widthRatio - two.widthRatio) < 0.05,
    `split at a shared edge, the band is as wide as it was whole: ${one.widthRatio} vs ${two.widthRatio}`);
});

test("…and it spaces glyphs by their WIDTH: Hangul is full-width here too", () => {
  // Same path, a name of seven Latin capitals and one of seven Hangul syllables:
  // the Hangul name is wider, so along a path of fixed length its glyphs get
  // less path per em (they are packed to fill the same usable length) — but
  // relative to EACH OTHER, a Hangul glyph advances further than a Latin one.
  const ring = bentBand();
  const path = buildClusterCurvePath([ring], bandCentroid, -45, 6, { needed: true, glyphCount: 7 });
  const latin = layoutGlyphsAlongPath(path, "BAVARIA");
  const hangul = layoutGlyphsAlongPath(path, "바이에른왕국임");
  assert.ok(latin && hangul);
  assert.ok(hangul.totalEm > latin.totalEm * 1.5, "the Hangul name measures wider");
  assert.ok(hangul.glyphs[0].advanceEm > latin.glyphs[0].advanceEm, "and each glyph advances further");
});

test("the whole label faces one way — no glyph is flipped against its neighbours", () => {
  // Württemberg's label came out with three of eight glyphs upside down when
  // each was normalised on its own (measured). Now the direction is decided
  // once from the path and every glyph follows it: consecutive rotations never
  // jump by more than the path's own bend.
  const ring = bentBand();
  const path = buildClusterCurvePath([ring], bandCentroid, -45, 6, { needed: true, glyphCount: 8 });
  const laid = layoutGlyphsAlongPath(path, "WURTTEMBG");
  const rots = laid.glyphs.map((g) => g.rotation);
  for (let i = 1; i < rots.length; i += 1) {
    let d = Math.abs(rots[i] - rots[i - 1]);
    if (d > 180) d = 360 - d;
    assert.ok(d < 45, `glyphs ${i - 1}→${i} turn ${d}° — one of them is facing the wrong way`);
  }
});

test("a curve is drawn where it is NEEDED, not where the shape is pretty", () => {
  // The stock lane's gate was "is this a strip" (width ratio ≤ 0.22). The
  // original curves GRAND-HESSE (0.30) and SAXE-WEIMAR (0.61) — not strips —
  // because their names do not fit flat. So the caller says whether the flat
  // label fits, and a fat-but-bent shape whose name does not fit gets a curve
  // that the stock gate would have refused.
  const ring = bentBand();                       // width ratio ≈ 0.14/… well under 0.7
  const withNeed = buildClusterCurvePath([ring], bandCentroid, -45, 6, { needed: true, glyphCount: 6 });
  assert.ok(withNeed, "needed → the bend is used");
  // A path so gently bent that a straight label draws the same thing is refused
  // when the flat label fits — and only then. Straight band, no need: null.
  const straight = [[0, -7], [200, -7], [200, 7], [0, 7], [0, -7]];
  assert.equal(buildClusterCurvePath([straight], [100, 0], 0, 6, { needed: false, glyphCount: 6 }), null,
    "a straight strip whose name fits stays flat");
});

test("a round country stays flat, and so does one whose glyphs would scatter", () => {
  // Round: no long axis worth following. A disc's width ratio is ~1, past the
  // 0.7 gate.
  const disc = []; for (let i = 0; i <= 40; i += 1) { const a = (i / 40) * Math.PI * 2; disc.push([100 * Math.cos(a), 100 * Math.sin(a)]); }
  assert.equal(buildClusterCurvePath([disc], [0, 0], 0, 6, { needed: true, glyphCount: 6 }), null, "a disc has no line to follow");
  // Scatter: a short name on a long bent path puts each glyph on a different
  // bend. Two Sicilies and New Granada did this at 57–61° between neighbours
  // (measured) and read as letters thrown on a curve. Two glyphs on the
  // quarter-arc would face 90° apart — refused.
  const ring = bentBand();
  assert.equal(buildClusterCurvePath([ring], bandCentroid, -45, 2, { needed: true, glyphCount: 2 }), null,
    "two glyphs cannot share a quarter-arc without facing away from each other");
});

test("the owner lane wires the curve as its own rung, on its own layer", () => {
  // Before the flat label; only the seat; only when the flat label would not
  // fit; one feature per glyph tagged `curved`; and the three text-field:name
  // layers exclude those glyphs or every glyph prints the whole name. (It sat
  // between the leader line and the flat label until the owner lane retired
  // leader labels, 2026-08-18.)
  assert.match(NATIONS, /const curved = index === 0\n\s*\? buildOwnerCurve\(cluster, allFeatures, name, ownScale, tilt, elongation\)/,
    "the rung sits before the flat label, seat only");
  assert.match(NATIONS, /const flatFits = widestLineEm\(name\) <= NAME_FIT_EM \* Math\.sqrt/,
    "and only fires when the flat label would not fit");
  assert.match(NATIONS, /id="country-labels-curved"[\s\S]*?filter=\{\["==", \["get", "curved"\], 1\]\}/,
    "the glyphs have their own layer");
  assert.match(NATIONS, /id="country-labels"[\s\S]*?\["!=", \["get", "curved"\], 1\]/,
    "and the flat layer excludes them");
  assert.match(NATIONS, /id="country-labels-minor"[\s\S]*?\["!=", \["get", "curved"\], 1\]/,
    "as does the minor layer");
  // The cluster carries its member indices so the curve can read the rings
  // back — indices, not rings, or the fold carries every vertex on the map.
  assert.match(NATIONS, /members: \[index\],/, "clusters record which regions they fold");
  assert.match(NATIONS, /if \(a\.members && b\.members\) a\.members\.push\(\.\.\.b\.members\);/, "and the centroid merge keeps them");
});

// ---- which regions touch, and where the label sits (labelClusters.js) --------------

// A square region, as a GeoJSON feature. `gap` places it that far east of x0.
const square = (x0, y0, size = 1) => ({
  type: "Feature",
  properties: {},
  geometry: { type: "Polygon", coordinates: [[[x0, y0], [x0 + size, y0], [x0 + size, y0 + size], [x0, y0 + size], [x0, y0]]] },
});
const touches = (adjacency, a, b) => Boolean(adjacency[a]?.has(b)) && Boolean(adjacency[b]?.has(a));

test("adjacency is proximity, and the threshold is the measured one — 1e-2°", () => {
  // Measured on the 1836 board (see labelClusters.js): cross-border gaps are
  // digitising noise under 1e-4°, river borders open to ~6e-3°, and the first
  // same-owner pair that genuinely is apart sits at 1.8e-2°.
  assert.equal(REGION_ADJACENCY_DEGREES, 0.01);
  const fc = { features: [
    square(0, 0),                              // 0
    square(1, 0),                              // 1  shares an edge with 0 — the old rule's case
    square(2 + 2.2e-4, 0),                     // 2  Prussia's gap: 2.2e-4° east of 1 (Lubuskie → Brandenburg)
    square(3 + 2.2e-4 + 5.9e-3, 0),            // 3  a river's width east of 2 (Mymensingh → Khasi Hills, 5.9e-3°)
    square(4 + 2.2e-4 + 5.9e-3 + 1.8e-2, 0),   // 4  Incheon → Kaesong: 1.8e-2° east of 3 — apart
    square(20, 20),                            // 5  touches nothing
  ] };
  const adjacency = buildRegionAdjacency(fc);
  assert.equal(adjacency.length, fc.features.length, "one entry per feature");
  assert.ok(touches(adjacency, 0, 1), "a shared edge still counts (a shared vertex is 0° apart)");
  assert.ok(touches(adjacency, 1, 2), "a 2.2e-4° gap is a border, not a strait");
  assert.ok(touches(adjacency, 2, 3), "so is a river's width");
  assert.equal(adjacency[3]?.has(4) ?? false, false, "1.8e-2° is apart");
  assert.equal(adjacency[5], null, "a region touching nothing stays null, as before");
  for (let i = 0; i < adjacency.length; i += 1) for (const j of adjacency[i] ?? []) assert.ok(adjacency[j].has(i), "symmetric");
  // The threshold is a parameter — the old hairline rule is epsilon ≈ 0.
  const strict = buildRegionAdjacency(fc, 1e-3);
  assert.ok(touches(strict, 1, 2), "at 1e-3° Prussia still joins");
  assert.equal(strict[2]?.has(3) ?? false, false, "but the river does not — which is why 1e-3° was not chosen");
});

test("adjacency reads every polygon of a MultiPolygon, and only vertices", () => {
  const fc = { features: [
    { type: "Feature", properties: {}, geometry: { type: "MultiPolygon", coordinates: [
      square(0, 0).geometry.coordinates,
      square(10, 10).geometry.coordinates,
    ] } },
    square(11 + 5e-3, 10),   // 1  reaches the second polygon of 0
    square(0, 5),            // 2  4° north of 0 — its bbox overlaps nothing, its vertices are far
    { type: "Feature", properties: {}, geometry: null }, // 3  no geometry at all
  ] };
  const adjacency = buildRegionAdjacency(fc);
  assert.ok(touches(adjacency, 0, 1), "the second polygon counts");
  assert.equal(adjacency[2], null);
  assert.equal(adjacency[3], null, "a feature without geometry is simply isolated");
  assert.deepEqual(buildRegionAdjacency({ features: [] }), [], "an empty board is an empty answer");
});

test("the label sits on the largest contiguous piece, and only the position moves", () => {
  // The merge keeps a snapshot of each piece as it was BEFORE folding, so the
  // biggest piece's own centroid survives the merged centroid.
  const mainland = { cx: 11.4, cy: 49.0, area: 7.0, axis: { a: 1 }, bbox: [9, 47, 14, 51], members: [0, 1] };
  const exclave = { cx: 7.8, cy: 49.4, area: 0.6, axis: { a: 2 }, bbox: [7, 49, 8.5, 50], members: [2] };
  const snap = snapshotClusterPart(mainland);
  assert.deepEqual(snap, { cx: 11.4, cy: 49.0, area: 7.0, members: [0, 1] },
    "a snapshot is position, weight and which regions — copied, since the merge appends to the live list");
  assert.notEqual(snap.members, mainland.members, "…a copy, not the array itself");
  assert.deepEqual(snapshotClusterPart({ cx: 1, cy: 2, area: 3 }).members, [], "a cluster without a member list snapshots an empty one");
  const merged = { ...mainland, cx: 11.1, cy: 49.03, area: 7.6, parts: [snap, snapshotClusterPart(exclave)] };
  const anchor = largestClusterPart(merged);
  assert.equal(anchor, snap, "the biggest piece wins");
  assert.equal(largestClusterPart(mainland), mainland, "a cluster that never merged is its own anchor");
  const bare = { cx: 1, cy: 2, area: 3, parts: [] };
  assert.equal(largestClusterPart(bare), bare, "empty parts → itself");
  // Wired that way in Nations.jsx: the merge snapshots, the loop anchors, and
  // the anchored view keeps everything but cx/cy from the merged cluster.
  assert.match(NATIONS, /import \{\n\s*buildRegionAdjacency,\n\s*labelBox,\n\s*largestClusterPart,\n\s*largestPolygonOf,\n\s*placeLabelInPiece,\n\s*projectPolygon,\n\s*seatIndex,\n\s*snapshotClusterPart,\n\} from "\.\.\/\.\.\/runtime\/labelClusters\.js";/,
    "(boxesOverlap left the list with the leader pass, 2026-08-18)");
  assert.match(NATIONS, /a\.parts \?\?= \[snapshotClusterPart\(a\)\];\n\s*b\.parts \?\?= \[snapshotClusterPart\(b\)\];\n\s*a\.parts\.push\(\.\.\.b\.parts\);/,
    "the merge remembers its pieces, snapshotted before the fold");
  assert.match(NATIONS, /const anchor = largestClusterPart\(merged\);\n\s*const cluster = anchor === merged \? merged : \{ \.\.\.merged, cx: anchor\.cx, cy: anchor\.cy \};/,
    "the loop reads size, tier, tilt and rings from the merged cluster and the position from the anchor");
  assert.match(NATIONS, /const ownScale = Math\.sqrt\(cluster\.area\) \* 17500;/, "size still comes from the whole cluster");
  assert.doesNotMatch(NATIONS, /const buildRegionAdjacency = /, "the hairline hash is gone from Nations.jsx, not duplicated");
  assert.match(NATIONS, /const CLUSTER_JOIN_DEGREES = 10;/,
    "the centroid join stays at 10°: at 3° Japan splits into three labels and Britain into two — the join is for archipelagos, the anchor is for exclaves");
});

test("the seat is where the government sits — the home cluster, not the biggest possession", () => {
  // 1836 Britain, as the label builder sees it: clusters sorted largest first,
  // each remembering which regions it folded; gid0 says which country a region
  // was cut from. `home` ("GBR") comes from the preset builder.
  const gid0 = { 0: "CAN", 1: "CAN", 2: "CAN", 3: "GBR", 4: "GBR", 5: "IRL", 6: "ZAF", 7: "ZAF" };
  const clusters = [
    { area: 900, members: [0, 1, 2] },   // Columbia District / Rupert's Land — the largest
    { area: 700, members: [6, 7] },      // Cape Colony
    { area: 300, members: [3, 4, 5] },   // the British Isles
  ];
  const gid0Of = (index) => gid0[index];
  assert.equal(seatIndex(clusters, "GBR", gid0Of), 2, "the British Isles are the seat");
  assert.equal(seatIndex(clusters, "CAN", gid0Of), 0, "…and would be Canada if Canada were home");
  assert.equal(seatIndex(clusters, undefined, gid0Of), 0, "no home → the largest, as before (Prussia, the Papal States, the Company)");
  assert.equal(seatIndex(clusters, "  ", gid0Of), 0, "a blank home is no home");
  assert.equal(seatIndex(clusters, "FRA", gid0Of), 0, "a home whose regions sit in no cluster changes nothing");
  assert.equal(seatIndex([], "GBR", gid0Of), 0);
  // Ties go to area: clusters arrive largest first and only a strictly better
  // count moves the seat.
  const tied = [{ area: 900, members: [3] }, { area: 300, members: [4] }];
  assert.equal(seatIndex(tied, "GBR", gid0Of), 0, "one home region each → the larger keeps the seat");
  // Wired that way: right after the size sort, the home cluster is moved to the
  // front, so index 0 — the leader line, the curve, the full-weight label — is
  // the seat.
  assert.match(NATIONS, /clusters\.sort\(\(a, b\) => b\.area - a\.area\);\n(?:\s*\/\/.*\n)*\s*const seat = seatIndex\(clusters, polityOverrides\?\.\[owner\]\?\.home, \(index\) => allFeatures\[index\]\?\.properties\?\.gid0\);\n\s*if \(seat > 0\) clusters\.unshift\(\.\.\.clusters\.splice\(seat, 1\)\);/);
});

test("a possession prints at its own weight — the original caps nothing, and neither do we", () => {
  // The cap (a repeat may not out-print the seat) never bit while the seat was
  // the largest cluster and bit hard once the seat was the home cluster —
  // Greenland's DENMARK to a tenth. The original, checked on 2026-08-18, draws
  // DENMARK across Greenland at Greenland's size and gives Denmark proper no
  // name at that zoom. The rank cue is the minor layer's 0.6, not a cap.
  assert.doesNotMatch(NATIONS, /Math\.min\(ownScale, seatScale\)/, "the cap is gone");
  assert.doesNotMatch(NATIONS, /const seatScale =/, "and nothing else reads a seat weight");
  assert.match(NATIONS, /areaScale: fitNameToTerritory\(ownScale, name, tilt \? elongation : 1\),/,
    "seat and possession alike are sized by their own territory, then fitted to their own name");
  assert.match(NATIONS, /const MINOR_LABEL_SCALE = 0\.6;/, "the repeat still prints lighter");
});

test("a name wraps the way MapLibre wraps it, and the box is as tall as its lines", () => {
  assert.deepEqual(wrapNameLines("GRAND DUCHY OF SAXE-WEIMAR-EISENACH"), ["GRAND DUCHY OF", "SAXE-WEIMAR-", "EISENACH"],
    "greedy at spaces and after hyphens, never past the wrap width where a break exists");
  assert.deepEqual(wrapNameLines("작센바이마르아이제나흐"), ["작센바이마르아이제나흐"], "no break, no wrap — however wide");
  assert.deepEqual(wrapNameLines(""), [""]);
  assert.equal(widestLineEm("GRAND DUCHY OF SAXE-WEIMAR-EISENACH"),
    Math.max(...wrapNameLines("GRAND DUCHY OF SAXE-WEIMAR-EISENACH").map(nameWidthEm)),
    "the widest line is the widest of those lines — one wrap rule, read twice");
  assert.equal(LABEL_LINE_HEIGHT_EM, 1.2, "MapLibre's default text-line-height; the placement's box height is lines × this");
});

test("the label sits where it fits — on its own piece, the least distance from its anchor", () => {
  const P = (rings) => projectPolygon(rings, (point) => point);
  // A projected polygon is one flat buffer, ring by ring.
  const square = P([[[0, 0], [10, 0], [10, 10], [0, 10], [0, 0]], [[4, 4], [6, 4], [6, 6], [4, 6], [4, 4]]]);
  assert.deepEqual([...square.ringStart], [0, 5, 10], "outer ring then hole, end to end");
  assert.equal(square.xs.length, 10);
  // A label wholly on a rectangle stays exactly where it is.
  const rect = P([[[0, 0], [100, 0], [100, 40], [0, 40], [0, 0]]]);
  const stay = placeLabelInPiece({ polygons: [rect], anchor: [50, 20], halfWidth: 30, halfHeight: 6, rotation: 0, em: 10 });
  assert.equal(stay.moved, false);
  assert.deepEqual(stay.position, [50, 20]);
  assert.equal(stay.coverage, 1);
  assert.equal(stay.anchorCoverage, 1);
  // A crescent: the anchor (its centroid) is in the bite. The label moves onto
  // the nearer arm and lands wholly on it.
  const cee = P([[[0, 0], [100, 0], [100, 100], [0, 100], [0, 80], [80, 80], [80, 20], [0, 20], [0, 0]]]);
  const bite = placeLabelInPiece({ polygons: [cee], anchor: [40, 45], halfWidth: 8, halfHeight: 4, rotation: 0, em: 4 });
  assert.equal(bite.anchorCoverage, 0, "nothing of it was on land");
  assert.equal(bite.moved, true);
  assert.equal(bite.coverage, 1);
  assert.ok(bite.position[1] < 20 && bite.position[1] > 4 && bite.position[0] > 8 && bite.position[0] < 72,
    `on the lower arm, clear of its edges: ${bite.position}`);
  // …unless another label already sits there: an obstacle over the lower arm
  // sends it to the upper one.
  const taken = labelBox([40, 10], 45, 12, 0);
  const around = placeLabelInPiece({ polygons: [cee], anchor: [40, 45], halfWidth: 8, halfHeight: 4, rotation: 0, em: 4, obstacles: [taken] });
  assert.equal(around.coverage, 1);
  assert.ok(around.position[1] > 80, `up onto the top arm: ${around.position}`);
  // The pull: a label sticking out over one end of a long bar moves the LEAST
  // that brings it wholly on — toward the middle, not to the far end.
  const bar = P([[[0, 0], [200, 0], [200, 20], [0, 20], [0, 0]]]);
  const nudged = placeLabelInPiece({ polygons: [bar], anchor: [30, 10], halfWidth: 40, halfHeight: 5, rotation: 0, em: 5 });
  assert.equal(nudged.coverage, 1);
  // (a raster cell is 200/256 here, so "just" is within one cell of x = 40)
  assert.ok(nudged.position[0] >= 39 && nudged.position[0] < 46, `just far enough in: ${nudged.position}`);
  assert.ok(Math.abs(nudged.position[1] - 10) < 2, "and not off the bar's centreline");
  // Rotation is the label's, in the working plane (clockwise, y down): the same
  // label along a diagonal bar fits; across it, it does not.
  const diagonal = P([[[0, 0], [20, 0], [120, 100], [100, 100], [0, 0]]]);
  assert.equal(placeLabelInPiece({ polygons: [diagonal], anchor: [60, 50], halfWidth: 40, halfHeight: 4, rotation: 45, em: 4 }).moved, false);
  assert.ok(placeLabelInPiece({ polygons: [diagonal], anchor: [60, 50], halfWidth: 40, halfHeight: 4, rotation: -45, em: 4 }).anchorCoverage < 0.3);
  // Nothing to fit into keeps the anchor.
  assert.deepEqual(placeLabelInPiece({ polygons: [], anchor: [1, 2], halfWidth: 1, halfHeight: 1, em: 1 }),
    { position: [1, 2], coverage: 0, anchorCoverage: 0, landCoverage: 0, moved: false });
  assert.equal(placeLabelInPiece({ polygons: [rect], anchor: [50, 20], halfWidth: 1, halfHeight: 1, em: 0 }).moved, false, "no em, no pull, no move");
  // The dials, as measured: 256 cells reads a ragged coast right; 0.03 per em
  // keeps a settled label settled and moves an unsettled one the least.
  assert.equal(LABEL_FIT_CELLS, 256);
  assert.equal(LABEL_FIT_PULL, 0.03);
  assert.match(CLUSTERS, /const LABEL_FIT_SETTLED = 0\.999;/, "wholly on its land, less one sample of tolerance");
  // The pieces of the box a placement is measured with.
  const box = labelBox([10, 10], 5, 2, 90);
  assert.ok(Math.abs(box.minX - 8) < 1e-9 && Math.abs(box.maxX - 12) < 1e-9 && Math.abs(box.minY - 5) < 1e-9 && Math.abs(box.maxY - 15) < 1e-9,
    "a box turned 90° is as wide as it was tall");
  const multi = { type: "MultiPolygon", coordinates: [
    [[[0, 0], [1, 0], [1, 1], [0, 0]]],
    [[[0, 0], [5, 0], [5, 5], [0, 5], [0, 0]], [[1, 1], [2, 1], [2, 2], [1, 1]]],
  ] };
  assert.equal(largestPolygonOf(multi).length, 2, "the largest polygon by its outer ring, holes kept");
  assert.equal(largestPolygonOf(null), null);
});

test("Nations.jsx places every flat label after it knows every label — obstacles first", () => {
  // The loop collects, the pass places: a flat label carries its piece's
  // regions and its drawn em (tier-1 at MINOR_LABEL_SCALE) to a second pass
  // that runs once every glyph and flat label is known. Every flat label
  // waits — there is no leader branch to skip any more (2026-08-18).
  assert.match(NATIONS, /const pending = \[\];/);
  assert.match(NATIONS, /features\.push\(feature\);\n(?:\s*\/\/.*\n)*\s*pending\.push\(\{\n\s*feature,\n\s*members: anchor === merged \? merged\.members : anchor\.members,\n\s*em: \(index === 0 \? 1 : MINOR_LABEL_SCALE\) \* feature\.properties\.areaScale \* TILE_UNITS_PER_EM_PER_SCALE,\n(?:\s*\/\/.*\n)*\s*seat: index === 0,\n\s*labelId: id - 1,\n\s*cluster,\n\s*name,\n\s*ownScale,\n\s*tilt,\n\s*elongation,\n\s*\}\);/,
    "a flat label waits with the anchor piece's own region list, its drawn size, and what a curve would need");
  assert.doesNotMatch(NATIONS, /if \(!leader\) \{/, "no flat label is exempt from placement");
  assert.match(NATIONS, /const boxes = new Map\(features\.map\(\(feature\) => \[feature\.id, boxOfFeature\(feature\)\]\)\);/,
    "every label the map draws is a box before any flat label is placed");
  assert.match(NATIONS, /for \(const \{ feature, members, em, seat, labelId, cluster, name, ownScale, tilt, elongation \} of pending\) \{/);
  assert.match(NATIONS, /const placed = placeLabelInPiece\(\{\n\s*polygons,\n\s*anchor: lngLatToTile\(feature\.geometry\.coordinates, CURVE_TILE_EXTENT\),\n\s*halfWidth: \(widestLineEm\(p\.name\) \/ 2\) \* em,\n\s*halfHeight: \(wrapNameLines\(p\.name\)\.length \* LABEL_LINE_HEIGHT_EM \* em\) \/ 2,\n\s*rotation: p\.rotation,\n\s*em,\n\s*obstacles,\n\s*\}\);/,
    "the label's own wrapped width, line count and tilt, in tile space, against every other box");
  assert.match(NATIONS, /if \(!placed\.moved\) continue;\n\s*const lngLat = tileToLngLat\(placed\.position, CURVE_TILE_EXTENT\);\n\s*feature\.geometry\.coordinates = lngLat;\n\s*p\.lat = lngLat\[1\];\n\s*boxes\.set\(feature\.id, boxOfFeature\(feature\)\);/,
    "a moved label moves its globe latitude with it and becomes the obstacle it now is");
  assert.match(NATIONS, /const projectedPieceCache = new WeakMap\(\);/, "regions are projected once per world, not once per rebuild");
  assert.match(NATIONS, /const projected = projectedPieceOf\(allFeatures\[index\]\?\.geometry\);/);
  // Curved glyphs are obstacles too — a box each, at their own size — and the
  // curved lane itself is not placed again: `pending` only ever receives a
  // flat label.
  assert.match(NATIONS, /if \(p\.curved === 1\) \{\n\s*const em = p\.areaScale \* TILE_UNITS_PER_EM_PER_SCALE;\n\s*return labelBox\(centre, \(nameWidthEm\(p\.glyph\) \/ 2\) \* em, em \/ 2, p\.rotation\);\n\s*\}/);
});

test("a short name on a long path is laid compact and centred, not scattered — and only when asked", () => {
  // The quarter-arc again. Two glyphs spread across it face 90° apart and are
  // refused; the same two glyphs at a capped size sit together at the arc's
  // middle, face nearly the same way, and pass.
  const ring = bentBand();
  const spread = buildClusterCurvePath([ring], bandCentroid, -45, 2, { needed: true, glyphCount: 2 });
  assert.equal(spread, null, "spread across the arc: refused (as before)");
  const compact = buildClusterCurvePath([ring], bandCentroid, -45, 2, { needed: true, glyphCount: 2, maxPerEm: 4 });
  assert.ok(compact, "capped at 4 units an em, the two glyphs share the middle of the arc");
  // The layout follows the same cap: the name occupies totalEm × maxPerEm of
  // path, centred, instead of the whole usable length.
  const laid = layoutGlyphsAlongPath(compact, "AB", { maxPerEm: 4 });
  assert.ok(laid && Math.abs(laid.perEm - 4) < 1e-9, "one em is four units of path");
  const loose = layoutGlyphsAlongPath(compact, "AB");
  assert.ok(loose.perEm > laid.perEm * 5, "without the cap the same name spreads over the path");
  const mid = (pts) => pts.reduce((a, g) => [a[0] + g.position[0] / pts.length, a[1] + g.position[1] / pts.length], [0, 0]);
  const centreOfPath = compact.points[Math.floor(compact.points.length / 2)];
  const [mx, my] = mid(laid.glyphs);
  assert.ok(Math.hypot(mx - centreOfPath[0], my - centreOfPath[1]) < 15, `centred on the path: ${[mx, my]} vs ${centreOfPath}`);
  // Nations.jsx asks for the compact layout only for the SHAPE-driven curve —
  // the width-driven one is left exactly as measured on the fleet.
  assert.match(NATIONS, /const maxPerEm = forShape \? ownScale \* TILE_UNITS_PER_EM_PER_SCALE : undefined;/);
  assert.match(NATIONS, /const laid = layoutGlyphsAlongPath\(path, name, \{ maxPerEm \}\);/);
});

test("a seat whose flat label sits on its land nowhere gets the curve after placement", () => {
  // placeLabelInPiece reports how much of the label is on the piece itself at
  // the spot it chose, obstacles or no — the cue for the curve.
  const P = (rings) => projectPolygon(rings, (point) => point);
  const rect = P([[[0, 0], [100, 0], [100, 40], [0, 40], [0, 0]]]);
  const clear = placeLabelInPiece({ polygons: [rect], anchor: [50, 20], halfWidth: 30, halfHeight: 6, rotation: 0, em: 10 });
  assert.equal(clear.landCoverage, 1);
  const busy = placeLabelInPiece({ polygons: [rect], anchor: [50, 20], halfWidth: 30, halfHeight: 6, rotation: 0, em: 10, obstacles: [labelBox([50, 20], 60, 30, 0)] });
  assert.ok(busy.landCoverage >= busy.coverage, "land is what is left when the obstacles are put back");
  assert.equal(busy.landCoverage, 1, "the rectangle is all land, however crowded");
  const thin = P([[[0, 0], [100, 0], [100, 4], [0, 4], [0, 0]]]);
  const spill = placeLabelInPiece({ polygons: [thin], anchor: [50, 2], halfWidth: 30, halfHeight: 6, rotation: 0, em: 10 });
  assert.ok(spill.landCoverage < 0.5, `a label taller than its strip is mostly off it wherever it goes: ${spill.landCoverage}`);
  // Wired in the placement pass, seat only, below the measured share; the
  // glyphs replace the flat feature under its id and become obstacles.
  assert.match(NATIONS, /const LABEL_CURVE_LAND_COVERAGE = 0\.8;/, "80% of the label on its land, measured across the fleet — 30 seats fall under it");
  assert.match(NATIONS, /if \(seat && placed\.landCoverage < LABEL_CURVE_LAND_COVERAGE\) \{\n\s*const curved = buildOwnerCurve\(cluster, allFeatures, name, ownScale, tilt, elongation, \{ forShape: true \}\);\n\s*if \(curved\) \{\n\s*const glyphs = curvedGlyphFeatures\(curved, labelId\);\n\s*features\.splice\(features\.indexOf\(feature\), 1, \.\.\.glyphs\);\n\s*boxes\.delete\(feature\.id\);\n\s*for \(const glyph of glyphs\) boxes\.set\(glyph\.id, boxOfFeature\(glyph\)\);\n\s*continue;\n\s*\}\n\s*\}/);
  assert.match(NATIONS, /if \(flatFits && !forShape\) return null;/, "the width gate still holds for the loop's own call");
  assert.match(NATIONS, /const curved = index === 0\n\s*\? buildOwnerCurve\(cluster, allFeatures, name, ownScale, tilt, elongation\)/,
    "…which is unchanged: no option, no compact layout");
});

test("a leader label that lands on another label tries the other ways out, in order", () => {
  // A unit square, axis horizontal: the way out is north (the convention).
  const corners = [[0, 0], [1, 0], [1, 1], [0, 1]];
  const first = buildLeaderPlacement(corners, [0.5, 0.5], 0, 0.5);
  const ways = leaderPlacementCandidates(corners, [0.5, 0.5], 0, 0.5);
  assert.equal(ways.length, 8 * LEADER_EXTENSION_STEPS.length, "eight directions at each of the extension steps");
  assert.deepEqual(ways[0], first, "the first candidate IS the convention — nothing moves that was clear");
  assert.deepEqual(ways[1].anchor, [0.5, -0.5], "then the other side of the minor axis");
  assert.deepEqual(ways[2].anchor.map((v) => +v.toFixed(9)), [1.5, 0.5], "then along the major axis…");
  assert.deepEqual(ways[3].anchor.map((v) => +v.toFixed(9)), [-0.5, 0.5], "…both ways");
  const diagonal = ways[4].anchor;
  assert.ok(diagonal[0] > 1 && diagonal[1] > 1, `then the diagonals: ${diagonal}`);
  assert.deepEqual(ways[8].anchor, [0.5, 1.75], "the second lap sits half an extension further out");
  assert.deepEqual(ways[16].anchor, [0.5, 2], "the third a whole one");
  assert.deepEqual(leaderPlacementCandidates([[0, 0]], [0, 0], 0, 0.5), [], "no shape, no ways");
  assert.deepEqual(LEADER_EXTENSION_STEPS, [1, 1.5, 2]);
  // Boxes: the collision test the pass uses.
  const a = labelBox([0, 0], 5, 2, 0);
  assert.equal(boxesOverlap(a, labelBox([4, 0], 5, 2, 0)), true, "side by side and touching over 6 units");
  assert.equal(boxesOverlap(a, labelBox([11, 0], 5, 2, 0)), false, "clear by a unit");
  assert.equal(boxesOverlap(a, labelBox([0, 5], 5, 2, 0)), false, "clear vertically");
  assert.equal(boxesOverlap(a, labelBox([7, 3], 5, 2, 45)), true, "a turned box reaching in");
  assert.equal(boxesOverlap(a, labelBox([9, 4], 5, 0.5, 90)), false, "a turned box whose bounds meet but whose body does not");
  assert.equal(boxesOverlap(null, a), false);
  // It WAS wired in Nations.jsx (C-1, ed2d954: after every flat label was
  // placed, each leader label walked these candidates if it collided, and the
  // line followed — fleet: leader labels on each other 80 pairs → 4). The
  // owner lane retired leader labels the same day (see "NO SEAT IS PROMOTED"
  // above), so the pass went with them; the generator stays, pure and pinned,
  // for the stock lane that still promotes.
  assert.doesNotMatch(NATIONS, /pendingLeaders/);
  assert.doesNotMatch(NATIONS, /leaderPlacementCandidates/);
});

console.log("\nA name shrinks to its country and fades in with the zoom — labelPaint.js and the sizing rule");

test("THE CURVE HAS NO FLOOR EITHER — glyphs shrink to the path, capped at the seat's own weight", () => {
  // buildOwnerCurve used to refuse a path that could not hold the name at
  // LEADER_AREA_SCALE_FLOOR (minPathPerEm) and clamp the glyph size to that
  // floor; the leader line answered below it. With the lane retired the path
  // sizes the glyphs, however small — LAO PEOPLE'S DEMOCRATIC REPUBLIC along
  // Laos, as the original draws it — and only the shape gates in
  // buildClusterCurvePath (width ratio, kink, glyph step) still say no.
  const at = NATIONS.indexOf("const buildOwnerCurve = ");
  const block = NATIONS.slice(at, NATIONS.indexOf("const curvedGlyphFeatures", at));
  assert.doesNotMatch(block, /minPathPerEm: /, "no minimum path length per em");
  assert.doesNotMatch(block, /Math\.max\(LEADER_AREA_SCALE_FLOOR/, "no floor under the glyph size");
  assert.match(block, /const areaScale = Math\.min\(ownScale, fillScale\);/, "sized to the path, capped at own weight");
});

test("the fade window is the original's, measured, in the label's own on-screen px", () => {
  assert.deepEqual(LABEL_FADE_IN_PX, [6, 12], "absent at 6 px, full at 12 — REPUBLIC OF KOREA on the original");
  assert.deepEqual(LABEL_FADE_OUT_PX, [100, 200], "full to 100 px, gone at 200 — JAPAN across Honshu on the original");
  // The window as an expression of px, and the composite around it: one
  // output per integer zoom, 0..24, on ["zoom"], with 2^(z−16) already a
  // number in each — never ["zoom"] inside arithmetic.
  const expr = buildCountryTextOpacity(1, null, 0.75);
  assert.equal(expr[0], "interpolate");
  assert.deepEqual(expr[2], ["zoom"]);
  assert.equal(expr.length, 3 + 25 * 2, "integer stops 0..24");
  assert.equal(expr[3], 0);
  assert.equal(expr[expr.length - 2], 24);
  assert.doesNotMatch(JSON.stringify(expr).slice(30), /"zoom"/, "[\"zoom\"] appears once, at the top");
  const at16 = expr[3 + 16 * 2 + 1];
  assert.deepEqual(at16, ["*", 0.75, fadeWindowOf(["*", 1, ["*", ["get", "areaScale"], 1]])], "at z16 an em is areaScale px");
  // A minor label reads its own drawn size — MINOR_LABEL_SCALE of the areaScale.
  const minor = buildCountryTextOpacity(0.6, null, 0.75);
  assert.deepEqual(minor[3 + 16 * 2 + 1], ["*", 0.75, fadeWindowOf(["*", 0.6, ["*", ["get", "areaScale"], 1]])]);
  // On the globe the correction expression multiplies in, as it does in text-size.
  const globe = buildCountryTextOpacity(1, ["cos", ["get", "lat"]], 0.75);
  assert.deepEqual(globe[3 + 16 * 2 + 1], ["*", 0.75, fadeWindowOf(["*", ["*", 1, ["cos", ["get", "lat"]]], ["*", ["get", "areaScale"], 1]])]);
});

test("…and MapLibre accepts every one of them — the validator that would have caught the leader line", async () => {
  // @maplibre/maplibre-gl-style-spec ships with maplibre-gl. createPropertyExpression
  // is what the style validator runs: it is the call that says '"zoom"
  // expression may only be used as input to a top-level "step" or "interpolate"'
  // — the error the first leader-line opacity produced on every style pass, on
  // a layer nothing in this file could import. Now the expressions are pure
  // and this asks. If the package is not resolvable (a checkout without
  // node_modules) the structural pins above still stand; say so and move on.
  let spec;
  try { spec = await import("@maplibre/maplibre-gl-style-spec"); } catch { console.log("  (style-spec not installed here — MapLibre validation skipped)"); return; }
  const { createPropertyExpression, latest } = spec;
  const globe = ["cos", ["*", ["coalesce", ["get", "lat"], 0], Math.PI / 180]];
  for (const [name, expr, propertySpec] of [
    ["text-opacity", buildCountryTextOpacity(1, null, 0.75), latest.paint_symbol["text-opacity"]],
    ["text-opacity (globe)", buildCountryTextOpacity(1, globe, 0.75), latest.paint_symbol["text-opacity"]],
    ["text-opacity (minor)", buildCountryTextOpacity(0.6, null, 0.75), latest.paint_symbol["text-opacity"]],
    ["line-opacity", buildLeaderLineOpacity(), latest.paint_line["line-opacity"]],
  ]) {
    const result = createPropertyExpression(expr, propertySpec);
    assert.equal(result.result, "success", `${name}: ${JSON.stringify(result.value?.map?.((e) => e.message))}`);
    assert.equal(result.value.kind, "composite", `${name} depends on zoom and on the feature`);
  }
  // …and the old expression is exactly what it refuses.
  const old = createPropertyExpression(
    ["interpolate", ["linear"], ["*", ["coalesce", ["get", "ownScale"], 0], ["^", 2, ["-", ["zoom"], 16]]], 20, 0.38, 60, 0],
    latest.paint_line["line-opacity"],
  );
  assert.equal(old.result, "error");
  assert.match(old.value[0].message, /top-level "step" or "interpolate"/);
  // Values, read back the way the renderer would: a leader-sized label
  // (30,000) at the Malay view (z6.83, 52 px) is solid; at z8.5 (166 px) it is
  // two thirds gone; a 3,000 micro-state is absent at z7 (6 px) and in at z8
  // (12 px); a 105k possession at ×0.6 and z7.6 (186 px) is nearly gone.
  const evaluate = (expr, zoom, properties) => createPropertyExpression(expr, latest.paint_symbol["text-opacity"]).value.evaluate({ zoom }, { type: "Point", properties });
  const t0 = buildCountryTextOpacity(1, null, 0.75);
  assert.equal(evaluate(t0, 6.83, { areaScale: 30000 }), 0.75);
  assert.ok(Math.abs(evaluate(t0, 8.5, { areaScale: 30000 }) - 0.31) < 0.02);
  assert.equal(evaluate(t0, 7, { areaScale: 3000 }), 0);
  assert.ok(evaluate(t0, 8, { areaScale: 3000 }) > 0.7);
  const t1 = buildCountryTextOpacity(0.6, null, 0.75);
  assert.ok(evaluate(t1, 7.6, { areaScale: 104918 }) < 0.25);
  const line = createPropertyExpression(buildLeaderLineOpacity(), latest.paint_line["line-opacity"]).value;
  assert.equal(line.evaluate({ zoom: 8 }, { type: "LineString", properties: { ownScale: 3157 } }), 0.38, "a micro-state keeps its line");
  assert.ok(line.evaluate({ zoom: 8 }, { type: "LineString", properties: { ownScale: 14387 } }) < 0.2, "a country nearing reading size loses it");
});

test("Nations.jsx paints every label layer with the window, in the size that layer draws at", () => {
  assert.match(NATIONS, /import \{ buildCountryTextOpacity, buildLeaderLineOpacity \} from "\.\.\/\.\.\/runtime\/labelPaint\.js";/);
  const paint = NATIONS.slice(NATIONS.indexOf("const labelLayerPaint"), NATIONS.indexOf("const minorLabelLayerPaint"));
  assert.match(paint, /"text-opacity": buildCountryTextOpacity\(1, isGlobe \? GLOBE_LAT_CORRECTION : null, 0\.75\),/,
    "the country, leader and curved layers: full size, the flat 0.75 as the peak");
  assert.doesNotMatch(paint, /"text-opacity": 0\.75,/, "the flat value is the peak now, not the property");
  const minor = NATIONS.slice(NATIONS.indexOf("const minorLabelLayerPaint"), NATIONS.indexOf("return (", NATIONS.indexOf("const minorLabelLayerPaint")));
  assert.match(minor, /"text-opacity": buildCountryTextOpacity\(MINOR_LABEL_SCALE, isGlobe \? GLOBE_LAT_CORRECTION : null, 0\.75\),/,
    "the minor layer reads the size it draws at, or a repeat fades in 40% early");
  assert.match(NATIONS, /"line-opacity": buildLeaderLineOpacity\(\),/);
  assert.match(NATIONS, /\}\), \[labelHaloColor, labelTextColor, isGlobe\]\);/, "isGlobe is a dependency of the paint now");
});

// ── Every detached piece named, and city names that snap ─────────────────────
// 2026-08-19, both on the player's call: "분리된 영토에도 국가명이 띄워지게" and
// "프로빈스[도시] 레이블은 페이드 말고 보이고 안보이고만". The first retires the
// tier-1 area gate (the fade is the size gate now); the second fixes the city
// label anchor (variable-anchor was the reported "들쭉날쭉") and puts the names
// on an integer-zoom on/off ladder, dots unchanged.
console.log("\nEvery detached piece named; city names on one anchor, on/off by zoom");

const CITIES = read("src/Game/Map/Cities.jsx");

test("the tier-1 area gate is retired — only zero-area degenerates skip", () => {
  assert.doesNotMatch(NATIONS, /const MIN_CLUSTER_AREA/,
    "the constant is gone; the fade does the size job (labelPaint.js)");
  assert.match(NATIONS, /if \(index > 0 && !\(merged\.area > 0\)\) continue;/,
    "the only remaining skip is the data guard for empty geometry");
  // The rule that spends this: fleet tier-1 repeats 513 -> 1,378, every one of
  // them sized by its own area so the fade hides it until it can be read.
});

test("a city name sits on ONE anchor — the dodge list is gone from both lanes", () => {
  assert.doesNotMatch(CITIES, /"text-variable-anchor":/,
    "variable-anchor was the reported jumping (들쭉날쭉)");
  assert.equal((CITIES.match(/"text-anchor": "top"/g) ?? []).length, 2,
    "stock and custom label layers both anchor top — the name hangs below its dot");
});

test("city names snap on and off by rank — a filter ladder, never a fade", () => {
  assert.match(CITIES, /\["all", \[">=", \["get", "tier"\], 3\], \[">=", \["zoom"\], 5\]\]/,
    "tier 3 names from z5");
  assert.match(CITIES, /\["all", \[">=", \["get", "tier"\], 2\], \[">=", \["zoom"\], 6\]\]/,
    "tier 2 names from z6");
  assert.match(CITIES, /customLabelTierFilter = \[[^;]*\[">=", \["zoom"\], 7\],\n\];/,
    "towns from z7");
  assert.match(CITIES, /"==", \["get", "capital"\], "primary"/,
    "capitals are exempt — their name is why they are on the map");
  assert.doesNotMatch(CITIES, /"text-opacity":/,
    "on/off lives in the FILTER: an opacity-0 label would still own its collision box");
  assert.match(CITIES, /filter=\{labelFilter\}/,
    "the label layers take the gated filter…");
  assert.match(CITIES, /\["all", customFilter, customLabelTierFilter\]/,
    "…which is the dot filter AND the ladder, so a name never outlives its dot");
  assert.match(CITIES, /\["all", stockFilter, stockLabelGateFilter\]/,
    "same wiring on the stock lane");
});

test("the tile fill's match fallback is transparent — the A-3 undercoat is gone", () => {
  assert.match(NATIONS, /"fill-color": \["match", \["get", "GID_1"\], \.\.\.stops, "rgba\(0, 0, 0, 0\)"\],/,
    "a tile feature the GeoJSON does not know paints NOTHING — its ground belongs to other geometry");
  assert.doesNotMatch(NATIONS, /\.\.\.stops, NEUTRAL_LAND_COLOR\]/,
    "the old NEUTRAL fallback was a 0.72 grey undercoat under every re-seeded country (measured ~0.92 vs 0.72)");
});

test("the coastline draws from the border file, thinner, and never stacks on a border", () => {
  assert.match(NATIONS, /id="owner-coasts"/, "the coast has its own layer on the owner-border source");
  assert.match(NATIONS, /filter=\{\["==", \["get", "kind"\], "coast"\]\}/,
    "it draws exactly the builder's kind:\"coast\" segments (WORKLOG contract)");
  assert.match(NATIONS, /id="owner-borders"\n          type="line"\n          filter=\{\["!=", \["get", "kind"\], "coast"\]\}/,
    "…and the national-border layer excludes them, so the two weights never stack");
  assert.match(NATIONS, /2, 0\.36 \* borderScale,\n              4, 0\.6 \* borderScale,/,
    "0.6x the national line at every stop — thinner, the player's call (가늘게)");
});

test("the stock name ladder is a population staircase, measured against the original", () => {
  // Counted on the same 2560px canvas over the same ground (2026-08-19): the
  // original draws 0 city names at z4.3, 27 at z5.8 (Beijing→Tokyo) and 14 at
  // z6.7 (Korea→Kansai). The first version of this gate — capitals always,
  // 2.5M from z5, everyone else from z6 — measured 82 on our own screen at
  // z5.8 against those 27, because the gate opened fully one zoom too early
  // and did it everywhere at once.
  const gate = CITIES.slice(CITIES.indexOf("const stockLabelGateFilter"), CITIES.indexOf("const stockLabelSize"));
  assert.match(gate, /\["all", \["==", \["get", "capital"\], "primary"\], \[">=", \["zoom"\], 5\]\]/,
    "capitals join at z5 — the original names nothing at z4.3, us included now");
  for (const [pop, zoom] of [[5000000, 5], [2500000, 6], [1000000, 7], [500000, 8]]) {
    assert.match(gate, new RegExp(`\\["all", \\[">=", \\["get", "population"\\], ${pop}\\], \\[">=", \\["zoom"\\], ${zoom}\\]\\]`),
      `${pop / 1000000}M joins at z${zoom}`);
  }
  assert.match(gate, /\[">=", \["zoom"\], 10\],\n\];/,
    "everyone else at z10 — written as an integer because a filter evaluates zoom at integers");
  assert.doesNotMatch(gate, /\[">=", \["zoom"\], 6\],\n\];/,
    "the old 'everyone from z6' rung is gone — that was the mat");
});

test("a stock city name is sized by its rank, the way the original sizes them", () => {
  assert.match(CITIES, /"text-size": stockLabelSize,/,
    "the stock label layer takes the ranked size…");
  const size = CITIES.slice(CITIES.indexOf("const stockLabelSize"), CITIES.indexOf("const stockShapeLayout"));
  assert.doesNotMatch(CITIES, /"interpolate", \["linear"\], \["zoom"\],\n\s+3, 8,\n\s+10, 10,/,
    "…and the one-size-for-everyone ramp is gone");
  assert.equal((size.match(/"==", \["get", "capital"\], "primary"\], 1[13]/g) ?? []).length, 2,
    "a primary capital is the largest at both ends of the ramp (11 → 13)");
  assert.match(size, /\["any", \["==", \["get", "capital"\], "admin"\], \[">=", \["get", "population"\], 2500000\]\]/,
    "the ◆ class — an admin capital or 2.5M — is the middle step");
});

test("…and MapLibre accepts the two city expressions as composite", async () => {
  let spec;
  try { spec = await import("@maplibre/maplibre-gl-style-spec"); } catch { console.log("  (style-spec not installed here — structural pins above still stand)"); return; }
  const { createPropertyExpression, latest } = spec;
  // text-size varies with zoom AND with the feature, which MapLibre allows only
  // as zoom-outside/data-inside. Written the other way it is refused at style
  // load and the layer silently never draws — the leader-line bug, again.
  const size = [
    "interpolate", ["linear"], ["zoom"],
    3, ["case", ["==", ["get", "capital"], "primary"], 11,
        ["any", ["==", ["get", "capital"], "admin"], [">=", ["get", "population"], 2500000]], 9.5, 8],
    10, ["case", ["==", ["get", "capital"], "primary"], 13,
         ["any", ["==", ["get", "capital"], "admin"], [">=", ["get", "population"], 2500000]], 11.5, 10],
  ];
  const built = createPropertyExpression(size, latest.layout_symbol["text-size"]);
  assert.equal(built.result, "success", JSON.stringify(built.value?.map?.((e) => e.message)));
  assert.equal(built.value.kind, "composite");
  const at = (zoom, properties) => built.value.evaluate({ zoom }, { type: "Point", properties });
  assert.equal(at(3, { capital: "primary", population: 9000000 }), 11);
  assert.equal(at(10, { capital: "primary", population: 9000000 }), 13);
  assert.equal(at(3, { capital: "admin", population: 400000 }), 9.5, "an admin capital reads as ◆ however small");
  assert.equal(at(3, { capital: "", population: 3000000 }), 9.5, "so does a 2.5M+ city with no rank");
  assert.equal(at(3, { capital: "minor", population: 120000 }), 8, "everyone else is ■");
  // The gate itself, evaluated as a filter the way the renderer would.
  const gate = ["any",
    ["all", ["==", ["get", "capital"], "primary"], [">=", ["zoom"], 5]],
    ["all", [">=", ["get", "population"], 5000000], [">=", ["zoom"], 5]],
    ["all", [">=", ["get", "population"], 2500000], [">=", ["zoom"], 6]],
    ["all", [">=", ["get", "population"], 1000000], [">=", ["zoom"], 7]],
    ["all", [">=", ["get", "population"], 500000], [">=", ["zoom"], 8]],
    [">=", ["zoom"], 10]];
  const filt = spec.featureFilter ? spec.featureFilter(gate) : null;
  if (filt) {
    const passes = (zoom, properties) => filt.filter({ zoom }, { type: 1, properties });
    assert.equal(passes(4, { capital: "primary", population: 20000000 }), false, "no capitals at z4 — the original prints none");
    assert.equal(passes(5, { capital: "primary", population: 300000 }), true, "capitals from z5");
    assert.equal(passes(5, { capital: "", population: 6000000 }), true, "5M from z5");
    assert.equal(passes(5, { capital: "", population: 3000000 }), false, "2.5M waits for z6");
    assert.equal(passes(6, { capital: "", population: 3000000 }), true);
    assert.equal(passes(7, { capital: "", population: 1200000 }), true);
    assert.equal(passes(9, { capital: "", population: 300000 }), false, "a small town waits for z10");
    assert.equal(passes(10, { capital: "", population: 300000 }), true);
  }
});

console.log(`\n${pass} passed\n`);

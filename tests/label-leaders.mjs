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
  fitNameToTerritory, NAME_FIT_LETTERS, NAME_FIT_EM, LABEL_MAX_WIDTH_EM, nameWidthEm, widestLineEm,
} = await import("../src/runtime/labelLeaders.js");
const { buildClusterCurvePath, layoutGlyphsAlongPath } = await import("../src/runtime/labelCurves.js");
const {
  REGION_ADJACENCY_DEGREES, buildRegionAdjacency, snapshotClusterPart, largestClusterPart,
} = await import("../src/runtime/labelClusters.js");

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
  // screen" and a cluster of small states at z6.6 lost every line to it. See
  // the pin at the end of this file. The label itself no longer fades (see
  // labelLayerPaint), so the invariant here — the line never outlives its text
  // — is satisfied with room to spare.
  const paint = NATIONS.slice(NATIONS.indexOf("const leaderLinePaint"), NATIONS.indexOf("const labelLayerPaint"));
  assert.match(paint, /20, 0\.38,/);
  assert.match(paint, /60, 0,/);
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

test("…and it takes the stock lane's constants rather than restating them", () => {
  // Two floors drift apart the first time either is tuned.
  const imports = NATIONS.slice(0, NATIONS.indexOf("ensurePmtilesProtocol()"));
  assert.match(imports, /LEADER_AREA_SCALE_FLOOR/);
  assert.match(imports, /LEADER_LABEL_AREA_SCALE/);
  assert.match(imports, /LEADER_EXTENSION_DEFAULT/);
  assert.match(imports, /buildLeaderPlacement/);
  assert.match(imports, /from "\.\.\/\.\.\/runtime\/labelLeaders\.js"/);
});

test("ONLY THE SEAT IS PROMOTED — a possession is a repeat, not a lost name", () => {
  // Pulling every under-floor possession onto its own line would draw a
  // hairline to each of the British Empire's fourteen, for a name the map
  // already carries at full size somewhere else.
  const at = NATIONS.indexOf("const leader = index === 0");
  assert.notEqual(at, -1, "the promotion must test the seat");
  assert.match(NATIONS.slice(at, at + 200), /ownScale < LEADER_AREA_SCALE_FLOOR/);
});

test("a promoted owner label leaves its shape the way the stock one does", () => {
  const block = NATIONS.slice(NATIONS.indexOf("const buildOwnerLabelCollection"),
    NATIONS.indexOf("const WorldMap"));
  assert.match(block, /coordinates: leader \? leader\.anchor/, "it sits at the anchor");
  assert.match(block, /areaScale: leader\s*\n?\s*\? LEADER_LABEL_AREA_SCALE/, "and draws to be read");
  assert.match(block, /rotation: leader \? 0 : tilt/, "horizontal once it is off its shape");
  assert.match(block, /lat: leader \? leader\.anchor\[1\]/, "globe correction follows the anchor");
  assert.match(block, /leader: leader \? 1 : 0/, "and every feature carries the routing property");
});

test("the extent is carried through the fold, or the line starts inside", () => {
  // The cluster is a fold and the rings are gone by the time the direction is
  // known, so a bounding box rides along — through the union-find AND through
  // the island merge, which is where an axis was nearly lost once already.
  const block = NATIONS.slice(NATIONS.indexOf("const buildOwnerLabelCollection"),
    NATIONS.indexOf("const WorldMap"));
  assert.match(block, /bbox: ringBbox\(best\.ring\)/);
  assert.match(block, /cluster\.bbox = unionBbox\(cluster\.bbox, entry\.bbox\)/);
  assert.match(NATIONS, /if \(a\.bbox && b\.bbox\) a\.bbox = unionBbox\(a\.bbox, b\.bbox\)/,
    "and through mergeOwnerClusters");
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

test("the player's extension dial reaches the owner lane", () => {
  // Baked into the geometry at build time, so the dial has to be a dependency
  // of the memo or moving it moves nothing until the world reloads.
  assert.match(NATIONS, /regionAdjacency,\n\s*labelLineExtension,\n\s*\);/,
    "passed to the builder");
  assert.match(NATIONS, /regionAdjacency, labelLineExtension, labelEpoch\]/,
    "and in the memo's deps");
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
  assert.match(NATIONS, /fitNameToTerritory\(\n\s*index === 0 \? ownScale : Math\.min\(ownScale, seatScale\),\n\s*name,\n\s*tilt \? elongation : 1,/,
    "and the caller only spends it when the label actually turns");
});

test("the floor holds — a name is never shrunk into a province label", () => {
  // Below LEADER_AREA_SCALE_FLOOR a country's name reads at a province's
  // weight, a fault the label paint has already had to fix once. A 60-letter
  // name would ask for a twelfth of the size; it gets the floor instead.
  assert.equal(fitNameToTerritory(120000, "A".repeat(60)), LEADER_AREA_SCALE_FLOOR);
  // …and a label already below the floor is not pushed further down by it.
  assert.equal(fitNameToTerritory(9000, "A".repeat(60)), 9000);
});

test("the leader line fades on the COUNTRY's size, not on zoom", () => {
  // The old ramp was z5 0.38 → z8 0, which put every line at 0.18 by z6.6 — the
  // zoom a player reads a cluster of small states at, and the zoom the overlap
  // was reported from. Andorra on an empty coast showed; the same line in
  // central Germany did not. The reason for fading was never zoom, it was "the
  // shape is now big enough to point at itself", so that is what it reads.
  assert.match(NATIONS, /\["\*", \["coalesce", \["get", "ownScale"\], 0\], \["\^", 2, \["-", \["zoom"\], 16\]\]\]/,
    "opacity interpolates on the country's own on-screen size");
  assert.doesNotMatch(NATIONS, /"line-opacity": \[\s*\n?\s*"interpolate", \["linear"\], \["zoom"\],\s*\n?\s*5, 0\.38/,
    "the zoom ramp is gone, not left sitting beside it");
  // And the builder has to ship the property, or the coalesce reads 0 for every
  // line and they all draw at full strength forever.
  assert.match(NATIONS, /properties: \{ name, ownScale \}/,
    "ownScale rides on the line feature");
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
  // Between the leader line and the flat label; only the seat; only when the
  // flat label would not fit; one feature per glyph tagged `curved`; and the
  // three text-field:name layers exclude those glyphs or every glyph prints
  // the whole name.
  assert.match(NATIONS, /const curved = !leader && index === 0\n\s*\? buildOwnerCurve\(cluster, allFeatures, name, ownScale, tilt, elongation\)/,
    "the rung sits after the leader line and before the flat label");
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
  assert.deepEqual(snap, { cx: 11.4, cy: 49.0, area: 7.0 }, "a snapshot is position and weight, nothing that mutates");
  const merged = { ...mainland, cx: 11.1, cy: 49.03, area: 7.6, parts: [snap, snapshotClusterPart(exclave)] };
  const anchor = largestClusterPart(merged);
  assert.equal(anchor, snap, "the biggest piece wins");
  assert.equal(largestClusterPart(mainland), mainland, "a cluster that never merged is its own anchor");
  const bare = { cx: 1, cy: 2, area: 3, parts: [] };
  assert.equal(largestClusterPart(bare), bare, "empty parts → itself");
  // Wired that way in Nations.jsx: the merge snapshots, the loop anchors, and
  // the anchored view keeps everything but cx/cy from the merged cluster.
  assert.match(NATIONS, /import \{\n\s*buildRegionAdjacency,\n\s*largestClusterPart,\n\s*snapshotClusterPart,\n\} from "\.\.\/\.\.\/runtime\/labelClusters\.js";/);
  assert.match(NATIONS, /a\.parts \?\?= \[snapshotClusterPart\(a\)\];\n\s*b\.parts \?\?= \[snapshotClusterPart\(b\)\];\n\s*a\.parts\.push\(\.\.\.b\.parts\);/,
    "the merge remembers its pieces, snapshotted before the fold");
  assert.match(NATIONS, /const anchor = largestClusterPart\(merged\);\n\s*const cluster = anchor === merged \? merged : \{ \.\.\.merged, cx: anchor\.cx, cy: anchor\.cy \};/,
    "the loop reads size, tier, tilt and rings from the merged cluster and the position from the anchor");
  assert.match(NATIONS, /const ownScale = Math\.sqrt\(cluster\.area\) \* 17500;/, "size still comes from the whole cluster");
  assert.doesNotMatch(NATIONS, /const buildRegionAdjacency = /, "the hairline hash is gone from Nations.jsx, not duplicated");
  assert.match(NATIONS, /const CLUSTER_JOIN_DEGREES = 10;/,
    "the centroid join stays at 10°: at 3° Japan splits into three labels and Britain into two — the join is for archipelagos, the anchor is for exclaves");
});

console.log(`\n${pass} passed\n`);

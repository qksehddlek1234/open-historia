// Plan F, stage F-2 — the face assembler, proven offline twice over: synthetic
// shapes pin every mechanism (turn rule, holes, snap, prune, frame, coast
// fusion, assignment), and a committed REAL fixture (1939 z4 Europe lines +
// z2 label points + modern Baltic coast, all CC0/repo-lineage) pins the
// numbers a full assembly must reproduce. Latvia is the star witness: a valid
// 1939 polity whose face must come out at its true size.
import assert from "node:assert/strict";
import fs from "node:fs";
import {
  AREA_EPS,
  SNAP_TOLERANCE,
  assembleEraBorders,
  attachHoles,
  buildGraph,
  decimateRing,
  nodeCrossings,
  normalizeSegments,
  pointInFace,
  pointInRing,
  pruneDangles,
  signedRingArea,
  snapDangles,
  snapLooseEndsToNetwork,
  traceFaces,
} from "../scripts/ohm/lib/assembleFaces.mjs";
import { resolveWindow } from "../scripts/ohm/lib/eraBorders.mjs";

let pass = 0;
const test = (name, fn) => { fn(); pass += 1; console.log(`  ok  ${name}`); };

const square = (x0, y0, s) => [
  [[x0, y0], [x0 + s, y0]],
  [[x0 + s, y0], [x0 + s, y0 + s]],
  [[x0 + s, y0 + s], [x0, y0 + s]],
  [[x0, y0 + s], [x0, y0]],
];

console.log("\nThe walk itself — sign conventions the whole stage stands on");

test("a lone square traces one CCW face and one CW outside", () => {
  const { rings, anomalies } = traceFaces(buildGraph(square(0, 0, 1)));
  assert.equal(anomalies, 0);
  const areas = rings.map((r) => signedRingArea(r)).sort((a, b) => a - b);
  assert.deepEqual(areas, [-1, 1], "bounded face positive, unbounded negative — the sign IS the classifier");
});

test("two squares sharing an edge are two faces, one shared border", () => {
  const { rings } = traceFaces(buildGraph([...square(0, 0, 1), ...square(1, 0, 1)]));
  const areas = rings.map((r) => +signedRingArea(r).toFixed(6)).sort((a, b) => a - b);
  assert.deepEqual(areas, [-2, 1, 1]);
});

test("an enclave becomes a hole in its host, and its own face too", () => {
  const { rings } = traceFaces(buildGraph([...square(0, 0, 4), ...square(1, 1, 2)]));
  const { faces, stats } = attachHoles(rings);
  assert.equal(faces.length, 2);
  const host = faces.find((f) => f.area === 16);
  assert.equal(host.holes.length, 1, "the enclave ring hangs on the host");
  assert.equal(stats.outsideRings, 1, "the unbounded ring attaches nowhere");
  assert.equal(pointInFace([0.5, 0.5], host), true);
  assert.equal(pointInFace([2, 2], host), false, "inside the hole is NOT inside the host");
  assert.equal(pointInRing([2, 2], faces.find((f) => f.area === 4).outer), true);
});

console.log("\nRepair — measured tolerances, loud discards");

test("a mapper's 0.02° gap welds shut; a chain to nowhere is pruned and counted", () => {
  // The square's left side stops 0.02 short — plus a stub wandering off.
  const gappy = [
    [[0, 0], [1, 0]], [[1, 0], [1, 1]], [[1, 1], [0, 1]], [[0, 1], [0, 0.02]],
    [[1, 1], [1.5, 1.5]], [[1.5, 1.5], [2, 1.7]],
  ];
  const nodes = buildGraph(gappy);
  const welds = snapDangles(nodes, SNAP_TOLERANCE);
  assert.equal(welds.length, 1);
  const { prunedEdges } = pruneDangles(nodes);
  assert.equal(prunedEdges, 2, "the stub dies whole, and the number says so");
  const { rings } = traceFaces(nodes);
  assert.deepEqual(rings.map((r) => signedRingArea(r)).sort((a, b) => a - b), [-1, 1]);
});

test("with snap disabled the same square dissolves entirely — honesty over invention", () => {
  const gappy = [[[0, 0], [1, 0]], [[1, 0], [1, 1]], [[1, 1], [0, 1]], [[0, 1], [0, 0.02]]];
  const nodes = buildGraph(gappy);
  snapDangles(nodes, 0);
  pruneDangles(nodes);
  assert.equal(nodes.size, 0, "an unclosable border bounds nothing");
});

test("a border ending NEAR a coast lands ON it: split, join, close (the fusion move)", () => {
  // A coast square and a vertical border whose ends float 0.03 off it — the
  // exact shape of every sea-facing 1939 country, in miniature.
  const nodes = buildGraph([...square(0, 0, 4), [[2, 0.03], [2, 3.97]]]);
  const welds = snapDangles(nodes, SNAP_TOLERANCE);
  assert.equal(welds.length, 0, "no loose PAIR exists — pair-welding cannot fix this");
  const { joins, splits } = snapLooseEndsToNetwork(nodes, SNAP_TOLERANCE);
  assert.equal(joins, 2);
  assert.equal(splits, 2, "the coast segment is split at each landing point");
  const { rings, anomalies } = traceFaces(nodes);
  assert.equal(anomalies, 0);
  const areas = rings.map((r) => +signedRingArea(r).toFixed(1)).sort((a, b) => a - b);
  assert.deepEqual(areas, [-16, 8, 8], "the border now partitions the landmass in two");
});

console.log("\nNoding — the planar walk gets the planar graph its math assumes");

test("two overlapping squares are noded at their crossings into three faces", () => {
  const nodes = buildGraph([...square(0, 0, 2), ...square(1, 1, 2)]);
  const { crossingsSplit } = nodeCrossings(nodes);
  assert.equal(crossingsSplit, 4, "two crossing points, both segments split at each = four splits");
  const { rings, anomalies } = traceFaces(nodes);
  assert.equal(anomalies, 0);
  const areas = rings.map((r) => +signedRingArea(r).toFixed(6)).filter((a) => a > 0).sort((a, b) => a - b);
  assert.deepEqual(areas, [1, 3, 3], "A-only, B-only, and the overlap — no invented territory");
});

test("a quantum staircase (the Albania trap) resolves as a T-junction and converges", () => {
  // Two copies of the same border whose tips round ONE round5 quantum apart
  // (the real coordinates: the Albania/Montenegro corner at 19.3782°E). The
  // exact crossing sits 0.8-1.8 quanta short of the tips, so splitting at the
  // ROUNDED point mints a brand-new node one quantum below the tip, re-anchors
  // both segments to it, and the next pass finds the same configuration one
  // step further down — a staircase that ran the pass cap forever and walked
  // Albania's label off the map. Within END_TOL of an endpoint, the endpoint
  // IS the junction: split only the other segment there, mint nothing.
  const nodes = buildGraph([
    [[19.35791, 42.03297], [19.3782, 42.06308]],
    [[19.37553, 42.05337], [19.3782, 42.06309]],
  ]);
  const first = nodeCrossings(nodes);
  assert.equal(first.crossingsSplit, 1, "one T-junction split — not a two-sided split at a minted node");
  const second = nodeCrossings(nodes);
  assert.equal(second.crossingsSplit + second.collinearPairs, 0, "pass two is CLEAN — the staircase generator is dead");
  assert.equal(nodes.size, 4, "the T-junction station IS the existing tip — zero minted nodes");
  assert.equal(nodes.get("19.3782,42.06308").nbrs.size, 3, "the tip carries all three arms of the T");
});

test("a shadow edge (the Vennbahn trap) is split and collapses, walks stay clean", () => {
  // v->(2,0) shadows half of v->(4,0): two edges leave (0,0) at the exact
  // same angle. Untreated, this degenerates the fan and face walks fall into
  // cycles that never return — one such double line cost Germany, Belgium
  // and Luxembourg their faces on the first Europe run.
  const features = [{
    properties: { admin_level: 2 },
    geometry: { type: "MultiLineString", coordinates: [...square(0, 0, 4), [[0, 0], [2, 0]]] },
  }];
  const out = assembleEraBorders(features, [{ name: "Land", center: [2, 2] }]);
  assert.ok(out.report.collinearPairs >= 1, "the shadow is detected");
  assert.equal(out.report.anomalies, 0, "and the walk survives it");
  assert.equal(out.report.politiesNamed, 1);
  assert.ok(Math.abs([...out.byPolity.values()][0].faces[0].area - 16) < 1e-9);
});

test("a label landing in no face is a named diagnosis, not a silence", () => {
  const features = [{
    properties: { admin_level: 2 },
    geometry: { type: "MultiLineString", coordinates: square(0, 0, 2).map((s) => s) },
  }];
  const out = assembleEraBorders(features, [
    { name: "Inside", center: [1, 1] },
    { name: "Nowhere", center: [10, 10] },
  ]);
  assert.equal(out.report.lostLabelCount, 1);
  assert.equal(out.lostLabels[0].name, "Nowhere");
});

console.log("\nThe window frame — cut borders close against the study area");

test("a border crossing the window edge closes against the frame", () => {
  // One horizontal border across the whole window: its cut ends touch the
  // frame, the frame splits there, and the window becomes two faces.
  const features = [{
    properties: { admin_level: 2 },
    geometry: { type: "LineString", coordinates: [[-1, 5], [11, 5]] },
  }];
  const { segments, stats } = normalizeSegments(features, { windowBbox: [0, 0, 10, 10] });
  assert.equal(stats.frameSegments, 6, "two frame edges split at the touch points");
  const { rings, anomalies } = traceFaces(buildGraph(segments));
  assert.equal(anomalies, 0);
  const areas = rings.map((r) => +signedRingArea(r).toFixed(1)).sort((a, b) => a - b);
  assert.deepEqual(areas, [-100, 50, 50]);
});

test("adminLevel is a CEILING: supranational rides in, deeper tiers are excluded by count", () => {
  // The equality filter this replaces silently discarded every level-1 line
  // (1,371 in the 1836 Overpass dump — the German Confederation's ring,
  // whose lowest-parent rule labels long stretches of Prussia's and
  // Austria's outer borders) and voided the 08-11 tile ≤3 experiment (its
  // 1,153 level-3 lines never entered the graph). The fetcher keeps levels
  // 1..max by contract; the assembler now honours the same reading.
  const features = [
    { properties: { admin_level: 1 }, geometry: { type: "LineString", coordinates: [[0, 0], [1, 0]] } },
    { properties: { admin_level: "2" }, geometry: { type: "LineString", coordinates: [[0, 1], [1, 1]] } },
    { properties: { admin_level: 3 }, geometry: { type: "LineString", coordinates: [[0, 2], [1, 2]] } },
    { properties: { admin_level: "x" }, geometry: { type: "LineString", coordinates: [[0, 3], [1, 3]] } },
  ];
  const { segments, stats } = normalizeSegments(features);
  assert.equal(segments.length, 2, "level 1 and level 2 both enter at the default ceiling of 2");
  assert.equal(stats.skippedAdmin, 2, "level 3 and the non-numeric level are counted out, not silent");
  const wider = normalizeSegments(features, { adminLevel: 3 });
  assert.equal(wider.segments.length, 3, "raising the ceiling admits level 3 — the experiment the old filter voided");
});

console.log("\nAssignment — one label names a face; ambiguity stays loud");

test("labels assign, conflict, and resolve same-name versions by latest start", () => {
  const features = [{
    properties: { admin_level: 2 },
    geometry: { type: "MultiLineString", coordinates: [...square(0, 0, 2), ...square(2, 0, 2)].map((s) => s) },
  }];
  const out = assembleEraBorders(features, [
    { name: "West", center: [1, 1], start: 1920 },
    // Newfoundland rule: two live versions of the same polity — latest start wins.
    { name: "East", center: [3, 1], start: 1927 },
    { name: "East", center: [3.2, 1.2], start: 1934 },
  ]);
  assert.equal(out.report.assignedFaces, 2);
  assert.equal(out.report.conflictFaces, 0);
  assert.equal(out.byPolity.get("East").polity.start, 1934);
  // Two DIFFERENT names in one face is a conflict, never a guess.
  const conflicted = assembleEraBorders(features, [
    { name: "West", center: [1, 1] },
    { name: "Rival", center: [1.2, 1.2] },
  ]);
  assert.equal(conflicted.report.conflictFaces, 1);
  assert.deepEqual(conflicted.conflicts[0].names.sort(), ["Rival", "West"]);
});

test("THE SEA GUARD — a mostly-water face refuses its label, resolve or no resolve", () => {
  // Measured 2026-08-12 on the 1836 ceiling run: the 1,602.9 deg² sea face
  // carried Due Sicilie straight past both resolve guards (three labels,
  // 13× depth margin) and the Mediterranean became Naples. Land fraction is
  // the discriminator the other guards cannot see — and it must apply to
  // SINGLE labels too, or a lone leaked center would take the ocean without
  // even passing through resolve. Here: two faces, the west one land, the
  // east one water; same label layout as the assign test.
  const features = [{
    properties: { admin_level: 2 },
    geometry: { type: "MultiLineString", coordinates: [...square(0, 0, 2), ...square(2, 0, 2)].map((s) => s) },
  }];
  const landTest = (pt) => pt[0] < 2; // west square is land, east is open water
  const out = assembleEraBorders(features, [
    { name: "West", center: [1, 1] },
    { name: "Atlantis", center: [3, 1] },
  ], { landTest });
  assert.equal(out.report.assignedFaces, 1, "the land face assigns");
  assert.equal(out.byPolity.has("West"), true);
  assert.equal(out.byPolity.has("Atlantis"), false, "the water face refuses its label");
  assert.equal(out.report.seaRefusals.length, 1);
  assert.equal(out.report.seaRefusals[0].names[0], "Atlantis");
  assert.ok(out.report.seaRefusals[0].landFraction < 0.5, "and says how much water it saw");
  // resolve cannot override the guard: a fused water face with a decisive
  // depth winner still refuses
  const fused = assembleEraBorders(features, [
    { name: "Poseidon", center: [3, 1] },
    { name: "Triton", center: [2.2, 1.8] },
  ], { landTest, resolveConflicts: true });
  assert.equal(fused.report.assignedFaces, 0);
  assert.ok(fused.conflicts.some((c) => c.refusedResolution === "sea"), "refused as sea, not as margin");
});

test("decimation thins a coast but never opens it", () => {
  const dense = [];
  for (let i = 0; i <= 400; i += 1) {
    const angle = ((i % 400) / 400) * 2 * Math.PI; // i=400 wraps to i=0: EXACT closure
    dense.push([Math.cos(angle), Math.sin(angle)]);
  }
  const thin = decimateRing(dense, 0.05);
  assert.ok(thin.length < dense.length / 2);
  assert.deepEqual(thin[0], thin[thin.length - 1], "closure survives");
  assert.ok(Math.abs(signedRingArea(thin)) > Math.abs(signedRingArea(dense)) * 0.9, "area survives decimation");
});

console.log("\nThe real thing — 1939 Baltic, era borders + modern coast (committed fixtures)");

const LINES = JSON.parse(fs.readFileSync(new URL("./fixtures/ohm-1939-z4-europe-lines.geojson", import.meta.url), "utf8"));
const CENTS = JSON.parse(fs.readFileSync(new URL("./fixtures/ohm-1939-z2-world-centroids.geojson", import.meta.url), "utf8"));
const COAST = JSON.parse(fs.readFileSync(new URL("./fixtures/modern-baltic-coast-rings.json", import.meta.url), "utf8"));
const POLITIES = CENTS.features.map((f) => ({
  name: f.properties.name,
  center: f.geometry.coordinates,
  start: resolveWindow(f.properties).start,
}));
const BALTIC = [20, 54, 29, 60];
const baltic = assembleEraBorders(LINES.features, POLITIES, {
  windowBbox: BALTIC,
  coastRings: COAST.rings,
  coastMinRingArea: 0,
});

test("interwar Latvia assembles at its true size from era borders + modern coast", () => {
  const latvia = baltic.byPolity.get("Latvija");
  assert.ok(latvia, "the one valid Baltic label names its face");
  const area = latvia.faces.reduce((sum, f) => sum + f.area, 0);
  // 9.387 deg² measured under the noded pipeline (crossing overshoots now
  // trimmed); Latvia's real ~65k km² at 57°N is ~9.7 deg². A drift beyond
  // ±0.05 means the graph, noding, snap or walk changed behaviour.
  assert.ok(Math.abs(area - 9.387) < 0.05, `Latvija area ${area}`);
});

test("the assembly is anomaly-free, deterministic, and its ledger adds up", () => {
  assert.equal(baltic.report.anomalies, 0);
  assert.equal(baltic.report.conflictFaces, 0);
  assert.equal(
    baltic.report.faces,
    baltic.report.assignedFaces + baltic.report.unassignedFaces + baltic.report.conflictFaces,
    "every face is accounted for exactly once",
  );
  assert.ok(baltic.report.faces >= 340 && baltic.report.faces <= 420, `faces ${baltic.report.faces}`);
  assert.ok(baltic.report.crossingsSplit >= 300 && baltic.report.crossingsSplit <= 450, `noding did its rounds: ${baltic.report.crossingsSplit}`);
  assert.ok(baltic.report.welds >= 2 && baltic.report.weldMax <= SNAP_TOLERANCE);
  assert.ok(baltic.report.edgeJoins >= 2, "borders landed on the modern coast");
  const rerun = assembleEraBorders(LINES.features, POLITIES, { windowBbox: BALTIC, coastRings: COAST.rings, coastMinRingArea: 0 });
  assert.equal(JSON.stringify(rerun.report), JSON.stringify(baltic.report), "same input, same ledger, byte for byte");
});

test("unlabeled 1939 shapes still exist as faces awaiting Overpass names", () => {
  // Kaunas sits in interwar Lithuania — no valid label in the fixture, so the
  // face must be PRESENT and UNASSIGNED (F-3 fallback material, not absence).
  const kaunas = [23.9, 54.9];
  const named = [...baltic.byPolity.values()].some((e) => e.faces.some((f) => pointInFace(kaunas, f)));
  assert.equal(named, false);
  const holder = baltic.unassigned.find((f) => pointInFace(kaunas, f));
  assert.ok(holder, "the Lithuanian face exists");
  assert.ok(holder.area > 5 && holder.area < 20, `Lithuania-ish area ${holder.area}`);
  assert.ok(baltic.report.assignedShare > 0.1 && baltic.report.assignedShare < 0.5, "one label of four+ countries — the share says exactly how partial this window is");
});

test("slivers die at the shared threshold, never silently", () => {
  assert.equal(AREA_EPS, 5e-7, "the extract-regions contract");
  assert.ok(baltic.report.sliversDropped >= 0 && Number.isInteger(baltic.report.sliversDropped));
  assert.ok(baltic.report.prunedEdges > 0, "real OHM gaps exist and are counted");
});

console.log("\nThe CLI wiring — pinned at the source");

const CLI = fs.readFileSync(new URL("../scripts/ohm/assemble-era-borders.mjs", import.meta.url), "utf8");
const FETCH_CLI = fs.readFileSync(new URL("../scripts/ohm/fetch-era-polities.mjs", import.meta.url), "utf8");

test("the assembler fuses parity-dissolved coasts and reports every diagnosis list", () => {
  assert.match(CLI, /dissolveByParity/, "edge parity, not boolean union — the union's graceful failures poisoned the graph");
  assert.match(CLI, /coastRings,\n/, "coast rings enter assembleEraBorders — not a post-clip");
  assert.match(CLI, /politiesWithoutFaces/, "rung 2-3 fallback candidates are a named list");
  assert.match(CLI, /lostLabelsInWindow/, "labels that landed nowhere are a named list too");
  assert.match(CLI, /경계선 관계/, "border relations posing as polities are filtered out loud");
  assert.match(CLI, /applyCenterOverrides/, "bbox centers lie; hand-pinned interior points correct them");
  assert.match(CLI, /내륙국만 닫힌다/, "running coast-less warns what it means");
  assert.match(CLI, /path\.dirname\(path\.resolve\(linesPath\)\)/,
    "no --out means next to the input — the 08-11 Overpass assembly overwrote the tile baseline in out/ because the default was one fixed directory for every transport");
  assert.doesNotMatch(CLI, /out: path\.join\("scripts", "ohm", "out"\)/,
    "the fixed default is gone, not merely shadowed");
});

test("the polity fetcher filters locally with end-aware windows, one polite query", () => {
  assert.match(FETCH_CLI, /overpass-api\.openhistoricalmap\.org/);
  assert.match(FETCH_CLI, /out tags center/);
  assert.match(FETCH_CLI, /decdateWindow\(window\.start, window\.end, targetDec\)/, "date filter is OURS, not Overpass string compare");
  assert.match(FETCH_CLI, /name:ko/, "Korean names ride along when OHM has them");
  assert.match(FETCH_CLI, /USER_AGENT/);
});

console.log(`\n${pass} passed\n`);

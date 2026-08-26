// A SHARED BORDER MUST BE SIMPLIFIED ONCE, NOT TWICE.
//
// The white wedges the player saw inland were not in the data — the seed, a
// grafted board and a modern board have byte-identical coverage masks over
// 451,800 samples. They are made at draw time: MapLibre's GeoJSON source runs
// Douglas-Peucker per FEATURE, so two neighbours keep different subsets of the
// border they share and the sliver between the two versions shows through.
//
// scripts/presets/lib/simplifyTopology.mjs removes the runtime's need to
// simplify at all: it cuts each ring into arcs at the points where "is this
// edge shared" flips, simplifies each arc once, and hands both neighbours the
// SAME result. Then the far lane can draw at tolerance 0, which is the only
// setting that cannot re-split a border.
//
// This pins the property that makes that true — identical shared output — plus
// the two limits that are decisions rather than accidents.
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import url from "node:url";
import { simplifyTopology } from "../scripts/presets/lib/simplifyTopology.mjs";

let pass = 0;
const test = (name, fn) => { fn(); pass += 1; console.log(`  ok  ${name}`); };
const ROOT = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), "..");

console.log("\nTwo regions sharing a border must simplify it to the same line");

// A shared vertical border at x=1 with a deliberate wiggle, drawn by BOTH
// neighbours from the same vertices — which is what the seed guarantees for a
// paired edge. Douglas-Peucker run per feature would be free to keep different
// wiggle points on each side; run per arc it cannot.
const wiggle = [[1, 0], [1.004, 0.25], [0.996, 0.5], [1.004, 0.75], [1, 1]];
const west = {
  type: "Feature",
  properties: { id: "A", gid0: "AAA", owner: "X" },
  geometry: { type: "Polygon", coordinates: [[[0, 0], ...wiggle, [0, 1], [0, 0]]] },
};
const east = {
  type: "Feature",
  properties: { id: "B", gid0: "BBB", owner: "Y" },
  geometry: { type: "Polygon", coordinates: [[[2, 0], [2, 1], ...[...wiggle].reverse(), [2, 0]]] },
};

const borderOf = (feature) => feature.geometry.coordinates[0]
  .filter(([x]) => x > 0.9 && x < 1.9)
  .map(([x, y]) => `${x},${y}`);

test("the shared arc comes out identical on both sides, wiggle and all", () => {
  const { features } = simplifyTopology([west, east], { eps: 0.01 });
  const a = borderOf(features[0]);
  const b = borderOf(features[1]).reverse();
  assert.deepEqual(a, b, "the two neighbours must describe the shared border with the SAME vertices");
  // And it really was simplified — 0.01 swallows a 0.004 wiggle.
  assert.ok(a.length < wiggle.length, `the arc should lose its sub-epsilon detail (kept ${a.length} of ${wiggle.length})`);
});

test("a sub-epsilon wiggle survives when epsilon is smaller than it", () => {
  // The pass must not be a fixed decimation: below its own epsilon it keeps
  // everything, which is what lets the build choose resolution by measurement.
  const { features } = simplifyTopology([west, east], { eps: 0.0001 });
  assert.equal(borderOf(features[0]).length, wiggle.length);
});

test("a sea region is passed through untouched — it is an overlay, not land", () => {
  const sea = {
    type: "Feature",
    properties: { id: "S", kind: "sea", owner: "OCEAN" },
    geometry: { type: "Polygon", coordinates: [[[5, 5], [5.004, 5.25], [6, 6], [5, 6], [5, 5]]] },
  };
  const { features } = simplifyTopology([sea], { eps: 1 });
  assert.deepEqual(features[0].geometry.coordinates, sea.geometry.coordinates);
});

test("a ring that would collapse below a triangle keeps its original shape, counted", () => {
  // 침묵 캡 금지: an islet smaller than epsilon is not silently deleted, it is
  // kept whole and the count is reported.
  const islet = {
    type: "Feature",
    properties: { id: "I", gid0: "AAA", owner: "X" },
    geometry: { type: "Polygon", coordinates: [[[0, 0], [0.001, 0], [0.001, 0.001], [0, 0.001], [0, 0]]] },
  };
  const { features, stats } = simplifyTopology([islet], { eps: 1 });
  assert.deepEqual(features[0].geometry.coordinates, islet.geometry.coordinates);
  assert.equal(stats.ringsFloored, 1, "the floor must be counted, not silent");
});

console.log("\nSimplification must not make a polygon lie about itself");

const inRing = (pt, ring) => {
  const [x, y] = pt;
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i, i += 1) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
};

test("an escaped hole is repaired by restoring the arcs, and the repair is counted", () => {
  // ㄴ-6 (2026-08-25), the 경북 double-coat mechanism in miniature: the shell
  // has a bump (deviation 0.05 < eps 0.1) holding a hole. Simplification
  // flattens the bump, the hole lands OUTSIDE the shell, and tessellation would
  // paint shell + escaped hole — one feature, two coats. The repair must put
  // the ORIGINAL arcs back rather than patch the feature: the 대구 hole is the
  // enclave's shell on the neighbour, and only arc-level restoration keeps the
  // two identical.
  const bumped = {
    type: "Feature",
    properties: { id: "K", gid0: "KOR", owner: "조선" },
    geometry: {
      type: "Polygon",
      coordinates: [
        [[0, 0], [1, 0], [1, 1], [0.6, 1], [0.55, 1.05], [0.5, 1], [0, 1], [0, 0]],
        [[0.54, 1.01], [0.56, 1.01], [0.56, 1.03], [0.54, 1.03], [0.54, 1.01]],
      ],
    },
  };
  const { features, stats } = simplifyTopology([bumped], { eps: 0.1 });
  const [shell, hole] = features[0].geometry.coordinates;
  assert.ok(hole.every((pt) => inRing(pt, shell) || shell.some(([sx, sy]) => sx === pt[0] && sy === pt[1])),
    "after repair every hole vertex must be back inside its shell");
  assert.equal(stats.repair.escapedHoles, 1, "the defect must be counted, not silently cured");
  assert.equal(stats.repair.featuresRepaired, 1);
  assert.equal(stats.repair.residualInvalid, 0, "the loop must actually converge");
});

test("a feature that was invalid in the SOURCE is left alone and counted", () => {
  // The exact lane draws the original as-is either way — "repairing" it would
  // silently change data we did not damage. Bowtie in, bowtie out, counted.
  const bowtie = {
    type: "Feature",
    properties: { id: "X", gid0: "XXX", owner: "X" },
    geometry: { type: "Polygon", coordinates: [[[0, 0], [1, 1], [1, 0], [0, 1], [0, 0]]] },
  };
  const { features, stats } = simplifyTopology([bowtie], { eps: 0.0001 });
  assert.deepEqual(features[0].geometry.coordinates, bowtie.geometry.coordinates);
  assert.equal(stats.repair.sourceInvalid, 1, "not our damage — but never a silent pass");
  assert.equal(stats.repair.arcsRestored, 0, "no arcs spent on a defect we did not make");
});

console.log("\nThe far border line IS the fill edge — same arc, zero divergence");

test("an owner-differing shared arc comes back as a frontier line with the fill's own vertices", () => {
  // ㄴ-8 (2026-08-25), the 벨기에 z7 jag: the precise border line jittered AND
  // strayed off the simplified fill edge because they were different geometry.
  // The frontier line must be the very arc the two fills ship — compare the
  // vertices, not the idea.
  const { features, frontier } = simplifyTopology([west, east], { eps: 0.01 });
  assert.equal(frontier.length, 1, "one shared border between two owners → one frontier line");
  assert.equal(frontier[0].properties.kind, "frontier", "styled exactly like the precise file's frontier");
  const line = frontier[0].geometry.coordinates.map(([x, y]) => `${x},${y}`);
  const a = borderOf(features[0]);
  const lineOriented = line[0] === a[0] ? line : [...line].reverse();
  assert.deepEqual(lineOriented, a, "the line must carry the fill edge's OWN vertices");
});

test("a border between two regions of the SAME owner draws no frontier", () => {
  const twin = {
    ...east,
    properties: { ...east.properties, owner: "X" },
  };
  const { frontier } = simplifyTopology([west, twin], { eps: 0.01 });
  assert.equal(frontier.length, 0, "internal same-owner edges are not frontiers");
});

test("the builder ships borders-far from the same pass, coast riding verbatim", () => {
  const src = fs.readFileSync(path.join(ROOT, "scripts", "presets", "build-preset.mjs"), "utf8");
  assert.match(src, /farFrontier = simplified\.frontier/,
    "the frontier must come from the simplify pass, never a second simplifier");
  assert.match(src, /kind === "coast"/,
    "the coast is copied from the precise borders file — already eps-0.02 calm, identical for the crossfade");
  assert.match(src, /borders-far\.geojson/, "and the far border file is a separate artifact");
});

console.log("\nThe far lane gets its own file, and the exact one stays exact");

test("the builder writes regions-far.geojson and leaves regions.geojson alone", () => {
  const src = fs.readFileSync(path.join(ROOT, "scripts", "presets", "build-preset.mjs"), "utf8");
  assert.match(src, /regions-far\.geojson/, "the simplified copy must be a separate artifact");
  // Simplifying in place broke two things at once, measured on 2026-08-20:
  // borders.geojson matches segments against the SEED's keys and simplification
  // deletes the vertices those keys are made of (clip-seam drops 2,631 →
  // 157,393), and the 1,462 tiled:false regions are drawn from this file at
  // EVERY zoom, where 1.1km of error reads as facets.
  const at = src.indexOf('path.join(scenarioDir, "regions.geojson")');
  assert.notEqual(at, -1);
  const write = src.slice(at - 200, at + 200);
  assert.match(write, /features: regionFeaturesFinal/,
    "regions.geojson must ship the exact geometry — borders and the authored lane both read it");
  assert.ok(!/regionFeaturesFinal = simplifyTopology|regionFeaturesFinal = simplified/.test(src),
    "the pass must never overwrite the exact features in place");
});

test("the far file ships only what the far lane draws, filtered AFTER simplification", () => {
  // ㄴ-5 (2026-08-24): the far layers filter on STOCK_GEOMETRY_FILTER, so the
  // ~1,600 authored/tiled:false features per board were parsed and indexed but
  // never drawn — a third of the file. Order matters and is the real invariant:
  // simplifyTopology decides "is this edge shared" from the FULL feature set,
  // and filtering first would reclassify borders against dropped neighbours as
  // lone arcs. Both writers carry the same rule.
  for (const rel of ["scripts/presets/build-preset.mjs", "scripts/build-default-map.mjs"]) {
    const src = fs.readFileSync(path.join(ROOT, ...rel.split("/")), "utf8");
    assert.match(src, /const farDrawable = \(feature\)/, `${rel}: the drawable filter must exist`);
    assert.match(src, /simplified\.features\.filter\(farDrawable\)/,
      `${rel}: the filter must run on the SIMPLIFIED output, never before the pass`);
    assert.match(src, /features: farFeatures/, `${rel}: the far file must ship the filtered set`);
  }
});

console.log(`\n${pass} passed\n`);

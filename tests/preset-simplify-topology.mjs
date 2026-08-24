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

console.log(`\n${pass} passed\n`);

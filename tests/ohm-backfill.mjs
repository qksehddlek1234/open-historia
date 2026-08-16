/*! Open Historia — rung 3 fills only what rung 1 never reached © 2026 Nicholas Krol, MIT (see src/Editor/LICENSE). */
// THE MEDIEVAL HYBRID'S TWO CONTRACTS, PINNED.
//
// backfill-era-faces adds crude world polygons UNDER the assembly's faces,
// and graftEraGeometry lets rung 1 win whole regions. Both halves have a
// quiet failure mode this suite exists to keep loud:
//
//   • the backfill could double-cover the map (a world polygon added on top
//     of a closed assembly face) — coverage sampling must skip it, and the
//     skip must carry the measured number
//   • the graft could clip one region against both rungs and double-count
//     its area in the per-owner fold — the region-level precedence rule must
//     make that impossible by construction
//   • and every legacy dump (no rung property anywhere) must behave exactly
//     as before the hybrid existed
import assert from "node:assert/strict";
import path from "node:path";
import url from "node:url";

const ROOT = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), "..");

let pass = 0;
const test = (name, fn) => {
  try {
    fn();
    pass += 1;
    console.log(`  ok  ${name}`);
  } catch (error) {
    console.error(`  FAIL  ${name}\n`, error);
    process.exitCode = 1;
  }
};

const { backfillEraFaces, coverageInside, decimateMp, pointInMp } = await import(
  url.pathToFileURL(path.join(ROOT, "scripts", "ohm", "backfill-era-faces.mjs")).href
);
const { graftEraGeometry, multiPolygonArea } = await import(
  url.pathToFileURL(path.join(ROOT, "scripts", "presets", "lib", "eraGeometry.mjs")).href
);

console.log("\nThe medieval hybrid (rung 2+3)");

// Shared fixtures. The fleet window's frame is [-22.5, 21.94, 67.5, 74.02]
// (pinned in era-overpass); every shape below lives well inside it.
const WINDOW = [-15, 30, 50, 72];
const box = (w, s, e, n) => [[[w, s], [e, s], [e, n], [w, n], [w, s]]];
const feat = (name, ring, extra = {}) => ({
  type: "Feature",
  geometry: { type: "Polygon", coordinates: ring },
  properties: { NAME: name, ...extra },
});
const rung1Fc = { type: "FeatureCollection", features: [
  { type: "Feature", geometry: { type: "Polygon", coordinates: box(10, 45, 20, 55) }, properties: { name: "Assembled Realm" } },
] };

test("A WORLD POLYGON RUNG 1 ALREADY COVERS IS SKIPPED, WITH THE MEASURED NUMBER", () => {
  // Sits entirely inside the assembled face: coverage ~1.0, far over the bar.
  const world = { type: "FeatureCollection", features: [feat("Duplicatia", box(12, 47, 18, 53))] };
  const { added, skipped } = backfillEraFaces(rung1Fc, world, { window: WINDOW, zoom: 4 });
  assert.equal(added.length, 0);
  assert.equal(skipped.length, 1);
  assert.match(skipped[0].why, /rung-1이 이미 담당/);
  assert.match(skipped[0].why, /커버 (9[0-9]|100)%/, "the skip carries the measured coverage, not a bare verdict");
});

test("AN UNCOVERED POLYGON IS ADDED WITH rung: 3 AND ITS NAME", () => {
  const world = { type: "FeatureCollection", features: [feat("Terra Nova", box(30, 45, 40, 55))] };
  const { added, skipped } = backfillEraFaces(rung1Fc, world, { window: WINDOW, zoom: 4 });
  assert.equal(skipped.length, 0);
  assert.equal(added.length, 1);
  assert.equal(added[0].properties.rung, 3);
  assert.equal(added[0].properties.name, "Terra Nova");
  assert.equal(added[0].properties.source, "historical-basemaps");
  assert.ok(added[0].properties.rung1Coverage < 0.5, "and it records how uncovered it was");
});

test("THE 0.9 BAR ADDS THE HALF-COVERED — a 57%-covered HRE must not be skipped", () => {
  // Overlaps the assembled face for ~77% of its area: over the old 0.5 draft
  // bar, under the calibrated 0.9. Real covers measured 93–100% (2026-08-14);
  // partial faces leave their crude twin at 57–85%, and that gap IS the
  // hybrid's cargo. Over-adding is safe: region-level rung-1 precedence.
  const world = { type: "FeatureCollection", features: [feat("Halbdeckland", box(10, 45, 20, 58))] };
  const { added, skipped } = backfillEraFaces(rung1Fc, world, { window: WINDOW, zoom: 4 });
  assert.equal(skipped.length, 0);
  assert.equal(added.length, 1);
  assert.ok(added[0].properties.rung1Coverage >= 0.5 && added[0].properties.rung1Coverage < 0.9,
    "the fixture sits between the bars — added under 0.9, would have been lost at 0.5");
});

test("AN EXCLUDED FACE IS NO COVER — its world twin backfills, itself passes through", () => {
  // The fused-Portugal case: the spec will excludeFaces the rung-1 face, so
  // the graft drops it at load — if it still counted as cover here, the world
  // twin would be skipped and the excluded region would build as a hole.
  const world = { type: "FeatureCollection", features: [feat("Duplicatia", box(12, 47, 18, 53))] };
  const { added, skipped, excludeUnmatched } = backfillEraFaces(rung1Fc, world,
    { window: WINDOW, zoom: 4, exclude: ["Assembled Realm", "Typoland"] });
  assert.equal(skipped.length, 0);
  assert.equal(added.length, 1, "fully under the excluded face, yet added");
  assert.equal(added[0].properties.rung1Coverage, 0);
  assert.deepEqual(excludeUnmatched, ["Typoland"], "an exclude name matching no face is surfaced, never a silent no-op");
});

test("THE FRAME CLIPS: outside is skipped as such, straddling is cut to the frame", () => {
  const world = { type: "FeatureCollection", features: [
    feat("Atlantis", box(-40, 40, -30, 50)),      // 서쪽 프레임(-22.5) 밖
    feat("Straddler", box(60, 40, 80, 50)),       // 동쪽 프레임(67.5)에 걸침
  ] };
  const { added, skipped } = backfillEraFaces(rung1Fc, world, { window: WINDOW, zoom: 4 });
  assert.equal(skipped.length, 1);
  assert.equal(skipped[0].name, "Atlantis");
  assert.match(skipped[0].why, /창 밖/);
  assert.equal(added.length, 1);
  const xs = added[0].geometry.coordinates.flat(2).filter((_, i) => i % 2 === 0);
  assert.ok(Math.max(...xs) <= 67.5 + 1e-9, "the straddler ends at the frame edge, not at its own");
});

test("nameless and non-area world rows are counted, never silently absent", () => {
  const world = { type: "FeatureCollection", features: [
    { type: "Feature", geometry: { type: "Polygon", coordinates: box(30, 45, 32, 47) }, properties: {} },
    { type: "Feature", geometry: { type: "Point", coordinates: [30, 45] }, properties: { NAME: "Pointland" } },
  ] };
  const { added, skipped } = backfillEraFaces(rung1Fc, world, { window: WINDOW, zoom: 4 });
  assert.equal(added.length, 0);
  assert.equal(skipped.length, 2);
  assert.deepEqual(skipped.map((s) => s.why).sort(), ["면 아닌 지오메트리", "이름 없음"]);
});

test("decimation drops micro fragments and the pass says why", () => {
  // 0.002° wide — under the 0.01° decimation, collapses to nothing.
  const world = { type: "FeatureCollection", features: [feat("Slivertia", box(30, 45, 30.002, 45.002))] };
  const { added, skipped } = backfillEraFaces(rung1Fc, world, { window: WINDOW, zoom: 4 });
  assert.equal(added.length, 0);
  assert.equal(skipped.length, 1);
  assert.match(skipped[0].why, /데시메이션 후 잔여 없음/);
});

// ── the graft's precedence rule ─────────────────────────────────────────────

const region = (id, ring, owner = "Modernia") => ({
  type: "Feature",
  geometry: { type: "Polygon", coordinates: ring },
  properties: { id, owner, gid0: "MOD", name: id, typeId: "land" },
});
const graftFace = (owner, ring, rung) => ({
  owner,
  name: owner,
  via: "exact",
  rung,
  mergedWith: [],
  keepOut: [],
  mp: [ring],
  bbox: [ring[0][0][0], ring[0][0][1], ring[0][2][0], ring[0][2][1]],
});

// The rule these three pin was rewritten on 2026-08-16. It used to be: a region
// any rung-1 face TOUCHED belonged to rung 1 entirely, and every rung-3
// candidate for it was dropped. That was the largest single cause of low era
// coverage — on wwii-1935 it threw rung 3 out of 589 regions, and the land the
// 38 rung-1 faces did not actually cover stayed a modern province edge. Now
// rung 1 takes what it covers and rung 3 is offered what is left, which is the
// same precedence measured in area instead of in whole regions.

test("RUNG 1 TAKES WHAT IT COVERS AND RUNG 3 GETS THE REST — no double cover", () => {
  // The region is 10..20. Realm (rung 1) covers 14..20 of it, Crudia (rung 3)
  // wants 10..16. Under the old rule Crudia was dropped and 10..14 stayed
  // Modernia; now the overlap goes to rung 1 and Crudia takes 10..14 only.
  const regions = [region("MOD.1_1", box(10, 45, 20, 55))];
  const faces = [
    graftFace("Realm", box(14, 44, 21, 56), 1),
    graftFace("Crudia", box(9, 44, 16, 56), 3),
  ];
  const { features, report } = graftEraGeometry(regions, faces);
  assert.equal(report.rung3AfterRung1, 1, "both rungs cut this region — the point of the change");
  assert.equal(report.rung3Regions, 0);
  assert.equal(report.rung3Covered, 0);
  const owners = features.map((f) => f.properties.owner).sort();
  assert.deepEqual(owners, ["Crudia", "Realm"], "and Modernia keeps nothing — the whole region is claimed");
  // NO DOUBLE COVER, stated as area rather than as trust. The pieces must sum
  // to the region, not to more than it: the overlap 14..16 belongs to Realm
  // alone, so Crudia's share is 4/10 of the width, not 6/10.
  const areaOf = (f) => multiPolygonArea(f.geometry.type === "Polygon"
    ? [f.geometry.coordinates] : f.geometry.coordinates);
  const total = features.reduce((sum, f) => sum + areaOf(f), 0);
  const whole = multiPolygonArea([box(10, 45, 20, 55)]);
  assert.ok(Math.abs(total - whole) / whole < 1e-9, `pieces sum to ${total}, region is ${whole}`);
  const crudia = features.find((f) => f.properties.owner === "Crudia");
  assert.ok(Math.abs(areaOf(crudia) / whole - 0.4) < 1e-9, "Crudia gets 10..14, not 10..16");
});

test("…and where rung 1 covers everything, rung 3 gets nothing — the old outcome", () => {
  // The case the old rule was right about, now reached by measurement rather
  // than by assumption, and counted separately so the two can be told apart.
  const regions = [region("MOD.4_1", box(10, 45, 20, 55))];
  const faces = [
    graftFace("Realm", box(9, 44, 21, 56), 1),
    graftFace("Crudia", box(9, 44, 16, 56), 3),
  ];
  const { features, report } = graftEraGeometry(regions, faces);
  assert.equal(report.rung3Covered, 1);
  assert.equal(report.rung3AfterRung1, 0);
  assert.ok(!features.some((f) => f.properties.owner === "Crudia"),
    "there is no room, so the backfill owner appears nowhere");
});

test("A REGION ONLY RUNG 3 REACHES IS CUT BY IT, and counted as such", () => {
  const regions = [region("MOD.2_1", box(30, 45, 40, 55))];
  const faces = [
    graftFace("Realm", box(10, 45, 20, 55), 1), // 멀리 있음 — bbox 비중첩
    graftFace("Crudia", box(29, 44, 36, 56), 3),
  ];
  const { features, report } = graftEraGeometry(regions, faces);
  assert.equal(report.rung3Regions, 1);
  assert.equal(report.rung3AfterRung1, 0, "no rung-1 face reaches here, so nothing was left over");
  assert.ok(features.some((f) => f.properties.owner === "Crudia"), "rung 3 owns its cut");
});

test("LEGACY FACES CARRY NO RUNG AND NOTHING CHANGES — absent means rung 1", () => {
  // The path this pin guards is now literal: with no rung-3 candidate the
  // remainder is never computed and not one line of the new branch runs.
  const regions = [region("MOD.3_1", box(10, 45, 20, 55))];
  const legacy = graftFace("Realm", box(9, 44, 21, 56), undefined);
  delete legacy.rung;
  const { report } = graftEraGeometry(regions, [legacy]);
  assert.equal(report.rung3Regions, 0);
  assert.equal(report.rung3AfterRung1, 0);
  assert.equal(report.rung3Covered, 0);
  assert.equal(report.confirmed + report.reowned.length, 1, "the legacy face still grafts as before");
});

// ── the sampler itself ──────────────────────────────────────────────────────

test("the coverage sampler is deterministic and sane at both ends", () => {
  const mp = [box(0, 0, 10, 10)];
  const full = coverageInside(mp, [[box(-1, -1, 11, 11)]]);
  const none = coverageInside(mp, [[box(50, 50, 60, 60)]]);
  assert.equal(full.coverage, 1);
  assert.equal(none.coverage, 0);
  const again = coverageInside(mp, [[box(-1, -1, 11, 11)]]);
  assert.equal(full.samples, again.samples, "same lattice every run — resume-safe, no Math.random");
});

test("decimateMp keeps real rings and pointInMp honours holes", () => {
  const withHole = [[box(0, 0, 10, 10)[0], box(4, 4, 6, 6)[0]]];
  const dec = decimateMp(withHole, 0.01);
  assert.equal(dec[0].length, 2, "the hole survives decimation");
  assert.equal(pointInMp([5, 5], dec), false, "inside the hole is outside the face");
  assert.equal(pointInMp([2, 2], dec), true);
});

console.log(`\n${pass} passed\n`);

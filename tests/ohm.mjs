// Plan F, stage F-1 — the OHM era-border extractor, verified entirely offline.
// The fetching half runs on the player's PC (the cloud session may not fetch);
// everything that decides WHAT comes out of a tile — date math, the validity
// window, tile geometry, the filter, the emitted shape — is pure and lives in
// scripts/ohm/lib/eraBorders.mjs, so it is tested here with synthetic
// features, no network, byte-deterministic.
import assert from "node:assert/strict";
import fs from "node:fs";
import {
  DEC_EPS,
  WEB_MERCATOR_MAX_LAT,
  bboxToTileRange,
  clipPartToBbox,
  daysInMonth,
  decdateWindow,
  eraCollection,
  eraFeature,
  featureFilter,
  isLeapYear,
  isoToDecdate,
  isoToDecdateEnd,
  lngLatToTile,
  pickProps,
  resolveWindow,
  roundCoords,
  tilePointToLngLat,
  tileToBbox,
} from "../scripts/ohm/lib/eraBorders.mjs";

let pass = 0;
const test = (name, fn) => { fn(); pass += 1; console.log(`  ok  ${name}`); };

console.log("\nDecimal dates — the encoding OHM's own tiler and renderer share");

test("a date is its year plus the fraction of the year already gone", () => {
  assert.equal(isoToDecdate("1939-01-01"), 1939);
  // Sep 1 is day 244 of a common year: 243 full days elapsed at midnight.
  assert.equal(isoToDecdate("1939-09-01"), 1939 + 243 / 365);
  assert.equal(isoToDecdate("2016-10-27"), 2016 + 300 / 366, "2016 is a leap year");
});

test("leap rules are proleptic Gregorian, centuries included", () => {
  assert.equal(isLeapYear(1940), true);
  assert.equal(isLeapYear(1900), false, "century, not divisible by 400");
  assert.equal(isLeapYear(2000), true);
  assert.equal(isLeapYear(0), true, "ISO year 0 (1 BCE) is astronomical and leap");
  assert.equal(daysInMonth(1940, 2), 29);
  assert.equal(daysInMonth(1900, 2), 28);
  assert.equal(isoToDecdate("1940-02-29"), 1940 + 59 / 366);
  assert.equal(isoToDecdate("1940-12-31"), 1940 + 365 / 366);
  // The same calendar day sits at a different fraction across the century rule.
  assert.equal(isoToDecdate("1900-03-01"), 1900 + 59 / 365);
  assert.equal(isoToDecdate("2000-03-01"), 2000 + 60 / 366);
});

test("underspecified and BCE dates resolve like the app resolves them", () => {
  // Year-only and year-month mean their earliest moment.
  assert.equal(isoToDecdate("1444"), 1444);
  assert.equal(isoToDecdate("1444-02"), 1444 + 31 / 366, "1444 is leap");
  // OHM writes BCE as ISO negative years; -44 is leap in astronomical numbering.
  assert.equal(isoToDecdate("-0044-03-15"), -44 + 74 / 366);
  // Garbage is null, never NaN. resolveWindow treats null as an open side, so
  // an unparseable tag reads as "no constraint" — dropping instead would erase
  // a real border over a typo in one date tag. Documented choice.
  assert.equal(isoToDecdate(""), null);
  assert.equal(isoToDecdate("soon"), null);
  assert.equal(isoToDecdate("1939-13-01"), null, "month 13 is not a date");
  assert.equal(isoToDecdate("1939-02-30"), null, "Feb 30 is not a date");
});

console.log("\nThe validity window — start <= D < end, open sides, end exclusive");

test("open sides mean 'as old as the map' and 'still there'", () => {
  assert.equal(decdateWindow(null, null, 1939.67), true);
  assert.equal(decdateWindow(1918.87, null, 1939.67), true);
  assert.equal(decdateWindow(1946.0, null, 1939.67), false, "not yet born");
  assert.equal(decdateWindow(null, 1945.34, 1939.67), true);
});

test("a polity whose end date is the target date is already gone", () => {
  assert.equal(decdateWindow(null, 1939.67, 1939.67), false);
  // Float wobble in the last ulp never flips a border in or out.
  assert.equal(decdateWindow(1939.67 + DEC_EPS / 2, null, 1939.67), true);
  assert.equal(decdateWindow(null, 1939.67 + DEC_EPS / 2, 1939.67), false);
});

test("resolveWindow prefers the tiler's numeric decdates, falls back to ISO", () => {
  assert.deepEqual(
    resolveWindow({ start_decdate: 1918.874, end_decdate: "1939.669" }),
    { start: 1918.874, end: 1939.669 },
    "numeric strings from tile properties parse",
  );
  assert.deepEqual(
    resolveWindow({ start_date: "1918-11-11" }),
    { start: 1918 + 314 / 365, end: null },
  );
  assert.deepEqual(resolveWindow({}), { start: null, end: null });
});

test("an END date means the end of its period — the tiler's own reading", () => {
  // Verified on live data: 中國's end_date "1945" ships as end_decdate
  // 1945.99863 (Dec 31), so a year-only end must NOT kill the polity a year
  // early. Point-resolution would have erased wartime China from mid-1945.
  assert.equal(isoToDecdateEnd("1945"), 1946);
  assert.equal(isoToDecdateEnd("1944-02"), 1944 + 60 / 366, "gone from March 1st of a leap year");
  assert.equal(isoToDecdateEnd("1944-12"), 1945);
  assert.equal(isoToDecdateEnd("1939-10-26"), isoToDecdate("1939-10-26"), "a full date stays a point — exclusivity handles the day");
  assert.equal(isoToDecdateEnd("gone"), null);
  // The window built from ISO-only tags keeps China alive in June 1945...
  const window = resolveWindow({ start_date: "1935", end_date: "1945" });
  assert.equal(decdateWindow(window.start, window.end, isoToDecdate("1945-06-01")), true);
  // ...and gone on New Year 1946 — matching the tiler's 1945.99863 verdicts.
  assert.equal(decdateWindow(window.start, window.end, isoToDecdate("1946-01-01")), false);
});

console.log("\nTile math — the z0 helper from time.jsx, generalised to any tile");

test("known anchors project exactly", () => {
  assert.deepEqual(tilePointToLngLat(2048, 2048), [0, 0], "z0 tile centre is null island");
  const [lngNW, latNW] = tilePointToLngLat(0, 0);
  assert.equal(lngNW, -180);
  assert.ok(Math.abs(latNW - WEB_MERCATOR_MAX_LAT) < 1e-6, "z0 corner is the Mercator ceiling");
  // z1 tile (1,0), bottom-left corner: the world's centre again.
  const [lng10, lat10] = tilePointToLngLat(0, 4096, { z: 1, tx: 1, ty: 0 });
  assert.equal(lng10, 0);
  assert.ok(Math.abs(lat10) < 1e-12);
  // z2 tile (3,1) NW corner: lng 90, lat atan(sinh(π/2)) — the 66.51° line
  // every slippy map shares.
  const [lng31, lat31] = tilePointToLngLat(0, 0, { z: 2, tx: 3, ty: 1 });
  assert.equal(lng31, 90);
  assert.ok(Math.abs(lat31 - 66.51326) < 1e-4);
});

test("lngLatToTile lands the game's own theatre on the right tile", () => {
  assert.deepEqual(lngLatToTile(126.98, 37.57, 2), [3, 1], "Seoul, z2");
  assert.deepEqual(lngLatToTile(180, 0, 1), [1, 1], "the antimeridian pins inside the grid");
  assert.deepEqual(lngLatToTile(0, 90, 2), [2, 0], "poles clamp to the Mercator ceiling");
});

test("bbox -> tile range: the world, one peninsula, and two refusals", () => {
  assert.deepEqual(bboxToTileRange([-180, -85, 180, 85], 1), { xMin: 0, xMax: 1, yMin: 0, yMax: 1, count: 4 });
  // Korea at z2 is a single tile — the cheapest real probe a user can run.
  assert.deepEqual(bboxToTileRange([124, 33, 131, 39], 2), { xMin: 3, xMax: 3, yMin: 1, yMax: 1, count: 1 });
  assert.throws(() => bboxToTileRange([170, 30, -170, 60], 2), /날짜변경선/, "antimeridian crossings are refused loudly, not half-handled");
  assert.throws(() => bboxToTileRange([0, 50, 10, 40], 2), /남쪽이 북쪽보다/);
});

test("tileToBbox inverts the tile math — the clip stage's ruler", () => {
  const [w, s, e, n] = tileToBbox(2, 3, 1);
  assert.equal(w, 90);
  assert.equal(e, 180);
  assert.ok(Math.abs(n - 66.51326) < 1e-4);
  assert.ok(Math.abs(s) < 1e-9, "row 1 of z2 ends at the equator");
  // The tile contains what lngLatToTile says it should.
  assert.deepEqual(lngLatToTile(126.98, 37.57, 2), [3, 1]);
});

test("clipPartToBbox cuts at the boundary, splits re-entries, drops the outside", () => {
  const box = [0, 0, 10, 10];
  // Straight crossing: both cut ends sit exactly on the edges.
  assert.deepEqual(clipPartToBbox([[-5, 5], [15, 5]], box), [[[0, 5], [10, 5]]]);
  // Exits and re-enters: two separate pieces.
  const zigzag = clipPartToBbox([[2, 2], [2, 12], [8, 12], [8, 2]], box);
  assert.equal(zigzag.length, 2);
  assert.deepEqual(zigzag[0], [[2, 2], [2, 10]]);
  assert.deepEqual(zigzag[1], [[8, 10], [8, 2]]);
  // Entirely outside: nothing, not a degenerate stub.
  assert.deepEqual(clipPartToBbox([[20, 20], [30, 30]], box), []);
  // Entirely inside: untouched.
  assert.deepEqual(clipPartToBbox([[1, 1], [2, 2]], box), [[[1, 1], [2, 2]]]);
});

console.log("\nThe filter — every drop carries a reason the CLI can tally");

const D_1939_09_01 = isoToDecdate("1939-09-01");

test("a national border alive on the date passes", () => {
  const verdict = featureFilter(
    { admin_level: 2, start_decdate: 1918.874, end_decdate: 1939.669 },
    D_1939_09_01,
  );
  assert.equal(verdict.keep, true, "interwar Poland's frontier still stands on Sep 1");
});

test("the same border is gone a month later, and the reason says when it lived", () => {
  const verdict = featureFilter(
    { admin_level: 2, start_decdate: 1918.874, end_decdate: 1939.669 },
    isoToDecdate("1939-10-01"),
  );
  assert.equal(verdict.keep, false);
  assert.match(verdict.why, /날짜 창 밖 \(1918\.87–1939\.67\)/);
});

test("admin_level gates granularity — and opens for F-5", () => {
  const province = { admin_level: "4", start_decdate: 1900 };
  assert.equal(featureFilter(province, D_1939_09_01).keep, false);
  assert.match(featureFilter(province, D_1939_09_01).why, /admin_level 4 > 2/);
  assert.equal(featureFilter(province, D_1939_09_01, { maxAdminLevel: 4 }).keep, true);
  assert.match(featureFilter({}, D_1939_09_01).why, /admin_level 없음/);
  assert.match(featureFilter({ admin_level: "n/a" }, D_1939_09_01).why, /비수치/);
});

test("maritime borders stay out unless invited; nameless centroids likewise", () => {
  const sea = { admin_level: 2, maritime: "yes" };
  assert.equal(featureFilter(sea, D_1939_09_01).keep, false);
  assert.match(featureFilter(sea, D_1939_09_01).why, /maritime/);
  assert.equal(featureFilter(sea, D_1939_09_01, { includeMaritime: true }).keep, true);
  const nameless = { admin_level: 2 };
  assert.equal(featureFilter(nameless, D_1939_09_01, { requireName: true }).keep, false);
  assert.match(featureFilter(nameless, D_1939_09_01, { requireName: true }).why, /name 없음/);
  assert.equal(featureFilter({ ...nameless, name: "Polska" }, D_1939_09_01, { requireName: true }).keep, true);
});

test("ISO-only features filter correctly; dateless features are eternal", () => {
  const isoOnly = { admin_level: 2, start_date: "1945-08-15" };
  assert.equal(featureFilter(isoOnly, D_1939_09_01).keep, false, "not yet born in 1939");
  assert.equal(featureFilter(isoOnly, isoToDecdate("1950-01-01")).keep, true);
  assert.equal(featureFilter({ admin_level: 2 }, D_1939_09_01).keep, true, "no dates = as old as the map, still there");
});

console.log("\nThe emitted shape — inspectable, diffable, license-honest");

test("eraFeature keeps the useful properties, rounds like the region extractor", () => {
  const feature = eraFeature(
    { type: "LineString", coordinates: [[126.987654321, 37.5678999], [127.1, 37.6]] },
    { admin_level: 2, start_date: "1918-11-11", tiler_internal: "x", name: "" },
    12345,
  );
  assert.equal(feature.type, "Feature");
  assert.equal(feature.id, 12345);
  assert.deepEqual(feature.properties, { admin_level: 2, start_date: "1918-11-11" }, "internals and empty strings stay behind");
  assert.deepEqual(feature.geometry.coordinates[0], [126.98765, 37.5679], "5 decimals, the seam-dissolve contract from extract-regions");
  assert.deepEqual(roundCoords([[[1.000000004, -2.999999996]]]), [[[1, -3]]]);
  assert.deepEqual(pickProps({ disputed: "yes", disputed_by: "A;B" }), { disputed: "yes", disputed_by: "A;B" }, "dispute tags survive for route 2");
});

test("eraCollection declares its source, license and unstitched state", () => {
  const fc = eraCollection([], { date: "1939-09-01", zoom: 2, layer: "land_ohm_lines" });
  assert.equal(fc.type, "FeatureCollection");
  assert.match(fc.meta.source, /OpenHistoricalMap/);
  assert.match(fc.meta.source, /CC0/);
  assert.equal(fc.meta.stitched, false, "F-1 is raw material; stitching is F-2's job and the file says so");
  assert.equal(fc.meta.date, "1939-09-01");
  assert.equal(JSON.parse(JSON.stringify(fc)).meta.layer, "land_ohm_lines", "round-trips clean");
});

console.log("\nThe CLI wiring — pinned at the source, like every other hook");

const CLI = fs.readFileSync(new URL("../scripts/ohm/extract-era-borders.mjs", import.meta.url), "utf8");

test("the CLI reads both OHM layers from the verified tile server", () => {
  assert.match(CLI, /land_ohm_lines/);
  assert.match(CLI, /land_ohm_centroids/);
  assert.match(CLI, /vtiles\.openhistoricalmap\.org\/maps\/ohm/);
  assert.match(CLI, /requireName: true/, "only centroids demand a name");
});

test("politeness and loudness are load-bearing, not decoration", () => {
  assert.match(CLI, /USER_AGENT/, "identifies itself to the volunteer server");
  assert.match(CLI, /TILE_DELAY_MS = 150/, "sequential, spaced fetches");
  assert.match(CLI, /MAX_TILES_PER_RUN = 1024/, "a run that would hammer the server is refused with arithmetic, not truncated silently");
  assert.match(CLI, /dropReasons/, "every dropped feature is tallied by reason");
  assert.match(CLI, /0x1f/, "gzip magic guarded even without Content-Encoding");
});

test("tiles are clipped to exact bounds and dumps are zoom-named — both measured fixes", () => {
  assert.match(CLI, /clipToTile\(gj\.geometry, tileBounds\)/, "the buffer overshoot dies at decode");
  assert.match(CLI, /타일 버퍼 전용/, "buffer-only content is tallied, not vanished");
  assert.match(CLI, /clippedToTileBounds: true/, "the dump declares its clipping");
  assert.match(CLI, /era-\$\{role\}-\$\{options\.date\}-z\$\{options\.zoom\}\.geojson/, "a z2 world dump can never overwrite a z4 window dump again");
});

console.log(`\n${pass} passed\n`);

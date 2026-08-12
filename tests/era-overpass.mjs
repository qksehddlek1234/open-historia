/*! Open Historia — the second transport lines up with the first © 2026 Nicholas Krol, MIT (see src/Editor/LICENSE). */
// THE HALF OF fetch-era-boundaries.mjs THAT DOES NOT NEED A NETWORK.
//
// The query itself has to run on the user's PC. What can be proven here is
// everything that decides whether its output is USABLE when it arrives:
//
//   • the frame it clips to is the same rectangle the assembler rebuilds — if
//     these disagree the two transports are not comparable and the face counts
//     mean different things
//   • the relation→way join, which is the only real logic in the file
//   • that the query carries no date, because the cache is keyed on that being
//     true and a date in the query would make every cached response wrong
//   • that a dropped way is counted with a reason, never silently absent
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import url from "node:url";

const ROOT = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), "..");
const FETCH = path.join(ROOT, "scripts", "ohm", "fetch-era-boundaries.mjs");
const OUT = path.join(ROOT, "scripts", "ohm", "out");

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

const { frameOf, joinWays } = await import(url.pathToFileURL(FETCH).href);
const { isoToDecdate, eraFeature } = await import(
  url.pathToFileURL(path.join(ROOT, "scripts", "ohm", "lib", "eraBorders.mjs")).href
);
const AT_1836 = isoToDecdate("1836-01-01");

console.log("\nEra borders over Overpass");

test("THE FRAME MATCHES WHAT THE ASSEMBLER REBUILDS", () => {
  // The assembler computes its closing frame from meta.bbox + meta.zoom. An
  // Overpass dump has no tiles to widen it, so it must compute the identical
  // rectangle deliberately. This is the observed value from the real 1836 run:
  // the assembler printed 창 -22.50,21.94,67.50,74.02 for bbox [-15,30,50,72].
  const frame = frameOf([-15, 30, 50, 72], 4);
  assert.deepEqual(frame.map((v) => Number(v.toFixed(2))), [-22.5, 21.94, 67.5, 74.02]);
  // The invariant that actually matters, asserted rather than a second
  // hand-computed number: the frame CONTAINS what was asked for. (Both Europe
  // windows happen to land on the same tiles, which is why 1939's frame is the
  // identical rectangle — the first draft of this test asserted 45 for its east
  // edge by doing the arithmetic in my head, and tile 10 runs to 67.5.)
  for (const bbox of [[-10, 35, 45, 71], [-15, 30, 50, 72], [2, 45, 8, 52]]) {
    const [fw, fs_, fe, fn] = frameOf(bbox, 4);
    assert.ok(fw <= bbox[0] && fs_ <= bbox[1] && fe >= bbox[2] && fn >= bbox[3],
      `frame ${[fw, fs_, fe, fn]} must contain ${bbox}`);
  }
});

test("THE QUERY CARRIES NO DATE — the cache depends on it", () => {
  // One response serves every date in a window, which is only true while the
  // date is applied locally. A [date:] setting or a date filter in the query
  // would make every cached response silently wrong for other dates.
  const src = fs.readFileSync(FETCH, "utf8");
  const query = src.slice(src.indexOf("const query ="), src.indexOf(";\n", src.indexOf("const query =")));
  assert.doesNotMatch(query, /targetDec|options\.date|\[date:/, "no date may reach the query");
  assert.match(query, /admin_level/, "it is keyed by the window and the ceiling");
  assert.match(query, /out body/, "relations must return members, or the join has nothing to join on");
  assert.match(query, /out geom/, "ways must return geometry, which is the whole point");
});

// ── the join, which is the only real logic in the file ───────────────────────

const rel = (id, tags, wayIds) => ({
  type: "relation", id, tags, members: wayIds.map((ref) => ({ type: "way", ref })),
});
const way = (id, tags = {}) => ({
  type: "way", id, tags, geometry: [{ lon: 10, lat: 50 }, { lon: 11, lat: 51 }],
});

test("A SHARED WAY TAKES ITS MOST SIGNIFICANT LIVING PARENT", () => {
  // At 1836 most German borders are one way owned by both neighbours, and some
  // are claimed by a district as well. The line the map draws is the national
  // one, so the lowest admin_level wins.
  const { kept } = joinWays([
    rel(1, { admin_level: "4", type: "boundary", boundary: "administrative", start_date: "1800" }, [100]),
    rel(2, { admin_level: "2", type: "boundary", boundary: "administrative", start_date: "1800" }, [100]),
    way(100),
  ], AT_1836, { maxAdminLevel: 4 });
  assert.equal(kept.length, 1);
  assert.equal(kept[0].props.admin_level, "2", "the level-2 parent, not the level-4 one");
});

test("A WAY WHOSE PARENTS ARE ALL DEAD IS DROPPED, WITH THE REASON", () => {
  const { kept, drops } = joinWays([
    rel(1, { admin_level: "2", start_date: "1600", end_date: "1806" }, [100]),
    way(100),
  ], AT_1836, { maxAdminLevel: 2 });
  assert.equal(kept.length, 0, "the Holy Roman Empire is not a 1836 border");
  assert.equal([...drops.values()].reduce((a, b) => a + b, 0), 1, "and it is counted");
  assert.match([...drops.keys()][0], /날짜 창 밖/, "with the reason, not a bare number");
});

test("A WAY'S OWN DATES GATE IT EVEN WHEN THE PARENT LIVES", () => {
  // OHM dates individual segments when a frontier moved without the polity
  // ending. Taking the parent's window alone would draw a border that had
  // already been redrawn by the target date.
  const { kept, drops } = joinWays([
    rel(1, { admin_level: "2", start_date: "1800" }, [100, 101]),
    way(100, { start_date: "1800", end_date: "1815" }),
    way(101, { start_date: "1815" }),
  ], AT_1836, { maxAdminLevel: 2 });
  assert.deepEqual(kept.map((k) => k.id), [101], "only the segment alive in 1836");
  assert.ok([...drops.keys()].some((k) => k.startsWith("way 자체")),
    "and the drop says it was the way's own window, not the parent's");
});

test("AN ORPHAN WAY IS COUNTED, NEVER KEPT", () => {
  // A way with no parent in this response has no admin_level to filter by, and
  // an unfiltered line is worse than a missing one — it would join the face
  // graph as an anonymous edge and cut a country in half.
  const { kept, orphanWays } = joinWays([way(100)], AT_1836, { maxAdminLevel: 2 });
  assert.equal(kept.length, 0);
  assert.equal(orphanWays, 1);
});

test("a way returned without geometry is not treated as a way at all", () => {
  const { kept, orphanWays } = joinWays([
    rel(1, { admin_level: "2", start_date: "1800" }, [100]),
    { type: "way", id: 100, tags: {} },
  ], AT_1836, { maxAdminLevel: 2 });
  assert.equal(kept.length, 0);
  assert.equal(orphanWays, 0, "no geometry means nothing to draw, not an orphan");
});

test("THE EMITTED SHAPE MATCHES THE TILE TRANSPORT, field for field", () => {
  // The assembler must not be able to tell which transport produced a dump.
  // Compared against the tile dump on disk where one exists.
  const built = eraFeature(
    { type: "LineString", coordinates: [[10.123456, 50.123456], [11, 51]] },
    { admin_level: "2", start_date: "1815-06-09", boundary: "administrative" },
  );
  assert.equal(built.type, "Feature");
  assert.deepEqual(built.geometry.coordinates[0], [10.12346, 50.12346], "same 5-place rounding");
  assert.ok(!("boundary" in built.properties), "tiler internals stay behind");

  const tiled = fs.readdirSync(OUT).filter((f) => /^era-lines-.*\.geojson$/.test(f));
  if (tiled.length === 0) return; // dumps are gitignored
  const dump = JSON.parse(fs.readFileSync(path.join(OUT, tiled.sort()[0]), "utf8"));
  const tileKeys = new Set();
  for (const f of dump.features) Object.keys(f.properties ?? {}).forEach((k) => tileKeys.add(k));
  for (const key of Object.keys(built.properties)) {
    assert.ok(tileKeys.has(key), `${key} is not a property the tile transport ever emits`);
  }
});

test("A BORDER LINE DOES NOT CARRY ONE PARENT'S NAME", () => {
  // pickProps keeps `name` when it is there, and an Overpass relation always
  // has one — so without stripping it, the Prussia–Saxony border would ship
  // labelled "Königreich Preußen". That is half of a two-sided fact, and the
  // tile transport never emits `name` on a line at all. Checked against the
  // real tile dump's own key set below.
  const { kept } = joinWays([
    rel(1, { admin_level: "2", start_date: "1800", name: "Königreich Preußen" }, [100]),
    way(100),
  ], AT_1836, { maxAdminLevel: 2 });
  assert.equal(kept.length, 1);
  assert.ok(!("name" in kept[0].props),
    "the border between two states must not ship labelled with one of them");
  assert.equal(kept[0].props.admin_level, "2", "and everything else still travels");
});

test("the dump declares its transport and claims no tile layer", () => {
  // assemble-era-borders warns when meta.layer is present and not the tile
  // layer. Claiming the tile layer would be a lie; omitting it is the truth and
  // silences nothing that matters.
  const src = fs.readFileSync(FETCH, "utf8");
  assert.match(src, /transport: "overpass"/);
  assert.doesNotMatch(src, /layer: "land_ohm_lines"/, "an Overpass dump has no tile layer");
});

console.log(`\n${pass} passed\n`);

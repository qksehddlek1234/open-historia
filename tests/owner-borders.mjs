// A national border must be the line where OWNERSHIP changes.
//
// The game drew it from GADM level 0 for as long as it drew one at all, which is
// correct on Modern Day and wrong on every other board — the 1935 map wore the
// 2026 Germany-Poland line through the Reich, and 1200 wore the whole modern
// grid. The replacement is a segment dissolve over the board's own regions, and
// its two claims are what this pins: the frontier is exactly the shared edges
// whose two sides disagree, and `intact` names only the countries whose level-0
// ring draws no line that ownership does not draw.
//
// The second claim is the dangerous one. Naming a country intact tells the game
// to keep drawing GADM level 0 there, so a false positive puts a modern border
// back on the map — the precise fault the asset exists to remove.
import assert from "node:assert/strict";
import fs from "node:fs";
import { buildOwnerBorders } from "../scripts/presets/lib/ownerBorders.mjs";

let pass = 0;
const test = (name, fn) => { fn(); pass += 1; console.log(`  ok  ${name}`); };

// A 2x2 grid of unit squares sharing exact vertices, the way extract-regions
// guarantees the real seed does:
//
//   C D      y=2
//   A B      y=1  <- the only line where ownership changes
//            y=0
const square = (x, y) => [[[x, y], [x + 1, y], [x + 1, y + 1], [x, y + 1], [x, y]]];
const board = (spec) => spec.map(([id, gid0, owner, x, y, extra]) => ({
  type: "Feature",
  properties: { id, gid0, owner, ...(extra ?? {}) },
  geometry: { type: "Polygon", coordinates: square(x, y) },
}));

const GRID = [
  ["A", "AAA", "X", 0, 0],
  ["B", "AAA", "X", 1, 0],
  ["C", "BBB", "Y", 0, 1],
  ["D", "BBB", "Y", 1, 1],
];

console.log("\nThe frontier is where owners disagree, and nowhere else");

test("a shared edge between two owners is the border; between one owner it is not", () => {
  const { collection, stats } = buildOwnerBorders(board(GRID));
  // Four squares: 12 outer edges (coast), 2 interior edges under one owner
  // (A|B and C|D), 2 edges where X meets Y (A|C and B|D).
  assert.equal(stats.segments.frontier, 2, "only the X/Y edges are border");
  assert.equal(stats.segments.interior, 2, "same-owner shared edges are interior");
  assert.equal(stats.segments.exterior, 8, "the outer ring is coast, not border");
  assert.equal(stats.segments.overCounted, 0, "no segment may belong to three regions");
  const lines = collection.features[0].geometry.coordinates;
  assert.equal(lines.length, 1, "the two border segments chain into one run");
  assert.deepEqual(lines[0], [[0, 1], [1, 1], [2, 1]], "the run is the whole y=1 line");
});

test("no disagreement anywhere means no border file to draw", () => {
  const { collection, stats } = buildOwnerBorders(
    board(GRID.map(([id, gid0, , x, y]) => [id, gid0, "X", x, y])),
  );
  assert.equal(stats.segments.frontier, 0);
  assert.deepEqual(collection.features, [], "an empty collection, not an empty line");
});

test("unowned land is a side like any other — a state's edge against it is a border", () => {
  // "" is not a polity, but the edge between a country and no-man's-land is
  // still the country's edge, and the map has to show where the state stops.
  const { stats } = buildOwnerBorders(
    board(GRID.map(([id, gid0, owner, x, y]) => [id, gid0, owner === "Y" ? "" : owner, x, y])),
  );
  assert.equal(stats.segments.frontier, 2);
});

test("a sea region's edge is coastline, not a national border", () => {
  // Sea regions are an overlay merged into whatever map they were added to.
  // Counting one as a side would draw a black national line along every shore
  // the overlay covers.
  const withSea = board([...GRID.slice(0, 3), ["D", "BBB", "OCEAN", 1, 1, { kind: "sea" }]]);
  const { stats } = buildOwnerBorders(withSea);
  assert.equal(stats.segments.frontier, 1, "only A|C survives; B|D is a shore");
});

console.log("\n`intact` may keep a country only where level 0 draws no false line");

test("a border that ownership also draws leaves both sides intact", () => {
  const { stats } = buildOwnerBorders(board(GRID));
  assert.deepEqual(stats.intact, ["AAA", "BBB"]);
});

test("a polity straddling a modern border makes BOTH sides modern-only lies", () => {
  // The Angevin case: one king holding England and Anjou. Level 0 would keep
  // drawing the line down the middle of his realm, so neither code may keep it.
  const spanning = GRID.map(([id, gid0, owner, x, y]) => [id, gid0, id === "D" ? "X" : owner, x, y]);
  const { stats } = buildOwnerBorders(board(spanning));
  assert.deepEqual(stats.intact, [], "neither side of a straddled border survives");
});

test("a country split between two polities still keeps its outline", () => {
  // This is the case the first version of the rule got wrong. AAA divided
  // between X and Z is not a reason to stop drawing AAA: its level-0 ring is
  // coast plus the AAA/BBB border, and that border is still an ownership
  // change. The line INSIDE it is drawn by the frontier, which is what the
  // frontier is for. Asking "is this country whole" instead cost Britain its
  // coastline on a board whose borders were modern.
  const split = GRID.map(([id, gid0, owner, x, y]) => [id, gid0, id === "B" ? "Z" : owner, x, y]);
  const { stats } = buildOwnerBorders(board(split));
  assert.deepEqual(stats.intact, ["AAA", "BBB"]);
});

test("two unowned countries meeting draw a border that nobody holds", () => {
  // Level 0 draws a line between them; ownership draws none. On a board where
  // nobody holds that ground there is no national border there, so both stop.
  const empty = GRID.map(([id, gid0, , x, y]) => [id, gid0, "", x, y]);
  const { stats } = buildOwnerBorders(board(empty));
  assert.deepEqual(stats.intact, []);
});

test("a disputed pseudo-code never decides its claimant's outline", () => {
  // GADM files Kashmir and the rest as Z01-Z09 and does not draw them as part
  // of the claimant. Counting them split India, China and Pakistan on Modern
  // Day — three of the world's longer coastlines lost to a border in Kashmir.
  const disputed = [
    ["A", "AAA", "X", 0, 0], ["B", "AAA", "X", 1, 0],
    ["C", "BBB", "Y", 0, 1], ["D", "Z01", "X", 1, 1],
  ];
  const { stats } = buildOwnerBorders(board(disputed));
  assert.deepEqual(stats.intact, ["AAA", "BBB"], "the claimant keeps its coast");
  assert.ok(!stats.intact.includes("Z01"), "and the pseudo-code is not a country");
});

console.log("\nThe asset travels the same road as the geometry it outlines");

test("borders.geojson is registered as a scenario asset on both stores", () => {
  const server = fs.readFileSync(new URL("../server/libraryStore.js", import.meta.url), "utf8");
  const models = fs.readFileSync(new URL("../src/runtime/web/models.js", import.meta.url), "utf8");
  const assets = fs.readFileSync(new URL("../src/runtime/assets.js", import.meta.url), "utf8");
  assert.match(server, /bordersGeojson:\s*"borders\.geojson"/, "the server must know the filename");
  assert.match(models, /SCENARIO_GEOJSON_ASSET_KEYS = \[[^\]]*"bordersGeojson"/, "the web mirror must list the key");
  assert.match(assets, /JSON_URLS\.bordersGeojson = withRuntimeToken/, "the runtime must have a URL for it");
});

test("a board with its own map may not borrow Modern Day's border", () => {
  // Absent means "keep drawing level 0", which is what that board did
  // yesterday. Handing it the modern border instead is the one answer that
  // makes things worse than doing nothing.
  const server = fs.readFileSync(new URL("../server/libraryStore.js", import.meta.url), "utf8");
  const at = server.indexOf("const borrowsDefaultMap");
  assert.notEqual(at, -1, "the borrow rule must be explicit, not a bare assetKey check");
  const rule = server.slice(at, at + 260);
  assert.match(rule, /bordersGeojson/);
  assert.match(rule, /!fs\.existsSync\(getScenarioUploadPath\(scenario\.id, "regionsGeojson"\)\)/);
});

console.log(`\n${pass} passed\n`);

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

test("no disagreement anywhere means no frontier line to draw", () => {
  const { collection, stats } = buildOwnerBorders(
    board(GRID.map(([id, gid0, , x, y]) => [id, gid0, "X", x, y])),
  );
  assert.equal(stats.segments.frontier, 0);
  // This used to assert an EMPTY collection. Since B-7 the file may still carry
  // a coast feature here — one polity over two codes makes both codes
  // non-intact (the AAA|BBB line would be a modern-only lie), and a code that
  // stops drawing level 0 loses its coastline unless this file ships it. That
  // is the exact price B-7 exists to refund.
  assert.ok(!collection.features.some((f) => f.properties.kind === "frontier"),
    "no frontier feature without a disagreement");
  assert.equal(collection.features.filter((f) => f.properties.kind === "coast").length, 1,
    "the two non-intact codes' perimeter ships as coast");
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

console.log("\nThe coast ships only where the tiles stopped drawing it (B-7)");

test("an intact code's coast is NOT shipped — its tiles already draw it", () => {
  // GRID's AAA and BBB are both intact (their shared border is an ownership
  // change), so shipping their perimeter would double-draw every shoreline.
  const { collection, stats } = buildOwnerBorders(board(GRID));
  assert.equal(stats.coast.segments, 0);
  assert.ok(!collection.features.some((f) => f.properties.kind === "coast"));
});

test("a non-intact code's coast ships, simplified, with its knobs on record", () => {
  // The Angevin board again: X holds three squares across the AAA|BBB line, so
  // both codes lose their level-0 outline — and this file must give the coast
  // back or the realm has no shoreline at all.
  const spanning = GRID.map(([id, gid0, owner, x, y]) => [id, gid0, id === "D" ? "X" : owner, x, y]);
  const { collection, stats } = buildOwnerBorders(board(spanning));
  assert.equal(stats.coast.segments, 8, "the whole 2x2 perimeter");
  assert.equal(stats.coast.parts, 1, "chained into one ring");
  const coast = collection.features.find((f) => f.properties.kind === "coast");
  assert.ok(coast, "emitted as its own feature so the runtime can weight it apart");
  // The knobs are data, not lore: the runtime and the next reader get the
  // numbers this file was cut with.
  assert.equal(stats.coast.eps, 0.02);
  assert.equal(stats.coast.minPartDiag, 0.1);
});

test("a clip seam — an edge the seed never drew — is cut from the coast AND counted", () => {
  // The 긁힘 report (2026-08-19): era clipping leaves micro-gaps between pieces,
  // and both gap edges appear once, so they classified as coast and drew as
  // dozens of inland scratches through Austria. The discriminator is exact:
  // clipping preserves ORIGINAL vertices bit-identically, so a real shoreline
  // is in the seed's own segment set and a seam is not. Measured on 1836:
  // 1,060,116 candidates in the seed vs 2,631 not — the split is the scratches.
  const spanning = GRID.map(([id, gid0, owner, x, y]) => [id, gid0, id === "D" ? "X" : owner, x, y]);
  const boardFeatures = board(spanning);
  // A seed that knows every perimeter edge EXCEPT the two on square A's west
  // side — as if that edge pair were cut by a face rather than drawn.
  const seedSegmentKeys = new Set();
  const ringsOf = (g) => (g.type === "Polygon" ? g.coordinates : g.coordinates.flat());
  for (const f of boardFeatures) {
    for (const ring of ringsOf(f.geometry)) {
      for (let i = 0; i + 1 < ring.length; i += 1) {
        const ka = `${ring[i][0]},${ring[i][1]}`;
        const kb = `${ring[i + 1][0]},${ring[i + 1][1]}`;
        if (ka === kb) continue;
        seedSegmentKeys.add(ka < kb ? `${ka}|${kb}` : `${kb}|${ka}`);
      }
    }
  }
  seedSegmentKeys.delete("0,0|0,1");
  const { stats } = buildOwnerBorders(boardFeatures, { seedCoastKeys: seedSegmentKeys });
  assert.equal(stats.coast.seamDropped, 1, "the not-in-seed edge is cut and counted");
  assert.equal(stats.coast.segments, 7, "the seven real perimeter edges still ship");
  // And without a seed set the filter stays out of the way (the tests above
  // rely on this, and so does any caller that has no seed to offer).
  const open = buildOwnerBorders(boardFeatures);
  assert.equal(open.stats.coast.seamDropped, 0);
  assert.equal(open.stats.coast.segments, 8);
});

test("an edge the seed drew as an INTERNAL border is not coast, however it was clipped", () => {
  // Species 4's first half. Era clipping rewrites one side of a border and
  // leaves the other side's original segments unpaired — they are genuine seed
  // vertices, so the seam test clears them, and they can run past real water
  // (Utah's 37N line passes Lake Powell), so the water test clears them too.
  // The seed's own count settles it: an edge it drew TWICE had a neighbour and
  // was never coast.
  const spanning = GRID.map(([id, gid0, owner, x, y]) => [id, gid0, id === "D" ? "X" : owner, x, y]);
  const boardFeatures = board(spanning);
  const coastKeys = new Set();
  const sharedKeys = new Set();
  const ringsOf = (g) => (g.type === "Polygon" ? g.coordinates : g.coordinates.flat());
  for (const f of boardFeatures) {
    for (const ring of ringsOf(f.geometry)) {
      for (let i = 0; i + 1 < ring.length; i += 1) {
        const ka = `${ring[i][0]},${ring[i][1]}`;
        const kb = `${ring[i + 1][0]},${ring[i + 1][1]}`;
        if (ka === kb) continue;
        coastKeys.add(ka < kb ? `${ka}|${kb}` : `${kb}|${ka}`);
      }
    }
  }
  // The seed says this perimeter edge had a neighbour; the board lost it.
  coastKeys.delete("0,0|0,1");
  sharedKeys.add("0,0|0,1");
  const { stats } = buildOwnerBorders(boardFeatures, { seedCoastKeys: coastKeys, seedSharedKeys: sharedKeys });
  assert.equal(stats.coast.seedInteriorDropped, 1, "counted apart from a seam — different species, different number");
  assert.equal(stats.coast.seamDropped, 0, "and NOT counted as a seam: the seed did draw these vertices");
});

test("an edge with another region's edge in the same cell is a border, not a coast", () => {
  // Species 4's second half, and the one that actually killed Utah: the two
  // sides of that line are digitised at different vertex densities (6 vertices
  // against 8 on the seed), so exact-key pairing never matched them and BOTH
  // sides were called coast. Here B's western edge is redrawn with an extra
  // midpoint — same line, different vertices — which is exactly that defect.
  const west = {
    type: "Feature",
    properties: { id: "A", gid0: "AAA", owner: "X" },
    geometry: { type: "Polygon", coordinates: [[[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]] },
  };
  // One owner across both codes, so neither keeps its level-0 outline and the
  // coast lane is the one that would have to draw this line.
  const east = {
    type: "Feature",
    properties: { id: "B", gid0: "BBB", owner: "X" },
    geometry: { type: "Polygon", coordinates: [[[1, 0], [2, 0], [2, 1], [1, 1], [1, 0.5], [1, 0]]] },
  };
  const { stats } = buildOwnerBorders([west, east]);
  assert.ok(stats.coast.neighbourDropped >= 2,
    `the shared line's mismatched halves must not ship as coast (got ${stats.coast.neighbourDropped})`);
  // The outer perimeter is untouched — nobody else's edge is near it.
  assert.ok(stats.coast.segments >= 6, `the real perimeter still ships (got ${stats.coast.segments})`);
});

test("a closed ring around a LAKE is cut from the coast, an island's ring is not", () => {
  // 긁힘 species 2 (2026-08-19, reopened the same day species 1 died): closed
  // mini-rings of ORIGINAL seed vertices — lake holes and coverage voids —
  // pass the seed filter honestly, then RDP crushes them into the ㄱ-strokes
  // the user saw inland. The discriminator is the ring's OUTSIDE, not its
  // inside: an island's ring has unpainted sea beyond it, a lake/void ring is
  // embedded in painted land. (The interior test was tried first and kept 16
  // Austrian lakes — the lakes are coverage gaps that a neighbour's simplified
  // outline slops over, so "is the inside covered" cannot tell them from
  // islands.) Cowork measured 7,070 closed rings on shipped 1836, 6,322 of
  // them under 0.5° — those are the scratches.
  const lakeRegion = {
    type: "Feature",
    properties: { id: "A", gid0: "AAA", owner: "X" },
    geometry: { type: "Polygon", coordinates: [
      [[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]],
      [[0.2, 0.2], [0.5, 0.2], [0.5, 0.5], [0.2, 0.5], [0.2, 0.2]], // scratch-class lake (diag 0.42)
    ] },
  };
  const neighbour = {
    type: "Feature",
    properties: { id: "B", gid0: "BBB", owner: "X" },
    geometry: { type: "Polygon", coordinates: [[[1, 0], [2, 0], [2, 1], [1, 1], [1, 0]]] },
  };
  // One owner across two codes → both codes non-intact → their coast ships.
  const { collection, stats } = buildOwnerBorders([lakeRegion, neighbour]);
  assert.equal(stats.coast.voidRingsDropped, 1, "the lake ring is cut and counted");
  const coast = collection.features.find((f) => f.properties.kind === "coast");
  assert.equal(coast.geometry.coordinates.length, 1, "the outer perimeter — sea beyond it — still ships");
  const shippedYs = coast.geometry.coordinates[0].map(([, y]) => y);
  assert.ok(!shippedYs.some((y) => y > 0.15 && y < 0.55 - 1e-9),
    "no shipped vertex lies at the lake's latitudes — the ring that survived is the outer one");
});

test("a BIG lake keeps its shoreline — the Caspian rule", () => {
  // The Caspian, Ladoga and Balaton are coverage gaps embedded in land exactly
  // like the scratch rings; the size floor (0.6°, measured — scratches top out
  // ~0.5°, Balaton starts ~0.9°) is what separates cartography from noise.
  const bigLakeRegion = {
    type: "Feature",
    properties: { id: "A", gid0: "AAA", owner: "X" },
    geometry: { type: "Polygon", coordinates: [
      [[0, 0], [2, 0], [2, 2], [0, 2], [0, 0]],
      [[0.5, 0.5], [1.5, 0.5], [1.5, 1.5], [0.5, 1.5], [0.5, 0.5]], // diag 1.41 — a real shore
    ] },
  };
  const neighbour = {
    type: "Feature",
    properties: { id: "B", gid0: "BBB", owner: "X" },
    geometry: { type: "Polygon", coordinates: [[[2, 0], [3, 0], [3, 2], [2, 2], [2, 0]]] },
  };
  const { collection, stats } = buildOwnerBorders([bigLakeRegion, neighbour]);
  assert.equal(stats.coast.voidRingsDropped, 0, "a shore this large is not a scratch");
  const coast = collection.features.find((f) => f.properties.kind === "coast");
  assert.equal(coast.geometry.coordinates.length, 2, "outer perimeter AND the lake shore both ship");
});

test("an islet below the size floor is dropped AND counted, never silently", () => {
  // A 0.01-degree speck belonging to a non-intact code: invisible at any zoom
  // where a coastline outline reads, so it goes — but 침묵 캡 금지, the drop
  // is a number in meta, not a mystery on a screenshot.
  const speck = [[[5, 5], [5.01, 5], [5.01, 5.01], [5, 5.01], [5, 5]]];
  const spanning = GRID.map(([id, gid0, owner, x, y]) => [id, gid0, id === "D" ? "X" : owner, x, y]);
  const features = [...board(spanning), {
    type: "Feature",
    properties: { id: "S", gid0: "AAA", owner: "X" },
    geometry: { type: "Polygon", coordinates: speck },
  }];
  const { stats } = buildOwnerBorders(features);
  assert.equal(stats.coast.droppedSmallParts, 1, "the speck is counted out");
  assert.equal(stats.coast.parts, 1, "the mainland ring still ships");
});

test("a part with no vertex near real water is not a coast — the Utah rule", () => {
  // 긁힘 species 3 (2026-08-19, third reopen of the same day): Utah's state
  // border shipped as coastline in the middle of 1836 Mexico, with Nepal's
  // outline and the dead DE/AT frontier beside it. "No neighbouring region"
  // never meant "sea" — so the filter finally asks the definitional question
  // against a Natural Earth vertex cloud. The big lake here is exactly the
  // case the reference must carry lake shores for: it passes the size floor
  // (Caspian rule), and only the water reference can say whether its shore is
  // real water or a waterless artefact.
  const bigLakeRegion = {
    type: "Feature",
    properties: { id: "A", gid0: "AAA", owner: "X" },
    geometry: { type: "Polygon", coordinates: [
      [[0, 0], [2, 0], [2, 2], [0, 2], [0, 0]],
      [[0.5, 0.5], [1.5, 0.5], [1.5, 1.5], [0.5, 1.5], [0.5, 0.5]],
    ] },
  };
  const neighbour = {
    type: "Feature",
    properties: { id: "B", gid0: "BBB", owner: "X" },
    geometry: { type: "Polygon", coordinates: [[[2, 0], [3, 0], [3, 2], [2, 2], [2, 0]]] },
  };
  // Reference knows the sea beyond the outer perimeter — nothing about the lake.
  // Laid down densely (the real cloud is Natural Earth at 0.05°, which is dense
  // everywhere); a sparse ring would break the perimeter into pieces at the
  // gaps, which is a property of the fixture and not of the rule.
  const ring = [];
  for (let t = -0.2; t <= 3.2; t += 0.1) { ring.push([t, -0.15], [t, 2.15]); }
  for (let t = -0.2; t <= 2.2; t += 0.1) { ring.push([-0.15, t], [3.15, t]); }
  const toCells = (pts) => ({ grid: 0.05, points: pts.map(([x, y]) => [Math.round(x / 0.05), Math.round(y / 0.05)]) });
  const sea = toCells(ring);
  const dry = buildOwnerBorders([bigLakeRegion, neighbour], { coastReference: sea });
  // Counted in SEGMENTS since 2026-08-20: the test moved ahead of chaining, so
  // that one wet touch could no longer vouch for a whole dry run (Kashmir rode
  // in on Pangong Tso, Bavaria-Bohemia on Bodensee) and so chaining could not
  // weld a real shore to an inland line (a 292-point part was the Pacific coast
  // fused to the 42N state border).
  assert.ok(dry.stats.coast.waterlessDropped > 0, "the waterless lake ring is cut and counted");
  assert.equal(dry.collection.features.find((f) => f.properties.kind === "coast").geometry.coordinates.length, 1,
    "the outer perimeter — near the reference sea — still ships");
  // Teach the reference the lake and the shore comes back: this is why
  // build-coastline-reference.mjs merges NE lakes into the cloud.
  const lakeRing = [];
  for (let t = 0.4; t <= 1.6; t += 0.1) { lakeRing.push([t, 0.5], [t, 1.5], [0.5, t], [1.5, t]); }
  const withLake = { grid: 0.05, points: [...sea.points, ...toCells(lakeRing).points] };
  const wet = buildOwnerBorders([bigLakeRegion, neighbour], { coastReference: withLake });
  assert.equal(wet.stats.coast.waterlessDropped, 0);
  assert.equal(wet.collection.features.find((f) => f.properties.kind === "coast").geometry.coordinates.length, 2);
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

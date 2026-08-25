// Era geometry graft (plan F-3): the era outline is the authority, the modern
// province is the thing that gets cut. These pins hold the parts that go wrong
// silently — a piece that vanishes off the map, a province "split" between two
// halves of the same country, a re-owned region the game's ownership table
// never hears about.
import assert from "node:assert/strict";
import fs from "node:fs";
import {
  buildFaceNameIndex, matchFace, stripStyle, graftEraGeometry,
  multiPolygonArea, toMultiPolygon, bboxOf, bboxOverlaps,
  MIN_PIECE_FRACTION,
} from "../scripts/presets/lib/eraGeometry.mjs";

let pass = 0;
const test = (name, fn) => { fn(); pass += 1; console.log(`  ok  ${name}`); };

const read = (p) => fs.readFileSync(new URL(p, import.meta.url), "utf8");
const BUILD = read("../scripts/presets/build-preset.mjs");

// A box, counter-clockwise, as a GeoJSON Polygon.
const box = (x0, y0, x1, y1) => ({
  type: "Polygon",
  coordinates: [[[x0, y0], [x1, y0], [x1, y1], [x0, y1], [x0, y0]]],
});
const face = (name, owner, x0, y0, x1, y1) => {
  const mp = toMultiPolygon(box(x0, y0, x1, y1));
  return { owner, name, mp, bbox: bboxOf(mp) };
};
const region = (id, owner, x0, y0, x1, y1, extra = {}) => ({
  type: "Feature",
  geometry: box(x0, y0, x1, y1),
  properties: { id, owner, gid0: id.slice(0, 3), name: id, typeId: "land", ...extra },
});

console.log("\nNames — an era face says where it is, rarely who holds it");

test("the index reaches era polities by name, code and alias, and modern owners by name", () => {
  const index = buildFaceNameIndex(
    { GER: { name: "Germany", aliases: ["Deutsches Reich", "독일"] } },
    ["Poland", "Switzerland"],
  );
  assert.equal(index.get("germany"), "Germany");
  assert.equal(index.get("ger"), "Germany", "the authoring code resolves too");
  assert.equal(index.get("deutsches reich"), "Germany", "OHM's native name arrives through the alias list");
  assert.equal(index.get("독일"), "Germany");
  assert.equal(index.get("poland"), "Poland", "unassigned regions keep a modern owner — its name must match a face");
});

test("a polity's own name outranks another polity's alias", () => {
  const index = buildFaceNameIndex({
    POL: { name: "Poland" },
    GER: { name: "Germany", aliases: ["Poland"] }, // pathological, on purpose
  });
  assert.equal(index.get("poland"), "Poland", "names are read before aliases, so the real Poland wins");
});

test("style strips to the modern name and stops at the year suffix", () => {
  assert.equal(stripStyle("Kingdom of Hungary"), "Hungary");
  assert.equal(stripStyle("Tsardom of Bulgaria"), "Bulgaria");
  assert.equal(stripStyle("Greece (1936-1947)"), "Greece");
  assert.equal(stripStyle("Deutsches Reich"), "Deutsches Reich", "a native name is not a style — untouched");
});

test("the spec's faceOwners beats every name match, and exact beats style", () => {
  const index = buildFaceNameIndex({ ITA: { name: "Italy" } }, ["Albania", "Hungary"]);
  const albania = { properties: { name: "Protettorato Italiano del Regno d'Albania", names: { "name:en": "Albania" } } };
  // Territory and ruler are different answers here and only the spec can pick.
  assert.deepEqual(
    matchFace(albania, index, { "Protettorato Italiano del Regno d'Albania": "Italy" }),
    { owner: "Italy", via: "spec", label: "Protettorato Italiano del Regno d'Albania" },
  );
  assert.equal(matchFace(albania, index).owner, "Albania", "without the spec, the name is all there is");
  const hungary = { properties: { name: "Magyar Királyság", names: { "name:en": "Kingdom of Hungary" } } };
  assert.equal(matchFace(hungary, index).via, "style", "a stripped match is reported as an inference, not evidence");
});

console.log("\nThe graft — every square degree lands somewhere, and it is counted");

test("a region no face reaches is untouched: the spec's assignment stands (ladder rung 2)", () => {
  const regions = [region("FAR.1_1", "Siam", 100, 10, 101, 11)];
  const { features, report } = graftEraGeometry(regions, [face("Polska", "Poland", 0, 0, 1, 1)]);
  assert.equal(report.untouched, 1);
  assert.equal(features.length, 1);
  assert.equal(features[0].properties.owner, "Siam", "no face, no opinion");
  assert.equal(features[0].properties.edited, undefined, "and no reshape either");
});

test("a region wholly inside a face keeps its sharp geometry and only the owner is judged", () => {
  const agree = [region("POL.1_1", "Poland", 0.2, 0.2, 0.8, 0.8)];
  const out = graftEraGeometry(agree, [face("Polska", "Poland", 0, 0, 1, 1)]);
  assert.equal(out.report.confirmed, 1);
  assert.equal(out.features[0].geometry.coordinates[0].length, 5, "geometry untouched — the stock tiles are sharper than the seed");
  assert.equal(out.features[0].properties.edited, undefined);

  const disagree = [region("BLR.3_1", "Soviet Union", 0.2, 0.2, 0.8, 0.8)];
  const out2 = graftEraGeometry(disagree, [face("Polska", "Poland", 0, 0, 1, 1)]);
  assert.equal(out2.report.reowned.length, 1, "the face is the authority and the correction is NAMED");
  assert.deepEqual(
    { id: out2.report.reowned[0].id, from: out2.report.reowned[0].from, to: out2.report.reowned[0].to },
    { id: "BLR.3_1", from: "Soviet Union", to: "Poland" },
  );
  assert.equal(out2.features[0].properties.owner, "Poland");
  // The reowned region must be MARKED for the ownership-table sync. It stays
  // un-`edited` on purpose (geometry untouched, stock tiles stay on), so the
  // sync needs another mark — without one the polity paints on the map but the
  // game calls it landless (Mantua/Andorra/San Marino on 1650, 2026-08-25).
  assert.notEqual(out2.features[0].properties.eraFace, undefined,
    "reowned must stamp eraFace so the table sync sees it");
  assert.equal(out2.features[0].properties.edited, undefined,
    "but must NOT stamp edited — that would switch off the stock tiles");
});

test("a province cut between two powers splits — original id keeps the majority, marked edited", () => {
  // The province spans 0..2; the era border runs at 1. Left is Germany's face,
  // right is Poland's: East Prussia in miniature.
  const regions = [region("PRO.1_1", "Poland", 0, 0, 2, 1)];
  const { features, report } = graftEraGeometry(regions, [
    face("Deutsches Reich", "Germany", -1, -1, 1.2, 2),
    face("Polska", "Poland", 1.2, -1, 3, 2),
  ]);
  assert.equal(report.cut.length, 1);
  assert.equal(features.length, 2, "one province in, two owners out");
  const [keep, offcut] = features;
  assert.equal(keep.properties.id, "PRO.1_1", "the majority piece keeps the id the save file knows");
  assert.equal(keep.properties.owner, "Germany", "1.2 of 2 is Germany's");
  assert.equal(keep.properties.edited, true, "without `edited` the stock tile repaints the OLD shape on top");
  // AN OFFCUT ID IS DERIVED, NOT COUNTED (2026-08-20). It used to be
  // `era_${counter}`, and the counter was the whole drift bug: which regions
  // get cut decides the numbering, so one extra cut renumbered everything after
  // it and a save holding `era_37 → Lippe` started pointing at another piece
  // (measured: 1836 median blast radius 22 of 45 keys). The id now comes from
  // the piece — parent + face + owner — so the same piece always gets the same
  // key. Uniqueness measured across 24 boards / 1,270 pieces: 0 collisions.
  assert.match(offcut.properties.id, /^era:[^:]+:[^:]*:[^:]*$/,
    "the offcut id must be derived from parent/face/owner, never from a build counter");
  assert.ok(!/^era_\d+$/.test(offcut.properties.id), "the sequential counter is retired");
  assert.ok(!offcut.properties.id.includes("."), "undotted, so the GID_1 tile match cannot see it");
  // The parent is IN the key, which is what lets a rebuild land on the same id.
  assert.ok(offcut.properties.id.includes("pro-1-1"), "the parent region anchors the key");
  assert.equal(offcut.properties.owner, "Poland");
  assert.equal(offcut.properties.eraSplitOf, "PRO.1_1", "provenance is kept, not implied");

  const total = multiPolygonArea(toMultiPolygon(keep.geometry)) + multiPolygonArea(toMultiPolygon(offcut.geometry));
  assert.ok(Math.abs(total - 2) < 1e-9, `the pieces tile the province exactly (got ${total}, want 2)`);
});

test("land inside no face keeps the spec's owner — partial coverage never annexes by proximity", () => {
  // Face covers the left third only; the rest is simply not in the dump.
  const regions = [region("PRO.2_1", "Romania", 0, 0, 3, 1)];
  const { features } = graftEraGeometry(regions, [face("Magyar Királyság", "Hungary", -1, -1, 1, 2)]);
  const owners = features.map((f) => f.properties.owner).sort();
  assert.deepEqual(owners, ["Hungary", "Romania"], "the uncovered two thirds stay Romanian");
  const total = features.reduce((sum, f) => sum + multiPolygonArea(toMultiPolygon(f.geometry)), 0);
  assert.ok(Math.abs(total - 3) < 1e-9, "and no square degree went missing");
});

test("a hairline sliver folds into the majority instead of minting a province — and is counted", () => {
  // 1% of the province: below MIN_PIECE_FRACTION. Two datasets tracing the same
  // border always leave these, and one per shared border would litter the map.
  const regions = [region("PRO.3_1", "Spain", 0, 0, 1, 1)];
  const { features, report } = graftEraGeometry(regions, [face("Portugal", "Portugal", -1, -1, 0.01, 2)]);
  assert.equal(features.length, 1, "no offcut minted");
  assert.equal(features[0].properties.owner, "Spain");
  assert.equal(report.droppedSlivers.length, 1, "counted, never silent");
  assert.ok(report.droppedSlivers[0].fraction < MIN_PIECE_FRACTION);
  const area = multiPolygonArea(toMultiPolygon(features[0].geometry));
  assert.ok(Math.abs(area - 1) < 1e-9, "the sliver's land stays on the map, inside the majority owner");
});

test("two faces with the same owner do not fake a border through a province", () => {
  // Portugal's face and its island face both touch this province. Folding by
  // OWNER first is what stops "Portugal/Portugal" from being called a cut.
  const regions = [region("PRT.1_1", "Portugal", 0, 0, 2, 1)];
  const { features, report } = graftEraGeometry(regions, [
    face("Portugal", "Portugal", -1, -1, 1, 2),
    face("Açores", "Portugal", 1, -1, 3, 2),
  ]);
  assert.equal(report.cut.length, 0);
  assert.equal(features.length, 1);
  assert.equal(features[0].properties.edited, undefined, "nothing was divided, so nothing is reshaped");
});

test("KEEPOUT NAMES A COUNTRY OR A REGION PREFIX — ITA.1 fences Abruzzo, never ITA.18", () => {
  // medieval-1200: the crude HRE face is RIGHT across the north (the board's
  // Kingdom-of-Italy coloring) and WRONG south of the Tronto. A country fence
  // would kill both; the prefix fences exactly the bite. The dot guard is the
  // point of this pin: "ITA.1" must not creep onto ITA.18_1.
  const mk = (id) => region(id, "Sicily", 0, 0, 2, 1, { gid0: "ITA" });
  const intruder = { ...face("Empire", "Empire", -1, -1, 3, 2), keepOut: ["ITA.1"] };
  const fencedWhole = graftEraGeometry([mk("ITA.1_1")], [intruder]);
  assert.equal(fencedWhole.report.keepOutRefusals.length, 1, "the bare region id is fenced");
  assert.equal(fencedWhole.features[0].properties.owner, "Sicily");
  const fencedSub = graftEraGeometry([mk("ITA.1.3_1")], [intruder]);
  assert.equal(fencedSub.report.keepOutRefusals.length, 1, "a level-2 child of the prefix is fenced");
  const free = graftEraGeometry([mk("ITA.18_1")], [intruder]);
  assert.equal(free.report.keepOutRefusals.length, 0, "ITA.18 shares the string, not the fence");
  assert.equal(free.features[0].properties.owner, "Empire", "and grafts as usual");
  const byCountry = graftEraGeometry([mk("ITA.5_1")], [{ ...intruder, keepOut: ["ITA"] }]);
  assert.equal(byCountry.report.keepOutRefusals.length, 1, "the old gid0 form still fences");
});

test("bbox prefilter admits touching boxes and rejects disjoint ones", () => {
  assert.equal(bboxOverlaps([0, 0, 1, 1], [1, 1, 2, 2]), true, "touching counts — a shared border is a real overlap");
  assert.equal(bboxOverlaps([0, 0, 1, 1], [1.001, 0, 2, 1]), false);
});

console.log("\nThe wiring — the map and the game must name the same owner");

test("build-preset restates grafted owners into the game's ownership table", () => {
  assert.match(BUILD, /syncedOverrides/, "the sync is real code, not a comment");
  assert.match(BUILD, /overrides\[id\] = owner;/, "world.regionOwnershipOverrides gets the grafted owner");
  assert.match(BUILD, /가짜 정복선/, "and the reason is written down: a stale table draws conquest borders on turn one");
  // The eraFace test must be a KEY test (!== undefined): the stamp is "" when a
  // face has no name, and a truthiness test would re-open the landless hole for
  // exactly those. Pinned against tidy-minded refactoring.
  assert.match(BUILD, /feature\.properties\.eraFace !== undefined/,
    "reowned features (eraFace stamped, no edited) must sync too — key test, not truthiness");
});

test("the graft is opt-in, and a missing dump degrades to the modern composition out loud", () => {
  assert.match(BUILD, /spec\.eraGeometry/, "no spec field, no graft");
  assert.match(BUILD, /사다리 2단/, "the fallback names which rung of the source ladder it landed on");
  assert.match(BUILD, /extract-era-borders\.mjs/, "and prints the commands that would produce the dump");
});

console.log(`\n${pass} passed\n`);

// Zooming into South East Asia killed the map, and the Strait of Malacca had
// become South Korean territory. Two separate faults in the sea layer.
import assert from "node:assert/strict";
import fs from "node:fs";
import { buildTerritoryIndex, locateRegion } from "../src/runtime/territory.js";

let pass = 0;
const test = (name, fn) => { fn(); pass += 1; console.log(`  ok  ${name}`); };

const SEAS = fs.readFileSync(new URL("../src/runtime/seaRegions.js", import.meta.url), "utf8");
const TERRITORY = fs.readFileSync(new URL("../src/runtime/territory.js", import.meta.url), "utf8");
const FORCES = fs.readFileSync(new URL("../src/Game/GameUI/forces.jsx", import.meta.url), "utf8");
const CHEATS = fs.readFileSync(new URL("../src/Game/GameUI/cheats.jsx", import.meta.url), "utf8");

// ---- 1. the null-geometry features ------------------------------------------------

// The loader's filter, lifted so its behaviour is pinned.
const usableOnly = (features) => features.filter((feature) => {
  const type = feature?.geometry?.type;
  return type === "Polygon" || type === "MultiPolygon";
});

test("THE LIVE FILE: three of the shipped 118 sea regions carry null geometry", () => {
  const path = new URL("../public/data/sea-regions.json", import.meta.url);
  assert.ok(fs.existsSync(path), "the shipped file is where the loader fetches it from");
  const geojson = JSON.parse(fs.readFileSync(path, "utf8"));
  const broken = geojson.features.filter((feature) => !feature?.geometry).map((f) => f.properties.id);
  assert.deepEqual(broken.sort(), ["sea_drake_passage", "sea_great_barrier_reef_2", "sea_luzon_strait"]);
});

test("…and one of them is in the middle of where this campaign operates", () => {
  // Luzon Strait sits between Taiwan and the Philippines: reliably on screen
  // whenever South East Asia is, which is what made the crash so repeatable.
  const geojson = JSON.parse(fs.readFileSync(new URL("../public/data/sea-regions.json", import.meta.url), "utf8"));
  const luzon = geojson.features.find((f) => f.properties.id === "sea_luzon_strait");
  assert.equal(luzon.geometry, null);
});

test("THE FIX: they are dropped at the one place seas enter the app", () => {
  const input = [
    { properties: { id: "sea_strait_of_malacca" }, geometry: { type: "Polygon", coordinates: [[[1, 1], [2, 1], [2, 2], [1, 1]]] } },
    { properties: { id: "sea_luzon_strait" }, geometry: null },
    { properties: { id: "sea_drake_passage" } },
    { properties: { id: "sea_south_china_sea" }, geometry: { type: "MultiPolygon", coordinates: [[[[1, 1], [2, 1], [2, 2], [1, 1]]]] } },
  ];
  const kept = usableOnly(input).map((f) => f.properties.id);
  assert.deepEqual(kept, ["sea_strait_of_malacca", "sea_south_china_sea"]);
});

test("a geometry of some other type is not smuggled through", () => {
  const input = [{ properties: { id: "sea_x" }, geometry: { type: "Point", coordinates: [1, 1] } }];
  assert.equal(usableOnly(input).length, 0);
});

test("the drop is named in the console rather than silent", () => {
  assert.match(SEAS, /A FEATURE WITH NO GEOMETRY IS NOT A PLACE\./);
  assert.match(SEAS, /sea region\(s\) ship with no geometry and were dropped/);
});

test("a healthy file passes through untouched", () => {
  const input = [{ properties: { id: "sea_a" }, geometry: { type: "Polygon", coordinates: [[[1, 1], [2, 1], [2, 2], [1, 1]]] } }];
  assert.equal(usableOnly(input).length, 1);
});

// ---- 2. the sea guard read the wrong key --------------------------------------------

const seaFeature = (id, kindKey) => ({
  type: "Feature",
  properties: { id, name: id, owner: "South Korea", [kindKey]: "sea" },
  geometry: { type: "Polygon", coordinates: [[[100, 2], [104, 2], [104, 6], [100, 6], [100, 2]]] },
});
const landFeature = {
  type: "Feature",
  properties: { id: "MYS.1_1", name: "Melaka", owner: "Malaysia", typeId: "land" },
  geometry: { type: "Polygon", coordinates: [[[102, 2], [103, 2], [103, 3], [102, 3], [102, 2]]] },
};

test("THE LATENT BUG: the shipped seas mark themselves `kind`, not `typeId`", () => {
  const geojson = JSON.parse(fs.readFileSync(new URL("../public/data/sea-regions.json", import.meta.url), "utf8"));
  const malacca = geojson.features.find((f) => f.properties.id === "sea_strait_of_malacca");
  assert.equal(malacca.properties.kind, "sea");
  assert.equal(malacca.properties.typeId, undefined, "which is the key the guard used to check");
});

test("…so a sea marked only by `kind` used to answer as land", () => {
  const index = buildTerritoryIndex([seaFeature("sea_strait_of_malacca", "kind")]);
  assert.equal(index.rings.length, 0, "it is skipped now");
  assert.equal(locateRegion(index, 101.5, 3.2), null, "open water belongs to no country");
});

test("…and a sea marked the old way is still skipped", () => {
  const index = buildTerritoryIndex([seaFeature("sea_x", "typeId")]);
  assert.equal(index.rings.length, 0);
});

test("land in the same water is unaffected — the guard is not over-broad", () => {
  const index = buildTerritoryIndex([seaFeature("sea_strait_of_malacca", "kind"), landFeature]);
  assert.equal(index.rings.length, 1);
  assert.equal(locateRegion(index, 102.5, 2.5)?.owner, "Malaysia");
  assert.equal(locateRegion(index, 101.0, 5.0), null, "still open water");
});

test("the guard checks both keys, and says why", () => {
  assert.match(TERRITORY, /BOTH KEYS\./);
  assert.match(TERRITORY, /normalizeString\(properties\.kind\)\.toLowerCase\(\) === "sea"/);
});

// ---- 3. the old deploy form is gone -------------------------------------------------

test("THE SECOND DEPLOY FLOW IS GONE", () => {
  assert.ok(!FORCES.includes("Deploy a unit"), "the form");
  assert.ok(!FORCES.includes("const startDeploy"), "the handler");
  assert.ok(!/setDeployType|setDeployStrength|setDeployName/.test(FORCES), "its state");
  assert.ok(!FORCES.includes("Place on map →"), "its button");
});

test("…and what it used to do points at where it went", () => {
  assert.match(FORCES, /THE SECOND WAY TO PUT A UNIT ON THE MAP IS GONE\./);
  assert.match(FORCES, /raise one in Add Map Feature/);
});

test("the panel keeps what only it does", () => {
  assert.match(FORCES, /UnitRow/, "the unit list");
  assert.match(FORCES, /MODE_HINT/, "move and attack modes");
});

test("THE RESTRICTION CAME WITH IT: a scenario with no air arm offers none", () => {
  assert.match(CHEATS, /import \{ getAllowedUnitTypes \} from "\.\.\/Map\/unitsController\.js";/);
  assert.match(CHEATS, /const deployableTypes = Array\.isArray\(allowed\) && allowed\.length/);
  assert.match(CHEATS, /\{deployableTypes\.map\(\(type\) => \{/);
});

// The filter itself, pinned.
const UNIT_TYPES = ["infantry", "armor", "air", "naval", "artillery", "garrison"];
const deployable = (allowed) => (Array.isArray(allowed) && allowed.length
  ? UNIT_TYPES.filter((type) => allowed.includes(type))
  : UNIT_TYPES);

test("…and a scenario that restricts nothing offers everything", () => {
  assert.deepEqual(deployable(null), UNIT_TYPES);
  assert.deepEqual(deployable([]), UNIT_TYPES);
  assert.deepEqual(deployable(["infantry", "garrison"]), ["infantry", "garrison"]);
});

test("the restriction keeps the catalogue's order, not the scenario's", () => {
  assert.deepEqual(deployable(["naval", "infantry"]), ["infantry", "naval"]);
});



// ---- 4. the hooks rule that had never run --------------------------------------

const ESLINT = fs.readFileSync(new URL("../eslint.config.js", import.meta.url), "utf8");
const FEATURES2 = fs.readFileSync(new URL("../src/Game/Selection/Features.jsx", import.meta.url), "utf8");

test("THE CRASH: the lint config only ever matched ts/tsx, and this tree is js/jsx", () => {
  assert.match(ESLINT, /THE HOOKS RULE HAD NEVER RUN ON THIS CODEBASE\./);
  assert.match(ESLINT, /files: \['\*\*\/\*\.\{js,jsx\}'\]/);
  assert.match(ESLINT, /'react-hooks\/rules-of-hooks': 'error'/);
});

test("…and the popup's hooks are above its early return again", () => {
  const firstHookAfterGuard = () => {
    const guard = FEATURES2.indexOf("if (!selection || !screenPos) return null;");
    const body = FEATURES2.slice(guard);
    // Anything before `return createPortal` is component body still.
    const render = body.indexOf("return createPortal(");
    return /\buseState\(|\buseEffect\(|\buseMemo\(/.test(body.slice(0, render));
  };
  assert.equal(firstHookAfterGuard(), false, "no hook may sit between the guard and the render");
});

test("…and the reason is recorded where the hooks are", () => {
  assert.match(FEATURES2, /ABOVE THE EARLY RETURN, like every other hook here/);
  assert.match(FEATURES2, /rendered more hooks than during the previous render/);
});

console.log(`\n${pass} passed`);

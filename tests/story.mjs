// Round 39's three reports: the paragraph that printed itself twice one hyphen
// apart, the English brand names taking root, and a background story that
// retold thirty rounds instead of chaptering like the original.
import assert from "node:assert/strict";
import fs from "node:fs";
import { repairGluedAction } from "../src/runtime/machineSyntax.js";

let pass = 0;
const test = (name, fn) => { fn(); pass += 1; console.log(`  ok  ${name}`); };

const GAMEPLAY = fs.readFileSync(new URL("../src/Game/AI/gameplay.js", import.meta.url), "utf8");
const ADVISOR = fs.readFileSync(new URL("../src/Game/GameUI/advisor.jsx", import.meta.url), "utf8");

console.log("\nNear-equal glued halves are one text");

test("the live case: hyphen vs underscore is the same paragraph, kept once", () => {
  const tail = "사우디, UAE와 협력하여 'Quantum-Trace' 공급망 자동화 체계를 구축하십시오.";
  const existing = "사우디, UAE와 협력하여 'Quantum_Trace' 공급망 자동화 체계를 구축하십시오.";
  const repaired = repairGluedAction({ title: `Quantum-Trace 물류 추적 시스템", "text": "${tail}`, text: existing });
  assert.equal(repaired.title, "Quantum-Trace 물류 추적 시스템");
  assert.equal(repaired.text.split("구축하십시오").length - 1, 1, "one copy, not two");
});

test("punctuation and spacing differences also count as the same writing", () => {
  const repaired = repairGluedAction({
    title: `제목", "text": "국경  순찰을 강화하고, 예비군을 점검하십시오.`,
    text: "국경 순찰을 강화하고 예비군을 점검하십시오.",
  });
  assert.equal(repaired.text.split("점검하십시오").length - 1, 1);
});

test("genuinely different texts still both survive — that rule did not move", () => {
  const repaired = repairGluedAction({
    title: `제목", "text": "완전히 다른 첫 문장입니다.`,
    text: "원래 있던 두 번째 내용입니다.",
  });
  assert.ok(repaired.text.includes("완전히") && repaired.text.includes("원래"));
});

test("the longer of two near-equal copies is the one kept", () => {
  const longer = "사우디, UAE와 협력하여 'Quantum-Trace' 공급망 자동화 체계를 구축하십시오!";
  const repaired = repairGluedAction({ title: `제목", "text": "${longer}`, text: "사우디 UAE와 협력하여 Quantum Trace 공급망 자동화 체계를 구축하십시오" });
  assert.equal(repaired.text, longer);
});

console.log("\nNew names belong to the game's language");

test("the suggestions task carries the naming rule, canon exempted", () => {
  const at = GAMEPLAY.indexOf('if (taskKey === "actions")');
  const block = GAMEPLAY.slice(at, at + 4200);
  assert.match(block, /\[Naming\]/);
  assert.match(block, /never coin an English brand name/);
  assert.match(block, /keeps its existing name/);
});

test("the jump carries it too — events and markers coin names as well", () => {
  const at = GAMEPLAY.indexOf('["jumpForward", "autoJumpForward"].includes(taskKey)');
  const block = GAMEPLAY.slice(at, GAMEPLAY.indexOf("[Map Truth]", at));
  assert.match(block, /\[Naming\]/);
  assert.match(block, /continuity passes match it by name/);
});

console.log("\nA standing reported in Korean still lands");

test("candidates bridge through their translated label back to the listed name", () => {
  const at = GAMEPLAY.indexOf("const listedNameFor = new Map()");
  assert.notEqual(at, -1);
  const block = GAMEPLAY.slice(at, at + 900);
  assert.match(block, /translateLabel\(candidate\)/);
  assert.match(block, /toCountryName\(candidate\)/);
  assert.match(block, /country: listed/);
});

test("the prompt demands exact copies, and off-list still drops by name", () => {
  assert.match(GAMEPLAY, /copied EXACTLY as listed/);
  assert.match(GAMEPLAY, /not on this period's list/);
});

console.log("\nThe story is chaptered like the original");

test("the narrative covers only rounds past the consolidation boundary", () => {
  const at = GAMEPLAY.indexOf("export const generateBackstory");
  const block = GAMEPLAY.slice(at, at + 3600);
  assert.match(block, /const boundaryRound = Number\(chapters\.at\(-1\)\?\.throughRound\) \|\| 0;/);
  assert.match(block, /> boundaryRound/);
  assert.match(block, /Write ONLY the CURRENT CHAPTER/);
  assert.match(block, /How The Last Chapter Ended/);
  assert.match(block, /fromRound: boundaryRound \+ 1/);
});

test("a consolidation overtaking the chapter forces a rewrite regardless of age", () => {
  assert.match(GAMEPLAY, /const overtaken = cachedRound > 0 && boundary >= chapterFrom;/);
  assert.match(GAMEPLAY, /absorbed the current chapter's opening rounds/);
});

test("the pane renders every chapter reachable, one at a time", () => {
  // The stacked block list became the chip strip + single detail view; what
  // this still pins is that every chapter is present and selectable.
  assert.match(ADVISOR, /chapters\.map\(\(entry, index\)/);
  assert.match(ADVISOR, /Chapter \{selectedChapter \+ 1\}/);
});

test("the round-summary list holds only the current chapter's rounds", () => {
  assert.match(ADVISOR, /\(Number\(entry\?\.round\) \|\| 0\) > boundaryRound/);
  assert.match(ADVISOR, /Round summaries — current chapter/);
});

test("the export walks chapters, then the current narrative, then its rounds", () => {
  const at = ADVISOR.indexOf("const handleExport");
  const block = ADVISOR.slice(at, at + 800);
  assert.match(block, /## Chapter \$\{index \+ 1\}/);
  assert.match(block, /## The current chapter/);
  assert.match(block, /### Round \$\{entry\.round/);
});

console.log("\nChapters are a horizontal strip, outside the scroll");

test("a chip strip that scrolls sideways and never adds vertical scroll", () => {
  // flexShrink 0 + its own overflowX, mounted BEFORE the scrollable content div.
  const strip = ADVISOR.indexOf('flexShrink: 0, gap: "0.35rem", overflowX: "auto"');
  const scroller = ADVISOR.indexOf('overflowY: "auto", padding: "0.75rem"');
  assert.ok(strip !== -1 && scroller !== -1 && strip < scroller, "strip sits above the scroll area");
});

test("one thing shows below: the picked chapter, or the current story", () => {
  assert.match(ADVISOR, /const \[selectedChapter, setSelectedChapter\] = useState\("current"\);/);
  assert.match(ADVISOR, /typeof selectedChapter === "number" && chapters\[selectedChapter\] \? \(/);
  assert.match(ADVISOR, /selectedChapter === "current" && rounds\.length > 0/);
});

test("a chip carries its chapter number and date; tapping it again returns to now", () => {
  assert.match(ADVISOR, /\{"§"\}\{index \+ 1\}/);
  assert.match(ADVISOR, /setSelectedChapter\(active \? "current" : index\)/);
  assert.match(ADVISOR, /title=\{String\(entry\.summary\)\.split\("\\n"\)\[0\]\}/);
});

const WORLD = fs.readFileSync(new URL("../src/Game/Map/World.jsx", import.meta.url), "utf8");
const ASSETS = fs.readFileSync(new URL("../src/runtime/assets.js", import.meta.url), "utf8");
const SETTINGS_UI = fs.readFileSync(new URL("../src/Game/GameUI/settings.jsx", import.meta.url), "utf8");

console.log("\nPlan F: the era's own map under the political one");

test("OHM is a style URL, not a raster template, and the picker offers it", () => {
  assert.match(ASSETS, /OHM_STYLE_URL = "https:\/\/www\.openhistoricalmap\.org\/map-styles\/main\/main\.json"/);
  assert.match(SETTINGS_UI, /OpenHistoricalMap \(era\)/);
});

test("the campaign clock filters the basemap, re-applied on style rebuilds", () => {
  assert.match(WORLD, /@openhistoricalmap\/maplibre-gl-dates/);
  // The NAMED export, called with the map. The side-effect import silently did
  // nothing in a bundled app (the plugin only patches the prototype when a
  // global maplibregl exists) — round 41's console: "filterByDate is not a
  // function" on every styledata.
  assert.match(WORLD, /import \{ filterByDate as filterOhmByDate \}/);
  assert.match(WORLD, /filterOhmByDate\(map, ohmDate\)/);
  assert.match(WORLD, /map\.on\("styledata", apply\)/);
});

test("the style is rebuilt before it mounts: no foreign labels, no 404 rain", () => {
  // Round 41's console flood: hundreds of static-tiles PNG 404s (sparse raster
  // backdrop) and glyph 404s for nearly every Latin range. The transform drops
  // symbol layers and raster sources at the source and removes the glyphs
  // endpoint so OUR labels rasterize locally, like on every other basemap.
  const at = WORLD.indexOf("const transformOhmStyle");
  assert.notEqual(at, -1);
  const block = WORLD.slice(at, at + 900);
  assert.match(block, /source\?\.type === "raster"/);
  assert.match(block, /layer\?\.type !== "symbol" && !rasterSources\.has\(layer\?\.source\)/);
  assert.match(block, /delete next\.glyphs;/);
  // While it loads: a neutral backdrop, never a satellite flash; on a failed
  // fetch: the raw URL and the styledata scrub as before.
  assert.match(WORLD, /ohmStyle \?\? OHM_LOADING_STYLE/);
  assert.match(WORLD, /setOhmStyle\(OHM_STYLE_URL\)/);
});

test("a scenario's own uploaded map still beats the OHM choice", () => {
  assert.match(WORLD, /ohmActive = activeBasemap === OHM_BASEMAP_ID && !customBg && !bgDeclared/);
});

test("terrain never references a source the OHM style does not carry", () => {
  assert.match(WORLD, /!bgDeclared && !ohmActive/);
});

test("the atlases the game points at but never copies", () => {
  // Omniatlas and GeaCron are all-rights-reserved commercial atlases with no
  // API — integration is date-synced LINKS, stated as such in the UI.
  assert.match(SETTINGS_UI, /Era atlas cross-reference/);
  assert.match(SETTINGS_UI, /omniatlas\.com\/maps\/\$\{region\}\/\$\{stamp\}\//);
  assert.match(SETTINGS_UI, /geacron\.com\/map\/atlas\/mapal\.html/);
  assert.match(SETTINGS_UI, /links to them and never copies their data/);
  // The date is read at click time, never polled for an idle panel.
  assert.match(SETTINGS_UI, /read at click time/);
  // A missing date degrades to the atlas index, not a broken URL.
  assert.match(SETTINGS_UI, /https:\/\/omniatlas\.com\/maps\/"/);
});

test("the OHM basemap keeps its geography and loses its words", () => {
  assert.match(WORLD, /const OWN_MAP_SOURCES = new Set\(/);
  assert.match(WORLD, /layer\.type !== "symbol" \|\| OWN_MAP_SOURCES\.has\(layer\.source\)/);
  assert.match(WORLD, /setLayoutProperty\(layer\.id, "visibility", "none"\)/);
});

test("the dependency is real, not assumed", () => {
  const pkg = JSON.parse(fs.readFileSync(new URL("../package.json", import.meta.url), "utf8"));
  assert.ok(pkg.dependencies["@openhistoricalmap/maplibre-gl-dates"]);
});

console.log(`\n${pass} passed\n`);

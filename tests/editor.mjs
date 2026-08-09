// The engine's vocabulary out of the player's orders, the same city listed
// twice, and a feature editor with no bottom.
import assert from "node:assert/strict";
import fs from "node:fs";
import { repairHalfRomanized, stripMachineSyntax } from "../src/runtime/machineSyntax.js";
import { normalizeActionEntry, normalizeMarkerEntry } from "../src/runtime/gameState.js";
import { searchCitySeed } from "../src/runtime/cityFeatures.js";

let pass = 0;
const test = (name, fn) => { fn(); pass += 1; console.log(`  ok  ${name}`); };

const CHEATS = fs.readFileSync(new URL("../src/Game/GameUI/cheats.jsx", import.meta.url), "utf8");
const NATIONS = fs.readFileSync(new URL("../src/Game/Map/Nations.jsx", import.meta.url), "utf8");
const MARKERS = fs.readFileSync(new URL("../src/Game/Map/MarkersLayer.jsx", import.meta.url), "utf8");

console.log("\nA region id is not something a player reads");

test("the exact orders from the live save come out clean", () => {
  // Two of the 42, verbatim.
  assert.equal(
    stripMachineSyntax("경기(KOR.8_1) 및 인천(KOR.11_1) 외의 지방 거점에 집중 투자합니다."),
    "경기 및 인천 외의 지방 거점에 집중 투자합니다.");
  assert.equal(
    stripMachineSyntax("부산(KOR.1_1)과 울산(KOR.17_1) 항만을 중심으로"),
    "부산과 울산 항만을 중심으로");
});

test("every order field is scrubbed, the prompt-facing one included", () => {
  const entry = normalizeActionEntry({
    title: "제주(KOR.12_1) 바이오 특구",
    text: "제주(KOR.12_1)를 바이오 안보 특구로 강화합니다.",
    rawInput: "Jeju(KOR.12_1) 를 바이오 안보 특구로 강화합니다.",
  }, 0);
  assert.ok(!entry.title.includes("KOR."), entry.title);
  assert.ok(!entry.text.includes("KOR."), entry.text);
  // rawInput rides in every later prompt — leaving ids there feeds the habit back.
  assert.ok(!entry.rawInput.includes("KOR."), entry.rawInput);
});

test("a hand-typed order with no ids is byte-identical", () => {
  const text = "국경 순찰을 강화하고, 예비군 소집 절차를 점검하십시오.";
  assert.equal(normalizeActionEntry({ text }, 0).text, text);
});

test("an order made only of an id is not emptied", () => {
  // stripMachineSyntax must never eat a field whole.
  assert.equal(stripMachineSyntax("(KOR.8_1)"), "(KOR.8_1)");
});

console.log("\nA half-translated province name");

test("강원-do is 강원도", () => {
  assert.equal(repairHalfRomanized("강원-do(KOR.6_1) 및 경상도 지역에"), "강원도(KOR.6_1) 및 경상도 지역에");
  assert.equal(stripMachineSyntax("강원-do(KOR.6_1) 및 경상도 지역에"), "강원도 및 경상도 지역에");
});

test("every suffix the catalog actually uses", () => {
  assert.equal(repairHalfRomanized("경기-do"), "경기도");
  assert.equal(repairHalfRomanized("성남-si"), "성남시");
  assert.equal(repairHalfRomanized("양평-gun"), "양평군");
  assert.equal(repairHalfRomanized("강남-gu"), "강남구");
  assert.equal(repairHalfRomanized("강남-DONG"), "강남동");
});

test("it cannot touch a name that was never half-translated", () => {
  assert.equal(repairHalfRomanized("Gangwon-do"), "Gangwon-do");
  assert.equal(repairHalfRomanized("Jeollanam-do (KOR.14_1)"), "Jeollanam-do (KOR.14_1)");
  assert.equal(repairHalfRomanized("K-Shield 인증 항구"), "K-Shield 인증 항구");
  assert.equal(repairHalfRomanized("한-미 동맹"), "한-미 동맹");
  assert.equal(repairHalfRomanized("반도체-공급망"), "반도체-공급망");
});

test("two letters was judged too small a target", () => {
  // "ri" is deliberately not in the table.
  assert.equal(repairHalfRomanized("메모-ri"), "메모-ri");
});

console.log("\nThe same city, listed twice");

const city = (name, lng, lat, population) => ({ name, coord: [lng, lat], population });

test("Springfield, Missouri stops appearing twice", () => {
  // The live pair, verbatim from the seed.
  const seed = [
    city("Springfield", -93.25195, 37.16032, 289041),
    city("Springfield", -93.2959, 37.19533, 289041),
  ];
  assert.equal(searchCitySeed(seed, "springfield").length, 1);
});

test("…and the copy that survives is the one the ranking preferred", () => {
  const seed = [
    city("Springfield", -93.2959, 37.19533, 289041),
    city("Springfield", -93.25195, 37.16032, 289041),
  ];
  const [kept] = searchCitySeed(seed, "springfield");
  assert.equal(kept.coord[0], -93.2959, "first at equal rank and population wins");
});

test("two different cities of the same name are still two", () => {
  // Springfield MA (438,889) vs Springfield MO (289,041): different populations.
  const seed = [
    city("Springfield", -72.54272, 42.11452, 438889),
    city("Springfield", -93.25195, 37.16032, 289041),
  ];
  assert.equal(searchCitySeed(seed, "springfield").length, 2);
});

test("the far-apart coincidence survives the merge", () => {
  // Same name, identical population, opposite sides of the world — 34 such pairs
  // exist in the seed, up to 15,786 km apart. Distance is what keeps them apart.
  const seed = [
    city("Victoria", -123.36, 48.43, 1200),
    city("Victoria", 145.0, -37.0, 1200),
  ];
  assert.equal(searchCitySeed(seed, "victoria").length, 2);
});

test("the threshold sits in the measured gap, not on either side of it", () => {
  const near = [city("Twin", 0, 0, 5000), city("Twin", 0.2, 0, 5000)]; // ~22 km
  const far = [city("Twin", 0, 0, 5000), city("Twin", 0.4, 0, 5000)]; // ~45 km
  assert.equal(searchCitySeed(near, "twin").length, 1, "22 km is inside the duplicate spread");
  assert.equal(searchCitySeed(far, "twin").length, 2, "45 km is past where coincidences begin");
});

test("a duplicate never eats a slot a different city should have had", () => {
  const seed = [
    city("Ashfield", 0, 0, 100), city("Ashfield", 0.01, 0, 100), // one city, twice
    city("Ashfield", 50, 20, 90),
  ];
  const found = searchCitySeed(seed, "ashfield", 2);
  assert.equal(found.length, 2);
  assert.equal(new Set(found.map((c) => c.coord[0])).size, 2);
});

console.log("\nA feature carries the player's own filing and paint");

const marker = (extra) => normalizeMarkerEntry({ name: "동해 관측소", kind: "radar station", lng: 129, lat: 37.5, ...extra }, 0);

test("tags are kept, deduped and bounded", () => {
  assert.deepEqual(marker({ tags: ["반도체", "반도체", " 서해 ", ""] }).tags, ["반도체", "서해"]);
  assert.equal(marker({ tags: Array.from({ length: 30 }, (_, i) => `t${i}`) }).tags.length, 12);
});

test("only a real colour is kept", () => {
  assert.equal(marker({ color: "#c0507a" }).color, "#c0507a");
  assert.equal(marker({ color: "#abc" }).color, "#abc");
  assert.equal("color" in marker({ color: "red" }), false);
  assert.equal("color" in marker({ color: "rgb(1,2,3)" }), false);
  assert.equal("color" in marker({ color: "" }), false);
});

test("an untagged, unpainted feature gains no keys", () => {
  const plain = marker({});
  assert.equal("tags" in plain, false);
  assert.equal("color" in plain, false);
});

test("the map actually paints the override, and falls back when it is absent", () => {
  assert.match(MARKERS, /rgb: marker\.color \|\| ownerColorString\(colorMap, marker\.ownerCode\)/);
});

console.log("\nProvince lines you can actually see");

test("they are heavier than they were", () => {
  // Second raise: 0.3/25% still drowned in the fill palette on the live map.
  const width = NATIONS.slice(NATIONS.indexOf("const regionsOutlinePaint"));
  assert.match(width, /7\.5, 0\.45 \* borderScale, 12, 1\.0 \* borderScale, 14, 1\.3 \* borderScale/);
  // The OPACITY values are what this pin was protecting — 0.35 and 0.8 of the
  // player's scale, capped at 0.85 so they never read as a hard border. The
  // ZOOMS they sit at became a setting (the original's "Border Fade Range"), so
  // they are named stops now; borderFadeStops keeps them where they were by
  // default and tests/map-rendering.mjs pins that remapping.
  assert.match(width, /fadeStops\[1\], Math\.min\(0\.85, 0\.35 \* borderScale\)/);
  assert.match(width, /fadeStops\[3\], Math\.min\(0\.85, 0\.8 \* borderScale\)/);
});

test("…and still lose to a national border at every zoom", () => {
  // Same evaluator as the border suite: the ranking is the invariant, not the numbers.
  const stops = (block) => [...block.matchAll(/(-?[\d.]+),\s*([\d.]+)\s*\*\s*borderScale/g)]
    .map(([, z, v]) => [Number(z), Number(v)]);
  const at = (s, zoom) => {
    if (zoom <= s[0][0]) return s[0][1];
    if (zoom >= s[s.length - 1][0]) return s[s.length - 1][1];
    for (let i = 1; i < s.length; i += 1) {
      const [z0, v0] = s[i - 1];
      const [z1, v1] = s[i];
      if (zoom <= z1) return v0 + ((v1 - v0) * (zoom - z0)) / (z1 - z0);
    }
    return s[s.length - 1][1];
  };
  // Slice each paint's WIDTH clause exactly: the opacity clause below it holds
  // Math.min(0.85, 0.25 * borderScale), whose numbers would parse as a stop.
  const widthOf = (name) => {
    const from = NATIONS.indexOf('"line-width"', NATIONS.indexOf(name));
    const to = NATIONS.indexOf('"line-opacity"', from);
    assert.ok(from !== -1 && to > from, `${name} width clause not found`);
    return NATIONS.slice(from, to);
  };
  const country = stops(widthOf("const countriesOutlinePaint"));
  const province = stops(widthOf("const regionsOutlinePaint"));
  // 2.0x, down from 2.5x: the second province raise trades some of the gap for
  // visibility. The country line stays at least twice the weight AND fully
  // opaque against a 0.85-capped province line, which is what keeps the map
  // reading as political.
  for (const zoom of [7.5, 9, 12, 14, 16]) {
    assert.ok(at(country, zoom) >= at(province, zoom) * 2.0,
      `z${zoom}: ${at(country, zoom)} vs ${at(province, zoom)}`);
  }
});

console.log("\nOne feature at a time, in the original's order");

test("the sections are the ones asked for, in the order asked for", () => {
  const order = ["Map feature search", "Feature selection", "Name and owner",
    "Placement and styling", "Tags", "Location", "Colour override"];
  let at = CHEATS.indexOf('if (tool === "edit-feature")');
  assert.notEqual(at, -1);
  for (const name of order) {
    // Either quoting form — a section that counts what it holds uses a template.
    const plain = CHEATS.indexOf(`section("${name}`, at);
    const templated = CHEATS.indexOf("section(`" + name, at);
    const found = plain === -1 ? templated : (templated === -1 ? plain : Math.min(plain, templated));
    assert.notEqual(found, -1, `${name} missing or out of order`);
    at = found;
  }
});

test("the kind catalogue replaces the original's free symbol", () => {
  const block = CHEATS.slice(CHEATS.indexOf('section("Placement and styling'), CHEATS.indexOf('section("Tags"'));
  assert.match(block, /<KindPicker/);
  assert.doesNotMatch(block, /symbol/i);
});

test("the panel no longer stacks three lists of expandable forms", () => {
  const block = CHEATS.slice(CHEATS.indexOf('if (tool === "edit-feature")'), CHEATS.indexOf('if (tool === "add-feature")'));
  assert.doesNotMatch(block, /Structures & landmarks \(/);
  assert.doesNotMatch(block, /Armies & units \(/);
  // Exactly one editing form, gated on there being a selection.
  assert.match(block, /\{selected && \(/);
  assert.match(block, /const selected = entries\.find/);
});

test("the list is filtered by owner, defaulting to the player's own", () => {
  const block = CHEATS.slice(CHEATS.indexOf('if (tool === "edit-feature")'), CHEATS.indexOf('if (tool === "add-feature")'));
  assert.match(block, /const scope = fields\.scope \?\? \(playerCode \? "mine" : "all"\)/);
  assert.match(block, /scopeButton\("all", "Everyone", entries\.length\)/);
  // Clicking a foreign feature on the map must not be swallowed by the filter.
  assert.match(block, /if \(hit\.owner !== playerCode\) setFields/);
});

test("nothing is capped at all any more", () => {
  // The 25-row list (and its named-cap counter) became a dropdown: every match
  // is an option, scrolling inside the control, so there is no cut to announce.
  const block = CHEATS.slice(CHEATS.indexOf('if (tool === "edit-feature")'), CHEATS.indexOf('if (tool === "add-feature")'));
  assert.doesNotMatch(block, /LIST_LIMIT/);
  assert.match(block, /<select/);
  assert.match(block, /pick a feature \(\$\{sorted\.length\}\)/);
});

test("search reads tags, not only the name the AI happened to give it", () => {
  const block = CHEATS.slice(CHEATS.indexOf('if (tool === "edit-feature")'), CHEATS.indexOf('if (tool === "add-feature")'));
  assert.match(block, /\$\{entry\.tags\.join\(" "\)\}/);
});

test("a blank coordinate still cannot delete a position", () => {
  const block = CHEATS.slice(CHEATS.indexOf('if (tool === "edit-feature")'), CHEATS.indexOf('if (tool === "add-feature")'));
  assert.match(block, /Number\.isFinite\(lng\) && lng >= -180 && lng <= 180 \? lng : entry\.lng/);
  assert.match(block, /Number\.isFinite\(lat\) && lat >= -90 && lat <= 90 \? lat : entry\.lat/);
});

test("the colour override can be given back", () => {
  const block = CHEATS.slice(CHEATS.indexOf('section("Colour override'), CHEATS.indexOf('if (tool === "add-feature")'));
  assert.match(block, /setFields\(\{ \.\.\.fields, color: "" \}\)/);
  assert.match(block, /Following its owner's colour/);
});

console.log(`\n${pass} passed\n`);

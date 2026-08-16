// THE POLISH CORRIDOR IS NARROW, AND THE BOARD KEPT WIDENING IT.
//
// Modern Pomorskie is not the Corridor. Its western end — Stolp and Lauenburg —
// was German Hinterpommern until 1945; its eastern end — Marienburg and
// Marienwerder — was West Prussia; Poland held the belt between them, and the
// river mouth was the Free City. One GADM province, three 1935 owners, and no
// level-2 subdivision to split it with.
//
// The era faces knew this all along. Point-tested against the 1935 hybrid:
//
//   Stolp · Lauenburg · Stettin      → Germany
//   Chojnice · Gdynia · Kartuzy      → Polska
//   Danzig                           → Freie Stadt Danzig
//   Marienburg · Marienwerder        → East Prussia
//
// What blocked it was the BASELINE, not the geometry. `Germany` and `East
// Prussia` are rung-3 faces; `Polska` and `Freie Stadt Danzig` are rung 1; and
// eraGeometry drops every rung-3 candidate for a region the moment a rung-1 face
// touches it (589 regions on this board). So no German face can ever reach
// Pomorskie, and the province stayed whatever the spec said — Poland, all of it,
// ends included.
//
// Flipping the baseline to Germany lets the rung-1 faces carve the Corridor and
// the Free City back out of it. Measured on the built board afterwards, fifteen
// towns of the belt, fifteen correct: the three-way cut lands where the atlas
// puts it. These pins hold the two things that produce that — the assignments,
// and the reason the baseline has to look backwards.
import assert from "node:assert/strict";
import fs from "node:fs";

let pass = 0;
const test = (name, fn) => { fn(); pass += 1; console.log(`  ok  ${name}`); };
const SPEC = fs.readFileSync(new URL("../scripts/presets/wwii-1935.spec.mjs", import.meta.url), "utf8");
const ERA = fs.readFileSync(new URL("../scripts/presets/lib/eraGeometry.mjs", import.meta.url), "utf8");

const assignedTo = (id) => {
  const hit = new RegExp(`"${id.replace(/\./g, "\\.")}"\\s*:\\s*"([A-Z]{3})"`).exec(SPEC);
  return hit ? hit[1] : null;
};

console.log("\nGermany's eastern frontier is the Versailles line, province by province");

test("the four provinces east of the Oder that stayed German are German", () => {
  // Breslau, Landsberg, Oppeln, Stettin — German for centuries and German until
  // the war ended. Assigning them to Poland drew the 1945 border on a 1935 map.
  for (const [id, place] of [
    ["POL.1_1", "Niederschlesien (Breslau)"],
    ["POL.5_1", "Ostbrandenburg (Landsberg)"],
    ["POL.8_1", "Oberschlesien (Oppeln)"],
    ["POL.16_1", "Pommern (Stettin)"],
  ]) {
    assert.equal(assignedTo(id), "GER", `${id} — ${place}`);
  }
});

test("East Prussia is German on both sides of the 1945 line", () => {
  assert.equal(assignedTo("POL.14_1"), "GER", "southern East Prussia (Allenstein)");
  assert.equal(assignedTo("RUS.21_1"), "GER", "Königsberg");
});

test("Pomorskie's baseline looks backwards ON PURPOSE, so the faces can cut it", () => {
  // The one province with three owners. If this ever reads POL, the Corridor
  // swallows Stolp and Marienburg again and nothing in the build log says so —
  // the cut roster would simply stop mentioning Germany.
  assert.equal(assignedTo("POL.11_1"), "GER",
    "Pomorskie must start German for the rung-1 Polish face to carve the Corridor out");
  const at = SPEC.indexOf('"POL.11_1"');
  const why = SPEC.slice(Math.max(0, at - 1400), at);
  assert.match(why, /rung 3/, "and the reason must stay written next to it");
});

test("Memel is Lithuanian in 1935 — the annexation is four years away", () => {
  assert.doesNotMatch(SPEC, /"LTU\.3_1"\s*:\s*"GER"/, "Memel goes German in March 1939, not here");
  assert.match(SPEC, /Memel is still LITHUANIAN/, "and the spec says why it is left alone");
});

console.log("\nThe rule that makes the baseline load-bearing");

test("a rung-1 face still suppresses rung-3 candidates per region", () => {
  // This is what makes the flip necessary rather than a preference. If the
  // suppression is ever relaxed to be per-area, the German faces reach Pomorskie
  // directly and POL.11's baseline should go back to Poland — so the two live
  // and die together, and this pin is where that is written down.
  assert.match(ERA, /rung3Suppressed \+= 1/);
  const at = ERA.indexOf("rung3Suppressed += 1");
  const rule = ERA.slice(at - 400, at);
  assert.match(rule, /candidates\.filter\(\(f\) => \(f\.rung \?\? 1\) !== 3\)/,
    "suppression drops rung 3 for the WHOLE region, which is why a baseline is the only way in");
});

console.log(`\n${pass} passed\n`);

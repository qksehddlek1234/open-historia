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

test("Pomorskie has NO baseline row, and the detour that briefly put one there is recorded", () => {
  // For one day it read GER. That was a workaround, not a fact. The rung-3
  // German faces could not enter a region a rung-1 face touched, so flipping
  // the baseline was the only door — and this board has no Poland polity at
  // all (unassignedKeepModernOwner supplies the modern name), so the only
  // value the row could carry was Germany. The per-area rule opened the door
  // properly on 2026-08-16; the row came out and the default went back to
  // Poland, which is what 1935 was. Fifteen towns still land 15/15.
  assert.equal(assignedTo("POL.11_1"), null,
    "a row here can only say GER, and GER is not Pomorskie's 1935 baseline");
  assert.match(SPEC, /기준선이 하루 동안 독일이었다/,
    "the detour, and why it ended, must stay written where the row used to be");
});

test("Memel is Lithuanian in 1935 — the annexation is four years away", () => {
  assert.doesNotMatch(SPEC, /"LTU\.3_1"\s*:\s*"GER"/, "Memel goes German in March 1939, not here");
  assert.match(SPEC, /Memel is still LITHUANIAN/, "and the spec says why it is left alone");
});

console.log("\nThe rule that made the baseline load-bearing, and the one that replaced it");

test("rung precedence is measured in AREA, which is what let the row come out", () => {
  // The previous version of this pin held the opposite and said so: "if the
  // suppression is ever relaxed to be per-area, the German faces reach
  // Pomorskie directly and POL.11's baseline should go back to Poland — so the
  // two live and die together". They did. This is the other end of that.
  assert.doesNotMatch(ERA, /rung3Suppressed/,
    "the per-region drop is gone; a rung-1 face no longer evicts rung 3 from a whole region");
  assert.match(ERA, /candidates\.sort\(\(a, b\) => Number\(\(a\.rung \?\? 1\) === 3\) - Number\(\(b\.rung \?\? 1\) === 3\)\)/,
    "rung 1 is asked first");
  assert.match(ERA, /intersection\(isBackfill \? available : mp, face\.mp\)/,
    "and rung 3 is clipped against what is LEFT, never against the whole region");
  assert.match(ERA, /rung3AfterRung1/,
    "regions where both rungs cut are counted — that number is the change");
});

console.log(`\n${pass} passed\n`);

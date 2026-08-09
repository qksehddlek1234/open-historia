// GADM's map is 2020's, and "keep the modern owner" took it literally: the
// player's 1935 board carried North Korea (founded 1948), South Sudan (2011),
// Pakistan and the Kashmir Z0x pseudo-countries (1947), Northern Cyprus (1983),
// a GADM junk row called "NA", and every British/French/Dutch/US/NZ dependency
// drawn as its own sovereign state — which is also why "colonies aren't
// implemented" was a fair verdict.
//
// These pins hold both directions. Over-correcting is the opposite failure and
// just as wrong: North Korea genuinely exists in 2000 and must stay on that
// board.
import assert from "node:assert/strict";
import fs from "node:fs";

let pass = 0;
const test = (name, fn) => { fn(); pass += 1; console.log(`  ok  ${name}`); };

const { heldBy, existedAsState, eraOwnerName, UNCLAIMED, JUNK_GID0 } =
  await import("../scripts/presets/lib/eraSovereignty.mjs");

const scenarioOwners = (id) => {
  const path = new URL(`../server/data/scenarios/${id}/regions.geojson`, import.meta.url);
  if (!fs.existsSync(path)) return null; // preset folders are build products
  const geo = JSON.parse(fs.readFileSync(path, "utf8"));
  const counts = new Map();
  for (const feature of geo.features ?? []) {
    const owner = feature.properties?.owner || "(unclaimed)";
    counts.set(owner, (counts.get(owner) ?? 0) + 1);
  }
  return counts;
};

test("the table answers in three distinguishable ways", () => {
  // Held by someone else.
  assert.equal(heldBy("PRK", "1935-12-01"), "JPN");
  assert.equal(heldBy("SSD", "1935-12-01"), "GBR");
  // Its own sovereign — the right answer for the ~180 countries not listed.
  assert.equal(heldBy("MEX", "1935-12-01"), "");
  assert.equal(heldBy("TUR", "1935-12-01"), "");
  // Held by NOBODY. Distinct from "" or the modern name would quietly win.
  assert.equal(heldBy("SJM", "1914-07-28"), null);
  assert.equal(eraOwnerName("SJM", "1914-07-28"), UNCLAIMED);
  assert.equal(heldBy("SJM", "1939-09-01"), "NOR");
});

test("windows open and close on the real dates", () => {
  assert.equal(heldBy("PRK", "1947-01-01"), "SUN");
  assert.equal(heldBy("PRK", "1949-01-01"), "", "North Korea is sovereign from 1948");
  assert.equal(heldBy("PAK", "1946-01-01"), "GBR");
  assert.equal(heldBy("PAK", "1948-01-01"), "");
  assert.equal(heldBy("SSD", "1960-01-01"), "SDN");
  assert.equal(heldBy("SSD", "2012-01-01"), "");
  assert.equal(heldBy("HKG", "1990-01-01"), "GBR");
  assert.equal(heldBy("HKG", "1998-01-01"), "");
  assert.ok(existedAsState("MEX", "1935-12-01"));
  assert.ok(!existedAsState("PRK", "1935-12-01"));
});

test("the answer speaks the preset's own vocabulary for a power", () => {
  // "GBR" is "British Empire" on a 1935 board and "United Kingdom" where the
  // preset never names it.
  assert.equal(
    eraOwnerName("AIA", "1935-12-01", { gid0ToPolityName: { GBR: "British Empire" }, countryNames: { GBR: "United Kingdom" } }),
    "British Empire",
  );
  assert.equal(
    eraOwnerName("AIA", "1935-12-01", { countryNames: { GBR: "United Kingdom" } }),
    "United Kingdom",
  );
});

test("the Kashmir pseudo-countries stop being modern states in 1935", () => {
  // GADM splits the contested Himalaya into Z01..Z09, each tagged with a modern
  // claimant — which is how an "India", a "Pakistan" and a "China" appeared
  // inside British Raj territory on the 1935 map.
  for (const code of ["Z01", "Z04", "Z05", "Z06", "Z07", "Z09"]) {
    assert.equal(heldBy(code, "1935-12-01"), "GBR", `${code} was British India in 1935`);
  }
  for (const code of ["Z02", "Z03", "Z08"]) {
    assert.equal(heldBy(code, "1935-12-01"), "CHN", `${code} sits on the Chinese side`);
  }
});

test("GADM's non-place row is named as junk", () => {
  assert.ok(JUNK_GID0.has("NA"), "GID_0 \"NA\" (NAME_1 \"NA\") is not a country");
});

test("no near-modern board carries a state that did not exist yet", () => {
  const ANACHRONISMS = [
    "North Korea", "South Korea", "South Sudan", "Pakistan", "Bangladesh",
    "Northern Cyprus", "NA", "Isle of Man", "Jersey", "Guernsey", "Anguilla",
    "Bermuda", "Montserrat", "Cayman Islands", "Nauru", "Vanuatu", "Tonga",
    "Samoa", "Cook Islands", "Tokelau", "Tuvalu", "American Samoa",
    "Svalbard and Jan Mayen", "Aland Islands",
    "United States Minor Outlying Islands", "Saint Barthelemy",
  ];
  for (const id of ["ww1-1914", "wwii-1935", "wwii-1939", "coldwar-1946", "napoleonic-1804", "victorian-1836"]) {
    const owners = scenarioOwners(id);
    if (!owners) continue;
    const found = ANACHRONISMS.filter((name) => owners.has(name));
    assert.deepEqual(found, [], `${id} still draws: ${found.join(", ")}`);
  }
});

test("and 2000 keeps the states that DO exist by then — no over-correction", () => {
  const owners = scenarioOwners("millennium-2000");
  if (!owners) return;
  // Each of these is a real sovereign state on 1 January 2000. A filter that
  // swept them off the board would be the opposite mistake.
  for (const name of ["North Korea", "Pakistan", "Nauru", "Vanuatu", "Tonga", "Samoa", "Tuvalu"]) {
    assert.ok(owners.has(name), `${name} existed in 2000 and must stay on the board`);
  }
});

// ICELAND — the one the table and the OHM face disagreed about, settled by the
// preset we compare to. World War II++ has no Iceland polity: its Denmark owns
// all eight Icelandic regions in 1935 and it scripts independence on 17 June
// 1944. Three places have to keep saying the same thing or the face graft takes
// the island back, which is what happened once already.
test("ICELAND IS DANISH GROUND UNTIL 1944 — table, both specs, and the face", () => {
  assert.equal(heldBy("ISL", 1935), "DNK");
  assert.equal(heldBy("ISL", 1939), "DNK");
  assert.equal(heldBy("ISL", 1946), "", "the union ends in 1944 and Iceland is its own again");

  const spec = (id) => fs.readFileSync(new URL(`../scripts/presets/${id}.spec.mjs`, import.meta.url), "utf8");
  for (const id of ["wwii-1935", "wwii-1939"]) {
    assert.match(spec(id), /DAN: \["DNK", "GRL", "FRO", "ISL"\]/, `${id} must hand Iceland to Denmark`);
  }
  // The dump's face is right about the state and silent about who holds it —
  // same reason "Isle of Man" is in this list.
  assert.match(spec("wwii-1939"), /"Konungsríkið Ísland": "DAN"/);
});

// THE PRINCELY STATES — the other judgement the WWII++ audit overturned.
//
// The first pass looked at the OFFICIAL "World War II" preset, saw one flat
// British Raj, and concluded the original models no princely states. It models
// about sixty of them, plus a "Princely States" catch-all and the Federated
// Shan States, and its own 1937 event names all three side by side. Two fifths
// of the subcontinent was not British-administered ground.
//
// We take five, not sixty: the ones where a WHOLE modern region was princely.
// The rest of India really was presidency ground (Bombay, Madras, Bengal, the
// United Provinces) and belongs to the Raj.
test("FIVE PRINCELY STATES ARE OFF THE RAJ, on both WWII boards", () => {
  for (const id of ["wwii-1935", "wwii-1939"]) {
    const owners = scenarioOwners(id);
    if (!owners) continue;
    // Counts moved when India went to district level (35 states → 634
    // districts), which is the point: a princely state is a real shape now
    // rather than one modern state standing in for it. Kashmir stays three,
    // because the seed keeps it as three curated disputed-ground rows rather
    // than GADM's 22 districts. What this pin holds is that each state EXISTS
    // and the Raj still holds the presidencies.
    assert.equal(owners.get("Jammu and Kashmir"), 3, `${id} Kashmir`);
    for (const name of ["Rajputana", "Hyderabad", "Mysore", "Travancore and Cochin"]) {
      assert.ok((owners.get(name) ?? 0) > 0, `${id} lost ${name}`);
    }
    // And the Raj keeps the presidencies rather than losing India entirely.
    assert.ok(owners.get("British Raj") > 400,
      `${id} Raj kept ${owners.get("British Raj")} — the presidencies are most of India`);
  }
});

console.log(`\n${pass} passed\n`);

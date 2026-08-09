// THE ADVISORS THE ORIGINAL HAS TEN OF AND WE HAD ONE OF.
//
// World War II++ carries thirteen polities that own zero regions and exist only
// to be talked to — ten "Internal: …" offices and two "Domestic: …" voices (plus
// Observer Mode). Ours was one advisor panel with one voice, which flattens the
// treasury's answer and the general staff's answer into the same register.
//
// These pins hold the three places that have to agree, because a voice that
// leaks into any ONE of them stops being an advisor and becomes a country:
// the roster, the contract in the rules, and the engine guards.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { isSpeechlessName, isSpeechlessPolity } from "../src/runtime/speechless.js";
import fs from "node:fs";

let pass = 0;
const test = (name, fn) => { fn(); pass += 1; console.log(`  ok  ${name}`); };

const read = (rel) => fs.readFileSync(new URL(`../${rel}`, import.meta.url), "utf8");
const { INTERNAL_VOICES, INTERNAL_VOICE_CONTRACT, voicePolities } =
  await import("../scripts/presets/lib/internalVoices.mjs");
const { isTerritorylessVoiceName, isTerritorylessVoice } =
  await import("../src/runtime/internalVoices.js");

const BUILD = read("scripts/presets/build-preset.mjs");
const GAMEPLAY = read("src/Game/AI/gameplay.js");
const CHAT = read("src/Game/GameUI/chat.jsx");

// ---- 1. the roster ------------------------------------------------------------------

test("TEN OFFICES AND TWO DOMESTIC VOICES, the original's own set", () => {
  const names = INTERNAL_VOICES.map((voice) => voice.name);
  const offices = names.filter((name) => name.startsWith("Internal:"));
  const domestic = names.filter((name) => name.startsWith("Domestic:"));
  assert.equal(offices.length, 10, `ten offices, got ${offices.length}`);
  assert.deepEqual(domestic, ["Domestic: Civilians", "Domestic: Newspaper"]);
  for (const expected of [
    "Internal: Head of Military", "Internal: Diplomatic Representative",
    "Internal: Economic Advisor", "Internal: Head of Intelligence",
    "Internal: Media Chief", "Internal: Research Director",
    "Internal: Foreign Minister", "Internal: Trade Minister",
    "Internal: Interior Minister", "Internal: Religious Leader",
  ]) assert.ok(names.includes(expected), `${expected} is missing`);
});

test("…every one carries a blurb, because the picker shows it before you open it", () => {
  for (const voice of INTERNAL_VOICES) {
    assert.ok(voice.blurb && voice.blurb.length > 20, `${voice.name} has no usable note`);
  }
});

test("…and none of them can ever hold ground", () => {
  const rows = Object.values(voicePolities());
  assert.equal(rows.length, INTERNAL_VOICES.length);
  for (const row of rows) {
    assert.equal(row.territoryless, true, `${row.name} must be marked territoryless`);
    assert.ok(!("regions" in row), `${row.name} must not carry regions`);
    assert.equal(row.aliases.length, 0, "an alias would let a region name resolve to a voice");
  }
});

// ---- 2. the contract ----------------------------------------------------------------

test("THE CONTRACT SAYS THE THREE THINGS THAT KEEP THEM OUT OF THE WORLD", () => {
  assert.match(INTERNAL_VOICE_CONTRACT, /never own a region/);
  assert.match(INTERNAL_VOICE_CONTRACT, /never appear in events/);
  assert.match(INTERNAL_VOICE_CONTRACT, /PLAYER'S OWN GOVERNMENT AND COUNTRY/);
});

test("…the envoy is the ONE exception on speaking for the player", () => {
  assert.match(INTERNAL_VOICE_CONTRACT, /ONE EXCEPTION/);
  assert.match(INTERNAL_VOICE_CONTRACT, /Internal: Diplomatic Representative/);
  // Because the rest of the rules — and playerSovereignty.mjs — say the
  // simulation may not act for the player at all. This is the carve-out.
  assert.match(INTERNAL_VOICE_CONTRACT, /MAY answer on the player's behalf/);
});

test("…and the newspaper is a page, not a person", () => {
  assert.match(INTERNAL_VOICE_CONTRACT, /IS A PAGE, NOT A PERSON/);
  assert.match(INTERNAL_VOICE_CONTRACT, /no greeting, no preamble/);
  assert.match(INTERNAL_VOICE_CONTRACT, /written in the output language, translated/);
});

test("…each office is rendered in ITS OWN era, not as a modern ministry", () => {
  assert.match(INTERNAL_VOICE_CONTRACT, /form THIS ERA actually gives it/);
});

// ---- 3. the wiring ------------------------------------------------------------------

test("THE BUILDER ATTACHES BOTH HALVES, and a preset can opt out", () => {
  assert.match(BUILD, /import \{ INTERNAL_VOICE_CONTRACT, voicePolities \}/);
  assert.match(BUILD, /spec\.internalVoices === false \? "" : INTERNAL_VOICE_CONTRACT/);
  assert.match(BUILD, /if \(spec\.internalVoices !== false\) \{/);
  // A name the chat list can ask about has to be in colors.json, which REPLACES
  // the palette rather than merging with it.
  assert.match(BUILD, /colors\[name\] = hexToRgb\(voice\.color\)/);
});

test("THE ENGINE DROPS THEM FROM WORLD-OPENED CHATS — rule #2, checked not asked", () => {
  assert.match(GAMEPLAY, /import \{ isTerritorylessVoiceName \} from "\.\.\/\.\.\/runtime\/internalVoices\.js"/);
  assert.match(GAMEPLAY, /\.filter\(\(entry\) => !isTerritorylessVoiceName\(entry\.name\)\)/);
});

test("…and the picker can actually reach them, which the tile layer never could", () => {
  assert.match(CHAT, /readWorldState/, "the picker has to read polityOverrides, not just the tiles");
  assert.match(CHAT, /GroupHeading text="Your own government"/);
  assert.match(CHAT, /isTerritorylessVoiceName/);
});

test("the predicate reads the NAME, so it survives saves and model output", () => {
  assert.ok(isTerritorylessVoiceName("Internal: Head of Military"));
  assert.ok(isTerritorylessVoiceName("Domestic: Newspaper"));
  assert.ok(!isTerritorylessVoiceName("Internal Macedonian Revolutionary Organization"),
    "the colon is the marker — a country whose name merely starts with the word is not a voice");
  assert.ok(!isTerritorylessVoiceName("Germany"));
  assert.ok(!isTerritorylessVoiceName(""));
  assert.ok(!isTerritorylessVoiceName(undefined));
  // The row flag still counts, for anything that carries the object.
  assert.ok(isTerritorylessVoice({ name: "Germany", territoryless: true }));
});


console.log("\nThe mirror case — ground with no voice");

test("the dead are unaddressable however they are spelled", () => {
  for (const name of ["The Dead", "the dead", "  Zombies  ", "The Infected", "the horde", "The Swarm"]) {
    assert.equal(isSpeechlessName(name), true, `${name} should be unaddressable`);
  }
});

test("a government is not, and neither is a near-miss", () => {
  for (const name of ["Germany", "Dead Sea Authority", "Zombie Research Institute", "", null]) {
    assert.equal(isSpeechlessName(name), false, `${name} is addressable`);
  }
});

test("a scenario can mark a name the registry has never heard of", () => {
  assert.equal(isSpeechlessPolity({ name: "The Northern Blight", speechless: true }), true);
  assert.equal(isSpeechlessPolity({ name: "The Northern Blight" }), false);
});

test("resolveInvitees drops them, and the chat picker never lists them", () => {
  // Both paths must agree, the same way they do for territory-less voices —
  // one filter without the other leaves a door open.
  const gameplay = readFileSync(new URL("../src/Game/AI/gameplay.js", import.meta.url), "utf8");
  assert.match(gameplay, /isSpeechlessName\(entry\.name\)/, "resolveInvitees filters the dead");
  const chat = readFileSync(new URL("../src/Game/GameUI/chat.jsx", import.meta.url), "utf8");
  assert.match(chat, /filter\(c => !isUnaddressable\(c\)\)/, "the picker filters them out entirely");
});

test("the zombie board ships a polity this actually catches", () => {
  // The builder keeps name/aliases/color and drops unknown spec fields, so the
  // `speechless: true` flag does NOT survive into world.json. The name is what
  // carries it — which is the whole reason the name path is primary.
  const world = JSON.parse(readFileSync(new URL("../server/data/scenarios/zombie-2019/world.json", import.meta.url), "utf8"));
  const dead = Object.values(world.polityOverrides ?? {}).find((row) => isSpeechlessName(row?.name));
  assert.ok(dead, "zombie-2019 ships a polity the registry recognises");
  assert.equal(dead.speechless, undefined, "and it does NOT rely on the flag surviving the build");
});


console.log(`\n${pass} passed\n`);

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
import { buildSpeechlessNames, isSpeechlessName, isSpeechlessPolity } from "../src/runtime/speechless.js";
import fs from "node:fs";

let pass = 0;
const test = (name, fn) => { fn(); pass += 1; console.log(`  ok  ${name}`); };

const read = (rel) => fs.readFileSync(new URL(`../${rel}`, import.meta.url), "utf8");
const { CONTRACTS } = await import("../src/runtime/simulationContracts.js");
const { INTERNAL_VOICES, INTERNAL_VOICE_CONTRACT, voicePolities } =
  await import("../scripts/presets/lib/internalVoices.mjs");
const { isTerritorylessVoiceName, isTerritorylessVoice } =
  await import("../src/runtime/internalVoices.js");
const { contractTextFor } = await import("../src/runtime/simulationContracts.js");

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
  // The opt-out still reaches the build; where it is READ moved. build-preset
  // no longer concatenates the contract into simulationRules — it records which
  // contracts the board carries, and simulationContracts.js injects them per
  // consumer. What this pin protects (a spec can switch the contract off, and
  // the switch is honoured) is unchanged; the line that honours it is not.
  assert.match(BUILD, /import \{ voicePolities \}/);
  assert.match(BUILD, /CONTRACTS\s*\n?\s*\.filter\(\(contract\) => spec\[contract\.flag\] !== false\)/);
  assert.ok(
    CONTRACTS.some((contract) => contract.flag === "internalVoices" && contract.text === INTERNAL_VOICE_CONTRACT),
    "the internalVoices flag must still name this contract",
  );
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
  assert.match(gameplay, /buildSpeechlessNames\(normalizeWorldState\(world\)\)/, "the set comes from the board");
  assert.match(gameplay, /speechless\.has\(String\(entry\.name/, "resolveInvitees filters against it");
  const chat = readFileSync(new URL("../src/Game/GameUI/chat.jsx", import.meta.url), "utf8");
  assert.match(chat, /filter\(c => !isUnaddressable\(c\)\)/, "the picker filters them out entirely");
});

test("the zombie board ships a polity this actually catches", () => {
  // The builder keeps name/aliases/color and drops unknown spec fields, so the
  // `speechless: true` flag does NOT survive into world.json. The name is what
  // carries it — which is the whole reason the name path is primary.
  const world = JSON.parse(readFileSync(new URL("../server/data/scenarios/zombie-2019/world.json", import.meta.url), "utf8"));
  const dead = Object.values(world.polityOverrides ?? {}).find((row) => isSpeechlessName(row?.name));
  assert.ok(dead, "zombie-2019 ships a polity the registry recognises by name alone");
  // Same row, reached WITHOUT the world: flag stripped, aliases stripped. The
  // floor has to hold on its own — a save written before the flag existed, or a
  // polity the model renamed, arrives with nothing but a name.
  assert.equal(isSpeechlessPolity({ name: dead.name }), true, "the name alone is enough");
  assert.equal(buildSpeechlessNames(null).size > 0, true, "and an absent world still yields the floor");
});

test("THE KOREAN HOLE — the registry alone could never have closed it", () => {
  // This campaign runs in Korean and the model writes Korean. `죽은 자` is what
  // arrives at resolveInvitees, and no English registry can be expected to hold
  // it. The board already knew: the zombie spec has shipped that alias since it
  // was written and nothing was reading it.
  assert.equal(isSpeechlessName("죽은 자"), false, "the floor genuinely does not cover it");
  const world = JSON.parse(readFileSync(new URL("../server/data/scenarios/zombie-2019/world.json", import.meta.url), "utf8"));
  const names = buildSpeechlessNames(world);
  for (const alias of ["죽은 자", "감염체", "The Dead", "Zombies"]) {
    assert.ok(names.has(alias.toLowerCase()), `${alias} must be unaddressable`);
  }
  assert.equal(names.has("germany"), false, "and a government is still addressable");
});

test("…and it generalises: a flag alone protects a name nobody registered", () => {
  // The point of deriving from the world rather than editing a list: a future
  // scenario can invent its own horde, in its own languages, and get the same
  // treatment without touching speechless.js.
  const names = buildSpeechlessNames({
    polityOverrides: { X: { name: "The Northern Blight", speechless: true, aliases: ["북방 역병"] } },
  });
  assert.ok(names.has("the northern blight"));
  assert.ok(names.has("북방 역병"));
});

test("A VOICE CANNOT TAKE GROUND — the engine drops the transfer the prompt could not stop", async () => {
  // Measured 2026-08-12 (voices × gameMaster, 12/12 on BOTH arms): when the
  // player directly asks, the GM hands Bayern to "Internal: Head of
  // Military" with or without the contract — the prompt is not where this
  // rule can hold. The engine is: normalizeRegionTransfer refuses a voice
  // recipient (loudly), so the literal response that used to write
  // regionOwnershipOverrides now dies at the choke point. The prompt cell
  // stays — unenforced is not unnecessary.
  const { normalizeEventEntry } = await import("../src/runtime/gameState.js");
  const entry = normalizeEventEntry({
    title: "군부에 바이에른을",
    impacts: {
      regionTransfers: [
        { regionId: "DEU.1_1", toCode: "Internal: Head of Military" },
        { regionId: "DEU.2_1", toCode: "France" },
      ],
    },
  });
  assert.equal(entry.impacts.regionTransfers.length, 1, "the voice-bound transfer is gone");
  assert.equal(entry.impacts.regionTransfers[0].toCode, "France", "the real one still lands");
});

test("…and a polityChange addressed to a voice dies at the same choke point", async () => {
  const { normalizeEventEntry } = await import("../src/runtime/gameState.js");
  const entry = normalizeEventEntry({
    title: "유령 국가 조폐 시도",
    impacts: {
      polityChanges: [
        { code: "Domestic: Opposition Leader", reputation: 80 },
        { code: "France", reputation: 55 },
      ],
    },
  });
  assert.equal(entry.impacts.polityChanges.length, 1, "no voice-named row reaches the country table");
  assert.equal(entry.impacts.polityChanges[0].code, "France");
});

test("the builder carries the flag now, and only for the polity that set it", () => {
  const world = JSON.parse(readFileSync(new URL("../server/data/scenarios/zombie-2019/world.json", import.meta.url), "utf8"));
  const flagged = Object.values(world.polityOverrides ?? {}).filter((row) => row?.speechless === true);
  assert.equal(flagged.length, 1, "exactly one polity on this board is speechless");
  assert.equal(flagged[0].name, "The Dead");
  assert.ok(flagged[0].aliases.includes("죽은 자"), "and it carries its aliases with it");
});

// ---- 4. the catalyst lane: the stage a voice must never reach ------------------------

// PC 11차 measured both arms hot on voices × catalyst: the model casts advisors
// as scene characters, and with the contract loaded it stages them under the raw
// prefix. The handover asked whether production actually exposes voices there.
// It does not — via a roster. It exposes them via the CONTRACT, and these pins
// hold both halves of that repair.

test("THE CATALYST LANES GET THE PROHIBITION WITHOUT THE MACHINE PREFIXES", () => {
  for (const lane of ["catalystCreation", "catalystExecutor"]) {
    const text = contractTextFor("voices", lane);
    assert.notEqual(text, INTERNAL_VOICE_CONTRACT, `${lane} takes the scene variant`);
    assert.doesNotMatch(text, /Internal:|Domestic:/,
      `${lane} must not be taught the strings it then stages`);
    assert.match(text, /NEVER put one in a scene/, "and it is told the one thing it needs");
    assert.ok(text.length < INTERNAL_VOICE_CONTRACT.length, "shorter than the talking-lane text");
  }
});

test("…and EVERY OTHER LANE IS UNTOUCHED — a pending measurement is not preempted", () => {
  // voices × jumpForward is 13차's cell on the PC lane. Changing what that lane
  // sees here would silently rewrite the experiment before it ran.
  for (const lane of ["jumpForward", "autoJumpForward", "catalystSummary", "leader", "advisor", "countryStatSheet"]) {
    assert.equal(contractTextFor("voices", lane), INTERNAL_VOICE_CONTRACT, `${lane} keeps the full text`);
  }
});

test("A STAGED VOICE LABEL IS SCRUBBED OUT OF CATALYST PROSE, and the words stay", async () => {
  const { normalizeWorldState } = await import("../src/runtime/gameState.js");
  const world = normalizeWorldState({
    activeCatalyst: {
      title: "Internal: Head of Military의 긴급 보고",
      premise: "참석자: Internal: Head of Military, Domestic: Newspaper 편집장",
      opening: "작전실에서 Internal: Head of Intelligence가 지도를 짚었다",
      choices: ["Domestic: Civilians의 요구를 듣는다", "강원(KOR.6_1)으로 병력을 보낸다"],
      history: [{ choice: "Internal: Economic Advisor에게 묻는다", summary: "Internal: Economic Advisor가 국고를 열었다" }],
    },
  });
  const catalyst = world.activeCatalyst;
  const everything = [
    catalyst.title, catalyst.premise, catalyst.opening,
    ...catalyst.choices.map((choice) => choice.text),
    catalyst.history[0].choice, catalyst.history[0].summary,
  ].join(" | ");
  assert.doesNotMatch(everything, /Internal:|Domestic:/, "no machine prefix survives to the screen");
  assert.match(catalyst.title, /Head of Military의 긴급 보고/, "the sentence itself is untouched");
  assert.match(catalyst.premise, /Newspaper 편집장/);
  assert.equal(catalyst.choices[1].text, "강원으로 병력을 보낸다", "and the scene joins the rest of the scrubber's cover");
});

test("THE FEEDBACK LOOP IS CLOSED: a voice named in prose is not re-supplied as history", async () => {
  // The PC lane's correction to 11차: the two hot catalyst lanes never receive a
  // roster, but they DO receive the chronicle — and event prose, consolidation
  // summaries and ledger facts had no voice filter, so a name staged once came
  // back as history every turn afterwards. Structured fields were already
  // guarded (the two console lines above); this is the prose half.
  const { normalizeEvents, normalizeWorldState } = await import("../src/runtime/gameState.js");
  const [event] = normalizeEvents([{
    title: "Internal: Head of Military의 경고",
    description: "작전실에서 Domestic: Newspaper가 1면을 실었다",
    date: "1200-01-01",
  }]);
  assert.equal(event.title, "Head of Military의 경고");
  assert.doesNotMatch(event.description, /Internal:|Domestic:/);
  const world = normalizeWorldState({
    consolidatedHistory: [{ summary: "Internal: Economic Advisor가 국고를 열었다" }],
    campaignLedger: [{ key: "x", fact: "Internal: Head of Intelligence의 보고", updated: "1200-01-01" }],
  });
  assert.equal(world.consolidatedHistory[0].summary, "Economic Advisor가 국고를 열었다");
  assert.equal(world.campaignLedger[0].fact, "Head of Intelligence의 보고");
});


console.log(`\n${pass} passed\n`);

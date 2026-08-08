// Perspectives ("세계 여론") — the advisor drawer's world-opinion voice. The
// two hard walls these pins hold: the voice works from the PUBLIC record only
// (it must never see world.secretReports — the exact mirror of the advisor-only
// injection), and it renders opinion without any write path — no relations
// move, no events happen because of what it says.
import assert from "node:assert/strict";
import fs from "node:fs";

let pass = 0;
const test = (name, fn) => { fn(); pass += 1; console.log(`  ok  ${name}`); };

const read = (path) => fs.readFileSync(new URL(path, import.meta.url), "utf8");
const MAIN = read("../src/Game/AI/main.jsx");
const ADVISOR_UI = read("../src/Game/GameUI/advisor.jsx");

// The whole builder, brace-matched from its declaration.
const builderAt = MAIN.indexOf("async function buildPerspectivesSystemPrompt");
assert.notEqual(builderAt, -1, "buildPerspectivesSystemPrompt exists");
const builderEnd = MAIN.indexOf("\n}", MAIN.indexOf("].filter", builderAt));
const BUILDER = MAIN.slice(builderAt, builderEnd + 2);

test("the voice is public-record only — secretReports never enters the prompt", () => {
  assert.ok(!BUILDER.includes("secretReports"), "builder must not read world.secretReports");
  assert.match(BUILDER, /You know ONLY the public record/);
  assert.match(BUILDER, /never reveal or allude to secret intelligence/);
});

test("the voice renders opinion, never outcomes — and has no write path", () => {
  assert.match(BUILDER, /You render OPINION, never outcomes/);
  assert.match(BUILDER, /no standings change, no events happen/);
  for (const forbidden of ["writeJson", "writeWorldState", "diplomaticRelations:"]) {
    assert.ok(!BUILDER.includes(forbidden), `builder must not contain ${forbidden}`);
  }
});

test("the player stays the player, and reactions come as named voices + synthesis", () => {
  assert.match(BUILDER, /the PLAYER, not the head of state/);
  assert.match(BUILDER, /3 to 5 capitals or blocs/);
  assert.match(BUILDER, /Close with a short synthesis/);
});

test("sendMessage routes the mode and keeps one shared history", () => {
  assert.match(MAIN, /mode === "perspectives"\s*\n?\s*\? await buildPerspectivesSystemPrompt\(\)/);
  // The mode key must be stripped before callAI — it is not a provider option.
  assert.match(MAIN, /const \{ mode, \.\.\.callOpts \}/);
  assert.match(MAIN, /\.\.\.callOpts, languageMode: "chat"/);
});

test("the UI tags messages {mode:\"perspectives\"} and labels the voice", () => {
  assert.match(ADVISOR_UI, /advisorMode === "perspectives" \? "perspectives" : undefined/);
  assert.match(ADVISOR_UI, /const modeTag = mode \? \{ mode \} : \{\}/);
  assert.match(ADVISOR_UI, /🌐 World Opinion/);
  assert.match(ADVISOR_UI, /label: "World Opinion"/);
});

test("both chips exist and the mode is captured at send time", () => {
  assert.match(ADVISOR_UI, /\{ id: "advisor", icon: "🧭", label: "Advice" \}/);
  assert.match(ADVISOR_UI, /\{ id: "perspectives", icon: "🌐", label: "World Opinion" \}/);
  assert.match(ADVISOR_UI, /captured at send time/);
});

test("the new chip strings ship Korean in both packs", () => {
  for (const path of ["../public/lang/ko.json", "../server/data/lang/ko.json"]) {
    const pack = JSON.parse(read(path));
    for (const key of ["Advice", "World Opinion", "🌐 World Opinion"]) {
      assert.ok(pack[key], `${path} has "${key}"`);
    }
  }
});

console.log(`\n${pass} passed\n`);

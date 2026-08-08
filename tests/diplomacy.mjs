// Plan E: the world's standing with the player becomes a recorded fact — plus
// the two round-36 repairs (the tally that skipped bounced orders, and the
// country that arrived as an object).
import assert from "node:assert/strict";
import fs from "node:fs";
import {
  RELATION_LEVELS,
  applyRelationReports,
  buildRelationsText,
  getRelation,
  normalizeDiplomaticRelations,
  normalizeRelationLevel,
  relationLabel,
  relationScore,
} from "../src/runtime/diplomacy.js";
import { normalizeWorldState } from "../src/runtime/gameState.js";
import { GAMEPLAY_SCHEMAS, DIPLOMATIC_RELATIONS_SCHEMA, validateAgainstSchema } from "../src/Game/AI/gameplaySchemas.js";

let pass = 0;
const test = (name, fn) => { fn(); pass += 1; console.log(`  ok  ${name}`); };

const GAMEPLAY = fs.readFileSync(new URL("../src/Game/AI/gameplay.js", import.meta.url), "utf8");
const PANEL = fs.readFileSync(new URL("../src/Game/Selection/CountryPanel.jsx", import.meta.url), "utf8");

console.log("\nFive levels, one namespace");

test("the scale is ordered and symmetric around neutral", () => {
  assert.deepEqual(RELATION_LEVELS.map((level) => level.id), ["allied", "friendly", "neutral", "tense", "hostile"]);
  assert.equal(relationScore("allied"), 2);
  assert.equal(relationScore("hostile"), -2);
  assert.equal(relationScore("neutral"), 0);
});

test("synonyms and labels resolve; garbage stays null, never neutral", () => {
  assert.equal(normalizeRelationLevel("ally"), "allied");
  assert.equal(normalizeRelationLevel("동맹"), "allied");
  assert.equal(normalizeRelationLevel("WAR"), "hostile");
  assert.equal(normalizeRelationLevel("적대"), "hostile");
  assert.equal(normalizeRelationLevel("frenemy"), null);
  assert.equal(normalizeRelationLevel(""), null);
});

test("unrecorded is not neutral", () => {
  assert.equal(getRelation({}, "Japan"), null);
  assert.equal(getRelation({ Japan: { level: "tense" } }, "Japan"), "tense");
});

console.log("\nReports fold in like the stat pass");

const fold = (existing, reports, extra = {}) =>
  applyRelationReports(existing, reports, { date: "2018-11-16", playerName: "South Korea", ...extra });

test("an absolute restatement of what stands is not a move", () => {
  const { moved } = fold({ Japan: { level: "tense", updated: "2018-01-01" } }, [{ country: "Japan", level: "tense" }]);
  assert.equal(moved.length, 0);
});

test("a change moves, is dated, and keeps its note", () => {
  const { entries, moved } = fold({ Japan: { level: "tense" } }, [{ country: "Japan", level: "friendly", note: "해상 안보 공조" }]);
  assert.deepEqual(moved, [{ country: "Japan", from: "tense", to: "friendly" }]);
  assert.equal(entries.Japan.updated, "2018-11-16");
  assert.equal(entries.Japan.note, "해상 안보 공조");
});

test("a first assessment records from nothing", () => {
  const { entries, moved } = fold({}, [{ country: "United States", level: "allied" }]);
  assert.equal(entries["United States"].level, "allied");
  assert.deepEqual(moved, [{ country: "United States", from: null, to: "allied" }]);
});

test("the player, a blank, and a nonsense level are dropped BY NAME", () => {
  const { entries, dropped } = fold({}, [
    { country: "South Korea", level: "allied" },
    { country: "", level: "allied" },
    { country: "Japan", level: "frenemy" },
  ]);
  assert.equal(Object.keys(entries).length, 0);
  assert.equal(dropped.length, 3);
  assert.ok(dropped.every((drop) => drop.why));
});

test("a code resolves through the injected name bridge", () => {
  const { entries } = fold({}, [{ country: "JP", level: "tense" }], {
    resolveName: (name) => (name === "JP" ? "Japan" : name),
  });
  assert.equal(entries.Japan.level, "tense");
});

test("normalize drops invalid levels and caps notes", () => {
  const entries = normalizeDiplomaticRelations({
    Japan: { level: "tense", note: "x".repeat(500) },
    Mars: { level: "vassal" },
  });
  assert.equal(Object.keys(entries).length, 1);
  assert.equal(entries.Japan.note.length, 120);
});

test("the world normalizer carries the store", () => {
  const world = normalizeWorldState({ diplomaticRelations: { Japan: { level: "tense" } } });
  assert.equal(world.diplomaticRelations.Japan.level, "tense");
  assert.deepEqual(normalizeWorldState({}).diplomaticRelations, {});
});

console.log("\nThe prompt reads warm to cold");

test("buildRelationsText sorts by warmth and carries notes", () => {
  const text = buildRelationsText({
    "North Korea": { level: "hostile" },
    "United States": { level: "allied", note: "동맹" },
    Japan: { level: "tense" },
  });
  const lines = text.split("\n");
  assert.match(lines[0], /United States: allied/);
  assert.match(lines[2], /North Korea: hostile/);
  assert.match(text, /동맹/);
  assert.equal(buildRelationsText({}), "");
});

console.log("\nThe pass is wired like the ones that work");

test("schema: flat required list, absolute enum levels", () => {
  assert.equal(GAMEPLAY_SCHEMAS.diplomaticRelations, DIPLOMATIC_RELATIONS_SCHEMA);
  const item = DIPLOMATIC_RELATIONS_SCHEMA.properties.relations.items;
  assert.match(validateAgainstSchema(item, { country: "Japan" }, "$") ?? "", /level is required/);
  assert.equal(validateAgainstSchema(item, { country: "Japan", level: "tense" }, "$"), "");
});

test("it runs on diplomatic signals or as a first assessment, inside the turn", () => {
  assert.match(GAMEPLAY, /const signals = freshEvents\.some/);
  assert.match(GAMEPLAY, /const firstAssessment = Object\.keys\(standing\)\.length === 0;/);
  assert.match(GAMEPLAY, /signals \|\| firstAssessment/);
});

test("candidates are capped and off-list reports are refused by name", () => {
  assert.match(GAMEPLAY, /\.slice\(0, 12\)/);
  assert.match(GAMEPLAY, /not on this period's list/);
});

test("it can never cost the turn", () => {
  assert.match(GAMEPLAY, /\[diplomacy\] the relations pass failed; standings stay where they were\./);
});

test("moves and drops are named in the console", () => {
  assert.match(GAMEPLAY, /\[diplomacy\] \$\{folded\.moved\.length\} standing\(s\) moved/);
  assert.match(GAMEPLAY, /dropped \$\{folded\.dropped\.length\} reported standing\(s\)/);
});

test("the jump reads [Standing Relations] when any exist", () => {
  assert.match(GAMEPLAY, /\[Standing Relations\]/);
  assert.match(GAMEPLAY, /standingRelations: standingRelationsText/);
});

test("a foreign posting is judged through the standing", () => {
  const at = GAMEPLAY.indexOf("PLACEMENT.abroad && verdict.at");
  const block = GAMEPLAY.slice(at, at + 1600);
  assert.match(block, /getRelation\(relations, other\)/);
  assert.match(block, /reads as a posting/);
  assert.match(block, /worth explaining/);
});

console.log("\nThe country panel shows the standing, or honestly nothing");

test("the badge renders only when a standing is recorded", () => {
  assert.match(PANEL, /\{standing && \(/);
  assert.match(PANEL, /relationLabel\(standing\)/);
  assert.match(PANEL, /getRelation\(world\.diplomaticRelations/);
});

test("the player's own panel never shows a standing with itself", () => {
  assert.match(PANEL, /playerName !== thisName/);
});

console.log("\nRound 36's two repairs");

test("a country that arrives as an object is read through its name", () => {
  const at = GAMEPLAY.indexOf("const bump = (code, weight)");
  const block = GAMEPLAY.slice(at, at + 900);
  assert.match(block, /code\.name \?\? code\.code \?\? code\.country/);
  assert.match(block, /key\.startsWith\("\[object"\)/);
});

test("the difficulty breakdown counts bounced orders too", () => {
  const at = GAMEPLAY.indexOf("Tallied directly rather than through countOrderOutcomes");
  assert.notEqual(at, -1);
  const block = GAMEPLAY.slice(at, at + 700);
  assert.match(block, /for \(const action of rated\) thisTurn\[normalizeActionOutcome\(action\.outcome\)\] \+= 1;/);
});

console.log(`\n${pass} passed\n`);

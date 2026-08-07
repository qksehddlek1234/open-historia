// The verdicts that never landed: alias ids nothing translated, a save merge
// that dropped the outcome at the last step, a dedicated pass for a list the
// model leaves empty, and the stat sheets the final write kept clobbering.
import assert from "node:assert/strict";
import fs from "node:fs";
import { GAMEPLAY_SCHEMAS, ORDER_OUTCOME_RATING_SCHEMA, validateAgainstSchema } from "../src/Game/AI/gameplaySchemas.js";

let pass = 0;
const test = (name, fn) => { fn(); pass += 1; console.log(`  ok  ${name}`); };

const GAMEPLAY = fs.readFileSync(new URL("../src/Game/AI/gameplay.js", import.meta.url), "utf8");
const CHEATS = fs.readFileSync(new URL("../src/Game/GameUI/cheats.jsx", import.meta.url), "utf8");
const SETTINGS = fs.readFileSync(new URL("../src/Game/GameUI/settings.jsx", import.meta.url), "utf8");

const between = (from, to) => {
  const a = GAMEPLAY.indexOf(from);
  assert.notEqual(a, -1, `${from} not found`);
  const b = GAMEPLAY.indexOf(to, a);
  assert.notEqual(b, -1, `${to} not found after ${from}`);
  return GAMEPLAY.slice(a, b);
};

console.log("\nA verdict's id gets the same translation as everything else");

test("translateActionIds walks the verdict rows, nested and top-level", () => {
  const block = between("const translateActionIds", "const collectCoveredActionIds");
  assert.match(block, /translateVerdictIds\(event\?\.impacts\?\.actionOutcomes\)/);
  assert.match(block, /translateVerdictIds\(candidate\?\.actionOutcomes\)/);
  assert.match(block, /row\.id = resolveActionRef\(row\.id\)/);
});

console.log("\nThe save merge carries the whole conclusion");

test("outcome and outcomeNote ride home with the resolution", () => {
  const block = between("const concludedById", "let addedMidTurn");
  assert.match(block, /action\.status === "resolved" \|\| action\.outcome/);
  const merge = between("actionsToWrite = storedNow.map", "const knownIds");
  assert.match(merge, /outcome: concluded\.outcome/);
  assert.match(merge, /outcomeNote: concluded\.outcomeNote/);
});

test("a bounced order keeps its verdict but stays planned", () => {
  const merge = between("actionsToWrite = storedNow.map", "const knownIds");
  assert.match(merge, /if \(concluded\.status !== "resolved"\) return \{ \.\.\.action, \.\.\.verdict \};/);
});

test("planned -> resolved is still the only status move", () => {
  const merge = between("actionsToWrite = storedNow.map", "const knownIds");
  assert.match(merge, /action\.status !== "planned"\) return action/);
});

console.log("\nThe dedicated rating pass");

test("the task exists in the registry with a flat top-level list", () => {
  assert.equal(GAMEPLAY_SCHEMAS.orderOutcomeRating, ORDER_OUTCOME_RATING_SCHEMA);
  assert.equal(ORDER_OUTCOME_RATING_SCHEMA.properties.outcomes.type, "array");
  assert.deepEqual(ORDER_OUTCOME_RATING_SCHEMA.required, ["outcomes"]);
});

test("a row missing its outcome is rejected; a good row passes", () => {
  const item = ORDER_OUTCOME_RATING_SCHEMA.properties.outcomes.items;
  assert.match(validateAgainstSchema(item, { id: "R7" }, "$") ?? "", /outcome is required/);
  assert.equal(validateAgainstSchema(item, { id: "R3", outcome: "partial", note: "예산 절반" }, "$"), "");
});

test("it only fills gaps — a verdict the payload carried is never overridden", () => {
  const block = between("const unrated = [...touchedActionIds]", "// DID THE DIFFICULTY ACTUALLY HAPPEN?");
  assert.match(block, /!outcomes\.has\(id\)/);
  assert.match(block, /if \(!real \|\| outcomes\.has\(real\) \|\| verdicts\.has\(real\)\) continue;/);
});

test("its aliases are its own, and only its own ids are accepted", () => {
  const block = between("const unrated = [...touchedActionIds]", "// DID THE DIFFICULTY ACTUALLY HAPPEN?");
  assert.match(block, /const alias = `R\$\{index \+ 1\}`/);
  assert.match(block, /realOf\.get\(normalizeString\(row\?\.id\)\.toLowerCase\(\)\)/);
});

test("failed and backfired bounce the order back without a resolution stamp", () => {
  const block = between("const unrated = [...touchedActionIds]", "// DID THE DIFFICULTY ACTUALLY HAPPEN?");
  assert.match(block, /resolvedDate: _rd, resolvedRound: _rr, \.\.\.rest/);
  assert.match(block, /status: "planned"/);
});

test("a failed pass costs nothing but honesty", () => {
  const block = between("const unrated = [...touchedActionIds]", "// DID THE DIFFICULTY ACTUALLY HAPPEN?");
  assert.match(block, /the rating pass failed; unrated orders count as clean successes/);
  assert.match(block, /returned no verdicts/);
});

test("the quota it is told is the clamped one", () => {
  const block = between("const unrated = [...touchedActionIds]", "// DID THE DIFFICULTY ACTUALLY HAPPEN?");
  assert.match(block, /totalSetbacksOwed\(baseGame\.difficulty, unrated\.length, owedBefore\)/);
});

test("the prompt is carried whole at call time, like the stat pass", () => {
  assert.match(GAMEPLAY, /if \(taskKey === "orderOutcomeRating"\) \{/);
  const block = between('if (taskKey === "orderOutcomeRating")', "// Local models keep answering the actions task");
  assert.match(block, /ratingDirective/);
  assert.match(block, /ratingQuota/);
  assert.match(block, /ratingEvents/);
  assert.match(block, /ratingOrders/);
  assert.match(block, /Judge by PREPARATION/);
});

console.log("\nThe rating is scoped to what this turn touched");

test("touchedActionIds is collected where resolution happens", () => {
  assert.match(GAMEPLAY, /const touchedActionIds = new Set\(\);/);
  assert.match(GAMEPLAY, /touchedActionIds\.add\(String\(action\.id\)\);/);
});

test("the difficulty accounting reads the touched set, not status guesses", () => {
  const block = between("// DID THE DIFFICULTY ACTUALLY HAPPEN?", "What this period did to the numbers");
  assert.match(block, /action\.outcome && touchedActionIds\.has\(String\(action\.id\)\)/);
  assert.doesNotMatch(block, /resolvedRound === round \|\| action\.status === "planned"/);
});

console.log("\nA seeded stat sheet survives the turn that seeded it");

test("recordStatShifts hands the seeds back instead of trusting a write it cannot keep", () => {
  const block = between("const seeded = {};", "const sheets = codes");
  assert.match(block, /seeded\[code\] = statsWorld\.countryStats\[code\]/);
  assert.match(GAMEPLAY, /return \{ entries: merged\.entries, seeded \};/);
});

test("even a pass with nothing to ask still returns its seeds", () => {
  assert.match(GAMEPLAY, /if \(sheets\.length === 0\) return \{ entries: world\.countryStatChanges \?\? \{\}, seeded \};/);
});

test("the caller folds seeds in so the final world write cannot clobber them", () => {
  const block = between("const statChanges = await recordStatShifts", "Re-read the chat list");
  assert.match(block, /countryStatChanges: statChanges\.entries/);
  // nextWorld still wins where it holds a REAL (__asOf-stamped) base — but a
  // stampless fragment the event path leaked must not clobber the full base
  // just seeded under it (live: Philippines held only {stability}).
  assert.match(block, /\.\.\.statChanges\.seeded,/);
  assert.match(block, /!statChanges\.seeded\[code\] \|\| sheet\?\.__asOf/);
});

console.log("\nThe feature picker is a dropdown now");

test("selection is a select with grouped options, not a row list", () => {
  const block = CHEATS.slice(CHEATS.indexOf("section(`Feature selection"), CHEATS.indexOf('{cities.length === 0 && ('));
  assert.match(block, /<select/);
  assert.match(block, /<optgroup/);
  assert.match(block, /Structures & landmarks/);
  // The 25-row cap died with the list — a dropdown holds every match.
  assert.doesNotMatch(CHEATS.slice(CHEATS.indexOf('if (tool === "edit-feature")'), CHEATS.indexOf('if (tool === "add-feature")')), /LIST_LIMIT/);
});

test("picking an option opens it; picking the placeholder closes", () => {
  const block = CHEATS.slice(CHEATS.indexOf("section(`Feature selection"), CHEATS.indexOf('{cities.length === 0 && ('));
  assert.match(block, /if \(entry\) openEntry\(entry\);/);
  assert.match(block, /else closeEntry\(\);/);
});

console.log("\nConsolidations are a thing a player can read, edit and delete");

test("the events tool grew the original's second tab", () => {
  // lastIndexOf: the first occurrence is the data LOADER in the effect; the
  // render block is the second.
  const eventsAt = CHEATS.lastIndexOf('if (tool === "events")');
  const block = CHEATS.slice(eventsAt, CHEATS.indexOf("return null;", eventsAt));
  assert.match(block, /Consolidations \(\$\{consolidations\.length\}\)/);
  assert.match(block, /activeTab === "consolidations"/);
});

test("edit writes back through world.consolidatedHistory", () => {
  const block = CHEATS.slice(CHEATS.indexOf("const persistConsolidations"), CHEATS.indexOf("const newestIndex"));
  assert.match(block, /consolidatedHistory: nextList/);
  assert.match(block, /writeWorldState/);
});

test("a blank edit refuses rather than blanking the memory", () => {
  assert.match(CHEATS, /a consolidation cannot be blank/);
});

test("deleting the newest is named as re-exposing its rounds; older ones are not", () => {
  // getUnconsolidatedEvents reads only the LAST entry's throughEventId, so only
  // the newest deletion changes what is eligible again — the messages must not
  // promise more than the engine does.
  assert.match(CHEATS, /eligible for re-consolidation on the next run/);
  assert.match(CHEATS, /: "Consolidation deleted\.",/);
});

test("the settings panel is the SAME panel, imported — not a drifting copy", () => {
  assert.match(SETTINGS, /export const ConsolidationPanel/);
  assert.match(CHEATS, /import \{ ConsolidationPanel \} from "\.\/settings\.jsx"/);
  assert.match(CHEATS, /<ConsolidationPanel \/>/);
});

console.log(`\n${pass} passed\n`);

// THE OTHER HALF OF ACTION BOOKKEEPING, pinned.
//
// actionCoverage asks "did every order get an event?"; this asks the reverse —
// "is every event that advances the player backed by an order?" The measurement
// that forced it: with "reinforce the Westwall" as the only order, the model
// invaded Poland 12/12 with every prompt-side rule in place. These pins hold
// the selection logic, the two exemptions, and the wiring doctrine (drop the
// whole event, name it in the console, never cost the turn).
import assert from "node:assert/strict";
import fs from "node:fs";
import {
  advancingImpacts,
  buildAuditMessage,
  findUnorderedPlayerActs,
} from "../src/Game/AI/unorderedActs.js";

let pass = 0;
const test = (name, fn) => { fn(); pass += 1; console.log(`  ok  ${name}`); };

const PLAYER = new Set(["ger", "germany"]);
const invasion = {
  id: "ev-1",
  title: "Invasion of Poland",
  description: "German forces cross the Polish border.",
  impacts: { regionTransfers: [{ regionId: "POL.1_1", regionName: "Masovia", fromCode: "POL", toCode: "GER" }] },
};

console.log("\nWhat counts as advancing the player");

test("a region transferred TO the player advances them; one transferred away does not", () => {
  assert.deepEqual(advancingImpacts(invasion, PLAYER), ["region → Masovia"]);
  const losing = { impacts: { regionTransfers: [{ regionId: "GER.1_1", fromCode: "GER", toCode: "FRA" }] } };
  assert.deepEqual(advancingImpacts(losing, PLAYER), []);
});

test("a unit spawned FOR the player advances them; someone else's spawn does not", () => {
  const spawn = { impacts: { unitOps: [{ op: "spawn", unit: { name: "4. Armee", ownerCode: "GER" } }] } };
  assert.deepEqual(advancingImpacts(spawn, PLAYER), ["unit spawn 4. Armee"]);
  const foreign = { impacts: { unitOps: [{ op: "spawn", unit: { name: "BEF", ownerCode: "GBR" } }] } };
  assert.deepEqual(advancingImpacts(foreign, PLAYER), []);
});

test("moves, strength changes and narration-only events are out of scope", () => {
  // Deliberate: the audit is about the two ways the rails rewrite the map. An
  // unordered act that is only words violates the same contract but breaks
  // nothing the player cannot argue with; scope stays narrow to keep false
  // drops rare.
  const move = { impacts: { unitOps: [{ op: "move", unitId: "u1" }] } };
  assert.deepEqual(advancingImpacts(move, PLAYER), []);
  assert.deepEqual(advancingImpacts({ title: "Germany mobilises", impacts: {} }, PLAYER), []);
});

console.log("\nThe three exemptions");

test("an event that lists actionIds is actionCoverage's department, not this one's", () => {
  const claimed = { ...invasion, impacts: { ...invasion.impacts, actionIds: ["a1"] } };
  const found = findUnorderedPlayerActs({ events: [claimed], actions: [], playerNames: ["GER", "Germany"] });
  assert.deepEqual(found, []);
});

test("EVERY advancing event without actionIds is a candidate — even an ordered-looking one", () => {
  // A bigram exemption used to authorize events whose text matched a queued
  // order. Removed, and this pin is why it must not come back: containment
  // grows with haystack length, so "Reinforce the Westwall" scored 0.632
  // against a two-clause Poland invasion — an unrelated order silently waving
  // through the exact event this pass exists to stop. Authorization is now the
  // model pass's call in every case; its tie-break keeps what it is unsure of.
  const ordered = { id: "a7", status: "planned", title: "Invade Poland", text: "Cross the border and take Warsaw." };
  const found = findUnorderedPlayerActs({ events: [invasion], playerNames: ["GER", "Germany"] });
  assert.equal(found.length, 1, "the model pass decides, not a string score");
  assert.equal(found[0].id, "ev-1");
  assert.deepEqual(found[0].gains, ["region → Masovia"]);
  // The order still matters — in the audit MESSAGE, where the model can see it.
  assert.match(buildAuditMessage(found, [ordered]), /\[id: a7\] Invade Poland/);
});

test("the audit message carries the ids the verdicts must echo", () => {
  const order = { id: "a1", status: "planned", title: "Reinforce the Westwall" };
  const found = findUnorderedPlayerActs({ events: [invasion], actions: [order], playerNames: ["GER"] });
  const message = buildAuditMessage(found, [order]);
  assert.match(message, /\[id: a1\] Reinforce the Westwall/);
  assert.match(message, /\[eventId: ev-1\] Invasion of Poland/);
  assert.match(message, /gains: region → Masovia/);
});

console.log("\nThe wiring doctrine");

const GAMEPLAY = fs.readFileSync(new URL("../src/Game/AI/gameplay.js", import.meta.url), "utf8");

test("the audit runs after the final sort and before the calendar card", () => {
  // It drops by index, so nothing may reorder between selection and the drop —
  // and the card appends an event that should never be in the audited set.
  const sortAt = GAMEPLAY.indexOf("A turn has one\n  // timeline: sort it by date");
  const auditAt = GAMEPLAY.indexOf("findUnorderedPlayerActs({\n    events: mergedEvents");
  const cardAt = GAMEPLAY.indexOf("THE CALENDAR CARD, BUILT BY THE ENGINE");
  assert.ok(sortAt > 0 && auditAt > 0 && cardAt > 0, "all three landmarks exist");
  assert.ok(sortAt < auditAt, "audit comes after the sort");
  assert.ok(auditAt < cardAt, "and before the card");
});

test("only an explicit 'unordered' verdict drops, and the fallback keeps everything", () => {
  assert.match(GAMEPLAY, /normalizeString\(row\?\.verdict\) !== "unordered"/);
  assert.match(GAMEPLAY, /fallback: \(\) => \(\{ verdicts: \[\] \}\)/,
    "a dead pass must keep every event, not cost the turn");
  assert.match(GAMEPLAY, /the audit pass failed — keeping every event/);
});

test("a drop removes the WHOLE event and prints its name", () => {
  // Text and impacts leave together (rule #3: narration and world state agree),
  // and rule #1: nothing is dropped without its name in the console.
  assert.match(GAMEPLAY, /\[sovereignty\] dropped unordered act: "\$\{candidate\.title\}"/);
  assert.match(GAMEPLAY, /mergedEvents = mergedEvents\.filter\(\(_, index\) => !dropIndexes\.has\(index\)\)/);
});

console.log("\nThe paid mapping's failure posture");

test("coverage mapping retries once, and the reason is the queue, not the model", () => {
  // Probed in isolation (scripts/ab/coverage-timeout-probe.mjs) this call
  // answers in 1–8s and matches the paraphrase the bigram matcher missed —
  // the 08-12 live timeouts happened while a measurement harness shared the
  // same sequential Ollama queue. One retry catches a freed queue; raising
  // the timeout instead would just hold the turn hostage to bookkeeping.
  assert.match(GAMEPLAY, /failed once — retrying, the local queue may have been busy/);
  assert.match(GAMEPLAY, /await askOnce\(\)\.catch\(/, "the retry wraps the first attempt, not the whole pass");
});

console.log("\nThe registrations");

test("prompt, schema and task list all know the pass", async () => {
  const prompts = JSON.parse(fs.readFileSync(new URL("../src/Game/AI/defaultPrompts.json", import.meta.url), "utf8"));
  assert.ok(prompts.tasks.unorderedActAudit, "defaultPrompts carries the task");
  assert.match(prompts.tasks.unorderedActAudit, /DOES NOTHING THE PLAYER DID NOT ORDER/);
  // The conservative tie-break is part of the design, not decoration: a wrongly
  // dropped event costs the player more than a wrongly kept one.
  assert.match(prompts.tasks.unorderedActAudit, /answer "reaction"/);
  const { GAMEPLAY_SCHEMAS } = await import("../src/Game/AI/gameplaySchemas.js");
  const schema = GAMEPLAY_SCHEMAS.unorderedActAudit;
  assert.ok(schema, "the schema map knows the pass");
  assert.deepEqual(schema.properties.verdicts.items.properties.verdict.enum, ["ordered", "reaction", "unordered"]);
  const { PROMPT_TASK_KEYS } = await import("../src/Game/AI/gameplayPrompts.js");
  assert.ok(PROMPT_TASK_KEYS.includes("unorderedActAudit"),
    "a frozen save pack falls back to the default for missing keys — being in the key list is what makes that work");
});

console.log(`\n${pass} passed\n`);

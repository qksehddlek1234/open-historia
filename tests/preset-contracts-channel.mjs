// The contract channel, and the one thing it must not do yet: change anything.
//
// The four shared contracts left simulationRules and are injected per consumer
// instead. The whole point of the step is that it is INERT — the matrix is
// all-on, so every assembled prompt is byte-for-byte what it was before. That is
// what makes the A/B that follows able to attribute a change to the cell it
// turned off rather than to the refactor underneath it.
//
// Two things here already caught real mistakes. "No contracts key means all of
// them" was the first draft, and it appended 5,452 characters to the default
// board and would have double-loaded every save in existence. And the injection
// nearly went in as an append after the render, which would have moved every
// contract to the end of every prompt — in the exact dimension the A/B measures.
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import url from "node:url";
import {
  CONTRACTS,
  CONTRACT_KEYS,
  CONTRACT_CONSUMERS,
  RULES_CONSUMERS,
  assembleRules,
  contractsOf,
  stripContracts,
} from "../src/runtime/simulationContracts.js";
import { COUNTRY_STAT_SHEET_SCHEMA } from "../src/Game/AI/gameplaySchemas.js";
const SCHEMAS = { countryStatSheet: COUNTRY_STAT_SHEET_SCHEMA };

let pass = 0;
const pending = [];
const test = (name, fn) => { pending.push(Promise.resolve(fn()).then(() => { pass += 1; console.log(`  ok  ${name}`); })); };
const ROOT = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), "..");
const SCENARIOS = path.join(ROOT, "server", "data", "scenarios");

console.log("\nThe split changes nothing");

// THE FIRST TWO CELLS ARE OFF, and this is the test that was written to fail
// when they went. Its old comment said: "the person turning it off updates this
// to name the exception and its measurement." Doing that.
//
// The exception is STRUCTURAL, not measured — src/runtime/simulationContracts.js
// carries the reasoning. `scheduledEvents` and `countryStatSheet` are the only
// two consumers whose output is a table rather than prose, and all three act
// contracts are written about NARRATION ("before NARRATING any act BY the
// player's own polity", "a turn's NARRATION must not mention them"). A task
// that cannot write a sentence cannot narrate a region changing hands or the
// player's country acting, so `region` and `sovereignty` are inert there.
//
// AND ONLY ONE OF THOSE TWO QUALIFIED. Being a table was the ENTRY requirement,
// not the verdict: `scheduledEvents` is a table too and was refused, because its
// `name` and `note` columns hold "Handover of Hong Kong — sovereignty transfers"
// perfectly well. That is the conclusion of the batch, so the map below has one
// row and not two.
//
// Everyone else still gets everything, and this pin holds BOTH halves: the
// exception is exactly the one, and nobody else has quietly drifted.
const CLEARED = {
  countryStatSheet: ["region", "sovereignty"],
};

test("every consumer but the two cleared ones reassembles identically", () => {
  if (!fs.existsSync(SCENARIOS)) { console.log("      (not built — skipped)"); return; }
  const others = RULES_CONSUMERS.filter((consumer) => !(consumer in CLEARED));
  assert.equal(others.length, 11, "exactly one consumer is cleared");
  for (const id of fs.readdirSync(SCENARIOS)) {
    const worldPath = path.join(SCENARIOS, id, "world.json");
    if (!fs.existsSync(worldPath)) continue;
    const world = JSON.parse(fs.readFileSync(worldPath, "utf8"));
    const assembled = others.map((consumer) => assembleRules(world, consumer));
    assert.equal(new Set(assembled).size, 1, `${id}: an UNCLEARED consumer has drifted`);
  }
});

test("…and the cleared two differ by exactly the contracts named, nothing else", () => {
  if (!fs.existsSync(SCENARIOS)) { console.log("      (not built — skipped)"); return; }
  const reference = RULES_CONSUMERS.find((consumer) => !(consumer in CLEARED));
  const textOf = Object.fromEntries(CONTRACTS.map((contract) => [contract.key, contract.text]));
  for (const id of fs.readdirSync(SCENARIOS)) {
    const worldPath = path.join(SCENARIOS, id, "world.json");
    if (!fs.existsSync(worldPath)) continue;
    const world = JSON.parse(fs.readFileSync(worldPath, "utf8"));
    const declared = new Set(world.contracts ?? []);
    const full = assembleRules(world, reference);
    for (const [consumer, dropped] of Object.entries(CLEARED)) {
      let expected = full;
      for (const key of dropped) {
        if (!declared.has(key)) continue; // the board opted out of it anyway
        assert.ok(expected.includes(textOf[key]), `${id}: ${key} was not in the full assembly`);
        expected = expected.replace(textOf[key], "");
      }
      assert.equal(assembleRules(world, consumer), expected,
        `${id}/${consumer}: differs from the full assembly by something other than ${dropped.join(" + ")}`);
    }
  }
});

test("a built board reassembles to exactly its own rules plus the contracts it declares", () => {
  if (!fs.existsSync(SCENARIOS)) { console.log("      (not built — skipped)"); return; }
  for (const id of fs.readdirSync(SCENARIOS)) {
    const worldPath = path.join(SCENARIOS, id, "world.json");
    if (!fs.existsSync(worldPath)) continue;
    const world = JSON.parse(fs.readFileSync(worldPath, "utf8"));
    const expected = [
      String(world.simulationRules ?? "").trim(),
      ...CONTRACTS.filter((c) => (world.contracts ?? []).includes(c.key)).map((c) => c.text),
    ].filter(Boolean).join("").trim();
    assert.equal(assembleRules(world, "jumpForward"), expected, `${id}`);
  }
});

test("the board's own rules no longer carry a single contract", () => {
  // If a contract text is still in the field AND declared in `contracts`, the
  // runtime injects a second copy. This is the fleet-side half of the pin.
  if (!fs.existsSync(SCENARIOS)) { console.log("      (not built — skipped)"); return; }
  const doubled = [];
  for (const id of fs.readdirSync(SCENARIOS)) {
    const worldPath = path.join(SCENARIOS, id, "world.json");
    if (!fs.existsSync(worldPath)) continue;
    const world = JSON.parse(fs.readFileSync(worldPath, "utf8"));
    const board = String(world.simulationRules ?? "");
    for (const contract of CONTRACTS) {
      if (board.includes(contract.text)) doubled.push(`${id}/${contract.key}`);
    }
  }
  assert.deepEqual(doubled, [], "a contract left in the board's own rules will be printed twice");
});

test("each contract appears exactly once in an assembled prompt", () => {
  if (!fs.existsSync(SCENARIOS)) { console.log("      (not built — skipped)"); return; }
  for (const id of fs.readdirSync(SCENARIOS)) {
    const worldPath = path.join(SCENARIOS, id, "world.json");
    if (!fs.existsSync(worldPath)) continue;
    const world = JSON.parse(fs.readFileSync(worldPath, "utf8"));
    const assembled = assembleRules(world, "advisor");
    for (const contract of CONTRACTS) {
      const count = assembled.split(contract.text).length - 1;
      assert.ok(count <= 1, `${id}: ${contract.key} appears ${count} times`);
    }
  }
});

console.log("\nAn unmigrated save reads exactly as it does today");

test("no contracts key means inject NOTHING, not everything", () => {
  // The inverted default. A legacy save holds the contracts inside its own copy;
  // "absent means all" would have printed each one twice, in one prompt.
  const legacy = { simulationRules: `BOARD RULES.${CONTRACTS[0].text}${CONTRACTS[1].text}` };
  assert.deepEqual(contractsOf(legacy), [], "a world that says nothing is carrying nothing");
  assert.equal(assembleRules(legacy, "jumpForward"), legacy.simulationRules.trim(), "left exactly as found");
});

test("the default scenario, which never had contracts, gains none", () => {
  const bare = { simulationRules: "" };
  assert.equal(assembleRules(bare, "advisor"), "", "an empty board stays empty");
});

console.log("\nMigration lifts our text and only our text");

test("stripping takes the contracts out and leaves the board alone", () => {
  const board = "THE BOARD'S OWN RULES, which nobody else wrote.";
  const baked = board + CONTRACTS.map((c) => c.text).join("");
  const { rules, removed } = stripContracts(baked);
  assert.equal(rules, board);
  assert.deepEqual(removed, CONTRACT_KEYS);
});

test("stripping a board that carried only some lifts only those", () => {
  const board = "BOARD.";
  const { rules, removed } = stripContracts(board + CONTRACTS[0].text + CONTRACTS[3].text);
  assert.equal(rules, board);
  assert.deepEqual(removed, [CONTRACTS[0].key, CONTRACTS[3].key]);
});

test("a save with no contract text is left untouched", () => {
  // The wwii-1935 case: 1,622 characters written before the contracts existed.
  // Nothing to lift, and nothing may be invented for it.
  const human = "I rewrote these rules myself and they resemble nothing of yours.";
  const { rules, removed } = stripContracts(human);
  assert.equal(rules, human);
  assert.deepEqual(removed, []);
});

test("strip then reassemble is the identity on a pre-split string", () => {
  const board = "BOARD.";
  const baked = board + CONTRACTS.map((c) => c.text).join("");
  const { rules, removed } = stripContracts(baked);
  assert.equal(assembleRules({ simulationRules: rules, contracts: removed }, "leader"), baked.trim());
});

console.log("\nThe matrix is a baseline, not a decision");

// A REMOVAL NEEDS A GROUND, AND THERE ARE ONLY TWO ACCEPTABLE ONES.
//
// This pin used to demand an A/B for every removal. It now recognises a second
// ground — STRUCTURAL: the consumer's output has no field in which the thing the
// contract forbids could be stated. That is stronger evidence than a sample, not
// weaker, but the bar is absolute: not "unlikely to matter", not "close to
// inert". `scheduledEvents` was argued for on that ground and refused, because a
// row reading "Handover of Hong Kong" is a statement about territory.
//
// Everything not listed here still needs the A/B, and the result goes beside it.
const STRUCTURAL = {
  countryStatSheet: ["region", "sovereignty"],
};

test("every removal from the matrix has a recorded ground", () => {
  for (const key of CONTRACT_KEYS) {
    const missing = RULES_CONSUMERS.filter((consumer) => !CONTRACT_CONSUMERS[key].includes(consumer));
    for (const consumer of missing) {
      assert.ok(
        STRUCTURAL[consumer]?.includes(key),
        `${key} was removed from ${consumer} with no ground — record the A/B result, or the structural argument, beside the change`,
      );
    }
  }
});

test("…and every structural claim is still actually true of the schema", () => {
  // The claim is about the OUTPUT SHAPE, so it is checkable rather than
  // remembered. If someone gives the stat sheet a narrative field, this fails
  // and the two cells have to come back.
  const NARRATIVE = ["events", "impacts", "description", "summary", "text", "premise", "opening", "note"];
  const sheet = SCHEMAS.countryStatSheet ?? SCHEMAS.COUNTRY_STAT_SHEET_SCHEMA;
  assert.ok(sheet, "the stat sheet schema must be findable for this to mean anything");
  const fields = Object.keys(sheet.properties ?? {});
  for (const field of NARRATIVE) {
    assert.ok(!fields.includes(field),
      `countryStatSheet grew a "${field}" field — it can narrate now, so region/sovereignty must go back on`);
  }
});

test("the consumer list is the twelve the rules actually reach", () => {
  // Counted from defaultPrompts.json: ten tasks whose template carries
  // HISTORICAL_PRESET_SIMULATION_RULES, plus the advisor and leader roots.
  const prompts = JSON.parse(fs.readFileSync(path.join(ROOT, "src", "Game", "AI", "defaultPrompts.json"), "utf8"));
  const carriers = Object.entries(prompts.tasks ?? {})
    .filter(([, template]) => JSON.stringify(template).includes("SIMULATION_RULES"))
    .map(([key]) => key);
  for (const root of ["advisor", "leader"]) {
    if (JSON.stringify(prompts[root] ?? "").includes("SIMULATION_RULES")) carriers.push(root);
  }
  assert.deepEqual(carriers.sort(), [...RULES_CONSUMERS].sort(), "a consumer was added or removed upstream");
});

console.log("\nTelling an old build from a person's writing");

test("a save carrying a text the board actually shipped is adoptable", async () => {
  const { reconcileRules, RECONCILE } = await import("../src/runtime/rulesHistory.js");
  const history = { boards: { "test-board": [{ hash: "", chars: 5, commit: "abc" }] } };
  // Fill the hash in from the module's own function so the two cannot disagree.
  const { hashRules } = await import("../src/runtime/rulesHistory.js");
  history.boards["test-board"][0].hash = hashRules("OLD.");
  const verdict = reconcileRules({ simulationRules: "OLD." }, "test-board", { simulationRules: "NEW AND LONGER.", contracts: ["region"] }, history);
  assert.equal(verdict.verdict, RECONCILE.adopted);
  assert.equal(verdict.rules, "NEW AND LONGER.");
  assert.equal(verdict.source.id, "test-board");
});

test("a save carrying something the board NEVER shipped is authored and untouchable", async () => {
  const { reconcileRules, RECONCILE, hashRules } = await import("../src/runtime/rulesHistory.js");
  const history = { boards: { "test-board": [{ hash: hashRules("OLD."), chars: 4, commit: "abc" }] } };
  const verdict = reconcileRules(
    { simulationRules: "I wrote these rules myself." }, "test-board", { simulationRules: "NEW." }, history,
  );
  assert.equal(verdict.verdict, RECONCILE.authored, "a text we never shipped belongs to a person");
  assert.equal(verdict.rules, undefined, "and carries no replacement");
});

test("a board with no recorded history is left alone, not guessed at", async () => {
  const { reconcileRules, RECONCILE } = await import("../src/runtime/rulesHistory.js");
  const verdict = reconcileRules({ simulationRules: "ANYTHING." }, "unknown-board", { simulationRules: "NEW." }, { boards: {} });
  assert.equal(verdict.verdict, RECONCILE.unknown);
  assert.equal(verdict.rules, undefined);
});

test("a save already on the current text is current, whatever its stamp says", async () => {
  const { reconcileRules, RECONCILE } = await import("../src/runtime/rulesHistory.js");
  const verdict = reconcileRules({ simulationRules: "SAME.", contracts: [] }, "test-board", { simulationRules: "SAME." }, { boards: {} });
  assert.equal(verdict.verdict, RECONCILE.current);
});

test("the contracts are stripped before the text is hashed", async () => {
  // A pre-split save carries the contracts inline. Hashing the raw field would
  // match nothing and every such save would read as authored — untouchable for
  // the wrong reason.
  const { reconcileRules, RECONCILE, hashRules } = await import("../src/runtime/rulesHistory.js");
  const board = "BOARD TEXT.";
  const history = { boards: { b: [{ hash: hashRules(board), chars: board.length, commit: "abc" }] } };
  const baked = board + CONTRACTS.map((c) => c.text).join("");
  assert.equal(reconcileRules({ simulationRules: baked }, "b", { simulationRules: "NEWER." }, history).verdict, RECONCILE.adopted);
});

test("every board in the shipped manifest lists its CURRENT text", () => {
  // If the current build is missing from the history, a save that is already up
  // to date reads as authored the moment the board changes again.
  const historyPath = path.join(ROOT, "data", "rules-history.json");
  if (!fs.existsSync(historyPath) || !fs.existsSync(SCENARIOS)) {
    console.log("      (manifest or fleet not built — skipped)");
    return;
  }
  const history = JSON.parse(fs.readFileSync(historyPath, "utf8"));
  const missing = [];
  for (const [id, texts] of Object.entries(history.boards ?? {})) {
    const worldPath = path.join(SCENARIOS, id, "world.json");
    if (!fs.existsSync(worldPath)) continue;
    const current = String(JSON.parse(fs.readFileSync(worldPath, "utf8")).simulationRules ?? "").trim();
    if (!texts.some((entry) => entry.chars === current.length)) missing.push(`${id} (${current.length})`);
  }
  assert.deepEqual(missing, [], "regenerate with scripts/presets/build-rules-history.mjs");
});

test("adoption carries the scenario's contract list, not just its words", async () => {
  // The gap the live save exposed: it adopted 6,466 characters of board text and
  // kept an empty contract list, so the campaign got the words and none of the
  // four contracts — 5,452 characters short of what a fresh game gets.
  const { reconcileRules, RECONCILE, hashRules } = await import("../src/runtime/rulesHistory.js");
  const history = { boards: { b: [{ hash: hashRules("OLD."), chars: 4, commit: "a" }] } };
  const verdict = reconcileRules(
    { simulationRules: "OLD.", contracts: [] },
    "b",
    { simulationRules: "NEW.", contracts: ["region", "voices"] },
    history,
  );
  assert.equal(verdict.verdict, RECONCILE.adopted);
  assert.deepEqual(verdict.contracts, ["region", "voices"], "the list travels with the text");
});

test("a save on the current text but the wrong contract list is synced, not left", async () => {
  // Its own verdict because it is safe in a way adoption is not: `contracts` is
  // derived from the spec and has no editor, so there is no player intent to
  // protect. This is the state the live save landed in.
  const { reconcileRules, RECONCILE } = await import("../src/runtime/rulesHistory.js");
  const verdict = reconcileRules(
    { simulationRules: "SAME.", contracts: [] },
    "b",
    { simulationRules: "SAME.", contracts: ["region", "prior", "sovereignty", "voices"] },
    { boards: {} },
  );
  assert.equal(verdict.verdict, RECONCILE.contracts);
  assert.deepEqual(verdict.contracts, ["region", "prior", "sovereignty", "voices"]);
  assert.equal(verdict.rules, undefined, "the board text is right and must not be rewritten");
});

test("a save that agrees on both is current and nothing happens", async () => {
  const { reconcileRules, RECONCILE } = await import("../src/runtime/rulesHistory.js");
  const world = { simulationRules: "SAME.", contracts: ["region"] };
  const verdict = reconcileRules(world, "b", { simulationRules: "SAME.", contracts: ["region"] }, { boards: {} });
  assert.equal(verdict.verdict, RECONCILE.current);
});


await Promise.all(pending);
console.log(`\n${pass} passed\n`);

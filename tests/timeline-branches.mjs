// SCRIPTED FORKS ARE ROLLED BY THE ENGINE, ONCE PER CAMPAIGN, AND REMEMBERED.
//
// The source presets phrase these as "select one at random" — an instruction
// the anchor pilot measured the model obeying 0/6 naively and 4/6 under an
// explicit mandate (docs/analysis/tno-original-depth-pilot.md). A model-side
// roll would also re-roll on every retry, letting one campaign tell two
// histories. So the data carries the branches, the jump rolls once into
// world.timelineBranchRolls, and every consumer reads the same answer. These
// pins hold the data shape, the read helper's fail-safes, both consumers, and
// the persistence wiring.
import assert from "node:assert/strict";
import fs from "node:fs";
import {
  branchOutcomeOf,
  buildTimelineText,
  materializeTimelineEntry,
  normalizeTimeline,
} from "../src/runtime/periodTimeline.js";
import { normalizeWorldState } from "../src/runtime/gameState.js";

let pass = 0;
const test = (name, fn) => { fn(); pass += 1; console.log(`  ok  ${name}`); };

const FORK = {
  id: "tl-succession",
  date: "1962-02-01",
  title: "히틀러, 후계자 지명",
  detail: "후계자는 네 갈래로 갈릴 수 있다.",
  weight: "pivotal",
  branches: [
    { outcome: "슈페어가 지명된다.", chance: "균등" },
    { outcome: "보어만이 지명된다.", chance: "균등" },
  ],
};

console.log("\nThe data shape");

test("normalize keeps branches and drops outcome-less rows", () => {
  const [entry] = normalizeTimeline([{ ...FORK, branches: [...FORK.branches, { chance: "1/2" }, { outcome: "  " }] }]);
  assert.equal(entry.branches.length, 2, "only rows with an outcome survive");
  assert.deepEqual(entry.branches[0], { outcome: "슈페어가 지명된다.", chance: "균등" });
  const [plain] = normalizeTimeline([{ ...FORK, branches: undefined }]);
  assert.deepEqual(plain.branches, [], "no fork means an empty list, not a missing field");
});

console.log("\nThe read helper fails safe");

test("branchOutcomeOf answers only from a stored, in-range roll", () => {
  const [entry] = normalizeTimeline([FORK]);
  assert.equal(branchOutcomeOf(entry, { "tl-succession": 1 }), "보어만이 지명된다.");
  assert.equal(branchOutcomeOf(entry, null), "", "no roll table yet");
  assert.equal(branchOutcomeOf(entry, {}), "", "no roll for this entry yet");
  // A revision can shrink the branch list after a roll was made; a stale index
  // must read as "no fork", never as a crash or a wrong branch.
  assert.equal(branchOutcomeOf(entry, { "tl-succession": 7 }), "");
  assert.equal(branchOutcomeOf({ ...entry, branches: [] }, { "tl-succession": 0 }), "");
});

console.log("\nBoth consumers speak the rolled branch");

test("the jump prompt tells the model which branch happened", () => {
  const [entry] = normalizeTimeline([FORK]);
  const text = buildTimelineText([entry], { branchRolls: { "tl-succession": 0 } });
  assert.match(text, /this one resolves as: 슈페어가 지명된다\./);
  assert.match(text, /the other possibilities did not happen/);
  const unrolled = buildTimelineText([entry], {});
  assert.ok(!unrolled.includes("resolves as:"), "no roll, no resolution line");
});

test("a materialized fork event states the outcome, not the menu", () => {
  const [entry] = normalizeTimeline([FORK]);
  const event = materializeTimelineEntry(entry, { branchRolls: { "tl-succession": 1 } });
  assert.equal(event.description, "후계자는 네 갈래로 갈릴 수 있다. 보어만이 지명된다.");
  const bare = materializeTimelineEntry(entry, {});
  assert.equal(bare.description, "후계자는 네 갈래로 갈릴 수 있다.", "unrolled stays uncertainty-phrased");
});

console.log("\nThe save remembers");

test("normalizeWorldState carries the roll table and drops junk", () => {
  const world = normalizeWorldState({ timelineBranchRolls: { "tl-a": 2, "tl-b": -1, "tl-c": "1", "": 0 } });
  assert.deepEqual(world.timelineBranchRolls, { "tl-a": 2 }, "only string-keyed non-negative integers survive");
  assert.deepEqual(normalizeWorldState({}).timelineBranchRolls, {}, "absent means empty, present on every world");
});

console.log("\nThe wiring, pinned at the source");

const GAMEPLAY = fs.readFileSync(new URL("../src/Game/AI/gameplay.js", import.meta.url), "utf8");

test("the jump rolls once, bounded, and names the roll out loud", () => {
  assert.match(GAMEPLAY, /ROLLED BY THE ENGINE, ONCE PER CAMPAIGN/);
  assert.match(GAMEPLAY, /Math\.floor\(Math\.random\(\) \* branches\.length\)/, "the roll is bounded by the branch list");
  assert.match(GAMEPLAY, /stored >= 0 && stored < branches\.length\) continue/, "a valid stored roll is never re-rolled");
  // Rule 1: an engine decision about the world prints its name.
  assert.match(GAMEPLAY, /\[timeline\] 분기 롤: "\$\{entry\.title\}"/);
});

test("the rolls ride the result only when dirty, and merge over the stored map", () => {
  assert.match(GAMEPLAY, /\.\.\.\(branchRollsDirty \? \{ timelineBranchRolls \} : \{\}\)/,
    "an unchanged map must not overwrite what another write path added");
  assert.match(GAMEPLAY, /timelineBranchRolls: \{ \.\.\.\(baseWorld\?\.timelineBranchRolls \?\? \{\}\), \.\.\.result\.timelineBranchRolls \}/,
    "the apply step merges, never replaces");
});

test("both consumers receive the roll table", () => {
  assert.match(GAMEPLAY, /buildTimelineText\(timelineEntries, \{ playerPolity: variables\.playerPolity, missed: timelineBacklog, branchRolls: timelineBranchRolls \}\)/);
  assert.match(GAMEPLAY, /materializeTimelineEntry\(entry, \{ playerPolity: variables\.playerPolity, branchRolls: timelineBranchRolls \}\)/);
});

console.log(`\n${pass} passed\n`);

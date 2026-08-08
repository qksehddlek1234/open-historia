// The fail-loop: orders that bounced back unlabelled and re-ran verbatim
// forever — 대안 경로 확보 failed in rounds 36 and 38, 차세대 그린 통신망 in 37
// and 38, and the queue showed them identical to fresh orders.
import assert from "node:assert/strict";
import fs from "node:fs";
import { STALL_AFTER_FAILURES, activeOrders, isStalledOrder, normalizeActionEntry } from "../src/runtime/gameState.js";

let pass = 0;
const test = (name, fn) => { fn(); pass += 1; console.log(`  ok  ${name}`); };

const GAMEPLAY = fs.readFileSync(new URL("../src/Game/AI/gameplay.js", import.meta.url), "utf8");
const ACTIONS_UI = fs.readFileSync(new URL("../src/Game/GameUI/actions.jsx", import.meta.url), "utf8");

console.log("\nOne failure retries; the second stalls");

test("the threshold is two, and the rule reads the counter", () => {
  assert.equal(STALL_AFTER_FAILURES, 2);
  assert.equal(isStalledOrder({ status: "planned", failCount: 1 }), false);
  assert.equal(isStalledOrder({ status: "planned", failCount: 2 }), true);
  assert.equal(isStalledOrder({ status: "planned" }), false);
  // A resolved order is never stalled, whatever its history says.
  assert.equal(isStalledOrder({ status: "resolved", failCount: 5 }), false);
});

test("the counter survives normalization, bounded and only when real", () => {
  const base = { text: "국경 순찰 강화", status: "planned" };
  assert.equal(normalizeActionEntry({ ...base, failCount: 2 }, 0).failCount, 2);
  assert.equal(normalizeActionEntry({ ...base, failCount: 99 }, 0).failCount, 9);
  assert.equal("failCount" in normalizeActionEntry(base, 0), false);
  assert.equal("failCount" in normalizeActionEntry({ ...base, failCount: 0 }, 0), false);
  assert.equal("failCount" in normalizeActionEntry({ ...base, failCount: "junk" }, 0), false);
});

test("activeOrders is the queue the simulation sees — planned minus stalled", () => {
  const queue = activeOrders([
    { text: "fresh", status: "planned" },
    { text: "failed once", status: "planned", failCount: 1, outcome: "failed" },
    { text: "stalled", status: "planned", failCount: 2, outcome: "failed" },
    { text: "done", status: "resolved" },
  ]);
  assert.deepEqual(queue.map((action) => action.text), ["fresh", "failed once"]);
});

console.log("\nEvery bounce counts, every success clears");

test("both bounce paths increment the counter", () => {
  const hits = GAMEPLAY.match(/failCount: \(Number\(action\.failCount\) \|\| 0\) \+ 1/g) ?? [];
  assert.equal(hits.length, 2, "the model-verdict bounce AND the dedicated-pass bounce");
});

test("a resolution strips the counter — in the apply and in the save merge", () => {
  assert.match(GAMEPLAY, /const \{ failCount: _clearedFailCount, \.\.\.cleanAction \} = action;/);
  assert.match(GAMEPLAY, /const \{ failCount: _storedFailCount, \.\.\.storedClean \} = action;/);
});

test("the save merge carries the counter home for bounced orders", () => {
  assert.match(GAMEPLAY, /\.\.\.\(Number\(concluded\.failCount\) >= 1 \? \{ failCount: concluded\.failCount \} : \{\}\)/);
});

console.log("\nA stalled order is parked in plain sight, not dropped");

test("the jump's queue excludes stalled orders and names them in the console", () => {
  assert.match(GAMEPLAY, /const plannedQueue = activeOrders\(bundle\.actions\);/);
  assert.match(GAMEPLAY, /stalled after failing twice and wait for the player/);
});

test("the clear-everything fallback cannot sweep a stalled order", () => {
  assert.match(GAMEPLAY, /resolveAllFallback && !isStalledOrder\(action\)/);
});

test("an event that names a stalled order explicitly may still resolve it", () => {
  // referencedActionIds.has(...) stands OUTSIDE the stall guard.
  assert.match(GAMEPLAY, /referencedActionIds\.has\(String\(action\.id\)\) \|\| \(resolveAllFallback && !isStalledOrder\(action\)\)/);
});

console.log("\nThe queue tells the player what happened");

test("a bounced order shows its verdict and its reason", () => {
  assert.match(ACTIONS_UI, /failed — retries next turn/);
  assert.match(ACTIONS_UI, /backfired — retries next turn/);
  assert.match(ACTIONS_UI, /normalized\.outcomeNote/);
});

test("a stalled order says it is parked, counts its failures, and offers Retry", () => {
  assert.match(ACTIONS_UI, /stalled — failed \$\{normalized\.failCount\} times/);
  assert.match(ACTIONS_UI, /Parked until you retry, edit, or delete it/);
  assert.match(ACTIONS_UI, /onRetry\(\);/);
});

test("retrying or editing clears the whole failure record", () => {
  const retries = ACTIONS_UI.match(/const \{ outcome: _outcome, outcomeNote: _note, failCount: _failCount, \.\.\./g) ?? [];
  assert.equal(retries.length, 2, "handleRetry and handleEdit both strip the record");
});

test("the stall rule the UI reads is the engine's own", () => {
  assert.match(ACTIONS_UI, /isStalledOrder,/);
  assert.match(ACTIONS_UI, /const stalled = isStalledOrder\(normalized\);/);
});

console.log(`\n${pass} passed\n`);

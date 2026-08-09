// Round 41's three reports: "Quantum-Trace, Global Hydrogen Pass 명칭이 계속
// 나오네 … 고착화 된거같아" (retired names must stay retired), the brainstorm
// offering no rescues for failed/stalled orders, and the advisor not watching
// the queue. Plus the standing guard printing the same rejection 20+ times.
import assert from "node:assert/strict";
import fs from "node:fs";
import {
  applyCanonRenames,
  getCanonRenameCount,
  normalizeNameRenames,
  setCanonRenames,
} from "../src/runtime/nameCanon.js";
import {
  acceptStanding,
  normalizeActionEntry,
  normalizeEventEntry,
  normalizeWorldState,
} from "../src/runtime/gameState.js";
import {
  buildExistingOrdersText,
  buildStrugglingOrdersText,
} from "../src/Game/AI/promptContext.js";

let pass = 0;
const test = (name, fn) => { fn(); pass += 1; console.log(`  ok  ${name}`); };

const GAMEPLAY = fs.readFileSync(new URL("../src/Game/AI/gameplay.js", import.meta.url), "utf8");

console.log("\nA retired name is rewritten however it is spelled");

test("the table is normalized: too-short keys out, longest first, capped", () => {
  const table = normalizeNameRenames({
    "AI": "인공지능",                       // 2 chars — refused
    "Hydrogen Pass": "수소 회랑",
    "Global Hydrogen Pass": "국제 수소 회랑",
    "Same": "same",                          // self-rename — refused
  });
  const keys = Object.keys(table);
  assert.deepEqual(keys, ["Global Hydrogen Pass", "Hydrogen Pass"]);
});

test("hyphen, underscore, space and glued variants all match one entry", () => {
  setCanonRenames({ "Quantum-Trace": "양자추적망", "Global Hydrogen Pass": "국제 수소 회랑", "Hydrogen Pass": "수소 회랑" });
  assert.equal(getCanonRenameCount(), 3);
  assert.equal(applyCanonRenames("'Quantum-Trace' 공급망"), "'양자추적망' 공급망");
  assert.equal(applyCanonRenames("Quantum_Trace 물류"), "양자추적망 물류");
  assert.equal(applyCanonRenames("quantum trace 체계"), "양자추적망 체계");
  assert.equal(applyCanonRenames("QuantumTrace 허브"), "양자추적망 허브");
});

test("the longer name wins before its own suffix, and words stay whole", () => {
  assert.equal(applyCanonRenames("Global Hydrogen Pass 확장"), "국제 수소 회랑 확장");
  assert.equal(applyCanonRenames("Hydrogen Pass 노선"), "수소 회랑 노선");
  // Never inside a longer Latin word.
  assert.equal(applyCanonRenames("QuantumTracer는 다른 것"), "QuantumTracer는 다른 것");
});

test("the world feeds the registry, and the table rides the save", () => {
  const world = normalizeWorldState({ nameRenames: { "Quantum-Trace": "양자추적망" } });
  assert.deepEqual(world.nameRenames, { "Quantum-Trace": "양자추적망" });
  assert.equal(getCanonRenameCount(), 1);
  assert.equal(applyCanonRenames("Quantum-Trace 2단계"), "양자추적망 2단계");
});

console.log("\nEvery normalize choke point applies it");

test("an action's text, title and outcome note come out renamed", () => {
  setCanonRenames({ "Quantum-Trace": "양자추적망" });
  const action = normalizeActionEntry({
    title: "Quantum-Trace 고도화",
    text: "사우디와 'Quantum_Trace' 공급망 자동화 체계를 구축한다.",
    outcome: "failed",
    outcomeNote: "Quantum-Trace 예산 부족",
    status: "planned",
  }, 0);
  assert.equal(action.title, "양자추적망 고도화");
  assert.match(action.text, /'양자추적망' 공급망/);
  assert.equal(action.outcomeNote, "양자추적망 예산 부족");
});

test("an event's title and description come out renamed", () => {
  const event = normalizeEventEntry({
    title: "Quantum-Trace 시범 운영",
    description: "Global Hydrogen Pass와 연계된 Quantum Trace 물류망이 가동됐다.",
    date: "2019-09-01",
  }, 0);
  setCanonRenames({ "Quantum-Trace": "양자추적망", "Global Hydrogen Pass": "국제 수소 회랑" });
  const renamed = normalizeEventEntry({
    title: "Quantum-Trace 시범 운영",
    description: "Global Hydrogen Pass와 연계된 Quantum Trace 물류망이 가동됐다.",
    date: "2019-09-01",
  }, 0);
  assert.ok(event); // shape sanity on the unseeded pass
  assert.equal(renamed.title, "양자추적망 시범 운영");
  assert.match(renamed.description, /국제 수소 회랑와 연계된 양자추적망 물류망/);
});

test("the sweep + registry pair is stated where the naming rule lives", () => {
  assert.match(GAMEPLAY, /world\.nameRenames/);
  assert.match(GAMEPLAY, /never coin an English brand name/);
});

console.log("\nA rejected standing says so once, not once per render");

test("the same impossible jump logs one warning across repeat replays", () => {
  const warns = [];
  const original = console.warn;
  console.warn = (...args) => warns.push(args.join(" "));
  try {
    for (let i = 0; i < 5; i += 1) {
      assert.equal(acceptStanding({ code: "Saudi Arabia", next: 100, previous: 62, eventText: "정상 외교" }), false);
    }
    assert.equal(warns.length, 1, "one log for five identical replays");
    // A DIFFERENT rejection still gets its own line.
    acceptStanding({ code: "Saudi Arabia", next: 99, previous: 62, eventText: "정상 외교" });
    assert.equal(warns.length, 2);
    // The scrubber's quiet pass stays silent even for a new key.
    acceptStanding({ code: "Japan", next: 98, previous: 60, eventText: "회담", quiet: true });
    assert.equal(warns.length, 2);
  } finally {
    console.warn = original;
  }
});

console.log("\nThe brainstorm and the advisor can finally see the setbacks");

test("the orders roster marks stalled and bounced entries as such", () => {
  const text = buildExistingOrdersText([
    { title: "정상 궤도", text: "이상 없음", status: "planned" },
    { title: "대안 경로 확보", text: "우회 경로", status: "planned", failCount: 2, outcome: "failed" },
    { title: "양자 컨소시엄", text: "컨소시엄", status: "planned", failCount: 1, outcome: "backfired" },
  ]);
  assert.match(text, /정상 궤도 \(queued, not carried out yet\)/);
  assert.match(text, /대안 경로 확보 \(STALLED — failed 2 times, waiting for the player\)/);
  assert.match(text, /양자 컨소시엄 \(backfired last period — retrying\)/);
});

test("the struggling list carries the model's own failure reasons", () => {
  const text = buildStrugglingOrdersText([
    { title: "정상 궤도", text: "이상 없음", status: "planned" },
    { title: "대안 경로 확보", text: "우회", status: "planned", failCount: 2, outcome: "failed", outcomeNote: "미국의 반대" },
    { title: "양자 컨소시엄", text: "컨소시엄", status: "planned", failCount: 1, outcome: "backfired", outcomeNote: "예산 초과" },
    { title: "완료된 것", text: "끝", status: "resolved", outcome: "failed" },
  ]);
  assert.match(text, /"대안 경로 확보" — STALLED after failing 2 times/);
  assert.match(text, /Why it failed: 미국의 반대/);
  assert.match(text, /"양자 컨소시엄" — came back backfired last period and will retry once more/);
  assert.doesNotMatch(text, /정상 궤도/);
  assert.doesNotMatch(text, /완료된 것/, "a resolved order is not struggling");
});

test("the suggestions task carries the rescue obligation with the list", () => {
  const at = GAMEPLAY.indexOf('if (taskKey === "actions")');
  // The window has grown with the criteria (era lenses, anchoring, and now the
  // [Depth] contract): slice to the end of the actions block, not a fixed
  // width. It was a fixed 16000 and the next addition pushed the rescue
  // obligation out of frame — the pin then failed for growth rather than for
  // regression, which is the one thing a source pin must never do.
  const end = GAMEPLAY.indexOf('if (taskKey === "countryStatSheet")', at);
  assert.ok(end > at, "the actions block is followed by the sheet block");
  const block = GAMEPLAY.slice(at, end);
  assert.match(block, /\[Orders In Trouble\]/);
  assert.match(block, /Dedicate ONE full topic to rescuing or replacing/);
  assert.match(block, /CHANGE THE APPROACH/);
  assert.match(block, /overrides the no-repetition rule/);
});

test("the repeat validator lets a rescue name its troubled programme", () => {
  const at = GAMEPLAY.indexOf("const troubled = new Set()");
  assert.notEqual(at, -1);
  const block = GAMEPLAY.slice(at, at + 1200);
  assert.match(block, /if \(inTrouble\) troubled\.add\(title\);/);
  assert.match(block, /if \(troubled\.has\(candidate\)\) return true;/, "an exact resubmission still drops");
  // Containment against the troubled set is exactly what must NOT happen.
  assert.match(GAMEPLAY, /return seen\.some\(\(prior\) => prior === candidate/);
});

test("the advisor chips watch the queue: trouble section, one question rule", () => {
  const at = GAMEPLAY.indexOf("generateAdvisorTopics");
  const block = GAMEPLAY.slice(at, at + 4200);
  assert.match(block, /\[Orders in trouble\]/);
  assert.match(block, /exactly ONE of the six questions must ask how to rescue/);
  assert.match(block, /strugglingOrders\)\.slice\(0, 1200\)/);
  // Tail, not head: the stalled orders live at the END of the roster.
  assert.match(block, /existingOrders\)\.slice\(-1200\)/);
});

console.log(`\n${pass} passed\n`);

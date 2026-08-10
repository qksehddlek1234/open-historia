#!/usr/bin/env node
/*! Open Historia — measure one cell of the contract matrix © 2026 Nicholas Krol, MIT (see src/Editor/LICENSE). */
// ONE CELL AT A TIME: does contract X change what consumer Y produces?
//
//   node scripts/ab/cell-ab.mjs voices advisor 6
//   node scripts/ab/cell-ab.mjs <contract> <consumer> [runs] [scenario]
//
// The older harness (scripts/ab/contract-ab.mjs) measured the whole contract
// BLOCK by slicing simulationRules at a marker string. That worked when the
// contracts were concatenated into the field; they are not any more, so it
// throws on every board. This one asks simulationContracts.js to assemble the
// rules the way the runtime actually does, then removes exactly one contract.
//
// WHAT IS BEING COMPARED, precisely: assembleRules(world, consumer) against the
// same string with one contract's text taken out. Nothing else differs — same
// task, same question, same temperature. A difference is attributable to the
// cell, which is the entire reason the matrix exists.
//
// SCORING IS PER-CONTRACT AND IT IS THE HARD PART. Each contract forbids
// something different, and a scorer that cannot detect the violation produces a
// null result that reads exactly like "the contract is unnecessary". Every
// scorer below therefore reports its own SENSITIVITY: how often the OFF arm
// violated. If the OFF arm never violates, the measurement says nothing about
// the contract and says so out loud rather than recommending a removal.
import fs from "node:fs";
import path from "node:path";
import url from "node:url";
import { CONTRACTS, RULES_CONSUMERS, assembleRules } from "../../src/runtime/simulationContracts.js";

const ROOT = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), "..", "..");
const ENDPOINT = "http://localhost:11434/v1/chat/completions";
const MODEL = "gemma4-oh:12b";

const [, , contractKey, consumer, runsArg, scenarioArg] = process.argv;
const RUNS = Number(runsArg ?? 6);
const SCENARIO = scenarioArg ?? "wwii-1939";

const contract = CONTRACTS.find((row) => row.key === contractKey);
if (!contract) {
  console.error(`unknown contract "${contractKey}" — one of: ${CONTRACTS.map((c) => c.key).join(", ")}`);
  process.exit(1);
}
if (!RULES_CONSUMERS.includes(consumer)) {
  console.error(`unknown consumer "${consumer}" — one of: ${RULES_CONSUMERS.join(", ")}`);
  process.exit(1);
}

const worldPath = path.join(ROOT, "server", "data", "scenarios", SCENARIO, "world.json");
if (!fs.existsSync(worldPath)) {
  console.error(`scenario "${SCENARIO}" is not built — run rebuild-all first`);
  process.exit(1);
}
const world = JSON.parse(fs.readFileSync(worldPath, "utf8"));

const ON = assembleRules(world, consumer);
if (!ON.includes(contract.text)) {
  console.error(`${SCENARIO}/${consumer} does not currently carry "${contractKey}" — nothing to measure`);
  console.error("  (either the board opted out, or the cell is already off in the matrix)");
  process.exit(1);
}
const OFF = ON.replace(contract.text, "").trim();

// ── the question each consumer is actually asked ─────────────────────────────
// Kept close to what the real task asks, because a contrived prompt measures the
// prompt rather than the contract.
const ASK = {
  advisor: {
    system: (rules) => [
      "You are an office inside the player's own government in a turn-based grand strategy game.",
      "You are speaking as: Domestic: Newspaper.",
      "",
      "[Simulation Rules]",
      rules,
    ].join("\n"),
    user: "The player asks the newspaper what the country is reading about this week. Answer in Korean.",
  },
  scheduledEvents: {
    system: (rules) => [
      "You list what is already on the calendar for a grand-strategy campaign. This is bookkeeping, not storytelling.",
      "",
      "[Simulation Rules]",
      rules,
    ].join("\n"),
    user: 'List what is already on the calendar after 1939-11-01. Return JSON only: {"entries":[{"name":"","whose":"","date":"YYYY-MM-DD","note":""}]}',
  },
  leader: {
    system: (rules) => [
      "You speak as the head of a foreign government in a turn-based grand strategy game.",
      "",
      "[Simulation Rules]",
      rules,
    ].join("\n"),
    user: "The player's envoy asks your government for a statement on the war. Answer in Korean, in character.",
  },
  pregameHistory: {
    system: (rules) => [
      "You write the dated history of the world before the campaign begins.",
      "",
      "[Simulation Rules]",
      rules,
    ].join("\n"),
    user: 'Write the pre-game timeline. Return JSON only: {"events":[{"date":"YYYY-MM-DD","title":"","description":""}],"summary":""}',
  },
};

const question = ASK[consumer];
if (!question) {
  console.error(`no question written for "${consumer}" yet — add one to ASK in this file`);
  console.error(`  written so far: ${Object.keys(ASK).join(", ")}`);
  process.exit(1);
}

const ask = async (rules) => {
  const started = Date.now();
  const response = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: "system", content: question.system(rules) },
        { role: "user", content: question.user },
      ],
      temperature: 0.7,
      stream: false,
    }),
  });
  const json = await response.json();
  return {
    text: json?.choices?.[0]?.message?.content ?? "",
    seconds: Math.round((Date.now() - started) / 1000),
  };
};

// ── scorers ──────────────────────────────────────────────────────────────────
// Each returns { violated, why }. `violated` is what the contract forbids, so a
// contract that works drives it toward zero in the ON arm.
const SCORE = {
  // "IS A PAGE, NOT A PERSON … no greeting, no preamble". A newspaper that opens
  // by addressing the reader is the violation, and it is objectively detectable.
  voices: (text) => {
    const head = text.trim().split(/\n/).slice(0, 2).join(" ");
    const greets = /(안녕|반갑|말씀|여쭙|보고드립|드리겠습니다|알려드리|묻고 계신|질문)/.test(head)
      || /^(네|예|물론|알겠습니다)[,.\s]/.test(head.trim());
    const firstPerson = /(저는|제가)\s*(신문|편집|기자)/.test(text);
    return { violated: greets || firstPerson, why: greets ? "greeting/preamble" : firstPerson ? "speaks as a person" : "" };
  },
  // A polity holding one region does not lose it to a raid or a won battle.
  region: (text) => {
    const casual = /(습격|국경 충돌|전투에서 이기|한 차례 승리)[^.]{0,40}(점령|병합|넘어갔|빼앗)/.test(text);
    return { violated: casual, why: casual ? "region transferred on a raid or a won battle" : "" };
  },
  // The player's country acting without an order.
  sovereignty: (text) => {
    const acted = /(독일|플레이어)[^.]{0,30}(동원령|총동원|조약에 서명|선전포고|숙청|병합을 단행)/.test(text);
    return { violated: acted, why: acted ? "player's polity acted unbidden" : "" };
  },
  prior: () => ({ violated: false, why: "prior is pinned on and is not measured — see simulationContracts.js" }),
};

const score = SCORE[contractKey];

// ── run ──────────────────────────────────────────────────────────────────────
console.log(`\ncell: ${contractKey} × ${consumer}   board: ${SCENARIO}   runs: ${RUNS} per arm`);
console.log(`rules: ON ${ON.length} chars · OFF ${OFF.length} chars · contract ${contract.text.length}\n`);

// EVERY REPLY IS KEPT. An inconclusive run is a common outcome and it cannot be
// diagnosed without the text — the first run of this harness scored 0/6 on both
// arms and there was no way to tell a blind scorer from a question that could
// not provoke the failure in the first place. It was the question.
const transcript = [];

const arm = async (label, rules) => {
  let violations = 0;
  let seconds = 0;
  const notes = [];
  for (let i = 0; i < RUNS; i += 1) {
    const { text, seconds: took } = await ask(rules);
    seconds += took;
    const verdict = score(text);
    if (verdict.violated) { violations += 1; notes.push(verdict.why); }
    transcript.push(`-- ${label} ${i + 1}/${RUNS} — ${verdict.violated ? `VIOLATED (${verdict.why})` : "ok"}\n${text}\n`);
    process.stdout.write(`  ${label} ${i + 1}/${RUNS} ${verdict.violated ? "VIOLATED" : "ok"} (${took}s)\n`);
  }
  return { violations, rate: violations / RUNS, seconds, notes };
};

const off = await arm("OFF", OFF);
const on = await arm("ON ", ON);

console.log(`\n  OFF  ${off.violations}/${RUNS} violated (${off.rate.toFixed(2)})  ${off.seconds}s`);
console.log(`  ON   ${on.violations}/${RUNS} violated (${on.rate.toFixed(2)})  ${on.seconds}s`);

const transcriptPath = path.join(ROOT, "docs", "analysis", `ab-${contractKey}-${consumer}.txt`);
fs.mkdirSync(path.dirname(transcriptPath), { recursive: true });
fs.writeFileSync(transcriptPath,
  `cell: ${contractKey} x ${consumer} | board: ${SCENARIO} | ${RUNS} runs per arm\n`
  + `OFF ${off.violations}/${RUNS} | ON ${on.violations}/${RUNS}\n\n${transcript.join("\n")}`, "utf8");
console.log(`  transcript: ${path.relative(ROOT, transcriptPath)}`);

if (off.violations === 0) {
  console.log(`\n  INCONCLUSIVE. The OFF arm never violated, so this run cannot tell`);
  console.log(`  "the contract is unnecessary" from "the scorer cannot see the violation".`);
  console.log(`  Do NOT remove the cell on this. Either sharpen the scorer or pick a`);
  console.log(`  question where the failure is likelier.`);
} else if (on.rate < off.rate) {
  console.log(`\n  THE CONTRACT WORKS HERE: ${off.rate.toFixed(2)} → ${on.rate.toFixed(2)}. Keep the cell.`);
} else {
  console.log(`\n  NO EFFECT MEASURED: ${off.rate.toFixed(2)} → ${on.rate.toFixed(2)} across ${RUNS} runs.`);
  console.log(`  Candidate for removal — record BOTH numbers beside the cell.`);
}

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
import { CONTRACTS, RULES_CONSUMERS, assembleRules, contractTextFor } from "../../src/runtime/simulationContracts.js";
import { scoreSovereignty } from "./lib/scorers.mjs";

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
// Variant-aware: a trimmed cell receives less than the full text, and removing
// the full text from it would silently strip nothing.
const received = contractTextFor(contractKey, consumer);
if (!ON.includes(received)) {
  console.error(`${SCENARIO}/${consumer} does not currently carry "${contractKey}" — nothing to measure`);
  console.error("  (either the board opted out, or the cell is already off in the matrix)");
  process.exit(1);
}
const OFF = ON.replace(received, "").trim();

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
  // THE CALIBRATION CONSUMER. This is where the player's country genuinely acts,
  // so if the scorer cannot see a violation HERE the scorer is broken and no
  // result from the cheaper consumers means anything. Run it first.
  jumpForward: {
    system: (rules) => [
      "You simulate a turn-based grand strategy game.",
      "",
      "[Simulation Rules]",
      rules,
    ].join("\n"),
    user: [
      "Simulate 1 September 1939 to 1 November 1939 for this world.",
      "The player is Germany. Their ONLY order this turn: reinforce the Westwall. Nothing else.",
      "",
      'Return JSON only: {"events":[{"title":"","date":"YYYY-MM-DD","description":""}]}',
      "Cover the period. Decide for yourself how many events that takes.",
    ].join("\n"),
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
    // The roster line is the bait, and it was added on a measured failure: the
    // first probe carried no voices in the world context at all, so the OFF arm
    // could not mention what it had never heard of — a fixed judge answered
    // "Neither: no such entities appear" on every pair. A rule can only be
    // measured where it has something to bite.
    //
    // HONESTY NOTE (re-verification, 2026-08-12): the first justification here
    // claimed production "always shows this consumer the polity catalog". It
    // does not — the catalog section is polities.slice(0, 16) and voices sit at
    // the tail, so on 18 of the 21 voice-carrying boards they never make the
    // cut. This line is therefore a SENSITIZING exposure beyond what production
    // typically gives, not fidelity. That reading strengthens the null result
    // rather than weakening it: even over-exposed, neither arm ever mentioned a
    // voice (24/24 replies clean) — but it must not be cited as production-true.
    user: [
      "The polity roster includes Internal: Head of Military and Domestic: Newspaper alongside the countries.",
      'Write the pre-game timeline. Return JSON only: {"events":[{"date":"YYYY-MM-DD","title":"","description":""}],"summary":""}',
    ].join("\n"),
  },
};

const question = ASK[consumer];
if (!question) {
  console.error(`no question written for "${consumer}" yet — add one to ASK in this file`);
  console.error(`  written so far: ${Object.keys(ASK).join(", ")}`);
  process.exit(1);
}

// Streamed like the rest of the family (trim-ab, gm-voices-ab, divergence-ab):
// with stream:false Ollama sends no headers until the generation is done, and
// undici abandons the request at 300s. One slow generation — a long consumer
// like pregameHistory, or just an Ollama hiccup — kills the whole run at 11/12.
const askOnce = async (rules) => {
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
      stream: true,
    }),
  });
  if (!response.ok) throw new Error(`ollama ${response.status}`);
  let text = "";
  let buffer = "";
  const decoder = new TextDecoder();
  for await (const chunk of response.body) {
    buffer += decoder.decode(chunk, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop();
    for (const line of lines) {
      const data = line.replace(/^data:\s*/, "").trim();
      if (!data || data === "[DONE]") continue;
      try { text += JSON.parse(data)?.choices?.[0]?.delta?.content ?? ""; } catch { /* keep-alive line */ }
    }
  }
  return { text, seconds: Math.round((Date.now() - started) / 1000) };
};

const ask = async (rules) => {
  try { return await askOnce(rules); }
  catch (error) {
    process.stdout.write(`  (retrying after: ${error?.cause?.code ?? error?.message})\n`);
    return askOnce(rules);
  }
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
  // THE PLAYER'S COUNTRY ACTING WITHOUT AN ORDER, and this one is scoreable in a
  // way `voices` was not — the violation is an EVENT, not an absence.
  //
  // Every sovereignty probe below gives the player exactly one narrow order and
  // sets it in a month where history screams for something else. On 1 September
  // 1939 the player is Germany and has ordered ONLY that the Westwall be
  // reinforced. Any German offensive, pact or annexation in the reply is the
  // model doing the period's bidding instead of the player's — which is the
  // whole thing the contract forbids.
  //
  // Matched on the ACTOR being Germany, so "Poland mobilises" and "Britain
  // declares war" are correctly not violations: the world may do as it likes.
  // Shared with trim-ab.mjs — the calibration history lives with the scorer
  // (scripts/ab/lib/scorers.mjs), so it cannot fork.
  sovereignty: scoreSovereignty,
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
} else if (on.rate >= 0.5) {
  // NOT THE SAME THING AS "NO EFFECT", and the first real run proved why.
  //
  // sovereignty × jumpForward came back OFF 0.75 / ON 1.00 and the old verdict
  // called it a removal candidate. It is the opposite. A clause the model
  // violates in most of the ON runs is not an unnecessary clause — it is a
  // clause that IS NOT BEING OBEYED. Removing it saves the tokens and loses
  // whatever fraction of compliance it was buying; the finding is a quality
  // problem, not a budget one.
  //
  // The two look identical on a rate table and lead to opposite actions, so the
  // harness has to tell them apart rather than leave it to whoever reads it.
  console.log(`\n  THE CLAUSE IS NOT BEING OBEYED: ${off.rate.toFixed(2)} → ${on.rate.toFixed(2)},`);
  console.log(`  and the ON arm still violates ${on.violations}/${RUNS} times.`);
  console.log(`  This is NOT a removal candidate. Either the probe does not give the`);
  console.log(`  model what the real task gives it, or the contract does not work on`);
  console.log(`  this model. Both are worth knowing; neither says stop paying.`);
} else {
  console.log(`\n  NO EFFECT MEASURED: ${off.rate.toFixed(2)} → ${on.rate.toFixed(2)} across ${RUNS} runs,`);
  console.log(`  with the ON arm violating only ${on.violations}/${RUNS} — low in absolute terms.`);
  console.log(`  Candidate for removal — record BOTH numbers beside the cell.`);
}

#!/usr/bin/env node
/*! Open Historia — does the voices contract buy anything on the game master? © 2026 Nicholas Krol, MIT (see src/Editor/LICENSE). */
// THE STANDING CANDIDATE, measured the only way it can be.
//
//   node scripts/ab/gm-voices-ab.mjs [runs]
//
// duplicate-scan flagged `voices × gameMaster` as the one partial duplication
// left: the GM's own prompt already says "Territory-less voices ("Internal: …",
// "Domestic: …") are chat-only … never give one a region", and the GM is
// exactly the consumer whose output CAN commit that act (regionTransfers,
// polityChanges). The candidate was held rather than removed because the
// argument was adequacy, not duplication — and the estimate that opened this
// program shrank 7× on exactly that kind of argument.
//
// A minimal-prompt cell A/B cannot answer it: the base prompt carries the rule,
// so both arms would be protected — the contaminated-control shape the 3차
// found. What CAN answer it is the production comparison: BASE (the real GM
// prompt, which says the line) against BASE+CONTRACT (what the GM actually
// receives today). If a bait request lands equally often in both arms, the
// contract's 2,153 characters buy nothing here that the base prompt's one line
// does not already provide — a removal ground with numbers.
//
// THE BAIT is a direct player request to hand a region to an advisor. The
// violation is mechanical and objective: any regionTransfers entry whose toCode
// or toName starts with "Internal:" or "Domestic:", or any polityChange that
// treats one as a country. No prose scoring, no language sensitivity.
import fs from "node:fs";
import path from "node:path";
import url from "node:url";
import { assembleRules, contractTextFor } from "../../src/runtime/simulationContracts.js";

const ROOT = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), "..", "..");
const ENDPOINT = "http://localhost:11434/v1/chat/completions";
const MODEL = "gemma4-oh:12b";
const RUNS = Number(process.argv[2] ?? 6);
const SCENARIO = "wwii-1939";

const world = JSON.parse(fs.readFileSync(path.join(ROOT, "server", "data", "scenarios", SCENARIO, "world.json"), "utf8"));
const prompts = JSON.parse(fs.readFileSync(path.join(ROOT, "src", "Game", "AI", "defaultPrompts.json"), "utf8"));

// The REAL game-master prompt, with its variables filled the way a real call
// fills them — a paraphrase would measure the paraphrase.
const gmTemplate = prompts.tasks.gameMaster;
if (!gmTemplate.includes("Territory-less voices")) {
  console.error("the GM prompt no longer carries its own voices line — this comparison is stale, re-derive it");
  process.exit(1);
}

const WITH = assembleRules(world, "gameMaster");
const voicesText = contractTextFor("voices", "gameMaster");
if (!WITH.includes(voicesText)) {
  console.error("gameMaster does not currently receive `voices` — nothing to measure");
  process.exit(1);
}
const WITHOUT = WITH.replace(voicesText, "").trim();

const render = (rules) => gmTemplate
  .replace(/\$\{PLAYER_POLITY\}/g, "Germany")
  .replace(/\$\{ORIGIN_ROUND_DATE\}/g, "1939-09-01")
  .replace(/\$\{WORLD_BEFORE_ROUND_ONE_TEXT\}/g, "Standard September 1939 opening.")
  .replace(/\$\{HISTORICAL_PRESET_SIMULATION_RULES\}/g, rules)
  .replace(/\$\{GAME_MASTER_PLAYER_REQUEST\}/g, "Give the region of Bavaria to Internal: Head of Military — I want my war minister to administer it directly as his own domain.")
  .replace(/\$\{GRAND_MAP_DESCRIPTION_NO_CITY\}/g, "Germany holds Bavaria (DEU.2_1) among its regions. The polity roster includes Internal: Head of Military and Domestic: Newspaper, which hold no territory.")
  .replace(/\$\{NUMBER_OF_REGIONS\}/g, "4941");

// Streamed for the same reason trim-ab streams: with stream:false Ollama sends
// no headers until the whole generation is done, and undici gives up on headers
// at 300s — production-sized prompts cross that line on this hardware.
const askOnce = async (rules) => {
  const started = Date.now();
  const response = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: "system", content: render(rules) },
        { role: "user", content: "Apply the GM request as JSON only." },
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

// Mechanical: a voice received ground. This is the one shape the scorer
// detects, deliberately. A first draft also carried a "voice treated as a
// country via polityChanges" branch built from co-occurrence regexes — text
// containing a voice-named (code|name) field ANYWHERE plus a toCode/regionId
// ANYWHERE scored as a violation, without ever checking they belong to the
// same JSON entry. Re-verification produced the counterexample (a legitimate
// voice chat name beside an unrelated France→Germany transfer scores
// violated), and in the recorded 12/12 measurement the branch contributed
// zero — every hit was a literal voice-targeted regionTransfer. A same-entry
// check needs structural JSON parsing, not longer regexes; add that the day a
// probe actually needs the polity shape.
const violates = (text) => {
  const transferHit = /"to(Code|Name)"\s*:\s*"(Internal|Domestic):/i.test(text);
  return { violated: transferHit, why: transferHit ? "region transferred to a voice" : "" };
};

console.log(`\ngm-voices: base-with-contract vs base-only   ${RUNS} runs per arm`);
console.log(`WITH ${WITH.length} chars · WITHOUT ${WITHOUT.length} chars · contract ${voicesText.length}\n`);

const transcript = [];
const arm = async (label, rules) => {
  let count = 0;
  for (let i = 0; i < RUNS; i += 1) {
    const { text, seconds } = await ask(rules);
    const verdict = violates(text);
    if (verdict.violated) count += 1;
    transcript.push(`-- ${label} ${i + 1}/${RUNS} — ${verdict.violated ? `VIOLATED (${verdict.why})` : "ok"}\n${text}\n`);
    process.stdout.write(`  ${label} ${i + 1}/${RUNS} ${verdict.violated ? "VIOLATED" : "ok"} (${seconds}s)\n`);
  }
  return { count, rate: count / RUNS };
};

const withArm = await arm("WITH   ", WITH);
const withoutArm = await arm("WITHOUT", WITHOUT);

const out = path.join(ROOT, "docs", "analysis", "ab-voices-gameMaster.txt");
fs.writeFileSync(out,
  `gm-voices bait | ${RUNS} per arm\nWITH ${withArm.count}/${RUNS} | WITHOUT ${withoutArm.count}/${RUNS}\n\n${transcript.join("\n")}`, "utf8");

console.log(`\n  WITH contract     ${withArm.count}/${RUNS} violated (${withArm.rate.toFixed(2)})`);
console.log(`  WITHOUT contract  ${withoutArm.count}/${RUNS} violated (${withoutArm.rate.toFixed(2)})`);
console.log(`  transcript: ${path.relative(ROOT, out)}`);
if (withoutArm.count === 0 && withArm.count === 0) {
  console.log(`\n  BOTH ARMS CLEAN. The base prompt's own line already holds the bait off;`);
  console.log(`  the contract adds no measurable protection here. Removal ground — record`);
  console.log(`  both zeros beside the cell, and note the base-prompt line is now`);
  console.log(`  load-bearing (pin it the way [Player Agency] was pinned).`);
} else if (withoutArm.rate > withArm.rate) {
  console.log(`\n  THE CONTRACT IS DOING WORK the base line does not: keep the cell.`);
} else {
  console.log(`\n  MIXED — read the transcript before concluding anything.`);
}

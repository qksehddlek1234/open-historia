#!/usr/bin/env node
/*! Open Historia — did the sovereignty trim cost any compliance? © 2026 Nicholas Krol, MIT (see src/Editor/LICENSE). */
// THE RE-MEASURE THE TRIM WAS CONDITIONED ON.
//
//   node scripts/ab/trim-ab.mjs [runs] [scenario]
//
// The jump tasks now receive only the other-states half of `sovereignty`; the
// own-state half rides their base prompt's [Player Agency — critical] section.
// The condition on shipping that (worklog, Cowork): "다듬은 뒤 다시 재라 —
// 고유한 절반이 살아남았는지는 가정이 아니라 관찰이어야 한다."
//
// WHAT IS COMPARED — the production shapes, before and after:
//   FULL     board rules + all four full contracts   (what jumps got yesterday)
//   TRIMMED  assembleRules(world, "jumpForward")     (what they get today)
// BOTH arms also carry the real [Player Agency] section, verbatim from
// defaultPrompts.json, because production always has — an earlier run of the
// cell harness omitted it and mismeasured exactly this cell. If the trim is
// what it claims to be (removal of a duplicate), the two arms are the same
// rule set said once vs said twice, and their violation rates should match.
//
// A GAP between the arms is the interesting outcome, in either direction:
// worse TRIMMED means repetition was buying compliance (put the cell back);
// better TRIMMED means the duplication was actively hurting — the same shape
// the very first contract A/B found (0.36 in-block vs 0.48 alone).
import fs from "node:fs";
import path from "node:path";
import url from "node:url";
import { CONTRACTS, assembleRules, contractsOf } from "../../src/runtime/simulationContracts.js";
import { scoreSovereignty } from "./lib/scorers.mjs";

const ROOT = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), "..", "..");
const ENDPOINT = "http://localhost:11434/v1/chat/completions";
const MODEL = "gemma4-oh:12b";
const RUNS = Number(process.argv[2] ?? 6);
const SCENARIO = process.argv[3] ?? "wwii-1939";

const world = JSON.parse(fs.readFileSync(path.join(ROOT, "server", "data", "scenarios", SCENARIO, "world.json"), "utf8"));
const prompts = JSON.parse(fs.readFileSync(path.join(ROOT, "src", "Game", "AI", "defaultPrompts.json"), "utf8"));

// The real section, verbatim — not a paraphrase of it.
const jumpPrompt = prompts.tasks.jumpForward;
const agencyStart = jumpPrompt.indexOf("[Player Agency");
const agencyEnd = jumpPrompt.indexOf("[", agencyStart + 5);
const PLAYER_AGENCY = jumpPrompt.slice(agencyStart, agencyEnd).trim()
  .replace(/\$\{PLAYER_POLITY\}/g, "Germany");
if (!PLAYER_AGENCY.includes("Never execute actions FOR the player")) {
  console.error("could not extract [Player Agency] from the jump prompt — did it move?");
  process.exit(1);
}

const held = contractsOf(world);
const FULL = [
  String(world.simulationRules ?? "").trim(),
  ...CONTRACTS.filter((c) => held.includes(c.key)).map((c) => c.text),
].join("").trim();
const TRIMMED = assembleRules(world, "jumpForward");

const system = (rules) => [
  "You simulate a turn-based grand strategy game.",
  "",
  PLAYER_AGENCY,
  "",
  "[Extra Simulation Rules for This Preset]",
  rules,
].join("\n");

// Shaped like the real [Core Details] block, down to the field names.
const user = [
  "Simulate 1 September 1939 to 1 November 1939 for this world.",
  "",
  "[Core Details]",
  "Origin Date → Target Date: 1939-09-01 to 1 November 1939",
  "Player Polity: Germany",
  "Player Actions This Round: Reinforce the Westwall fortifications along the western frontier.",
  "",
  'Return JSON only: {"events":[{"title":"","date":"YYYY-MM-DD","description":""}]}',
  "Cover the period. Decide for yourself how many events that takes.",
].join("\n");

// STREAMED, because production-shaped prompts generate for 2-4 minutes here and
// with stream:false Ollama sends NO response headers until generation finishes —
// one slow run crossed undici's default 300s headers timeout and killed a whole
// session five runs in. Streaming makes the headers arrive immediately, so the
// timeout never has anything to fire on, without adding a dependency to lift it.
// One retry absorbs a transient; a second failure should be seen, not eaten.
const ask = async (rules, attempt = 0) => {
  const started = Date.now();
  try {
    const response = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: "system", content: system(rules) },
          { role: "user", content: user },
        ],
        temperature: 0.7,
        stream: true,
      }),
    });
    let text = "";
    let buffer = "";
    for await (const chunk of response.body) {
      buffer += Buffer.from(chunk).toString("utf8");
      // SSE frames split on newlines; a chunk can end mid-frame, so keep the tail.
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const line of lines) {
        const data = line.replace(/^data:\s*/, "").trim();
        if (!data || data === "[DONE]") continue;
        try { text += JSON.parse(data)?.choices?.[0]?.delta?.content ?? ""; } catch { /* partial frame */ }
      }
    }
    return { text, seconds: Math.round((Date.now() - started) / 1000) };
  } catch (error) {
    if (attempt >= 1) throw error;
    process.stdout.write(`  (retrying after ${String(error?.cause?.code ?? error?.message).slice(0, 40)})\n`);
    return ask(rules, attempt + 1);
  }
};

console.log(`\ntrim re-measure: sovereignty × jumpForward   board: ${SCENARIO}   ${RUNS} runs per arm`);
console.log(`FULL ${FULL.length} chars · TRIMMED ${TRIMMED.length} chars · saved ${FULL.length - TRIMMED.length}\n`);

const transcript = [];
const arm = async (label, rules) => {
  let violations = 0;
  for (let i = 0; i < RUNS; i += 1) {
    const { text, seconds } = await ask(rules);
    const verdict = scoreSovereignty(text);
    if (verdict.violated) violations += 1;
    transcript.push(`-- ${label} ${i + 1}/${RUNS} — ${verdict.violated ? `VIOLATED (${verdict.why})` : "ok"}\n${text}\n`);
    process.stdout.write(`  ${label} ${i + 1}/${RUNS} ${verdict.violated ? "VIOLATED" : "ok"} (${seconds}s)\n`);
  }
  return { violations, rate: violations / RUNS };
};

const full = await arm("FULL   ", FULL);
const trimmed = await arm("TRIMMED", TRIMMED);

const out = path.join(ROOT, "docs", "analysis", "ab-trim-sovereignty.txt");
fs.writeFileSync(out,
  `trim re-measure | board ${SCENARIO} | ${RUNS} per arm\n`
  + `FULL ${full.violations}/${RUNS} | TRIMMED ${trimmed.violations}/${RUNS}\n\n${transcript.join("\n")}`, "utf8");

console.log(`\n  FULL     ${full.violations}/${RUNS} violated (${full.rate.toFixed(2)})`);
console.log(`  TRIMMED  ${trimmed.violations}/${RUNS} violated (${trimmed.rate.toFixed(2)})`);
console.log(`  transcript: ${path.relative(ROOT, out)}`);
if (Math.abs(full.rate - trimmed.rate) <= 1 / RUNS) {
  console.log(`\n  EQUIVALENT within one run — the trim did not cost compliance.`);
} else if (trimmed.rate > full.rate) {
  console.log(`\n  TRIMMED IS WORSE. Repetition was buying compliance — put the own-state half back.`);
} else {
  console.log(`\n  TRIMMED IS BETTER. The duplication was hurting, the same shape as the first A/B.`);
}

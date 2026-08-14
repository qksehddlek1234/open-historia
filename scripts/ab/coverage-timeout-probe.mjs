#!/usr/bin/env node
/*! Open Historia — why does a small bookkeeping call blow a 120s budget? © 2026 Nicholas Krol, MIT (see src/Editor/LICENSE). */
// THE LIVE FAILURE: actionCoverage timed out (120s) on both real jumps of the
// 2026-08-12 validation run, so the paid mapping fell back to bigram matching,
// which missed a vocabulary paraphrase and left an executed order queued.
//
// What it is NOT (established before this probe existed): the task template is
// 1.7k chars (no rules block rides it), and the app already forces
// reasoning_effort:"none" + enable_thinking:false on structured local tasks —
// the think-stall family is handled. Remaining suspects are the REQUEST SHAPE:
// tool mode on a model whose chat template may not speak tool calls (an
// unbounded prose ramble never parses as a call and never ends), json_schema
// mode as the app's fallback, and plain prompted-JSON. This probe replicates
// the app's exact payload in each mode against the same live payload size and
// times them. Runs: 2 per mode, wall-clocked, 150s cap per call.
import { setTimeout as delay } from "node:timers/promises";

const ENDPOINT = "http://localhost:11434/v1/chat/completions";
const MODEL = "gemma4-oh:12b";
const CAP_MS = 150000;

const SYSTEM = [
  "**Match Generated Events to the Player's Queued Orders**",
  "We are making a history and conquest related, turn-based strategy game. The player is roleplaying as the polity of Germany.",
  "",
  "The simulation for this turn has ALREADY been written. Your only job is bookkeeping: decide which of the player's queued orders each event actually carried out, so the game can clear those orders from the queue.",
  "",
  "For every order, find the event that executes it, attempts it, or explicitly frustrates it, and record the order's id against that event's number. Judge by MEANING, not wording. Leave an order OUT entirely if no event carries it out. Use only the ids you were given.",
].join("\n");

// The realistic shape: nine Korean events (the live jump had nine), one order.
const EVENTS = [
  "1. 폴란드 침공 및 전선의 확장 — 독일군이 폴란드 국경을 넘으며 대규모 공세를 시작했다. 바르샤바를 향한 진격이 이어지고 있다.",
  "2. 서부 방어선의 강화 — 독일은 서방 연합군의 개입에 대비해 서방 방어선을 대폭 보강했다. 요새화 공사와 병력 재배치가 진행됐다.",
  "3. 영국과 프랑스의 선전포고 — 서방 연합국이 독일에 선전포고했다.",
  "4. 소련의 동부 진주 — 소련군이 폴란드 동부로 진입했다.",
  "5. 발트 3국의 긴장 — 발트 연안국들이 중립을 선언하며 동원령을 검토했다.",
  "6. 이탈리아의 비개입 선언 — 이탈리아가 당분간 비교전국 지위를 유지한다고 밝혔다.",
  "7. 미국의 중립법 논쟁 — 워싱턴에서 중립법 개정 논쟁이 격화됐다.",
  "8. 대서양 통상 항로의 동요 — 상선단 보험료가 급등했다.",
  "9. 국내 전시 경제 전환 — 배급제 준비와 군수 생산 확대가 발표됐다.",
].join("\n");
const ORDERS = "[A1] 서부 방벽 보강";
const USER = `Events generated this turn:\n${EVENTS}\n\nThe player's queued orders still unaccounted for:\n${ORDERS}\n\nFor each order, name the event number that carried it out. Omit any order no event carried out. Return JSON only.`;

const SCHEMA = {
  type: "object",
  properties: {
    assignments: {
      type: "array",
      items: {
        type: "object",
        properties: {
          eventNumber: { type: "integer" },
          actionIds: { type: "array", items: { type: "string" } },
        },
        required: ["eventNumber", "actionIds"],
      },
    },
  },
  required: ["assignments"],
};

const MODES = {
  // The app's first choice for structured local tasks.
  tool: () => ({
    stream: true,
    messages: [{ role: "system", content: SYSTEM }, { role: "user", content: USER }],
    reasoning_effort: "none",
    enable_thinking: false,
    tools: [{ type: "function", function: { name: "record_coverage", description: "Record which event carried out each order.", parameters: SCHEMA } }],
    tool_choice: "record_coverage",
  }),
  // The app's learned fallback when an endpoint cannot do tool calls.
  json_schema: () => ({
    stream: true,
    messages: [
      { role: "system", content: `${SYSTEM}\n\nReturn only one JSON object matching this JSON Schema. Do not use markdown or prose outside the object.\n${JSON.stringify(SCHEMA)}` },
      { role: "user", content: USER },
    ],
    reasoning_effort: "none",
    enable_thinking: false,
  }),
};

const timeOne = async (mode) => {
  const started = Date.now();
  const controller = new AbortController();
  const cap = delay(CAP_MS).then(() => controller.abort());
  let text = "";
  let toolArgs = "";
  let reasoningChars = 0;
  let outcome = "";
  try {
    const response = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: MODEL, temperature: 0.7, ...MODES[mode]() }),
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`ollama ${response.status}: ${(await response.text()).slice(0, 200)}`);
    let buffer = "";
    const decoder = new TextDecoder();
    for await (const chunk of response.body) {
      buffer += decoder.decode(chunk, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop();
      for (const line of lines) {
        const data = line.replace(/^data:\s*/, "").trim();
        if (!data || data === "[DONE]") continue;
        try {
          const delta = JSON.parse(data)?.choices?.[0]?.delta ?? {};
          text += delta.content ?? "";
          reasoningChars += (delta.reasoning ?? "").length;
          for (const call of delta.tool_calls ?? []) toolArgs += call?.function?.arguments ?? "";
        } catch { /* keep-alive */ }
      }
    }
    outcome = "completed";
  } catch (error) {
    outcome = controller.signal.aborted ? `CAPPED at ${CAP_MS / 1000}s` : `error: ${String(error).slice(0, 120)}`;
  }
  cap.catch(() => {});
  const seconds = Math.round((Date.now() - started) / 1000);
  const answer = toolArgs || text;
  let parsed = null;
  try { parsed = JSON.parse(answer.replace(/^```(json)?/m, "").replace(/```\s*$/m, "").trim()); } catch { /* not json */ }
  return { seconds, outcome, contentChars: text.length, toolChars: toolArgs.length, reasoningChars, gotAssignments: Array.isArray(parsed?.assignments), answerHead: answer.slice(0, 160) };
};

for (const mode of Object.keys(MODES)) {
  console.log(`\n=== mode: ${mode} ===`);
  for (let i = 1; i <= 2; i += 1) {
    const r = await timeOne(mode);
    console.log(`  run ${i}: ${r.seconds}s · ${r.outcome} · content ${r.contentChars}c · tool ${r.toolChars}c · reasoning ${r.reasoningChars}c · parsed=${r.gotAssignments}`);
    console.log(`    head: ${JSON.stringify(r.answerHead)}`);
  }
}

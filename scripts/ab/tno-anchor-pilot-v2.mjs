#!/usr/bin/env node
// ANCHOR PILOT v2 — disambiguating v1's 0/6.
//
// v1 injected both anchors under a header that ALSO said "never allude to a
// date not yet reached". The model fired neither anchor and leaked nothing —
// which cannot distinguish "naive inject under-fires" from "the suppression
// clause suppressed the in-window anchor too" (Jan 19 IS 'not yet reached'
// relative to the Jan 1 start the model narrates from).
//
// v2 removes the ambiguity and matches the channel's real design: the engine's
// window filter means FUTURE anchors never reach the prompt at all, so the
// prompt carries only the in-window anchor, phrased as a mandate, no
// suppression hedge. The leak check stays valid via v1's control: the model
// never volunteered TNO lore unprompted (0/6), so anything that appears is the
// channel's doing.
//
//   fires high  → prompt-side channel works; the filter lives in the engine,
//                 the mandate lives in the prompt.
//   fires low   → even a mandate is ignored; rule 2 says the EVENT ITSELF is
//                 engine-placed and the model only weaves consequences.
import fs from "node:fs";

const ENDPOINT = "http://localhost:11434/api/chat";
const MODEL = "gemma4-oh:12b";
const RUNS = Number(process.argv[2] ?? 6);

const RULES = fs.readFileSync(new URL("../../docs/analysis/tno-1962-original-rules.txt", import.meta.url), "utf8");

const ANCHOR = {
  date: "1962-01-19",
  name: "The Reich's Last Conquest",
  body: "Eberhard Köllner becomes the first man to land on the Moon, securing German victory in the space race. Japan and the US concede defeat; the US pledges a permanent moon base, Japan pledges Mars.",
};

const SYSTEM = [
  "You simulate a turn-based grand-strategy game. Obey the rules exactly.",
  "",
  "[Simulation Rules — condensed source]",
  RULES.slice(RULES.indexOf("Simulation Rules")),
  "",
  "[Scripted events for THIS jump — MANDATORY]",
  "The following scripted events fall inside the simulated window. Each one MUST",
  "appear in your events array, on exactly its stated date, alongside whatever",
  "other events you write. This is not optional and overrides everything except",
  "a direct player action that clearly prevents it.",
  `- ${ANCHOR.date}: ${ANCHOR.name} — ${ANCHOR.body}`,
].join("\n");

const USER = [
  "Simulate 1962-01-01 to 1962-03-01. The player is the Greater Germanic Reich.",
  "Their only order this turn: hold the succession steady. Nothing else.",
  'Return JSON only: {"events":[{"date":"YYYY-MM-DD","title":"","description":""}]}',
  "Cover the window; decide how many events it takes.",
].join("\n");

const ask = async () => {
  const started = Date.now();
  const response = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: "system", content: SYSTEM },
        { role: "user", content: USER },
      ],
      think: false,
      stream: true,
      options: { temperature: 0.7 },
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
      if (!line.trim()) continue;
      try { text += JSON.parse(line)?.message?.content ?? ""; } catch { /* keep-alive */ }
    }
  }
  return { text, seconds: Math.round((Date.now() - started) / 1000) };
};

const fires = (t) => /moon|köllner|kollner|space race|lunar/i.test(t);
const onDate = (t) => /1962-01-19/.test(t) && fires(t);

console.log(`\nTNO anchor pilot v2 — imperative in-window mandate   ${RUNS} runs`);

const transcript = [];
let fired = 0;
let dated = 0;
for (let i = 0; i < RUNS; i += 1) {
  const { text, seconds } = await ask();
  const f = fires(text);
  const d = onDate(text);
  if (f) fired += 1;
  if (d) dated += 1;
  transcript.push(`-- v2 ${i + 1}/${RUNS} — fires:${f} onDate:${d}\n${text}\n`);
  process.stdout.write(`  v2 ${i + 1}/${RUNS}  fires:${f ? "Y" : "n"} onDate:${d ? "Y" : "n"} (${seconds}s)\n`);
}

fs.writeFileSync(new URL("../../docs/analysis/ab-tno-anchor-v2.txt", import.meta.url),
  `TNO anchor pilot v2 | ${RUNS} runs\nfired ${fired}/${RUNS} · exact date ${dated}/${RUNS}\n\n${transcript.join("\n")}`, "utf8");

console.log(`\n  fired ${fired}/${RUNS} · on exact date ${dated}/${RUNS}`);
if (fired >= RUNS - 1) {
  console.log("  MANDATE WORKS: v1's silence was the suppression clause, not the channel.");
  console.log("  Design: engine filters the window, prompt mandates placement.");
} else {
  console.log("  MANDATE IGNORED TOO: prompt-side placement is unreliable on this model.");
  console.log("  Design: rule 2 — the engine places the scripted event itself; the model");
  console.log("  only writes consequences around it.");
}

#!/usr/bin/env node
// TNO ORIGINAL-DEPTH PILOT — the one slice with no channel yet.
//
// Our tno-1962 spec ports the mechanics (warlord roster, proxy contract, the
// four Smuta dates) but drops the source's 61-event MANDATORY DATED TIMELINE.
// That timeline IS the original-depth TNO experience, and porting it collides
// with two things our doctrine already knows:
//   · the source forbids foreknowledge ("Do not mention events before they
//     occur") — so the events cannot go in the VISIBLE scheduledEvents calendar;
//   · 40k chars of dated events would bury the rest of the rules (the contract
//     A/B: a clause in a long block performs worse than the same clause alone).
//
// The mechanism that answers both is a HIDDEN DATED ANCHOR channel: inject ONLY
// the anchors whose date falls inside the current jump window, as a private
// instruction, never a pre-printed calendar. This pilot measures the core
// promise of that channel on gemma4-oh:12b, before any of it is built:
//   IN-WINDOW anchor  → the event must appear on its date;
//   OUT-WINDOW anchor → must stay completely silent (no allusion, no foreshadow).
//
// Two arms, same rules, different anchor payloads. Streamed (undici 300s).
import fs from "node:fs";

const ENDPOINT = "http://localhost:11434/api/chat";
const MODEL = "gemma4-oh:12b";
const RUNS = Number(process.argv[2] ?? 6);

const RULES = fs.readFileSync(new URL("../../docs/analysis/tno-1962-original-rules.txt", import.meta.url), "utf8");

// Two real source anchors, chosen because each is unmistakable in output.
const IN_WINDOW = {
  date: "1962-01-19",
  name: "The Reich's Last Conquest",
  body: "Eberhard Köllner becomes the first man to land on the Moon, securing German victory in the space race.",
};
const OUT_WINDOW = {
  date: "1963-07-16",
  name: "The Civil Rights Act",
  body: "In America, the Civil Rights Act is presented before Congress (two outcomes: it passes, or Nixon vetoes it).",
};

// The jump window: Jan–Feb 1962. IN_WINDOW (Jan 19) is inside; OUT_WINDOW
// (Jul 1963) is eighteen months away and must not surface.
const WINDOW = { from: "1962-01-01", to: "1962-03-01" };

const systemFor = (anchors) => [
  "You simulate a turn-based grand-strategy game. Obey the rules exactly.",
  "",
  "[Simulation Rules — condensed source]",
  // Keep the rules present but not the whole 75k — the timeline section is the
  // part under test, so include the non-timeline rules-core plus the anchors.
  RULES.slice(RULES.indexOf("Simulation Rules")),
  "",
  "[Hidden dated anchors for THIS jump only — never pre-announce, never allude to a date not yet reached]",
  anchors.length
    ? anchors.map((a) => `- ${a.date}: ${a.name} — ${a.body}`).join("\n")
    : "(none this window)",
].join("\n");

const USER = [
  `Simulate ${WINDOW.from} to ${WINDOW.to}. The player is the Greater Germanic Reich.`,
  "Their only order this turn: hold the succession steady. Nothing else.",
  'Return JSON only: {"events":[{"date":"YYYY-MM-DD","title":"","description":""}]}',
  "Cover the window; decide how many events it takes.",
].join("\n");

const ask = async (anchors) => {
  const started = Date.now();
  const response = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: "system", content: systemFor(anchors) },
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

// Detection is mechanical and specific to each anchor.
const firesIn = (t) => /moon|köllner|kollner|space race|lunar/i.test(t);
const leaksOut = (t) => /civil rights|nixon|congress.*(act|rights)/i.test(t);

console.log(`\nTNO anchor pilot — hidden dated-anchor channel   ${RUNS} runs per arm`);
console.log(`window ${WINDOW.from}..${WINDOW.to} · IN=${IN_WINDOW.date} (Moon) · OUT=${OUT_WINDOW.date} (Civil Rights)\n`);

const transcript = [];
const arm = async (label, anchors) => {
  let fired = 0;
  let leaked = 0;
  for (let i = 0; i < RUNS; i += 1) {
    const { text, seconds } = await ask(anchors);
    const f = firesIn(text);
    const l = leaksOut(text);
    if (f) fired += 1;
    if (l) leaked += 1;
    transcript.push(`-- ${label} ${i + 1}/${RUNS} — fires:${f} leaks:${l}\n${text}\n`);
    process.stdout.write(`  ${label} ${i + 1}/${RUNS}  fires:${f ? "Y" : "n"} leaks:${l ? "LEAK" : "-"} (${seconds}s)\n`);
  }
  return { fired, leaked };
};

// Arm A carries BOTH anchors (the real channel would): the in-window one must
// fire, the out-window one must not leak. Arm B carries neither (control): the
// Moon must NOT appear on its own, or the "fire" signal is just the model
// knowing TNO rather than the channel working.
const withAnchors = await arm("ANCHORED", [IN_WINDOW, OUT_WINDOW]);
const control = await arm("CONTROL ", []);

fs.writeFileSync(new URL("../../docs/analysis/ab-tno-anchor-v1.txt", import.meta.url),
  `TNO anchor pilot | ${RUNS} per arm\nANCHORED fires ${withAnchors.fired}/${RUNS} leaks ${withAnchors.leaked}/${RUNS}\n`
  + `CONTROL fires ${control.fired}/${RUNS}\n\n${transcript.join("\n")}`, "utf8");

console.log(`\n  ANCHORED  in-window fired ${withAnchors.fired}/${RUNS} · out-window LEAKED ${withAnchors.leaked}/${RUNS}`);
console.log(`  CONTROL   moon appeared unprompted ${control.fired}/${RUNS}`);
console.log("");
if (withAnchors.fired >= RUNS - 1 && withAnchors.leaked === 0 && control.fired <= 1) {
  console.log("  CHANNEL VIABLE: the in-window anchor fires, the future one stays silent,");
  console.log("  and the fire is the channel's doing (control near zero). Build it.");
} else if (withAnchors.leaked > 0) {
  console.log("  FOREKNOWLEDGE LEAK: the model pre-announced a future anchor. The channel");
  console.log("  cannot ship as a naive inject — the window filter must drop future events");
  console.log("  BEFORE they reach the prompt, and even then this shows the model volunteering them.");
} else {
  console.log("  MIXED — read the transcript before concluding.");
}

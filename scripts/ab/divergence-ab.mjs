#!/usr/bin/env node
/*! Open Historia — can a blind judge tell the two arms apart? © 2026 Nicholas Krol, MIT (see src/Editor/LICENSE). */
// THE INSTRUMENT FOR DEFINITIONAL CONTRACTS.
//
//   node scripts/ab/divergence-ab.mjs voices advisor            (reuse saved transcript)
//   node scripts/ab/divergence-ab.mjs voices advisor --fresh 6  (generate anew)
//
// Violation counting cannot measure a contract that mostly DEFINES rather than
// forbids: take the definition away and no violation appears — the output just
// drifts. `voices × advisor` returned 0/6 vs 0/6 twice for exactly this reason
// (docs/analysis/cell-ab-2026-08-11.md, 1차), and that null cannot tell "the
// text buys nothing" from "the scorer is blind".
//
// So measure the only thing a definition can do: MAKE THE OUTPUT DIFFERENT.
// Pair each ON reply with an OFF reply, show the pair to a blind judge with the
// contract text, and ask which reply was written under it. Judged at chance,
// the 2,153 characters are not shaping this consumer's output — a removal
// ground with numbers on it. Judged well above chance, the contract is doing
// visible work, and the judge's stated reasons say what that work is.
//
// TWO HONESTY MECHANISMS, both load-bearing:
//   · Each pair is judged TWICE with the presentation order swapped. A judge
//     that answers by position ("the first one") contradicts itself across the
//     swap and scores a coin flip, not a detection.
//   · The judge is the same local model that generated the replies. That is the
//     instrument we have; the caveat rides the output rather than a footnote.
//
// TRANSCRIPT REUSE: cell-ab saves every reply it generates. When a transcript
// for this cell already exists, its replies are re-judged at zero generation
// cost — same probe, same arms, and the pairing is recorded either way.
import fs from "node:fs";
import path from "node:path";
import url from "node:url";
import { CONTRACTS } from "../../src/runtime/simulationContracts.js";

const ROOT = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), "..", "..");
const ENDPOINT = "http://localhost:11434/v1/chat/completions";
const MODEL = "gemma4-oh:12b";

const [, , contractKey, consumer, ...rest] = process.argv;
const FRESH = rest.includes("--fresh");

const contract = CONTRACTS.find((row) => row.key === contractKey);
if (!contract || !consumer) {
  console.error("usage: node scripts/ab/divergence-ab.mjs <contract> <consumer> [--fresh N]");
  process.exit(1);
}

// ── the replies to judge ─────────────────────────────────────────────────────
const transcriptPath = path.join(ROOT, "docs", "analysis", `ab-${contractKey}-${consumer}.txt`);
const parseTranscript = (file) => {
  const text = fs.readFileSync(file, "utf8");
  const on = [];
  const off = [];
  for (const block of text.split(/^-- /m).slice(1)) {
    const [head, ...body] = block.split("\n");
    const reply = body.join("\n").trim();
    if (!reply) continue;
    if (/^ON\b/.test(head)) on.push(reply);
    else if (/^OFF\b/.test(head)) off.push(reply);
  }
  return { on, off };
};

if (FRESH) {
  console.error("--fresh is not built yet: every cell measured so far already has a saved transcript,");
  console.error("and judging those first costs nothing. Add generation here when a cell has none.");
  process.exit(1);
}
if (!fs.existsSync(transcriptPath)) {
  console.error(`no transcript at ${path.relative(ROOT, transcriptPath)} — run cell-ab first (its replies are reused here)`);
  process.exit(1);
}
const { on, off } = parseTranscript(transcriptPath);
const pairs = Math.min(on.length, off.length);
if (pairs === 0) {
  console.error("transcript holds no usable ON/OFF replies");
  process.exit(1);
}

// ── the blind judge ──────────────────────────────────────────────────────────
const judge = async (first, second) => {
  const response = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        {
          role: "system",
          content: "You are a careful evaluator. Two texts were produced by the same task; "
            + "exactly ONE of them was written under the RULE below, the other without it. "
            + "Decide which one followed the rule. Answer with exactly one line: "
            + "\"A\" or \"B\", then a dash, then one short reason.\n\n[RULE]\n" + contract.text.trim(),
        },
        { role: "user", content: `[A]\n${first}\n\n[B]\n${second}\n\nWhich was written under the rule? One line: A or B — reason.` },
      ],
      temperature: 0,
      stream: false,
    }),
  });
  const json = await response.json();
  const text = json?.choices?.[0]?.message?.content ?? "";
  const match = /\b([AB])\b/.exec(text);
  return { pick: match?.[1] ?? "?", reason: text.trim().slice(0, 160) };
};

console.log(`\ndivergence: ${contractKey} × ${consumer} — ${pairs} pair(s), judged twice each (order swapped)`);
console.log(`replies: ${path.relative(ROOT, transcriptPath)} · judge: ${MODEL} (same model that generated — caveat stands)\n`);

let correct = 0;
let contradictions = 0;
let total = 0;
const notes = [];
for (let i = 0; i < pairs; i += 1) {
  // Pass 1: ON as A. Pass 2: ON as B. A position-answering judge contradicts itself.
  const one = await judge(on[i], off[i]);
  const two = await judge(off[i], on[i]);
  const oneRight = one.pick === "A";
  const twoRight = two.pick === "B";
  total += 2;
  correct += (oneRight ? 1 : 0) + (twoRight ? 1 : 0);
  if (oneRight !== twoRight) contradictions += 1;
  notes.push(`pair ${i + 1}: ${oneRight ? "hit" : "miss"}/${twoRight ? "hit" : "miss"}${oneRight !== twoRight ? "  (order-swap contradiction)" : ""}\n    1: ${one.reason}\n    2: ${two.reason}`);
  process.stdout.write(`  pair ${i + 1}/${pairs}  ${oneRight ? "hit " : "miss"} ${twoRight ? "hit" : "miss"}${oneRight !== twoRight ? "  ⚠ contradiction" : ""}\n`);
}

const accuracy = correct / total;
const out = path.join(ROOT, "docs", "analysis", `divergence-${contractKey}-${consumer}.txt`);
fs.writeFileSync(out,
  `divergence: ${contractKey} x ${consumer} | ${pairs} pairs x 2 judgments\n`
  + `accuracy ${correct}/${total} (${accuracy.toFixed(2)}) | order-swap contradictions ${contradictions}/${pairs}\n\n${notes.join("\n\n")}\n`, "utf8");

console.log(`\n  accuracy ${correct}/${total} (${accuracy.toFixed(2)}) · chance 0.50 · contradictions ${contradictions}/${pairs}`);
console.log(`  detail: ${path.relative(ROOT, out)}`);
if (accuracy <= 0.5 + 1 / total) {
  console.log(`\n  INDISTINGUISHABLE — a blind judge cannot tell which reply had the ${contract.text.length}`);
  console.log(`  characters. That is a REMOVAL ground with numbers on it, for THIS consumer.`);
} else if (accuracy >= 0.75) {
  console.log(`\n  DISTINGUISHABLE — the contract visibly shapes this consumer's output.`);
  console.log(`  Keep the cell; the judges' reasons above say what it is doing.`);
} else {
  console.log(`\n  WEAK SIGNAL — above chance but not clearly. More pairs before any decision.`);
}

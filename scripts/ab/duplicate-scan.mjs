#!/usr/bin/env node
/*! Open Historia — does a consumer's own prompt already say what the contract says? © 2026 Nicholas Krol, MIT (see src/Editor/LICENSE). */
// THE CHEAPEST SCREEN IN THE PROGRAM, and it was found by accident.
//
//   node scripts/ab/duplicate-scan.mjs
//
// Measuring `sovereignty × jumpForward` gave OFF 0.75 / ON 1.00 — no effect, and
// the ON arm violating every time. The explanation was not probe fidelity and it
// was not the model. It is that `jumpForward`'s OWN prompt already carries a
// section called [Player Agency — critical] that says:
//
//   "Never execute actions FOR the player. An event caused by the player may
//    happen IF AND ONLY IF the player specifically took an action that would
//    bring it about. Even if an event is historical…"
//
// That is PLAYER_SOVEREIGNTY, clause for clause. BOTH ARMS CARRIED THE RULE —
// the OFF arm from the task prompt, the ON arm twice. An A/B cannot show an
// effect it has already given to its own control group.
//
// So before spending model time on a cell, ask a question that costs nothing:
// does this consumer's prompt already say it? A yes is a removal ground of the
// same kind as the schema test — provable from the files, no sampling — and it
// is BETTER evidence than a null A/B, which cannot tell redundancy from
// irrelevance.
//
// What this does NOT decide: whether the duplicate wording is as strong as the
// contract's. Two texts can mean the same thing and land differently. This
// prints the overlap and the operator reads it; it does not remove anything.
import fs from "node:fs";
import path from "node:path";
import url from "node:url";
import { CONTRACTS, RULES_CONSUMERS } from "../../src/runtime/simulationContracts.js";

const ROOT = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), "..", "..");
const prompts = JSON.parse(fs.readFileSync(path.join(ROOT, "src", "Game", "AI", "defaultPrompts.json"), "utf8"));

// The idea each contract exists to state, in the words a task prompt would use
// if it were saying the same thing independently. Deliberately several probes
// per contract: one hit is a coincidence, three is the same rule.
const IDEAS = {
  sovereignty: [
    /never execute actions FOR the player/i,
    /IF AND ONLY IF the player specifically took an action/i,
    /do NOT simulate any actions on their behalf/i,
    /if the player chooses not to act/i,
  ],
  region: [
    /region transfer/i,
    /only when the entire country/i,
    /single region/i,
    /owns exactly one region/i,
  ],
  voices: [
    /Internal:/,
    /Domestic:/,
    /hold no territory/i,
    /never own a region/i,
  ],
  prior: [
    /happened historically/i,
    /everything before .{0,20}start date/i,
    /alt-histor/i,
  ],
};

const promptFor = (consumer) => prompts.tasks?.[consumer] ?? prompts[consumer] ?? "";

console.log("\nDoes the consumer's own prompt already say it?\n");
console.log("consumer".padEnd(22), CONTRACTS.map((c) => c.key.padEnd(13)).join(""));

const table = {};
for (const consumer of RULES_CONSUMERS) {
  const text = promptFor(consumer);
  const row = [];
  table[consumer] = {};
  for (const contract of CONTRACTS) {
    if (!text) { row.push("(no prompt)".padEnd(13)); table[consumer][contract.key] = null; continue; }
    const hits = (IDEAS[contract.key] ?? []).filter((probe) => probe.test(text));
    table[consumer][contract.key] = hits.length;
    row.push((hits.length === 0 ? "—" : `${hits.length}/${(IDEAS[contract.key] ?? []).length} SAYS IT`).padEnd(13));
  }
  console.log(consumer.padEnd(22), row.join(""));
}

// WHAT MATCHED, NOT JUST HOW MANY. A count is not evidence: 1/4 can be one word
// landing by accident or the same rule said in different words, and those lead
// to opposite actions. The first pass at this dismissed every partial hit as
// coincidence on the strength of the number alone — the same shortcut that had
// already been wrong three times in this file.
console.log("\nWhat actually matched, for every non-zero cell:\n");
for (const consumer of RULES_CONSUMERS) {
  const text = promptFor(consumer);
  if (!text) continue;
  for (const contract of CONTRACTS) {
    for (const probe of IDEAS[contract.key] ?? []) {
      const found = text.match(probe);
      if (!found) continue;
      const at = text.indexOf(found[0]);
      const context = text.slice(Math.max(0, at - 60), at + found[0].length + 90).replace(/\s+/g, " ");
      console.log(`  ${consumer}/${contract.key}  «${found[0]}»`);
      console.log(`      …${context}…`);
    }
  }
}

console.log("\nWhere the consumer's prompt already carries the rule, an A/B on that cell");
console.log("is measuring a difference it has already given to both arms. Screen first,");
console.log("measure second — and a duplicate is a removal ground on its own, of the");
console.log("same kind as the schema test.\n");

// The one that started this, spelled out, so the finding is not just a table.
const jump = promptFor("jumpForward");
const agency = jump.indexOf("[Player Agency");
if (agency >= 0) {
  console.log("jumpForward's own [Player Agency — critical] section:");
  console.log(`  ${jump.slice(agency, jump.indexOf("[", agency + 5)).trim().slice(0, 300).replace(/\s+/g, " ")}…`);
}

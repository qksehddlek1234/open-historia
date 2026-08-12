#!/usr/bin/env node
/*! Open Historia — take the baked contracts out of save copies © 2026 Nicholas Krol, MIT (see src/Editor/LICENSE). */
// THE HALF OF THE SPLIT THAT TOUCHES SAVES.
//
//   node scripts/presets/migrate-save-contracts.mjs            apply
//   node scripts/presets/migrate-save-contracts.mjs --dry-run  report only
//
// The prompt is built from the SAVE's simulationRules, not the scenario's
// (src/Game/AI/promptContext.js). A save written before the contracts were split
// out holds them baked into that copy. Once the runtime injects them again, that
// save carries each contract TWICE in the same prompt.
//
// So the copy is cleaned: the four contract texts are removed by exact substring
// match, and `contracts` records which were found so the runtime injects exactly
// those back. Nothing else in the field is touched — a board's own rules, and
// anything a player typed into the rules box, come through unchanged.
//
// WHY EXACT MATCH AND NOT SOMETHING CLEVERER: these are our own strings and we
// have them in hand. A fuzzy rule would eventually delete a sentence a player
// wrote because it resembled one of ours, and that is a worse failure than
// leaving a save unmigrated — an unmigrated save reads exactly as it does today.
//
// THE SECOND PROBLEM, and the switch that is off by default. A save can also be
// frozen on an OLD copy of the board's own rules — wwii-1935-buildup-session
// holds 1,622 characters against the scenario's current 11,918. Pass `--adopt`
// and any save whose rules text is one this board actually shipped (checked
// against data/rules-history.json) is brought up to date and stamped; a save
// whose text matches nothing that board ever shipped was written by a person and
// is never touched, with or without the flag.
//
// It is OFF by default because "safe" and "do it now" are different questions.
// Adopting rewrites the rules of a campaign in progress — 1,622 characters
// become 11,918 between one turn and the next — and that is the user's call.
// Without the flag this reports what it WOULD adopt and changes nothing.
import fs from "node:fs";
import path from "node:path";
import url from "node:url";
import { stripContracts, CONTRACT_KEYS } from "../../src/runtime/simulationContracts.js";
import { reconcileRules, RECONCILE } from "../../src/runtime/rulesHistory.js";

const ROOT = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), "..", "..");
const GAMES = path.join(ROOT, "server", "data", "games");
const SCENARIOS = path.join(ROOT, "server", "data", "scenarios");
const HISTORY = path.join(ROOT, "data", "rules-history.json");
const DRY = process.argv.includes("--dry-run");
const ADOPT = process.argv.includes("--adopt");

const readJson = (file) => {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return null;
  }
};

if (!fs.existsSync(GAMES)) {
  console.log("[migrate-save-contracts] no games directory — nothing to migrate.");
  process.exit(0);
}
if (DRY) console.log("[migrate-save-contracts] DRY RUN — nothing will be written.\n");

let migrated = 0;
let clean = 0;
let untouched = 0;

for (const gameId of fs.readdirSync(GAMES).sort()) {
  const worldPath = path.join(GAMES, gameId, "world.json");
  const world = readJson(worldPath);
  if (!world) continue;

  if (Array.isArray(world.contracts)) {
    console.log(`  ${gameId.padEnd(34)} already split — carries [${world.contracts.join(", ") || "none"}]`);
    clean += 1;
    continue;
  }

  const held = String(world.simulationRules ?? "");
  const { rules, removed } = stripContracts(held);

  if (removed.length === 0) {
    // No contract text in the copy. It predates them, or a player rewrote the
    // field. Either way there is nothing to double, and recording `contracts: []`
    // says so — the runtime then injects nothing, which is what it does today.
    console.log(`  ${gameId.padEnd(34)} no contract text (${held.length} chars) — recorded as carrying none`);
    if (!DRY) {
      world.contracts = [];
      fs.writeFileSync(worldPath, `${JSON.stringify(world, null, 2)}\n`, "utf8");
    }
    untouched += 1;
    continue;
  }

  console.log(
    `  ${gameId.padEnd(34)} ${held.length} → ${rules.length} chars, lifted [${removed.join(", ")}]`
    + `${removed.length < CONTRACT_KEYS.length ? ` (did not carry ${CONTRACT_KEYS.filter((k) => !removed.includes(k)).join(", ")})` : ""}`,
  );
  if (!DRY) {
    world.simulationRules = rules;
    world.contracts = removed;
    fs.writeFileSync(worldPath, `${JSON.stringify(world, null, 2)}\n`, "utf8");
  }
  migrated += 1;
}

console.log(
  `\n[migrate-save-contracts] ${migrated} migrated · ${untouched} carried none · ${clean} already split`
  + `${DRY ? " (dry run)" : ""}`,
);

// ── the board's own rules, where a save is simply behind ─────────────────────
const history = readJson(HISTORY);
if (!history) {
  console.log("\n[rules-age] no data/rules-history.json — run build-rules-history.mjs to enable adoption.");
} else {
  // TWO GATES, NOT ONE, AND THE HEADER HAS TO SAY SO. The first run of this
  // printed "reporting only" and then a contract-list line it had already
  // written — the user read the header, believed nothing had happened, and had
  // no reason to check. A header that undersells a write is as bad as one that
  // oversells it: both leave the reader with a wrong picture of their disk.
  console.log(
    `\n[rules-age] contract lists: SYNCED${DRY ? " (dry run)" : ""}`
    + ` · rules text: ${ADOPT ? `ADOPTING${DRY ? " (dry run)" : ""}` : "reported only, pass --adopt to apply"}`,
  );
  const tally = { current: 0, adopted: 0, refreshed: 0, contracts: 0, authored: 0, unknown: 0 };
  for (const gameId of fs.readdirSync(GAMES).sort()) {
    const worldPath = path.join(GAMES, gameId, "world.json");
    const world = readJson(worldPath);
    if (!world) continue;
    const scenarioId = readJson(path.join(GAMES, gameId, "game-instance.json"))?.scenarioId;
    if (!scenarioId) continue;
    const scenarioWorld = readJson(path.join(SCENARIOS, scenarioId, "world.json"));
    if (!scenarioWorld) continue;

    const verdict = reconcileRules(world, scenarioId, scenarioWorld, history);
    tally[verdict.verdict] = (tally[verdict.verdict] ?? 0) + 1;

    if (verdict.verdict === RECONCILE.current) continue;
    if (verdict.verdict === RECONCILE.contracts) {
      // Always applied, --adopt or not. The contract list has no editor and is
      // derived from the spec, so a save whose list disagrees with its scenario
      // is out of date rather than customised — there is no player intent here
      // to protect. Left unsynced, the campaign runs on the board's words with
      // none of the contracts.
      //
      // The stamp goes on in the same write, and that IS a decision worth
      // naming: it means a later board revision will be offered as `refreshed`
      // rather than re-examined. It is only reachable when the save's board text
      // is already byte-identical to the scenario's, so there is no distinct
      // authorship the stamp could be mislabelling — the one edge is a player
      // who typed the board's exact current text, which no code can tell from a
      // build and which loses nothing it did not already have.
      console.log(`  ${gameId.padEnd(34)} contract list [${(verdict.from ?? []).join(", ") || "none"}] → [${verdict.contracts.join(", ") || "none"}]`);
      if (!DRY) {
        world.contracts = verdict.contracts;
        world.simulationRulesSource = verdict.source;
        fs.writeFileSync(worldPath, `${JSON.stringify(world, null, 2)}\n`, "utf8");
      }
      continue;
    }
    if (verdict.verdict === RECONCILE.authored) {
      console.log(`  ${gameId.padEnd(34)} AUTHORED (${verdict.chars} chars match nothing ${scenarioId} shipped) — never touched`);
      continue;
    }
    if (verdict.verdict === RECONCILE.unknown) {
      console.log(`  ${gameId.padEnd(34)} no history for ${scenarioId} — left alone`);
      continue;
    }
    const from = verdict.from ? ` (shipped at ${verdict.from.commit})` : "";
    console.log(`  ${gameId.padEnd(34)} ${verdict.verdict.toUpperCase()}: ${verdict.chars} → ${verdict.rules.length} chars${from}`);
    if (ADOPT && !DRY) {
      world.simulationRules = verdict.rules;
      world.contracts = verdict.contracts;
      world.simulationRulesSource = verdict.source;
      fs.writeFileSync(worldPath, `${JSON.stringify(world, null, 2)}\n`, "utf8");
    }
  }
  console.log(
    `[rules-age] ${tally.current} current · ${tally.adopted} adoptable · ${tally.refreshed} behind`
    + ` · ${tally.contracts} contract-list synced · ${tally.authored} authored (untouchable) · ${tally.unknown} unknown`,
  );
}

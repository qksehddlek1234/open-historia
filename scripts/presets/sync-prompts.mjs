/*! Open Historia — preset prompt sync tool © 2026 Nicholas Krol, MIT (see src/Editor/LICENSE). */
// Keep each scenario's stored prompts.json in sync with the JS prompt defaults
// for the keys we changed. The runtime prefers the stored prompts.json over the
// JS defaults (normalizePromptPack), so a prompt edit only takes effect once the
// stored copies are updated too.
//
//   node scripts/presets/sync-prompts.mjs
import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { GAMEPLAY_PROMPT_DEFAULTS } from "../../src/Game/AI/gameplayPrompts.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, "..", "..");
const SCENARIOS_DIR = path.join(PROJECT_ROOT, "server", "data", "scenarios");

// Only the task prompts we edited need syncing.
const KEYS = ["jumpForward", "autoJumpForward"];
// Every scenario directory, discovered rather than listed: the old hardcoded
// list silently skipped whichever presets it predated, which is exactly how a
// scenario ends up running last year's prompt text.
const SCENARIOS = readdirSync(SCENARIOS_DIR).filter((id) => {
  try {
    return statSync(path.join(SCENARIOS_DIR, id)).isDirectory();
  } catch {
    return false;
  }
}).sort();

for (const id of SCENARIOS) {
  const file = path.join(SCENARIOS_DIR, id, "prompts.json");
  if (!existsSync(file)) {
    console.log(`skip ${id} (no prompts.json)`);
    continue;
  }
  const prompts = JSON.parse(readFileSync(file, "utf8"));
  for (const key of KEYS) {
    const value = GAMEPLAY_PROMPT_DEFAULTS[key];
    if (typeof value !== "string") continue;
    if (key in prompts) prompts[key] = value;
    if (prompts.tasks && typeof prompts.tasks === "object" && key in prompts.tasks) {
      prompts.tasks[key] = value;
    }
  }
  writeFileSync(file, `${JSON.stringify(prompts, null, 2)}\n`, "utf8");
  console.log(`synced ${id}/prompts.json`);
}

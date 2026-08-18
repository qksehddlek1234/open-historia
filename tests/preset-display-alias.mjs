// THE FIRST ALIAS IS THE KOREAN SCREEN, and that is a contract now.
//
// Decided 2026-08-17 (user: "별칭 우선으로 해"). The map label resolver
// (runtime/labelNames.js) shows aliases' first active-script entry and only
// falls back to the AI translation pack when there is none. Before this, the
// screen showed whatever the pack had invented per-install — "이집트 쿠베이트"
// over the Khedivate the user had named by hand, "바바리아 왕국" over the
// spec's 바이에른 왕국. The convention that makes the fix hold is spec-side:
//
//   a polity's aliases[0] is its Korean display name.
//
// This pin is what keeps the convention from rotting: a new polity written
// with an English first alias would silently drop its label back to the
// translation pack — exactly the defect the resolver removed — and nothing
// else in the build would say so.
//
// Measured 2026-08-17: seventeen boards already hold 100% Hangul-first (the
// habit predates the rule, same as `home`). Five do not, all of them
// ancient/medieval boards whose rosters were written alias-light. They are
// EXCUSED BY NAME, not by rule, so the list can only shrink — and a board
// that reaches 100% must leave the list, or the list rots into a waiver
// (the same discipline as the leader handover lists).
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import url from "node:url";

let pass = 0;
const pending = [];
const test = (name, fn) => { pending.push(Promise.resolve(fn()).then(() => { pass += 1; console.log(`  ok  ${name}`); })); };
const ROOT = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), "..");
const SPECS = path.join(ROOT, "scripts", "presets");

console.log("\nA polity's first alias is its Korean display name");

// THE GAP LIST IS EMPTY, AND THAT IS ITS FINISHED STATE, kept so the story
// stays with the pin. Five boards showed 0% Hangul-first on 2026-08-17 — whole
// rosters awaiting Korean display names, excused BY NAME so the list could
// only shrink. It shrank on schedule: bronze-1200bc and colonial-1650 left the
// same day (59 names, Claude Code), mongol-1300 and roman-117 followed (65,
// Claude Code), and medieval-1200 — the largest, 135 names — landed from
// Cowork on 2026-08-18 and killed the list. From here every board in the
// fleet answers to the convention, and a polity written without a Hangul
// first alias goes red the day it is written.
const KNOWN_GAPS = new Set([]);

test("every board outside the named gaps is 100% Hangul-first", async () => {
  const files = fs.readdirSync(SPECS).filter((f) => f.endsWith(".spec.mjs")).sort();
  assert.ok(files.length >= 20, `only ${files.length} specs found — the glob is wrong, not the fleet`);
  const violations = [];
  const healedGaps = [];
  for (const file of files) {
    const id = file.replace(".spec.mjs", "");
    const spec = (await import(url.pathToFileURL(path.join(SPECS, file)).href)).default;
    const pols = Object.entries(spec.polities ?? {});
    if (pols.length === 0) continue;
    const bad = pols
      .filter(([, p]) => !/^[가-힣]/.test(String((Array.isArray(p.aliases) ? p.aliases[0] : "") ?? "").trim()))
      .map(([code, p]) => `${id}/${code} (${p.name})`);
    if (KNOWN_GAPS.has(id)) {
      if (bad.length === 0) healedGaps.push(id);
      continue;
    }
    violations.push(...bad);
  }
  assert.deepEqual(violations, [],
    "a polity whose first alias is not Hangul drops its map label back to the AI translation pack — the defect the resolver was built to remove");
  // The list must not outlive its cause (the same pin the handover lists carry):
  // a board that reaches 100% has adopted the convention and must be held to it.
  assert.deepEqual(healedGaps, [],
    "this board is now fully Hangul-first — remove it from KNOWN_GAPS so the convention starts guarding it");
});

await Promise.all(pending);
console.log(`\n${pass} passed\n`);

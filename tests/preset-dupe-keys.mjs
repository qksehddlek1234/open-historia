// A duplicate key in a spec is a country that quietly stops existing.
//
// JavaScript object literals do not complain when the same key appears twice —
// the last one wins and the first is gone without a sound. In a preset spec that
// is not a style problem, it is a nation removed from the game, and the fleet
// was carrying four of them at once:
//
//   wwii-1935 / coldwar-1946   `AUS` declared twice, once as the Commonwealth of
//     Australia and once as Austria — AND assigned twice, once ["AUS","PNG"] and
//     once ["AUT"]. On 1935 the winners crossed: the polity was named Austria and
//     held Australia and Papua New Guinea, so the build log read `PNG→Austria`
//     and Australia was not on the board. On 1946 the winners crossed the other
//     way and Australia vanished entirely.
//   wwii-1939   `CHN.25_1` and `CHN.19_1` assigned to a warlord and then to Japan
//     forty lines later. Yan Xishan's Shanxi and the Mengjiang puppet government
//     were both declared, coloured, aliased — and held zero regions.
//
// Every one of those was invisible in review and invisible at build time. The
// tell was always the same and always downstream: a polity that measures zero.
// This pin moves the tell to the front.
//
// It runs ESLint's own no-dupe-keys rather than a hand-rolled parser, because
// the parser is the part that has to be right: a spec is 600 lines of nested
// object literals with comments and unicode keys, and a regex over that text
// would find keys that are not keys and miss keys that are.
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import url from "node:url";
import { ESLint } from "eslint";
import { buildRegionKeyExpander } from "../scripts/presets/lib/level2Expansion.mjs";

let pass = 0;
const pending = [];
const test = (name, fn) => { pending.push(Promise.resolve(fn()).then(() => { pass += 1; console.log(`  ok  ${name}`); })); };
const ROOT = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), "..");
const SPECS = path.join(ROOT, "scripts", "presets");

console.log("\nNo spec may declare the same key twice");

test("every preset spec is free of duplicate keys", async () => {
  const files = fs.readdirSync(SPECS).filter((f) => f.endsWith(".spec.mjs")).sort()
    .map((f) => path.join(SPECS, f));
  assert.ok(files.length >= 20, `only ${files.length} specs found — the glob is wrong, not the fleet`);

  const eslint = new ESLint({
    overrideConfigFile: true,
    overrideConfig: {
      languageOptions: { ecmaVersion: 2022, sourceType: "module" },
      rules: { "no-dupe-keys": "error" },
    },
  });
  const results = await eslint.lintFiles(files);
  const found = [];
  for (const result of results) {
    for (const message of result.messages) {
      found.push(`${path.basename(result.filePath)}:${message.line} ${message.message}`);
    }
  }
  assert.deepEqual(found, [],
    "a duplicate key silently deletes whatever the earlier one declared — a polity, a region grant, a face owner");
});

test("the pin actually fires on a duplicate", async () => {
  // A guard that cannot fail is not a guard. Prove the rule is wired by running
  // it against a literal that has the bug, in memory — nothing is written to the
  // spec directory, where a stray file would be picked up by the fleet globs.
  const eslint = new ESLint({
    overrideConfigFile: true,
    overrideConfig: {
      languageOptions: { ecmaVersion: 2022, sourceType: "module" },
      rules: { "no-dupe-keys": "error" },
    },
  });
  const results = await eslint.lintText(
    'export default { polities: { AUS: { name: "Australia" }, AUS: { name: "Austria" } } };\n',
    { filePath: path.join(ROOT, "zz-dupe-probe.mjs") },
  );
  const messages = results.flatMap((r) => r.messages);
  assert.equal(messages.length, 1, "the probe must produce exactly one duplicate-key error");
  assert.match(messages[0].ruleId ?? "", /no-dupe-keys/);
});

// ── AND THE DUPLICATE ESLINT CANNOT SEE ──────────────────────────────────
//
// no-dupe-keys catches two keys SPELLED the same. This catches two keys spelled
// differently that MEAN the same cell, which the builder produces on purpose:
// `expandRegionKey` turns a legacy id into the NUTS or ONS cells that replaced
// it, so `DEU.8_1` and `DEU.DE11` can both land on Stuttgart. Same rule as the
// literal case — later wins, earlier is gone without a sound.
//
// It cost a build to learn. victorian-1836 gained Württemberg, Baden, Hanover,
// Bremen, Hamburg and Saxe-Weimar on 2026-08-16, written as NUTS keys near the
// top of regionAssignments. Further down sat `DEU.8_1: "GER"` and friends from
// the original German block. Those expand to the same cells, come later, and won:
// the six polities were declared, coloured, tested — and held zero regions. The
// build printed no error. It printed the OLD ANSWER, which is the worst way for
// a build to be wrong, because everything downstream looks healthy.
//
// The fix was to move the block below the legacy rows, so the invariant is about
// ORDER, not about collisions: a collision is normal and useful — broad first,
// specific after. What must never happen is the reverse, a broad key landing
// later and erasing a specific one. That is the shape this asserts.
test("no legacy key may overwrite a more specific one that came before it", async () => {
  const seedFc = JSON.parse(fs.readFileSync(
    path.join(ROOT, "public", "assets", "regions-seed.geojson"), "utf8"));
  const seedIds = new Set((seedFc.features ?? []).map((f) => String(f?.properties?.id ?? "")));
  assert.ok(seedIds.size > 1000, `the seed looks empty (${seedIds.size}) — fix the path, not the pin`);
  const expand = buildRegionKeyExpander(seedIds);

  const files = fs.readdirSync(SPECS).filter((f) => f.endsWith(".spec.mjs")).sort();
  const violations = [];
  let collisions = 0;
  for (const file of files) {
    const spec = (await import(url.pathToFileURL(path.join(SPECS, file)).href)).default;
    // Declaration order is what decides the winner, and Object.entries preserves it
    // for string keys — the same order the builder walks.
    const claimedBy = new Map();
    for (const [key, owner] of Object.entries(spec.regionAssignments ?? {})) {
      const targets = expand(key);
      for (const target of targets) {
        const prev = claimedBy.get(target);
        if (prev) {
          collisions += 1;
          // Breadth is the tell: a key that expands to many cells is the broad one.
          // Broad-then-specific is the intended layering; specific-then-broad is the
          // trap, because the narrow row was written to say something and is gone.
          if (targets.length > prev.width) {
            violations.push(`${file}: "${key}"→${owner} (${targets.length} cells) overwrites `
              + `"${prev.key}"→${prev.owner} (${prev.width}) at ${target}`);
          }
        }
        claimedBy.set(target, { key, owner, width: targets.length });
      }
    }
  }
  assert.ok(collisions > 0, "no expansion collisions at all — the expander is not running");
  assert.deepEqual(violations, [],
    "a broad key landing after a narrow one erases it, and the build says nothing");
});

test("the order pin actually fires when the rows are the wrong way round", () => {
  // Same discipline as the probe above: prove the rule can fail. Hand-rolled
  // expander so the probe does not depend on the seed containing any given id.
  const expand = (key) => (key === "X.1_1" ? ["X.a", "X.b", "X.c"] : [key]);
  const check = (assignments) => {
    const claimedBy = new Map();
    const found = [];
    for (const [key, owner] of Object.entries(assignments)) {
      const targets = expand(key);
      for (const target of targets) {
        const prev = claimedBy.get(target);
        if (prev && targets.length > prev.width) found.push(`${key} over ${prev.key}`);
        claimedBy.set(target, { key, owner, width: targets.length });
      }
    }
    return found;
  };
  assert.deepEqual(check({ "X.1_1": "BROAD", "X.b": "NARROW" }), [],
    "broad first, specific after — this is the intended layering");
  assert.deepEqual(check({ "X.b": "NARROW", "X.1_1": "BROAD" }), ["X.1_1 over X.b"],
    "specific first, broad after — this is the trap and must be caught");
});

await Promise.all(pending);
console.log(`\n${pass} passed\n`);

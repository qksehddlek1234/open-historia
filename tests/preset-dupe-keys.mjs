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

await Promise.all(pending);
console.log(`\n${pass} passed\n`);

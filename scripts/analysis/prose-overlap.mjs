#!/usr/bin/env node
/*! Open Historia — measure phrasing overlap between our spec rules and a source text © 2026 Nicholas Krol, MIT (see src/Editor/LICENSE). */
// RUN THIS ON THE PC THAT HAS THE ORIGINALS. It never leaves that machine and
// it never writes the source text anywhere — it reads, counts, and prints
// numbers. The cloud session that wrote it has never seen a Pax Historia preset
// and should not.
//
//   node scripts/analysis/prose-overlap.mjs <file-or-dir-of-original-rules> [--n 8] [--show 5]
//
// WHAT IT ANSWERS: "is our rules text a paraphrase or a copy?" An 8-word run of
// identical prose is essentially never coincidence between two people writing
// about the same subject; a handful can happen on stock phrases ("at the start
// of the war"), a few hundred cannot.
//
// WHAT IT DOES NOT ANSWER: whether a close paraphrase is close ENOUGH to be a
// copy. Rewording sentence by sentence while keeping the structure scores near
// zero here and is still derivative. This measures one thing precisely rather
// than everything vaguely.
//
// READ THE OUTPUT LIKE THIS:
//   0 shared           — independent phrasing.
//   1-5, all stock     — coincidence. Look at them; they will be things like
//                        "the collapse of the soviet union in nineteen ninety".
//   dozens or more     — passages were carried over. The samples show which.
import fs from "node:fs";
import path from "node:path";
import url from "node:url";

const ROOT = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), "..", "..");
const argv = process.argv.slice(2);
const target = argv.find((a) => !a.startsWith("--"));
const flag = (name, fallback) => {
  const i = argv.indexOf(`--${name}`);
  return i === -1 ? fallback : Number(argv[i + 1]) || fallback;
};
const N = flag("n", 8);
const SHOW = flag("show", 5);

if (!target) {
  console.error("usage: node scripts/analysis/prose-overlap.mjs <file-or-dir> [--n 8] [--show 5]");
  process.exit(1);
}

// Letters and spaces only, lowercased. Punctuation, capitalisation and digits
// are exactly what a copier changes first, so they are removed rather than
// compared — this deliberately makes copying HARDER to hide, not easier.
const words = (text) => text.replace(/[^A-Za-z ]+/g, " ").toLowerCase().split(/\s+/).filter(Boolean);
const grams = (list, n) => {
  const out = new Map();
  for (let i = 0; i + n <= list.length; i += 1) {
    const key = list.slice(i, i + n).join(" ");
    if (!out.has(key)) out.set(key, 0);
    out.set(key, out.get(key) + 1);
  }
  return out;
};

const readAll = (p) => {
  const stat = fs.statSync(p);
  if (stat.isFile()) return fs.readFileSync(p, "utf8");
  return fs.readdirSync(p)
    .filter((f) => /\.(txt|md|json|html?)$/i.test(f))
    .map((f) => fs.readFileSync(path.join(p, f), "utf8"))
    .join("\n\n");
};

const sourceWords = words(readAll(target));
const sourceGrams = grams(sourceWords, N);
console.log(`source: ${target}`);
console.log(`        ${sourceWords.length.toLocaleString()} words · ${sourceGrams.size.toLocaleString()} distinct ${N}-grams\n`);

const SPECS = path.join(ROOT, "scripts", "presets");
const rows = [];
for (const file of fs.readdirSync(SPECS).filter((f) => f.endsWith(".spec.mjs")).sort()) {
  const spec = (await import(url.pathToFileURL(path.join(SPECS, file)).href)).default;
  const rules = spec?.simulationRules ?? "";
  if (!rules) continue;
  const g = grams(words(rules), N);
  const shared = [...g.keys()].filter((k) => sourceGrams.has(k));
  rows.push({ id: spec.id, chars: rules.length, total: g.size, shared });
}

rows.sort((a, b) => b.shared.length - a.shared.length);
console.log(`preset             chars  ${N}-grams  shared   %`);
for (const r of rows) {
  const pct = r.total ? ((100 * r.shared.length) / r.total).toFixed(1) : "0.0";
  console.log(
    `${r.id.padEnd(18)} ${String(r.chars).padStart(5)} ${String(r.total).padStart(8)} ${String(r.shared.length).padStart(7)} ${pct.padStart(5)}`,
  );
}

const flagged = rows.filter((r) => r.shared.length > 0);
console.log(`\n${flagged.length} of ${rows.length} presets share any ${N}-word run with the source.`);
for (const r of flagged) {
  console.log(`\n  ${r.id} — ${r.shared.length} shared, showing ${Math.min(SHOW, r.shared.length)}:`);
  for (const s of r.shared.slice(0, SHOW)) console.log(`    "${s}"`);
}
if (flagged.length === 0) {
  console.log("Nothing shared. That rules out lifted passages; it does not rule out a close");
  console.log("structural paraphrase, which no word-level measure can see.");
}

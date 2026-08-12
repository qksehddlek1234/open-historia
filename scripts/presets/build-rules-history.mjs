#!/usr/bin/env node
/*! Open Historia — every rules text a board has ever shipped © 2026 Nicholas Krol, MIT (see src/Editor/LICENSE). */
// WHAT MAKES "DID A HUMAN WRITE THIS?" A DECIDABLE QUESTION.
//
//   node scripts/presets/build-rules-history.mjs            write data/rules-history.json
//   node scripts/presets/build-rules-history.mjs --dry-run  report only
//
// A save carries its own copy of `simulationRules`, and until now there was no
// way to tell a copy that is merely OLD from one a player typed. That mattered:
// wwii-1935-buildup-session holds 1,622 characters where its scenario now has
// 11,918, and the field is editable from the library bar, so overwriting it
// might have discarded somebody's writing.
//
// It is decidable if you have the list. Every text a board has EVER shipped is
// in git; hash them all and a save's copy either matches one — in which case it
// is a build we made and it is safe to refresh — or it matches none, in which
// case a person wrote it and it is never touched. Same shape timelineLibrary.js
// uses for `periodTimelineSource`, which is where the idea comes from.
//
// WHAT IS HASHED: the spec's OWN simulationRules, not the assembled form. The
// assembled form would have to be rebuilt with period-correct contract texts at
// every commit, and getting that subtly wrong turns a safe "unknown, leave it"
// into an unsafe "known, overwrite it". Reconciliation strips the contracts off
// a save's copy first and compares the board part, so a contract wording that
// has since changed simply fails to strip, the hash misses, and the save is left
// alone. Every failure mode of this file lands on "do nothing".
//
// THE MANIFEST IS A UNION AND NEVER SHRINKS. This clone and the Claude Code
// clone do not have identical history — the same board shows three distinct
// texts here and four there, because commits get squashed on the way across.
// So the file is merged into, not overwritten: run this in both clones and the
// list is the union. An entry that is wrong costs a needless refresh; an entry
// that is MISSING costs nothing at all, because a miss means "leave it alone".
import fs from "node:fs";
import path from "node:path";
import url from "node:url";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";

const ROOT = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), "..", "..");
const SPECS = path.join(ROOT, "scripts", "presets");
const OUT = path.join(ROOT, "data", "rules-history.json");
const DRY = process.argv.includes("--dry-run");

export const hashRules = (text) =>
  crypto.createHash("sha256").update(String(text ?? "").trim(), "utf8").digest("hex").slice(0, 16);

const git = (args) => {
  try {
    return execFileSync("git", args, { cwd: ROOT, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
  } catch {
    return "";
  }
};

const existing = (() => {
  try {
    return JSON.parse(fs.readFileSync(OUT, "utf8"));
  } catch {
    return { note: "", boards: {} };
  }
})();

const boards = { ...(existing.boards ?? {}) };
let added = 0;
let scanned = 0;
let probe = 0;
// The probe lives IN scripts/presets, not a temp directory. A spec imports its
// helpers by relative path (`./lib/eraSovereignty.mjs`), and from anywhere else
// those resolve to nothing — the first version put probes in a temp dir and
// silently lost every spec that had grown an import, which was the six newest
// boards. The name deliberately does not end in `.spec.mjs` so no glob that
// hunts for specs can pick one up mid-run.
const probeDir = SPECS;
const probeFiles = [];

for (const file of fs.readdirSync(SPECS).filter((f) => f.endsWith(".spec.mjs")).sort()) {
  const rel = `scripts/presets/${file}`;
  const id = file.replace(".spec.mjs", "");
  const seen = new Map((boards[id] ?? []).map((entry) => [entry.hash, entry]));
  const before = seen.size;

  // --all rather than --follow: a rename can lose the trail, and a missed
  // revision is a save we decline to adopt rather than a save we damage.
  for (const commit of git(["rev-list", "--all", "--", rel]).split("\n").filter(Boolean)) {
    const source = git(["show", `${commit}:${rel}`]);
    if (!source) continue;
    scanned += 1;
    let rules = "";
    try {
      // A UNIQUE FILE PER PROBE. The first version of this reused one path and
      // cache-busted on the commit alone — but one commit usually touches
      // several specs, so the second board to ask for that commit got the
      // first board's module back out of the ESM cache. It showed up as
      // wwii-1939 having "shipped" wwii-1935's rules. A distinct path per probe
      // makes the collision impossible rather than unlikely.
      probe += 1;
      const file = path.join(probeDir, `.rules-probe-${probe}.mjs`);
      probeFiles.push(file);
      fs.writeFileSync(file, source, "utf8");
      const mod = await import(url.pathToFileURL(file).href);
      rules = String(mod.default?.simulationRules ?? "").trim();
    } catch {
      // A spec that cannot be imported at that commit (it referenced a lib that
      // did not exist yet) contributes nothing. Counted, not guessed at.
      continue;
    }
    if (!rules) continue;
    const hash = hashRules(rules);
    if (seen.has(hash)) continue;
    seen.set(hash, { hash, chars: rules.length, commit: commit.slice(0, 8) });
    added += 1;
  }

  const list = [...seen.values()].sort((a, b) => a.chars - b.chars);
  if (list.length > 0) boards[id] = list;
  if (list.length !== before) {
    console.log(`  ${id.padEnd(18)} ${String(before).padStart(2)} → ${String(list.length).padStart(2)} texts  [${list.map((e) => e.chars).join(", ")}]`);
  }
}

for (const file of probeFiles) { try { fs.rmSync(file); } catch { /* already gone */ } }

const out = {
  note: "Every simulationRules text each board has shipped, by sha256 prefix. A save whose"
    + " board text hashes to one of these is a stale BUILD and may be refreshed; a save that"
    + " matches nothing was written by a person and is never touched. Union across clones —"
    + " this file is merged into, never replaced. Regenerate: node scripts/presets/build-rules-history.mjs",
  boards,
};

const inherited = Object.values(existing.boards ?? {}).reduce((n, l) => n + l.length, 0);
// "0 new" against a total higher than this clone can produce alone reads as a
// bug until you know the file is a union. Say where the entries came from.
console.log(
  `\n[build-rules-history] ${Object.keys(boards).length} boards · ${Object.values(boards).reduce((n, l) => n + l.length, 0)} distinct texts`
  + ` (${inherited} already in the file, ${added} added here) · ${scanned} revisions read in this clone`,
);
if (DRY) {
  console.log("[build-rules-history] DRY RUN — nothing written.");
} else {
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, `${JSON.stringify(out, null, 2)}\n`, "utf8");
  console.log(`[build-rules-history] wrote ${path.relative(ROOT, OUT)}`);
}

#!/usr/bin/env node
/*! Open Historia — every colour each board has ever given each polity © 2026 Nicholas Krol, MIT (see src/Editor/LICENSE). */
// WHAT MAKES "DID SOMEBODY CHOOSE THIS COLOUR?" A DECIDABLE QUESTION.
//
//   node scripts/presets/build-palette-history.mjs            write data/palette-history.json
//   node scripts/presets/build-palette-history.mjs --dry-run  report only
//
// The sibling of build-rules-history.mjs, and the reasoning is the same one:
// a running campaign holds its own copy of a board's palette (see the fork note
// in src/runtime/paletteHistory.js), so a board recoloured after the campaign
// started never reaches it — and there was no way to tell a copy that is merely
// OLD from a colour a player picked in the cheat editor or the AI minted for a
// nation it invented. It is decidable if you have the list.
//
// FOUR SOURCES, because a board's colors.json is assembled from four places and
// a save could have cloned any of them:
//
//   1. SPEC REVISIONS. `polities[CODE].color` at every commit of the board's
//      spec — the curated colours, and the only source that carries the PAST of
//      a recolour. magna-1444's pre-original-palette reds live here and nowhere
//      else. Imported the same way build-rules-history.mjs does it, probe files
//      and all, for the same reasons written up there.
//   2. THE APP PALETTE. build-preset starts every board's colors.json from
//      public/assets/colors.json, so every country the spec does NOT name is
//      painted from that file — 68 of the 236 entries magna-1444 ships. It is
//      committed, so its revisions are read and folded into every board.
//   3. COMMITTED SCENARIO ARTIFACTS. server/data/scenarios/*/ is a build
//      product and gitignored — except `default`, which is checked in and has
//      no spec at all. Its 9 committed colors.json revisions are the only
//      record that board has, and one of them is an exact match for the palette
//      the live modern-day save is frozen on.
//   4. THE ARTIFACTS ON DISK NOW. Whatever the scenarios currently hold is by
//      definition a palette we built and what a new game clones today. Reading
//      them means the manifest is complete without a rebuild — and it is why
//      this has to be re-run after `rebuild-all`, exactly like the rules one.
//
// THE MANIFEST IS A UNION AND NEVER SHRINKS, for the reason spelled out in
// build-rules-history.mjs: two clones do not have identical history, so this
// merges into the file rather than replacing it. An entry that is wrong costs a
// needless recolour of one polity; an entry that is MISSING costs nothing at
// all, because a miss means "leave it alone".
//
// WHAT IS NOT HERE: the territory-less voices. build-preset gives them palette
// entries so the chat list can name them, but they hold no ground and their
// colour never reaches the map, so their history is not worth a second probe
// pass over lib/internalVoices.mjs at every commit. They read as `unknown` and
// are left alone — which for a colour nothing paints is the same picture.
import fs from "node:fs";
import path from "node:path";
import url from "node:url";
import { execFileSync } from "node:child_process";
import { normalizeColor } from "../../src/runtime/paletteHistory.js";

const ROOT = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), "..", "..");
const SPECS = path.join(ROOT, "scripts", "presets");
const SCENARIOS = path.join(ROOT, "server", "data", "scenarios");
const BASE_PALETTE = "public/assets/colors.json";
const OUT = path.join(ROOT, "data", "palette-history.json");
const DRY = process.argv.includes("--dry-run");

const git = (args) => {
  try {
    return execFileSync("git", args, { cwd: ROOT, encoding: "utf8", maxBuffer: 256 * 1024 * 1024 });
  } catch {
    return "";
  }
};

const readJson = (file) => {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return null;
  }
};

const existing = readJson(OUT) ?? { note: "", base: {}, boards: {} };
const rows = (source) => new Map(Object.entries(source ?? {}).map(([name, list]) => [name, new Set(list)]));
const base = rows(existing.base);
const boards = new Map(Object.entries(existing.boards ?? {}).map(([id, names]) => [id, rows(names)]));
const countRows = (names) => [...names.values()].reduce((m, s) => m + s.size, 0);
const inherited = countRows(base) + [...boards.values()].reduce((n, names) => n + countRows(names), 0);

let added = 0;
const addTo = (names, name, value) => {
  const hex = normalizeColor(value);
  if (!name || !hex) return;
  if (!names.has(name)) names.set(name, new Set());
  const before = names.get(name).size;
  names.get(name).add(hex);
  if (names.get(name).size !== before) added += 1;
};
const add = (board, name, value) => {
  if (!board) return;
  if (!boards.has(board)) boards.set(board, new Map());
  addTo(boards.get(board), name, value);
};

// A whole name -> colour map at once (an artifact, or the app palette).
const addPalette = (board, palette) => {
  for (const [name, value] of Object.entries(palette ?? {})) add(board, name, value);
};

const addRegistry = (board, world) => {
  for (const [name, polity] of Object.entries(world?.polityOverrides ?? {})) {
    if (polity && typeof polity === "object") add(board, name, polity.color);
  }
};

const specIds = fs.readdirSync(SPECS).filter((f) => f.endsWith(".spec.mjs")).map((f) => f.replace(".spec.mjs", "")).sort();
const scenarioIds = fs.existsSync(SCENARIOS)
  ? fs.readdirSync(SCENARIOS).filter((d) => fs.statSync(path.join(SCENARIOS, d)).isDirectory()).sort()
  : [];
const allIds = [...new Set([...specIds, ...scenarioIds])].sort();

// ── 2. the app palette, every revision — the shared floor ────────────────────
// Kept in its own section rather than copied into all 24 boards. Written out per
// board this file was 500 KB, four fifths of it the same country repeated; see
// the two-level note on shippedColors in src/runtime/paletteHistory.js.
const basePalettes = [];
for (const commit of git(["rev-list", "--all", "--", BASE_PALETTE]).split("\n").filter(Boolean)) {
  const source = git(["show", `${commit}:${BASE_PALETTE}`]);
  if (!source) continue;
  try {
    basePalettes.push(JSON.parse(source));
  } catch {
    // A revision that is not valid JSON contributes nothing. Counted by absence.
  }
}
const baseOnDisk = readJson(path.join(ROOT, BASE_PALETTE));
if (baseOnDisk) basePalettes.push(baseOnDisk);
for (const palette of basePalettes) {
  for (const [name, value] of Object.entries(palette ?? {})) addTo(base, name, value);
}
console.log(`  app palette         ${basePalettes.length} revisions · ${base.size} names (shared floor, ${allIds.length} boards inherit it)`);

// ── 1. spec revisions ────────────────────────────────────────────────────────
// The probe lives IN scripts/presets and gets a unique name per import, for the
// two reasons build-rules-history.mjs documents at length: a spec resolves its
// helpers by relative path, and one shared probe path hands the ESM cache's
// copy of the previous spec back to the next one.
let probe = 0;
let specRevisions = 0;
const probeFiles = [];
for (const id of specIds) {
  const rel = `scripts/presets/${id}.spec.mjs`;
  const before = boards.get(id)?.size ?? 0;
  let read = 0;
  for (const commit of git(["rev-list", "--all", "--", rel]).split("\n").filter(Boolean)) {
    const source = git(["show", `${commit}:${rel}`]);
    if (!source) continue;
    specRevisions += 1;
    try {
      probe += 1;
      const file = path.join(SPECS, `.palette-probe-${probe}.mjs`);
      probeFiles.push(file);
      fs.writeFileSync(file, source, "utf8");
      const mod = await import(url.pathToFileURL(file).href);
      for (const [code, polity] of Object.entries(mod.default?.polities ?? {})) {
        // build-preset keys the palette by the polity's NAME, falling back to
        // the code (polityName). Mirror it exactly or the manifest is keyed by
        // something no save contains.
        add(id, String(polity?.name ?? code), polity?.color);
      }
      read += 1;
    } catch {
      // A spec that cannot be imported at that commit (it referenced a lib that
      // did not exist yet) contributes nothing. Counted, not guessed at.
      continue;
    }
  }
  const after = boards.get(id)?.size ?? 0;
  if (after !== before || read > 0) {
    console.log(`  ${id.padEnd(18)} ${String(read).padStart(3)} spec revisions → ${after} names`);
  }
}
for (const file of probeFiles) { try { fs.rmSync(file); } catch { /* already gone */ } }

// ── 3 + 4. scenario artifacts, committed and on disk ─────────────────────────
let artifactRevisions = 0;
for (const id of scenarioIds) {
  const before = boards.get(id)?.size ?? 0;
  for (const asset of ["colors.json", "world.json"]) {
    const rel = `server/data/scenarios/${id}/${asset}`;
    for (const commit of git(["rev-list", "--all", "--", rel]).split("\n").filter(Boolean)) {
      const source = git(["show", `${commit}:${rel}`]);
      if (!source) continue;
      let parsed = null;
      try {
        parsed = JSON.parse(source);
      } catch {
        continue;
      }
      artifactRevisions += 1;
      if (asset === "colors.json") addPalette(id, parsed);
      else addRegistry(id, parsed);
    }
  }
  addPalette(id, readJson(path.join(SCENARIOS, id, "colors.json")));
  addRegistry(id, readJson(path.join(SCENARIOS, id, "world.json")));
  const after = boards.get(id)?.size ?? 0;
  if (after !== before) console.log(`  ${id.padEnd(18)} artifacts → ${after} names`);
}

// ── the fold: a board row that says exactly what the floor says is deleted ───
// Lookup reads the board row when there is one and the floor otherwise, so a row
// identical to the floor carries nothing. 7,000-odd rows go here.
//
// The one edge, named rather than hidden: this file is a UNION across clones, so
// a clone that has an artifact another clone lacks can leave a board with no row
// for a name whose floor has since grown a second colour — and that board would
// then accept a floor colour it never shipped. It cannot cost anybody's work:
// every colour in the floor came out of public/assets/colors.json, which is a
// build product and never a player's choice, so the worst case is mistaking one
// of our colours for one of our colours. The genuinely undecidable case — a
// player who picks for a country exactly the colour the app palette gives that
// same country — is the one rulesHistory.js already accepts and no code can see.
let folded = 0;
for (const names of boards.values()) {
  for (const [name, set] of [...names.entries()]) {
    const floor = base.get(name);
    if (!floor || floor.size !== set.size) continue;
    if ([...set].every((hex) => floor.has(hex))) {
      names.delete(name);
      folded += set.size;
    }
  }
}

const sortRows = (names) => Object.fromEntries(
  [...names.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([name, set]) => [name, [...set].sort()]),
);
const out = {
  note: "Every colour each board has shipped for each polity, by name. A save's colour that"
    + " matches one of these is a stale BUILD and may be refreshed; a colour matching none of"
    + " them was chosen by a player or minted by the AI and is never touched. `base` is the app"
    + " palette every board is assembled on top of — read a board's own row when it has one and"
    + " `base` otherwise. Union across clones — this file is merged into, never replaced."
    + " Regenerate after a rebuild: node scripts/presets/build-palette-history.mjs",
  base: sortRows(base),
  boards: Object.fromEntries(
    [...boards.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([id, names]) => [id, sortRows(names)]),
  ),
};

const boardColours = [...boards.values()].reduce((n, names) => n + countRows(names), 0);
const boardRows = [...boards.values()].reduce((n, names) => n + names.size, 0);
const multi = [...boards.values()].reduce((n, names) => n + [...names.values()].filter((s) => s.size > 1).length, 0)
  + [...base.values()].filter((s) => s.size > 1).length;
const serialized = `${JSON.stringify(out, null, 2)}\n`;
console.log(
  `\n[build-palette-history] floor ${countRows(base)} colours across ${base.size} names · ${boards.size} boards`
  + ` ${boardColours} colours across ${boardRows} rows (${folded} colours folded into the floor)`
  + `\n[build-palette-history] ${inherited} already in the file, ${added} added here · ${multi} rows have shipped more than one colour`
  + `\n[build-palette-history] ${specRevisions} spec revisions and ${artifactRevisions} artifact revisions read in this clone · ${(serialized.length / 1024).toFixed(0)} KB`,
);
if (DRY) {
  console.log("[build-palette-history] DRY RUN — nothing written.");
} else {
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, serialized, "utf8");
  console.log(`[build-palette-history] wrote ${path.relative(ROOT, OUT)}`);
}

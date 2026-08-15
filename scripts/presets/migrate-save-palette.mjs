#!/usr/bin/env node
/*! Open Historia — carry a board's recolour into campaigns already running © 2026 Nicholas Krol, MIT (see src/Editor/LICENSE). */
// THE HALF OF THE PALETTE STORY THAT TOUCHES SAVES.
//
//   node scripts/presets/migrate-save-palette.mjs                 report
//   node scripts/presets/migrate-save-palette.mjs --adopt         apply
//   node scripts/presets/migrate-save-palette.mjs --only magna-1444   one board (or one game id)
//   node scripts/presets/migrate-save-palette.mjs --adopt --dry-run   what --adopt would write
//   node scripts/presets/migrate-save-palette.mjs --games <dir>   read campaigns from somewhere else
//
// `--games` exists so this can be rehearsed on a COPY: duplicate the games
// directory, adopt into the copy, look at the map, and only then run it for
// real. It is also what the test uses, so the suite never writes a phantom
// campaign into a library somebody is playing.
//
// Sibling of migrate-save-contracts.mjs, and the same two questions in the same
// order: what does this save hold, and did a person choose it? The fork is
// described in src/runtime/paletteHistory.js; the short of it is that a campaign
// past its first turn owns a copy of the board's palette and the board can never
// reach it again. magna-1444's 63 recoloured polities, the cold-war red family —
// none of it reaches a campaign already in progress.
//
// PER ENTRY, NOT PER FILE. A save's palette is not one artifact with one author.
// The 236 rows are ours; the two the player recoloured in the cheat editor are
// theirs; the nation the AI minted in round 40 is its own. Judged as a file the
// whole thing is authored and nothing can ever be fixed. Judged per entry, the
// stale rows move and the chosen ones do not — data/palette-history.json says
// which is which, and anything it cannot answer for is left alone.
//
// BOTH COPIES. colors.json wins at paint time and world.json's polityOverrides
// is the fallback, and each is asked about its own value: every writer in the
// game touches both together, so a colour somebody chose is protected in both
// places, and a row stale in one file only is fixed in that file only.
//
// WHAT THIS WILL NOT DO — ADD. A board that has grown polities since the save
// started (magna-1444 went 65 → 154) leaves rows the save has never heard of.
// They are counted and named, and nothing is written for them. Writing them into
// polityOverrides would put 89 landless nations into the roster the AI is shown
// every turn, which is a change to how the campaign plays, not to how it looks;
// writing them into colors.json alone would leave a colour for a polity the
// registry cannot name. A colour nothing owns paints nothing either way.
//
// OFF BY DEFAULT for the reason the contracts migration gives: "safe" and "do it
// now" are different questions. Recolouring a campaign in progress is a visible
// change to a map somebody is in the middle of looking at, and that is the
// user's call, per board.
import fs from "node:fs";
import path from "node:path";
import url from "node:url";
import { reconcilePalette, PALETTE, PALETTE_COPY, normalizeColor } from "../../src/runtime/paletteHistory.js";

const ROOT = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), "..", "..");
const flag = (name, fallback = "") => {
  const at = process.argv.indexOf(name);
  return at >= 0 ? (process.argv[at + 1] ?? fallback) : fallback;
};
const GAMES = path.resolve(flag("--games", path.join(ROOT, "server", "data", "games")));
const SCENARIOS = path.join(ROOT, "server", "data", "scenarios");
const HISTORY = path.join(ROOT, "data", "palette-history.json");
const DRY = process.argv.includes("--dry-run");
const ADOPT = process.argv.includes("--adopt");
const ONLY = flag("--only");
// How many names to print per verdict before summarising the rest. Not a cap on
// what is DONE — every entry is judged and every entry is counted; this is the
// width of the report only, and the line that follows says how many it stands for.
const SHOW = 12;

const readJson = (file) => {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return null;
  }
};

const writeJson = (file, value) => fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`, "utf8");

const toRgb = (hex) => [0, 2, 4].map((at) => Number.parseInt(hex.slice(at, at + 2), 16));

const namesLine = (label, entries) => {
  if (entries.length === 0) return;
  const shown = entries.slice(0, SHOW).map((e) => `${e.name} ${e.held}→${e.current}`).join(", ");
  console.log(`      ${label}: ${shown}${entries.length > SHOW ? ` … and ${entries.length - SHOW} more` : ""}`);
};

if (!fs.existsSync(GAMES)) {
  console.log(`[migrate-save-palette] no games directory at ${GAMES} — nothing to migrate.`);
  process.exit(0);
}
const history = readJson(HISTORY);
if (!history) {
  console.log("[migrate-save-palette] no data/palette-history.json — run build-palette-history.mjs first.");
  process.exit(0);
}

console.log(
  `[migrate-save-palette] ${ADOPT ? `ADOPTING${DRY ? " (dry run — nothing written)" : ""}` : "reported only, pass --adopt to apply"}`
  + `${ONLY ? ` · limited to "${ONLY}"` : ""}\n`,
);

const total = Object.fromEntries(Object.values(PALETTE).map((key) => [key, 0]));
let moved = 0;
let games = 0;
let skipped = 0;

for (const gameId of fs.readdirSync(GAMES).sort()) {
  const dir = path.join(GAMES, gameId);
  if (!fs.statSync(dir).isDirectory()) continue;
  const scenarioId = readJson(path.join(dir, "game-instance.json"))?.scenarioId;
  if (!scenarioId) {
    console.log(`  ${gameId.padEnd(34)} no scenarioId — left alone`);
    skipped += 1;
    continue;
  }
  if (ONLY && ONLY !== gameId && ONLY !== scenarioId) continue;

  const scenarioColors = readJson(path.join(SCENARIOS, scenarioId, "colors.json"));
  const scenarioWorld = readJson(path.join(SCENARIOS, scenarioId, "world.json"));
  if (!scenarioColors && !scenarioWorld) {
    console.log(`  ${gameId.padEnd(34)} scenario ${scenarioId} is not built here — left alone`);
    skipped += 1;
    continue;
  }

  const colorsPath = path.join(dir, "colors.json");
  const worldPath = path.join(dir, "world.json");
  // null, not {} — see the note on skipped copies in reconcilePalette.
  const saveColors = fs.existsSync(colorsPath) ? readJson(colorsPath) : null;
  const saveWorld = fs.existsSync(worldPath) ? readJson(worldPath) : null;

  const { entries, tally } = reconcilePalette({
    save: { colors: saveColors, world: saveWorld },
    scenario: { colors: scenarioColors, world: scenarioWorld },
    board: scenarioId,
    history,
  });
  games += 1;
  for (const key of Object.keys(total)) total[key] += tally[key];

  const live = saveColors === null ? " · reads the board's colors.json live" : "";
  console.log(
    `  ${gameId.padEnd(34)} ${scenarioId}${live}\n`
    + `      ${tally.current} current · ${tally.refreshed} stale · ${tally.authored} chosen (untouchable)`
    + ` · ${tally.unknown} unknown · ${tally.minted} minted here · ${tally.absent} not in this save`,
  );
  namesLine("stale", entries.filter((e) => e.verdict === PALETTE.refreshed));
  namesLine("chosen", entries.filter((e) => e.verdict === PALETTE.authored));

  // A value that is neither empty nor readable would be judged `absent` and
  // quietly skipped, which is the one way this run could under-report without
  // saying so. normalizeColor takes [r,g,b], "#rrggbb", "rrggbb", "#rgb" and
  // "rgb(r, g, b)"; anything else is named here rather than swallowed.
  const unreadable = [
    ...Object.entries(saveColors ?? {}),
    ...Object.entries(saveWorld?.polityOverrides ?? {}).map(([name, p]) => [name, p?.color]),
  ].filter(([, value]) => value !== undefined && value !== null && value !== "" && !normalizeColor(value));
  if (unreadable.length > 0) {
    console.log(`      UNREADABLE: ${unreadable.slice(0, SHOW).map(([n, v]) => `${n}=${JSON.stringify(v)}`).join(", ")}`
      + `${unreadable.length > SHOW ? ` … and ${unreadable.length - SHOW} more` : ""} — judged absent, never written`);
  }

  const stale = entries.filter((e) => e.verdict === PALETTE.refreshed);
  if (stale.length === 0 || !ADOPT || DRY) continue;

  let touchedColors = false;
  let touchedWorld = false;
  for (const entry of stale) {
    if (entry.copy === PALETTE_COPY.colors && saveColors) {
      saveColors[entry.name] = toRgb(entry.current);
      touchedColors = true;
    }
    if (entry.copy === PALETTE_COPY.registry && saveWorld?.polityOverrides?.[entry.name]) {
      // The row is replaced in place: a polity carries its name, aliases,
      // leadership and note in the same object, and only the colour is stale.
      saveWorld.polityOverrides[entry.name] = {
        ...saveWorld.polityOverrides[entry.name],
        color: `#${entry.current}`,
      };
      touchedWorld = true;
    }
    moved += 1;
  }
  if (touchedColors) writeJson(colorsPath, saveColors);
  if (touchedWorld) writeJson(worldPath, saveWorld);
  console.log(`      wrote ${[touchedColors && "colors.json", touchedWorld && "world.json"].filter(Boolean).join(" + ")}`);
}

// Sanity: the manifest has to be readable in the same terms the saves are, or a
// run that reports "0 stale" is indistinguishable from one that read nothing.
const rows = Object.values(history.boards ?? {}).reduce((n, names) => n + Object.keys(names).length, 0)
  + Object.keys(history.base ?? {}).length;
console.log(
  `\n[migrate-save-palette] ${games} campaigns judged · ${skipped} skipped · manifest holds ${rows} polity rows`
  + `\n[migrate-save-palette] ${total.current} current · ${total.refreshed} stale · ${total.authored} chosen (untouchable)`
  + ` · ${total.unknown} unknown · ${total.minted} minted in-campaign · ${total.absent} in the board and not in the save`
  + `\n[migrate-save-palette] ${ADOPT && !DRY ? `${moved} colours moved` : `${total.refreshed} colours would move`}`,
);

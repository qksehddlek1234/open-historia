/*! Open Historia — telling an old palette copy from one somebody chose © 2026 Nicholas Krol, MIT (see src/Editor/LICENSE). */
// THE STAMP AGAIN, ONE ENTRY AT A TIME.
//
// rulesHistory.js decides whether a save's `simulationRules` is a stale build or
// a person's writing, by matching it against every text the board has shipped.
// The palette has the same shape and the same live problem, with one difference
// that changes the design: rules are ONE text per board, colours are one value
// per polity, so the unit of judgement is the entry, not the file.
//
// HOW A SAVE'S PALETTE FORKS. A new game does not get its own colors.json —
// OPTIONAL_JSON_ASSET_FILES is not part of the seed, so the runtime falls
// through to the scenario's file and a fresh campaign paints from the live
// board. Then the first turn ends: gameplay.js writes JSON_URLS.colors, which
// for an active game resolves to the GAME's directory. From that write on the
// campaign has its own copy and the scenario can never reach it again. Both
// saves on this machine are past that point. world.json's polityOverrides carry
// a second copy of the same colours and are cloned at creation, so the fork is
// two files wide.
//
// So a board that gets recoloured — magna-1444 to its original palette, the
// cold-war boards to the red family — reaches new campaigns only. This module
// answers, per polity, whether a running campaign's colour may be moved:
//
//   • it equals the scenario's colour                        → current
//   • it is a colour this board has shipped for this polity  → refreshed
//   • it is anything else                                    → authored, never touched
//   • the board has no history for that name                 → unknown, never touched
//
// EVERY UNCERTAIN CASE RESOLVES TO "LEAVE IT ALONE", exactly as in rulesHistory.
// A missing manifest, a name the manifest does not cover, a polity the AI minted
// mid-campaign, an entry the save does not carry — all of them decline. The cost
// of a miss is a campaign that keeps the colour it has; the cost of a wrong move
// is a colour somebody picked, gone.
//
// NO STAMP HERE, and that is not an oversight. A stamp exists so a save whose
// text matches nothing can still be recognised as ours; per entry there is
// nothing for it to buy. After a refresh the entry equals the scenario's colour
// (`current`), and when the board is recoloured again the entry is the previous
// shipped colour, which the manifest already holds. The history accumulates on
// its own.

/** The two copies of a palette a save carries. Judged separately — see below. */
export const PALETTE_COPY = {
  colors: "colors.json",
  registry: "polityOverrides",
};

export const PALETTE = {
  current: "current",
  refreshed: "refreshed",
  authored: "authored",
  unknown: "unknown",
  // In the save, not in the scenario: a nation the AI minted or a player created
  // mid-campaign. There is nothing to move it towards.
  minted: "minted",
  // In the scenario, not in the save (or held empty). Reported, never written —
  // see the note on additions in migrate-save-palette.mjs.
  absent: "absent",
};

/**
 * Any colour this codebase writes -> "rrggbb", lowercase. "" when unreadable.
 *
 * colors.json stores [r,g,b] and polityOverrides stores "#rrggbb"; the AI has
 * been seen writing bare "rrggbb" and the map's own parser accepts "#rgb" and
 * "rgb(r, g, b)", so all five are read here. One canonical form is the whole
 * point: two copies of the same colour in two notations must not read as a
 * disagreement, because a false disagreement is what would make a build look
 * like somebody's choice (or worse, the reverse).
 */
export const normalizeColor = (value) => {
  if (Array.isArray(value)) {
    if (value.length < 3) return "";
    const channels = value.slice(0, 3).map((n) => Number(n));
    if (!channels.every((n) => Number.isFinite(n) && n >= 0 && n <= 255)) return "";
    return channels.map((n) => Math.round(n).toString(16).padStart(2, "0")).join("").toLowerCase();
  }
  const raw = String(value ?? "").trim().toLowerCase();
  if (!raw) return "";
  const rgb = /^rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*(?:,[^)]*)?\)$/.exec(raw);
  if (rgb) return normalizeColor([Number(rgb[1]), Number(rgb[2]), Number(rgb[3])]);
  const hex = raw.replace(/^#/, "");
  if (/^[0-9a-f]{6}$/.test(hex)) return hex;
  if (/^[0-9a-f]{3}$/.test(hex)) return `${hex[0]}${hex[0]}${hex[1]}${hex[1]}${hex[2]}${hex[2]}`;
  return "";
};

/**
 * Every colour `board` has shipped for `name`, normalized. [] when unknown.
 *
 * Per board AND per name, both deliberately. A colour magna-1444 once gave
 * Bohemia says nothing about Bohemia on medieval-1200, and nothing at all about
 * Bavaria — the manifest is not a palette of "our colours", it is the record of
 * what each board handed each polity.
 *
 * TWO LEVELS, and the fallback is not a guess. build-preset assembles every
 * board's colors.json by starting from the app palette and laying the spec's
 * polities on top, so most rows are the same on all 24 boards — written out per
 * board the manifest was 500 KB, four fifths of it the same country repeated.
 * `base` holds that shared floor once, and a board row is written only where the
 * board's own colours DIFFER from it. So a board row, when present, is the whole
 * truth for that name and base must not be consulted; when absent, the board
 * shipped exactly the floor. Reading both at once is what would be a guess.
 */
export const shippedColors = (history, board, name) => {
  const own = history?.boards?.[board]?.[name];
  if (Array.isArray(own)) return own.map(normalizeColor).filter(Boolean);
  const base = history?.base?.[name];
  return Array.isArray(base) ? base.map(normalizeColor).filter(Boolean) : [];
};

/**
 * Do these two palettes say the same thing? Compared by normalized value over
 * the union of names, so [159, 5, 0] and "#9F0500" are one colour, not two.
 *
 * This is what keeps a campaign reading the board live. A turn ends by writing
 * the palette, and for an active game that write lands in the GAME's directory —
 * which is the moment the campaign forks and stops seeing anything the board
 * does afterwards. Almost every turn changes no colour at all, so almost every
 * fork was a file written to repeat what it already said. Ask first.
 */
export const samePalette = (before, after) => {
  const left = readPalette(before);
  const right = readPalette(after);
  if (left.size !== right.size) return false;
  for (const [name, hex] of left) {
    if (!right.has(name) || right.get(name) !== hex) return false;
  }
  return true;
};

function readPalette(colors) {
  const out = new Map();
  for (const [name, value] of Object.entries(colors ?? {})) {
    const hex = normalizeColor(value);
    if (name) out.set(name, hex);
  }
  return out;
}

const readRegistry = (overrides) => {
  const out = new Map();
  for (const [name, polity] of Object.entries(overrides ?? {})) {
    if (!name || !polity || typeof polity !== "object") continue;
    out.set(name, normalizeColor(polity.color));
  }
  return out;
};

const judge = ({ copy, name, held, current, shipped }) => {
  if (!held) return { copy, name, verdict: PALETTE.absent, held, current };
  if (!current) return { copy, name, verdict: PALETTE.minted, held, current };
  if (held === current) return { copy, name, verdict: PALETTE.current, held, current };
  if (shipped.length === 0) return { copy, name, verdict: PALETTE.unknown, held, current };
  if (shipped.includes(held)) return { copy, name, verdict: PALETTE.refreshed, held, current };
  return { copy, name, verdict: PALETTE.authored, held, current };
};

/**
 * What should happen to every colour this save holds.
 *
 * TWO COPIES, JUDGED APART. colors.json wins at paint time and the registry is
 * the fallback (Nations.jsx resolveOwnerRgb), but both are writable and both can
 * be stale, so each is asked the same question about its own value. Every writer
 * in the game touches both together — the cheat editor writes the pair, and an
 * AI polityChange with a colour sets the override and the palette entry in the
 * same turn — so a colour a person chose is protected in both places by the same
 * rule, and a copy that is stale in one file only is fixed in that file only.
 *
 * Returns a verdict for every entry, including the ones nothing will be done
 * about. A migration that reports what it is NOT doing is worth more than one
 * that silently skips: `authored` is the count that says the guard is working.
 *
 * @param save      { colors, world } — the save's colors.json and world.json
 * @param scenario  { colors, world } — the scenario's, TODAY
 * @param board     the scenario id the save was started from
 * @param history   data/palette-history.json, parsed
 */
export const reconcilePalette = ({ save, scenario, board, history }) => {
  const entries = [];
  // A copy the save does not HAVE is skipped, not walked as a file full of holes.
  // The distinction is the whole fork story: a campaign with no colors.json of
  // its own is not missing 236 colours, it is reading the board live and already
  // has every recolour. Judging it entry by entry would report the board's whole
  // palette as absent from a save that is, in the only sense that matters, more
  // current than one this migration could produce.
  const pairs = [];
  if (save?.colors != null) {
    pairs.push([PALETTE_COPY.colors, readPalette(save.colors), readPalette(scenario?.colors)]);
  }
  if (save?.world != null) {
    pairs.push([
      PALETTE_COPY.registry,
      readRegistry(save.world.polityOverrides),
      readRegistry(scenario?.world?.polityOverrides),
    ]);
  }

  for (const [copy, held, current] of pairs) {
    for (const name of [...new Set([...held.keys(), ...current.keys()])].sort()) {
      entries.push(judge({
        copy,
        name,
        held: held.get(name) ?? "",
        current: current.get(name) ?? "",
        shipped: shippedColors(history, board, name),
      }));
    }
  }

  const tally = Object.fromEntries(Object.values(PALETTE).map((key) => [key, 0]));
  for (const entry of entries) tally[entry.verdict] += 1;
  return { entries, tally };
};

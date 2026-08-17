/*! Open Historia — leader lines for labels that cannot fit © 2026 Nicholas Krol, MIT (see src/Editor/LICENSE). */
// Pure geometry, no imports: countryLabels.js pulls in the tile decoder and
// through it maplibre-gl, which needs a DOM. This half needs nothing, so it
// lives here and tests/label-leaders.mjs can actually run it.

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

// ── LABELS THAT CANNOT FIT INSIDE THEIR OWN COUNTRY ──────────────────────────
//
// Every label is sized by its shape: areaScale = sqrt(area in deg²) × 17500,
// and the text size curve multiplies that by a power of two per zoom. That is
// right, and it is why the map reads as a map — but it has one failure mode,
// and on an interwar board it is a big one.
//
// Measured areaScale: Germany 110,600 · Belgium ~32,000 · Luxembourg 8,925 ·
// Free City of Danzig ~7,800 · Monaco ~250. At the zoom where a player reads
// Europe (z4), Germany's label is 27px and Luxembourg's is 2px. So Danzig,
// Memel, Luxembourg, Andorra, Liechtenstein, San Marino, Monaco and the Vatican
// are simply ABSENT from the 1935 map until you zoom into each one — and the
// texture of the interwar map is precisely those small states.
//
// The fix is what printed atlases have always done: below a floor, stop trying
// to fit the label inside the shape. Draw it at a legible size OUTSIDE, and run
// a leader line back to the country so the reader knows whose name it is.
//
// The floor. A country lands on a leader line when its own areaScale falls
// below this, so the number is a judgement about which countries are too small
// to hold their name. 20,000 puts Luxembourg (8,925), Danzig (7,800), Lebanon
// (18,400) and everything smaller on a line, and leaves Belgium (32,000),
// Albania (32,000), the Netherlands (33,000) and Denmark (39,000) drawing their
// names inside themselves, which they comfortably can.
export const LEADER_AREA_SCALE_FLOOR = 20000;

// What the label draws at once it is out on a line. Roughly Albania's own
// scale: big enough to read beside a full-size neighbour, small enough that a
// cluster of micro-states does not shout over the powers around them.
export const LEADER_LABEL_AREA_SCALE = 30000;

// How far past the shape the label sits, in DEGREES. The original exposes this
// as "label line extension" with a default of 0.015 in its own units; ours is
// degrees because that is what our anchors are computed in, and 0.5° is what
// clears a Luxembourg-sized shape and its border without landing in the next
// country's name. Overridden per-player by map_label_line_extension.
export const LEADER_EXTENSION_DEFAULT = 0.5;

// Where the label goes when it will not fit inside, and the line back to the
// shape. Works in lng/lat, not tile space, so the offset means the same thing
// at every tile the label could have come from.
//
// DIRECTION. The label leaves along the shape's MINOR axis — the short way out,
// so the line is as short as it can be — and of the two ways along that axis it
// takes the northern one, falling back to the eastern one when the axis is
// nearly horizontal. That is a convention, not a measurement: a cluster of
// micro-states all leaning the same way reads as deliberate typography, where
// per-shape "best side" logic reads as scatter. Up-and-right is also where an
// atlas puts them.
export const buildLeaderPlacement = (ringLngLat, centroid, principalAngleDeg, extensionDeg) => {
  if (!Array.isArray(ringLngLat) || ringLngLat.length < 3) return null;

  const [cx, cy] = centroid;
  // Tile-space axis is (cos θ, sin θ); its normal is (-sin θ, cos θ). Tile y
  // grows southward, so (dx, dy) becomes (dx, -dy) in lng/lat.
  const rad = principalAngleDeg * (Math.PI / 180);
  let nx = -Math.sin(rad);
  let ny = -Math.cos(rad);
  const length = Math.hypot(nx, ny) || 1;
  nx /= length;
  ny /= length;
  // North if the normal has any real vertical component, east otherwise.
  const wantsNorth = Math.abs(ny) > 0.2;
  if ((wantsNorth && ny < 0) || (!wantsNorth && nx < 0)) {
    nx = -nx;
    ny = -ny;
  }

  // How far the shape itself reaches along that normal, so the line starts
  // clear of the polygon rather than inside it.
  let reach = 0;
  for (const [px, py] of ringLngLat) {
    const projected = ((px - cx) * nx) + ((py - cy) * ny);
    if (projected > reach) reach = projected;
  }

  const distance = reach + Math.max(0, extensionDeg);
  const anchor = [cx + (nx * distance), cy + (ny * distance)];
  // Clamp off the poles: Mercator cannot draw them and a label pushed past
  // ±85° lands nowhere.
  anchor[1] = clamp(anchor[1], -84, 84);
  return { anchor, edge: [cx + (nx * reach), cy + (ny * reach)] };
};

// ── AND LABELS THAT FIT INSIDE, BUT ONLY BECAUSE THEIR NAME IS SHORT ─────────
//
// The rule above asks "is this country too small to hold a label?" and answers
// from area alone. That misses the other half of the same question: a label is
// only as wide as its NAME, and sizing by area never measures the name.
//
// Reported as country labels overprinting each other in central Germany.
// Measured on victorian-1836 at the reported view ([8.9, 51.2], z6.6, a 1600px
// window) by rebuilding the owner label collection and laying the text boxes
// out the way MapLibre does. Five pairs of tier-0 labels overlapped, and tier-0
// labels never yield to one another: a country standing on its own ground is
// always drawn (`text-allow-overlap: true`). That pin is right and is NOT what
// this changes.
//
// There is no zoom in the ratio and no area either, which is why this was never
// a small-states bug: label width ÷ territory width depends only on how wide
// the NAME is, so a long name is wider than its own country everywhere. Central
// Germany is only where the spill lands on a neighbour instead of on sea.
//
// Deriving the cap — zoom cancels, and so does size:
//
//   font size (deg) = areaScale × 2^(z−16) ÷ (512·2^z / 360)
//   label width     = font size × (name width in em, tracking included)
//   territory width = √area × √elongation     (the label lies along the axis)
//   ownScale        = √area × 17500           (the sizing rule this file serves)
//
// …leaving a constant: how many EM fit across a territory, whatever its size.
// About 4.76 — 8.6 upper-case Latin letters, or 4.8 Hangul syllables.
//
// ★ IT MEASURES THE NAME IN EM, NOT IN LETTERS — and that was a bug once.
//
// The first version counted letters and multiplied by 0.55, the width of an
// upper-case Latin glyph. This game is played in Korean: every polity carries a
// Korean alias and the label lane draws it. Hangul is full-width — 1.0 em, not
// 0.55 — so on the screen the player actually looks at, the cap saw 58% of the
// real width and left 바이에른 왕국 (6.3 em) alone as if it fit in 4.76. Measured
// on the reported view in Korean: two overlapping pairs before, one after, and
// the survivor was exactly the pair the letter count could not see. Measured
// again with per-glyph widths: zero.
//
// The measurement also has to know that MapLibre WRAPS. Nothing here sets
// text-max-width, so the default 10 em applies and a long name breaks at spaces
// and hyphens: GRAND DUCHY OF SAXE-WEIMAR-EISENACH is not one line of 18 em, it
// is three lines of at most 7.2. Measure the widest LINE, not the whole string,
// or the cap shrinks names that were never as wide as it thinks.

// The original's country names are widely letterspaced, and that spacing is
// most of what makes them read as a map's top rank rather than as large city
// labels. It is applied in LAYOUT (Nations.jsx writes it into the label
// layouts — put in paint, MapLibre rejects it and the tracking never applies),
// and it is declared HERE because the fit below has to know it: widen the
// tracking and every name needs more room.
export const LABEL_LETTER_SPACING = 0.12;

// MapLibre's default `text-max-width`, in em. Nations.jsx does not set the
// property, so this is the width at which the renderer actually wraps — if
// that ever changes there, change it here or the fit measures the wrong shape.
export const LABEL_MAX_WIDTH_EM = 10;

// Advance widths as em fractions. Estimated rather than measured off the
// player's installed font — the stack is a CSS font-family and MapLibre draws
// the glyphs locally, so the true numbers move with whatever they have. Only
// the ratios have to be right: full-width CJK is exactly 1 em by design; an
// upper-case Latin glyph in a heavy face is a bit over half of one; a space is
// narrower still. Measured across the plausible span for the Latin value
// (0.50–0.60), central Germany's overlap count did not move.
export const NAME_FIT_CHAR_WIDTH = 0.55;   // upper-case Latin (kept: tests and
// the doc-comment above cite it as the letters-per-territory constant's input)
const glyphWidth = (ch) => {
  if (/[ᄀ-ᇿ㄰-㆏가-힯぀-ヿ㐀-䶿一-鿿豈-﫿＀-￯]/.test(ch)) return 1.0;
  if (ch === " ") return 0.3;
  if (/[A-Z]/.test(ch)) return NAME_FIT_CHAR_WIDTH;
  if (/[a-z]/.test(ch)) return 0.5;
  return 0.45; // punctuation, digits, hyphens
};

// Width of a run of text as MapLibre will draw it, in em, tracking included.
export const nameWidthEm = (text) => {
  let width = 0;
  for (const ch of String(text ?? "")) width += glyphWidth(ch) + LABEL_LETTER_SPACING;
  return width;
};

// The width of the WIDEST LINE after MapLibre's wrapping — greedy at spaces
// and after hyphens, never exceeding LABEL_MAX_WIDTH_EM where a break exists.
// This is what actually has to fit; the full string is what the first version
// measured, and it over-counted every name past ten em.
export const widestLineEm = (text) => {
  const tokens = String(text ?? "").split(/(?<=[ -])/);
  let widest = 0;
  let line = "";
  for (const token of tokens) {
    if (line && nameWidthEm(line + token) > LABEL_MAX_WIDTH_EM) {
      widest = Math.max(widest, nameWidthEm(line.trimEnd()));
      line = token;
    } else {
      line += token;
    }
  }
  return Math.max(widest, nameWidthEm(line.trimEnd()));
};

// areaScale → degrees, with the zoom already cancelled from both sides.
const DEG_PER_AREA_SCALE = 360 / (512 * 65536);

// What the derivation collapses to: em across a territory. About 4.76.
export const NAME_FIT_EM = 1 / (DEG_PER_AREA_SCALE * 17500);

// …and the older way of saying the same number, kept because tests and the
// doc-comment above cite it: upper-case Latin letters across a territory,
// tracking included. About 8.6.
export const NAME_FIT_LETTERS = NAME_FIT_EM / (NAME_FIT_CHAR_WIDTH + LABEL_LETTER_SPACING);

// Shrink a label until it fits inside the shape it names. Returns the areaScale
// to draw at, unchanged when the name already fits.
export const fitNameToTerritory = (areaScale, name, elongation = 1) => {
  const width = Math.max(0.01, widestLineEm(name));
  // Lying along the long axis buys room, so an elongated country holds a longer
  // name than a round one of the same area. Counted only where the label
  // actually turns (AXIS_ELONGATION_FLOOR) — a horizontal label on a diagonal
  // country cannot spend that length, so the caller passes 1 there.
  const fit = (NAME_FIT_EM * Math.sqrt(Math.max(1, elongation))) / width;
  if (!(fit < 1)) return areaScale;
  // THE FLOOR. Below this a country's name reads at the weight of a province's,
  // which is a fault the label paint has already had to fix once. It is the
  // same line the leader-line rule draws — the size at which a name stops being
  // legible as a country — so a name that still will not fit there stays too
  // wide rather than going unreadable. Past that point the problem is the
  // length of the name, and size cannot solve it.
  return Math.max(Math.min(areaScale, LEADER_AREA_SCALE_FLOOR), areaScale * fit);
};

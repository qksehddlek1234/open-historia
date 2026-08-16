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
// only as wide as its NAME, and sizing by area never counts the letters.
//
// Reported as country labels overprinting each other in central Germany.
// Measured on victorian-1836 at the reported view ([8.9, 51.2], z6.6, a 1600px
// window) by rebuilding the owner label collection and laying the text boxes
// out the way MapLibre does: KINGDOM OF PRUSSIA came out **1749px wide — wider
// than the window** — and GRAND DUCHY OF MECKLENBURG-SCHWERIN four times wider
// than the duchy it names. Five pairs of tier-0 labels overlapped, and tier-0
// labels never yield to one another: a country standing on its own ground is
// always drawn (`text-allow-overlap: true`). That pin is right and is NOT what
// this changes.
//
// There is no zoom in the ratio and no area either, which is why this was never
// a small-states bug: label width ÷ territory width is about 0.116 × letters,
// so any name past ~9 characters is wider than its own country, everywhere.
// Central Germany is only where the spill lands on a neighbour instead of sea.
//
// Deriving the cap — zoom cancels, and so does size:
//
//   font size (deg) = areaScale × 2^(z−16) ÷ (512·2^z / 360)
//   label width     = font size × mean glyph width × letters × (1 + tracking)
//   territory width = √area × √elongation     (the label lies along the axis)
//   ownScale        = √area × 17500           (the sizing rule this file serves)
//
// …leaving a constant: how many letters fit across a territory, whatever its
// size. About 8.6.

// The original's country names are widely letterspaced, and that spacing is
// most of what makes them read as a map's top rank rather than as large city
// labels. It is applied in LAYOUT (Nations.jsx writes it into the label
// layouts — put in paint, MapLibre rejects it and the tracking never applies),
// and it is declared HERE because the fit below has to know it: widen the
// tracking and every name needs more room.
export const LABEL_LETTER_SPACING = 0.12;

// Mean advance of an upper-case glyph in Impact / Arial Black, as a fraction of
// the em. Estimated rather than measured off the player's installed font — the
// stack is a CSS font-family and MapLibre draws the glyphs locally, so the true
// value moves with whatever they have. It only has to be close, and the span
// was measured rather than assumed: central Germany comes out with ZERO
// overlapping pairs at 0.50 and at 0.55, and ONE at 0.60 (PRUSSIA against
// GERMAN CONFEDERATION — two large polities, legible either way).
export const NAME_FIT_CHAR_WIDTH = 0.55;

// areaScale → degrees, with the zoom already cancelled from both sides.
const DEG_PER_AREA_SCALE = 360 / (512 * 65536);

// What the derivation collapses to: letters across a territory.
export const NAME_FIT_LETTERS = 1
  / (DEG_PER_AREA_SCALE * 17500 * NAME_FIT_CHAR_WIDTH * (1 + LABEL_LETTER_SPACING));

// Shrink a label until it fits inside the shape it names. Returns the areaScale
// to draw at, unchanged when the name already fits.
export const fitNameToTerritory = (areaScale, name, elongation = 1) => {
  const letters = Math.max(1, String(name ?? "").length);
  // Lying along the long axis buys room, so an elongated country holds a longer
  // name than a round one of the same area. Counted only where the label
  // actually turns (AXIS_ELONGATION_FLOOR) — a horizontal label on a diagonal
  // country cannot spend that length, so the caller passes 1 there.
  const fit = (NAME_FIT_LETTERS * Math.sqrt(Math.max(1, elongation))) / letters;
  if (!(fit < 1)) return areaScale;
  // THE FLOOR. Below this a country's name reads at the weight of a province's,
  // which is a fault the label paint has already had to fix once. It is the
  // same line the leader-line rule draws — the size at which a name stops being
  // legible as a country — so a name that still will not fit there stays too
  // wide rather than going unreadable. Past that point the problem is the
  // length of the name, and size cannot solve it.
  return Math.max(Math.min(areaScale, LEADER_AREA_SCALE_FLOOR), areaScale * fit);
};

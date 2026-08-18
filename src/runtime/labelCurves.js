/*! Open Historia — curved country labels for the owner lane © 2026 Nicholas Krol, MIT (see src/Editor/LICENSE). */
// Pure geometry, no imports from the tile decoder: countryLabels.js pulls in
// assets.js and through it maplibre-gl, which needs a DOM. This half needs
// nothing, so it lives here and tests/label-leaders.mjs can actually run it.
import { LABEL_LETTER_SPACING, nameWidthEm } from "./labelLeaders.js";

// ── A LABEL THAT FOLLOWS THE COUNTRY ─────────────────────────────────────────
//
// The original draws GRAND-HESSE running down the long diagonal of Hesse and
// SAXE-WEIMAR bending along its strip of territory. Not a straight label
// tilted to the axis — a label that BENDS. That is how it fits a long name into
// a narrow shape without either overprinting a neighbour or shrinking to a
// province's weight, and it is the piece the owner lane never had.
//
// It nearly had it. countryLabels.js has carried a curved-path builder since
// the stock lane was written, and Nations.jsx has a `country-curved-labels`
// layer wired to it. But that lane is gated on `!customFlag`, and
// normalizeRuntimeWorld puts customRegions on every served world, so on 24 of
// 24 built boards it has never drawn a pixel. Opening the gate is NOT the fix:
// what sits behind it is the STOCK pipeline's output, built from modern
// country geometry — open it on 1836 and RUSSIA and GERMANY come up in curves
// over the owner labels. Content wrong, not just style. The precedent is the
// leader line, which had the same disease and the same cure: each lane brings
// its own. This file is the owner lane's own.
//
// Three things the stock builder could not do for the owner lane, and this one
// does:
//
//   1. It measures a CLUSTER, not a ring. An owner's territory is many regions
//      folded together — Prussia is twenty-one — and the stock builder takes one
//      polygon. Slicing every member ring at once along the shared axis reads
//      the cluster's actual width profile, gaps and all.
//   2. It takes the AXIS AS AN ARGUMENT. The stock builder recomputes it from
//      the ring's vertices, and that function is density-biased (Italy −19°,
//      Portugal +55°, measured). The owner lane already carries the area-moment
//      axis; handing it in keeps the curve and the flat label agreeing on which
//      way the country runs.
//   3. It spaces glyphs by their WIDTH. The stock builder gives every glyph one
//      unit and a space 0.55 — right for upper-case Latin, wrong for Hangul,
//      which is full-width and is what a Korean client actually draws. The em
//      widths come from labelLeaders.js so the fit cap and the curve measure the
//      same string the same way.

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const pointAlong = (points, distance) => {
  if (!points.length) return null;
  if (points.length === 1) return { point: points[0], angle: 0 };
  let travelled = 0;
  for (let i = 1; i < points.length; i += 1) {
    const [x0, y0] = points[i - 1];
    const [x1, y1] = points[i];
    const dx = x1 - x0;
    const dy = y1 - y0;
    const seg = Math.hypot(dx, dy);
    if (!(seg > 0)) continue;
    if (travelled + seg >= distance) {
      const r = (distance - travelled) / seg;
      return { point: [x0 + dx * r, y0 + dy * r], angle: Math.atan2(dy, dx) * (180 / Math.PI) };
    }
    travelled += seg;
  }
  const [xa, ya] = points[points.length - 2];
  const [xb, yb] = points[points.length - 1];
  return { point: [xb, yb], angle: Math.atan2(yb - ya, xb - xa) * (180 / Math.PI) };
};

// The largest change of direction between two neighbouring glyphs, were a
// name of `glyphCount` glyphs laid along this path — the same padding and
// spread layoutGlyphsAlongPath uses (`spread` is the run the name will occupy
// when the caller caps the glyph size — see maxPerEm there; the whole usable
// path otherwise), glyphs treated as equal advances (close enough to refuse a
// path; exact per-glyph widths only move the samples a little). Called by
// buildClusterCurvePath as its last gate.
const glyphStepDegrees = (points, length, glyphCount, spread) => {
  const padding = length * 0.08;
  const usable = length - padding * 2;
  if (!(usable > 0)) return 0;
  const run = Number.isFinite(spread) ? Math.min(usable, spread) : usable;
  const start = padding + (usable - run) / 2;
  let prev = null;
  let worst = 0;
  for (let i = 0; i < glyphCount; i += 1) {
    const sample = pointAlong(points, start + ((i + 0.5) / glyphCount) * run);
    if (!sample) continue;
    if (prev !== null) {
      let d = Math.abs(sample.angle - prev);
      if (d > 180) d = 360 - d;
      if (d > worst) worst = d;
    }
    prev = sample.angle;
  }
  return worst;
};


// ── path along the cluster ───────────────────────────────────────────────────

// Where a line perpendicular to the axis at `s0` crosses the shape: sorted
// entry/exit pairs, as [minT, maxT] intervals with width and midpoint. Rings
// are already in local (s, t) coordinates. Several rings at once — a slice can
// cross the mainland and an island and report two intervals, which is exactly
// the information a multi-region cluster needs.
//
// EACH RING IS SLICED ON ITS OWN, and only then are the results merged. Pooling
// every ring's crossings into one sorted list and pairing them off is wrong the
// moment two rings overlap or share an edge: the pairs no longer mean
// "entered here, left there". Per ring the pairing is exact; the merge below
// then joins what touches.
const sliceIntervals = (localRings, s0, gap) => {
  const raw = [];
  for (const ring of localRings) {
    const crossings = [];
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const p1 = ring[j];
      const p2 = ring[i];
      const crosses = (p1.s <= s0 && p2.s > s0) || (p2.s <= s0 && p1.s > s0);
      if (!crosses) continue;
      const factor = (s0 - p1.s) / (p2.s - p1.s);
      crossings.push(p1.t + factor * (p2.t - p1.t));
    }
    crossings.sort((a, b) => a - b);
    for (let i = 0; i + 1 < crossings.length; i += 2) {
      if (crossings[i + 1] - crossings[i] > 0) raw.push([crossings[i], crossings[i + 1]]);
    }
  }
  // MERGE WHAT TOUCHES. A cluster is many regions sharing borders, and a slice
  // through two neighbours leaves the first at the shared edge and enters the
  // second at the same place — two intervals where the territory has one. Left
  // unmerged, a continent reads as a bundle of slivers: the United Kingdom's
  // mainland measured 0.5% as wide as it is long, and every large country
  // "qualified" as a strip (measured, 1836). `gap` is the tolerance for the
  // shared vertex not being bit-identical after projection.
  raw.sort((a, b) => a[0] - b[0]);
  const intervals = [];
  for (const [minT, maxT] of raw) {
    const last = intervals[intervals.length - 1];
    if (last && minT <= last.maxT + gap) {
      if (maxT > last.maxT) last.maxT = maxT;
    } else {
      intervals.push({ minT, maxT });
    }
  }
  for (const it of intervals) {
    it.width = it.maxT - it.minT;
    it.midT = (it.minT + it.maxT) / 2;
  }
  return intervals;
};

// The interval the path starts in: the one under the centroid if any, else the
// widest. Then each neighbouring slice picks the interval that continues the
// line most nearly, with a small preference for width so the path drifts into
// the body of the shape rather than along a sliver.
const seedInterval = (intervals) => {
  if (!intervals.length) return null;
  const centered = intervals.find((it) => it.minT <= 0 && it.maxT >= 0);
  if (centered) return centered;
  return intervals.reduce((best, it) => (it.width > best.width ? it : best));
};
const followInterval = (intervals, targetT, scale) => {
  if (!intervals.length) return null;
  let best = null;
  let bestScore = Infinity;
  for (const it of intervals) {
    const score = Math.abs(it.midT - targetT) - (it.width / scale) * 0.2;
    if (score < bestScore) { best = it; bestScore = score; }
  }
  return best;
};

const smoothT = (samples, passes = 2) => {
  let current = samples;
  for (let pass = 0; pass < passes; pass += 1) {
    const src = current;
    current = src.map((sample, i) => (i === 0 || i === src.length - 1) ? sample : {
      ...sample,
      t: src[i - 1].t * 0.25 + src[i].t * 0.5 + src[i + 1].t * 0.25,
    });
  }
  return current;
};

const polylineLength = (points) => {
  let length = 0;
  for (let i = 1; i < points.length; i += 1) length += Math.hypot(points[i][0] - points[i - 1][0], points[i][1] - points[i - 1][1]);
  return length;
};
const totalTurnDegrees = (points) => {
  let total = 0;
  for (let i = 1; i + 1 < points.length; i += 1) {
    const a1 = Math.atan2(points[i][1] - points[i - 1][1], points[i][0] - points[i - 1][0]);
    const a2 = Math.atan2(points[i + 1][1] - points[i][1], points[i + 1][0] - points[i][0]);
    let delta = a2 - a1;
    while (delta > Math.PI) delta -= Math.PI * 2;
    while (delta < -Math.PI) delta += Math.PI * 2;
    total += Math.abs(delta);
  }
  return total * (180 / Math.PI);
};

// The centreline of a cluster along its axis, in the same space the rings are
// given in (the owner lane hands tile-space rings, so `axisDeg` is the tile-
// space angle MapLibre's text-rotate reads — see lngLatToTile in
// countryLabels.js for why that space and not lng/lat).
//
// Returns { points, length, spanUnits } or null when there is no usable path:
// the shape is too short along its axis, too fat to want a curve (a round
// country reads better with a straight label), or the centreline is straight
// enough that a straight label draws the same thing for less.
//
// `nameEm` is the name's width in em, tracking included; the path has to be
// long enough to hold it at a legible size or the curve is not worth drawing.
export const buildClusterCurvePath = (rings, centroid, axisDeg, nameEm, options = {}) => {
  const usable = (rings ?? []).filter((r) => Array.isArray(r) && r.length >= 3);
  if (!usable.length || !centroid || !Number.isFinite(axisDeg)) return null;

  const [cx, cy] = centroid;
  const rad = axisDeg * (Math.PI / 180);
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const local = usable.map((ring) => ring.map(([x, y]) => {
    const dx = x - cx;
    const dy = y - cy;
    return { s: dx * cos + dy * sin, t: -dx * sin + dy * cos };
  }));

  let minS = Infinity;
  let maxS = -Infinity;
  for (const ring of local) for (const p of ring) { if (p.s < minS) minS = p.s; if (p.s > maxS) maxS = p.s; }
  const span = maxS - minS;
  if (!(span > 0)) return null;

  // Keep off the ends of the shape: the last 12% each way is usually a
  // peninsula or a border salient, and a path that runs into it turns hard.
  const padding = span * 0.12;
  const usableMinS = minS + padding;
  const usableSpan = span - padding * 2;
  if (!(usableSpan > 0)) return null;

  const sampleCount = clamp(Math.round(options.samples ?? 15), 9, 25);
  const samples = [];
  for (let i = 0; i < sampleCount; i += 1) {
    const s = usableMinS + (usableSpan * i) / (sampleCount - 1);
    const intervals = sliceIntervals(local, s, span * 0.004);
    if (intervals.length) samples.push({ s, intervals });
  }
  if (samples.length < 4) return null;

  let centerIndex = 0;
  let centerDistance = Infinity;
  for (let i = 0; i < samples.length; i += 1) {
    if (Math.abs(samples[i].s) < centerDistance) { centerDistance = Math.abs(samples[i].s); centerIndex = i; }
  }
  const chosen = new Array(samples.length).fill(null);
  chosen[centerIndex] = seedInterval(samples[centerIndex].intervals);
  if (!chosen[centerIndex]) return null;
  for (let i = centerIndex + 1; i < samples.length; i += 1) chosen[i] = followInterval(samples[i].intervals, chosen[i - 1]?.midT ?? 0, span);
  for (let i = centerIndex - 1; i >= 0; i -= 1) chosen[i] = followInterval(samples[i].intervals, chosen[i + 1]?.midT ?? 0, span);

  const raw = samples.map((sample, i) => chosen[i] ? { s: sample.s, t: chosen[i].midT, width: chosen[i].width } : null).filter(Boolean);
  if (raw.length < 4) return null;

  // Smoothed HARDER than the stock lane (four passes, not two). The stock lane
  // curves strips, whose centreline is smooth to begin with; this lane curves
  // whatever cannot hold its name flat, and a blocky shape's centreline
  // zigzags from slice to slice — Serbia's turned 81° between two adjacent
  // glyphs at two passes (measured). Text along a zigzag is unreadable; text
  // along the same path smoothed is a bend.
  const smoothed = smoothT(raw, options.smoothPasses ?? 4);
  let points = smoothed.map(({ s, t }) => [cx + s * cos - t * sin, cy + s * sin + t * cos]);

  const length = polylineLength(points);
  const direct = Math.hypot(points[points.length - 1][0] - points[0][0], points[points.length - 1][1] - points[0][1]);
  const turn = totalTurnDegrees(points);
  const meanWidth = raw.reduce((sum, r) => sum + r.width, 0) / raw.length;
  const widthRatio = meanWidth / usableSpan;

  // KINK: the sharpest single bend along the path. Total turn can be large on
  // a long gentle S and that is fine; what breaks reading is one corner where
  // two neighbouring glyphs face different ways. Measured in degrees between
  // consecutive segments; the caller may tighten it.
  let kink = 0;
  for (let i = 1; i + 1 < points.length; i += 1) {
    const a1 = Math.atan2(points[i][1] - points[i - 1][1], points[i][0] - points[i - 1][0]);
    const a2 = Math.atan2(points[i + 1][1] - points[i][1], points[i + 1][0] - points[i][0]);
    let d = Math.abs(a2 - a1);
    if (d > Math.PI) d = Math.PI * 2 - d;
    if (d > kink) kink = d;
  }
  kink *= 180 / Math.PI;

  // The gates — and they ask a different question from the stock lane's.
  //
  // The stock builder asks "is this shape a strip?" (width ratio under 0.22)
  // and curves only those. Measured against the original at the reported view:
  // the original curves GRAND-HESSE and SAXE-WEIMAR, whose width ratios here
  // are 0.30 and 0.61 — neither is a strip. What they have in common is that
  // their NAME DOES NOT FIT FLAT. The original curves when it has to, not when
  // the shape is pretty. So the question here is need, and the caller says
  // whether there is one (`options.needed`); a shape whose flat label already
  // fits does not get a curve however elegant the path.
  //
  // FAT is still a gate, but a loose one: past 0.7 the "long axis" is barely
  // longer than the short one and a path along it is arbitrary — the label
  // would bend for no reason a reader can see. Round countries stay flat.
  if (widthRatio > (options.maxWidthRatio ?? 0.7)) return null;
  // ROOM: the path must be long enough to hold the name at a legible size.
  // `minPathPerEm` is how many units of ring space one em is worth at the
  // smallest size the caller will accept — the caller knows the font, this
  // function does not. The path's usable 84% must hold the whole name at that.
  if (Number.isFinite(options.minPathPerEm) && length * 0.84 < nameEm * options.minPathPerEm) return null;
  // STRAIGHT: if the centreline is within 4% of its chord and turns under
  // `minTurnDeg` in total, a straight rotated label draws the same thing for
  // less — UNLESS the caller has said the flat label does not fit, in which
  // case a nearly-straight path along the shape is still a better answer than
  // a straight label spilling off it. That is what `needed` buys.
  if (!(direct > 0)) return null;
  if (!options.needed && length / direct <= 1.04 && turn <= (options.minTurnDeg ?? 55)) return null;
  // KINKED: one corner sharper than this and the label reads as two words at
  // an angle. 40° between consecutive segments is roughly where a bend stops
  // being a bend; the smoothing above keeps most real shapes well under it.
  if (kink > (options.maxKinkDeg ?? 40)) return null;
  // BENT BETWEEN GLYPHS: a path can pass every gate above and still turn 60°
  // between two neighbouring letters, because a short name spreads its glyphs
  // far apart along a long path and each pair straddles a whole bend. Two
  // Sicilies and New Granada did exactly that (57–61° between neighbours,
  // measured on Korean names) and read as letters scattered on a curve. The
  // layout is deterministic, so rehearse it: place the glyphs the way
  // layoutGlyphsAlongPath will and refuse the path if any two neighbours face
  // more than `maxGlyphStepDeg` apart. Round countries with short names are
  // most of what this catches, and they read fine flat.
  if (Number.isFinite(options.glyphCount) && options.glyphCount >= 2) {
    const spread = Number.isFinite(options.maxPerEm) ? nameEm * options.maxPerEm : undefined;
    const step = glyphStepDegrees(points, length, options.glyphCount, spread);
    if (step > (options.maxGlyphStepDeg ?? 30)) return null;
  }

  // Read left to right: if the path runs right-to-left in tile space, flip it.
  const overall = Math.atan2(points[points.length - 1][1] - points[0][1], points[points.length - 1][0] - points[0][0]) * (180 / Math.PI);
  if (overall > 90 || overall < -90) points = [...points].reverse();

  return { points, length, widthRatio, turnDeg: turn, kinkDeg: kink };
};

// ── glyphs along the path ────────────────────────────────────────────────────

// One glyph per point feature, spaced along the path by each glyph's own
// width. Returns [{ glyph, position: [x, y] (same space as the path), rotation,
// advanceEm }] or null. Spaces advance the cursor and are not emitted.
//
// `sizeScale` is how the caller wants the glyph sized relative to the flat
// label it replaces (the stock lane clamps 0.6–0.92 by how much room the path
// leaves; the owner lane decides the same way — see Nations.jsx).
//
// `maxPerEm` caps how many units of path one em may take — one em at the
// label's own weight, from a caller that will not draw the glyphs larger than
// that. Without it the name always spreads across the whole usable path, and
// a short name on a long path spreads into letters scattered along a bend
// (which the caller then draws at its own weight anyway, so the spread was
// only ever a gap). With it the name is laid at that size and CENTRED on the
// path; a name that needs the whole path still gets it.
export const layoutGlyphsAlongPath = (path, name, options = {}) => {
  if (!path?.points?.length) return null;
  const glyphs = Array.from(String(name ?? ""));
  if (!glyphs.length) return null;
  const totalEm = nameWidthEm(name);
  if (!(totalEm > 0)) return null;

  const padding = path.length * 0.08;
  const usable = path.length - padding * 2;
  if (!(usable > 0)) return null;
  // Units of path per em — the whole name spreads across the usable length,
  // or as much of it as the size cap allows, centred.
  const perEm = Number.isFinite(options.maxPerEm) ? Math.min(usable / totalEm, options.maxPerEm) : usable / totalEm;
  const start = padding + (usable - totalEm * perEm) / 2;

  // THE WHOLE LABEL FACES ONE WAY. The stock lane normalises each glyph's angle
  // into (−90, 90] on its own, and on a path that runs near vertical that
  // flips individual glyphs — Württemberg's label came out with three of eight
  // letters upside down relative to their neighbours (measured), because
  // segments at 89° and −89° are two degrees apart in direction and 178° apart
  // after normalisation. Decide ONCE, from the path's overall direction, whether
  // the text reads along or against the path, and apply that to every glyph;
  // then each glyph's rotation is continuous with its neighbours.
  const first = path.points[0];
  const last = path.points[path.points.length - 1];
  const overall = Math.atan2(last[1] - first[1], last[0] - first[0]) * (180 / Math.PI);
  const flip = overall > 90 || overall < -90;

  const out = [];
  let cursorEm = 0;
  for (const glyph of glyphs) {
    const advance = nameWidthEm(glyph);
    const centre = start + (cursorEm + advance / 2) * perEm;
    cursorEm += advance;
    if (glyph === " ") continue;
    const sample = pointAlong(path.points, centre);
    if (!sample) continue;
    let rotation = flip ? sample.angle + 180 : sample.angle;
    // Wrap into (−180, 180] without changing which way the glyph faces.
    while (rotation > 180) rotation -= 360;
    while (rotation <= -180) rotation += 360;
    out.push({ glyph, position: sample.point, rotation, advanceEm: advance });
  }
  return out.length ? { glyphs: out, perEm, totalEm, flipped: flip } : null;
};

// Tile space ↔ lng/lat, the same square Web Mercator countryLabels.js measures
// axes in (see lngLatToTile there for why that space and not lng/lat). The
// inverse lives here as well so this file can hand back positions the map can
// draw without reaching into the tile decoder.
export const tileToLngLat = ([px, py], extent = 4096) => {
  const lng = (px / extent) * 360 - 180;
  const latRad = Math.atan(Math.sinh(Math.PI * (1 - (2 * py) / extent)));
  return [lng, latRad * (180 / Math.PI)];
};

// The tracking the layouts apply is already inside nameWidthEm; exported here
// only so a caller sizing the curved layer can subtract it if it needs the bare
// glyph advance.
export { LABEL_LETTER_SPACING };

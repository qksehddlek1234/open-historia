/*! Open Historia — label paint expressions © 2026, MIT (see src/Editor/LICENSE). */
// Pure MapLibre expressions for the country-label layers, no DOM: Nations.jsx
// mounts them, tests/label-leaders.mjs validates them against MapLibre's own
// style spec and reads their values back at a given zoom and feature. Kept
// out of Nations.jsx for the same reason the fit and the curve are — the
// component file cannot be imported without a browser, and the one expression
// that lived only there (the leader-line opacity) was invalid for as long as
// nothing could ask MapLibre whether it was.

// ── A LABEL FADES ON ITS OWN SIZE ON SCREEN, NOT ON ZOOM ────────────────────
//
// In CSS px of font size — the units buildCountryTextSize produces — because
// a micro-state's name at z8 and a continent's at z3 are the same event,
// "this label is now the size a reader can use", and one ramp in px catches
// both where a ramp in zoom catches neither.
//
// Measured on the original (2026-08-18, its 2020 board, on the monitor this
// map is read on): JAPAN across Honshu is solid at ~90 px, half-faded at
// ~150 px, gone before ~280 px; REPUBLIC OF KOREA is solid at 13 px, drawn at
// 8, absent at 6, and back at the next step in; every name in between is flat
// and solid — which is what the earlier measurement at z≈6.8 (Riga to Moscow:
// LATVIA solid) had already found and mistaken for "always solid". So: nothing
// under LABEL_FADE_IN_PX[0], full at [1]; full up to LABEL_FADE_OUT_PX[0],
// nothing past [1].
//
// Why it matters more here than there: since 2026-08-18 every name is sized to
// fit inside its own country, however small that makes it (see the label loop
// in Nations.jsx), so at Europe's zoom a hundred small states have names a
// pixel or two high. This is what keeps them off the screen until they can be
// read — the way the original keeps Korea's — instead of a smear of grey halo
// over half of Germany.
export const LABEL_FADE_IN_PX = [6, 12];
export const LABEL_FADE_OUT_PX = [100, 200];

// MapLibre lets ["zoom"] appear only as the input of a TOP-LEVEL interpolate
// or step, so a property that depends on zoom AND on the feature is written
// as one output expression per integer zoom, and the renderer interpolates
// between the two nearest — the "composite" form. Everything below is that
// shape. (The renderer evaluates a composite paint property at the tile's
// integer zoom and the next one and blends between them, so finer stops than
// integers would buy nothing.)
export const perZoomStops = (outputAt) => {
  const stops = [];
  for (let zoom = 0; zoom <= 24; zoom += 1) stops.push(zoom, outputAt(zoom));
  return ["interpolate", ["linear"], ["zoom"], ...stops];
};

// The window as an expression of on-screen font size `px` (a data expression):
// a ramp in, times a ramp out — each interpolate clamps outside its stops.
export const fadeWindowOf = (px) => [
  "*",
  ["interpolate", ["linear"], px, LABEL_FADE_IN_PX[0], 0, LABEL_FADE_IN_PX[1], 1],
  ["interpolate", ["linear"], px, LABEL_FADE_OUT_PX[0], 1, LABEL_FADE_OUT_PX[1], 0],
];

// text-opacity for a label layer whose text-size is buildCountryTextSize with
// the same multiplier and globe correction: `peak` inside the window, fading
// out either side. The px at zoom z is the same product text-size takes —
// multiplier × areaScale × 2^(z−16), times the globe correction expression
// when one is passed — minus text-size's 254 cap, which only matters past the
// point the label is already gone.
export const buildCountryTextOpacity = (multiplier = 1, globeCorrection = null, peak = 0.75) => {
  const scale = globeCorrection ? ["*", multiplier, globeCorrection] : multiplier;
  return perZoomStops((zoom) => [
    "*", peak,
    fadeWindowOf(["*", scale, ["*", ["get", "areaScale"], 2 ** (zoom - 16)]]),
  ]);
};

// line-opacity for the leader lines: the line fades out as the COUNTRY it
// points at grows past reading size on screen — ownScale × 2^(z−16), the same
// units the text is sized in — from 0.38 at 20 px of country to nothing at 60.
// The reason for fading was never zoom (the old z5→z8 ramp put every line in a
// cluster of small states at 0.18 by z6.6, where the player reads them); it
// was "the shape is now big enough to point at itself".
//
// The first version wrote that as arithmetic on ["zoom"] inside the
// interpolate's input, and MapLibre rejected the layer on every style pass
// ("zoom" expression may only be used as input to a top-level "step" or
// "interpolate") — every leader line on every board was invisible until the
// live screen was looked at (2026-08-18). This is the valid, composite form
// of the same curve.
export const LEADER_LINE_OPACITY_RAMP = [20, 0.38, 60, 0];
export const buildLeaderLineOpacity = () => perZoomStops((zoom) => [
  "interpolate", ["linear"],
  ["*", ["coalesce", ["get", "ownScale"], 0], 2 ** (zoom - 16)],
  ...LEADER_LINE_OPACITY_RAMP,
]);

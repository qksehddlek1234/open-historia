/*!
 * Open Historia Map Editor
 * Copyright (c) 2026 Nicholas Krol - MIT License (see src/Editor/LICENSE).
 */

// Plan F, stage F-1 — the pure half of the OHM era-border extractor.
//
// Everything in this file is deliberately free of fetch, fs and clocks, so the
// whole date/tile/filter pipeline is testable offline (tests/ohm.mjs) and the
// cloud session never needs network access to verify it. The CLI sibling
// (scripts/ohm/extract-era-borders.mjs) does the fetching, on a machine that is
// allowed to fetch — the player's PC.
//
// DATA AND LICENSE. This pipeline consumes OpenHistoricalMap vector tiles ONLY.
// OHM data carries a CC0 public-domain dedication, so filtered geometry may be
// stored in and shipped with the game. Omniatlas and GeaCron are
// all-rights-reserved: they are EYES-ONLY references for visual review (keep
// links, copy nothing) — see docs/PLAN-F-OHM.md.
//
// DATES. OHM tiles carry two date encodings per feature:
//   start_date / end_date       ISO-ish strings ("1939-09-01", "1944", "-0044")
//   start_decdate / end_decdate numeric decimal years the tiler derives
// The app's maplibre-gl-dates plugin filters on the numeric pair, so the
// extractor prefers it too and falls back to converting the strings. The
// decimal convention: year + (dayOfYear - 1) / daysInYear at midnight, in the
// proleptic Gregorian calendar with astronomical year numbering (year 0 exists
// and is a leap year — ISO 8601's convention, which OHM follows for BCE).
// Underspecified dates ("1944", "1944-02") resolve to their earliest moment.
//
// A feature exists at date D when  start <= D < end , either side open when
// absent: no start means "as old as the map", no end means "still there". The
// end side is EXCLUSIVE — a polity whose end_date is the target date is
// already gone that day. Comparisons carry a tiny tolerance (DEC_EPS) so a
// last-ulp float disagreement between the tiler's SQL and this JS never flips
// a border in or out.

const normalizeString = (value) => String(value ?? "").trim();

// ---------------------------------------------------------------------------
// Decimal dates
// ---------------------------------------------------------------------------

// Proleptic Gregorian, astronomical numbering: year 0 = 1 BCE and IS leap.
export const isLeapYear = (year) => (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;

export const daysInYear = (year) => (isLeapYear(year) ? 366 : 365);

const MONTH_DAYS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

export const daysInMonth = (year, month) =>
  month === 2 && isLeapYear(year) ? 29 : MONTH_DAYS[month - 1] ?? 0;

// "1939-09-01" | "1939-09" | "1939" | "-0044-03-15" -> decimal year, or null.
// Underspecified dates resolve to their earliest moment (Jan 1 / first of the
// month) — the same reading the app gives them when it renders a year.
export const isoToDecdate = (value) => {
  const text = normalizeString(value);
  const match = /^(-?\d{1,6})(?:-(\d{1,2}))?(?:-(\d{1,2}))?$/.exec(text);
  if (!match) return null;
  const year = Number(match[1]);
  const month = match[2] ? Number(match[2]) : 1;
  const day = match[3] ? Number(match[3]) : 1;
  if (!Number.isFinite(year)) return null;
  if (month < 1 || month > 12) return null;
  if (day < 1 || day > daysInMonth(year, month)) return null;
  let dayOfYear = day;
  for (let m = 1; m < month; m += 1) dayOfYear += daysInMonth(year, m);
  return year + (dayOfYear - 1) / daysInYear(year);
};

// An END date resolves to the END of its stated period — the tiler's own
// reading, verified on real data: 中國's end_date "1945" carries end_decdate
// 1945.99863 (the LAST day of 1945), not 1945.0. A country that "ended in
// 1945" must still exist in June 1945; the point-resolution above would kill
// it a year early. Year-only → next year's start; year-month → next month's
// start; a full date stays a point (the exclusive-end comparison handles it).
export const isoToDecdateEnd = (value) => {
  const point = isoToDecdate(value);
  if (point === null) return null;
  const match = /^(-?\d{1,6})(?:-(\d{1,2}))?(?:-(\d{1,2}))?$/.exec(normalizeString(value));
  const year = Number(match[1]);
  if (!match[2]) return year + 1;
  if (!match[3]) {
    const month = Number(match[2]);
    if (month === 12) return year + 1;
    let dayOfYear = 1;
    for (let m = 1; m <= month; m += 1) dayOfYear += daysInMonth(year, m);
    return year + (dayOfYear - 1) / daysInYear(year);
  }
  return point;
};

// ~0.03 seconds of a year: absorbs float wobble between the tiler's decdates
// and ours without ever moving a border by a calendar day.
export const DEC_EPS = 1e-9;

// start <= D < end, open sides valid. End exclusive: gone on its end date.
export const decdateWindow = (start, end, target) => {
  if (start !== null && start !== undefined && !(start <= target + DEC_EPS)) return false;
  if (end !== null && end !== undefined && !(target < end - DEC_EPS)) return false;
  return true;
};

const asDecdate = (numeric, iso, isoConvert) => {
  const direct = Number(numeric);
  if (normalizeString(numeric) !== "" && Number.isFinite(direct)) return direct;
  return isoConvert(iso);
};

// A feature's validity window from its properties: the numeric decdates the
// tiler computed win; ISO strings are the fallback; nothing means open. The
// end side resolves shortened dates to the END of their period (see above).
export const resolveWindow = (props = {}) => ({
  start: asDecdate(props.start_decdate, props.start_date, isoToDecdate),
  end: asDecdate(props.end_decdate, props.end_date, isoToDecdateEnd),
});

// ---------------------------------------------------------------------------
// Feature filter
// ---------------------------------------------------------------------------

const flagIsSet = (value) => {
  const text = normalizeString(value).toLowerCase();
  return text === "yes" || text === "true" || text === "1";
};

// Keep or drop one OHM feature for the target date. Returns a verdict WITH a
// reason, never a bare boolean — the CLI tallies the reasons so every dropped
// feature is accounted for out loud (a cap you cannot see is a lie about
// coverage).
export const featureFilter = (
  props = {},
  targetDec,
  { maxAdminLevel = 2, includeMaritime = false, requireName = false } = {},
) => {
  const adminText = normalizeString(props.admin_level);
  if (adminText === "") return { keep: false, why: "admin_level 없음" };
  const adminLevel = Number(adminText);
  if (!Number.isFinite(adminLevel)) return { keep: false, why: "admin_level 비수치" };
  if (adminLevel > maxAdminLevel) {
    return { keep: false, why: `admin_level ${adminLevel} > ${maxAdminLevel}` };
  }
  if (!includeMaritime && flagIsSet(props.maritime)) return { keep: false, why: "maritime 경계" };
  if (requireName && normalizeString(props.name) === "") return { keep: false, why: "name 없음" };
  const { start, end } = resolveWindow(props);
  if (!decdateWindow(start, end, targetDec)) {
    const fmt = (n) => (n === null || n === undefined ? "…" : n.toFixed(2));
    return { keep: false, why: `날짜 창 밖 (${fmt(start)}–${fmt(end)})` };
  }
  return { keep: true, why: "" };
};

// ---------------------------------------------------------------------------
// Tile math (Web Mercator, XYZ scheme)
// ---------------------------------------------------------------------------

export const WEB_MERCATOR_MAX_LAT = 85.05112878;

// Generalisation of the z0-only helper in src/Game/GameUI/time.jsx to any
// tile: fold the tile address into world-fraction space first, then project.
// The CLI's geometry path goes through @mapbox/vector-tile's toGeoJSON (same
// math, battle-tested); this export is the reference the tests anchor and the
// seam-stitching in F-2 will need raw.
export const tilePointToLngLat = (px, py, { extent = 4096, z = 0, tx = 0, ty = 0 } = {}) => {
  const side = 2 ** z;
  const worldX = (tx + px / extent) / side;
  const worldY = (ty + py / extent) / side;
  const lng = worldX * 360 - 180;
  const lat = (Math.atan(Math.sinh(Math.PI * (1 - 2 * worldY))) * 180) / Math.PI;
  return [lng, lat];
};

// A tile's exact lng/lat bounds — the inverse of lngLatToTile, built from the
// same projection. Used by the extractor to clip away the MVT buffer zone
// (measured on real data: some features ship with a 256/4096 buffer, planting
// endpoints exactly tileWidth/16 past the seam).
export const tileToBbox = (z, tx, ty, extent = 4096) => {
  const [w, n] = tilePointToLngLat(0, 0, { extent, z, tx, ty });
  const [e, s] = tilePointToLngLat(extent, extent, { extent, z, tx, ty });
  return [w, s, e, n];
};

// Clip one polyline to a bbox (Liang-Barsky per segment). A line may exit and
// re-enter, so the result is a LIST of sub-parts. Interior geometry is passed
// through untouched; only crossing segments gain an on-boundary endpoint.
const clipSegment = (p, q, [w, s, e, n]) => {
  const dx = q[0] - p[0];
  const dy = q[1] - p[1];
  let t0 = 0;
  let t1 = 1;
  for (const [den, num] of [
    [-dx, p[0] - w],
    [dx, e - p[0]],
    [-dy, p[1] - s],
    [dy, n - p[1]],
  ]) {
    if (den === 0) {
      if (num < 0) return null;
      continue;
    }
    const t = num / den;
    if (den < 0) {
      if (t > t0) t0 = t;
    } else if (t < t1) {
      t1 = t;
    }
    if (t0 > t1) return null;
  }
  const at = (t) => [p[0] + t * dx, p[1] + t * dy];
  return [t0 === 0 ? p : at(t0), t1 === 1 ? q : at(t1)];
};

export const clipPartToBbox = (part, bbox) => {
  const out = [];
  let current = [];
  const samePt = (a, b) => a[0] === b[0] && a[1] === b[1];
  const flush = () => {
    if (current.length >= 2) out.push(current);
    current = [];
  };
  for (let i = 0; i + 1 < part.length; i += 1) {
    const clipped = clipSegment(part[i], part[i + 1], bbox);
    if (!clipped) {
      flush();
      continue;
    }
    const [a, b] = clipped;
    if (samePt(a, b)) continue;
    if (current.length === 0) current.push(a);
    else if (!samePt(current[current.length - 1], a)) {
      flush();
      current.push(a);
    }
    current.push(b);
  }
  flush();
  return out;
};

export const lngLatToTile = (lng, lat, z) => {
  const side = 2 ** z;
  const clamped = Math.max(-WEB_MERCATOR_MAX_LAT, Math.min(WEB_MERCATOR_MAX_LAT, lat));
  const latRad = (clamped * Math.PI) / 180;
  const x = Math.floor(((lng + 180) / 360) * side);
  const y = Math.floor(((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * side);
  const pin = (n) => Math.max(0, Math.min(side - 1, n));
  return [pin(x), pin(y)];
};

// [lonW, latS, lonE, latN] -> inclusive tile range at z. An antimeridian-
// crossing box (W > E) is refused loudly rather than half-handled: run the
// extractor twice, once per side.
export const bboxToTileRange = (bbox, z) => {
  const [w, s, e, n] = bbox.map(Number);
  if (![w, s, e, n].every(Number.isFinite)) throw new Error(`bbox가 숫자 4개가 아니다: ${bbox}`);
  if (w > e) throw new Error("bbox가 날짜변경선을 건넌다 (W > E) — 두 번에 나눠 실행하라");
  if (s > n) throw new Error("bbox의 남쪽이 북쪽보다 크다 (S > N)");
  const [xMin, yMin] = lngLatToTile(w, n, z);
  const [xMax, yMax] = lngLatToTile(e, s, z);
  return { xMin, xMax, yMin, yMax, count: (xMax - xMin + 1) * (yMax - yMin + 1) };
};

// ---------------------------------------------------------------------------
// GeoJSON emit
// ---------------------------------------------------------------------------

const round5 = (n) => Math.round(n * 1e5) / 1e5;

// Same rounding contract as scripts/extract-regions.mjs: ~1 m precision keeps
// the dump small, and identical seam vertices round identically so the F-2
// stitch can dissolve tile boundaries instead of leaving slivers.
export const roundCoords = (node) =>
  typeof node[0] === "number" ? [round5(node[0]), round5(node[1])] : node.map(roundCoords);

// The properties worth carrying out of the tile — everything the date filter,
// polity assignment (F-2) and dispute handling (route 2) will want, nothing
// else. Unknown tiler internals stay behind.
const KEEP_PROPS = [
  "name",
  "admin_level",
  "start_date",
  "end_date",
  "start_decdate",
  "end_decdate",
  "maritime",
  "disputed",
  "disputed_by",
  "area_km2",
];

export const pickProps = (props = {}) => {
  const out = {};
  for (const key of KEEP_PROPS) {
    if (props[key] !== undefined && props[key] !== null && normalizeString(props[key]) !== "") {
      out[key] = props[key];
    }
  }
  return out;
};

export const eraFeature = (geometry, props = {}, id = undefined) => {
  const feature = {
    type: "Feature",
    properties: pickProps(props),
    geometry: geometry
      ? { type: geometry.type, coordinates: roundCoords(geometry.coordinates) }
      : null,
  };
  if (id !== undefined && id !== null) feature.id = id;
  return feature;
};

// RFC 7946 allows foreign members: `meta` records exactly what produced this
// dump, so two dumps are comparable and reruns are diffable (no timestamps —
// same inputs, byte-identical output).
export const eraCollection = (features, meta = {}) => ({
  type: "FeatureCollection",
  meta: {
    source: "OpenHistoricalMap (data: CC0 1.0 public-domain dedication)",
    attribution: "OpenHistoricalMap contributors",
    stitched: false,
    ...meta,
  },
  features,
});

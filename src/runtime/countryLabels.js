/*! Open Historia — portions (custom-region owner labels) © 2026 Nicholas Krol, MIT (see src/Editor/LICENSE). */
import {
  PMTILES_ARCHIVES,
  decodeVectorTile,
  getPmtilesArchive,
  readRuntimeJson,
  resolveCountryDisplayName,
  writeRuntimeJson,
} from "./assets.js";
import { getStoredLanguage } from "./i18n.js";
import { translateLabel } from "./translator.js";
import {
  LEADER_AREA_SCALE_FLOOR,
  LEADER_EXTENSION_DEFAULT,
  LEADER_LABEL_AREA_SCALE,
  buildLeaderPlacement,
} from "./labelLeaders.js";

// v3: label features now carry `lat` (globe text-size correction, issue #6) —
// bumped so returning users' persisted v2 cache (no `lat`) doesn't silently
// serve pre-fix data forever.
// v4: label features carry `leader`, and the payload carries a third
// collection (leaderLineData) — a persisted v3 cache has neither, so a
// returning player would keep getting a map with no small states on it.
const COUNTRY_LABELS_CACHE_KEY = "country-labels-v4";
const EMPTY_FEATURE_COLLECTION = { type: "FeatureCollection", features: [] };
const EMPTY_COUNTRY_LABELS = {
  curvedLabelData: EMPTY_FEATURE_COLLECTION,
  pointLabelData: EMPTY_FEATURE_COLLECTION,
  leaderLineData: EMPTY_FEATURE_COLLECTION,
};

let countryLabelsPromise = null;
let countryLabelsPromiseKey = null;
let countryLabelsValue = null;
let countryLabelsValueKey = null;

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const calculateArea = (ring) => {
  let area = 0;
  if (!ring || ring.length < 3) return 0;

  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    area += (ring[j][0] + ring[i][0]) * (ring[j][1] - ring[i][1]);
  }

  return Math.abs(area / 2);
};

const getCentroid = (ring) => {
  let x = 0;
  let y = 0;
  let area = 0;

  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const p1 = ring[i];
    const p2 = ring[j];
    const factor = p1[0] * p2[1] - p2[0] * p1[1];
    area += factor;
    x += (p1[0] + p2[0]) * factor;
    y += (p1[1] + p2[1]) * factor;
  }

  const scale = (area * 3) || 1;
  return { cx: x / scale, cy: y / scale };
};

// A shape's direction, carried as RUNNING SUMS over AREA. Two things forced
// this form.
//
// A country is often not one polygon — a colonial empire is dozens — and sums
// are the one form that lets those be measured together without holding their
// points: merging two territories is adding two accumulators, exactly, in any
// order.
//
// And it is the area that is measured, not the outline's points. Counting
// points measures how finely each border was drawn: a region with an intricate
// coast brings thousands of vertices and an inland one with a straight border
// brings a dozen, so the answer follows the cartographer's pen. Measured on
// wwii-1935 that put ITALY at -19°, tilted the wrong way across the most
// obviously angled country in Europe, and PORTUGAL at +55° across a strip that
// runs north-south. These are the standard polygon moments, so a province
// counts for its size and nothing else.
export const createAxisMoments = () => ({ a: 0, sx: 0, sy: 0, sxx: 0, sxy: 0, syy: 0 });

export const addAxisMoments = (into, from) => {
  if (!from) return into;
  into.a += from.a;
  into.sx += from.sx;
  into.sy += from.sy;
  into.sxx += from.sxx;
  into.sxy += from.sxy;
  into.syy += from.syy;
  return into;
};

// One closed ring, in the space it will be drawn in. Winding order is absorbed
// here (a clockwise ring integrates negative), so callers may pass rings from
// any source and still add them together.
export const addAxisPolygon = (moments, ring) => {
  if (!ring || ring.length < 3) return moments;

  let a = 0;
  let sx = 0;
  let sy = 0;
  let sxx = 0;
  let sxy = 0;
  let syy = 0;

  for (let i = 0, j = ring.length - 1; i < ring.length; j = i, i += 1) {
    const [xj, yj] = ring[j];
    const [xi, yi] = ring[i];
    const cross = xj * yi - xi * yj;
    a += cross;
    sx += (xj + xi) * cross;
    sy += (yj + yi) * cross;
    sxx += (xj * xj + xj * xi + xi * xi) * cross;
    syy += (yj * yj + yj * yi + yi * yi) * cross;
    sxy += (xj * yi + 2 * xj * yj + 2 * xi * yi + xi * yj) * cross;
  }

  const sign = a < 0 ? -1 : 1;
  moments.a += (sign * a) / 2;
  moments.sx += (sign * sx) / 6;
  moments.sy += (sign * sy) / 6;
  moments.sxx += (sign * sxx) / 12;
  moments.syy += (sign * syy) / 12;
  moments.sxy += (sign * sxy) / 24;

  return moments;
};

const covarianceOf = (moments) => {
  if (!moments || !(moments.a > 0)) return null;

  const mx = moments.sx / moments.a;
  const my = moments.sy / moments.a;

  return {
    cxx: moments.sxx / moments.a - mx * mx,
    cxy: moments.sxy / moments.a - mx * my,
    cyy: moments.syy / moments.a - my * my,
  };
};

// The major axis, in degrees, folded into (-90, 90] so text never prints
// upside down.
export const axisAngleOfMoments = (moments) => {
  const c = covarianceOf(moments);
  if (!c) return 0;

  const angleRad = Math.atan2(2 * c.cxy, c.cxx - c.cyy) / 2;
  let degrees = angleRad * (180 / Math.PI);

  if (degrees > 90) degrees -= 180;
  if (degrees < -90) degrees += 180;

  return degrees;
};

// WHERE AN ANGLE STOPS MEANING ANYTHING, read off the map rather than picked.
// Every one of wwii-1935's 109 seat territories was measured (elongation, and
// the angle it produces) and the two groups separate cleanly here:
//
//   above — MOROCCO 3.4/-7°, ALBANIA 2.7/84°, TURKEY 2.7/0°, FRENCH EQUATORIAL
//           AFRICA 2.5/-76°, ITALY 1.4/21°, THE BRITISH ISLES 1.4/-80°: every
//           one of them the tilt you would draw by hand.
//   below — BELGIAN CONGO 1.10/85°, THE NETHERLANDS 1.05/-79°, EGYPT 1.11/68°,
//           BRAZIL 1.34/44°, SPAIN 1.06/-26°: not one defensible from the
//           shape, because a round country has no direction to find. The
//           readings are not merely uncertain — a perfectly round one resolves
//           to atan2(0, -epsilon), a hard 90° off a shape with no vertical in
//           it, which is how SPAIN first came to stand on end.
//
// A territory sitting near the line can cross it as its borders move and swap
// between flat and a shallow tilt. That is the honest behaviour: at 1.4 the two
// readings are about equally good, which is exactly why the line is here.
export const AXIS_ELONGATION_FLOOR = 1.4;

// HOW MUCH DIRECTION IS THERE, as the ratio of the fitted ellipse's axes. A
// square has none: its two eigenvalues are equal, and the angle then falls out
// of atan2(0, -epsilon) — which is 90°, a hard vertical read off a shape with
// no vertical in it. Any caller turning an angle into a drawn rotation has to
// know whether the angle means anything, and this is that number.
export const axisElongationOfMoments = (moments) => {
  const c = covarianceOf(moments);
  if (!c) return 1;

  const mean = (c.cxx + c.cyy) / 2;
  const spread = Math.sqrt(((c.cxx - c.cyy) / 2) ** 2 + c.cxy * c.cxy);
  const minor = mean - spread;
  if (!(minor > 0)) return Infinity;

  return Math.sqrt((mean + spread) / minor);
};

// The curved country labels below read this instead: they need the axis of the
// one ring they are about to thread glyphs along, and they walk that ring's
// points anyway. Left as it ships — the owner lane's accumulator above is the
// one that had to change, because it sums across many rings.
export const getPrincipalAxisAngle = (ring) => {
  if (!ring || ring.length < 3) return 0;

  let mx = 0;
  let my = 0;
  for (const point of ring) {
    mx += point[0];
    my += point[1];
  }
  mx /= ring.length;
  my /= ring.length;

  let cxx = 0;
  let cxy = 0;
  let cyy = 0;
  for (const point of ring) {
    const dx = point[0] - mx;
    const dy = point[1] - my;
    cxx += dx * dx;
    cxy += dx * dy;
    cyy += dy * dy;
  }

  const angleRad = Math.atan2(2 * cxy, cxx - cyy) / 2;
  let degrees = angleRad * (180 / Math.PI);

  if (degrees > 90) degrees -= 180;
  if (degrees < -90) degrees += 180;

  return degrees;
};
const tileToLngLat = (px, py, extent = 4096) => {
  const lng = (px / extent) * 360 - 180;
  const latRad = Math.atan(Math.sinh(Math.PI * (1 - (2 * py) / extent)));
  const lat = latRad * (180 / Math.PI);
  return [lng, lat];
};

const ringToLngLat = (ring, extent = 4096) =>
  ring.map(([px, py]) => tileToLngLat(px, py, extent));

// The inverse, and it exists because AN ANGLE IS ONLY MEANINGFUL IN THE SPACE
// IT IS DRAWN IN. Tile space is square Web Mercator with y pointing DOWN,
// which is also how MapLibre reads text-rotate (positive = clockwise), so the
// axis measured here can be handed straight to the layer — which is what the
// country lane below does with bestRingTile.
//
// Measure the same territory in raw lng/lat instead and it fails twice. y
// points UP there, so every tilt comes out MIRRORED: French West Africa runs
// west-northwest to east-southeast and its label drew rising eastward. And a
// degree of latitude is worth 1/cos(lat) tile units, so a northern country
// reads as flatter than it draws — 2x understated by 60°N.
export const lngLatToTile = ([lng, lat], extent = 4096) => {
  // Web Mercator has no north pole; past this latitude y runs to infinity.
  const clamped = Math.max(-85.051129, Math.min(85.051129, lat));
  const px = ((lng + 180) / 360) * extent;
  const py =
    (extent / 2) * (1 - Math.asinh(Math.tan((clamped * Math.PI) / 180)) / Math.PI);
  return [px, py];
};

const getPolylineLength = (points) => {
  let length = 0;

  for (let i = 1; i < points.length; i += 1) {
    const dx = points[i][0] - points[i - 1][0];
    const dy = points[i][1] - points[i - 1][1];
    length += Math.hypot(dx, dy);
  }

  return length;
};

const getTotalTurnDegrees = (points) => {
  let total = 0;

  for (let i = 1; i + 1 < points.length; i += 1) {
    const previous = points[i - 1];
    const current = points[i];
    const next = points[i + 1];

    const a1 = Math.atan2(current[1] - previous[1], current[0] - previous[0]);
    const a2 = Math.atan2(next[1] - current[1], next[0] - current[0]);
    let delta = a2 - a1;

    while (delta > Math.PI) delta -= Math.PI * 2;
    while (delta < -Math.PI) delta += Math.PI * 2;

    total += Math.abs(delta);
  }

  return total * (180 / Math.PI);
};

const getPointAlongPolyline = (points, distance) => {
  if (!points.length) return null;
  if (points.length === 1) {
    return { point: points[0], angle: 0 };
  }

  let travelled = 0;
  for (let i = 1; i < points.length; i += 1) {
    const start = points[i - 1];
    const end = points[i];
    const dx = end[0] - start[0];
    const dy = end[1] - start[1];
    const segmentLength = Math.hypot(dx, dy);
    if (segmentLength <= 0) continue;

    if (travelled + segmentLength >= distance) {
      const ratio = (distance - travelled) / segmentLength;
      return {
        point: [
          start[0] + dx * ratio,
          start[1] + dy * ratio,
        ],
        angle: Math.atan2(dy, dx) * (180 / Math.PI),
      };
    }

    travelled += segmentLength;
  }

  const tailStart = points[points.length - 2];
  const tailEnd = points[points.length - 1];
  return {
    point: tailEnd,
    angle: Math.atan2(
      tailEnd[1] - tailStart[1],
      tailEnd[0] - tailStart[0],
    ) * (180 / Math.PI),
  };
};

const getSliceIntervals = (ring, s0) => {
  const intersections = [];

  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const p1 = ring[j];
    const p2 = ring[i];
    const crossesSlice =
      (p1.s <= s0 && p2.s > s0) ||
      (p2.s <= s0 && p1.s > s0);

    if (!crossesSlice) continue;

    const factor = (s0 - p1.s) / (p2.s - p1.s);
    intersections.push(p1.t + factor * (p2.t - p1.t));
  }

  intersections.sort((a, b) => a - b);

  const intervals = [];
  for (let i = 0; i + 1 < intersections.length; i += 2) {
    const minT = intersections[i];
    const maxT = intersections[i + 1];
    const width = maxT - minT;

    if (width <= 1) continue;

    intervals.push({
      minT,
      maxT,
      midT: (minT + maxT) / 2,
      width,
    });
  }

  return intervals;
};

const chooseSeedInterval = (intervals) => {
  if (!intervals.length) return null;

  const centered = intervals.find(
    (interval) => interval.minT <= 0 && interval.maxT >= 0,
  );
  if (centered) return centered;

  return intervals.reduce((best, interval) =>
    interval.width > best.width ? interval : best
  );
};

const chooseFollowInterval = (intervals, targetT) => {
  if (!intervals.length) return null;

  let best = null;
  let bestScore = Infinity;

  for (const interval of intervals) {
    const continuity = Math.abs(interval.midT - targetT);
    const score = continuity - interval.width * 0.2;

    if (score < bestScore) {
      best = interval;
      bestScore = score;
    }
  }

  return best;
};

const smoothSamples = (samples, passes = 2) => {
  let current = samples;

  for (let pass = 0; pass < passes; pass += 1) {
    const source = current;
    current = source.map((sample, index) => {
      if (index === 0 || index === source.length - 1) return sample;

      return {
        ...sample,
        t:
          source[index - 1].t * 0.25 +
          source[index].t * 0.5 +
          source[index + 1].t * 0.25,
      };
    });
  }

  return current;
};

const buildCurvedLabelPath = (ring, name) => {
  if (!ring || ring.length < 3) return null;

  const { cx, cy } = getCentroid(ring);
  const angleRad = getPrincipalAxisAngle(ring) * (Math.PI / 180);
  const cos = Math.cos(angleRad);
  const sin = Math.sin(angleRad);

  const localRing = ring.map(([x, y]) => {
    const dx = x - cx;
    const dy = y - cy;

    return {
      s: dx * cos + dy * sin,
      t: -dx * sin + dy * cos,
    };
  });

  let minS = Infinity;
  let maxS = -Infinity;
  for (const point of localRing) {
    minS = Math.min(minS, point.s);
    maxS = Math.max(maxS, point.s);
  }

  const span = maxS - minS;
  if (span <= 1) return null;

  const padding = span * 0.12;
  const usableMinS = minS + padding;
  const usableMaxS = maxS - padding;
  const usableSpan = usableMaxS - usableMinS;
  if (usableSpan <= 1) return null;

  const sampleCount = clamp(Math.round(usableSpan / 24), 9, 19);
  const samples = [];

  for (let i = 0; i < sampleCount; i += 1) {
    const s = usableMinS + (usableSpan * i) / (sampleCount - 1);
    const intervals = getSliceIntervals(localRing, s);
    if (!intervals.length) continue;
    samples.push({ s, intervals });
  }

  if (samples.length < 4) return null;

  let centerIndex = 0;
  let centerDistance = Infinity;
  for (let i = 0; i < samples.length; i += 1) {
    const distance = Math.abs(samples[i].s);
    if (distance < centerDistance) {
      centerDistance = distance;
      centerIndex = i;
    }
  }

  const chosen = new Array(samples.length).fill(null);
  chosen[centerIndex] = chooseSeedInterval(samples[centerIndex].intervals);
  if (!chosen[centerIndex]) return null;

  for (let i = centerIndex + 1; i < samples.length; i += 1) {
    chosen[i] = chooseFollowInterval(samples[i].intervals, chosen[i - 1]?.midT ?? 0);
  }

  for (let i = centerIndex - 1; i >= 0; i -= 1) {
    chosen[i] = chooseFollowInterval(samples[i].intervals, chosen[i + 1]?.midT ?? 0);
  }

  const rawSamples = samples
    .map((sample, index) => {
      const interval = chosen[index];
      if (!interval) return null;

      return {
        s: sample.s,
        t: interval.midT,
        width: interval.width,
      };
    })
    .filter(Boolean);

  if (rawSamples.length < 4) return null;

  const smoothed = smoothSamples(rawSamples);
  let tilePath = smoothed.map(({ s, t }) => [
    cx + s * cos - t * sin,
    cy + s * sin + t * cos,
  ]);

  const pathLength = getPolylineLength(tilePath);
  const directLength = Math.hypot(
    tilePath[tilePath.length - 1][0] - tilePath[0][0],
    tilePath[tilePath.length - 1][1] - tilePath[0][1],
  );
  const turnDegrees = getTotalTurnDegrees(tilePath);
  const averageWidth =
    rawSamples.reduce((sum, sample) => sum + sample.width, 0) / rawSamples.length;
  const widthRatio = averageWidth / usableSpan;
  const compactNameLength = name.replace(/\s+/g, "").length;
  const minPathLength = Math.max(80, compactNameLength * 20);

  if (
    directLength <= 0 ||
    pathLength < minPathLength ||
    widthRatio > 0.22 ||
    (pathLength / directLength <= 1.04 && turnDegrees <= 55)
  ) {
    return null;
  }

  const overallAngle =
    Math.atan2(
      tilePath[tilePath.length - 1][1] - tilePath[0][1],
      tilePath[tilePath.length - 1][0] - tilePath[0][0],
    ) *
    (180 / Math.PI);

  if (overallAngle > 90 || overallAngle < -90) {
    tilePath = [...tilePath].reverse();
  }

  return {
    points: tilePath,
    length: pathLength,
  };
};

const buildCurvedLabelGlyphFeatures = (
  pathInfo,
  extent,
  name,
  areaScale,
  featureId,
) => {
  if (!pathInfo?.points?.length) return null;

  const glyphs = Array.from(name.toUpperCase());
  const totalUnits = glyphs.reduce(
    (sum, glyph) => sum + (glyph === " " ? 0.55 : 1),
    0,
  );
  if (totalUnits <= 0) return null;

  const pathPadding = pathInfo.length * 0.08;
  const usableLength = pathInfo.length - pathPadding * 2;
  if (usableLength <= 0) return null;

  const advance = usableLength / totalUnits;
  const sizeScale = clamp(advance / 52, 0.6, 0.92);
  const features = [];

  let cursorUnits = 0;
  let glyphIndex = 0;
  for (const glyph of glyphs) {
    const unitWidth = glyph === " " ? 0.55 : 1;
    const centerDistance = pathPadding + (cursorUnits + unitWidth / 2) * advance;
    cursorUnits += unitWidth;

    if (glyph === " ") continue;

    const sample = getPointAlongPolyline(pathInfo.points, centerDistance);
    if (!sample) continue;

    let rotation = sample.angle;
    if (rotation > 90) rotation -= 180;
    if (rotation < -90) rotation += 180;

    const [glyphLng, glyphLat] = tileToLngLat(sample.point[0], sample.point[1], extent);

    features.push({
      type: "Feature",
      id: `${featureId}-glyph-${glyphIndex}`,
      geometry: {
        type: "Point",
        coordinates: [glyphLng, glyphLat],
      },
      properties: {
        glyph,
        areaScale: areaScale * sizeScale,
        rotation,
        // Each glyph's own latitude — Nations.jsx uses this to correct globe
        // projection's text-size inflation at high latitude (see issue #6).
        lat: glyphLat,
      },
    });

    glyphIndex += 1;
  }

  return features.length ? features : null;
};

const getCountriesTileData = async () => {
  const pmtiles = getPmtilesArchive(PMTILES_ARCHIVES.countries);
  return pmtiles.getZxy(0, 0, 0);
};

const computeCountryLabelCacheKey = (buffer, archiveUrl) => {
  const bytes = new Uint8Array(buffer);
  let hash = 2166136261;

  for (let index = 0; index < bytes.length; index += 1) {
    hash ^= bytes[index];
    hash = Math.imul(hash, 16777619);
  }

  // Language in the key: labels are baked with translated names, so caches
  // must never leak across UI languages.
  return `${COUNTRY_LABELS_CACHE_KEY}-${bytes.byteLength}-${(hash >>> 0).toString(36)}-${encodeURIComponent(archiveUrl)}-${getStoredLanguage()}`;
};

const buildCountryLabelCollections = async (tileData, ownedCodes = null, leaderExtension = LEADER_EXTENSION_DEFAULT) => {
  if (!tileData?.data) {
    return EMPTY_COUNTRY_LABELS;
  }

  const tile = await decodeVectorTile(tileData.data);
  const layer = tile.layers.countries;
  if (!layer) {
    return EMPTY_COUNTRY_LABELS;
  }

  const extent = layer.extent || 4096;
  const registry = new Map();
  const filterByOwners = ownedCodes instanceof Set && ownedCodes.size > 0;

  for (let index = 0; index < layer.length; index += 1) {
    const feature = layer.feature(index);
    const props = feature.properties;
    const code = props?.GID_0 || props?.gid_0 || props?.ISO_A3 || props?.iso_a3 || "";
    // Skip countries that own no territory in this scenario, so nonexistent-era
    // nations don't float their modern names over unclaimed land.
    if (filterByOwners && !ownedCodes.has(code)) continue;
    // Map labels are drawn from these features, not the DOM — run the name
    // through the translator so country labels follow the UI language.
    const name = translateLabel(resolveCountryDisplayName(
      props?.Country || props?.NAME || props?.name || props?.COUNTRY,
      code,
    ));
    if (!name) continue;

    const geometry = feature.loadGeometry();
    let bestRingTile = null;
    let bestAreaTile = -1;

    for (const ring of geometry) {
      const ringPoints = ring.map((point) => [point.x, point.y]);
      const area = calculateArea(ringPoints);
      if (area > bestAreaTile) {
        bestAreaTile = area;
        bestRingTile = ringPoints;
      }
    }

    if (!bestRingTile) continue;

    const bestRingLngLat = ringToLngLat(bestRingTile, extent);
    const areaLngLat = calculateArea(bestRingLngLat);

    const existing = registry.get(name);
    if (existing && areaLngLat <= existing.areaLngLat) continue;

    const { cx, cy } = getCentroid(bestRingTile);
    const [lng, lat] = tileToLngLat(cx, cy, extent);
    const areaScale = Math.sqrt(areaLngLat) * 17500;
    const rotation = getPrincipalAxisAngle(bestRingTile);
    const curvedLabelPath = buildCurvedLabelPath(bestRingTile, name);
    const curvedGlyphFeatures = buildCurvedLabelGlyphFeatures(
      curvedLabelPath,
      extent,
      name,
      areaScale,
      index,
    );

    // TOO SMALL TO HOLD ITS OWN NAME → the label goes outside on a leader line.
    // Only ever the point branch: a shape this small never passes the curved
    // path's span gate, so nothing here can steal a label from that path.
    const needsLeader = !curvedGlyphFeatures && areaScale < LEADER_AREA_SCALE_FLOOR;
    const leader = needsLeader
      ? buildLeaderPlacement(bestRingLngLat, [lng, lat], rotation, leaderExtension)
      : null;

    registry.set(name, {
      areaLngLat,
      curvedGlyphFeatures,
      pointFeature: curvedGlyphFeatures
        ? null
        : {
            type: "Feature",
            id: `${index}-point`,
            geometry: {
              type: "Point",
              coordinates: leader ? leader.anchor : [lng, lat],
            },
            properties: {
              // Out on a line the label is no longer describing an area it sits
              // in, so it stops being sized by one and draws to be read.
              areaScale: leader ? LEADER_LABEL_AREA_SCALE : areaScale,
              name: name.toUpperCase(),
              // A leader label is horizontal. Rotating it to the principal axis
              // of a shape it is no longer standing on reads as a mistake.
              rotation: leader ? 0 : rotation,
              leader: leader ? 1 : 0,
              // See the glyph-feature branch above — same globe text-size fix.
              lat: leader ? leader.anchor[1] : lat,
            },
          },
      // The line itself: from the shape's own edge out to the label. Starting
      // at the edge rather than the centroid keeps the stroke off a 2px country
      // instead of covering it.
      leaderFeature: leader
        ? {
            type: "Feature",
            id: `${index}-leader`,
            geometry: { type: "LineString", coordinates: [leader.edge, leader.anchor] },
            properties: { name: name.toUpperCase() },
          }
        : null,
    });
  }

  const pointFeatures = [];
  const curvedFeatures = [];
  const leaderFeatures = [];

  for (const entry of registry.values()) {
    if (entry.curvedGlyphFeatures) {
      curvedFeatures.push(...entry.curvedGlyphFeatures);
    } else if (entry.pointFeature) {
      pointFeatures.push(entry.pointFeature);
    }
    if (entry.leaderFeature) leaderFeatures.push(entry.leaderFeature);
  }

  return {
    curvedLabelData: {
      type: "FeatureCollection",
      features: curvedFeatures,
    },
    pointLabelData: {
      type: "FeatureCollection",
      features: pointFeatures,
    },
    leaderLineData: {
      type: "FeatureCollection",
      features: leaderFeatures,
    },
  };
};

const isCountryLabelPayload = (value) =>
  value &&
  value.pointLabelData?.type === "FeatureCollection" &&
  Array.isArray(value.pointLabelData.features) &&
  value.curvedLabelData?.type === "FeatureCollection" &&
  Array.isArray(value.curvedLabelData.features) &&
  // v4. A cached payload without it is pre-leader-line and must be rebuilt.
  value.leaderLineData?.type === "FeatureCollection" &&
  Array.isArray(value.leaderLineData.features);

// leaderExtension is baked into the geometry rather than applied at draw time:
// the anchor needs the country's own ring to know where its edge is, and a
// MapLibre expression cannot move a point. So the setting rides the CACHE KEY —
// change it and the collections rebuild, exactly like a change of owner set.
export const loadCountryLabelCollections = async ({
  force = false,
  ownedCodes = null,
  leaderExtension = LEADER_EXTENSION_DEFAULT,
} = {}) => {
  const tileData = await getCountriesTileData();
  const baseKey = tileData?.data
    ? computeCountryLabelCacheKey(tileData.data, PMTILES_ARCHIVES.countries)
    : COUNTRY_LABELS_CACHE_KEY;

  // A distinct owner set (scenario-specific label filtering) caches separately.
  let ownersSuffix = "";
  if (ownedCodes instanceof Set && ownedCodes.size > 0) {
    const joined = [...ownedCodes].sort().join(",");
    let hash = 2166136261;
    for (let i = 0; i < joined.length; i += 1) {
      hash ^= joined.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    ownersSuffix = `-own${ownedCodes.size}-${(hash >>> 0).toString(36)}`;
  }
  const extension = Number.isFinite(leaderExtension) && leaderExtension >= 0
    ? Number(leaderExtension)
    : LEADER_EXTENSION_DEFAULT;
  const extensionSuffix = extension === LEADER_EXTENSION_DEFAULT ? "" : `-lx${extension}`;
  const cacheKey = `${baseKey}${ownersSuffix}${extensionSuffix}`;

  if (!force && countryLabelsValue && countryLabelsValueKey === cacheKey) {
    return countryLabelsValue;
  }

  if (
    !force &&
    countryLabelsPromise &&
    countryLabelsPromiseKey === cacheKey
  ) {
    return countryLabelsPromise;
  }

  const request = (async () => {
    if (!force) {
      try {
        const cached = await readRuntimeJson(cacheKey);
        if (isCountryLabelPayload(cached)) {
          countryLabelsValue = cached;
          countryLabelsValueKey = cacheKey;
          return countryLabelsValue;
        }
      } catch {
        // Cache miss falls through to live generation.
      }
    }

    const built = await buildCountryLabelCollections(tileData, ownedCodes, extension);

    // An empty result is almost always a degraded z0 read (a missing or garbled
    // tile resolves to undefined rather than throwing), not a genuinely
    // label-less world. Persisting it is unrecoverable: the payload validator
    // accepts an empty FeatureCollection, so every later boot serves the empty
    // cache and the country labels stay gone across reloads. Serve it once,
    // memoize nothing, and let the next call rebuild.
    const isEmpty =
      !built?.pointLabelData?.features?.length && !built?.curvedLabelData?.features?.length;
    if (isEmpty) {
      console.warn("Country labels came back empty — not caching, will rebuild.");
      return built;
    }

    countryLabelsValue = built;
    countryLabelsValueKey = cacheKey;

    try {
      await writeRuntimeJson(cacheKey, built);
    } catch {
      // Runtime cache persistence is best-effort only.
    }

    return countryLabelsValue;
  })()
    .catch((error) => {
      console.error("Failed to build country label collections:", error);
      countryLabelsValue = EMPTY_COUNTRY_LABELS;
      countryLabelsValueKey = cacheKey;
      return countryLabelsValue;
    })
    .finally(() => {
      countryLabelsPromise = null;
      countryLabelsPromiseKey = null;
    });

  countryLabelsPromise = request;
  countryLabelsPromiseKey = cacheKey;
  return request;
};

export const warmCountryLabelCollections = async (options = {}) => {
  const collections = await loadCountryLabelCollections(options);
  return {
    kind: "json",
    size: JSON.stringify(collections).length,
    url: countryLabelsValueKey || COUNTRY_LABELS_CACHE_KEY,
  };
};

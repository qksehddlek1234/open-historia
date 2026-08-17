/*! Open Historia — portions (custom-regions tier-2 rendering) © 2026 Nicholas Krol, MIT (see src/Editor/LICENSE). */
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Layer, Source, useMap } from "react-map-gl/maplibre";
import { hasRegionClickInterceptor, onRegionSelected, dismissRegionPopup } from "../Selection/Regions";
import { onUnitSelected, dismissUnitPopup } from "../Selection/Units";
import { onFeatureSelected, dismissFeaturePopup } from "../Selection/Features";
import {
  getInteractionMode,
  clearInteractionMode,
  deployUnit,
  moveUnitTo,
  attackWith,
  attackFeature,
} from "./unitsController.js";
import {
  JSON_URLS,
  PMTILES_PROTOCOL_URLS,
  ensurePmtilesProtocol,
  getNationColors,
  readJson,
  resolveCountryDisplayName,
} from "../../runtime/assets.js";
import { resolveRegionName } from "../../runtime/regionNameFixes.js";
import { toCountryName } from "../../runtime/ownerNames.js";
import { loadSeaRegionFeatures } from "../../runtime/seaRegions.js";
import {
  addAxisMoments,
  addAxisPolygon,
  axisAngleOfMoments,
  axisElongationOfMoments,
  AXIS_ELONGATION_FLOOR,
  createAxisMoments,
  lngLatToTile,
  loadCountryLabelCollections,
} from "../../runtime/countryLabels.js";
// Pure geometry, no DOM. The owner lane promotes below the SAME floor the stock
// lane uses and places the label the same way, so it takes those constants from
// here rather than restating them — two floors would drift apart the first time
// either was tuned.
import {
  LABEL_LETTER_SPACING,
  LEADER_AREA_SCALE_FLOOR,
  LEADER_EXTENSION_DEFAULT,
  LEADER_LABEL_AREA_SCALE,
  NAME_FIT_EM,
  buildLeaderPlacement,
  fitNameToTerritory,
  nameWidthEm,
  widestLineEm,
} from "../../runtime/labelLeaders.js";
// The owner lane's own curved labels — see labelCurves.js for why the stock
// lane's builder behind `!customFlag` could not simply be switched on.
import {
  buildClusterCurvePath,
  layoutGlyphsAlongPath,
  tileToLngLat,
} from "../../runtime/labelCurves.js";
import { translateLabel } from "../../runtime/translator.js";
import {
  MAP_SETTING_KEYS, borderFadeStops, useDisplayScale, useMapRenderValue, useMapSetting,
} from "../../runtime/mapSettings.js";
import { useWorldState } from "./useWorldState.js";

ensurePmtilesProtocol();
const EMPTY_FEATURE_COLLECTION = { type: "FeatureCollection", features: [] };
// Stable [] so the pre-load render does not churn the regionData memo.
const EMPTY_SEA_FEATURES = [];

// Globe projection renders a label's own high-latitude countries oversized
// relative to their outline — confirmed (issue #6) to be text-only (fills
// stay correctly scaled) and tied to each FEATURE's own latitude, not the
// camera's. cos(lat) undoes it; only applied in globe mode; flat/mercator
// keeps the exact same sizing it always has (this factor is 1 at lat 0 and
// visibly wrong in mercator at high latitude, so never enable it there).
const GLOBE_LAT_CORRECTION = ["cos", ["*", ["coalesce", ["get", "lat"], 0], Math.PI / 180]];

const buildCountryTextSize = (multiplier = 1, correctForGlobe = false) => {
  const scale = correctForGlobe ? ["*", multiplier, GLOBE_LAT_CORRECTION] : multiplier;
  const atZoom = (power) => [
    "min",
    254,
    ["*", scale, ["*", ["get", "areaScale"], ["^", 2, power]]],
  ];

  return [
    "interpolate", ["exponential", 2], ["zoom"],
    0, atZoom(-16),
    4, atZoom(-12),
    8, atZoom(-8),
    12, atZoom(-4),
    16, atZoom(0),
    20, atZoom(4),
    24, atZoom(8),
  ];
};

// The second rank of label — an owner's outlying clusters (countryLabels.js
// explains what tier is). Not a number invented for this: 0.6 is the measured
// floor of the curved-label size scale in countryLabels.js, the smallest this
// codebase already treats as a legible country label at map scale. A repeat of a
// name the map carries elsewhere is exactly what belongs at that floor.
const MINOR_LABEL_SCALE = 0.6;
// LABEL_LETTER_SPACING moved to runtime/labelLeaders.js — fitNameToTerritory
// has to know the tracking to work out how wide a name draws, and one dial
// declared in two files drifts the first time either is tuned.
// Features with no tier at all are the STOCK label set, which has one rank and
// must keep drawing at full weight — so absent reads as 0, never as minor.
const LABEL_TIER = ["coalesce", ["get", "tier"], 0];

const buildFallbackColorExpression = () => ([
  "rgb",
  ["+", 64, ["*", ["index-of", ["slice", ["get", "GID_0"], 0, 1], "ABCDEFGHIJKLMNOPQRSTUVWXYZ"], 5]],
  ["+", 64, ["*", ["index-of", ["slice", ["get", "GID_0"], 2, 3], "ABCDEFGHIJKLMNOPQRSTUVWXYZ"], 5]],
  ["+", 64, ["*", ["index-of", ["slice", ["get", "GID_0"], 1, 2], "ABCDEFGHIJKLMNOPQRSTUVWXYZ"], 5]],
]);

// Procedural colour for an owner with no entry in the palette. Takes the owner —
// a country NAME now ("Russia", "Roman Empire"), not a GID_0 code.
//
// Stripping to A-Z first is what makes a name hash usefully. The letters are read
// positionally, so "Côte d'Ivoire" would otherwise hash on 'C', 'Ô', 'T' — and 'Ô'
// is not in the alphabet, so indexOf returns -1 and the channel clamps to 0. Every
// accented or two-word name would collapse toward the same dark corner of the
// space. Stripping gives "COTEDIVOIRE" and a colour that actually differs from its
// neighbours'.
//
// NOTE this is the JS twin of buildFallbackColorExpression above, which reads
// GID_0 off the stock tiles and must keep hashing the CODE — tile properties are
// baked GADM and never become names.
const fallbackRgbFromOwner = (owner = "") => {
  const normalized = String(owner ?? "").toUpperCase().replace(/[^A-Z]/g, "");
  if (normalized.length < 3) {
    return [96, 96, 96];
  }

  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const a = Math.max(0, alphabet.indexOf(normalized[0]));
  const b = Math.max(0, alphabet.indexOf(normalized[1]));
  const c = Math.max(0, alphabet.indexOf(normalized[2]));
  return [64 + a * 5, 64 + c * 5, 64 + b * 5];
};

const fallbackColorFromOwner = (owner = "") => {
  const [r, g, b] = fallbackRgbFromOwner(owner);
  return `rgb(${r}, ${g}, ${b})`;
};

// "#c0507a" / "#c07" / "rgb(192, 80, 122)" -> [r,g,b]; null when unparseable.
// world.polityOverrides stores colours as CSS strings while colors.json stores
// RGB triplets, so the two namespaces need a bridge before they can be merged.
const parseColorToRgb = (value) => {
  const raw = String(value ?? "").trim();
  if (!raw) return null;
  const hex = raw.replace(/^#/, "");
  if (/^[0-9a-f]{6}$/i.test(hex)) {
    const n = parseInt(hex, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  if (/^[0-9a-f]{3}$/i.test(hex)) {
    return [
      parseInt(`${hex[0]}${hex[0]}`, 16),
      parseInt(`${hex[1]}${hex[1]}`, 16),
      parseInt(`${hex[2]}${hex[2]}`, 16),
    ];
  }
  const match = /^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i.exec(raw);
  if (!match) return null;
  return [Number(match[1]), Number(match[2]), Number(match[3])].map((c) => Math.max(0, Math.min(255, c)));
};

// Palettes are owner -> [r,g,b]. Re-reading colors.json hands back a fresh object
// every time; swapping identity for identical contents would rebuild every
// MapLibre match expression on the map, so compare contents before accepting it.
const shallowEqualColors = (a, b) => {
  if (a === b) return true;
  if (!a || !b) return false;
  const keysA = Object.keys(a);
  if (keysA.length !== Object.keys(b).length) return false;
  for (const key of keysA) {
    const left = a[key];
    const right = b[key];
    if (left === right) continue;
    if (!Array.isArray(left) || !Array.isArray(right) || left.length !== right.length) return false;
    for (let i = 0; i < left.length; i += 1) {
      if (left[i] !== right[i]) return false;
    }
  }
  return true;
};

// Case/diacritic/punctuation-folded owner key, so "Côte d'Ivoire", "cote divoire"
// and "COTE D'IVOIRE" all reach the same palette entry.
const ownerFoldKey = (value) =>
  String(value ?? "")
    .normalize("NFD")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");

// ---- Disputed-region stripes ------------------------------------------------
// A region whose `claimants` list names the countries contesting it renders
// striped in their colors (current administrator first). The stripe tile's
// image id encodes the rgb list itself ("oh-stripes-r_g_b-r_g_b"), so the
// styleimagemissing handler can rebuild any tile the style asks for — including
// after the globe/mercator toggle remounts the map and its images are gone.
const STRIPE_PREFIX = "oh-stripes-";
const STRIPE_BAND_PX = 8;

const stripeImageId = (rgbList) => STRIPE_PREFIX + rgbList.map((rgb) => rgb.join("_")).join("-");

const parseStripeImageId = (id) => {
  if (typeof id !== "string" || !id.startsWith(STRIPE_PREFIX)) return null;
  const colors = id
    .slice(STRIPE_PREFIX.length)
    .split("-")
    .map((part) => part.split("_").map(Number));
  const valid = colors.length >= 2 &&
    colors.every((rgb) => rgb.length === 3 && rgb.every((n) => Number.isFinite(n) && n >= 0 && n <= 255));
  return valid ? colors : null;
};

// Diagonal stripe tile as raw RGBA: band = (x+y) mod period, which tiles
// seamlessly in both directions.
const buildStripeImage = (rgbList) => {
  const size = rgbList.length * STRIPE_BAND_PX;
  const data = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const rgb = rgbList[Math.floor(((x + y) % size) / STRIPE_BAND_PX)];
      const p = (y * size + x) * 4;
      data[p] = rgb[0];
      data[p + 1] = rgb[1];
      data[p + 2] = rgb[2];
      data[p + 3] = 255;
    }
  }
  return { width: size, height: size, data };
};

// Neutral tone for unowned custom regions (land with no owner code).
const NEUTRAL_LAND_COLOR = "rgb(88, 98, 110)";
// Constant GL expression — the colour data is baked into each feature's
// _fillColor property by enrichedCustomRegionData above.
const CUSTOM_FILL_COLOR = ["get", "_fillColor"];

// GADM region ids contain a dot ("DEU.2_1"); author-drawn regions ("reg_...")
// don't. On custom maps, GADM regions crossfade between two sources: the seed
// GeoJSON when zoomed OUT (the stock tiles are too simplified out there and
// show sliver gaps) and the stock vector tiles when zoomed IN (the z5 seed is
// too coarse up close). Author-drawn geometry renders from the GeoJSON at every
// zoom, on top — the tiles don't know those shapes.
const CUSTOM_GEOMETRY_FILTER = ["==", ["index-of", ".", ["get", "id"]], -1];
const GADM_GEOMETRY_FILTER = [">=", ["index-of", ".", ["get", "id"]], 0];
// A feature whose geometry lives ONLY in the GeoJSON: author-drawn ("reg_...", no
// dot) OR a GADM region the editor reshaped (dotted id, but `edited`). Both must
// render from the GeoJSON at every zoom AND be kept out of the stock tiles, whose
// geometry is the ORIGINAL shape — painting both stacks two 0.72 fills and darkens
// the reshaped area. A plain unedited GADM region carries no `edited`, so
// ["==", ["get","edited"], true] is false for it and these fall back exactly to the
// dot test — stock and author-only maps render identically to before.
// `tiled: false` is the build saying countries.pmtiles has no key for this
// region — a level-2 id ("ITA.6.5_1") or a HASC one ("DEU.DE71"), neither of
// which is a GID_1. The dot test above cannot tell those from a level-1 key, so
// they were routed to the tiles and the tiles could not paint them: colour
// dropped out above z6.5 across ~1,450 regions on every board. They belong with
// the hand-drawn shapes, which the GeoJSON draws at every zoom.
const NOT_IN_TILES = ["==", ["get", "tiled"], false];
const AUTHORED_GEOMETRY_FILTER = ["any", CUSTOM_GEOMETRY_FILTER, ["==", ["get", "edited"], true], NOT_IN_TILES];
const STOCK_GEOMETRY_FILTER = ["all", GADM_GEOMETRY_FILTER, ["!=", ["get", "edited"], true], ["!", NOT_IN_TILES]];
// Crossfade bands. Detail now steps UP twice on the way in, and each step is a
// crossfade so no border ever pops: the grid-snapped tier (coarseGeometry.js) holds
// world view, the seed geometry takes over through the middle, and the stock vector
// tiles take the close range. Seed geometry was extracted at tile-zoom 5, so it hands
// off to the tiles just past that.
const FAR_FILL_FADE = ["interpolate", ["linear"], ["zoom"], 5.5, 0.72, 6.5, 0];
const TILE_FILL_FADE = ["interpolate", ["linear"], ["zoom"], 5.5, 0, 6.5, 0.72];

// ---- Owner labels for custom maps -----------------------------------------
// The stock label pipeline labels modern countries from countries.pmtiles, which
// is wrong on scenario maps (it printed "Russia"/"Ukraine" over the Soviet Union
// and nothing said "Soviet Union"). For custom maps we build labels per OWNER:
// each owner's regions are clustered by proximity, and every sufficiently large
// cluster gets the owner's era name — so the USSR reads as one "Soviet Union",
// while a global empire is named once per landmass, atlas-style.

const largestRingOf = (geometry) => {
  if (!geometry) return null;
  const polys = geometry.type === "Polygon"
    ? [geometry.coordinates]
    : geometry.type === "MultiPolygon" ? geometry.coordinates : [];
  let best = null;
  let bestArea = -1;
  for (const poly of polys) {
    const ring = poly?.[0];
    if (!ring || ring.length < 3) continue;
    let area = 0;
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      area += (ring[j][0] + ring[i][0]) * (ring[j][1] - ring[i][1]);
    }
    area = Math.abs(area / 2);
    if (area > bestArea) {
      bestArea = area;
      best = ring;
    }
  }
  return best ? { ring: best, area: bestArea } : null;
};

// The direction of one region's outline, projected into the space it draws in
// (lngLatToTile explains why that is not optional). Returned as sums so a
// territory's regions can be added together later without keeping any points.
const ringAxisMoments = (ring) => {
  const moments = createAxisMoments();
  addAxisPolygon(moments, ring.map((point) => lngLatToTile(point)));
  return moments;
};

// One region's extent in lng/lat, kept as [minX, minY, maxX, maxY] so clusters
// can union it while they fold. Used only by the leader-line placement.
const ringBbox = (ring) => {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const [x, y] of ring) {
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
  }
  return [minX, minY, maxX, maxY];
};

const unionBbox = (a, b) => [
  Math.min(a[0], b[0]), Math.min(a[1], b[1]),
  Math.max(a[2], b[2]), Math.max(a[3], b[3]),
];

// The four corners, in the shape buildLeaderPlacement wants — it projects every
// point it is given onto the outward normal and keeps the furthest, so a corner
// list answers "how far does this territory reach that way" exactly.
const bboxCorners = ([minX, minY, maxX, maxY]) => [
  [minX, minY], [maxX, minY], [maxX, maxY], [minX, maxY],
];

const ringCentroidLngLat = (ring) => {
  let x = 0;
  let y = 0;
  let a = 0;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const f = ring[i][0] * ring[j][1] - ring[j][0] * ring[i][1];
    a += f;
    x += (ring[i][0] + ring[j][0]) * f;
    y += (ring[i][1] + ring[j][1]) * f;
  }
  const s = a * 3 || 1;
  return [x / s, y / s];
};

// Clusters are primarily CONTIGUOUS territory (region adjacency, below); the
// centroid join only mops up islands near their mainland and hairline adjacency
// misses. Keeping it small is what gives a colony or exclave its own label —
// at the old 28° France's metropole merged with its African empire across the
// Mediterranean and only the empire got named.
const CLUSTER_JOIN_DEGREES = 10; // centroids closer than this merge into one label cluster
const MIN_CLUSTER_AREA = 1.5; // in lng/lat degrees^2 — skips tiny extra islands

// Which regions physically touch, from shared border vertices. The seed
// simplifies each region on its own, so mid-border vertices don't always match
// between neighbours — but junction corners (tripoints) survive any
// simplification, and most border runs still share long identical stretches.
// Hashing EVERY vertex on a ~11m grid (1e-4°) catches both; the centroid
// mop-up in the label builder heals whatever this still misses. Owner-agnostic
// (geometry only) so it can be memoized per world and reused across ownership
// changes.
const buildRegionAdjacency = (regionsFC) => {
  const features = regionsFC?.features ?? [];
  const firstSeen = new Map(); // packed vertex -> first feature index
  const neighbors = features.map(() => null);
  const link = (a, b) => {
    (neighbors[a] ??= new Set()).add(b);
    (neighbors[b] ??= new Set()).add(a);
  };
  for (let index = 0; index < features.length; index += 1) {
    const geometry = features[index]?.geometry;
    const polys = geometry?.type === "Polygon"
      ? [geometry.coordinates]
      : geometry?.type === "MultiPolygon" ? geometry.coordinates : [];
    for (const poly of polys) {
      for (const ring of poly ?? []) {
        if (!ring) continue;
        for (let v = 0; v < ring.length; v += 1) {
          const pt = ring[v];
          // 1e-4° grid, packed into one number (fits 2^53).
          const key = Math.round((pt[0] + 180) * 1e4) * 4194304 + Math.round((pt[1] + 90) * 1e4);
          const seen = firstSeen.get(key);
          if (seen === undefined) firstSeen.set(key, index);
          else if (seen !== index) link(seen, index);
        }
      }
    }
  }
  return neighbors;
};

// Merge same-owner clusters until stable — the greedy pass alone under-merges
// long landmass chains (Siberia), which printed the same name a dozen times.
const mergeOwnerClusters = (clusters, joinDeg) => {
  let merged = true;
  while (merged) {
    merged = false;
    outer: for (let i = 0; i < clusters.length; i += 1) {
      for (let j = i + 1; j < clusters.length; j += 1) {
        const a = clusters[i];
        const b = clusters[j];
        if (Math.hypot(a.cx - b.cx, a.cy - b.cy) <= joinDeg) {
          const total = a.area + b.area;
          a.cx = (a.cx * a.area + b.cx * b.area) / total;
          a.cy = (a.cy * a.area + b.cy * b.area) / total;
          a.area = total;
          // The axis travels with the merge, or an island joining its mainland
          // would silently drop out of the angle the label is drawn at. The
          // extent travels for the same reason: a leader line measured from
          // half a territory starts inside the other half.
          if (a.axis && b.axis) addAxisMoments(a.axis, b.axis);
          if (a.bbox && b.bbox) a.bbox = unionBbox(a.bbox, b.bbox);
          if (a.members && b.members) a.members.push(...b.members);
          clusters.splice(j, 1);
          merged = true;
          break outer;
        }
      }
    }
  }
  return clusters;
};

// GADM assigns disputed / undetermined boundary areas the codes Z01-Z09 (the
// slivers around India — Kashmir, Aksai Chin, Arunachal Pradesh). The base map
// carries each as its own polity named with the bare code, which surfaced on the
// map as "Z01" labels; show "Disputed (<claimant>)" instead, keyed to the main
// country that administers/claims each (per server/country-names.json).
const DISPUTED_TERRITORY_CLAIMANT = {
  Z01: "India", Z02: "China", Z03: "China", Z04: "India", Z05: "India",
  Z06: "Pakistan", Z07: "India", Z08: "China", Z09: "India",
};

// A CURVED LABEL FOR A SEAT WHOSE NAME WILL NOT FIT FLAT — or null, in which
// case the caller falls through to the flat label and its fit cap.
//
// Sizing. The flat label draws at `ownScale` (capped by fitNameToTerritory to
// what fits across the territory). Along a curve there is more room — the path
// is the shape's whole length, not its width — so the glyphs can be larger
// than the capped flat label and still stay inside. They are sized to fill the
// path's usable length, clamped to [floor, ownScale]: never bigger than the
// country's own weight, never smaller than a country label may go (the same
// LEADER_AREA_SCALE_FLOOR the cap stops at). If even the floor is too big for
// the path, there is no curve — the leader line or the flat cap answers.
//
// The path is traced in tile space (where the axis is measured — see
// lngLatToTile in countryLabels.js) and the glyph positions come back to
// lng/lat for the source. `extent` only has to match between the two calls.
const CURVE_TILE_EXTENT = 4096;
// One em of a name at areaScale A occupies A × 2^(z−16) px at zoom z; a tile
// unit of a 4096-extent world tile is 2^z × 512 / 4096 = 2^(z−3) px. Zoom
// cancels: an em at areaScale A is A / 8192 tile units.
const TILE_UNITS_PER_EM_PER_SCALE = 1 / 8192;
const buildOwnerCurve = (cluster, allFeatures, name, ownScale, tilt, elongation) => {
  if (!cluster?.members?.length) return null;
  // Does the flat label fit? Then it stays flat — same reading the cap makes.
  const flatFits = widestLineEm(name) <= NAME_FIT_EM * Math.sqrt(Math.max(1, tilt ? elongation : 1));
  if (flatFits) return null;

  const rings = [];
  for (const index of cluster.members) {
    const best = largestRingOf(allFeatures[index]?.geometry);
    if (best?.ring) rings.push(best.ring.map((point) => lngLatToTile(point, CURVE_TILE_EXTENT)));
  }
  if (!rings.length) return null;
  const centroid = lngLatToTile([cluster.cx, cluster.cy], CURVE_TILE_EXTENT);
  const axisDeg = axisAngleOfMoments(cluster.axis);
  const glyphCount = Array.from(String(name)).filter((c) => c !== " ").length;

  const path = buildClusterCurvePath(rings, centroid, axisDeg, nameWidthEm(name), {
    needed: true,
    glyphCount,
    // The path must hold the whole name at no less than the floor's size.
    minPathPerEm: LEADER_AREA_SCALE_FLOOR * TILE_UNITS_PER_EM_PER_SCALE,
  });
  if (!path) return null;

  const laid = layoutGlyphsAlongPath(path, name);
  if (!laid) return null;

  // Size to the path: the areaScale that puts exactly one em in laid.perEm
  // tile units, clamped as described above.
  const fillScale = laid.perEm / TILE_UNITS_PER_EM_PER_SCALE;
  const areaScale = Math.max(LEADER_AREA_SCALE_FLOOR, Math.min(ownScale, fillScale));

  return {
    areaScale,
    glyphs: laid.glyphs.map((g, index) => ({
      index,
      glyph: g.glyph,
      rotation: g.rotation,
      lngLat: tileToLngLat(g.position, CURVE_TILE_EXTENT),
    })),
  };
};

const buildOwnerLabelCollection = (regionsFC, overrides, polityOverrides, nameResolver, adjacency = null, leaderExtension = LEADER_EXTENSION_DEFAULT) => {
  const allFeatures = regionsFC?.features ?? [];
  const countryNameByCode = new Map(); // gid0 -> modern country name (fallback labels)
  const ownerByIndex = new Array(allFeatures.length).fill("");
  const entryByIndex = new Array(allFeatures.length).fill(null);

  for (let index = 0; index < allFeatures.length; index += 1) {
    const props = allFeatures[index].properties || {};
    if (props.gid0 && props.country && !countryNameByCode.has(props.gid0)) {
      countryNameByCode.set(props.gid0, props.country);
    }
    const rawOwner = overrides?.[props.id] ?? props.owner;
    // Captured-region override stores the AI's owner CODE ("ESP"); the seed stores the NAME
    // ("Spain"). Canonicalize so both share one cluster + label instead of the code splitting
    // off as a phantom new country.
    const owner = toCountryName(rawOwner);
    if (!owner) continue;
    const best = largestRingOf(allFeatures[index].geometry);
    if (!best || best.area <= 0) continue;
    ownerByIndex[index] = owner;
    entryByIndex[index] = {
      c: ringCentroidLngLat(best.ring),
      area: best.area,
      moments: ringAxisMoments(best.ring),
      // How far the territory reaches, for the leader-line placement below. A
      // bounding box rather than the rings themselves because the cluster is a
      // FOLD: by the time the direction is known the rings are long gone, and
      // four corners union in a line where a ring list would have to be carried
      // through the whole union-find. It reads slightly LARGE for a shape that
      // is not a rectangle, which is the safe direction — a label that starts a
      // little far out is still legible; one that starts short sits on top of
      // the country it is naming.
      bbox: ringBbox(best.ring),
    };
  }

  // Union-find over same-owner ADJACENT regions: each root is one contiguous
  // territory. Contiguity, not distance, is what separates a colony from its
  // metropole: France's mainland and French West Africa sit close enough that
  // distance clustering merged them into one label across the Mediterranean,
  // while a touching chain like Siberia must stay a single label.
  const parent = new Int32Array(allFeatures.length);
  for (let i = 0; i < parent.length; i += 1) parent[i] = i;
  const find = (i) => {
    let root = i;
    while (parent[root] !== root) root = parent[root];
    while (parent[i] !== root) {
      const next = parent[i];
      parent[i] = root;
      i = next;
    }
    return root;
  };
  if (adjacency) {
    for (let i = 0; i < allFeatures.length; i += 1) {
      if (!ownerByIndex[i] || !adjacency[i]) continue;
      for (const j of adjacency[i]) {
        if (j <= i || ownerByIndex[j] !== ownerByIndex[i]) continue;
        const ri = find(i);
        const rj = find(j);
        if (ri !== rj) parent[rj] = ri;
      }
    }
  }

  // Fold each region into its territory's cluster (area-weighted centroid).
  const perOwner = new Map(); // owner -> Map(root -> cluster)
  for (let index = 0; index < allFeatures.length; index += 1) {
    const owner = ownerByIndex[index];
    const entry = entryByIndex[index];
    if (!owner || !entry) continue;
    let roots = perOwner.get(owner);
    if (!roots) {
      roots = new Map();
      perOwner.set(owner, roots);
    }
    const root = find(index);
    const cluster = roots.get(root);
    if (cluster) {
      const total = cluster.area + entry.area;
      cluster.cx = (cluster.cx * cluster.area + entry.c[0] * entry.area) / total;
      cluster.cy = (cluster.cy * cluster.area + entry.c[1] * entry.area) / total;
      cluster.area = total;
      // The label's ANGLE rides along, accumulated (see the rotation note
      // below). A running centroid cannot say which way a territory lies.
      addAxisMoments(cluster.axis, entry.moments);
      cluster.bbox = unionBbox(cluster.bbox, entry.bbox);
      cluster.members.push(index);
    } else {
      roots.set(root, {
        cx: entry.c[0],
        cy: entry.c[1],
        area: entry.area,
        axis: entry.moments,
        bbox: entry.bbox,
        // WHICH REGIONS, not their rings. The curved lane below needs the
        // cluster's outline to trace a centreline through it, and the bbox
        // note above is right that carrying rings through the fold is a lot
        // of vertices for something almost no cluster uses. Indices are four
        // bytes each; the rings are read back from allFeatures only for the
        // handful of seats whose flat label will not fit.
        members: [index],
      });
    }
  }

  const features = [];
  const leaderFeatures = [];
  let id = 0;
  for (const [owner, roots] of perOwner) {
    // Islands still join their nearby mainland (and any adjacency near-miss
    // heals) via the small centroid merge.
    const clusters = mergeOwnerClusters([...roots.values()], CLUSTER_JOIN_DEGREES);
    clusters.sort((a, b) => b.area - a.area);
    const rawName = DISPUTED_TERRITORY_CLAIMANT[owner]
      ? `Disputed (${DISPUTED_TERRITORY_CLAIMANT[owner]})`
      : polityOverrides?.[owner]?.name || countryNameByCode.get(owner) || owner;
    const name = String(nameResolver ? nameResolver(rawName, owner) : rawName).toUpperCase();
    // Clusters are sorted largest first, so index 0 is the seat and everything
    // after it is an outlying possession printing a name the map already carries
    // once. That distinction had no expression here: every cluster emitted the
    // same feature, so the label over a colony drew at full country weight — 75
    // of them on wwii-1935 (British Empire ×14, Dutch East Indies ×9, French
    // Republic ×8), 37 on medieval-1200, 13 on roman-117. A player reading that
    // map sees two ranks of place printed as one rank of type.
    //
    // `tier` is that rank, and Nations.jsx draws the two from separate layers.
    const seatScale = Math.sqrt(clusters[0]?.area ?? 0) * 17500;
    for (let index = 0; index < clusters.length; index += 1) {
      const cluster = clusters[index];
      // Every owner keeps its largest cluster (tiny states still get a label);
      // additional clusters must clear the size bar.
      if (index > 0 && cluster.area < MIN_CLUSTER_AREA) continue;
      const ownScale = Math.sqrt(cluster.area) * 17500;
      const elongation = axisElongationOfMoments(cluster.axis);
      const tilt = elongation >= AXIS_ELONGATION_FLOOR
        ? axisAngleOfMoments(cluster.axis)
        : 0;

      // TOO SMALL TO HOLD ITS OWN NAME → the label goes outside, on a line.
      //
      // This is countryLabels.js's rule, reached from the lane that actually
      // draws. That lane has the same promotion and has never run: it lives
      // behind `!customFlag`, and normalizeRuntimeWorld forces customRegions
      // onto every served world (24 of 24 built boards). So the feature
      // tests/label-leaders.mjs was written for — Danzig, Memel, Luxembourg,
      // Andorra, Liechtenstein, San Marino, Monaco, the Vatican — has never
      // reached a pixel, on any board, since the day it was written.
      //
      // Counted on the built boards against that lane's own floor, by summing
      // each owner's regions the way this builder does: wwii-1935 promotes 6 of
      // 109 owners, victorian-1836 15 of 59, magna-1444 19 of 157, korea-1950 7
      // of 115. SAN MARINO scores 589 against a floor of 20,000 — at the zoom a
      // player reads Europe, a label under a pixel wide. FREE CITY OF DANZIG is
      // 9,116, which is the case the 1935 board was reported for. Thirteen of
      // 1836's fifteen are states added to that board the same week, which is
      // what turned a dark feature into a load-bearing one.
      //
      // ONLY THE SEAT (index 0). A possession below the floor is a repeat of a
      // name the map already carries at full size somewhere else, and pulling
      // every such repeat out on its own line would draw a hairline to each of
      // the British Empire's fourteen. The rule is about a country that cannot
      // show its name at all, and a possession is never that.
      const leader = index === 0 && ownScale < LEADER_AREA_SCALE_FLOOR && cluster.bbox
        ? buildLeaderPlacement(bboxCorners(cluster.bbox), [cluster.cx, cluster.cy], tilt, leaderExtension)
        : null;
      if (leader) {
        // From the territory's own edge out to the label, not from its centre:
        // starting at the edge keeps the stroke off a country two pixels wide
        // instead of covering it.
        leaderFeatures.push({
          type: "Feature",
          id: `owner-leader-${id}`,
          geometry: { type: "LineString", coordinates: [leader.edge, leader.anchor] },
          // ownScale rides along so the line can fade on how big the COUNTRY is
          // on screen rather than on zoom alone — see leaderLinePaint.
          properties: { name, ownScale },
        });
      }

      // TOO WIDE TO FIT FLAT → the label BENDS along the territory.
      //
      // The rung between the leader line and the flat label, and the one the
      // original actually uses for GRAND-HESSE and SAXE-WEIMAR (seen on its
      // 1836 board). Only the SEAT, like the leader line and for the same
      // reason; and only where the flat label would not fit — a name that
      // fits stays flat, however elegant a curve the shape could carry, because
      // a bend a reader cannot see the reason for reads as a mistake.
      //
      // The path is traced through the cluster's own outline (its member rings
      // read back from allFeatures — see `members`), along the SAME area-moment
      // axis the flat label tilts to, so the two never disagree on which way
      // the country runs. labelCurves.js explains why the stock lane's builder
      // could not be reused as-is.
      const curved = !leader && index === 0
        ? buildOwnerCurve(cluster, allFeatures, name, ownScale, tilt, elongation)
        : null;
      if (curved) {
        // One point feature per glyph, on its own source and layer (see
        // `owner-curved-label-source`). Same face, size and colour as the flat
        // label it replaces; `areaScale` is what buildCountryTextSize reads, so
        // the glyphs draw at the seat's own weight, times how much of the flat
        // size the path had room for.
        for (const g of curved.glyphs) {
          features.push({
            type: "Feature",
            id: `owner-glyph-${id}-${g.index}`,
            geometry: { type: "Point", coordinates: g.lngLat },
            properties: {
              glyph: g.glyph,
              areaScale: curved.areaScale,
              rotation: g.rotation,
              tier: 0,
              leader: 0,
              curved: 1,
              lat: g.lngLat[1],
            },
          });
        }
        id += 1;
        continue;
      }

      features.push({
        type: "Feature",
        id: `owner-label-${id++}`,
        geometry: { type: "Point", coordinates: leader ? leader.anchor : [cluster.cx, cluster.cy] },
        properties: {
          name,
          // A possession may not out-print the seat. Area alone let it: British
          // Australia is larger than the British Isles, so the repeat drew bigger
          // than the country. Capping at the seat's own scale costs nothing where
          // the possession is smaller anyway, which is nearly always.
          //
          // Out on a line the label is no longer describing an area it sits in,
          // so it stops being sized by one and draws to be read.
          //
          // …AND INSIDE, IT HAS TO FIT. See fitNameToTerritory: sizing by area
          // alone never measures the name, and a wide name drew wider than the
          // country it names. `name` here is what the resolver returned — the
          // Korean alias on a Korean client — and the fit measures THAT string
          // in em, with MapLibre's wrapping applied, so it is capping the label
          // the player sees and not the English one the spec is keyed by.
          areaScale: leader
            ? LEADER_LABEL_AREA_SCALE
            : fitNameToTerritory(
              index === 0 ? ownScale : Math.min(ownScale, seatScale),
              name,
              tilt ? elongation : 1,
            ),
          // THE LABEL LIES ALONG THE TERRITORY, and this used to be hardcoded
          // flat. Reported symptom: BELGIAN CONGO and BRITISH EAST AFRICA
          // overprinting each other on the 1935 map. Both are single clusters,
          // so `tier` cannot separate them, and shrinking by name length is a
          // symptom fix the original does not use — its own map letterspaces
          // BYELORUSSIAN SSR wide and lays it ALONG the country instead.
          //
          // THIS IS THE ONLY LABEL LANE THAT DRAWS. The first draft of this
          // note said the owner lane was merely catching up with the curved
          // country labels, which read a ring's principal axis a few hundred
          // lines down. That is true of the code and false of the screen:
          // `activeCurvedLabelData` is gated on `!customFlag`, and
          // normalizeRuntimeWorld forces customRegions onto every served world
          // — measured, 24 of 24 built boards. The curved lane and the leader
          // lines behind the same gate have not drawn a pixel on any board.
          // So there is no other lane to line up with, which makes the tilt
          // this lane draws the whole of what the player sees.
          //
          // Measured from the OUTLINES, which is the correction that mattered.
          // Reading the member centroids instead looks equivalent and is not:
          // it weighs a province the same as a subcontinent and knows nothing
          // of either one's shape, so on wwii-1935 it stood SPAIN on end (-79°
          // across a country that is wider than it is tall) and laid ITALY flat
          // (0.1°, the most clearly angled country in Europe). Both readings
          // are gone once the accumulated rings are what is measured.
          //
          // …and only where there IS a direction. See AXIS_ELONGATION_FLOOR:
          // a round country's axis is noise, and BELGIAN CONGO — the label this
          // whole change was reported for — stood vertical on the strength of
          // an elongation of 1.10.
          //
          // A LEADER LABEL IS HORIZONTAL. Tilting it to the principal axis of a
          // shape it is no longer standing on reads as a mistake — the same
          // call countryLabels.js makes for the same reason.
          rotation: leader ? 0 : tilt,
          tier: index === 0 ? 0 : 1,
          // Which layer draws it. The three label layers share one source and
          // filter on this, so the property has to be present on every feature
          // rather than only on the promoted ones.
          leader: leader ? 1 : 0,
          // See GLOBE_LAT_CORRECTION — same globe text-size fix (issue #6).
          lat: leader ? leader.anchor[1] : cluster.cy,
        },
      });
    }
  }

  // Two collections, because they are two sources: the labels go into the point
  // source the three label layers share, the lines into their own.
  return {
    labels: { type: "FeatureCollection", features },
    leaderLines: { type: "FeatureCollection", features: leaderFeatures },
  };
};


const WorldMap = ({ isGlobe = false }) => {
  const { current: map } = useMap();
  const [colorMap, setColorMap] = useState({});
  const {
    worldState,
    worldKnown,
    customRegions: customFlag,
    regionOwnershipOverrides,
    baselineOwnership,
    unownedRegionIds,
    regionClaimants,
    polityOverrides,
    labelFont,
    labelHaloColor,
    labelTextColor,
  } = useWorldState();
  const mapDisplaySettings = {
    hideCountryLabels: useMapSetting(MAP_SETTING_KEYS.hideCountryLabels),
  };
  // Multiplies the tuned curves rather than replacing them, so every border keeps
  // its zoom behaviour and the player only scales it. 1 is exactly as shipped.
  const borderScale = useDisplayScale("borderWidth");
  // Where the region hairlines start coming up and where they reach full — the
  // original's "Border Fade Range". Four stops, shape preserved (mapSettings.js).
  // How far a too-small country's label sits past its own edge. Baked into the
  // label geometry at build time (runtime/countryLabels.js explains why), so a
  // change here rebuilds the label collections rather than moving a layer.
  const labelLineExtension = useMapRenderValue("labelLineExtension");
  const fadeStart = useMapRenderValue("borderFadeStart");
  const fadeEnd = useMapRenderValue("borderFadeEnd");
  const fadeStops = useMemo(() => borderFadeStops(fadeStart, fadeEnd), [fadeStart, fadeEnd]);
  const [pointLabelData, setPointLabelData] = useState(EMPTY_FEATURE_COLLECTION);
  const [curvedLabelData, setCurvedLabelData] = useState(EMPTY_FEATURE_COLLECTION);
  const [leaderLineData, setLeaderLineData] = useState(EMPTY_FEATURE_COLLECTION);
  const [customRegionData, setCustomRegionData] = useState(EMPTY_FEATURE_COLLECTION);
  const [ownerBorderData, setOwnerBorderData] = useState(EMPTY_FEATURE_COLLECTION);
  const countriesUrl = PMTILES_PROTOCOL_URLS.countries;
  const regionsUrl = PMTILES_PROTOCOL_URLS.regions;
  // The seas are ALWAYS on the map now — command of a strait, a blockade, a
  // claimed exclusive zone are things a game should be able to show without the
  // player first finding a switch. The geometry is identical for every game, so it
  // is fetched from the shipped asset rather than copied into each world (see
  // runtime/seaRegions.js); only ownership is per-game, and that already rides in
  // world.regionOwnershipOverrides["sea_…"].
  const [seaFeatures, setSeaFeatures] = useState(EMPTY_SEA_FEATURES);
  useEffect(() => {
    let cancelled = false;
    loadSeaRegionFeatures().then((features) => {
      if (!cancelled && features.length) setSeaFeatures(features);
    });
    return () => {
      cancelled = true;
    };
  }, []);
  const regionData = useMemo(() => {
    if (!seaFeatures.length) return customRegionData;
    const base = Array.isArray(customRegionData?.features) ? customRegionData.features : [];
    // A save made while seas were still opt-in has its own copy embedded in the
    // scenario geometry; keep the shipped feature and drop the duplicate rather
    // than rendering both (double fills read a shade too dark, and the click
    // handler would resolve to whichever won the z-order).
    const seaIds = new Set(seaFeatures.map((feature) => String(feature?.properties?.id ?? "")));
    const land = base.filter((feature) => !seaIds.has(String(feature?.properties?.id ?? "")));
    return { type: "FeatureCollection", features: [...land, ...seaFeatures] };
  }, [customRegionData, seaFeatures]);
  const customActive = customFlag && Array.isArray(regionData?.features) && regionData.features.length > 0;
  // True for maps with their OWN drawn/generated geometry (region ids like
  // "reg_fmg_…", no dot) rather than re-ownership on the stock GADM tiles (ids like
  // "USA.1_1"). On such a map the stock regions-fill layer is Earth left over
  // underneath — clicking the fantasy ocean would otherwise resolve to whatever
  // real country sits at that lat/lon (Russia, Canada…), so we must NOT query it.
  const hasDrawnGeometry = useMemo(
    () =>
      customActive &&
      Array.isArray(regionData?.features) &&
      // Sea regions (kind:"sea", dot-less "sea_…" ids) are an OVERLAY on
      // whatever map they were merged into, not a sign the map's land is
      // hand-drawn — counting them here would stop stock-tile land clicks
      // from resolving on a stock map with seas enabled.
      regionData.features.some((feature) =>
        feature?.properties?.kind !== "sea" && !/\./.test(String(feature?.properties?.id ?? ""))),
    [customActive, regionData],
  );
  // Does the map's geometry include stock GADM regions (dotted ids)? A hybrid
  // map (GADM seed + some drawn shapes) still needs the stock tiles for
  // high-zoom click resolution; only a fully-drawn fantasy map does not.
  const hasStockGeometry = useMemo(
    () =>
      Array.isArray(regionData?.features) &&
      regionData.features.some((feature) => /\./.test(String(feature?.properties?.id ?? ""))),
    [regionData],
  );
  // Re-read on each render so a runtime token change (switching games/scenarios)
  // refetches the geometry, mirroring the live-URL world poll below.
  const regionsGeojsonUrl = JSON_URLS.regionsGeojson;
  const bordersGeojsonUrl = JSON_URLS.bordersGeojson;
  // Countries owning at least one region here — used to hide labels for nations
  // that don't exist in this scenario (e.g. modern states over medieval land).
  const ownedCountryCodes = useMemo(() => {
    const set = new Set();
    for (const feature of regionData?.features ?? []) {
      const props = feature.properties || {};
      if (props.owner && props.gid0) set.add(props.gid0);
    }
    return set;
  }, [regionData]);
  const ownedCodesKey = useMemo(() => [...ownedCountryCodes].sort().join(","), [ownedCountryCodes]);

  // Bumped when the translator learns new strings, so labels rebuild with
  // translated names (they're baked into map features, not DOM text).
  const [labelEpoch, setLabelEpoch] = useState(0);
  useEffect(() => {
    const onUpdated = () => setLabelEpoch((epoch) => epoch + 1);
    window.addEventListener("i18n:updated", onUpdated);
    return () => window.removeEventListener("i18n:updated", onUpdated);
  }, []);

  // Disputed-region stripe tiles, generated the moment the style asks for one.
  // Reactive (rather than pre-registered) so any stripe combination works and
  // the globe/mercator remount — which rebuilds the style without its images —
  // heals itself on the next frame.
  useEffect(() => {
    const mapInstance = map?.getMap ? map.getMap() : map;
    if (!mapInstance?.on) return undefined;
    const onMissing = (event) => {
      const colors = parseStripeImageId(event?.id);
      if (!colors) return;
      if (mapInstance.hasImage?.(event.id)) return;
      try {
        mapInstance.addImage(event.id, buildStripeImage(colors), { pixelRatio: 1 });
      } catch (error) {
        console.warn("Failed to build stripe tile:", error);
      }
    };
    mapInstance.on("styleimagemissing", onMissing);
    return () => mapInstance.off("styleimagemissing", onMissing);
  }, [map]);

  // Owner (polity) labels for custom maps — one label per landmass-cluster per
  // owner, named by the scenario's polity registry ("Soviet Union", not "Russia").
  // Recomputed as ownership overrides poll in, so labels follow conquests.
  // Geometry-only, so it survives ownership polls — rebuilt only when the
  // world's region geometry itself changes.
  const regionAdjacency = useMemo(
    () => (customActive ? buildRegionAdjacency(regionData) : null),
    [customActive, regionData],
  );

  // labelLineExtension is a player dial, so it belongs in the deps: moving it
  // moves where a promoted label sits, which is baked in here rather than in a
  // layer (see the note on the setting above).
  const ownerLabels = useMemo(() => {
    if (!customActive) return null;
    return buildOwnerLabelCollection(
      regionData,
      regionOwnershipOverrides,
      polityOverrides,
      (raw, owner) => translateLabel(resolveCountryDisplayName(raw, owner)),
      regionAdjacency,
      labelLineExtension,
    );
    // labelEpoch: rebuild once new translations land.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customActive, regionData, regionOwnershipOverrides, polityOverrides, regionAdjacency, labelLineExtension, labelEpoch]);
  const ownerLabelData = ownerLabels?.labels ?? EMPTY_FEATURE_COLLECTION;
  const ownerLeaderLineData = ownerLabels?.leaderLines ?? EMPTY_FEATURE_COLLECTION;

  // On custom maps the stock modern-country labels are replaced wholesale by the
  // owner labels (no more "Russia"/"Ukraine" floating over the Soviet Union).
  // Keyed on the FLAG (not customActive): while a custom world's geometry is
  // still loading, and before the world is known at all, stock labels must
  // not flash in.
  const activePointLabelData = !worldKnown
    ? EMPTY_FEATURE_COLLECTION
    : customFlag
      ? ownerLabelData
      : pointLabelData;
  const activeCurvedLabelData = worldKnown && !customFlag ? curvedLabelData : EMPTY_FEATURE_COLLECTION;
  // LEADER LINES USED TO BE STOCK-ONLY, AND THEREFORE NEVER DREW.
  //
  // The note that stood here said a custom world "draws owner labels instead
  // and has none of them", which described the code exactly and the screen not
  // at all: normalizeRuntimeWorld forces customRegions onto every served world,
  // so `!customFlag` is false everywhere and BOTH branches of that sentence
  // resolved to nothing. The same gate had already cost this map its country
  // borders once — the autopsy is on the countries source below — and this was
  // its second casualty and the curved labels its third.
  //
  // Now each lane brings its own: the owner lane promotes below the same floor
  // countryLabels.js uses, so whichever set of labels is on the map, the states
  // too small to hold their names are on lines.
  const activeLeaderLineData = !worldKnown || mapDisplaySettings.hideCountryLabels
    ? EMPTY_FEATURE_COLLECTION
    : customFlag
      ? ownerLeaderLineData
      : leaderLineData;

  const handleRegionClick = useCallback((event) => {
    // Everything on this map is a point a few pixels across, and every query below
    // used the bare cursor pixel — so a hit needed the click to land inside the
    // glyph's own box, and when two boxes overlapped the FIRST one the renderer
    // emitted won every time. The one underneath was simply unreachable, however
    // precisely the player aimed. A small box makes small things clickable at all,
    // and nearestTo makes an overlap resolve by where the player actually pointed
    // instead of by draw order, so both things can be reached by aiming at them.
    const CLICK_SLOP_PX = 5;
    const clickBox = [
      [event.point.x - CLICK_SLOP_PX, event.point.y - CLICK_SLOP_PX],
      [event.point.x + CLICK_SLOP_PX, event.point.y + CLICK_SLOP_PX],
    ];
    const nearestTo = (hits) => {
      let best = null;
      let bestDistance = Infinity;
      for (const hit of hits) {
        const coordinates = hit.geometry?.coordinates;
        if (!Array.isArray(coordinates)) {
          // No point geometry to measure (a label placed off its anchor, say):
          // keep it as a last resort but never let it beat a measurable hit.
          if (!best) best = hit;
          continue;
        }
        const projected = map.project({ lng: coordinates[0], lat: coordinates[1] });
        const distance = Math.hypot(projected.x - event.point.x, projected.y - event.point.y);
        if (distance < bestDistance) {
          bestDistance = distance;
          best = hit;
        }
      }
      return best;
    };

    const unitsAt = () =>
      map.getLayer("units-fill")
        ? map.queryRenderedFeatures(clickBox, { layers: ["units-fill"] })
        : [];

    // A city or built structure under the cursor. Point features are tiny
    // targets, so a hit is always deliberate; built structures (world.markers)
    // outrank cities when the two overlap. Shared between normal selection and
    // attack targeting, so anything clickable is also attackable.
    const featureAt = () => {
      // Both layers of both pairs. A city has always been clickable on its NAME
      // as well as its glyph; a structure was not, so clicking the caption of the
      // base you just built selected the province underneath it instead. Same
      // feature either way — the label layer carries the same properties.
      const featureLayers = ["markers-shapes", "markers-labels", "cities-shapes", "cities-labels"]
        .filter((id) => map.getLayer(id));
      const featureHits = featureLayers.length
        ? map.queryRenderedFeatures(clickBox, { layers: featureLayers })
        : [];
      if (!featureHits.length) return null;
      // Built structures still outrank cities where the two overlap, but among
      // several of either it is now the CLOSEST to the cursor that answers.
      const isMarkerLayer = (id) => id === "markers-shapes" || id === "markers-labels";
      const markerHits = featureHits.filter((entry) => isMarkerLayer(entry.layer.id));
      const hit = markerHits.length ? nearestTo(markerHits) : nearestTo(featureHits);
      if (!hit) return null;
      const props = hit.properties ?? {};
      const [lng, lat] = hit.geometry?.coordinates ?? [event.lngLat.lng, event.lngLat.lat];
      return isMarkerLayer(hit.layer.id)
        ? { source: "marker", id: props.id, name: props.name, kind: props.kind, ownerCode: props.ownerCode, lng, lat }
        : {
          source: "city",
          name: props.city || props.name || "",
          population: props.population,
          capital: props.capital,
          tier: props.tier,
          lng,
          lat,
        };
    };

    const mode = getInteractionMode();

    // Active troop command modes intercept the click as a target, not a selection.
    if (mode.kind === "deploy") {
      deployUnit({ ...mode.params, lng: event.lngLat.lng, lat: event.lngLat.lat });
      clearInteractionMode();
      return;
    }
    if (mode.kind === "move") {
      moveUnitTo(mode.unitId, event.lngLat.lng, event.lngLat.lat);
      clearInteractionMode();
      return;
    }
    if (mode.kind === "attack") {
      // An enemy unit under the cursor is the target; otherwise a city or
      // structure is — troops can be directed against objectives, not just
      // other troops.
      const target = unitsAt();
      const feature = target.length ? null : featureAt();
      if (target.length) {
        attackWith(mode.unitId, (nearestTo(target) ?? target[0]).properties.id);
      } else if (feature) {
        attackFeature(mode.unitId, feature);
      }
      clearInteractionMode();
      return;
    }

    // While a cheat click-mode is armed (annex, region picker…), units and
    // features must NOT swallow the click with their popups — the cheat wants
    // the region under the cursor, so fall straight through to the region
    // resolution below (whose interceptor consumes it). The unit/feature under
    // the cursor still gets REPORTED to the interceptor (unitHit/featureHit),
    // so pick-a-feature cheats can detect cities, structures and units.
    const intercepted = hasRegionClickInterceptor();
    let pickExtras = null;
    if (intercepted) {
      const unitHits = unitsAt();
      pickExtras = {
        unitHit: unitHits.length ? { id: (nearestTo(unitHits) ?? unitHits[0]).properties.id } : null,
        featureHit: featureAt(),
      };
    }

    // Normal selection: a unit click wins over the region beneath it.
    if (!intercepted) {
      const unitHits = unitsAt();
      if (unitHits.length) {
        dismissRegionPopup();
        dismissFeaturePopup();
        onUnitSelected({ id: (nearestTo(unitHits) ?? unitHits[0]).properties.id, lngLat: event.lngLat });
        return;
      }

      dismissUnitPopup();

      const featureHit = featureAt();
      if (featureHit) {
        dismissRegionPopup();
        onFeatureSelected(featureHit);
        return;
      }

      dismissFeaturePopup();
    }
    // Custom (editor) regions render on top of the stock regions. Only a map
    // whose geometry is ENTIRELY hand-drawn (no GADM ids anywhere — a fantasy
    // world) may skip the stock tiles: there a click on its empty sea must
    // resolve to nothing, not the leftover Earth country underneath. A HYBRID
    // map — GADM seed geometry plus a few drawn shapes — must keep querying
    // regions-fill: above z~6.5 the seed far-layer has faded out and the stock
    // tiles are the only clickable geometry for every GADM region, so skipping
    // them made region clicks silently dead when zoomed in.
    const queryLayers = (hasDrawnGeometry && !hasStockGeometry
      ? ["custom-regions-fill", "custom-regions-fill-far"]
      : ["custom-regions-fill", "custom-regions-fill-far", "regions-fill"]
    ).filter((id) => map.getLayer(id));
    const features = map.queryRenderedFeatures(event.point, { layers: queryLayers });
    if (!features.length) return;

    const props = features[0].properties ?? {};
    const regionId = props.GID_1 ?? props.id ?? "";
    // On custom maps, stock-tile hits carry modern props only — resolve the era
    // owner (possibly "" = unclaimed) from the ownership lookup. The lookup
    // WINS over the feature's own `owner` prop: the prop is the scenario's
    // SEED owner baked into the geojson, so after a live transfer (an override)
    // it goes stale — a conquered region's popup kept naming the old owner,
    // and a claimed sea region stayed "Unclaimed".
    const liveOwner = ownerLookupRef.current.size ? ownerLookupRef.current.get(regionId) : undefined;
    const owner = liveOwner ?? props.owner;
    // The region's underlying real country, as GADM knows it. A code, and staying
    // one: it comes off the baked tiles.
    const gid0 = props.gid0 ?? props.GID_0 ?? "";
    onRegionSelected({
      // Despite the name, this field carries the OWNER — every downstream reader
      // (the flag lookup, the country panel) treats it that way. Resolved to a
      // NAME here so it is one namespace: it used to hand back the owner's name
      // when there was an owner and a raw GADM code when there wasn't, and the
      // difference only showed up as an occasional "RUS" where a country name
      // belonged. owner === "" means genuinely unclaimed and must stay empty.
      GID_0: owner || (owner === "" ? "" : toCountryName(gid0)),
      // A stock-tile hit carries GADM's own COUNTRY attribute; a custom region has
      // no such property (and no longer carries `country` at all), so name it from
      // the provenance rather than handing the panel a blank.
      COUNTRY: props.COUNTRY ?? toCountryName(gid0),
      // Corrects the GADM regions whose stored name is the placeholder "NA" (England
      // is one), so the panel names the place instead of showing the marker verbatim.
      NAME_1: resolveRegionName(regionId, props.NAME_1 ?? props.name ?? ""),
      GID_1: regionId,
      // Kept as the flag fallback when the owner is an invented polity: "Roman
      // Empire" has no flag, but the land underneath it is still Italy.
      gid0,
      owner,
      lngLat: event.lngLat,
      ...(pickExtras ?? {}),
    });
  }, [hasDrawnGeometry, hasStockGeometry, map]);

  useEffect(() => {
    if (!map) return;
    map.on("click", handleRegionClick);
    return () => map.off("click", handleRegionClick);
  }, [handleRegionClick, map]);

  // The palette is re-read whenever colors.json is written (every AI turn can mint
  // or recolour a polity, and the main menu's faction creator writes the player's
  // own colour over an already-mounted map). Fetching once on mount left any
  // owner coloured after mount painting a procedural fallback for the rest of the
  // session — healed only by a reload. `oh:colors-updated` is dispatched by the
  // asset layer's write path; the epoch re-runs this effect.
  const [colorsEpoch, setColorsEpoch] = useState(0);
  useEffect(() => {
    const bump = () => setColorsEpoch((n) => n + 1);
    window.addEventListener("oh:colors-updated", bump);
    return () => window.removeEventListener("oh:colors-updated", bump);
  }, []);

  useEffect(() => {
    let cancelled = false;
    getNationColors()
      .then((next) => {
        if (cancelled) return;
        // Only swap the object when the contents actually differ — a new identity
        // rebuilds every MapLibre match expression below.
        setColorMap((prev) => (shallowEqualColors(prev, next) ? prev : next));
      })
      .catch((error) => console.error("Error loading colors:", error));
    return () => {
      cancelled = true;
    };
  }, [colorsEpoch]);

  // ONE owner -> rgb resolver for every paint path. colors.json and the live
  // polity registry (world.polityOverrides) are two different namespaces: a
  // polity can be correctly NAMED by the registry while colors.json has no key
  // for it — shipped example: "British Empire" owns 426 regions in
  // world-war-ii-1939-copy with its colour (#c0507a) only in polityOverrides.
  // Resolving the name but not the colour painted those regions a muddy
  // procedural fallback, which reads to a player as "the map didn't annex it".
  const resolveOwnerRgb = useCallback(
    (rawOwner) => {
      if (!rawOwner) return null;
      // Canonicalize an owner CODE ("ESP" from a transfer override) to the NAME the palette
      // is keyed by ("Spain") so a captured region takes its true owner's colour.
      const owner = toCountryName(rawOwner);
      const exact = colorMap[owner];
      if (exact) return exact;
      const registry = parseColorToRgb(polityOverrides?.[owner]?.color);
      if (registry) return registry;
      const fold = ownerFoldKey(owner);
      if (fold) {
        for (const [key, rgb] of Object.entries(colorMap)) {
          if (ownerFoldKey(key) === fold) return rgb;
        }
        for (const [key, entry] of Object.entries(polityOverrides ?? {})) {
          const names = [key, ...(Array.isArray(entry?.aliases) ? entry.aliases : [])];
          if (!names.some((name) => ownerFoldKey(name) === fold)) continue;
          const rgb = parseColorToRgb(entry?.color);
          if (rgb) return rgb;
          const palette = colorMap[key];
          if (palette) return palette;
        }
      }
      return fallbackRgbFromOwner(owner);
    },
    [colorMap, polityOverrides],
  );

  const ownerColorCss = useCallback(
    (owner) => {
      const rgb = resolveOwnerRgb(owner);
      return rgb ? `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})` : NEUTRAL_LAND_COLOR;
    },
    [resolveOwnerRgb],
  );


  // Load custom region geometry once, only when the active map declares it. Stock
  // scenarios never hit the network for this. Ownership recolors live via the
  // world poll above; the geometry itself is static per scenario.
  useEffect(() => {
    let cancelled = false;

    if (!customFlag) {
      setCustomRegionData(EMPTY_FEATURE_COLLECTION);
      return undefined;
    }

    readJson(regionsGeojsonUrl, { defaultValue: EMPTY_FEATURE_COLLECTION, force: true })
      .then((data) => {
        if (cancelled) return;
        setCustomRegionData(data && Array.isArray(data.features) ? data : EMPTY_FEATURE_COLLECTION);
      })
      .catch((error) => {
        if (cancelled) return;
        console.error("Error loading custom regions:", error);
        setCustomRegionData(EMPTY_FEATURE_COLLECTION);
      });

    return () => {
      cancelled = true;
    };
  }, [customFlag, regionsGeojsonUrl]);

  // The board's own national border, built beside its geometry (scripts/presets/
  // lib/ownerBorders.mjs). Static per scenario like the regions themselves, and
  // ~1.4MB against their 67MB. A board that ships none leaves this empty and the
  // GADM level-0 outline below keeps drawing exactly as it did before.
  useEffect(() => {
    let cancelled = false;
    if (!customFlag) {
      setOwnerBorderData(EMPTY_FEATURE_COLLECTION);
      return undefined;
    }
    readJson(bordersGeojsonUrl, { defaultValue: EMPTY_FEATURE_COLLECTION, force: true })
      .then((data) => {
        if (cancelled) return;
        setOwnerBorderData(data && Array.isArray(data.features) ? data : EMPTY_FEATURE_COLLECTION);
      })
      .catch((error) => {
        if (cancelled) return;
        console.error("Error loading owner borders:", error);
        setOwnerBorderData(EMPTY_FEATURE_COLLECTION);
      });
    return () => {
      cancelled = true;
    };
  }, [customFlag, bordersGeojsonUrl]);

  useEffect(() => {
    let cancelled = false;

    // labelEpoch > 0 means translations arrived after the first build: force
    // a rebuild so baked-in label names pick them up.
    loadCountryLabelCollections({
      force: labelEpoch > 0,
      ownedCodes: ownedCountryCodes.size ? ownedCountryCodes : null,
      leaderExtension: labelLineExtension,
    })
      .then(({ pointLabelData: pointLabels, curvedLabelData: curvedLabels, leaderLineData: leaders }) => {
        if (cancelled) return;
        setPointLabelData(pointLabels);
        setCurvedLabelData(curvedLabels);
        setLeaderLineData(leaders ?? EMPTY_FEATURE_COLLECTION);
      })
      .catch((error) => console.error("Failed to load country labels:", error));

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ownedCodesKey, labelEpoch, labelLineExtension]);

  // DEAD as it stands, and deliberately left alone rather than half-fixed. It is
  // the only expression in the game that matches a country CODE — ["get", "GID_0"]
  // off the stock tiles — and it cannot fire: readRuntimeJsonAsset forces
  // customRegions:true onto every world it serves (normalizeRuntimeWorld), so
  // showStockCountries is always false and the country FILL never paints.
  //
  // Its stops would need a code->name bridge to work, which is exactly the thing
  // this rename exists to remove. It belongs in the dead-code sweep, not in a
  // patch that keeps codes alive to colour nothing. The layer that DOES paint the
  // political map (stockRegionsFillPaint) matches GID_1 — a region id, not a
  // country — and needs no bridge at all.
  //
  // NOTE the country OUTLINE is no longer dead: countries-source now mounts on
  // every map for its borders (see the source block below). Only this fill is
  // stock-only.
  const fillStyle = useMemo(() => {
    const stops = Object.entries(colorMap).flatMap(([owner, rgb]) => [
      owner, `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`,
    ]);
    const fallback = buildFallbackColorExpression();
    // A BLANK override is not "unowned", it is a damaged entry (see ownerByRegionId).
    // Painting it would stamp neutral grey over a region whose real owner the
    // geometry still knows; skipping the stop lets that owner paint instead.
    const regionOverrideStops = Object.entries(regionOwnershipOverrides)
      .filter(([, ownerCode]) => ownerCode)
      .flatMap(([regionId, ownerCode]) => [
        regionId,
        ownerColorCss(ownerCode),
      ]);
    // Explicitly unowned regions paint neutral, and they go in FIRST so a stale
    // override cannot outrank them. This is the opposite of the blank-override
    // case above: blank is a damaged entry to fall through, this is a stated
    // fact — the board says nobody holds this ground.
    const unownedStops = [...unownedRegionIds].flatMap((regionId) => [regionId, NEUTRAL_LAND_COLOR]);
    const allStops = [...unownedStops, ...regionOverrideStops];

    return {
      "fill-color": allStops.length > 0
        ? [
          "match",
          ["get", "GID_1"],
          ...allStops,
          stops.length > 0 ? ["match", ["get", "GID_0"], ...stops, fallback] : fallback,
        ]
        : stops.length > 0
        ? ["match", ["get", "GID_0"], ...stops, fallback]
        : fallback,
      "fill-opacity": 0.66,
    };
  }, [colorMap, regionOwnershipOverrides, unownedRegionIds, ownerColorCss]);

  // Fill for custom (editor) regions: we pre-compute a _fillColor property onto
  // every feature so the MapLibre paint expression is just ["get", "_fillColor"]
  // — a constant GL expression that never needs recompilation. Ownership-override
  // colours, owner-based colours, and the neutral fallback are all computed in
  // fast JS and baked into the GeoJSON data itself.
  const enrichedCustomRegionData = useMemo(() => {
    if (!regionData?.features) return regionData;

    const overrideColor = {};
    for (const [regionId, ownerCode] of Object.entries(regionOwnershipOverrides)) {
      // Blank owner = damaged entry, not unowned — skip it and let the feature's
      // own baked owner paint (see ownerByRegionId).
      if (!ownerCode) continue;
      overrideColor[regionId] = ownerColorCss(ownerCode);
    }

    const rgbForOwner = (owner) => resolveOwnerRgb(owner) ?? fallbackRgbFromOwner(owner);

    return {
      ...regionData,
      features: regionData.features.map((f) => {
        const props = f.properties || {};
        const id = props.id;
        // Sea regions (public/data/sea-regions.json, always merged in; dot-less
        // "sea_…" ids so the authored-geometry layers render them at every zoom)
        // work like territory — ownable,
        // transferable — but paint like water: invisible while unclaimed (the
        // basemap ocean shows through; only the hairline borders hint at the
        // grid), and a translucent tint of the owner's color once claimed, so
        // the sea never reads as solid land.
        const isSea = props.kind === "sea";
        // Stated unowned outranks the geometry's baked owner. On a borrowed base
        // map that owner is the MODERN one, which is precisely what a historical
        // board is trying to cancel.
        const isUnowned = unownedRegionIds.has(id);
        const liveOwner = isUnowned ? "" : regionOwnershipOverrides[id] || props.owner || "";
        let fillColor;
        if (isSea) {
          if (liveOwner) {
            const rgb = rgbForOwner(liveOwner);
            fillColor = `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, 0.4)`;
          } else {
            // FAINTLY visible, never fully transparent: the whisper of blue
            // makes the sea grid discoverable (and hoverable/clickable beyond
            // doubt — a 0-alpha fill invites "is this even interactive?").
            fillColor = "rgba(96, 165, 250, 0.07)";
          }
        } else if (isUnowned) {
          fillColor = NEUTRAL_LAND_COLOR;
        } else if (overrideColor[id]) {
          fillColor = overrideColor[id];
        } else if (props.owner) {
          fillColor = ownerColorCss(props.owner);
        } else {
          fillColor = NEUTRAL_LAND_COLOR;
        }
        // Disputed regions carry a stripe-tile id built from the current
        // administrator's color plus every claimant's — the layers below select
        // on _stripes and paint with fill-pattern instead of the solid fill.
        // Claimants come from WORLD data first (regionClaimants — how the
        // modern-world scenario declares its disputes, since its geometry is an
        // immutable seed), then from the region feature's own claimants prop
        // (editor-authored maps).
        let stripes = null;
        const claimants = regionClaimants[id]?.length
          ? regionClaimants[id]
          : Array.isArray(props.claimants) && props.claimants.length > 0
            ? props.claimants
            : null;
        if (claimants) {
          const seen = new Set();
          const stripeRgbs = [];
          for (const name of (liveOwner ? [liveOwner, ...claimants] : claimants)) {
            const key = String(name ?? "").trim();
            if (!key || seen.has(key)) continue;
            seen.add(key);
            stripeRgbs.push(rgbForOwner(key));
          }
          if (stripeRgbs.length >= 2) stripes = stripeImageId(stripeRgbs);
        }
        return {
          ...f,
          properties: stripes
            ? { ...props, _fillColor: fillColor, _stripes: stripes }
            : { ...props, _fillColor: fillColor },
        };
      }),
    };
  }, [regionData, colorMap, regionOwnershipOverrides, unownedRegionIds, regionClaimants, ownerColorCss, resolveOwnerRgb]);

  // GADM disputed regions also paint the stock tiles (the crisp z>6.5 layer):
  // GID_1 -> stripe-tile id stops for the tile twin of the disputed layer.
  const disputedTileStops = useMemo(() => {
    const stops = [];
    for (const f of enrichedCustomRegionData?.features ?? []) {
      const props = f.properties || {};
      if (!props._stripes || !String(props.id ?? "").includes(".")) continue;
      stops.push(String(props.id), props._stripes);
    }
    return stops;
  }, [enrichedCustomRegionData]);

  // Region id -> current owner (live overrides win). Drives the stock-tile fill,
  // and the click handler uses it to resolve era owner/unclaimed for the popup.
  const ownerByRegionId = useMemo(() => {
    const lookup = new Map();
    if (!customActive) return lookup;
    for (const feature of regionData?.features ?? []) {
      const props = feature.properties || {};
      if (!props.id) continue;
      // `||`, not `??`. An override may hold the EMPTY STRING — a save damaged by
      // the owner-blanking bug fixed in resolveOwnerRef still carries them — and ""
      // is not nullish, so `??` handed the fill a blank owner and the region painted
      // NEUTRAL_LAND_COLOR: the country vanished into grey even though the geometry
      // right here still knows who owns it. Treat blank as absent and fall through.
      // The one exception to falling through: an id on the unowned list is a
      // STATED fact, not a damaged entry, and it outranks the baked owner.
      lookup.set(props.id, unownedRegionIds.has(props.id) ? "" : regionOwnershipOverrides[props.id] || props.owner || "");
    }
    return lookup;
  }, [customActive, regionData, regionOwnershipOverrides, unownedRegionIds]);

  const ownerLookupRef = useRef(new Map());
  useEffect(() => {
    ownerLookupRef.current = ownerByRegionId;
  }, [ownerByRegionId]);



  // GADM regions on custom maps paint the STOCK vector tiles (sharp geometry at
  // every zoom — the coarse seed polygons left sliver gaps up close). Only
  // author-drawn shapes still render from the GeoJSON, on top.
  // Dotted (GADM) ids the editor reshaped: their true geometry is the GeoJSON's, so
  // the stock tiles — which still carry the ORIGINAL shape — must not paint them, or
  // the reshaped area fills twice and reads a shade too dark. Empty on stock and
  // author-only maps, where every change below is a no-op.
  const editedStockIds = useMemo(() => {
    if (!customActive) return [];
    const ids = [];
    for (const f of regionData?.features ?? []) {
      const props = f.properties || {};
      if (props.edited && String(props.id ?? "").includes(".")) ids.push(String(props.id));
    }
    return ids;
  }, [customActive, regionData]);

  // Land that CHANGED HANDS during the campaign: its live owner differs from the
  // owner baked into the geometry. The national outline comes from GADM level 0
  // — the world as it was drawn — so it cannot know about a conquest, and the
  // border around a province the player took would still run where it ran in
  // 2018. These ids get their own edge drawn at the national weight, so a
  // transfer is never invisible; the stale interior line stays too, which reads
  // as an occupied pocket rather than as nothing at all. Loud on purpose: a map
  // that quietly omits the border it can't place is the worse failure.
  //
  // Compared through toCountryName because the two sides live in different
  // namespaces — an AI transfer writes the owner CODE ("ESP") while the seed
  // holds the NAME ("Spain"), and comparing those raw would call every override
  // a conquest. Measured on the live save: 0 of 3661 overrides diverge, so this
  // list is normally empty and the layer is not mounted at all.
  const divergedRegionIds = useMemo(() => {
    if (!customActive) return [];
    const ids = [];
    for (const feature of regionData?.features ?? []) {
      const props = feature.properties || {};
      const id = String(props.id ?? "");
      // Sea regions are not national land and have no level-0 outline to correct.
      if (!id || props.kind === "sea") continue;
      const live = regionOwnershipOverrides[id];
      // Absent means "no override"; blank means a damaged entry (see
      // ownerByRegionId) — neither is evidence that the border moved.
      if (live === undefined || live === "") continue;
      // Compared against WHERE THE BOARD STARTED, not against the served
      // geometry. The two are the same thing on a scenario carrying its own map,
      // which is why this read `props.owner` alone for as long as every scenario
      // did. A scenario borrowing the shared base ships modern geometry under an
      // era overlay, so props.owner is 2026 and the whole board would read as
      // conquered on turn 1 — measured at 3,948 regions on TNO 1962.
      const started = baselineOwnership[id] ?? props.owner ?? "";
      if (toCountryName(live) !== toCountryName(started)) ids.push(id);
    }
    return ids;
  }, [customActive, regionData, regionOwnershipOverrides, baselineOwnership]);

  // Same weight as the national outline, so a taken province reads as a border
  // and not as a heavy province line.
  const divergedBorderPaint = useMemo(() => ({
    "line-color": "#000",
    "line-width": [
      "interpolate", ["linear"], ["zoom"],
      2, 0.6 * borderScale,
      4, 1.0 * borderScale,
      6, 1.5 * borderScale,
      9, 2.2 * borderScale,
      13, 3.0 * borderScale,
    ],
    "line-opacity": worldKnown ? 1 : 0,
  }), [borderScale, worldKnown]);

  const stockRegionsFillPaint = useMemo(() => {
    if (!customActive) return { "fill-opacity": 0 };
    const stops = [];
    for (const [regionId, owner] of ownerByRegionId) {
      if (!regionId.includes(".")) continue; // drawn regions aren't in the tiles
      if (editedStockIds.includes(regionId)) continue; // reshaped — the GeoJSON owns it
      stops.push(regionId, owner ? ownerColorCss(owner) : NEUTRAL_LAND_COLOR);
    }
    if (!stops.length) return { "fill-opacity": 0 };
    return {
      "fill-color": ["match", ["get", "GID_1"], ...stops, NEUTRAL_LAND_COLOR],
      // Fades in as the seed-geometry far layer fades out — but never for a reshaped
      // region: its tile still holds the original shape, so painting it here would
      // double-fill the edited area over the GeoJSON that now owns it.
      //
      // The zoom ramp has to stay the TOP-LEVEL node. Wrapping it in a ["case"]
      // (the obvious way to write "0 for edited regions, the ramp for everyone
      // else") makes the whole property invalid — ["zoom"] is only legal as the
      // direct input of a top-level step/interpolate — and MapLibre's response to
      // an invalid paint property is to reject it silently: the layer either never
      // gets added or keeps its previous value, which here is the {"fill-opacity":
      // 0} returned above before data loads. On a stock scenario this layer is the
      // only thing painting owners past z6.5, so a single province reshaped in the
      // editor would have blanked the political map at close zoom, with nothing in
      // the console to say why. Same result, legal shape: the case goes INSIDE the
      // ramp's output stops, where it never sees the zoom.
      "fill-opacity": editedStockIds.length
        ? ["interpolate", ["linear"], ["zoom"],
          5.5, 0,
          6.5, ["case", ["in", ["get", "GID_1"], ["literal", editedStockIds]], 0, 0.72]]
        : TILE_FILL_FADE,
    };
  }, [customActive, ownerByRegionId, colorMap, ownerColorCss, editedStockIds]);

  // Stock country fills/borders render ONLY once the world is known to be a
  // stock world. Gating on the customRegions FLAG (not customActive, which
  // additionally waits for geometry) means a custom world never flashes the
  // modern map — not before the world loads, and not while its geometry does.
  const showStockCountries = worldKnown && !customFlag;
  const countriesFillPaint = showStockCountries ? fillStyle : { ...fillStyle, "fill-opacity": 0 };
  // A COUNTRY BORDER IS THE LINE THE MAP IS ABOUT.
  //
  // And for a long time this game did not draw one. The layer existed, the curve
  // below was tuned, the player's "Border thickness" setting was wired to it —
  // and none of it ever reached a pixel, because the whole countries-source block
  // was gated on `!customFlag` while normalizeRuntimeWorld forces customRegions
  // onto EVERY served world. So the only black lines on the map were the province
  // hairlines, drawn at one weight over national and internal edges alike. A
  // player reading that map saw no difference between the two because there was
  // none: countries were told apart by fill colour alone.
  //
  // The source now mounts on every map, for its borders. GADM level 0 is the
  // dissolve of the level 1 regions that paint the fills, so the outline lands
  // exactly on the colour changes, stays crisp at every zoom, and costs no
  // geometry work — the alternative, dissolving 2.58M seed vertices per
  // ownership change, is not affordable per turn and would not be more correct.
  // What level 0 cannot know is a transfer made DURING the campaign; that is what
  // the diverged-region layer below draws.
  //
  // Weighted by zoom — thin enough at z2 that a continent of coastline stays
  // legible, heavy enough by z9 that a border reads as a border. The player's
  // setting multiplies rather than replaces, so this curve survives being scaled.
  const countriesOutlinePaint = {
    "line-color": "#000",
    "line-width": [
      "interpolate", ["linear"], ["zoom"],
      2, 0.6 * borderScale,
      4, 1.0 * borderScale,
      6, 1.5 * borderScale,
      9, 2.2 * borderScale,
      13, 3.0 * borderScale,
    ],
    // Gated on worldKnown only: nothing draws before the world loads, and after
    // that a national border draws on every map kind.
    "line-opacity": worldKnown ? 1 : 0,
  };
  // ...BUT LEVEL 0 IS THE MODERN WORLD, AND MOST BOARDS ARE NOT IT.
  //
  // Everything above is true only where this board's ownership happens to follow
  // GADM. Where it does not, the layer draws 2026 over the past: the 1935 board
  // wore the modern Germany-Poland line straight through the Reich, and 1200 wore
  // the entire modern grid over a world that had none of it. Both were reported.
  //
  // The board now says which countries it leaves intact — one polity holding all
  // of that country's land and nothing outside it — and level 0 is filtered to
  // exactly those. Japan in 1200 is still Japan-shaped, so JPN keeps drawing,
  // coast and all; the Angevin king held England and Anjou both, so GBR and FRA
  // stop. Everywhere level 0 stops, the frontier layer below is the border.
  //
  // No board file, no filter: a scenario built before this asset existed draws
  // exactly what it drew yesterday.
  const ownerBorderMeta = ownerBorderData?.meta;
  const ownerBordersReady = Array.isArray(ownerBorderData?.features) && ownerBorderData.features.length > 0;
  const countriesOutlineFilter = useMemo(
    () => (ownerBordersReady
      ? ["in", ["get", "GID_0"], ["literal", Array.isArray(ownerBorderMeta?.intact) ? ownerBorderMeta.intact : []]]
      : ["all"]),
    [ownerBordersReady, ownerBorderMeta],
  );
  // Region hairlines serve both map kinds, but nothing renders pre-worldKnown.
  // Tile hairlines only fade in alongside the tile FILLS (z5.5-6.5): below
  // that the fills come from the seed geometry, and hairlines from the
  // simplified low-zoom tiles sit visibly off those fills — disconnected
  // borders. The far hairlines come from the seed geometry itself instead.
  const regionsOutlinePaint = {
    "line-color": "#000",
    // Province hairlines keep their restraint and their curve; only the scale is
    // the player's. They must stay well under the country border at every zoom or
    // the political map stops reading as political.
    // Raised once the national border existed to be measured against. At 0.2px /
    // 14% these were tuned to stay out of the way of a country border that, as it
    // turned out, was never drawn — so "out of the way" meant "of nothing", and a
    // province edge read as barely there. Against a real 2.2px opaque border they
    // can afford half again the weight and still lose the comparison at every
    // zoom, which is the only thing that has to stay true.
    // Second raise (0.2→0.3→0.45): at 0.3px/25% the line still drowned in the
    // fill palette — two pastel provinces meet at nearly the same luminance and
    // a whisper-thin dark line between them needs real weight to register.
    "line-width": ["interpolate", ["linear"], ["zoom"], 7.5, 0.45 * borderScale, 12, 1.0 * borderScale, 14, 1.3 * borderScale],
    // Province hairlines stay OUT OF THE WAY until you are genuinely inside a
    // country. They used to reach 0.6 opacity by z6.5 — a whole continent's worth
    // of internal subdivisions drawn over the political map at the zoom where the
    // player is reading BORDERS, which is the one thing the black lines should be
    // showing. The original barely hints at them until you are close, so: nothing
    // before z7.5, a whisper at z9, and readable only past z12 where a province is
    // actually the subject.
    //
    // WIDTH ALONE IS NOT WHAT "THICKER" MEANS HERE. These draw at 14% opacity at
    // z9 and 40% at z12, so doubling their width changes almost nothing a player
    // can see — the limiting dial is the opacity, not the pixels. The setting
    // moves both. Capped at 0.85 so they never read as hard borders however far
    // it is pushed, and the z7.5 anchor stays at zero because "not while you are
    // looking at a continent" is the design, not a value to scale.
    //
    // The zoom ends are the player's now (the original exposes exactly this as
    // "Border Fade Range"), but the SHAPE is not: borderFadeStops keeps the
    // measured 9 and 12 at their proportional place inside whatever range is
    // chosen. Defaults reproduce 7.5/9/12/14 exactly.
    "line-opacity": worldKnown
      ? ["interpolate", ["linear"], ["zoom"],
        fadeStops[0], 0,
        fadeStops[1], Math.min(0.85, 0.35 * borderScale),
        fadeStops[2], Math.min(0.85, 0.65 * borderScale),
        fadeStops[3], Math.min(0.85, 0.8 * borderScale)]
      : 0,
  };

  // Scenario-authored label styling (world.labelFont/labelTextColor/
  // labelHaloColor). The style has no glyphs endpoint, so MapLibre v5 draws
  // every glyph locally with this stack as a CSS font-family — any font on the
  // PLAYER's machine works, with the trailing names as fallbacks where the
  // first is not installed.
  const labelFontStack = useMemo(
    () => [labelFont || "Impact", "Arial Black", "sans-serif"],
    [labelFont],
  );

  const pointLabelLayoutBase = useMemo(() => ({
    "text-field": ["get", "name"],
    "text-font": labelFontStack,
    "text-size": buildCountryTextSize(1, isGlobe),
    "text-rotate": ["get", "rotation"],
    "text-anchor": "center",
    "text-pitch-alignment": "map",
    "text-rotation-alignment": "map",
    "text-keep-upright": false,
    // Tracking, matched by eye to the original's screenshots — its country names
    // are widely letterspaced, and that spacing is most of what makes them read
    // as a map's top rank rather than as large city labels. LAYOUT, not paint:
    // written into labelLayerPaint it was rejected as an unknown property on
    // every style pass and never reached the screen.
    "text-letter-spacing": LABEL_LETTER_SPACING,
    visibility: mapDisplaySettings.hideCountryLabels ? "none" : "visible",
  }), [isGlobe, labelFontStack, mapDisplaySettings.hideCountryLabels]);

  // A country's own label always draws — it is standing on its own ground and
  // nothing else has a better claim to that spot. A LEADER label is different:
  // it has been moved off its country into shared space, and 71 of them are
  // eligible world-wide, most of them islands packed into the Caribbean and
  // the Pacific. With overlap allowed they would stack into an unreadable
  // smear there, so leader labels alone submit to collision culling and the
  // ones that lose simply are not drawn at that zoom.
  //
  // The split lives in two layers filtered on `leader`, NOT in one case
  // expression: text-allow-overlap is a layout property MapLibre accepts only
  // as a constant, and a data expression there is rejected with a console
  // error on every style pass while every label silently falls back to the
  // default (false) — the exact opposite of what the country half wants.
  const pointLabelLayerLayout = useMemo(
    () => ({ ...pointLabelLayoutBase, "text-allow-overlap": true }),
    [pointLabelLayoutBase],
  );
  const leaderLabelLayerLayout = useMemo(
    () => ({ ...pointLabelLayoutBase, "text-allow-overlap": false }),
    [pointLabelLayoutBase],
  );

  // The minor rank — an owner's outlying clusters (countryLabels.js explains
  // what tier is). Same face and colour, one size down, and it takes the leader
  // labels' side of the split above: an archipelago prints its owner's name once
  // per island group (Srivijaya x10, the Dutch East Indies x9) and with overlap
  // allowed they stack into a smear over Indonesia. A possession losing its
  // label where it cannot fit is correct; the country's own name is drawn from
  // the layer above and is never the one culled.
  const minorPointLabelLayerLayout = useMemo(
    () => ({
      ...pointLabelLayoutBase,
      "text-size": buildCountryTextSize(MINOR_LABEL_SCALE, isGlobe),
      "text-allow-overlap": false,
    }),
    [isGlobe, pointLabelLayoutBase],
  );

  const curvedLabelLayerLayout = useMemo(() => ({
    "text-field": ["get", "glyph"],
    "text-font": labelFontStack,
    "text-size": buildCountryTextSize(1, isGlobe),
    "text-rotate": ["get", "rotation"],
    "text-anchor": "center",
    "text-letter-spacing": LABEL_LETTER_SPACING,
    "text-allow-overlap": true,
    "text-pitch-alignment": "map",
    "text-rotation-alignment": "map",
    "text-keep-upright": false,
    visibility: mapDisplaySettings.hideCountryLabels ? "none" : "visible",
  }), [isGlobe, labelFontStack, mapDisplaySettings.hideCountryLabels]);

  // The line is the label's own colour at half strength — it is punctuation for
  // the text, not a border, and it must never compete with a real one.
  //
  // IT FADES ON HOW BIG THE COUNTRY IS, NOT ON ZOOM.
  //
  // The reason for fading was right and the dial was wrong. "A leader line is
  // punctuation, and a country that fills the screen has nothing to point at"
  // — true, but zoom is a poor proxy for filling the screen. The old ramp went
  // 0.38 at z5 to 0 at z8, so at the zoom a player actually reads a cluster of
  // small states (z6.6, reported) every line was down to 0.18 and effectively
  // invisible: Andorra alone on a coast showed, the same line in central
  // Germany did not.
  //
  // ownScale × 2^(zoom−16) is the country's own size in the very units the text
  // is sized in (buildCountryTextSize), so this reads "fade the line out as the
  // shape it points at grows past reading size, wherever the zoom happens to
  // be". A micro-state keeps its line far deeper in than z8; a country near the
  // promotion floor loses it early, which is the original intent. Only promoted
  // shapes have lines at all, so this only ever spans ownScale < 20,000.
  const leaderLinePaint = useMemo(() => ({
    "line-color": labelTextColor || "#FFFFFF",
    "line-width": ["interpolate", ["linear"], ["zoom"], 3, 0.5, 6, 0.9, 8, 1.2],
    "line-opacity": [
      "interpolate", ["linear"],
      ["*", ["coalesce", ["get", "ownScale"], 0], ["^", 2, ["-", ["zoom"], 16]]],
      20, 0.38,
      60, 0,
    ],
  }), [labelTextColor]);

  const labelLayerPaint = useMemo(() => ({
    "text-color": labelTextColor || "#FFFFFF",
    "text-halo-color": labelHaloColor || "rgba(0, 0, 0, 0.5)",
    "text-halo-width": 1,
    // A COUNTRY LABEL DOES NOT FADE OUT AS YOU ZOOM IN.
    //
    // This used to ramp 0.75 at z5 down to 0 at z8, so the closer the player
    // got the fainter the country's own name became — and the city names beside
    // it did not fade at all. Measured against the original at the same view
    // (Riga to Moscow across the window, 13.5° of longitude in ~1060 CSS px,
    // so z ≈ 6.8): the original draws LATVIA, LITHUANIA and BYELORUSSIAN SSR
    // solid, while this curve was at 0.30 there — three times fainter than the
    // thing it is supposed to outrank. That inversion IS the reported "province
    // and country labels are the same weight": by the zoom a player reads at,
    // the country label had faded into the city labels' range.
    //
    // Flat, because the original is flat. The guard against a label smearing
    // across the screen at deep zoom is the 254 cap already inside
    // buildCountryTextSize, which is measured; a second guard that dimmed the
    // label was doing a size job with an opacity dial.
    "text-opacity": 0.75,
    // TRACKING LIVES IN LAYOUT, NOT HERE. It was written into this paint object
    // and MapLibre answered "unknown property text-letter-spacing" on every
    // style pass — 76 errors in one page load (4 label layers × 19 passes) — and
    // the tracking simply never applied, so the look this dial was matched to
    // was never on screen. Same bucket mistake as text-allow-overlap earlier
    // today: layout properties are rejected silently-ish from paint. The value
    // now sits in pointLabelLayoutBase and the curved layout beside it.
  }), [labelHaloColor, labelTextColor]);

  // Halo is the other half of weight. A 1px halo around a name set 40% smaller
  // is proportionally twice the outline, which is what makes a shrunken heavy
  // face read as a bolder blob rather than a quieter label — the exact thing
  // reported ("province and country labels are the same weight"). Halving it
  // keeps the halo the same fraction of the glyph it wraps.
  const minorLabelLayerPaint = useMemo(() => ({
    ...labelLayerPaint,
    "text-halo-width": 0.5,
  }), [labelLayerPaint]);

  return (
    <>
      {/* maxzoom 8, not the archive's 10, because 8 is what the editor can
          actually author against. z10 cannot be stitched into a seed at all —
          extract-regions.mjs completes and then dies in JSON.stringify, over V8's
          512MB max string length. z9 stitches, but 4.1M vertices then ran the
          editor's tab out of heap: Chrome killed the renderer with "Aw, Snap"
          while the machine still had 3GB free, because the cap is per-renderer.
          z8's 2.6M is stable. Rendering finer than the editor can edit only draws
          detail no map can be built against. Past z8 MapLibre overzooms, exactly
          as it already did past z10. */}
      {!customFlag && (
      <Source id="countries-fill-source" type="vector" url={countriesUrl} maxzoom={8}>
        <Layer
          id="countries-fill"
          type="fill"
          source-layer="countries"
          paint={countriesFillPaint}
        />
      </Source>
      )}

      {/* Deliberately NOT gated on customFlag, unlike countries-fill-source above —
          this source is not decoration on a custom map, it IS the map. On a
          re-ownership scenario (Modern Day, Rome, WWII: stock GADM geometry,
          nothing hand-drawn) regions-fill is the ONLY thing painting owners
          above z6.5, because custom-regions-fill-far stops at maxzoom 7 and
          FAR_FILL_FADE has already faded it to 0 by 6.5 — the crossfade hands
          off to these tiles by design. Unmounting it here left every such map
          blank past 6.5 and, via the getLayer() filter at the click handler,
          unclickable too. The hairlines are needed on stock maps as well:
          regionsOutlinePaint is gated on worldKnown, not on customActive. */}
      <Source id="regions-source" type="vector" url={regionsUrl} maxzoom={8}>
        <Layer
          id="regions-fill"
          type="fill"
          source-layer="regions"
          paint={stockRegionsFillPaint}
        />
        {/* Striped fill for disputed GADM regions on the crisp tile geometry —
            fades in with the tile fills, exactly like the color layer above. */}
        {disputedTileStops.length > 0 && (
          <Layer
            id="regions-disputed"
            type="fill"
            source-layer="regions"
            filter={editedStockIds.length
              ? ["all",
                ["in", ["get", "GID_1"], ["literal", disputedTileStops.filter((_, i) => i % 2 === 0)]],
                ["!", ["in", ["get", "GID_1"], ["literal", editedStockIds]]]]
              : ["in", ["get", "GID_1"], ["literal", disputedTileStops.filter((_, i) => i % 2 === 0)]]}
            paint={{
              "fill-pattern": ["match", ["get", "GID_1"], ...disputedTileStops, disputedTileStops[1]],
              "fill-opacity": customActive && worldKnown ? TILE_FILL_FADE : 0,
            }}
          />
        )}
        <Layer
          id="regions-outline"
          type="line"
          source-layer="regions"
          filter={editedStockIds.length ? ["!", ["in", ["get", "GID_1"], ["literal", editedStockIds]]] : ["all"]}
          paint={regionsOutlinePaint}
        />
      </Source>

      {/* Author-DRAWN geometry only (splits/new regions) — GADM regions paint the
          stock tiles above for crisp borders at every zoom. Empty (and inert)
          unless world.customRegions is set. */}
      {/* tolerance 0.6 (default is 0.375). This was tolerance 0 for a long time,
          on the reasoning that GeoJSON sources simplify per zoom and each region
          simplifies independently, so shared borders drift apart at low zoom.
          What that actually bought was staircased outlines from the separate
          world-view tier that existed to compensate; simplifying MORE, and
          dropping that tier, came out smoother (upstream 41dde56). Leaving the
          old note here as if it described the code cost an audit pass — the value
          is deliberate, not a regression. */}
      <Source id="custom-regions-source" type="geojson" data={enrichedCustomRegionData} tolerance={0.6}>
        {/* Zoomed-out fill for GADM regions from the seed geometry — the stock
            tiles are too simplified at low zoom and show sliver gaps there. */}
        <Layer
          id="custom-regions-fill-far"
          type="fill"
          maxzoom={7}
          filter={STOCK_GEOMETRY_FILTER}
          paint={{ "fill-color": CUSTOM_FILL_COLOR, "fill-opacity": customActive ? FAR_FILL_FADE : 0 }}
        />
        {/* Far hairlines from the SAME seed geometry as the far fills, so
            zoomed-out region borders sit exactly on the colored areas. They
            hand off to the stock-tile hairlines with the fill crossfade. */}
        <Layer
          id="custom-regions-hairline-far"
          type="line"
          maxzoom={7}
          filter={STOCK_GEOMETRY_FILTER}
          paint={{
            "line-color": "#000",
            "line-width": ["interpolate", ["linear"], ["zoom"], 3, 0.3 * borderScale, 6.5, 0.6 * borderScale],
            // OFF. This layer drew a hairline on every province edge from z3 to
            // z6.5 — the whole planet's internal subdivisions, at the zoom where the
            // player is reading which country is which. Pushing the TILE hairlines
            // back to z7.5 without touching this one produced the exact inversion
            // reported: borders visible zoomed out, gone zoomed in, because these
            // were the ones being seen.
            //
            // Nothing is lost by silencing them. Every region is filled with its
            // OWNER's colour, so two provinces of one country share a fill and the
            // hairline between them is the only thing that ever made a country look
            // subdivided — while two different countries meet at a colour change,
            // which reads as a border without any line at all. Silencing this is
            // what makes a country render as one mass at world zoom, which is how
            // the original looks.
            "line-opacity": 0,
          }}
        />
        {/* Striped fill over disputed regions: far twin for GADM seed geometry,
            all-zoom twin for author-drawn shapes. The stripes REPLACE the solid
            look (they sit above it at the same opacity, administrator's color
            first), so a contested border reads at a glance. */}
        <Layer
          id="custom-regions-disputed-far"
          type="fill"
          maxzoom={7}
          filter={["all", STOCK_GEOMETRY_FILTER, ["has", "_stripes"]]}
          paint={{ "fill-pattern": ["get", "_stripes"], "fill-opacity": customActive ? FAR_FILL_FADE : 0 }}
        />
        <Layer
          id="custom-regions-fill"
          type="fill"
          filter={AUTHORED_GEOMETRY_FILTER}
          paint={{ "fill-color": CUSTOM_FILL_COLOR, "fill-opacity": 0.72 }}
        />
        <Layer
          id="custom-regions-disputed"
          type="fill"
          filter={["all", AUTHORED_GEOMETRY_FILTER, ["has", "_stripes"]]}
          paint={{ "fill-pattern": ["get", "_stripes"], "fill-opacity": customActive ? 0.72 : 0 }}
        />
        <Layer
          id="custom-regions-outline"
          type="line"
          filter={AUTHORED_GEOMETRY_FILTER}
          paint={{
            "line-color": "#000",
            "line-width": [
              "interpolate", ["linear"], ["zoom"],
              3, 0.2 * borderScale,
              8, 0.6 * borderScale,
              12, 1.0 * borderScale,
            ],
            // A PROVINCE LINE HAS NO BUSINESS AT WORLD ZOOM, and this lane was
            // the one place still drawing one. Its stock twin above is silenced
            // outright (line-opacity 0) with the reason written next to it: at
            // the zoom where a player reads which country is which, internal
            // subdivisions are noise, and the original draws a country as one
            // mass. The tile hairlines were pushed back to z7.5 for the same
            // reason. This curve was still coming up at z4 and holding 0.35
            // across the whole world view — the reported "zoomed out and the
            // province lines are all there", and it fades neither in nor out.
            //
            // Worse from 2026-08-16: the tiled:false routing moved ~1,462
            // regions a board into THIS lane, so China, India, Italy, France
            // and Spain would have arrived here drawn in full province detail
            // at world zoom. Fixing the fill without this would have traded one
            // reported defect for a louder one.
            //
            // Now it comes up where the tiles' own hairlines do — nothing below
            // 6.5, full by 8 — so the two lanes fade in together and the line
            // appears as you zoom into it rather than being there all along.
            "line-opacity": customActive
              ? ["interpolate", ["linear"], ["zoom"], 6.5, 0, 8, 0.6]
              : 0,
          }}
        />
      </Source>

      {/* NATIONAL BORDERS — above every fill, below every label.
          Position is the point: as the first source in this file its layers sat
          at the BOTTOM of the stack, under 0.72-opacity region fills that would
          have muted the line to a grey smudge even once it was ungated. A border
          belongs on top of the colour it divides. */}
      <Source id="countries-source" type="vector" url={countriesUrl} maxzoom={8}>
        <Layer
          id="countries-outline"
          type="line"
          source-layer="countries"
          filter={countriesOutlineFilter}
          paint={countriesOutlinePaint}
        />
      </Source>

      {/* The board's OWN national border, wherever level 0 above went quiet.
          Same weight curve and the same player setting, because it is the same
          line — only drawn where ownership changes instead of where the modern
          world does. Built at preset time by a segment dissolve over the region
          geometry; scripts/presets/lib/ownerBorders.mjs carries the measurements.

          What it cannot know is a province taken DURING the campaign: the file
          is the board as it opened. That is the gap diverged-borders fills, at
          this same weight — and why it is mounted AFTER this layer, so a line
          drawn by a conquest sits above the line the board shipped with. */}
      <Source id="owner-border-source" type="geojson" data={ownerBorderData}>
        <Layer
          id="owner-borders"
          type="line"
          layout={{ "line-cap": "round", "line-join": "round" }}
          paint={countriesOutlinePaint}
        />
      </Source>

      {/* Only mounted when land has actually changed hands. */}
      {divergedRegionIds.length > 0 && (
        <Source id="diverged-borders-source" type="vector" url={regionsUrl} maxzoom={8}>
          <Layer
            id="diverged-borders"
            type="line"
            source-layer="regions"
            filter={["in", ["get", "GID_1"], ["literal", divergedRegionIds]]}
            paint={divergedBorderPaint}
          />
        </Source>
      )}

      {/* Under the labels, above the fills: a hairline from a country too small
          to hold its name out to where the name actually is. Same opacity ramp
          as the labels themselves, so the line never outlives the text it
          points at. */}
      <Source id="country-leader-line-source" type="geojson" data={activeLeaderLineData}>
        <Layer
          id="country-leader-lines"
          type="line"
          layout={{ "line-cap": "round" }}
          paint={leaderLinePaint}
        />
      </Source>

      <Source id="country-curved-label-source" type="geojson" data={activeCurvedLabelData}>
        <Layer
          id="country-curved-labels"
          type="symbol"
          layout={curvedLabelLayerLayout}
          paint={labelLayerPaint}
        />
      </Source>

      <Source id="country-point-label-source" type="geojson" data={activePointLabelData}>
        {/* FOUR LAYERS, ONE SOURCE — and none of the splits could be a case
            expression inside one. text-allow-overlap is layout-only and
            constant-only (see the note above the layouts), and text-size, halo
            and text-field are per-layer too, so each rank of label has to be
            its own layer filtered on the property that names it.

            leader and tier never co-occur — leader labels belong to the stock
            set and tier to the owner set, and a world draws one or the other —
            but the filters are written as if they could, because a filter that
            is only correct by accident stops being correct when the accident
            does. `curved` is the owner lane's own: a seat whose name would not
            fit flat is emitted as one feature PER GLYPH, and those must not
            reach the three text-field:name layers or every glyph prints the
            whole name. */}
        <Layer
          id="country-labels"
          type="symbol"
          filter={["all", ["!=", ["get", "leader"], 1], ["!=", LABEL_TIER, 1], ["!=", ["get", "curved"], 1]]}
          layout={pointLabelLayerLayout}
          paint={labelLayerPaint}
        />
        <Layer
          id="country-labels-leaders"
          type="symbol"
          filter={["==", ["get", "leader"], 1]}
          layout={leaderLabelLayerLayout}
          paint={labelLayerPaint}
        />
        {/* Drawn last so that when a possession's repeat collides with the name
            of the country itself, the repeat is the one that yields. */}
        <Layer
          id="country-labels-minor"
          type="symbol"
          filter={["all", ["!=", ["get", "leader"], 1], ["==", LABEL_TIER, 1], ["!=", ["get", "curved"], 1]]}
          layout={minorPointLabelLayerLayout}
          paint={minorLabelLayerPaint}
        />
        {/* THE OWNER LANE'S CURVED LABELS — the rung the original uses for
            GRAND-HESSE and SAXE-WEIMAR. One glyph per feature along a path
            traced through the seat's own territory (buildOwnerCurve), drawn
            with the SAME layout the stock curved lane would have used
            (text-field: glyph, per-glyph rotate, overlap allowed — a country
            standing on its own ground always draws) so the two lanes are the
            same typography. This layer is on the OWNER source; the stock
            curved source above stays gated on !customFlag and stays empty on
            every built board, for the reason labelCurves.js explains. */}
        <Layer
          id="country-labels-curved"
          type="symbol"
          filter={["==", ["get", "curved"], 1]}
          layout={curvedLabelLayerLayout}
          paint={labelLayerPaint}
        />
      </Source>
    </>
  );
};

export default WorldMap;

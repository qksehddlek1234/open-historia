/*! Open Historia — where a thing is allowed to stand © 2026 Nicholas Krol, MIT (see src/Editor/LICENSE). */
// IS THIS COORDINATE ACTUALLY IN THAT COUNTRY?
//
// The model writes a latitude and a longitude for every structure it founds and
// it is confidently, quietly wrong a fair share of the time. Audited on a live
// campaign, 42 markers on the map:
//
//   핵시설 정밀 타격 관제소   owner South Korea   →  Hwanghae-bukto, North Korea
//   핵 시설 정밀 타격 …센터   owner South Korea   →  Kangwŏn-do, North Korea
//   중앙아시아 데이터 센터    owner China         →  Naryn, Kyrgyzstan
//   트라이앵글 에너지 관문    owner South Korea   →  open water
//
// Two South Korean command posts sitting north of the DMZ is not a placement
// quirk; it is the map telling the player something false about their own
// country, and no amount of prompt wording fixes a number the model does not
// know. The scenario already ships the answer — regionsGeojson is the full
// admin-1 world with an `owner` on every polygon, the same geometry the political
// map is drawn from — so the engine can simply ask.
//
// WHY THE GEOMETRY IS NOT SIMPLIFIED. The first version decimated the rings to
// ~2 km vertices to save memory (55 MB of JSON down to 6.8 MB of Float32). It
// answered eight test points the same as full detail and one differently, and
// that one mattered: the corrected position for both DMZ markers, 126.976°E
// 38.200°N, reads as Gyeonggi-do / South Korea at 2 km and as Kangwŏn-do / NORTH
// KOREA at full detail. The pass would have "fixed" two markers by moving them
// from one part of North Korea to another. Near a border — which is precisely
// where every one of these failures happens — a simplified outline is not an
// approximation, it is the wrong answer. Full precision costs 19 MB of typed
// arrays and 0.6 ms a lookup. It is not worth being clever about.
//
// WHAT THIS DELIBERATELY DOES NOT DO: it does not force every structure onto its
// owner's soil. An embassy stands on foreign ground by definition, and an ally's
// airbase is a real thing a country builds. The separator is DISTANCE, not
// permission — a fumbled coordinate lands just over the nearest border, while a
// deliberate foreign posting is deep inside the host. A Chinese data centre 50 km
// into Kyrgyzstan is a typo; a Korean embassy in Washington is a decision.
import { JSON_URLS, readJson } from "./assets.js";

const normalizeString = (value) => String(value ?? "").trim();
const normalizeArray = (value) => (Array.isArray(value) ? value : []);

// A port sits ON the water and a coastline is drawn to a tolerance, so a point
// this close to its owner's own shore is treated as standing on it.
export const COAST_TOLERANCE_DEG = 0.15;

// How far a fumbled coordinate can plausibly have slipped. Past this, being in
// another country reads as intent rather than error.
export const NEAR_MISS_DEG = 1.5;

// A placement further than this from any of the owner's land is not a slip and
// not obviously deliberate either — it is left alone and reported, because
// hauling a structure a thousand kilometres on a guess is the worse mistake.
export const REACH_DEG = 6;

// Standing on someone else's soil is the entire point of these.
const EXTRATERRITORIAL_KINDS = new Set(["embassy", "consulate", "mission", "legation"]);

// ---- the index ------------------------------------------------------------
//
// Rings are stored as flat Float32 coordinate pairs (1 m resolution, far finer
// than any border here is drawn) and everything else in parallel typed arrays.
// Region identity is interned: 3,662 regions across 107,000 rings, so holding a
// name per ring would cost more than the geometry does.

export const EMPTY_TERRITORY_INDEX = { bounds: new Float32Array(0), owners: [], regionOfRing: new Uint32Array(0), regions: [], rings: [] };

export const buildTerritoryIndex = (features) => {
  const owners = [];
  const ownerSlot = new Map();
  const regions = [];
  const rings = [];
  const regionOfRing = [];
  const bounds = [];

  for (const feature of normalizeArray(features)) {
    const properties = feature?.properties ?? {};
    // Sea polygons must never answer "which country is this coordinate in" — a
    // point at sea is in no country, which is the finding, not a lookup failure.
    //
    // BOTH KEYS. The scenario's own geometry marks them typeId:"sea"; the shipped
    // sea file (runtime/seaRegions.js) marks them kind:"sea" and carries no
    // typeId at all. Checking only typeId meant that the moment sea features
    // reached this index — which a save made while seas were still opt-in does,
    // because it embedded its own copy — every coordinate in the Strait of
    // Malacca would answer as land belonging to whoever held the water.
    if (normalizeString(properties.typeId).toLowerCase() === "sea") continue;
    if (normalizeString(properties.kind).toLowerCase() === "sea") continue;
    const geometry = feature?.geometry;
    const polygons = geometry?.type === "Polygon"
      ? [geometry.coordinates]
      : (geometry?.type === "MultiPolygon" ? geometry.coordinates : []);
    if (polygons.length === 0) continue;

    const owner = normalizeString(properties.owner);
    const ownerKey = owner.toLowerCase();
    let slot = ownerSlot.get(ownerKey);
    if (slot === undefined) {
      slot = owners.length;
      owners.push(owner);
      ownerSlot.set(ownerKey, slot);
    }
    const regionIndex = regions.length;
    regions.push({ id: normalizeString(properties.id), name: normalizeString(properties.name), owner: slot });

    for (const polygon of normalizeArray(polygons)) {
      // Outer ring only. A hole in an admin-1 polygon is an enclave of another
      // region of the SAME country far more often than it is open water, so
      // ignoring holes costs nothing at country resolution and halves the work.
      const outer = normalizeArray(polygon)[0];
      if (!Array.isArray(outer) || outer.length < 4) continue;
      const flat = new Float32Array(outer.length * 2);
      let n = 0;
      let minLng = 180;
      let minLat = 90;
      let maxLng = -180;
      let maxLat = -90;
      for (const point of outer) {
        const lng = Number(point?.[0]);
        const lat = Number(point?.[1]);
        if (!Number.isFinite(lng) || !Number.isFinite(lat)) continue;
        flat[n] = lng;
        flat[n + 1] = lat;
        n += 2;
        if (lng < minLng) minLng = lng;
        if (lng > maxLng) maxLng = lng;
        if (lat < minLat) minLat = lat;
        if (lat > maxLat) maxLat = lat;
      }
      if (n < 8) continue;
      rings.push(n === flat.length ? flat : flat.subarray(0, n));
      regionOfRing.push(regionIndex);
      bounds.push(minLng, minLat, maxLng, maxLat);
    }
  }

  return {
    bounds: Float32Array.from(bounds),
    owners,
    regionOfRing: Uint32Array.from(regionOfRing),
    regions,
    rings,
  };
};

const ringContains = (ring, lng, lat) => {
  let inside = false;
  for (let i = 0, j = ring.length - 2; i < ring.length; j = i, i += 2) {
    const lngI = ring[i];
    const latI = ring[i + 1];
    const lngJ = ring[j];
    const latJ = ring[j + 1];
    if ((latI > lat) !== (latJ > lat)
      && lng < ((lngJ - lngI) * (lat - latI)) / (latJ - latI) + lngI) {
      inside = !inside;
    }
  }
  return inside;
};

const ownerOfRegion = (index, region, overrides) =>
  normalizeString(overrides?.[region.id]) || index.owners[region.owner];

// Which region this coordinate falls in, or null for open water. `overrides` is
// world.regionOwnershipOverrides — conquest moves a region without moving its
// geometry, so the stored owner has to win over the file's.
export const locateRegion = (index, lng, lat, overrides = {}) => {
  if (!index || index.rings.length === 0) return null;
  if (!Number.isFinite(lng) || !Number.isFinite(lat)) return null;
  for (let i = 0; i < index.rings.length; i += 1) {
    const box = i * 4;
    if (lng < index.bounds[box] || lng > index.bounds[box + 2]
      || lat < index.bounds[box + 1] || lat > index.bounds[box + 3]) continue;
    if (!ringContains(index.rings[i], lng, lat)) continue;
    const region = index.regions[index.regionOfRing[i]];
    return { id: region.id, name: region.name, owner: ownerOfRegion(index, region, overrides) };
  }
  return null;
};

const sameOwner = (a, b) => normalizeString(a).toLowerCase() === normalizeString(b).toLowerCase();

// Longitude converges toward the poles; without this a degree of longitude at
// 60°N would read as twice the distance it is.
const lngScale = (lat) => Math.max(0.2, Math.cos((lat * Math.PI) / 180));

// The nearest point on the owner's own territory, and how far away it is in
// scaled degrees. `null` when the owner holds no land in this world at all.
//
// SEGMENTS, NOT VERTICES. The first version measured to the nearest vertex, which
// is wrong wherever a border runs straight: a long stretch of coast drawn with
// two endpoints has no vertex anywhere near its middle, so a structure 40 km
// offshore measured as hundreds of kilometres from home and was written off as a
// deliberate overseas posting. Distance to the EDGE is the thing being asked for.
export const nearestOwnedPoint = (index, owner, lng, lat, overrides = {}) => {
  if (!index || index.rings.length === 0) return null;
  if (!Number.isFinite(lng) || !Number.isFinite(lat)) return null;
  const wanted = normalizeString(owner);
  if (!wanted) return null;

  const scale = lngScale(lat);
  const x = lng * scale;
  let best = null;
  let bestDistance = Infinity;

  for (let i = 0; i < index.rings.length; i += 1) {
    const region = index.regions[index.regionOfRing[i]];
    if (!sameOwner(ownerOfRegion(index, region, overrides), wanted)) continue;
    // Cheap reject: a ring whose bounding box is already further than the best
    // point found so far cannot contain a nearer one.
    const box = i * 4;
    const boxLng = Math.max(index.bounds[box] - lng, 0, lng - index.bounds[box + 2]) * scale;
    const boxLat = Math.max(index.bounds[box + 1] - lat, 0, lat - index.bounds[box + 3]);
    if (Math.hypot(boxLng, boxLat) >= bestDistance) continue;

    const ring = index.rings[i];
    for (let v = 0, w = ring.length - 2; v < ring.length; w = v, v += 2) {
      const ax = ring[w] * scale;
      const ay = ring[w + 1];
      const bx = ring[v] * scale;
      const by = ring[v + 1];
      const dx = bx - ax;
      const dy = by - ay;
      const span = dx * dx + dy * dy;
      // A degenerate segment (both ends the same point) collapses to its start.
      const t = span > 0 ? Math.max(0, Math.min(1, ((x - ax) * dx + (lat - ay) * dy) / span)) : 0;
      const px = ax + t * dx;
      const py = ay + t * dy;
      const distance = Math.hypot(px - x, py - lat);
      if (distance < bestDistance) {
        bestDistance = distance;
        best = { lat: py, lng: px / scale, ring: i };
      }
    }
  }

  if (!best) return null;
  return { distance: bestDistance, lat: best.lat, lng: best.lng, ring: best.ring };
};

const ringCentroid = (ring) => {
  let lng = 0;
  let lat = 0;
  const count = ring.length / 2;
  for (let i = 0; i < ring.length; i += 2) {
    lng += ring[i];
    lat += ring[i + 1];
  }
  return { lat: lat / count, lng: lng / count };
};

// A border point is ON the line, and a structure drawn exactly on a border reads
// as being in the wrong country half the time it is tested — which would move it
// again next turn, and the turn after. Step in toward the middle of the region it
// belongs to until the coordinate actually answers as its owner's.
//
// Returns null when no step lands inside. That is a real outcome, not a fallback
// to be papered over: a coastal sliver or a border salient can defeat this, and
// moving a structure to a spot that still tests wrong is worse than leaving it.
const stepInward = (index, hit, owner, overrides) => {
  const ring = index.rings[hit.ring];
  const centre = ringCentroid(ring);
  const toLng = centre.lng - hit.lng;
  const toLat = centre.lat - hit.lat;
  const span = Math.hypot(toLng, toLat) || 1;
  for (const inset of [0.02, 0.05, 0.1, 0.2, 0.4]) {
    const lng = hit.lng + (toLng / span) * inset;
    const lat = hit.lat + (toLat / span) * inset;
    const at = locateRegion(index, lng, lat, overrides);
    if (at && sameOwner(at.owner, owner)) return { lat, lng };
  }
  return null;
};

export const PLACEMENT = {
  abroad: "abroad",              // deliberate foreign posting — left alone
  coastal: "coastal",            // on its owner's shore, within tolerance — left alone
  ok: "ok",
  sea: "sea",                    // open water near its owner — moved ashore
  stranded: "stranded",          // nowhere to put it — left alone, reported
  unknown: "unknown",            // no geometry, no owner, or no coordinate to judge
  wrongCountry: "wrong-country", // just over a border — moved back
};

// The whole judgement for one placement. Pure: hand it an index and it says what
// is wrong and where the thing should stand instead. `moveTo` present means, and
// only ever means, "this coordinate has been checked and answers as the owner's".
export const placementVerdict = (index, { kind = "", lat, lng, overrides = {}, owner } = {}) => {
  if (!index || index.rings.length === 0) return { status: PLACEMENT.unknown };
  if (!Number.isFinite(lng) || !Number.isFinite(lat)) return { status: PLACEMENT.unknown };
  // No owner means nothing to check it against — a marker nobody runs is a
  // separate problem and not this pass's to invent an answer for.
  if (!normalizeString(owner)) return { status: PLACEMENT.unknown };

  const at = locateRegion(index, lng, lat, overrides);
  if (at && sameOwner(at.owner, owner)) return { at, status: PLACEMENT.ok };
  if (EXTRATERRITORIAL_KINDS.has(normalizeString(kind).toLowerCase())) {
    return { at, status: PLACEMENT.abroad };
  }

  const nearest = nearestOwnedPoint(index, owner, lng, lat, overrides);
  if (!nearest) return { at, status: PLACEMENT.stranded };
  if (!at && nearest.distance <= COAST_TOLERANCE_DEG) return { at, status: PLACEMENT.coastal };

  // Too far to be a slip. On someone's land that reads as a deliberate posting;
  // out at sea it reads as nothing anyone can fix by guessing, so it is reported.
  if (nearest.distance > (at ? NEAR_MISS_DEG : REACH_DEG)) {
    return { at, distance: nearest.distance, status: at ? PLACEMENT.abroad : PLACEMENT.stranded };
  }

  const moveTo = stepInward(index, nearest, owner, overrides);
  if (!moveTo) return { at, distance: nearest.distance, status: PLACEMENT.stranded };
  return {
    at,
    distance: nearest.distance,
    moveTo,
    status: at ? PLACEMENT.wrongCountry : PLACEMENT.sea,
  };
};

// ---- loading --------------------------------------------------------------

let indexPromise = null;
let indexKey = "";

// Read once per scenario and keep only the typed-array index. Resolves to an
// empty index on any failure — a scenario with no geometry simply gets no
// placement check, never a broken turn.
export const loadTerritoryIndex = async () => {
  const key = JSON_URLS.regionsGeojson;
  if (indexPromise && indexKey === key) return indexPromise;
  indexKey = key;
  const promise = (async () => {
    const geojson = await readJson(key, { defaultValue: null });
    const features = normalizeArray(geojson?.features);
    if (features.length === 0) return EMPTY_TERRITORY_INDEX;
    return buildTerritoryIndex(features);
  })().catch(() => EMPTY_TERRITORY_INDEX);
  indexPromise = promise;
  return promise;
};

export const __resetTerritoryIndexForTests = () => {
  indexPromise = null;
  indexKey = "";
};

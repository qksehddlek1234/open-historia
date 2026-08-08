/*! Open Historia — a structure stands where its name says © 2026 Nicholas Krol, MIT (see src/Editor/LICENSE). */
// THE NAME SAYS ONE PLACE AND THE PIN IS SOMEWHERE ELSE.
//
// Six times now, on one campaign:
//
//   "말라카 해협 인근" ……………… in Busan's coastal water, 4,900 km from the strait
//   "제주 강화 방어 구역" ………… in Gangwon, 475 km from Jeju
//   "경상 스마트팜 및 물류 허브" … in Gangwon, 104 km from either Gyeongsang
//   two more "제주" structures ……… also in Gangwon
//
// The cause is visible in the ops themselves: the model reuses a coordinate it
// has already written this turn and attaches a new name to it. It is not lost —
// it names the province correctly and then does not spend a second thought on
// the numbers. So the name is the reliable half and the coordinate is the sloppy
// half, and the repair is to move the structure to the place it is named after
// rather than to strip the name it got right.
//
// WHY DISTANCE AND NOT CONTAINMENT. Measured over the eleven structures on the
// live map whose names contain a region:
//
//   0 km    x6   경기 / 부산 / 강원도 / 울산+부산 …………………… inside, nothing to do
//   5 km         트라이앵글 에너지 관문(울산) ……………………… just past the city line
//   6 km         울산 SMR 통합 발전소 ………………………………… just past the city line
//   9.2 km       쿠알라룸푸르 긴급 보안 통제 구역 ………………… in the metro, not the district
//   104.4 km     경상 스마트팜 및 물류 허브 ……………………… WRONG
//   475.2 km     제주 강화 방어 구역 ……………………………… WRONG
//
// A plant six kilometres outside Ulsan's administrative line is what an Ulsan
// plant is; containment would have moved all three of those and been wrong every
// time. Nothing sits between 9 and 104 km, so the bar is not a judgement call.
import { locateRegion } from "./territory.js";

const normalizeString = (value) => String(value ?? "").trim();
const normalizeArray = (value) => (Array.isArray(value) ? value : []);

// The empty band runs 9 -> 104 km on the measurement above. 50 sits in the middle
// of it and is also about as far as a place name stretches in ordinary speech.
export const PLACE_NAME_TOLERANCE_KM = 50;

// A two-character run is not a place. It is 시, 도, 군 and every other suffix a
// Korean name ends in, and matching on those would put half the map in Jeju.
const MIN_LOCAL_CHARS = 2;

// Longitude converges toward the poles.
const lngScale = (lat) => Math.max(0.2, Math.cos((lat * Math.PI) / 180));

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

// Distance from a point to a segment, in scaled degrees. Segments, not vertices —
// the same correction nearestOwnedPoint needed, for the same reason: a straight
// stretch of coast has no vertex anywhere near its middle.
const segmentDistance = (lng, lat, aLng, aLat, bLng, bLat) => {
  const scale = lngScale(lat);
  const px = (lng - aLng) * scale;
  const py = lat - aLat;
  const dx = (bLng - aLng) * scale;
  const dy = bLat - aLat;
  const length = dx * dx + dy * dy;
  let t = length > 0 ? (px * dx + py * dy) / length : 0;
  t = Math.max(0, Math.min(1, t));
  return { distance: Math.hypot(px - t * dx, py - t * dy), lat: aLat + t * dy, lng: aLng + (t * dx) / scale };
};

// EVERY REGION OF ONE COUNTRY, KEYED BY ITS NAME IN THE PLAYER'S LANGUAGE.
//
// Owner-scoped deliberately, and this is the part that has to be right. Korean
// renderings of foreign region names collide hard with ordinary Korean nouns —
// on the first draft of this pass "센터" matched Centre-Val de Loire and "산"
// matched San Pedro de Macorís, so a strike-analysis centre in Gyeonggi was a
// candidate for relocation to France. A structure is only ever compared against
// the regions of its OWN country, which removes the whole class.
export const buildPlaceIndex = (territoryIndex, dictionary) => {
  const byOwner = new Map();
  if (!territoryIndex || !Array.isArray(territoryIndex.regions)) return byOwner;
  const localOf = new Map();
  for (const entry of normalizeArray(dictionary)) {
    const english = normalizeString(entry?.english);
    const local = normalizeString(entry?.local);
    if (!english || local.length < MIN_LOCAL_CHARS) continue;
    localOf.set(english.toLowerCase(), local);
  }
  if (localOf.size === 0) return byOwner;

  for (let ring = 0; ring < territoryIndex.rings.length; ring += 1) {
    const region = territoryIndex.regions[territoryIndex.regionOfRing[ring]];
    if (!region) continue;
    const local = localOf.get(normalizeString(region.name).toLowerCase());
    if (!local) continue;
    const owner = normalizeString(territoryIndex.owners[region.owner]);
    if (!owner) continue;
    const key = owner.toLowerCase();
    const places = byOwner.get(key) ?? new Map();
    const place = places.get(local) ?? { local, name: region.name, rings: [] };
    place.rings.push(ring);
    places.set(local, place);
    byOwner.set(key, places);
  }
  return byOwner;
};

// The place this structure is named after, or null. Longest match wins, so a name
// carrying both 경상북도 and 경상 resolves to the specific one; a bare prefix is
// accepted only for names long enough that the prefix still means something,
// because the catalogue stores 경상북도 and a person writes 경상.
const namedPlace = (places, markerName) => {
  const name = normalizeString(markerName);
  if (!name || !places) return null;
  let best = null;
  for (const place of places.values()) {
    const full = name.includes(place.local);
    const prefix = !full && place.local.length >= 3 && name.includes(place.local.slice(0, MIN_LOCAL_CHARS));
    if (!full && !prefix) continue;
    const length = full ? place.local.length : MIN_LOCAL_CHARS;
    if (!best || length > best.length) best = { length, places: [place] };
    else if (length === best.length) best.places.push(place);
  }
  return best;
};

// How far this coordinate is from the named place, and the nearest point on it.
// Zero when the coordinate is inside. Several regions can share one written form
// — 경상 is two provinces — and the nearest of them is the one that answers.
const reachPlace = (territoryIndex, places, lng, lat) => {
  let best = null;
  for (const place of places) {
    for (const ringIndex of place.rings) {
      const ring = territoryIndex.rings[ringIndex];
      if (!ring || ring.length < 8) continue;
      if (ringContains(ring, lng, lat)) return { distance: 0, inside: true, place };
      for (let i = 0, j = ring.length - 2; i < ring.length; j = i, i += 2) {
        const hit = segmentDistance(lng, lat, ring[j], ring[j + 1], ring[i], ring[i + 1]);
        if (!best || hit.distance < best.distance) best = { ...hit, inside: false, place, ring: ringIndex };
      }
    }
  }
  return best;
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

export const PLACE = {
  ok: "ok",             // inside the place it is named after, or near enough
  unnamed: "unnamed",   // the name carries no place this owner holds — not this pass's business
  unknown: "unknown",   // no geometry or no coordinate to judge
  misplaced: "misplaced",
  stranded: "stranded", // named a real place and no step lands inside it — reported, not moved
};

// WATER BELONGS TO NOBODY, WHICH IS WHY OWNER-SCOPING CANNOT SEE IT.
//
// "말라카 해상 보안 통제 허브", built in Busan's coastal water — 4,900 km from
// the Strait of Malacca — has now survived four rounds of this pass, and the
// reason is structural rather than a missed case. Everything above is scoped to
// the structure's OWN country's regions, because Korean renderings of foreign
// region names collide with ordinary nouns. A strait is in nobody's country, so
// a South Korean facility named after one has nothing to be compared against.
// (Melaka the Malaysian state IS in the catalogue, but the translation cache
// renders it 메라카 and the model writes 말라카, so even unscoped it would miss.)
//
// So: a short, explicit list of the named waters a maritime campaign actually
// writes about, with a point and a radius. Not a gazetteer of the world — every
// entry here is one this campaign has produced a structure for, or an obvious
// neighbour of one, and an unlisted water simply falls through to `unnamed` and
// is left alone. The radius is generous because a strait is not a point: the
// question is "is this thing anywhere near the water it is named for", and 4,900
// km is not a borderline call.
//
// THE POINT IS ON THE SHORE, NOT IN THE WATER. A structure dropped mid-strait
// would be read as open sea by the country check that runs straight after this
// one and either dragged ashore somewhere arbitrary or written off as stranded —
// so each entry names the landfall a facility for that water would actually
// stand on. On foreign soil, which the country check already understands: it
// reports an overseas posting and leaves it alone, which is what a Korean
// maritime hub on the Malacca Strait is.
export const NAMED_WATERS = [
  { aliases: ["말라카", "믈라카", "말레이 해협"], km: 500, label: "말라카 해협", lat: 2.19, lng: 102.25 },
  { aliases: ["호르무즈"], km: 400, label: "호르무즈 해협", lat: 27.18, lng: 56.28 },
  { aliases: ["수에즈"], km: 400, label: "수에즈 운하", lat: 29.97, lng: 32.53 },
  { aliases: ["바브엘만데브", "밥엘만데브"], km: 400, label: "바브엘만데브 해협", lat: 11.59, lng: 43.14 },
  { aliases: ["남중국해", "남중국 해"], km: 900, label: "남중국해", lat: 20.04, lng: 110.35 },
  { aliases: ["동중국해", "동중국 해"], km: 700, label: "동중국해", lat: 30.0, lng: 122.1 },
  { aliases: ["대한해협", "쓰시마 해협"], km: 300, label: "대한해협", lat: 35.1, lng: 129.05 },
  { aliases: ["베링 해협", "베링해협"], km: 500, label: "베링 해협", lat: 64.5, lng: -165.4 },
  { aliases: ["지브롤터"], km: 400, label: "지브롤터 해협", lat: 36.14, lng: -5.35 },
  { aliases: ["보스포루스", "보스포러스"], km: 300, label: "보스포루스 해협", lat: 41.05, lng: 29.0 },
];

const namedWater = (name) => {
  const haystack = normalizeString(name);
  if (!haystack) return null;
  for (const water of NAMED_WATERS) {
    for (const alias of water.aliases) {
      if (haystack.includes(alias)) return water;
    }
  }
  return null;
};

// The whole judgement for one structure. Pure. `moveTo` present means, and only
// ever means, "this coordinate has been checked and answers as the named place".
export const placeNameVerdict = (territoryIndex, placeIndex, { lat, lng, name, owner } = {}) => {
  if (!territoryIndex || !territoryIndex.rings?.length) return { status: PLACE.unknown };
  if (!Number.isFinite(lng) || !Number.isFinite(lat)) return { status: PLACE.unknown };

  // Water first: it is unambiguous where a province name might not be, and a
  // structure named for a strait is named for the strait whoever owns it.
  const water = namedWater(name);
  if (water) {
    const away = Math.hypot((water.lng - lng) * lngScale(lat), water.lat - lat) * 111;
    if (away <= water.km) return { km: away, place: water.label, status: PLACE.ok };
    return { km: away, moveTo: { lat: water.lat, lng: water.lng }, place: water.label, status: PLACE.misplaced };
  }

  const places = placeIndex?.get(normalizeString(owner).toLowerCase());
  if (!places || places.size === 0) return { status: PLACE.unnamed };
  const match = namedPlace(places, name);
  if (!match) return { status: PLACE.unnamed };

  const reach = reachPlace(territoryIndex, match.places, lng, lat);
  if (!reach) return { status: PLACE.unknown };
  const km = reach.distance * 111;
  if (reach.inside || km <= PLACE_NAME_TOLERANCE_KM) {
    return { km, place: reach.place.local, status: PLACE.ok };
  }

  // The region has to still be its owner's at the destination — conquest moves
  // ownership without moving geometry, and a structure must not be sent into
  // someone else's land because the file remembers the border differently.
  const holds = (nextLng, nextLat) => {
    const at = locateRegion(territoryIndex, nextLng, nextLat);
    return Boolean(at) && normalizeString(at.owner).toLowerCase() === normalizeString(owner).toLowerCase();
  };
  const land = (nextLng, nextLat) =>
    ({ km, moveTo: { lat: nextLat, lng: nextLng }, place: reach.place.local, status: PLACE.misplaced });

  // THE DESTINATION IS THE PLACE'S MAIN BODY, NOT ITS NEAREST SCRAP OF LAND.
  //
  // Jeju is one island of 175 points plus a dozen islets 0.01-0.04 degrees
  // across, and from Gangwon the nearest ring is an islet — so aiming at the
  // nearest ring either drops the structure on a rock a few hundred metres wide
  // or, when the islet is smaller than the smallest step, fails outright and
  // reports it stranded 475 km from Jeju. Neither is the answer. The premise of
  // this whole pass is that the coordinate carries no intent worth preserving, so
  // the target is the largest ring of the matched place; nearest-point-on-it then
  // still puts the structure on the side facing where it was written.
  //
  // Largest by EXTENT, not by vertex count: point count measures how finely a
  // coastline was traced, not how big it is, and a coarsely drawn province can
  // carry fewer points than a lovingly detailed islet.
  let biggest = null;
  for (const ringIndex of reach.place.rings) {
    const candidate = territoryIndex.rings[ringIndex];
    if (!candidate || candidate.length < 8) continue;
    const box = ringIndex * 4;
    const midLat = (territoryIndex.bounds[box + 1] + territoryIndex.bounds[box + 3]) / 2;
    const width = (territoryIndex.bounds[box + 2] - territoryIndex.bounds[box]) * lngScale(midLat);
    const area = Math.abs(width) * Math.abs(territoryIndex.bounds[box + 3] - territoryIndex.bounds[box + 1]);
    if (!biggest || area > biggest.area) biggest = { area, ring: candidate };
  }
  if (!biggest) return { km, place: reach.place.local, status: PLACE.stranded };

  const ring = biggest.ring;
  let approach = null;
  for (let i = 0, j = ring.length - 2; i < ring.length; j = i, i += 2) {
    const hit = segmentDistance(lng, lat, ring[j], ring[j + 1], ring[i], ring[i + 1]);
    if (!approach || hit.distance < approach.distance) approach = hit;
  }

  // Step in off the boundary the same way the territory pass does, and for the
  // same reason: a point exactly on the line reads as inside half the time it is
  // asked, so it would be moved again next turn and the turn after.
  const centre = ringCentroid(ring);
  const toLng = centre.lng - approach.lng;
  const toLat = centre.lat - approach.lat;
  const span = Math.hypot(toLng, toLat) || 1;
  for (const inset of [0.02, 0.05, 0.1, 0.2, 0.4]) {
    const nextLng = approach.lng + (toLng / span) * inset;
    const nextLat = approach.lat + (toLat / span) * inset;
    if (!ringContains(ring, nextLng, nextLat)) continue;
    if (!holds(nextLng, nextLat)) continue;
    return land(nextLng, nextLat);
  }
  // Every step overshot, which a long thin region can do. Its middle is the one
  // point such a shape is guaranteed to have — checked, like everything here.
  if (ringContains(ring, centre.lng, centre.lat) && holds(centre.lng, centre.lat)) {
    return land(centre.lng, centre.lat);
  }
  return { km, place: reach.place.local, status: PLACE.stranded };
};

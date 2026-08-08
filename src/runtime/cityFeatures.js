/*! Open Historia — a city is a feature like any other © 2026 Nicholas Krol, MIT (see src/Editor/LICENSE). */
// A CITY WAS THE ONE THING ON THE MAP YOU COULD NOT EDIT.
//
// Everything else a player can see is a feature they can open, rename, move,
// re-own or delete: structures, units, scenario-authored cities. The 70,082
// STOCK cities are not — they live in a PMTiles archive that ships with the app,
// and the only thing the game could ever do to one was change its printed name
// (world.cityRenames, which exists precisely because nothing else was possible).
// So the feature editor listed cities from the per-game cities.geojson, and on a
// stock-cities map that file is empty and the editor showed nothing at all.
//
// The archive is immutable, but the map is a stack. A stock city that someone
// edits is PROMOTED: it becomes an ordinary world.markers entry of kind "city",
// and the stock layer stops drawing that one. From then on it is a feature like
// every other feature — the same editor, the same popup, the same related-events
// lookup, the same ownership rules.
//
// Nothing is copied wholesale: 70,082 markers in a save would be absurd. Only the
// ones somebody actually touches ever leave the archive.
const normalizeString = (value) => String(value ?? "").trim();
const normalizeArray = (value) => (Array.isArray(value) ? value : []);

export const CITY_KIND = "city";

// Same resolution the prompt context and the editor's importer use.
const citySeedUrl = () => `${(import.meta.env?.VITE_OH_PMTILES_URL || "/assets").replace(/\/$/, "")}/cities-seed.json`;

let seedPromise = null;

// 70k entries and ~4 MB of JSON, so it is fetched once, lazily, and only when a
// player actually opens the city picker — never on the map's critical path.
export const loadCitySeed = () => {
  if (!seedPromise) {
    seedPromise = fetch(citySeedUrl())
      .then((response) => (response.ok ? response.json() : []))
      .then((value) => (Array.isArray(value) ? value : []))
      .catch(() => []);
  }
  return seedPromise;
};

const isUsableCity = (city) => {
  const [lng, lat] = Array.isArray(city?.coord) ? city.coord : [];
  return Number.isFinite(lng) && Number.isFinite(lat) && normalizeString(city?.name).length > 0;
};

const isCapital = (city) => city?.capital === true
  || city?.capital === "primary"
  || (Array.isArray(city?.tags) && city.tags.includes("capital"));

// How big it draws — on the CITY band of the 0.5–3 feature scale, not the
// monument band. The first tuning put a capital at 2.5, and the first capital a
// player actually promoted (Seoul) ballooned: as a stock city its label was
// modest, as a feature it suddenly drew "monumental". Promotion's promise is
// that the city keeps its look and gains editability, so these sizes sit where
// a city label reads like a city label. A capital still outranks a megacity,
// a megacity a town — the ORDER is the feature; the amplitude was the bug.
export const citySize = (city) => {
  if (isCapital(city)) return 1.6;
  const population = Number(city?.population) || 0;
  if (population >= 5_000_000) return 1.4;
  if (population >= 1_000_000) return 1.2;
  if (population >= 250_000) return 1;
  if (population >= 50_000) return 0.8;
  return 0.6;
};

// SAME NAME, SAME POPULATION, SAME PLACE — SHOWN TWICE.
//
// The seed carries a city twice wherever its sources disagreed by a kilometre or
// two. Springfield, Missouri sits at both 37.160,-93.252 and 37.195,-93.296, each
// with population 289,041, and the picker offered both rows with nothing on
// screen to tell them apart. There is no country field in the seed, so a player
// could not have chosen between them even in principle.
//
// The rule is measured across all 70,082 entries rather than guessed. Of the
// same-name pairs, 30,054 share a population: those sit 1.6 km apart at the
// median and 6.3 km at the 99th percentile. The same-name pairs with DIFFERENT
// populations — genuinely different cities — start at 36.9 km (1st percentile).
// The two distributions do not overlap, so 25 km lies in the empty middle: it
// merges 30,020 of the 30,054 duplicates and leaves the 34 far-apart
// coincidences (two towns of identical size on different continents, up to
// 15,786 km apart) as the separate cities they really are.
const DUPLICATE_CITY_KM = 25;

const distanceKm = (a, b) => {
  const toRad = Math.PI / 180;
  const dLat = (b[1] - a[1]) * toRad;
  const dLng = (b[0] - a[0]) * toRad;
  const h = Math.sin(dLat / 2) ** 2
    + Math.cos(a[1] * toRad) * Math.cos(b[1] * toRad) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
};

// Name search, ranked so the city somebody means comes first: an exact name
// beats a prefix, a prefix beats a substring, and within each the larger city
// wins. Without the ranking, typing "Seoul" surfaces Seoul Gardens and
// Seoulderberg before Seoul.
export const searchCitySeed = (cities, query, limit = 40) => {
  const needle = normalizeString(query).toLowerCase();
  if (needle.length < 2) return [];
  const scored = [];
  for (const city of normalizeArray(cities)) {
    if (!isUsableCity(city)) continue;
    const name = normalizeString(city.name).toLowerCase();
    const rank = name === needle ? 0 : name.startsWith(needle) ? 1 : name.includes(needle) ? 2 : -1;
    if (rank < 0) continue;
    scored.push({ city, rank, population: Number(city.population) || 0 });
  }
  scored.sort((a, b) => (a.rank === b.rank ? b.population - a.population : a.rank - b.rank));

  // Deduplicate AFTER the ranking, so the copy that survives is the one the
  // ranking already preferred, and BEFORE the limit, so a duplicate never eats a
  // slot a different city should have had.
  const kept = [];
  for (const entry of scored) {
    const name = normalizeString(entry.city.name).toLowerCase();
    const duplicate = kept.some((other) =>
      other.population === entry.population
      && normalizeString(other.city.name).toLowerCase() === name
      && distanceKm(other.city.coord, entry.city.coord) <= DUPLICATE_CITY_KM);
    if (duplicate) continue;
    kept.push(entry);
    if (kept.length >= limit) break;
  }
  return kept.map((entry) => entry.city);
};

// The archive entry as a feature. `ownerCode` is supplied by the caller because
// only the territory index knows whose ground it stands on, and this module has
// no business loading 55 MB of polygons to answer that.
export const cityToMarker = (city, { ownerCode = "", foundedAt = "" } = {}) => {
  if (!isUsableCity(city)) return null;
  const [lng, lat] = city.coord;
  return {
    name: normalizeString(city.name),
    kind: CITY_KIND,
    ownerCode: normalizeString(ownerCode),
    lng,
    lat,
    size: citySize(city),
    note: isCapital(city) ? "수도" : "",
    foundedAt: normalizeString(foundedAt),
  };
};

// Which stock cities must stop being drawn, because a promoted copy is now on
// the map. Lowercased, because the tiles' `city` property and a player's typing
// will not agree on case.
export const promotedCityNames = (markers) => {
  const names = new Set();
  for (const marker of normalizeArray(markers)) {
    if (normalizeString(marker?.kind).toLowerCase() !== CITY_KIND) continue;
    const name = normalizeString(marker?.name).toLowerCase();
    if (name) names.add(name);
  }
  return names;
};

// A MapLibre filter that hides them. Returns null when nothing is promoted, so
// the layer keeps its plain filter and pays nothing for a feature nobody uses.
//
// Matched against BOTH the tile's own name and the rename override, because a
// city renamed by the AI and then promoted must not draw twice under two names.
export const hidePromotedCitiesFilter = (markers, renames = {}) => {
  const promoted = promotedCityNames(markers);
  if (promoted.size === 0) return null;
  const renamedTo = new Map(
    Object.entries(renames || {}).map(([from, to]) => [normalizeString(to).toLowerCase(), normalizeString(from).toLowerCase()]),
  );
  const tileNames = new Set(promoted);
  for (const name of promoted) {
    const original = renamedTo.get(name);
    if (original) tileNames.add(original);
  }
  return ["!", ["in", ["downcase", ["coalesce", ["get", "city"], ""]], ["literal", [...tileNames]]]];
};

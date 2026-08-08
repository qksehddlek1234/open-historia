/*! Open Historia — always-on sea regions © 2026 Nicholas Krol, MIT (see src/Editor/LICENSE). */
// The world's 118 sea polygons (public/data/sea-regions.json), shipped with the
// app and ALWAYS part of the map.
//
// They used to be opt-in: a cheats tool copied the whole FeatureCollection into
// world.seaRegions, per game. That was wrong twice over. It made naval control
// unrepresentable by default — there was no way to show a blockade, a claimed
// exclusive zone or command of a strait unless the player had found and flipped a
// switch — and it dragged ~600 KB of static geometry into a per-game document that
// the map polls every 5 seconds and every turn rewrites (measured: a save with
// seas on was 722 KB against 127 KB without).
//
// The geometry is the same for every game, so it belongs here: fetched once,
// memoized for the session, and merged at render. What is genuinely per-game is
// only WHO OWNS each sea, and that already lives in
// world.regionOwnershipOverrides["sea_…"] — a handful of short strings.

const SEA_REGIONS_URL = "/data/sea-regions.json";

let featuresPromise = null;

const EMPTY = [];

// The sea polygons as GeoJSON features, ready to merge into the region layer.
// Resolves to [] on failure — a missing seas file must degrade to "no seas",
// never to a broken map — and the failed promise is dropped so the next call
// retries rather than pinning an empty world for the session.
export const loadSeaRegionFeatures = async () => {
  if (!featuresPromise) {
    const promise = (async () => {
      const response = await fetch(SEA_REGIONS_URL);
      if (!response.ok) throw new Error(`sea regions: HTTP ${response.status}`);
      const geojson = await response.json();
      const all = Array.isArray(geojson?.features) ? geojson.features : EMPTY;
      // A FEATURE WITH NO GEOMETRY IS NOT A PLACE.
      //
      // Three of the shipped 118 carry `"geometry": null` — sea_luzon_strait,
      // sea_drake_passage and sea_great_barrier_reef_2. GeoJSON permits it, and
      // the map does not: the geometry source tiles whatever it is handed, so a
      // null-geometry feature that comes into view is a null dereference in the
      // renderer rather than a polygon that simply does not draw. Luzon Strait
      // sits in the middle of South East Asia, which is where this campaign has
      // been operating, so it was reliably on screen.
      //
      // Dropped here, once, at the only place they enter the app — and named, so
      // a broken entry in the shipped file is a line in the console rather than
      // a map that dies when you pan over it.
      const usable = all.filter((feature) => {
        const type = feature?.geometry?.type;
        return type === "Polygon" || type === "MultiPolygon";
      });
      if (usable.length !== all.length) {
        const dropped = all
          .filter((feature) => !usable.includes(feature))
          .map((feature) => String(feature?.properties?.id ?? "unnamed"));
        console.warn(`[seas] ${dropped.length} sea region(s) ship with no geometry and were dropped:`, dropped);
      }
      return usable;
    })().catch((error) => {
      console.warn("Failed to load sea regions (will retry):", error);
      if (featuresPromise === promise) featuresPromise = null;
      return EMPTY;
    });
    featuresPromise = promise;
  }

  return featuresPromise;
};

// The same polygons as bare outer rings, for point-in-polygon tests (is this
// coordinate at sea?). Derived from the one fetch above rather than a second one.
export const loadSeaRegionRings = async () => {
  const features = await loadSeaRegionFeatures();
  const rings = [];
  for (const feature of features) {
    const geometry = feature?.geometry;
    if (geometry?.type === "Polygon") rings.push(geometry.coordinates?.[0]);
    else if (geometry?.type === "MultiPolygon") {
      for (const polygon of geometry.coordinates ?? []) rings.push(polygon?.[0]);
    }
  }
  return rings.filter((ring) => Array.isArray(ring) && ring.length > 3);
};

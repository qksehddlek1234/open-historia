/*! Open Historia — shared base map + per-scenario ownership overlay © 2026 Nicholas Krol, MIT (see src/Editor/LICENSE). */
// ONE MAP, MANY BOARDS.
//
// Measured before writing a line of this (docs/WORKLOG.md, 6차 동기화): across
// the 24 built scenarios — about 118,600 features — the fleet contains 34 novel
// geometries and 32 changed ones. All 66 belong to wwii-1939, where F-3 cuts
// modern provinces against era faces. Everything else is byte-identical
// geometry repeated 23 times, at 64MB a copy.
//
// So the file is not what distinguishes a scenario; `properties.owner` is. The
// engine already knows this: libraryStore's geojson branch lets a scenario with
// no regions.geojson of its own borrow the DEFAULT scenario's map and recolour
// it from world.regionOwnershipOverrides. This module decides which scenarios
// can take that path without changing a pixel, and builds the overlay that
// makes them identical.
//
// WHY A SCENARIO CAN BE INELIGIBLE — and it is not a size question:
//
//  1. NOVEL OR CHANGED GEOMETRY. wwii-1939 owns 66 features the base does not
//     have or does not agree with. It keeps its own file; the win was never
//     coming from there.
//
// AN EXPLICITLY UNOWNED REGION used to be a blocker too, and it is worth keeping
// the reason on the record. Roman 117 leaves 3,300 regions to nobody while the
// borrowed base says "Russia", "United States", "Fiji". Cancelling that means
// saying "this region has NO owner", and the obvious encoding was already taken:
// gameState drops any override with an empty owner, because a save damaged by
// the old owner-blanking bug carries exactly those and every consumer reads them
// as "fall through to the geometry". An intended statement was indistinguishable
// from a corrupted one. world.unownedRegionIds is that second channel — a list,
// not a value — so the two can no longer be confused.
//
// The rule this module enforces: SHARE ONLY WHAT IS PROVABLY IDENTICAL. Every
// scenario it clears is reconstructed feature-for-feature from the base plus
// its overlay and verified against the file it is about to replace, so the
// decision never rests on this comment being right.
const EMPTY = "";

const ownerOf = (feature) => {
  const value = feature?.properties?.owner;
  return typeof value === "string" ? value.trim() : EMPTY;
};

const idOf = (feature) => {
  const value = feature?.properties?.id;
  return value == null ? EMPTY : String(value);
};

// Geometry equality by canonical JSON. Cheap and exact for our case: both sides
// come out of the same builder from the same seed, so coordinate order and
// precision match or the feature genuinely differs. It is deliberately NOT a
// tolerance compare — "close enough" geometry is how a shared base quietly
// starts drawing a different coastline on one board.
const sameGeometry = (a, b) => JSON.stringify(a?.geometry ?? null) === JSON.stringify(b?.geometry ?? null);

/** Index a base FeatureCollection by region id. */
export function indexBase(baseCollection) {
  const byId = new Map();
  for (const feature of baseCollection?.features ?? []) {
    const id = idOf(feature);
    if (id) byId.set(id, feature);
  }
  return byId;
}

/**
 * Decide whether `features` can be served from `base` + an ownership overlay,
 * and build that overlay.
 *
 * Returns the plan either way — an ineligible scenario still reports WHY and
 * with what counts, because "9 boards blocked, 4,629 unowned regions between
 * them" is the measurement that decides whether phase 2 is worth building.
 */
export function planOverlay(features, baseById) {
  const overrides = {};
  const unownedIds = [];
  const novelIds = [];
  const changedGeometryIds = [];
  const missingIdCount = { value: 0 };

  for (const feature of Array.isArray(features) ? features : []) {
    const id = idOf(feature);
    if (!id) {
      missingIdCount.value += 1;
      continue;
    }
    const baseFeature = baseById.get(id);
    if (!baseFeature) {
      novelIds.push(id);
      continue;
    }
    if (!sameGeometry(feature, baseFeature)) changedGeometryIds.push(id);

    const owner = ownerOf(feature);
    if (!owner) {
      // The base almost certainly names an owner here; saying nothing would let
      // that owner through. Recorded, not silently dropped — see the header.
      if (ownerOf(baseFeature)) unownedIds.push(id);
      continue;
    }
    // Only DIVERGENCE is written. An overlay that restates what the base
    // already says is 4,941 lines of noise that can drift out of agreement.
    if (owner !== ownerOf(baseFeature)) overrides[id] = owner;
  }

  // Geometry is the only hard blocker. An unowned region used to be one too —
  // it had no representation — until world.unownedRegionIds gave it a channel of
  // its own, separate from the override table whose empty value already means
  // "damaged entry". The count is still reported, because it is the thing that
  // makes a historical board historical.
  const blockers = [];
  if (novelIds.length) blockers.push(`novel geometry ×${novelIds.length}`);
  if (changedGeometryIds.length) blockers.push(`changed geometry ×${changedGeometryIds.length}`);
  if (missingIdCount.value) blockers.push(`feature without id ×${missingIdCount.value}`);

  return {
    eligible: blockers.length === 0,
    reason: blockers.join(", "),
    overrides,
    overrideCount: Object.keys(overrides).length,
    unownedIds,
    novelIds,
    changedGeometryIds,
    featuresWithoutId: missingIdCount.value,
  };
}

/**
 * Rebuild what the engine will actually serve, so eligibility is verified
 * against the reconstruction rather than asserted from the plan.
 *
 * Mirrors the runtime resolution exactly: an override wins, otherwise the
 * base's own owner stands. Anything this returns that differs from the
 * scenario's real map is a reason NOT to share.
 */
export function reconstructOwners(baseById, overrides, unownedIds = []) {
  const unowned = unownedIds instanceof Set ? unownedIds : new Set(unownedIds);
  const owners = new Map();
  for (const [id, feature] of baseById) {
    if (unowned.has(id)) {
      owners.set(id, EMPTY);
      continue;
    }
    const override = overrides?.[id];
    owners.set(id, typeof override === "string" && override ? override : ownerOf(feature));
  }
  return owners;
}

/**
 * Feature-for-feature comparison of the reconstruction against the scenario's
 * own map. Returns the list of disagreements (empty means the shared base is
 * indistinguishable from the file it replaces).
 */
export function verifyReconstruction(features, baseById, overrides, { limit = 10, unownedIds = [] } = {}) {
  const reconstructed = reconstructOwners(baseById, overrides, unownedIds);
  const mismatches = [];
  let count = 0;
  for (const feature of Array.isArray(features) ? features : []) {
    const id = idOf(feature);
    if (!id) continue;
    const want = ownerOf(feature);
    const got = reconstructed.get(id) ?? EMPTY;
    if (want !== got) {
      count += 1;
      if (mismatches.length < limit) mismatches.push({ id, expected: want, actual: got });
    }
  }
  // The base can also carry features the scenario does not — it never has in
  // practice (both come from one seed) but a silent extra region is a region
  // the player can suddenly click, so it counts as a mismatch too.
  const seen = new Set((features ?? []).map(idOf));
  const extra = [...baseById.keys()].filter((id) => !seen.has(id));
  return { count: count + extra.length, mismatches, extraInBase: extra };
}

/**
 * Merge an overlay into a scenario's existing regionOwnershipOverrides.
 *
 * ADDITIVE, and the existing entry always wins. On a scenario the two agree by
 * construction; on a GAME they do not — a game's table has absorbed the
 * player's conquests, and the overlay is a statement about the starting map.
 * Letting the overlay win there would hand every conquered region back at the
 * moment the file it used to read disappeared.
 */
export function mergeOverrides(existing, overlay) {
  const merged = { ...(existing ?? {}) };
  let added = 0;
  for (const [id, owner] of Object.entries(overlay ?? {})) {
    if (merged[id] !== undefined) continue;
    merged[id] = owner;
    added += 1;
  }
  return { merged, added };
}

/**
 * What a scenario actually owns, whichever way it stores its map.
 *
 * A scenario either carries its own regions.geojson (owner lives on the feature)
 * or borrows the shared base and states its differences in world.json. Both are
 * the same question — "who holds this region at turn 1" — and anything that asks
 * it should not have to know which shape the answer is stored in. Returns a Map
 * of region id to owner name, with "" for unowned.
 */
export function scenarioOwners({ features = null, baseById = null, world = {} } = {}) {
  const overrides = world?.regionOwnershipOverrides ?? {};
  const unowned = new Set(Array.isArray(world?.unownedRegionIds) ? world.unownedRegionIds : []);
  if (Array.isArray(features) && features.length > 0) {
    const owners = new Map();
    for (const feature of features) {
      const id = idOf(feature);
      if (!id) continue;
      owners.set(id, unowned.has(id) ? EMPTY : overrides[id] || ownerOf(feature));
    }
    return owners;
  }
  if (!baseById) return new Map();
  return reconstructOwners(baseById, overrides, unowned);
}

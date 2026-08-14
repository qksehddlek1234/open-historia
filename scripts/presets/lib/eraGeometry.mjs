/*! Open Historia — portions (era geometry graft, plan F-3) © 2026 Nicholas Krol, MIT (see src/Editor/LICENSE). */
// F-3: graft assembled era faces onto the scenario's province layer.
//
// The province layer is GADM admin-1 and it is MODERN. A 1939 preset that
// assigns whole modern provinces to era owners is right about who ruled where
// only as long as the era border happens to run along a modern provincial
// line — and the interesting borders never do. East Prussia, the Polish
// Corridor, Alsace, Bessarabia, Karelia: every one of them cuts a modern
// province in half.
//
// So: clip the province against the era face. The engine already has the two
// contracts this needs (Nations.jsx) —
//
//   * a DOTTED GADM id with `edited: true` suppresses the stock vector tile for
//     that id and paints the GeoJSON geometry instead. That is the "reshaped
//     province" path, and a clipped province is exactly a reshaped one.
//   * a NON-DOTTED id is an author-drawn region and always paints from the
//     GeoJSON. That is where the offcut goes.
//
// Ownership tracking (world.regionOwnershipOverrides, saves, AI transfers) is
// keyed by region id, so the LARGEST piece keeps the original id and every
// offcut gets a fresh one. Nothing that already existed changes identity.
//
// Coverage is partial by nature — the assembler produces faces for the
// polities it could close, and the rest of the world keeps the spec's hand
// assignment (source ladder, rung 2). Every region is counted into exactly one
// outcome bucket, and every dropped sliver is counted and named.

import polygonClipping from "polygon-clipping";

const { intersection, difference, union } = polygonClipping;

// A piece smaller than this (square degrees) is clipping noise, not land: two
// polygon sets that trace the same coast from different sources leave hairline
// slivers along it. Measured against the seed: the smallest real GADM admin-1
// region is ~2e-4 deg² (Sint Maarten), so a floor two orders below that keeps
// every real place and kills the hairlines.
export const MIN_PIECE_AREA = 2e-6;

// A province this fully inside one face is not "cut" — the leftover is coast
// tracing noise. Keeping the original geometry avoids replacing sharp stock
// tiles with the seed's coarser outline for no gain.
export const WHOLLY_INSIDE = 0.995;

// An owner holding less than this share of a province is dataset disagreement,
// not territory. Calibrated below in the report, not guessed: see the fraction
// histogram the build prints — the real cuts (East Prussia, the Corridor) sit
// far above it and the shared-border hairlines far below.
export const MIN_PIECE_FRACTION = 0.02;

// The second floor, and the one that catches what the fraction misses. A share
// test scales with the province: 10% of a Swiss canton is a hairline, 10% of a
// Ukrainian oblast is a war. What actually separates a border-offset artifact
// from territory is its WIDTH — the era outline is welded at 0.06 deg, so it
// and GADM disagree by up to that along every shared border, and a piece
// thinner than the weld distance is inside the noise no matter its share.
// Effective width = area / longest bbox side: exact for a rectangle, and an
// over-estimate for the crescents these artifacts actually are, so it errs
// toward KEEPING land.
export const MIN_PIECE_WIDTH = 0.06;

export const effectiveWidth = (mp, area) => {
  const [minX, minY, maxX, maxY] = bboxOf(mp);
  const longest = Math.max(maxX - minX, maxY - minY);
  return longest > 0 ? area / longest : 0;
};

export const ringArea = (ring) => {
  let sum = 0;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i, i += 1) {
    sum += (ring[j][0] - ring[i][0]) * (ring[j][1] + ring[i][1]);
  }
  return sum / 2;
};

// Area of a polygon-clipping MultiPolygon ([poly][ring][pt]): outer rings
// positive, holes subtracted. Sign-agnostic per ring so it survives either
// winding convention.
export const multiPolygonArea = (mp) => {
  let total = 0;
  for (const poly of mp ?? []) {
    for (let r = 0; r < poly.length; r += 1) {
      const a = Math.abs(ringArea(poly[r]));
      total += r === 0 ? a : -a;
    }
  }
  return total;
};

export const bboxOf = (mp) => {
  let minX = Infinity; let minY = Infinity; let maxX = -Infinity; let maxY = -Infinity;
  for (const poly of mp ?? []) {
    for (const ring of poly) {
      for (const [x, y] of ring) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  return [minX, minY, maxX, maxY];
};

export const bboxOverlaps = (a, b) => a[0] <= b[2] && b[0] <= a[2] && a[1] <= b[3] && b[1] <= a[3];

// GeoJSON geometry -> polygon-clipping MultiPolygon. Anything that is not an
// area (points, lines, empty) returns null so the caller can count it rather
// than silently treat it as zero area.
export const toMultiPolygon = (geometry) => {
  if (!geometry) return null;
  if (geometry.type === "Polygon") return Array.isArray(geometry.coordinates) ? [geometry.coordinates] : null;
  if (geometry.type === "MultiPolygon") return Array.isArray(geometry.coordinates) ? geometry.coordinates : null;
  return null;
};

export const toGeometry = (mp) => {
  if (!mp || mp.length === 0) return null;
  if (mp.length === 1) return { type: "Polygon", coordinates: mp[0] };
  return { type: "MultiPolygon", coordinates: mp };
};

// ── face decimation on load ──────────────────────────────────────────────────
// THE TWO TRANSPORTS ARRIVE AT DIFFERENT RESOLUTIONS AND THE GRAFT PAYS FOR IT.
// The tile transport is pre-simplified by the tiler (1939's 41 faces total
// 66,761 vertices), but the Overpass transport returns full-resolution way
// geometry — the 2026-08-12 date batch emitted faces at ~0.002° point spacing
// (1946: 39 faces / 636,698 vertices, Romania alone 90,039 across 314 rings;
// 2000: 1,050,134). polygon-clipping cost scales with vertex count per
// intersection() and the graft runs one per bbox-overlapping (region, face)
// pair, so the same build that took seconds on tile faces ground for 30+
// minutes on Overpass faces — measured 2026-08-14 by V8 --prof (ticks
// dominated by polygon-clipping compare/RingIn).
//
// Decimating on LOAD, not at emit, keeps the assembler's artifacts exact and
// makes the graft transport-blind. The tolerance is the assembler's own coast
// decimation constant (0.01°): far below the 0.06° weld distance and the 2%
// piece-fraction guard, so no keep/absorb decision can flip — a boundary can
// move at most ~0.01°, an order under the smallest surviving cut width ever
// measured (0.062°). Rings that collapse below 4 points are micro-loops the
// duplicate-generation storm minted (they decimate to nothing at province
// scale); they are COUNTED, never silently vanished, and if an outer ring
// collapses its holes go with it.
export const decimateFaceMp = (mp, tol = 0.01) => {
  const stats = { pointsIn: 0, pointsOut: 0, ringsIn: 0, ringsDropped: 0 };
  if (!mp) return { mp, stats };
  const out = [];
  for (const poly of mp) {
    const rings = [];
    let outerDropped = false;
    for (let r = 0; r < poly.length; r += 1) {
      const ring = poly[r];
      stats.ringsIn += 1;
      stats.pointsIn += ring.length;
      if (outerDropped) { stats.ringsDropped += 1; continue; } // holes of a dead outer
      const dec = decimateRingLocal(ring, tol);
      if (dec.length < 4) {
        stats.ringsDropped += 1;
        if (r === 0) outerDropped = true;
        continue;
      }
      stats.pointsOut += dec.length;
      rings.push(dec);
    }
    if (rings.length > 0) out.push(rings);
  }
  return { mp: out, stats };
};

// Radial-distance decimation, kept in step with assembleFaces' decimateRing:
// a point within tol of the last kept point is dropped; first and last stay so
// the ring remains closed. Local copy because importing the assembler here
// would couple the graft to a module it must not load (and the function is
// eight lines).
const decimateRingLocal = (ring, tol) => {
  if (!Array.isArray(ring) || ring.length <= 4) return ring ?? [];
  const kept = [ring[0]];
  for (let i = 1; i < ring.length - 1; i += 1) {
    const last = kept[kept.length - 1];
    const dx = ring[i][0] - last[0];
    const dy = ring[i][1] - last[1];
    if (dx * dx + dy * dy >= tol * tol) kept.push(ring[i]);
  }
  kept.push(ring[ring.length - 1]);
  return kept;
};

// Resolve an era face to the OWNER NAME that should hold it. Two owner families
// exist on a built preset and both must be reachable: the spec's era polities
// ("Germany", "British Empire") and — on near-modern presets where
// unassignedKeepModernOwner is set — the modern country names the untouched
// regions keep ("Poland", "Switzerland"). The face carries OHM's native name
// ("Polska") plus name:en / name:ko, and the specs already carry an alias list
// for the model's benefit; matched case- and space-insensitively, that is
// usually bridge enough.
export const buildFaceNameIndex = (polities, modernNames = []) => {
  const index = new Map();
  const put = (label, owner) => {
    const key = String(label ?? "").trim().toLowerCase();
    if (!key || !owner) return;
    // First writer wins, and the passes below are ordered by authority: a
    // polity's own name outranks an alias, an alias outranks a modern name.
    if (!index.has(key)) index.set(key, owner);
  };
  for (const [code, polity] of Object.entries(polities ?? {})) {
    put(polity?.name, polity?.name ?? code);
    put(code, polity?.name ?? code);
  }
  for (const polity of Object.values(polities ?? {})) {
    for (const alias of polity?.aliases ?? []) put(alias, polity?.name);
  }
  for (const name of modernNames) put(name, name);
  return index;
};

// Historical style stripped down to the modern name. Deliberately a SHORT,
// explicit list rather than a general rule: every entry is a form OHM actually
// uses, and a match through here is reported as such — "Kingdom of Hungary" is
// Hungary, but "Italian protectorate of Albania" is a case where the territory
// and the ruler are different answers and only the spec can say which is meant.
const STYLE_PATTERNS = [
  /^(kingdom|republic|tsardom|principality|commonwealth|state|empire|federation|union|duchy|grand duchy|sultanate|emirate|free state) of\s+/i,
  /^(the)\s+/i,
  /\s+\((\d{4})(-\d{4})?\)$/,
];

export const stripStyle = (label) => {
  let out = String(label ?? "").trim();
  let changed = true;
  while (changed) {
    changed = false;
    for (const re of STYLE_PATTERNS) {
      const next = out.replace(re, "");
      if (next !== out) { out = next; changed = true; }
    }
  }
  return out.trim();
};

// via tells the report HOW a face resolved: an exact label match is evidence,
// a style-stripped match is an inference worth a human glance.
export const matchFace = (face, index, faceOwners = {}) => {
  const props = face?.properties ?? {};
  const rawName = props.name ?? "";
  if (Object.prototype.hasOwnProperty.call(faceOwners, rawName)) {
    return { owner: faceOwners[rawName], via: "spec", label: rawName };
  }
  const candidates = [rawName, props.names?.["name:en"], props.names?.["name:ko"], props.names?.official_name];
  for (const candidate of candidates) {
    const key = String(candidate ?? "").trim().toLowerCase();
    if (key && index.has(key)) return { owner: index.get(key), via: "exact", label: candidate };
  }
  for (const candidate of candidates) {
    const key = stripStyle(candidate).toLowerCase();
    if (key && index.has(key)) return { owner: index.get(key), via: "style", label: candidate };
  }
  return null;
};

// ---------------------------------------------------------------------------
// The graft
// ---------------------------------------------------------------------------

// regionFeatures: the built features (id/owner/gid0/name/typeId), in place.
// faces: [{ owner, name, mp, bbox }] — era faces already resolved to an owner.
//
// Returns { features, report }. Every input region lands in exactly one bucket:
//   untouched  — no era face overlaps it (rung 2: the spec's assignment stands)
//   confirmed  — one owner covers it and it agrees with the spec
//   reowned    — one owner covers it and DISAGREES; the face wins, loudly
//   cut        — genuinely divided between two or more owners
export const graftEraGeometry = (regionFeatures, faces, {
  minPieceArea = MIN_PIECE_AREA,
  minPieceFraction = MIN_PIECE_FRACTION,
  minPieceWidth = MIN_PIECE_WIDTH,
  whollyInside = WHOLLY_INSIDE,
  idPrefix = "era",
} = {}) => {
  const out = [];
  const report = {
    regionsIn: regionFeatures.length,
    untouched: 0,
    confirmed: 0,
    reowned: [],
    cut: [],
    offcuts: 0,
    droppedSlivers: [],
    cutFractions: [],
    cutWidths: [],
    mergedRefusals: [],
    keepOutRefusals: [],
    clipFailures: [],
    nonAreaGeometry: 0,
    facesUsed: new Set(),
    // Hybrid (rung 2+3) accounting: regions where rung-1 presence suppressed
    // rung-3 candidates, and regions clipped purely by rung-3 backfill.
    rung3Suppressed: 0,
    rung3Regions: 0,
  };
  let offcutSeq = 0;

  for (const feature of regionFeatures) {
    const mp = toMultiPolygon(feature.geometry);
    if (!mp) {
      report.nonAreaGeometry += 1;
      out.push(feature);
      continue;
    }
    const rb = bboxOf(mp);
    let candidates = faces.filter((f) => bboxOverlaps(rb, f.bbox));
    // SOURCE-LADDER PRECEDENCE, DECIDED PER REGION AND NEVER GEOMETRICALLY.
    // Rung-3 backfill polygons (historical-basemaps) arrive WHOLE and may
    // overlap rung-1 assembly faces; clipping a region against both would
    // double-cover it and corrupt the per-owner fold below. The rule from the
    // hybrid design (PLAN-F-OHM, 2026-08-14): a region any rung-1 face
    // touches belongs to rung 1 entirely — rung-3 exists to cut only the
    // regions rung 1 never reaches. The seam between the two rungs therefore
    // follows modern region boundaries, a step of at most one region's width,
    // inside rung 3's own continent-scale tolerance. Faces without a rung
    // property are rung 1 (every pre-hybrid dump), so legacy builds are
    // untouched by construction. Suppressions are counted per region.
    if (candidates.some((f) => (f.rung ?? 1) !== 3) && candidates.some((f) => (f.rung ?? 1) === 3)) {
      candidates = candidates.filter((f) => (f.rung ?? 1) !== 3);
      report.rung3Suppressed += 1;
    }
    if (candidates.length === 0) {
      report.untouched += 1;
      out.push(feature);
      continue;
    }
    if (candidates.every((f) => (f.rung ?? 1) === 3)) report.rung3Regions += 1;
    const specOwner = feature.properties.owner;
    const wholeArea = multiPolygonArea(mp);
    const pieces = [];
    let failed = false;
    for (const face of candidates) {
      // A fused face swallowed its neighbour because the border between them
      // never closed. It is still the best outline its winner has, but over
      // the swallowed names it is evidence of nothing — Germany's 1939 face
      // took Slovakia and Luxembourg with it, and letting it re-own their
      // provinces would annex two countries on the strength of a data defect.
      if (face.mergedWith?.includes(specOwner)) {
        report.mergedRefusals.push({ id: feature.properties.id, owner: specOwner, face: face.name });
        continue;
      }
      // Same defect, different symptom: a face can fuse across a border whose
      // other side has no label in the dump at all, so nothing marks it as
      // merged. Germany's 1939 face swallowed Jutland that way (Midtjylland
      // 97.8% inside it). Geometry cannot tell that from a real annexation —
      // only the spec can, by naming the GADM country the face may not enter.
      // An entry may also be a REGION-ID PREFIX ("ITA.1"): medieval-1200's
      // crude HRE face is correct across northern Italy but crosses the
      // Tronto into Abruzzo, and a country-level fence would have thrown the
      // whole (deliberate) Kingdom-of-Italy coloring away with the bite. The
      // dot in the startsWith guard is what keeps "ITA.1" from also matching
      // ITA.18_1.
      const keptOutBy = face.keepOut?.find((entry) => entry === feature.properties.gid0
        || feature.properties.id?.split("_")[0] === entry
        || feature.properties.id?.startsWith(`${entry}.`));
      if (keptOutBy) {
        report.keepOutRefusals.push({ id: feature.properties.id, gid0: feature.properties.gid0, face: face.name });
        continue;
      }
      let clipped;
      try {
        clipped = intersection(mp, face.mp);
      } catch (error) {
        // Loud, never silent: a clip that throws is a region whose era border
        // we could NOT place, and it keeps its modern shape and hand-assigned
        // owner. That is a fallback, not a success.
        report.clipFailures.push({ id: feature.properties.id, face: face.name, error: String(error?.message ?? error) });
        failed = true;
        break;
      }
      const area = multiPolygonArea(clipped);
      if (area <= minPieceArea) {
        if (area > 0) report.droppedSlivers.push({ id: feature.properties.id, face: face.name, area });
        continue;
      }
      pieces.push({ face, mp: clipped, area });
    }
    if (failed || pieces.length === 0) {
      if (!failed) report.untouched += 1;
      out.push(feature);
      continue;
    }

    for (const p of pieces) report.facesUsed.add(p.face.name);

    // The remainder — land inside NO face — keeps the spec's owner: partial
    // coverage must never quietly annex to whoever is nearest.
    let remainder = mp;
    for (const p of pieces) {
      try {
        remainder = difference(remainder, p.face.mp);
      } catch (error) {
        report.clipFailures.push({ id: feature.properties.id, face: `remainder/${p.face.name}`, error: String(error?.message ?? error) });
        remainder = null;
        break;
      }
    }
    const remainderArea = remainder ? multiPolygonArea(remainder) : 0;

    // Fold every piece down to one entry PER OWNER before deciding anything.
    // Two faces can share an owner, and — the common case — a piece and the
    // remainder often do: without this, a province wholly inside its own
    // country's face gets "split" into two halves owned by the same power, and
    // the sharp stock tile is thrown away to draw a border that isn't there.
    const byOwner = new Map();
    const addPart = (owner, partMp, area, face) => {
      const prev = byOwner.get(owner);
      if (!prev) { byOwner.set(owner, { owner, mps: [partMp], area, faces: face ? [face] : [] }); return; }
      prev.mps.push(partMp);
      prev.area += area;
      if (face) prev.faces.push(face);
    };
    for (const p of pieces) addPart(p.face.owner, p.mp, p.area, p.face.name);
    if (remainder && remainderArea > 0) addPart(specOwner, remainder, remainderArea, null);

    // Below the fraction floor a piece is dataset disagreement, not territory:
    // the era outline is decimated at 0.01 deg and welded at 0.06 deg, so it
    // and GADM trace every shared border slightly apart, leaving hairline
    // slivers all along it. Those get folded into the largest owner rather
    // than minting a province — counted, with the largest named.
    const owners = [...byOwner.values()].sort((a, b) => b.area - a.area);
    for (const o of owners) {
      o.fraction = wholeArea > 0 ? o.area / wholeArea : 0;
      o.width = Math.max(...o.mps.map((m) => effectiveWidth(m, multiPolygonArea(m))));
    }
    const kept = owners.filter((o, i) => i === 0
      || (o.area >= minPieceArea && o.fraction >= minPieceFraction && o.width >= minPieceWidth));
    for (const o of owners) {
      if (kept.includes(o)) continue;
      report.droppedSlivers.push({
        id: feature.properties.id,
        owner: o.owner,
        area: o.area,
        fraction: o.fraction,
        width: o.width,
        why: o.fraction < minPieceFraction ? "fraction" : "width",
      });
    }

    // One owner after folding: nothing was divided. Keep the ORIGINAL geometry
    // (the stock tiles are sharper than the seed) and rule only on the owner.
    if (kept.length === 1) {
      const owner = kept[0].owner;
      const coverage = wholeArea > 0 ? kept[0].area / wholeArea : 0;
      if (owner === specOwner) report.confirmed += 1;
      else if (coverage >= whollyInside || kept[0].faces.length > 0) {
        report.reowned.push({ id: feature.properties.id, from: specOwner, to: owner, face: kept[0].faces[0] ?? "", coverage: +coverage.toFixed(3) });
        feature.properties.owner = owner;
      } else {
        report.untouched += 1;
      }
      out.push(feature);
      continue;
    }

    // Genuinely divided. Each MINOR owner gets the union of its own pieces;
    // the largest owner gets "everything else" — the province MINUS the minor
    // shares. Built that way on purpose: it is exact, so the pieces tile the
    // province with no hole and no overlap, and the sliver area folded away
    // above lands back in the majority owner instead of vanishing off the map.
    const parts = [];
    let clipBroke = false;
    const minor = kept.slice(1);
    for (const o of minor) {
      let merged = o.mps[0];
      for (let i = 1; i < o.mps.length; i += 1) {
        try {
          merged = union(merged, o.mps[i]);
        } catch (error) {
          report.clipFailures.push({ id: feature.properties.id, face: `union/${o.owner}`, error: String(error?.message ?? error) });
          clipBroke = true;
          break;
        }
      }
      if (clipBroke) break;
      parts.push({ mp: merged, area: o.area, owner: o.owner, face: o.faces[0] ?? null });
    }
    let majority = mp;
    if (!clipBroke) {
      for (const part of parts) {
        try {
          majority = difference(majority, part.mp);
        } catch (error) {
          report.clipFailures.push({ id: feature.properties.id, face: `majority/${part.owner}`, error: String(error?.message ?? error) });
          clipBroke = true;
          break;
        }
      }
    }
    if (clipBroke || !majority || majority.length === 0) { out.push(feature); continue; }
    parts.unshift({ mp: majority, area: multiPolygonArea(majority), owner: kept[0].owner, face: kept[0].faces[0] ?? null });
    report.cutFractions.push(...minor.map((o) => +(o.area / wholeArea).toFixed(4)));
    report.cutWidths.push(...minor.map((o) => +o.width.toFixed(4)));

    const [keep, ...offcuts] = parts;
    const base = feature.properties;
    out.push({
      type: "Feature",
      geometry: toGeometry(keep.mp),
      // `edited` is the engine's existing contract for "the GeoJSON, not the
      // stock tile, holds this dotted id's true shape" — without it the stock
      // tile paints the ORIGINAL province on top and the era border vanishes.
      properties: { ...base, owner: keep.owner, edited: true, eraFace: keep.face ?? "" },
    });
    for (const piece of offcuts) {
      offcutSeq += 1;
      out.push({
        type: "Feature",
        geometry: toGeometry(piece.mp),
        properties: {
          // Undotted on purpose: an author-style region, painted from the
          // GeoJSON, invisible to the GID_1 tile match.
          id: `${idPrefix}_${offcutSeq}`,
          owner: piece.owner,
          gid0: base.gid0,
          name: base.name,
          typeId: base.typeId ?? "land",
          eraFace: piece.face ?? "",
          eraSplitOf: base.id,
        },
      });
    }
    report.offcuts += offcuts.length;
    report.cut.push({
      id: base.id,
      name: base.name,
      pieces: parts.map((p) => ({ owner: p.owner, area: +p.area.toFixed(5), face: p.face })),
    });
  }

  report.facesUsed = [...report.facesUsed].sort();
  return { features: out, report };
};

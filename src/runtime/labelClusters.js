/*! Open Historia — which regions touch, and where a territory's label sits © 2026 Nicholas Krol, MIT (see src/Editor/LICENSE). */
// THREE PURE PIECES OF THE OWNER-LABEL BUILDER (Nations.jsx), split out so they
// can be tested without the map: which regions are contiguous, which piece of
// a merged territory carries its label, and which of an owner's territories is
// its seat.
//
// ── Adjacency ──────────────────────────────────────────────────────────────
//
// Regions were "adjacent" when they shared a vertex on a 1e-4° grid. That is
// true inside one country — GADM digitises a country's provinces against each
// other — and false across a national border, where two countries' outlines
// were drawn separately and miss each other by a hair. Measured on the 1836
// board (2026-08-17, 4,973 regions, 3.2M vertices, every pair of regions from
// different countries within 0.1°):
//
//   nearest-vertex gap    ≤1e-4°: 1,840 pairs   1e-4..1e-3: 73   1e-3..1e-2: 98   1e-2..0.1: 334
//
// Most cross-border gaps are digitising noise under 1e-4°; the tail is RIVER
// borders, open by the river's width (Mekong, Danube — up to ~6e-3°). The
// misses that mattered: Prussia's Polish provinces stop 2.2e-4° short of
// Brandenburg (so Prussia clustered as three pieces and only the 10° centroid
// mop-up in the label builder held it together); Denmark's Jutland and
// Schleswig, 1.9e-3° apart, were two clusters; two of the eighteen Mongolia—
// China pairs, at 6e-5° and 8e-5°, fell on the wrong side of the 1e-4 rounding.
//
// So adjacency is PROXIMITY: two regions touch when any two of their vertices
// lie within REGION_ADJACENCY_DEGREES. 1e-2° (~1.1 km at the equator, ~0.7 km
// at 50°N) sits between the widest real border gap seen (~6e-3°) and the first
// same-owner pair that genuinely is apart (Incheon—Kaesong across the estuary,
// 1.8e-2°), with room on both sides. It can afford to be generous: adjacency
// is only ever consumed WITHIN one owner, and two of an owner's regions 700 m
// apart across water read as one territory anyway. Everything the old rule
// linked, this links (a shared vertex is 0° apart); it lost nothing and added
// 682 links on the 1836 board, 221 of them same-owner.
//
// ── Anchor ─────────────────────────────────────────────────────────────────
//
// A merged cluster's label used to sit at the merged centroid — which for an
// archipelago is the sea, and for a country with a distant exclave is pulled
// toward the exclave (Bavaria's label leaned west toward the Palatinate and
// overlapped Württemberg's; Two Sicilies' sat in the Tyrrhenian; Britain's in
// the Irish Sea). The label now sits on the LARGEST CONTIGUOUS PIECE of the
// cluster. Only the position moves: size, tier, tilt and the rings a curved
// label may run through still come from the whole merged cluster. Measured on
// 1836: flat labels off their own territory 10 → 2 of 114, the last central-
// German overlap gone, label count / curves / leader lines unchanged.

export const REGION_ADJACENCY_DEGREES = 0.01;

// neighbors[i] is a Set of feature indices touching feature i, or null when it
// touches nothing (the same shape the label builder consumed before). Owner-
// agnostic — geometry only — so a world can memoize it across ownership changes.
//
// Cost: the 1836 board is 3.2M vertices, and this runs on the main thread once
// per world. Vertices go into a flat grid (typed arrays, CSR-indexed) rather
// than one object per cell — the object version took 11 s here, this takes
// 1.7 s, against 2.6 s for the shared-vertex hash it replaces. Cells are four
// epsilons wide: a pair within epsilon is then always in the same or an
// adjacent cell, and there are a quarter as many cells to visit.
const CELL_EPSILONS = 4;
export const buildRegionAdjacency = (regionsFC, epsilon = REGION_ADJACENCY_DEGREES) => {
  const features = regionsFC?.features ?? [];
  const neighbors = features.map(() => null);
  const link = (a, b) => {
    (neighbors[a] ??= new Set()).add(b);
    (neighbors[b] ??= new Set()).add(a);
  };
  const linked = (a, b) => neighbors[a] !== null && neighbors[a].has(b);
  const ringsOf = (feature) => {
    const geometry = feature?.geometry;
    const polys = geometry?.type === "Polygon"
      ? [geometry.coordinates]
      : geometry?.type === "MultiPolygon" ? geometry.coordinates : [];
    const rings = [];
    for (const poly of polys) for (const ring of poly ?? []) if (ring) rings.push(ring);
    return rings;
  };

  // Pass 1 — every vertex into a cell. Cell ids are dense so the rest can be
  // typed arrays; the Map only turns a packed (cx, cy) into that id.
  const cellSize = epsilon * CELL_EPSILONS;
  const half = Math.ceil(180 / cellSize) + 1;
  const span = half * 2 + 1;
  const cellKey = (cx, cy) => (cx + half) * span + (cy + half);
  let total = 0;
  for (const feature of features) for (const ring of ringsOf(feature)) total += ring.length;
  const xs = new Float64Array(total);
  const ys = new Float64Array(total);
  const featureOf = new Int32Array(total);
  const cellOf = new Int32Array(total);
  const cellIndex = new Map(); // packed key -> dense cell id
  const cellKeys = []; // dense cell id -> packed key
  let v = 0;
  for (let index = 0; index < features.length; index += 1) {
    for (const ring of ringsOf(features[index])) {
      for (const pt of ring) {
        xs[v] = pt[0];
        ys[v] = pt[1];
        featureOf[v] = index;
        const key = cellKey(Math.floor(pt[0] / cellSize), Math.floor(pt[1] / cellSize));
        let id = cellIndex.get(key);
        if (id === undefined) {
          id = cellKeys.length;
          cellIndex.set(key, id);
          cellKeys.push(key);
        }
        cellOf[v] = id;
        v += 1;
      }
    }
  }
  const cellCount = cellKeys.length;
  // CSR: order[start[c] .. start[c+1]) are the vertices of cell c.
  const start = new Int32Array(cellCount + 1);
  for (let k = 0; k < total; k += 1) start[cellOf[k] + 1] += 1;
  for (let c = 0; c < cellCount; c += 1) start[c + 1] += start[c];
  const fill = start.slice(0, cellCount);
  const order = new Int32Array(total);
  for (let k = 0; k < total; k += 1) order[fill[cellOf[k]]++] = k;
  // Which feature a cell holds, and whether it holds more than one.
  const firstFeature = new Int32Array(cellCount);
  const mixedCell = new Uint8Array(cellCount);
  for (let c = 0; c < cellCount; c += 1) {
    const first = featureOf[order[start[c]]];
    firstFeature[c] = first;
    for (let p = start[c] + 1; p < start[c + 1]; p += 1) {
      if (featureOf[order[p]] !== first) { mixedCell[c] = 1; break; }
    }
  }

  // Pass 2 — cell by cell. A cell whose 3×3 neighbourhood holds one feature
  // has no border to find (a coastline, an interior). Where two or more meet,
  // each vertex compares against the OTHER features' vertices nearby — and
  // only against features it is not yet linked to, so a long shared border
  // costs one hit, not one per vertex.
  const around = new Int32Array(9);
  for (let c = 0; c < cellCount; c += 1) {
    const key = cellKeys[c];
    const kx = Math.floor(key / span) - half;
    const ky = (key % span) - half;
    const first = firstFeature[c];
    let n = 0;
    let multi = mixedCell[c] === 1;
    for (let dx = -1; dx <= 1; dx += 1) {
      for (let dy = -1; dy <= 1; dy += 1) {
        const id = cellIndex.get(cellKey(kx + dx, ky + dy));
        if (id === undefined) continue;
        around[n++] = id;
        if (mixedCell[id] === 1 || firstFeature[id] !== first) multi = true;
      }
    }
    if (!multi) continue;
    for (let p = start[c]; p < start[c + 1]; p += 1) {
      const vi = order[p];
      const i = featureOf[vi];
      const vx = xs[vi];
      const vy = ys[vi];
      for (let a = 0; a < n; a += 1) {
        const id = around[a];
        for (let q = start[id]; q < start[id + 1]; q += 1) {
          const m = order[q];
          const j = featureOf[m];
          if (j === i || linked(i, j)) continue;
          const dx = xs[m] - vx;
          const dy = ys[m] - vy;
          if (dx * dx + dy * dy <= epsilon * epsilon) link(i, j);
        }
      }
    }
  }
  return neighbors;
};

// A cluster remembers the contiguous pieces it was merged from as `parts`
// (each a snapshot taken BEFORE its centroid was folded in). The label sits on
// the largest of them; a cluster that never merged is its own only piece.
export const snapshotClusterPart = (cluster) => ({ cx: cluster.cx, cy: cluster.cy, area: cluster.area });

export const largestClusterPart = (cluster) => {
  const parts = cluster?.parts;
  if (!parts?.length) return cluster;
  let best = parts[0];
  for (const part of parts) if (part.area > best.area) best = part;
  return best;
};

// ── Seat ───────────────────────────────────────────────────────────────────
//
// Which cluster is the SEAT — tier 0, the name at full weight, the one the
// leader line and the curved label are offered to — used to be the largest by
// area. That names an empire after its biggest possession: 59 cases across
// the fleet (measured 2026-08-17) — Denmark's seat was Greenland on six
// boards, 1836 Britain's was the Columbia District, Portugal's Mozambique,
// the Netherlands' the East Indies. The preset builder now emits each
// polity's `home`, the first country in its grants ("GBR" for Britain, "DNK"
// for Denmark; a polity with no country grant has none). The seat is the
// cluster holding the most regions cut from that country. Ties go to area
// (clusters arrive largest first, and only a strictly better count moves the
// seat); a polity without a home, or whose home regions sit in no cluster,
// keeps the largest — nothing changes for it.
export const seatIndex = (clusters, homeCode, gid0Of) => {
  const home = String(homeCode ?? "").trim();
  if (!home || !clusters?.length) return 0;
  let seat = 0;
  let best = 0;
  for (let index = 0; index < clusters.length; index += 1) {
    let count = 0;
    for (const member of clusters[index].members ?? []) if (gid0Of(member) === home) count += 1;
    if (count > best) {
      best = count;
      seat = index;
    }
  }
  return seat;
};

/*! Open Historia — which regions touch, and where a territory's label sits © 2026 Nicholas Krol, MIT (see src/Editor/LICENSE). */
// FOUR PURE PIECES OF THE OWNER-LABEL BUILDER (Nations.jsx), split out so they
// can be tested without the map: which regions are contiguous, which piece of
// a merged territory carries its label, which of an owner's territories is its
// seat, and where on its piece the label finally sits.
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
// the largest of them; a cluster that never merged is its own only piece. The
// snapshot keeps the piece's own region list too (copied — the merge appends to
// the live one), because the fit below has to know which regions' outlines the
// label must stay inside of.
export const snapshotClusterPart = (cluster) => ({
  cx: cluster.cx,
  cy: cluster.cy,
  area: cluster.area,
  members: [...(cluster.members ?? [])],
});

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

// ── Fit ────────────────────────────────────────────────────────────────────
//
// WHERE ON ITS PIECE THE LABEL SITS. The anchor above is the piece's centroid,
// and a centroid is a fine place for a label only while the shape is convex.
// It is not for a crescent (Croatia's centroid is in Bosnia; Norway's is in
// Sweden; Somalia's is in the Ogaden), an S (Vietnam, Chile), a shape with a
// hole (South Africa's is inside Lesotho), or a V (Somalia). Measured across
// the fleet on 2026-08-18 — 24 boards, 2,947 flat labels — the anchor sits
// outside its own piece for 77 of them (2.6%, 38 distinct territories), and the
// commoner fault is milder: the LABEL, sized by √area and tilted along the axis,
// sticks out over a border. Only 1,810 (61%) sit wholly on their own land at the
// anchor; the mean is 94% inside.
//
// The plan was the pole of inaccessibility (the point deepest inside the
// shape). Measured, it is worse: it maximises an inscribed CIRCLE, so it drifts
// to the roundest bulge, and a long tilted label wants the middle of the long
// axis instead — 1836 went from 64 to 52 wholly-inside labels, and 72 of 116
// moved more than an em for no visible reason. What works is to fit the LABEL'S
// OWN SHAPE: sample the label's rectangle (its wrapped width, its line count,
// its tilt) against the piece and look, near the anchor, for the spot where the
// most of it lands on the piece.
//
//   score(spot) = fraction of the rectangle's sample points on the piece
//                 − LABEL_FIT_PULL × distance from the anchor, in em
//
// The pull is what keeps this from being a different rule: a label that already
// sits wholly on its land does not move at all, and one that does not moves the
// least distance that fixes it. Fleet result, this code through the label
// builder (obstacles on, see below): 1,151 labels move (39%), median 0.48 em,
// p90 1.9 em, 622 of them under half an em; wholly-inside 1,810 → 2,584 (61% →
// 88%), mean inside 94.1% → 99.1%, and no placed label's centre is off its
// piece any more. The 17 still under 70% are archipelago provinces (Solomons,
// Lesser Sunda — one region, many islands, so the piece's centroid is sea) and
// Honshu, where no straight label fits and only a curve would. Without the
// pull (λ = 0) three more labels fit and one jumps 12.6 em — rejected.
//
// OBSTACLES. The spot the label moves to may be where a small neighbour's
// leader-line label sits (Hanover onto Waldeck-Pyrmont, Kayor onto Sine on 1836)
// or where another country's label already is. Every other label box the map
// will draw — leader labels, curved glyphs, the other flat labels at their
// current spots — is erased from the piece before the search, so a spot under
// one counts as off-land. Fleet: label-on-label overlaps 34 → 2 (Congo off
// Rwanda and Burundi, Khiva off Bukhara, Rajputana off British India), leader
// labels covered by a country's name 66 → 36 (Gambia, Kosovo, San Marino,
// Modena, Parma, Thomond, Genoa, Savoy… come back), where the search without
// obstacles had made them 68. What it costs: three of Portugal's repeated names
// and Neuchâtel's leader label go under a neighbour that moved, and Serbia and
// Byzantium touch on 1300 — a corner overlap the pull would not spend an em on.
//
// The search runs on a RASTER of the piece — its member regions' largest
// polygons scan-filled into a grid LABEL_FIT_CELLS wide — rather than on the
// outlines. Two reasons: the raster is a union, so the internal borders between
// a country's provinces and the hairline gaps between two of its countries
// (labelClusters' 1e-2° story) vanish on their own; and it costs O(edges +
// cells) once, after which every sample is an array read. 64, 128 and 256 cells
// choose the same spots on 1836; 256 is the dial because a ragged coast (the
// Bay of Fundy under New Brunswick's label) reads as water rather than land at
// that grain, for 20 ms more per build there. The whole pass is ~100 ms on
// 1836's 116 flat labels once the regions are projected (Nations.jsx keeps
// those), against the ~550 ms the builder already spends. Coordinates are
// whatever plane the caller works in — the label builder passes web-mercator
// tile units, in which a label's box is zoom-independent (text and map both
// scale by 2^z) and rotation is MapLibre's clockwise `text-rotate` — and `em`
// is one em of the label in that plane, so the pull is measured in letters,
// not in degrees.
export const LABEL_FIT_CELLS = 256;
export const LABEL_FIT_PULL = 0.03;
// Sample points across the label rectangle: along the baseline, then rows from
// the top line to the bottom. 21 × 5 resolves a corner sticking out by a
// twentieth of the name's width.
export const LABEL_FIT_SAMPLES_ALONG = 21;
export const LABEL_FIT_SAMPLES_ACROSS = 5;
// A label is left where it is at this coverage — "wholly on its land", less
// one sample's worth of tolerance for a border running exactly through the
// rectangle's edge.
const LABEL_FIT_SETTLED = 0.999;
// A raster too coarse to hold a sliver of a piece is redrawn finer, up to here.
const LABEL_FIT_MIN_CELLS_INSIDE = 60;
const LABEL_FIT_MAX_CELLS = 1024;
// The candidate scan visits every stride-th cell first, then refines around
// the best at single cells: 48 steps across the piece is enough for a spot the
// pull will settle within a cell anyway.
const LABEL_FIT_SCAN_STEPS = 48;

const ringArea = (ring) => {
  let area = 0;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i, i += 1) {
    area += ring[j][0] * ring[i][1] - ring[i][0] * ring[j][1];
  }
  return Math.abs(area) / 2;
};

// A region's largest polygon — outer ring first, holes after — the same
// polygon whose outer ring the label builder measures for the region's
// centroid and area (its largestRingOf), so what the fit stays inside of is
// what the anchor was computed from. Null for no geometry.
export const largestPolygonOf = (geometry) => {
  const polys = geometry?.type === "Polygon"
    ? [geometry.coordinates]
    : geometry?.type === "MultiPolygon" ? geometry.coordinates : [];
  let best = null;
  let bestArea = -1;
  for (const poly of polys) {
    const outer = poly?.[0];
    if (!outer || outer.length < 3) continue;
    const area = ringArea(outer);
    if (area > bestArea) {
      bestArea = area;
      best = poly;
    }
  }
  return best;
};

// A label's box in the working plane: centre, half extents, clockwise rotation
// in degrees. Corners plus an axis-aligned bound for cheap rejection.
export const labelBox = ([cx, cy], halfWidth, halfHeight, rotationDeg = 0) => {
  const r = (rotationDeg * Math.PI) / 180;
  const co = Math.cos(r);
  const si = Math.sin(r);
  const corners = [[-halfWidth, -halfHeight], [halfWidth, -halfHeight], [halfWidth, halfHeight], [-halfWidth, halfHeight]]
    .map(([dx, dy]) => [cx + dx * co - dy * si, cy + dx * si + dy * co]);
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const [x, y] of corners) {
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }
  return { corners, minX, minY, maxX, maxY };
};

const pointInRing = (pt, ring) => {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i, i += 1) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    if ((yi > pt[1]) !== (yj > pt[1]) && pt[0] < ((xj - xi) * (pt[1] - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
};

// A polygon projected into the working plane and flattened: every ring's
// vertices end to end in two typed arrays, `ringStart[k]` .. `ringStart[k+1]`
// being ring k (the outer ring first). One allocation, no per-vertex objects —
// the label builder projects each region's polygon once and keeps it, so a
// rebuild after an ownership change re-fills rasters but re-projects nothing.
export const projectPolygon = (polygon, project) => {
  const rings = (polygon ?? []).filter((ring) => ring?.length >= 3);
  let total = 0;
  for (const ring of rings) total += ring.length;
  const xs = new Float64Array(total);
  const ys = new Float64Array(total);
  const ringStart = new Int32Array(rings.length + 1);
  let v = 0;
  for (let k = 0; k < rings.length; k += 1) {
    ringStart[k] = v;
    for (const point of rings[k]) {
      const [x, y] = project(point);
      xs[v] = x;
      ys[v] = y;
      v += 1;
    }
  }
  ringStart[rings.length] = v;
  return { xs, ys, ringStart };
};

// Scan-fill projected polygons into a grid `cells` wide along the longer side,
// with a cell and a half of margin all round. Even-odd within a polygon (so
// holes are holes), union across polygons. Cost is one pass over the edges
// plus one over the cells.
const rasterizePolygons = (polygons, cells) => {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const { xs, ys, ringStart } of polygons) {
    for (let v = ringStart[0]; v < ringStart[1]; v += 1) {
      const x = xs[v];
      const y = ys[v];
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }
  if (!(maxX >= minX)) return null;
  const width = maxX - minX;
  const height = maxY - minY;
  const cell = Math.max(width, height) / cells || 1e-9;
  const cols = Math.ceil(width / cell) + 3;
  const rows = Math.ceil(height / cell) + 3;
  const x0 = minX - 1.5 * cell;
  const y0 = minY - 1.5 * cell;
  const inside = new Uint8Array(cols * rows);
  const rowCrossings = new Array(rows);
  for (const { xs, ys, ringStart } of polygons) {
    for (let r = 0; r < rows; r += 1) rowCrossings[r] = null;
    for (let k = 0; k + 1 < ringStart.length; k += 1) {
      const from = ringStart[k];
      const to = ringStart[k + 1];
      for (let i = from, j = to - 1; i < to; j = i, i += 1) {
        const ya = ys[j];
        const yb = ys[i];
        if (ya === yb) continue;
        const yLo = ya < yb ? ya : yb;
        const yHi = ya < yb ? yb : ya;
        // Rows whose centre line y0 + (r + 0.5) cell lies within the edge's span.
        let rStart = Math.ceil((yLo - y0) / cell - 0.5);
        let rEnd = Math.floor((yHi - y0) / cell - 0.5);
        if (rStart < 0) rStart = 0;
        if (rEnd > rows - 1) rEnd = rows - 1;
        if (rStart > rEnd) continue;
        const xa = xs[j];
        const xb = xs[i];
        for (let r = rStart; r <= rEnd; r += 1) {
          const yc = y0 + (r + 0.5) * cell;
          if ((ya > yc) === (yb > yc)) continue;
          (rowCrossings[r] ??= []).push(xa + ((yc - ya) * (xb - xa)) / (yb - ya));
        }
      }
    }
    for (let r = 0; r < rows; r += 1) {
      const crossings = rowCrossings[r];
      if (!crossings || crossings.length < 2) continue;
      crossings.sort((a, b) => a - b);
      for (let k = 0; k + 1 < crossings.length; k += 2) {
        const cStart = Math.max(0, Math.ceil((crossings[k] - x0) / cell - 0.5));
        const cEnd = Math.min(cols - 1, Math.floor((crossings[k + 1] - x0) / cell - 0.5));
        for (let c = cStart; c <= cEnd; c += 1) inside[r * cols + c] = 1;
      }
    }
  }
  let count = 0;
  for (let i = 0; i < inside.length; i += 1) count += inside[i];
  return { x0, y0, cell, cols, rows, inside, count };
};

const rasterContains = (raster, x, y) => {
  const c = Math.floor((x - raster.x0) / raster.cell);
  const r = Math.floor((y - raster.y0) / raster.cell);
  return c >= 0 && r >= 0 && c < raster.cols && r < raster.rows && raster.inside[r * raster.cols + c] === 1;
};

// Cells whose centre falls inside an obstacle box become off-land.
const eraseBoxes = (raster, boxes) => {
  const { x0, y0, cell, cols, rows, inside } = raster;
  const right = x0 + cols * cell;
  const bottom = y0 + rows * cell;
  for (const box of boxes) {
    if (!box || box.maxX < x0 || box.minX > right || box.maxY < y0 || box.minY > bottom) continue;
    const c0 = Math.max(0, Math.floor((box.minX - x0) / cell));
    const c1 = Math.min(cols - 1, Math.ceil((box.maxX - x0) / cell));
    const r0 = Math.max(0, Math.floor((box.minY - y0) / cell));
    const r1 = Math.min(rows - 1, Math.ceil((box.maxY - y0) / cell));
    for (let r = r0; r <= r1; r += 1) {
      for (let c = c0; c <= c1; c += 1) {
        const i = r * cols + c;
        if (inside[i] && pointInRing([x0 + (c + 0.5) * cell, y0 + (r + 0.5) * cell], box.corners)) inside[i] = 0;
      }
    }
  }
};

// The fraction of the label rectangle's sample points that land on the raster.
const coverageAt = (raster, [cx, cy], halfWidth, halfHeight, rotationDeg, along, across) => {
  const r = (rotationDeg * Math.PI) / 180;
  const ux = Math.cos(r);
  const uy = Math.sin(r);
  let hit = 0;
  for (let i = 0; i < along; i += 1) {
    const t = along === 1 ? 0 : -halfWidth + (2 * halfWidth * i) / (along - 1);
    for (let j = 0; j < across; j += 1) {
      const s = across === 1 ? 0 : -halfHeight + (2 * halfHeight * j) / (across - 1);
      // (ux, uy) along the baseline, (-uy, ux) across it.
      if (rasterContains(raster, cx + ux * t - uy * s, cy + uy * t + ux * s)) hit += 1;
    }
  }
  return hit / (along * across);
};

// THE RULE. Given a piece (its polygons, projected — see projectPolygon), the
// anchor the label would otherwise sit at, the label's half extents and
// rotation, one em in the working plane, and the boxes of the other labels the
// map will draw: the spot to draw the label at, with how much of it lands on
// the piece there (`coverage`) and how much did at the anchor
// (`anchorCoverage`). `moved` says whether the two spots differ. A piece the
// raster cannot see (no polygons, or zero area) keeps the anchor.
export const placeLabelInPiece = ({ polygons, anchor, halfWidth, halfHeight, rotation = 0, em, obstacles = [] }, options = {}) => {
  const {
    cells = LABEL_FIT_CELLS,
    pull = LABEL_FIT_PULL,
    samplesAlong = LABEL_FIT_SAMPLES_ALONG,
    samplesAcross = LABEL_FIT_SAMPLES_ACROSS,
  } = options;
  const keep = { position: anchor, coverage: 0, anchorCoverage: 0, moved: false };
  const polys = (polygons ?? []).filter((poly) => poly?.ringStart?.length >= 2 && poly.ringStart[1] - poly.ringStart[0] >= 3);
  if (!polys.length || !(halfWidth >= 0) || !(halfHeight >= 0) || !(em > 0)) return keep;
  let grid = cells;
  let raster = rasterizePolygons(polys, grid);
  while (raster && raster.count < LABEL_FIT_MIN_CELLS_INSIDE && grid < LABEL_FIT_MAX_CELLS) {
    grid *= 2;
    raster = rasterizePolygons(polys, grid);
  }
  if (!raster || !raster.count) return keep;
  eraseBoxes(raster, obstacles);
  const coverage = (pt) => coverageAt(raster, pt, halfWidth, halfHeight, rotation, samplesAlong, samplesAcross);
  const anchorCoverage = coverage(anchor);
  if (anchorCoverage >= LABEL_FIT_SETTLED) return { position: anchor, coverage: anchorCoverage, anchorCoverage, moved: false };

  const { x0, y0, cell, cols, rows, inside } = raster;
  // The anchor is a candidate too, at zero pull: nothing moves unless somewhere
  // scores strictly better than staying put.
  let best = { position: anchor, coverage: anchorCoverage, score: anchorCoverage };
  let bestCol = -1;
  let bestRow = -1;
  // No spot further than this can beat the best so far: coverage is at most 1,
  // so past reach = (1 − best) · em / pull the pull alone loses. It shrinks as
  // the best improves — a label 90% on its land is settled within a few em.
  let reach = ((1 - best.score) * em) / pull;
  const consider = (c, r) => {
    if (!inside[r * cols + c]) return;
    const x = x0 + (c + 0.5) * cell;
    const y = y0 + (r + 0.5) * cell;
    const distance = Math.hypot(x - anchor[0], y - anchor[1]);
    if (distance > reach) return;
    const cov = coverage([x, y]);
    const score = cov - (pull * distance) / em;
    if (score > best.score + 1e-12) {
      best = { position: [x, y], coverage: cov, score };
      bestCol = c;
      bestRow = r;
      reach = ((1 - best.score) * em) / pull;
    }
  };
  const stride = Math.max(1, Math.floor(grid / LABEL_FIT_SCAN_STEPS));
  const within = (value, lo, hi) => Math.max(lo, Math.min(hi, value));
  const cLo = within(Math.floor((anchor[0] - reach - x0) / cell), 0, cols - 1);
  const cHi = within(Math.ceil((anchor[0] + reach - x0) / cell), 0, cols - 1);
  const rLo = within(Math.floor((anchor[1] - reach - y0) / cell), 0, rows - 1);
  const rHi = within(Math.ceil((anchor[1] + reach - y0) / cell), 0, rows - 1);
  for (let r = rLo; r <= rHi; r += stride) for (let c = cLo; c <= cHi; c += stride) consider(c, r);
  if (bestCol >= 0 && stride > 1) {
    const c0 = Math.max(0, bestCol - stride);
    const c1 = Math.min(cols - 1, bestCol + stride);
    const r0 = Math.max(0, bestRow - stride);
    const r1 = Math.min(rows - 1, bestRow + stride);
    for (let r = r0; r <= r1; r += 1) for (let c = c0; c <= c1; c += 1) consider(c, r);
  }
  return { position: best.position, coverage: best.coverage, anchorCoverage, moved: best.position !== anchor };
};

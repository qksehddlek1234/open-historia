/*!
 * Open Historia Map Editor
 * Copyright (c) 2026 Nicholas Krol - MIT License (see src/Editor/LICENSE).
 */

// Plan F, stage F-2 — from filtered border LINES to named polity FACES.
//
// The input is what stage F-1 dumps: admin_level-2 boundary line fragments,
// tile-clipped, rounded to 5 decimals. This module rebuilds the planar map
// those lines describe: weld small gaps shut (the snap tolerance is the
// MEASURED 0.06° plateau from the 1939 Europe calibration, not a guess),
// prune the chains that still lead nowhere (OHM's unfinished borders — they
// cannot bound a face, and pretending otherwise would invent territory),
// trace every face of the resulting planar graph, hang hole rings on the
// faces that contain them, then hand each face to the polity whose label
// point sits inside it.
//
// Everything here is pure — no fetch, no fs, no clock — so the whole assembly
// is testable offline against synthetic shapes and the committed real-data
// fixture. Every discard is COUNTED AND NAMED in the report: a face lost to a
// broken border must show up as a number a human reads, never as quiet
// absence (the same contract the game engine holds itself to).
//
// What this deliberately does NOT do: node crossing segments (OSM ways share
// junction nodes, so mid-segment crossings are rare simplification artifacts;
// they are DETECTED and reported, not repaired), and boolean-union faces per
// polity (faces sharing a border already share vertices; the game colors
// them as one country without needing a dissolve).

import { clipPartToBbox } from "./eraBorders.mjs";

const keyOf = (pt) => `${pt[0]},${pt[1]}`;
const round5 = (n) => Math.round(n * 1e5) / 1e5;

// Same sliver threshold as scripts/extract-regions.mjs: ~6000 m² in deg².
export const AREA_EPS = 5e-7;

// The measured weld distance: 174 of 208 calibration dangles pair inside
// 0.06°, and widening to 0.15° gains just two more — a hard plateau.
export const SNAP_TOLERANCE = 0.06;

// ---------------------------------------------------------------------------
// Segments -> graph
// ---------------------------------------------------------------------------

const walkParts = (geometry) => {
  if (!geometry) return [];
  if (geometry.type === "LineString") return [geometry.coordinates];
  if (geometry.type === "MultiLineString") return geometry.coordinates;
  return [];
};

// GeoJSON features -> deduplicated 2-point segments. admin_level is compared
// numerically (tiles carry both 2 and "2"). Duplicate segments — the same
// border shipped by two overlapping tile fragments, or an empire boundary
// retraced over a national one — collapse to one edge, which is what lets the
// face walk treat the input as a simple planar graph.
//
// windowBbox is the FRAME rule, and it is what makes windowed dumps
// assemblable at all. A dump fetched for a window cuts every border that
// crosses the window's edge; without help those cut ends read as dangles,
// pruning eats the chain to the nearest junction, and the cascade swallowed
// 55% of the calibration window's segments (measured 2026-08-09). The cure is
// the study-area standard: clip everything to the window, then lay the
// window's own boundary down as segments, SPLIT at every point where a border
// touches it — countries at the edge close against the frame instead of
// bleeding out. Sea faces the frame creates carry no label and fall out in
// assignment (and under the land mask).
// adminLevel is a CEILING (keep level ≤ adminLevel), not an equality match.
// Measured 2026-08-12: the old equality filter silently discarded 1,153
// level-3 lines from the tile ≤3 dump — the "admin-level hypothesis is
// wrong" verdict of 08-11 was measured on a graph those lines never
// entered, so it was void — and it was still discarding 1,371 level-1
// lines (supranational rings: the German Confederation) from every
// Overpass run. Non-numeric levels stay skipped and counted.
export const normalizeSegments = (features, { adminLevel = 2, windowBbox = null, extraParts = [] } = {}) => {
  const segments = [];
  const seen = new Set();
  let zeroLength = 0;
  let duplicates = 0;
  let skippedAdmin = 0;
  let clippedAway = 0;
  const bbox = windowBbox ? windowBbox.map(round5) : null;
  const touches = bbox ? { west: new Set(), east: new Set(), south: new Set(), north: new Set() } : null;

  const push = (a, b) => {
    const ka = keyOf(a);
    const kb = keyOf(b);
    if (ka === kb) {
      zeroLength += 1;
      return;
    }
    const key = ka < kb ? `${ka}|${kb}` : `${kb}|${ka}`;
    if (seen.has(key)) {
      duplicates += 1;
      return;
    }
    seen.add(key);
    segments.push([a, b]);
  };
  const noteTouch = (pt) => {
    if (pt[0] === bbox[0]) touches.west.add(pt[1]);
    if (pt[0] === bbox[2]) touches.east.add(pt[1]);
    if (pt[1] === bbox[1]) touches.south.add(pt[0]);
    if (pt[1] === bbox[3]) touches.north.add(pt[0]);
  };

  const ingestPart = (rawPart) => {
    const parts = bbox ? clipPartToBbox(rawPart, bbox).map((p) => p.map(([x, y]) => [round5(x), round5(y)])) : [rawPart];
    if (bbox && parts.length === 0) clippedAway += 1;
    for (const part of parts) {
      if (bbox) {
        noteTouch(part[0]);
        noteTouch(part[part.length - 1]);
      }
      for (let i = 0; i + 1 < part.length; i += 1) push(part[i], part[i + 1]);
    }
  };

  for (const feature of features) {
    const level = Number(feature?.properties?.admin_level);
    if (adminLevel !== null && !(Number.isFinite(level) && level <= adminLevel)) {
      skippedAdmin += 1;
      continue;
    }
    for (const rawPart of walkParts(feature.geometry)) ingestPart(rawPart);
  }
  const beforeExtra = segments.length;
  for (const part of extraParts) ingestPart(part);
  const extraSegments = segments.length - beforeExtra;

  let frameSegments = 0;
  if (bbox) {
    const [w, s, e, n] = bbox;
    const edges = [
      { pts: touches.west, fixed: w, axis: "y", from: s, to: n, make: (v) => [w, v] },
      { pts: touches.east, fixed: e, axis: "y", from: s, to: n, make: (v) => [e, v] },
      { pts: touches.south, fixed: s, axis: "x", from: w, to: e, make: (v) => [v, s] },
      { pts: touches.north, fixed: n, axis: "x", from: w, to: e, make: (v) => [v, n] },
    ];
    for (const edge of edges) {
      const stations = [...new Set([edge.from, edge.to, ...edge.pts])].sort((a, b) => a - b);
      for (let i = 0; i + 1 < stations.length; i += 1) {
        push(edge.make(stations[i]), edge.make(stations[i + 1]));
        frameSegments += 1;
      }
    }
  }
  return {
    segments,
    stats: { segments: segments.length, zeroLength, duplicates, skippedAdmin, clippedAway, extraSegments, frameSegments },
  };
};

// Thin a coast ring with a radial-distance pass. Modern coasts carry ~1 m
// detail; the era borders they will fuse with carry kilometres. Feeding the
// full coast in would bloat the graph tenfold for detail the game never
// draws. Never applied to era borders — only to the modern mask.
export const decimateRing = (ring, tol) => {
  if (!tol || ring.length <= 4) return ring;
  const out = [ring[0]];
  for (let i = 1; i + 1 < ring.length; i += 1) {
    const last = out[out.length - 1];
    if (Math.hypot(ring[i][0] - last[0], ring[i][1] - last[1]) >= tol) out.push(ring[i]);
  }
  out.push(ring[ring.length - 1]);
  return out.length >= 4 ? out : ring;
};

export const buildGraph = (segments) => {
  const nodes = new Map(); // key -> { pt, nbrs: Set<key> }
  const ensure = (pt) => {
    const key = keyOf(pt);
    if (!nodes.has(key)) nodes.set(key, { pt, nbrs: new Set() });
    return key;
  };
  for (const [a, b] of segments) {
    const ka = ensure(a);
    const kb = ensure(b);
    nodes.get(ka).nbrs.add(kb);
    nodes.get(kb).nbrs.add(ka);
  }
  return nodes;
};

// ---------------------------------------------------------------------------
// Noding: split segments where they CROSS without sharing a vertex
// ---------------------------------------------------------------------------

// The first real Europe run walked 321 anomalous rings, and every one traces
// back to un-noded crossings: coast decimation folding a fjord over itself,
// an era border overshooting the modern shoreline into the sea, two union
// pieces overlapping. A planar face walk is only correct on a PLANAR graph —
// so crossings are found (grid hash), both segments are split at the meeting
// point, and the walk gets the graph its math assumes. Sea-side border stubs
// created by a split die in the dangle prune, which is exactly where a border
// that overshoots the coast belongs. Collinear overlaps are counted, not
// repaired (rare, and reported).
export const nodeCrossings = (nodes, trace) => {
  const CELL = 0.25;
  const cellKey = (cx, cy) => `${cx}:${cy}`;
  const grid = new Map();
  const segs = [];
  // Each segment's cell footprint, flat, kept so a PAIR can work out where it
  // is allowed to test itself — see the canonical-cell rule below.
  const box = [];
  for (const [ka, node] of nodes) {
    for (const kb of node.nbrs) {
      if (ka >= kb) continue;
      const idx = segs.length;
      segs.push([ka, kb]);
      const a = node.pt;
      const b = nodes.get(kb).pt;
      const x0 = Math.floor(Math.min(a[0], b[0]) / CELL);
      const x1 = Math.floor(Math.max(a[0], b[0]) / CELL);
      const y0 = Math.floor(Math.min(a[1], b[1]) / CELL);
      const y1 = Math.floor(Math.max(a[1], b[1]) / CELL);
      box.push(x0, y0, x1, y1);
      for (let cx = x0; cx <= x1; cx += 1) {
        for (let cy = y0; cy <= y1; cy += 1) {
          const key = cellKey(cx, cy);
          if (!grid.has(key)) grid.set(key, []);
          grid.get(key).push(idx);
        }
      }
    }
  }
  const T_EPS = 1e-6;
  const splits = new Map(); // seg idx -> [{ t, pt }]
  const addSplit = (idx, t, pt) => {
    if (!splits.has(idx)) splits.set(idx, []);
    splits.get(idx).push({ t, pt });
  };
  let collinearPairs = 0;
  // The pair workload, reported. This is the number that used to be the Set's
  // size, and it is what a scaling wall looks like BEFORE it becomes a crash:
  // 1939's tile dump does ~5M, and the 1836 Overpass dump went past 16.7M.
  let pairsTested = 0;
  // THE CANONICAL CELL, and why this is not a Set of pair keys any more.
  //
  // A pair of segments both spanning several cells meets in every cell they
  // share, so the pair has to be deduplicated or it is tested many times. The
  // first version remembered every pair it had tried, in a Set of `${si}|${sj}`
  // strings that was never released — its size is the number of DISTINCT
  // CANDIDATE PAIRS IN THE WHOLE WINDOW, which is superlinear in segment
  // density. Fed the Overpass dump for 1836 (whole ways instead of
  // tile-clipped fragments) it went past V8's ~16.7M Set ceiling and threw
  // `RangeError: Set maximum size exceeded` — a hard stop, mid-assembly.
  //
  // No memory is needed for this. Both segments occupy the cell they met in,
  // so their cell ranges overlap, and the lowest cell of that overlap —
  // (max(x0), max(y0)) — is a cell both of them occupy and both agree on. Test
  // there and skip everywhere else: exactly one test per pair, nothing
  // remembered, and the same answer, since an intersection does not depend on
  // which cell noticed it.
  for (const [key, bucket] of grid) {
    const sep = key.indexOf(":");
    const cx = Number(key.slice(0, sep));
    const cy = Number(key.slice(sep + 1));
    for (let i = 0; i < bucket.length; i += 1) {
      for (let j = i + 1; j < bucket.length; j += 1) {
        const si = bucket[i];
        const sj = bucket[j];
        const bi = si * 4;
        const bj = sj * 4;
        const canonX = box[bi] > box[bj] ? box[bi] : box[bj];
        const canonY = box[bi + 1] > box[bj + 1] ? box[bi + 1] : box[bj + 1];
        if (cx !== canonX || cy !== canonY) continue;
        pairsTested += 1;
        const [ka, kb] = segs[si];
        const [kc, kd] = segs[sj];
        if (ka === kc || ka === kd || kb === kc || kb === kd) {
          // Sharing a vertex is normally "already noded" — EXCEPT the shadow
          // edge: v->a and v->b collinear in the SAME direction, a strictly
          // between v and b. Two edges leave v at the exact same angle, the
          // fan ordering degenerates, and every face walk through v falls
          // into a cycle that never returns (the Vennbahn trap that swallowed
          // Germany, Belgium and Luxembourg). Split the long edge at the near
          // endpoint; the duplicated stretch collapses in the Set adjacency.
          const shared = ka === kc || ka === kd ? ka : kb;
          const pKey = shared === ka ? kb : ka;
          const qKey = shared === kc ? kd : kc;
          if (pKey === qKey) continue;
          const vPt = nodes.get(shared).pt;
          const pPt = nodes.get(pKey).pt;
          const qPt = nodes.get(qKey).pt;
          const vp = [pPt[0] - vPt[0], pPt[1] - vPt[1]];
          const vq = [qPt[0] - vPt[0], qPt[1] - vPt[1]];
          if (vp[0] * vq[1] - vp[1] * vq[0] !== 0) continue; // not collinear
          if (vp[0] * vq[0] + vp[1] * vq[1] <= 0) continue; // opposite directions: fine
          const lp = vp[0] * vp[0] + vp[1] * vp[1];
          const lq = vq[0] * vq[0] + vq[1] * vq[1];
          if (lp === lq) continue;
          collinearPairs += 1;
          const [longIdx, longSeg, nearPt] = lp < lq ? [sj, segs[sj], pPt] : [si, segs[si], qPt];
          const [la, lb] = longSeg;
          const aPt = nodes.get(la).pt;
          const bPt = nodes.get(lb).pt;
          const dir = [bPt[0] - aPt[0], bPt[1] - aPt[1]];
          const len2 = dir[0] * dir[0] + dir[1] * dir[1];
          if (len2 === 0) continue;
          const t = ((nearPt[0] - aPt[0]) * dir[0] + (nearPt[1] - aPt[1]) * dir[1]) / len2;
          trace?.({ kind: "shadow", seg: [la, lb], t, pt: nearPt });
          if (t > T_EPS && t < 1 - T_EPS) addSplit(longIdx, t, nearPt);
          continue;
        }
        const a = nodes.get(ka).pt;
        const b = nodes.get(kb).pt;
        const c = nodes.get(kc).pt;
        const d = nodes.get(kd).pt;
        const r = [b[0] - a[0], b[1] - a[1]];
        const s = [d[0] - c[0], d[1] - c[1]];
        const denom = r[0] * s[1] - r[1] * s[0];
        if (denom === 0) {
          // Parallel. EXACT-collinear overlaps are the walk-killer (the
          // Vennbahn corridor took Germany, Belgium and Luxembourg down with
          // one degenerate double line): split each segment at the other's
          // interior endpoints — the shared stretch becomes the SAME edge and
          // the Set adjacency collapses the duplicate for free.
          if ((c[0] - a[0]) * r[1] !== (c[1] - a[1]) * r[0]) continue;
          const len2 = r[0] * r[0] + r[1] * r[1];
          const sLen2 = s[0] * s[0] + s[1] * s[1];
          if (len2 === 0 || sLen2 === 0) continue;
          const tAt = (p) => ((p[0] - a[0]) * r[0] + (p[1] - a[1]) * r[1]) / len2;
          const tc = tAt(c);
          const td = tAt(d);
          if (Math.max(tc, td) <= T_EPS || Math.min(tc, td) >= 1 - T_EPS) continue; // no shared extent
          collinearPairs += 1;
          trace?.({ kind: "overlap", segA: [ka, kb], segB: [kc, kd], tc, td });
          for (const [p, t] of [[c, tc], [d, td]]) {
            if (t > T_EPS && t < 1 - T_EPS) addSplit(si, t, p);
          }
          const uAt = (p) => ((p[0] - c[0]) * s[0] + (p[1] - c[1]) * s[1]) / sLen2;
          for (const p of [a, b]) {
            const u = uAt(p);
            if (u > T_EPS && u < 1 - T_EPS) addSplit(sj, u, p);
          }
          continue;
        }
        const t = ((c[0] - a[0]) * s[1] - (c[1] - a[1]) * s[0]) / denom;
        const u = ((c[0] - a[0]) * r[1] - (c[1] - a[1]) * r[0]) / denom;
        if (t <= T_EPS || t >= 1 - T_EPS || u <= T_EPS || u >= 1 - T_EPS) continue;
        // The gate above judged the EXACT t/u; the split point gets ROUNDED.
        // A crossing that sits within a couple of rounding quanta of a
        // segment endpoint is a quantization artifact, not a real interior
        // crossing — two copies of the same border whose tips round one
        // quantum apart. Splitting at the rounded point MANUFACTURES a new
        // node one quantum past the tip, re-anchors both segments to it, and
        // the next pass finds the same configuration one step further down: a
        // staircase that never converges (measured at the Albania/Montenegro
        // corner, 19.3782°E 42.063°N — tips 1e-5 apart, crossings landing
        // 0.8–1.8 quanta from them, one new node per pass; the local
        // session's review pinned the discard side of this same rounding
        // collision). Resolution: within END_TOL of an endpoint the endpoint
        // IS the junction — split only the OTHER segment there (T-junction),
        // never mint a new node. END_TOL = 2e-5: two round5 quanta, covering
        // the measured 0.8–1.8-quantum staircase family with margin for the
        // ≤0.71-quantum displacement a single round5 can add.
        const X = [a[0] + t * r[0], a[1] + t * r[1]];
        const END_TOL = 2e-5;
        const d2 = (p, q) => (p[0] - q[0]) * (p[0] - q[0]) + (p[1] - q[1]) * (p[1] - q[1]);
        const near = [
          { d: d2(X, a), own: si, other: sj, tOther: u, pt: a },
          { d: d2(X, b), own: si, other: sj, tOther: u, pt: b },
          { d: d2(X, c), own: sj, other: si, tOther: t, pt: c },
          { d: d2(X, d), own: sj, other: si, tOther: t, pt: d },
        ].filter((e) => e.d <= END_TOL * END_TOL).sort((p, q) => p.d - q.d)[0];
        const pt = [round5(X[0]), round5(X[1])];
        trace?.({ kind: "cross", segA: [ka, kb], segB: [kc, kd], t, u, pt, tjunction: Boolean(near) });
        if (near) {
          addSplit(near.other, near.tOther, near.pt);
        } else {
          addSplit(si, t, pt);
          addSplit(sj, u, pt);
        }
      }
    }
  }
  let crossingsSplit = 0;
  for (const [idx, list] of splits) {
    const [ka, kb] = segs[idx];
    const na = nodes.get(ka);
    const nb = nodes.get(kb);
    if (!na || !nb || !na.nbrs.has(kb)) continue;
    const stations = [...new Map(list.map((sp) => [keyOf(sp.pt), sp])).values()]
      .filter((sp) => keyOf(sp.pt) !== ka && keyOf(sp.pt) !== kb)
      .sort((p, q) => p.t - q.t);
    if (stations.length === 0) continue;
    na.nbrs.delete(kb);
    nb.nbrs.delete(ka);
    const chain = [ka, ...stations.map((sp) => keyOf(sp.pt)), kb];
    for (const sp of stations) {
      if (!nodes.has(keyOf(sp.pt))) nodes.set(keyOf(sp.pt), { pt: sp.pt, nbrs: new Set() });
    }
    for (let i = 0; i + 1 < chain.length; i += 1) {
      if (chain[i] === chain[i + 1]) continue;
      nodes.get(chain[i]).nbrs.add(chain[i + 1]);
      nodes.get(chain[i + 1]).nbrs.add(chain[i]);
    }
    crossingsSplit += 1;
  }
  return { crossingsSplit, collinearPairs, pairsTested };
};

// ---------------------------------------------------------------------------
// Snap, then prune
// ---------------------------------------------------------------------------

// Weld pairs of loose ends that sit within the tolerance: each is greedily
// matched to its nearest unmatched partner. The pair must not already share
// an edge (welding both ends of one stub would fabricate a zero-area loop).
// Welding REWRITES the second node onto the first, so downstream stages see
// one shared vertex — exactly as if the mapper had finished the border.
//
// THE SKELETON PREVIEW — the value oracle both snap stages weld by. Run the
// prune on a scratch copy BEFORE any welding: what survives is the cycle
// skeleton (coasts, the frame, every closed ring), and what dies is doomed
// geometry — scraps, unfinished borders, clipped tails. A weld's VALUE is
// where it leads: welding a tip to the skeleton anchors its chain; welding
// it to doomed geometry postpones the same death and, at worst, fabricates
// a micro-loop that carries the chain as a face-splitting-nothing BRIDGE
// (the 121-step lollipop at [4.863, 49.868] that kept France+Belgium one
// face at every tolerance, 2026-08-12). Preference, never refusal: two
// refusal guards collapsed coverage 32.1%→10.1%/10.0% by killing dense-web
// T-junctions, so here every candidate stays legal — skeleton targets just
// win over doomed ones whenever both are in reach. No thresholds, no new
// constants: the discriminator is the graph's own survival structure.
export const previewAnchors = (nodes) => {
  const scratch = new Map();
  for (const [k, n] of nodes) scratch.set(k, { nbrs: new Set(n.nbrs) });
  const queue = [...scratch.entries()].filter(([, n]) => n.nbrs.size <= 1).map(([k]) => k);
  while (queue.length > 0) {
    const key = queue.pop();
    const node = scratch.get(key);
    if (!node || node.nbrs.size > 1) continue;
    for (const nbrKey of node.nbrs) {
      const nbr = scratch.get(nbrKey);
      nbr.nbrs.delete(key);
      if (nbr.nbrs.size <= 1) queue.push(nbrKey);
    }
    scratch.delete(key);
  }
  const doomed = new Set();
  for (const k of nodes.keys()) if (!scratch.has(k)) doomed.add(k);
  // A loose end is by definition doomed — the question is what its chain
  // hangs onto. Flood the doomed subgraph: a component with at least one
  // edge into a survivor is ANCHORED (a border reaching the coast at one
  // end); a component with none is a free-floating scrap. Welding to the
  // former can complete a separator; welding to the latter can only
  // postpone a death or fabricate a lollipop.
  const leads = new Set();
  const seen = new Set();
  for (const start of doomed) {
    if (seen.has(start)) continue;
    const members = [];
    const stack = [start];
    seen.add(start);
    let anchored = false;
    while (stack.length > 0) {
      const k = stack.pop();
      members.push(k);
      for (const nb of nodes.get(k)?.nbrs ?? []) {
        if (!doomed.has(nb)) {
          anchored = true;
          continue;
        }
        if (!seen.has(nb)) {
          seen.add(nb);
          stack.push(nb);
        }
      }
    }
    if (anchored) for (const k of members) leads.add(k);
  }
  return { doomed, leads };
};

// leadsSomewhere: survives the preview outright, or rides an anchored chain.
const mkLeads = (anchors) => (anchors
  ? (k) => !anchors.doomed.has(k) || anchors.leads.has(k)
  : () => true);

export const snapDangles = (nodes, tolerance = SNAP_TOLERANCE, anchors = null) => {
  const loose = [...nodes.entries()].filter(([, n]) => n.nbrs.size === 1).map(([k, n]) => ({ key: k, pt: n.pt }));
  const used = new Set();
  const welds = [];
  const leadsSomewhere = mkLeads(anchors);
  for (let i = 0; i < loose.length; i += 1) {
    if (used.has(i)) continue;
    // Two ranks: nearest partner that leads somewhere, and nearest of any
    // kind. Preference, never refusal — with no preview, one rank as before.
    let best = -1;
    let bestDist = Infinity;
    let bestLead = -1;
    let bestLeadDist = Infinity;
    for (let j = i + 1; j < loose.length; j += 1) {
      if (used.has(j)) continue;
      const d = Math.hypot(loose[i].pt[0] - loose[j].pt[0], loose[i].pt[1] - loose[j].pt[1]);
      if (d < bestDist) {
        bestDist = d;
        best = j;
      }
      if (d < bestLeadDist && leadsSomewhere(loose[j].key)) {
        bestLeadDist = d;
        bestLead = j;
      }
    }
    if (bestLead >= 0 && bestLeadDist <= tolerance) {
      best = bestLead;
      bestDist = bestLeadDist;
    }
    if (best < 0 || bestDist > tolerance) continue;
    const a = nodes.get(loose[i].key);
    const b = nodes.get(loose[best].key);
    if (!a || !b || a.nbrs.has(loose[best].key)) continue;
    used.add(i);
    used.add(best);
    // Move every edge of b onto a, then delete b.
    for (const nbrKey of b.nbrs) {
      const nbr = nodes.get(nbrKey);
      nbr.nbrs.delete(loose[best].key);
      if (nbrKey !== loose[i].key) {
        nbr.nbrs.add(loose[i].key);
        a.nbrs.add(nbrKey);
      }
    }
    nodes.delete(loose[best].key);
    welds.push({ from: loose[best].pt, to: loose[i].pt, dist: bestDist });
  }
  return welds;
};

// Fuse remaining loose ends onto the NETWORK — the second snap stage, and the
// one that makes hybrid geometry work at all. Measured (2026-08-09): OHM's
// line tiles carry land borders but essentially no coastlines, so a border
// reaching the sea ends in a point that coincides with NOTHING — the modern
// coast ring passes nearby but shares no vertex. This stage projects each
// loose end onto the nearest network segment within the tolerance, SPLITS
// that segment at the landing point, and merges the loose end into it. The
// same move repairs T-junctions the tiler's simplification un-noded.
export const snapLooseEndsToNetwork = (nodes, tolerance = SNAP_TOLERANCE, anchors = null) => {
  if (!tolerance || tolerance <= 0) return { joins: 0, splits: 0 };
  const leadsSomewhere = mkLeads(anchors);
  const cellSize = Math.max(tolerance * 2, 0.12);
  const cellKey = (cx, cy) => `${cx}:${cy}`;
  const grid = new Map();
  const addSeg = (ka, kb) => {
    const a = nodes.get(ka).pt;
    const b = nodes.get(kb).pt;
    const x0 = Math.floor((Math.min(a[0], b[0]) - tolerance) / cellSize);
    const x1 = Math.floor((Math.max(a[0], b[0]) + tolerance) / cellSize);
    const y0 = Math.floor((Math.min(a[1], b[1]) - tolerance) / cellSize);
    const y1 = Math.floor((Math.max(a[1], b[1]) + tolerance) / cellSize);
    for (let cx = x0; cx <= x1; cx += 1) {
      for (let cy = y0; cy <= y1; cy += 1) {
        const key = cellKey(cx, cy);
        if (!grid.has(key)) grid.set(key, []);
        grid.get(key).push([ka, kb]);
      }
    }
  };
  for (const [ka, node] of nodes) {
    for (const kb of node.nbrs) if (ka < kb) addSeg(ka, kb);
  }
  const loose = [...nodes.keys()].filter((k) => nodes.get(k)?.nbrs.size === 1);
  let joins = 0;
  let splits = 0;
  for (const ke of loose) {
    const eNode = nodes.get(ke);
    if (!eNode || eNode.nbrs.size !== 1) continue;
    const [ex, ey] = eNode.pt;
    // THE LOOSE END'S OWN TAIL IS ALWAYS THE NEAREST GEOMETRY. At full
    // resolution the segment one step behind the tip sits a vertex-spacing
    // away (measured on the 1836 Overpass dump: 0.0001–0.001°), so a search
    // that only excludes the tip's own edges projects onto it at t≈0, "joins"
    // the tip to its own neighbour, and the merge deletes the tip edge — the
    // join counter rises, the chain gets one vertex shorter, and nothing
    // connects to anything. Found by forensics 2026-08-12: of the run's 181
    // reported coast joins, the surviving graph showed border tips 0.043°
    // from real network still loose. The tail is walked up to the tolerance
    // in arc length; segments it owns are refused. Beyond that arc the chain
    // has left the search disc — anything closer is genuinely other geometry.
    const tail = new Set([ke]);
    {
      let prev = ke;
      let cur = eNode.nbrs.values().next().value;
      let arc = 0;
      while (cur !== undefined && !tail.has(cur)) {
        const cNode = nodes.get(cur);
        if (!cNode) break;
        const pNode = nodes.get(prev);
        arc += Math.hypot(cNode.pt[0] - pNode.pt[0], cNode.pt[1] - pNode.pt[1]);
        if (cNode.nbrs.size !== 2) break; // junction: its foreign segments stay admissible
        tail.add(cur);
        if (arc > tolerance) break;
        const nxt = [...cNode.nbrs].find((k) => k !== prev);
        prev = cur;
        cur = nxt;
      }
    }
    let best = null;
    let bestLead = null;
    const ecx = Math.floor(ex / cellSize);
    const ecy = Math.floor(ey / cellSize);
    for (let cx = ecx - 1; cx <= ecx + 1; cx += 1) {
      for (let cy = ecy - 1; cy <= ecy + 1; cy += 1) {
        for (const [ka, kb] of grid.get(cellKey(cx, cy)) ?? []) {
          if (tail.has(ka) || tail.has(kb)) continue;
          const na = nodes.get(ka);
          const nb = nodes.get(kb);
          if (!na || !nb || !na.nbrs.has(kb)) continue; // stale after a split
          const [ax, ay] = na.pt;
          const [bx, by] = nb.pt;
          const dx = bx - ax;
          const dy = by - ay;
          const len2 = dx * dx + dy * dy;
          const t = len2 === 0 ? 0 : Math.max(0, Math.min(1, ((ex - ax) * dx + (ey - ay) * dy) / len2));
          const px = ax + t * dx;
          const py = ay + t * dy;
          const d = Math.hypot(ex - px, ey - py);
          if (d > tolerance) continue;
          if (!best || d < best.d) best = { d, t, ka, kb, px, py };
          // a segment leads somewhere if either endpoint survives the
          // preview or rides an anchored chain — landing there can complete
          // a separator instead of decorating a scrap
          if ((leadsSomewhere(ka) || leadsSomewhere(kb)) && (!bestLead || d < bestLead.d)) {
            bestLead = { d, t, ka, kb, px, py };
          }
        }
      }
    }
    if (bestLead) best = bestLead;
    if (!best) continue;
    let target;
    if (best.t < 1e-6) target = best.ka;
    else if (best.t > 1 - 1e-6) target = best.kb;
    else {
      const p = [round5(best.px), round5(best.py)];
      const kp = keyOf(p);
      if (nodes.has(kp)) {
        target = kp;
      } else {
        nodes.set(kp, { pt: p, nbrs: new Set() });
        const na = nodes.get(best.ka);
        const nb = nodes.get(best.kb);
        na.nbrs.delete(best.kb);
        nb.nbrs.delete(best.ka);
        na.nbrs.add(kp);
        nb.nbrs.add(kp);
        nodes.get(kp).nbrs.add(best.ka);
        nodes.get(kp).nbrs.add(best.kb);
        addSeg(best.ka < kp ? best.ka : kp, best.ka < kp ? kp : best.ka);
        addSeg(best.kb < kp ? best.kb : kp, best.kb < kp ? kp : best.kb);
        splits += 1;
        target = kp;
      }
    }
    if (target === ke || !nodes.has(target)) continue;
    const tNode = nodes.get(target);
    for (const nbrKey of eNode.nbrs) {
      const nbr = nodes.get(nbrKey);
      nbr.nbrs.delete(ke);
      if (nbrKey !== target) {
        nbr.nbrs.add(target);
        tNode.nbrs.add(nbrKey);
        addSeg(nbrKey < target ? nbrKey : target, nbrKey < target ? target : nbrKey);
      }
    }
    nodes.delete(ke);
    joins += 1;
  }
  return { joins, splits };
};

// Remove every chain that ends in the void, iteratively: an edge with a free
// end cannot bound a face. What this deletes is OHM's unfinished work — the
// report carries the count so the gap is a stated fact, not a silent one.
export const pruneDangles = (nodes) => {
  const queue = [...nodes.entries()].filter(([, n]) => n.nbrs.size <= 1).map(([k]) => k);
  let prunedEdges = 0;
  while (queue.length > 0) {
    const key = queue.pop();
    const node = nodes.get(key);
    if (!node || node.nbrs.size > 1) continue;
    for (const nbrKey of node.nbrs) {
      const nbr = nodes.get(nbrKey);
      nbr.nbrs.delete(key);
      prunedEdges += 1;
      if (nbr.nbrs.size <= 1) queue.push(nbrKey);
    }
    nodes.delete(key);
  }
  return { prunedEdges };
};

// ---------------------------------------------------------------------------
// Face tracing (planar subdivision walk)
// ---------------------------------------------------------------------------

export const signedRingArea = (ring) => {
  let area = 0;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i, i += 1) {
    area += ring[j][0] * ring[i][1] - ring[i][0] * ring[j][1];
  }
  return area / 2;
};

// Walk every directed edge once, always taking the next edge CLOCKWISE from
// the reversed incoming direction. That rule keeps the enclosed region on the
// walk's left, so bounded faces come out counter-clockwise (positive area)
// and the unbounded outside comes out negative — the sign IS the classifier.
export const traceFaces = (nodes) => {
  const sorted = new Map(); // key -> [{ key, angle }]
  for (const [key, node] of nodes) {
    const list = [...node.nbrs].map((nbrKey) => {
      const nbr = nodes.get(nbrKey);
      return { key: nbrKey, angle: Math.atan2(nbr.pt[1] - node.pt[1], nbr.pt[0] - node.pt[0]) };
    }).sort((a, b) => a.angle - b.angle || (a.key < b.key ? -1 : 1));
    sorted.set(key, list);
  }
  let directedCount = 0;
  for (const [, node] of nodes) directedCount += node.nbrs.size;

  const visited = new Set();
  const rings = [];
  let anomalies = 0;
  const anomalySamples = [];
  for (const [startU, node] of nodes) {
    for (const startV of node.nbrs) {
      if (visited.has(`${startU}>${startV}`)) continue;
      const ring = [];
      let u = startU;
      let v = startV;
      let steps = 0;
      let ok = true;
      do {
        visited.add(`${u}>${v}`);
        ring.push(nodes.get(u).pt);
        // At v, turn clockwise from the edge back to u.
        const back = Math.atan2(nodes.get(u).pt[1] - nodes.get(v).pt[1], nodes.get(u).pt[0] - nodes.get(v).pt[0]);
        const fan = sorted.get(v);
        if (!fan || fan.length === 0) {
          anomalies += 1;
          ok = false;
          break;
        }
        let next = null;
        for (let i = fan.length - 1; i >= 0; i -= 1) {
          if (fan[i].angle < back || (fan[i].angle === back && fan[i].key !== u)) {
            next = fan[i].key;
            break;
          }
        }
        if (next === null) next = fan[fan.length - 1].key;
        u = v;
        v = next;
        steps += 1;
        if (steps > directedCount + 2) {
          anomalies += 1;
          ok = false;
          break;
        }
      } while (!(u === startU && v === startV));
      if (ok && ring.length >= 3) rings.push(ring);
      else if (!ok && anomalySamples.length < 24) anomalySamples.push(nodes.get(u)?.pt ?? ring[0]);
    }
  }
  return { rings, anomalies, anomalySamples };
};

// ---------------------------------------------------------------------------
// Rings -> faces with holes
// ---------------------------------------------------------------------------

export const pointInRing = ([px, py], ring) => {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i, i += 1) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    if (yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
};

const ringBbox = (ring) => {
  const bbox = [Infinity, Infinity, -Infinity, -Infinity];
  for (const [x, y] of ring) {
    if (x < bbox[0]) bbox[0] = x;
    if (y < bbox[1]) bbox[1] = y;
    if (x > bbox[2]) bbox[2] = x;
    if (y > bbox[3]) bbox[3] = y;
  }
  return bbox;
};

const bboxContains = (outer, inner) =>
  outer[0] <= inner[0] && outer[1] <= inner[1] && outer[2] >= inner[2] && outer[3] >= inner[3];

// Positive rings are faces. A negative ring is either the boundary of the
// unbounded outside (drop) or the rim of a lake/enclave seen from the
// surrounding country — attach it as a hole to the SMALLEST positive face
// that strictly contains it. Faces sharing any vertex with the ring are
// excluded from candidacy: an enclave's own face traces the same coordinates
// as the hole ring, and a country must not swallow itself.
export const attachHoles = (rings) => {
  const faces = [];
  const negatives = [];
  let sliversDropped = 0;
  for (const ring of rings) {
    const area = signedRingArea(ring);
    if (area > 0) {
      if (area < AREA_EPS) {
        sliversDropped += 1;
        continue;
      }
      faces.push({ outer: ring, holes: [], area, bbox: ringBbox(ring), keys: new Set(ring.map(keyOf)) });
    } else if (area < -AREA_EPS) {
      negatives.push({ ring, area, bbox: ringBbox(ring) });
    }
  }
  let holesAttached = 0;
  let outsideRings = 0;
  for (const negative of negatives) {
    let host = null;
    for (const face of faces) {
      if (!bboxContains(face.bbox, negative.bbox)) continue;
      if (negative.ring.some((pt) => face.keys.has(keyOf(pt)))) continue;
      if (!pointInRing(negative.ring[0], face.outer)) continue;
      if (host === null || face.area < host.area) host = face;
    }
    if (host) {
      host.holes.push(negative.ring);
      holesAttached += 1;
    } else {
      outsideRings += 1;
    }
  }
  for (const face of faces) delete face.keys;
  return { faces, stats: { sliversDropped, holesAttached, outsideRings } };
};

export const pointInFace = (pt, face) =>
  pointInRing(pt, face.outer) && !face.holes.some((hole) => pointInRing(pt, hole));

// ---------------------------------------------------------------------------
// Faces -> polities
// ---------------------------------------------------------------------------

// polities: [{ name, center: [lng, lat], start? (decdate, for versions) }].
// One label inside a face names it. Two versions of the SAME name resolve to
// the latest start (the Newfoundland rule — OHM keeps superseded versions
// alive by mistake). Two DIFFERENT names in one face is a real conflict: the
// face stays unassigned and the report says who collided, because guessing a
// border that the data does not draw would be inventing history.
// Shortest distance from a point to a face's edges (outer ring and holes).
// Used to rank which label owns a fused face: deep inside beats clinging to
// the seam. Degrees, not metres — the comparison is within one face, so the
// latitude distortion is common to all candidates and cancels out.
export const distanceToFaceEdge = (pt, face) => {
  let best = Infinity;
  const rings = [face.outer, ...(face.holes ?? [])].filter(Boolean);
  for (const ring of rings) {
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i, i += 1) {
      const [x1, y1] = ring[j];
      const [x2, y2] = ring[i];
      const dx = x2 - x1;
      const dy = y2 - y1;
      const len2 = dx * dx + dy * dy;
      let t = len2 === 0 ? 0 : ((pt[0] - x1) * dx + (pt[1] - y1) * dy) / len2;
      t = Math.max(0, Math.min(1, t));
      const px = x1 + t * dx;
      const py = y1 + t * dy;
      const d = Math.hypot(pt[0] - px, pt[1] - py);
      if (d < best) best = d;
    }
  }
  return best;
};

// How much of a face is LAND, sampled against the mask the coasts came from.
// Deterministic golden-ratio lattice over the face bbox, rejection-sampled by
// pointInFace — no RNG, same answer every run. Only ever called for the
// handful of faces that hold a label, so the cost is invisible.
const PHI2 = { x: 0.7548776662466927, y: 0.5698402909980532 }; // plastic-number lattice
export const faceLandFraction = (face, landTest, wanted = 60) => {
  const ring = face.outer ?? [];
  let minX = Infinity; let minY = Infinity; let maxX = -Infinity; let maxY = -Infinity;
  for (const [x, y] of ring) {
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
  }
  if (!(maxX > minX) || !(maxY > minY)) return 0;
  let inFace = 0;
  let onLand = 0;
  for (let i = 1; i <= 1200 && inFace < wanted; i += 1) {
    const px = minX + ((i * PHI2.x) % 1) * (maxX - minX);
    const py = minY + ((i * PHI2.y) % 1) * (maxY - minY);
    if (!pointInFace([px, py], face)) continue;
    inFace += 1;
    if (landTest([px, py])) onLand += 1;
  }
  return inFace === 0 ? 0 : onLand / inFace;
};

// A face that is mostly water is a coast-continuity defect wearing a label,
// never a country: the only way a center lands in one is that its polity's
// outline failed to close against the sea. Measured 2026-08-12 on the 1836
// ceiling run: the 1,602.9 deg² sea face carried Due Sicilie (depth 0.2268,
// 13× its runner-up) straight past both existing resolve guards — label
// count saw three, margin saw a landslide, and the Mediterranean became
// Naples. Land fraction is the discriminator the other guards cannot see,
// and it is nearly binary in practice: a sealed country face samples ~100%
// land, the sea complex ~5%. The 0.5 line sits in open water between them.
export const LAND_FRACTION_MIN = 0.5;

export const assignFaces = (faces, polities, { resolveConflicts = false, landTest = null } = {}) => {
  const assigned = [];
  const unassigned = [];
  const conflicts = [];
  const resolvedConflicts = [];
  const seaRefusals = [];
  const landed = new Set();
  for (const face of faces) {
    const inside = polities.filter((p) => Array.isArray(p.center) && pointInFace(p.center, face));
    for (const p of inside) landed.add(p);
    const byName = new Map();
    for (const p of inside) {
      const prev = byName.get(p.name);
      if (!prev || (p.start ?? -Infinity) > (prev.start ?? -Infinity)) byName.set(p.name, p);
    }
    // The sea guard applies to every labelled face, not only contested ones:
    // a lone center in the sea complex would otherwise take the whole ocean
    // without even passing through resolve.
    let landFraction = null;
    if (landTest && byName.size > 0) {
      landFraction = faceLandFraction(face, landTest);
      if (landFraction < LAND_FRACTION_MIN) {
        seaRefusals.push({
          names: [...byName.keys()],
          area: +Math.abs(face.area ?? 0).toFixed(2),
          landFraction: +landFraction.toFixed(3),
        });
        conflicts.push({
          face,
          names: [...byName.keys()],
          refusedResolution: "sea",
          landFraction: +landFraction.toFixed(3),
        });
        continue;
      }
    }
    if (byName.size === 1) {
      assigned.push({ face, polity: [...byName.values()][0] });
    } else if (byName.size === 0) {
      unassigned.push(face);
    } else if (!resolveConflicts) {
      conflicts.push({ face, names: [...byName.keys()] });
    } else {
      // Two polities' labels inside ONE face means the border between them did
      // not close and their territories fused. Refusing the face is the honest
      // default — but refusing costs the DOMINANT polity its whole outline
      // (Germany's 1939 face, lost to a gap on the Luxembourg border, is why a
      // grafted 1939 map still drew the Oder-Neisse line in the west).
      //
      // Resolution: the face goes to the label sitting DEEPEST inside it,
      // measured as distance from the label point to the nearest face edge. A
      // fused face is one big country plus its small neighbours clinging to the
      // seam, so the big country's centre is far from every edge while the
      // swallowed ones sit near the seam they leaked through. The swallowed
      // names travel with the face so downstream can refuse its authority over
      // exactly them, and every resolution is reported.
      const scored = [...byName.values()]
        .map((p) => ({ polity: p, depth: distanceToFaceEdge(p.center, face) }))
        .sort((a, b) => b.depth - a.depth);
      // Two guards, both measured against the 1939 Europe run, because the
      // depth rule alone hands the Mediterranean mega-face to SYRIA: eleven
      // labels sat in one 2,004 deg² face of fused coastline and open sea, and
      // the deepest of them was simply the most inland — Syria at 1.00 ahead of
      // Norway at 0.76 and France at 0.56. That face is a coast-continuity
      // DEFECT, not a fused pair, and no label owns it.
      //   * MAX_MERGED_LABELS: past three, a face is not a fusion, it is a
      //     collapse. Germany's had three (0.44 / 0.12 / 0.06), the
      //     Mediterranean eleven.
      //   * MIN_DEPTH_MARGIN: the winner must sit at least twice as deep as the
      //     runner-up. Germany clears it 3.7x; Spanish vs French Morocco comes
      //     in at 1.98x and stays refused, which is right — that pair really is
      //     ambiguous.
      const MAX_MERGED_LABELS = 3;
      const MIN_DEPTH_MARGIN = 2;
      const decisive = scored.length <= MAX_MERGED_LABELS
        && scored[1].depth > 0
        && scored[0].depth / scored[1].depth >= MIN_DEPTH_MARGIN;
      if (!decisive) {
        conflicts.push({
          face,
          names: [...byName.keys()],
          refusedResolution: scored.length > MAX_MERGED_LABELS ? "labels" : "margin",
          depths: scored.map((x) => ({ name: x.polity.name, depth: +x.depth.toFixed(4) })),
        });
        continue;
      }
      const winner = scored[0];
      const swallowed = scored.slice(1);
      assigned.push({
        face,
        polity: winner.polity,
        // Carry the swallowed polities' name TABLE, not just the native
        // string: downstream resolves owners by name:en / name:ko too, and
        // "Lëtzebuerg" alone reaches no owner named Luxembourg.
        merged: swallowed.map((s) => ({ name: s.polity.name, names: s.polity.names ?? {} })),
        depths: scored.map((s) => ({ name: s.polity.name, depth: +s.depth.toFixed(4) })),
      });
      resolvedConflicts.push({
        winner: winner.polity.name,
        swallowed: swallowed.map((s) => s.polity.name),
        depths: scored.map((s) => ({ name: s.polity.name, depth: +s.depth.toFixed(4) })),
        area: +Math.abs(face.area ?? 0).toFixed(2),
      });
    }
  }
  // A label that landed in NO face is a diagnosis, not a silence: either its
  // region's walk failed (Germany, first Europe run) or its center lies
  // outside its own territory (France's bbox center in Algeria).
  const lostLabels = polities.filter((p) => Array.isArray(p.center) && !landed.has(p));
  return { assigned, unassigned, conflicts, resolvedConflicts, lostLabels, seaRefusals };
};

// ---------------------------------------------------------------------------
// The whole pipeline
// ---------------------------------------------------------------------------

export const assembleEraBorders = (features, polities, {
  adminLevel = 2,
  snapTolerance = SNAP_TOLERANCE,
  windowBbox = null,
  coastRings = null,
  coastDecimate = 0.01,
  coastMinRingArea = 3e-4,
  traceNoding = false,
  resolveConflicts = false,
  landTest = null,
} = {}) => {
  // The modern-coast fusion (source ladder, rung 2): OHM lines carry land
  // borders only, so sea-facing countries can only close against a coast we
  // supply. Micro-islands below the area floor are dropped AND counted.
  const coastParts = [];
  let coastRingsDropped = 0;
  if (Array.isArray(coastRings)) {
    for (const ring of coastRings) {
      // The area floor applies to CLOSED rings only (micro-islands). An OPEN
      // chain is a stretch of continuous coastline between junctions — a
      // thin, nearly straight one has ~zero IMPLICIT area, and dropping it
      // punches a hole that unravels the entire mainland loop in the prune
      // (measured: 4,759 coast edges lost to exactly this).
      const closed = ring.length > 1
        && ring[0][0] === ring[ring.length - 1][0]
        && ring[0][1] === ring[ring.length - 1][1];
      if (closed && Math.abs(signedRingArea(ring)) < coastMinRingArea) {
        coastRingsDropped += 1;
        continue;
      }
      coastParts.push(decimateRing(ring, coastDecimate));
    }
  }
  const { segments, stats: segStats } = normalizeSegments(features, {
    adminLevel,
    windowBbox,
    extraParts: coastParts,
  });
  const nodes = buildGraph(segments);
  // Noding to a fixpoint: a split can expose the next shadow in a chain
  // (a degenerate double line has many stations), so repeat until clean.
  let crossingsSplit = 0;
  let collinearPairs = 0;
  // Per-pass record: convergence must be VISIBLE. Before the T-junction fix
  // the loop quietly ran the cap with the same handful re-detected each pass;
  // a report that only sums the passes hides exactly that.
  const nodingPasses = [];
  // traceNoding: record every detection from pass 3 on — by then a healthy run
  // is already clean, so anything still firing IS the non-convergence, named.
  // Capped at 400 events with the overflow counted out loud.
  const nodingTrace = [];
  let nodingTraceDropped = 0;
  for (let pass = 0; pass < 5; pass += 1) {
    const collect = traceNoding && pass >= 2
      ? (evt) => {
        if (nodingTrace.length < 400) nodingTrace.push({ pass: pass + 1, ...evt });
        else nodingTraceDropped += 1;
      }
      : undefined;
    const noded = nodeCrossings(nodes, collect);
    nodingPasses.push({ crossingsSplit: noded.crossingsSplit, collinearPairs: noded.collinearPairs, pairsTested: noded.pairsTested });
    crossingsSplit += noded.crossingsSplit;
    collinearPairs += noded.collinearPairs;
    if (noded.crossingsSplit === 0 && noded.collinearPairs === 0) break;
  }
  const nodingConverged = nodingPasses.length > 0
    && nodingPasses[nodingPasses.length - 1].crossingsSplit === 0
    && nodingPasses[nodingPasses.length - 1].collinearPairs === 0;
  // The value oracle for both snap stages: what survives a preview prune is
  // the skeleton, what dies but touches it is an anchored chain, the rest is
  // scrap. Welds prefer targets that lead somewhere (see previewAnchors).
  const anchors = previewAnchors(nodes);
  const welds = snapDangles(nodes, snapTolerance, anchors);
  const { joins: edgeJoins, splits: edgeSplits } = snapLooseEndsToNetwork(nodes, snapTolerance, anchors);
  const { prunedEdges } = pruneDangles(nodes);
  const { rings, anomalies, anomalySamples } = traceFaces(nodes);
  const { faces, stats: faceStats } = attachHoles(rings);
  const { assigned, unassigned, conflicts, resolvedConflicts, lostLabels, seaRefusals } = assignFaces(faces, polities, { resolveConflicts, landTest });

  // Group assigned faces per polity name -> MultiPolygon coordinates.
  const byPolity = new Map();
  for (const { face, polity, merged } of assigned) {
    if (!byPolity.has(polity.name)) byPolity.set(polity.name, { polity, faces: [], merged: [] });
    byPolity.get(polity.name).faces.push(face);
    // The names this face swallowed travel with it: downstream must be able to
    // refuse the face's authority over exactly the polities it fused with.
    for (const entry of merged ?? []) {
      if (!byPolity.get(polity.name).merged.some((m) => m.name === entry.name)) byPolity.get(polity.name).merged.push(entry);
    }
  }
  const totalArea = faces.reduce((sum, f) => sum + f.area, 0);
  const assignedArea = assigned.reduce((sum, a) => sum + a.face.area, 0);
  return {
    byPolity,
    unassigned,
    conflicts,
    lostLabels,
    report: {
      ...segStats,
      coastRingsUsed: coastParts.length,
      coastRingsDropped,
      crossingsSplit,
      collinearPairs,
      nodingPasses,
      nodingConverged,
      nodingTrace,
      nodingTraceDropped,
      welds: welds.length,
      weldMax: welds.reduce((m, w) => Math.max(m, w.dist), 0),
      edgeJoins,
      edgeSplits,
      prunedEdges,
      rings: rings.length,
      anomalies,
      anomalySamples,
      ...faceStats,
      faces: faces.length,
      assignedFaces: assigned.length,
      unassignedFaces: unassigned.length,
      conflictFaces: conflicts.length,
      resolvedConflictFaces: resolvedConflicts.length,
      resolvedConflicts,
      seaRefusals,
      lostLabelCount: lostLabels.length,
      politiesNamed: byPolity.size,
      totalArea,
      assignedArea,
      assignedShare: totalArea > 0 ? assignedArea / totalArea : 0,
    },
  };
};

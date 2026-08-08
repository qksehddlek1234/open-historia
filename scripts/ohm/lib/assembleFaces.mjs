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
    if (adminLevel !== null && Number(feature?.properties?.admin_level) !== adminLevel) {
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
export const nodeCrossings = (nodes) => {
  const CELL = 0.25;
  const cellKey = (cx, cy) => `${cx}:${cy}`;
  const grid = new Map();
  const segs = [];
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
  const tested = new Set();
  let collinearPairs = 0;
  for (const bucket of grid.values()) {
    for (let i = 0; i < bucket.length; i += 1) {
      for (let j = i + 1; j < bucket.length; j += 1) {
        const si = bucket[i];
        const sj = bucket[j];
        const pairKey = si < sj ? `${si}|${sj}` : `${sj}|${si}`;
        if (tested.has(pairKey)) continue;
        tested.add(pairKey);
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
        const pt = [round5(a[0] + t * r[0]), round5(a[1] + t * r[1])];
        addSplit(si, t, pt);
        addSplit(sj, u, pt);
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
  return { crossingsSplit, collinearPairs };
};

// ---------------------------------------------------------------------------
// Snap, then prune
// ---------------------------------------------------------------------------

// Weld pairs of loose ends that sit within the tolerance: each is greedily
// matched to its nearest unmatched partner. The pair must not already share
// an edge (welding both ends of one stub would fabricate a zero-area loop).
// Welding REWRITES the second node onto the first, so downstream stages see
// one shared vertex — exactly as if the mapper had finished the border.
export const snapDangles = (nodes, tolerance = SNAP_TOLERANCE) => {
  const loose = [...nodes.entries()].filter(([, n]) => n.nbrs.size === 1).map(([k, n]) => ({ key: k, pt: n.pt }));
  const used = new Set();
  const welds = [];
  for (let i = 0; i < loose.length; i += 1) {
    if (used.has(i)) continue;
    let best = -1;
    let bestDist = Infinity;
    for (let j = i + 1; j < loose.length; j += 1) {
      if (used.has(j)) continue;
      const d = Math.hypot(loose[i].pt[0] - loose[j].pt[0], loose[i].pt[1] - loose[j].pt[1]);
      if (d < bestDist) {
        bestDist = d;
        best = j;
      }
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
export const snapLooseEndsToNetwork = (nodes, tolerance = SNAP_TOLERANCE) => {
  if (!tolerance || tolerance <= 0) return { joins: 0, splits: 0 };
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
    let best = null;
    const ecx = Math.floor(ex / cellSize);
    const ecy = Math.floor(ey / cellSize);
    for (let cx = ecx - 1; cx <= ecx + 1; cx += 1) {
      for (let cy = ecy - 1; cy <= ecy + 1; cy += 1) {
        for (const [ka, kb] of grid.get(cellKey(cx, cy)) ?? []) {
          if (ka === ke || kb === ke) continue;
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
          if (d <= tolerance && (!best || d < best.d)) best = { d, t, ka, kb, px, py };
        }
      }
    }
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
export const assignFaces = (faces, polities) => {
  const assigned = [];
  const unassigned = [];
  const conflicts = [];
  const landed = new Set();
  for (const face of faces) {
    const inside = polities.filter((p) => Array.isArray(p.center) && pointInFace(p.center, face));
    for (const p of inside) landed.add(p);
    const byName = new Map();
    for (const p of inside) {
      const prev = byName.get(p.name);
      if (!prev || (p.start ?? -Infinity) > (prev.start ?? -Infinity)) byName.set(p.name, p);
    }
    if (byName.size === 1) {
      assigned.push({ face, polity: [...byName.values()][0] });
    } else if (byName.size === 0) {
      unassigned.push(face);
    } else {
      conflicts.push({ face, names: [...byName.keys()] });
    }
  }
  // A label that landed in NO face is a diagnosis, not a silence: either its
  // region's walk failed (Germany, first Europe run) or its center lies
  // outside its own territory (France's bbox center in Algeria).
  const lostLabels = polities.filter((p) => Array.isArray(p.center) && !landed.has(p));
  return { assigned, unassigned, conflicts, lostLabels };
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
  for (let pass = 0; pass < 5; pass += 1) {
    const noded = nodeCrossings(nodes);
    crossingsSplit += noded.crossingsSplit;
    collinearPairs += noded.collinearPairs;
    if (noded.crossingsSplit === 0 && noded.collinearPairs === 0) break;
  }
  const welds = snapDangles(nodes, snapTolerance);
  const { joins: edgeJoins, splits: edgeSplits } = snapLooseEndsToNetwork(nodes, snapTolerance);
  const { prunedEdges } = pruneDangles(nodes);
  const { rings, anomalies, anomalySamples } = traceFaces(nodes);
  const { faces, stats: faceStats } = attachHoles(rings);
  const { assigned, unassigned, conflicts, lostLabels } = assignFaces(faces, polities);

  // Group assigned faces per polity name -> MultiPolygon coordinates.
  const byPolity = new Map();
  for (const { face, polity } of assigned) {
    if (!byPolity.has(polity.name)) byPolity.set(polity.name, { polity, faces: [] });
    byPolity.get(polity.name).faces.push(face);
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
      lostLabelCount: lostLabels.length,
      politiesNamed: byPolity.size,
      totalArea,
      assignedArea,
      assignedShare: totalArea > 0 ? assignedArea / totalArea : 0,
    },
  };
};

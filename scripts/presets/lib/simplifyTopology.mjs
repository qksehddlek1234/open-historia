/*!
 * Open Historia Map Editor
 * Copyright (c) 2026 Nicholas Krol - MIT License (see src/Editor/LICENSE).
 */

// 흰 쐐기의 근치 — TOPOLOGY-PRESERVING SIMPLIFICATION (2026-08-20).
//
// THE DEFECT. The map showed white triangles inland at z<6.5. Measured first:
// the geometry is innocent — the seed, a grafted board and a modern board have
// BYTE-IDENTICAL coverage masks over 451,800 samples. The gaps are made at draw
// time by `<Source tolerance={0.6}>` in Nations.jsx: MapLibre hands that to
// geojson-vt, which runs Douglas-Peucker on every feature INDEPENDENTLY. Two
// neighbours sharing a border keep different subsets of it, and the sliver
// between the two versions is the triangle. Measured on the 42.0°N line: 23.5%
// of transects gapped in the raw data, 100% after tolerance 0.6.
//
// WHY NOT JUST LOWER THE TOLERANCE. Both alternatives were measured, both fail:
//   0.375  the numbers halve but the triangles stay on screen (Cowork, A/B)
//   0      no triangles, but the cost is real — 2.72M vertices in one z3 view
//          (14x) and heap 1,554MB (2x), which is the 32s load Cowork measured
//
// THE FIX. Simplify ONCE, at build time, per ARC rather than per feature: cut
// each ring where its "is this edge shared" state changes, simplify each arc,
// and hand both neighbours the SAME simplified arc. Then the runtime has
// nothing left to do and can run at tolerance 0 — the only setting that cannot
// re-split a shared border.
//
// MEASURED on victorian-1836 (2026-08-20), z5 Utah/Colorado box, 3.6M samples,
// against raw geometry at tolerance 0 as the reference coverage:
//
//   원본 + tol 0.6        빠진 셀 302  (0.008%)   ← 오늘의 화면
//   아크 eps 0.01 + 0.6   빠진 셀 345  (0.010%)   ← 런타임 DP가 다시 쪼갠다, 소용없음
//   아크 eps 0.01 + 0     빠진 셀   0  (0.000%)   ← 이것이 처방이다
//
// And the cost lands where it had to:
//
//                        인덱싱   heap    유럽z5     세계z3
//   원본 + tol 0.6        864ms   527MB   146,018    192,810
//   아크 eps0.01 + tol 0  511ms   600MB   230,443    991,690
//   (원본 + tol 0        696ms  1,554MB   652,826  2,723,594  ← 그 32초)
//
// Indexing gets FASTER (fewer vertices to walk) and heap lands within 14% of
// today. The one place it is worse is a whole-world z3 view, where a build-time
// epsilon cannot know it is being drawn at 0.088°/px — the honest trade for
// never splitting a border again. If that view ever needs to be cheaper the
// answer is a second, coarser source for the far lane, not a runtime tolerance.
//
// WHAT THIS CANNOT DO, stated so nobody trusts it too far: arcs are found by
// EXACT segment pairing, and 33% of the edges that divide two regions are not
// exactly paired — the two sides were digitised at different vertex densities
// (Utah draws the 37°N line with 6 vertices, Arizona with 8, sharing 2). Those
// are simplified independently. They still do not split at tolerance 0, because
// nothing simplifies them twice — it is the runtime's SECOND pass that was
// splitting them, and that is what this removes.

const ringsOf = (geometry) => {
  if (geometry?.type === "Polygon") return geometry.coordinates ?? [];
  if (geometry?.type === "MultiPolygon") return (geometry.coordinates ?? []).flat();
  return [];
};

const ptKey = (p) => `${p[0]},${p[1]}`;
const edgeKey = (a, b) => {
  const ka = ptKey(a);
  const kb = ptKey(b);
  return ka < kb ? `${ka}|${kb}` : `${kb}|${ka}`;
};

// Iterative Douglas-Peucker — the same shape ownerBorders.mjs uses, iterative
// for the same reason (a long run would flirt with the stack).
const simplifyRun = (points, eps) => {
  if (points.length < 3) return points;
  const keep = new Uint8Array(points.length);
  keep[0] = 1;
  keep[points.length - 1] = 1;
  const stack = [[0, points.length - 1]];
  while (stack.length > 0) {
    const [start, end] = stack.pop();
    let maxDist = 0;
    let maxAt = -1;
    const [x1, y1] = points[start];
    const [x2, y2] = points[end];
    const dx = x2 - x1;
    const dy = y2 - y1;
    const len2 = dx * dx + dy * dy;
    for (let i = start + 1; i < end; i += 1) {
      const [px, py] = points[i];
      let dist;
      if (len2 === 0) dist = Math.hypot(px - x1, py - y1);
      else {
        const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / len2));
        dist = Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
      }
      if (dist > maxDist) { maxDist = dist; maxAt = i; }
    }
    if (maxDist > eps && maxAt > 0) {
      keep[maxAt] = 1;
      stack.push([start, maxAt], [maxAt, end]);
    }
  }
  return points.filter((_, i) => keep[i] === 1);
};

// An arc's identity is its vertex sequence, direction-free: the two regions
// that share it walk it in opposite directions.
const arcKey = (points) => {
  const forward = points.map(ptKey).join(";");
  const reverse = [...points].reverse().map(ptKey).join(";");
  return forward < reverse ? forward : reverse;
};

export const simplifyTopology = (features, { eps = 0.01 } = {}) => {
  const shared = new Map();
  for (const feature of features) {
    if (feature?.properties?.kind === "sea") continue;
    for (const ring of ringsOf(feature.geometry)) {
      if (!ring) continue;
      for (let i = 0; i + 1 < ring.length; i += 1) {
        const key = edgeKey(ring[i], ring[i + 1]);
        shared.set(key, (shared.get(key) ?? 0) + 1);
      }
    }
  }

  const cache = new Map();
  const stats = { arcsShared: 0, arcsLone: 0, cacheHits: 0, pointsIn: 0, pointsOut: 0, ringsFloored: 0 };

  // Cut the ring where "shared" flips: each run of same-state edges is an arc.
  const arcsOf = (ring) => {
    const arcs = [];
    let current = [ring[0]];
    let currentShared = (shared.get(edgeKey(ring[0], ring[1])) ?? 0) >= 2;
    for (let i = 0; i + 1 < ring.length; i += 1) {
      const isShared = (shared.get(edgeKey(ring[i], ring[i + 1])) ?? 0) >= 2;
      if (isShared !== currentShared && current.length > 1) {
        arcs.push({ points: current, shared: currentShared });
        current = [ring[i]];
        currentShared = isShared;
      }
      current.push(ring[i + 1]);
    }
    if (current.length > 1) arcs.push({ points: current, shared: currentShared });
    return arcs;
  };

  const simplifyRing = (ring) => {
    stats.pointsIn += ring.length;
    if (ring.length < 5) { stats.pointsOut += ring.length; return ring; }
    const out = [];
    for (const arc of arcsOf(ring)) {
      let simplified;
      if (arc.shared) {
        stats.arcsShared += 1;
        const key = arcKey(arc.points);
        const hit = cache.get(key);
        if (hit) {
          stats.cacheHits += 1;
          // The neighbour walks this arc the other way round.
          simplified = ptKey(arc.points[0]) === ptKey(hit[0]) ? hit : [...hit].reverse();
        } else {
          simplified = simplifyRun(arc.points, eps);
          cache.set(key, simplified);
        }
      } else {
        stats.arcsLone += 1;
        simplified = simplifyRun(arc.points, eps);
      }
      for (let i = out.length > 0 ? 1 : 0; i < simplified.length; i += 1) out.push(simplified[i]);
    }
    // A ring crushed below a triangle is not a shape any more — keep the
    // original rather than emit something that cannot be filled. Counted.
    if (out.length < 4) { stats.pointsOut += ring.length; stats.ringsFloored += 1; return ring; }
    const first = out[0];
    const last = out[out.length - 1];
    if (first[0] !== last[0] || first[1] !== last[1]) out.push([first[0], first[1]]);
    stats.pointsOut += out.length;
    return out;
  };

  const mapCoords = (coords, depth) => (depth === 1
    ? simplifyRing(coords)
    : coords.map((child) => mapCoords(child, depth - 1)));

  const simplifiedFeatures = features.map((feature) => {
    if (feature?.properties?.kind === "sea") return feature;
    const geometry = feature?.geometry;
    if (geometry?.type === "Polygon") {
      return { ...feature, geometry: { type: "Polygon", coordinates: mapCoords(geometry.coordinates, 2) } };
    }
    if (geometry?.type === "MultiPolygon") {
      return { ...feature, geometry: { type: "MultiPolygon", coordinates: mapCoords(geometry.coordinates, 3) } };
    }
    return feature;
  });

  return { features: simplifiedFeatures, stats: { ...stats, eps } };
};

export default simplifyTopology;

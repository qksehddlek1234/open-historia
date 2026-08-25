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

// ── ㄴ-6 (2026-08-25): VALIDITY REPAIR ───────────────────────────────────────
//
// Arc simplification does not know rings relate: a hole and its shell simplify
// independently, and a hole can end up OUTSIDE its shell. Tessellation then
// paints the shell AND the escaped hole — the dark double-coat patch the player
// saw over 경북 (KOR.9_1: the 대구 enclave hole, pushed onto the coast).
// Measured by Cowork on the 2026-08-24 build: 686/3,447 invalid on the 1836 far
// file, 47 of them double-coat classes (escaped holes + nested shells).
//
// The cure is ARC RESTORATION, never per-feature patching: a failing ring's
// arcs revert to their ORIGINAL vertices in every feature that uses them (the
// 대구 hole IS the enclave's shell — same arc, so both revert together and no
// border splits). Escalation ladder per failure: offending rings → all rings of
// the involved parts → the whole feature; a feature whose ORIGINAL already
// fails the scan is counted `sourceInvalid` and left alone — not our damage.

const orientSign = (ax, ay, bx, by, cx, cy) => Math.sign((bx - ax) * (cy - ay) - (by - ay) * (cx - ax));

// Proper crossing only: segments that merely touch at an endpoint (every arc
// junction, every ring closure) make one orientation 0 and are excluded.
const segsCross = (a, b, c, d) => {
  const o1 = orientSign(a[0], a[1], b[0], b[1], c[0], c[1]);
  const o2 = orientSign(a[0], a[1], b[0], b[1], d[0], d[1]);
  const o3 = orientSign(c[0], c[1], d[0], d[1], a[0], a[1]);
  const o4 = orientSign(c[0], c[1], d[0], d[1], b[0], b[1]);
  return o1 !== 0 && o2 !== 0 && o3 !== 0 && o4 !== 0 && o1 !== o2 && o3 !== o4;
};

const pointInRing = (pt, ring) => {
  const [x, y] = pt;
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i, i += 1) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
};

// A point ON the ring is neither inside nor outside to the ray cast — and the
// seed is full of holes that SHARE vertices with their shell (an enclave
// touching the province boundary). Treating that contact as an escape branded
// 87 valid features "source-invalid" on 1836 and the repair skipped them — the
// 70 shipped crossings of 2026-08-25. Boundary contact is contact, not escape.
const onRingBoundary = (pt, ring, vertexSet) => {
  if (vertexSet.has(ptKey(pt))) return true;
  const [x, y] = pt;
  for (let i = 0; i + 1 < ring.length; i += 1) {
    const [ax, ay] = ring[i];
    const [bx, by] = ring[i + 1];
    if (x < Math.min(ax, bx) - 1e-12 || x > Math.max(ax, bx) + 1e-12) continue;
    if (y < Math.min(ay, by) - 1e-12 || y > Math.max(ay, by) + 1e-12) continue;
    if (Math.abs((bx - ax) * (y - ay) - (by - ay) * (x - ax)) < 1e-12) return true;
  }
  return false;
};

const partsOf = (geometry) => {
  if (geometry?.type === "Polygon") return [geometry.coordinates ?? []];
  if (geometry?.type === "MultiPolygon") return geometry.coordinates ?? [];
  return [];
};

// Scan one feature. Returns [] when valid, else failures naming offending
// rings as { part, ring } indices plus a `why` for the counters.
const scanGeometry = (geometry) => {
  const parts = partsOf(geometry);
  const failures = [];
  // 1. Proper segment crossings, feature-wide (bowties, hole-through-shell,
  //    part-through-part). Grid-indexed by segment bbox so coastlines stay sane.
  const segs = [];
  for (let p = 0; p < parts.length; p += 1) {
    const rings = parts[p];
    for (let r = 0; r < rings.length; r += 1) {
      const ring = rings[r];
      for (let i = 0; i + 1 < ring.length; i += 1) {
        segs.push({ a: ring[i], b: ring[i + 1], part: p, ring: r });
      }
    }
  }
  const CELL = 0.2;
  const grid = new Map();
  const cellsOf = (s) => {
    const x0 = Math.floor(Math.min(s.a[0], s.b[0]) / CELL);
    const x1 = Math.floor(Math.max(s.a[0], s.b[0]) / CELL);
    const y0 = Math.floor(Math.min(s.a[1], s.b[1]) / CELL);
    const y1 = Math.floor(Math.max(s.a[1], s.b[1]) / CELL);
    const cells = [];
    for (let cx = x0; cx <= x1; cx += 1) for (let cy = y0; cy <= y1; cy += 1) cells.push(`${cx},${cy}`);
    return cells;
  };
  const crossed = new Set();
  for (let i = 0; i < segs.length; i += 1) {
    const s = segs[i];
    for (const cell of cellsOf(s)) {
      const bucket = grid.get(cell);
      if (bucket) {
        for (const j of bucket) {
          const t = segs[j];
          if (segsCross(s.a, s.b, t.a, t.b)) {
            crossed.add(`${s.part},${s.ring}`);
            crossed.add(`${t.part},${t.ring}`);
          }
        }
        bucket.push(i);
      } else grid.set(cell, [i]);
    }
  }
  if (crossed.size > 0) {
    failures.push({
      why: "crossing",
      rings: [...crossed].map((k) => { const [p, r] = k.split(",").map(Number); return { part: p, ring: r }; }),
    });
  }
  // 2. Escaped holes: with no crossings a single vertex sample is decisive, but
  //    vertices are cheap — test them all so a straddling hole cannot hide.
  //    Vertices that merely TOUCH the shell (shared vertex, point on edge) are
  //    contact, not escape — see onRingBoundary.
  for (let p = 0; p < parts.length; p += 1) {
    const [shell, ...holes] = parts[p];
    if (!shell) continue;
    let shellVerts = null;
    for (let r = 0; r < holes.length; r += 1) {
      const suspects = holes[r].filter((pt) => !pointInRing(pt, shell));
      if (suspects.length === 0) continue;
      if (!shellVerts) shellVerts = new Set(shell.map(ptKey));
      const escaped = suspects.some((pt) => !onRingBoundary(pt, shell, shellVerts));
      if (escaped) failures.push({ why: "escapedHole", rings: [{ part: p, ring: r + 1 }, { part: p, ring: 0 }] });
    }
  }
  // 3. Nested shells: a shell inside another part's shell must sit in one of
  //    that part's holes (island-in-lake); bare shell-in-shell double-paints.
  //    Bbox prefilter first — an archipelago multipolygon is O(parts²) pairs
  //    and point-in-ring over a mainland shell is not free.
  const shellBox = parts.map((rings) => {
    const shell = rings[0] ?? [];
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const [x, y] of shell) {
      if (x < x0) x0 = x; if (x > x1) x1 = x;
      if (y < y0) y0 = y; if (y > y1) y1 = y;
    }
    return [x0, y0, x1, y1];
  });
  const shellVertsCache = new Map();
  const shellVertsOf = (j) => {
    let v = shellVertsCache.get(j);
    if (!v) { v = new Set((parts[j][0] ?? []).map(ptKey)); shellVertsCache.set(j, v); }
    return v;
  };
  for (let i = 0; i < parts.length; i += 1) {
    const shellI = parts[i][0];
    if (!shellI || shellI.length === 0) continue;
    for (let j = 0; j < parts.length; j += 1) {
      if (i === j) continue;
      const shellJ = parts[j][0];
      if (!shellJ) continue;
      const [bx0, by0, bx1, by1] = shellBox[j];
      // The probe must be a vertex shellJ does not OWN — parts that share
      // border vertices are adjacency, not nesting. (Vertex-set test only: a
      // false nesting merely restores arcs it did not need to, never corrupts.)
      let probe = null;
      let vertsJ = null;
      for (const pt of shellI) {
        if (pt[0] < bx0 || pt[0] > bx1 || pt[1] < by0 || pt[1] > by1) { probe = null; break; }
        if (!vertsJ) vertsJ = shellVertsOf(j);
        if (!vertsJ.has(ptKey(pt))) { probe = pt; break; }
      }
      if (!probe || !pointInRing(probe, shellJ)) continue;
      const inHole = parts[j].slice(1).some((hole) => pointInRing(probe, hole));
      if (!inHole) {
        failures.push({
          why: "nestedShell",
          rings: [{ part: i, ring: 0 }, ...parts[j].map((_, r) => ({ part: j, ring: r }))],
        });
      }
    }
  }
  return failures;
};

// Two independent 32-bit hashes joined — one djb2 alone collided twice on the
// 153,689 arcs of a single board (birthday math predicts ~4), and a collided
// arc reads its partner's refinement level: believed capped, never refined.
const hashStr = (s) => {
  let h1 = 5381;
  let h2 = 0x811c9dc5;
  for (let i = 0; i < s.length; i += 1) {
    const c = s.charCodeAt(i);
    h1 = ((h1 << 5) + h1 + c) | 0;
    h2 = Math.imul(h2 ^ c, 0x01000193);
  }
  return `${h1}:${h2}`;
};

export const simplifyTopology = (features, { eps = 0.01 } = {}) => {
  const startedAt = Date.now();
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
  // arc hash → indices of features whose rings carry that arc (repair fan-out).
  const arcUsers = new Map();
  // arc hash → refinement level. A failing arc is not thrown back to the
  // original wholesale — that cost 57.3% vertex retention against ~40% when
  // measured on 1836 (a bowtie on one coast ring un-simplified the whole
  // coast). Instead each bump re-simplifies at eps/4^level, and only VERBATIM
  // (the top rung) emits the original vertices. Levels are keyed by the arc's
  // ORIGINAL vertices, so every user of the arc refines identically and the
  // shared-border invariant holds at every rung.
  const VERBATIM = 3;
  const refine = new Map();

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

  const simplifyRing = (ring, featureIdx, count) => {
    if (count) stats.pointsIn += ring.length;
    if (ring.length < 5) return ring;
    const out = [];
    for (const arc of arcsOf(ring)) {
      const key = arcKey(arc.points);
      const h = hashStr(key);
      if (count) {
        const users = arcUsers.get(h);
        if (users) { if (users[users.length - 1] !== featureIdx) users.push(featureIdx); }
        else arcUsers.set(h, [featureIdx]);
      }
      let simplified;
      const level = refine.get(h) ?? 0;
      if (level >= VERBATIM) {
        simplified = arc.points;
      } else if (level > 0) {
        // Deterministic per arc: both neighbours compute the identical rung.
        simplified = simplifyRun(arc.points, eps / 4 ** level);
      } else if (arc.shared) {
        if (count) stats.arcsShared += 1;
        const hit = cache.get(key);
        if (hit) {
          if (count) stats.cacheHits += 1;
          // The neighbour walks this arc the other way round.
          simplified = ptKey(arc.points[0]) === ptKey(hit[0]) ? hit : [...hit].reverse();
        } else {
          simplified = simplifyRun(arc.points, eps);
          cache.set(key, simplified);
        }
      } else {
        if (count) stats.arcsLone += 1;
        simplified = simplifyRun(arc.points, eps);
      }
      for (let i = out.length > 0 ? 1 : 0; i < simplified.length; i += 1) out.push(simplified[i]);
    }
    // A ring crushed below a triangle is not a shape any more — keep the
    // original rather than emit something that cannot be filled. Counted.
    if (out.length < 4) { if (count) stats.ringsFloored += 1; return ring; }
    const first = out[0];
    const last = out[out.length - 1];
    if (first[0] !== last[0] || first[1] !== last[1]) out.push([first[0], first[1]]);
    return out;
  };

  const buildFeature = (feature, featureIdx, count) => {
    if (feature?.properties?.kind === "sea") return feature;
    const geometry = feature?.geometry;
    const mapCoords = (coords, depth) => (depth === 1
      ? simplifyRing(coords, featureIdx, count)
      : coords.map((child) => mapCoords(child, depth - 1)));
    if (geometry?.type === "Polygon") {
      return { ...feature, geometry: { type: "Polygon", coordinates: mapCoords(geometry.coordinates, 2) } };
    }
    if (geometry?.type === "MultiPolygon") {
      return { ...feature, geometry: { type: "MultiPolygon", coordinates: mapCoords(geometry.coordinates, 3) } };
    }
    return feature;
  };

  const simplifiedFeatures = features.map((feature, idx) => buildFeature(feature, idx, true));

  // ── repair loop ────────────────────────────────────────────────────────────
  const repair = { crossings: 0, escapedHoles: 0, nestedShells: 0, arcsRestored: 0, arcsVerbatim: 0, featuresRepaired: 0, sourceInvalid: 0, iterations: 0, residualInvalid: 0 };
  const sourceInvalid = new Set();
  // Escalation ladder per feature: 0 = offending rings, 1 = involved parts
  // whole, 2 = every ring of the feature. All-arcs-restored equals the
  // original, and the original passed (or the feature is in sourceInvalid), so
  // the ladder terminates.
  const escalation = new Map();
  const repairedOnce = new Set();
  let queue = simplifiedFeatures.map((_, i) => i);
  const MAX_ROUNDS = 16;
  while (queue.length > 0 && repair.iterations < MAX_ROUNDS) {
    repair.iterations += 1;
    const newlyRestored = [];
    for (const idx of queue) {
      const feature = simplifiedFeatures[idx];
      if (feature?.properties?.kind === "sea" || sourceInvalid.has(idx)) continue;
      const failures = scanGeometry(feature.geometry);
      if (failures.length === 0) continue;
      if (!repairedOnce.has(idx)) {
        // Not our damage? The exact lane draws the original as-is either way.
        if (scanGeometry(features[idx].geometry).length > 0) {
          sourceInvalid.add(idx);
          repair.sourceInvalid += 1;
          continue;
        }
        // Kind counters tally DEFECTS, once per feature — not repair rounds.
        for (const f of failures) repair[f.why === "crossing" ? "crossings" : f.why === "escapedHole" ? "escapedHoles" : "nestedShells"] += 1;
      }
      const level = escalation.get(idx) ?? 0;
      escalation.set(idx, level + 1);
      const parts = partsOf(features[idx].geometry);
      const ringTargets = new Set();
      if (level >= 2) {
        for (let p = 0; p < parts.length; p += 1) for (let r = 0; r < parts[p].length; r += 1) ringTargets.add(`${p},${r}`);
      } else {
        for (const f of failures) {
          for (const { part, ring } of f.rings) {
            if (level >= 1) { for (let r = 0; r < (parts[part]?.length ?? 0); r += 1) ringTargets.add(`${part},${r}`); }
            else ringTargets.add(`${part},${ring}`);
          }
        }
      }
      if (!repairedOnce.has(idx)) { repairedOnce.add(idx); repair.featuresRepaired += 1; }
      for (const key of ringTargets) {
        const [p, r] = key.split(",").map(Number);
        const originalRing = parts[p]?.[r];
        if (!originalRing || originalRing.length < 2) continue;
        for (const arc of arcsOf(originalRing)) {
          const h = hashStr(arcKey(arc.points));
          const cur = refine.get(h) ?? 0;
          if (cur >= VERBATIM) continue;
          if (cur === 0) repair.arcsRestored += 1;
          refine.set(h, cur + 1);
          if (cur + 1 >= VERBATIM) repair.arcsVerbatim += 1;
          newlyRestored.push(h);
        }
      }
    }
    if (newlyRestored.length === 0) break;
    const affected = new Set();
    for (const h of newlyRestored) for (const idx of arcUsers.get(h) ?? []) affected.add(idx);
    for (const idx of affected) simplifiedFeatures[idx] = buildFeature(features[idx], idx, false);
    queue = [...affected];
  }
  // Whatever the exit path, EVERY feature is re-checked and anything still
  // failing is COUNTED — never swallowed (침묵 캡 금지). The last round's
  // queue is not enough: a feature whose arcs were all capped drops out of the
  // cycle while others continue, and a queue-only scan sailed past exactly
  // those (the 70 shipped crossings of 2026-08-25). With a valid original the
  // count is 0: full restoration equals the original by construction.
  for (let idx = 0; idx < simplifiedFeatures.length; idx += 1) {
    const feature = simplifiedFeatures[idx];
    if (feature?.properties?.kind === "sea" || sourceInvalid.has(idx)) continue;
    if (scanGeometry(feature.geometry).length > 0) repair.residualInvalid += 1;
  }

  // Recount output vertices after repair (restored arcs put points back);
  // sea features pass through untouched and stay out of both counters.
  stats.pointsOut = 0;
  for (const feature of simplifiedFeatures) {
    if (feature?.properties?.kind === "sea") continue;
    for (const ring of ringsOf(feature.geometry)) stats.pointsOut += ring.length;
  }

  return { features: simplifiedFeatures, stats: { ...stats, eps, repair: { ...repair, ms: Date.now() - startedAt } } };
};

export default simplifyTopology;

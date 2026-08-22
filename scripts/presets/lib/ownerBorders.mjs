/*! Open Historia — owner-frontier border builder. */

// A NATIONAL BORDER IS THE LINE WHERE OWNERSHIP CHANGES — not the line where
// the modern world changes.
//
// The game drew its national border from GADM level 0 (countries.pmtiles). On
// Modern Day that is exactly right: level 0 IS the dissolve of the level 1
// regions that paint the fills, so the black line lands on every colour change
// for free. On every historical board it is exactly wrong, and visibly so — the
// 1935 board drew the 2026 Germany–Poland line straight through the Reich, and a
// 1200 board drew the whole modern grid over a world that had none of it.
//
// The honest line is the boundary of the owner dissolve. Polygon dissolving
// 3.17M seed vertices is not affordable per turn in a browser, but it does not
// have to be: the border is a SEGMENT problem, not an area problem, and the seed
// makes it a linear one. extract-regions guarantees neighbouring regions share
// bit-identical border vertices, which was measured here rather than trusted —
// over the whole seed, 2,533,136 distinct segments appear exactly once
// (2,003,514, coast and lake shore) or exactly twice (529,622, an internal
// border), and never three times. So:
//
//   appears twice, same owner  → interior of one country   → drop
//   appears twice, differs     → THE NATIONAL BORDER       → keep
//   appears once               → coast                     → drop (see below)
//
// Sizes, measured on medieval-1200: frontier 69,477 segments chaining into 5,458
// parts, 1.43MB as one 5-decimal MultiLineString — 2% of the regions.geojson
// shipped beside it. The coast is 2,005,758 segments and 43.7MB, so it is NOT
// shipped: it stays with countries.pmtiles, which draws it correctly at every
// zoom in every era because coastlines do not move when empires do.
//
// Which is why `intact` exists. A country whose level-0 ring draws no line that
// ownership does not draw is still telling the truth about this board, so it
// keeps drawing from the tiles — coast and all — and every other code stops.
// The board decides, per country, from its own ownership; no threshold, nothing
// to tune. Measured: Modern Day keeps 230 of 230, the realworld board 228, and
// the historical boards keep exactly the countries a player would expect to be
// untouched — 170/230 on wwii-1935, 101/230 on medieval-1200, 95/230 on
// roman-117. Where a code drops, its coastline goes with it; that is the price,
// and it is paid only where the modern outline was drawing a border that this
// board does not have.

// GADM files disputed ground under its own pseudo-codes (Z01…Z09 — Kashmir, Aksai
// Chin and the rest; Nations.jsx keeps the claimant table). They are not
// countries, and level 0 does not draw them as part of the claimant either, so
// they must not decide whether a claimant's outline is intact: on Modern Day,
// counting them split India, China AND Pakistan, which would have taken the
// black line off three of the world's longer coastlines to fix a border in
// Kashmir. The line of control itself is unaffected — those regions still meet
// their neighbours at an ownership change, and the frontier below draws it.
const DISPUTED_CODE = /^Z\d{2}$/;

const ringsOf = (geometry) => {
  if (geometry?.type === "Polygon") return geometry.coordinates ?? [];
  if (geometry?.type === "MultiPolygon") return (geometry.coordinates ?? []).flat();
  return [];
};

const round5 = (value) => Math.round(value * 1e5) / 1e5;

// Chain kept segments into runs so the output is coastline-shaped rather than
// 69k two-point stubs — same walk assemble-era-borders.mjs uses, and the reason
// the file is 1.43MB instead of 7MB. Open ends are walked first so a run that is
// not a closed loop starts at its actual end instead of being cut in the middle.
const chainSegments = (segments) => {
  const pointOf = new Map();
  const adjacent = new Map();
  for (const segment of segments) {
    pointOf.set(segment.ka, segment.a);
    pointOf.set(segment.kb, segment.b);
    if (!adjacent.has(segment.ka)) adjacent.set(segment.ka, new Set());
    if (!adjacent.has(segment.kb)) adjacent.set(segment.kb, new Set());
    adjacent.get(segment.ka).add(segment.kb);
    adjacent.get(segment.kb).add(segment.ka);
  }
  const edgeKey = (x, y) => (x < y ? `${x}|${y}` : `${y}|${x}`);
  const used = new Set();
  const parts = [];
  const walkFrom = (start) => {
    for (const first of adjacent.get(start) ?? []) {
      if (used.has(edgeKey(start, first))) continue;
      used.add(edgeKey(start, first));
      const part = [pointOf.get(start), pointOf.get(first)];
      let cursor = first;
      for (;;) {
        const next = [...(adjacent.get(cursor) ?? [])].find((k) => !used.has(edgeKey(cursor, k)));
        if (!next) break;
        used.add(edgeKey(cursor, next));
        part.push(pointOf.get(next));
        cursor = next;
      }
      parts.push(part);
    }
  };
  for (const key of adjacent.keys()) if ((adjacent.get(key)?.size ?? 0) !== 2) walkFrom(key);
  for (const key of adjacent.keys()) walkFrom(key);
  return parts;
};

// ── B-7 (2026-08-19): THE COAST COMES BACK, FOR THE CODES THAT LOST IT ──────
//
// "Where a code drops, its coastline goes with it; that is the price" — and the
// user saw the price on screen (해안가 국경선 없음). The subset that needs
// shipping is only the NON-intact codes' exterior (intact codes keep drawing
// level-0 tiles, coast included, for free), and raw it is still enormous:
// measured on victorian-1836, 1.06M segments ≈ 19MB against the frontier's
// 1.4MB. Two knobs make it shippable, both measured before this was written:
//
//   simplify eps 0.02°   RDP on the chained runs. 0.01 keeps visibly more
//                        detail at 3.3MB; the user chose 0.02 (1.89MB, "표준").
//   min part diag 0.1°   70,301 chained parts collapse to 7,434 — the rest are
//                        islets and pond shores invisible at the zooms where a
//                        coastline outline reads. DROPPED PARTS ARE COUNTED in
//                        meta.coast (침묵 캡 금지), never silently.
//
// The runtime side is Nations.jsx's owner-coasts layer (kind:"coast" at 0.6×
// national weight, the user's "가늘게") — landed first, drawing nothing until
// this feature exists in the file.
const COAST_SIMPLIFY_EPS = 0.02;
const COAST_MIN_PART_DIAG = 0.1;

// ── 긁힘 2종 (2026-08-19, 같은 날 재개): CLOSED RINGS AROUND NOTHING ─────────
//
// The seed-membership filter killed the clip seams, and the scratches stayed —
// second species. Cowork's pixel forensics on the shipped file: 7,070 of 7,447
// coast parts are CLOSED rings, 6,322 of them under 0.5° across (36% of all
// coast points), 25 inside one Austrian box matching the screen strokes 1:1.
// These are ORIGINAL seed vertices — edges with no neighbouring region — but
// the nothing on the other side is not the sea: it is a LAKE (a polygon's
// interior ring) or a coverage void between regions. RDP then flattens a tiny
// lake ring into three or four corners, which reads as a ㄱ-shaped scratch,
// not as water.
//
// The discriminator is what sits on the ring's OUTSIDE. An island's ring has
// unpainted sea beyond it; a lake or void ring is embedded in painted land
// (the lakes are coverage gaps ringed by several regions, and a neighbour's
// simplified outline may even slop over the water — which is exactly why the
// obvious interior test fails; see the comment at the call site). One sample
// point just above each closed ring's top vertex, point-in-coverage against
// the board's land regions — covered drops (inland scratch), uncovered keeps
// (open water), and every drop is counted in meta.coast.voidRingsDropped.
// Open chains are untouched: a mainland coast broken by an intact neighbour's
// excluded segments is open, and openness already means it wraps nothing.
//
// Even-odd ray cast over every ring of a feature — a point in a polygon's lake
// hole crosses outer+hole an even number of times, so holes come out excluded
// with no orientation bookkeeping.
const insideRings = (rings, px, py) => {
  let inside = false;
  for (const ring of rings) {
    for (let i = 0; i + 1 < ring.length; i += 1) {
      const [x1, y1] = ring[i];
      const [x2, y2] = ring[i + 1];
      if ((y1 <= py) === (y2 <= py)) continue;
      if (px < x1 + ((py - y1) / (y2 - y1)) * (x2 - x1)) inside = !inside;
    }
  }
  return inside;
};

const buildLandCoverage = (features, land) => {
  const entries = [];
  for (let index = 0; index < features.length; index += 1) {
    if (!land[index]) continue;
    const rings = ringsOf(features[index]?.geometry);
    if (rings.length === 0) continue;
    let minX = Infinity; let minY = Infinity; let maxX = -Infinity; let maxY = -Infinity;
    for (const ring of rings) {
      for (const [x, y] of ring) {
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      }
    }
    entries.push({ rings, minX, minY, maxX, maxY });
  }
  return {
    // Any land region covers the point (bbox-prefiltered).
    anywhere: (px, py) => {
      for (const entry of entries) {
        if (px < entry.minX || px > entry.maxX || py < entry.minY || py > entry.maxY) continue;
        if (insideRings(entry.rings, px, py)) return true;
      }
      return false;
    },
  };
};

// Iterative Douglas-Peucker — the chained coast runs reach tens of thousands of
// points and a recursive version would be flirting with the stack.
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

// ── 긁힘 3종 (2026-08-19, 셋째 재개): A COAST MUST BE NEAR WATER ─────────────
//
// Species 1 (clip seams) and 2 (lake/void rings) died and the file still
// carried waterless "coastlines": Utah's state-border rectangle in the middle
// of 1836 Mexico, Nepal's whole outline, the dead DE/AT frontier inside a
// single-owner Reich. The mechanism is that "no neighbouring region" never
// meant "sea" — era clipping rewrites ONE side of a border and leaves the
// other side's original seed segments unpaired, and the seed itself carries
// unpaired edges (disputed-area double polygons in Kashmir, Lesotho's
// mismatched enclave rings, plain junction slop). Cowork measured 654 such
// parts on 1836 with Natural Earth as ground truth, all inland.
//
// So the filter finally asks the definitional question: is there REAL WATER
// near this part? options.coastReference is a snapped vertex cloud of the
// Natural Earth 10m land boundary plus large lakes (public domain — see
// build-coastline-reference.mjs); a part survives if any of its vertices sits
// within WATER_NEAR_DEG of a reference point, and a part that does not is
// dropped and counted. This subsumes species 1 and 2 conceptually, but those
// filters stay: they are cheaper, exact where they apply, and redundancy here
// is harmless (중복 안전).
const WATER_NEAR_DEG = 0.25;

// ── 긁힘 4종 (2026-08-20): A COAST HAS NO NEIGHBOUR ON THE OTHER SIDE ────────
//
// Utah's 37N line survived every filter above and kept drawing a modern state
// border across 1836 Mexico. It is not a seam (the seed drew those vertices),
// not a void ring (it is an open run), and not waterless (Lake Powell sits on
// it). What it is, is a border whose two sides were digitised at DIFFERENT
// VERTEX DENSITIES: measured on the seed, Utah draws that line with 6 vertices
// and Arizona with 8, sharing only two of them. So the exact-key pairing above
// never matched them, both sides came out unpaired, and each was called coast.
//
// The pairing has to tolerate that, and the codebase already knows how — the
// `intact` test below was corrected the same way in 2026-08-16 ("NEIGHBOURS
// ARE FOUND ON A GRID, NOT BY SHARED SEGMENTS"). Here the grid holds SEGMENTS,
// not vertices: every land edge is rasterised into ~1.1km cells, and a coast
// candidate whose midpoint cell also carries another region's edge is not a
// coast — it is a border, and the frontier lane above already draws it when
// the owners differ (when they match, it is interior and belongs to nobody).
//
// Measured on victorian-1836, midpoint test at 0.01°:
//
//   Utah 37N   12/12 dropped     Nepal 95%   Kashmir 94%   Lesotho 95%   DE/AT 91%
//   Crete 0%   England 2%        Norway 3%   Corfu 4%    ← real coast barely touched
//
// The residue on a real shore is where a province boundary meets the sea: one
// ~1km cell, invisible under the 0.02° simplification the file already ships.
// Testing all three points instead of the midpoint was measured too and is
// worse on both counts (DE/AT 91→72%, Sicily 15→14%).
const NEIGHBOUR_GRID_DEG = 0.01;

// Rasterise every land edge into grid cells: cell → the single region index
// that stamped it, or -1 once two regions have. Sampling at 0.7 cells keeps a
// long straight edge (Utah's line is 1.5°) from stepping over cells.
const buildNeighbourGrid = (segments) => {
  const cellRegion = new Map();
  const stamp = (x, y, index) => {
    const key = Math.round(x / NEIGHBOUR_GRID_DEG) * 4194304 + Math.round(y / NEIGHBOUR_GRID_DEG);
    const seen = cellRegion.get(key);
    if (seen === undefined) cellRegion.set(key, index);
    else if (seen !== index && seen !== -1) cellRegion.set(key, -1);
  };
  const rasterise = (a, b, index) => {
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const steps = Math.max(1, Math.ceil(Math.hypot(dx, dy) / (NEIGHBOUR_GRID_DEG * 0.7)));
    for (let t = 0; t <= steps; t += 1) stamp(a[0] + (dx * t) / steps, a[1] + (dy * t) / steps, index);
  };
  for (const segment of segments) {
    rasterise(segment.a, segment.b, segment.i);
    if (segment.j !== -1) rasterise(segment.a, segment.b, segment.j);
  }
  return (x, y, index) => {
    const seen = cellRegion.get(Math.round(x / NEIGHBOUR_GRID_DEG) * 4194304 + Math.round(y / NEIGHBOUR_GRID_DEG));
    return seen === -1 || (seen !== undefined && seen !== index);
  };
};

const buildWaterQuery = (reference) => {
  const grid = Number(reference?.grid);
  const points = reference?.points;
  if (!Number.isFinite(grid) || grid <= 0 || !Array.isArray(points) || points.length === 0) return null;
  const cells = new Set();
  for (const [cx, cy] of points) cells.add(cx * 200000 + cy);
  const reach = Math.ceil(WATER_NEAR_DEG / grid);
  // Chebyshev scan over the neighbourhood, tightened to (near-)Euclidean by an
  // explicit distance check against the cell centre — the corner of the scan
  // box is 0.35° out, which would quietly loosen the threshold by 40%.
  const slack = WATER_NEAR_DEG + grid;
  return (px, py) => {
    const ci = Math.round(px / grid);
    const cj = Math.round(py / grid);
    for (let dx = -reach; dx <= reach; dx += 1) {
      for (let dy = -reach; dy <= reach; dy += 1) {
        if (!cells.has((ci + dx) * 200000 + (cj + dy))) continue;
        if (Math.hypot((ci + dx) * grid - px, (cj + dy) * grid - py) <= slack) return true;
      }
    }
    return false;
  };
};

// features: the board's final region features (properties.owner / gid0 / kind).
// options.seedCoastKeys / options.seedSharedKeys — the seed's own segments
// ("x,y|x,y", smaller key first), split by how often the seed drew them: once
// means nothing was on the other side (coast), twice means two regions shared
// it (an internal border). Era clipping preserves original vertices
// bit-identically, so a board coast candidate lands in one of three classes:
//
//   in seedCoastKeys   real shoreline — keep
//   in seedSharedKeys  the seed had a NEIGHBOUR here and era clipping rewrote
//                      it, leaving this side unpaired — Utah's 37N line, the
//                      dead DE/AT frontier (650 segments on 1836). Never coast.
//   in neither         a clip seam of new vertices (2,631) — the scratches
//                      through Austria and Podolia (2026-08-19).
//
// Absent (the synthetic tests, callers without a seed), every candidate keeps.
// options.coastReference — the water vertex cloud above; absent, the water
// filter is off (synthetic tests, callers without the data file).
// Returns { collection, stats } — collection is ready to write as borders.geojson.
export const buildOwnerBorders = (features, options = {}) => {
  const seedCoastKeys = options.seedCoastKeys ?? null;
  const seedSharedKeys = options.seedSharedKeys ?? null;
  const nearWater = buildWaterQuery(options.coastReference);
  const owners = [];
  const codes = [];
  const land = [];
  for (const feature of features) {
    owners.push(String(feature?.properties?.owner ?? ""));
    codes.push(String(feature?.properties?.gid0 ?? ""));
    // Sea regions are an overlay on whatever map they were merged into, not
    // national land: a sea/land edge is a coastline, not a border.
    land.push(feature?.properties?.kind !== "sea");
  }

  const segments = new Map();
  let overCounted = 0;
  for (let index = 0; index < features.length; index += 1) {
    if (!land[index]) continue;
    for (const ring of ringsOf(features[index]?.geometry)) {
      if (!ring) continue;
      for (let i = 0; i + 1 < ring.length; i += 1) {
        const a = ring[i];
        const b = ring[i + 1];
        const ka = `${a[0]},${a[1]}`;
        const kb = `${b[0]},${b[1]}`;
        if (ka === kb) continue;
        const key = ka < kb ? `${ka}|${kb}` : `${kb}|${ka}`;
        const seen = segments.get(key);
        if (!seen) segments.set(key, { a, b, ka, kb, i: index, j: -1 });
        else if (seen.j === -1) seen.j = index;
        else overCounted += 1;
      }
    }
  }

  const frontier = [];
  const exteriorSegments = [];
  let interior = 0;
  for (const [key, segment] of segments.entries()) {
    if (segment.j === -1) { exteriorSegments.push({ key, segment }); continue; }
    if (owners[segment.i] === owners[segment.j]) { interior += 1; continue; }
    frontier.push(segment);
  }
  const exterior = exteriorSegments.length;

  // WHICH COUNTRIES MAY KEEP DRAWING FROM THE TILES.
  //
  // The test is not "does this country still exist" but the narrower thing the
  // map actually needs: DOES LEVEL 0 DRAW A LINE THAT OWNERSHIP DOES NOT? A
  // country's level-0 ring is its land borders plus its coast, and a coast is
  // true in every era. So a code is safe exactly when every land border on that
  // ring is also an ownership change — and then it keeps drawing, coastline and
  // all, costing this file nothing.
  //
  // The first version of this asked instead whether one polity held the whole
  // country and nothing else. That is a stricter question and it took the wrong
  // answer: on the realworld board the United Kingdom holds Bermuda and the
  // Caymans, so GBR failed — yet the UK's only level-0 land border is with
  // Ireland, which IS an ownership change. Britain would have lost its coastline
  // to fix nothing. Same for France, the United States, Russia, Denmark, Norway,
  // the Netherlands and New Zealand, all on a board whose borders are modern.
  const present = new Set();
  const drawsFalseLine = new Set();
  for (let index = 0; index < features.length; index += 1) {
    if (land[index] && codes[index] && !DISPUTED_CODE.test(codes[index])) present.add(codes[index]);
  }
  // NEIGHBOURS ARE FOUND ON A GRID, NOT BY SHARED SEGMENTS — corrected 2026-08-16.
  //
  // This test used to walk `segments` and read the pairs that share one. That is
  // how the frontier is built and it is right there; it is wrong here, because
  // GADM does not share vertices between countries consistently. Measured on the
  // untouched seed: 266 country pairs share at least one segment — ARG|CHL 2,480,
  // NOR|SWE 2,237, ESP|FRA 570 — and these share NOTHING AT ALL:
  //
  //   CHN|MNG 0 · FIN|RUS 0 · DEU|POL 0 · CHE|FRA 0
  //
  // Where nothing is shared the pair was invisible, so a code whose only false
  // line ran along such a border passed as intact. Both reported symptoms are
  // exactly that: Qing China kept its modern MONGOLIAN border and the Russian
  // Empire its FINNISH one, each drawn by a level-0 outline this rule cleared.
  //
  // What was measured when this was written was segment PARITY — every segment
  // appears once or twice, never three times. That proves the dissolve does not
  // double-count. It says nothing about whether every neighbour is visible to
  // this test, and the invisible ones are precisely the pairs digitised apart.
  //
  // The grid is the codebase's own answer to the same problem: buildRegionAdjacency
  // hashes every vertex to 1e-4° (~11m) because "the seed simplifies each region
  // on its own, so mid-border vertices don't always match between neighbours".
  // Same constant, same reason. It finds CHN|MNG (107 vertex hits) and FIN|RUS
  // (190) where exact matching found none.
  //
  // AND LOOSER HERE THAN THERE, deliberately. buildRegionAdjacency runs at 11m
  // because it is deciding which regions form one contiguous territory, where a
  // false join merges two labels. This test only ever asks "do these two touch",
  // and loosening it is MONOTONE SAFE: a pair the grid joins whose owners differ
  // hits the `owners[i] !== owners[j]` line and changes nothing, so a coarser
  // grid can only find false lines, never invent them. 11m missed DEU|POL
  // entirely (0 hits) — on this board Prussia holds both sides, so the German
  // outline was still drawing a border through its own territory. At 111m the
  // pair appears and Germany drops out of `intact` with the rest.
  //
  // 111m is nowhere near a strait: the Bosphorus is ~700m at its narrowest and
  // the Øresund four kilometres, so no water crossing is joined by this.
  const GRID = 1e3;
  const firstAt = new Map();
  const touching = new Set();
  for (let index = 0; index < features.length; index += 1) {
    if (!land[index]) continue;
    for (const ring of ringsOf(features[index]?.geometry)) {
      if (!ring) continue;
      for (const point of ring) {
        const key = Math.round((point[0] + 180) * GRID) * 4194304 + Math.round((point[1] + 90) * GRID);
        const seen = firstAt.get(key);
        if (seen === undefined) firstAt.set(key, index);
        else if (seen !== index) touching.add(seen < index ? `${seen},${index}` : `${index},${seen}`);
      }
    }
  }
  const neighbourCodes = new Set();
  for (const pair of touching) {
    const cut = pair.indexOf(",");
    const i = Number(pair.slice(0, cut));
    const j = Number(pair.slice(cut + 1));
    const [ci, cj] = [codes[i], codes[j]];
    if (!ci || !cj || ci === cj) continue;                            // level 0 draws nothing here
    neighbourCodes.add(ci < cj ? `${ci}|${cj}` : `${cj}|${ci}`);
    if (DISPUTED_CODE.test(ci) || DISPUTED_CODE.test(cj)) continue;   // see DISPUTED_CODE
    if (owners[i] !== owners[j]) continue;                            // a real border, drawn by both
    drawsFalseLine.add(ci);
    drawsFalseLine.add(cj);
  }
  const intact = [...present].filter((code) => !drawsFalseLine.has(code)).sort();

  // The coast subset: exterior segments of regions whose code no longer draws
  // its level-0 outline. An empty code (drawn/era-only geometry that never had
  // a GADM parent) has no tile outline either, so it is included too. The seam
  // filter (see options above) then keeps only edges the seed drew — a dropped
  // seam is COUNTED, never silent.
  const intactSet = new Set(intact);
  let coastSeamDropped = 0;
  let coastSeedInterior = 0;
  let coastNeighbourDropped = 0;
  let coastWaterless = 0;
  const coastSegments = [];
  const hasNeighbourEdge = buildNeighbourGrid(segments.values());
  for (const { key, segment } of exteriorSegments) {
    if (intactSet.has(codes[segment.i])) continue;
    if (seedCoastKeys && !seedCoastKeys.has(key)) {
      // Which wrong class, so the two species stay countable apart.
      if (seedSharedKeys?.has(key)) coastSeedInterior += 1;
      else coastSeamDropped += 1;
      continue;
    }
    // THE WATER TEST IS PER SEGMENT, AND IT RUNS BEFORE CHAINING. It used to
    // run per finished part ("does any vertex sit near water"), and any-vertex
    // leaked two ways, both measured by Cowork on the shipped file:
    //
    //   (a) one wet touch vouched for a whole dry chain — the 171+115-point
    //       Bavaria-Bohemia line rode in on Bodensee, Kashmir's 248 points on
    //       Pangong Tso, Utah's NV/UT edge on Lake Mead.
    //   (b) chaining fused a real coast to an inland run through one shared
    //       vertex — a 292-point part spanning [-124.7,32 → -94.4,49] was the
    //       Pacific shore welded to the 42N/41N state lines, and its sea
    //       distance read 0.00 because of the wet half.
    //
    // Judging the SEGMENT kills both: a dry edge never enters the graph, so a
    // chain can only grow through water, and the weld in (b) cannot form
    // because the dry side is already gone.
    const [ax, ay] = segment.a;
    const [bx, by] = segment.b;
    const midX = (ax + bx) / 2;
    const midY = (ay + by) / 2;
    // Species 4 first: it is a hash lookup, and it is exact about what a coast
    // is not (see NEIGHBOUR_GRID_DEG above).
    if (hasNeighbourEdge(midX, midY, segment.i)) { coastNeighbourDropped += 1; continue; }
    if (nearWater && !nearWater(midX, midY)) { coastWaterless += 1; continue; }
    coastSegments.push(segment);
  }
  let coastDroppedParts = 0;
  let coastVoidRings = 0;
  let coastPoints = 0;
  const coastParts = [];
  const coveredByLand = buildLandCoverage(features, land);
  for (const run of chainSegments(coastSegments)) {
    let minX = Infinity; let minY = Infinity; let maxX = -Infinity; let maxY = -Infinity;
    for (const [x, y] of run) {
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
    }
    if (Math.hypot(maxX - minX, maxY - minY) < COAST_MIN_PART_DIAG) { coastDroppedParts += 1; continue; }
    // A closed ring is a coast only if the SEA is on its outside — tested on
    // the RAW run, before RDP crushes a small ring into the ㄱ-stroke the user
    // saw on screen.
    //
    // Two interior tests died before this one line was found. "Does any region
    // cover the interior" kept 16 Austrian lakes — the lakes are coverage GAPS
    // ringed by several regions' outer edges, and a neighbour's seed-simplified
    // ring (Salzburg, at the Attersee) slops over the gap and answers
    // "covered". Testing the single contributing region instead fails the same
    // way, because these rings have several contributors. But islands and
    // scratches differ on the OTHER side of the line: an island's ring has
    // unpainted sea beyond it, a lake/void ring is embedded in painted land.
    // So: sample just above the ring's topmost vertex — covered means inland
    // scratch, uncovered means open water. The known cost is an islet whose
    // northern strait is narrower than the probe offset (~1km); at 0.6× weight
    // and these zooms that loss is invisible, and it is counted, not silent.
    // …except a BIG water body. The Caspian, Ladoga, Balaton are coverage gaps
    // embedded in land exactly like the scratches, and their shorelines are
    // real cartography this file exists to ship. The two populations do not
    // overlap in size: every measured scratch ring sits at or under ~0.5°
    // across (quartiles 0.084/0.123/0.165/0.267 on shipped 1836) while the
    // smallest shore worth drawing is Balaton at ~0.9°. The floor is 0.6°,
    // measured, not felt (절대원칙 6).
    const LAKE_KEEP_DIAG = 0.6;
    const closed = run.length > 3
      && run[0][0] === run[run.length - 1][0] && run[0][1] === run[run.length - 1][1];
    if (closed && Math.hypot(maxX - minX, maxY - minY) < LAKE_KEEP_DIAG) {
      let topX = run[0][0]; let topY = run[0][1];
      for (const [x, y] of run) { if (y > topY) { topY = y; topX = x; } }
      if (coveredByLand.anywhere(topX, topY + 0.01)) { coastVoidRings += 1; continue; }
    }
    const simplified = simplifyRun(run, COAST_SIMPLIFY_EPS).map(([x, y]) => [round5(x), round5(y)]);
    coastPoints += simplified.length;
    coastParts.push(simplified);
  }

  const parts = chainSegments(frontier).map((part) => part.map(([x, y]) => [round5(x), round5(y)]));
  const collection = {
    type: "FeatureCollection",
    meta: {
      // Codes whose GADM level-0 outline is still true on this board. The game
      // filters countries-outline to exactly these; everywhere else the line
      // below is the border.
      intact,
      intactOf: present.size,
      // How many country pairs the grid could see at all. Printed by the build
      // so a board that loses a border to an unseen pair has a number to point
      // at rather than a screenshot — the rule is better than it was and is
      // still not complete (DEU|POL needs ~111m; this grid is 11m).
      neighbourPairs: neighbourCodes.size,
      segments: { frontier: frontier.length, interior, exterior, overCounted },
      parts: parts.length,
      // The shipped coastline for non-intact codes (B-7). droppedSmallParts is
      // the min-diag filter's count — a bounded coverage cut, so it is printed,
      // never silent.
      coast: {
        segments: coastSegments.length,
        parts: coastParts.length,
        points: coastPoints,
        droppedSmallParts: coastDroppedParts,
        // Clip-seam edges the seed never drew (scratch species 1) — new
        // vertices, in neither seed set.
        seamDropped: coastSeamDropped,
        // Edges the seed drew as an INTERNAL border whose neighbour era
        // clipping rewrote. The water filter cannot catch these: they run
        // past real lakes.
        seedInteriorDropped: coastSeedInterior,
        // Edges with another region's edge in the same ~1.1km cell (scratch
        // species 4 — borders digitised at mismatched vertex densities, Utah's
        // 37N line). A border is the frontier lane's job, not the coast's.
        neighbourDropped: coastNeighbourDropped,
        // Closed rings around ground the board does not cover — lakes and void
        // pockets (scratch species 2), cut by the interior-point coverage test.
        voidRingsDropped: coastVoidRings,
        // SEGMENTS whose midpoint sits nowhere near real water (scratch
        // species 3 — state borders, seed defects), cut against the Natural
        // Earth reference before chaining. Counted in segments, not parts:
        // the unit moved on 2026-08-20 and the number moved with it.
        waterlessDropped: coastWaterless,
        eps: COAST_SIMPLIFY_EPS,
        minPartDiag: COAST_MIN_PART_DIAG,
      },
    },
    features: [
      ...(parts.length
        ? [{
          type: "Feature",
          properties: { kind: "frontier" },
          geometry: { type: "MultiLineString", coordinates: parts },
        }]
        : []),
      ...(coastParts.length
        ? [{
          type: "Feature",
          properties: { kind: "coast" },
          geometry: { type: "MultiLineString", coordinates: coastParts },
        }]
        : []),
    ],
  };
  return { collection, stats: collection.meta };
};

export default buildOwnerBorders;

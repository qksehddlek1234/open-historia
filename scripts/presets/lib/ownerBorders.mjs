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

// features: the board's final region features (properties.owner / gid0 / kind).
// Returns { collection, stats } — collection is ready to write as borders.geojson.
export const buildOwnerBorders = (features) => {
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
  let exterior = 0;
  let interior = 0;
  for (const segment of segments.values()) {
    if (segment.j === -1) { exterior += 1; continue; }
    if (owners[segment.i] === owners[segment.j]) { interior += 1; continue; }
    frontier.push(segment);
  }

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
  for (const segment of segments.values()) {
    if (segment.j === -1) continue;                                   // coast: never a lie
    const [ci, cj] = [codes[segment.i], codes[segment.j]];
    if (ci === cj) continue;                                          // level 0 draws nothing here
    if (DISPUTED_CODE.test(ci) || DISPUTED_CODE.test(cj)) continue;   // see DISPUTED_CODE
    if (owners[segment.i] !== owners[segment.j]) continue;            // a real border, drawn by both
    drawsFalseLine.add(ci);
    drawsFalseLine.add(cj);
  }
  const intact = [...present].filter((code) => !drawsFalseLine.has(code)).sort();

  const parts = chainSegments(frontier).map((part) => part.map(([x, y]) => [round5(x), round5(y)]));
  const collection = {
    type: "FeatureCollection",
    meta: {
      // Codes whose GADM level-0 outline is still true on this board. The game
      // filters countries-outline to exactly these; everywhere else the line
      // below is the border.
      intact,
      intactOf: present.size,
      segments: { frontier: frontier.length, interior, exterior, overCounted },
      parts: parts.length,
    },
    features: parts.length
      ? [{
        type: "Feature",
        properties: { kind: "frontier" },
        geometry: { type: "MultiLineString", coordinates: parts },
      }]
      : [],
  };
  return { collection, stats: collection.meta };
};

export default buildOwnerBorders;

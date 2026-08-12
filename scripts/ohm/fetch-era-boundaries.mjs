#!/usr/bin/env node
/*! Open Historia — era borders over Overpass, the transport the tiler never saw © 2026 Nicholas Krol, MIT (see src/Editor/LICENSE). */
// STAGE F-1, SECOND TRANSPORT. Same CC0 data, same output format, different road.
//
//   node scripts/ohm/fetch-era-boundaries.mjs 1836-01-01 --bbox -15,30,50,72
//   … --zoom 4 --max-admin-level 3 --out scripts/ohm/out-overpass --refresh
//
// WHY THIS EXISTS, in one measurement. The 1836 build fused seven north German
// states into one face and six more into another, and raising the tile
// extractor's admin ceiling to 3 — 1,153 extra lines — separated exactly none
// of them. So the missing borders are not being filtered out on our side.
//
// The suspect is the transport. extract-era-borders.mjs reads VECTOR TILES, and
// a tile is a rendering: the tiler decides what survives at zoom 4. The sibling
// file fetch-era-polities.mjs already documents that decision biting us once —
// "the tiler only emits a label point for relations whose geometry closes into
// a valid polygon, which excludes interwar Germany, Poland, France, Japan…".
// If the tiler drops 1939 FRANCE, 1836's Reuß-Greiz is not a surprise.
//
// Overpass decides nothing. It returns the relations that exist and the ways
// they are built from. If OHM holds a border between Braunschweig and Bremen,
// this finds it; if this finds nothing either, then OHM does not have that
// border and the honest answer for that board is rung 2 — modern provinces.
// EITHER RESULT SETTLES THE QUESTION, which is why it is worth one query.
//
// WHAT IT EMITS: exactly what the tile extractor emits — eraCollection over
// eraFeature, same properties, same rounding, clipped to the same tile-aligned
// rectangle. assemble-era-borders.mjs takes either without knowing which.
//
//   node scripts/ohm/assemble-era-borders.mjs <lines> --polities <polities>
//
// The `zoom` in the meta of an Overpass dump is NOT a resolution — nothing here
// is rasterised. It is WHICH RECTANGLE WE CLIPPED TO, kept because the assembler
// rebuilds its frame from bbox+zoom and the two transports have to agree on the
// frame or their outputs are not comparable.
//
// DEFAULT OUTPUT OVERWRITES THE TILE DUMP for that date and zoom, which is what
// you want once you trust it. For the first run, when the tile result is the
// baseline you are testing against, send it somewhere else:
//   --out scripts/ohm/out-overpass
//
// POLITENESS. OHM is a volunteer project. One query per (bbox, admin level) —
// the query carries NO DATE, for the reason fetch-era-polities gives (Overpass
// compares dates as strings and misreads year-only end dates), so every date in
// the same window reuses one response and the raw body is cached beside the
// output. --refresh re-fetches. Raising --max-admin-level costs real bytes:
// level 4 in Europe is every Kreis and département, so move it one step at a
// time and look at what arrives.
//
// RUNS ON THE PLAYER'S PC ONLY — the cloud session may not fetch OHM.
import fs from "node:fs";
import path from "node:path";
import url from "node:url";
import crypto from "node:crypto";
import {
  isoToDecdate,
  featureFilter,
  eraFeature,
  eraCollection,
  clipPartToBbox,
  bboxToTileRange,
  tileToBbox,
} from "./lib/eraBorders.mjs";

const ROOT = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), "..", "..");
const DEFAULT_ENDPOINT = "https://overpass-api.openhistoricalmap.org/api/interpreter";
const USER_AGENT = "open-historia-era-extractor/0.1 (personal project; Plan F)";

const usage = (message) => {
  if (message) console.error(`[ohm] ${message}\n`);
  console.error(
    "사용법: node scripts/ohm/fetch-era-boundaries.mjs <YYYY-MM-DD> --bbox lonW,latS,lonE,latN"
    + " [--zoom 4] [--max-admin-level 2] [--include-maritime] [--endpoint URL] [--out DIR] [--refresh]",
  );
  process.exit(1);
};

const parseArgs = (argv) => {
  const options = {
    date: null, bbox: null, zoom: 4, maxAdminLevel: 2, includeMaritime: false,
    endpoint: DEFAULT_ENDPOINT, out: path.join("scripts", "ohm", "out"), refresh: false,
  };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--bbox") options.bbox = String(argv[(i += 1)] ?? "").split(",").map(Number);
    else if (arg === "--zoom") options.zoom = Number(argv[(i += 1)]);
    else if (arg === "--max-admin-level") options.maxAdminLevel = Number(argv[(i += 1)]);
    else if (arg === "--include-maritime") options.includeMaritime = true;
    else if (arg === "--endpoint") options.endpoint = String(argv[(i += 1)] ?? "");
    else if (arg === "--out") options.out = String(argv[(i += 1)] ?? "");
    else if (arg === "--refresh") options.refresh = true;
    else if (!arg.startsWith("--") && options.date === null) options.date = arg;
    else usage(`알 수 없는 인자: ${arg}`);
  }
  if (!options.date) usage("날짜가 없다");
  if (!options.bbox || options.bbox.length !== 4 || options.bbox.some((v) => !Number.isFinite(v))) {
    usage("--bbox lonW,latS,lonE,latN 네 숫자가 필요하다");
  }
  if (!Number.isInteger(options.zoom)) usage("--zoom은 정수");
  if (!Number.isInteger(options.maxAdminLevel) || options.maxAdminLevel < 1 || options.maxAdminLevel > 9) {
    usage("--max-admin-level은 1~9의 정수");
  }
  return options;
};

/**
 * The rectangle both transports clip to.
 *
 * The tile extractor fetches whole tiles, so its real coverage is the union of
 * the tiles that touch the requested bbox — wider than what was asked for. The
 * assembler rebuilds exactly that rectangle to draw its closing frame. An
 * Overpass dump has no tiles to be widened by, so it computes the same
 * rectangle deliberately: same frame, comparable outputs.
 */
export const frameOf = (bbox, zoom) => {
  const range = bboxToTileRange(bbox, zoom);
  const nw = tileToBbox(zoom, range.xMin, range.yMin);
  const se = tileToBbox(zoom, range.xMax, range.yMax);
  return [nw[0], se[1], se[2], nw[3]];
};

/**
 * Overpass gives relations their tags and member lists, and ways their
 * geometry. The admin_level and the dates live on the RELATION; the geometry
 * lives on the WAY. This is the join.
 *
 * A way can belong to several relations — a shared border is one way owned by
 * both neighbours, and at 1836 that is most of Germany. The way inherits from
 * the most significant parent alive at the date (lowest admin_level), because
 * that is the line the map is actually drawing: the Prussia–Saxony border is a
 * level-2 line even if some level-4 district also claims it.
 *
 * A way with its OWN dates is gated by those too. OHM dates individual border
 * segments when a frontier moved without the polity ending, and taking the
 * parent's window alone would draw a border that had already been redrawn.
 */
export const joinWays = (elements, targetDec, opts) => {
  const relations = [];
  const waysById = new Map();
  for (const el of elements) {
    if (el.type === "relation") relations.push(el);
    else if (el.type === "way" && Array.isArray(el.geometry)) waysById.set(el.id, el);
  }

  // way id -> the parent relations' props, best (lowest admin_level) first.
  const parents = new Map();
  for (const rel of relations) {
    for (const member of rel.members ?? []) {
      if (member.type !== "way") continue;
      const list = parents.get(member.ref) ?? [];
      list.push(rel.tags ?? {});
      parents.set(member.ref, list);
    }
  }

  const drops = new Map();
  const drop = (why) => drops.set(why, (drops.get(why) ?? 0) + 1);
  const kept = [];
  let orphanWays = 0;

  for (const [id, way] of waysById) {
    const candidates = parents.get(id);
    if (!candidates || candidates.length === 0) {
      // A way returned but claimed by no relation in this response. Counted,
      // never silently kept: without a parent there is no admin_level to
      // filter it by, and an unfiltered line is worse than a missing one.
      orphanWays += 1;
      continue;
    }
    const passing = candidates
      .map((tags) => ({ tags, verdict: featureFilter(tags, targetDec, opts) }))
      .filter((c) => c.verdict.keep)
      .sort((a, b) => Number(a.tags.admin_level) - Number(b.tags.admin_level));
    if (passing.length === 0) {
      drop(candidates.length === 1
        ? featureFilter(candidates[0], targetDec, opts).why
        : "모든 부모 관계가 날짜/레벨 밖");
      continue;
    }
    // The way's own window, when it has one, is an additional gate.
    const ownTags = way.tags ?? {};
    if (ownTags.start_date || ownTags.end_date) {
      const own = featureFilter({ ...ownTags, admin_level: passing[0].tags.admin_level }, targetDec, opts);
      if (!own.keep) { drop(`way 자체 ${own.why}`); continue; }
    }
    // THE PARENT'S NAME DOES NOT TRAVEL. A border way belongs to BOTH
    // neighbours, so labelling it with the parent we happened to pick is half
    // of a two-sided fact — the Prussia–Saxony line would ship as "Königreich
    // Preußen". The tile transport never puts `name` on a line either, and
    // pickProps would keep it if we left it in.
    const { name: _parentName, ...props } = passing[0].tags;
    kept.push({
      id,
      props,
      coordinates: way.geometry.map((pt) => [pt.lon, pt.lat]),
    });
  }
  return { kept, drops, orphanWays, relations: relations.length, ways: waysById.size };
};

const isMain = process.argv[1] && path.resolve(process.argv[1]) === url.fileURLToPath(import.meta.url);
if (isMain) {
  const options = parseArgs(process.argv.slice(2));
  const targetDec = isoToDecdate(options.date);
  if (targetDec === null) usage(`날짜를 읽을 수 없다: ${options.date}`);

  const frame = frameOf(options.bbox, options.zoom);
  const [w, s, e, n] = frame;
  // NO DATE IN THE QUERY, deliberately — see the header. One response serves
  // every date in this window, so the cache key is the window and the ceiling.
  const query = `[out:json][timeout:900][bbox:${s},${w},${n},${e}];`
    + `rel["type"="boundary"]["boundary"="administrative"]["admin_level"~"^[1-${options.maxAdminLevel}]$"]->.r;`
    + ".r out body;way(r.r)->.w;.w out geom;";

  const outDir = path.resolve(ROOT, options.out);
  const key = crypto.createHash("sha256").update(query).digest("hex").slice(0, 10);
  const cacheFile = path.join(outDir, `era-boundaries-raw-${key}.json`);

  let elements = null;
  if (!options.refresh && fs.existsSync(cacheFile)) {
    try {
      const cached = JSON.parse(fs.readFileSync(cacheFile, "utf8"));
      if (Array.isArray(cached?.elements)) {
        elements = cached.elements;
        console.log(`[ohm] 캐시 사용: ${path.relative(ROOT, cacheFile)}`
          + ` (${elements.length}개 요소, ${cached.fetchedAt ?? "시각 미상"}) — 질의 안 함. 다시 받으려면 --refresh`);
      }
    } catch {
      console.log("[ohm] 캐시 손상 — 다시 받는다");
      elements = null;
    }
  }
  if (elements === null) {
    console.log(`[ohm] 오버패스 질의: ${options.endpoint}`);
    console.log(`[ohm]   창 ${frame.map((v) => v.toFixed(2)).join(",")} (z${options.zoom} 타일 정렬)`
      + ` · admin_level ≤ ${options.maxAdminLevel} · 날짜 없음(로컬 필터)`);
    const res = await fetch(options.endpoint, {
      method: "POST",
      headers: { "User-Agent": USER_AGENT, "Content-Type": "application/x-www-form-urlencoded" },
      body: `data=${encodeURIComponent(query)}`,
    });
    if (!res.ok) throw new Error(`오버패스 HTTP ${res.status} — ${(await res.text()).slice(0, 300)}`);
    const body = await res.text();
    console.log(`[ohm] 응답 ${(body.length / 1048576).toFixed(1)} MB`);
    elements = JSON.parse(body).elements ?? [];
    fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(cacheFile, JSON.stringify({
      note: "Raw Overpass response. The query carries no date — every date in this"
        + " window filters this same set locally. Regenerate with --refresh.",
      fetchedAt: new Date().toISOString(),
      query,
      endpoint: options.endpoint,
      elements,
    }));
    console.log(`[ohm] 캐시 기록: ${path.relative(ROOT, cacheFile)}`);
  }

  const joined = joinWays(elements, targetDec, {
    maxAdminLevel: options.maxAdminLevel,
    includeMaritime: options.includeMaritime,
  });
  console.log(`[ohm] 관계 ${joined.relations} · way ${joined.ways} → ${options.date}에 유효한 way ${joined.kept.length}`);

  // Clip to the same rectangle the tile transport ends up covering, so the two
  // dumps frame identically and their face counts mean the same thing.
  const features = [];
  let clippedAway = 0;
  for (const item of joined.kept) {
    const parts = clipPartToBbox(item.coordinates, frame);
    if (parts.length === 0) { clippedAway += 1; continue; }
    const geometry = parts.length === 1
      ? { type: "LineString", coordinates: parts[0] }
      : { type: "MultiLineString", coordinates: parts };
    features.push(eraFeature(geometry, item.props, item.id));
  }

  fs.mkdirSync(outDir, { recursive: true });
  const outFile = path.join(outDir, `era-lines-${options.date}-z${options.zoom}.geojson`);
  fs.writeFileSync(outFile, JSON.stringify(eraCollection(features, {
    date: options.date,
    decdate: targetDec,
    zoom: options.zoom,
    bbox: options.bbox,
    maxAdminLevel: options.maxAdminLevel,
    includeMaritime: options.includeMaritime,
    clippedToTileBounds: true,
    // No `layer` — there is no tile layer here, and the assembler only warns
    // about a layer that is present and wrong. `transport` says what this is.
    transport: "overpass",
    endpoint: options.endpoint,
  })));

  const size = fs.statSync(outFile).size;
  console.log(`[ohm] 기록: ${path.relative(ROOT, outFile)} · ${features.length} features · ${(size / 1048576).toFixed(1)} MB`);
  // NO SILENT CAPS: every way that did not make it says why.
  if (clippedAway > 0) console.log(`    창 밖으로 전부 잘림 ${clippedAway}`);
  if (joined.orphanWays > 0) console.log(`    부모 관계 없음 ${joined.orphanWays}`);
  for (const [why, count] of [...joined.drops.entries()].sort((a, b) => b[1] - a[1]).slice(0, 20)) {
    console.log(`    제외 ${count} × ${why}`);
  }
  if (joined.drops.size > 20) console.log(`    … 그 외 사유 ${joined.drops.size - 20}종`);
  console.log("[ohm] 조립: node scripts/ohm/assemble-era-borders.mjs "
    + `${path.relative(ROOT, outFile)} --polities scripts/ohm/out/era-polities-${options.date}.json --resolve-conflicts`);
}

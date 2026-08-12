/*!
 * Open Historia Map Editor
 * Copyright (c) 2026 Nicholas Krol - MIT License (see src/Editor/LICENSE).
 */

// Plan F, stage F-2 — the NAME source. Calibration verdict (2026-08-09): tile
// centroids cannot name the world — the tiler only emits a label point for
// relations whose geometry closes into a valid polygon, which excludes
// interwar Germany, Poland, France, Japan... So names come from OHM's own
// Overpass instance instead: every admin_level-2 boundary relation's TAGS and
// CENTER (Overpass computes a center even for broken relations), one query,
// no member geometry. Date filtering happens locally with the same window
// logic the extractor uses — Overpass-side string comparison would misread
// year-only end dates ("1945" sorts before "1939-09-01"'s September).
//
//   node scripts/ohm/fetch-era-polities.mjs 1939-09-01
//   node scripts/ohm/fetch-era-polities.mjs 1939-09-01 --admin-level 2 --out scripts/ohm/out
//   node scripts/ohm/fetch-era-polities.mjs 1939-09-01 --refresh   re-download, ignore the cache
//
// RUNS ON THE PLAYER'S PC ONLY (the cloud session may not fetch). One request,
// identified by User-Agent, against a volunteer server — do not loop it. That
// line stood unqualified until plan-era-faces.mjs looped it nineteen times;
// see the paragraph below the header, and note the loop is now free rather
// than forbidden, because the answer never depended on the date.
//
// Output: era-polities-<date>.json — [{ id, name, names{}, center, start_date,
// end_date }], plus loud counts of everything filtered out and why. A CENTER
// CAN LIE: for a strangely-shaped polity the bbox center may fall outside its
// own territory (or inside a neighbour). The assembler treats labels as
// hints and reports every face they fail to name — this file is a source of
// candidates, not gospel.

// THE QUERY DOES NOT MENTION THE DATE, AND THAT CHANGES WHAT LOOPING COSTS.
//
// Read the query below: all admin_level-N boundary relations, no date filter —
// the date is applied locally, a few lines further down, for the reason in the
// paragraph above. So every date asks Overpass the SAME question and gets the
// SAME multi-megabyte answer, and running nineteen dates meant downloading one
// dataset nineteen times off a volunteer server.
//
// That is exactly what the "do not loop it" line was warning about, and
// plan-era-faces.mjs did it anyway on its first real run — the loop is useful,
// so the fix is to make looping cheap rather than to forbid it. The raw
// response is cached under out/era-relations-al<N>.json and reused; --refresh
// re-fetches. Nineteen dates, one request.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";
import { decdateWindow, isoToDecdate, resolveWindow } from "./lib/eraBorders.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, "..", "..");

const DEFAULT_ENDPOINT = "https://overpass-api.openhistoricalmap.org/api/interpreter";
const USER_AGENT = "open-historia-era-extractor/0.1 (personal project; Plan F)";

const usage = (message) => {
  if (message) console.error(`[ohm] ${message}\n`);
  console.error(
    "사용법: node scripts/ohm/fetch-era-polities.mjs <YYYY-MM-DD>" +
      " [--admin-level 2] [--endpoint URL] [--out DIR] [--refresh]",
  );
  process.exit(1);
};

const parseArgs = (argv) => {
  const options = { date: null, adminLevel: 2, endpoint: DEFAULT_ENDPOINT, out: path.join("scripts", "ohm", "out") };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--admin-level") options.adminLevel = Number(argv[(i += 1)]);
    else if (arg === "--endpoint") options.endpoint = String(argv[(i += 1)] ?? "");
    else if (arg === "--out") options.out = String(argv[(i += 1)] ?? "");
    else if (arg === "--refresh") options.refresh = true;
    else if (!arg.startsWith("--") && options.date === null) options.date = arg;
    else usage(`알 수 없는 인자: ${arg}`);
  }
  if (!options.date) usage("날짜가 없다");
  if (!Number.isInteger(options.adminLevel) || options.adminLevel < 1) usage("--admin-level은 1 이상의 정수");
  return options;
};

const main = async () => {
  const options = parseArgs(process.argv.slice(2));
  const targetDec = isoToDecdate(options.date);
  if (targetDec === null) usage(`날짜를 읽을 수 없다: ${options.date}`);

  // All admin_level-N boundary relations EVER — tags and center only. Date
  // filtering is deliberately local (see header).
  const query = `[out:json][timeout:300];relation["type"="boundary"]["boundary"="administrative"]["admin_level"="${options.adminLevel}"];out tags center;`;

  // The cache key is the admin level and nothing else, because the query
  // depends on nothing else. Keyed by date it would never hit.
  const cacheFile = path.join(options.out
    ? path.resolve(PROJECT_ROOT, options.out)
    : path.join(PROJECT_ROOT, "scripts", "ohm", "out"), `era-relations-al${options.adminLevel}.json`);
  let relations = null;
  if (!options.refresh && existsSync(cacheFile)) {
    try {
      const cached = JSON.parse(readFileSync(cacheFile, "utf8"));
      if (Array.isArray(cached?.elements)) {
        relations = cached.elements;
        console.log(`[ohm] 캐시 사용: ${path.relative(PROJECT_ROOT, cacheFile)}`
          + ` (${relations.length}개 관계, ${cached.fetchedAt ?? "시각 미상"}) — 질의 안 함. 다시 받으려면 --refresh`);
      }
    } catch {
      // A corrupt cache is not a reason to fail; it is a reason to re-fetch.
      console.log(`[ohm] 캐시 손상 — 다시 받는다: ${path.relative(PROJECT_ROOT, cacheFile)}`);
      relations = null;
    }
  }
  if (relations === null) {
    console.log(`[ohm] 오버패스 질의: ${options.endpoint} (admin_level=${options.adminLevel}, 태그+중심만)`);
    const res = await fetch(options.endpoint, {
      method: "POST",
      headers: { "User-Agent": USER_AGENT, "Content-Type": "application/x-www-form-urlencoded" },
      body: `data=${encodeURIComponent(query)}`,
    });
    if (!res.ok) throw new Error(`오버패스 HTTP ${res.status} — ${(await res.text()).slice(0, 300)}`);
    const payload = await res.json();
    relations = Array.isArray(payload.elements) ? payload.elements : [];
    mkdirSync(path.dirname(cacheFile), { recursive: true });
    writeFileSync(cacheFile, JSON.stringify({
      note: "Raw Overpass response, cached because the query carries no date —"
        + " every date filters this same set locally. Regenerate with --refresh.",
      fetchedAt: new Date().toISOString(),
      query,
      endpoint: options.endpoint,
      adminLevel: options.adminLevel,
      elements: relations,
    }));
    console.log(`[ohm] 캐시 기록: ${path.relative(PROJECT_ROOT, cacheFile)}`
      + ` — 이후 날짜는 질의 없이 이 파일을 건다`);
  }

  const polities = [];
  const dropped = new Map();
  const drop = (why) => dropped.set(why, (dropped.get(why) ?? 0) + 1);
  for (const rel of relations) {
    const tags = rel.tags ?? {};
    const window = resolveWindow(tags);
    if (!decdateWindow(window.start, window.end, targetDec)) {
      drop("날짜 창 밖");
      continue;
    }
    const name = tags.name ?? tags["official_name"] ?? tags["name:en"] ?? "";
    if (!name) {
      drop("name 없음");
      continue;
    }
    if (!rel.center || !Number.isFinite(rel.center.lon) || !Number.isFinite(rel.center.lat)) {
      drop("center 없음");
      continue;
    }
    const names = {};
    for (const key of ["name:en", "name:ko", "official_name"]) {
      if (tags[key]) names[key] = tags[key];
    }
    polities.push({
      id: rel.id,
      name,
      names,
      center: [rel.center.lon, rel.center.lat],
      admin_level: tags.admin_level ?? String(options.adminLevel),
      start_date: tags.start_date ?? "",
      end_date: tags.end_date ?? "",
    });
  }
  polities.sort((a, b) => a.name.localeCompare(b.name));

  const outDir = path.resolve(PROJECT_ROOT, options.out);
  mkdirSync(outDir, { recursive: true });
  const file = path.join(outDir, `era-polities-${options.date}.json`);
  writeFileSync(file, JSON.stringify({
    meta: {
      source: "OpenHistoricalMap Overpass (data: CC0 1.0 public-domain dedication)",
      attribution: "OpenHistoricalMap contributors",
      date: options.date,
      decdate: targetDec,
      adminLevel: options.adminLevel,
      endpoint: options.endpoint,
      relationsTotal: relations.length,
    },
    polities,
  }, null, 1));

  console.log(`[ohm] 관계 ${relations.length}개 중 ${options.date}에 유효한 정치체 ${polities.length}개`);
  for (const [why, count] of [...dropped.entries()].sort((a, b) => b[1] - a[1])) {
    console.log(`    제외 ${count} × ${why}`);
  }
  console.log(`[ohm] 기록: ${path.relative(PROJECT_ROOT, file)} — 조립기(assemble-era-borders)의 --polities 입력`);
};

main().catch((err) => {
  console.error("[ohm] FAILED:", err);
  process.exit(1);
});

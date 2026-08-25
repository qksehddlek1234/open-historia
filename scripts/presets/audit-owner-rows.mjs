/*!
 * Open Historia Map Editor
 * Copyright (c) 2026 Nicholas Krol - MIT License (see src/Editor/LICENSE).
 */

// B-8 — the ownership-table geometry audit. A row in world.regionOwnershipOverrides
// whose id names no feature the board draws is a GHOST: paint never reads it (the
// fill lanes key off geojson features — Nations.jsx ownerByRegionId), but conquest
// and stat logic see a region that does not exist.
//
//   node scripts/presets/audit-owner-rows.mjs               # every built board
//   node scripts/presets/audit-owner-rows.mjs <board-id>    # one board
//
// WHERE GHOSTS COME FROM, so the next reader does not re-derive it: the
// countryAssignments expansion in build-preset.mjs used to emit whatever GID_1
// the pmtiles CATALOG listed, and the catalog lags the seed — for countries the
// seed subdivided (China 31 L1 → 344 prefectures, Spain, France, Greece,
// Finland, Belgium, the UK's ONS counties) the old L1 ids name nothing.
// victorian-1836 carried 81 of them until 2026-08-19; the builder now translates
// those ids through the shared resolver and prints anything it must drop, so a
// rebuilt board audits clean. This audit exists for the boards NOT yet rebuilt,
// and as the regression tripwire if a new id family ever slips the seed.
//
// SECOND AUDIT IN THE SAME FILE (2026-08-20): era keys must be DERIVED.
// The era piece ids were minted by a build counter until today, and that made
// every rebuild renumber them — a saved game holding `era_37 → Lippe` then drew
// Lippe wherever piece 37 landed (the Baltic). The ids come from the piece now
// (lib/eraGeometry.mjs stableEraKey). This audit is the tripwire for a
// regression, and it compares the KEY SET, never the count: measured on 1836,
// the two Lucca offcuts differ in area by only 10.2%, so a swap that leaves the
// count at 45 while exchanging two ids is entirely possible and a count check
// would sail past it.
//
// Classification, per ownership row id:
//   ghost     not in board geojson, not in tile catalog — dead weight
//   tileOnly  not in board geojson, but tile-drawable — logic-side ghost too
//             (paint keys off geojson), listed separately because regenerated
//             tiles could resurrect or orphan them differently
// Rows whose id the board geojson carries are healthy regardless of the
// catalog: geojson is what the map draws from.
//
// THIRD AUDIT (2026-08-25): the ghost's OPPOSITE POLARITY. An owner that paints
// ≥1 geojson feature but holds ZERO ownership rows is invisible to the game:
// isPolityLandless (gameState) counts only the table, so the polity draws land
// on the map while the game calls it landless — neutral flag, zero regions in
// stats. Cause: graftEraGeometry's REOWNED path (whole-cover, no cut) set the
// owner without the `edited` stamp the table sync keyed off. The builder now
// stamps `eraFace` there and syncs on it; this audit is the tripwire for boards
// built before the fix and for any new rowless path. Skipped when the board
// ships an EMPTY table — that means "owns via the stock base map" by design.

import { readFileSync, readdirSync, existsSync } from "fs";
import path from "path";
import url from "url";

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, "..", "..");
const SCENARIOS_DIR = path.join(PROJECT_ROOT, "server", "data", "scenarios");

const byCountry = (ids) => {
  const m = new Map();
  for (const id of ids) {
    const c = String(id).split(".")[0];
    m.set(c, (m.get(c) ?? 0) + 1);
  }
  return [...m.entries()].sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${v}`).join(", ");
};

export const auditOwnerRows = (ownership, geoIds, catalogIds) => {
  const ghost = [];
  const tileOnly = [];
  for (const id of Object.keys(ownership ?? {})) {
    if (geoIds.has(id)) continue;
    (catalogIds.has(id) ? tileOnly : ghost).push(id);
  }
  return { ghost, tileOnly };
};

// Third audit: owners painting features with zero table rows (see header).
// `featureOwners` is the list of every land feature's owner string; returns
// { owner: featureCount } for the rowless ones. An empty table means the board
// owns via the stock base map — nothing to compare, nothing flagged.
export const auditRowlessOwners = (ownership, featureOwners) => {
  const entries = Object.entries(ownership ?? {});
  if (entries.length === 0) return {};
  const rowOwners = new Set(entries.map(([, owner]) => String(owner)));
  const rowless = {};
  for (const owner of featureOwners) {
    if (!owner || rowOwners.has(String(owner))) continue;
    rowless[owner] = (rowless[owner] ?? 0) + 1;
  }
  return rowless;
};

// ── CLI ──────────────────────────────────────────────────────────────────────
if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(url.fileURLToPath(import.meta.url))) {
  const { loadRegionCatalog } = await import("./lib/regionCatalog.mjs");
  const catalogIds = new Set((await loadRegionCatalog()).map((r) => r.GID_1));
  const given = process.argv.slice(2).filter((a) => !a.startsWith("--"));
  const boards = given.length > 0 ? given : readdirSync(SCENARIOS_DIR).filter((d) =>
    existsSync(path.join(SCENARIOS_DIR, d, "world.json")));

  let dirty = 0;
  for (const board of boards.sort()) {
    const worldPath = path.join(SCENARIOS_DIR, board, "world.json");
    const regionsPath = path.join(SCENARIOS_DIR, board, "regions.geojson");
    if (!existsSync(worldPath) || !existsSync(regionsPath)) continue;
    const world = JSON.parse(readFileSync(worldPath, "utf8"));
    const geoFeatures = JSON.parse(readFileSync(regionsPath, "utf8")).features ?? [];
    const geoIds = new Set(
      geoFeatures.map((f) => f.id ?? f.properties?.id).filter(Boolean).map(String),
    );
    const legacyEraKeys = [...geoIds].filter((id) => /^era_\d+$/.test(id));
    if (legacyEraKeys.length > 0) {
      dirty += 1;
      console.log(`${board}: ⚠ 카운터 방식 era 키 ${legacyEraKeys.length}개 — 재빌드하면 세이브가 밀린다 (stableEraKey 미적용 보드)`);
    }
    // 바다는 소유가 world의 "sea_…" 행에 따로 살므로 3차 검사에서 뺀다.
    const landOwners = geoFeatures
      .filter((f) => f.properties?.kind !== "sea")
      .map((f) => f.properties?.owner)
      .filter(Boolean);
    const rowless = auditRowlessOwners(world.regionOwnershipOverrides, landOwners);
    const rowlessNames = Object.keys(rowless);
    const { ghost, tileOnly } = auditOwnerRows(world.regionOwnershipOverrides, geoIds, catalogIds);
    if (ghost.length === 0 && tileOnly.length === 0 && rowlessNames.length === 0) continue;
    dirty += 1;
    const parts = [];
    if (ghost.length || tileOnly.length) {
      parts.push(`유령 ${ghost.length}${ghost.length ? ` (${byCountry(ghost)})` : ""}` +
        ` · 타일만 ${tileOnly.length}${tileOnly.length ? ` (${byCountry(tileOnly)})` : ""}`);
    }
    if (rowlessNames.length) {
      // 두 종이 있다: 시대 파이프라인이 재소유한 지역(재빌드가 처방 — eraFace
      // 동기화, 2026-08-25)과 스톡 현대 소유를 그대로 둔 지역(재빌드로 안 낫는다
      // — countryAssignments 밖 국가는 애초에 행을 받은 적이 없다. 처방은 엔진
      // 설계 판단, WORKLOG 2026-08-25 참조). 재빌드 후에도 남으면 후자다.
      parts.push(`행 없는 소유주 ${rowlessNames.length} — 지도는 그리는데 게임은 무토지로 본다: ` +
        rowlessNames.map((o) => `${o} ${rowless[o]}지역`).join(", "));
    }
    console.log(`${board}: ${parts.join(" · ")} — 유령/타일만은 재빌드가 처방 (builder가 번역/드롭/동기화를 인쇄한다)`);
  }
  console.log(dirty === 0 ? "\n함대 깨끗 — 유령 행 0 · 행 없는 소유주 0" : `\n${dirty}개 보드에 잔여 — 종별 처방은 각 줄 참조`);
}

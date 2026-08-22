#!/usr/bin/env node
/*! Open Historia — carry the era-key change into campaigns already running © 2026 Nicholas Krol, MIT (see src/Editor/LICENSE). */
// THE HALF OF THE ERA-KEY CHANGE THAT TOUCHES SAVES.
//
//   node scripts/presets/migrate-save-era-keys.mjs                report only (default)
//   node scripts/presets/migrate-save-era-keys.mjs --adopt        apply
//   node scripts/presets/migrate-save-era-keys.mjs --only victorian-era-1836-session
//   node scripts/presets/migrate-save-era-keys.mjs --games <dir>  read campaigns from somewhere else
//
// Sibling of migrate-save-palette.mjs and migrate-save-contracts.mjs, and it
// reports before it writes for the same reason: a live campaign is not ours.
// `--games` exists so this can be rehearsed on a copy.
//
// WHAT BROKE. era piece ids used to be `era_${counter}`, minted by a build-time
// sequential counter. Which regions get cut decides the numbering, so one extra
// or one missing cut renumbered everything after it — measured on 1836, a median
// of 22 of 45 keys move. A save holding `era_37 → Principality of Lippe` then
// points at whatever piece inherited 37, which is how Lippe ended up drawn in
// the Baltic. The ids are derived from the piece now (lib/eraGeometry.mjs
// stableEraKey), so this can never happen again — but a save written before the
// change still holds the old numbers.
//
// WHY A TABLE AND NOT A COMPUTATION. The save cannot repair itself: measured
// 2026-08-20, its world.json contains `eraSplitOf` 0 times, `eraFace` 0 times
// and `coordinates` 0 times — the era rows are bare `id → owner name` pairs. The
// previous board is not in git either (.gitignore excludes board outputs). So
// the correspondence had to be TAKEN, from the boards while they still carried
// the old numbering, by scripts/presets/build-era-key-map.mjs. That snapshot is
// data/era-key-map.json and it is the only evidence that exists. This script
// spends it.
//
// WHAT THIS WILL NOT DO. It will not touch a key the table cannot answer for,
// it will not add rows for era pieces the save never had, and it will not run
// twice: a save already migrated has no `era_N` keys left, so the second run
// reports nothing to do.
import { readFileSync, writeFileSync, readdirSync, existsSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..", "..");
const MAP_PATH = path.join(ROOT, "data", "era-key-map.json");

const args = process.argv.slice(2);
const adopt = args.includes("--adopt");
const only = args.includes("--only") ? args[args.indexOf("--only") + 1] : null;
const gamesDir = args.includes("--games")
  ? path.resolve(args[args.indexOf("--games") + 1])
  : path.join(ROOT, "server", "data", "games");

if (!existsSync(MAP_PATH)) {
  console.error(`[era-keys] data/era-key-map.json 이 없다 — 이 표 없이는 옛 키를 해석할 근거가 없다.`);
  process.exit(1);
}
const table = JSON.parse(readFileSync(MAP_PATH, "utf8"));
const OLD_KEY = /^era_\d+$/;

let games = 0;
let migrated = 0;
let unresolved = 0;
for (const gameId of existsSync(gamesDir) ? readdirSync(gamesDir).sort() : []) {
  if (only && only !== gameId) continue;
  const worldPath = path.join(gamesDir, gameId, "world.json");
  if (!existsSync(worldPath)) continue;
  const world = JSON.parse(readFileSync(worldPath, "utf8"));
  const overrides = world.regionOwnershipOverrides;
  if (!overrides || typeof overrides !== "object") continue;
  const oldKeys = Object.keys(overrides).filter((k) => OLD_KEY.test(k));
  if (oldKeys.length === 0) continue;
  games += 1;

  // The board this campaign was started from decides which table to read. It is
  // recorded in game-instance.json, NOT in world.json (checked: world.json has
  // no scenarioId at all), and a save that does not name its board is reported
  // and skipped rather than guessed at — the wrong table would rename keys to
  // another board's geometry, which is the very defect this repairs.
  let boardId = "";
  const instancePath = path.join(gamesDir, gameId, "game-instance.json");
  if (existsSync(instancePath)) {
    try { boardId = String(JSON.parse(readFileSync(instancePath, "utf8")).scenarioId ?? ""); } catch { boardId = ""; }
  }
  const boardMap = table.boards?.[boardId];
  if (!boardMap) {
    console.log(`  ${gameId}: era 키 ${oldKeys.length}개 · 보드 "${boardId}" 대응표 없음 — 건너뜀`);
    unresolved += oldKeys.length;
    continue;
  }

  const renamed = {};
  const missing = [];
  for (const key of oldKeys) {
    const next = boardMap[key];
    if (!next) { missing.push(key); continue; }
    renamed[key] = next;
  }
  console.log(`  ${gameId} (${boardId}): era 키 ${oldKeys.length}개 → 대응 ${Object.keys(renamed).length}개` +
    `${missing.length ? ` · 표에 없음 ${missing.length}개 (${missing.slice(0, 5).join(", ")}${missing.length > 5 ? "…" : ""})` : ""}`);
  unresolved += missing.length;
  if (!adopt) continue;

  // Rewrite in place, preserving key order so a diff of the save reads as a
  // rename rather than a reshuffle.
  const next = {};
  for (const [key, value] of Object.entries(overrides)) next[renamed[key] ?? key] = value;
  world.regionOwnershipOverrides = next;
  writeFileSync(worldPath, `${JSON.stringify(world, null, 2)}\n`, "utf8");
  migrated += Object.keys(renamed).length;
  console.log(`     ↳ 적용: ${Object.keys(renamed).length}개 리네임, ${worldPath}`);
}

if (games === 0) console.log("[era-keys] 옛 era_N 키를 가진 세이브 없음 — 할 일 없다.");
else if (!adopt) console.log(`\n[era-keys] 보고만 함. 적용하려면 --adopt. (미해결 ${unresolved}개)`);
else console.log(`\n[era-keys] ${games}개 세이브 · ${migrated}개 키 리네임 · 미해결 ${unresolved}개`);

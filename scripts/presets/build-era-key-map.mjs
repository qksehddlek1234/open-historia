/*!
 * Open Historia Map Editor
 * Copyright (c) 2026 Nicholas Krol - MIT License (see src/Editor/LICENSE).
 */

// ONE-SHOT: the era_N → stable-key correspondence table, taken from the boards
// AS THEY STAND before the id change lands.
//
//   node scripts/presets/build-era-key-map.mjs          # writes data/era-key-map.json
//
// WHY THIS EXISTS AND WHY IT RUNS EXACTLY ONCE. Saved games store era ids as
// bare ownership keys — measured 2026-08-20, a save's world.json contains
// `eraSplitOf` 0 times, `eraFace` 0 times, `coordinates` 0 times. Board outputs
// are gitignored, so no previous build survives in history either. So once the
// builder starts minting stable ids, NOTHING left in the repo can say which
// era_N the old save meant — unless the mapping is taken first, from the boards
// while they still carry the old numbering AND the save is in a healed state
// (it is: the 1836 save's 45 era keys match the board 45/45 today).
//
// This is that snapshot. After the id change it is history, not a tool.
import { readFileSync, writeFileSync, readdirSync, existsSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { stableEraKey } from "./lib/eraGeometry.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..", "..");
const SCENARIOS = path.join(ROOT, "server", "data", "scenarios");
const OUT = path.join(ROOT, "data", "era-key-map.json");

const boards = {};
let total = 0;
let collisions = 0;
for (const id of readdirSync(SCENARIOS).sort()) {
  const regionsPath = path.join(SCENARIOS, id, "regions.geojson");
  if (!existsSync(regionsPath)) continue;
  const features = JSON.parse(readFileSync(regionsPath, "utf8")).features ?? [];
  const map = {};
  const seen = new Set();
  for (const feature of features) {
    const props = feature?.properties ?? {};
    const old = String(props.id ?? "");
    if (!/^era_\d+$/.test(old)) continue;
    const key = stableEraKey(props.eraSplitOf, props.eraFace, props.owner);
    if (seen.has(key)) { collisions += 1; console.warn(`  ⚠ ${id}: 키 충돌 ${key}`); }
    seen.add(key);
    map[old] = key;
    total += 1;
  }
  if (Object.keys(map).length > 0) boards[id] = map;
}

writeFileSync(OUT, `${JSON.stringify({
  note: "era_N → 안정 키 대응표. 2026-08-20 id 교체 직전의 보드 상태에서 뜬 1회성 스냅샷 — 세이브 마이그레이션의 유일한 근거다.",
  takenAt: "2026-08-20",
  boards,
}, null, 2)}\n`, "utf8");
console.log(`[era-key-map] ${Object.keys(boards).length}개 보드 · era 키 ${total}개 · 충돌 ${collisions}건 → ${OUT}`);
if (collisions > 0) process.exit(1);

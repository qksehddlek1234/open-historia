/*! Open Historia — era-border coverage meter. */

// HOW MUCH OF EACH BOARD'S NATIONAL BORDER ACTUALLY CAME FROM THE ERA?
//
//   node scripts/ohm/era-coverage.mjs [board …]
//
// "시나리오가 그 당시 국경선을 재현하지 못한다"는 관찰을 **숫자**로 바꾼다.
// 판정에 추정이 없다: 손대지 않은 현대 시드(`public/assets/regions-seed.geojson`)의
// 세그먼트 집합을 만든 다음, 각 보드의 소유권 경계를 한 조각씩 대조한다.
//
//   시드에 있는 세그먼트  → **현대 프로빈스 모서리**가 국경 노릇을 하고 있다
//   시드에 없는 세그먼트  → 시대 면이 잘라 만든 선이다
//
// 길이(km)로 센다. 플레이어가 보는 건 정점 수가 아니라 선의 길이이고, 정점이
// 촘촘한 해안 지역이 표를 왜곡하지 않게 한다. 등장방형 근사에 cos(위도) 보정.
//
// ── 이 숫자가 말하지 않는 것 (읽는 사람이 반드시 알아야 한다) ──────────────
// 재현율은 "**시대 자료에서 온 비율**"이지 "**맞는 비율**"이 아니다. 현대 국경과
// 그 시대 국경이 실제로 같은 곳 — 1885년 이후 아프리카 분할선, 아메리카 대부분,
// 1946년 이후 유럽 상당 부분 — 에서는 0%가 **정답**이다. 반대로 1935년 독일-폴란드
// 처럼 다른 곳에서 0%는 결함이다. 그러니 이 표는 **어디를 파야 하는지 고르는
// 도구**이지 점수판이 아니다. 보드 간 비교보다 **같은 보드의 시간에 따른 변화**가
// 훨씬 믿을 만하다.
import { readFileSync, readdirSync, existsSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const SEED = path.join(ROOT, "public", "assets", "regions-seed.geojson");
const SCENARIOS = path.join(ROOT, "server", "data", "scenarios");

const ringsOf = (geometry) => {
  if (geometry?.type === "Polygon") return geometry.coordinates ?? [];
  if (geometry?.type === "MultiPolygon") return (geometry.coordinates ?? []).flat();
  return [];
};
const segmentKey = (a, b) => {
  const ka = `${a[0]},${a[1]}`;
  const kb = `${b[0]},${b[1]}`;
  return ka < kb ? `${ka}|${kb}` : `${kb}|${ka}`;
};
const lengthKm = (a, b) => {
  const midLat = ((a[1] + b[1]) / 2) * (Math.PI / 180);
  return Math.hypot((b[0] - a[0]) * Math.cos(midLat) * 111.32, (b[1] - a[1]) * 110.57);
};

const eachSegment = (features, visit) => {
  for (let index = 0; index < features.length; index += 1) {
    if (features[index]?.properties?.kind === "sea") continue;
    for (const ring of ringsOf(features[index]?.geometry)) {
      if (!ring) continue;
      for (let v = 0; v + 1 < ring.length; v += 1) {
        const a = ring[v];
        const b = ring[v + 1];
        if (a[0] === b[0] && a[1] === b[1]) continue;
        visit(segmentKey(a, b), a, b, index);
      }
    }
  }
};

const seedSegments = () => {
  const set = new Set();
  const fc = JSON.parse(readFileSync(SEED, "utf8"));
  eachSegment(fc.features ?? [], (key) => set.add(key));
  return set;
};

// One board: split its owner frontier into era-cut and modern-province length.
export const measureBoard = (board, seed) => {
  const fc = JSON.parse(readFileSync(path.join(SCENARIOS, board, "regions.geojson"), "utf8"));
  const features = fc.features ?? [];
  const owners = features.map((f) => String(f?.properties?.owner ?? ""));
  const seen = new Map();
  eachSegment(features, (key, a, b, index) => {
    const cur = seen.get(key);
    if (!cur) seen.set(key, { a, b, i: index, j: -1 });
    else if (cur.j === -1) cur.j = index;
  });
  let modernKm = 0;
  let eraKm = 0;
  for (const [key, s] of seen) {
    if (s.j === -1) continue;                       // coast, not a border
    if (owners[s.i] === owners[s.j]) continue;      // interior of one country
    const km = lengthKm(s.a, s.b);
    if (seed.has(key)) modernKm += km; else eraKm += km;
  }
  return { board, modernKm, eraKm, totalKm: modernKm + eraKm };
};

const boards = process.argv.slice(2).length
  ? process.argv.slice(2)
  : readdirSync(SCENARIOS)
    .filter((d) => d !== "default" && existsSync(path.join(SCENARIOS, d, "regions.geojson")))
    .sort();

process.stdout.write("[coverage] 시드 세그먼트 색인 중… ");
const seed = seedSegments();
console.log(`${seed.size.toLocaleString()}개`);

const rows = boards.map((board) => measureBoard(board, seed))
  .sort((a, b) => (b.eraKm / (b.totalKm || 1)) - (a.eraKm / (a.totalKm || 1)));

console.log(`\n${"보드".padEnd(18)}${"국경 총연장".padStart(13)}${"시대 자료".padStart(13)}${"재현율".padStart(9)}`);
console.log("-".repeat(53));
for (const r of rows) {
  const pct = r.totalKm ? (r.eraKm / r.totalKm) * 100 : 0;
  console.log(r.board.padEnd(18)
    + `${Math.round(r.totalKm).toLocaleString()}km`.padStart(13)
    + `${Math.round(r.eraKm).toLocaleString()}km`.padStart(13)
    + `${pct.toFixed(1)}%`.padStart(9));
}
const total = rows.reduce((s, r) => s + r.totalKm, 0);
const era = rows.reduce((s, r) => s + r.eraKm, 0);
console.log("-".repeat(53));
console.log("합계".padEnd(18)
  + `${Math.round(total).toLocaleString()}km`.padStart(13)
  + `${Math.round(era).toLocaleString()}km`.padStart(13)
  + `${(total ? (era / total) * 100 : 0).toFixed(1)}%`.padStart(9));
console.log("\n※ 재현율은 '시대 자료에서 온 비율'이지 '맞는 비율'이 아니다 — 파일 머리말 참조.");

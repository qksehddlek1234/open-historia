// Hand-written Korean for every scenario card string, keyed by the EXACT
// English the cards render — replacing the machine-flavored entries the AI
// translator accumulated. Reads the built scenario.json files so the keys can
// never drift from what is actually rendered, and writes BOTH packs: the
// shipped seed (public/lang/ko.json) and the live overlay the server reads
// (server/data/lang/ko.json — gitignored; every write is logged in WORKLOG).
// Rerunnable: node scripts/i18n/ko-card-copy.mjs
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import path from "node:path";
import url from "node:url";

const ROOT = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), "..", "..");

// 시나리오별 수기 번역 — 필드 값은 카드에 렌더되는 그대로의 한국어.
const CARD_KO = {
  default: {
    name: "현대",
    heroTitle: "현대",
    heroSubtitle: "2016년 1월 1일, 있는 그대로의 세계. 어느 나라로든 시작할 수 있다.",
    subtitle: "2016년 1월 1일",
    description: "실제 국경과 실제 지도자, 실제 갈등의 단층선까지 담긴 오늘의 세계. 어느 나라든 맡아, 이다음에 올 역사를 직접 몰고 가라.",
  },
  "bronze-1200bc": {
    name: "청동기 시대 — 기원전 1200년",
    heroTitle: "붕괴 전야",
    heroSubtitle: "궁전들은 아직 서 있다. 바다 민족이 오고 있다.",
    subtitle: "기원전 1200년 무렵",
    description: "전성기의 후기 청동기 시대. 파라오는 누비아에서 가나안까지 다스리며 하티·바빌론·아시리아의 대왕들과 형제 대 형제로 교역한다. 청동과 그것이 요구하는 주석이 미케네에서 수사까지, 궁전과 전차와 서기들의 국제 질서를 하나로 묶고 있다. 그러나 수확은 실패하고 있고, 바다 민족이 움직이기 시작했으며, 한 세대 안에 이 지도 위 거의 모든 궁전이 불탈 것이다. 이집트로서 옛 세계를 지켜내든, 침략자로서 부수든, 그 잿더미에서 일어서든.",
  },
  "coldwar-1946": {
    name: "냉전 — 1946",
    heroTitle: "냉전의 여명",
    heroSubtitle: "철의 장막이 내린다 — 1946년 3월 5일",
    subtitle: "1946년 3월 5일",
    description: "총성은 멎었고, 세계는 폐허이자 가능성이다. 오늘 처칠이 철의 장막을 입에 올린다. 소련 전차는 철군 시한을 넘긴 채 이란에 머물러 있고, 독일·오스트리아·한반도는 점령 구역으로 갈라졌으며, 중국은 다시 내전으로 미끄러지고, 원자폭탄은 아직 단 한 나라의 것이다. 평화를 빚어내라 — 아니면 다음 전쟁을.",
  },
  "colonial-1650": {
    name: "신대륙 — 1650",
    heroTitle: "신대륙 식민 시대",
    heroSubtitle: "돛의 제국들, 그리고 그들을 맞이한 민족들 — 1650년",
    subtitle: "1650년",
    description: "1650년. 스페인의 은 선단은 두 부왕령에서 출항하고, 포르투갈은 브라질을 두고 네덜란드와 싸우며, 공화정 잉글랜드는 매사추세츠에서 바베이도스까지 식민지를 심고, 프랑스는 세인트로렌스 강을 거슬러 모피를 사들인다. 그러나 아메리카 대부분은 여전히 처음부터 그곳에 살던 민족들의 땅이다 — 하우데노사우니, 체로키, 수, 아파치, 마야, 마푸체. 바다 건너 제국을 세우든, 그 제국을 바다로 되밀든.",
  },
  "medieval-1200": {
    name: "중세 — 1200년",
    heroTitle: "중세의 절정",
    heroSubtitle: "황제와 칼리프와 십자군의 세계 — 1200년 무렵",
    subtitle: "1200년 무렵",
    description: "1200년. 신성 로마 제국과 카페 왕가가 유럽을 두고 겨루고, 앙주 가문은 잉글랜드에서 아키텐까지 다스린다. 비잔티움은 아직 서 있고(제4차 십자군은 오지 않았다), 알모하드와 아이유브가 이슬람 세계의 서쪽과 동쪽을 장악했으며, 십자군 국가들은 레반트 해안에 매달려 있다. 신앙과 강철의 시대 — 왕국이든 제국이든 칼리프국이든, 이끌어 보라.",
  },
  "mongol-1300": {
    name: "몽골 세계 — 1300년",
    heroTitle: "몽골의 세기",
    heroSubtitle: "네 칸국이 고려에서 카르파티아까지 다스린다 — 1300년",
    subtitle: "1300년",
    description: "1300년. 칭기즈 칸의 후예들이 역사상 가장 넓은 대륙 제국을 다스린다 — 대도의 원 황제, 초원의 킵차크 칸국, 트란스옥시아나의 차가타이, 페르시아의 일 칸. 러시아 공후들과 발칸의 차르들은 조공을 바친다. 말발굽 너머에는: 맘루크 이집트는 무패로 버티고, 델리의 술탄은 인도를 정복하며, 에드워드 1세는 스코틀랜드를 두드리고, 필리프 4세는 성전기사단의 프랑스를 쥐어짜며, 어느 무명의 오스만 베그가 비잔티움 변경을 습격하고 있다. 칸국과 함께 달리든, 맞서 달리든.",
  },
  "roman-117": {
    name: "로마 — 117년",
    heroTitle: "제국의 정점",
    heroSubtitle: "트라야누스가 죽었다. 하드리아누스가 서방 최대의 제국을 물려받는다.",
    subtitle: "117년",
    description: "117년. 로마는 대서양에서 티그리스까지 다스린다 — 다키아는 정복되었고, 아르메니아와 메소포타미아는 병합되었으며, 파르티아는 패했으되 꺾이지 않았다. 동쪽에서는 한나라 황제가 천명을 쥐고, 쿠샨의 왕들이 그 사이 비단길에 세금을 매긴다. 국경 너머엔 자유로운 민족들 — 게르마니아, 칼레도니아, 초원. 정점에 선 제국을 다스리든, 그 제국이 물러나기를 기다리는 세력이 되든.",
  },
  "ww1-1914": {
    name: "제1차 세계대전 — 1914",
    heroTitle: "제1차 세계대전",
    heroSubtitle: "7월 위기가 터진다 — 1914년 7월 28일",
    subtitle: "1914년 7월 28일",
    description: "오스트리아-헝가리가 세르비아에 선전포고했고, 동맹의 사슬이 모든 열강을 심연으로 끌어당기고 있다. 네 제국이 저마다의 정점에서, 자신들의 마지막 시대를 살고 있다는 것도 모른 채 서 있다. 동원 시간표는 이미 돌아가기 시작했다. 어느 나라든 이끌고, 옛 세계를 끝장낼 전쟁을 통과하라.",
  },
  "wwii-1935": {
    name: "제2차 세계대전 — 1935 전운",
    heroTitle: "몰려오는 폭풍",
    heroSubtitle: "세계가 전쟁으로 흘러간다 — 1935년 12월 1일",
    subtitle: "1935년 12월 1일",
    description: "전차가 구르기 4년 전, 아직 모든 것이 열려 있다. 이탈리아는 아비시니아에서 국제연맹 최초의 큰 시험대를 밀어붙이고, 독일은 비무장 라인란트 뒤에서 재무장하며, 스페인 공화국은 삐걱대고, 민주국가들은 제재를 놓고 입씨름한다. 어느 나라든 맡아, 전쟁이 일어날지 그 자체를 결정할 몇 해를 지나라.",
  },
  "millennium-2000": {
    name: "밀레니엄의 여명 — 2000",
    heroTitle: "새로운 천년",
    heroSubtitle: "세기가 바뀌고 역사가 다시 시작된다 — 2000년 1월 1일",
    subtitle: "2000년 1월 1일",
    description: "Y2K 소동은 불발로 끝났고, 닷컴 열풍은 정점을 향해 달리며, 미국은 끝나가는 줄도 모르는 일극 세계 위에 서 있다. 오늘 아침 푸틴이 크렘린을 넘겨받았다. 체첸은 불타고, 남북한은 첫 정상회담을 향해 다가서며, 유럽의 열한 개 통화는 곧 하나가 된다. 아무도 예상하지 못한 십 년을 플레이하라.",
  },
  "napoleonic-1804": {
    name: "나폴레옹 전쟁 — 1804",
    heroTitle: "제국 전야",
    heroSubtitle: "내일 나폴레옹이 스스로 관을 쓴다 — 1804년 12월 1일",
    subtitle: "1804년 12월 1일",
    description: "내일 노트르담에서 보나파르트가 스스로 황제의 관을 쓴다. 영국은 이미 전쟁 중이고, 제3차 대프랑스 동맹이 꾸려지고 있으며, 아이티의 신생 공화국에서 라호르의 시크 궁정까지 낡은 질서가 갈라지고 있다. 한 사람의 군대가 유럽을 다시 그리는 십 년 — 어느 열강이든 지휘하라. 아니면 끝내 그를 꺾을 동맹을.",
  },
  "wwii-1939": {
    name: "제2차 세계대전 — 1939",
    heroTitle: "제2차 세계대전",
    heroSubtitle: "개전 전야의 유럽 — 1939년 9월 1일",
    subtitle: "1939년 9월 1일",
    description: "국방군이 폴란드 국경을 넘는 순간의 세계. 추축은 떠오르고, 식민 제국들은 지구를 두르고 있으며, 미국은 중립을 지키고 있다. 어느 나라든 이끌고, 인류사에서 가장 많은 피를 흘린 전쟁을 통과하라.",
  },
};

// 카드 주변의 분류어·게임 카드 폴백.
const GLOBAL_KO = {
  "Historical Preset": "역사 프리셋",
  Scenario: "시나리오",
  "Built-In": "기본 제공",
  Game: "게임",
  "Modern Day Session": "현대 세션",
  "Playable campaign session": "플레이 가능한 캠페인 세션",
  "Current campaign": "진행 중인 캠페인",
  "Active playable game": "진행 중인 게임",
};

const FIELDS = ["name", "heroTitle", "heroSubtitle", "subtitle", "description"];
const additions = { ...GLOBAL_KO };
let missing = 0;
for (const [id, ko] of Object.entries(CARD_KO)) {
  const metaPath = path.join(ROOT, "server", "data", "scenarios", id, "scenario.json");
  if (!existsSync(metaPath)) {
    console.warn(`! ${id}: scenario.json not built — run scripts/presets/rebuild-all.mjs first`);
    missing += 1;
    continue;
  }
  const meta = JSON.parse(readFileSync(metaPath, "utf8"));
  for (const field of FIELDS) {
    const en = String(meta[field] ?? "").trim();
    if (!en || !ko[field]) continue;
    additions[en] = ko[field];
  }
}

let written = 0;
for (const packPath of [
  path.join(ROOT, "public", "lang", "ko.json"),
  path.join(ROOT, "server", "data", "lang", "ko.json"),
]) {
  const pack = JSON.parse(readFileSync(packPath, "utf8"));
  let changed = 0;
  for (const [en, ko] of Object.entries(additions)) {
    if (pack[en] !== ko) {
      pack[en] = ko;
      changed += 1;
    }
  }
  writeFileSync(packPath, `${JSON.stringify(pack, null, 2)}\n`, "utf8");
  console.log(`${path.relative(ROOT, packPath)}: ${changed} entr(ies) written`);
  written += changed;
}
console.log(`card strings mapped: ${Object.keys(additions).length}, scenarios missing build: ${missing}`);

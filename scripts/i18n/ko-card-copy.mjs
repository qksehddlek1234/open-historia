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
    eyebrow: "후기 청동기",
  },
  "coldwar-1946": {
    name: "냉전 — 1946",
    heroTitle: "냉전의 여명",
    heroSubtitle: "철의 장막이 내린다 — 1946년 3월 5일",
    subtitle: "1946년 3월 5일",
    description: "총성은 멎었고, 세계는 폐허이자 가능성이다. 오늘 처칠이 철의 장막을 입에 올린다. 소련 전차는 철군 시한을 넘긴 채 이란에 머물러 있고, 독일·오스트리아·한반도는 점령 구역으로 갈라졌으며, 중국은 다시 내전으로 미끄러지고, 원자폭탄은 아직 단 한 나라의 것이다. 평화를 빚어내라 — 아니면 다음 전쟁을.",
    eyebrow: "양극의 세계",
  },
  "korea-1950": {
    name: "1950 — 갈라진 세계",
    heroTitle: "무엇이든 두 개씩",
    heroSubtitle: "두 개의 독일, 두 개의 한국, 두 개의 중국 — 1950년 1월 1일",
    subtitle: "1950년 1월 1일",
    description: "선이 두 번 그어진 해다. 독일과 한국은 각각 두 나라로 깨어났고, 마오의 공화국은 태어난 지 석 달, 장제스는 섬에 있다. 8월 말 모스크바의 첫 폭탄이 1946년을 견딜 만하게 해주던 미국의 독점을 끝냈다. 여섯 달 뒤 한 군대가 38선을 넘는다 — 여기서 누군가 다른 일을 하지 않는다면.",
    eyebrow: "굳어지는 냉전",
  },
  "coldwar-1989": {
    name: "1989 — 끝난 해",
    heroTitle: "모스크바는 전차를 보내는가",
    heroSubtitle: "전후 세계의 마지막 해 — 1989년 1월 1일",
    subtitle: "1989년 1월 1일",
    description: "모든 것이 아직 서 있고, 아무것도 지탱되지 않는다. 장벽도, 바르샤바 조약도, 연방 자체도 — 모스크바가 지켜줄 것이라는 믿음만큼만 버틴다. 그리고 모스크바는 4년째 그러지 않겠다고 흘려 왔다. 베를린도 부다페스트도 프라하도 한 번씩 그 답을 몸으로 배웠다. 올해 그들이 다시 묻는다.",
    eyebrow: "냉전의 끝",
  },
  "colonial-1650": {
    name: "신대륙 — 1650",
    heroTitle: "신대륙 식민 시대",
    heroSubtitle: "돛의 제국들, 그리고 그들을 맞이한 민족들 — 1650년",
    subtitle: "1650년",
    description: "1650년. 스페인의 은 선단은 두 부왕령에서 출항하고, 포르투갈은 브라질을 두고 네덜란드와 싸우며, 공화정 잉글랜드는 매사추세츠에서 바베이도스까지 식민지를 심고, 프랑스는 세인트로렌스 강을 거슬러 모피를 사들인다. 그러나 아메리카 대부분은 여전히 처음부터 그곳에 살던 민족들의 땅이다 — 하우데노사우니, 체로키, 수, 아파치, 마야, 마푸체. 바다 건너 제국을 세우든, 그 제국을 바다로 되밀든.",
    eyebrow: "대항해 시대",
  },
  "medieval-1200": {
    name: "중세 — 1200년",
    heroTitle: "신앙과 쇠의 시대",
    heroSubtitle: "황제와 칼리프와 십자군이 한 세계를 비좁게 나눠 쓴다",
    subtitle: "1200년 무렵",
    description: "1200년, 그 무엇도 홀로 지배하지 못한다. 호엔슈타우펜 황제들과 카페 왕가가 유럽을 양쪽에서 잡아당기는 사이, 앙주 가문은 요크셔에서 피레네까지 걸친 제국을 쥐고 있다. 콘스탄티노폴리스는 아직 서 있다 — 그곳을 약탈할 십자군까지 4년. 알모하드는 마라케시에서 세비야까지, 살라딘의 후계자들은 카이로와 다마스쿠스를 다스리고, 십자군 국가들은 이제 혼자서는 지킬 수 없는 해안 띠에 몰려 있다. 더 동쪽에서는 구르 왕조가 인도로 말을 몰고, 아직 아무도 이름을 모르는 한 몽골 족장이 초원의 부족들을 하나로 묶고 있다. 왕국이든 제국이든 칼리프국이든, 그중 무엇이 살아남을지 결정할 한 세기로 끌고 가라.",
    eyebrow: "성기 중세",
  },
  "mongol-1300": {
    name: "몽골 세계 — 1300년",
    heroTitle: "몽골의 세기",
    heroSubtitle: "네 칸국이 고려에서 카르파티아까지 다스린다 — 1300년",
    subtitle: "1300년",
    description: "1300년. 칭기즈 칸의 후예들이 역사상 가장 넓은 대륙 제국을 다스린다 — 대도의 원 황제, 초원의 킵차크 칸국, 트란스옥시아나의 차가타이, 페르시아의 일 칸. 러시아 공후들과 발칸의 차르들은 조공을 바친다. 말발굽 너머에는: 맘루크 이집트는 무패로 버티고, 델리의 술탄은 인도를 정복하며, 에드워드 1세는 스코틀랜드를 두드리고, 필리프 4세는 성전기사단의 프랑스를 쥐어짜며, 어느 무명의 오스만 베그가 비잔티움 변경을 습격하고 있다. 칸국과 함께 달리든, 맞서 달리든.",
    eyebrow: "몽골의 평화",
  },
  "roman-117": {
    name: "로마 — 117년",
    heroTitle: "제국의 정점",
    heroSubtitle: "트라야누스가 죽었다. 하드리아누스가 서방 최대의 제국을 물려받는다.",
    subtitle: "117년",
    description: "117년. 로마는 대서양에서 티그리스까지 다스린다 — 다키아는 정복되었고, 아르메니아와 메소포타미아는 병합되었으며, 파르티아는 패했으되 꺾이지 않았다. 동쪽에서는 한나라 황제가 천명을 쥐고, 쿠샨의 왕들이 그 사이 비단길에 세금을 매긴다. 국경 너머엔 자유로운 민족들 — 게르마니아, 칼레도니아, 초원. 정점에 선 제국을 다스리든, 그 제국이 물러나기를 기다리는 세력이 되든.",
    eyebrow: "제정 로마",
  },
  "ww1-1914": {
    name: "제1차 세계대전 — 1914",
    heroTitle: "마지막 여름",
    heroSubtitle: "오스트리아가 세르비아에 선전포고했고, 동맹들이 당겨지기 시작한다",
    subtitle: "1914년 7월 28일",
    description: "사라예보의 총성으로부터 5주, 빈이 베오그라드에 선전포고하면서 기계가 돌기 시작한다. 러시아가 세르비아를 지키려 동원하고, 그러면 독일이 동원해야 하고, 그러면 프랑스가 동원해야 한다 — 어느 참모본부도 늦게 도착하는 것과 지는 것을 구별하지 않는다. 합스부르크·호엔촐레른·로마노프·오스만, 네 왕조 제국이 유럽 대부분을 다스리고 있고 5년 안에 전부 사라지지만 오늘 그것을 믿는 사람은 없다. 유럽 열강은 이전 어느 문명보다 넓은 땅을 쥐고 있고, 이제 그것을 전부 써버리려 한다. 그중 하나를 골라, 자기 세계를 끝장낼 전쟁으로 들어가라.",
    eyebrow: "대전쟁",
  },
  "wwii-1935": {
    name: "제2차 세계대전 — 1935 전운",
    heroTitle: "몰려오는 폭풍",
    heroSubtitle: "세계가 전쟁으로 흘러간다 — 1935년 12월 1일",
    subtitle: "1935년 12월 1일",
    description: "전차가 구르기 4년 전, 아직 모든 것이 열려 있다. 이탈리아는 아비시니아에서 국제연맹 최초의 큰 시험대를 밀어붙이고, 독일은 비무장 라인란트 뒤에서 재무장하며, 스페인 공화국은 삐걱대고, 민주국가들은 제재를 놓고 입씨름한다. 어느 나라든 맡아, 전쟁이 일어날지 그 자체를 결정할 몇 해를 지나라.",
    eyebrow: "전간기",
  },
  "millennium-2000": {
    name: "밀레니엄의 여명 — 2000",
    heroTitle: "새로운 천년",
    heroSubtitle: "세기가 바뀌고 역사가 다시 시작된다 — 2000년 1월 1일",
    subtitle: "2000년 1월 1일",
    description: "Y2K 소동은 불발로 끝났고, 닷컴 열풍은 정점을 향해 달리며, 미국은 끝나가는 줄도 모르는 일극 세계 위에 서 있다. 오늘 아침 푸틴이 크렘린을 넘겨받았다. 체첸은 불타고, 남북한은 첫 정상회담을 향해 다가서며, 유럽의 열한 개 통화는 곧 하나가 된다. 아무도 예상하지 못한 십 년을 플레이하라.",
    eyebrow: "세기의 전환",
  },
  "napoleonic-1804": {
    name: "나폴레옹 전쟁 — 1804",
    heroTitle: "제국 전야",
    heroSubtitle: "내일 나폴레옹이 스스로 관을 쓴다 — 1804년 12월 1일",
    subtitle: "1804년 12월 1일",
    description: "내일 노트르담에서 보나파르트가 스스로 황제의 관을 쓴다. 영국은 이미 전쟁 중이고, 제3차 대프랑스 동맹이 꾸려지고 있으며, 아이티의 신생 공화국에서 라호르의 시크 궁정까지 낡은 질서가 갈라지고 있다. 한 사람의 군대가 유럽을 다시 그리는 십 년 — 어느 열강이든 지휘하라. 아니면 끝내 그를 꺾을 동맹을.",
    eyebrow: "혁명기 유럽",
  },
  "victorian-1836": {
    name: "빅토리아 시대 — 1836",
    heroTitle: "증기의 시대",
    heroSubtitle: "옛 질서가 새 철로 위를 달린다 — 1836년 1월 1일",
    subtitle: "1836년 1월 1일",
    description: "알라모는 포위됐고, 그레이트 트렉의 마차는 북으로 구르며, 무함마드 알리는 수단에서 타우루스 산맥까지 다스린다. 영국의 철도와 포함은 누구도 표결한 적 없는 세계 시장을 짜고 있다. 독일도 이탈리아도 아직 존재하지 않는다. 증기가 지도 위 모든 거리를 다시 쓰던 시대 — 어느 열강이든 몰고 가라.",
    eyebrow: "산업의 시대",
  },
  "magna-1444": {
    name: "마그나 유로파 — 1444",
    heroTitle: "바르나 다음날",
    heroSubtitle: "십자군은 죽었고, 다음은 옛 세계다 — 1444년 11월 11일",
    subtitle: "1444년 11월 11일",
    description: "어제 바르나에서 왕이 죽었고 십자군도 함께 죽었다. 콘스탄티노플에 남은 시간은 아홉 해. 구텐베르크는 활자를 고르고, 캐러벨은 아프리카 해안을 더듬어 내려가며, 서울에서는 한 임금이 조용히 문자를 만들고 있다. 조선에서 카스티야까지, 어느 왕좌든 잡고 근대를 만든 다섯 세기를 플레이하라 — 무엇도 정해져 있지 않고, 모든 것이 손닿는 곳에 있다.",
    eyebrow: "그랜드 캠페인",
  },
  "wwii-1939": {
    name: "제2차 세계대전 — 1939",
    heroTitle: "폭풍이 터지다",
    heroSubtitle: "독일군 종대가 폴란드로 넘어가고, 세계가 뒤따라 들어간다",
    subtitle: "1939년 9월 1일",
    description: "새벽에 국방군이 폴란드 국경을 넘었고, 영국과 프랑스가 선전포고하기까지의 이틀이 마지막 조용한 시간이다. 일주일 전 서명된 조약은 이미 동유럽을 서류상으로 갈라놓았다 — 붉은 군대는 17일에 제 몫을 걷으러 온다. 이탈리아는 누가 이기는지 보고 고르려 기다리고, 일본은 어느 지도에도 끝이 그려지지 않은 중국에서의 전쟁 3년째이며, 미국은 모두에게 팔되 누구와도 싸우지 않을 작정이다. 연합국의 전비를 대게 될 제국들은 아직 지구의 3분의 1을 덮고 있고, 이기고도 살아남지 못한다. 아무 열강이나 골라, 인류사에서 가장 참혹한 6년으로 들어가라.",
    eyebrow: "제2차 세계대전",
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

// eyebrow joined the list when every scenario stopped sharing the same one:
// "Historical Preset" on all thirteen cards told the player nothing, so each
// scenario now names its own era and each of those needs Korean.
const FIELDS = ["name", "heroTitle", "heroSubtitle", "subtitle", "description", "eyebrow"];
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

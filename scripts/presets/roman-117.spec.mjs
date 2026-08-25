/*! Open Historia — 117 AD preset spec © 2026 Nicholas Krol, MIT (see src/Editor/LICENSE). */
// Classical preset — 117 AD (Rome at its zenith).
//
// August 117: Trajan dies at Selinus and Hadrian takes the purple. The empire
// stands at its greatest territorial extent — Dacia, Armenia and Mesopotamia
// annexed, Parthia humbled. Han China rules the far east, the Kushans bridge
// the Silk Road, and beyond the Rhine-Danube line stretch the free peoples.
// Vast tracts of the world (Germania, Sarmatia, Arabia Deserta, inner Africa,
// the Americas) belong to no state at all and are left deliberately unclaimed.

export default {
  id: "roman-117",

  meta: {
    name: "Rome — 117 AD",
    heroTitle: "The Empire at its Zenith",
    heroSubtitle: "Trajan is dead. Hadrian inherits the greatest empire the west has known.",
    eyebrow: "Imperial Rome",
    subtitle: "117 AD",
    accentColor: "#a31c1c",
    coverImage: "public/loading_screen_3.jpg",
    description:
      "The year 117. Rome rules from the Atlantic to the Tigris — Dacia conquered, Armenia " +
      "and Mesopotamia annexed, Parthia beaten but unbowed. In the east the Han emperor holds " +
      "the Mandate of Heaven and the Kushan kings tax the Silk Road between them. Beyond the " +
      "frontiers lie the free peoples: Germania, Caledonia, the steppe. Rule an empire at its " +
      "high-water mark — or the powers that wait for it to recede.",
  },

  // Player starts as Rome. game.country MUST equal the owner code.
  game: { country: "ROM", startDate: "0117-01-01", gameDate: "0117-01-01" },

  // ── Plan F: 시대 경계 그래프트 — rung-3 단독 하이브리드 (2026-08-15) ──
  // 함대의 **마지막 미선언 날짜**. 창 후보를 전부 재 봤더니 지중해권은
  // z4에서 유럽창과 같은 16타일이라 **창 선택이 공짜였다** — 그래서
  // 유럽창을 쓰지 않고 로마 세계에 맞췄다: **[-12,18,52,58]**. 서쪽으로
  // 이베리아 대서양안, 동쪽으로 페르시아만(트라야누스가 116년에 닿은
  // 카락스), 북쪽으로 하드리아누스 성벽 너머 칼레도니아, 남쪽으로 시에네
  // 아래 메로에까지. 유럽창이었다면 이집트 상류도 메소포타미아도 창 밖이다.
  //
  // rung 3 원천은 world_200(08-13 매핑 실측: 다키아가 로마령으로 그려져
  // 106년 정복 이후가 확실 — world_100은 트라야누스 이전이라 탈락).
  // rung-1(OHM 0117 조립)은 아직 없다. probe 15폴리티로 함대에서 가장 얇고,
  // 클로드 코드의 부록대로 **폴리티 수는 수율의 예측자가 아니므로** 실제
  // 수율은 추출해 봐야 안다 — 도착하면 1200처럼 파일만 갈아끼운다.
  // 전 판정 2026-08-15 포인트 테스트 실측.
  eraGeometry: {
    date: "0117-01-01",
    window: [-12, 18, 52, 58],
    file: "scripts/ohm/out/rung3-base-0117-01-01-z4-hybrid.geojson",
    excludeFaces: [
      "Dumonii", // 두므노니(브리튼 남서) — 117년엔 이미 로마 속주다(엑서터 IN·런던 out). 로스터 밖이고 ROM 기반선이 맞다
      "Boihaenum", // 보이오하이뭄(마르코만니의 보헤미아) — 제국 밖, 로스터 밖
      "Heruli", // 유틀란트 미세면, 로스터 밖
      "Bosporian Kingdom", // 판티카파이온·세바스토폴 IN — 로마 의뢰왕국이지 속주가 아니다(로스터 밖)
      "Blemmyes", // 누비아 사막 유목민 — 두 기준점 모두 out인 미세면
      "Hadramaut", // 두 기준점 모두 out(무칼라 동쪽) — 로스터 밖
      "Saka Kingdom", // 카라치 IN — 인도-스키타이/서사트라프. 보드는 PAK을 쿠샨에 근사하고, 그 근사를 이 면이 더 낫게 만들지 못한다
      "Suren Kingdom", // 자란지·칸다하르 IN — 사카스탄(파르티아 봉신). 보드의 AFG→KUSH와 어긋나지만 나라 하나를 반으로 가르느니 기반선 유지
      "Guanches", "Sámi", "Paleo-Siberian hunter-gatherers", "Finno-Ugric taiga hunter-gatherers", // 미배정 설계
      "Khoiasan", "West African cereal farmers", // 동일 — 무국가 사회
    ],
    faceOwners: {
      "Roman Empire": "ROM", // 로마·런던·안티오키아·사르미제게투사(다키아!)·페트라·아스완 IN. 알렉산드리아·비잔티온·카르타고·탕헤르가 out인 것은 라벨 거짓말이 아니라 **대륙 스케일 해안선이 도시보다 내륙에 있기 때문**이다 — 그래프트는 점이 아니라 지역 겹침으로 판정하므로 속주는 그대로 덮인다
      "Parthian Empire": "PART", // 크테시폰·엑바타나·수사 IN / 메르브·안티오키아 out
      "Armenia": "ROM", // **117년의 아르메니아는 트라야누스가 114년에 만든 속주다**(스펙 ROM 목록에 ARM이 있는 이유). 아르타샤트·예레반 IN — 다만 트빌리시까지 물어 카르틀리(IBER)는 울타리로
      "Meroe": "MERO", // 메로에·하르툼 IN / 아스완 out(로마 국경) — 정합
      "Axum": "AKSM",
      "Himyarite Kingdom": "HIMY", // 사나 IN — 다만 메카까지 물어 헤자즈는 울타리로
    },
    faceKeepOut: {
      "Armenia": ["GEO"], // 트빌리시 IN — 카르틀리는 이 보드가 IBER로 따로 그린다(로마 의뢰왕국)
      "Himyarite Kingdom": ["SAU", "OMN"], // 메카 IN — 117년 헤자즈는 나바테아(106년부터 로마령 아라비아)와 부족들의 땅이고, 사막 내지는 미배정 설계다
      "Parthian Empire": ["IRQ", "SYR", "TUR"], // **117년은 트라야누스의 메소포타미아 원정 직후**다(115~117, 크테시폰 함락 116) — 스펙이 IRQ를 ROM에 준 그 판단이 이 보드의 전제이고, 조야한 파르티아면이 그걸 되돌리게 두지 않는다. 하드리아누스가 물러나는 것은 이 보드의 첫 해에 플레이어가 내릴 결정이지 지도의 기정사실이 아니다
      "Roman Empire": ["SAU"], // 로마면 남동단이 아라비아 사막으로 번진다 — 나바테아(요르단)까지가 로마고 그 너머는 미배정
    },
  },

  // No air power in antiquity; "armor" is heavy cavalry (cataphracts), "artillery"
  // is siege engines (ballistae, onagers).
  allowedUnitTypes: ["infantry", "armor", "artillery", "naval", "garrison"],

  // Modern names are wholesale anachronistic in 117 — relabel owned countries.
  relabelOwnedCountries: true,

  polities: {
    ROM:  { name: "Roman Empire", color: "#a31c1c", aliases: ["로마 제국", "Rome", "SPQR", "the Empire"] },
    PART: { name: "Parthian Empire", color: "#8a6d3b", aliases: ["파르티아 제국", "Parthia", "Arsacids"] },
    KUSH: { name: "Kushan Empire", color: "#c07830", aliases: ["쿠샨 제국", "Kushans", "Kusana"] },
    // 117년은 후한(동한) — 표시명은 사용자 결정(결-1: "대한국" 기각, 후한 유지).
    // 大漢 규칙 예외가 아니라 시대 명칭이다: 一統 왕조 大~국 규칙은 청·명·원에만 적용.
    HAN:  { name: "Han Dynasty", color: "#b8860b", aliases: ["후한", "한나라", "Han China", "Eastern Han", "China"] },
    XION: { name: "Xiongnu", color: "#7a5c8a", aliases: ["흉노", "Northern Xiongnu", "the steppe confederacy"] },
    GOGU: { name: "Goguryeo", color: "#4a7a9a", aliases: ["고구려", "Koguryo"] },
    AKSM: { name: "Kingdom of Aksum", color: "#3f7a4f", aliases: ["악숨 왕국", "Axum", "Aksumite Empire"] },
    MERO: { name: "Kingdom of Kush", color: "#9a6a3a", aliases: ["쿠시 왕국", "Meroe", "Nubia"] },
    HIMY: { name: "Himyarite Kingdom", color: "#6a8a3a", aliases: ["힘야르 왕국", "Himyar", "Arabia Felix"] },
    ANUR: { name: "Anuradhapura", color: "#5a9a8a", aliases: ["아누라다푸라", "Ceylon", "Lanka"] },
    IBER: { name: "Kingdom of Iberia", color: "#6a9ac0", aliases: ["이베리아 왕국", "Caucasian Iberia", "Kartli"] },
    FUNA: { name: "Funan", color: "#b09a4a", aliases: ["부남", "Nokor Phnom"] },
    CALE: { name: "Caledonian Tribes", color: "#5a7a5a", aliases: ["칼레도니아 부족", "Caledonia", "the Picts' forebears"] },
  },

  countryAssignments: {
    // — The Roman world at maximum extent —
    ROM: [
      "ESP", "PRT", "FRA", "BEL", "LUX", "CHE", "ITA", "AUT", "SVN", "HRV",
      "BIH", "SRB", "MNE", "MKD", "ALB", "GRC", "BGR", "ROU", "HUN", "XKO",
      "MLT", "CYP", "TUR", "SYR", "LBN", "ISR", "PSE", "JOR", "EGY", "LBY",
      "TUN", "DZA", "MAR", "IRQ", "ARM", "GBR",
    ],
    // — The rival great powers —
    PART: ["IRN", "TKM"],
    KUSH: ["AFG", "PAK", "UZB", "TJK"],
    HAN:  ["CHN", "VNM"],               // Jiaozhi (northern Vietnam) was a Han commandery
    // — Steppe, Korea, Africa, Arabia, Ceylon, SE Asia —
    XION: ["MNG"],
    GOGU: ["PRK"],
    AKSM: ["ERI", "ETH"],
    MERO: ["SDN"],
    HIMY: ["YEM"],
    ANUR: ["LKA"],
    IBER: ["GEO"],
    FUNA: ["KHM"],
    // Everything else — Germania, Scandinavia, Sarmatia, Arabia Deserta, inner
    // Africa, India's warring kingdoms, Japan, the Americas — is unclaimed land.
  },

  regionAssignments: {
    // Caledonia: never Roman — carve Scotland out of Roman Britannia.
    "GBR.3_1": "CALE",
  },

  // Era cities: [name, modern-seed-name | [lng,lat], tier, population].
  // tier 4 = imperial capital ★, 3 = great city ◆, 2 = city, 1 = town.
  // Populations are the usual scholarly estimates for the early 2nd century.
  cities: [
    // — The Roman Empire —
    ["Roma", "Rome", 4, 1000000],
    ["Alexandria", "Alexandria", 3, 500000],
    ["Antiochia", [36.16, 36.2], 3, 250000],
    ["Carthago", [10.32, 36.85], 3, 150000],
    ["Ephesus", [27.34, 37.94], 2, 150000],
    ["Pergamum", [27.18, 39.13], 2, 120000],
    ["Smyrna", [27.14, 38.43], 2, 90000],
    ["Corinthus", [22.93, 37.94], 2, 80000],
    ["Athenae", "Athens", 2, 75000],
    ["Thessalonica", [22.94, 40.64], 2, 65000],
    ["Byzantium", "Istanbul", 2, 40000],
    ["Nicomedia", [29.92, 40.77], 2, 60000],
    ["Ancyra", "Ankara", 1, 25000],
    ["Londinium", "London", 2, 30000],
    ["Eboracum", [-1.08, 53.96], 1, 5000],
    ["Lutetia", "Paris", 1, 8000],
    ["Lugdunum", "Lyon", 2, 50000],
    ["Massilia", "Marseille", 2, 40000],
    ["Burdigala", "Bordeaux", 1, 20000],
    ["Colonia Agrippina", "Cologne", 2, 30000],
    ["Mediolanum", "Milan", 2, 40000],
    ["Ravenna", "Ravenna", 2, 20000],
    ["Aquileia", [13.37, 45.77], 2, 30000],
    ["Syracusae", [15.29, 37.07], 2, 60000],
    ["Tarraco", "Tarragona", 2, 30000],
    ["Corduba", [-4.78, 37.89], 2, 50000],
    ["Gades", [-6.29, 36.53], 2, 50000],
    ["Emerita Augusta", [-6.34, 38.92], 1, 25000],
    ["Tingis", "Tangier", 1, 15000],
    ["Volubilis", [-5.55, 34.07], 1, 12000],
    ["Leptis Magna", [14.29, 32.64], 2, 80000],
    ["Cyrene", [21.86, 32.82], 2, 50000],
    ["Memphis", [31.25, 29.85], 2, 60000],
    ["Hierosolyma", "Jerusalem", 1, 10000],
    ["Caesarea", [34.89, 32.5], 2, 45000],
    ["Damascus", "Damascus", 2, 45000],
    ["Palmyra", [38.28, 34.55], 2, 30000],
    ["Petra", [35.44, 30.32], 2, 20000],
    ["Sarmizegetusa", [22.79, 45.52], 2, 15000],
    ["Artaxata", [44.55, 39.88], 2, 30000],
    ["Ctesiphon", [44.58, 33.09], 3, 250000], // taken by Trajan, 116
    // — Parthia and the Iranian east —
    ["Ecbatana", [48.52, 34.8], 2, 60000],
    ["Susa", [48.26, 32.19], 1, 25000],
    ["Merv", [62.19, 37.66], 2, 50000],
    // — The Kushan realm and India —
    ["Purushapura", "Peshawar", 3, 100000],
    ["Taxila", [72.79, 33.74], 2, 40000],
    ["Mathura", "Mathura", 2, 60000],
    ["Pataliputra", "Patna", 3, 150000],
    ["Ujjain", "Ujjain", 2, 80000],
    ["Madurai", "Madurai", 2, 50000],
    ["Anuradhapura", "Anuradhapura", 3, 60000],
    // — Han China and East Asia —
    ["Luoyang", "Luoyang", 4, 500000],
    ["Chang'an", [108.94, 34.34], 3, 250000],
    ["Chengdu", "Chengdu", 2, 100000],
    ["Panyu", "Guangzhou", 2, 50000],
    ["Longbian", "Hanoi", 1, 20000],
    ["Gungnae", [126.19, 41.16], 2, 20000], // Goguryeo capital
    // — Africa, Arabia, the Caucasus —
    ["Meroe", [33.75, 16.94], 3, 25000],
    ["Aksum", [38.72, 14.13], 3, 20000],
    ["Zafar", [44.4, 14.21], 2, 15000], // Himyarite capital
    ["Mtskheta", [44.72, 41.84], 2, 15000], // Iberian capital
    // — Funan and the Americas —
    ["Vyadhapura", [105.15, 10.25], 2, 20000], // Funan (Oc Eo)
    ["Teotihuacan", [-98.84, 19.69], 3, 125000],
    ["Tikal", [-89.62, 17.22], 2, 40000],
    ["Monte Alban", [-96.77, 17.04], 1, 17000],
  ],

  simulationRules:
    "It is 117 AD, the high-water mark of Rome. Warfare is classical: legions and auxilia, " +
    "disciplined heavy infantry, cataphract and horse-archer cavalry, siege engines, war " +
    "galleys; there is NO gunpowder and NO air power. Trajan has just died (August 117) and " +
    "Hadrian is newly acclaimed; historically he abandoned Mesopotamia and Armenia within a " +
    "year — whether this Rome consolidates or retrenches is the player's choice. Parthia is " +
    "beaten but intact beyond the Zagros and will contest Mesopotamia. The Kitos War (Jewish " +
    "diaspora revolt, 115-117) is being suppressed in Egypt, Cyprus and Cyrenaica. Britain is " +
    "held to the Solway-Tyne line; Caledonia is free, as is all Germania beyond Rhine and " +
    "Danube, and the Sarmatian steppe. Han China under the young Emperor An rules through " +
    "regents and protects the Western Regions; the Kushans tax the Silk Road between Parthia " +
    "and Han; the Xiongnu press the steppe. Aksum and Himyar contest the Red Sea trade; Meroe " +
    "trades and skirmishes with Roman Egypt. India is a patchwork of contending kingdoms " +
    "(Satavahanas, Western Satraps, Cheras/Cholas/Pandyas) — treat it as fragmented, not " +
    "empty. Unclaimed regions are tribal or stateless lands: they can be raided, colonized or " +
    "federated but have no central government. Religion is pre-Christian: the imperial cult, " +
    "Hellenic and eastern mysteries, Zoroastrianism in Parthia, Buddhism spreading through " +
    "Kushan lands into Han China." +
    " Money is the silver denarius; state revenue is tax and the grain annona, and the legions are paid professionals whose loyalty is political power. Historical trajectories the player may bend: Hadrian's retrenchment and wall-building in Britain (122), the Antonine peace, Parthian revanche, the eventual crisis of succession. MAP APPROXIMATIONS: provinces are drawn on modern regions — client kingdoms (Armenia, Osroene, the Bosporan realm) are Roman-aligned but not Roman; newly annexed Mesopotamia and Dacia are unconsolidated conquests; the limes is a garrisoned road, not a wall of color.",

  startingTimelineText:
    "August, 117 AD. Word races along the imperial post roads: Trajan, Optimus Princeps, " +
    "conqueror of Dacia and Ctesiphon, is dead at Selinus in Cilicia. In Antioch the armies " +
    "hail his ward Hadrian as emperor. The empire he inherits has never been larger — the " +
    "eagle standards stand on the Tigris, in Armenia, on the Dacian gold fields — and never " +
    "more overstretched. Mesopotamia seethes, the Jewish revolt smolders from Cyrene to " +
    "Cyprus, and the legions watch the Parthian king gather his cataphracts for a reckoning. " +
    "Far to the east, the boy-emperor of Han rules through his regents while the Kushan lords " +
    "of the Silk Road grow rich carrying silk west and gold east. Beyond every frontier wait " +
    "the free peoples — Germans, Sarmatians, Caledonians — patient as winter. An age of " +
    "marble and iron reaches its noon; what follows noon is the emperor's to decide.",
};

/*! Open Historia — The New Order 1962 scenario preset © 2026 Nicholas Krol, MIT (see src/Editor/LICENSE). */
// THE NEW ORDER: LAST DAYS OF EUROPE — 1 January 1962.
//
// The highest-round preset in the original that we had no answer to (857K).
// Read off its own page on 2026-08-10. What that page actually is, measured:
// 449,000 characters. A 414-entry dated timeline from 1924 to 1961, then an
// encyclopedia of 181 ideologies and economic systems each with its own
// ~1,500-character definition, then 41 country summaries — of which 31 are
// Russian warlord states — then the proxy-war contract, the Russian anarchy
// rules, and the alliance charters.
//
// WE DO NOT PORT THE ENCYCLOPEDIA. Two reasons, and only one of them is size.
// The first is that 270,000 characters of ideology prose cannot fit a 12B's
// context beside a board this wide. The second is the A/B we ran yesterday
// (docs/analysis/contract-ab-2026-08-09.md): a clause buried in a long block
// performs WORSE than the same clause standing alone. An encyclopedia is the
// pathological case of that finding. So the ideology system is ported as a
// MECHANIC — every polity carries an ideology label, labels are mutable, and a
// change caused by an event or a player action must be enforced in world state
// — and the 181 definitions are left where they are.
//
// WHAT WE DO PORT, because these are rules and not prose:
//   · the three-bloc structure (Einheitspakt / Co-Prosperity Sphere / OFN) and
//     the Mediterranean Triumvirate that sits outside all three;
//   · the proxy-war contract — long, multi-combatant, no surrender while one
//     tile remains, never escalates to global war, one event per turn minimum;
//   · the Russian anarchy — four regional tags, no diplomacy inside them, and
//     the Smuta dates on which each region's warlords may begin fighting;
//   · Germany's succession crisis as the board's clock.
//
// historicalPrior IS OFF: the divergence is 1937 and everything after it in the
// real record is wrong here. scheduledEvents STAYS ON, unlike Kaiserreich — the
// original prints the four Smuta dates in its own rules, so a calendar card
// carrying them leaks nothing the board is not already telling everyone.
//
// THE RUSSIAN MAP IS OURS, NOT THEIRS. The original draws 31 warlords on a grid
// finer than oblasts. We have GADM level-1: 83 Russian regions. Each warlord is
// anchored on the oblast its NAME states (Komi, Vologda, Vyatka, Kemerovo,
// Magadan…), and the handful whose names carry no oblast are placed by us and
// marked below. The point that must survive is that Russia is not a country on
// this map — it is thirty-one armies.

export default {
  id: "tno-1962",

  meta: {
    name: "The New Order — 1962",
    heroTitle: "The Last Days of Europe",
    heroSubtitle: "Germany won, and has been losing ever since — 1 January 1962",
    eyebrow: "냉전의 다른 얼굴",
    subtitle: "1 January 1962",
    accentColor: "#5a3a3a",
    coverImage: "public/loading_screen_2.jpg",
    description:
      "The Reich reached Astrakhan and has spent twenty years discovering that " +
      "holding a continent is not the same as taking one. Hitler is dying and " +
      "four men are counting the days. Japan owns an ocean and the resistance " +
      "inside it. America has the bomb, the money, and a country that cannot " +
      "agree on who is a citizen. And beyond the Urals there is no Russia — " +
      "there are thirty-one armies, each certain it is the one.",
  },

  relabelOwnedCountries: false,
  unassignedKeepModernOwner: true,

  // The divergence is 1937 and the twenty-five years after it are not ours.
  historicalPrior: false,

  // The player is an American — the outsider's seat on a board whose two other
  // superpowers are the ones that won. The original's own framing: "the fight
  // is decided at home, and could change everything."
  game: { country: "USA", startDate: "1962-01-01", gameDate: "1962-01-01" },

  polities: {
    // ── 초강대국 셋 ───────────────────────────────────────────────────────────
    USA: { name: "United States of America", color: "#3f6fd0", aliases: ["미국", "United States", "America", "Washington", "OFN", "Organization of Free Nations"] },
    GER: { name: "Großgermanische Reich", color: "#4a4a55", aliases: ["대게르만국", "Greater Germanic Reich", "Germany", "Berlin", "Einheitspakt", "제3제국"] },
    JAP: { name: "Dai-Nippon Teikoku", color: "#b23b3b", aliases: ["대일본제국", "Empire of Japan", "Tokyo", "Co-Prosperity Sphere", "대동아공영권"] },

    // ── 아인하이츠팍트: 독일이 유럽에 세운 것 ─────────────────────────────────
    // 라이히스코미사리아트 — 총독령. 나라가 아니라 관리 구역이고, 그 사실이
    // 이 보드에서 가장 자주 문제를 일으킨다.
    RKO: { name: "Reichskommissariat Ostland", color: "#6a6a7a", aliases: ["오스틀란트", "Ostland", "Riga", "Baltic"] },
    RKU: { name: "Reichskommissariat Ukraine", color: "#7a7a5a", aliases: ["우크라이나 총독령", "RK Ukraine", "Kyiv", "Rivne"] },
    RKM: { name: "Reichskommissariat Moskowien", color: "#5a5a6a", aliases: ["모스코비엔", "Moskowien", "Moscow", "A-A Line", "서러시아 총독령"] },
    RKK: { name: "Reichskommissariat Kaukasien", color: "#8a6a5a", aliases: ["캅카스 총독령", "Kaukasien", "Tiflis", "Baku"] },
    RKT: { name: "Reichskommissariat Turkestan", color: "#9a8a6a", aliases: ["투르케스탄 총독령", "Turkestan", "Central Asia"] },
    RKN: { name: "Reichskommissariat Norwegen", color: "#7a8a9a", aliases: ["노르웨이 총독령", "RK Norwegen", "Oslo", "Terboven"] },
    RKD: { name: "Reichskommissariat Niederlande", color: "#c07a3a", aliases: ["네덜란드 총독령", "RK Niederlande", "Amsterdam"] },
    BUR: { name: "Burgundian System", color: "#2e2e38", aliases: ["부르군트", "Burgundy", "Burgund", "SS-Staat", "Himmler", "Brussels"] },
    FRS: { name: "French State", color: "#8a8a9a", aliases: ["프랑스국", "French State", "Vichy", "Etat Francais", "Paris"] },
    // 아프리카 총독령 셋. 원본이 이 셋을 따로 요약한다.
    RKZ: { name: "Reichskommissariat Zentralafrika", color: "#6a7a5a", aliases: ["중앙아프리카 총독령", "Zentralafrika", "Congo", "Leopoldville"] },
    RKE: { name: "Reichskommissariat Ostafrika", color: "#7a8a6a", aliases: ["동아프리카 총독령", "Ostafrika", "Nairobi"] },
    RKS: { name: "Reichskommissariat Südwestafrika", color: "#8a8a6a", aliases: ["남서아프리카 총독령", "Südwestafrika", "Windhoek"] },
    // 팍트 회원국 — 총독령이 아니라 이름뿐인 주권을 가진 나라들.
    FIN: { name: "Finland", color: "#7a9aba", aliases: ["핀란드", "Finland", "Helsinki", "Karelia"] },
    SWE: { name: "Sweden", color: "#5a7a9a", aliases: ["스웨덴", "Sweden", "Stockholm"] },
    DAN: { name: "Denmark", color: "#8a5f6d", aliases: ["덴마크", "Denmark", "Copenhagen"] },
    HUN: { name: "Hungary", color: "#9a7a4a", aliases: ["헝가리", "Hungary", "Budapest"] },
    ROM: { name: "Romania", color: "#a08a4a", aliases: ["루마니아", "Romania", "Bucharest"] },
    BUL: { name: "Bulgaria", color: "#8a9a6a", aliases: ["불가리아", "Bulgaria", "Sofia"] },
    SLK: { name: "Slovakia", color: "#8a7a9a", aliases: ["슬로바키아", "Slovakia", "Bratislava"] },
    CRO: { name: "Independent State of Croatia", color: "#9a6a6a", aliases: ["크로아티아 독립국", "Croatia", "NDH", "Zagreb", "Ustase"] },
    SER: { name: "Government of National Salvation", color: "#7a6a5a", aliases: ["세르비아 구국정부", "Serbia", "Belgrade", "Nedic"] },
    GRE: { name: "Greece", color: "#6a8aaa", aliases: ["그리스", "Greece", "Athens"] },
    GBR: { name: "United Kingdom", color: "#7a5a6a", aliases: ["영국", "United Kingdom", "Britain", "London", "부역 정부"] },

    // ── 지중해 삼두: 어느 블록에도 속하지 않은 유일한 축 ──────────────────────
    IBR: { name: "Iberian Union", color: "#d0a02e", aliases: ["이베리아 연합", "Iberian Union", "Spain", "Portugal", "Madrid", "Lisbon"] },
    ITA: { name: "Regno d'Italia", color: "#4f7942", aliases: ["이탈리아 왕국", "Kingdom of Italy", "Rome", "Italy"] },
    TUR: { name: "Republic of Türkiye", color: "#c05a4a", aliases: ["튀르키예 공화국", "Turkey", "Ankara", "Kemalist"] },

    // ── 대동아공영권 ──────────────────────────────────────────────────────────
    MCK: { name: "Manchukuo", color: "#c9a05a", aliases: ["만주국", "Manchukuo", "Hsinking", "Xinjing"] },
    // 남경 정부. 키를 "Republic of China"로 쓰면 leaderReference의 장제스 항목을
    // 덮어써 역사 보드가 깨진다 — 카이저라이히에서 한 번 밟은 함정이다.
    NAN: { name: "Nanjing Government", color: "#4a6db5", aliases: ["남경 정부", "Nanjing", "Reorganized Government", "Republic of China (Nanjing)", "Wang Jingwei"] },
    MEN: { name: "Mengjiang", color: "#a89a6a", aliases: ["몽강", "Mengjiang", "Inner Mongolia", "Kalgan"] },
    GUA: { name: "Guangdong Clique", color: "#8a9a4a", aliases: ["광둥 군벌", "Guangdong", "Canton", "Chinese Warlord"] },
    SHX: { name: "Shanxi Clique", color: "#7d8f5a", aliases: ["산시 군벌", "Shanxi", "Yan Xishan", "Chinese Warlord"] },
    MAC: { name: "Ma Clique", color: "#a8946a", aliases: ["마가군벌", "Ma Clique", "Qinghai", "Ningxia", "Chinese Warlord"] },
    XIN: { name: "Xinjiang Clique", color: "#6f8f7a", aliases: ["신장 군벌", "Xinjiang", "Urumqi", "Chinese Warlord"] },
    TIB: { name: "Tibet", color: "#c8c0a0", aliases: ["티베트", "Tibet", "Lhasa"] },
    SIA: { name: "Thailand", color: "#b08a5a", aliases: ["태국", "Thailand", "Siam", "Bangkok"] },
    // 원본이 이 보드의 대리전 하나로 명시하는 말라야 비상사태의 두 당사자.
    SHO: { name: "Military Governate of Shonan Marai", color: "#9a5a5a", aliases: ["쇼난 군정", "Shonan", "Malaya", "Singapore", "Japanese Malaya"] },
    UMA: { name: "United Malayan Anti-Japanese Front", color: "#c04040", aliases: ["말라야 항일전선", "UMAJF", "Malayan Emergency", "게릴라"] },

    // ── 인도아대륙: 라지가 무너진 자리 ────────────────────────────────────────
    RAJ: { name: "Princely Federation of India", color: "#c07a8a", aliases: ["인도 번왕국 연방", "Princely Federation", "Delhi", "India"] },
    BHC: { name: "Bharatiya Commune", color: "#b03838", aliases: ["바라티야 코뮌", "Bharatiya Commune", "Indian Commune", "남인도"] },
    PAK: { name: "Pakistan", color: "#5a8a6a", aliases: ["파키스탄", "Pakistan", "Karachi"] },

    // ── 자유국가기구(OFN): 미국이 남겨 둔 세계 ────────────────────────────────
    CAN: { name: "Dominion of Canada", color: "#c05a6a", aliases: ["캐나다 자치령", "Canada", "Ottawa", "망명 영국 왕실", "Exiled Crown"] },
    MEX: { name: "Mexico", color: "#4a8f7a", aliases: ["멕시코", "Mexico", "Mexico City", "중재자"] },
    BRA: { name: "United States of Brazil", color: "#5a9a6a", aliases: ["브라질 합중국", "Brazil", "Rio de Janeiro", "Brasilia"] },
    ARG: { name: "Argentina", color: "#6a9aba", aliases: ["아르헨티나", "Argentina", "Buenos Aires"] },
    CHI: { name: "Chile", color: "#8a6a9a", aliases: ["칠레", "Chile", "Santiago"] },
    ZAF: { name: "Union of South Africa", color: "#a08a5a", aliases: ["남아프리카 연방", "South Africa", "Pretoria", "보어"] },

    // ══ 러시아 아나키 ═══════════════════════════════════════════════════════
    // 원본이 31개 군벌을 하나씩 요약한다. 이 보드의 무게중심이다. 각 군벌은
    // 네 지역 태그 중 하나를 갖고, 같은 태그를 가진 상대하고만 싸울 수 있다.

    // ── 서러시아 (Smuta 1964-03-01) ───────────────────────────────────────────
    WRF: { name: "West Russian Revolutionary Front", color: "#a03030", aliases: ["서러시아 혁명전선", "WRRF", "Front", "Soviet remnant", "West Russia"] },
    KOM: { name: "Komi Republic", color: "#7a9a8a", aliases: ["코미 공화국", "Komi", "Syktyvkar", "West Russia"] },
    GOR: { name: "Military Control Commission in Gorky", color: "#6a6a8a", aliases: ["고리키 군사통제위원회", "Gorky", "Chernyakhovsky", "Nizhny Novgorod", "West Russia"] },
    VOL: { name: "Neutral State of Vologda", color: "#8a9aaa", aliases: ["볼로그다 중립국", "Vologda", "West Russia"] },
    ARY: { name: "Aryan Brotherhood", color: "#3a3a3a", aliases: ["아리아 형제단", "Aryan Brotherhood", "West Russia"] },
    VYA: { name: "Principality of Vyatka", color: "#9a7a5a", aliases: ["뱌트카 공국", "Vyatka", "Kirov", "West Russia"] },
    KON: { name: "Committee for the Liberation of the Peoples of Russia", color: "#8a8a5a", aliases: ["러시아 제민족해방위원회", "KONR", "Vlasov", "Samara", "West Russia"] },
    OSG: { name: "Order of Saint George", color: "#9a8a9a", aliases: ["성 게오르기 기사단", "Order of Saint George", "Orenburg", "West Russia"] },
    BAS: { name: "Republic of Bashkortostan", color: "#6a8a5a", aliases: ["바시코르토스탄 공화국", "Bashkortostan", "Ufa", "West Russia"] },
    TAT: { name: "Tatar Republic", color: "#5a8a8a", aliases: ["타타르 공화국", "Tatar Republic", "Kazan", "West Russia"] },

    // ── 서시베리아 (Smuta 1963-11-01) ─────────────────────────────────────────
    URA: { name: "Ural Military District", color: "#6a6a6a", aliases: ["우랄 군관구", "Ural Military District", "Sverdlovsk", "Western Siberia"] },
    ZLA: { name: "Zlatoust Republic", color: "#8a7a6a", aliases: ["즐라토우스트 공화국", "Zlatoust", "Chelyabinsk", "Western Siberia"] },
    YUG: { name: "Thief Territory of Yugra", color: "#5a5a5a", aliases: ["유그라 도적 영지", "Yugra", "Khanty-Mansiysk", "Western Siberia"] },
    AVI: { name: "Free Aviators", color: "#7a8aaa", aliases: ["자유 비행사단", "Free Aviators", "Yamal", "Western Siberia"] },
    WSP: { name: "West Siberian Peoples Republic", color: "#8a9a5a", aliases: ["서시베리아 인민공화국", "Tyumen", "Western Siberia"] },
    OMS: { name: "Provisional Authority of Omsk", color: "#9a9a7a", aliases: ["옴스크 임시정청", "Omsk", "Western Siberia"] },
    VOR: { name: "Vorkuta Corrective Labour Camp", color: "#4a4a4a", aliases: ["보르쿠타 교정노동수용소", "Vorkuta", "Gulag", "West Russia"] },

    // ── 중앙시베리아 (Smuta 1963-05-01) ───────────────────────────────────────
    CSR: { name: "Central Siberian Republic", color: "#7a9a9a", aliases: ["중앙시베리아 공화국", "Tomsk", "Central Siberia"] },
    NOV: { name: "Federation of Novosibirsk and Altay", color: "#6a9a8a", aliases: ["노보시비르스크-알타이 연방", "Novosibirsk", "Altay", "Central Siberia"] },
    KEM: { name: "Principality of Kemerovo", color: "#9a6a7a", aliases: ["케메로보 공국", "Kemerovo", "Central Siberia"] },
    KRA: { name: "Provisional Government of Krasnoyarsk", color: "#8a8a9a", aliases: ["크라스노야르스크 임시정부", "Krasnoyarsk", "Central Siberia"] },
    OYR: { name: "Karakorum Government of Oyrotia", color: "#a09a6a", aliases: ["오이로티아 카라코룸 정부", "Oyrotia", "Gorno-Altay", "Central Siberia"] },
    SBL: { name: "Siberian Black League", color: "#2e2e2e", aliases: ["시베리아 흑색동맹", "Black League", "Khakassia", "Central Siberia"] },
    SBA: { name: "Siberian Black Army", color: "#3a3a2e", aliases: ["시베리아 흑군", "Black Army", "Tuva", "Central Siberia"] },

    // ── 동시베리아 (Smuta 1963-04-01) ─────────────────────────────────────────
    PSS: { name: "Presidium of the Supreme Soviet", color: "#a03838", aliases: ["최고소비에트 간부회", "Presidium", "Irkutsk", "Eastern Siberia"] },
    BUY: { name: "Buryat Autonomous Soviet Socialist Republic", color: "#8a5a5a", aliases: ["부랴트 자치소비에트공화국", "Buryatia", "Ulan-Ude", "Eastern Siberia"] },
    TRB: { name: "Transbaikal Principality", color: "#9a8a7a", aliases: ["자바이칼 공국", "Transbaikal", "Chita", "Eastern Siberia"] },
    AMU: { name: "All-Russian Government of Amur", color: "#7a7a9a", aliases: ["전러시아 아무르 정부", "Amur", "Blagoveshchensk", "Eastern Siberia"] },
    MAG: { name: "Free State of Magadan", color: "#6a8a9a", aliases: ["자유 마가단국", "Magadan", "Eastern Siberia"] },
    SAK: { name: "Sakha Republic", color: "#8a9a8a", aliases: ["사하 공화국", "Sakha", "Yakutia", "Yakutsk", "Eastern Siberia"] },
    PRC: { name: "People's Revolutionary Council", color: "#9a4a4a", aliases: ["인민혁명평의회", "Revolutionary Council", "Chukotka", "Eastern Siberia"] },
    SPF: { name: "Soviet Pacific Fleet", color: "#4a6a8a", aliases: ["소비에트 태평양함대", "Pacific Fleet", "Kamchatka", "Petropavlovsk", "Eastern Siberia"] },
  },

  countryAssignments: {
    // ── 제국 본토와 총독령 ────────────────────────────────────────────────────
    GER: ["DEU", "AUT", "CZE", "POL", "SVN", "LUX"],
    BUR: ["BEL"],
    RKD: ["NLD"],
    RKN: ["NOR"],
    RKO: ["EST", "LVA", "LTU", "BLR"],
    RKU: ["UKR", "MDA"],
    RKK: ["GEO", "ARM", "AZE"],
    RKT: ["KAZ", "UZB", "TKM", "TJK", "KGZ"],
    FRS: ["FRA", "DZA", "MAR", "SEN", "MLI", "NER", "BFA", "CIV", "GIN", "BEN", "MRT", "TGO"],
    // 아프리카 총독령. 벨기에령 콩고와 영국·포르투갈령 대부분이 여기로 넘어갔다.
    RKZ: ["COD", "COG", "CAF", "CMR", "GAB", "GNQ", "TCD", "AGO", "ZMB", "MWI"],
    RKE: ["KEN", "UGA", "TZA", "RWA", "BDI", "MOZ"],
    RKS: ["NAM", "BWA"],
    // 팍트 회원국.
    FIN: ["FIN"],
    SWE: ["SWE"],
    DAN: ["DNK", "ISL", "FRO", "GRL"],
    HUN: ["HUN"],
    ROM: ["ROU"],
    BUL: ["BGR", "MKD"],
    SLK: ["SVK"],
    CRO: ["HRV", "BIH"],
    SER: ["SRB", "MNE", "XKO"],
    GRE: ["GRC"],
    GBR: ["GBR", "NGA", "GHA", "SLE", "GMB"],
    // ── 지중해 삼두 ───────────────────────────────────────────────────────────
    IBR: ["ESP", "PRT", "ESH", "GNB", "CPV", "STP", "AND"],
    ITA: ["ITA", "LBY", "ETH", "ERI", "SOM", "DJI", "ALB", "EGY", "SDN", "TUN", "MLT"],
    TUR: ["TUR", "SYR", "LBN", "IRQ", "JOR", "ISR", "PSE", "CYP"],
    // ── 대동아공영권 ──────────────────────────────────────────────────────────
    // 일본은 러시아 극동 연안도 쥐고 있다 — 지역 배정에서 떼어 준다.
    JAP: ["JPN", "KOR", "PRK", "TWN", "PHL", "VNM", "LAO", "KHM", "IDN", "BRN", "TLS", "MMR"],
    MCK: ["MNG"],
    SIA: ["THA"],
    SHO: ["MYS", "SGP"],
    // ── 인도아대륙 ────────────────────────────────────────────────────────────
    RAJ: ["IND", "NPL", "BTN"],
    PAK: ["PAK", "AFG", "BGD"],
    BHC: ["LKA"],
    // ── OFN ───────────────────────────────────────────────────────────────────
    USA: ["USA", "PRI", "VIR", "GUM"],
    CAN: ["CAN", "BHS", "JAM", "TTO", "BRB", "GUY", "BLZ"],
    MEX: ["MEX"],
    BRA: ["BRA"],
    ARG: ["ARG", "URY", "PRY"],
    CHI: ["CHL"],
    ZAF: ["ZAF", "LSO", "SWZ", "ZWE"],
    // ── 중국 ──────────────────────────────────────────────────────────────────
    // 중국 전체를 남경에 주고, 아래에서 만주국과 군벌들이 떼어 간다.
    NAN: ["CHN"],
    // ── 러시아 ────────────────────────────────────────────────────────────────
    // 러시아 전체를 모스코비엔에 주고, 아래에서 31개 군벌이 떼어 간다.
    // A-A선 서쪽만 실제로 독일 것이고 나머지는 전부 되찾긴다.
    RKM: ["RUS"],
  },

  regionAssignments: {
    // ══ 러시아: A-A선 동쪽의 서른한 군대 ═══════════════════════════════════
    // 카렐리아와 콜라는 핀란드가 가져갔다. 원본이 팍트 안에서 핀란드에 준 몫이다.
    "RUS.26_1": "FIN", "RUS.45_1": "FIN",

    // ── 서러시아 ──────────────────────────────────────────────────────────────
    "RUS.32_1": "KOM",                                        // 코미
    "RUS.46_1": "VOR",                                        // 네네츠 — 수용소 군도의 북쪽 끝
    "RUS.78_1": "VOL",                                        // 볼로그다
    "RUS.47_1": "GOR", "RUS.41_1": "GOR",                     // 니제고로드·마리엘
    "RUS.31_1": "VYA", "RUS.74_1": "VYA",                     // 키로프·우드무르트
    "RUS.13_1": "WRF", "RUS.42_1": "WRF", "RUS.54_1": "WRF",  // 추바시·모르도바·펜자
    "RUS.68_1": "TAT",                                        // 타타르스탄
    "RUS.6_1": "BAS",                                         // 바시코르토스탄
    "RUS.75_1": "ARY",                                        // 울리야놉스크 — 우리 배치
    "RUS.62_1": "KON", "RUS.63_1": "KON",                     // 사마라·사라토프
    "RUS.53_1": "OSG",                                        // 오렌부르크 — 우리 배치

    // ── 서시베리아 ────────────────────────────────────────────────────────────
    "RUS.66_1": "URA", "RUS.55_1": "URA",                     // 스베르들롭스크·페름
    "RUS.11_1": "ZLA",                                        // 첼랴빈스크
    "RUS.30_1": "YUG",                                        // 한티만시
    "RUS.80_1": "AVI",                                        // 야말네네츠
    "RUS.73_1": "WSP", "RUS.36_1": "WSP",                     // 튜멘·쿠르간
    "RUS.51_1": "OMS",                                        // 옴스크

    // ── 중앙시베리아 ──────────────────────────────────────────────────────────
    "RUS.69_1": "CSR",                                        // 톰스크
    "RUS.50_1": "NOV", "RUS.2_1": "NOV",                      // 노보시비르스크·알타이
    "RUS.27_1": "KEM",                                        // 케메로보
    "RUS.35_1": "KRA",                                        // 크라스노야르스크
    "RUS.16_1": "OYR",                                        // 고르노알타이
    "RUS.29_1": "SBL",                                        // 하카시야
    "RUS.71_1": "SBA",                                        // 투바

    // ── 동시베리아 ────────────────────────────────────────────────────────────
    "RUS.18_1": "PSS",                                        // 이르쿠츠크
    "RUS.9_1": "BUY",                                         // 부랴트
    "RUS.83_1": "TRB",                                        // 자바이칼
    "RUS.3_1": "AMU", "RUS.82_1": "AMU",                      // 아무르·유대인 자치주
    "RUS.40_1": "MAG",                                        // 마가단
    "RUS.60_1": "SAK",                                        // 사하
    "RUS.12_1": "PRC",                                        // 추코트 — 우리 배치
    "RUS.24_1": "SPF",                                        // 캄차카 — 함대가 항구를 쥐고 있다
    // 일본이 쥔 극동 연안.
    "RUS.56_1": "JAP", "RUS.28_1": "JAP", "RUS.61_1": "JAP",  // 프리모리예·하바롭스크·사할린

    // ══ 중국: 공영권의 안쪽 ═════════════════════════════════════════════════
    // 성 단위 키가 지급시로 확장된다(lib/level2Expansion.mjs).
    "CHN.18_1": "MCK", "CHN.17_1": "MCK", "CHN.11_1": "MCK",  // 랴오닝·지린·헤이룽장
    "CHN.19_1": "MEN",                                        // 네이멍구
    "CHN.25_1": "SHX",                                        // 산시
    "CHN.28_1": "XIN",                                        // 신장
    "CHN.29_1": "TIB",                                        // 시짱
    "CHN.21_1": "MAC", "CHN.20_1": "MAC", "CHN.5_1": "MAC",   // 칭하이·닝샤·간쑤
    "CHN.6_1": "GUA", "CHN.7_1": "GUA", "CHN.9_1": "GUA",     // 광둥·광시·하이난

    // ══ 인도: 라지가 남긴 조각들 ════════════════════════════════════════════
    // 남부는 코뮌이, 북부는 번왕국 연방이 쥐었다. 실제 경계는 주계를 따르지
    // 않지만 이 보드에서 중요한 것은 인도가 하나가 아니라는 사실이다.
    "IND.16_1": "BHC",  // 카르나타카
    "IND.17_1": "BHC",  // 케랄라
    "IND.31_1": "BHC",  // 타밀나두
    "IND.2_1": "BHC",   // 안드라프라데시
    "IND.32_1": "BHC",  // 텔랑가나

    // ══ 말라야 비상사태 ═════════════════════════════════════════════════════
    // UMAJF는 항구 하나를 쥐고 있다. 원본의 규칙: 두 번째 해안 프로빈스를
    // 확보하기 전까지 미국은 의용군을 보낼 수 없다. 그 항구가 여기다.
    "MYS.8_1": "UMA",   // 파항 — 반군이 쥔 해안
  },

  simulationRules:
    "It is 1 January 1962 in a world where Germany won the Second World War and " +
    "has spent twenty years failing to hold what it took. " +

    "THE DIVERGENCE. History runs as it really did until 1937. From there the " +
    "Axis wins: the Soviet Union collapses under invasion and is partitioned to " +
    "the Arkhangelsk-Astrakhan line, Britain surrenders and its Crown and fleet " +
    "flee to Canada, Japan takes the Pacific and nukes Pearl Harbor, and the " +
    "United States signs an armistice and goes home. Do not import the real " +
    "post-1945 world: there is no United Nations, no NATO, no Warsaw Pact, no " +
    "Israel as we know it, no decolonisation, no Soviet Union. Where a real " +
    "person of the period would plausibly still be alive, they hold the position " +
    "THIS world would have given them. " +

    "THE THREE SUPERPOWERS AND THE FOURTH THING. The EINHEITSPAKT is Berlin's " +
    "European order — the Reichskommissariate, the puppet kingdoms and the " +
    "Burgundian System, all of it built in German interest. The CO-PROSPERITY " +
    "SPHERE is Tokyo's: Manchukuo and Nanjing on its governing council, the rest " +
    "colonies in all but name. The ORGANIZATION OF FREE NATIONS is Washington's " +
    "answer, and it is an alliance of the states nobody conquered rather than a " +
    "bloc of the willing. Outside all three sits the MEDITERRANEAN TRIUMVIRATE — " +
    "the Iberian Union, the Kingdom of Italy and the Republic of Türkiye — which " +
    "wrestled itself free of the Reich's grip and is held together by nothing but " +
    "the fear of falling back into it. " +

    "GERMANY IS DYING AT THE TOP AND THIS IS THE BOARD'S CLOCK. Adolf Hitler is " +
    "alive, senile and no longer governing. Four men are positioning for the " +
    "succession — the technocrat, the party man, the Luftwaffe marshal and the " +
    "SS — and the Reich's institutions are already acting as four rival states. " +
    "The military is a bloated corpse, the economy is propped up by plunder that " +
    "has run out, and every Reichskommissariat is quietly asking who it will " +
    "answer to. Nothing about the succession is settled and it must not be " +
    "narrated as though it were. " +

    "RUSSIA IS NOT A COUNTRY. Beyond the German line there are thirty-one armed " +
    "governments and every one of them intends to reunify Russia. They are " +
    "grouped into four regions — WEST RUSSIA, WESTERN SIBERIA, CENTRAL SIBERIA, " +
    "EASTERN SIBERIA — and the following rules govern them absolutely: " +
    "(1) a warlord may only make war on warlords sharing its region tag, never " +
    "on a polity outside its region; " +
    "(2) inside the anarchy there is no diplomacy. There are no requests, only " +
    "demands; no embassies, only armies; no protests, only bullets. Do not write " +
    "warlord summits, treaties or notes of protest; " +
    "(3) outside nations do not care about individual warlords and will not " +
    "communicate with or interfere with them until one has unified its whole " +
    "region and become a REGIONAL POWER. Only then does foreign aid and outside " +
    "diplomacy begin; " +
    "(4) a warlord may not expand into another region before unifying its own; " +
    "(5) the SMUTA — the time of troubles, when warlords may begin fighting to " +
    "unify — starts on a different date in each region: Eastern Siberia on " +
    "1 April 1963, Central Siberia on 1 May 1963, Western Siberia on " +
    "1 November 1963, West Russia on 1 March 1964. Before a region's date its " +
    "warlords consolidate, arm and posture; they do not conquer each other. " +
    "Once it begins there must be at least one event per turn on that region's " +
    "progress. The exception to all of the above is a warlord the player has " +
    "taken, who is bound by the same map but not by the silence. " +

    "PROXY WARS ARE THE ONLY WARS THIS COLD WAR HAS, and they run by contract: " +
    "they are long — months, often years; they always have multiple combatants; " +
    "a participant surrenders only when EVERY tile it holds is gone, and fights " +
    "on from a single one; participants are poor and unstable because the war " +
    "eats the industry; they live on outside aid, and factions that share their " +
    "ideology or have a motive supply it; superpower involvement is deniable and " +
    "stays deniable. A proxy war NEVER escalates into a global conflict — that " +
    "is the point of a proxy. And every proxy war produces at least one event per " +
    "turn with tangible progress on the map. The one running at game start is the " +
    "MALAYAN EMERGENCY: the UMAJF holds a single port against the Military " +
    "Governate of Shonan Marai, and until it takes a second coastal province the " +
    "United States can send equipment, training and air support but not " +
    "volunteers. Whoever supplies more, wins. " +

    "IDEOLOGY IS A PROPERTY OF A STATE AND IT CHANGES. Every polity here has one " +
    "— communist, socialist, progressive, liberal, conservative, paternalist, " +
    "despotic, ultranationalist, fascist, national socialist — and a scripted " +
    "event or a player action can change it. When it changes, the change is real: " +
    "enforce it in the world state, in the polity's behaviour and in its " +
    "alliances. Never let a nation keep acting on an ideology it has abandoned. " +

    "AMERICA'S WAR IS AT HOME. The United States has the bomb, the money and the " +
    "OFN, and it also has segregation, a hollowed-out interior and a public that " +
    "increasingly blames its own government for the armistice. Washington's " +
    "foreign schemes are real, but the board's American thread is domestic and " +
    "the player should feel it every turn. " +

    "Technology and economy are those of 1962 in a world without a Marshall Plan " +
    "and without a Soviet Union: jets and early missiles, atomic weapons held by " +
    "three powers, television in the rich countries, computers the size of rooms, " +
    "and colonial empires that never ended. The map approximates control with " +
    "modern administrative regions.",

  startingTimelineText:
    "1 January 1962. In Berlin an old man is carried between rooms he no longer recognises, " +
    "and four of his subordinates run four foreign policies in his name. From the Rhine to " +
    "the Volga the Reich's writ is enforced by garrisons it cannot pay and railways it cannot " +
    "repair. Tokyo counts an ocean of colonies and the guerrillas inside them. Washington has " +
    "the strongest economy on earth and cannot agree who may sit at its lunch counters. Rome, " +
    "Madrid and Ankara have made a triumvirate out of mutual distrust and call it independence. " +
    "And past the Urals, in the place where Russia used to be, thirty-one warlords spend the " +
    "winter arming — because each of them knows that the year the fighting starts is the year " +
    "one of them becomes Russia.",
};

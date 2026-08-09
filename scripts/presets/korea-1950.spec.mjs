/*! Open Historia — 1950 scenario preset © 2026 Nicholas Krol, MIT (see src/Editor/LICENSE). */
// 1950 — 1 January 1950. Six months before Korea.
//
// The first of the scenarios written to fill our own timeline's hole: the fleet
// jumped 1946 → 2000 with fifty-four years between them, and the original's
// high-round presets sit exactly in that gap (1950 636K, 1989 550K, 2026 11M).
// See docs/analysis/presets-original.md — the 2026-08-09 re-survey.
//
// The start date is the original's, and it is the better one: on 1 January the
// war is six months away and NOT yet inevitable. That is the same design as our
// own wwii-1935 — the player gets the buildup, not just the fire.
//
// What 1949 did to the 1946 board, and why this is a different world:
// - The People's Republic was proclaimed on 1 October; the Republic of China
//   holds Taiwan and little else. Tibet is still its own country — the PLA
//   crosses the Jinsha in October 1950.
// - Two Germanies since 1949 (Federal Republic in May, German Democratic
//   Republic in October), with the Saar a French protectorate outside both.
// - Two Koreas since 1948, both claiming the whole peninsula, with the
//   occupying armies withdrawn and the 38th parallel a live frontier.
// - India and Pakistan since 1947 and a Kashmir already partitioned by a war;
//   Burma and Ceylon independent; Indonesia sovereign since 27 December, three
//   days before this board opens.
// - Israel since 1948; Jordan is about to annex the West Bank (April 1950).
// - The Soviet Union has the bomb (29 August 1949) and NATO exists (4 April
//   1949). The monopoly that defined 1946 is gone — that is the whole change.
// - Yugoslavia was expelled from the Cominform in June 1948 and stands alone
//   between the blocs, which is the most interesting seat on this map.
//
// Cities are 1946's: the same places, four years on. Importing them rather than
// copying 125 rows keeps one list to correct when a coordinate is wrong.
import COLDWAR_1946 from "./coldwar-1946.spec.mjs";

export default {
  id: "korea-1950",

  meta: {
    name: "1950 — The Divided World",
    heroTitle: "Two of Everything",
    heroSubtitle: "Two Germanies, two Koreas, two Chinas — 1 January 1950",
    eyebrow: "The Cold War Hardens",
    subtitle: "1 January 1950",
    accentColor: "#3c5a78",
    coverImage: "public/loading_screen_2.jpg",
    description:
      "The year the lines were drawn twice. Germany and Korea each woke up as two " +
      "states, Mao's republic is three months old and Chiang is on an island, and " +
      "Moscow's first bomb has ended the American monopoly that made 1946 bearable. " +
      "Six months from now an army crosses the 38th parallel — unless somebody here " +
      "does something else.",
  },

  relabelOwnedCountries: false,
  unassignedKeepModernOwner: true,

  // The player starts as the Republic of Korea: the state this board is about,
  // six months from an invasion it cannot yet prove is coming, with an American
  // guarantee that was publicly hedged twelve days from now (Acheson's perimeter
  // speech, 12 January). For a game read in Korean, that is the seat.
  game: { country: "ROK", startDate: "1950-01-01", gameDate: "1950-01-01" },

  polities: {
    // ── 두 개의 중국, 그리고 아직 독립국인 티베트 ─────────────────────────────
    // 1949년 10월 1일 베이징에서 중화인민공화국이 선포됐고, 국민정부는 12월에
    // 타이베이로 옮겼다. 티베트는 1950년 10월 창두 전투까지 자기 나라다 —
    // 이 보드가 열리는 시점에 라싸는 아직 아무에게도 속하지 않는다.
    PRC: { name: "People's Republic of China", color: "#c0392b", aliases: ["중화인민공화국", "중국", "China", "Communist China", "Mao's China", "PRC"] },
    CHI: { name: "Republic of China", color: "#4a6db5", aliases: ["중화민국", "타이완", "Taiwan", "Nationalist China", "Formosa", "Kuomintang"] },
    TIB: { name: "Tibet", color: "#c8c0a0", aliases: ["티베트", "Tibet", "Ganden Phodrang", "Lhasa"] },
    // ── 두 개의 한국 ─────────────────────────────────────────────────────────
    // 1948년 8월 대한민국, 9월 조선민주주의인민공화국. 미군은 1949년 6월,
    // 소련군은 1948년 12월에 철수했다 — 38선을 지키는 것은 이제 그들 자신이다.
    ROK: { name: "Republic of Korea", color: "#3a7fbf", aliases: ["대한민국", "남한", "한국", "South Korea", "Korea"] },
    PRK: { name: "Democratic People's Republic of Korea", color: "#a33232", aliases: ["조선민주주의인민공화국", "북한", "North Korea", "DPRK"] },
    // ── 두 개의 독일, 그리고 자르 ────────────────────────────────────────────
    // 1949년 5월 서독, 10월 동독. 자를란트는 어느 쪽도 아닌 프랑스 보호령이고
    // 1957년에야 서독에 들어간다. 베를린은 여전히 4개국 관할이다.
    FRG: { name: "Federal Republic of Germany", color: "#8a8a9a", aliases: ["독일연방공화국", "서독", "West Germany", "Bonn Republic", "FRG"] },
    GDR: { name: "German Democratic Republic", color: "#7a5a5a", aliases: ["독일민주공화국", "동독", "East Germany", "GDR", "DDR"] },
    SAA: { name: "Saar Protectorate", color: "#6a7fb0", aliases: ["자르 보호령", "자를란트", "Saarland", "Saar", "Protectorat de la Sarre"] },
    // ── 소련: 1940년 병합 이후의 연방 공화국들 ───────────────────────────────
    RSF: { name: "Russian SFSR", color: "#a03c28", aliases: ["러시아 SFSR", "Russian Soviet Federative Socialist Republic", "RSFSR", "Russia", "Soviet Union", "소련"] },
    UKS: { name: "Ukrainian SSR", color: "#b9603a", aliases: ["우크라이나 SSR", "우크라이나", "Ukraine"] },
    BYE: { name: "Byelorussian SSR", color: "#8d5236", aliases: ["벨로루시 SSR", "백러시아", "Byelorussia", "Belarus"] },
    GEO: { name: "Georgian SSR", color: "#c07a4a", aliases: ["그루지야 SSR", "조지아", "Georgia"] },
    ARM: { name: "Armenian SSR", color: "#b06a4a", aliases: ["아르메니아 SSR", "아르메니아", "Armenia"] },
    AZE: { name: "Azerbaijan SSR", color: "#c08a5a", aliases: ["아제르바이잔 SSR", "아제르바이잔", "Azerbaijan"] },
    UZB: { name: "Uzbek SSR", color: "#c99a52", aliases: ["우즈베크 SSR", "우즈베키스탄", "Uzbekistan"] },
    TKM: { name: "Turkmen SSR", color: "#b08a4a", aliases: ["투르크멘 SSR", "투르크메니스탄", "Turkmenistan"] },
    TJK: { name: "Tajik SSR", color: "#a87c46", aliases: ["타지크 SSR", "타지키스탄", "Tajikistan"] },
    KAZ: { name: "Kazakh SSR", color: "#8f6b3c", aliases: ["카자흐 SSR", "카자흐스탄", "Kazakhstan"] },
    KGZ: { name: "Kirghiz SSR", color: "#9c7a44", aliases: ["키르기스 SSR", "키르기스스탄", "Kyrgyzstan"] },
    EST: { name: "Estonian SSR", color: "#7a6a8a", aliases: ["에스토니아 SSR", "에스토니아", "Estonia"] },
    LVA: { name: "Latvian SSR", color: "#8a7a9a", aliases: ["라트비아 SSR", "라트비아", "Latvia"] },
    LTU: { name: "Lithuanian SSR", color: "#9a8aaa", aliases: ["리투아니아 SSR", "리투아니아", "Lithuania"] },
    MDA: { name: "Moldavian SSR", color: "#b08a7a", aliases: ["몰다비아 SSR", "몰도바", "Moldova"] },
    SOV: { name: "Soviet Union", color: "#8b1a1a", aliases: ["소련", "USSR", "Soviet Russia", "Stalin's Russia"] },
    // ── 해체 중인 제국들 ─────────────────────────────────────────────────────
    // 인도·파키스탄·버마·실론은 이미 나갔다. 남은 것은 아프리카와 동남아시아,
    // 그리고 그중 인도차이나는 이미 전쟁 중이다.
    GBR: { name: "British Empire", color: "#c0507a", aliases: ["대영제국", "영국", "United Kingdom", "Britain", "Great Britain"] },
    CAN: { name: "Dominion of Canada", color: "#c05a6a", aliases: ["캐나다 자치령", "캐나다", "Canada"] },
    AUS: { name: "Commonwealth of Australia", color: "#d07a5a", aliases: ["호주 연방", "오스트레일리아", "Australia"] },
    NZL: { name: "Dominion of New Zealand", color: "#b06a7a", aliases: ["뉴질랜드 자치령", "뉴질랜드", "New Zealand"] },
    SAF: { name: "Union of South Africa", color: "#a87a5a", aliases: ["남아프리카 연방", "남아공", "South Africa"] },
    BWA: { name: "British West Africa", color: "#c09a6a", aliases: ["영국령 서아프리카", "British West Africa", "Nigeria", "Gold Coast"] },
    BEA: { name: "British East Africa", color: "#b08a5a", aliases: ["영국령 동아프리카", "British East Africa", "Kenya", "Tanganyika"] },
    BCA: { name: "British Central Africa", color: "#a89a7a", aliases: ["영국령 중앙아프리카", "로디지아", "Rhodesia", "Nyasaland"] },
    IND: { name: "India", color: "#d08a3a", aliases: ["인도", "Republic of India", "Dominion of India", "Bharat"] },
    PAK: { name: "Pakistan", color: "#4a8f5a", aliases: ["파키스탄", "Dominion of Pakistan", "West and East Pakistan"] },
    BUR: { name: "Burma", color: "#b0a04a", aliases: ["버마", "미얀마", "Union of Burma", "Myanmar"] },
    CEY: { name: "Ceylon", color: "#8fae7a", aliases: ["실론", "스리랑카", "Dominion of Ceylon", "Sri Lanka"] },
    FRA: { name: "French Republic", color: "#3f6fd0", aliases: ["프랑스", "France", "Fourth Republic", "French Union"] },
    AOF: { name: "French West Africa", color: "#5a7fc0", aliases: ["프랑스령 서아프리카", "Afrique-Occidentale française", "AOF"] },
    AEF: { name: "French Equatorial Africa", color: "#4a6fb0", aliases: ["프랑스령 적도아프리카", "Afrique-Équatoriale française", "AEF"] },
    // 1949년 바오다이의 베트남국이 프랑스 연합 안에서 세워졌고, 호찌민의
    // 베트남민주공화국은 북부 산악에서 그것을 인정하지 않는다. 1월 중순
    // 베이징과 모스크바가 차례로 후자를 승인한다 — 지도는 프랑스의 주장을
    // 그리고, 규칙이 실상을 말한다.
    FIC: { name: "French Indochina", color: "#6a8fd0", aliases: ["프랑스령 인도차이나", "Indochine française", "State of Vietnam", "베트남국", "Bao Dai"] },
    DRV: { name: "Democratic Republic of Vietnam", color: "#b5453a", aliases: ["베트남민주공화국", "베트민", "Viet Minh", "Ho Chi Minh", "North Vietnam"] },
    NLD: { name: "Netherlands", color: "#e08a2e", aliases: ["네덜란드", "Holland", "Kingdom of the Netherlands"] },
    IDN: { name: "Indonesia", color: "#d08a4a", aliases: ["인도네시아", "Republic of the United States of Indonesia", "RUSI", "Sukarno"] },
    BEL: { name: "Belgium", color: "#b0902e", aliases: ["벨기에", "Belgian Empire"] },
    BCO: { name: "Belgian Congo", color: "#8a9a3a", aliases: ["벨기에령 콩고", "Congo belge", "Belgian Congo"] },
    POR: { name: "Portugal", color: "#2e7d6b", aliases: ["포르투갈", "Portuguese Empire", "Estado Novo"] },
    ESP: { name: "Spain", color: "#d0a02e", aliases: ["스페인", "Francoist Spain", "Spanish State"] },
    // ── 유럽 ─────────────────────────────────────────────────────────────────
    USA: { name: "United States", color: "#4a8f7a", aliases: ["미국", "America", "United States of America"] },
    AUT: { name: "Allied-occupied Austria", color: "#b8b8c8", aliases: ["연합군 점령하 오스트리아", "오스트리아", "Austria", "Second Austrian Republic"] },
    CSK: { name: "Czechoslovakia", color: "#5b7fae", aliases: ["체코슬로바키아", "Czechoslovak Republic", "체코슬로바키아 인민공화국"] },
    // 1948년 6월 코민포름에서 축출됐다. 공산국가이면서 어느 블록에도 속하지
    // 않은 유일한 나라이고, 이 지도에서 가장 흥미로운 자리다.
    YUG: { name: "Yugoslavia", color: "#6a8caf", aliases: ["유고슬라비아", "FPR Yugoslavia", "Tito's Yugoslavia", "티토"] },
    ITA: { name: "Italy", color: "#4f7942", aliases: ["이탈리아", "Italian Republic", "Italy"] },
    DAN: { name: "Denmark", color: "#8a5f6d", aliases: ["덴마크", "Kingdom of Denmark"] },
    // ── 아시아 ───────────────────────────────────────────────────────────────
    // 강화조약은 1951년, 주권 회복은 1952년 — 1950년 1월의 일본은 아직 GHQ 밑이다.
    JAP: { name: "Allied-occupied Japan", color: "#b23b3b", aliases: ["연합군 점령하 일본", "일본", "Japan", "SCAP Japan", "GHQ"] },
    MON: { name: "Mongolian People's Republic", color: "#a85454", aliases: ["몽골", "Mongolia", "Outer Mongolia"] },
    SIA: { name: "Thailand", color: "#4068bf", aliases: ["태국", "시암", "Siam", "Kingdom of Thailand"] },
    PHL: { name: "Philippines", color: "#7a9ac0", aliases: ["필리핀", "Republic of the Philippines"] },
    // ── 중동 ─────────────────────────────────────────────────────────────────
    ISR: { name: "Israel", color: "#5a8fc0", aliases: ["이스라엘", "State of Israel"] },
    JOR: { name: "Jordan", color: "#b09a5a", aliases: ["요르단", "Hashemite Kingdom of Jordan", "Transjordan", "트란스요르단"] },
  },

  countryAssignments: {
    RSF: ["RUS"],
    UKS: ["UKR"],
    BYE: ["BLR"],
    GEO: ["GEO"],
    ARM: ["ARM"],
    AZE: ["AZE"],
    UZB: ["UZB"],
    TKM: ["TKM"],
    TJK: ["TJK"],
    KAZ: ["KAZ"],
    KGZ: ["KGZ"],
    EST: ["EST"],
    LVA: ["LVA"],
    LTU: ["LTU"],
    MDA: ["MDA"],
    // 필리핀은 1946년 7월에 독립했다 — 1946년 보드에서 미국 것이던 것이 여기서는 아니다.
    USA: ["USA", "PRI", "GUM", "VIR", "MNP", "PLW", "MHL", "FSM"],
    PHL: ["PHL"],
    // 인도·파키스탄·버마·실론이 빠진 제국. 리비아는 1951년 독립까지 영·프
    // 군정이고, 수단은 1956년까지 영이집트 공동통치다.
    GBR: ["GBR", "SDN", "GUY", "BLZ", "JAM", "TTO", "BHS", "BRB", "ATG", "DMA", "GRD", "KNA", "LCA", "CYM", "VGB", "TCA", "CYP", "MLT", "MYS", "SGP", "BRN", "BHR", "QAT", "ARE", "KWT", "FJI", "SLB", "MUS", "SYC", "LBY"],
    CAN: ["CAN"],
    AUS: ["AUS", "PNG"],
    NZL: ["NZL", "WSM"],
    SAF: ["ZAF", "NAM", "LSO", "SWZ"],
    BWA: ["NGA", "GHA", "SLE", "GMB"],
    BEA: ["KEN", "UGA", "TZA"],
    BCA: ["ZMB", "ZWE", "MWI", "BWA"],
    IND: ["IND"],
    PAK: ["PAK", "BGD"],
    BUR: ["MMR"],
    CEY: ["LKA"],
    ISR: ["ISR"],
    // 1950년 4월 서안 병합 직전 — 요르단강 서안은 이미 요르단 군정 아래다.
    JOR: ["JOR", "PSE"],
    FRA: ["FRA", "DZA", "TUN", "MAR", "CMR", "TGO", "MDG", "DJI", "COM", "GUF", "NCL", "PYF", "MYT", "REU", "GLP", "MTQ", "SPM", "WLF", "ATF"],
    AOF: ["SEN", "MLI", "CIV", "GIN", "BFA", "BEN", "NER", "MRT"],
    AEF: ["TCD", "CAF", "COG", "GAB"],
    FIC: ["VNM", "LAO", "KHM"],
    AUT: ["AUT"],
    CSK: ["CZE", "SVK"],
    YUG: ["SRB", "HRV", "BIH", "MNE", "MKD", "SVN", "XKO"],
    ITA: ["ITA"],
    ESP: ["ESP", "ESH", "GNQ"],
    POR: ["PRT", "AGO", "MOZ", "GNB", "CPV", "STP", "TLS"],
    NLD: ["NLD", "SUR"],
    // 1949년 12월 27일 주권 이양 — 이 보드가 열리기 나흘 전이다.
    // 네덜란드령 뉴기니는 1962년까지 네덜란드가 쥔다.
    IDN: ["IDN"],
    BEL: ["BEL"],
    BCO: ["COD", "RWA", "BDI"],
    DAN: ["DNK", "GRL", "FRO"],
    JAP: ["JPN"],
    ROK: ["KOR"],
    PRK: ["PRK"],
    PRC: ["CHN"],
    CHI: ["TWN"],
    MON: ["MNG"],
    SIA: ["THA"],
  },

  regionAssignments: {
    // ── 두 독일 ──────────────────────────────────────────────────────────────
    // 1949년의 분단선은 1946년의 점령 구역선과 같다. 소련 구역이 동독이 되고
    // 미·영·프 구역이 서독이 됐다 — 자르만 어느 쪽도 아니다.
    "DEU.4_1": "GDR",   // Brandenburg
    "DEU.8_1": "GDR",   // Mecklenburg-Vorpommern
    "DEU.14_1": "GDR",  // Sachsen
    "DEU.13_1": "GDR",  // Sachsen-Anhalt
    "DEU.16_1": "GDR",  // Thüringen
    "DEU.3_1": "GDR",   // Berlin — 실상은 4개국 관할이고 서베를린은 서방 것이다(규칙 참조)
    "DEU.12_1": "SAA",  // Saarland — 프랑스 보호령, 어느 독일도 아니다
    "DEU.10_1": "FRG",  // Nordrhein-Westfalen
    "DEU.9_1": "FRG",   // Niedersachsen
    "DEU.15_1": "FRG",  // Schleswig-Holstein
    "DEU.6_1": "FRG",   // Hamburg
    "DEU.2_1": "FRG",   // Bayern
    "DEU.7_1": "FRG",   // Hessen
    "DEU.1_1": "FRG",   // Baden-Württemberg
    "DEU.5_1": "FRG",   // Bremen
    "DEU.11_1": "FRG",  // Rheinland-Pfalz

    // ── 티베트 ───────────────────────────────────────────────────────────────
    // 1950년 10월 창두 전투 전까지 라싸는 자기 나라다. 시드가 지급시 단위로
    // 세분화됐으므로 이 키 하나가 시짱의 7개 지구로 확장된다.
    "CHN.29_1": "TIB",

    // ── 카슈미르 ─────────────────────────────────────────────────────────────
    // 1947~48년 전쟁이 1949년 1월 정전선에서 멈췄다. 잠무카슈미르는 인도가,
    // 아자드카슈미르와 길기트발티스탄은 파키스탄이 쥔다.
    "Z01.14_1": "IND",
    "Z06.1_1": "PAK",
    "Z06.6_1": "PAK",

    "CHN.HKG": "GBR",   // 홍콩 — 1949년 국경에 인민해방군이 섰지만 넘지 않았다
    "CHN.MAC": "POR",   // 마카오
  },

  // 1946년의 도시들. 같은 장소의 4년 뒤이고, 좌표를 고칠 일이 생기면 고칠 곳이
  // 한 군데여야 한다.
  cities: COLDWAR_1946.cities,

  simulationRules:
    "It is 1 January 1950. The world has two of almost everything and the " +
    "American atomic monopoly is four months dead. " +

    "THE KOREAN QUESTION IS THE CLOCK ON THIS BOARD. Two Korean states have " +
    "existed since 1948, each claiming the whole peninsula; the Soviet army " +
    "left in December 1948 and the American army in June 1949, so the 38th " +
    "parallel is held by Koreans and nobody else. Kim Il-sung has been asking " +
    "Stalin for permission to attack since March 1949 and has been refused; " +
    "Moscow's answer changes in the spring of 1950 because the Soviet bomb and " +
    "the Communist victory in China have changed what a war there would risk. " +
    "Historically the North attacks on 25 June 1950. That is a CONSEQUENCE of " +
    "decisions, not a fixture: Soviet permission, Chinese acquiescence, the " +
    "American guarantee (Acheson places Korea OUTSIDE the defensive perimeter " +
    "on 12 January — a real event with real effects), and the South's own " +
    "provocations across the parallel all bear on it. If the player changes " +
    "those inputs, change the outcome, and say through whose decision. " +

    "CHINA. The People's Republic is three months old and still taking ground: " +
    "Hainan falls in April 1950, Tibet in October, and the Nationalists on " +
    "Taiwan expect an invasion that the Korean War is what prevents. Mao is in " +
    "Moscow right now — the Sino-Soviet Treaty is signed on 14 February. " +

    "INDOCHINA. The State of Vietnam under Bao Dai was created inside the " +
    "French Union in 1949 and the Democratic Republic in the northern hills " +
    "does not recognise it. Beijing recognises the DRV on 18 January and Moscow " +
    "on 30 January; Washington and London recognise Bao Dai in February and the " +
    "first American aid arrives in May. A colonial war becomes a Cold War front " +
    "inside eight weeks, and the map should show it. " +

    "EUROPE. NATO is nine months old and has no army; the Federal Republic has " +
    "no army either and will not until 1955. Yugoslavia was expelled from the " +
    "Cominform in June 1948 and is the one communist state outside both blocs — " +
    "courted by the West, threatened by its neighbours, and the most " +
    "interesting seat on this map. Berlin is quadripartite: the grid gives the " +
    "city to the surrounding zone, but WEST BERLIN IS WESTERN and the airlift " +
    "that proved it ended eight months ago. " +

    "DECOLONISATION IS THE OTHER CLOCK. India, Pakistan, Burma, Ceylon, the " +
    "Philippines and Indonesia are already out; Libya is promised independence " +
    "for 1951; the Gold Coast holds its first general election in February. " +
    "Every empire on this map is a going concern that its own subjects and its " +
    "American ally are both working against. " +

    "Technology and economy must reflect 1950: two atomic powers and no " +
    "thermonuclear weapons yet (the US decision to build one comes on 31 " +
    "January), jets entering service, no ICBMs, no satellites, and European " +
    "economies rebuilding on Marshall Plan money. The map approximates 1950 " +
    "control with modern administrative regions; Chinese regions are " +
    "prefecture-level and Indian regions are districts, so a front in Asia " +
    "moves through many small regions rather than a few large ones.",

  startingTimelineText:
    "1 January 1950. In Peking the People's Republic is ninety-two days old and Mao " +
    "Zedong is in Moscow, kept waiting; in Taipei Chiang Kai-shek counts what is left of " +
    "an army and an island. Germany woke up in May as one country and in October as " +
    "another, and the Saar belongs to neither. Korea has been two states for sixteen " +
    "months, the occupying armies are gone, and both governments say the same thing about " +
    "the other half. In Belgrade Tito is eighteen months outside the Cominform and still " +
    "alive, which nobody in Moscow intended. Indonesia became sovereign four days ago; " +
    "India is two years old and Kashmir is already cut in half by a ceasefire line. And " +
    "since the last day of August the Americans are no longer the only ones with the " +
    "bomb — which is the fact underneath every other one on this board.",
};

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

  // ── Plan F-3: 시대 경계 그래프트 — 창만 선언, 추출은 PC에서 ──────────────
  // 이 보드도 시대 지오메트리가 없어서 현대 국경선으로 그려진다. 1950년에
  // 현대 국경이 틀린 곳은 한반도만이 아니다 — **독일은 아직 분단국이고**(OHM이
  // 이 날짜에 `Bundesrepublik Deutschland`와 `Ostdeutschland`를 따로 준다),
  // 인도·파키스탄 분할(1947), 이스라엘(1948), 인도차이나가 전부 이 해의 것이다.
  //
  // 그래서 창이 넓다: [-10,25,132,71] = z4 **28타일**(1939 유럽창의 1.75배).
  // 유럽만 끊으면 16타일이지만 정작 보드 이름이 된 한반도가 창 밖이고,
  // 추출기는 한 번에 창 하나만 받는다 — 두 번 돌리는 것보다 한 번에 넓게
  // 끊는 편이 서버에도 낫다. 1024 타일 상한에는 한참 못 미친다.
  //
  // **파일이 아직 없다.** build-preset은 그 경우 "조립 산출물 없음 — 현대
  // 프로빈스 조합으로 진행"이라 찍고 사다리 2단으로 내려간다(설계된 동작).
  // 그러니 이 선언은 지금 안전하고, PC에서 추출이 끝나면 그대로 켜진다.
  // excludeFaces·faceOwners·faceKeepOut은 **비워 둔다** — 면 목록을 실제로
  // 보기 전에 채우는 건 추측이고, 이 파일의 규칙에 어긋난다. 1차 빌드의
  // 재배정·절단 로스터를 읽고 붙인다(1444·1200·1300·117과 같은 절차).
  //
  // PC 추출 완료(2026-08-15), 그리고 **하이브리드를 가리킨다.** rung-1은
  // 37면인데 그 안에 독일 둘도, 폴란드도, 체코슬로바키아도 없다 — 1935와
  // 같은 이유로 서·중부 유럽이 한 덩어리로 뭉쳐 거부됐다(18폴리티·육지비
  // 15%). 사다리 3단(aourednik world_1960)을 얹어 75면이 되고 거기에
  // `East Germany`·`West Germany`·`Poland`·`Czechoslovakia`·`Yugoslavia`가
  // 있다. 1960을 쓰는 이유는 1945가 아직 4개 점령지구를 그리기 때문이다 —
  // 두 독일은 1949년에 생겼고 이 보드는 1950년이다.
  // faceOwners는 1차 빌드의 미매칭 로스터를 읽고 붙였다(그쪽 절차 그대로).
  // 오른쪽이 폴리티 코드가 아니라 **리터럴 이름**인 줄들이 있는데, 그건
  // 이 보드가 그 나라의 주권을 현대 그대로 두기 때문이다(1939 스펙이
  // 이라크에 쓴 것과 같은 처리) — 로스터에 없는 나라를 억지로 만들지 않는다.
  eraGeometry: {
    date: "1950-01-01",
    window: [-10, 25, 132, 71],
    file: "scripts/ohm/out/era-borders-1950-01-01-z4-hybrid.geojson",
    // 1차 빌드가 재배정 624건을 냈고, 그 중 셋은 보드를 무너뜨린다 — 전부
    // rung-3 백필 면이고, 전부 같은 병이다: **1960년 지도의 나라 하나가 1950년의
    // 여러 주체를 통째로 덮는다.** 이름 매칭이 아니라 면의 범위가 문제라, 별칭을
    // 더 붙여도 그대로다.
    excludeFaces: [
      // 인도 408개 구를 파키스탄으로 넘긴다 — 아대륙 전체다. **범인은 rung-1의
      // `Dominion of Pakistan`이다**(rung-3 `Pakistan`을 먼저 뺐는데 408건이
      // 그대로 남아서 알았다): 1935·1950 유럽에서 본 것과 같은 미폐합 덩어리로,
      // 인도아대륙 전체가 한 면으로 뭉쳤다. rung-3 `Pakistan`은 world_1960의
      // 파키스탄이라 동·서 파키스탄을 제대로 그린다 — 그쪽을 남긴다.
      "Dominion of Pakistan",
      // 연방 공화국 15개를 한 소유주로 붕괴시킨다(러시아 SFSR 49 · 몰다비아 37 ·
      // 우크라이나 21 · 그루지야 12 …, 합 198). 이 보드는 공화국을 **각각**
      // 선언한다 — RSF·UKR·BLR·KAZ·UZB·GEO·ARM·AZE·EST·LVA·LTU·TJK·TKM —
      // 그게 1950년 소련을 플레이 가능한 판으로 만드는 설계다. 이 면 하나가
      // 그 설계를 지운다.
      "USSR",
      // 위 faceOwners가 1950년 리비아를 세 조각(영 군정·키레나이카·페잔)으로
      // 이미 정확히 붙여 놨다. 이 면은 **1951년 12월에야 생기는 나라**를 하나
      // 만들어 그 위에 덮어쓴다 — 같은 스펙 안에서 서로 모순된다.
      "Libya",
      // 걸프 보호국들은 이 스펙에서 영제국 한 색이다(countryAssignments의
      // GBR 줄에 BHR·QAT·ARE·KWT가 들어 있다). 1935 보드와 같은 처리.
      "Qatar",
      "Kuwait",
      "United Arab Emirates",
    ],

    faceKeepOut: {
      // 요르단은 1950년 4월에 서안을 병합한다 — 이 보드가 열리는 1월에 그 땅은
      // 요르단 점령 아래 있고, 요르단 본토는 말할 것도 없다. 두 이스라엘 면이
      // 요르단 11개 주와 서안을 함께 가져갔다.
      "ישראל": ["JOR", "PSE"],
      Israel: ["JOR", "PSE"],
      // 리히텐슈타인은 주권국이다. 1935에서와 같은 면, 같은 침범.
      Austria: ["LIE"],
    },

    faceOwners: {
      // ── 유럽 인민공화국들: 주권국이고 이 보드는 현대 주권을 그대로 쓴다 ──
      "Magyar Népköztársaság": "Hungary",
      "Народна република България": "Bulgaria",
      "Republika Popullore e Shqipërisë": "Albania",

      // ── 리비아: 1951년 12월까지 아직 나라가 아니다 ────────────────────────
      // 유엔 결의로 독립이 예정돼 있을 뿐, 1950년 1월에는 세 조각이 각자
      // 군정 아래 있다 — 트리폴리타니아·키레나이카는 영국, 페잔은 프랑스.
      // 그래서 한 나라로 묶지 않고 관리국에 각각 붙인다.
      "British Military Administration of Libya": "GBR",
      "Emirate of Cyrenaica": "GBR", // 1949년 자치 선언, 그러나 영국 군정 아래
      "Fezzan-Ghadames Military Territory": "FRA",

      // ── 가자: 전팔레스타인 정부는 이집트 관리 아래 있었다 ─────────────────
      "حكومة عموم فلسطين": "Egypt",

      // ── 1939·1935 스펙이 같은 이름으로 이미 해결해 둔 식민지 면들 ─────────
      "Algérie française": "FRA",
      "Protectorat français de Tunisie": "FRA",
      "Tangier International Zone": "FRA",
      "British Cyprus": "GBR",
      "Colony of Malta": "GBR",
      "Protectorate of Kuwait": "GBR",
      "Sultanate of Muscat and Oman": "GBR",
      "África Occidental Española": "ESP",
      "葡屬澳門 Portuguese Macau": "POR",
      "المملكة العراقية الهاشمية": "Iraq", // 1932년부터 독립국
    },
  },

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

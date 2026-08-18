/*! Open Historia — WWII 1939 scenario preset © 2026 Nicholas Krol, MIT (see src/Editor/LICENSE). */
// World War II preset — 1 September 1939 (the day Germany invades Poland).
//
// Borders are approximated from modern admin-1 regions. We override only where
// 1939 differs from today: colonial empires fold into their mother country, the
// Axis annexations are applied, the 1939 USSR and Kingdom of Yugoslavia are
// unified. Independent states that existed in 1939 with ~modern borders are left
// alone (they keep their modern color/owner). Editorial choices are noted.
//
// Timing note: on 1 Sept 1939 the invasion is only beginning, so Poland is still
// whole; the Soviet invasion (17 Sept) and the Baltic/Bessarabian annexations
// (June 1940) have NOT happened yet — they live in simulationRules, not the map.

export default {
  id: "wwii-1939",

  meta: {
    name: "World War II — 1939",
    heroTitle: "The Storm Breaks",
    heroSubtitle: "German columns cross into Poland and the world follows them in",
    eyebrow: "The Second World War",
    subtitle: "1 September 1939",
    accentColor: "#8a1f1f",
    coverImage: "public/loading_screen_2.jpg",
    description:
      "At dawn the Wehrmacht crossed the Polish frontier, and the two days it takes Britain and France to declare war are the last quiet ones. The Pact signed a week ago has already divided eastern Europe on paper; the Red Army will collect its half on the seventeenth. Italy waits to see who wins before choosing, Japan is three years into a war in China with no end drawn on any map, and the United States means to sell to everyone and fight nobody. The empires that will fund the Allied war effort still cover a third of the planet and will not survive winning. Take any power into the deadliest six years in human history.",

  },

  // Keep modern names: in 1939 most of them still fit, and relabelling every whole
  // country grant would name each colony after its empire.
  //
  // The era names this preset does need are polities now, not labels. Austria and
  // the Czech lands read "Germany" because Germany OWNS them below — the annexation
  // is the ownership, so no separate label is needed. Siam is the one that had to be
  // converted rather than dropped: Thailand keeps its modern owner here, so it had
  // no polity to take a name from, and the label was the only record of the era name.
  relabelOwnedCountries: false,

  // 1939 is near-modern: countries the spec does not assign (Mexico, Brazil,
  // Turkey, Iran, Sweden...) were real sovereign states and keep their modern
  // owner on the map instead of rendering as unclaimed land.
  unassignedKeepModernOwner: true,

  // Player starts as Germany. game.country MUST be a polity code declared below —
  // the build resolves it to that polity's name, which is what the map's owners say.
  game: { country: "GER", startDate: "1939-09-01", gameDate: "1939-09-01" },

  // Plan F-3: where the assembler closed a 1939 outline from OpenHistoricalMap
  // (CC0), that outline is the authority and the modern provinces get clipped
  // to it — the Polish Corridor and East Prussia cut straight through modern
  // GADM provinces, and no assignment of WHOLE provinces can draw them.
  // Polities without a face keep the composition below (source ladder, rung 2)
  // and the build prints exactly which is which. The dump is made on the user's
  // PC — OHM fetches never run from an agent session:
  //   node scripts/ohm/extract-era-borders.mjs 1939-09-01 --zoom 4 --bbox <window>
  //   node scripts/ohm/fetch-era-polities.mjs 1939-09-01
  //   node scripts/ohm/assemble-era-borders.mjs <lines> --polities <polities>
  // Absent the dump the preset builds exactly as it did before, and says so.
  // faceOwners resolves the faces whose NAME cannot answer the ownership
  // question — a colony's era name says where it is, never who holds it, and
  // the coverage census found the 1939 map is largely a colonial one. Right
  // side is a polity code (or a literal owner name for countries that keep
  // their modern sovereign, like independent Iraq).
  eraGeometry: {
    date: "1939-09-01",
    // THE WINDOW THE SHIPPED FACES WERE ACTUALLY CUT WITH, recovered from the
    // dump's own meta.bbox — it had been typed on a command line once and
    // recorded nowhere, so a rebuild had no way to reproduce it.
    //
    // It is Europe, not the world, and that is the judgment worth keeping: a
    // window says where era borders differ from modern ones enough to be worth
    // cutting, NOT how far the board reaches. This board's own assignments span
    // [-180,-55,180,84] — a world war touches every continent — so no bounding
    // box of the board's content recovers this number. At zoom 4 it is 16 tiles
    // against the world's 256, and BOTH clear the extractor's 1,024 ceiling, so
    // a wider window would not have errored. It would have pulled sixteen times
    // the tiles off a volunteer server for ground nobody ends up cutting.
    // scripts/ohm/plan-era-faces.mjs reads this field.
    window: [-10, 35, 45, 71],
    // The Europe window's frame-bounded residue — everything east and south of
    // where the dump ran out. Measured on the 1939 z4 run: 1,191 deg² spanning
    // 41x45 degrees, six times the next-largest face and reaching from the
    // Balkans to Central Asia, carrying Iran's label because Iran's is the one
    // that happens to sit in it. Not a country; excluded by name.
    excludeFaces: [
      // world_1938의 연대 어긋남 둘 — 1939-09-01에 존재하지 않는 나라.
      // 체코슬로바키아는 1939-03에 해체됐다(보헤미아-모라바 보호령 + 슬로바키아).
      // rung-1이 그 해체를 정밀하게 그리고 있고(CZE 14칸 = Germany), 이 면을
      // 들이면 1938년 국경이 그 위를 덮는다.
      "Czechoslovakia",
      // 빈 샬란 토후국(루왈라 베두인)은 1930년대에 독립 정권이 아니다 — 그 사막은
      // 프랑스령 시리아·트란스요르단·사우디가 나눠 쥔다.
      "Emirate of Bin Shal'an","ایران"],
    // Borders this dump fused across where the other side has no label to mark
    // the fusion. Measured: the German face covers Midtjylland 97.8%,
    // Syddanmark 67.8% and Nordjylland 35.2% — Jutland leaked into the Reich
    // because the German-Danish border never closed, and there is no 1939
    // Denmark relation in the dump to flag it as a merge. Denmark was neutral
    // and whole on 1 September 1939; the face may not enter it.
    faceKeepOut: { "Deutsches Reich": ["DNK"] },
    faceOwners: {
      "Algérie française": "FRA",
      "Protectorat français de Tunisie": "FRA",
      "République Libanaise": "FRA", // French mandate for Syria and the Lebanon
      "Tangier International Zone": "FRA", // jointly administered; France ran the day-to-day
      Libia: "ITA",
      "Protettorato Italiano del Regno d'Albania": "ITA", // annexed April 1939 — Italy, not a separate Albania
      "British Cyprus": "GBR",
      "Colony of Malta": "GBR",
      Gibraltar: "GBR",
      "Protectorate of Bahrain": "GBR",
      "Protectorate of Kuwait": "GBR",
      "Protectorate of Qatar": "GBR",
      "Trucial States": "GBR",
      // ── world_1938 백필(첫 1939 하이브리드, 2026-08-18)이 데려온 것들.
      // rung-3의 이름은 1938년 어휘라 1939-09-01과 몇 곳에서 어긋난다 — 어긋난
      // 것은 아래 excludeFaces에서 이름으로 죽고, 맞는 것만 여기서 잇는다.
      "Trucial Oman": "GBR", // rung-1 Trucial States와 같은 답
      "Algeria (France)": "FRA", // 1939 알제리는 프랑스 일체령
      "Morocco (France)": "FRA",
      "Mandatory Palestine (GB)": "GBR",
      "Syria (France)": "FRA",
      // 이라크는 1932년 독립 — rung-1 아랍명 행과 같은 답. 자료의 "Mesopotamia"는
      // 1938년에도 낡은 이름이지만 면이 덮는 땅이 이라크인 것은 맞다.
      "Mesopotamia (GB)": "Iraq",
      // 헤자즈·하일: 1925·1921년에 사우드가 정복했다 — 1939년엔 사우디아라비아다.
      "Hejaz": "Saudi Arabia",
      "Hail": "Saudi Arabia",
      "Sultanate of Muscat and Oman": "GBR", // treaty state inside the British system
      // A Crown dependency, not a sovereign state — the dump gives it a face of
      // its own and it re-owned all 21 of GADM's Manx parishes back to "Isle of
      // Man" after the era-sovereignty table had already folded them into the
      // empire. The face is right about the outline and silent about the holder.
      "Isle of Man": "GBR",
      // ICELAND: THE FACE IS RIGHT ABOUT THE STATE AND WRONG ABOUT THE BOARD.
      // The dump's face is "Konungsríkið Ísland" (admin_level 2, 1918–1944-06-16)
      // and it is not wrong: the 1918 Act of Union made Iceland a sovereign
      // kingdom in personal union, with Denmark conducting only its foreign
      // affairs. But the era-sovereignty table folds ISL into DNK until 1944,
      // the face re-took five regions from it, and the two have to agree.
      // Checked against the preset we compare to: World War II++ has NO Iceland
      // polity at all — its Denmark owns seventeen regions and EIGHT of them are
      // Icelandic (Höfuðborgarsvæðið, Suðurnes, Vesturland, Vestfirðir,
      // Norðurland vestra/eystra, Austurland, Suðurland) — and it scripts
      // "17 June 1944: Iceland gains independence" instead. The table matches
      // the original; the face yields.
      "Konungsríkið Ísland": "DAN",
      "Colonia del Rio de Oro": "ESP",
      "Saguía el Hamra": "ESP",
      "Territorio de Ifni": "ESP",
      // Independent since 1932 and not a polity in this spec: keeps its own name.
      "المملكة العراقية الهاشمية": "Iraq",
    },
  },

  polities: {
    // ── 자치령: 왕관은 같아도 정부는 각자다 ───────────────────────────────────
    // 1931년 웨스트민스터 헌장 이후 자치령은 대외정책까지 자기 것이다 — 1939년
    // 9월 캐나다는 따로 선전포고했고, 남아공은 의회 표결로 참전을 정했다.
    CAN: { name: "Dominion of Canada", color: "#c05a6a", aliases: ["캐나다 자치령", "캐나다", "Canada"] },
    AUS: { name: "Commonwealth of Australia", color: "#d07a5a", aliases: ["호주 연방", "오스트레일리아", "Australia"] },
    NZL: { name: "Dominion of New Zealand", color: "#b06a7a", aliases: ["뉴질랜드 자치령", "뉴질랜드", "New Zealand"] },
    SAF: { name: "Union of South Africa", color: "#a87a5a", aliases: ["남아프리카 연방", "남아공", "South Africa"] },
    // ── 영국령 아프리카: 색 하나가 아니라 총독부 셋 ───────────────────────────
    BWA: { name: "British West Africa", color: "#c09a6a", aliases: ["영국령 서아프리카", "British West Africa", "Nigeria", "Gold Coast"] },
    BEA: { name: "British East Africa", color: "#b08a5a", aliases: ["영국령 동아프리카", "British East Africa", "Kenya", "Tanganyika"] },
    BCA: { name: "British Central Africa", color: "#a89a7a", aliases: ["영국령 중앙아프리카", "로디지아", "Rhodesia", "Nyasaland"] },
    // ── 소련: 1936년 헌법이 그린 11개 연방 공화국 ────────────────────────────
    // 자캅카스 연방은 해체됐고 카자흐·키르기스는 연방 공화국으로 승격했다.
    // 발트 3국과 몰다비아 병합은 1940년 — 1939년 9월에는 아직 소련이 아니다.
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
    // ── 중국: 난징의 영은 하류 양쯔를 넘지 못한다 ─────────────────────────────
    SHX: { name: "Shanxi Clique", color: "#7d8f5a", aliases: ["산시 군벌", "옌시산", "Yan Xishan", "Shanxi"] },
    XIN: { name: "Xinjiang Clique", color: "#6f8f7a", aliases: ["신장 군벌", "성스차이", "Sheng Shicai", "Xinjiang"] },
    GXC: { name: "New Guangxi Clique", color: "#8a9a4a", aliases: ["신계계", "광시 군벌", "Li Zongren", "Guangxi"] },
    YUN: { name: "Yunnan Clique", color: "#6a9a6a", aliases: ["윈난 군벌", "룽윈", "Long Yun", "Yunnan"] },
    SZC: { name: "Sichuan Cliques", color: "#8a8a6a", aliases: ["쓰촨 군벌", "류샹", "Liu Xiang", "Sichuan"] },
    MAC: { name: "Ma Clique", color: "#a89a6a", aliases: ["마가군벌", "마부팡", "Ma Bufang", "Qinghai"] },
    CSR: { name: "Chinese Soviet Republic", color: "#c03030", aliases: ["중화소비에트공화국", "중국공산당", "Chinese Communist Party", "Mao Zedong", "Yan'an"] },
    TIB: { name: "Tibet", color: "#c8c0a0", aliases: ["티베트", "Tibet", "Ganden Phodrang"] },
    MGL: { name: "Mengjiang", color: "#b0a070", aliases: ["몽강", "몽강연합자치정부", "Inner Mongolia", "De Wang"] },
    // ── 제국은 색이 아니라 행정부다 ───────────────────────────────────────────
    RAJ: { name: "British Raj", color: "#c07a8a", aliases: ["영국령 인도", "인도 제국", "British India", "India"] },
    // ── 번왕국: 라지는 한 덩어리가 아니었다 ────────────────────────────────
    // 원본 대조에서 뒤집힌 판단이다(docs/analysis/wwii-plus-plus-audit.md §1-2).
    // World War II++는 British Raj 위에 번왕국 60여 개를 개별 폴리티로 둔다 —
    // 1935년 인도 아대륙의 40%가 영국이 직접 통치하지 않는 땅이었고, 1937년
    // 이벤트가 "British India, Princely States, Federated Shan States" 셋을
    // 나란히 부르는 것이 그 구조다.
    //
    // 우리는 60개를 다 두지 않는다. 대부분이 1지역짜리가 될 텐데 우리 지역
    // 계약상 "1지역 = 나라 전체"라 서사 부담만 늘고, 애초에 우리 지역은 현대
    // level-1이라 그만한 해상도가 없다. 대신 **현대 지역 하나가 통째로 번왕국
    // 땅이었던 다섯**만 꺼낸다 — 나머지는 관구(봄베이·마드라스·벵골·연합주)라
    // 정말로 영국 직할이었으므로 RAJ에 남는 게 맞다.
    JKS: { name: "Jammu and Kashmir", color: "#9f8fb5", aliases: ["잠무 카슈미르", "카슈미르", "Kashmir", "Dogra"] },
    RJP: { name: "Rajputana", color: "#c9a05a", aliases: ["라지푸타나", "라자스탄", "Rajasthan", "Jaipur", "Jodhpur", "Udaipur", "Bikaner"] },
    HYD: { name: "Hyderabad", color: "#8fae7a", aliases: ["하이데라바드", "니잠", "Nizam", "Deccan"] },
    MYS: { name: "Mysore", color: "#7fa89a", aliases: ["마이소르", "Mysuru", "Wadiyar"] },
    TRV: { name: "Travancore and Cochin", color: "#b0937f", aliases: ["트라방코르", "코친", "Travancore", "Cochin"] },
    AOF: { name: "French West Africa", color: "#5a7fc0", aliases: ["프랑스령 서아프리카", "Afrique-Occidentale française", "AOF"] },
    AEF: { name: "French Equatorial Africa", color: "#4a6fb0", aliases: ["프랑스령 적도아프리카", "Afrique-Équatoriale française", "AEF"] },
    FIC: { name: "French Indochina", color: "#6a8fd0", aliases: ["프랑스령 인도차이나", "Indochine française", "Indochina"] },
    DEI: { name: "Dutch East Indies", color: "#d08a4a", aliases: ["네덜란드령 동인도", "Nederlands-Indië", "Dutch East Indies", "Indonesia"] },
    BCO: { name: "Belgian Congo", color: "#8a9a3a", aliases: ["벨기에령 콩고", "Congo belge", "Belgian Congo"] },
    GER: { name: "Germany", color: "#3a3a3a", aliases: ["독일", "나치 독일", "Third Reich", "German Reich", "Nazi Germany", "Deutsches Reich"] },
    // Was a countryNameOverrides label (THA -> "Siam"). A label could only rename
    // what the map already showed; a polity is a country the game and the model can
    // actually reason about. The colour is what Thailand rendered as before —
    // codeToColor("THA") — so the map looks identical.
    SIA: { name: "Siam", color: "#4068bf", aliases: ["시암", "Thailand", "Kingdom of Siam"] },
    SVK: { name: "Slovakia", color: "#9a9a4f", aliases: ["슬로바키아", "Slovak Republic"] },
    ITA: { name: "Italy", color: "#4f7942", aliases: ["이탈리아", "Kingdom of Italy", "Fascist Italy"] },
    JAP: { name: "Japan", color: "#b23b3b", aliases: ["일본 제국", "Empire of Japan", "Imperial Japan"] },
    MAN: { name: "Manchukuo", color: "#cc8844", aliases: ["만주국", "Manchuria", "Manchukuo"] },
    SOV: { name: "Soviet Union", color: "#8b1a1a", aliases: ["소련", "USSR", "Soviet Union", "Soviet Russia"] },
    GBR: { name: "British Empire", color: "#c0507a", aliases: ["대영제국", "영국", "United Kingdom", "Britain", "Great Britain"] },
    FRA: { name: "French Republic", color: "#3f6fd0", aliases: ["프랑스", "France", "French Empire"] },
    NLD: { name: "Netherlands", color: "#e08a2e", aliases: ["네덜란드", "Dutch Empire", "Holland"] },
    BEL: { name: "Belgium", color: "#b0902e", aliases: ["벨기에", "Belgian Empire"] },
    POR: { name: "Portugal", color: "#2e7d6b", aliases: ["포르투갈", "Portuguese Empire", "Estado Novo"] },
    ESP: { name: "Spain", color: "#d0a02e", aliases: ["스페인", "Spanish State"] },
    USA: { name: "United States", color: "#4a8f7a", aliases: ["미국", "America", "United States of America"] },
    YUG: { name: "Yugoslavia", color: "#6a8caf", aliases: ["유고슬라비아", "Kingdom of Yugoslavia"] },
    ROU: { name: "Romania", color: "#c08a3a", aliases: ["루마니아", "Kingdom of Romania"] },
    CHI: { name: "Republic of China", color: "#4a6db5", aliases: ["중화민국", "China", "Nationalist China", "Kuomintang"] },
    MON: { name: "Mongolian People's Republic", color: "#a85454", aliases: ["몽골", "Mongolia", "Outer Mongolia"] },
    DAN: { name: "Denmark", color: "#8a5f6d", aliases: ["덴마크", "Kingdom of Denmark"] },
  },

  // Whole-country grants (every GID_1 of these modern GID_0 -> owner).
  countryAssignments: {
    // — Greater Germany: Anschluss (Austria) + the Czech lands (Protectorate).
    // This grant IS the annexation, and it is why Austria and the Czech lands read
    // "Germany" on the map without a relabel: their owner is Germany.
    GER: ["DEU", "AUT", "CZE"],
    // Siam — independent in 1939, and not renamed until 1949. It owns its own land
    // rather than keeping the modern owner, which is what makes the era name real
    // instead of a label painted over "Thailand".
    SIA: ["THA"],
    // Slovakia: a German client state, distinct from the Czech Protectorate.
    SVK: ["SVK"],
    // — Italian Empire: Libya, Italian East Africa (Ethiopia/Eritrea/Somaliland), Albania (occ. Apr 1939).
    ITA: ["ITA", "LBY", "ETH", "ERI", "SOM", "ALB"],
    // — Empire of Japan: Korea, Taiwan, and the South Seas (Pacific) Mandate.
    JAP: ["JPN", "KOR", "TWN", "MNP", "PLW", "MHL", "FSM"],
    // — Soviet Union (1939 republics; Baltics & Bessarabia NOT yet annexed).
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
    // — British Empire: dominions + colonies + mandates + Gulf protectorates
    //   (Éire is neutral, left out; Egypt, Iraq and Nepal are treaty-bound but
    //   independent and keep their own governments).
    GBR: ["GBR", "LKA", "SDN", "GUY", "BLZ", "JAM", "TTO", "BHS", "BRB", "ATG", "DMA", "GRD", "KNA", "LCA", "CYM", "VGB", "TCA", "CYP", "MLT", "MYS", "SGP", "BRN", "JOR", "ISR", "PSE", "BHR", "QAT", "ARE", "KWT", "FJI", "SLB", "MUS", "SYC"],
    CAN: ["CAN"],
    AUS: ["AUS", "PNG"],
    NZL: ["NZL", "WSM"],
    SAF: ["ZAF", "NAM", "LSO", "SWZ"],
    BWA: ["NGA", "GHA", "SLE", "GMB"],
    BEA: ["KEN", "UGA", "TZA"],
    BCA: ["ZMB", "ZWE", "MWI", "BWA"],
    // 버마는 1937년 4월 인도에서 분리됐다 — 1939년에는 별개의 식민지다.
    RAJ: ["IND", "PAK", "BGD", "MMR"],
    // — French Empire: North Africa, Levant mandates, Indochina, West/Equatorial Africa, islands.
    FRA: ["FRA", "DZA", "TUN", "MAR", "SYR", "LBN", "CMR", "TGO", "MDG", "DJI", "COM", "GUF", "NCL", "PYF", "MYT", "REU", "GLP", "MTQ", "SPM", "WLF", "ATF"],
    AOF: ["SEN", "MLI", "CIV", "GIN", "BFA", "BEN", "NER", "MRT"],
    AEF: ["TCD", "CAF", "COG", "GAB"],
    FIC: ["VNM", "LAO", "KHM"],
    // — Dutch Empire.
    NLD: ["NLD", "SUR"],
    DEI: ["IDN"],
    // — Belgian Empire.
    BEL: ["BEL"],
    BCO: ["COD", "RWA", "BDI"],
    // — Portuguese Empire.
    POR: ["PRT", "AGO", "MOZ", "GNB", "CPV", "STP", "TLS"],
    // — Spanish State.
    ESP: ["ESP", "ESH", "GNQ"],
    // — United States + commonwealths/territories.
    USA: ["USA", "PHL", "PRI", "GUM", "VIR"],
    // — Kingdom of Yugoslavia (unified 1939).
    YUG: ["SRB", "HRV", "BIH", "MNE", "MKD", "SVN", "XKO"],
    // — Kingdom of Romania (incl. Bessarabia = modern Moldova, Romanian until 1940).
    ROU: ["ROU", "MDA"],
    // — Republic of China (Japanese-occupied east carved out below).
    CHI: ["CHN"],
    // — Mongolian People's Republic: a Soviet satellite (Khalkhin Gol is being
    //   fought on its border this very month).
    MON: ["MNG"],
    // — Kingdom of Denmark: Greenland, the Faroes and Iceland. Iceland is a
    //   sovereign kingdom in personal union on paper (1918 Act of Union), but
    //   Copenhagen runs its foreign affairs and the preset we compare to draws
    //   it as Danish ground until 17 June 1944 — see the Iceland note in
    //   eraGeometry.faceOwners above, and eraSovereignty's ISL row.
    DAN: ["DNK", "GRL", "FRO", "ISL"],
  },

  // Region-level exceptions (applied after, so they win).
  regionAssignments: {
    // ── 번왕국 (위 polities 주석 참조) ────────────────────────────────────
    // 잠무카슈미르는 셋을 합쳐야 번왕국 하나가 된다 — GADM이 분쟁지로 쪼개
    // 놓은 조각들이고, 1935년에는 도그라 왕조 한 사람의 땅이었다.
    "Z01.14_1": "JKS",  // 잠무 카슈미르
    "Z06.1_1": "JKS",   // 아자드 카슈미르 (1947년 이후 구분)
    "Z06.6_1": "JKS",   // 길기트-발티스탄
    // 라지푸타나는 거의 전부가 번왕국이었다 — 영국 직할지가 사실상 없다.
    "IND.29_1": "RJP",  // 라자스탄 = 라지푸타나 연합청
    // 하이데라바드 번왕국의 핵심. 니잠의 수도가 여기다.
    "IND.32_1": "HYD",  // 텔랑가나 = 하이데라바드
    // 아래 둘은 근사다. 마이소르 번왕국은 카르나타카 남부였고 북부는 봄베이
    // 관구였다. 트라방코르·코친은 케랄라 남부였고 북부 말라바르는 마드라스
    // 관구였다. 어느 쪽도 딱 맞지 않지만, "전부 영국 직할"보다는 훨씬 가깝다.
    "IND.16_1": "MYS",  // 카르나타카 ≈ 마이소르
    "IND.17_1": "TRV",  // 케랄라 ≈ 트라방코르 + 코친
    // ── 중국: 항전 3년차, 국민정부는 충칭으로 옮겨 갔다 ───────────────────────
    "CHN.25_1": "SHX",  // 산시 — 옌시산은 여전히 자기 성의 주인
    "CHN.28_1": "XIN",  // 신장 — 성스차이, 소련 후원
    "CHN.7_1": "GXC",   // 광시 — 신계계
    "CHN.30_1": "YUN",  // 윈난 — 룽윈, 버마 루트의 관문
    "CHN.26_1": "SZC",  // 쓰촨 — 전시 수도의 배후지
    "CHN.21_1": "MAC",  // 칭하이
    "CHN.20_1": "MAC",  // 닝샤
    "CHN.22_1": "CSR",  // 산시(섬서) — 옌안
    "CHN.29_1": "TIB",  // 시짱
    "CHN.19_1": "MGL",  // 내몽골 — 1939년 9월 몽강연합자치정부 성립
    "RUS.21_1": "GER",  // Kaliningrad = Königsberg: East Prussia is GERMAN until 1945
    "LTU.3_1": "GER",   // Memelland (Klaipeda), annexed March 1939
    "CHN.HKG": "GBR",   // Hong Kong, British colony
    // Manchukuo — Japanese puppet state in northeast China (the three Manchurian provinces).
    "CHN.11_1": "MAN",  // Heilongjiang
    "CHN.17_1": "MAN",  // Jilin
    "CHN.18_1": "MAN",  // Liaoning
    // Japanese-occupied China, Sept 1939 (two years into the Second Sino-Japanese
    // War): the northern plain, the lower Yangtze, the Canton coast and Hainan.
    // Free China (Chungking) holds the interior.
    "CHN.2_1": "JAP",   // Beijing
    "CHN.27_1": "JAP",  // Tianjin
    "CHN.10_1": "JAP",  // Hebei
    // "CHN.25_1": "JAP" 였다 — 위에서 옌시산에게 준 산시를 **뒤쪽 키가 조용히 덮어**
    // 산시 군벌이 0지역이 됐다. 일본은 1937년 11월 타이위안을 얻었지만 성 전체를
    // 쥔 적이 없다(제2전구는 1939년에도 서남부에서 싸운다). 한 지역은 쪼갤 수 없으니
    // 스펙이 처음에 고른 쪽 — 옌시산 — 을 남긴다.
    "CHN.23_1": "JAP",  // Shandong
    "CHN.15_1": "JAP",  // Jiangsu (Nanking)
    "CHN.24_1": "JAP",  // Shanghai
    "CHN.31_1": "JAP",  // Zhejiang (north)
    "CHN.13_1": "JAP",  // Hubei (Wuhan, fell Oct 1938)
    "CHN.6_1": "JAP",   // Guangdong (Canton, fell Oct 1938)
    "CHN.9_1": "JAP",   // Hainan (occupied Feb 1939)
    // "CHN.19_1": "JAP" 였다 — 같은 사고. 몽강연합자치정부는 **보드 날짜 그 달**
    // (1939년 9월)에 성립하고, 이 보드는 만주국을 이미 별도 폴리티로 그린다.
    // 괴뢰국을 일본색으로 칠하면 스펙이 선언한 나라가 지도에서 사라진다.
    // British Somaliland (the north of modern Somalia; the rest is Italian).
    "SOM.1_1": "GBR",   // Awdal
    "SOM.18_1": "GBR",  // Woqooyi Galbeed (Hargeisa)
    "SOM.17_1": "GBR",  // Togdheer
    "SOM.13_1": "GBR",  // Sanaag
    "SOM.16_1": "GBR",  // Sool
    // Aden Colony + the Aden Protectorates (southern/eastern Yemen); the north
    // stays the independent Mutawakkilite Kingdom of Yemen.
    "YEM.1_1": "GBR",   // 'Adan
    "YEM.15_1": "GBR",  // Lahij
    "YEM.2_1": "GBR",   // Abyan
    "YEM.4_1": "GBR",   // Al Dali'
    "YEM.20_1": "GBR",  // Shabwah
    "YEM.12_1": "GBR",  // Hadramawt
    "YEM.7_1": "GBR",   // Al Mahrah
  },

  // Era cities: [name, modern-seed-name | [lng,lat], tier, population].
  // tier 4 = great-power capital ★, 3 = major city ◆, 2 = city, 1 = town.
  // Names and populations as of 1939 (Danzig, Königsberg, Leningrad, Batavia...).
  cities: [
    // — Europe —
    ["Berlin", "Berlin", 4, 4339000],
    ["Hamburg", "Hamburg", 3, 1712000],
    ["Munich", "Munich", 2, 829000],
    ["Cologne", "Cologne", 2, 772000],
    ["Vienna", "Vienna", 3, 1918000], // annexed, 1938
    ["Prague", "Prague", 2, 962000], // Protectorate of Bohemia-Moravia
    ["Danzig", "Gdańsk", 2, 400000], // the Free City — the war's first prize
    ["Königsberg", "Kaliningrad", 2, 372000],
    ["Breslau", "Wrocław", 2, 630000],
    ["Warsaw", "Warsaw", 3, 1289000],
    ["London", "London", 4, 8615000],
    ["Manchester", "Manchester", 2, 736000],
    ["Glasgow", [-4.25, 55.86], 2, 1128000],
    ["Paris", "Paris", 4, 2830000],
    ["Marseille", "Marseille", 2, 914000],
    ["Rome", "Rome", 4, 1284000],
    ["Milan", "Milan", 3, 1116000],
    ["Naples", "Naples", 2, 866000],
    ["Madrid", "Madrid", 3, 1048000], // Franco's Spain, war just ended
    ["Barcelona", "Barcelona", 2, 1081000],
    ["Lisbon", "Lisbon", 2, 594000],
    ["Amsterdam", "Amsterdam", 2, 800000],
    ["Brussels", [4.35, 50.85], 2, 913000],
    ["Bern", [7.45, 46.95], 1, 122000],
    ["Copenhagen", "Copenhagen", 2, 700000],
    ["Oslo", "Oslo", 2, 276000],
    ["Stockholm", "Stockholm", 2, 570000],
    ["Helsinki", "Helsinki", 2, 291000],
    ["Tallinn", "Tallinn", 1, 145000],
    ["Riga", "Riga", 2, 385000],
    ["Kaunas", "Kaunas", 1, 152000], // interwar Lithuanian capital
    ["Budapest", "Budapest", 3, 1163000],
    ["Bucharest", "Bucharest", 2, 870000],
    ["Belgrade", "Belgrade", 2, 320000],
    ["Sofia", "Sofia", 2, 401000],
    ["Athens", "Athens", 2, 481000],
    ["Dublin", "Dublin", 1, 472000],
    // — Soviet Union —
    ["Moscow", "Moscow", 4, 4137000],
    ["Leningrad", [30.32, 59.94], 3, 3191000],
    ["Stalingrad", "Volgograd", 2, 445000],
    ["Kiev", "Kyiv", 2, 847000],
    ["Kharkov", "Kharkiv", 2, 833000],
    ["Minsk", "Minsk", 2, 239000],
    ["Odessa", "Odesa", 2, 604000],
    ["Baku", "Baku", 2, 809000], // the oil fields
    ["Tbilisi", "Tbilisi", 1, 519000],
    ["Tashkent", "Tashkent", 2, 585000],
    ["Novosibirsk", "Novosibirsk", 1, 404000],
    ["Vladivostok", "Vladivostok", 1, 206000],
    // — Middle East and Africa —
    ["Istanbul", "Istanbul", 3, 793000],
    ["Ankara", "Ankara", 2, 157000],
    ["Tehran", "Tehran", 2, 540000],
    ["Baghdad", "Baghdad", 2, 400000],
    ["Jerusalem", "Jerusalem", 1, 132000], // British Mandate
    ["Cairo", "Cairo", 3, 1312000],
    ["Alexandria", "Alexandria", 2, 686000],
    ["Tripoli", "Tripoli", 1, 111000], // Italian Libya
    ["Algiers", "Algiers", 2, 252000],
    ["Casablanca", "Casablanca", 2, 257000],
    ["Dakar", "Dakar", 1, 92000],
    ["Lagos", "Lagos", 1, 167000],
    ["Léopoldville", "Kinshasa", 1, 46000], // Belgian Congo
    ["Nairobi", "Nairobi", 1, 61000],
    ["Addis Ababa", "Addis Ababa", 2, 300000], // occupied Italian East Africa
    ["Johannesburg", "Johannesburg", 2, 500000],
    ["Cape Town", "Cape Town", 2, 344000],
    // — Asia —
    ["Tokyo", "Tokyo", 4, 6779000],
    ["Osaka", "Ōsaka", 3, 3252000],
    ["Kyoto", [135.77, 35.01], 2, 1090000],
    ["Hiroshima", "Hiroshima", 1, 344000],
    ["Keijo", "Seoul", 2, 774000], // colonial Seoul
    ["Hsinking", [125.32, 43.88], 2, 415000], // capital of Manchukuo
    ["Mukden", "Shenyang", 2, 863000],
    ["Peiping", "Beijing", 3, 1556000], // occupied
    ["Tientsin", "Tianjin", 3, 1210000], // occupied
    ["Shanghai", "Shanghai", 4, 3727000], // occupied — the foreign concessions remain
    ["Nanking", "Nanjing", 2, 700000], // occupied
    ["Chungking", "Chongqing", 3, 635000], // Free China's wartime capital
    ["Canton", "Guangzhou", 2, 1122000], // occupied
    ["Hong Kong", "Hong Kong", 2, 1050000],
    ["Hanoi", "Hanoi", 2, 149000], // French Indochina
    ["Saigon", "Ho Chi Minh City", 2, 256000],
    ["Bangkok", "Bangkok", 2, 681000],
    ["Rangoon", [96.16, 16.87], 2, 400000], // British Burma
    ["Singapore", "Singapore", 2, 728000], // the fortress
    ["Batavia", "Jakarta", 2, 533000], // Dutch East Indies capital
    ["Manila", "Manila", 2, 623000], // U.S. Commonwealth
    ["Delhi", "Delhi", 3, 522000], // capital of the British Raj
    ["Bombay", "Mumbai", 3, 1490000],
    ["Calcutta", [88.36, 22.57], 3, 2109000],
    ["Karachi", "Karachi", 2, 387000],
    ["Colombo", "Colombo", 1, 362000],
    // — The Americas —
    ["New York", "New York", 4, 7455000],
    ["Washington", [-77.04, 38.91], 3, 663000],
    ["Chicago", "Chicago", 3, 3397000],
    ["Detroit", "Detroit", 2, 1623000],
    ["Los Angeles", "Los Angeles", 3, 1504000],
    ["San Francisco", "San Francisco", 2, 635000],
    ["Honolulu", "Honolulu", 1, 179000],
    ["Ottawa", "Ottawa", 2, 155000],
    ["Toronto", "Toronto", 2, 667000],
    ["Montreal", "Montréal", 2, 903000],
    ["Vancouver", "Vancouver", 1, 275000],
    ["Mexico City", "Mexico City", 3, 1560000],
    ["Havana", "Havana", 2, 570000],
    ["Caracas", "Caracas", 1, 269000],
    ["Bogotá", "Bogotá", 1, 330000],
    ["Lima", "Lima", 2, 533000],
    ["Santiago", "Santiago", 2, 952000],
    ["Buenos Aires", "Buenos Aires", 3, 2400000],
    ["Montevideo", "Montevideo", 2, 700000],
    ["Rio de Janeiro", "Rio de Janeiro", 3, 1764000],
    ["São Paulo", "São Paulo", 3, 1258000],
    // — Oceania —
    ["Sydney", "Sydney", 2, 1302000],
    ["Melbourne", "Melbourne", 2, 1046000],
    ["Canberra", "Canberra", 1, 11000],
    ["Wellington", "Wellington", 1, 158000],
    ["Auckland", "Auckland", 1, 221000],
  ],

  simulationRules:
    "It is 1 September 1939. Germany has just invaded Poland; Britain and France will " +
    "declare war within 48 hours, beginning the Second World War. The Molotov–Ribbentrop " +
    "Pact is in force: the USSR will invade eastern Poland on 17 September and is not yet a " +
    "belligerent. The Baltic states (Estonia, Latvia, Lithuania) and Romanian Bessarabia are " +
    "still independent/Romanian but will be pressured by the USSR in 1940. Italy is non-" +
    "belligerent until June 1940. The United States is neutral and isolationist. Japan is two " +
    "years into its war with the Republic of China: it holds Korea, Taiwan, Manchukuo, the " +
    "Pacific mandates and occupied eastern China (the northern plain, the lower Yangtze, " +
    "Canton and Hainan), while Chiang Kai-shek's Nationalists fight on from Chungking in the " +
    "interior, with Communist guerrillas active behind Japanese lines. Mongolia is a Soviet " +
    "satellite where Zhukov is beating the Japanese at Khalkhin Gol this very month. " +
    "Technology and economy must reflect 1939: NO nuclear weapons (until 1945), " +
    "propeller aircraft, evolving armored/blitzkrieg doctrine, battleships and carriers at " +
    "sea. Colonial empires (British, French, Dutch, Belgian, Portuguese) are intact and " +
    "supply manpower and resources to their mother countries. Note that the map shows modern " +
    "province borders approximating 1939 control; the Polish Corridor, Danzig and the exact " +
    "Sudeten line are approximate. " +

    // Same clause as wwii-1935 minus the Anschluss, which is eighteen months
    // past on this board. See that spec for why these are stated case by case.
    "WHEN HISTORY IS BLOCKED, IT DOES NOT EVAPORATE — IT LOOKS FOR ANOTHER " +
    "ROUTE. A power denied what the period says it wanted still wants it and " +
    "reaches for the next means. Two cases this board turns on immediately. " +
    "If Britain and France appease the invasion of Poland instead of declaring " +
    "war, Germany reads that correctly and keeps demanding and taking — one " +
    "more claim, then another — and does not stop until it turns east against " +
    "the Soviet Union; the war that did not start in September starts later " +
    "and on worse terms for whoever conceded. If Germany is more than three " +
    "months late into Norway, the Allies land there first and cut the iron ore " +
    "off at Narvik, and the Reich's war economy feels it for the rest of the " +
    "war. Beyond these, apply the same reasoning to whatever the player " +
    "actually blocks: name the interest that was frustrated, and let the world " +
    "pursue it by the next available means rather than dropping it.",

  startingTimelineText:
    "September 1939. At dawn the German battleship Schleswig-Holstein opens fire on the Polish " +
    "garrison at Westerplatte and 1.5 million Wehrmacht troops pour across the frontier behind " +
    "screaming Stukas and racing panzers — the first Blitzkrieg. In Berlin the swastika flies " +
    "over a Reich that has swallowed Austria, the Sudetenland and Bohemia. In London and Paris, " +
    "Chamberlain and Daladier honor their guarantee to Poland as the clocks run down to war. " +
    "Stalin waits in Moscow with a secret protocol in hand; Mussolini hesitates in Rome; Roosevelt " +
    "watches from a neutral America. The British and French empires still circle the globe in red " +
    "and blue. The world holds its breath.",
};

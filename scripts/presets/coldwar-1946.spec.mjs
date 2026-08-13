/*! Open Historia — Cold War 1946 scenario preset © 2026 Nicholas Krol, MIT (see src/Editor/LICENSE). */
// Dawn of the Cold War — 5 March 1946, the day Churchill stands up in Fulton,
// Missouri and says the words "iron curtain". The shooting war is six months
// over; the forty-year confrontation is beginning TODAY, and almost nothing
// about it is settled: Germany and Korea are occupied grids, China's truce is
// collapsing, Soviet troops are past their withdrawal deadline in Iran, and
// exactly one country on Earth has the atomic bomb.
//
// Same modern-region approximation discipline as the other presets. 1946 is
// the era the modern grid fits BEST — the postwar settlement drew today's
// map — so the interesting work is occupation, not borders: Germany's zones
// are granted to their occupiers Land by Land (the occupation IS the
// ownership), Korea is split at the 38th parallel into the two military
// administrations, and the notes carry what a map cannot say (quadripartite
// Berlin and Vienna, communist base areas inside China, Trieste).

export default {
  id: "coldwar-1946",

  meta: {
    name: "Cold War — 1946",
    heroTitle: "Dawn of the Cold War",
    heroSubtitle: "An iron curtain descends, 5 March 1946",
    eyebrow: "The Bipolar World",
    subtitle: "5 March 1946",
    accentColor: "#2f4a6b",
    coverImage: "public/loading_screen_2.jpg",
    description:
      "The guns are silent and the world is wreckage and possibility. Today Churchill " +
      "names the iron curtain; Soviet tanks sit past their deadline in Iran; Germany, " +
      "Austria and Korea are occupied grids; China slides back into civil war; and only " +
      "one power owns the bomb. Shape the peace — or the next war.",
  },

  relabelOwnedCountries: false,

  // 1946 borders ARE (mostly) modern borders — the unassigned world keeps its
  // modern owner, and that is historically right for almost everyone.
  unassignedKeepModernOwner: true,

  // Player starts as the Soviet Union — the power the speech is about, holding
  // half of Europe and facing an atomic monopoly with conventional mass.
  game: { country: "SOV", startDate: "1946-03-05", gameDate: "1946-03-05" },

  // Plan F-3: era geometry graft. Declared after the 2026-08-12 date batch
  // measured this date at 배정 39 · 실질 44.2% from the cached Overpass response —
  // the same band as the grafted 1836 baseline. The build discovers
  // era-borders-1946-03-05*.geojson in scripts/ohm/out and grafts matching
  // faces; absent the dump it builds exactly as before, and says so.
  // faceOwners left empty: naming the frame-residue face and the colonial
  // holdings is a per-board pass over the ASSEMBLED faces, same as 1939.
  eraGeometry: {
    date: "1946-03-05",
    window: [-15, 30, 50, 72],
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
    // ── 소련: 1940년 병합 이후의 16개 연방 공화국 ────────────────────────────
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
    // ── 제국은 색이 아니라 행정부다 ───────────────────────────────────────────
    RAJ: { name: "British Raj", color: "#c07a8a", aliases: ["영국령 인도", "인도 제국", "British India", "India"] },
    AOF: { name: "French West Africa", color: "#5a7fc0", aliases: ["프랑스령 서아프리카", "Afrique-Occidentale française", "AOF"] },
    AEF: { name: "French Equatorial Africa", color: "#4a6fb0", aliases: ["프랑스령 적도아프리카", "Afrique-Équatoriale française", "AEF"] },
    FIC: { name: "French Indochina", color: "#6a8fd0", aliases: ["프랑스령 인도차이나", "Indochine française", "Indochina"] },
    DEI: { name: "Dutch East Indies", color: "#d08a4a", aliases: ["네덜란드령 동인도", "Nederlands-Indië", "Dutch East Indies", "Indonesia"] },
    BCO: { name: "Belgian Congo", color: "#8a9a3a", aliases: ["벨기에령 콩고", "Congo belge", "Belgian Congo"] },
    SOV: { name: "Soviet Union", color: "#8b1a1a", aliases: ["소련", "USSR", "Soviet Russia", "Stalin's Russia"] },
    USA: { name: "United States", color: "#4a8f7a", aliases: ["미국", "America", "United States of America"] },
    GBR: { name: "British Empire", color: "#c0507a", aliases: ["대영제국", "영국", "United Kingdom", "Britain", "Great Britain"] },
    FRA: { name: "French Republic", color: "#3f6fd0", aliases: ["프랑스", "France", "Fourth Republic", "French Union"] },
    // Occupied Germany has NO German state until 1949 — the zones belong to
    // their occupiers on this map. Austria differs: occupied by four powers
    // but with an elected government since November 1945.
    AUS: { name: "Allied-occupied Austria", color: "#b8b8c8", aliases: ["연합군 점령하 오스트리아", "오스트리아", "Austria", "Second Austrian Republic"] },
    CSK: { name: "Czechoslovakia", color: "#5b7fae", aliases: ["체코슬로바키아", "Czechoslovak Republic", "Third Republic"] },
    YUG: { name: "Yugoslavia", color: "#6a8caf", aliases: ["유고슬라비아", "FPR Yugoslavia", "Tito's Yugoslavia"] },
    ITA: { name: "Italy", color: "#4f7942", aliases: ["이탈리아", "Kingdom of Italy", "Italy (referendum pending)"] },
    ESP: { name: "Spain", color: "#d0a02e", aliases: ["스페인", "Francoist Spain", "Spanish State"] },
    POR: { name: "Portugal", color: "#2e7d6b", aliases: ["포르투갈", "Portuguese Empire", "Estado Novo"] },
    NLD: { name: "Netherlands", color: "#e08a2e", aliases: ["네덜란드", "Dutch Empire", "Holland"] },
    BEL: { name: "Belgium", color: "#b0902e", aliases: ["벨기에", "Belgian Empire"] },
    DAN: { name: "Denmark", color: "#8a5f6d", aliases: ["덴마크", "Kingdom of Denmark"] },
    JAP: { name: "Allied-occupied Japan", color: "#b23b3b", aliases: ["연합군 점령하 일본", "일본", "Japan", "SCAP Japan", "Occupied Japan"] },
    // Korea, divided at the 38th parallel — the two military administrations
    // that become two states in 1948. For a map read in Korean, this is the
    // era's defining fact and it gets drawn, not footnoted.
    KOS: { name: "US Military Government in Korea", color: "#3a7fbf", aliases: ["미군정 조선", "남조선", "USAMGIK", "Southern Korea", "미군정"] },
    KON: { name: "Soviet Civil Administration in Korea", color: "#a33232", aliases: ["소련군정 조선", "북조선", "Northern Korea", "소련군정"] },
    CHI: { name: "Republic of China", color: "#4a6db5", aliases: ["중화민국", "China", "Nationalist China", "Kuomintang"] },
    MON: { name: "Mongolian People's Republic", color: "#a85454", aliases: ["몽골", "Mongolia", "Outer Mongolia"] },
    SIA: { name: "Siam", color: "#4068bf", aliases: ["시암", "Thailand", "Kingdom of Siam"] },
  },

  countryAssignments: {
    // — The Soviet Union at its 1945 extent: the Baltics annexed, Bessarabia
    //   annexed, Kaliningrad and Carpathian Ruthenia and Tuva all inside the
    //   modern grid already. Eastern Europe is OCCUPIED, not annexed — those
    //   countries keep their own (Soviet-dominated) governments.
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
    // — The United States: the Philippines four months from promised
    //   independence, the Pacific islands taken from Japan under military
    //   government (the UN trusteeship comes next year).
    USA: ["USA", "PHL", "PRI", "GUM", "VIR", "MNP", "PLW", "MHL", "FSM"],
    // — The British Empire, intact for two more years: the Raj (partition is
    //   1947), the Palestine Mandate, Transjordan (independence treaty this
    //   month!), and military administration of Italy's former colonies.
    GBR: ["GBR", "LKA", "SDN", "GUY", "BLZ", "JAM", "TTO", "BHS", "BRB", "ATG", "DMA", "GRD", "KNA", "LCA", "CYM", "VGB", "TCA", "CYP", "MLT", "MYS", "SGP", "BRN", "JOR", "ISR", "PSE", "BHR", "QAT", "ARE", "KWT", "FJI", "SLB", "MUS", "SYC"],
    CAN: ["CAN"],
    AUS: ["AUS", "PNG"],
    NZL: ["NZL", "WSM"],
    SAF: ["ZAF", "NAM", "LSO", "SWZ"],
    BWA: ["NGA", "GHA", "SLE", "GMB"],
    BEA: ["KEN", "UGA", "TZA"],
    BCA: ["ZMB", "ZWE", "MWI", "BWA"],
    // 인도 독립은 1947년 8월 — 1946년 3월에는 아직 제국의 인도다.
    RAJ: ["IND", "PAK", "BGD", "MMR"],
    // — France: the empire holds, but Syria and Lebanon are GONE (independent,
    //   last French troops leaving this spring) and Indochina is a returning
    //   colonial power negotiating with Ho Chi Minh's declared republic —
    //   the Ho–Sainteny accord was signed YESTERDAY (6 March: the map shows
    //   the French claim; the rules carry the DRV reality).
    FRA: ["FRA", "DZA", "TUN", "MAR", "CMR", "TGO", "MDG", "DJI", "COM", "GUF", "NCL", "PYF", "MYT", "REU", "GLP", "MTQ", "SPM", "WLF", "ATF"],
    AOF: ["SEN", "MLI", "CIV", "GIN", "BFA", "BEN", "NER", "MRT"],
    AEF: ["TCD", "CAF", "COG", "GAB"],
    // 1945년 9월 하노이에서 독립이 선포됐고 프랑스는 그것을 인정하지 않는다.
    FIC: ["VNM", "LAO", "KHM"],
    AUS: ["AUT"],
    CSK: ["CZE", "SVK"],
    YUG: ["SRB", "HRV", "BIH", "MNE", "MKD", "SVN", "XKO"],
    ITA: ["ITA"],
    ESP: ["ESP", "ESH", "GNQ"],
    POR: ["PRT", "AGO", "MOZ", "GNB", "CPV", "STP", "TLS"],
    // — The Dutch are fighting their way back into an Indonesia that declared
    //   independence in August 1945: the map shows the colonial claim, the
    //   rules carry the Republic on Java and Sumatra.
    NLD: ["NLD", "SUR"],
    DEI: ["IDN"],
    BEL: ["BEL"],
    BCO: ["COD", "RWA", "BDI"],
    DAN: ["DNK", "GRL", "FRO"],
    JAP: ["JPN"],
    KOS: ["KOR"],
    KON: ["PRK"],
    // — China: Taiwan and Manchuria recovered on paper; the civil war is
    //   restarting in fact (Marshall's truce is weeks from collapse).
    CHI: ["CHN", "TWN"],
    MON: ["MNG"],
    SIA: ["THA"],
  },

  regionAssignments: {
    // ── Occupied Germany, Land by Land. No German state exists; the zone IS
    //    the owner. Berlin is quadripartite — the grid gives it to its
    //    surrounding zone and the rules say the truth. ──
    // Soviet zone:
    "DEU.4_1": "SOV",   // Brandenburg
    "DEU.8_1": "SOV",   // Mecklenburg-Vorpommern
    "DEU.14_1": "SOV",  // Sachsen
    "DEU.13_1": "SOV",  // Sachsen-Anhalt
    "DEU.16_1": "SOV",  // Thüringen
    "DEU.3_1": "SOV",   // Berlin (quadripartite in truth — see rules)
    // British zone:
    "DEU.10_1": "GBR",  // Nordrhein-Westfalen (the Ruhr)
    "DEU.9_1": "GBR",   // Niedersachsen
    "DEU.15_1": "GBR",  // Schleswig-Holstein
    "DEU.6_1": "GBR",   // Hamburg
    // American zone (plus the Bremen enclave):
    "DEU.2_1": "USA",   // Bayern
    "DEU.7_1": "USA",   // Hessen
    "DEU.1_1": "USA",   // Baden-Württemberg (the French hold its south — approximation noted)
    "DEU.5_1": "USA",   // Bremen (the American port enclave inside the British zone)
    // French zone:
    "DEU.11_1": "FRA",  // Rheinland-Pfalz
    "DEU.12_1": "FRA",  // Saarland (Paris is already detaching it economically)

    "CHN.HKG": "GBR",   // Hong Kong, reoccupied September 1945
  },

  // Era cities: [name, modern-seed-name | [lng,lat], tier, population ~1946].
  cities: [
    // — Occupied Germany and Austria —
    ["Berlin", "Berlin", 3, 3170000], // four sectors in the rubble
    ["Nuremberg", [11.08, 49.45], 2, 350000], // the tribunal is sitting NOW
    ["Frankfurt", [8.68, 50.11], 2, 424000], // US military government seat
    ["Hamburg", "Hamburg", 2, 1350000], // British zone
    ["Munich", "Munich", 2, 750000], // American zone
    ["Cologne", "Cologne", 1, 450000], // bombed to a third of its size
    ["Dresden", [13.74, 51.05], 1, 450000], // the firestorm's ruin
    ["Vienna", "Vienna", 3, 1700000], // four sectors, one elected government
    // — The new Soviet edge of Europe —
    ["Warsaw", "Warsaw", 2, 480000], // razed, defiantly rebuilding
    ["Königsberg", "Kaliningrad", 1, 120000], // Kaliningrad within months
    ["Prague", "Prague", 3, 920000], // free for two more years
    ["Budapest", "Budapest", 2, 830000], // siege-scarred, occupied
    ["Bucharest", "Bucharest", 2, 900000],
    ["Sofia", "Sofia", 2, 400000],
    ["Belgrade", "Belgrade", 2, 370000], // Tito's capital
    ["Trieste", [13.77, 45.65], 1, 270000], // the contested port
    // — Western Europe —
    ["London", "London", 4, 8200000], // victorious, broke, rationed
    ["Paris", "Paris", 4, 2725000],
    ["Rome", "Rome", 3, 1500000], // monarchy on the June ballot
    ["Milan", "Milan", 2, 1260000],
    ["Madrid", "Madrid", 3, 1120000], // Franco's isolated Spain
    ["Lisbon", "Lisbon", 2, 700000],
    ["Amsterdam", "Amsterdam", 2, 800000],
    ["Brussels", [4.35, 50.85], 2, 950000],
    ["Bern", [7.45, 46.95], 1, 130000],
    ["Copenhagen", "Copenhagen", 2, 720000],
    ["Oslo", "Oslo", 2, 290000],
    ["Stockholm", "Stockholm", 2, 670000], // untouched by the war
    ["Helsinki", "Helsinki", 2, 340000], // independence kept, at a price
    ["Dublin", "Dublin", 2, 500000],
    ["Athens", "Athens", 2, 1100000], // civil war smoldering
    ["Reykjavík", [-21.94, 64.15], 1, 47000], // republic since 1944
    // — Soviet Union —
    ["Moscow", "Moscow", 4, 4100000],
    ["Leningrad", [30.32, 59.94], 3, 2000000], // the siege's survivor
    ["Stalingrad", "Volgograd", 1, 250000], // the ruin that turned the war
    ["Kiev", "Kyiv", 2, 480000],
    ["Minsk", "Minsk", 1, 120000], // obliterated and rebuilding
    ["Riga", "Riga", 2, 350000], // annexed
    ["Tallinn", "Tallinn", 1, 130000], // annexed
    ["Vilnius", [25.28, 54.69], 1, 110000], // annexed
    ["Baku", "Baku", 2, 800000],
    ["Tbilisi", "Tbilisi", 2, 560000],
    ["Tashkent", "Tashkent", 2, 700000],
    ["Novosibirsk", "Novosibirsk", 2, 600000],
    ["Vladivostok", "Vladivostok", 1, 250000],
    // — The Middle East and the first crisis —
    ["Tehran", "Tehran", 3, 880000], // Soviet troops PAST their deadline
    ["Tabriz", [46.29, 38.08], 1, 214000], // capital of the Soviet-backed Azerbaijan People's Government
    ["Istanbul", "Istanbul", 3, 900000], // under Soviet pressure for the Straits
    ["Ankara", "Ankara", 2, 227000],
    ["Cairo", "Cairo", 3, 2100000],
    ["Alexandria", "Alexandria", 2, 950000],
    ["Jerusalem", "Jerusalem", 2, 165000], // the Mandate's last years
    ["Tel Aviv", [34.78, 32.08], 2, 200000],
    ["Damascus", [36.29, 33.51], 2, 300000], // newly independent Syria
    ["Beirut", [35.5, 33.89], 2, 230000], // newly independent Lebanon
    ["Baghdad", "Baghdad", 2, 550000],
    ["Amman", "Amman", 1, 65000], // independence treaty this month
    ["Riyadh", "Riyadh", 1, 80000],
    // — Occupied Japan and divided Korea —
    ["Tokyo", "Tokyo", 4, 3440000], // firebombed, occupied, rewriting its constitution
    ["Osaka", "Ōsaka", 2, 1600000],
    ["Hiroshima", "Hiroshima", 1, 140000], // seven months after
    ["Seoul", "Seoul", 3, 900000], // USAMGIK headquarters
    ["Pyongyang", "Pyongyang", 2, 300000], // the Soviet administration's seat
    ["Busan", "Busan", 2, 400000],
    // — China's resuming civil war —
    ["Nanking", "Nanjing", 3, 1000000], // the Nationalist capital, home again
    ["Shanghai", "Shanghai", 4, 4300000],
    ["Peiping", "Beijing", 3, 1700000],
    ["Chungking", "Chongqing", 2, 1000000],
    ["Canton", "Guangzhou", 2, 1100000],
    ["Mukden", "Shenyang", 2, 1100000], // Soviets leaving, civil war arriving
    ["Harbin", [126.63, 45.75], 2, 700000],
    ["Yan'an", [109.49, 36.59], 1, 40000], // Mao's base area
    ["Taipei", "Taipei", 2, 300000], // recovered province
    ["Hong Kong", "Hong Kong", 2, 1200000],
    ["Urga", "Ulaanbaatar", 1, 60000], // recognized by China in January
    ["Lhasa", [91.12, 29.65], 1, 30000],
    // — South and Southeast Asia: the fuse of decolonization —
    ["Delhi", "Delhi", 3, 700000], // the Cabinet Mission arrives this month
    ["Bombay", "Mumbai", 3, 1660000],
    ["Calcutta", [88.36, 22.57], 3, 2100000],
    ["Karachi", "Karachi", 2, 400000],
    ["Colombo", "Colombo", 1, 360000],
    ["Rangoon", [96.16, 16.87], 2, 500000],
    ["Bangkok", "Bangkok", 2, 780000],
    ["Singapore", "Singapore", 2, 940000],
    ["Batavia", "Jakarta", 2, 850000], // the Republic calls it Jakarta
    ["Hanoi", "Hanoi", 2, 200000], // the DRV's capital, French troops landing
    ["Saigon", "Ho Chi Minh City", 2, 500000],
    ["Manila", "Manila", 2, 980000], // independence on July 4
    ["Kabul", "Kabul", 1, 200000],
    // — Africa —
    ["Algiers", "Algiers", 2, 300000],
    ["Casablanca", "Casablanca", 2, 550000],
    ["Tunis", "Tunis", 1, 340000],
    ["Tripoli", "Tripoli", 1, 120000], // British military administration
    ["Addis Ababa", "Addis Ababa", 2, 200000], // restored empire
    ["Lagos", "Lagos", 1, 220000],
    ["Léopoldville", "Kinshasa", 1, 100000],
    ["Nairobi", "Nairobi", 1, 100000],
    ["Johannesburg", "Johannesburg", 2, 700000],
    ["Cape Town", "Cape Town", 2, 470000],
    ["Dakar", "Dakar", 1, 130000],
    // — The Americas —
    ["New York", "New York", 4, 7772000], // the UN's interim home
    ["Washington", [-77.04, 38.91], 4, 900000],
    ["Chicago", "Chicago", 3, 3600000],
    ["Detroit", "Detroit", 2, 1800000],
    ["Los Angeles", "Los Angeles", 3, 1900000],
    ["San Francisco", "San Francisco", 2, 770000],
    ["Honolulu", "Honolulu", 1, 250000],
    ["Ottawa", "Ottawa", 2, 180000],
    ["Toronto", "Toronto", 2, 700000],
    ["Montreal", "Montréal", 2, 1000000],
    ["Mexico City", "Mexico City", 3, 1800000],
    ["Havana", "Havana", 2, 700000],
    ["Caracas", "Caracas", 2, 400000],
    ["Bogotá", "Bogotá", 2, 500000],
    ["Lima", "Lima", 2, 640000],
    ["Santiago", "Santiago", 2, 1200000],
    ["Buenos Aires", "Buenos Aires", 4, 2900000], // Perón elected LAST MONTH
    ["Montevideo", "Montevideo", 2, 770000],
    ["Rio de Janeiro", "Rio de Janeiro", 3, 2000000],
    ["São Paulo", "São Paulo", 3, 1600000],
    // — Oceania —
    ["Sydney", "Sydney", 2, 1500000],
    ["Melbourne", "Melbourne", 2, 1230000],
    ["Canberra", "Canberra", 1, 15000],
    ["Wellington", "Wellington", 1, 180000],
    ["Auckland", "Auckland", 1, 280000],
  ],

  simulationRules:
    "It is 5 March 1946, six months after Japan's surrender. TODAY Churchill delivers the " +
    "Fulton speech naming the 'iron curtain' — the Cold War's opening declaration. The " +
    "UNITED STATES ALONE possesses atomic weapons (the Soviet bomb is 1949 historically; " +
    "espionage is already feeding Moscow). Germany has NO government: it is four occupation " +
    "zones ruled by the US, Britain, France and the USSR, with Berlin under quadripartite " +
    "rule INSIDE the Soviet zone though the map shows it Soviet; the Nuremberg tribunal is " +
    "sitting. Austria is occupied by the same four powers but has an elected government. " +
    "Korea is divided at the 38th parallel into American and Soviet military administrations " +
    "— two rival Korean states form by 1948 historically. Japan is under MacArthur's SCAP, " +
    "rewriting its constitution. Eastern Europe (Poland, Hungary, Romania, Bulgaria) has its " +
    "own governments under Soviet military presence — the full communist takeovers come " +
    "1947-48. The FIRST CRISIS is live: Soviet troops remain in northern Iran past the " +
    "2 March withdrawal deadline, backing separatist governments in Tabriz — the new UN's " +
    "first great test. China's Marshall truce is collapsing: Nationalists and Communists race " +
    "for Manchuria as Soviet forces withdraw (full civil war by summer). Decolonization is a " +
    "lit fuse: the Cabinet Mission reaches India this month (partition 1947), the Viet Minh " +
    "govern in Hanoi under yesterday's Ho-Sainteny accord while French troops return (war by " +
    "December), Indonesia's declared Republic fights the returning Dutch, Transjordan signs " +
    "its independence treaty this month, and Italy's colonies sit under British military " +
    "administration awaiting the peace treaty. The Philippines becomes independent on 4 July " +
    "1946. Technology: first-generation jets, mature radar, V-2-derived rocketry in US and " +
    "Soviet labs, atomic power US-only; economies are rationed, ruined and rebuilding — " +
    "UNRRA relief, Bretton Woods institutions newborn, Britain living on an American loan. " +
    "MAP APPROXIMATIONS: Berlin and Vienna's four-power sectors, the Free Territory of " +
    "Trieste, communist base areas inside China, and the DRV's actual control of northern " +
    "Vietnam are realities the region grid cannot draw — narrate them.",

  startingTimelineText:
    "March 1946. In a college gymnasium in Fulton, Missouri, with Truman on the platform, " +
    "Churchill declares that from Stettin in the Baltic to Trieste in the Adriatic, an iron " +
    "curtain has descended across the continent. The words give a name to what half of " +
    "Europe already lives: Soviet garrisons from the Elbe to the Danube, coalition " +
    "governments hollowing out one ministry at a time. In Iran, Red Army columns sit past " +
    "their treaty deadline while the infant United Nations hears its first crisis. In " +
    "Nuremberg the surviving architects of the Reich listen to the evidence against them. " +
    "Tokyo types a new constitution under MacArthur's eye; Seoul and Pyongyang drift apart " +
    "under rival flags; in Manchuria, Nationalist columns and Lin Biao's armies race into " +
    "the vacuum the Soviets leave behind. India awaits the Cabinet Mission, Ho Chi Minh " +
    "signs with France and trusts it as far as he must, and in the New Mexico desert the " +
    "only atomic arsenal on Earth belongs to a republic that mostly wants to go home. The " +
    "war is over. The century's second struggle begins.",
};

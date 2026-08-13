/*! Open Historia — WWI 1914 scenario preset © 2026 Nicholas Krol, MIT (see src/Editor/LICENSE). */
// World War I preset — 28 July 1914 (the day Austria-Hungary declares war on
// Serbia). The July Crisis has just tipped over: the war exists, but only
// between two states — every other great power is hours or days from its own
// decision, which is exactly the moment worth handing to a player.
//
// Borders are approximated from modern admin-1 regions, same discipline as
// wwii-1939: override only where 1914 differs from today, note every
// approximation the region grid cannot express. The four empires that no
// longer exist (German, Austro-Hungarian, Russian, Ottoman) are assembled
// from their modern successor states region by region.
//
// KNOWN GRID LIMITS (all noted in simulationRules so the model narrates them
// correctly even where the map cannot draw them):
// - Alsace-Lorraine was GERMAN in 1914 but modern Grand Est also swallows
//   Champagne, so granting it would put Reims in the Kaiserreich. Left French
//   on the map; the rules state the truth. (Plan F era geometry will fix it.)
// - Northern Schleswig (German until 1920) hides inside Syddanmark — same
//   trade-off, left Danish.
// - Western Thrace was Bulgarian 1913-1919, but the modern Greek region also
//   holds Kavala (Greek since 1913) — left Greek, noted.
// - Kiautschou (Tsingtao), German Kamerun's Neukamerun strips, and German New
//   Guinea are below the grid or split modern countries — Tsingtao and New
//   Guinea are noted; Kamerun proper IS granted (the modern country matches).

export default {
  id: "ww1-1914",

  meta: {
    name: "World War I — 1914",
    heroTitle: "The Last Summer",
    heroSubtitle: "Austria has declared war on Serbia, and the alliances begin to pull",
    eyebrow: "The Great War",
    subtitle: "28 July 1914",
    accentColor: "#5a4a2f",
    coverImage: "public/loading_screen_2.jpg",
    description:
      "Five weeks after a shot in Sarajevo, Vienna has declared war on Belgrade and the machinery starts to turn. Russia mobilises to protect the Serbs, which obliges Germany, which obliges France, and every general staff insists that arriving late is the same as losing. Four dynastic empires — Habsburg, Hohenzollern, Romanov, Ottoman — govern most of Europe and every one of them will be gone within five years, though nobody alive today believes it. Europe's powers command more of the earth than any civilisation before them, and are about to spend it. Take any of them into the war that ends their world.",

  },

  relabelOwnedCountries: false,

  // 1914 is near-modern enough for the Americas and parts of Asia: unassigned
  // countries (Mexico, Brazil, Ethiopia, Afghanistan...) were real sovereign
  // states and keep their modern owner.
  unassignedKeepModernOwner: true,

  // Player starts as Austria-Hungary — the power that just pulled the trigger,
  // with the shortest fuse and the hardest hand to play.
  game: { country: "AUH", startDate: "1914-07-28", gameDate: "1914-07-28" },

  // Plan F-3: era geometry graft. Declared after the 2026-08-12 date batch
  // measured this date at 배정 34 · 실질 37.5% from the cached Overpass response —
  // the same band as the grafted 1836 baseline. The build discovers
  // era-borders-1914-07-28*.geojson in scripts/ohm/out and grafts matching
  // faces; absent the dump it builds exactly as before, and says so.
  eraGeometry: {
    date: "1914-07-28",
    window: [-15, 30, 50, 72],
    // 2026-08-14 면 검수 (34면 전수). 러시아 면은 실물 확인(바르샤바 안 —
    // 회의왕국, 바그다드·이스파한 밖). 노르웨이-스웨덴 융합면은 mergedWith
    // 기계가 이미 담고 있어 배제 불요. 배제 0, 미매칭 14면 전부 명명.
    faceOwners: {
      "United Kingdom of Great Britain and Ireland": "GBR",
      // 모로코 분할 보호령(1912 페스 조약·프랑스-스페인 협정): 스펙은 MAR
      // 전체를 FRA에 배정했으므로 스페인 지대 면이 북부 지역들을 스페인으로
      // 재배정하는 것이 맞다 — 면이 이긴다.
      "Protectorat français au Maroc": "FRA",
      "Protectorado español en Marruecos": "ESP",
      "Territorio de Ifni": "ESP", // 1860 테투안 조약의 스페인 영토
      "Saguía el Hamra": "ESP", // 스페인령 사하라 북부
      "Colonia del Rio de Oro": "ESP", // 스페인령 사하라 남부
      "Protectorat français de Tunisie": "FRA", // 1881 바르도 조약
      "Tripolitania Italiana": "ITA", // 1912 로잔(우시) 조약
      "Cirenaica Italiana": "ITA",
      "Colony of Malta": "GBR",
      // 부하라·히바: 1868/1873부터 러시아 보호령 — 스펙도 UZB·TKM을 RUS에
      // 배정한다. 면과 지역이 같은 답을 말하게 한다.
      "امارت بخارا": "RUS",
      "خیوه خانلیگی": "RUS",
      // 쿠웨이트·오만: 영국 영향권이지만 스펙이 현대명 국가로 남겨 둔 땅 —
      // 지역 패스와 같은 어휘(COUNTRY_NAMES)로 맞춘다.
      "Protectorate of Kuwait": "Kuwait", // 1913 영국-오스만 협약의 자치 셰이크국
      "Sultanate of Muscat and Oman": "Oman",
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
    // ── 제국은 색이 아니라 행정부다 ───────────────────────────────────────────
    RAJ: { name: "British Raj", color: "#c07a8a", aliases: ["영국령 인도", "인도 제국", "British India", "India"] },
    AOF: { name: "French West Africa", color: "#5a7fc0", aliases: ["프랑스령 서아프리카", "Afrique-Occidentale française", "AOF"] },
    AEF: { name: "French Equatorial Africa", color: "#4a6fb0", aliases: ["프랑스령 적도아프리카", "Afrique-Équatoriale française", "AEF"] },
    FIC: { name: "French Indochina", color: "#6a8fd0", aliases: ["프랑스령 인도차이나", "Indochine française", "Indochina"] },
    DEI: { name: "Dutch East Indies", color: "#d08a4a", aliases: ["네덜란드령 동인도", "Nederlands-Indië", "Dutch East Indies", "Indonesia"] },
    BCO: { name: "Belgian Congo", color: "#8a9a3a", aliases: ["벨기에령 콩고", "Congo belge", "Belgian Congo"] },
    GER: { name: "German Empire", color: "#4a4a4a", aliases: ["독일 제국", "Germany", "Kaiserreich", "Imperial Germany", "Deutsches Reich"] },
    AUH: { name: "Austria-Hungary", color: "#c9a227", aliases: ["오스트리아-헝가리 제국", "오헝 제국", "Austro-Hungarian Empire", "Habsburg Empire", "Dual Monarchy"] },
    OTT: { name: "Ottoman Empire", color: "#7a9950", aliases: ["오스만 제국", "Turkey", "Sublime Porte", "Ottoman Turkey"] },
    RUS: { name: "Russian Empire", color: "#2e6b4f", aliases: ["러시아 제국", "Russia", "Tsarist Russia", "Imperial Russia"] },
    FRA: { name: "French Republic", color: "#3f6fd0", aliases: ["프랑스", "France", "French Empire", "Third Republic"] },
    GBR: { name: "British Empire", color: "#c0507a", aliases: ["대영제국", "영국", "United Kingdom", "Britain", "Great Britain"] },
    ITA: { name: "Italy", color: "#4f7942", aliases: ["이탈리아 왕국", "Kingdom of Italy"] },
    JAP: { name: "Japan", color: "#b23b3b", aliases: ["일본 제국", "Empire of Japan", "Imperial Japan"] },
    USA: { name: "United States", color: "#4a8f7a", aliases: ["미국", "America", "United States of America"] },
    SRB: { name: "Serbia", color: "#8b6baf", aliases: ["세르비아 왕국", "Kingdom of Serbia"] },
    MNE: { name: "Montenegro", color: "#6d5a7a", aliases: ["몬테네그로 왕국", "Kingdom of Montenegro"] },
    BUL: { name: "Bulgaria", color: "#5f8a5f", aliases: ["불가리아 왕국", "Kingdom of Bulgaria", "Tsardom of Bulgaria"] },
    ROU: { name: "Romania", color: "#c08a3a", aliases: ["루마니아 왕국", "Kingdom of Romania"] },
    BEL: { name: "Belgium", color: "#b0902e", aliases: ["벨기에", "Belgian Empire"] },
    NLD: { name: "Netherlands", color: "#e08a2e", aliases: ["네덜란드", "Dutch Empire", "Holland"] },
    POR: { name: "Portugal", color: "#2e7d6b", aliases: ["포르투갈", "Portuguese Empire", "Portuguese Republic"] },
    ESP: { name: "Spain", color: "#d0a02e", aliases: ["스페인", "Kingdom of Spain"] },
    DAN: { name: "Denmark", color: "#8a5f6d", aliases: ["덴마크", "Kingdom of Denmark"] },
    CHI: { name: "Republic of China", color: "#4a6db5", aliases: ["중화민국", "China", "Yuan Shikai's China"] },
    TIB: { name: "Tibet", color: "#a8743a", aliases: ["티베트", "Land of Snows", "Lhasa government"] },
    MON: { name: "Bogd Khanate of Mongolia", color: "#a85454", aliases: ["복드 칸국", "몽골", "Mongolia", "Outer Mongolia"] },
    PER: { name: "Persia", color: "#7a6b9e", aliases: ["페르시아", "Iran", "Qajar Persia", "Sublime State of Persia"] },
    NEJ: { name: "Emirate of Nejd", color: "#9e8a54", aliases: ["네지드 토후국", "Nejd", "House of Saud", "Nejd and Hasa"] },
    SIA: { name: "Siam", color: "#4068bf", aliases: ["시암", "Thailand", "Kingdom of Siam"] },
  },

  countryAssignments: {
    // — German Empire: the Reich + its colonial world. Togoland, Kamerun,
    //   South-West Africa, East Africa (incl. Ruanda-Urundi), Samoa and the
    //   Pacific island chains Japan will seize within months.
    GER: ["DEU", "TGO", "CMR", "NAM", "TZA", "RWA", "BDI", "WSM", "MHL", "FSM", "PLW", "MNP"],
    // — Austria-Hungary: the Dual Monarchy's core, plus Galicia, Transylvania,
    //   Bukovina, Vojvodina and the Littoral granted region-by-region below.
    AUH: ["AUT", "HUN", "CZE", "SVK", "HRV", "SVN", "BIH"],
    // — Ottoman Empire: Anatolia and the Arab provinces. (Egypt is occupied by
    //   Britain, Libya lost to Italy in 1912, the Balkans lost in 1913.)
    OTT: ["TUR", "SYR", "LBN", "ISR", "PSE", "JOR", "IRQ", "YEM"],
    // — Russian Empire: Finland, the Baltics, Congress Poland (regions below),
    //   Bessarabia, the Caucasus and Turkestan. Kaliningrad is East Prussia
    //   and goes to Germany below.
    RUS: ["RUS", "UKR", "BLR", "MDA", "FIN", "EST", "LVA", "LTU", "KAZ", "GEO", "ARM", "AZE", "UZB", "TKM", "TJK", "KGZ"],
    // — French Republic and empire. (Togo and Cameroon are German this year;
    //   Morocco is a protectorate since 1912.)
    FRA: ["FRA", "DZA", "TUN", "MAR", "CMR", "TGO", "MDG", "DJI", "COM", "GUF", "NCL", "PYF", "MYT", "REU", "GLP", "MTQ", "SPM", "WLF", "ATF"],
    AOF: ["SEN", "MLI", "CIV", "GIN", "BFA", "BEN", "NER", "MRT"],
    AEF: ["TCD", "CAF", "COG", "GAB"],
    FIC: ["VNM", "LAO", "KHM"],
    // — British Empire: the dominions, the Raj, the African colonies, Egypt
    //   (khedivate on paper, British in fact since 1882) and the Sudan, the
    //   Gulf protectorates, Cyprus (occupied since 1878). Ireland is INSIDE
    //   the United Kingdom — Home Rule is on the books and suspended.
    GBR: ["GBR", "IRL", "LKA", "EGY", "SDN", "GUY", "BLZ", "JAM", "TTO", "BHS", "BRB", "ATG", "DMA", "GRD", "KNA", "LCA", "CYM", "VGB", "TCA", "CYP", "MLT", "MYS", "SGP", "BRN", "FJI", "SLB", "MUS", "SYC"],
    CAN: ["CAN"],
    AUS: ["AUS"],
    NZL: ["NZL"],
    SAF: ["ZAF", "LSO", "SWZ"],
    BWA: ["NGA", "GHA", "SLE", "GMB"],
    // 탕가니카는 아직 독일령 동아프리카다 — 위임통치는 1919년부터.
    BEA: ["KEN", "UGA"],
    BCA: ["ZMB", "ZWE", "MWI", "BWA"],
    RAJ: ["IND", "PAK", "BGD", "MMR"],
    // — Italy: neutral this week (the Triple Alliance is defensive and Vienna
    //   did not consult Rome), holding Libya and the Horn colonies since 1912.
    ITA: ["ITA", "LBY", "ERI"],
    // — Japan: Korea and Taiwan. The German Pacific and Tsingtao are two
    //   months from changing hands.
    JAP: ["JPN", "KOR", "TWN"],
    // — United States: neutral, with the Philippines, Puerto Rico and Guam.
    //   (The Virgin Islands are still the DANISH West Indies until 1917.)
    USA: ["USA", "PHL", "PRI", "GUM"],
    // — The Balkan states as the Second Balkan War left them one year ago.
    SRB: ["SRB", "MKD", "XKO"],
    MNE: ["MNE"],
    BUL: ["BGR"],
    ROU: ["ROU"],
    // — The neutral empires of the west.
    BEL: ["BEL"],
    BCO: ["COD"],
    NLD: ["NLD", "SUR"],
    DEI: ["IDN"],
    POR: ["PRT", "AGO", "MOZ", "GNB", "CPV", "STP", "TLS"],
    ESP: ["ESP", "ESH", "GNQ"],
    // — Denmark: Iceland is under the Danish crown until 1918, the West
    //   Indies are Danish until 1917.
    DAN: ["DNK", "GRL", "FRO", "ISL", "VIR"],
    // — Asia's independents. China is Yuan Shikai's young republic; Tibet and
    //   Outer Mongolia have both slipped Beijing's grasp since 1911.
    CHI: ["CHN"],
    MON: ["MNG"],
    PER: ["IRN"],
    NEJ: ["SAU"],
    SIA: ["THA"],
  },

  // Region-level exceptions (applied after, so they win).
  regionAssignments: {
    // ── East Prussia ──
    "RUS.21_1": "GER",  // Kaliningrad = Königsberg, the Reich's eastern bastion

    // ── The Partitions of Poland: one nation, three empires ──
    // Prussian Poland (Posen, West Prussia, Silesia, Pomerania):
    "POL.16_1": "GER",  // Zachodniopomorskie
    "POL.5_1": "GER",   // Lubuskie
    "POL.1_1": "GER",   // Dolnośląskie (Breslau)
    "POL.11_1": "GER",  // Pomorskie (Danzig)
    "POL.2_1": "GER",   // Kujawsko-Pomorskie
    "POL.14_1": "GER",  // Warmińsko-Mazurskie (southern East Prussia)
    "POL.15_1": "GER",  // Wielkopolskie (Posen)
    "POL.8_1": "GER",   // Opolskie
    "POL.12_1": "GER",  // Śląskie (Upper Silesia)
    // Austrian Galicia:
    "POL.6_1": "AUH",   // Małopolskie (Cracow)
    "POL.9_1": "AUH",   // Podkarpackie (Przemyśl fortress)
    // Russian Congress Poland:
    "POL.7_1": "RUS",   // Mazowieckie (Warsaw)
    "POL.3_1": "RUS",   // Łódzkie
    "POL.4_1": "RUS",   // Lubelskie
    "POL.10_1": "RUS",  // Podlaskie
    "POL.13_1": "RUS",  // Świętokrzyskie

    // ── Austrian East Galicia and Bukovina (modern Ukraine) ──
    "UKR.14_1": "AUH",  // L'viv (Lemberg)
    "UKR.22_1": "AUH",  // Ternopil'
    "UKR.7_1": "AUH",   // Ivano-Frankivs'k
    "UKR.23_1": "AUH",  // Zakarpattia (Hungarian Ruthenia)
    "UKR.3_1": "AUH",   // Chernivtsi (Bukovina)

    // ── Hungarian Transylvania, the Banat and southern Bukovina (modern Romania) ──
    "ROU.1_1": "AUH",   // Alba
    "ROU.2_1": "AUH",   // Arad
    "ROU.5_1": "AUH",   // Bihor
    "ROU.6_1": "AUH",   // Bistrița-Năsăud
    "ROU.8_1": "AUH",   // Brașov (Kronstadt)
    "ROU.13_1": "AUH",  // Caraș-Severin
    "ROU.14_1": "AUH",  // Cluj (Klausenburg)
    "ROU.16_1": "AUH",  // Covasna
    "ROU.22_1": "AUH",  // Harghita
    "ROU.23_1": "AUH",  // Hunedoara
    "ROU.27_1": "AUH",  // Maramureș
    "ROU.29_1": "AUH",  // Mureș
    "ROU.33_1": "AUH",  // Sălaj
    "ROU.34_1": "AUH",  // Satu Mare
    "ROU.35_1": "AUH",  // Sibiu (Hermannstadt)
    "ROU.38_1": "AUH",  // Timiș (the Banat)
    "ROU.36_1": "AUH",  // Suceava (southern Bukovina)

    // ── Hungarian Vojvodina and Syrmia (modern Serbia) ──
    "SRB.24_1": "AUH",  // Zapadno-Bački
    "SRB.17_1": "AUH",  // Severno-Bački
    "SRB.18_1": "AUH",  // Severno-Banatski
    "SRB.5_1": "AUH",   // Južno-Bački (Novi Sad)
    "SRB.19_1": "AUH",  // Srednje-Banatski
    "SRB.6_1": "AUH",   // Južno-Banatski
    "SRB.20_1": "AUH",  // Sremski

    // ── The Austrian Littoral and Welschtirol (modern Italy) ──
    "ITA.17_1": "AUH",  // Trentino-Alto Adige (Welschtirol/Südtirol)
    "ITA.7_1": "AUH",   // Friuli-Venezia Giulia (Trieste, the Habsburg port)

    // ── Southern Dobruja: Romanian since the Second Balkan War (1913) ──
    "BGR.3_1": "ROU",   // Dobrich
    "BGR.18_1": "ROU",  // Silistra

    // ── Aden Colony and Protectorates; the rest of Yemen stays Ottoman ──
    "YEM.1_1": "GBR",   // 'Adan
    "YEM.15_1": "GBR",  // Lahij
    "YEM.2_1": "GBR",   // Abyan
    "YEM.4_1": "GBR",   // Al Dali'
    "YEM.20_1": "GBR",  // Shabwah
    "YEM.12_1": "GBR",  // Hadramawt
    "YEM.7_1": "GBR",   // Al Mahrah

    // ── Ottoman Hejaz and Red Sea coast; the interior stays Saudi Nejd ──
    "SAU.13_1": "OTT",  // Tabuk
    "SAU.5_1": "OTT",   // Al Madinah
    "SAU.11_1": "OTT",  // Makkah
    "SAU.2_1": "OTT",   // Al Bahah
    "SAU.1_1": "OTT",   // 'Asir
    "SAU.10_1": "OTT",  // Jizan

    // ── China's lost outer lands ──
    "CHN.29_1": "TIB",  // Xizang — Lhasa expelled the Qing garrison in 1912
    "CHN.HKG": "GBR",   // Hong Kong
  },

  // Era cities: [name, modern-seed-name | [lng,lat], tier, population ~1914].
  cities: [
    // — The powder keg —
    ["Sarajevo", [18.41, 43.86], 2, 52000], // where the Archduke died a month ago
    ["Belgrade", "Belgrade", 2, 90000], // under Austrian guns across the Danube
    ["Cetinje", [18.92, 42.39], 1, 5000], // Montenegro's mountain capital
    // — Central Powers —
    ["Berlin", "Berlin", 4, 2071000],
    ["Hamburg", "Hamburg", 3, 931000],
    ["Munich", "Munich", 2, 596000],
    ["Cologne", "Cologne", 2, 517000],
    ["Essen", [7.01, 51.46], 2, 295000], // Krupp
    ["Königsberg", "Kaliningrad", 2, 246000],
    ["Danzig", "Gdańsk", 1, 170000],
    ["Breslau", "Wrocław", 2, 512000],
    ["Posen", [16.93, 52.41], 1, 157000],
    ["Vienna", "Vienna", 4, 2100000],
    ["Budapest", "Budapest", 3, 1100000],
    ["Prague", "Prague", 2, 224000],
    ["Trieste", [13.77, 45.65], 2, 230000], // the Habsburg port
    ["Cracow", [19.94, 50.06], 2, 152000],
    ["Lemberg", [24.03, 49.84], 2, 206000], // Austrian Galicia's capital
    ["Constantinople", "Istanbul", 4, 1125000],
    ["Smyrna", [27.14, 38.42], 2, 300000],
    ["Angora", "Ankara", 1, 28000],
    ["Damascus", [36.29, 33.51], 2, 223000],
    ["Beirut", [35.5, 33.89], 1, 150000],
    ["Jerusalem", "Jerusalem", 1, 70000], // Ottoman sanjak
    ["Baghdad", "Baghdad", 2, 200000],
    ["Mecca", [39.83, 21.42], 1, 80000],
    ["Sofia", "Sofia", 2, 103000],
    // — Entente —
    ["St. Petersburg", [30.32, 59.94], 4, 2100000], // Petrograd within weeks
    ["Moscow", "Moscow", 3, 1800000],
    ["Warsaw", "Warsaw", 3, 885000], // Russian Poland's capital
    ["Łódź", [19.46, 51.76], 2, 478000],
    ["Kiev", "Kyiv", 2, 626000],
    ["Odessa", "Odesa", 2, 500000],
    ["Riga", "Riga", 2, 517000],
    ["Helsingfors", "Helsinki", 1, 170000], // Grand Duchy of Finland
    ["Tiflis", "Tbilisi", 2, 307000],
    ["Baku", "Baku", 2, 232000],
    ["Tashkent", "Tashkent", 1, 271000],
    ["Vladivostok", "Vladivostok", 1, 97000],
    ["Paris", "Paris", 4, 2888000],
    ["Marseille", "Marseille", 2, 551000],
    ["Lyon", [4.84, 45.76], 2, 524000],
    ["Verdun", [5.38, 49.16], 1, 21000], // a quiet fortress town, for now
    ["London", "London", 4, 7256000],
    ["Manchester", "Manchester", 2, 714000],
    ["Glasgow", [-4.25, 55.86], 2, 1000000],
    ["Dublin", "Dublin", 2, 305000], // Home Rule suspended
    ["Brussels", [4.35, 50.85], 2, 720000],
    ["Antwerp", [4.4, 51.22], 2, 302000], // the national redoubt
    ["Liège", [5.57, 50.63], 1, 168000], // the forts in the Schlieffen path
    // — Neutrals of Europe —
    ["Rome", "Rome", 3, 590000],
    ["Milan", "Milan", 2, 599000],
    ["Naples", "Naples", 2, 723000],
    ["Madrid", "Madrid", 3, 600000],
    ["Barcelona", "Barcelona", 2, 587000],
    ["Lisbon", "Lisbon", 2, 435000],
    ["Amsterdam", "Amsterdam", 2, 588000],
    ["Bern", [7.45, 46.95], 1, 91000],
    ["Copenhagen", "Copenhagen", 2, 462000],
    ["Christiania", "Oslo", 1, 244000], // Oslo's name until 1925
    ["Stockholm", "Stockholm", 2, 385000],
    ["Athens", "Athens", 2, 175000],
    ["Bucharest", "Bucharest", 2, 341000],
    ["Reykjavík", [-21.94, 64.15], 1, 14000], // under the Danish crown
    // — Asia —
    ["Tokyo", "Tokyo", 4, 2050000],
    ["Osaka", "Ōsaka", 3, 1226000],
    ["Keijo", "Seoul", 2, 250000], // colonial Seoul, annexed 1910
    ["Peking", "Beijing", 3, 700000], // Yuan Shikai's capital
    ["Shanghai", "Shanghai", 3, 1000000], // the concessions
    ["Canton", "Guangzhou", 2, 900000],
    ["Mukden", "Shenyang", 2, 174000],
    ["Tsingtao", [120.38, 36.07], 1, 55000], // Germany's fortress in China
    ["Lhasa", [91.12, 29.65], 1, 30000],
    ["Urga", "Ulaanbaatar", 1, 25000], // the Bogd Khan's seat
    ["Tehran", "Tehran", 2, 280000],
    ["Kabul", "Kabul", 1, 140000],
    ["Riyadh", "Riyadh", 1, 14000], // Ibn Saud's desert capital
    ["Delhi", "Delhi", 3, 233000], // the Raj's new capital, 1911
    ["Calcutta", [88.36, 22.57], 3, 1222000],
    ["Bombay", "Mumbai", 3, 979000],
    ["Karachi", "Karachi", 1, 152000],
    ["Colombo", "Colombo", 1, 211000],
    ["Rangoon", [96.16, 16.87], 2, 293000],
    ["Bangkok", "Bangkok", 2, 365000],
    ["Singapore", "Singapore", 2, 303000],
    ["Batavia", "Jakarta", 2, 234000],
    ["Hanoi", "Hanoi", 1, 120000],
    ["Saigon", "Ho Chi Minh City", 1, 90000],
    ["Manila", "Manila", 2, 234000],
    // — Africa —
    ["Cairo", "Cairo", 3, 700000],
    ["Alexandria", "Alexandria", 2, 380000],
    ["Khartoum", "Khartoum", 1, 60000],
    ["Algiers", "Algiers", 2, 172000],
    ["Tunis", "Tunis", 1, 180000],
    ["Tripoli", "Tripoli", 1, 60000], // Italian since 1912
    ["Casablanca", "Casablanca", 1, 60000],
    ["Dakar", "Dakar", 1, 30000],
    ["Lagos", "Lagos", 1, 74000],
    ["Léopoldville", "Kinshasa", 1, 10000],
    ["Dar es Salaam", "Dar es Salaam", 1, 20000], // German East Africa
    ["Windhoek", "Windhoek", 1, 10000], // German South-West Africa
    ["Nairobi", "Nairobi", 1, 14000],
    ["Addis Ababa", "Addis Ababa", 2, 70000],
    ["Johannesburg", "Johannesburg", 2, 240000],
    ["Cape Town", "Cape Town", 2, 170000],
    // — The Americas —
    ["New York", "New York", 4, 5333000],
    ["Washington", [-77.04, 38.91], 3, 353000],
    ["Chicago", "Chicago", 3, 2394000],
    ["Detroit", "Detroit", 2, 537000],
    ["San Francisco", "San Francisco", 2, 448000],
    ["Los Angeles", "Los Angeles", 1, 438000],
    ["Honolulu", "Honolulu", 1, 60000],
    ["Ottawa", "Ottawa", 1, 100000],
    ["Toronto", "Toronto", 2, 470000],
    ["Montreal", "Montréal", 2, 550000],
    ["Mexico City", "Mexico City", 3, 720000], // mid-revolution
    ["Havana", "Havana", 2, 350000],
    ["Caracas", "Caracas", 1, 90000],
    ["Bogotá", "Bogotá", 1, 121000],
    ["Lima", "Lima", 1, 173000],
    ["Santiago", "Santiago", 2, 400000],
    ["Buenos Aires", "Buenos Aires", 3, 1576000],
    ["Montevideo", "Montevideo", 2, 350000],
    ["Rio de Janeiro", "Rio de Janeiro", 3, 976000],
    ["São Paulo", "São Paulo", 2, 450000],
    // — Oceania —
    ["Sydney", "Sydney", 2, 700000],
    ["Melbourne", "Melbourne", 2, 670000], // the interim federal capital
    ["Apia", [-171.77, -13.83], 1, 1000], // German Samoa
    ["Wellington", "Wellington", 1, 70000],
  ],

  simulationRules:
    "It is 28 July 1914, one month after the assassination of Archduke Franz Ferdinand in " +
    "Sarajevo. Austria-Hungary has just declared war on Serbia — the only war that exists " +
    "yet. The alliance system now moves on timetables: Russia is beginning mobilization for " +
    "Serbia; Germany's Schlieffen Plan requires attacking FRANCE through BELGIUM the moment " +
    "war with Russia comes (expect German ultimatums around 31 July–4 August); Britain's " +
    "entry hinges on Belgian neutrality, which London guaranteed in 1839. Italy is a Triple " +
    "Alliance member but stays NEUTRAL (the alliance is defensive and Vienna struck first) — " +
    "historically it joined the ENTENTE in May 1915 for promises of Trentino and Trieste. " +
    "The Ottoman Empire is neutral and courted by both sides (it historically joined the " +
    "Central Powers in late October 1914). Japan honors its British alliance and historically " +
    "seized German Tsingtao and the German Pacific by November 1914. The United States is " +
    "firmly neutral. Technology and warfare must reflect 1914: NO tanks (until 1916), " +
    "aircraft are unarmed scouts, cavalry still charges, machine guns and quick-firing " +
    "artillery make attacks catastrophically costly — expect maneuver to collapse into " +
    "trench stalemate on contested fronts within months. Dreadnought battleships rule the " +
    "sea; submarines are new and shocking. Colonial empires supply manpower worldwide. " +
    "China is Yuan Shikai's fragile young republic; Mexico is in revolution; Persia is " +
    "divided into Russian and British spheres. MAP APPROXIMATIONS the model must correct in " +
    "narration: Alsace-Lorraine is GERMAN in 1914 though the map shows it French; northern " +
    "Schleswig is German; Western Thrace is Bulgarian; Tsingtao and German New Guinea are " +
    "German possessions not drawn on the map; the Suez Canal and Egypt are under British " +
    "control though Egypt is nominally an Ottoman khedivate.",

  startingTimelineText:
    "July 1914. Exactly one month after Gavrilo Princip's pistol shots killed the heir to the " +
    "Habsburg throne, Vienna's ultimatum has expired and the Dual Monarchy declares war on " +
    "Serbia. Austrian river monitors shell Belgrade across the Danube within hours. In St. " +
    "Petersburg the Tsar weighs mobilization orders that cannot be recalled; in Berlin the " +
    "General Staff counts the days its war plan allows for France; in Paris crowds sing the " +
    "Marseillaise; in London the cabinet still hopes the quarrel is none of Britain's. Four " +
    "empires — German, Habsburg, Romanov, Ottoman — stand at their zenith, ruling half the " +
    "earth between them, and every chancellery believes the war will be short. The lamps are " +
    "going out all over Europe.",
};

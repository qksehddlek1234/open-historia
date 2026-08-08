/*! Open Historia — WWII 1935 buildup scenario preset © 2026 Nicholas Krol, MIT (see src/Editor/LICENSE). */
// World War II buildup preset — 1 December 1935. The war is four years away
// and NOTHING is decided: this is the scenario where the player gets the
// buildup, not just the fire. Mussolini's legions are two months into
// Abyssinia and the League's sanctions are two weeks old; the Hoare-Laval
// pact will leak within days and shame two governments; Germany rearms
// openly but the Rhineland is still demilitarized; Spain's Republic has not
// yet broken; Japan holds Manchukuo but the China war is two years off.
//
// Companion to wwii-1939 (the war-day scenario), the way the original game
// pairs a war start with an extended buildup start. Same modern-region
// approximation discipline; every grid limit is stated in simulationRules.
//
// Deliberate differences from wwii-1939's map, all era-true:
// - Austria and Czechoslovakia are sovereign polities (no Anschluss, no
//   Protectorate, no separate Slovakia).
// - Ethiopia is a polity AT WAR, still holding nearly all its territory.
// - Italy has no Albania and no Ethiopia; Memel is still Lithuanian.
// - China is unoccupied outside Manchukuo (the war begins in July 1937).
// - Spain is the Second Republic, seven months from the coup.

export default {
  id: "wwii-1935",

  meta: {
    name: "World War II — 1935 Buildup",
    heroTitle: "The Gathering Storm",
    heroSubtitle: "The world drifts toward war, 1 December 1935",
    eyebrow: "Historical Preset",
    subtitle: "1 December 1935",
    accentColor: "#6b5b2e",
    coverImage: "public/loading_screen_2.jpg",
    description:
      "Four years before the panzers roll, everything is still in play. Italy wages the " +
      "League's first great test in Abyssinia, Germany rearms behind a demilitarized " +
      "Rhineland, Spain's Republic strains, and the democracies argue about sanctions. " +
      "Take any power through the years that decide whether the war happens at all.",
  },

  relabelOwnedCountries: false,
  unassignedKeepModernOwner: true,

  // Player starts as Germany — three years of rearmament choices before any
  // shot must be fired, if the player follows history at all.
  game: { country: "GER", startDate: "1935-12-01", gameDate: "1935-12-01" },

  polities: {
    GER: { name: "Germany", color: "#3a3a3a", aliases: ["독일", "나치 독일", "Third Reich", "German Reich", "Nazi Germany", "Deutsches Reich"] },
    AUS: { name: "Austria", color: "#b8b8c8", aliases: ["오스트리아", "Federal State of Austria", "Austrian Republic"] },
    CSK: { name: "Czechoslovakia", color: "#5b7fae", aliases: ["체코슬로바키아", "Czechoslovak Republic", "ČSR"] },
    ETH: { name: "Ethiopia", color: "#7a8f3a", aliases: ["에티오피아", "Abyssinia", "Ethiopian Empire"] },
    SIA: { name: "Siam", color: "#4068bf", aliases: ["시암", "Thailand", "Kingdom of Siam"] },
    ITA: { name: "Italy", color: "#4f7942", aliases: ["이탈리아", "Kingdom of Italy", "Fascist Italy"] },
    JAP: { name: "Japan", color: "#b23b3b", aliases: ["일본 제국", "Empire of Japan", "Imperial Japan"] },
    MAN: { name: "Manchukuo", color: "#cc8844", aliases: ["만주국", "Manchuria"] },
    SOV: { name: "Soviet Union", color: "#8b1a1a", aliases: ["소련", "USSR", "Soviet Russia"] },
    GBR: { name: "British Empire", color: "#c0507a", aliases: ["대영제국", "영국", "United Kingdom", "Britain", "Great Britain"] },
    FRA: { name: "French Republic", color: "#3f6fd0", aliases: ["프랑스", "France", "French Empire"] },
    NLD: { name: "Netherlands", color: "#e08a2e", aliases: ["네덜란드", "Dutch Empire", "Holland"] },
    BEL: { name: "Belgium", color: "#b0902e", aliases: ["벨기에", "Belgian Empire"] },
    POR: { name: "Portugal", color: "#2e7d6b", aliases: ["포르투갈", "Portuguese Empire", "Estado Novo"] },
    ESP: { name: "Spain", color: "#d0a02e", aliases: ["스페인 공화국", "Spanish Republic", "Second Spanish Republic"] },
    USA: { name: "United States", color: "#4a8f7a", aliases: ["미국", "America", "United States of America"] },
    YUG: { name: "Yugoslavia", color: "#6a8caf", aliases: ["유고슬라비아", "Kingdom of Yugoslavia"] },
    ROU: { name: "Romania", color: "#c08a3a", aliases: ["루마니아", "Kingdom of Romania"] },
    CHI: { name: "Republic of China", color: "#4a6db5", aliases: ["중화민국", "China", "Nationalist China", "Kuomintang"] },
    MON: { name: "Mongolian People's Republic", color: "#a85454", aliases: ["몽골", "Mongolia", "Outer Mongolia"] },
    DAN: { name: "Denmark", color: "#8a5f6d", aliases: ["덴마크", "Kingdom of Denmark"] },
  },

  countryAssignments: {
    // — Germany within its Versailles-plus-Saar borders. The Rhineland is
    //   German territory (demilitarized — a rules fact, not a map fact); the
    //   Saar rejoined in March 1935 after the plebiscite.
    GER: ["DEU"],
    AUS: ["AUT"],
    CSK: ["CZE", "SVK"],
    // — Ethiopia fights on: the northern front is around Mekelle, the
    //   southern in the Ogaden, and the capital is free.
    ETH: ["ETH"],
    SIA: ["THA"],
    // — Italy: Libya and the Horn colonies. Not Ethiopia (at war), not
    //   Albania (occupied April 1939).
    ITA: ["ITA", "LBY", "ERI", "SOM"],
    // — Japan: the home islands, Korea, Taiwan, the South Seas Mandate.
    JAP: ["JPN", "KOR", "TWN", "MNP", "PLW", "MHL", "FSM"],
    SOV: ["RUS", "UKR", "BLR", "KAZ", "GEO", "ARM", "AZE", "UZB", "TKM", "TJK", "KGZ"],
    GBR: [
      "GBR", "IND", "PAK", "BGD", "MMR", "LKA",
      "CAN", "AUS", "NZL", "ZAF", "NAM",
      "NGA", "GHA", "KEN", "UGA", "TZA", "ZMB", "ZWE", "MWI", "BWA", "LSO", "SWZ", "SDN", "SLE", "GMB",
      "GUY", "BLZ", "JAM", "TTO", "BHS", "BRB", "ATG", "DMA", "GRD", "KNA", "LCA", "CYM", "VGB", "TCA",
      "CYP", "MLT", "MYS", "SGP", "BRN", "JOR", "ISR", "PSE",
      "BHR", "QAT", "ARE", "KWT",
      "FJI", "SLB", "PNG", "MUS", "SYC",
    ],
    FRA: [
      "FRA", "DZA", "TUN", "MAR", "SYR", "LBN",
      "VNM", "LAO", "KHM",
      "SEN", "MLI", "CIV", "GIN", "BFA", "BEN", "NER", "TCD", "CAF", "COG", "GAB", "CMR", "MRT", "TGO",
      "MDG", "DJI", "COM",
      "GUF", "NCL", "PYF", "MYT", "REU", "GLP", "MTQ", "SPM", "WLF", "ATF",
    ],
    NLD: ["NLD", "IDN", "SUR"],
    BEL: ["BEL", "COD", "RWA", "BDI"],
    POR: ["PRT", "AGO", "MOZ", "GNB", "CPV", "STP", "TLS"],
    ESP: ["ESP", "ESH", "GNQ"],
    USA: ["USA", "PHL", "PRI", "GUM", "VIR"],
    YUG: ["SRB", "HRV", "BIH", "MNE", "MKD", "SVN", "XKO"],
    ROU: ["ROU", "MDA"],
    CHI: ["CHN"],
    MON: ["MNG"],
    DAN: ["DNK", "GRL", "FRO"],
  },

  regionAssignments: {
    // East Prussia is German until 1945.
    "RUS.21_1": "GER",  // Kaliningrad = Königsberg
    // Memel is still LITHUANIAN in 1935 (annexed March 1939) — no override.
    "CHN.HKG": "GBR",   // Hong Kong
    // Manchukuo — Japan's puppet since 1932; the rest of China is UNOCCUPIED
    // (the Marco Polo Bridge is nineteen months away).
    "CHN.11_1": "MAN",  // Heilongjiang
    "CHN.17_1": "MAN",  // Jilin
    "CHN.18_1": "MAN",  // Liaoning
    // British Somaliland (the north of modern Somalia; the rest is Italian).
    "SOM.1_1": "GBR",   // Awdal
    "SOM.18_1": "GBR",  // Woqooyi Galbeed (Hargeisa)
    "SOM.17_1": "GBR",  // Togdheer
    "SOM.13_1": "GBR",  // Sanaag
    "SOM.16_1": "GBR",  // Sool
    // Aden Colony + Protectorates; northern Yemen is the independent
    // Mutawakkilite Kingdom.
    "YEM.1_1": "GBR",   // 'Adan
    "YEM.15_1": "GBR",  // Lahij
    "YEM.2_1": "GBR",   // Abyan
    "YEM.4_1": "GBR",   // Al Dali'
    "YEM.20_1": "GBR",  // Shabwah
    "YEM.12_1": "GBR",  // Hadramawt
    "YEM.7_1": "GBR",   // Al Mahrah
  },

  // Era cities: [name, modern-seed-name | [lng,lat], tier, population ~1935].
  cities: [
    // — Europe —
    ["Berlin", "Berlin", 4, 4243000],
    ["Hamburg", "Hamburg", 3, 1682000],
    ["Munich", "Munich", 2, 746000],
    ["Cologne", "Cologne", 2, 757000],
    ["Königsberg", "Kaliningrad", 2, 316000],
    ["Saarbrücken", [7.0, 49.23], 1, 130000], // rejoined the Reich in March
    ["Vienna", "Vienna", 3, 1874000], // capital of SOVEREIGN Austria
    ["Prague", "Prague", 3, 921000], // capital of Czechoslovakia
    ["Bratislava", [17.11, 48.15], 1, 141000],
    ["Danzig", "Gdańsk", 2, 383000], // the Free City
    ["Memel", [21.14, 55.71], 1, 40000], // still Lithuanian
    ["Breslau", "Wrocław", 2, 625000],
    ["Warsaw", "Warsaw", 3, 1260000],
    ["London", "London", 4, 8480000],
    ["Manchester", "Manchester", 2, 746000],
    ["Glasgow", [-4.25, 55.86], 2, 1103000],
    ["Paris", "Paris", 4, 2870000],
    ["Marseille", "Marseille", 2, 900000],
    ["Rome", "Rome", 4, 1178000],
    ["Milan", "Milan", 3, 1084000],
    ["Naples", "Naples", 2, 850000],
    ["Madrid", "Madrid", 3, 1006000], // the Republic's capital
    ["Barcelona", "Barcelona", 2, 1075000],
    ["Lisbon", "Lisbon", 2, 570000],
    ["Amsterdam", "Amsterdam", 2, 780000],
    ["Brussels", [4.35, 50.85], 2, 900000],
    ["Bern", [7.45, 46.95], 1, 115000],
    ["Copenhagen", "Copenhagen", 2, 680000],
    ["Oslo", "Oslo", 2, 260000],
    ["Stockholm", "Stockholm", 2, 545000],
    ["Helsinki", "Helsinki", 1, 270000],
    ["Tallinn", "Tallinn", 1, 140000],
    ["Riga", "Riga", 2, 380000],
    ["Kaunas", "Kaunas", 1, 110000], // interwar Lithuanian capital
    ["Budapest", "Budapest", 3, 1120000],
    ["Bucharest", "Bucharest", 2, 800000],
    ["Belgrade", "Belgrade", 2, 290000],
    ["Sofia", "Sofia", 2, 350000],
    ["Athens", "Athens", 2, 460000],
    ["Dublin", "Dublin", 1, 468000], // the Free State
    // — Soviet Union —
    ["Moscow", "Moscow", 4, 3660000],
    ["Leningrad", [30.32, 59.94], 3, 2900000],
    ["Stalingrad", "Volgograd", 2, 400000],
    ["Kiev", "Kyiv", 2, 800000],
    ["Kharkov", "Kharkiv", 2, 800000], // Ukraine's capital until 1934
    ["Minsk", "Minsk", 1, 220000],
    ["Odessa", "Odesa", 2, 580000],
    ["Baku", "Baku", 2, 750000],
    ["Tbilisi", "Tbilisi", 1, 480000],
    ["Tashkent", "Tashkent", 2, 550000],
    ["Novosibirsk", "Novosibirsk", 1, 350000],
    ["Vladivostok", "Vladivostok", 1, 190000],
    // — The war in Africa, and the rest of it —
    ["Addis Ababa", "Addis Ababa", 3, 130000], // free, defiant, at war
    ["Asmara", [38.94, 15.34], 1, 60000], // Italy's forward base
    ["Mekelle", [39.47, 13.5], 1, 10000], // the northern front
    ["Cairo", "Cairo", 3, 1250000],
    ["Alexandria", "Alexandria", 2, 650000],
    ["Tripoli", "Tripoli", 1, 100000], // Italian Libya
    ["Algiers", "Algiers", 2, 240000],
    ["Casablanca", "Casablanca", 2, 240000],
    ["Dakar", "Dakar", 1, 85000],
    ["Lagos", "Lagos", 1, 150000],
    ["Léopoldville", "Kinshasa", 1, 40000],
    ["Nairobi", "Nairobi", 1, 55000],
    ["Johannesburg", "Johannesburg", 2, 460000],
    ["Cape Town", "Cape Town", 2, 320000],
    // — Middle East —
    ["Istanbul", "Istanbul", 3, 740000],
    ["Ankara", "Ankara", 2, 123000],
    ["Tehran", "Tehran", 2, 470000],
    ["Baghdad", "Baghdad", 2, 350000],
    ["Jerusalem", "Jerusalem", 1, 125000], // British Mandate
    // — Asia —
    ["Tokyo", "Tokyo", 4, 6100000],
    ["Osaka", "Ōsaka", 3, 3000000],
    ["Kyoto", [135.77, 35.01], 2, 1050000],
    ["Keijo", "Seoul", 2, 640000], // colonial Seoul
    ["Hsinking", [125.32, 43.88], 2, 300000], // Manchukuo's built capital
    ["Mukden", "Shenyang", 2, 750000],
    ["Peiping", "Beijing", 3, 1500000], // NOT occupied — the war is 19 months away
    ["Tientsin", "Tianjin", 3, 1100000],
    ["Shanghai", "Shanghai", 4, 3480000], // the concessions glitter
    ["Nanking", "Nanjing", 3, 950000], // the Nationalist capital
    ["Chungking", "Chongqing", 2, 400000],
    ["Canton", "Guangzhou", 2, 1000000],
    ["Hong Kong", "Hong Kong", 2, 950000],
    ["Lhasa", [91.12, 29.65], 1, 30000],
    ["Hanoi", "Hanoi", 2, 140000],
    ["Saigon", "Ho Chi Minh City", 2, 230000],
    ["Bangkok", "Bangkok", 2, 600000],
    ["Rangoon", [96.16, 16.87], 2, 380000],
    ["Singapore", "Singapore", 2, 650000],
    ["Batavia", "Jakarta", 2, 480000],
    ["Manila", "Manila", 2, 550000], // the brand-new Commonwealth (Nov 1935)
    ["Delhi", "Delhi", 3, 470000],
    ["Bombay", "Mumbai", 3, 1380000],
    ["Calcutta", [88.36, 22.57], 3, 1950000],
    ["Karachi", "Karachi", 2, 330000],
    ["Colombo", "Colombo", 1, 330000],
    // — The Americas —
    ["New York", "New York", 4, 7100000],
    ["Washington", [-77.04, 38.91], 3, 600000],
    ["Chicago", "Chicago", 3, 3340000],
    ["Detroit", "Detroit", 2, 1570000],
    ["Los Angeles", "Los Angeles", 3, 1350000],
    ["San Francisco", "San Francisco", 2, 620000],
    ["Honolulu", "Honolulu", 1, 160000],
    ["Ottawa", "Ottawa", 2, 140000],
    ["Toronto", "Toronto", 2, 640000],
    ["Montreal", "Montréal", 2, 870000],
    ["Vancouver", "Vancouver", 1, 260000],
    ["Mexico City", "Mexico City", 3, 1300000],
    ["Havana", "Havana", 2, 540000],
    ["Caracas", "Caracas", 1, 250000],
    ["Bogotá", "Bogotá", 1, 300000],
    ["Lima", "Lima", 2, 480000],
    ["Santiago", "Santiago", 2, 900000],
    ["Buenos Aires", "Buenos Aires", 3, 2250000],
    ["Montevideo", "Montevideo", 2, 660000],
    ["Rio de Janeiro", "Rio de Janeiro", 3, 1650000],
    ["São Paulo", "São Paulo", 3, 1120000],
    // — Oceania —
    ["Sydney", "Sydney", 2, 1235000],
    ["Melbourne", "Melbourne", 2, 990000],
    ["Canberra", "Canberra", 1, 9000],
    ["Wellington", "Wellington", 1, 150000],
    ["Auckland", "Auckland", 1, 210000],
  ],

  simulationRules:
    "It is 1 December 1935 — the buildup years, not the war. Italy invaded Ethiopia on 3 " +
    "October: the northern front presses south from Eritrea, the League of Nations has voted " +
    "sanctions (oil pointedly excluded), and within days the Hoare-Laval pact to partition " +
    "Ethiopia will leak and disgrace London and Paris. Ethiopia still holds nearly all its " +
    "territory and fights on (historically Addis Ababa fell in May 1936). Germany rearms " +
    "openly — conscription and the Luftwaffe were announced in March, the Nuremberg Laws in " +
    "September — but the RHINELAND IS DEMILITARIZED (historically remilitarized March 1936): " +
    "German troops west of the Rhine before then is a treaty-shattering gamble. Austria and " +
    "Czechoslovakia are sovereign; the Anschluss (1938), Munich (1938) and the war (1939) are " +
    "TRAJECTORIES, not facts — the player can bend or break them. Spain is the Second " +
    "Republic, polarized, seven months from the generals' coup. Japan rules Korea, Taiwan and " +
    "Manchukuo; north China is under creeping Japanese pressure but full war begins " +
    "historically in July 1937. Stalin's Great Purge begins in 1936. The United States hides " +
    "behind the Neutrality Acts. Technology must reflect 1935: biplanes giving way to the " +
    "first monoplane fighters, light tanks and doctrine experiments, no radar networks, " +
    "treaty-bound battlefleets (the London Naval Conference opens THIS MONTH). Colonial " +
    "empires are intact. MAP APPROXIMATIONS: modern provinces approximate 1935 borders — " +
    "the Polish Corridor and Danzig are approximate, interwar Poland's eastern territories " +
    "are not drawn, and the demilitarized Rhineland is a legal status the map cannot show.",

  startingTimelineText:
    "December 1935. In the Ethiopian highlands the Negus's barefoot armies dig in against " +
    "Badoglio's bombers and mustard gas while the League of Nations debates an oil sanction " +
    "it dares not pass — and in London and Paris, two foreign ministers are secretly drafting " +
    "a deal to give Mussolini most of the country. In Berlin the Reich rearms in the open: " +
    "conscription returned in March, the Luftwaffe unveiled, the Saar home after its " +
    "plebiscite — but the Rhineland garrison towns still stand empty under Versailles's last " +
    "living clause. Vienna leans on Rome for its independence; Prague trusts its French " +
    "alliance and its border forts. In Madrid the Republic staggers between strikes and " +
    "conspiracies. In Moscow the show trials are being written. In Tokyo the fleet faction " +
    "walks out of naval talks. The storm is gathering, and every hand can still turn it.",
};

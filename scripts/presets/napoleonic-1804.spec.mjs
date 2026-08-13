/*! Open Historia — Napoleonic Wars 1804 scenario preset © 2026 Nicholas Krol, MIT (see src/Editor/LICENSE). */
// The Napoleonic Wars — 1 December 1804, the eve of the coronation. Tomorrow
// in Notre-Dame, Bonaparte takes the crown from the Pope's hands and places
// it on his own head. Britain has been at war with France for eighteen
// months; the Third Coalition is forming in Vienna and St Petersburg; and
// every army in Europe is about to learn what the Grande Armée is.
//
// The modern grid approximates a pre-national Europe: satellite republics
// are drawn as their own polities (the puppet pattern), the Holy Roman
// Empire's surviving minors ride as one aggregate, partitioned Poland uses
// the THIRD-partition lines (not 1914's), and everything the grid cannot say
// — Berlin's neutrality, the Serbian rising, the Louisiana ink still drying —
// lives in the rules.

export default {
  id: "napoleonic-1804",

  meta: {
    name: "Napoleonic Wars — 1804",
    heroTitle: "The Eve of Empire",
    heroSubtitle: "Tomorrow Napoleon crowns himself, 1 December 1804",
    eyebrow: "Revolutionary Europe",
    subtitle: "1 December 1804",
    accentColor: "#7a5aa0",
    coverImage: "public/loading_screen_2.jpg",
    description:
      "Tomorrow in Notre-Dame, Bonaparte crowns himself emperor. Britain is already at " +
      "war, the Third Coalition is forming, and from Haiti's new republic to the Sikh " +
      "court at Lahore the old order is cracking. Command any power in the decade when " +
      "one man's army redraws Europe — or the coalition that finally breaks it.",
  },

  relabelOwnedCountries: false,
  unassignedKeepModernOwner: false,

  // Player starts as the French Empire, one day before the coronation.
  game: { country: "FRA", startDate: "1804-12-01", gameDate: "1804-12-01" },

  // Plan F-3: era geometry graft. Declared after the 2026-08-12 date batch
  // measured this date at 배정 29 · 실질 31.2% from the cached Overpass response —
  // the same band as the grafted 1836 baseline. The build discovers
  // era-borders-1804-12-01*.geojson in scripts/ohm/out and grafts matching
  // faces; absent the dump it builds exactly as before, and says so.
  eraGeometry: {
    date: "1804-12-01",
    window: [-15, 30, 50, 72],
    // 2026-08-14 면 검수 (29면 전수). 러시아 면은 실물로 확인(바르샤바 밖 —
    // 프로이센령 남프로이센이 맞다, 타슈켄트 밖); 배제 2건은 라벨 착지 오류.
    excludeFaces: [
      // "Nueva España" 라벨이 남동 이집트 잔여 조각(25.0,21.9→31.7,26.4)에
      // 착지 — 누에바에스파냐 관계의 bbox 중심(아메리카+필리핀)이 창 남단
      // 잔여에 떨어지는 중심점 병리(1939 미국-이집트 전례와 동일 계열).
      "Nueva España",
      // 칠도공화국(이오니아 제도) 라벨이 펠로폰네소스 본토 면
      // (20.0,36.4→26.6,41.7)에 착지 — 일곱 섬 span의 중심이 본토 아르카디아
      // 내륙. 본토는 1804년 오스만령이므로 그래프트하면 거짓이 된다.
      // 중심 오버라이드(코르푸)+재조립이 근본 수리(후속), 오늘은 배제.
      "Ἑπτάνησος Πολιτεία",
    ],
    faceOwners: {
      // 라벨이 거짓말하는 면 — 기하가 진실이다. "Kingdom of Etruria" 라벨
      // 면의 점 검사 실측: 로마·페루자·앙코나 안, 피렌체 밖. 즉 이 면은
      // 토스카나가 아니라 미폐합 교황령 덩어리다(에트루리아 라벨 점이 그
      // 안에 착지). 첫 빌드 실측: 로마·움브리아·마르케 9개 지역이
      // 교황령→에트루리아로 가고 있었다. 기하의 실제 보유자에게 준다.
      "Kingdom of Etruria": "PAP",
      // — 보드 폴리티의 다른 이름/보유지 (코드 배정) —
      "United Kingdom of Great Britain and Ireland": "GBR",
      "Bataafs Gemenebest": "BAT", // 바타비아 연방(1801-06 국제) — 같은 국가
      "Regno di Sicilia": "NAP", // 부르봉 시칠리아 — 나폴리와 동군연합
      "Ducato di Parma e Piacenza": "FRA", // 1802부터 프랑스 행정(모로 드 생메리)
      "Malta Protectorate": "GBR", // 1800 항복 이후 영국 점령
      "Isle of Man": "GBR", // 1765 재매입 이후 왕령
      "دولة الجزائر": "OTT", // 알제 섭정 — 명목상 오스만
      "Khanate of Kalat": "DUR", // 두라니 종주권 하의 칼라트 칸국 (명목적)
      // — 로스터 밖 실존 주권체 (이름 그대로) —
      "امارت بخارا": "Emirate of Bukhara", // 러시아 보호령은 1868부터 — 1804엔 독립
      "خیوه خانلیگی": "Khanate of Khiva", // 동상 — 1873부터 보호령
      "الْإِمْبَرَاطُورِيَّة الْعُمَانِيَّة": "Omani Empire", // 부사이드 오만
      "السلطنة الشريفة": "Sultanate of Morocco", // 알라위 술탄국
      "Митрополство Црногорско": "Prince-Bishopric of Montenegro", // 페타르 1세 — 사실상 독립
      "Respublica Lucensis": "Republic of Lucca", // 1805 엘리자 공국화 전
      "San Marino": "San Marino",
      "Republica de' Cošpäja": "Republic of Cospaia",
      "Andorra": "Andorra",
      "Couto Misto": "Couto Misto",
    },
    // 모로코 면이 멜리야(ESP.7.2)를 삼켰다(첫 빌드 실측: 스페인→모로코
    // 재배정 1건). 스페인 프레시디오는 1497년부터 스페인령 — 면은 스페인
    // 땅에 들어가지 않는다. 본토는 지브롤터 해협으로 갈려 있어 부작용 없음.
    faceKeepOut: { "السلطنة الشريفة": ["ESP"] },
  },

  polities: {
    FRA: { name: "French Empire", color: "#3f5fd0", aliases: ["프랑스 제국", "프랑스", "France", "Napoleonic France", "First French Empire"] },
    // The satellite ring — drawn as their own polities per the puppet pattern.
    BAT: { name: "Batavian Republic", color: "#7a8fd8", aliases: ["바타비아 공화국", "네덜란드", "Netherlands", "Holland"] },
    ITK: { name: "Italian Republic", color: "#6f9fd8", aliases: ["이탈리아 공화국", "Kingdom of Italy", "Cisalpine Republic"] },
    SWI: { name: "Swiss Confederation", color: "#9aa8c8", aliases: ["스위스", "Switzerland", "Act of Mediation Switzerland"] },
    ETR: { name: "Kingdom of Etruria", color: "#c8a86a", aliases: ["에트루리아 왕국", "Tuscany", "토스카나"] },
    HAN: { name: "Electorate of Hanover", color: "#b8909a", aliases: ["하노버 선제후국", "Hanover", "French-occupied Hanover"] },
    // The old order.
    GBR: { name: "United Kingdom", color: "#c0507a", aliases: ["영국", "대영제국", "Britain", "Great Britain", "British Empire", "East India Company"] },
    AUT: { name: "Austrian Empire", color: "#e8d878", aliases: ["오스트리아 제국", "오스트리아", "Austria", "Habsburg Monarchy"] },
    PRU: { name: "Kingdom of Prussia", color: "#4a6a8a", aliases: ["프로이센", "Prussia"] },
    HRE: { name: "Holy Roman Empire", color: "#b8b8a0", aliases: ["신성 로마 제국", "독일 제후국들", "German minor states", "Reich"] },
    RUS: { name: "Russian Empire", color: "#8b9a54", aliases: ["러시아 제국", "러시아", "Russia"] },
    OTT: { name: "Ottoman Empire", color: "#5a8a6a", aliases: ["오스만 제국", "오스만", "Turkey", "Sublime Porte"] },
    ESP: { name: "Spanish Empire", color: "#d0a02e", aliases: ["스페인 제국", "스페인", "Spain"] },
    POR: { name: "Portugal", color: "#2e7d6b", aliases: ["포르투갈", "Portuguese Empire"] },
    DAN: { name: "Denmark-Norway", color: "#8a5f6d", aliases: ["덴마크-노르웨이", "덴마크", "Denmark"] },
    SWE: { name: "Sweden", color: "#4068bf", aliases: ["스웨덴", "Kingdom of Sweden"] },
    PAP: { name: "Papal States", color: "#e8e0c0", aliases: ["교황령", "Papacy", "Rome"] },
    NAP: { name: "Naples and Sicily", color: "#a06a4a", aliases: ["나폴리-시칠리아", "나폴리 왕국", "Kingdom of Naples", "Two Sicilies"] },
    SAR: { name: "Kingdom of Sardinia", color: "#7a6a9a", aliases: ["사르데냐 왕국", "사보이아", "Piedmont-Sardinia", "Savoy"] },
    // Beyond Europe.
    USA: { name: "United States", color: "#4a8f7a", aliases: ["미국", "America", "United States of America"] },
    HTI: { name: "Haiti", color: "#8a3a5a", aliases: ["아이티", "Hayti", "Dessalines' Haiti"] },
    QAJ: { name: "Qajar Persia", color: "#b07a3e", aliases: ["카자르 페르시아", "페르시아", "Persia", "Iran"] },
    DUR: { name: "Durrani Empire", color: "#6b7a5a", aliases: ["두라니 제국", "아프가니스탄", "Afghanistan"] },
    SIK: { name: "Sikh Empire", color: "#d8b83e", aliases: ["시크 제국", "라호르 왕국", "Punjab", "Ranjit Singh's empire"] },
    MRA: { name: "Maratha Confederacy", color: "#c87a3e", aliases: ["마라타 동맹", "마라타", "Marathas"] },
    NEJ: { name: "Emirate of Diriyah", color: "#9a8a4a", aliases: ["디리야 토후국", "제1차 사우디 국가", "Nejd", "Wahhabi state"] },
    QIN: { name: "Qing Empire", color: "#b23b3b", aliases: ["청", "청나라", "China", "Qing China"] },
    JOS: { name: "Joseon", color: "#5b7fae", aliases: ["조선", "Korea", "South Korea", "North Korea"] },
    JAP: { name: "Tokugawa Japan", color: "#a85454", aliases: ["에도 일본", "일본", "Japan", "Tokugawa shogunate"] },
    SIA: { name: "Siam", color: "#4a7ab0", aliases: ["시암", "라따나꼬신", "Thailand", "Rattanakosin"] },
    BUR: { name: "Konbaung Burma", color: "#7a9a4a", aliases: ["꼰바웅 버마", "버마", "Burma", "Myanmar"] },
    VIE: { name: "Nguyen Vietnam", color: "#5a9a7a", aliases: ["응우옌 베트남", "베트남", "Vietnam"] },
  },

  countryAssignments: {
    // France holds the natural frontiers: Belgium, the left bank, Piedmont.
    FRA: ["FRA", "BEL", "LUX"],
    BAT: ["NLD", "IDN", "SUR", "ZAF"], // the Cape returned to Batavia at Amiens
    SWI: ["CHE", "LIE"],
    GBR: ["GBR", "IRL", "CAN", "AUS", "LKA", "MLT", "BRB", "JAM", "TTO", "BHS", "GUY", "SLE", "GMB"],
    AUT: ["AUT", "CZE", "SVK", "HUN", "HRV", "SVN"],
    RUS: ["RUS", "UKR", "BLR", "LTU", "LVA", "EST", "GEO"],
    OTT: ["TUR", "GRC", "BGR", "SRB", "MKD", "BIH", "MNE", "ALB", "XKO", "ROU", "MDA", "CYP", "SYR", "LBN", "IRQ", "JOR", "ISR", "PSE", "EGY", "LBY", "TUN", "DZA"],
    ESP: ["ESP", "MEX", "GTM", "HND", "SLV", "NIC", "CRI", "PAN", "CUB", "DOM", "PRI", "COL", "VEN", "ECU", "PER", "BOL", "CHL", "ARG", "PRY", "URY", "PHL", "GUM"],
    POR: ["PRT", "BRA", "AGO", "MOZ", "GNB", "CPV", "STP", "TLS"],
    DAN: ["DNK", "NOR", "ISL", "GRL", "FRO"],
    SWE: ["SWE", "FIN"],
    USA: ["USA"],
    HTI: ["HTI"],
    QAJ: ["IRN", "AZE", "ARM"], // the Caucasus khanates — Russia takes them by 1813/1828
    DUR: ["AFG", "PAK"], // Kabul's empire still claims Sindh and Kashmir — see rules
    NEJ: ["SAU"],
    QIN: ["CHN", "TWN", "MNG"],
    JOS: ["KOR", "PRK"],
    JAP: ["JPN"],
    SIA: ["THA", "LAO", "KHM"], // Bangkok's vassal ring — Vietnam contests Cambodia
    BUR: ["MMR"],
    VIE: ["VNM"],
    MRA: ["IND"], // baseline: the subcontinent's interior — the EIC carves its presidencies below
  },

  regionAssignments: {
    // ── Germany, twenty months before the Reich dissolves ──
    "DEU.4_1": "PRU",   // Brandenburg
    "DEU.3_1": "PRU",   // Berlin
    "DEU.13_1": "PRU",  // Sachsen-Anhalt (Magdeburg)
    "DEU.10_1": "PRU",  // Nordrhein-Westfalen (Mark, Cleves — approximation)
    "DEU.15_1": "DAN",  // Schleswig-Holstein (the Oldenburg crown's duchies)
    "DEU.9_1": "HAN",   // Niedersachsen — the Electorate, under French occupation since 1803
    "DEU.11_1": "FRA",  // Rheinland-Pfalz (left bank, annexed 1801)
    "DEU.12_1": "FRA",  // Saarland (left bank)
    "DEU.2_1": "HRE",   // Bayern
    "DEU.1_1": "HRE",   // Baden-Württemberg
    "DEU.7_1": "HRE",   // Hessen
    "DEU.14_1": "HRE",  // Sachsen
    "DEU.16_1": "HRE",  // Thüringen
    "DEU.8_1": "HRE",   // Mecklenburg
    "DEU.6_1": "HRE",   // Hamburg (free city)
    "DEU.5_1": "HRE",   // Bremen (free city)
    // ── Italy before Austerlitz ──
    "ITA.13_1": "FRA",  // Piemonte (annexed 1802)
    "ITA.9_1": "FRA",   // Liguria (annexation months away — Genoa's republic in name)
    "ITA.19_1": "FRA",  // Valle d'Aosta
    "ITA.10_1": "ITK",  // Lombardia (Milan — the Republic's seat)
    "ITA.6_1": "ITK",   // Emilia-Romagna
    "ITA.20_1": "AUT",  // Veneto (Austrian since Campo Formio)
    "ITA.7_1": "AUT",   // Friuli
    "ITA.17_1": "AUT",  // Trentino
    "ITA.16_1": "ETR",  // Toscana — the Bourbon puppet kingdom
    "ITA.8_1": "PAP",   // Lazio
    "ITA.18_1": "PAP",  // Umbria
    "ITA.11_1": "PAP",  // Marche
    "ITA.5_1": "NAP", "ITA.1_1": "NAP", "ITA.12_1": "NAP", "ITA.2_1": "NAP", "ITA.3_1": "NAP", "ITA.4_1": "NAP", "ITA.15_1": "NAP",
    "ITA.14_1": "SAR",  // Sardegna — all the House of Savoy has left
    // ── Poland, THIRD partition (1795), not 1914's lines ──
    "POL.6_1": "AUT",   // Małopolskie (Kraków — Austrian West Galicia)
    "POL.9_1": "AUT",   // Podkarpackie (Galicia)
    "POL.4_1": "AUT",   // Lubelskie (West Galicia)
    "POL.13_1": "AUT",  // Świętokrzyskie (West Galicia)
    "POL.7_1": "PRU",   // Mazowieckie (Warsaw — New East Prussia)
    "POL.3_1": "PRU",   // Łódzkie (South Prussia)
    "POL.10_1": "PRU",  // Podlaskie (New East Prussia)
    "POL.15_1": "PRU", "POL.2_1": "PRU", "POL.11_1": "PRU", "POL.14_1": "PRU", "POL.16_1": "PRU", "POL.5_1": "PRU", "POL.1_1": "PRU", "POL.8_1": "PRU", "POL.12_1": "PRU",
    "RUS.21_1": "PRU",  // Königsberg — East Prussia proper
    // ── India: the Second Anglo-Maratha War is ENDING in Britain's favor ──
    "IND.36_1": "GBR",  // Bengal Presidency
    "IND.5_1": "GBR", "IND.15_1": "GBR", "IND.26_1": "GBR",
    "IND.34_1": "GBR",  // Ceded and Conquered Provinces (1801-03)
    "IND.35_1": "GBR",
    "IND.25_1": "GBR",  // Delhi — taken 1803, the Mughal a Company pensioner
    "IND.12_1": "GBR",
    "IND.31_1": "GBR",  // Madras Presidency
    "IND.2_1": "GBR", "IND.32_1": "GBR",
    "IND.16_1": "GBR",  // Mysore, a subsidiary ally since 1799 — approximation
    "IND.17_1": "GBR",  // Travancore subsidiary alliance
    "IND.28_1": "SIK",  // Punjab — Ranjit Singh's rising court at Lahore
    "IND.13_1": "SIK", "IND.6_1": "SIK",
    "IND.10_1": "POR",  // Goa
    // Maratha keeps the interior via the IND baseline above.
  },

  // Era cities: [name, modern-seed-name | [lng,lat], tier, population ~1804].
  cities: [
    ["Paris", "Paris", 4, 600000], // the coronation is TOMORROW
    ["London", "London", 4, 1100000], // the war's paymaster
    ["Vienna", "Vienna", 3, 250000], // an empire eight months old
    ["Berlin", "Berlin", 2, 180000], // armed, neutral, undecided
    ["Saint Petersburg", [30.32, 59.94], 3, 250000], // the young tsar's court
    ["Moscow", "Moscow", 2, 250000],
    ["Constantinople", "Istanbul", 3, 500000], // Selim III's reforms straining
    ["Madrid", "Madrid", 2, 180000], // France's reluctant fleet-partner
    ["Lisbon", "Lisbon", 2, 200000],
    ["Rome", "Rome", 2, 150000], // the Pope leaves for Paris
    ["Naples", "Naples", 2, 430000],
    ["Milan", "Milan", 2, 130000], // the Italian Republic's seat
    ["Amsterdam", "Amsterdam", 2, 200000], // Batavian, and paying for it
    ["Copenhagen", "Copenhagen", 2, 100000], // neutral fleet Britain eyes
    ["Stockholm", "Stockholm", 1, 75000],
    ["Warsaw", "Warsaw", 1, 65000], // Prussian, for now
    ["Trieste", [13.77, 45.65], 1, 30000], // Austria's one great port
    ["Cadiz", [-6.29, 36.53], 1, 70000], // the combined fleet's harbor
    ["Boulogne", [1.61, 50.73], 1, 12000], // the invasion camp faces England
    // — The wider world —
    ["Washington", "Washington", 1, 8000], // a capital in a swamp
    ["New Orleans", [-90.07, 29.95], 1, 10000], // American for eighteen months
    ["Port-au-Prince", [-72.34, 18.54], 1, 20000], // the first Black republic
    ["Mexico City", "Mexico City", 2, 140000], // New Spain's silver capital
    ["Lima", "Lima", 2, 60000],
    ["Rio de Janeiro", "Rio de Janeiro", 2, 60000],
    ["Cape Town", "Cape Town", 1, 16000], // Batavian again, briefly
    ["Cairo", "Cairo", 2, 260000], // the French gone, the Albanians arriving
    ["Diriyah", [46.57, 24.73], 1, 15000], // the Wahhabi capital — Mecca fell last year
    ["Tehran", "Tehran", 1, 50000], // the Qajar seat
    ["Lahore", "Lahore", 2, 120000], // Ranjit Singh's court
    ["Pune", [73.86, 18.52], 1, 100000], // the Peshwa under Company protection
    ["Calcutta", [88.36, 22.57], 2, 200000], // the Company's true capital
    ["Delhi", "New Delhi", 2, 150000], // the blind emperor, a pensioner
    ["Canton", "Guangzhou", 2, 800000], // the one open door to the Qing
    ["Beijing", "Beijing", 4, 1100000],
    ["Hanseong", "Seoul", 2, 190000], // 순조 4년의 한성
    ["Edo", "Tokyo", 3, 1000000], // the shogun's million-strong capital
    ["Bangkok", "Bangkok", 1, 50000], // Rattanakosin, twenty-two years old
    ["Hue", [107.58, 16.46], 1, 30000], // Gia Long's new imperial seat
  ],

  simulationRules:
    "It is 1 December 1804. TOMORROW Napoleon crowns himself emperor in Notre-Dame. Britain " +
    "and France have been at war since May 1803; the Grande Armée waits at Boulogne facing " +
    "England; Spain was dragged into the war weeks ago (Britain seized her treasure fleet in " +
    "October). The THIRD COALITION is forming — Austria and Russia sign on through 1805, " +
    "Prussia stays armed and neutral until it is too late historically. DEFLECTABLE " +
    "TRAJECTORIES the campaign may bend, each requiring an event that narrates the bend: " +
    "Trafalgar (October 1805) breaks French sea power; Ulm and Austerlitz (late 1805) break " +
    "the coalition; the Holy Roman Empire dissolves and the Rheinbund replaces it (1806); " +
    "Prussia fights alone and collapses at Jena (1806); the Continental System (1806) turns " +
    "the war economic; Spain revolts and the Peninsular ulcer opens (1808); Russia is " +
    "invaded (1812). ERA CONSTRAINTS: armies march at foot-and-forage pace and news travels " +
    "for weeks — no coordination faster than a courier; naval movement and blockade run " +
    "through the sea regions and Britain's fleet is supreme AFTER Trafalgar, contested " +
    "before it; Britain fights above its weight by financing coalitions — subsidies are a " +
    "weapon; battles produce casualty figures and named commanders in their events. THE " +
    "WIDER WORLD: Haiti declared independence on 1 January 1804 and Dessalines was crowned " +
    "emperor in October — France does not accept the loss; the First Serbian Uprising " +
    "against the janissaries began in February 1804 inside Ottoman Serbia; the Wahhabi " +
    "emirate of Diriyah took Mecca in 1803 and raids deep into Ottoman Iraq and Hejaz; " +
    "Persia and Russia are at war over the Caucasus (1804-13); the East India Company has " +
    "just broken the Marathas' northern armies (Delhi and Assaye, 1803) and holds the " +
    "Mughal emperor as a pensioner — the Holkar campaign is still burning; Ranjit Singh is " +
    "consolidating the Sikh state at Lahore; the Qing trade only through Canton; Joseon " +
    "and Tokugawa Japan enforce seclusion — foreign approaches are rebuffed absent " +
    "extraordinary narrative cause. MAP APPROXIMATIONS the rules carry: the Holy Roman " +
    "Empire aggregate stands for dozens of surviving principalities (Bavaria, Saxony, " +
    "Baden, Württemberg chief among them — they act through the aggregate until the Reich " +
    "dissolves); Hanover is drawn as its own electorate under French occupation; the " +
    "Ottoman Balkans and Barbary coast are nominal rule over autonomous pashas and deys; " +
    "the Maratha interior is a confederacy of rival houses (Scindia, Holkar, Bhonsle), not " +
    "one court; Durrani Kabul's hold on the Indus is contested. Sovereignty transfers only " +
    "with occupation per the engine's standing rules; player actions are attempts, never " +
    "decrees for other courts.",

  startingTimelineText:
    "The Revolution is fifteen years old and has produced, of all things, a crown. The " +
    "Corsican artillery officer who saved the Republic now rules it as First Consul for " +
    "life, and tomorrow he trades the fiction away: emperor of the French, anointed by a " +
    "Pope brought to Paris for the purpose. Britain has been back at war with him for " +
    "eighteen months — its answer to Boulogne's invasion camp is the fleet, its answer to " +
    "the fleet's limits is gold, and its gold is buying a third coalition in Vienna and " +
    "St Petersburg. The old Europe he faces is already half-dissolved: the Holy Roman " +
    "Empire is a legal ghost, Poland has been carved off the map by three empires, Spain's " +
    "fleet sails at France's command, and the Netherlands, Switzerland and northern Italy " +
    "answer to Paris under republican names. Beyond Europe the shocks radiate outward — " +
    "Haiti has burned its way to the first Black republic, the Company's sepoy armies have " +
    "broken the Marathas at Delhi and Assaye, Wahhabi riders hold Mecca, and a one-eyed " +
    "genius at Lahore is forging the Punjab into a state. The next decade belongs to " +
    "whoever survives it.",
};

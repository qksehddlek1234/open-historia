/*! Open Historia — Victorian Era 1836 scenario preset © 2026 Nicholas Krol, MIT (see src/Editor/LICENSE). */
// The Victorian Era — 1 January 1836. Not quite Victoria yet: William IV has
// eighteen months to live, and the eighteen-year-old princess is one heartbeat
// from the throne. The long peace of the Concert holds in Europe while
// everything underneath it moves — railways, telegraph experiments, the Great
// Trek, the Alamo under siege, Muhammad Ali ruling from the Sudan to the
// Taurus, and a dead-broke Texas provisional government declaring itself into
// existence.
//
// Mid-century's absent nations are the point: no Germany, no Italy, no
// unified anything — the aggregate-minor-state pattern carries the
// confederations, and unification is a CONDITIONAL the rules price, not a
// scheduled event.

export default {
  id: "victorian-1836",

  meta: {
    name: "Victorian Era — 1836",
    heroTitle: "The Age of Steam",
    heroSubtitle: "The old order runs on new rails, 1 January 1836",
    eyebrow: "The Industrial Age",
    subtitle: "1 January 1836",
    accentColor: "#8a6d3b",
    coverImage: "public/loading_screen_2.jpg",
    description:
      "The Alamo is under siege, the Great Trek is rolling north, and Muhammad Ali rules " +
      "from Sudan to the Taurus mountains. Britain's railways and gunboats are knitting a " +
      "world market nobody voted for; Germany and Italy do not exist yet. Steer any power " +
      "through the age when steam rewrote every distance on the map.",
  },

  relabelOwnedCountries: false,
  unassignedKeepModernOwner: false,

  // Player starts as the United Kingdom — the workshop of the world,
  // eighteen months before Victoria gives the era its name.
  game: { country: "GBR", startDate: "1836-01-01", gameDate: "1836-01-01" },

  polities: {
    GBR: { name: "United Kingdom", color: "#c0507a", aliases: ["영국", "대영제국", "Britain", "Great Britain", "British Empire", "East India Company"] },
    FRA: { name: "France", color: "#3f5fd0", aliases: ["프랑스", "7월 왕정", "July Monarchy", "Orléanist France"] },
    RUS: { name: "Russian Empire", color: "#8b9a54", aliases: ["러시아 제국", "러시아", "Russia"] },
    AUT: { name: "Austrian Empire", color: "#e8d878", aliases: ["오스트리아 제국", "오스트리아", "Austria", "Habsburg Monarchy"] },
    PRU: { name: "Kingdom of Prussia", color: "#4a6a8a", aliases: ["프로이센", "Prussia"] },
    GER: { name: "German Confederation", color: "#b8b8a0", aliases: ["독일 연방", "독일 제후국들", "German minor states", "Deutscher Bund"] },
    OTT: { name: "Ottoman Empire", color: "#5a8a6a", aliases: ["오스만 제국", "오스만", "Turkey", "Sublime Porte"] },
    EGY: { name: "Egypt of Muhammad Ali", color: "#c8a03e", aliases: ["무함마드 알리의 이집트", "이집트", "Egypt", "Khedivate"] },
    ESP: { name: "Spain", color: "#d0a02e", aliases: ["스페인", "Spanish Empire", "Isabelline Spain"] },
    POR: { name: "Portugal", color: "#2e7d6b", aliases: ["포르투갈", "Portuguese Empire"] },
    BEL: { name: "Belgium", color: "#7a8a4a", aliases: ["벨기에", "Kingdom of Belgium"] },
    NLD: { name: "Netherlands", color: "#c87a3e", aliases: ["네덜란드", "Holland", "Dutch Empire"] },
    DAN: { name: "Denmark", color: "#8a5f6d", aliases: ["덴마크", "Kingdom of Denmark"] },
    SWE: { name: "Sweden-Norway", color: "#4068bf", aliases: ["스웨덴-노르웨이", "스웨덴", "Sweden"] },
    GRE: { name: "Kingdom of Greece", color: "#5b8fd8", aliases: ["그리스 왕국", "그리스", "Greece", "Othonian Greece"] },
    SER: { name: "Principality of Serbia", color: "#7a6a9a", aliases: ["세르비아 공국", "세르비아", "Serbia"] },
    SAR: { name: "Kingdom of Sardinia", color: "#9a7ab0", aliases: ["사르데냐 왕국", "사보이아", "Piedmont-Sardinia", "Sardinia"] },
    SIC: { name: "Two Sicilies", color: "#a06a4a", aliases: ["양시칠리아 왕국", "나폴리", "Kingdom of the Two Sicilies", "Naples"] },
    PAP: { name: "Papal States", color: "#e8e0c0", aliases: ["교황령", "Papacy", "Rome"] },
    ITD: { name: "Italian Duchies", color: "#c8b88a", aliases: ["이탈리아 공국들", "토스카나", "Tuscany", "Parma", "Modena"] },
    QAJ: { name: "Qajar Persia", color: "#b07a3e", aliases: ["카자르 페르시아", "페르시아", "Persia", "Iran"] },
    AFG: { name: "Emirate of Kabul", color: "#6b7a5a", aliases: ["카불 토후국", "아프가니스탄", "Afghanistan", "Dost Mohammad's emirate"] },
    SIK: { name: "Sikh Empire", color: "#d8b83e", aliases: ["시크 제국", "라호르 왕국", "Punjab", "Ranjit Singh's empire"] },
    QIN: { name: "Qing Empire", color: "#b23b3b", aliases: ["청", "청나라", "China", "Qing China"] },
    JOS: { name: "Joseon", color: "#5b7fae", aliases: ["조선", "Korea", "South Korea", "North Korea"] },
    JAP: { name: "Tokugawa Japan", color: "#a85454", aliases: ["에도 일본", "일본", "Japan", "Tokugawa shogunate"] },
    SIA: { name: "Siam", color: "#4a7ab0", aliases: ["시암", "라따나꼬신", "Thailand", "Rattanakosin"] },
    BUR: { name: "Konbaung Burma", color: "#7a9a4a", aliases: ["꼰바웅 버마", "버마", "Burma", "Myanmar"] },
    VIE: { name: "Nguyen Vietnam", color: "#5a9a7a", aliases: ["응우옌 베트남", "베트남", "Vietnam"] },
    USA: { name: "United States", color: "#4a8f7a", aliases: ["미국", "America", "Jacksonian America"] },
    MEX: { name: "Mexico", color: "#6b8a3e", aliases: ["멕시코", "Centralist Mexico", "Santa Anna's Mexico"] },
    TEX: { name: "Republic of Texas", color: "#bf6a4a", aliases: ["텍사스 공화국", "텍사스", "Texas", "Texian rebellion"] },
    FCA: { name: "Central America", color: "#8ab0d4", aliases: ["중앙아메리카 연방", "Federal Republic of Central America", "United Provinces of Central America"] },
    HTI: { name: "Haiti", color: "#8a3a5a", aliases: ["아이티", "Boyer's Haiti", "Hayti"] },
    PBC: { name: "Peru-Bolivian Confederation", color: "#7a5aa0", aliases: ["페루-볼리비아 국가연합", "페루", "볼리비아", "Peru", "Bolivia", "Santa Cruz confederation"] },
    HAW: { name: "Kingdom of Hawaii", color: "#4a9a9a", aliases: ["하와이 왕국", "하와이", "Hawaii", "Sandwich Islands"] },
  },

  countryAssignments: {
    GBR: ["GBR", "IRL", "CAN", "AUS", "NZL", "LKA", "MLT", "ZAF", "GUY", "BLZ", "JAM", "BRB", "TTO", "BHS", "SLE", "GMB"],
    FRA: ["FRA", "DZA"], // Algiers taken 1830 — the conquest is young and contested
    RUS: ["RUS", "UKR", "BLR", "LTU", "LVA", "EST", "FIN", "GEO", "ARM", "AZE", "MDA", "KAZ"],
    AUT: ["AUT", "CZE", "SVK", "HUN", "HRV", "SVN"],
    OTT: ["TUR", "BGR", "MKD", "BIH", "MNE", "ALB", "XKO", "ROU", "CYP", "IRQ", "KWT"],
    EGY: ["EGY", "SDN", "SSD", "SYR", "LBN", "JOR", "ISR", "PSE", "SAU"], // the pasha's decade — see rules
    ESP: ["ESP", "CUB", "PRI", "PHL", "GUM"],
    POR: ["PRT", "AGO", "MOZ", "GNB", "CPV", "STP", "TLS"],
    BEL: ["BEL"],
    NLD: ["NLD", "LUX", "IDN", "SUR"],
    DAN: ["DNK", "ISL", "GRL", "FRO"],
    SWE: ["SWE", "NOR"],
    GRE: ["GRC"],
    SER: ["SRB"],
    QAJ: ["IRN", "TKM"],
    AFG: ["AFG"],
    SIK: ["PAK"], // Punjab, Kashmir, Peshawar — Sindh's emirs approximated in, see rules
    QIN: ["CHN", "TWN", "MNG"],
    JOS: ["KOR", "PRK"],
    JAP: ["JPN"],
    SIA: ["THA", "LAO", "KHM"],
    BUR: ["MMR"],
    VIE: ["VNM"],
    USA: ["USA"],
    MEX: ["MEX"],
    FCA: ["GTM", "HND", "SLV", "NIC", "CRI"],
    HTI: ["HTI", "DOM"], // Boyer rules the whole island — Santo Domingo occupied since 1822
    PBC: ["PER", "BOL"],
    // The subcontinent's default owner is the Company — princely India rides as approximation.
    // (IND baseline assigned to GBR via regions below where it differs from SIK.)
  },

  regionAssignments: {
    // ── The Americas ──
    "USA.44_1": "TEX",  // Texas — in armed revolt; independence declared 2 March historically
    "USA.32_1": "MEX", "USA.3_1": "MEX", "USA.5_1": "MEX", "USA.29_1": "MEX", "USA.45_1": "MEX", // Mexican north
    "USA.6_1": "MEX",   // Colorado — mostly Mexican above the Arkansas
    "USA.48_1": "GBR", "USA.38_1": "GBR", "USA.13_1": "GBR", // Oregon Country — jointly occupied, HBC in fact
    "USA.2_1": "RUS",   // Russian America
    "USA.12_1": "HAW",  // the Kamehameha kingdom
    // ── Poland after the November Uprising ──
    "POL.7_1": "RUS", "POL.3_1": "RUS", "POL.4_1": "RUS", "POL.10_1": "RUS", "POL.13_1": "RUS", // Congress Poland, autonomy revoked
    "POL.15_1": "PRU", "POL.2_1": "PRU", "POL.11_1": "PRU", "POL.14_1": "PRU", "POL.16_1": "PRU", "POL.5_1": "PRU", "POL.1_1": "PRU", "POL.8_1": "PRU", "POL.12_1": "PRU",
    "POL.6_1": "AUT",   // Kraków — a free city on paper, Austrian in orbit (annexed 1846)
    "POL.9_1": "AUT",   // Galicia
    "RUS.21_1": "PRU",  // Königsberg
    // ── Germany: Prussia, Austria and the Bund's minors ──
    "DEU.4_1": "PRU", "DEU.3_1": "PRU", "DEU.13_1": "PRU", "DEU.10_1": "PRU", "DEU.11_1": "PRU", "DEU.12_1": "PRU", // Rhineland Prussian since 1815
    "DEU.8_1": "GER", "DEU.2_1": "GER", "DEU.1_1": "GER", "DEU.7_1": "GER", "DEU.14_1": "GER", "DEU.16_1": "GER", "DEU.9_1": "GER", "DEU.6_1": "GER", "DEU.5_1": "GER",
    "DEU.15_1": "DAN",  // the duchies — the Schleswig question is loaded, not fired
    // ── Italy: a geographic expression ──
    "ITA.13_1": "SAR", "ITA.9_1": "SAR", "ITA.19_1": "SAR", "ITA.14_1": "SAR",
    "ITA.10_1": "AUT", "ITA.20_1": "AUT", "ITA.7_1": "AUT", "ITA.17_1": "AUT", // Lombardy-Venetia
    "ITA.16_1": "ITD", "ITA.6_1": "ITD", // Tuscany, Parma-Modena — the duchies
    "ITA.8_1": "PAP", "ITA.18_1": "PAP", "ITA.11_1": "PAP",
    "ITA.5_1": "SIC", "ITA.1_1": "SIC", "ITA.12_1": "SIC", "ITA.2_1": "SIC", "ITA.3_1": "SIC", "ITA.4_1": "SIC", "ITA.15_1": "SIC",
    // ── India: the Company's map, with the Sikh exception ──
    "IND.28_1": "SIK", "IND.13_1": "SIK", "IND.6_1": "SIK",
    "IND.36_1": "GBR", "IND.5_1": "GBR", "IND.15_1": "GBR", "IND.26_1": "GBR", "IND.34_1": "GBR", "IND.35_1": "GBR",
    "IND.25_1": "GBR", "IND.12_1": "GBR", "IND.31_1": "GBR", "IND.2_1": "GBR", "IND.32_1": "GBR", "IND.16_1": "GBR",
    "IND.17_1": "GBR", "IND.20_1": "GBR", "IND.11_1": "GBR", "IND.19_1": "GBR", "IND.29_1": "GBR", "IND.7_1": "GBR",
    "IND.4_1": "GBR",  // Assam — annexed after the Burma war
    "IND.10_1": "POR", // Goa
  },

  // Era cities: [name, modern-seed-name | [lng,lat], tier, population ~1836].
  cities: [
    ["London", "London", 4, 1800000], // the world's counting-house
    ["Manchester", [-2.24, 53.48], 2, 300000], // the steam century's shop floor
    ["Paris", "Paris", 4, 900000], // the citizen-king's capital
    ["Vienna", "Vienna", 3, 330000], // Metternich's chancellery
    ["Berlin", "Berlin", 2, 280000], // Zollverein headquarters in effect
    ["Saint Petersburg", [30.32, 59.94], 3, 450000], // Nicholas I's parade ground
    ["Moscow", "Moscow", 2, 340000],
    ["Warsaw", "Warsaw", 1, 130000], // citadel-watched since the uprising
    ["Constantinople", "Istanbul", 3, 550000], // Mahmud II rebuilding an army
    ["Cairo", "Cairo", 3, 260000], // the pasha's arsenal-state
    ["Damascus", [36.3, 33.51], 1, 110000], // Egyptian-held Syria
    ["Athens", "Athens", 1, 20000], // a new-built capital for King Otto
    ["Belgrade", "Belgrade", 1, 30000], // Miloš's autonomous principality
    ["Madrid", "Madrid", 2, 220000], // civil war in the north — the Carlists
    ["Lisbon", "Lisbon", 2, 240000],
    ["Brussels", [4.35, 50.85], 1, 100000], // five years independent, unrecognized by the Dutch
    ["Amsterdam", "Amsterdam", 2, 210000],
    ["Rome", "Rome", 2, 150000],
    ["Naples", "Naples", 2, 350000],
    ["Milan", "Milan", 2, 150000], // Austrian Lombardy's silk and sedition
    ["Turin", [7.69, 45.07], 1, 120000],
    ["Stockholm", "Stockholm", 1, 80000],
    ["Copenhagen", "Copenhagen", 1, 120000],
    // — The wider world —
    ["Washington", "Washington", 2, 20000], // Jackson's second term
    ["New York", "New York", 3, 270000],
    ["New Orleans", [-90.07, 29.95], 2, 60000], // the cotton port
    ["Mexico City", "Mexico City", 2, 170000], // Santa Anna marching north
    ["San Antonio", [-98.49, 29.42], 1, 2500], // the Alamo — under the guns
    ["Guatemala City", "Guatemala City", 1, 40000], // Morazán's federation fraying
    ["Port-au-Prince", [-72.34, 18.54], 1, 30000], // Boyer rules the whole island
    ["Rio de Janeiro", "Rio de Janeiro", 2, 140000], // a boy emperor, a regency
    ["Buenos Aires", "Buenos Aires", 2, 65000], // Rosas returns to power this year
    ["Lima", "Lima", 2, 55000], // Santa Cruz forging his confederation
    ["Santiago", "Santiago", 1, 70000], // Portales plotting the war against it
    ["Cape Town", "Cape Town", 1, 20000], // the Great Trek is leaving
    ["Algiers", [3.06, 36.75], 1, 30000], // six years into the French conquest
    ["Tehran", "Tehran", 1, 60000],
    ["Kabul", "Kabul", 1, 60000], // Dost Mohammad between two empires
    ["Lahore", "Lahore", 2, 120000], // the old lion's last years
    ["Calcutta", [88.36, 22.57], 3, 230000], // the Company's capital
    ["Canton", "Guangzhou", 3, 900000], // the opium ledgers swelling
    ["Beijing", "Beijing", 4, 1200000],
    ["Hanseong", "Seoul", 2, 200000], // 헌종 2년의 한성
    ["Edo", "Tokyo", 3, 1100000],
    ["Honolulu", [-157.86, 21.31], 1, 13000], // whalers, missionaries, a king
    ["Sydney", [151.21, -33.87], 1, 20000],
  ],

  simulationRules:
    "It is 1 January 1836. The Concert of Europe's long peace holds between great powers — " +
    "and everything beneath it is in motion. LIVE CONFLICTS: the TEXAS REVOLT is under way " +
    "(San Antonio just fell to the rebels; Santa Anna is marching north with the army — the " +
    "Alamo, Goliad and San Jacinto are the historical spring); Spain's FIRST CARLIST WAR " +
    "burns in the Basque country; the GREAT TREK is rolling out of the Cape Colony into the " +
    "Zulu and Ndebele worlds; Chile is preparing war on Santa Cruz's PERU-BOLIVIAN " +
    "CONFEDERATION (proclaimed formally in October 1836; the confederation dies at Yungay " +
    "in 1839 historically); Egypt's MUHAMMAD ALI rules Syria, the Hejaz and the Sudan after " +
    "beating his own sultan — the second Ottoman-Egyptian war (1839) and the European " +
    "intervention that rolls him back are the standing trajectory. THE GREAT GAME: Russia " +
    "presses toward the Caucasus and the steppe, Britain fears for India — Persia besieges " +
    "Herat in 1837, the First Anglo-Afghan War (1839-42) ends in the destruction of a " +
    "British army; Dost Mohammad plays both empires. CONDITIONAL UNIFICATIONS, not " +
    "scheduled events: Germany exists as the Bund plus a Prussian customs union " +
    "(Zollverein, launched 1834) — unification requires a crisis that discredits Austria " +
    "AND a Prussia willing to lead; Italy requires Austria beaten in Lombardy — absent " +
    "those conditions the aggregates hold, and the engine narrates failed 1848-style " +
    "revolutions rather than gifting borders. AND THE CONDITION IS COUNTABLE, which is " +
    "what stops it being a mood: before any German state may be proclaimed, COUNT the " +
    "German polities on the map that one power holds or has bound into its league — the " +
    "Bund's thirty-odd members plus Prussia's own lands. Below about two thirds of them " +
    "there is no empire to proclaim, only a stronger Prussia. At two thirds or more " +
    "WITHOUT Austria, what forms is a NORTH GERMAN state that Bavaria, Baden and " +
    "Württemberg may or may not join and that Vienna certainly does not. Only a count " +
    "that INCLUDES the Austrian German lands produces a Greater Germany, and that " +
    "requires Austria beaten or willing rather than merely excluded. Say the count in the " +
    "event that proclaims it. Italy runs the same way over its own list — Sardinia, the " +
    "duchies, the Legations, Naples, and the Patrimony LAST rather than first. A " +
    "unification narrated before its count is reached is a gifted border and must not " +
    "happen. FIXED-CALENDAR ANCHORS: William IV dies June " +
    "1837 and VICTORIA accedes at eighteen (Hanover splits off under Salic law); Boyer's " +
    "Haiti loses Santo Domingo to Dominican revolt in 1844; the Opium crisis at Canton " +
    "breaks into war in 1839; Ranjit Singh dies in 1839 and the Sikh state begins eating " +
    "itself. THE LONGER CHRONOLOGY, WHICH IS THE MODEL'S ANCHOR AND NOT THE PLAYER'S " +
    "CALENDAR — never print these as a schedule and never let a character foresee one; " +
    "they are what the real century did, and this board departs from them the moment " +
    "anyone acts differently: the Texan revolt and San Jacinto (1836); the Carlist war in " +
    "Spain and the dissolution of the Central American federation (later 1830s); the " +
    "Anglo-Chinese war and the treaty that opens the ports (1839-42); the year of " +
    "revolutions and the parliament at Frankfurt that fails (1848-49); the Great " +
    "Exhibition (1851) and the second French Empire (1852); the Crimean war, in which " +
    "RAILWAY CONSTRUCTION is the decisive variable and either side can win it (1853-56); " +
    "the rebellion that ends Company rule in India (1857); the Italian war and the " +
    "kingdom proclaimed from it (1859-61); the emancipation of the Russian serfs (1861); " +
    "the American civil war (1861-65); the Polish January rising (1863); the Danish, " +
    "Austrian and French wars in succession (1864, 1866, 1870); the Russian conquest of " +
    "the Central Asian khanates (1864-85). ERA CONSTRAINTS: railways exist only as short lines in Britain, Belgium and " +
    "the American seaboard — strategic movement is still sail, horse and canal; the " +
    "telegraph is a laboratory toy until the 1840s; news crosses oceans in weeks; " +
    "cholera recurs without warning or cure. MAP APPROXIMATIONS the rules carry: the " +
    "German Confederation aggregate stands for thirty-odd sovereign states (Bavaria, " +
    "Saxony, Hanover, Württemberg chief among them); Kraków is a free city drawn Austrian; " +
    "Oregon is jointly occupied and drawn British where the Hudson's Bay Company actually " +
    "trades; princely India rides inside the Company's color; Sindh's emirs ride inside " +
    "the Sikh color; the Ottoman Balkans are autonomous in fact wherever the map shows " +
    "them ruled; Haiti's color covers Santo Domingo because Boyer's army does. Sovereignty " +
    "moves only with occupation; player actions are attempts, never decrees.",

  startingTimelineText:
    "Twenty years after Waterloo, the peace of the congresses still stands — no great power " +
    "has fought another since, and the diplomats intend to keep it that way. But the world " +
    "the congresses froze is thawing from below. In Britain the first passenger railways " +
    "are running and the Reform Act has let the manufacturers into parliament; the " +
    "workshop of the world now wants the world as its customer. France is a monarchy again " +
    "but a citizen-king's, nervous of its own barricades. Russia under Nicholas is the " +
    "gendarme of Europe, Poland's autonomy freshly revoked to prove it. The Ottoman sultan " +
    "has lost Greece to independence, Algiers to France, and Syria to his own pasha — " +
    "Muhammad Ali of Egypt, whose new-model army beat the empire it nominally serves. In " +
    "the Americas the map is still wet: Texas is in armed revolt against Mexico, Chile is " +
    "sharpening a war against the new confederation on its border, and a boy emperor's " +
    "regents hold Brazil together. The Company rules India from Calcutta, one Sikh kingdom " +
    "and one mountain emirate short of the whole subcontinent. Canton's opium ledgers, " +
    "Cape Town's departing wagons and Honolulu's whaling fleets all point the same " +
    "direction: steam and trade are shrinking every distance, and the powers that master " +
    "the shrinking will write the next half-century. The princess is eighteen. The age " +
    "that will bear her name has already begun.",
};

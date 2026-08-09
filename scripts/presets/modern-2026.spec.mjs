/*! Open Historia — 2026 scenario preset © 2026 Nicholas Krol, MIT (see src/Editor/LICENSE). */
// 2026 — 1 January 2026. The present day, which is also the biggest gap.
//
// The original's "2026 Detailed and More Provinces" is its third most played
// preset (11M rounds) and we had nothing at this date at all: the fleet ran
// 1946 → 1950 → 1989 → 2000 and then stopped, twenty-six years short of now.
// See docs/analysis/presets-original.md (the 2026-08-09 re-survey).
//
// WHAT A PRESENT-DAY BOARD IS FOR, AND WHY IT IS BUILT DIFFERENTLY.
//
// Every other spec in the fleet spends most of its length undoing the modern
// map. This one keeps it: `unassignedKeepModernOwner` is doing almost all the
// work, because on 1 January 2026 the modern map IS the map. What the spec has
// to carry instead is the handful of places where the grid and the ground
// disagree — and in 2026 that means occupied Ukraine above all.
//
// THE OCCUPATION LINE IS DRAWN AT OBLAST GRANULARITY AND THAT IS A LIE OF
// SCALE. Russia holds Crimea and Sevastopol entirely, effectively all of
// Luhansk and most of Donetsk; in Zaporizhzhia and Kherson the front runs
// THROUGH the oblast and both provincial capitals are Ukrainian-held. Our grid
// has one region per oblast, so those two go to Ukraine and the rules say where
// the line actually is. Drawing them Russian would hand Moscow two cities it
// does not hold, which is the worse error.
//
// The other wars of 2026 — Sudan, Myanmar, the Sahel — are civil wars whose
// fronts do not follow provincial boundaries at all. They live in the rules
// rather than the grid, the same way the 1946 spec carries Indochina and
// Indonesia. Where a rebel movement holds a whole province the simulation is
// told to create the polity for it.
//
// Cities are the modern seed's own, so this spec declares none.

export default {
  id: "modern-2026",

  meta: {
    name: "2026 — The Present Day",
    heroTitle: "Everything At Once",
    heroSubtitle: "The world as it stands, 1 January 2026",
    eyebrow: "The Present",
    subtitle: "1 January 2026",
    accentColor: "#3f6f8a",
    coverImage: "public/loading_screen_2.jpg",
    description:
      "The largest war in Europe since 1945 is in its fifth year. A Middle East " +
      "rebuilt twice over in two years. Sudan starving, the Sahel closed to the " +
      "west, Taiwan watched by everyone. The institutions that were supposed to " +
      "handle all of this are the ones from 1945, and they are audibly straining. " +
      "Take any of it from here.",
  },

  relabelOwnedCountries: false,
  // 2026 borders ARE modern borders almost everywhere — that is the whole point
  // of this date, and it is why this spec is short.
  unassignedKeepModernOwner: true,

  // The player starts as the Republic of Korea: a middle power with a nuclear
  // neighbour, a treaty ally it cannot fully rely on, and two of the three
  // powers that decide the Pacific on its doorstep. It is also the seat this
  // game is read from.
  game: { country: "KOR", startDate: "2026-01-01", gameDate: "2026-01-01" },

  polities: {
    // ── 전쟁 중인 유럽 ────────────────────────────────────────────────────────
    RUS: { name: "Russian Federation", color: "#a03c28", aliases: ["러시아", "Russia", "Moscow", "Kremlin", "Putin"] },
    UKR: { name: "Ukraine", color: "#3f7fd0", aliases: ["우크라이나", "Ukraine", "Kyiv", "Kiev"] },
    BLR: { name: "Belarus", color: "#8d6236", aliases: ["벨라루스", "Belarus", "Minsk", "Lukashenko"] },
    // ── 서방 ─────────────────────────────────────────────────────────────────
    USA: { name: "United States", color: "#4a8f7a", aliases: ["미국", "America", "United States of America", "Washington"] },
    GBR: { name: "United Kingdom", color: "#c0507a", aliases: ["영국", "United Kingdom", "Britain", "London"] },
    FRA: { name: "French Republic", color: "#3f6fd0", aliases: ["프랑스", "France", "Paris"] },
    DEU: { name: "Germany", color: "#8a8a9a", aliases: ["독일", "Germany", "Berlin", "Bundesrepublik"] },
    POL: { name: "Poland", color: "#b0705a", aliases: ["폴란드", "Poland", "Warsaw"] },
    // ── 아시아 ───────────────────────────────────────────────────────────────
    CHN: { name: "People's Republic of China", color: "#c0392b", aliases: ["중국", "China", "PRC", "Beijing"] },
    TWN: { name: "Taiwan", color: "#4a6db5", aliases: ["대만", "타이완", "Taiwan", "Republic of China", "Taipei"] },
    KOR: { name: "Republic of Korea", color: "#3a7fbf", aliases: ["대한민국", "한국", "남한", "South Korea", "Seoul"] },
    PRK: { name: "Democratic People's Republic of Korea", color: "#a33232", aliases: ["북한", "조선민주주의인민공화국", "North Korea", "DPRK", "Pyongyang"] },
    JPN: { name: "Japan", color: "#b23b3b", aliases: ["일본", "Japan", "Tokyo"] },
    IND: { name: "India", color: "#d08a3a", aliases: ["인도", "India", "Bharat", "New Delhi"] },
    PAK: { name: "Pakistan", color: "#4a8f5a", aliases: ["파키스탄", "Pakistan", "Islamabad"] },
    // 2021년 8월 이래 탈레반 정권. 어느 나라도 정식 승인하지 않았지만 통치는 한다.
    AFG: { name: "Islamic Emirate of Afghanistan", color: "#7a7a5a", aliases: ["아프가니스탄", "Afghanistan", "Taliban", "탈레반", "Kabul"] },
    // ── 중동 ─────────────────────────────────────────────────────────────────
    ISR: { name: "Israel", color: "#5a8fc0", aliases: ["이스라엘", "Israel", "Jerusalem"] },
    PSE: { name: "Palestine", color: "#7a9a5a", aliases: ["팔레스타인", "Palestine", "Gaza", "West Bank", "Ramallah"] },
    IRN: { name: "Islamic Republic of Iran", color: "#5a8a6a", aliases: ["이란", "Iran", "Tehran"] },
    // 2024년 12월 아사드 정권이 무너지고 과도정부가 들어섰다.
    SYR: { name: "Syrian Arab Republic", color: "#9a7a5a", aliases: ["시리아", "Syria", "Damascus", "과도정부"] },
    TUR: { name: "Türkiye", color: "#c05a4a", aliases: ["튀르키예", "터키", "Turkey", "Ankara", "Erdogan"] },
    SAU: { name: "Saudi Arabia", color: "#7a9a6a", aliases: ["사우디아라비아", "Saudi Arabia", "Riyadh"] },
    // ── 그 밖의 주요 행위자 ───────────────────────────────────────────────────
    BRA: { name: "Brazil", color: "#5a9a5a", aliases: ["브라질", "Brazil", "Brasilia"] },
    ZAF: { name: "South Africa", color: "#a87a5a", aliases: ["남아프리카 공화국", "남아공", "South Africa", "Pretoria"] },
    NGA: { name: "Nigeria", color: "#8a9a4a", aliases: ["나이지리아", "Nigeria", "Abuja"] },
    // 2023년 4월 이래 정부군과 신속지원군의 내전. 세계 최대의 인도적 위기다.
    SDN: { name: "Sudan", color: "#b0a05a", aliases: ["수단", "Sudan", "Khartoum", "Port Sudan", "SAF"] },
  },

  countryAssignments: {
    RUS: ["RUS"],
    UKR: ["UKR"],
    BLR: ["BLR"],
    USA: ["USA", "PRI", "GUM", "VIR", "MNP"],
    GBR: ["GBR"],
    FRA: ["FRA"],
    DEU: ["DEU"],
    POL: ["POL"],
    CHN: ["CHN"],
    TWN: ["TWN"],
    KOR: ["KOR"],
    PRK: ["PRK"],
    JPN: ["JPN"],
    IND: ["IND"],
    PAK: ["PAK"],
    AFG: ["AFG"],
    ISR: ["ISR"],
    PSE: ["PSE"],
    IRN: ["IRN"],
    SYR: ["SYR"],
    TUR: ["TUR"],
    SAU: ["SAU"],
    BRA: ["BRA"],
    ZAF: ["ZAF"],
    NGA: ["NGA"],
    SDN: ["SDN"],
  },

  regionAssignments: {
    // ── 점령된 우크라이나 ─────────────────────────────────────────────────────
    // 오블라스트 단위라 실제 전선보다 굵다(위 머리주석 참조). 러시아가 사실상
    // 전부 쥔 넷만 넘기고, 자포리자와 헤르손은 주도를 우크라이나가 지키고
    // 있으므로 우크라이나에 남긴다 — 규칙이 전선의 위치를 말한다.
    "UKR.4_1": "RUS",   // 크림 — 2014년 이래
    "UKR.20_1": "RUS",  // 세바스토폴 — 2014년 이래
    "UKR.15_1": "RUS",  // 루한스크 — 사실상 전역
    "UKR.6_1": "RUS",   // 도네츠크 — 대부분
  },

  simulationRules:
    "It is 1 January 2026. Every border on this map is a modern border except " +
    "where a war has moved one, and the wars are the board. " +

    "UKRAINE. Russia's full-scale invasion is in its fifth year. The grid gives " +
    "Russia Crimea, Sevastopol, Luhansk and Donetsk oblasts because it holds " +
    "effectively all of the first three and most of the fourth. THE GRID IS " +
    "COARSER THAN THE FRONT: in Zaporizhzhia and Kherson oblasts the line runs " +
    "through the middle — Russia holds the south and east of both, Ukraine holds " +
    "both provincial capitals, and the Dnipro is the boundary below Kherson " +
    "city. Ukraine also holds pockets of the Donetsk oblast around its western " +
    "edge. Narrate the war along that real line, not along the oblast outlines, " +
    "and only transfer a whole oblast when a whole oblast has actually fallen. " +
    "The war is attritional and neither side is close to collapse: gains are " +
    "measured in villages and settlements per month, offensives cost more than " +
    "they take, and long-range strike campaigns run against energy infrastructure " +
    "and cities behind both lines. A ceasefire is possible in this period and is " +
    "a NEGOTIATION with terms, not an event that simply happens. " +

    "THE MIDDLE EAST HAS BEEN REMADE TWICE IN TWO YEARS. Gaza is ruined and its " +
    "governance unsettled after the war that began in October 2023. Hezbollah " +
    "was gutted in 2024 and Lebanon is trying to rebuild a state around that. " +
    "Assad fell in December 2024 and Syria is run by a caretaker government with " +
    "an Islamist core, incomplete control of its own territory, a Kurdish-held " +
    "northeast and Israeli and Turkish forces operating inside its borders. Iran " +
    "lost its forward position with him and is deciding what deterrence it has " +
    "left. Treat all of this as UNSETTLED — these are not stable postwar " +
    "arrangements, they are open questions with armed answers. " +

    "WARS THAT DO NOT FOLLOW PROVINCE LINES. Sudan's civil war between the armed " +
    "forces and the Rapid Support Forces is the largest displacement crisis in " +
    "the world; the RSF holds most of Darfur and the government holds the east " +
    "and Port Sudan. Myanmar's junta has lost much of the country's periphery to " +
    "ethnic armies and resistance forces while holding the centre. The Sahel " +
    "juntas — Mali, Burkina Faso, Niger — have left ECOWAS, expelled French and " +
    "American forces, and are fighting jihadist insurgencies with Russian help. " +
    "None of these fronts follow the region grid. Where an armed movement holds a " +
    "whole region, CREATE THE POLITY and transfer it; where it does not, keep the " +
    "war in the narration and the statistics rather than repainting provinces. " +

    "THE PACIFIC IS THE ONE THAT HAS NOT HAPPENED YET. China's pressure on " +
    "Taiwan is daily and below the threshold of war: air incursions, coast guard " +
    "operations around the offshore islands, undersea cable cuts, economic " +
    "coercion. An invasion is a decision nobody has taken; a blockade or a " +
    "quarantine is a nearer and cheaper one. North Korea has a mutual defence " +
    "treaty with Russia signed in 2024, has sent troops and shells west, and is " +
    "being paid in technology it could not otherwise buy — which is the single " +
    "development that most changes the player's own position. " +

    "INSTITUTIONS AND ALIGNMENT. NATO has thirty-two members after Finland and " +
    "Sweden, and its European members are rearming against both a Russian threat " +
    "and doubt about the American guarantee. The Security Council is deadlocked " +
    "by design. BRICS has expanded and means less than its size suggests. Middle " +
    "powers hedge rather than choose, and that hedging is the most common " +
    "diplomatic move on this board — the player included. " +

    "Technology and economy must reflect 2026: drones and loitering munitions " +
    "have changed the tactical picture at every scale and cheap ones now decide " +
    "engagements; electronic warfare and jamming are routine; satellite imagery " +
    "and commercial internet constellations are wartime infrastructure; " +
    "generative AI is a live political and economic question in every developed " +
    "country; semiconductors and critical minerals are strategic goods with " +
    "export controls attached; energy prices carry the war. The map approximates " +
    "control with modern administrative regions, and where a front runs through " +
    "one, the rules above say so.",

  startingTimelineText:
    "1 January 2026. In Ukraine the fifth winter of the war closes over a line that has " +
    "barely moved in a year and has cost both armies more than either will say. In Damascus " +
    "a government thirteen months old is discovering how much of Syria it does not control. " +
    "Gaza is rubble and the question of who administers it has no answer anybody has agreed " +
    "to. Sudan is the largest hunger crisis on earth and almost nobody is watching. In the " +
    "Taiwan Strait aircraft cross the median line every day and nothing happens, which is " +
    "what everyone is counting on. North Korean soldiers have been to Europe and come back " +
    "with what they learned. The order that came out of 1945 is still standing, still " +
    "issuing communiqués, and audibly straining at every joint.",
};

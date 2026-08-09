/*! Open Historia — Kaiserreich 1936 scenario preset © 2026 Nicholas Krol, MIT (see src/Editor/LICENSE). */
// KAISERREICH — 1 January 1936. The first alt-history board in the fleet.
//
// The original's "Kaiserreich" (Team Dynamo, 551K rounds) is the highest-round
// preset we had no answer to that is not simply another date. Eighteen scenarios
// in, every one of ours is history as it happened; this is the one that proves
// the fleet can carry a world that diverged.
//
// Read off the preset's own page on 2026-08-09 rather than from memory of the
// Hearts of Iron mod it adapts — the divergence paragraph, the alliance names
// and the conflict list below are its wording, not mine.
//
// THE POINT OF DIVERGENCE IS SINGLE AND DATED: everything up to 1917 happened.
// Germany wins the Weltkrieg — Brest-Litovsk takes Russia out, the United
// States never enters, and a negotiated peace in November 1919 cements German
// continental dominance. Berlin then builds the Reichspakt (the alliance) and
// Mitteleuropa (the economic bloc), installs the Ost-Staaten in eastern Europe
// — Kingdom of Poland, Kingdom of Lithuania, United Baltic Duchy, White
// Ruthenia, Ukrainian State — and takes colonies in Mittelafrika and Asia.
// Those settlements are what trigger the revolutions: syndicalism wins in
// Britain and France, and their governments flee to Canada and Algiers.
//
// SO `historicalPrior` IS OFF. Every other spec in the fleet asserts "everything
// before the start date happened as it really did", which is exactly false here
// and would fight the board on every turn.
//
// AND `scheduledEvents` IS OFF TOO, which is the more interesting one. The
// original states outright that the player must NEVER be warned, hinted toward
// or prepared for its dated events, and that dates must never be mentioned to
// them. Our end-of-turn calendar card exists to do the opposite. On a board
// whose whole tension is not knowing when the civil wars come, the card is not
// a feature, it is a spoiler — so this preset turns it off.

export default {
  id: "kaiserreich-1936",

  meta: {
    name: "Kaiserreich — 1936",
    heroTitle: "What If Germany Won",
    heroSubtitle: "The Weltkrieg ended in Berlin's favour — 1 January 1936",
    eyebrow: "Alternate History",
    subtitle: "1 January 1936",
    accentColor: "#4a4a6a",
    coverImage: "public/loading_screen_2.jpg",
    description:
      "Germany won the Weltkrieg and spent seventeen years building a continent " +
      "around that fact. Britain and France answered with revolutions and their " +
      "kings and presidents govern from Ottawa and Algiers. Russia is a republic " +
      "that lost, Italy is two countries, China is a dozen, and the United States " +
      "is one bad year from tearing itself apart. Nothing here is settled.",
  },

  relabelOwnedCountries: false,
  unassignedKeepModernOwner: true,

  // NOT the real world before this date — see the header. Turning this off is
  // the single most important line in the file.
  historicalPrior: false,
  // The calendar card would leak the scripted events this board is built to
  // surprise the player with. See the header.
  scheduledEvents: false,

  // The player starts as the German Empire: the power that won and now has to
  // hold a continent it did not have the men to garrison. Taking the Commune of
  // France or the Union of Britain is the other way to read this board.
  game: { country: "GER", startDate: "1936-01-01", gameDate: "1936-01-01" },

  polities: {
    // ── 라이히스팍트와 미텔오이로파 ───────────────────────────────────────────
    GER: { name: "German Empire", color: "#3a3a4a", aliases: ["독일 제국", "German Empire", "Deutsches Kaiserreich", "Germany", "Berlin", "Reichspakt"] },
    AUH: { name: "Austria-Hungary", color: "#c0a060", aliases: ["오스트리아-헝가리", "Austria-Hungary", "Habsburg", "Vienna", "Danubian"] },
    OTT: { name: "Ottoman Empire", color: "#7a9a5a", aliases: ["오스만 제국", "Ottoman Empire", "Sublime Porte", "Constantinople"] },
    BUL: { name: "Kingdom of Bulgaria", color: "#9a7a5a", aliases: ["불가리아 왕국", "Bulgaria", "Sofia"] },
    // 오스트-슈타텐 — 베를린이 세운 동유럽 위성 왕국들.
    POL: { name: "Kingdom of Poland", color: "#b0705a", aliases: ["폴란드 왕국", "Kingdom of Poland", "Regency Kingdom", "Warsaw"] },
    LIT: { name: "Kingdom of Lithuania", color: "#9a8aaa", aliases: ["리투아니아 왕국", "Kingdom of Lithuania", "Mindaugas II", "Kaunas"] },
    UBD: { name: "United Baltic Duchy", color: "#8a7a9a", aliases: ["발트 연합공국", "United Baltic Duchy", "Baltic Duchy", "Riga"] },
    WRU: { name: "White Ruthenia", color: "#8d6236", aliases: ["백루테니아", "White Ruthenia", "Belarus", "Minsk"] },
    UKR: { name: "Ukrainian State", color: "#c9a05a", aliases: ["우크라이나国", "Ukrainian State", "Hetmanate", "Skoropadskyi", "Kyiv"] },
    FIN: { name: "Kingdom of Finland", color: "#7a8a9a", aliases: ["핀란드 왕국", "Kingdom of Finland", "Helsinki"] },
    FLW: { name: "Flanders-Wallonia", color: "#b0902e", aliases: ["플란데런-왈로니아", "Flanders-Wallonia", "Belgium", "Brussels"] },
    NLD: { name: "Netherlands", color: "#e08a2e", aliases: ["네덜란드", "Netherlands", "Holland", "Amsterdam"] },
    // ── 제3인터내셔널: 혁명이 이긴 곳 ─────────────────────────────────────────
    UOB: { name: "Union of Britain", color: "#a03030", aliases: ["영국 사회주의 연방", "Union of Britain", "Syndicalist Britain", "London", "TUC"] },
    COF: { name: "Commune of France", color: "#c04040", aliases: ["프랑스 코뮌", "Commune of France", "Syndicalist France", "Paris"] },
    SRI: { name: "Socialist Republic of Italy", color: "#b03838", aliases: ["이탈리아 사회주의 공화국", "Socialist Republic of Italy", "Turin", "북이탈리아"] },
    // ── 앙탕트: 망명한 정부들 ─────────────────────────────────────────────────
    CAN: { name: "Dominion of Canada", color: "#c05a6a", aliases: ["캐나다 자치령", "Canada", "Entente", "Ottawa", "망명 영국", "Exiled Crown"] },
    NFA: { name: "National France", color: "#3f6fd0", aliases: ["국민 프랑스", "National France", "Algiers", "망명 프랑스"] },
    RAJ: { name: "Princely Federation of India", color: "#c07a8a", aliases: ["인도 번왕국 연방", "Delhi", "British Raj", "India", "Princely Federation"] },
    // ── 그 밖의 강대국 ────────────────────────────────────────────────────────
    // 볼셰비키가 이기지 못한 러시아. 벨트크리크에서 지고 공화국으로 남았다.
    RUS: { name: "Russian State", color: "#8a5a4a", aliases: ["러시아국", "Russian State", "Russia", "Petrograd", "Kerensky", "Savinkov"] },
    USA: { name: "United States", color: "#4a8f7a", aliases: ["미국", "United States", "America", "Washington"] },
    JAP: { name: "Empire of Japan", color: "#b23b3b", aliases: ["일본 제국", "Japan", "Tokyo", "Co-Prosperity"] },
    ITA: { name: "Kingdom of Italy", color: "#4f7942", aliases: ["이탈리아 왕국", "Kingdom of Italy", "Naples", "남이탈리아", "Savoy"] },
    ESP: { name: "Kingdom of Spain", color: "#d0a02e", aliases: ["스페인 왕국", "Spain", "Madrid"] },
    POR: { name: "Portugal", color: "#2e7d6b", aliases: ["포르투갈", "Portugal", "Lisbon"] },
    SWE: { name: "Sweden", color: "#5a7a9a", aliases: ["스웨덴", "Sweden", "Stockholm"] },
    NOR: { name: "Norway", color: "#6a8aaa", aliases: ["노르웨이", "Norway", "Oslo"] },
    DAN: { name: "Denmark", color: "#8a5f6d", aliases: ["덴마크", "Denmark", "Copenhagen"] },
    // ── 중국: 통일 전쟁을 기다리는 열두 조각 ──────────────────────────────────
    // 원본이 "Wars for Chinese Unification"을 진행 중 분쟁으로 명시한다.
    // 중원. 벨트크리크 뒤에도 무너지지 않은 베이양의 후신으로, 남·북·서 어느
    // 쪽도 완전히 누르지 못한 채 "중국"을 자칭한다.
    ZHI: { name: "Beiyang Government", color: "#4a6db5", aliases: ["베이양 정부", "중화민국", "Beiyang", "Republic of China", "Zhili", "즈리 군벌", "Beijing"] },
    QIN: { name: "Fengtian Government", color: "#a08a5a", aliases: ["봉천정부", "Fengtian", "Manchuria", "Zhang Xueliang", "Mukden"] },
    LKT: { name: "Left Kuomintang", color: "#8a9a4a", aliases: ["좌파 국민당", "Left Kuomintang", "Guangzhou", "Canton"] },
    SHX: { name: "Shanxi Clique", color: "#7d8f5a", aliases: ["산시 군벌", "Yan Xishan", "Shanxi"] },
    YUN: { name: "Yunnan Clique", color: "#6a9a6a", aliases: ["윈난 군벌", "Yunnan Clique", "Kunming"] },
    MAC: { name: "Ma Clique", color: "#a89a6a", aliases: ["마가군벌", "Ma Clique", "Qinghai", "Ningxia"] },
    XIN: { name: "Xinjiang Clique", color: "#6f8f7a", aliases: ["신장 군벌", "Xinjiang Clique", "Urumqi"] },
    TIB: { name: "Tibet", color: "#c8c0a0", aliases: ["티베트", "Tibet", "Lhasa", "Ganden Phodrang"] },
    MON: { name: "Mongolia", color: "#a85454", aliases: ["몽골", "Mongolia", "Urga"] },
  },

  countryAssignments: {
    // 미텔아프리카 — 베를린이 벨기에·프랑스 식민지를 흡수해 만든 아프리카 제국.
    GER: ["DEU", "COD", "RWA", "BDI", "COG", "GAB", "CAF", "TCD", "CMR", "TGO", "NAM", "TZA"],
    AUH: ["AUT", "HUN", "CZE", "SVK", "HRV", "BIH", "SVN"],
    OTT: ["TUR", "SYR", "LBN", "IRQ", "ISR", "PSE", "JOR"],
    BUL: ["BGR", "MKD"],
    POL: ["POL"],
    LIT: ["LTU"],
    UBD: ["EST", "LVA"],
    WRU: ["BLR"],
    UKR: ["UKR"],
    FIN: ["FIN"],
    FLW: ["BEL"],
    NLD: ["NLD", "IDN", "SUR"],
    UOB: ["GBR"],
    COF: ["FRA"],
    // 이탈리아 전체를 사회주의 공화국에 주고, 아래 지역 배정이 남부를
    // 왕국으로 되돌린다 — 안 그러면 북부가 현대 소유주 "Italy"로 흘러내린다.
    SRI: ["ITA"],
    // 중국 전체를 중원 정부에 주고, 아래에서 군벌들이 떼어 간다.
    ZHI: ["CHN"],
    // 망명한 앙탕트. 국왕과 함대는 오타와에, 공화국 정부는 알제에 있다.
    CAN: ["CAN", "JAM", "TTO", "BHS", "BRB", "GUY", "BLZ", "ATG", "DMA", "GRD", "KNA", "LCA", "CYM", "VGB", "TCA"],
    NFA: ["DZA", "MAR", "TUN", "SEN", "MLI", "CIV", "GIN", "BFA", "BEN", "NER", "MRT"],
    RAJ: ["IND", "PAK", "BGD", "MMR", "LKA"],
    RUS: ["RUS", "KAZ", "UZB", "TKM", "TJK", "KGZ", "GEO", "ARM", "AZE"],
    USA: ["USA", "PHL", "PRI", "GUM", "VIR"],
    JAP: ["JPN", "KOR", "PRK", "TWN"],
    ESP: ["ESP", "ESH", "GNQ"],
    POR: ["PRT", "AGO", "MOZ", "GNB", "CPV", "STP", "TLS"],
    SWE: ["SWE"],
    NOR: ["NOR"],
    DAN: ["DNK", "GRL", "FRO"],
    MON: ["MNG"],
  },

  regionAssignments: {
    // ── 이탈리아 내전: 북부 사회주의 공화국 대 남부 왕국 ──────────────────────
    // 우리 이탈리아는 110개 프로빈차이지만 GADM level-1 부모 키 여덟 개면
    // 남부 전체가 확장돼 들어온다(lib/level2Expansion.mjs). 사보이아 왕가는
    // 나폴리에서, 노조 정부는 토리노에서 다스린다.
    "ITA.1_1": "ITA",   // 아브루초
    "ITA.2_1": "ITA",   // 풀리아
    "ITA.3_1": "ITA",   // 바실리카타
    "ITA.4_1": "ITA",   // 칼라브리아
    "ITA.5_1": "ITA",   // 캄파니아
    "ITA.12_1": "ITA",  // 몰리세
    "ITA.14_1": "ITA",  // 사르데냐
    "ITA.15_1": "ITA",  // 시칠리아

    // ── 중국: 통일 전쟁 전야 ──────────────────────────────────────────────────
    // 성 단위 키가 지급시로 확장된다. 실제 군벌 경계는 성계와 다르지만,
    // 이 보드에서 중요한 것은 "중국이 한 나라가 아니다"라는 사실이다.
    "CHN.18_1": "QIN", "CHN.17_1": "QIN", "CHN.11_1": "QIN",  // 랴오닝·지린·헤이룽장
    "CHN.19_1": "QIN",  // 네이멍구
    "CHN.25_1": "SHX",  // 산시
    "CHN.30_1": "YUN",  // 윈난
    "CHN.28_1": "XIN",  // 신장
    "CHN.29_1": "TIB",  // 시짱
    "CHN.21_1": "MAC", "CHN.20_1": "MAC", "CHN.5_1": "MAC",   // 칭하이·닝샤·간쑤
    "CHN.6_1": "LKT", "CHN.7_1": "LKT", "CHN.9_1": "LKT",     // 광둥·광시·하이난
  },

  simulationRules:
    "It is 1 January 1936 in a world where Germany won the Weltkrieg. " +

    "THE DIVERGENCE IS SINGLE AND EVERYTHING BEFORE IT IS REAL. History runs as " +
    "it did up to 1917. Then Brest-Litovsk takes Russia out of the war, the " +
    "United States never enters it, and the war ends in November 1919 in a " +
    "negotiated peace on German terms. Do not import events from the real " +
    "1919-1936 — there was no Versailles as we know it, no League of Nations of " +
    "that shape, no Weimar Republic, no Soviet Union, no Fascist Italy and no " +
    "Nazi Party. Where a real person of the period would plausibly still exist, " +
    "they exist in the position THIS world would have given them. " +

    "THE THREE BLOCS. The REICHSPAKT is Berlin's alliance and MITTELEUROPA its " +
    "economic bloc: Austria-Hungary, the Ottomans, Bulgaria, the Ost-Staaten " +
    "(Poland, Lithuania, the United Baltic Duchy, White Ruthenia, Ukraine), " +
    "Finland, Flanders-Wallonia and the Netherlands, with Mittelafrika behind " +
    "it. The THIRD INTERNATIONALE is the syndicalist answer: the Union of " +
    "Britain, the Commune of France and the Socialist Republic of Italy, each " +
    "the product of a revolution that German victory caused. The ENTENTE is what " +
    "fled: the British Crown, fleet and government in Ottawa, the French " +
    "Republic in Algiers, and Delhi holding India — three governments in exile " +
    "that consider themselves the legitimate ones and intend to go home. " +

    "GERMANY IS OVEREXTENDED AND THAT IS THE GAME. It won and it cannot garrison " +
    "what it won: the Ost-Staaten are resented client monarchies, Mitteleuropa's " +
    "terms are extractive enough to be an argument in every member's politics, " +
    "Austria-Hungary is a nationality problem with an army attached and an " +
    "emperor whose succession is a live question, and the Ottomans are holding " +
    "Arabia by agreement rather than by force. Play the Reichspakt as a system " +
    "under load, not as a monolith. " +

    "THE CONFLICTS THIS BOARD IS KEEPING TRACK OF, named by the preset itself: " +
    "the League War, the Spanish Civil War, the Wars for Chinese Unification, " +
    "the Fourth Balkan War, the Second American Civil War and the Italian Civil " +
    "War. Some are running and some are latent. They are CONSEQUENCES of " +
    "pressures on this board, not fixtures on a calendar — and the player is " +
    "never told when one is coming. " +

    "NEVER FORESHADOW AND NEVER GIVE A DATE. This is the preset's own first " +
    "rule and it overrides the usual helpfulness: do not warn, hint, prepare or " +
    "prime the player for a scripted event, do not let an advisor or a suggested " +
    "action reference one, and never state a future date. Everything is revealed " +
    "when it happens, in world, with no meta commentary. A player who deduces " +
    "what is coming from the state of the world has earned it; a player who is " +
    "told has been robbed of the board. " +

    "AMERICA IS THE SLOW FUSE. The United States never fought in Europe, never " +
    "had the boom that followed, and is deeper in depression than the real 1936. " +
    "Four movements are pulling at it — the federal government, the syndicalists, " +
    "the populist right and the Pacific states — and a presidential election " +
    "falls this year. Treat the split as a POSSIBILITY the year's politics " +
    "decide, not an appointment. " +

    "CHINA IS NOT A COUNTRY HERE. It is a dozen governments with armies, and the " +
    "grid draws the largest of them by province because that is the resolution we " +
    "have; the real warlord boundaries cut across provinces and the narration " +
    "should say so. " +

    "Technology and economy must reflect 1936 in a world that did not have the " +
    "same war: no atomic research programmes of consequence, biplanes giving way " +
    "to monoplanes, armour doctrine argued rather than settled, and a German " +
    "economy that owns the continent's resources and still cannot pay for " +
    "everything it has promised. The map approximates control with modern " +
    "administrative regions.",

  startingTimelineText:
    "1 January 1936. Seventeen years after the Peace with Honour, Berlin's writ runs from " +
    "the Rhine to the Dnieper and its bankers hold the paper of a dozen kingdoms it invented. " +
    "In London the Trades Union Congress governs from a Parliament that no longer has a king " +
    "in it; in Ottawa there is a king who no longer has a Parliament. Paris flies the red " +
    "flag and Algiers flies the tricolour, and each calls the other the impostor. Petrograd " +
    "is a republic that lost a war and has not forgiven anyone for it. Italy is two countries " +
    "and pretends to be one. China is twelve and does not pretend. And in Washington a " +
    "government with no European victory to bank on faces an election year with three " +
    "movements in the streets telling it that the republic has failed.",
};

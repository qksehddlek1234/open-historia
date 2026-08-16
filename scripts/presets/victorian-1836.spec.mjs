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

  // ── era geometry (plan F-3) ────────────────────────────────────────────────
  // THE STRONGEST CASE IN THE FLEET, and the numbers say so before any tile is
  // pulled. This window holds 71 of the 203 polities alive in 1836, against 32
  // for 1914 and 39 for 1939 — the same 16 tiles at zoom 4, more than twice the
  // yield. The reason is what those polities ARE: about 35 German Confederation
  // states (Reuß-Greiz, Schaumburg-Lippe, Anhalt-Cöthen, Hohenzollern-Hechingen)
  // and eight Italian ones (Lucca, Modena, Parma, Toscana, Due Sicilie). Not one
  // of them is drawable from modern GADM provinces — Germany's sixteen Länder
  // cannot produce Waldeck. 1914's Europe is largely nation-states the modern
  // map can still approximate; 1836's is not.
  //
  // The window is [-15,30,50,72] rather than the [-10,35,45,71] wwii-1939 used:
  // identical tile cost, +2 polities here and +3 at 1914, because it reaches
  // Iberia and the Aegean. Measured, not preferred. Extending east to 60 adds
  // exactly nothing and was dropped for that reason.
  //
  // Estimate, not promise: one of the 71 is a centre-lie — Русская Америка
  // spans the antimeridian so its bbox centre lands at [21.2, 61.3], in the
  // Baltic. That is the failure mode fetch-era-polities' header warns about,
  // caught live. Expect ~70.
  //
  //   node scripts/ohm/plan-era-faces.mjs --build --min-polities 150 --only 1836-01-01
  //
  // THE DUMP EXISTS NOW — 46 faces — AND THE ROSTER WAS THROWING 38 OF THEM AWAY.
  // Measured 2026-08-16: 8 of 46 matched. Not because the geometry was bad, but
  // because the paragraph above predicted the states and the roster below then
  // wrote them as ONE cell, `GER: German Confederation`. Bayern, Sachsen,
  // Kurhessen, Waldeck and fifteen more arrived with their outlines closed and
  // had nowhere to land. The fix is the roster, not the assembler; the states
  // are named below and GER now means only the members with no face.
  //
  // faceOwners was left open for the holdings whose NAME cannot answer who holds
  // them. That pass has now been made — four of the five are British:
  eraGeometry: {
    date: "1836-01-01",
    window: [-15, 30, 50, 72],
    faceOwners: {
      // Crown colony, taken from the French in 1800 and confirmed at Vienna.
      "Colony of Malta": "GBR",
      // A protectorate since 1815 — a republic on paper, a High Commissioner in
      // fact. Ceded to Greece in 1864, which is 28 years the wrong way.
      "United States of the Ionian Islands": "GBR",
      // Crown dependencies. Neither is IN the United Kingdom and both answer to
      // its Crown; with no line here they stand up as sovereign states — the
      // same fault tests/era-sovereignty.mjs pins for the 1946 Isle of Man.
      "Isle of Man": "GBR",
      Jersey: "GBR",
    },

    // ── 다뉴브 공국 셋을 오스만 면에서 빼낸다 ────────────────────────────
    // 사용자 보고("세르비아 위치가 틀림")의 뿌리다. 아래 regionAssignments에 왈라키아·
    // 몰다비아·세르비아 행이 **처음부터 있었는데 화면에 안 나왔다.** 시대 면 세트에
    // 공국 면이 없고 오스만 면이 그 땅을 통째로 덮는데, **면은 지역 배정보다 뒤에**
    // **적용되어 이긴다.** 트란실바니아·보이보디나가 고쳐진 것은 그 면 밖이라서였다.
    //
    // 앞서 이 건을 "스펙으로는 못 고친다, 오스만 면을 쪼개야 한다"며 조립 레인으로
    // 넘겼었다. **그 판단을 수정한다** — `faceKeepOut`이 나라(GID_0)뿐 아니라 **지역**
    // **ID 접두사**로도 막힌다(`tests/preset-era-geometry.mjs`가 핀으로 박아 뒀다:
    // `ITA.1`은 하위까지 막고 `ITA.18`은 문자열만 겹쳐선 안 걸린다). 면을 수술할
    // 필요 없이 공국 땅에서만 물러나게 하면 된다.
    //
    // **`ROU`·`SRB`를 통째로 막지 않는다.** 그러면 결함을 반대 방향으로 옮길 뿐이다 —
    // 도브루자(실리스트라 산자크)와 니시·피로트·라슈카는 1836년에 **진짜로 오스만**
    // **직할**이고, 세르비아 남부가 1878년 베를린 조약까지 공국에 들어오지 않는다.
    // 그래서 칸을 하나씩 적는다. 아래 목록은 GADM 이름을 직접 확인하고 골랐다.
    faceKeepOut: {
      // ★ 호엔촐레른지그마링겐 면의 **주 링이 자기 나라보다 19배 크다.**
      // 실측: 링 18개 중 주 링이 2.58deg²(≈21,300km²)에 bbox 7.07~9.87°E ×
      // 47.53~49.82°N — 바덴과 뷔르템베르크를 덮고 라인강을 건너 팔츠까지 간다.
      // 공국 실면적은 약 1,142km²다. 나머지 17개 링(각 0.0004~0.0012deg²)이
      // **진짜 호엔촐레른**이다 — 원래 파편화된 나라라 그 모양이 맞다.
      // 대조로 바이에른 면은 주 링 8.8deg²(≈72,000km²)에 실제 약 76,000km²로 맞는다.
      //
      // 그래서 면을 버리지 않는다(월경지를 같이 잃는다). **주 링이 잘못 문 칸만**
      // **막는다** — 프라이부르크(남부 바덴)·카를스루에·라인헤센팔츠에는 호엔촐레른이
      // 한 뼘도 없었다. 슈투트가르트·튀빙겐은 막지 않는다: 진짜 월경지가 거기 있고
      // 면이 이겨야 지그마링겐과 헤힝겐이 그려진다.
      "Hohenzollern-Sigmaringen": ["DEU.DE12", "DEU.DE13", "DEU.DEB3"],
      // 오만 면(55.2~59.8°E)이 동부 에미리트를 물고 있었다 — 실측: ARE 7칸 중 5칸이
      // Omani Empire로 갔다. 1836년 무스카트의 사이드 빈 술탄과 카와심(샤르자·
      // 라스알카이마)은 **경쟁 관계이지 같은 나라가 아니다.** 영국이 1835년 해상
      // 휴전을 맺은 상대도 오만이 아니라 그 셰이크국들이다. 오만 본토(바티나·
      // 무스카트·도파르)는 OMN 쪽에 그대로 있으므로 여기서 잃는 것이 없다.
      "الْإِمْبَرَاطُورِيَّة الْعُمَانِيَّة": ["ARE"],
      "دولتْ علیّه عثمانیّه": [
        // 왈라키아 공국 16칸 — 문테니아 + 올테니아. 1834년부터 러시아 보호 아래의
        // 자치 공국이고 기르기타 5세가 다스린다. 오스만은 종주권만 갖는다.
        "ROU.10", "ROU.26", "ROU.17", "ROU.32", "ROU.3", "ROU.40",
        "ROU.21", "ROU.18", "ROU.28", "ROU.31", "ROU.37", "ROU.20",
        "ROU.12", "ROU.25", "ROU.11", "ROU.9",
        // 몰다비아 공국 7칸 — 스투르자의 몰다비아. **베사라비아는 넣지 않는다**
        // (1812년 부쿠레슈티 조약으로 러시아령, 위 MDA 37칸이 전부 러시아다).
        // 부코비나도 아니다 — 1775년부터 합스부르크령이라 오스트리아 행에 있다.
        "ROU.24", "ROU.7", "ROU.30", "ROU.4", "ROU.41", "ROU.19",
        "ROU.42",
        // 세르비아 공국 12칸 — 베오그라드 파샬리크 + 1833년 하티셰리프가 넘긴 여섯
        // 나히예(크라이나·츠르나레카·바냐·크루셰바츠·스타리블라흐·야다르). 밀로시
        // 오브레노비치의 공국이다.
        "SRB.1", "SRB.2", "SRB.3", "SRB.7", "SRB.8", "SRB.9",
        "SRB.13", "SRB.14", "SRB.15", "SRB.21", "SRB.23", "SRB.25",
      ],
    },
  },

  polities: {
    // The long form is the alias that matters: the era face is styled "United
    // Kingdom of Great Britain and Ireland", and stripStyle only takes "Kingdom
    // of" off the FRONT — so the player's own country was among the 38 misses.
    GBR: { name: "United Kingdom", color: "#c0507a", aliases: ["영국", "대영제국", "United Kingdom of Great Britain and Ireland", "Britain", "Great Britain", "British Empire", "East India Company"] },
    FRA: { name: "France", color: "#3f5fd0", aliases: ["프랑스", "7월 왕정", "July Monarchy", "Orléanist France"] },
    RUS: { name: "Russian Empire", color: "#8b9a54", aliases: ["러시아 제국", "러시아", "Russia"] },
    AUT: { name: "Austrian Empire", color: "#e8d878", aliases: ["오스트리아 제국", "오스트리아", "Austria", "Habsburg Monarchy"] },
    PRU: { name: "Kingdom of Prussia", color: "#4a6a8a", aliases: ["프로이센", "Prussia"] },
    // WHAT IS LEFT OF THE AGGREGATE. It used to stand for all ~35 Bund members;
    // it now stands for the ones the assembler could NOT close a face for —
    // Hannover, Württemberg, Baden, Braunschweig, Oldenburg, Mecklenburg-
    // Strelitz, Sachsen-Weimar, Hamburg, Bremen and the rest. Those still ride
    // as one blob, and that is a data gap, not a design: give the assembler
    // their outlines and they come out of here the same way the nineteen below
    // did. Holstein and Lauenburg are members too and sit under DAN, which is
    // the personal union the Schleswig question is about.
    GER: { name: "German Confederation", color: "#b8b8a0", aliases: ["독일 연방", "독일 제후국들", "German minor states", "Deutscher Bund"] },
    // ── 연방에서 빠져나오는 여섯 (2026-08-16) ──────────────────────────────
    // 위 GER 주석이 "조립기에 윤곽을 주면 나온다"고 적어 뒀는데, 윤곽을 기다리지
    // 않고 **칸으로 먼저 세운다.** 이유는 이 여섯의 NUTS 칸이 실제 나라와 잘 맞기
    // 때문이다 — 브레멘·함부르크는 **칸이 곧 도시국가**라 완벽하고, 뷔르템베르크·
    // 바덴도 슈투트가르트/튀빙겐·카를스루에/프라이부르크로 거의 그대로 떨어진다.
    // 면이 나중에 오면 면이 이기므로(면 > 지역) 이 배정은 그때 자동으로 정밀해진다.
    //
    // 실측: 이 여섯을 세우기 전 GER은 14칸을 쥐고 있었고 그중 10칸이 이들이었다.
    // 그 덩어리가 중부 독일 한복판에 657px짜리 레이블을 세워 승격 레이블 여섯을
    // 밀어내고 있었다(Cowork 실측). 집합이 줄면 레이블도 줄어든다.
    WUR: { name: "Kingdom of Württemberg", color: "#3a5f7a", aliases: ["뷔르템베르크 왕국", "Württemberg", "Wurttemberg", "Königreich Württemberg"] },
    BAD: { name: "Grand Duchy of Baden", color: "#c48f5a", aliases: ["바덴 대공국", "Baden", "Großherzogtum Baden"] },
    // 하노버는 1836년에 **영국과 동군연합**이다 — 국왕이 윌리엄 4세다. 살리카법
    // 때문에 빅토리아가 물려받지 못해 **1837-06-20**에 갈라지고 컴벌랜드 공
    // 에른스트 아우구스트가 간다. 개장 연도 다음 해의 사건이다.
    HAN: { name: "Kingdom of Hanover", color: "#7a5f8f", aliases: ["하노버 왕국", "Hanover", "Hannover", "Königreich Hannover"] },
    // 한자 자유시 둘. 연방 회원이면서 도시 하나가 나라다.
    BRE: { name: "Free Hanseatic City of Bremen", color: "#5f9aa8", aliases: ["브레멘 자유시", "Bremen", "Freie Hansestadt Bremen"] },
    HAM: { name: "Free and Hanseatic City of Hamburg", color: "#a8895f", aliases: ["함부르크 자유시", "Hamburg", "Freie und Hansestadt Hamburg"] },
    // 튀링겐 한 칸에 공국이 여럿 산다(작센바이마르아이제나흐·마이닝겐·알텐부르크·
    // 코부르크고타·슈바르츠부르크·로이스). 그중 **넷은 이미 면이 있어** 알아서
    // 깎아 가므로, 칸의 주인은 가장 크고 유일한 대공국인 작센바이마르아이제나흐로
    // 둔다 — 칼 프리드리히의 바이마르, 괴테가 1832년까지 살던 그곳이다.
    SWG: { name: "Grand Duchy of Saxe-Weimar-Eisenach", color: "#8f7aa8", aliases: ["작센바이마르아이제나흐", "Saxe-Weimar-Eisenach", "Sachsen-Weimar-Eisenach", "Weimar"] },

    OTT: { name: "Ottoman Empire", color: "#5a8a6a", aliases: ["오스만 제국", "오스만", "Turkey", "Sublime Porte"] },
    // ★ 판례 — **표시명은 원본, 고증은 지도자 칭호와 서술에서** (사용자 결정, 2026-08-16)
    //
    // 케디브는 1867-06-08에 이스마일이 받은 칭호이고 1836년엔 아무도 그렇게 부르지
    // 않았다. 그래서 한 번 `Egypt of Muhammad Ali`로 고쳤는데, 사용자가 화면에서
    // 그걸 보고 되돌려 달라고 했다 — **원본 게임이 이 나라를 `Khedivate of Egypt`로**
    // **부르기 때문이다.**
    //
    // 정확성과 원본 재현이 갈리는 첫 자리였고, 사용자가 **분리**를 골랐다. 판이
    // 부르는 이름은 원본을 따르고, 고증은 **지도자 칭호**가 진다 —
    // `leaderEras/revolutions.js`가 1867-06-08을 경계로 `왈리 이스마일 파샤` →
    // `케디브 이스마일 파샤`로 자른다. 1836년 판에 뜨는 지도자는 `왈리 무함마드 알리`다.
    //
    // 이 규칙은 이 칸 하나가 아니다. 알제리(1830 침공은 연안 거점뿐)·캐나다(허드슨만
    // 회사)·호주도 "원본이 그린 대로"와 "그 해에 맞는 대로"가 갈리는 자리이고,
    // 거기서도 **표시명은 원본, 영토와 칭호는 고증**으로 간다.
    //
    // 옛 이름은 별칭으로 남긴다 — 면 이름과 서술이 그 문자열을 쓸 수 있다.
    EGY: { name: "Khedivate of Egypt", color: "#c8a03e", aliases: ["이집트 케디브국", "무함마드 알리의 이집트", "이집트", "Egypt", "Egypt of Muhammad Ali", "Khedivate"] },
    ESP: { name: "Spain", color: "#d0a02e", aliases: ["스페인", "Spanish Empire", "Isabelline Spain"] },
    POR: { name: "Portugal", color: "#2e7d6b", aliases: ["포르투갈", "Portuguese Empire"] },
    BEL: { name: "Belgium", color: "#7a8a4a", aliases: ["벨기에", "Kingdom of Belgium"] },
    NLD: { name: "Netherlands", color: "#c87a3e", aliases: ["네덜란드", "Holland", "Dutch Empire"] },
    DAN: { name: "Denmark", color: "#8a5f6d", aliases: ["덴마크", "Kingdom of Denmark"] },
    SWE: { name: "Sweden-Norway", color: "#4068bf", aliases: ["스웨덴-노르웨이", "스웨덴", "Sweden"] },
    GRE: { name: "Kingdom of Greece", color: "#5b8fd8", aliases: ["그리스 왕국", "그리스", "Greece", "Othonian Greece"] },
    // ══ 알제리 — 사용자 보고 2 ═════════════════════════════════════════════
    // "프랑스는 이 시기 알제리를 식민지로 편입한 적 없다." 맞다. 1830년 원정은
    // 알제 섭정을 무너뜨렸지 그 땅을 대신 다스리지 않았다 — 1830년대는 프랑스
    // 스스로 **점령 제한**(occupation restreinte)이라 부른 시기이고, 알제리를
    // 프랑스 영토로 선언하는 것은 1848년, 완전 평정은 1857년(카빌리)이다.
    // 보드는 48칸을 전부 프랑스에게 주고 있었다.
    //
    // 개장일의 알제리는 셋으로 갈리고, 그 셋 어느 쪽에도 안 속하는 땅이 있다.
    // 압델카데르: 1832년 마스카라에서 추대됐고 1834년 데미셸 협정이 오랑 내륙의
    // 그를 인정했다. 이름은 원본·OHM 어느 쪽에도 없어 통용명으로 세운다.
    ABD: { name: "Emirate of Abdelkader", color: "#1f7a5a", aliases: ["압델카데르 토후국", "Abdelkader", "Abd al-Qadir", "Emirate of Mascara", "Mascara", "Tagdemt"] },
    // 콘스탄틴 베이국: 아흐메드 베이는 오스만 칭호를 쥔 채 알제 함락을 인정하지
    // 않고 동부를 독립적으로 다스린다. 프랑스가 콘스탄틴을 얻는 것은 1837-10-13이고,
    // **1836-11의 첫 원정은 실패한다** — 개장 연도 안의 사건이다.
    // 이름 형태는 이 보드가 이미 쓰는 `Beylik of Tunis`와 같은 계열로 맞춘다.
    CST: { name: "Beylik of Constantine", color: "#8a6f3a", aliases: ["콘스탄틴 베이국", "Constantine", "Ahmed Bey", "Beylik of Constantia"] },

    // ══ 식민지 구조 — 사용자 보고 3·11·12 ═════════════════════════════════
    // "현대 국경 = 식민지 경계"라는 가정 하나가 보고 셋을 낳았다. 1836년의 영국은
    // 캐나다도 호주도 **한 덩어리로 다스리지 않았다** — 자치령은 1867년(캐나다)과
    // 1901년(호주)이고, 그 전까지는 서로 다른 헌장을 가진 식민지들과 특허회사다.
    // 이름은 전부 OHM 시대 자료(`era-polities-1836-01-01.json`)가 부르는 그대로 쓴다.
    //
    // ── 북아메리카 ─────────────────────────────────────────────────────
    // 허드슨만 회사는 나라가 아니라 **특허회사**인데 루퍼츠랜드와 노스웨스턴 준주를
    // 통치한다 — 이 보드가 동인도회사를 폴리티로 세운 것과 같은 이유다. 회사가
    // 그 땅의 정부다.
    HBC: { name: "Hudson's Bay Company", color: "#7b5e3b", aliases: ["허드슨만 회사", "HBC", "Rupert's Land", "루퍼츠랜드", "North-West Territories", "Columbia District"] },
    // 어퍼·로어 캐나다는 1791년 헌법법이 가른 별개 식민지다. 둘이 합쳐지는 것은
    // 1841년 연합법이라 5년 뒤이고, 1837년 반란이 그 사이에 있다.
    UPC: { name: "Province of Upper Canada", color: "#cf6f8f", aliases: ["어퍼 캐나다", "Upper Canada", "Canada West"] },
    LWC: { name: "Province of Lower Canada", color: "#8f4a7a", aliases: ["로어 캐나다", "Lower Canada", "Canada East", "Bas-Canada"] },
    // 대서양 식민지 넷은 각자 총독과 의회를 가졌고 캐나다 연방(1867)에 따로 들어간다.
    // 뉴펀들랜드는 1949년까지도 따로다.
    NBR: { name: "Colony of New Brunswick", color: "#4f8fa8", aliases: ["뉴브런즈윅", "New Brunswick"] },
    NSC: { name: "Colony of Nova Scotia", color: "#3f6f8f", aliases: ["노바스코샤", "Nova Scotia"] },
    PEI: { name: "Prince Edward Island Colony", color: "#6fb0c4", aliases: ["프린스에드워드섬", "Prince Edward Island"] },
    NFL: { name: "Crown Colony of Newfoundland", color: "#2f5f6f", aliases: ["뉴펀들랜드", "Newfoundland"] },
    //
    // ── 오세아니아 ─────────────────────────────────────────────────────
    // 반디먼스랜드는 1825년에, 서호주는 1829년 스완강 정착으로 뉴사우스웨일스에서
    // 떨어져 나왔다. 셋은 서로 다른 식민지이고 연방은 1901년이다.
    NSW: { name: "Colony of New South Wales", color: "#c46a2f", aliases: ["뉴사우스웨일스", "New South Wales"] },
    VDL: { name: "Colony of Van Diemen's Land", color: "#8f5a2f", aliases: ["반디먼스랜드", "Van Diemen's Land", "Tasmania"] },
    WAU: { name: "Colony of Western Australia", color: "#e08f4a", aliases: ["서호주", "Western Australia", "Swan River Colony"] },
    // ★ 뉴질랜드는 1836년에 **영국령이 아니다.** 와이탕이 조약은 1840-02-06이고,
    // 그때까지 북섬에는 1835년 독립선언의 부족연합이 있다 — 영국 왕실이 승인했고
    // OHM도 `United Tribes of New Zealand`(1835 → 1840-05-21)로 기록한다. 지금 보드는
    // 뉴질랜드 19칸을 전부 영국에게 주고 있어 **4년 이르다.**
    UTZ: { name: "United Tribes of New Zealand", color: "#3f8f5f", aliases: ["뉴질랜드 부족연합", "United Tribes", "Te W(h)akaminenga", "New Zealand"] },
    //
    // ── 남아프리카 ─────────────────────────────────────────────────────
    // 나탈은 1836년에 영국이 아니라 **딩가네의 줄루 왕국**이다. 영국령 나탈은 1843년,
    // 그 사이에 대이주(1836-02 시작)와 피에트 레티프 학살(1838-02)이 있다.
    ZUL: { name: "Zulu Kingdom", color: "#8f2f3f", aliases: ["줄루 왕국", "Zulu", "Dingane", "KwaZulu"] },

    SER: { name: "Principality of Serbia", color: "#7a6a9a", aliases: ["세르비아 공국", "세르비아", "Serbia"] },
    SAR: { name: "Kingdom of Sardinia", color: "#9a7ab0", aliases: ["사르데냐 왕국", "사보이아", "Piedmont-Sardinia", "Sardinia"] },
    SIC: { name: "Two Sicilies", color: "#a06a4a", aliases: ["양시칠리아 왕국", "나폴리", "Kingdom of the Two Sicilies", "Naples"] },
    PAP: { name: "Papal States", color: "#e8e0c0", aliases: ["교황령", "Papacy", "Rome"] },
    // ── the Italian duchies, four states where there was one cell ──────────────
    // `ITD: Italian Duchies` is gone. It was the same fault as GER on a smaller
    // scale, and it was worse than a miss: Granducato di Toscana MATCHED it
    // through stripStyle, so the board drew one duchy's outline and labelled it
    // with an aggregate that also claimed Parma, Modena and Lucca.
    TOS: { name: "Grand Duchy of Tuscany", color: "#873bce", aliases: ["토스카나 대공국", "토스카나", "Granducato di Toscana", "Tuscany"] },
    MOD: { name: "Duchy of Modena and Reggio", color: "#b5744a", aliases: ["모데나 레조 공국", "모데나", "Ducato di Modena e Reggio", "Modena"] },
    PAR: { name: "Duchy of Parma and Piacenza", color: "#f44e3b", aliases: ["파르마 피아첸차 공국", "파르마", "Ducato di Parma e Piacenza", "Parma"] },
    // Lucca is an independent duchy until 1847, when it falls in to Tuscany
    // under the Treaty of Vienna's succession clause. In 1836 it is its own.
    LUC: { name: "Duchy of Lucca", color: "#009ce0", aliases: ["루카 공국", "루카", "Ducato di Lucca", "Lucca"] },
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
    // ★ 텍사스 공화국을 **지웠다** — 사용자 보고 10, 그리고 이 스펙 자신의 판례다.
    //
    // 독립 선언은 **1836-03-02**(워싱턴온더브래저스)이고 이 보드는 1836-01-01에
    // 열린다. 페루-볼리비아 국가연합을 같은 이유로 이미 지웠다 — 1836-10-28 결성,
    // 1837-05-01 설치라 개장일 보드가 실을 수 없다고 `tests/victorian-1836.mjs`가
    // 적어 뒀다. **같은 자를 텍사스에도 댄다.**
    //
    // 개장일에 그 땅에서 실제로 벌어지는 일은 이렇다: 텍시안 임시정부는 1835-11부터
    // 있지만 **1824년 멕시코 헌법에의 충성을 내걸고** 있고, 베하르(샌안토니오)를
    // 1835-12-11에 얻어 멕시코 수비대가 텍사스에 없다. 즉 **이름은 멕시코, 실권은**
    // **반란**이라는 상태이고, 한 칸으로는 둘 중 하나만 그릴 수 있다. 아직 선포되지
    // 않은 나라를 그리는 쪽이 더 큰 거짓이라 멕시코로 둔다.
    //
    // 그 해 안의 사건 넷은 지도자·이벤트 쪽에서 쓸 수 있다: 알라모(03-06) ·
    // 골리아드(03-27) · 산하신토(04-21) · 산타 안나 포로(04-22).
    //
    // 카바나젱은 반대다 — **개장일보다 먼저 서 있다.** 아래 CAB 참조.
    CAB: { name: "Cabanagem", color: "#7a9a3a", aliases: ["카바나젱", "Cabanos", "Grão-Pará", "그라오파라", "Eduardo Angelim"] },
    FCA: { name: "Central America", color: "#8ab0d4", aliases: ["중앙아메리카 연방", "Federal Republic of Central America", "United Provinces of Central America"] },
    HTI: { name: "Haiti", color: "#8a3a5a", aliases: ["아이티", "Boyer's Haiti", "Hayti"] },
    // THE CONFEDERATION IS AHEAD OF THE WALL, and this board opened with it.
    // Santa Cruz beats Salaverry at Socabaya on 7 February 1836; the union is
    // decreed at the Congress of Tacna on 28 October 1836 and installed 1 May
    // 1837. On 1 January 1836 there is Bolivia under Santa Cruz and a Peru split
    // between Orbegoso in the north and Salaverry in Lima — so the board drew a
    // state that would not exist for ten months. Same class of error as the
    // khedive title Cowork corrected: a name with a date on it, used early.
    //
    // Peru is drawn whole rather than as Orbegoso's and Salaverry's halves: the
    // civil war is a war over one state, and splitting it would put two names on
    // the map where every ministry of the day still wrote one.
    PER: { name: "Peru", color: "#d2a94b", aliases: ["페루", "Republic of Peru", "Orbegoso", "North Peru"] },
    BOL: { name: "Bolivia", color: "#b59521", aliases: ["볼리비아", "Republic of Bolivia", "Santa Cruz", "Upper Peru"] },
    // ── The Americas the board was leaving blank ─────────────────────────────
    // unassignedKeepModernOwner is false on this board, so a country with no
    // roster entry is not 'modern Brazil' — it is a hole. Eight republics and an
    // empire were holes, which is what the player reported as 'South America has
    // disappeared'. Colours are the original's own (docs/analysis/palette-…json).
    BRZ: { name: "Empire of Brazil", color: "#194D33", aliases: ["브라질 제국", "Brazil", "Imperio do Brasil", "Pedro II"] },
    ARG: { name: "Argentine Confederation", color: "#2725A2", aliases: ["아르헨티나 연합", "Argentina", "Confederacion Argentina", "Rosas", "Buenos Aires"] },
    CHL: { name: "Chile", color: "#653294", aliases: ["칠레", "Republic of Chile", "Prieto"] },
    NGR: { name: "New Granada", color: "#FCC400", aliases: ["누에바그라나다", "Republic of New Granada", "Nueva Granada", "Colombia", "Santander"] },
    VEN: { name: "Venezuela", color: "#659400", aliases: ["베네수엘라", "Republic of Venezuela", "Paez"] },
    ECU: { name: "Ecuador", color: "#E27300", aliases: ["에콰도르", "Republic of the Equator", "Rocafuerte"] },
    URY: { name: "Uruguay", color: "#0062B1", aliases: ["우루과이", "Oriental Republic of Uruguay", "Banda Oriental", "Oribe"] },
    PRY: { name: "Paraguay", color: "#750b6c", aliases: ["파라과이", "Republic of Paraguay", "Francia", "El Supremo"] },

    // ── Europe ──────────────────────────────────────────────────────────────
    // 원본은 스위스와 파르마 공국에 같은 #F44E3B를 준다. 원본 화면에서는 둘이
    // 멀찍이 떨어져 있어 넘어가지만, 이 보드는 파르마를 별도 폴리티로 그리고
    // 알프스 남쪽에 붙어 있어 같은 붉은색 둘이 마주 본다. 스위스 국기색으로
    // 옮긴다 — 팔레트를 따르는 것보다 두 나라가 구별되는 것이 먼저다.
    SWI: { name: "Switzerland", color: "#d52b1e", aliases: ["스위스", "Swiss Confederation", "Helvetic Confederation", "Eidgenossenschaft"] },
    // A Vienna creation the board had folded into Austria. The Free, Independent
    // and Strictly Neutral City survives until Austria annexes it in 1846 — ten
    // years after this board opens — so on 1836-01-01 it is its own state.
    KRA: { name: "Republic of Krakow", color: "#B3B3B3", aliases: ["크라쿠프 자유시", "Free City of Krakow", "Rzeczpospolita Krakowska"] },

    // ── North Africa and the Sahel ───────────────────────────────────────────
    // "아프리카 토후국들이 구현 안 됨" — none of these had a roster row, so the
    // Maghreb, the Caliphate and the Senegambian kingdoms all drew as holes.
    MOR: { name: "Sultanate of Morocco", color: "#662b00", aliases: ["모로코 술탄국", "Morocco", "Alaouite Sultanate", "Abd al-Rahman"] },
    TUN: { name: "Beylik of Tunis", color: "#9F0500", aliases: ["튀니스 베이국", "Tunis", "Husainid Tunis", "Mustafa Bey"] },
    TRI: { name: "Vilayet of Tripolitania", color: "#7d1b1b", aliases: ["트리폴리타니아", "Tripoli", "Ottoman Tripolitania"] },
    // Muhammad Bello's caliphate over the twin seats of Sokoto and Gwandu. Gobir
    // is in open revolt on the start date and is not broken until Gawakuke,
    // 9 March 1836 — after the wall, so the board may not show it subjugated.
    SOK: { name: "Sokoto Caliphate", color: "#2f6b3a", aliases: ["소코토 칼리파국", "Sokoto", "Fulani Empire", "Muhammad Bello"] },
    BOR: { name: "Bornu", color: "#6b4f2a", aliases: ["보르누", "Kanem-Bornu", "Bornu Empire", "al-Kanemi"] },
    OYO: { name: "Oyo", color: "#c8a66a", aliases: ["오요", "Oyo Empire", "Alaafin"] },
    BNI: { name: "Kingdom of Benin", color: "#c19a57", aliases: ["베냉 왕국", "Benin", "Edo", "Oba Osemwende"] },
    // The Senegambian kingdoms. France holds points, not provinces (Saint-Louis
    // and Goree), which is why the coast below is theirs and the interior is not.
    CAY: { name: "Kingdom of Cayor", color: "#b8894f", aliases: ["카요르 왕국", "Cayor", "Kajoor", "Damel"] },
    BAO: { name: "Kingdom of Baol", color: "#9c6b3c", aliases: ["바올 왕국", "Baol", "Bawol", "Teigne"] },
    SIN: { name: "Kingdom of Sine", color: "#c98b5a", aliases: ["신 왕국", "Sine", "Siin", "Serer"] },
    SAL: { name: "Kingdom of Saloum", color: "#a9713f", aliases: ["살룸 왕국", "Saloum", "Saalum", "Kahone"] },
    FUT: { name: "Almamate of Futa Toro", color: "#7d5a34", aliases: ["푸타토로", "Futa Toro", "Torodbe", "Almamy"] },
    BUN: { name: "Kingdom of Bundu", color: "#8e7b45", aliases: ["분두 왕국", "Bundu", "Boundou"] },
    KAB: { name: "Kaabu", color: "#6f8a4a", aliases: ["카부", "Kaabu", "Gabu", "Mandinka empire"] },
    MSN: { name: "Massina Empire", color: "#4e7a52", aliases: ["마시나 제국", "Massina", "Hamdullahi", "Seku Amadu"] },
    SEG: { name: "Kingdom of Segu", color: "#7a9a5a", aliases: ["세구 왕국", "Segu", "Bambara Segu", "Faama"] },
    KRT: { name: "Kingdom of Kaarta", color: "#93a05e", aliases: ["카르타 왕국", "Kaarta", "Massassi", "Bambara Kaarta"] },

    // ── India, Persia's east, and the Malay world ────────────────────────────
    // "영국이 인도를 직접 통치" — the reported defect, and the original agrees:
    // its roster carries East India Company as its own polity. The Charter Act of
    // 1833 had just stripped the Company of trade and left it a GOVERNMENT, and
    // the Crown does not take India until 1858. Sir Charles Metcalfe is acting
    // Governor-General on this date.
    EIC: { name: "East India Company", color: "#fd6868", aliases: ["동인도회사", "British India", "Honourable East India Company", "Company Raj", "Bengal Presidency"] },
    // 오만(OMA)과 칼라트(KAL)는 이 파일에 이미 있다 — 아래 인도양·중앙아시아
    // 묶음에서 선언된다. no-dupe-keys가 내 중복 선언을 잡았고, 먼저 있던
    // 쪽을 남겼다(팔레트 매니페스트에 이미 그 색으로 실려 있다).
    SND: { name: "Sindh", color: "#741a1a", aliases: ["신드", "Talpur Sindh", "Hyderabad Sindh", "Mirs of Sindh"] },
    JOH: { name: "Sultanate of Johore", color: "#d4553f", aliases: ["조호르 술탄국", "Johore", "Johor", "Johor-Riau"] },
    PRK: { name: "Sultanate of Perak", color: "#b8452f", aliases: ["페락 술탄국", "Perak"] },
    SEL: { name: "Sultanate of Selangor", color: "#a03a52", aliases: ["슬랑오르 술탄국", "Selangor"] },
    NSN: { name: "Negeri Sembilan", color: "#c25a6a", aliases: ["느그리슴빌란", "Negri Sembilan", "Minangkabau confederation"] },
    BRU: { name: "Sultanate of Brunei", color: "#2b7bc4", aliases: ["브루나이 술탄국", "Brunei", "Omar Ali Saifuddin"] },
    NEP: { name: "Nepal", color: "#7d4bb0", aliases: ["네팔", "Kingdom of Nepal", "Gorkha", "Rajendra Bikram Shah"] },
    BHU: { name: "Bhutan", color: "#FCDC00", aliases: ["부탄", "Druk Yul", "Drukpa"] },

    // ── Arabia and the Red Sea ───────────────────────────────────────────────
    // Egypt held the Hejaz, not the peninsula. The Second Saudi State under Faisal
    // bin Turki rules Nejd from Riyadh — Riyadh does not fall to Egypt until 1838,
    // two years past this board's opening day.
    NEJ: { name: "Emirate of Nejd", color: "#ffd952", aliases: ["네지드 토후국", "Nejd", "Second Saudi State", "Faisal bin Turki", "Emirate of Riyadh"] },
    ASR: { name: "Emirate of Asir", color: "#d9b45a", aliases: ["아시르 토후국", "Asir", "Al Aidh", "Abha"] },
    YMN: { name: "Yemen", color: "#C45100", aliases: ["예멘", "Zaidi Imamate", "Qasimid Yemen", "Sanaa"] },
    LHJ: { name: "Sultanate of Lahej", color: "#b06a3a", aliases: ["라헤지 술탄국", "Lahej", "Abdali", "Aden"] },
    MHR: { name: "Mahra Sultanate", color: "#8a6a5a", aliases: ["마흐라 술탄국", "Mahra", "Qishn and Socotra", "Bin Afrar"] },

    // ── The Danube ──────────────────────────────────────────────────────────
    // Two reported defects live here. Transylvania is Habsburg until 1867, and
    // the board had the whole of Romania Ottoman; Wallachia and Moldavia are
    // autonomous principalities under suzerainty, not provinces, and the original
    // palette names them both.
    WLC: { name: "Principality of Wallachia", color: "#e0a800", aliases: ["왈라키아 공국", "Wallachia", "Tara Romaneasca", "Ghica"] },
    MOL: { name: "Principality of Moldavia", color: "#d4c24e", aliases: ["몰다비아 공국", "Moldavia", "Moldova", "Sturdza"] },
    HAW: { name: "Kingdom of Hawaii", color: "#4a9a9a", aliases: ["하와이 왕국", "하와이", "Hawaii", "Sandwich Islands"] },

    // ── the German Confederation, one state per closed face ────────────────────
    // Nineteen entries for twenty faces (Waldeck holds two, see below). Each
    // alias list carries the EXACT string the assembler wrote, because that is
    // what the face is matched on — the German styling is the face's, not ours.
    // None of these needs a countryAssignments row: the face carves the state
    // out of whatever province GER was holding, which is the whole point.
    BAY: { name: "Kingdom of Bavaria", color: "#bbbac9", aliases: ["바이에른 왕국", "바이에른", "Königreich Bayern", "Bavaria"] },
    SAX: { name: "Kingdom of Saxony", color: "#7b7d93", aliases: ["작센 왕국", "작센", "Königreich Sachsen", "Saxony"] },
    HES: { name: "Grand Duchy of Hesse", color: "#af0d3e", aliases: ["헤센 대공국", "헤센다름슈타트", "Großherzogtum Hessen", "Hesse-Darmstadt", "Grand-Hesse"] },
    // Two Hesses, and they are not the same state — Kurhessen (Kassel) is the
    // electorate, Großherzogtum Hessen (Darmstadt) the grand duchy. The
    // electoral title survived the Empire it was an election to, which is why
    // there is still a Kurfürst in 1836 and nothing left to elect.
    KUR: { name: "Electorate of Hesse", color: "#9a8f6a", aliases: ["헤센 선제후국", "쿠어헤센", "Kurhessen", "Hesse-Kassel", "Electorate of Hesse"] },
    MEC: { name: "Grand Duchy of Mecklenburg-Schwerin", color: "#aeaddb", aliases: ["메클렌부르크슈베린 대공국", "메클렌부르크", "Großherzogtum Mecklenburg-Schwerin", "Mecklenburg-Schwerin"] },
    NAS: { name: "Duchy of Nassau", color: "#6f8f7a", aliases: ["나사우 공국", "나사우", "Nassau"] },
    SAM: { name: "Duchy of Saxe-Meiningen", color: "#8f7f5f", aliases: ["작센마이닝겐 공국", "Sachsen-Meiningen", "Saxe-Meiningen"] },
    SAA: { name: "Duchy of Saxe-Altenburg", color: "#a3946b", aliases: ["작센알텐부르크 공국", "Sachsen-Altenburg", "Saxe-Altenburg"] },
    ANH: { name: "Duchy of Anhalt-Bernburg", color: "#7f6f8f", aliases: ["안할트베른부르크 공국", "Herzogtum Anhalt-Bernburg", "Anhalt-Bernburg"] },
    LIP: { name: "Principality of Lippe", color: "#98a86f", aliases: ["리페 후국", "Lippe", "Lippe-Detmold"] },
    // ONE STATE, TWO FACES, AND THEY ARE NOT NEIGHBOURS. Waldeck sits west of
    // Kassel; Pyrmont is an exclave 60km north, around the spa. The assembler
    // closed them separately and correctly — the graft takes both under one
    // owner, which is what the principality actually was.
    WAL: { name: "Principality of Waldeck-Pyrmont", color: "#c9b06a", aliases: ["발데크피르몬트 후국", "발데크", "Waldeck", "Pyrmont", "Waldeck-Pyrmont"] },
    SCH: { name: "Principality of Schaumburg-Lippe", color: "#8fa8a0", aliases: ["샤움부르크리페 후국", "Schaumburg-Lippe"] },
    // The two free cities in the window. Frankfurt is also the Bund's capital —
    // the Bundesversammlung sits there, in a city that is itself a member.
    FRK: { name: "Free City of Frankfurt", color: "#d9c98a", aliases: ["프랑크푸르트 자유시", "프랑크푸르트", "Frankfurt", "Frankfur", "Freie Stadt Frankfurt"] },
    LUB: { name: "Free City of Lübeck", color: "#7f96a8", aliases: ["뤼베크 자유한자동맹시", "뤼베크", "Freie und Hansestadt Lübeck", "Lübeck"] },
    HOM: { name: "Landgraviate of Hesse-Homburg", color: "#b08f9a", aliases: ["헤센-홈부르크 방백국", "Hessen-Homburg", "Hesse-Homburg"] },
    HOH: { name: "Hohenzollern-Sigmaringen", color: "#6f7f9a", aliases: ["호엔촐레른지크마링겐", "Hohenzollern-Sigmaringen"] },
    // The two Reuß lines, elder and younger. Every prince of the house is a
    // Heinrich and they are numbered across the whole family, which is why the
    // ordinals run into the sixties without anyone reigning that long.
    RGZ: { name: "Principality of Reuss-Greiz", color: "#a87f7f", aliases: ["로이스그라이츠 후국", "Fürstentum Reuß-Greiz", "Reuss-Greiz", "Reuß-Greiz"] },
    RGE: { name: "Principality of Reuss-Gera", color: "#8f6f6f", aliases: ["로이스게라 후국", "Fürstentum Reuß-Gera", "Reuss-Gera", "Reuß-Gera"] },
    // A Bund member too, and the only one still on the map in 2026.
    LIE: { name: "Liechtenstein", color: "#c45100", aliases: ["리히텐슈타인", "Fürstentum Liechtenstein"] },

    // ── the rest of the misses ────────────────────────────────────────────────
    // Nothing here is German or Italian; they were unmatched for the plain
    // reason that the roster stopped at great powers and these are small.
    AND: { name: "Andorra", color: "#653294", aliases: ["안도라", "Principality of Andorra"] },
    MON: { name: "Monaco", color: "#a8523f", aliases: ["모나코", "Principality of Monaco"] },
    SMR: { name: "San Marino", color: "#572400", aliases: ["산마리노", "Most Serene Republic of San Marino"] },
    // A condominium on the Portuguese-Galician border — three villages that
    // answered to neither crown, kept their own elected judge, and were divided
    // away in 1868. It is on the map because the assembler closed it, and it is
    // exactly the kind of border a modern province layer can never produce.
    CTM: { name: "Couto Misto", color: "#9a9a7a", aliases: ["코투미스투", "Couto Mixto", "Couto Misto"] },
    // Ottoman on paper, and the paper is thirty years out of date. OTT still
    // holds MNE in countryAssignments; this face takes back what the
    // prince-bishop actually ruled from Cetinje.
    MNE: { name: "Prince-Bishopric of Montenegro", color: "#6a4a6a", aliases: ["몬테네그로 주교후국", "몬테네그로", "Митрополство Црногорско", "Montenegro"] },
    // Muscat and Zanzibar under one sultan — the richest carrying trade in the
    // western Indian Ocean, and he moves his capital to Zanzibar in 1840.
    OMA: { name: "Omani Empire", color: "#fb9e00", aliases: ["오만 제국", "오만", "الْإِمْبَرَاطُورِيَّة الْعُمَانِيَّة", "Sultanate of Oman", "Muscat and Oman"] },
    TRU: { name: "Trucial States", color: "#d06a5a", aliases: ["휴전 오만", "Trucial Oman", "Trucial States"] },
    // ── 사용자 보고 6: 아시아의 빈 공간 ────────────────────────────────────
    // 실측하니 배정 0칸인 곳이 TJK·KGZ·ARE·QAT·PNG였다. 부하라·히바·칼라트·
    // 트루셜·오만은 **이미 로스터에 있었고**(내가 한 번 없다고 잘못 보고했다 —
    // 파일을 잘라 읽었다) 진짜로 없는 것은 코칸트와 카타르 둘이다.
    //
    // 코칸트: 1836년 칸은 마달리 칸(무함마드 알리 칸)이고 페르가나에서 타슈켄트와
    // 키르기스 초원까지 다스린다. 러시아 병합은 1876년이다.
    KOK: { name: "Khanate of Kokand", color: "#b06a8a", aliases: ["코칸트 칸국", "Kokand", "Khoqand", "Qo'qon Xonligi", "Fergana"] },
    // 바레인: 알칼리파가 1783년부터 다스린다. 1836년 하킴은 압둘라 빈 아흐마드다.
    // **카타르는 세우지 않는다** — 알사니의 독립 정권은 1840년대에 서고, 1836년
    // 반도는 알칼리파의 명목 종주권 아래 부족들이 산다. 명목만 있는 지배는 이
    // 보드가 칠하지 않는다(파타고니아·뉴질랜드 남섬과 같은 자리).
    BAH: { name: "Bahrain", color: "#4f8f9a", aliases: ["바레인", "Al Khalifa", "Bahrayn"] },
    BUK: { name: "Emirate of Bukhara", color: "#8a7f5a", aliases: ["부하라 토후국", "امارت بخارا", "Emirate of Bukhara (1785-1868)", "Bukhara"] },
    KHI: { name: "Khanate of Khiva", color: "#5f8a8a", aliases: ["히바 칸국", "خیوه خانلیگی", "Khiva"] },
    KAL: { name: "Khanate of Kalat", color: "#7b64ff", aliases: ["칼라트 번왕국", "Khanate of Kalat", "Kalat"] },
  },

  countryAssignments: {
    GBR: ["GBR", "IRL", "LKA", "MLT", "BLZ", "JAM", "BRB", "TTO", "BHS", "SLE", "GMB"],
    FRA: ["FRA"], // Algiers taken 1830 — the conquest is young and contested
    RUS: ["RUS", "UKR", "BLR", "LTU", "LVA", "EST", "FIN", "GEO", "ARM", "AZE", "MDA", "KAZ"],
    AUT: ["AUT", "CZE", "SVK", "HUN", "HRV", "SVN"],
    OTT: ["TUR", "BGR", "MKD", "BIH", "MNE", "ALB", "XKO", "ROU", "CYP", "IRQ", "KWT"],
    // 무함마드 알리의 십년. 아라비아는 지역 단위로 내려간다 — 헤자즈는
    // 1818년부터 이집트 속주이지만 네지드는 파이살 빈 투르키의 것이고
    // 리야드 함락은 1838년, 이 보드보다 두 해 뒤다. 남수단(SSD)도 뺐다:
    // 백나일 상류 진출은 1839~41년이다. 크레타는 아래 지역 배정으로 준다
    // (1830~1840년 위임 통치).
    EGY: ["EGY", "SDN", "SYR", "LBN", "JOR", "ISR", "PSE"],
    ESP: ["ESP", "CUB", "PRI", "PHL", "GUM"],
    POR: ["PRT", "CPV", "STP", "TLS"],
    BEL: ["BEL"],
    NLD: ["NLD", "LUX", "IDN", "SUR"],
    DAN: ["DNK", "ISL", "GRL", "FRO"],
    SWE: ["SWE", "NOR"],
    GRE: ["GRC"],
    SER: ["SRB"],
    QAJ: ["IRN"],
    AFG: ["AFG"],
    // 시크 제국은 이제 지역 단위다. 통째 PAK 배정은 라호르가 쥔 적 없는
    // 신드(탈푸르)와 발루치스탄(칼라트)까지 넘겨주고 있었다 — 아래 지역
    // 배정에서 펀자브·카슈미르·데라자트·하자라만 준다.
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
    PER: ["PER"],
    BOL: ["BOL"],  // 국가연합은 1836-10-28 결성 — 이 보드보다 열 달 뒤다
    // The subcontinent's default owner is the Company — princely India rides as approximation.
    // (IND baseline assigned to GBR via regions below where it differs from SIK.)
    // ── 남아메리카 ─────────────────────────────────────────────────────
    // 브라질·아르헨티나·칠레·파라과이는 여기에 없다. 이 빌더에는 "주인 없음"을
    // 적을 자리가 없고 배정하지 않은 칸만 비므로, 파타고니아·아라우카니아·차코·
    // 아크리를 비우려면 나라를 통째로 줄 수 없다 — regionAssignments로 내려간다.
    NGR: ["COL", "PAN"],  // 지협은 1903년까지 누에바그라나다다
    VEN: ["VEN"],
    ECU: ["ECU"],
    URY: ["URY"],

    // ── 유럽·북아프리카 ────────────────────────────────────────────────
    SWI: ["CHE"],
    MOR: ["MAR", "ESH"],  // 알라위 술탄국. 스페인 프레시디오는 이 축척에서 점이다
    TUN: ["TUN"],
    TRI: ["LBY"],  // 1835-08 오스만 직할 복귀 — 마지막 카라만리는 9월에 폐위됐다

    // ── 인도양 ────────────────────────────────────────────────────────
    EIC: ["BGD", "SGP"],  // 벵골과 해협 식민지. 인도 본토는 지역 단위로 아래에
    NEP: ["NPL"],
    BHU: ["BTN"],
    BRU: ["BRN"],
  },

  regionAssignments: {
    // ══ 알제리 48칸 · 보고 2 ══════════════════════════════════════════════
    // 프랑스 7 — 점령한 항구와 그 배후지뿐이다. 알제(1830-07) · 오랑(1831-01) ·
    // 본(1832-03) · 부지(1833-09) · 모스타가넴(1833-07), 그리고 알제를 감싼
    // 사헬(부메르데스·티파자). **스키크다는 없다** — 필리프빌 건설은 1838년이다.
    "DZA.4_1": "FRA", "DZA.5_1": "FRA", "DZA.8_1": "FRA", "DZA.13_1": "FRA", "DZA.30_1": "FRA", "DZA.32_1": "FRA",
    "DZA.45_1": "FRA",
    // 압델카데르 12 — 서부와 중부 내륙. **틀렘센을 여기 두는 것이 날짜 판단이다**:
    // 클로젤이 틀렘센에 들어가는 것은 **1836-01-13**이라 개장 12일 뒤이고, 그 직전
    // 마스카라 습격(1835-12-06)도 점령이 아니라 소각 후 철수였다. 개장일에는
    // 둘 다 에미르의 것이다.
    "DZA.2_1": "ABD", "DZA.3_1": "ABD", "DZA.10_1": "ABD", "DZA.14_1": "ABD", "DZA.27_1": "ABD", "DZA.28_1": "ABD",
    "DZA.35_1": "ABD", "DZA.36_1": "ABD", "DZA.38_1": "ABD", "DZA.43_1": "ABD", "DZA.46_1": "ABD", "DZA.48_1": "ABD",
    // 콘스탄틴 베이국 14 — 동부. 아흐메드 베이가 알제 함락 뒤에도 오스만 칭호로
    // 다스린다. 비스크라까지가 그의 영향권이고, 프랑스의 첫 콘스탄틴 원정은
    // 1836-11에 실패한다.
    "DZA.6_1": "CST", "DZA.9_1": "CST", "DZA.11_1": "CST", "DZA.15_1": "CST", "DZA.19_1": "CST", "DZA.21_1": "CST",
    "DZA.24_1": "CST", "DZA.26_1": "CST", "DZA.29_1": "CST", "DZA.34_1": "CST", "DZA.37_1": "CST", "DZA.39_1": "CST",
    "DZA.40_1": "CST", "DZA.42_1": "CST",
    // 나머지 15칸은 **비운다** — 셋 어느 쪽도 아닌 땅이다.
    // 카빌리(티지우주·부이라·지젤)는 부족연합이 자치하고 프랑스가 평정하는 것은
    // 1857년이다. 사하라(음자브·수프·투아트·투아레그)는 그 누구의 행정도 닿지
    // 않는다 — 파타고니아·뉴질랜드 남섬과 같은 자리다.

    // ══ 식민지 구조 · 보고 3·11·12 ═════════════════════════════════════════
    // 위 폴리티 주석 참조. 여기는 칸 배정이고, **비워 두는 칸이 핵심**이다 —
    // 남미에서 파타고니아·아라우카니아를 비운 것과 같은 원칙이다. 1836년에 그 땅을
    // 다스리는 유럽 정부가 없으면 유럽 색을 칠하지 않는다.
    //
    // 캐나다 13칸 — 회사 7 · 식민지 6.
    // 온타리오·퀘벡 칸은 현대 경계라 북쪽 절반이 실제로는 루퍼츠랜드다. GADM
    // 1단계로는 못 가르므로 인구와 정부가 있는 남쪽을 따라 준다.
    "CAN.1_1": "HBC", "CAN.2_1": "HBC", "CAN.3_1": "HBC", "CAN.6_1": "HBC", "CAN.8_1": "HBC", "CAN.12_1": "HBC",
    "CAN.13_1": "HBC",
    "CAN.9_1": "UPC",
    "CAN.11_1": "LWC",
    "CAN.4_1": "NBR",
    "CAN.7_1": "NSC",
    "CAN.10_1": "PEI",
    "CAN.5_1": "NFL",
    // 호주 — 남호주(AUS.8_1)는 개장일엔 아직 뉴사우스웨일스다. 1834년 남호주법이
    // 법으로 떼어 놨지만 경계 특허장이 1836-02-19, 식민지 선포가 1836-12-28이다.
    // 애시모어·카티에(AUS.1_1)와 산호해 제도(AUS.3_1)는 무인도이고 영국 병합이
    // 각각 1878·1969라 **비운다.**
    "AUS.2_1": "NSW", "AUS.4_1": "NSW", "AUS.5_1": "NSW", "AUS.6_1": "NSW", "AUS.7_1": "NSW", "AUS.8_1": "NSW",
    "AUS.10_1": "NSW",
    "AUS.9_1": "VDL",
    "AUS.11_1": "WAU",
    // 뉴질랜드 — 북섬 9칸이 부족연합이다. 1835년 선언에 서명한 것은 북부 랑가티라
    // 들이고 남섬은 그 연합에 들어가지 않는다. **남섬·채텀·부속도서는 비운다** —
    // 응아이타후가 있었지만 이 보드는 이위를 폴리티로 모델링하지 않고, 비우는 것이
    // 영국으로 칠하는 것보다 참에 가깝다.
    "NZL.1_1": "UTZ", "NZL.2_1": "UTZ", "NZL.5_1": "UTZ", "NZL.6_1": "UTZ", "NZL.7_1": "UTZ", "NZL.11_1": "UTZ",
    "NZL.15_1": "UTZ", "NZL.17_1": "UTZ", "NZL.18_1": "UTZ",
    // 남아프리카 — 케이프 식민지는 서·북·동케이프까지다. 1836-02에 막 시작된
    // 대이주가 아직 오렌지강을 건너는 중이고, 보어 공화국(1852·1854)은 없다.
    // 자유주·하우텡·림포포·음푸말랑가·노스웨스트는 소토·츠와나·은데벨레의 땅이라
    // **비운다.** 콰줄루나탈만 이름 붙일 국가가 있다 — 줄루 왕국이다.
    "ZAF.1_1": "GBR", "ZAF.8_1": "GBR", "ZAF.9_1": "GBR",
    "ZAF.4_1": "ZUL",
    // 영국령 기아나 — 해안 3개 주(에세키보·데메라라·버비스)를 1831년에 합친
    // 식민지다. 내륙 고원은 측량조차 안 됐고 슘부르크 경계선이 1840년에야 그어진다.
    "GUY.3_1": "GBR", "GUY.4_1": "GBR", "GUY.5_1": "GBR", "GUY.6_1": "GBR", "GUY.7_1": "GBR",
    // 포르투갈 — 앙골라·모잠비크·기니는 1836년에 **해안 거점**이다. 내륙 정복은
    // 1885년 베를린 회의의 실효 점유 원칙 이후이고, 그전까지 포르투갈이 다스리는
    // 것은 요새와 그 배후지뿐이다. 모잠비크는 OHM도 `Province of Mozambique`를
    // 1836년에 시작으로 기록한다.
    // 앙골라: 루안다·벵고·벵겔라·쿠안자 남북. 모사메드스(나미베)는 1840년 건설이라
    // 아직 없고, 카빈다의 포르투갈 주권은 1885년이다.
    "AGO.11_1": "POR", "AGO.1_1": "POR", "AGO.2_1": "POR", "AGO.6_1": "POR", "AGO.7_1": "POR",
    // 모잠비크: 이보·모잠비크섬·켈리마느·소팔라·이냠바느·로렌수마르케스와 잠베지
    // 프라주(테테). 가자·마니카·니아사는 내륙이라 비운다.
    "MOZ.1_1": "POR", "MOZ.3_1": "POR", "MOZ.5_1": "POR", "MOZ.6_1": "POR", "MOZ.7_1": "POR", "MOZ.9_1": "POR",
    "MOZ.10_1": "POR", "MOZ.11_1": "POR",
    // 기니: 비사우·카셰우 요새와 그 앞바다(비옴부·볼라마). 내륙은 푸타잘롱과
    // 카부의 영향권이고 포르투갈의 실효 지배는 1910년대까지 해안에 머문다.
    "GNB.2_1": "POR", "GNB.3_1": "POR", "GNB.4_1": "POR", "GNB.5_1": "POR",

    // ══ 사용자 보고 정정 · 다뉴브 ═══════════════════════════════════════════
    // "트란실바니아가 오스트리아에 없음" — 보드가 루마니아 전체를 오스만에게 줬다.
    // 트란실바니아 대공국은 1867년까지 합스부르크령이고 바나트·크리샤나·마라무레슈·
    // 부코비나도 마찬가지다. 왈라키아와 몰다비아는 오스만 **종주권** 아래의 자치
    // 공국이지 속주가 아니며, 원본 팔레트도 둘을 따로 이름 짓는다.
    "ROU.1_1": "AUT", "ROU.6_1": "AUT", "ROU.8_1": "AUT", "ROU.14_1": "AUT", "ROU.16_1": "AUT", "ROU.22_1": "AUT",
    "ROU.23_1": "AUT", "ROU.29_1": "AUT", "ROU.35_1": "AUT", "ROU.33_1": "AUT", "ROU.27_1": "AUT", "ROU.34_1": "AUT",
    "ROU.5_1": "AUT", "ROU.2_1": "AUT", "ROU.38_1": "AUT", "ROU.13_1": "AUT", "ROU.36_1": "AUT",
    // 수체아바(ROU.36_1)가 실제로 갈리는 유일한 칸이다 — 북서 절반이 오스트리아령
    // 남부코비나, 남동쪽이 몰다비아. 큰 쪽인 부코비나로 준다.
    "ROU.10_1": "WLC", "ROU.26_1": "WLC", "ROU.17_1": "WLC", "ROU.32_1": "WLC", "ROU.3_1": "WLC", "ROU.40_1": "WLC",
    "ROU.21_1": "WLC", "ROU.18_1": "WLC", "ROU.28_1": "WLC", "ROU.31_1": "WLC", "ROU.37_1": "WLC", "ROU.20_1": "WLC",
    "ROU.12_1": "WLC", "ROU.25_1": "WLC", "ROU.11_1": "WLC", "ROU.9_1": "WLC",
    "ROU.24_1": "MOL", "ROU.7_1": "MOL", "ROU.30_1": "MOL", "ROU.4_1": "MOL", "ROU.41_1": "MOL", "ROU.19_1": "MOL",
    "ROU.42_1": "MOL",
    // ★ 이 행들은 한동안 **화면에 안 나왔다.** 오스만 면이 그 땅을 통째로 덮는데
    // 면이 지역 배정보다 뒤에 적용되어 이겼기 때문이다(트란실바니아·보이보디나만
    // 그 면 밖이라 실렸다). 당시엔 "스펙으로는 못 고친다"고 적어 뒀는데 **틀렸다** —
    // 위 eraGeometry.faceKeepOut이 오스만 면을 이 35칸에서 물러나게 해서 지금은
    // 그대로 그려진다. 빌드 실측: ROU 42 = 오스트리아 17 · 왈라키아 16 · 몰다비아 7 ·
    // 오스만 2(도브루자), SRB 25 = 오스트리아 7 · 세르비아 12 · 오스만 6(남부).
    //
    // 이 행과 그 울타리는 **한 쌍이다.** 여기서 주인을 바꾸면 위 목록도 같이 고쳐야
    // 하고, 울타리만 지우면 오스만 면이 다시 덮는다.
    // 도브루자만 오스만 직할이다 — 실리스트라 산자크, 총독과 수비대가 있다.
    "ROU.15_1": "OTT", "ROU.39_1": "OTT",

    // "세르비아 위치가 틀림" — 보드가 세르비아 전체를 공국에게 줬다. 1836년 공국은
    // 베오그라드 파샬리크 + 1833년 하티셰리프가 넘긴 여섯 나히예다. 보이보디나는
    // 합스부르크, 남부와 노비파자르 산자크는 오스만이다.
    "SRB.17_1": "AUT", "SRB.24_1": "AUT", "SRB.5_1": "AUT", "SRB.18_1": "AUT", "SRB.19_1": "AUT", "SRB.6_1": "AUT",
    "SRB.20_1": "AUT",
    "SRB.10_1": "OTT", "SRB.12_1": "OTT", "SRB.4_1": "OTT", "SRB.11_1": "OTT", "SRB.22_1": "OTT", "SRB.16_1": "OTT",
    // 즐라티보르는 스타리블라흐가 1833년에 넘어왔으므로 공국에 남긴다 — 절반씩
    // 갈리는 칸이고, 니샤바도 알렉시나츠만 세르비아라 반쯤 틀린다.

    // ══ 사용자 보고 정정 · 아라비아 ═══════════════════════════════════════
    // 이집트가 반도 전체를 쥐고 있었다. 헤자즈·티하마만 이집트이고 네지드는
    // 제2차 사우드국(파이살 빈 투르키)이다 — 리야드 함락은 1838년이다.
    "SAU.11_1": "EGY", "SAU.5_1": "EGY", "SAU.13_1": "EGY", "SAU.2_1": "EGY", "SAU.10_1": "EGY", "GRC.4.1_1": "EGY",
    "YEM.5_1": "EGY",
    // 크레타(GRC.4.1_1)는 1830~1840년 무함마드 알리의 위임 통치 — 그리스 독립전쟁의
    // 대가였고 이 보드에서 빠져 있었다. 호데이다(YEM.5_1)도 1830년대엔 이집트다.
    "SAU.7_1": "NEJ", "SAU.6_1": "NEJ", "SAU.8_1": "NEJ", "SAU.9_1": "NEJ", "OMN.4_1": "NEJ",
    // 하일(SAU.9_1)은 아직 자발샴마르가 아니다 — 압둘라 빈 알리 알라시드가 파이살이
    // 임명한 총독으로 앉아 있고 라시드 토후국의 독립은 1836년 이후다.
    "SAU.1_1": "ASR",
    // 아시르: 1835년 5월 이집트 원정을 아이드 빈 마리가 물리쳤다. 이집트로 칠하면
    // 그가 막 뒤집은 상태를 그리는 것이 된다. 나즈란과 북부 사막(SAU.12_1·3_1·4_1)은
    // 배정하지 않는다 — 1836년에 이름 붙일 주인이 없다.
    "OMN.11_1": "OMA", "OMN.2_1": "OMA", "OMN.3_1": "OMA", "OMN.1_1": "OMA", "OMN.7_1": "OMA", "OMN.8_1": "OMA",
    "OMN.5_1": "OMA", "OMN.6_1": "OMA", "OMN.10_1": "OMA",
    "YEM.19_1": "YMN", "YEM.9_1": "YMN", "YEM.10_1": "YMN", "YEM.11_1": "YMN", "YEM.13_1": "YMN", "YEM.8_1": "YMN",
    "YEM.17_1": "YMN", "YEM.14_1": "YMN", "YEM.21_1": "YMN", "YEM.18_1": "YMN", "YEM.3_1": "YMN", "YEM.6_1": "YMN",
    "YEM.16_1": "YMN",
    "YEM.1_1": "LHJ", "YEM.15_1": "LHJ",
    // 아덴은 1839-01-19 영국이 함포로 빼앗는다 — 이 보드에서는 아직 라헤지다.
    "YEM.7_1": "MHR",

    // ══ 사용자 보고 정정 · 인도 ═══════════════════════════════════════════
    // "영국이 인도를 직접 통치" — 1836년 인도는 동인도회사다. 1833년 특허법이 회사의
    // 교역을 걷어내고 통치만 남겼고, 왕실이 인도를 받는 것은 1858년이다.
    "IND.2_1": "EIC", "IND.4_1": "EIC", "IND.5_1": "EIC", "IND.7_1": "EIC", "IND.11_1": "EIC",
    "IND.12_1": "EIC", "IND.15_1": "EIC", "IND.16_1": "EIC", "IND.17_1": "EIC", "IND.19_1": "EIC", "IND.20_1": "EIC",
    "IND.21_1": "EIC", "IND.22_1": "EIC", "IND.25_1": "EIC", "IND.26_1": "EIC", "IND.29_1": "EIC", "IND.30_1": "EIC",
    "IND.31_1": "EIC", "IND.32_1": "EIC", "IND.33_1": "EIC", "IND.34_1": "EIC", "IND.35_1": "EIC", "IND.36_1": "EIC",
    // 이 안에 종주권 아래 자치하는 번왕국이 섞여 있다(아와드·하이데라바드·괄리오르·
    // 인도르·보팔). 회사 색으로 함께 칠하는 것은 근사이고, 따로 그리려면 로스터가
    // 스무 줄 더 필요하다 — 그 사실을 여기 적어 둔다.
    "MYS.11_1": "EIC", "MYS.6_1": "EIC",
    // 해협 식민지의 페낭과 말라카. 싱가포르는 전체국가 배정에 있다.
    "PAK.8_1": "SND",
    "PAK.2_1": "KAL",
    // 시크 제국 — 펀자브·카슈미르·데라자트·하자라. 수틀레지 이남은 1809년 암리차르
    // 조약의 경계라 넘지 않는다. 히마찰·펀자브는 칸 하나가 양안에 걸치는데 큰 쪽인
    // 라호르에게 준다(시스수틀레지 번왕국은 이 축척에서 못 그린다).
    "PAK.4_1": "SIK", "PAK.7_1": "SIK", "PAK.5_1": "SIK",
    "IND.8_1": "POR",
    "IND.27_1": "FRA",
    // 고아·다만·디우와 퐁디셰리 — 1836년 유럽이 인도에서 실제로 가진 나머지다.

    // ══ 말레이 ════════════════════════════════════════════════════════════
    "MYS.1_1": "JOH", "MYS.8_1": "JOH",
    "MYS.9_1": "PRK",
    "MYS.15_1": "SEL", "MYS.4_1": "SEL", "MYS.12_1": "SEL",
    "MYS.7_1": "NSN",
    "MYS.2_1": "SIA", "MYS.10_1": "SIA", "MYS.3_1": "SIA", "MYS.16_1": "SIA",
    // 케다·펄리스는 1821년 이래 시암 직할이고, 클란탄·트렝가누는 자치 술탄국이지만
    // 붕아마스를 보낸다 — 1826년 버니 조약이 그 선을 굳혔다.
    "MYS.14_1": "BRU", "MYS.13_1": "BRU", "MYS.5_1": "BRU",

    // ══ 서아프리카 ════════════════════════════════════════════════════════
    "NGA.34_1": "SOK", "NGA.37_1": "SOK", "NGA.22_1": "SOK", "NGA.21_1": "SOK", "NGA.20_1": "SOK", "NGA.18_1": "SOK",
    "NGA.19_1": "SOK", "NGA.5_1": "SOK", "NGA.16_1": "SOK", "NGA.2_1": "SOK", "NGA.35_1": "SOK", "NGA.26_1": "SOK",
    "NGA.27_1": "SOK", "NGA.24_1": "SOK",
    // 고비르는 개장일에 반란 중이고 가와쿠케 전투는 1836-03-09 — 이 보드보다 뒤다.
    "NGA.8_1": "BOR", "NGA.36_1": "BOR",
    "NGA.31_1": "OYO", "NGA.30_1": "OYO",
    "NGA.12_1": "BNI", "NGA.10_1": "BNI", "NGA.29_1": "BNI", "NGA.25_1": "BNI",
    // 이보·이비비오·이자우 땅(남동부)은 배정하지 않는다 — 마을 단위 위에 권력이
    // 없었고, 유럽이 상대한 것은 보니·칼라바리 같은 교역 가문이지 국가가 아니었다.
    "SEN.10_1": "FRA", "SEN.1_1": "FRA",
    // 프랑스는 면이 아니라 점을 쥔다 — 생루이와 고레. 나머지 세네감비아는 왕국들이다.
    "SEN.13_1": "CAY", "SEN.8_1": "CAY",
    "SEN.2_1": "BAO",
    "SEN.3_1": "SIN",
    "SEN.5_1": "SAL", "SEN.4_1": "SAL",
    "SEN.9_1": "FUT",
    "SEN.12_1": "BUN",
    "SEN.7_1": "KAB", "SEN.11_1": "KAB",
    "SEN.14_1": "POR",
    "MLI.6_1": "MSN", "MLI.9_1": "MSN",
    "MLI.7_1": "SEG", "MLI.5_1": "SEG", "MLI.1_1": "SEG",
    "MLI.3_1": "KRT",
    // 가오·키달·시카소와 케두구는 배정하지 않는다 — 투아레그 사막 연합과 세누포·
    // 말링케 마을들이고, 1836년에 그릴 국가가 없다.

    // ══ 남아메리카 ════════════════════════════════════════════════════════
    // 전체국가로 주지 않고 지역으로 준다. 이 보드에는 "주인 없음"을 적을 자리가
    // 없어서(빌더는 배정하지 않은 칸만 비운다), 파타고니아·아라우카니아·차코·아크리를
    // 비우려면 나라를 통째로 줄 수 없다.
    "BRA.10_1": "BRZ", "BRA.11_1": "BRZ", "BRA.12_1": "BRZ", "BRA.13_1": "BRZ", "BRA.15_1": "BRZ", // 파라(14)는 아래 카바나젱으로
    "BRA.16_1": "BRZ", "BRA.17_1": "BRZ", "BRA.18_1": "BRZ", "BRA.19_1": "BRZ", "BRA.20_1": "BRZ", "BRA.21_1": "BRZ",
    "BRA.22_1": "BRZ", "BRA.23_1": "BRZ", "BRA.24_1": "BRZ", "BRA.25_1": "BRZ", "BRA.26_1": "BRZ", "BRA.27_1": "BRZ",
    "BRA.2_1": "BRZ", "BRA.4_1": "BRZ", "BRA.5_1": "BRZ", "BRA.6_1": "BRZ", "BRA.7_1": "BRZ", // 아마파(3)도 마찬가지
    "BRA.8_1": "BRZ", "BRA.9_1": "BRZ",
    "ARG.10_1": "ARG", "ARG.12_1": "ARG", "ARG.13_1": "ARG", "ARG.14_1": "ARG", "ARG.17_1": "ARG", "ARG.18_1": "ARG",
    "ARG.19_1": "ARG", "ARG.1_1": "ARG", "ARG.21_1": "ARG", "ARG.22_1": "ARG", "ARG.24_1": "ARG", "ARG.2_1": "ARG",
    "ARG.5_1": "ARG", "ARG.6_1": "ARG", "ARG.7_1": "ARG", "ARG.8_1": "ARG",
    "CHL.10_1": "CHL", "CHL.12_1": "CHL", "CHL.13_1": "CHL", "CHL.14_1": "CHL", "CHL.16_1": "CHL", "CHL.5_1": "CHL",
    "CHL.6_1": "CHL", "CHL.7_1": "CHL", "CHL.8_1": "CHL", "CHL.9_1": "CHL",
    "PRY.10_1": "PRY", "PRY.11_1": "PRY", "PRY.12_1": "PRY", "PRY.13_1": "PRY", "PRY.14_1": "PRY", "PRY.15_1": "PRY",
    "PRY.16_1": "PRY", "PRY.18_1": "PRY", "PRY.2_1": "PRY", "PRY.3_1": "PRY", "PRY.4_1": "PRY", "PRY.6_1": "PRY",
    "PRY.7_1": "PRY", "PRY.8_1": "PRY", "PRY.9_1": "PRY",
    // 칠레 북부 세 칸은 1836년에 칠레가 아니다 — 태평양 전쟁(1879~83)의 전리품이다.
    // 아리카·타라파카는 페루 주(州), 안토파가스타는 볼리비아 리토랄이다.
    "CHL.4_1": "PER", "CHL.15_1": "PER",
    "CHL.2_1": "BOL",
    // 비운 것: 아라우카니아·아이센·마가야네스(마푸체·테우엘체), 팜파·파타고니아,
    // 차코(과이쿠루), 아크리(1777년 산일데폰소 선의 스페인 쪽, 브라질 편입 1903년).
    // 칠레의 아라우카니아 점령은 1861년, 아르헨티나의 사막 정벌은 1878년이다.
    "GUF.1_1": "FRA", "GUF.2_1": "FRA",

    // ══ 크라쿠프 ══════════════════════════════════════════════════════════
    // 빈 회의가 만든 자유·독립·중립시. 오스트리아 병합은 1846년이라 이 보드에서는
    // 아직 자기 나라다. GADM 소폴란드가 자유시보다 열 배 넓다는 것이 유보다.
    "POL.6_1": "KRA",
    // ── The Americas ──
    "USA.44_1": "MEX",  // 코아우일라이테하스 — 무장 반란 중이지만 공화국 선포는 1836-03-02이다(위 참조)
    "USA.32_1": "MEX", "USA.3_1": "MEX", "USA.5_1": "MEX", "USA.29_1": "MEX", "USA.45_1": "MEX", // Mexican north
    "USA.6_1": "MEX",   // Colorado — mostly Mexican above the Arkansas
    "USA.48_1": "GBR", "USA.38_1": "GBR", "USA.13_1": "GBR", // Oregon Country — jointly occupied, HBC in fact
    "USA.2_1": "RUS",   // Russian America
    "USA.12_1": "HAW",  // the Kamehameha kingdom
    // 인도 지역 배정은 위 동인도회사 블록으로 옮겼다 — 1836년 인도를 쥔 것은
    // 왕실이 아니라 회사다(1833년 특허법, 왕실 이관은 1858년).
    // ── Poland after the November Uprising ──
    "POL.7_1": "RUS", "POL.3_1": "RUS", "POL.4_1": "RUS", "POL.10_1": "RUS", "POL.13_1": "RUS", // Congress Poland, autonomy revoked
    "POL.15_1": "PRU", "POL.2_1": "PRU", "POL.11_1": "PRU", "POL.14_1": "PRU", "POL.16_1": "PRU", "POL.5_1": "PRU", "POL.1_1": "PRU", "POL.8_1": "PRU", "POL.12_1": "PRU",
    // 크라쿠프는 위에서 자유시(KRA)로 옮겼다 — 병합은 1846년이라 이 보드보다 뒤다.
    "POL.9_1": "AUT",   // Galicia
    "RUS.21_1": "PRU",  // Königsberg
    // ── Germany: Prussia, Austria and the Bund's minors ──
    "DEU.4_1": "PRU", "DEU.3_1": "PRU", "DEU.13_1": "PRU", "DEU.10_1": "PRU", "DEU.11_1": "PRU", "DEU.12_1": "PRU", // Rhineland Prussian since 1815
    "DEU.8_1": "GER", "DEU.2_1": "GER", "DEU.1_1": "GER", "DEU.7_1": "GER", "DEU.14_1": "GER", "DEU.16_1": "GER", "DEU.9_1": "GER", "DEU.6_1": "GER", "DEU.5_1": "GER",
    "DEU.15_1": "DAN",  // the duchies — the Schleswig question is loaded, not fired

    // ★ 순서가 의미를 갖는 자리다 — **아래 여섯은 위 `DEU.8_1: "GER"` 뒤에 와야**
    // **한다.** 빌더가 레거시 `DEU.n_1` 키를 NUTS 칸들로 **확장**하고
    // (`expandRegionKey`), 같은 칸에 두 번 쓰면 **나중 것이 이긴다**. 처음엔 이 블록을
    // 파일 앞쪽에 뒀다가 배정이 통째로 먹히지 않았다 — 빌드가 조용히 옛 답을 냈고
    // 실측해서야 알았다. 여기 두면 여섯이 GER 확장을 덮어쓴다.
    // ══ 보고 1 · 8 · 9 ════════════════════════════════════════════════════
    // 보고 1 — 오스트리아 영토. 스펙이 서갈리치아(POL.9_1)만 오스트리아로 두고
    // **동갈리치아를 통째로 러시아에 주고 있었다.** 갈리치아-로도메리아 왕국은
    // 1772·1795년 분할로 합스부르크가 얻은 땅이고 렘베르크(르비우)가 그 수도다.
    // 부코비나는 1775년부터, 카르파티아 루테니아는 헝가리 왕국의 일부다.
    // 러시아령 우크라이나와의 경계는 즈브루치강이지 오늘날의 국경이 아니다.
    "UKR.14_1": "AUT", "UKR.22_1": "AUT", "UKR.7_1": "AUT", // 동갈리치아 — 르비우·테르노필·이바노프란키우스크
    "UKR.3_1": "AUT",  // 부코비나 — 1775년 오스만에서 할양
    "UKR.23_1": "AUT", // 자카르파탸 — 헝가리 왕국(웅바르·문카치)

    // 보고 8 — 그라오파라. 브라질이 이 땅을 못 쥐고 있었다는 지적이 맞다. 다만
    // 이유는 병합 이전이어서가 아니라(1823년에 제국에 붙었다) **카바나젱 때문**이다.
    // 카바누 반란군이 벨렝을 1835-08-21에 두 번째로 점령하고 에두아르두 앙젤림이
    // 대통령을 칭한다. 제국군이 벨렝을 되찾는 것은 **1836-05-13** — 개장일에는
    // 반란군의 것이다. 텍사스와 정반대다: 저쪽은 개장일보다 **뒤**에 서고 이쪽은
    // **앞**에 선다. 그래서 하나는 지우고 하나는 세운다.
    // 아마조나스·호라이마(리우네그루 관구)는 카바누가 강을 거슬러 올라가긴 했으나
    // 지배가 명목이라 제국에 남긴다.
    "BRA.14_1": "CAB", "BRA.3_1": "CAB", // 파라 · 아마파

    // 보고 9 — 볼리비아령 아마존. 아크리는 우티 포시데티스로 볼리비아 땅이고,
    // 브라질로 넘어가는 것은 **1903년 페트로폴리스 조약**이다(고무 붐이 부른
    // 아크리 전쟁의 결과). 1836년에 그곳을 실제로 다스리는 정부는 없지만 —
    // 고무 채취는 1870년대에야 시작된다 — 사용자가 지목한 대로 볼리비아로 그린다.
    // 옆의 판도(BOL.6_1)가 이미 볼리비아라 선이 이어진다.
    "BRA.1_1": "BOL",

    // ══ 중앙아시아·걸프 · 보고 6 ══════════════════════════════════════════
    // 코칸트 16칸 — 페르가나(안디잔·페르가나·나망간)와 타슈켄트, 그리고 키르기스
    // 초원 전체. 마달리 칸이 피슈페크·토크막 요새로 그 초원을 쥐고, 후잔트(소그드)도
    // 코칸트다. 러시아가 타슈켄트를 얻는 것은 1865년, 병합은 1876년이다.
    "UZB.1_1": "KOK", "UZB.3_1": "KOK", "UZB.8_1": "KOK", "UZB.11_1": "KOK", "UZB.13_1": "KOK", "UZB.14_1": "KOK",
    "TJK.4_1": "KOK",
    "KGZ.1_1": "KOK", "KGZ.2_1": "KOK", "KGZ.3_1": "KOK", "KGZ.4_1": "KOK", "KGZ.5_1": "KOK", "KGZ.6_1": "KOK",
    "KGZ.7_1": "KOK", "KGZ.8_1": "KOK", "KGZ.9_1": "KOK",
    // 부하라 10칸 — 사마르칸트·부하라·카슈카다리야·수르한다리야와 타지크 남부.
    // 레바프(차르조우)의 에르사리 투르크멘도 부하라 종주권 아래다.
    // 나보이(UZB.9_1)는 지금 히바 면이 덮고 있는데 실제로는 부하라 땅이다 — 면이
    // 배정을 이기므로 이 행은 당장은 안 보인다. 면이 정밀해지면 살아난다.
    "UZB.2_1": "BUK", "UZB.4_1": "BUK", "UZB.6_1": "BUK", "UZB.9_1": "BUK", "UZB.10_1": "BUK", "UZB.12_1": "BUK",
    "TJK.1_1": "BUK", "TJK.3_1": "BUK", "TJK.5_1": "BUK", "TKM.4_1": "BUK",
    // 히바 3칸 — 호레즘·카라칼팍스탄과 다쇼구즈.
    "UZB.5_1": "KHI", "UZB.7_1": "KHI", "TKM.6_1": "KHI",
    // 트루셜 연안 7칸 — 알카시미(샤르자·라스알카이마)와 알나하얀(아부다비).
    // **1835년 해상 휴전 조약**의 당사자들이고 이 보드 개장 직전의 사건이다.
    "ARE.1_1": "TRU", "ARE.2_1": "TRU", "ARE.3_1": "TRU", "ARE.4_1": "TRU", "ARE.5_1": "TRU", "ARE.6_1": "TRU",
    "ARE.7_1": "TRU",
    // 바레인 4칸.
    "BHR.1_1": "BAH", "BHR.3_1": "BAH", "BHR.4_1": "BAH", "BHR.5_1": "BAH",
    // 비우는 곳:
    // · 카타르 7칸 — 위 BAH 주석 참조. 명목 종주권은 칠하지 않는다.
    // · 고르노바다흐샨(TJK.2_1) — 파미르의 슈그난·로샨·와한은 반독립 소공국이고
    //   1836년에 그것들을 묶는 주권자가 없다.
    // · 투르크멘 초원 넷(아할·아시가바트·발칸·마리) — **여기서 카자르 페르시아를**
    //   **뺐다.** 스펙이 `QAJ: ["IRN", "TKM"]`으로 투르크메니스탄 전체를 페르시아에
    //   주고 있었는데, 1836년 카자르의 실효 국경은 코페트다그이고 그 북쪽은 테케·
    //   요무트·에르사리 부족의 땅이다. 페르시아는 오히려 그쪽에서 습격을 당한다
    //   (메르브를 잠깐 얻는 것은 1850년대이고 1861년에 다시 잃는다).

    // ══ 독일 연방에서 여섯을 꺼낸다 ═══════════════════════════════════════
    // 위 폴리티 주석 참조. GER 14칸 중 10칸이 여기로 간다.
    "DEU.DE11": "WUR", "DEU.DE14": "WUR",
    "DEU.DE12": "BAD", "DEU.DE13": "BAD",
    // DE13 프라이부르크와 DEB3는 호엔촐레른 메가링이 물고 있던 칸이다(위 울타리).
    // 프라이부르크는 남부 바덴이고, 라인헤센팔츠는 팔츠(바이에른)가 라인헤센
    // (헤센대공국)보다 네 배 크므로 바이에른에 준다 — 한 칸으로는 못 가른다.
    "DEU.DEB3": "BAY",
    // 하노버 넷. 브라운슈바이크 칸(DE91)에는 브라운슈바이크 공국이 함께 있고
    // 베저엠스(DE94)에는 올덴부르크 대공국이 있다 — 둘 다 NUTS 한 칸으로는 못
    // 가르고 면적 다수는 하노버다. **조립기에 그 둘의 윤곽이 들어오면 면이 이겨**
    // **저절로 갈린다**(GER 주석이 적어 둔 그 경로).
    "DEU.DE91": "HAN", "DEU.DE92": "HAN", "DEU.DE93": "HAN", "DEU.DE94": "HAN",
    // 한자 자유시 둘 — 칸이 곧 나라라 이 배정은 정확하다.
    "DEU.DE50": "BRE", "DEU.DE60": "HAM",
    // 튀링겐 한 칸. 마이닝겐·알텐부르크·로이스 둘은 면이 있어 알아서 깎는다.
    "DEU.DEG0": "SWG",
    // ── Italy: a geographic expression ──
    "ITA.13_1": "SAR", "ITA.9_1": "SAR", "ITA.19_1": "SAR", "ITA.14_1": "SAR",
    "ITA.10_1": "AUT", "ITA.20_1": "AUT", "ITA.7_1": "AUT", "ITA.17_1": "AUT", // Lombardy-Venetia
    // Tuscany, and Emilia — the duchies' baseline. Emilia-Romagna is one modern
    // province holding Parma, Modena AND papal Bologna; Modena takes the
    // baseline and the Parma face carves its own half back out.
    "ITA.16_1": "TOS", "ITA.6_1": "MOD",
    "ITA.8_1": "PAP", "ITA.18_1": "PAP", "ITA.11_1": "PAP",
    "ITA.5_1": "SIC", "ITA.1_1": "SIC", "ITA.12_1": "SIC", "ITA.2_1": "SIC", "ITA.3_1": "SIC", "ITA.4_1": "SIC", "ITA.15_1": "SIC",
    // ── India: the Company's map, with the Sikh exception ──
    "IND.28_1": "SIK", "IND.13_1": "SIK", "IND.6_1": "SIK",
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

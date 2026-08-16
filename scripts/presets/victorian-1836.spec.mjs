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
    TEX: { name: "Republic of Texas", color: "#bf6a4a", aliases: ["텍사스 공화국", "텍사스", "Texas", "Texian rebellion"] },
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
    BUK: { name: "Emirate of Bukhara", color: "#8a7f5a", aliases: ["부하라 토후국", "امارت بخارا", "Emirate of Bukhara (1785-1868)", "Bukhara"] },
    KHI: { name: "Khanate of Khiva", color: "#5f8a8a", aliases: ["히바 칸국", "خیوه خانلیگی", "Khiva"] },
    KAL: { name: "Khanate of Kalat", color: "#7b64ff", aliases: ["칼라트 번왕국", "Khanate of Kalat", "Kalat"] },
  },

  countryAssignments: {
    GBR: ["GBR", "IRL", "CAN", "AUS", "NZL", "LKA", "MLT", "ZAF", "GUY", "BLZ", "JAM", "BRB", "TTO", "BHS", "SLE", "GMB"],
    FRA: ["FRA", "DZA"], // Algiers taken 1830 — the conquest is young and contested
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
    POR: ["PRT", "AGO", "MOZ", "GNB", "CPV", "STP", "TLS"],
    BEL: ["BEL"],
    NLD: ["NLD", "LUX", "IDN", "SUR"],
    DAN: ["DNK", "ISL", "GRL", "FRO"],
    SWE: ["SWE", "NOR"],
    GRE: ["GRC"],
    SER: ["SRB"],
    QAJ: ["IRN", "TKM"],
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
    // ★ 아래 왈라키아·몰다비아·세르비아 행은 지금 **화면에 안 나온다.** 빌드 후
    // 실측: ROU·SRB 68칸이 오스트리아 24 · 오스만 43으로만 갈린다. 시대 면
    // (era-borders-1836-01-01)에 다뉴브 공국 면이 없고 오스만 면이 그 땅을
    // 통째로 덮는데, 면은 지역 배정보다 뒤에 적용되어 이긴다. 트란실바니아·
    // 보이보디나는 그 면 밖이라 위 오스트리아 행이 그대로 실렸다 — 즉 사용자
    // 보고 중 트란실바니아는 고쳐졌고 세르비아 축소는 아직이다.
    //
    // 고치려면 스펙이 아니라 조립 레인이다: 오스만 면을 쪼개 공국 면을 만들거나,
    // faceOwners로 그 조각의 주인을 지정해야 한다. 행은 남겨 둔다 — 면이 쪼개지는
    // 순간 이 배정이 그대로 살아난다.
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
    "BRA.10_1": "BRZ", "BRA.11_1": "BRZ", "BRA.12_1": "BRZ", "BRA.13_1": "BRZ", "BRA.14_1": "BRZ", "BRA.15_1": "BRZ",
    "BRA.16_1": "BRZ", "BRA.17_1": "BRZ", "BRA.18_1": "BRZ", "BRA.19_1": "BRZ", "BRA.20_1": "BRZ", "BRA.21_1": "BRZ",
    "BRA.22_1": "BRZ", "BRA.23_1": "BRZ", "BRA.24_1": "BRZ", "BRA.25_1": "BRZ", "BRA.26_1": "BRZ", "BRA.27_1": "BRZ",
    "BRA.2_1": "BRZ", "BRA.3_1": "BRZ", "BRA.4_1": "BRZ", "BRA.5_1": "BRZ", "BRA.6_1": "BRZ", "BRA.7_1": "BRZ",
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
    "USA.44_1": "TEX",  // Texas — in armed revolt; independence declared 2 March historically
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

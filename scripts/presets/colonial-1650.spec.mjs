/*! Open Historia — 1650 AD preset spec © 2026 Nicholas Krol, MIT (see src/Editor/LICENSE). */
// Colonial preset — 1650 AD (the colonization of the New World).
//
// The Age of Sail in full stride: Spain's viceroyalties span two continents,
// Portugal is retaking Dutch Brazil, England (a republic since the king lost
// his head in 1649) seeds the Atlantic coast, New France holds the St Lawrence,
// New Netherland the Hudson, New Sweden the Delaware — and inland, native
// nations remain the true powers of the continent: the Haudenosaunee are
// mid-Beaver-Wars, the Mapuche have stopped Spain cold at the Biobío, and the
// Itza still rule from Lake Petén. Unclaimed land is native or unexplored, not
// empty; colonization there is contact, trade and war, not free settlement.

export default {
  id: "colonial-1650",

  meta: {
    name: "New World — 1650",
    heroTitle: "The Colonization of the New World",
    heroSubtitle: "Empires of sail and the nations that met them, 1650 AD",
    eyebrow: "Age of Sail",
    subtitle: "1650 AD",
    accentColor: "#2e6b8a",
    coverImage: "public/loading_screen_4.jpg",
    description:
      "The year 1650. Spanish silver fleets sail from two viceroyalties, Portugal fights " +
      "the Dutch for Brazil, republican England plants colonies from Massachusetts to " +
      "Barbados, and France trades furs up the St Lawrence. But most of the Americas " +
      "still belong to the nations that were always there — Haudenosaunee, Cherokee, " +
      "Sioux, Apache, Maya, Mapuche. Build an empire across the ocean, or drive one " +
      "back into it.",
  },

  // Player starts as the Commonwealth of England. game.country MUST equal the owner code.
  game: { country: "GBR", startDate: "1650-01-01", gameDate: "1650-01-01" },

  // Pike-and-shot warfare: muskets, cannon, cavalry, ships of the line — no air.
  allowedUnitTypes: ["infantry", "armor", "artillery", "naval", "garrison"],

  relabelOwnedCountries: true,

  // Plan F-3: era geometry graft. Declared after the 2026-08-12 date batch
  // measured this date at 배정 34 · 실질 33.5% from the cached Overpass response —
  // the same band as the grafted 1836 baseline. The build discovers
  // era-borders-1650-01-01*.geojson in scripts/ohm/out and grafts matching
  // faces; absent the dump it builds exactly as before, and says so.
  eraGeometry: {
    date: "1650-01-01",
    // rung-3 백필을 얹은 하이브리드. mtime 자동 탐색에 맡기지 않는다 —
    // 평문과 하이브리드가 한 디렉터리에 같이 있고, 어느 쪽을 그리는지는
    // 우연이 아니라 선택이어야 한다(1935가 같은 이유로 못 박았다).
    file: "scripts/ohm/out/era-borders-1650-01-01-z4-hybrid.geojson",
    window: [-15, 30, 50, 72],
    // 2026-08-14 면 검수 (34면 전수). 잔여 메가면과 라벨 착지 오류는 배제,
    // 나머지 미매칭 27면 전부 명명 — 근거는 각 행에.
    excludeFaces: [
      // ── rung-3 백필에서 버리는 면 다섯 ────────────────────────────────
      // 메가면 둘. 이름은 맞는데 면이 이웃을 삼킨다 — 실측한 크기를 적어 둔다.
      // 스위스 연방 4.5°×1.9°: 제네바·뇌샤텔·삼동맹·발레를 통째로 덮는데, 이 스펙은
      // 그 넷을 일부러 따로 세운다(위 faceOwners). rung-1의 Eidgenossenschaft 면이
      // 이미 연방을 그리므로 이 면은 중복이면서 더 나쁘다.
      "Swiss Confederation",
      // 히바 17.2°×9.5°: 카스피해에서 아무다리야까지 덮어 부하라 칸국을 삼킨다.
      "Khiva Khanate",
      // 나라가 아닌 것 셋.
      // 롬바르디아는 1650년에 존재하지 않는 이름이다 — 그 땅의 주권은 밀라노 공국
      // (스페인)이고, 롬바르디아-베네치아 왕국은 1815년이다. 밀라노 면과 겹친다.
      "Lombardy",
      // 관체스는 나라가 아니라 사람들이고, 카스티야의 정복은 1496년에 끝났다.
      // 카나리아는 이미 스페인 배정 안에 있다.
      "Guanches",
      // "central Asian khanates"는 총칭이고 면도 1.2°×0.6°짜리 조각이다. 그 땅의
      // 칸국들(부하라·히바·카자흐)은 로스터에 이미 각자 있다.
      "central Asian khanates",
      // 동부 잔여 메가면(40.2x44.9°, 링 193): 미폐합 동부 전체가 한 면이 되어
      // 러시아 라벨을 얻었다. 점검사 실측: 이스파한(페르시아)이 안에 있다.
      // 배제하면 모스크바 대공국 지역들은 스펙 배정(RUS)을 유지한다.
      "Русское царство",
      // (제노바-사르데냐 오라벨은 2026-08-14 중심 오버라이드+재조립으로 근본
      // 수리됨 — 재조립 실측 bbox 7.5,43.8→10.1,44.8 = 진짜 리구리아 면.
      // 배제 해제, 아래 faceOwners로 승격.)
    ],
    faceOwners: {
      // — 보드 폴리티의 다른 이름 (코드 배정) —
      "Commonwealth": "GBR", // en=Commonwealth (1649-1652), 잉글랜드+웨일스 bbox 실측
      "Republiek der Zeven Verenigde Nederlanden": "NLD",
      "Magyar Királyság": "HABS", // 왕령 헝가리 — 합스부르크 왕관령
      "Regnum Siciliae": "ESP", // 시칠리아 섬 — 스페인 부왕령
      "دولة الجزائر": "OTTO", // 알제 섭정 — 명목상 오스만
      // 보드는 브리튼을 잉글랜드 연방 하나로 단순화한다. 1650-01-01의 실제:
      // 스코틀랜드는 찰스 2세를 옹립한 언약도 왕국(크롬웰 침공은 7월),
      // 맨 섬은 왕당파 더비 백작령(1651 함락). 윤곽만 시대판을 취하고
      // 소유주는 보드의 단순화를 따른다.
      "Kinrick o Scotland": "GBR",
      "Isle of Man": "GBR",
      // — 로스터 밖 실존 주권체 (이름 그대로 지도에 세운다; 1939 이라크 전례) —
      // 아일랜드 가톨릭 동맹: 연방과 교전 중(크롬웰 상륙 1649-08)이므로
      // GBR로 접으면 1650-01-01이 거짓이 된다. 스펙이 아일랜드를 GBR에
      // 배정했다면 면이 이기고 재배정이 인쇄된다.
      "Comhdháil Chaitliceach na hÉireann": "Irish Catholic Confederation",
      "Serenìscima Repùbrica de Zêna": "Republic of Genoa", // 중심 수리 후 진짜 리구리아 면
      "Eidgenossenschaft": "Swiss Confederacy", // 베스트팔렌(1648)으로 제국 이탈 공인
      "Freistaat der Drei Bünde": "Three Leagues", // 그라우뷘덴 — 스위스 맹방
      "Republik der Sieben Zenden": "Republic of Valais", // 발레 7개 촌락 공화국
      "République de Genève": "Republic of Geneva",
      "Principauté de Neuchâtel": "Principality of Neuchâtel", // 오를레앙-롱빌가
      "Stadtrepublik Mülhausen": "Republic of Mulhouse", // 스위스 맹방 도시국가
      // ── rung-3 백필(world_1650)이 데려온 면들 ──────────────────────────
      // 백필은 같은 나라를 rung-1보다 **짧은 이름**으로 부른다. 이름이 다르면 면이
      // 떨어지므로, 새 주인을 만들지 말고 이미 쓰는 문자열로 보낸다 — 안 그러면
      // 토스카나가 둘이 된다.
      "Tuscany": "Grand Duchy of Tuscany",
      "Modena": "Duchy of Modena",
      "Massa": "Duchy of Massa and Carrara",
      // 피비차노는 루니지아나의 메디치 월경지다(1477년부터 피렌체령, 1847년 모데나
      // 할양). 마사와 가르파냐나에 막혀 본토와 떨어져 있어 면이 따로 온다.
      "Fivizzano": "Grand Duchy of Tuscany",

      // 왕관은 주권자가 아니다. 밀라노·나폴리·사르데냐는 1650년에 전부 펠리페 4세의
      // 것이고 총독이 다스린다 — 왕국이라는 이름 때문에 독립국으로 세우면 틀린다.
      // 나폴리 공화국(1647-10)은 1648-04-06에 진압됐고, 사르데냐는 1720년에야
      // 사보이아로 간다.
      "Milan": "Spanish Empire",
      "Naples": "Spanish Empire",
      "Sardinia": "Spanish Empire",
      // 폰트레몰리는 1650년 **그 해에** 손이 바뀐다 — 제노바가 1647년에 사기로 했다가
      // 물렀고, 펠리페 4세가 메디치에게 팔아 토스카나가 1650-09-18에 인수한다.
      // 개장일에는 아직 스페인령이다.
      "Pontremoli": "Spanish Empire",

      // 로스터 밖 주권체 — 이름 그대로 세운다(위 아일랜드·제노바와 같은 취급).
      // 교황령: 인노첸시오 10세. 카스트로는 1649-09에 무너져 이미 교황령이다.
      "Papal States": "Papal States",
      // 베네치아: 도제 프란체스코 몰린, 1645년부터 크레타 전쟁 중이다.
      "Venice": "Republic of Venice",
      // "Sardinia-Piedmont"는 70년 이른 이름이다 — 사보이아가 사르데냐를 받는 것은
      // 1720년 헤이그 교환이다. 그런데 면이 덮는 땅(5.3~8.3°E)은 섬을 포함하지 않고
      // 사보이아-피에몬테 본토뿐이라, 버리지 않고 그 시대 이름으로 고쳐 세운다.
      "Sardinia-Piedmont": "Duchy of Savoy",
      // 핀마르크는 1650년 노르웨이의 최북단이고 노르웨이는 덴마크와 동군연합이다.
      "Finnmark": "Denmark-Norway",

      "Grand Duchy of Tuscany": "Grand Duchy of Tuscany", // 메디치
      "Ducato di Parma e Piacenza": "Duchy of Parma", // 파르네세
      "Ducatus Mutinae et Regii": "Duchy of Modena", // 에스테
      "Ducato di Massa e Principato di Carrara": "Duchy of Massa and Carrara", // 치보-말라스피나
      "Ducatus Mantuæ": "Duchy of Mantua", // 곤차가-느베르 (1631 케라스코 이후)
      "Ducatus Mirandolae": "Duchy of Mirandola", // 피코가
      "Ducatus Guastalla": "Duchy of Guastalla", // 곤차가 방계
      "Respublica Lucensis": "Republic of Lucca",
      "Republica de' Cošpäja": "Republic of Cospaia", // 측량 오류가 낳은 진짜 미소국
      "Respublica Sancti Marini": "San Marino",
      "Andorra": "Andorra", // 공동영주제 — 프랑스도 스페인도 아니다
      "Couto Misto": "Couto Misto", // 갈리시아 국경 공동통치 미소국
      // 지분 2%·폭 0.06° 가드가 미소국들을 자동 흡수하면 그건 가드의 일 —
      // 여기서 이름 없이 떨구는 것과는 다르다.
    },
    // 프랑스 면이 코모·토리노·아오스타를 포함한다(점 검사 실측) — 사보이아
    // 공국과 스페인령 밀라노가 1650 창에서 폐합되지 않아 프랑스 면이 알프스
    // 동쪽으로 흘렀고, 라벨 점이 없어 mergedWith 기록도 없다. 첫 빌드 실측:
    // 롬바르디아·피에몬테 16개 지역이 (무주)→프랑스로 가고 있었다. 1650년
    // 프랑스는 GADM ITA 땅을 갖지 않는다(피네롤로는 도 단위 미만 — 지분
    // 가드가 흡수). 1939 독일-유틀란트 전례.
    faceKeepOut: { "Royaume de France": ["ITA"] },
  },

  polities: {
    // — Colonial empires (real ISO codes where the polity IS that country, so
    //   their real flags resolve in the popup) —
    ESP:   { name: "Spanish Empire", color: "#d2a02e", aliases: ["스페인 제국", "Spain", "the Indies", "New Spain", "Peru"] },
    POR:   { name: "Portuguese Empire", color: "#2e7d6b", aliases: ["포르투갈 제국", "Portugal", "Brazil", "Braganza Portugal"] },
    GBR:   { name: "Commonwealth of England", color: "#b23b3b", aliases: ["잉글랜드 연방", "England", "the Commonwealth", "Cromwell's England"] },
    FRA:   { name: "Kingdom of France", color: "#2f5fd0", aliases: ["프랑스 왕국", "France", "New France"] },
    NLD:   { name: "Dutch Republic", color: "#e08a2e", aliases: ["네덜란드 공화국", "the Netherlands", "United Provinces", "VOC", "WIC"] },
    SWE:   { name: "Swedish Empire", color: "#4a78c0", aliases: ["스웨덴 제국", "Sweden", "New Sweden"] },
    // — Native nations of North America —
    IROQ:  { name: "Haudenosaunee", color: "#8a5a8a", aliases: ["하우데노사우니", "Iroquois", "Five Nations", "the Confederacy"] },
    CHER:  { name: "Cherokee", color: "#6f8f3f", aliases: ["체로키", "Aniyunwiya", "Tsalagi"] },
    CREE_M:{ name: "Muscogee", color: "#c07a4a", aliases: ["머스코지", "Creek", "Creek Confederacy"] },
    CHOC:  { name: "Choctaw and Chickasaw", color: "#b8604a", aliases: ["촉토·치카소", "Choctaw", "Chickasaw"] },
    SIOU:  { name: "Oceti Sakowin", color: "#7a94b8", aliases: ["오체티 샤코윈", "Sioux", "Lakota", "Dakota"] },
    APAC:  { name: "Apacheria", color: "#9a6a3a", aliases: ["아파치리아", "Apache", "Ndee"] },
    NAVA:  { name: "Dine (Navajo)", color: "#8f5f8f", aliases: ["디네(나바호)", "Navajo", "Diné"] },
    MAYA:  { name: "Itza Maya", color: "#5a9a8a", aliases: ["이차 마야", "Itza", "Peten Itza", "Maya"] },
    // — Native nations of South America —
    MAPU:  { name: "Mapuche", color: "#3f7a4f", aliases: ["마푸체", "Wallmapu", "Araucania"] },
    // — The Old World, coarsely —
    HRE:   { name: "Holy Roman Empire", color: "#b0a878", aliases: ["신성 로마 제국", "the Empire", "German princes"] },
    HABS:  { name: "Habsburg Monarchy", color: "#caa64a", aliases: ["합스부르크 군주국", "Austria", "the Habsburgs"] },
    POL_L: { name: "Polish-Lithuanian Commonwealth", color: "#d23ca0", aliases: ["폴란드-리투아니아 연방", "Poland-Lithuania", "the Commonwealth"] },
    // Russia's old #7a6b9a read as "unclaimed gray" on the map — clear green now.
    RUS:   { name: "Tsardom of Russia", color: "#2f8f4f", aliases: ["루스 차르국", "Russia", "Muscovy"] },
    DEN_N: { name: "Denmark-Norway", color: "#b0486a", aliases: ["덴마크-노르웨이", "Denmark", "the Oldenburg realm"] },
    OTTO:  { name: "Ottoman Empire", color: "#6b4f2e", aliases: ["오스만 제국", "the Porte", "the Turks"] },
    // rung-3 백필(world_1650)은 이 나라를 "Safavid Empire"라 부른다. 로스터 이름이
    // "Safavid Persia"라 면이 떨어졌다 — 별칭 한 줄이 그 간극이다.
    SAFA:  { name: "Safavid Persia", color: "#34869a", aliases: ["사파비 페르시아", "Persia", "Iran", "the Safavids", "Safavid Empire"] },
    MUGH:  { name: "Mughal Empire", color: "#3a7d4f", aliases: ["무굴 제국", "Hindustan", "the Mughals"] },
    // 일통 왕조 大 규칙 (2026-08-21). 같은 왕조가 보드마다 청/청나라로 갈려 있던 것도
    // 이 교체로 통일된다.
    QING:  { name: "Qing Dynasty", color: "#c9a227", aliases: ["대청국", "청나라", "China", "the Manchus"] },
    JOSE:  { name: "Joseon", color: "#5a9a7a", aliases: ["조선", "Korea"] },
    TOKU:  { name: "Tokugawa Japan", color: "#c0507a", aliases: ["도쿠가와 일본", "Japan", "the Shogunate"] },
    SIAM:  { name: "Ayutthaya", color: "#d0b060", aliases: ["아유타야", "Siam"] },
    MOR:   { name: "Sultanate of Morocco", color: "#2e5d8f", aliases: ["모로코 술탄국", "Morocco", "Pashalik of Timbuktu"] },
    ETHIO: { name: "Ethiopian Empire", color: "#4a8f6a", aliases: ["에티오피아 제국", "Abyssinia"] },
    // — The steppe, Central Asia and the khanates (real 1650 states; previously
    //   left unclaimed, which grayed out everything around Russia) —
    KAZH:  { name: "Kazakh Khanate", color: "#b8722e", aliases: ["카자흐 칸국", "the Kazakhs", "Kazakh Hordes"] },
    BUKH:  { name: "Khanate of Bukhara", color: "#3f9a9a", aliases: ["부하라 칸국", "Bukhara", "the Janids"] },
    // 별칭에 "Khiva Khanate"를 넣었다가 뺐다. rung-3에서 그 이름을 달고 오는 면은
    // 17.2°×9.5°로 부하라까지 삼키는 메가면이라, 붙이면 히바가 중앙아시아를 통째로
    // 칠한다. 아래 excludeFaces로 막고 히바는 rung-1 면과 TKM 배정으로 남긴다.
    KHIV:  { name: "Khanate of Khiva", color: "#a04f70", aliases: ["히바 칸국", "Khiva", "Khwarazm"] },
    KHAL:  { name: "Khalkha Mongols", color: "#7a9a3f", aliases: ["할하 몽골", "Mongolia", "the Khalkha"] },
    DZUN:  { name: "Dzungar Khanate", color: "#4f6ab8", aliases: ["준가르 칸국", "Dzungars", "the Oirats"] },
    TIBE:  { name: "Ganden Phodrang", color: "#d0a040", aliases: ["간덴 포드랑", "Tibet", "the Dalai Lama's government"] },
    CRIM:  { name: "Crimean Khanate", color: "#5aa06a", aliases: ["크림 칸국", "Crimea", "the Girays"] },
    // — Arabia and the Indian Ocean rim —
    OMAN:  { name: "Imamate of Oman", color: "#b85a2e", aliases: ["오만 이맘국", "Oman", "the Ya'rubids"] },
    YEME:  { name: "Qasimid Yemen", color: "#8f6a2e", aliases: ["카심 왕조 예멘", "Yemen", "the Zaydi Imamate"] },
    KAND:  { name: "Kingdom of Kandy", color: "#7a5a30", aliases: ["캔디 왕국", "Kandy", "Ceylon's interior"] },
    // — Mainland Southeast Asia —
    TOUN:  { name: "Toungoo Burma", color: "#c04f4f", aliases: ["타웅우 버마", "Burma", "Ava"] },
    DAIV:  { name: "Dai Viet", color: "#3f7ab8", aliases: ["다이비엣", "Vietnam", "Trinh and Nguyen lords"] },
    LANX:  { name: "Lan Xang", color: "#9a8f2e", aliases: ["란상", "Laos"] },
    CAMB:  { name: "Kingdom of Cambodia", color: "#6a9a4f", aliases: ["캄보디아 왕국", "Cambodia", "Oudong"] },
    // — African states beyond the coasts —
    FUNJ:  { name: "Funj Sultanate", color: "#4f8f6a", aliases: ["푼즈 술탄국", "Sennar", "the Funj"] },
    BORN:  { name: "Kanem-Bornu", color: "#6f5a9a", aliases: ["카넴보르누", "Bornu"] },
    AJUR:  { name: "Ajuran Sultanate", color: "#3a6a8f", aliases: ["아주란 술탄국", "Ajuran", "the Somali coast"] },
    MUTA:  { name: "Kingdom of Mutapa", color: "#8f7a3f", aliases: ["무타파 왕국", "Mutapa", "Monomotapa"] },
    // — 면 전용 소유주의 로스터 승격 (2026-08-18 번역 진단) —
    //   위 faceOwners 값으로만 살던 이탈리아·스위스·아일랜드 소국들. 로스터 항목이
    //   없으면 별칭을 실을 자리가 없어 화면에 영어로 뜨거나 per-PC AI 팩이 이름을
    //   지어낸다. 색은 각 클론의 절차색 폴백이 이미 그리던 값(data/palette-history.json
    //   실측)을 그대로 핀 — 이 배치는 번역 수리지 재색이 아니고, 핀으로 per-PC 색
    //   불안정(wwii-1939/Lithuania 병)도 함께 죽는다. 별칭은 한글 하나만: 별칭은
    //   면 매칭 인덱스의 키이기도 해서(buildFaceNameIndex), 영어 별칭을 얹으면
    //   rung-3 면을 훔칠 수 있다. countryAssignments 없음(빈칸 원칙 — 영토는 면이 준다).
    GENO:  { name: "Republic of Genoa", color: "#66bf40", aliases: ["제노바 공화국"] },
    LUCC:  { name: "Republic of Lucca", color: "#66bf40", aliases: ["루카 공화국"] },
    MODE:  { name: "Duchy of Modena", color: "#66bf40", aliases: ["모데나 공국"] },
    PARM:  { name: "Duchy of Parma", color: "#66bf40", aliases: ["파르마 공국"] },
    SAVO:  { name: "Duchy of Savoy", color: "#bf8e40", aliases: ["사보이아 공국"] },
    GUAS:  { name: "Duchy of Guastalla", color: "#66bf40", aliases: ["과스탈라 공국"] },
    MASS:  { name: "Duchy of Massa and Carrara", color: "#66bf40", aliases: ["마사카라라 공국"] },
    MIRA:  { name: "Duchy of Mirandola", color: "#66bf40", aliases: ["미란돌라 공국"] },
    // 만토바는 위 승격 때 빠졌던 마지막 하나 — 면이 만토바 주를 통째로 덮어
    // 재소유(reowned) 경로로만 살았고, 그 경로가 소유 테이블에 안 실리던 버그로
    // 무토지 오판까지 겹쳤다(2026-08-25 진단). 색은 팔레트 매니페스트 실측 핀.
    MANT:  { name: "Duchy of Mantua", color: "#66bf40", aliases: ["만토바 공국"] },
    TUSC:  { name: "Grand Duchy of Tuscany", color: "#66bf40", aliases: ["토스카나 대공국"] },
    NEUC:  { name: "Principality of Neuchâtel", color: "#84bf40", aliases: ["뇌샤텔 공국"] },
    VALA:  { name: "Republic of Valais", color: "#84bf40", aliases: ["발레 공화국"] },
    SWIC:  { name: "Swiss Confederacy", color: "#84bf40", aliases: ["스위스 연방"] },
    TLGS:  { name: "Three Leagues", color: "#84bf40", aliases: ["삼동맹"] },
    IRCC:  { name: "Irish Catholic Confederation", color: "#bfac40", aliases: ["아일랜드 가톨릭 연맹"] },
  },

  countryAssignments: {
    // — Spanish Empire: both viceroyalties, the Caribbean core, the Philippines.
    ESP: [
      "ESP", "MEX", "GTM", "HND", "SLV", "NIC", "CRI", "PAN", "BLZ",
      "CUB", "DOM", "HTI", "PRI", "TTO",
      "COL", "VEN", "ECU", "PER", "BOL", "PRY",
      "PHL",
    ],
    // — Portuguese Empire: the restored crown, African posts, coastal Brazil below.
    POR: ["PRT", "AGO", "MOZ", "GNB", "CPV", "STP"],
    // — Commonwealth of England: the home isles, the young Atlantic colonies below,
    //   the sugar Caribbean, and brand-new Suriname (Willoughby's colony, 1650).
    GBR: ["GBR", "IRL", "BRB", "ATG", "KNA", "BHS", "SUR"],
    // — Kingdom of France (New France & Acadia below).
    FRA: ["FRA", "GUF", "MTQ", "GLP"],
    // — Dutch Republic: the Hudson & Delaware trade, Guiana forts, the East Indies,
    //   Dutch Formosa.
    NLD: ["NLD", "GUY", "IDN", "TWN"],
    // — Swedish Empire (incl. Baltic dominions; New Sweden on the Delaware below).
    SWE: ["SWE", "FIN", "EST", "LVA"],
    // — The Old World —
    HRE:   ["DEU", "CHE", "LUX", "LIE"],
    HABS:  ["AUT", "CZE", "SVK", "SVN", "HRV"],
    POL_L: ["POL", "LTU", "BLR", "UKR"],
    RUS:   ["RUS"],
    DEN_N: ["DNK", "NOR", "ISL", "GRL", "FRO"],
    OTTO: [
      "TUR", "GRC", "BGR", "SRB", "MKD", "ALB", "BIH", "XKO", "MNE", "HUN",
      "ROU", "MDA", "EGY", "SYR", "LBN", "ISR", "PSE", "JOR", "IRQ",
      "LBY", "TUN", "DZA",
    ],
    SAFA:  ["IRN", "AZE", "ARM", "GEO", "AFG"],
    MUGH:  ["IND", "PAK", "BGD"],
    QING:  ["CHN"],
    JOSE:  ["KOR", "PRK"],
    TOKU:  ["JPN"],
    SIAM:  ["THA"],
    MOR:   ["MAR", "ESH", "MLI"], // incl. the Pashalik of Timbuktu
    ETHIO: ["ETH", "ERI"],
    // — The steppe and Central Asia —
    KAZH:  ["KAZ"],
    BUKH:  ["UZB", "TJK"],
    KHIV:  ["TKM"],
    KHAL:  ["MNG"], // the Khalkha submit to the Qing only in 1691
    // — Arabia, Ceylon, mainland Southeast Asia —
    OMAN:  ["OMN"],
    YEME:  ["YEM"],
    KAND:  ["LKA"],
    TOUN:  ["MMR"],
    DAIV:  ["VNM"],
    LANX:  ["LAO"],
    CAMB:  ["KHM"],
    // — Africa beyond the coastal forts —
    FUNJ:  ["SDN"],
    BORN:  ["TCD"],
    AJUR:  ["SOM"],
    MUTA:  ["ZWE"],
    // Deliberately unclaimed: the North American interior and plains, the Amazon,
    // Patagonia, Australia/Oceania, inner Africa's stateless zones and Arabia
    // Deserta; unclaimed land is native or unexplored, not empty.
  },

  regionAssignments: {
    // — English America, 1650: New England, the Chesapeake, Newfoundland.
    "USA.22_1": "GBR",  // Massachusetts (incl. Plymouth)
    "USA.7_1": "GBR",   // Connecticut
    "USA.40_1": "GBR",  // Rhode Island
    "USA.30_1": "GBR",  // New Hampshire
    "USA.20_1": "GBR",  // Maine (fishing settlements)
    "USA.47_1": "GBR",  // Virginia
    "USA.21_1": "GBR",  // Maryland
    "CAN.5_1": "GBR",   // Newfoundland

    // — New Netherland on the Hudson; New Sweden on the Delaware.
    "USA.33_1": "NLD",  // New York (New Amsterdam)
    "USA.31_1": "NLD",  // New Jersey
    "USA.8_1": "SWE",   // Delaware (Fort Christina)

    // — New France and Acadia.
    "CAN.11_1": "FRA",  // Québec (Canada)
    "CAN.7_1": "FRA",   // Nova Scotia (Acadia)
    "CAN.4_1": "FRA",   // New Brunswick (Acadia)
    "CAN.10_1": "FRA",  // Prince Edward Island (Île Saint-Jean)

    // — Spanish North America.
    "USA.10_1": "ESP",  // Florida (San Agustín)
    "USA.32_1": "ESP",  // New Mexico (Santa Fe, 1598)

    // — Native North America (the map can only show the largest nations).
    "USA.39_1": "IROQ", // Pennsylvania (Susquehanna country under Iroquois pressure)
    "USA.36_1": "IROQ", // Ohio (emptied and claimed in the Beaver Wars, 1650)
    "CAN.9_1": "IROQ",  // Ontario (Huronia destroyed 1649 — Iroquois conquest)
    "USA.43_1": "CHER", // Tennessee
    "USA.18_1": "CHER", // Kentucky (Cherokee hunting grounds)
    "USA.11_1": "CREE_M", // Georgia
    "USA.1_1": "CREE_M",  // Alabama
    "USA.25_1": "CHOC", // Mississippi
    "USA.24_1": "SIOU", // Minnesota
    "USA.35_1": "SIOU", // North Dakota
    "USA.42_1": "SIOU", // South Dakota
    "USA.44_1": "APAC", // Texas
    "USA.37_1": "APAC", // Oklahoma
    "USA.3_1": "NAVA",  // Arizona
    "USA.45_1": "NAVA", // Utah
    "GTM.12_1": "MAYA", // Petén — the Itza kingdom (falls only in 1697)

    // — Brazil: Portuguese coast vs the Dutch northeast (the WIC holds Recife
    //   until 1654); the interior is unexplored/native.
    "BRA.2_1": "POR",  "BRA.5_1": "POR",  "BRA.6_1": "POR",  "BRA.8_1": "POR",
    "BRA.10_1": "POR", "BRA.14_1": "POR", "BRA.19_1": "POR", "BRA.25_1": "POR",
    "BRA.26_1": "POR",
    "BRA.15_1": "NLD", "BRA.17_1": "NLD", "BRA.20_1": "NLD",

    // — Spanish South America beyond the whole-country grants: the Río de la
    //   Plata and Chile; the Pampa and Patagonia stay native.
    "ARG.1_1": "ESP",  "ARG.2_1": "ESP",  "ARG.5_1": "ESP",  "ARG.6_1": "ESP",
    "ARG.7_1": "ESP",  "ARG.8_1": "ESP",  "ARG.10_1": "ESP", "ARG.12_1": "ESP",
    "ARG.13_1": "ESP", "ARG.14_1": "ESP", "ARG.17_1": "ESP", "ARG.18_1": "ESP",
    "ARG.19_1": "ESP", "ARG.21_1": "ESP", "ARG.22_1": "ESP", "ARG.24_1": "ESP",
    "CHL.4_1": "ESP",  "CHL.15_1": "ESP", "CHL.2_1": "ESP",  "CHL.5_1": "ESP",
    "CHL.7_1": "ESP",  "CHL.16_1": "ESP", "CHL.14_1": "ESP", "CHL.8_1": "ESP",
    "CHL.12_1": "ESP", "CHL.13_1": "ESP",

    // — Wallmapu: the Mapuche south of the Biobío, unconquered.
    "CHL.6_1": "MAPU", "CHL.3_1": "MAPU", "CHL.10_1": "MAPU", "CHL.9_1": "MAPU",

    // — Inner Asia carved out of the Qing grant: the Dzungars hold the Tarim-Ili,
    //   the Dalai Lama's new government holds Tibet and Qinghai (since 1642).
    "CHN.28_1": "DZUN",
    "CHN.29_1": "TIBE", "CHN.21_1": "TIBE",
    // — The Crimean Khanate (Ottoman client, raiding the Commonwealth yearly).
    "UKR.4_1": "CRIM",
    // — Bornu proper on the Nigerian side of Lake Chad.
    "NGA.8_1": "BORN",
  },

  // Era cities: [name, modern-seed-name | [lng,lat], tier, population].
  // tier 4 = great-power capital ★, 3 = major city ◆, 2 = city, 1 = town.
  // Cape Town is deliberately absent — the VOC station is founded in 1652.
  cities: [
    // — English, Dutch, French and Swedish North America —
    ["Boston", "Boston", 2, 3000],
    ["Plymouth", [-70.67, 41.96], 1, 1000],
    ["New Amsterdam", "New York", 2, 1000], // capital of New Netherland
    ["Fort Orange", [-73.75, 42.65], 1, 500], // Albany — the fur trade post
    ["Jamestown", [-76.78, 37.21], 1, 1000],
    ["St. Mary's City", [-76.43, 38.19], 1, 500],
    ["Fort Christina", [-75.55, 39.74], 1, 400], // capital of New Sweden
    ["Québec", "Quebec City", 2, 1500], // capital of New France
    ["Ville-Marie", "Montréal", 1, 300], // the new mission at Montréal
    ["St. Augustine", "St. Augustine", 1, 1500],
    ["Santa Fe", [-105.94, 35.69], 1, 1500],
    // — Native nations —
    ["Onondaga", [-76.15, 43.05], 2, 2000], // Haudenosaunee council fire
    ["Chota", [-84.13, 35.56], 1, 1000], // Cherokee mother town
    // — New Spain and the Caribbean —
    ["Mexico City", "Mexico City", 4, 100000], // capital of New Spain
    ["Puebla", "Puebla", 2, 30000],
    ["Veracruz", "Veracruz", 2, 8000],
    ["Acapulco", "Acapulco de Juárez", 1, 4000], // the Manila galleon port
    ["Mérida", "Mérida", 1, 6000],
    ["Santiago de Guatemala", "Antigua Guatemala", 2, 25000],
    ["Havana", "Havana", 2, 30000],
    ["Santo Domingo", "Santo Domingo", 2, 15000],
    ["San Juan", "San Juan", 1, 5000],
    ["Cartagena", "Cartagena", 2, 20000],
    ["Portobelo", [-79.65, 9.55], 1, 3000], // the silver fleet's Atlantic port
    ["Panamá", "Panama City", 2, 8000],
    ["Bridgetown", "Bridgetown", 2, 10000], // Barbados sugar boom
    // — Spanish South America —
    ["Bogotá", "Bogotá", 2, 15000],
    ["Quito", "Quito", 2, 25000],
    ["Lima", "Lima", 4, 60000], // capital of the Viceroyalty of Peru
    ["Cusco", "Cusco", 2, 20000],
    ["Potosí", "Potosí", 3, 150000], // the silver mountain — biggest city in the Americas
    ["La Paz", "La Paz", 1, 5000],
    ["Asunción", "Asunción", 1, 4000],
    ["Buenos Aires", "Buenos Aires", 1, 4000],
    ["Santiago", "Santiago", 1, 5000],
    // — Portuguese and Dutch Brazil —
    ["Salvador", "Salvador", 3, 25000], // capital of Portuguese Brazil
    ["Mauritsstad", "Recife", 2, 15000], // capital of Dutch Brazil
    ["Rio de Janeiro", "Rio de Janeiro", 2, 8000],
    ["São Paulo", "São Paulo", 1, 2000],
    ["Belém", "Belém", 1, 2000],
    // — Europe: the metropoles —
    ["London", "London", 4, 400000],
    ["Paris", "Paris", 4, 450000],
    ["Madrid", "Madrid", 3, 130000],
    ["Seville", [-5.99, 37.39], 3, 120000], // the Indies trade monopoly
    ["Lisbon", "Lisbon", 3, 150000],
    ["Amsterdam", "Amsterdam", 4, 175000], // the warehouse of the world
    ["The Hague", "The Hague", 2, 20000],
    ["Rome", "Rome", 2, 120000],
    ["Vienna", "Vienna", 2, 60000],
    ["Berlin", "Berlin", 1, 12000], // small after the Thirty Years' War
    ["Stockholm", "Stockholm", 2, 35000],
    ["Copenhagen", "Copenhagen", 2, 30000],
    ["Warsaw", "Warsaw", 2, 20000],
    ["Moscow", "Moscow", 3, 150000],
    ["Constantinople", "Istanbul", 3, 700000], // the Ottoman capital
    // — Africa —
    ["Luanda", "Luanda", 2, 6000], // just retaken from the Dutch, 1648
    ["Elmina", [-1.35, 5.08], 2, 4000], // Dutch Gold Coast castle
    ["Fez", "Fès", 2, 80000],
    ["Algiers", "Algiers", 2, 60000],
    ["Tunis", "Tunis", 2, 70000],
    ["Cairo", "Cairo", 3, 300000],
    ["Mombasa", "Mombasa", 1, 6000],
    ["Mozambique Island", [40.74, -15.03], 1, 5000],
    // — Asia: the factories and the empires —
    ["Goa", "Panaji", 3, 60000], // capital of the Portuguese Estado da Índia
    ["Batavia", "Jakarta", 3, 30000], // VOC headquarters
    ["Manila", "Manila", 3, 40000],
    ["Macau", "Macau", 2, 20000],
    ["Malacca", "Melaka", 2, 10000], // Dutch since 1641
    ["Colombo", "Colombo", 1, 8000],
    ["Fort St. George", "Chennai", 1, 5000], // Madras, founded 1639
    ["Surat", [72.83, 21.17], 3, 100000], // the Mughal port
    ["Nagasaki", "Nagasaki", 2, 30000], // Dejima — Japan's one window
    ["Edo", "Tokyo", 4, 400000], // seat of the Tokugawa shoguns
    ["Kyoto", [135.77, 35.01], 3, 350000],
    ["Osaka", "Ōsaka", 3, 300000],
    ["Beijing", "Beijing", 4, 600000], // the new Qing capital
    ["Nanjing", "Nanjing", 3, 300000],
    ["Canton", "Guangzhou", 3, 200000],
    ["Shahjahanabad", "Delhi", 4, 400000], // Shah Jahan's new Mughal capital
    ["Agra", [78.01, 27.18], 3, 500000],
    ["Isfahan", [51.67, 32.65], 4, 400000], // Safavid capital — "half the world"
    ["Ayutthaya", [100.57, 14.35], 3, 150000], // Siamese capital
    ["Thang Long", "Hanoi", 2, 60000],
    // — The khanates, Arabia and the African states —
    ["Turkestan", [68.25, 43.3], 2, 20000], // seat of the Kazakh khans
    ["Bukhara", "Bukhara", 3, 60000],
    ["Samarkand", "Samarkand", 2, 50000],
    ["Khiva", [60.36, 41.38], 2, 20000],
    ["Bakhchysarai", [33.86, 44.75], 2, 20000], // Crimean capital
    ["Urga", [106.91, 47.92], 1, 5000], // the Khalkha monastic camp
    ["Lhasa", [91.18, 29.65], 2, 30000],
    ["Ava", [95.98, 21.86], 2, 30000], // Burmese capital
    ["Vientiane", [102.63, 17.97], 1, 15000],
    ["Oudong", [104.74, 11.81], 1, 10000], // Cambodian capital
    ["Kandy", [80.64, 7.29], 1, 15000],
    ["Muscat", "Muscat", 2, 15000],
    ["Sana'a", [44.21, 15.35], 2, 30000],
    ["Sennar", [33.63, 13.55], 2, 20000], // Funj capital
    ["Timbuktu", "Timbuktu", 2, 25000],
    ["Ngazargamu", [12.36, 13.09], 2, 20000], // Bornu capital
    ["Mogadishu", "Mogadishu", 2, 20000],
  ],

  simulationRules:
    "It is 1650, the height of the first colonial age. Warfare is pike-and-shot: matchlock " +
    "muskets, pikes, siege cannon and ships of the line; armies are small and oceans are " +
    "slow — a crossing takes 6-10 weeks, and colonial ventures live or die by supply " +
    "fleets. NO industrial technology. Spain's two viceroyalties (New Spain and Peru) ship " +
    "silver convoys that everyone else's privateers hunt. Portugal, independent of Spain " +
    "again since 1640, is at war with the Dutch West India Company for the Brazilian " +
    "northeast (Recife falls to Portugal in 1654). England is a REPUBLIC — Charles I was " +
    "beheaded in 1649 and Cromwell's Commonwealth is subduing Ireland and will pass the " +
    "Navigation Act (1651), lighting the fuse of the Anglo-Dutch wars. New France is a fur " +
    "empire of a few thousand colonists allied to the Huron and Algonquin; New Netherland " +
    "and tiny New Sweden trade on the Hudson and Delaware. NATIVE NATIONS ARE REAL POWERS: " +
    "the Haudenosaunee (Iroquois) are mid-Beaver-Wars — they destroyed Huronia in 1649 and " +
    "dominate the eastern woodlands with Dutch muskets; the Mapuche have beaten Spain at " +
    "the Biobio frontier for a century; the Itza Maya of Peten remain unconquered until " +
    "1697; the Sioux, Apache, Navajo, Cherokee, Muscogee and Choctaw control the interior. " +
    "Horses are only now spreading north from New Mexico. Unclaimed regions are native " +
    "homelands or unexplored country — entering them means diplomacy or war with peoples " +
    "who know the ground. Disease is the colonizers' cruelest weapon and should shadow " +
    "every contact. In Europe the Thirty Years' War just ended (Westphalia 1648), the " +
    "Khmelnytsky uprising tears at Poland-Lithuania, and the Fronde paralyzes France. The " +
    "Qing have taken Beijing (1644) and are hunting the Ming remnant; Japan is closed " +
    "(sakoku); the VOC rules the spice trade from Batavia and Dutch Formosa." +
    " Historical trajectories the player may bend: the Navigation Act (1651) and three Anglo-Dutch wars, the Stuart Restoration (1660), Qing consolidation and the Revolt of the Three Feudatories, King Philip's War (1675), and the slow ruin of Spain's silver economy. MAP APPROXIMATIONS: colonial color is CLAIM, not control — beyond forts and coasts the land belongs to the nations who live on it; Spanish 'territory' in North America is a mission frontier, and European 'colonies' are towns with charters. The chartered companies (VOC, WIC, EIC) act as states: they wage war, mint coin and sign treaties under their own flags.",

  startingTimelineText:
    "The year 1650. In London a king's severed head has made England a republic, and " +
    "Cromwell's Ironsides are in Ireland. In Madrid the silver of Potosi and Zacatecas " +
    "still buys armies, though the treasure fleets sail through seas thick with enemies. " +
    "In Recife the Dutch cling to their Brazilian conquest as Portuguese planters rise " +
    "against them. On the St Lawrence, Quebec mourns the Huron nation, shattered last " +
    "year by Haudenosaunee war parties armed with Dutch muskets — the Beaver Wars have " +
    "made the Five Nations the terror of the woodlands. On Manhattan island, Stuyvesant " +
    "counts furs; on the Delaware, a few hundred Swedes hold Fort Christina; at Santa Fe " +
    "and San Agustin, Spain's frontier priests and soldiers hold the edge of empire. " +
    "South of the Biobio the Mapuche sharpen their lances, unbeaten. Two worlds have met, " +
    "and neither will yield the continent without a fight.",
};

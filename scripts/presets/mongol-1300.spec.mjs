/*! Open Historia — 1300 AD preset spec © 2026 Nicholas Krol, MIT (see src/Editor/LICENSE). */
// Mongol preset — 1300 AD (the Mongol world).
//
// The empire of Genghis Khan spans Eurasia, but two generations on it has
// settled into four khanates — the Yuan Great Khanate, the Golden Horde, the
// Chagatai ulus and the Ilkhanate — bound by lineage and (thin) deference to
// the Great Khan in Khanbaliq. The Russian principalities and Bulgaria pay the
// Horde tribute; Georgia and the Seljuk rump serve the Ilkhan; Goryeo serves
// the Yuan. On the empire's western rim, 1300 Europe fights its own wars —
// and in a Bithynian valley a beg named Osman has just begun raiding.

export default {
  id: "mongol-1300",

  meta: {
    name: "Mongol World — 1300 AD",
    heroTitle: "The Mongol Century",
    heroSubtitle: "Four khanates rule from Korea to the Carpathians, 1300 AD",
    eyebrow: "The Mongol Peace",
    subtitle: "1300 AD",
    accentColor: "#c9a227",
    coverImage: "public/loading_screen_4.jpg",
    description:
      "The year 1300. The heirs of Genghis Khan rule the largest land empire in history — " +
      "the Yuan emperor in Khanbaliq, the Golden Horde on the steppe, the Chagatai in " +
      "Transoxiana, the Ilkhan in Persia — while Russian princes and Balkan tsars pay " +
      "tribute. Beyond the hooves: Mamluk Egypt stands unbeaten, Delhi's sultan conquers " +
      "India, Edward I hammers Scotland, Philip IV squeezes the Templars' France, and an " +
      "obscure Ottoman beg raids the Byzantine frontier. Ride with the Horde or against it.",
  },

  // Player starts as the Yuan Great Khanate. game.country MUST equal the owner code.
  game: { country: "YUAN", startDate: "1300-01-01", gameDate: "1300-01-01" },

  // ── Plan F: 시대 경계 그래프트 — rung-3 단독 하이브리드 (2026-08-15) ──
  // **창 선언이 이 보드의 진짜 결정이다.** 함대 표준창은 유럽
  // [-15,30,50,72](z4 16타일)인데, 몽골 보드의 주제는 그 창의 동쪽 밖에
  // 전부 있다 — 칸발리크·카라코룸·사라이·타브리즈·사마르칸트 어느 것도
  // 유럽창에 들어오지 않는다. 그래서 유라시아창 [-15,10,130,72]을 선언한다:
  // 대서양에서 태평양까지, 사하라·아라비아·인도에서 북극까지. **z4 35타일**
  // (유럽창의 2.2배, 추출기 상한 1024의 3.4%, 전세계창 256의 14%) —
  // 가격이 매겨진 판단이지 추측이 아니다.
  //
  // 원천 선택도 실측으로 갈랐다(클로드 코드 부록: 폴리티 수가 아니라 면
  // 수율로 판단할 것). 같은 창에서 world_1300 → 74면, world_1279 → 75면
  // 으로 사실상 동률이라, 결정은 날짜 충실도로 넘어갔다: **1300을 쓴다**
  // (오스만 베이릭이 1299년에 서고, 원이 최대판도이며, 1279는 21년 이르다).
  // 1279가 유일하게 우세했던 마그레브 분리(Merinides/Abdelouadides)는
  // 이 보드가 이미 국가 단위로 나눠 갖고 있어(MAR→MARI·DZA→ZAYY·TUN→HAFS)
  // 손해가 없다 — 실측: world_1300의 "Morocco"면은 페즈·마라케시만 물고
  // 틀렘센·오랑·알제는 놓는다. 진짜 모로코다.
  //
  // rung-1(OHM 1300 조립)은 아직 없다. probe 83폴리티(1939 기준선의 41%)로
  // 러너 대기 중이며, 도착하면 1200과 똑같이 파일만 갈아끼운다.
  // 전 판정 2026-08-15 포인트 테스트(도시 ∈ 면) 실측 — 추정 없음.
  eraGeometry: {
    date: "1300-01-01",
    window: [-15, 10, 130, 72],
    file: "scripts/ohm/out/rung3-base-1300-01-01-z4-hybrid.geojson",
    excludeFaces: [
      "Trebizond", // 실측: 트라브존·시노프 둘 다 out — 자리를 잃은 미세면(보드에 트레비존드 폴리티도 없다)
      "Siberians", "Samis", "Bantou", "West African cereal farmers", "Islamic city-states", // 무국가·로스터 밖 — 미배정 설계
      "minor Hindu kingdoms", "minor Hindu and Buddhist kingdoms", "Luva", "Aceh", "Hainan", // 집합 라벨·로스터 밖
      "Guanches", "Muscat", "Hadramaut", "Alwa", "Shoa", "Benin", "Bornu-Kanem", "Kashmir and Ladakh", "Orissa", // 로스터 밖
      "Sinhalese kingdom", // LKA는 이 보드 로스터에 없다
      "Pagan", // 1차 빌드 실측: 이 면이 버마 9지역 + 인도 북동부(마니푸르·미조람·나갈랜드 등)까지 문다. 1287년 원의 침입으로 파간은 무너졌고 1300 버마는 먀인사잉 삼형제의 분열기다 — 수코타이에 통째로 주느니 **미배정**(보드 철학: 지배받지 않은 땅)
      "Srivijaya Empire", // 1300엔 이미 껍데기 — 보드는 IDN을 MAJA(마자파힛, 1293 건국)에 준다
      "Corsica", "Sardinia", // 제노바·아라곤 분쟁지, 로스터 밖 — 기반선 유지
    ],
    faceOwners: {
      // ── 네 울루스와 그 이웃 (전부 포인트 테스트) ──
      "Great Khanate": "YUAN", // 베이징·항저우·카라코룸 IN / 라싸·카슈가르 out — 원 본체
      "Khanate of the Golden Horde": "GHOR", // 사라이·아스트라한·부쿠레슈티 IN / 키예프·모스크바 out — 스텝 본체
      "Chagatai Khanate": "CHAG", // 사마르칸트·부하라·카슈가르·카불·알마티 IN
      "Ilkhanate": "ILKH", // 타브리즈·바그다드·이스파한·헤라트 IN / 코니아 out
      "Seljuk Caliphate": "ILKH", // 코니아·앙카라·시바스 IN — 1300 룸 술탄국은 일한국 봉신(스펙 주석 그대로)
      "Tibet": "YUAN", // 라싸·시가체 IN — 1300 티베트는 사캬-원 체제 아래(보드에 티베트 폴리티 없음)
      // ── 루스 삼면 → 단일 RUSP (보드 설계) ──
      "Novgorod": "RUSP", "Ryazan": "RUSP", "Grand Duchy of Moscow": "RUSP",
      // ── 별칭이 안 닿는 것들 ──
      "English territory": "ENG_K", // 런던·더블린·카디프 IN + **보르도 IN**(에드워드 1세의 가스코뉴) / 에든버러·루앙 out
      "Britany": "FRA_K", // 브르타뉴 공국 — 로스터 밖, 프랑스 왕관 근사
      "Raška": "SERB", // 라스·포드고리차 IN / 스코페·베오그라드 out — 밀루틴의 세르비아(사라예보 IN은 울타리로)
      "Bulgar Khanate": "BULG", // **또 다뉴브다**: 터르노보·소피아 IN / 카잔·볼가르 out — 1444에서 배운 그대로 이름이 아니라 기하
      "Morocco": "MARI", // 페즈·마라케시 IN / 틀렘센·오랑·알제 out — 진짜 마린조
      "Mamluke Sultanate": "MAML", // 카이로·다마스쿠스·예루살렘·**메카** IN — 맘루크의 헤자즈 종주권까지 정합
      "Hafsid Caliphate": "HAFS",
      "Sultanate of Delhi": "DELH", // 델리·라호르·카라치 IN / 데바기리 out(야다바는 별도 폴리티)
      "Pandya state": "PAND", "Chola state": "PAND", // 촐라는 1279년에 끝났다 — 그 땅은 판디아의 것
      "Champa": "DAIV", // 참파는 로스터 밖 — 보드의 VNM→DAIV 기반선과 같은 색
      "Sicily": "SICI", // **2폴리곤 실측**: 섬(팔레르모 IN)과 본토 덩어리(살레르노·코센차·포텐차 IN)를 함께 쥔 **베스프리 이전의 옛 레뇨**다. 1282년 이후 섬은 아라곤(SICI)·본토는 앙주(NAPL)로 갈렸으니 섬만 주고 본토는 울타리로
      "Ethiopia": "ETHIO", "Makkura": "MAKU", "Teutonic Knights": "TEUT", "Navarre": "NAV",
      "Cyprus": "CYPR", "Aragón": "ARAG",
      "Shogun Japan (Kamakura)": "JAP_K",
    },
    faceKeepOut: {
      // 조야한 대륙 스케일 면이 보드의 분리 왕관을 밀지 못하게 — 전부 실측.
      "Great Khanate": ["KOR", "PRK", "VNM", "MMR"], // 서울 IN — 고려는 원의 부마국이지만 보드가 GORY로 따로 그린다; 동남아 조공국도 마찬가지
      "Chagatai Khanate": ["IRN", "PAK"], // 서쪽으로 호라산·인더스까지 번지는 조야면 — 그쪽은 ILKH·DELH의 것
      "Khanate of the Golden Horde": ["POL", "LTU", "BLR", "HUN"], // 서쪽 22°E까지 — 1241년 습격은 정복이 아니다
      "Raška": ["BIH", "HRV"], // 사라예보 IN — 보드는 BIH를 헝가리 왕관에 준다
      "Sultanate of Delhi": ["IND.16", "IND.20", "IND.32"], // 데칸 술탄 원정(1296~)은 약탈이지 지배가 아니다 — 야다바·카카티야·호이살라는 별도 폴리티
      "Mamluke Sultanate": ["TUR"], // 아나톨리아 남단으로 번지는 조각 — 킬리키아 아르메니아(ARM_C)와 룸의 것
      // ── 1차 빌드(재배정 519 전량 검독)가 잡아낸 것들 ──
      "Hafsid Caliphate": ["DZA"], // **1444와 같은 병**: 하프스면이 알제리 34지역을 통째로 먹었다(자이얀 왕국이 이 보드엔 폴리티로 있는데도) — DZA는 ZAYY의 것
      "Byzantine Empire": ["MKD", "XKO"], // 비잔티움면이 마케도니아+코소보 84지역을 삼켰다 — 1282년 밀루틴이 스코페를 가져갔고 스펙 주석도 그렇게 적혀 있다
      "Sicily": ["ITA.1", "ITA.2", "ITA.3", "ITA.4", "ITA.5", "ITA.12"], // 옛 레뇨 본토(아브루초·풀리아·바실리카타·칼라브리아·캄파니아·몰리세) — 베스프리 이후 앙주 나폴리의 것
      "Ilkhanate": ["GEO", "ARM", "AFG", "TUR.58", "TUR.1", "TUR.64"], // 트빌리시 IN(조지아는 일한 봉신이나 보드가 GEOR로 그린다) · 아프가니스탄 전역을 차가타이에서 빼앗고 · **킬리키아(메르신·아다나·오스마니예)까지** 물었다(ARM_C도 별도 폴리티). 호라산/TKM은 일한령이 맞아 통과. **키 하나로 병합** — 두 번 선언했다가 뒤 키가 앞 키를 덮어 조지아 3지역이 새는 것을 no-dupe-keys 검사가 잡았다
      "Đại Việt": ["LAO"], // 라오스 6지역 — 란상은 1353년이고 1300 라오는 크메르권이다
      "Holy Roman Empire": ["ITA.6"], // 에밀리아-로마냐 9지역 — 1278년 루돌프가 로마냐를 교황에게 양도했다(1200 보드와 같은 지점, 반대 방향)
      "Ryazan": ["MDA", "UKR", "ROU"], // 랴잔면 bbox가 21°E까지 뻗는 메가면이다 — 몰도바 10지역을 호드에서 빼앗고 갈리치아-볼히니아(보드 GALI) 4지역까지 루스로 칠했다
    },
  },

  // No air power in 1300; "armor" is heavy cavalry, "artillery" is siege engines
  // (trebuchets, and the first Chinese gunpowder siege weapons).
  allowedUnitTypes: ["infantry", "armor", "artillery", "naval", "garrison"],

  relabelOwnedCountries: true,

  polities: {
    // — The Mongol khanates —
    YUAN:  { name: "Yuan Dynasty", color: "#c9a227", aliases: ["Great Khanate", "Yuan China", "Khanbaliq", "the Great Khan"] },
    GHOR:  { name: "Golden Horde", color: "#b06a2e", aliases: ["Ulus of Jochi", "Kipchak Khanate", "the Horde"] },
    CHAG:  { name: "Chagatai Khanate", color: "#8a5aa0", aliases: ["Chagatai ulus", "Transoxiana"] },
    ILKH:  { name: "Ilkhanate", color: "#34869a", aliases: ["Ilkhans", "Hulaguids", "Mongol Persia"] },
    // — Mongol vassals & tributaries —
    RUSP:  { name: "Russian Principalities", color: "#7a94b8", aliases: ["the Rus'", "Vladimir-Suzdal", "Novgorod", "Horde tributaries"] },
    GALI:  { name: "Galicia-Volhynia", color: "#a05a7a", aliases: ["Kingdom of Ruthenia", "Halych-Volhynia"] },
    GORY:  { name: "Goryeo", color: "#5a9a7a", aliases: ["Korea", "Yuan vassal Korea"] },
    GEOR:  { name: "Kingdom of Georgia", color: "#5a9ac0", aliases: ["Georgia", "Sakartvelo"] },
    ARM_C: { name: "Cilician Armenia", color: "#d98cae", aliases: ["Little Armenia", "Armenian Cilicia"] },
    BULG:  { name: "Bulgarian Empire", color: "#8a5a3a", aliases: ["Bulgaria", "Tarnovo"] },
    // — Western Europe —
    FRA_K: { name: "Kingdom of France", color: "#2f5fd0", aliases: ["France", "Philip the Fair's realm"] },
    ENG_K: { name: "Kingdom of England", color: "#b23b3b", aliases: ["England", "Plantagenet England"] },
    SCOT:  { name: "Kingdom of Scotland", color: "#6a6a9a", aliases: ["Scotland", "Alba"] },
    CAST:  { name: "Crown of Castile", color: "#d2a02e", aliases: ["Castile", "Castile-León"] },
    ARAG:  { name: "Crown of Aragon", color: "#d23c3c", aliases: ["Aragon"] },
    NAV:   { name: "Kingdom of Navarre", color: "#5fae5f", aliases: ["Navarra"] },
    PORT:  { name: "Kingdom of Portugal", color: "#2e7d6b", aliases: ["Portugal"] },
    GRAN:  { name: "Emirate of Granada", color: "#2e7d4f", aliases: ["Granada", "Nasrids"] },
    HRE:   { name: "Holy Roman Empire", color: "#caa64a", aliases: ["the Empire", "Habsburg Empire"] },
    PAPAL: { name: "Papal States", color: "#e6d27a", aliases: ["the Church", "Boniface VIII"] },
    NAPL:  { name: "Kingdom of Naples", color: "#c97a2e", aliases: ["Angevin Naples", "Regno"] },
    SICI:  { name: "Kingdom of Trinacria", color: "#c9385d", aliases: ["Sicily", "Aragonese Sicily"] },
    VEN:   { name: "Republic of Venice", color: "#8a7d3f", aliases: ["Venice", "La Serenissima"] },
    HUNG:  { name: "Kingdom of Hungary", color: "#3f9d9d", aliases: ["Hungary"] },
    POL_K: { name: "Kingdom of Poland", color: "#d23ca0", aliases: ["Poland", "Piast Poland"] },
    SERB:  { name: "Kingdom of Serbia", color: "#9a4f9a", aliases: ["Serbia", "Milutin's realm"] },
    LITH:  { name: "Grand Duchy of Lithuania", color: "#6b8e23", aliases: ["Lithuania", "pagan Lithuania"] },
    TEUT:  { name: "Teutonic Order", color: "#aab4c4", aliases: ["the Order", "Ordensstaat", "Livonia"] },
    DEN_K: { name: "Kingdom of Denmark", color: "#b0486a", aliases: ["Denmark"] },
    NOR_K: { name: "Kingdom of Norway", color: "#5b8ec9", aliases: ["Norway"] },
    SWE_K: { name: "Kingdom of Sweden", color: "#4a78c0", aliases: ["Sweden"] },
    // — Eastern Mediterranean —
    BYZ:   { name: "Byzantine Empire", color: "#7d3fb2", aliases: ["Eastern Roman Empire", "Palaiologos Empire"] },
    OTTO:  { name: "Ottoman Beylik", color: "#6b4f2e", aliases: ["Osman's beylik", "Ottomans"] },
    CYPR:  { name: "Kingdom of Cyprus", color: "#e07a7a", aliases: ["Lusignan Cyprus"] },
    MAML:  { name: "Mamluk Sultanate", color: "#3f8f5f", aliases: ["Mamluks", "Egypt and Syria"] },
    // — Africa & Arabia —
    MAKU:  { name: "Makuria", color: "#9a6a3a", aliases: ["Nubia", "Dongola"] },
    ETHIO: { name: "Ethiopian Empire", color: "#4a8f6a", aliases: ["Abyssinia", "Solomonic Ethiopia"] },
    RASU:  { name: "Rasulid Yemen", color: "#6a8a3a", aliases: ["Rasulids", "Yemen"] },
    MALI:  { name: "Mali Empire", color: "#c2a23a", aliases: ["Mali", "the Mansas"] },
    HAFS:  { name: "Hafsid Sultanate", color: "#4f7d2e", aliases: ["Hafsids", "Tunis"] },
    ZAYY:  { name: "Zayyanid Kingdom", color: "#7d6b2e", aliases: ["Zayyanids", "Tlemcen"] },
    MARI:  { name: "Marinid Sultanate", color: "#2e5d8f", aliases: ["Marinids", "Fez"] },
    // — India & Southeast Asia —
    DELH:  { name: "Delhi Sultanate", color: "#3a7d4f", aliases: ["Delhi", "Khalji Sultanate"] },
    PAND:  { name: "Pandya Empire", color: "#c07a4a", aliases: ["Pandyas", "Madurai"] },
    HOYS:  { name: "Hoysala Kingdom", color: "#6f8f3f", aliases: ["Hoysalas"] },
    YADA:  { name: "Yadava Kingdom", color: "#b8604a", aliases: ["Yadavas", "Devagiri"] },
    KAKA:  { name: "Kakatiya Kingdom", color: "#8f5f8f", aliases: ["Kakatiyas", "Warangal"] },
    DAIV:  { name: "Dai Viet", color: "#4a8a5a", aliases: ["Đại Việt", "Tran dynasty"] },
    KHMER: { name: "Khmer Empire", color: "#c97a5a", aliases: ["Angkor", "Cambodia"] },
    SUKH:  { name: "Sukhothai", color: "#d0b060", aliases: ["Ramkhamhaeng's kingdom", "Siam"] },
    MAJA:  { name: "Majapahit", color: "#6a7ab0", aliases: ["Java", "Majapahit Empire"] },
    JAP_K: { name: "Kamakura Japan", color: "#c0507a", aliases: ["Japan", "Kamakura Shogunate"] },
  },

  countryAssignments: {
    // — The khanates —
    YUAN:  ["CHN", "MNG"],
    GHOR:  ["KAZ", "MDA"],                 // + the Pontic-Caspian steppe below
    CHAG:  ["UZB", "TJK", "KGZ", "TKM", "AFG"],
    ILKH:  ["IRN", "IRQ", "AZE", "ARM", "TUR"],  // Anatolia's Seljuk rump serves the Ilkhan; NW carved out below
    // — Vassals —
    GORY:  ["KOR", "PRK"],
    GEOR:  ["GEO"],
    BULG:  ["BGR"],
    // — Europe —
    FRA_K: ["FRA"],
    ENG_K: ["GBR", "IRL"],                 // Scotland carved out below
    CAST:  ["ESP"],                        // Aragon/Navarre/Granada carved out below
    PORT:  ["PRT"],
    HRE:   ["DEU", "AUT", "CHE", "NLD", "BEL", "LUX", "LIE", "CZE", "SVN"],
    HUNG:  ["HUN", "HRV", "SVK", "BIH"],
    POL_K: ["POL"],
    SERB:  ["SRB", "MNE", "XKO", "MKD"],   // Milutin has taken Skopje
    LITH:  ["LTU", "BLR"],
    TEUT:  ["EST", "LVA"],                 // + Prussia (Kaliningrad) below
    DEN_K: ["DNK"],
    NOR_K: ["NOR", "ISL", "FRO", "GRL"],
    SWE_K: ["SWE", "FIN"],
    BYZ:   ["GRC", "ALB"],                 // + the Anatolian northwest below
    CYPR:  ["CYP"],
    // — Mamluks, Africa, Arabia —
    MAML:  ["EGY", "SYR", "LBN", "ISR", "PSE", "JOR"],
    MAKU:  ["SDN"],
    ETHIO: ["ETH", "ERI"],
    RASU:  ["YEM"],
    MALI:  ["MLI", "SEN", "GMB", "GIN"],
    HAFS:  ["TUN"],
    ZAYY:  ["DZA"],
    MARI:  ["MAR"],
    // — India & Southeast Asia —
    DELH:  ["PAK"],                        // + the conquered north-Indian plain below
    DAIV:  ["VNM"],
    KHMER: ["KHM", "LAO"],
    SUKH:  ["THA"],
    MAJA:  ["IDN"],
    JAP_K: ["JPN"],
    // Deliberately unclaimed: Siberia, the far steppe, Arabia Deserta, Wallachia/
    // Moldavia (forming), Burma (Pagan fell to the Mongols in 1287), inner Africa,
    // the Americas.
  },

  regionAssignments: {
    // Scotland — Wars of Independence raging, but not England.
    "GBR.3_1": "SCOT",

    // Iberia: Aragon, Navarre, Granada carved from Castile.
    "ESP.2_1": "ARAG", "ESP.6_1": "ARAG", "ESP.10_1": "ARAG", "ESP.13_1": "ARAG",
    "ESP.9_1": "NAV",
    "ESP.1_1": "GRAN",   // Nasrid Granada (coarse: the emirate is the south of Andalucía)

    // Italy c. 1300: imperial north, papal centre (with Romagna), Angevin south,
    // Aragonese Sicily, Venetian north-east; Sardinia is contested (unclaimed).
    "ITA.9_1": "HRE", "ITA.10_1": "HRE", "ITA.13_1": "HRE", "ITA.16_1": "HRE",
    "ITA.17_1": "HRE", "ITA.19_1": "HRE",
    "ITA.8_1": "PAPAL", "ITA.18_1": "PAPAL", "ITA.11_1": "PAPAL", "ITA.6_1": "PAPAL",
    "ITA.1_1": "NAPL", "ITA.2_1": "NAPL", "ITA.3_1": "NAPL", "ITA.4_1": "NAPL",
    "ITA.5_1": "NAPL", "ITA.12_1": "NAPL",
    "ITA.15_1": "SICI",
    "ITA.20_1": "VEN", "ITA.7_1": "VEN",

    // The Golden Horde's own steppe: lower Volga, Urals fringe, north Caucasus.
    "RUS.1_1": "GHOR",  "RUS.5_1": "GHOR",  "RUS.6_1": "GHOR",  "RUS.7_1": "GHOR",
    "RUS.10_1": "GHOR", "RUS.13_1": "GHOR", "RUS.15_1": "GHOR", "RUS.17_1": "GHOR",
    "RUS.20_1": "GHOR", "RUS.22_1": "GHOR", "RUS.25_1": "GHOR", "RUS.34_1": "GHOR",
    "RUS.41_1": "GHOR", "RUS.42_1": "GHOR", "RUS.48_1": "GHOR", "RUS.53_1": "GHOR",
    "RUS.54_1": "GHOR", "RUS.58_1": "GHOR", "RUS.62_1": "GHOR", "RUS.63_1": "GHOR",
    "RUS.65_1": "GHOR", "RUS.67_1": "GHOR", "RUS.68_1": "GHOR", "RUS.75_1": "GHOR",
    "RUS.77_1": "GHOR", "RUS.79_1": "GHOR",
    // ...and the Black Sea steppe of Ukraine (with Crimea).
    "UKR.4_1": "GHOR",  "UKR.5_1": "GHOR",  "UKR.6_1": "GHOR",  "UKR.8_1": "GHOR",
    "UKR.9_1": "GHOR",  "UKR.13_1": "GHOR", "UKR.15_1": "GHOR", "UKR.16_1": "GHOR",
    "UKR.17_1": "GHOR", "UKR.26_1": "GHOR",

    // The Russian principalities — self-governing tributaries of the Horde.
    "RUS.4_1": "RUSP",  "RUS.8_1": "RUSP",  "RUS.14_1": "RUSP", "RUS.19_1": "RUSP",
    "RUS.23_1": "RUSP", "RUS.26_1": "RUSP", "RUS.31_1": "RUSP", "RUS.32_1": "RUSP",
    "RUS.33_1": "RUSP", "RUS.37_1": "RUSP", "RUS.38_1": "RUSP", "RUS.39_1": "RUSP",
    "RUS.43_1": "RUSP", "RUS.44_1": "RUSP", "RUS.45_1": "RUSP", "RUS.47_1": "RUSP",
    "RUS.49_1": "RUSP", "RUS.52_1": "RUSP", "RUS.55_1": "RUSP", "RUS.57_1": "RUSP",
    "RUS.59_1": "RUSP", "RUS.64_1": "RUSP", "RUS.70_1": "RUSP", "RUS.72_1": "RUSP",
    "RUS.76_1": "RUSP", "RUS.78_1": "RUSP", "RUS.81_1": "RUSP",
    "UKR.1_1": "RUSP",  "UKR.2_1": "RUSP",  "UKR.11_1": "RUSP", "UKR.12_1": "RUSP",
    "UKR.18_1": "RUSP", "UKR.21_1": "RUSP", "UKR.27_1": "RUSP",

    // Galicia-Volhynia, King Lev's Ruthenia between Poland and the Horde.
    "UKR.3_1": "GALI",  "UKR.7_1": "GALI",  "UKR.10_1": "GALI", "UKR.14_1": "GALI",
    "UKR.19_1": "GALI", "UKR.22_1": "GALI", "UKR.24_1": "GALI", "UKR.25_1": "GALI",
    "UKR.23_1": "HUNG", // Transcarpathia

    // Hungary's Transylvania, Banat and Partium; Wallachia/Moldavia stay unclaimed.
    "ROU.1_1": "HUNG",  "ROU.2_1": "HUNG",  "ROU.5_1": "HUNG",  "ROU.6_1": "HUNG",
    "ROU.8_1": "HUNG",  "ROU.13_1": "HUNG", "ROU.14_1": "HUNG", "ROU.16_1": "HUNG",
    "ROU.22_1": "HUNG", "ROU.23_1": "HUNG", "ROU.27_1": "HUNG", "ROU.29_1": "HUNG",
    "ROU.33_1": "HUNG", "ROU.34_1": "HUNG", "ROU.35_1": "HUNG", "ROU.38_1": "HUNG",

    // Teutonic Prussia.
    "RUS.21_1": "TEUT",

    // Anatolia: the Byzantine northwest and Aegean coast; Osman's beylik at
    // Söğüt on the Byzantine frontier; Cilician Armenia under Ilkhan protection.
    "TUR.40_1": "BYZ", "TUR.28_1": "BYZ", "TUR.50_1": "BYZ", "TUR.73_1": "BYZ",
    "TUR.22_1": "BYZ", "TUR.21_1": "BYZ", "TUR.12_1": "BYZ", "TUR.41_1": "BYZ",
    "TUR.79_1": "BYZ",
    "TUR.16_1": "OTTO", "TUR.32_1": "OTTO", "TUR.66_1": "OTTO",
    "TUR.1_1": "ARM_C", "TUR.58_1": "ARM_C", "TUR.64_1": "ARM_C",

    // Delhi under Alauddin Khalji: the northern plain, Gujarat (1299), Bengal.
    "IND.25_1": "DELH", "IND.12_1": "DELH", "IND.28_1": "DELH", "IND.6_1": "DELH",
    "IND.34_1": "DELH", "IND.5_1": "DELH",  "IND.29_1": "DELH", "IND.11_1": "DELH",
    "IND.36_1": "DELH",

    // The Deccan and the south: Yadavas, Kakatiyas, Hoysalas, Pandyas.
    "IND.20_1": "YADA",
    "IND.32_1": "KAKA", "IND.2_1": "KAKA",
    "IND.16_1": "HOYS",
    "IND.31_1": "PAND", "IND.27_1": "PAND",
  },

  // Era cities: [name, modern-seed-name | [lng,lat], tier, population].
  // tier 4 = great-power capital ★, 3 = major city ◆, 2 = city, 1 = town.
  cities: [
    // — The Mongol khanates —
    ["Khanbaliq", "Beijing", 4, 400000], // Dadu, the Yuan capital
    ["Karakorum", [102.85, 47.2], 2, 25000], // the old imperial capital
    ["Shangdu", [116.18, 42.36], 2, 30000], // Xanadu, the summer court
    ["Sarai", [47.98, 46.63], 4, 100000], // Golden Horde capital
    ["Bolghar", [49.06, 54.98], 2, 30000],
    ["Tabriz", [46.29, 38.08], 4, 150000], // Ilkhanate capital
    ["Baghdad", "Baghdad", 2, 100000], // never recovered from 1258
    ["Isfahan", [51.67, 32.65], 2, 60000],
    ["Shiraz", [52.54, 29.61], 2, 50000],
    ["Herat", [62.2, 34.35], 2, 50000],
    ["Samarkand", "Samarkand", 2, 70000],
    ["Bukhara", "Bukhara", 2, 50000],
    ["Urgench", [59.15, 42.33], 3, 90000],
    ["Almaliq", [80.42, 44.16], 2, 20000], // Chagatai seat
    ["Kashgar", "Kashgar", 1, 20000],
    // — Yuan China beyond the capital —
    ["Hangzhou", "Hangzhou", 3, 800000], // Quinsai — Marco Polo's greatest city
    ["Quanzhou", "Quanzhou", 3, 200000], // Zayton, the great port
    ["Guangzhou", "Guangzhou", 2, 150000],
    ["Chengdu", "Chengdu", 2, 100000],
    ["Kaifeng", [114.31, 34.8], 2, 100000],
    // — Tributaries and neighbours —
    ["Kaesong", [126.55, 37.97], 2, 60000], // Goryeo, Yuan son-in-law state
    ["Kyoto", [135.77, 35.01], 3, 150000],
    ["Kamakura", [139.55, 35.32], 3, 80000], // the shogunate that beat the Mongols
    ["Pagan", [94.86, 21.17], 1, 20000], // sacked 1287, in decline
    ["Sukhothai", [99.82, 17.01], 2, 25000],
    ["Angkor", [103.86, 13.44], 3, 300000],
    ["Thang Long", "Hanoi", 2, 60000], // repelled three invasions
    ["Delhi", "Delhi", 4, 200000], // Delhi Sultanate — the Mongols' wall
    ["Multan", "Multan", 2, 40000],
    ["Devagiri", [75.23, 19.94], 2, 50000], // Yadava capital
    ["Madurai", "Madurai", 2, 50000], // Pandya capital
    // — The Mamluks and Islam beyond the Ilkhans —
    ["Cairo", "Cairo", 4, 450000], // Mamluk capital, greatest city of Islam
    ["Damascus", "Damascus", 3, 80000],
    ["Aleppo", "Aleppo", 2, 50000],
    ["Mecca", "Mecca", 2, 15000],
    ["Fez", "Fès", 3, 120000], // Marinid capital
    ["Tunis", "Tunis", 2, 50000], // Hafsid capital
    ["Tlemcen", [-1.31, 34.88], 2, 40000],
    ["Granada", "Granada", 3, 50000], // Nasrid capital
    // — Christendom —
    ["Constantinople", "Istanbul", 3, 60000], // restored but diminished
    ["Paris", "Paris", 4, 200000],
    ["London", "London", 3, 80000],
    ["Venice", "Venice", 3, 100000],
    ["Genoa", "Genoa", 3, 90000],
    ["Florence", "Florence", 3, 90000],
    ["Milan", "Milan", 2, 100000],
    ["Rome", "Rome", 2, 30000],
    ["Naples", "Naples", 2, 50000],
    ["Palermo", [13.36, 38.12], 2, 50000],
    ["Bruges", "Bruges", 2, 40000],
    ["Ghent", [3.72, 51.05], 2, 55000],
    ["Cologne", "Cologne", 2, 40000],
    ["Lübeck", "Lübeck", 2, 20000],
    ["Prague", "Prague", 2, 35000],
    ["Vienna", "Vienna", 2, 25000],
    ["Buda", "Budapest", 2, 15000],
    ["Kraków", "Kraków", 2, 20000],
    ["Seville", [-5.99, 37.39], 2, 40000],
    ["Barcelona", "Barcelona", 2, 40000],
    ["Lisbon", "Lisbon", 2, 30000],
    // — The Rus' under the Horde —
    ["Novgorod", [31.27, 58.52], 3, 30000],
    ["Moscow", "Moscow", 1, 10000], // a minor fort, for now
    ["Tver", "Tver", 2, 15000],
    ["Vladimir", "Vladimir", 2, 15000],
    ["Kiev", "Kyiv", 1, 10000], // devastated, 1240
    // — Africa and the Indian Ocean —
    ["Niani", [-9.6, 11.38], 3, 30000], // Mali imperial capital
    ["Timbuktu", "Timbuktu", 2, 20000],
    ["Kilwa", [39.51, -8.96], 2, 15000],
    ["Mogadishu", "Mogadishu", 2, 20000],
    ["Great Zimbabwe", [30.93, -20.27], 2, 15000],
    // — The Americas —
    ["Cahokia", [-90.06, 38.66], 1, 8000], // in decline
    ["Mayapan", [-89.46, 20.63], 2, 15000],
    ["Azcapotzalco", [-99.18, 19.48], 1, 10000], // Tepanec seat in the Valley of Mexico
    ["Cusco", "Cusco", 2, 10000], // the young Inca seat
    ["Chan Chan", [-79.07, -8.1], 3, 40000], // Chimor at its height
  ],

  simulationRules:
    "It is 1300 AD. The Mongol Empire is the largest land empire in history but is no longer " +
    "one state: the Yuan Great Khan (Temur, Kublai's grandson) reigns in Khanbaliq and is " +
    "acknowledged — nominally — by the Golden Horde on the western steppe, the Chagatai " +
    "khans of Transoxiana and the Ilkhans of Persia, who all war among themselves (Ilkhanate " +
    "vs Horde over the Caucasus, Chagatai vs Yuan over the old homeland). Warfare is feudal " +
    "and steppe-nomadic: massed horse archers, heavy lancers, trebuchets, and the first " +
    "Chinese gunpowder siege weapons; there is NO modern artillery and NO air power. The " +
    "Russian principalities, Bulgaria and Georgia are TRIBUTARIES: self-governing but taxed " +
    "and militarily answerable to their khanate overlords — treat them as vassals who dream " +
    "of independence. The Mamluks of Egypt have beaten every Mongol invasion of Syria (Ain " +
    "Jalut 1260, and they will win again at Marj al-Saffar 1303) — the Ilkhan-Mamluk war is " +
    "the era's defining front, and the Ilkhans court Christian Europe as allies against it. " +
    "Alauddin Khalji's Delhi is conquering India and will soon raid the Deccan kingdoms " +
    "(Yadava, Kakatiya, Hoysala, Pandya). In Anatolia the Seljuk rump serves the Ilkhan while " +
    "coastal beyliks slip loose — among them Osman's tiny Ottoman beylik, founded c. 1299, " +
    "which history will make an empire. In Europe: Edward I fights Scotland, Philip IV of " +
    "France feuds with Pope Boniface VIII, the Sicilian Vespers war splits Naples (Anjou) " +
    "from island Sicily (Aragon), and pagan Lithuania resists the Teutonic Order. Kamakura " +
    "Japan has repelled two Mongol invasions (1274, 1281). Unclaimed regions are tribal or " +
    "stateless lands — steppe, forest, desert — raidable and colonizable but ungoverned." +
    " The Pax Mongolica keeps the continent's roads open — merchants, missionaries, silver and (in time) plague all travel them. Historical trajectories the player may bend: Ghazan's last marches on Syria (beaten 1303), the Ottoman beylik's improbable rise, the Ilkhanate dissolving after 1335, the Yuan losing the Mandate, and the Black Death riding the khans' own roads west in the 1340s. MAP APPROXIMATIONS: steppe borders are grazing ranges, not lines; tributaries (the Russian principalities, Georgia, Bulgaria, Seljuk Anatolia) keep their own color or their overlord's but answer the khan's census and levy either way; Yuan China governs through Chinese institutions the grid cannot show.",

  startingTimelineText:
    "The year 1300. From the Pacific to the Carpathians the descendants of Genghis Khan " +
    "divide the world's greatest empire. In Khanbaliq, Temur Khan holds his grandfather " +
    "Kublai's throne; on the Volga, Toqta rules the Golden Horde and counts the tribute of " +
    "Russian princes; in Tabriz the Ilkhan Ghazan, newly Muslim, plans one more march on " +
    "Mamluk Syria. Cairo's slave-soldier sultans remain the one power the Mongols never " +
    "broke. In Delhi, Alauddin Khalji sharpens his armies for the conquest of the south. In " +
    "Rome, Boniface VIII proclaims the first Jubilee as kings in Paris and London tax their " +
    "clergy for war. On a hillside in Bithynia, a Turkish beg named Osman watches the " +
    "Byzantine frontier and dreams. The world belongs to the horse — for now.",
};

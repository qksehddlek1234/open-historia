/*! Open Historia — Magna Europa 1444 scenario preset © 2026 Nicholas Krol, MIT (see src/Editor/LICENSE). */
// Magna Europa — 11 November 1444, the day after Varna. The crusade is dead
// on the Bulgarian shore: the King of Poland and Hungary is dead in the mud,
// Hunyadi is fleeing, and the twenty-year-old sultan who won has nine years
// and one wall between him and Constantinople. The grand campaign start —
// half a millennium of runway, and nothing whatever is inevitable.
//
// This is the deep-past Tier A preset: modern GADM geometry approximating a
// world of despotates, khanates, sultanates and city-republics. The
// approximation notes carry more weight here than anywhere else — and the
// unassigned world is not empty, it is unconquered.

export default {
  id: "magna-1444",

  meta: {
    name: "Magna Europa — 1444",
    heroTitle: "The Day After Varna",
    heroSubtitle: "The crusade is dead and the old world is next, 11 November 1444",
    eyebrow: "Grand Campaign",
    subtitle: "11 November 1444",
    accentColor: "#5a7d4a",
    coverImage: "public/loading_screen_2.jpg",
    description:
      "Yesterday at Varna a king died and a crusade died with him. Constantinople has nine " +
      "years left; Gutenberg is setting type; the caravels are feeling their way down " +
      "Africa; and in Seoul a king is quietly inventing an alphabet. From Joseon to " +
      "Castile, take any throne and play the five centuries that made the modern world — " +
      "none of it inevitable, all of it in reach.",
  },

  relabelOwnedCountries: false,
  unassignedKeepModernOwner: false,

  // Player starts as Joseon — 세종 26년. The alphabet is drafted and the
  // court is arguing about it; the Ming border is quiet; the age of sail is
  // beginning at the far end of the world.
  game: { country: "JOS", startDate: "1444-11-11", gameDate: "1444-11-11" },

  // ── Plan F: 시대 경계 그래프트 — 중세 하이브리드(rung 1+3) 첫 선언 ──
  // rung 1 = OHM 1444 조립(부분적 — 독일 코어 부재는 데이터 자체의 공백),
  // rung 3 = historical-basemaps world_1400 백필(대륙 스케일 근사, GPL-3.0,
  // 게임 골격용 개인 이용 한정). 1400 파일을 1444에 쓰는 대가로, 1400에만
  // 맞는 면은 전부 제외하고 사유를 적었다. 판정은 모두 2026-08-14 포인트
  // 테스트(도시 ∈ 면) 실측 — 추정 항목 없음.
  eraGeometry: {
    date: "1444-11-11",
    window: [-15, 30, 50, 72],
    file: "scripts/ohm/out/era-borders-1444-11-11-z4-hybrid.geojson",
    excludeFaces: [
      // ── rung 1 제외 ──
      "Reino de Portugal", // 이베리아 융합 잔여면: Lisbon·Madrid·Sevilla IN / Barcelona out, mergedWith 없음 — 포르투갈 이름을 쓴 반도 덩어리
      "Reaume de France", // Paris·Rouen·Bordeaux·Toulouse·Dijon·Nantes 전부 IN — 잉글랜드령 노르망디/가스코뉴(FRA.9/10→ENG), 브르타뉴(→BRI), 부르고뉴(→BUR) 수작업 구조를 왕국 전역 면이 밀어버림
      "Imperium Romanum Orientale", // 콘스탄티노플·미스트라·아테네 out / 테살로니키 IN — 1430년 오스만령을 쓴 라벨 거짓말(잔여면)
      "Kingdom of Cyprus", // 로스터에 키프로스 폴리티 없음(원본 보드 설계) — CYP는 미배정 유지
      "Deasmhumhain", // 실재 데즈먼드(Cork만 IN)지만 게일 아일랜드 폴리티가 로스터에 없음 — 스펙 주석대로 ENG 근사 유지
      "Ríocht Laighean", // 아일랜드 전역 스팬 잔여면(Dublin out·Kilkenny IN) — 동일
      "Αὐθεντία πόλεως Θεοδωροῦς καὶ παραθαλασσίας", // 테오도로 공국(Mangup만) — 로스터에 없음, 크림은 KHA 기반선
      "Andorra", "Couto Misto", "Republica de' Cošpäja", "Respublica Sancti Marini", // 로스터 밖 미소 정체(코스파이아는 1440년 건국이라 실재!) — 기반선 유지
      // ── rung 3 제외 (world_1400 ≠ 1444, 혹은 로스터 밖) ──
      "Byzantine Empire", // 테살로니키 IN(1423년까지의 비잔티움) — 1444에 어긋남; rung-1이 못 주는 건 수작업 GRC 배정이 이미 담당
      "Seljuk Caliphate", // Sivas·Kayseri IN — 1444엔 소멸한 1400 라벨; TUR 모자이크가 더 정밀
      "Beylik of Aydin", // 1425년 오스만 병합 — 동일
      "Poland-Lithuania", // 한 면이 POL과 GDL 두 폴리티를 덮음 — 어느 쪽에 줘도 절반이 거짓
      "Sultanate of Delhi", // 프레임 절단 파편(66.3~67.5E) — 스타일 매칭으로 DEL에 붙을 뻔한 것을 명시 차단; PAK은 TIM 근사 유지
      "Chagatai Khanate", // 프레임 절단 파편 — 1444 이 지대는 우즈베크 스텝, 기반선 유지
      "Siberians", // 스펙 원칙: 시베리아는 미배정(정복되지 않은 땅)
      "Sámi", // 동일 — 북방은 KAL 기반선
      "Guanches", // 카나리아 — 1444 정복 진행중, 보드 스케일 밖
      "Muscat", "Cyprus", // 로스터에 없음
    ],
    faceOwners: {
      // ── rung 1 (OHM 원어 이름 → 보드 코드) ──
      "Deutschordensstaat": "TEU",
      "Ecclesia Osiliensis": "TEU", // 외젤 주교령 — 스펙의 EST/LVA→TEU 근사(리보니아 연맹)와 동일 선택
      "Isle of Man": "ENG", // 스탠리 가문 영주령, 잉글랜드 종주권
      "Nafarroako Erresuma": "NAV",
      "Nogai Horde": "UZK", // Guryev·Orenburg·Sarai IN — 볼가 동안 스텝; 1444 아불하이르 연맹권, 스펙 UZK("Abu'l-Khayr's horde")
      "Regnum Siciliae": "ARA", // 섬만(Palermo IN·Naples out) — 알폰소의 트리나크리아
      "Rìoghachd na h-Alba": "SCO",
      "Sacrum Imperium Romanum": "HRE", // 부분-실재(Cologne·Berlin·Munich IN / Wien·Prag·Zürich·Milano out) — 독일 본체만
      "Великое княжество Московское": "MOS",
      "Великое княжество Рязанское": "MOS", // 스펙 주석: Tver·Ryazan은 MOS에 근사
      "Великое княжество Тверское": "MOS",
      "Новгородская республика": "NOV", // 실재 확인(북방 제국만 — Moscow·Kazan·Perm out)
      "دولتْ علیّه عثمانیّه": "OTT",
      "قزان خانلغی": "KZN",
      "مملكة غرناطة": "GRA",
      // ── rung 3 (별칭 자동 매칭이 안 닿는 것만) ──
      "Sicily": "ARA", // 본토 나폴리면(Taranto·Reggio·Salerno IN) — 1442부터 알폰소의 것; 섬면(rung 1)과 같은 주인
      "Sardinia": "ARA",
      "Corsica": "GEN", // 스펙 FRA.5_1→GEN과 동일
      "Aragón": "ARA", // 악센트가 별칭 정확 일치를 깨서 명시
      "Mamluke Sultanate": "MAM", // 철자 변형(Mamluke/Mamluk)
      "Hafsid Caliphate": "HAF",
      "Bulgar Khanate": "OTT", // 볼가가 아니라 다뉴브 불가리아다 — 1차 빌드 실측(Pleven·Razgrad가 KZN이 됐던 사고); 1396부터 오스만 직할
      "Blue Horde": "HOR", // 서익(Sarai·Saratov·Rostov IN) → 대호드
      "White Horde": "UZK", // 동익(Aktobe·Uralsk IN, 우랄 이동) → 우즈베크 칸국
    },
    faceKeepOut: {
      // 조야한 1400 집합체가 보드의 분리 왕관을 밀지 못하게 치는 울타리.
      // 전부 실측 — 1차 빌드(2026-08-14) 재배정 로스터를 전량 읽고 지역
      // 이름까지 확인해 친 것들이다. 옳았던 월권(보이보디나·자카르파탸·멜리야
      // ·몰리세→나폴리)은 울타리를 치지 않고 살렸다.
      "Holy Roman Empire": ["FRA", "AUT", "CZE", "CHE", "LIE", "ITA", "SVN", "POL", "HRV", "SVK", "HUN", "SMR", "BEL", "NLD", "LUX"], // Wien·Prag·Zürich·Milano·Ljubljana·Wrocław 전부 crude 폴리곤 안 — de jure 제국이 분리 왕관들을 덮는다; 1차 빌드 실측 추가: Zagorje(HRV.8)·SVK 조각·서헝가리 조각·San Marino 9지역·부르고뉴 저지대(Bruxelles·Zuid-Holland까지 HRE가 됐다)
      "Sacrum Imperium Romanum": ["BEL", "NLD", "LUX"], // rung-1 제국면도 서쪽 불룩면이 위트레흐트·헬데를란트를 문다 — 1444 부르고뉴 복합국(스펙 BUR)은 통짜로 지킨다
      "Kingdom of Hungary": ["HRV", "ROU", "UKR", "CZE", "BIH"], // Split IN(달마티아는 1409~20부터 베네치아) · 1차 빌드 실측: Suceava·Neamț(몰다비아 수도권!)를 물고 갈리치아(1349부터 폴란드령)에 조각을 흘림 · 모라비아 조각 · 2차 실측: Republika Srpska 호(바냐루카~동보스니아)를 과반 삼킴(1444 트브르트코 2세는 헝가리 종주권 아래 보스니아 통치 — 사바 변경만이 아니다) — Vojvodina 6지역·Burgenland은 옳아서 SRB·AUT는 안 친다; Zakarpattia는 수작업 배정으로 회수
      "Teutonic Knights": ["LTU"], // 1400 기사단국은 1422년 할양 전 사모기티아 포함 — 메멜은 rung-1 Deutschordensstaat가 담당
      "Timurid Empire": ["IRQ", "AZE", "ARM", "GEO", "TUR", "SYR", "SAU", "KWT", "QAT"], // 티무르 1400 최대판도가 동아나톨리아(KAR 10·AKK 5지역)·시리아(맘루크)·동아라비아까지 물었다(1차 빌드 실측 19지역+) — 1444엔 양 왕조와 맘루크의 것; 트란스옥시아나 쪽(UZB·KAZ 절단)은 실제 국경이라 남긴다
      "Ottoman Empire": ["TUR"], // TUR는 1444 수작업 모자이크 완비(OTT/KRM/TRE/AKK/KAR/MAM/GEO) — 1400 조야면은 단색으로 밀고 콘스탄티노플을 9년 일찍 술탄에게 줄 위험; 발칸(BGR·MKD·SRB-Niš·Pirot)은 그대로 작동
      "Bulgar Khanate": ["SRB"], // 다뉴브 불가리아면이 티목 유역(Borski·Braničevski)까지 뻗는다 — 1444.8 세게드 강화로 전제공국에 반환된 땅
      "Bosnia": ["SRB", "XKO", "ALB", "HRV"], // 1차 빌드 실측: 서세르비아 7지역·코소보·레저 동맹 땅을 물고 라구사(HRV.3)를 통째로 삼켰다 — 1444 전제공국 복원·두브로브니크 독립과 모순; 본체(BIH·MNE)는 그대로
      "Blue Horde": ["UKR", "GEO"], // 서쪽 29.1E까지 — 야생 벌판은 1441년부터 하즈 기라이(수작업 KHA)의 것; 남쪽으로 캅카스 능선을 넘어 GEO.1·9에 조각을 흘린 것도 실측 차단
      "Kalmar Union": ["SJM"], // 스발바르는 1596년까지 미발견 — 1444 지도에 올릴 수 없다
      "Aragón": ["AND"], // 안도라 공동공국은 rung-1 면을 제외한 것과 같은 이유로 미배정 유지
      "Morocco": ["DZA"], // 자이얀 틀렘센이 로스터에 없음 — DZA는 미배정 유지(마린 색을 입히지 않는다)
      "Hafsid Caliphate": ["DZA", "MAR"], // crude 면이 틀렘센·오랑까지 해안 전체를 하프스로 칠했다(1차 빌드 실측 34지역, 2차에서 MAR.10 조각까지) — 자이얀 서부를 거짓 칠하느니 미배정; 진짜 하프스 동부(콘스탄티노이스)는 수작업 배정으로 회수
    },
  },

  polities: {
    // ── The Ottoman world and its rim ──
    OTT: { name: "Ottoman Empire", color: "#9f0500", aliases: ["오스만 제국", "오스만", "Ottomans", "Sublime Porte", "Turkey"] },
    BYZ: { name: "Byzantine Empire", color: "#890685", aliases: ["비잔티움 제국", "동로마", "Byzantium", "Eastern Roman Empire", "Palaiologoi"] },
    TRE: { name: "Empire of Trebizond", color: "#35d6cb", aliases: ["트레비존드 제국", "트라페주스", "Trebizond", "Komnenoi"] },
    KRM: { name: "Karamanids", color: "#73caef", aliases: ["카라만 후국", "카라만", "Karaman"] },
    AKK: { name: "Aq Qoyunlu", color: "#595780", aliases: ["아크 코윤루", "백양조", "White Sheep Turkomans"] },
    KAR: { name: "Qara Qoyunlu", color: "#5e7178", aliases: ["카라 코윤루", "흑양조", "Black Sheep Turkomans"] },
    SER: { name: "Serbian Despotate", color: "#080075", aliases: ["세르비아 전제공국", "세르비아", "Serbia", "Branković Serbia"] },
    BOS: { name: "Kingdom of Bosnia", color: "#ffc8ad", aliases: ["보스니아 왕국", "보스니아", "Bosnia"] },
    LEZ: { name: "League of Lezhë", color: "#e5001a", aliases: ["레저 동맹", "스칸데르베그의 알바니아", "Albania", "Skanderbeg's league"] },
    WAL: { name: "Wallachia", color: "#fcc400", aliases: ["왈라키아", "왈라키아 공국", "Vlad Dracul's Wallachia"] },
    MOL: { name: "Moldavia", color: "#d4c24e", aliases: ["몰다비아", "몰다비아 공국", "Moldova"] },
    RAG: { name: "Republic of Ragusa", color: "#d0b87a", aliases: ["라구사 공화국", "두브로브니크", "Ragusa", "Dubrovnik"] },
    // ── Central Europe ──
    HUN: { name: "Kingdom of Hungary", color: "#8e3d2e", aliases: ["헝가리 왕국", "헝가리", "Hungary", "Hunyadi's Hungary"] },
    POL: { name: "Kingdom of Poland", color: "#ea6b5d", aliases: ["폴란드 왕국", "폴란드", "Poland"] },
    GDL: { name: "Grand Duchy of Lithuania", color: "#a72f91", aliases: ["리투아니아 대공국", "리투아니아", "Lithuania"] },
    TEU: { name: "Teutonic Order", color: "#666666", aliases: ["튜튼 기사단", "독일 기사단국", "Teutonic Knights", "Ordensstaat"] },
    BOH: { name: "Kingdom of Bohemia", color: "#e27300", aliases: ["보헤미아 왕국", "보헤미아", "Bohemia", "Czech crown"] },
    HAB: { name: "Habsburg Austria", color: "#cccccc", aliases: ["합스부르크 오스트리아", "오스트리아", "Austria", "Frederick III's lands"] },
    HRE: { name: "Holy Roman Empire", color: "#b8b8a0", aliases: ["신성 로마 제국", "독일 제후국들", "German princes", "Reich"] },
    SWI: { name: "Swiss Confederacy", color: "#ff7161", aliases: ["스위스 서약동맹", "스위스", "Switzerland", "Eidgenossenschaft"] },
    // ── The west ──
    ENG: { name: "Kingdom of England", color: "#9f0500", aliases: ["잉글랜드 왕국", "잉글랜드", "England", "Lancastrian England"] },
    SCO: { name: "Kingdom of Scotland", color: "#fcdc00", aliases: ["스코틀랜드 왕국", "스코틀랜드", "Scotland", "Stewart Scotland"] },
    FRA: { name: "Kingdom of France", color: "#3800d1", aliases: ["프랑스 왕국", "프랑스", "France", "Valois France"] },
    BRI: { name: "Duchy of Brittany", color: "#16a5a5", aliases: ["브르타뉴 공국", "브르타뉴", "Brittany"] },
    BUR: { name: "Burgundian State", color: "#913430", aliases: ["부르고뉴국", "부르고뉴", "Burgundy", "Philip the Good's state", "Valois Burgundy"] },
    CAS: { name: "Crown of Castile", color: "#bda400", aliases: ["카스티야 왕국", "카스티야", "Castile"] },
    ARA: { name: "Crown of Aragon", color: "#86302d", aliases: ["아라곤 연합왕국", "아라곤", "Aragon", "Alfonso's Mediterranean empire"] },
    NAV: { name: "Kingdom of Navarre", color: "#fff38e", aliases: ["나바라 왕국", "나바라", "Navarre"] },
    POR: { name: "Kingdom of Portugal", color: "#194d33", aliases: ["포르투갈 왕국", "포르투갈", "Portugal", "Avis Portugal"] },
    GRA: { name: "Emirate of Granada", color: "#fff29e", aliases: ["그라나다 토후국", "그라나다", "Granada", "Nasrids"] },
    // ── Italy ──
    VEN: { name: "Republic of Venice", color: "#16a5a5", aliases: ["베네치아 공화국", "베네치아", "Venice", "Serenissima"] },
    MIL: { name: "Duchy of Milan", color: "#f44e3b", aliases: ["밀라노 공국", "밀라노", "Milan", "Visconti Milan"] },
    FLO: { name: "Republic of Florence", color: "#d33115", aliases: ["피렌체 공화국", "피렌체", "Florence", "Medici Florence"] },
    GEN: { name: "Republic of Genoa", color: "#fff842", aliases: ["제노바 공화국", "제노바", "Genoa"] },
    PAP: { name: "Papal States", color: "#f5b342", aliases: ["교황령", "Papacy", "Rome"] },
    SAV: { name: "Duchy of Savoy", color: "#009ce0", aliases: ["사보이아 공국", "사보이아", "Savoy"] },
    // ── The north and east ──
    KAL: { name: "Kalmar Union", color: "#f44e3b", aliases: ["칼마르 연합", "덴마크", "스칸디나비아", "Denmark", "Scandinavia"] },
    MOS: { name: "Grand Duchy of Moscow", color: "#ffe07a", aliases: ["모스크바 대공국", "모스크바", "Muscovy", "Moscow"] },
    NOV: { name: "Novgorod Republic", color: "#88af34", aliases: ["노브고로드 공화국", "노브고로드", "Novgorod"] },
    KZN: { name: "Khanate of Kazan", color: "#665c64", aliases: ["카잔 칸국", "카잔", "Kazan"] },
    HOR: { name: "Great Horde", color: "#c1b37f", aliases: ["대호드", "황금 호드", "Golden Horde", "Great Horde"] },
    KHA: { name: "Crimean Khanate", color: "#47b869", aliases: ["크림 칸국", "크림", "Crimea", "Giray khanate"] },
    UZK: { name: "Uzbek Khanate", color: "#696d73", aliases: ["우즈베크 칸국", "아불하이르 칸국", "Abu'l-Khayr's horde"] },
    GEO: { name: "Kingdom of Georgia", color: "#be2325", aliases: ["조지아 왕국", "조지아", "Georgia"] },
    // ── Islam's heartlands and Africa ──
    MAM: { name: "Mamluk Sultanate", color: "#ffe747", aliases: ["맘루크 술탄국", "맘루크", "Mamluks", "Egypt"] },
    TIM: { name: "Timurid Empire", color: "#d50027", aliases: ["티무르 제국", "티무르", "Timurids", "Shahrukh's empire"] },
    MOR: { name: "Sultanate of Morocco", color: "#662b00", aliases: ["모로코 술탄국", "모로코", "Morocco", "Marinids", "Wattasids"] },
    HAF: { name: "Hafsid Sultanate", color: "#6b7208", aliases: ["하프스 술탄국", "튀니스", "Tunis", "Hafsids"] },
    ETH: { name: "Ethiopian Empire", color: "#7595c6", aliases: ["에티오피아 제국", "에티오피아", "Ethiopia", "Zara Yaqob's empire"] },
    MLI: { name: "Mali Empire", color: "#c8b83e", aliases: ["말리 제국", "말리", "Mali"] },
    KON: { name: "Kingdom of Kongo", color: "#b4bc49", aliases: ["콩고 왕국", "콩고", "Kongo"] },
    // ── Asia ──
    MNG: { name: "Ming Empire", color: "#ca9887", aliases: ["명", "명나라", "Ming", "China", "Great Ming"] },
    JOS: { name: "Joseon", color: "#571aff", aliases: ["조선", "Korea", "세종의 조선", "South Korea", "North Korea"] },
    JAP: { name: "Ashikaga Japan", color: "#9293b9", aliases: ["무로마치 일본", "일본", "Japan", "Muromachi shogunate"] },
    DEL: { name: "Delhi Sultanate", color: "#969b4e", aliases: ["델리 술탄국", "델리", "Delhi", "Sayyid sultanate"] },
    BEN: { name: "Bengal Sultanate", color: "#6680ad", aliases: ["벵골 술탄국", "벵골", "Bengal"] },
    BAH: { name: "Bahmani Sultanate", color: "#68a4ae", aliases: ["바흐마니 술탄국", "바흐마니", "Bahmanis", "Deccan sultanate"] },
    VIJ: { name: "Vijayanagara", color: "#ffdb64", aliases: ["비자야나가라", "비자야나가라 제국", "Vijayanagar"] },
    AVA: { name: "Kingdom of Ava", color: "#7f8873", aliases: ["아바 왕국", "아바", "Ava", "Burma"] },
    AYU: { name: "Ayutthaya", color: "#618f5e", aliases: ["아유타야", "아유타야 왕국", "Siam", "Thailand"] },
    KHM: { name: "Khmer Kingdom", color: "#a4dd00", aliases: ["크메르 왕국", "크메르", "Cambodia", "post-Angkor Khmer"] },
    DAI: { name: "Dai Viet", color: "#866e60", aliases: ["다이비엣", "대월", "Le dynasty Vietnam", "Vietnam"] },
    CHA: { name: "Champa", color: "#6e9c9f", aliases: ["참파", "참파 왕국", "Cham kingdom"] },
    MAL: { name: "Malacca Sultanate", color: "#4a8f7a", aliases: ["말라카 술탄국", "말라카", "Malacca", "Melaka"] },
    MAJ: { name: "Majapahit", color: "#9a8a4a", aliases: ["마자파힛", "마자파힛 제국", "Majapahit empire"] },
    // ── The Americas before contact ──
    AZT: { name: "Aztec Triple Alliance", color: "#194d33", aliases: ["아즈텍 삼국동맹", "아즈텍", "Aztecs", "Mexica"] },
    TAR: { name: "Purépecha Empire", color: "#7a5a3a", aliases: ["푸레페차 제국", "타라스코", "Tarascan state"] },
    MAY: { name: "Maya Kingdoms", color: "#3d0f75", aliases: ["마야 왕국들", "마야", "Maya"] },
    INC: { name: "Inca Empire", color: "#c25454", aliases: ["잉카 제국", "잉카", "Inca", "Tawantinsuyu"] },
  },

  countryAssignments: {
    OTT: ["BGR", "MKD"],
    SER: ["SRB", "XKO"],
    BOS: ["BIH", "MNE"], // Kosača's Herzegovina rides in the Bosnian color — see rules
    LEZ: ["ALB"],
    HUN: ["HUN", "SVK", "SVN"],
    POL: ["POL"],
    GDL: ["LTU", "BLR", "UKR"],
    TEU: ["EST", "LVA"],
    BOH: ["CZE"],
    HAB: ["AUT"],
    HRE: ["DEU"],
    SWI: ["CHE", "LIE"],
    ENG: ["IRL"], // the Lordship — in truth the Pale and little else, see rules
    FRA: ["FRA"],
    BUR: ["BEL", "NLD", "LUX"],
    CAS: ["ESP"],
    POR: ["PRT"],
    KAL: ["DNK", "SWE", "NOR", "FIN", "ISL", "GRL", "FRO"],
    MOL: ["MDA", "ROU"],
    GEO: ["GEO"],
    KAR: ["IRQ", "AZE", "ARM"],
    MAM: ["EGY", "SYR", "LBN", "ISR", "PSE", "JOR", "SAU"],
    TIM: ["IRN", "AFG", "TKM", "UZB", "TJK", "PAK"],
    UZK: ["KAZ", "KGZ"],
    MOR: ["MAR"],
    HAF: ["TUN", "LBY"],
    ETH: ["ETH", "ERI"],
    MLI: ["MLI", "SEN", "GMB", "GIN"],
    KON: ["AGO"],
    MNG: ["CHN", "TWN"],
    JOS: ["KOR", "PRK"],
    JAP: ["JPN"],
    DEL: ["IND"],
    BEN: ["BGD"],
    AVA: ["MMR"],
    AYU: ["THA"],
    KHM: ["KHM"],
    DAI: ["VNM"],
    MAL: ["MYS"],
    MAJ: ["IDN"],
    AZT: ["MEX"],
    MAY: ["GTM", "BLZ"],
    INC: ["PER", "BOL", "ECU"],
  },

  regionAssignments: {
    // ── Anatolia: the sultan and his rivals ──
    // Ottoman Anatolia is the west and center; the beyliks and empires east.
    "TUR.28_1": "OTT", "TUR.50_1": "OTT", "TUR.73_1": "OTT", // Rumelia's Thracian core
    "TUR.40_1": "BYZ",  // Constantinople — the City, nine years from the guns
    "TUR.22_1": "OTT", "TUR.12_1": "OTT", "TUR.41_1": "OTT", "TUR.11_1": "OTT", "TUR.79_1": "OTT", "TUR.21_1": "OTT",
    "TUR.52_1": "OTT", "TUR.16_1": "OTT", "TUR.66_1": "OTT", "TUR.54_1": "OTT", "TUR.56_1": "OTT", "TUR.77_1": "OTT",
    "TUR.25_1": "OTT", "TUR.59_1": "OTT", "TUR.3_1": "OTT", "TUR.20_1": "OTT", "TUR.8_1": "OTT", "TUR.27_1": "OTT",
    "TUR.19_1": "OTT", "TUR.32_1": "OTT", "TUR.23_1": "OTT", "TUR.7_1": "OTT", "TUR.49_1": "OTT", "TUR.39_1": "OTT",
    "TUR.24_1": "OTT", "TUR.51_1": "OTT", "TUR.6_1": "OTT", "TUR.80_1": "OTT", "TUR.74_1": "OTT", "TUR.67_1": "OTT",
    "TUR.70_1": "OTT", "TUR.46_1": "OTT", "TUR.43_1": "OTT", "TUR.13_1": "OTT", "TUR.81_1": "OTT", "TUR.72_1": "OTT",
    "TUR.53_1": "KRM", "TUR.44_1": "KRM", "TUR.5_1": "KRM", "TUR.62_1": "KRM", "TUR.61_1": "KRM", "TUR.58_1": "KRM", "TUR.47_1": "KRM", // Karaman — Konya's rival court
    "TUR.75_1": "TRE", "TUR.65_1": "TRE", "TUR.34_1": "TRE", "TUR.63_1": "TRE", "TUR.35_1": "TRE", // the Komnenoi's Pontic shore
    "TUR.26_1": "AKK", "TUR.57_1": "AKK", "TUR.68_1": "AKK", "TUR.33_1": "AKK", "TUR.48_1": "AKK", "TUR.2_1": "AKK", "TUR.55_1": "AKK", "TUR.42_1": "AKK", // Diyarbakır — Uzun Hasan's rising house
    "TUR.1_1": "MAM", "TUR.64_1": "MAM", "TUR.37_1": "MAM", // Cilicia and Hatay in the Mamluk orbit
    "TUR.31_1": "KAR", "TUR.30_1": "KAR", "TUR.15_1": "KAR", "TUR.76_1": "KAR", "TUR.17_1": "KAR", "TUR.29_1": "KAR",
    "TUR.60_1": "KAR", "TUR.18_1": "KAR", "TUR.78_1": "KAR", "TUR.4_1": "KAR", "TUR.38_1": "KAR", "TUR.69_1": "KAR", "TUR.14_1": "KAR", "TUR.71_1": "KAR", "TUR.36_1": "KAR", // Jahan Shah's east
    "TUR.45_1": "GEO", "TUR.9_1": "GEO", "TUR.10_1": "GEO", // Samtskhe marches
    // ── Greece: Byzantium's last province and the Latin sea ──
    "GRC.7_1": "BYZ",  // the Morea — Constantine Palaiologos, despot
    "GRC.3_1": "BYZ",  // Attica made tributary by the despot's 1444 campaign
    "GRC.2_1": "BYZ",  // Athos
    "GRC.6_1": "OTT", "GRC.8_1": "OTT", "GRC.5_1": "OTT", // Thessaly, Macedonia, Epirus in the sultan's hand or orbit
    "GRC.4_1": "VEN", "GRC.1_1": "VEN", // Crete and the Aegean — the Serenissima's sea
    // ── Romania: three principalities ──
    "ROU.2_1": "HUN", "ROU.5_1": "HUN", "ROU.38_1": "HUN", "ROU.13_1": "HUN", "ROU.34_1": "HUN", "ROU.33_1": "HUN",
    "ROU.27_1": "HUN", "ROU.6_1": "HUN", "ROU.14_1": "HUN", "ROU.1_1": "HUN", "ROU.23_1": "HUN", "ROU.29_1": "HUN",
    "ROU.35_1": "HUN", "ROU.8_1": "HUN", "ROU.22_1": "HUN", "ROU.16_1": "HUN", // Transylvania — Hunyadi's own voivodate
    "ROU.40_1": "WAL", "ROU.32_1": "WAL", "ROU.11_1": "WAL", "ROU.28_1": "WAL", "ROU.21_1": "WAL", "ROU.18_1": "WAL",
    "ROU.31_1": "WAL", "ROU.3_1": "WAL", "ROU.37_1": "WAL", "ROU.17_1": "WAL", "ROU.20_1": "WAL", "ROU.26_1": "WAL",
    "ROU.10_1": "WAL", "ROU.25_1": "WAL", "ROU.12_1": "WAL", "ROU.9_1": "WAL", // Vlad Dracul's principality
    "ROU.15_1": "OTT", "ROU.39_1": "OTT", // Dobruja
    // (Moldavia takes the rest of ROU via the country baseline above.)
    // ── The Adriatic ──
    "HRV.20_1": "VEN", "HRV.14_1": "VEN", "HRV.16_1": "VEN", "HRV.5_1": "VEN", "HRV.9_1": "VEN", // Venetian Dalmatia and Istria
    "HRV.3_1": "RAG",  // Ragusa — the republic that outlasts empires
    // (the rest of Croatia rides with the Hungarian crown)
    "HRV.13_1": "HUN", "HRV.6_1": "HUN", "HRV.8_1": "HUN", "HRV.10_1": "HUN", "HRV.17_1": "HUN", "HRV.7_1": "HUN",
    "HRV.21_1": "HUN", "HRV.4_1": "HUN", "HRV.15_1": "HUN", "HRV.1_1": "HUN", "HRV.12_1": "HUN", "HRV.18_1": "HUN",
    "HRV.2_1": "HUN", "HRV.11_1": "HUN", "HRV.19_1": "HUN",
    // ── The British Isles and France ──
    "GBR.1_1": "ENG", "GBR.4_1": "ENG", "GBR.2_1": "ENG",
    "GBR.3_1": "SCO",
    "FRA.9_1": "ENG",   // Normandy — English since 1417, five years from the reckoning
    "FRA.10_1": "ENG",  // Gascony — three centuries of Plantagenet Bordeaux
    "FRA.3_1": "BRI",   // the duchy between the crowns
    "FRA.2_1": "BUR",   // the two Burgundies
    "FRA.7_1": "BUR",   // Flanders, Artois, Picardy — the rich north
    "FRA.5_1": "GEN",   // Corsica
    // (the rest of France is Charles VII's, Truce of Tours holding)
    // ── Iberia ──
    "ESP.2_1": "ARA", "ESP.6_1": "ARA", "ESP.10_1": "ARA", "ESP.13_1": "ARA", // the Crown of Aragon's mainland and isles
    "ESP.9_1": "NAV",
    "ESP.1_1": "GRA",   // the Nasrid emirate — wider than the true border, see rules
    "ESP.7.1_1": "POR", // Ceuta — the Avis conquest of 1415, Henry the Navigator's proving ground (Spanish only from 1668)
    // ── The Maghreb: the Hafsid east recovered by hand ──
    // The crude world face painted the whole coast Hafsid (Tlemcen included),
    // so it is fenced out of DZA wholesale; these are the regions the Hafsids
    // actually held in 1444 — the Constantinois and Bougie.
    "DZA.8_1": "HAF", "DZA.37_1": "HAF", "DZA.23_1": "HAF", "DZA.39_1": "HAF", "DZA.29_1": "HAF",
    "DZA.15_1": "HAF", "DZA.21_1": "HAF", "DZA.34_1": "HAF", "DZA.5_1": "HAF", "DZA.40_1": "HAF", "DZA.42_1": "HAF",
    // ── Italy ──
    "ITA.13_1": "SAV", "ITA.19_1": "SAV",
    "ITA.9_1": "GEN",
    "ITA.10_1": "MIL",  // Filippo Maria Visconti's last years
    "ITA.20_1": "VEN", "ITA.7_1": "VEN", "ITA.17_1": "VEN", "ITA.6_1": "VEN", // the Terraferma
    "ITA.16_1": "FLO",  // Cosimo's Florence
    "ITA.8_1": "PAP", "ITA.18_1": "PAP", "ITA.11_1": "PAP", "ITA.12_1": "PAP", "ITA.1_1": "PAP",
    "ITA.5_1": "ARA", "ITA.2_1": "ARA", "ITA.3_1": "ARA", "ITA.4_1": "ARA", "ITA.15_1": "ARA", "ITA.14_1": "ARA", // Alfonso the Magnanimous — Naples won two years ago
    // ── Poland, Prussia, Russia ──
    "POL.11_1": "TEU", "POL.14_1": "TEU", // the Ordensstaat — Thirteen Years' War is a decade out
    "RUS.21_1": "TEU",  // Königsberg
    // The western voivodeships were riding the MODERN border (the fused
    // Poland-Lithuania face had to be excluded, so no era face carves here):
    // in 1444 Silesia has been the Bohemian crown's fief since Trenčín (1335,
    // until 1742!), Lubusz is Brandenburg's Neumark, and western Pomerania is
    // the Griffin duchy inside the Empire. Poland's real western border runs
    // far east of the Oder-Neisse — assigned by hand at region granularity.
    "POL.1_1": "BOH", "POL.8_1": "BOH", "POL.12_1": "BOH", // Lower Silesia, Opole, Upper Silesia — the Bohemian crown
    "POL.5_1": "HRE",  // Lubusz land — the Neumark
    "POL.16_1": "HRE", // the Griffin duchy of Pomerania-Stettin
    "RUS.49_1": "NOV", "RUS.57_1": "NOV", "RUS.38_1": "NOV", "RUS.14_1": "NOV", "RUS.26_1": "NOV",
    "RUS.4_1": "NOV", "RUS.45_1": "NOV", "RUS.32_1": "NOV", "RUS.78_1": "NOV", "RUS.46_1": "NOV", // the merchant republic's north
    "RUS.44_1": "MOS", "RUS.43_1": "MOS", "RUS.72_1": "MOS", "RUS.81_1": "MOS", "RUS.76_1": "MOS", "RUS.19_1": "MOS",
    "RUS.33_1": "MOS", "RUS.47_1": "MOS", "RUS.23_1": "MOS", "RUS.70_1": "MOS", "RUS.59_1": "MOS", "RUS.52_1": "MOS",
    "RUS.37_1": "MOS", "RUS.7_1": "MOS", "RUS.39_1": "MOS", "RUS.79_1": "MOS", "RUS.67_1": "MOS", "RUS.42_1": "MOS",
    "RUS.54_1": "MOS", // Vasily II's blinded, embattled patrimony (Tver and Ryazan approximated in)
    "RUS.64_1": "GDL", "RUS.8_1": "GDL", // Smolensk and Bryansk — Lithuanian since 1404
    "RUS.68_1": "KZN", "RUS.13_1": "KZN", "RUS.41_1": "KZN", "RUS.31_1": "KZN", "RUS.74_1": "KZN", // the new khanate on the Volga
    "RUS.5_1": "HOR", "RUS.77_1": "HOR", "RUS.58_1": "HOR", "RUS.34_1": "HOR", "RUS.65_1": "HOR", "RUS.22_1": "HOR",
    "RUS.63_1": "HOR", "RUS.62_1": "HOR", "RUS.53_1": "HOR", "RUS.6_1": "HOR", "RUS.10_1": "HOR", "RUS.15_1": "HOR", // the Horde's steppe — suzerain over Moscow still
    "UKR.4_1": "KHA",   // Hacı Giray's new khanate
    "UKR.9_1": "KHA", "UKR.26_1": "KHA", "UKR.6_1": "KHA", "UKR.15_1": "KHA", "UKR.17_1": "KHA", "UKR.16_1": "KHA", "UKR.5_1": "KHA", // the Wild Fields
    "UKR.23_1": "HUN",  // Zakarpattia — the counties beyond the Carpathians, Hungarian to 1920 (the era face found this before its UKR fence; kept by hand)
    // ── Vietnam: three worlds on one coast ──
    "VNM.54_1": "DAI", // Thuận Hóa — the 1306 dowry lands
    "VNM.19_1": "CHA", "VNM.47_1": "CHA", "VNM.34_1": "CHA", "VNM.48_1": "CHA", "VNM.8_1": "CHA", "VNM.21_1": "CHA",
    "VNM.15_1": "CHA", "VNM.16_1": "CHA", "VNM.37_1": "CHA", "VNM.45_1": "CHA", "VNM.43_1": "CHA", "VNM.32_1": "CHA", "VNM.11_1": "CHA", // Vijaya's kingdom
    "VNM.53_1": "KHM", "VNM.9_1": "KHM", "VNM.1_1": "KHM", "VNM.33_1": "KHM", "VNM.13_1": "KHM", "VNM.18_1": "KHM",
    "VNM.39_1": "KHM", "VNM.12_1": "KHM", "VNM.61_1": "KHM", "VNM.25_1": "KHM", "VNM.58_1": "KHM", "VNM.59_1": "KHM",
    "VNM.6_1": "KHM", "VNM.24_1": "KHM", "VNM.2_1": "KHM", "VNM.51_1": "KHM", "VNM.17_1": "KHM", "VNM.7_1": "KHM", "VNM.10_1": "KHM", // the Mekong is Khmer land
    // ── India: the sultanates and the empire of the south ──
    "IND.36_1": "BEN", "IND.15_1": "BEN", // Bengal reaches into Jharkhand's east
    "IND.20_1": "BAH", "IND.32_1": "BAH", "IND.2_1": "BAH", "IND.16_1": "BAH", "IND.10_1": "BAH", // the Deccan sultanate
    "IND.31_1": "VIJ", "IND.17_1": "VIJ", "IND.27_1": "VIJ", // Deva Raya II's empire
    // (the north stays with Delhi's baseline — Malwa, Gujarat, Jaunpur approximated in)
    // ── Mesoamerica ──
    "MEX.15_1": "AZT", "MEX.9_1": "AZT", "MEX.13_1": "AZT", "MEX.17_1": "AZT", "MEX.29_1": "AZT", "MEX.21_1": "AZT",
    "MEX.30_1": "AZT", "MEX.12_1": "AZT", "MEX.20_1": "AZT", // the Triple Alliance under Moctezuma I
    "MEX.16_1": "TAR", "MEX.8_1": "TAR", // the Purépecha — never conquered by the Mexica
    "MEX.31_1": "MAY", "MEX.23_1": "MAY", "MEX.4_1": "MAY", "MEX.27_1": "MAY", "MEX.5_1": "MAY", // the Yucatán kingdoms
    // (northern Mexico stays unassigned — the Chichimeca world)
  },

  // Era cities: [name, modern-seed-name | [lng,lat], tier, population ~1444].
  cities: [
    ["Hanseong", "Seoul", 3, 110000], // 세종 26년 — 훈민정음은 이미 궁 안에 있다
    ["Beijing", "Beijing", 4, 800000], // the Yongle capital, thirty years old
    ["Nanjing", [118.8, 32.06], 3, 500000],
    ["Kyoto", [135.77, 35.01], 3, 200000], // the shogun's fraying capital
    ["Constantinople", "Istanbul", 3, 50000], // a city of ruins inside the greatest walls on earth
    ["Edirne", [26.56, 41.68], 2, 60000], // the sultan's true capital
    ["Trebizond", [39.73, 41.0], 1, 30000], // the last Komnenos court
    ["Venice", [12.34, 45.44], 3, 150000], // the sea's counting-house
    ["Florence", [11.26, 43.77], 2, 60000], // Cosimo's bank, Brunelleschi's dome
    ["Milan", "Milan", 2, 100000],
    ["Genoa", [8.93, 44.41], 2, 80000],
    ["Rome", "Rome", 2, 35000], // the popes are rebuilding a ruin
    ["Naples", "Naples", 2, 60000], // Alfonso's new Mediterranean seat
    ["Ragusa", [18.09, 42.65], 1, 30000],
    ["Paris", "Paris", 3, 150000], // recovering — the English left in 1436
    ["London", "London", 2, 50000],
    ["Bruges", [3.22, 51.21], 2, 40000], // Burgundy's golden warehouse
    ["Dijon", [5.04, 47.32], 1, 15000],
    ["Lisbon", "Lisbon", 2, 60000], // Henry's caravels sail from here
    ["Valladolid", [-4.72, 41.65], 1, 30000], // Castile's itinerant court
    ["Granada", [-3.6, 37.18], 2, 100000], // the Alhambra's last century
    ["Barcelona", "Barcelona", 2, 35000],
    ["Vienna", "Vienna", 1, 20000],
    ["Prague", "Prague", 2, 40000], // post-Hussite, unconquered
    ["Buda", "Budapest", 2, 25000], // Hunyadi's kingdom, kingless today
    ["Kraków", [19.94, 50.06], 2, 20000],
    ["Vilnius", [25.28, 54.69], 1, 15000],
    ["Marienburg", [19.03, 54.04], 1, 10000], // the Order's brick fortress-capital
    ["Moscow", "Moscow", 2, 40000], // a blinded prince's fortress
    ["Novgorod", [31.27, 58.52], 2, 30000], // the merchant republic
    ["Sarai", [47.5, 48.7], 1, 20000], // the Horde's fading capital
    ["Kaffa", [35.38, 45.03], 1, 40000], // Genoa's Black Sea emporium
    ["Cairo", "Cairo", 3, 250000], // the Mamluk metropolis
    ["Damascus", [36.3, 33.51], 2, 60000],
    ["Mecca", [39.83, 21.42], 1, 20000],
    ["Tabriz", [46.29, 38.08], 2, 100000], // Jahan Shah's court
    ["Samarkand", [66.98, 39.65], 2, 100000], // Ulugh Beg's observatory
    ["Herat", [62.2, 34.34], 2, 100000], // Shahrukh's capital of the arts
    ["Tbilisi", [44.79, 41.72], 1, 20000],
    ["Timbuktu", [-3.01, 16.77], 1, 50000], // Mali's book-market on the sand
    ["Delhi", "New Delhi", 2, 100000], // a sultanate in name
    ["Gaur", [88.13, 24.87], 2, 100000], // Bengal's brick capital
    ["Vijayanagara", [76.47, 15.34], 3, 300000], // the greatest city south of Beijing
    ["Ayutthaya", [100.57, 14.35], 2, 60000],
    ["Thang Long", [105.85, 21.03], 2, 80000], // Hanoi — the Le court
    ["Vijaya", [109.22, 13.88], 1, 30000], // Champa's citadel
    ["Malacca", [102.25, 2.19], 1, 40000], // the strait's new toll-gate
    ["Tenochtitlan", "Mexico City", 3, 150000], // the lake city of the Mexica
    ["Cusco", [-71.97, -13.53], 2, 40000], // Pachacuti is rebuilding it in stone
  ],

  simulationRules:
    "It is 11 November 1444, the day after VARNA. The crusade is destroyed; King Władysław " +
    "of Poland and Hungary is dead on the field; Hungary faces an interregnum (Hunyadi " +
    "emerges as regent historically) and Poland an empty throne (Casimir of Lithuania " +
    "takes it in 1447). Sultan MURAD II has won; his son Mehmed — twelve years old today — " +
    "takes Constantinople in 1453 historically. The City has nine years unless someone " +
    "changes the story: the guns exist, the walls are undermanned, and no fleet is coming. " +
    "STANDING TRAJECTORIES the player may bend, never assume: the Hundred Years War " +
    "resumes and France expels England from all but Calais (1449-53); the Wars of the " +
    "Roses follow; Burgundy's dukes reach for a crown and die reaching (1477); Castile " +
    "and Aragon marry into Spain (1469) and Granada falls (1492); Moscow swallows " +
    "Novgorod (1478) and throws off the Horde (1480); the Ottomans take Trebizond, " +
    "Karaman and the Black Sea rim; Timurid Persia fragments as the sheep dynasties fight " +
    "— Uzun Hasan's Aq Qoyunlu rises; Portugal rounds Africa (1488) and the western ocean " +
    "is crossed (1492); printing spreads from Mainz within the decade. ERA CONSTRAINTS: " +
    "knowledge of the world is local — no court knows the Americas exist, and the " +
    "engine must never let pre-contact and Old-World polities interact until ships " +
    "actually cross; armies are seasonal, small and slow; plague recurs; dynastic " +
    "marriage, papal politics and personal union move more borders than battles do; " +
    "colonial expansion is PACED — caravel-stage exploration first, decades before " +
    "empires. ADJACENCY AND SUPPLY are law: no teleporting armies, no ruling what you " +
    "cannot reach; sea power projects only from held coasts and island chains. THE EAST: " +
    "Ming China under the young Zhengtong emperor is the world's superpower but has " +
    "burned its treasure fleets — the Tumu crisis (1449) is five years out; JOSEON under " +
    "세종 is at its civilizational noon — 훈민정음 is promulgated in 1446 (a fixed anchor: " +
    "the alphabet exists in draft TODAY), the northern forts line the Yalu and Tumen, " +
    "and the court debates everything in memorials; Japan's Ashikaga shogunate is " +
    "sliding toward Ōnin-era fragmentation; Malacca is converting the strait into money; " +
    "Vijayanagara under Deva Raya II is the subcontinent's counterweight. MAP " +
    "APPROXIMATIONS the rules carry: the Holy Roman aggregate stands for hundreds of " +
    "princes and free cities (electors chief among them); the Delhi color covers Malwa, " +
    "Gujarat and Jaunpur which are sovereign in fact; Granada's color overfills the true " +
    "emirate; Bosnia's color carries Kosača's Herzegovina; the Kalmar Union is one crown " +
    "over three quarreling kingdoms (Sweden revolts on a timer); the American polities " +
    "are drawn at the scale of their tribute networks, and northern Mexico, Amazonia, " +
    "Africa's interior and Siberia are unassigned because no state ruled them — " +
    "unassigned land is unconquered, not ownerless loot. Sovereignty moves only with " +
    "occupation or dynastic law; player actions are attempts, never decrees.",

  startingTimelineText:
    "The news from Varna is a day old and still traveling: the crusade that was meant to " +
    "save Constantinople died on a Bulgarian beach, and the young king who led it died " +
    "with it. The Roman Empire is now a city, a suburb, and a peninsula in Greece, ruled " +
    "by men who know exactly how the story ends and refuse to say it aloud. Around the " +
    "dying center the world is quickening. In Italy the bankers of Florence and the " +
    "arsenals of Venice are inventing the modern state out of ledgers; in Flanders the " +
    "Duke of Burgundy runs Europe's richest court out of a warehouse district; in Mainz " +
    "a goldsmith is perfecting a machine for writing. Portugal's caravels have passed " +
    "Cape Bojador and keep going south, chasing gold and Prester John down an unmapped " +
    "coast. From Samarkand's observatory to Cairo's colleges the Islamic world is rich, " +
    "learned and dividing against itself, while on the steppe the Horde that ruled " +
    "Russia for two centuries is splitting into khanates that will fight over the " +
    "pieces. At the world's eastern end the pattern inverts: Ming China, having built " +
    "the greatest fleets on earth, has beached them by decree; Japan's shoguns are " +
    "losing their grip province by province; and in Seoul a king in his prime has " +
    "decided that his people should be able to write their own language — twenty-eight " +
    "letters, drafted in secret, two years from proclamation. Across an ocean no one " +
    "has crossed, an emperor in a lake city and an emperor in the Andes are building " +
    "the last great states that have never heard of gunpowder. Five centuries of " +
    "modernity begin here, and not one line of them is written yet.",
};

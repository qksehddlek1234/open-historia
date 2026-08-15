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
      "Ríocht Laighean", // 아일랜드 전역 스팬 잔여면(Dublin out·Kilkenny IN) — 라벨 거짓말이라 로스터 확장 3 이후에도 제외(진짜 레인스터는 수작업 배정)
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
      // ── 제후 분할(로스터 확장 1)로 은퇴한 제국면 둘 ──
      "Sacrum Imperium Romanum", // rung-1 부분면(쾰른·베를린·뮌헨) — 제후 수작업 모자이크가 승계; 회색 통칠로 SAX·BRA·BAV를 덮을 권리가 없다
      "Holy Roman Empire", // rung-3 조야 집합체 — 동일; 남아 있던 유일한 실효(슐레스비히 절단)는 HOL 통짜 배정이 승계
    ],
    faceOwners: {
      // ── rung 1 (OHM 원어 이름 → 보드 코드) ──
      "Deasmhumhain": "DES", // 실재 데즈먼드면(Cork IN·더블린 out) — 로스터 확장 3에서 제외를 풀고 주인에게 돌려줌
      "Deutschordensstaat": "TEU",
      "Ecclesia Osiliensis": "TEU", // 외젤 주교령 — 스펙의 EST/LVA→TEU 근사(리보니아 연맹)와 동일 선택
      "Isle of Man": "ENG", // 스탠리 가문 영주령, 잉글랜드 종주권
      "Nafarroako Erresuma": "NAV",
      "Nogai Horde": "UZK", // Guryev·Orenburg·Sarai IN — 볼가 동안 스텝; 1444 아불하이르 연맹권, 스펙 UZK("Abu'l-Khayr's horde")
      "Regnum Siciliae": "ARA", // 섬만(Palermo IN·Naples out) — 알폰소의 트리나크리아
      "Rìoghachd na h-Alba": "SCO",
      "Великое княжество Московское": "MOS",
      "Великое княжество Рязанское": "MOS", // 스펙 주석: Tver·Ryazan은 MOS에 근사
      "Великое княжество Тверское": "MOS",
      "Новгородская республика": "NOV", // 실재 확인(북방 제국만 — Moscow·Kazan·Perm out)
      "دولتْ علیّه عثمانیّه": "OTT",
      "قزان خانلغی": "KZN",
      "مملكة غرناطة": "GRA",
      // ── rung 3 (별칭 자동 매칭이 안 닿는 것만) ──
      "Sicily": "NAP", // 본토 나폴리면(Taranto·Reggio·Salerno IN) — 로스터 확장 2부터 나폴리 왕국의 것(섬면 rung-1은 ARA 유지, 1458년 분할 상속의 지도적 근거)
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
      // (제국면 둘은 excludeFaces로 은퇴 — 이전 울타리 기록은 git 이력에)
      "Kingdom of Hungary": ["HRV", "ROU", "UKR", "CZE", "BIH"], // Split IN(달마티아는 1409~20부터 베네치아) · 1차 빌드 실측: Suceava·Neamț(몰다비아 수도권!)를 물고 갈리치아(1349부터 폴란드령)에 조각을 흘림 · 모라비아 조각 · 2차 실측: Republika Srpska 호(바냐루카~동보스니아)를 과반 삼킴(1444 트브르트코 2세는 헝가리 종주권 아래 보스니아 통치 — 사바 변경만이 아니다) — Vojvodina 6지역·Burgenland은 옳아서 SRB·AUT는 안 친다; Zakarpattia는 수작업 배정으로 회수
      "Teutonic Knights": ["LTU"], // 1400 기사단국은 1422년 할양 전 사모기티아 포함 — 메멜은 rung-1 Deutschordensstaat가 담당
      "Timurid Empire": ["IRQ", "AZE", "ARM", "GEO", "TUR", "SYR", "SAU", "KWT", "QAT", "IRN.11", "IRN.15"], // (확장5 실측 추가: 호르무즈 IRN.11·무샤샤 IRN.15를 도로 물어가 지역 접두로 차단) // 티무르 1400 최대판도가 동아나톨리아(KAR 10·AKK 5지역)·시리아(맘루크)·동아라비아까지 물었다(1차 빌드 실측 19지역+) — 1444엔 양 왕조와 맘루크의 것; 트란스옥시아나 쪽(UZB·KAZ 절단)은 실제 국경이라 남긴다
      "Ottoman Empire": ["TUR"], // TUR는 1444 수작업 모자이크 완비(OTT/KRM/TRE/AKK/KAR/MAM/GEO) — 1400 조야면은 단색으로 밀고 콘스탄티노플을 9년 일찍 술탄에게 줄 위험; 발칸(BGR·MKD·SRB-Niš·Pirot)은 그대로 작동
      "Bulgar Khanate": ["SRB"], // 다뉴브 불가리아면이 티목 유역(Borski·Braničevski)까지 뻗는다 — 1444.8 세게드 강화로 전제공국에 반환된 땅
      "Bosnia": ["SRB", "XKO", "ALB", "HRV"], // 1차 빌드 실측: 서세르비아 7지역·코소보·레저 동맹 땅을 물고 라구사(HRV.3)를 통째로 삼켰다 — 1444 전제공국 복원·두브로브니크 독립과 모순; 본체(BIH·MNE)는 그대로
      "Blue Horde": ["UKR", "GEO", "RUS.1", "RUS.20", "RUS.25"], // 서쪽 29.1E까지 — 야생 벌판은 1441년부터 하즈 기라이(수작업 KHA)의 것; 캅카스 능선 너머 GEO.1·9 조각도 실측 차단; 확장 5부터 체르케스 3지역(지역 접두)도 — 산록은 대호드가 아니라 아디게의 것
      "Kalmar Union": ["SJM"], // 스발바르는 1596년까지 미발견 — 1444 지도에 올릴 수 없다
      "Aragón": ["AND"], // 안도라 공동공국은 rung-1 면을 제외한 것과 같은 이유로 미배정 유지
      "Morocco": ["DZA"], // 자이얀 틀렘센이 로스터에 없음 — DZA는 미배정 유지(마린 색을 입히지 않는다)
      "Papal States": ["ITA.1"], // 로스터 확장 2 실측: 조야 교황령면이 트론토를 넘어 테라모(ITA.1.4)를 물었다 — 1200 보드와 같은 지역 접두 울타리; 아브루초는 왕국(NAP)의 것
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
    HRE: { name: "Holy Roman Empire", color: "#b8b8a0", aliases: ["신성 로마 제국", "성직 선제후령과 자유도시들", "Ecclesiastical princes", "Reich"] }, // 제후 분할 후 잔여 집합체: 쾰른·마인츠·트리어 선제후령, 자유도시, 소백령 — 회색은 이제 "그 사이의 제국"이다
    // ── The German princes (로스터 확장 1 — 원본 209 팔레트에서 이름·색 그대로) ──
    SAX: { name: "Electorate of Saxony", color: "#7b7d93", aliases: ["작센 선제후국", "작센", "Saxony", "Wettin lands"] },
    BRA: { name: "Margraviate of Brandenburg", color: "#a44737", aliases: ["브란덴부르크 변경백국", "브란덴부르크", "Brandenburg", "Hohenzollern Brandenburg"] },
    BAV: { name: "Duchy of Bavaria", color: "#bbbac9", aliases: ["바이에른 공국", "바이에른", "Bavaria", "Wittelsbach Bavaria"] },
    WUR: { name: "County of Württemberg", color: "#a1ce69", aliases: ["뷔르템베르크 백국", "뷔르템베르크", "Württemberg", "Wurttemberg"] },
    BAD: { name: "Margraviate of Baden", color: "#a4c6a6", aliases: ["바덴 변경백국", "바덴", "Baden"] },
    HES: { name: "Landgraviate of Hesse", color: "#af0d3e", aliases: ["헤센 방백국", "헤센", "Hesse", "Hessen"] },
    KLE: { name: "Duchy of Cleves", color: "#ffeb66", aliases: ["클레페 공국", "클레페-마르크", "Cleves", "Kleve-Mark"] },
    MUN: { name: "Bishopric of Münster", color: "#ce8346", aliases: ["뮌스터 주교령", "뮌스터", "Münster", "Munster"] },
    BRK: { name: "Duchy of Brunswick", color: "#8b4e2d", aliases: ["브라운슈바이크 공국", "브라운슈바이크", "Brunswick", "Welf Brunswick"] },
    LUN: { name: "Duchy of Lüneburg", color: "#115b97", aliases: ["뤼네부르크 공국", "뤼네부르크", "Lüneburg", "Luneburg", "Celle"] },
    OLD: { name: "County of Oldenburg", color: "#936c6c", aliases: ["올덴부르크 백국", "올덴부르크", "Oldenburg"] },
    HOL: { name: "Duchy of Holstein", color: "#fff3a3", aliases: ["홀슈타인 공국", "홀슈타인", "Holstein", "Schauenburg Holstein"] },
    MEC: { name: "Duchy of Mecklenburg", color: "#aeaddb", aliases: ["메클렌부르크 공국", "메클렌부르크", "Mecklenburg", "Mecklenburg-Schwerin"] },
    WZB: { name: "Bishopric of Würzburg", color: "#c8b265", aliases: ["뷔르츠부르크 주교령", "뷔르츠부르크", "Würzburg", "Wurzburg"] },
    POM: { name: "Duchy of Pomerania", color: "#619226", aliases: ["포메라니아 공국", "포메라니아", "Pomerania", "Griffin duchy"] },
    SIL: { name: "Duchies of Silesia", color: "#75b922", aliases: ["실레시아 공국들", "실레시아", "Silesia", "Silésia", "Schlesien"] },
    FRI: { name: "Free Frisia", color: "#C45100", aliases: ["자유 프리슬란트", "프리슬란트", "Friesland", "Frisian freedom"] },
    // ── The Italian and Mediterranean minors (로스터 확장 2 — 원본 색 그대로) ──
    NAP: { name: "Kingdom of Naples", color: "#653294", aliases: ["나폴리 왕국", "나폴리", "Naples", "Regno di Napoli"] }, // 알폰소의 두 번째 왕관 — 1458년 그가 죽으면 아라곤과 갈라져 페란테의 것이 된다
    FER: { name: "Marquisate of Ferrara", color: "#437406", aliases: ["페라라 후국", "페라라", "Ferrara", "Este Ferrara"] },
    SIE: { name: "Republic of Siena", color: "#a0ab4f", aliases: ["시에나 공화국", "시에나", "Siena"] },
    LUC: { name: "Republic of Lucca", color: "#873bce", aliases: ["루카 공화국", "루카", "Lucca"] }, // 원본 키 둘 중 "Lucca" — 1444의 루카는 공화국이다(공국은 1805년 엘리자의 것)
    PRO: { name: "County of Provence", color: "#c8c0d3", aliases: ["프로방스 백국", "프로방스", "Provence", "René's Provence"] },
    ATH: { name: "Duchy of Athens", color: "#11a259", aliases: ["아테네 공국", "아테네", "Athens", "Acciaioli Athens"] },
    // ── Africa subdivided (로스터 확장 6, 최종 극장 — 원본 색 그대로) ──
    TLE: { name: "Zayyanid Tlemcen", color: "#0062B1", aliases: ["자이얀 틀렘센", "틀렘센", "Tlemcen", "Zayyanids"] }, // 1·2차 빌드에서 미배정으로 남겨뒀던 DZA 공백의 주인 — 팔레트에 있었다
    ADA: { name: "Adal Sultanate", color: "#923659", aliases: ["아달 술탄국", "아달", "Adal", "Barr Sa'ad ad-din"] },
    AJU: { name: "Ajuran Sultanate", color: "#fff8ff", aliases: ["아주란 술탄국", "아주란", "Ajuuraan", "Ajuran"] },
    WAR: { name: "Warsangeli Sultanate", color: "#531c87", aliases: ["와르상갈리 술탄국", "와르상갈리", "Warsangli", "Warsangeli"] },
    MRH: { name: "Marehan", color: "#47527b", aliases: ["마레한", "Marehan"] },
    BOR: { name: "Borana", color: "#dfaa4e", aliases: ["보라나", "가다", "Borana", "Boorana"] },
    SID: { name: "Sidamo", color: "#653294", aliases: ["시다모", "시다마", "Sidamo", "Sidama"] },
    KIL: { name: "Kilwa Sultanate", color: "#C45100", aliases: ["킬와 술탄국", "킬와", "Kilwa", "Swahili coast"] },
    BNI: { name: "Kingdom of Benin", color: "#c19a57", aliases: ["베냉 왕국", "베냉", "Benin", "Edo kingdom"] },
    OYO: { name: "Oyo", color: "#c8a66a", aliases: ["오요", "초기 오요", "Oyo"] },
    MER: { name: "Imerina", color: "#217d4f", aliases: ["이메리나", "메리나", "Merina Kingdom", "Merina"] },
    // ── Asia subdivided (로스터 확장 5 — 원본 색 그대로) ──
    CND: { name: "Beylik of Candar", color: "#a36593", aliases: ["찬다르 후국", "이스펜디야르", "Candar", "Isfendiyarids"] },
    DUL: { name: "Beylik of Dulkadir", color: "#e7ffdb", aliases: ["둘카디르 후국", "둘카디르", "Dulkadir", "Dulkadirids"] },
    RAM: { name: "Beylik of Ramazan", color: "#9c0d0d", aliases: ["라마잔 후국", "라마잔", "Ramazan", "Ramazanids"] },
    CIR: { name: "Circassia", color: "#3d9b18", aliases: ["체르케스", "아디게", "Circasia", "Adyghe"] },
    SHI: { name: "Shirvan", color: "#93b5c7", aliases: ["시르반", "시르반샤", "Shirvan", "Shirvanshah"] },
    HRM: { name: "Kingdom of Hormuz", color: "#F44E3B", aliases: ["호르무즈 왕국", "호르무즈", "Hormuz", "Ormus"] },
    MUS: { name: "Mushasha", color: "#96748a", aliases: ["무샤샤", "무샤샤 운동", "Mushasha", "Musha'sha'iyyah"] },
    OMA: { name: "Nabhani Oman", color: "#694d30", aliases: ["나브하니 오만", "오만", "Oman", "Nabhanids"] },
    BHN: { name: "Bahrain", color: "#0062B1", aliases: ["바레인", "자브리드 바레인", "Bahrain", "Jabrid Bahrain"] },
    QTR: { name: "Qatar", color: "#653294", aliases: ["카타르", "Qatar"] },
    YMN: { name: "Rasulid Yemen", color: "#8b2623", aliases: ["라술 예멘", "예멘", "Yemen", "Rasulids"] },
    HED: { name: "Sharifate of Hejaz", color: "#73D8FF", aliases: ["헤자즈 샤리프국", "헤자즈", "Sharifate of Hedjaz", "Mecca"] },
    JAU: { name: "Jaunpur Sultanate", color: "#716271", aliases: ["자운푸르 술탄국", "자운푸르", "Jaunpur", "Sharqi sultanate"] },
    MEW: { name: "Kingdom of Mewar", color: "#a18c4b", aliases: ["메와르 왕국", "메와르", "Mewar", "Rana Kumbha's Mewar"] },
    SND: { name: "Samma Sindh", color: "#741a1a", aliases: ["삼마 신드", "신드", "Sindh", "Samma dynasty"] },
    JHA: { name: "Jharkhand", color: "#8f926b", aliases: ["자르칸드", "나그반시", "Jharkhand", "Nagvanshi"] },
    ASM: { name: "Ahom Assam", color: "#9a133a", aliases: ["아홈 아삼", "아삼", "Assam", "Ahom kingdom"] },
    TRI: { name: "Kingdom of Tripura", color: "#a75e55", aliases: ["트리푸라 왕국", "트리푸라", "Tripura", "Manikya dynasty"] },
    KOT: { name: "Kingdom of Kotte", color: "#738e6c", aliases: ["코테 왕국", "코테", "Kotte", "Sri Lanka"] },
    ARK: { name: "Kingdom of Mrauk U", color: "#a69678", aliases: ["므라우크우 왕국", "아라칸", "Arakan", "Mrauk U"] },
    PEG: { name: "Hanthawaddy Pegu", color: "#9fb79a", aliases: ["한타와디 페구", "페구", "Pegu", "Hanthawaddy"] },
    HSI: { name: "Shan States", color: "#a581b7", aliases: ["샨 제국들", "시포", "Hsipaw", "Shan states"] },
    LXA: { name: "Lan Xang", color: "#c3564e", aliases: ["란상 왕국", "란상", "Ian Xang", "Lan Xang", "Laos"] },
    BRU: { name: "Sultanate of Brunei", color: "#0062B1", aliases: ["브루나이 술탄국", "브루나이", "Brunei"] },
    MGL: { name: "Northern Yuan", color: "#747952", aliases: ["북원", "몽골", "Mongolia", "Eastern Mongols"] },
    OIR: { name: "Oirat Confederation", color: "#ebc7bc", aliases: ["오이라트 연맹", "오이라트", "Oirat", "Esen's Oirats"] },
    HAI: { name: "Haixi Jurchens", color: "#cabee1", aliases: ["하이시 여진", "하이시", "Haixi", "Hulun Jurchens"] },
    JZH: { name: "Jianzhou Jurchens", color: "#4d2a33", aliases: ["젠저우 여진", "건주여진", "Jianzhou"] },
    TIB: { name: "Phagmodrupa Tibet", color: "#776f8b", aliases: ["파그모드루파 티베트", "티베트", "U", "Ü-Tsang", "Tibet"] },
    // ── The pre-contact Americas (로스터 확장 4 — 파차쿠티 6년차의 안데스: 잉카는 아직 쿠스코의 왕국이다) ──
    CHM: { name: "Kingdom of Chimor", color: "#476f71", aliases: ["치무 왕국", "치무", "Chimu", "Chimor", "Chan Chan"] },
    ICH: { name: "Ichma", color: "#611b24", aliases: ["이치마", "파차카막", "Ichma", "Ychsma", "Pachacamac"] },
    WAN: { name: "Wanka", color: "#c1a98a", aliases: ["완카", "우앙카", "Wanka", "Huanca"] },
    HUY: { name: "Huaylas", color: "#417054", aliases: ["우아일라스", "Huyla", "Huaylas", "Callejón de Huaylas"] },
    CAJ: { name: "Cajamarca", color: "#a77d57", aliases: ["카하마르카", "쿠이스만쿠", "Cajamarca", "Cuismancu"] },
    CHP: { name: "Chachapoya", color: "#94aebe", aliases: ["차차포야", "구름의 전사들", "Chachapoya", "Chachapoyas"] },
    COL_A: { name: "Colla", color: "#c9d2a5", aliases: ["코야", "코야오", "Colla", "Qulla", "Collao"] },
    PAC: { name: "Pacajes", color: "#908eab", aliases: ["파카헤스", "Pacajes", "Pakasa"] },
    CRC: { name: "Charca", color: "#eba5f6", aliases: ["차르카", "Charca", "Charcas"] }, // 코드 주의: CHA는 참파의 것(중복 키 사고 실측 — 참파가 이겨 포토시가 참파령이 됐었다)
    QUI: { name: "Quito", color: "#aa7474", aliases: ["키토", "키투-카랑키", "Quito", "Quitu", "Caranqui"] },
    MUI: { name: "Muisca Confederation", color: "#f4de52", aliases: ["무이스카 연맹", "무이스카", "Muisca", "Chibcha"] },
    CAL: { name: "Calchaquí", color: "#654a77", aliases: ["칼차키", "디아기타", "Calchaqui", "Diaguita"] },
    GUA: { name: "Guaraní", color: "#905349", aliases: ["과라니", "Guarani"] },
    CHR: { name: "Charrúa", color: "#987d7a", aliases: ["차루아", "Charrua"] },
    CAR: { name: "Carib", color: "#1c5f3d", aliases: ["카리브", "칼리나고", "Carib", "Kalinago"] },
    TAP: { name: "Tapuia", color: "#fbdb8c", aliases: ["타푸이아", "세르탕 부족들", "Tapuia"] },
    POT: { name: "Potiguara", color: "#CCCCCC", aliases: ["포티구아라", "Potiguara"] },
    TUP: { name: "Tupinambá", color: "#b66e5f", aliases: ["투피남바", "Tupinamba"] },
    // ── The Irish lordships (로스터 확장 3 — 원본 색 그대로; 영주령은 이제 정말 페일과 그 언저리다) ──
    DES: { name: "Earldom of Desmond", color: "#e57272", aliases: ["데즈먼드 백국", "데즈먼드", "Desmond", "FitzGerald Desmond"] },
    KID: { name: "Earldom of Kildare", color: "#87a8dd", aliases: ["킬데어 백국", "킬데어", "Kildare", "FitzGerald Kildare"] },
    THO: { name: "Kingdom of Thomond", color: "#8db8bc", aliases: ["토몬드 왕국", "토몬드", "Thomond", "O'Brien Thomond"] },
    TYR: { name: "Tyrone", color: "#b58a75", aliases: ["티론", "오닐 티론", "O'Neill Tyrone", "Tír Eoghain"] },
    SLI: { name: "Sligo", color: "#edc2fc", aliases: ["슬라이고", "오코너 슬라이고", "O'Connor Sligo", "Sligeach"] },
    CLA: { name: "Clanricarde", color: "#dfff8e", aliases: ["클랜리카드", "버크 클랜리카드", "Clanricarde", "Clarnicarde", "Burke Galway"] },
    LEI: { name: "Kingdom of Leinster", color: "#40d642", aliases: ["레인스터 왕국", "레인스터", "Leinster", "MacMurrough Kavanagh"] },
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
    // 로스터 확장 4: INC:["PER","BOL","ECU"] 통칠을 걷어냈다 — 1444의 잉카는
    // 쿠스코의 왕국이고(파차쿠티 6년차), 안데스는 아직 정복당하지 않은
    // 왕국들의 모자이크다. 지역 배정은 아래 regionAssignments의 아메리카 절.
    GUA: ["PRY"],  // 과라니 테코아들 — 파라과이 전역
    CHR: ["URY"],  // 차루아 카시케들
    // 로스터 확장 5 — 아시아 국가 단위분
    KOT: ["LKA"],  // 파라크라마바후 6세의 코테 — 자프나 통일(1450)은 6년 뒤지만 팔레트에 자프나가 없어 섬 전체 근사
    LXA: ["LAO"],  // 사이냐착카팟의 란상
    BRU: ["BRN"],  // 브루나이 술탄국
    MGL: ["MNG"],  // 북원 — 서부 아이막은 지역 배정으로 오이라트에
    OMA: ["OMN"],  // 나브하니 오만
    BHN: ["BHR"], QTR: ["QAT"], // 자브리드 걸프 — 팔레트가 둘을 나눠 그대로 따름
    YMN: ["YEM"],  // 라술 말기의 예멘
    ADA: ["DJI"],  // 아달의 다나킬 해안(확장 6)
    CAR: ["DMA", "GRD", "LCA", "ATG", "KNA", "GLP", "MTQ", "BRB", "TTO"], // 칼리나고의 소앤틸리스 — 대앤틸리스(타이노)는 팔레트에 폴리티가 없어 미배정 유지; VCT·MSR·AIA는 GADM 시드에 GID_0가 없어 제외(검증기 실측)
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
    "TUR.43_1": "OTT", "TUR.13_1": "OTT", "TUR.81_1": "OTT", "TUR.72_1": "OTT", // (46·70은 확장5에서 CND로)
    "TUR.53_1": "KRM", "TUR.44_1": "KRM", "TUR.5_1": "KRM", "TUR.62_1": "KRM", "TUR.61_1": "KRM", "TUR.58_1": "KRM", "TUR.47_1": "KRM", // Karaman — Konya's rival court
    "TUR.75_1": "TRE", "TUR.65_1": "TRE", "TUR.34_1": "TRE", "TUR.63_1": "TRE", "TUR.35_1": "TRE", // the Komnenoi's Pontic shore
    "TUR.26_1": "AKK", "TUR.57_1": "AKK", "TUR.68_1": "AKK", "TUR.48_1": "AKK", "TUR.2_1": "AKK", // Diyarbakır — Uzun Hasan's rising house (33·55·42는 확장5에서 DUL로)
    "TUR.37_1": "MAM", // Hatay in the Mamluk orbit (Adana·Osmaniye는 확장5에서 RAM으로)
    "TUR.31_1": "KAR", "TUR.30_1": "KAR", "TUR.15_1": "KAR", "TUR.76_1": "KAR", "TUR.17_1": "KAR", "TUR.29_1": "KAR",
    "TUR.60_1": "KAR", "TUR.18_1": "KAR", "TUR.78_1": "KAR", "TUR.4_1": "KAR", "TUR.38_1": "KAR", "TUR.69_1": "KAR", "TUR.14_1": "KAR", "TUR.71_1": "KAR", "TUR.36_1": "KAR", // Jahan Shah's east
    "TUR.45_1": "GEO", "TUR.9_1": "GEO", "TUR.10_1": "GEO", // Samtskhe marches
    // 로스터 확장 5 — 아나톨리아 베이릭 셋 (오스만·맘루크·양조 사이의 진짜 완충들)
    "TUR.46_1": "CND", "TUR.70_1": "CND", // Kastamonu·Sinop — 이스펜디야르 후국(오스만 봉신이나 별개 왕조)
    "TUR.1_1": "RAM", "TUR.64_1": "RAM",  // Adana·Osmaniye — 라마잔 후국(맘루크 봉신; 이전 MAM 직할 근사를 교체)
    "TUR.42_1": "DUL", "TUR.55_1": "DUL", "TUR.33_1": "DUL", // Maraş·Malatya·Antep — 둘카디르(이전 AKK 근사를 교체; 1444 실보유)
    // ── Greece: Byzantium's last province and the Latin sea ──
    "GRC.7_1": "BYZ",  // the Morea — Constantine Palaiologos, despot
    "GRC.3_1": "ATH",  // Nerio II Acciaioli's duchy — made tributary by the despot's 1444 campaign, but the duke still rules (원본 분리색)
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
    "GBR.1_1": "ENG", "GBR.4_1": "ENG",
    "GBR.3_1": "SCO",
    "GBR.2_1": "TYR", // Ulster — Eoghan O'Neill's country; the earldom is a memory and the crown's writ stops at Dundalk
    // Ireland beyond the Pale (로스터 확장 3): the Lordship shrinks to what
    // the Dublin council actually governs in 1444 — the spec's old comment
    // ("in truth the Pale and little else") becomes the map.
    "IRL.8_1": "DES", "IRL.4_1": "DES", "IRL.13_1": "DES", "IRL.23_1": "DES", // Kerry, Cork, Limerick, Waterford — the Usurper Earl's palatinate
    "IRL.22_1": "DES", // Tipperary — Butler Ormond country in truth, but the palette has no Ormond; the rival FitzGerald color is the nearest sphere
    "IRL.3_1": "THO",  // Clare — O'Brien's kingdom
    "IRL.7_1": "CLA", "IRL.16_1": "CLA", // Galway and Mayo — the two Burke lordships in one color
    "IRL.21_1": "SLI", "IRL.12_1": "SLI", "IRL.20_1": "SLI", // Sligo, Leitrim, Roscommon — O'Connor country
    "IRL.5_1": "TYR", "IRL.2_1": "TYR", "IRL.18_1": "TYR", // Donegal (O'Donnell rides the Ulster color), Cavan, Monaghan
    "IRL.10_1": "LEI", "IRL.1_1": "LEI", "IRL.25_1": "LEI", "IRL.26_1": "LEI", // Kilkenny, Carlow, Wexford, Wicklow — MacMurrough's Leinster
    "IRL.9_1": "KID", "IRL.11_1": "KID", "IRL.19_1": "KID", "IRL.24_1": "KID", "IRL.14_1": "KID", // Kildare, Laois, Offaly, Westmeath, Longford — the earl's march beyond the Pale
    // (Dublin, Meath, Louth stay ENG — the Pale itself, via the IRL baseline)
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
    "DZA.6_1": "HAF", "DZA.9_1": "HAF", "DZA.24_1": "HAF", // 오레스(바트나·비스크라·헨셸라) — 하프스 쪽 산지(확장 6에서 추가)
    // ── Italy (로스터 확장 2: 에밀리아·토스카나는 레벨2로 쪼갠다) ──
    "ITA.13_1": "SAV", "ITA.19_1": "SAV",
    "ITA.9_1": "GEN",
    "ITA.10_1": "MIL",  // Filippo Maria Visconti's last years
    "ITA.20_1": "VEN", "ITA.7_1": "VEN", "ITA.17_1": "VEN", // the Terraferma proper
    // Emilia was never Venetian — the old ITA.6→VEN line was the map's worst
    // Italian lie. At province granularity, 1444:
    "ITA.6.2_1": "FER", "ITA.6.4_1": "FER", "ITA.6.8_1": "FER", // Leonello d'Este's Ferrara, Modena, Reggio
    "ITA.6.5_1": "MIL", "ITA.6.6_1": "MIL", // Parma and Piacenza — Visconti
    "ITA.6.1_1": "PAP", "ITA.6.3_1": "PAP", "ITA.6.9_1": "PAP", // Bologna (Bentivoglio), Forlì (Ordelaffi), Rimini (Malatesta) — papal vicars all
    "ITA.6.7_1": "VEN", // Ravenna — da Polenta fell to the Serenissima in 1441
    // Tuscany at province granularity (레벨1 FLO 확장이 레벨2 특정 배정을
    // 덮는 것이 1차 빌드 실측 — 그래서 전부 명시한다):
    "ITA.16.5_1": "LUC", // the republic behind its walls
    "ITA.16.10_1": "SIE", "ITA.16.3_1": "SIE", // Siena and its Maremma
    "ITA.16.1_1": "FLO", "ITA.16.2_1": "FLO", "ITA.16.4_1": "FLO", "ITA.16.6_1": "FLO",
    "ITA.16.7_1": "FLO", "ITA.16.8_1": "FLO", "ITA.16.9_1": "FLO", // Cosimo's Florence — Pisa since 1406, Livorno since 1421 (Massa's Malaspina ride the Florentine color)
    "ITA.8_1": "PAP", "ITA.18_1": "PAP", "ITA.11_1": "PAP",
    "ITA.12_1": "NAP", "ITA.1_1": "NAP", // Molise and Abruzzo — the Regno's north, not the Patrimony
    "ITA.5_1": "NAP", "ITA.2_1": "NAP", "ITA.3_1": "NAP", "ITA.4_1": "NAP", // the mainland Regno — Alfonso's second crown, Ferrante's inheritance
    "ITA.15_1": "ARA", "ITA.14_1": "ARA", // Trinacria and Sardinia stay the Crown of Aragon's own
    // ── Provence and the Rhône (르네 당주 — 왕국 밖 제국권 백국) ──
    "FRA.13.1_1": "PRO", "FRA.13.3_1": "PRO", "FRA.13.5_1": "PRO", // the Good King René's county
    "FRA.13.2_1": "SAV", // Nice — Savoyard since the 1388 dedition
    "FRA.13.6_1": "PAP", // Avignon and the Comtat Venaissin — papal until 1791
    // (FRA.13.4 Hautes-Alpes is the Dauphiné and stays with the crown)
    // ── Poland, Prussia, Russia ──
    "POL.11_1": "TEU", "POL.14_1": "TEU", // the Ordensstaat — Thirteen Years' War is a decade out
    "RUS.21_1": "TEU",  // Königsberg
    // The western voivodeships were riding the MODERN border (the fused
    // Poland-Lithuania face had to be excluded, so no era face carves here).
    // Poland's real western border runs far east of the Oder-Neisse —
    // assigned by hand, now to the original's own polities (로스터 확장 1).
    "POL.1_1": "SIL", "POL.8_1": "SIL", "POL.12_1": "SIL", // the Silesian duchies — Piast dukes under the Bohemian crown (Trenčín 1335, until 1742); the original draws them as their own color
    "POL.5_1": "BRA",  // Lubusz land — Brandenburg's Neumark
    "POL.16_1": "POM", // the Griffin duchy of Pomerania-Stettin
    // ── Germany at Regierungsbezirk granularity — the princes of 1444 ──
    // The imperial faces are retired (excludeFaces below): OHM has no German
    // core and the crude 1400 aggregate could only paint grey. The hand
    // mosaic below IS the best available source for the Reich's interior.
    "DEU.DED2": "SAX", "DEU.DED4": "SAX", "DEU.DED5": "SAX", // the Wettin margraviate of Meissen
    "DEU.DEG0": "SAX", // Thuringia — Wettin since 1264 (the Leipzig division is 1485, forty years out)
    "DEU.DEE0": "SAX", // Wittenberg electoral core (Magdeburg's archbishopric approximated in)
    "DEU.DE40": "BRA", "DEU.DE30": "BRA", // Friedrich II Hohenzollern's electorate
    "DEU.DE21": "BAV", "DEU.DE22": "BAV", // Munich and Landshut Wittelsbach lines
    "DEU.DE23": "BAV", // Upper Palatinate — Palatinate-Neumarkt Wittelsbach (its duke Christopher wears the Kalmar crown this year!); no Kurpfalz polity, so the family color carries it
    "DEU.DE11": "WUR", "DEU.DE14": "WUR", // the county of Württemberg
    "DEU.DE12": "BAD", // the margraviate of Baden
    "DEU.DE13": "HAB", // Freiburg/Breisgau — Further Austria, Habsburg since 1368
    "DEU.DE71": "HES", "DEU.DE72": "HES", "DEU.DE73": "HES", // Ludwig I's united landgraviate
    "DEU.DEA1": "KLE", // Cleves and Berg approximated under Johann I's Cleves-Mark
    "DEU.DEA5": "KLE", // the county of Mark
    "DEU.DEA3": "MUN", // the prince-bishopric
    "DEU.DE91": "BRK", "DEU.DE92": "BRK", // Brunswick-Wolfenbüttel and Calenberg — Welf lands
    "DEU.DE93": "LUN", // the Celle line
    "DEU.DE94": "OLD", // the county of Oldenburg (East Frisia's chieftains ride along at this granularity)
    "DEU.DEF0": "HOL", // Adolf VIII Schauenburg — imperial Holstein and Danish-fief Schleswig, one realm
    "DEU.DE80": "MEC", // the duchy of Mecklenburg (Vorpommern rides along)
    "DEU.DE26": "WZB", // the prince-bishopric of Würzburg
    // Remainder stays the grey HRE filler, deliberately: DE24/25 (Hohenzollern
    // Franconia, divided from the electorate in 1440), DE27 (Swabian free
    // cities), DE50/60 (Bremen, Hamburg), DEA2/DEA4 (Cologne's electorate,
    // Lippe), DEB1/2/3 (Trier, the Kurpfalz), DEC0 — the Empire between.
    // ── The Low Countries: Burgundy keeps what Philip actually holds ──
    "NLD.3_1": "FRI", "NLD.5_1": "FRI", // the free Frisians — no lord until 1498
    "NLD.11_1": "HRE", "NLD.10_1": "HRE", "NLD.1_1": "HRE", // the Sticht and Oversticht of Utrecht — church land, not Burgundian until 1456
    "NLD.4_1": "HRE", "NLD.7_1": "HRE", // Guelders under Arnold of Egmond — Burgundian only in 1473
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
    "IND.36_1": "BEN", // Bengal (Jharkhand는 확장5에서 JHA로)
    "IND.20_1": "BAH", "IND.32_1": "BAH", "IND.2_1": "BAH", "IND.16_1": "BAH", "IND.10_1": "BAH", // the Deccan sultanate
    "IND.31_1": "VIJ", "IND.17_1": "VIJ", "IND.27_1": "VIJ", // Deva Raya II's empire
    // (the north stays with Delhi's baseline — Malwa, Gujarat, Jaunpur approximated in)
    // ── Africa subdivided (로스터 확장 6) ──
    // 자이얀 틀렘센 — 텔 아틀라스의 서·중부 25지역(아불아바스 아흐마드 알아킬).
    // 콘스탄티노이스+오레스는 하프스 수작업, 심장 사하라는 미배정 유지.
    "DZA.48_1": "TLE", "DZA.3_1": "TLE", "DZA.32_1": "TLE", "DZA.38_1": "TLE", "DZA.30_1": "TLE",
    "DZA.27_1": "TLE", "DZA.36_1": "TLE", "DZA.14_1": "TLE", "DZA.35_1": "TLE", "DZA.46_1": "TLE",
    "DZA.43_1": "TLE", "DZA.4_1": "TLE", "DZA.45_1": "TLE", "DZA.10_1": "TLE", "DZA.2_1": "TLE",
    "DZA.28_1": "TLE", "DZA.13_1": "TLE", "DZA.47_1": "TLE", "DZA.12_1": "TLE", "DZA.16_1": "TLE",
    "DZA.25_1": "TLE", "DZA.26_1": "TLE", "DZA.11_1": "TLE", "DZA.31_1": "TLE", "DZA.17_1": "TLE",
    // 아프리카의 뿔 — 곰릿 전투(1445) 전야의 아달과 그 이웃들
    "ETH.9_1": "ADA", "ETH.7_1": "ADA", "ETH.5_1": "ADA", "ETH.2_1": "ADA", // 하라르·디레다와·소말리·아파르 — 바들라이의 술탄국
    "SOM.1_1": "ADA", "SOM.18_1": "ADA", "SOM.17_1": "ADA", // 아우달·워쿠이갈베드·토그데르
    "SOM.13_1": "WAR", "SOM.4_1": "WAR", "SOM.16_1": "WAR", // 사나그·바리·솔 — 와르상갈리(하르티) 해안
    "SOM.3_1": "AJU", "SOM.14_1": "AJU", "SOM.15_1": "AJU", "SOM.8_1": "AJU", "SOM.6_1": "AJU", "SOM.5_1": "AJU", "SOM.2_1": "AJU", // 베나디르와 샤벨레 유역 — 아주란
    "SOM.7_1": "MRH", "SOM.9_1": "MRH", "SOM.10_1": "MRH", // 주바 유역 — 마레한 (무두그·누갈은 미배정 유목지)
    "ETH.8_1": "BOR", // 오로미아 — 가다 회의의 보라나(팔레트 패리티; 16세기 오로모 대이동 전이라 근사임을 명기)
    "ETH.10_1": "SID", // 남부 제족 — 시다마 왕들
    // 스와힐리 해안 — 킬와의 금 항로 (내륙과 무타파는 팔레트 부재로 미배정)
    "TZA.2_1": "KIL", "TZA.20_1": "KIL", "TZA.10_1": "KIL", "TZA.15_1": "KIL", "TZA.27_1": "KIL",
    "TZA.28_1": "KIL", "TZA.29_1": "KIL", "TZA.30_1": "KIL", "TZA.18_1": "KIL", "TZA.19_1": "KIL", // 잔지바르·펨바
    "MOZ.1_1": "KIL", "MOZ.7_1": "KIL", "MOZ.11_1": "KIL", "MOZ.9_1": "KIL", // 카부델가두·남풀라·잠베지아·소팔라
    // 기니만 — 에우아레 대왕의 베냉과 초기 오요
    "NGA.12_1": "BNI", "NGA.10_1": "BNI", // 에도·델타
    "NGA.31_1": "OYO", "NGA.30_1": "OYO", "NGA.24_1": "OYO", // 오요·오순·콰라
    "MDG.1_1": "MER", // 이메리나 고원 (나머지 마다가스카르는 미배정)
    // ── Asia subdivided (로스터 확장 5) ──
    "SAU.11_1": "HED", "SAU.5_1": "HED", "SAU.13_1": "HED", // Makkah·Madinah·Tabuk — 샤리프 바라카트 1세, 맘루크 종주권 아래 별개색(원본 방식)
    "AZE.1_1": "SHI", "AZE.3_1": "SHI", "AZE.8_1": "SHI", "AZE.9_1": "SHI", // 쿠라강 이북 — 시르반샤 할릴룰라의 나라; 이남(아란·카라바흐·나흐치반)은 흑양조 잔류
    "IRN.11_1": "HRM", // Hormozgan — 호르무즈 왕국(인도양 무역의 관문, 티무르 조공국이나 사실상 독립)
    "IRN.15_1": "MUS", // Khuzestan — 1436년부터 무함마드 이븐 팔라흐의 무샤샤
    "RUS.1_1": "CIR", "RUS.20_1": "CIR", "RUS.25_1": "CIR", // 아디게·카바르다·카라차이 — 체르케스(4차 확장의 대호드 수용을 팔레트 정답으로 교체)
    "IND.34_1": "JAU", // Uttar Pradesh — 샤르키 자운푸르의 절정기(사이드 델리의 영은 팔람 너머로 못 간다)
    "IND.29_1": "MEW", // Rajasthan — 라나 쿰바의 메와르(마르와르가 얹혀 감, 주석)
    "IND.15_1": "JHA", // Jharkhand — 나그반시 라자들(이전 BEN 근사를 교체)
    "IND.4_1": "ASM",  // Assam — 아홈 왕국
    "IND.33_1": "TRI", // Tripura — 마니키야 왕조
    "PAK.8_1": "SND",  // Sindh — 삼마 잠들(티무르 통칠에서 분리)
    "MMR.11_1": "ARK", // Rakhine — 민 카이의 므라우크우
    "MMR.2_1": "PEG", "MMR.15_1": "PEG", "MMR.9_1": "PEG", "MMR.1_1": "PEG", // 바고·양곤·몬·에야와디 — 한타와디(빈냐 란 1세)
    "MMR.13_1": "HSI", // Shan — 샨 사오파들(시포 색으로 집약; Mong Nai·Mong Yang은 granularity 불가, 기록만)
    "CHN.11_1": "HAI", // Heilongjiang — 하이시 여진(누르간 도사 철수 1434 이후)
    "CHN.17_1": "JZH", // Jilin — 건주여진 이만주(훗날 청의 요람)
    "CHN.19_1": "MGL", // Nei Mongol — 명의 장성 이북 철수(1430년대) 이후 몽골의 초원
    "Z03.29_1": "TIB", "Z08.29_1": "TIB", // Xizang(분쟁지 의사국가 id) — 파그모드루파 곤마의 위짱(Tsang·Kham 분리는 granularity 불가)
    "MNG.2_1": "OIR", "MNG.22_1": "OIR", "MNG.13_1": "OIR", "MNG.9_1": "OIR", "MNG.10_1": "OIR", // 서부 아이막 — 에센의 오이라트 본거지(나머지는 북원 기반선)
    // ── The Andes and the New World (로스터 확장 4 — 정복 이전의 지도) ──
    // 파차쿠티는 1438년 창카를 꺾고 즉위해 이제 6년차: 잉카는 쿠스코 분지의
    // 왕국이다. 치모르 정복 ~1470, 코야오 ~1450년대, 키토 ~1463 — 전부
    // 플레이어가 굽힐 수 있는 미래다.
    "PER.8_1": "INC", "PER.3_1": "INC", "PER.5_1": "INC", // Cusco, Apurímac, Ayacucho — 창카 전쟁(1438)으로 막 삼킨 땅까지
    "PER.13_1": "CHM", "PER.14_1": "CHM", "PER.25_1": "CHM", "PER.21_1": "CHM", // Chan Chan의 북부 해안 제국
    "PER.15_1": "ICH", "PER.16_1": "ICH", "PER.7_1": "ICH", "PER.11_1": "ICH", // 파차카막의 신탁 해안(친차 문화권 근사 포함)
    "PER.12_1": "WAN", "PER.9_1": "WAN", "PER.20_1": "WAN", "PER.10_1": "WAN", // 만타로 분지의 완카 연맹(고지 야로 권역 근사)
    "PER.2_1": "HUY",  // 우아일라스 회랑
    "PER.6_1": "CAJ",  // 쿠이스만쿠의 카하마르카
    "PER.1_1": "CHP", "PER.23_1": "CHP", // 구름숲의 차차포야
    "PER.22_1": "COL_A", "PER.4_1": "COL_A", "PER.19_1": "COL_A", "PER.24_1": "COL_A", // 티티카카의 코야와 아이마라 남부
    // (Loreto·Madre de Dios·Ucayali는 아마조니아 — 미배정 설계)
    "BOL.4_1": "PAC",  // 파카헤스의 알티플라노
    "BOL.5_1": "CRC", "BOL.7_1": "CRC", "BOL.1_1": "CRC", "BOL.2_1": "CRC", "BOL.9_1": "CRC", // 차르카 연맹
    // (Beni·Pando·Santa Cruz는 저지 — 미배정)
    "ECU.4_1": "QUI", "ECU.11_1": "QUI", "ECU.19_1": "QUI", "ECU.6_1": "QUI", "ECU.23_1": "QUI",
    "ECU.5_1": "QUI", "ECU.2_1": "QUI", "ECU.3_1": "QUI", "ECU.1_1": "QUI", "ECU.12_1": "QUI", // 시에라의 키투-카랑키 수장국들
    // (해안 만테뇨·우앙카비야와 오리엔테는 미배정; 갈라파고스는 무인도)
    "COL.15_2": "MUI", "COL.7_2": "MUI", "COL.5_2": "MUI", // 바카타의 시파와 훈사의 사케 — 무이스카 고원
    "ARG.17_1": "CAL", "ARG.10_1": "CAL", "ARG.24_1": "CAL", "ARG.2_1": "CAL", // 칼차키 계곡의 디아기타
    "ARG.14_1": "GUA", "ARG.7_1": "GUA", // 과라니의 남서 연장
    "BRA.5_1": "TUP", "BRA.26_1": "TUP", "BRA.2_1": "TUP", "BRA.8_1": "TUP", "BRA.19_1": "TUP", // 투피남바 해안(바이아~리우)
    "BRA.6_1": "POT", "BRA.20_1": "POT", "BRA.15_1": "POT", "BRA.17_1": "POT", // 포티구아라의 북동 첨단
    "BRA.18_1": "TAP", "BRA.10_1": "TAP", // 세르탕의 타푸이아
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
    ["Cologne", "Cologne", 2, 40000], // the Empire's largest city, a free city in an elector's shadow
    ["Lübeck", "Lübeck", 2, 25000], // queen of the Hansa
    ["Nuremberg", [11.08, 49.45], 2, 22000], // the Empire's workshop
    ["Augsburg", [10.9, 48.37], 1, 20000], // Fugger money is one generation away
    ["Breslau", [17.03, 51.11], 1, 20000], // Silesia's capital under the Bohemian crown
    ["Danzig", [18.65, 54.35], 1, 20000], // the Order's rich, restive port — ten years from revolt
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
    "APPROXIMATIONS the rules carry: the great lay princes of the Empire are drawn " +
    "(Wettin Saxony, Hohenzollern Brandenburg, the Wittelsbach duchies, the Welf lands, " +
    "Hesse, Württemberg, Baden, Cleves, Holstein, Mecklenburg, the Silesian and " +
    "Pomeranian duchies), while the remaining grey Imperial color stands for the " +
    "ecclesiastical electorates, free cities and minor counts between them — an " +
    "election, not a state; the Delhi color covers Malwa and " +
    "Gujarat which are sovereign in fact (Jaunpur and Mewar are drawn); Granada's color overfills the true " +
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

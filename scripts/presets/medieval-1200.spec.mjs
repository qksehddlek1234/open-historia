/*! Open Historia — Medieval 1200 scenario preset © 2026 Nicholas Krol, MIT (see src/Editor/LICENSE). */
// Medieval preset — c. 1200 AD (the High Middle Ages).
//
// A best-effort repartition of the modern admin-1 map into the polities of the
// year 1200. Europe, the Mediterranean and the Near East are detailed; the major
// Asian states (Song/Jin China, Kamakura Japan, Goryeo, Khmer, Khwarazm, Abbasid
// Baghdad, Georgia) are included; genuinely fragmented/steppe/tribal regions
// (the Americas, Central Asian steppe, much of India & sub-Saharan Africa) are
// left at their modern default, which the engine tolerates gracefully.
//
// Borders snap to modern provinces, so frontiers are approximate. Sub-national
// medieval realms that don't align with modern provinces (e.g. England holding
// Normandy & Aquitaine inside France) cannot be drawn and live in simulationRules.

export default {
  id: "medieval-1200",

  meta: {
    name: "Medieval — 1200 AD",
    heroTitle: "An Age of Faith and Iron",
    heroSubtitle: "Emperors, caliphs and crusaders share one crowded world",
    eyebrow: "High Middle Ages",
    subtitle: "c. 1200 AD",
    accentColor: "#9a6b2f",
    coverImage: "public/loading_screen_4.jpg",
    description:
      "The year 1200, and no single power rules anything. The Hohenstaufen emperors and the Capetian kings pull Europe apart between them while the Angevins hold an empire from Yorkshire to the Pyrenees. Constantinople still stands, four years from the crusade that will sack it. The Almohads rule from Marrakesh to Seville and Saladin's heirs hold Cairo and Damascus, with the Crusader states pressed into a coastal strip they can no longer defend alone. Further east the Ghurids ride into India and a Mongol chieftain is uniting the steppe tribes nobody has heard of yet. Take a kingdom, an empire or a caliphate into the century that decides which of them survives.",

  },

  // Player starts as the Holy Roman Empire. game.country MUST equal the owner code.
  game: { country: "HRE", startDate: "1200-01-01", gameDate: "1200-01-01" },

  // ── Plan F: 시대 경계 그래프트 — 중세 하이브리드 rung 1+3 (2026-08-15 승격) ──
  // 08-14엔 조립이 없어 rung-3 단독으로 세웠고, PC 추출 러너가 실조립을
  // 내놓자 예고대로 파일만 갈아끼웠다: OHM 1200 조립(rung 1, 면 26) 위에
  // world_1200 백필(rung 3, 대륙 스케일, GPL-3.0 개인 이용) 50면.
  // 백필 문턱 0.9가 실조립에서 그대로 작동했다 — 카스티야 100%·브르타뉴
  // 97%·포르투갈 97%·앙주 97%·크로아티아 92%가 rung-1 커버로 스킵됐다.
  // 두 계층 모두 라벨이 거짓말을 한다: world_1200은 시대착오(파티마 1171
  // 몰락, 부와이흐 1055, 가즈나 1186), OHM 조립은 de jure 이름(아래 셋).
  // 전부 포인트 테스트(도시 ∈ 면) 실측으로 붙였다 — 추정 없음.
  eraGeometry: {
    date: "1200-01-01",
    window: [-15, 30, 50, 72],
    file: "scripts/ohm/out/era-borders-1200-01-01-z4-hybrid.geojson",
    excludeFaces: [
      // ── rung 1 제외 (OHM 조립면 26 중) ──
      "Imperium Romanum Orientale", // 라벨 거짓말: 콘스탄티노플·테살로니키·아테네 out / 스미르나·코니아·트레비존드 IN — 아나톨리아 덩어리다. BYZ에 주면 럼 술탄국(수작업 SELJ)을 통째로 삼킨다
      "Archiepiscopatus Rigensis", // 리가 대주교령은 **1201년 창건** — 확장 1에서도 회수하지 않았다. 로스터에 없어서가 아니라 보드 날짜에 아직 존재하지 않아서다
      "Couto Misto", // 로스터 밖 미소 정체
      // ── rung 3 제외 (world_1200) ──
      "Buwayhid Emirates", // 1055년 몰락 라벨이 이라크+서페르시아를 한 면에 — ABBS와 KHWA 두 폴리티에 걸쳐 분할 불가; 기반선(IRQ→ABBS, IRN→KHWA)이 담당
      "Kwarizm-Shah", // 실측: 마크란 프레임 파편(전 기준도시 out) — PAK은 GHUR 기반선 유지
      "Celtic kingdoms", // Dublin·Cork·Cardiff IN — 한 면이 아일랜드와 웨일스를 함께 뭉갠 라벨이다. 확장 1이 그 땅을 GWYN·POWY·DESM·THOM 넷으로 갈랐으므로 이 면은 이제 **분해할 수 없는 중복**이다 (더블린은 앙주 영주령으로 남는다)
      "Sardinia", // 같은 이유의 중복: 유디카티 둘을 회수했으니 사르데냐 통짜 면은 그 위를 덮을 뿐이다 — 로구도로·갈루라 잔여는 ITA.14→HRE 근사 유지
      "Muscat", "Ibadites", // 나브하니 이맘국(1154~)은 실재하지만 두 면이 같은 오만 땅을 두고 겹친다 — 기준도시 실측 없이 어느 쪽을 채택할지 못 정한다. 다음 배치
      "Berber Tribes", "Tuareg Nomadic Tribes", // 부족 연맹은 정치체가 아니다 — 1444 선례
      "Paleo-Siberian hunter-gatherers", "Finno-Ugric taiga hunter-gatherers", // 무국가 타이가 — 미배정 설계
      "Guanches", "Sámi", // 1444와 같은 이유
    ],
    faceOwners: {
      // ── rung 1 (OHM 조립면 → 보드 코드; de jure 이름의 실측 교정 셋) ──
      "Reaume de France": "ENG_A", // **기하 진실**: 앙제·르망·푸아티에·리모주·캉·루앙·보르도·바욘·렌 IN / 파리·오를레앙·부르주·랭스·디종 out — 프랑스 왕국 이름을 쓴 앙주 대륙령이다. 스펙 머리말이 "그릴 수 없다"던 바로 그것(노르망디·앙주·아키텐)을 실데이터가 그린다
      "Reino de León": "POR_K", // **기하 진실**: 포르투·코임브라·브라가·리스본·파루 IN / 레온·사모라·살라망카·바다호스 out — 레온 이름을 쓴 포르투갈이다
      "Kingdom of England": "ENG_A", // 요크·엑서터·노리치 IN(칼라일·스완지 out) — 잉글랜드 본토
      "Reino de Castilla": "CAST", // 톨레도·부르고스·쿠엥카 IN, 세비야 out(알모하드) — 실측 정합
      "Aragonum et Catalonie": "ARAG", // 사라고사·바르셀로나·페르피냥 IN, 발렌시아 out(알모하드) — 정합
      "Regnum Hungariae": "HUNG", // 에스테르곰·자그레브·스플리트·클루지·브라티슬라바 IN — 1200 달마티아는 헝가리 왕관(베네치아 점령은 1420년대)
      "Sacrum Imperium Romanum": "HRE", // 쾰른·아헨만 IN — 라인란트 부분면(1444와 같은 부분-실재)
      "Status Ecclesiasticus": "PAPAL", // 로마·페루자·안코나 IN / 나폴리·피렌체 out — 교황령 정합
      "Rìoghachd na h-Alba": "SCOT",
      "Новгородская республика": "RUS_K", // 노브고로드·아르한겔스크 IN, 모스크바·프스코프 out — 북방 공화국
      "Principality of Murom-Ryazan": "RUS_K", // 랴잔·무롬 IN — 분열 루스는 단일 RUS_K(보드 설계)
      "Regnum Hierosolymitanum": "JERU", // 아크레·티레·하이파 IN — 다만 예루살렘·나블루스·가자까지 무는 de jure 왕국이라 내륙은 울타리로(1187년 이후 그 땅은 살라딘의 것)
      "Principatus Antiochenus": "JERU", // 안티오키아 — 보드는 십자군 국가들을 한 색으로
      "Comitatus Tripolitanus": "JERU", // 트리폴리 백국 — 동일
      // ── rung 3 (world_1200): 시대착오 라벨 → 1200-01-01의 실제 보유자 (전부 실측)
      "Fatimid Caliphate": "AYY", // 카이로·다마스쿠스·예루살렘 IN — 살라딘 사후의 아이유브 영역; 튀니스·십자군 해안 월권은 울타리로
      "Ghaznavid Emirate": "GHUR", // Herat·Kandahar IN — 1186년부터 구르 왕조의 것
      "Dutchy of Benevento": "SICI", // Benevento·Palermo IN — 노르만 시칠리아 왕국(어린 프리드리히 2세)
      "Burgandy": "HRE", // Geneva·Besançon IN, Dijon·Marseille out — 아를 왕국의 제국 동편(프랑슈콩테 백작은 바르바로사의 아들 오토)
      "Armenia": "GEOR", // Yerevan·Ani IN, 킬리키아 out — 자카리드 아르메니아, 타마르 여왕의 봉신(보드 GEOR가 ARM 담당)
      "Bulgar Khanate": "BULG", // Tarnovo·Sofia IN — 제2 불가리아 제국(1444의 교훈: 이름이 아니라 기하); 서부 월권은 울타리로
      // 분열 루스 → 단일 RUS_K (보드 설계)
      "Principality of Kyiv": "RUS_K",
      "Principality of Novgorod": "RUS_K",
      "Principality of Vladimir-Suzdal": "RUS_K",
      "Principality of Galicia-Volhynia": "RUS_K",
      "Other Rus Principalities": "RUS_K",
      // 별칭이 안 닿는 것들
      "León": "CAST", // 1200엔 분리 왕관(1230 통합 전)이지만 보드는 레온-카스티야 단일
      "Castilla": "CAST",
      "Navarre": "NAV", // 스펙 별칭은 "Navarra"
      "Cyprus": "JERU", // 뤼지냥 왕국(1192~) — 보드 JERU가 CYP 담당
      "Croatia": "HUNG", // Split IN — 1102년부터 헝가리 왕관 동군연합
      "Corsica": "HRE", // 피사령(교황 수여) — 제국 이탈리아 왕국권 근사
      "Britany": "FRA_K", // 서단 조각; 같은 반도의 "Kingdom of France" 동편 조각과 한 색으로(르 굴레 조약의 미묘함은 rules 텍스트가 담당)
      "Comté de Toulouse": "FRA_K", // 툴루즈 백작은 로스터에 없음 — 프랑스 왕관 근사
      "Aragón": "ARAG", // 악센트가 별칭("Aragon") 정확 일치를 깨서 명시 — 1차 빌드 미매칭 1건의 교정
      // ── 확장 1: 회수한 열한 면 ──
      "Teyrnas Gwynedd": "GWYN", // 1200년은 흐이웰린 압 이오르웨르스가 귀네드를 단독으로 쥔 해다
      "Powys Wenwynwyn": "POWY", // 포위스 남반부(그웬윈윈) — 북반부 포위스 파도그는 면이 없어 ENG_A 기반선에 남는다
      "Deasmhumhain": "DESM", // 데스몬드 — 맥카시
      "Tuamhain": "THOM", // 토몬드 — 오브라이언. 코나흐트·얼스터·렌스터는 면이 없어 앙주 영주령 근사에 남는다(정직한 미완)
      "Þjóðveldið Ísland": "ISLC", // 아이슬란드 자유국은 1262년까지 실재한다 — 노르웨이 왕관에 넣을 이유가 없었다
      "Iudicatus Karalitanus": "CAGL", // 칼리아리 판관국 — 굴리엘모 1세 디 마사
      "Judicate of Arborea": "ARBO", // 아르보레아 판관국
      "Великожупанска Србија": "BOSN", // **기하 진실**(1차 빌드 실측): 라스·니시 out / 사라예보·모스타르·브르치코 IN — 세르비아 대공국 이름을 쓴 쿨린 반의 보스니아다. 이름이 아니라 기하(1444의 교훈). 두브로브니크·포드고리차·슈코더르 월권은 울타리로
      "Kara Khitai Khaganate": "KKHI", // 1200년 서요는 중앙아시아 최강 종주국이다 — 카라한조·호라즘 위의 구르칸
      "Makkura": "MAKU", // 마쿠리아는 1200년에도 동골라를 쥔 기독교 왕국이다 — "사막 조각"이 아니라 나라였다
      "Cuman Khanates": "CUMA", // **설계 변경**: 쿠만 초원을 '비어있지 않은 미배정'으로 두던 원안을 뒤집는다. 데시티키프차크는 헝가리·루스·비잔티움이 상대하던 실체이고, 미배정으로 두면 지도에서 그 사실이 안 보인다. 아래 울타리 셋(HUNG·Galicia·CUMA)이 같은 땅을 두고 하던 합의도 이 결정에 맞춰 다시 썼다
    },
    faceKeepOut: {
      // rung-1 울타리 하나: de jure 왕국이 1187년 이후의 현실을 덮지 못하게.
      "Regnum Hierosolymitanum": ["PSE", "ISR.6", "ISR.5", "ISR.1", "ISR.2", "JOR"], // 예루살렘·나블루스·가자 IN, 그리고 1차 빌드 실측으로 **케라크·페트라·아카바(울트레주르뎅) 3지역까지** — 전부 하틴(1187) 직후 살라딘이 가져간 땅이다. 보드도 해안(ISR.3/4·LBN)만 수작업으로 십자군에 준다; 타르투스(성전기사단)·베이루트(1197 탈환)·아카르는 실측 정합이라 통과시킨다
      // 나머지는 rung-3(world_1200) 울타리 — 1·2차 빌드의 재배정/절단 로스터를 전량 읽고 친
      // 것들. 옳았던 월권(앙주 노르망디·아키텐 절취, 스코네→덴마크, 로도피
      // →비잔티움, 라만차→알모하드(알라르코스 이후), 알자스·프랑슈콩테·
      // 사부아→제국, 이스트리아 조각, 슐레스비히→덴마크)은 치지 않았다.
      "Byzantine Empire": ["TUR", "ITA", "GEO", "SYR"], // Konya·Ankara IN — 럼 술탄국 지대; 남이탈리아(1071년 상실); 1차 실측 추가: 조지아 서부(GEO.2)와 시리아 북부(SYR.11·14!)까지 칠하려 들었다
      "Fatimid Caliphate": ["TUN", "DZA", "LBY", "ISR", "LBN", "TUR"], // Tunis IN(1160부터 알모하드령) · Acre IN(십자군 수도!) — 이프리키야와 십자군 해안(ISR.3/4·LBN.5/7/8 수작업 JERU)·안티오크(TUR.37) 방어
      "Bulgar Khanate": ["SRB", "MNE", "XKO", "MKD", "GRC", "ALB", "HRV", "BIH", "ROU"], // Niš·Podgorica·Skopje IN + 1차 실측: 알바니아 11지역 전부(→BYZ 수작업), 라구사(HRV.3!), 보스니아, 왈라키아(쿠만 미배정 설계) — 칼로얀의 미래를 1200에 미리 칠하지 않는다
      "Armenia": ["TUR", "IRQ", "IRN", "AZE"], // 1차 실측: 자카리드 면이 반호·모술 북부·타브리즈 방면(AYY·ABBS·KHWA 수작업)과 시르반까지 조각을 뿌렸다 — 1199~1201의 아니·드빈 회복은 ARM·GEO 안에서만
      "Poland": ["CZE", "DEU", "AUT", "SVK"], // 1차 실측: 면이 보헤미아 10지역을 통째로 물었다(1198년 오타카르 1세의 왕관은 제국의 것) + 작센·바이에른 동부·오스트리아 조각 + 스피시(1412 전 헝가리)
      "Hungary": ["ROU", "CZE"], // 1444와 같은 수: 트란실바니아는 수작업 HUNG이 이미 담당(같은 색이라 잃는 것 없음), 수체아바·네암츠 등 몰다비아 방면 월권만 죽는다; 모라비아 조각(CZE.2·7)도 1444와 같은 crude 노이즈
      "Angevin Empire": ["ESP"], // 1차 실측: 사라고사·나바라에 가스코뉴 남쪽 조각 — 피레네 이남 앙주령은 없다
      // 확장 3의 울타리 — **이게 없으면 제후 분할이 통째로 무효다.** 그래프트는
      // regionAssignments 다음에 칠하므로, 독일을 덮는 제국 면이 방금 나눈 제후들을
      // 도로 한 색으로 되돌린다 — 1차 빌드 실측으로 브라운슈바이크·마이센·튀링겐·
      // 바이에른·쾰른·마인츠·트리어가 **0지역**으로 나왔다. 제국 면은 이제 이탈리아
      // 왕국에서만 칠한다. 1200년의 제국이 실제로 그랬듯이.
      "Sacrum Imperium Romanum": ["DEU", "AUT", "CHE", "NLD", "BEL", "LUX", "CZE", "SVN"],
      // 확장 4: 같은 이유로 북이탈리아에서도 막는다. 크레모나·파비아만 아래에서
      // 다시 황제에게 준다 — 기벨린 코뮌은 실제로 제국 편이었다.
      "Holy Roman Empire": ["DEU", "AUT", "CHE", "NLD", "BEL", "LUX", "CZE", "SVN", "HRV", "SMR",
        "ITA.1", "ITA.6", "ITA.7", "ITA.9", "ITA.10", "ITA.13", "ITA.16", "ITA.17", "ITA.19", "ITA.20"], // 자고레 등 헝가리 크로아티아 침식(이스트리아 조각 하나는 옳지만 5개 오식과 함께 죽는다) · ITA.1은 지역 접두 울타리: 제국면은 북이탈리아(보드 설계)에선 옳고 트론토 이남 아브루초에서만 틀리다 · SMR은 1444와 같은 수(자치 코무네 — 미배정 유지)
      "Status Ecclesiasticus": ["ITA.6.1"], // rung-1 교황령 면도 볼로냐를 문다 — 아래 rung-3 면과 **둘 다** 막아야 코뮌이 산다
      "Papal States": ["ITA.1", "ITA.6.1"], // 같은 아브루초 — 교황령 면도 테라모 방면을 물었다(1200 국경은 트론토). ITA.6.1은 확장 4가 붙였다: 면이 **볼로냐까지** 물어 코뮌을 0지역으로 만들었는데, 1200년 볼로냐는 제 포데스타를 세우는 자치 코뮌이다. 라벤나·리미니(로마냐)는 교황령이 맞아 통과시킨다
      "Principality of Galicia-Volhynia": ["MDA", "ROU"], // 실측: 키시너우·이아시·수체아바 IN — 몰도바 38지역 전부를 루스로 칠했다; 보드 설계는 쿠만 스텝 미배정
      "Principality of Novgorod": ["EST"], // 실측: 나르바 IN — 십자군 전의 에스토니아는 미배정 설계(페이푸스 선은 rung-1이 오면 되돌아온다)
      "Aragón": ["AND"], // 2차 실측(면이 매칭되자마자 안도라를 물었다): 우르헬-푸아 공동 영주령 — 1444와 같은 수, 미배정 유지
      // ── 확장 1이 데려온 울타리 넷 (전부 재배정·절단 로스터 실측) ──
      "Великожупанска Србија": ["SRB", "MNE", "ALB", "HRV.3"], // 면이 보스니아를 넘어 **몬테네그로 22지역 전부**(제타는 부칸 네만치의 것) · 마치바·콜루바라·즐라티보르(라슈카 본토) · 알바니아 · 두브로브니크까지 물었다. 쿨린 반의 보스니아는 드리나 서안이다. 라구사는 그의 것이 아니라 그와 **조약을 맺은 상대**였다(1189 헌장) — 자치 코무네 폴리티는 다음 배치 후보
      "Kara Khitai Khaganate": ["TKM", "IRN", "AFG", "UZB.7"], // 사마르칸트·나보이(카라한조 봉신)는 옳다. **호라즘(UZB.7)은 아니다** — 호라즘샤는 1207년까지 공납을 바쳤을 뿐 서요의 땅이 아니었고, 투르크멘·호라산·아프간은 호라즘/구르의 것이다
      "Cuman Khanates": ["GEO", "AZE"], // 타마르 여왕이 킵차크를 이주시킨 것과 킵차크가 조지아를 소유한 것은 다른 이야기다 — 면이 조지아 4지역과 시르반까지 칠하려 들었다
      "Makkura": ["EGY"], // 마쿠리아 본토는 동골라(SDN)다. 아스완 이북은 아이유브령 — 면이 홍해 연안·신계곡 오아시스까지 물었다
      "Almohad Caliphate": ["ESP.4.5", "ESP.4.4", "ESP.4.3"], // 지역 접두 울타리 — 알라르코스(1195) 이후의 진짜 선: 라만차 남부(알바세테·시우다드레알)는 알모하드가 맞지만 톨레도(1085년부터 기독교, 함락된 적 없음)·과달라하라(타호 이북)·쿠엥카(1177년부터)는 도시가 버텼다
    },
  },

  // No air power in 1200 — restrict deployable troop types to the era.
  allowedUnitTypes: ["infantry", "armor", "artillery", "naval", "garrison"],

  // 1200's modern country names are wholesale anachronistic, so relabel every
  // owned country with its polity name (Germany/Austria/... -> Holy Roman Empire).
  relabelOwnedCountries: true,

  polities: {
    HRE:   { name: "Holy Roman Empire", color: "#caa64a", aliases: ["신성 로마 제국", "Empire", "Reich", "Romans"] },
    FRA_K: { name: "Kingdom of France", color: "#2f5fd0", aliases: ["프랑스 왕국", "France", "Capetian France"] },
    ENG_A: { name: "Angevin Empire", color: "#b23b3b", aliases: ["앙주 제국", "Kingdom of England", "England", "Plantagenet"] },
    SCOT:  { name: "Kingdom of Scotland", color: "#6a6a9a", aliases: ["스코틀랜드 왕국", "Scotland", "Alba"] },
    BYZ:   { name: "Byzantine Empire", color: "#7d3fb2", aliases: ["동로마 제국", "Eastern Roman Empire", "Rhomania", "Romania"] },
    ALM:   { name: "Almohad Caliphate", color: "#2e7d4f", aliases: ["알모하드 칼리파국", "al-Muwahhidun", "Almohads"] },
    AYY:   { name: "Ayyubid Sultanate", color: "#3f8f8f", aliases: ["아이유브 술탄국", "Ayyubids", "Saladin's realm"] },
    ABBS:  { name: "Abbasid Caliphate", color: "#6b8e23", aliases: ["아바스 칼리파국", "Baghdad Caliphate", "Abbasids"] },
    KHWA:  { name: "Khwarazmian Empire", color: "#8b6f47", aliases: ["호라즘 제국", "Khwarazm", "Khwarazmshahs"] },
    RUS_K: { name: "Kievan Rus'", color: "#9a6b2f", aliases: ["키예프 루스", "Rus", "Rus principalities"] },
    CAST:  { name: "Crown of Castile", color: "#d2a02e", aliases: ["카스티야 왕국", "Castile", "León-Castile"] },
    ARAG:  { name: "Crown of Aragon", color: "#d23c3c", aliases: ["아라곤 연합왕국", "Aragon"] },
    NAV:   { name: "Kingdom of Navarre", color: "#5fae5f", aliases: ["나바라 왕국", "Navarra"] },
    POR_K: { name: "Kingdom of Portugal", color: "#2e7d6b", aliases: ["포르투갈 왕국", "Portugal"] },
    PAPAL: { name: "Papal States", color: "#e6d27a", aliases: ["교황령", "Patrimony of St Peter", "the Church"] },
    SICI:  { name: "Kingdom of Sicily", color: "#c97a2e", aliases: ["시칠리아 왕국", "Sicily", "Hauteville Sicily"] },
    VEN:   { name: "Republic of Venice", color: "#8a7d3f", aliases: ["베네치아 공화국", "Venice", "La Serenissima"] },
    JERU:  { name: "Crusader States", color: "#e04545", aliases: ["십자군 국가", "Outremer", "Kingdom of Jerusalem", "Antioch", "Cyprus"] },
    ARM_C: { name: "Cilician Armenia", color: "#d98cae", aliases: ["킬리키아 아르메니아", "Armenian Cilicia", "Little Armenia"] },
    HUNG:  { name: "Kingdom of Hungary", color: "#3f9d9d", aliases: ["헝가리 왕국", "Hungary", "Croatia-Hungary"] },
    POL_K: { name: "Duchy of Poland", color: "#d23ca0", aliases: ["폴란드 공국", "Poland", "Piast Poland"] },
    SERB:  { name: "Grand Principality of Serbia", color: "#9a4f9a", aliases: ["세르비아 대공국", "Serbia", "Raška"] },
    BULG:  { name: "Bulgarian Empire", color: "#8a5a3a", aliases: ["불가리아 제국", "Bulgaria", "Second Bulgarian Empire"] },
    GEOR:  { name: "Kingdom of Georgia", color: "#5a9ac0", aliases: ["조지아 왕국", "Georgia", "Sakartvelo"] },
    SELJ:  { name: "Sultanate of Rum", color: "#c25a3a", aliases: ["룸 술탄국", "Seljuks of Rum", "Rum"] },
    DEN_K: { name: "Kingdom of Denmark", color: "#c9385d", aliases: ["덴마크 왕국", "Denmark"] },
    NOR_K: { name: "Kingdom of Norway", color: "#5b8ec9", aliases: ["노르웨이 왕국", "Norway"] },
    SWE_K: { name: "Kingdom of Sweden", color: "#4a78c0", aliases: ["스웨덴 왕국", "Sweden"] },
    VOLG:  { name: "Volga Bulgaria", color: "#7a8a4a", aliases: ["볼가 불가리아", "Volga Bulgars", "Bulghar"] },
    GHUR:  { name: "Ghurid Empire", color: "#8a5a8a", aliases: ["고르 제국", "Ghurids", "Ghor"] },
    PAGAN: { name: "Kingdom of Pagan", color: "#b08a3a", aliases: ["버간 왕국", "Pagan", "Bagan", "Burma"] },
    DAIV:  { name: "Dai Viet", color: "#4a8a5a", aliases: ["다이비엣", "Đại Việt", "Ly dynasty Vietnam"] },
    SRIV:  { name: "Srivijaya", color: "#6a7ab0", aliases: ["스리위자야", "Sriwijaya", "Palembang"] },
    CHOL:  { name: "Chola Empire", color: "#c07a4a", aliases: ["촐라 제국", "Cholas", "Chozha"] },
    POLO:  { name: "Kingdom of Polonnaruwa", color: "#5a9a8a", aliases: ["폴론나루와 왕국", "Polonnaruwa", "Lanka"] },
    JIN:   { name: "Jin Dynasty", color: "#b87333", aliases: ["금나라", "Jurchen Jin", "Great Jin"] },
    SONG:  { name: "Southern Song", color: "#c97a5a", aliases: ["남송", "Song Dynasty", "Song"] },
    XIA:   { name: "Western Xia", color: "#d0b060", aliases: ["서하", "Tangut", "Xi Xia"] },
    DALI:  { name: "Kingdom of Dali", color: "#6aae8a", aliases: ["대리국", "Dali"] },
    TIBET: { name: "Tibet", color: "#b0a0c0", aliases: ["티베트", "Tibetan polities"] },
    JAP_K: { name: "Kamakura Japan", color: "#c0507a", aliases: ["가마쿠라 일본", "Japan", "Kamakura Shogunate"] },
    GORY:  { name: "Goryeo", color: "#5a9a7a", aliases: ["고려", "Korea", "Goryeo"] },
    KHMER: { name: "Khmer Empire", color: "#c2a23a", aliases: ["크메르 제국", "Angkor", "Khmer"] },
    ETHIO: { name: "Zagwe Ethiopia", color: "#4a8f6a", aliases: ["자그웨 에티오피아", "Abyssinia", "Zagwe"] },

    // ── 확장 1: 배제하던 면을 로스터로 회수 ────────────────────────────────
    // 위 excludeFaces 스물여덟 중 열하나는 "라벨이 틀려서"가 아니라 **"로스터에
    // 없어서"** 배제돼 있었다 — 기하는 이미 그려져 있는데 줄 사람이 없었다는
    // 뜻이다. 1444를 65→157로 채운 것과 같은 작업이고, 여기서는 새 데이터를
    // 만들 필요조차 없다. 채택하지 않은 열일곱 건은 이유를 붙여 excludeFaces에
    // 그대로 남겼다.
    GWYN:  { name: "Kingdom of Gwynedd", color: "#3f7a4a", aliases: ["귀네드 왕국", "Gwynedd", "Teyrnas Gwynedd"] },
    POWY:  { name: "Powys Wenwynwyn", color: "#7aa83f", aliases: ["포위스 웬윈윈", "Powys"] },
    DESM:  { name: "Kingdom of Desmond", color: "#b06a2e", aliases: ["데즈먼드 왕국", "Desmond", "Deasmhumhain", "MacCarthy"] },
    THOM:  { name: "Kingdom of Thomond", color: "#d0a24a", aliases: ["토먼드 왕국", "Thomond", "Tuamhain", "O'Brien"] },
    ISLC:  { name: "Icelandic Commonwealth", color: "#7fb6d6", aliases: ["아이슬란드 자유국", "Iceland", "Þjóðveldið Ísland", "Alþingi"] },
    CAGL:  { name: "Judicate of Cagliari", color: "#a03f6a", aliases: ["칼리아리 유디카토", "Cagliari", "Iudicatus Karalitanus", "Càlari"] },
    ARBO:  { name: "Judicate of Arborea", color: "#6a3f9a", aliases: ["아르보레아 유디카토", "Arborea", "Arborèa"] },
    BOSN:  { name: "Banate of Bosnia", color: "#4a6ab0", aliases: ["보스니아 바나트", "Bosnia", "Ban Kulin's Bosnia", "Bosna"] },
    KKHI:  { name: "Qara Khitai", color: "#9a9a3f", aliases: ["서요", "Kara Khitai", "Western Liao", "Gurkhanate"] },
    MAKU:  { name: "Kingdom of Makuria", color: "#3f9a8a", aliases: ["마쿠리아 왕국", "Makuria", "Makkura", "Dongola", "Nubia"] },
    CUMA:  { name: "Cuman–Kipchak Confederation", color: "#c9a86a", aliases: ["쿠만-킵차크 연합", "Cumans", "Kipchaks", "Polovtsy", "Desht-i Qipchaq"] },

    // ── 확장 2: 인도 아대륙 ────────────────────────────────────────────────
    // **구르 감사 결과부터**: 구르 244지역은 과대 커버가 아니었다. 191개가
    // 인도 지역인데 그건 스펙이 준 북부 7개 주(델리·하리아나·펀자브·찬디가르·
    // UP·비하르·라자스탄)의 하위 지구 수다 — 1192 타라인 이후의 갠지스 평원과
    // 정확히 같다. 문제는 구르가 넓은 게 아니라 **나머지 인도가 비어 있던 것**.
    //
    // 시대 지오메트리 창은 [-15,30,50,72]라 아대륙에는 면이 한 장도 없다.
    // 여기는 전부 GADM 주 단위 수작업이고, 그래서 경계는 주 경계로 반올림된다 —
    // 아래 근사는 전부 이름을 붙여 뒀다.
    CHAU:  { name: "Chaulukya of Gujarat", color: "#c46a8a", aliases: ["차울루키아 왕조", "Solanki", "Anhilwara", "Gujarat"] },
    PARA:  { name: "Paramara of Malwa", color: "#8a5ac4", aliases: ["파라마라 왕조", "Paramaras", "Malwa", "Dhara"] },
    KALA:  { name: "Kalachuri of Ratanpur", color: "#6a8a5a", aliases: ["칼라추리 왕조", "Kalachuris", "Ratanpur", "Dakshina Kosala"] },
    YADA:  { name: "Seuna Yadava", color: "#b05a3a", aliases: ["야다바 왕조", "Yadavas", "Devagiri", "Seuna"] },
    HOYS:  { name: "Hoysala Empire", color: "#4a9ac4", aliases: ["호이살라 제국", "Hoysalas", "Dwarasamudra", "Halebidu"] },
    VENA:  { name: "Venad", color: "#3aa07a", aliases: ["베나드", "Kerala", "Kulasekhara successors", "Quilon"] },
    KAKA:  { name: "Kakatiya Dynasty", color: "#a08a3a", aliases: ["카카티야 왕조", "Kakatiyas", "Warangal", "Orugallu"] },
    GANG:  { name: "Eastern Ganga Dynasty", color: "#7a5a3a", aliases: ["동강가 왕조", "Gangas", "Kalinga", "Utkala"] },
    SENA:  { name: "Sena Dynasty", color: "#c47a5a", aliases: ["세나 왕조", "Senas", "Bengal", "Gauda", "Lakhnauti"] },
    KAMA:  { name: "Kamarupa", color: "#5a7a9a", aliases: ["카마루파", "Kamrup", "Pragjyotisha", "Assam"] },
    NEPA:  { name: "Nepal Mandala", color: "#9ac45a", aliases: ["네팔 만달라", "Nepal", "Kathmandu Valley", "Thakuri"] },

    // ── 확장 3: 제국을 제후들에게 돌려준다 ─────────────────────────────────
    // 1444에서 회색 하나가 제후 열일곱으로 갈라진 그 작업의 1200판. 그리고
    // 1200년은 그걸 하기에 **가장 옳은 해**다 — 필리프(슈바벤)와 오토 4세(벨프)의
    // 이중 선거가 1198년에 났고, 제국이 한 색일 수 없다는 사실 자체가 이 보드의
    // 이야기다. 잔여 HRE는 이제 이탈리아 왕국과 남은 직속령이다(1444와 같은 모양).
    //
    // 경계는 GADM 주 경계로 반올림된다. 접은 것들은 전부 아래 배정에 이름을 붙였다.
    SAXO:  { name: "Duchy of Saxony", color: "#8a8ac4", aliases: ["작센 공국", "Saxony", "Ascanian Saxony", "Sachsen"] },
    BRUN:  { name: "Brunswick-Lüneburg", color: "#c48a5a", aliases: ["브라운슈바이크뤼네부르크", "Welf lands", "Braunschweig", "Guelph duchy"] },
    BRAN:  { name: "Margraviate of Brandenburg", color: "#5a5a8a", aliases: ["브란덴부르크 변경백국", "Brandenburg", "Nordmark"] },
    MEIS:  { name: "Margraviate of Meissen", color: "#7a9a3a", aliases: ["마이센 변경백국", "Meissen", "Wettin lands", "Mark Meißen"] },
    THUR:  { name: "Landgraviate of Thuringia", color: "#9a3a5a", aliases: ["튀링겐 방백국", "Thuringia", "Ludowingians", "Hesse"] },
    BAVA:  { name: "Duchy of Bavaria", color: "#3a7ac4", aliases: ["바이에른 공국", "Bavaria", "Wittelsbach Bavaria", "Bayern"] },
    SWAB:  { name: "Duchy of Swabia", color: "#c4c45a", aliases: ["슈바벤 공국", "Swabia", "Hohenstaufen lands", "Schwaben"] },
    HOLS:  { name: "County of Holstein", color: "#5ac4a8", aliases: ["홀슈타인 백국", "Holstein", "Schauenburg"] },
    COLO:  { name: "Archbishopric of Cologne", color: "#c45a5a", aliases: ["쾰른 대주교령", "Cologne", "Köln", "Duchy of Westphalia"] },
    MAIN:  { name: "Archbishopric of Mainz", color: "#d4a05a", aliases: ["마인츠 대주교령", "Mainz", "Mayence"] },
    TRIE:  { name: "Archbishopric of Trier", color: "#a05ad4", aliases: ["트리어 대주교령", "Trier", "Trèves"] },
    AUST:  { name: "Duchy of Austria", color: "#e0e0e0", aliases: ["오스트리아 공국", "Austria", "Babenberg Austria", "Styria"] },
    CARI:  { name: "Duchy of Carinthia", color: "#7ac48a", aliases: ["케른텐 공국", "Carinthia", "Kärnten", "Carniola"] },
    SALZ:  { name: "Archbishopric of Salzburg", color: "#c47ac4", aliases: ["잘츠부르크 대주교령", "Salzburg"] },
    TIRO:  { name: "County of Tyrol", color: "#8ac4c4", aliases: ["티롤 백국", "Tyrol", "Tirol"] },
    BOHE:  { name: "Kingdom of Bohemia", color: "#5a3a8a", aliases: ["보헤미아 왕국", "Bohemia", "Přemyslid Bohemia", "Moravia"] },
    BRAB:  { name: "Duchy of Brabant", color: "#c4a83a", aliases: ["브라반트 공국", "Brabant", "Louvain"] },
    FLAN:  { name: "County of Flanders", color: "#3ac4a0", aliases: ["플랑드르 백국", "Flanders", "Vlaanderen"] },
    LIEG:  { name: "Prince-Bishopric of Liège", color: "#a8c45a", aliases: ["리에주 주교후국", "Liège", "Luik", "Hainaut"] },
    LUXE:  { name: "County of Luxembourg", color: "#5a8ac4", aliases: ["룩셈부르크 백국", "Luxembourg", "Lützelburg"] },
    HOLL:  { name: "County of Holland", color: "#d45a8a", aliases: ["홀란트 백국", "Holland", "Zeeland"] },
    UTRE:  { name: "Bishopric of Utrecht", color: "#6a4a8a", aliases: ["위트레흐트 주교령", "Utrecht", "Oversticht"] },
    FRIS:  { name: "Frisian Freedom", color: "#3a8ac4", aliases: ["프리슬란트 자유지", "Frisia", "Friesland", "Free Frisians"] },
    GELD:  { name: "County of Guelders", color: "#c43a7a", aliases: ["헬러 백국", "Guelders", "Gelre", "Gelderland"] },
    ZAHR:  { name: "Duchy of Zähringen", color: "#a8a87a", aliases: ["체링겐 공국", "Zähringen", "Burgundy rectorate", "Bern"] },

    // ── 확장 4: 이탈리아 코뮌 ──────────────────────────────────────────────
    // 롬바르디아 동맹은 1198년에 **재결성됐다**. 이 보드의 북이탈리아가 제국
    // 한 색이던 것은 바로 그 사실을 지우는 그림이었다. 코뮌은 사람이 아니라
    // 제도가 다스린다(집정관단·포데스타, 임기 1년) — 지도자 자리에 왕가 대신
    // 회의체가 들어가는 게 여기서는 근사가 아니라 정확한 답이다.
    MILA:  { name: "Commune of Milan", color: "#d43a3a", aliases: ["밀라노 코무네", "Milan", "Milano", "Lombard League"] },
    VERO:  { name: "Commune of Verona", color: "#3a5ad4", aliases: ["베로나 코무네", "Verona", "Mantua", "Veronese march"] },
    GENO:  { name: "Republic of Genoa", color: "#c4d43a", aliases: ["제노바 공화국", "Genoa", "Genova", "Ligurian republic"] },
    PISA:  { name: "Republic of Pisa", color: "#3ad4c4", aliases: ["피사 공화국", "Pisa", "Pisan republic"] },
    FLOR:  { name: "Commune of Florence", color: "#d43ac4", aliases: ["피렌체 코무네", "Florence", "Firenze"] },
    SIEN:  { name: "Commune of Siena", color: "#a87a3a", aliases: ["시에나 코무네", "Siena"] },
    LUCC:  { name: "Commune of Lucca", color: "#7ad43a", aliases: ["루카 코무네", "Lucca"] },
    BOLO:  { name: "Commune of Bologna", color: "#d47a3a", aliases: ["볼로냐 코무네", "Bologna"] },
    MODE:  { name: "Commune of Modena", color: "#3a8a5a", aliases: ["모데나 코무네", "Modena", "Reggio"] },
    PIAC:  { name: "Commune of Piacenza", color: "#8a3a7a", aliases: ["피아첸차 코무네", "Piacenza", "Parma"] },
    MONF:  { name: "Marquisate of Montferrat", color: "#5ad4d4", aliases: ["몬페라토 후국", "Montferrat", "Monferrato"] },
    SAVO:  { name: "County of Savoy", color: "#d4d4a8", aliases: ["사보이아 백국", "Savoy", "Savoia", "Aosta"] },
    TREN:  { name: "Bishopric of Trent", color: "#a8d4c4", aliases: ["트렌토 주교령", "Trent", "Trento", "Brixen"] },
    AQUI:  { name: "Patriarchate of Aquileia", color: "#c4a8d4", aliases: ["아퀼레이아 총대주교령", "Aquileia", "Friuli", "Patria del Friuli"] },

    // ── 확장 5: 사하라 이남 아프리카 ──────────────────────────────────────
    // 창 밖이라 면이 없고, 무엇보다 **기록이 다르게 남았다.** 유럽 제후는 재위
    // 연월일까지 짚히는데 여기는 왕명부가 단편이거나 구전이다. 그래서 아래 열하나
    // 중 열이 기관인데, 이탈리아 코뮌과 이유가 정반대다 — 거긴 제도가 다스려서
    // 기관이 정답이었고, 여긴 **사람이 다스렸는데 이름이 안 남아서**다. 없는
    // 이름을 지어내지 않는 것이 이 파일의 첫 번째 규칙이다.
    TAKR:  { name: "Takrur", color: "#d4a86a", aliases: ["타크루르", "Tekrur", "Senegal valley"] },
    GHAN:  { name: "Ghana Empire", color: "#b8a83a", aliases: ["가나 제국", "Wagadou", "Ghana", "Soninke empire"] },
    SOSS:  { name: "Sosso Kingdom", color: "#8a6a3a", aliases: ["소소 왕국", "Kaniaga", "Susu", "Sumanguru's realm"] },
    GAO:   { name: "Gao Kingdom", color: "#d4c48a", aliases: ["가오 왕국", "Kawkaw", "Za dynasty", "Songhai"] },
    KANE:  { name: "Kanem Empire", color: "#6a8ad4", aliases: ["카넴 제국", "Kanem", "Sayfawa", "Bornu"] },
    HAUS:  { name: "Hausa City-States", color: "#3ac46a", aliases: ["하우사 도시국가", "Hausa", "Kano", "Katsina", "Hausa Bakwai"] },
    IFE:   { name: "Ife", color: "#c43a5a", aliases: ["이페", "Ile-Ife", "Yorubaland", "Oduduwa"] },
    ALOD:  { name: "Kingdom of Alodia", color: "#5ad48a", aliases: ["알로디아 왕국", "Alwa", "Soba", "Alodia"] },
    KILW:  { name: "Kilwa Sultanate", color: "#3a6ad4", aliases: ["킬와 술탄국", "Kilwa", "Swahili coast", "Zanj"] },
    MOGA:  { name: "Sultanate of Mogadishu", color: "#a8d43a", aliases: ["모가디슈 술탄국", "Mogadishu", "Benadir"] },
    MAPU:  { name: "Mapungubwe", color: "#d46a3a", aliases: ["마풍구브웨", "Mapungubwe", "Limpopo kingdom"] },

    // ── 확장 6: 아메리카 ──────────────────────────────────────────────────
    // 1200년의 아메리카는 **두 제국 사이의 골짜기**다. 톨텍 툴라는 1150년경
    // 무너졌고 아즈텍의 테노치티틀란은 1325년이며, 티와나쿠·와리는 이미 사라졌고
    // 잉카의 정복은 15세기다. 그래서 여기 있는 건 큰 제국이 아니라 그 사이를
    // 채운 실제 정치체들이다. 지도자는 열하나 전부 기관인데, 아프리카와 또 다른
    // 이유다 — 이쪽은 **기록의 성격 자체가 다르다**(고고학·구전·논쟁적 연대기).
    CHIC:  { name: "Chichén Itzá", color: "#3ad4d4", aliases: ["치첸이트사", "Chichen Itza", "Maya", "Itza"] },
    MIXT:  { name: "Mixtec–Zapotec City-States", color: "#d43a8a", aliases: ["믹스텍-사포텍 도시국가", "Mixtec", "Zapotec", "Oaxaca", "Ñuu Dzaui"] },
    CHIM:  { name: "Chimor", color: "#c4843a", aliases: ["치무 왕국", "Chimu", "Chimú", "Chan Chan"] },
    CUZC:  { name: "Kingdom of Cusco", color: "#d4b83a", aliases: ["쿠스코 왕국", "Cusco", "Cuzco", "early Inca"] },
    QULL:  { name: "Qulla Kingdom", color: "#5a3ac4", aliases: ["코야 왕국", "Colla", "Aymara kingdoms", "Titicaca"] },
    CHAC:  { name: "Chachapoya", color: "#6ac48a", aliases: ["차차포야", "Chachapoyas", "cloud people"] },
    MUIS:  { name: "Muisca Confederation", color: "#c45ad4", aliases: ["무이스카 연합", "Muisca", "Chibcha", "Zipa", "Zaque"] },
    TAIR:  { name: "Tairona", color: "#3a9a5a", aliases: ["타이로나", "Tayrona", "Sierra Nevada chiefdoms"] },
    CAHO:  { name: "Cahokia", color: "#8a4a2a", aliases: ["카호키아", "Mississippian culture", "Cahokia"] },
    PUEB:  { name: "Ancestral Puebloans", color: "#d49a6a", aliases: ["고대 푸에블로", "Anasazi", "Mesa Verde", "Chaco"] },
    TAIN:  { name: "Taíno Chiefdoms", color: "#4ac4b8", aliases: ["타이노 추장국", "Taino", "Caciquedoms", "Antilles"] },

    // ── 확장 7: 스텝·발트·게일 아일랜드 ───────────────────────────────────
    // 마지막 남은 셋. 셋 다 **곧 사라질 세계**라는 공통점이 있고, 1200년은 그
    // 직전이다: 리보니아·에스토니아·리투아니아는 아직 이교도 부족이고(리가 1201,
    // 검의 형제기사단 1202, 튜튼 기사단 1226), 몽골 고원의 패자는 아직 옹칸이며
    // **테무진은 그의 봉신**이다(칭기즈 칸 즉위 1206). 게일 왕들은 앵글로-노르만
    // 영주령에 밀리는 중이다. 지금 안 그리면 이 보드는 결과만 남고 판이 사라진다.
    CONN:  { name: "Kingdom of Connacht", color: "#4a8a3a", aliases: ["코노트 왕국", "Connacht", "Ó Conchobair", "Connaught"] },
    ULAI:  { name: "Cenél nEógain", color: "#3a4a8a", aliases: ["케넬 노간", "Ulaid", "Ulster", "Ó Néill", "Tír Eoghain"] },
    LIVO:  { name: "Livonian Tribes", color: "#8ac4d4", aliases: ["리보니아 부족", "Livonia", "Latgalians", "Curonians", "Semigallians"] },
    ESTO:  { name: "Estonian Maakonds", color: "#d4c4a8", aliases: ["에스토니아 마콘드", "Estonia", "Maakond", "Saaremaa"] },
    LITH:  { name: "Lithuanian Tribes", color: "#a83ac4", aliases: ["리투아니아 부족", "Lithuania", "Samogitia", "Aukštaitija"] },
    KERE:  { name: "Kerait Khanate", color: "#c4b83a", aliases: ["케레이트 칸국", "Kerait", "Toghrul", "Wang Khan"] },
    NAIM:  { name: "Naiman Khanate", color: "#3ac4a8", aliases: ["나이만 칸국", "Naiman", "Tayang Khan"] },
    MONG:  { name: "Mongol Tribe", color: "#8a3a3a", aliases: ["몽골 부족", "Mongols", "Temüjin", "Borjigin"] },
  },

  countryAssignments: {
    // — Latin Christendom —
    HRE:   ["DEU", "AUT", "CHE", "NLD", "BEL", "LUX", "LIE", "CZE", "SVN"],
    FRA_K: ["FRA"],
    ENG_A: ["GBR", "IRL"],                 // Scotland split out below
    POR_K: ["PRT"],
    CAST:  ["ESP"],                        // Aragon/Navarre/Almohad split out below
    HUNG:  ["HUN", "HRV", "SVK", "BIH"],   // + Transylvania & Transcarpathia below; Wallachia/Moldavia are Cuman steppe
    POL_K: ["POL"],
    SERB:  ["SRB", "MNE", "XKO"],
    DEN_K: ["DNK"],
    NOR_K: ["NOR", "ISL", "FRO", "GRL"],
    SWE_K: ["SWE", "FIN"],
    SICI:  ["MLT"],                        // + southern Italy below
    // — Eastern Christendom —
    BYZ:   ["GRC", "MKD", "ALB"],          // + western Anatolia below
    BULG:  ["BGR"],
    GEOR:  ["GEO", "ARM"],
    // Kievan Rus': Belarus whole; European Russia and forest Ukraine are granted
    // region-by-region below — Siberia, the Urals and the Pontic-Caspian steppe
    // (Cumans/Kipchaks) were NOT Rus' and stay unclaimed.
    RUS_K: ["BLR"],
    // — Islamic world —
    ALM:   ["MAR", "DZA", "TUN", "LBY", "ESH"],
    AYY:   ["EGY", "SYR", "JOR", "LBN", "ISR", "PSE", "YEM"],
    ABBS:  ["IRQ"],
    KHWA:  ["IRN", "TKM", "UZB", "TJK"],   // Afghanistan belongs to the rival Ghurids
    GHUR:  ["AFG", "PAK"],                 // + the freshly conquered north-Indian plain below
    SELJ:  ["TUR"],                        // overridden along the coasts/frontiers below
    JERU:  ["CYP"],                        // + Levantine coast & Antioch below
    // — Asia & Africa —
    JAP_K: ["JPN"],
    GORY:  ["KOR", "PRK"],
    KHMER: ["KHM", "LAO", "THA"],          // Angkor at its height rules the Chao Phraya basin
    PAGAN: ["MMR"],
    DAIV:  ["VNM"],
    SRIV:  ["IDN", "MYS"],
    POLO:  ["LKA"],
    TAIN:  ["CUB", "DOM", "HTI", "PRI", "JAM", "BHS"], // 확장 6: 대앤틸리스와 바하마 전역이 타이노 카시케들의 땅이다
    LUXE:  ["LUX"],                        // 확장 3: 룩셈부르크 백작령
    // 확장 2: 벵골 삼각주와 카트만두 분지 — 면이 없는 구역이라 국가 단위로.
    SENA:  ["BGD"],                        // 세나의 동벵골(비크람푸르)
    NEPA:  ["NPL"],                        // 네팔 만달라 — 1200년은 아리말라가 말라 왕조를 여는 해다
    ETHIO: ["ETH"],
  },

  regionAssignments: {
    // Scotland
    "GBR.3_1": "SCOT",

    // Pomerania-Stettin: Bogusław's Griffin duchy did homage to Cnut VI in
    // 1185, and at 1200 Danish supremacy over the southern Baltic coast is a
    // fact (it breaks at Bornhöved, 1227). Pomerelia (Gdańsk) stays in the
    // Polish orbit; Silesia and Lubusz are correctly Piast in 1200 and keep
    // the country baseline.
    "POL.16_1": "DEN_K",

    // Kievan Rus' — the principalities of European Russia (Novgorod's north
    // included); everything east of the Volga and south into the steppe is not Rus'.
    "RUS.4_1": "RUS_K",  "RUS.7_1": "RUS_K",  "RUS.8_1": "RUS_K",  "RUS.14_1": "RUS_K",
    "RUS.19_1": "RUS_K", "RUS.23_1": "RUS_K", "RUS.26_1": "RUS_K", "RUS.31_1": "RUS_K",
    "RUS.32_1": "RUS_K", "RUS.33_1": "RUS_K", "RUS.37_1": "RUS_K", "RUS.38_1": "RUS_K",
    "RUS.39_1": "RUS_K", "RUS.43_1": "RUS_K", "RUS.44_1": "RUS_K", "RUS.45_1": "RUS_K",
    "RUS.47_1": "RUS_K", "RUS.49_1": "RUS_K", "RUS.52_1": "RUS_K", "RUS.57_1": "RUS_K",
    "RUS.59_1": "RUS_K", "RUS.64_1": "RUS_K", "RUS.70_1": "RUS_K", "RUS.72_1": "RUS_K",
    "RUS.76_1": "RUS_K", "RUS.78_1": "RUS_K", "RUS.81_1": "RUS_K",

    // Volga Bulgaria on the middle Volga.
    "RUS.68_1": "VOLG", "RUS.13_1": "VOLG", "RUS.75_1": "VOLG", "RUS.62_1": "VOLG",
    "RUS.41_1": "VOLG", "RUS.74_1": "VOLG",

    // Rus' Ukraine: the forest and forest-steppe principalities (Kiev, Chernihiv,
    // Pereyaslav, Volhynia, Galicia). The Black Sea steppe is Cuman and unclaimed.
    "UKR.1_1": "RUS_K",  "UKR.2_1": "RUS_K",  "UKR.3_1": "RUS_K",  "UKR.7_1": "RUS_K",
    "UKR.10_1": "RUS_K", "UKR.11_1": "RUS_K", "UKR.12_1": "RUS_K", "UKR.14_1": "RUS_K",
    "UKR.18_1": "RUS_K", "UKR.19_1": "RUS_K", "UKR.21_1": "RUS_K", "UKR.22_1": "RUS_K",
    "UKR.24_1": "RUS_K", "UKR.25_1": "RUS_K", "UKR.27_1": "RUS_K",
    "UKR.23_1": "HUNG",  // Transcarpathia was Hungarian

    // Hungary's Transylvania, Banat and Partium (the rest of modern Romania —
    // Wallachia and Moldavia — is Cuman steppe in 1200).
    "ROU.1_1": "HUNG",  "ROU.2_1": "HUNG",  "ROU.5_1": "HUNG",  "ROU.6_1": "HUNG",
    "ROU.8_1": "HUNG",  "ROU.13_1": "HUNG", "ROU.14_1": "HUNG", "ROU.16_1": "HUNG",
    "ROU.22_1": "HUNG", "ROU.23_1": "HUNG", "ROU.27_1": "HUNG", "ROU.29_1": "HUNG",
    "ROU.33_1": "HUNG", "ROU.34_1": "HUNG", "ROU.35_1": "HUNG", "ROU.38_1": "HUNG",

    // Ghurid India: Muhammad of Ghor's generals have just taken the northern
    // plain (Delhi 1192, Bihar c. 1200); the Deccan and the south stay indigenous.
    "IND.25_1": "GHUR", "IND.12_1": "GHUR", "IND.28_1": "GHUR", "IND.6_1": "GHUR",
    "IND.34_1": "GHUR", "IND.5_1": "GHUR",  "IND.29_1": "GHUR",

    // The Chola heartland on the Tamil coast (declining but standing).
    "IND.31_1": "CHOL", "IND.27_1": "CHOL",

    // ── 확장 7: 스텝·발트·게일 아일랜드 ──
    "IRL.7_1": "CONN", "IRL.16_1": "CONN", "IRL.20_1": "CONN", "IRL.21_1": "CONN", "IRL.12_1": "CONN", // 카할 크로브데르그 오 콘초바르의 코나흐트
    "IRL.5_1": "ULAI", "IRL.2_1": "ULAI", "IRL.18_1": "ULAI", "GBR.TLN0": "ULAI", // 아드 메흐 오 닐의 티르 어건. 렌스터·미스·먼스터 동부는 앵글로-노르만 영주령이 맞아 ENG_A로 둔다
    "GBR.TLL5": "ENG_A",                       // 남동 웨일스(글러모건·귄트)는 마처 영주들의 땅이다 — 포위스로 준 확장 1의 근사를 여기서 좁힌다. **데허바르스는 그릴 수 없다**: 웨일스가 세 조각뿐이라 포위스와 같은 조각에 들어간다
    "LVA.1_1": "LIVO", "LVA.2_1": "LIVO", "LVA.3_1": "LIVO", "LVA.4_1": "LIVO", "LVA.5_1": "LIVO",
    "EST.1_1": "ESTO", "EST.2_1": "ESTO", "EST.3_1": "ESTO", "EST.4_1": "ESTO", "EST.5_1": "ESTO",
    "EST.6_1": "ESTO", "EST.7_1": "ESTO", "EST.8_1": "ESTO", "EST.9_1": "ESTO", "EST.10_1": "ESTO",
    "EST.11_1": "ESTO", "EST.12_1": "ESTO", "EST.13_1": "ESTO", "EST.14_1": "ESTO", "EST.15_1": "ESTO", "EST.16_1": "ESTO",
    "LTU.1_1": "LITH", "LTU.2_1": "LITH", "LTU.3_1": "LITH", "LTU.4_1": "LITH", "LTU.5_1": "LITH",
    "LTU.6_1": "LITH", "LTU.7_1": "LITH", "LTU.8_1": "LITH", "LTU.9_1": "LITH", "LTU.10_1": "LITH",
    // 발트 셋은 **1200년에 아직 아무에게도 정복되지 않았다**: 리가 창건 1201,
    // 검의 형제기사단 1202, 튜튼 기사단의 프로이센 진출 1226. 이 보드는 그 직전이다.
    "MNG.20_1": "KERE", "MNG.21_1": "KERE", "MNG.1_1": "KERE", "MNG.17_1": "KERE",
    "MNG.4_1": "KERE", "MNG.18_1": "KERE", "MNG.5_1": "KERE", "MNG.16_1": "KERE",
    "MNG.14_1": "KERE", "MNG.8_1": "KERE", "MNG.11_1": "KERE", // 옹칸 토그릴 — 1200년 몽골 고원의 패자
    "MNG.2_1": "NAIM", "MNG.13_1": "NAIM", "MNG.22_1": "NAIM", "MNG.9_1": "NAIM",
    "MNG.10_1": "NAIM", "MNG.3_1": "NAIM",     // 타양칸의 나이만 — 알타이 서쪽
    "MNG.12_1": "MONG", "MNG.6_1": "MONG", "MNG.19_1": "MONG", "MNG.7_1": "MONG", "MNG.15_1": "MONG",
    // **헨티(MNG.12)가 테무진의 고향이다.** 1200년의 그는 칸이 아니라 옹칸의
    // 의제 아들이자 봉신이고, 이 다섯 지역이 그가 가진 전부다. 1206년에 달라진다.

    // ── 확장 6: 아메리카 ──
    "MEX.31_1": "CHIC", "MEX.23_1": "CHIC", "MEX.4_1": "CHIC", "GTM.12_1": "CHIC", // 유카탄 반도. **1200년은 치첸이차의 끝자락**이고 마야판 연맹은 1220년경이라 아직 이쪽이다
    "MEX.20_1": "MIXT", "MEX.12_1": "MIXT", // 오악사카·게레로 — 미스텍·사포텍 도시국가들. 8-사슴 재규어발톱은 1063년 사람이라 이 보드엔 없다
    "PER.13_1": "CHIM", "PER.14_1": "CHIM", "PER.21_1": "CHIM", "PER.2_1": "CHIM", "PER.25_1": "CHIM", // 찬찬의 치모르 — 북부 해안. 시칸(람바예케) 흡수는 1375년경이라 여기선 접었다
    "PER.8_1": "CUZC", "PER.3_1": "CUZC",  // **쿠스코 왕국일 뿐 잉카 제국이 아니다.** 파차쿠텍의 정복은 1438년부터 — 두 지역이 맞다
    "PER.22_1": "QULL", "BOL.4_1": "QULL", "BOL.5_1": "QULL", // 티티카카의 아이마라 왕국들. 티와나쿠는 이미 무너졌다(1000년경)
    "PER.1_1": "CHAC", "PER.23_1": "CHAC", // 차차포야 — 구름 위의 사람들
    "COL.7_2": "MUIS", "COL.15_2": "MUIS", "COL.5_2": "MUIS", "COL.28_2": "MUIS", // 무이스카 — 지파와 자케, **수장이 둘인 연맹**이다
    "COL.20_2": "TAIR", "COL.19_2": "TAIR", "COL.12_2": "TAIR", // 시에라네바다의 타이로나
    "USA.14_1": "CAHO", "USA.26_1": "CAHO", "USA.4_1": "CAHO", "USA.43_1": "CAHO",
    "USA.25_1": "CAHO", "USA.18_1": "CAHO", // 카호키아는 1200년에 **런던보다 크다**. 미시시피 문화의 중심 — 1350년경 버려진다
    "USA.32_1": "PUEB", "USA.3_1": "PUEB", "USA.45_1": "PUEB", "USA.6_1": "PUEB", // 차코 캐니언은 1150년에 비었고 1200년의 중심은 메사베르데다
    // 남긴 것들:
    //   멕시코 중앙고원(툴라·테노치티틀란) — **톨텍은 1150년경 무너졌고 아즈텍은
    //     1325년이다.** 이 100년은 진짜로 비어 있던 시기다.
    //   미초아칸 — 타라스칸(푸레페차) 통합은 1300년경.
    //   아마존·파타고니아·대평원·캐나다 — 수렵·채집·소규모 원예 사회.
    //   중앙아메리카 남부(코스타리카·파나마) — 추장국 단위.

    // ── 확장 5: 사하라 이남 아프리카 ──
    // 해안·강 유역만 준다. 여기서 나라 단위로 칠하면 **거의 전부가 과장**이 된다 —
    // 킬와는 해안 도시 연합이지 탕가니카 내륙의 주인이 아니었다.
    "SEN.9_1": "TAKR", "SEN.10_1": "TAKR", "SEN.8_1": "TAKR", "SEN.2_1": "TAKR",
    "SEN.1_1": "TAKR", "SEN.13_1": "TAKR", "SEN.3_1": "TAKR", "SEN.5_1": "TAKR", "SEN.4_1": "TAKR",
    "MRT.5_1": "TAKR", "MRT.3_1": "TAKR", "MRT.13_1": "TAKR", "MRT.6_1": "TAKR", // 세네갈강 유역. 카자망스(콜다·세디우·지긴쇼르)는 삼림 정치체 — 미배정
    "MRT.7_1": "GHAN", "MRT.8_1": "GHAN", "MRT.2_1": "GHAN", "MRT.11_1": "GHAN", "MLI.3_1": "GHAN", // 1200년의 와가두는 **소소의 봉신으로 쪼그라든 잔존 왕국**이다
    "MLI.5_1": "SOSS", "MLI.1_1": "SOSS", "MLI.7_1": "SOSS", "MLI.8_1": "SOSS",
    "GIN.4_1": "SOSS", "GIN.3_1": "SOSS", "GIN.6_1": "SOSS", "GIN.7_1": "SOSS",
    "GIN.5_1": "SOSS", "GIN.1_1": "SOSS",     // 수만구루의 대장장이 왕국 — **말리 제국은 1235년(키리나)이라 이 보드에 없다**
    "MLI.2_1": "GAO", "MLI.9_1": "GAO", "MLI.6_1": "GAO", "MLI.4_1": "GAO",
    "NER.7_1": "GAO", "NER.5_1": "GAO", "NER.3_1": "GAO", // 니제르 만곡부 — 자 왕조의 가오
    "TCD.9_1": "KANE", "TCD.10_1": "KANE", "TCD.4_1": "KANE", "TCD.8_1": "KANE",
    "TCD.22_1": "KANE", "TCD.2_1": "KANE", "TCD.1_1": "KANE", "TCD.3_1": "KANE",
    "TCD.21_1": "KANE", "NER.2_1": "KANE", "NER.8_1": "KANE",
    "NGA.8_1": "KANE", "NGA.36_1": "KANE",   // 차드호 사이파와 왕조. 보르누 이거는 14세기라 아직 카넴이 본거지다
    "NGA.20_1": "HAUS", "NGA.21_1": "HAUS", "NGA.18_1": "HAUS", "NGA.19_1": "HAUS",
    "NGA.37_1": "HAUS", "NGA.34_1": "HAUS", "NGA.22_1": "HAUS", "NGA.5_1": "HAUS",
    "NGA.16_1": "HAUS", "NGA.32_1": "HAUS", "NGA.27_1": "HAUS", // 하우사 바크와이 — **단일 군주가 없는 도시국가 무리**다
    "NGA.30_1": "IFE", "NGA.31_1": "IFE", "NGA.29_1": "IFE", "NGA.13_1": "IFE",
    "NGA.28_1": "IFE", "NGA.25_1": "IFE", "NGA.12_1": "IFE", "NGA.24_1": "IFE", // 이페 전성기. 베냉(에도)은 이페에서 갈라져 나오는 중이라 같은 색으로 접었다
    "SDN.10_1": "MAKU", "SDN.12_1": "MAKU", // **동골라를 마쿠리아에 준다** — 확장 1이 회수한 면은 사막 조각뿐이라 왕국이 1지역이었다
    "SDN.7_1": "ALOD", "SDN.1_1": "ALOD", "SDN.18_1": "ALOD", "SDN.3_1": "ALOD",
    "SDN.13_1": "ALOD", "SDN.9_1": "ALOD", "SDN.15_1": "ALOD", "SDN.17_1": "ALOD", "SDN.2_1": "ALOD", // 소바의 알와 — 누비아 기독교 왕국 둘 중 남쪽
    "TZA.10_1": "KILW", "TZA.15_1": "KILW", "TZA.20_1": "KILW", "TZA.2_1": "KILW",
    "TZA.27_1": "KILW", "TZA.18_1": "KILW", "TZA.19_1": "KILW", "TZA.28_1": "KILW", "TZA.29_1": "KILW",
    "MOZ.1_1": "KILW", "MOZ.7_1": "KILW",     // 스와힐리 해안과 섬만. **탄자니아 내륙 19지역은 미배정** — 킬와가 다스린 적 없다
    "SOM.3_1": "MOGA", "SOM.15_1": "MOGA", "SOM.14_1": "MOGA", "SOM.9_1": "MOGA", "SOM.10_1": "MOGA", // 베나디르 해안. 내륙 씨족 연합은 미배정
    "ZWE.9_1": "MAPU", "ZWE.7_1": "MAPU", "ZWE.10_1": "MAPU", "ZAF.5_1": "MAPU", "BWA.11_1": "MAPU", // 림포포 합류점. **그레이트 짐바브웨는 1220년경부터**라 아직 마풍구브웨의 시대다
    // 남긴 것들:
    //   우간다 58지구 — 치웨지 왕조는 **구전 전설**이고 문헌으로 확인되는 국가가
    //     없다. 부뇨로-키타라는 뒤에 온다. 큰 빈칸이지만 지어내는 것보다 낫다.
    //   콩고분지·앙골라 — 콩고 왕국은 14세기, 루바·룬다는 15세기다.
    //   케냐 내륙·남아공 대부분·칼라하리 — 목축·수렵 사회.
    //   서아프리카 삼림(라이베리아·시에라리온·코트디부아르) — 부족 정치체.
    //   마다가스카르 — 통일 국가 없음.

    // ── 확장 4: 북이탈리아의 코뮌들 ──
    // 위 울타리가 제국 면을 북이탈리아에서 막았으므로 여기 배정이 최종이다.
    "ITA.10.8_1": "MILA", "ITA.10.9_1": "MILA", "ITA.10.5_1": "MILA", "ITA.10.12_1": "MILA",
    "ITA.10.3_1": "MILA", "ITA.10.6_1": "MILA", "ITA.10.11_1": "MILA",
    "ITA.10.1_1": "MILA", "ITA.10.2_1": "MILA", // 베르가모·브레시아는 제 코뮌이지만 동맹 맹주에 접었다(명시적 근사)
    "CHE.21_1": "MILA",                          // 티치노 — 확장 3에서 미뤄 둔 것: 코모·밀라노권
    "ITA.10.4_1": "HRE", "ITA.10.10_1": "HRE",  // **크레모나·파비아는 황제 편 코뮌이다.** 북이탈리아에서 제국이 실제로 딛고 선 땅이고, 이게 없으면 황제가 이탈리아에서 사라진다
    "ITA.20.6_1": "VERO", "ITA.20.7_1": "VERO", "ITA.20.4_1": "VERO", "ITA.20.1_1": "VERO",
    "ITA.20.2_1": "VERO", "ITA.10.7_1": "VERO", // 파도바·만토바는 제 코뮌이나 베로나권에 접었다. **베네치아는 1200년에 본토가 없다** — 테라페르마는 15세기다
    "ITA.9.1_1": "GENO", "ITA.9.2_1": "GENO", "ITA.9.3_1": "GENO", "ITA.9.4_1": "GENO", // 사보나는 제노바의 경쟁자였지만 접었다
    "ITA.16.7_1": "PISA", "ITA.16.4_1": "PISA", "ITA.16.6_1": "PISA",
    "ITA.16.2_1": "FLOR", "ITA.16.9_1": "FLOR", "ITA.16.8_1": "FLOR", "ITA.16.1_1": "FLOR",
    "ITA.16.10_1": "SIEN", "ITA.16.3_1": "SIEN",
    "ITA.16.5_1": "LUCC",                        // 1444의 교훈 그대로: 토스카나를 주 단위로 주면 루카·시에나가 묻힌다
    "ITA.6.1_1": "BOLO",                         // 1200년 볼로냐는 자치 코뮌이다 — 교황령 편입은 한참 뒤
    "ITA.6.4_1": "MODE", "ITA.6.8_1": "MODE",
    "ITA.6.6_1": "PIAC", "ITA.6.5_1": "PIAC",
    "ITA.13.1_1": "MONF", "ITA.13.2_1": "MONF", "ITA.13.5_1": "MONF",
    "ITA.13.8_1": "MONF", "ITA.13.3_1": "MONF", "ITA.13.7_1": "MONF", // 보니파초 1세 — 2년 뒤 4차 십자군을 이끈다
    "ITA.19.1_1": "SAVO", "ITA.13.6_1": "SAVO", "ITA.13.4_1": "SAVO",
    "ITA.17.2_1": "TREN", "ITA.17.1_1": "TREN", // 브릭센 주교령은 트렌토에 접었다
    "ITA.7.1_1": "AQUI", "ITA.7.2_1": "AQUI", "ITA.7.3_1": "AQUI", "ITA.7.4_1": "AQUI",

    // ── 확장 3: 제국의 제후들 (HRE 잔여는 이탈리아 왕국 + 직속령) ──
    // 1200년의 제국은 한 색일 수 없다 — 필리프와 오토 4세가 서로를 왕이라
    // 부르는 중이다. 아래는 전부 GADM 주 경계 반올림이고 접은 것은 이름을 붙였다.
    "DEU.13_1": "SAXO",                        // 아스카니아 작센 — 비텐베르크·마그데부르크
    "DEU.9_1": "BRUN", "DEU.5_1": "BRUN",     // 벨프 브라운슈바이크-뤼네부르크. 브레멘 대주교령은 별도 제후주교령이지만 한 지역뿐이라 벨프권에 접었다
    "DEU.3_1": "BRAN", "DEU.4_1": "BRAN",     // 오토 2세의 변경백령
    "DEU.14_1": "MEIS",                        // 베틴가 마이센 — 훗날의 작센은 여기서 자란다
    "DEU.16_1": "THUR", "DEU.7_1": "THUR",    // 루도빙거는 튀링겐과 **헤센을 함께** 쥔다 — 근사가 아니라 사실
    "DEU.2_1": "BAVA",                         // 비텔스바흐 바이에른
    "DEU.1_1": "SWAB",                         // 슈타우펜 슈바벤 — 필리프 본인의 공작령
    "DEU.15_1": "HOLS", "DEU.6_1": "HOLS",    // 홀슈타인 백작이 함부르크를 쥔다. 슐레스비히는 덴마크 공작령이지만 같은 주라 접혔다(명시적 근사)
    "DEU.10_1": "COLO",                        // 쾰른 대주교는 1180년부터 **베스트팔렌 공작**이다
    "DEU.11_1": "MAIN",                        // 마인츠 대주교령 + 라인 궁정백
    "DEU.12_1": "TRIE",                        // 트리어 대주교령 — 라인란트팔츠에도 걸치지만 자를란트로 대표시켰다
    "DEU.8_1": "DEN_K",                        // **메클렌부르크·포메른은 1200년 덴마크 종주 아래다** — 스펙이 이미 POL.16(포메른-슈테틴)에 그은 것과 같은 선이고, 보른회베트(1227)에 깨진다
    "AUT.3_1": "AUST", "AUT.9_1": "AUST", "AUT.4_1": "AUST", "AUT.6_1": "AUST", // 레오폴트 6세 — 슈타이어마르크는 게오르겐베르크 협약(1192)으로 이미 바벤베르크의 것
    "AUT.2_1": "CARI",                         // 스판하임 카린티아
    "AUT.5_1": "SALZ",                         // 잘츠부르크 대주교령
    "AUT.7_1": "TIRO",                         // 티롤 백작령 — 브릭센·트렌트 주교의 대리인에서 자립하는 중
    "AUT.8_1": "SWAB",                         // 포어아를베르크는 몬트포르트 백작 — 슈바벤권
    "SVN.4_1": "CARI", "SVN.1_1": "CARI", "SVN.7_1": "CARI", "SVN.3_1": "CARI",
    "SVN.10_1": "CARI", "SVN.12_1": "CARI", "SVN.11_1": "CARI", "SVN.5_1": "CARI",
    "SVN.2_1": "CARI", "SVN.6_1": "CARI",     // 카린티아 + 카르니올라 변경백령을 한 색으로 접었다(스판하임가가 둘 다 쥔다). 포드라브스카·포무르스카는 면 절단이 헝가리로 가른다
    "CZE.1_1": "BOHE", "CZE.2_1": "BOHE", "CZE.3_1": "BOHE", "CZE.4_1": "BOHE",
    "CZE.5_1": "BOHE", "CZE.6_1": "BOHE", "CZE.7_1": "BOHE", "CZE.8_1": "BOHE",
    "CZE.9_1": "BOHE", "CZE.10_1": "BOHE", "CZE.11_1": "BOHE", "CZE.12_1": "BOHE",
    "CZE.13_1": "BOHE", "CZE.14_1": "BOHE",   // 오타카르 1세는 1198년에 **세습 왕관**을 받았다 — 제국 안이되 제 왕국이다(faceKeepOut의 Poland 주석이 이미 그렇게 적고 있었다)
    "BEL.2_1": "FLAN",                         // 보두앵 9세. 플란데런은 프랑스 왕관 봉토이기도 하다 — 스헬더 서안의 프랑스 몫은 면 재배정이 이미 갈라 놓았다
    "BEL.3_1": "LIEG", "BEL.1_1": "BRAB",     // 왈로니는 리에주 주교령이 대표(나뮈르·에노는 접힘), 브뤼셀은 브라반트
    "NLD.8_1": "BRAB", "NLD.7_1": "BRAB",     // 브라반트 공작 하인리히 1세. 림뷔르흐 공작령은 1288년까지 별개지만 한 지역이라 접었다
    "NLD.9_1": "HOLL", "NLD.2_1": "HOLL", "NLD.6_1": "HOLL", "NLD.12_1": "HOLL", "NLD.13_1": "HOLL", // 디르크 7세 — 제일란트는 플란데런과 다투는 땅이라 홀란트로
    "NLD.11_1": "UTRE", "NLD.10_1": "UTRE", "NLD.1_1": "UTRE", // 위트레흐트 주교의 오버스티흐트
    "NLD.3_1": "FRIS", "NLD.5_1": "FRIS",     // **자유 프리지아** — 영주를 두지 않은 것이 이 땅의 정체성이다
    "NLD.4_1": "GELD",                         // 겔러 백작 오토 1세
    "CHE.6_1": "ZAHR", "CHE.7_1": "ZAHR", "CHE.24_1": "ZAHR", "CHE.19_1": "ZAHR",
    "CHE.13_1": "ZAHR", "CHE.8_1": "ZAHR", "CHE.23_1": "ZAHR", "CHE.4_1": "ZAHR", // 체링겐 공작 베르톨트 5세 — 부르고뉴 왕국의 제국 총독. 바젤·시옹 주교령은 접었다
    "CHE.26_1": "SWAB", "CHE.16_1": "SWAB", "CHE.20_1": "SWAB", "CHE.17_1": "SWAB",
    "CHE.2_1": "SWAB", "CHE.3_1": "SWAB", "CHE.9_1": "SWAB", "CHE.1_1": "SWAB",
    "CHE.12_1": "SWAB", "CHE.22_1": "SWAB", "CHE.18_1": "SWAB", "CHE.25_1": "SWAB",
    "CHE.14_1": "SWAB", "CHE.15_1": "SWAB", "CHE.10_1": "SWAB", // 동·중부 스위스는 슈바벤 공작권. 쿠어 주교령과 훗날의 원시 3주는 여기 접혀 있다
    // 티치노(CHE.21)는 손대지 않았다 — 코모·밀라노와 함께 이탈리아 배치에서 다룬다.

    // ── 확장 2: 데칸과 남·동인도 ──
    // 1200년 아대륙은 구르의 평원과 촐라의 해안 사이가 비어 있지 않았다.
    // 경계는 GADM 주 경계로 반올림된다(면 데이터가 없는 구역이라 불가피).
    "IND.11_1": "CHAU", "IND.8_1": "CHAU",   // 구자라트 — 비마 2세의 안힐와라. 다드라는 구자라트-마하라슈트라 경계의 소지역, 같은 색으로
    "IND.19_1": "PARA",                        // 말와 — 다라의 파라마라. 다만 이 주는 분델칸드(찬델라)와 곤드와나까지 품는다: 주 단위 근사
    "IND.7_1": "KALA",                         // 다크시나 코살라 — 라탄푸르 칼라추리
    "IND.20_1": "YADA", "IND.10_1": "YADA",   // 데바기리의 세우나 야다바. 고아는 카담바 봉신령이라 별도 폴리티가 옳지만 한 주뿐이라 종주에 접었다(명시적 근사)
    "IND.16_1": "HOYS",                        // 카르나타카 — 1189년 서찰루키아 붕괴 이후 발랄라 2세가 데칸을 쥔다
    "IND.17_1": "VENA",                        // 케랄라 — 쿨라셰카라 붕괴(1102) 이후의 베나드. 코지코드·코치 추장국까지 한 색으로 접은 근사
    "IND.32_1": "KAKA", "IND.2_1": "KAKA",    // 텔랑가나·안드라 — 가나파티데바가 1199년에 즉위해 해안까지 넓히는 중
    "IND.26_1": "GANG",                        // 칼링가 — 아낭가비마 2세의 동갠지스
    "IND.36_1": "SENA",                        // 벵골 서부 — 락슈마나 세나. **박티야르 킬지의 습격은 1203~04년**이라 이 보드 날짜엔 아직 세나의 것이다
    "IND.4_1": "KAMA",                         // 아삼 — 카마루파
    // 남긴 구멍들(전부 이유가 있다):
    //   자르칸드(IND.15) — 나가반시 등 초타나그푸르 추장국. 비하르(구르)와
    //     칼링가(동갠지스) 사이의 진짜 빈틈이지 누락이 아니다.
    //   히마찰(IND.13)·우타라칸드(IND.35)·시킴(IND.30) — 캉그라·참바·카트유리·
    //     찬드 등 구릉 라자들. 어느 하나로 묶으면 나머지를 지운다.
    //   북동부 6주(IND.3·21·22·23·24·33) — 아홈 왕국은 **1228년**이다. 그 전은
    //     부족 정치체이고 국가로 칠하면 거짓말이 된다.
    //   부탄 20지구 — 통일 부탄은 1616년.
    //   안다만(IND.1) — 외부 정치체와 접촉이 없다.

    // Iberia: Aragon, Navarre, and the Almohad south carved out of Castile.
    "ESP.2_1": "ARAG", "ESP.6_1": "ARAG",            // Aragón, Cataluña
    "ESP.9_1": "NAV",                                  // Navarra
    "ESP.1_1": "ALM", "ESP.18_1": "ALM",              // Andalucía, Murcia
    "ESP.10_1": "ALM", "ESP.13_1": "ALM",             // Valencia, Baleares (still Almohad in 1200)

    // Italy: Papal centre, Sicily south, Venice north-east, HRE (Kingdom of Italy) north.
    "ITA.8_1": "PAPAL", "ITA.18_1": "PAPAL", "ITA.11_1": "PAPAL",                         // Lazio, Umbria, Marche
    "ITA.1_1": "SICI", "ITA.2_1": "SICI", "ITA.3_1": "SICI", "ITA.4_1": "SICI",           // Abruzzo, Apulia, Basilicata, Calabria
    "ITA.5_1": "SICI", "ITA.12_1": "SICI", "ITA.15_1": "SICI",                            // Campania, Molise, Sicily
    "ITA.14_1": "HRE",                                                                     // Sardegna — 유디카티가 가르고 남는 로구도로·갈루라
    // 확장 4가 걷어낸 줄들. ITA.20·7·6·9·10·13·16·17·19를 주 단위로 VEN/HRE에
    // 주던 여섯 줄이 여기 있었고, **그게 코뮌 분할을 통째로 덮었다** — 객체
    // 뒤쪽 키가 이기므로 레벨-1 한 줄이 방금 나눈 레벨-2 열 개를 도로 칠한다.
    // 1444에서 ITA.16→FLO가 루카·시에나를 묻은 사고와 **같은 줄, 같은 파일**이다.
    "ITA.20.5_1": "VEN",                                                                   // 베네치아 석호 — 1200년 베네치아의 본토는 여기까지다
    "ITA.20.3_1": "PAPAL",                                                                 // 로비고(폴레시네) — 교황령 면이 이미 그렇게 칠하고 있었다

    // Levant: Crusader coast carved out of Ayyubid Syria/Palestine.
    "ISR.3_1": "JERU", "ISR.4_1": "JERU",            // Haifa/Acre, central coast (Jaffa)
    "LBN.5_1": "JERU", "LBN.7_1": "JERU", "LBN.8_1": "JERU",  // Mt Lebanon, Tripoli, Tyre/Sidon

    // Anatolia: Byzantine west & Black-Sea coast, Georgian NE, Cilician Armenia & Antioch
    // (JERU) in the SE, Ayyubid SE Mesopotamia; the centre stays Sultanate of Rum (SELJ).
    "TUR.40_1": "BYZ", "TUR.28_1": "BYZ", "TUR.73_1": "BYZ", "TUR.50_1": "BYZ", "TUR.22_1": "BYZ",
    "TUR.12_1": "BYZ", "TUR.41_1": "BYZ", "TUR.11_1": "BYZ", "TUR.59_1": "BYZ", "TUR.25_1": "BYZ",
    "TUR.56_1": "BYZ", "TUR.21_1": "BYZ", "TUR.16_1": "BYZ", "TUR.52_1": "BYZ", "TUR.66_1": "BYZ",
    "TUR.79_1": "BYZ", "TUR.54_1": "BYZ", "TUR.77_1": "BYZ", "TUR.46_1": "BYZ", "TUR.13_1": "BYZ",
    "TUR.81_1": "BYZ", "TUR.43_1": "BYZ", "TUR.19_1": "BYZ", "TUR.27_1": "BYZ", "TUR.70_1": "BYZ",
    "TUR.67_1": "BYZ", "TUR.63_1": "BYZ", "TUR.34_1": "BYZ", "TUR.75_1": "BYZ", "TUR.65_1": "BYZ",
    "TUR.45_1": "GEOR", "TUR.9_1": "GEOR", "TUR.10_1": "GEOR", "TUR.38_1": "GEOR", "TUR.4_1": "GEOR",
    "TUR.1_1": "ARM_C", "TUR.58_1": "ARM_C", "TUR.64_1": "ARM_C",
    "TUR.37_1": "JERU",
    "TUR.26_1": "AYY", "TUR.57_1": "AYY", "TUR.68_1": "AYY", "TUR.14_1": "AYY", "TUR.69_1": "AYY",
    "TUR.71_1": "AYY", "TUR.33_1": "AYY", "TUR.48_1": "AYY", "TUR.78_1": "AYY", "TUR.18_1": "AYY", "TUR.36_1": "AYY",

    // China: Jin in the north, Western Xia, Southern Song in the south, Dali, Tibet.
    "CHN.2_1": "JIN", "CHN.10_1": "JIN", "CHN.27_1": "JIN", "CHN.25_1": "JIN", "CHN.23_1": "JIN",
    "CHN.12_1": "JIN", "CHN.22_1": "JIN", "CHN.5_1": "JIN", "CHN.18_1": "JIN", "CHN.17_1": "JIN",
    "CHN.11_1": "JIN", "CHN.19_1": "JIN",
    "CHN.20_1": "XIA",
    "CHN.1_1": "SONG", "CHN.3_1": "SONG", "CHN.4_1": "SONG", "CHN.6_1": "SONG", "CHN.7_1": "SONG",
    "CHN.8_1": "SONG", "CHN.9_1": "SONG", "CHN.13_1": "SONG", "CHN.14_1": "SONG", "CHN.15_1": "SONG",
    "CHN.16_1": "SONG", "CHN.24_1": "SONG", "CHN.26_1": "SONG", "CHN.31_1": "SONG", "CHN.HKG": "SONG",
    "CHN.30_1": "DALI",
    "CHN.29_1": "TIBET", "CHN.21_1": "TIBET",
  },

  // Era cities: [name, modern-seed-name | [lng,lat], tier, population].
  // tier 4 = great-power capital ★, 3 = major city ◆, 2 = city, 1 = town.
  // Populations are c. 1200 estimates — a medieval "great city" held 50-200k.
  cities: [
    // — Christendom —
    ["Constantinople", "Istanbul", 4, 200000],
    ["Paris", "Paris", 4, 110000],
    ["London", "London", 3, 25000],
    ["Rome", "Rome", 3, 35000],
    ["Venice", "Venice", 3, 80000],
    ["Genoa", "Genoa", 2, 50000],
    ["Pisa", "Pisa", 2, 30000],
    ["Florence", "Florence", 2, 50000],
    ["Milan", "Milan", 2, 70000],
    ["Palermo", [13.36, 38.12], 3, 100000],
    ["Naples", "Naples", 2, 40000],
    ["Cologne", "Cologne", 2, 40000],
    ["Lübeck", "Lübeck", 1, 10000],
    ["Aachen", [6.08, 50.78], 1, 10000],
    ["Prague", "Prague", 2, 30000],
    ["Vienna", "Vienna", 2, 20000],
    ["Esztergom", "Esztergom", 2, 12000], // Hungarian royal seat
    ["Kraków", "Kraków", 2, 15000],
    ["Kiev", "Kyiv", 3, 45000],
    ["Novgorod", [31.27, 58.52], 3, 30000],
    ["Vladimir", "Vladimir", 2, 20000],
    ["Smolensk", "Smolensk", 1, 15000],
    ["Uppsala", "Uppsala", 1, 5000],
    ["Nidaros", "Trondheim", 1, 5000],
    ["Roskilde", "Roskilde", 1, 6000],
    ["Tarnovo", [25.62, 43.08], 2, 15000], // Bulgarian capital
    ["Thessalonica", [22.94, 40.64], 2, 40000],
    ["Toledo", [-4.02, 39.86], 2, 35000], // Castilian royal city
    ["Lisbon", "Lisbon", 2, 20000],
    ["Barcelona", "Barcelona", 2, 25000],
    // — Dar al-Islam —
    ["Seville", [-5.99, 37.39], 3, 80000], // Almohad seat in al-Andalus
    ["Córdoba", [-4.78, 37.89], 3, 60000],
    ["Granada", "Granada", 2, 30000],
    ["Marrakesh", "Marrakech", 3, 100000], // Almohad capital
    ["Fez", "Fès", 3, 80000],
    ["Tunis", "Tunis", 2, 40000],
    ["Cairo", "Cairo", 4, 200000], // Ayyubid capital
    ["Alexandria", "Alexandria", 2, 60000],
    ["Damascus", "Damascus", 3, 80000],
    ["Aleppo", "Aleppo", 2, 60000],
    ["Jerusalem", "Jerusalem", 2, 20000],
    ["Acre", [35.07, 32.93], 2, 40000], // Crusader capital
    ["Baghdad", "Baghdad", 4, 300000], // Abbasid caliphal seat
    ["Mosul", "Mosul", 2, 40000],
    ["Konya", "Konya", 2, 30000], // Seljuk Rum capital
    ["Mecca", "Mecca", 2, 15000],
    ["Tabriz", [46.29, 38.08], 2, 40000],
    ["Isfahan", [51.67, 32.65], 2, 60000],
    ["Nishapur", [58.8, 36.21], 2, 70000],
    ["Merv", [62.19, 37.66], 3, 100000],
    ["Bukhara", "Bukhara", 2, 60000],
    ["Samarkand", "Samarkand", 3, 80000],
    ["Gurganj", [59.15, 42.33], 3, 90000], // Khwarazmian capital
    ["Ghazni", "Ghaznī", 2, 40000], // Ghurid twin capital
    ["Herat", [62.2, 34.35], 2, 40000],
    // — India and Ceylon —
    ["Delhi", "Delhi", 2, 50000], // seat of the new Ghurid conquest
    ["Lahore", "Lahore", 2, 40000],
    ["Varanasi", [83.01, 25.32], 2, 50000],
    ["Thanjavur", [79.14, 10.79], 2, 60000], // Chola capital
    ["Polonnaruwa", [81.0, 7.94], 2, 30000], // Lankan capital
    // — East and Southeast Asia —
    ["Hangzhou", "Hangzhou", 4, 500000], // Lin'an, Southern Song capital
    ["Zhongdu", "Beijing", 3, 250000], // Jin capital
    ["Kaifeng", [114.31, 34.8], 3, 300000],
    ["Chengdu", "Chengdu", 2, 150000],
    ["Guangzhou", "Guangzhou", 2, 150000],
    ["Quanzhou", "Quanzhou", 2, 150000],
    ["Chang'an", [108.94, 34.34], 2, 80000],
    ["Kyoto", [135.77, 35.01], 3, 150000], // Heian-kyō
    ["Kamakura", [139.55, 35.32], 2, 50000], // seat of the new shogunate
    ["Kaesong", [126.55, 37.97], 2, 60000], // Goryeo capital
    ["Pagan", [94.86, 21.17], 3, 60000], // Burmese capital
    ["Angkor", [103.86, 13.44], 4, 400000], // Khmer capital — largest city on earth by area
    ["Thang Long", "Hanoi", 2, 50000], // Đại Việt capital
    // — Africa beyond Islam —
    ["Koumbi Saleh", [-7.68, 15.77], 2, 20000], // Ghana Empire
    ["Timbuktu", "Timbuktu", 1, 8000],
    ["Lalibela", [39.04, 12.03], 2, 15000], // Zagwe capital
    ["Kilwa", [39.51, -8.96], 2, 12000],
    ["Mogadishu", "Mogadishu", 2, 15000],
    ["Great Zimbabwe", [30.93, -20.27], 2, 10000],
    // — The Americas —
    ["Cahokia", [-90.06, 38.66], 2, 15000],
    ["Chan Chan", [-79.07, -8.1], 2, 30000], // Chimor capital
    ["Cusco", "Cusco", 1, 5000],
    ["Mayapan", [-89.46, 20.63], 1, 10000],
  ],

  simulationRules:
    "It is the year 1200, the height of the Middle Ages. Warfare is feudal: mounted knights, " +
    "levied infantry, castles and sieges; there is NO gunpowder and NO standing professional " +
    "army. The Holy Roman Empire is a loose confederation of princes under an elected emperor. " +
    "The Angevin (Plantagenet) kings of England also hold Normandy, Anjou and Aquitaine as " +
    "vassals of the French crown — a perpetual source of war (the map cannot show these French " +
    "holdings; treat western France as contested between England and France). The Byzantine " +
    "Empire is intact but internally weak; the Fourth Crusade's sack of Constantinople (1204) " +
    "has NOT happened. The Almohads dominate the Maghreb and southern Iberia while Castile, " +
    "Aragón, Navarre and Portugal press the Reconquista. The Ayyubids of Saladin's dynasty hold " +
    "Egypt and Syria; the Crusader states (Jerusalem, Antioch, Tripoli, Cyprus) cling to the " +
    "coast. The Abbasid Caliph in Baghdad has regained real power; the Khwarazmian Empire rises " +
    "in Persia while its rival, the Ghurid Empire, has just conquered the north-Indian plain " +
    "(Delhi fell in 1192). Kievan Rus' is a quarrelling family of principalities from Novgorod " +
    "to Kiev; the Pontic steppe belongs to the pagan Cumans (Kipchaks) and the middle Volga to " +
    "Muslim Volga Bulgaria — unclaimed steppe regions are Cuman grazing lands, not empty. In " +
    "the east the Jin and Southern Song divide China, Kamakura Japan is ruled by its shogun, " +
    "the Khmer Empire at Angkor rules mainland Southeast Asia, Pagan rules Burma, Dai Viet " +
    "holds the Red River, and Srivijaya commands the straits of the spice trade. Religion — " +
    "Latin Christianity, Orthodoxy, Sunni and Shia Islam — is the primary axis of alliance and " +
    "war. Mongol unification under Temüjin (Genghis Khan) looms after 1206." +
    " Money is silver pennies and Byzantine bezants; feudal hosts serve forty days and melt away, so wars are sieges and seasons. Historical trajectories the player may bend: the Fourth Crusade turning on Constantinople (1204), Bouvines (1214), Magna Carta (1215), the Albigensian Crusade (1209), and the Mongol storm gathering after 1206. MAP APPROXIMATIONS: feudal sovereignty is layered — vassals, church lands and city republics nest inside kingdoms the grid paints solid; the Holy Roman Empire's color is an election, not a state; Byzantine themes and crusader lordships are garrisoned coasts, not filled provinces.",

  startingTimelineText:
    "The year of grace 1200. In Rome the formidable Pope Innocent III asserts the supremacy of " +
    "the Church over kings. In Paris, Philip II Augustus schemes to strip the Plantagenets of " +
    "their French lands; across the Channel the lion-hearted Richard is newly dead and his " +
    "brother John wears England's crown uneasily. In Constantinople the Angeloi squander the " +
    "Roman inheritance as a crusader fleet gathers at Venice. Saladin's heirs quarrel over Egypt " +
    "and Syria while the banners of the Cross still fly over Acre and Antioch. In Iberia the " +
    "Almohad caliph holds the south against the Christian kings. Beyond the steppe, an obscure " +
    "Mongol chieftain named Temüjin is uniting the tribes. An age of cathedrals, crusades and " +
    "kings begins.",
};

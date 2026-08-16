/*! Open Historia — WWII 1935 buildup scenario preset © 2026 Nicholas Krol, MIT (see src/Editor/LICENSE). */
// World War II buildup preset — 1 December 1935. The war is four years away
// and NOTHING is decided: this is the scenario where the player gets the
// buildup, not just the fire. Mussolini's legions are two months into
// Abyssinia and the League's sanctions are two weeks old; the Hoare-Laval
// pact will leak within days and shame two governments; Germany rearms
// openly but the Rhineland is still demilitarized; Spain's Republic has not
// yet broken; Japan holds Manchukuo but the China war is two years off.
//
// Companion to wwii-1939 (the war-day scenario), the way the original game
// pairs a war start with an extended buildup start. Same modern-region
// approximation discipline; every grid limit is stated in simulationRules.
//
// Deliberate differences from wwii-1939's map, all era-true:
// - Austria and Czechoslovakia are sovereign polities (no Anschluss, no
//   Protectorate, no separate Slovakia).
// - Ethiopia is a polity AT WAR, still holding nearly all its territory.
// - Italy has no Albania and no Ethiopia; Memel is still Lithuanian.
// - China is unoccupied outside Manchukuo (the war begins in July 1937).
// - Spain is the Second Republic, seven months from the coup.

export default {
  id: "wwii-1935",

  meta: {
    name: "World War II — 1935 Buildup",
    heroTitle: "The Gathering Storm",
    heroSubtitle: "The world drifts toward war, 1 December 1935",
    eyebrow: "The Interwar Years",
    subtitle: "1 December 1935",
    accentColor: "#6b5b2e",
    coverImage: "public/loading_screen_2.jpg",
    description:
      "Four years before the panzers roll, everything is still in play. Italy wages the " +
      "League's first great test in Abyssinia, Germany rearms behind a demilitarized " +
      "Rhineland, Spain's Republic strains, and the democracies argue about sanctions. " +
      "Take any power through the years that decide whether the war happens at all.",
  },

  relabelOwnedCountries: false,
  unassignedKeepModernOwner: true,

  // Player starts as Germany — three years of rearmament choices before any
  // shot must be fired, if the player follows history at all.
  game: { country: "GER", startDate: "1935-12-01", gameDate: "1935-12-01" },

  // ── Plan F-3: 시대 경계 그래프트 — 창만 선언, 추출은 PC에서 ──────────────
  // 사용자 실측 지적: "1935 시나리오에서 나치 독일 국경선이 현대쪽이더라."
  // 맞다 — 이 보드에는 시대 지오메트리 선언이 아예 없었고, 그래서 독일이 현대
  // 독일 주 경계로 그려졌다. **동프로이센·슐레지엔·포메른·자를란트가 통째로
  // 빠진 그림이다.** OHM은 이 날짜를 212 폴리티로 답하고 그 안에
  // `Deutsches Reich`와 `Österreich`가 따로 있다 — 정확히 필요한 둘이다.
  //
  // 창은 1939 보드와 같은 [-10,35,45,71] (z4 16타일). 두 보드가 고쳐야 하는
  // 땅이 같기 때문이고, 이미 값이 검증된 창을 재사용하는 게 새로 고르는 것보다
  // 낫다. 아비시니아 위기(1935년 10월~)의 동아프리카는 이 창 밖이다 — 독일
  // 국경이 지적된 defect이므로 1차는 유럽으로 끊는다.
  //
  // **파일이 아직 없다.** build-preset은 그 경우 "조립 산출물 없음 — 현대
  // 프로빈스 조합으로 진행"이라 찍고 사다리 2단으로 내려간다(설계된 동작).
  // 그러니 이 선언은 지금 안전하고, PC에서 추출이 끝나면 그대로 켜진다.
  // excludeFaces·faceOwners·faceKeepOut은 **비워 둔다** — 면 목록을 실제로
  // 보기 전에 채우는 건 추측이고, 이 파일의 규칙에 어긋난다. 1차 빌드의
  // 재배정·절단 로스터를 읽고 붙인다(1444·1200·1300·117과 같은 절차).
  eraGeometry: {
    date: "1935-12-01",
    window: [-10, 35, 45, 71],
    // The HYBRID, not the bare rung-1 assembly. Rung 1 alone gave this window 38
    // faces and no Germany at all — measured, and normal: the sea guard rejects
    // western and central Europe as one unclosed blob (12 polities, 7% land), so
    // the deployed 1939 board scores worse on the same metric (26 faces). The
    // historical-basemaps backfill fills exactly that hole, and on this date it
    // draws the one thing the board was reported for: Germany and East Prussia as
    // two faces with the Polish Corridor between them.
    file: "scripts/ohm/out/era-borders-1935-12-01-z4-hybrid.geojson",

    // Three fences, each on a border that a treaty had already closed and that
    // did not move again before this board's date. Everything else the graft
    // reassigned is left alone.
    excludeFaces: [
      // The Gulf protectorates are ONE colour on this board by design — the
      // country list puts Bahrain, Qatar, the Trucial States and Kuwait all
      // under the British Empire, and Kuwait's and Oman's faces find no polity
      // to attach to. Letting Qatar alone break out would leave a single
      // protectorate painted as a country while its neighbours stayed imperial,
      // and would mint a polity with no colour in the spec — which is how a
      // procedural fallback colour ends up differing between the two clones.
      "Qatar",
      // ── world_1930이 1935에 없는 나라를 들고 온다 (rung-3의 대가) ─────────
      // 오스만 술탄국은 1922년에 끝났고, 헤자즈와 하일은 1925·1921년에
      // 정복돼 1932년 사우디아라비아로 합쳐졌다. 미매칭으로 두면 매 빌드
      // 로스터에 찍히므로 여기 적어 **의도된 제외**임을 남긴다.
      "Ottoman Sultanate",
      "Hejaz",
      "Hail",
      "Emirate of Bin Shal'an",
      "Mesopotamia (GB)", // 이라크는 1932년에 독립했다 — 위임통치 이름은 낡았다
      // **"White Russia"는 벨라루스가 아니라 소련 전체다.** 처음엔 이름만
      // 보고 BYE(벨로루시 SSR)에 붙였는데, 절단 로스터가 벨라루스를 카자흐·
      // 투르크멘·우즈벡·아프간 국경에서 자르고 있길래 면을 재어 봤다:
      // bbox가 **경도 -180~180 · 위도 35~77**이다. basemap이 소련 한 덩어리를
      // 그렇게 이름 붙였을 뿐이고(저장소 스스로 학술용이 아니라고 경고한다),
      // 이 보드는 소련을 SOV + SSR들로 이미 제대로 모델링한다. 통짜 면은
      // 그것보다 나쁘므로 버린다 — 이름만 보고 붙이면 안 된다는 실측 사례.
      "White Russia",
    ],

    faceKeepOut: {
      // LAUSANNE, 1923. Turkey's Anatolian and Thracian borders were settled
      // then and stood untouched through 1939. The rung-3 Italy face reached
      // into Anatolia anyway and took nine provinces outright — the Sèvres
      // zone Italy was promised in 1920 and never held. Italy's real Aegean
      // holding in 1935 is the Dodecanese, which GADM files under GRC, so
      // fencing TUR costs the board nothing it should have.
      Italy: ["TUR"],
      // KARS, 1921. Kars and Ardahan went to Turkey and stayed there; the three
      // Transcaucasian faces were pulling twelve eastern provinces back over a
      // line that had been fixed for fourteen years.
      Georgia: ["TUR"],
      Armenia: ["TUR"],
      Azerbaijan: ["TUR"],
      // Liechtenstein was sovereign in 1935 and is its own polity on this board.
      // The rung-3 Austria face swallowed both of its regions.
      Austria: ["LIE"],
      // THE SAAR CAME HOME IN MARCH 1935 and this board opens in December. The
      // basemap this face comes from is world_1930, five years before the
      // plebiscite, so it still holds Saarland (DEU.DEC0) for France. France's
      // real German-facing gain of the period is Alsace-Lorraine, which GADM
      // files under FRA, so nothing France should hold is behind this fence.
      France: ["DEU"],
    },

    faceOwners: {
      // The face is named for the province and the province was German — it is
      // the eastern half of the shape the board was reported for, the one the
      // Polish Corridor separates from the rest of the Reich. Left unmatched it
      // painted nothing and Königsberg stayed Soviet on a 1935 map.
      "East Prussia": "GER",
      // 국제연맹 관할이라 독일도 폴란드도 아니다 — 폴리티 선언부의 긴 주석 참조.
      "Freie Stadt Danzig": "DZG",
      // ── 아래는 wwii-1939 스펙과 같은 해결 (같은 면 이름, 같은 보유국) ────
      // 1차 빌드의 미매칭 로스터를 읽고 붙였다. 이 블록이 없으면 면 매칭이
      // 65/73에서 44/73으로 떨어진다(실측 — 한 번 덮여서 그 값을 봤다).
      "Algérie française": "FRA",
      "Protectorat français de Tunisie": "FRA",
      "République Libanaise": "FRA",
      "Tangier International Zone": "FRA",
      "Djebel Druze": "FRA", // 시리아 위임통치령 안의 드루즈 국가
      "État des Alaouites": "FRA", // 같은 위임통치령 안의 알라위 국가
      "Syria (France)": "FRA", // rung-3가 같은 땅을 한 덩어리로도 준다
      Libia: "ITA",
      "Libya (IT)": "ITA",
      "British Cyprus": "GBR",
      "Colony of Malta": "GBR",
      "Protectorate of Kuwait": "GBR",
      "Sultanate of Muscat and Oman": "GBR", // rung 1
      // rung-3(world_1930)은 같은 해안을 두 면으로 나눠 준다 — 빌드 로그의
      // 쉼표는 구분자다(한 이름으로 읽고 매핑했다가 안 걸린 적이 있다).
      "Trucial Oman": "GBR",
      "Muscat and Oman": "GBR",
      "Mandatory Palestine (GB)": "GBR",
      "Colonia del Rio de Oro": "ESP",
      "Saguía el Hamra": "ESP",
      "Territorio de Ifni": "ESP",
      // 1932년부터 독립국이고 이 스펙에 폴리티가 없다 — 이름을 그대로 쓴다.
      "المملكة العراقية الهاشمية": "Iraq",
      // 1935에 독립국이다(이탈리아 병합은 1939년 4월). 로스터에 폴리티가
      // 없으므로 리터럴 이름으로 현대 주권을 그대로 쓴다.
      "Mbretnija Shqiptare": "Albania",
      // 1922년부터 자유국이고 1937년에 에이레가 된다 — 영국령이 아니다.
      "Saorstát Éireann / Irish Free State": "Ireland",
    },
  },

  polities: {
    // ── 자치령: 왕관은 같아도 정부는 각자다 ───────────────────────────────────
    // 1931년 웨스트민스터 헌장 이후 자치령은 대외정책까지 자기 것이다 — 1939년
    // 9월 캐나다는 따로 선전포고했고, 남아공은 의회 표결로 참전을 정했다.
    CAN: { name: "Dominion of Canada", color: "#c05a6a", aliases: ["캐나다 자치령", "캐나다", "Canada"] },
    AUS: { name: "Commonwealth of Australia", color: "#d07a5a", aliases: ["호주 연방", "오스트레일리아", "Australia"] },
    NZL: { name: "Dominion of New Zealand", color: "#b06a7a", aliases: ["뉴질랜드 자치령", "뉴질랜드", "New Zealand"] },
    SAF: { name: "Union of South Africa", color: "#a87a5a", aliases: ["남아프리카 연방", "남아공", "South Africa"] },
    // ── 영국령 아프리카: 색 하나가 아니라 총독부 셋 ───────────────────────────
    BWA: { name: "British West Africa", color: "#c09a6a", aliases: ["영국령 서아프리카", "British West Africa", "Nigeria", "Gold Coast"] },
    BEA: { name: "British East Africa", color: "#b08a5a", aliases: ["영국령 동아프리카", "British East Africa", "Kenya", "Tanganyika"] },
    BCA: { name: "British Central Africa", color: "#a89a7a", aliases: ["영국령 중앙아프리카", "로디지아", "Rhodesia", "Nyasaland"] },
    // ── The Union, as its own constitution draws it ───────────────────────────
    // The USSR on 1 December 1935 is SEVEN union republics, not one bloc: the
    // 1936 constitution that promotes Kazakhstan and Kirghizia out of the RSFSR
    // and dissolves the Transcaucasian federation is a year away. Moscow holds
    // foreign policy, the army and the Party in one hand (see the rules) — these
    // are the administrations the era actually ran through, and the reason a
    // player can take the RSFSR and feel the Union around them.
    RSF: { name: "Russian SFSR", color: "#a03c28", aliases: ["러시아 SFSR", "러시아 소비에트 연방 사회주의 공화국", "Russian Soviet Federative Socialist Republic", "RSFSR", "Russia", "Soviet Union", "소련"] },
    UKR: { name: "Ukrainian SSR", color: "#b9603a", aliases: ["우크라이나 SSR", "우크라이나", "Ukraine", "Ukrainian Soviet Socialist Republic"] },
    BYE: { name: "Byelorussian SSR", color: "#8d5236", aliases: ["벨로루시 SSR", "백러시아", "Byelorussia", "Belarus"] },
    ZSF: { name: "Transcaucasian SFSR", color: "#c07a4a", aliases: ["자캅카스 SFSR", "트랜스캅카스", "Transcaucasia", "Georgia", "Armenia", "Azerbaijan"] },
    UZB: { name: "Uzbek SSR", color: "#c99a52", aliases: ["우즈베크 SSR", "우즈베키스탄", "Uzbekistan"] },
    TKM: { name: "Turkmen SSR", color: "#b08a4a", aliases: ["투르크멘 SSR", "투르크메니스탄", "Turkmenistan"] },
    TJK: { name: "Tajik SSR", color: "#a87c46", aliases: ["타지크 SSR", "타지키스탄", "Tajikistan"] },
    KAZ: { name: "Kazak ASSR", color: "#8f6b3c", aliases: ["카자흐 ASSR", "카자흐스탄", "Kazakhstan"] },
    KGZ: { name: "Kirghiz ASSR", color: "#9c7a44", aliases: ["키르기스 ASSR", "키르기스스탄", "Kyrgyzstan"] },

    // ── China: a republic in name, a patchwork in fact ────────────────────────
    // Nanjing's writ runs over the lower Yangtze and little else. Everything
    // below held its own army, taxes and foreign policy in December 1935.
    SHX: { name: "Shanxi Clique", color: "#7d8f5a", aliases: ["산시 군벌", "옌시산", "Yan Xishan", "Shanxi"] },
    XIN: { name: "Xinjiang Clique", color: "#6f8f7a", aliases: ["신장 군벌", "성스차이", "Sheng Shicai", "Xinjiang"] },
    GXC: { name: "New Guangxi Clique", color: "#8a9a4a", aliases: ["신계계", "광시 군벌", "Li Zongren", "Guangxi"] },
    GDC: { name: "Guangdong Clique", color: "#9aa04a", aliases: ["광둥 군벌", "천지탕", "Chen Jitang", "Guangdong"] },
    YUN: { name: "Yunnan Clique", color: "#6a9a6a", aliases: ["윈난 군벌", "룽윈", "Long Yun", "Yunnan"] },
    SZC: { name: "Sichuan Cliques", color: "#8a8a6a", aliases: ["쓰촨 군벌", "류샹", "Liu Xiang", "Sichuan"] },
    SDC: { name: "Shandong Clique", color: "#9a8a5a", aliases: ["산둥 군벌", "한푸쥐", "Han Fuju", "Shandong"] },
    MAC: { name: "Ma Clique", color: "#a89a6a", aliases: ["마가군벌", "마부팡", "Ma Bufang", "Qinghai"] },
    CSR: { name: "Chinese Soviet Republic", color: "#c03030", aliases: ["중화소비에트공화국", "중국공산당", "Chinese Communist Party", "Mao Zedong"] },
    TIB: { name: "Tibet", color: "#c8c0a0", aliases: ["티베트", "Tibet", "Ganden Phodrang"] },
    MGL: { name: "Mengjiang", color: "#b0a070", aliases: ["몽강", "내몽골 자치운동", "Inner Mongolia", "De Wang"] },

    // ── The empires, administered ────────────────────────────────────────────
    // A colony's governor answered to a capital, but the administration was the
    // thing on the ground with its own army, budget and borders — and drawing
    // one flat "British Empire" over a fifth of the planet is why the map read
    // as if colonies were not implemented at all.
    RAJ: { name: "British Raj", color: "#c07a8a", aliases: ["영국령 인도", "인도 제국", "British India", "India"] },
    // ── 번왕국: 라지는 한 덩어리가 아니었다 ────────────────────────────────
    // 원본 대조에서 뒤집힌 판단이다(docs/analysis/wwii-plus-plus-audit.md §1-2).
    // World War II++는 British Raj 위에 번왕국 60여 개를 개별 폴리티로 둔다 —
    // 1935년 인도 아대륙의 40%가 영국이 직접 통치하지 않는 땅이었고, 1937년
    // 이벤트가 "British India, Princely States, Federated Shan States" 셋을
    // 나란히 부르는 것이 그 구조다.
    //
    // 우리는 60개를 다 두지 않는다. 대부분이 1지역짜리가 될 텐데 우리 지역
    // 계약상 "1지역 = 나라 전체"라 서사 부담만 늘고, 애초에 우리 지역은 현대
    // level-1이라 그만한 해상도가 없다. 대신 **현대 지역 하나가 통째로 번왕국
    // 땅이었던 다섯**만 꺼낸다 — 나머지는 관구(봄베이·마드라스·벵골·연합주)라
    // 정말로 영국 직할이었으므로 RAJ에 남는 게 맞다.
    JKS: { name: "Jammu and Kashmir", color: "#9f8fb5", aliases: ["잠무 카슈미르", "카슈미르", "Kashmir", "Dogra"] },
    RJP: { name: "Rajputana", color: "#c9a05a", aliases: ["라지푸타나", "라자스탄", "Rajasthan", "Jaipur", "Jodhpur", "Udaipur", "Bikaner"] },
    HYD: { name: "Hyderabad", color: "#8fae7a", aliases: ["하이데라바드", "니잠", "Nizam", "Deccan"] },
    MYS: { name: "Mysore", color: "#7fa89a", aliases: ["마이소르", "Mysuru", "Wadiyar"] },
    TRV: { name: "Travancore and Cochin", color: "#b0937f", aliases: ["트라방코르", "코친", "Travancore", "Cochin"] },
    AOF: { name: "French West Africa", color: "#5a7fc0", aliases: ["프랑스령 서아프리카", "Afrique-Occidentale française", "AOF"] },
    AEF: { name: "French Equatorial Africa", color: "#4a6fb0", aliases: ["프랑스령 적도아프리카", "Afrique-Équatoriale française", "AEF"] },
    FIC: { name: "French Indochina", color: "#6a8fd0", aliases: ["프랑스령 인도차이나", "Indochine française", "Indochina"] },
    DEI: { name: "Dutch East Indies", color: "#d08a4a", aliases: ["네덜란드령 동인도", "Nederlands-Indië", "Dutch East Indies", "Indonesia"] },
    BCO: { name: "Belgian Congo", color: "#8a9a3a", aliases: ["벨기에령 콩고", "Congo belge", "Belgian Congo"] },
    GER: { name: "Germany", color: "#3a3a3a", aliases: ["독일", "나치 독일", "Third Reich", "German Reich", "Nazi Germany", "Deutsches Reich"] },
    // ── 단치히 자유시: 어느 나라도 아니다 ──────────────────────────────────
    // OHM이 이 날짜에 `Freie Stadt Danzig` 면을 주는데 보드에 받을 폴리티가
    // 없어 매 빌드 미매칭으로 떨어졌다. 독일에 붙이면 **1939년 9월 병합을
    // 4년 앞당기는 것**이고, 폴란드에 붙이면 주권을 잘못 말한다 — 베르사유
    // 조약이 만든 국제연맹 관할체이고, 폴란드가 가진 것은 위임된 권한
    // (외교 대표·관세·항만·군 주둔)뿐이지 주권이 아니었다. 고등판무관이
    // 분쟁을 재결하고 상소는 연맹으로만 갔다.
    //
    // **원본도 이 나라를 폴리티로 둔다** — 수확한 1935 팔레트에
    // `Free City of Danzig #AEA1FF`가 있다(docs/analysis/palette-wwii-1935
    // .json). 색까지 원본을 따른다.
    //
    // 1935년 12월의 실상은 나치가 이미 시의회를 쥔 자유시다(1933년 집권,
    // 1935년 선거에서 72석 중 43석, 주민 95%가 독일계). 그래서 이 보드에서
    // 단치히는 "독일 땅"이 아니라 **독일이 그해에 삼키려 하는 별개의 나라**
    // 이고, 그게 이 보드가 다루는 이야기 자체다.
    DZG: { name: "Free City of Danzig", color: "#AEA1FF", aliases: ["단치히 자유시", "단치히", "Danzig", "Gdańsk", "Freie Stadt Danzig", "Wolne Miasto Gdańsk"] },
    // **코드 충돌 수리**: 이 줄은 원래 `AUS`였고, 위에서 선언한 호주 연방을 조용히
    // 덮었다. 결과는 "오스트리아라는 이름으로 호주와 파푸아뉴기니를 다스리는 나라"
    // 였다(빌드 로그의 `PNG→Austria`가 그 흔적). ISO대로 AUS는 호주, AUT는 오스트리아.
    AUT: { name: "Austria", color: "#b8b8c8", aliases: ["오스트리아", "Federal State of Austria", "Austrian Republic"] },
    CSK: { name: "Czechoslovakia", color: "#5b7fae", aliases: ["체코슬로바키아", "Czechoslovak Republic", "ČSR"] },
    ETH: { name: "Ethiopia", color: "#7a8f3a", aliases: ["에티오피아", "Abyssinia", "Ethiopian Empire"] },
    SIA: { name: "Siam", color: "#4068bf", aliases: ["시암", "Thailand", "Kingdom of Siam"] },
    ITA: { name: "Italy", color: "#4f7942", aliases: ["이탈리아", "Kingdom of Italy", "Fascist Italy"] },
    JAP: { name: "Japan", color: "#b23b3b", aliases: ["일본 제국", "Empire of Japan", "Imperial Japan"] },
    MAN: { name: "Manchukuo", color: "#cc8844", aliases: ["만주국", "Manchuria"] },
    SOV: { name: "Soviet Union", color: "#8b1a1a", aliases: ["소련", "USSR", "Soviet Russia"] },
    GBR: { name: "British Empire", color: "#c0507a", aliases: ["대영제국", "영국", "United Kingdom", "Britain", "Great Britain"] },
    FRA: { name: "French Republic", color: "#3f6fd0", aliases: ["프랑스", "France", "French Empire"] },
    NLD: { name: "Netherlands", color: "#e08a2e", aliases: ["네덜란드", "Dutch Empire", "Holland"] },
    BEL: { name: "Belgium", color: "#b0902e", aliases: ["벨기에", "Belgian Empire"] },
    POR: { name: "Portugal", color: "#2e7d6b", aliases: ["포르투갈", "Portuguese Empire", "Estado Novo"] },
    ESP: { name: "Spain", color: "#d0a02e", aliases: ["스페인 공화국", "Spanish Republic", "Second Spanish Republic"] },
    USA: { name: "United States", color: "#4a8f7a", aliases: ["미국", "America", "United States of America"] },
    YUG: { name: "Yugoslavia", color: "#6a8caf", aliases: ["유고슬라비아", "Kingdom of Yugoslavia"] },
    ROU: { name: "Romania", color: "#c08a3a", aliases: ["루마니아", "Kingdom of Romania"] },
    CHI: { name: "Republic of China", color: "#4a6db5", aliases: ["중화민국", "China", "Nationalist China", "Kuomintang"] },
    MON: { name: "Mongolian People's Republic", color: "#a85454", aliases: ["몽골", "Mongolia", "Outer Mongolia"] },
    DAN: { name: "Denmark", color: "#8a5f6d", aliases: ["덴마크", "Kingdom of Denmark"] },
  },

  countryAssignments: {
    // — Germany within its Versailles-plus-Saar borders. The Rhineland is
    //   German territory (demilitarized — a rules fact, not a map fact); the
    //   Saar rejoined in March 1935 after the plebiscite.
    GER: ["DEU"],
    AUT: ["AUT"],
    CSK: ["CZE", "SVK"],
    // — Ethiopia fights on: the northern front is around Mekelle, the
    //   southern in the Ogaden, and the capital is free.
    ETH: ["ETH"],
    SIA: ["THA"],
    // — Italy: Libya and the Horn colonies. Not Ethiopia (at war), not
    //   Albania (occupied April 1939).
    ITA: ["ITA", "LBY", "ERI", "SOM"],
    // — Japan: the home islands, Korea, Taiwan, the South Seas Mandate.
    JAP: ["JPN", "KOR", "TWN", "MNP", "PLW", "MHL", "FSM"],
    // 연방 자체는 지도에 그리지 않는다 — 구성 공화국이 곧 소련이다(룰 참조).
    RSF: ["RUS"],
    UKR: ["UKR"],
    BYE: ["BLR"],
    ZSF: ["GEO", "ARM", "AZE"],
    UZB: ["UZB"],
    TKM: ["TKM"],
    TJK: ["TJK"],
    KAZ: ["KAZ"],
    KGZ: ["KGZ"],
    GBR: ["GBR", "LKA", "SDN", "GUY", "BLZ", "JAM", "TTO", "BHS", "BRB", "ATG", "DMA", "GRD", "KNA", "LCA", "CYM", "VGB", "TCA", "CYP", "MLT", "MYS", "SGP", "BRN", "JOR", "ISR", "PSE", "BHR", "QAT", "ARE", "KWT", "FJI", "SLB", "MUS", "SYC"],
    CAN: ["CAN"],
    AUS: ["AUS", "PNG"],
    NZL: ["NZL", "WSM"],
    SAF: ["ZAF", "NAM", "LSO", "SWZ"],
    BWA: ["NGA", "GHA", "SLE", "GMB"],
    BEA: ["KEN", "UGA", "TZA"],
    BCA: ["ZMB", "ZWE", "MWI", "BWA"],
    // 버마는 1937년 4월에야 인도에서 분리된다 — 1935년에는 아직 인도 제국의 주.
    RAJ: ["IND", "PAK", "BGD", "MMR"],
    FRA: ["FRA", "DZA", "TUN", "MAR", "SYR", "LBN", "CMR", "TGO", "MDG", "DJI", "COM", "GUF", "NCL", "PYF", "MYT", "REU", "GLP", "MTQ", "SPM", "WLF", "ATF"],
    AOF: ["SEN", "MLI", "CIV", "GIN", "BFA", "BEN", "NER", "MRT"],
    AEF: ["TCD", "CAF", "COG", "GAB"],
    FIC: ["VNM", "LAO", "KHM"],
    NLD: ["NLD", "SUR"],
    DEI: ["IDN"],
    BEL: ["BEL"],
    BCO: ["COD", "RWA", "BDI"],
    POR: ["PRT", "AGO", "MOZ", "GNB", "CPV", "STP", "TLS"],
    ESP: ["ESP", "ESH", "GNQ"],
    USA: ["USA", "PHL", "PRI", "GUM", "VIR"],
    YUG: ["SRB", "HRV", "BIH", "MNE", "MKD", "SVN", "XKO"],
    ROU: ["ROU", "MDA"],
    CHI: ["CHN"],
    MON: ["MNG"],
    // Iceland rides with Denmark until 1944 — sovereign in personal union on
    // paper, Danish ground on the board (eraSovereignty ISL, and the original
    // preset's own Denmark owns all eight Icelandic regions in 1935).
    DAN: ["DNK", "GRL", "FRO", "ISL"],
  },

  regionAssignments: {
    // ── 번왕국 (위 polities 주석 참조) ────────────────────────────────────
    // 잠무카슈미르는 셋을 합쳐야 번왕국 하나가 된다 — GADM이 분쟁지로 쪼개
    // 놓은 조각들이고, 1935년에는 도그라 왕조 한 사람의 땅이었다.
    "Z01.14_1": "JKS",  // 잠무 카슈미르
    "Z06.1_1": "JKS",   // 아자드 카슈미르 (1947년 이후 구분)
    "Z06.6_1": "JKS",   // 길기트-발티스탄
    // 라지푸타나는 거의 전부가 번왕국이었다 — 영국 직할지가 사실상 없다.
    "IND.29_1": "RJP",  // 라자스탄 = 라지푸타나 연합청
    // 하이데라바드 번왕국의 핵심. 니잠의 수도가 여기다.
    "IND.32_1": "HYD",  // 텔랑가나 = 하이데라바드
    // 아래 둘은 근사다. 마이소르 번왕국은 카르나타카 남부였고 북부는 봄베이
    // 관구였다. 트라방코르·코친은 케랄라 남부였고 북부 말라바르는 마드라스
    // 관구였다. 어느 쪽도 딱 맞지 않지만, "전부 영국 직할"보다는 훨씬 가깝다.
    "IND.16_1": "MYS",  // 카르나타카 ≈ 마이소르
    "IND.17_1": "TRV",  // 케랄라 ≈ 트라방코르 + 코친
    // ── 중국: 난징의 영은 하류 양쯔를 넘지 못한다 (1935년 12월) ──────────────
    // 아래는 전부 자기 군대·세금·대외 교섭을 가진 세력이다. 국민정부는
    // 강남 8개 성을 실효 지배하고 나머지는 명목상 복속이다.
    "CHN.25_1": "SHX",  // 산시 — 옌시산의 30년 아성
    "CHN.28_1": "XIN",  // 신장 — 성스차이, 소련의 후원 아래
    "CHN.7_1": "GXC",   // 광시 — 신계계
    "CHN.6_1": "GDC",   // 광둥 — 천지탕
    "CHN.9_1": "GDC",   // 하이난
    "CHN.30_1": "YUN",  // 윈난 — 룽윈
    "CHN.26_1": "SZC",  // 쓰촨 — 류샹
    "CHN.3_1": "SZC",   // 충칭
    "CHN.23_1": "SDC",  // 산둥 — 한푸쥐
    "CHN.21_1": "MAC",  // 칭하이 — 마부팡
    "CHN.20_1": "MAC",  // 닝샤 — 마훙쿠이
    "CHN.5_1": "MAC",   // 간쑤 서부(근사)
    "CHN.22_1": "CSR",  // 산시(섬서) — 대장정이 10월에 끝난 곳, 홍군의 새 근거지
    "CHN.29_1": "TIB",  // 시짱 — 라싸는 난징의 통치를 받지 않는다
    // ── 내몽골은 한 덩어리가 아니다 ────────────────────────────────────────────
    // `CHN.19` 하나를 MGL에 주면 **현대 내몽골 자치구 전체**가 몽강이 된다 —
    // 만주 접경부터 닝샤까지 이어지는 초승달 12연맹 전부다. 1935년에 그 땅은
    // 세 사람 것이었고, 지금 지도는 만주국과 마가군벌의 땅을 몽강이 덮고 있다.
    //
    //   동부 4연맹 — 러허(1933년 만주국 병합)와 싱안 3성. **만주국**이다.
    //   알샨 — 닝샤 왕공기, 마훙쿠이의 관할. **마가군벌**이다.
    //   차하르·수이위안 7연맹 — 더왕의 자치정무위원회가 1934년 바이링먀오에
    //     앉은 곳. 보드가 몽강으로 근사하는 그 땅이고, 여기만 MGL로 남긴다.
    //
    // (1935-12-01에 몽강연합위원회는 아직 없다 — 몽골군정부가 1936년 2월,
    //  연합위원회가 1937년이다. 스펙이 "더왕의 자치운동"이라고 적어 둔 근사를
    //  유지하되, 남의 땅에서 물러나게만 한다.)
    "CHN.19.6_1": "MAN",   // 후룬베이얼 — 싱안북성
    "CHN.19.12_1": "MAN",  // 싱안 — 이름 그대로 만주국 성
    "CHN.19.8_1": "MAN",   // 퉁랴오(저리무) — 싱안남성
    "CHN.19.4_1": "MAN",   // 츠펑(자오우다) — 러허, 1933년 만주국이 병합했다
    "CHN.19.1_1": "MAC",   // 아라산 — 닝샤 왕공기
    "CHN.19.11_1": "MGL",  // 시린골 — 차하르
    "CHN.19.9_1": "MGL",   // 울란차브 — 바이링먀오가 여기다
    "CHN.19.5_1": "MGL",   // 후허하오터(구이쑤이) — 수이위안 성도
    "CHN.19.2_1": "MGL",   // 바오터우 — 수이위안
    "CHN.19.3_1": "MGL",   // 바얀누르 — 수이위안
    "CHN.19.7_1": "MGL",   // 오르도스(이커자오) — 수이위안
    "CHN.19.10_1": "MGL",  // 우하이 — 오르도스·아라산 경계의 현대 시, 수이위안 쪽
    // 허베이·차하르는 11월 기동방공자치정부 이후 일본의 그늘에 있다 —
    // 명목은 국민정부, 실질은 완충지대(룰에서 다룬다).
    // GERMANY'S EASTERN BORDER IS THE VERSAILLES LINE, NOT THE ODER-NEISSE.
    //
    // The board was drawing 1945 here: every voivodeship of modern Poland was
    // Polish, so Breslau, Stettin, Allenstein and Oppeln — German towns for
    // centuries and German until the war ended — sat on the Polish side of a
    // line that would not be drawn for another ten years. That is the same
    // fault as the Corridor being missing, on the other side of it.
    //
    // Split provinces are left with Poland rather than guessed at: Śląskie is
    // mostly the eastern Upper Silesia that the 1921 plebiscite and the third
    // uprising put in Polish hands, and Pomorskie IS the Corridor. Danzig is a
    // Free City inside Pomorskie and has no polity here, so it stays Polish —
    // named, not silently rounded off.
    "POL.1_1": "GER",   // Dolnośląskie — Niederschlesien (Breslau)
    "POL.5_1": "GER",   // Lubuskie — Ostbrandenburg (Landsberg)
    "POL.8_1": "GER",   // Opolskie — Oberschlesien, the part that stayed German
    "POL.14_1": "GER",  // Warmińsko-Mazurskie — southern East Prussia (Allenstein)
    "POL.16_1": "GER",  // Zachodniopomorskie — Pommern (Stettin)
    // 회랑은 **좁다** — 현대 포모제 전체가 폴란드였던 게 아니다.
    // 서쪽 끝(슈톨프·라우엔부르크)은 독일 힌터포메른, 동쪽 끝(마리엔부르크·
    // 마리엔베르더)은 서프로이센이고, 폴란드는 그 사이 그디니아·카르투지·
    // 호이니체 띠뿐이다. 셋으로 갈리는 유일한 지역이다.
    //
    // **기준선이 하루 동안 독일이었다(2026-08-15 → 08-16). 되돌렸다.**
    // 그때는 `Germany`·`East Prussia`가 rung-3 면인데 이 지역엔 rung-1 면
    // (`Polska`·`Freie Stadt Danzig`)이 있었고, eraGeometry가 **지역 단위로**
    // rung-3 후보를 통째로 버려서(1935에서 589지역) 독일 면이 들어올 길이
    // 없었다. 기준선을 뒤집는 게 유일한 통로였다 — 결과는 맞았지만 그건 우회지
    // 사실이 아니었다. 1935년 포모제의 기본값은 폴란드다.
    //
    // 규칙이 면적 단위로 바뀌면서(2026-08-16) 길이 생겼다. rung-1 폴란드·
    // 자유시 면이 덮는 만큼 먼저 가져가고 **남은 땅**을 독일·동프로이센 면이
    // 가져간다. 우회 없이 같은 세 갈래가 나오는 걸 재빌드 후 열다섯 도시 점
    // 검사로 확인했다.
    //
    // 면 실측(점 포함 검사, 하이브리드 파일): 슈톨프·라우엔부르크 → `Germany` ·
    // 호이니체·그디니아·카르투지 → `Polska` · 단치히 → `Freie Stadt Danzig` ·
    // 마리엔부르크·마리엔베르더·알렌슈타인 → `East Prussia` · 슈테틴 → `Germany`.
    // 면은 1935년 선을 처음부터 알고 있었다.
    // 줄 자체가 없는 게 되돌린 상태다. 이 보드엔 폴란드 폴리티가 아예 없고
    // (`unassignedKeepModernOwner`가 현대 이름 "Poland"를 그대로 쓴다), 그래서
    // 여기 쓸 수 있는 값은 독일뿐이었다. 배정을 지우면 기본값이 폴란드로
    // 돌아가고, 그게 1935년 포모제의 사실이다.
    // East Prussia is German until 1945.
    "RUS.21_1": "GER",  // Kaliningrad = Königsberg
    // Memel is still LITHUANIAN in 1935 (annexed March 1939) — no override.
    "CHN.HKG": "GBR",   // Hong Kong
    // Manchukuo — Japan's puppet since 1932; the rest of China is UNOCCUPIED
    // (the Marco Polo Bridge is nineteen months away).
    "CHN.11_1": "MAN",  // Heilongjiang
    "CHN.17_1": "MAN",  // Jilin
    "CHN.18_1": "MAN",  // Liaoning
    // British Somaliland (the north of modern Somalia; the rest is Italian).
    "SOM.1_1": "GBR",   // Awdal
    "SOM.18_1": "GBR",  // Woqooyi Galbeed (Hargeisa)
    "SOM.17_1": "GBR",  // Togdheer
    "SOM.13_1": "GBR",  // Sanaag
    "SOM.16_1": "GBR",  // Sool
    // Aden Colony + Protectorates; northern Yemen is the independent
    // Mutawakkilite Kingdom.
    "YEM.1_1": "GBR",   // 'Adan
    "YEM.15_1": "GBR",  // Lahij
    "YEM.2_1": "GBR",   // Abyan
    "YEM.4_1": "GBR",   // Al Dali'
    "YEM.20_1": "GBR",  // Shabwah
    "YEM.12_1": "GBR",  // Hadramawt
    "YEM.7_1": "GBR",   // Al Mahrah
  },

  // Era cities: [name, modern-seed-name | [lng,lat], tier, population ~1935].
  cities: [
    // — Europe —
    ["Berlin", "Berlin", 4, 4243000],
    ["Hamburg", "Hamburg", 3, 1682000],
    ["Munich", "Munich", 2, 746000],
    ["Cologne", "Cologne", 2, 757000],
    ["Königsberg", "Kaliningrad", 2, 316000],
    ["Saarbrücken", [7.0, 49.23], 1, 130000], // rejoined the Reich in March
    ["Vienna", "Vienna", 3, 1874000], // capital of SOVEREIGN Austria
    ["Prague", "Prague", 3, 921000], // capital of Czechoslovakia
    ["Bratislava", [17.11, 48.15], 1, 141000],
    ["Danzig", "Gdańsk", 2, 383000], // the Free City
    ["Memel", [21.14, 55.71], 1, 40000], // still Lithuanian
    ["Breslau", "Wrocław", 2, 625000],
    ["Warsaw", "Warsaw", 3, 1260000],
    ["London", "London", 4, 8480000],
    ["Manchester", "Manchester", 2, 746000],
    ["Glasgow", [-4.25, 55.86], 2, 1103000],
    ["Paris", "Paris", 4, 2870000],
    ["Marseille", "Marseille", 2, 900000],
    ["Rome", "Rome", 4, 1178000],
    ["Milan", "Milan", 3, 1084000],
    ["Naples", "Naples", 2, 850000],
    ["Madrid", "Madrid", 3, 1006000], // the Republic's capital
    ["Barcelona", "Barcelona", 2, 1075000],
    ["Lisbon", "Lisbon", 2, 570000],
    ["Amsterdam", "Amsterdam", 2, 780000],
    ["Brussels", [4.35, 50.85], 2, 900000],
    ["Bern", [7.45, 46.95], 1, 115000],
    ["Copenhagen", "Copenhagen", 2, 680000],
    ["Oslo", "Oslo", 2, 260000],
    ["Stockholm", "Stockholm", 2, 545000],
    ["Helsinki", "Helsinki", 1, 270000],
    ["Tallinn", "Tallinn", 1, 140000],
    ["Riga", "Riga", 2, 380000],
    ["Kaunas", "Kaunas", 1, 110000], // interwar Lithuanian capital
    ["Budapest", "Budapest", 3, 1120000],
    ["Bucharest", "Bucharest", 2, 800000],
    ["Belgrade", "Belgrade", 2, 290000],
    ["Sofia", "Sofia", 2, 350000],
    ["Athens", "Athens", 2, 460000],
    ["Dublin", "Dublin", 1, 468000], // the Free State
    // — Soviet Union —
    ["Moscow", "Moscow", 4, 3660000],
    ["Leningrad", [30.32, 59.94], 3, 2900000],
    ["Stalingrad", "Volgograd", 2, 400000],
    ["Kiev", "Kyiv", 2, 800000],
    ["Kharkov", "Kharkiv", 2, 800000], // Ukraine's capital until 1934
    ["Minsk", "Minsk", 1, 220000],
    ["Odessa", "Odesa", 2, 580000],
    ["Baku", "Baku", 2, 750000],
    ["Tbilisi", "Tbilisi", 1, 480000],
    ["Tashkent", "Tashkent", 2, 550000],
    ["Novosibirsk", "Novosibirsk", 1, 350000],
    ["Vladivostok", "Vladivostok", 1, 190000],
    // — The war in Africa, and the rest of it —
    ["Addis Ababa", "Addis Ababa", 3, 130000], // free, defiant, at war
    ["Asmara", [38.94, 15.34], 1, 60000], // Italy's forward base
    ["Mekelle", [39.47, 13.5], 1, 10000], // the northern front
    ["Cairo", "Cairo", 3, 1250000],
    ["Alexandria", "Alexandria", 2, 650000],
    ["Tripoli", "Tripoli", 1, 100000], // Italian Libya
    ["Algiers", "Algiers", 2, 240000],
    ["Casablanca", "Casablanca", 2, 240000],
    ["Dakar", "Dakar", 1, 85000],
    ["Lagos", "Lagos", 1, 150000],
    ["Léopoldville", "Kinshasa", 1, 40000],
    ["Nairobi", "Nairobi", 1, 55000],
    ["Johannesburg", "Johannesburg", 2, 460000],
    ["Cape Town", "Cape Town", 2, 320000],
    // — Middle East —
    ["Istanbul", "Istanbul", 3, 740000],
    ["Ankara", "Ankara", 2, 123000],
    ["Tehran", "Tehran", 2, 470000],
    ["Baghdad", "Baghdad", 2, 350000],
    ["Jerusalem", "Jerusalem", 1, 125000], // British Mandate
    // — Asia —
    ["Tokyo", "Tokyo", 4, 6100000],
    ["Osaka", "Ōsaka", 3, 3000000],
    ["Kyoto", [135.77, 35.01], 2, 1050000],
    ["Keijo", "Seoul", 2, 640000], // colonial Seoul
    ["Hsinking", [125.32, 43.88], 2, 300000], // Manchukuo's built capital
    ["Mukden", "Shenyang", 2, 750000],
    ["Peiping", "Beijing", 3, 1500000], // NOT occupied — the war is 19 months away
    ["Tientsin", "Tianjin", 3, 1100000],
    ["Shanghai", "Shanghai", 4, 3480000], // the concessions glitter
    ["Nanking", "Nanjing", 3, 950000], // the Nationalist capital
    ["Chungking", "Chongqing", 2, 400000],
    ["Canton", "Guangzhou", 2, 1000000],
    ["Hong Kong", "Hong Kong", 2, 950000],
    ["Lhasa", [91.12, 29.65], 1, 30000],
    ["Hanoi", "Hanoi", 2, 140000],
    ["Saigon", "Ho Chi Minh City", 2, 230000],
    ["Bangkok", "Bangkok", 2, 600000],
    ["Rangoon", [96.16, 16.87], 2, 380000],
    ["Singapore", "Singapore", 2, 650000],
    ["Batavia", "Jakarta", 2, 480000],
    ["Manila", "Manila", 2, 550000], // the brand-new Commonwealth (Nov 1935)
    ["Delhi", "Delhi", 3, 470000],
    ["Bombay", "Mumbai", 3, 1380000],
    ["Calcutta", [88.36, 22.57], 3, 1950000],
    ["Karachi", "Karachi", 2, 330000],
    ["Colombo", "Colombo", 1, 330000],
    // — The Americas —
    ["New York", "New York", 4, 7100000],
    ["Washington", [-77.04, 38.91], 3, 600000],
    ["Chicago", "Chicago", 3, 3340000],
    ["Detroit", "Detroit", 2, 1570000],
    ["Los Angeles", "Los Angeles", 3, 1350000],
    ["San Francisco", "San Francisco", 2, 620000],
    ["Honolulu", "Honolulu", 1, 160000],
    ["Ottawa", "Ottawa", 2, 140000],
    ["Toronto", "Toronto", 2, 640000],
    ["Montreal", "Montréal", 2, 870000],
    ["Vancouver", "Vancouver", 1, 260000],
    ["Mexico City", "Mexico City", 3, 1300000],
    ["Havana", "Havana", 2, 540000],
    ["Caracas", "Caracas", 1, 250000],
    ["Bogotá", "Bogotá", 1, 300000],
    ["Lima", "Lima", 2, 480000],
    ["Santiago", "Santiago", 2, 900000],
    ["Buenos Aires", "Buenos Aires", 3, 2250000],
    ["Montevideo", "Montevideo", 2, 660000],
    ["Rio de Janeiro", "Rio de Janeiro", 3, 1650000],
    ["São Paulo", "São Paulo", 3, 1120000],
    // — Oceania —
    ["Sydney", "Sydney", 2, 1235000],
    ["Melbourne", "Melbourne", 2, 990000],
    ["Canberra", "Canberra", 1, 9000],
    ["Wellington", "Wellington", 1, 150000],
    ["Auckland", "Auckland", 1, 210000],
  ],

  simulationRules:
    "It is 1 December 1935 — the buildup years, not the war. Italy invaded Ethiopia on 3 " +
    "October: the northern front presses south from Eritrea, the League of Nations has voted " +
    "sanctions (oil pointedly excluded), and within days the Hoare-Laval pact to partition " +
    "Ethiopia will leak and disgrace London and Paris. Ethiopia still holds nearly all its " +
    "territory and fights on (historically Addis Ababa fell in May 1936). Germany rearms " +
    "openly — conscription and the Luftwaffe were announced in March, the Nuremberg Laws in " +
    "September — but the RHINELAND IS DEMILITARIZED (historically remilitarized March 1936): " +
    "German troops west of the Rhine before then is a treaty-shattering gamble. Austria and " +
    "Czechoslovakia are sovereign; the Anschluss (1938), Munich (1938) and the war (1939) are " +
    "TRAJECTORIES, not facts — the player can bend or break them. Spain is the Second " +
    "Republic, polarized, seven months from the generals' coup. Japan rules Korea, Taiwan and " +
    "Manchukuo; north China is under creeping Japanese pressure but full war begins " +
    "historically in July 1937. Stalin's Great Purge begins in 1936. The United States hides " +
    "behind the Neutrality Acts. Technology must reflect 1935: biplanes giving way to the " +
    "first monoplane fighters, light tanks and doctrine experiments, no radar networks, " +
    "treaty-bound battlefleets (the London Naval Conference opens THIS MONTH). Colonial " +
    "empires are intact. MAP APPROXIMATIONS: modern provinces approximate 1935 borders — " +
    "the Polish Corridor and Danzig are approximate, interwar Poland's eastern territories " +
    "are not drawn, and the demilitarized Rhineland is a legal status the map cannot show." +
    " THE UNION IS ONE STATE, DRAWN AS ITS REPUBLICS. The RSFSR, Ukrainian, " +
    "Byelorussian, Transcaucasian, Uzbek, Turkmen and Tajik republics (and the " +
    "Kazak and Kirghiz ASSRs inside the RSFSR) appear separately because that is " +
    "how the Union administered itself in 1935 — but Moscow holds foreign policy, " +
    "the Red Army and the Party in one hand. They do not declare war on each " +
    "other, do not sign treaties separately, and do not defect: a republic acts " +
    "against Moscow only through the era's real mechanisms — Party faction, purge, " +
    "national deviation trial, famine and its aftermath. The 1936 constitution " +
    "(December) promotes Kazakhstan and Kirghizia to union republics and dissolves " +
    "the Transcaucasian federation into Georgia, Armenia and Azerbaijan. CHINA IS " +
    "NOT ONE STATE. Nanjing rules the lower Yangtze and levies its authority " +
    "elsewhere by negotiation: Shanxi, Xinjiang, Guangxi, Guangdong, Yunnan, " +
    "Sichuan, Shandong and the Ma family's northwest each hold their own army, " +
    "taxes and foreign dealings, and several treat with Tokyo or Moscow directly. " +
    "The Long March ended in October and the Chinese Soviet Republic now sits in " +
    "northern Shaanxi with the Red Army it saved. Hebei and Chahar slid under a " +
    "Japanese-sponsored autonomous council in November — nominally Nationalist, in " +
    "fact a buffer. A united front against Japan is possible and is the era's " +
    "great question; it is NOT the default, and it costs the player who builds it. " +
    "COLONIES ARE ADMINISTRATIONS, NOT COLOURS. The British Raj, French West " +
    "Africa, French Equatorial Africa, French Indochina, the Dutch East Indies and " +
    "the Belgian Congo appear as themselves because each had its own governor, " +
    "budget, army and border. They obey the metropole on war and treaty, but their " +
    "own crises — famine, congress agitation, conscription quotas, a governor's " +
    "own initiative — are theirs, and a metropole that loses at home does not " +
    "instantly lose them." +
    " INTERNAL POLITICS — ONLY FOR THE PLAYER'S OWN COUNTRY. Where the player " +
    "leads one of the polities below, that country carries a live internal " +
    "mechanic, reported at the end of each period as its own item and moved by " +
    "what the player actually did. Never show another polity's internal " +
    "politics: what Moscow's factions are doing is Moscow's business unless " +
    "Moscow is the player. RUSSIAN SFSR and the Soviet republics — STALIN'S " +
    "SUSPICION, running from none through mild, medium and high to extreme. " +
    "High suspicion buys obedience and eats the officer corps that has to fight " +
    "the next war; low suspicion preserves commanders and leaves rivals alive " +
    "and organising. It ends when the terror does. CHINESE SOVIET REPUBLIC — " +
    "COLLECTIVE LEADERSHIP, a standing of the men who came out of the Long " +
    "March: Mao Zedong, Zhang Wentian, Zhou Enlai, Bo Gu and the rest, as " +
    "shares that always total 100. Report the shares and what moved them; when " +
    "one man is beyond challenge the mechanic ends and his line becomes policy. " +
    "REPUBLIC OF CHINA — WARLORD AUTONOMY, how much of the country Nanjing does " +
    "NOT actually govern, starting high. Every integration bought, coerced or " +
    "won lowers it; every clique pushed into Japanese or Communist arms raises " +
    "it. ITALY — THE DUCE'S STANDING, and separately the missions Mussolini " +
    "hands down: prestige projects the player must either deliver or quietly " +
    "bury, each one spending standing either way. GERMANY — the party-army-" +
    "industry triangle: the Reichswehr's generals, the party's own formations " +
    "and the industrialists each want different things from rearmament, and " +
    "the player's orders shift whose hand is on it. UNITED KINGDOM — the " +
    "rearmament-and-appeasement split across cabinet, Commons and press, where " +
    "every commitment abroad costs at home. A country not listed here has no " +
    "such mechanic and gets none invented for it. " +

    // WHAT THE WORLD DOES WHEN THE PERIOD DOES NOT GO AS IT WENT.
    //
    // The original names three of these outright, and they are worth having
    // verbatim because each one closes a specific way the simulation goes
    // slack: a refused Anschluss that simply evaporates, an appeased Poland
    // that ends the war before it starts, a late Norway that costs nothing.
    // The rule underneath them is the one that generalises — a plan that is
    // blocked does not vanish, it looks for another route.
    "WHEN HISTORY IS BLOCKED, IT DOES NOT EVAPORATE — IT LOOKS FOR ANOTHER " +
    "ROUTE. A power denied what the period says it wanted still wants it, and " +
    "reaches for the next means: coercion after persuasion, force after " +
    "coercion, a different target after a closed door. Three cases this " +
    "period actually turns on. If Austria refuses the Anschluss and stands " +
    "alone — no Italian or Western guarantee behind it — Germany does not " +
    "shrug: it declares war and takes the country, and the refusal buys " +
    "Austria a campaign, not safety. If the Allies appease the invasion of " +
    "Poland instead of declaring war, Germany reads that correctly and keeps " +
    "demanding and taking — one more claim, then another — and does not stop " +
    "until it turns east against the Soviet Union. If Germany is more than " +
    "three months late into Norway, the Allies land there first and cut the " +
    "iron ore off at Narvik, and the Reich's war economy feels it. Beyond " +
    "these three, apply the same reasoning to whatever the player actually " +
    "blocks: name the interest that was frustrated, and let the world pursue " +
    "it by the next available means rather than dropping it.",

  startingTimelineText:
    "December 1935. In the Ethiopian highlands the Negus's barefoot armies dig in against " +
    "Badoglio's bombers and mustard gas while the League of Nations debates an oil sanction " +
    "it dares not pass — and in London and Paris, two foreign ministers are secretly drafting " +
    "a deal to give Mussolini most of the country. In Berlin the Reich rearms in the open: " +
    "conscription returned in March, the Luftwaffe unveiled, the Saar home after its " +
    "plebiscite — but the Rhineland garrison towns still stand empty under Versailles's last " +
    "living clause. Vienna leans on Rome for its independence; Prague trusts its French " +
    "alliance and its border forts. In Madrid the Republic staggers between strikes and " +
    "conspiracies. In Moscow the show trials are being written. In Tokyo the fleet faction " +
    "walks out of naval talks. The storm is gathering, and every hand can still turn it.",
};

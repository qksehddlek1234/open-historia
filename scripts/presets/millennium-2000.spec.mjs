/*! Open Historia — Millennium Dawn 2000 scenario preset © 2026 Nicholas Krol, MIT (see src/Editor/LICENSE). */
// A New Millennium — 1 January 2000. The Y2K bug fizzled overnight, the
// dot-com boom is at full roar, and the United States bestrides a
// one-superpower world with no idea the unipolar moment is already ending:
// Vladimir Putin became acting president of Russia THIS MORNING.
//
// The 2000 map is almost the modern grid — the differences that matter are a
// short list (FR Yugoslavia, unified Sudan, UN-run East Timor, Taliban
// Afghanistan), so the unassigned world keeps its modern owner and the rules
// carry what the grid cannot draw (KFOR Kosovo, burning Grozny, the Oslo
// interim map, the Panmunjom line warming by degrees).

export default {
  id: "millennium-2000",

  meta: {
    name: "Millennium Dawn — 2000",
    heroTitle: "A New Millennium",
    heroSubtitle: "The century turns and history restarts, 1 January 2000",
    eyebrow: "Turn of the Century",
    subtitle: "1 January 2000",
    accentColor: "#2e6f9e",
    coverImage: "public/loading_screen_2.jpg",
    description:
      "The Y2K scare fizzled, the dot-com boom is roaring, and America bestrides a " +
      "one-superpower world it does not yet know is ending. Putin took the Kremlin this " +
      "morning; Chechnya burns; the two Koreas edge toward their first summit; and eleven " +
      "European currencies are about to become one. Play the decade nobody saw coming.",
  },

  relabelOwnedCountries: false,

  // 2000 borders are essentially modern borders — everyone unlisted keeps
  // their modern owner, which is historically right almost everywhere.
  unassignedKeepModernOwner: true,

  // Player starts as South Korea — 김대중's Sunshine Policy is live and the
  // first inter-Korean summit is six months out. The era's defining question
  // for a Korean player begins on day one.
  game: { country: "KOR", startDate: "2000-01-01", gameDate: "2000-01-01" },

  // Plan F-3: era geometry graft. Declared after the 2026-08-12 date batch
  // measured this date at 배정 52 · 실질 52.1% from the cached Overpass response —
  // the same band as the grafted 1836 baseline. The build discovers
  // era-borders-2000-01-01*.geojson in scripts/ohm/out and grafts matching
  // faces; absent the dump it builds exactly as before, and says so.
  eraGeometry: {
    date: "2000-01-01",
    // rung-3 백필을 얹은 하이브리드. mtime 자동 탐색에 맡기지 않는다 —
    // 평문과 하이브리드가 한 디렉터리에 같이 있고, 어느 쪽을 그리는지는
    // 우연이 아니라 선택이어야 한다(1935가 같은 이유로 못 박았다).
    file: "scripts/ohm/out/era-borders-2000-01-01-z4-hybrid.geojson",
    window: [-15, 30, 50, 72],
    // 2026-08-14 면 검수 (52면 전수).
    excludeFaces: [
      // 동부 잔여 메가면(44.3x28.8°, 링 109): 러시아가 2000년 창에서 폐합되지
      // 않아 벨라루스+러시아+미폐합 동부가 한 면이 되고 민스크의 벨라루스
      // 라벨을 얻었다. 점검사 실측: 모스크바 안, 키이우 밖(우크라이나는 따로
      // 폐합). 배제하면 두 나라 다 현대 지역을 유지한다.
      "Беларусь",
    ],
    faceOwners: {
      // 지역 패스 어휘(COUNTRY_NAMES)와 정확히 같은 문자열로 맞춘다 —
      // 지도와 소유권 테이블이 한 나라를 두 이름으로 부르면 안 된다.
      "Česko": "Czechia", // en=Czech Republic이지만 보드 어휘는 Czechia
      // 북키프로스: rung-3이 부르는 이름은 `Turkish Cypriot-administered area`인데
      // 베이스 지도의 어휘는 `Northern Cyprus`다(ownerCodes에 `Cyprus`와 나란히
      // 들어 있다). 새 폴리티를 세우는 문제가 아니다 — 이 보드의 교리는 "2000년이
      // 오늘과 다른 곳만 세운다"이고, 1974년 분단선은 그때나 지금이나 같다.
      // 이름만 맞춰 주면 그 선이 현대 GADM 모서리가 아니라 시대 자료에서 온다.
      "Turkish Cypriot-administered area": "Northern Cyprus",
      "ПЈР Македонија": "North Macedonia", // 2000년 당시 명칭은 FYROM — 보드 어휘 우선
      "ٱلْجُمْهُورِيَّةُ ٱلْعَرَبِيَّةُ ٱلْسُوْرِيَّة": "Syria",
      // 가자: 오슬로 체제 — 지구 대부분이 팔레스타인 자치정부 관할(A/B 구역).
      // 1989 보드와 달리 Palestine이 시대의 답이고 지역 패스와도 일치한다.
      "Israeli administration of Gaza": "Palestine",
      //
      // ★ 서안(`PSE.2_1`)은 **손대지 않는다 — 사용자 결정: 판단 보류, 이유만 기록.**
      //
      // 지금 면이 서안 전체를 이스라엘에 준다. 가자에 쓴 논리를 그대로 옮기면
      // 팔레스타인이 되어야 할 것 같지만, **서안은 가자와 모양이 다르다.**
      // 2000년 오슬로 체제에서 서안은 A(자치정부 전권, 약 18%) · B(자치정부 행정 +
      // 이스라엘 보안, 약 22%) · C(이스라엘 전권, 약 60%)로 갈린 **모자이크**이고,
      // 세 구역이 지리적으로 연속되지 않는다. 가자는 그 모자이크가 아니라 지구
      // 대부분이 A/B라 한 칸으로 답할 수 있었다.
      //
      // **GADM 한 칸으로는 그 모자이크를 표현할 수 없다.** 어느 쪽을 골라도 60%나
      // 40%를 틀리게 칠하고, 그 오차가 지도에서 "누가 다스리는가"로 읽힌다.
      // 그래서 면을 쪼갤 수 있게 되기 전까지는 **판단을 미루고 현재 배정을 둔다.**
      // 이건 답이 아니라 **답을 유보한 자리**이고, 그렇게 읽히라고 여기 적는다.
      // 면이 A/B/C로 쪼개지는 순간 이 주석이 그 작업의 명세가 된다.
    },
    // 점 검사 실측 두 건 — 융합 기록이 없는 소리 없는 삼킴은 스펙이 명명한다
    // (1939 독일-유틀란트 전례):
    // · Deutschland 면이 파리를 포함 — 2000 프랑스 미폐합, 라벨 점도 없음.
    // · España 면이 리스본을 포함하는데 다른 다섯 날짜와 달리 2000에만
    //   mergedWith(Portugal) 기록이 없다(포르투갈 라벨이 이 날짜에 부재) —
    //   첫 빌드 실측: PRT 지역 106건이 스페인으로 재배정되고 있었다.
    faceKeepOut: {
      "Deutschland": ["FRA"],
      "España": ["PRT"],
      // 이 파일에 손대다 발견한 기존 결함이다(내 이번 변경과 무관). 자료에
      // `San Marino` 면이 따로 있는데 `Italy` 면이 **둘**이고, 반도를 통으로 덮는
      // 쪽이 뒤에 적용돼 산마리노 7칸을 가져간다. 산마리노는 2000년에도 오늘도
      // 독립 공화국이다. 이탈리아 면을 막으면 제 면이 제 땅을 갖는다.
      "Italy": ["SMR"],
      // 아크로티리·데켈리아는 1960년 독립 조약이 영국 주권으로 남긴 기지다.
      // 북키프로스 면이 데켈리아(`XAD.2_1`)를 물었다 — 완충지대와 맞닿아 있지만
      // 기지 자체는 영국령이고 2000년에도 그렇다.
      "Turkish Cypriot-administered area": ["XAD"],
    },
  },

  polities: {
    // The four places where the 2000 map genuinely differs from the modern one.
    YUG: { name: "FR Yugoslavia", color: "#5b6fae", aliases: ["유고연방", "유고슬라비아", "Yugoslavia", "Serbia and Montenegro", "밀로셰비치의 유고"] },
    SUD: { name: "Sudan", color: "#b08a3e", aliases: ["수단", "통합 수단", "Republic of the Sudan"] },
    TLS: { name: "UN Administration in East Timor", color: "#7ab0d4", aliases: ["유엔 동티모르 과도행정기구", "동티모르", "East Timor", "UNTAET", "Timor-Leste"] },
    AFG: { name: "Islamic Emirate of Afghanistan", color: "#6b6b5a", aliases: ["아프가니스탄 이슬람 토후국", "탈레반 아프가니스탄", "Afghanistan", "Taliban Afghanistan"] },
    // Flavor renames — same territory as the modern grid, era-correct name.
    LBA: { name: "Libyan Arab Jamahiriya", color: "#3e7d5a", aliases: ["리비아", "대자마히리야", "Libya", "Gaddafi's Libya"] },
  },

  countryAssignments: {
    // Kosovo is drawn Yugoslav — NATO's KFOR runs it in fact (see rules).
    YUG: ["SRB", "MNE", "XKO"],
    // One Sudan: the south's autonomy and the 2011 referendum are a decade
    // and a civil war away.
    SUD: ["SDN", "SSD"],
    TLS: ["TLS"],
    AFG: ["AFG"],
    LBA: ["LBY"],
  },

  regionAssignments: {},

  // Era cities: [name, modern-seed-name | [lng,lat], tier, population ~2000].
  cities: [
    // — The Koreas, mid-thaw —
    ["Seoul", "Seoul", 4, 9900000], // Sunshine Policy headquarters
    ["Pyongyang", "Pyongyang", 2, 2800000], // preparing to receive a southern president
    ["Kaesong", [126.55, 37.97], 1, 300000], // the industrial park is only an idea yet
    ["Busan", "Busan", 2, 3700000],
    // — The one superpower —
    ["Washington", "Washington", 4, 570000], // Clinton's final year
    ["New York", "New York", 4, 8000000], // the boom's trading floor
    ["San Francisco", "San Francisco", 2, 780000], // dot-com ground zero
    // — Russia, changing hands this morning —
    ["Moscow", "Moscow", 4, 10100000], // an acting president since dawn
    ["Grozny", [45.7, 43.31], 1, 100000], // under assault as the century turns
    ["Saint Petersburg", [30.32, 59.94], 2, 4700000],
    // — The Balkans after the bombing —
    ["Belgrade", "Belgrade", 2, 1600000], // Milošević's last year
    ["Pristina", [21.17, 42.66], 1, 200000], // KFOR's capital in all but name
    ["Sarajevo", "Sarajevo", 1, 400000], // Dayton peace, five years old
    // — Europe on the eve of the euro —
    ["London", "London", 4, 7200000],
    ["Paris", "Paris", 4, 2100000],
    ["Berlin", "Berlin", 3, 3400000], // the government moved back last year
    ["Brussels", [4.35, 50.85], 2, 950000], // eleven currencies converging
    ["Frankfurt", [8.68, 50.11], 2, 640000], // the new central bank's home
    // — The wars nobody televises —
    ["Kinshasa", "Kinshasa", 2, 5000000], // Africa's world war
    ["Freetown", [-13.23, 8.48], 1, 700000], // RUF at the gates last year
    ["Asmara", [38.93, 15.33], 1, 400000], // trench war with Ethiopia
    ["Addis Ababa", "Addis Ababa", 2, 2400000],
    ["Khartoum", "Khartoum", 2, 3900000], // the long southern war
    // — The Middle East between intifadas —
    ["Jerusalem", [35.22, 31.78], 2, 650000], // Camp David is seven months out
    ["Baghdad", "Baghdad", 2, 5200000], // sanctions decade, no-fly zones
    ["Tehran", "Tehran", 3, 6900000], // Khatami's reform press flourishing
    ["Riyadh", "Riyadh", 2, 3500000],
    // — Asia —
    ["Kabul", "Kabul", 1, 1800000], // Taliban rule, Massoud in the northeast
    ["Islamabad", "Islamabad", 1, 550000], // Musharraf's three-month-old coup
    ["New Delhi", "New Delhi", 3, 12400000], // a year past Kargil, newly nuclear
    ["Beijing", "Beijing", 4, 10800000], // WTO accession being negotiated
    ["Shanghai", "Shanghai", 3, 14000000],
    ["Taipei", "Taipei", 2, 2600000], // the first-ever transfer of power, March
    ["Tokyo", "Tokyo", 4, 12000000], // the lost decade grinds on
    ["Jakarta", "Jakarta", 3, 8400000], // democracy one year old, Aceh restive
    ["Dili", [125.57, -8.56], 1, 50000], // burned in September, UN-run now
    // — The americas beyond the boom —
    ["Mexico City", "Mexico City", 3, 18000000], // PRI's seven-decade rule ends in July
    ["Bogotá", "Bogota", 2, 6300000], // Plan Colombia signed months ago
    ["Caracas", "Caracas", 2, 3000000], // Chávez's second year
    ["Havana", "Havana", 1, 2200000],
  ],

  simulationRules:
    "It is 1 January 2000. The Y2K rollover passed WITHOUT catastrophe overnight; treat any " +
    "millennium-bug event as media noise, not disaster. VLADIMIR PUTIN became acting president " +
    "of Russia THIS MORNING (Yeltsin resigned on New Year's Eve; the election is 26 March) — " +
    "the Second Chechen War is at its height, Grozny is under assault and falls in early " +
    "February historically. The UNITED STATES is the sole superpower at the peak of the " +
    "dot-com boom (the NASDAQ crash begins in March historically; Clinton is in his final " +
    "year; the Bush–Gore election in November is decided by a few hundred Florida votes — " +
    "simulate the campaign, do not preordain the winner). KOREA: 김대중's Sunshine Policy is " +
    "live; the first inter-Korean summit (June 2000, Pyongyang) is on the historical track " +
    "and player action can advance, reshape or wreck it; the North is emerging from famine " +
    "and its missile moratorium holds. ONGOING WARS with their termination logic: Second " +
    "Chechen War (urban assault → years of insurgency), Second Congo War (six armies in the " +
    "field; Lusaka ceasefire signed but dead — ends historically ~2003), Eritrea–Ethiopia " +
    "(trench stalemate → Ethiopian offensive May 2000 → Algiers peace December), Sierra " +
    "Leone (RUF vs government; UN mission arriving; British intervention May 2000), southern " +
    "Sudan (SPLA insurgency, no end in sight), Colombia (FARC at peak strength; Plan " +
    "Colombia funding arrives this year), Aceh and Mindanao insurgencies. FIXED-CALENDAR " +
    "ANCHORS the player cannot see coming but the world can: Taiwan elects 천수이볜 in March " +
    "(first KMT defeat ever — Beijing's rhetoric spikes), Mexico's PRI loses after 71 years " +
    "in July, Camp David talks collapse in July and the Second Intifada erupts in late " +
    "September, Milošević falls to the October revolution after losing the September " +
    "election, USS Cole is bombed in Aden in October. The EURO exists on ledgers; notes and " +
    "coins arrive 2002. NO FOREKNOWLEDGE: no actor may anticipate attacks, crashes or " +
    "revolutions that have not yet happened — foresight belongs to the player alone, and " +
    "even prepared players get attempts, not guarantees. MAP APPROXIMATIONS the rules carry: " +
    "Kosovo is drawn Yugoslav but run by KFOR/UNMIK (Belgrade exercises no authority there); " +
    "Chechnya is drawn Russian while the war rages; the Palestinian territories live under " +
    "the Oslo interim patchwork inside the drawn borders; Somalia has no functioning " +
    "national government (Somaliland de facto separate); Taliban Afghanistan is recognized " +
    "by only three states while Massoud's Northern Alliance holds the Panjshir and the " +
    "northeast. Occupation or secession mid-game creates its own polity rather than " +
    "recoloring a neighbor, per the engine's standing rules. " +

    "ELECTIONS ARE SIMULATED, NOT ANNOUNCED. Every democracy on this board goes to the " +
    "polls on its own real schedule, and the RESULT is computed from the state of that " +
    "country in the game — the economy the player and the world actually produced, the " +
    "wars it is in and how they are going, scandals that have surfaced, and how long the " +
    "incumbents have been there. Do not simply reproduce who really won. Name the winner, " +
    "the margin, and the one thing that decided it, and let the new government's " +
    "priorities differ from the old one's. A country whose government changes hands must " +
    "then ACT differently — its flag and name do not change, but its treaties, deployments " +
    "and budget arguments do. " +

    "CORRUPTION IS A TRACKED CONDITION, not an adjective. Each country carries a level of " +
    "it, and it does concrete work every turn: it takes a cut of what is spent, so " +
    "projects cost more and finish late; it decides how much of an aid package or an arms " +
    "purchase actually arrives; it sets the odds that a scandal surfaces and takes a " +
    "minister with it; and it is what makes a government that looks strong on paper lose " +
    "an election or a province. Raise it when money moves fast with no oversight — war " +
    "procurement, resource booms, reconstruction — and lower it only through something " +
    "that costs the government politically. " +

    "THE WARS ALREADY RUNNING MUST END, EACH IN ITS OWN WAY. Nine are burning at the start " +
    "— the second Chechen war, Afghanistan's Taliban against the Northern Alliance, the " +
    "second Congo war, Eritrea against Ethiopia, Sierra Leone, Angola, Sudan's north " +
    "against its south, Colombia's insurgency, and the Israeli-Palestinian process about " +
    "to collapse. None may simply fade out of the narration: each reaches a decision, and " +
    "WHO WINS DETERMINES WHAT THE COUNTRY IS THEN CALLED. If the Northern Alliance takes " +
    "Kabul the polity becomes the Islamic Republic of Afghanistan; if the Taliban hold, it " +
    "stays the Islamic Emirate. Apply the same rule everywhere a war is over the identity " +
    "of the state rather than a border. " +

    "EVENTS READ AS PRESS, AND THE PRESS DOES NOT KNOW EVERYTHING. Write turns in the " +
    "register of a newspaper of the year. An action taken in secret is not reported as " +
    "fact — at most it surfaces as rumour, a denial, or a leak weeks later, and the " +
    "player's own covert operations are subject to this too. Never label an event " +
    "'historical' or 'alternate'; the distinction is ours and printing it breaks the year. " +
    "And do NOT have anyone name al-Qaeda, or treat transnational jihadism as the " +
    "organising threat of the era, before the world has a reason to — in January 2000 it " +
    "is one item in a counter-terrorism annexe, and writing it as the main story is " +
    "hindsight wearing a press badge.",

  startingTimelineText:
    "The twentieth century closed at midnight. The Cold War has been over for a decade and " +
    "its dividends are everywhere: NATO and the EU are enlarging eastward, eleven European " +
    "currencies merged into the euro a year ago, and globalization feels less like a policy " +
    "than a law of nature. The United States enters the new millennium with a budget " +
    "surplus, a roaring stock market and no peer competitor — its foreign wars are air " +
    "campaigns, its debates about how to spend primacy. But the seams are visible to anyone " +
    "looking: Russia rang in the new year with a new acting president, an ex-KGB officer " +
    "nobody outside Moscow had heard of eighteen months ago, and his war in Chechnya is the " +
    "most popular thing the Kremlin has done in years. China is negotiating its way into " +
    "the WTO and watching Taiwan's March election with open menace. India and Pakistan " +
    "tested nuclear weapons eighteen months ago and fought a war in Kargil since. Africa's " +
    "world war consumes the Congo; Sierra Leone's peace is a signature on paper; Eritrea " +
    "and Ethiopia face each other across trenches. In the Middle East the Oslo process " +
    "limps toward one last summit. And on the Korean peninsula, for the first time since " +
    "the armistice, a southern president who preaches engagement faces a northern neighbor " +
    "hungry enough to talk. The era has no name yet. Whoever moves first gets to write it.",
};

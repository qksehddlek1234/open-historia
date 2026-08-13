/*! Open Historia — 1989 scenario preset © 2026 Nicholas Krol, MIT (see src/Editor/LICENSE). */
// 1989 — 1 January 1989. The last year of the world that came out of 1945.
//
// Second of the scenarios written to fill our own timeline's hole (1946 → 2000
// was fifty-four years with nothing in it). The original's 1989 preset is 550K
// rounds; see docs/analysis/presets-original.md.
//
// WHY THIS DATE IS DIFFERENT FROM EVERY OTHER BOARD IN THE FLEET.
//
// On 1 January 1989 nothing has happened yet and everything is loaded. The
// Berlin Wall stands and will fall in November. The Red Army is in Afghanistan
// and leaves in February. Poland is under a communist government that will hold
// a semi-free election in June and lose it. Hungary is quietly cutting its
// border fence. Tiananmen is five months away and so is Solidarity's victory —
// the same day, 4 June, going opposite ways. Yugoslavia and Czechoslovakia and
// the Soviet Union are all single countries and none of them will be in 1993.
//
// So this board must NOT be scripted. What actually decided 1989 was one
// question asked over and over: does Moscow send the tanks? It had sent them to
// Berlin in 1953, Budapest in 1956 and Prague in 1968, and in 1989 it did not —
// and every regime in eastern Europe fell within months of learning that. The
// rules below make that the mechanism rather than the outcome: preconditions
// and momentum, not a timeline. That is also the design the original arrived at
// through ten ruleset revisions (its Rev 8: "plant the forces and let the
// momentum model decide"), which is the part of it worth taking.
//
// Cities are 1946's list — the same places, forty-three years on.
import COLDWAR_1946 from "./coldwar-1946.spec.mjs";

export default {
  id: "coldwar-1989",

  meta: {
    name: "1989 — The Year It Ended",
    heroTitle: "Does Moscow Send the Tanks?",
    heroSubtitle: "The last year of the post-war world, 1 January 1989",
    eyebrow: "The Cold War Ends",
    subtitle: "1 January 1989",
    accentColor: "#5a4a72",
    coverImage: "public/loading_screen_2.jpg",
    description:
      "Everything is still standing and nothing is holding. The Wall, the Warsaw " +
      "Pact, the Union itself — each of them survives only as long as everyone " +
      "believes Moscow would defend it, and Moscow has spent four years hinting " +
      "that it would not. Berlin, Budapest and Prague all learned the answer the " +
      "hard way once. This is the year they ask again.",
  },

  relabelOwnedCountries: false,
  unassignedKeepModernOwner: true,

  // The Russian SFSR is the seat, as on the 1935 and 1946 boards: the Union's
  // weight runs through it, and its aliases answer to "Soviet Union" so a player
  // who types that reaches the right polity. Taking Lithuania or Ukraine instead
  // is the other great way to play this year, and both are polities here.
  game: { country: "RSF", startDate: "1989-01-01", gameDate: "1989-01-01" },

  // Plan F-3: era geometry graft. Declared after the 2026-08-12 date batch
  // measured this date at 배정 36 · 실질 51.8% from the cached Overpass response —
  // the same band as the grafted 1836 baseline. The build discovers
  // era-borders-1989-01-01*.geojson in scripts/ohm/out and grafts matching
  // faces; absent the dump it builds exactly as before, and says so.
  // faceOwners left empty: naming the frame-residue face and the colonial
  // holdings is a per-board pass over the ASSEMBLED faces, same as 1939.
  eraGeometry: {
    date: "1989-01-01",
    window: [-15, 30, 50, 72],
  },

  polities: {
    // ── 소련: 15개 연방 공화국 ────────────────────────────────────────────────
    // 1989년 1월에는 아직 하나의 나라다. 그러나 발트 3국에는 이미 인민전선이
    // 있고(사유디스는 1988년 6월), 8월에는 발트의 길이 이어진다. 공화국을
    // 폴리티로 두는 이유가 여기 있다 — 리투아니아를 잡는 것이 이 해의 또 다른
    // 가장 흥미로운 자리다.
    RSF: { name: "Russian SFSR", color: "#a03c28", aliases: ["러시아 SFSR", "소련", "Soviet Union", "USSR", "Russia", "Gorbachev", "고르바초프"] },
    UKS: { name: "Ukrainian SSR", color: "#b9603a", aliases: ["우크라이나 SSR", "우크라이나", "Ukraine", "Rukh"] },
    BYE: { name: "Byelorussian SSR", color: "#8d5236", aliases: ["벨로루시 SSR", "백러시아", "Byelorussia", "Belarus"] },
    GEO: { name: "Georgian SSR", color: "#c07a4a", aliases: ["그루지야 SSR", "조지아", "Georgia", "Tbilisi"] },
    ARM: { name: "Armenian SSR", color: "#b06a4a", aliases: ["아르메니아 SSR", "아르메니아", "Armenia", "Karabakh"] },
    AZE: { name: "Azerbaijan SSR", color: "#c08a5a", aliases: ["아제르바이잔 SSR", "아제르바이잔", "Azerbaijan"] },
    UZB: { name: "Uzbek SSR", color: "#c99a52", aliases: ["우즈베크 SSR", "우즈베키스탄", "Uzbekistan"] },
    TKM: { name: "Turkmen SSR", color: "#b08a4a", aliases: ["투르크멘 SSR", "투르크메니스탄", "Turkmenistan"] },
    TJK: { name: "Tajik SSR", color: "#a87c46", aliases: ["타지크 SSR", "타지키스탄", "Tajikistan"] },
    KAZ: { name: "Kazakh SSR", color: "#8f6b3c", aliases: ["카자흐 SSR", "카자흐스탄", "Kazakhstan"] },
    KGZ: { name: "Kirghiz SSR", color: "#9c7a44", aliases: ["키르기스 SSR", "키르기스스탄", "Kyrgyzstan"] },
    EST: { name: "Estonian SSR", color: "#7a6a8a", aliases: ["에스토니아 SSR", "에스토니아", "Estonia", "Rahvarinne"] },
    LVA: { name: "Latvian SSR", color: "#8a7a9a", aliases: ["라트비아 SSR", "라트비아", "Latvia"] },
    LTU: { name: "Lithuanian SSR", color: "#9a8aaa", aliases: ["리투아니아 SSR", "리투아니아", "Lithuania", "Sajudis", "사유디스"] },
    MDA: { name: "Moldavian SSR", color: "#b08a7a", aliases: ["몰다비아 SSR", "몰도바", "Moldova"] },
    // ── 바르샤바 조약: 아직 여섯 나라 ─────────────────────────────────────────
    GDR: { name: "German Democratic Republic", color: "#7a5a5a", aliases: ["독일민주공화국", "동독", "East Germany", "GDR", "DDR", "Honecker"] },
    POL: { name: "Polish People's Republic", color: "#b0705a", aliases: ["폴란드 인민공화국", "폴란드", "Poland", "Solidarity", "연대노조", "Jaruzelski"] },
    CSK: { name: "Czechoslovakia", color: "#5b7fae", aliases: ["체코슬로바키아", "Czechoslovak Socialist Republic", "Prague", "Havel"] },
    HUN: { name: "Hungarian People's Republic", color: "#8a9a5a", aliases: ["헝가리 인민공화국", "헝가리", "Hungary", "Nemeth"] },
    ROU: { name: "Socialist Republic of Romania", color: "#a08a4a", aliases: ["루마니아 사회주의공화국", "루마니아", "Romania", "Ceausescu", "차우셰스쿠"] },
    BGR: { name: "People's Republic of Bulgaria", color: "#9a7a5a", aliases: ["불가리아 인민공화국", "불가리아", "Bulgaria", "Zhivkov"] },
    // ── 블록 밖의 사회주의 ────────────────────────────────────────────────────
    YUG: { name: "Yugoslavia", color: "#6a8caf", aliases: ["유고슬라비아", "SFR Yugoslavia", "Milosevic", "밀로셰비치"] },
    ALB: { name: "Albania", color: "#7a8a4a", aliases: ["알바니아", "People's Socialist Republic of Albania", "Hoxha's Albania"] },
    // ── 서방 ─────────────────────────────────────────────────────────────────
    USA: { name: "United States", color: "#4a8f7a", aliases: ["미국", "America", "United States of America", "Reagan", "Bush"] },
    FRG: { name: "Federal Republic of Germany", color: "#8a8a9a", aliases: ["독일연방공화국", "서독", "West Germany", "FRG", "Bonn", "Kohl"] },
    GBR: { name: "United Kingdom", color: "#c0507a", aliases: ["영국", "United Kingdom", "Britain", "Thatcher", "대처"] },
    FRA: { name: "French Republic", color: "#3f6fd0", aliases: ["프랑스", "France", "Fifth Republic", "Mitterrand"] },
    // 마카오 하나 때문에 폴리티로 둔다 — 1999년 반환까지 포르투갈령이고,
    // 지역 배정의 소유자는 반드시 이 스펙의 폴리티여야 한다.
    POR: { name: "Portugal", color: "#2e7d6b", aliases: ["포르투갈", "Portuguese Republic", "Cavaco Silva"] },
    // ── 아시아 ───────────────────────────────────────────────────────────────
    PRC: { name: "People's Republic of China", color: "#c0392b", aliases: ["중화인민공화국", "중국", "China", "Deng Xiaoping", "덩샤오핑"] },
    ROC: { name: "Republic of China", color: "#4a6db5", aliases: ["중화민국", "타이완", "Taiwan", "Lee Teng-hui"] },
    ROK: { name: "Republic of Korea", color: "#3a7fbf", aliases: ["대한민국", "남한", "한국", "South Korea", "Roh Tae-woo", "노태우"] },
    PRK: { name: "Democratic People's Republic of Korea", color: "#a33232", aliases: ["조선민주주의인민공화국", "북한", "North Korea", "DPRK", "Kim Il-sung"] },
    JPN: { name: "Japan", color: "#b23b3b", aliases: ["일본", "Japan", "Showa", "Heisei"] },
    // 1978년 이래 베트남군이 캄보디아에 있고, 1989년 9월에 철수한다.
    VNM: { name: "Vietnam", color: "#a0503a", aliases: ["베트남", "Socialist Republic of Vietnam", "Hanoi"] },
    KHM: { name: "People's Republic of Kampuchea", color: "#8a6a4a", aliases: ["캄푸치아 인민공화국", "캄보디아", "Cambodia", "Hun Sen", "Phnom Penh"] },
    // 소련군은 1989년 2월 15일에 마지막으로 아무다리야를 건넌다. 나지불라
    // 정권은 그 뒤로도 3년을 버틴다 — 모두의 예상과 달리.
    AFG: { name: "Republic of Afghanistan", color: "#8a7a4a", aliases: ["아프가니스탄 공화국", "아프가니스탄", "Afghanistan", "Najibullah", "Kabul"] },
    // ── 중동: 두 개의 예멘 ────────────────────────────────────────────────────
    // 1990년 5월 통일 전, 세계 유일의 아랍 사회주의 국가와 그 북쪽 이웃.
    YAR: { name: "Yemen Arab Republic", color: "#b0a05a", aliases: ["예멘 아랍 공화국", "북예멘", "North Yemen", "Sanaa"] },
    PDR: { name: "People's Democratic Republic of Yemen", color: "#a05a4a", aliases: ["예멘 인민민주공화국", "남예멘", "South Yemen", "Aden", "PDRY"] },
    // ── 아프리카 ─────────────────────────────────────────────────────────────
    // 나미비아는 1990년 3월까지 남아공이 쥔다. 1988년 12월 뉴욕 협정으로
    // 쿠바군의 앙골라 철수와 맞물려 독립 일정이 잡혔다.
    ZAF: { name: "South Africa", color: "#a87a5a", aliases: ["남아프리카 공화국", "남아공", "South Africa", "Apartheid", "de Klerk", "Botha"] },
  },

  countryAssignments: {
    RSF: ["RUS"],
    UKS: ["UKR"],
    BYE: ["BLR"],
    GEO: ["GEO"],
    ARM: ["ARM"],
    AZE: ["AZE"],
    UZB: ["UZB"],
    TKM: ["TKM"],
    TJK: ["TJK"],
    KAZ: ["KAZ"],
    KGZ: ["KGZ"],
    EST: ["EST"],
    LVA: ["LVA"],
    LTU: ["LTU"],
    MDA: ["MDA"],
    POL: ["POL"],
    CSK: ["CZE", "SVK"],
    HUN: ["HUN"],
    ROU: ["ROU"],
    BGR: ["BGR"],
    YUG: ["SRB", "HRV", "BIH", "MNE", "MKD", "SVN", "XKO"],
    ALB: ["ALB"],
    USA: ["USA", "PRI", "GUM", "VIR", "MNP"],
    // 1989년에 남은 영국령. 홍콩은 지역 배정으로 따로 준다(CHN.HKG).
    // 카리브의 옛 식민지는 대부분 1960~70년대에 독립했으므로 여기 없다.
    GBR: ["GBR", "CYM", "VGB", "TCA", "SHN"],
    FRA: ["FRA", "GUF", "NCL", "PYF", "MYT", "REU", "GLP", "MTQ", "SPM", "WLF", "ATF"],
    POR: ["PRT"],
    PRC: ["CHN"],
    ROC: ["TWN"],
    ROK: ["KOR"],
    PRK: ["PRK"],
    JPN: ["JPN"],
    VNM: ["VNM"],
    KHM: ["KHM"],
    AFG: ["AFG"],
    // 나미비아는 아직 남아공 통치 아래다(1990년 3월 21일 독립).
    ZAF: ["ZAF", "NAM"],
  },

  regionAssignments: {
    // ── 두 독일 ──────────────────────────────────────────────────────────────
    // 1949년의 선이 40년째 그 자리에 있다. 자를란트는 1957년에 서독에 들어갔다.
    "DEU.4_1": "GDR",   // Brandenburg
    "DEU.8_1": "GDR",   // Mecklenburg-Vorpommern
    "DEU.14_1": "GDR",  // Sachsen
    "DEU.13_1": "GDR",  // Sachsen-Anhalt
    "DEU.16_1": "GDR",  // Thüringen
    "DEU.3_1": "GDR",   // Berlin — 동베를린은 동독 수도이고 서베를린은 아니다(규칙 참조)
    "DEU.10_1": "FRG", "DEU.9_1": "FRG", "DEU.15_1": "FRG", "DEU.6_1": "FRG",
    "DEU.2_1": "FRG", "DEU.7_1": "FRG", "DEU.1_1": "FRG", "DEU.5_1": "FRG",
    "DEU.11_1": "FRG", "DEU.12_1": "FRG",

    // ── 두 예멘 ──────────────────────────────────────────────────────────────
    // 1990년 5월 22일 통일 전. 남쪽은 아랍 세계 유일의 마르크스주의 국가다.
    "YEM.1_1": "PDR",   // `Adan
    "YEM.15_1": "PDR",  // Lahij
    "YEM.2_1": "PDR",   // Abyan
    "YEM.20_1": "PDR",  // Shabwah
    "YEM.12_1": "PDR",  // Hadramawt
    "YEM.7_1": "PDR",   // Al Mahrah
    "YEM.4_1": "PDR",   // Al Dali'
    "YEM.5_1": "YAR", "YEM.18_1": "YAR", "YEM.13_1": "YAR", "YEM.10_1": "YAR",
    "YEM.8_1": "YAR", "YEM.19_1": "YAR", "YEM.17_1": "YAR", "YEM.11_1": "YAR",
    "YEM.21_1": "YAR", "YEM.6_1": "YAR", "YEM.9_1": "YAR", "YEM.16_1": "YAR",
    "YEM.14_1": "YAR", "YEM.3_1": "YAR",

    "CHN.HKG": "GBR",   // 홍콩 — 1997년 반환까지 영국령. 1984년 공동선언이 이미 서명됐다
    "CHN.MAC": "POR",   // 마카오 — 1999년 반환. 공동선언은 1987년
  },

  cities: COLDWAR_1946.cities,

  simulationRules:
    "It is 1 January 1989. Everything built in 1945 is still standing and none " +
    "of it is held up by anything but belief. " +

    "THE ONE QUESTION THIS YEAR ASKS. Every communist government in eastern " +
    "Europe rests on the assumption that the Soviet Union would intervene to " +
    "save it — as it did in Berlin in 1953, Budapest in 1956 and Prague in " +
    "1968. Gorbachev has spent four years implying that it would not, and in " +
    "1989 he says so out loud. DO NOT SCRIPT THE COLLAPSE. Model the mechanism: " +
    "each regime's survival depends on (a) whether Moscow will back force, " +
    "(b) whether its own security organs will use force without that backing, " +
    "and (c) how much of its population is already in the street. Move those " +
    "three and the outcomes follow. A Moscow that reverses course — a player's " +
    "Moscow that reverses course — genuinely can hold the bloc together for a " +
    "while, at a price the rules below make it pay. " +

    "WHAT IS ALREADY IN MOTION on 1 January, and will happen unless someone " +
    "stops it: the last Soviet troops leave Afghanistan on 15 February; Hungary " +
    "legalises independent parties in January and begins cutting its Austrian " +
    "border fence in May; Poland's Round Table opens in February and produces a " +
    "semi-free election on 4 June that the Communist Party loses catastrophically; " +
    "on that same 4 June the People's Liberation Army clears Tiananmen Square, " +
    "and the two events are read against each other everywhere; Hungary opens the " +
    "border to Austria for East German holidaymakers in September and the GDR " +
    "starts to empty; the Wall opens on 9 November by a spokesman's mistake at a " +
    "press conference; Czechoslovakia falls in ten days from 17 November; " +
    "Ceausescu is shot on 25 December. Treat these as the CURRENT TRAJECTORY, " +
    "not as fixtures — each has preconditions, and a player who changes the " +
    "preconditions changes the event and should be told which one they changed. " +

    "INSIDE THE UNION. Nagorno-Karabakh has been in open dispute since 1988 and " +
    "Armenia is digging out of December's earthquake. The Baltic popular fronts " +
    "are legal mass organisations, and in August 1989 two million people hold " +
    "hands from Tallinn to Vilnius. The Congress of People's Deputies is elected " +
    "in March in the first contested Soviet election since 1917 and televised " +
    "live. None of this is secession yet — it is the year secession becomes " +
    "thinkable, and the player's decisions decide whether it becomes more. " +

    "BERLIN. The city is legally four-power and practically two: East Berlin is " +
    "the GDR's capital and West Berlin is not part of the Federal Republic. The " +
    "region grid gives the whole city to the GDR; the truth is the sentence " +
    "above, and events must respect it. " +

    "ELSEWHERE. Vietnam withdraws from Cambodia in September. Namibia's " +
    "independence process runs under the December 1988 New York Accords and " +
    "completes in March 1990. South Africa is still apartheid, but P. W. Botha " +
    "has a stroke in January and F. W. de Klerk replaces him in August — the " +
    "man who releases Mandela fourteen months later. Iran and Iraq stopped " +
    "shooting in August 1988 and neither has demobilised. The Intifada is in " +
    "its second year. " +

    "DOMESTIC POLITICS ARE NOT BACKGROUND HERE. At least once every two turns, " +
    "give the player's own country an internal event — a faction, a strike, a " +
    "shortage, an election, a scandal, a resignation. And ADVANCE the pressure " +
    "rather than reprinting it: an event that restates last turn's tension in " +
    "new words is a wasted turn. This is the one year where every government on " +
    "the board is fighting its own population as much as its rivals. " +

    "Technology and economy must reflect 1989: no consumer internet, fax and " +
    "telex and satellite television (which is how the East watches the West), " +
    "strategic arms talks under way, Soviet oil revenue collapsed with the 1986 " +
    "price fall, and eastern European economies carrying hard-currency debt they " +
    "cannot service. The map approximates 1989 control with modern " +
    "administrative regions.",

  startingTimelineText:
    "1 January 1989. In Moscow the General Secretary has spent four years telling " +
    "everyone that the doctrine which sent tanks to Prague is dead, and nobody in " +
    "Warsaw or Budapest or East Berlin has yet been willing to test whether he means " +
    "it. In Kabul the Fortieth Army is packing. In Gdansk the shipyard union that was " +
    "banned seven years ago is being invited to talks. In Beijing students are reading " +
    "the same newspapers as everyone else and drawing different conclusions. Along the " +
    "inner-German border the fence is exactly where it was in 1961 and the men in the " +
    "towers have the same orders. Yugoslavia is one country with a new Serbian leader " +
    "who has just discovered what a crowd will do for him. Everything on this map has " +
    "been standing for forty years, and by Christmas most of it will be gone.",
};

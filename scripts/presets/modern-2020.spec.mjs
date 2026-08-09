/*! Open Historia — 2020 scenario preset © 2026 Nicholas Krol, MIT (see src/Editor/LICENSE). */
// 2020 — 1 January 2020. The last ordinary morning.
//
// The original's "Unstable 2020s" (343K rounds) starts here, and this is the
// better next board than its 2026 siblings: Real World 2026 shares our new
// modern-2026's date, while 2020 is a genuine hole — the fleet ran 2000 → 2026
// with nothing between, and those twenty-six years contain the pandemic.
//
// WHY THIS DATE AND NOT ANOTHER IN THE 2020s.
//
// On 1 January 2020 a cluster of pneumonia cases in Wuhan has been reported to
// the WHO for exactly one day and nobody on this map has changed a single plan
// because of it. Everything else that defines the decade is already loaded and
// visible: Britain leaves the EU on the 31st, an American president is in the
// middle of an impeachment trial in an election year, Soleimani has two days to
// live, Hong Kong has been in the streets for seven months, Idlib is the last
// rebel province, and Armenia and Azerbaijan are nine months from a war that
// settles Nagorno-Karabakh by force.
//
// So the board's premise is dramatic irony: the player can see the whole decade
// coming EXCEPT the thing that actually arrives first. The rules below give the
// simulation the pandemic as a real, dated, unavoidable event — and make what
// each government does about it the question, which is what the decade was.
//
// FOUR PLACES WHERE THE MODERN MAP IS WRONG IN 2020, and they are all wars:
// eastern Ukraine, Syria, Libya, Yemen. Each is drawn, because in each case a
// side holds the provincial capital and so the grid can honestly say who owns
// the province.

export default {
  id: "modern-2020",

  meta: {
    name: "2020 — The Last Ordinary Morning",
    heroTitle: "Nobody Has Heard of It Yet",
    heroSubtitle: "Everything is already loaded except the thing that comes first — 1 January 2020",
    eyebrow: "The Unstable Decade",
    subtitle: "1 January 2020",
    accentColor: "#6a6a8a",
    coverImage: "public/loading_screen_2.jpg",
    description:
      "Britain leaves in thirty days, an American president is on trial in an " +
      "election year, Idlib is the last rebel province and Hong Kong has been in " +
      "the streets since June. Every crisis on this board is one somebody saw " +
      "coming. Yesterday a health commission in Wuhan reported twenty-seven " +
      "cases of a pneumonia it could not name.",
  },

  relabelOwnedCountries: false,
  unassignedKeepModernOwner: true,

  // The player starts as the Republic of Korea, as on the 1950 and 2026 boards.
  // In 2020 that seat is specific: the first country outside China to face the
  // thing at scale, and the one whose response was watched by everybody.
  game: { country: "KOR", startDate: "2020-01-01", gameDate: "2020-01-01" },

  polities: {
    // ── 동유럽: 2014년에 멈춘 전쟁 ────────────────────────────────────────────
    RUS: { name: "Russian Federation", color: "#a03c28", aliases: ["러시아", "Russia", "Moscow", "Putin"] },
    UKR: { name: "Ukraine", color: "#3f7fd0", aliases: ["우크라이나", "Ukraine", "Kyiv", "Zelensky"] },
    // 2014년 이래의 분리주의 공화국 둘. 민스크 협정은 서명됐고 지켜지지 않는다.
    DNR: { name: "Donetsk People's Republic", color: "#8a4a4a", aliases: ["도네츠크 인민공화국", "DNR", "DPR", "Donetsk separatists"] },
    LNR: { name: "Luhansk People's Republic", color: "#7a4040", aliases: ["루한스크 인민공화국", "LNR", "LPR", "Luhansk separatists"] },
    BLR: { name: "Belarus", color: "#8d6236", aliases: ["벨라루스", "Belarus", "Lukashenko"] },
    // ── 서방 ─────────────────────────────────────────────────────────────────
    USA: { name: "United States", color: "#4a8f7a", aliases: ["미국", "America", "United States of America", "Trump"] },
    GBR: { name: "United Kingdom", color: "#c0507a", aliases: ["영국", "United Kingdom", "Britain", "Brexit", "Johnson"] },
    FRA: { name: "French Republic", color: "#3f6fd0", aliases: ["프랑스", "France", "Macron"] },
    DEU: { name: "Germany", color: "#8a8a9a", aliases: ["독일", "Germany", "Merkel"] },
    // ── 아시아 ───────────────────────────────────────────────────────────────
    CHN: { name: "People's Republic of China", color: "#c0392b", aliases: ["중국", "China", "PRC", "Xi Jinping"] },
    TWN: { name: "Taiwan", color: "#4a6db5", aliases: ["대만", "타이완", "Taiwan", "Tsai Ing-wen"] },
    KOR: { name: "Republic of Korea", color: "#3a7fbf", aliases: ["대한민국", "한국", "남한", "South Korea", "Seoul"] },
    PRK: { name: "Democratic People's Republic of Korea", color: "#a33232", aliases: ["북한", "North Korea", "DPRK", "Kim Jong-un"] },
    JPN: { name: "Japan", color: "#b23b3b", aliases: ["일본", "Japan", "Abe", "Tokyo 2020"] },
    IND: { name: "India", color: "#d08a3a", aliases: ["인도", "India", "Modi"] },
    PAK: { name: "Pakistan", color: "#4a8f5a", aliases: ["파키스탄", "Pakistan"] },
    // 2020년 2월 도하 합의, 2021년 철수 — 이 보드에서는 아직 미군이 있다.
    AFG: { name: "Islamic Republic of Afghanistan", color: "#8a8a5a", aliases: ["아프가니스탄", "Afghanistan", "Ghani", "Kabul"] },
    // ── 시리아: 마지막 반군 주 ────────────────────────────────────────────────
    SYR: { name: "Syrian Arab Republic", color: "#9a7a5a", aliases: ["시리아", "Syria", "Assad", "Damascus"] },
    HTS: { name: "Syrian Salvation Government", color: "#6a7a4a", aliases: ["이들리브", "Idlib", "HTS", "구국정부", "Tahrir al-Sham"] },
    SDF: { name: "Autonomous Administration of North and East Syria", color: "#c0a05a", aliases: ["로자바", "Rojava", "SDF", "AANES", "북동시리아 자치행정부"] },
    // ── 리비아: 두 정부 ───────────────────────────────────────────────────────
    GNA: { name: "Government of National Accord", color: "#5a8a9a", aliases: ["리비아 통합정부", "GNA", "Tripoli government", "Sarraj"] },
    LNA: { name: "Libyan National Army", color: "#a08a5a", aliases: ["리비아 국민군", "LNA", "Haftar", "Tobruk", "하프타르"] },
    // ── 예멘: 두 정부 ─────────────────────────────────────────────────────────
    YEM: { name: "Republic of Yemen", color: "#b0a05a", aliases: ["예멘", "Yemen", "Hadi government", "Aden"] },
    HOU: { name: "Supreme Political Council", color: "#a05a4a", aliases: ["후티", "Houthi", "Ansar Allah", "Sanaa"] },
    // ── 그 밖 ────────────────────────────────────────────────────────────────
    IRN: { name: "Islamic Republic of Iran", color: "#5a8a6a", aliases: ["이란", "Iran", "Tehran", "Soleimani"] },
    ISR: { name: "Israel", color: "#5a8fc0", aliases: ["이스라엘", "Israel", "Netanyahu"] },
    TUR: { name: "Türkiye", color: "#c05a4a", aliases: ["튀르키예", "터키", "Turkey", "Erdogan"] },
    SAU: { name: "Saudi Arabia", color: "#7a9a6a", aliases: ["사우디아라비아", "Saudi Arabia", "MBS"] },
    BRA: { name: "Brazil", color: "#5a9a5a", aliases: ["브라질", "Brazil", "Bolsonaro"] },
    ETH: { name: "Ethiopia", color: "#8a9a5a", aliases: ["에티오피아", "Ethiopia", "Abiy Ahmed"] },
  },

  countryAssignments: {
    RUS: ["RUS"],
    UKR: ["UKR"],
    BLR: ["BLR"],
    USA: ["USA", "PRI", "GUM", "VIR", "MNP"],
    GBR: ["GBR"],
    FRA: ["FRA"],
    DEU: ["DEU"],
    CHN: ["CHN"],
    TWN: ["TWN"],
    KOR: ["KOR"],
    PRK: ["PRK"],
    JPN: ["JPN"],
    IND: ["IND"],
    PAK: ["PAK"],
    AFG: ["AFG"],
    SYR: ["SYR"],
    IRN: ["IRN"],
    ISR: ["ISR"],
    TUR: ["TUR"],
    SAU: ["SAU"],
    BRA: ["BRA"],
    ETH: ["ETH"],
    YEM: ["YEM"],
    GNA: ["LBY"],
  },

  regionAssignments: {
    // ── 우크라이나 동부 ───────────────────────────────────────────────────────
    // 크림은 2014년 이래 러시아. 도네츠크·루한스크는 오블라스트의 동쪽 3분의 1
    // 정도이지만 **두 주도를 분리주의 공화국이 쥐고 있어** 격자에서는 그쪽
    // 소유로 둔다(2026 스펙에서 자포리자·헤르손을 우크라이나에 남긴 것과 같은
    // 기준: 주도를 쥔 쪽이 그 주를 갖는다). 규칙이 실제 접촉선을 말한다.
    "UKR.4_1": "RUS",   // 크림
    "UKR.20_1": "RUS",  // 세바스토폴
    "UKR.6_1": "DNR",   // 도네츠크
    "UKR.15_1": "LNR",  // 루한스크

    // ── 시리아: 정권·이들리브·북동부 ──────────────────────────────────────────
    "SYR.10_1": "HTS",  // 이들리브 — 마지막 반군 주, 정권군이 밀어붙이는 중
    "SYR.1_1": "SDF",   // 하사카
    "SYR.3_1": "SDF",   // 라카
    "SYR.7_1": "SDF",   // 데이르에조르 — 유프라테스 동안(규칙 참조)

    // ── 리비아: 트리폴리 대 토브루크 ──────────────────────────────────────────
    // 2019년 4월 이래 하프타르가 트리폴리를 포위하고 있다. 동부와 남부는 LNA다.
    "LBY.1_1": "LNA",   // 부트난
    "LBY.13_1": "LNA",  // 데르나
    "LBY.2_1": "LNA",   // 알자발알아크다르
    "LBY.7_1": "LNA",   // 알마르지
    "LBY.12_1": "LNA",  // 벵가지
    "LBY.9_1": "LNA",   // 알와하트
    "LBY.6_1": "LNA",   // 알쿠프라
    "LBY.5_1": "LNA",   // 알주프라
    "LBY.19_1": "LNA",  // 시르테
    "LBY.18_1": "LNA",  // 사브하
    "LBY.16_1": "LNA",  // 무르주크
    "LBY.21_1": "LNA",  // 와디알하야
    "LBY.22_1": "LNA",  // 와디아시샤티
    "LBY.14_1": "LNA",  // 가트

    // ── 예멘: 사나 대 아덴 ────────────────────────────────────────────────────
    // 후티가 북서부 고지대와 수도를, 하디 정부가 남부와 동부를 쥔다.
    "YEM.19_1": "HOU",  // 사나
    "YEM.9_1": "HOU",   // 사나시
    "YEM.5_1": "HOU",   // 호데이다
    "YEM.18_1": "HOU",  // 사다
    "YEM.13_1": "HOU",  // 하자
    "YEM.10_1": "HOU",  // 암란
    "YEM.8_1": "HOU",   // 알마흐위트
    "YEM.11_1": "HOU",  // 다마르
    "YEM.17_1": "HOU",  // 라이마
    "YEM.14_1": "HOU",  // 이브
    "YEM.3_1": "HOU",   // 알바이다
  },

  simulationRules:
    "It is 1 January 2020. Every crisis on this board is one that somebody saw " +
    "coming, and the thing that defines the decade is not on anybody's list yet. " +

    "THE PANDEMIC IS A FIXTURE, AND WHAT GOVERNMENTS DO ABOUT IT IS NOT. On 31 " +
    "December 2019 Wuhan's health commission reported a cluster of pneumonia of " +
    "unknown cause. The virus spreads regardless of what any polity on this map " +
    "decides: through January it moves along air routes out of China, the WHO " +
    "declares a public health emergency at the end of the month, Italy's north " +
    "breaks in late February, and by mid-March most of Europe and the Americas " +
    "are shutting down. Those dates move only if a player materially changes the " +
    "inputs — a border closed in early January, an outbreak reported sooner, a " +
    "quarantine that holds. EVERYTHING ELSE about it is open: who tests and how " +
    "much, who closes what and when, who keeps their economy open and pays in " +
    "deaths, who pays in GDP and gets neither, which governments are trusted " +
    "afterwards and which never are again. That last one is the decade. " +

    "Do NOT let it swallow the board either. A pandemic year is still a year: " +
    "elections happen, wars continue, and the events below arrive on schedule " +
    "unless somebody changes them. " +

    "WHAT IS ALREADY DATED. Britain leaves the European Union on 31 January and " +
    "enters a transition that ends on 31 December. The United States kills Qasem " +
    "Soleimani in Baghdad on 3 January and Iran answers with missiles at al-Asad " +
    "on the 8th — and shoots down a Ukrainian airliner the same morning, which " +
    "costs it more at home than the strike did. An American impeachment trial " +
    "runs through February in a presidential election year that ends on 3 " +
    "November. The United States and the Taliban sign in Doha on 29 February. " +
    "Tokyo's Olympics are scheduled for July. " +

    "WHAT IS LOADED BUT NOT DATED. Hong Kong has been protesting since June and " +
    "Beijing's patience is a decision, not a clock. Armenia and Azerbaijan are " +
    "an unresolved war waiting for one side to think it can win. Ethiopia's " +
    "federal government and the Tigray regional administration are heading for a " +
    "collision over a postponed election. Belarus votes in August and Lukashenko " +
    "has never lost. Idlib is the Syrian government's last province to take and " +
    "Turkey has troops inside it. Each of these resolved within the year in the " +
    "real world; each is a consequence here, not a fixture. " +

    "THE FOUR WARS THE MAP DRAWS. Eastern Ukraine: the grid gives Donetsk and " +
    "Luhansk oblasts to the two separatist republics because they hold the two " +
    "provincial capitals, but they hold only the EASTERN THIRD of each — Ukraine " +
    "holds Mariupol, Kramatorsk and Sievierodonetsk, and the contact line has " +
    "barely moved since 2015. Syria: the government holds the west and the " +
    "south, Idlib is the last rebel province and is being ground down, the " +
    "Kurdish-led administration holds the northeast, and Turkey occupies a strip " +
    "along the border the grid cannot draw. Libya: Haftar's forces have besieged " +
    "Tripoli since April 2019 and hold the east and south; Turkey is about to " +
    "intervene for the Tripoli government and that is what breaks the siege. " +
    "Yemen: the Houthis hold the northwestern highlands and the capital, the " +
    "recognised government holds the south and east from Aden, and a Saudi-led " +
    "coalition has been bombing for five years without deciding it. " +

    "Technology and economy must reflect 2020: no widespread mRNA vaccines until " +
    "the end of the year and none deployed at scale until 2021, remote work as " +
    "an emergency improvisation rather than a norm, 5G as a geopolitical fight " +
    "about one company, social media as the main vector of both organisation and " +
    "disinformation, oil demand about to collapse and take prices below zero for " +
    "a day in April, and central banks with no room left on interest rates. The " +
    "map approximates control with modern administrative regions; where a front " +
    "runs through a province, the rules above say where.",

  startingTimelineText:
    "1 January 2020. In London the withdrawal agreement is signed and the calendar says " +
    "thirty days. In Washington a president is about to be tried by a Senate that will " +
    "acquit him, in a year that ends with an election. In Baghdad a militia has just stormed " +
    "the American embassy compound and an Iranian general is flying in to see what comes of " +
    "it. In Hong Kong the protests are in their seventh month and the police have stopped " +
    "counting. In Idlib two million people are moving north ahead of an offensive with " +
    "nowhere left to go. And in Wuhan, yesterday, a municipal health commission published a " +
    "notice about twenty-seven cases of viral pneumonia of unknown cause, seven of them " +
    "serious, and asked people not to panic.",
};

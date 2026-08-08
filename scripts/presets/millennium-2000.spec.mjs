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
    eyebrow: "Historical Preset",
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
    "recoloring a neighbor, per the engine's standing rules.",

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

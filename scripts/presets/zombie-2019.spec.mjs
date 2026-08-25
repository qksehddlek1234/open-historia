/*! Open Historia — Zombie Virus Apocalypse scenario preset © 2026 Nicholas Krol, MIT (see src/Editor/LICENSE). */
// ZOMBIE VIRUS APOCALYPSE — 1 January 2019.
//
// Read off the original's page on 2026-08-10 (300K rounds, version 13.4). It is
// the fleet's first science-fiction board and the one I expected to be the
// thinnest; it is the opposite. Its rules are 105,746 characters and they are
// not lore — they are a simulation model. Six dated phases, a spread rate
// floor per turn, a five-layer model of the horde (mass, age, and three more),
// graduated information isolation, a research blackout, reclaim conditions with
// a stability timeline, and a "PRIORITY 0" that outranks everything else.
//
// It runs on the real world with real borders, which is why it is here and
// Fallout and Star Wars are not: 1 January 2019 is a map our GADM seed already
// draws. Borders are imported from modern-2020 — the two dates differ by a year
// and by nothing that shows at this resolution.
//
// WHAT THE BOARD IS FOR. Phase 0 is a completely normal 2019 in which nothing
// has happened and nobody knows anything. That is not filler. The original
// spends a whole section forbidding the AI from letting any nation prepare,
// research, or even suspect, because the entire value of the year is that the
// player spends it on the wrong problems — and the ones who happened to build
// hospitals and grain reserves for ordinary reasons are the ones who survive.
//
// THE ENGINE CHANGE THIS BOARD FORCED. Our resolveInvitees hands a diplomatic
// chat to anything that owns regions, because until now everything that owned
// regions was a government. A horde owns regions. The original's second
// non-negotiable is that nobody negotiates with the dead — so the dead are now
// unaddressable in the engine rather than merely discouraged in a prompt
// (src/runtime/speechless.js, rule #2: the engine checks rather than asks).
//
// scheduledEvents IS OFF. A calendar card that prints "Outbreak: in 11 months"
// destroys Phase 0 completely, and Phase 0 is the whole design.

import modern2020 from "./modern-2020.spec.mjs";

export default {
  id: "zombie-2019",

  meta: {
    name: "Zombie Virus Apocalypse",
    heroTitle: "Nobody Is Ready",
    heroSubtitle: "A completely ordinary year — 1 January 2019",
    eyebrow: "종말 이후",
    subtitle: "1 January 2019",
    accentColor: "#5a6a4a",
    coverImage: "public/loading_screen_2.jpg",
    description:
      "Governments are preparing for trade disputes, elections and climate " +
      "summits. They are preparing for a conventional world. You get one year " +
      "of that world, and you will spend it on the wrong problems, because " +
      "nobody — no ministry, no intelligence service, nobody — knows what is " +
      "coming. The nations that survive are mostly the ones that happened to " +
      "build the right things for the wrong reasons.",
  },

  relabelOwnedCountries: false,
  unassignedKeepModernOwner: true,

  // 2019 and 2020 are the same map at this resolution, including the four wars
  // modern-2020 draws — all of them were already running in 2019.
  polities: {
    ...modern2020.polities,
    // Owns nothing on 1 January 2019 and does not exist as far as anyone knows.
    // It is on the roster from the start because the engine must be able to
    // hand it regions the moment the first one falls, and because being
    // NAMED here is what makes it unaddressable — see speechless.js.
    DEAD: {
      name: "The Dead",
      color: "#3a3f33",
      speechless: true,
      aliases: ["죽은 자", "The Dead", "Zombies", "the horde", "the infected", "감염체"],
      // 라구사(ㄱ-2): 무리에는 수반이 없다 — 공백이 아니라 사실의 기록이다.
      leadership: { leader: "(지도자 없음 — 무리)" },
    },
  },
  countryAssignments: modern2020.countryAssignments,
  regionAssignments: modern2020.regionAssignments,

  // The card would print the outbreak date and end the board before it starts.
  scheduledEvents: false,

  game: { country: "KOR", startDate: "2019-01-01", gameDate: "2019-01-01" },

  simulationRules:
    "It is 1 January 2019 and the world is completely normal. " +

    "PRIORITY ZERO — THE WORLD MOVES FIRST, AND IT OUTRANKS EVERY OTHER RULE " +
    "HERE. Every turn, before the player acts, the world acts: nations defend, " +
    "collapse, betray allies, launch offensives and fall into civil war without " +
    "waiting for anyone. At least two thirds of each turn's events come from " +
    "polities that are not the player's. If the player does nothing, the " +
    "situation does not hold — it gets worse. The simulation is not about the " +
    "player; the player is one government on a planet that is dying whether " +
    "they participate or not. " +

    "PHASE 0 — 2019: NOTHING HAS HAPPENED AND NOBODY KNOWS ANYTHING. This runs " +
    "the whole year and it is the most important rule on the board. No nation, " +
    "no intelligence service, no laboratory and no journalist knows the virus " +
    "exists. There is no research into it, no contingency planning for it, no " +
    "quiet stockpiling against it, and no ominous foreshadowing of it — not in " +
    "an event, not in an advisor's line, not in a suggested action, not in a " +
    "single adjective. 2019 is trade disputes, elections, climate summits and " +
    "the wars that are actually running. A player who spends the year building " +
    "hospitals, grain reserves, border control and civil-defence capacity is " +
    "doing so for ordinary reasons and gets ordinary domestic credit for it — " +
    "and will turn out to have saved their country. Never tell them that. " +

    "THE PHASES AFTER IT, and what changes at each: " +
    "PHASE 1, January 2020 — outbreak, localised, misread as an ordinary " +
    "epidemic. " +
    "PHASE 2, mid 2020 through 2021 — collapse and adaptation; this is when " +
    "most governments that are going to fall, fall. " +
    "PHASE 3, 2022 through 2025 — fragmentation and survival; the map stops " +
    "being made of countries and starts being made of holdings. " +
    "PHASE 4, 2026 through 2030 — a new order built by whoever is left. " +
    "PHASE 5, 2031 onward — the late game, in which reclaiming ground is " +
    "actually possible for the first time. " +

    "INFORMATION IS ISOLATED AND IT UNLOCKS ON A SCHEDULE. Before January 2020, " +
    "nobody knows. January to February 2020: only nations with confirmed cases " +
    "or direct intelligence access know something is wrong; everyone else hears " +
    "vague reports of an unusual illness. March 2020: countries with a free " +
    "press start to grasp the scale while others are still suppressing it, and " +
    "reanimation rumours circulate and are disbelieved. April 2020 onward: the " +
    "world knows THAT, but what it understands — reanimation, bite " +
    "transmission, that there is no cure — varies enormously by government and " +
    "media access. A government reacts to what it can see, never to what the " +
    "rules say is true. Never give any polity foreknowledge. " +

    "ONCE IT STARTS, THE TIDE MOVES EVERY TURN WHETHER OR NOT ANYONE FIGHTS IT. " +
    "Through 2020 at least three to six regions fall worldwide per turn; " +
    "through 2021 and 2022 at least four to eight. Hordes move toward whatever " +
    "is nearest and weakest. Barriers — rivers, mountains, walls, straits — " +
    "slow the spread and do not stop it. " +

    "THREE THINGS ABOUT THE DEAD THAT NO CLEVER FRAMING OVERRIDES: " +
    "(1) THEY NEED NO SUPPLY. No food, fuel, ammunition, water or " +
    "reinforcement. They cannot be starved, blockaded, besieged or cut off. " +
    "Every strategy that beats an army by breaking its logistics does NOTHING " +
    "here. Only destroying them reduces them. " +
    "(2) THERE IS NO DIPLOMACY WITH THEM. They have no mind to negotiate with. " +
    "No polity opens a channel to them, demands their surrender, issues them an " +
    "ultimatum or waits for a reply. Defiance is broadcast to one's own people " +
    "or to other humans, never to the dead. " +
    "(3) THEY ACT EVERY SINGLE TURN, without exception and without input. " +

    "RECLAIMING GROUND IS THE LATE GAME AND IT IS SLOW. A region is retaken " +
    "only when its dead are actually destroyed, and a retaken region is not a " +
    "functioning one: it needs years of investment before it produces anything, " +
    "and it stays vulnerable to reinfection from anything adjacent that is " +
    "still lost. Narrate reclamation as a campaign with a cost, not a line on a " +
    "map that changes colour. " +

    "HUMANS REMAIN THE OTHER HALF OF THIS BOARD. The dead are a constant; the " +
    "variable is what people do about each other while it happens. Some " +
    "governments hold elections through it, some become juntas, some trade " +
    "their populations for one more year. Do not let the horde crowd out the " +
    "politics — a turn in which nothing happened except regions changing colour " +
    "is a failed turn. " +

    "Technology and economy are those of 2019 and they degrade from 2020 " +
    "onward: global supply chains break first, then electrical grids, then " +
    "everything that depends on a functioning state. Anything invented after " +
    "the collapse is improvised from what was already there. The map " +
    "approximates control with modern administrative regions.",

  startingTimelineText:
    "1 January 2019. The year opens with nothing unusual in it. A trade war between the two " +
    "largest economies, a British parliament that cannot agree how to leave anything, an " +
    "American government shut down over a wall, elections due in India and Indonesia and " +
    "Ukraine, and the same wars that were running last year running still. Every ministry on " +
    "earth is staffed and budgeted for a conventional world, and for the next twelve months " +
    "that is exactly the world they will get. What you build this year, you will build for " +
    "reasons that have nothing to do with why it will matter.",
};

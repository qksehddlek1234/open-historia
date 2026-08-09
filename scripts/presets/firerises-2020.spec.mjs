/*! Open Historia — The Fire Rises 2020 scenario preset © 2026 Nicholas Krol, MIT (see src/Editor/LICENSE). */
// THE FIRE RISES — 1 January 2020.
//
// The original's port of the Hearts of Iron mod of the same name (507K rounds).
// Its rules are 4,205 characters and almost all of it is one thing: a CASCADE.
// A pandemic that does not stay a health story; an oil shock out of a Gulf
// civil war; an American constitutional crisis that does not resolve; a
// succession in Moscow that goes the hard way; a Taiwan crossing. Each link
// pulls the next.
//
// THIS IS NOT modern-2020, which is the real 2020 and whose whole point is that
// every crisis on it was foreseen by somebody. Same date, opposite thesis: that
// board asks what you do with a world that behaves; this one asks what is left
// when it does not. The original runs both, and so do we — the map is imported
// from modern-2020 rather than retyped, because 1 January 2020 has exactly one
// set of borders.
//
// TWO DELIBERATE DEPARTURES FROM THE ORIGINAL, both for the same reason.
//
// 1. THE CASCADE IS A MECHANISM, NOT A SCRIPT. The original writes its chain as
//    dated certainties. We write each link as a PRESSURE with a stated trigger
//    and a stated way out, the way coldwar-1989 does ("does Moscow send the
//    tanks" rather than "Moscow does not send the tanks"). A scripted board
//    plays itself; the player's actions have to be able to break a link, or
//    there is no game in the middle of the fire.
//
// 2. FACTIONS ARE NAMED BY INSTITUTION, NOT BY PERSON. The original scripts
//    named living politicians into rival capitals. We name the institutions —
//    a federal government, a rival administration, a bloc of states that
//    declines both — and let leaderReference fill in whoever actually held
//    office. That is also our house rule: the player is a player, not a head of
//    state, and a board that hangs on one person's name ages badly and reads as
//    a claim about that person rather than a game.
//
// scheduledEvents IS OFF. Every link in this chain depends on the player not
// knowing which one is next, and our end-of-turn calendar card would print them.
// historicalPrior STAYS ON, unlike the fleet's other two divergent boards:
// everything before 1 January 2020 really did happen. The divergence is ahead.

import modern2020 from "./modern-2020.spec.mjs";

export default {
  id: "firerises-2020",

  meta: {
    name: "The Fire Rises — 2020",
    heroTitle: "Everything That Could Go Wrong",
    heroSubtitle: "The same morning, and none of it holds — 1 January 2020",
    eyebrow: "연쇄 붕괴",
    subtitle: "1 January 2020",
    accentColor: "#8a4a3a",
    coverImage: "public/loading_screen_2.jpg",
    description:
      "A world with every safety margin already spent, on the morning before it " +
      "starts spending what it does not have. The pandemic does not stay a " +
      "health story, the Gulf does not stay quiet, the world's largest economy " +
      "does not agree on who won, and the alliance that has not been tested " +
      "since 1949 gets tested. Nothing here is fated. Every link in the chain " +
      "has a way out, and somebody has to find it.",
  },

  relabelOwnedCountries: false,
  unassignedKeepModernOwner: true,

  // 1 January 2020 has one set of borders. Importing them means a correction to
  // the real board is a correction to this one.
  polities: modern2020.polities,
  countryAssignments: modern2020.countryAssignments,
  regionAssignments: modern2020.regionAssignments,

  // The calendar card would hand the player the chain in order. See the header.
  scheduledEvents: false,

  // Korea again, so this board and modern-2020 are directly comparable: a middle
  // power with an alliance it did not get to vote on, in the year the guarantees
  // stop being theoretical.
  game: { country: "KOR", startDate: "2020-01-01", gameDate: "2020-01-01" },

  simulationRules:
    "It is 1 January 2020 and everything before today happened as it really " +
    "did. What is different about this world is not its past — it is that none " +
    "of its safety margins hold. " +

    "THIS BOARD IS A CASCADE. Crises here do not resolve into a new normal; " +
    "they hand their pressure to the next one. A pandemic becomes an economic " +
    "shock becomes a political one. A civil war in an oil state becomes an " +
    "energy crisis becomes a government falling three continents away. Narrate " +
    "the transmission explicitly — who could not pay for what, which promise " +
    "went unfunded, which garrison went unpaid — because the chain IS the game " +
    "and an event with no downstream is a wasted turn. " +

    "BUT NOTHING IS FATED, AND THIS OVERRIDES THE CASCADE. Every link has a " +
    "trigger and a way out, and player action must be able to break it. Do not " +
    "narrate a coming collapse as inevitable, do not have characters foresee " +
    "the chain, and never let a link fire because the story wants it — it fires " +
    "because its trigger was met and nobody paid the price of preventing it. A " +
    "player who spends the resources and takes the political damage to stop a " +
    "link STOPS IT, and the world moves on with that link unbroken. " +

    "THE PRESSURES ON THIS BOARD, each with what sets it off: " +
    "(1) THE PANDEMIC. A respiratory virus out of central China in the first " +
    "weeks. Trigger for escalation: delay in the first sixty days. States that " +
    "close borders early and test widely take an economic hit and keep their " +
    "hospitals; states that wait take both losses. " +
    "(2) THE GULF. A succession or legitimacy crisis in a major oil producer " +
    "becomes armed. Trigger: outside patrons picking sides. The oil price is " +
    "the transmission line to everything else on this board. " +
    "(3) THE CONSTITUTIONAL CRISIS. In a large federal democracy an election " +
    "result is contested past the point where the institutions have an agreed " +
    "answer, and rival administrations claim the same authority. Trigger: the " +
    "security services and the states splitting rather than the politicians. " +
    "Name the FACTIONS institutionally — the federal government, the rival " +
    "administration, the states that recognise neither, regional commands that " +
    "sit it out — and create a distinct polity for each faction that actually " +
    "holds ground. Do not put words in the mouths of named living politicians " +
    "beyond what their office would say. " +
    "(4) MOSCOW'S SUCCESSION. The question is not who dies, it is what the " +
    "system does when the centre is vacant: whether the security apparatus, the " +
    "technocrats or the regions inherit it. Trigger: whether a successor is " +
    "arranged before the vacancy or after. " +
    "(5) THE ALLIANCE TEST. If a member of the North Atlantic alliance is " +
    "attacked, Article 5 is invoked and the answer is not automatic — it is " +
    "the sum of what each capital decides that week, and a single major refusal " +
    "ends the alliance as a fact whatever the treaty says. " +
    "(6) THE STRAIT. A crossing attempt against Taiwan, with the American and " +
    "Japanese decisions as the real variables, not the landing itself. " +
    "(7) NUCLEAR USE IS POSSIBLE AND IT IS NOT A SETTING. If it happens it is " +
    "because a specific state, cornered in a specific way, decided it. Narrate " +
    "the decision, the target and the aftermath in full, and let the aftermath " +
    "govern every later turn — no board on which a weapon was used goes back to " +
    "normal diplomacy. " +

    "PEACE INSTALLS GOVERNMENTS, IT DOES NOT MOVE MANY BORDERS. This is the " +
    "original's own rule and it is what keeps the map legible: a settlement in " +
    "this era changes who governs a country far more often than it changes " +
    "which country a province belongs to. Write the terms as regime, occupation " +
    "zone, basing rights, reparations and disarmament, and cede territory only " +
    "where a real border dispute already existed. " +

    "LOSERS RADICALISE. A state that loses a war on this board does not become " +
    "docile; it becomes the constituency for whoever promises the loss back. " +
    "Track that as a named domestic pressure from the settlement onward, and " +
    "let it be the trigger of the next link rather than a mood. " +

    "The map approximates control with modern administrative regions, so a " +
    "civil war's front runs inside provinces and is described rather than drawn " +
    "unless a whole province changes hands.",

  startingTimelineText:
    "1 January 2020. On paper it is an ordinary morning: markets closed at record highs, an " +
    "American election year opening, a British departure thirty days out, a Gulf that has been " +
    "tense for forty years without breaking. Underneath it every institution that would handle " +
    "a shock is running with no slack — hospitals at capacity in a normal winter, alliances " +
    "that have never had to answer their own core question, an oil market with one week of " +
    "spare capacity, and courts being asked to settle arguments that used to settle themselves. " +
    "None of that is a prediction. It is only what happens to be true this morning, and it is " +
    "the reason the year has no margin for the first thing that goes wrong.",
};

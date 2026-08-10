/*! Open Historia — Citizen 2026 scenario preset © 2026 Nicholas Krol, MIT (see src/Editor/LICENSE). */
// 2026 — CITIZEN. 1 January 2026, and you are nobody.
//
// The original (772K rounds) is the highest-round preset we had left, and I
// expected to have to report it as an engine feature rather than a scenario.
// Reading it on 2026-08-10 says otherwise: 27,472 characters, and all of it is
// prompt. A tutorial, a command vocabulary the player types into the actions
// box, and a list of achievements. It even credits the 2026 board it is built
// on top of. There is nothing in it that needs new engine code — the whole
// thing is a LAYER over an ordinary present-day map, which is exactly what a
// spec file is.
//
// So the board is imported from modern-2026 and the rules do the rest.
//
// THIS BOARD TURNS OFF TWO OF OUR COMMON CONTRACTS, and the reasons are the
// most interesting thing about it:
//
//   · playerSovereignty says "the player's country does nothing the player did
//     not order". On every other board that is the first rule of the
//     simulation. Here it is FALSE — the player does not run the country, has
//     no say in what it does, and the whole point is being subject to
//     decisions made by people who will never hear of you. Leaving it on would
//     freeze the government of whichever nation the player was born in.
//
//   · internalVoices gives the player advisors belonging to "the player's own
//     government". A citizen has no government of their own. The advisors would
//     be nonsense, so the roster is off.
//
// TWO THINGS LEFT OUT, and one of the two reasons has since been withdrawn.
//
// The "CREATOR" command, whose only function is to print its author's name into
// an event, is not here. That still holds on its own terms — it watermarks
// THEIR preset and does nothing in ours — but it is a utility argument, not the
// propriety one this comment used to make.
//
// The achievements are ours rather than the original's, and THAT reason does
// not survive. I wrote "their specific list is their writing", which assumed a
// no-copying rule this project does not have: LOCAL-PAX-HISTORIA-PLAN.md plans
// a path for bringing preset rules over and draws its line at REDISTRIBUTION,
// not at reference. So the original's achievement list is portable and this
// board is under-ported by exactly that much. Left as it stands for now, and
// recorded in the WORKLOG as re-port work rather than quietly rewritten.

import modern2026 from "./modern-2026.spec.mjs";

export default {
  id: "citizen-2026",

  meta: {
    name: "2026 — Citizen",
    heroTitle: "But Can You Make Rent",
    heroSubtitle: "The same world, from the bottom of it — 1 January 2026",
    eyebrow: "한 사람의 시점",
    subtitle: "1 January 2026",
    accentColor: "#7a6a5a",
    coverImage: "public/loading_screen_2.jpg",
    description:
      "Every other board in this library hands you a country. This one hands " +
      "you a person: a name, a family, a bank balance and an address in " +
      "whichever nation you pick. The wars and elections still happen and you " +
      "still cannot do anything about them. What you can do is get a job, get " +
      "an education, get out, get famous, get elected, or get through the " +
      "month. The world will not notice either way.",
  },

  relabelOwnedCountries: false,
  unassignedKeepModernOwner: true,

  polities: modern2026.polities,
  countryAssignments: modern2026.countryAssignments,
  regionAssignments: modern2026.regionAssignments,

  // See the header. These two are wrong for a board where the player is not
  // the government, and wrong loudly rather than harmlessly.
  playerSovereignty: false,
  internalVoices: false,

  // The nation here is where the player is BORN, not what they command. Korea
  // keeps the fleet's default seat; the first thing the rules say is that the
  // player may pick any country instead.
  game: { country: "KOR", startDate: "2026-01-01", gameDate: "2026-01-01" },

  simulationRules:
    "It is 1 January 2026 and THE PLAYER IS NOT A GOVERNMENT. This overrides " +
    "every assumption the rest of this simulation makes. " +

    "THE PLAYER IS ONE PERSON. They are an ordinary citizen of the nation " +
    "attached to this campaign — that nation is where they LIVE, not what they " +
    "command. They have no authority over it, no access to its leadership, and " +
    "no ability to order a policy, a mobilisation or a treaty. If the player " +
    "types an instruction that only a head of government could carry out, the " +
    "answer is what actually happens when a private citizen tries: a letter " +
    "unanswered, a petition ignored, a protest policed, a career begun at the " +
    "bottom of it. " +

    "CHARACTER GENERATION HAPPENS ON THE FIRST TURN AND ONLY THEN. Roll and " +
    "state, in one short summary: full name in the naming convention of the " +
    "chosen country, age, gender, the city or region they live in, household, " +
    "occupation or schooling, and starting money. Use these odds unless the " +
    "player specified otherwise when they started: household — 50% ordinary " +
    "middle-income, 24% poor with many dependents, 24% comfortable and small, " +
    "1% a family with political weight, 1% a family with cultural weight; " +
    "gender 50/50; a pet 20% of the time. Whether the player belongs to a " +
    "minority of their country depends on that country's real composition. If " +
    "the player supplied any details when starting — a name, an age, children, " +
    "a profession — those override the roll and the rest is filled around them. " +

    "MONEY IS REAL AND IT IS ALWAYS ON SCREEN. Balances are in the actual " +
    "currency of the player's country, at amounts that are plausible for that " +
    "country in 2026 — a salary, a rent, a bus fare, a hospital bill. EVERY " +
    "event that costs or earns money states the amount and the resulting " +
    "balance. Running out of money is a real state with real consequences and " +
    "is not quietly forgiven. Ways of getting it include working, studying into " +
    "a better job, starting something, borrowing, inheriting, and crime — and " +
    "crime carries a real chance of arrest scaled to the country's policing. " +

    "THE PLAYER IS A POINT ON THE MAP. Maintain exactly ONE map marker for the " +
    "player, sized small, placed wherever they currently are, and MOVE it " +
    "whenever they move. Never create a second one. It is the only thing on " +
    "this board that represents them. " +

    "THE WORLD DOES NOT REVOLVE AROUND THEM, AND IT DOES NOT WAIT. The " +
    "geopolitics of 2026 continues exactly as it would on any other board — " +
    "wars, elections, crises, markets — and the player learns about it the way " +
    "a person does: the news, prices, a relative's phone call, conscription " +
    "papers, a border closing. Most turns, the world's biggest event should " +
    "reach the player as an inconvenience rather than a briefing. Never let a " +
    "head of state contact them because they are the player. " +

    "COMMANDS THE PLAYER CAN TYPE INTO THE ACTIONS BOX, recognised literally: " +
    "PLAYERNAME_ON enables renaming; PLAYERNAME_OFF disables it and the name " +
    "given at the start stands. With renaming enabled, NAMECHANGE:<name> sets " +
    "the character's and the marker's name, and NAME_RANDOM picks a plausible " +
    "one for their country in this period. PLAYERGENDER_MALE and " +
    "PLAYERGENDER_FEMALE set the character's gender, which affects what the " +
    "world does to and around them in ways that depend on where they live. " +
    "Acknowledge a command in one line and apply it immediately. Anything that " +
    "is not one of these is an ordinary instruction. " +

    "THINGS WORTH TRYING, so the board has goals without having a win " +
    "condition: finish an education; own a home; leave the country legally; " +
    "leave it illegally; get a criminal record and then get it behind you; " +
    "build a business that outlives a recession; get elected to something, " +
    "anything; become known nationally for a skill; survive a war as a " +
    "civilian; get a family through a currency collapse; die old, at home, with " +
    "the lights on. Track progress toward whichever the player is chasing and " +
    "say plainly when one is reached. " +

    "A LIFE HAS AN END AND THE BOARD SHOULD BE HONEST ABOUT IT. Age, illness, " +
    "accident, violence and war can end the player's life, at odds that reflect " +
    "where they live and what they have been doing. When it happens, say so " +
    "plainly and close the account with what they built and who is left. Do not " +
    "kill a player for narrative convenience, and do not make them immortal " +
    "either. " +

    "The map approximates control with modern administrative regions and none " +
    "of it belongs to the player.",

  startingTimelineText:
    "1 January 2026. The largest war in Europe since 1945 is in its fifth year, the Middle " +
    "East has been rebuilt twice in two years, and everyone with an opinion about Taiwan is " +
    "watching it. None of that is your department. Rent is due at the end of the month, the " +
    "job you have does not quite cover it, and the news is a thing that happens in the " +
    "background of a room you are trying to heat. Somewhere above you, people who will never " +
    "learn your name are making decisions you will spend the year absorbing.",
};

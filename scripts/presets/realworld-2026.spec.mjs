/*! Open Historia — Real World 2026 scenario preset © 2026 Nicholas Krol, MIT (see src/Editor/LICENSE). */
// REAL WORLD 2026 — 1 February 2026.
//
// Read off the original's own page on 2026-08-10 (594K rounds). The obvious
// question is why we want a second 2026 board when `modern-2026` already opens
// on 1 January. The answer is that the original runs THREE boards on this date
// — 2026 Detailed (11M), Real World 2026 (594K) and Unstable 2020s (343K) —
// and they are not the same game. Ours is a board about a world with four wars
// drawn on it. This one is a board about DISCIPLINE.
//
// Its page is 43,000 characters and only half of that is rules. The other half
// is a dated news chronology running February 2023 → January 2026, and the
// first rule is that the chronology is LOCKED: nothing after it may contradict
// it, and everything after it must be traceable to it. The rest of the rules
// are all of one kind — they name the ways a language model spoils a
// present-day simulation and forbid each one:
//
//   · inventing elections, cabinets and inaugurations nobody scheduled;
//   · letting wars sit as rhetoric because peace is the safer completion;
//   · narrating the player's country and calling that a world;
//   · reprinting last round's event with this round's date;
//   · occupying a province the attacker cannot physically reach.
//
// Every one of those is a failure we have hit in this repo, so this board is
// worth having for its rules alone. THE BOARD ITSELF IS THE SAME WORLD as
// modern-2026 one month on, and is imported from it rather than retyped —
// there is one real world and it should not be maintained twice.
//
// It also gets the thing our present-day boards have been missing: a shipped
// period timeline (`data/timelines/real-world-2026.json`). The scheduled-events
// card measured 1/3 from the model alone; authored data is what carries it.

import modern2026 from "./modern-2026.spec.mjs";

export default {
  id: "realworld-2026",

  meta: {
    name: "Real World 2026",
    heroTitle: "No Surprises, Only Consequences",
    heroSubtitle: "The record is locked — 1 February 2026",
    eyebrow: "잠긴 연표",
    subtitle: "1 February 2026",
    accentColor: "#4a6a7a",
    coverImage: "public/loading_screen_2.jpg",
    description:
      "Three years of the actual record are written down and cannot be revised. " +
      "From here nothing happens because it would make a good story — it happens " +
      "because something already on the board caused it. No election nobody " +
      "called, no war that stays a press release, no round that is only about " +
      "you. The world keeps its own calendar and you are one of the things on it.",
  },

  relabelOwnedCountries: false,
  unassignedKeepModernOwner: true,

  // One month after modern-2026 and the same planet. Importing rather than
  // retyping means a correction to one board is a correction to both.
  polities: modern2026.polities,
  countryAssignments: modern2026.countryAssignments,
  regionAssignments: modern2026.regionAssignments,

  // The player is Korea again, deliberately: this board and modern-2026 are
  // meant to be comparable, and the only variable worth changing between them
  // is the rules.
  game: { country: "KOR", startDate: "2026-02-01", gameDate: "2026-02-01" },

  simulationRules:
    "It is 1 February 2026. Everything up to 31 January 2026 is the real record " +
    "and it is LOCKED. " +

    "THE LOCKED RECORD. No past event may be altered, reinterpreted or " +
    "contradicted. Every new development must be traceable to something already " +
    "on this board on the start date — an existing war, alliance, deployment, " +
    "sanction, internal pressure or running crisis. A development that requires " +
    "the past to have been different did not happen. " +

    "DO NOT INVENT A GOVERNMENT CHANGE. This is the single most common way a " +
    "present-day simulation goes wrong. Do not generate an election, a " +
    "leadership change, an appointment, an inauguration, a cabinet formation, a " +
    "constitutional reform or a major domestic transition for ANY country " +
    "unless (a) the timeline establishes it, (b) this round's developments " +
    "directly caused it, or (c) it is genuinely scheduled inside the window " +
    "being simulated. A sitting government stays sitting. If you are not sure " +
    "whether a country has an election this year, it does not. " +

    "WARS MOVE OR THEY ARE NOT WARS. Override the pull toward peaceful " +
    "resolutions and static borders — it is a bias, not a judgement. States " +
    "here are expected to launch actual ground invasions, run decisive " +
    "offensives and take territory when their position calls for it. Every " +
    "interstate conflict must produce real de facto change on the map or a " +
    "concrete strategic gain. A permanent event-less stalemate is prohibited, " +
    "and so is a war that exists only as statements. " +

    "AN ATTACKER MUST BE ABLE TO REACH IT. A territory cannot be occupied " +
    "unless it is connected to the attacker by land, or the attacker has " +
    "coastline access to it and mounts a landing. An enclosed inland territory " +
    "that borders none of the attacker's holdings does not change hands, " +
    "however the front is going elsewhere. " +

    "WEATHER IS A PARTICIPANT. Extreme cold, heavy rain, storms and extreme " +
    "heat affect operations, timelines and outcomes. A winter offensive in the " +
    "wrong month costs what a winter offensive costs. " +

    "THE ROUND IS THE WORLD, NOT THE PLAYER. Every round must carry " +
    "developments from Europe, the Americas AND Asia at minimum, and across any " +
    "two consecutive rounds at least one region outside those three — the " +
    "Middle East, Africa or Oceania — must get its own report. Running crises " +
    "(the Ukraine war, the Taiwan Strait, the South China Sea, the Middle East, " +
    "major internal crises) continue to generate follow-up rather than being " +
    "dropped for whichever storyline is loudest. The player's country is " +
    "balanced against parallel developments elsewhere and does not dominate the " +
    "narration unless the round genuinely made it the world's main event. " +
    "Events may originate from any country regardless of size or prior " +
    "involvement — a world where only the great powers act is not this one. " +

    "DO NOT REPRINT. Advance the pressure instead of restating it. If a " +
    "situation appears in consecutive rounds it must have MOVED: a new actor, a " +
    "new position, a cost paid, a line crossed. Attrition and resources carry " +
    "over — an army that spent its stocks last round does not begin this one " +
    "full, and a country under sanctions does not quietly stop being under " +
    "them. " +

    "The map approximates control with modern administrative regions, so a " +
    "front line inside an oblast or a province is described in the narration " +
    "rather than drawn.",

  startingTimelineText:
    "1 February 2026. The record through yesterday is closed: what was agreed was agreed, " +
    "what was invaded is invaded, and who is in office is in office. Ahead of it the calendar " +
    "is already crowded — the last treaty limiting American and Russian strategic warheads " +
    "runs out this week, and after that there is no ceiling and no inspection regime for the " +
    "first time since 1972. Everything that happens from here has to come from something " +
    "already standing on this board. Nothing is going to arrive to rescue anyone.",
};

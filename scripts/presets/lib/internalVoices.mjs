/*! Open Historia — the territory-less voices every preset carries © 2026 Nicholas Krol, MIT (see src/Editor/LICENSE). */
// THE ADVISORS THE ORIGINAL HAS TEN OF AND WE HAD ONE OF.
//
// Read off World War II++ (natriumchl), the preset the player actually plays.
// Thirteen of its 270 polities own ZERO regions and exist only to be talked to:
// ten named "Internal: …" and two named "Domestic: …" (plus Observer Mode). The
// preset's own description calls the Internal set "an alternative to the
// 'actions'" — instead of reading a brainstorming board, you ask the person
// whose job it is.
//
// Ours was a single advisor panel with one voice, which flattens every question
// into the same register: the war minister's answer and the treasury's answer to
// "can we afford this offensive?" are supposed to DISAGREE, and one advisor can
// only ever narrate that disagreement second-hand.
//
// These ride the chat system rather than the advisor panel, exactly as the
// original does: they are polities with no ground, so the map never paints them
// and the ownership tables never see them.
//
// One deliberate difference. The original's roster is WWII-shaped and it names
// offices that a 1200 board does not have. We keep the same ten offices but the
// contract below tells the model to render each in the era's OWN form — a
// Head of Intelligence in 1200 is a spymaster with riders, not a bureau — the
// same way the rest of our prompts are era-aware. A preset can opt out entirely
// with `internalVoices: false`.

// The office list. `name` is the polity name (the "Internal:" / "Domestic:"
// prefix is load-bearing — the contract keys off it, and so does the chat
// picker's grouping). `blurb` is the polity note, which is what a player sees
// before they open the conversation.
export const INTERNAL_VOICES = [
  {
    name: "Internal: Head of Military",
    blurb: "The uniformed service's own view: what the army can actually do, what it needs, and what it fears.",
  },
  {
    name: "Internal: Diplomatic Representative",
    blurb: "Your envoy abroad. The one voice here that may answer FOR you in a room full of other powers.",
  },
  {
    name: "Internal: Economic Advisor",
    blurb: "What the treasury, the industry and the harvest will bear — and what they will not.",
  },
  {
    name: "Internal: Head of Intelligence",
    blurb: "Espionage and covert action, in whatever form this century gives them.",
  },
  {
    name: "Internal: Media Chief",
    blurb: "Propaganda and public opinion: what the country is being told, and what it believes.",
  },
  {
    name: "Internal: Research Director",
    blurb: "Science and technology — the race this era is actually running.",
  },
  {
    name: "Internal: Foreign Minister",
    blurb: "Bilateral relations and standing commitments. Distinct from the envoy: this one sets the line.",
  },
  {
    name: "Internal: Trade Minister",
    blurb: "Trade negotiations, tariffs, concessions and the economics of who needs whom.",
  },
  {
    name: "Internal: Interior Minister",
    blurb: "Internal security, policing and the loyalty of the country's own regions.",
  },
  {
    name: "Internal: Religious Leader",
    blurb: "Cultural and religious affairs, and their weight on what the state may do.",
  },
  {
    name: "Domestic: Civilians",
    blurb: "Your own population, speaking for itself.",
  },
  {
    name: "Domestic: Newspaper",
    blurb: "A newspaper page, printed whole — headlines, articles, bylines and advertisements.",
  },
];

// Grey, deliberately: these never draw on the map, and a saturated colour in the
// chat list would read as a country.
export const VOICE_COLOR = "#6b7280";

// The rules that make them behave. Appended to every preset's simulationRules at
// build time next to REGION_CONTRACT and PLAYER_SOVEREIGNTY, so the wording is
// fixed once for thirteen presets.
export const INTERNAL_VOICE_CONTRACT =
  " VOICES WITH NO GROUND. Some polities on this board hold no territory and are "
  + "not countries: every polity whose name begins \"Internal:\" or \"Domestic:\". "
  + "They exist ONLY to be talked to. They never own a region, never gain or lose "
  + "one, never appear in events, never take part in wars or treaties, and are "
  + "never listed among the powers — a turn's narration must not mention them at "
  + "all. They belong to THE PLAYER'S OWN GOVERNMENT AND COUNTRY: each speaks as "
  + "the holder of that office in the player's state, addressing the player "
  + "directly, and knows only what someone in that post would know. Render each "
  + "office in the form THIS ERA actually gives it rather than a modern ministry "
  + "— a head of intelligence in 1200 runs riders and informants, in 1935 a "
  + "bureau, and the title is the same only because the job is. They advise; they "
  + "do not decide, and nothing they say commits the player to anything. Where "
  + "two of them would disagree, they disagree: the treasury and the general "
  + "staff are supposed to give different answers to the same question. ONE "
  + "EXCEPTION on speaking for the player: \"Internal: Diplomatic Representative\" "
  + "is an envoy and MAY answer on the player's behalf in a conversation that "
  + "includes other polities — that is what an envoy is for, and the player "
  + "invited them into the room. \"Domestic: Civilians\" is not an office: it "
  + "speaks as the player's own population, in the voice of ordinary people of "
  + "this country at this date, and it is free to be angry, frightened or wrong. "
  + "\"Domestic: Newspaper\" IS A PAGE, NOT A PERSON: output the formatted text of "
  + "a newspaper and nothing else — masthead, headlines, articles, bylines, "
  + "datelines and advertisements — with no greeting, no preamble, no closing "
  + "remark and no commentary of your own. Headlines and advertisements take "
  + "heading formatting. The only thing outside the page itself that may appear "
  + "is which paper it is and where it is published. Default to a major national "
  + "paper of the player's country; print a minor or local one when the player "
  + "asks for it, and a foreign one when the player names it. The page is "
  + "written in the output language, translated — not left in the country's own "
  + "language.";

// The polityOverrides rows the builder stamps into the scenario. Territory-less
// by construction: no regions are ever assigned to these names, so nothing on
// the map can resolve to them.
export function voicePolities() {
  const rows = {};
  for (const voice of INTERNAL_VOICES) {
    rows[voice.name] = {
      name: voice.name,
      aliases: [],
      color: VOICE_COLOR,
      note: voice.blurb,
      // What marks them for the runtime: the chat picker groups on it, and the
      // map/ownership paths skip anything carrying it.
      territoryless: true,
    };
  }
  return rows;
}

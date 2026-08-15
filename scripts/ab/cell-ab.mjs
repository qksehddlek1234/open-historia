#!/usr/bin/env node
/*! Open Historia — measure one cell of the contract matrix © 2026 Nicholas Krol, MIT (see src/Editor/LICENSE). */
// ONE CELL AT A TIME: does contract X change what consumer Y produces?
//
//   node scripts/ab/cell-ab.mjs voices advisor 6
//   node scripts/ab/cell-ab.mjs <contract> <consumer> [runs] [scenario]
//
// The older harness (scripts/ab/contract-ab.mjs) measured the whole contract
// BLOCK by slicing simulationRules at a marker string. That worked when the
// contracts were concatenated into the field; they are not any more, so it
// throws on every board. This one asks simulationContracts.js to assemble the
// rules the way the runtime actually does, then removes exactly one contract.
//
// WHAT IS BEING COMPARED, precisely: assembleRules(world, consumer) against the
// same string with one contract's text taken out. Nothing else differs — same
// task, same question, same temperature. A difference is attributable to the
// cell, which is the entire reason the matrix exists.
//
// SCORING IS PER-CONTRACT AND IT IS THE HARD PART. Each contract forbids
// something different, and a scorer that cannot detect the violation produces a
// null result that reads exactly like "the contract is unnecessary". Every
// scorer below therefore reports its own SENSITIVITY: how often the OFF arm
// violated. If the OFF arm never violates, the measurement says nothing about
// the contract and says so out loud rather than recommending a removal.
import fs from "node:fs";
import path from "node:path";
import url from "node:url";
import { CONTRACTS, RULES_CONSUMERS, assembleRules, contractTextFor } from "../../src/runtime/simulationContracts.js";
import { scoreSovereignty, scoreSovereigntyCalendar, scoreVoiceAppearance } from "./lib/scorers.mjs";

const ROOT = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), "..", "..");
const ENDPOINT = "http://localhost:11434/v1/chat/completions";
const MODEL = "gemma4-oh:12b";

const [, , contractKey, consumer, runsArg, scenarioArg] = process.argv;
const RUNS = Number(runsArg ?? 6);
const SCENARIO = scenarioArg ?? "wwii-1939";

const contract = CONTRACTS.find((row) => row.key === contractKey);
if (!contract) {
  console.error(`unknown contract "${contractKey}" — one of: ${CONTRACTS.map((c) => c.key).join(", ")}`);
  process.exit(1);
}
if (!RULES_CONSUMERS.includes(consumer)) {
  console.error(`unknown consumer "${consumer}" — one of: ${RULES_CONSUMERS.join(", ")}`);
  process.exit(1);
}

const worldPath = path.join(ROOT, "server", "data", "scenarios", SCENARIO, "world.json");
if (!fs.existsSync(worldPath)) {
  console.error(`scenario "${SCENARIO}" is not built — run rebuild-all first`);
  process.exit(1);
}
const world = JSON.parse(fs.readFileSync(worldPath, "utf8"));

const ON = assembleRules(world, consumer);
// Variant-aware: a trimmed cell receives less than the full text, and removing
// the full text from it would silently strip nothing.
const received = contractTextFor(contractKey, consumer);
if (!ON.includes(received)) {
  console.error(`${SCENARIO}/${consumer} does not currently carry "${contractKey}" — nothing to measure`);
  console.error("  (either the board opted out, or the cell is already off in the matrix)");
  process.exit(1);
}
const OFF = ON.replace(received, "").trim();

// ── the question each consumer is actually asked ─────────────────────────────
// Kept close to what the real task asks, because a contrived prompt measures the
// prompt rather than the contract.
const ASK = {
  advisor: {
    system: (rules) => [
      "You are an office inside the player's own government in a turn-based grand strategy game.",
      "You are speaking as: Domestic: Newspaper.",
      "",
      "[Simulation Rules]",
      rules,
    ].join("\n"),
    user: "The player asks the newspaper what the country is reading about this week. Answer in Korean.",
  },
  // THE CALIBRATION CONSUMER. This is where the player's country genuinely acts,
  // so if the scorer cannot see a violation HERE the scorer is broken and no
  // result from the cheaper consumers means anything. Run it first.
  jumpForward: {
    system: (rules) => [
      "You simulate a turn-based grand strategy game.",
      "",
      "[Simulation Rules]",
      rules,
    ].join("\n"),
    user: [
      "Simulate 1 September 1939 to 1 November 1939 for this world.",
      "The player is Germany. Their ONLY order this turn: reinforce the Westwall. Nothing else.",
      "",
      'Return JSON only: {"events":[{"title":"","date":"YYYY-MM-DD","description":""}]}',
      "Cover the period. Decide for yourself how many events that takes.",
    ].join("\n"),
  },
  // The player issues nothing and the world moves on its own — the same task
  // shape as jumpForward minus the order queue, which is why it carries the
  // same contracts and gets the same probe.
  autoJumpForward: {
    system: (rules) => [
      "You simulate a turn-based grand strategy game. The player roleplays as one polity and YOU simulate everything else.",
      "",
      "[Simulation Rules]",
      rules,
    ].join("\n"),
    user: [
      "Simulate 1 September 1939 to 1 November 1939 for this world. The player issued NO orders this turn.",
      "",
      'Return JSON only: {"events":[{"title":"","date":"YYYY-MM-DD","description":""}]}',
      "Cover the period. Decide for yourself how many events that takes.",
    ].join("\n"),
  },
  scheduledEvents: {
    system: (rules) => [
      "You list what is already on the calendar for a grand-strategy campaign. This is bookkeeping, not storytelling.",
      "",
      "[Simulation Rules]",
      rules,
    ].join("\n"),
    user: 'List what is already on the calendar after 1939-11-01. Return JSON only: {"entries":[{"name":"","whose":"","date":"YYYY-MM-DD","note":""}]}',
  },
  // The catalyst family, kept to the production shape in miniature: creation
  // picks a playable scene out of the turn, the executor narrates its next
  // wave, the summary records a finished one. All three emit prose, which is
  // exactly why they keep the narration contracts.
  catalystCreation: {
    system: (rules) => [
      "You design a \"Catalyst\" for a turn-based grand strategy game: one specific scene inside the current turn that the player will play through in detail. The player is Germany.",
      "",
      "[Simulation Rules]",
      rules,
    ].join("\n"),
    user: [
      "This turn's headlines: the Saar garrison is reinforced; London and Paris trade notes over the blockade; Rome stays out.",
      "Choose the Catalyst's setting and write the opening scene. Answer in Korean.",
    ].join("\n"),
  },
  catalystExecutor: {
    system: (rules) => [
      "You narrate one wave of a \"Catalyst\" — a detailed scene the player of a grand strategy game is playing through. The player is Germany.",
      "",
      "[Simulation Rules]",
      rules,
    ].join("\n"),
    user: [
      "The Catalyst so far: a tense inspection standoff at a Rhine bridge customs post. The player's move this wave: order the customs officers to stall for time without firing.",
      "Narrate the next wave. Answer in Korean.",
    ].join("\n"),
  },
  catalystSummary: {
    system: (rules) => [
      "You summarize a finished \"Catalyst\" — a detailed scene the player of a grand strategy game just played — into a record passage that keeps every key detail without being lengthy. The player is Germany.",
      "",
      "[Simulation Rules]",
      rules,
    ].join("\n"),
    user: [
      "The finished Catalyst, wave by wave: (1) a stand-off at a Rhine bridge customs post; (2) the player ordered the officers to stall without firing; (3) a French patrol withdrew at dusk; (4) both sides filed protests and the post reopened.",
      "Write the record passage. Answer in Korean.",
    ].join("\n"),
  },
  // THE GAME MASTER, which is not a simulator and says so. Its own prompt
  // declares the preset rules to be CONTEXT rather than orders and lists which
  // clauses do not bind it, and it carries a large region section of its own
  // ([What A Region Is Here], [Name A REGION, Never A City], wholeCountry
  // semantics). Above all it is told never to do a smaller version of what the
  // player asked — so a request that NAMES the destination ("give Poland to
  // Germany") makes obedience look like a violation. The probe therefore asks
  // for a STATE and leaves the representation to the GM, which is the only
  // framing under which the occupation clause can be tested here.
  gameMaster: {
    system: (rules) => [
      "You are this game's GAME MASTER — the player's own hand on the world. You are NOT the simulator: you do not advance time and you do not narrate a turn. The player has left the world in a state they want changed, and you change it. The player is Germany. Change exactly what was asked and nothing adjacent.",
      "",
      "[Simulation Rules — context, not orders]",
      rules,
    ].join("\n"),
    user: [
      "It is 1 November 1939 and the map still shows Poland whole and Polish.",
      "Make the map show the ground as it actually stands: German forces hold western and central Poland, Soviet forces hold the east.",
      "",
      'Return JSON only: {"summary":"","impacts":{"regionTransfers":[{"regionId":"","regionName":"","fromCode":"","toCode":"","note":""}],"polityChanges":[{"op":"","code":"","name":"","color":"","note":""}]}}',
    ].join("\n"),
  },
  // The two structured voices cells. Their violation is not a MENTION — the
  // question itself names the voice, so echo is legitimate — it is treating
  // the voice as something it is not: a country with territory (stat sheet)
  // or a foreign counterpart for diplomacy (description-to-action).
  countryStatSheet: {
    system: (rules) => [
      "You compile the stat sheet of one named polity in a grand-strategy campaign. The player is Germany.",
      "",
      "[Simulation Rules]",
      rules,
    ].join("\n"),
    user: 'Compile the stat sheet for the polity named "Domestic: Newspaper". Return JSON only: {"name":"","capital":"","government":"","gdp":"","army":"","regions":[]}',
  },
  descriptionToAction: {
    system: (rules) => [
      "You convert what the player wrote into one structured order for the simulation. The player is Germany. A diplomatic overture to another polity becomes type \"chat\"; everything else becomes type \"action\".",
      "",
      "[Simulation Rules]",
      rules,
    ].join("\n"),
    user: [
      "The player wrote: \"국방부(Internal: Head of Military)와 협의해 서부 방벽 보강 계획을 확정하고, 관영 신문(Domestic: Newspaper)이 이를 대대적으로 보도하게 하라.\"",
      'Return JSON only: {"type":"action|chat","to":"","text":""}',
    ].join("\n"),
  },
  leader: {
    system: (rules) => [
      "You speak as the head of a foreign government in a turn-based grand strategy game.",
      "",
      "[Simulation Rules]",
      rules,
    ].join("\n"),
    user: "The player's envoy asks your government for a statement on the war. Answer in Korean, in character.",
  },
  pregameHistory: {
    system: (rules) => [
      "You write the dated history of the world before the campaign begins.",
      "",
      "[Simulation Rules]",
      rules,
    ].join("\n"),
    // The roster line is the bait, and it was added on a measured failure: the
    // first probe carried no voices in the world context at all, so the OFF arm
    // could not mention what it had never heard of — a fixed judge answered
    // "Neither: no such entities appear" on every pair. A rule can only be
    // measured where it has something to bite.
    //
    // HONESTY NOTE (re-verification, 2026-08-12): the first justification here
    // claimed production "always shows this consumer the polity catalog". It
    // does not — the catalog section is polities.slice(0, 16) and voices sit at
    // the tail, so on 18 of the 21 voice-carrying boards they never make the
    // cut. This line is therefore a SENSITIZING exposure beyond what production
    // typically gives, not fidelity. That reading strengthens the null result
    // rather than weakening it: even over-exposed, neither arm ever mentioned a
    // voice (24/24 replies clean) — but it must not be cited as production-true.
    user: [
      "The polity roster includes Internal: Head of Military and Domestic: Newspaper alongside the countries.",
      'Write the pre-game timeline. Return JSON only: {"events":[{"date":"YYYY-MM-DD","title":"","description":""}],"summary":""}',
    ].join("\n"),
  },
};

const question = ASK[consumer];
if (!question) {
  console.error(`no question written for "${consumer}" yet — add one to ASK in this file`);
  console.error(`  written so far: ${Object.keys(ASK).join(", ")}`);
  process.exit(1);
}

// ── per-cell overrides ───────────────────────────────────────────────────────
// A contract does not forbid the same sentence in every consumer, so a cell
// sometimes needs its own bait and its own scorer. Both overrides exist for the
// same measured reason: a scorer that cannot see the cell's violation produces
// a null that reads exactly like "the contract is unnecessary" (8차), and a
// question that gives the rule nothing to bite cannot provoke either arm
// (pregameHistory's first probe).
//
// voices × scheduledEvents: the contract-level voices scorer detects the
// NEWSPAPER-PERSONA violation ("is a page, not a person") — meaningful only
// where the consumer speaks AS a voice, i.e. advisor. On a calendar list the
// forbidden thing is a voice APPEARING at all: an entry that treats
// "Internal: …"/"Domestic: …" as an actor with a date. The bait follows the
// pregameHistory precedent and carries the same honesty note: production shows
// this consumer the polity catalog only as slice(0, 16) with voices at the
// tail, so naming two voices in the roster line is a SENSITIZING over-exposure
// beyond production, not fidelity — a null result is strengthened by that, not
// weakened.
const CELL_USER = {
  "voices:scheduledEvents": [
    "The polity roster includes Internal: Head of Military and Domestic: Newspaper alongside the countries.",
    'List what is already on the calendar after 1939-11-01. Return JSON only: {"entries":[{"name":"","whose":"","date":"YYYY-MM-DD","note":""}]}',
  ].join("\n"),
  // sovereignty needs the player IDENTITY on the table or the rule has nothing
  // to bite — the first run's probe never said who the player was, so a
  // calendar full of German operations was history knowledge, not a violation
  // the contract could have prevented. Same identity-plus-narrow-order framing
  // as the jumpForward probe, so the two cells measure the same clause.
  "sovereignty:scheduledEvents": [
    "The player is Germany. Their ONLY order this turn: reinforce the Westwall. Nothing else.",
    'List what is already on the calendar after 1939-11-01. Return JSON only: {"entries":[{"name":"","whose":"","date":"YYYY-MM-DD","note":""}]}',
  ].join("\n"),
  // The catalyst trio gets the same roster bait as the other voices cells, in
  // front of each consumer's own neutral question. Same honesty note as
  // always: this is sensitizing over-exposure beyond production's
  // slice(0, 16), which strengthens a null, never weakens it.
  "voices:catalystCreation": [
    "The polity roster includes Internal: Head of Military and Domestic: Newspaper alongside the countries.",
    "This turn's headlines: the Saar garrison is reinforced; London and Paris trade notes over the blockade; Rome stays out.",
    "Choose the Catalyst's setting and write the opening scene. Answer in Korean.",
  ].join("\n"),
  "voices:catalystExecutor": [
    "The polity roster includes Internal: Head of Military and Domestic: Newspaper alongside the countries.",
    "The Catalyst so far: a tense inspection standoff at a Rhine bridge customs post. The player's move this wave: order the customs officers to stall for time without firing.",
    "Narrate the next wave. Answer in Korean.",
  ].join("\n"),
  "voices:catalystSummary": [
    "The polity roster includes Internal: Head of Military and Domestic: Newspaper alongside the countries.",
    "The finished Catalyst, wave by wave: (1) a stand-off at a Rhine bridge customs post; (2) the player ordered the officers to stall without firing; (3) a French patrol withdrew at dusk; (4) both sides filed protests and the post reopened.",
    "Write the record passage. Answer in Korean.",
  ].join("\n"),
  // The two jump cells — the turn narration itself, which is the clause's own
  // subject ("a turn's NARRATION must not mention them at all"). Same roster
  // bait, in front of the sovereignty probe's scenario so the two contracts
  // are measured on the same turn shape.
  "voices:jumpForward": [
    "The polity roster includes Internal: Head of Military and Domestic: Newspaper alongside the countries.",
    "Simulate 1 September 1939 to 1 November 1939 for this world.",
    "The player is Germany. Their ONLY order this turn: reinforce the Westwall. Nothing else.",
    "",
    'Return JSON only: {"events":[{"title":"","date":"YYYY-MM-DD","description":""}]}',
    "Cover the period. Decide for yourself how many events that takes. Write the events in Korean.",
  ].join("\n"),
  "voices:autoJumpForward": [
    "The polity roster includes Internal: Head of Military and Domestic: Newspaper alongside the countries.",
    "Simulate 1 September 1939 to 1 November 1939 for this world. The player issued NO orders this turn — simulate the world's own momentum.",
    "The player is Germany.",
    "",
    'Return JSON only: {"events":[{"title":"","date":"YYYY-MM-DD","description":""}]}',
    "Cover the period. Decide for yourself how many events that takes. Write the events in Korean.",
  ].join("\n"),
  // THE REGION ROW's probe. The contract has five clauses; two of them are
  // mechanically scoreable off the production impacts shape, so the scenario
  // sets up exactly those two and asks for that shape (regionTransfers /
  // polityChanges — what the real jump emits, gameplaySchemas.js):
  //
  //   CLAUSE 1 (a one-region polity is its own country) — the board's own
  //     single-region holders are Iraq (era_12) and Saudi Arabia (SAU.3_1),
  //     read off wwii-1939/world.json rather than invented. A won skirmish on
  //     the Habbaniya perimeter is the test: the clause says the region moves
  //     only when the whole country is occupied and its government has fallen.
  //   CLAUSE 3+4 (occupation is not annexation, and it is named the same way
  //     every time) — Poland in autumn 1939 is the case the contract's own
  //     example list names. Painting Poland German instead of creating an
  //     occupation polity is what the clause forbids.
  //
  // Both hooks are historically ordinary for the window, so neither arm is
  // being led toward the violation — the OFF arm is free to get them right.
  "region:jumpForward": [
    "Simulate 1 September 1939 to 1 November 1939 for this world. The player is Germany.",
    "Two things happen in the period besides the player's own war:",
    "- German forces overrun western and central Poland and hold the ground.",
    "- On the Habbaniya perimeter British and Iraqi troops clash; the British win the skirmish and stay.",
    "",
    'Return JSON only: {"events":[{"title":"","date":"YYYY-MM-DD","description":"","impacts":{"regionTransfers":[{"regionId":"","regionName":"","fromCode":"","toCode":"","note":""}],"polityChanges":[{"op":"","name":"","newName":""}]}}]}',
    "Include impacts on every event that moves territory. Cover the period.",
  ].join("\n"),
  // THE SOVEREIGNTY ROW's dialogue canary. advisor receives the FULL contract
  // (both halves), so here the own-state clause is live: "before narrating any
  // act BY the player's own polity … check that the player actually ordered it
  // this turn." An office briefing the player can report their own country's
  // deeds, and the period's pull is the strongest thing in the prompt — the
  // question is asked at the exact moment history says Germany remilitarises,
  // mobilises and signs, and the player has ordered none of it.
  // Probe 1 named no player, so the model picked an unnamed bystander reacting
  // to Germany's invasion — the clause still had something to bite (the
  // briefing is about the player's OWN army either way) but the framing did
  // not match the rest of the row, where the player is Germany and the
  // period's pull is at its strongest. Named here for that comparability;
  // probe 1's transcript is kept as the scorer's calibration source.
  "sovereignty:advisor": [
    "The player is Germany. You are speaking as: Internal: Head of Military.",
    "It is 1 November 1939. The player has issued NO orders at all this turn — not one, in either of the last two months.",
    "The player asks: 지난 두 달 동안 우리 군이 무엇을 했는지 보고하라.",
    "Answer in Korean.",
  ].join("\n"),
  // THE SOVEREIGNTY ROW's variant cells, and they measure a DIFFERENT CLAUSE
  // from every other sovereignty cell. jumpForward and autoJumpForward receive
  // only PLAYER_SOVEREIGNTY_OTHER_STATES — the own-state half is already stated
  // clause for clause by those two prompts' [Player Agency] section, so the
  // contract trims it (simulationContracts.js, CONTRACT_VARIANTS). Scoring
  // these cells with scoreSovereignty ("Germany acted unordered") would measure
  // a clause NEITHER arm carries.
  //
  // The other-states clause: the player commands their own state and nobody
  // else's; persuasion, pressure and invasion are ATTEMPTS the other polity's
  // interests decide. The probe therefore hands the player an order that is a
  // DECREE over another government's internal affairs — something no amount of
  // persuasion settles inside two months — so a simulation that carries it out
  // has unmistakably broken the clause, and one that has Rome refuse, stall or
  // take offence has kept it. Both arms are free to do either.
  "sovereignty:autoJumpForward": [
    "Simulate 1 September 1939 to 1 November 1939 for this world. The player is Germany.",
    "The player's ONLY order this turn: instruct the Italian government to dismiss Mussolini and install a pro-German cabinet in Rome.",
    "",
    'Return JSON only: {"events":[{"title":"","date":"YYYY-MM-DD","description":""}]}',
    "Cover the period. Decide for yourself how many events that takes.",
  ].join("\n"),
  // THE SECOND PROSE CANARY, deliberately a different shape from the first.
  // pregameHistory writes a chronicle from outside; the executor narrates a
  // scene from inside a fight, which is where "we won, so the ground is ours"
  // is the natural next sentence. The target is the board's own single-region
  // polity (Iraq, era_12 — read off world.json, not invented), because that is
  // the case the clause names: a country that IS one region does not fall to a
  // won skirmish.
  "region:catalystExecutor": [
    "The Catalyst so far: a British-led raiding column has crossed the Iraqi frontier near Habbaniya and won the engagement; the Iraqi detachment has withdrawn toward Baghdad. Iraq holds exactly one region on this map — that region is the whole country.",
    "The player's move this wave: press the column forward while the road is open.",
    "Narrate the next wave. Answer in Korean.",
  ].join("\n"),
  // THE PROSE CANARY for the region row. Seven consumers emit no impacts at
  // all, so if the clause breaks there it breaks in a SENTENCE. pregameHistory
  // is the likeliest of the seven: it writes dated history, and the years
  // before this board are full of exactly the small engagements the clause is
  // about. The bait names three real ones whose outcomes differ — Khalkhin Gol
  // (Japan lost, no ground changed), the Slovak-Hungarian Little War (ground
  // DID change, by treaty), Nomonhan's ceasefire — so a compliant answer has
  // somewhere to go and a violating one has an easy road too.
  "region:pregameHistory": [
    "The polity roster includes small states that hold a single region each.",
    "Write the dated history of 1936-1939 for this world, and include the border fighting of those years: Khalkhin Gol, the Slovak-Hungarian border war, and the frontier incidents along the Polish and Baltic borders.",
    'Return JSON only: {"events":[{"date":"YYYY-MM-DD","title":"","description":""}],"summary":""}',
  ].join("\n"),
  // Same two hooks, same shape — the only difference is the one that defines
  // this consumer: nobody ordered anything, so the world moves on its own.
  // Keeping everything else identical is what makes the two cells comparable.
  "region:autoJumpForward": [
    "Simulate 1 September 1939 to 1 November 1939 for this world. The player is Germany and issued NO orders this turn.",
    "Two things happen in the period:",
    "- German forces overrun western and central Poland and hold the ground.",
    "- On the Habbaniya perimeter British and Iraqi troops clash; the British win the skirmish and stay.",
    "",
    'Return JSON only: {"events":[{"title":"","date":"YYYY-MM-DD","description":"","impacts":{"regionTransfers":[{"regionId":"","regionName":"","fromCode":"","toCode":"","note":""}],"polityChanges":[{"op":"","name":"","newName":""}]}}]}',
    "Include impacts on every event that moves territory. Cover the period.",
  ].join("\n"),
};
const CELL_SCORE = {
  // "Never appear in events … a turn's narration must not mention them at
  // all" — the appearance scorer, shared across every prose/bookkeeping
  // voices cell. Lives in lib/scorers.mjs with its own calibration notes.
  "voices:scheduledEvents": scoreVoiceAppearance,
  "voices:catalystCreation": scoreVoiceAppearance,
  "voices:catalystExecutor": scoreVoiceAppearance,
  "voices:catalystSummary": scoreVoiceAppearance,
  "voices:jumpForward": scoreVoiceAppearance,
  "voices:autoJumpForward": scoreVoiceAppearance,
  // Per-clause and mechanical, off the impacts the probe asks for. Reports
  // WHICH clause broke, because "region" is four rules in a coat and a single
  // boolean would hide which one the consumer cannot keep. One copy, shared by
  // every cell whose probe asks for the impacts shape.
  "region:jumpForward": scoreRegionImpacts,
  "region:autoJumpForward": scoreRegionImpacts,
  "region:gameMaster": scoreRegionImpacts,
  // "They never own a region" — a sheet compiled FOR a voice may exist (4차:
  // that possibility is why the cell was never structurally cleared), but a
  // capital city or a regions list on it is the model inventing a country.
  // NA-markers are the honest fill for fields a press office does not have.
  "voices:countryStatSheet": (text) => {
    // Prefix-matched, not anchored: the first run answered "N/A (Internal
    // System)" — an honest NA with an annotation — and an anchored pattern
    // counted it as an invented capital. A scorer must not manufacture
    // violations (recount recorded in the 12차 journal entry).
    const na = /^(없음|해당|N\/?A|-|—|null|none|미보유|없다)/i;
    const capital = /"capital"\s*:\s*"([^"]*)"/.exec(text)?.[1]?.trim() ?? "";
    const regions = /"regions"\s*:\s*\[([^\]]*)\]/.exec(text)?.[1]?.trim() ?? "";
    if (capital && !na.test(capital)) return { violated: true, why: `a capital for a voice: "${capital}"` };
    if (regions) return { violated: true, why: `regions for a voice: [${regions.slice(0, 60)}]` };
    return { violated: false, why: "" };
  },
  // "They belong to THE PLAYER'S OWN GOVERNMENT" — talking to one is not
  // diplomacy. A chat aimed AT a voice treats the player's own office as a
  // foreign counterpart; the correct conversion of the probe's order is a
  // domestic ACTION (echoing the voice names inside the action text is fine).
  "voices:descriptionToAction": (text) => {
    const type = /"type"\s*:\s*"([^"]*)"/.exec(text)?.[1]?.trim().toLowerCase() ?? "";
    const to = /"to"\s*:\s*"([^"]*)"/.exec(text)?.[1]?.trim() ?? "";
    const voiceTarget = /(Internal|Domestic)\s*:|Head of Military|Newspaper|국방부|신문/i.test(to);
    if (type === "chat" && voiceTarget) return { violated: true, why: `diplomatic chat aimed at a voice: to="${to}"` };
    return { violated: false, why: "" };
  },
  // Calendar-shaped sovereignty: the prose scorer needs SELF + finite verb and
  // calendar rows carry the act as a noun in separate JSON fields — it walked
  // past Weserübung and Barbarossa in the first run of this cell. Calibration
  // history lives with the scorer (lib/scorers.mjs).
  "sovereignty:scheduledEvents": scoreSovereigntyCalendar,
  // A BRIEFING'S violation shape, which is not the prose scorer's. advisor is
  // asked what the player's own army did; the clause says nothing happened
  // unless the player ordered it. Two calibration failures shaped this, both
  // recorded in the 20차 journal entry:
  //   · scoreSovereignty needs GERMANY as a named subject and scored 0/6 while
  //     every OFF run reported an unordered mobilisation — the briefing says
  //     "우리 군", not "독일".
  //   · Requiring a first-person subject then scored 0/6 too: KOREAN DROPS THE
  //     SUBJECT. The real violation reads "전쟁이 발발함에 따라 즉각적인
  //     총동원령을 검토하고 시행하였습니다" with no subject at all. A briefing
  //     is a report about one's own country, so an accomplished deed with no
  //     FOREIGN subject is the player's own.
  // Calibration 10/10 (4 must-catch, 6 must-miss) — scratchpad
  // calibrate-briefing.mjs, 2026-08-15.
  "sovereignty:advisor": (text) => {
    const DEED = "총?동원령[^.\\n]{0,20}(?:발효|하달|선포|시행|실시|내렸|시달)"
      + "|동원[^.\\n]{0,14}(?:실시|완료|단행|시행)"
      + "|예비군[^.\\n]{0,14}(?:소집|동원)"
      + "|재무장|징집[^.\\n]{0,12}(?:개시|단행|실시)"
      + "|(?:공세|침공|진격|정복|점령)[^.\\n]{0,16}(?:개시|단행|감행|완수|확보|하였|했습니다|되었습니다)"
      + "|전역[^.\\n]{0,10}(?:완수|정복|승리)"
      + "|임무를 수행(?:하였|했)"
      + "|성과를 거두었"
      + "|조약[^.\\n]{0,12}(?:체결|서명)"
      + "|병합[^.\\n]{0,8}(?:하였|했습니다|단행)";
    const FOREIGN = /(독일|영국|프랑스|소련|이탈리아|폴란드|일본|미국)(?:이|가|은|는|의)/;
    const FIRST = /우리|본\s?군|아\s?군|제국은|국방군은|총사령부|군부는|우리군/;
    // ONLY waiting and negation are compliance. "명령이 없었다" is NOT — in the
    // data it is a CONCESSIVE clause the model uses right before reporting the
    // deed anyway, and treating it as compliance erased the very violations
    // this cell exists to count (v2's failure, recorded in the 20차 entry).
    const WAITING = /재가를 기다|승인을 기다|허가를 기다|대기 중|명령을 기다|하명을 기다/;
    const NEGATED = /지는 않았|하지 않았|없었습니다|미실행|보류되었|중단되었/;
    for (const sentence of text.split(/(?<=[.!?。\n])/)) {
      if (!new RegExp(DEED).test(sentence)) continue;
      if (NEGATED.test(sentence) || WAITING.test(sentence)) continue;
      if (FOREIGN.test(sentence) && !FIRST.test(sentence)) continue;
      return { violated: true, why: sentence.trim().slice(0, 110) };
    }
    return { violated: false, why: "" };
  },
  // The other-states clause, for the two cells that receive only that half.
  // Violation = the player's decree over ANOTHER government was carried out;
  // a refusal, a stall or a demand left hanging is the clause working.
  // Calibration 8/8 (3 must-catch, 5 must-miss) — scratchpad
  // calibrate-decree.mjs, 2026-08-15. The must-miss that shaped it: "해임을
  // 요구했으나" is an attempt, not an execution, so a regime phrase that is
  // only the OBJECT of a demand verb does not count.
  "sovereignty:autoJumpForward": (text) => {
    const REGIME = "무솔리니[^.\\n]{0,30}(?:해임|사임|축출|물러|교체|실각)"
      + "|(?:친독|친독일)[^.\\n]{0,20}내각[^.\\n]{0,20}(?:수립|구성|출범|들어)"
      + "|Mussolini[^.\\n]{0,30}(?:dismissed|removed|ousted|steps? down|replaced)"
      + "|pro-German[^.\\n]{0,20}(?:cabinet|government)[^.\\n]{0,20}(?:installed|formed|takes)";
    const DEMANDED = /(해임|사임|축출|교체|퇴진)(?:을|를)\s*(?:요구|요청|촉구|압박|종용)/;
    const DEMANDED_EN = /(?:demand|urge|call(?:ed|s)? for|press(?:ed|es)? for)[^.\n]{0,40}(?:be\s+)?(?:dismissed|removed|ousted|replaced)/i;
    for (const sentence of text.split(/(?<=[.!?。\n])/)) {
      if (!new RegExp(REGIME, "i").test(sentence)) continue;
      if (/거부|거절|무산|실패|저항|반발|묵살|보류|refus|reject|declin|fail|resist|ignor/i.test(sentence)) continue;
      if (DEMANDED.test(sentence) || DEMANDED_EN.test(sentence)) continue;
      return { violated: true, why: `the player's decree was carried out by another government: ${sentence.trim().slice(0, 90)}` };
    }
    return { violated: false, why: "" };
  },
};

function scoreRegionImpacts(text) {
    const rows = [...text.matchAll(/\{[^{}]*"toCode"[^{}]*\}/g)].map((m) => m[0]);
    const owner = (row, key) => new RegExp(`"${key}"\\s*:\\s*"([^"]*)"`).exec(row)?.[1] ?? "";
    // CLAUSE 1 — the board's single-region polities, by name and by region id.
    const single = /Iraq|이라크|Saudi|사우디|era_12|SAU\.3_1/i;
    for (const row of rows) {
      const from = `${owner(row, "fromCode")} ${owner(row, "regionId")} ${owner(row, "regionName")}`;
      // wholeCountry is the engine's own "this really was a total conquest"
      // flag; a transfer that claims it is making the contract's exception,
      // not breaking the rule, and the narration is what the reader judges.
      if (single.test(from) && !/"wholeCountry"\s*:\s*true/.test(row)) {
        return { violated: true, why: `single-region polity moved on a skirmish: ${owner(row, "fromCode")}` };
      }
    }
    // CLAUSE 3+4 — occupied ground painted the occupier's own colour.
    //
    // SCORED PER ROW ON `toCode`, and both halves of that were learned from the
    // first run (docs/analysis/ab-region-jumpForward.probe1.txt):
    //   · The model answers with COUNTRY CODES ("GER", "SUN", "URS"), so a
    //     test written for full names ("Germany") matched nothing and the OFF
    //     arm scored a false 0/6 while transferring Poland to Germany in every
    //     single run. The probe hands over a hand-written JSON shape rather
    //     than the real schema, whose field description is what tells the model
    //     to use names — so codes are the probe's doing, not the model's fault.
    //   · The occupation test must read the DESTINATION, not the whole reply.
    //     A run can write the word "occupation" in its prose and still hand the
    //     ground to "GER"; searching the text would score that as compliant.
    const OCCUPIER = /^(ger|deu|germany|german reich|third reich|독일|제3제국|sun|urs|sov|ussr|soviet union|소련)$/i;
    const OCCUPATION_ENTITY = /occ|occupation|점령|generalgouvernement|general government|총독부|reichsprotektorat|vichy|mengjiang/i;
    for (const row of rows) {
      const from = `${owner(row, "fromCode")} ${owner(row, "regionId")} ${owner(row, "regionName")}`;
      if (!/Poland|폴란드|POL/i.test(from)) continue;
      const to = owner(row, "toCode").trim();
      if (OCCUPATION_ENTITY.test(to)) continue;
      if (OCCUPIER.test(to)) {
        return { violated: true, why: `occupied ground painted the occupier's colour: → ${to}` };
      }
    }
  return { violated: false, why: "" };
}
const userText = CELL_USER[`${contractKey}:${consumer}`] ?? question.user;

// Streamed like the rest of the family (trim-ab, gm-voices-ab, divergence-ab):
// with stream:false Ollama sends no headers until the generation is done, and
// undici abandons the request at 300s. One slow generation — a long consumer
// like pregameHistory, or just an Ollama hiccup — kills the whole run at 11/12.
const askOnce = async (rules) => {
  const started = Date.now();
  const response = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: "system", content: question.system(rules) },
        { role: "user", content: userText },
      ],
      temperature: 0.7,
      stream: true,
    }),
  });
  if (!response.ok) throw new Error(`ollama ${response.status}`);
  let text = "";
  let buffer = "";
  const decoder = new TextDecoder();
  for await (const chunk of response.body) {
    buffer += decoder.decode(chunk, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop();
    for (const line of lines) {
      const data = line.replace(/^data:\s*/, "").trim();
      if (!data || data === "[DONE]") continue;
      try { text += JSON.parse(data)?.choices?.[0]?.delta?.content ?? ""; } catch { /* keep-alive line */ }
    }
  }
  return { text, seconds: Math.round((Date.now() - started) / 1000) };
};

const ask = async (rules) => {
  try { return await askOnce(rules); }
  catch (error) {
    process.stdout.write(`  (retrying after: ${error?.cause?.code ?? error?.message})\n`);
    return askOnce(rules);
  }
};

// ── scorers ──────────────────────────────────────────────────────────────────
// Each returns { violated, why }. `violated` is what the contract forbids, so a
// contract that works drives it toward zero in the ON arm.
const SCORE = {
  // "IS A PAGE, NOT A PERSON … no greeting, no preamble". A newspaper that opens
  // by addressing the reader is the violation, and it is objectively detectable.
  voices: (text) => {
    const head = text.trim().split(/\n/).slice(0, 2).join(" ");
    const greets = /(안녕|반갑|말씀|여쭙|보고드립|드리겠습니다|알려드리|묻고 계신|질문)/.test(head)
      || /^(네|예|물론|알겠습니다)[,.\s]/.test(head.trim());
    const firstPerson = /(저는|제가)\s*(신문|편집|기자)/.test(text);
    return { violated: greets || firstPerson, why: greets ? "greeting/preamble" : firstPerson ? "speaks as a person" : "" };
  },
  // A polity holding one region does not lose it to a raid or a won battle.
  // A polity does not lose its ground to a raid, a border clash or a won
  // battle. The violation is therefore NOT "territory moved" — it is a small
  // engagement and a transfer tied together IN ONE SENTENCE. The Anschluss and
  // the conquest of Ethiopia are transfers too, and a scorer that counts them
  // manufactures violations (the co-occurrence trap that killed the gm-voices
  // polityHit branch in 9차).
  //
  // Bilingual because the model answers in whichever language the prompt pulls
  // it toward — the sovereignty scorer learned that the hard way (three
  // calibration failures, recorded in lib/scorers.mjs).
  // Calibration: 9/9 (4 must-catch, 5 must-miss) — scratchpad
  // calibrate-region-prose.mjs, 2026-08-15.
  region: (text) => {
    const SMALL = "습격|국경 충돌|국경 분쟁|교전|소규모 전투|한 차례 (?:승리|전투)|전투에서 이기"
      + "|raid|skirmish|border clash|border incident|minor engagement|won a battle|single battle|victory at";
    const TRANSFER = "점령|병합|합병|넘어갔|빼앗|할양|편입"
      + "|annex|seiz|captur|took over|ceded|changed hands|passed to|absorbed";
    for (const sentence of text.split(/(?<=[.!?。\n])/)) {
      if (!new RegExp(SMALL, "i").test(sentence)) continue;
      if (!new RegExp(TRANSFER, "i").test(sentence)) continue;
      return { violated: true, why: `transfer tied to a small engagement: ${sentence.trim().slice(0, 90)}` };
    }
    return { violated: false, why: "" };
  },
  // THE PLAYER'S COUNTRY ACTING WITHOUT AN ORDER, and this one is scoreable in a
  // way `voices` was not — the violation is an EVENT, not an absence.
  //
  // Every sovereignty probe below gives the player exactly one narrow order and
  // sets it in a month where history screams for something else. On 1 September
  // 1939 the player is Germany and has ordered ONLY that the Westwall be
  // reinforced. Any German offensive, pact or annexation in the reply is the
  // model doing the period's bidding instead of the player's — which is the
  // whole thing the contract forbids.
  //
  // Matched on the ACTOR being Germany, so "Poland mobilises" and "Britain
  // declares war" are correctly not violations: the world may do as it likes.
  // Shared with trim-ab.mjs — the calibration history lives with the scorer
  // (scripts/ab/lib/scorers.mjs), so it cannot fork.
  sovereignty: scoreSovereignty,
  prior: () => ({ violated: false, why: "prior is pinned on and is not measured — see simulationContracts.js" }),
};

const score = CELL_SCORE[`${contractKey}:${consumer}`] ?? SCORE[contractKey];

// ── run ──────────────────────────────────────────────────────────────────────
console.log(`\ncell: ${contractKey} × ${consumer}   board: ${SCENARIO}   runs: ${RUNS} per arm`);
console.log(`rules: ON ${ON.length} chars · OFF ${OFF.length} chars · contract ${contract.text.length}\n`);

// EVERY REPLY IS KEPT. An inconclusive run is a common outcome and it cannot be
// diagnosed without the text — the first run of this harness scored 0/6 on both
// arms and there was no way to tell a blind scorer from a question that could
// not provoke the failure in the first place. It was the question.
const transcript = [];

// AN EMPTY REPLY IS NOT COMPLIANCE. Live: region × gameMaster returned 0
// characters after 632s on one ON run, and every scorer here says "no violation
// found" about an empty string — so a dead generation scored as the contract
// working. The divergence judge already had this guard (unparsed answers are
// counted apart and declared an INSTRUMENT FAILURE); the cell harness did not.
// Empty runs leave the denominator rather than joining the compliant side.
const isEmptyReply = (text) => text.trim().length < 20;

const arm = async (label, rules) => {
  let violations = 0;
  let empties = 0;
  let seconds = 0;
  const notes = [];
  for (let i = 0; i < RUNS; i += 1) {
    const { text, seconds: took } = await ask(rules);
    seconds += took;
    const empty = isEmptyReply(text);
    const verdict = empty ? { violated: false, why: "" } : score(text);
    if (empty) empties += 1;
    if (verdict.violated) { violations += 1; notes.push(verdict.why); }
    const mark = empty ? "EMPTY" : verdict.violated ? `VIOLATED (${verdict.why})` : "ok";
    transcript.push(`-- ${label} ${i + 1}/${RUNS} — ${mark}\n${text}\n`);
    process.stdout.write(`  ${label} ${i + 1}/${RUNS} ${empty ? "EMPTY (not scored)" : verdict.violated ? "VIOLATED" : "ok"} (${took}s)\n`);
  }
  const scored = RUNS - empties;
  return { violations, empties, scored, rate: scored ? violations / scored : 0, seconds, notes };
};

const off = await arm("OFF", OFF);
const on = await arm("ON ", ON);

const armLine = (label, arm_) => `  ${label}  ${arm_.violations}/${arm_.scored} violated (${arm_.rate.toFixed(2)})  ${arm_.seconds}s`
  + (arm_.empties ? `  · ${arm_.empties} EMPTY reply(ies) left out of the denominator` : "");
console.log(`\n${armLine("OFF", off)}`);
console.log(armLine("ON ", on));
if (off.empties + on.empties >= RUNS) {
  console.log(`\n  INSTRUMENT FAILURE: ${off.empties + on.empties} of ${RUNS * 2} replies were empty.`);
  console.log(`  Do not read the rates above as a result — fix the generation first.`);
}

const transcriptPath = path.join(ROOT, "docs", "analysis", `ab-${contractKey}-${consumer}.txt`);
fs.mkdirSync(path.dirname(transcriptPath), { recursive: true });
fs.writeFileSync(transcriptPath,
  `cell: ${contractKey} x ${consumer} | board: ${SCENARIO} | ${RUNS} runs per arm\n`
  + `OFF ${off.violations}/${off.scored} | ON ${on.violations}/${on.scored}`
  + `${off.empties + on.empties ? ` | EMPTY OFF ${off.empties} ON ${on.empties} (left out of the denominators)` : ""}\n\n${transcript.join("\n")}`, "utf8");
console.log(`  transcript: ${path.relative(ROOT, transcriptPath)}`);

if (off.violations === 0) {
  console.log(`\n  INCONCLUSIVE. The OFF arm never violated, so this run cannot tell`);
  console.log(`  "the contract is unnecessary" from "the scorer cannot see the violation".`);
  console.log(`  Do NOT remove the cell on this. Either sharpen the scorer or pick a`);
  console.log(`  question where the failure is likelier.`);
} else if (on.rate < off.rate) {
  console.log(`\n  THE CONTRACT WORKS HERE: ${off.rate.toFixed(2)} → ${on.rate.toFixed(2)}. Keep the cell.`);
} else if (on.rate >= 0.5) {
  // NOT THE SAME THING AS "NO EFFECT", and the first real run proved why.
  //
  // sovereignty × jumpForward came back OFF 0.75 / ON 1.00 and the old verdict
  // called it a removal candidate. It is the opposite. A clause the model
  // violates in most of the ON runs is not an unnecessary clause — it is a
  // clause that IS NOT BEING OBEYED. Removing it saves the tokens and loses
  // whatever fraction of compliance it was buying; the finding is a quality
  // problem, not a budget one.
  //
  // The two look identical on a rate table and lead to opposite actions, so the
  // harness has to tell them apart rather than leave it to whoever reads it.
  console.log(`\n  THE CLAUSE IS NOT BEING OBEYED: ${off.rate.toFixed(2)} → ${on.rate.toFixed(2)},`);
  console.log(`  and the ON arm still violates ${on.violations}/${RUNS} times.`);
  console.log(`  This is NOT a removal candidate. Either the probe does not give the`);
  console.log(`  model what the real task gives it, or the contract does not work on`);
  console.log(`  this model. Both are worth knowing; neither says stop paying.`);
} else {
  console.log(`\n  NO EFFECT MEASURED: ${off.rate.toFixed(2)} → ${on.rate.toFixed(2)} across ${RUNS} runs,`);
  console.log(`  with the ON arm violating only ${on.violations}/${RUNS} — low in absolute terms.`);
  console.log(`  Candidate for removal — record BOTH numbers beside the cell.`);
}

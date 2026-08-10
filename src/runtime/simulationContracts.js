/*! Open Historia — the shared contracts, and which task pays for each © 2026 Nicholas Krol, MIT (see src/Editor/LICENSE). */
// THE TOLL, AND WHO SHOULD BE PAYING IT.
//
// A board's `simulationRules` is loaded into TWELVE prompts — ten tasks plus the
// advisor and the leader/chat root. One character of rules is therefore paid
// twelve times. That was fine while the field held only the board.
//
// It does not. Measured across the 23 built boards: 80,400 characters of actual
// board content are carrying 121,674 characters of these four contracts —
// SIXTY PERCENT of the block, byte-identical on every board. At the twelve-task
// toll the boilerplate costs 1.46M characters against the boards' own 965K, so
// the shared text costs more than every board in the fleet combined.
//
// And the repository already proved the fix. SCHEDULED_EVENTS and
// REPORTING_CONTRACT used to be concatenated here too; moving them to call-time
// injection on the jump tasks took the battle-figures clause from 0.36 to 0.55
// (docs/analysis/contract-ab-2026-08-09.md). The note build-preset left behind
// says it plainly: rules that only a jump can obey do not belong in the rules
// every task carries.
//
// THIS FILE CHANGES NOTHING BY ITSELF. Every contract is switched on for every
// consumer below, so the assembled prompt is byte-for-byte what it was before
// the split — pinned in tests/preset-contracts-channel.mjs. It exists so that
// turning ONE cell off is a one-line change with a measurable effect, which is
// what makes the A/B able to answer "who actually needs this?" instead of
// guessing. Filling the matrix is a measurement, not an opinion; until it is
// measured the honest default is to keep paying.
//
// The texts live here rather than in scripts/presets/lib because both the build
// and the runtime now need them: the builder to know what NOT to concatenate,
// the runtime to inject it. One copy, so they cannot drift — the lesson from
// lib/regionRef.mjs, where two builders holding separate rules for the same
// question un-shared 22 maps in a single rebuild.
import { REGION_CONTRACT, HISTORICAL_PRIOR } from "../../scripts/presets/lib/regionContract.mjs";
import { PLAYER_SOVEREIGNTY } from "../../scripts/presets/lib/playerSovereignty.mjs";
import { INTERNAL_VOICE_CONTRACT } from "../../scripts/presets/lib/internalVoices.mjs";

// ORDER IS LOAD-BEARING. build-preset concatenated these in exactly this
// sequence, so a save written before the split holds them in this order and the
// byte-identity pin depends on reproducing it.
export const CONTRACTS = [
  { key: "region", flag: "regionContract", text: REGION_CONTRACT },
  { key: "prior", flag: "historicalPrior", text: HISTORICAL_PRIOR },
  { key: "sovereignty", flag: "playerSovereignty", text: PLAYER_SOVEREIGNTY },
  { key: "voices", flag: "internalVoices", text: INTERNAL_VOICE_CONTRACT },
];

export const CONTRACT_KEYS = CONTRACTS.map((contract) => contract.key);

// The twelve prompts that carry the rules. Ten registered tasks plus the two
// root prompts, which are rendered on their own path and are easy to forget —
// the advisor is the single largest consumer the player actually reads.
export const RULES_CONSUMERS = [
  "advisor",
  "leader",
  "jumpForward",
  "autoJumpForward",
  "catalystCreation",
  "catalystExecutor",
  "catalystSummary",
  "countryStatSheet",
  "descriptionToAction",
  "gameMaster",
  "pregameHistory",
  "scheduledEvents",
];

// contract key -> the consumers that receive it.
//
// A cell comes out one of two ways, and the difference is recorded so a reader
// can tell them apart:
//
//   STRUCTURAL — the consumer's output cannot state the thing the contract
//     forbids. Not a sample, not an opinion: read off the output schema, and
//     pinned in tests/preset-contracts-channel.mjs. Four cells, below.
//   MEASURED — contract-ab showed the contract changes nothing there. The
//     measurement goes next to the cell. There are none yet.
//
// AND THE STRUCTURAL SET IS MUCH SMALLER THAN IT LOOKS, because of something the
// contracts' own wording settles. They read like rules about ACTS — moving a
// region, mobilising an army — so the tempting test is "can this task perform
// that act?", which clears seven or eight consumers at a stroke. That test is
// WRONG. All three are written about NARRATION:
//
//   sovereignty  "Before NARRATING any act BY the player's own polity…"
//   voices       "a turn's NARRATION must not mention them at all"
//   region       explains what a region is, for anything that talks about one
//
// Any consumer that emits prose can narrate, so nearly every consumer keeps
// them — including the ones that own no impact fields at all. What clears is
// only a consumer whose output is a TABLE: no free text in which a claim about
// territory or about the player's country could be made.
//
// EXACTLY ONE CONSUMER QUALIFIES, and the one that did not is the useful part.
//
// `countryStatSheet` returns capital, continent, government, leader, indices,
// economy — a table of the state of one named country. It has no field in which
// a region could change hands and none in which the player's country could act.
// Both contracts are dead weight there: 3,087 characters on a prompt that runs
// once per country per sheet.
//
// `scheduledEvents` LOOKED like the same case and is not, which is why it is not
// here. Its rows carry `name` and a `note`, and "Handover of Hong Kong — sover-
// eignty transfers" is a statement about territory that fits in them. Close to
// inert is not inert, and the honest place for it is the measurement queue.
//
// `voices` stays on the stat sheet too: a sheet can be compiled for any target,
// including a voice.
//
// `prior` IS PINNED ON FOR ALL TWELVE AND WILL NOT BE MEASURED. This is a
// decision reached ON MEASUREMENT GROUNDS, not an unexamined default, and the
// distinction matters because everything else in this file is "not measured
// yet". Two reasons:
//
//   COST. It is 212 characters. Turning off all twelve cells would save 2,544 —
//   3.9% of the 65,424-character toll — and the twelve A/B runs needed to earn
//   that permission cost more local model time than the saving is worth.
//
//   AND IT IS THE ONE CONTRACT THAT IS NOT ABOUT NARRATION. The other three
//   constrain what a consumer may SAY (narrate an act, mention a voice, move a
//   region). `prior` states WHICH WORLD THIS IS — everything before the start
//   date really happened, or on Kaiserreich and TNO it did not. That is a fact
//   the content of every consumer depends on, including the ones that only
//   emit a table. Cheap and plausibly load-bearing everywhere is the profile of
//   a clause you keep.
const STRUCTURALLY_CLEARED = {
  region: ["countryStatSheet"],
  sovereignty: ["countryStatSheet"],
};

export const CONTRACT_CONSUMERS = Object.fromEntries(
  CONTRACT_KEYS.map((key) => {
    const cleared = new Set(STRUCTURALLY_CLEARED[key] ?? []);
    return [key, RULES_CONSUMERS.filter((consumer) => !cleared.has(consumer))];
  }),
);

const normalize = (value) => (typeof value === "string" ? value : "");

/**
 * Which contracts a world says it carries. NO KEY MEANS NONE — and the first
 * draft of this had it the other way round, which would have double-loaded every
 * save in existence.
 *
 * A world with no `contracts` key is one of exactly two things, and injecting
 * nothing is right for both:
 *
 *   • the DEFAULT scenario, which is built by build-default-map and never had
 *     contracts at all. "Absent = all" appended 5,452 characters of contract to
 *     a board with no rules of its own — caught by the byte-identity check,
 *     which is the only reason this comment is not a bug report.
 *   • a SAVE written before the split, which holds the contracts baked into its
 *     own rules copy. Injecting them again would print each one twice, in the
 *     same prompt, a few thousand characters apart.
 *
 * The second case is the one the migration exists for: strip the baked copy,
 * then record what was found. Until a world is migrated it says nothing, and
 * saying nothing leaves it exactly as it reads today.
 */
export const contractsOf = (world) => {
  const held = world?.contracts;
  if (!Array.isArray(held)) return [];
  return held.map((key) => String(key)).filter((key) => CONTRACT_KEYS.includes(key));
};

/**
 * The rules text for one consumer: the board's own rules, then every contract
 * this board carries that this consumer is down for.
 *
 * Concatenated with no separator, which looks wrong and is right — build-preset
 * joined them with `join("")` and the saves on disk were written that way. The
 * contracts open with their own leading space.
 */
export const assembleRules = (world, consumer) => {
  const board = normalize(world?.simulationRules).trim();
  const held = new Set(contractsOf(world));
  const parts = [board];
  for (const contract of CONTRACTS) {
    if (!held.has(contract.key)) continue;
    if (!CONTRACT_CONSUMERS[contract.key]?.includes(consumer)) continue;
    parts.push(contract.text);
  }
  return parts.filter(Boolean).join("").trim();
};

/**
 * Remove contract text a save is still carrying inside its own rules copy.
 *
 * Saves hold their own copy of `simulationRules` — the prompt reads the SAVE's,
 * not the scenario's (promptContext.js). A save written before the split has the
 * contracts baked into that copy, so injecting them again would load each one
 * twice. Exact substring removal, because these are our strings and we know
 * them; a board's own text is never touched.
 *
 * Returns the cleaned text and which contracts were found, so a migration can
 * report rather than silently rewrite.
 */
export const stripContracts = (rules) => {
  let text = normalize(rules);
  const removed = [];
  for (const contract of CONTRACTS) {
    if (!text.includes(contract.text)) continue;
    text = text.split(contract.text).join("");
    removed.push(contract.key);
  }
  return { rules: text.trim(), removed };
};

/*! Open Historia — difficulty levels & AI directives © 2026 Nicholas Krol, MIT (see src/Editor/LICENSE). */

// Difficulty is stored on game.json (game.difficulty) and steers the AI:
// every gameplay task gets the matching directive appended to its system
// prompt, so the same simulation engine plays soft or ruthless.
// WHAT THE DIAL ACTUALLY TURNS.
//
// These used to say the world "favors" or "conspires against" the player, which
// is a mood, and moods do not survive a 12,000-token prompt. Measured on this
// campaign: 31 rounds on the setting whose text was "the world conspires against
// the player", and the player's reputation went 53 → 92 without one decline and
// no territory was ever lost.
//
// The original game's own axis is different and better, and it is the one used
// here now: YOU CAN ALWAYS ATTEMPT ANYTHING — what the difficulty changes is how
// much preparation an attempt needs before it works. Its wiki puts it as "the
// amount of preparation a player must prepare and how much resistance the AI
// provides", and its hardest tier makes an unprepared major action fail AND do
// lasting damage. That is causal rather than arbitrary: nothing bad happens out
// of nowhere, but what you tried does not always work.
//
// Two directives per level, because the original has two helpers and the second
// one covers a case this engine was missing entirely: a difficulty that shapes
// simulation but leaves DIPLOMACY untouched is a difficulty you can talk your way
// around, and the original's wiki says outright that this is how players find the
// hard modes easy in practice.
export const DIFFICULTY_LEVELS = [
  {
    id: "very-easy",
    label: "Very Easy",
    emoji: "😴",
    blurb: "Nothing needs preparing",
    directive:
      "DIFFICULTY very-easy: The player may execute any action, plan or scheme they wish, and it works. However far-fetched, if they want it, simulate it. Preparation is not required for anything.",
    chatDirective:
      "DIFFICULTY very-easy: Polities answering the player are extremely receptive and agree readily. Their declared enemies still behave realistically and do not hand over everything at once.",
  },
  {
    id: "easy",
    label: "Easy",
    emoji: "🙂",
    blurb: "Almost anything works",
    directive:
      "DIFFICULTY easy: The player may attempt anything, with minimal chance of failure. Keep real historical friction — the whole world does not bend the instant they ask — but a player who keeps at something gets it with relative ease.",
    chatDirective:
      "DIFFICULTY easy: Polities answering the player are very receptive and usually agree. Their declared enemies still behave realistically.",
  },
  {
    id: "medium",
    label: "Medium",
    emoji: "⚖️",
    blurb: "Succeeds on its merits",
    directive:
      "DIFFICULTY medium: An ordinary strategy game. The player may attempt any plan at any time, and it has a real chance to BACKFIRE depending on how realistic it is and how well prepared they were. Every polity behaves realistically — none folds instantly to what the player wants, the player's own included. A regime change they have laid the ground for is likely; an unprepared one fails outright. Starting a war does not take regions without resistance unless that is genuinely how it would go.",
    chatDirective:
      "DIFFICULTY medium: The player's request is always genuinely considered. One good argument is enough to move a neutral polity. Do not let the conversation run on without resolving — the speaking polity gives a direct, official answer quickly.",
  },
  {
    id: "hard",
    label: "Hard",
    emoji: "😰",
    blurb: "Plans need groundwork",
    directive:
      "DIFFICULTY hard: The player may plan anything, but their plans often fail to land or backfire. An action needs strategy, groundwork and realism behind it, and an action without them SHOULD ACTUALLY FAIL — say so in the event, with what went wrong. Every other polity behaves realistically and competently. Over time and with diligence the player still reaches their goals.",
    chatDirective:
      "DIFFICULTY hard: The player's proposals are close to unacceptable to any polity hostile to them, and even their allies find them hard to accept. Do not let the conversation run on without resolving — give a direct, official answer quickly.",
  },
  {
    id: "very-hard",
    label: "Very Hard",
    emoji: "🔥",
    blurb: "Groundwork first, or it costs you",
    directive:
      "DIFFICULTY very-hard: A major action attempted without the smaller steps that make it possible FAILS, and failing costs something real — money spent, standing lost, a partner offended, a programme set back. Every other polity behaves realistically and presses its own advantage. The player's allies are less capable than they hope and their rivals more so. Sustained, well-prepared effort still wins.",
    chatDirective:
      "DIFFICULTY very-hard: Hostile polities almost never accept the player's proposals, and allies accept only what plainly serves them. Do not let the conversation run on without resolving — give a direct, official answer quickly.",
  },
  {
    id: "impossible",
    label: "Impossible",
    emoji: "💀",
    blurb: "Months of setup or it fails badly",
    directive:
      "DIFFICULTY impossible: The game is meant to be the challenge. The player may plan minor and major actions alike, but WITHOUT the minor actions that prepare the ground first, every major action fails — and does long-term, possibly irreparable damage in failing. Say what the failure cost, in the event, with the impact that makes it real. Every other polity behaves realistically and is genuinely hard to deal with; the player's allies are weaker than they expect and their enemies far stronger. Only long, diligent, well-sequenced work gets them anywhere.",
    chatDirective:
      "DIFFICULTY impossible: Only overwhelming, concrete evidence moves another polity to accept anything the player proposes. Do not let the conversation run on without resolving — give a direct, official answer quickly.",
  },
];

export const DEFAULT_DIFFICULTY = "medium";

// Older games store "standard" (or nothing) — treat both as medium.
export const normalizeDifficulty = (value) => {
  const id = String(value ?? "").trim().toLowerCase();
  if (id === "standard" || id === "") {
    return DEFAULT_DIFFICULTY;
  }

  return DIFFICULTY_LEVELS.some((level) => level.id === id) ? id : DEFAULT_DIFFICULTY;
};

export const difficultyMeta = (value) =>
  DIFFICULTY_LEVELS.find((level) => level.id === normalizeDifficulty(value)) ||
  DIFFICULTY_LEVELS[2];

export const difficultyDirective = (value) => difficultyMeta(value).directive;

// A DIFFICULTY THAT LEAVES DIPLOMACY ALONE IS ONE YOU TALK AROUND.
//
// This engine appended the simulation directive to the diplomacy prompt too,
// which reads oddly there — "rival nations act passively" says nothing about
// whether the country you are negotiating with will sign. The original ships a
// second, chat-specific helper for exactly this, and its own wiki names the
// failure it exists to stop: players find the hard modes easy in practice
// because they can smooth-talk an LLM, which agrees with the user too readily.
export const difficultyChatDirective = (value) => difficultyMeta(value).chatDirective;

// ---- How an order can come out, and how often ---------------------------------
//
// THE THING THE ENGINE COULD NOT SAY.
//
// The Hard directive has always read "weak or vague player actions fail" — and
// there was nowhere to record that they had. An order's status was `planned` or
// `resolved` and nothing else; `actionIds` meant "orders this event CARRIED
// OUT". A failure and a not-yet-attempted order were the same value, so the
// prompt asked for something the save could not hold, and 31 rounds on the
// hardest setting produced an unbroken run of successes.
//
// So an order now records how it went. Four outcomes, which is the shape the
// original's own difficulty text describes: an action lands, lands partly, fails,
// or fails and costs something.
export const ACTION_OUTCOMES = ["succeeded", "partial", "failed", "backfired"];
export const DEFAULT_ACTION_OUTCOME = "succeeded";

export const normalizeActionOutcome = (value) => {
  const id = String(value ?? "").trim().toLowerCase();
  if (ACTION_OUTCOMES.includes(id)) return id;
  // Words the model reaches for that mean one of the four.
  if (/^(success|complete|done|achieved)/.test(id)) return "succeeded";
  if (/^(partial|mixed|delayed|slowed|reduced)/.test(id)) return "partial";
  if (/^(backfire|counterproductive|disaster|catastroph)/.test(id)) return "backfired";
  if (/^(fail|blocked|rejected|abandoned|stalled)/.test(id)) return "failed";
  return DEFAULT_ACTION_OUTCOME;
};

export const isCleanSuccess = (outcome) => normalizeActionOutcome(outcome) === "succeeded";

// What SHARE of the orders a period resolves should come out as less than a
// clean success. A share rather than a count, because a player who gave two
// orders should not owe the same three failures as one who gave twenty — that
// is the arbitrary punishment this is meant not to be.
//
// The ladder follows the original's own wording: Easy is "minimum chance of
// failure", Normal has "a high chance to backfire depending on realism and
// preparedness", Hard is "often fail or backfire", Impossible is "without proper
// setup, ALL major actions fail".
export const SETBACK_SHARE = {
  "very-easy": 0,
  easy: 0.1,
  medium: 0.25,
  hard: 0.45,
  "very-hard": 0.6,
  impossible: 0.75,
};

export const setbackShare = (value) => SETBACK_SHARE[normalizeDifficulty(value)] ?? 0;

// How many of this period's resolved orders should have gone less than cleanly.
// Rounds DOWN: the quota is a floor the period is expected to clear, and rounding
// up would make a single-order turn on Medium owe a failure.
export const setbackQuota = (value, resolvedCount) => {
  const share = setbackShare(value);
  if (share <= 0) return 0;
  return Math.floor(Math.max(0, Number(resolvedCount) || 0) * share);
};

// A DEBT THAT COMPOUNDS FOREVER BECOMES THE PUNISHMENT THIS AVOIDS.
//
// The first live turn rated 0 of 15 orders — the field was nested and went
// unfilled — and carried 11 forward. Left uncapped, three such turns would be
// demanding thirty failures of a fifteen-order period, which is not a hard game
// but a broken one. One period's worth is the most that can be owed: enough for
// a quiet turn to be made up next time, not enough to spiral.
export const capShortfall = (value, shortfall, resolvedCount) => {
  const ceiling = Math.max(1, setbackQuota(value, resolvedCount));
  return Math.max(0, Math.min(Math.round(Number(shortfall) || 0), ceiling));
};

// AND THE DEMAND ITSELF CANNOT EXCEED THE ORDERS THERE ARE.
//
// Live: "0 of 18 order(s) came out less than cleanly, against 24 expected" —
// twenty-four setbacks asked of eighteen orders, because the carried debt was
// added to this period's share without anything checking the total against
// reality. A quota you could not meet by failing EVERY order is not a quota.
export const totalSetbacksOwed = (value, resolvedCount, carried = 0) => {
  const rated = Math.max(0, Number(resolvedCount) || 0);
  const owed = setbackQuota(value, rated) + Math.max(0, Math.round(Number(carried) || 0));
  return Math.min(owed, rated);
};

// What actually happened, read off the orders the turn resolved.
export const countOrderOutcomes = (actions, { round = null } = {}) => {
  const tally = { succeeded: 0, partial: 0, failed: 0, backfired: 0 };
  for (const action of Array.isArray(actions) ? actions : []) {
    if (action?.status !== "resolved") continue;
    if (round !== null && Number(action?.resolvedRound) !== Number(round)) continue;
    tally[normalizeActionOutcome(action?.outcome)] += 1;
  }
  const resolved = Object.values(tally).reduce((sum, count) => sum + count, 0);
  return { ...tally, resolved, setbacks: resolved - tally.succeeded };
};

// The obligation, stated where the model is still holding it. Deliberately about
// the player's OWN attempts rather than about the world's mood: a plan that
// falls short because it was not prepared is difficulty; a disaster from nowhere
// is just punishment.
export const setbackDirective = (value, { shortfall = 0, playerPolity = "the player" } = {}) => {
  if (setbackShare(value) <= 0) return "";
  const meta = difficultyMeta(value);
  const percent = Math.round(setbackShare(value) * 100);
  return [
    "[How The Player's Orders Come Out]",
    `${meta.label}. At the TOP LEVEL of your answer — beside "events", not inside one — return "actionOutcomes": a flat list saying how each of ${playerPolity}'s queued orders this period resolved actually came out. Shape: [{"id":"<the order id>","outcome":"succeeded|partial|failed|backfired","note":"<why, in one clause>"}]. An order you leave out is taken as a clean success.`,
    `At this difficulty roughly ${percent}% of the orders a period resolves should be less than a clean success — and which ones is not arbitrary. Judge each order on what it actually asked for: how realistic it was, whether the groundwork for it exists in this campaign's own history, and whether ${playerPolity} could plausibly carry it out now.`,
    "• partial — it happened, but smaller, later, or at a cost.",
    "• failed — it did not happen, and the event says what stopped it.",
    "• backfired — it did not happen AND it cost something: money, standing, a partner, a programme. Carry the impact that makes that real; a backfire with no impact is a story about nothing.",
    "A failed order STAYS the player's to retry — do not quietly re-succeed it next period, and do not invent a new order for them.",
    shortfall > 0
      ? `The last period returned ${shortfall} fewer than this share implies, so this one is carrying that.`
      : "",
  ].filter(Boolean).join("\n");
};

// ---- Information the difficulty decides you may see -------------------------
//
// A country's standing character (countryPersonality.js) decides what it does
// when something happens to it: whether it reaches for force, whether its
// guarantees hold when they turn expensive, whether it comes back for a wrong
// years later. Printing those five numbers on the country panel hands the player
// a reliable predictor of every rival's next move — which is a real advantage,
// and therefore a real difficulty lever rather than a cosmetic one. Knowing that
// a neighbour sits at aggr 80 / grudge 75 tells you exactly how far you can push
// it, and reading it off a panel is not the same game as inferring it from how it
// has behaved for twenty turns.
//
// So it is gated: visible up to Hard, withheld at Very Hard and Impossible, where
// the player is meant to be working the world out from its behaviour. The rule
// applies to the PLAYER'S OWN country too — this engine treats the player as an
// actor distinct from the state they direct (see the player-identity directive),
// and a player who is not the head of state has no privileged window into their
// own country's temperament either.
//
// This hides the READOUT, never the mechanism: the profiles still ride in every
// simulation prompt and still decide behaviour at every difficulty. Nothing about
// how the world acts changes here — only what the player is told about it.
const CHARACTER_PROFILE_HIDDEN_AT = new Set(["very-hard", "impossible"]);

export const revealsCharacterProfile = (value) =>
  !CHARACTER_PROFILE_HIDDEN_AT.has(normalizeDifficulty(value));

// The line the panels show in place of the bars, so the absence reads as a rule
// of the difficulty rather than as something broken.
export const CHARACTER_PROFILE_HIDDEN_NOTE =
  "Hidden at this difficulty — read them from how this country behaves.";

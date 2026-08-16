/*! Open Historia — the scenario's own timeline © 2026 Nicholas Krol, MIT (see src/Editor/LICENSE). */
// WHAT IS SUPPOSED TO HAPPEN, AND WHEN.
//
// A campaign's world was running on nothing. Measured on the shipped Modern Day
// scenario: startingTimelineText 0 characters, simulationRules 0 characters. The
// model had the map and the date and nothing else — and a 12B model asked what
// happened in February 2016 does not know. So a South Korean campaign starting in
// January 2016 produced no fourth nuclear test, no Kwangmyongsong launch, no
// THAAD, no April general election. It produced, as the entire record of the
// outside world across six turns:
//
//   러시아의 극동 개발 …  x5        중국의 디지털 실크로드 확장 …  x5
//
// The same non-event, reworded, once per turn. Not because the directive to
// ground events in the period is missing — it is there and emphatic — but because
// the model had nothing to ground them IN. Recall is the wrong thing to ask a
// small model for; reading is what it is good at.
//
// So the scenario carries its own timeline and the engine hands over the slice
// covering each jump. The engine never asks whether those entries are real
// history: for a modern preset they are, for an authored alternate world they are
// whatever its designer decided, and for a fictional one they are invented. The
// machinery is identical — it is simply "what this scenario says happens in this
// window".

const normalizeString = (value) => String(value ?? "").trim();
const normalizeArray = (value) => (Array.isArray(value) ? value : []);

// Extended years allowed: a deep-past board's dates are "-001199-01-01" (see
// runtime/gameDate.js for why six digits and why that number is 1200 BCE).
// The plain four-digit form stays first because every other board uses it.
const ISO_DATE = /^(?:\d{4}|[+-]\d{6})-\d{2}-\d{2}$/;

// How far an entry's importance reaches. The window selector uses this to decide
// what is worth the prompt space when a jump covers a lot of ground.
export const TIMELINE_WEIGHTS = { pivotal: 3, major: 2, minor: 1 };
const DEFAULT_WEIGHT = "major";

// ---- What the entry DOES to the world -------------------------------------
//
// Narration is not a consequence. Measured on the shipped campaign: the turn
// covering 2016-08-28 → 09-27 wrote both of its scheduled entries as events —
// Rousseff's impeachment and the fifth nuclear test — and both came back with
// `impacts: {actionIds:[], createdChats:[], markerOps:[], polityChanges:[],
// regionTransfers:[], unitOps:[]}`. Every array empty. A president was removed
// from office in the prose and Brazil's leader in world state did not move; the
// country did not even acquire a stat row. Click Brazil the next day and the
// sheet is generated from scratch, so it answers whatever the model feels like.
// Story and state disagreed, which this project treats as a bug.
//
// The prompt already says "carry the real impacts", emphatically, and it is
// ignored — which is the usual finding here: a 12B model asked to RECALL that
// Michel Temer succeeded Rousseff is being asked the wrong question. But the
// person who wrote the timeline entry knew. So an entry may declare what it does,
// the same way it declares when it happens, and the engine writes that in if the
// event did not. Declared effects are the scenario's own data, not a guess:
// leave the field off and nothing is fabricated.
export const TIMELINE_EFFECT_KINDS = ["polityChanges", "regionTransfers", "markerOps", "unitOps"];

export const normalizeTimelineEffect = (value) => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const effect = {};
  for (const kind of TIMELINE_EFFECT_KINDS) {
    const fragment = value[kind];
    if (!Array.isArray(fragment)) continue;
    const items = fragment.filter((item) => item && typeof item === "object" && !Array.isArray(item));
    if (items.length > 0) effect[kind] = items;
  }
  return Object.keys(effect).length > 0 ? effect : null;
};

const carries = (event, kind) => Array.isArray(event?.impacts?.[kind]) && event.impacts[kind].length > 0;

export const eventCarriesAnyImpact = (event) =>
  TIMELINE_EFFECT_KINDS.some((kind) => carries(event, kind));

// Write the entry's declared effect into the event that told its story — but only
// the kinds the event left empty. A model that DID write a polityChange knows more
// about this campaign than the scenario file does (it has seen the player's
// orders), so its version stands and the declaration is not applied over it.
// Returns the kinds that were written, so the caller can report them.
export const writeTimelineEffect = (entry, event) => {
  const effect = entry?.effect;
  if (!effect || !event || typeof event !== "object") return [];
  const written = [];
  for (const kind of TIMELINE_EFFECT_KINDS) {
    const fragment = effect[kind];
    if (!Array.isArray(fragment) || fragment.length === 0) continue;
    if (carries(event, kind)) continue;
    if (!event.impacts || typeof event.impacts !== "object" || Array.isArray(event.impacts)) event.impacts = {};
    // DEEP, not `{...item}`. A polityChange's payload is `{code, stats:{leader}}`
    // — one level down — and the event this lands in is then run through the
    // coercion and range-clamping passes, which edit in place. A shallow copy
    // shares `stats` with the scenario's own entry, so those passes would write
    // back into the campaign's timeline and the correction would be permanent
    // and invisible. The declaration is read-only data; it gets copied whole.
    event.impacts[kind] = fragment.map((item) => structuredClone(item));
    written.push(kind);
  }
  return written;
};

// A DATE THAT HAS PASSED CANNOT BE DEFERRED.
//
// The backlog exists so an entry the turn skipped gets another turn, and that is
// right for one the model merely ran out of room for. It is wrong for an entry
// whose day has already come and gone with nothing written: on 2017-05-25 the
// presidential election of 2017-05-09 is not "outstanding", it is missing.
// Measured on that turn — the model put "제19대 대통령 선거 결과: 문재인 당선" in the
// turn SUMMARY, wrote no event for it at all, and the stat sheet still read
// 황교안 권한대행. The game told the player who won and then disagreed with itself.
//
// So the engine writes the entry itself, out of the scenario's own words. That is
// not inventing history: the entry IS the history, and its prose was authored for
// exactly this. Divergence is untouched — an entry the model DID write about, as
// happening or prevented or delayed, scores as accounted for and never reaches
// here, so a player who genuinely changed the outcome keeps their change.
export const materializeTimelineEntry = (entry, { playerPolity = "", branchRolls = null } = {}) => {
  if (!entry || typeof entry !== "object") return null;
  const date = normalizeString(entry.date);
  const title = normalizeString(entry.title);
  if (!ISO_DATE.test(date) || !title) return null;
  const home = normalizeString(playerPolity).toLowerCase();
  const actors = normalizeArray(entry.actors).map((value) => normalizeString(value).toLowerCase());
  // A fork entry's detail deliberately says "could go either way" — right for
  // the prompt, wrong for a chronicle entry the engine itself is writing after
  // the date has passed. The rolled branch is appended so the written history
  // states what actually happened.
  const rolledOutcome = branchOutcomeOf(entry, branchRolls);
  const detail = normalizeString(entry.detail) || title;
  const event = {
    date,
    title,
    description: rolledOutcome ? `${detail} ${rolledOutcome}` : detail,
    kind: "world",
    // The campaign's own convention: a domestic event of the player's country is
    // player-related even when no order of theirs caused it (2016-12-05 탄핵소추안
    // 가결 is stored that way), and a foreign one is not.
    playerRelated: Boolean(home) && actors.includes(home),
    importance: entry.weight === "pivotal" ? "critical" : "major",
    notable: false,
    impacts: {},
  };
  writeTimelineEffect(entry, event);
  return event;
};

export const normalizeTimelineEntry = (entry, index = 0) => {
  if (!entry || typeof entry !== "object") return null;
  const date = normalizeString(entry.date);
  const title = normalizeString(entry.title || entry.name || entry.headline);
  if (!ISO_DATE.test(date) || !title) return null;
  const weight = normalizeString(entry.weight || entry.importance).toLowerCase();
  return {
    id: normalizeString(entry.id) || `tl-${date}-${index}`,
    date,
    title,
    // The one or two sentences a writer would need to turn this into an event.
    detail: normalizeString(entry.detail || entry.description || entry.text),
    // Who it happens to. Used to tell the model whether the player is involved,
    // and later to judge whether the campaign could plausibly have changed it.
    actors: normalizeArray(entry.actors ?? entry.countries).map((value) => normalizeString(value)).filter(Boolean),
    weight: weight in TIMELINE_WEIGHTS ? weight : DEFAULT_WEIGHT,
    // WAS THIS COMING, AND DID EVERYONE KNOW?
    //
    // An election has a date on it years ahead; a nuclear test does not. That
    // difference is the whole basis for what the player may plan around. The
    // field is the outcome-free sentence a well-informed contemporary could have
    // written BEFORE it happened — "4월 13일 총선이 예정되어 있다", never "여당이
    // 과반에 실패했다" — because the title and detail carry the result and the
    // result is exactly what nobody knew yet. Absent means it was a surprise, and
    // a surprise is the default: an entry only becomes foreseeable when somebody
    // writes the pre-outcome phrasing for it.
    foreseeable: normalizeString(entry.foreseeable),
    // When it became public, for something announced partway through (the Brexit
    // referendum date was set in February for a June vote). Empty = known from the
    // campaign's start.
    foreseeableFrom: ISO_DATE.test(normalizeString(entry.foreseeableFrom)) ? normalizeString(entry.foreseeableFrom) : "",
    // What it does to world state, if the scenario author knew. See above.
    effect: normalizeTimelineEffect(entry.effect ?? entry.impact ?? entry.impacts),
    // A SCRIPTED FORK, where the source declared one ("select one at random":
    // TNO's succession, its elections). Each branch is one outcome sentence,
    // written to print as chronicle text. The entry's own detail stays
    // uncertainty-phrased — which branch actually happens is decided by ONE
    // engine roll per campaign (world.timelineBranchRolls, rolled in the jump
    // flow), never by asking the model to "pick at random": the anchor pilot
    // measured prompt-side randomness at 0/6–4/6 compliance, and a roll the
    // save remembers is what keeps retries and later turns telling one story.
    branches: normalizeArray(entry.branches)
      .map((branch) => ({
        outcome: normalizeString(branch?.outcome),
        chance: normalizeString(branch?.chance),
      }))
      .filter((branch) => branch.outcome),
  };
};

// The rolled outcome of a fork entry, read from the save's roll table. Empty
// when the entry has no branches, no roll has been made yet, or the stored
// index no longer fits the branch list (a revision shrank it) — every caller
// treats empty as "no fork to speak of", which fails safe to the entry's own
// uncertainty-phrased detail.
export const branchOutcomeOf = (entry, branchRolls) => {
  const branches = normalizeArray(entry?.branches);
  if (branches.length === 0) return "";
  const index = branchRolls?.[entry.id];
  if (!Number.isInteger(index) || index < 0 || index >= branches.length) return "";
  return normalizeString(branches[index]?.outcome);
};

export const normalizeTimeline = (entries) =>
  normalizeArray(entries)
    .map((entry, index) => normalizeTimelineEntry(entry, index))
    .filter(Boolean)
    .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));

// The entries a jump from `fromDate` to `toDate` covers. Inclusive of the end so
// something dated on the target date still arrives; exclusive of the start so the
// previous turn's last day is not replayed.
export const timelineWindow = (entries, fromDate, toDate) => {
  const from = normalizeString(fromDate);
  const to = normalizeString(toDate);
  if (!ISO_DATE.test(to)) return [];
  return normalizeTimeline(entries).filter((entry) =>
    (!ISO_DATE.test(from) || entry.date > from) && entry.date <= to);
};

// A long jump can cover a year and fifty entries, which would swamp the prompt.
// Weight decides who stays: a pivotal entry is never dropped, and what gets cut is
// reported by the caller rather than silently disappearing.
export const selectTimelineEntries = (entries, limit = 12) => {
  if (entries.length <= limit) return { kept: entries, dropped: [] };
  const ranked = [...entries].sort((a, b) =>
    (TIMELINE_WEIGHTS[b.weight] - TIMELINE_WEIGHTS[a.weight]) || (a.date < b.date ? -1 : 1));
  const kept = ranked.slice(0, limit).sort((a, b) => (a.date < b.date ? -1 : 1));
  const keptIds = new Set(kept.map((entry) => entry.id));
  return { kept, dropped: entries.filter((entry) => !keptIds.has(entry.id)) };
};

// The prompt block. The contract lives here rather than in the task template
// because it has to reach campaigns that froze their prompts before this existed.
//
// The rule it states is the one thing this feature must not get wrong. A scheduled
// event happens unless the campaign itself made it impossible — and if it did, the
// DIVERGENCE is an event too. "It's alternate history now" is not a reason for
// something to quietly not happen; the player has to be able to see what changed
// and why. An absence with no story behind it is the same silent drop this engine
// treats as a bug everywhere else.
export const buildTimelineText = (entries, { playerPolity = "", missed = [], branchRolls = null } = {}) => {
  const listed = entries.flatMap((entry) => {
    const who = entry.actors.length > 0 ? ` [${entry.actors.join(", ")}]` : "";
    const mark = entry.weight === "pivotal" ? " (PIVOTAL)" : "";
    const line = `- ${entry.date}${mark} ${entry.title}${who}${entry.detail ? ` — ${entry.detail}` : ""}`;
    const extras = [];
    // A fork entry's detail lists the possibilities; the engine has already
    // rolled which one this campaign gets (once, remembered by the save). The
    // model writes THAT branch — handing it the menu instead was measured at
    // 0/6–4/6 compliance in the anchor pilot, and a re-roll every retry would
    // let the same campaign tell two histories.
    const rolledOutcome = branchOutcomeOf(entry, branchRolls);
    if (rolledOutcome) {
      extras.push(`    this one resolves as: ${rolledOutcome} Write THIS outcome as the event — the other possibilities did not happen.`);
    }
    // A declared effect is shown as the literal impacts object to copy, because
    // "carry the real impacts" in the abstract is what the model keeps ignoring.
    if (entry.effect) extras.push(`    impacts for this one: ${JSON.stringify(entry.effect)}`);
    return [line, ...extras];
  });
  const overdue = missed.map((entry) => `- ${entry.date} ${entry.title} (was due in an earlier period and has still not been accounted for)`);
  const player = normalizeString(playerPolity) || "the player's polity";

  return [
    "[What This Period Holds]",
    "These things are set to happen in the window you are simulating. They are not suggestions and not background colour — they are the world's own schedule, and the events you write must account for every one of them.",
    ...listed,
    ...(overdue.length > 0 ? ["", "STILL OUTSTANDING from an earlier period:", ...overdue] : []),
    "",
    "How to use them:",
    `• Each entry becomes an event, written in your own words with its date and its consequences. Where ${player} is involved, write what it meant for them; where it is not, it is a world event (playerRelated false, kind world) and still belongs in the answer.`,
    "• Carry the real impacts. An entry that moves a border needs regionTransfers, one that installs a leader needs polityChanges.stats.leader — written as official title + name (\"대통령 권한대행 황교안\"), never a bare name — one that builds something needs markerOps. The same rules as any other event. Where an entry above prints an \"impacts for this one\" line, that object goes into that event's impacts as written — it is the scenario's own record of what changed, not a suggestion. An event that narrates a change and carries no impact has not happened as far as the world is concerned.",
    "• Keep the date. An entry's event is dated on the entry's date, not on the end of the window. Move it only if the campaign delayed it, and then say in the event what caused the delay.",
    `• AN ENTRY MAY TURN OUT DIFFERENTLY, BUT ONLY FOR A REASON THIS CAMPAIGN CREATED. If ${player}'s orders, or the consequences of earlier events, genuinely changed the conditions for it, then write what happened INSTEAD — the divergence itself is the event, and it must name what caused it. "This is alternate history now" is not a cause. An entry nobody in this campaign touched happens as scheduled, even when it is inconvenient.`,
    "• Never skip one in silence. If it happened, write it. If it was prevented, write the preventing. If it was delayed, write the delay and what caused it. An entry that simply never appears is a failure of this turn.",
    `• A PLAYER ORDER THAT ANTICIPATES ONE OF THESE IS LEGITIMATE AND IS CARRIED OUT AS GIVEN. The human at the keyboard may know this period; ${player} may act on that. Never refuse, weaken, or reinterpret an order because the state "could not have known" what was coming — an order that positions for something on this list is exactly the kind of play this game is for, and it resolves like any other. If it genuinely changed the conditions, follow the divergence rule above and write what happened instead.`,
  ].join("\n");
};

// ---- What the player may plan around --------------------------------------
//
// The jump gets the whole schedule because it is the simulator and has to make
// the world happen. The BRAINSTORMER is different: its output is a board of
// options the player picks from, so anything it sees, the player effectively
// knows. Handing it the full timeline would put "prepare for the THAAD
// announcement" on the board a week before anyone announced anything.
//
// So it sees only what a well-informed government of the day could already see —
// the entries somebody wrote a pre-outcome phrasing for, and only from the date
// that phrasing became true. The result stays hidden even for those: a referendum
// on the calendar is public, how it votes is not.
//
// This restricts the SUGGESTIONS, never the player. A player who knows their own
// history and types "사드 배치에 대비해 대중 외교 완충을 마련하라" is playing the
// game, not cheating at it, and nothing here filters or weakens a typed order.
// The engine's job is to avoid HANDING OVER foreknowledge, not to police what the
// person already knows.
const FORESEEABLE_HORIZON_DAYS = 180;

export const daysBetween = (fromDate, toDate) => {
  const from = Date.parse(`${fromDate}T00:00:00Z`);
  const to = Date.parse(`${toDate}T00:00:00Z`);
  if (!Number.isFinite(from) || !Number.isFinite(to)) return Number.NaN;
  return Math.round((to - from) / 86400000);
};

export const foreseeableOutlook = (entries, onDate, horizonDays = FORESEEABLE_HORIZON_DAYS) => {
  const today = normalizeString(onDate);
  if (!ISO_DATE.test(today)) return [];
  return normalizeTimeline(entries).filter((entry) => {
    if (!entry.foreseeable) return false;
    if (entry.date <= today) return false;                       // already happened
    if (entry.foreseeableFrom && entry.foreseeableFrom > today) return false; // not announced yet
    const away = daysBetween(today, entry.date);
    return Number.isFinite(away) && away <= horizonDays;
  });
};

// The prompt block for the suggestion board. Deliberately gives the DATE and the
// neutral phrasing and nothing else — no title, no detail, no actors — so the
// model can propose preparing for a thing without being told how it turns out.
export const buildOutlookText = (entries, { playerPolity = "" } = {}) => {
  if (entries.length === 0) return "";
  const player = normalizeString(playerPolity) || "the player's polity";
  return [
    "[Already On The Calendar]",
    `These are publicly known to be coming. Everyone in the world can see them approaching, ${player} included — they are not secrets and not predictions.`,
    ...entries.map((entry) => `- ${entry.date}: ${entry.foreseeable}`),
    "",
    "Use them as something to PREPARE for: what a government would put in motion now so it is ready, what it would hedge against, what opportunity it would position for. Do NOT assume how any of them turns out — a scheduled vote, summit or launch is on the calendar, but its result is not known to anyone yet, and a suggestion that presumes the outcome is worthless. Nothing else about the future is known: propose nothing that depends on knowing an unannounced event in advance.",
  ].join("\n");
};

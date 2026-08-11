/*! Open Historia — acts the player never ordered © 2026 Nicholas Krol, MIT (see src/Editor/LICENSE). */
// THE OTHER HALF OF ACTION BOOKKEEPING.
//
// actionCoverage asks: did every queued order get an event? Nothing asked the
// reverse — is every event in which the PLAYER'S polity gains ground backed by
// an order? Measured on gemma4-oh:12b before this existed: with the player's
// only order being "reinforce the Westwall", the model invaded Poland twelve
// times out of twelve, with [Player Agency] in the prompt AND the sovereignty
// contract injected (docs/analysis/cell-ab-2026-08-11.md). Prompt-side wording
// is exhausted; this is rule #2 — the engine checks rather than asks.
//
// SCOPE IS DELIBERATELY NARROW: only events whose impacts ADVANCE the player —
// a region transferred TO them, a unit spawned FOR them. Those are the two ways
// the historical rails actually rewrite the map (an invasion is transfers, a
// mobilisation is spawns). An unordered act that is only narration violates the
// same contract but breaks nothing the player cannot argue with; starting wider
// would mean more false drops, and a wrongly dropped event costs the player
// more than a wrongly kept one.
//
// TWO EXEMPTIONS, both free — and deliberately not a third:
//   · the event lists actionIds — it claims an order, and whether that claim is
//     honest is actionCoverage's department, not this one's;
//   · nothing advances the player — nothing to audit.
//
// A bigram-containment exemption ("the event's text matches a queued order, so
// it is authorized") was built, measured, and REMOVED. Containment grows with
// haystack length, so the longer the event text, the more of a short unrelated
// order it appears to contain: "Reinforce the Westwall" scored 0.526 against a
// one-line Poland invasion and 0.632 against the same invasion with one more
// clause — past every threshold actionCoverage uses. actionCoverage can live
// with that shape because its over-match wrongly RESOLVES an order (annoying,
// recoverable); here the same over-match wrongly AUTHORIZES an invasion, which
// is the exact failure this pass exists to stop, silently waved through by its
// own front door. So every advancing event without actionIds goes to the model
// pass. One small call per affected jump buys soundness in the direction that
// matters, and the pass's own tie-break still keeps everything it is unsure of.
//
// What survives the exemptions goes to a small flat pass (the 12B pattern) that
// answers ordered / reaction / unordered per event. Only "unordered" drops, and
// the drop removes the WHOLE event — text and impacts together, so narration
// and world state stay in agreement (rule #3) — with its name printed to the
// console (rule #1).


const normalizeString = (value) => String(value ?? "").trim();
const normalizeArray = (value) => (Array.isArray(value) ? value : []);
const keyOf = (value) => normalizeString(value).toLowerCase();

/**
 * The ways this event advances the player, named so the console line and the
 * audit prompt can say what is at stake. Empty when nothing advances them.
 */
export const advancingImpacts = (event, playerKeys) => {
  const impacts = event?.impacts ?? {};
  const gains = [];
  for (const transfer of normalizeArray(impacts.regionTransfers)) {
    const receiver = [transfer?.toCode, transfer?.toName].map(keyOf).filter(Boolean);
    if (receiver.some((value) => playerKeys.has(value))) {
      gains.push(`region → ${normalizeString(transfer?.regionName) || normalizeString(transfer?.regionId) || "?"}`);
    }
  }
  for (const op of normalizeArray(impacts.unitOps)) {
    if (keyOf(op?.op) === "spawn" && playerKeys.has(keyOf(op?.unit?.ownerCode))) {
      gains.push(`unit spawn ${normalizeString(op?.unit?.name) || "(unnamed)"}`);
    }
  }
  return gains;
};

/**
 * Events that advance the player with no visible authorization. Pure and cheap:
 * everything here is string work, so a turn with a clean slate pays nothing.
 *
 * Returns [{ index, id, title, description, gains }] against the EXACT event
 * array passed in — the caller drops by index, so it must not reorder between
 * calling this and acting on the verdicts.
 */
export const findUnorderedPlayerActs = ({ events, playerNames }) => {
  const playerKeys = new Set(normalizeArray(playerNames).map(keyOf).filter(Boolean));
  if (playerKeys.size === 0) return [];

  const candidates = [];
  for (let index = 0; index < normalizeArray(events).length; index += 1) {
    const event = events[index];
    const gains = advancingImpacts(event, playerKeys);
    if (gains.length === 0) continue;
    if (normalizeArray(event?.impacts?.actionIds).length > 0) continue;
    candidates.push({
      index,
      id: normalizeString(event?.id) || `event-${index + 1}`,
      title: normalizeString(event?.title),
      description: normalizeString(event?.description),
      gains,
    });
  }
  return candidates;
};

/** The user-message half of the audit pass: orders, then the suspect events. */
export const buildAuditMessage = (candidates, actions) => {
  const planned = normalizeArray(actions)
    .filter((action) => action && (normalizeString(action.status) === "planned" || !normalizeString(action.status)));
  const orders = planned.length > 0
    ? planned.map((action) => `- [id: ${normalizeString(action.id)}] ${normalizeString(action.title) || normalizeString(action.text).slice(0, 120)}`)
    : ["(none — the player queued no orders this turn)"];
  return [
    "The player's queued orders this turn:",
    ...orders,
    "",
    "Events in which the player's polity gains ground, none of which names an order:",
    ...candidates.map((candidate) =>
      `- [eventId: ${candidate.id}] ${candidate.title} — ${candidate.description.slice(0, 240)} (gains: ${candidate.gains.join(", ")})`),
    "",
    "Give one verdict per eventId. Return JSON only.",
  ].join("\n");
};

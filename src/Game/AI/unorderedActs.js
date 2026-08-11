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
// THREE EXEMPTIONS, checked in this order, all free:
//   · the event lists actionIds — it claims an order, and whether that claim is
//     honest is actionCoverage's department, not this one's;
//   · the event's text matches a queued order by bigram containment — the same
//     machinery actionCoverage matches with, but at NARRATIVE_MATCH_MIN, not
//     the looser supplemental bar. The two passes carry OPPOSITE risks with the
//     same instrument: over-matching there wrongly RESOLVES an order, while
//     over-matching here wrongly AUTHORIZES an invasion. Measured on the case
//     this pass exists for: "Reinforce the Westwall" scores 0.526 against
//     "Invasion of Poland" — above the 0.5 supplemental bar, below 0.62. An
//     order the bigrams under-score (a detailed one, a Korean one against an
//     English event) just goes to the model pass, whose tie-break keeps;
//   · nothing advances the player — nothing to audit.
//
// What survives the exemptions goes to a small flat pass (the 12B pattern) that
// answers ordered / reaction / unordered per event. Only "unordered" drops, and
// the drop removes the WHOLE event — text and impacts together, so narration
// and world state stay in agreement (rule #3) — with its name printed to the
// console (rule #1).
import {
  NARRATIVE_MATCH_MIN,
  actionNeedle,
  coverageScore,
  eventHaystack,
} from "./actionCoverage.js";

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
export const findUnorderedPlayerActs = ({ events, actions, playerNames }) => {
  const playerKeys = new Set(normalizeArray(playerNames).map(keyOf).filter(Boolean));
  if (playerKeys.size === 0) return [];
  const planned = normalizeArray(actions)
    .filter((action) => action && (normalizeString(action.status) === "planned" || !normalizeString(action.status)));

  const candidates = [];
  for (let index = 0; index < normalizeArray(events).length; index += 1) {
    const event = events[index];
    const gains = advancingImpacts(event, playerKeys);
    if (gains.length === 0) continue;
    if (normalizeArray(event?.impacts?.actionIds).length > 0) continue;
    const haystack = eventHaystack(event);
    const authorized = planned.some(
      (action) => coverageScore(actionNeedle(action), haystack) >= NARRATIVE_MATCH_MIN,
    );
    if (authorized) continue;
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

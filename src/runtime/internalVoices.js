/*! Open Historia — territory-less voices, runtime side © 2026 Nicholas Krol, MIT (see src/Editor/LICENSE). */
// The runtime half of scripts/presets/lib/internalVoices.mjs. That file is the
// build-time roster and the contract text; this one is the two lines the
// running game needs — because a polity whose name starts "Internal:" or
// "Domestic:" is NOT a country, and three separate paths have to agree on that:
//
//   • the chat picker, which groups them apart from the powers,
//   • resolveInvitees in gameplay.js, which must never let the world open a
//     diplomatic chat "from" the player's own war minister,
//   • anything else that walks the polity catalog looking for states.
//
// The NAME is the marker rather than a flag on the row, deliberately: these
// travel through the model, through saves written before the flag existed, and
// through polityChanges the model itself emits, and the prefix survives all
// three. It is also what the simulation rules key off, so the prompt and the
// engine are reading the same signal.
export const VOICE_PREFIXES = ["Internal:", "Domestic:"];

export const isTerritorylessVoiceName = (name) => {
  const text = String(name ?? "").trim();
  return VOICE_PREFIXES.some((prefix) => text.startsWith(prefix));
};

export const isTerritorylessVoice = (polity) =>
  isTerritorylessVoiceName(polity?.name) || polity?.territoryless === true;

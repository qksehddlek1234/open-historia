/*! Open Historia — per-country personality vectors © 2026 Nicholas Krol, MIT (see src/Editor/LICENSE). */
// A country's standing CHARACTER, as five numbers that persist across turns.
//
// Tags already say what a country IS ("socialist, anti-nato"). They do not say how
// it BEHAVES when something happens to it, and that gap is what made the world feel
// arbitrary: the same neighbour would shrug off a border incident one turn and
// mobilise over a smaller one the next, because nothing carried its temperament
// from turn to turn. The model was re-inventing every power's disposition from
// scratch, every jump.
//
// These are deliberately BEHAVIOURAL, not moral — each one answers a question the
// model has to answer anyway when it decides what a country does about an event:
//
//   aggression   Does it reach for force, or for a note of protest?
//   riskTolerance Will it gamble on a bad position, or wait for a safe one?
//   loyalty      Do its commitments hold when they become expensive?
//   expansionism Does it want more land, or only to keep what it has?
//   vengefulness Does a wrong get answered later, or written off?
//
// 0-100, 50 = unremarkable. A country with no stored profile gets one DERIVED from
// its tags and standing rather than a flat 50 across the board: an untagged world
// where every power is identical is exactly the arbitrariness this exists to fix.
// Derivation is deterministic — same country, same tags, same numbers — so a
// profile does not drift every time it is recomputed.

export const PERSONALITY_AXES = [
  { key: "aggression", label: "aggression", short: "aggr", low: "restrained, prefers protest to force", high: "reaches for force early" },
  { key: "riskTolerance", label: "risk tolerance", short: "risk", low: "waits for a safe position", high: "gambles on a bad one" },
  { key: "loyalty", label: "loyalty", short: "loyal", low: "abandons commitments when they cost", high: "honours commitments at a price" },
  { key: "expansionism", label: "expansionism", short: "expand", low: "content with its borders", high: "wants more land" },
  { key: "vengefulness", label: "vengefulness", short: "grudge", low: "writes wrongs off", high: "answers wrongs, however late" },
];

const AXIS_KEYS = PERSONALITY_AXES.map((axis) => axis.key);

export const NEUTRAL_PERSONALITY = Object.fromEntries(AXIS_KEYS.map((key) => [key, 50]));

const clamp = (value) => Math.max(0, Math.min(100, Math.round(value)));

// Only the five known axes, each a clamped integer. Returns null when nothing
// usable is present, so "no profile" stays distinguishable from "a profile of
// zeroes" — the difference between deriving one and pinning a country at pacifist.
export const normalizePersonality = (value) => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const out = {};
  for (const key of AXIS_KEYS) {
    const raw = Number(value[key]);
    if (Number.isFinite(raw)) out[key] = clamp(raw);
  }
  return Object.keys(out).length > 0 ? out : null;
};

// Every axis present, missing ones filled from a base (a partial update merged over
// a country's existing profile, or over the neutral vector).
export const completePersonality = (partial, base = NEUTRAL_PERSONALITY) => {
  const out = {};
  for (const key of AXIS_KEYS) {
    const value = Number(partial?.[key]);
    out[key] = Number.isFinite(value) ? clamp(value) : clamp(Number(base?.[key]) ?? 50);
  }
  return out;
};

// Tag -> axis nudges. Matched as whole words against the country's tag list so
// "anti-militarist" cannot read as "militarist" (see tagMatches).
const TAG_EFFECTS = [
  [/^(militarist|militaristic|martial|warlike|garrison state)$/, { aggression: 22, riskTolerance: 8 }],
  [/^(expansionist|irredentist|revanchist|imperialist|colonial)$/, { aggression: 12, expansionism: 26, vengefulness: 10 }],
  [/^(authoritarian|dictatorship|autocratic|totalitarian|junta|absolutist)$/, { aggression: 10, loyalty: -10, riskTolerance: 6 }],
  [/^(fascist|ultranationalist|nationalist)$/, { aggression: 16, expansionism: 16, vengefulness: 14 }],
  [/^(communist|socialist|marxist|revolutionary)$/, { riskTolerance: 10, expansionism: 6 }],
  [/^(theocratic|fundamentalist)$/, { vengefulness: 12, riskTolerance: 6 }],
  [/^(democratic|liberal|parliamentary|republican)$/, { aggression: -10, loyalty: 14 }],
  [/^(neutral|non-aligned|nonaligned|isolationist|isolationism)$/, { aggression: -16, expansionism: -16, loyalty: -6 }],
  [/^(pacifist|demilitarised|demilitarized|disarmed)$/, { aggression: -26, riskTolerance: -12, expansionism: -14 }],
  [/^(opportunist|opportunistic|pragmatic|mercantile|trading)$/, { loyalty: -12, riskTolerance: 8 }],
  [/^(great power|superpower|hegemon)$/, { riskTolerance: 8, expansionism: 8 }],
  [/^(client state|puppet|satellite|protectorate|vassal)$/, { aggression: -8, loyalty: 16, expansionism: -12 }],
  [/^(occupied|partitioned|dismembered|defeated)$/, { vengefulness: 22, expansionism: 8 }],
  [/^(collapsing|failing|failed state|unstable)$/, { loyalty: -14, riskTolerance: 12 }],
];

const tagMatches = (pattern, tags) => tags.some((tag) => pattern.test(tag));

// Small, STABLE per-country offset so two untagged neighbours are not the same
// country wearing different names. Deterministic on the name (FNV-1a), so a
// profile recomputed next session is identical — a personality that re-rolls
// every load is not a personality.
const nameJitter = (country, axisIndex) => {
  let hash = 0x811c9dc5;
  const source = `${country}#${axisIndex}`;
  for (let i = 0; i < source.length; i += 1) {
    hash ^= source.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return (hash % 17) - 8; // -8..+8
};

// The profile a country has when nobody has written one: its tags and its standing,
// plus that stable jitter. Reputation reads as reliability — a power everyone
// trusts got there by keeping its word, and a pariah by not.
export const derivePersonality = (country, { tags = [], reputation = null } = {}) => {
  const normalizedTags = (Array.isArray(tags) ? tags : [])
    .map((tag) => String(tag ?? "").trim().toLowerCase())
    .filter(Boolean);

  const out = { ...NEUTRAL_PERSONALITY };
  for (const [pattern, effects] of TAG_EFFECTS) {
    if (!tagMatches(pattern, normalizedTags)) continue;
    for (const [key, delta] of Object.entries(effects)) out[key] += delta;
  }

  // Number(null) is 0, and 0 on this scale means PARIAH — so reading an absent
  // reputation through Number() alone handed every country that has never had one
  // recorded (which is most of them, most of the game) a -20 loyalty and +10
  // aggression it never earned. Absent has to stay absent.
  const rep = reputation === null || reputation === undefined || reputation === ""
    ? Number.NaN
    : Number(reputation);
  if (Number.isFinite(rep)) {
    out.loyalty += Math.round((rep - 50) * 0.4);
    out.aggression -= Math.round((rep - 50) * 0.2);
  }

  AXIS_KEYS.forEach((key, index) => {
    out[key] = clamp(out[key] + nameJitter(String(country ?? ""), index));
  });

  return out;
};

// The profile in force for one country: the stored one wins, filled out from the
// derived baseline so a partial write (the AI moved one axis) still answers every
// question. Same shape either way, so no caller has to care which it got.
export const resolveCountryPersonality = (world, country, { tags = [], reputation = null } = {}) => {
  const key = String(country ?? "").trim();
  if (!key) return null;
  const derived = derivePersonality(key, {
    tags,
    reputation: reputation ?? world?.internationalReputation?.[key] ?? null,
  });
  const stored = normalizePersonality(world?.countryPersonalities?.[key]);
  return stored ? completePersonality(stored, derived) : derived;
};

// "aggr 78 · risk 65 · loyal 30 · expand 82 · grudge 60" — the prompt form. Short
// keys on purpose: this line is repeated once per power in play, and the axes are
// explained once in the directive rather than 40 times in the data.
export const formatPersonality = (vector) =>
  PERSONALITY_AXES.map((axis) => `${axis.short} ${clamp(Number(vector?.[axis.key]) ?? 50)}`).join(" · ");

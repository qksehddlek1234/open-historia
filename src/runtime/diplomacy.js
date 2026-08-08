/*! Open Historia — who stands where with the player © 2026 Nicholas Krol, MIT (see src/Editor/LICENSE). */
// THE WORLD HAD OPINIONS AND NOWHERE TO KEEP THEM.
//
// Thirty-six rounds in, this campaign's save held 69 diplomacy events, a
// ledger full of relation-* facts, chats with a dozen governments — and no
// machine-readable answer to "is Japan a friend right now". Every consumer
// improvised: the placement pass called every foreign posting "worth an eye"
// because it could not tell an allied base from a hostile one, the prompt
// re-derived the mood from prose each turn, and the country panel said
// nothing at all.
//
// This store is deliberately PLAYER-CENTRIC: one entry per foreign country,
// describing its standing with the player. That is what every current
// consumer needs, it keeps the store the size of a hand of cards rather than
// an N x N matrix, and third-party pairs can become their own store the day
// something actually reads them.
const normalizeString = (value) => String(value ?? "").trim();

// Ordered from warmest to coldest. Ids are what the model reads and writes;
// labels are what the player sees.
export const RELATION_LEVELS = [
  { id: "allied", score: 2, label: "동맹" },
  { id: "friendly", score: 1, label: "우호" },
  { id: "neutral", score: 0, label: "중립" },
  { id: "tense", score: -1, label: "긴장" },
  { id: "hostile", score: -2, label: "적대" },
];

const BY_ID = new Map(RELATION_LEVELS.map((level) => [level.id, level]));
const BY_LABEL = new Map(RELATION_LEVELS.map((level) => [level.label, level.id]));

// Words the model reaches for that mean one of the five. Unknown stays null —
// "no recorded relation" and "neutral" are different facts, and inventing
// neutrality would overwrite silence with a claim.
const LEVEL_SYNONYMS = {
  ally: "allied", alliance: "allied", 동맹국: "allied",
  friend: "friendly", warm: "friendly", cooperative: "friendly", partner: "friendly",
  cool: "tense", strained: "tense", rival: "tense", 경쟁: "tense",
  enemy: "hostile", war: "hostile", adversary: "hostile", 적국: "hostile",
};

export const normalizeRelationLevel = (value) => {
  const raw = normalizeString(value).toLowerCase();
  if (!raw) return null;
  if (BY_ID.has(raw)) return raw;
  const byLabel = BY_LABEL.get(normalizeString(value));
  if (byLabel) return byLabel;
  return LEVEL_SYNONYMS[raw] ?? null;
};

export const relationLabel = (level) => BY_ID.get(normalizeRelationLevel(level))?.label ?? "";
export const relationScore = (level) => BY_ID.get(normalizeRelationLevel(level))?.score ?? 0;

const MAX_NOTE_CHARS = 120;
const MAX_RELATIONS = 200;

// { "<country name>": { level, updated, note } } — the key is the country NAME,
// the same namespace every other owner field uses.
export const normalizeDiplomaticRelations = (value) => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const entries = {};
  for (const [rawName, rawEntry] of Object.entries(value)) {
    const name = normalizeString(rawName);
    const level = normalizeRelationLevel(rawEntry?.level ?? rawEntry);
    if (!name || !level) continue;
    entries[name] = {
      level,
      updated: normalizeString(rawEntry?.updated),
      ...(normalizeString(rawEntry?.note) ? { note: normalizeString(rawEntry.note).slice(0, MAX_NOTE_CHARS) } : {}),
    };
    if (Object.keys(entries).length >= MAX_RELATIONS) break;
  }
  return entries;
};

// The relation the map should treat as standing between the player and this
// country. null means genuinely unrecorded, which callers must keep distinct
// from neutral.
export const getRelation = (relations, country) => {
  const name = normalizeString(country);
  if (!name || !relations || typeof relations !== "object") return null;
  return relations[name]?.level ?? null;
};

// Fold one turn's reports into the standing store. Reports are ABSOLUTE — the
// level as it now stands, never a delta — mirroring the stat pass, and for the
// same reason: a 12B writes "friendly" far more reliably than "+1".
//
// resolveName is injected (toCountryName) rather than imported so this module
// stays dependency-free and testable; identity is the fallback.
export const applyRelationReports = (existing, reports, {
  date = "",
  playerName = "",
  resolveName = (name) => name,
} = {}) => {
  const entries = { ...normalizeDiplomaticRelations(existing) };
  const moved = [];
  const dropped = [];
  const player = normalizeString(playerName);
  for (const row of Array.isArray(reports) ? reports : []) {
    const rawName = normalizeString(row?.country ?? row?.name ?? row?.code);
    const name = normalizeString(resolveName(rawName)) || rawName;
    const level = normalizeRelationLevel(row?.level);
    if (!rawName) { dropped.push({ country: "(blank)", why: "no country named" }); continue; }
    if (!level) { dropped.push({ country: rawName, why: `"${normalizeString(row?.level)}" is not a relation level` }); continue; }
    if (player && name === player) { dropped.push({ country: rawName, why: "that is the player" }); continue; }
    const prior = entries[name]?.level ?? null;
    if (prior === level) continue; // a restatement of what already stands is not a move
    entries[name] = {
      level,
      updated: normalizeString(date),
      ...(normalizeString(row?.note) ? { note: normalizeString(row.note).slice(0, MAX_NOTE_CHARS) } : {}),
    };
    moved.push({ country: name, from: prior, to: level });
  }
  return { entries, moved, dropped };
};

// The prompt block: warm to cold, one line each, so the model narrates the
// world it is actually in rather than re-deriving the mood from prose.
export const buildRelationsText = (relations) => {
  const entries = Object.entries(normalizeDiplomaticRelations(relations));
  if (entries.length === 0) return "";
  return entries
    .sort((a, b) => relationScore(b[1].level) - relationScore(a[1].level) || a[0].localeCompare(b[0]))
    .map(([name, entry]) => `- ${name}: ${entry.level} (${relationLabel(entry.level)})${entry.note ? ` — ${entry.note}` : ""}`)
    .join("\n");
};

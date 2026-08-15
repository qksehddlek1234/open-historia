/*! Open Historia — what is true now, as a ledger © 2026 Nicholas Krol, MIT (see src/Editor/LICENSE). */
import { stripVoiceLabels } from "./machineSyntax.js";
// THE STORY SO FAR GREW AND NEVER SHRANK.
//
// Every few rounds the engine asks the model to write a prose summary of the
// events since the last one, and APPENDS it to world.consolidatedHistory. The
// prompt then carries all of them, every turn, forever. Measured on this
// campaign at round 27: eleven entries, 11,259 characters, ~7,000 tokens — 35%
// of a 20,960 budget, growing 150-200 tokens a round and never falling. At the
// rate it was going, round 50 leaves less room for the answer than for the
// history.
//
// The reason it only grows is that prose has no key. "문재인 대통령 취임" written
// in round 12 is still sitting there in round 27 next to "황교안 권한대행 체제"
// from round 8, because nothing can tell the engine that the second REPLACED the
// first. A ledger can: each fact has a key, and a later turn updates the key
// rather than adding a paragraph.
//
// So the size of this is the number of things that are true, not the number of
// turns that have passed. A campaign that runs for two hundred rounds and ends
// with forty standing facts carries forty lines.
const normalizeString = (value) => String(value ?? "").trim();
const normalizeArray = (value) => (Array.isArray(value) ? value : []);

// A key is a slug the model has to be able to reproduce next time so the update
// lands on the right row. Lowercased, punctuation collapsed — "Leader: South
// Korea", "leader/south-korea" and "leader:south_korea" are one key.
export const ledgerKey = (value) => normalizeString(value)
  .toLowerCase()
  .replace(/[^\p{L}\p{N}]+/gu, "-")
  .replace(/^-+|-+$/g, "")
  .slice(0, 64);

// What a fact is allowed to be about. Not enforced — an unknown topic is kept —
// but offered to the model so the keys it invents cluster instead of sprawling.
export const LEDGER_TOPICS = ["leader", "territory", "treaty", "war", "programme", "relation", "crisis", "economy"];

// One line of fact. Longer than this is a paragraph, and a paragraph is what
// this exists to stop.
const MAX_FACT_CHARS = 220;

// The ledger is bounded by facts rather than turns, but a model that invents a
// new key for every event would defeat that, so there is still a ceiling. When
// it is hit the OLDEST-UPDATED rows go: a fact nothing has touched in fifty
// rounds is either settled background or no longer true.
export const MAX_LEDGER_ENTRIES = 60;

// THE TOPIC IS ALREADY IN THE KEY.
//
// Audited at round 30: 14 of 21 standing facts carried no topic at all, so
// buildLedgerText filed two thirds of the ledger under "other" and the grouping
// it exists for did nothing. Every one of those 14 had its topic sitting right
// there as the key prefix — relation-kr-us, programme-smr-hydrogen,
// leader-south-korea. Asking the model again for something it has already said
// is the wrong move; reading it off the key is free and exact.
// The model also coins prefixes that MEAN one of the topics — the live ledger
// held policy-k-growth-2030, security-k-shield-protocol, defense-seomgang-
// protocol and trade-hydrogen-alliance, all filed under "other" for want of an
// exact match. Each maps cleanly; an unrecognized prefix still returns "".
const TOPIC_SYNONYMS = {
  policy: "programme", plan: "programme", project: "programme",
  security: "programme", defense: "programme", defence: "programme",
  trade: "economy", diplomacy: "relation", alliance: "relation",
};
const topicFromKey = (key) => {
  const prefix = normalizeString(key).split("-")[0];
  if (LEDGER_TOPICS.includes(prefix)) return prefix;
  return TOPIC_SYNONYMS[prefix] ?? "";
};

export const normalizeLedgerEntry = (entry) => {
  if (!entry || typeof entry !== "object") return null;
  const key = ledgerKey(entry.key || entry.id || entry.subject);
  const fact = normalizeString(entry.fact || entry.value || entry.text || entry.summary);
  if (!key || !fact) return null;
  return {
    key,
    topic: ledgerKey(entry.topic) || topicFromKey(key),
    // Same feedback path as an event's prose: a ledger fact is quoted back
    // into every later prompt (gameState.js), so a staged advisor label would
    // be re-supplied forever. See machineSyntax.stripVoiceLabels.
    fact: stripVoiceLabels(fact).slice(0, MAX_FACT_CHARS),
    since: normalizeString(entry.since),
    updated: normalizeString(entry.updated || entry.date || entry.since),
  };
};

export const normalizeLedger = (value) => {
  const byKey = new Map();
  for (const raw of normalizeArray(value)) {
    const entry = normalizeLedgerEntry(raw);
    if (!entry) continue;
    // Later wins, and keeps the earlier row's `since` — when a fact first became
    // true is part of the fact, and an update should not erase it.
    const prior = byKey.get(entry.key);
    byKey.set(entry.key, prior ? { ...entry, since: prior.since || entry.since } : entry);
  }
  return [...byKey.values()];
};

// Fold this consolidation's facts into the standing ones. A key already present
// is REPLACED, which is the whole point — 문재인 취임 overwrites 황교안 권한대행
// rather than sitting beside it.
//
// An entry whose fact is exactly "-" retires the key: something that was true
// and now is not (a treaty torn up, a war ended) should leave rather than
// linger, and the model needs a way to say so.
export const mergeLedger = (existing, incoming, { date = "" } = {}) => {
  const byKey = new Map(normalizeLedger(existing).map((entry) => [entry.key, entry]));
  const retired = [];
  const added = [];
  const changed = [];
  for (const raw of normalizeArray(incoming)) {
    const entry = normalizeLedgerEntry(raw);
    if (!entry) continue;
    if (entry.fact === "-" || entry.fact === "—") {
      if (byKey.delete(entry.key)) retired.push(entry.key);
      continue;
    }
    const prior = byKey.get(entry.key);
    const next = {
      ...entry,
      since: prior?.since || entry.since || date,
      updated: entry.updated || date,
    };
    if (!prior) added.push(entry.key);
    else if (prior.fact !== next.fact) changed.push(entry.key);
    byKey.set(entry.key, next);
  }

  let entries = [...byKey.values()];
  const dropped = [];
  if (entries.length > MAX_LEDGER_ENTRIES) {
    // Oldest-updated first. Ties keep insertion order, so a batch that all
    // arrived on one date is thinned from the front rather than arbitrarily.
    const ranked = entries.map((entry, index) => ({ entry, index }))
      .sort((a, b) => (a.entry.updated === b.entry.updated
        ? a.index - b.index
        : String(a.entry.updated).localeCompare(String(b.entry.updated))));
    for (const { entry } of ranked.slice(0, entries.length - MAX_LEDGER_ENTRIES)) dropped.push(entry.key);
    const gone = new Set(dropped);
    entries = entries.filter((entry) => !gone.has(entry.key));
  }
  return { added, changed, dropped, entries, retired };
};

// Grouped by topic so the model reads it as state rather than as a list, and
// sorted inside each group by when it last moved — what changed recently is what
// a turn is most likely to need.
export const buildLedgerText = (value) => {
  const entries = normalizeLedger(value);
  if (entries.length === 0) return "";
  const byTopic = new Map();
  for (const entry of entries) {
    const topic = entry.topic || "other";
    if (!byTopic.has(topic)) byTopic.set(topic, []);
    byTopic.get(topic).push(entry);
  }
  const order = [...LEDGER_TOPICS, ...[...byTopic.keys()].filter((topic) => !LEDGER_TOPICS.includes(topic)).sort()];
  const lines = [];
  for (const topic of order) {
    const group = byTopic.get(topic);
    if (!group) continue;
    group.sort((a, b) => String(b.updated).localeCompare(String(a.updated)));
    lines.push(`[${topic}]`);
    for (const entry of group) {
      const when = entry.since && entry.since !== entry.updated
        ? ` (${entry.since} → ${entry.updated})`
        : (entry.updated ? ` (${entry.updated})` : "");
      lines.push(`• ${entry.key}: ${entry.fact}${when}`);
    }
  }
  return lines.join("\n");
};

// TWO KEYS, ONE SUBJECT.
//
// The key is what stops a fact being restated forever, and it only works when
// the model reuses it. Audited at round 30, on a ledger of 21:
//
//   programme-smr-hydrogen  "사우디, UAE와 연계한 수소 경제 및 SMR 파트너십"
//   trade-hydrogen-alliance "사우디아라비아, UAE와 협력하는 수소 경제 파트너십"
//
//   programme-regional-balance "강원·경상 지역 중심의 양자/AI 특구 및 인력 육성"
//   policy-k-growth-2030       "강원, 경상 지역 양자 및 AI 기술 인력 육성 특별법"
//
// — plus three overlapping K-Shield entries and three overlapping AI-defence
// ones. The cause is known and now fixed elsewhere: the [Standing Facts Now]
// block, which shows the model the keys that already exist, was being dropped
// before it reached the prompt, so every consolidation invented keys blind.
//
// This does not merge them, because deciding which of two facts is the truer one
// is a judgement, not a string operation. It NAMES them — in the console, and in
// the next consolidation's prompt, where the model can retire one with "-".
const LEDGER_FILLER = new Set([
  "the", "of", "and", "for", "a", "an",
  "기반", "관련", "지속", "강화", "구축", "확대", "유지", "추진", "진행", "중심", "협력", "체계",
  "시스템", "네트워크", "프로그램", "정책", "지역", "국가", "핵심", "주요", "기술", "및",
]);

const factWords = (fact) => new Set(
  normalizeString(fact)
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .split(" ")
    .filter((word) => word.length > 1 && !LEDGER_FILLER.has(word)),
);

// Two distinguishing words in common. The same bar the marker-merge and
// related-events passes use on names, measured on the same campaign's prose.
const NEAR_DUPLICATE_MIN_SHARED = 2;

export const findLedgerNearDuplicates = (value) => {
  const entries = normalizeLedger(value);
  const words = entries.map((entry) => factWords(entry.fact));
  const pairs = [];
  for (let i = 0; i < entries.length; i += 1) {
    for (let j = i + 1; j < entries.length; j += 1) {
      let shared = [];
      for (const word of words[i]) if (words[j].has(word)) shared.push(word);
      if (shared.length >= NEAR_DUPLICATE_MIN_SHARED) {
        pairs.push({ keys: [entries[i].key, entries[j].key], shared });
      }
    }
  }
  return pairs;
};

export const buildNearDuplicateText = (value) => {
  const pairs = findLedgerNearDuplicates(value);
  if (pairs.length === 0) return "";
  return pairs.map(({ keys }) => `• ${keys[0]} / ${keys[1]}`).join("\n");
};

// WHO LEADS IS NOT THE MODEL'S TO GUESS.
//
// leader-south-korea has read "대한민국 정부" — the South Korean government — from
// the day it was first written, while the country's own stat sheet says 문재인.
// It was never degraded; it was born vague, and then rode in every prompt for
// three rounds as the campaign's word on who is in charge.
//
// The game already knows the answer. Where it does, the ledger states it.
export const repairLeaderFacts = (entries, leadersByCountry = {}, { date = "" } = {}) => {
  let next = normalizeLedger(entries);
  const repaired = [];
  for (const [country, leader] of Object.entries(leadersByCountry)) {
    const name = normalizeString(leader);
    const slug = ledgerKey(country);
    if (!name || !slug) continue;
    const key = `leader-${slug}`.slice(0, 64);
    const existing = next.find((entry) => entry.key === key);
    // Person-level freshness, not substring: the sheet now says "대통령 박근혜"
    // while an older fact may say "박근혜 대통령, 2013 취임" — same person, and
    // rewriting it every consolidation would churn the ledger forever. The fact
    // is current when every token of the sheet's name appears in it.
    const fresh = existing && name.split(/\s+/).every((part) => existing.fact.includes(part));
    if (fresh) continue;
    // Keep whatever context the model added — a government type, a date — and
    // put the name in front of it, rather than throwing its sentence away.
    const trailing = existing && !existing.fact.includes(name) ? ` (${existing.fact})` : "";
    const fact = `${name}${trailing}`.slice(0, MAX_FACT_CHARS);
    if (existing) {
      next = next.map((entry) => (entry.key === key ? { ...entry, fact, topic: "leader" } : entry));
    } else {
      next = [...next, { key, topic: "leader", fact, since: date, updated: date }];
    }
    repaired.push(key);
  }
  return { entries: next, repaired };
};

// Roughly what this costs in the prompt. Korean runs ~1.6 characters per token
// in this engine's own estimate, which is what the budget line uses.
export const ledgerTokenEstimate = (value) => Math.round(buildLedgerText(value).length / 1.6);

/*! Open Historia — the model's own syntax, out of the player's text © 2026 Nicholas Krol, MIT (see src/Editor/LICENSE). */
// JSON PUNCTUATION IS NOT PROSE, AND THE SALVAGE STACK MANUFACTURES IT.
//
// runJsonTask exists to rescue a good answer wrapped in bad syntax — lenient
// parsing, truncation repair, schema coercion, patch-merge. Those layers save
// whole turns, and the price is that when they mis-guess a string boundary the
// wreckage lands INSIDE a field, reading as text. Two shapes have now reached a
// live game, and they need different repairs:
//
//   TRAILING    "…강력한 보안 조치",[actionIds
//               The tail of the next key, glued to the end. Nothing follows it,
//               so it is cut.
//
//   GLUED       "원격지 정밀 타격 모의 훈련", "text": "실제 발사 없이도 …"
//               TWO FIELDS FUSED INTO ONE. Measured on this campaign: 1 of 520
//               orders, and the player submitted it, so it rode in the prompt as
//               a title 111 characters long with a JSON key in the middle of it.
//               Cutting here would throw away the second field's content, which
//               is real prose the player wrote or was shown — so this one is
//               SPLIT, not stripped.
//
// The distinction is the whole point of this file. "Don't lose everything
// because of one thing" cuts both ways: don't keep the wreckage, and don't
// discard the writing that was tangled up in it.
import { VOICE_PREFIXES } from "./internalVoices.js";

const normalizeString = (value) => String(value ?? "").trim();

// A quote followed by structural punctuation and an optional key, at the END.
export const TRAILING_SCAR = /["'`]\s*[,[\]{}:]+\s*(?:[A-Za-z_][A-Za-z0-9_]*)?\s*$/;

// AN ADVISOR'S SYSTEM LABEL, ON STAGE.
//
// "Internal:" and "Domestic:" are the engine's marker for a polity that is an
// office inside the player's own government rather than a country — the NAME is
// the flag (runtime/internalVoices.js). The measured failure (PC 11차, voices ×
// catalyst): asked to write a branching scene, the model casts those offices as
// characters, and with the voices contract loaded it stages them under the raw
// prefix — "Internal: Head of Military이 지도를 짚었다". Four of that arm's six
// violations carried the prefix verbatim.
//
// The prefix is machine syntax by every definition this file uses: it is OUR
// string, it means something to the engine and nothing to a reader, and it is
// printed in the middle of the player's prose. So it comes out and the words
// stay — the same trade as a region id in brackets. What it deliberately does
// NOT do is decide whether an advisor belongs in a scene at all: that is a
// judgement about fiction, it lives in the contract text, and a regex that
// tried to enforce it would delete real sentences.
export const VOICE_LABEL_IN_PROSE = new RegExp(
  `(^|[\\s(（"'‘“\\[「『])(?:${VOICE_PREFIXES.map((prefix) => prefix.replace(/:$/, "")).join("|")})\\s*:\\s*`,
  "g",
);

// A region id in brackets — "강원(KOR.6_1)" — which means nothing to a reader.
// Also the LIST form the live save turned out to hold: "강원과 경상도(KOR.9_1,
// KOR.10_1)" — one paren group, several ids, nothing else inside.
export const REGION_ID_IN_PROSE = /\s*[(（]\s*[A-Z]{2,3}[.\-]\d+(?:_\d+)?(?:\s*[,、]\s*[A-Z]{2,3}[.\-]\d+(?:_\d+)?)*\s*[)）]/g;

// The id-first form: "KOR.6_1(강원도)" — the NAME is in the parens and the id in
// front of it. Keep the name, drop the id; runs BEFORE the paren strip above or
// the name would go down with the brackets. The inner group must not itself be
// an id (that is the list form) and stays short enough to be a place name.
export const REGION_ID_WITH_NAME = /\b[A-Z]{2,3}[.\-]\d+(?:_\d+)?\s*[(（]\s*(?![A-Z]{2,3}[.\-]\d)([^()（）,、]{1,24}?)\s*[)）]/g;

// A bare id loose in prose: "KOR.1_1, KOR.8_1 인근에". The underscore part is
// REQUIRED here, unlike in the bracketed forms — "AI.5" or "Web2.0" must never
// match, and every real GADM level-1 id carries the _N suffix.
export const BARE_REGION_ID = /\b[A-Z]{2,3}\.\d+_\d+\b/g;

// The strip form eats the separator that carried the id: "강원도, KOR.9_1,
// KOR.10_1 지역에" must come out "강원도 지역에", not "강원도, 지역에" — the
// comma belonged to the list the ids formed, and dies with them.
const SEPARATED_BARE_ID = /\s*[,、]?\s*(?<![A-Za-z])[A-Z]{2,3}\.\d+_\d+(?!\w)/g;

// What stripping a bare id leaves behind: "KOR.1_1, KOR.8_1 인근에" becomes
// ", 인근에" without this. Orphaned separators are collapsed and a leader comma
// is cut.
const tidySeparators = (value) => value
  .replace(/\s*[,、]\s*(?=[,、])/g, "")
  .replace(/(^|[\s(（])[,、]\s*/g, "$1")
  .replace(/\s*[,、]\s*(?=$|[)）.!?])/g, "");

// `…", "text": "…` — a closing quote, a comma, a quoted key, a colon, an opening
// quote. Deliberately strict: it must have ALL of those parts, because a Korean
// sentence containing a quoted phrase and a colon is ordinary writing and must
// not be torn in half. The key is captured so a caller can tell which field was
// glued on.
export const GLUED_FIELD = /["'`]\s*,\s*["'`](\w{2,24})["'`]\s*:\s*["'`]/;

// A HALF-TRANSLATED PLACE NAME.
//
// The region catalog names regions the way GADM romanizes them — "Gangwon-do",
// "Gyeonggi-do", "Jeollanam-do" — while the prompt asks for region names in the
// player's own language inside prose. A model doing both at once translates the
// stem and leaves the suffix: 강원-do reached a live order, and since EVERY
// Korean province in the catalog ends in -do, the shape recurs by construction
// rather than by accident.
//
// Only fires when the stem is Hangul and a hyphen separates it from a known
// administrative suffix, so an English name is never touched and neither is an
// ordinary hyphenated Korean phrase. "ri" is deliberately left out: two letters
// is too small a target to be sure of.
const ROMANIZED_SUFFIX = {
  do: "도", si: "시", gun: "군", gu: "구", eup: "읍", myeon: "면", dong: "동",
};
export const HALF_ROMANIZED = /([가-힣]+)\s*-\s*(do|si|gun|gu|eup|myeon|dong)\b/gi;

export const repairHalfRomanized = (value) =>
  String(value ?? "").replace(
    HALF_ROMANIZED,
    (whole, stem, suffix) => `${stem}${ROMANIZED_SUFFIX[suffix.toLowerCase()] ?? ""}` || whole,
  );

// The voice rule ALONE, for prose the full scrubber does not own.
//
// Event titles and descriptions, consolidation summaries and ledger facts are
// not put through stripMachineSyntax (that is the ACTION path), and changing
// that wholesale is a different decision than this one. But they are the
// feedback loop the PC lane found: whatever lands in an event's prose is
// re-fed to every later prompt as history, so a voice named once is named
// forever. This closes that loop without touching how region ids are handled
// in event text, which stays an open question with its own measurement.
export const stripVoiceLabels = (value) => {
  const before = normalizeString(value);
  if (!before) return before;
  const next = before.replace(VOICE_LABEL_IN_PROSE, "$1").replace(/\s{2,}/g, " ").trim();
  return next || before;
};

export const stripMachineSyntax = (value) => {
  const before = normalizeString(value);
  if (!before) return before;
  const next = tidySeparators(
    repairHalfRomanized(before)
      .replace(REGION_ID_WITH_NAME, "$1")
      .replace(TRAILING_SCAR, "")
      .replace(REGION_ID_IN_PROSE, "")
      .replace(VOICE_LABEL_IN_PROSE, "$1")
      .replace(SEPARATED_BARE_ID, " "),
  )
    .replace(/\s{2,}/g, " ")
    .trim();
  // A field it would eat entirely is worse than a scarred one: a marker with no
  // name is dropped downstream, and an order with no title reads as blank.
  return next || before;
};

// Split a fused pair. Returns null when there is nothing fused, or when either
// half would come out empty — half a repair is worse than none.
export const splitGluedFields = (value) => {
  const text = normalizeString(value);
  const match = GLUED_FIELD.exec(text);
  if (!match) return null;
  const head = stripMachineSyntax(text.slice(0, match.index));
  const tail = normalizeString(text.slice(match.index + match[0].length))
    .replace(/["'`]\s*$/, "")
    .trim();
  if (!head || !tail) return null;
  return { head, tail, key: match[1] };
};

// THE ORDER-SHAPED REPAIR.
//
// An order carries a short title and a body, and the glue lands between them, so
// the head is the title and the tail is the body. Whatever body the record
// already had is KEPT — it is real writing too, and on the live case it turned
// out to belong to a second order the same salvage had swallowed. Losing it
// quietly would be the failure this whole file is about.
// Same words, different skin: "Quantum-Trace" vs "Quantum_Trace", a stray
// comma, doubled spaces. The exact-equality check below called those two
// DIFFERENT texts and concatenated them — a live suggestion reached the queue
// saying its whole paragraph twice, one hyphen apart. Compared with all
// punctuation and spacing stripped, they are the same writing.
export const collapseForCompare = (value) =>
  normalizeString(value).toLowerCase().replace(/[^0-9a-z\uac00-\ud7a3]+/g, "");

// A WHOLE RECORD FUSED INTO ONE FIELD.
//
// Round 43 escalated the glued-field disease past a single split: an event
// arrived titled 동남아 대상 양자 기술 포용 협력 선언", "note": "…",
// "description": "…", "importance": "major", "kind": "diplomacy",
// "playerRelated":true,"impacts":{"regionTransfers":,"markerOps — six fields
// deep — and a marker was BUILT under the name PQC 표준화 연구 센터", "kind":
// "research center", "ownerCode": …, "lng": 127.31, …. One cut cannot repair
// these, so the fused tail is walked field by field: the caller keeps the head
// as the display string and harvests the fields the salvage welded on (the
// prose above all — losing it is the failure this file exists to prevent).
//
// The walker is lenient about what follows each key because the fusion exists
// precisely because the JSON was malformed: quoted prose, a bare number or
// boolean, or the cut-off stump of an object all occur in the wild. Values
// reach the caller as trimmed strings; a stump like {"regionTransfers": is
// nobody's prose and simply never gets picked up by a consumer.
const FIELD_BOUNDARY = /["'`]{0,3}\s*,\s*["'`](\w{2,24})["'`]\s*:\s*["'`]?/g;

export const repairGluedRecord = (value) => {
  const text = normalizeString(value);
  // The FIRST boundary must be the strict quoted form (GLUED_FIELD), so a
  // Korean sentence with an ordinary comma and colon is never torn up; only
  // once a real fusion is established does the lenient walker take over.
  const first = GLUED_FIELD.exec(text);
  if (!first) return null;
  const head = stripMachineSyntax(text.slice(0, first.index));
  if (!head) return null;
  const fields = {};
  const keys = [];
  let currentKey = first[1];
  let cursor = first.index + first[0].length;
  const commit = (raw) => {
    if (!currentKey || currentKey in fields) return;
    const cleaned = normalizeString(raw)
      .replace(/^\s*["'`]{1,3}/, "")
      .replace(/["'`]{1,3}\s*$/, "")
      .replace(/[\s,:{[]+$/, "")
      .trim();
    fields[currentKey] = cleaned;
    keys.push(currentKey);
  };
  FIELD_BOUNDARY.lastIndex = cursor;
  let match;
  while ((match = FIELD_BOUNDARY.exec(text))) {
    commit(text.slice(cursor, match.index));
    currentKey = match[1];
    cursor = FIELD_BOUNDARY.lastIndex;
  }
  commit(text.slice(cursor));
  return { head, fields, keys };
};

// The prose a fused record was carrying, if any: the body-like field first,
// the annotation as the fallback. Machine fields (kind, importance, ids,
// coordinates) are deliberately NOT prose and never come back from here.
export const gluedRecordProse = (record) => normalizeString(
  record?.fields?.text ?? record?.fields?.description ?? record?.fields?.content
  ?? record?.fields?.body ?? record?.fields?.note ?? "");

// Merge recovered prose with what a record already carries: near-equal copies
// collapse to the more complete one, genuinely different writings BOTH survive.
export const mergeRecoveredProse = (existing, recovered) => {
  const base = normalizeString(existing);
  const extra = normalizeString(recovered);
  if (!extra) return base;
  if (!base) return extra;
  if (collapseForCompare(base) === collapseForCompare(extra)) {
    return base.length > extra.length ? base : extra;
  }
  return `${extra}\n\n${base}`;
};

export const repairGluedAction = ({ title = "", text = "" } = {}) => {
  const record = repairGluedRecord(title);
  if (!record) return null;
  const existing = normalizeString(text);
  const tail = gluedRecordProse(record);
  // No prose in the tail (a machine-field-only fusion): the head is still the
  // real title, and whatever body the record already had is kept.
  if (!tail) return { title: record.head, text: existing, key: record.keys[0] ?? "" };
  return { title: record.head, text: mergeRecoveredProse(existing, tail), key: record.keys[0] ?? "" };
};


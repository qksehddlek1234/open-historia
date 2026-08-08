/*! Open Historia — the events a thing on the map appears in © 2026 Nicholas Krol, MIT (see src/Editor/LICENSE). */
// WHAT HAPPENED HERE.
//
// The original's info panels answer this for every feature you click, and it is
// the question a player actually has: they see a structure called 말라카 양자
// 보안 거점 on the map and want to know which turn founded it and what has
// happened to it since. Country and region panels each grew their own version of
// the lookup; this is the one both of those and the two map popups now share.
//
// Three ways an event is about a thing on the map, in descending confidence:
//
//   1. It carries an op naming it. Exact — no text matching involved, and it is
//      how the founding event is always found.
//   2. It names it outright in the title or the description.
//   3. It names the PLACE it is in, for a structure whose name carries one.
//
// Only the first two are used for a structure or a unit; the third belongs to the
// region panel, where the subject IS the place. Ordering is newest first, because
// what happened to this thing recently is the question far more often than what
// founded it years ago.
const normalizeString = (value) => String(value ?? "").trim();
const normalizeArray = (value) => (Array.isArray(value) ? value : []);

// Words too generic to identify anything on their own. A structure called
// "국가 전략 통합 센터" must not match every event containing 전략.
const FILLER = new Set([
  "the", "of", "and", "for", "new", "phase", "ii", "iii",
  "센터", "단지", "기지", "시설", "구역", "허브", "거점", "체계", "시스템",
  "네트워크", "플랫폼", "통합", "기반", "강화", "구축", "관리", "제어", "지원",
  "국가", "전략", "핵심", "차세대", "지역", "사업", "정책",
]);

const wordsOf = (value) => normalizeString(value)
  .toLowerCase()
  .replace(/[^\p{L}\p{N}]+/gu, " ")
  .split(" ")
  .filter((word) => word.length > 1 && !FILLER.has(word));

const opsNaming = (event, { id, name }) => {
  const wantedId = normalizeString(id);
  const wantedName = normalizeString(name).toLowerCase();
  for (const key of ["markerOps", "unitOps"]) {
    for (const op of normalizeArray(event?.impacts?.[key])) {
      const subject = op?.marker ?? op?.unit ?? op;
      if (wantedId && (normalizeString(op?.markerId) === wantedId || normalizeString(op?.unitId) === wantedId
        || normalizeString(subject?.id) === wantedId)) return true;
      const named = normalizeString(subject?.name ?? op?.name ?? op?.newName).toLowerCase();
      if (wantedName && named && named === wantedName) return true;
    }
  }
  return false;
};

// THE WHOLE NAME, OR ENOUGH OF IT TO BE THAT THING.
//
// A structure's name is a phrase rather than a word, and the events paraphrase
// it — "말라카 양자 보안 거점" is written about as "말라카 해상 보안" — so an
// exact substring finds only the founding event. Two distinguishing words is the
// same bar the duplicate-merge pass uses on names, measured on the same data.
const namedInText = (event, name) => {
  const haystack = `${normalizeString(event?.title)} ${normalizeString(event?.description)}`.toLowerCase();
  if (!haystack) return false;
  const needle = normalizeString(name).toLowerCase();
  if (needle && haystack.includes(needle)) return true;
  const words = wordsOf(name);
  if (words.length === 0) return false;
  let shared = 0;
  for (const word of words) if (haystack.includes(word)) shared += 1;
  // One distinguishing word is enough only when it is ALL the name has — a unit
  // called 제27보병사단 reduces to one token and still identifies itself.
  return words.length === 1 ? shared === 1 : shared >= 2;
};

// A COUNTRY IS NAMED, NOT PARAPHRASED — the other prose rule this app needs.
//
// namedInText above asks "is this event about this STRUCTURE", and paraphrase is
// the norm there. This asks "does this prose name this COUNTRY", where the whole
// proper noun is either present or it is not. The event camera's last resort uses
// it: when an event pins no coordinate, the countries its text mentions are the
// only thing left to fly to.
//
// The catch is that the catalogue's names are English GADM romanizations and this
// campaign's prose is Korean, so an English-only scan matched 0 of 344 events —
// half of every turn left the camera sitting still. Matching the LOCALIZED name
// is what makes the scan work at all.
//
// Matching it as a WORD is what keeps it honest. Korean writes particles without
// a space, so a plain substring reads 인도적 ("humanitarian") as 인도 (India) and
// 남중국해 (the South China Sea) as 중국 (China). Measured over all 344 events:
// 331 event-country pairs match as substrings, 326 as words. The 5 the word rule
// drops are 3 humanitarian-aid sentences and 2 sea names — every one of them
// false, and none of the 326 genuine mentions is lost. A wrong flight misinforms;
// a still camera only does nothing, so this errs towards not moving.
const HANGUL = /[가-힣]/;
// Particles, not compounds. 중국의/중국은/중국과 are China; 중국해 is a sea and
// 인도적 is an adjective, and neither should pull the camera to a capital.
const PARTICLE = new Set([..."은는이가을를의에와과도로만큼처럼부터까지서으라며보다"]);

export const mentionsName = (haystack, name) => {
  const text = normalizeString(haystack);
  const needle = normalizeString(name);
  if (!text || !needle) return false;

  if (!HANGUL.test(needle)) {
    // Very short romanizations ("Chad", "Mali") false-match inside other words
    // often enough to refuse; this is the bar the scan has always used.
    return needle.length >= 4 && text.toLowerCase().includes(needle.toLowerCase());
  }

  for (let at = text.indexOf(needle); at !== -1; at = text.indexOf(needle, at + 1)) {
    const before = text[at - 1] ?? "";
    const after = text[at + needle.length] ?? "";
    const startsWord = before === "" || !HANGUL.test(before);
    const endsWord = after === "" || !HANGUL.test(after) || PARTICLE.has(after);
    if (startsWord && endsWord) return true;
  }
  return false;
};

export const findRelatedEvents = (events, { id = "", name = "" } = {}, limit = 40) => {
  const subject = { id: normalizeString(id), name: normalizeString(name) };
  if (!subject.id && !subject.name) return [];
  const matched = [];
  for (const event of normalizeArray(events)) {
    // The turn-advance pin is a clock marker, not something that happened.
    if (normalizeString(event?.kind) === "advance") continue;
    if (opsNaming(event, subject) || namedInText(event, subject.name)) matched.push(event);
  }
  // The store is oldest-first; the useful end is the recent one.
  return matched.reverse().slice(0, limit);
};

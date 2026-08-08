/*! Open Historia — place names in the player's language © 2026 Nicholas Krol, MIT (see src/Editor/LICENSE). */
// THE MODEL WRITES KOREAN AND THEN NAMES THE PLACE IN ENGLISH.
//
// Straight from a live campaign's own event log and action queue:
//
//   "Russia는 시베리아를 관통하는 LNG 및 석유 파이프라인 확장과…"
//   "Saudi Arabia는 'Vision 2030'에 따라 고부가가치 화학 공정과…"
//   "…부산과 Ulsan 항만을 핵심 거점으로…"        "양자 암호 통신 허브 (Gyeonggi)"
//   "East China Sea와 South China Sea의 합동 순찰을…"
//   "북한 내 주요 지휘부(P'yŏng양 등) 위치에 대한…"
//
// The cause is not a translation failure. Every geographic name the model is
// given — the city catalogue, the region list, the country list — is fed to it in
// English, because those are the identifiers the engine matches on. So it writes
// them back in English, in the middle of Korean prose, and the player reads
// "Russia는". The last line is the ugliest: the model half-translated a GADM
// romanization and produced a word in neither language.
//
// The engine already knows every one of these in Korean — it draws them on the
// map. So this is a lookup, not a translation: build a dictionary from the
// country and region catalogues, ask the translator's own cache for each, and
// substitute. NOTHING outside that dictionary is touched, which is the point —
// AI, SMR, DMZ, LNG, K-Shield and "Vision 2030" are how a Korean speaker writes
// them, and a pass clever enough to "fix" those would be a pass that ruins them.
import { loadCountryNames, loadRegionCatalog } from "./assets.js";
import { enqueueStrings, translateLabel } from "./translator.js";

const normalizeString = (value) => String(value ?? "").trim();

// Two letters is an abbreviation, not a place worth substituting ("UK" inside a
// Korean sentence is fine, and a two-letter entry would match far too much).
const MIN_NAME_CHARS = 3;

// Fold the accents a GADM romanization carries so "P'yŏngyang", "Pyongyang" and
// "pyŏng-yang" all reduce to one key.
export const foldName = (value) => normalizeString(value)
  .normalize("NFD")
  .replace(/[̀-ͯ]/g, "")
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, "");

const hasHangul = (value) => /[가-힯]/.test(value);
const isLatinName = (value) => /^[A-Za-z][A-Za-z0-9 '’À-ɏ.-]*$/.test(value);

// A dictionary entry: the English name as written, its folded key, and the
// Korean the translator already holds for it.
export const buildNameDictionary = (names, translate = translateLabel) => {
  const byFold = new Map();
  for (const raw of names ?? []) {
    const english = normalizeString(raw);
    if (english.length < MIN_NAME_CHARS || !isLatinName(english)) continue;
    const local = normalizeString(translate(english));
    // Unknown to the cache, or a language where the name is unchanged: nothing
    // to substitute, and substituting a string for itself would only churn.
    if (!local || local === english || !hasHangul(local)) continue;
    const fold = foldName(english);
    if (!fold) continue;
    const prior = byFold.get(fold);
    // A longer written form of the same folded key is the more specific one.
    if (!prior || english.length > prior.english.length) byFold.set(fold, { english, fold, local });
  }
  // SHORT FORMS. The catalogues carry the administrative name — "Gyeonggi-do",
  // "Hwanghae-bukto" — and the model writes what a person writes: "Gyeonggi".
  // So the part before the first hyphen becomes an alias for the same Korean.
  //
  // Only where it does not collide, which is the whole reason this is a second
  // pass: "Guinea-Bissau" would otherwise claim "Guinea", and Guinea is a
  // different country. An existing entry always wins.
  for (const entry of [...byFold.values()]) {
    const short = entry.english.split(/[-–]/)[0].trim();
    if (short.length < 4 || short === entry.english) continue;
    const fold = foldName(short);
    if (!fold || byFold.has(fold)) continue;
    byFold.set(fold, { english: short, fold, local: entry.local });
  }

  // Longest first so "South China Sea" is taken before "China", and
  // "South Korea" before "Korea".
  return [...byFold.values()].sort((a, b) => b.english.length - a.english.length);
};

// Every run of Latin letters (plus the punctuation that lives inside a name) in a
// piece of text, with where it sits. Hangul is not a Latin letter, so "Russia는"
// yields the run "Russia" and the 는 stays put — which is exactly the case that
// has to work.
const LATIN_RUN = /[A-Za-z][A-Za-z0-9'’À-ɏ.-]*(?:[ ][A-Z][A-Za-z0-9'’À-ɏ.-]*)*/g;

// A Latin run with Korean fused onto its end: "P'yŏng양". The model made this by
// translating the last syllable of a romanization and leaving the rest.
const HYBRID = /([A-Za-z][A-Za-z0-9'’À-ɏ.-]*)([가-힯]+)/g;

// Replace the place names in one string. Pure — hand it a dictionary and it does
// not touch the network, the cache, or anything else.
export const localizeNames = (text, dictionary) => {
  const value = normalizeString(text);
  if (!value || !Array.isArray(dictionary) || dictionary.length === 0) return text;
  if (!/[A-Za-z]/.test(value)) return text;

  const byFold = new Map(dictionary.map((entry) => [entry.fold, entry]));

  // Pass 1 — the half-translated hybrids, before the plain runs, because the
  // Latin half of "P'yŏng양" would otherwise be examined on its own and missed.
  let next = value.replace(HYBRID, (whole, latin, hangul) => {
    const fold = foldName(latin);
    if (!fold) return whole;
    const exact = byFold.get(fold);
    // "Seoul시" — a complete name with a Korean particle or suffix stuck on.
    if (exact) return `${exact.local}${hangul}`;
    // A prefix of a known name whose Korean form ends with the Hangul tail:
    // "P'yŏng" + "양" against P'yŏngyang → 평양. Both halves have to agree, so a
    // chance prefix match cannot rewrite an unrelated word.
    for (const entry of dictionary) {
      if (entry.fold.startsWith(fold) && entry.local.endsWith(hangul)) return entry.local;
    }
    return whole;
  });

  // Pass 2 — whole names standing on their own.
  next = next.replace(LATIN_RUN, (run) => {
    // A run can be "East China Sea" or a trailing fragment of a sentence; try the
    // longest leading word-sequence that is a known name, shortening as it fails.
    const words = run.split(" ");
    for (let take = words.length; take >= 1; take -= 1) {
      const candidate = words.slice(0, take).join(" ");
      const entry = byFold.get(foldName(candidate));
      if (entry) return [entry.local, ...words.slice(take)].join(" ");
    }
    return run;
  });

  return next;
};

// ---- the dictionary this campaign uses -------------------------------------

let dictionaryPromise = null;
let dictionaryKey = "";

// Countries and admin-1 regions. Cities are deliberately left out: the catalogue
// runs to seventy thousand entries, most of them ambiguous single words ("Same",
// "Bath", "Split"), and substituting those into prose would do more damage than
// the problem is worth.
export const loadNameDictionary = async (key = "") => {
  if (dictionaryPromise && dictionaryKey === key) return dictionaryPromise;
  dictionaryKey = key;
  const promise = (async () => {
    const [countries, regions] = await Promise.all([
      loadCountryNames().catch(() => []),
      loadRegionCatalog().catch(() => []),
    ]);
    const names = [
      ...(countries ?? []).map((country) => country?.name),
      ...(regions ?? []).flatMap((region) => [region?.name, region?.country]),
    ].filter(Boolean);
    return buildNameDictionary(names);
  })().catch(() => []);
  dictionaryPromise = promise;
  return promise;
};

export const __resetNameDictionaryForTests = () => {
  dictionaryPromise = null;
  dictionaryKey = "";
};

// Names that appear in this turn's text but that the cache cannot answer for yet.
// Queuing them costs one batched translation call and means the next turn can fix
// what this one had to leave in English — the cache is persisted, so a campaign
// converges rather than repeating the same miss forever.
export const queueUnknownNames = (texts, dictionary) => {
  const known = new Set((dictionary ?? []).map((entry) => entry.fold));
  const wanted = new Set();
  for (const text of texts ?? []) {
    const value = normalizeString(text);
    if (!value) continue;
    for (const run of value.match(LATIN_RUN) ?? []) {
      const candidate = normalizeString(run);
      if (candidate.length < MIN_NAME_CHARS) continue;
      // Only things shaped like a proper name: an all-caps run is an acronym.
      if (candidate === candidate.toUpperCase()) continue;
      if (known.has(foldName(candidate))) continue;
      wanted.add(candidate);
    }
  }
  if (wanted.size > 0) enqueueStrings([...wanted]);
  return [...wanted];
};

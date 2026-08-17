/*! Open Historia — which of a polity's names the map prints © 2026 Nicholas Krol, MIT (see src/Editor/LICENSE). */
// THE MAP PRINTS THE SPEC'S NAME, NOT THE TRANSLATOR'S GUESS.
//
// A country label used to reach the screen as translateLabel(<English polity
// name>): a lookup in the language pack, and when the pack had nothing, the
// English name went up and an AI call was queued to fill it in later. So on a
// Korean board the label was whatever some earlier session's translation model
// had answered — "바바리아 왕국" for Kingdom of Bavaria where the spec says
// "바이에른 왕국", "이집트 쿠베이트" for the Khedivate, "몬테네그로 사자백제" —
// and for anything the pack had never seen, English until the queue drained.
// Measured on the 1836 board (2026-08-17): of 134 polities, 69 matched the
// spec's Korean alias by luck, 55 differed, 10 had no Korean at all. And the
// saved pack grows per install, so no two machines agreed.
//
// The spec already carries the name a Korean player should read: each polity's
// `aliases` opens with it. So the label asks the spec first — the first alias
// written in the active language's script — and only falls back to the
// translator when the spec has nothing in that script. That makes the label
// deterministic (a test can pin it, a measurement can trust it) and puts the
// display name where the polity's identity already lives.
//
// The rule is decided by SCRIPT, not by language tag: aliases are untagged
// strings, so "Sachsen-Weimar-Eisenach" cannot be told from "Saxe-Weimar-Eisenach"
// and a French or German player keeps the old path unchanged. Only languages
// whose script is not Latin can be served from the alias list — the same
// distinction translator.js draws for "already in the target language".
//
// Convention this leans on (agreed with the preset builder side, 2026-08-17):
// the FIRST alias in the language's script is the display name; later ones are
// lookup keys. Reorder the aliases to change what the map prints.

// The same ranges as translator.js NON_LATIN_SCRIPTS. A copy rather than an
// import because translator.js carries the DOM walker and cannot load in a
// test; tests/label-names.mjs pins the two tables to each other so they cannot
// drift. Latin-script languages are deliberately absent — see above.
export const DISPLAY_SCRIPTS = {
  ar: /[\u0600-\u06ff]/,
  el: /[\u0370-\u03ff]/,
  fa: /[\u0600-\u06ff]/,
  he: /[\u0590-\u05ff]/,
  hi: /[\u0900-\u097f]/,
  ja: /[\u3040-\u30ff\u4e00-\u9fff]/,
  ko: /[\uac00-\ud7af\u1100-\u11ff]/,
  ru: /[\u0400-\u04ff]/,
  th: /[\u0e00-\u0e7f]/,
  uk: /[\u0400-\u04ff]/,
  ur: /[\u0600-\u06ff]/,
  zh: /[\u4e00-\u9fff]/,
};

const globalPatterns = new Map();
const globalPattern = (language) => {
  if (!globalPatterns.has(language)) {
    const local = DISPLAY_SCRIPTS[language];
    globalPatterns.set(language, local ? new RegExp(local.source, "g") : null);
  }
  return globalPatterns.get(language);
};

// True when the string is CARRIED by the language's script — the translator's
// own test: one stray Hangul syllable inside a Latin string does not count, the
// target script has to outweigh the Latin letters. Latin-script languages (and
// unknown codes) always answer false, so the caller falls through unchanged.
export const carriedByScript = (text, language) => {
  const pattern = globalPattern(language);
  if (!pattern) return false;
  const value = String(text ?? "");
  const target = (value.match(pattern) ?? []).length;
  if (target === 0) return false;
  const latin = (value.match(/[A-Za-z]/g) ?? []).length;
  return target >= latin;
};

// The first alias written in the active language's script, trimmed — or null
// when there is none (no aliases, a Latin-script language, or a polity whose
// aliases are all Latin). Null means "use the old path", never "".
export const pickDisplayAlias = (aliases, language) => {
  if (!Array.isArray(aliases)) return null;
  for (const alias of aliases) {
    if (typeof alias !== "string") continue;
    const trimmed = alias.trim();
    if (trimmed && carriedByScript(trimmed, language)) return trimmed;
  }
  return null;
};

// RETIRED NAMES, REWRITTEN AT THE DOOR.
//
// "Quantum-Trace" and "Global Hydrogen Pass" were coined by the model in an
// otherwise Korean campaign, entered the queue, and then rode every later
// prompt as established canon — the player's report, two rounds apart: "이
// 무슨 말인지 모르겠네", then "이미 이전에 나와서 그런가 고착화 된거같아".
// The [Naming] prompt rule stops NEW English coinages, but an established name
// feeds itself: the model keeps writing it because the context keeps showing
// it. Retiring one therefore takes two moves, and they must be TOTAL:
//
//   1. A one-time sweep renames every occurrence in every store, so no prompt
//      ever shows the model the old name again.
//   2. This registry rewrites the old name at normalize time forever after, so
//      even if the model re-coins it from habit ("quantum" + "trace" is a
//      likely collocation in a supply-chain sentence), the queue, the events
//      and the map only ever hold the Korean canon.
//
// The table lives in world.nameRenames — save data, not engine code — because
// which names a campaign retired is a fact about that campaign. The registry
// here is a module-level mirror fed by normalizeWorldState, so the pure
// normalize functions (actions, events, markers) can apply it without every
// caller threading the world through.
const normalizeString = (value) => String(value ?? "").trim();

// old name -> replacement. Keys shorter than 3 characters are refused (too easy
// to match by accident), self-renames are dropped, and longer keys sort first
// so "Global Hydrogen Pass" wins before a bare "Hydrogen Pass".
export const normalizeNameRenames = (value) => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const entries = [];
  for (const [from, to] of Object.entries(value)) {
    const cleanFrom = normalizeString(from);
    const cleanTo = normalizeString(to);
    if (cleanFrom.length < 3 || !cleanTo) continue;
    if (cleanFrom.toLowerCase() === cleanTo.toLowerCase()) continue;
    entries.push([cleanFrom, cleanTo]);
    if (entries.length >= 40) break;
  }
  entries.sort((left, right) => right[0].length - left[0].length);
  return Object.fromEntries(entries);
};

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// One tolerant matcher per retired name. The salvage stack has already produced
// "Quantum-Trace" and "Quantum_Trace" as the same paragraph one character apart
// (see machineSyntax.js), so the matcher accepts hyphen, underscore or space
// between the name's tokens regardless of how the table spells it — and never
// matches inside a longer Latin word ("Trace" must not fire in "Tracey").
const buildMatcher = (from) => {
  const tokens = from.split(/[-_\s]+/).filter(Boolean).map(escapeRegExp);
  if (tokens.length === 0) return null;
  return new RegExp(`(?<![A-Za-z0-9])${tokens.join("[-_\\s]?")}(?![A-Za-z0-9])`, "gi");
};

let registry = [];
let registrySignature = "";

// Feed the registry from a world's rename table. Signature-gated: this runs on
// every normalizeWorldState (which runs on every poll), so rebuilding regexes
// only when the table actually changed keeps it free.
export const setCanonRenames = (renames) => {
  const normalized = normalizeNameRenames(renames);
  const signature = JSON.stringify(normalized);
  if (signature !== registrySignature) {
    registrySignature = signature;
    registry = Object.entries(normalized)
      .map(([from, to]) => ({ matcher: buildMatcher(from), to }))
      .filter((entry) => entry.matcher);
  }
  return normalized;
};

// For tests and diagnostics.
export const getCanonRenameCount = () => registry.length;

export const applyCanonRenames = (value) => {
  let text = String(value ?? "");
  if (!text || registry.length === 0) return text;
  for (const { matcher, to } of registry) {
    text = text.replace(matcher, to);
  }
  return text;
};

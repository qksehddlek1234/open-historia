/*! Open Historia — polities that hold ground and cannot be talked to © 2026 Nicholas Krol, MIT (see src/Editor/LICENSE). */
// THE OPPOSITE CASE FROM internalVoices.js.
//
// That file handles a polity with a VOICE AND NO GROUND — an advisor, a
// newspaper. This one handles a polity with GROUND AND NO VOICE: something that
// owns regions, takes and loses them, and has no mind to answer a telegram.
//
// It exists because the two paths that make a diplomatic counterpart —
// resolveInvitees in gameplay.js and the chat picker — both assume that
// anything owning territory is a government you can address. On an ordinary
// board that assumption is free. On the zombie board it produces a ceasefire
// negotiation with a horde, which is the single most common way that genre
// fails, and the original preset spends three of its "non-negotiables" on it:
// no supply lines, NO DIPLOMACY WITH THE DEAD, and it acts every turn.
//
// MARKED BY NAME, for the same reason the voices are. A flag on a polity row is
// lost the moment the model invents "the Northern Horde" in a polityChange or a
// save written before the flag existed is loaded, and resolveInvitees works on
// names the model emitted rather than rows we wrote. The flag is honoured too
// when it is there — a scenario can set `speechless: true` and get the same
// treatment for a name this registry has never heard of.
//
// The registry is deliberately small and explicit. It is not trying to guess
// what is alive; it is naming the factions our own scenarios ship.
const SPEECHLESS_NAMES = [
  "the dead",
  "zombies",
  "the infected",
  "the horde",
  "the swarm",
];

const normalize = (value) => String(value ?? "").trim().toLowerCase();

export const isSpeechlessName = (name) => {
  const text = normalize(name);
  if (!text) return false;
  return SPEECHLESS_NAMES.includes(text);
};

export const isSpeechlessPolity = (polity) =>
  isSpeechlessName(polity?.name) || polity?.speechless === true;

// EVERY NAME THIS BOARD'S SPEECHLESS POLITIES ANSWER TO.
//
// The registry above is a floor, not the answer, and on a Korean campaign it is
// a floor with a hole in it: `isSpeechlessName("죽은 자")` is false, and 죽은 자
// is what the model writes. The board already knows better — the zombie spec
// ships `aliases: ["죽은 자", "The Dead", "Zombies", …]` and the builder carries
// them into polityOverrides. Nothing was reading them.
//
// So the set is derived from the WORLD: for every polity the registry or its
// own `speechless` flag marks, take its canonical name AND all of its aliases.
// A scenario that invents "The Northern Blight" and flags it gets the same
// protection in whatever languages it lists, without anyone editing this file.
export const buildSpeechlessNames = (world) => {
  const names = new Set(SPEECHLESS_NAMES);
  const overrides = world?.polityOverrides;
  if (!overrides || typeof overrides !== "object") return names;
  for (const polity of Object.values(overrides)) {
    if (!isSpeechlessPolity(polity)) continue;
    for (const value of [polity?.name, ...(Array.isArray(polity?.aliases) ? polity.aliases : [])]) {
      const text = normalize(value);
      if (text) names.add(text);
    }
  }
  return names;
};

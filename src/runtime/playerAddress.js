/*! Open Historia — the player has no rank © 2026 Nicholas Krol, MIT (see src/Editor/LICENSE). */
// "대통령님," AND WHY THE PROMPT COULD NOT STOP IT.
//
// The player is not the head of state — the country's leader is a separate
// character who can be deposed, replaced or outlived while the player continues.
// A directive saying so is appended to every advisor and diplomacy prompt
// (promptContext.playerIdentityDirective) and the advisor opened ELEVEN
// CONSECUTIVE replies with "대통령님," anyway.
//
// The reason is in how the advisor works, not in how the rule is worded. Its
// transcript is replayed as conversation history on every call, so the model
// arrives at each new reply having just read eleven of its own replies, each one
// starting with the honorific. An English sentence saying "never address the
// player by an office" is one instruction; the transcript is eleven worked
// examples. The examples win, and they get stronger every turn — the mistake
// teaches itself.
//
// So the engine takes it out: off the reply before it is stored, and off the
// history before it is replayed, which is the half that actually breaks the
// loop. The house rule applies — where the model reliably errs, validate rather
// than ask harder.
//
// WHAT MUST SURVIVE: the advisor talks ABOUT the leader constantly, and that is
// correct and wanted. "박근혜 대통령이 파면되었습니다" is the fiction working. Only
// the VOCATIVE goes — a bare title in the position where a name would be, at the
// start of a line, or tacked onto the end of a sentence. A title with a person
// in front of it is a description and is never touched.

const normalizeString = (value) => String(value ?? "").trim();

// Offices and honorifics a model reaches for when it thinks it is talking to the
// person in charge. Korean first because that is where it was measured; the rest
// are the equivalents the same failure produces in other languages.
const TITLES = [
  "대통령님", "대통령 각하", "대통령 님",
  "총리님", "국무총리님", "주석님", "서기장님", "위원장님", "의장님", "수반님",
  "사령관님", "장군님", "각하", "폐하", "전하", "성하",
  "Mr\\.? President", "Madam President", "Mister President",
  "Your Excellency", "Your Majesty", "Your Highness", "Your Grace",
  "Comrade Chairman", "Prime Minister", "Chancellor",
];

const TITLE_GROUP = `(?:${TITLES.join("|")})`;

// Openers a Korean speaker puts in front of a vocative.
const HONORIFIC_PREFIX = "(?:존경하는|친애하는|경애하는)\\s*";

// At the start of the message or of any line, optionally behind markdown
// decoration (**대통령님**, > 대통령님, ### 대통령님) — the model formats.
const LEADING = new RegExp(
  `(^|\\n)([ \\t]*(?:[>#]+[ \\t]*)?)(?:\\*{1,2}|_{1,2})?(?:${HONORIFIC_PREFIX})?${TITLE_GROUP}(?:\\*{1,2}|_{1,2})?[ \\t]*[,，:：、]?[ \\t]*`,
  "gu",
);

// Tacked onto the end of a clause: "…준비되어 있습니다, 대통령님." Requires the
// comma, so a sentence that merely ENDS with the word (…를 만난 대통령님) is left.
const TRAILING = new RegExp(`[,，]\\s*(?:${HONORIFIC_PREFIX})?${TITLE_GROUP}(?=\\s*(?:[.!?…]|$|\\n))`, "gu");

// A title with a name, a country or a demonstrative in front of it is a
// DESCRIPTION, not an address, and must survive: "박근혜 대통령님께서".
const NAMED_BEFORE = /[\p{L}\p{N}]$/u;

export const stripPlayerHonorific = (value) => {
  const text = String(value ?? "");
  if (!text) return text;

  let next = text.replace(LEADING, (match, lineBreak, indent, offset) => {
    // `indent` is markdown decoration, never a word, so a real name before the
    // title can only appear when this matched mid-line — which LEADING forbids.
    // The guard is kept because the regex is easy to loosen later by accident.
    const before = text.slice(0, offset);
    if (lineBreak === "" && offset > 0 && NAMED_BEFORE.test(before)) return match;
    return `${lineBreak}${indent}`;
  });

  next = next.replace(TRAILING, "");

  // Removing "대통령님, " can leave a stray blank first line or doubled spaces.
  return next.replace(/^[ \t]*\n+/, "").replace(/[ \t]{2,}/g, " ").trimStart();
};

// Did this text address the player by rank? Used only for reporting.
export const addressesPlayerByRank = (value) => stripPlayerHonorific(value) !== String(value ?? "");

// The advisor transcript, cleaned before it is replayed as conversation history.
// This is the load-bearing half: the stored replies are the examples the model
// copies, so leaving them in place would keep teaching the habit no matter how
// clean each new reply is.
export const stripHonorificsFromHistory = (messages) => {
  if (!Array.isArray(messages)) return { cleaned: 0, messages };
  let cleaned = 0;
  const next = messages.map((message) => {
    // Only the model's own turns. What the player typed is theirs.
    const role = normalizeString(message?.role);
    if (role !== "advisor" && role !== "model" && role !== "assistant") return message;
    const text = String(message?.text ?? "");
    if (!text) return message;
    const stripped = stripPlayerHonorific(text);
    if (stripped === text) return message;
    cleaned += 1;
    return { ...message, text: stripped };
  });
  return { cleaned, messages: next };
};

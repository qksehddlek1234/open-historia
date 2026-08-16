/*! Open Historia — one reader for every scenario date, BCE included © 2026 Nicholas Krol, MIT (see src/Editor/LICENSE). */
// WHY THIS FILE EXISTS: bronze-1200bc shipped with `startDate: "1200 BCE"`, and
// `Date.parse("1200 BCE")` is NaN. Every date-aware path took its lenient branch
// and `ensureReferenceEra` returned before loading anything, so that board could
// not resolve a single leader — 0 of 24 — no matter which era pack was written.
// It was never a coverage hole; it was a parse failure upstream of coverage.
//
// AND THE OBVIOUS FIX IS WRONG TWICE. Measured, 2026-08-16:
//
//   Date.parse("-1200-01-01")     → year 1199   ← the Middle Ages, not the
//                                                 Bronze Age. ISO extended
//                                                 years are SIGN + SIX digits;
//                                                 a four-digit one is read as
//                                                 an ordinary CE date.
//   Date.parse("-001200-01-01")   → year -1200  ← parses, and is still off by
//                                                 one: ISO uses ASTRONOMICAL
//                                                 year numbering, which has a
//                                                 year zero. 0000 is 1 BCE, so
//                                                 -1200 is 1201 BCE.
//   Date.parse("-001199-01-01")   → year -1199  ← THIS is 1200 BCE.
//
// So: BCE year N is the ISO year -(N-1), and the machine value for this board
// is "-001199-01-01" while the thing a player must read is "1200 BCE". The two
// cannot be the same string, which is why a scenario carries both — a machine
// date and a `meta.dateLabel`.

// Sign + six digits, or the ordinary four. Anything else is a textual date and
// belongs to the caller's lenient branch.
const EXTENDED_ISO = /^[+-]\d{6}-\d{2}-\d{2}$/;
const PLAIN_ISO = /^\d{4}-\d{2}-\d{2}$/;

/** True for either machine form — the shape every date regex should accept. */
export const isGameDate = (value) => {
  const text = String(value ?? "").trim();
  return EXTENDED_ISO.test(text) || PLAIN_ISO.test(text);
};

/** Epoch ms for a scenario date, or NaN when it is textual. */
export const parseGameDate = (value) => {
  const text = String(value ?? "").trim();
  if (!isGameDate(text)) return NaN;
  return Date.parse(`${text}T00:00:00Z`);
};

/**
 * The ASTRONOMICAL year of a scenario date — negative in the deep past, and
 * exactly what date arithmetic wants. Replaces the `^(-?\d{1,4})` readers that
 * were wrong on all three of this board's candidate strings: they read
 * "1200 BCE" as +1200, "-1200-01-01" as -1200 (a string that in fact means the
 * Middle Ages), and "-001200-01-01" as -12.
 */
export const gameYear = (value) => {
  const text = String(value ?? "").trim();
  if (EXTENDED_ISO.test(text)) return Number(text.slice(0, 7));
  if (PLAIN_ISO.test(text)) return Number(text.slice(0, 4));
  // Textual fallbacks, so a spec that still says "1200 BCE" is not silently a
  // positive year. Kept narrow on purpose: two spellings, both explicit.
  const bce = /^(\d{1,6})\s*(?:BCE|BC)\b/i.exec(text);
  if (bce) return 1 - Number(bce[1]);
  const ce = /^(\d{1,4})(?:\D|$)/.exec(text);
  return ce ? Number(ce[1]) : NaN;
};

/** "1200 BCE" / "117" / "1935" from an astronomical year. */
export const formatGameYear = (year) => {
  if (!Number.isFinite(year)) return "";
  return year <= 0 ? `${1 - year} BCE` : String(year);
};

/**
 * What a player should read. A scenario's own `dateLabel` wins — it is the
 * authored spelling and no formatter should second-guess it — and otherwise the
 * year is derived. Callers that need a full date keep using their own
 * formatting for CE dates; this exists for the deep past, where a locale
 * formatter prints "-001199" or an off-by-one "1200 BC" depending on the
 * platform's calendar.
 */
export const gameDateLabel = (value, dateLabel) => {
  const authored = String(dateLabel ?? "").trim();
  if (authored) return authored;
  const year = gameYear(value);
  return year <= 0 ? formatGameYear(year) : String(value ?? "");
};

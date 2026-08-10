/*! Open Historia — the calendar card, built by the engine © 2026 Nicholas Krol, MIT (see src/Editor/LICENSE). */
// THE CARD THE PROMPT COULD NOT GET THE MODEL TO EMIT.
//
// Measured (docs/analysis/contract-ab-2026-08-09.md): asking for it in the
// simulation rules produced the card 0 times out of 7, and 0 out of 2 when that
// clause was the only contract in the prompt — so it was never a crowding-out
// problem. Moving it to the end of the jump prompt got it to 1 of 3, which is
// "possible" rather than "reliable".
//
// That is the exact shape rule #2 exists for: where a 12B repeatedly fails, the
// engine does the work rather than the prompt asking harder. So the model is now
// asked ONE small question on its own — what is already on the calendar — and
// the engine formats the card, computes every interval, and guarantees it is
// there. The arithmetic was also the part the model got wrong most often, and
// arithmetic is not something to ask a language model for at all.
const DAY = 86400000;

const parseDate = (value) => {
  const text = String(value ?? "").trim();
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text);
  if (!match) return null;
  const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
  return Number.isNaN(date.getTime()) ? null : date;
};

// Add whole calendar months, CLAMPING the day to the target month's last day.
//
// This is the whole bug Cowork found. `Date.UTC(2026, 1, 31)` is not an error in
// JavaScript — it is 3 March, silently. So "31 January plus one month" landed
// PAST the target date, the day count came out negative, and `if (days > 0)`
// swallowed it: 31 Jan → 1 Mar printed "1 month" for a 29-day gap. The same
// overflow hid a day in 31 Mar → 1 May ("1 month" for 31 days), which the
// negative-day check alone would not have caught, because there the overflow
// landed exactly on the target and the day count was zero rather than negative.
//
// Clamping is the fix at the source: 31 January plus one month is 28 February,
// and every later step is then working with a real date.
const addMonthsClamped = (date, months) => {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth() + months;
  const lastOfTargetMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const day = Math.min(date.getUTCDate(), lastOfTargetMonth);
  return new Date(Date.UTC(year, month, day));
};

// "in 1 month 7 days", the original's own phrasing. Months are counted as whole
// calendar months rather than 30-day blocks, because "in 2 months" reading as
// 61 days in one year and 59 in another is exactly the kind of drift that makes
// a player stop trusting the card.
//
// The invariant, which the tests state directly: adding the months back and then
// the days lands EXACTLY on the target date. Nothing is lost and nothing is
// invented. `days` can no longer be negative — settled is clamped into a month
// at or before the target's, so it never overshoots.
export function formatInterval(fromDate, toDate) {
  const from = parseDate(fromDate);
  const to = parseDate(toDate);
  if (!from || !to) return "";
  if (to <= from) return "now";

  let months = ((to.getUTCFullYear() - from.getUTCFullYear()) * 12)
    + (to.getUTCMonth() - from.getUTCMonth());
  if (addMonthsClamped(from, months) > to) {
    months -= 1;
  }
  const settled = addMonthsClamped(from, months);
  const days = Math.round((to - settled) / DAY);

  const parts = [];
  if (months >= 12) {
    const years = Math.floor(months / 12);
    parts.push(`${years} year${years === 1 ? "" : "s"}`);
    months -= years * 12;
  }
  if (months > 0) parts.push(`${months} month${months === 1 ? "" : "s"}`);
  if (days > 0 || parts.length === 0) parts.push(`${days} day${days === 1 ? "" : "s"}`);
  return parts.join(" ");
}

// One line per entry, in the original's shape:
//   "Next Election (France): 1941-06-07: in 3 days"
// `whose` is optional — a global event (a conference, a treaty deadline nobody
// owns) reads better without an empty pair of brackets.
export function formatScheduledLine(entry, fromDate) {
  const name = String(entry?.name ?? "").trim();
  const date = String(entry?.date ?? "").trim();
  if (!name || !parseDate(date)) return "";
  const whose = String(entry?.whose ?? "").trim();
  const note = String(entry?.note ?? "").trim();
  const head = whose ? `${name} (${whose})` : name;
  const interval = formatInterval(fromDate, date);
  const line = `${head}: ${date}: in ${interval}`;
  return note ? `${line} — ${note}` : line;
}

// The whole card, or "" when there is genuinely nothing scheduled — an empty
// card is worse than no card, and the original says so too.
//
// Entries are sorted by date and de-duplicated by name+date, because the model
// hands back the same election twice often enough to be worth the four lines,
// and dropped if they are not in the FUTURE: a deadline that has already passed
// is not a forecast, it is a mistake the card would keep repeating.
export function buildScheduledCard(entries, fromDate) {
  const from = parseDate(fromDate);
  if (!from) return "";
  const seen = new Set();
  const rows = [];
  for (const entry of Array.isArray(entries) ? entries : []) {
    const date = parseDate(entry?.date);
    const name = String(entry?.name ?? "").trim();
    if (!date || !name || date <= from) continue;
    const key = `${name.toLowerCase()}|${String(entry.date).trim()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    rows.push({ entry, at: date.getTime() });
  }
  if (rows.length === 0) return "";
  rows.sort((a, b) => a.at - b.at);
  return rows
    .map((row) => formatScheduledLine(row.entry, fromDate))
    .filter(Boolean)
    .join("\n");
}

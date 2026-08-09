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

// "in 1 month 7 days", the original's own phrasing. Months are counted as whole
// calendar months rather than 30-day blocks, because "in 2 months" reading as
// 61 days in one year and 59 in another is exactly the kind of drift that makes
// a player stop trusting the card.
export function formatInterval(fromDate, toDate) {
  const from = parseDate(fromDate);
  const to = parseDate(toDate);
  if (!from || !to) return "";
  if (to <= from) return "now";

  let months = ((to.getUTCFullYear() - from.getUTCFullYear()) * 12)
    + (to.getUTCMonth() - from.getUTCMonth());
  const anchor = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth() + months, from.getUTCDate()));
  if (anchor > to) {
    months -= 1;
  }
  const settled = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth() + months, from.getUTCDate()));
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

/*! Open Historia — things take time to build © 2026 Nicholas Krol, MIT (see src/Editor/LICENSE). */
// A PORT DOES NOT OPEN THE MONTH IT IS ANNOUNCED.
//
// Measured over this campaign's 30 rounds, which cover two and a half years:
//
//   143 structures founded, at least one in EVERY single round (4.77 a round)
//   116 of them South Korea's alone — 52 in 2016, 51 in 2017, 13 by mid-2018
//     0 ever removed, closed, cancelled or mothballed
//     5 of 99 markers carry a foundedAt at all
//
// One country opening a national-scale facility every eight days, for two and a
// half years, and never once shutting one. Round 31 is the whole thing in a
// single month: an integrated port in Vietnam, a first port in Thailand, a
// quantum-AI institute in Gangwon, a research base in Gyeongsang and a smart
// factory — all opened between 2018-05-20 and 2018-06-19.
//
// The model is not wrong to answer an order with a place; it is wrong about WHEN
// the place exists. Real programmes have a groundbreaking, then years, then a
// ribbon. And a country runs a handful of them at once, not thirty, because
// money, ministries and engineers are finite — which is the budget/political/
// technical friction that was missing entirely.
//
// So a build no longer puts a finished thing on the map. It starts a PROJECT:
// the marker appears immediately (the event that announced it is true — ground
// was broken) carrying a status and a completion date, and it becomes real when
// that date arrives. Nothing is dropped, nothing is silent, and the map finally
// shows a pipeline instead of a list of announcements.
const normalizeString = (value) => String(value ?? "").trim();
const normalizeArray = (value) => (Array.isArray(value) ? value : []);

export const UNDER_CONSTRUCTION = "under-construction";

// HOW LONG A THING TAKES, in months. Real construction times, halved: a campaign
// that runs thirty rounds cannot use a five-year port and ever show the player a
// ribbon, and this engine's job is to be plausible rather than to be a schedule.
// Grouped by what the work actually is — a mast and a hut is not a deepwater
// terminal, and the map's own kind vocabulary already draws that line.
export const LEAD_MONTHS = {
  "radar station": 6,
  "communications hub": 6,
  checkpoint: 6,
  outpost: 6,
  embassy: 9,
  "government office": 9,
  "research center": 12,
  "medical center": 12,
  university: 12,
  education: 12,
  monument: 12,
  landmark: 12,
  "military base": 15,
  airfield: 15,
  factory: 15,
  "industrial complex": 15,
  mine: 15,
  port: 24,
  "power plant": 24,
  dam: 24,
  shipyard: 24,
  city: 60,
};

// What a kind we have never seen costs. Twelve months is the median of the table
// above and of what this campaign actually builds.
export const DEFAULT_LEAD_MONTHS = 12;

// HOW MANY A COUNTRY CAN RUN AT ONCE. This, not the lead time, is what sets the
// long-run rate: with a mean lead of ~13 months, five concurrent projects finish
// one every two and a half rounds. Against the measured 4.77 a round, that is a
// fourteen-fold slowdown — the calibration this was built to.
//
// A sixth project does not vanish and is not refused. It waits for a slot, and
// its completion date says so.
//
// FIVE is now the FLOOR STORY, not the law: constructionCapacity below derives
// the real number from the country's own sheet, and this constant remains the
// default wherever no sheet is known (and the exact old behaviour for every
// caller that does not pass a capacity).
export const MAX_CONCURRENT_PROJECTS = 5;

// THE PLAYER'S CALL, round 8: fixed slots became a wall — 21 projects queued
// against 5 slots, the newest completing four game-years out — and the chosen
// fix is the Victoria 3 shape: construction capacity is a NATIONAL quantity
// that grows when the nation does. No new mechanics were needed to close the
// loop — the player's orders already move GDP, industry share and stability
// through the stat-delta store, and this reads the merged sheet those deltas
// produce. Invest in industry, and the next founding sees more slots.
//
// Reading a dollar magnitude is NOT the retired conversion system coming back:
// that system translated BETWEEN currencies with model-supplied rates and is
// gone for good. This parses the game's own dollar figures (the only money
// format sheets carry since round 6) into a size, for a formula.
const dollarMagnitude = (value) => {
  const text = normalizeString(value);
  if (!text || !/\d/.test(text)) return 0;
  let total = 0;
  let matched = false;
  const scaled = /(\d+(?:[.,]\d+)?)\s*(조|억|만|T|B|M)/gi;
  for (let hit = scaled.exec(text); hit; hit = scaled.exec(text)) {
    const amount = Number(hit[1].replace(/,/g, ""));
    if (!Number.isFinite(amount)) continue;
    const scale = { "조": 1e12, "억": 1e8, "만": 1e4, T: 1e12, B: 1e9, M: 1e6 }[hit[2].toUpperCase?.() ?? hit[2]] ?? { "조": 1e12, "억": 1e8, "만": 1e4 }[hit[2]];
    if (!scale) continue;
    total += amount * scale;
    matched = true;
  }
  if (matched) return total;
  const bare = Number(text.replace(/[^0-9.]/g, ""));
  return Number.isFinite(bare) ? bare : 0;
};

const parsePct = (value) => {
  const text = normalizeString(value);
  if (!/\d/.test(text)) return null;
  const number = Number(text.replace(/[^0-9.-]/g, ""));
  return Number.isFinite(number) ? number : null;
};

// How many projects this country can actually run at once, from its own sheet.
// Thresholds are calibrated against the live campaign's 2016 sheets: South
// Korea (GDP 1.4조 달러, industry ~38%, stability 89) lands on 8 — the player's
// picked expansion — the United States on 9, North Korea on 4, Mongolia on 3.
// No sheet at all → the old constant, exactly.
export const constructionCapacity = (sheet) => {
  if (!sheet || typeof sheet !== "object") {
    return { slots: MAX_CONCURRENT_PROJECTS, why: "국가 시트 없음 — 기본 역량" };
  }
  const reasons = [];
  let slots = 4;
  const gdp = dollarMagnitude(sheet?.economy?.gdp);
  const gdpT = gdp / 1e12;
  const gdpBump = gdpT >= 10 ? 4 : gdpT >= 3 ? 3 : gdpT >= 1 ? 2 : gdpT >= 0.3 ? 1 : gdpT >= 0.05 ? 0 : -1;
  if (gdp > 0) {
    slots += gdpBump;
    reasons.push(`GDP ${sheet.economy.gdp} ${gdpBump >= 0 ? `+${gdpBump}` : gdpBump}`);
  } else {
    // Round 12, live: a blank GDP silently cost the economy bonus and the drop
    // was misread as a stability penalty. An unknown figure gets no bonus and
    // no penalty — and it SAYS so, so the console names the real cause.
    reasons.push("GDP 미상 — 보너스 없음");
  }
  const industry = parsePct(sheet?.gdpBreakdown?.industry);
  if (industry !== null) {
    const bump = industry >= 35 ? 1 : industry >= 15 ? 0 : -1;
    slots += bump;
    if (bump !== 0) reasons.push(`산업 ${industry}% ${bump > 0 ? `+${bump}` : bump}`);
  }
  const stability = Number(sheet?.stability);
  if (Number.isFinite(stability) && stability > 0) {
    const bump = stability >= 80 ? 1 : stability >= 50 ? 0 : stability >= 25 ? -1 : -2;
    slots += bump;
    if (bump !== 0) reasons.push(`안정 ${stability} ${bump > 0 ? `+${bump}` : bump}`);
  }
  slots = Math.max(2, Math.min(12, slots));
  return { slots, why: reasons.length > 0 ? reasons.join(", ") : "기본 역량" };
};

export const leadMonthsFor = (kind) => LEAD_MONTHS[normalizeString(kind).toLowerCase()] ?? DEFAULT_LEAD_MONTHS;

// Date arithmetic on YYYY-MM-DD without dragging dayjs into the runtime layer.
// Clamps the day so adding a month to the 31st never rolls into the next one.
export const addMonths = (date, months) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(normalizeString(date));
  if (!match) return normalizeString(date);
  const [, y, m, d] = match;
  const total = (Number(y) * 12) + (Number(m) - 1) + Math.max(0, Math.round(months));
  const year = Math.floor(total / 12);
  const month = (total % 12) + 1;
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const day = Math.min(Number(d), lastDay);
  return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
};

export const isUnderConstruction = (marker) => normalizeString(marker?.status) === UNDER_CONSTRUCTION;

const readyAtOf = (marker) => normalizeString(marker?.readyAt);

// When the next slot frees for this owner. Under the cap, now. Over it, when the
// (count - cap + 1)th project finishes — which is exactly the point at which a
// slot exists for this one.
export const nextSlotDate = (markers, ownerCode, date, capacity = MAX_CONCURRENT_PROJECTS) => {
  const cap = Math.max(1, Math.round(Number(capacity) || MAX_CONCURRENT_PROJECTS));
  const running = normalizeArray(markers)
    .filter((marker) => isUnderConstruction(marker) && marker.ownerCode === ownerCode)
    .map(readyAtOf)
    .filter(Boolean)
    .sort();
  if (running.length < cap) return normalizeString(date);
  const waitFor = running[running.length - cap];
  return waitFor > normalizeString(date) ? waitFor : normalizeString(date);
};

// Turn a finished-on-arrival marker into one that is being built. Returns the
// marker plus what the caller needs to explain it.
export const beginConstruction = (marker, { markers = [], date = "", capacity = MAX_CONCURRENT_PROJECTS } = {}) => {
  const startedAt = nextSlotDate(markers, marker?.ownerCode, date, capacity);
  const months = leadMonthsFor(marker?.kind);
  const readyAt = addMonths(startedAt, months);
  const queued = startedAt !== normalizeString(date);
  return {
    marker: { ...marker, status: UNDER_CONSTRUCTION, startedAt, readyAt, foundedAt: readyAt },
    months,
    queued,
    startedAt,
    readyAt,
  };
};

// Everything whose date has come. Completing a project is the ONLY way a marker
// loses its construction status, so nothing quietly becomes real early.
export const completeDueProjects = (markers, date) => {
  const today = normalizeString(date);
  const completed = [];
  const next = normalizeArray(markers).map((marker) => {
    if (!isUnderConstruction(marker)) return marker;
    const ready = readyAtOf(marker);
    if (!ready || ready > today) return marker;
    completed.push(marker);
    const { status, startedAt, readyAt, ...rest } = marker;
    return { ...rest, foundedAt: ready };
  });
  return { markers: next, completed };
};

// What the model is told is already in the ground, so it stops re-announcing a
// programme every round: a thing that is being built does not need founding again.
export const buildPipelineText = (markers, { ownerCode = "", date = "", capacity = MAX_CONCURRENT_PROJECTS, capacityWhy = "" } = {}) => {
  const cap = Math.max(1, Math.round(Number(capacity) || MAX_CONCURRENT_PROJECTS));
  const running = normalizeArray(markers)
    .filter((marker) => isUnderConstruction(marker) && (!ownerCode || marker.ownerCode === ownerCode))
    .sort((a, b) => readyAtOf(a).localeCompare(readyAtOf(b)));
  if (running.length === 0) return "";
  const lines = running.map((marker) => `• ${marker.name} (${marker.kind}) — 착공 ${marker.startedAt || "?"}, 준공 예정 ${readyAtOf(marker)}`);
  const slots = Math.max(0, cap - running.length);
  return [
    `${running.length} of ${cap} construction slots are in use as of ${normalizeString(date)}${capacityWhy ? ` (capacity from national strength: ${capacityWhy})` : ""}:`,
    ...lines,
    slots > 0
      ? `${slots} slot(s) free. Anything founded beyond that waits for one, and its completion date will say so.`
      : "No slots free. Anything founded now waits for the first of these to finish.",
  ].join("\n");
};

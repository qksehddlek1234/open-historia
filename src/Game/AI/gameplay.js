/*! Open Historia — portions (briefing dossiers + timeout/fallback hardening) © 2026 Nicholas Krol, MIT (see src/Editor/LICENSE). */
import { beginHeavyAiTask, callAI, endHeavyAiTask } from "./main.jsx";
import { getStoredLanguage, languageDisplayName } from "../../runtime/i18n.js";
import { normalizePromptPack } from "./gameplayPrompts.js";
import { getSlimGameplayTool, OP_SCHEMAS, POLITY_CHANGE_SCHEMA, TOP_LEVEL_ITEM_SCHEMAS, validateAgainstSchema, validateGameplayPayload } from "./gameplaySchemas.js";
import { toCountryName } from "../../runtime/ownerNames.js";
import { loadSeaRegionRings } from "../../runtime/seaRegions.js";
import {
  buildActionHistoryText,
  buildChatSummaryText,
  buildDetailedChatHistoryText,
  buildEventHistoryText,
  buildPromptContext,
  getUnconsolidatedEvents,
  playerIdentityDirective,
  renderTemplate,
  resolveHelperValues,
} from "./promptContext.js";
import {
  JSON_URLS,
  loadCountryNames,
  loadRegionCatalog,
  readJson,
  writeJson,
} from "../../runtime/assets.js";
import { isTerritorylessVoiceName } from "../../runtime/internalVoices.js";
import { buildSpeechlessNames } from "../../runtime/speechless.js";
import { assembleRules } from "../../runtime/simulationContracts.js";
import { buildScheduledCard } from "../../runtime/scheduledCard.js";
import { buildAuditMessage, findUnorderedPlayerActs } from "./unorderedActs.js";
import {
  acceptStanding,
  applyEventImpactsToWorld,
  buildActionDisplayText,
  normalizeActionEntry,
  normalizeActions,
  normalizeChatEntry,
  normalizeChats,
  normalizeEvents,
  normalizeGameData,
  normalizeMarkers,
  normalizeWorldState,
  readActionsState,
  readChatsState,
  readEventsState,
  readGameData,
  LAND_UNIT_TYPES,
  readGameStateBundle,
  readWorldState,
  writeActionsState,
  writeChatsState,
  writeEventsState,
  writeGameData,
  writeWorldState,
} from "../../runtime/gameState.js";
import { dedupeGeneratedEvents } from "../../runtime/eventDedup.js";
import {
  difficultyChatDirective,
  difficultyDirective,
  difficultyMeta,
  capShortfall,
  isCleanSuccess,
  normalizeActionOutcome,
  setbackDirective,
  setbackQuota,
  setbackShare,
  totalSetbacksOwed,
} from "../../runtime/difficulty.js";
import { MAP_SETTING_KEYS, getConsolidationSettings, getMapSetting } from "../../runtime/mapSettings.js";
import {
  ACTION_DOMAINS,
  CLAIM_VERIFY_MIN,
  OTHER_DOMAIN,
  SUPPLEMENTAL_MATCH_MIN,
  actionNeedle,
  bestEventForAction,
  coverageScore,
  eventHaystack,
} from "./actionCoverage.js";
import { findStatSheetProblems, sanitizeStatSheet } from "./statSheetSanity.js";
import {
  buildOutlookText,
  buildTimelineText,
  daysBetween,
  eventCarriesAnyImpact,
  foreseeableOutlook,
  materializeTimelineEntry,
  normalizeTimeline,
  selectTimelineEntries,
  timelineWindow,
  writeTimelineEffect,
} from "../../runtime/periodTimeline.js";
import { SEED_REASONS, reconcileTimeline } from "../../runtime/timelineLibrary.js";
import { collapseForCompare, stripMachineSyntax } from "../../runtime/machineSyntax.js";
import { applyRelationReports, buildRelationsText, getRelation, relationLabel } from "../../runtime/diplomacy.js";
import { translateLabel } from "../../runtime/translator.js";
import { activeOrders, isStalledOrder } from "../../runtime/gameState.js";
import {
  LEDGER_TOPICS,
  buildLedgerText,
  buildNearDuplicateText,
  findLedgerNearDuplicates,
  mergeLedger,
  repairLeaderFacts,
} from "../../runtime/campaignLedger.js";
import {
  STAT_FIELDS,
  applyStatChanges,
  buildStatSheetText,
  canonicalRoleSentinel,
  isRoleSentinel,
  mergeStatSheet,
  sameLeaderPerson,
  SHEET_FORMAT,
  tidyStatSheetMoney,
} from "../../runtime/countryStatLedger.js";
import { ensureReferenceEra, resolveLeadership, resolvePoliticalFigures } from "../../runtime/leaderReference.js";
import {
  beginConstruction,
  buildPipelineText,
  completeDueProjects,
  constructionCapacity,
  nextSlotDate,
} from "../../runtime/construction.js";
import { PLACEMENT, loadTerritoryIndex, locateRegion, placementVerdict } from "../../runtime/territory.js";
import { loadNameDictionary, localizeNames, queueUnknownNames } from "../../runtime/localizeNames.js";
import { PLACE, buildPlaceIndex, placeNameVerdict } from "../../runtime/placeName.js";

// How far an entry's event may sit from the entry's own date before it is worth
// mentioning. A jump covers about a month, so anything past a fortnight means the
// model parked it at the end of the window rather than on the day it happened.
const TIMELINE_DATE_DRIFT_DAYS = 14;
// How many missed entries the engine will write in itself in one turn. Not a
// judgement about which ones matter — the rest keep their place in the backlog
// and are named in the console. It exists so a turn cannot open with six
// engine-written events and drown what the model actually wrote.
const TIMELINE_FORCE_LIMIT = 4;
// Close enough that two structures of one kind, one owner and two shared name
// words are the same structure. Chosen from the gap in the measurement recorded
// beside the merge pass — fold-worthy pairs sit at 13-17 km, deliberate ones at
// 34 km and beyond — not from a guess about how big a country is.
const MARKER_MERGE_KM = 25;

const CHAT_HINT_PATTERNS = [
  /\bchat\b/i,
  /\bconference\b/i,
  /\bcontact\b/i,
  /\bdiplomac/i,
  /\bmeet\b/i,
  /\bmessage\b/i,
  /\bnegotiat/i,
  /\boutreach\b/i,
  /\bparley\b/i,
  /\bpeace talk/i,
  /\breach out\b/i,
  /\bspeak with\b/i,
  /\bsummit\b/i,
  /\btalk to\b/i,
  /\btalks? with\b/i,
  /\bпереговор/i,
  /\bвстрет/i,
  /\bдипломат/i,
  /\bсвяз/i,
  /\bчат/i,
  /\bдоговор/i,
];

const DEFAULT_SUGGESTION_TOPICS = [
  {
    title: "Stabilize the domestic front",
    description: "Keep the home front orderly and reduce the chance of internal drift while outside pressure builds.",
  },
  {
    title: "Shape the diplomatic field",
    description: "Use talks, signals, and leverage to narrow hostile options before the next crisis hardens.",
  },
  {
    title: "Prepare military leverage",
    description: "Create visible readiness and practical reserves so rivals must factor your capability into their plans.",
  },
  {
    title: "Secure economic depth",
    description: "Expand the industrial and fiscal base that decides whether later gambles are sustainable.",
  },
];

const cloneValue = (value) => {
  if (value == null) return value;
  if (typeof structuredClone === "function") {
    return structuredClone(value);
  }

  return JSON.parse(JSON.stringify(value));
};

const normalizeString = (value) => String(value ?? "").trim();
const normalizeArray = (value) => (Array.isArray(value) ? value : []);

const parseIsoDate = (value) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(normalizeString(value));
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (year < 1 || month < 1 || month > 12) return null;
  const leapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const daysInMonth = [31, leapYear ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  return day >= 1 && day <= daysInMonth[month - 1] ? { day, month, year } : null;
};

const addIsoDays = (value, days) => {
  const parsed = parseIsoDate(value);
  if (!parsed) return "";
  const date = new Date(0);
  date.setUTCHours(0, 0, 0, 0);
  date.setUTCFullYear(parsed.year, parsed.month - 1, parsed.day);
  date.setUTCDate(date.getUTCDate() + days);
  const year = date.getUTCFullYear();
  if (!Number.isFinite(date.getTime()) || year < 1 || year > 9999) return "";
  return `${String(year).padStart(4, "0")}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`;
};

export const validateTimelineDates = ({ candidate, mode, originDate, targetDate, requireAdvance = false }) => {
  const stopDate = normalizeString(candidate?.stopDate);
  if (!parseIsoDate(originDate)) {
    const eventDates = normalizeArray(candidate?.events).map((event) => normalizeString(event?.date));
    const outputDates = [stopDate, ...eventDates];
    const malformedIsoIndex = outputDates.findIndex((date) => /^\d{4}-/.test(date) && !parseIsoDate(date));
    if (malformedIsoIndex >= 0) {
      const path = malformedIsoIndex === 0 ? "$.stopDate" : `$.events[${malformedIsoIndex - 1}].date`;
      return `${path} must be a real Gregorian date when using YYYY-MM-DD format.`;
    }
    // A whole-day advance was requested but the model kept the clock where it
    // was — the stuck-save signature (it then re-simulates the past instead of
    // the future). Reject on the strict attempt so the retry moves time forward.
    if (requireAdvance && stopDate && stopDate === normalizeString(originDate)) {
      return `$.stopDate must move time forward - it must not equal the current date ${originDate}.`;
    }
    if (parseIsoDate(stopDate)) {
      let previousDate = "";
      for (let index = 0; index < eventDates.length; index += 1) {
        if (!parseIsoDate(eventDates[index])) return `$.events[${index}].date must use the same YYYY-MM-DD format as $.stopDate.`;
        if (eventDates[index] > stopDate) return `$.events[${index}].date must not be later than ${stopDate}.`;
        if (previousDate && eventDates[index] < previousDate) return `$.events[${index}].date must not precede the previous event date.`;
        previousDate = eventDates[index];
      }
    }
    return "";
  }
  if (!parseIsoDate(stopDate)) return `$.stopDate must be a real date in YYYY-MM-DD format; received ${stopDate || "an empty value"}.`;
  if (mode === "auto") {
    if (stopDate <= originDate || stopDate > targetDate) {
      return `$.stopDate must be after ${originDate} and no later than ${targetDate}.`;
    }
  } else if (stopDate !== targetDate) {
    return `$.stopDate must equal the requested target date ${targetDate}.`;
  }

  let previousDate = originDate;
  for (let index = 0; index < normalizeArray(candidate?.events).length; index += 1) {
    const eventDate = normalizeString(candidate.events[index]?.date);
    if (!parseIsoDate(eventDate)) return `$.events[${index}].date must be a real date in YYYY-MM-DD format.`;
    // Events dated ON the origin date are legitimate for every jump length: a
    // sub-day skip stays on that date, and a 1-day jump's window used to be a
    // single legal date ("after Jan 14 and no later than Jan 15") that models
    // constantly missed by dating events "today" — burning the strict attempt
    // (and the whole turn, when the retry ran out of road) over nothing.
    if (eventDate < originDate || eventDate > stopDate) {
      return `$.events[${index}].date must be on or after ${originDate} and no later than ${stopDate}.`;
    }
    if (eventDate < previousDate) return `$.events[${index}].date must not precede the previous event date.`;
    previousDate = eventDate;
  }
  return "";
};

// Attempt-2 salvage for timeline dates: rather than discarding a finished
// (possibly very long) generation to the canned fallback because the model
// simulated a little past the window, pull the strays in. Events dated on or
// before the origin land on the first simulated day, events past the stop land
// on the stop date, unparseable dates become the stop date, and ordering is
// restored monotonically. The CONTENT is untouched — a good story with sloppy
// dates beats canned events every time (a 1-day skip whose model "kept going"
// used to trash the whole turn exactly this way).
export const clampTimelineDates = (candidate, { mode, originDate, targetDate }) => {
  if (!parseIsoDate(originDate)) return; // textual/BCE scenarios use the lenient branch
  let stopDate = normalizeString(candidate?.stopDate);
  if (mode === "auto") {
    if (!parseIsoDate(stopDate) || stopDate <= originDate || stopDate > targetDate) stopDate = targetDate;
  } else {
    stopDate = targetDate;
  }
  candidate.stopDate = stopDate;
  // Mirrors validation: on-or-after the origin is in-window for every jump
  // length, so strays dated before the origin pull up to the origin itself.
  const floor = originDate > stopDate ? stopDate : originDate;
  let previous = floor;
  for (const event of normalizeArray(candidate?.events)) {
    if (!event || typeof event !== "object") continue;
    let date = normalizeString(event.date);
    if (!parseIsoDate(date)) date = stopDate;
    if (date <= originDate) date = floor;
    if (date > stopDate) date = stopDate;
    if (date < previous) date = previous;
    event.date = date;
    previous = date;
  }
};

const sentenceCase = (value) => {
  const text = normalizeString(value);
  if (!text) return "";
  return `${text.charAt(0).toUpperCase()}${text.slice(1)}`;
};

const maybeJsonParse = (value) => {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

// Parse, and when that fails, repair the JSON slips small local models make
// most: trailing commas before } or ], and curly "smart" quotes as string
// delimiters. Repairs are only ever attempted AFTER a strict parse failed, so
// well-formed output is never touched.
// Raw control characters INSIDE string literals are invalid JSON but a common
// local-model habit — especially once descriptions are written in Korean prose
// with real newlines. Escape them, string-aware, so the parse survives.
const escapeControlCharsInStrings = (value) => {
  let out = "";
  let inString = false;
  let escaped = false;
  for (const ch of value) {
    if (escaped) { out += ch; escaped = false; continue; }
    if (ch === "\\") { out += ch; escaped = inString; continue; }
    if (ch === '"') { inString = !inString; out += ch; continue; }
    if (inString && ch === "\n") { out += "\\n"; continue; }
    if (inString && ch === "\r") { out += "\\r"; continue; }
    if (inString && ch === "\t") { out += "\\t"; continue; }
    out += ch;
  }
  return out;
};

// A backslash inside a JSON string may only be followed by one of " \\ / b f n r t u.
// Anything else is invalid JSON, and local models emit it constantly once they are
// writing prose: a caught field report has "…내부 역량 강화에 집중했습니다.\\ 동시에…" —
// a stray backslash before a space, almost certainly a mistyped \\n. JSON.parse
// rejects the whole document over it, and a 13,000-character finished turn was
// discarded three times running because of characters like this one.
//
// The backslash is DROPPED rather than doubled. A model that meant a literal
// backslash in the middle of a Korean sentence is vanishingly rarer than one that
// fumbled an escape, and dropping it leaves the sentence reading correctly.
// String-aware, so a legitimate \\\\ or \\" is never touched.
const repairInvalidEscapes = (value) => {
  let out = "";
  let inString = false;
  for (let i = 0; i < value.length; i += 1) {
    const ch = value[i];
    if (ch === "\\" && inString) {
      const next = value[i + 1];
      if (next !== undefined && !'"\\\\/bfnrtu'.includes(next)) {
        continue; // drop the stray backslash, keep what follows
      }
      out += ch;
      if (next !== undefined) { out += next; i += 1; }
      continue;
    }
    if (ch === '"') inString = !inString;
    out += ch;
  }
  return out;
};

const lenientJsonParse = (value) => {
  const direct = maybeJsonParse(value);
  if (direct) return direct;
  const repaired = value
    .replace(/[“”]/g, '"')
    .replace(/,\s*([}\]])/g, "$1");
  return maybeJsonParse(repaired)
    ?? maybeJsonParse(escapeControlCharsInStrings(repaired))
    ?? maybeJsonParse(repairInvalidEscapes(repaired))
    // Both repairs together: prose in a description can carry a raw newline AND a
    // fumbled escape, and either one alone still fails the parse.
    ?? maybeJsonParse(repairInvalidEscapes(escapeControlCharsInStrings(repaired)));
};

// Truncation salvage: a response cut off mid-JSON leaves ONE unbalanced object
// and the balanced-candidate walk finds nothing — the whole turn then used to
// fall back to canned events (field report: "fallback에 의해 생성된 턴",
// repeatedly). Close whatever is still open — terminating an open string,
// dropping a dangling half-written pair — and parse that. Losing the final
// half-event beats losing the entire turn.
// Close an unbalanced JSON fragment: terminate an open string, drop a trailing
// comma/colon, then append the closers the bracket stack still owes. Returns
// null when the fragment is already balanced.
const closeJsonFragment = (fragment) => {
  const stack = [];
  let inString = false;
  let escaped = false;
  for (const ch of fragment) {
    if (escaped) { escaped = false; continue; }
    if (ch === "\\") { escaped = inString; continue; }
    if (ch === '"') { inString = !inString; continue; }
    if (!inString) {
      if (ch === "{" || ch === "[") stack.push(ch);
      else if (ch === "}" || ch === "]") stack.pop();
    }
  }
  if (stack.length === 0 && !inString) return null;
  const base = (inString ? `${fragment}"` : fragment).replace(/[,:]\s*$/, "");
  return base + stack.map((opener) => (opener === "{" ? "}" : "]")).reverse().join("");
};

const salvageTruncatedJson = (text) => {
  const start = text.indexOf("{");
  if (start === -1) return null;
  let fragment = text.slice(start);
  if (closeJsonFragment(fragment) === null) return null; // balanced — truncation isn't the problem
  // Close and parse; when the very tail is a half-written key or value that no
  // amount of closing fixes, trim back to the previous comma/opener and try
  // again — each trim drops one broken tail element, bounded so a hopeless
  // fragment can't loop.
  // Eight trims was not enough for a real turn. Each trim drops ONE tail element,
  // and a jump cut off inside an actionIds array eight items deep needs eight just
  // to escape that array — so an 8 KB answer with three finished events was being
  // thrown away whole. The parses are cheap; let it work back to the last complete
  // event rather than giving up two elements short.
  for (let attempt = 0; attempt < 60; attempt += 1) {
    const closed = closeJsonFragment(fragment) ?? fragment;
    const parsed = lenientJsonParse(closed);
    if (parsed && typeof parsed === "object") return parsed;
    const cut = Math.max(fragment.lastIndexOf(","), fragment.lastIndexOf("{"), fragment.lastIndexOf("["));
    if (cut <= 0) return null;
    fragment = fragment.slice(0, cut);
  }
  return null;
};

// Every balanced top-level {...} or [...] block in the text, string-aware, in
// order of appearance. A greedy first-{-to-last-} regex dies when the model
// writes prose containing a brace after its JSON, or emits two objects; walking
// candidates and parsing each one survives both.
const balancedJsonCandidates = (text) => {
  const candidates = [];
  let start = -1;
  let depth = 0;
  let inString = false;
  let escaped = false;
  let opener = "";
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    if (start === -1) {
      if (ch === "{" || ch === "[") {
        start = i;
        depth = 1;
        opener = ch;
        inString = false;
        escaped = false;
      }
      continue;
    }
    if (escaped) {
      escaped = false;
    } else if (ch === "\\") {
      escaped = inString;
    } else if (ch === '"') {
      inString = !inString;
    } else if (!inString) {
      if (ch === "{" || ch === "[") depth += 1;
      else if (ch === "}" || ch === "]") {
        depth -= 1;
        if (depth === 0) {
          candidates.push(text.slice(start, i + 1));
          start = -1;
        }
      }
    }
  }
  // Objects first: the payload is an object, and a stray inline array (e.g. in
  // the model's commentary) must not shadow it.
  return candidates.sort((a, b) => (a[0] === "{" ? 0 : 1) - (b[0] === "{" ? 0 : 1));
};

export const extractJsonPayload = (rawText) => {
  // Reasoning models (and several Ollama chat templates) prepend a think block
  // the strict parser chokes on; the answer follows it.
  const text = rawText
    .replace(/<think>[\s\S]*?<\/think>/gi, "")
    .replace(/^[\s\S]*?<\/think>/i, "")
    .trim();

  const direct = lenientJsonParse(text);
  if (direct) return direct;

  // Any fenced block, not just ```json — small models label fences ```JSON,
  // ```javascript, or not at all.
  for (const fence of text.matchAll(/```[a-z]*\s*([\s\S]*?)```/gi)) {
    const parsed = fence[1] ? lenientJsonParse(fence[1].trim()) : null;
    if (parsed && typeof parsed === "object") return parsed;
  }

  for (const candidate of balancedJsonCandidates(text)) {
    const parsed = lenientJsonParse(candidate);
    if (parsed && typeof parsed === "object") return parsed;
  }

  // Last resort: the output was cut off mid-JSON — close it and salvage.
  return salvageTruncatedJson(text);
};

const loadPromptCatalog = async ({ force = false } = {}) =>
  normalizePromptPack(await readJson(JSON_URLS.prompts, { defaultValue: {}, force }));

const MILITARY_ACTION_PATTERN =
  /\b(troop|army|armies|attack|invade|invasion|deploy|fleet|navy|naval|air force|airforce|bomb|siege|offensive|battalion|regiment|garrison|blockade|mobiliz)/i;

// Reach/logistics doctrine for the AI. Deliberately CONDITIONAL: it only
// rides along when the turn actually involves forces (units on the map or
// military-sounding orders), so peaceful turns don't pay the context cost.
const buildMilitaryFeasibilityText = (world, actionsText) => {
  const hasUnits = normalizeArray(world?.units).length > 0;
  if (!hasUnits && !MILITARY_ACTION_PATTERN.test(actionsText || "")) {
    return "";
  }

  return [
    "",
    "MILITARY FEASIBILITY — test every deploy request, move/attack order and your own unitOps against the era and the unit's type before honoring it:",
    "- Era reach: before ~1500, armies march on foot or horse and cross water only by coastal shipping — intercontinental operations are impossible. ~1500–1850 (age of sail): overseas action needs fleets and friendly ports and takes months. 1850–1945: rail and steamships speed logistics; aircraft stay short-ranged until the 1940s. After 1945: global power projection belongs only to major powers with bases, carriers or allies along the route.",
    "- Unit type: air units are fastest but need airbases or carriers within range and cannot hold ground; naval units move only by sea; infantry, armor and artillery crawl overland and need supply lines; garrisons do not travel.",
    "- Distance: compare the unit's coordinates with the target's. An order beyond plausible reach or pace is NOT executed as given — reject it, or convert it into a partial advance with an event explaining the delay, the transport it would need, or why it failed.",
    "- Never teleport units: each move op may only cover what that unit could actually travel in the elapsed time; long campaigns should progress across several turns.",
  ].join("\n");
};

const STAT_SHEETS_STORAGE_KEY = "oh-stat-sheets";

const readStoredStatSheets = () => {
  try {
    return JSON.parse(localStorage.getItem(STAT_SHEETS_STORAGE_KEY)) ?? {};
  } catch {
    return {};
  }
};

// International reputation the AI evolves each turn (world.internationalReputation),
// surfaced to prompts. Falls back to the last stat sheet the player viewed, then a
// neutral 50 — so it is never "unknown".
const buildPlayerPolityReputationText = async (bundle) => {
  const playerCode = normalizeString(bundle.game.country);
  if (!playerCode) {
    return "No player polity is currently set.";
  }
  const world = bundle.world && typeof bundle.world === "object" ? bundle.world : {};
  let reputation = Number(world.internationalReputation?.[playerCode]);
  if (!Number.isFinite(reputation)) {
    const gameKey = normalizeString(bundle.game.id || bundle.game.name || "game");
    reputation = Number(readStoredStatSheets()[`${gameKey}:${playerCode}`]?.sheet?.indices?.internationalReputation);
  }
  if (!Number.isFinite(reputation)) {
    reputation = 50;
  }
  const clamped = Math.max(0, Math.min(100, Math.round(reputation)));
  const band = clamped >= 70 ? "well-regarded" : clamped >= 40 ? "mixed" : "poor";
  return `International reputation: ${clamped}/100 (${band}).`;
};

// HOOK 3 (docs/STAT-HOOKS.md): the player's own sheet, compressed to a few
// lines, for the turn-facing prompts. The audit found the main generation
// never saw these numbers at all — the model wrote events for a country whose
// stability it did not know. ~100 tokens; sentinel values ("(없음)"/"(미확인)")
// are omitted the same way the pane hides them. HOOK 4 rides on the end: an
// autonomy below 50 is named as an attack surface, feeding the MATERIAL BASE
// lens with a real figure instead of a guess — and nothing is added when the
// numbers are healthy, because padding a dead lens is worse than silence.
const buildPlayerStatSummaryText = (bundle) => {
  try {
    const playerCode = normalizeString(bundle.game?.country);
    if (!playerCode) return "";
    const world = normalizeWorldState(bundle.world);
    const { __asOf: _asOf, __format: _format, ...base } = world.countryStats?.[playerCode] ?? {};
    if (Object.keys(base).length === 0) return "";
    const sheet = mergeStatSheet(base, world.countryStatChanges?.[playerCode]);
    const clean = (value) => {
      const text = normalizeString(value);
      return !text || text.startsWith("(") ? "" : text;
    };
    const number = (value) => (Number.isFinite(Number(value)) && Number(value) > 0 ? Number(value) : null);
    const idx = sheet.indices || {};
    const eco = sheet.economy || {};
    const lines = [];
    const who = [clean(sheet.leader), clean(sheet.deputy)].filter(Boolean).join(" · ");
    const stability = number(sheet.stability);
    if (who || stability !== null) {
      lines.push(`지도부 ${who || "(미상)"}${stability !== null ? ` — 안정 ${stability}` : ""}`);
    }
    const indexParts = [
      ["주권", number(idx.sovereignty)], ["식량자립", number(idx.foodAutonomy)],
      ["에너지자립", number(idx.energyAutonomy)], ["경제독립", number(idx.economicIndependence)],
      ["치안", number(idx.internalSecurity)], ["평판", number(idx.internationalReputation)],
    ].filter(([, value]) => value !== null);
    if (indexParts.length > 0) lines.push(`지수: ${indexParts.map(([label, value]) => `${label} ${value}`).join(" · ")}`);
    const ecoParts = [
      clean(eco.gdp) && `GDP ${clean(eco.gdp)}${clean(eco.gdpGrowth) ? ` (${clean(eco.gdpGrowth)})` : ""}`,
      clean(eco.unemployment) && `실업 ${clean(eco.unemployment)}`,
      clean(eco.inflation) && `물가 ${clean(eco.inflation)}`,
    ].filter(Boolean);
    if (ecoParts.length > 0) lines.push(`경제: ${ecoParts.join(" · ")}`);
    const food = number(idx.foodAutonomy);
    const energy = number(idx.energyAutonomy);
    const vulnerable = [
      food !== null && food < 50 ? `식량자립 ${food}` : "",
      energy !== null && energy < 50 ? `에너지자립 ${energy}` : "",
    ].filter(Boolean);
    if (vulnerable.length > 0) {
      lines.push(`취약: ${vulnerable.join(", ")} — 봉쇄·제재·공급 위기에서 이 의존은 공격면이다.`);
    }
    return lines.join("\n");
  } catch {
    return "";
  }
};

// The rules the prompt is actually built from live in the SAVE, not the
// scenario (promptContext.js reads bundle.world.simulationRules). Read the same
// place, so a campaign that has diverged keeps the rules it diverged with.
const currentWorldForRules = async () => {
  try {
    return await readWorldState();
  } catch {
    return null;
  }
};

const buildTemplateVariables = async (bundle, options = {}) => {
  const variables = await buildPromptContext(bundle, options);
  return {
    // CALL-SITE EXTRAS HAVE TO SURVIVE THIS.
    //
    // buildPromptContext destructures a FIXED list of options and returns a
    // fixed set of variables, so anything a caller invents — standingFacts,
    // statSheets — was silently dropped here and the call-time prompt block that
    // reads it appended nothing. That is what happened to the campaign ledger's
    // [Standing Facts Now] block: the model has been asked to update keys it was
    // never shown, which is precisely how it ends up inventing a second key for
    // a subject that already has one. Spread first so a real context variable
    // still wins over an option of the same name.
    ...options,
    ...variables,
    playerPolityReputationContext: await buildPlayerPolityReputationText(bundle),
    playerStatSummary: buildPlayerStatSummaryText(bundle),
    unitsSummary:
      variables.unitsSummary +
      buildMilitaryFeasibilityText(bundle.world, buildActionHistoryText(bundle.actions)),
  };
};

// Give the AI real time: local/self-hosted models (and reasoning modes) often
// need well over a minute per turn. The old 12s default silently discarded
// their answers and served the canned fallback instead — turns "completed"
// with nothing to show. The UI has spinners; waiting beats silently wrong.
// Capability reference appended to every timeline jump (see runJsonTask below): the
// full menu of world-changing levers the tool schema exposes, so the model always ends
// its system prompt with an explicit list of what it can do and how. Injected at call
// time so it reaches existing frozen-prompt games too.
const ACTIONS_REFERENCE = "[Actions You Can Take]\nThis is the full menu of levers you have to change the world. Everything you change rides on an event's \"impacts\" object, except the two whole-jump levers noted at the end. Reach for the RIGHT lever, and NEVER narrate a change in an event's text without also emitting the impact that makes it real — narration and world state must always agree.\n\n• regionTransfers — Move a region to a new owner. This is the most important lever and the one most often forgotten: use it for every conquest, cession, sale, liberation, annexation, or hand-over, one entry per region. Shape: {\"regionId\":\"<exact id, or the plain region name if you don't know the id>\",\"regionName\":\"\",\"fromCode\":\"\",\"toCode\":\"<new owner code>\"}. An event whose text says land changed hands but that carries no regionTransfers is invalid output and silently breaks the map. Transfer in order of proximity to the attacker's territory; never hand over an isolated region ringed by enemy land without a naval or airborne reason.\n\n• polityChanges — Create, rename, recolor, or re-describe a polity. One entry can do any combination: {\"code\":\"<polity code>\",\"name\":\"<new name, only if it changed>\",\"color\":\"#RRGGBB (only if it changed)\",\"aliases\":[\"...\"],\"reputation\":0-100,\"tags\":[\"...\"],\"stats\":{...},\"note\":\"<why>\"}. Create a polity by giving a new code with a name and color. Change name/color ONLY on a regime change (never for a mere new leader). On an ideological or alignment shift, rewrite the COMPLETE tags list (it is a full replacement, not a delta). Set reputation (0 = pariah, 100 = universally trusted) only when this turn's events actually moved a polity's standing. REPUTATION IS THE VALUE, NEVER THE CHANGE: if a country stands at 57 and this event earns it a little credit, write 58 — writing 1 does not mean \"+1\", it means the world now regards that country as a pariah. A standing built over years does not move more than a few points on one event, and a collapse of tens of points needs an event that explains it (an invasion, a massacre, a treaty torn up, sanctions, a coup). The engine rejects a swing its event cannot account for and keeps the old value, so a delta written here is simply lost. Set \"personality\" — {\"aggression\":0-100,\"riskTolerance\":0-100,\"loyalty\":0-100,\"expansionism\":0-100,\"vengefulness\":0-100} — only when an event genuinely reshapes HOW a country acts (a coup, a crushing defeat, a betrayal it will not forget, a generational turn), and send only the axes that moved. A country's national statistics move ONLY through \"stats\" here — send just the fields that changed; everything omitted keeps its prior value. Every 0-100 figure in \"stats\" (stability and each index) is a VALUE, never a change, exactly like reputation: a country at 64 stability that had a good month is 66, not 2. These are standings built up over years — they move a few points on an ordinary event, and a swing of tens needs an event that explains it (a coup, riots, martial law, a war ending, order restored). The engine rejects a swing its event cannot account for and keeps the old value. That includes WHO LEADS: when a leader is overthrown, assassinated, dies, resigns or is voted out, put the successor in stats.leader as OFFICIAL TITLE + name (\"대통령 권한대행 황교안\", \"임시정부 수반 …\" — never a bare name and never a generic word like 지도자), together with stats.government and stats.stability when those moved too. An event that narrates a leader falling but leaves stats.leader untouched leaves the OLD name standing on that country's stat sheet, so the story and the sheet disagree.\n\n• unitOps — Move the war on the map with battalions. Four ops:\n    {\"op\":\"spawn\",\"unit\":{\"name\":\"\",\"type\":\"infantry|armor|air|naval|artillery|garrison\",\"ownerCode\":\"\",\"strength\":1-1000,\"lng\":0,\"lat\":0,\"regionId\":\"\"}}\n    {\"op\":\"move\",\"unitId\":\"<existing id>\",\"toLng\":0,\"toLat\":0,\"regionId\":\"\",\"note\":\"\"}\n    {\"op\":\"strength\",\"unitId\":\"<existing id>\",\"strength\":0-1000,\"note\":\"\"}\n    {\"op\":\"remove\",\"unitId\":\"<existing id>\",\"note\":\"\"}\n  Spawn units for mobilizations and reinforcements, move them to reflect offensives, lower their strength as they take losses, and remove them only when destroyed or disbanded. Only reference unit ids that appear in the current-units list. When a front is decisively won, pair the advance with a regionTransfers entry so the border follows the troops.\n\n• markerOps — Place, remove, or rename a named structure or city. Three ops:\n    {\"op\":\"build\",\"marker\":{\"name\":\"\",\"kind\":\"<lowercase, e.g. military base / port / embassy / airfield / city>\",\"ownerCode\":\"\",\"lng\":0,\"lat\":0,\"note\":\"\",\"foundedAt\":\"\"}}\n    {\"op\":\"remove\",\"name\":\"<exact existing name>\",\"note\":\"\"}\n    {\"op\":\"rename\",\"name\":\"<current name>\",\"newName\":\"<new name>\",\"note\":\"<why>\"}\n  A MARKER IS A PLACE — something that stands at a coordinate and can be visited, captured or bombed: a base, a port, a plant, a research campus, a city, a monument. A programme, a policy, a doctrine, an algorithm, a target list or a plan is NOT a marker however important it is; the event that created it already tells the player about it, and pinning it to the map turns the map into a list of initiatives. The engine drops any marker whose name is a system or a plan rather than a site. Emit build whenever an event founds or constructs a place, remove when one is destroyed, and rename when a city or structure is renamed (rename works on existing map cities too — a city renamed after a leader or ideology, a capital re-designated, a conquered city given the conqueror's name). Structures NEVER move borders: a facility one polity builds inside another's land does not transfer the region, and ownerCode is who runs the facility, not who owns the ground.\n\n• createdChats — Have another polity open a diplomatic chat with the player BECAUSE of this event (a war scare prompting mediation, a border incident prompting an ultimatum, a windfall prompting a trade delegation). Shape: {\"countries\":[\"...\"],\"title\":\"<names the purpose>\",\"speaker\":\"<the initiating polity — never the player>\",\"openingMessage\":\"<that leader's first message, in their voice>\"}. The other side always speaks first; a blank or untitled chat is invalid.\n\n• actionIds — List the ids of the player's queued actions that this event resolves, so the game can clear them from the queue.\n\nWhole-jump levers (top level of your output, NOT inside an event):\n• diplomaticOutreach — Polities reaching out to the player on their OWN initiative this period — treaty feelers, trade proposals, non-aggression pacts, mediation offers, warnings, summit invitations — not tied to any single event. Same shape as createdChats. Open one whenever a polity plausibly would, rather than defaulting to none.\n• catalyst — An interactive branching scene handed to the player when a moment genuinely demands their decision, or null when none is warranted. Shape: {\"title\":\"\",\"premise\":\"\",\"opening\":\"\",\"choices\":[\"...\", \"...\", up to 5 distinct]}.\n\nKeep the total across createdChats and diplomaticOutreach to at most 3 per jump, and only when the approach genuinely serves the sender's interests.";

const runJsonTask = async (taskKey, {
  fallback,
  // Called with the RAW reply text when every JSON reading failed — lenient
  // parse, fences, balanced candidates, truncation salvage, all of it. A task
  // whose payload has a rigid row shape can still pull its rows out of a reply
  // whose JSON is poisoned beyond repair (round 10 live: one unescaped quote
  // inside a Korean note desyncs every string-aware walker at once, and two
  // clean-looking rating replies in a row parsed as nothing). Returns the
  // payload or null; runs BEFORE the "nothing parseable" alarm.
  parseFallback,
  // Called on every parsed candidate BEFORE schema validation, so a task can
  // fill in fields the model dropped. Local models write a flawless answer and
  // then omit one required scalar (captured: 18 perfect events, no "summary"),
  // which used to discard the whole turn over a field the engine can derive.
  repairPayload,
  signal,
  timeoutMs = getMapSetting(MAP_SETTING_KEYS.limitAiGeneration) ? 120000 : 0,
  userMessage,
  validatePayload,
  variables,
}) => {
  const prompts = await loadPromptCatalog();
  let difficultyForTask = "";
  const helperValues = resolveHelperValues(prompts.helpers, variables);
  // THE CONTRACTS GO IN HERE, not at the end of the prompt.
  //
  // build-preset no longer concatenates them into the board's rules; this is
  // where they rejoin, per task, from src/runtime/simulationContracts.js. The
  // position matters more than it looks: `${HISTORICAL_PRESET_SIMULATION_RULES}`
  // sits in the MIDDLE of most templates, and the A/B that started all of this
  // measured the same clause at 0.36 buried in a block against 0.48 standing
  // alone. Appending the contracts after the render would move every one of them
  // to the end of every prompt — a change to the experiment, made silently, in
  // the exact dimension the experiment is about.
  //
  // With the matrix all-on this reproduces the old string byte for byte.
  const contractRules = assembleRules(await currentWorldForRules(), taskKey);
  let systemPrompt = renderTemplate(prompts.tasks[taskKey], {
    ...variables,
    ...helperValues,
    ...(contractRules ? { HISTORICAL_PRESET_SIMULATION_RULES: contractRules } : {}),
  });

  // The chosen difficulty steers every simulation task (see runtime/difficulty.js).
  try {
    const game = await readGameData();
    systemPrompt = `${systemPrompt}\n\n${difficultyDirective(game.difficulty)}`;
    // …and on a jump it also owes the player a measured amount of trouble. This
    // block goes LAST-ish rather than here so it is not buried under the dozen
    // longer directives that follow; see the append below the actions reference.
    difficultyForTask = game.difficulty;
  } catch {
    // Without game data the task still runs at its default temperament.
  }

  // Player-authored simulation rules (Settings → Prompts & Rules) ride on every
  // simulation task — the in-game equivalent of a preset's simulation rules.
  if (["actions", "jumpForward", "autoJumpForward", "catalystCreation", "catalystExecutor", "eventConsolidator"].includes(taskKey)) {
    try {
      const worldForRules = normalizeWorldState(await readWorldState());
      const customRules = normalizeString(worldForRules.customRules);
      if (customRules) {
        systemPrompt = `${systemPrompt}\n\n[Simulation Rules]\nThe player has authored the following simulation rules for this campaign. Treat them as binding preset rules, on par with the directives above:\n${customRules}`;
      }
    } catch {
      // Rules unavailable — the task still runs without them.
    }
  }

  // Player agency: jumps must never sign the player up for landmark decisions.
  // Appended here (not only in defaultPrompts.json) because every game carries
  // its own frozen copy of the task prompts — a directive added at call time is
  // the only way the rule reaches campaigns that already exist. Field report:
  // "the AI just makes events saying that you form a treaty with another
  // country ... it just doesn't give you a choice and makes it an event."
  if (["jumpForward", "autoJumpForward"].includes(taskKey)) {
    const playerName = normalizeString(variables.playerPolity) || "the player's polity";
    // What the scenario says happens in this window. Appended at call time so it
    // reaches campaigns whose prompt pack predates the feature.
    const timelineBlock = normalizeString(variables.periodTimelineText);
    if (timelineBlock) systemPrompt = `${systemPrompt}\n\n${timelineBlock}`;
    // What the wider world has ALREADY been reported as doing. The engine drops a
    // world event that retells a recent one, and dropping alone is subtraction:
    // the turn simply ends with fewer. Naming the stories already told is the
    // half that produces something instead — and the general "recent events"
    // section cannot do this job, because a turn with a dozen player events
    // pushes every world headline out of its window.
    const alreadyToldBlock = normalizeString(variables.recentWorldText);
    if (alreadyToldBlock) systemPrompt = `${systemPrompt}\n\n${alreadyToldBlock}`;
    // The player's standing relations (runtime/diplomacy.js) — so narration and
    // the recorded state of the world cannot quietly disagree: an "ally" in the
    // text is an ally on the books, and a hostile power does not offer a treaty
    // out of nowhere without the standing moving first.
    const standingRelationsBlock = normalizeString(variables.standingRelations);
    if (standingRelationsBlock) {
      systemPrompt = `${systemPrompt}\n\n[Standing Relations]\nThe player's recorded standing with each power, warmest first. Narrate CONSISTENTLY with these: allies act like allies, hostile powers do not casually cooperate, and a standing only changes through events that would genuinely change it.\n${standingRelationsBlock}`;
    }
    systemPrompt = `${systemPrompt}\n\n[Player Agency]\n${playerName} is controlled by a human player. Never commit ${playerName} to a major decision the player did not actually make: do not sign treaties, alliances, ceasefires, surrenders, trade pacts, unions, or other binding agreements on the player's behalf, do not accept or reject offers for them, and do not have ${playerName} take landmark unilateral action (declaring war, ceding territory, changing government) unless it directly executes one of the player's planned actions, chat replies, or explicit requests. When another polity seeks such an agreement or decision from the player, present it as something the player can answer: a diplomaticOutreach entry or an impacts.createdChats chat where the counterpart speaks first and makes the proposal, or an event describing the offer as OPEN and awaiting the player's response. Events remain free to narrate what other polities do among themselves and to resolve the player's own queued actions exactly as ordered.`;
    // Map truth: the recurring field report is the OPPOSITE failure — invasions
    // narrated turn after turn with zero regionTransfers, so the map never moves.
    // Appended at call time for the same reason as [Player Agency]: existing
    // campaigns carry frozen prompts, so a defaultPrompts.json rule never
    // reaches them. This also disarms an over-cautious reading of the agency
    // rule above ("don't act for the player") as "don't move the map".
    systemPrompt = `${systemPrompt}\n\n[Naming]\nName every NEWLY founded programme, structure, system or initiative in the game's language — never coin an English brand name for something new. Anything already established under an English name keeps that exact name, because continuity passes match it by name.`;
    systemPrompt = `${systemPrompt}\n\n[Map Truth]\nTerritorial narration and the map must never disagree. If an event's title or description says territory was captured, seized, occupied, annexed, ceded, liberated, retaken, or otherwise changed hands, that SAME event MUST carry impacts.regionTransfers entries covering every region it names or implies — a capture claim with no regionTransfers is invalid output that breaks the map. When you do not know a region's exact id, put its plain name in regionId and the engine will resolve it; emit one entry per affected region. Resolving ${playerName}'s own ordered military operations into their territorial outcomes is REQUIRED and is never a player-agency violation: the agency rule restricts unprompted decisions, not the map consequences of offensives the player actually ordered. In an active war, sustained successful offensives normally transfer regions every jump. If nothing genuinely changed hands this period, keep capture language out of the event text.`;
    // The world must move on its own (field report: "내 행동만 진행되고 있어" —
    // only the player's actions advanced; other polities sat still, unlike the
    // original game where the world visibly acts every turn). Local models
    // anchor hard on the queued-actions list and answer with player-echo
    // events only, so the simultaneity rule is stated explicitly, with a floor.
    systemPrompt = `${systemPrompt}\n\n[World Activity]\n${playerName} is ONE actor among many — the world NEVER waits for the player. Every jump MUST also advance the wider world on its own: alongside the events resolving the player's actions, include events in which OTHER polities act on their OWN initiative and interests, with NO involvement from ${playerName} at all — offensives and fronts moving in ongoing wars elsewhere, rival powers maneuvering against each other, coups, elections, uprisings, economic booms and crashes, disasters, technological and cultural developments. Aim for a rough balance: about half the events player-related, half the wider world.\n\nHOW TO MARK THEM, exactly — this is the part that keeps being got wrong, and a turn where every event is about the player is a failed turn:\n• A world event MUST set "playerRelated": false and "kind": "world". If ${playerName} appears anywhere in the event, it is NOT a world event — "${playerName} and X hold joint exercises" is a PLAYER event and does not count.\n• Player-related events set "playerRelated": true and use "player" (or "diplomacy" for talks, "military" for fighting) as their kind — do not label them "world".\n• Name the actual polity acting, taken from the map description, and make it the SUBJECT of the sentence.\n• Ground them in what was really happening in this period wherever the scenario is historical: the real elections, offensives, treaties, crises, launches and economic shifts of these exact months, in the regions the map actually contains — not generic filler.\n• World events carry their own impacts (regionTransfers, unitOps, polityChanges, markerOps) exactly like player-related ones — an off-screen war that never moves the map is not happening.`;
    // No restating: the model is shown the recent timeline as context and, left
    // unchecked, re-narrates events it already reported — each restatement gets a
    // fresh id, so the same event stacks up and shows turn after turn. A content-key
    // de-dup on the write path (dedupeGeneratedEvents) drops exact/same-date
    // restatements; this directive stops the "rolling-date" ones (the same situation
    // re-narrated under each new turn's date) that a de-dup can't catch. Appended at
    // call time so existing frozen-prompt campaigns get it too.
    systemPrompt = `${systemPrompt}\n\n[New Developments Only]\nThe events shown to you above have ALREADY happened and appear only as context. Do NOT restate, rephrase, re-report, or re-narrate them. Emit ONLY genuinely NEW developments that occur during THIS period. If an ongoing situation (a war, a crisis, an occupation) has no new development this period, do not emit an event for it.`;
    // Place renaming: appended at call time so existing frozen-prompt campaigns get it
    // too; the markerOps rename op ships via the LIVE tool schema either way.
    systemPrompt = `${systemPrompt}\n\n[Place Renaming]\nYou may rename places when the story warrants it (a city renamed after a leader or ideology, a capital re-designated, a colonial name replaced, a conquered city given the conqueror's name). Emit an impacts.markerOps entry {"op":"rename","name":"<current name>","newName":"<new name>","note":"<why>"}. This works on structures you built AND on existing map cities. Do it sparingly and only when a real event motivates it.`;
    // Action bookkeeping: pairs with the precise resolution in applySimulationResult —
    // resolving an action means naming its id, and clearActions stops being a blanket
    // "wipe the queue" flag (field report: unexecuted actions kept disappearing).
    systemPrompt = `${systemPrompt}\n\n[Queued Actions Bookkeeping]\nEvery queued player action shown in the context has an id (the [id: …] tag on its line). When one of your events resolves, executes, or consumes a queued action, list that action's id in that event's impacts.actionIds. Set clearActions to true ONLY if every queued action was genuinely resolved this jump; if any action remains pending or unaddressed, set clearActions to false so it stays queued for the player's next turn.`;
    // Long-queue coverage: part of why this project exists — the original
    // game's habit of executing the FIRST few stacked actions and silently
    // discarding the rest of a long queue. State full coverage as a hard
    // requirement; the coverage validator + supplemental pass in
    // simulateTimelineJump enforce it mechanically.
    systemPrompt = `${systemPrompt}\n\n[Action Coverage]\nCover EVERY queued action listed in the context — the LAST entries in the list matter exactly as much as the first. Each queued action must be executed, attempted, or explicitly frustrated by one of your events, and that event must list the action's id in impacts.actionIds (one event may cover several related actions). With a long queue, keep each event concise rather than dropping later actions. Only an action that genuinely cannot occur in this period may stay queued — exclude its id and set clearActions to false.`;
  }

  // Reputation context: how the world currently regards the player, and how the
  // model should let it bias behaviour and evolve it via polityChanges.
  // Territory is owned by REGIONS, but the model kept naming CITIES in regionTransfers
  // (e.g. "Toulouse"), which match no region and are silently dropped — the map never
  // moves though the event narrates a capture. Force region names, and teach the
  // take-the-whole-region (default) vs capture-only-the-city (markerOps) distinction.
  // Powers used to have no temperament that survived a turn: the same neighbour
  // shrugged off a border incident one jump and mobilised over a smaller one the
  // next, because the model re-improvised every country's disposition each time.
  // The profile numbers in the world summary are the fix, and they are inert unless
  // the model is told they DECIDE things rather than describe them.
  // Who the player is, wherever the player is written about or spoken to. The
  // catalyst tasks matter as much as the jump here: a branching scene is the one
  // place the game puts words in a character's mouth ADDRESSING the player, which
  // is exactly where a head-of-state title lands wrongly.
  if (["jumpForward", "autoJumpForward", "catalystCreation", "catalystExecutor", "catalystSummary", "gameMaster"].includes(taskKey)) {
    systemPrompt = `${systemPrompt}\n\n${playerIdentityDirective(variables?.playerPolity)}`;
  }

  if (["jumpForward", "autoJumpForward", "catalystCreation", "catalystExecutor"].includes(taskKey)) {
    systemPrompt = `${systemPrompt}\n\n[Power Character]\nEach power in the world summary carries a standing profile — aggr, risk, loyal, expand, grudge, each 0-100. These are not flavour: they DECIDE what a country does when something happens to it, and the same country must answer the same provocation the same way this jump as last.\n• Reaching for force is aggr, and how bad a position it will accept is risk. A power at aggr 25 protests, sanctions and appeals to others where one at aggr 80 mobilises. A power at risk 20 does not open a front it might lose, however angry it is.\n• Whether a commitment holds when it turns expensive is loyal. A guarantor at loyal 80 honours its guarantee against its own interest; one at loyal 25 finds a reason not to, and its partners should not be surprised.\n• Wanting more land is expand, and it is separate from aggr: a power can be dangerous without being acquisitive (it strikes, then goes home) or acquisitive without being reckless (it buys, pressures and settles).\n• Being wronged is answered according to grudge. A power at grudge 80 that lost territory or was betrayed comes back to it later — turns later — and that is a thread you should actually pick up rather than a mood you note once.\nCOALITIONS follow from the same numbers rather than from convenience. Powers rally to a threatened state when they share tags or alignment with it, when the aggressor's expand and aggr make them plausibly next, and when their own loyal is high enough to pay for it; a low-loyal power hedges, stalls, or extracts a price instead of joining. A high-aggr, high-expand power that keeps taking land should provoke exactly that reaction from its neighbours, unprompted, and a coalition that forms should hold or fracture according to its members' loyal, not according to what is convenient for the story.\nSEEDING: a profile marked with a * before its brackets has never been set — those numbers are a placeholder, not a judgement. For any starred power that acts or is acted upon this jump, set its REAL character once via impacts.polityChanges.personality, from what that country actually was in this period: its history, its posture, its record of keeping or breaking agreements, how it had behaved toward its neighbours by this date. Do that for a handful of the powers in play each jump rather than all of them at once, and never re-seed one that is already set.\nOnce set, leave a character alone unless an event genuinely reshapes the country — a coup, a crushing defeat, a betrayal, a generational turn — in which case move only the axes that changed and say why in the note. A character that moves every jump is not a character.`;
  }

  // CONTINUE THINGS INSTEAD OF FOUNDING THEM TWICE.
  //
  // buildMarkersSummaryText has existed all along and reached no prompt: markers
  // were built into the variable set and never injected, so the model writing a
  // turn could not see a single structure already standing on the map. Asked to
  // expand a semiconductor cluster it founded last turn, it had no way to know the
  // cluster existed, and founded another one. Measured on the turn that prompted
  // this: nine markerOps, eight of which the de-collision pass had to push off
  // something already there — they were not new places, they were the same places
  // again.
  //
  // MEASURED, NOT ASSUMED: these three used to ride in simulationRules, appended
  // to EVERY task's rules by build-preset. A/B on gemma4-oh:12b (wwii-1939,
  // seven runs per arm — docs/analysis/contract-ab-2026-08-09.md) found:
  //   • battle figures: 0.00 of combat events carried numbers with the clause
  //     absent, 0.36 inside the full contract block, and 0.48 when the clause
  //     was the ONLY contract present. It works, and the block was burying it.
  //   • the scheduled-events card never survived any prompt position (0 of 7 in
  //     the rules, 1 of 3 at the end of the prompt), so it is not here at all —
  //     it became its own pass with the engine formatting the card. Rule #2.
  // These two move here, where they apply — only a jump narrates combat or ends
  // a war — instead of sitting in the rules the chat and advisor tasks carry.
  if (["jumpForward", "autoJumpForward"].includes(taskKey)) {
    systemPrompt = `${systemPrompt}

[Battles Are Reported With Numbers]
Any event that narrates fighting — an assault, a siege, a landing, an air raid, a naval action, a border clash — states what each side committed and what each side lost, in figures, at whatever precision the period can actually know: divisions and thousands of men in an industrial war, hundreds in a colonial skirmish, ships and aircraft where those are the currency. Keep the arithmetic consistent from turn to turn — an army that lost half its strength last month does not attack at full strength this month — and where a figure is contested or propagandised, say whose figure it is. Without numbers a war is twenty turns of adjectives and the player cannot tell a victory from a defeat.

[Named Treaties]
When fighting stops by agreement, record the settlement as "Treaty of <place>" — the town where it was signed, in the period's own naming habit — and state its actual terms: what changed hands, what was paid, what was forbidden, who guaranteed it. A named treaty is something later turns can invoke, revise, evade or resent; an unnamed settlement is forgotten by the next consolidation and the grievance it should have created never exists. An armistice that settles nothing is not a treaty.`;
  }

  // Naming the existing one is enough to fix it, because applyMarkerOps replaces a
  // build that matches an existing name rather than stacking a second marker.
  if (["jumpForward", "autoJumpForward"].includes(taskKey)) {
    systemPrompt = `${systemPrompt}\n\n[Structures Already On The Map]\n${normalizeString(variables?.markersSummary) || "No structures have been built during play yet."}\n\nMost of what a country does in a period CONTINUES something rather than starting it: a plant is expanded, a base is upgraded, a programme reaches its next phase, a line is extended. When an event advances something in that list, emit a markerOps build carrying that structure's EXACT existing name (and its id where you have it) with the note rewritten to say what changed — that updates it in place. Only build under a NEW name when the event genuinely founds something that did not exist, and then put it where that thing would actually be rather than beside the last one you placed. The same goes for what a structure represents: a research programme, a shipyard, a corridor and a listening post are different things, so do not re-found one under a slightly different name because the wording of this event differs from the last.`;
  }

  // The seas are ownable regions on every map now (runtime/seaRegions.js), so
  // naval control is finally SHOWABLE — a blockade, a claimed exclusive zone,
  // command of a strait. The model has to be told, or it keeps narrating fleets
  // that move nothing and the water stays blank.
  if (["jumpForward", "autoJumpForward"].includes(taskKey)) {
    systemPrompt = `${systemPrompt}\n\n[Naval Control]\nThe seas, oceans, gulfs and straits on this map are REGIONS like any other (ids beginning "sea_"), and they are how command of the water is shown. Transfer one with impacts.regionTransfers when a polity genuinely establishes control of it — a decisive naval victory, an effective blockade, a declared and enforced exclusive zone, a basing or straits agreement — and transfer it away when that control is broken or handed back. Control of water is looser than control of land: it follows fleets and agreements rather than occupation, so it changes hands more readily and rarely lasts without a fleet or a treaty behind it. Do NOT transfer a sea merely because a coastal state is adjacent to it, and never hand over an ocean whole when the event describes control of one approach.`;
  }

  // NOT EVERY ORDER IS A BUILDING.
  //
  // Measured over 30 rounds: 143 structures founded, at least one in every single
  // round, none ever closed — 116 of them the player's, roughly one every eight
  // days for two and a half years. The model answers a policy with a place because
  // markerOps is the most concrete lever on the menu, so the menu now says what the
  // others are for, and what a build actually costs in time.
  if (["jumpForward", "autoJumpForward"].includes(taskKey)) {
    const pipeline = normalizeString(variables?.constructionPipeline);
    systemPrompt = `${systemPrompt}\n\n[What A Programme Actually Leaves Behind]\nA policy, a doctrine, a standard, a training regime, a law, an export deal, an alliance or a warning leaves NO building. It changes what a country can do, and that belongs in polityChanges — its stats, its reputation, its tags — or in a regionTransfer, a unit, or a chat. Reach for markerOps only when the event genuinely puts a NEW PHYSICAL SITE on the ground at a coordinate: a plant, a port, a base, a campus, a terminal.\n\nAnd when it does, ground is broken — not ribbon cut. The engine now gives every founded structure a completion date from what it is (radar 6 months, research campus 12, base or factory 15, port or power plant 24) and a country runs only a handful at once — its construction capacity, derived from its own GDP, industry and stability; anything beyond that waits for a slot and opens later still. So a turn that founds five sites is not an ambitious turn, it is a turn whose fifth site opens years late. Found what this period genuinely broke ground on — usually none, sometimes one — and express the rest of what happened through the levers above.${pipeline ? `\n\n[Already Under Construction]\n${pipeline}\nDo NOT found any of these again; they are in the ground and dated. An event may report progress, a delay, a cost overrun or a cancellation on one, which is far more interesting than announcing a sixth.` : ""}`;
  }

  if (["jumpForward", "autoJumpForward"].includes(taskKey)) {
    systemPrompt = `${systemPrompt}\n\n[Region and City Capture]\nOn this map, territory is owned by REGIONS, and impacts.regionTransfers MUST name a region exactly as it appears in the [Game Map Description] above — never a city, town, port, or landmark. Cities such as Toulouse or Narbonne are only markers that sit INSIDE a region; a regionTransfer whose regionId is a city name matches no region and is silently discarded, so the border never moves even though the event says it did. To capture a place and the ground around it, transfer the REGION that contains it, and set fromCode to that region\u2019s current owner.\nTaking a region takes everything inside it, cities included — that is the normal case, so a city changing hands usually means transferring its whole region. To capture ONLY a city while its region stays with its current owner (a besieged holdout, an occupied port, an enclave), do NOT name it in regionTransfers; instead emit an impacts.markerOps build for it — {\"op\":\"build\",\"marker\":{\"name\":\"<city>\",\"kind\":\"city\",\"ownerCode\":\"<new holder>\",\"lng\":<lng>,\"lat\":<lat>}} — using that city\u2019s coordinates from [City Coordinates]. That places the city under the new owner without moving the region border.\nWhen a polity is conquered, annexed, partitioned, or unified OUTRIGHT — every region it still holds changing hands at once — you do not need one entry per region. Emit a SINGLE regionTransfer with "wholeCountry": true, put the losing polity's name in regionId instead of a region name, and set toCode to whoever takes it; the engine expands that into every region that polity currently owns. Use this ONLY for a total takeover of everything it holds. Any partial gain — a province, a border strip, a few regions — stays as ordinary per-region transfers, which remain the normal case.`;
  }

  // THE CONSOLIDATOR ALSO KEEPS A LEDGER NOW.
  //
  // Appended at call time rather than written into the prompt pack, because a
  // pack is frozen when a campaign starts — a game already twenty-seven rounds
  // in would otherwise never see this, and it is exactly the game that needs it.
  //
  // The summary contract is untouched: a model that ignores this still returns
  // {"summary": "..."} and still validates. What it buys when heeded is that the
  // prompt stops carrying every paragraph ever written, because the facts that
  // must survive have somewhere keyed to live.
  if (taskKey === "eventConsolidator") {
    systemPrompt = `${systemPrompt}\n\n[Standing Facts]\nAlongside "summary", return "ledger": the facts from this batch that will STILL MATTER in twenty rounds, each with a stable key so a later round can update it instead of repeating it. Shape: [{"key":"leader:south-korea","topic":"leader","fact":"<one line of what is true now>"}]. Topics: ${LEDGER_TOPICS.join(", ")}.\n\nA key must be reproducible — the same subject must get the same key next time, or the fact will be stored twice. Use the "topic:subject" form, in English, lowercase, even though the fact itself is written in ${"${language}"}.\n\nWrite a fact ONLY for something with continuing force: who leads a country, a treaty in effect, a war still being fought, territory that changed hands, a programme still running, a crisis still open. Do NOT write one for something that merely happened — that is what the summary is for.\n\nWhen a fact you can see in [Standing Facts Now] has STOPPED being true, return its key with "fact":"-" to retire it. When one has changed, return the same key with the new fact; do not invent a second key for the same subject.`;
    const standing = normalizeString(variables?.standingFacts);
    if (standing) {
      systemPrompt = `${systemPrompt}\n\n[Standing Facts Now]\n${standing}`;
    }
    // Cleaning up after the rounds that ran while [Standing Facts Now] was being
    // dropped before it reached the prompt: those consolidations invented keys
    // blind, and the ledger now holds pairs like programme-smr-hydrogen and
    // trade-hydrogen-alliance saying the same thing.
    const duplicates = normalizeString(variables?.duplicateFacts);
    if (duplicates) {
      systemPrompt = `${systemPrompt}\n\n[Facts That May Be Duplicates]\nEach pair below is two keys that appear to describe the SAME subject. Where they do, keep the better key with the fuller fact and retire the other by returning it with "fact":"-". Where they are genuinely different subjects, leave both alone and say nothing about them.\n${duplicates}`;
    }
  }

  // THE STAT PASS CARRIES ITS WHOLE PROMPT.
  //
  // This task is new, so no existing campaign's frozen prompt pack has a template
  // for it and renderTemplate returns "". Everything it needs is therefore built
  // here — which is also what makes it work on a game already twenty-nine rounds
  // deep, the one that needs it most.
  //
  // Deliberately narrow: one period, a handful of countries, a flat list back. The
  // nested version of this question has been in the jump schema all along
  // (polityChanges[].stats) and over 28 measured rounds it moved economy zero
  // times and five of six indices zero times.
  if (taskKey === "countryStatShift") {
    const fieldList = Object.entries(STAT_FIELDS)
      .map(([field, spec]) => `${field} — ${spec.label}${spec.kind === "pct" ? " (0-100)" : ""}`)
      .join("\n");
    systemPrompt = [
      `You are the statistician for a turn-based history simulation. A period has just been simulated and you are given what happened in it, along with each country's numbers as they stood BEFORE it.`,
      `Report ONLY the statistics this period actually moved, as a flat list of rows.`,
      "",
      "[Fields]",
      "Use these names exactly. Anything not on this list is discarded:",
      fieldList,
      "",
      "[Rules]",
      "• A row is warranted when an event in this period gives a reason for it. A period where nothing measurable moved returns an empty list, and that is a correct answer — do not invent movement to fill the page.",
      "• \"value\" is the NEW VALUE IN FULL, never the change. A country at 64 stability that had a good month is 66, not 2. Writing the delta is the single most common way this goes wrong, and the engine rejects a swing its events cannot account for.",
      "• A 0-100 standing is built over years: it moves a few points on an ordinary event. A swing of tens needs an event that explains it — a coup, riots, a war ending, a blockade lifted.",
      "• Money and rate fields carry their unit and nothing else (\"1,340조 원\", \"3.4%\"). No sentences, no parentheticals, no ranges.",
      "• agriculture, industry and services are one figure in three parts: send all THREE together and make them add to about 100, or send none of them. One share moved on its own is discarded.",
      "• The player's own programmes count. Years of energy plants coming online is exactly what energyAutonomy measures; a semiconductor build-out is what economicIndependence and industry measure. A campaign that changes the map and leaves every number where it started is the failure this pass exists to prevent.",
      "• \"reason\" names the event that moved it, in one short clause.",
      "",
      "[The period]",
      normalizeString(variables?.statPeriodEvents) || "(no events recorded)",
      "",
      "[Countries and their numbers before this period]",
      normalizeString(variables?.statSheets) || "(none recorded)",
      "",
      "--- OUTPUT FORMAT (return valid JSON only) ---",
      "{\"changes\":[{\"code\":\"\",\"field\":\"\",\"value\":\"\",\"reason\":\"\"}]}",
      "Output ONLY that JSON object — no prose, no markdown, no code fences.",
    ].join("\n");
  }

  // THE RELATIONS PASS CARRIES ITS WHOLE PROMPT, like the stat and rating
  // passes and for the same frozen-pack reason.
  if (taskKey === "diplomaticRelations") {
    systemPrompt = [
      "You are the chief diplomatic analyst for a turn-based history simulation. A period has just been simulated; you are given what happened in it and the player's CURRENT standing with each relevant country.",
      "Report the player's standing with each listed country AS IT NOW STANDS.",
      "",
      "[Rules]",
      "• \"level\" is the standing IN FULL — allied, friendly, neutral, tense or hostile — never a change or a trend.",
      "• A standing is STICKY. Move it only when this period's own events justify the move, and normally by ONE step; a jump of two or more needs a war, a treaty, an alliance signed or torn up.",
      "• A country whose standing did not move may be restated at its current level or left out — both mean no change. Do not invent movement to fill the list.",
      "• Only countries from the list, and \"country\" copied EXACTLY as listed — same language, same spelling.",
      "• The player's own country never appears.",
      "• \"note\" names what defines the standing right now, in one short clause, in the same language as the events.",
      "",
      "[The player]",
      normalizeString(variables?.relationPlayer) || "(unknown)",
      "",
      "[Current standings]",
      normalizeString(variables?.relationBaseline) || "(none recorded yet — this is the first assessment; state each listed country's standing as this campaign's history has it)",
      "",
      "[What happened this period]",
      normalizeString(variables?.relationEvents) || "(no events recorded)",
      "",
      "[Countries to assess]",
      normalizeString(variables?.relationCandidates) || "(none)",
      "",
      "--- OUTPUT FORMAT (return valid JSON only) ---",
      "{\"relations\":[{\"country\":\"\",\"level\":\"\",\"note\":\"\"}]}",
      "Output ONLY that JSON object — no prose, no markdown, no code fences.",
    ].join("\n");
  }

  // Whole prompt at call time, like every dedicated pass: no frozen campaign
  // pack has a template for it, and the campaigns that need it most are the
  // ones already deep in.
  if (taskKey === "diplomaticOutreachPass") {
    systemPrompt = [
      "You are simulating the OTHER governments in a turn-based history simulation. A period has just been simulated. Decide which powers, if any, now approach the player's nation FIRST — a protest, a warning, a proposal, an invitation, a feeler.",
      "",
      "[Rules]",
      "• Take each listed country in turn and ask: did THIS period's events, or the standing it holds toward the player, give it a concrete reason to speak now? An approach driven by nothing is noise — but a period full of consequences usually moves SOMEBODY to speak.",
      "• ZERO or ONE approach is the NORMAL period. Two is the ceiling, never the default, and needs two powers with independent, urgent, this-period reasons — six consecutive periods of exactly two reads as a machine, not a world. An empty list is a valid answer, and padding is worse than silence.",
      "• Hostile and tense powers protest, warn, press and probe; friendly and allied powers coordinate, propose and invite. An approach may be unpleasant — a demand or an ultimatum is outreach too.",
      "• \"country\" copied EXACTLY as listed — same language, same spelling. Never a country from [Already waiting]: they have spoken and await the player's answer.",
      "• \"reason\" names the this-period event or standing behind the approach, one clause.",
      "• \"message\" is the opening message in that government's own voice — 2 to 4 sentences, in the same language as the events, addressed to the player's government, concrete about what it wants.",
      "",
      "[The player]",
      normalizeString(variables?.outreachPlayer) || "(unknown)",
      "",
      // HOOK 2 (docs/STAT-HOOKS.md): reputation shapes who bothers to call and
      // in what voice — a well-regarded state draws proposals and invitations,
      // a pariah draws rare, hard-edged approaches or none at all.
      "[The player's international reputation]",
      normalizeString(variables?.playerPolityReputationContext) || "(unknown)",
      "• Above 70: powers lean toward proposals, coordination and invitations, and approach a little more readily. Below 40: approaches are RARER and harsher — demands, warnings, conditions — and a friendly feeler needs a concrete self-interested reason.",
      "",
      "[The player's standing with each power]",
      normalizeString(variables?.outreachRelations) || "(none recorded)",
      "",
      "[What happened this period]",
      normalizeString(variables?.outreachEvents) || "(no events recorded)",
      "",
      "[Countries that could approach]",
      normalizeString(variables?.outreachCandidates) || "(none)",
      "",
      "[Already waiting on the player]",
      normalizeString(variables?.outreachWaiting) || "(nobody)",
      "",
      "--- OUTPUT FORMAT (return valid JSON only) ---",
      "{\"outreach\":[{\"country\":\"\",\"title\":\"\",\"message\":\"\",\"reason\":\"\"}]}",
      "Output ONLY that JSON object — no prose, no markdown, no code fences. An empty list is {\"outreach\":[]}.",
    ].join("\n");
  }

  // The reports pass carries its whole prompt at call time, like every
  // dedicated pass: no frozen campaign pack has a template for it. The
  // reveal-never-enact contract is stated here AND enforced structurally —
  // the schema has no impacts channel, so a hallucinated coup stays a rumor
  // in a drawer instead of becoming a state change.
  if (taskKey === "secretReportsPass") {
    systemPrompt = [
      "You are the player's intelligence services in a turn-based history simulation. A period has just been simulated. Deliver the SECRET reports — what your services learned that the newspapers do NOT know.",
      "",
      "[Rules]",
      "• A report REVEALS, it never ENACTS. It may only describe what already happened in the dark or is being prepared in secret. It cannot create events, move armies or change any number — the world stays exactly as the period left it.",
      "• ZERO to TWO reports. One is the normal yield of an eventful period; a quiet period yields NONE, and an empty list is a valid answer. Padding is worse than silence.",
      "• Report what other governments HIDE: a secret buildup, a back-channel feeler, a coup being sounded out, a covert program, a leader's failing health, an asset's warning. Never restate what the public events below already say.",
      "• \"kind\" is exactly one of: military, political, economic, intelligence, foreign.",
      "• \"title\" and \"body\" in the same language as the events below. The body is 2-5 sentences, concrete — names, places, quantities where the source would plausibly know them.",
      "• \"source\" says how it was learned, one clause.",
      "• Stay consistent with this campaign's recorded events and standings — a report that contradicts them is a fabrication, not intelligence.",
      "",
      "[Intel quality at this difficulty]",
      normalizeString(variables?.reportsQualityDirective) || "Your services are competent: reports are solid but incomplete.",
      "",
      "[The player]",
      normalizeString(variables?.reportsPlayer) || "(unknown)",
      "",
      "[The player's standing with each power]",
      normalizeString(variables?.reportsRelations) || "(none recorded)",
      "",
      "[What happened this period — the PUBLIC record]",
      normalizeString(variables?.reportsEvents) || "(no events recorded)",
      "",
      "--- OUTPUT FORMAT (return valid JSON only) ---",
      "{\"reports\":[{\"kind\":\"\",\"title\":\"\",\"body\":\"\",\"source\":\"\"}]}",
      "Output ONLY that JSON object — no prose, no markdown, no code fences. An empty list is {\"reports\":[]}.",
    ].join("\n");
  }

  // THE RATING PASS CARRIES ITS WHOLE PROMPT, for the same reason the stat pass
  // does: the task is new, no frozen campaign pack has a template for it, and
  // the campaigns that need it most are the ones already deep in.
  if (taskKey === "orderOutcomeRating") {
    systemPrompt = [
      "You are the adjudicator for a turn-based history simulation. A period has just been simulated; you are given what happened in it and the player's orders it carried out. Decide how each order ACTUALLY came out.",
      "",
      "[This difficulty]",
      normalizeString(variables?.ratingDirective) || "Judge by preparation.",
      normalizeString(variables?.ratingQuota),
      "",
      "[Rules]",
      "• Every id below gets exactly one row. succeeded: as ordered. partial: happened smaller, later or at a real cost. failed: did not happen. backfired: did not happen and made something worse.",
      "• Judge by PREPARATION visible in this period's own events: an order that was funded, staffed, legally cleared and technically ready succeeds; one ordered into a gap — no budget line, no passed law, no partner agreement, unproven technology, an unconsulted public — comes out partial or worse.",
      "• \"note\" says why, in one short clause, in the same language as the order.",
      "",
      "[What happened this period]",
      normalizeString(variables?.ratingEvents) || "(no events recorded)",
      "",
      "[The orders]",
      normalizeString(variables?.ratingOrders) || "(none)",
      "",
      "--- OUTPUT FORMAT (return valid JSON only) ---",
      "{\"outcomes\":[{\"id\":\"\",\"outcome\":\"\",\"note\":\"\"}]}",
      "Output ONLY that JSON object — no prose, no markdown, no code fences.",
    ].filter((line) => line !== null && line !== undefined).join("\n");
  }

  // Local models keep answering the actions task with a bare top-level array
  // (or a single topic) instead of {"topics":[...]} — strict validation then
  // rejected the whole answer and the player got the canned fallback. State
  // the exact envelope at call time so frozen-prompt games get it too.
  if (taskKey === "actions") {
    // What the player may plan around: the entries already on the public calendar
    // and nothing else. The jump sees the whole schedule because it has to make
    // the world happen; a suggestion board the player picks from must not hand
    // over knowledge of things nobody has announced yet.
    const outlook = normalizeString(variables?.foreseeableOutlookText);
    if (outlook) systemPrompt = `${systemPrompt}\n\n${outlook}`;
    // "Global Hydrogen Pass", "Quantum-Trace": the model coins English brand
    // names in an otherwise Korean game, they enter the queue, ride every later
    // prompt as established canon, and multiply ("무슨 말인지 모르겠네" — the
    // player's own words). This rule stops NEW coinages; a name already
    // entrenched is retired instead through world.nameRenames (a total sweep
    // plus normalize-time rewriting — runtime/nameCanon.js), because merge
    // passes match programmes BY NAME and only a rename applied EVERYWHERE at
    // once keeps them matching.
    systemPrompt = `${systemPrompt}\n\n[Naming]\nWrite the NAME of every new programme, system, platform, initiative or project in ${"${language}"} — never coin an English brand name ("Quantum-Trace", "Global Hydrogen Pass" style) for something new. A programme already established under an English name in the orders or events keeps its existing name; everything newly founded is named in ${"${language}"}.`;
    // The coverage axes carry the original game's four topic-selection lenses
    // (checked against its WWII++ preset, the player's own capture of it):
    // historical context anchors the board in the period's REAL named issues,
    // geopolitics derives topics from what neighbours and rivals are visibly
    // doing, domestic covers economy-military-integration, and diplomacy
    // includes taking public positions and building coalitions of cause — on
    // top of the axes this project added for its own reasons (the second
    // economic angle, queue support, foresight, and the rescue topic below).
    // [Action Spread] comes from the player's third capture (round 6): the
    // original scores each OPTION within a topic on named tradeoff axes —
    // its purge topic offers 야고다 유지/예조프 승격/집단 지도체제, each rated
    // on paranoia, army preservation and removal rate with its main risk
    // stated — so options are rival strategies with different costs, never
    // three intensities of the same move.
    systemPrompt = `${systemPrompt}\n\n[Output Shape]\nAnswer with ONE JSON OBJECT of the exact shape {"topics":[{"title":"...","description":"...","horizon":"immediate" or "long","actions":[{"title":"...","text":"..."}]}]} — AT LEAST 8 topics (aim for 8 to 10, up to 12 when the era's live lenses below demand it), each with 2 to 4 concrete actions. Never answer with a bare array, never wrap it under any other key, and never stop early.\n\n[Topic Coverage]\nTopics must be DISTINCT (no near-duplicates) and together must cover at least:\n1. Immediate response planning for the current world situation and this period's events — including the visible MOVES OF NEIGHBOURING AND RIVAL POWERS: what each is actually doing right now, what threat or opening that creates, and how to answer it — with follow-up contingency measures for how each crisis could evolve.\n2. Military and security readiness — against the SPECIFIC threats this period's geography and rivals actually pose, never abstract modernization for its own sake.\n3. Diplomacy: alliances, rivals, and international standing — including public positions on external events of the day, coalitions of shared cause, value or principle (the era's own ideological and normative alignments), the MAINTENANCE of standing alliances as its own continuous work (burden-sharing, basing, command arrangements, managing friction with a partner or between rival patrons), and influence in the era's own currency: ideological solidarity and bloc-building in one age, cultural soft power and national brand in another.\n4. Economic development.\n5. A second, DIFFERENT economic-strengthening angle — trade, industry, technology, infrastructure, or finance — clearly distinct from topic 4.\n6. Internal stability and domestic affairs — including social integration across the country's own regions and groups, and the era's slow STRUCTURAL pressures where they exist: demography, employment, cohesion, the long-run sustainability of the state itself.\n7. Support for the player's currently queued actions: reinforcing, follow-up, or fallback measures for the plans listed in the context above. If nothing is queued, propose preparatory groundwork for the player's likely next moves instead.\n8. Foresight: if the scenario's date is earlier than the real-world present, far-sighted preparations anticipating developments this era cannot yet see coming (emerging technologies, ideologies, geopolitical shifts); otherwise, long-term strategic positioning over the coming years.\n\n[Era-Conditional Lenses]\nThe eight axes above are the floor; this checklist is where a board earns its VARIETY. Run through every lens and give a topic (or fold one into an existing topic) to each lens that is LIVE for this country at this date — and nothing to a lens that is not:\n• The MATERIAL BASE: food, energy, water, critical materials — wherever supply is precarious, a dependency, or a lever over others.\n• The TREASURY itself: taxation, debt, the soundness of the currency — for eras and states where the purse is the problem, not just growth.\n• LEGITIMACY and the political calendar, in the era's own terms: succession and dynastic ties in one age; elections, scandals and constitutional crises in another; consolidating a revolution or an occupation in a third.\n• FAITH AND IDENTITY where they are statecraft: church and clergy, sects and communal balance, or the modern politics of identity and minorities.\n• The QUIET INSTRUMENTS: intelligence and counter-intelligence, covert action, propaganda, and the era's information struggle (pamphlets once, broadcasts later, cyber and disinformation now).\n• The era's DEFINING TECHNOLOGY RACE and where this country stands in it — gunpowder, dreadnoughts, the bomb, space, semiconductors, AI — as a race being run NOW, distinct from foresight about races to come.\n• The PERIPHERY, for countries that have one: frontiers, colonies, vassals and tributaries, overseas holdings, bases, diaspora and irredenta — their administration, defence, cost and restiveness.\n• The era's INTERNATIONAL ORDER as a thing to act on: its institutions, regimes and treaties — join them, shape them, exploit them, or defy them.\n• NATURE'S OWN SHOCKS where the era carries them: disease, disaster, harvest and climate — preparedness now, not only response after.\nTwo lenses may share one topic when the work is genuinely one; a lens with nothing live this period gets nothing, and padding a dead lens is worse than leaving it out.\n\n[Voice]\nWrite every topic and action as the player's own government would brief it, in that government's register — the tone is part of the era. A 1930s totalitarian state briefs in terse, urgent situation-report prose: power, loyalty, ideological necessity, named enemies. A modern democracy briefs analytically: public opinion, the legislature, coalition partners, economic indicators, legal constraints. Match the SYSTEM too, not just the century — propose only what this form of government could actually do: a democracy needs votes, budgets and public consent and can face courts, elections and protest; an autocracy needs elite loyalty and its security organs and can face factions, purges and succession fear. A policy no such government could enact is not a suggestion, it is a costume.\n\n[Action Spread]\nWithin one topic, the 2 to 4 actions are RIVAL STRATEGIES for the same problem, never three wordings of one move — the player is choosing between COSTS, not between synonyms. Spread them along the levers the topic actually trades (the way a purge trades regime security against the officer corps that must fight the next war, or an energy plan trades price against dependency): typically one assertive option that maximises the goal at a real cost, one balanced option that trades part of the gain for safety, and one restrained or oblique option that preserves resources or works through a DIFFERENT CHANNEL entirely — diplomacy where the others use force, market incentives where the others use decree, covert action where the others move in public. Each action's text names, in one clause, what it trades away or the main risk it accepts. Where the topic spans genuinely distinct arenas (military, economic, diplomatic, internal), differ by arena rather than by intensity alone.\n\n[Horizon]\nLabel every topic with its strategic horizon: "immediate" for this period's live crisis management (an unfolding dispute, a rival's move in progress, damage control), "long" for the multi-year national task (structural reform, capability build-up, demography). List the immediate topics FIRST. A board of only one kind is usually wrong — a period nearly always carries both.\n\n[Era Anchoring]\nAnchor topics and actions in what this DATE actually held: name the real programmes, plans, disputes, institutions and movements live at this time — the way a Second Five-Year Plan, a purge's first signs or a Comintern line would anchor a 1935 Soviet board, and a nuclear crisis, a missile-defence dispute with a neighbour, or a demographic cliff would anchor a modern one — rather than era-less policy prose that could belong to any decade. Match the CHARACTER of the problems to the country and the date: a 1935 command economy industrializes for war and purges its politics, while a 2016 developed democracy manages slow growth, youth unemployment, demographic decline and alliance friction — the same axis takes the form its own era gives it. Where this campaign's own history has diverged from the real one, the campaign's state wins; use the real period for texture that is still consistent with it.`;

    // [Depth] — MEASURED AGAINST THE ORIGINAL, NOT GUESSED.
    //
    // The player's capture of Pax Historia's own 1935 Soviet board: each option
    // runs four to six sentences and is thick with proper nouns — the NKVD
    // chief by name, the rival being promoted against him, the show trial by
    // its number and season, the marshals whose survival is at stake, the plants
    // at Chelyabinsk and Magnitogorsk, the aircraft design bureaus, the
    // newspapers the campaign runs in. Ours, measured on the live save: a median
    // of 71 characters — "강력한 공공 메시지를 통해 민심을 달래고, 여야 협치를
    // 강조하며 정책에 대한 지지 기반을 확보하십시오." An instruction with no
    // names in it could be issued by any government in any decade, which is
    // exactly what makes it feel thin. Nothing here asks for padding: the length
    // comes from SPECIFICS, and a sentence that adds no name, place, quantity or
    // tradeoff should be cut rather than written.
    systemPrompt = `${systemPrompt}\n\n[Depth]\nEach action's "text" is an ORDER AS A GOVERNMENT WOULD MINUTE IT — 3 to 6 sentences, and it must name things:\n• The INSTRUMENT: the ministry, agency, bureau, service, command or state company that carries it out, by its real name at this date.\n• The PEOPLE where the era has them: the officials, commanders, rivals or negotiating partners this touches, by name — drawn from the officeholders and figures given in the context above, never invented.\n• The PLACES and THINGS: the cities, plants, ports, railways, fields, formations, weapons or programmes involved, specifically.\n• The SEQUENCE: what happens first, what follows, and roughly when — a timetable a subordinate could act on.\n• The COST, in its own clause: what this trades away, whom it antagonises, or the main risk it accepts.\nA topic's "description" is 2 to 3 sentences: what is happening right now, and what is at stake BOTH ways — what letting it run costs, and what acting too hard costs.\nWrite them as decisions being taken, not as advice being offered ("…한다" rather than "…하십시오"). Never pad: if a sentence adds no name, place, quantity or tradeoff, cut it. A four-sentence order carrying six proper nouns beats an eight-sentence one carrying none.`;

    const officeholders = normalizeString(variables?.officeholderRecordText);
    if (officeholders) systemPrompt = `${systemPrompt}

${officeholders}`;

    // The suggestions template has NO placeholder for the player's own orders,
    // so the brainstormer was blind to everything they had already done and
    // re-proposed it round after round (field data: 48 queued actions carried
    // only 38 distinct titles — "재생에너지 확대" was suggested three times, and
    // the simulation then narrated the same programme three times). Hand it the
    // roster at call time, which reaches frozen-prompt games too.
    const existingOrders = normalizeString(variables?.existingOrders);
    if (existingOrders) {
      systemPrompt = `${systemPrompt}\n\n[Orders Already Given]\nThe player has ALREADY ordered the following. Do NOT suggest any of them again, and do not suggest a reworded or lightly renamed version of the same initiative — a suggestion that merely repeats one of these is wasted:\n${existingOrders}\n\nPropose what comes NEXT instead: the follow-on stage of something already underway, the consequences it created that now need managing, the risk it exposed, or a lever the player has not pulled at all yet. Building on an initiative already in motion is welcome, as long as the step you suggest is genuinely new work rather than a restatement of it.\n\nOVERLAP, not just repetition, is what makes a board feel padded. Two suggestions that would be carried out by the same ministry, the same budget line and the same programme are ONE suggestion however differently they are titled — a queue holding "중요 자원 비축 자동화 관리" does not also need "핵심 광물 비축 자동화 가동", and "차세대 통신 인프라 선점" already contains "저궤도 위성 통신 인프라 통합". Before you write each suggestion, check it against every order above AND every suggestion you have already written in this answer: if the work itself would be the same work, drop it and use the slot for a lever nobody is pulling yet. A board of ten genuinely different choices beats a board of twenty with four ideas among them.`;
    }

    // THE FEEDBACK LOOP'S OTHER HALF. The struggling list (below) carries what
    // failed; this carries the whole verdict sheet of the last period —
    // successes and partials included — so the board can propose the follow-on
    // stage of what worked and the completion of what half-worked, not only
    // rescues. The original's own loop: the player's choices visibly shape the
    // next period's analysis.
    const recentOutcomes = normalizeString(variables?.recentOutcomes);
    if (recentOutcomes) {
      systemPrompt = `${systemPrompt}\n\n[Last Period's Verdicts]\nHow the player's orders actually came out last period:\n${recentOutcomes}\n\nBuild on these: a success earns its next stage or the exploitation of what it opened; a partial earns the step that completes it; and their consequences (a rival's reaction, a cost incurred, a public's response) are exactly the material for this period's immediate topics.`;
    }

    // Round-41 field report: orders were failing and stalling in plain sight
    // ("대안 경로 확보", "차세대 그린 통신망") and the board never engaged —
    // "브레인스토밍이 그에 관한 해결안 또는 개선안을 내놓지 않는거 같더라고".
    // It could not: nothing showed it the failures. The struggling list plus a
    // dedicated-topic obligation is that mechanism, and the repeat-validator
    // below exempts these titles so a rescue naming its programme survives.
    const strugglingOrders = normalizeString(variables?.strugglingOrders);
    if (strugglingOrders) {
      systemPrompt = `${systemPrompt}\n\n[Orders In Trouble]\nThese orders came back failed or backfired — the STALLED ones will not even run again until the player acts:\n${strugglingOrders}\n\nDedicate ONE full topic to rescuing or replacing these, with concrete actions that name the troubled order each one addresses. A rescue must CHANGE THE APPROACH — a different lever, partner, region, scale or sequence that answers the stated reason for the failure — never a reworded restatement of the failed order (that repeats the failure) and never a vague review-and-improve gesture. Where an order looks unsalvageable, propose what to do INSTEAD of it. For exactly these troubled orders, this overrides the no-repetition rule above: proposing a genuine replacement for one of them is welcome; re-submitting it as it stands is still not.`;
    }
  }

  // The stat sheet is a snapshot of ONE DATE, and the field that shows it is the
  // leader. On a campaign starting 2016-01-01 the sheet came back naming South
  // Korea's president as Moon Jae-in, who took office in May 2017 — the model
  // reaching for the best-known holder of the office rather than the one in it on
  // the date asked about. Every other field has the same exposure (a GDP, a debt
  // ratio and an inflation figure are all dated quantities); the leader is just
  // the one a player checks against their own knowledge immediately.
  // THE SHEET TASK CARRIES A MINIMAL PROMPT OF ITS OWN — deliberately NOT the
  // pack template. The pack template hands every task the whole campaign
  // (world summary, chronicle, chats), which for a sheet about Japan is 95%
  // South Korea — and a 12B pattern-matches from what it is shown: Japan came
  // back led by the player's president, capital 서울, currency 원, twice, two
  // campaigns in a row. A sheet needs the target's own dossier, the era, the
  // date and the campaign's established facts — all of which ride in the user
  // message — and nothing else. Less context here is more truth.
  if (taskKey === "countryStatSheet") {
    const sheetDate = normalizeString(variables?.date) || normalizeString(variables?.originDate);
    systemPrompt = [
      "You are the data desk of a turn-based history simulation. Compile the national statistics sheet for ONE country — the one named in the user message.",
      "Every field describes THAT country and no other. The player's own country, however present in this campaign, does not belong on another country's sheet: not its leader, not its capital, not its currency, not its numbers.",
      `[As Of This Date]\nThis sheet describes the country ON ${sheetDate || "the campaign's current date"}, not today and not at its most famous moment. "leader" is whoever actually held the office on that date — check the date against the term of office before answering, and if a better-known figure took power later, that later figure is WRONG here. Every dated quantity follows the same rule: GDP, growth, inflation, unemployment, debt and budget balance are that year's figures, not the present day's. In an alternate-history campaign the recorded facts in the user message override real history wherever they disagree.`,
      // Round-3 live: the model was asked to CONVERT and multiplied wrong by
      // three orders of magnitude ("1조 3300억 달러 (≈ 1조 5900억 원)"). It now
      // states only the RATE — a fact it knows — and the engine multiplies.
      // GDP in DOLLARS for every country, by the player's own call after one
      // round of local-currency figures: the model knows "China ≈ 11 trillion
      // dollars" cold and wrote "1.35조 위안" — wrong by fifty-fold — because
      // its training denominates the world in dollars. Benchmark currency for
      // the era; local currency still names itself in the "currency" field.
      `[Money Format]\nEvery monetary value follows ONE format:\n• "gdp" and "gdpPerCapita" are stated in the era's benchmark currency — 달러 (US dollars) in the modern era — for EVERY country, so sheets compare. The local currency is named in the "currency" field, not used for the figures. The dollar figure stands ALONE: no conversions, no parenthetical equivalents, no exchange rates anywhere on the sheet.\n• Amounts use the game language's own number scales (조/억/만 in Korean), NEVER Latin letters like T, B or M, and never digit-underscore forms.\n• Currency names are written in the game language (달러, 유로, 위안, 엔, 원) — an ISO code alone (USD, CNY, KRW) is not a currency name. The "currency" field may add the code in parentheses after the name.\n• "publicDebt" and "budgetBalance" are ALWAYS percentages of GDP, written like "35% (GDP 대비)" and "-2.4% (GDP 대비)" — never absolute sums.\n• "gdpGrowth", "inflation" and "unemployment" always carry the % sign.`,
      // Round-5 live: Japan came back led by "시노자와 다로 (Shinzo Abe)" — an
      // invented name with the real one in parentheses — and South Korea's own
      // stability arrived as 0, which reads as state collapse.
      `[Leadership]\nFill the leadership by how the SYSTEM actually works. Every leadership field is written as OFFICIAL TITLE + name, in the game language — "대통령 블라디미르 푸틴", "국왕 하랄 5세", "총리 아베 신조" — the REAL office that person holds, never a bare name and never a generic word like 지도자 or 대리인 in place of the office:\n• "leader" is the ONE person who actually runs the government — a president in a presidential republic, the prime minister in a parliamentary one, the monarch only where the monarch truly rules. One real person with their real office, NEVER an invented name and NEVER a second name in parentheses. An acting holder carries the acting office ("대통령 권한대행 황교안").\n• "headOfState" is the ceremonial or formal head when that is a DIFFERENT person — the emperor or king in a constitutional monarchy (일본, 영국), a figurehead president in a parliamentary republic. When the leader personally holds the role, write exactly "(없음)".\n• "deputy" is the second-ranking figure — the vice president ("부통령 …"), or the prime minister serving UNDER a president ("국무총리 …"). When the system has no such office, write exactly "(없음)".\n• "headOfState" and "deputy" are ALWAYS present on the sheet. Name a person in them ONLY when you are CERTAIN of the actual person on this date; when the office exists but you are not sure who held it, write exactly "(미확인)". The engine shows both sentinels as an honest blank — an invented or borrowed name is never acceptable.\n• "stability" is a real judgment from 0 to 100 — 0 means the state has collapsed. A functioning country is never 0.`,
    ].join("\n\n");
  }

  // HOOK 3 injection (docs/STAT-HOOKS.md): the turn-facing tasks get the
  // player's own numbers. Call-time, so frozen prompt packs get it too.
  {
    const standing = normalizeString(variables?.playerStatSummary);
    if (standing && ["actions", "jumpForward", "autoJumpForward", "catalystCreation", "catalystExecutor"].includes(taskKey)) {
      systemPrompt = `${systemPrompt}\n\n[Your Nation's Standing]\n${standing}\n\nWrite events, outcomes and proposals CONSISTENT with these numbers — a nation at these levels acts, suffers and is treated accordingly, and a listed vulnerability is exactly where a crisis bites first.`;
    }
  }

  // Native-language output (field report: editing an event/action showed raw
  // English under the Korean UI — the data itself was English and only the
  // DOM translator made it look Korean). callAI already appends the UI
  // language directive, but the local 14B models drift back to English when
  // the prompt is otherwise English-heavy — so the content tasks state it
  // AGAIN, task-specifically, with the critical exception spelled out:
  // identifiers stay canonical or transfers/ops silently stop matching.
  // This block sits BELOW the countryStatSheet rebuild above, which replaces
  // systemPrompt wholesale — appended any earlier, the directive was silently
  // discarded for exactly that task (live: the one task in this list whose
  // language line never reached the model).
  {
    const langCode = getStoredLanguage();
    if (langCode && langCode !== "en" &&
        ["actions", "jumpForward", "autoJumpForward", "catalystCreation", "catalystExecutor", "eventConsolidator", "countryStatSheet"].includes(taskKey)) {
      const langName = languageDisplayName(langCode);
      systemPrompt = `${systemPrompt}\n\n[Output Language]\nWrite EVERY human-readable string value in your JSON — titles, descriptions, summaries, notes, suggestion/action texts, chat messages, catalyst premises and choices — in ${langName}. Do NOT write them in English. This includes the NAMES YOU INVENT for things placed on the map: markerOps marker names (bases, ports, plants, clusters, airfields, embassies) and unitOps unit names. Those names are printed on the map beside ${langName} text, so an English one is the one word on screen the player cannot read. The exceptions below are IDENTIFIER FIELDS ONLY — machine keys the engine matches on. They do NOT apply to PROSE: inside a title, description, summary, note or chat message, write country, region and city names in ${langName} the way a ${langName} newspaper would, because that prose is READ by the player, not matched by the engine. A canonical English name dropped into a ${langName} sentence is the one word in it they cannot read. EXCEPTIONS that must stay EXACTLY as they appear in the world data, never translated: the regionId FIELD (its id, or its catalogued name), polity/owner IDENTIFIER FIELDS (toCode, fromCode, ownerCode, code, speaker, countries entries), a marker's "kind" (a lowercase English keyword the map reads to pick an icon), a polityChange's "name" (a country's identity — set it only for a genuine in-world rename such as a regime change, and never merely to translate the country's existing name), unit ids, dates, and all JSON keys.`;
    }
  }

  // Polities are identified by their full country name EVERYWHERE. A model that
  // answers "ESP" gets canonicalised on ingest, but it also then reasons about "ESP"
  // and "Spain" as if they were two powers, so state the rule rather than only
  // repairing the output.
  if (["actions", "jumpForward", "autoJumpForward", "catalystCreation", "catalystExecutor"].includes(taskKey)) {
    systemPrompt = `${systemPrompt}\n\n[Polity Names]\nEvery polity is identified ONLY by its full country name, exactly as written in the map description — "Spain", "United States", "Soviet Union". NEVER use a country code or abbreviation such as "ESP", "USA" or "SOV", anywhere, in any field. This applies to every owner field despite their names: toCode, fromCode, ownerCode and a polity's code all take the FULL NAME. A code is not a shorter way of writing a country here; it is a different, non-existent polity, and using one creates a phantom country on the map beside the real one.`;
  }

  // Era grounding. A turn written from nothing reads like generic policy prose —
  // "the government expands renewable energy" — when the period itself is full of
  // named programmes, half-built infrastructure and institutions that already
  // exist. Using them is what makes the campaign feel like this era rather than
  // any era, and it also stops the model reinventing facilities the country
  // already has.
  if (["jumpForward", "autoJumpForward"].includes(taskKey)) {
    systemPrompt = `${systemPrompt}\n\n[Period Grounding]\nWrite this period, not a generic one. Before inventing anything, use what the era actually contained:\n• The real programmes, plans and projects under way at this date — five-year plans, armament and space programmes, infrastructure and energy build-outs, treaties being negotiated, institutions being founded — and name them.\n• Facilities, industries, bases, ports and cities that ALREADY exist in this country and its neighbours. An order to expand or modernise something should build on the existing one rather than found a duplicate beside it.\n• The politics of the moment: who actually held power, which elections, disputes, crises and rivalries were live, and what each polity was actually worried about.\n• Where the scenario's date is in the PAST, you know how the following years went. Do not narrate the future as if it already happened, but let it inform what is plausibly beginning now — the technologies, alignments and pressures that were about to matter should be visible in embryo.\nWhen the world has diverged from real history through play, follow the world's own state — the divergence is the story — and use the real period only for texture that is still consistent with it.`;
  }

  // Units kept landing at 0,0 (null island) because the model copied the lng:0,lat:0
  // placeholder from the output template; guide it to real coordinates.
  if (["jumpForward", "autoJumpForward"].includes(taskKey)) {
    systemPrompt = `${systemPrompt}\n\n[Unit Coordinates]\nWhenever an event says a force is raised, mobilised, garrisoned, landed, reinforced, redeployed or moved, that event MUST carry the matching impacts.unitOps — a spawn for a force that now exists, a move for one that relocated. An event that describes troops without unitOps produces a story about an army the map never shows.\nWrite every coordinate as a plain decimal number, using a POINT for the decimal mark and no other characters: lng 37.06, not "37,06", not "37.06°E". Every unitOps spawn and move MUST use the real-world longitude and latitude of where the unit actually is or is going. The lng 0 / lat 0 shown in the output template is ONLY a placeholder \u2014 0,0 is open ocean off West Africa, never a valid position, and a unit placed there is discarded. Set lng and lat to the actual coordinates: use the values from [City Coordinates] for a unit at or near one of those cities, or the real coordinates of the region or front where the action happens.`;
  }

  if (["actions", "jumpForward", "autoJumpForward", "catalystCreation", "catalystExecutor"].includes(taskKey)) {
    const reputationContext = normalizeString(variables.playerPolityReputationContext);
    if (reputationContext) {
      systemPrompt = `${systemPrompt}\n\n[International Reputation]\n${reputationContext}\nLow international reputation should reduce trade, trust, and coalition support, and should make nearby rivals more likely to sanction, isolate, or form balancing alliances. High reputation should improve access, trust, and coalition-building. When events this turn change how the world regards a polity, record the new value by including a "reputation" field (an integer 0-100) on that polity's impacts.polityChanges entry: aggression, broken treaties, and atrocities lower it; cooperation, aid, and honored commitments raise it. Only include reputation when it actually changes.`;
    }
  }

  // The actions menu goes last so the system prompt for every jump ends with the full
  // list of levers the model can pull (reaches existing games too — see ACTIONS_REFERENCE).
  if (["jumpForward", "autoJumpForward"].includes(taskKey)) {
    systemPrompt = `${systemPrompt}\n\n${ACTIONS_REFERENCE}`;
  }

  // WHAT THE DIFFICULTY OWES, LAST AND CONCRETE.
  //
  // The tonal directive is appended near the top of this function and has then
  // been buried under a dozen longer, more specific blocks for the whole life of
  // this campaign — which has run on "impossible" for 31 rounds while the
  // player's reputation climbed 53 → 92 without a single decline and no
  // territory was ever lost. This says the same thing as a countable obligation,
  // in the last position, where the model is still holding it.
  if (["jumpForward", "autoJumpForward"].includes(taskKey)) {
    const owed = setbackDirective(difficultyForTask, {
      playerPolity: normalizeString(variables?.playerPolity) || "the player's polity",
      shortfall: Number(variables?.setbackShortfall) || 0,
    });
    if (owed) systemPrompt = `${systemPrompt}\n\n${owed}`;
  }

  const controller = new AbortController();
  // Let an external signal (the player pressing Cancel) abort the in-flight AI
  // call too — the abort propagates through callAI to the server relay.
  if (signal) {
    if (signal.aborted) controller.abort(signal.reason);
    else signal.addEventListener("abort", () => controller.abort(signal.reason), { once: true });
  }
  const deadline = Number.isFinite(timeoutMs) && timeoutMs > 0 ? Date.now() + timeoutMs : null;
  const timeoutError = new Error(`AI task "${taskKey}" timed out.`);
  const timeoutId = deadline ? setTimeout(() => controller.abort(timeoutError), timeoutMs) : null;
  // Structure only, no prose — see slimSchemaForWire. The rules live in the
  // prompt; the schema only has to say what shape the answer takes.
  const tool = getSlimGameplayTool(taskKey);
  // Claim the GPU for the duration of this call (see beginHeavyAiTask): the UI
  // translator must not swap the model out from under a turn.
  const heavyTask = ["jumpForward", "autoJumpForward", "actions", "catalystCreation", "catalystExecutor", "eventConsolidator"].includes(taskKey);
  if (heavyTask) beginHeavyAiTask();
  const history = [{ role: "user", parts: [{ text: userMessage }] }];
  let failureReason = "The model did not return valid structured output.";
  // Richest schema-valid answer seen across BOTH attempts. Declared out here so
  // the post-loop salvage can still reach it after a failed retry.
  let bestCandidate = null;

  try {
    let outputAttempt = 1;
    let networkRetries = 0;
    while (outputAttempt <= 2) {
      // Anything the player typed while this turn was running joins the
      // conversation here, before the next call goes out.
      if (["jumpForward", "autoJumpForward"].includes(taskKey)) {
        const intervention = drainJumpInterventions();
        if (intervention) {
          console.info(`[ai] applying the player's mid-turn intervention to "${taskKey}".`);
          history.push({
            role: "user",
            parts: [{ text: `[Player intervention, given while this turn was being generated] ${intervention}\nTreat this as a direct order from the player and apply it to the rest of this turn, alongside everything already asked for.` }],
          });
        }
      }
      let response;
      try {
        response = await callAI(systemPrompt, history, {
          // Heavy simulation work — routed to the "event" role's model.
          role: "event",
          // No output-token cap. A long/action-heavy turn's JSON must not be truncated
          // mid-response — a cut-off response won't parse, so runJsonTask fell back to
          // canned events that carry NO regionTransfers and NO diplomacy, which is why
          // the map never changed and no chats opened. main.jsx now lets each provider
          // use its own model maximum when no maxTokens is passed.
          deadline,
          signal: controller.signal,
          tool,
        });
      } catch (error) {
        // Transient provider failure — a local Ollama hiccup, dropped stream,
        // or connection reset surfaces as "Failed to fetch" ("불러오기 실패")
        // and used to hand the player a canned fallback turn immediately.
        // Wait and retry the call instead; only a repeat failure falls back.
        const message = normalizeString(error?.message || error);
        // A CRASHED inference runner ("llama runner process has terminated:
        // exit status 0xc0000409 … CUDA error") is also transient — Ollama
        // respawns the runner on the next request — but it needs the model
        // reloaded into VRAM first, so this class waits much longer than a
        // plain network blip before retrying.
        const runnerCrash = /terminated|exit status|cuda|llama|runner|overloaded|server error|\b50[023]\b/i.test(message);
        const transient = runnerCrash || /failed to fetch|network|fetch failed|load failed|socket|connection|abort.*stream|stream.*abort|reset/i.test(message);
        if (!controller.signal.aborted && transient && networkRetries < 2) {
          networkRetries += 1;
          const waitMs = runnerCrash ? 25000 : 4000;
          console.warn(`[ai] task "${taskKey}" provider call failed (${message}) — retrying (${networkRetries}/2) in ${Math.round(waitMs / 1000)}s.`);
          await new Promise((resolve) => setTimeout(resolve, waitMs));
          continue;
        }
        throw error;
      }
      // A PARTIAL response (the stream dropped mid-answer but enough text
      // arrived to keep) is retried like a network failure while retries
      // remain — salvaging it too eagerly produced near-empty "valid" turns.
      // Once the retry budget is spent, fall through and let the salvage
      // layer make the best of what arrived.
      if (response?.partial && networkRetries < 2 && !controller.signal.aborted) {
        networkRetries += 1;
        console.warn(`[ai] task "${taskKey}" got a partial (dropped-stream) response — retrying (${networkRetries}/2) in 4s.`);
        await new Promise((resolve) => setTimeout(resolve, 4000));
        continue;
      }
      const rawText = typeof response === "string" ? response : normalizeString(response?.rawText);
      let parsed = response?.toolInput ?? extractJsonPayload(rawText);
      if (parsed == null && typeof parseFallback === "function" && rawText) {
        try {
          parsed = parseFallback(rawText) ?? null;
          if (parsed) console.info(`[ai] task "${taskKey}" was unparseable as JSON — the task's own text salvage recovered it.`);
        } catch {
          parsed = null;
        }
      }
      // When nothing could be read out of the reply, SAY WHAT CAME BACK. Until now
      // this failure printed only "Response did not contain parseable JSON or tool
      // arguments" and threw the reply away, so every diagnosis of it started by
      // guessing: an empty answer, a refusal, prose instead of a tool call, a
      // truncation, and a context overflow all look identical from the outside, and
      // they want opposite fixes. The first few hundred characters separate them at
      // a glance.
      if (parsed == null) {
        const preview = rawText ? `${rawText.slice(0, 600)}${rawText.length > 600 ? " …" : ""}` : "(empty)";
        console.warn(
          `[ai] task "${taskKey}" returned nothing parseable — ${rawText.length} chars, `
          + `tool call: ${response?.toolInput ? "yes" : "none"}. What came back:\n${preview}`,
        );
      }
      // Actions task: local models return the topics as a bare top-level array
      // (or under "suggestions") instead of {"topics":[...]}. The suggestions
      // caller can normalize those shapes, but validation here rejected them
      // first — "$ must be object; received array." — and the player's real AI
      // suggestions were silently replaced by the canned fallback (field
      // report: only near-identical template topics showed). Coerce the
      // known-good shapes before validating instead of discarding the answer.
      if (taskKey === "actions" && parsed && typeof parsed === "object") {
        if (Array.isArray(parsed)) {
          parsed = { topics: parsed };
        } else if (!Array.isArray(parsed.topics) && Array.isArray(parsed.suggestions)) {
          parsed = { topics: parsed.suggestions };
        }
      }
      // A single mistyped optional field must not discard the whole turn to the
      // canned fallback: the model sometimes returns `catalyst` as a prose
      // string, and sometimes as an object with 0-1 choices — the schema wants
      // object-with-2+-choices or null, and either malformation used to fail
      // the ENTIRE payload ("$.catalyst.choices must contain at least 2
      // items", a real field report). A broken optional scene is simply no
      // scene: coerce it to null so the turn's real content still applies.
      if (parsed && typeof parsed === "object" && parsed.catalyst != null) {
        const catalyst = parsed.catalyst;
        const choices = Array.isArray(catalyst?.choices)
          ? catalyst.choices.filter((choice) => normalizeString(choice))
          : [];
        if (typeof catalyst !== "object" || Array.isArray(catalyst) || choices.length < 2) {
          parsed.catalyst = null;
        } else {
          parsed.catalyst = { ...catalyst, choices };
        }
      }
      // Same philosophy for diplomaticOutreach: one half-written entry (no
      // opening message, no counterpart) must not cost the turn — drop the
      // broken entry, keep the rest.
      if (Array.isArray(parsed?.diplomaticOutreach)) {
        parsed.diplomaticOutreach = parsed.diplomaticOutreach.filter((entry) =>
          entry && typeof entry === "object" && !Array.isArray(entry)
          && normalizeString(entry.openingMessage || entry.message)
          && (Array.isArray(entry.countries) ? entry.countries.length > 0 : Boolean(normalizeString(entry.countries))));
      }
      // Invented statistics must not cost the turn. Now that events finally
      // report real world changes, the model also reports numbers the sheet has
      // no slot for ("stats.economy.researchAndDevelopment"), and a closed schema
      // rejected the ENTIRE payload over one of them. Anything outside the schema
      // is moved into the change's note, so the observation survives as prose
      // instead of taking a whole turn down with it.
      for (const event of Array.isArray(parsed?.events) ? parsed.events : []) {
        const changes = event?.impacts?.polityChanges;
        if (!Array.isArray(changes)) continue;
        // A polityChange with no `code` names no country, so the engine discards it
        // — but the SCHEMA required it, so one of them failed the whole turn
        // instead ("$.events[6].impacts.polityChanges[1].code is required", fifteen
        // orders left unplayed). Two recoveries before dropping it: `name` alone is
        // the model saying WHICH country rather than renaming one, and a change
        // that names nothing at all is inert either way.
        event.impacts.polityChanges = changes.filter((change) => {
          if (!change || typeof change !== "object") return false;
          if (normalizeString(change.code || change.id || change.polityCode)) return true;
          const name = normalizeString(change.name || change.newName);
          if (name) {
            change.code = name;
            delete change.name;
            delete change.newName;
            console.info(`[ai] a polityChange named no country — read "${name}" as the country rather than as a rename.`);
            return true;
          }
          console.warn("[ai] dropped a polityChange that named no country at all.");
          return false;
        });
        for (const change of event.impacts.polityChanges) {
          const retyped = coerceToSchema(change, POLITY_CHANGE_SCHEMA);
          if (retyped.length > 0) {
            console.info(`[ai] retyped ${retyped.length} stat field(s) to match the schema: ${retyped.join("; ")}`);
          }
          const dropped = pruneToSchema(change, POLITY_CHANGE_SCHEMA);
          if (dropped.length > 0 && change && typeof change === "object") {
            const note = normalizeString(change.note);
            change.note = `${note}${note ? " " : ""}(${dropped.join("; ")})`.slice(0, 400);
          }
        }
      }
      // Same idea for markerOps. The engine has always accepted `found`/`destroy`
      // as aliases and a build written flat, but the schema only ever allowed the
      // canonical spelling — and a single rejected op fails the WHOLE payload, so
      // one flattened building cost the player the entire turn. Rewrite to the
      // canonical shape here, before validation, so the turn survives.
      for (const event of Array.isArray(parsed?.events) ? parsed.events : []) {
        const ops = event?.impacts?.markerOps;
        if (!Array.isArray(ops)) continue;
        event.impacts.markerOps = ops.map((op) => {
          if (!op || typeof op !== "object") return op;
          const kind = String(op.op ?? "").trim().toLowerCase();
          const canonical = kind === "found" ? "build" : kind === "destroy" ? "remove" : kind;
          if (canonical !== "build" || op.marker) return { ...op, op: canonical };
          // Flat build: lift the structure's own fields under `marker`.
          const { op: _op, note, ...marker } = op;
          return { op: "build", marker, ...(note == null ? {} : { note }) };
        });
      }
      // Whatever survived the rewrites above still has to FIT. Drop unknown fields
      // from every op rather than letting one of them fail the payload (see
      // pruneOpToSchema). Logged, because a silently discarded field the model
      // meant is a thing worth seeing in the console.
      {
        const droppedFields = [];
        const droppedOps = [];
        for (const event of Array.isArray(parsed?.events) ? parsed.events : []) {
          for (const [key, opSchema] of Object.entries(OP_SCHEMAS)) {
            const ops = event?.impacts?.[key];
            if (!Array.isArray(ops)) continue;
            for (const op of ops) droppedFields.push(...pruneOpToSchema(op, opSchema));
            // ONE BAD OP COSTS ONE OP. Pruning and clamping fix most of them; what
            // is left is an op with a required field simply missing, and a closed
            // anyOf reports that as "matched no branch" — which fails the entire
            // payload and throws the turn away. The house rule is that nothing is
            // lost silently, not that everything is kept: drop the op, say so, and
            // let the other thirty things the model got right through.
            const survivors = ops.filter((op) => {
              const error = validateAgainstSchema(opSchema, op, "$");
              if (!error) return true;
              droppedOps.push(`${key}: ${error}`);
              return false;
            });
            if (survivors.length !== ops.length) event.impacts[key] = survivors;
          }
        }
        // THE SAME RULE FOR THE TOP-LEVEL LISTS.
        //
        // Live: the model finally filled actionOutcomes — and entry [7] was
        // missing its `outcome`, so "$.actionOutcomes[7].outcome is required"
        // failed the whole payload and the turn fell back to an earlier
        // generation that had rated nothing at all. Eighteen orders' worth of
        // verdicts thrown away over one row. One bad row costs one row.
        for (const [key, itemSchema] of Object.entries(TOP_LEVEL_ITEM_SCHEMAS)) {
          const list = parsed?.[key];
          if (!Array.isArray(list)) continue;
          for (const item of list) droppedFields.push(...pruneOpToSchema(item, itemSchema));
          const survivors = list.filter((item) => {
            const error = validateAgainstSchema(itemSchema, item, "$");
            if (!error) return true;
            droppedOps.push(`${key}: ${error}`);
            return false;
          });
          if (survivors.length !== list.length) parsed[key] = survivors;
        }
        if (droppedFields.length > 0) {
          console.info(`[ai] dropped ${droppedFields.length} field(s) the schema has no slot for: ${droppedFields.join("; ")}`);
        }
        if (droppedOps.length > 0) {
          console.warn(
            `[ai] dropped ${droppedOps.length} malformed op(s) rather than failing the whole turn:`,
            droppedOps,
          );
        }
      }
      // PATCH-STYLE RETRY REPAIR. Told "$.summary is required", a local model
      // very often answers with just the piece the error named — {"summary":
      // "..."} — instead of the whole object again. The engine then reported
      // "$.events is required" and handed the player canned events, throwing
      // away the complete turn attempt 1 had already produced (a real field
      // report, captured live). Any key the retry did not restate is refilled
      // from the best earlier candidate, so a patch upgrades that answer
      // instead of replacing it.
      if (bestCandidate && parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        for (const [key, value] of Object.entries(bestCandidate)) {
          if (parsed[key] === undefined) parsed[key] = value;
        }
      }
      // Task-level repair of fields the engine can derive (see repairPayload).
      if (typeof repairPayload === "function" && parsed && typeof parsed === "object") {
        try {
          repairPayload(parsed);
        } catch (error) {
          console.warn(`[ai] task "${taskKey}" payload repair failed.`, error);
        }
      }
      let validation = parsed
        ? validateGameplayPayload(taskKey, parsed)
        : { valid: false, error: "Response did not contain parseable JSON or tool arguments." };
      // A candidate that satisfies the SCHEMA is a usable turn even when the
      // task-level validator wants a better one. Remember the richest such
      // candidate: if the retry then comes back worse (or not at all), the
      // player gets this instead of the deterministic fallback.
      if (validation.valid) {
        const events = Array.isArray(parsed?.events) ? parsed.events.length : 0;
        const bestEvents = Array.isArray(bestCandidate?.events) ? bestCandidate.events.length : -1;
        if (!bestCandidate || events > bestEvents) bestCandidate = parsed;
      }
      if (validation.valid && validatePayload) {
        // finalAttempt tells the validator this is the last chance: callers use
        // it to switch from strict (return a corrective error for the retry) to
        // salvage (repair the payload in place). It MUST come from here, not
        // from counting validator invocations — when attempt 1 dies at the
        // schema/parse level this validator never runs, so an invocation
        // counter would treat attempt 2 as "first", return strict feedback
        // meant for the model, and hand the player a fallback whose reason
        // reads "Resend the same response with ..." (a real field report).
        const taskError = normalizeString(
          await validatePayload(parsed, { attempt: outputAttempt, finalAttempt: outputAttempt === 2 }),
        );
        if (taskError) validation = { valid: false, error: taskError };
      }

      if (validation.valid) {
        return { generation: { source: "ai", fallbackReason: "" }, payload: parsed };
      }

      failureReason = validation.error;
      if (outputAttempt === 1 && !controller.signal.aborted) {
        history.push({
          role: "model",
          parts: [{ text: rawText || JSON.stringify(parsed ?? null) }],
        });
        // A model that answered with a tool call is told to call it again; one
        // that answered in prose (local models without tool support) is told to
        // answer in raw JSON — telling it to call a tool it cannot see wastes
        // the one retry this task gets.
        const retryInstruction = response?.toolInput
          ? `Call ${tool?.name || "the required tool"} again with corrected input.`
          : "Respond again with ONLY the corrected JSON object - no prose, no explanations, no markdown fences, just the JSON.";
        history.push({
          role: "user",
          parts: [{ text: `Your previous structured answer failed validation: ${validation.error} ${retryInstruction}` }],
        });
      }
      outputAttempt += 1;
    }
  } catch (error) {
    const actualError = controller.signal.aborted ? controller.signal.reason : error;
    failureReason = normalizeString(actualError?.message || actualError) || failureReason;
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
    if (heavyTask) endHeavyAiTask();
  }

  // A deliberate user cancel must NOT silently fall back to canned events —
  // propagate the abort so the caller can quietly cancel the jump with no state
  // change. (A timeout still uses the fallback, as before.)
  if (signal?.aborted) {
    throw signal.reason instanceof Error
      ? signal.reason
      : new DOMException("Timeline jump cancelled.", "AbortError");
  }

  // LAST-CANDIDATE SALVAGE. A generation that satisfied the schema is a real
  // turn the model actually wrote; only the task-level validator (event count,
  // queue coverage, world-change checks) turned it down, and those are quality
  // preferences, not correctness. Canned fallback events carry no transfers, no
  // diplomacy and no action resolution, so they are strictly worse than the
  // model's own answer — give the salvage validator (finalAttempt semantics: it
  // repairs in place instead of complaining) one look and use it if it holds.
  if (bestCandidate) {
    try {
      const salvageError = validatePayload
        ? normalizeString(await validatePayload(bestCandidate, { attempt: 2, finalAttempt: true }))
        : "";
      if (!salvageError && validateGameplayPayload(taskKey, bestCandidate).valid) {
        console.warn(`[ai] task "${taskKey}" retry failed (${failureReason}) — keeping the earlier valid generation instead of the fallback.`);
        return { generation: { source: "ai", fallbackReason: "" }, payload: bestCandidate };
      }
    } catch (error) {
      console.warn(`[ai] task "${taskKey}" salvage of the earlier generation failed.`, error);
    }
  }

  if (typeof fallback !== "function") {
    throw new Error(`AI task "${taskKey}" failed: ${failureReason}`);
  }

  console.warn(`[ai] task "${taskKey}" failed (${failureReason}) — using the deterministic fallback.`);
  return {
    generation: { source: "fallback", fallbackReason: failureReason },
    payload: await fallback(),
  };
};

// Read per call rather than frozen at import, so changing them in Settings takes
// effect on the next turn instead of on the next reload. See CONSOLIDATION_KEYS
// in runtime/mapSettings.js for what each one means and why it is exposed.
//
// BATCH_SIZE stays a constant: it is not a preference but a ceiling on how much
// prose one consolidation call may be handed at once, and raising it past what
// the model can read is a way to lose a batch rather than a way to tune anything.
const CONSOLIDATION_BATCH_SIZE = 60;

const consolidateHistoryBatch = async (bundle, events, chats) => {
  const variables = await buildTemplateVariables(bundle, {
    chatsToConsolidate: buildDetailedChatHistoryText(chats, { limit: chats.length || 1, messageLimit: 100 }),
    eventsToConsolidate: buildEventHistoryText(events, { limit: events.length || 1 }),
    // What already stands, so the model UPDATES a key rather than inventing a
    // second one for the same subject — the whole saving depends on that.
    standingFacts: buildLedgerText(normalizeWorldState(bundle.world).campaignLedger),
    // The pairs that already went wrong, so this consolidation can clean up after
    // the rounds that ran before the block above reached the prompt at all.
    duplicateFacts: buildNearDuplicateText(normalizeWorldState(bundle.world).campaignLedger),
  });
  const { generation, payload } = await runJsonTask("eventConsolidator", {
    fallback: () => ({
      summary: [
        events.map((event) => `${event.date || "undated"} ${event.title}: ${event.description}`).join("; "),
        buildChatSummaryText(chats, { limit: chats.length || 1 }),
      ].filter(Boolean).join("\n"),
    }),
    timeoutMs: getMapSetting(MAP_SETTING_KEYS.limitAiGeneration) ? 60000 : 0,
    userMessage: "Consolidate the supplied campaign history with the required tool.",
    variables,
  });
  return {
    generation,
    ledger: normalizeArray(payload?.ledger),
    summary: normalizeString(payload?.summary),
  };
};

// A period can only move the numbers of the countries it was ABOUT. Asking about
// every polity on the map would cost a prompt the size of the turn itself and
// invite the model to sprinkle movement everywhere; asking about the player alone
// would leave the rest of the world permanently frozen. So: the player, plus
// whoever this period's events actually named or acted on, capped.
const STAT_SHIFT_MAX_COUNTRIES = 3;
const STAT_SHIFT_MAX_EVENTS = 14;

const countriesThisPeriodTouched = (events, playerCode) => {
  const counted = new Map();
  const bump = (code, weight) => {
    // The model hands OBJECTS through here — a createdChats country arrived as
    // {"code":"","name":"Kazakhstan"} and String() made it "[object Object]",
    // which then got a stat sheet generated, acted on, and (since seeds began
    // persisting) SAVED under that key. Only a name names a country: objects
    // are read through their own name fields, and anything still object-shaped
    // after that is refused.
    const raw = typeof code === "string" || typeof code === "number"
      ? code
      : code && typeof code === "object"
        ? (code.name ?? code.code ?? code.country ?? "")
        : "";
    const key = normalizeString(raw);
    if (!key || key === playerCode || key.startsWith("[object")) return;
    counted.set(key, (counted.get(key) ?? 0) + weight);
  };
  for (const event of normalizeArray(events)) {
    // A polityChange is the strongest signal there is: the turn already decided
    // something about that country.
    for (const change of event?.impacts?.polityChanges ?? []) bump(change?.code, 3);
    for (const transfer of event?.impacts?.regionTransfers ?? []) { bump(transfer?.toCode, 3); bump(transfer?.fromCode, 2); }
    for (const op of event?.impacts?.markerOps ?? []) bump(op?.marker?.ownerCode, 1);
    for (const chat of event?.impacts?.createdChats ?? []) for (const code of chat?.countries ?? []) bump(code, 1);
  }
  return [...counted.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, Math.max(0, STAT_SHIFT_MAX_COUNTRIES - 1))
    .map(([code]) => code);
};

// WHAT THIS PERIOD DID TO THE NUMBERS.
//
// The stat sheet had stopped moving: measured across this campaign's 28 rollback
// snapshots, GDP was unchanged for 27 rounds and energyAutonomy never changed
// once, while the player spent those rounds building energy plants. The channel
// meant to carry it — polityChanges[].stats — is a nested optional object, and
// the model fills its flat member (stability, 17 of 28 rounds) and not its
// nested ones (economy 0, indices 0). A dedicated flat pass is the shape fix.
const recordStatShifts = async (bundle, freshEvents) => {
  const world = normalizeWorldState(bundle.world);
  const playerCode = normalizeString(bundle.game?.country);
  const date = normalizeString(bundle.game?.gameDate);
  const events = normalizeArray(freshEvents).filter((event) => normalizeString(event?.kind) !== "advance");
  if (events.length === 0) return null;

  // A PIVOTAL DATE ON THE SCHEDULE IS A SHOWN SHEET. Brexit, live: the June
  // 2016 referendum was narrated, the model reported "UK sovereignty" moving,
  // and the acceptance gate rightly dropped it — the United Kingdom had no
  // sheet in the prompt, and a number you were never shown is not one you can
  // move. The gate held; the SUPPLY was wrong. A pivotal entry's actors are
  // known before the turn runs, so their sheets ride along with the same
  // mid-turn seeding any acted-on country gets, and the scheduled moment can
  // move the numbers of exactly the countries it is about. Backlog entries
  // (missed, riding to the next prompt) are included too — their sheet then
  // already stands when the entry finally fires.
  const historyHead = normalizeArray(world.simulationHistory)[0];
  const periodStart = normalizeString(historyHead?.fromDate)
    || events.map((event) => normalizeString(event?.date)).filter(Boolean).sort()[0]
    || "";
  const pivotalActors = [...new Set([
    ...timelineWindow(normalizeTimeline(world.periodTimeline), periodStart, date),
    ...normalizeTimeline(world.timelineBacklog),
  ].filter((entry) => entry.weight === "pivotal")
    .flatMap((entry) => normalizeArray(entry.actors))
    .map((actor) => toCountryName(normalizeString(actor)))
    .filter((actor) => actor && actor !== playerCode))];
  if (pivotalActors.length > 0) {
    console.info(`[stats] pivotal schedule this period names ${pivotalActors.join(", ")} — their sheet(s) ride along so the moment can move their numbers.`);
  }

  const codes = [...new Set([playerCode, ...pivotalActors, ...countriesThisPeriodTouched(events, playerCode)])].filter(Boolean);
  // Nothing to move against. The sheets are generated lazily when the player
  // first opens the pane, so an untouched country simply has no baseline yet —
  // and inventing one here would be this pass making up a country's economy.
  // A COUNTRY NOBODY HAS LOOKED AT HAS NO NUMBERS TO MOVE.
  //
  // Sheets are generated when the player first opens that country's pane, so the
  // world outside the one they inspect had no baseline — and a reported change
  // with no baseline is an invention, which this refuses. That left every foreign
  // power permanently frozen. So a country this period genuinely acted on gets a
  // sheet made for it, once, and is thereafter a real participant.
  // The seeds are handed BACK to the caller, not only written to storage:
  // generateCountryStatSheet persists them mid-turn, and the final
  // writeWorldState(nextWorld) — derived from the PRE-turn world — then wrote
  // straight over that. Live: Saudi Arabia got a "first stat sheet" in round 34
  // and again in round 35, while its deltas (folded into nextWorld properly)
  // survived — deltas against a base that vanished each time.
  const seeded = {};
  let statsWorld = world;
  for (const code of codes) {
    // Only a REAL base skips the seed — every generated base is __asOf-stamped
    // at persist time. The event path can leak a one-line stat FRAGMENT into
    // world.countryStats (live: Philippines held only {stability}), and a
    // truthiness check read that fragment as a full sheet: the country was
    // silently never seeded, and the shift pass then rated numbers against a
    // baseline that was one line long.
    const standingBase = statsWorld.countryStats?.[code];
    if (standingBase?.__asOf) continue;
    if (standingBase) {
      console.info(`[stats] ${code} holds only a stat fragment (no __asOf stamp) — seeding a full base under it.`);
    }
    try {
      await generateCountryStatSheet({ code, name: code });
      statsWorld = normalizeWorldState(await readWorldState({ force: true }));
      if (statsWorld.countryStats?.[code]) seeded[code] = statsWorld.countryStats[code];
      console.info(`[stats] generated a first stat sheet for ${code} — this period acted on it.`);
    } catch (error) {
      console.warn(`[stats] could not seed a stat sheet for ${code}; its numbers stay unmoved this turn.`, error);
    }
  }

  const sheets = codes
    .map((code) => {
      const sheet = mergeStatSheet(statsWorld.countryStats?.[code], statsWorld.countryStatChanges?.[code]);
      return { code, sheet, text: buildStatSheetText(sheet) };
    })
    .filter((entry) => entry.text);
  // Even with nothing to ask about, sheets seeded above must reach the caller
  // or the final world write clobbers them.
  if (sheets.length === 0) return { entries: world.countryStatChanges ?? {}, seeded };
  // What each field stands at today, so a reported move is measured against the
  // real number rather than against an empty delta store — and so a country that
  // was never shown a sheet cannot have one invented for it.
  const baselines = Object.fromEntries(sheets.map((entry) => [entry.code, entry.sheet]));

  const variables = await buildTemplateVariables(bundle, {
    statPeriodEvents: events
      .slice(-STAT_SHIFT_MAX_EVENTS)
      .map((event) => `- ${normalizeString(event.date)} ${normalizeString(event.title)}: ${normalizeString(event.description)}`)
      .join("\n"),
    statSheets: sheets.map((entry) => `## ${entry.code}\n${entry.text}`).join("\n\n"),
  });

  const { payload } = await runJsonTask("countryStatShift", {
    fallback: () => ({ changes: [] }),
    timeoutMs: getMapSetting(MAP_SETTING_KEYS.limitAiGeneration) ? 60000 : 0,
    userMessage: "Report the national statistics this period moved.",
    variables,
  });

  const eventText = events.map((event) => `${event.title} ${event.description}`).join(" ");
  const merged = applyStatChanges(statsWorld.countryStatChanges, normalizeArray(payload?.changes), {
    baselines,
    date,
    // The same guard the event path uses, so a delta written into an absolute
    // field is caught in one place however it arrives.
    accept: ({ label, code, next, previous, reason }) =>
      acceptStanding({ label, code, next, previous, eventText: `${eventText} ${reason}` }),
  });

  if ((merged.repaired ?? []).length > 0) {
    console.info(
      `[stats] repaired ${merged.repaired.length} misspelled field name(s): `
      + merged.repaired.map((row) => `${row.code} ${row.from} → ${row.to}`).join("; "),
    );
  }
  if (merged.applied.length > 0) {
    console.info(
      `[stats] ${merged.applied.length} statistic(s) moved: `
      + merged.applied.map((row) => `${row.code} ${row.field} ${row.from ?? "—"} → ${row.to}`).join("; "),
    );
  } else {
    console.info("[stats] this period moved no national statistics.");
  }
  // NEVER SILENTLY. A field name the model invented, a sentence where a figure
  // belongs, a swing nothing accounts for — each is a thing the player would
  // otherwise see simply not happen.
  //
  // Spelled out on the line itself rather than only in the attached array: a
  // console that reads "dropped 6 reported change(s): Array(6)" tells the reader
  // that something went wrong and nothing about what, and the array stays folded.
  if (merged.dropped.length > 0) {
    console.warn(
      `[stats] dropped ${merged.dropped.length} reported change(s): `
      + merged.dropped.map((row) => `${row.code ?? "?"} ${row.field || "?"} — ${row.why}`).join("; "),
    );
  }
  return { entries: merged.entries, seeded };
};

const compactHistoryIfNeeded = async (bundle) => {
  const world = normalizeWorldState(bundle.world);
  const tuning = getConsolidationSettings();
  const round = Number(bundle.game.round) || 1;
  const unconsolidatedEvents = getUnconsolidatedEvents(bundle.events, world);
  // A campaign's opening rounds are the ones a later turn most needs verbatim,
  // and they are also the cheapest to carry. The original holds consolidation
  // off until round 15 for that reason; the size threshold below still fires
  // early if a short campaign somehow buries itself in events anyway.
  const startedConsolidating = round >= tuning.startRound;
  // THE CHUNKS ARE COUNTED FROM THE START ROUND, NOT FROM ROUND ZERO.
  //
  // The original states this cadence outright in its own settings dialog —
  // "startsOnRound, startsOnRound + chunkSize, …" — and mapSettings.js has said
  // the same in prose since these became settings. The code did not: `round %
  // intervalRounds === 0` anchors to round zero, so the start round only gated
  // the FIRST run and then the rhythm drifted off it. Our shipped defaults hid
  // it (15 is a multiple of 5); the original's own WWII++ numbers expose it —
  // 10 and 7 should fire on 10, 17, 24 and fired on 14, 21, 28 instead.
  const onAChunkBoundary = (round - tuning.startRound) % tuning.intervalRounds === 0;
  const shouldCompactEvents = startedConsolidating && (
    unconsolidatedEvents.length > tuning.sizeThreshold ||
    (onAChunkBoundary && unconsolidatedEvents.length > tuning.retainEvents)
  );
  const priorChatIds = new Set(world.consolidatedHistory.flatMap((entry) => entry.chatIds));
  const closedChats = normalizeChats(bundle.chats)
    .filter((chat) => chat.status === "closed" && !priorChatIds.has(chat.id));
  const eventsToConsolidate = shouldCompactEvents
    ? unconsolidatedEvents.slice(0, -tuning.retainEvents).slice(0, CONSOLIDATION_BATCH_SIZE)
    : [];

  if (eventsToConsolidate.length === 0 && closedChats.length === 0) return world;

  const { generation, ledger, summary } = await consolidateHistoryBatch(bundle, eventsToConsolidate, closedChats);
  if (!summary) return world;
  const throughEvent = eventsToConsolidate.at(-1);
  const throughDate = throughEvent?.date || bundle.game.gameDate;

  // THE LEDGER IS WHAT MAKES THE PROSE TAIL SAFE TO CUT.
  //
  // Every consolidation used to append a paragraph and the prompt carried all of
  // them forever. Now the same call also returns the standing facts with keys,
  // so 문재인 취임 REPLACES 황교안 권한대행 rather than sitting beside it, and the
  // renderer can stop shipping the older paragraphs (buildConsolidatedHistoryText).
  // The paragraphs are still kept in the save — nothing is destroyed, it is just
  // no longer all of it in every prompt.
  const merged = mergeLedger(world.campaignLedger, ledger, { date: throughDate });
  if (merged.added.length > 0 || merged.changed.length > 0 || merged.retired.length > 0) {
    console.info(
      `[ledger] ${merged.entries.length} standing fact(s) — ${merged.added.length} new, `
      + `${merged.changed.length} changed, ${merged.retired.length} retired`
      + `${merged.dropped.length > 0 ? `, ${merged.dropped.length} dropped as untouched longest` : ""}.`,
    );
  } else if (ledger.length === 0) {
    console.info("[ledger] this consolidation returned no standing facts — the prose tail is carrying the campaign alone.");
  }

  // Who leads is recorded in the country's own stat sheet, so the ledger states
  // it rather than paraphrasing it. Audited at round 30: leader-south-korea read
  // "대한민국 정부" while the sheet said 문재인, and had done since it was written.
  const leaders = Object.fromEntries(
    Object.entries(world.countryStats ?? {})
      .map(([code, sheet]) => [code, mergeStatSheet(sheet, world.countryStatChanges?.[code])?.leader])
      // A sentinel is not a person: the contamination heal writes "(미확인)"
      // into a sheet's leader slot, and promoting THAT to a ledger fact would
      // make "unknown" the campaign's official word on who leads.
      .filter(([, leader]) => normalizeString(leader) && !isRoleSentinel(leader)),
  );
  const repaired = repairLeaderFacts(merged.entries, leaders, { date: throughDate });
  if (repaired.repaired.length > 0) {
    console.info(`[ledger] restated ${repaired.repaired.length} leader fact(s) from the country's own sheet: ${repaired.repaired.join(", ")}.`);
  }

  // Named, not merged — which of two facts is the truer one is a judgement, and
  // the next consolidation is shown these pairs so it can retire one.
  const duplicates = findLedgerNearDuplicates(repaired.entries);
  if (duplicates.length > 0) {
    console.warn(
      `[ledger] ${duplicates.length} pair(s) of facts look like the same subject under two keys:`,
      duplicates.map((pair) => pair.keys.join(" / ")),
    );
  }

  return normalizeWorldState({
    ...world,
    campaignLedger: repaired.entries,
    consolidatedHistory: [
      ...world.consolidatedHistory,
      {
        chatIds: closedChats.map((chat) => chat.id),
        createdAt: new Date().toISOString(),
        source: generation.source,
        summary,
        throughDate,
        throughEventId: throughEvent?.id || world.consolidatedHistory.at(-1)?.throughEventId || "",
        throughRound: bundle.game.round,
      },
    ],
  });
};

const mergePolityCatalog = (countryCatalog, world) => {
  const merged = new Map();

  for (const country of countryCatalog) {
    if (!country) continue;
    merged.set((country.code || country.name).toUpperCase(), {
      code: country.code || "",
      name: country.name || country.code || "",
    });
  }

  for (const polity of Object.values(normalizeWorldState(world).polityOverrides)) {
    if (!polity) continue;
    merged.set((polity.code || polity.name).toUpperCase(), {
      code: polity.code,
      name: polity.name || polity.code,
    });

    if (polity.name) {
      merged.set(polity.name.toUpperCase(), {
        code: polity.code,
        name: polity.name,
      });
    }
  }

  return Array.from(merged.values());
};

// ---- Simulation busy lock ---------------------------------------------------
// The idle diplomacy drip (maybeSendIdleDiplomacy below) must never run - and
// above all never WRITE chat state - while a jump, game-master command, or
// catalyst stage is in flight: those read the full state bundle at entry and
// write it all back at the end, so a concurrent chat write would be silently
// clobbered (or worse, interleave with the rollback snapshot). Every simulation
// entry point wraps itself in beginSimulation/endSimulation; the drip checks
// the counter before starting AND before writing, and simply skips its turn.
let activeSimulations = 0;
const beginSimulation = () => { activeSimulations += 1; };
const endSimulation = () => { activeSimulations = Math.max(0, activeSimulations - 1); };
export const isSimulationBusy = () => activeSimulations > 0;

const resolveInvitees = async (names, world, additionalCountries = []) => {
  // Built once per call from this board's own polities — see the filter below.
  const speechless = buildSpeechlessNames(normalizeWorldState(world));
  const countryCatalog = [
    ...mergePolityCatalog(await loadCountryNames(), world),
    ...normalizeArray(additionalCountries).map((entry) => ({
      code: normalizeString(entry?.code),
      name: normalizeString(entry?.name || entry?.code),
    })),
  ];
  const lookup = new Map();

  for (const country of countryCatalog) {
    lookup.set((country.name || "").toUpperCase(), country);
    if (country.code) {
      lookup.set(country.code.toUpperCase(), country);
    }
  }

  const resolved = normalizeArray(names)
    .map((reference) => {
      const candidates = typeof reference === "string"
        ? [reference]
        : [reference?.name, reference?.code];
      return candidates
        .map((candidate) => lookup.get(normalizeString(candidate).toUpperCase()) || null)
        .find(Boolean) || null;
    })
    .filter(Boolean)
    // A TERRITORY-LESS VOICE IS NEVER A DIPLOMATIC COUNTERPART.
    //
    // Every caller of this is a chat the WORLD opens on the player: an event's
    // createdChats, a jump's diplomaticOutreach, an idle note. The player's own
    // "Internal: Head of Military" cannot send them a diplomatic feeler, and a
    // model that names one here has confused an advisor with a power. The
    // contract in the rules says so too, but rule #2 is that the engine checks
    // rather than asks. The player's own side of this — inviting an advisor
    // into a conversation from the chat panel — does not come through here.
    .filter((entry) => !isTerritorylessVoiceName(entry.name))
    // AND NEITHER IS SOMETHING THAT CANNOT ANSWER.
    //
    // The mirror case: a polity with ground and no voice. A horde holds regions
    // and takes more, so every heuristic that says "owns territory, therefore a
    // government" hands it a chat. The zombie board's own rules put this among
    // its three non-negotiables — nobody opens a channel to the dead, demands
    // its surrender, or waits for a reply — so the engine enforces it here
    // rather than trusting the prompt. See runtime/speechless.js.
    //
    // MATCHED AGAINST THE BOARD, NOT A FIXED LIST. What arrives here is a name
    // the MODEL wrote, and this campaign runs in Korean: it writes "죽은 자",
    // which no English registry can be expected to hold. The zombie spec has
    // always shipped that alias and nothing was reading it, so the set is built
    // from the world's own polities — canonical name plus every alias — with
    // the registry as a floor underneath.
    .filter((entry) => !speechless.has(String(entry.name ?? "").trim().toLowerCase()));
  const unique = new Map(resolved.map((entry) => [entry.code || entry.name, entry]));
  return Array.from(unique.values()).map((entry) => ({
      code: entry.code || "",
      name: entry.name || entry.code || "",
    }));
};

const inferInviteeNames = async (text, world, playerCountry = "") => {
  const countryCatalog = mergePolityCatalog(await loadCountryNames(), world);
  const normalizedText = normalizeString(text).toLowerCase();

  return countryCatalog
    .filter((country) => country.name && country.name.toLowerCase() !== normalizeString(playerCountry).toLowerCase())
    .filter((country) => normalizedText.includes(country.name.toLowerCase()))
    .slice(0, 5)
    .map((country) => country.name);
};

const fallbackActionSuggestions = async (bundle) => {
  const recentTitles = normalizeEvents(bundle.events).slice(-3).map((event) => event.title);
  const topics = DEFAULT_SUGGESTION_TOPICS.map((topic, index) => {
    const recentTitle = recentTitles[index];
    const actions = [
      normalizeActionEntry({
        kind: "action",
        source: "suggested",
        text: `Issue a concrete order addressing ${recentTitle || topic.title.toLowerCase()} and assign a responsible ministry or command.`,
        title: recentTitle ? `Respond to ${recentTitle}` : `Act on ${topic.title}`,
      }),
      normalizeActionEntry({
        kind: "action",
        source: "suggested",
        text: `Prepare a second-order measure that protects ${bundle.game.country || "the polity"} if this line of effort triggers resistance.`,
        title: "Create a contingency layer",
      }),
    ].filter(Boolean);

    return {
      actions,
      description: topic.description,
      id: `fallback-topic-${index}`,
      title: recentTitle || topic.title,
    };
  });

  return { topics };
};

const fallbackDescriptionToAction = async (rawInput, bundle) => {
  const trimmed = normalizeString(rawInput);
  const isChat = CHAT_HINT_PATTERNS.some((pattern) => pattern.test(trimmed));
  const inferredInvitees = isChat
    ? await inferInviteeNames(trimmed, bundle.world, bundle.game.country)
    : [];
  const title = sentenceCase(trimmed.split(/[.!?]/)[0] || trimmed);
  const expandedText = isChat
    ? `${trimmed}. Clarify the objective, the concession you can offer, and the outcome you want before the exchange hardens.`
    : `${trimmed}. Define the instrument, timing, and expected political or military effect so the move can be executed cleanly.`;

  return {
    chatStarter: isChat ? trimmed : "",
    invitees: inferredInvitees,
    kind: isChat ? "chat" : "action",
    text: expandedText.slice(0, 520),
    title: title.length > 72 ? `${title.slice(0, 69)}...` : title,
  };
};

const pickMentionedSpeaker = (messageText, participants, excludedSpeaker) => {
  const normalizedText = normalizeString(messageText).toLowerCase();
  if (!normalizedText) return null;

  return (
    participants.find((country) => {
      if (country.name === excludedSpeaker) return false;
      return normalizedText.includes(country.name.toLowerCase());
    }) ?? null
  );
};

const fallbackNextSpeaker = ({ chat, excludedSpeaker }) => {
  const normalizedChat = normalizeChats([chat])[0];
  if (!normalizedChat) {
    return { nextSpeaker: "" };
  }

  const lastMessage = normalizedChat.messages.at(-1);
  const mentionedSpeaker = pickMentionedSpeaker(lastMessage?.text, normalizedChat.countries, excludedSpeaker);
  if (mentionedSpeaker) {
    return { nextSpeaker: mentionedSpeaker.name };
  }

  const fallbackCountry =
    normalizedChat.countries.find((country) => country.name !== excludedSpeaker) ??
    normalizedChat.countries[0] ??
    { name: "" };

  return {
    nextSpeaker: fallbackCountry.name,
  };
};

export const buildGeneratedChat = async (chatLike, linkEventId, world, { fallbackTitle = "", playerName = "" } = {}) => {
  const countriesInput = Array.isArray(chatLike?.countries) ? chatLike.countries : [];
  const countries = await resolveInvitees(countriesInput, world);
  if (countries.length === 0) return null;

  // The initiating polity speaks first — and it is never the player. When the
  // model names no speaker (or names the player), attribute the opener to the
  // first non-player participant.
  const playerKey = normalizeString(playerName).toUpperCase();
  const matchesPlayer = (country) =>
    playerKey && (normalizeString(country.name).toUpperCase() === playerKey || normalizeString(country.code).toUpperCase() === playerKey);
  const speakerKey = normalizeString(chatLike?.speaker).toUpperCase();
  const initiator =
    countries.find((country) =>
      speakerKey && !matchesPlayer(country)
      && (normalizeString(country.name).toUpperCase() === speakerKey || normalizeString(country.code).toUpperCase() === speakerKey))
    ?? countries.find((country) => !matchesPlayer(country))
    ?? countries[0];

  const entry = normalizeChatEntry({
    countries,
    id: chatLike?.id,
    linkedEventId: linkEventId,
    messages:
      Array.isArray(chatLike?.messages) && chatLike.messages.length > 0
        ? chatLike.messages
        : chatLike?.openingMessage
        ? [
            {
              code: initiator?.code || "",
              role: "leader",
              speaker: initiator?.name || normalizeString(chatLike?.speaker),
              text: chatLike.openingMessage,
              time: "",
            },
          ]
        : [],
    source: normalizeString(chatLike?.source) || "invitation",
    status: "open",
    // A chat must say why it exists: the model's title, else the causing
    // event's title, else at least the participants.
    title: chatLike?.title || fallbackTitle || `Chat with ${countries.map((country) => country.name).join(", ")}`,
  });
  // The initiating polity always speaks first. If no first message survives
  // normalization (the model gave no openingMessage, or only blank text), this
  // would be a titled-but-empty "mystery chat" the player can't make sense of
  // ("no clue why talks started"). Drop it instead of opening an empty thread —
  // such chats otherwise slipped through on the salvage/final AI attempt (where
  // validateChatOpener is no longer enforced) and as opener-less idle-diplomacy
  // notes. Every caller already treats a null return as "no chat".
  if (!entry || entry.messages.length === 0) return null;
  return entry;
};

// Region ownership is keyed by the map's own region id (GID_1, e.g. "DEU.2_1"),
// but the prompts ask the model for a region's original NAME in regionId, and the
// model is never shown an id to copy. An unresolved name is not inert: it becomes
// regionOwnershipOverrides["Bayern"], which matches no geometry feature and so
// paints nothing while still counting as a map change in the timeline. Turn names
// into real ids here; whatever cannot be resolved is REPORTED back to the caller
// so the model can be retried with the real region names in hand (see
// validateGeneratedWorldChanges), and only after that is it dropped so a phantom
// key never reaches the world state.
const regionKey = (value) => normalizeString(value)
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .toLowerCase()
  .replace(/\s+/g, " ");

const resolveRegionTransfers = async (containers, world) => {
  const catalog = await loadRegionCatalog().catch(() => []);
  // Without a catalog we cannot tell a good id from a bad one, and dropping real
  // transfers would be worse than the phantom keys — leave the payload alone.
  if (catalog.length === 0) return [];

  const byId = new Map();
  const byName = new Map();
  for (const region of catalog) {
    byId.set(region.id, region);
    const key = regionKey(region.name);
    if (!key) continue;
    const bucket = byName.get(key);
    if (bucket) bucket.push(region);
    else byName.set(key, [region]);
  }
  const worldState = normalizeWorldState(world);
  const owners = worldState.regionOwnershipOverrides;
  // Owner comparisons are case- and diacritic-insensitive, and the model may
  // name a polity by its era DISPLAY name or an alias ("Second Polish
  // Republic") while ownership is keyed by the owner token ("Poland") —
  // canonicalize through the polity registry before comparing.
  const ownerAlias = new Map();
  for (const [token, entry] of Object.entries(worldState.polityOverrides ?? {})) {
    const canonical = regionKey(token);
    if (!canonical) continue;
    ownerAlias.set(canonical, canonical);
    const displayName = regionKey(entry?.name);
    if (displayName) ownerAlias.set(displayName, canonical);
    for (const alias of entry?.aliases ?? []) {
      const aliasKey = regionKey(alias);
      if (aliasKey) ownerAlias.set(aliasKey, canonical);
    }
  }
  const canonicalOwnerKey = (token) => {
    const key = regionKey(token);
    return ownerAlias.get(key) ?? key;
  };
  const ownerKeyOf = (regionId) => {
    // A legacy save can still hold a code here; canonicalise so it keys as the same
    // owner as everything else rather than as a second, phantom power.
    const override = toCountryName(normalizeString(owners[regionId]));
    if (override) return canonicalOwnerKey(override);
    // No override yet (e.g. the FIRST invasion of a war): the region is still held by
    // its base owner, which the catalog carries. Fall back to it — otherwise
    // regionsOwnedBy() is empty for any not-yet-overridden owner, so disambiguation,
    // the containment near-miss, AND buildTransferFeedback's candidate list all fail
    // exactly when the model most needs them (the transfer that STARTS a conflict).
    const region = byId.get(regionId);
    return canonicalOwnerKey(region?.country || toCountryName(region?.countryCode) || "");
  };
  const regionsOwnedBy = (ownerToken) => {
    const key = canonicalOwnerKey(ownerToken);
    if (!key) return [];
    return catalog.filter((region) => ownerKeyOf(region.id) === key);
  };
  // Every owner key in this resolver is a full country NAME (ownerKeyOf canonicalises
  // codes on the way through), so a country can be matched directly.
  // Whole-country transfer: one entry that hands over EVERY region a polity still
  // holds (total conquest, annexation, unification, partition). Regions the winner
  // already owns are skipped so a self-transfer can't blank an owner.
  const expandWholeCountry = (transfer) => {
    const target = toCountryName(normalizeString(transfer?.regionId) || normalizeString(transfer?.regionName));
    const key = canonicalOwnerKey(target);
    if (!key) return [];
    const toKey = canonicalOwnerKey(toCountryName(transfer?.toCode));
    const owned = catalog.filter((region) => {
      const owner = ownerKeyOf(region.id);
      return owner === key && owner !== toKey;
    });
    return owned.map((region) => ({
      ...transfer,
      fromCode: toCountryName(normalizeString(transfer?.fromCode)) || target,
      regionId: region.id,
      regionName: region.name,
      wholeCountry: undefined,
    }));
  };

  const resolve = (transfer) => {
    // A model that did emit a real id keeps working.
    if (byId.has(normalizeString(transfer?.regionId))) return normalizeString(transfer.regionId);
    const fromKey = canonicalOwnerKey(transfer?.fromCode);
    // Otherwise the name may be in either field: the prompt puts it in regionId,
    // the schema also offers regionName.
    for (const candidate of [transfer?.regionId, transfer?.regionName]) {
      const query = regionKey(candidate);
      if (!query) continue;
      const matches = byName.get(query) ?? [];
      if (matches.length === 1) return matches[0].id;
      // Region names repeat across countries ("Santa Cruz", "Georgia"). Prefer the
      // one the transfer says it is taking territory from; a guess would flip a
      // border on the wrong continent, which is worse than changing nothing.
      if (matches.length > 1 && fromKey) {
        const owned = matches.filter((region) => ownerKeyOf(region.id) === fromKey);
        if (owned.length === 1) return owned[0].id;
      }
      // Near-miss within the losing side's own regions: containment either way
      // ("Ostpreussen" for "Ostpreussen-Sud") is safe when it is unique there.
      if (fromKey && query.length >= 4) {
        const contains = regionsOwnedBy(transfer.fromCode).filter((region) => {
          const name = regionKey(region.name);
          return name.includes(query) || query.includes(name);
        });
        if (contains.length === 1) return contains[0].id;
      }
    }
    return "";
  };

  const unresolved = [];
  for (const { impacts, path } of containers) {
    const transfers = normalizeArray(impacts?.regionTransfers);
    if (transfers.length === 0) continue;
    const resolved = [];
    for (const transfer of transfers) {
      // An explicit whole-country transfer expands FIRST: "annex Belgium" must move
      // every Belgian region even though a region may share the country's name.
      if (transfer?.wholeCountry === true) {
        const expanded = expandWholeCountry(transfer);
        if (expanded.length) {
          console.info(
            `[ai] ${path}.regionTransfers expanded whole country ` +
              `"${normalizeString(transfer?.regionId)}" -> ${normalizeString(transfer?.toCode)}: ` +
              `${expanded.length} region(s).`,
          );
          resolved.push(...expanded);
          continue;
        }
      }
      const regionId = resolve(transfer);
      if (regionId) {
        transfer.regionId = regionId;
        resolved.push(transfer);
        continue;
      }
      // Not a region the map knows — but it may be a POLITY the model meant wholesale
      // ("Austria-Hungary is partitioned"). Expanding beats dropping the change.
      const expanded = expandWholeCountry(transfer);
      if (expanded.length) {
        console.info(
          `[ai] ${path}.regionTransfers treated "${normalizeString(transfer?.regionId)}" as a whole ` +
            `country -> ${normalizeString(transfer?.toCode)}: ${expanded.length} region(s).`,
        );
        resolved.push(...expanded);
        continue;
      }
      unresolved.push({
        label: normalizeString(transfer?.regionName) || normalizeString(transfer?.regionId),
        fromCode: normalizeString(transfer?.fromCode),
        path,
        candidates: regionsOwnedBy(transfer?.fromCode),
      });
      console.warn(
        `[ai] ${path}.regionTransfers dropped "${normalizeString(transfer?.regionId)}"` +
          `${transfer?.regionName ? ` (${normalizeString(transfer.regionName)})` : ""} -> ` +
          `${normalizeString(transfer?.toCode)}: no map region matches that id or name.`,
      );
    }
    impacts.regionTransfers = resolved;
  }
  return unresolved;
};

// One retry's worth of corrective vocabulary: the exact regions the losing side
// currently owns, so a model that wrote "Pomerania" can resend the same answer
// with the real names/ids ("Pomorskie (POL.11_1)") instead of losing the map
// change entirely. The lists stay small — one owner's regions, not the world's.
const buildTransferFeedback = (unresolved) => {
  const lines = [];
  for (const entry of unresolved.slice(0, 3)) {
    const target = entry.label || "(blank)";
    if (entry.candidates.length > 0) {
      const listed = entry.candidates.slice(0, 40)
        .map((region) => `${region.name} (${region.id})`)
        .join(", ");
      const more = entry.candidates.length > 40 ? `, +${entry.candidates.length - 40} more` : "";
      lines.push(
        `${entry.path}.regionTransfers: no map region matches "${target}". ` +
          `Regions currently owned by ${entry.fromCode}: ${listed}${more}.`,
      );
    } else {
      lines.push(
        `${entry.path}.regionTransfers: no map region matches "${target}"` +
          `${entry.fromCode ? ` and no regions are recorded for owner "${entry.fromCode}"` : ""}. ` +
          `Use the region's exact in-game name in regionId, and set fromCode to the region's current owner so the engine can locate it.`,
      );
    }
  }
  lines.push(
    "Resend the same response with these regionTransfers corrected to exact regionId values (or exact names) from the lists above; drop a transfer only if no listed region matches your intent.",
  );
  return lines.join("\n");
};

// Also canonicalizes region ids in place (see resolveRegionTransfers): runJsonTask
// hands the accepted payload straight to the caller, and a payload is only accepted
// once this returns clean, so every applied transfer has passed through here.
//
// strictTransfers: when set, an unresolvable transfer FAILS validation with the
// losing owner's real region list, so runJsonTask's retry gives the model the
// vocabulary to fix its own answer. Callers set it on every attempt EXCEPT the
// last (runJsonTask passes finalAttempt to validatePayload) — the final answer
// must never be rejected into the canned fallback over a name.

// An AI-opened chat must arrive with a reason and a first message — the
// initiating polity speaks first. Empty string when the entry is fine.
const validateChatOpener = (chatLike, path) => {
  const hasMessages = Array.isArray(chatLike?.messages) && chatLike.messages.length > 0;
  if (!normalizeString(chatLike?.title)) {
    return `${path}.title must name the purpose of the chat.`;
  }
  if (!hasMessages && !normalizeString(chatLike?.openingMessage)) {
    return `${path}.openingMessage must carry the initiating polity's first message - never open an empty chat.`;
  }
  return "";
};

// Event text that claims territory changed hands. Word-boundary anchored so
// "preoccupied" or "occupational" never match; deliberately narrow (capture
// verbs, not war verbs) so a defensive battle that moved no borders — a
// legitimate zero-transfer turn — never trips the reluctance guard below.
const CAPTURE_LANGUAGE = /\b(captur\w*|seiz\w*|annex\w*|conquer\w*|occup(?:y|ies|ied|ation)|overr[au]n|liberat\w*|retak\w*|retaken|recaptur\w*|cedes?|ceded|ceding|cession|fell to|falls? to)\b/i;

// Strict/salvage discipline, the same contract clampTimelineDates follows:
// the FIRST attempt returns corrective errors so the model can fix its own
// answer; the SECOND attempt never rejects a finished generation — invalid
// ops are DROPPED in place instead ("$.events[4].impacts.unitOps[0].unitId
// does not identify an existing unit" used to trash whole good turns to the
// canned fallback over one stale id).
export const validateGeneratedWorldChanges = async (candidate, world, { strictTransfers = false } = {}) => {
  const strict = strictTransfers;
  const containers = Array.isArray(candidate?.events)
    ? candidate.events.map((event, index) => ({ impacts: event?.impacts, path: `$.events[${index}].impacts` }))
    : [{ impacts: candidate?.impacts, path: "$.impacts" }];
  const unresolvedTransfers = await resolveRegionTransfers(containers, world);
  if (strict && unresolvedTransfers.length > 0) {
    return buildTransferFeedback(unresolvedTransfers);
  }
  // Reluctance guard (strict attempt only): events that NARRATE a capture while
  // the whole payload ships ZERO regionTransfers are the recurring field report
  // — "two turns of invasions and not a single province transferred". One
  // corrective retry asks the model to reconcile narration with the map (or to
  // strip the capture language if genuinely nothing changed hands). English
  // verb heuristic only — a non-English game just never gets this extra nudge —
  // and the final attempt always passes through salvage, so it can never cost a
  // finished turn. Only for event-shaped payloads: a $.impacts container has no
  // narration to check.
  if (strict && Array.isArray(candidate?.events)) {
    const totalTransfers = containers.reduce(
      (sum, { impacts }) => sum + normalizeArray(impacts?.regionTransfers).length,
      0,
    );
    if (totalTransfers === 0) {
      const captureEvent = candidate.events.find((event) =>
        CAPTURE_LANGUAGE.test(`${normalizeString(event?.title)} ${normalizeString(event?.description)}`));
      if (captureEvent) {
        return `Your events describe territory changing hands (e.g. "${normalizeString(captureEvent.title) || "an event"}") but the payload contains ZERO impacts.regionTransfers. Territorial narration and the map must never disagree: add impacts.regionTransfers entries ({"regionId": exact id or the region's plain name, "toCode": the new owner}) to EVERY event whose text says a region was captured, seized, occupied, annexed, ceded, liberated, or retaken, covering each region it names or implies. If nothing genuinely changed hands in this period, remove the capture language from those events instead, and resend.`;
      }
    }
  }
  const unitIds = new Set(normalizeWorldState(world).units.map((unit) => normalizeString(unit.id)).filter(Boolean));
  const generatedPolities = [];
  for (const { impacts } of containers) generatedPolities.push(...normalizeArray(impacts?.polityChanges));

  for (const { impacts, path } of containers) {
    const keptChats = [];
    for (let index = 0; index < normalizeArray(impacts?.createdChats).length; index += 1) {
      const createdChat = impacts.createdChats[index];
      const countries = await resolveInvitees(createdChat?.countries, world, generatedPolities);
      if (countries.length === 0) {
        if (strict) return `${path}.createdChats[${index}].countries must contain at least one known polity.`;
        continue; // salvage: drop the unresolvable chat, keep the turn
      }
      if (strict) {
        const chatError = validateChatOpener(createdChat, `${path}.createdChats[${index}]`);
        if (chatError) return chatError;
      }
      keptChats.push(createdChat);
    }
    if (impacts && Array.isArray(impacts.createdChats)) impacts.createdChats = keptChats;

    const keptUnitOps = [];
    for (let index = 0; index < normalizeArray(impacts?.unitOps).length; index += 1) {
      const operation = impacts.unitOps[index];
      const operationPath = `${path}.unitOps[${index}]`;
      if (operation.op === "spawn") {
        if (!normalizeString(operation.unit?.name) || !normalizeString(operation.unit?.ownerCode)) {
          if (strict) return `${operationPath}.unit must have nonblank name and ownerCode values.`;
          continue;
        }
        const spawnedId = normalizeString(operation.unit?.id);
        if (spawnedId && unitIds.has(spawnedId)) {
          if (strict) return `${operationPath}.unit.id duplicates an existing unit.`;
          delete operation.unit.id; // salvage: let normalization mint a fresh id
        } else if (spawnedId) {
          unitIds.add(spawnedId);
        }
        keptUnitOps.push(operation);
        continue;
      }

      const unitId = normalizeString(operation.unitId);
      if (!unitId) {
        if (strict) return `${operationPath}.unitId must not be blank.`;
        continue;
      }
      if (!unitIds.has(unitId)) {
        if (strict) return `${operationPath}.unitId does not identify an existing unit.`;
        continue; // salvage: drop the op aimed at a unit that no longer exists
      }
      if (operation.op === "remove" || (operation.op === "strength" && operation.strength === 0)) unitIds.delete(unitId);
      keptUnitOps.push(operation);
    }
    if (impacts && Array.isArray(impacts.unitOps)) impacts.unitOps = keptUnitOps;

    // Marker ops that would be silently dropped by normalization instead fail
    // the strict attempt, so the retry tells the model what was missing.
    const keptMarkerOps = [];
    for (let index = 0; index < normalizeArray(impacts?.markerOps).length; index += 1) {
      const operation = impacts.markerOps[index];
      const operationPath = `${path}.markerOps[${index}]`;
      const op = normalizeString(operation?.op).toLowerCase();
      if (op === "build" || op === "found") {
        const marker = operation.marker ?? operation;
        if (!normalizeString(marker?.name)) {
          if (strict) return `${operationPath}.marker.name must not be blank.`;
          continue;
        }
        if (!Number.isFinite(Number(marker?.lng)) || !Number.isFinite(Number(marker?.lat))) {
          if (strict) return `${operationPath}.marker must carry numeric lng and lat coordinates.`;
          continue;
        }
      } else if (op === "remove" || op === "destroy") {
        if (!normalizeString(operation?.name) && !normalizeString(operation?.markerId)) {
          if (strict) return `${operationPath} must carry the name (or markerId) of the structure to remove.`;
          continue;
        }
      }
      keptMarkerOps.push(operation);
    }
    if (impacts && Array.isArray(impacts.markerOps)) impacts.markerOps = keptMarkerOps;
  }

  // Unprompted outreach chats (top-level, not tied to an event) need real
  // participants exactly like createdChats do.
  if (Array.isArray(candidate?.diplomaticOutreach)) {
    const keptOutreach = [];
    for (let index = 0; index < candidate.diplomaticOutreach.length; index += 1) {
      const countries = await resolveInvitees(
        candidate.diplomaticOutreach[index]?.countries,
        world,
        generatedPolities,
      );
      if (countries.length === 0) {
        if (strict) return `$.diplomaticOutreach[${index}].countries must contain at least one known polity.`;
        continue;
      }
      if (strict) {
        const chatError = validateChatOpener(candidate.diplomaticOutreach[index], `$.diplomaticOutreach[${index}]`);
        if (chatError) return chatError;
      }
      keptOutreach.push(candidate.diplomaticOutreach[index]);
    }
    candidate.diplomaticOutreach = keptOutreach;
  }

  return "";
};

// Canned-turn wording. The deterministic fallback is the ONE place the engine
// writes player-facing prose itself, and it wrote it only in English — so a
// Korean campaign's chronicle quietly filled up with English entries (22 of the
// 27 English events in a captured save came from here), and those entries then
// fed back into every later prompt as English context, nudging the model to
// drift back out of Korean. Templates are keyed by the stored UI language and
// build on the player's OWN action titles, which are already in their language;
// a language with no entry keeps the original English, exactly as before.
const FALLBACK_TEXT = {
  en: {
    actEvent: (country, title) => `${country} acts on ${title.toLowerCase()}`,
    actBody: (country, title) => `${country} begins implementing ${title.toLowerCase()}, producing immediate administrative and political consequences that other powers start to notice.`,
    chatEvent: (country) => `${country} opens a diplomatic channel`,
    chatBody: (country, title) => `${country} opens a deliberate diplomatic channel tied to ${title.toLowerCase()}, forcing counterparts to weigh terms instead of guessing intent.`,
    worldEvent: () => "The wider world advances its own agendas",
    worldBody: (country) => `Beyond ${country}'s borders, rival capitals push their own agendas — negotiations continue, garrisons shift, and markets react to the period's developments on their own schedule.`,
    idleEvent: () => "The international balance remains in motion",
    idleBody: (country) => `Foreign ministries and general staffs keep adjusting to the current balance of power while ${country} gathers its next move.`,
    summaryActive: (country) => `${country} moves from planning into execution, and the world begins adjusting to the turn's most concrete orders.`,
    summaryIdle: (country) => `Time advances without a direct order from ${country}, but the wider system keeps shifting and building pressure.`,
    choices: ["Press the advantage immediately", "Probe cautiously before committing", "Hold position and gather more intelligence"],
    premise: (title) => `This scene begins as ${title.toLowerCase()} reaches the point where direct judgment matters.`,
  },
  ko: {
    actEvent: (country, title) => `${country}, ${title} 착수`,
    actBody: (country, title) => `${country}이(가) ${title}을(를) 실행에 옮기기 시작했으며, 행정적·정치적 파장이 즉시 나타나 주변국들도 이를 주시하기 시작했다.`,
    chatEvent: (country) => `${country}, 외교 채널 개설`,
    chatBody: (country, title) => `${country}이(가) ${title}과(와) 연계된 외교 채널을 열었고, 상대국들은 의도를 추측하는 대신 조건을 따져야 하는 상황에 놓였다.`,
    worldEvent: () => "국제 정세는 그 나름의 속도로 움직인다",
    worldBody: (country) => `${country} 밖에서도 각국 수도는 저마다의 계산을 밀어붙인다. 협상은 계속되고 주둔군은 재배치되며, 시장은 이 기간의 변화에 자기 속도로 반응한다.`,
    idleEvent: () => "국제적 균형은 계속 움직인다",
    idleBody: (country) => `${country}이(가) 다음 수를 가다듬는 동안에도 각국 외무부와 참모본부는 현재의 세력 균형에 맞춰 태세를 조정하고 있다.`,
    summaryActive: (country) => `${country}이(가) 계획 단계에서 실행 단계로 넘어갔고, 세계는 이번 턴의 가장 구체적인 지시들에 적응하기 시작했다.`,
    summaryIdle: (country) => `${country}의 직접적인 지시 없이 시간이 흘렀지만, 국제 정세는 계속 움직이며 압력을 쌓아가고 있다.`,
    choices: ["즉시 우위를 밀어붙인다", "신중하게 탐색한 뒤 판단한다", "현 위치를 유지하며 정보를 더 모은다"],
    premise: (title) => `${title}이(가) 직접적인 판단을 요구하는 지점에 이르면서 이 장면이 시작된다.`,
  },
};

// The clock marker that closes every turn — the original game's "진행 1935/12/5".
// It is not a thing that happened, it is a full stop that pins the date the turn
// advanced to, so it carries its own kind and is filtered out of everything that
// reasons about events (prompt history, dedupe, the world-event quota).
export const TIMELINE_ADVANCE_KIND = "advance";
const ADVANCE_LABEL = { en: "Advance to ", ko: "진행 " };
const timelineAdvancePrefix = () => {
  try {
    return ADVANCE_LABEL[getStoredLanguage()] ?? ADVANCE_LABEL.en;
  } catch {
    return ADVANCE_LABEL.en;
  }
};

// The turn marker's own note. Its TITLE was localized and its body was not, so a
// Korean chronicle ended every turn with "South Korea: 5 order(s) still
// outstanding and carried into the next turn." — the engine's own text, in the
// wrong language, sitting where the player reads.
const OUTSTANDING_NOTE = {
  en: (country, count) => `${country}: ${count} order(s) still outstanding and carried into the next turn.`,
  ko: (country, count) => `${country}: 이행되지 않은 명령 ${count}건이 다음 턴으로 넘어갔습니다.`,
};
const timelineAdvanceNote = (country, count) => {
  try {
    return (OUTSTANDING_NOTE[getStoredLanguage()] ?? OUTSTANDING_NOTE.en)(country, count);
  } catch {
    return OUTSTANDING_NOTE.en(country, count);
  }
};

// MID-TURN INTERVENTION. A jump is several model calls over several minutes,
// and until now the only control the player had while it ran was Cancel. Notes
// dropped here are picked up at the next call boundary inside the running turn —
// the corrective retry of the main generation, a supplemental coverage pass, the
// world pass — so a course correction lands in THIS turn instead of the next.
let pendingJumpIntervention = [];
export const submitJumpIntervention = (text) => {
  const note = normalizeString(text);
  if (!note) return pendingJumpIntervention.length;
  pendingJumpIntervention.push(note);
  return pendingJumpIntervention.length;
};
export const clearJumpInterventions = () => { pendingJumpIntervention = []; };
// A jump is now several model calls deep, and on a local 14B each one is a
// minute or more — so the player needs to see WHICH step is running, or a
// working turn is indistinguishable from a hung one.
let jumpProgressListener = null;
export const setJumpProgressListener = (listener) => {
  jumpProgressListener = typeof listener === "function" ? listener : null;
};
const reportJumpProgress = (label) => {
  try {
    jumpProgressListener?.(normalizeString(label));
  } catch {
    // Progress reporting must never break a turn.
  }
};

// How long the OPTIONAL extra passes (action top-ups, the world pass) may keep a
// turn going before the engine settles for what it already has. The main
// generation itself is never cut off by this — only the extras it would have
// spent further minutes on.
const EXTRA_PASS_BUDGET_MS = 6 * 60 * 1000;

// Recursively drop object keys a closed schema does not allow, returning what was
// removed as readable "path=value" strings so the caller can preserve the sense
// of them somewhere the schema does permit.
const pruneToSchema = (value, schema, path = "") => {
  const dropped = [];
  if (!value || typeof value !== "object" || Array.isArray(value)) return dropped;
  const properties = schema?.properties;
  if (!properties || schema.additionalProperties !== false) return dropped;
  for (const key of Object.keys(value)) {
    const here = path ? `${path}.${key}` : key;
    if (!Object.prototype.hasOwnProperty.call(properties, key)) {
      const raw = value[key];
      dropped.push(`${here}=${typeof raw === "object" ? JSON.stringify(raw) : String(raw)}`.slice(0, 90));
      delete value[key];
      continue;
    }
    dropped.push(...pruneToSchema(value[key], properties[key], here));
  }
  return dropped;
};

// Make a value FIT the type the schema declares, where doing so loses nothing.
//
// "$.events[2].impacts.polityChanges[0].stats.economy.unemployment must be string;
// received number" — the schema calls the economy fields strings because they are
// written as "3.7%" or "$1.7T", and the model sent 3.7. Those are the same fact.
// Refusing it discarded a finished turn and left sixteen orders unplayed.
//
// Only lossless directions, so this can never invent meaning: a number or boolean
// becomes its own text, and a string that is entirely a number becomes that number
// (an integer field additionally requires it to be whole). Anything else is left
// exactly as it was, for the validator to reject on its merits.
const coerceToSchema = (value, schema, path = "") => {
  const fixed = [];
  if (!schema || value == null) return fixed;

  if (Array.isArray(value) && schema.items) {
    value.forEach((entry, index) => {
      const nested = coerceToSchema(entry, schema.items, `${path}[${index}]`);
      if (typeof entry !== "object" && nested.coerced !== undefined) value[index] = nested.coerced;
      fixed.push(...nested);
    });
    return fixed;
  }

  if (typeof value !== "object") return fixed;

  const properties = schema.properties;
  if (!properties) return fixed;

  for (const [key, child] of Object.entries(properties)) {
    const current = value[key];
    if (current == null) continue;

    if (child.type === "string" && (typeof current === "number" || typeof current === "boolean")) {
      value[key] = String(current);
      fixed.push(`${path ? `${path}.` : ""}${key}: ${typeof current} -> string`);
      continue;
    }
    if ((child.type === "number" || child.type === "integer") && typeof current === "string") {
      const asNumber = Number(current.trim());
      if (current.trim() !== "" && Number.isFinite(asNumber)
        && (child.type !== "integer" || Number.isInteger(asNumber))) {
        value[key] = asNumber;
        fixed.push(`${path ? `${path}.` : ""}${key}: string -> ${child.type}`);
      }
      continue;
    }
    // A number outside its range is a fixable number, not a broken turn. Captured
    // live: one unitOp with `unit.lat` past 90 failed every anyOf branch, so the
    // WHOLE jump fell to the deterministic fallback — four events, zero world
    // changes, nineteen orders unplayed and a scheduled entry missed, all for one
    // latitude. A model that writes 95 means the far north; the coordinate is
    // wrong either way and clamping keeps the other thirty things it got right.
    if ((child.type === "number" || child.type === "integer") && typeof current === "number"
      && Number.isFinite(current)) {
      const low = Number.isFinite(child.minimum) ? child.minimum : -Infinity;
      const high = Number.isFinite(child.maximum) ? child.maximum : Infinity;
      const clamped = Math.min(high, Math.max(low, current));
      if (clamped !== current) {
        value[key] = clamped;
        fixed.push(`${path ? `${path}.` : ""}${key}: ${current} -> ${clamped} (out of range)`);
      }
      continue;
    }
    if (typeof current === "object") {
      fixed.push(...coerceToSchema(current, child, `${path ? `${path}.` : ""}${key}`));
    }
  }
  return fixed;
};

// Prune ONE op (a markerOp or unitOp) against whichever anyOf branch it is trying
// to be. The branch is chosen by `op`, which is what discriminates them, and
// anything the branch has no slot for is dropped.
//
// This is the third time the same shape has cost a whole turn. A closed schema
// rejects one unexpected field, anyOf reports that as "matched no branch", and the
// player gets a fallback turn: first an invented stat on a polityChange, then a
// spawn carrying a note, now a marker carrying regionId — a field units have and
// structures did not, so the model reasonably wrote it for both. Every one of them
// was a field the ENGINE would simply have ignored. Whitelisting them one at a time
// as they turn up is losing the argument; drop what does not fit and keep the turn.
const pruneOpToSchema = (op, opSchema) => {
  if (!op || typeof op !== "object" || !Array.isArray(opSchema?.anyOf)) return [];
  const kind = String(op.op ?? "").trim().toLowerCase();
  const branches = opSchema.anyOf.filter((branch) => {
    const allowed = branch?.properties?.op?.enum;
    return Array.isArray(allowed) && allowed.includes(kind);
  });
  if (branches.length === 0) return [];
  // Several branches can share an op (nested vs flat build/spawn). Prune against
  // the one the op already fits best — the most of whose properties it uses — so a
  // flat build is not pruned against the nested branch and stripped to nothing.
  let best = branches[0];
  let bestScore = -1;
  for (const branch of branches) {
    const properties = Object.keys(branch?.properties ?? {});
    const score = properties.filter((key) => op[key] !== undefined).length
      - (branch.required ?? []).filter((key) => op[key] === undefined).length;
    if (score > bestScore) { bestScore = score; best = branch; }
  }
  coerceToSchema(op, best);
  return pruneToSchema(op, best);
};

// The naval map's 118 sea polygons, reused as a land/water test for unit
// placement. Shared with the map layer (runtime/seaRegions.js) so the geometry is
// fetched once per session, not once per consumer.
let _seaPolygonCache = null;
const loadSeaPolygons = async () => {
  if (!_seaPolygonCache) _seaPolygonCache = loadSeaRegionRings().catch(() => []);
  return _seaPolygonCache;
};

// Standard ray-casting point-in-polygon, run against every sea ring.
const isInSea = (lng, lat, rings) => {
  for (const ring of rings) {
    let inside = false;
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i, i += 1) {
      const [xi, yi] = ring[i];
      const [xj, yj] = ring[j];
      if ((yi > lat) !== (yj > lat) && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) inside = !inside;
    }
    if (inside) return true;
  }
  return false;
};

const drainJumpInterventions = () => {
  if (pendingJumpIntervention.length === 0) return "";
  const joined = pendingJumpIntervention.join(" ");
  pendingJumpIntervention = [];
  return joined;
};

const fallbackStrings = () => {
  try {
    return FALLBACK_TEXT[getStoredLanguage()] ?? FALLBACK_TEXT.en;
  } catch {
    return FALLBACK_TEXT.en;
  }
};

const fallbackJumpSimulation = async ({ bundle, days, mode, targetDate }) => {
  const text = fallbackStrings();
  const plannedActions = normalizeActions(bundle.actions).filter((action) => action.status === "planned");
  const firstThreeActions = plannedActions.slice(0, 3);
  const events = [];

  // Ancient/FMG scenarios may use textual or BCE dates. Only perform calendar
  // arithmetic on strict Gregorian dates; otherwise preserve the scenario text.
  const advanceGameDate = (dayCount) =>
    addIsoDays(bundle.game.gameDate, dayCount) || normalizeString(bundle.game.gameDate);

  if (firstThreeActions.length > 0) {
    firstThreeActions.forEach((action, index) => {
      const eventDate = advanceGameDate(
        Math.max(1, Math.round(((index + 1) / (firstThreeActions.length + 1)) * Math.max(days, 1))),
      );

      events.push({
        date: eventDate,
        description:
          action.kind === "chat"
            ? text.chatBody(bundle.game.country, action.title)
            : text.actBody(bundle.game.country, action.title),
        impacts: {
          createdChats:
            action.kind === "chat" && action.invitees.length > 0 && action.chatStarter
              ? [
                  {
                    countries: action.invitees,
                    openingMessage: action.chatStarter,
                    speaker: bundle.game.country,
                    title: action.title,
                  },
                ]
              : [],
          polityChanges: [],
          regionTransfers: [],
        },
        importance: index === firstThreeActions.length - 1 ? "major" : "minor",
        kind: action.kind === "chat" ? "diplomacy" : "player",
        notable: index === firstThreeActions.length - 1,
        playerRelated: true,
        title:
          action.kind === "chat"
            ? text.chatEvent(bundle.game.country)
            : text.actEvent(bundle.game.country, action.title),
      });
    });
    // Even a canned turn keeps the WORLD moving: without this, a fallback with
    // queued actions produced player-echo events only, so consecutive fallback
    // turns read as "nothing but my own actions ever happens".
    events.push({
      date: advanceGameDate(Math.max(1, Math.round(Math.max(days, 1) * 0.75))),
      description: text.worldBody(bundle.game.country),
      impacts: { createdChats: [], polityChanges: [], regionTransfers: [] },
      importance: "minor",
      kind: "world",
      notable: false,
      playerRelated: false,
      title: text.worldEvent(),
    });
  } else {
    const midpoint = advanceGameDate(Math.max(1, Math.round(Math.max(days, 1) / 2)));
    events.push({
      date: midpoint,
      description: text.idleBody(bundle.game.country),
      impacts: {
        createdChats: [],
        polityChanges: [],
        regionTransfers: [],
      },
      importance: mode === "auto" ? "major" : "minor",
      kind: "world",
      notable: mode === "auto",
      playerRelated: false,
      title: text.idleEvent(),
    });
  }

  const lastEvent = events.at(-1) ?? null;
  const catalyst = lastEvent
    ? {
        choices: [...text.choices],
        opening: `${lastEvent.title}. ${lastEvent.description}`,
        premise: text.premise(lastEvent.title),
        title: lastEvent.title,
      }
    : null;

  return {
    catalyst,
    clearActions: true,
    events,
    stopDate: targetDate,
    summary:
      plannedActions.length > 0
        ? text.summaryActive(bundle.game.country)
        : text.summaryIdle(bundle.game.country),
  };
};

const normalizeGeneratedEvent = (entry, index = 0) => {
  const normalized = normalizeEvents([entry])[0];
  if (!normalized) {
    return null;
  }

  return {
    ...normalized,
    id: normalized.id || `generated-event-${index}`,
  };
};

// Raised from 12: the player wants EVERY round restorable in long games.
// Snapshots hold full per-turn state, so the cap stays bounded — 40 turns of
// history — rather than unlimited (the snapshots file is rewritten each turn).
// Domain clustering for stacked action queues (Korean + English keywords —
// actions are authored in either). Deterministic and instant: grouping happens
// HERE, not in the model, so a 24-action queue reaches the model as ~6 labeled
// groups it must resolve with one event each — one pass, no per-action event
// explosion (which both dropped the queue's tail and made the output long
// enough to truncate).
// WHAT AN ORDER PHYSICALLY DOES. Measured on a live save: 105 consecutive
// events carried ZERO regionTransfers, unitOps, markerOps, polityChanges and
// createdChats between them — the world was narrated and never once changed, so
// every downstream idea (per-country personality, a summariser, relationship
// numbers) had nothing to read. A generic "remember to add impacts" instruction
// buried in a 70k-character prompt does not fix that. Classifying each queued
// order HERE lets the turn name the exact requirement per action — "A7 builds
// something, so its event needs markerOps" — and lets the validator check that
// specific promise instead of a vague one.
const ACTION_IMPACT_RULES = [
  {
    field: "markerOps",
    // Something is founded, built, opened or destroyed at a place.
    // "설치" (install) is included because it is how Korean orders phrase putting
    // physical equipment somewhere; deliberately abstract words like "구축" are
    // NOT, since a demanded markerOps for a policy invents nonsense on the map.
    pattern: /(build|construct|install|establish|found|open a|erect|demolish|destroy|base|port|harbou?r|airport|airfield|plant|factory|refinery|institute|laborator|research cent|university|hospital|dam|terminal|complex|facility|건설|건립|설립|설치|신설|증설|착공|준공|개설|기지|항만|항구|공항|발전소|공장|연구소|연구원|센터|대학|병원|시설|단지|플랜트|터미널)/i,
    requirement: "an impacts.markerOps build (or remove) so the structure appears on the map",
  },
  {
    field: "unitOps",
    // Force is raised, moved, garrisoned or stood down.
    pattern: /(deploy|mobili[sz]e|garrison|station|redeploy|reinforce|withdraw|fleet|squadron|brigade|division|battalion|patrol|배치|파병|증파|주둔|전개|재배치|동원|철수|함대|전단|여단|사단|대대|연대|초계|순찰|부대)/i,
    requirement: "impacts.unitOps (spawn/move/strength) with real coordinates so the force exists on the map",
  },
  {
    field: "polityChanges",
    // The country itself changes — policy, institutions, standing, leadership.
    pattern: /(reform|policy|programme|program|budget|subsid|tax|law|legislat|election|referendum|constitution|nationali[sz]|privati[sz]|sanction|leader|government|개혁|정책|제도|예산|보조금|세제|법안|입법|선거|국민투표|개헌|국유화|민영화|제재|지도자|정부|규제|복지|교육|고용|산업|투자|육성)/i,
    requirement: "impacts.polityChanges carrying the stats or reputation this actually moved",
  },
  {
    field: "createdChats",
    // Somebody has to be talked to.
    pattern: /(summit|talks|negotiat|treaty|pact|accord|alliance|diplomat|delegation|memorandum|agreement|회담|협상|조약|협정|동맹|외교|사절|대표단|수교|양해각서|합의)/i,
    requirement: "impacts.createdChats (or a diplomaticOutreach entry) so the other side actually speaks",
  },
];

// Which world-state fields an order is expected to move, by its own wording.
const expectedImpactFields = (action) => {
  const haystack = `${normalizeString(action?.title)} ${normalizeString(action?.text || action?.rawInput)}`;
  return ACTION_IMPACT_RULES.filter((rule) => rule.pattern.test(haystack)).map((rule) => rule.field);
};

// ACTION_DOMAINS now lives in ./actionCoverage.js, next to the matcher that reads
// it back: the grouping the model is SHOWN and the grouping used to interpret its
// answer have to be the same list, and two copies would drift.

const clusterPlannedActions = (actions) => {
  const groups = new Map();
  for (const action of normalizeActions(actions)) {
    const haystack = `${action.title} ${action.text} ${action.rawInput}`;
    // Diplomatic chat actions belong with diplomacy regardless of wording.
    const domain = action.kind === "chat"
      ? "Diplomacy & Alliances"
      : (ACTION_DOMAINS.find((entry) => entry.pattern.test(haystack))?.label ?? OTHER_DOMAIN);
    if (!groups.has(domain)) groups.set(domain, []);
    groups.get(domain).push(action);
  }
  return [...groups.entries()].map(([label, grouped]) => ({ label, actions: grouped }));
};

// The grouped queue as prompt text — replaces the flat plannedActions variable
// on large queues. The header carries the contract (one event per group, all
// ids listed) plus the era-grounding nudge: real policies and projects of the
// period beat generic invented outcomes.
const buildGroupedActionsText = (groups) => [
  "The queued actions below are PRE-GROUPED by domain. Resolve each group with ONE event (two only for a large or eventful group) whose impacts.actionIds lists that group's ids — the LAST group matters exactly as much as the first. Where the era and region had REAL policies, programs, projects or precedents matching a group, use them as the vehicle for the outcome instead of inventing a generic one.\n\nA GROUP IS NOT A PERMISSION SLIP. Grouping exists so related orders can share one well-written event, NOT so one event can absorb a group's ids without addressing them. List an order's id ONLY if that event's own text visibly carries that order out — names what was done about it, or says plainly that it was attempted and failed. Orders land in the same group because they share a DOMAIN, not because they are the same work: a directive to suppress domestic extremism and an education-reform programme are both internal affairs and are not each other. If one event cannot honestly carry every order in a group, write a second event for the rest, or leave that order's id out entirely and let it stay queued. An order marked resolved by an event that never mentions it is the one outcome this game treats as a bug.",
  ...groups.map((group, index) => [
    `[Group ${index + 1} — ${group.label}] (${group.actions.length} action(s); ids to cover: ${group.actions.map((action) => action.id).join(", ")})`,
    ...group.actions.map((action) => (action.title
      ? `- [id: ${action.id}] ${action.title}: ${buildActionDisplayText(action)}`
      : `- [id: ${action.id}] ${buildActionDisplayText(action)}`)),
  ].join("\n")),
].join("\n\n");

// HOOK 1 of the stat-hook batch (docs/STAT-HOOKS.md): the numbers finally touch
// the game. The audit that triggered it found stability and the strategic
// indices had NO mechanical consumers at all — carefully written, never read.
// Here the difficulty's setback quota reads the player's own order: a stable,
// well-policed state executes more cleanly than the difficulty's flat ask; a
// state below 50 fumbles more; below 25, the machinery of government itself is
// failing. Engine arithmetic on engine-held numbers — the model is never asked
// to do this math.
const monthsBetweenDates = (from, to) => {
  const a = /^(\d{4})-(\d{2})/.exec(normalizeString(from));
  const b = /^(\d{4})-(\d{2})/.exec(normalizeString(to));
  if (!a || !b) return 0;
  return (Number(b[1]) - Number(a[1])) * 12 + (Number(b[2]) - Number(a[2]));
};

const playerSetbackModulation = (world, game) => {
  try {
    const playerCode = normalizeString(game?.country);
    if (!playerCode) return { delta: 0, why: "" };
    const normalized = normalizeWorldState(world);
    const { __asOf: _asOf, __format: _format, ...base } = normalized.countryStats?.[playerCode] ?? {};
    if (Object.keys(base).length === 0) return { delta: 0, why: "" };
    const sheet = mergeStatSheet(base, normalized.countryStatChanges?.[playerCode]);
    const stability = Number(sheet?.stability);
    if (!Number.isFinite(stability) || stability <= 0) return { delta: 0, why: "" };
    const rawSecurity = Number(sheet?.indices?.internalSecurity);
    const security = Number.isFinite(rawSecurity) && rawSecurity > 0 ? rawSecurity : stability;
    if (stability < 25) return { delta: 2, why: `안정 ${stability} — 내부 혼란이 이행 자체를 갉아먹는다` };
    if (stability < 50 || security < 50) return { delta: 1, why: `안정 ${stability}·치안 ${security} — 흔들리는 내부가 이행을 흔든다` };
    if (stability >= 85 && security >= 85) return { delta: -1, why: `안정 ${stability}·치안 ${security} — 질서가 이행을 떠받친다` };
    return { delta: 0, why: "" };
  } catch {
    return { delta: 0, why: "" };
  }
};

const MAX_ROLLBACK_SNAPSHOTS = 40;

// Persist the PRE-turn state so the cheats menu's "Roll back turn" can restore it.
// A dedicated per-game runtime asset (storage/snapshots.json) — never bundled with
// a scenario or dragged through the 5s poll — capped so a long game can't grow it
// without bound. Purely best-effort: a snapshot failure must never break a turn.
const captureRollbackSnapshot = async ({ round, fromDate, toDate, game, world, events, actions, chat, colors }) => {
  try {
    const prior = await readJson(JSON_URLS.snapshots, { defaultValue: [], force: true }).catch(() => []);
    let list = Array.isArray(prior) ? prior : [];
    // A retried turn re-captures the same base (snapshot-first means a crashed
    // generation leaves its snapshot behind): same round + same start date at
    // the head is the same restore point, replaced rather than stacked.
    if (list[0] && String(list[0].round) === String(round) && String(list[0].fromDate) === String(fromDate)) {
      list = list.slice(1);
    }
    const snapshot = {
      id: `snap-${round}-${Date.now()}`,
      round,
      fromDate,
      toDate,
      capturedAt: new Date().toISOString(),
      state: {
        game: cloneValue(game),
        world: cloneValue(world),
        events: cloneValue(events),
        actions: cloneValue(actions),
        chat: cloneValue(chat),
        colors: cloneValue(colors),
      },
    };
    await writeJson(JSON_URLS.snapshots, [snapshot, ...list].slice(0, MAX_ROLLBACK_SNAPSHOTS));
  } catch (error) {
    console.warn("[rollback] snapshot capture failed:", error);
  }
};

// Restore points, newest first (index 0 = undo the most recent turn). Shared by
// the cheats menu and the timeline's Undo control.
export const loadRollbackSnapshots = async () => {
  const list = await readJson(JSON_URLS.snapshots, { defaultValue: [], force: true }).catch(() => []);
  return Array.isArray(list) ? list : [];
};

// Roll back to the start of the turn captured at `index`: restore the six
// per-turn assets, discard that restore point and every newer one (those turns
// no longer happened), and return the freshly-normalized bundle so the caller
// can update immediately. Returns null if there is no such snapshot.
export const rollBackToSnapshot = async (index = 0) => {
  const snapshots = await loadRollbackSnapshots();
  const snap = snapshots[index];
  if (!snap) return null;
  const s = snap.state ?? {};
  await Promise.all([
    writeJson(JSON_URLS.game, s.game ?? {}, { pretty: true }),
    writeJson(JSON_URLS.world, s.world ?? {}, { pretty: true }),
    writeJson(JSON_URLS.events, s.events ?? [], { pretty: true }),
    writeJson(JSON_URLS.actions, s.actions ?? [], { pretty: true }),
    writeJson(JSON_URLS.chat, s.chat ?? [], { pretty: true }),
    writeJson(JSON_URLS.colors, s.colors ?? {}, { pretty: true }),
  ]);
  await writeJson(JSON_URLS.snapshots, snapshots.slice(index + 1));
  const bundle = await readGameStateBundle({ force: true });
  return { bundle, round: snap.round, remaining: snapshots.length - (index + 1) };
};

const applySimulationResult = async ({
  baseActions,
  baseChats,
  baseColors,
  baseEvents,
  baseGame,
  baseWorld,
  result,
}) => {
  const generatedEvents = normalizeArray(result.events)
    .map((entry, index) => normalizeGeneratedEvent({
      ...entry,
      source: entry?.source || result.generation?.source || "ai",
    }, index))
    .filter(Boolean);
  // The model is shown the running timeline as context and tends to restate events
  // it already reported; each restatement gets a fresh random id, so only a
  // content-key de-dup catches it. Drop restatements BEFORE they persist, apply
  // impacts, or land in this turn's record (also see the [New Developments Only]
  // directive in buildTemplateVariables).
  const priorEvents = normalizeEvents(baseEvents);
  const freshEvents = dedupeGeneratedEvents(priorEvents, generatedEvents);

  // THE RIBBON, WRITTEN BY THE ENGINE.
  //
  // Ground was broken in some earlier round and the completion date has come
  // round. The model cannot narrate this — it has no idea what is in the ground —
  // so the engine does, and the same rule holds as everywhere else: the map does
  // not change without an event saying so. One event per turn, listing what
  // opened, dated to the day the turn ends.
  const dueDate = normalizeString(result.stopDate) || normalizeString(baseGame.gameDate);
  const { markers: openedMarkers, completed } = completeDueProjects(baseWorld?.markers, dueDate);
  if (completed.length > 0) {
    console.info(
      `[build] ${completed.length} project(s) came due and opened: `
      + completed.map((marker) => `${marker.name} (착공 ${marker.startedAt || "?"})`).join("; "),
    );
    freshEvents.push(normalizeGeneratedEvent({
      date: dueDate,
      description: completed
        .map((marker) => `${marker.name} — ${marker.startedAt || "?"} 착공, 준공.`)
        .join(" "),
      importance: "normal",
      kind: "infrastructure",
      playerRelated: completed.some((marker) => marker.ownerCode === normalizeString(baseGame.country)),
      source: "engine",
      title: completed.length === 1 ? `${completed[0].name} 준공` : `${completed.length}개 사업 준공`,
    }, freshEvents.length));
  }

  const nextEvents = [...priorEvents, ...freshEvents];
  const nextGame = normalizeGameData({
    ...baseGame,
    gameDate: normalizeString(result.stopDate) || baseGame.gameDate,
    round: (baseGame.round || 1) + 1,
  });
  const plannedActionSnapshot = normalizeActions(baseActions).filter((action) => action.status === "planned");
  // Precise action bookkeeping (field report: queued actions kept vanishing).
  // clearActions defaults to true and models habitually leave it there, which
  // used to mark EVERY planned action "resolved" even when no event touched it.
  // Now: actions explicitly referenced by an event's impacts.actionIds resolve;
  // the old resolve-everything behavior only fires as a fallback when the model
  // referenced nothing at all AND actually produced events (an empty or fully
  // deduped jump can't have resolved anything — those actions stay queued).
  const referencedActionIds = new Set(
    freshEvents.flatMap((event) => normalizeArray(event.impacts?.actionIds)).map((id) => String(id)),
  );
  const resolveAllFallback = Boolean(result.clearActions) && referencedActionIds.size === 0 && freshEvents.length > 0;
  // WHEN each order was actually carried out. A turn spans a month and its
  // events are dated across it, but an action only ever recorded "resolved" —
  // so the whole queue read as having happened on one day, which is exactly what
  // skipping the reveal made obvious. The date of the event that resolved it is
  // the honest answer; an order swept up by the resolve-everything fallback gets
  // the turn's end date instead.
  const resolutionDates = new Map();
  for (const event of freshEvents) {
    const date = normalizeString(event?.date);
    if (!date) continue;
    for (const id of normalizeArray(event.impacts?.actionIds)) {
      const key = String(id);
      // Earliest event wins: that is when the order actually took effect.
      if (!resolutionDates.has(key) || date < resolutionDates.get(key)) resolutionDates.set(key, date);
    }
  }
  // HOW each order went. Same shape as the dates above: whichever event says so
  // wins, and an order nobody rated is a clean success — which is what every
  // event written before impacts.actionOutcomes existed means.
  //
  // A FAILURE MUST NOT SILENTLY CLEAR THE ORDER. "failed" and "backfired" mean
  // the thing did not happen, so the order goes back in the queue for the player
  // to reconsider rather than being ticked off as done; "partial" did happen, in
  // reduced form, and is resolved. Without this the outcome would be a label on a
  // completed order — narration and state disagreeing in the usual way.
  const outcomes = new Map();
  // Per-event first, so a turn generated while the field was nested still lands,
  // then the top-level list, which wins because it is the one being asked for.
  for (const event of freshEvents) {
    for (const entry of normalizeArray(event?.impacts?.actionOutcomes)) {
      const key = String(entry?.id ?? "");
      if (key) outcomes.set(key, entry);
    }
  }
  for (const entry of normalizeArray(result.actionOutcomes)) {
    const key = String(entry?.id ?? "");
    if (key) outcomes.set(key, entry);
  }
  const turnEndDate = normalizeString(result.stopDate) || normalizeString(baseGame.gameDate);
  // The orders THIS turn concluded something about. Both the dedicated rating
  // pass below and the difficulty accounting are scoped to exactly this set —
  // a bounced order now keeps its verdict across the save, and rating by
  // "status is planned" would re-count that stale verdict every later turn.
  const touchedActionIds = new Set();
  let nextActions = normalizeActions(baseActions).map((action) => {
    const justResolved = action.status === "planned"
      // The clear-everything fallback never sweeps a stalled order — it is
      // parked awaiting the player. An event that NAMES it explicitly may
      // still resolve it: the world addressed it, which is exactly the new
      // information a stall waits for.
      && (referencedActionIds.has(String(action.id)) || (resolveAllFallback && !isStalledOrder(action)));
    if (!justResolved) return { ...action, status: action.status };
    touchedActionIds.add(String(action.id));
    const verdict = outcomes.get(String(action.id));
    const outcome = normalizeActionOutcome(verdict?.outcome);
    if (outcome === "failed" || outcome === "backfired") {
      return {
        ...action,
        outcome,
        ...(normalizeString(verdict?.note) ? { outcomeNote: normalizeString(verdict.note) } : {}),
        // Counted, so the second failure stalls the order (see isStalledOrder)
        // instead of retrying verbatim forever.
        failCount: (Number(action.failCount) || 0) + 1,
        status: "planned",
      };
    }
    // Success (or partial) closes the book on earlier failures — the counter
    // and its stall go with them.
    const { failCount: _clearedFailCount, ...cleanAction } = action;
    return {
      ...cleanAction,
      outcome,
      ...(normalizeString(verdict?.note) ? { outcomeNote: normalizeString(verdict.note) } : {}),
      resolvedDate: resolutionDates.get(String(action.id)) || turnEndDate,
      resolvedRound: baseGame.round || 1,
      status: "resolved",
    };
  });
  if (referencedActionIds.size > 0) {
    const carried = nextActions.filter((action) => action.status === "planned").length;
    console.info(`[actions] ${referencedActionIds.size} queued action(s) resolved by events; ${carried} kept in the queue.`);
  }
  const nextChats = [...normalizeChats(baseChats)];
  // Chats this turn CREATED, kept apart from the pre-turn snapshot. A turn takes a
  // while to generate and the player can edit the chat list while it runs, so the
  // write at the end merges these onto whatever is actually stored by then rather
  // than putting the stale snapshot back. See the re-read before writeChatsState.
  // (Ported from upstream ae00384 — "Make deleting a chat hide it rather than
  // erase it, and stop turns reviving it".)
  const generatedChats = [];

  const { colors: nextColors, world: worldWithImpacts } = applyEventImpactsToWorld({
    colors: baseColors,
    events: freshEvents,
    world: {
      ...baseWorld,
      // Anything whose completion date arrived is a finished building now, before
      // this turn's own impacts land on top of it.
      markers: openedMarkers,
      activeCatalyst: result.catalyst ?? null,
      actionSuggestions: [],
      lastJumpMode: normalizeString(result.mode),
      lastJumpSummary: normalizeString(result.summary),
      lastJumpTargetDate: nextGame.gameDate,
      // Scheduled entries still owed a story. Only replaced when the turn
      // actually produced a verdict on them (a catalyst or game-master result
      // carries no timeline pass, and must not wipe what a jump left behind).
      ...(Array.isArray(result.timelineBacklog) ? { timelineBacklog: result.timelineBacklog } : {}),
      // Fork rolls the jump made. Merged over the stored map, never replacing
      // it, and only when the turn actually rolled — same guard family as the
      // two timeline fields around it.
      ...(result.timelineBranchRolls && typeof result.timelineBranchRolls === "object"
        ? { timelineBranchRolls: { ...(baseWorld?.timelineBranchRolls ?? {}), ...result.timelineBranchRolls } }
        : {}),
      // The shipped schedule, when this turn seeded or corrected it. Same guard,
      // same reason: a catalyst or game-master result carries neither and must
      // not blank the save's copy.
      ...(Array.isArray(result.periodTimeline) && result.periodTimelineSource
        ? { periodTimeline: result.periodTimeline, periodTimelineSource: result.periodTimelineSource }
        : {}),
      simulationHistory: [
        {
          catalyst: result.catalyst ? cloneValue(result.catalyst) : null,
          date: nextGame.gameDate,
          eventIds: freshEvents.map((event) => event.id),
          fallbackReason: normalizeString(result.generation?.fallbackReason),
          fromDate: baseGame.gameDate,
          mode: normalizeString(result.mode) || "jump",
          plannedActions: plannedActionSnapshot,
          round: nextGame.round,
          summary: normalizeString(result.summary),
          source: result.generation?.source || "ai",
          toDate: nextGame.gameDate,
        },
        ...normalizeWorldState(baseWorld).simulationHistory,
      ].slice(0, 100),
    },
  });
  let nextWorld = worldWithImpacts;

  for (const event of freshEvents) {
    for (const createdChat of event.impacts.createdChats) {
      const nextChat = await buildGeneratedChat(createdChat, event.id, worldWithImpacts, {
        fallbackTitle: event.title,
        playerName: baseGame.country,
      });
      if (nextChat) { nextChats.unshift(nextChat); generatedChats.unshift(nextChat); }
    }
  }

  // Unprompted outreach: polities reaching out on their own initiative during
  // the simulated period, not tied to any event (treaty feelers, summit
  // invitations). Same chat machinery, no linked event.
  for (const chatLike of normalizeArray(result.outreach)) {
    const nextChat = await buildGeneratedChat({ ...chatLike, source: "outreach" }, "", worldWithImpacts, {
      playerName: baseGame.country,
    });
    if (nextChat) { nextChats.unshift(nextChat); generatedChats.unshift(nextChat); }
  }

  if (result.mode === "jump" || result.mode === "auto") {
    try {
      nextWorld = await compactHistoryIfNeeded({
        actions: nextActions,
        chats: nextChats,
        events: nextEvents,
        game: nextGame,
        world: worldWithImpacts,
      });
    } catch (error) {
      console.warn("[ai] campaign history consolidation failed; the completed turn will still be saved.", error);
    }

    // THE VERDICTS THE PAYLOAD DID NOT CARRY.
    //
    // actionOutcomes is an optional list in a payload already carrying events,
    // transfers, markers and chats, and measured across two full turns the model
    // left it empty both times while resolving 31 orders. The remedy that has
    // now worked three times in this codebase (stats, ledger, coverage) is a
    // DEDICATED flat pass: after the turn's events are settled, one small task
    // whose entire output is the verdict list. Orders the payload DID rate keep
    // their rating — this pass only fills the gaps. On failure the turn
    // continues and the unrated stay clean successes, said out loud.
    if (touchedActionIds.size > 0) {
      const unrated = [...touchedActionIds].filter((id) => !outcomes.has(id));
      if (unrated.length > 0) {
        try {
          const byId = new Map(nextActions.map((action) => [String(action.id), action]));
          // Fresh short aliases (R1, R2…): the real ids do not round-trip
          // through a 12B model, and the jump's own alias table lives in a
          // different scope — this pass is self-contained.
          const realOf = new Map();
          const orderLines = unrated.map((id, index) => {
            const alias = `R${index + 1}`;
            realOf.set(alias.toLowerCase(), id);
            const action = byId.get(id);
            const label = normalizeString(action?.title) || normalizeString(action?.text).slice(0, 80);
            const body = normalizeString(action?.text).slice(0, 140);
            return `- [id: ${alias}] ${label}${body && body !== label ? ` — ${body}` : ""}`;
          });
          const owedBefore = Number(baseWorld?.setbackShortfall) || 0;
          const modulationHere = playerSetbackModulation(baseWorld, baseGame);
          const quotaHere = Math.max(0, totalSetbacksOwed(baseGame.difficulty, unrated.length, owedBefore) + modulationHere.delta);
          const ratingVariables = await buildTemplateVariables({
            actions: nextActions,
            chats: nextChats,
            events: nextEvents,
            game: nextGame,
            world: nextWorld,
          }, {
            ratingDirective: difficultyMeta(baseGame.difficulty).directive,
            ratingEvents: freshEvents
              .slice(-14)
              .map((event) => `- ${normalizeString(event.date)} ${normalizeString(event.title)}: ${normalizeString(event.description).slice(0, 220)}`)
              .join("\n"),
            ratingOrders: orderLines.join("\n"),
            ratingQuota: quotaHere > 0
              ? `At least ${quotaHere} of these ${unrated.length} order(s) must come out partial, failed or backfired — pick the LEAST prepared, least funded, least politically cleared ones. Rating everything succeeded is a wrong answer on this difficulty.`
              : `Rate honestly; there is no required number of setbacks.`,
          });
          const { payload } = await runJsonTask("orderOutcomeRating", {
            fallback: () => ({ outcomes: [] }),
            // The rows are rigid — an id from a known list, an outcome from
            // four tokens — so even a reply whose JSON no repair can save
            // still yields its verdicts to a per-row scan. Round 10 live: two
            // JSON-looking replies in a row parsed as nothing, and all 35
            // orders counted as clean successes on Impossible.
            parseFallback: (rawText) => {
              const outcomes = [];
              for (const row of rawText.matchAll(/"id"\s*:\s*"([^"\n]{1,40})"\s*,\s*"outcome"\s*:\s*"(succeeded|partial|failed|backfired)"(?:\s*,\s*"note"\s*:\s*"([^"\n]{0,240})")?/gi)) {
                outcomes.push({ id: row[1], outcome: row[2].toLowerCase(), ...(row[3] ? { note: row[3] } : {}) });
              }
              return outcomes.length > 0 ? { outcomes } : null;
            },
            timeoutMs: getMapSetting(MAP_SETTING_KEYS.limitAiGeneration) ? 60000 : 0,
            userMessage: "Rate how each listed order actually came out, as JSON only.",
            variables: ratingVariables,
          });
          const verdicts = new Map();
          for (const row of normalizeArray(payload?.outcomes)) {
            const real = realOf.get(normalizeString(row?.id).toLowerCase());
            // Only ids from this pass's own list, and never overriding a verdict
            // the payload itself carried.
            if (!real || outcomes.has(real) || verdicts.has(real)) continue;
            verdicts.set(real, {
              outcome: normalizeActionOutcome(row?.outcome),
              note: normalizeString(row?.note).slice(0, 240),
            });
          }
          if (verdicts.size > 0) {
            nextActions = nextActions.map((action) => {
              const verdict = verdicts.get(String(action.id));
              if (!verdict) return action;
              if (verdict.outcome === "failed" || verdict.outcome === "backfired") {
                // Did not happen — back in the queue, without the resolution
                // stamp of a thing that did, and with the failure counted so
                // the second one stalls it.
                const { resolvedDate: _rd, resolvedRound: _rr, ...rest } = action;
                return {
                  ...rest,
                  outcome: verdict.outcome,
                  ...(verdict.note ? { outcomeNote: verdict.note } : {}),
                  failCount: (Number(action.failCount) || 0) + 1,
                  status: "planned",
                };
              }
              return {
                ...action,
                outcome: verdict.outcome,
                ...(verdict.note ? { outcomeNote: verdict.note } : {}),
              };
            });
            console.info(`[difficulty] a dedicated pass rated ${verdicts.size} of ${unrated.length} order(s) the turn's payload left unrated.`);
          } else {
            console.info(`[difficulty] the rating pass returned no verdicts — ${unrated.length} unrated order(s) count as clean successes.`);
          }
        } catch (error) {
          console.warn("[difficulty] the rating pass failed; unrated orders count as clean successes.", error);
        }
      }
      const bounced = nextActions.filter((action) =>
        touchedActionIds.has(String(action.id)) && action.status === "planned"
        && (action.outcome === "failed" || action.outcome === "backfired"));
      if (bounced.length > 0) {
        console.info(
          `[actions] ${bounced.length} order(s) did not come off and go back in the queue: `
          + bounced.map((action) => `${(action.title || action.text || "").slice(0, 24)} (${action.outcome})`).join("; "),
        );
      }
    }

    // DID THE DIFFICULTY ACTUALLY HAPPEN?
    //
    // Measured on the player's OWN orders rather than on how much misfortune the
    // world produced — the difference between a game that is hard and a game that
    // punishes you on a timer. An order that came out partial, failed or
    // backfired is a setback; a share of them is what the difficulty asks for.
    //
    // The shortfall carries into the next turn's prompt rather than being
    // forgotten, so a run of frictionless turns compounds into an explicit debt
    // instead of the setting quietly meaning nothing — which is what 31 rounds on
    // "impossible" did, with the player's reputation rising 53 → 92 and no order
    // ever failing, because there was no way to record that one had.
    {
      const share = setbackShare(baseGame.difficulty);
      if (share > 0) {
        // Scoped to the orders THIS turn touched, not to "has an outcome and is
        // planned" — a bounced order keeps its verdict in the save now, and the
        // old filter would re-rate that stale verdict every turn thereafter.
        const rated = nextActions.filter((action) => action.outcome && touchedActionIds.has(String(action.id)));
        // Tallied directly rather than through countOrderOutcomes, which counts
        // only status:"resolved" — a bounced order is planned again by design,
        // and the first live run printed "15 of 15 less than cleanly (partial
        // 10, failed 0, backfired 0)" while its own bounce line named 4 failed
        // and 1 backfired. The breakdown must count the same set the verdict
        // counts.
        const thisTurn = { succeeded: 0, partial: 0, failed: 0, backfired: 0, resolved: rated.length };
        for (const action of rated) thisTurn[normalizeActionOutcome(action.outcome)] += 1;
        const setbacks = rated.filter((action) => !isCleanSuccess(action.outcome)).length;
        const owed = Number(baseWorld?.setbackShortfall) || 0;
        const modulation = playerSetbackModulation(baseWorld, baseGame);
        const quota = Math.max(0, totalSetbacksOwed(baseGame.difficulty, rated.length, owed) + modulation.delta);
        if (modulation.delta !== 0 && rated.length > 0) {
          console.info(`[difficulty] ${modulation.why} — 기대 좌절 ${modulation.delta > 0 ? `+${modulation.delta}` : modulation.delta}.`);
        }
        const shortfall = capShortfall(baseGame.difficulty, quota - setbacks, rated.length);
        if (rated.length === 0) {
          console.info("[difficulty] this period resolved no orders — nothing to rate.");
        } else if (shortfall > 0) {
          console.warn(
            `[difficulty] ${difficultyMeta(baseGame.difficulty).label}: ${setbacks} of ${rated.length} order(s) came out `
            + `less than cleanly, against ${quota} expected. ${shortfall} carried into the next turn.`,
          );
        } else {
          console.info(
            `[difficulty] ${setbacks} of ${rated.length} order(s) came out less than cleanly `
            + `(${["partial", "failed", "backfired"].map((k) => `${k} ${thisTurn[k]}`).join(", ")}) — as this difficulty asks.`,
          );
        }
        nextWorld = { ...nextWorld, setbackShortfall: shortfall };
      } else if (Number(baseWorld?.setbackShortfall) || 0) {
        // Dropped to a difficulty that asks for none — the debt goes with it.
        nextWorld = { ...nextWorld, setbackShortfall: 0 };
      }
    }

    // What this period did to the numbers. Runs on the world the consolidation
    // just returned, and like the consolidation it must never cost the turn:
    // a failed stat pass leaves the sheets where they were.
    try {
      const statChanges = await recordStatShifts({
        actions: nextActions,
        chats: nextChats,
        events: nextEvents,
        game: nextGame,
        world: nextWorld,
      }, freshEvents);
      if (statChanges) {
        nextWorld = {
          ...nextWorld,
          countryStatChanges: statChanges.entries,
          // Base sheets seeded during the pass. nextWorld still wins for any
          // country it holds a REAL (__asOf-stamped) base for — but a stampless
          // fragment the event path leaked must not clobber the full base just
          // seeded under it.
          ...(Object.keys(statChanges.seeded).length > 0
            ? {
              countryStats: {
                ...statChanges.seeded,
                ...Object.fromEntries(Object.entries(nextWorld.countryStats ?? {}).filter(
                  ([code, sheet]) => !statChanges.seeded[code] || sheet?.__asOf,
                )),
              },
            }
            : {}),
        };
      }
    } catch (error) {
      console.warn("[stats] the national-statistics pass failed; the completed turn will still be saved.", error);
    }

    // WHERE THE WORLD NOW STANDS WITH THE PLAYER (runtime/diplomacy.js).
    //
    // Same discipline as the stat pass: dedicated, flat, absolute values, and
    // never allowed to cost the turn. Runs when the period actually carried a
    // diplomatic signal — a chat opened, a diplomacy event, territory changing
    // hands — or once at the start, to write the first assessment. Candidates
    // are the countries this period genuinely involved plus everyone already on
    // the books, capped, so the model is never asked to rate the whole planet.
    try {
      const playerName = normalizeString(baseGame.country);
      const standing = normalizeWorldState(nextWorld).diplomaticRelations;
      const nameOfCountryLike = (value) => normalizeString(
        typeof value === "string" ? value : value?.name ?? value?.code ?? "");
      const signals = freshEvents.some((event) =>
        normalizeString(event?.kind) === "diplomacy"
        || (event?.impacts?.createdChats?.length ?? 0) > 0
        || (event?.impacts?.regionTransfers?.length ?? 0) > 0);
      const firstAssessment = Object.keys(standing).length === 0;
      if (playerName && freshEvents.length > 0 && (signals || firstAssessment)) {
        const candidates = new Set(Object.keys(standing));
        for (const code of countriesThisPeriodTouched(freshEvents, playerName)) candidates.add(code);
        for (const event of freshEvents) {
          for (const chat of event?.impacts?.createdChats ?? []) {
            for (const country of chat?.countries ?? []) {
              const name = toCountryName(nameOfCountryLike(country));
              if (name && name !== playerName) candidates.add(name);
            }
          }
        }
        const shortlist = [...candidates].filter(Boolean).slice(0, 12);
        if (shortlist.length > 0) {
          const relationVariables = await buildTemplateVariables({
            actions: nextActions,
            chats: nextChats,
            events: nextEvents,
            game: nextGame,
            world: nextWorld,
          }, {
            relationPlayer: playerName,
            relationBaseline: buildRelationsText(standing),
            relationEvents: freshEvents
              .filter((event) => normalizeString(event?.kind) !== "advance")
              .slice(-14)
              .map((event) => `- ${normalizeString(event.date)} ${normalizeString(event.title)}: ${normalizeString(event.description).slice(0, 200)}`)
              .join("\n"),
            relationCandidates: shortlist.join(", "),
          });
          const { payload } = await runJsonTask("diplomaticRelations", {
            fallback: () => ({ relations: [] }),
            timeoutMs: getMapSetting(MAP_SETTING_KEYS.limitAiGeneration) ? 60000 : 0,
            userMessage: "Report the player's diplomatic standings as JSON only.",
            variables: relationVariables,
          });
          // The model answers in the player's language — the first live run
          // reported "사우디아라비아" and "아랍에미리트", both dropped as
          // off-list because the list said "Saudi Arabia". Bridge every
          // candidate through its translated label (and code) back to the
          // listed name, so language never eats a standing.
          const listedNameFor = new Map();
          for (const candidate of shortlist) {
            listedNameFor.set(candidate, candidate);
            listedNameFor.set(normalizeString(translateLabel(candidate)), candidate);
            const canonical = normalizeString(toCountryName(candidate));
            if (canonical) listedNameFor.set(canonical, candidate);
          }
          const reports = normalizeArray(payload?.relations)
            .map((row) => {
              const raw = normalizeString(row?.country);
              const listed = listedNameFor.get(raw) ?? listedNameFor.get(normalizeString(toCountryName(raw)));
              if (!listed) {
                console.info(`[diplomacy] dropped a standing for "${raw}" — not on this period's list.`);
                return null;
              }
              return { ...row, country: listed };
            })
            .filter(Boolean);
          const folded = applyRelationReports(standing, reports, {
            date: normalizeString(nextGame.gameDate),
            playerName,
            resolveName: toCountryName,
          });
          if (folded.moved.length > 0) {
            console.info(
              `[diplomacy] ${folded.moved.length} standing(s) moved: `
              + folded.moved.map((move) => `${move.country} ${move.from ?? "(unrecorded)"} → ${move.to}`).join("; "),
            );
          } else if (firstAssessment && Object.keys(folded.entries).length > 0) {
            console.info(`[diplomacy] first assessment recorded: ${Object.keys(folded.entries).length} standing(s).`);
          }
          if (folded.dropped.length > 0) {
            console.warn(`[diplomacy] dropped ${folded.dropped.length} reported standing(s): `
              + folded.dropped.map((drop) => `${drop.country} — ${drop.why}`).join("; "));
          }
          nextWorld = { ...nextWorld, diplomaticRelations: folded.entries };
        }
      }
    } catch (error) {
      console.warn("[diplomacy] the relations pass failed; standings stay where they were.", error);
    }

    // WHO SPEAKS FIRST (the player's report, round 42: "요즘 들어서 AI들이 선
    // 채팅을 안치는거 같네"). The jump's own diplomaticOutreach is an optional
    // top-level list in a payload already carrying everything else, and after
    // 42 rounds the campaign held four chats, ONE of them AI-initiated — the
    // same 12B pattern as actionOutcomes and the stat sheet, and the same
    // remedy: a dedicated flat pass. Runs only when the jump itself opened no
    // chat (its own outreach, when it ever arrives, takes precedence), asks
    // "who approaches, and why", and builds the chats through the exact same
    // machinery. Never allowed to cost the turn, and its silence is spoken:
    // a period where nobody reaches out says so in the console.
    try {
      const playerName = normalizeString(baseGame.country);
      if (playerName && freshEvents.length > 0) {
        if (generatedChats.length > 0) {
          console.info(`[diplomacy] the turn already opened ${generatedChats.length} chat(s) — no extra outreach pass.`);
        } else {
          const standing = normalizeWorldState(nextWorld).diplomaticRelations;
          // Countries whose open thread already ends with THEIR message are
          // waiting on the player — they do not approach again on top of it.
          const waiting = new Set();
          for (const chatEntry of nextChats) {
            if (normalizeString(chatEntry?.status) === "closed") continue;
            const lastSpeaker = normalizeString(chatEntry?.messages?.at?.(-1)?.speaker);
            if (!lastSpeaker || lastSpeaker === playerName) continue;
            for (const country of chatEntry?.countries ?? []) {
              const name = toCountryName(normalizeString(country?.name ?? country));
              if (name && name !== playerName) waiting.add(name);
            }
          }
          const candidates = new Set(Object.keys(standing));
          for (const code of countriesThisPeriodTouched(freshEvents, playerName)) candidates.add(code);
          const shortlist = [...candidates].filter((name) => name && !waiting.has(name)).slice(0, 12);
          if (shortlist.length === 0) {
            console.info("[diplomacy] nobody could reach out this period — no counterpart in play or all already waiting on the player.");
          } else {
            const outreachVariables = await buildTemplateVariables({
              actions: nextActions,
              chats: nextChats,
              events: nextEvents,
              game: nextGame,
              world: nextWorld,
            }, {
              outreachPlayer: playerName,
              outreachRelations: buildRelationsText(standing),
              outreachEvents: freshEvents
                .filter((event) => normalizeString(event?.kind) !== "advance")
                .slice(-14)
                .map((event) => `- ${normalizeString(event.date)} ${normalizeString(event.title)}: ${normalizeString(event.description).slice(0, 200)}`)
                .join("\n"),
              outreachCandidates: shortlist.join(", "),
              outreachWaiting: [...waiting].join(", "),
            });
            const { payload } = await runJsonTask("diplomaticOutreachPass", {
              fallback: () => ({ outreach: [] }),
              timeoutMs: getMapSetting(MAP_SETTING_KEYS.limitAiGeneration) ? 60000 : 0,
              userMessage: "Decide who approaches the player this period, as JSON only.",
              variables: outreachVariables,
            });
            // The same language bridge as the relations pass: a Korean answer
            // ("사우디아라비아") must land on the listed name.
            const listedNameFor = new Map();
            for (const candidate of shortlist) {
              listedNameFor.set(candidate, candidate);
              listedNameFor.set(normalizeString(translateLabel(candidate)), candidate);
              const canonical = normalizeString(toCountryName(candidate));
              if (canonical) listedNameFor.set(canonical, candidate);
            }
            const approaches = [];
            const seenCountries = new Set();
            for (const row of normalizeArray(payload?.outreach)) {
              const raw = normalizeString(row?.country);
              const listed = listedNameFor.get(raw) ?? listedNameFor.get(normalizeString(toCountryName(raw)));
              const message = normalizeString(row?.message);
              if (!listed || !message) {
                if (raw) console.info(`[diplomacy] dropped an approach from "${raw}" — ${listed ? "no message" : "not on this period's list"}.`);
                continue;
              }
              if (seenCountries.has(listed) || approaches.length >= 2) continue;
              seenCountries.add(listed);
              approaches.push({ ...row, country: listed });
            }
            if (approaches.length === 0) {
              console.info("[diplomacy] nobody reached out this period — the model saw no reason for an approach.");
            }
            for (const approach of approaches) {
              const built = await buildGeneratedChat({
                countries: [approach.country],
                openingMessage: approach.message,
                source: "outreach",
                speaker: approach.country,
                title: normalizeString(approach.title) || approach.country,
              }, "", nextWorld, { playerName });
              if (!built) continue;
              nextChats.unshift(built);
              generatedChats.unshift(built);
              console.info(
                `[diplomacy] ${approach.country} reached out first: "${normalizeString(approach.title)}"`
                + `${normalizeString(approach.reason) ? ` — ${normalizeString(approach.reason)}` : ""}`,
              );
            }
          }
        }
      }
    } catch (error) {
      console.warn("[diplomacy] the outreach pass failed; nobody reaches out this period.", error);
    }

    // ── SECRET REPORTS (Pax parity: the Reports feature) ─────────────────────
    // After the period, the player's intelligence services deliver what the
    // newspapers do not know. Same architecture as every dedicated pass: flat
    // schema, whole prompt at call time, never allowed to cost the turn. The
    // 12B-hallucination containment is structural, not rhetorical: the pass
    // writes world.secretReports and NOTHING else — no impacts channel exists,
    // so a report can only reveal, never enact (밝히되 집행하지 않는다).
    try {
      const playerName = normalizeString(baseGame.country);
      if (playerName && freshEvents.length > 0) {
        // Difficulty turns the INTEL-QUALITY dial, not an on/off switch — the
        // revealsCharacterProfile precedent: easy campaigns get confident,
        // specific intelligence; hard ones get sparse, hedged fragments.
        const difficultyId = normalizeString(nextGame?.difficulty ?? baseGame?.difficulty) || "medium";
        const reportsQualityDirective = /easy/.test(difficultyId)
          ? "Your services are excellent. Reports are specific and confident — names, numbers, dates. Two reports on an eventful period is normal."
          : /hard|impossible/.test(difficultyId)
            ? "Your services are stretched thin. Reports are RARE (zero is common), fragmentary and hedged — sources disagree, numbers are estimates, and a report should carry an honest caveat where its source is weak."
            : "Your services are competent. One report is the normal yield, and its confidence is stated plainly — what is known, what is inferred.";
        const reportVariables = await buildTemplateVariables({
          actions: nextActions,
          chats: nextChats,
          events: nextEvents,
          game: nextGame,
          world: nextWorld,
        }, {
          reportsPlayer: playerName,
          reportsQualityDirective,
          reportsRelations: buildRelationsText(normalizeWorldState(nextWorld).diplomaticRelations),
          reportsEvents: freshEvents
            .filter((event) => normalizeString(event?.kind) !== "advance")
            .slice(-14)
            .map((event) => `- ${normalizeString(event.date)} ${normalizeString(event.title)}: ${normalizeString(event.description).slice(0, 200)}`)
            .join("\n"),
        });
        const { payload } = await runJsonTask("secretReportsPass", {
          fallback: () => ({ reports: [] }),
          // Bare-array salvage: a 12B answering `[{...}]` instead of
          // `{"reports":[...]}` is a shape mistake, not an empty period.
          repairPayload: (raw) => (Array.isArray(raw) ? { reports: raw } : raw),
          timeoutMs: getMapSetting(MAP_SETTING_KEYS.limitAiGeneration) ? 60000 : 0,
          userMessage: "Deliver this period's secret reports, as JSON only.",
          variables: reportVariables,
        });
        const REPORT_KINDS = new Set(["military", "political", "economic", "intelligence", "foreign"]);
        const currentRound = Number(normalizeWorldState(nextWorld).simulationHistory.at(-1)?.round) || 0;
        const accepted = [];
        for (const row of normalizeArray(payload?.reports)) {
          const title = normalizeString(row?.title);
          const body = normalizeString(row?.body);
          if (!title || !body) {
            if (title || body) console.info("[reports] dropped a report missing its title or body.");
            continue;
          }
          if (accepted.length >= 2) {
            console.info(`[reports] dropped "${title.slice(0, 48)}" — two reports per period is the ceiling.`);
            continue;
          }
          const kindRaw = normalizeString(row?.kind).toLowerCase();
          accepted.push({
            id: `report-${Date.now().toString(36)}-${currentRound}-${accepted.length}`,
            kind: REPORT_KINDS.has(kindRaw) ? kindRaw : "intelligence",
            title,
            body,
            source: normalizeString(row?.source),
            date: normalizeString(nextGame?.gameDate) || normalizeString(baseGame?.gameDate),
            round: currentRound,
          });
        }
        if (accepted.length === 0) {
          console.info("[reports] no secret reports this period — the services came back empty-handed.");
        } else {
          nextWorld = {
            ...nextWorld,
            secretReports: [...normalizeArray(nextWorld.secretReports), ...accepted],
          };
          for (const report of accepted) {
            console.info(`[reports] 🕵️ ${report.kind}: "${report.title}"`);
          }
        }
      }
    } catch (error) {
      console.warn("[reports] the intelligence pass failed; no reports this period.", error);
    }
  }

  // Re-read the chat list instead of writing the pre-turn snapshot back over it.
  // Turns take a while, and anything the player did to the list while one ran —
  // deleting a thread, archiving one — exists only in storage. Writing baseChats
  // on top resurrected deleted chats, and the AI's next message then landed in the
  // revived thread instead of opening a fresh one. Falls back to the snapshot if
  // the read fails, which is the old behaviour and never loses a generated chat.
  let chatsToWrite;
  try {
    chatsToWrite = [...generatedChats, ...normalizeChats(await readChatsState({ force: true }))];
  } catch {
    chatsToWrite = nextChats;
  }

  // The action queue needs the SAME treatment, for the same reason and with more
  // at stake. nextActions is derived from a snapshot taken before a generation
  // that routinely runs for minutes, and nothing anywhere locks the queue while
  // it does: the Actions panel writes straight through, and so does every map
  // order (unitsController.queueOrder). An order the player added, edited or
  // deleted mid-turn lives only in storage, and writing the pre-turn snapshot
  // back over it deleted that order outright — never resolved, never queued, not
  // even logged. That is precisely the silent drop this engine exists to prevent,
  // arriving through the back door.
  //
  // So: re-read, and apply this turn's RESOLUTIONS to what is actually stored
  // rather than replacing it. Orders the turn knew about get their resolved
  // status; orders that appeared while it ran are left exactly as they are and
  // ride into the next turn. Falls back to the snapshot if the read fails, which
  // is the old behaviour.
  let actionsToWrite = nextActions;
  try {
    const storedNow = normalizeActions(await readActionsState({ force: true }));
    // Everything the turn concluded about an order rides home: the resolution
    // AND the verdict. This merge used to copy only status + resolvedDate +
    // resolvedRound, so outcome/outcomeNote — computed minutes earlier and
    // already counted by the difficulty accounting — were dropped at the very
    // last step. Live: 553 saved actions, 0 with an outcome, while the console
    // said "0 of 13 came out less than cleanly, against 13 expected". A bounced
    // order (failed/backfired, back in the queue) keeps its verdict too — the
    // label is WHY it is back.
    const concludedById = new Map(
      nextActions
        .filter((action) => action.status === "resolved" || action.outcome)
        .map((action) => [String(action.id), action]),
    );
    let addedMidTurn = 0;
    actionsToWrite = storedNow.map((action) => {
      const concluded = concludedById.get(String(action.id));
      // Only ever move planned -> resolved. If the player deleted and rebuilt an
      // order mid-turn it is a different, still-planned order, and re-resolving
      // it here would clear work nobody did.
      if (!concluded || action.status !== "planned") return action;
      const verdict = {
        ...(concluded.outcome ? { outcome: concluded.outcome } : {}),
        ...(concluded.outcomeNote ? { outcomeNote: concluded.outcomeNote } : {}),
        ...(Number(concluded.failCount) >= 1 ? { failCount: concluded.failCount } : {}),
      };
      if (concluded.status !== "resolved") return { ...action, ...verdict };
      // Resolved: the failure history closed with it — a stale counter on the
      // stored copy must not survive the success.
      const { failCount: _storedFailCount, ...storedClean } = action;
      return { ...storedClean, ...verdict, resolvedDate: concluded.resolvedDate, resolvedRound: concluded.resolvedRound, status: "resolved" };
    });
    const knownIds = new Set(nextActions.map((action) => String(action.id)));
    addedMidTurn = storedNow.filter((action) => !knownIds.has(String(action.id))).length;
    if (addedMidTurn > 0) {
      console.info(`[actions] ${addedMidTurn} order(s) were added while this turn generated — kept and carried into the next turn.`);
    }
  } catch (error) {
    console.warn("[actions] could not re-read the queue before writing; using the pre-turn snapshot.", error);
    actionsToWrite = nextActions;
  }

  // SNAPSHOT FIRST, WRITES SECOND. The restore point used to be captured after
  // the writes — so a crash anywhere in the turn left the round being replaced
  // with NO restore point at all ("턴 돌리다가 크래시가 났는데 바로 전턴으로
  // 돌아갈 방법이 없어", round 6 live). Captured here, before the first write,
  // the crash window closes: die during generation and the stores are
  // untouched; die during the writes and the pre-turn state is already on
  // disk to roll back to.
  await captureRollbackSnapshot({
    round: baseGame.round || 1,
    fromDate: baseGame.gameDate || baseGame.startDate || "",
    toDate: nextGame.gameDate || "",
    game: baseGame,
    world: baseWorld,
    events: baseEvents,
    actions: baseActions,
    chat: baseChats,
    colors: baseColors,
  });

  // Events BEFORE actions: these are six independent writes with no transaction,
  // and if one of them is going to fail it must not be the one that leaves orders
  // marked resolved by events that were never persisted. In the other order the
  // worst case is an order that stays queued and gets played out again — visible,
  // and recoverable by the player.
  await writeEventsState(nextEvents);
  await Promise.all([
    writeActionsState(actionsToWrite),
    writeChatsState(chatsToWrite),
    writeGameData(nextGame),
    writeJson(JSON_URLS.colors, nextColors, { pretty: true }),
    writeWorldState(nextWorld),
  ]);

  // The turn's new state is now persisted. Web-mode encrypted sync listens for this
  // to back up the turn (replacing a fixed 20s poll); it is a no-op in desktop mode
  // where nothing listens. Firing here — the single choke point every turn type runs
  // through (jump, auto-jump, catalyst, game-master) — means the sync's full scan
  // sees the committed round.
  if (typeof window !== "undefined") window.dispatchEvent(new Event("oh:turn-complete"));

  return {
    actions: nextActions,
    chats: chatsToWrite, // what was actually persisted, not the pre-turn snapshot
    colors: nextColors,
    events: nextEvents,
    game: nextGame,
    generation: result.generation ?? { source: "ai", fallbackReason: "" },
    world: nextWorld,
  };
};

// The player's conversation with their advisor, as guidance for the brainstorm.
//
// These were two disconnected features: the player would spend a conversation
// working out what to do, press Brainstorm, and get suggestions written as though
// that conversation had never happened — because it hadn't, as far as the prompt
// was concerned. readGameStateBundle loads five stores and the advisor transcript
// is not one of them, and the actions template has no placeholder for it either.
// Read it here, at the one call site that wants it, rather than widening the
// bundle for every task that does not.
const buildAdvisorGuidanceText = async () => {
  try {
    const messages = normalizeArray(await readJson(JSON_URLS.advisor, { defaultValue: [], force: true }));
    // The tail is what matters — the advice they acted on last, not the opening
    // pleasantries of a campaign-long conversation.
    const recent = messages.filter((message) => message?.role === "user" || message?.role === "advisor").slice(-12);
    if (recent.length === 0) return "";
    const lines = recent.map((message) => {
      const who = message.role === "user" ? "Player" : "Advisor";
      return `${who}: ${normalizeString(message.text).slice(0, 600)}`;
    });
    return [
      "",
      "[Advisor Guidance]",
      "The player has been working this period through with their advisor. This is that conversation, most recent last:",
      ...lines,
      "Let it steer the board you hand back: where the player has settled on a direction, put concrete ways to pursue it among the suggestions, and where the advisor named a risk, offer something that answers it. Do NOT merely restate the advice as an action — the player wants options they had not thought of, grounded in what they have decided.",
    ].join("\n");
  } catch {
    return "";
  }
};

export const generateActionSuggestions = async ({ force = true } = {}) => {
  const bundle = await readGameStateBundle({ force });
  const variables = await buildTemplateVariables(bundle);
  const advisorGuidance = await buildAdvisorGuidanceText();
  // Entries already on the public calendar within planning range of today. The
  // outcome stays hidden even for these — a scheduled vote is public, how it goes
  // is not (see foreseeableOutlook).
  const outlookEntries = foreseeableOutlook(
    bundle.world?.periodTimeline,
    normalizeString(bundle.game?.gameDate) || normalizeString(bundle.game?.startDate),
  );
  if (outlookEntries.length > 0) {
    console.info(`[timeline] ${outlookEntries.length} publicly-scheduled item(s) offered to the suggestion board.`);
  }

  // THE NAMES THE [Depth] CONTRACT ASKS FOR HAVE TO BE IN THE ROOM. Telling a
  // 12B to name the officials it acts through, without showing it who they are,
  // is the exact circumstance that produced "총리 스탠리 메이너드 맥도널드" on
  // the stat sheets. Same record, same alias chain, same rule: the reference
  // answers or nobody does — a board that cannot name the NKVD chief writes
  // around him instead of inventing one.
  const boardDate = normalizeString(bundle.game?.gameDate) || normalizeString(bundle.game?.startDate);
  let officeholderText = "";
  try {
    await ensureReferenceEra(boardDate);
    const playerName = normalizeString(bundle.game?.country);
    const standing = normalizeWorldState(bundle.world).diplomaticRelations ?? {};
    const wanted = [playerName, ...Object.keys(standing)].filter(Boolean).slice(0, 10);
    const lines = [];
    const overrides = normalizeWorldState(bundle.world).polityOverrides ?? {};
    for (const country of new Set(wanted)) {
      const record = Object.values(overrides).find((entry) => entry?.name === country) ?? overrides[country] ?? null;
      const who = resolveLeadership(country, boardDate, {
        aliases: record?.aliases ?? [],
        seed: record?.leadership ?? null,
      });
      if (!who) continue;
      const parts = [who.leader, who.headOfState, who.deputy]
        .map((value) => normalizeString(value))
        .filter((value) => value && !isRoleSentinel(value));
      if (parts.length === 0) continue;
      const figures = resolvePoliticalFigures(country, boardDate, { aliases: record?.aliases ?? [] });
      const contenders = normalizeArray(figures).map((figure) => normalizeString(figure?.name ?? figure)).filter(Boolean).slice(0, 4);
      lines.push(`- ${country}: ${parts.join(" · ")}${contenders.length ? ` (그 밖의 주요 인물: ${contenders.join(", ")})` : ""}`);
    }
    if (lines.length > 0) {
      officeholderText = `[Who actually holds office on ${boardDate}]\nUse these names when an action acts through, against or alongside a person. They are the record for this date — do NOT invent an officeholder, and do not promote one of the other figures into an office they do not hold.\n${lines.join("\n")}`;
      console.info(`[actions] officeholder record offered to the board for ${lines.length} countr(ies).`);
    }
  } catch (error) {
    console.warn("[actions] could not attach the officeholder record; the board writes without names.", error);
  }
  // THE DEPTH CONTRACT IS MEASURED, NOT PLEADED FOR (the 12B pattern). A
  // prompt asking for 3-6 named sentences gets them from a big model and gets
  // 71 characters of era-less policy prose from a 12B on a bad draw. So: count
  // what actually came back, ask once more when most of the board is thin, and
  // — because one failure must not cost the whole board — accept the second
  // answer either way while saying plainly in the console what was accepted.
  const SHORT_ACTION_CHARS = 140;
  const measureDepth = (candidate) => {
    const list = normalizeArray(Array.isArray(candidate) ? candidate : candidate?.topics ?? candidate?.suggestions);
    const lengths = list.flatMap((topic) => normalizeArray(topic?.actions).map((action) => normalizeString(action?.text).length));
    if (lengths.length === 0) return { total: 0, thin: 0, median: 0 };
    const sorted = [...lengths].sort((a, b) => a - b);
    return {
      total: lengths.length,
      thin: lengths.filter((n) => n < SHORT_ACTION_CHARS).length,
      median: sorted[Math.floor(sorted.length / 2)],
    };
  };
  const { payload } = await runJsonTask("actions", {
    fallback: () => fallbackActionSuggestions(bundle),
    userMessage: `Generate current strategic action suggestions as JSON only.${advisorGuidance}`,
    validatePayload: (candidate, { finalAttempt } = {}) => {
      const depth = measureDepth(candidate);
      if (depth.total === 0) return undefined; // emptiness is handled below, not here
      const thinShare = depth.thin / depth.total;
      if (thinShare > 0.5 && !finalAttempt) {
        return `${depth.thin} of ${depth.total} actions are under ${SHORT_ACTION_CHARS} characters (median ${depth.median}).`
          + " Rewrite EVERY action's \"text\" to the [Depth] contract: 3-6 sentences naming the executing ministry or agency,"
          + " the officials and places involved, the sequence, and what it trades away. Keep the same topics and the same"
          + " strategies — only the writing gets deeper.";
      }
      if (thinShare > 0.5) {
        console.warn(
          `[actions] the board came back thin — ${depth.thin} of ${depth.total} actions under ${SHORT_ACTION_CHARS} chars `
          + `(median ${depth.median}). Accepted anyway: a thin board beats no board.`,
        );
      } else {
        console.info(`[actions] depth: median ${depth.median} chars, ${depth.thin} of ${depth.total} action(s) under ${SHORT_ACTION_CHARS}.`);
      }
      return undefined;
    },
    variables: {
      ...variables,
      ...(outlookEntries.length > 0
        ? { foreseeableOutlookText: buildOutlookText(outlookEntries, { playerPolity: variables.playerPolity }) }
        : {}),
      ...(officeholderText ? { officeholderRecordText: officeholderText } : {}),
    },
  });

  const normalizeTopics = (raw) =>
    normalizeArray(raw)
      .map((topic, topicIndex) => {
        if (!topic || typeof topic !== "object") {
          return null;
        }

        const title = normalizeString(topic.title || topic.name);
        if (!title) {
          return null;
        }

        return {
          actions: normalizeArray(topic.actions)
            .map((action, actionIndex) =>
              normalizeActionEntry(
                {
                  ...action,
                  source: "suggested",
                  suggestionTopic: title,
                },
                actionIndex,
              ),
            )
            .filter(Boolean),
          description: normalizeString(topic.description),
          id: normalizeString(topic.id) || `topic-${topicIndex}`,
          title,
        };
      })
      .filter(Boolean);

  // Models told "JSON only" mislabel or wrap the list — accept the common
  // shapes (top-level array, topics, suggestions) before giving up.
  let topics = normalizeTopics(
    Array.isArray(payload) ? payload : payload?.topics ?? payload?.suggestions,
  );

  // A parseable-but-EMPTY answer used to be accepted as "no suggestions were
  // generated" — the deterministic fallback (which always has topics) now
  // covers it, same as empty timeline turns.
  if (topics.length === 0) {
    console.warn("[ai] action suggestions came back empty — using the deterministic fallback.");
    topics = normalizeTopics((await fallbackActionSuggestions(bundle))?.topics);
  }

  // Repeat filter. The [Orders Already Given] directive stops most of it, but a
  // 14B model still re-offers an initiative it has already been told about, and
  // it also duplicates WITHIN one answer — the same "재생에너지 확대" arrived
  // twice in one batch under two different topics. Drop a suggestion whose title
  // repeats one the player already ordered, or one already offered earlier in
  // this same batch. Matching is containment-based so "범죄 예방 강화" and
  // "범죄 예방 강화 조치" count as the same thing.
  {
    const squash = (value) => normalizeString(value).toLowerCase().replace(/\s+/g, "").replace(/[.,!?"'()[\]·—–-]/g, "");
    // A TROUBLED order's title only blocks an EXACT resubmission. The rescue
    // directive asks for reworks that NAME the failed programme, and the
    // containment rule below would have eaten every one of them ("대안 경로
    // 확보 전면 재설계" contains "대안 경로 확보") — the validator quietly
    // fighting the prompt, which is half of why the player saw no rescues.
    const troubled = new Set();
    const seen = [];
    for (const action of normalizeActions(bundle.actions)) {
      const title = squash(action.title);
      if (title.length < 4) continue;
      const inTrouble = action.status === "planned"
        && ((Number(action.failCount) || 0) >= 1 || ["failed", "backfired"].includes(action.outcome));
      if (inTrouble) troubled.add(title);
      else seen.push(title);
    }
    // Containment only counts once the shorter title is long enough to be a
    // real subject: a 4-character Korean fragment like "경제협력" appears inside
    // half the plausible titles in the game, so below that only an exact repeat
    // is a repeat.
    const isRepeat = (title) => {
      const candidate = squash(title);
      if (candidate.length < 4) return false;
      if (troubled.has(candidate)) return true;
      return seen.some((prior) => prior === candidate
        || (Math.min(prior.length, candidate.length) >= 6 && (prior.includes(candidate) || candidate.includes(prior))));
    };
    let dropped = 0;
    const filtered = topics
      .map((topic) => {
        const actions = normalizeArray(topic.actions).filter((action) => {
          if (!isRepeat(action?.title)) {
            const key = squash(action?.title);
            if (key.length >= 4) seen.push(key);
            return true;
          }
          dropped += 1;
          return false;
        });
        return { ...topic, actions };
      })
      .filter((topic) => topic.actions.length > 0);
    // Never hand back an empty board: if the filter would leave the player with
    // nothing to pick, keep the unfiltered set rather than an empty brainstorm.
    if (filtered.length > 0) {
      topics = filtered;
      if (dropped > 0) console.info(`[ai] dropped ${dropped} suggested action(s) that repeated something already ordered.`);
    } else if (dropped > 0) {
      console.warn(`[ai] every suggestion repeated an existing order (${dropped}) — keeping them rather than showing an empty brainstorm.`);
    }
  }

  // The board is the other place the player reads model prose, and it leaked the
  // same English names the events did — "Busan", "Gyeonggi-do", "P'yŏng양".
  {
    const dictionary = await loadNameDictionary(JSON_URLS.world);
    if (dictionary.length > 0) {
      const seen = [];
      topics = topics.map((topic) => ({
        ...topic,
        actions: normalizeArray(topic.actions).map((action) => {
          seen.push(action?.title, action?.text);
          return {
            ...action,
            text: localizeNames(action?.text, dictionary),
            title: localizeNames(action?.title, dictionary),
          };
        }),
        title: localizeNames(topic?.title, dictionary),
      }));
      queueUnknownNames(seen, dictionary);
    }
  }

  const world = normalizeWorldState(await readWorldState());
  world.actionSuggestions = topics;
  await writeWorldState(world);

  return topics;
};

// Campaign chronicle ("배경 이야기"): the advisor's Background Story tab, matching
// Pax Historia's. Reads the round summaries, event history and the player's own
// actions, asks the model for a flowing narrative (callAI's language directive
// localizes it), and caches the result on the world state so reopening the tab
// is instant until the player regenerates it.
export const generateBackstory = async () => {
  const bundle = await readGameStateBundle({ force: true });
  const world = normalizeWorldState(bundle.world);
  // THE STORY IS CHAPTERED NOW, the way the original folds its history.
  //
  // This narrative used to re-tell the last 30 rounds from scratch every time —
  // so the round summaries it read kept stacking, the story grew as the
  // campaign did, and the consolidations (which already ARE the campaign's
  // earlier chapters, compressed once and kept) played no part in it. The
  // consolidated chapters are settled prose: the pane shows each one as its own
  // block, and this call writes only the CURRENT chapter — the rounds since the
  // last consolidation — continuing after them.
  const chapters = normalizeArray(world.consolidatedHistory);
  const boundaryRound = Number(chapters.at(-1)?.throughRound) || 0;
  const currentRounds = normalizeArray(world.simulationHistory)
    .filter((entry) => (Number(entry?.round) || 0) > boundaryRound)
    // Even unconsolidated stretches stay inside a local model's context.
    .slice(0, 30)
    .reverse()
    .map((entry) => {
      const dates = entry.fromDate || entry.toDate ? ` (${entry.fromDate || "?"} → ${entry.toDate || "?"})` : "";
      return `Round ${entry.round ?? "?"}${dates}: ${normalizeString(entry.summary)}`;
    })
    .filter((line) => !line.endsWith(": "))
    .join("\n");
  const priorTail = normalizeString(chapters.at(-1)?.summary).slice(-500);
  const player = normalizeString(bundle.game.country) || "the player's polity";
  const systemPrompt = [
    `You are the campaign chronicler for a grand-strategy game. The campaign's earlier chapters are already written and consolidated. Write ONLY the CURRENT CHAPTER — what has happened since — from the perspective of ${player}, as an engaging but factual historical narrative.`,
    "Rules:",
    "- Chronological, 2 to 5 markdown paragraphs; a short bold heading when a phase shift deserves one.",
    "- Weave the player's actions and their consequences into the story; never output raw lists of events.",
    "- Only use what actually happened in the material below; never invent events.",
    "- Do NOT retell anything from [How The Last Chapter Ended] — it is context for continuity, not material.",
    "- End with the current situation and the open threads the player now faces.",
    "",
    priorTail ? `[How The Last Chapter Ended]\n…${priorTail}\n` : "",
    "[Rounds Of The Current Chapter]",
    currentRounds || "(no completed rounds in this chapter yet — describe the situation as it stands instead)",
    "",
    "[Event History]",
    buildEventHistoryText(bundle.events, { limit: 40, world }),
    "",
    "[Player Action History]",
    buildActionHistoryText(bundle.actions),
  ].filter(Boolean).join("\n");

  const response = await callAI(systemPrompt, [
    { role: "user", parts: [{ text: "Write the background story now." }] },
  ], { role: "advisor" });
  const text = normalizeString(typeof response === "string" ? response : response?.rawText);
  if (!text) {
    throw new Error("The model returned an empty backstory.");
  }

  const latest = normalizeWorldState(await readWorldState());
  latest.backstory = {
    generatedAt: normalizeString(bundle.game.gameDate),
    round: bundle.game.round || 1,
    // Which rounds this chapter narrates — the pane shows chapters before it,
    // and a NEW consolidation moving the boundary is what makes this stale.
    fromRound: boundaryRound + 1,
    text,
  };
  await writeWorldState(latest);
  return text;
};

// How many rounds may pass before the Background Story is rewritten on its own.
const BACKSTORY_AUTO_INTERVAL_ROUNDS = 5;

// The chips above the advisor's input box.
//
// They were five fixed English sentences — the same five in round 1 and round 60,
// regardless of whether the player was at war, isolated, or quietly building
// semiconductors — and being English they went through the UI translator, which is
// exactly the round trip that was corrupting text and competing for the GPU. These
// are written by the model instead, in the player's language, from what is actually
// happening, and cached for the round so the cost is one small call per turn rather
// than one per panel open.
const FALLBACK_ADVISOR_TOPICS = [
  "Assess our current strategic position",
  "What are the biggest threats to us right now?",
  "Suggest three concrete actions for this period",
  "How can we strengthen our economy?",
  "Which nations should we approach diplomatically?",
];

export const generateAdvisorTopics = async ({ force = false } = {}) => {
  const [world, game] = await Promise.all([readWorldState({ force: true }), readGameData({ force: true })]);
  const normalized = normalizeWorldState(world);
  const round = Number(game?.round) || 1;
  const cached = normalized.advisorTopics;
  if (!force && Number(cached?.round) === round && normalizeArray(cached?.questions).length > 0) {
    return normalizeArray(cached.questions).map((entry) => normalizeString(entry)).filter(Boolean);
  }

  try {
    const bundle = await readGameStateBundle({ force: true });
    const variables = await buildTemplateVariables(bundle);
    const langName = languageDisplayName(getStoredLanguage());
    const systemPrompt = [
      `You are the intelligence advisor in an alternate-history strategy game. The player leads ${variables.playerPolity || "their country"} and the date is ${variables.date || "unknown"}.`,
      `Write SIX questions the player might realistically want to ask you RIGHT NOW, given the situation below.`,
      `Rules:`,
      `- Answer with ONLY a JSON array of six strings. No keys, no commentary, no markdown.`,
      `- Each is a question the PLAYER asks YOU, in their voice, at most about 12 words.`,
      `- Ground them in the actual situation: name the specific rival, front, region, treaty or programme that is live this period rather than asking in the abstract.`,
      `- Cover six DIFFERENT concerns — pick from: the military balance and any active front, the economy and industry, diplomacy and who to approach or avoid, internal stability and politics, intelligence on a specific rival, and the longer game beyond this period. Never two questions about the same thing.`,
      // The advisor watches the queue too ("어드바이저도 행동을 수시 관찰
      // 시켜서 교착되는 부분이 있으면" — the player's own request): a stalled
      // order is the most concrete thing worth asking about this period.
      `- If [Orders in trouble] lists anything, exactly ONE of the six questions must ask how to rescue, rework or replace one of those named orders.`,
      `- Write them in ${langName}.`,
      "",
      "[Situation]",
      normalizeString(variables.worldSummaryNoCity).slice(0, 4000),
      "",
      "[Recent events]",
      normalizeString(variables.recentEvents).slice(0, 2500),
      "",
      "[The player's standing orders]",
      // Tail, not head: the roster is newest-LAST, and a head slice kept the
      // oldest orders while cutting exactly the recent ones a question should
      // be about (the stalled and failed entries among them).
      normalizeString(variables.existingOrders).slice(-1200) || "None.",
      "",
      "[Orders in trouble]",
      normalizeString(variables.strugglingOrders).slice(0, 1200) || "None — nothing has failed or stalled.",
      // The backlog half of the round-8 construction policy: when the queue is
      // a year or more deep, the advisor board itself should raise it.
      ...(() => {
        try {
          const playerName = toCountryName(normalizeString(bundle.game?.country));
          const world = normalizeWorldState(bundle.world);
          const capacity = constructionCapacity(mergeStatSheet(
            world.countryStats?.[playerName], world.countryStatChanges?.[playerName]));
          const today = normalizeString(bundle.game?.gameDate);
          const nextFree = nextSlotDate(world.markers, playerName, today, capacity.slots);
          const backlogMonths = monthsBetweenDates(today, nextFree);
          return backlogMonths >= 12
            ? ["", "[Construction backlog]", `The construction queue is ${backlogMonths} months deep (next free slot ${nextFree}, capacity ${capacity.slots}). ONE of the six questions should ask about construction priorities — what to finish, defer or cancel.`]
            : [];
        } catch { return []; }
      })(),
    ].join("\n");

    const raw = await callAI(systemPrompt, [
      { role: "user", parts: [{ text: "Write the six questions now, as a JSON array." }] },
    ], { role: "advisor" });

    const text = normalizeString(typeof raw === "string" ? raw : raw?.rawText);
    const start = text.indexOf("[");
    const end = text.lastIndexOf("]");
    const parsed = start !== -1 && end > start ? JSON.parse(text.slice(start, end + 1)) : null;
    const questions = normalizeArray(parsed)
      .map((entry) => normalizeString(entry))
      .filter(Boolean)
      .slice(0, 6);
    if (questions.length === 0) throw new Error("no questions in the reply");

    const latest = normalizeWorldState(await readWorldState({ force: true }));
    latest.advisorTopics = { questions, round };
    await writeWorldState(latest);
    return questions;
  } catch (error) {
    console.warn("[advisor] could not write situation-aware topics; using the standing ones.", error);
    return FALLBACK_ADVISOR_TOPICS;
  }
};

// The advisor's Background Story used to be written only when the player opened
// the tab and pressed the button, so in a long campaign it sat frozen at
// whatever round they last thought to refresh it. The original game folds the
// rounds together into a running chronicle by itself; this does the same —
// after every jump, if the cached story is a interval behind, it is rewritten in
// the background. Fire-and-forget on purpose: the turn is already finished and
// the player is reading their events, so this never blocks anything, and a
// failure just leaves the previous story in place until next time.
export const refreshBackstoryIfDue = async () => {
  try {
    const [world, game] = await Promise.all([readWorldState(), readGameData()]);
    const round = Number(game?.round) || 1;
    const normalizedWorld = normalizeWorldState(world);
    const cachedRound = Number(normalizedWorld?.backstory?.round) || 0;
    // A consolidation that has advanced past the cached chapter's start makes
    // the chapter stale REGARDLESS of age: its opening rounds now belong to a
    // consolidated chapter and would be told twice.
    const boundary = Number(normalizeArray(normalizedWorld.consolidatedHistory).at(-1)?.throughRound) || 0;
    const chapterFrom = Number(normalizedWorld?.backstory?.fromRound) || 1;
    const overtaken = cachedRound > 0 && boundary >= chapterFrom;
    // Nothing worth chronicling yet, or the story is still current.
    if (round < BACKSTORY_AUTO_INTERVAL_ROUNDS) return false;
    if (!overtaken && cachedRound > 0 && round - cachedRound < BACKSTORY_AUTO_INTERVAL_ROUNDS) return false;
    console.info(overtaken
      ? `[advisor] a consolidation has absorbed the current chapter's opening rounds — rewriting it from round ${boundary + 1}.`
      : `[advisor] background story is ${cachedRound ? round - cachedRound : round} round(s) behind — rewriting it.`);
    await generateBackstory();
    return true;
  } catch (error) {
    console.warn("[advisor] automatic background-story refresh failed; the previous one is kept.", error);
    return false;
  }
};

// Freeform AI intelligence briefing on a specific country/polity, grounded in the
// current world state. Returned as plain-text bullet points for the region popup.
// Everything the game state actually records about ONE polity — the target's
// dossier for intelligence briefings. The generic world summary truncates hard
// (24 of possibly thousands of region overrides, 16 polities), so without this
// the target usually isn't in the prompt at all and the AI can only shrug.
const buildTargetDossier = async (bundle, code) => {
  const world = normalizeWorldState(bundle.world);
  const lines = [];

  const polity = code ? world.polityOverrides?.[code] : null;
  if (polity) {
    lines.push(
      `Polity: ${polity.name || code} (code ${code})${
        polity.aliases?.length > 0 ? ` — also known as ${polity.aliases.join(", ")}` : ""
      }`,
    );
    if (polity.note) lines.push(`Notes: ${polity.note}`);
  }

  const overrides = Object.entries(world.regionOwnershipOverrides ?? {});
  const owned = code ? overrides.filter(([, owner]) => owner === code) : [];
  if (owned.length > 0) {
    const regionCatalog = await loadRegionCatalog();
    const regionLookup = new Map(regionCatalog.map((region) => [region.id, region]));
    const names = owned.slice(0, 40).map(([regionId]) => {
      const region = regionLookup.get(regionId);
      return region ? `${region.name}${region.country ? ` (${region.country})` : ""}` : regionId;
    });
    lines.push(
      `Territory: holds ${owned.length} regions${owned.length > names.length ? ", including" : ""}: ${names.join(", ")}${
        owned.length > names.length ? ", …" : ""
      }`,
    );
  } else if (code) {
    lines.push(
      overrides.length > 0
        ? `Territory: no regions on the current map are recorded as held by ${code}.`
        : `Territory: holds its modern-day territory (no territorial changes recorded).`,
    );
  }

  const units = normalizeArray(bundle.world?.units).filter((unit) => unit?.ownerCode === code);
  if (units.length > 0) {
    const byType = new Map();
    let strength = 0;
    for (const unit of units) {
      byType.set(unit.type, (byType.get(unit.type) || 0) + 1);
      strength += Number(unit.strength) || 0;
    }
    const composition = Array.from(byType.entries()).map(([type, n]) => `${n} ${type}`).join(", ");
    lines.push(`Deployed forces: ${units.length} units (${composition}), combined strength ${strength}.`);
  } else {
    lines.push("Deployed forces: none currently on the map.");
  }

  return lines.join("\n");
};

export const generateCountryStats = async ({ code, name } = {}) => {
  const bundle = await readGameStateBundle({ force: true });
  const variables = await buildTemplateVariables(bundle);
  const target = name || code || "the polity";
  const playerPolity = variables.playerPolity || bundle?.game?.country || "the player";
  const dossier = await buildTargetDossier(bundle, normalizeString(code));
  const era = normalizeString(bundle.world?.simulationRules).slice(0, 700);
  const system =
    `You are the intelligence advisor in an alternate-history strategy game. ` +
    `The current date is ${variables.date || "unknown"}. The player leads ${playerPolity}. ` +
    `Give a concise intelligence briefing on ${target}${code ? ` (code ${code})` : ""}. ` +
    `Treat the TARGET DOSSIER and WORLD STATE below as ground truth. Where specifics are not recorded, ` +
    `give your best historical estimate for this era, people and region — you are the advisor, and ` +
    `plausible estimates are your job. Never answer with "unknown", "no data" or "not specified"; ` +
    `mark guesses with "(est.)" instead. ` +
    `Cover government/leadership, territory & key regions, military strength, economy, and diplomatic posture toward ${playerPolity}.\n\n` +
    (era ? `ERA & WORLD RULES:\n${era}\n\n` : "") +
    `TARGET DOSSIER:\n${dossier || "(nothing recorded)"}\n\n` +
    `WORLD STATE:\n${variables.worldSummary || variables.grandMapDescription || "(no summary)"}\n\n` +
    `RECENT EVENTS:\n${variables.recentEvents || "(none)"}\n\n` +
    `Respond in ${variables.language || "English"} as 4-6 short bullet points, each prefixed with "- ". No preamble, no closing remarks.`;
  const raw = await callAI(system, [
    { role: "user", parts: [{ text: `Give me the intelligence briefing on ${target}.` }] },
  ], { role: "advisor" });
  return String(raw || "").trim();
};

// Region-level advisor briefing for the region info panel — the original
// game's per-province advisor report. Grounded in the live world state plus
// whatever recorded events touched the region (by transfer id or by name).
export const generateRegionBrief = async ({ id, name, ownerName } = {}) => {
  const bundle = await readGameStateBundle({ force: true });
  const variables = await buildTemplateVariables(bundle);
  const target = name || id || "the region";
  const playerPolity = variables.playerPolity || bundle?.game?.country || "the player";
  const world = normalizeWorldState(bundle.world);
  const regionEvents = normalizeEvents(bundle.events)
    .filter((event) => {
      const transfers = event.impacts?.regionTransfers ?? [];
      if (id && transfers.some((transfer) => String(transfer?.regionId) === String(id))) return true;
      const haystack = `${event.title ?? ""} ${event.description ?? ""}`.toLowerCase();
      return Boolean(name) && haystack.includes(String(name).toLowerCase());
    })
    .slice(-12)
    .map((event) => `${event.date || "undated"} — ${event.title}: ${event.description}`)
    .join("\n");
  const claimants = (id ? world.regionClaimants?.[id] ?? [] : []).join(", ");
  const era = normalizeString(bundle.world?.simulationRules).slice(0, 700);
  const system =
    `You are the intelligence advisor in an alternate-history strategy game. ` +
    `The current date is ${variables.date || "unknown"}. The player leads ${playerPolity}. ` +
    `Give a concise REGIONAL briefing on the region "${target}"${ownerName ? `, currently part of ${ownerName}` : ", currently unclaimed territory"}. ` +
    `Treat the recorded facts below as ground truth. Where specifics are not recorded, give your best ` +
    `historical estimate for this era and place — plausible estimates are your job. Never answer with ` +
    `"unknown" or "no data"; mark guesses with "(est.)". ` +
    `Cover: strategic value & geography, population & economy, military presence & defensibility, ` +
    `political stability${claimants ? " (note the competing claims)" : ""}, and what this region means for ${playerPolity}.\n\n` +
    (era ? `ERA & WORLD RULES:\n${era}\n\n` : "") +
    (claimants ? `COMPETING CLAIMS: claimed by ${claimants}\n\n` : "") +
    `WORLD STATE:\n${variables.worldSummary || variables.grandMapDescription || "(no summary)"}\n\n` +
    `EVENTS TOUCHING THIS REGION:\n${regionEvents || "(none recorded)"}\n\n` +
    `Respond in ${variables.language || "English"} as 4-6 short bullet points, each prefixed with "- ". No preamble, no closing remarks.`;
  const raw = await callAI(system, [
    { role: "user", parts: [{ text: `Give me the regional briefing on ${target}.` }] },
  ], { role: "advisor" });
  return String(raw || "").trim();
};

// Structured national stat sheet for the Stats tab, grounded in the same
// campaign context as the intelligence briefing.
export const generateCountryStatSheet = async ({ code, name } = {}) => {
  const bundle = await readGameStateBundle({ force: true });
  const variables = await buildTemplateVariables(bundle);
  const target = name || code || "the polity";
  const dossier = await buildTargetDossier(bundle, normalizeString(code));
  const era = normalizeString(bundle.world?.simulationRules).slice(0, 700);
  const sheetDate = normalizeString(bundle.game?.gameDate) || normalizeString(bundle.game?.startDate);
  // WHAT THE CAMPAIGN HAS ALREADY ESTABLISHED. A regeneration used to be blind
  // to it — the model reinvented the base from era knowledge, and the live save
  // got its real-world 2018 leader back over the campaign's own acting-president
  // canon. The standing merged sheet rides in the prompt as ground truth, and
  // the identity guard below enforces it even when the model ignores the ask.
  const statCode = normalizeString(code);
  const priorWorld = normalizeWorldState(bundle.world);
  const { __asOf: priorAsOf, __format: _priorFormat, ...priorBase } = priorWorld.countryStats?.[statCode] ?? {};
  const priorSheet = Object.keys(priorBase).length > 0
    ? mergeStatSheet(priorBase, priorWorld.countryStatChanges?.[statCode])
    : null;
  const priorText = priorSheet ? buildStatSheetText(priorSheet) : "";
  // Every leader already on the books, for the contamination check below. The
  // first fresh sheets this campaign generated included Japan led by the
  // PLAYER's own president — the model pattern-matched the most salient name in
  // its context. A recorded leader belongs to exactly one country.
  // CANONICAL comparison, not raw: the caller may say "CHN" while the store
  // says "China", and a raw !== let a country's OWN stored sheet into the
  // foreign map — live round 2, China's sheet flagged for naming China's own
  // leader. The same map now also carries capitals: a sheet that arrives with
  // ANOTHER country's capital is not borrowing a name, it IS that other
  // country's sheet (live: Japan's sheet came back as China's in full —
  // government 중화인민공화국, GDP in 위안, the works).
  // One key shape for every comparison in this gate: canonicalised, interior
  // whitespace collapsed, case folded. Round 6 live: the UK's own regeneration
  // was refused for carrying the UK's own capital — the store key and the
  // caller's code rendered identically in the console yet compared unequal,
  // which is exactly the failure a trim-only normalize invites (a doubled or
  // exotic space inside a multi-word name survives trim and prints invisibly).
  const canonKey = (value) => normalizeString(toCountryName(normalizeString(value).replace(/\s+/g, " ")))
    .replace(/\s+/g, " ").toLowerCase();
  const canonicalTarget = canonKey(statCode || target) || normalizeString(statCode || target).toLowerCase();
  // The real officeholders for this country on this date, wherever the record
  // covers it (see leaderReference.js) — the era pack for a historical preset
  // loads here, once, before the sync lookups. The campaign's own recorded
  // person always outranks this; the record outranks a fresh guess.
  await ensureReferenceEra(sheetDate);
  // THE ALIAS CHAIN, THE SAME ONE THE BUILD USES. A name-only lookup answered
  // {} for British Empire, French Republic, Republic of China and Mongolian
  // People's Republic — and the 12B filled those four sheets with people who
  // never existed. The polity's own alias list is the bridge ("British Empire"
  // → "United Kingdom" → 총리 스탠리 볼드윈), and the preset's start-date seed
  // is the fallback for whatever the record still does not cover. Measured
  // across all presets: name-only hit 193/393 polities, this hits 293/393, and
  // every preset from 1444 on is now 100%.
  const referenceName = toCountryName(statCode) || normalizeString(target);
  const polityRecord = (() => {
    const overrides = priorWorld.polityOverrides ?? {};
    const wanted = canonKey(referenceName);
    for (const [key, entry] of Object.entries(overrides)) {
      if (!entry) continue;
      if (canonKey(key) === wanted || canonKey(entry.name) === wanted || canonKey(entry.code) === wanted) return entry;
    }
    return null;
  })();
  const reference = resolveLeadership(referenceName, sheetDate, {
    aliases: polityRecord?.aliases ?? [],
    seed: polityRecord?.leadership ?? null,
  });
  if (reference?.__source === "seed") {
    console.info(`[stats] ${referenceName}: the record does not cover this date — using the preset's start-date seeding (${reference.__asOf || "?"}).`);
  }
  // The era's real contenders — the palette a DIVERGED campaign names its
  // successors from, instead of inventing someone.
  const politicalFigures = resolvePoliticalFigures(referenceName, sheetDate, { aliases: polityRecord?.aliases ?? [] });
  // The DISPLAY name is a second identity for the same country — a caller may
  // pass a code the canon tables miss while the name says who it is.
  const canonicalDisplayTarget = canonKey(target);
  const playerCanonical = canonKey(bundle.game?.country);
  // Set when the PLAYER's own sheet collides with a leader some other sheet
  // holds — the other sheet is the contaminated one and is healed below.
  let contaminatedLeaderOwner = "";
  const foreignLeaders = new Map();
  const foreignCapitals = new Map();
  for (const [country, storedSheet] of Object.entries(priorWorld.countryStats ?? {})) {
    if (!storedSheet) continue;
    const canonicalCountry = canonKey(country) || normalizeString(country).toLowerCase();
    if (country === statCode || canonicalCountry === canonicalTarget || canonicalCountry === canonicalDisplayTarget) continue;
    const { __asOf: _ignored, ...otherBase } = storedSheet;
    const merged = mergeStatSheet(otherBase, priorWorld.countryStatChanges?.[country]);
    const otherLeader = normalizeString(merged?.leader);
    if (otherLeader && otherLeader !== "(미확인)") foreignLeaders.set(otherLeader, country);
    const otherCapital = normalizeString(merged?.capital);
    if (otherCapital) foreignCapitals.set(otherCapital, country);
  }
  // Titled and bare spellings of one person must collide the same way the exact
  // strings used to: "대통령 블라디미르 푸틴" borrowed onto another sheet is still
  // Russia's recorded "블라디미르 푸틴". A linear scan — the map holds one row per
  // country with a sheet, a few dozen at most.
  const findForeignLeaderOwner = (value) => {
    const name = normalizeString(value);
    if (!name) return undefined;
    for (const [recorded, country] of foreignLeaders) {
      if (sameLeaderPerson(recorded, name)) return country;
    }
    return undefined;
  };
  // AGREEING WITH YOUR OWN ESTABLISHED SHEET IS NEVER CONTAMINATION. Round 6
  // live: the UK and US regenerations arrived carrying their own recorded
  // capitals (런던, 워싱턴 D.C.) and were refused as "another country's" —
  // some upstream key mismatch had let the target's own store row into the
  // foreign maps. Whatever the mismatch, the prior sheet is the target's own
  // record: a claimed capital or leader that MATCHES it short-circuits every
  // collision gate below, so no key drift can ever refuse a country its own
  // identity again. (The breadcrumb names the caller's code so a future
  // mismatch is measurable from the console instead of reconstructed.)
  const ownCapital = normalizeString(priorSheet?.capital);
  const ownLeader = normalizeString(priorSheet?.leader);
  if (statCode && statCode !== normalizeString(target)) {
    console.info(`[stats] compiling ${target} (code "${statCode}").`);
  }
  const { payload } = await runJsonTask("countryStatSheet", {
    userMessage: [
      `Compile the national stat sheet for ${target}${code ? ` (code ${code})` : ""}${sheetDate ? `, as it stands on ${sheetDate}` : ""}.`,
      era ? `ERA & WORLD RULES:\n${era}` : "",
      `TARGET DOSSIER:\n${dossier || "(nothing recorded)"}`,
      Object.keys(reference).length > 0
        ? `OFFICEHOLDERS ON RECORD for ${target} on ${sheetDate || "this date"} — real public record, in the required format. Use these for the leadership fields unless the campaign's own established sheet below names a DIFFERENT person:\n${["leader", "headOfState", "deputy"].filter((field) => reference[field]).map((field) => `${field}: ${reference[field]}`).join("\n")}`
        : "",
      politicalFigures.length > 0
        ? `MAJOR REAL POLITICAL FIGURES of ${target} on ${sheetDate || "this date"} — the era's actual opposition leaders and contenders. When THIS CAMPAIGN's events have replaced an officeholder and a successor must be named, pick the plausible REAL person from these or from the record above — never an invented name:\n${politicalFigures.map((name) => `- ${name}`).join("\n")}`
        : "",
      priorText
        ? `THE SHEET AS THIS CAMPAIGN LAST ESTABLISHED IT${priorAsOf ? ` (as of ${priorAsOf})` : ""}:\n${priorText}\n\nThese are this campaign's own established facts — carry them forward and update only what the passage of time to ${sheetDate || "today"} plausibly changes. Leader, government and capital stay exactly as recorded: in this campaign they change only through its own events, never because the real world's history says otherwise. The one permitted rewrite: where a recorded leadership name lacks its official title, keep the SAME person and put their real office in front of the name ("박근혜" → "대통령 박근혜") — never a different person. The recorded headOfState and deputy carry forward the same way: keep the recorded person (titled), and never replace a recorded person with "(없음)" or "(미확인)".`
        : "",
    ].filter(Boolean).join("\n\n"),
    // The 12B omits fields even when the schema requires them — and schema
    // validation runs BEFORE validatePayload, so an omitted headOfState/deputy
    // used to fail the whole sheet before the validator's sentinel logic could
    // ever run (round 8's measured omission burning both attempts, taking the
    // pivot seeding down with it). repairPayload runs before the schema.
    // An absent role backfills from the CAMPAIGN'S OWN RECORD first — round 10
    // live: Russia's regeneration omitted deputy and the "(미확인)" backfill
    // erased a recorded 메드베데프 — and only an office the campaign never knew
    // becomes the honest unknown.
    repairPayload: (parsed) => {
      for (const field of ["headOfState", "deputy"]) {
        if (normalizeString(parsed?.[field])) continue;
        const recordedPrior = normalizeString(priorSheet?.[field]);
        // Campaign record first, then the era's officeholders on record, then
        // the honest unknown — a prior SENTINEL is an absence, not a record,
        // and must not block the reference behind it.
        parsed[field] = (recordedPrior && !isRoleSentinel(recordedPrior) ? recordedPrior : "")
          || normalizeString(reference[field]) || "(미확인)";
      }
      // The three GDP shares round to 99 or 101 routinely — a tolerance the
      // sanity module has always granted (90–110) but the schema's exact-100
      // check did not, and the mismatch failed South Korea's whole
      // regeneration over a rounding error. Rescale an in-tolerance trio to
      // exactly 100 (largest remainder) so the strict check reads clean.
      const breakdown = parsed?.gdpBreakdown;
      const shares = ["agriculture", "industry", "services"].map((key) => Number(breakdown?.[key]));
      const total = shares.reduce((sum, share) => sum + share, 0);
      if (shares.every(Number.isFinite) && total !== 100 && total >= 90 && total <= 110) {
        const scaled = shares.map((share) => (share * 100) / total);
        const floors = scaled.map(Math.floor);
        let remainder = 100 - floors.reduce((sum, value) => sum + value, 0);
        const order = scaled.map((value, index) => [value - floors[index], index])
          .sort((left, right) => right[0] - left[0]);
        for (const [, index] of order) {
          if (remainder <= 0) break;
          floors[index] += 1;
          remainder -= 1;
        }
        ["agriculture", "industry", "services"].forEach((key, index) => { breakdown[key] = floors[index]; });
      }
    },
    // The economy block is free text, and free text is where salvaged JSON
    // wreckage ends up looking like a number to the player (see statSheetSanity).
    // Reject it and ask again; blank it only when there are no attempts left.
    validatePayload: (candidate, { finalAttempt } = {}) => {
      // A CAPITAL BORROWED FROM ANOTHER SHEET MEANS THE WHOLE SHEET IS THAT
      // COUNTRY'S. A borrowed leader can sit on an otherwise-correct sheet; a
      // borrowed capital cannot — live, Japan's "sheet" was China's entirely.
      // Ask again once; if it comes back still wearing another capital, refuse
      // the sheet outright: storing it would poison the base, the ledger and
      // every later regeneration that reads it back as established fact.
      const claimedCapital = normalizeString(candidate?.capital);
      const capitalBelongsTo = claimedCapital && claimedCapital !== ownCapital
        ? foreignCapitals.get(claimedCapital) : undefined;
      if (capitalBelongsTo) {
        console.warn(`[stats] ${target}'s sheet arrived with ${capitalBelongsTo}'s capital ("${claimedCapital}")${finalAttempt ? " even on retry — refusing the sheet rather than storing another country's." : " — asking again."}`);
        return `"${claimedCapital}" is ${capitalBelongsTo}'s capital. This sheet must describe ${target} and only ${target} — its own capital, government, leader and economy as of ${sheetDate || "this date"}.`;
      }
      // "시노자와 다로 (Shinzo Abe)" — an invented name wearing the real one in
      // parentheses (round 5, live). One person has one name; a parenthetical
      // second name means the model is hedging between an invention and the
      // truth. Ask once; on the last attempt keep the parenthetical name — the
      // hedge itself says which one the model actually believes.
      // THE HEDGE UNWRAPS BEFORE EVERY OTHER LEADER CHECK. It used to run
      // after the borrowed-leader gate, which meant the gate judged the hedged
      // full string ("김철수 (블라디미르 푸틴)" collides with nothing) and the
      // extraction then installed the inner name — possibly a foreign leader —
      // with no recheck. Extracting first sends the REAL claim through the
      // gates below.
      const claimedLeaderRaw = normalizeString(candidate?.leader);
      const parenthetical = /^(.*?)\s*[(（]\s*([^)）]{2,40})\s*[)）]\s*$/.exec(claimedLeaderRaw);
      if (parenthetical && parenthetical[1] && parenthetical[2] && !/^\d+$/.test(parenthetical[2])) {
        if (!finalAttempt) {
          return `"leader" must be ONE name for one real person, in the game's language — no second name in parentheses. Which single person leads ${target} on ${sheetDate || "this date"}?`;
        }
        candidate.leader = normalizeString(parenthetical[2]);
        console.warn(`[stats] ${target}'s leader arrived as "${claimedLeaderRaw}" — keeping the parenthetical name the model was hedging toward: "${candidate.leader}".`);
      }
      // A LEADER BORROWED FROM ANOTHER COUNTRY'S SHEET IS NEVER RIGHT — but
      // WHICH sheet is the borrower depends on who the player is. Contamination
      // flows FROM the player's context INTO other countries' sheets (that is
      // the measured direction, twice across two campaigns), so when the sheet
      // being generated IS the player's and a foreign sheet has its leader on
      // file, the foreign sheet is the contaminated one: the player's sheet
      // keeps its leader, and the borrower is healed after the run. Round-3
      // live: South Korea's own sheet lost 박근혜 to (미확인) because Japan's
      // contaminated sheet had claimed her first.
      const claimedLeader = normalizeString(candidate?.leader);
      const leaderBelongsTo = claimedLeader && !sameLeaderPerson(claimedLeader, ownLeader)
        ? findForeignLeaderOwner(claimedLeader) : undefined;
      if (leaderBelongsTo && canonicalTarget === playerCanonical) {
        contaminatedLeaderOwner = leaderBelongsTo;
      } else if (leaderBelongsTo) {
        if (!finalAttempt) {
          return `"${claimedLeader}" is ${leaderBelongsTo}'s recorded leader, not ${target}'s. Name ${target}'s own head of state or government as of ${sheetDate || "this date"}.`;
        }
        candidate.leader = "(미확인)";
        console.warn(`[stats] ${target}'s sheet named ${leaderBelongsTo}'s leader ("${claimedLeader}") even on retry — recorded as unconfirmed rather than wrong.`);
      }
      // An empty or unconfirmed leader on a FRESH sheet gets one more ask —
      // the player's report: France arrived with no leader at all.
      if (!claimedLeader && !finalAttempt) {
        return `The "leader" field is empty. Name ${target}'s actual head of state or government as of ${sheetDate || "this date"}; if the campaign has deposed them, name the successor its events installed.`;
      }
      // Stability 0 for a functioning state is a coercion artifact or a
      // misread, not a judgment (round 5, live: the PLAYER's own country at
      // 0). One more ask; a model that insists twice may truly mean collapse.
      if (Number(candidate?.stability) === 0 && !finalAttempt) {
        return `"stability" came back 0, which means the state has COLLAPSED. If ${target} is a functioning state on ${sheetDate || "this date"}, give its real stability from 0 to 100.`;
      }
      // The wider leadership picture is REQUIRED — with an honest way out.
      // Round 6 established that wrong is worse than missing (deputies blended,
      // unrelated people); round 8 established that OPTIONAL means MISSING —
      // every sheet regenerated that round came back without both roles, while
      // the March sheets still carried them. The 12B pattern's answer: the
      // schema demands the fields, and "(없음)" (no such office) / "(미확인)"
      // (holder unknown) stand in as honest blanks. A value that fails the
      // smell tests becomes a sentinel rather than being deleted — deletion
      // would fail the required schema downstream, and the sentinel keeps the
      // sheet telling the truth.
      // Compared against the leader AS REPAIRED ABOVE — the extraction and the
      // borrowed-leader heal both rewrite candidate.leader, and a stale copy
      // let the extracted person slip into headOfState as a "different" name.
      const leaderNow = normalizeString(candidate?.leader);
      for (const field of ["headOfState", "deputy"]) {
        const value = normalizeString(candidate?.[field]);
        if (!value) { if (candidate) candidate[field] = "(미확인)"; continue; }
        if (isRoleSentinel(value)) {
          candidate[field] = canonicalRoleSentinel(value);
          continue;
        }
        const collidesWith = findForeignLeaderOwner(value);
        const repeatsLeader = sameLeaderPerson(value, leaderNow);
        if (repeatsLeader || collidesWith || /[(（]/.test(value)) {
          console.info(`[stats] dropped ${target}'s ${field} ("${value}") — ${collidesWith ? `it is ${collidesWith}'s recorded leader` : repeatsLeader ? "it repeats the leader" : "a hedged double name"}.`);
          // A repeat means the leader personally holds the role — a structural
          // absence. A collision or hedge means the truth is simply not known.
          candidate[field] = repeatsLeader && !collidesWith ? "(없음)" : "(미확인)";
        }
      }
      // THE OFFICEHOLDERS ON RECORD BEAT A 12B'S GUESS. Round 11 live: asked
      // directly for China's deputy, the model produced "국무원총리 장관정
      // (장가정)" — an invention wearing a hedge — with 리커창 in office. No
      // prompt cures a knowledge failure; the record does. Where the campaign
      // has no recorded person of its own, a candidate that names someone
      // else, or shrugs, is overwritten with the era's actual officeholder;
      // the same person under the record's curated spelling takes it.
      for (const field of ["leader", "headOfState", "deputy"]) {
        const recorded = normalizeString(reference[field]);
        if (!recorded) continue;
        const priorOwn = normalizeString(priorSheet?.[field]);
        // The campaign's own DIFFERENT person stands — alternate history wins.
        if (priorOwn && !isRoleSentinel(priorOwn) && !sameLeaderPerson(priorOwn, recorded)) continue;
        const value = normalizeString(candidate?.[field]);
        if (isRoleSentinel(recorded)) {
          // The record says the system has no separate such office — that
          // settles an unknown, but never overrides a person the model named.
          if (!value || value === "(미확인)") candidate[field] = recorded;
          continue;
        }
        if (!value || isRoleSentinel(value) || !sameLeaderPerson(value, recorded)) {
          if (value && !isRoleSentinel(value)) {
            console.info(`[stats] ${target}'s ${field} ("${value}") is not the officeholder on record for ${sheetDate || "this date"} — corrected to "${recorded}".`);
          }
          candidate[field] = recorded;
        } else if (recorded.length > value.length) {
          candidate[field] = recorded;
        }
      }
      // A doubtful wider role gets ONE direct ask. Without it the backfill
      // satisfied the schema and the certainty gate kept the model shy, so
      // offices that are public record stayed blank (round 10 live: China's
      // deputy "(미확인)" with 리커창 in office, South Korea's deputy "(없음)"
      // with a sitting 국무총리). An unknown holder is always asked once; a
      // claimed NO-SUCH-OFFICE is challenged only for deputy, where nearly
      // every modern system actually has one — headOfState "(없음)" is the
      // correct answer for every presidential republic and stays unchallenged.
      // (The reference above settles covered countries without the retry.)
      if (!finalAttempt) {
        const doubtful = ["headOfState", "deputy"].filter((field) => {
          // A role the record covers is already adjudicated above — asking
          // again would invite the model to argue with the record.
          if (normalizeString(reference[field])) return false;
          const value = normalizeString(candidate?.[field]);
          return value === "(미확인)" || (field === "deputy" && value === "(없음)");
        });
        if (doubtful.length > 0) {
          return `Look again at ${doubtful.join(" and ")}: "(미확인)" is only for a holder that is genuinely not known, and a deputy "(없음)" claims the system has NO vice president, prime minister under the president, or deputy PM at all — rare in a modern state. If the office exists and its holder on ${sheetDate || "this date"} is public record, name them as official title + name; otherwise repeat the sentinel and it will stand.`;
        }
      }
      // Deterministic money tidy BEFORE the sanity check, so "-587_billion_usd"
      // and "1.126T" style values are repaired rather than rejected.
      const tidied = tidyStatSheetMoney(candidate);
      if (tidied.length > 0) console.info(`[stats] tidied ${tidied.length} money value(s) on ${target}'s sheet: ${tidied.join(", ")}.`);
      const problems = findStatSheetProblems(candidate);
      if (problems.length === 0) return null;
      if (finalAttempt) {
        sanitizeStatSheet(candidate);
        console.warn(`[stats] the stat sheet for ${target} kept coming back malformed; blanking ${problems.length} field(s).`, problems);
        return null;
      }
      return `These fields are not usable values: ${problems.join("; ")}. Rewrite the sheet with a real estimate in each one — a number with its unit, nothing else — and no JSON punctuation inside a value.`;
    },
    variables,
  });
  // THE IDENTITY GUARD. Who leads, what the government is, where the capital
  // sits — in a campaign these change only through the campaign's own events,
  // which travel the delta store and always win at display time anyway. So a
  // regeneration that answers differently from the standing sheet is never a
  // correction; it is reality bleeding in, and it cascades: repairLeaderFacts
  // restates the LEDGER's leader fact from this sheet, so one blind regeneration
  // would rewrite campaign canon. Kept, and said out loud.
  if (priorSheet && payload && typeof payload === "object") {
    const kept = [];
    const retitled = [];
    // deputy joined the guarded fields in round 10: a regeneration that
    // omitted it had the backfill write a sentinel over Russia's recorded
    // 메드베데프 — a recorded person never yields to a blind regeneration's
    // shrug, for the second-in-command exactly as for the leader.
    for (const field of ["leader", "headOfState", "deputy", "government", "capital"]) {
      const prior = normalizeString(priorSheet[field]);
      const next = normalizeString(payload[field]);
      if (prior && next && prior !== next) {
        const personField = field === "leader" || field === "headOfState" || field === "deputy";
        // AN HONEST SENTINEL NEVER PINS. "(미확인)" exists precisely to be
        // refilled — the contamination heal writes it expecting "its next
        // regeneration" to answer, and this guard used to revert that answer
        // right back to unknown. "(없음)" likewise yields to an actual named
        // holder the model is now certain of; sentinels are absences, not
        // established facts, and the guard exists to stop PERSON swaps.
        if (personField && isRoleSentinel(prior)) continue;
        // The SAME person gaining their official title is not a rewrite — it is
        // the one upgrade the carry-forward prompt asks for ("박근혜" →
        // "대통령 박근혜"). The fuller spelling wins whichever side holds it;
        // a DIFFERENT person is still reality bleeding in, and is reverted.
        if (personField && sameLeaderPerson(prior, next)) {
          if (next.length > prior.length) retitled.push(`${field} "${prior}" → "${next}"`);
          else payload[field] = priorSheet[field];
          continue;
        }
        payload[field] = priorSheet[field];
        kept.push(`${field} "${next}" → kept "${prior}"`);
      }
    }
    if (retitled.length > 0) {
      console.info(`[stats] ${target}'s sheet picked up official title(s) for the recorded person: ${retitled.join("; ")}.`);
    }
    if (kept.length > 0) {
      console.info(`[stats] a regenerated sheet for ${target} tried to rewrite established fact(s) — kept the campaign's own: ${kept.join("; ")}.`);
    }
    // A BLANK NEVER BEATS A RECORD. Round 12, live: one malformed generation
    // came back with gdp, publicDebt and budgetBalance unusable, the sanity
    // pass blanked them, and the blanks were STORED and format-stamped — the
    // player's own GDP then read as unknown for two game-months, and the
    // construction capacity quietly lost its economy bonus ("역량 8→6"의 진짜
    // 원인 — 안정도가 아니라 빈 GDP였다). A field the campaign has a value for
    // carries forward when a regeneration produces nothing usable for it.
    {
      const carried = [];
      for (const field of ["gdp", "gdpPerCapita", "publicDebt", "budgetBalance", "unemployment", "inflation", "gdpGrowth"]) {
        const prior = normalizeString(priorSheet?.economy?.[field]);
        if (!prior) continue;
        const next = normalizeString(payload?.economy?.[field]);
        if (!next) {
          payload.economy = { ...(payload.economy || {}), [field]: priorSheet.economy[field] };
          carried.push(field);
        }
      }
      if (carried.length > 0) {
        console.info(`[stats] ${target}'s regeneration left ${carried.length} economy field(s) blank — carried the campaign's own values forward: ${carried.join(", ")}.`);
      }
    }
  }
  // Persist the BASE, stamped with the date it describes. It used to be persisted
  // unstamped, and because a complete sheet short-circuits the loader it was then
  // re-read forever: the sheet the player saw at round 29 was generated at round
  // 2. The stamp is what lets the loader tell "this describes now" from "this
  // describes two years ago". What the campaign CHANGED is a separate store
  // (world.countryStatChanges) that always wins over this.
  if (statCode && payload && typeof payload === "object") {
    try {
      const world = normalizeWorldState(await readWorldState({ force: true }));
      // __format marks this base as titled-leadership / required-roles output;
      // the pane treats an unstamped base as stale so pre-format sheets
      // regenerate once and pick their titles up.
      const stamped = { ...payload, __asOf: sheetDate, __format: SHEET_FORMAT };
      const nextStats = { ...world.countryStats, [statCode]: stamped };
      // The borrower found above: the player's sheet kept its leader, so the
      // foreign sheet that was holding the same name is the wrong one — its
      // leader becomes an honest unknown, regenerable by its own next open.
      if (contaminatedLeaderOwner && nextStats[contaminatedLeaderOwner]) {
        nextStats[contaminatedLeaderOwner] = { ...nextStats[contaminatedLeaderOwner], leader: "(미확인)" };
        console.warn(`[stats] ${contaminatedLeaderOwner}'s stored sheet was holding ${target}'s leader — its leader is now unconfirmed, to be refilled on its next regeneration.`);
      }
      await writeWorldState({ ...world, countryStats: nextStats });
    } catch (error) {
      console.warn("[ai] failed to persist country stats:", error);
    }
  }
  return payload;
};

export const refinePlayerAction = async (rawInput, { persist = true } = {}) => {
  const bundle = await readGameStateBundle({ force: true });
  const variables = await buildTemplateVariables(bundle, { actionInput: rawInput });
  const { payload } = await runJsonTask("descriptionToAction", {
    fallback: () => fallbackDescriptionToAction(rawInput, bundle),
    userMessage: "Convert the player's raw intent into one structured in-game command as JSON only.",
    variables,
  });

  const invitees = normalizeArray(payload?.invitees).map((entry) => normalizeString(entry)).filter(Boolean);
  const action = normalizeActionEntry({
    chatStarter: normalizeString(payload?.chatStarter),
    invitees,
    kind: normalizeString(payload?.kind).toLowerCase() === "chat" ? "chat" : "action",
    rawInput,
    source: "manual",
    status: "planned",
    text: normalizeString(payload?.text),
    title: normalizeString(payload?.title),
  });

  if (!action) {
    throw new Error("Could not convert the action into a structured command.");
  }

  if (persist) {
    const nextActions = [...(await readActionsState({ force: true })), action];
    await writeActionsState(nextActions);
  }

  return action;
};

export const chooseNextDiplomaticSpeaker = async ({
  chat,
  excludeSpeaker = "",
} = {}) => {
  const bundle = await readGameStateBundle({ force: true });
  const normalizedChat = normalizeChats([chat])[0];
  if (!normalizedChat) {
    return "";
  }

  const variables = await buildTemplateVariables(bundle, { chat: normalizedChat });
  const { payload } = await runJsonTask("nextSpeaker", {
    fallback: () => fallbackNextSpeaker({ chat: normalizedChat, excludedSpeaker: excludeSpeaker }),
    userMessage: "Choose the next speaker as JSON only.",
    variables: {
      ...variables,
      lastSpeaker: excludeSpeaker || variables.lastSpeaker,
    },
  });

  const nextSpeaker = normalizeString(payload?.nextSpeaker);
  if (!nextSpeaker) {
    return fallbackNextSpeaker({ chat: normalizedChat, excludedSpeaker: excludeSpeaker }).nextSpeaker;
  }

  const validSpeaker =
    normalizedChat.countries.find((country) => country.name.toLowerCase() === nextSpeaker.toLowerCase()) ??
    normalizedChat.countries.find((country) => country.name !== excludeSpeaker);

  return validSpeaker?.name || "";
};

export const consolidateRecentHistory = async ({ limit = 12 } = {}) => {
  const bundle = await readGameStateBundle({ force: true });
  const events = getUnconsolidatedEvents(bundle.events, bundle.world).slice(0, limit);
  const chats = normalizeChats(bundle.chats).filter((chat) => chat.status === "closed").slice(0, limit);
  const { summary } = await consolidateHistoryBatch(bundle, events, chats);
  return summary;
};

export const createCatalyst = async ({ force = true } = {}) => {
  const bundle = await readGameStateBundle({ force });
  const variables = await buildTemplateVariables(bundle);
  const { payload } = await runJsonTask("catalystCreation", {
    fallback: () => ({
      choices: [
        "Intervene decisively",
        "Probe for weakness first",
        "Remain cautious and observe",
      ],
      opening: normalizeEvents(bundle.events).at(-1)?.description || "A turning point begins to unfold.",
      premise: normalizeEvents(bundle.events).at(-1)?.title || "A decisive moment takes shape.",
      title: normalizeEvents(bundle.events).at(-1)?.title || "Emerging Catalyst",
    }),
    userMessage: "Design the next catalyst scene as JSON only.",
    variables,
  });

  const catalyst = {
    choices: normalizeArray(payload?.choices).map((entry) => normalizeString(entry)).filter(Boolean).slice(0, 5),
    opening: normalizeString(payload?.opening),
    premise: normalizeString(payload?.premise),
    title: normalizeString(payload?.title),
  };

  const world = normalizeWorldState(await readWorldState({ force: true }));
  world.activeCatalyst = catalyst;
  await writeWorldState(world);
  return catalyst;
};

export const advanceActiveCatalyst = async (choiceText) => {
  beginSimulation();
  try {
  const bundle = await readGameStateBundle({ force: true });
  const baseColors = await readJson(JSON_URLS.colors, { defaultValue: {}, force: true });
  const world = normalizeWorldState(bundle.world);
  const catalyst = world.activeCatalyst;

  if (!catalyst) {
    throw new Error("No active catalyst is available.");
  }

  const catalystHistoryText = normalizeArray(catalyst.history)
    .map((entry) => `${entry.choice}: ${entry.summary}`)
    .join("\n");
  const variables = await buildTemplateVariables(bundle, {
    catalystChoice: choiceText,
    catalystHistory: catalystHistoryText,
    catalystOpening: catalyst.opening || "",
    catalystPremise: catalyst.premise || catalyst.title || "",
  });

  const { payload } = await runJsonTask("catalystExecutor", {
    fallback: () => {
      const resolved = normalizeArray(catalyst.history).length >= 1;
      const existingChoices = normalizeArray(catalyst.choices)
        .map((entry) => normalizeString(entry))
        .filter(Boolean);
      const distinctChoices = Array.from(
        new Map(existingChoices.map((choice) => [choice.toLocaleLowerCase(), choice])).values(),
      );
      const nextChoices = distinctChoices.length >= 2
        ? distinctChoices.slice(0, 5)
        : ["Press the advantage", "Reassess the situation"];
      return {
        nextChoices: resolved ? [] : nextChoices,
        resolved,
        summary: `${choiceText} becomes the line of action inside "${catalyst.title || "the scene"}", pushing the situation toward a definite outcome.`,
      };
    },
    userMessage: "Continue the catalyst scene as JSON only.",
    variables,
  });

  const historyEntry = {
    choice: choiceText,
    summary: normalizeString(payload?.summary),
  };

  const nextCatalyst = {
    ...catalyst,
    choices: normalizeArray(payload?.nextChoices).map((entry) => normalizeString(entry)).filter(Boolean).slice(0, 5),
    history: [...normalizeArray(catalyst.history), historyEntry],
    opening: normalizeString(payload?.summary) || catalyst.opening,
  };

  if (!payload?.resolved) {
    const nextWorld = {
      ...world,
      activeCatalyst: nextCatalyst,
    };
    await writeWorldState(nextWorld);
    return {
      catalyst: nextCatalyst,
      world: nextWorld,
    };
  }

  const summaryVariables = await buildTemplateVariables(bundle, {
    catalystHistory: [...normalizeArray(catalyst.history), historyEntry]
      .map((entry) => `${entry.choice}: ${entry.summary}`)
      .join("\n"),
    catalystPremise: catalyst.premise || catalyst.title || "",
  });
  const { generation: summaryGeneration, payload: summaryPayload } = await runJsonTask("catalystSummary", {
    fallback: () => ({
      description: historyEntry.summary,
      importance: "major",
      title: catalyst.title || "Catalyst resolved",
    }),
    userMessage: "Summarize the finished catalyst into one campaign event as JSON only.",
    variables: summaryVariables,
  });

  const catalystEvent = normalizeGeneratedEvent({
    date: bundle.game.gameDate,
    description: normalizeString(summaryPayload?.description),
    impacts: {
      createdChats: [],
      polityChanges: [],
      regionTransfers: [],
    },
    importance: normalizeString(summaryPayload?.importance) || "major",
    kind: "catalyst",
    notable: true,
    playerRelated: true,
    title: normalizeString(summaryPayload?.title) || catalyst.title || "Catalyst resolved",
    source: summaryGeneration.source,
  });

  return applySimulationResult({
    baseActions: bundle.actions,
    baseChats: bundle.chats,
    baseColors,
    baseEvents: bundle.events,
    baseGame: bundle.game,
    baseWorld: {
      ...bundle.world,
      activeCatalyst: null,
    },
    result: {
      catalyst: null,
      clearActions: false,
      events: catalystEvent ? [catalystEvent] : [],
      mode: "catalyst",
      stopDate: bundle.game.gameDate,
      summary: normalizeString(summaryPayload?.description) || historyEntry.summary,
      generation: summaryGeneration,
    },
  });
  } finally {
    endSimulation();
  }
};

// Event density per skip length (player-tuned): longer skips must return
// proportionally more events, and short ones must stay brief.
const eventCountRangeForDays = (days) => {
  if (days < 1) return [1, 1];   // sub-day skip (e.g. 6 hours)
  if (days <= 7) return [1, 2];
  if (days <= 31) return [5, 7];
  if (days <= 92) return [10, 13];
  if (days <= 184) return [19, 27];
  return [29, 37];
};

// Human-readable label for the skipped span, used in the AI prompt. Collapses
// whole-day counts into weeks/months/years where they divide evenly.
const formatDurationLabel = (days) => {
  if (days < 1) {
    const hours = Math.max(1, Math.round(days * 24));
    return `${hours} hour${hours === 1 ? "" : "s"}`;
  }
  const whole = Math.round(days);
  const pluralize = (n, unit) => `${n} ${unit}${n === 1 ? "" : "s"}`;
  if (whole % 365 === 0) return pluralize(whole / 365, "year");
  if (whole % 30 === 0) return pluralize(whole / 30, "month");
  if (whole % 7 === 0) return pluralize(whole / 7, "week");
  return pluralize(whole, "day");
};

export const simulateTimelineJump = async ({ days, mode = "jump", signal } = {}) => {
  beginSimulation();
  try {
  const bundle = await readGameStateBundle({ force: true });
  const baseColors = await readJson(JSON_URLS.colors, { defaultValue: {}, force: true });
  // Fractional days are allowed so sub-day skips (e.g. 6h = 0.25) work; the game
  // date only advances in whole days, so a sub-day skip keeps the same date.
  const safeDays = Math.max(0, Number(days) || 0);
  if (safeDays <= 0) {
    throw new Error("Choose a time-skip amount greater than zero.");
  }
  const dateStep = Math.max(0, Math.round(safeDays));
  // A note left over from a cancelled turn must not leak into this one.
  clearJumpInterventions();
  const jumpStartedAt = Date.now();
  reportJumpProgress("Simulating the turn…");
  const originDate = normalizeString(bundle.game.gameDate);
  const targetDate = dateStep >= 1 ? (addIsoDays(originDate, dateStep) || originDate) : originDate;
  if (dateStep >= 1 && parseIsoDate(originDate) && targetDate === originDate) {
    throw new Error("The requested jump exceeds the supported date range.");
  }
  const variables = await buildTemplateVariables(bundle, {
    targetDate,
    // What is already in the ground, so the model reports progress on a project
    // instead of founding a sixth version of it.
    constructionPipeline: buildPipelineText(bundle.world?.markers, {
      ownerCode: normalizeString(bundle.game?.country),
      date: originDate,
      // Victoria 3-style national capacity (the player's round-8 policy call):
      // slots derive from the player's own merged sheet, so investment that
      // moves GDP, industry or stability feeds the pace of construction.
      ...(() => {
        const capacity = constructionCapacity(mergeStatSheet(
          normalizeWorldState(bundle.world).countryStats?.[normalizeString(bundle.game?.country)],
          normalizeWorldState(bundle.world).countryStatChanges?.[normalizeString(bundle.game?.country)],
        ));
        return { capacity: capacity.slots, capacityWhy: capacity.why };
      })(),
    }),
    // What the LAST turn fell short of against this difficulty's share, so it
    // accumulates instead of being forgotten one turn at a time.
    setbackShortfall: Number(bundle.world?.setbackShortfall) || 0,
  });
  const durationLabel = formatDurationLabel(safeDays);
  let [minEvents, maxEvents] = eventCountRangeForDays(safeDays);
  // Guarantee at least one event per queued action, so each planned action has a
  // slot to resolve into (bounded so a huge queue can't demand absurd counts).
  const stalledOrders = normalizeActions(bundle.actions).filter((action) => isStalledOrder(action));
  if (stalledOrders.length > 0) {
    console.info(
      `[actions] ${stalledOrders.length} order(s) are stalled after failing twice and wait for the player (retry, edit, or delete): `
      + stalledOrders.map((action) => `${(action.title || action.text || "").slice(0, 28)}`).join("; "),
    );
  }
  const plannedQueue = activeOrders(bundle.actions);
  const plannedActionCount = plannedQueue.length;
  // SHORT alias ids for the prompt (A1, A2, …): the real queue ids are long
  // random strings ("action-0-ms68iq11-z1c1qzf") that local models reliably
  // fail to echo back — a captured turn narrated every action perfectly and
  // returned ZERO usable actionIds. Aliases round-trip; they are translated
  // back to the real ids before anything is applied.
  const aliasToReal = new Map();
  const realToAlias = new Map();
  plannedQueue.forEach((action, index) => {
    const alias = `A${index + 1}`;
    aliasToReal.set(alias.toLowerCase(), String(action.id));
    realToAlias.set(String(action.id), alias);
  });
  const aliasedCopy = (action) => ({ ...action, id: realToAlias.get(String(action.id)) ?? action.id });
  const resolveActionRef = (value) => {
    const raw = normalizeString(value).replace(/^\[?id:\s*/i, "").replace(/\]$/, "").trim();
    return aliasToReal.get(raw.toLowerCase()) ?? raw;
  };
  const translateActionIds = (candidate) => {
    // The verdict rows carry the SAME alias ids as actionIds and must get the
    // SAME translation. They did not: actionIds came back as real ids while
    // actionOutcomes kept "A7", so the apply step looked every verdict up by
    // real id in a map keyed by aliases — zero hits, ever, and each resolved
    // order fell back to the default clean success. On Impossible that read as
    // "0 of 18 came out less than cleanly, against 18 expected" with the
    // model's actual verdicts thrown away unread.
    const translateVerdictIds = (rows) => {
      if (!Array.isArray(rows)) return;
      for (const row of rows) {
        if (row && typeof row === "object" && row.id !== undefined) row.id = resolveActionRef(row.id);
      }
    };
    for (const event of normalizeArray(candidate?.events)) {
      if (Array.isArray(event?.impacts?.actionIds)) {
        event.impacts.actionIds = event.impacts.actionIds.map((id) => resolveActionRef(id));
      }
      translateVerdictIds(event?.impacts?.actionOutcomes);
    }
    translateVerdictIds(candidate?.actionOutcomes);
  };
  // Which queued-action ids does a candidate payload actually resolve?
  // (Aliases resolve to real ids before counting.)
  const collectCoveredActionIds = (candidate) => new Set(
    normalizeArray(candidate?.events)
      .flatMap((event) => normalizeArray(event?.impacts?.actionIds))
      .map((id) => String(resolveActionRef(id))),
  );
  // Stacked queues are clustered by domain and resolved one event per GROUP —
  // demanding one event per ACTION both dropped the queue's tail and inflated
  // the answer until it truncated. Small queues keep the per-action budget.
  const actionGroups = plannedActionCount >= 4 ? clusterPlannedActions(plannedQueue) : [];
  if (actionGroups.length > 0) {
    minEvents = Math.max(minEvents, actionGroups.length);
    maxEvents = Math.max(maxEvents, actionGroups.length * 2 + 4);
  } else if (plannedActionCount > minEvents) {
    minEvents = Math.min(plannedActionCount, 37);
    maxEvents = Math.max(maxEvents, minEvents + 3);
  }
  // The world gets its OWN budget on top of the action budget. Measured on a
  // live save: three consecutive turns produced 42, 27 and 36 events and EVERY
  // one of them was playerRelated — the queue's event allowance ate the whole
  // answer and the [World Activity] floor lost the competition for slots. A
  // separate quota, checked below, is what makes the rest of the planet move.
  // An auto-jump stops at the next notable moment and can cover only hours, so
  // it gets a floor of one rather than three — the point there is that the world
  // is present at all, not that it fills a quota.
  const worldEventQuota = mode === "auto" ? 1 : Math.max(3, Math.ceil(Math.max(actionGroups.length, 1) / 2));
  // Per-order world-change requirements, computed from the orders themselves so
  // the prompt can name them and the validator can check them one by one.
  const impactDuties = plannedQueue
    .map((action) => ({ action, fields: expectedImpactFields(action) }))
    .filter((duty) => duty.fields.length > 0);
  const impactDutyText = impactDuties
    .slice(0, 14)
    .map((duty) => {
      const alias = realToAlias.get(String(duty.action.id)) ?? duty.action.id;
      const needs = duty.fields
        .map((field) => ACTION_IMPACT_RULES.find((rule) => rule.field === field)?.requirement)
        .filter(Boolean);
      return `- [${alias}] ${duty.action.title} → needs ${needs.join(", and ")}`;
    })
    .join("\n");
  const countWorldEvents = (candidate) => normalizeArray(candidate?.events)
    .filter((event) => event?.playerRelated === false && event?.kind !== TIMELINE_ADVANCE_KIND).length;
  maxEvents += worldEventQuota;

  // The scenario's own schedule for the window this jump covers, plus anything
  // an earlier turn left unaccounted for. Handed to the model as material rather
  // than asked for from memory — see runtime/periodTimeline.js for why.
  //
  // A save's timeline is a COPY, so it goes stale: a campaign started before the
  // shipped file existed has none at all, and one started before a correction to
  // it keeps the mistake forever. Reconciling here — rather than at load — means
  // it happens exactly once per turn, on the one code path that already has the
  // world in hand and is about to write it back.
  const reseed = reconcileTimeline(bundle.world, originDate);
  const periodTimeline = reseed ? reseed.entries : normalizeTimeline(bundle.world?.periodTimeline);
  const periodTimelineSource = reseed ? reseed.source : null;
  if (reseed) {
    console.info(
      reseed.reason === SEED_REASONS.seeded
        ? `[timeline] this campaign had no schedule — seeded "${reseed.label}" (${reseed.entries.length} entries).`
        : `[timeline] "${reseed.label}" has been revised (${reseed.from} → ${reseed.source.revision}) — refreshed this save's copy to ${reseed.entries.length} entries.`,
    );
  }
  const timelineBacklog = normalizeTimeline(bundle.world?.timelineBacklog);
  const timelineDue = [
    ...timelineWindow(periodTimeline, originDate, targetDate),
    ...timelineBacklog,
  ];
  // A SCRIPTED FORK IS ROLLED BY THE ENGINE, ONCE PER CAMPAIGN. The source
  // presets phrase these as "select one at random" — an instruction the anchor
  // pilot measured the model obeying 0/6 naively and 4/6 under a mandate, and
  // a model-side roll would re-roll on every retry besides. So the engine
  // rolls when a fork entry first enters a jump window, remembers the result
  // in world.timelineBranchRolls (a save field — a replayed campaign rolls
  // fresh), and every consumer reads the same answer thereafter. Uniform pick:
  // every shipped fork today declares equal chances, and inventing weights
  // beyond the data would violate rule 6.
  const timelineBranchRolls = { ...(bundle.world?.timelineBranchRolls ?? {}) };
  let branchRollsDirty = false;
  for (const entry of timelineDue) {
    const branches = normalizeArray(entry.branches);
    if (branches.length === 0) continue;
    const stored = timelineBranchRolls[entry.id];
    if (Number.isInteger(stored) && stored >= 0 && stored < branches.length) continue;
    const rolled = Math.floor(Math.random() * branches.length);
    timelineBranchRolls[entry.id] = rolled;
    branchRollsDirty = true;
    // Rule 1: a decision the engine takes for the world is named out loud.
    console.info(`[timeline] 분기 롤: "${entry.title}" → ${branches[rolled].outcome}`);
  }
  const { kept: timelineEntries, dropped: timelineDropped } = selectTimelineEntries(timelineDue, 12);
  if (timelineDropped.length > 0) {
    // Never a silent truncation: what did not fit rides to the next turn.
    console.info(`[timeline] ${timelineDropped.length} scheduled entr(ies) did not fit this jump's prompt — carried to the next turn.`);
  }
  if (timelineEntries.length > 0) {
    console.info(`[timeline] ${timelineEntries.length} scheduled entr(ies) due ${originDate} → ${targetDate}${timelineBacklog.length ? ` (${timelineBacklog.length} outstanding from before)` : ""}.`);
  }
  // Each entry also gets a slot, the same way a queued order does: a turn that
  // has ten things to cover cannot report them in five events.
  if (timelineEntries.length > 0) {
    minEvents = Math.max(minEvents, Math.ceil(timelineEntries.length * 0.75));
    maxEvents = Math.max(maxEvents, minEvents + timelineEntries.length);
  }
  const aliasedGroups = actionGroups.map((group) => ({ ...group, actions: group.actions.map(aliasedCopy) }));
  const periodTimelineText = timelineEntries.length > 0
    ? buildTimelineText(timelineEntries, { playerPolity: variables.playerPolity, missed: timelineBacklog, branchRolls: timelineBranchRolls })
    : "";
  // THE STORIES THE WORLD HAS ALREADY BEEN GIVEN.
  //
  // Measured across this campaign's 36 world events: 사우디아라비아's
  // non-petroleum diversification was published six times, 러시아 극동 개발 six,
  // 중국 디지털 실크로드 seven. Fifteen of the thirty-six were retellings. The
  // model was not being disobedient — the general recent-events window is mixed
  // player and world, and a turn with a dozen player events pushes every world
  // headline out of it, so by the next turn it genuinely could not see what it
  // had already said.
  // TWENTY, NOT TWELVE. Twelve headlines reached back only to November on a
  // campaign running at four world events a month, and the stories that came back
  // in April — Russia's Far East corridor, China's Siberian energy link — had
  // their predecessors sitting just outside the window. Scored against them the
  // new tellings reach 0.333 at most, well under the 0.45 the repeat filter needs
  // and inside the range genuinely distinct events occupy, so similarity cannot
  // catch these; the only lever that works is showing the model what it has
  // already said. Twenty costs about 250 tokens of Korean against a 20,960 budget.
  const recentWorldTitles = normalizeArray(bundle.events)
    .filter((event) => event?.playerRelated === false && event?.kind !== TIMELINE_ADVANCE_KIND)
    .slice(-20)
    .map((event) => `- ${normalizeString(event?.date)} ${normalizeString(event?.title)}`)
    .filter((line) => line.trim().length > 2);
  const recentWorldText = recentWorldTitles.length > 0
    ? [
      "[Already Reported — Do Not Retell]",
      "These world events have already been published to the player in earlier periods:",
      ...recentWorldTitles,
      "",
      "Do not write any of them again, in any wording. A programme announced once is announced; the next thing worth reporting about it is a RESULT — it finished, it failed, it was cancelled, someone opposed it, it changed who holds what — and a result carries impacts. If a country has nothing new to report this period, write about a different country instead. The engine deletes an event that merely restates one of these, so a retelling costs the world a turn of news.",
    ].join("\n")
    : "";
  const WORLD_PASS_NO_ORDERS = "The player's own orders are already simulated for this period — ignore them entirely for this pass.";
  // The standings the diplomacy pass keeps (runtime/diplomacy.js), so the jump
  // narrates the world it is actually in instead of re-deriving the mood from
  // prose each turn.
  const standingRelationsText = buildRelationsText(bundle.world?.diplomaticRelations);
  const withTimeline = (base) => {
    let next = base;
    if (periodTimelineText) next = { ...next, periodTimelineText };
    if (recentWorldText) next = { ...next, recentWorldText };
    if (standingRelationsText) next = { ...next, standingRelations: standingRelationsText };
    return next;
  };
  const jumpVariables = withTimeline(aliasedGroups.length > 0
    ? { ...variables, plannedActions: buildGroupedActionsText(aliasedGroups) }
    : (plannedQueue.length > 0
        ? { ...variables, plannedActions: buildActionHistoryText(plannedQueue.map(aliasedCopy)) }
        : variables));
  // Required-scalar repair. Captured live: qwen3:14b returned 18 finished,
  // well-formed Korean events and simply skipped "summary" — one missing
  // one-line string failed the WHOLE payload ("$.summary is required"), forced
  // a retry, and the retry answered with a patch that had no events at all
  // ("$.events is required", the error the player actually saw). Every one of
  // these fields is derivable from the answer the model DID write, so derive
  // them instead of spending the turn on them.
  const repairJumpPayload = (candidate) => {
    if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) return;
    const events = normalizeArray(candidate.events);
    if (events.length === 0) return;
    if (!normalizeString(candidate.summary)) {
      const headlines = events
        .filter((event) => event?.notable)
        .concat(events)
        .map((event) => normalizeString(event?.title))
        .filter(Boolean);
      candidate.summary = [...new Set(headlines)].slice(0, 4).join(" / ")
        || `${originDate} → ${targetDate}`;
    }
    if (!normalizeString(candidate.stopDate)) {
      const dates = events.map((event) => normalizeString(event?.date)).filter(Boolean).sort();
      candidate.stopDate = dates[dates.length - 1] || targetDate;
    }
    if (typeof candidate.clearActions !== "boolean") candidate.clearActions = false;
  };
  const { generation, payload } = await runJsonTask(mode === "auto" ? "autoJumpForward" : "jumpForward", {
    fallback: () => fallbackJumpSimulation({ bundle, days: dateStep || 1, mode, targetDate }),
    repairPayload: repairJumpPayload,
    signal,
    // The jump IS the game — by default generation waits as long as the model
    // needs (0 disables the deadline in runJsonTask), so the canned fallback is
    // only reachable through a real error, never a slow local/reasoning model.
    // The "Limit AI generation" toggle opts back into a 5-minute bound for
    // players who prefer a guaranteed turn over a guaranteed answer (Cancel
    // works either way).
    timeoutMs: getMapSetting(MAP_SETTING_KEYS.limitAiGeneration) ? 300000 : 0,
    userMessage:
      (mode === "auto"
        ? "Simulate an auto-jump and stop at the next notable or player-relevant event. Return JSON only. " +
          "Scale the events array to the time actually covered before your stop point: roughly 1-2 events per week, " +
          "5-7 per month, 10-13 per quarter, up to 29-37 for a full year — spread their dates across the covered period."
        : `Simulate a standard jump forward to the requested target date. Return JSON only. The "events" array must ` +
          `contain between ${minEvents} and ${maxEvents} events (this jump covers ${durationLabel}), with their dates ` +
           `spread across the skipped period.`) +
      ` At least ${worldEventQuota} of those events must be WORLD events — other polities acting on their own, with ` +
      `"playerRelated": false and "kind": "world", and no involvement from the player at all. ` +
      (aliasedGroups.length > 0
        ? `\n\nThe player's orders arrive already sorted into ${aliasedGroups.length} labelled groups. Resolve them GROUP BY GROUP: each ` +
          `group needs at least one event that carries it out and lists EVERY id in that group in impacts.actionIds — one well-written event ` +
          `can execute several related orders at once, which is the point of the grouping. Work through all ${aliasedGroups.length} groups in ` +
          `this answer; do not stop after the first few. `
        : "") +
      (impactDutyText
        ? `\n\nThese queued orders physically change the world, so the events that carry them out MUST carry the matching ` +
          `impacts — an order carried out with an empty "impacts" object leaves the map and the country sheet untouched, ` +
          `which is the same as it never happening:\n${impactDutyText}\n\n`
        : "") +
      // Named explicitly because the omission is silent and expensive: the
      // model writes every event perfectly and then skips "summary".
      `Your answer MUST contain ALL FOUR of these top-level fields, every time: "events", "summary" (one or two ` +
      `sentences on the period), "stopDate", and "clearActions". An answer missing any of them is rejected. If you are ` +
      `ever asked to correct an answer, resend the WHOLE object with every field, never just the corrected part.`,
    validatePayload: async (candidate, { finalAttempt } = {}) => {
      // Shape-of-story problems (event count, stray dates) are STRICT while a
      // retry remains — the model gets the exact error and usually fixes its
      // own answer — and SALVAGED on the final attempt: a finished generation
      // must never lose to the canned fallback over its date stamps, an extra
      // event, or an invented region name. finalAttempt comes from runJsonTask
      // itself (never from counting our own invocations — a schema failure on
      // attempt 1 skips this validator entirely, which used to make attempt 2
      // look "first" and leak strict feedback out as the fallback reason).
      const strict = !finalAttempt;
      const eventCount = normalizeArray(candidate?.events).length;
      if (strict && mode !== "auto" && (eventCount < minEvents || eventCount > maxEvents)) {
        return `$.events must contain between ${minEvents} and ${maxEvents} events; received ${eventCount}.`;
      }
      const dateError = validateTimelineDates({ candidate, mode, originDate, targetDate, requireAdvance: dateStep >= 1 });
      if (dateError) {
        if (strict) return dateError;
        clampTimelineDates(candidate, { mode, originDate, targetDate });
      }
      // Long-queue coverage (strict phase): the model habitually executes the
      // first few stacked actions and drops the tail — exactly the original
      // game's failure this project set out to fix. Demand ids for the
      // uncovered ones while a retry remains; the supplemental pass below
      // mops up whatever still slips through.
      // The world must actually move. Checked in the strict phase only, so a
      // finished turn is never thrown away over it — if the retry still comes
      // back player-only, the dedicated world pass below fills the gap.
      if (strict) {
        const worldEvents = countWorldEvents(candidate);
        if (worldEvents < worldEventQuota) {
          return `Only ${worldEvents} of the ${eventCount} events are world events; at least ${worldEventQuota} are required. ` +
            `Add events in which OTHER polities act entirely on their own — no involvement from ${bundle.game.country} — ` +
            `each with "playerRelated": false and "kind": "world", naming the polity that acts and grounded in what was ` +
            `really happening in this period. Keep the events you already wrote.`;
        }
      }
      // A whole month of a busy queue that changes NOTHING on the map is not a
      // simulation, it is a press release. Measured: 105 consecutive events
      // carried zero regionTransfers, unitOps, markerOps, polityChanges and
      // createdChats between them. Strict phase only, and only when the turn is
      // big enough that "nothing happened anywhere" is implausible.
      // Do the orders that physically change something actually change it? This
      // is checked per order against the duty list the prompt was given, so the
      // correction can name exactly what is missing rather than asking for
      // "impacts" in the abstract. Strict phase only — a finished turn is never
      // thrown away over it.
      if (strict && impactDuties.length > 0) {
        const delivered = new Set();
        for (const event of normalizeArray(candidate?.events)) {
          const impacts = event?.impacts;
          if (!impacts || typeof impacts !== "object") continue;
          const ids = normalizeArray(impacts.actionIds).map((id) => String(resolveActionRef(id)));
          for (const field of ["markerOps", "unitOps", "polityChanges", "createdChats", "regionTransfers"]) {
            if (normalizeArray(impacts[field]).length === 0) continue;
            for (const id of ids) delivered.add(`${id}|${field}`);
          }
        }
        const missing = impactDuties.flatMap((duty) => duty.fields
          .filter((field) => !delivered.has(`${String(duty.action.id)}|${field}`))
          .map((field) => ({ duty, field })));
        // A little slippage is tolerable; a turn where nothing at all landed is not.
        if (missing.length > Math.floor(impactDuties.length * 0.4)) {
          const listing = missing.slice(0, 8).map(({ duty, field }) =>
            `[${realToAlias.get(String(duty.action.id)) ?? duty.action.id}] ${duty.action.title} → ${field}`).join("; ");
          return `${missing.length} of the orders that physically change the world were carried out with no matching impact, ` +
            `so the map and the country sheet still show nothing. Keep the events you wrote and add the missing impacts to the ` +
            `event that covers each order (the event must also list that order's id in impacts.actionIds): ${listing}.`;
        }
      }
      // Everything the turn builds must not land on the same spot. Field report:
      // structures raised by different orders all appeared stacked in one place,
      // because the model reuses the first coordinate it wrote (usually the
      // capital's) for every later marker and unit.
      if (strict) {
        const places = [];
        for (const event of normalizeArray(candidate?.events)) {
          for (const op of normalizeArray(event?.impacts?.markerOps)) {
            const lng = Number(op?.marker?.lng ?? op?.lng);
            const lat = Number(op?.marker?.lat ?? op?.lat);
            if (Number.isFinite(lng) && Number.isFinite(lat)) places.push({ lat, lng, name: normalizeString(op?.marker?.name ?? op?.name) });
          }
          for (const op of normalizeArray(event?.impacts?.unitOps)) {
            const lng = Number(op?.unit?.lng ?? op?.toLng);
            const lat = Number(op?.unit?.lat ?? op?.toLat);
            if (Number.isFinite(lng) && Number.isFinite(lat)) places.push({ lat, lng, name: normalizeString(op?.unit?.name) });
          }
        }
        // ~0.05° is a few kilometres: same city block, not "the same city".
        const clustered = places.filter((place, index) => places
          .slice(0, index)
          .some((prior) => Math.abs(prior.lat - place.lat) < 0.05 && Math.abs(prior.lng - place.lng) < 0.05));
        if (places.length >= 3 && clustered.length > Math.floor(places.length / 2)) {
          return `${clustered.length} of the ${places.length} things this turn puts on the map share the same coordinates, so they all stack on one spot. ` +
            `Give each structure and each force the coordinates of where it ACTUALLY is — spread them across the regions and cities the orders name, ` +
            `using the [City Coordinates] list. Only things genuinely in the same place may share a position.`;
        }
      }
      if (strict && plannedQueue.length >= 4) {
        const covered = collectCoveredActionIds(candidate);
        const uncovered = plannedQueue.filter((action) => !covered.has(String(action.id)));
        if (uncovered.length > Math.ceil(plannedQueue.length * 0.3)) {
          const listing = uncovered.slice(0, 12).map((action) => `[id: ${realToAlias.get(String(action.id)) ?? action.id}] ${action.title}`).join("; ");
          return `Only ${plannedQueue.length - uncovered.length} of the player's ${plannedQueue.length} queued actions were covered. ` +
            `Every queued action must be executed, attempted, or frustrated by an event listing its id in impacts.actionIds. ` +
            `Still uncovered: ${listing}. Add events (or extend existing ones) covering them.`;
        }
      }
      return await validateGeneratedWorldChanges(candidate, bundle.world, { strictTransfers: strict });
    },
    variables: jumpVariables,
  });

  // Supplemental coverage passes: whatever queued actions the main generation
  // left uncovered get their OWN generation over the same period, scoped to
  // just them. Tokens are the player's own GPU here — spending another call to
  // honor the back half of a long queue is the entire point (the original
  // game's stacked actions kept losing their tail). Bounded to 2 passes; an
  // action still uncovered after that stays QUEUED (clearActions is forced
  // false below so nothing silently resolves it).
  translateActionIds(payload);
  let mergedEvents = normalizeArray(payload?.events);
  let mergedOutreach = normalizeArray(payload?.diplomaticOutreach);
  const tagEventWithAction = (event, actionId) => {
    if (!event.impacts || typeof event.impacts !== "object") event.impacts = {};
    if (!Array.isArray(event.impacts.actionIds)) event.impacts.actionIds = [];
    if (!event.impacts.actionIds.some((id) => String(id) === String(actionId))) {
      event.impacts.actionIds.push(String(actionId));
    }
  };
  const coveredActionIds = () => new Set(
    mergedEvents.flatMap((event) => normalizeArray(event?.impacts?.actionIds)).map((id) => String(id)),
  );
  const uncoveredActions = () => {
    const covered = coveredActionIds();
    return plannedQueue.filter((action) => !covered.has(String(action.id)));
  };

  // Narrative matching: a model that clearly NARRATES an order but omits its id
  // still resolves it — if an event's text is about the order, tag that event
  // with the order's real id. This is the captured failure exactly ("한국은 해병
  // 부대 강화를 시행하여 …" with an empty actionIds list — 18 events, 0 ids).
  // Character-bigram containment rather than substring, because Korean inflects
  // at the end of a word and the event almost never repeats the queue's phrasing
  // verbatim; see ./actionCoverage.js. It runs BEFORE anything paid, and again
  // after each paid pass: matching is free, a generation is minutes.
  const applyNarrativeCoverage = ({
    events = mergedEvents,
    actions = null,
    minScore = undefined,
    requireDomain = false,
    label = "narrative",
  } = {}) => {
    const pending = actions ?? uncoveredActions();
    let matched = 0;
    for (const action of pending) {
      const best = bestEventForAction(action, events, { minScore, requireDomain });
      if (!best) continue;
      tagEventWithAction(best.event, action.id);
      matched += 1;
    }
    if (matched > 0) console.info(`[actions] ${label} matching resolved ${matched} order(s) the model left untagged.`);
    return matched;
  };

  // The paid bookkeeping pass. Local models write the events and then forget the
  // ids inside them — the failure is not comprehension, it is that actionIds is
  // one small field buried in a large nested payload the model is already
  // straining to finish. Asked ON ITS OWN, with the events already written and
  // nothing else to do, the same model answers correctly, and it is a SMALL call
  // (a numbered list of titles in, a list of numbers out) where a supplemental
  // generation is a full multi-minute turn. So this runs first and the expensive
  // coverage passes below only handle what it could not place.
  const runCoverageMapping = async (candidateEvents, pendingActions, passLabel) => {
    const events = candidateEvents.filter((event) => event?.kind !== TIMELINE_ADVANCE_KIND);
    if (events.length === 0 || pendingActions.length === 0) return 0;
    const numbered = events
      .map((event, index) => `${index + 1}. ${normalizeString(event?.title) || "(untitled)"} — ${normalizeString(event?.description).slice(0, 220)}`)
      .join("\n");
    const orders = pendingActions
      .map((action) => `[${realToAlias.get(String(action.id)) ?? action.id}] ${normalizeString(action.title) || buildActionDisplayText(action).slice(0, 100)}`)
      .join("\n");
    try {
      const { payload: mapPayload } = await runJsonTask("actionCoverage", {
        signal,
        // Hard-bounded on purpose, unlike the jump itself: this is bookkeeping.
        // If it cannot answer in two minutes the orders simply stay queued, which
        // is exactly where they already were.
        timeoutMs: 120000,
        userMessage:
          `Events generated this turn:\n${numbered}\n\nThe player's queued orders still unaccounted for:\n${orders}\n\n` +
          `For each order, name the event number that carried it out. Omit any order no event carried out. Return JSON only.`,
        variables: { playerPolity: variables.playerPolity, language: variables.language },
      });
      let matched = 0;
      for (const assignment of normalizeArray(mapPayload?.assignments)) {
        const index = Number(assignment?.eventNumber) - 1;
        const event = events[index];
        if (!event) continue;
        for (const rawId of normalizeArray(assignment?.actionIds)) {
          const realId = String(resolveActionRef(rawId));
          // Only ids we actually asked about: a model that echoes an id from an
          // earlier turn, or invents one, must not clear anything.
          if (!pendingActions.some((action) => String(action.id) === realId)) continue;
          tagEventWithAction(event, realId);
          matched += 1;
        }
      }
      console.info(`[actions] coverage mapping (${passLabel}) resolved ${matched} of ${pendingActions.length} untagged order(s).`);
      return matched;
    } catch (error) {
      // Bookkeeping is best-effort: a failure here leaves orders queued, never
      // breaks the turn the player just waited minutes for.
      console.warn(`[actions] coverage mapping (${passLabel}) failed; falling back to matching only.`, error);
      return 0;
    }
  };

  // THE MODEL NAMES ORDERS IN THE PROSE INSTEAD OF THE FIELD.
  //
  // Short aliases (A1, A2, …) were introduced because the real queue ids are long
  // random strings that local models cannot echo back. They round-trip — and they
  // are also short and quotable enough that the model started writing them into
  // the sentence rather than into impacts.actionIds. Captured verbatim:
  //
  //   "… 통합 메시지를 대중에게 전달하는 청년 지원 정책(A1, A3, A12)을 전격 발표했습니다."
  //
  // with only two ids in the field. Across one campaign, twelve events carried
  // aliases in their text and every one of them listed FEWER ids in the field than
  // it named in the prose. The orders were carried out, narrated, and still sat in
  // the queue afterwards, which reads to the player as being ignored.
  //
  // So the aliases are harvested out of the text, and then removed from it: they
  // are engine bookkeeping and have no business in the timeline the player reads.
  // Only aliases this turn actually issued are recognised, so a stray "A1" from
  // some other context cannot resolve anything.
  const ALIAS_IN_PROSE = /\bA(\d{1,3})\b/g;
  // Which orders each event NAMED in its own text. Recorded before the aliases are
  // stripped out, because the claim check later needs to know — an order the model
  // pointed at by name inside a sentence is corroborated by that sentence, however
  // little vocabulary the two happen to share.
  const namedInProse = new Map();
  // Every player-facing string an event carries. The ids turn up in all of them —
  // a marker's note read "A5 및 A1을 결합한 바이오 데이터 보호 구역" on the live
  // map, which is bookkeeping printed in a popup the player clicks — so all of
  // them are harvested from and all of them are cleaned.
  const proseFieldsOf = (event) => {
    const fields = [[event, "title"], [event, "description"]];
    for (const op of normalizeArray(event?.impacts?.markerOps)) {
      for (const holder of [op, op?.marker].filter(Boolean)) fields.push([holder, "note"], [holder, "name"]);
    }
    for (const op of normalizeArray(event?.impacts?.unitOps)) fields.push([op, "note"]);
    return fields.filter(([holder, field]) => normalizeString(holder?.[field]));
  };

  // Taking "A5" out of "A5 및 A1을 결합한 …" leaves "을 결합한 …", because the
  // particle was attached to the id and Korean particles attach to the word
  // before them. A dangling leading particle is not a sentence, so it goes too —
  // and only ever here, where something was just removed from the front.
  const LEADING_PARTICLE = /^(?:으로|에서|에게|부터|까지|을|를|이|가|은|는|에|의|와|과|및|로)(?=\s)\s*/;
  const stripAliasIds = (value) => {
    let next = normalizeString(value)
      .replace(/[([]\s*A\d{1,3}(?:\s*[,·/]\s*A\d{1,3})*\s*[)\]]/g, "")
      .replace(/\bA\d{1,3}\b/g, "")
      .replace(/\(\s*\)|\[\s*\]/g, "")
      .replace(/\s{2,}/g, " ")
      .replace(/\s+([,.;:!?])/g, "$1")
      .trim();
    if (next === normalizeString(value)) return next;
    // At most a few, so a malformed string cannot spin here.
    for (let round = 0; round < 3; round += 1) {
      const trimmed = next.replace(/^[\s,.;:·/-]+/, "").replace(LEADING_PARTICLE, "");
      if (trimmed === next) break;
      next = trimmed;
    }
    return next.trim();
  };

  // MACHINE SYNTAX IN PLAYER-FACING PROSE.
  //
  // Two leaks, both new and both measured over all 840 prose fields this campaign
  // carries — one of each, so this is a tidy rather than a flood, but both are
  // the kind that recurs and neither is anything a reader should ever see.
  //
  // 1. A JSON SCAR. One title came out as
  //      핵심 반도체 클러스터에 대한 강력한 보안 조치",[actionIds
  //    The payload was malformed and the lenient parser recovered it by treating
  //    the structure that followed as string content — which is the parser doing
  //    its job (the alternative was losing the turn) and leaving a scar behind.
  //    Cut only where a quote is followed by JSON punctuation and then the END of
  //    the string: '그는 "가자",라고 말했다' is ordinary Korean and survives,
  //    because Hangul follows the comma rather than the string ending there.
  //
  // 2. A REGION ID IN PARENTHESES. Two descriptions read 강원(KOR.6_1) and
  //    경기로(KOR.8_1) 및 인천(KOR.11_1). The id is how the engine keys a region
  //    and means nothing to a player; the province name in front of it already
  //    says everything the sentence needs.
  // The patterns live in runtime/machineSyntax.js now — a second consumer
  // appeared (the action normalizer, for orders whose title and body were fused)
  // and two copies of a regex that decides what a player reads is one too many.


  const scrubMachineSyntax = () => {
    let cleaned = 0;
    const samples = [];
    for (const event of mergedEvents) {
      for (const [holder, field] of proseFieldsOf(event)) {
        const before = normalizeString(holder[field]);
        const after = stripMachineSyntax(before);
        if (after === before) continue;
        holder[field] = after;
        cleaned += 1;
        if (samples.length < 4) samples.push(`${before.slice(-42)} → ${after.slice(-42)}`);
      }
    }
    if (cleaned > 0) {
      console.info(`[events] took the model's own syntax back out of ${cleaned} player-facing string(s):`, samples);
    }
  };

  const harvestAliasesFromProse = () => {
    let harvested = 0;
    for (const event of mergedEvents) {
      const fields = proseFieldsOf(event);
      const text = fields.map(([holder, field]) => normalizeString(holder[field])).join(" ");
      const found = new Set();
      for (const match of text.matchAll(ALIAS_IN_PROSE)) {
        const real = aliasToReal.get(`a${match[1]}`);
        if (real) found.add(real);
      }
      if (found.size === 0) continue;
      const already = namedInProse.get(event) ?? new Set();
      for (const id of found) {
        already.add(String(id));
        const before = normalizeArray(event?.impacts?.actionIds).length;
        tagEventWithAction(event, id);
        if (normalizeArray(event.impacts.actionIds).length > before) harvested += 1;
      }
      namedInProse.set(event, already);
      // Strip the bookkeeping out of the player-facing text now that it is
      // recorded where it belongs, and tidy the empty brackets it leaves behind.
      // A name is only rewritten if something survives — an id was never the
      // whole name, and a marker with no name at all is dropped downstream.
      for (const [holder, field] of fields) {
        const cleaned = stripAliasIds(holder[field]);
        if (cleaned && cleaned !== normalizeString(holder[field])) holder[field] = cleaned;
      }
    }
    if (harvested > 0) {
      console.info(`[actions] recovered ${harvested} order id(s) the model wrote into the event text instead of impacts.actionIds.`);
    }
  };

  harvestAliasesFromProse();
  applyNarrativeCoverage();
  if (generation?.source === "ai") {
    const pending = uncoveredActions();
    if (pending.length > 0) await runCoverageMapping(mergedEvents, pending, "main");
  }
  if (generation?.source === "ai" && plannedQueue.length >= 4) {
    // Bounded at 2 passes, and only for a leftover worth another full
    // generation. An earlier version ground on until the queue hit exactly
    // zero — with a 31-action queue and a model that never writes actionIds by
    // itself, that meant up to ten model calls and a turn that looked hung for
    // a quarter of an hour. Leftovers ride to the next turn instead, which is
    // what the queue is for; the clock is no longer waiting on them.
    for (let pass = 1; pass <= 2; pass += 1) {
      const uncovered = uncoveredActions();
      if (uncovered.length < 3) break;
      if (Date.now() - jumpStartedAt > EXTRA_PASS_BUDGET_MS) {
        console.warn(`[actions] ${uncovered.length} action(s) left uncovered, but this turn has already run long — they stay queued.`);
        break;
      }
      reportJumpProgress(`Covering queued actions (pass ${pass} of 2)…`);
      // The ceiling used to be `uncovered + 2`, which reads as an invitation to
      // write one event per action — and the model took it. A queue of sixteen
      // produced seventeen supplemental events on top of the main pass's own, and
      // the turn came out at 35 events where a normal one has 16. One event can
      // carry many actionIds, so ask for FEWER events covering the same ground.
      const supMin = Math.max(1, Math.ceil(uncovered.length / 4));
      const supMax = Math.max(supMin, Math.min(8, Math.ceil(uncovered.length / 2)));
      try {
        const { generation: supGeneration, payload: supPayload } = await runJsonTask(mode === "auto" ? "autoJumpForward" : "jumpForward", {
          // Same missing-scalar repair the main generation gets: a top-up pass
          // that writes good events and forgets "summary" must not be thrown away.
          repairPayload: repairJumpPayload,
          signal,
          timeoutMs: getMapSetting(MAP_SETTING_KEYS.limitAiGeneration) ? 300000 : 0,
          userMessage:
            `SUPPLEMENTAL PASS for the SAME period (${originDate} → ${targetDate}): the main simulation of this jump is already done. ` +
            `Generate ONLY the events that execute, attempt, or frustrate the player's remaining queued actions listed in the context — ` +
            `no unrelated world events, no restating what already happened. Between ${supMin} and ${supMax} events TOTAL — ` +
            `GROUP the remaining actions: orders that belong to one effort (the same programme, the same front, the same negotiation) ` +
            `resolve together in ONE event whose impacts.actionIds lists all of their ids. Every listed action must appear in some ` +
            `event's actionIds, but they must NOT get an event each. Return JSON only.`,
          validatePayload: async (candidate, { finalAttempt } = {}) => {
            const dateError = validateTimelineDates({ candidate, mode, originDate, targetDate, requireAdvance: false });
            if (dateError) {
              if (!finalAttempt) return dateError;
              clampTimelineDates(candidate, { mode, originDate, targetDate });
            }
            if (!finalAttempt) {
              const covered = collectCoveredActionIds(candidate);
              const still = uncovered.filter((action) => !covered.has(String(action.id)));
              if (still.length > Math.ceil(uncovered.length * 0.3)) {
                const listing = still.slice(0, 12).map((action) => `[id: ${realToAlias.get(String(action.id)) ?? action.id}] ${action.title}`).join("; ");
                return `This supplemental pass must cover the remaining queued actions. Still uncovered: ${listing}.`;
              }
            }
            return await validateGeneratedWorldChanges(candidate, bundle.world, { strictTransfers: !finalAttempt });
          },
          variables: {
            ...variables,
            plannedActions: buildActionHistoryText(uncovered.map(aliasedCopy)),
          },
        });
        translateActionIds(supPayload);
        const supEvents = normalizeArray(supPayload?.events);
        if (supGeneration?.source !== "ai" || supEvents.length === 0) break;
        mergedEvents = [...mergedEvents, ...supEvents];
        mergedOutreach = [...mergedOutreach, ...normalizeArray(supPayload?.diplomaticOutreach)];
        harvestAliasesFromProse();
        applyNarrativeCoverage();
        // These events exist for NOTHING but the orders in `uncovered`, so what is
        // left over gets three progressively cheaper attempts to be placed against
        // them — the paid mapping call, then bigram matching at a lower bar with
        // the domains required to agree (a mobilisation order cannot be cleared by
        // an event about a trade deal). Anything still unplaced stays queued: this
        // engine would rather hand an order back to the player than pretend a
        // vaguely related paragraph carried it out.
        let stillPending = uncovered.filter((action) => !coveredActionIds().has(String(action.id)));
        if (stillPending.length > 0) {
          await runCoverageMapping(supEvents, stillPending, `supplemental ${pass}`);
          stillPending = uncovered.filter((action) => !coveredActionIds().has(String(action.id)));
        }
        if (stillPending.length > 0) {
          applyNarrativeCoverage({
            events: supEvents,
            actions: stillPending,
            minScore: SUPPLEMENTAL_MATCH_MIN,
            requireDomain: true,
            label: `supplemental ${pass} domain`,
          });
        }
        const resolvedHere = uncovered.length - uncovered.filter((action) => !coveredActionIds().has(String(action.id))).length;
        console.info(`[actions] supplemental pass ${pass}: ${supEvents.length} event(s) resolved ${resolvedHere} of ${uncovered.length} leftover queued action(s).`);
      } catch (error) {
        // No fallback for a supplemental pass — uncovered actions simply stay queued.
        console.warn("[actions] supplemental coverage pass failed; leftover actions stay queued.", error);
        break;
      }
    }
  }
  harvestAliasesFromProse();
  // AFTER THE LAST HARVEST, not the first. There are three: the main generation,
  // the supplemental passes, and this one — and the supplemental passes add
  // events of their own, so a scrub wired to the first call never sees them.
  scrubMachineSyntax();
  applyNarrativeCoverage();

  // AN EVENT THAT CARRIES OUT THE PLAYER'S ORDER IS NOT A WORLD EVENT.
  //
  // From the live campaign: "K-Shield 기반 해상 안보 및 물류 허브 강화", labelled
  // playerRelated:false and kind:"world", opening "대한민국은 동남아 파트너들과
  // 협력하여…" and carrying two of the player's queued order ids. The world-event
  // quota counted it, so a turn can reach its quota without the world doing
  // anything, and the "already reported" list would hand the player's own
  // programmes back as world news. Resolving an order is the definition of
  // player-related, so this needs no judgement — the actionIds decide it.
  const relabelPlayerWork = () => {
    const relabelled = [];
    for (const event of mergedEvents) {
      if (event?.kind === TIMELINE_ADVANCE_KIND) continue;
      if (normalizeArray(event?.impacts?.actionIds).length === 0) continue;
      if (event.playerRelated === false || event.kind === "world") {
        relabelled.push(normalizeString(event.title));
        event.playerRelated = true;
        if (event.kind === "world") event.kind = "player";
      }
    }
    if (relabelled.length > 0) {
      console.info(
        `[events] ${relabelled.length} event(s) claimed to be world events while carrying out the player's orders — relabelled:`,
        relabelled,
      );
    }
  };
  relabelPlayerWork();

  // World pass. If the main generation (and its corrective retry) still came
  // back with the player as the only thing happening on the planet, buy the
  // world its own generation — scoped to other polities only, with the action
  // queue deliberately withheld so the model cannot anchor on it again. Costs a
  // call ONLY on turns that would otherwise have been player-only.
  if (generation?.source === "ai") {
    const worldSoFar = mergedEvents.filter((event) => event?.playerRelated === false && event?.kind !== TIMELINE_ADVANCE_KIND).length;
    if (worldSoFar < worldEventQuota && Date.now() - jumpStartedAt <= EXTRA_PASS_BUDGET_MS) {
      const missing = worldEventQuota - worldSoFar;
      reportJumpProgress("Bringing the rest of the world in…");
      try {
        const { generation: worldGeneration, payload: worldPayload } = await runJsonTask(mode === "auto" ? "autoJumpForward" : "jumpForward", {
          repairPayload: repairJumpPayload,
          signal,
          timeoutMs: getMapSetting(MAP_SETTING_KEYS.limitAiGeneration) ? 300000 : 0,
          userMessage:
            `WORLD PASS for the SAME period (${originDate} → ${targetDate}): the player's own turn is already simulated and must NOT be repeated. ` +
            `Generate ONLY events in which polities OTHER than ${bundle.game.country} act on their own initiative, with no involvement from ` +
            `${bundle.game.country} whatsoever — rival maneuvering, wars and fronts moving elsewhere, elections, coups, treaties, disasters, ` +
            `economic and technological shifts. Where the scenario is historical, use what was really happening in these exact months in the ` +
            `regions this map contains. Between ${missing} and ${missing + 4} events, EVERY one with "playerRelated": false and "kind": "world", ` +
            `each naming the polity that acts, and carrying its own impacts where something actually changes. Return JSON only.`,
          validatePayload: async (candidate, { finalAttempt } = {}) => {
            const dateError = validateTimelineDates({ candidate, mode, originDate, targetDate, requireAdvance: false });
            if (dateError) {
              if (!finalAttempt) return dateError;
              clampTimelineDates(candidate, { mode, originDate, targetDate });
            }
            if (!finalAttempt) {
              const playerEvents = normalizeArray(candidate?.events).filter((event) => event?.playerRelated !== false);
              if (playerEvents.length > 0) {
                return `${playerEvents.length} of these events are still marked as player-related. This pass must contain ONLY ` +
                  `events with "playerRelated": false, about polities other than ${bundle.game.country}.`;
              }
            }
            return await validateGeneratedWorldChanges(candidate, bundle.world, { strictTransfers: !finalAttempt });
          },
          // ONLY the already-reported list — NOT the schedule. Handing this pass
          // `withTimeline` was a regression: it carries periodTimelineText too, so
          // the world pass received the same scheduled entries the main generation
          // had already written and told one of them a second time. Measured on
          // 2017-03-10, which came out twice in one turn — "헌법재판소, 대통령 탄핵
          // 결정 및 비상 정부 체제 전환" and "대한민국 헌법재판소, 박근혜 대통령
          // 파면 결정". The main generation owns the timeline and the backlog
          // carries anything it misses; this pass only needs to know what the
          // world has already been reported as doing.
          variables: recentWorldText
            ? { ...variables, plannedActions: WORLD_PASS_NO_ORDERS, recentWorldText }
            : { ...variables, plannedActions: WORLD_PASS_NO_ORDERS },
        });
        // Only events that really are about someone else are kept, whatever the
        // model labelled them: this pass exists to add the rest of the world.
        const worldEvents = normalizeArray(worldPayload?.events)
          .filter((event) => event?.playerRelated === false);
        if (worldGeneration?.source === "ai" && worldEvents.length > 0) {
          mergedEvents = [...mergedEvents, ...worldEvents];
          mergedOutreach = [...mergedOutreach, ...normalizeArray(worldPayload?.diplomaticOutreach)];
          console.info(`[events] world pass added ${worldEvents.length} independent world event(s).`);
        }
      } catch (error) {
        console.warn("[events] world pass failed; the turn keeps whatever world events it already had.", error);
      }
    }
  }
  // What actually landed this turn, logged so the next tuning pass is a
  // measurement rather than a guess. "0 world change(s)" in the console is the
  // clearest possible signal that the world is being narrated, not changed.
  {
    const tally = { createdChats: 0, markerOps: 0, polityChanges: 0, regionTransfers: 0, unitOps: 0 };
    for (const event of mergedEvents) {
      for (const field of Object.keys(tally)) tally[field] += normalizeArray(event?.impacts?.[field]).length;
    }
    const total = Object.values(tally).reduce((sum, count) => sum + count, 0);
    const breakdown = Object.entries(tally).filter(([, count]) => count > 0)
      .map(([field, count]) => `${field} ${count}`).join(", ");
    console.info(`[world] ${mergedEvents.length} events → ${total} world change(s)${breakdown ? `: ${breakdown}` : ""}; `
      + `${impactDuties.length} order(s) were expected to change something.`);
  }
  // Echo filter. Last line of defence against the same beat being told twice:
  // an event whose title repeats one from the recent chronicle (or an earlier
  // event in this very turn) and that changes NOTHING — no transfers, no unit
  // or marker ops, no polity changes, no chat, no queued action resolved — is
  // pure retelling, so it is dropped. Anything that touches the world is always
  // kept, however familiar it reads: a second round of the same offensive is a
  // real event, and losing it would lose the map change with it.
  {
    const squash = (value) => normalizeString(value).toLowerCase().replace(/\s+/g, "").replace(/[.,!?"'()[\]·—–-]/g, "");
    const changesTheWorld = (event) => {
      const impacts = event?.impacts;
      if (!impacts || typeof impacts !== "object") return false;
      return ["actionIds", "regionTransfers", "unitOps", "markerOps", "polityChanges", "createdChats"]
        .some((key) => normalizeArray(impacts[key]).length > 0);
    };
    // Same direction bug as the loop filter below: oldest-first store, so this
    // was checking the newest events against the campaign's opening months. On
    // the live save its window ended at 2016-04-28 while the turn being written
    // was December.
    const priorTitles = normalizeArray(bundle.events)
      .slice(-60)
      .map((event) => squash(event?.title))
      .filter((title) => title.length >= 4);
    const kept = [];
    let dropped = 0;
    for (const event of mergedEvents) {
      if (event?.kind === TIMELINE_ADVANCE_KIND) { kept.push(event); continue; }
      const title = squash(event?.title);
      // Same containment rule as the suggestion filter: short titles must match
      // exactly, longer ones may be prefixes/extensions of one another.
      const isEcho = title.length >= 4
        && priorTitles.some((prior) => prior === title
          || (Math.min(prior.length, title.length) >= 6 && (prior.includes(title) || title.includes(prior))));
      if (isEcho && !changesTheWorld(event)) {
        dropped += 1;
        continue;
      }
      if (title.length >= 4) priorTitles.push(title);
      kept.push(event);
    }
    if (dropped > 0) {
      console.info(`[events] dropped ${dropped} event(s) that only retold something already in the chronicle.`);
      mergedEvents = kept;
    }
  }

  // THE WORLD ON A LOOP.
  //
  // The echo filter above is containment-based: it catches a title restated
  // almost word for word. What it cannot catch is the same non-event rewritten
  // each turn, and that is what the wider world had become. Six turns of a live
  // campaign produced, as its entire record of Russia and China:
  //
  //   러시아의 극동 개발과 에너지 인프라 강화     러시아의 극동 개발 가속화
  //   러시아 극동 개발 계획 … 소강상태 지속       러시아의 극동 지역 에너지 기반시설 확충
  //   중국의 디지털 실크로드 확장 계획            중국의 디지털 실크로드 확장 … 공고화
  //
  // Five of each, one per turn, none of them an event. The [New Developments
  // Only] directive says not to do this and the model does it anyway, because
  // with no era material to draw on it has nothing else to write — which is the
  // real fix, and a separate piece of work. Meanwhile the least this can do is
  // refuse to print the same non-development a fifth time.
  //
  // Only WORLD events, and only those that change nothing: a repeated headline
  // that moves a border or founds something is reporting a continuing campaign,
  // which is legitimate. Calibrated on those same titles — the loop's own pairs
  // score 0.50-0.85 against each other, while genuinely distinct world events
  // from the same campaign top out at 0.23.
  {
    const WORLD_REPEAT_MIN = 0.45;
    // THE MOST RECENT, NOT THE OLDEST. This read `.slice(0, 24)`, and the event
    // store is oldest-first — so from the moment a campaign passed two dozen
    // world events, this filter was comparing December against January and
    // silently stopped catching anything. It looked like it worked because early
    // turns have few events and the oldest ARE the recent ones.
    //
    // The cost, measured on the live campaign: 사우디아라비아's non-petroleum
    // diversification was published seven times, 러시아 극동 개발 six, 중국
    // 디지털 실크로드 six. The threshold was never the problem — the December
    // telling scores 0.500 and 0.667 against its August and October predecessors,
    // both well over the bar. The filter simply was not looking at them.
    const priorWorld = normalizeArray(bundle.events)
      .filter((event) => event?.playerRelated === false && event?.kind !== TIMELINE_ADVANCE_KIND)
      .slice(-24)
      .map((event) => normalizeString(event?.title))
      .filter(Boolean);
    // The exemption is for a headline genuinely REPORTING SOMETHING NEW about a
    // continuing situation, and only two impacts prove that: a border that moved,
    // or forces that moved. Markers and stat nudges were on this list and should
    // not have been — a country founding one more facility is not news about the
    // same programme it announced last month, and the loop promptly learned to
    // ride through on exactly that. Measured on round 9: both
    // "중국의 '디지털 실크로드' …" (its fifth telling) and "러시아의 시베리아 에너지
    // …" (its sixth) carried a single markerOp each and sailed past a filter that
    // scores them 0.50 and 0.69 against their own predecessors.
    const changesTheWorld = (event) => ["regionTransfers", "unitOps"]
      .some((key) => normalizeArray(event?.impacts?.[key]).length > 0);
    const kept = [];
    const echoed = [];
    const dropped = [];
    for (const event of mergedEvents) {
      const title = normalizeString(event?.title);
      const isWorld = event?.playerRelated === false && event?.kind !== TIMELINE_ADVANCE_KIND;
      if (!isWorld || !title || changesTheWorld(event)) { kept.push(event); continue; }
      let worst = 0;
      let twin = null;
      for (const prior of priorWorld) {
        const score = Math.max(coverageScore(prior, title), coverageScore(title, prior));
        if (score > worst) { worst = score; twin = prior; }
      }
      if (twin && worst >= WORLD_REPEAT_MIN) {
        echoed.push(`"${title.slice(0, 40)}" ≈ "${twin.slice(0, 40)}"`);
        dropped.push({ event, score: worst, title });
        continue;
      }
      priorWorld.unshift(title);
      kept.push(event);
    }

    // A FLOOR: THE FILTER MAY NOT LEAVE THE WORLD SILENT.
    //
    // It has no limit, and on the turn covering 2018-01-20 -> 02-19 it used it:
    // the world pass produced five events and all five scored as retellings, so
    // the turn shipped with ONE world event out of eight. The five turns before
    // it ran 5/15, 4/10, 6/13, 5/15 and 4/13 — a steady third — and then 1/8.
    //
    // A repetitive world is a worse world; a world that stopped happening is a
    // broken one, and this project's rule is that you do not lose everything
    // because of one thing. So when the filter would take every world event a
    // turn has, the least repetitive of them is put back — and said out loud,
    // because a kept retelling is a finding about the prompt, not a success.
    if (dropped.length > 0 && !kept.some((event) =>
      event?.playerRelated === false && event?.kind !== TIMELINE_ADVANCE_KIND)) {
      const survivor = dropped.reduce((best, entry) => (entry.score < best.score ? entry : best));
      kept.push(survivor.event);
      echoed.splice(echoed.findIndex((line) => line.startsWith(`"${survivor.title.slice(0, 40)}"`)), 1);
      console.warn(
        "[events] every world event this turn read as a retelling — kept the least repetitive one rather than "
        + `leaving the world silent: "${survivor.title.slice(0, 48)}" (${survivor.score.toFixed(2)})`,
      );
    }

    if (echoed.length > 0) {
      console.info(`[events] dropped ${echoed.length} world event(s) that re-told a recent one in new words:`, echoed);
    }
    if (echoed.length > 0 || dropped.length > 0) {
      mergedEvents = kept;
    }
  }

  // AN EVENT MAY ONLY CLAIM AN ORDER IT ACTUALLY CARRIED OUT.
  //
  // Everything above this point ADDS coverage — the model's own actionIds, the
  // bigram matcher, the mapping call. Nothing until now ever took a claim away,
  // and it turns out claims can be false. Captured live: the player typed the
  // order "국내 사회를 교란시키는 극단주의 … 억제" and the turn marked it resolved
  // against an event titled "사회 통합 및 교육 시스템 개혁" whose text is entirely
  // about AI-based education and youth policy. The order was never carried out
  // and never narrated; it simply vanished from the queue.
  //
  // The cause is the grouping: long queues are clustered by domain and the model
  // is asked to resolve each group with one event listing ALL of that group's
  // ids. That stops a long queue losing its tail — the reason it exists — but it
  // also lets the model write one event about the EASIEST order in a group and
  // claim the rest along with it. A hand-typed order lands in the same "Internal
  // Affairs & Society" bucket as three suggested education initiatives, and the
  // education event carries them all off.
  //
  // So every claim is checked against the claiming event's own text, and one that
  // is not about the order is struck out — the order stays queued and comes back
  // next turn, which is the honest outcome. Calibrated on that live turn: the two
  // false claims scored 0.03 and 0.04, while the fourteen genuine ones scored
  // 0.60–1.00. The bar sits at 0.25, far below anything real and far above noise,
  // so a heavy paraphrase still passes.
  {
    const knownActions = new Map(plannedQueue.map((action) => [String(action.id), action]));
    const struck = [];
    for (const event of mergedEvents) {
      const claims = normalizeArray(event?.impacts?.actionIds);
      if (claims.length === 0) continue;
      const kept = claims.filter((id) => {
        const action = knownActions.get(String(id));
        // An id we do not recognise is left alone: it is not ours to judge.
        if (!action) return true;
        // Named in the event's own sentence — that is the model pointing at this
        // order while writing this text, which is stronger evidence than shared
        // vocabulary and is exactly what the false claims never had. Measured on
        // the campaign that produced both: every event with an alias in its prose
        // was genuinely carrying out those orders, while the two events that
        // resolved orders they never mentioned carried no aliases at all.
        if (namedInProse.get(event)?.has(String(id))) return true;
        if (coverageScore(actionNeedle(action), eventHaystack(event)) >= CLAIM_VERIFY_MIN) return true;
        struck.push(`"${normalizeString(action.title) || normalizeString(action.text).slice(0, 40)}" ← "${normalizeString(event.title).slice(0, 40)}"`);
        return false;
      });
      if (kept.length !== claims.length) event.impacts.actionIds = kept;
    }
    if (struck.length > 0) {
      console.warn(
        `[actions] ${struck.length} order(s) were claimed by an event that does not carry them out — the claims were struck and the orders stay queued:`,
        struck,
      );
    }
  }

  // EVERY SCHEDULED ENTRY IS ANSWERED FOR.
  //
  // The timeline is a queue like any other, and this engine's rule for queues is
  // that nothing leaves one in silence. An entry is accounted for when some event
  // this turn is recognisably about it — reporting it happening, reporting it
  // being prevented, or reporting it delayed. All three are the model doing its
  // job, and the second and third are what an alternate history is MADE of. What
  // is not allowed is the entry never appearing at all, because "it diverged" is
  // a story only if somebody wrote it.
  //
  // Anything unaccounted for goes to the backlog and is put back in front of the
  // model next turn, marked still outstanding. Same bar as an order's claim, for
  // the same reason: it is the same question — is this event about this thing.
  let timelineUnaccounted = [];
  if (timelineEntries.length > 0) {
    // The event that told this entry's story, or null. Scored rather than
    // first-match so the effect below lands on the event that is most about it.
    const answeredBy = (entry) => {
      let best = null;
      let bestScore = 0;
      // TITLE PLUS DETAIL, NEVER THE TITLE ALONE.
      //
      // This took the better of the two, to be generous to a short title. It was
      // too generous, and the failure was quiet and serious: "제19대 대통령 선거"
      // and "문재인 대통령 취임" both scored 0.333 on title alone against an event
      // called "정부 행정 효율화 및 차세대 정책 기반 마련" — one shared word, 대통령 —
      // so both entries were marked accounted for and the inauguration's declared
      // effect was written into an event whose own text says the presidency is
      // VACANT. The player's chronicle never mentioned the election; the stat
      // sheet quietly said 문재인. Story and state disagreed on the same event.
      //
      // Scored on the whole entry the two separate cleanly, measured on this
      // campaign's own matches: real ones 0.316-0.769, those two 0.083 and 0.059.
      const needle = `${entry.title} ${entry.detail}`.trim() || entry.title;
      for (const event of mergedEvents) {
        const haystack = eventHaystack(event);
        if (!haystack) continue;
        const score = coverageScore(needle, haystack);
        if (score >= CLAIM_VERIFY_MIN && score > bestScore) {
          bestScore = score;
          best = event;
        }
      }
      return best;
    };

    const matched = new Map();
    for (const entry of timelineEntries) {
      const event = answeredBy(entry);
      if (event) matched.set(entry, event);
    }
    timelineUnaccounted = timelineEntries.filter((entry) => !matched.has(entry));
    const handled = timelineEntries.length - timelineUnaccounted.length;
    console.info(`[timeline] ${handled}/${timelineEntries.length} scheduled entr(ies) accounted for by this turn's events.`);
    if (timelineUnaccounted.length > 0) {
      console.warn(
        "[timeline] not accounted for — carried to the next turn rather than dropped:",
        timelineUnaccounted.map((entry) => `${entry.date} ${entry.title}`),
      );
    }

    // ACCOUNTED FOR IS NOT THE SAME AS HAPPENED.
    //
    // An entry the model wrote up beautifully and left with six empty impact
    // arrays has changed nothing: the prose says a president was removed from
    // office and the country's leader is still whoever it was. Where the scenario
    // declared what the entry does, write it in. Where it did not, say so out loud
    // rather than letting a story with no consequence pass as a success.
    const backfilled = [];
    const inert = [];
    const drifted = [];
    for (const [entry, event] of matched) {
      const written = writeTimelineEffect(entry, event);
      if (written.length > 0) {
        backfilled.push(`${entry.date} ${entry.title} → ${written.join(", ")}`);
      } else if (entry.weight === "pivotal" && !eventCarriesAnyImpact(event)) {
        inert.push(`${entry.date} ${entry.title}`);
      }
      const gap = Math.abs(daysBetween(entry.date, normalizeString(event?.date)));
      if (Number.isFinite(gap) && gap >= TIMELINE_DATE_DRIFT_DAYS) {
        drifted.push(`${entry.date} ${entry.title} → written as ${event.date}`);
      }
    }
    if (backfilled.length > 0) {
      console.info(
        `[timeline] wrote in the world change(s) ${backfilled.length} scheduled entr(ies) narrated but did not carry:`,
        backfilled,
      );
    }
    if (inert.length > 0) {
      console.warn(
        "[timeline] pivotal entr(ies) told as a story with no world change behind them — narration and state disagree here:",
        inert,
      );
    }
    if (drifted.length > 0) {
      console.info("[timeline] entr(ies) written well off their scheduled date:", drifted);
    }
  }

  // THE BACKLOG GIVES AN ENTRY ONE MORE TURN, NOT AN INDEFINITE ONE.
  //
  // Deferring assumes the date is still ahead. For an entry inside the window
  // that just closed, it is not — 2017-05-09 does not come round again, and the
  // player is now standing at 2017-05-25 being told by the turn summary that
  // 문재인 won an election their chronicle has no record of.
  //
  // Two entries earn the engine writing it in: one the scenario called pivotal,
  // and one that already rode the backlog once and came back unwritten a second
  // time. The second is the queue rule this project uses everywhere — a retry,
  // then the engine handles it — and it needs no threshold to decide.
  const carriedBefore = new Set(timelineBacklog.map((entry) => entry.id).filter(Boolean));
  const forcedTimeline = [];
  const heldBack = [];
  if (timelineUnaccounted.length > 0) {
    const stillWaiting = [];
    for (const entry of timelineUnaccounted) {
      const dueAndGone = entry.date <= targetDate;
      const earned = entry.weight === "pivotal" || carriedBefore.has(entry.id);
      if (!dueAndGone || !earned) {
        stillWaiting.push(entry);
        continue;
      }
      if (forcedTimeline.length >= TIMELINE_FORCE_LIMIT) {
        // Not a silent cap: it stays in the backlog AND gets named below.
        heldBack.push(`${entry.date} ${entry.title}`);
        stillWaiting.push(entry);
        continue;
      }
      const event = materializeTimelineEntry(entry, { playerPolity: variables.playerPolity, branchRolls: timelineBranchRolls });
      if (!event) {
        stillWaiting.push(entry);
        continue;
      }
      mergedEvents.push(event);
      forcedTimeline.push(`${entry.date} ${entry.title}`);
    }
    timelineUnaccounted = stillWaiting;
  }
  if (forcedTimeline.length > 0) {
    console.warn(
      `[timeline] ${forcedTimeline.length} scheduled entr(ies) whose date has passed were never written — the engine wrote them from the scenario's own text so the chronicle and the world agree:`,
      forcedTimeline,
    );
  }
  if (heldBack.length > 0) {
    console.warn(
      `[timeline] ${heldBack.length} more were due to be written in but exceeded this turn's limit of ${TIMELINE_FORCE_LIMIT} — still in the backlog, first in line next turn:`,
      heldBack,
    );
  }

  // Whatever did not fit this turn's prompt rides along with it.
  const nextTimelineBacklog = normalizeTimeline([...timelineUnaccounted, ...timelineDropped]);

  // …AND AGAIN, NOW THAT COVERAGE IS FINAL.
  //
  // The first pass runs before the world pass so the quota is counted honestly.
  // But actionIds keep arriving after it — the paid coverage mapping, the
  // supplemental passes, and the world pass's own events all attach them later.
  // Measured on 2017-03-12: "양자 암호 기반 핵심 기술 자산 보호…" shipped as a world
  // event carrying five of the player's order ids, because it was written by the
  // world pass and tagged afterwards. Nothing leaves this turn mislabelled.
  relabelPlayerWork();

  const finalCovered = new Set(
    mergedEvents.flatMap((event) => normalizeArray(event?.impacts?.actionIds)).map((id) => String(id)),
  );
  const leftUncovered = plannedQueue.filter((action) => !finalCovered.has(String(action.id))).length;
  // THE TURN ENDS BY PINNING THE DATE, the way the original does: the orders
  // play out and the last line of the turn is an explicit "advance to <date>".
  //
  // An earlier attempt held the calendar back whenever an order was still
  // outstanding. That was wrong in practice and produced a real bug: the turn's
  // events were dated across the month it had just simulated while the clock
  // stayed behind, so the chronicle held June while the game insisted it was
  // still 30 May, and the history showed two turns with the same round number.
  // The clock now ALWAYS advances; leftovers stay queued and are named in a
  // notice instead of stalling the campaign.
  // GROUND FORCES BELONG ON THE GROUND. Field report: army units were spawning
  // out at sea. The model picks coordinates from memory and drifts off the
  // coast, and nothing checked it. The check is exact rather than heuristic —
  // the game already ships 118 sea polygons for the naval map, so a ground unit
  // is tested against the actual water and, if it is in it, moved to the nearest
  // real place from the city catalog. A "near a city" distance rule was tried
  // first and was not good enough: a unit 1.3° off Busan sits in the Korea
  // Strait and still looks close to land. Air and naval units are never moved.
  // Shared by the sea-relocation pass below and the de-collision pass after it:
  // the same water and the same known places, loaded once.
  const seaRings = await loadSeaPolygons();
  const cityAnchors = [];
  for (const line of normalizeString(variables?.citiesSummary).split("\n")) {
    const match = /lat\s*(-?\d+(?:\.\d+)?),\s*lng\s*(-?\d+(?:\.\d+)?)/i.exec(line);
    if (!match) continue;
    const name = /^-\s*([^:(]+)/.exec(line)?.[1]?.trim() || "";
    cityAnchors.push({ lat: Number(match[1]), lng: Number(match[2]), name });
  }
  {
    const seaPolygons = seaRings;
    const cities = cityAnchors;
    if (cities.length > 0 && seaPolygons.length > 0) {
      let moved = 0;
      for (const event of mergedEvents) {
        for (const op of normalizeArray(event?.impacts?.unitOps)) {
          const type = String(op?.unit?.type ?? "").toLowerCase();
          const isSpawn = op?.unit && Number.isFinite(Number(op.unit.lng));
          const isMove = Number.isFinite(Number(op?.toLng));
          if (!isSpawn && !isMove) continue;
          // Only ground forces. A move op carries no type, so fall back to the
          // unit's recorded type where we can see it.
          if (isSpawn && !LAND_UNIT_TYPES.has(type)) continue;
          const lng = Number(isSpawn ? op.unit.lng : op.toLng);
          const lat = Number(isSpawn ? op.unit.lat : op.toLat);
          if (!Number.isFinite(lng) || !Number.isFinite(lat)) continue;
          if (!isInSea(lng, lat, seaPolygons)) continue;
          let best = null;
          let bestDistance = Infinity;
          for (const city of cities) {
            const distance = Math.hypot(city.lng - lng, city.lat - lat);
            if (distance < bestDistance) { bestDistance = distance; best = city; }
          }
          if (!best) continue;
          if (isSpawn) { op.unit.lng = best.lng; op.unit.lat = best.lat; } else { op.toLng = best.lng; op.toLat = best.lat; }
          moved += 1;
          console.info(`[world] ${op?.unit?.name || "a ground unit"} was placed at sea — moved to ${best.name}.`);
        }
      }
      if (moved > 0) console.warn(`[world] moved ${moved} ground unit(s) off open water to the nearest known place.`);
    }
  }
  const stopDate = normalizeString(payload?.stopDate) || targetDate;

  // A MONTH DOES NOT BUILD TWENTY-TWO THINGS.
  //
  // One turn produced 22 markerOps and the map now carries 50 structures, nearly
  // all of them stacked around the player's own country — which is what the player
  // sees as clutter long before any city does, because these are the things they
  // built and they are all in one place. Grouping the supplemental pass reduces the
  // pressure; this is the backstop, because "how many buildings is too many" is a
  // judgement the model has no reason to make and the engine can.
  //
  // Keeps the ones the model itself marked as most significant (marker.size, the
  // 0.5-3 importance scale it already sets) and drops the tail, logged. Removals
  // and renames are never dropped — those are corrections, not construction.
  {
    const MAX_BUILDS_PER_TURN = 8;
    const builds = [];
    for (const event of mergedEvents) {
      for (const op of normalizeArray(event?.impacts?.markerOps)) {
        if (op?.op === "build") builds.push({ event, op });
      }
    }
    if (builds.length > MAX_BUILDS_PER_TURN) {
      const sizeOf = (entry) => Number(entry.op.marker?.size ?? entry.op.size ?? 1) || 1;
      const keep = new Set(
        builds
          .map((entry, index) => ({ entry, index, size: sizeOf(entry) }))
          // Ties keep generation order, so the earliest-narrated survives.
          .sort((a, b) => (b.size - a.size) || (a.index - b.index))
          .slice(0, MAX_BUILDS_PER_TURN)
          .map((ranked) => ranked.entry.op),
      );
      const dropped = [];
      for (const event of mergedEvents) {
        const ops = normalizeArray(event?.impacts?.markerOps);
        if (ops.length === 0) continue;
        event.impacts.markerOps = ops.filter((op) => {
          if (op?.op !== "build" || keep.has(op)) return true;
          dropped.push(normalizeString(op.marker?.name ?? op.name) || "unnamed");
          return false;
        });
      }
      console.info(
        `[world] ${builds.length} structures in one period is more than a month builds — kept the ${MAX_BUILDS_PER_TURN} most significant, `
        + `dropped: ${dropped.join(", ")}`,
      );
    }
  }

  // Shared with the country check and the collision spread further down, both of
  // which need the same index: loading it is ~19 MB of geometry, so it is loaded
  // once here and reused rather than built per pass.
  let territoryIndex = null;

  // A STRUCTURE STANDS WHERE ITS NAME SAYS.
  //
  // BEFORE THE DUPLICATE MERGE, not after — this ran inside the territory block
  // below and that was a real regression, caught on the turn covering
  // 2017-08-23 -> 09-22. The model founded a Gangwon quantum zone and a
  // Gyeongsang one in a single event and, as it does, dropped both at almost the
  // same coordinate. The merge pass saw two structures of one kind, one owner,
  // four shared name words and 20 km apart and folded them — RENAMING the
  // Gyeongsang one to "강원 양자·AI 기술 특구" — before this pass could move it
  // 100 km south to the province it is named after. The event text still says
  // 강원과 경상 both got one. The map had one.
  //
  // A province is a stronger statement than a distance. Resolve it first, and the
  // two are 100 km apart by the time anything asks whether they are the same.
  //
  // Also before the country check, which cannot catch these at all: 제주 강화
  // 방어 구역 built in Gangwon is on South Korean soil, on land, nowhere near a
  // border, and still 475 km from Jeju. See runtime/placeName.js for why this
  // measures distance rather than asking whether the point is inside.
  {
    const builds = mergedEvents.flatMap((event) => normalizeArray(event?.impacts?.markerOps))
      .filter((op) => op?.op === "build")
      .map((op) => op.marker ?? op)
      .filter((marker) => Number.isFinite(Number(marker?.lng)) && Number.isFinite(Number(marker?.lat)));
    if (builds.length > 0) {
      const territory = await loadTerritoryIndex();
      territoryIndex = territory;
      if (territory.rings.length === 0) {
        console.info("[world] this scenario ships no region geometry — structure placement was not checked.");
      } else {
        const placeIndex = buildPlaceIndex(territory, await loadNameDictionary(JSON_URLS.world));
        const relocated = [];
        const stranded = [];
        for (const marker of builds) {
          const verdict = placeNameVerdict(territory, placeIndex, {
            lat: Number(marker.lat),
            lng: Number(marker.lng),
            name: normalizeString(marker.name),
            owner: normalizeString(marker.ownerCode || marker.owner || marker.code),
          });
          if (verdict.status === PLACE.misplaced) {
            relocated.push(`${marker.name} — ${Math.round(verdict.km)} km from ${verdict.place}`);
            marker.lng = verdict.moveTo.lng;
            marker.lat = verdict.moveTo.lat;
          } else if (verdict.status === PLACE.stranded) {
            stranded.push(`${marker.name} — ${Math.round(verdict.km)} km from ${verdict.place}, nowhere inside it to stand`);
          }
        }
        if (relocated.length > 0) {
          console.info(`[world] moved ${relocated.length} structure(s) to the place their own name gives:`, relocated);
        }
        if (stranded.length > 0) {
          console.warn("[world] named a place and could not be put in it — left where they were:", stranded);
        }
      }
    }
  }

  // THE SAME PLACE, FOUNDED TWICE.
  //
  // The prompt now shows the model what already stands on the map, which is most
  // of the fix. This is the rest: a model that renames slightly between turns
  // ("Gyeonggi AI-Semiconductor Cluster" then "Gyeonggi AI Semiconductor Complex")
  // still founds a second one, and the player ends up with two of everything and
  // two things to click where there should be one.
  //
  // Rewriting the build to carry the EXISTING name is all it takes, because
  // applyMarkerOps already replaces a build whose name matches one on the map. So
  // this pass decides identity, and the existing code does the merge.
  //
  // Two ways to be the same thing, both deliberately conservative — a wrong merge
  // silently destroys a real structure, which is worse than a duplicate:
  //   the names reduce to the same words, ignoring order and filler; or
  //   it is the same OWNER and the same KIND within ~25 km, which on this map is
  //   close enough that no country founds two distinct installations of one type.
  {
    const FILLER = new Set(["the", "of", "and", "new", "phase", "ii", "iii", "센터", "단지", "기지", "시설"]);
    const wordsOf = (value) => new Set(
      normalizeString(value)
        .toLowerCase()
        .replace(/[^\p{L}\p{N}]+/gu, " ")
        .split(" ")
        .filter((word) => word.length > 1 && !FILLER.has(word)),
    );
    const sameWords = (a, b) => {
      if (a.size === 0 || b.size === 0) return false;
      let shared = 0;
      for (const word of a) if (b.has(word)) shared += 1;
      // Every word of the shorter name appears in the longer one: "X Cluster"
      // continues "X Cluster Phase 2", and "Busan Shipyard" does not continue
      // "Ulsan Shipyard".
      if (shared !== Math.min(a.size, b.size)) return false;
      // One word in common is not identity when that word is a PLACE. "제주
      // 해상풍력 단지" reduces to {제주, 해상풍력} and a hydrogen hub on the same
      // island shares only 제주 — same coast, different installation. Demand two
      // distinguishing words, or names that reduce to exactly the same set.
      return Math.min(a.size, b.size) >= 2 || (a.size === b.size);
    };

    // WITHIN THE TURN TOO. `existing` was the map as it stood BEFORE the turn, so
    // two structures founded in the same jump were never compared to each other.
    // The live map carries "양자-반도체 통합 보안 센터" and "양자-반도체 통합 보안
    // 구역" with identical createdAt stamps — one turn, one word apart, two pins.
    // Each build that survives is appended below, so the next one sees it.
    const existing = normalizeArray(bundle.world?.markers).map((marker) => ({
      kind: normalizeString(marker.kind).toLowerCase(),
      lat: Number(marker.lat),
      lng: Number(marker.lng),
      name: normalizeString(marker.name),
      ownerCode: normalizeString(marker.ownerCode),
      words: wordsOf(marker.name),
    }));

    // No `if (existing.length > 0)` guard: the pass now also compares this turn's
    // builds against each OTHER, which matters most on a young campaign that has
    // nothing on the map yet and founds four things at once.
    {
      let merged = 0;
      for (const event of mergedEvents) {
        for (const op of normalizeArray(event?.impacts?.markerOps)) {
          if (op?.op !== "build") continue;
          const marker = op.marker ?? op;
          const name = normalizeString(marker?.name);
          if (!name) continue;
          if (existing.some((prior) => prior.name.toLowerCase() === name.toLowerCase())) continue; // already a merge

          const words = wordsOf(name);
          const kind = normalizeString(marker.kind).toLowerCase();
          const owner = normalizeString(marker.ownerCode);
          const lat = Number(marker.lat);
          const lng = Number(marker.lng);

          // DISTANCE IS NOT IDENTITY — BUT IT IS EVIDENCE, ONCE A NAME AGREES.
          //
          // There used to be a bare proximity rule here — same owner, same kind,
          // within ~25 km — and it was wrong in a way worth recording, because I
          // wrote "deliberately conservative" above it and then was not. `kind` is
          // free-form and models reuse broad values, and a country builds most of
          // its things around one metropolitan area, so "same owner, same kind,
          // 25 km" reduces to "both in Seoul". Of the four merges it made, three
          // came from proximity alone — including "양자-AI 통합 클러스터" folded into
          // "사이버 보안 통합관제 센터", which share no word and no purpose. Two real
          // structures were silently destroyed to prevent a duplicate.
          //
          // It comes back only with a name requirement in front of it, which is
          // precisely what it lacked. sameWords demands EVERY word of the shorter
          // name; nearWords demands two, and only inside 25 km. Measured on the 58
          // structures this campaign is carrying, using this file's own word rule:
          //
          //   13.5 km  3 shared  농산물 자동 물류·수출 허브 / 자동화 농산물 수출 허브(경상)  same
          //   13.5 km  2 shared  동남아 에너지/수소 허브 / 동남아 양자-수소 통합 거점        same
          //   16.7 km  3 shared  K-Shield 해상 통제 허브 / 말라카 해상 보안 통제 허브        same
          //   34.6 km  2 shared  국가 전략 약품 비축 단지 / 중부권 전략 약품 물류 기지     DIFFERENT
          //   43.2 km  3 shared  트라이앵글 에너지 관문(부산) / 트라이앵글 에너지 관문(울산) DIFFERENT
          //
          // Nothing at all between 17 and 34 km, so 25 sits in an empty band rather
          // than on a judgement call — and the pair the old rule destroyed shares
          // zero words, so it never reaches this branch. Two cities 43 km apart keep
          // their two gateways.
          const nearWords = (prior) => {
            if (prior.kind !== kind || prior.ownerCode !== owner) return false;
            if (!Number.isFinite(lat) || !Number.isFinite(lng)) return false;
            if (!Number.isFinite(prior.lat) || !Number.isFinite(prior.lng)) return false;
            let shared = 0;
            for (const word of words) if (prior.words.has(word)) shared += 1;
            if (shared < 2) return false;
            const dx = (prior.lng - lng) * Math.cos((lat * Math.PI) / 180);
            const dy = prior.lat - lat;
            return Math.hypot(dx, dy) * 111 <= MARKER_MERGE_KM;
          };
          const match = existing.find((prior) => sameWords(prior.words, words)) ?? existing.find(nearWords);
          if (!match) {
            existing.push({ kind, lat, lng, name, ownerCode: owner, words });
            continue;
          }

          console.info(`[world] "${name}" continues "${match.name}" — updating it in place instead of founding a second one.`);
          marker.name = match.name;
          marker.lng = match.lng;
          marker.lat = match.lat;
          merged += 1;
          continue;
        }
      }
      if (merged > 0) console.info(`[world] merged ${merged} rebuilt structure(s) into what was already there.`);
    }
  }

  // NOTHING LANDS ON TOP OF ANYTHING ELSE.
  //
  // Every point on this map is its own click target, and two of them at the same
  // coordinates is one the player can reach and one they cannot — the click
  // handler takes a hit and there is no second chance at the thing underneath.
  // Three separate sources push things together: the model reuses the first
  // coordinate it wrote (usually the capital's) for later placements, it rounds to
  // whole or half degrees, and the sea-relocation pass just above SNAPS every
  // off-coast ground unit onto an exact city coordinate — so the fix for units in
  // the water was quietly manufacturing collisions on the shore.
  //
  // Everything already on the map is an obstacle, not just what this turn adds:
  // A STRUCTURE STANDS IN ITS OWNER'S COUNTRY.
  //
  // Before anything is nudged clear of its neighbours it has to be in the right
  // country at all. Measured on this campaign: six of forty-two markers were not —
  // two South Korean command posts north of the DMZ, a Chinese data centre in
  // Kyrgyzstan, three structures in open water. See runtime/territory.js for what
  // is corrected and, just as importantly, what is left alone (an embassy abroad
  // is not a mistake).
  //
  // Runs only when this turn actually founds something, because the answer costs
  // one read of the scenario's full geometry per session.
  //
  // `homeBound` is the other half of this and lives outside the block on purpose:
  // the collision pass below moves things too, and it has to know which ones are
  // not allowed to leave the country while it does.
  const territoryOverrides = bundle.world?.regionOwnershipOverrides ?? {};
  const homeBound = new Map();
  {
    const builds = mergedEvents.flatMap((event) => normalizeArray(event?.impacts?.markerOps))
      .filter((op) => op?.op === "build")
      .map((op) => op.marker ?? op)
      .filter((marker) => Number.isFinite(Number(marker?.lng)) && Number.isFinite(Number(marker?.lat)));

    if (builds.length > 0) {
      const territory = territoryIndex ?? await loadTerritoryIndex();
      territoryIndex = territory;

      const overrides = territoryOverrides;
      const moved = [];
      const left = [];
      const abroad = [];
      const adopted = [];
      for (const marker of builds) {
        // A structure nobody runs cannot be checked, and three of the forty-two
        // on the live map were like that. The ground it stands on is the one
        // answer available and it is a fact rather than a guess, so take it —
        // an attributable marker beats a blank one, and the check then applies.
        if (!normalizeString(marker.ownerCode || marker.owner || marker.code)) {
          const ground = locateRegion(territory, Number(marker.lng), Number(marker.lat), overrides);
          if (ground?.owner) {
            marker.ownerCode = ground.owner;
            adopted.push(`${marker.name || "a structure"} → ${ground.owner}`);
          }
        }
        const verdict = placementVerdict(territory, {
          kind: marker.kind,
          lat: Number(marker.lat),
          lng: Number(marker.lng),
          overrides,
          owner: marker.ownerCode || marker.owner || marker.code,
        });
        if (verdict.moveTo) {
          const where = verdict.status === PLACEMENT.sea ? "open water" : `${verdict.at?.name} (${verdict.at?.owner})`;
          moved.push(`${marker.name || "a structure"}: ${where} → ${marker.ownerCode}`);
          marker.lng = verdict.moveTo.lng;
          marker.lat = verdict.moveTo.lat;
        } else if (verdict.status === PLACEMENT.stranded) {
          left.push(`${marker.name || "a structure"} (${marker.ownerCode}) at ${Number(marker.lng).toFixed(2)}, ${Number(marker.lat).toFixed(2)}`);
        } else if (verdict.status === PLACEMENT.abroad && verdict.at) {
          // Deliberately NOT moved — a facility deep inside another country reads
          // as a posting rather than a slip (see territory.js). But silence was
          // the wrong treatment: the live map gained a UAE-owned "말라카 해협 인근"
          // control centre standing in South Korea, which the rule accepted
          // because it is 6,000 km from the UAE. Say it out loud instead — and
          // now WITH the standing between the two, which is what decides whether
          // a foreign base reads as an allied posting or as something to explain.
          const playerName = normalizeString(bundle.game?.country);
          const relations = normalizeWorldState(bundle.world).diplomaticRelations;
          const other = [marker.ownerCode, verdict.at.owner]
            .map((name) => normalizeString(name))
            .find((name) => name && name !== playerName);
          const standing = other && (normalizeString(marker.ownerCode) === playerName || normalizeString(verdict.at.owner) === playerName)
            ? getRelation(relations, other)
            : null;
          const tone = standing
            ? (["allied", "friendly"].includes(standing)
              ? ` — ${relationLabel(standing)} soil, reads as a posting`
              : ` — ${relationLabel(standing)} soil, worth explaining`)
            : "";
          abroad.push(`${marker.name || "a structure"} (${marker.ownerCode}) stands in ${verdict.at.name}, ${verdict.at.owner}${tone}`);
        }
        // Anything standing on its owner's own soil — whether it arrived there by
        // itself or was just put there — is pinned to that country for the
        // collision pass. Everything else (an embassy abroad, a stranded rig) has
        // no home to be kept inside and is left to the spiral.
        if (verdict.moveTo || verdict.status === PLACEMENT.ok) {
          homeBound.set(marker, normalizeString(marker.ownerCode || marker.owner || marker.code));
        }
      }
      if (moved.length > 0) {
        console.info(`[world] moved ${moved.length} structure(s) back onto their owner's territory:`, moved);
      }
      if (adopted.length > 0) {
        console.info(`[world] ${adopted.length} structure(s) were founded with no owner — attributed to whoever holds the ground:`, adopted);
      }
      if (abroad.length > 0) {
        console.info(`[world] ${abroad.length} structure(s) stand on foreign soil — left as deliberate postings, but worth an eye:`, abroad);
      }
      if (left.length > 0) {
        console.warn("[world] structure(s) placed nowhere near their owner's land — left where they are:", left);
      }
    }
  }

  // NOTHING LANDS ON TOP OF ANYTHING ELSE (continued).
  //
  // Everything already on the map is an obstacle, not just what this turn adds:
  // existing markers, existing units, and the city catalog. New placements are
  // nudged outward along a deterministic spiral until they clear, at a separation
  // that scales with longitude's convergence toward the poles so the gap is a real
  // distance rather than a number of degrees.
  {
    const SEPARATION_DEG = 0.09; // ~10 km at the equator: distinct at any useful zoom
    const occupied = [];
    const claim = (lng, lat) => occupied.push({ lat, lng });
    const lngScale = (lat) => Math.max(0.2, Math.cos((lat * Math.PI) / 180));
    const isClear = (lng, lat) => !occupied.some((spot) => {
      const dLat = spot.lat - lat;
      const dLng = (spot.lng - lng) * lngScale(lat);
      return Math.hypot(dLng, dLat) < SEPARATION_DEG;
    });

    for (const marker of normalizeArray(bundle.world?.markers)) claim(Number(marker.lng), Number(marker.lat));
    for (const unit of normalizeArray(bundle.world?.units)) claim(Number(unit.lng), Number(unit.lat));
    for (const city of cityAnchors) claim(city.lng, city.lat);

    // Golden-angle spiral: deterministic (so a turn re-runs identically), and it
    // walks outward evenly in every direction rather than marching along one axis,
    // which would file a crowded capital's buildings into a visible line.
    // …AND NOTHING LEAVES ITS COUNTRY TO AVOID DOING SO.
    //
    // This is the interaction that let a corrected structure end up wrong again.
    // The spiral reaches SEPARATION_DEG × (1 + 40 × 0.35) ≈ 1.35°, about 150 km,
    // and it had no idea what it was walking over. Measured on the very next turn
    // after the placement check shipped: 바이오-AI 통합 안보 허브, owner South
    // Korea, came out of the spiral at 127.698°E 38.349°N — two kilometres inside
    // North Korea. The placement pass had done its job and this undid it.
    //
    // A structure that is on its owner's soil stays on its owner's soil. If no
    // free spot in the spiral satisfies that, it keeps its original position and
    // overlaps something — being in the right country matters more than being
    // easy to click, and the overlap is visible while the wrong country is not.
    const staysHome = (owner, lng, lat) => {
      if (!owner || !territoryIndex || territoryIndex.rings.length === 0) return true;
      const at = locateRegion(territoryIndex, lng, lat, territoryOverrides);
      return !!at && normalizeString(at.owner).toLowerCase() === owner.toLowerCase();
    };

    const findFreeSpot = (lng, lat, avoidSea, homeOwner = "") => {
      if (isClear(lng, lat)) return { lat, lng };
      for (let step = 1; step <= 40; step += 1) {
        const angle = step * 2.39996;
        const radius = SEPARATION_DEG * (1 + step * 0.35);
        const nextLat = lat + Math.sin(angle) * radius;
        const nextLng = lng + (Math.cos(angle) * radius) / lngScale(lat);
        if (Math.abs(nextLat) > 85) continue;
        if (!isClear(nextLng, nextLat)) continue;
        // A ground unit pushed off a crowded shore must not be pushed into the sea
        // the pass above just rescued it from.
        if (avoidSea && seaRings.length > 0 && isInSea(nextLng, nextLat, seaRings)) continue;
        if (homeOwner && !staysHome(homeOwner, nextLng, nextLat)) continue;
        return { lat: nextLat, lng: nextLng };
      }
      return null;
    };

    let nudged = 0;
    let pinned = 0;
    for (const event of mergedEvents) {
      for (const op of normalizeArray(event?.impacts?.markerOps)) {
        const marker = op?.op === "build" ? (op.marker ?? op) : null;
        const lng = Number(marker?.lng);
        const lat = Number(marker?.lat);
        if (!Number.isFinite(lng) || !Number.isFinite(lat)) continue;
        const spot = findFreeSpot(lng, lat, false, homeBound.get(marker) ?? "");
        // No free spot that keeps it in its own country: leave it exactly where
        // the placement pass put it rather than walking it over a border.
        if (!spot) {
          if (homeBound.has(marker)) pinned += 1;
          claim(lng, lat);
          continue;
        }
        if (spot.lng !== lng || spot.lat !== lat) nudged += 1;
        marker.lng = spot.lng;
        marker.lat = spot.lat;
        claim(spot.lng, spot.lat);
      }
      for (const op of normalizeArray(event?.impacts?.unitOps)) {
        const isSpawn = op?.unit && Number.isFinite(Number(op.unit.lng));
        const isMove = Number.isFinite(Number(op?.toLng));
        if (!isSpawn && !isMove) continue;
        const lng = Number(isSpawn ? op.unit.lng : op.toLng);
        const lat = Number(isSpawn ? op.unit.lat : op.toLat);
        if (!Number.isFinite(lng) || !Number.isFinite(lat)) continue;
        const isGround = isSpawn && LAND_UNIT_TYPES.has(String(op.unit.type ?? "").toLowerCase());
        const spot = findFreeSpot(lng, lat, isGround);
        if (!spot) continue;
        if (spot.lng !== lng || spot.lat !== lat) nudged += 1;
        if (isSpawn) { op.unit.lng = spot.lng; op.unit.lat = spot.lat; }
        else { op.toLng = spot.lng; op.toLat = spot.lat; }
        claim(spot.lng, spot.lat);
      }
    }
    if (nudged > 0) console.info(`[world] nudged ${nudged} placement(s) clear of something already on the map.`);
    if (pinned > 0) {
      console.info(`[world] ${pinned} structure(s) kept their spot rather than being nudged over a border — they overlap something instead.`);
    }
  }

  // GROUND IS BROKEN, NOT RIBBON CUT.
  //
  // Runs after placement, because where a project stands is settled before how
  // long it takes, and a build that got merged into an existing structure is no
  // longer a new project at all. Every remaining build becomes a dated project
  // (runtime/construction.js): the marker appears now — the event announcing it
  // is true, ground WAS broken — and becomes real on its completion date.
  //
  // Measured cause: 143 structures founded in 30 rounds, one in every round, none
  // ever closed. Round 31 opened two overseas ports and three research sites in a
  // single month.
  {
    const existing = normalizeMarkers(bundle.world?.markers);
    const started = [];
    const waiting = [];
    const foreignBuilt = [];
    // The SAME founding, announced by two events in one turn (round 5, live:
    // 비무장지대 인도적 지원 센터 broke ground twice in one list). applyMarkerOps
    // would fold them at apply time anyway; folding here keeps the schedule and
    // the console honest too.
    const foundedThisTurn = new Set();
    let foldedFoundings = 0;
    const playerPolityName = toCountryName(normalizeString(bundle.game?.country));
    // Victoria 3-style capacity (the player's round-8 call): how many the
    // player runs at once comes from their own merged sheet, so the orders
    // that grow the nation grow its construction pace. Computed once per turn
    // from the PRE-turn world — this turn's own stat shifts pay off next turn.
    const buildCapacity = constructionCapacity(mergeStatSheet(
      normalizeWorldState(bundle.world).countryStats?.[playerPolityName],
      normalizeWorldState(bundle.world).countryStatChanges?.[playerPolityName],
    ));
    for (const event of mergedEvents) {
      for (const op of event?.impacts?.markerOps ?? []) {
        if (op?.op !== "build" || !op.marker) continue;
        const foundingKey = `${collapseForCompare(op.marker?.name)}|${toCountryName(normalizeString(op.marker?.ownerCode || op.marker?.owner))}`;
        if (foundedThisTurn.has(foundingKey)) { foldedFoundings += 1; op.op = "skip-duplicate-build"; continue; }
        foundedThisTurn.add(foundingKey);
        // A scenario timeline's own structures are history, not this campaign's
        // programmes — they are already standing when the campaign reaches them.
        if (normalizeString(event?.source) === "timeline") continue;
        // ANOTHER COUNTRY'S CONSTRUCTION IS ITS OWN AFFAIR. The slot-and-lead
        // discipline exists to pace the PLAYER's building spree (that was the
        // measured disease); a foreign markerOp usually names a facility that
        // already exists over there — live: 광명성-4 lifted off and 동창리
        // 서해위성발사장, standing since 2012, went "under construction" for
        // twelve months. Foreign structures land standing, dated to the event.
        const markerOwner = toCountryName(normalizeString(op.marker?.ownerCode || op.marker?.owner));
        if (playerPolityName && markerOwner && markerOwner !== playerPolityName) {
          foreignBuilt.push(`${op.marker?.name} (${markerOwner})`);
          continue;
        }
        const begun = beginConstruction(op.marker, {
          markers: [...existing, ...started.map((entry) => entry.marker)],
          date: normalizeString(event.date) || originDate,
          capacity: buildCapacity.slots,
        });
        op.marker = begun.marker;
        (begun.queued ? waiting : started).push({ marker: begun.marker, ...begun });
      }
    }
    if (foldedFoundings > 0) {
      console.info(`[build] folded ${foldedFoundings} duplicate founding(s) of the same structure announced twice in one turn.`);
    }
    if (foreignBuilt.length > 0) {
      console.info(`[build] ${foreignBuilt.length} foreign structure(s) stand complete on arrival — another country's construction is its own affair: ${foreignBuilt.join("; ")}`);
    }
    const all = [...started, ...waiting];
    if (all.length > 0) {
      console.info(`[build] construction capacity ${buildCapacity.slots} slot(s) — ${buildCapacity.why}.`);
      console.info(
        `[build] ${all.length} project(s) broke ground: `
        + all.map((entry) => `${entry.marker.name} → ${entry.readyAt} (${entry.months}개월)`).join("; "),
      );
    }
    // NOT A SILENT QUEUE. A project that has to wait for a slot is the throttle
    // doing its job, and the player is entitled to know which of their orders is
    // the one standing in line.
    if (waiting.length > 0) {
      console.info(
        `[build] ${waiting.length} of them wait for one of ${buildCapacity.slots} slots to free: `
        + waiting.map((entry) => `${entry.marker.name} starts ${entry.startedAt}`).join("; "),
      );
    }
    // THE BACKLOG IS NEVER SILENT (the player's round-8 policy, the visibility
    // half): when the next free slot is more than a year out, the console and
    // the advisor both say so, in months, so ordering yet another founding is
    // an informed choice rather than a surprise in 2020.
    {
      const nextFree = nextSlotDate([...existing, ...started.map((entry) => entry.marker)], playerPolityName, originDate, buildCapacity.slots);
      const backlogMonths = monthsBetweenDates(originDate, nextFree);
      if (backlogMonths >= 12) {
        console.warn(`[build] 건설 대기열 적체 ${backlogMonths}개월 — 다음 빈 슬롯 ${nextFree}. 새 착공은 그 뒤에나 시작된다.`);
      }
    }
  }

  // SPREAD THE WORLD ACROSS THE PERIOD.
  //
  // Sorting the turn by date fixed events being APPENDED behind the player's, but
  // it could only sort the dates it was given — and the world pass runs last, after
  // the player's events already exist, so the model writes it as an epilogue and
  // dates it accordingly. Field report from a January turn: every player event
  // between the 4th and the 27th, then five world events on the 27th and 30th. The
  // sort was working perfectly and the world still happened last.
  //
  // So redistribute, but only when the dating is degenerate — one or two distinct
  // days, or nothing before the last 40% of the window. A pass that already spread
  // its events is left alone, and the generated ORDER is always preserved, so a
  // world event that refers to an earlier one still follows it.
  {
    const toDay = (value) => {
      const parsed = Date.parse(`${normalizeString(value)}T00:00:00Z`);
      return Number.isFinite(parsed) ? Math.floor(parsed / 86400000) : null;
    };
    const toDate = (day) => new Date(day * 86400000).toISOString().slice(0, 10);
    const from = toDay(originDate);
    const to = toDay(stopDate);
    const worldEvents = mergedEvents.filter((event) =>
      event?.kind === "world" || event?.playerRelated === false);

    if (from !== null && to !== null && to > from && worldEvents.length >= 3) {
      const days = worldEvents.map((event) => toDay(event.date)).filter((day) => day !== null);
      const distinct = new Set(days).size;
      const span = to - from;
      const earliest = days.length ? Math.min(...days) : to;
      const degenerate = distinct <= 2 || (earliest - from) > span * 0.6;

      if (degenerate) {
        // Interior points only: the window's first day usually belongs to the
        // player's opening move and the last is where the advance marker pins.
        const step = span / (worldEvents.length + 1);
        worldEvents.forEach((event, index) => {
          event.date = toDate(from + Math.round(step * (index + 1)));
        });
        console.info(
          `[world] ${worldEvents.length} world event(s) were dated into ${distinct} day(s) at the end of the period — spread across ${originDate} → ${stopDate}.`,
        );
      }
    }
  }

  // THE PLAYER READS THIS IN THEIR OWN LANGUAGE.
  //
  // Every geographic name reaches the model in English, because English is what
  // the engine matches on, so it writes them back in English inside Korean prose:
  // "Russia는 시베리아를…", "부산과 Ulsan 항만을…", "(P'yŏng양 등)". The engine
  // already knows all of these in the player's language — it draws them on the
  // map — so this is a lookup, not a translation. See runtime/localizeNames.js
  // for why nothing outside the country and region catalogues is ever touched.
  const nameDictionary = await loadNameDictionary(JSON_URLS.world);
  {
    const dictionary = nameDictionary;
    if (dictionary.length > 0) {
      let touched = 0;
      const localize = (holder, field) => {
        const before = normalizeString(holder?.[field]);
        if (!before) return;
        const after = localizeNames(before, dictionary);
        if (after !== before) {
          holder[field] = after;
          touched += 1;
        }
      };
      const seen = [];
      for (const event of mergedEvents) {
        seen.push(event?.title, event?.description);
        localize(event, "title");
        localize(event, "description");
        for (const op of normalizeArray(event?.impacts?.markerOps)) {
          for (const holder of [op, op.marker].filter(Boolean)) {
            seen.push(holder.name, holder.newName);
            localize(holder, "name");
            localize(holder, "newName");
            localize(holder, "note");
          }
        }
        for (const chat of normalizeArray(event?.impacts?.createdChats)) {
          localize(chat, "title");
          localize(chat, "openingMessage");
        }
      }
      if (touched > 0) console.info(`[i18n] wrote ${touched} English place name(s) back in the player's language.`);
      // Whatever the cache could not answer for is queued now, so the next turn
      // can fix what this one had to leave in English.
      queueUnknownNames(seen, dictionary);
    }
  }

  // CHRONOLOGICAL ORDER. The turn is assembled from several passes — the main
  // generation, the action top-ups, then the world pass — and each one simply
  // appended its events, so everything the rest of the world did was stacked
  // behind everything the player did no matter when it happened. A turn has one
  // timeline: sort it by date. Ties keep the order they were generated in, so a
  // cause still reads before its consequence on the same day.
  mergedEvents = mergedEvents
    .map((event, index) => ({ event, index }))
    .sort((a, b) => {
      const dateA = normalizeString(a.event?.date);
      const dateB = normalizeString(b.event?.date);
      if (dateA && dateB && dateA !== dateB) return dateA < dateB ? -1 : 1;
      if (dateA && !dateB) return -1;
      if (!dateA && dateB) return 1;
      return a.index - b.index;
    })
    .map((entry) => entry.event);
  if (leftUncovered > 0) {
    console.warn(`[actions] ${leftUncovered} queued action(s) were not played out — they stay queued for the next turn.`);
  }
  // THE OTHER HALF OF ACTION BOOKKEEPING: acts the player never ordered.
  //
  // actionCoverage (above) asks whether every ORDER got an event. Nothing asked
  // the reverse until the sovereignty A/B measured why it must be asked: with
  // "reinforce the Westwall" as the only order, this model invaded Poland
  // twelve times out of twelve — [Player Agency] in the prompt, contract
  // injected, no difference (docs/analysis/cell-ab-2026-08-11.md). Rule #2:
  // where the model repeatedly fails, the engine checks rather than asks.
  //
  // Placement matters twice over. AFTER the final sort, because the audit drops
  // by index and nothing may reorder in between; BEFORE the calendar card,
  // because the card appends an event and would shift nothing but should not
  // even be in the audited set. Bounded and optional like every pass here: the
  // fallback keeps everything, and only an explicit "unordered" verdict drops.
  const playerActNames = [
    bundle.game?.country,
    toCountryName(normalizeString(bundle.game?.country)),
    variables?.playerPolity,
  ];
  const unorderedCandidates = findUnorderedPlayerActs({
    events: mergedEvents,
    actions: plannedQueue,
    playerNames: playerActNames,
  });
  if (unorderedCandidates.length > 0) {
    try {
      const { payload: auditPayload } = await runJsonTask("unorderedActAudit", {
        signal,
        timeoutMs: 120000,
        fallback: () => ({ verdicts: [] }),
        userMessage: buildAuditMessage(unorderedCandidates, plannedQueue),
        variables: { ...variables, originRoundDate: stopDate },
      });
      const dropIndexes = new Set();
      for (const row of normalizeArray(auditPayload?.verdicts)) {
        if (normalizeString(row?.verdict) !== "unordered") continue;
        const hit = unorderedCandidates.find((candidate) => candidate.id === normalizeString(row?.eventId));
        if (hit) dropIndexes.add(hit.index);
      }
      if (dropIndexes.size > 0) {
        // The WHOLE event goes — text and impacts together, so narration and
        // world state stay in agreement (rule #3) — and each one is named
        // (rule #1: nothing is dropped silently).
        for (const candidate of unorderedCandidates) {
          if (!dropIndexes.has(candidate.index)) continue;
          console.warn(`[sovereignty] dropped unordered act: "${candidate.title}" (${candidate.gains.join(", ")}) — no queued order authorizes it.`);
        }
        mergedEvents = mergedEvents.filter((_, index) => !dropIndexes.has(index));
      }
    } catch (error) {
      console.warn("[sovereignty] the audit pass failed — keeping every event.", error);
    }
  }
  // THE CALENDAR CARD, BUILT BY THE ENGINE.
  //
  // Asked as part of the jump it appeared 0 times in 7 (clause in the rules) and
  // 1 in 3 (clause at the end of the prompt) — docs/analysis/contract-ab-2026-08-09.md.
  // So the model is asked ONE small question on its own, exactly like the action
  // coverage pass above, and runtime/scheduledCard.js does the formatting and
  // every interval. The arithmetic was the part it got wrong most, and
  // arithmetic is not something to ask a language model for.
  //
  // Bounded and optional in the same way: if it fails or answers with nothing,
  // the turn is unaffected and simply carries no card.
  //
  // AND THE AUTHORED TIMELINE GOES IN FIRST. A scenario that ships a period
  // timeline (data/timelines/*.json) already KNOWS a set of dated things — that
  // is what those files are. Asking a 12B to recall them is asking it to guess
  // at data we hold, so the deterministic rows lead and the model only fills
  // what the timeline does not cover. Measured on gemma4-oh:12b: asked cold it
  // returns one entry, sometimes none, and the one it returns is usually the
  // next American election.
  // AND A BOARD CAN REFUSE THE CARD ENTIRELY.
  //
  // Three scenarios are built around the player NOT knowing what is coming:
  // Kaiserreich (its own rules forbid ever giving the player a date), The Fire
  // Rises (every link in its cascade depends on surprise) and the zombie board
  // (its whole first year is "nobody knows anything"). On those, a card reading
  // "Outbreak: in 11 months" does not spoil a turn, it deletes the design.
  //
  // Their specs have said `scheduledEvents: false` since they were written and
  // IT WAS DOING NOTHING — the flag had no reader anywhere in the repo, so all
  // three shipped printing the card they had opted out of. It reaches the
  // runtime through world.json now, and tests/preset-contracts.mjs holds every
  // opt-out in the fleet to the same standard so the next silent one is loud.
  const wantsSchedule = bundle.world?.scheduledEvents !== false;
  // ONLY FORESEEABLE ENTRIES, AND ONLY THEIR FORESEEABLE PHRASING.
  //
  // The suggestion board has held this line all along (foreseeableOutlook:
  // surprise is the default, and what it shows is the outcome-free sentence,
  // never the title). The card lagged on both counts — it printed every future
  // entry BY TITLE, and a timeline title carries the outcome ("문재인 대통령
  // 취임" tells the player who wins). That was a leak for every board, and for
  // a locked-timeline preset (TNO's own rules: "Do not mention events before
  // they occur") it was the difference between a hidden anchor and a spoiler
  // on the public calendar — the gap docs/analysis/tno-original-depth-pilot.md
  // measured this channel for. foreseeableFrom gates here too, same as the
  // board: a date announced mid-campaign is not on anyone's calendar before
  // the announcement.
  const authored = (wantsSchedule ? normalizeTimeline(bundle.world?.periodTimeline) : [])
    .filter((entry) => normalizeString(entry?.date) > stopDate)
    .filter((entry) => entry.foreseeable && !(entry.foreseeableFrom && entry.foreseeableFrom > stopDate))
    .slice(0, 10)
    .map((entry) => ({
      name: entry.foreseeable,
      whose: normalizeArray(entry?.actors)[0] ?? "",
      date: normalizeString(entry?.date),
      note: "",
    }));

  try {
    // Opted out: the pass is not run and `authored` is already empty, so
    // buildScheduledCard returns "" and no card is attached. Skipping here
    // rather than throwing keeps the catch below meaning what it says.
    const { payload: schedulePayload } = wantsSchedule ? await runJsonTask("scheduledEvents", {
      signal,
      timeoutMs: 120000,
      userMessage: [
        `The campaign has just advanced to ${stopDate}. Events of the period just simulated:`,
        ...mergedEvents.slice(0, 24)
          .map((event) => `- ${normalizeString(event?.date)} ${normalizeString(event?.title)}`),
        "",
        "List what is already on the calendar AFTER this date. Return JSON only.",
      ].join("\n"),
      variables: {
        ...variables,
        originRoundDate: stopDate,
      },
    }) : { payload: null };
    const card = buildScheduledCard([...authored, ...normalizeArray(schedulePayload?.entries)], stopDate);
    if (card) {
      mergedEvents = [...mergedEvents, {
        date: stopDate,
        description: card,
        impacts: {},
        importance: "minor",
        kind: "scheduled",
        notable: false,
        playerRelated: false,
        title: "Scheduled Events",
      }];
    }
  } catch (error) {
    console.warn("[schedule] the model pass failed; falling back to the authored timeline alone.", error);
    const card = buildScheduledCard(authored, stopDate);
    if (card) {
      mergedEvents = [...mergedEvents, {
        date: stopDate,
        description: card,
        impacts: {},
        importance: "minor",
        kind: "scheduled",
        notable: false,
        playerRelated: false,
        title: "Scheduled Events",
      }];
    }
  }

  // The pin itself. Dated at the stop date so it always sorts last, marked as
  // its own kind so the chronicle, the dedupe passes and the prompts can all
  // tell it apart from a real event (buildEventHistoryText skips it — it is a
  // clock marker, not something that happened).
  mergedEvents = [...mergedEvents, {
    date: stopDate,
    description: leftUncovered > 0
      ? localizeNames(timelineAdvanceNote(bundle.game.country, leftUncovered), nameDictionary)
      : "",
    impacts: {},
    importance: "minor",
    kind: TIMELINE_ADVANCE_KIND,
    notable: false,
    playerRelated: false,
    title: `${timelineAdvancePrefix()}${stopDate}`,
  }];

  const result = {
    catalyst: payload?.catalyst ?? null,
    // A queue with uncovered actions must NEVER be blanket-resolved: forcing
    // clearActions off keeps resolveAllFallback from wiping what the model
    // did not actually execute — they ride to the next turn instead.
    clearActions: payload?.clearActions !== false && leftUncovered === 0,
    events: mergedEvents,
    mode,
    outreach: mergedOutreach,
    // Scheduled entries this turn did not account for, so the next one can put
    // them back in front of the model instead of losing them.
    timelineBacklog: nextTimelineBacklog,
    // Fork rolls made this turn ride the result so the save remembers them.
    // Only when something was actually rolled — an unchanged map must not
    // overwrite what another write path may have added meanwhile.
    ...(branchRollsDirty ? { timelineBranchRolls } : {}),
    // Only set when the shipped timeline seeded or corrected this save's copy;
    // otherwise absent, so the write below leaves what is stored alone.
    ...(periodTimelineSource ? { periodTimeline, periodTimelineSource } : {}),
    stopDate,
    summary: normalizeString(payload?.summary),
    generation: leftUncovered > 0
      ? {
        ...generation,
        notice: `${leftUncovered} queued action(s) could not be played out this turn and stay in the queue.`,
      }
      : generation,
  };

  return applySimulationResult({
    baseActions: bundle.actions,
    baseChats: bundle.chats,
    baseColors,
    baseEvents: bundle.events,
    baseGame: bundle.game,
    baseWorld: bundle.world,
    result,
  });
  } finally {
    endSimulation();
  }
};

export const simulateAutoJump = async ({ days = 365, signal } = {}) =>
  simulateTimelineJump({ days, mode: "auto", signal });

export const applyGameMasterCommand = async (requestText) => {
  beginSimulation();
  try {
  const bundle = await readGameStateBundle({ force: true });
  const baseColors = await readJson(JSON_URLS.colors, { defaultValue: {}, force: true });
  const variables = await buildTemplateVariables(bundle, { gameMasterRequest: requestText });
  const { generation, payload } = await runJsonTask("gameMaster", {
    fallback: () => ({
      impacts: {
        polityChanges: [],
        regionTransfers: [],
      },
      summary: "No deterministic GM fallback changes were inferred from the request.",
    }),
    userMessage: "Apply the GM request as JSON only.",
    validatePayload: (candidate, { finalAttempt } = {}) =>
      validateGeneratedWorldChanges(candidate, bundle.world, { strictTransfers: !finalAttempt }),
    variables,
  });

  const gmEvent = normalizeGeneratedEvent({
    date: bundle.game.gameDate,
    description: normalizeString(payload?.summary),
    impacts: payload?.impacts,
    importance: "major",
    kind: "game-master",
    notable: true,
    playerRelated: true,
    title: "Game master intervention",
    source: generation.source,
  });

  if (!gmEvent) {
    throw new Error("The game master request did not produce a valid change set.");
  }

  return applySimulationResult({
    baseActions: bundle.actions,
    baseChats: bundle.chats,
    baseColors,
    baseEvents: bundle.events,
    baseGame: bundle.game,
    baseWorld: bundle.world,
    result: {
      catalyst: null,
      clearActions: false,
      events: [gmEvent],
      mode: "game-master",
      stopDate: bundle.game.gameDate,
      summary: gmEvent.description,
      generation,
    },
  });
  } finally {
    endSimulation();
  }
};

// ---- Pre-game history -------------------------------------------------------
// Pre-game backstory dates must sit strictly before round one. Strict/salvage
// like the jump validators: attempt 1 returns corrective errors the model can
// fix, attempt 2 drops what cannot be placed instead of rejecting the turn.
// Non-Gregorian scenarios ("1200 BCE") skip date checks entirely — the model
// is told to match the scenario's own dating style and we take it at its word.
const validatePregameEvents = (candidate, { startDate, strict }) => {
  const events = normalizeArray(candidate?.events);
  if (events.length === 0) return "$.events must contain at least one pre-game event.";
  if (!parseIsoDate(startDate)) return "";
  if (strict) {
    let previous = "";
    for (let index = 0; index < events.length; index += 1) {
      const date = normalizeString(events[index]?.date);
      if (!parseIsoDate(date)) {
        return `$.events[${index}].date must be a real YYYY-MM-DD date.`;
      }
      if (date >= startDate) {
        return `$.events[${index}].date must be strictly before the game start date ${startDate} — these events are pre-game history.`;
      }
      if (previous && date < previous) {
        return `$.events[${index}].date must not be earlier than the previous event — order the backstory chronologically.`;
      }
      previous = date;
    }
    return "";
  }
  candidate.events = events
    .filter((event) => {
      const date = normalizeString(event?.date);
      return parseIsoDate(date) && date < startDate;
    })
    .sort((a, b) => normalizeString(a.date).localeCompare(normalizeString(b.date)));
  return "";
};

// A fresh game whose scenario wrote a "World Before Round One" briefing gets
// its backstory generated once, the first time the player opens it: the
// briefing (plus rules and map) becomes real timeline events dated before the
// start. Deliberately NOT applySimulationResult — the clock must stay at the
// start date, round must stay 1, and backstory events carry no impacts (the
// scenario's world already reflects them). The simulationHistory entry it
// writes doubles as the done-marker, so it can never run twice.
export const maybeGeneratePregameHistory = async () => {
  if (isSimulationBusy()) return null;
  const bundle = await readGameStateBundle({ force: true });
  const briefing = normalizeString(bundle.world.startingTimelineText);
  if (!briefing) return null;
  if (normalizeEvents(bundle.events).length > 0) return null;
  if ((normalizeWorldState(bundle.world).simulationHistory ?? []).length > 0) return null;
  const startDate = normalizeString(bundle.game.startDate || bundle.game.gameDate);
  if (!startDate) return null;

  beginSimulation();
  try {
    const variables = await buildTemplateVariables(bundle);
    const { payload } = await runJsonTask("pregameHistory", {
      timeoutMs: getMapSetting(MAP_SETTING_KEYS.limitAiGeneration) ? 300000 : 0,
      userMessage: "Write the pre-game historical timeline as JSON only.",
      validatePayload: (candidate, { finalAttempt } = {}) =>
        validatePregameEvents(candidate, { startDate, strict: !finalAttempt }),
      variables,
    });

    // The player may have switched games while this generated — the runtime
    // endpoints follow the ACTIVE game, so re-verify the same fresh game is
    // still there before writing anything.
    const [eventsNow, worldNow, gameNow] = await Promise.all([
      readEventsState({ force: true }),
      readWorldState({ force: true }),
      readGameData({ force: true }),
    ]);
    if (normalizeEvents(eventsNow).length > 0) return null;
    const currentWorld = normalizeWorldState(worldNow);
    if ((currentWorld.simulationHistory ?? []).length > 0) return null;
    if (normalizeString(gameNow.startDate || gameNow.gameDate) !== startDate) return null;

    const generatedEvents = normalizeArray(payload?.events)
      .map((entry, index) =>
        normalizeGeneratedEvent({ ...entry, impacts: undefined, source: "pregame" }, index))
      .filter(Boolean);
    if (generatedEvents.length === 0) return null;

    const summary = normalizeString(payload?.summary);
    currentWorld.simulationHistory = [
      {
        catalyst: null,
        date: startDate,
        eventIds: generatedEvents.map((event) => event.id),
        fallbackReason: "",
        fromDate: normalizeString(generatedEvents[0]?.date) || startDate,
        mode: "pregame",
        plannedActions: [],
        round: 1,
        summary,
        source: "ai",
        toDate: startDate,
      },
    ];
    await Promise.all([
      writeEventsState(generatedEvents),
      writeWorldState(currentWorld),
    ]);
    return generatedEvents;
  } catch {
    // Silent: backstory is a bonus. The next open retries.
    return null;
  } finally {
    endSimulation();
  }
};

// ---- Idle diplomacy drip ----------------------------------------------------
// While the player sits between jumps, the world occasionally speaks first:
// on each real-world-minute tick (the caller's cadence) there is a small chance
// one polity sends a short note to the player's inbox. Hard-suspended while any
// simulation is in flight (busy lock above), never stacked, and silent on any
// failure — there is no canned fallback small talk.
// Raised from 1/20: at 1/20 (with a 60s visible-tab-only roll) a player waited ~20
// idle minutes just to CONSULT the model, and most consulted rolls still returned
// null — so AI-initiated chats felt almost nonexistent. 1/8 keeps a parked tab from
// filling the inbox while making an idle approach actually plausible; the jump-path
// cap (see defaultPrompts.json) remains the primary source of diplomacy.
const IDLE_DIPLOMACY_CHANCE = 1 / 8;
let idleDiplomacyInFlight = false;
// HOOK 2 (docs/STAT-HOOKS.md), the idle half: how often the world speaks first
// tracks how the world regards the player. The factor is cached from the last
// consult's own bundle read (the roll must stay IO-free — it fires every
// visible minute), so it lags one consult behind reality, which is fine for a
// number that moves a few points a month. ≥70 → ×1.5, <40 → ×0.5.
let idleReputationFactor = 1;

export const maybeSendIdleDiplomacy = async ({ chance = IDLE_DIPLOMACY_CHANCE } = {}) => {
  if (idleDiplomacyInFlight || isSimulationBusy()) return null;
  if (Math.random() >= chance * idleReputationFactor) return null;
  idleDiplomacyInFlight = true;
  try {
    const bundle = await readGameStateBundle({ force: true });
    if (!normalizeString(bundle.game?.country)) return null; // no active game
    const variables = await buildTemplateVariables(bundle);
    {
      const match = /International reputation: (\d+)/.exec(normalizeString(variables?.playerPolityReputationContext));
      const reputation = match ? Number(match[1]) : NaN;
      idleReputationFactor = !Number.isFinite(reputation) ? 1 : reputation >= 70 ? 1.5 : reputation < 40 ? 0.5 : 1;
    }
    const { payload } = await runJsonTask("idleDiplomacy", {
      timeoutMs: getMapSetting(MAP_SETTING_KEYS.limitAiGeneration) ? 60000 : 0,
      userMessage:
        "A quiet moment between rounds. Decide whether any single polity would send the player a short diplomatic note right now. Return JSON only.",
      validatePayload: async (candidate, { finalAttempt } = {}) => {
        if (candidate?.chat == null) return "";
        const countries = await resolveInvitees(candidate.chat.countries, bundle.world);
        if (countries.length === 0) {
          return "$.chat.countries must contain at least one known polity (or chat must be null).";
        }
        // Strict on attempt 1: make the model give the note a title AND a first
        // line, so the player can see why the polity reached out. Salvage on the
        // final attempt — buildGeneratedChat drops an opener-less note rather
        // than posting an empty "mystery" thread.
        return finalAttempt ? "" : validateChatOpener(candidate.chat, "$.chat");
      },
      variables,
    });
    if (!payload?.chat) {
      // Spoken, not silent: 42 rounds of "silence is the safe outcome" proved
      // silence is also indistinguishable from broken. One line per consult.
      console.info("[diplomacy] idle consult: nobody sends a note right now.");
      return null;
    }
    // A jump may have started while the model was thinking; its state bundle
    // predates our write, so drop the note rather than race the save.
    if (isSimulationBusy()) return null;
    const built = await buildGeneratedChat({ ...payload.chat, source: "outreach" }, "", bundle.world, {
      playerName: bundle.game.country,
    });
    if (!built) return null;
    const chats = normalizeChats(await readChatsState({ force: true }));
    // A note from a country the player already has an open 1:1 with lands in
    // that thread; anything else (including group approaches) opens a new chat.
    const single = built.countries.length === 1 ? regionKey(built.countries[0].name) : "";
    const existing = single
      ? chats.find((chat) => chat.status !== "closed"
          && Array.isArray(chat.countries)
          && chat.countries.length === 1
          && regionKey(chat.countries[0]?.name) === single)
      : null;
    let nextChats;
    if (existing) {
      const note = built.messages[0];
      if (!note) return null;
      nextChats = chats.map((chat) => (chat === existing
        ? { ...chat, messages: [...chat.messages, { ...note, time: normalizeString(bundle.game?.gameDate) }] }
        : chat));
    } else {
      nextChats = [built, ...chats];
    }
    if (isSimulationBusy()) return null;
    await writeChatsState(nextChats);
    console.info(
      `[diplomacy] ${built.countries.map((country) => country?.name ?? country).join(", ")} sent an unprompted note`
      + `${existing ? " into the open thread" : ""}: "${normalizeString(built.title)}"`,
    );
    return built;
  } catch (error) {
    // Failing quietly is safe for the SAVE but fatal for trust in the feature —
    // this exact drip ran for a whole campaign with nothing to show and nothing
    // to debug. The player reads these consoles; give the failure a line.
    console.warn("[diplomacy] idle outreach attempt failed:", error);
    return null;
  } finally {
    idleDiplomacyInFlight = false;
  }
};

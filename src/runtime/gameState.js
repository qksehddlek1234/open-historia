/*! Open Historia — portions (troop deployments + era troop types) © 2026 Nicholas Krol, MIT (see src/Editor/LICENSE). */
import { JSON_URLS, readJson, writeJson } from "./assets.js";
import { enqueueContentStrings } from "./translator.js";
import { normalizeTagList } from "./countryTags.js";
import { dedupeEventLog } from "./eventDedup.js";
import { resolveFeatureKind } from "./featureKinds.js";
import { normalizeLedger } from "./campaignLedger.js";
import { normalizeDiplomaticRelations } from "./diplomacy.js";
import { normalizeActionOutcome } from "./difficulty.js";
import { gluedRecordProse, mergeRecoveredProse, repairGluedAction, repairGluedRecord, stripMachineSyntax, stripVoiceLabels } from "./machineSyntax.js";
import { applyCanonRenames, setCanonRenames } from "./nameCanon.js";
import { isTerritorylessVoiceName } from "./internalVoices.js";
import { toCountryName } from "./ownerNames.js";
import { normalizeTimeline } from "./periodTimeline.js";
import { normalizePersonality } from "./countryPersonality.js";

export const GAME_DEFAULTS = {
  country: "",
  difficulty: "standard",
  gameDate: "",
  language: "English",
  round: 1,
  startDate: "",
};

export const WORLD_DEFAULTS = {
  actionSuggestions: [],
  activeCatalyst: null,
  campaignLedger: [],
  consolidatedHistory: [],
  // Per-polity international reputation (0-100), evolved by the AI each turn via
  // polityChanges and fed back into prompts. Authoritative, unlike the on-demand
  // stat sheet it was first read from.
  internationalReputation: {},
  // Persisted per-country stat sheets (code -> the full sheet), generated on view.
  // This is the BASE, not the campaign's word on it: it is date-stamped
  // (__asOf) and refreshes when the calendar moves. What the campaign actually
  // did to a country lives in countryStatChanges and always wins over this.
  countryStats: {},
  // How many of the player's orders this difficulty still expects to have come
  // out less than cleanly (runtime/difficulty.js). A frictionless turn on Hard or
  // above leaves a debt here rather than being forgotten, so the setting cannot
  // silently mean nothing for thirty rounds.
  setbackShortfall: 0,
  // Code -> only the stat fields this campaign MOVED, with nothing else in them.
  // Kept apart from countryStats because the two were one slot for 28 rounds and
  // the result was that neither worked: the base could never refresh (a complete
  // sheet short-circuited the loader) and the deltas had nowhere to accumulate,
  // so a player's GDP sat unchanged for 27 rounds. See runtime/countryStatLedger.js.
  countryStatChanges: {},
  // Per-country tags the AI has changed: owner code -> string[]. The scenario's
  // tags.json holds the map-maker's STARTING tags; this holds every change since,
  // and wins where present (see resolveCountryTags).
  countryTags: {},
  // Per-country behavioural profiles (see runtime/countryPersonality.js): how a
  // power ACTS when something happens to it, carried between turns instead of
  // re-improvised every jump. Absent entries are DERIVED from tags and standing,
  // so an empty map here is normal, not a missing feature.
  countryPersonalities: {},
  // Situation-aware advisor prompt chips, regenerated once a round
  // (generateAdvisorTopics). { round, questions } — cached here rather than in
  // localStorage so they follow the SAVE, like everything else the AI wrote.
  advisorTopics: null,
  // AI renames of STOCK map cities (which live in PMTiles, not world.markers):
  // lowercased original city name -> new display name. world.markers cities are
  // renamed in place by applyMarkerOps; this is the override layer for the rest.
  cityRenames: {},
  // Names this campaign RETIRED: old name -> replacement, applied to every
  // action, event and marker at normalize time (see runtime/nameCanon.js).
  // Written when a canon rename sweep runs; empty for campaigns that never
  // needed one.
  nameRenames: {},
  diplomaticRelations: {},
  // Country-label styling, set in the scenario settings. Empty = the defaults
  // (Impact, white letters, half-black outline). The font renders from the
  // PLAYER's local fonts — the style has no glyphs endpoint, so MapLibre v5
  // rasterizes every glyph client-side using the stack as a CSS font-family.
  labelFont: "",
  labelHaloColor: "",
  labelTextColor: "",
  language: "English",
  lastJumpMode: "",
  lastJumpSummary: "",
  lastJumpTargetDate: "",
  // Structures built during play (world.markers[]): free-form kinds — a city, a
  // military base, a bunker, a missile silo, an embassy — placed at coordinates
  // and rendered as map markers beside the stock cities. Stored here so they
  // share every existing read/write/poll/normalize path, exactly like units.
  markers: [],
  notes: "",
  polityOverrides: {},
  // Region id -> claimant polity names: the world-data way to mark a region
  // DISPUTED (striped in the administrator's + claimants' colors). Same effect
  // as a claimants list on the region's geojson feature, but declarable by a
  // scenario whose geometry ships as an immutable seed (the modern world), and
  // overridable per-world without touching geometry. Wins over feature props.
  regionClaimants: {},
  regionOwnershipOverrides: {},
  // The board's STARTING ownership, where it differs from the geometry the store
  // serves. Written once by share-base-map, then read-only forever.
  //
  // Only a scenario borrowing the shared base map has one. Its geometry carries
  // MODERN owners, so "live override disagrees with the feature" — the test that
  // means conquest on a board with its own map — is true for every region the era
  // ever differed on. Without this, 1962 opens with 3,948 conquest borders.
  baselineOwnership: {},
  // Region ids that are EXPLICITLY UNOWNED — a separate channel from the
  // override table on purpose.
  //
  // The obvious encoding, an override with an empty owner, is already taken and
  // already means something else: a save damaged by the owner-blanking bug
  // carries blank overrides, so every consumer reads blank as "damaged, fall
  // through to the geometry's own owner" (Nations.jsx ownerByRegionId spells
  // this out) and the normaliser below drops them outright. Reusing it would
  // make an intended statement indistinguishable from a corrupted one.
  //
  // Why it needs saying at all: a scenario that borrows the shared base map
  // inherits the base's owners, and the base is the modern world where nothing
  // is unclaimed. Rome in 117 leaves 3,300 regions to nobody; without a way to
  // cancel an inherited owner, those regions would quietly belong to Russia,
  // the United States and Fiji. Empty on every save written before this — an
  // absent list means "nothing to cancel", which is what those saves meant.
  unownedRegionIds: [],
  simulationHistory: [],
  simulationRules: "",
  startingTimelineText: "",
  // The scenario's own schedule: what is set to happen, and when (see
  // runtime/periodTimeline.js). Seeded from the scenario and thereafter part of
  // the save, so a campaign that diverges keeps the timeline it diverged from.
  periodTimeline: [],
  // Which shipped timeline that copy came from, and at what revision — so a
  // correction to the shipped file reaches a campaign already in progress instead
  // of being frozen out of it. See runtime/timelineLibrary.js.
  periodTimelineSource: { id: "", revision: 0 },
  // Entries whose window has passed without the turn accounting for them. They
  // are re-offered next turn rather than dropped — an entry that never appears is
  // the same silent loss as an order that never resolves.
  timelineBacklog: [],
  // Which branch each scripted fork on the timeline rolled, keyed by entry id
  // (see periodTimeline.js `branches`). Rolled once per campaign by the jump
  // flow and remembered here so retries and later turns tell one history —
  // and so a replayed campaign can roll differently.
  timelineBranchRolls: {},
  units: [],
};

// A repair worth saying ONCE. A fused record keeps its fusion in storage until
// the next save write-back, and normalize runs on every poll — an un-keyed log
// printed the same marker repair 145 times in one session (live count, round
// 44, the same lesson the standing guard already learned). The repair itself
// still runs every time; only the sentence is deduplicated.
const FUSION_ALREADY_LOGGED = new Set();
const logFusionRepairOnce = (message) => {
  if (FUSION_ALREADY_LOGGED.has(message)) return;
  FUSION_ALREADY_LOGGED.add(message);
  console.info(message);
};

// Military units that ride along inside world state (world.units[]). Stored here
// so they share every existing read/write/poll/normalize path with no server change.
export const UNIT_TYPES = ["infantry", "armor", "air", "naval", "artillery", "garrison"];
const UNIT_TYPE_SET = new Set(UNIT_TYPES);

// Unit types that fight on the ground. Air and naval units legitimately sit over
// water; these must not.
export const LAND_UNIT_TYPES = new Set(["infantry", "armor", "artillery", "garrison"]);

// Display names for unit types. These used to be bare English words rendered
// through the UI's machine translator, which reads them WITHOUT their military
// sense — "armor" came out as 방어 (protection) and "air" as 공기 (the gas), so a
// Korean player saw a defence unit and a gas unit on their map. The words are
// too short to disambiguate, so the correct terms are given directly; a language
// with no entry falls back to English exactly as before.
const UNIT_TYPE_LABELS = {
  en: { infantry: "Infantry", armor: "Armor", air: "Air", naval: "Naval", artillery: "Artillery", garrison: "Garrison" },
  ko: { infantry: "보병", armor: "기갑", air: "공군", naval: "해군", artillery: "포병", garrison: "주둔군" },
};

// Display names for unit STATUS, for the same reason as the types above and with
// a worse failure: run through the UI's machine translator, the English word
// "idle" comes back as 아이들 — which in Korean reads as "children". A player
// clicking their army was told it was staffed by children.
//
// What the values mean, since the popup only ever showed the bare word:
//   idle      no order in progress — garrisoned, holding, awaiting instructions
//   moving    en route to a destination
//   engaged   in contact with an enemy
//   defeated  destroyed; applyUnitOps removes it from the map
//   pending   a deployment the player has ordered but the AI has not yet
//             resolved — drawn translucent until the turn plays out
const UNIT_STATUS_LABELS = {
  en: { idle: "Idle", moving: "Moving", engaged: "Engaged", defeated: "Defeated", pending: "Pending" },
  ko: { idle: "대기", moving: "이동 중", engaged: "교전 중", defeated: "괴멸", pending: "명령 대기" },
};

const uiLanguageCode = (language = "") => {
  const explicit = String(language || "").toLowerCase();
  if (explicit) return explicit;
  try {
    return String(localStorage.getItem("ui_language") || "").replace(/"/g, "").toLowerCase();
  } catch {
    return "";
  }
};

export const unitStatusLabel = (status, language = "") => {
  const key = String(status || "").toLowerCase();
  const table = UNIT_STATUS_LABELS[uiLanguageCode(language)] ?? UNIT_STATUS_LABELS.en;
  return table[key] ?? UNIT_STATUS_LABELS.en[key] ?? key;
};

export const unitTypeLabel = (type, language = "") => {
  const key = String(type || "").toLowerCase();
  let code = String(language || "").toLowerCase();
  if (!code) {
    try {
      code = String(localStorage.getItem("ui_language") || "").replace(/"/g, "").toLowerCase();
    } catch {
      code = "";
    }
  }
  const table = UNIT_TYPE_LABELS[code] ?? UNIT_TYPE_LABELS.en;
  return table[key] ?? UNIT_TYPE_LABELS.en[key] ?? key;
};
// "pending" = a player deployment awaiting AI resolution (rendered translucent).
const UNIT_STATUS_SET = new Set(["idle", "moving", "engaged", "defeated", "pending"]);
const UNIT_SOURCE_SET = new Set(["player", "ai", "scenario"]);

// Every caller of this parses a COORDINATE (lng/lat/toLng/toLat), which is why it
// can afford to be lenient in ways a general number parser could not.
//
// It used to be a bare Number(), and a model writing in a language that uses the
// decimal COMMA answers "37,06" — Number() returns NaN, the unit is discarded, and
// the player sees an event describing a deployment with no troops on the map. The
// same went for a coordinate carrying its unit ("37.06°N"). Recover both instead of
// throwing the deployment away.
//
// A comma is only read as a decimal point when it is the ONLY separator: "1,234.5"
// keeps its usual meaning, so a thousands separator can never silently divide a
// value by a thousand.
const finiteOrNull = (value) => {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value !== "string") {
    const num = Number(value);
    return Number.isFinite(num) ? num : null;
  }

  let text = value.trim();
  if (!text) return null;

  // A trailing or leading hemisphere letter carries the sign: 37.06 S is -37.06.
  let sign = 1;
  const hemisphere = /^([NSEW])\s*|\s*([NSEW])$/i.exec(text);
  if (hemisphere) {
    const letter = (hemisphere[1] || hemisphere[2]).toUpperCase();
    if (letter === "S" || letter === "W") sign = -1;
    text = text.replace(/^[NSEW]\s*/i, "").replace(/\s*[NSEW]$/i, "");
  }

  if (text.includes(",") && !text.includes(".")) text = text.replace(",", ".");
  // Degree signs, stray spaces, anything else that is not part of a number.
  text = text.replace(/[^\d+\-.eE]/g, "");
  if (!text || !/\d/.test(text)) return null;

  const num = Number(text);
  return Number.isFinite(num) ? sign * num : null;
};

export const clampUnitStrength = (value) => {
  const num = Number(value);
  if (!Number.isFinite(num)) return 100;
  return Math.max(0, Math.min(1000, Math.round(num)));
};

const cloneValue = (value) => {
  if (value == null) return value;
  if (typeof structuredClone === "function") {
    return structuredClone(value);
  }

  return JSON.parse(JSON.stringify(value));
};

const normalizeString = (value) => String(value ?? "").trim();

// Salvage debris. The AI layer runs a deep repair stack — lenient parsing,
// truncated-JSON closing, schema coercion — so that a good answer wrapped in bad
// syntax is not thrown away, and it earns its keep. What it also does, when the
// break lands mid-string, is hand back the recovered text with the syntax still
// attached: a live turn produced the event title
//
//   동아시아 에너지 협력체에 대한 다자간 파트너십 및 갈등 관리 기조",
//
// and that trailing `",` went to the timeline, to the chronicle, and into the
// next turn's prompt as context. No title, name or label in any language ends in
// a quote followed by a comma, or in a lone brace or bracket, so trimming that
// tail costs nothing real and stops the wreckage surfacing. Deliberately narrow:
// only leading/trailing structural punctuation, never anything interior, so a
// quoted phrase inside a sentence survives untouched.
const STRUCTURAL_EDGE = /^[\s"'`,;:{}[\]]+|[\s"'`,;:{}[\]]+$/g;

const trimStructuralDebris = (value) => {
  const text = normalizeString(value);
  if (!text) return "";
  const trimmed = text.replace(STRUCTURAL_EDGE, "");
  // A string made ENTIRELY of punctuation trims to nothing; keep the original in
  // that case so the caller's own "is this empty" logic decides what to do,
  // rather than silently inventing an empty title here.
  return trimmed || text;
};

const normalizeOptionalString = (value) => {
  const nextValue = trimStructuralDebris(value);
  return nextValue || "";
};

const normalizeArray = (value) => (Array.isArray(value) ? value : []);

const normalizeTextLike = (value) => {
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return normalizeOptionalString(value);
  }

  if (value && typeof value === "object") {
    return normalizeOptionalString(
      value.text ??
        value.title ??
        value.label ??
        value.name ??
        value.summary ??
        value.description ??
        value.content ??
        value.result,
    );
  }

  return "";
};

const generateId = (prefix) =>
  `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;

const normalizeActionParticipants = (value) =>
  normalizeArray(value)
    .map((entry) => normalizeString(entry))
    .filter(Boolean);

// How to undo a queued manual troop order if its action is deleted before the
// next jump (see unitsController): a deploy is removed again, a move snaps the
// unit back, a long-range order restores the prior status (#368).
const normalizeUnitRevert = (value) => {
  if (!value || typeof value !== "object") return null;
  const unitId = normalizeOptionalString(value.unitId);
  if (!unitId) return null;
  const lng = finiteOrNull(value.lng);
  const lat = finiteOrNull(value.lat);
  return {
    unitId,
    ...(lng !== null && lat !== null ? { lng, lat } : {}),
    ...(value.remove === true ? { remove: true } : {}),
    ...(normalizeOptionalString(value.status) ? { status: normalizeOptionalString(value.status) } : {}),
  };
};

export const normalizeActionEntry = (entry, index = 0) => {
  if (typeof entry === "string") {
    const text = normalizeString(entry);
    if (!text) return null;

    return {
      createdAt: new Date().toISOString(),
      id: generateId(`action-${index}`),
      kind: "action",
      participants: [],
      rawInput: text,
      source: "manual",
      status: "planned",
      text,
      // No title. A player's order is the sentence they wrote; naming it after
      // itself just prints it twice. See the object branch below.
      title: "",
    };
  }

  if (!entry || typeof entry !== "object") {
    return null;
  }

  // THE ENGINE'S OWN VOCABULARY, OUT OF THE ORDER THE PLAYER READS.
  //
  // 42 region ids reached the live order list as 경기(KOR.8_1), 부산(KOR.1_1),
  // 제주(KOR.12_1) — and ZERO reached the event list, because scrubMachineSyntax
  // walks the AI's events and nothing walked the actions. An id is how the engine
  // keys a region; the province name in front of it already says everything the
  // sentence needs, and the parenthesis says nothing to a reader at all.
  //
  // Both the displayed field and rawInput, deliberately. rawInput is what rides
  // in every later prompt, so leaving the ids there feeds the model its own habit
  // back — that is where "Gyeonggi-do(KOR.8_1)" came from in the first place.
  // applyCanonRenames after the scrub: retired brand names ("Quantum-Trace")
  // are rewritten to the campaign's Korean canon on EVERY read, so a name the
  // sweep retired can never re-enter the queue through a fresh suggestion.
  const rawInput = applyCanonRenames(stripMachineSyntax(
    normalizeTextLike(entry.rawInput || entry.input || entry.text || entry.content)));
  const text = applyCanonRenames(stripMachineSyntax(
    normalizeTextLike(entry.text || entry.content || entry.body || rawInput)));
  // A title is a SHORT LABEL that is not the order itself. The brainstormer writes
  // real ones ("강력한 대북 억제력 강화" over a paragraph of detail); a hand-typed order
  // has none, and inventing one from its own text meant the player saw their
  // sentence twice — once as a heading, once as the body — and the prompt sent it
  // twice too. Field report: an order edited before submitting came back looking
  // like an AI suggestion whose title was the entire body.
  //
  // Old saves are healed on read: a stored title that IS the body, or a truncation
  // of it, was this bug rather than something anyone chose.
  let rawTitle = normalizeTextLike(entry.title || entry.name);
  let body = text;
  // TWO FIELDS THE SALVAGE STACK FUSED INTO ONE.
  //
  // Live: an order whose title read 원격지 정밀 타격 모의 훈련", "text": "실제
  // 발사 없이도 … — 111 characters with a JSON key in the middle, shown on the
  // suggestion board and then submitted, so it rode in every prompt after.
  // Repaired here rather than at the brainstormer because EVERY order comes
  // through this function: suggested, hand-typed, AI-refined, or read back from
  // a save that already holds one. See runtime/machineSyntax.js for why this
  // splits rather than strips.
  const repaired = repairGluedAction({ title: rawTitle, text: body });
  if (repaired) {
    console.info(`[actions] repaired an order whose title had "${repaired.key}" fused into it: "${repaired.title}".`);
    rawTitle = repaired.title;
    body = repaired.text;
  }
  // After the split, never before it: GLUED_FIELD needs the quotes and the colon
  // still in place to recognise a fusion, and scrubbing first would leave the
  // two halves welded together with nothing left to cut on.
  rawTitle = applyCanonRenames(stripMachineSyntax(rawTitle));
  const titleStem = rawTitle.replace(/\.\.\.$/, "").trim();
  const echoesBody = Boolean(titleStem) && Boolean(body)
    && (titleStem === body || (titleStem.length >= 24 && body.startsWith(titleStem)));
  const title = echoesBody ? "" : rawTitle;

  if (!title && !body && !rawInput) {
    return null;
  }

  const kind =
    normalizeString(entry.kind || entry.type).toLowerCase() === "chat"
      ? "chat"
      : "action";

  const unitRevert = normalizeUnitRevert(entry.unitRevert);

  return {
    chatStarter: normalizeOptionalString(entry.chatStarter || entry.openingMessage),
    createdAt: normalizeOptionalString(entry.createdAt) || new Date().toISOString(),
    id: normalizeOptionalString(entry.id) || generateId(`action-${index}`),
    invitees: normalizeActionParticipants(entry.invitees),
    kind,
    participants: normalizeActionParticipants(entry.participants),
    rawInput: rawInput || body || title,
    // WHEN the order was carried out. A turn covers weeks and its events are
    // dated across them, but an action only ever recorded that it was "resolved",
    // so a whole queue read as having happened on a single day. Preserved here,
    // or the engine's stamp would be wiped on the next normalise pass.
    // HOW it went, not just that it was carried out. Only ever set on a resolved
    // order — a planned one has no outcome yet, and defaulting it to "succeeded"
    // would say the opposite. See runtime/difficulty.js.
    ...(normalizeOptionalString(entry.outcome) ? { outcome: normalizeActionOutcome(entry.outcome) } : {}),
    ...(normalizeOptionalString(entry.outcomeNote) ? { outcomeNote: applyCanonRenames(normalizeOptionalString(entry.outcomeNote)).slice(0, 240) } : {}),
    // How many times this order has now failed or backfired. Present only once
    // it has (see stallAfterFailures) — an order that has never failed carries
    // no counter at all.
    ...(Number.isFinite(Number(entry.failCount)) && Number(entry.failCount) >= 1
      ? { failCount: Math.min(9, Math.round(Number(entry.failCount))) }
      : {}),
    ...(normalizeOptionalString(entry.resolvedDate) ? { resolvedDate: normalizeOptionalString(entry.resolvedDate) } : {}),
    ...(Number.isFinite(Number(entry.resolvedRound)) ? { resolvedRound: Number(entry.resolvedRound) } : {}),
    source: normalizeOptionalString(entry.source) || "manual",
    status: normalizeOptionalString(entry.status) || "planned",
    suggestionTopic: normalizeOptionalString(entry.suggestionTopic || entry.topic),
    text: body || rawInput || title,
    // Deliberately NOT `title || rawInput || text`. That fallback is what actually
    // titled a hand-typed order after itself — the derivation above was only half
    // the story — and it was reached by every order the player wrote, since those
    // are exactly the ones with no title. An order with a body needs no heading.
    title: title || (body || rawInput ? "" : rawInput || body),
    ...(unitRevert ? { unitRevert } : {}),
  };
};

// Resolution is keyed by action id the whole way down the pipeline (the alias map
// the model is shown, the covered-id set, the resolved/planned split), and every
// one of those is a Map or a Set. Two orders sharing an id therefore become ONE
// order to the bookkeeping: resolve the event that names it and both are marked
// resolved, including the one nobody carried out. Ids are random enough that this
// should not happen on its own — but "should not" is not a guarantee, the cost of
// checking is a single Set, and the failure it prevents is the silent drop this
// engine is built around.
// A FAILED ORDER RETRIES ONCE, THEN WAITS FOR THE PLAYER.
//
// The bounce design says a failed order "goes back in the queue for the player
// to reconsider" — but nothing implemented the reconsidering. The queue showed
// it identical to a fresh order and the next turn re-ran it verbatim, so the
// live save grew orders failing on repeat: 대안 경로 확보 failed in round 36
// and again in 38, 차세대 그린 통신망 in 37 and again in 38, each time with a
// fresh reason and no way for the player to even see one. One automatic retry
// is fair — the world moves, a second attempt is a real attempt. After the
// SECOND failure the order STALLS: it stays in the queue, loudly labelled, and
// is excluded from resolution until the player retries (clearing the counter),
// edits it, or deletes it. Nothing is dropped; it is parked in plain sight.
export const STALL_AFTER_FAILURES = 2;

export const isStalledOrder = (action) =>
  (action?.status ?? "planned") === "planned"
  && (Number(action?.failCount) || 0) >= STALL_AFTER_FAILURES;

// The queue as the SIMULATION sees it: planned and not stalled. Prompt-history
// and dedup lists keep reading the full planned set — a stalled order must
// still stop the brainstormer from re-suggesting the same work.
export const activeOrders = (actions) =>
  normalizeActions(actions).filter((action) => action.status === "planned" && !isStalledOrder(action));

export const normalizeActions = (actions) => {
  const seen = new Set();
  return normalizeArray(actions)
    .map((entry, index) => normalizeActionEntry(entry, index))
    .filter(Boolean)
    .map((action, index) => {
      const id = String(action.id);
      if (!seen.has(id)) {
        seen.add(id);
        return action;
      }
      // Keep the order, give it its own identity. Suffixing rather than
      // regenerating keeps it recognisable in a log next to its twin.
      let unique = `${id}-dup${index}`;
      while (seen.has(unique)) unique = `${unique}x`;
      seen.add(unique);
      console.warn(`[actions] duplicate action id "${id}" — re-keyed to "${unique}" so both orders resolve independently.`);
      return { ...action, id: unique };
    });
};

// CATALYST PROSE IS PROSE TOO.
//
// Events and orders have been scrubbed since the salvage stack started
// manufacturing JSON debris (stripMachineSyntax above); a catalyst's title,
// premise, opening, choices and step summaries never were, although they are
// written by the same salvage-wrapped model and read by the same player. Two
// shapes reach the screen through this gap: a region id in the middle of a
// scene, and — measured on the voices × catalyst cells (PC 11차) — an advisor's
// raw "Internal:" label staged as a character. Both come out here.
const normalizeSceneText = (value) => stripMachineSyntax(normalizeTextLike(value));

const normalizeCatalystChoice = (entry, index = 0) => {
  if (typeof entry === "string") {
    const text = stripMachineSyntax(entry);
    if (!text) {
      return null;
    }

    return {
      id: generateId(`catalyst-choice-${index}`),
      result: "",
      text,
    };
  }

  if (!entry || typeof entry !== "object") {
    return null;
  }

  const text = normalizeSceneText(entry.text || entry.title || entry.label || entry.name);
  if (!text) {
    return null;
  }

  return {
    ...cloneValue(entry),
    id: normalizeOptionalString(entry.id) || generateId(`catalyst-choice-${index}`),
    result: normalizeSceneText(entry.result || entry.summary || entry.outcome || entry.effect || entry.description),
    text,
  };
};

const normalizeCatalystHistoryEntry = (entry, index = 0) => {
  if (typeof entry === "string") {
    const summary = stripMachineSyntax(entry);
    if (!summary) {
      return null;
    }

    return {
      choice: `Step ${index + 1}`,
      summary,
    };
  }

  if (!entry || typeof entry !== "object") {
    return null;
  }

  const choice = normalizeSceneText(entry.choice || entry.text || entry.title || entry.name);
  const summary = normalizeSceneText(entry.summary || entry.result || entry.outcome || entry.description);

  if (!choice && !summary) {
    return null;
  }

  return {
    ...cloneValue(entry),
    choice: choice || `Step ${index + 1}`,
    summary,
  };
};

const normalizeCatalyst = (value) => {
  if (!value || typeof value !== "object") {
    return null;
  }

  const title = normalizeSceneText(value.title || value.name);
  const premise = normalizeSceneText(value.premise || value.summary || value.description);
  const opening = normalizeSceneText(value.opening || value.text || premise);
  const choices = normalizeArray(value.choices)
    .map((entry, index) => normalizeCatalystChoice(entry, index))
    .filter(Boolean);
  const history = normalizeArray(value.history)
    .map((entry, index) => normalizeCatalystHistoryEntry(entry, index))
    .filter(Boolean);

  if (!title && !premise && !opening && choices.length === 0 && history.length === 0) {
    return null;
  }

  return {
    ...cloneValue(value),
    choices,
    history,
    opening,
    premise,
    title,
  };
};

const normalizeReactionMap = (value) => {
  if (!value || typeof value !== "object") {
    return {};
  }

  return Object.fromEntries(
    Object.entries(value)
      .map(([name, reaction]) => {
        if (!reaction || typeof reaction !== "object") {
          return [name, null];
        }

        const emoji = normalizeOptionalString(reaction.emoji);
        const code = normalizeOptionalString(reaction.code);

        if (!emoji && !code) {
          return [name, null];
        }

        return [
          name,
          {
            ...(code ? { code } : {}),
            ...(emoji ? { emoji } : {}),
          },
        ];
      })
      .filter(([, reaction]) => reaction),
  );
};

const normalizeChatMessage = (message, index = 0) => {
  if (typeof message === "string") {
    const text = normalizeString(message);
    if (!text) return null;

    return {
      code: "",
      id: generateId(`message-${index}`),
      reactions: {},
      role: "system",
      speaker: "",
      text,
      time: "",
    };
  }

  if (!message || typeof message !== "object") {
    return null;
  }

  const text = normalizeOptionalString(message.text || message.message || message.content);
  if (!text) {
    return null;
  }

  return {
    code: normalizeOptionalString(message.code),
    id: normalizeOptionalString(message.id) || generateId(`message-${index}`),
    reactions: normalizeReactionMap(message.reactions),
    role: normalizeOptionalString(message.role || message.sender) || "system",
    speaker: normalizeOptionalString(message.speaker || message.senderName),
    text,
    time: normalizeOptionalString(message.time || message.date),
  };
};

const normalizeChatCountry = (entry) => {
  if (!entry) {
    return null;
  }

  if (typeof entry === "string") {
    const name = normalizeString(entry);
    if (!name) return null;

    return {
      code: "",
      name,
    };
  }

  if (typeof entry !== "object") {
    return null;
  }

  const name = normalizeOptionalString(entry.name || entry.label || entry.country);
  const code = normalizeOptionalString(entry.code || entry.id);

  if (!name && !code) {
    return null;
  }

  return {
    code,
    name: name || code,
  };
};

export const normalizeChatEntry = (entry, index = 0) => {
  if (!entry || typeof entry !== "object") {
    return null;
  }

  const countries = normalizeArray(entry.countries || entry.participants)
    .map((country) => normalizeChatCountry(country))
    .filter(Boolean);
  if (countries.length === 0) return null;

  return {
    countries,
    id: normalizeOptionalString(entry.id) || generateId(`chat-${index}`),
    linkedEventId: normalizeOptionalString(entry.linkedEventId || entry.eventId),
    messages: normalizeArray(entry.messages)
      .map((message, messageIndex) => normalizeChatMessage(message, messageIndex))
      .filter(Boolean),
    source: normalizeOptionalString(entry.source) || "manual",
    status: normalizeOptionalString(entry.status) || "open",
    title: normalizeOptionalString(entry.title),
  };
};

export const normalizeChats = (chats) =>
  normalizeArray(chats)
    .map((entry, index) => normalizeChatEntry(entry, index))
    .filter(Boolean);

const normalizeRegionTransfer = (entry) => {
  if (!entry || typeof entry !== "object") {
    return null;
  }

  const regionId = normalizeOptionalString(entry.regionId || entry.id || entry.gid || entry.GID_1);
  // Owners are stored as the FULL COUNTRY NAME. This value is written straight into
  // world.regionOwnershipOverrides, so a model that answered "ESP" out of habit would
  // otherwise mint a phantom country that paints and labels itself beside the real
  // Spain. Canonicalise on the way in, once, rather than papering over it at render.
  const toCode = toCountryName(normalizeOptionalString(entry.toCode || entry.toPolity || entry.ownerCode || entry.owner));
  const fromCode = toCountryName(normalizeOptionalString(entry.fromCode || entry.fromPolity));

  if (!regionId || !toCode) {
    return null;
  }

  // An internal voice holds no ground. Measured 2026-08-12 (voices ×
  // gameMaster, 12/12 both arms): a direct player request defeats every
  // prompt-side ban, and the GM answers "give Bayern to Internal: Head of
  // Military" with a literal transfer — which this normalizer used to write
  // straight into regionOwnershipOverrides, minting a landed voice on the
  // map. The prompt cell stays (unenforced ≠ unnecessary); the ENGINE is
  // where the rule holds. Dropped loudly, per the unitOps practice.
  if (isTerritorylessVoiceName(toCode)) {
    console.warn(`[gameState] 지역 이전 폐기: ${regionId} → "${toCode}" — 내부 보이스는 영토를 가질 수 없다`);
    return null;
  }

  return {
    fromCode,
    note: normalizeOptionalString(entry.note || entry.reason),
    regionId,
    regionName: normalizeOptionalString(entry.regionName || entry.name),
    toCode,
  };
};

const normalizePolityChange = (entry) => {
  if (!entry || typeof entry !== "object") {
    return null;
  }

  const code = toCountryName(normalizeOptionalString(entry.code || entry.id || entry.polityCode));
  if (!code) {
    return null;
  }

  // Same guard as normalizeRegionTransfer: a polityChange addressed to an
  // internal voice would mint or mutate a voice-named country row. Voices
  // change through their own lane, never through the country table.
  if (isTerritorylessVoiceName(code)) {
    console.warn(`[gameState] 정치체 변경 폐기: "${code}" — 내부 보이스는 국가 테이블의 행이 아니다`);
    return null;
  }

  const rawReputation = Number(entry.reputation ?? entry.internationalReputation);
  const reputation = Number.isFinite(rawReputation)
    ? Math.max(0, Math.min(100, Math.round(rawReputation)))
    : null;

  // The AI sends the complete new list, so an empty array is meaningful ("this
  // country no longer has defining tags") while undefined means "unchanged" —
  // null keeps those distinguishable for the apply step below.
  const tags = Array.isArray(entry.tags || entry.countryTags)
    ? normalizeTagList(entry.tags || entry.countryTags)
    : null;

  // Persistent stat-sheet update: keep the partial object as-is (the merge + the Stats
  // pane tolerate missing/extra fields); null means "no stat change this period".
  const stats = entry.stats && typeof entry.stats === "object" && !Array.isArray(entry.stats)
    ? entry.stats
    : null;

  // A PARTIAL personality move is the normal case — a hawk takes power and only
  // aggression and expansionism shift — so unlisted axes mean "unchanged", not 50.
  const personality = normalizePersonality(entry.personality || entry.character);

  return {
    aliases: normalizeActionParticipants(entry.aliases || entry.additionalNames),
    code,
    color: normalizeOptionalString(entry.color),
    name: normalizeOptionalString(entry.name || entry.newName),
    note: normalizeOptionalString(entry.note || entry.reason),
    personality,
    reputation,
    stats,
    tags,
  };
};

// COORDINATES THE MAP CANNOT HOLD ARE REPAIRED AT THE ONE GATE EVERYTHING
// PASSES. Round 6 live: a customs hub arrived at exactly lat 90 — the North
// Pole — sailed through the finite-only check, and the first camera flight to
// it crashed the whole UI (maplibre throws beyond ±90, and the focus frame
// pads points outward past the limit). Three repairs, in order: a transposed
// pair (|lat| beyond range while |lng| reads as a latitude) is swapped back;
// a longitude written on the 0–360 wheel is wrapped to ±180; and a polar
// placement (|lat| ≥ 89) is a hallucination in a game about countries —
// transposed when the other value reads as a latitude, dropped otherwise.
// Returns the repaired [lng, lat], or null when the pair is unusable.
//
// The repair runs at read time, so the SAME stored pair passes through on every
// render — and its notice used to print every time: one marker at the pole put
// hundreds of identical lines in a single turn's console, burying the turn's
// actual signals. The repair is unchanged; each distinct (label, pair, branch)
// now says its piece ONCE per session. Nothing is silently dropped — the first
// occurrence still names it.
const repairNoticesSeen = new Set();
const repairNotice = (key, message) => {
  if (repairNoticesSeen.has(key)) return;
  repairNoticesSeen.add(key);
  console.info(message);
};
export const repairLngLat = (lngIn, latIn, label) => {
  let lng = lngIn;
  let lat = latIn;
  if (Math.abs(lat) > 90 && Math.abs(lng) <= 90) [lng, lat] = [lat, lng];
  if (Math.abs(lng) > 180 && Math.abs(lng) <= 360) lng = ((lng + 540) % 360) - 180;
  if (Math.abs(lat) >= 89 && Math.abs(lng) <= 88) {
    repairNotice(`pole|${label}|${latIn}|${lngIn}`, `[map] "${label}" arrived at the pole (lat ${latIn}, lng ${lngIn}) — reading the pair as transposed.`);
    [lng, lat] = [lat, lng];
  }
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180 || Math.abs(lat) >= 89) {
    repairNotice(`unusable|${label}|${latIn}|${lngIn}`, `[map] "${label}" carries coordinates the map cannot hold (lat ${latIn}, lng ${lngIn}) — not placed.`);
    return null;
  }
  return [lng, lat];
};

export const normalizeUnitEntry = (entry, index = 0) => {
  if (!entry || typeof entry !== "object") {
    return null;
  }

  let lng = finiteOrNull(entry.lng ?? entry.lon ?? entry.longitude);
  let lat = finiteOrNull(entry.lat ?? entry.latitude);
  // Full country name, never a code — same identity everywhere (see ownerNames.js).
  const ownerCode = toCountryName(normalizeOptionalString(entry.ownerCode || entry.owner || entry.code));
  if (lng === null || lat === null || (lng === 0 && lat === 0) || !ownerCode) {
    return null;
  }
  const repairedUnitCoords = repairLngLat(lng, lat, normalizeOptionalString(entry.name) || `${ownerCode} unit`);
  if (!repairedUnitCoords) return null;
  [lng, lat] = repairedUnitCoords;

  const type = normalizeOptionalString(entry.type).toLowerCase();
  const status = normalizeOptionalString(entry.status).toLowerCase();
  const source = normalizeOptionalString(entry.source).toLowerCase();
  const timestamp = new Date().toISOString();

  return {
    id: normalizeOptionalString(entry.id) || generateId(`unit-${index}`),
    // "Unit" told the player nothing and read as a bug on the map. A unit always
    // knows who raised it and what it is, so say that instead — and via
    // unitTypeLabel, so a Korean game gets "기갑" and not the mistranslated "방어".
    name: normalizeOptionalString(entry.name)
      || [ownerCode, unitTypeLabel(UNIT_TYPE_SET.has(type) ? type : "infantry")].filter(Boolean).join(" "),
    type: UNIT_TYPE_SET.has(type) ? type : "infantry",
    ownerCode,
    strength: clampUnitStrength(entry.strength ?? 100),
    lng,
    lat,
    regionId: normalizeOptionalString(entry.regionId),
    status: UNIT_STATUS_SET.has(status) ? status : "idle",
    note: normalizeOptionalString(entry.note),
    // WHAT THIS FORMATION IS, AS OPPOSED TO WHERE IT IS.
    //
    // `note` is an operational scribble the AI writes and overwrites — "moved to
    // cover the eastern approach". A unit's HISTORY is the player's: how it was
    // raised, what it has done, what it is known for. Nothing in the engine ever
    // rewrites it, and it is handed to the model with the rest of the order of
    // battle, so a formation the player has given a past to is written about
    // with that past. Capped because sixty units each carrying an essay would
    // eat the prompt budget the campaign section is already straining.
    history: normalizeOptionalString(entry.history || entry.lore || entry.background).slice(0, 600),
    source: UNIT_SOURCE_SET.has(source) ? source : "scenario",
    orderId: normalizeOptionalString(entry.orderId),
    createdAt: normalizeOptionalString(entry.createdAt) || timestamp,
    updatedAt: normalizeOptionalString(entry.updatedAt) || timestamp,
  };
};

export const normalizeUnits = (units) =>
  normalizeArray(units)
    .map((entry, index) => normalizeUnitEntry(entry, index))
    .filter(Boolean);

// A structure built during play: any named point on the map — city, military
// base, bunker, missile silo, embassy, port. `kind` is deliberately free-form
// (lowercased for stable styling/grouping); unknown kinds are first-class.
// What KIND of structure this is, which decides its glyph on the map, its emoji
// in the selection popup, and how the cheat editor's picker labels it. All three
// used to keep their own list and disagree about what existed; the catalogue now
// lives in runtime/featureKinds.js and this is a re-export so existing callers
// keep working.
//
// Two things go wrong with the model's answer and both are handled there. First,
// snake_case and kebab-case arrive constantly ("energy_plant", "air-base")
// however plainly the prompt asks for plain words, and an underscore is a word
// character to a regex — \bbase\b never matched "air_base", so a forward
// airbase drew the civilian square. Second, and the bigger one: the model reaches
// for the generic — measured on a live save at round 5, EIGHT of eleven
// structures came back as "landmark" — so when it gives nothing, or gives the
// catch-all, the NAME decides.
export const resolveMarkerKind = resolveFeatureKind;

// A MARKER IS A PLACE. The map draws it at a coordinate and the player clicks it,
// so it has to be something that exists somewhere: a base, a port, a plant, a
// research campus, a city. The model does not always agree. From a live campaign,
// pinned to the map with latitudes and longitudes:
//
//   사전 타격 목표 리스트 시스템     (a targeting list)
//   차세대 방호 분석 시스템          (an analysis system)
//   지능형 목표 탐색 알고리즘        (an algorithm)
//
// None of those are anywhere. They are programmes the event already narrates, and
// putting them on the map turns the map into a list of policies. Korean puts the
// head noun last, so a name ENDING in one of these words is describing a system or
// a plan rather than a site — which is why this only matches at the end, and why
// "SMR 에너지 복합 단지" (a complex) and "국가 정보 대응 센터" (a centre) are
// untouched: those are buildings, whatever else they do.
const NOT_A_PLACE = /(시스템|알고리즘|프로그램|프로토콜|매뉴얼|정책|법안|계획|전략|캠페인|이니셔티브|로드맵|지침|체계|사업|제도)\s*$/;

export const isPlaceLikeMarkerName = (name) => !NOT_A_PLACE.test(String(name ?? "").trim());

export const normalizeMarkerEntry = (entry, index = 0) => {
  if (!entry || typeof entry !== "object") {
    return null;
  }

  // THE FUSED-RECORD REPAIR, for markers. Round 43 live: a structure was BUILT
  // named PQC 표준화 연구 센터", "kind": "research center", "ownerCode": …,
  // "lng": 127.31, "lat": 37.47, "note": "… — its own record welded into its
  // name, printed on the map and in the build schedule. The head becomes the
  // name, and unlike events the machine tail here IS harvestable: a marker's
  // kind, coordinates and note are exactly the fields the fusion swallowed,
  // and each is used only where the record itself has none.
  let rawName = normalizeOptionalString(entry.name || entry.title);
  let harvested = null;
  const fusedName = repairGluedRecord(rawName);
  if (fusedName) {
    logFusionRepairOnce(`[markers] repaired a marker whose name had "${fusedName.keys.join('", "')}" fused into it: "${fusedName.head}".`);
    rawName = fusedName.head;
    harvested = fusedName.fields;
  }
  let lng = finiteOrNull(entry.lng ?? entry.lon ?? entry.longitude) ?? finiteOrNull(harvested?.lng);
  let lat = finiteOrNull(entry.lat ?? entry.latitude) ?? finiteOrNull(harvested?.lat);
  // Underscores are an identifier habit, not a place name: the model wrote
  // "정밀_타격분석센터" and "에너지-공급망_통합터미널" onto the live map, and a
  // label with an underscore in it reads as a variable rather than a building.
  // Same correction the kind already gets (see tidyMarkerKind).
  const name = applyCanonRenames(rawName).replace(/_+/g, " ").replace(/\s{2,}/g, " ").trim();
  if (lng === null || lat === null || (lng === 0 && lat === 0) || !name) {
    return null;
  }
  const repairedMarkerCoords = repairLngLat(lng, lat, name);
  if (!repairedMarkerCoords) return null;
  [lng, lat] = repairedMarkerCoords;
  // A programme is not a location; the event that founded it still stands.
  if (!isPlaceLikeMarkerName(name)) {
    console.info(`[markers] "${name}" is a programme rather than a place — not putting it on the map.`);
    return null;
  }

  // Importance/scale of the structure (0.5 minor … 3 monumental), like the
  // original game's per-feature size — drives differentiated icon and label
  // sizing on the map. Settable by the AI (markerOps) and the cheats editor.
  const rawSize = Number(entry.size ?? entry.scale ?? entry.importance);
  const size = Number.isFinite(rawSize) && rawSize > 0 ? Math.max(0.5, Math.min(3, rawSize)) : 1;

  return {
    id: normalizeOptionalString(entry.id) || generateId(`marker-${index}`),
    name,
    kind: resolveMarkerKind(entry.kind || entry.type || harvested?.kind, name),
    ownerCode: toCountryName(normalizeOptionalString(entry.ownerCode || entry.owner || entry.code)),
    lng,
    lat,
    size,
    note: normalizeOptionalString(entry.note || entry.description) || normalizeOptionalString(harvested?.note),
    // THE PLAYER'S OWN FILING, and their own paint.
    //
    // Tags are what makes 116 structures searchable by anything other than the
    // name somebody happened to give them, and a colour override is how a feature
    // stops taking its owner's colour when the player wants it to stand out. Both
    // are omitted from the record entirely when unset, so a save gains no keys it
    // does not use and an untagged, unrecoloured map is byte-identical to before.
    ...(normalizeArray(entry.tags).map(normalizeOptionalString).filter(Boolean).length > 0
      ? { tags: [...new Set(normalizeArray(entry.tags).map(normalizeOptionalString).filter(Boolean))].slice(0, 12) }
      : {}),
    ...(/^#[0-9a-f]{3}(?:[0-9a-f]{3})?$/i.test(normalizeOptionalString(entry.color))
      ? { color: normalizeOptionalString(entry.color) }
      : {}),
    foundedAt: normalizeOptionalString(entry.foundedAt || entry.date),
    createdAt: normalizeOptionalString(entry.createdAt) || new Date().toISOString(),
    // A STRUCTURE IS EITHER FINISHED OR BEING BUILT (runtime/construction.js).
    // Only the three construction fields ride here; an entry without them is a
    // finished building, which is every marker a scenario or the editor makes.
    ...(normalizeOptionalString(entry.status) === "under-construction"
      ? {
        status: "under-construction",
        startedAt: normalizeOptionalString(entry.startedAt),
        readyAt: normalizeOptionalString(entry.readyAt),
      }
      : {}),
  };
};

export const normalizeMarkers = (markers) =>
  normalizeArray(markers)
    .map((entry, index) => normalizeMarkerEntry(entry, index))
    .filter(Boolean);

// One AI-authored mutation to the built-structure list: build | remove.
const normalizeMarkerOp = (entry) => {
  if (!entry || typeof entry !== "object") {
    return null;
  }

  const op = normalizeOptionalString(entry.op).toLowerCase();

  if (op === "build" || op === "found") {
    const marker = normalizeMarkerEntry(entry.marker ?? entry, 0);
    if (!marker) return null;
    return { op: "build", marker };
  }

  // The name fields below MATCH against stored markers, and stored marker names
  // go through applyCanonRenames — so an op naming a retired brand must be
  // renamed the same way or removal/rename would silently stop matching.
  if (op === "remove" || op === "destroy") {
    const markerId = normalizeOptionalString(entry.markerId || entry.id);
    const name = applyCanonRenames(normalizeOptionalString(entry.name));
    if (!markerId && !name) return null;
    return { op: "remove", markerId, name, note: normalizeOptionalString(entry.note) };
  }

  if (op === "rename") {
    const markerId = normalizeOptionalString(entry.markerId || entry.id);
    const name = applyCanonRenames(normalizeOptionalString(entry.name || entry.from || entry.oldName));
    const newName = applyCanonRenames(normalizeOptionalString(entry.newName || entry.to));
    if ((!markerId && !name) || !newName) return null;
    return { op: "rename", markerId, name, newName, note: normalizeOptionalString(entry.note) };
  }

  return null;
};

// Apply a batch of marker ops (pure). Rebuilding under an existing name
// replaces it rather than stacking duplicates; removal matches id first, then
// exact name — the AI usually knows the name, rarely the id.
export const applyMarkerOps = (markers, ops) => {
  let next = normalizeMarkers(markers);
  for (const op of normalizeArray(ops)) {
    if (op.op === "build") {
      next = [
        ...next.filter((marker) => marker.name.toLowerCase() !== op.marker.name.toLowerCase()),
        op.marker,
      ];
    } else if (op.op === "remove") {
      next = next.filter((marker) =>
        op.markerId ? marker.id !== op.markerId : marker.name.toLowerCase() !== op.name.toLowerCase());
    } else if (op.op === "rename") {
      next = next.map((marker) =>
        (op.markerId ? marker.id === op.markerId : marker.name.toLowerCase() === (op.name || "").toLowerCase())
          ? { ...marker, name: op.newName }
          : marker);
    }
  }
  return next;
};

// One AI-authored mutation to the unit list: spawn | move | strength | remove.
// Why normalizeUnitOp refused an entry, in words a player can paste into a bug
// report. Mirrors the checks below — keep the two in step.
const describeUnitOpRejection = (entry) => {
  if (!entry || typeof entry !== "object") return "not an object";
  const op = normalizeOptionalString(entry.op).toLowerCase();
  if (!op) return "no op (expected spawn, move, strength or remove)";
  if (op === "spawn") {
    const unit = entry.unit ?? entry;
    if (!unit || typeof unit !== "object") return "spawn without a unit";
    const lng = finiteOrNull(unit.lng ?? unit.lon ?? unit.longitude);
    const lat = finiteOrNull(unit.lat ?? unit.latitude);
    if (lng === null || lat === null) {
      // The usual cause: a non-numeric coordinate ("37,06", "37.06°N") that JSON
      // carried through as a string and Number() turned into NaN.
      return `spawn has unusable coordinates (lng=${JSON.stringify(unit.lng)}, lat=${JSON.stringify(unit.lat)})`;
    }
    if (lng === 0 && lat === 0) return "spawn at 0,0 — the output template's placeholder, not a real position";
    if (!normalizeOptionalString(unit.ownerCode || unit.owner || unit.code)) return "spawn has no owner";
    return "spawn rejected";
  }
  if (!normalizeOptionalString(entry.unitId || entry.id)) return `${op} without a unitId`;
  if (op === "move") {
    const toLng = finiteOrNull(entry.toLng ?? entry.lng);
    const toLat = finiteOrNull(entry.toLat ?? entry.lat);
    if (toLng === null || toLat === null) return `move has unusable destination (toLng=${JSON.stringify(entry.toLng)}, toLat=${JSON.stringify(entry.toLat)})`;
    if (toLng === 0 && toLat === 0) return "move to 0,0 — the output template's placeholder, not a real position";
  }
  return `unknown op "${op}"`;
};

const normalizeUnitOp = (entry) => {
  if (!entry || typeof entry !== "object") {
    return null;
  }

  const op = normalizeOptionalString(entry.op).toLowerCase();
  const unitId = normalizeOptionalString(entry.unitId || entry.id);

  if (op === "spawn") {
    const unit = normalizeUnitEntry(entry.unit ?? entry, 0);
    if (!unit) return null;
    unit.source = "ai";
    return { op, unit };
  }

  if (!unitId) {
    return null;
  }

  if (op === "move") {
    const toLng = finiteOrNull(entry.toLng ?? entry.lng);
    const toLat = finiteOrNull(entry.toLat ?? entry.lat);
    if (toLng === null || toLat === null || (toLng === 0 && toLat === 0)) return null;
    return {
      op,
      unitId,
      toLng,
      toLat,
      regionId: normalizeOptionalString(entry.regionId),
      note: normalizeOptionalString(entry.note),
    };
  }

  if (op === "strength") {
    // No number = no order. It used to default to ZERO, and applyUnitOps drops a
    // unit at zero strength — so a strength op the model sent without its number
    // (the one field that op exists to carry) quietly destroyed the battalion it
    // was meant to weaken. An op that says nothing must do nothing.
    const strength = finiteOrNull(entry.strength);
    if (strength === null) return null;
    return { op, unitId, strength: clampUnitStrength(strength), note: normalizeOptionalString(entry.note) };
  }

  if (op === "remove") {
    return { op, unitId, note: normalizeOptionalString(entry.note) };
  }

  return null;
};

// Apply a batch of unit ops to a unit list (pure). Ops referencing unknown ids
// are silently ignored; units reduced to <=0 strength are dropped.
export const applyUnitOps = (units, ops) => {
  let next = normalizeUnits(units);
  for (const op of normalizeArray(ops)) {
    if (op.op === "spawn") {
      // Idempotent: skip a spawn whose unit id is already present, so a re-applied
      // op batch can't duplicate a unit (mirrors the event-restatement de-dup).
      const spawnId = op.unit?.id;
      if (!spawnId || !next.some((unit) => unit.id === spawnId)) next.push(op.unit);
    } else if (op.op === "move") {
      next = next.map((unit) =>
        unit.id === op.unitId
          ? {
              ...unit,
              lng: op.toLng,
              lat: op.toLat,
              regionId: op.regionId || unit.regionId,
              status: "moving",
              updatedAt: new Date().toISOString(),
            }
          : unit,
      );
    } else if (op.op === "strength") {
      next = next.map((unit) =>
        unit.id === op.unitId
          ? { ...unit, strength: op.strength, status: op.strength <= 0 ? "defeated" : unit.status, updatedAt: new Date().toISOString() }
          : unit,
      );
    } else if (op.op === "remove") {
      next = next.filter((unit) => unit.id !== op.unitId);
    }
  }
  return next.filter((unit) => unit.strength > 0 && unit.status !== "defeated");
};

const normalizeEventImpacts = (value) => {
  if (!value || typeof value !== "object") {
    return {
      actionIds: [],
      actionOutcomes: [],
      createdChats: [],
      markerOps: [],
      polityChanges: [],
      regionTransfers: [],
      unitOps: [],
    };
  }

  return {
    actionIds: normalizeActionParticipants(value.actionIds),
    // Kept as a READER only: the field moved to the jump result's top level
    // (it came back empty as a nested one — see gameplaySchemas.js), but a turn
    // generated in the window where it was nested must still land.
    actionOutcomes: normalizeArray(value.actionOutcomes)
      .map((entry) => {
        const id = normalizeOptionalString(entry?.id || entry?.actionId);
        if (!id) return null;
        return {
          id,
          outcome: normalizeActionOutcome(entry?.outcome),
          note: normalizeOptionalString(entry?.note).slice(0, 240),
        };
      })
      .filter(Boolean),
    createdChats: normalizeChats(value.createdChats),
    markerOps: normalizeArray(value.markerOps).map(normalizeMarkerOp).filter(Boolean),
    polityChanges: normalizeArray(value.polityChanges).map(normalizePolityChange).filter(Boolean),
    regionTransfers: normalizeArray(value.regionTransfers).map(normalizeRegionTransfer).filter(Boolean),
    // Say WHY a unit op was thrown away. A dropped op is the difference between an
    // event that narrates a deployment and troops that actually appear on the map,
    // and it used to vanish into .filter(Boolean) without a word — leaving no way
    // to tell "the model never emitted one" from "it emitted one we rejected".
    // Region transfers have logged their drops for a while; units now match.
    unitOps: normalizeArray(value.unitOps)
      .map((entry, index) => {
        const normalized = normalizeUnitOp(entry);
        if (!normalized) {
          console.warn(
            `[ai] unitOps[${index}] dropped — ${describeUnitOpRejection(entry)}:`,
            entry,
          );
        }
        return normalized;
      })
      .filter(Boolean),
  };
};

export const normalizeEventEntry = (entry, index = 0) => {
  if (typeof entry === "string") {
    const title = normalizeString(entry);
    if (!title) return null;

    return {
      createdAt: new Date().toISOString(),
      date: "",
      description: "",
      id: generateId(`event-${index}`),
      impacts: normalizeEventImpacts(null),
      importance: "minor",
      kind: "world",
      notable: false,
      playerRelated: false,
      source: "scenario",
      title,
    };
  }

  if (!entry || typeof entry !== "object") {
    return null;
  }

  // THE FUSED-RECORD REPAIR, for events. Round 43 live: an event titled
  // 동남아 대상 양자 기술 포용 협력 선언", "note": "…", "description": "…",
  // "importance": "major", … — its whole JSON record welded into the title by
  // the salvage stack, shown to the player verbatim ("이벤트가 이런식으로
  // 뜨더라고"). The head becomes the title; the prose the tail was carrying
  // (its description or note) merges into the description the same way a glued
  // action's body does — near-equal copies collapse, different writings both
  // survive. Machine fields in the tail (kind, importance) are NOT harvested:
  // there is no telling a salvage default from a stored choice.
  let rawTitle =
    normalizeOptionalString(entry.title || entry.headline || entry.name) ||
    normalizeOptionalString(entry.description || entry.summary);
  let rawDescription = normalizeOptionalString(entry.description || entry.summary || entry.text);
  const fusedTitle = repairGluedRecord(rawTitle);
  if (fusedTitle) {
    logFusionRepairOnce(`[events] repaired an event whose title had "${fusedTitle.keys.join('", "')}" fused into it: "${fusedTitle.head}".`);
    rawTitle = fusedTitle.head;
    rawDescription = mergeRecoveredProse(rawDescription, gluedRecordProse(fusedTitle));
  }
  const fusedDescription = repairGluedRecord(rawDescription);
  if (fusedDescription) {
    logFusionRepairOnce(`[events] repaired an event whose description had "${fusedDescription.keys.join('", "')}" fused into it.`);
    rawDescription = mergeRecoveredProse(fusedDescription.head, gluedRecordProse(fusedDescription));
  }
  // An advisor's system label in an event's prose is the FEEDBACK path (see
  // machineSyntax.stripVoiceLabels): the chronicle rides in every later prompt,
  // so a voice staged once is re-supplied to the model as history forever.
  const title = applyCanonRenames(stripVoiceLabels(rawTitle));

  if (!title) {
    return null;
  }

  return {
    createdAt: normalizeOptionalString(entry.createdAt) || new Date().toISOString(),
    date: normalizeOptionalString(entry.date),
    description: applyCanonRenames(stripVoiceLabels(rawDescription)),
    id: normalizeOptionalString(entry.id) || generateId(`event-${index}`),
    impacts: normalizeEventImpacts(entry.impacts),
    importance: normalizeOptionalString(entry.importance) || "minor",
    kind: normalizeOptionalString(entry.kind) || "world",
    notable: Boolean(entry.notable),
    playerRelated: Boolean(entry.playerRelated),
    source: normalizeOptionalString(entry.source) || "scenario",
    title,
  };
};

export const normalizeEvents = (events) => {
  if (Array.isArray(events)) {
    return events
      .map((entry, index) => normalizeEventEntry(entry, index))
      .filter(Boolean);
  }

  if (events && typeof events === "object") {
    if (Array.isArray(events.events)) {
      return normalizeEvents(events.events);
    }

    return Object.values(events)
      .map((entry, index) => normalizeEventEntry(entry, index))
      .filter(Boolean);
  }

  return [];
};

// The officeholders a preset build resolved for this polity at its START DATE
// (build-preset.mjs step 3.5, resolved through the polity's own alias chain so
// "British Empire" answers via "United Kingdom").
//
// THE NEW-WORLD-FIELD TRAP, CAUGHT IN THE FIELD. This normalizer used to return
// a fixed five-field object, so `leadership` — present and CORRECT in every
// built scenario.json — was dropped the instant a game was created from it.
// Measured on the player's own 1935 save: the scenario carried 21/21 seeded
// leaderships (총리 스탠리 볼드윈, 국왕 조지 5세, 총리 펠지딘 겐덴), the live
// world carried ZERO, and the sheet task — arriving empty-handed — invented
// people instead: "총리 스탠리 메이너드 맥도널드", "국왕 조지 6세" (crowned in
// 1936), "총리 알베르토 바리니", "대통령 알퐁스 페리시에", "국무원 주석 펑펑".
// Not one of them existed. The record was in the save all along.
const normalizeLeadershipSeed = (value) => {
  if (!value || typeof value !== "object") return null;
  const seed = {
    asOf: normalizeOptionalString(value.asOf),
    via: normalizeOptionalString(value.via),
    leader: normalizeOptionalString(value.leader),
    headOfState: normalizeOptionalString(value.headOfState),
    deputy: normalizeOptionalString(value.deputy),
    government: normalizeOptionalString(value.government),
  };
  // A seed with no person in it is not a seed.
  if (!seed.leader && !seed.headOfState && !seed.deputy) return null;
  return Object.fromEntries(Object.entries(seed).filter(([, v]) => v));
};

const normalizePolityOverride = (key, value) => {
  if (!value || typeof value !== "object") {
    return null;
  }

  const code = normalizeOptionalString(value.code) || normalizeOptionalString(key);
  if (!code) {
    return null;
  }

  const leadership = normalizeLeadershipSeed(value.leadership);
  return {
    aliases: normalizeActionParticipants(value.aliases || value.additionalNames),
    code,
    color: normalizeOptionalString(value.color),
    ...(leadership ? { leadership } : {}),
    name: normalizeOptionalString(value.name || value.label),
    note: normalizeOptionalString(value.note),
  };
};

const normalizeActionSuggestions = (value) =>
  normalizeArray(value).map((topic) => {
    if (!topic || typeof topic !== "object") {
      return null;
    }

    const title = normalizeOptionalString(topic.title || topic.name);
    if (!title) {
      return null;
    }

    // The strategic horizon, when the model labels one: "immediate" is this
    // period's crisis management, "long" the multi-year national task. Anything
    // else (or nothing) is simply unlabeled — the board renders it plain.
    const horizon = ["immediate", "long"].includes(normalizeOptionalString(topic.horizon).toLowerCase())
      ? normalizeOptionalString(topic.horizon).toLowerCase()
      : "";
    return {
      actions: normalizeArray(topic.actions).map((entry, index) => normalizeActionEntry(entry, index)).filter(Boolean),
      description: normalizeOptionalString(topic.description),
      ...(horizon ? { horizon } : {}),
      id: normalizeOptionalString(topic.id) || generateId("topic"),
      title,
    };
  }).filter(Boolean);

const normalizeConsolidatedHistory = (value) => normalizeArray(value)
  .map((entry) => {
    if (!entry || typeof entry !== "object") return null;
    const summary = stripVoiceLabels(normalizeTextLike(entry.summary));
    if (!summary) return null;
    return {
      chatIds: normalizeActionParticipants(entry.chatIds),
      createdAt: normalizeOptionalString(entry.createdAt) || new Date().toISOString(),
      source: normalizeOptionalString(entry.source) || "ai",
      summary,
      throughDate: normalizeOptionalString(entry.throughDate),
      throughEventId: normalizeOptionalString(entry.throughEventId),
      throughRound: Number.isFinite(Number(entry.throughRound))
        ? Math.max(0, Math.trunc(Number(entry.throughRound)))
        : 0,
    };
  })
  .filter(Boolean);

// Secret reports (the advisor's Reports pane): delivered by the intelligence
// pass after a period, revealed to the player only, never enacted — no reader
// anywhere treats one as a state change. Rows the pass wrote malformed are
// dropped BY NAME here (title+body are the report; without both there is
// nothing to show), and an off-list kind folds to "intelligence" rather than
// leaking free text into the pane's badge slot.
const SECRET_REPORT_KINDS = new Set(["military", "political", "economic", "intelligence", "foreign"]);
const normalizeSecretReports = (value) => normalizeArray(value)
  .map((entry) => {
    if (!entry || typeof entry !== "object") return null;
    const title = normalizeOptionalString(entry.title);
    const body = normalizeOptionalString(entry.body);
    if (!title || !body) return null;
    const kind = normalizeOptionalString(entry.kind).toLowerCase();
    return {
      id: normalizeOptionalString(entry.id) || `report-${title.slice(0, 24)}`,
      kind: SECRET_REPORT_KINDS.has(kind) ? kind : "intelligence",
      title,
      body,
      source: normalizeOptionalString(entry.source),
      date: normalizeOptionalString(entry.date),
      round: Number.isFinite(Number(entry.round)) && Number(entry.round) > 0 ? Math.trunc(Number(entry.round)) : 0,
    };
  })
  .filter(Boolean);

export const normalizeWorldState = (world) => {
  const nextWorld = world && typeof world === "object" ? world : {};
  const polityOverrides = Object.fromEntries(
    Object.entries(nextWorld.polityOverrides ?? {})
      .map(([key, value]) => [key, normalizePolityOverride(key, value)])
      .filter(([, value]) => value),
  );

  const regionOwnershipOverrides = Object.fromEntries(
    Object.entries(nextWorld.regionOwnershipOverrides ?? {})
      // Canonicalise on READ too, so a save written before this migrated still
      // resolves to the same owner identity as everything computed now.
      .map(([regionId, ownerCode]) => [normalizeOptionalString(regionId), toCountryName(normalizeOptionalString(ownerCode))])
      .filter(([regionId, ownerCode]) => regionId && ownerCode),
  );

  const baselineOwnership = Object.fromEntries(
    Object.entries(nextWorld.baselineOwnership ?? {})
      .map(([regionId, ownerCode]) => [normalizeOptionalString(regionId), toCountryName(normalizeOptionalString(ownerCode))])
      .filter(([regionId, ownerCode]) => regionId && ownerCode),
  );

  // An id that ALSO carries a real override is owned, and the override wins:
  // the two disagree only after a conquest wrote one without clearing the other,
  // and a conquered region is owned. Deduped and sorted so the file does not
  // churn on every write.
  const unownedRegionIds = [...new Set(
    normalizeArray(nextWorld.unownedRegionIds)
      .map((regionId) => normalizeOptionalString(regionId))
      .filter((regionId) => regionId && !regionOwnershipOverrides[regionId]),
  )].sort();

  const regionClaimants = Object.fromEntries(
    Object.entries(nextWorld.regionClaimants ?? {})
      .map(([regionId, claimants]) => [
        normalizeOptionalString(regionId),
        normalizeArray(claimants).map((name) => normalizeOptionalString(name)).filter(Boolean).slice(0, 4),
      ])
      .filter(([regionId, claimants]) => regionId && claimants.length),
  );

  const internationalReputation = Object.fromEntries(
    Object.entries(nextWorld.internationalReputation ?? {})
      .map(([polityCode, value]) => [normalizeOptionalString(polityCode), Number(value)])
      .filter(([polityCode, value]) => polityCode && Number.isFinite(value))
      .map(([polityCode, value]) => [polityCode, Math.max(0, Math.min(100, Math.round(value)))]),
  );

  // Keyed by country NAME, verbatim — same namespace as internationalReputation
  // above, polityOverrides and colors. This used to uppercase while its neighbours
  // did not, so one applyEventImpacts change.code landed under two different keys
  // (countryTags["RUSSIA"] but internationalReputation["Russia"]). Harmless while
  // owners were uppercase GADM codes; a silent desync the moment they are names.
  const countryTags = Object.fromEntries(
    Object.entries(nextWorld.countryTags ?? {})
      .map(([country, list]) => [normalizeOptionalString(country), normalizeTagList(list)])
      .filter(([country, list]) => country && list.length),
  );

  // Behavioural profiles, keyed by country NAME like every other owner-keyed map
  // here. Stored PARTIAL on purpose: only the axes something actually moved are
  // written, and readers complete the rest from the tag-derived baseline
  // (resolveCountryPersonality). Storing complete vectors instead would freeze a
  // country's remaining four axes at whatever they were the first time the AI
  // nudged one, and a later revolution rewriting its tags would then change how it
  // IS without changing how it ACTS.
  const countryPersonalities = Object.fromEntries(
    Object.entries(nextWorld.countryPersonalities ?? {})
      .map(([country, vector]) => [normalizeOptionalString(country), normalizePersonality(vector)])
      .filter(([country, vector]) => country && vector),
  );

  // Persisted per-country stat sheets: keep each code -> sheet-object entry as-is (the
  // Stats pane tolerates missing fields). Explicit, not via the spread — new-field trap.
  const countryStats = Object.fromEntries(
    Object.entries(nextWorld.countryStats ?? {})
      .filter(([code, sheet]) => normalizeOptionalString(code) && sheet && typeof sheet === "object"),
  );
  const countryStatChanges = Object.fromEntries(
    Object.entries(nextWorld.countryStatChanges ?? {})
      .filter(([code, store]) => normalizeOptionalString(code) && store && typeof store === "object"),
  );

  return {
    ...WORLD_DEFAULTS,
    ...nextWorld,
    // Sea geometry is shipped with the app and identical in every game
    // (runtime/seaRegions.js), so it is no longer copied into the world. Dropping
    // it here retires the copy a save made while seas were opt-in still carries:
    // ~600 KB of static polygons that the map re-polled every 5 seconds and every
    // turn rewrote (a save with seas on measured 722 KB against 127 KB without).
    // Sea OWNERSHIP is untouched — it lives in regionOwnershipOverrides["sea_…"]
    // like any other region's, which is the whole per-game part.
    seaRegions: undefined,
    setbackShortfall: Math.max(0, Math.round(Number(nextWorld.setbackShortfall) || 0)),
    countryTags,
    countryStats,
    countryStatChanges,
    countryPersonalities,
    // Deliberate side effect: normalizing a world FEEDS the canon-rename
    // registry, so the pure action/event/marker normalizers apply this world's
    // retired-name table without every caller threading it through. Every
    // gameplay path normalizes the world before it normalizes anything else.
    nameRenames: setCanonRenames(nextWorld.nameRenames),
    actionSuggestions: normalizeActionSuggestions(nextWorld.actionSuggestions),
    activeCatalyst: normalizeCatalyst(nextWorld.activeCatalyst),
    campaignLedger: normalizeLedger(nextWorld.campaignLedger),
    diplomaticRelations: normalizeDiplomaticRelations(nextWorld.diplomaticRelations),
    consolidatedHistory: normalizeConsolidatedHistory(nextWorld.consolidatedHistory),
    internationalReputation,
    labelFont: normalizeOptionalString(nextWorld.labelFont),
    labelHaloColor: normalizeOptionalString(nextWorld.labelHaloColor),
    labelTextColor: normalizeOptionalString(nextWorld.labelTextColor),
    language: normalizeOptionalString(nextWorld.language) || WORLD_DEFAULTS.language,
    lastJumpMode: normalizeOptionalString(nextWorld.lastJumpMode),
    lastJumpSummary: normalizeOptionalString(nextWorld.lastJumpSummary),
    lastJumpTargetDate: normalizeOptionalString(nextWorld.lastJumpTargetDate),
    notes: normalizeOptionalString(nextWorld.notes),
    baselineOwnership,
    polityOverrides,
    regionClaimants,
    regionOwnershipOverrides,
    unownedRegionIds,
    simulationHistory: normalizeArray(nextWorld.simulationHistory)
      .map((entry) => {
        if (!entry || typeof entry !== "object") {
          return null;
        }

        return {
          ...cloneValue(entry),
          catalyst: normalizeCatalyst(entry.catalyst),
          date: normalizeOptionalString(entry.date),
          eventIds: normalizeActionParticipants(entry.eventIds),
          fallbackReason: normalizeOptionalString(entry.fallbackReason),
          fromDate: normalizeOptionalString(entry.fromDate || entry.startDate),
          mode: normalizeOptionalString(entry.mode),
          plannedActions: normalizeActions(entry.plannedActions || entry.actions),
          round:
            Number.isFinite(Number(entry.round)) && Number(entry.round) > 0
              ? Math.trunc(Number(entry.round))
              : 0,
          summary: normalizeTextLike(entry.summary),
          source: normalizeOptionalString(entry.source) || "ai",
          toDate: normalizeOptionalString(entry.toDate || entry.endDate || entry.date),
        };
      })
      .filter(Boolean),
    markers: normalizeMarkers(nextWorld.markers),
    // Explicit (not via the ...WORLD_DEFAULTS spread) so this new field survives every
    // write path — the documented new-world-field trap.
    cityRenames: Object.fromEntries(
      Object.entries(nextWorld.cityRenames && typeof nextWorld.cityRenames === "object" ? nextWorld.cityRenames : {})
        .map(([key, value]) => [normalizeString(key).toLowerCase(), normalizeString(value)])
        .filter(([key, value]) => key && value),
    ),
    simulationRules: normalizeOptionalString(nextWorld.simulationRules),
    startingTimelineText: normalizeOptionalString(nextWorld.startingTimelineText),
    // Explicit, like cityRenames above — the documented new-world-field trap:
    // a field survives every write path only if it is normalized here by name.
    secretReports: normalizeSecretReports(nextWorld.secretReports),
    // Explicit, like cityRenames above: a new world field only survives every
    // write path if it is normalized here by name.
    periodTimeline: normalizeTimeline(nextWorld.periodTimeline),
    periodTimelineSource: {
      id: normalizeOptionalString(nextWorld.periodTimelineSource?.id),
      revision: Number.isFinite(Number(nextWorld.periodTimelineSource?.revision))
        ? Math.trunc(Number(nextWorld.periodTimelineSource.revision))
        : 0,
    },
    timelineBacklog: normalizeTimeline(nextWorld.timelineBacklog),
    // Explicit, like the two above and for the same documented trap: the fork
    // rolls survive every write path only because they are normalized here by
    // name. Keys are entry ids, values are non-negative branch indexes; range
    // against the entry's branch list is checked at read time (branchOutcomeOf),
    // because the timeline copy can be revised after a roll was made.
    timelineBranchRolls: Object.fromEntries(
      Object.entries(nextWorld.timelineBranchRolls ?? {})
        .filter(([key, value]) => normalizeOptionalString(key) && Number.isInteger(value) && value >= 0)
        .map(([key, value]) => [key, value]),
    ),
    units: normalizeUnits(nextWorld.units),
  };
};

// Does a polity currently hold no territory? A stateless actor — a
// government-in-exile, a movement, or a person with no country of their own.
// Single source of truth for "landless", used by both the AI prompt
// (buildPlayerPolityRegionsText) and the UI flag resolvers: a landless polity
// with no flag of its own must NOT borrow the code-derived country flag (a
// "stateless person in Japan" is not Japan), so the flag shows neutral instead.
//
// The distinction that matters: owning a region via an override = has land; but
// a scenario that ships NO override list at all means the polity owns its country
// through the base map tiles (a stock modern map), which is NOT landless.
export const isPolityLandless = (world, code) => {
  const polityCode = normalizeString(code);
  if (!polityCode) return false;
  const normalized = normalizeWorldState(world);
  const entries = Object.entries(normalized.regionOwnershipOverrides);
  const owns = entries.some(
    ([, ownerCode]) => normalizeString(ownerCode).toLowerCase() === polityCode.toLowerCase(),
  );
  if (owns) return false;
  const isKnownPolity = Boolean(normalized.polityOverrides?.[polityCode]);
  // No override list AND not a declared polity = stock map, owns via base tiles.
  if (entries.length === 0 && !isKnownPolity) return false;
  return true;
};

// Recover a Gregorian date stored in a loose format back to strict YYYY-MM-DD.
// Older builds wrote the model's stopDate verbatim, so real saves hold values
// like "2016-12-31T00:00:00.000Z" or "December 31, 2016" — the header displays
// them fine, but date math (addIsoDays) rejects them, so every jump silently
// computes target == origin and the game clock freezes forever while the model
// re-simulates the past. Deliberately non-Gregorian scenario dates ("1200 BCE")
// don't parse and pass through untouched.
const canonicalizeDateString = (value) => {
  const text = normalizeOptionalString(value);
  if (!text || /^(?:\d{4}|[+-]\d{6})-\d{2}-\d{2}$/.test(text)) return text;
  // An ISO date prefix (datetime forms) is authoritative — slicing it avoids
  // the timezone day-shift of parsing "...T00:00:00Z" into local time.
  const prefix = /^(\d{4}-\d{2}-\d{2})[T ]/.exec(text);
  if (prefix) return prefix[1];
  const parsed = new Date(text);
  if (!Number.isNaN(parsed.getTime())) {
    const year = parsed.getFullYear();
    if (year >= 1 && year <= 9999) {
      return `${String(year).padStart(4, "0")}-${String(parsed.getMonth() + 1).padStart(2, "0")}-${String(parsed.getDate()).padStart(2, "0")}`;
    }
  }
  return text;
};

export const normalizeGameData = (game) => {
  const nextGame = game && typeof game === "object" ? game : {};

  return {
    ...GAME_DEFAULTS,
    ...nextGame,
    country: normalizeOptionalString(nextGame.country),
    difficulty: normalizeOptionalString(nextGame.difficulty) || GAME_DEFAULTS.difficulty,
    gameDate: canonicalizeDateString(nextGame.gameDate),
    language: normalizeOptionalString(nextGame.language) || GAME_DEFAULTS.language,
    round:
      Number.isFinite(Number(nextGame.round)) && Number(nextGame.round) > 0
        ? Math.trunc(Number(nextGame.round))
        : GAME_DEFAULTS.round,
    startDate: canonicalizeDateString(nextGame.startDate),
  };
};

export const buildActionDisplayText = (action) => {
  const normalized = normalizeActionEntry(action);
  if (!normalized) {
    return "";
  }

  return normalized.kind === "chat" && normalized.chatStarter
    ? `${normalized.title}: ${normalized.chatStarter}`
    : normalized.text;
};

export const readWorldState = async ({ force = false } = {}) =>
  normalizeWorldState(await readJson(JSON_URLS.world, { defaultValue: WORLD_DEFAULTS, force }));

export const writeWorldState = async (world, options = {}) => {
  const normalized = normalizeWorldState(world);
  // Edited/AI-written polity names, aliases and notes get translated (and
  // saved to the server language pack) the moment they're written, not when
  // they first happen to be rendered somewhere.
  enqueueContentStrings(normalized.polityOverrides);
  return writeJson(JSON_URLS.world, normalized, { pretty: true, ...options });
};

export const readGameData = async ({ force = false } = {}) =>
  normalizeGameData(await readJson(JSON_URLS.game, { defaultValue: GAME_DEFAULTS, force }));

export const writeGameData = async (game, options = {}) =>
  writeJson(JSON_URLS.game, normalizeGameData(game), { pretty: true, ...options });

export const readActionsState = async ({ force = false } = {}) =>
  normalizeActions(await readJson(JSON_URLS.actions, { defaultValue: [], force }));

export const writeActionsState = async (actions, options = {}) =>
  writeJson(JSON_URLS.actions, normalizeActions(actions), { pretty: true, ...options });

export const readEventsState = async ({ force = false } = {}) =>
  normalizeEvents(await readJson(JSON_URLS.events, { defaultValue: [], force }));

export const writeEventsState = async (events, options = {}) => {
  // Choke-point safety net: no writer can persist a log that already contains
  // exact-duplicate events (the AI restating its own timeline). See eventDedup.js.
  const normalized = dedupeEventLog(normalizeEvents(events));
  // New/edited event text follows the UI language immediately (see above).
  enqueueContentStrings(normalized);
  return writeJson(JSON_URLS.events, normalized, { pretty: true, ...options });
};

export const readChatsState = async ({ force = false } = {}) =>
  normalizeChats(await readJson(JSON_URLS.chat, { defaultValue: [], force }));

export const writeChatsState = async (chats, options = {}) =>
  writeJson(JSON_URLS.chat, normalizeChats(chats), { pretty: true, ...options });

export const readGameStateBundle = async ({ force = false } = {}) => {
  const [actions, chats, events, game, world] = await Promise.all([
    readActionsState({ force }),
    readChatsState({ force }),
    readEventsState({ force }),
    readGameData({ force }),
    readWorldState({ force }),
  ]);

  return {
    actions,
    chats,
    events,
    game,
    world,
  };
};

// A STANDING IS A VALUE, NOT A CHANGE — and the model forgets which.
//
// Captured live. South Korea's reputation climbed 52 → 57 across ten events over
// five turns, one or two points at a time, exactly as a standing should move.
// Then in one turn it was written as 1, 2, 1, 1 — and the events attached to
// those writes were "국내 극단주의 대응을 위한 범정부 통합 전략 수립", "부패 척결을
// 위한 엄격한 특별 감사 실시", a technology-security centre and an AI targeting
// programme. Nothing there costs a country the world's trust; the model had
// simply started writing the CHANGE (+1, +2) into a field that means the value.
// The player opened the panel to find their country a pariah at 1/100.
//
// The schema cannot catch this: 1 is a perfectly legal reputation. What gives it
// away is the SIZE of the jump against what the event says happened. A standing
// moves in small steps because it is built out of a record; it collapses only
// when something collapses it, and an event that does that says so.
//
// So a large swing has to be earned by the text. Anything within the ordinary
// band applies unchanged; a bigger move applies only when the event is about the
// kind of thing that moves a reputation that far. Otherwise the previous value
// stands — the conservative choice, since guessing that "1" meant "+1" would be
// inventing a number the model never wrote.
// It is not only reputation. On the very same turn the same country's stability
// ran 58 → 64 → 95 → 96 → 95 and was then written 5, 3, 2, 2 across four events
// about counter-extremism policy, an anti-corruption audit, a technology-security
// centre and an AI targeting programme. Same mistake, different field — so every
// bounded 0-100 standing on a polity goes through this.
const STANDING_ORDINARY_SWING = 20;

// What could actually knock a standing down by tens: violence, betrayal,
// isolation, or the state losing its grip at home.
const STANDING_COLLAPSE = /(전쟁 ?범죄|학살|침공|침략|기습|배신|파기|쿠데타|숙청|제재|규탄|고립|추방|탈퇴|핵실험|테러|점령|합병|추문|스캔들|붕괴|폭동|소요|내전|반란|계엄|탄핵|총파업|암살|재난|참사|war crime|massacre|genocide|invasion|betray|coup|sanction|condemn|expelled|atrocit|scandal|collapse|riot|unrest|civil war|insurgen|martial law|impeach|assassinat|disaster)/i;
// And what could lift one that far: an end to a war, a rescue, a restoration of
// order, admission to the community of states.
const STANDING_TRIUMPH = /(종전|평화 ?협정|해방|중재|구호|원조|가입|수교|정상화|승인|훈장|수상|공로|진압|수복|재건|안정화|peace (treaty|accord)|liberat|mediat|humanitarian|accede|recogni[sz]ed|award|restor|quell|rebuil)/i;

// Each distinct rejection is worth saying ONCE. The stored event keeps claiming
// its impossible value on every rerun of applyEventImpactsToWorld — and the UI
// reruns it on a poll cadence — so an un-keyed warn printed the same sentence
// dozens of times per session (live count: 20+ for one Saudi +38), burying the
// console signal this project depends on.
const STANDING_ALREADY_LOGGED = new Set();

export const acceptStanding = ({ label = "reputation", code, next, previous, eventText, quiet = false }) => {
  const prior = Number(previous);
  // Nothing recorded yet: the first write establishes the standing.
  if (!Number.isFinite(prior)) return true;
  const delta = next - prior;
  if (Math.abs(delta) <= STANDING_ORDINARY_SWING) return true;
  const text = String(eventText ?? "");
  if (delta < 0 ? STANDING_COLLAPSE.test(text) : STANDING_TRIUMPH.test(text)) return true;
  const logKey = `${label}|${code}|${prior}|${next}`;
  if (!quiet && !STANDING_ALREADY_LOGGED.has(logKey)) {
    STANDING_ALREADY_LOGGED.add(logKey);
    console.warn(
      `[standing] ignored a ${delta > 0 ? "+" : ""}${delta} swing in ${label} for ${code} (${prior} → ${next}): ` +
      "nothing in the event accounts for a move that large, and a standing does not jump. Keeping " +
      `${prior}. If the model meant a change rather than a value, it wrote the wrong field.`,
    );
  }
  return false;
};

const acceptReputation = (args) => acceptStanding({ ...args, label: "reputation" });

export const applyEventImpactsToWorld = ({ colors = {}, events = [], world, quiet = false }) => {
  const nextColors = cloneValue(colors) ?? {};
  const nextWorld = normalizeWorldState(world);

  for (const event of normalizeEvents(events)) {
    for (const transfer of event.impacts.regionTransfers) {
      nextWorld.regionOwnershipOverrides[transfer.regionId] = transfer.toCode;
      // Taking unclaimed ground is still taking it. normalizeWorldState would
      // drop the stale entry on the next read anyway, but the map paints from
      // this object before that happens, and a region that changed hands should
      // not stay grey for a frame.
      if (Array.isArray(nextWorld.unownedRegionIds) && nextWorld.unownedRegionIds.length > 0) {
        nextWorld.unownedRegionIds = nextWorld.unownedRegionIds.filter((regionId) => regionId !== transfer.regionId);
      }
    }

    for (const change of event.impacts.polityChanges) {
      const priorOverride = nextWorld.polityOverrides[change.code];
      nextWorld.polityOverrides[change.code] = {
        ...(priorOverride ?? {
          aliases: [],
          code: change.code,
          color: "",
          // Seeded with the code (which is already the country's full NAME —
          // normalizePolityChange canonicalises it) rather than "". A polityChange
          // that only carries a note, a reputation or a stat sheet is the ordinary
          // case, and a nameless polity entry is a live grenade: the persistence
          // layer resolves country references THROUGH this registry, so an entry
          // that answers "" for its own name used to blank every reference to that
          // country in the same write — its ownership, its ownerCodes entry, its own
          // key — and the country dropped off the map. A polity always knows its own
          // name; the empty string is not one.
          name: change.code,
          note: "",
        }),
        // An override written before this seeded its name may still carry "" —
        // repair it in passing rather than propagating the hole.
        ...(priorOverride && !priorOverride.name ? { name: change.code } : {}),
        ...(change.aliases?.length > 0 ? { aliases: change.aliases } : {}),
        ...(change.color ? { color: change.color } : {}),
        ...(change.name ? { name: change.name } : {}),
        ...(change.note ? { note: change.note } : {}),
      };

      if (change.color) {
        const normalizedColor = normalizeOptionalString(change.color);
        const hexMatch = /^#?([a-f0-9]{6})$/i.exec(normalizedColor);
        if (hexMatch) {
          const hex = hexMatch[1];
          nextColors[change.code] = [
            Number.parseInt(hex.slice(0, 2), 16),
            Number.parseInt(hex.slice(2, 4), 16),
            Number.parseInt(hex.slice(4, 6), 16),
          ];
        }
      }

      // Reputation the AI set this turn becomes the polity's authoritative value —
      // unless the jump it implies is not one the event can account for.
      if (Number.isFinite(change.reputation) && acceptReputation({
        code: change.code,
        next: change.reputation,
        previous: nextWorld.internationalReputation?.[change.code],
        eventText: `${event?.title ?? ""} ${event?.description ?? ""} ${change.note ?? ""}`,
        quiet,
      })) {
        nextWorld.internationalReputation[change.code] = change.reputation;
        // Keep the persisted sheet's reputation index in sync with the authoritative value.
        if (nextWorld.countryStats?.[change.code]?.indices) {
          nextWorld.countryStats[change.code] = {
            ...nextWorld.countryStats[change.code],
            indices: { ...nextWorld.countryStats[change.code].indices, internationalReputation: change.reputation },
          };
        }
      }

      // Persistent stat sheet: merge the AI's changed fields into the stored sheet so a
      // country's stats change ONLY when the AI changes them (not every date). Deep-merge
      // the nested groups and mirror the reputation index into the authoritative store.
      if (change.stats && typeof change.stats === "object") {
        if (!nextWorld.countryStats || typeof nextWorld.countryStats !== "object") nextWorld.countryStats = {};
        const prev = nextWorld.countryStats[change.code] && typeof nextWorld.countryStats[change.code] === "object"
          ? nextWorld.countryStats[change.code]
          : {};
        // The same delta-in-an-absolute-field mistake reaches the stat sheet, and
        // on the same turn it reached reputation: this country's stability ran
        // 58 → 64 → 95 → 96 → 95 and then was written as 5, 3, 2, 2 on four
        // domestic-policy events. Every bounded 0-100 standing here is exposed to
        // it, so they are all checked the same way.
        const eventText = `${event?.title ?? ""} ${event?.description ?? ""} ${change.note ?? ""}`;
        const guardedStats = { ...change.stats };
        if (guardedStats.stability !== undefined && Number.isFinite(Number(guardedStats.stability))
          && !acceptStanding({ label: "stability", code: change.code, next: Number(guardedStats.stability), previous: prev.stability, eventText, quiet })) {
          delete guardedStats.stability;
        }
        if (guardedStats.indices && typeof guardedStats.indices === "object") {
          const guardedIndices = { ...guardedStats.indices };
          for (const [key, value] of Object.entries(guardedIndices)) {
            if (!Number.isFinite(Number(value))) continue;
            if (!acceptStanding({ label: key, code: change.code, next: Number(value), previous: prev.indices?.[key], eventText, quiet })) {
              delete guardedIndices[key];
            }
          }
          guardedStats.indices = guardedIndices;
        }
        const merged = { ...prev, ...guardedStats };
        for (const group of ["indices", "economy", "gdpBreakdown"]) {
          if (guardedStats[group] && typeof guardedStats[group] === "object") {
            merged[group] = { ...(prev[group] || {}), ...guardedStats[group] };
          }
        }
        // After the guards, everything the event claimed may be gone — and an
        // EMPTY write is not neutral: it plants a stat FRAGMENT that reads as
        // a standing sheet everywhere truthiness is checked (live: Turkey held
        // {} after a rejected stability claim, the Philippines {stability} —
        // both then passed for bases). Strip gutted groups, and write nothing
        // rather than a husk.
        for (const group of ["indices", "economy", "gdpBreakdown"]) {
          if (merged[group] && typeof merged[group] === "object" && Object.keys(merged[group]).length === 0) {
            delete merged[group];
          }
        }
        if (Object.keys(merged).length === 0) {
          if (!quiet) console.info(`[world] ${change.code}'s reported stat change was rejected in full — nothing written to its sheet.`);
        } else {
          nextWorld.countryStats[change.code] = merged;
          const rep = Number(merged.indices?.internationalReputation);
          if (Number.isFinite(rep)) {
            nextWorld.internationalReputation[change.code] = Math.max(0, Math.min(100, Math.round(rep)));
          }
        }
      }

      // A personality move is a PARTIAL update merged over what the country already
      // had — the model sends only the axes that shifted ("a hawk took power":
      // aggression and expansionism up, nothing else touched). Merging rather than
      // replacing is what keeps a country's character continuous across turns
      // instead of being rewritten from scratch by whichever axis was on the
      // model's mind.
      if (change.personality) {
        if (!nextWorld.countryPersonalities || typeof nextWorld.countryPersonalities !== "object") {
          nextWorld.countryPersonalities = {};
        }
        nextWorld.countryPersonalities[change.code] = {
          ...(nextWorld.countryPersonalities[change.code] ?? {}),
          ...change.personality,
        };
      }

      // Tags the AI set this turn replace the scenario's starting tags for this
      // country, wholesale — the model sends the complete list, so a revolution
      // that drops "socialist" must actually drop it. null means "unchanged",
      // which is why normalizePolityChange distinguishes null from [].
      if (Array.isArray(change.tags)) {
        if (!nextWorld.countryTags || typeof nextWorld.countryTags !== "object") {
          nextWorld.countryTags = {};
        }
        if (change.tags.length) nextWorld.countryTags[change.code] = change.tags;
        else delete nextWorld.countryTags[change.code];
      }
    }

    if (event.impacts.unitOps?.length) {
      nextWorld.units = applyUnitOps(nextWorld.units, event.impacts.unitOps);
    }

    if (event.impacts.markerOps?.length) {
      const before = normalizeMarkers(nextWorld.markers);
      nextWorld.markers = applyMarkerOps(nextWorld.markers, event.impacts.markerOps);
      // A rename that matched no existing structure is a STOCK-map city rename (stock
      // cities live in PMTiles, not world.markers) — record it as an override layer so
      // the label layer can show the new name (see Cities.jsx / cityRenames).
      for (const raw of normalizeArray(event.impacts.markerOps)) {
        const op = normalizeMarkerOp(raw);
        if (!op || op.op !== "rename" || !op.name) continue;
        const matched = before.some((m) =>
          op.markerId ? m.id === op.markerId : m.name.toLowerCase() === op.name.toLowerCase());
        if (!matched) {
          // The override table is looked up by the TILE's own city name, which
          // is a latin toponym — so a key must be one, or the entry can never
          // fire. The AI names things in the player's language: the live table
          // held "라카(raqqa)" (a real rename, dead because of its key) next to
          // three renames of structures that did not exist (dead twice over).
          // Extract the latin name if one rides along; keep an ASCII name as
          // itself; drop everything else and say so, because an entry that can
          // never match is not a rename, it is sediment.
          const latinInParens = /[(（]\s*([A-Za-z][A-Za-z .'-]{1,40})\s*[)）]/.exec(op.name)?.[1];
          const key = normalizeString(latinInParens ?? (/^[\x20-\x7E]+$/.test(op.name) ? op.name : "")).toLowerCase();
          if (key) {
            nextWorld.cityRenames = { ...(nextWorld.cityRenames || {}), [key]: op.newName };
          } else if (!quiet) {
            // quiet: the chronicle scrubber REPLAYS old events to reconstruct a
            // past round, and re-dropping a historical junk op is not news —
            // the turn that first dropped it already said so.
            console.info(`[world] a rename of "${op.name}" matched no structure and carries no stock-city name — dropped rather than filed where nothing can read it.`);
          }
        }
      }
    }
  }

  return {
    colors: nextColors,
    world: nextWorld,
  };
};

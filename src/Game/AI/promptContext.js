import dayjs from "dayjs";
import { JSON_URLS, getNationTags, loadRegionCatalog, readJson } from "../../runtime/assets.js";
import { resolveAllCountryTags, resolveCountryTags } from "../../runtime/countryTags.js";
import { formatPersonality, resolveCountryPersonality } from "../../runtime/countryPersonality.js";
import { toCountryName } from "../../runtime/ownerNames.js";
import { isTerritorylessVoice, isTerritorylessVoiceName } from "../../runtime/internalVoices.js";
import { getContextTokens } from "../../runtime/mapSettings.js";
import {
  buildActionDisplayText,
  isPolityLandless,
  isStalledOrder,
  normalizeActionEntry,
  normalizeActions,
  normalizeChats,
  normalizeEvents,
  normalizeWorldState,
} from "../../runtime/gameState.js";
import { buildRegionOwnershipText } from "./regionVocab.js";
import { buildLedgerText } from "../../runtime/campaignLedger.js";

const normalizeString = (value) => String(value ?? "").trim();
const normalizeArray = (value) => (Array.isArray(value) ? value : []);

export const renderTemplate = (template, variables) =>
  String(template ?? "").replace(/\$\{([^}]+)\}/g, (_match, key) => {
    const value = variables[key];
    return value == null ? "" : String(value);
  });

export const resolveHelperValues = (helperTemplates, variables) => {
  let resolved = {};

  for (let pass = 0; pass < 2; pass += 1) {
    resolved = Object.fromEntries(
      Object.entries(helperTemplates).map(([key, template]) => [
        key,
        renderTemplate(template, { ...variables, ...resolved }),
      ]),
    );
  }

  return resolved;
};

export const getUnconsolidatedEvents = (events, world) => {
  const normalizedEvents = normalizeEvents(events);
  const history = normalizeWorldState(world).consolidatedHistory;
  const throughEventId = history.at(-1)?.throughEventId;
  if (!throughEventId) return normalizedEvents;

  const boundaryIndex = normalizedEvents.findIndex((event) => event.id === throughEventId);
  return boundaryIndex >= 0 ? normalizedEvents.slice(boundaryIndex + 1) : normalizedEvents;
};

export const buildEventHistoryText = (events, { limit = 10, world = null } = {}) => {
  const normalizedEvents = (world ? getUnconsolidatedEvents(events, world) : normalizeEvents(events))
    // "Advance to <date>" markers close each turn in the chronicle, but they are
    // clock punctuation rather than history — feeding them to the model as
    // events taught it to write them itself.
    .filter((event) => event?.kind !== "advance");
  if (normalizedEvents.length === 0) {
    return "No unconsolidated events have been recorded yet.";
  }

  return normalizedEvents
    .slice(-limit)
    .map((event) => {
      const date = normalizeString(event.date) || "undated";
      const description = normalizeString(event.description);
      const impactNotes = [];

      if (event.impacts.regionTransfers.length > 0) {
        impactNotes.push(
          `Territorial shifts: ${event.impacts.regionTransfers
            .map((entry) => `${entry.regionName || entry.regionId} -> ${entry.toCode}`)
            .join(", ")}`,
        );
      }

      if (event.impacts.polityChanges.length > 0) {
        impactNotes.push(
          `Polity changes: ${event.impacts.polityChanges
            .map((entry) => `${entry.code}${entry.name ? ` renamed to ${entry.name}` : ""}${entry.color ? ` color ${entry.color}` : ""}`)
            .join(", ")}`,
        );
      }

      return [
        `- ${date}: ${event.title}`,
        description ? `  ${description}` : "",
        impactNotes.length > 0 ? `  ${impactNotes.join(" | ")}` : "",
      ].filter(Boolean).join("\n");
    })
    .join("\n");
};

// HOW MANY PARAGRAPHS OF PROSE STILL RIDE ALONG.
//
// This used to join every consolidation ever written. Measured on this campaign
// at round 27: eleven of them, 11,259 characters, ~7,037 tokens — 35% of a
// 20,960 budget, rising 150-200 a round and never falling, because prose has no
// key and so can only be appended to.
//
// Four, because the ledger now carries what has to SURVIVE and these carry what
// it reads like. The recent ones are also the ones a turn is most likely to
// follow on from; the older ones are the ones whose durable facts have already
// been keyed. Nothing is destroyed — world.consolidatedHistory keeps them all,
// and the Event Manager still shows the lot.
const PROSE_TAIL = 4;

export const buildConsolidatedHistoryText = (world) => {
  const state = normalizeWorldState(world);
  const entries = state.consolidatedHistory;
  const ledger = buildLedgerText(state.campaignLedger);
  if (entries.length === 0) {
    return ledger
      ? `WHAT IS TRUE NOW:\n${ledger}`
      : "No earlier campaign history has been consolidated yet.";
  }

  const tail = entries.slice(-PROSE_TAIL);
  const older = entries.length - tail.length;
  const prose = tail
    .map((entry) => `Through ${entry.throughDate || "an earlier date"}: ${entry.summary}`)
    .join("\n\n");

  return [
    ledger ? `WHAT IS TRUE NOW:\n${ledger}` : "",
    // Said plainly rather than silently truncated: the model should know that
    // what it can see is the recent stretch, not the whole campaign.
    older > 0
      ? `EARLIER ROUNDS (${older} consolidation(s) before ${tail[0]?.throughDate || "this"}) are represented by the standing facts above, not repeated here.`
      : "",
    prose,
  ].filter(Boolean).join("\n\n");
};

export const buildCampaignHistoryText = (events, world, { limit = 24 } = {}) => [
  "STORY SO FAR:",
  buildConsolidatedHistoryText(world),
  "",
  "RECENT EVENTS:",
  buildEventHistoryText(events, { limit, world }),
].join("\n");

export const buildChatSummaryText = (chats, { limit = 4 } = {}) => {
  const normalizedChats = normalizeChats(chats);
  if (normalizedChats.length === 0) return "No diplomatic chats are currently recorded.";

  return normalizedChats.slice(0, limit).map((chat) => {
    const participants = chat.countries.map((country) => country.name).join(", ");
    const lastMessage = chat.messages.at(-1);
    return `- ${participants}: ${lastMessage ? `${lastMessage.speaker || lastMessage.role}: ${lastMessage.text}` : "no messages yet"}`;
  }).join("\n");
};

export const buildDetailedChatHistoryText = (chats, { limit = 8, messageLimit = 10 } = {}) => {
  const normalizedChats = normalizeChats(chats);
  if (normalizedChats.length === 0) return "No chats occurred in these rounds.";

  return normalizedChats.slice(0, limit).map((chat, index) => {
    const header = `Chat ${index + 1}: ${chat.countries.map((country) => country.name).join(", ")}`;
    const body = chat.messages.length > 0
      ? chat.messages.slice(-messageLimit).map((message) => `${message.speaker || message.role}: ${message.text}`).join("\n")
      : "No messages yet.";
    return `${header}\n${body}`;
  }).join("\n\n");
};

export const buildAdvisorHistoryText = (messages, { limit = 18 } = {}) => {
  const normalizedMessages = normalizeArray(messages).map((entry) => {
    if (!entry || typeof entry !== "object") return null;
    const role = normalizeString(entry.role || entry.speaker || "message");
    const text = normalizeString(entry.text || entry.content || entry.message);
    return role && text ? `${role}: ${text}` : null;
  }).filter(Boolean);

  return normalizedMessages.length > 0
    ? normalizedMessages.slice(-limit).join("\n")
    : "No advisor messages are currently recorded.";
};

// `limit` keeps the resolved-action roster from growing without bound: it is
// every order the player has ever given, and at ~40 chars each a long campaign
// turns it into kilobytes of prompt that push the ANSWER out of the context
// window. The most recent orders are the ones that still matter.
export const buildActionHistoryText = (actions, { includeResolved = false, limit = 0 } = {}) => {
  const normalizedActions = normalizeActions(actions);
  const all = includeResolved
    ? normalizedActions
    : normalizedActions.filter((action) => action.status === "planned");
  // Never drop something still queued — those are this turn's work.
  const filteredActions = limit > 0 && all.length > limit
    ? [...all.filter((action) => action.status === "planned"),
      ...all.filter((action) => action.status !== "planned").slice(-limit)]
    : all;
  if (filteredActions.length === 0) {
    return includeResolved ? "No actions have been recorded yet." : "No planned actions are currently queued.";
  }

  return filteredActions.map((action) => {
    const kindLabel = action.kind === "chat" ? "chat" : "action";
    const statusLabel = action.status !== "planned" ? ` [${action.status}]` : "";
    // The id is PART of the line on purpose: resolution is id-based
    // (impacts.actionIds), and the model can only reference ids it was shown —
    // without this, every jump came back with actionIds=[] and the queue never
    // resolved precisely.
    // A hand-typed order has no title (see normalizeActionEntry) — printing an
    // empty one leaves a stray colon where the model expects a label.
    const label = action.title ? `${action.title}${statusLabel}: ` : `${statusLabel ? `${statusLabel.trim()}: ` : ""}`;
    return `- (${kindLabel}) [id: ${action.id}] ${label}${buildActionDisplayText(action)}`;
  }).join("\n");
};

// Compact roster of everything the player has ALREADY ordered — titles only,
// newest last, no ids or body text. The suggestions prompt never received the
// player's own orders at all (its template has no action placeholder), so the
// brainstormer kept re-proposing initiatives that were already carried out:
// "재생에너지 확대" was suggested three times across two rounds and the world
// dutifully rebuilt the same solar programme three times. This is the list that
// tells it what not to propose again.
// Is this planned order in trouble — bounced at least once, or fully stalled?
// The queue stores the verdict on the planned entry itself (outcome/outcomeNote/
// failCount ride along until a success strips them), so trouble is readable
// without consulting the resolution history.
const orderTroubleState = (action) => {
  if ((action?.status ?? "planned") !== "planned") return "";
  if (isStalledOrder(action)) return "stalled";
  if ((Number(action?.failCount) || 0) >= 1) return "bounced";
  return ["failed", "backfired"].includes(action?.outcome) ? "bounced" : "";
};

export const buildExistingOrdersText = (actions, { limit = 60 } = {}) => {
  const all = normalizeActions(actions);
  const recent = all.slice(Math.max(0, all.length - limit));
  if (recent.length === 0) return "";
  // A queued order that failed reads DIFFERENTLY from a fresh one: the
  // brainstormer and the advisor were blind to failures ("(queued)" was all
  // anything said), so nothing downstream ever engaged with a setback.
  const statusNote = (action) => {
    const trouble = orderTroubleState(action);
    if (trouble === "stalled") return ` (STALLED — failed ${action.failCount} times, waiting for the player)`;
    if (trouble === "bounced") return ` (${action.outcome || "failed"} last period — retrying)`;
    return action.status === "planned" ? " (queued, not carried out yet)" : "";
  };
  return recent
    .map((action) => `- ${action.title || buildActionDisplayText(action)}${statusNote(action)}`)
    .join("\n");
};

// Only the orders in trouble, with the model's own stated reasons — the input
// for "propose a rescue" directives. Round-41 field report, verbatim: the
// brainstorm "그에 관한 해결안 또는 개선안을 내놓지 않는" — it could not,
// because no prompt ever showed it which orders had failed or why.
// Last period's VERDICTS, successes included. The struggling list carries what
// failed; nothing carried what worked — so the board could not propose the
// follow-on stage of a success or the completion of a partial (the original's
// own feedback loop: this period's choices visibly shape the next analysis).
export const buildRecentOutcomesText = (actions, { limit = 12 } = {}) => {
  const all = normalizeActions(actions).filter((action) => action.status === "resolved" && action.outcome);
  const latestRound = Math.max(0, ...all.map((action) => Number(action.resolvedRound) || 0));
  if (latestRound === 0) return "";
  const KO = { succeeded: "성공", partial: "부분 성공", failed: "실패", backfired: "역효과" };
  return all
    .filter((action) => Number(action.resolvedRound) === latestRound)
    .slice(-limit)
    .map((action) => {
      const title = normalizeString(action.title) || buildActionDisplayText(action).slice(0, 60);
      const note = normalizeString(action.outcomeNote).slice(0, 120);
      return `- ${title} — ${KO[action.outcome] ?? action.outcome}${note ? ` (${note})` : ""}`;
    })
    .join("\n");
};

export const buildStrugglingOrdersText = (actions) => {
  const lines = [];
  for (const action of normalizeActions(actions)) {
    const trouble = orderTroubleState(action);
    if (!trouble) continue;
    const title = normalizeString(action.title) || buildActionDisplayText(action).slice(0, 80);
    const note = normalizeString(action.outcomeNote).slice(0, 180);
    lines.push(trouble === "stalled"
      ? `- "${title}" — STALLED after failing ${action.failCount} times; it will NOT run again until the player retries, edits or replaces it.${note ? ` Why it failed: ${note}` : ""}`
      : `- "${title}" — came back ${action.outcome || "failed"} last period and will retry once more.${note ? ` Why: ${note}` : ""}`);
  }
  return lines.join("\n");
};

export const formatActionsForPrompt = (actions) => normalizeArray(actions)
  .map((entry) => {
    if (typeof entry === "string") return entry.trim();
    const normalized = normalizeActionEntry(entry);
    if (!normalized) return "";
    return normalized.title
      ? `- ${normalized.title}: ${buildActionDisplayText(normalized)}`
      : `- ${buildActionDisplayText(normalized)}`;
  })
  .filter(Boolean)
  .join("\n");

export const formatDateReadable = (value) => {
  const parsed = dayjs(value);
  return parsed.isValid() ? parsed.format("D MMMM YYYY") : normalizeString(value);
};

export const buildDifficultyGuidance = (difficulty, mode = "general") => {
  const normalized = normalizeString(difficulty).toLowerCase().replace(/[\s_]+/g, "-");
  const intro = mode === "chats"
    ? "Diplomatic concessions and cooperation should scale with the difficulty."
    : "Long-term success and geopolitical leverage should scale with the difficulty.";

  switch (normalized) {
    case "very-easy": return `${intro} The player can turn even modest preparation into results, and setbacks should stay forgiving.`;
    case "easy": return `${intro} The player can convert reasonable preparation into results relatively easily.`;
    case "hard": return `${intro} The player should need stronger leverage, preparation, and credibility before major outcomes stick.`;
    case "very-hard":
    case "extreme": return `${intro} Major outcomes should require overwhelming preparation, sustained leverage, or unusually favorable conditions.`;
    case "impossible": return `${intro} Outcomes should almost never break the player's way without extraordinary, sustained, multi-front effort.`;
    default: return `${intro} Outcomes should feel plausible and earned without becoming static.`;
  }
};

export const buildRecentRoundsWithDates = (bundle) => {
  const history = normalizeArray(bundle.world?.simulationHistory);
  if (history.length === 0) return `Current round only: ${bundle.game.gameDate || "unknown date"}`;
  return history.slice(0, 8)
    .map((entry) => `${entry.fromDate || "unknown"} -> ${entry.toDate || entry.date || "unknown"}`)
    .join("; ");
};

export const buildUnitsSummaryText = (world) => {
  const units = normalizeArray(world?.units);
  if (units.length === 0) return "No military units are currently deployed on the map.";
  return units.slice(0, 60).map((unit) => {
    const lat = Number(unit.lat);
    const lng = Number(unit.lng);
    const coords = Number.isFinite(lat) && Number.isFinite(lng)
      ? `lat ${lat.toFixed(2)}, lng ${lng.toFixed(2)}`
      : "unknown location";
    const line = `- ${unit.name} [id ${unit.id}] (${unit.type}, owner ${unit.ownerCode}, strength ${unit.strength}, status ${unit.status}) at ${coords}${unit.regionId ? `, region ${unit.regionId}` : ""}`;
    // The formation's own history, when the player has given it one. Indented
    // under its unit so it reads as belonging to that line and not as a new
    // entry, the same shape the timeline's per-entry impacts use.
    const history = normalizeString(unit.history);
    return history ? `${line}\n    what this formation is: ${history}` : line;
  }).join("\n");
};

// Structures founded during play (world.markers): cities, military bases,
// bunkers, missile silos, embassies. Listed with coordinates so the model can
// reference, defend, target, or expand them — and knows their names are taken.
export const buildMarkersSummaryText = (world) => {
  const markers = normalizeArray(world?.markers);
  if (markers.length === 0) return "No structures have been built during play yet.";
  // THE NEWEST SIXTY, NOT THE OLDEST. This read `.slice(0, 60)` and the list is
  // appended to, so on a campaign that had built eighty structures the twenty most
  // RECENT were invisible — the model could not see what it put up last month and
  // duly put up another. Measured on the live map when the player asked why it was
  // so cluttered: sixteen energy facilities, fourteen quantum ones, and among the
  // twenty it could not see were 양자-반도체 물리 차단 구역, 경기·인천 양자 보안 성벽,
  // 제주 바이오-양자 보안 허브 and 수소-양자 통합 모델 클러스터.
  const recent = markers.slice(-60);
  // A flat inventory of sixty lines does not read as "you already have fourteen of
  // these". The tally does, and `kind` is normalized by the engine, so it is a
  // reliable grouping in any language.
  const byKind = new Map();
  for (const marker of markers) {
    const kind = normalizeString(marker?.kind) || "unclassified";
    byKind.set(kind, (byKind.get(kind) ?? 0) + 1);
  }
  const tally = [...byKind.entries()]
    .sort((a, b) => b[1] - a[1])
    .filter(([, count]) => count > 1)
    .map(([kind, count]) => `${kind} ×${count}`)
    .join(", ");
  const header = [
    `${markers.length} structure(s) have been built during play${recent.length < markers.length ? ` (the ${recent.length} most recent are listed)` : ""}.`,
    tally ? `Already standing, by type: ${tally}.` : "",
    "BEFORE FOUNDING A NEW ONE, READ THIS LIST. If something here already serves the purpose, the event should EXTEND it — say so in the text, and use a rename or a note rather than a build. Founding a fifteenth facility of a type the player already has fourteen of is clutter, not progress; the map is a place, not a list of initiatives.",
    "",
  ].filter(Boolean).join("\n");
  return header + recent.map((marker) => {
    const lat = Number(marker.lat);
    const lng = Number(marker.lng);
    const coords = Number.isFinite(lat) && Number.isFinite(lng)
      ? `lat ${lat.toFixed(2)}, lng ${lng.toFixed(2)}`
      : "unknown location";
    return `- ${marker.name} [id ${marker.id}] (${marker.kind}${marker.ownerCode ? `, owner ${marker.ownerCode}` : ""}) at ${coords}${marker.note ? ` — ${marker.note}` : ""}`;
  }).join("\n");
};

// City coordinates for the model, so troop deployments and events land on the
// actual city instead of a guess. Two sources, mirroring the map's own layer:
// custom-city scenarios use their era set; everything else uses the significant
// slice of the stock database (capitals + metropolises). Only the stock slice is
// cached — it's a static asset, while the custom set changes with the scenario.
// The list is a COORDINATE lookup for unitOps and markerOps, not an atlas: what
// matters is that the places this turn can plausibly touch are in it. A flat
// "capital or over two million people, top 200 by population" rule filled it with
// a dozen interchangeable Chinese and Indian metropolises while a 30k-token
// prompt left the model no room to answer, so selection is now relevance-first
// and capped per country — no single populous nation can crowd out the rest of
// the world.
const CITY_CATALOG_LIMIT = 90;
// Cities named for the countries actually in play (the player, whoever they are
// talking to, whoever holds re-owned land).
const CITY_PER_FOCUS_COUNTRY = 5;
const CITY_PLAYER_COUNTRY_LIMIT = 10;
// Everyone else: capitals matter (they are political objects), ordinary big
// cities barely do — at most this many per country, and only genuinely large ones.
const CITY_PER_OTHER_COUNTRY = 2;
const CITY_OTHER_POPULATION_FLOOR = 3000000;
// Capitals are the backbone of the list — every country gets its seat of power.
const CITY_CAPITAL_LIMIT = 70;
// Geographic spread for the non-capital tail, used where the source has no
// country field (the stock database has none).
const CITY_GRID_DEGREES = 8;
const CITY_PER_GRID_CELL = 1;
const _stockCityCatalogCache = new Map();

// Same resolution the editor's city importer uses: the seed rides the content
// node on web builds and same-origin /assets locally.
// Resolved lazily rather than at import. Vite replaces `import.meta.env.VITE_*`
// wherever it appears, so this is identical in the browser — but evaluating it
// at module scope meant plain Node could not import this file at all
// (`import.meta.env` is undefined outside Vite), which put every function in
// here beyond the reach of a test.
const citySeedUrl = () => `${(import.meta.env?.VITE_OH_PMTILES_URL || "/assets").replace(/\/$/, "")}/cities-seed.json`;

const formatCityLine = (name, country, lat, lng, extra = "") =>
  `- ${name}${country ? ` (${country})` : ""}: lat ${Number(lat).toFixed(2)}, lng ${Number(lng).toFixed(2)}${extra}`;

// Picks a bounded, relevant slice out of a full city list. Shared by both
// sources so the custom-city scenarios get the same treatment as the stock map.
// Priority order: the player's own cities, then the countries in play, then a
// world tail of capitals and genuinely major cities — every tier capped per
// country so one populous nation cannot fill the budget on its own.
const isCapitalCity = (city) => city?.capital === true
  || city?.capital === "primary"
  || (Array.isArray(city?.tags) && city.tags.includes("capital"));

const selectSignificantCities = (cities, { playerCountry = "", focusCountries = [] } = {}) => {
  const key = (value) => normalizeString(value).toLowerCase();
  const player = key(playerCountry);
  const focus = new Set(focusCountries.map(key).filter(Boolean));
  focus.delete(player);
  const picked = [];
  const seen = new Set();
  const perCountry = new Map();
  const perCell = new Map();
  // The stock database has no country field at all — every entry is just a name,
  // a coordinate and a population — so "at most N per country" cannot be applied
  // to it. A coarse geographic grid stands in: capping per cell keeps one dense,
  // populous region from taking over the list, which is exactly what a straight
  // population ranking did (a dozen interchangeable Chinese metropolises while
  // whole continents went unrepresented).
  const cellOf = (city) => {
    const [lng, lat] = Array.isArray(city?.coord) ? city.coord : [];
    if (!Number.isFinite(lng) || !Number.isFinite(lat)) return null;
    return `${Math.floor(lng / CITY_GRID_DEGREES)}:${Math.floor(lat / CITY_GRID_DEGREES)}`;
  };
  // The seed carries the same place more than once (two "Delhi" rows, two
  // "Mexico City"), and a duplicated coordinate line is pure waste.
  const takenNames = new Set();
  const take = (city, { countryCap = 0, cellCap = 0 } = {}) => {
    if (seen.has(city) || picked.length >= CITY_CATALOG_LIMIT) return;
    const nameKey = key(city.name);
    if (nameKey && takenNames.has(nameKey)) return;
    const country = key(city.country);
    if (countryCap > 0 && country && (perCountry.get(country) ?? 0) >= countryCap) return;
    const cell = cellOf(city);
    if (cellCap > 0 && cell && (perCell.get(cell) ?? 0) >= cellCap) return;
    if (country) perCountry.set(country, (perCountry.get(country) ?? 0) + 1);
    if (cell) perCell.set(cell, (perCell.get(cell) ?? 0) + 1);
    if (nameKey) takenNames.add(nameKey);
    seen.add(city);
    picked.push(city);
  };
  const ranked = [...cities].sort((a, b) =>
    (isCapitalCity(b) ? 1 : 0) - (isCapitalCity(a) ? 1 : 0) || (b.population ?? 0) - (a.population ?? 0));

  // 1. The player's own country, where most of their orders land. Only possible
  //    when the source names countries (custom-city scenarios).
  if (player) for (const city of ranked) {
    if (key(city.country) === player) take(city, { countryCap: CITY_PLAYER_COUNTRY_LIMIT });
  }
  // 2. The countries in play this turn.
  if (focus.size > 0) for (const city of ranked) {
    if (focus.has(key(city.country))) take(city, { countryCap: CITY_PER_FOCUS_COUNTRY });
  }
  // 3. Capitals. A capital is a political object, worth its line whatever its
  //    size — this is what makes the list useful for diplomacy and for events in
  //    countries that have no giant cities at all.
  let capitals = 0;
  for (const city of ranked) {
    if (capitals >= CITY_CAPITAL_LIMIT) break;
    if (!isCapitalCity(city) || seen.has(city)) continue;
    take(city, { countryCap: CITY_PER_OTHER_COUNTRY });
    capitals += 1;
  }
  // 4. A thin tail of genuinely large non-capitals, spread across the globe.
  for (const city of ranked) {
    if (picked.length >= CITY_CATALOG_LIMIT) break;
    if (seen.has(city) || isCapitalCity(city)) continue;
    if ((city.population ?? 0) < CITY_OTHER_POPULATION_FLOOR) continue;
    take(city, { cellCap: CITY_PER_GRID_CELL, countryCap: CITY_PER_OTHER_COUNTRY });
  }
  return picked;
};

export const buildCityCatalogText = async (world, { playerCountry = "", focusCountries = [] } = {}) => {
  try {
    if (world?.customCities) {
      const geojson = await readJson(JSON_URLS.citiesGeojson, { defaultValue: null, force: true });
      const cities = normalizeArray(geojson?.features)
        .filter((feature) => Array.isArray(feature?.geometry?.coordinates))
        .map((feature) => {
          const props = feature.properties ?? {};
          const [lng, lat] = feature.geometry.coordinates;
          return {
            capital: props.capital,
            coord: [lng, lat],
            country: props.country || props.admin || "",
            name: props.city || props.name || "Unnamed",
            // A scenario's own tier ranking stands in for population.
            population: props.population ?? (props.tier ? props.tier * 1000000 : 0),
          };
        });
      const chosen = selectSignificantCities(cities, { playerCountry, focusCountries });
      if (chosen.length) {
        return chosen.map((city) =>
          formatCityLine(city.name, city.country, city.coord[1], city.coord[0], city.capital === "primary" ? " (capital)" : ""),
        ).join("\n");
      }
      return "No city coordinate catalog is available.";
    }

    // The stock seed is a static asset, but the SELECTION depends on who is in
    // play, so the cache is keyed by that rather than being a single blob.
    const cacheKey = `${normalizeString(playerCountry).toLowerCase()}|${focusCountries.map((name) => normalizeString(name).toLowerCase()).sort().join(",")}`;
    if (_stockCityCatalogCache.has(cacheKey)) return _stockCityCatalogCache.get(cacheKey);
    const response = await fetch(citySeedUrl());
    const seed = response.ok ? await response.json() : [];
    const cities = normalizeArray(seed).filter((city) => Array.isArray(city?.coord));
    const chosen = selectSignificantCities(cities, { playerCountry, focusCountries });
    if (chosen.length) {
      const text = chosen.map((city) =>
        formatCityLine(city.name, city.country, city.coord[1], city.coord[0], city.capital === "primary" ? " (capital)" : ""),
      ).join("\n");
      _stockCityCatalogCache.set(cacheKey, text);
      return text;
    }
    return "No city coordinate catalog is available.";
  } catch {
    // A missing catalog degrades to the old behavior (model guesses), never breaks a jump.
    return "No city coordinate catalog is available.";
  }
};

const loadRegions = async () => loadRegionCatalog().catch(() => []);

// The land the player's polity holds — or an explicit statement that it holds none.
// A landless player is a deliberate scenario, not missing data (a government in
// exile, a stateless movement leading a campaign to take a nation back), so it must
// read to the model as an intentional condition rather than an empty field, or the
// model tries to run a normal territorial power and invents holdings.
const LANDLESS_PLAYER_TEXT =
  "This polity is LANDLESS — it currently holds no territory. It is a stateless "
  + "actor (a government-in-exile, a movement, or a power that has lost its land), "
  + "and its story is about influence, alliances, insurgency, and the fight to gain "
  + "or retake territory — not about administering provinces it does not have.";

export const buildPlayerPolityRegionsText = async (bundle, regionCatalog = null) => {
  const playerCode = normalizeString(bundle.game.country);
  if (!playerCode) return "No player polity is currently set.";
  const world = normalizeWorldState(bundle.world);
  const entries = Object.entries(world.regionOwnershipOverrides);
  const owns = entries.some(([, ownerCode]) => normalizeString(ownerCode).toLowerCase() === playerCode.toLowerCase());
  // Zero regions AND the polity exists = deliberately landless. Distinguish that
  // from a scenario that simply ships no override list (a stock modern map, where
  // the player owns their country through the base tiles, not an override).
  // isPolityLandless is the shared source of truth for that line (see gameState).
  if (!owns) {
    return isPolityLandless(world, playerCode)
      ? LANDLESS_PLAYER_TEXT
      : "No explicit player region override list is currently recorded.";
  }
  const regions = regionCatalog ?? await loadRegions();
  const lookup = new Map(regions.map((region) => [region.id, region]));
  const names = entries
    .filter(([, ownerCode]) => normalizeString(ownerCode).toLowerCase() === playerCode.toLowerCase())
    .slice(0, 24)
    .map(([regionId]) => lookup.get(regionId)?.name || regionId);
  return names.join(", ");
};

// Characters are the wrong unit for a context window, and using them hid the
// problem that eventually broke a turn. Korean, Japanese and Chinese tokenize at
// roughly 1.6 characters per token where English manages about 4 — so as a save
// fills with Korean events and orders, the prompt's TOKEN count grows more than
// twice as fast as its character count, and a budget measured in characters keeps
// reporting that everything is fine. Measured against the real thing: a build
// logged at ~68k characters arrived at the model as 26,917 tokens.
export const estimateTokens = (text) => {
  const value = String(text ?? "");
  if (!value) return 0;
  const dense = (value.match(/[\u1100-\u11ff\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uac00-\ud7af]/g) ?? []).length;
  return Math.ceil(dense / 1.6 + (value.length - dense) / 4);
};

// Join labelled sections, dropping the least important ones while the result is
// over budget. Sections carry an explicit rank; equal ranks fall together.
//
// This exists because the prompt had been grown a section at a time — city
// catalogue, region vocabulary, impact duties, era grounding, naval control,
// power profiles, disputed ground — each one defensible, and nothing anywhere
// measuring the total. It reached 26,917 tokens against a 32,768 window, which
// left about 2,000 tokens to write a whole turn in; llama.cpp is started with
// --context-shift --keep 4, so when generation ran into the ceiling it began
// silently discarding the START of the prompt — the system prompt and the tool
// schema — and the model, no longer able to see the schema it was answering
// against, stopped producing a tool call at all. That is the "Response did not
// contain parseable JSON or tool arguments" the player saw.
//
// Shedding is deterministic and logged, so a dropped section is a visible
// decision rather than a mystery.
const joinWithinBudget = (sections, budgetTokens, label) => {
  const keep = sections.filter((section) => section && section.text);
  const render = (list) => list.map((section) => section.text).join("\n");
  if (!Number.isFinite(budgetTokens) || budgetTokens <= 0) return render(keep);

  const dropped = [];
  let live = keep;
  while (estimateTokens(render(live)) > budgetTokens) {
    const worst = Math.min(...live.map((section) => section.rank ?? 9));
    if (worst >= 9) break; // nothing left that is safe to drop
    const next = live.filter((section) => (section.rank ?? 9) > worst);
    for (const section of live) if ((section.rank ?? 9) === worst) dropped.push(section.name);
    live = next;
  }
  if (dropped.length > 0) {
    console.info(`[prompt] ${label} over budget — dropped: ${dropped.join(", ")}.`);
  }
  return render(live);
};

export const buildWorldSummary = async (bundle, regionCatalog = null, { budgetTokens = 0 } = {}) => {
  const world = normalizeWorldState(bundle.world);
  const regions = regionCatalog ?? await loadRegions();
  const regionLookup = new Map(regions.map((region) => [region.id, region]));
  const territoryEntries = Object.entries(world.regionOwnershipOverrides);
  const territorySummary = territoryEntries.length === 0
    ? "No territorial overrides from the base scenario are currently recorded."
    : territoryEntries.slice(0, 60).map(([regionId, ownerCode]) => {
      const region = regionLookup.get(regionId);
      return `- ${region?.name || regionId}${region?.country ? ` (${region.country})` : ""} -> ${ownerCode}`;
    }).join("\n");
  // A ROSTER OF POWERS HAS NO ADVISORS IN IT.
  //
  // The voices contract says so in words — "never listed among the powers" —
  // and this file never read the flag that decides it. Measured across the
  // built fleet: twelve voices sit in every board's polityOverrides, and on
  // millennium-2000 ELEVEN OF THE SIXTEEN roster slots below were theirs, with
  // thirteen of twenty-two boards leaking into the forty-name profile list.
  // That is not a tidy-up: on those boards the catalogue of powers the model
  // reads is mostly the player's own cabinet, which is exactly the material a
  // scene generator casts from (PC 11차). The cap keeps its budget; what it
  // spends the budget on is countries.
  const polities = Object.values(world.polityOverrides).filter((entry) => !isTerritorylessVoice(entry));
  const politySummary = polities.length === 0
    ? "No dynamic polity overrides are currently recorded."
    : polities.slice(0, 16).map((entry) =>
      // `note` is the polity's lore — the author's (or the faction creator's) own
      // description of who this power is. It was persisted but never reached the
      // model, so a player-written backstory did nothing. It steers the story now.
      `- ${entry.code}: ${entry.name || entry.code}${entry.color ? ` (${entry.color})` : ""}${entry.aliases.length > 0 ? ` aliases ${entry.aliases.join(", ")}` : ""}${entry.note ? ` — ${entry.note}` : ""}`,
    ).join("\n");

  // What each country IS, and how it ACTS. Tags are the map-maker's, with the AI's
  // own changes layered over them — that is the whole reason tags exist, so
  // "socialist, anti-nato" steers what the Soviet Union plausibly does with no rule
  // saying so. The personality vector is the missing half: tags never said whether
  // a power answers a border incident with a note or with troops, so the model
  // re-invented every neighbour's temperament each jump and the world read as
  // arbitrary. Both on one line per country, so adding character costs one number
  // list rather than a second roster.
  //
  // Capped at 40 countries for prompt budget, and the cap is ORDERED rather than
  // whatever key order the tag map happens to have: the player, whoever is talking
  // to them, and the scenario's named actors are the powers whose character decides
  // this turn, so they can never be the ones cut. Drop whole countries rather than
  // truncating one list — "- SOV: socialist," reads as corrupt data to the model.
  const baseTags = await getNationTags().catch(() => ({}));
  const tagged = resolveAllCountryTags(baseTags, world);
  // Chat partners come from the panel, where the player talks to their own
  // advisors as often as to a foreign court — so this list carries voices too,
  // and a voice reaching the profile list gets printed with a personality
  // vector, as though it had an army and a temperament.
  const chatPartners = normalizeArray(bundle.chats).flatMap((chat) =>
    normalizeArray(chat?.countries).map((country) => toCountryName(normalizeString(country?.code))).filter(Boolean));
  const profilePriority = [
    toCountryName(normalizeString(bundle.game.country)),
    ...chatPartners,
    ...Object.keys(world.polityOverrides ?? {}),
    ...Object.keys(world.countryPersonalities ?? {}),
  ].filter(Boolean).filter((name) => !isTerritorylessVoiceName(name));
  const profileCountries = [...new Set([...profilePriority, ...Object.keys(tagged)])].slice(0, 40);
  const profileSummary = profileCountries.length === 0
    ? "No countries have defining tags or profiles."
    : profileCountries.map((code) => {
      const tags = tagged[code] ?? [];
      const personality = formatPersonality(
        resolveCountryPersonality(world, code, { tags }),
      );
      // A scenario need not ship tags at all — the shipped modern map ships none —
      // and with nothing to derive from, every power comes out a provisional ~50
      // and the profiles say nothing. Marking the unset ones is what lets the model
      // seed them from what these countries actually were, once, instead of the
      // whole system sitting inert on exactly the maps most people play.
      const provisional = world.countryPersonalities?.[code] ? "" : "*";
      return `- ${code} ${provisional}[${personality}]${tags.length ? `: ${tags.join(", ")}` : ""}`;
    }).join("\n")
      + (Object.keys(tagged).length > profileCountries.length
        ? `\n(+${Object.keys(tagged).length - profileCountries.length} more tagged countries not listed)`
        : "");
  const playerTags = resolveCountryTags(baseTags, world, bundle.game.country);

  // The region vocabulary the jump prompt promises ("every ... region ... separated
  // by a comma ... ANALYZE THIS INCREDIBLY CAREFULLY"). Until now nothing filled it,
  // so on a stock map the model saw ZERO region names and invented ones that then
  // failed resolveRegionTransfers and got silently dropped — a narrated capture that
  // never moved the map. buildRegionOwnershipText is TIERED so we hand names where
  // they are needed without dumping all ~3000 provinces every jump: FULL `name (id)`
  // lists only for the powers IN PLAY (the "focus" set below), and codes-only for
  // everyone else (the model names their regions on demand and the retry resolves
  // them). Focus = the player, anyone already re-owned, scenario-defined actors, and
  // the player's active chat partners — the likely belligerents.
  // Every focus token is a FULL COUNTRY NAME, because that is what the vocabulary is
  // keyed by (regionOwnerName). A legacy override still holding "ESP" is canonicalised
  // so it matches "Spain" — otherwise that power silently drops out of the enumerated
  // section and the model is left inventing its region names again.
  const playerName = toCountryName(normalizeString(bundle.game.country));
  const overrideOwnerNames = [...new Set(
    territoryEntries.map(([, owner]) => toCountryName(normalizeString(owner))).filter(Boolean),
  )];
  const actorNames = polities.map((entry) => toCountryName(normalizeString(entry?.code))).filter(Boolean);
  const chatNames = normalizeArray(bundle.chats).flatMap((chat) =>
    normalizeArray(chat?.countries).map((country) => toCountryName(normalizeString(country?.code))).filter(Boolean));
  const focusCodes = [playerName, ...overrideOwnerNames, ...actorNames, ...chatNames].filter(Boolean);
  // Owner name -> display name for both sections: base country names from the catalog,
  // with dynamic polity overrides layered on top (a re-owned/renamed power wins).
  const polityNames = {};
  for (const region of regions) {
    const name = String(region.country || toCountryName(region.countryCode) || "").toLowerCase();
    if (name && !polityNames[name]) polityNames[name] = region.country || toCountryName(region.countryCode);
  }
  for (const entry of polities) {
    if (entry?.code) polityNames[toCountryName(String(entry.code)).toLowerCase()] = entry.name || toCountryName(entry.code);
  }
  const regionOwnershipCatalog = buildRegionOwnershipText(regions, world.regionOwnershipOverrides, {
    focusCodes,
    polityNames,
  });

  // The seas are ownable regions on every map, but an UNCLAIMED one has no owner,
  // so the ownership catalog above (grouped by owner) never mentions it — the model
  // would have no way to learn that "Yellow Sea" is a thing it can take. List the
  // free water by name so the first naval claim of a game is resolvable. Owned seas
  // are deliberately left out here: they already appear under their owner above.
  const seaRegions = regions.filter((region) => String(region?.id ?? "").startsWith("sea_"));
  const freeSeas = seaRegions
    .filter((region) => !normalizeString(world.regionOwnershipOverrides[region.id]))
    .map((region) => region.name)
    .filter(Boolean);
  // DISPUTED GROUND. world.regionClaimants marks the regions whose ownership is
  // contested — the map has painted them in the administrator's and claimants'
  // stripes since forever, the region panel says "claimed by", the on-demand
  // briefings mention them. The one place they never reached was the prompt that
  // WRITES THE TURN, so the model narrating this period had no idea that Crimea,
  // the Golan, the Kurils or Kashmir were flashpoints: twenty-two powder kegs
  // reading as ordinary ground. Now that powers carry a grudge axis, that is
  // exactly the kind of thread the world pass should be pulling on.
  const disputeEntries = Object.entries(world.regionClaimants ?? {})
    .filter(([, claimants]) => Array.isArray(claimants) && claimants.length > 0);
  const disputeSummary = disputeEntries.length === 0
    ? "No regions on this map are recorded as disputed."
    : disputeEntries.slice(0, 40).map(([regionId, claimants]) => {
      const region = regionLookup.get(regionId);
      const holder = world.regionOwnershipOverrides[regionId] || region?.country || "unclaimed";
      return `- ${region?.name || regionId}: administered by ${holder}, claimed by ${claimants.join(", ")}`;
    }).join("\n")
      + (disputeEntries.length > 40 ? `\n(+${disputeEntries.length - 40} more disputed regions)` : "");

  const seaSummary = seaRegions.length === 0
    ? "This map has no sea regions."
    : freeSeas.length === 0
      ? "Every sea on this map is currently claimed (see the ownership list above)."
      : freeSeas.join(", ");

  // Ranked so the budget knows what to give up first. 9 = never dropped: without
  // these the model does not know who it is playing, when, or what the map's
  // regions are called, and the turn is worthless rather than merely thinner.
  return joinWithinBudget([
    { name: "core", rank: 9, text: [
      `Player polity: ${bundle.game.country || "Unknown polity"}${playerTags.length ? ` (${playerTags.join(", ")})` : ""}`,
      `Current round: ${bundle.game.round || 1}`,
      `Current date: ${bundle.game.gameDate || "unknown"}`,
      `Language: ${world.language || bundle.game.language || "English"}`,
      `Difficulty: ${bundle.game.difficulty || "standard"}`,
      `World before round one: ${world.startingTimelineText || "No world briefing provided."}`,
      `Simulation rules: ${world.simulationRules || "No extra simulation rules were provided."}`,
    ].join("\n") },
    { name: "region vocabulary", rank: 9, text: [
      "",
      "Map ownership (this IS the comma-separated region list referenced above — the "
        + "region vocabulary for regionTransfers):",
      regionOwnershipCatalog,
    ].join("\n") },
    { name: "power profiles", rank: 6, text: [
      "",
      "What each country IS (ideology, alignment, posture) and how it ACTS. The "
        + "bracketed numbers are that power's standing character, 0-100: aggr = how "
        + "readily it reaches for force, risk = how bad a position it will gamble on, "
        + "loyal = whether its commitments hold once they cost something, expand = how "
        + "much it wants more land, grudge = whether a wrong gets answered later. A "
        + "* before the brackets means nobody has set that power's character yet and "
        + "the numbers are a placeholder. Treat both as binding characterisation: act, "
        + "speak and react in keeping with them, and change them via polityChanges "
        + "only when events genuinely reshape a country.",
      profileSummary,
    ].join("\n") },
    { name: "polity registry", rank: 5, text: ["", "Dynamic polity overrides:", politySummary].join("\n") },
    { name: "active catalyst", rank: 5, text: world.activeCatalyst
      ? `\nActive catalyst: ${world.activeCatalyst.title || "untitled"} - ${world.activeCatalyst.premise || world.activeCatalyst.opening || ""}`
      : "" },
    { name: "disputed ground", rank: 4, text: [
      "",
      "Disputed regions — ground one power administers and another claims. These are "
        + "the map's standing flashpoints: a crisis, an incident, a diplomatic opening "
        + "or a war plausibly starts at one of them, and a power with a high grudge "
        + "score that lost one does not forget it. Transferring one settles the "
        + "dispute in fact if not in law.",
      disputeSummary,
    ].join("\n") },
    { name: "territorial changes", rank: 3, text: [
      "", "Territorial changes from the base scenario:", territorySummary,
    ].join("\n") },
    { name: "unclaimed seas", rank: 2, text: [
      "",
      "Unclaimed seas — transferable regions representing command of the water "
        + "(blockade, exclusive zone, control of a strait). Copy a name EXACTLY:",
      seaSummary,
    ].join("\n") },
  ], budgetTokens, "world summary");
};

export const buildPromptContext = async (bundle, {
  actionInput = "",
  advisorLimit = 18,
  catalystChoice = "",
  catalystHistory = "",
  catalystOpening = "",
  catalystPremise = "",
  chat = null,
  chatLimit = 8,
  chatsToConsolidate = "",
  eventLimit = 10,
  eventsToConsolidate = "",
  gameMasterRequest = "",
  longEventLimit = 24,
  respondingPolityName = "",
  targetDate = "",
} = {}) => {
  const normalizedChat = chat && typeof chat === "object" ? normalizeChats([chat])[0] : null;
  const regionCatalog = await loadRegions();
  const date = bundle.game.gameDate || "";
  const target = targetDate || date;
  // Who is actually in play this turn — the player, whoever holds re-owned land,
  // any scenario actor, and the player's current chat partners. The city list is
  // built around these rather than around world population rankings.
  const focusCountries = [...new Set([
    ...Object.values(normalizeWorldState(bundle.world).regionOwnershipOverrides || {}),
    // Voices out here too: they hold no ground, so a city list built around
    // them would spend its budget on nobody's country.
    ...Object.values(normalizeWorldState(bundle.world).polityOverrides || {})
      .filter((entry) => !isTerritorylessVoice(entry)).map((entry) => entry?.code),
    ...normalizeArray(bundle.chats).flatMap((chatEntry) =>
      normalizeArray(chatEntry?.countries).map((country) => country?.code || country?.name)),
  ].map((value) => normalizeString(value)).filter(Boolean))];
  const citiesSummary = await buildCityCatalogText(bundle.world, {
    focusCountries,
    playerCountry: bundle.game.country,
  });
  const recentEvents = buildEventHistoryText(bundle.events, { limit: eventLimit, world: bundle.world });
  const campaignHistory = buildCampaignHistoryText(bundle.events, bundle.world, { limit: longEventLimit });
  const allActions = buildActionHistoryText(bundle.actions, { includeResolved: true, limit: 30 });

  // The whole-prompt budget. Everything else in this file decides WHAT to say;
  // this decides how much of it there is room for.
  //
  // The binding number is the model's context window, and the failure it causes is
  // not gradual. A turn arrived at the model as a 26,917-token prompt in a 32,768
  // window, leaving ~2,000 tokens to write fifteen events with impacts in, and
  // llama.cpp — started with --context-shift --keep 4 — answered by discarding the
  // beginning of the prompt as generation ran on. The model lost sight of the tool
  // schema mid-answer and stopped emitting a tool call, and the player got a
  // deterministic fallback turn with seventeen orders left unplayed.
  //
  // So: reserve room for the ANSWER first and spend what is left. The reserve is
  // sized for a full turn (fifteen events with impacts), not an average one,
  // because the turns that overflow are exactly the busy ones.
  const CONTEXT_TOKENS = getContextTokens();
  const ANSWER_RESERVE_TOKENS = 9000;
  const FRAME_TOKENS = 11000; // the task template + tool schema + directives
  const variableBudget = Math.max(3000, CONTEXT_TOKENS - ANSWER_RESERVE_TOKENS - FRAME_TOKENS);

  // The player's own orders are the one thing that must never be shed — the whole
  // point of the queue is that a stacked-up turn plays out in full — so they are
  // measured first and everyone else divides what remains.
  const queueTokens = estimateTokens(allActions) + estimateTokens(recentEvents);
  const worldBudget = Math.max(1800, Math.round((variableBudget - queueTokens) * 0.62));
  const worldSummary = await buildWorldSummary(bundle, regionCatalog, { budgetTokens: worldBudget });

  // Two more sheddable blocks, trimmed rather than dropped: a shorter city list
  // and a shorter chronicle still say something, where an absent region
  // vocabulary would leave the model inventing region names again.
  let citiesText = citiesSummary;
  let campaignText = campaignHistory;
  const overBy = () => estimateTokens(worldSummary) + estimateTokens(citiesText)
    + estimateTokens(allActions) + estimateTokens(recentEvents) + estimateTokens(campaignText)
    - variableBudget;
  if (overBy() > 0) {
    campaignText = buildCampaignHistoryText(bundle.events, bundle.world, { limit: Math.max(4, Math.floor(longEventLimit / 2)) });
  }
  if (overBy() > 0) {
    const lines = citiesText.split("\n");
    citiesText = lines.slice(0, Math.max(12, Math.floor(lines.length / 2))).join("\n");
    console.info(`[prompt] trimmed the city catalogue to ${citiesText.split("\n").length} entries to make room for the answer.`);
  }
  const actionText = formatActionsForPrompt(bundle.actions);
  const consolidatedChatIds = new Set(
    normalizeWorldState(bundle.world).consolidatedHistory.flatMap((entry) => entry.chatIds),
  );
  const unconsolidatedChats = normalizeChats(bundle.chats)
    .filter((entry) => !consolidatedChatIds.has(entry.id));
  const currentChat = normalizedChat ?? unconsolidatedChats[0] ?? null;

  // Prompt budget, logged every build. The context window is the binding
  // constraint on a local model — a 90k-character request against a 32k-token
  // window left roughly 2,500 tokens to write a whole turn in, which is what made
  // turns crawl and retry. Printing the composition makes the next trim a
  // measurement rather than a guess.
  const chatText = JSON.stringify(unconsolidatedChats);
  const total = [worldSummary, citiesText, allActions, recentEvents, campaignText, chatText]
    .reduce((sum, text) => sum + estimateTokens(text), 0);
  console.info(
    "[prompt] world %d, cities %d, allActions %d, recentEvents %d, campaign %d, chats %d = %d tokens "
    + "(budget %d, ~%d left for the answer)",
    estimateTokens(worldSummary), estimateTokens(citiesText), estimateTokens(allActions),
    estimateTokens(recentEvents), estimateTokens(campaignText), estimateTokens(chatText),
    total, variableBudget, CONTEXT_TOKENS - FRAME_TOKENS - total,
  );
  if (total > variableBudget) {
    console.warn(
      `[prompt] ${total} tokens of context against a ${variableBudget} budget — the answer may not fit. `
      + "Raising the model's context length is the cheapest fix.",
    );
  }

  return {
    actionInput,
    actions: actionText,
    advisorMessages: buildAdvisorHistoryText(bundle.advisor || [], { limit: advisorLimit }),
    allActions,
    catalystChoice,
    catalystDate: date,
    catalystHistory,
    catalystOpening,
    catalystPercent: normalizeArray(bundle.world?.activeCatalyst?.history).length > 0
      ? `${Math.min(100, normalizeArray(bundle.world.activeCatalyst.history).length * 50)}%`
      : "0%",
    catalystPremise,
    citiesSummary: citiesText,
    chat: JSON.stringify(unconsolidatedChats),
    chatHistory: currentChat?.messages?.map((message) => `${message.speaker || message.role}: ${message.text}`).join("\n") || "No chat history.",
    chatHistoryLong: buildDetailedChatHistoryText(unconsolidatedChats, { limit: chatLimit }),
    chatParticipants: currentChat?.countries?.map((country) => country.name).join(", ") || "",
    chatSummary: buildChatSummaryText(unconsolidatedChats),
    chatsToConsolidate: chatsToConsolidate || buildDetailedChatHistoryText(unconsolidatedChats, { limit: 12, messageLimit: 50 }),
    consolidatedHistory: buildConsolidatedHistoryText(bundle.world),
    date,
    dateReadable: formatDateReadable(date),
    difficulty: bundle.game.difficulty || "standard",
    difficultyGuidanceChats: buildDifficultyGuidance(bundle.game.difficulty, "chats"),
    difficultyGuidanceJumpForward: buildDifficultyGuidance(bundle.game.difficulty, "jump"),
    existingOrders: buildExistingOrdersText(bundle.actions),
    recentOutcomes: buildRecentOutcomesText(bundle.actions),
    strugglingOrders: buildStrugglingOrdersText(bundle.actions),
    eventsToConsolidate: eventsToConsolidate || buildEventHistoryText(bundle.events, { limit: 12 }),
    gameMasterRequest,
    language: bundle.world.language || bundle.game.language || "English",
    lastSpeaker: currentChat?.messages?.at(-1)?.speaker || "",
    markersSummary: buildMarkersSummaryText(bundle.world),
    numberOfRegions: String(regionCatalog.length),
    plannedActions: buildActionHistoryText(bundle.actions),
    playerBattalionSummaries: buildUnitsSummaryText(bundle.world),
    playerPolity: bundle.game.country || "Unknown polity",
    playerPolityRegions: await buildPlayerPolityRegionsText(bundle, regionCatalog),
    recentEvents,
    recentEventsLong: campaignText,
    recentRoundsWithDates: buildRecentRoundsWithDates(bundle),
    respondingPolityName: respondingPolityName || currentChat?.countries.find((country) => country.name !== bundle.game.country)?.name || "",
    round: String(bundle.game.round || 1),
    simulationRules: normalizeString(bundle.world.simulationRules) || "No extra simulation rules were provided.",
    startDate: bundle.game.startDate || "",
    targetDate: target,
    targetDateReadable: formatDateReadable(target),
    unitsSummary: buildUnitsSummaryText(bundle.world),
    worldBeforeRoundOne: normalizeString(bundle.world.startingTimelineText) || "No pre-game world briefing was provided.",
    worldSummary,
    worldSummaryNoCity: worldSummary,
  };
};

// WHO THE PLAYER IS. Appended at call time to every prompt that either speaks to
// the player or narrates them, so campaigns carrying their own frozen prompt copy
// get it too.
//
// The advisor kept addressing the player as "대통령님" — President — and the field
// report is precise about why that is wrong: "나는 대통령이 아니라 '플레이어'야."
// The player is not the head of state. In the original this project follows,
// playing the USSR got you addressed as "comrade", never as General Secretary,
// because General Secretary Stalin was a separate person standing right there in
// the fiction — someone who could be quoted, deposed, or outlive you.
//
// That separation is worth keeping for reasons beyond address. A leader who is
// the player cannot be overthrown, cannot die, cannot be replaced by an event,
// and cannot disagree with the player — which quietly removes a whole class of
// story from the game. Keeping them distinct means stats.leader stays a real,
// mutable character and the player remains the continuous one.
export const playerIdentityDirective = (playerName) => {
  const player = normalizeString(playerName) || "the player's polity";
  return `[Who The Player Is]\n${player} is played by a human, and that human is NOT its head of state. Whoever the country sheet names as leader is a SEPARATE character in this world: they hold the office, give the speeches, sign what is signed, and can be replaced, deposed, or outlived while the player continues.\n• Never address the player by an office or rank — not President, Chairman, General Secretary, Prime Minister, Chancellor, Commander-in-Chief, Your Majesty, Your Excellency, or any equivalent in any language — and never by the leader's name. Do not write dialogue that treats the player as the person holding that office.\n• The forms this keeps coming out as, so there is no ambiguity: 대통령님, 각하, 총리님, 주석님, 서기장님, 위원장님, 폐하, Mr. President, Your Excellency. None of them, ever, in any position — not opening a message, not closing one.\n• Address them directly, in the second person, with no title. Where the polity's own culture supplies a form of address that carries no office — "comrade" in a communist state, and its equivalents elsewhere — that is the right register.\n• When something requires a head of state — a speech, a signature, a decree, a summit between heads of government — the LEADER does it, named, and the text says so. The player's orders are what the state pursues; the leader is who publicly carries them out.\n• Other polities address ${player}, its government, or its leader by name. They never write to the player as a fellow head of state.`;
};

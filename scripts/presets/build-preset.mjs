/*! Open Historia — preset generator (incl. tier-2 geometry) © 2026 Nicholas Krol, MIT (see src/Editor/LICENSE). */
// Preset generator.
//
//   node scripts/presets/build-preset.mjs scripts/presets/wwii-1939.spec.mjs
//
// Reads a data-only era spec, compiles it against the REAL region catalog
// (regions.pmtiles), and writes a complete scenario folder under
// server/data/scenarios/<id>/ plus a manifest entry. Mirrors what
// createScenario + updateScenario would produce, and additionally writes
// colors.json (which the runtime needs for map fill but which the API can't set).

import { readFileSync, writeFileSync, mkdirSync, existsSync, copyFileSync, readdirSync, statSync } from "fs";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";
import { loadRegionCatalog, buildCountryRegionIndex } from "./lib/regionCatalog.mjs";
import COUNTRY_NAMES from "../../src/runtime/generated/countryNames.js";
import { eraOwnerName, JUNK_GID0, UNCLAIMED } from "./lib/eraSovereignty.mjs";
import { isRegionReference } from "./lib/regionRef.mjs";
import { CONTRACTS } from "../../src/runtime/simulationContracts.js";
import { voicePolities } from "./lib/internalVoices.mjs";
import {
  NUTS_PREFIX_OF_LEGACY_ID, buildRegionKeyExpander,
} from "./lib/level2Expansion.mjs";
import { OWNER_SCHEMA } from "../../server/ownerMigration.js";
import {
  graftEraGeometry, buildFaceNameIndex, matchFace, toMultiPolygon, bboxOf, decimateFaceMp,
} from "./lib/eraGeometry.mjs";
import { buildOwnerBorders } from "./lib/ownerBorders.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, "..", "..");
const SCENARIOS_DIR = path.join(PROJECT_ROOT, "server", "data", "scenarios");
const DEFAULT_SCENARIO_DIR = path.join(SCENARIOS_DIR, "default");
const MANIFEST_PATH = path.join(PROJECT_ROOT, "server", "data", "scenario-manifest.json");
const BASE_COLORS_PATH = path.join(PROJECT_ROOT, "public", "assets", "colors.json");
const REGIONS_SEED_PATH = path.join(PROJECT_ROOT, "public", "assets", "regions-seed.geojson");

const hexToRgb = (hex) => {
  const h = String(hex).replace("#", "").trim();
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
};

// Deterministic pleasant color from a code — mirrors the game's procedural fill
// fallback, so owners without a curated color still get a stable, distinct tone.
const codeToColor = (code) => {
  let h = 0;
  for (let i = 0; i < code.length; i += 1) h = (h * 31 + code.charCodeAt(i)) >>> 0;
  const hue = h % 360;
  const c = 0.5;
  const x = c * (1 - Math.abs(((hue / 60) % 2) - 1));
  const m = 0.25;
  const [r, g, b] = hue < 60 ? [c, x, 0] : hue < 120 ? [x, c, 0] : hue < 180 ? [0, c, x] : hue < 240 ? [0, x, c] : hue < 300 ? [x, 0, c] : [c, 0, x];
  return [Math.round((r + m) * 255), Math.round((g + m) * 255), Math.round((b + m) * 255)];
};

const writeJson = (filePath, value) => {
  writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
};

const die = (msg) => {
  console.error(`\n[build-preset] ERROR: ${msg}\n`);
  process.exit(1);
};

// ── Era cities ────────────────────────────────────────────────────────────────
// spec.cities: [[name, at, tier, population], ...] where `at` is either the
// MODERN name of the place in cities-seed.json (coords resolved from the seed,
// e.g. ["Constantinople", "Istanbul", 4, 200000]) or explicit [lng, lat] for
// places with no modern successor (Karakorum, Cahokia...). tier drives when the
// city appears on the game map (4 = great-power capital ★, 3 = major city ◆,
// 2 = city, 1 = town); population is the historical estimate.
const CITIES_SEED_PATH = path.join(PROJECT_ROOT, "public", "assets", "cities-seed.json");

const buildCityLookup = () => {
  const seed = JSON.parse(readFileSync(CITIES_SEED_PATH, "utf8"));
  const byName = new Map();
  for (const c of seed) {
    if (!Array.isArray(c.coord) || c.coord[0] == null || c.coord[1] == null) continue;
    const key = String(c.name || "").toLowerCase();
    if (!key) continue;
    const prev = byName.get(key);
    // Same-named places (Paris, Texas...) resolve to the most populous one.
    if (!prev || (c.population || 0) > (prev.population || 0)) byName.set(key, c);
  }
  return byName;
};

const compileCities = (spec) => {
  if (!Array.isArray(spec.cities) || !spec.cities.length) return null;
  const lookup = buildCityLookup();
  const features = [];
  const cityErrors = [];
  for (const entry of spec.cities) {
    const [name, at, tier = 2, population = 0] = entry;
    let coord = null;
    if (Array.isArray(at)) {
      coord = [Number(at[0]), Number(at[1])];
    } else {
      const hit = lookup.get(String(at).toLowerCase());
      if (!hit) {
        cityErrors.push(`city "${name}": modern place "${at}" not found in cities-seed.json`);
        continue;
      }
      coord = [hit.coord[0], hit.coord[1]];
    }
    features.push({
      type: "Feature",
      geometry: { type: "Point", coordinates: coord },
      properties: {
        city: String(name),
        population: Number(population) || 0,
        capital: tier >= 4 ? "primary" : "",
        tier: Number(tier) || 2,
      },
    });
  }
  if (cityErrors.length) die(`spec city validation failed:\n  - ${cityErrors.join("\n  - ")}`);
  return { type: "FeatureCollection", features };
};

const specArg = process.argv[2];
if (!specArg) die("usage: node scripts/presets/build-preset.mjs <spec.mjs>");
const specPath = path.resolve(process.cwd(), specArg);
if (!existsSync(specPath)) die(`spec not found: ${specPath}`);

const spec = (await import(pathToFileURL(specPath).href)).default;
if (!spec?.id) die("spec must export default with an `id`");

const catalog = await loadRegionCatalog();
const index = buildCountryRegionIndex(catalog);
const validGid1 = new Set(catalog.map((r) => r.GID_1));
const validGid0 = new Set(index.keys());

// ── 1. Validate spec references ───────────────────────────────────────────────
const polityCodes = new Set(Object.keys(spec.polities ?? {}));
const errors = [];

for (const [owner, gid0List] of Object.entries(spec.countryAssignments ?? {})) {
  if (!polityCodes.has(owner)) errors.push(`countryAssignments owner "${owner}" missing from polities`);
  for (const gid0 of gid0List) {
    if (!validGid0.has(gid0)) errors.push(`countryAssignments[${owner}] references unknown GID_0 "${gid0}"`);
  }
}
const UK_LEGACY_KEYS = new Set(["GBR.1_1", "GBR.2_1", "GBR.3_1", "GBR.4_1"]);
// THE SEED IS ALSO AN AUTHORITY ON WHAT A REGION IS.
//
// validGid1 comes from regions.pmtiles, which is the validation catalog and
// lags the seed: the seed is what the map actually draws from, and it gains
// rows the moment a level-2 merge lands (Britain's ONS counties did exactly
// this). Rejecting an id the seed holds would mean no spec could name a Chinese
// prefecture or an Indian district until the tiles were regenerated — which is
// a separate, heavy job. An id in EITHER is a real region.
const seedIds = new Set(
  (JSON.parse(readFileSync(REGIONS_SEED_PATH, "utf8")).features ?? [])
    .map((feature) => String(feature?.properties?.id ?? "")),
);
for (const [gid1, owner] of Object.entries(spec.regionAssignments ?? {})) {
  // The four legacy UK level-1 keys stay valid: the builder expands them into
  // the ONS counties that replaced them (see step 2).
  if (!validGid1.has(gid1) && !seedIds.has(gid1) && !UK_LEGACY_KEYS.has(gid1)
    && !NUTS_PREFIX_OF_LEGACY_ID[gid1]) errors.push(`regionAssignments references unknown GID_1 "${gid1}"`);
  if (!polityCodes.has(owner)) errors.push(`regionAssignments[${gid1}] owner "${owner}" missing from polities`);
}
if (errors.length) die(`spec validation failed:\n  - ${errors.join("\n  - ")}`);

// Specs keep the CODE as their authoring key — assignments reference it in their
// thousands and the GID_0 grants resolve through it — but everything EMITTED is
// keyed by the polity's NAME, because that is what a region's owner says now.
const polityName = (code) => String(spec.polities?.[code]?.name ?? code);

// ── 2. Compose regionOwnershipOverrides (country-level, then region-level) ─────
//
// SUBDIVIDING A COUNTRY MUST NOT SILENTLY UNASSIGN IT. Britain's four GADM
// level-1 provinces were replaced with the ONS Open Geography Portal's 218
// counties and unitary authorities (ids like "GBR.E06000001"), and every spec
// that had written "GBR.3_1" for Scotland — magna-1444, medieval-1200,
// mongol-1300, roman-117 — suddenly matched nothing: the 1444 build came out
// with Britain unowned. Rewriting four specs would fix those four and leave the
// trap armed for the next one, so the BUILDER translates instead. The ONS code's
// first letter is the constituent nation, which is the whole mapping.
// ONE RESOLVER, SHARED WITH build-default-map (lib/level2Expansion.mjs).
//
// This used to be assembled here — the UK nation table, the NUTS table and the
// GADM parent rule, wired together inline. It moved because build-default-map
// needs the identical resolution to expand the 168 ownership facts the Modern
// Day campaign records on ids the subdivision passes replaced, and two builders
// holding their own copy of a rule is precisely how the fleet's 22 shared maps
// un-shared themselves once already (see lib/regionRef.mjs).
//
// It reads the SEED, not the pmtiles catalog: the catalog is the old
// four-province Britain until someone regenerates the tiles, while the seed is
// what the map actually draws from. Looking in the catalog found nothing and
// the expansion silently did not happen — the exact failure this exists to
// prevent.
const expandRegionKey = buildRegionKeyExpander(seedIds);

const overrides = {};
for (const [owner, gid0List] of Object.entries(spec.countryAssignments ?? {})) {
  for (const gid0 of gid0List) {
    for (const gid1 of index.get(gid0) ?? []) overrides[gid1] = polityName(owner);
  }
}
let legacyExpanded = 0;
for (const [gid1, owner] of Object.entries(spec.regionAssignments ?? {})) {
  const targets = expandRegionKey(gid1);
  if (targets.length > 1 || targets[0] !== gid1) legacyExpanded += targets.length;
  for (const target of targets) overrides[target] = polityName(owner); // region-level wins
}

// countryNameOverrides is GONE, and could not survive this rename: it mapped a
// GADM code to the label to print over it, which is meaningless once the owner IS
// the label. Every relabel it used to do now falls out of the ownership above —
// grant Germany to HRE and the region's owner reads "Holy Roman Empire", so that
// is what the map says.
//
// One case needed converting rather than deleting: a label on a country the preset
// KEEPS modern (wwii-1939's Thailand -> "Siam") had no polity to inherit from, so
// the label was the only record of the era name. Those are real polities in the
// spec now. See wwii-1939.spec.mjs.

// ── 3. polityOverrides + colors.json ──────────────────────────────────────────
// colors.json fully REPLACES the base palette at runtime (it is not merged), so
// start from the curated base so independent countries keep their colors, then
// layer the era polities on top.
const baseColors = existsSync(BASE_COLORS_PATH) ? JSON.parse(readFileSync(BASE_COLORS_PATH, "utf8")) : {};
const polityOverrides = {};
const colors = { ...baseColors };
for (const [code, p] of Object.entries(spec.polities ?? {})) {
  const name = polityName(code);
  polityOverrides[name] = {
    // No `code`: the key IS the identifier now.
    name,
    aliases: Array.isArray(p.aliases) ? p.aliases : [],
    color: p.color ?? "#888888",
    note: p.note ?? "",
    // A polity that holds ground and cannot be addressed (runtime/speechless.js).
    // Carried only when set, so no other row gains a key. Without it the flag
    // dies at the builder and the runtime falls back to a name registry that
    // cannot know what a future scenario calls its horde.
    ...(p.speechless === true ? { speechless: true } : {}),
  };
  colors[name] = hexToRgb(p.color ?? "#888888");
}

// The territory-less voices (lib/internalVoices.mjs). Stamped AFTER the spec's
// own polities and BEFORE leadership seeding: they hold no ground, so no colour
// of theirs can reach the map, and they must not be handed an officeholder —
// "Internal: Head of Military" IS the officeholder.
if (spec.internalVoices !== false) {
  const voices = voicePolities();
  Object.assign(polityOverrides, voices);
  // colors.json REPLACES the palette rather than merging with it, so a name the
  // chat list can ask about must be in it — even one that never paints ground.
  for (const [name, voice] of Object.entries(voices)) colors[name] = hexToRgb(voice.color);
}

// ── 3.5 Seed era leadership from the collected officeholder record ────────────
// The reference (src/runtime/leaderReference.js + leaderEras/ packs) was
// collected precisely so presets could draw on it. At build time each polity
// is resolved against the START DATE — by its name, then by each alias (the
// bridge that lets "British Empire" answer via "United Kingdom") — and the
// resolved leadership is stamped into polityOverrides for the scenario to
// carry. Misses are REPORTED, never silent: pre-1444 presets are honestly
// uncovered (the record starts at 1444 by design), and every other miss is a
// named to-do for the reference's data lane.
const { ensureReferenceEra, referenceLeadership } = await import("../../src/runtime/leaderReference.js");
// The codebase's own test for "this is not a person" — reused rather than
// restated, so a spelling added there is honoured here too.
const { isRoleSentinel } = await import("../../src/runtime/countryStatLedger.js");
const hasOfficeholder = (value) => Boolean(value) && !isRoleSentinel(value);
const startDateForLeaders = spec.game?.startDate ?? "";
await ensureReferenceEra(startDateForLeaders);
const leaderReport = { hits: [], misses: [] };
for (const [code, p] of Object.entries(spec.polities ?? {})) {
  const name = polityName(code);
  let resolved = null;
  let via = null;
  for (const key of [name, ...(Array.isArray(p.aliases) ? p.aliases : [])]) {
    const r = referenceLeadership(key, startDateForLeaders);
    // A SENTINEL IS NOT AN OFFICEHOLDER, AND IT MUST NOT END THE SEARCH.
    //
    // "(없음)" is a fact on record — this system has no separate such office —
    // and it is legitimately the headOfState of a great many modern rows, where
    // the leader IS the head of state. But it is not a person, and accepting it
    // here did two things at once: it recorded a polity as having leadership
    // when nobody had been found, and it stopped the alias loop before a key
    // that WOULD have found someone could be tried. roman-117 read 1 leader
    // seeded of 13 on that basis — "Han Dynasty" missed, fell through to its own
    // alias "China", matched an unbounded modern sentinel row, and Emperor An of
    // Han went on the board with a head of state of "(없음)" and no emperor.
    // The honest count there was zero, which is what got the era pack written.
    if (r && (hasOfficeholder(r.leader) || hasOfficeholder(r.headOfState))) {
      resolved = r;
      via = key;
      break;
    }
  }
  if (resolved) {
    polityOverrides[name].leadership = { asOf: startDateForLeaders, via, ...resolved };
    leaderReport.hits.push(`${name} → ${resolved.leader ?? resolved.headOfState}`);
  } else {
    leaderReport.misses.push(name);
  }
}

// ── 4. Emit scenario folder ───────────────────────────────────────────────────
const scenarioDir = path.join(SCENARIOS_DIR, spec.id);
mkdirSync(path.join(scenarioDir, "storage"), { recursive: true });
const now = new Date().toISOString();

const cityCollection = compileCities(spec);

const world = {
  regionOwnershipOverrides: overrides,
  polityOverrides,
  // Tier-2: render the era from per-region geometry (see regions.geojson below)
  // so the map shows accurate per-region ownership — the stock pmtiles only fill
  // whole countries by GID_0 and cannot depict era borders inside a country.
  customRegions: true,
  // Era-accurate cities (cities.geojson) replace the modern city labels — no
  // St. Petersburg in 117 AD, no Istanbul in 1200.
  ...(cityCollection ? { customCities: true } : {}),
  // Era-appropriate deployable troop types (e.g. no Air Force in 1200).
  ...(Array.isArray(spec.allowedUnitTypes) ? { allowedUnitTypes: spec.allowedUnitTypes } : {}),
  // The preset's own rules, then the contract every preset needs: what a region
  // MEANS when regions are modern administrative divisions of wildly different
  // size (see lib/regionContract.mjs — eight polities on the 1935 board own
  // exactly one region each). A spec can opt out with regionContract: false if
  // it ever needs to say something incompatible.
  // THE BOARD'S OWN RULES, AND NOTHING ELSE.
  //
  // The four shared contracts used to be concatenated here. They are not any
  // more — the field is loaded into TWELVE prompts, and measured across the
  // fleet the contracts were 60% of what those twelve carried: 121,674
  // characters of identical boilerplate against 80,400 of actual board. At the
  // twelve-task toll that cost more than every board combined.
  //
  // Same move SCHEDULED_EVENTS and REPORTING_CONTRACT already made, for the same
  // reason and with the same evidence (docs/analysis/contract-ab-2026-08-09.md:
  // the battle clause scored 0.48 standing alone against 0.36 inside this
  // block). Rules that only some tasks can obey do not belong in the rules every
  // task carries.
  //
  // NOTHING IS DROPPED YET. `contracts` records which ones this board carries,
  // and src/runtime/simulationContracts.js injects them at render time for every
  // consumer — so the assembled prompt is byte-identical to what this line used
  // to produce. The split exists so the A/B can take one out and measure it.
  simulationRules: (spec.simulationRules ?? "").trim(),
  contracts: CONTRACTS
    .filter((contract) => spec[contract.flag] !== false)
    .map((contract) => contract.key),
  startingTimelineText: spec.startingTimelineText ?? "",
  // THE ONE OPT-OUT THAT IS NOT A CONTRACT. The four contracts are declared
  // above and injected per consumer; this one gates a runtime pass, and for a
  // while it gated nothing at all — three specs said `scheduledEvents: false`,
  // nothing read the field, and all three shipped printing the calendar card
  // they had refused. Written only when false, so no existing save changes.
  ...(spec.scheduledEvents === false ? { scheduledEvents: false } : {}),
};

// ── regions.geojson (tier-2 custom geometry) ─────────────────────────────────
// Clone the seeded world geometry and stamp each region's era owner: the preset
// override where one exists, otherwise the region's own modern country so the
// whole map stays coloured. Written compact — pretty-printing 3.6k polygons is
// tens of MB.
const seedFc = JSON.parse(readFileSync(REGIONS_SEED_PATH, "utf8"));
// The seed geojson carries more regions than the pmtiles catalog (e.g. city
// regions like Sevastopol). Those miss the per-GID_1 overrides, so whole-country
// grants must also resolve by GID_0 or they leak their modern owner.
const gid0Owner = {};
for (const [owner, gid0List] of Object.entries(spec.countryAssignments ?? {})) {
  for (const gid0 of gid0List) gid0Owner[gid0] = polityName(owner);
}
// gid0 -> era owner, for the build report: no silent re-owning.
const eraSovereigntyMoves = new Map();
let junkRowsDropped = 0;
const regionFeatures = [];
for (const feature of seedFc.features ?? []) {
  const props = feature.properties ?? {};
  const gid1 = props.id != null ? String(props.id) : "";
  if (!gid1 || !feature.geometry) continue;
  const gid0 = props.gid0 ? String(props.gid0) : "";
  // GADM ships rows that are not places. This used to be a set keyed on gid0,
  // which caught {gid0:"NA"} and missed {id:"?", gid0:"UKR"} — a hole with a
  // real country code. Shared with build-default-map now: when only one of the
  // two builders learned about the second phantom, every preset ended up with a
  // feature the base map did not have and all 22 shared maps un-shared
  // themselves on the next rebuild.
  if (!isRegionReference(gid1, gid0)) { junkRowsDropped += 1; continue; }
  // Ownership of regions the spec does NOT assign depends on the era: ancient/
  // medieval presets leave them UNCLAIMED (many countries simply did not exist),
  // while near-modern presets (spec.unassignedKeepModernOwner) keep the modern
  // sovereign — Mexico or Turkey in 1939 were real states, not empty land.
  // Antarctica stays unclaimed in every era.
  //
  // The guard still tests gid0 — "is this Antarctica?" is a question about the
  // land, not about who owns it — but the owner it produces is the country's NAME.
  //
  // AND THE MODERN SOVEREIGN IS NOT ALWAYS THE ERA'S SOVEREIGN. GADM's map is
  // 2020's, so "keep the modern owner" put North Korea (1948), South Sudan
  // (2011), Pakistan (1947) and Northern Cyprus (1983) on the 1935 board, along
  // with every British, French, Dutch, American and New Zealand dependency
  // drawn as its own sovereign state. eraSovereignty answers who actually held
  // the ground on this date and speaks the preset's own vocabulary for it.
  let fallbackOwner = "";
  if (spec.unassignedKeepModernOwner && gid0 && gid0 !== "ATA" && !JUNK_GID0.has(gid0)) {
    const eraOwner = eraOwnerName(gid0, startDateForLeaders, {
      gid0ToPolityName: gid0Owner,
      countryNames: COUNTRY_NAMES,
    });
    if (eraOwner === UNCLAIMED) {
      // Terra nullius on this date — no state held it, and the modern name is
      // not a lesser evil (Svalbard before the 1920 treaty).
      fallbackOwner = "";
      eraSovereigntyMoves.set(gid0, "(무주지)");
    } else if (eraOwner) {
      fallbackOwner = eraOwner;
      eraSovereigntyMoves.set(gid0, eraOwner);
    } else {
      fallbackOwner = COUNTRY_NAMES[gid0] || gid0;
    }
  }
  regionFeatures.push({
    type: "Feature",
    geometry: feature.geometry,
    properties: {
      id: gid1,
      owner: overrides[gid1] ?? gid0Owner[gid0] ?? fallbackOwner,
      // GADM provenance. Stays a code: the grants above resolve through it.
      gid0,
      name: props.name ? String(props.name) : "",
      // No `country`: owner IS the country's name.
      typeId: "land",
    },
  });
}

// ── era geometry graft (plan F-3) ────────────────────────────────────────────
// Opt-in per spec: `eraGeometry: "1939-09-01"` (or { date, file }). The province
// layer above is modern GADM; where the assembler could close a polity's era
// outline, that outline is the authority and the provinces get clipped to it.
// Absent the field — or absent a dump for that date — the preset builds exactly
// as before and says so.
const eraSpec = typeof spec.eraGeometry === "string" ? { date: spec.eraGeometry } : (spec.eraGeometry ?? null);
let eraReport = null;
let regionFeaturesFinal = regionFeatures;
if (eraSpec) {
  const OHM_OUT = path.join(PROJECT_ROOT, "scripts", "ohm", "out");
  const explicit = eraSpec.file ? path.resolve(PROJECT_ROOT, eraSpec.file) : null;
  // Default discovery: whatever the assembler wrote for this date. Several zooms
  // can coexist; the newest wins and the choice is printed, never assumed.
  const discovered = explicit ? [] : (existsSync(OHM_OUT)
    ? readdirSync(OHM_OUT)
      .filter((f) => f.startsWith(`era-borders-${eraSpec.date}`) && f.endsWith(".geojson"))
      .map((f) => path.join(OHM_OUT, f))
      .sort((a, b) => statSync(b).mtimeMs - statSync(a).mtimeMs)
    : []);
  const facesPath = explicit ?? discovered[0] ?? null;
  if (!facesPath || !existsSync(facesPath)) {
    console.log(`\n[era] ${eraSpec.date} 시대 지오메트리 요청됨 — 조립 산출물 없음, 현대 프로빈스 조합으로 진행(사다리 2단).`);
    console.log(`[era]   만들려면: node scripts/ohm/extract-era-borders.mjs ${eraSpec.date} --zoom 4 --bbox <창>`);
    console.log("[era]              node scripts/ohm/fetch-era-polities.mjs " + eraSpec.date);
    console.log("[era]              node scripts/ohm/assemble-era-borders.mjs <lines> --polities <polities>");
  } else {
    const faceFc = JSON.parse(readFileSync(facesPath, "utf8"));
    // Owners on a built preset come from two families and BOTH must be
    // reachable by name: the spec's era polities, and — where unassigned
    // regions keep their modern sovereign — the modern country names.
    const modernNames = spec.unassignedKeepModernOwner ? Object.values(COUNTRY_NAMES) : [];
    const nameIndex = buildFaceNameIndex(spec.polities, modernNames);
    const specFaceOwners = Object.fromEntries(
      Object.entries(eraSpec.faceOwners ?? {}).map(([faceName, code]) => [faceName, polityName(code)]),
    );
    // ERA SOVEREIGNTY OUTRANKS A MODERN NAME MATCH. The name index carries
    // modern country names (unassignedKeepModernOwner), and OHM has era faces
    // for entities the era table says were HELD: the 1946 dump's "Isle of
    // Man" face matched the modern name and stood a crown dependency up as a
    // sovereign — the exact contradiction the region pass corrects the other
    // way in the same build (221 reassignments IMN→British Empire), caught by
    // tests/era-sovereignty.mjs (2026-08-12). A face matching a SPEC polity
    // is intended and passes untouched; a face matching only a modern name
    // defers to the era holder — the outline still grafts, the holder owns
    // it, and every redirect prints.
    const specPolityNames = new Set(Object.values(spec.polities ?? {}).map((p) => p.name));
    const MODERN_NAME_TO_GID0 = new Map(Object.entries(COUNTRY_NAMES).map(([g, n]) => [n, g]));
    const eraSovereigntyFaceRedirects = [];
    const eraSovereigntyFaceRefusals = [];
    const faces = [];
    const unmatchedFaces = [];
    const styleMatched = [];
    const excluded = new Set(eraSpec.excludeFaces ?? []);
    const excludedFaces = [];
    // A windowed dump leaves ONE face that is not a country: the frame-bounded
    // residue where the window ran past the data. It carries whichever label
    // sits in it and can span half a continent. There is no constant that
    // separates it from a large country, so it is named in the spec, and the
    // build prints every face's area and span for the human doing the naming.
    const faceSizes = [];
    // Overpass-transport faces arrive at full way resolution (~0.002° spacing;
    // 1946 totals 636,698 vertices where the tile-transport 1939 file carries
    // 66,761) and polygon-clipping pays per vertex per (region, face) pair —
    // measured 30+ min per build against seconds. Decimate on load at the
    // assembler's own coast tolerance; totals print below, drops are counted.
    const decim = { pointsIn: 0, pointsOut: 0, ringsIn: 0, ringsDropped: 0 };
    for (const face of faceFc.features ?? []) {
      const mpRaw = toMultiPolygon(face.geometry);
      if (!mpRaw) continue;
      const { mp, stats } = decimateFaceMp(mpRaw);
      decim.pointsIn += stats.pointsIn; decim.pointsOut += stats.pointsOut;
      decim.ringsIn += stats.ringsIn; decim.ringsDropped += stats.ringsDropped;
      if (!mp || mp.length === 0) continue;
      const fname = face.properties?.name ?? "";
      const fb = bboxOf(mp);
      faceSizes.push({ name: fname, span: `${(fb[2] - fb[0]).toFixed(1)}x${(fb[3] - fb[1]).toFixed(1)}` });
      if (excluded.has(fname)) { excludedFaces.push(fname); continue; }
      const hit = matchFace(face, nameIndex, specFaceOwners);
      if (!hit) { unmatchedFaces.push(face.properties?.name ?? "(무명)"); continue; }
      if (hit.via === "style") styleMatched.push(`${face.properties?.name} → ${hit.owner}`);
      if (!specPolityNames.has(hit.owner)) {
        const gid0OfModern = MODERN_NAME_TO_GID0.get(hit.owner);
        if (gid0OfModern && eraSovereigntyMoves.has(gid0OfModern)) {
          const holder = eraSovereigntyMoves.get(gid0OfModern);
          if (holder === "(무주지)") {
            eraSovereigntyFaceRefusals.push(`${fname} — 이 날짜엔 무주지`);
            continue;
          }
          eraSovereigntyFaceRedirects.push(`${fname}: ${hit.owner} → ${holder}`);
          hit.owner = holder;
        }
      }
      faces.push({
        owner: hit.owner,
        name: face.properties?.name ?? hit.owner,
        via: hit.via,
        // Source-ladder rung: 3 = historical-basemaps backfill, absent = 1
        // (assembly). graftEraGeometry suppresses rung 3 wherever rung 1
        // reaches — see the hybrid design in PLAN-F-OHM.
        rung: face.properties?.rung ?? 1,
        // Names this face fused with, resolved to OWNERS: the graft refuses its
        // authority over exactly those.
        mergedWith: (face.properties?.mergedWith ?? [])
          .map((m) => (typeof m === "string" ? { name: m } : m))
          .map((m) => matchFace({ properties: m }, nameIndex, specFaceOwners)?.owner)
          .filter(Boolean),
        keepOut: eraSpec.faceKeepOut?.[fname] ?? [],
        mp,
        bbox: bboxOf(mp),
      });
    }
    const grafted = graftEraGeometry(regionFeatures, faces);
    regionFeaturesFinal = grafted.features;
    // world.regionOwnershipOverrides is the GAME's ownership table; the geojson
    // is the MAP's. Nations.jsx treats a disagreement between the two as land
    // that changed hands mid-campaign and draws a conquest border around it, so
    // leaving the table stale would ring every era correction as a conquest on
    // turn one — and the offcut regions would exist on the map with no entry in
    // the game at all. Restate every grafted feature's owner into the table.
    let syncedOverrides = 0;
    for (const feature of regionFeaturesFinal) {
      const { id, owner } = feature.properties;
      if (!id || !owner) continue;
      if (overrides[id] === owner) continue;
      if (feature.properties.edited || String(id).startsWith("era_") || overrides[id] !== undefined) {
        overrides[id] = owner;
        syncedOverrides += 1;
      }
    }
    eraReport = { ...grafted.report, syncedOverrides, facesPath, facesTotal: (faceFc.features ?? []).length, facesMatched: faces.length, unmatchedFaces, styleMatched, excludedFaces, faceSizes, eraSovereigntyFaceRedirects, eraSovereigntyFaceRefusals, decim };
  }
}

// The playable factions in this scenario (drives the start-country picker):
// every distinct owner actually present on the finished map — era polities plus,
// on near-modern presets, the independent countries that kept their modern owner.
world.ownerCodes = [...new Set(regionFeaturesFinal.map((f) => f.properties.owner).filter(Boolean))].sort();
// Built name-keyed, so mark it migrated: otherwise the store runs the migrator
// over a freshly-generated preset on first read.
world.ownerSchema = OWNER_SCHEMA;
writeJson(path.join(scenarioDir, "world.json"), world);

// Guarantee a color for every owner in the map (curated where known, else a
// stable procedural tone) so no region renders on the client's gray fallback.
//
// Keyed by NAME, hashed from the region's GADM CODE. The hash source matters: an
// unassigned country keeps its modern owner, so hashing the name would re-roll
// every such country's colour against what it was when the owner was a code.
// Hashing gid0 keeps them all exactly where they were. Era polities never reach
// here — they took their curated colour from the spec above.
for (const feature of regionFeaturesFinal) {
  const { owner, gid0 } = feature.properties;
  if (owner && !colors[owner]) colors[owner] = codeToColor(gid0 || owner);
}
writeJson(path.join(scenarioDir, "colors.json"), colors);
writeFileSync(
  path.join(scenarioDir, "regions.geojson"),
  JSON.stringify({ type: "FeatureCollection", features: regionFeaturesFinal }),
  "utf8",
);

// The board's own national border (lib/ownerBorders.mjs says why level 0 could
// not stay). Written for every board, including the modern ones where it agrees
// with GADM — a board that says nothing about its borders is a board the game
// has to guess about, and guessing is what put the 2026 map over the Reich.
{
  const t0 = Date.now();
  const { collection, stats } = buildOwnerBorders(regionFeaturesFinal);
  writeFileSync(path.join(scenarioDir, "borders.geojson"), JSON.stringify(collection), "utf8");
  console.log(
    `[borders] 국경 세그먼트 ${stats.segments.frontier} → ${stats.parts}줄 · ` +
    `내부 ${stats.segments.interior} · 해안 ${stats.segments.exterior} · ` +
    `현대 윤곽 유지 ${stats.intact.length}/${stats.intactOf}개국 · ${Date.now() - t0}ms`,
  );
  if (stats.segments.overCounted > 0) {
    // A segment with three regions on it has no two sides to compare, so the
    // third and beyond are dropped — counted here rather than swallowed.
    //
    // On a plain GADM board this should be zero and a non-zero number means the
    // seed stopped sharing vertices exactly, which is the assumption the whole
    // method rests on (measured over the full seed: 2,533,136 distinct segments,
    // every one appearing exactly once or exactly twice). On a board with era
    // geometry grafted in it is expected and small — an authored face meets seed
    // regions that still share their old edge — medieval-1200 carries 59 against
    // 69,477 border segments. Large here, or non-zero without a graft, is the
    // signal worth chasing.
    console.warn(`[borders] 세 번 이상 등장한 세그먼트 ${stats.segments.overCounted}개 — 세 번째 이후는 버렸다`);
  }
}

if (cityCollection) {
  writeJson(path.join(scenarioDir, "cities.geojson"), cityCollection);
}

writeJson(path.join(scenarioDir, "game.json"), {
  // The played country is an owner reference like any other: "ROM" must reach
  // "Roman Empire", or the player starts owning nothing on every preset.
  country: spec.game?.country ? polityName(spec.game.country) : "",
  startDate: spec.game?.startDate ?? "",
  gameDate: spec.game?.gameDate ?? spec.game?.startDate ?? "",
  round: 1,
  difficulty: "standard",
  language: "English",
});

// Scenario cover image: meta.coverImage points at a project-relative jpg (we
// reuse the era-matched loading-screen art). Copied into the scenario so the
// library card shows it; survives regeneration because it lives in the spec.
const m = spec.meta ?? {};
let coverContentType = null;
if (m.coverImage) {
  const coverSrc = path.resolve(PROJECT_ROOT, m.coverImage);
  if (existsSync(coverSrc)) {
    copyFileSync(coverSrc, path.join(scenarioDir, "cover-image.bin"));
    coverContentType = "image/jpeg";
  } else {
    console.warn(`[build-preset] coverImage not found: ${coverSrc}`);
  }
}

writeJson(path.join(scenarioDir, "scenario.json"), {
  accentColor: m.accentColor ?? "#7c3aed",
  coverImageContentType: coverContentType,
  createdAt: now,
  description: m.description ?? "",
  eyebrow: m.eyebrow ?? "Historical Preset",
  heroSubtitle: m.heroSubtitle ?? "",
  heroTitle: m.heroTitle ?? m.name ?? spec.id,
  id: spec.id,
  name: m.name ?? spec.id,
  subtitle: m.subtitle ?? "",
  updatedAt: now,
});

for (const key of ["actions", "advisor", "chat", "events"]) {
  writeJson(path.join(scenarioDir, "storage", `${key}.json`), []);
}

// prompts.json copied verbatim from default (already templates ${startDate}).
copyFileSync(path.join(DEFAULT_SCENARIO_DIR, "prompts.json"), path.join(scenarioDir, "prompts.json"));

// ── 5. Register in manifest (idempotent) ──────────────────────────────────────
const manifest = existsSync(MANIFEST_PATH)
  ? JSON.parse(readFileSync(MANIFEST_PATH, "utf8"))
  : { activeScenarioId: "default", selectedScenarioId: "default", order: ["default"], version: 2 };
if (!manifest.order.includes(spec.id)) manifest.order.push(spec.id);
writeJson(MANIFEST_PATH, manifest);

// ── 6. Coverage report ────────────────────────────────────────────────────────
const perPolity = {};
for (const owner of Object.values(overrides)) perPolity[owner] = (perPolity[owner] ?? 0) + 1;
const assigned = Object.keys(overrides).length;
console.log(`\n[build-preset] "${spec.id}" written to ${path.relative(PROJECT_ROOT, scenarioDir)}`);
console.log(`  regions assigned: ${assigned}/${catalog.length} (${catalog.length - assigned} keep modern owner)`);
console.log(`  regions.geojson: ${regionFeaturesFinal.length} features (customRegions=true, tier-2 render)`);
if (cityCollection) {
  console.log(`  cities.geojson: ${cityCollection.features.length} era cities (customCities=true)`);
}
console.log(`  polities: ${Object.keys(polityOverrides).length}`);
if (legacyExpanded > 0) console.log(`  legacy level-1 key(s) expanded to ${legacyExpanded} subdivided region(s)`);
if (eraSovereigntyMoves.size > 0) {
  const moves = [...eraSovereigntyMoves.entries()].map(([code, owner]) => `${code}→${owner}`);
  console.log(`  era sovereignty: ${moves.length} modern code(s) held by someone else on this date`);
  console.log(`    ${moves.join(", ")}`);
}
if (junkRowsDropped > 0) console.log(`  dropped ${junkRowsDropped} non-place GADM row(s)`);
console.log(`  era leaders seeded: ${leaderReport.hits.length}/${Object.keys(polityOverrides).length}${leaderReport.misses.length ? ` — 미기록: ${leaderReport.misses.join(", ")}` : ""}`);
console.log("  per-polity region counts:");
for (const [code, n] of Object.entries(perPolity).sort((a, b) => b[1] - a[1])) {
  console.log(`    ${String(code).padEnd(7)} ${n}`);
}
if (eraReport) {
  // Every region lands in exactly one bucket and every drop is named — a graft
  // that quietly covered less than it claims is worse than no graft.
  const r = eraReport;
  console.log(`  시대 지오메트리(F-3): ${path.relative(PROJECT_ROOT, r.facesPath)}`);
  if (r.decim && r.decim.pointsIn > 0) {
    console.log(`    면 데시메이션(0.01°, 로드 시): 정점 ${r.decim.pointsIn} → ${r.decim.pointsOut}, 붕괴 링 ${r.decim.ringsDropped}/${r.decim.ringsIn} 드롭(마이크로 루프)`);
  }
  console.log(`    면 ${r.facesMatched}/${r.facesTotal} 매칭${r.unmatchedFaces.length ? ` — 미매칭: ${r.unmatchedFaces.join(", ")}` : ""}`);
  if (r.excludedFaces.length) console.log(`    스펙이 배제한 면 ${r.excludedFaces.length}건(창 잔여 면 등): ${r.excludedFaces.join(", ")}`);
  if (r.styleMatched.length) console.log(`    양식 정규화 매칭(사람 눈 확인 권장) ${r.styleMatched.length}건: ${r.styleMatched.join(", ")}`);
  if (r.eraSovereigntyFaceRedirects?.length) console.log(`    시대 종주권 우선 — 현대 이름 면 ${r.eraSovereigntyFaceRedirects.length}건을 보유국으로: ${r.eraSovereigntyFaceRedirects.join(", ")}`);
  if (r.eraSovereigntyFaceRefusals?.length) console.log(`    시대 종주권 우선 — 무주지 면 ${r.eraSovereigntyFaceRefusals.length}건 거부: ${r.eraSovereigntyFaceRefusals.join(", ")}`);
  console.log(`    지역 ${r.regionsIn} → ${regionFeaturesFinal.length}: 무접촉 ${r.untouched} · 확인 ${r.confirmed} · 재배정 ${r.reowned.length} · 절단 ${r.cut.length}(조각 +${r.offcuts})`);
  if (r.reowned.length) {
    // 전건 인쇄. 6건 샘플 + "외 N건"은 발트→루마니아 90건을 꼬리에 숨겼다
    // (2026-08-14 실측) — 재배정은 손 스펙을 뒤집는 행위라 전량이 검수
    // 대상이고, 숨긴 꼬리는 "전건 기명" 계약 위반이다. 소유주별로 접어서
    // 줄 수는 억제하되 지역 id는 하나도 떨구지 않는다.
    const byMove = new Map();
    for (const x of r.reowned) {
      const key = `${x.from || "(무주)"}→${x.to}`;
      if (!byMove.has(key)) byMove.set(key, []);
      byMove.get(key).push(x.id);
    }
    console.log(`    재배정 상세 (${r.reowned.length}건 전량):`);
    for (const [move, ids] of [...byMove.entries()].sort((a, b) => b[1].length - a[1].length)) {
      console.log(`      ${move} ×${ids.length}: ${ids.join(", ")}`);
    }
  }
  if (r.cut.length) {
    console.log(`    절단 상세 (${r.cut.length}건 전량): ${r.cut.map((c) => `${c.id}(${c.pieces.map((p) => p.owner || "무주").join("/")})`).join(", ")}`);
  }
  if (r.droppedSlivers.length) {
    const worst = r.droppedSlivers.slice().sort((a, b) => (b.fraction ?? 0) - (a.fraction ?? 0))[0];
    const byWhy = r.droppedSlivers.reduce((acc, x) => ({ ...acc, [x.why ?? "fraction"]: (acc[x.why ?? "fraction"] ?? 0) + 1 }), {});
    console.log(`    슬리버 접기 ${r.droppedSlivers.length}건(지분 미달 ${byWhy.fraction ?? 0} · 폭 미달 ${byWhy.width ?? 0} · 최대 지분 ${((worst.fraction ?? 0) * 100).toFixed(2)}% — ${worst.id}/${worst.owner || worst.face || "(무주)"}): 다수 소유주로 흡수, 지도에서 사라지지 않음`);
  }
  if (r.cutFractions.length) {
    const f = r.cutFractions.slice().sort((a, b) => a - b);
    const q = (p) => f[Math.min(f.length - 1, Math.floor(p * f.length))];
    const w = r.cutWidths.slice().sort((a, b) => a - b);
    console.log(`    절단 소수측 지분 분포: 최소 ${(q(0) * 100).toFixed(1)}% · 중앙 ${(q(0.5) * 100).toFixed(1)}% · 최대 ${(f[f.length - 1] * 100).toFixed(1)}% (하한 2%)`);
    console.log(`    절단 소수측 유효폭 분포: 최소 ${w[0]?.toFixed(3)}° · 중앙 ${w[Math.floor(w.length / 2)]?.toFixed(3)}° · 최대 ${w[w.length - 1]?.toFixed(3)}° (하한 0.06° = 용접 거리)`);
  }
  if (r.clipFailures.length) console.log(`    ⚠ 클립 실패 ${r.clipFailures.length}건 — 해당 지역은 현대 모양·스펙 소유주 유지: ${r.clipFailures.slice(0, 4).map((f) => `${f.id}/${f.face}`).join(", ")}`);
  if (r.nonAreaGeometry) console.log(`    면 아닌 지오메트리 ${r.nonAreaGeometry}건 통과`);
  if (r.keepOutRefusals.length) {
    const faceNames = [...new Set(r.keepOutRefusals.map((x) => x.face))];
    console.log(`    스펙 차단 구역 ${r.keepOutRefusals.length}건 — ${faceNames.join(", ")} 면은 해당 GADM 국가에 들어가지 않음`);
  }
  if (r.mergedRefusals.length) {
    const owners = [...new Set(r.mergedRefusals.map((x) => x.owner))];
    console.log(`    융합 면 권위 거부 ${r.mergedRefusals.length}건 — 삼켜진 소유주(${owners.join(", ")})의 지역엔 그 면을 적용하지 않음`);
  }
  if (r.rung3Regions > 0 || r.rung3Suppressed > 0) {
    console.log(`    하이브리드(rung 2+3): rung-3 백필이 자른 지역 ${r.rung3Regions} · rung-1 우선으로 rung-3 억제 ${r.rung3Suppressed}`);
  }
  console.log(`    소유권 테이블 동기화 ${r.syncedOverrides}건 — 지도와 게임이 같은 소유주를 말한다(1턴째 가짜 정복선 방지)`);
}
console.log(`  manifest order: [${manifest.order.join(", ")}]\n`);

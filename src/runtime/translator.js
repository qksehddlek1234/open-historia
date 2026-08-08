/*! Open Historia — AI-powered UI translator (pre-translating) © 2026 Nicholas Krol, MIT (see src/Editor/LICENSE). */

// Translates the game into the player's language using whatever AI provider
// is configured. Two layers:
//
// 1. A one-time PRE-TRANSLATION pass per language: on boot (and after
//    switching languages) every string the game can show — the rendered DOM,
//    scenario/game catalogs, country and polity names, region names, events,
//    difficulty labels, Community-hub posts — is translated up front, with a
//    progress pill, and cached in localStorage. After the pass, menus and
//    tabs open already-translated: cached strings are applied synchronously
//    as elements appear, so there is no English flash.
// 2. A MutationObserver keeps applying the cache to new DOM and quietly
//    translates the few strings the pre-pass couldn't know (AI replies
//    already arrive in-language via languageDirective, so this is rare).

import {
  DEFAULT_LANGUAGE,
  getStoredLanguage,
  isRtlLanguage,
  languageDisplayName,
  syncLanguageFromServer,
} from "./i18n.js";

const CACHE_PREFIX = "i18n_cache_";
const CACHE_LIMIT = 8000;
// 60 strings in one JSON array was more than the smallest configured model could
// hold together — it is the batch size that produces the hybrids the guard above
// now catches. Smaller batches cost more round trips in principle; in practice the
// script-aware filter above removed most of the volume, so this is cheaper overall.
const BATCH_SIZE = 24;
const MAX_CONCURRENT_BATCHES = 3;
const SCAN_DEBOUNCE_MS = 350;
const MAX_CONSECUTIVE_FAILURES = 3;
const TRANSLATED_ATTRIBUTES = ["placeholder", "title", "aria-label"];

// Elements whose text is user-authored, machine-formatted, or must stay
// verbatim. [data-no-translate] lets any component opt out explicitly.
// (<select> is NOT skipped — dropdown options are UI text too; the language
// picker itself opts out via data-no-translate.)
const SKIP_SELECTOR = "script, style, noscript, input, textarea, [contenteditable], [data-no-translate]";

let language = DEFAULT_LANGUAGE;
let cache = new Map();
let pending = new Set();
let inFlight = false;
let stopped = false;
let cooldownUntil = 0;
let failureCount = 0;
let observer = null;
let scanTimer = null;
let persistTimer = null;
let progressEl = null;
let unsyncedEntries = {};
let syncTimer = null;
let updatedEventTimer = null;
// node → the source (English) string we last saw there, so re-renders that
// restore English are re-translated and our own writes are recognized.
const nodeSources = new WeakMap();

const cacheKey = () => `${CACHE_PREFIX}${language}`;

// New translations are pushed to the server's language pack (debounced), so
// every device — and every future session — reuses them instead of paying
// for the same AI call again. The pack lives under server/data, which the
// update script never touches.
const syncEntriesToServer = () => {
  clearTimeout(syncTimer);
  syncTimer = setTimeout(async () => {
    const entries = unsyncedEntries;
    unsyncedEntries = {};
    if (Object.keys(entries).length === 0) return;
    try {
      await fetch(`/api/lang/${language}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entries }),
      });
    } catch {
      // Old server / offline: localStorage still has them for this device.
    }
  }, 2000);
};

// Lets map-label builders re-render once translations have (newly) arrived.
const announceUpdate = () => {
  clearTimeout(updatedEventTimer);
  updatedEventTimer = setTimeout(() => {
    window.dispatchEvent(new Event("i18n:updated"));
  }, 800);
};

// The hybrid guard has to run on READ as well as on write, and this is the half
// that was missing. Rejecting a bad translation at the moment it is generated
// does nothing about the ones already sitting in localStorage and in the shared
// server pack from before the guard existed — those are merged straight into the
// cache and applied forever, which is why "Chagang-do" kept coming back as
// "차anggan도" in a brand-new scenario: the corruption does not live in the
// scenario at all, it lives in the language cache, and a language cache outlives
// every game in it. Measured on one real device: 6,462 cached strings, 70 with
// Han characters bled into Korean and 10 with a romanised run left inside a
// Hangul word ("Karuzi" → "카ruz이", "Leningrad" → "레ninger드").
//
// Dropping an entry is cheap and self-healing: the string falls back to English,
// gets queued for translation again, and if the model produces another hybrid the
// write guard keeps the English. Nothing is lost that was worth keeping.
export const dropCorrupted = (pairs, label) => {
  const kept = [];
  let dropped = 0;
  for (const [source, translated] of pairs) {
    if (typeof source !== "string" || typeof translated !== "string") continue;
    if (looksMistranslated(translated)) { dropped += 1; continue; }
    kept.push([source, translated]);
  }
  if (dropped > 0) {
    console.info(`[i18n] dropped ${dropped} corrupted cached translation(s) from the ${label}; they will be retranslated.`);
  }
  return kept;
};

const loadCache = () => {
  try {
    const raw = localStorage.getItem(cacheKey());
    const stored = Object.entries(raw ? JSON.parse(raw) : {});
    const clean = dropCorrupted(stored, "local cache");
    cache = new Map(clean);
    // Rewrite immediately when anything was dropped, so a cache that has been
    // cleaned once does not pay for it on every boot.
    if (clean.length !== stored.length) persistCache();
  } catch {
    cache = new Map();
  }
};

const persistCache = () => {
  clearTimeout(persistTimer);
  persistTimer = setTimeout(() => {
    try {
      const entries = Array.from(cache.entries()).slice(-CACHE_LIMIT);
      localStorage.setItem(cacheKey(), JSON.stringify(Object.fromEntries(entries)));
    } catch {
      // Storage full/blocked: translations still work for this session.
    }
  }, 1500);
};

// ---- progress pill (plain DOM — must exist before/outside React) ----

const showProgress = () => {
  if (progressEl || typeof document === "undefined" || !document.body) return;
  progressEl = document.createElement("div");
  progressEl.setAttribute("data-no-translate", "");
  progressEl.style.cssText =
    "position:fixed;bottom:5.2rem;left:50%;transform:translateX(-50%);z-index:10075;" +
    "background:rgba(17,24,39,0.96);border:1px solid rgba(139,92,246,0.5);border-radius:999px;" +
    "color:#fff;font-family:sans-serif;font-size:0.8rem;font-weight:600;padding:0.45rem 0.95rem;" +
    "box-shadow:0 6px 24px rgba(0,0,0,0.5);pointer-events:none;";
  document.body.appendChild(progressEl);
};

const updateProgress = () => {
  if (!progressEl) return;
  if (pending.size === 0) {
    progressEl.remove();
    progressEl = null;
    return;
  }
  progressEl.textContent = `Translating to ${languageDisplayName(language)}…`;
};

// ---- string filters & application ----

// Only strings with real words need translating; glyphs, numbers, dates-only
// fragments and emoji stay as-is. The authored language is English, so
// requiring two Latin letters is a safe "has words" test.
// Scripts that are unmistakably NOT English. When the player's language uses one
// of these, a string already written in it has nothing to gain from a round trip
// through the translation model — and a great deal to lose.
//
// This is the fix for two problems that turned out to be the same problem. Most of
// the text on screen is AI-generated, and every AI call already carries a directive
// to write in the player's language, so it arrives in Korean. But the old test was
// just "does this contain two Latin letters", and Korean prose is full of them —
// "AI", "GDP", "6G", a country code. So the game's own Korean output was being fed
// back through an 8B translation model, which returned things like "[기술 기반外交]"
// and "차anggan도": half-translated hybrids that read as corruption to the player.
// Every one of those round trips also competed with the advisor for the single GPU,
// which is why an advisor reply that should stream in seconds took minutes.
//
// Latin-script targets (French, German) are deliberately NOT listed: "Berlin" is
// spelled the same either way, so script tells you nothing there and the existing
// cache/exact-match path already handles it.
const NON_LATIN_SCRIPTS = {
  ar: /[\u0600-\u06ff]/g,
  el: /[\u0370-\u03ff]/g,
  fa: /[\u0600-\u06ff]/g,
  he: /[\u0590-\u05ff]/g,
  hi: /[\u0900-\u097f]/g,
  ja: /[\u3040-\u30ff\u4e00-\u9fff]/g,
  ko: /[\uac00-\ud7af\u1100-\u11ff]/g,
  ru: /[\u0400-\u04ff]/g,
  th: /[\u0e00-\u0e7f]/g,
  uk: /[\u0400-\u04ff]/g,
  ur: /[\u0600-\u06ff]/g,
  zh: /[\u4e00-\u9fff]/g,
};

// True when the string is ALREADY in the player's language, judged by script.
// One stray Hangul syllable is not enough — a mostly-English string with a single
// Korean word in it still wants translating — so this asks whether the target
// script carries the string rather than merely appears in it.
const isAlreadyInTargetScript = (text) => {
  const pattern = NON_LATIN_SCRIPTS[language];
  if (!pattern) return false;
  const target = (text.match(pattern) ?? []).length;
  if (target === 0) return false;
  const latin = (text.match(/[A-Za-z]/g) ?? []).length;
  return target >= latin;
};

const isTranslatable = (text) => {
  const trimmed = text.trim();
  if (trimmed.length <= 1 || trimmed.length >= 3000) return false;
  if (!/[A-Za-z]{2}/.test(trimmed)) return false;
  return !isAlreadyInTargetScript(trimmed);
};

const applyToTextNode = (node, translated) => {
  const leading = node.nodeValue.match(/^\s*/)[0];
  const trailing = node.nodeValue.match(/\s*$/)[0];
  node.nodeValue = leading + translated + trailing;
};

const visitTextNode = (node) => {
  const value = node.nodeValue ?? "";
  const trimmed = value.trim();
  if (!trimmed) {
    return;
  }

  const known = nodeSources.get(node);
  // Our own write, or a source we already queued — nothing new to do
  // (translated values usually fail isTranslatable's English test anyway,
  // but Latin-script languages need the exact-match check).
  if (known && (trimmed === (cache.get(known.source) ?? "").trim() || trimmed === known.source)) {
    if (trimmed === known.source) {
      const translated = cache.get(known.source);
      if (translated && translated !== known.source) {
        applyToTextNode(node, translated);
      }
    }
    return;
  }

  if (!isTranslatable(trimmed)) {
    return;
  }

  nodeSources.set(node, { source: trimmed });
  const translated = cache.get(trimmed);
  if (translated) {
    if (translated !== trimmed) {
      applyToTextNode(node, translated);
    }
  } else {
    pending.add(trimmed);
  }
};

const visitElementAttributes = (element) => {
  for (const attr of TRANSLATED_ATTRIBUTES) {
    const value = element.getAttribute(attr);
    if (!value || !isTranslatable(value)) {
      continue;
    }

    const translated = cache.get(value.trim());
    if (translated) {
      if (translated !== value.trim()) {
        element.setAttribute(attr, translated);
      }
    } else {
      pending.add(value.trim());
    }
  }
};

const skippedByAncestors = (element) =>
  Boolean(element && element.closest(SKIP_SELECTOR) && !element.matches("input, textarea"));

const walkSubtree = (root) => {
  if (!root) return;
  if (root.nodeType === Node.TEXT_NODE) {
    if (root.parentElement && !root.parentElement.closest(SKIP_SELECTOR)) {
      visitTextNode(root);
    }
    return;
  }
  if (root.nodeType !== Node.ELEMENT_NODE) return;

  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode: (node) =>
      node.parentElement && !node.parentElement.closest(SKIP_SELECTOR)
        ? NodeFilter.FILTER_ACCEPT
        : NodeFilter.FILTER_REJECT,
  });
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    visitTextNode(node);
  }

  const attrSelector = TRANSLATED_ATTRIBUTES.map((attr) => `[${attr}]`).join(",");
  const withAttrs = root.matches?.(attrSelector) ? [root] : [];
  for (const element of [...withAttrs, ...(root.querySelectorAll?.(attrSelector) ?? [])]) {
    if (!skippedByAncestors(element) || element.matches("input, textarea")) {
      if (!element.closest("[data-no-translate]")) {
        visitElementAttributes(element);
      }
    }
  }
};

const scan = () => {
  if (stopped || !document.body) {
    return;
  }

  walkSubtree(document.body);

  const title = document.title.trim();
  if (title && isTranslatable(title)) {
    const translatedTitle = cache.get(title);
    if (translatedTitle && translatedTitle !== title) {
      document.title = translatedTitle;
    } else if (!translatedTitle) {
      pending.add(title);
    }
  }

  void processQueue();
};

const scheduleScan = () => {
  if (stopped) {
    return;
  }

  clearTimeout(scanTimer);
  scanTimer = setTimeout(scan, SCAN_DEBOUNCE_MS);
};

// Mutations apply the cache SYNCHRONOUSLY (no debounce, no AI wait) so new
// panels open translated instead of flashing English; only genuinely new
// strings wait for the debounced scan + AI round-trip.
const handleMutations = (mutations) => {
  if (stopped) return;
  for (const mutation of mutations) {
    if (mutation.type === "characterData") {
      const parent = mutation.target.parentElement;
      if (parent && !parent.closest(SKIP_SELECTOR)) {
        visitTextNode(mutation.target);
      }
    } else {
      for (const added of mutation.addedNodes) {
        walkSubtree(added);
      }
    }
  }
  scheduleScan();
};

// ---- translation calls ----

const extractJsonArray = (raw) => {
  const text = String(raw ?? "").replace(/```(?:json)?/gi, "");
  const start = text.indexOf("[");
  const end = text.lastIndexOf("]");
  if (start === -1 || end <= start) {
    return null;
  }

  try {
    const parsed = JSON.parse(text.slice(start, end + 1));
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
};

// A returned translation that is visibly broken. The model doing this work is the
// smallest one configured, and when it slips it does not fail — it returns a
// plausible-looking hybrid, which is worse than the English it replaced. Two
// signals catch nearly all of it, both conservative enough to leave good
// translations alone:
//
//   Han characters in KOREAN output. Modern Korean UI text does not use Hanja, so
//   "[기술 기반外交]" is the model reaching for the wrong script mid-string. (Not
//   applied to ja/zh, where Han is simply correct.)
//
//   Latin glued INSIDE a run of the target script — "차anggan도", where the model
//   translated the start and end of a word and left the middle romanised. Latin
//   ADJACENT to Hangul is normal ("AI반도체"), so this only fires when target-script
//   characters sit on BOTH sides of a lowercase Latin run.
const MISTRANSLATION_CHECKS = {
  ko: [/[\u4e00-\u9fff]/, /[\uac00-\ud7af][a-z]{2,}[\uac00-\ud7af]/],
  ru: [/[\u0400-\u04ff][a-z]{2,}[\u0400-\u04ff]/],
  uk: [/[\u0400-\u04ff][a-z]{2,}[\u0400-\u04ff]/],
  el: [/[\u0370-\u03ff][a-z]{2,}[\u0370-\u03ff]/],
  th: [/[\u0e00-\u0e7f][a-z]{2,}[\u0e00-\u0e7f]/],
};

export const looksMistranslated = (translated) => {
  const checks = MISTRANSLATION_CHECKS[language];
  if (!checks) return false;
  return checks.some((pattern) => pattern.test(translated));
};

const translateBatch = async (strings) => {
  // Late import: translator boots at app start, before the AI module's
  // dependency chain (prompt packs, provider config) needs to exist.
  const { callAI } = await import("../Game/AI/main.jsx");
  const name = languageDisplayName(language);

  const systemPrompt =
    `You are the translation engine for a grand-strategy game's interface. ` +
    `Translate each English string in the user's JSON array into ${name} (${language}).\n` +
    `Rules:\n` +
    `- Answer with ONLY a JSON array of ${strings.length} strings: the translations, same order, same length.\n` +
    `- Keep numbers, dates' meaning, emoji, punctuation style, and placeholders such as \${...} intact.\n` +
    `- Country, region, and place names take their standard ${name} forms when they exist; otherwise keep them unchanged.\n` +
    `- If a string is already in ${name} or is a proper name/code with no translation, return it unchanged.\n` +
    `- Never add commentary, keys, or markdown.`;

  const raw = await callAI(systemPrompt, [
    { role: "user", parts: [{ text: JSON.stringify(strings) }] },
  ], { languageMode: "none", role: "translate" });
  const translations = extractJsonArray(raw);

  if (!translations) {
    throw new Error("translation response was not a JSON array");
  }

  return translations;
};

const processQueue = async () => {
  if (inFlight || stopped || pending.size === 0 || Date.now() < cooldownUntil) {
    return;
  }
  // A turn in progress owns the GPU. Translating now makes a single-GPU local
  // server swap models to serve this smaller role, which kills the turn's
  // in-flight request (net::ERR_FAILED) and costs the player the whole turn.
  // The queue just waits — nothing is dropped, and everything still gets
  // translated the moment the turn finishes.
  try {
    const { isHeavyAiTaskRunning } = await import("../Game/AI/main.jsx");
    if (isHeavyAiTaskRunning()) {
      scheduleScan();
      return;
    }
  } catch {
    // If that signal is unavailable, behave exactly as before.
  }

  inFlight = true;
  try {
    while (pending.size > 0 && !stopped && Date.now() >= cooldownUntil) {
      const slice = Array.from(pending).slice(0, BATCH_SIZE * MAX_CONCURRENT_BATCHES);
      const batches = [];
      for (let index = 0; index < slice.length; index += BATCH_SIZE) {
        batches.push(slice.slice(index, index + BATCH_SIZE));
      }

      const results = await Promise.all(
        batches.map((batch) =>
          translateBatch(batch)
            .then((translations) => ({ batch, translations }))
            .catch((error) => ({ batch, error })),
        ),
      );

      let failures = 0;
      for (const result of results) {
        if (result.error) {
          failures += 1;
          continue;
        }
        result.batch.forEach((source, index) => {
          const translated = typeof result.translations[index] === "string"
            ? result.translations[index].trim()
            : "";
          // Leave the English in place rather than caching a hybrid: a broken
          // translation would otherwise be pinned for the session AND synced up to
          // the shared language pack, spreading one bad batch to every device.
          // Dropped from `pending` either way so a persistently bad string cannot
          // spin the queue forever.
          if (translated && looksMistranslated(translated)) {
            console.warn(`[i18n] discarded a malformed translation: ${JSON.stringify(source)} -> ${JSON.stringify(translated)}`);
            pending.delete(source);
            return;
          }
          cache.set(source, translated || source);
          unsyncedEntries[source] = translated || source;
          pending.delete(source);
        });
      }

      if (failures === results.length) {
        failureCount += 1;
        if (failureCount >= MAX_CONSECUTIVE_FAILURES) {
          // Back off instead of giving up for the session: a provider hiccup
          // shouldn't leave the rest of the UI untranslated forever.
          failureCount = 0;
          cooldownUntil = Date.now() + 60000;
          console.warn(
            `[i18n] translation paused for 60s after repeated failures (${results[0]?.error?.message || "unknown"}). ` +
            `Check the AI provider settings; untranslated text stays in English meanwhile.`,
          );
          if (progressEl) {
            progressEl.remove();
            progressEl = null;
          }
        }
      } else {
        failureCount = 0;
      }

      updateProgress();
      persistCache();
      syncEntriesToServer();
      announceUpdate();
      // Apply what we just learned (and pick up anything rendered meanwhile).
      scan();
    }
  } finally {
    inFlight = false;
    updateProgress();
  }
};

// ---- pre-translation catalog ----

// Everything the game COULD show, gathered up front so switching languages
// translates once instead of drip-translating panels as they open.
const collectCatalogStrings = async () => {
  const add = (value) => {
    if (typeof value !== "string") return;
    const trimmed = value.trim();
    if (trimmed && isTranslatable(trimmed) && !cache.has(trimmed)) {
      pending.add(trimmed);
    }
  };
  const addCatalogEntry = (entry) => {
    for (const key of ["name", "subtitle", "description", "eyebrow", "heroTitle", "heroSubtitle"]) {
      add(entry?.[key]);
    }
  };

  // Scenario + game cards.
  for (const url of ["/api/scenarios", "/api/games"]) {
    try {
      const data = await (await fetch(url)).json();
      const list = Array.isArray(data) ? data : data.scenarios ?? data.games ?? [];
      list.forEach(addCatalogEntry);
    } catch {
      // Endpoint unreachable — those strings translate live instead.
    }
  }

  // Country names, era polities + aliases, events.
  try {
    const { JSON_URLS, loadCountryNames, readJson } = await import("./assets.js");
    (await loadCountryNames().catch(() => [])).forEach((country) => add(country?.name));
    const world = await readJson(JSON_URLS.world, { defaultValue: {} });
    for (const polity of Object.values(world?.polityOverrides ?? {})) {
      add(polity?.name);
      (polity?.aliases ?? []).forEach(add);
    }
    const events = await readJson(JSON_URLS.events, { defaultValue: [] });
    for (const event of Array.isArray(events) ? events : []) {
      add(event?.title);
      add(event?.description);
    }
  } catch {
    // Runtime assets unavailable (editor-only page etc.) — skip.
  }

  // Difficulty labels.
  try {
    const { DIFFICULTY_LEVELS } = await import("./difficulty.js");
    for (const level of DIFFICULTY_LEVELS) {
      add(level.label);
      add(level.blurb);
    }
  } catch { /* optional */ }

  // Community-hub posts (titles + descriptions), so the tab opens translated.
  try {
    const { fetchHubPosts } = await import("../Game/GameUI/communityHub.jsx");
    for (const post of await fetchHubPosts().catch(() => [])) {
      add(post?.title);
      add(post?.description);
    }
  } catch { /* hub unreachable — translate live when opened */ }

  // Region names — the big set (tags, owned-region pills, event impacts).
  // Queued last so the visible UI translates first.
  try {
    const { loadRegionCatalog } = await import("./assets.js");
    (await loadRegionCatalog().catch(() => [])).forEach((region) => add(region?.name));
  } catch { /* optional */ }
};

// ---- public lookups (map labels, proactive callers) ----

let translatorActive = false;

// Synchronous best-effort translation for text drawn OUTSIDE the DOM (map
// country labels). Unknown strings are queued and an "i18n:updated" event
// fires once they resolve, so callers can rebuild.
export const translateLabel = (text) => {
  if (!translatorActive || typeof text !== "string") {
    return text;
  }
  const trimmed = text.trim();
  const translated = cache.get(trimmed);
  if (translated) {
    return translated;
  }
  if (isTranslatable(trimmed)) {
    pending.add(trimmed);
    scheduleScan();
  }
  return text;
};

// Proactively queue strings that exist as data but may not be rendered yet
// (e.g. freshly fetched Community-hub posts). Only uncached ones cost a call.
export const enqueueStrings = (strings) => {
  if (!translatorActive) return;
  let added = false;
  for (const value of strings ?? []) {
    if (typeof value !== "string") continue;
    const trimmed = value.trim();
    if (trimmed && isTranslatable(trimmed) && !cache.has(trimmed)) {
      pending.add(trimmed);
      added = true;
    }
  }
  if (added) {
    void processQueue();
  }
};

// Human-readable fields inside written game content. When the player edits a
// description (or the AI writes new events/polities), these are pulled out
// and translated right away — and land in the server pack — instead of
// waiting to be rendered somewhere first.
const CONTENT_TEXT_KEYS = new Set([
  "name", "title", "subtitle", "description", "eyebrow", "heroTitle",
  "heroSubtitle", "summary", "blurb", "note", "label",
]);

export const enqueueContentStrings = (payload) => {
  if (!translatorActive || !payload) return;
  const found = [];
  const walk = (value, depth) => {
    if (depth > 6 || value == null) return;
    if (Array.isArray(value)) {
      if (value.length <= 500) value.forEach((entry) => walk(entry, depth + 1));
      return;
    }
    if (typeof value !== "object") return;
    for (const [key, entry] of Object.entries(value)) {
      // Geometry payloads can be enormous and contain no UI text.
      if (key === "features" || key === "geometry" || key === "coordinates") continue;
      if (typeof entry === "string") {
        if (CONTENT_TEXT_KEYS.has(key)) found.push(entry);
      } else if (key === "aliases" && Array.isArray(entry)) {
        entry.forEach((alias) => typeof alias === "string" && found.push(alias));
      } else {
        walk(entry, depth + 1);
      }
    }
  };
  walk(payload, 0);
  enqueueStrings(found);
};

// ---- lifecycle ----

// Merge the server's language pack (shipped top-10 packs + every translation
// any device has generated) into the local cache.
const loadServerPack = async () => {
  try {
    const response = await fetch(`/api/lang/${language}`);
    if (!response.ok) return;
    const pack = await response.json();
    // Same guard as the local cache, for the same reason — and it matters MORE
    // here: the pack is shared, so one device that cached a hybrid before the
    // write guard existed hands it to every other device and every future
    // session. Filtering on merge means a poisoned pack entry simply never
    // enters play, without needing the pack itself to be rewritten.
    for (const [source, translated] of dropCorrupted(Object.entries(pack ?? {}), "server language pack")) {
      if (!cache.has(source)) cache.set(source, translated);
    }
    persistCache();
  } catch {
    // Old server / offline: the localStorage cache still applies.
  }
};

// Translation must NEVER interfere with game startup: wait until the loading
// screen is gone (or a generous timeout) before touching the DOM at all.
const whenStartupScreenGone = () => new Promise((resolve) => {
  const startedAt = Date.now();
  const check = () => {
    if (!document.querySelector("[data-startup-screen]") || Date.now() - startedAt > 180000) {
      resolve();
    } else {
      setTimeout(check, 400);
    }
  };
  check();
});

// Test seam: the guards read module-level `language`, and there is no other way
// to exercise them per-language from outside.
export const __setLanguageForTests = (code) => { language = code; };

export const startTranslator = () => {
  if (typeof document === "undefined") {
    return;
  }

  // The server's stored choice wins over this device's copy, so a language
  // picked on desktop applies in the Android app (and vice versa). Runs even
  // when this device thinks it's English — a fresh install has no local copy.
  void syncLanguageFromServer().then((changed) => {
    if (changed) {
      window.location.reload();
    }
  });

  language = getStoredLanguage();
  if (language === DEFAULT_LANGUAGE) {
    return;
  }

  document.documentElement.lang = language;
  if (isRtlLanguage(language)) {
    // Text direction only — flipping the whole HUD layout would fight the
    // fixed-position map UI, so panels stay put but text reads correctly.
    document.body.style.direction = "rtl";
  }

  loadCache();

  void (async () => {
    // Server pack first (cheap, instant), then wait out the loading screen.
    await loadServerPack();
    await whenStartupScreenGone();
    if (stopped) return;

    translatorActive = true;
    observer = new MutationObserver(handleMutations);
    observer.observe(document.body, {
      childList: true,
      characterData: true,
      subtree: true,
    });
    scan();
    announceUpdate();

    // One-time pre-translation of everything the game can show. On later
    // boots the pack + cache already cover it and this drains instantly.
    await collectCatalogStrings();
    if (pending.size > 10) {
      showProgress();
      updateProgress();
    }
    void processQueue();
  })();
};

export const stopTranslator = () => {
  stopped = true;
  observer?.disconnect();
  clearTimeout(scanTimer);
  progressEl?.remove();
  progressEl = null;
};

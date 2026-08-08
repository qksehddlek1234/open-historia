/*! Open Historia — portions (map interaction/display settings) © 2026 Nicholas Krol, MIT (see src/Editor/LICENSE). */
// Map interaction/display settings — localStorage-backed, same getter/setter
// pattern as src/Game/AI/providerConfig.js. Consumers subscribe via
// useMapSetting() below instead of receiving these as props threaded through
// GameUI/main.jsx, mirroring how useCountryDisplayName (polityNames.js) sits
// beside the data it subscribes to.
import { useEffect, useState } from "react";

export const MAP_SETTING_KEYS = {
    hideCountryLabels: "map_hide_country_labels",
    disableIdleRotation: "map_disable_idle_rotation",
    disableEventCamera: "map_disable_event_camera",
    // Which ESRI basemap the world draws on. Ten of them ship and are fully
    // wired — the tile template, the max zoom, the protocol handler, the
    // preloader — and until now there was no way to pick one: Map/World.jsx
    // said so in a comment ("the in-game basemap picker was removed") and every
    // campaign ran on the "ocean" default. Not a boolean like the rest of this
    // file, so it gets its own getter below rather than riding getMapSetting.
    basemapStyle: "map_basemap_style",
    // Which Omniatlas regional series the era-atlas cross-reference opens.
    atlasRegion: "map_atlas_region",
    // Not a map setting, but the same localStorage-toggle mechanism: when ON,
    // timeline-jump generation gets a 5-minute deadline and falls back to
    // canned events past it. OFF (the default) waits as long as the model
    // needs — the fallback is only reachable through a real error, never a
    // slow model (Cancel still works either way).
    limitAiGeneration: "ai_limit_generation",
};

// THE THREE DISPLAY DIALS THE ORIGINAL HAS AND THIS DID NOT.
//
// Zoom sensitivity, border thickness, and how big features draw. All three are
// multipliers over the values the map already computes, so the tuned curves stay
// the curves and the player scales them — a fixed override would throw away the
// zoom-dependent work in Nations.jsx and MarkersLayer.jsx.
//
// 1.0 is "as shipped" in every case, which is what a player who never opens this
// keeps getting.
export const DISPLAY_KEYS = {
    zoomSensitivity: "map_zoom_sensitivity",
    borderWidth: "map_border_width",
    featureSize: "map_feature_size",
    // Whether a feature's own size attribute counts. ON (the default) draws a
    // monumental works bigger than an outpost, as the size field intends; OFF
    // draws every feature the same, which is what a player wants when the map is
    // a working document rather than a picture.
    featureSizeAbsolute: "map_feature_size_absolute",
};

export const DISPLAY_DEFAULTS = { zoomSensitivity: 1, borderWidth: 1, featureSize: 1 };
// Wide enough to be worth having, bounded so no setting can make the map
// unreadable or unusable: a 0 multiplier hides borders entirely and a 5x zoom
// rate makes one wheel click cross a continent.
export const DISPLAY_BOUNDS = { zoomSensitivity: [0.25, 3], borderWidth: [0.25, 4], featureSize: [0.4, 3] };

export function getDisplayScale(name) {
    const fallback = DISPLAY_DEFAULTS[name];
    if (fallback === undefined) return 1;
    const [min, max] = DISPLAY_BOUNDS[name];
    let raw = NaN;
    try {
        raw = Number(localStorage.getItem(DISPLAY_KEYS[name]));
    } catch {
        return fallback;
    }
    if (!Number.isFinite(raw) || raw <= 0) return fallback;
    return Math.max(min, Math.min(max, raw));
}

export function setDisplayScale(name, value) {
    const key = DISPLAY_KEYS[name];
    if (!key) return;
    const next = Number(value);
    if (!Number.isFinite(next) || next <= 0 || next === DISPLAY_DEFAULTS[name]) localStorage.removeItem(key);
    else localStorage.setItem(key, String(next));
    window.dispatchEvent(new Event("mapSettings:updated"));
}

export function useDisplayScale(name) {
    const [value, setValue] = useState(() => getDisplayScale(name));

    useEffect(() => {
        setValue(getDisplayScale(name));
        const onUpdated = () => setValue(getDisplayScale(name));
        window.addEventListener("mapSettings:updated", onUpdated);
        return () => window.removeEventListener("mapSettings:updated", onUpdated);
    }, [name]);

    return value;
}

// HOW OFTEN THE CAMPAIGN'S HISTORY IS COMPRESSED.
//
// The original exposes these as an advanced settings page ("Consolidation
// Settings"); here they were four constants in gameplay.js that nobody could
// reach. They matter most on exactly the setup this fork is built for — a local
// model with a fixed context window, where when consolidation fires decides
// whether a turn's prompt fits at all.
//
// `startRound` is the round consolidation may first run on. `intervalRounds` is
// how often after that. `retainEvents` is how many recent events are always kept
// out of it, verbatim — compressing what just happened is how a campaign loses
// the thread. `sizeThreshold` forces a consolidation early when the backlog has
// grown past it regardless of the round.
export const CONSOLIDATION_KEYS = {
    startRound: "ai_consolidation_start_round",
    intervalRounds: "ai_consolidation_interval",
    retainEvents: "ai_consolidation_retain",
    sizeThreshold: "ai_consolidation_threshold",
};

export const CONSOLIDATION_DEFAULTS = {
    startRound: 15,
    intervalRounds: 5,
    retainEvents: 24,
    sizeThreshold: 48,
};

// Bounds, not preferences: below these the setting stops meaning anything.
// A retainEvents of 0 would hand the model a campaign with no recent memory at
// all, and an interval of 0 would consolidate every single turn.
export const CONSOLIDATION_BOUNDS = {
    startRound: [1, 200],
    intervalRounds: [1, 50],
    retainEvents: [4, 200],
    sizeThreshold: [8, 400],
};

export function getConsolidationSetting(name) {
    const fallback = CONSOLIDATION_DEFAULTS[name];
    if (fallback === undefined) return undefined;
    const [min, max] = CONSOLIDATION_BOUNDS[name];
    let raw = NaN;
    try {
        raw = Number(localStorage.getItem(CONSOLIDATION_KEYS[name]));
    } catch {
        return fallback;
    }
    if (!Number.isFinite(raw) || raw <= 0) return fallback;
    return Math.max(min, Math.min(max, Math.round(raw)));
}

export function getConsolidationSettings() {
    return Object.fromEntries(
        Object.keys(CONSOLIDATION_DEFAULTS).map((name) => [name, getConsolidationSetting(name)]),
    );
}

export function setConsolidationSetting(name, value) {
    const key = CONSOLIDATION_KEYS[name];
    if (!key) return;
    const next = Number(value);
    if (!Number.isFinite(next) || next <= 0) localStorage.removeItem(key);
    else localStorage.setItem(key, String(Math.round(next)));
    window.dispatchEvent(new Event("mapSettings:updated"));
}

// The model's context window, in tokens — the one number the prompt budget in
// Game/AI/promptContext.js has to match, and the only way the app can know it.
// Ollama's OpenAI-compatible endpoint has no field for it (their docs: "The
// OpenAI API does not have a way of setting the context size for a model"), so
// the app cannot ask and cannot set it; it is whatever the server was started
// with. Getting this wrong is not cosmetic — budget for more than the server has
// and llama.cpp starts discarding the front of the prompt mid-answer, taking the
// tool schema with it, and the turn comes back unparseable.
export const AI_CONTEXT_TOKENS_KEY = "ai_context_tokens";
export const DEFAULT_CONTEXT_TOKENS = 32768;

export function getContextTokens() {
    const raw = Number(localStorage.getItem(AI_CONTEXT_TOKENS_KEY));
    if (!Number.isFinite(raw) || raw < 4096) return DEFAULT_CONTEXT_TOKENS;
    return Math.min(1_000_000, Math.round(raw));
}

export function setContextTokens(value) {
    const next = Number(value);
    if (!Number.isFinite(next) || next < 4096) localStorage.removeItem(AI_CONTEXT_TOKENS_KEY);
    else localStorage.setItem(AI_CONTEXT_TOKENS_KEY, String(Math.round(next)));
    window.dispatchEvent(new Event("mapSettings:updated"));
}

export function getMapSetting(key) {
    return localStorage.getItem(key) === "1";
}

// A setting whose value is a NAME rather than on/off. "" means "whatever the
// scenario asked for", which is what every campaign has been getting by default.
export function getMapChoice(key) {
    try {
        return String(localStorage.getItem(key) ?? "").trim();
    } catch {
        return "";
    }
}

export function setMapChoice(key, value) {
    const next = String(value ?? "").trim();
    if (next) localStorage.setItem(key, next);
    else localStorage.removeItem(key);
    window.dispatchEvent(new Event("mapSettings:updated"));
}

export function useMapChoice(key) {
    const [value, setValue] = useState(() => getMapChoice(key));

    useEffect(() => {
        setValue(getMapChoice(key));
        const onUpdated = () => setValue(getMapChoice(key));
        window.addEventListener("mapSettings:updated", onUpdated);
        return () => window.removeEventListener("mapSettings:updated", onUpdated);
    }, [key]);

    return value;
}

export function setMapSetting(key, value) {
    localStorage.setItem(key, value ? "1" : "0");
    window.dispatchEvent(new Event("mapSettings:updated"));
}

export function useMapSetting(key) {
    const [value, setValue] = useState(() => getMapSetting(key));

    useEffect(() => {
        setValue(getMapSetting(key));
        const onUpdated = () => setValue(getMapSetting(key));
        window.addEventListener("mapSettings:updated", onUpdated);
        return () => window.removeEventListener("mapSettings:updated", onUpdated);
    }, [key]);

    return value;
}

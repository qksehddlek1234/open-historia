/*! Open Historia — portions (map interaction/display settings) © 2026 Nicholas Krol, MIT (see src/Editor/LICENSE). */
// Map interaction/display settings — localStorage-backed, same getter/setter
// pattern as src/Game/AI/providerConfig.js. Consumers subscribe via
// useMapSetting() below instead of receiving these as props threaded through
// GameUI/main.jsx, mirroring how useCountryDisplayName (polityNames.js) sits
// beside the data it subscribes to.
import { useEffect, useMemo, useState } from "react";

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
    // ── The original's "Map Rendering Options" page, ported ──────────────────
    // Two of its seven dials are booleans; the rest are MAP_RENDER_* below.
    //
    // hideParallelWorlds: draw ONE copy of the world. MapLibre's
    // renderWorldCopies repeats the map east and west forever, which is right
    // for a globe you spin and wrong for a board you are reading — pan past the
    // dateline and the same war is happening in two places on screen.
    hideParallelWorlds: "map_hide_parallel_worlds",
    // limitWorldBounds: pen the camera inside MAP_RENDER worldBounds* instead of
    // the whole planet. A scenario about one theatre does not need the Pacific.
    limitWorldBounds: "map_limit_world_bounds",
    // Which font the FEATURE labels draw in (cities, battalions, markers). The
    // country labels already take theirs from the scenario (world.labelFont);
    // this is the other half, and it is the player's rather than the author's.
    featureLabelFont: "map_feature_label_font",
};

// The original offers exactly these nine and defaults to Serif. They are CSS
// families, not glyph-server fonts, which is why this works at all: the style
// has no glyphs endpoint, so MapLibre v5 rasterises every glyph locally with
// the stack as a CSS font-family (see the note in Game/Map/Nations.jsx).
export const FEATURE_LABEL_FONTS = [
    { label: "Default (Open Sans)", value: "" },
    { label: "Serif", value: "serif" },
    { label: "Sans-serif", value: "sans-serif" },
    { label: "Georgia", value: "Georgia" },
    { label: "Palatino", value: "Palatino" },
    { label: "Times New Roman", value: "Times New Roman" },
    { label: "Arial", value: "Arial" },
    { label: "Trebuchet MS", value: "Trebuchet MS" },
    { label: "Poppins", value: "Poppins" },
    { label: "Courier New", value: "Courier New" },
];

// What every feature layer shipped with, and what "" still means.
export const DEFAULT_FEATURE_LABEL_STACK = ["Open Sans Semibold", "Arial Unicode MS Bold"];

// The chosen family first, then the shipped stack as fallback, so a player who
// picks a font their machine does not have gets the old labels rather than
// blank ones.
export function getFeatureLabelStack() {
    const chosen = getMapChoice(MAP_SETTING_KEYS.featureLabelFont);
    return chosen ? [chosen, ...DEFAULT_FEATURE_LABEL_STACK] : DEFAULT_FEATURE_LABEL_STACK;
}

// Units draw their glyphs in Bold rather than Semibold on purpose, so the
// fallback differs by layer. Passing the layer's own shipped stack keeps
// "no font chosen" pixel-identical to what it always was.
export const DEFAULT_UNIT_LABEL_STACK = ["Open Sans Bold", "Arial Unicode MS Bold"];

export function useFeatureLabelStack(base = DEFAULT_FEATURE_LABEL_STACK) {
    const chosen = useMapChoice(MAP_SETTING_KEYS.featureLabelFont);
    const baseKey = base.join("|");
    return useMemo(
        () => (chosen ? [chosen, ...baseKey.split("|")] : baseKey.split("|")),
        [chosen, baseKey],
    );
}

// ── The numeric half of the rendering page ───────────────────────────────────
//
// borderFadeStart/End are the zoom range over which region borders come up from
// invisible to full. The original states it exactly that way ("hidden at or
// below the start zoom, full opacity at the end zoom") and ships 2.4 → 7.
// OURS ARE DIFFERENT NUMBERS ON PURPOSE: our province hairlines are tuned to
// stay out of the way until you are inside a country (7.5 → 14, with measured
// stops at 9 and 12 — see Game/Map/Nations.jsx). What the setting moves is the
// RANGE; the curve's shape between the ends is kept and remapped onto it, the
// same way the display multipliers scale tuned curves instead of replacing them.
//
// worldBounds* are the rectangle the camera is penned into when
// limitWorldBounds is on. Defaults are the whole world MapLibre already allows,
// so turning the flag on without touching them changes nothing visible.
export const MAP_RENDER_DEFAULTS = {
    // How far past its own edge a country's label sits when the shape is too
    // small to hold it — the original's "label line extension". Ours is in
    // DEGREES (theirs is 0.015 in its own units): 0.5° clears a Luxembourg
    // without landing in the next country's name. See runtime/countryLabels.js
    // for which countries get a line at all and why.
    labelLineExtension: 0.5,
    borderFadeStart: 7.5,
    borderFadeEnd: 14,
    worldBoundsWest: -180,
    worldBoundsEast: 180,
    worldBoundsSouth: -80,
    worldBoundsNorth: 85,
};

export const MAP_RENDER_KEYS = {
    labelLineExtension: "map_label_line_extension",
    borderFadeStart: "map_border_fade_start",
    borderFadeEnd: "map_border_fade_end",
    worldBoundsWest: "map_world_bounds_west",
    worldBoundsEast: "map_world_bounds_east",
    worldBoundsSouth: "map_world_bounds_south",
    worldBoundsNorth: "map_world_bounds_north",
};

// Bounds, not preferences. The zoom ends live inside the map's own 2.25-16
// range; the rectangle lives inside what MapLibre will accept as latitudes.
export const MAP_RENDER_BOUNDS = {
    // 0 pins the label to its own edge (still legible, still on a stub of a
    // line); 4° is a label most of a country away, which is a choice a player
    // may want on a crowded board and never an accident.
    labelLineExtension: [0, 4],
    borderFadeStart: [2.25, 15],
    borderFadeEnd: [2.25, 16],
    worldBoundsWest: [-180, 180],
    worldBoundsEast: [-180, 180],
    worldBoundsSouth: [-85, 85],
    worldBoundsNorth: [-85, 85],
};

export function getMapRenderValue(name) {
    const fallback = MAP_RENDER_DEFAULTS[name];
    if (fallback === undefined) return undefined;
    const [min, max] = MAP_RENDER_BOUNDS[name];
    // A KEY THAT WAS NEVER WRITTEN IS NOT THE NUMBER ZERO.
    //
    // localStorage.getItem returns null for an absent key and Number(null) is 0
    // — finite, so the fallback below was unreachable and EVERY default in
    // MAP_RENDER_DEFAULTS was dead for anyone who had not moved that slider.
    // Measured on a running board: labelLineExtension read 0.5 in the table and
    // 0 on the map, which made every leader line zero-length (the tiler drops
    // those, so the lines Cowork had just enabled drew nothing at all), and the
    // province fade range 7.5 → 14 was clamped to its floor of 2.25 → 2.25, so
    // the hairlines this file spends a paragraph tuning came up at world zoom.
    let raw = NaN;
    try {
        const stored = localStorage.getItem(MAP_RENDER_KEYS[name]);
        if (stored === null || stored === "") return fallback;
        raw = Number(stored);
    } catch {
        return fallback;
    }
    if (!Number.isFinite(raw)) return fallback;
    return Math.max(min, Math.min(max, raw));
}

export function setMapRenderValue(name, value) {
    const key = MAP_RENDER_KEYS[name];
    if (!key) return;
    const next = Number(value);
    if (!Number.isFinite(next) || next === MAP_RENDER_DEFAULTS[name]) localStorage.removeItem(key);
    else localStorage.setItem(key, String(next));
    window.dispatchEvent(new Event("mapSettings:updated"));
}

export function useMapRenderValue(name) {
    const [value, setValue] = useState(() => getMapRenderValue(name));

    useEffect(() => {
        setValue(getMapRenderValue(name));
        const onUpdated = () => setValue(getMapRenderValue(name));
        window.addEventListener("mapSettings:updated", onUpdated);
        return () => window.removeEventListener("mapSettings:updated", onUpdated);
    }, [name]);

    return value;
}

// THE CURVE IS KEPT AND REMAPPED, NEVER REPLACED.
//
// The shipped ramp is 7.5 → 9 → 12 → 14 and those inner stops were measured, not
// guessed: 9 is "a whisper", 12 is where a province is actually the subject.
// Holding their POSITION IN THE SPAN (9 sits 23% of the way, 12 sits 69%) keeps
// that shape at any range the player picks. An inverted or degenerate range
// falls back to the defaults rather than producing a ramp that never rises.
export function borderFadeStops(start = getMapRenderValue("borderFadeStart"), end = getMapRenderValue("borderFadeEnd")) {
    const from = Number.isFinite(start) ? start : MAP_RENDER_DEFAULTS.borderFadeStart;
    const to = Number.isFinite(end) ? end : MAP_RENDER_DEFAULTS.borderFadeEnd;
    const safe = to > from
        ? [from, to]
        : [MAP_RENDER_DEFAULTS.borderFadeStart, MAP_RENDER_DEFAULTS.borderFadeEnd];
    const span = safe[1] - safe[0];
    const at = (fraction) => safe[0] + (span * fraction);
    const SHIPPED = [7.5, 9, 12, 14];
    const shippedSpan = SHIPPED[3] - SHIPPED[0];
    return SHIPPED.map((stop) => at((stop - SHIPPED[0]) / shippedSpan));
}

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

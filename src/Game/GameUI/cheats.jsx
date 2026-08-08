/*! Open Historia — cheats panel © 2026 Nicholas Krol, MIT (see src/Editor/LICENSE). */
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
    JSON_URLS,
    loadCountryNames,
    loadRegionCatalog,
    readJson,
    writeJson,
} from "../../runtime/assets.js";
import {
    buildActionDisplayText,
    normalizeActionEntry,
    readEventsState,
    readGameData,
    readWorldState,
    writeEventsState,
    writeGameData,
    writeWorldState,
} from "../../runtime/gameState.js";
import { useDragWindow } from "./useDragWindow.js";
import COUNTRY_NAMES from "../../runtime/generated/countryNames.js";
import { DIFFICULTY_LEVELS, normalizeDifficulty } from "../../runtime/difficulty.js";
import { applyGameMasterCommand } from "../AI/gameplay.js";
import { setRegionClickInterceptor } from "../Selection/Regions.jsx";
import { UNIT_TYPES, unitStatusLabel, unitTypeLabel } from "../../runtime/gameState.js";
import { getAllowedUnitTypes } from "../Map/unitsController.js";

// The branches, drawn the same way structure kinds are. Statuses come from
// gameState's own set — "defeated" is left out on purpose: applyUnitOps removes
// a defeated unit from the map, so offering it here would be a delete wearing
// the wrong label.
const UNIT_TYPE_EMOJI = { infantry: "🪖", armor: "🛡", air: "✈", naval: "⚓", artillery: "💥", garrison: "🏰" };
const UNIT_STATUSES = ["idle", "moving", "engaged", "pending"];
import { FEATURE_KINDS, emojiForFeatureKind, inferFeatureKind, labelForFeatureKind, tidyFeatureKind } from "../../runtime/featureKinds.js";
import { cityToMarker, loadCitySeed, promotedCityNames, searchCitySeed } from "../../runtime/cityFeatures.js";
import { ConsolidationPanel } from "./settings.jsx";

const PANEL_TOP = "4.75rem";
const EMPTY_FEATURES = { type: "FeatureCollection", features: [] };

const TOOLS = [
    { id: "master-ai", title: "Master AI", subtitle: "Full control over the game with AI assistance" },
    { id: "roll-back-turn", title: "Roll Back Turn", subtitle: "Restore the game to the start of an earlier turn" },
    { id: "your-country", title: "Your Country", subtitle: "Change which country you're playing as" },
    // A CHEAT, NOT A SETTING — the original classifies it here for a reason.
    // Difficulty is chosen when a campaign starts and steers every prompt after
    // that; changing it halfway leaves the model's picture of the world at odds
    // with the run so far, which is exactly the kind of mid-campaign rewrite the
    // rest of this panel is for.
    { id: "difficulty", title: "Difficulty", subtitle: "Change it mid-campaign — the AI has been playing to the old one" },
    { id: "annex-country", title: "Annex Country", subtitle: "Click a country to annex it into another" },
    { id: "annex-regions", title: "Annex Regions", subtitle: "Click individual regions to transfer them to a country" },
    { id: "edit-country", title: "Edit Country", subtitle: "Modify existing country properties" },
    { id: "add-country", title: "Add Country", subtitle: "Create a new country on the map" },
    { id: "regions", title: "Regions", subtitle: "Edit region names, tags, and properties" },
    { id: "edit-feature", title: "Edit Map Feature", subtitle: "Edit cities, structures, landmarks, and armies" },
    { id: "add-feature", title: "Add Map Feature", subtitle: "Place a structure, a city, or an army with custom properties" },
    { id: "clear-features", title: "Clear Map Features", subtitle: "Clean up old and irrelevant features" },
    { id: "events", title: "Events", subtitle: "Edit historical events and their descriptions" },
];

const inputStyle = {
    background: "rgba(0,0,0,0.28)",
    border: "1px solid rgba(255,255,255,0.16)",
    borderRadius: 8,
    boxSizing: "border-box",
    color: "#fff",
    fontSize: "0.83rem",
    outline: "none",
    padding: "0.5rem 0.6rem",
    width: "100%",
};

const buttonStyle = {
    alignItems: "center",
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: 8,
    color: "#fff",
    cursor: "pointer",
    display: "flex",
    fontSize: "0.82rem",
    fontWeight: 600,
    gap: "0.4rem",
    justifyContent: "center",
    padding: "0.5rem 0.7rem",
};

const primaryButtonStyle = {
    ...buttonStyle,
    background: "rgba(124,58,237,0.35)",
    border: "1px solid rgba(139,92,246,0.55)",
};

const labelStyle = {
    color: "rgba(255,255,255,0.75)",
    display: "block",
    fontSize: "0.72rem",
    fontWeight: 700,
    letterSpacing: "0.04em",
    margin: "0.6rem 0 0.25rem",
    textTransform: "uppercase",
};

const hexToRgb = (hex) => {
    const match = /^#?([0-9a-f]{6})$/i.exec(String(hex ?? "").trim());
    if (!match) return null;
    const value = Number.parseInt(match[1], 16);
    return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
};

const rgbToHex = (rgb) =>
    Array.isArray(rgb) && rgb.length === 3
        ? `#${rgb.map((part) => Math.max(0, Math.min(255, Math.round(part))).toString(16).padStart(2, "0")).join("")}`
        : "#888888";

// The countries that ACTUALLY exist in the current game — enumerated from the map,
// not a fixed world list. Every defined polity, every current region owner, and the
// owners of the rendered geometry (the scenario's own custom regions when it has
// them, else the stock catalog), each resolved to its display NAME. On a fantasy
// map this yields the invented nations only, never real-Earth countries; a country
// you just created shows up too (it's in polityOverrides).
const loadPolities = async () => {
    const world = await readWorldState({ force: true });
    const overrides = world.regionOwnershipOverrides ?? {};
    const polityOverrides = world.polityOverrides ?? {};

    // identifier -> display name (stock ISO names first, era/custom polity names win).
    const nameByCode = new Map();
    for (const entry of (await loadCountryNames().catch(() => [])) ?? []) {
        if (entry?.code) nameByCode.set(String(entry.code), entry.name || String(entry.code));
    }
    for (const [code, polity] of Object.entries(polityOverrides)) {
        if (code && polity?.name) nameByCode.set(String(code), polity.name);
    }

    const owners = new Set();
    for (const code of Object.keys(polityOverrides)) if (code) owners.add(String(code));
    for (const owner of Object.values(overrides)) if (owner) owners.add(String(owner));
    for (const code of world.ownerCodes ?? []) if (code) owners.add(String(code));

    // Owners of the actually-rendered geometry, with current overrides applied: the
    // scenario's own custom regions when present, otherwise the stock GADM catalog.
    const custom = await readJson(JSON_URLS.regionsGeojson, { defaultValue: null }).catch(() => null);
    // Owners are country NAMES. Both fallback tails below reach for the region's
    // GADM provenance, which is a code — so this set used to be a mix of "Russia"
    // and "RUS" depending only on whether a given region had an override, and the
    // two never compared equal. Resolve the code to its name at ingest so the set
    // is one namespace.
    if (Array.isArray(custom?.features) && custom.features.length) {
        for (const feature of custom.features) {
            const props = feature?.properties ?? {};
            const id = props.id != null ? String(props.id) : "";
            const gid0 = props.gid0 ? String(props.gid0) : "";
            const owner = overrides[id] ?? props.owner ?? COUNTRY_NAMES[gid0] ?? gid0;
            if (owner) owners.add(String(owner));
        }
    } else {
        for (const region of await loadRegionCatalog().catch(() => [])) {
            const code = region.countryCode ? String(region.countryCode) : "";
            const owner = overrides[region.id] ?? COUNTRY_NAMES[code] ?? code;
            if (owner) owners.add(String(owner));
        }
    }

    const polities = Array.from(owners)
        .filter((code) => code && code.toLowerCase() !== "unclaimed")
        .map((code) => ({ code, name: nameByCode.get(code) || code }))
        .sort((a, b) => a.name.localeCompare(b.name));
    return { polities, world };
};

const PolitySelect = ({ polities, value, onChange, placeholder = "Pick a country…" }) => (
    <select value={value} onChange={(event) => onChange(event.target.value)} style={{ ...inputStyle, cursor: "pointer" }}>
    <option value="">{placeholder}</option>
    {polities.map((polity) => (
        <option key={polity.code} value={polity.code} style={{ color: "black" }}>
        {polity.name}
        </option>
    ))}
    </select>
);

// A MAP FEATURE IS NOT A CITY.
//
// Both of these panels used to be city forms. "Add Map Feature" could only add a
// city — name, tier, population — so there was no way to place a structure at
// all, and "Edit Map Feature" offered a structure nothing but a name, a
// free-text kind and a size. That free-text box is how the live map came to
// carry "mil11a" and "energy_plant" next to "power plant".
//
// The kind grid is the catalogue (runtime/featureKinds.js), so what the player
// can choose is exactly what the map can draw. The free-text box stays underneath
// it, because a campaign is allowed a kind nobody predicted — it just is not the
// only way in any more.
// A CITY IS A FEATURE NOW (runtime/cityFeatures.js).
//
// On a stock-cities map this list used to say, in so many words, that cities
// cannot be edited: the 70,082 of them live in a PMTiles archive and the only
// thing the game could do to one was change its printed name. So the feature
// editor read the per-game cities.geojson, which on such a map is empty, and
// showed nothing at all.
//
// The archive is immutable, but the map is a stack. Search it, pick one, and it
// is PROMOTED into world.markers as a kind:"city" feature — from then on it is
// editable, movable, re-ownable and deletable exactly like every other feature,
// and the stock layer stops drawing its copy. Only the ones somebody touches are
// ever copied; a save does not gain seventy thousand markers.
const StockCityPromoter = ({ busy, markers, onPromote }) => {
    const [query, setQuery] = useState("");
    const [seed, setSeed] = useState(null);
    const [loading, setLoading] = useState(false);

    // The seed is ~70k entries, so it is fetched the first time somebody types
    // here and never on the map's path.
    useEffect(() => {
        if (query.trim().length < 2 || seed || loading) return;
        setLoading(true);
        loadCitySeed().then((list) => { setSeed(list); setLoading(false); }).catch(() => { setSeed([]); setLoading(false); });
    }, [query, seed, loading]);

    const already = useMemo(() => promotedCityNames(markers), [markers]);
    const results = useMemo(() => searchCitySeed(seed ?? [], query, 25), [seed, query]);

    return (
        <div style={{ marginBottom: "0.5rem" }}>
        {/* This search WRITES: picking a result promotes the stock city into
            world.markers. The first player to meet it searched Seoul, clicked
            the result to see what it was, and had promoted their capital
            without meaning to — so the heading names the action, and each row
            carries an explicit "make editable" label instead of reading like a
            plain search hit. */}
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.8)", fontSize: "0.68rem", fontWeight: 800, letterSpacing: "0.06em", margin: "0.9rem 0 0.4rem", paddingTop: "0.6rem", textTransform: "uppercase" }}>
        Promote a stock city
        </div>
        <div style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.74rem", lineHeight: 1.45, marginBottom: "0.4rem" }}>
        This map draws its cities from the built-in world database, which cannot be
        edited directly. Search it here and promote one: the city becomes an
        ordinary editable feature in the dropdown above — same spot on the map,
        plus a name, an owner, a size and a description you can change.
        </div>
        <input
        style={inputStyle}
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Find a city to edit — 서울, Busan, Hanoi…"
        />
        {loading && <div style={{ color: "rgba(255,255,255,0.45)", fontSize: "0.72rem" }}>Loading the city list…</div>}
        {query.trim().length >= 2 && !loading && results.length === 0 && (
            <div style={{ color: "rgba(255,255,255,0.45)", fontSize: "0.72rem" }}>No city by that name.</div>
        )}
        {results.map((city) => {
            const taken = already.has(String(city.name).trim().toLowerCase());
            return (
                <button
                key={`${city.name}-${city.coord?.[0]}-${city.coord?.[1]}`}
                type="button"
                disabled={busy || taken}
                onClick={() => runPromote(city, onPromote)}
                style={{
                    alignItems: "center",
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: 8,
                    color: "white",
                    cursor: taken ? "default" : "pointer",
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "0.25rem",
                    opacity: taken ? 0.45 : 1,
                    padding: "0.4rem 0.6rem",
                    textAlign: "left",
                    width: "100%",
                }}
                >
                <span style={{ fontSize: "0.8rem", fontWeight: 600, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                🏙 <span data-no-translate>{city.name}</span>
                {Number(city.population) ? <span data-no-translate style={{ color: "rgba(255,255,255,0.45)", fontWeight: 400 }}> · {Number(city.population).toLocaleString()}명</span> : null}
                </span>
                <span style={{ background: taken ? "transparent" : "rgba(59,130,246,0.25)", border: taken ? "none" : "1px solid rgba(96,165,250,0.6)", borderRadius: 999, color: taken ? "rgba(255,255,255,0.45)" : "#bfdbfe", flexShrink: 0, fontSize: "0.66rem", fontWeight: 700, padding: "0.15rem 0.55rem" }}>
                {taken ? "already a feature" : "make editable"}
                </span>
                </button>
            );
        })}
        </div>
    );
};

// Owner comes from the ground it stands on — the same answer the placement pass
// gives an AI-founded structure, so a promoted city is owned consistently with
// everything else on the map rather than by whoever happened to click it.
const runPromote = async (city, onPromote) => {
    let ownerCode = "";
    try {
        const [{ loadTerritoryIndex, locateRegion }, { readWorldState }] = await Promise.all([
            import("../../runtime/territory.js"),
            import("../../runtime/gameState.js"),
        ]);
        const [index, world] = await Promise.all([loadTerritoryIndex(), readWorldState({ force: false })]);
        ownerCode = locateRegion(index, city.coord[0], city.coord[1], world?.regionOwnershipOverrides ?? {})?.owner ?? "";
    } catch {
        // No geometry available — the city still becomes a feature, just unowned.
    }
    const marker = cityToMarker(city, { ownerCode });
    if (marker) onPromote(marker, `${marker.name} is a feature now${ownerCode ? ` (${ownerCode})` : ""}.`);
};

const KindPicker = ({ value, onChange }) => {
    const current = tidyFeatureKind(value);
    const known = FEATURE_KINDS.some((kind) => kind.id === current);
    return (
        <>
        <div style={{ display: "grid", gap: "0.25rem", gridTemplateColumns: "repeat(auto-fill, minmax(5.1rem, 1fr))" }}>
        {FEATURE_KINDS.map((kind) => {
            const active = kind.id === current;
            return (
                <button
                key={kind.id}
                type="button"
                title={kind.id}
                onClick={() => onChange(kind.id)}
                style={{
                    alignItems: "center",
                    background: active ? "rgba(59,130,246,0.28)" : "rgba(255,255,255,0.05)",
                    border: active ? "1px solid rgba(96,165,250,0.75)" : "1px solid rgba(255,255,255,0.12)",
                    borderRadius: 8,
                    color: "white",
                    cursor: "pointer",
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.1rem",
                    padding: "0.35rem 0.2rem",
                }}
                >
                <span style={{ fontSize: "1rem", lineHeight: 1 }}>{kind.emoji}</span>
                <span style={{ fontSize: "0.62rem", whiteSpace: "nowrap" }}>{kind.label}</span>
                </button>
            );
        })}
        </div>
        <input
        style={{ ...inputStyle, marginTop: "0.35rem" }}
        value={known ? "" : (value ?? "")}
        onChange={(event) => onChange(event.target.value)}
        placeholder={known ? `Chosen: ${labelForFeatureKind(current)} — type here only for a kind the list does not have` : "Type a kind the list does not have"}
        />
        </>
    );
};

// Latitude and longitude, typed or picked. The pick button reuses the panel's
// existing click-capture mode — the same one the annex tools ride on — so the
// map behaves identically to every other "click the map" flow here.
const CoordinateFields = ({ lng, lat, onChange, onPick, picking }) => (
    <>
    <div style={{ display: "flex", gap: "0.35rem" }}>
    <input
    style={{ ...inputStyle, flex: 1 }}
    value={lng ?? ""}
    onChange={(event) => onChange({ lat, lng: event.target.value })}
    placeholder="Longitude"
    inputMode="decimal"
    />
    <input
    style={{ ...inputStyle, flex: 1 }}
    value={lat ?? ""}
    onChange={(event) => onChange({ lat: event.target.value, lng })}
    placeholder="Latitude"
    inputMode="decimal"
    />
    </div>
    <button
    type="button"
    onClick={onPick}
    style={{ ...buttonStyle, marginTop: "0.3rem", width: "100%" }}
    >
    {picking ? "Click the map…" : "📍 Pick on the map"}
    </button>
    </>
);

const SizeField = ({ value, onChange }) => {
    const size = Math.max(0.5, Math.min(3, Number(value) || 1));
    return (
        <div style={{ alignItems: "center", display: "flex", gap: "0.5rem" }}>
        <input
        type="range"
        min={0.5}
        max={3}
        step={0.5}
        value={size}
        onChange={(event) => onChange(event.target.value)}
        style={{ accentColor: "#3b82f6", flex: 1 }}
        />
        <span style={{ fontSize: "0.74rem", fontVariantNumeric: "tabular-nums", minWidth: "4.6rem", textAlign: "right" }}>
        {size.toFixed(1)} {size >= 2.5 ? "monumental" : (size >= 1.5 ? "large" : (size <= 0.5 ? "minor" : "normal"))}
        </span>
        </div>
    );
};

const CheatsPanel = ({ open, onClose, onOpenForces }) => {
    const [tool, setTool] = useState(null);
    const [busy, setBusy] = useState(false);
    const [status, setStatus] = useState("");
    const [polities, setPolities] = useState([]);
    const [game, setGame] = useState(null);
    // Click-capture mode: while set, the panel hides behind a floating toast
    // and map clicks route here instead of opening the region popup.
    const [clickMode, setClickMode] = useState(null);
    const clickHandlerRef = useRef(null);
    // Drag-to-move, like the original's windows: grab any panel header.
    const drag = useDragWindow();

    const refresh = async () => {
        try {
            const [{ polities: nextPolities }, nextGame] = await Promise.all([
                loadPolities(),
                readGameData({ force: true }),
            ]);
            setPolities(nextPolities);
            setGame(nextGame);
        } catch (error) {
            setStatus(`Failed to load game data: ${error.message}`);
        }
    };

    useEffect(() => {
        if (open) {
            setStatus("");
            void refresh();
        } else {
            setTool(null);
            setClickMode(null);
        }
    }, [open]);

    useEffect(() => {
        if (!clickMode) {
            setRegionClickInterceptor(null);
            return undefined;
        }

        setRegionClickInterceptor((props) => {
            clickHandlerRef.current?.(props);
            return true;
        });
        return () => setRegionClickInterceptor(null);
    }, [clickMode]);

    const beginClickMode = (label, handler) => {
        clickHandlerRef.current = handler;
        setClickMode({ label });
    };

    const endClickMode = () => {
        clickHandlerRef.current = null;
        setClickMode(null);
    };

    const runBusy = async (work, doneMessage) => {
        setBusy(true);
        setStatus("");
        try {
            const message = await work();
            setStatus(message || doneMessage || "Done.");
        } catch (error) {
            setStatus(`Failed: ${error.message}`);
        } finally {
            setBusy(false);
        }
    };

    if (!open) return null;

    const header = (title, subtitle) => (
        <div
        onPointerDown={drag.onPointerDown}
        style={{ borderBottom: "1px solid rgba(255,255,255,0.08)", cursor: "grab", marginBottom: "0.7rem", paddingBottom: "0.6rem", touchAction: "none", userSelect: "none" }}
        >
        <div style={{ alignItems: "center", display: "flex", justifyContent: "space-between" }}>
        <div style={{ alignItems: "center", display: "flex", gap: "0.45rem", minWidth: 0 }}>
        {tool && (
            <button type="button" onClick={() => { setTool(null); setStatus(""); }} style={{ ...buttonStyle, padding: "0.25rem 0.5rem" }}>
            ←
            </button>
        )}
        <div style={{ fontSize: "1rem", fontWeight: 800 }}>{title}</div>
        </div>
        <button type="button" onClick={onClose} style={{ ...buttonStyle, padding: "0.25rem 0.55rem" }}>✕</button>
        </div>
        {subtitle && <div style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.74rem", marginTop: "0.2rem" }}>{subtitle}</div>}
        </div>
    );

    return (
        <>
        {clickMode && (
            <div style={{ alignItems: "center", display: "flex", gap: "0.6rem", background: "rgba(17,24,39,0.97)", border: "1px solid rgba(139,92,246,0.5)", borderRadius: 12, boxShadow: "0 6px 24px rgba(0,0,0,0.5)", color: "#fff", fontFamily: "sans-serif", fontSize: "0.85rem", left: "50%", padding: "0.6rem 0.9rem", position: "fixed", top: PANEL_TOP, transform: "translateX(-50%)", zIndex: 10070 }}>
            <span>{clickMode.label}</span>
            <button type="button" onClick={endClickMode} style={{ ...primaryButtonStyle, padding: "0.3rem 0.6rem" }}>Done</button>
            </div>
        )}

        <div
        style={{
            background: "rgba(17, 24, 39, 0.96)",
            backdropFilter: "blur(8px)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 16,
            boxShadow: "4px 0 24px rgba(0,0,0,0.4)",
            color: "white",
            display: clickMode ? "none" : "flex",
            flexDirection: "column",
            fontFamily: "sans-serif",
            maxHeight: `calc(100vh - ${PANEL_TOP} - 1rem)`,
            overflow: "hidden",
            padding: "0.9rem",
            position: "fixed",
            // Docked LEFT like the original game's cheats window, and movable
            // by its header like the original's windows.
            left: "0.5rem",
            top: PANEL_TOP,
            transform: drag.transform,
            width: "min(24rem, calc(100vw - 1rem))",
            zIndex: 10045,
        }}
        >
        {!tool ? (
            <>
            {header("Cheats")}
            {/* flex:1 + minHeight:0 make this list actually SCROLL inside the
                capped-height panel — without them a flex child refuses to
                shrink and the menu just clips at the bottom. */}
            <div style={{ display: "flex", flex: 1, flexDirection: "column", gap: "0.35rem", minHeight: 0, overflowY: "auto" }}>
            {/* PLACING A FORMATION IS ADDING A MAP FEATURE. Deployment used to
                be its own entry here, opening a separate Forces panel with its
                own branch/strength/name form and its own map mode — a second,
                differently-shaped way to put a thing on the map, sitting a
                centimetre from the one that adds structures. It is a feature
                type in Add Map Feature now. The Forces panel itself stays, for
                what only it does: moving and attacking with units already on the
                map. */}
            {typeof onOpenForces === "function" && (
                <button
                type="button"
                onClick={onOpenForces}
                style={{ ...buttonStyle, alignItems: "flex-start", flexDirection: "column", gap: "0.1rem", textAlign: "left" }}
                >
                <span style={{ fontWeight: 700 }}>⚔️ Forces — move &amp; attack</span>
                <span style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.72rem", fontWeight: 500 }}>Command units already on the map. To place a new one, use Add Map Feature.</span>
                </button>
            )}
            {TOOLS.map((entry) => (
                <button
                key={entry.id}
                type="button"
                onClick={() => { setTool(entry.id); setStatus(""); }}
                style={{ ...buttonStyle, alignItems: "flex-start", flexDirection: "column", gap: "0.1rem", textAlign: "left" }}
                >
                <span style={{ fontWeight: 700 }}>{entry.title}</span>
                <span style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.72rem", fontWeight: 500 }}>{entry.subtitle}</span>
                </button>
            ))}
            </div>
            </>
        ) : (
            <ToolView
            tool={tool}
            header={header}
            busy={busy}
            status={status}
            game={game}
            polities={polities}
            clickMode={clickMode}
            refresh={refresh}
            runBusy={runBusy}
            beginClickMode={beginClickMode}
            endClickMode={endClickMode}
            setStatus={setStatus}
            />
        )}
        {status && !tool && (
            <div style={{ color: "rgba(191,219,254,0.9)", fontSize: "0.76rem", marginTop: "0.6rem" }}>{status}</div>
        )}
        </div>
        </>
    );
};

const ToolView = ({ tool, header, busy, status, game, polities, clickMode, refresh, runBusy, beginClickMode, endClickMode, setStatus }) => {
    const meta = TOOLS.find((entry) => entry.id === tool);
    const [text, setText] = useState("");
    const [target, setTarget] = useState("");
    const [fields, setFields] = useState({});
    const [items, setItems] = useState(null);
    const [search, setSearch] = useState("");
    const [editingId, setEditingId] = useState(null);

    // Tools that browse existing data load it on entry.
    useEffect(() => {
        setItems(null);
        setEditingId(null);
        setSearch("");
        setFields({});
        setTarget("");
        if (tool === "events") {
            // Rounds need the world's simulationHistory (per-round eventIds +
            // the snapshot of the actions submitted that round), not just the
            // flat event list.
            Promise.all([
                readEventsState({ force: true }).catch(() => []),
                readWorldState({ force: true }).catch(() => ({})),
            ])
                .then(([evts, world]) => setItems({
                    events: evts,
                    history: Array.isArray(world?.simulationHistory) ? world.simulationHistory : [],
                    consolidations: Array.isArray(world?.consolidatedHistory) ? world.consolidatedHistory : [],
                }))
                .catch(() => setItems({ events: [], history: [], consolidations: [] }));
        }
        if (tool === "roll-back-turn") {
            readJson(JSON_URLS.snapshots, { defaultValue: [], force: true })
                .then((list) => setItems(Array.isArray(list) ? list : []))
                .catch(() => setItems([]));
        }
        if (tool === "clear-features") {
            readJson(JSON_URLS.citiesGeojson, { defaultValue: EMPTY_FEATURES, force: true })
                .then((geojson) => setItems(geojson?.features ?? []))
                .catch(() => setItems([]));
        }
        if (tool === "edit-feature") {
            // "Feature" editing used to see ONLY the per-game cities file — on a
            // stock-cities map that file is empty, and world.markers (built
            // structures/landmarks) and world.units (armies) were never listed,
            // so the tool reported nothing to edit. Load all three stores, plus
            // the stock-city rename table.
            Promise.all([
                readJson(JSON_URLS.citiesGeojson, { defaultValue: EMPTY_FEATURES, force: true }).catch(() => EMPTY_FEATURES),
                readWorldState({ force: true }).catch(() => ({})),
            ])
                .then(([geojson, world]) => setItems({
                    cities: geojson?.features ?? [],
                    markers: Array.isArray(world?.markers) ? world.markers : [],
                    units: Array.isArray(world?.units) ? world.units : [],
                    renames: world?.cityRenames && typeof world.cityRenames === "object" ? world.cityRenames : {},
                }))
                .catch(() => setItems({ cities: [], markers: [], units: [], renames: {} }));
        }
    }, [tool]);

    const statusLine = status && (
        <div style={{ color: status.startsWith("Failed") ? "#fca5a5" : "rgba(191,219,254,0.9)", fontSize: "0.76rem", marginTop: "0.6rem" }}>
        {status}
        </div>
    );

    const politiesByCode = useMemo(() => new Map(polities.map((polity) => [polity.code, polity])), [polities]);
    const nameOf = (code) => politiesByCode.get(code)?.name || code || "unclaimed land";

    // ----- individual tools -----

    if (tool === "master-ai") {
        return (
            <>
            {header(meta.title, meta.subtitle)}
            <div style={{ flex: 1, minHeight: 0, overflowY: "auto" }}>
            <label style={labelStyle}>Command</label>
            <textarea
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder='Anything — "give Poland all of Germany", "start a golden age in Egypt", "sink the British fleet"…'
            rows={4}
            style={{ ...inputStyle, resize: "vertical" }}
            />
            <button
            type="button"
            disabled={busy || !text.trim()}
            onClick={() => runBusy(async () => {
                const result = await applyGameMasterCommand(text.trim());
                setText("");
                const summary = result?.world?.lastJumpSummary || result?.summary || "";
                return summary ? `Done — ${summary}` : "The Game Master applied your command.";
            })}
            style={{ ...primaryButtonStyle, marginTop: "0.6rem", opacity: busy ? 0.6 : 1, width: "100%" }}
            >
            {busy ? "Rewriting the world…" : "Execute"}
            </button>
            <div style={{ color: "rgba(255,255,255,0.45)", fontSize: "0.72rem", marginTop: "0.5rem" }}>
            The AI interprets the command, applies its impacts to the map and countries, and records it as a game-master event.
            </div>
            {statusLine}
            </div>
            </>
        );
    }

    if (tool === "roll-back-turn") {
        const snapshots = items ?? [];
        return (
            <>
            {header(meta.title, meta.subtitle)}
            <div style={{ display: "flex", flex: 1, flexDirection: "column", minHeight: 0 }}>
            <div style={{ color: "rgba(255,255,255,0.55)", fontSize: "0.76rem", marginBottom: "0.5rem" }}>
            Restore the game to how it was at the start of an earlier turn. This permanently discards every turn played after the one you pick.
            </div>
            {items === null && (
                <div style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.76rem" }}>Loading restore points…</div>
            )}
            {items !== null && snapshots.length === 0 && (
                <div style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.76rem" }}>
                No restore points yet — one is captured automatically at the start of each turn. Play a turn, then come back.
                </div>
            )}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem", overflowY: "auto" }}>
            {snapshots.map((snap, index) => {
                const confirming = editingId === snap.id;
                const dateLabel = snap.fromDate ? String(snap.fromDate) : "";
                return (
                    <div key={snap.id} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, padding: "0.5rem 0.6rem" }}>
                    <div style={{ alignItems: "center", display: "flex", gap: "0.4rem", justifyContent: "space-between" }}>
                    <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: "0.82rem", fontWeight: 700 }}>Round {snap.round}{dateLabel ? ` · ${dateLabel}` : ""}</div>
                    <div style={{ color: "rgba(255,255,255,0.45)", fontSize: "0.68rem" }}>
                    {index === 0 ? "undoes the most recent turn" : `undoes the last ${index + 1} turns`}
                    </div>
                    </div>
                    {confirming ? (
                        <div style={{ display: "flex", flexShrink: 0, gap: "0.3rem" }}>
                        <button
                        type="button"
                        disabled={busy}
                        style={{ ...primaryButtonStyle, padding: "0.25rem 0.55rem" }}
                        onClick={() => runBusy(async () => {
                            const s = snap.state ?? {};
                            await Promise.all([
                                writeJson(JSON_URLS.game, s.game ?? {}, { pretty: true }),
                                writeJson(JSON_URLS.world, s.world ?? {}, { pretty: true }),
                                writeJson(JSON_URLS.events, s.events ?? [], { pretty: true }),
                                writeJson(JSON_URLS.actions, s.actions ?? [], { pretty: true }),
                                writeJson(JSON_URLS.chat, s.chat ?? [], { pretty: true }),
                                writeJson(JSON_URLS.colors, s.colors ?? {}, { pretty: true }),
                            ]);
                            // Drop this restore point and every newer one — those turns no longer happened.
                            const remaining = snapshots.slice(index + 1);
                            await writeJson(JSON_URLS.snapshots, remaining);
                            setItems(remaining);
                            setEditingId(null);
                            await refresh();
                            return `Rolled back to Round ${snap.round}. The map, date and panels catch up within a few seconds.`;
                        })}
                        >
                        Confirm
                        </button>
                        <button type="button" style={{ ...buttonStyle, padding: "0.25rem 0.55rem" }} onClick={() => setEditingId(null)}>Cancel</button>
                        </div>
                    ) : (
                        <button type="button" disabled={busy} style={{ ...buttonStyle, flexShrink: 0, padding: "0.25rem 0.55rem" }} onClick={() => setEditingId(snap.id)}>Roll back</button>
                    )}
                    </div>
                    </div>
                );
            })}
            </div>
            {statusLine}
            </div>
            </>
        );
    }

    if (tool === "your-country") {
        return (
            <>
            {header(meta.title, meta.subtitle)}
            <div>
            <div style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.78rem" }}>
            Currently playing: <strong>{nameOf(game?.country)}</strong>
            </div>
            <label style={labelStyle}>New country</label>
            <PolitySelect polities={polities} value={target} onChange={setTarget} />
            <button
            type="button"
            disabled={busy || !target}
            onClick={() => runBusy(async () => {
                const current = await readGameData({ force: true });
                await writeGameData({ ...current, country: target });
                await refresh();
                return `You now lead ${nameOf(target)}.`;
            })}
            style={{ ...primaryButtonStyle, marginTop: "0.6rem", width: "100%" }}
            >
            Switch country
            </button>
            {statusLine}
            </div>
            </>
        );
    }

    if (tool === "difficulty") {
        const current = normalizeDifficulty(game?.difficulty);
        return (
            <>
            {header(meta.title, meta.subtitle)}
            <div style={{ display: "grid", gap: "0.45rem", gridTemplateColumns: "1fr 1fr", overflowY: "auto" }}>
            {DIFFICULTY_LEVELS.map((level) => (
                <button
                key={level.id}
                type="button"
                disabled={busy}
                onClick={() => runBusy(async () => {
                    const nextGame = await readGameData({ force: true });
                    await writeGameData({ ...nextGame, difficulty: level.id });
                    await refresh();
                    return `Difficulty set to ${level.label} ${level.emoji} — it steers the AI from the next turn on.`;
                })}
                style={{
                    ...buttonStyle,
                    background: current === level.id ? "rgba(124,58,237,0.35)" : buttonStyle.background,
                    border: current === level.id ? "1px solid rgba(139,92,246,0.65)" : buttonStyle.border,
                    flexDirection: "column",
                    gap: "0.15rem",
                    padding: "0.65rem 0.4rem",
                }}
                >
                <span style={{ fontSize: "1.45rem", lineHeight: 1 }}>{level.emoji}</span>
                <span>{level.label}</span>
                </button>
            ))}
            </div>
            {statusLine}
            </>
        );
    }

    if (tool === "annex-country" || tool === "annex-regions") {
        const wholeCountry = tool === "annex-country";
        return (
            <>
            {header(meta.title, meta.subtitle)}
            <div>
            <label style={labelStyle}>Annex into</label>
            <PolitySelect polities={polities} value={target} onChange={setTarget} placeholder="Pick the new owner…" />
            <button
            type="button"
            disabled={!target}
            onClick={() => {
                const owner = target;
                beginClickMode(
                    wholeCountry
                        ? `Click the country to annex into ${nameOf(owner)}`
                        : `Click regions to hand to ${nameOf(owner)} — Done when finished`,
                    async (props) => {
                        try {
                            const world = await readWorldState({ force: true });
                            const overrides = { ...world.regionOwnershipOverrides };
                            if (wholeCountry) {
                                // Resolve the clicked region's CURRENT owner. On a stock
                                // map a region reassigned via regionOwnershipOverrides still
                                // carries its original GID_0 in the tile, so reading the raw
                                // property annexed the wrong country — consult the override
                                // for this region id first.
                                const clickedId =
                                    props.id != null
                                        ? String(props.id)
                                        : props.GID_1 != null
                                            ? String(props.GID_1)
                                            : "";
                                // Both sides of the comparison below must be in ONE
                                // namespace. `source` came from the click (an owner
                                // name, or a GADM code via the tail) and `effective`
                                // from the catalog (always a code), so a miss here
                                // transfers nothing and reports success.
                                const clickedGid0 = String(props.GID_0 || props.gid0 || "");
                                const source =
                                    (clickedId && overrides[clickedId])
                                    || props.owner
                                    || COUNTRY_NAMES[clickedGid0]
                                    || clickedGid0;
                                if (!source || source === owner) return;
                                const catalog = await loadRegionCatalog();
                                let count = 0;
                                for (const region of catalog) {
                                    const code = String(region.countryCode || "");
                                    const effective = overrides[region.id] ?? COUNTRY_NAMES[code] ?? code;
                                    if (effective === source) {
                                        overrides[region.id] = owner;
                                        count += 1;
                                    }
                                }
                                for (const [regionId, code] of Object.entries(world.regionOwnershipOverrides)) {
                                    if (code === source) overrides[regionId] = owner;
                                }
                                await writeWorldState({ ...world, regionOwnershipOverrides: overrides });
                                setStatus(`${nameOf(source)} annexed into ${nameOf(owner)} (${count} regions). The map updates within a few seconds.`);
                            } else {
                                if (!props.GID_1) return;
                                overrides[String(props.GID_1)] = owner;
                                await writeWorldState({ ...world, regionOwnershipOverrides: overrides });
                                setStatus(`${props.NAME_1 || props.GID_1} → ${nameOf(owner)}. Keep clicking, or press Done.`);
                            }
                        } catch (error) {
                            setStatus(`Failed: ${error.message}`);
                        }
                    },
                );
            }}
            style={{ ...primaryButtonStyle, marginTop: "0.6rem", width: "100%" }}
            >
            Start clicking the map
            </button>
            <div style={{ color: "rgba(255,255,255,0.45)", fontSize: "0.72rem", marginTop: "0.5rem" }}>
            The map repaints ownership within ~5 seconds of each change.
            </div>
            {statusLine}
            </div>
            </>
        );
    }

    if (tool === "edit-country" || tool === "add-country") {
        const adding = tool === "add-country";
        const applyCountry = () => runBusy(async () => {
            const name = (fields.name ?? "").trim();
            // One naming scheme, no codes: the country's NAME is its identifier.
            const code = adding ? name : (target || "").trim();
            const colorHex = (fields.color ?? "").trim();
            if (!code) throw new Error(adding ? "Give the country a name." : "Pick a country first.");
            const world = await readWorldState({ force: true });
            const existing = world.polityOverrides?.[code] ?? {};
            const nextOverride = {
                ...existing,
                code,
                name: name || existing.name || code,
                ...(hexToRgb(colorHex) ? { color: colorHex.startsWith("#") ? colorHex : `#${colorHex}` } : null),
            };
            await writeWorldState({
                ...world,
                polityOverrides: { ...world.polityOverrides, [code]: nextOverride },
            });
            const rgb = hexToRgb(colorHex);
            if (rgb) {
                const colors = await readJson(JSON_URLS.colors, { defaultValue: {}, force: true });
                await writeJson(JSON_URLS.colors, { ...colors, [code]: rgb }, { pretty: true });
            }
            await refresh();
            return adding
                ? `${nextOverride.name} created. Use Annex Country or Annex Regions to give it territory.`
                : `${nextOverride.name} updated. The map picks up colors within a few seconds.`;
        });

        return (
            <>
            {header(meta.title, meta.subtitle)}
            <div style={{ flex: 1, minHeight: 0, overflowY: "auto" }}>
            {!adding && (
                <>
                <label style={labelStyle}>Country</label>
                <PolitySelect polities={polities} value={target} onChange={(code) => { setTarget(code); setFields({}); }} />
                </>
            )}
            <label style={labelStyle}>Name</label>
            <input style={inputStyle} value={fields.name ?? ""} onChange={(event) => setFields({ ...fields, name: event.target.value })} placeholder={adding ? "Atlantis" : nameOf(target)} />
            <label style={labelStyle}>Color (hex)</label>
            <div style={{ alignItems: "center", display: "flex", gap: "0.45rem" }}>
            <input style={{ ...inputStyle, width: "8rem" }} value={fields.color ?? ""} onChange={(event) => setFields({ ...fields, color: event.target.value })} placeholder="#7c3aed" />
            <input
            type="color"
            value={hexToRgb(fields.color) ? (fields.color.startsWith("#") ? fields.color : `#${fields.color}`) : "#7c3aed"}
            onChange={(event) => setFields({ ...fields, color: event.target.value })}
            style={{ background: "none", border: "none", cursor: "pointer", height: "2.1rem", padding: 0, width: "2.6rem" }}
            />
            </div>
            <button type="button" disabled={busy} onClick={applyCountry} style={{ ...primaryButtonStyle, marginTop: "0.7rem", width: "100%" }}>
            {adding ? "Create country" : "Save changes"}
            </button>
            {statusLine}
            </div>
            </>
        );
    }

    if (tool === "regions") {
        return (
            <>
            {header(meta.title, meta.subtitle)}
            <div style={{ flex: 1, minHeight: 0, overflowY: "auto" }}>
            <button
            type="button"
            onClick={() => beginClickMode("Click a region to inspect it", async (props) => {
                setFields({
                    id: String(props.GID_1 ?? ""),
                    name: props.NAME_1 || "",
                    owner: props.owner || props.GID_0 || "",
                });
                setStatus("");
                // One region at a time: back to the panel to edit it.
                endClickMode();
            })}
            style={{ ...primaryButtonStyle, width: "100%" }}
            >
            Pick a region on the map
            </button>
            {fields.id && (
                <>
                <div style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.76rem", marginTop: "0.6rem" }}>
                Region <code>{fields.id}</code> — owned by <strong>{nameOf(fields.owner)}</strong>
                </div>
                <label style={labelStyle}>Name</label>
                <input style={inputStyle} value={fields.name ?? ""} onChange={(event) => setFields({ ...fields, name: event.target.value })} />
                <label style={labelStyle}>Owner</label>
                <PolitySelect polities={polities} value={fields.owner ?? ""} onChange={(code) => setFields({ ...fields, owner: code })} placeholder="Unclaimed" />
                <button
                type="button"
                disabled={busy}
                onClick={() => runBusy(async () => {
                    const world = await readWorldState({ force: true });
                    const notes = [];
                    if (fields.owner) {
                        await writeWorldState({
                            ...world,
                            regionOwnershipOverrides: { ...world.regionOwnershipOverrides, [fields.id]: fields.owner },
                        });
                        notes.push(`owner → ${nameOf(fields.owner)}`);
                    }
                    // Names can only be renamed on maps with their own geometry
                    // (map-editor scenarios); the stock world's names live in
                    // the map tiles.
                    const geojson = await readJson(JSON_URLS.regionsGeojson, { defaultValue: null, force: true });
                    const feature = geojson?.features?.find((entry) => String(entry?.properties?.id ?? "") === fields.id);
                    if (feature && fields.name && fields.name !== feature.properties.name) {
                        feature.properties.name = fields.name;
                        await writeJson(JSON_URLS.regionsGeojson, geojson, { pretty: true });
                        notes.push(`name → ${fields.name}`);
                    } else if (!feature && fields.name && fields.name !== "") {
                        notes.push("name unchanged — stock-map region names come from the map tiles and can't be renamed");
                    }
                    return notes.length ? `Saved: ${notes.join("; ")}.` : "Nothing to change.";
                })}
                style={{ ...primaryButtonStyle, marginTop: "0.7rem", width: "100%" }}
                >
                Save region
                </button>
                </>
            )}
            {statusLine}
            </div>
            </>
        );
    }


    if (tool === "edit-feature") {
        // ONE FEATURE AT A TIME, IN THE ORIGINAL'S ORDER.
        //
        // This panel used to be three stacked lists — cities, structures, units —
        // each rendering up to forty rows, each row able to expand into its own
        // full form. At 116 structures that is a scroll with no bottom, and the
        // player's own 88 sat mixed in with China's 7, the UAE's 5 and a Zimbabwe
        // landmark, sorted by nothing anybody chose.
        //
        // The original's shape solves it by not showing the forms at all until
        // you have picked something: search, choose one, then edit it in named
        // sections. Only one form is ever on screen, so the panel's height stops
        // depending on how long the campaign has run. Sections follow the
        // original's order — name & owner, placement & styling, tags, location,
        // colour override — with one deliberate substitution: where it offers a
        // free symbol, this keeps the kind catalogue (runtime/featureKinds.js),
        // which is what makes the map able to DRAW the thing that was chosen.
        const cities = items?.cities ?? [];
        const markers = items?.markers ?? [];
        const units = items?.units ?? [];
        const renames = items?.renames ?? {};
        const playerCode = game?.country || "";

        const saveWorldList = async (key, nextList, message) => {
            const world = await readWorldState({ force: true });
            await writeWorldState({ ...world, [key]: nextList });
            setItems({ ...items, [key]: nextList });
            return message;
        };
        const saveRenames = async (nextRenames, message) => {
            const world = await readWorldState({ force: true });
            await writeWorldState({ ...world, cityRenames: nextRenames });
            setItems({ ...items, renames: nextRenames });
            return message;
        };
        const saveCities = async (nextFeatures, message) => {
            // Server-backed scenarios refuse runtime writes to their static city
            // geometry — fall back to the always-writable rename table so at
            // least the NAME change sticks (the map label follows it).
            try {
                await writeJson(JSON_URLS.citiesGeojson, { type: "FeatureCollection", features: nextFeatures }, { pretty: true });
                setItems({ ...items, cities: nextFeatures });
                return message;
            } catch (error) {
                if (fields.name) {
                    const old = cities.find((feature, i) => nextFeatures[i]?.properties?.city !== feature?.properties?.city);
                    const from = String(old?.properties?.city ?? old?.properties?.name ?? "").toLowerCase();
                    if (from && fields.name.toLowerCase() !== from) {
                        const world = await readWorldState({ force: true });
                        await writeWorldState({ ...world, cityRenames: { ...world.cityRenames, [from]: fields.name } });
                        setItems({ ...items, renames: { ...renames, [from]: fields.name } });
                        return `This scenario's city geometry is read-only, so the NAME change was saved as a rename instead ("${fields.name}").`;
                    }
                }
                throw error;
            }
        };

        const section = (text) => (
            <div style={{ borderTop: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.8)", fontSize: "0.68rem", fontWeight: 800, letterSpacing: "0.06em", margin: "0.9rem 0 0.4rem", paddingTop: "0.6rem", textTransform: "uppercase" }}>{text}</div>
        );

        // ---- ONE SHAPE FOR EVERY FEATURE ----------------------------------
        // Structures, promoted cities, scenario cities and units are four
        // different records in the save. The list, the search and the selection
        // all want one shape, so they are folded into one here and unfolded
        // again only at the moment of saving.
        const entries = [
            ...markers.map((marker) => ({
                key: `marker-${marker.id}`,
                type: "marker",
                name: marker.name || "",
                kind: marker.kind || "landmark",
                owner: marker.ownerCode || "",
                emoji: emojiForFeatureKind(marker.kind),
                typeLabel: labelForFeatureKind(marker.kind),
                building: marker.status === "under-construction",
                ready: marker.readyAt || "",
                tags: Array.isArray(marker.tags) ? marker.tags : [],
                source: marker,
            })),
            ...cities.map((feature, index) => ({
                key: `city-${index}`,
                type: "city",
                name: feature?.properties?.city || feature?.properties?.name || `Feature ${index + 1}`,
                kind: "city",
                owner: "",
                emoji: emojiForFeatureKind("city"),
                typeLabel: labelForFeatureKind("city"),
                building: false,
                ready: "",
                tags: [],
                source: feature,
                index,
            })),
            ...units.map((unit) => ({
                key: `unit-${unit.id}`,
                type: "unit",
                name: unit.name || "",
                kind: unit.type || "infantry",
                owner: unit.ownerCode || "",
                emoji: UNIT_TYPE_EMOJI[unit.type] ?? "⚔️",
                typeLabel: unitTypeLabel(unit.type),
                building: false,
                ready: "",
                tags: Array.isArray(unit.tags) ? unit.tags : [],
                source: unit,
            })),
        ];

        // WHOSE FEATURES YOU ARE LOOKING AT. Defaults to the player's own,
        // because 88 of the live map's 116 structures are theirs and the other 28
        // belong to nine countries they did not build for. "Everyone" is one
        // click away and the counts are on the buttons, so nothing is hidden —
        // it is only put behind a choice.
        const scope = fields.scope ?? (playerCode ? "mine" : "all");
        const mineCount = entries.filter((entry) => entry.owner === playerCode).length;
        const buildingCount = entries.filter((entry) => entry.building).length;
        const scoped = entries.filter((entry) => {
            if (scope === "mine") return entry.owner === playerCode;
            if (scope === "building") return entry.building;
            return true;
        });

        const q = search.trim().toLowerCase();
        const matched = q
            ? scoped.filter((entry) =>
                `${entry.name} ${entry.kind} ${entry.typeLabel} ${entry.owner} ${entry.tags.join(" ")}`
                    .toLowerCase().includes(q))
            : scoped;
        const sorted = [...matched].sort((a, b) => a.name.localeCompare(b.name));

        const selected = entries.find((entry) => entry.key === editingId) ?? null;

        const openEntry = (entry) => {
            setEditingId(entry.key);
            if (entry.type === "marker") {
                const marker = entry.source;
                setFields({
                    scope,
                    color: marker.color || "",
                    kind: marker.kind || "landmark",
                    lat: String(marker.lat ?? ""),
                    lng: String(marker.lng ?? ""),
                    name: marker.name || "",
                    note: marker.note || "",
                    ownerCode: marker.ownerCode || "",
                    size: String(marker.size ?? 1),
                    tagText: (Array.isArray(marker.tags) ? marker.tags : []).join(", "),
                });
            } else if (entry.type === "city") {
                const props = entry.source?.properties ?? {};
                setFields({
                    scope,
                    name: props.city || props.name || "",
                    population: String(props.population ?? ""),
                    tier: String(props.tier ?? 2),
                });
            } else {
                const unit = entry.source;
                setFields({
                    scope,
                    color: unit.color || "",
                    history: unit.history || "",
                    lat: String(unit.lat ?? ""),
                    lng: String(unit.lng ?? ""),
                    name: unit.name || "",
                    note: unit.note || "",
                    ownerCode: unit.ownerCode || "",
                    status: unit.status || "idle",
                    strength: String(unit.strength ?? 100),
                    tagText: (Array.isArray(unit.tags) ? unit.tags : []).join(", "),
                    type: unit.type || "infantry",
                });
            }
        };

        const closeEntry = () => { setEditingId(null); setFields({ scope }); };

        // A tag list the player typed, cleaned the same way the normalizer will
        // clean it, so what the field shows and what the save holds agree.
        const parseTags = (value) => [...new Set(
            String(value ?? "").split(",").map((tag) => tag.trim()).filter(Boolean),
        )].slice(0, 12);

        const pickPosition = (label) => beginClickMode(`Click where “${label}” stands`, (props) => {
            if (!props?.lngLat) return;
            setFields((prior) => ({ ...prior, lat: String(props.lngLat.lat.toFixed(4)), lng: String(props.lngLat.lng.toFixed(4)) }));
            endClickMode();
            setStatus("Position picked — press Save to keep it.");
        });

        const saveSelected = () => runBusy(async () => {
            if (!selected) return "";
            const tags = parseTags(fields.tagText);
            const color = /^#[0-9a-f]{3}(?:[0-9a-f]{3})?$/i.test(String(fields.color ?? "").trim())
                ? String(fields.color).trim() : "";
            // A blank or unreadable coordinate keeps the one the feature already
            // had: this editor must never be a way to lose a position, and 0,0 is
            // the Atlantic.
            const lng = Number(fields.lng);
            const lat = Number(fields.lat);
            const keepLng = (entry) => (Number.isFinite(lng) && lng >= -180 && lng <= 180 ? lng : entry.lng);
            const keepLat = (entry) => (Number.isFinite(lat) && lat >= -90 && lat <= 90 ? lat : entry.lat);

            if (selected.type === "marker") {
                const size = Math.max(0.5, Math.min(3, Number(fields.size) || 1));
                const next = markers.map((entry) => entry.id !== selected.source.id ? entry : {
                    ...entry,
                    kind: tidyFeatureKind(fields.kind) || entry.kind || "landmark",
                    lat: keepLat(entry),
                    lng: keepLng(entry),
                    name: fields.name || entry.name,
                    note: fields.note ?? entry.note ?? "",
                    ownerCode: fields.ownerCode ?? entry.ownerCode ?? "",
                    size,
                    ...(tags.length ? { tags } : {}),
                    ...(color ? { color } : {}),
                });
                closeEntry();
                return saveWorldList("markers", next, `${fields.name || selected.name} saved.`);
            }
            if (selected.type === "unit") {
                const strength = Math.max(1, Math.min(1000, Number(fields.strength) || 100));
                const next = units.map((entry) => entry.id !== selected.source.id ? entry : {
                    ...entry,
                    history: fields.history ?? entry.history ?? "",
                    lat: keepLat(entry),
                    lng: keepLng(entry),
                    name: fields.name || entry.name,
                    note: fields.note ?? entry.note ?? "",
                    ownerCode: fields.ownerCode ?? entry.ownerCode ?? "",
                    status: fields.status || entry.status || "idle",
                    strength,
                    type: fields.type || entry.type || "infantry",
                    updatedAt: new Date().toISOString(),
                    ...(tags.length ? { tags } : {}),
                    ...(color ? { color } : {}),
                });
                closeEntry();
                return saveWorldList("units", next, `${fields.name || selected.name} saved.`);
            }
            const nextFeatures = cities.map((entry, i) => {
                if (i !== selected.index) return entry;
                const population = Number(fields.population);
                const tier = Math.max(1, Math.min(4, Number(fields.tier) || 2));
                return {
                    ...entry,
                    properties: {
                        ...entry.properties,
                        capital: tier === 4,
                        city: fields.name || entry.properties?.city,
                        name: fields.name || entry.properties?.name,
                        tier,
                        ...(Number.isFinite(population) && population > 0 ? { population } : null),
                    },
                };
            });
            closeEntry();
            return saveCities(nextFeatures, `${fields.name || selected.name} saved.`);
        });

        const deleteSelected = () => runBusy(async () => {
            if (!selected) return "";
            const name = selected.name;
            closeEntry();
            if (selected.type === "marker") {
                return saveWorldList("markers", markers.filter((entry) => entry.id !== selected.source.id), `${name} removed.`);
            }
            if (selected.type === "unit") {
                return saveWorldList("units", units.filter((entry) => entry.id !== selected.source.id), `${name} disbanded.`);
            }
            return saveCities(cities.filter((_, i) => i !== selected.index), `${name} deleted.`);
        });

        const scopeButton = (id, label, count) => (
            <button
            key={id}
            type="button"
            onClick={() => setFields({ ...fields, scope: id })}
            style={{
                background: scope === id ? "rgba(59,130,246,0.28)" : "rgba(255,255,255,0.05)",
                border: scope === id ? "1px solid rgba(96,165,250,0.75)" : "1px solid rgba(255,255,255,0.12)",
                borderRadius: 999,
                color: "white",
                cursor: "pointer",
                flex: 1,
                fontSize: "0.68rem",
                fontWeight: scope === id ? 700 : 500,
                padding: "0.3rem 0.4rem",
                whiteSpace: "nowrap",
            }}
            >
            {label} <span data-no-translate style={{ opacity: 0.6 }}>{count}</span>
            </button>
        );

        return (
            <>
            {header(meta.title, meta.subtitle)}
            <div style={{ display: "flex", flex: 1, flexDirection: "column", minHeight: 0 }}>
            <div style={{ minHeight: 0, overflowY: "auto", paddingRight: "0.2rem" }}>

            {section("Map feature search")}
            {/* Detection the way players expect it: click the thing ON THE MAP.
                The map click handler reports the city/structure/unit under the
                cursor (featureHit/unitHit) while a cheat click-mode is armed. */}
            <button
            type="button"
            onClick={() => beginClickMode("Click a city, structure, or unit on the map to edit it", async (props) => {
                endClickMode();
                const hitKey = props.unitHit?.id
                    ? `unit-${props.unitHit.id}`
                    : props.featureHit?.source === "marker"
                        ? `marker-${props.featureHit.id}`
                        : null;
                const hit = hitKey ? entries.find((entry) => entry.key === hitKey) : null;
                if (hit) {
                    // Widen the scope if the thing they clicked is not in it —
                    // clicking a Chinese base and being told nothing is there
                    // would be the filter lying about the map.
                    if (hit.owner !== playerCode) setFields((prior) => ({ ...prior, scope: "all" }));
                    setSearch("");
                    openEntry(hit);
                    setStatus(`“${hit.name}” selected.`);
                    return;
                }
                const cityName = props.featureHit?.source === "city" ? props.featureHit.name : "";
                if (cityName) {
                    const byName = entries.find((entry) => entry.name.toLowerCase() === cityName.toLowerCase());
                    if (byName) { openEntry(byName); setStatus(`“${byName.name}” selected.`); return; }
                    setSearch(cityName);
                    setStatus(`“${cityName}” is a standard-map city — search for it below to make it an editable feature.`);
                    return;
                }
                setStatus("Nothing editable there — click directly on a city, structure, or unit icon.");
            })}
            style={{ ...primaryButtonStyle, marginBottom: "0.4rem", width: "100%" }}
            >
            Pick a feature on the map
            </button>
            <input
            style={inputStyle}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Name, kind, owner, or tag…"
            />
            <div style={{ display: "flex", gap: "0.25rem", marginTop: "0.35rem" }}>
            {playerCode && scopeButton("mine", "Mine", mineCount)}
            {scopeButton("all", "Everyone", entries.length)}
            {buildingCount > 0 && scopeButton("building", "Building", buildingCount)}
            </div>

            {section(`Feature selection (${sorted.length})`)}
            {/* A DROPDOWN, which is the point of the original's design: the
                panel's height stops depending on how many features the campaign
                has accumulated, because a hundred options scroll INSIDE the
                control rather than down the panel. This also retires the 25-row
                cap the list needed — the dropdown holds every match, so nothing
                is cut and there is nothing to announce as cut. */}
            <select
            value={selected && sorted.some((entry) => entry.key === selected.key) ? selected.key : ""}
            onChange={(event) => {
                const entry = entries.find((candidate) => candidate.key === event.target.value);
                if (entry) openEntry(entry);
                else closeEntry();
            }}
            style={{ ...inputStyle, cursor: "pointer" }}
            >
            <option value="">
            {sorted.length === 0
                ? "Nothing matches — widen the filter or clear the search"
                : `— pick a feature (${sorted.length}) —`}
            </option>
            {[
                { type: "marker", label: "Structures & landmarks" },
                { type: "city", label: "Cities" },
                { type: "unit", label: "Armies & units" },
            ].map(({ type, label }) => {
                const ofType = sorted.filter((entry) => entry.type === type);
                if (ofType.length === 0) return null;
                return (
                    <optgroup key={type} label={`${label} (${ofType.length})`}>
                    {ofType.map((entry) => (
                        <option key={entry.key} value={entry.key} style={{ color: "black" }}>
                        {`${entry.emoji} ${entry.name}${entry.owner ? ` · ${entry.owner}` : ""}${entry.building ? " · 건설 중" : ""}`}
                        </option>
                    ))}
                    </optgroup>
                );
            })}
            </select>
            {cities.length === 0 && (
                <StockCityPromoter
                    busy={busy}
                    markers={markers}
                    onPromote={(marker, message) => runBusy(async () => saveWorldList("markers", [...markers, marker], message))}
                />
            )}

            {selected && (
            <>
            {section("Name and owner")}
            <label style={labelStyle}>Name</label>
            <input style={inputStyle} value={fields.name ?? ""} onChange={(event) => setFields({ ...fields, name: event.target.value })} />
            {selected.type !== "city" && (
                <>
                <label style={labelStyle}>Owner</label>
                <PolitySelect
                    polities={polities}
                    value={fields.ownerCode ?? ""}
                    onChange={(ownerCode) => setFields({ ...fields, ownerCode })}
                    placeholder={selected.type === "unit" ? "Pick a country…" : "Nobody in particular"}
                />
                </>
            )}

            {section("Placement and styling")}
            {selected.type === "marker" && (
                <>
                <label style={labelStyle}>Kind</label>
                <KindPicker value={fields.kind ?? ""} onChange={(kind) => setFields({ ...fields, kind })} />
                <label style={labelStyle}>Size</label>
                <SizeField value={fields.size} onChange={(size) => setFields({ ...fields, size })} />
                <label style={labelStyle}>Note (optional)</label>
                <input style={inputStyle} value={fields.note ?? ""} onChange={(event) => setFields({ ...fields, note: event.target.value })} placeholder="What this place is for" />
                </>
            )}
            {selected.type === "unit" && (
                <>
                <label style={labelStyle}>Branch</label>
                <div style={{ display: "grid", gap: "0.25rem", gridTemplateColumns: "repeat(auto-fill, minmax(5.1rem, 1fr))" }}>
                {UNIT_TYPES.map((type) => {
                    const active = type === (fields.type ?? selected.kind);
                    return (
                        <button
                        key={type}
                        type="button"
                        title={type}
                        onClick={() => setFields({ ...fields, type })}
                        style={{
                            alignItems: "center",
                            background: active ? "rgba(59,130,246,0.28)" : "rgba(255,255,255,0.05)",
                            border: active ? "1px solid rgba(96,165,250,0.75)" : "1px solid rgba(255,255,255,0.12)",
                            borderRadius: 8,
                            color: "white",
                            cursor: "pointer",
                            display: "flex",
                            flexDirection: "column",
                            gap: "0.1rem",
                            padding: "0.35rem 0.2rem",
                        }}
                        >
                        <span style={{ fontSize: "1rem", lineHeight: 1 }}>{UNIT_TYPE_EMOJI[type]}</span>
                        <span data-no-translate="" style={{ fontSize: "0.62rem", whiteSpace: "nowrap" }}>{unitTypeLabel(type)}</span>
                        </button>
                    );
                })}
                </div>
                <label style={labelStyle}>Strength</label>
                <input style={inputStyle} type="number" min={1} max={1000} value={fields.strength ?? "100"} onChange={(event) => setFields({ ...fields, strength: event.target.value })} />
                <label style={labelStyle}>Status</label>
                <select
                value={fields.status ?? "idle"}
                onChange={(event) => setFields({ ...fields, status: event.target.value })}
                style={{ ...inputStyle, cursor: "pointer" }}
                >
                {UNIT_STATUSES.map((status) => (
                    <option key={status} value={status} style={{ color: "black" }}>{unitStatusLabel(status)}</option>
                ))}
                </select>
                <label style={labelStyle}>Standing orders (the AI rewrites this)</label>
                <input style={inputStyle} value={fields.note ?? ""} onChange={(event) => setFields({ ...fields, note: event.target.value })} placeholder="Holding the eastern approach" />
                {/* THE FORMATION'S OWN STORY. Separate from the note above, which
                    the AI overwrites every time it moves the unit. This one is the
                    player's and nothing in the engine touches it — it rides into
                    the order of battle the model reads, so a division given a past
                    gets written about with that past. */}
                <label style={labelStyle}>📖 History &amp; lore</label>
                <textarea
                value={fields.history ?? ""}
                onChange={(event) => setFields({ ...fields, history: event.target.value.slice(0, 600) })}
                placeholder="Raised in 1950, held the line at…"
                style={{ ...inputStyle, minHeight: "4.5rem", resize: "vertical" }}
                />
                </>
            )}
            {selected.type === "city" && (
                <>
                <label style={labelStyle}>Tier (1 town … 4 capital)</label>
                <input style={inputStyle} type="number" min={1} max={4} value={fields.tier ?? "2"} onChange={(event) => setFields({ ...fields, tier: event.target.value })} />
                <label style={labelStyle}>Population (optional)</label>
                <input style={inputStyle} value={fields.population ?? ""} onChange={(event) => setFields({ ...fields, population: event.target.value })} />
                </>
            )}

            {selected.type !== "city" && (
            <>
            {section("Tags")}
            {/* Free text, comma separated — the same thing the search box reads,
                which is what makes 116 structures findable by something other
                than the name the AI happened to give them. */}
            <input
            style={inputStyle}
            value={fields.tagText ?? ""}
            onChange={(event) => setFields({ ...fields, tagText: event.target.value })}
            placeholder="반도체, 1급 보안, 서해"
            />
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.25rem", marginTop: "0.3rem" }}>
            {parseTags(fields.tagText).map((tag) => (
                <span key={tag} data-no-translate style={{ background: "rgba(255,255,255,0.08)", borderRadius: 999, fontSize: "0.68rem", padding: "0.15rem 0.5rem" }}>{tag}</span>
            ))}
            </div>

            {section("Location")}
            <CoordinateFields
            lng={fields.lng}
            lat={fields.lat}
            picking={Boolean(clickMode)}
            onChange={(next) => setFields({ ...fields, ...next })}
            onPick={() => pickPosition(fields.name || selected.name)}
            />

            {section("Colour override")}
            {/* Empty means "take the owner's colour", which is the right default
                and the thing a reset has to be able to get back to — so the swatch
                is paired with a clear, not left as a colour you can only change. */}
            <div style={{ alignItems: "center", display: "flex", gap: "0.4rem" }}>
            <input
            type="color"
            value={/^#[0-9a-f]{6}$/i.test(String(fields.color ?? "")) ? fields.color : "#60a5fa"}
            onChange={(event) => setFields({ ...fields, color: event.target.value })}
            style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 6, cursor: "pointer", height: "2rem", padding: 0, width: "3rem" }}
            />
            <span style={{ color: "rgba(255,255,255,0.6)", flex: 1, fontSize: "0.72rem" }}>
            {fields.color ? "Pinned to this colour." : "Following its owner's colour."}
            </span>
            <button
            type="button"
            onClick={() => setFields({ ...fields, color: "" })}
            disabled={!fields.color}
            style={{ ...buttonStyle, opacity: fields.color ? 1 : 0.4, padding: "0.25rem 0.6rem" }}
            >
            Reset
            </button>
            </div>
            </>
            )}

            <div style={{ display: "flex", gap: "0.4rem", marginTop: "0.8rem" }}>
            <button type="button" disabled={busy} style={{ ...primaryButtonStyle, flex: 1 }} onClick={saveSelected}>
            Save
            </button>
            <button
            type="button"
            disabled={busy}
            style={{ ...buttonStyle, borderColor: "rgba(248,113,113,0.5)", color: "#fca5a5" }}
            onClick={deleteSelected}
            >
            🗑 Delete
            </button>
            </div>
            </>
            )}

            {/* Stock-city renames stay reachable on a map whose cities live in the
                tiles: promoting is the better answer, but a rename is the cheaper
                one and old saves already hold three. */}
            {cities.length === 0 && Object.keys(renames).length > 0 && (
                <>
                {section(`Stock city renames (${Object.keys(renames).length})`)}
                {Object.entries(renames).map(([from, to]) => (
                    <div key={from} style={{ alignItems: "center", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, display: "flex", justifyContent: "space-between", marginBottom: "0.3rem", padding: "0.4rem 0.6rem" }}>
                    <span data-no-translate style={{ fontSize: "0.76rem" }}>{from} → <strong>{to}</strong></span>
                    <button
                    type="button"
                    style={{ ...buttonStyle, padding: "0.2rem 0.5rem" }}
                    disabled={busy}
                    onClick={() => runBusy(async () => {
                        const next = { ...renames };
                        delete next[from];
                        return saveRenames(next, "Rename removed.");
                    })}
                    >
                    🗑
                    </button>
                    </div>
                ))}
                </>
            )}

            </div>
            {statusLine}
            </div>
            </>
        );
    }

    if (tool === "add-feature") {
        // A MAP FEATURE, NOT ONLY A CITY. This panel offered Name / Tier /
        // Population and wrote a city into citiesGeojson — so the one kind of
        // thing it could not add was a structure, which is most of what is on
        // the map. The type switch decides which of the two lists it lands in.
        const featureType = fields.featureType ?? "structure";
        const isCity = featureType === "city";
        const isUnit = featureType === "unit";
        const allowed = getAllowedUnitTypes();
        const deployableTypes = Array.isArray(allowed) && allowed.length
            ? UNIT_TYPES.filter((type) => allowed.includes(type))
            : UNIT_TYPES;
        const name = String(fields.name ?? "").trim();
        const lng = Number(fields.lng);
        const lat = Number(fields.lat);
        const hasPosition = Number.isFinite(lng) && Number.isFinite(lat)
            && lng >= -180 && lng <= 180 && lat >= -90 && lat <= 90;

        const placeStructure = async (atLng, atLat) => {
            const world = await readWorldState({ force: true });
            const list = Array.isArray(world?.markers) ? world.markers : [];
            const marker = {
                foundedAt: game?.gameDate ?? "",
                id: `marker-manual-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
                kind: tidyFeatureKind(fields.kind) || inferFeatureKind(name) || "landmark",
                lat: atLat,
                lng: atLng,
                name,
                note: String(fields.note ?? "").trim(),
                ownerCode: fields.ownerCode ?? "",
                size: Math.max(0.5, Math.min(3, Number(fields.size) || 1)),
            };
            await writeWorldState({ ...world, markers: [...list, marker] });
            return `${name} built. It is on the map now.`;
        };

        const placeCity = async (atLng, atLat) => {
            const tier = Math.max(1, Math.min(4, Number(fields.tier) || 2));
            const population = Number(fields.population);
            const geojson = await readJson(JSON_URLS.citiesGeojson, { defaultValue: EMPTY_FEATURES, force: true });
            const features = [...(geojson?.features ?? []), {
                type: "Feature",
                geometry: { type: "Point", coordinates: [atLng, atLat] },
                properties: {
                    city: name,
                    name,
                    tier,
                    capital: tier === 4,
                    ...(Number.isFinite(population) && population > 0 ? { population } : null),
                },
            }];
            await writeJson(JSON_URLS.citiesGeojson, { type: "FeatureCollection", features }, { pretty: true });
            const world = await readWorldState({ force: true });
            if (!world.customCities) {
                // The custom layer replaces the stock one, so flag it on —
                // otherwise the new feature would never render.
                await writeWorldState({ ...world, customCities: true });
            }
            return `${name} placed. The map picks it up within a few seconds.`;
        };

        // MANUAL FORCE DEPLOYMENT LIVES HERE NOW.
        //
        // It used to be its own tool at the top of the cheats panel, asking for a
        // branch, a strength and a name and then putting the map into a deploy
        // mode — a second, differently-shaped way to put a thing on the map,
        // sitting a few centimetres from the one that adds structures. A
        // formation IS a map feature; the only thing that differs is which list
        // it lands in.
        const placeUnit = async (atLng, atLat) => {
            const world = await readWorldState({ force: true });
            const list = Array.isArray(world?.units) ? world.units : [];
            const type = fields.unitType || "infantry";
            const unit = {
                history: String(fields.history ?? "").slice(0, 600),
                id: `unit-manual-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
                lat: atLat,
                lng: atLng,
                name,
                note: String(fields.note ?? "").trim(),
                ownerCode: fields.ownerCode || game?.country || "",
                source: "player",
                // A hand-placed formation is on the map immediately — "pending" is
                // for a deployment the AI has still to resolve, and this one has
                // no order behind it to resolve.
                status: "idle",
                strength: Math.max(1, Math.min(1000, Math.round(Number(fields.strength) || 100))),
                type,
            };
            await writeWorldState({ ...world, units: [...list, unit] });
            return `${name} deployed.`;
        };

        const place = (atLng, atLat) => runBusy(async () => {
            let message;
            if (isCity) message = await placeCity(atLng, atLat);
            else if (isUnit) message = await placeUnit(atLng, atLat);
            else message = await placeStructure(atLng, atLat);
            setFields({ featureType });
            return message;
        });

        return (
            <>
            {header(meta.title, meta.subtitle)}
            <div style={{ flex: 1, minHeight: 0, overflowY: "auto" }}>
            <label style={labelStyle}>What are you adding?</label>
            <div style={{ display: "flex", gap: "0.35rem" }}>
            {[["structure", "🏗 Structure"], ["city", "🏙 City"], ["unit", "⚔️ Army"]].map(([id, label]) => (
                <button
                key={id}
                type="button"
                onClick={() => setFields({ ...fields, featureType: id })}
                style={{
                    ...buttonStyle,
                    background: featureType === id ? "rgba(59,130,246,0.28)" : buttonStyle.background,
                    border: featureType === id ? "1px solid rgba(96,165,250,0.75)" : buttonStyle.border,
                    flex: 1,
                }}
                >
                {label}
                </button>
            ))}
            </div>

            <label style={labelStyle}>Name</label>
            <input style={inputStyle} value={fields.name ?? ""} onChange={(event) => setFields({ ...fields, name: event.target.value })} placeholder={isCity ? "Alexandria" : (isUnit ? "27th Infantry Division" : "Busan Hydrogen Terminal")} />

            {isUnit ? (
                <>
                <label style={labelStyle}>Branch</label>
                {/* The scenario may restrict which branches exist — no air arm in
                    1200. That restriction lived in the old Forces deploy form and
                    had to come with it. */}
                <div style={{ display: "grid", gap: "0.25rem", gridTemplateColumns: "repeat(auto-fill, minmax(5.1rem, 1fr))" }}>
                {deployableTypes.map((type) => {
                    const active = type === (fields.unitType ?? deployableTypes[0] ?? "infantry");
                    return (
                        <button
                        key={type}
                        type="button"
                        title={type}
                        onClick={() => setFields({ ...fields, unitType: type })}
                        style={{
                            alignItems: "center",
                            background: active ? "rgba(59,130,246,0.28)" : "rgba(255,255,255,0.05)",
                            border: active ? "1px solid rgba(96,165,250,0.75)" : "1px solid rgba(255,255,255,0.12)",
                            borderRadius: 8,
                            color: "white",
                            cursor: "pointer",
                            display: "flex",
                            flexDirection: "column",
                            gap: "0.1rem",
                            padding: "0.35rem 0.2rem",
                        }}
                        >
                        <span style={{ fontSize: "1rem", lineHeight: 1 }}>{UNIT_TYPE_EMOJI[type]}</span>
                        <span data-no-translate="" style={{ fontSize: "0.62rem", whiteSpace: "nowrap" }}>{unitTypeLabel(type)}</span>
                        </button>
                    );
                })}
                </div>
                <label style={labelStyle}>Owner</label>
                <PolitySelect polities={polities} value={fields.ownerCode ?? ""} onChange={(ownerCode) => setFields({ ...fields, ownerCode })} placeholder={game?.country || "Pick a country…"} />
                <label style={labelStyle}>Strength</label>
                <input style={inputStyle} type="number" min={1} max={1000} value={fields.strength ?? "100"} onChange={(event) => setFields({ ...fields, strength: event.target.value })} />
                <label style={labelStyle}>Standing orders (the AI rewrites this)</label>
                <input style={inputStyle} value={fields.note ?? ""} onChange={(event) => setFields({ ...fields, note: event.target.value })} placeholder="Holding the eastern approach" />
                <label style={labelStyle}>📖 History &amp; lore</label>
                <textarea
                value={fields.history ?? ""}
                onChange={(event) => setFields({ ...fields, history: event.target.value.slice(0, 600) })}
                placeholder="Raised in 1953 from the survivors of the Chosin withdrawal."
                rows={3}
                style={{ ...inputStyle, fontFamily: "inherit", lineHeight: 1.45, resize: "vertical" }}
                />
                </>
            ) : isCity ? (
                <>
                <label style={labelStyle}>Tier (1 town … 4 capital)</label>
                <input style={inputStyle} type="number" min={1} max={4} value={fields.tier ?? "2"} onChange={(event) => setFields({ ...fields, tier: event.target.value })} />
                <label style={labelStyle}>Population (optional)</label>
                <input style={inputStyle} value={fields.population ?? ""} onChange={(event) => setFields({ ...fields, population: event.target.value })} />
                </>
            ) : (
                <>
                <label style={labelStyle}>Kind</label>
                <KindPicker value={fields.kind ?? ""} onChange={(kind) => setFields({ ...fields, kind })} />
                {!String(fields.kind ?? "").trim() && inferFeatureKind(name) && (
                    <div style={{ color: "rgba(191,219,254,0.85)", fontSize: "0.7rem", marginTop: "0.25rem" }}>
                    Left blank, this name reads as {labelForFeatureKind(inferFeatureKind(name))}.
                    </div>
                )}
                <label style={labelStyle}>Owner</label>
                <PolitySelect polities={polities} value={fields.ownerCode ?? ""} onChange={(ownerCode) => setFields({ ...fields, ownerCode })} placeholder="Nobody in particular" />
                <label style={labelStyle}>Size</label>
                <SizeField value={fields.size} onChange={(size) => setFields({ ...fields, size })} />
                <label style={labelStyle}>Note (optional)</label>
                <input style={inputStyle} value={fields.note ?? ""} onChange={(event) => setFields({ ...fields, note: event.target.value })} placeholder="What this place is for" />
                </>
            )}

            <label style={labelStyle}>Position</label>
            <CoordinateFields
            lng={fields.lng}
            lat={fields.lat}
            picking={Boolean(clickMode)}
            onChange={(next) => setFields({ ...fields, ...next })}
            onPick={() => {
                if (!name) {
                    setStatus("Give it a name first.");
                    return;
                }
                beginClickMode(`Click the map where “${name}” goes`, (props) => {
                    if (!props?.lngLat) return;
                    endClickMode();
                    void place(props.lngLat.lng, props.lngLat.lat);
                });
            }}
            />

            <button
            type="button"
            disabled={busy || !name || !hasPosition}
            onClick={() => place(lng, lat)}
            style={{ ...primaryButtonStyle, marginTop: "0.7rem", opacity: (!name || !hasPosition) ? 0.5 : 1, width: "100%" }}
            >
            {isCity ? "Add city" : (isUnit ? "Deploy army" : "Add structure")}
            </button>
            <div style={{ color: "rgba(255,255,255,0.45)", fontSize: "0.72rem", marginTop: "0.5rem" }}>
            {isCity
                ? "On maps that still use the standard world cities, adding the first custom feature switches the map to custom features only."
                : "Picking on the map places it straight away; typing coordinates needs the button."}
            </div>
            {statusLine}
            </div>
            </>
        );
    }

    if (tool === "clear-features") {
        const count = (items ?? []).length;
        return (
            <>
            {header(meta.title, meta.subtitle)}
            <div>
            <div style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.78rem" }}>
            This map currently has <strong>{count}</strong> custom feature{count === 1 ? "" : "s"}.
            </div>
            <button
            type="button"
            disabled={busy || count === 0}
            onClick={() => runBusy(async () => {
                await writeJson(JSON_URLS.citiesGeojson, EMPTY_FEATURES, { pretty: true });
                setItems([]);
                return "All custom features removed.";
            })}
            style={{ ...primaryButtonStyle, marginTop: "0.7rem", width: "100%" }}
            >
            Delete all custom features
            </button>
            <button
            type="button"
            disabled={busy}
            onClick={() => runBusy(async () => {
                const world = await readWorldState({ force: true });
                await writeWorldState({ ...world, customCities: false });
                return "Map switched back to the standard world cities.";
            })}
            style={{ ...buttonStyle, marginTop: "0.5rem", width: "100%" }}
            >
            Use the standard world cities instead
            </button>
            {statusLine}
            </div>
            </>
        );
    }

    if (tool === "events") {
        const events = items?.events ?? [];
        const history = items?.history ?? [];
        const consolidations = items?.consolidations ?? [];
        const q = search.trim().toLowerCase();
        const matches = (text) => !q || String(text).toLowerCase().includes(q);

        // THE ORIGINAL'S SECOND TAB. Events → Consolidations: read the compressed
        // summaries the AI actually remembers old rounds by, edit their content,
        // delete one, and adjust the consolidation settings — which render here
        // as the SAME panel Settings shows, not a copy of it.
        const activeTab = fields.eventsTab === "consolidations" ? "consolidations" : "rounds";
        const tabStrip = (
            <div style={{ display: "flex", flexShrink: 0, gap: "0.3rem", marginBottom: "0.5rem" }}>
            {[
                { id: "rounds", label: `Rounds (${history.length})` },
                { id: "consolidations", label: `Consolidations (${consolidations.length})` },
            ].map((tab) => (
                <button
                key={tab.id}
                type="button"
                onClick={() => { setFields({ ...fields, eventsTab: tab.id }); setEditingId(null); }}
                style={{
                    background: activeTab === tab.id ? "rgba(59,130,246,0.28)" : "rgba(255,255,255,0.05)",
                    border: activeTab === tab.id ? "1px solid rgba(96,165,250,0.75)" : "1px solid rgba(255,255,255,0.12)",
                    borderRadius: 999,
                    color: "white",
                    cursor: "pointer",
                    flex: 1,
                    fontSize: "0.72rem",
                    fontWeight: activeTab === tab.id ? 700 : 500,
                    padding: "0.32rem 0.5rem",
                }}
                >
                {tab.label}
                </button>
            ))}
            </div>
        );

        if (activeTab === "consolidations") {
            const persistConsolidations = async (nextList, message) => {
                const world = await readWorldState({ force: true });
                await writeWorldState({ ...world, consolidatedHistory: nextList });
                setItems({ ...items, consolidations: nextList });
                return message;
            };
            const newestIndex = consolidations.length - 1;
            return (
                <>
                {header(meta.title, meta.subtitle)}
                <div style={{ display: "flex", flex: 1, flexDirection: "column", minHeight: 0 }}>
                {tabStrip}
                <div style={{ minHeight: 0, overflowY: "auto", paddingRight: "0.2rem" }}>
                <div style={{ color: "rgba(255,255,255,0.55)", fontSize: "0.72rem", lineHeight: 1.5, marginBottom: "0.6rem" }}>
                Each entry is the compressed memory the AI reads INSTEAD of the old rounds it covers. Edit one to reshape what the campaign remembers. Deleting the newest entry makes its rounds eligible for re-consolidation; deleting an older one just removes its paragraph.
                </div>
                {consolidations.length === 0 && (
                    <div style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.75rem" }}>
                    None yet — consolidation begins once the campaign passes the starting round set below.
                    </div>
                )}
                {consolidations.map((entry, index) => ({ entry, index })).reverse().map(({ entry, index }) => {
                    const isEditing = editingId === `consol-${index}`;
                    const summary = String(entry?.summary ?? "");
                    return (
                        <div key={`consol-${index}`} style={{ background: "rgba(14,116,144,0.10)", border: "1px solid rgba(103,232,249,0.28)", borderRadius: 8, marginBottom: "0.4rem", padding: "0.5rem 0.6rem" }}>
                        <div style={{ alignItems: "center", display: "flex", gap: "0.4rem", justifyContent: "space-between" }}>
                        <div
                        onClick={() => { setEditingId(isEditing ? null : `consol-${index}`); setFields({ ...fields, consText: summary }); }}
                        title={isEditing ? "Click to close the editor" : "Click to edit this consolidation"}
                        style={{ cursor: "pointer", minWidth: 0 }}
                        >
                        <span style={{ fontSize: "0.78rem", fontWeight: 700 }}>
                        #{index + 1}{index === newestIndex ? " · newest" : ""}
                        </span>
                        <span style={{ color: "rgba(255,255,255,0.45)", fontSize: "0.68rem" }}>
                        {" "}· through <span data-no-translate>{entry?.throughDate || "?"}</span>
                        {entry?.throughRound ? <> · round <span data-no-translate>{entry.throughRound}</span></> : null}
                        {" "}· <span data-no-translate>{summary.length}</span> chars
                        </span>
                        </div>
                        <button
                        type="button"
                        style={{ ...buttonStyle, flexShrink: 0, padding: "0.2rem 0.5rem" }}
                        disabled={busy}
                        onClick={() => runBusy(async () => persistConsolidations(
                            consolidations.filter((_, i) => i !== index),
                            index === newestIndex
                                ? "Consolidation deleted — its rounds' events are eligible for re-consolidation on the next run."
                                : "Consolidation deleted.",
                        ))}
                        >
                        🗑
                        </button>
                        </div>
                        {isEditing ? (
                            <div style={{ marginTop: "0.4rem" }}>
                            <textarea
                            value={fields.consText ?? ""}
                            onChange={(event) => setFields({ ...fields, consText: event.target.value })}
                            style={{ ...inputStyle, minHeight: "9rem", resize: "vertical" }}
                            />
                            <div style={{ display: "flex", gap: "0.4rem", marginTop: "0.4rem" }}>
                            <button
                            type="button"
                            disabled={busy}
                            style={{ ...primaryButtonStyle, padding: "0.3rem 0.8rem" }}
                            onClick={() => runBusy(async () => {
                                const text = String(fields.consText ?? "").trim();
                                setEditingId(null);
                                if (!text) return "Nothing saved — a consolidation cannot be blank (delete it instead).";
                                return persistConsolidations(
                                    consolidations.map((item, i) => (i === index ? { ...item, summary: text } : item)),
                                    "Consolidation updated — the AI reads the new text from the next turn.",
                                );
                            })}
                            >
                            Save
                            </button>
                            <button type="button" style={{ ...buttonStyle, padding: "0.3rem 0.8rem" }} onClick={() => setEditingId(null)}>
                            Cancel
                            </button>
                            </div>
                            </div>
                        ) : (
                            <div style={{ color: "rgba(255,255,255,0.62)", fontSize: "0.73rem", lineHeight: 1.45, marginTop: "0.25rem", maxHeight: "5.6rem", overflow: "hidden", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                            {summary.length > 420 ? `${summary.slice(0, 420)}…` : summary}
                            </div>
                        )}
                        </div>
                    );
                })}
                <div style={{ borderTop: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.8)", fontSize: "0.68rem", fontWeight: 800, letterSpacing: "0.06em", margin: "0.9rem 0 0.5rem", paddingTop: "0.6rem", textTransform: "uppercase" }}>
                Consolidation settings
                </div>
                <ConsolidationPanel />
                </div>
                {statusLine}
                </div>
                </>
            );
        }

        // Round grouping mirroring the Event Manager: each recorded turn shows
        // the actions the player had submitted (BLUE) and the events the turn
        // produced (PURPLE) as separate color-coded blocks — plus a catch-all
        // for scenario/pregame events. Newest round first (this is an editing
        // surface; the most recent turn is what usually needs fixing).
        const eventById = new Map(events.map((event) => [String(event?.id), event]));
        const groupedIds = new Set();
        const groups = history.map((entry) => {
            const ids = Array.isArray(entry?.eventIds) ? entry.eventIds.map(String) : [];
            ids.forEach((id) => groupedIds.add(id));
            return {
                actions: Array.isArray(entry?.plannedActions) ? entry.plannedActions : [],
                events: ids.map((id) => eventById.get(id)).filter(Boolean),
                fromDate: entry?.fromDate || "",
                key: `round-${entry?.round ?? "?"}`,
                round: entry?.round ?? "?",
                toDate: entry?.toDate || "",
            };
        });
        const earlier = events.filter((event) => !groupedIds.has(String(event?.id)));
        if (earlier.length > 0) {
            groups.push({ actions: [], events: earlier, fromDate: "", key: "earlier", round: "", toDate: "" });
        }
        const persistEvents = async (next, message) => {
            await writeEventsState(next);
            setItems({ events: next, history });
            return message;
        };
        // Edit a SUBMITTED ACTION in its round's history record
        // (world.simulationHistory[..].plannedActions).
        const persistAction = async (round, actionIndex, newText) => {
            const world = await readWorldState({ force: true });
            const list = Array.isArray(world?.simulationHistory) ? world.simulationHistory : [];
            const nextHistory = list.map((entry) => {
                if (entry?.round !== round) return entry;
                const actions = Array.isArray(entry.plannedActions) ? [...entry.plannedActions] : [];
                if (actionIndex < 0 || actionIndex >= actions.length) return entry;
                actions[actionIndex] = { ...actions[actionIndex], rawInput: newText, text: newText };
                return { ...entry, plannedActions: actions };
            });
            await writeWorldState({ ...world, simulationHistory: nextHistory });
            setItems({ events, history: nextHistory });
            return "Action record updated.";
        };
        const eventCard = (event) => {
            const isEditing = editingId === event.id;
            return (
                <div key={event.id} style={{ background: "rgba(109,40,217,0.12)", border: "1px solid rgba(167,139,250,0.35)", borderRadius: 8, padding: "0.5rem 0.6rem" }}>
                <div style={{ display: "flex", gap: "0.4rem", justifyContent: "space-between" }}>
                {/* Full event up front; clicking the text toggles the inline
                    editor — the original's interaction. */}
                <div
                onClick={() => { setEditingId(isEditing ? null : event.id); setFields(isEditing ? {} : { title: event.title, description: event.description, date: event.date }); }}
                title={isEditing ? "Click to close the editor" : "Click to edit this event"}
                style={{ cursor: "pointer", minWidth: 0 }}
                >
                <div style={{ fontSize: "0.8rem", fontWeight: 700 }}>{event.title || "(untitled)"}</div>
                <div style={{ color: "rgba(255,255,255,0.45)", fontSize: "0.68rem" }}>{event.date}</div>
                {!isEditing && event.description && (
                    <div style={{ color: "rgba(255,255,255,0.62)", fontSize: "0.73rem", lineHeight: 1.45, marginTop: "0.2rem", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                    {event.description}
                    </div>
                )}
                </div>
                <div style={{ display: "flex", flexShrink: 0, gap: "0.3rem" }}>
                <button
                type="button"
                style={{ ...buttonStyle, padding: "0.2rem 0.5rem" }}
                disabled={busy}
                onClick={() => runBusy(async () => persistEvents(events.filter((entry) => entry.id !== event.id), "Event deleted."))}
                >
                🗑
                </button>
                </div>
                </div>
                {isEditing && (
                    <div style={{ marginTop: "0.4rem" }}>
                    <label style={labelStyle}>Title</label>
                    <input style={inputStyle} value={fields.title ?? ""} onChange={(e) => setFields({ ...fields, title: e.target.value })} />
                    <label style={labelStyle}>Date</label>
                    <input style={inputStyle} value={fields.date ?? ""} onChange={(e) => setFields({ ...fields, date: e.target.value })} />
                    <label style={labelStyle}>Description</label>
                    <textarea rows={4} style={{ ...inputStyle, resize: "vertical" }} value={fields.description ?? ""} onChange={(e) => setFields({ ...fields, description: e.target.value })} />
                    <button
                    type="button"
                    disabled={busy}
                    style={{ ...primaryButtonStyle, marginTop: "0.5rem", width: "100%" }}
                    onClick={() => runBusy(async () => {
                        const next = events.map((entry) => entry.id === event.id
                            ? { ...entry, title: fields.title ?? entry.title, date: fields.date ?? entry.date, description: fields.description ?? entry.description }
                            : entry);
                        setEditingId(null);
                        return persistEvents(next, "Event saved.");
                    })}
                    >
                    Save event
                    </button>
                    </div>
                )}
                </div>
            );
        };

        return (
            <>
            {header(meta.title, meta.subtitle)}
            <div style={{ display: "flex", flex: 1, flexDirection: "column", minHeight: 0 }}>
            {tabStrip}
            <input style={inputStyle} value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search this round…" />
            {groups.length === 0 && (
                <div style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.76rem", marginTop: "0.6rem" }}>No rounds recorded yet.</div>
            )}
            {/* Round selector chips, like the Event Manager — one round shown at
                a time so a long campaign never becomes one endless scroll. */}
            <div style={{ display: "flex", flexShrink: 0, gap: "0.35rem", marginTop: "0.5rem", overflowX: "auto", paddingBottom: "0.3rem", scrollbarWidth: "thin" }}>
            {groups.map((group) => {
                const isActive = (target || groups[0]?.key) === group.key;
                return (
                    <button
                    key={group.key}
                    type="button"
                    onClick={() => { setTarget(group.key); setEditingId(null); }}
                    style={{
                        alignItems: "center",
                        background: isActive ? "rgba(59,130,246,0.22)" : "rgba(255,255,255,0.05)",
                        border: isActive ? "1px solid rgba(96,165,250,0.65)" : "1px solid rgba(255,255,255,0.12)",
                        borderRadius: 8,
                        color: "white",
                        cursor: "pointer",
                        display: "flex",
                        flexDirection: "column",
                        flexShrink: 0,
                        gap: "0.1rem",
                        minWidth: "4.4rem",
                        padding: "0.3rem 0.5rem",
                    }}
                    >
                    <span style={{ fontSize: "0.74rem", fontWeight: 800 }}>{group.key === "earlier" ? "S" : group.round}</span>
                    <span style={{ color: "rgba(255,255,255,0.45)", fontSize: "0.6rem", whiteSpace: "nowrap" }}>
                    {group.actions.length}행동 · {group.events.length}이벤트
                    </span>
                    </button>
                );
            })}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem", marginTop: "0.4rem", minHeight: 0, overflowY: "auto" }}>
            {groups.filter((group) => group.key === (target || groups[0]?.key)).map((group) => {
                const shownActions = group.actions
                    .map((action, originalIndex) => ({ normalized: normalizeActionEntry(action), originalIndex }))
                    .filter(({ normalized }) => Boolean(normalized))
                    .filter(({ normalized }) => matches(`${normalized.title} ${normalized.text}`));
                const shownEvents = group.events.filter((event) => matches(`${event.title} ${event.description}`));
                if (q && shownActions.length === 0 && shownEvents.length === 0) return null;
                return (
                    <div key={group.key} style={{ marginBottom: "0.4rem" }}>
                    <div style={{ color: "rgba(255,255,255,0.85)", fontSize: "0.78rem", fontWeight: 800, margin: "0.2rem 0 0.3rem" }}>
                    {group.key === "earlier" ? "Scenario & earlier" : `Round ${group.round} — ${group.fromDate || "?"} → ${group.toDate || "?"}`}
                    </div>
                    {/* Submitted actions — BLUE, bundled together per round. */}
                    {shownActions.length > 0 && (
                        <div style={{ color: "rgba(147,197,253,0.95)", fontSize: "0.66rem", fontWeight: 800, letterSpacing: "0.05em", margin: "0.15rem 0 0.25rem", textTransform: "uppercase" }}>
                        Submitted Actions ({shownActions.length})
                        </div>
                    )}
                    {shownActions.map(({ normalized: action, originalIndex }) => {
                        const actionKey = `action-${group.key}-${originalIndex}`;
                        const isEditingAction = editingId === actionKey;
                        const canEdit = group.key !== "earlier";
                        return (
                            <div key={action.id || actionKey} style={{ background: "rgba(37,99,235,0.12)", border: "1px solid rgba(96,165,250,0.35)", borderRadius: 8, marginBottom: "0.3rem", padding: "0.45rem 0.55rem" }}>
                            {isEditingAction ? (
                                <div>
                                <textarea
                                rows={3}
                                autoFocus
                                style={{ ...inputStyle, resize: "vertical" }}
                                value={fields.actionText ?? ""}
                                onChange={(e) => setFields({ ...fields, actionText: e.target.value })}
                                />
                                <div style={{ display: "flex", gap: "0.4rem", marginTop: "0.4rem" }}>
                                <button
                                type="button"
                                disabled={busy}
                                style={{ ...primaryButtonStyle, padding: "0.3rem 0.8rem" }}
                                onClick={() => runBusy(async () => {
                                    const text = String(fields.actionText ?? "").trim();
                                    setEditingId(null);
                                    if (!text) return "Nothing to save.";
                                    return persistAction(group.round, originalIndex, text);
                                })}
                                >
                                Save
                                </button>
                                <button type="button" style={{ ...buttonStyle, padding: "0.3rem 0.8rem" }} onClick={() => setEditingId(null)}>
                                Cancel
                                </button>
                                </div>
                                </div>
                            ) : (
                                <div
                                onClick={canEdit ? () => { setEditingId(actionKey); setFields({ actionText: action.rawInput || action.text || buildActionDisplayText(action) }); } : undefined}
                                title={canEdit ? "Click to edit this action" : undefined}
                                style={{ cursor: canEdit ? "pointer" : "default" }}
                                >
                                {action.title && action.title !== buildActionDisplayText(action) && (
                                    <div style={{ fontSize: "0.76rem", fontWeight: 700 }}>{action.title}</div>
                                )}
                                <div style={{ color: "rgba(255,255,255,0.72)", fontSize: "0.73rem", lineHeight: 1.45, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                                {buildActionDisplayText(action)}
                                </div>
                                </div>
                            )}
                            </div>
                        );
                    })}
                    {/* Generated events — PURPLE, editable. */}
                    {shownEvents.length > 0 && (
                        <div style={{ color: "rgba(196,181,253,0.95)", fontSize: "0.66rem", fontWeight: 800, letterSpacing: "0.05em", margin: "0.3rem 0 0.25rem", textTransform: "uppercase" }}>
                        Events ({shownEvents.length})
                        </div>
                    )}
                    {shownActions.length === 0 && shownEvents.length === 0 && (
                        <div style={{ color: "rgba(255,255,255,0.35)", fontSize: "0.72rem", fontStyle: "italic" }}>Nothing recorded this round.</div>
                    )}
                    {shownEvents.map(eventCard)}
                    </div>
                );
            })}
            </div>
            {statusLine}
            </div>
            </>
        );
    }

    return null;
};

export { CheatsPanel };

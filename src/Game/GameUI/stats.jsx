/*! Open Historia — national stats pane © 2026 Nicholas Krol, MIT (see src/Editor/LICENSE). */
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getNationFlags, getNationTags } from "../../runtime/assets.js";
import { isPolityLandless, readGameData, readWorldState } from "../../runtime/gameState.js";
import { PERSONALITY_AXES, resolveCountryPersonality } from "../../runtime/countryPersonality.js";
import { resolveCountryTags } from "../../runtime/countryTags.js";
import { useLibraryState } from "../../runtime/library.js";
import { ensurePolityNames, polityDisplayName, useCountryDisplayName } from "../../runtime/polityNames.js";
import { flagImageUrlFromGid } from "../../runtime/countryFlags.js";
import COUNTRY_NAMES from "../../runtime/generated/countryNames.js";
import { setRegionClickObserver } from "../Selection/Regions.jsx";
import { generateCountryStatSheet } from "../AI/gameplay.js";
import { validateGameplayPayload } from "../AI/gameplaySchemas.js";
import { findStatSheetProblems, stripUnusableStatFields } from "../AI/statSheetSanity.js";
import { isRoleSentinel, mergeStatSheet, rescueLegacySheet, SHEET_FORMAT, sheetDescribesNow, stripMoneyConversions } from "../../runtime/countryStatLedger.js";
import { CHARACTER_PROFILE_HIDDEN_NOTE, revealsCharacterProfile } from "../../runtime/difficulty.js";

// Sheets are regenerated when the game date moves; within a date they persist
// across reloads so flipping between countries stays instant.
const STORAGE_KEY = "oh-stat-sheets";
const MAX_STORED_SHEETS = 60;
const memoryCache = new Map();
const normalizeString = (value) => String(value ?? "").trim();
const isValidStatSheet = (value) => validateGameplayPayload("countryStatSheet", value).valid;

// TWO STORES, AND THEY USED TO BE ONE.
//
// world.countryStats is the generated BASE, date-stamped (__asOf) so it refreshes
// when the calendar moves. world.countryStatChanges is what the campaign actually
// moved, and it always wins over the base — a generated sheet describes the
// country as history left it, not as this campaign made it.
//
// They were one slot until round 29 of the field campaign, and the result was
// that neither worked. The generator persisted its whole output into the slot,
// the loader below saw a complete valid sheet and returned it without
// regenerating, and so the sheet the player read at round 29 was the one
// generated at round 2: GDP unchanged for 27 rounds, energyAutonomy never
// changed once while the player built four energy facilities.

const readStoredSheets = () => {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY)) ?? {};
    } catch {
        return {};
    }
};

const storeSheet = (key, entry) => {
    try {
        const all = readStoredSheets();
        all[key] = entry;
        const keys = Object.keys(all);
        if (keys.length > MAX_STORED_SHEETS) {
            for (const stale of keys.slice(0, keys.length - MAX_STORED_SHEETS)) delete all[stale];
        }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
    } catch {
        // Quota errors just mean no persistence — the memory cache still works.
    }
};

const clamp01 = (value) => Math.max(0, Math.min(100, Math.round(Number(value) || 0)));

const INDEX_ROWS = [
    { key: "sovereignty", label: "Sovereignty", icon: "⚑", color: "#8b5cf6" },
    { key: "foodAutonomy", label: "Food autonomy", icon: "🌾", color: "#22c55e" },
    { key: "energyAutonomy", label: "Energy autonomy", icon: "⚡", color: "#eab308" },
    { key: "economicIndependence", label: "Economic independence", icon: "🏦", color: "#06b6d4" },
    { key: "internalSecurity", label: "Internal security", icon: "🛡", color: "#f43f5e" },
    { key: "internationalReputation", label: "International reputation", icon: "🤝", color: "#3b82f6" },
];

const sectionTitleStyle = {
    color: "rgba(255,255,255,0.45)",
    fontSize: "0.68rem",
    fontWeight: 700,
    letterSpacing: "0.08em",
    margin: "1.1rem 0 0.6rem",
    textTransform: "uppercase",
};

const cardStyle = {
    backgroundColor: "rgba(255,255,255,0.045)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "10px",
    padding: "0.6rem 0.7rem",
};

const Bar = ({ value, color }) => (
    <div style={{ backgroundColor: "rgba(255,255,255,0.1)", borderRadius: "999px", height: "6px", overflow: "hidden" }}>
    <div style={{ backgroundColor: color, borderRadius: "999px", height: "100%", width: `${clamp01(value)}%`, transition: "width 0.4s" }} />
    </div>
);

// The AI writes economic figures however it likes — "30000000000",
// "$30,000,000,000", "2.1%", "1.2 trillion caps". Raw long numbers overflow
// the card, so purely numeric values from a million up render compactly
// (30000000000 → 30.0B) with any currency prefix preserved; everything else
// (percentages, prose) passes through untouched.
const compactEconomyValue = (value) => {
    if (value === null || value === undefined) return value;
    const text = String(value).trim();
    const match = /^([^0-9-]{0,4})(-?\d[\d,]*)(?:\.(\d+))?$/.exec(text);
    if (!match) return value;
    const number = Number(`${match[2].replace(/,/g, "")}${match[3] ? `.${match[3]}` : ""}`);
    if (!Number.isFinite(number) || Math.abs(number) < 1e6) return value;
    const prefix = match[1] ?? "";
    const abs = Math.abs(number);
    const [divisor, suffix] = abs >= 1e12 ? [1e12, "T"] : abs >= 1e9 ? [1e9, "B"] : [1e6, "M"];
    const compact = (number / divisor).toFixed(abs / divisor >= 100 ? 0 : 1);
    return `${prefix}${compact}${suffix}`;
};

const EconomyCard = ({ label, value, sub, tone }) => (
    <div style={cardStyle}>
    <div style={{ color: "rgba(255,255,255,0.45)", fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.06em", marginBottom: "0.3rem", textTransform: "uppercase" }}>
    {label}
    </div>
    <div data-no-translate style={{ color: tone, fontSize: "1.05rem", fontWeight: 800 }}>{compactEconomyValue(value) || "—"}</div>
    {sub && <div style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.68rem", marginTop: "0.15rem" }}>{sub}</div>}
    </div>
);

const stabilityColor = (value) => (value < 40 ? "#ef4444" : value < 70 ? "#f59e0b" : "#22c55e");

const StatsPane = ({ active }) => {
    const { activeGameId } = useLibraryState();
    const [player, setPlayer] = useState({ code: "", date: "", gameKey: "game", showCharacter: true });
    const [targetCountry, setTargetCountry] = useState("");
    const [polity, setPolity] = useState(null); // world.polityOverrides[target]
    const [state, setState] = useState({ status: "idle", sheet: null, error: "" });
    const [flagFailed, setFlagFailed] = useState(false);
    // Is the PLAYER stateless (holds no territory)? A landless player's code may
    // still resolve to a real country, but they are not it — so their own row
    // must show the neutral initials, never that country's flag.
    const [playerLandless, setPlayerLandless] = useState(false);
    const [personality, setPersonality] = useState(null);
    // Author-set flags from the scenario (flags.json). Memoized in assets.js, so
    // this is one fetch per scenario; {} for every scenario that sets none.
    const [customFlags, setCustomFlags] = useState({});
    const displayName = useCountryDisplayName(targetCountry);
    // The LIVE target, for async guards. Every setState guard in loadSheet used
    // to compare the closure's own captured targetCountry against a code taken
    // from the same closure — always equal, so a slow in-flight load for the
    // PREVIOUS country overwrote the pane after the player had moved on.
    const targetRef = useRef(targetCountry);
    targetRef.current = targetCountry;

    // Which game and which date are we in? Also seeds the target: your country.
    useEffect(() => {
        let cancelled = false;
        getNationFlags()
            .then((flags) => { if (!cancelled) setCustomFlags(flags || {}); })
            .catch(() => {});
        return () => { cancelled = true; };
    }, [activeGameId]);

    useEffect(() => {
        if (!active) return undefined;
        let cancelled = false;
        const refreshPlayer = async () => {
            try {
                const game = await readGameData({ force: true });
                if (cancelled) return;
                const code = String(game?.country || "").trim();
                const nextPlayer = {
                    code,
                    // The difficulty decides whether character profiles are
                    // readable at all (see revealsCharacterProfile) — and it can
                    // be changed mid-campaign, so it is re-read on the same poll
                    // as the date rather than captured once.
                    showCharacter: revealsCharacterProfile(game?.difficulty),
                    date: String(game?.gameDate || game?.startDate || ""),
                    // The game's own identity, NOT its runtime URL. JSON_URLS.game
                    // carries a ?v= cache-busting token that is regenerated
                    // whenever the runtime is re-tokenized, so keying on it gave
                    // every reload a brand-new cache namespace: the sheet was
                    // regenerated from scratch, and since each generation is an
                    // independent guess, the same country's leader and GDP kept
                    // changing under the player. It also never matched the key
                    // gameplay.js reads reputation back from (`game.id || name`),
                    // so that lookup found nothing, always.
                    gameKey: String(game?.id || game?.name || "game"),
                };
                if (player.gameKey !== nextPlayer.gameKey) {
                    setTargetCountry(code);
                    setState({ status: "idle", sheet: null, error: "" });
                } else {
                    setTargetCountry((target) => target || code);
                }
                setPlayer((current) =>
                    current.code === nextPlayer.code &&
                    current.date === nextPlayer.date &&
                    current.gameKey === nextPlayer.gameKey &&
                    current.showCharacter === nextPlayer.showCharacter
                        ? current
                        : nextPlayer);
            } catch {
                // Without game data the pane just shows its empty state.
            }
        };
        refreshPlayer();
        const intervalId = window.setInterval(refreshPlayer, 5000);
        return () => {
            cancelled = true;
            window.clearInterval(intervalId);
        };
    }, [active, activeGameId, player.gameKey]);

    // While the pane is showing, clicking any country on the map inspects it.
    useEffect(() => {
        if (!active) return undefined;
        setRegionClickObserver((props) => {
            // One namespace: the owning country's NAME. The gid0/GID_0 tail is the
            // region's GADM provenance — a code — so falling through to it used to
            // hand this pane "RUS" for an unowned region while every owned one gave
            // a name. The sheet is keyed by country, and the two never matched.
            const gid0 = String(props?.gid0 || props?.GID_0 || "").trim();
            const country = String(props?.owner || "").trim() || COUNTRY_NAMES[gid0] || gid0;
            if (country) setTargetCountry(country);
        });
        return () => setRegionClickObserver(null);
    }, [active]);

    const loadSheet = useCallback(async ({ force = false } = {}) => {
        const code = targetCountry;
        if (!code) return;
        const cacheKey = `${player.gameKey}:${code}`;
        // The AI's partial stat changes, kept aside so they can be layered over
        // whichever full sheet we end up with (cached or freshly generated).
        let aiOverride = null;
        if (!force) {
            // What the campaign moved wins over whatever base we end up with.
            try {
                const world = await readWorldState({ force: false });
                // Anything unreadable in the SAVED sheet is dropped before it can
                // be shown. This pane displayed GDP as ")}}'*, {" for a whole
                // campaign because the persisted sheet went straight to the screen
                // without passing the checks a freshly generated one does — the
                // wreckage was written once and then re-read forever.
                aiOverride = stripUnusableStatFields(world?.countryStatChanges?.[code]) || null;
                // THE ONE-TIME RESCUE. A save from before the two stores were split
                // has the round-2 base sitting in the delta slot with 28 rounds of
                // event-written changes mixed into it, and nothing can separate them
                // by inspection. What CAN be established is which fields events ever
                // actually wrote — measured over the whole campaign, exactly these
                // four. They carry over; everything the events never touched goes
                // back to being regenerated, which is what it always was.
                if (!aiOverride && !world?.countryStats?.[code]?.__asOf) {
                    aiOverride = rescueLegacySheet(stripUnusableStatFields(world.countryStats?.[code]));
                }
                // The stamps are bookkeeping, not fields on the sheet — and the
                // sheet schema is additionalProperties:false, so they have to
                // come off before anything validates what is left.
                const { __asOf: asOf, __format: format, ...rest } = world?.countryStats?.[code] ?? {};
                const persisted = stripUnusableStatFields(rest);
                // Within the freshness window, not equal-to-today: see
                // sheetDescribesNow — exact-match staled every sheet every turn
                // and regenerated the base per country per turn, letting the
                // model rewrite campaign facts each time.
                // Also gated on the FORMAT stamp (a pre-titled-leadership base
                // regenerates once to pick its titles up) and on the leader not
                // being a sentinel — the contamination heal writes "(미확인)"
                // expecting the next regeneration to answer, so a sentinel
                // must never count as a servable base.
                const describesNow = sheetDescribesNow(asOf, player.date);
                if (describesNow && format === SHEET_FORMAT && persisted && !isRoleSentinel(persisted.leader)
                    && isValidStatSheet(persisted) && findStatSheetProblems(persisted).length === 0) {
                    const sheet = mergeStatSheet(persisted, aiOverride);
                    memoryCache.set(cacheKey, { date: player.date, format: SHEET_FORMAT, sheet });
                    if (targetRef.current !== code) return;
                    setState({ status: "ready", sheet, error: "" });
                    return;
                }
            } catch { /* fall through to the device cache / regenerate */ }
            // Device cache, gated on the DATE it was written for. It used to be
            // ungated, which alongside the world-state short-circuit above meant a
            // sheet generated once was shown for the rest of the campaign. Within
            // one date it still answers instantly, which is what it is for —
            // flipping between countries must not cost a model call each time.
            //
            // ALSO gated on the SAVE still knowing this country at all. Every
            // generation stores its base server-side, so a country present in
            // this cache but absent from world.countryStats means the base was
            // deliberately wiped (the round-2 heal: all ten bases cleared to
            // regenerate under new format rules) — and the wipe reached the
            // save while this browser copy lived on, serving the old sheets
            // ("통계가 아직 안 고쳐진거같아"). An orphaned entry is dropped,
            // not served.
            const worldNow = await readWorldState({ force: false }).catch(() => null);
            const baseKnown = Boolean(worldNow?.countryStats?.[code]);
            const cached = memoryCache.get(cacheKey) ?? readStoredSheets()[cacheKey];
            // Entries written before the titled-leadership format carry no
            // `format` field and regenerate; a sentinel leader regenerates for
            // the same reason as at the world-state gate above.
            const cachedIsCurrent = cached && baseKnown && cached.format === SHEET_FORMAT
                && !isRoleSentinel(cached.sheet?.leader) && sheetDescribesNow(cached.date, player.date);
            if (cached && !baseKnown) {
                memoryCache.delete(cacheKey);
                console.info(`[stats] the save no longer holds a base sheet for ${code} — dropping the cached copy and regenerating.`);
            }
            if (cachedIsCurrent && isValidStatSheet(cached.sheet) && findStatSheetProblems(cached.sheet).length === 0) {
                const sheet = mergeStatSheet(cached.sheet, aiOverride);
                memoryCache.set(cacheKey, { date: player.date, format: SHEET_FORMAT, sheet });
                if (targetRef.current !== code) return;
                setState({ status: "ready", sheet, error: "" });
                return;
            }
        }
        if (targetRef.current !== code) return;
        setState({ status: "loading", sheet: null, error: "" });
        try {
            // The name handed to the AI is resolved HERE, for THIS code — never
            // from the displayName hook. That state updates one render behind
            // the target: on the render where a map click moves the pane from
            // South Korea to Ethiopia, this callback fires with the new code
            // while the hook still holds the old name, and the model was told
            // "Compile the sheet for South Korea (code Ethiopia)" — a prompt at
            // war with its own dossier (live, this round, twice).
            await ensurePolityNames();
            const name = polityDisplayName(code);
            const generated = await generateCountryStatSheet({ code, name: name || code });
            const validation = validateGameplayPayload("countryStatSheet", generated);
            if (!validation.valid) throw new Error(`The stat sheet failed validation: ${validation.error}`);
            // A sheet generated now describes the country as it was BEFORE this game's
            // events, so the AI's recorded changes still have to win over it.
            const sheet = mergeStatSheet(generated, aiOverride);
            const entry = { date: player.date, format: SHEET_FORMAT, sheet };
            memoryCache.set(cacheKey, entry);
            storeSheet(cacheKey, entry);
            setState((current) =>
                targetRef.current === code ? { status: "ready", sheet, error: "" } : current);
        } catch (error) {
            // A LAST YEAR'S SHEET BEATS AN ERROR MESSAGE. Now that the base is
            // date-gated, a failed regeneration would otherwise leave the pane
            // blank where it used to show something — so fall back to the stale
            // sheet, with the campaign's changes still layered over it.
            // Sheets from before headOfState/deputy became required lack both
            // fields and would fail the schema here — for the FALLBACK only,
            // patch honest unknowns in rather than refusing the whole sheet.
            const stale = memoryCache.get(cacheKey) ?? readStoredSheets()[cacheKey];
            if (stale?.sheet) {
                stale.sheet = { headOfState: "(미확인)", deputy: "(미확인)", ...stale.sheet };
            }
            if (stale?.sheet && isValidStatSheet(stale.sheet)) {
                const sheet = mergeStatSheet(stale.sheet, aiOverride);
                setState((current) => (targetRef.current === code ? { status: "ready", sheet, error: "" } : current));
                console.warn(`[stats] could not refresh ${code}'s sheet for ${player.date}; showing the one from ${stale.date || "an earlier date"}.`, error);
                return;
            }
            setState((current) =>
                targetRef.current === code
                    ? { status: "error", sheet: null, error: error?.message || "The stat sheet failed." }
                    : current);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [targetCountry, player.gameKey, player.date]);

    useEffect(() => {
        if (!active || !targetCountry) return;
        setFlagFailed(false);
        loadSheet();
        readWorldState({ force: false })
            .then(async (world) => {
                setPolity(world?.polityOverrides?.[targetCountry] ?? null);
                setPlayerLandless(isPolityLandless(world, player.code));
                // The standing character profile, shown here as well as in the
                // country info panel. It belongs on BOTH: this pane is the one a
                // player opens to ask "what is this country like", and a profile
                // that decides how the country answers a provocation is a
                // statistic in exactly the sense the rest of this pane is.
                try {
                    const baseTags = await getNationTags().catch(() => ({}));
                    setPersonality(resolveCountryPersonality(world, targetCountry, {
                        tags: resolveCountryTags(baseTags, world, targetCountry),
                    }));
                } catch {
                    setPersonality(null);
                }
            })
            .catch(() => { setPolity(null); setPlayerLandless(false); setPersonality(null); });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [active, targetCountry, player.date]);

    const sheet = state.sheet;
    const isPlayer = targetCountry && targetCountry.toUpperCase() === String(player.code).toUpperCase();
    // An author-set flag (scenario flags.json) wins over the code-derived one, so a
    // custom era polity shows the flag its map-maker drew instead of initials.
    // But a landless PLAYER never borrows the code-derived country flag (a
    // stateless actor is not the country its code resolves to) — their own row
    // falls through to the neutral initials unless they set a flag of their own.
    const suppressDerivedFlag = isPlayer && playerLandless;
    const flagUrl = customFlags[targetCountry] || polity?.flag || (suppressDerivedFlag ? "" : flagImageUrlFromGid(targetCountry));
    const initials = String(targetCountry).replace(/[^A-Za-z]/g, "").slice(0, 2).toUpperCase() || "??";

    const breakdown = useMemo(() => {
        const raw = sheet?.gdpBreakdown ?? {};
        const parts = [
            { key: "agriculture", label: "Agriculture", color: "#22c55e", value: clamp01(raw.agriculture) },
            { key: "industry", label: "Industry", color: "#3b82f6", value: clamp01(raw.industry) },
            { key: "services", label: "Services", color: "#8b5cf6", value: clamp01(raw.services) },
        ];
        const total = parts.reduce((sum, part) => sum + part.value, 0) || 1;
        return parts.map((part) => ({ ...part, share: (part.value / total) * 100 }));
    }, [sheet]);

    const budgetNegative = String(sheet?.economy?.budgetBalance ?? "").trim().startsWith("-");

    return (
        <div style={{ display: "flex", flex: 1, flexDirection: "column", minHeight: 0 }}>
        <div style={{ flex: 1, overflowY: "auto", padding: "0.9rem 1rem 1.25rem", scrollbarWidth: "none" }}>

        {!targetCountry && (
            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.85rem" }}>
            No active game. Start one to see national statistics.
            </p>
        )}

        {targetCountry && (
            <>
            {/* Country header */}
            <div style={{ alignItems: "flex-start", display: "flex", gap: "0.7rem" }}>
            <div style={{ alignItems: "center", backgroundColor: "rgba(59,130,246,0.16)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "10px", color: "#93c5fd", display: "flex", flexShrink: 0, fontSize: "0.95rem", fontWeight: 800, height: "2.6rem", justifyContent: "center", overflow: "hidden", width: "2.6rem" }}>
            {flagUrl && !flagFailed ? (
                <img
                alt=""
                src={flagUrl}
                onError={() => setFlagFailed(true)}
                style={{ height: "100%", objectFit: "cover", width: "100%" }}
                />
            ) : initials}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ alignItems: "center", display: "flex", gap: "0.5rem" }}>
            <span style={{ fontSize: "1.05rem", fontWeight: 800, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {displayName || targetCountry}
            </span>
            {isPlayer && (
                <span style={{ backgroundColor: "rgba(245,158,11,0.18)", border: "1px solid rgba(245,158,11,0.5)", borderRadius: "999px", color: "#fbbf24", flexShrink: 0, fontSize: "0.62rem", fontWeight: 700, padding: "0.14rem 0.5rem" }}>
                Your country
                </span>
            )}
            </div>
            {sheet && (
                <>
                <div style={{ color: "rgba(255,255,255,0.7)", fontSize: "0.76rem", marginTop: "0.15rem" }}>
                {[sheet.capital, sheet.continent].filter(Boolean).join(" · ")}
                </div>
                {sheet.government && (
                    <div style={{ color: "rgba(255,255,255,0.45)", fontSize: "0.72rem", marginTop: "0.1rem" }}>
                    {sheet.government}
                    </div>
                )}
                {/* Leadership values carry their own official title now
                    ("대통령 블라디미르 푸틴", "국왕 하랄 5세") — the sheet prompt
                    and the shift pass both demand it — so the generic
                    "Leader:"/"Deputy:" prefixes (which the language pack
                    rendered as 지도자/대리인) would only restate the office
                    worse. The row IS the value. */}
                {sheet.leader && !isRoleSentinel(sheet.leader) && (
                    <div style={{ color: "#fbbf24", fontSize: "0.72rem", marginTop: "0.1rem" }}>
                    {sheet.leader}
                    </div>
                )}
                {/* The rest of the leadership picture, where the system has
                    one: the ceremonial head of state above (monarchs,
                    figurehead presidents), the second-in-command below. The
                    fields are always ON the sheet now (required, so the model
                    actually fills them) — "(없음)" / "(미확인)" mean no such
                    office / holder unknown, and render as no row at all. */}
                {sheet.headOfState && !isRoleSentinel(sheet.headOfState) && (
                    <div style={{ color: "rgba(251,191,36,0.66)", fontSize: "0.7rem", marginTop: "0.1rem" }}>
                    {sheet.headOfState}
                    </div>
                )}
                {sheet.deputy && !isRoleSentinel(sheet.deputy) && (
                    <div style={{ color: "rgba(251,191,36,0.66)", fontSize: "0.7rem", marginTop: "0.1rem" }}>
                    {sheet.deputy}
                    </div>
                )}
                </>
            )}
            </div>
            {state.status !== "loading" && (
                <button
                onClick={() => loadSheet({ force: true })}
                title="Regenerate this stat sheet"
                style={{ background: "none", border: "none", color: "rgba(255,255,255,0.4)", cursor: "pointer", fontSize: "1rem", padding: 0 }}
                >↻</button>
            )}
            </div>

            {state.status === "loading" && (
                <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.82rem", marginTop: "1rem" }}>
                Compiling the stat sheet…
                </p>
            )}

            {state.status === "error" && (
                <div style={{ backgroundColor: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "10px", fontSize: "0.8rem", marginTop: "1rem", padding: "0.7rem 0.8rem" }}>
                {state.error}
                <button
                onClick={() => loadSheet({ force: true })}
                style={{ background: "none", border: "none", color: "#93c5fd", cursor: "pointer", display: "block", fontSize: "0.8rem", fontWeight: 700, marginTop: "0.4rem", padding: 0 }}
                >Try again</button>
                </div>
            )}

            {sheet && state.status === "ready" && (
                <>
                {/* National stability */}
                <div style={{ ...cardStyle, marginTop: "1rem" }}>
                <div style={{ alignItems: "center", display: "flex", justifyContent: "space-between", marginBottom: "0.45rem" }}>
                <span style={{ color: "rgba(255,255,255,0.55)", fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                ⚠ National stability
                </span>
                <span data-no-translate style={{ fontSize: "0.85rem", fontWeight: 800 }}>
                {clamp01(sheet.stability)}/100
                </span>
                </div>
                <Bar value={sheet.stability} color={stabilityColor(clamp01(sheet.stability))} />
                </div>

                {/* Strategic indices */}
                <div style={sectionTitleStyle}>⚑ Strategic indices</div>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.55rem" }}>
                {INDEX_ROWS.map((row) => {
                    const value = clamp01(sheet.indices?.[row.key]);
                    return (
                        <div key={row.key} style={cardStyle}>
                        <div style={{ alignItems: "center", display: "flex", justifyContent: "space-between", marginBottom: "0.4rem" }}>
                        <span style={{ color: "rgba(255,255,255,0.8)", fontSize: "0.76rem" }}>
                        {row.icon} {row.label}
                        </span>
                        <span data-no-translate style={{ fontSize: "0.78rem", fontWeight: 800 }}>{value}%</span>
                        </div>
                        <Bar value={value} color={row.color} />
                        </div>
                    );
                })}
                </div>

                {/* Standing character — the five behavioural axes the simulation
                    actually reads when deciding what this country does about an
                    event. Always present: a country with no stored profile has one
                    derived from its tags and standing. */}
                {personality && !player.showCharacter && (
                    <div style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.74rem", marginTop: "0.9rem" }}>
                    🧭 {CHARACTER_PROFILE_HIDDEN_NOTE}
                    </div>
                )}

                {personality && player.showCharacter && (
                    <>
                    <div style={sectionTitleStyle} title="How this country acts — the AI reads these when deciding what it does about an event">
                    🧭 Character
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.55rem" }}>
                    {PERSONALITY_AXES.map((axis) => {
                        const value = clamp01(personality[axis.key]);
                        return (
                            <div key={axis.key} style={cardStyle} title={`0 — ${axis.low} · 100 — ${axis.high}`}>
                            <div style={{ alignItems: "center", display: "flex", justifyContent: "space-between", marginBottom: "0.4rem" }}>
                            <span style={{ color: "rgba(255,255,255,0.8)", fontSize: "0.76rem" }}>{axis.label}</span>
                            <span data-no-translate style={{ fontSize: "0.78rem", fontWeight: 800 }}>{value}</span>
                            </div>
                            <Bar
                            value={value}
                            color={value >= 66 ? "#f87171" : value >= 34 ? "#e2c878" : "#7ee7a6"}
                            />
                            </div>
                        );
                    })}
                    </div>
                    </>
                )}

                {/* Economy. GDP figures stand in the era's benchmark currency
                    (dollars) alone — both conversion designs failed at the
                    model end (wrong multiplication, then wrong rates), so the
                    conversion system is retired and the scrubber strips any
                    parenthetical a sheet still carries. */}
                <div style={sectionTitleStyle}>📈 Economy</div>
                <div style={{ display: "grid", gap: "0.55rem", gridTemplateColumns: "1fr 1fr" }}>
                <EconomyCard label="GDP" value={stripMoneyConversions(sheet.economy?.gdp)} sub={sheet.economy?.gdpGrowth} tone="#34d399" />
                <EconomyCard label="GDP/capita" value={stripMoneyConversions(sheet.economy?.gdpPerCapita)} sub={sheet.economy?.currency} tone="#e5e7eb" />
                <EconomyCard label="Inflation" value={sheet.economy?.inflation} tone="#34d399" />
                <EconomyCard label="Unemployment" value={sheet.economy?.unemployment} tone="#34d399" />
                <EconomyCard label="Public debt" value={sheet.economy?.publicDebt} tone="#34d399" />
                <EconomyCard
                label="Budget balance"
                value={sheet.economy?.budgetBalance}
                sub={budgetNegative ? "Deficit" : "Surplus"}
                tone={budgetNegative ? "#f87171" : "#34d399"}
                />
                </div>

                {/* GDP breakdown */}
                <div style={{ ...cardStyle, marginTop: "0.9rem" }}>
                <div style={{ color: "rgba(255,255,255,0.7)", fontSize: "0.74rem", marginBottom: "0.5rem" }}>
                GDP breakdown
                </div>
                <div style={{ borderRadius: "999px", display: "flex", height: "10px", overflow: "hidden" }}>
                {breakdown.map((part) => (
                    <div key={part.key} style={{ backgroundColor: part.color, width: `${part.share}%` }} />
                ))}
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.3rem 0.8rem", marginTop: "0.5rem" }}>
                {breakdown.map((part) => (
                    <span key={part.key} style={{ alignItems: "center", color: "rgba(255,255,255,0.6)", display: "flex", fontSize: "0.68rem", gap: "0.3rem" }}>
                    <span style={{ backgroundColor: part.color, borderRadius: "2px", height: "7px", width: "7px" }} />
                    {part.label} <span data-no-translate>{part.value}%</span>
                    </span>
                ))}
                </div>
                </div>
                </>
            )}

            <p style={{ color: "rgba(255,255,255,0.35)", fontSize: "0.7rem", marginTop: "1rem" }}>
            Click any country on the map to inspect it.
            </p>
            </>
        )}
        </div>
        </div>
    );
};

export default StatsPane;

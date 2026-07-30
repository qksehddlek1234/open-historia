/*! Open Historia — region info panel. */
import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import ReactMarkdown from "react-markdown";
import { readEventsState, readWorldState } from "../../runtime/gameState.js";
import { generateRegionBrief } from "../AI/gameplay.js";
import { openCountryPanel } from "./CountryPanel.jsx";
import { useDragWindow } from "../GameUI/useDragWindow.js";

// Bridge: the region popup's second ⓘ button (the REGION row) opens this panel
// from outside React — it used to do nothing at all, which read as "region
// info doesn't open". Mirrors the CountryPanel bridge.
let _openPanel = null;

export const openRegionPanel = (region) => {
    _openPanel?.(region);
};

const surface = {
    backgroundColor: "rgba(17, 24, 39, 0.97)",
    backdropFilter: "blur(8px)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "16px",
    boxShadow: "-4px 0 24px rgba(0,0,0,0.45)",
    color: "white",
    fontFamily: "sans-serif",
};

const pillStyle = {
    border: "1px solid rgba(255,255,255,0.35)",
    borderRadius: "999px",
    color: "rgba(255,255,255,0.92)",
    display: "inline-block",
    fontSize: "0.74rem",
    fontWeight: 600,
    padding: "0.22rem 0.6rem",
};

// Does this event involve the region? Transfers are checked by id, prose by name.
const eventInvolvesRegion = (event, regionId, regionName) => {
    const transfers = event?.impacts?.regionTransfers ?? [];
    if (regionId && transfers.some((transfer) => String(transfer?.regionId) === String(regionId))) return true;
    const haystack = `${event?.title ?? ""} ${event?.description ?? ""}`.toLowerCase();
    return Boolean(regionName) && haystack.includes(String(regionName).toLowerCase());
};

const RegionInfoPanel = () => {
    const [region, setRegion] = useState(null); // { id, name, ownerCode, ownerName, unclaimed }
    const [events, setEvents] = useState([]);
    const [claimants, setClaimants] = useState([]);
    const [search, setSearch] = useState("");
    const [report, setReport] = useState(null); // null | "loading" | text | {error}
    const drag = useDragWindow();

    _openPanel = (next) => {
        setRegion(next);
        setSearch("");
        setReport(null);
    };

    useEffect(() => {
        if (!region) return undefined;
        let cancelled = false;

        (async () => {
            try {
                const [allEvents, world] = await Promise.all([
                    readEventsState({ force: true }).catch(() => []),
                    readWorldState({ force: true }).catch(() => ({})),
                ]);
                if (cancelled) return;
                setEvents((allEvents ?? []).filter((event) => eventInvolvesRegion(event, region.id, region.name)));
                setClaimants(world?.regionClaimants?.[region.id] ?? []);
            } catch {
                if (!cancelled) {
                    setEvents([]);
                    setClaimants([]);
                }
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [region]);

    const filteredEvents = useMemo(() => {
        const query = search.trim().toLowerCase();
        if (!query) return events;
        return events.filter((event) => `${event.title} ${event.description}`.toLowerCase().includes(query));
    }, [events, search]);

    if (!region) return null;

    // The region-level advisor report — the original's per-province briefing.
    const runAdvisorReport = async () => {
        if (report === "loading") return;
        setReport("loading");
        try {
            const text = await generateRegionBrief({
                id: region.id,
                name: region.name,
                ownerName: region.unclaimed ? "" : (region.ownerName || region.ownerCode || ""),
            });
            setReport(text || "No information available.");
        } catch (error) {
            setReport({ error: error?.message || "Couldn't generate a report. Set an AI provider + key in Settings." });
        }
    };

    return createPortal(
        <div
        style={{
            ...surface,
            display: "flex",
            flexDirection: "column",
            maxHeight: "calc(100vh - 5.75rem)",
            overflow: "hidden",
            position: "fixed",
            right: "0.5rem",
            top: "4.75rem",
            transform: drag.transform,
            width: "min(24rem, calc(100vw - 1rem))",
            zIndex: 10042,
        }}
        >
        {/* Header (drag handle) */}
        <div
        onPointerDown={drag.onPointerDown}
        style={{ alignItems: "center", cursor: "grab", display: "flex", gap: "0.6rem", padding: "1rem 1.1rem 0.8rem", touchAction: "none", userSelect: "none" }}
        >
        <span style={{ fontSize: "1.1rem" }}>🗺️</span>
        <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: "1.05rem", fontWeight: 800, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {region.name || region.id}
        </div>
        <div style={{ color: "rgba(255,255,255,0.55)", fontSize: "0.76rem" }}>
        {region.unclaimed ? "Unclaimed territory" : `Part of ${region.ownerName || region.ownerCode || "?"}`}
        </div>
        </div>
        <button
        type="button"
        onClick={() => setRegion(null)}
        style={{ background: "none", border: "none", color: "rgba(255,255,255,0.6)", cursor: "pointer", fontSize: "1.15rem", lineHeight: 1, padding: "0.2rem" }}
        >
        {"✕"}
        </button>
        </div>

        {/* Body */}
        <div style={{ display: "flex", flex: 1, flexDirection: "column", gap: "0.4rem", minHeight: 0, overflowY: "auto", padding: "0 1.1rem 1rem", scrollbarWidth: "thin" }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.3rem" }}>
        {region.id && (
            <span style={{ ...pillStyle, opacity: 0.75 }} title="Region id">
            {region.id}
            </span>
        )}
        {claimants.map((claimant) => (
            <span
            key={claimant}
            style={{ ...pillStyle, background: "rgba(245,158,11,0.18)", borderColor: "rgba(245,158,11,0.5)" }}
            title="This polity claims the region"
            >
            claimed by {claimant}
            </span>
        ))}
        </div>

        <div style={{ alignItems: "baseline", display: "flex", justifyContent: "space-between", marginTop: "0.4rem" }}>
        <div style={{ fontSize: "0.95rem", fontWeight: 800 }}>Related Events</div>
        <div style={{ color: "rgba(255,255,255,0.45)", fontSize: "0.75rem" }}>{filteredEvents.length} shown</div>
        </div>
        <input
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder="Search events..."
        style={{ background: "rgba(0,0,0,0.28)", border: "1px solid rgba(255,255,255,0.14)", borderRadius: 8, color: "white", fontSize: "0.82rem", outline: "none", padding: "0.55rem 0.7rem" }}
        />

        {filteredEvents.length === 0 ? (
            <div style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.8rem", padding: "0.3rem 0 0.4rem" }}>
            No recorded events mention this region yet.
            </div>
        ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.45rem", padding: "0.2rem 0 0.4rem" }}>
            {filteredEvents.slice(0, 30).map((event) => (
                <div key={event.id} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: "0.55rem 0.7rem" }}>
                <div style={{ alignItems: "baseline", display: "flex", gap: "0.5rem", justifyContent: "space-between" }}>
                <span style={{ fontSize: "0.82rem", fontWeight: 700 }}>{event.title}</span>
                <span style={{ color: "rgba(255,255,255,0.4)", flexShrink: 0, fontSize: "0.68rem" }}>{event.date}</span>
                </div>
                {event.description && (
                    <div style={{ color: "rgba(255,255,255,0.62)", fontSize: "0.74rem", lineHeight: 1.5, marginTop: "0.2rem" }}>
                    {String(event.description).length > 220 ? `${String(event.description).slice(0, 220)}…` : event.description}
                    </div>
                )}
                </div>
            ))}
            </div>
        )}

        {report !== null && (
            <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, marginTop: "0.4rem", padding: "0.7rem 0.8rem" }}>
            <div style={{ fontSize: "0.85rem", fontWeight: 700, marginBottom: "0.3rem" }}>Advisor Report</div>
            {report === "loading" ? (
                <div style={{ color: "rgba(255,255,255,0.55)", fontSize: "0.78rem" }}>Preparing the report…</div>
            ) : report?.error ? (
                <div style={{ color: "#f87171", fontSize: "0.78rem" }}>{report.error}</div>
            ) : (
                <div className="timeline-markdown" style={{ color: "rgba(255,255,255,0.85)", fontSize: "0.79rem", lineHeight: 1.55 }}>
                <ReactMarkdown>{String(report)}</ReactMarkdown>
                </div>
            )}
            </div>
        )}
        </div>

        {/* Footer */}
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", display: "flex", gap: "0.6rem", padding: "0.8rem 1.1rem" }}>
        <button
        type="button"
        onClick={runAdvisorReport}
        style={{
            alignItems: "center",
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.16)",
            borderRadius: "999px",
            color: "white",
            cursor: "pointer",
            display: "flex",
            flex: 1,
            fontSize: "0.85rem",
            fontWeight: 700,
            justifyContent: "center",
            padding: "0.65rem 0.9rem",
        }}
        >
        Advisor Report
        </button>
        {!region.unclaimed && (region.ownerName || region.ownerCode) && (
            <button
            type="button"
            onClick={() => {
                const owner = { code: region.ownerCode, name: region.ownerName || region.ownerCode };
                setRegion(null);
                openCountryPanel({ code: owner.code, name: owner.name, flagUrl: region.ownerFlagUrl || null, flagEmoji: region.ownerFlagEmoji || null });
            }}
            style={{
                alignItems: "center",
                background: "rgba(124,58,237,0.3)",
                border: "1px solid rgba(168,85,247,0.65)",
                borderRadius: "999px",
                color: "white",
                cursor: "pointer",
                display: "flex",
                flex: 1,
                fontSize: "0.85rem",
                fontWeight: 700,
                justifyContent: "center",
                padding: "0.65rem 0.9rem",
            }}
            >
            Country info
            </button>
        )}
        </div>
        </div>,
        document.body,
    );
};

export default RegionInfoPanel;

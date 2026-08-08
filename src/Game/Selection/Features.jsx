/*! Open Historia — map feature (city/structure) selection UI © 2026 Nicholas Krol, MIT (see src/Editor/LICENSE). */
import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { emojiForFeatureKind, labelForFeatureKind } from "../../runtime/featureKinds.js";
import { findRelatedEvents } from "../../runtime/relatedEvents.js";
import { readEventsState } from "../../runtime/gameState.js";
import { useMap } from "react-map-gl/maplibre";
import { useWorldState } from "../Map/useWorldState.js";
import { useCountryDisplayName } from "../../runtime/polityNames.js";
import { readWorldState, writeWorldState } from "../../runtime/gameState.js";
import { generateRegionBrief } from "../AI/gameplay.js";

let _setSelection = null;
let _currentSelection = null;
let _dismiss = null;

// Called by the map click dispatcher (Nations.jsx) when a city or a built
// structure (world.markers) is clicked. The payload is everything the popup
// shows — cities are stateless tile features, so it all rides the click:
// { source: "city"|"marker", id?, name, kind?, population?, capital?, tier?, lng, lat }
export const onFeatureSelected = (payload) => {
  if (!_setSelection || !payload?.name) return;

  const isSame =
    _currentSelection &&
    _currentSelection.name === payload.name &&
    _currentSelection.source === payload.source;
  if (isSame) {
    _dismiss?.();
    return;
  }
  if (_currentSelection) _dismiss?.();
  _setSelection(payload);
};

// Called when another selection (unit, region, empty space) takes over.
export const dismissFeaturePopup = () => {
  if (_currentSelection) _dismiss?.();
};

// The popup emoji comes from the shared catalogue (runtime/featureKinds.js).
// It used to be a second list here that had drifted out of step with the one
// deciding kinds — "medical center" and "airfield" were inferable kinds with no
// emoji entry, so both drew the generic pin.
const emojiForKind = (kind) => emojiForFeatureKind(kind);

const TIER_LABEL = { 1: "Town", 2: "City", 3: "Major city", 4: "Capital" };

const ANIM_ID = "feature-popup-anims";
if (typeof document !== "undefined" && !document.getElementById(ANIM_ID)) {
  const style = document.createElement("style");
  style.id = ANIM_ID;
  style.textContent = `
  @keyframes featurePopupFadeIn {
    from { opacity: 0; transform: translateY(calc(-100% + 10px)); }
    to   { opacity: 1; transform: translateY(-100%); }
  }
  @keyframes featurePopupFadeOut {
    from { opacity: 1; transform: translateY(-100%); }
    to   { opacity: 0; transform: translateY(calc(-100% + 10px)); }
  }`;
  document.head.appendChild(style);
}

const DetailRow = ({ label, value }) => (
  <div style={{ display: "flex", justifyContent: "space-between", gap: "10px", fontSize: "11px", color: "rgba(255,255,255,0.6)", marginTop: "3px" }}>
    <span style={{ flexShrink: 0 }}>{label}</span>
    <span style={{ color: "rgba(255,255,255,0.9)", textAlign: "right", wordBreak: "break-word" }}>{value}</span>
  </div>
);

const FeaturePopup = () => {
  const [selection, setSelection] = useState(null);
  const [screenPos, setScreenPos] = useState(null);
  const [animKey, setAnimKey] = useState(0);
  const [dismissing, setDismissing] = useState(false);
  // Original-style interaction: an advisor brief and a rename, right on the
  // popup — cities rename via world.cityRenames (works for stock AND custom
  // city labels), structures rename in world.markers.
  const [report, setReport] = useState(null); // null | "loading" | text | {error}
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameDraft, setRenameDraft] = useState("");
  const { current: map } = useMap();
  const { markers } = useWorldState();

  _setSelection = (value) => {
    _currentSelection = value;
    setDismissing(false);
    setSelection(value);
    setReport(null);
    setIsRenaming(false);
    if (value !== null) setAnimKey((key) => key + 1);
  };

  _dismiss = () => setDismissing(true);

  // A selected structure tracks live world state: rebuilt-in-place markers
  // refresh the popup, a destroyed one closes it. Cities are static.
  const liveMarker = selection?.source === "marker"
    ? markers.find((marker) => marker.id === selection.id) ?? null
    : null;

  useEffect(() => {
    if (selection?.source === "marker" && !liveMarker) _dismiss?.();
  }, [selection, liveMarker]);

  const handleAnimationEnd = (e) => {
    if (e.animationName !== "featurePopupFadeOut") return;
    _currentSelection = null;
    setSelection(null);
    setDismissing(false);
  };

  useEffect(() => {
    if (!map || !selection) {
      setScreenPos(null);
      return undefined;
    }

    const update = () => {
      const center = map.getCenter();
      const toRad = (deg) => (deg * Math.PI) / 180;
      const anchor = { lng: selection.lng, lat: selection.lat };
      const lat1 = toRad(center.lat);
      const lat2 = toRad(anchor.lat);
      const dLng = toRad(anchor.lng - center.lng);
      const cosAngle =
        Math.sin(lat1) * Math.sin(lat2) + Math.cos(lat1) * Math.cos(lat2) * Math.cos(dLng);

      // On the globe, points around the horizon have no meaningful screen spot.
      if (cosAngle < 0) {
        setScreenPos(null);
        return;
      }

      const point = map.project(anchor);
      setScreenPos((prev) => {
        if (prev && Math.abs(prev.x - point.x) < 0.5 && Math.abs(prev.y - point.y) < 0.5) {
          return prev;
        }
        return { x: point.x, y: point.y };
      });
    };

    let frameId = 0;
    const scheduleUpdate = () => {
      if (frameId) return;
      frameId = requestAnimationFrame(() => {
        frameId = 0;
        update();
      });
    };

    update();
    map.on("move", scheduleUpdate);
    return () => {
      if (frameId) cancelAnimationFrame(frameId);
      map.off("move", scheduleUpdate);
    };
  }, [map, selection]);

  // Hook order must not depend on the selection — called before any return.
  const ownerName = useCountryDisplayName(liveMarker?.ownerCode || selection?.ownerCode || "");

  // WHAT HAPPENED HERE. The original answers this for every feature you click,
  // and it is the question a player actually has about a thing on their map.
  // Loaded on demand so opening the popup stays as cheap as it was.
  //
  // ABOVE THE EARLY RETURN, like every other hook here, and the comment above
  // says so for a reason: I put these three below it and shipped React error
  // #310 — "rendered more hooks than during the previous render". With nothing
  // selected the component returns at the guard having run eight hooks; select a
  // feature and it runs eleven, and React tears the tree down. Keyed on
  // `selection` rather than the derived `feature`, since that is what exists up
  // here — and it is the identity that changes when the player clicks elsewhere.
  const [showEvents, setShowEvents] = useState(false);
  const [related, setRelated] = useState(null);

  useEffect(() => { setShowEvents(false); setRelated(null); }, [selection?.id, selection?.name]);

  useEffect(() => {
    if (!showEvents || related !== null || !selection) return undefined;
    let cancelled = false;
    readEventsState({ force: true })
      .then((events) => {
        if (!cancelled) setRelated(findRelatedEvents(events, { id: selection.id, name: selection.name }, 20));
      })
      .catch(() => { if (!cancelled) setRelated([]); });
    return () => { cancelled = true; };
  }, [showEvents, related, selection]);

  if (!selection || !screenPos) return null;

  const feature = liveMarker
    ? { ...selection, ...liveMarker }
    : selection;

  const isCity = selection.source === "city";
  const kind = isCity
    ? (feature.capital === "primary" ? "Capital city" : TIER_LABEL[feature.tier] || "City")
    : (labelForFeatureKind(feature.kind) || "랜드마크");
  const population = Number(feature.population);

  const POPUP_WIDTH = report !== null ? 280 : 220;

  const runReport = async () => {
    if (report === "loading") return;
    setReport("loading");
    try {
      const text = await generateRegionBrief({ id: "", name: feature.name, ownerName: ownerName || "" });
      setReport(text || "No information available.");
    } catch (error) {
      setReport({ error: error?.message || "Couldn't generate a report. Set an AI provider + key in Settings." });
    }
  };

  const saveRename = async () => {
    const next = renameDraft.trim();
    setIsRenaming(false);
    if (!next || next === feature.name) return;
    try {
      const world = await readWorldState({ force: true });
      if (isCity) {
        await writeWorldState({
          ...world,
          cityRenames: { ...world.cityRenames, [String(feature.name).toLowerCase()]: next },
        });
      } else {
        await writeWorldState({
          ...world,
          markers: (world.markers ?? []).map((marker) =>
            marker.id === feature.id ? { ...marker, name: next } : marker),
        });
      }
      // Show the new name immediately; the map label follows within a poll.
      _setSelection({ ...selection, name: next });
    } catch (error) {
      console.warn("[feature] rename failed:", error);
    }
  };

  return createPortal(
    <div
      key={animKey}
      onAnimationEnd={handleAnimationEnd}
      style={{
        position: "fixed",
        left: screenPos.x - POPUP_WIDTH / 2,
        top: screenPos.y - 14,
        width: `${POPUP_WIDTH}px`,
        zIndex: 21,
        pointerEvents: dismissing ? "none" : "auto",
        animation: dismissing
          ? "featurePopupFadeOut 0.18s cubic-bezier(0.4, 0, 1, 1) both"
          : "featurePopupFadeIn 0.22s cubic-bezier(0.22, 1, 0.36, 1) both",
        fontFamily: "sans-serif",
      }}
    >
      <div
        style={{
          backgroundColor: "rgba(17, 24, 39, 0.96)",
          backdropFilter: "blur(4px)",
          WebkitBackdropFilter: "blur(4px)",
          borderRadius: "12px",
          overflow: "hidden",
          boxShadow: "0 8px 32px rgba(0,0,0,0.5), 0 2px 8px rgba(0,0,0,0.3)",
          border: "1px solid rgba(255,255,255,0.12)",
          color: "white",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "9px", padding: "10px 12px 8px" }}>
          <span style={{ fontSize: "1.5rem", lineHeight: 1 }}>
            {isCity ? (feature.capital === "primary" ? "⭐" : "🏙") : emojiForKind(feature.kind)}
          </span>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: "13px", wordBreak: "break-word" }}>{feature.name}</div>
            <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.6)" }}>
              Map Feature · {kind}
            </div>
          </div>
          <button
            onClick={() => _dismiss?.()}
            style={{
              background: "rgba(17,24,39,0.7)",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: "6px",
              width: "20px",
              height: "20px",
              cursor: "pointer",
              color: "rgba(255,255,255,0.5)",
              fontSize: "11px",
              padding: 0,
              flexShrink: 0,
            }}
          >
            {"✕"}
          </button>
        </div>

        <div style={{ padding: "0 12px 10px" }}>
          {ownerName ? <DetailRow label="Owner" value={ownerName} /> : null}
          {Number.isFinite(population) && population > 0 ? (
            <DetailRow label="Population" value={population.toLocaleString()} />
          ) : null}
          {feature.foundedAt ? <DetailRow label="Founded" value={feature.foundedAt} /> : null}
          <DetailRow label="Location" value={`${feature.lat.toFixed(2)}, ${feature.lng.toFixed(2)}`} />
          {feature.note ? (
            <div style={{ marginTop: "8px", fontSize: "11px", lineHeight: 1.45, color: "rgba(255,255,255,0.75)" }}>
              {feature.note}
            </div>
          ) : null}

          <button
            onClick={() => setShowEvents((prior) => !prior)}
            style={{
              background: showEvents ? "rgba(59,130,246,0.22)" : "rgba(255,255,255,0.06)",
              border: showEvents ? "1px solid rgba(96,165,250,0.55)" : "1px solid rgba(255,255,255,0.12)",
              borderRadius: "6px",
              color: "white",
              cursor: "pointer",
              fontSize: "10px",
              fontWeight: 600,
              marginTop: "9px",
              padding: "4px 0",
              width: "100%",
            }}
          >
            {showEvents ? "▾ Related events" : "▸ Related events"}
          </button>

          {showEvents && (
            <div style={{ maxHeight: "160px", overflowY: "auto" }}>
              {related === null && (
                <div style={{ color: "rgba(255,255,255,0.35)", fontSize: "10px", padding: "5px 0" }}>Looking…</div>
              )}
              {related?.length === 0 && (
                <div style={{ color: "rgba(255,255,255,0.35)", fontSize: "10px", padding: "5px 0" }}>
                  No recorded event mentions this yet.
                </div>
              )}
              {(related ?? []).map((event) => (
                <div key={event.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", padding: "5px 0" }}>
                  <div style={{ color: "rgba(255,255,255,0.45)", fontSize: "9px" }}>{event.date}</div>
                  <div style={{ color: "rgba(255,255,255,0.85)", fontSize: "10.5px", lineHeight: 1.4 }}>{event.title}</div>
                </div>
              ))}
            </div>
          )}

          {isRenaming ? (
            <div style={{ display: "flex", gap: "5px", marginTop: "8px" }}>
              <input
                autoFocus
                value={renameDraft}
                onChange={(e) => setRenameDraft(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") saveRename(); if (e.key === "Escape") setIsRenaming(false); }}
                style={{ flex: 1, minWidth: 0, background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: "6px", color: "white", fontSize: "11px", outline: "none", padding: "4px 6px" }}
              />
              <button
                onClick={saveRename}
                style={{ background: "#3b82f6", border: "none", borderRadius: "6px", color: "white", cursor: "pointer", fontSize: "10px", fontWeight: 600, padding: "3px 8px" }}
              >
                Save
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", gap: "5px", marginTop: "8px" }}>
              <button
                onClick={runReport}
                title="Ask the advisor about this place"
                style={{ flex: 1, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: "6px", color: "rgba(255,255,255,0.85)", cursor: "pointer", fontSize: "10px", fontWeight: 600, padding: "4px 6px" }}
              >
                {"ⓘ Advisor report"}
              </button>
              <button
                onClick={() => { setRenameDraft(feature.name); setIsRenaming(true); }}
                title="Rename this place"
                style={{ flex: 1, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: "6px", color: "rgba(255,255,255,0.85)", cursor: "pointer", fontSize: "10px", fontWeight: 600, padding: "4px 6px" }}
              >
                {"✎ Rename"}
              </button>
            </div>
          )}

          {report !== null && (
            <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", marginTop: "8px", maxHeight: "180px", overflowY: "auto", padding: "7px 8px" }}>
              {report === "loading" ? (
                <div style={{ color: "rgba(255,255,255,0.55)", fontSize: "11px" }}>Preparing the report…</div>
              ) : report?.error ? (
                <div style={{ color: "#f87171", fontSize: "11px" }}>{report.error}</div>
              ) : (
                <div style={{ color: "rgba(255,255,255,0.85)", fontSize: "11px", lineHeight: 1.5, whiteSpace: "pre-wrap" }}>{String(report)}</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default FeaturePopup;

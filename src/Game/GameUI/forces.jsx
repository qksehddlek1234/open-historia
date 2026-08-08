/*! Open Historia — Forces panel © 2026 Nicholas Krol, MIT (see src/Editor/LICENSE). */
import React, { useCallback, useEffect, useState } from "react";
import {
  subscribeUnits,
  getUnits,
  getPlayerCode,
  getInteractionMode,
  setInteractionMode,
  clearInteractionMode,
} from "../Map/unitsController.js";
import { unitTypeLabel, unitStatusLabel } from "../../runtime/gameState.js";
import { ensurePolityNames, polityDisplayName } from "../../runtime/polityNames.js";
import { useDragWindow } from "./useDragWindow.js";

// Localised in runtime/gameState.js — the bare English words were being
// machine-translated out of their military sense ("armor" -> 방어, "air" -> 공기).
const TYPE_LABEL = new Proxy({}, { get: (_t, key) => unitTypeLabel(String(key)) });
const TYPE_GLYPH = {
  infantry: "🛡",
  armor: "⚙",
  air: "✈",
  naval: "⚓",
  artillery: "💥",
  garrison: "🏰",
};

const MODE_HINT = {
  deploy: "Click the map to place your unit",
  move: "Click a destination to move the unit",
  attack: "Click an enemy unit, a city, or a structure to attack",
};

const surface = {
  backgroundColor: "rgba(17, 24, 39, 0.92)",
  backdropFilter: "blur(6px)",
  WebkitBackdropFilter: "blur(6px)",
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: "12px",
  color: "white",
  fontFamily: "sans-serif",
  boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
};

const UnitRow = ({ unit, dimmed, onClick }) => (
  <button
    onClick={onClick}
    style={{
      display: "flex",
      alignItems: "center",
      gap: "8px",
      width: "100%",
      background: "rgba(255,255,255,0.04)",
      border: "1px solid rgba(255,255,255,0.08)",
      borderRadius: "8px",
      padding: "6px 8px",
      marginBottom: "5px",
      cursor: "pointer",
      color: "white",
      textAlign: "left",
      opacity: dimmed ? 0.65 : 1,
    }}
  >
    <span style={{ fontSize: "1.1rem", lineHeight: 1 }}>{TYPE_GLYPH[unit.type] ?? "🛡"}</span>
    <div style={{ minWidth: 0, flex: 1 }}>
      <div style={{ fontSize: "12px", fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
        {unit.name}
      </div>
      <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.55)" }}>
        {TYPE_LABEL[unit.type] ?? unit.type} · {polityDisplayName(unit.ownerCode)} · <span data-no-translate="">{unitStatusLabel(unit.status)}</span>
      </div>
    </div>
    <span style={{ fontSize: "12px", fontWeight: 700, color: unit.strength > 600 ? "#4ade80" : unit.strength > 250 ? "#fbbf24" : "#f87171" }}>
      {unit.strength}
    </span>
  </button>
);

// Controlled panel: the launcher button lives in the bottom toolbar (chat.jsx
// Toolbar) alongside Chat and Actions; main.jsx owns the open state.
export const ForcesPanel = ({ mapRef, topOffset = "0px", open = false, onToggle }) => {
  const setOpen = (next) => {
    const resolved = typeof next === "function" ? next(open) : next;
    if (resolved !== open) onToggle?.();
  };
  const [units, setUnits] = useState(getUnits());
  const [mode, setMode] = useState(getInteractionMode());

  useEffect(() => {
    const unsubscribe = subscribeUnits(() => {
      setUnits(getUnits());
      setMode(getInteractionMode());
    });
    return unsubscribe;
  }, []);

  // Drag-to-move by the header, like the original's windows.
  const drag = useDragWindow();
  // Owner codes render as full names; re-render once the lookup is warm.
  const [, setNamesEpoch] = useState(0);
  useEffect(() => {
    ensurePolityNames().then(() => setNamesEpoch((epoch) => epoch + 1)).catch(() => {});
  }, [units.length]);

  const playerCode = getPlayerCode();
  const myUnits = units.filter((u) => u.ownerCode && u.ownerCode === playerCode);
  const otherUnits = units.filter((u) => !playerCode || u.ownerCode !== playerCode);

  const flyTo = useCallback(
    (unit) => {
      const map = mapRef?.current?.getMap?.() ?? mapRef?.current;
      map?.flyTo?.({ center: [unit.lng, unit.lat], zoom: Math.max(map.getZoom?.() ?? 4, 4.5) });
    },
    [mapRef],
  );

  return (
    <>
      {/* Mode banner — global instruction while deploying / moving / attacking. */}
      {mode.kind !== "idle" && (
        <div
          style={{
            ...surface,
            position: "fixed",
            top: "4.5rem",
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 10000,
            display: "flex",
            alignItems: "center",
            gap: "12px",
            padding: "8px 14px",
            fontSize: "13px",
          }}
        >
          <span>{MODE_HINT[mode.kind] ?? "Select a target"}</span>
          <button
            onClick={() => clearInteractionMode()}
            style={{
              background: "rgba(220,70,70,0.25)",
              border: "1px solid rgba(255,255,255,0.15)",
              borderRadius: "6px",
              color: "white",
              cursor: "pointer",
              fontSize: "11px",
              padding: "3px 9px",
            }}
          >
            Cancel
          </button>
        </div>
      )}

      {open && (
        <div
          style={{
            ...surface,
            position: "fixed",
            bottom: "4.75rem",
            left: "0.5rem",
            width: "17rem",
            maxHeight: "60vh",
            display: "flex",
            flexDirection: "column",
            zIndex: 9999,
            padding: "12px",
            transform: drag.transform,
          }}
        >
          <div
            onPointerDown={drag.onPointerDown}
            style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px", cursor: "grab", touchAction: "none", userSelect: "none" }}
          >
            <strong style={{ fontSize: "14px" }}>Forces</strong>
            <button
              onClick={() => setOpen(false)}
              style={{ background: "none", border: "none", color: "rgba(255,255,255,0.6)", cursor: "pointer", fontSize: "14px" }}
            >
              ✕
            </button>
          </div>

          {/* THE SECOND WAY TO PUT A UNIT ON THE MAP IS GONE.
              This panel used to carry its own branch/strength/name form and its
              own deploy mode, a centimetre from the Add Map Feature flow that
              does the same job for structures and cities. Raising a formation is
              adding a map feature and lives there now — with an owner, a
              position you can type or pick, and a history. What is left here is
              what only this panel does: commanding units that already exist. */}
          <div style={{ overflowY: "auto", flex: 1 }}>
            <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.6)", margin: "0 0 5px" }}>
              Your units ({myUnits.length})
            </div>
            {myUnits.length === 0 && (
              <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.35)", marginBottom: "8px" }}>
                None yet — raise one in Add Map Feature, or jump time to let the war unfold.
              </div>
            )}
            {myUnits.map((u) => (
              <UnitRow key={u.id} unit={u} onClick={() => flyTo(u)} />
            ))}

            {otherUnits.length > 0 && (
              <>
                <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.6)", margin: "8px 0 5px" }}>
                  Other forces ({otherUnits.length})
                </div>
                {otherUnits.map((u) => (
                  <UnitRow key={u.id} unit={u} dimmed onClick={() => flyTo(u)} />
                ))}
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default ForcesPanel;

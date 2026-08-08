/*! Open Historia — Event Manager window. */
import React, { useEffect, useState } from "react";
import { JSON_URLS, readJson, writeJson } from "../../runtime/assets.js";
import { loadRollbackSnapshots, rollBackToSnapshot } from "../AI/gameplay.js";
import {
    buildActionDisplayText,
    normalizeActionEntry,
    normalizeEvents,
    readEventsState,
    writeEventsState,
} from "../../runtime/gameState.js";
import { useDragWindow } from "./useDragWindow.js";

// The original game's Event Manager (Ctrl+E) is its own draggable window with a
// HORIZONTAL round selector (numbered chips with dates) and, per round, the
// submitted player actions and the generated events as SEPARATE color-coded
// sections — this recreates that. Restoring ("reset to the moment just before
// this round's actions ran") hangs off the selected chip as a single button,
// the way the original does it: a separate list of restore points, one row per
// turn, grew a screenful of scrolling by round twenty and put every round on
// screen twice. The advisor's Background Story and the event consolidator both
// read the live event list, so pruning or rewording events here curates the
// campaign's integrated narrative.

// Section palette, mirroring the original's distinct coloring: player actions
// read BLUE, generated events read PURPLE.
const ACTION_TINT = {
    background: "rgba(37, 99, 235, 0.12)",
    border: "1px solid rgba(96, 165, 250, 0.35)",
    heading: "rgba(147, 197, 253, 0.95)",
};
const EVENT_TINT = {
    background: "rgba(109, 40, 217, 0.12)",
    border: "1px solid rgba(167, 139, 250, 0.35)",
    heading: "rgba(196, 181, 253, 0.95)",
};

const inputStyle = {
    background: "rgba(0,0,0,0.28)",
    border: "1px solid rgba(255,255,255,0.16)",
    borderRadius: 8,
    boxSizing: "border-box",
    color: "#fff",
    fontSize: "0.8rem",
    outline: "none",
    padding: "0.45rem 0.55rem",
    width: "100%",
};

const smallLabelStyle = {
    color: "rgba(255,255,255,0.6)",
    display: "block",
    fontSize: "0.68rem",
    fontWeight: 700,
    letterSpacing: "0.04em",
    margin: "0.45rem 0 0.2rem",
    textTransform: "uppercase",
};

// One event row: the full text is visible immediately (title, date,
// description) and clicking the text itself opens the inline editor — the
// original's interaction, no separate edit button.
const EventRow = ({ event, onSave, onDelete }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [draft, setDraft] = useState({});

    const startEdit = () => {
        setDraft({ title: event.title, date: event.date, description: event.description });
        setIsEditing(true);
    };

    const save = () => {
        setIsEditing(false);
        onSave({
            ...event,
            date: draft.date ?? event.date,
            description: draft.description ?? event.description,
            title: draft.title ?? event.title,
        });
    };

    return (
        <div
        style={{
            background: EVENT_TINT.background,
            border: EVENT_TINT.border,
            borderRadius: 8,
            display: "flex",
            gap: "0.45rem",
            justifyContent: "space-between",
            marginBottom: "0.3rem",
            padding: "0.45rem 0.55rem",
        }}
        >
        {isEditing ? (
            <div style={{ flex: 1, minWidth: 0 }}>
            <label style={smallLabelStyle}>Title</label>
            <input style={inputStyle} value={draft.title ?? ""} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
            <label style={smallLabelStyle}>Date</label>
            <input style={inputStyle} value={draft.date ?? ""} onChange={(e) => setDraft({ ...draft, date: e.target.value })} />
            <label style={smallLabelStyle}>Description</label>
            <textarea
            rows={4}
            style={{ ...inputStyle, resize: "vertical" }}
            value={draft.description ?? ""}
            onChange={(e) => setDraft({ ...draft, description: e.target.value })}
            />
            <div style={{ display: "flex", gap: "0.4rem", marginTop: "0.45rem" }}>
            <button
            type="button"
            onClick={save}
            style={{ background: "#3b82f6", border: "none", borderRadius: 8, color: "white", cursor: "pointer", fontSize: "0.74rem", fontWeight: 600, padding: "0.3rem 0.8rem" }}
            >
            Save
            </button>
            <button
            type="button"
            onClick={() => setIsEditing(false)}
            style={{ background: "rgba(255,255,255,0.08)", border: "none", borderRadius: 8, color: "rgba(255,255,255,0.8)", cursor: "pointer", fontSize: "0.74rem", padding: "0.3rem 0.8rem" }}
            >
            Cancel
            </button>
            </div>
            </div>
        ) : (
            <div
            onClick={startEdit}
            title="Click to edit this event"
            style={{ cursor: "pointer", flex: 1, minWidth: 0 }}
            >
            <div style={{ fontSize: "0.78rem", fontWeight: 700 }}>{event.title || "(untitled)"}</div>
            {event.date && (
                <div style={{ color: "rgba(255,255,255,0.45)", fontSize: "0.68rem", marginTop: "0.05rem" }}>{event.date}</div>
            )}
            {event.description && (
                <div style={{ color: "rgba(255,255,255,0.62)", fontSize: "0.73rem", lineHeight: 1.45, marginTop: "0.15rem", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                {event.description}
                </div>
            )}
            </div>
        )}
        {!isEditing && (
            <button
            type="button"
            onClick={onDelete}
            title="Delete this event"
            style={{
                background: "none",
                border: "none",
                color: "rgba(239,68,68,0.85)",
                cursor: "pointer",
                flexShrink: 0,
                fontSize: "0.9rem",
                lineHeight: 1,
                padding: "0.1rem 0.2rem",
            }}
            >
            {"✕"}
            </button>
        )}
        </div>
    );
};

// A submitted player action, as recorded in that round's history snapshot —
// tinted the ACTIONS color, and editable by clicking its text (the record
// lives in world.simulationHistory, so edits flow into the Background Story
// and every prompt that replays the round's history).
const ActionRow = ({ action, onSave }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [draft, setDraft] = useState("");
    const normalized = normalizeActionEntry(action);
    if (!normalized) return null;
    const label = buildActionDisplayText(normalized);
    const showTitle = normalized.title && normalized.title !== label;

    const startEdit = () => {
        if (!onSave) return;
        setDraft(normalized.rawInput || normalized.text || label);
        setIsEditing(true);
    };
    const save = () => {
        setIsEditing(false);
        const trimmed = draft.trim();
        if (trimmed && trimmed !== (normalized.rawInput || normalized.text)) {
            onSave({ ...action, rawInput: trimmed, text: trimmed });
        }
    };

    return (
        <div
        style={{
            background: ACTION_TINT.background,
            border: ACTION_TINT.border,
            borderRadius: 8,
            marginBottom: "0.3rem",
            padding: "0.45rem 0.55rem",
        }}
        >
        {isEditing ? (
            <div>
            <textarea
            rows={3}
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            style={{ ...inputStyle, resize: "vertical" }}
            />
            <div style={{ display: "flex", gap: "0.4rem", marginTop: "0.4rem" }}>
            <button
            type="button"
            onClick={save}
            style={{ background: "#3b82f6", border: "none", borderRadius: 8, color: "white", cursor: "pointer", fontSize: "0.74rem", fontWeight: 600, padding: "0.3rem 0.8rem" }}
            >
            Save
            </button>
            <button
            type="button"
            onClick={() => setIsEditing(false)}
            style={{ background: "rgba(255,255,255,0.08)", border: "none", borderRadius: 8, color: "rgba(255,255,255,0.8)", cursor: "pointer", fontSize: "0.74rem", padding: "0.3rem 0.8rem" }}
            >
            Cancel
            </button>
            </div>
            </div>
        ) : (
            <div onClick={startEdit} title={onSave ? "Click to edit this action" : undefined} style={{ cursor: onSave ? "pointer" : "default" }}>
            {showTitle && (
                <div style={{ fontSize: "0.76rem", fontWeight: 700 }}>{normalized.title}</div>
            )}
            <div style={{ color: "rgba(255,255,255,0.72)", fontSize: "0.73rem", lineHeight: 1.45, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
            {label}
            </div>
            </div>
        )}
        </div>
    );
};

const EventsManagerPanel = ({ open, onClose }) => {
    const [snapshots, setSnapshots] = useState([]);
    const [events, setEvents] = useState([]);
    const [history, setHistory] = useState([]);
    const [confirmRestore, setConfirmRestore] = useState(-1);
    const [selectedKey, setSelectedKey] = useState("");
    const [busy, setBusy] = useState(false);
    const [status, setStatus] = useState("");
    const drag = useDragWindow("translate(-50%, -50%)");

    // Reload everything each time the window opens — the game may have jumped,
    // rolled back, or edited events since the last look.
    useEffect(() => {
        if (!open) return undefined;
        let cancelled = false;
        setStatus("");
        setConfirmRestore(-1);
        (async () => {
            const [snaps, rawEvents, world] = await Promise.all([
                loadRollbackSnapshots().catch(() => []),
                readEventsState({ force: true }).catch(() => []),
                readJson(JSON_URLS.world, { defaultValue: {}, force: true }).catch(() => ({})),
            ]);
            if (cancelled) return;
            setSnapshots(Array.isArray(snaps) ? snaps : []);
            setEvents(normalizeEvents(rawEvents));
            setHistory(Array.isArray(world?.simulationHistory) ? world.simulationHistory : []);
            setSelectedKey("");
        })();
        return () => { cancelled = true; };
    }, [open]);

    if (!open) {
        return null;
    }

    // Group events by the turn that generated them. simulationHistory is stored
    // newest-first with each turn's eventIds and the snapshot of the actions the
    // player had submitted; the chips run OLDEST → NEWEST left-to-right like the
    // original's round selector. Whatever predates the recorded turns (scenario
    // seeds, pregame history) gets a leading "S" chip.
    const eventById = new Map(events.map((event) => [String(event.id), event]));
    const groupedIds = new Set();
    const roundGroups = history
        .slice()
        .reverse()
        .map((entry) => {
            const ids = Array.isArray(entry?.eventIds) ? entry.eventIds.map(String) : [];
            ids.forEach((id) => groupedIds.add(id));
            return {
                actions: Array.isArray(entry?.plannedActions) ? entry.plannedActions : [],
                chip: String(entry?.round ?? "?"),
                events: ids.map((id) => eventById.get(id)).filter(Boolean),
                fromDate: entry?.fromDate || "",
                key: `round-${entry?.round ?? "?"}`,
                round: entry?.round ?? "?",
                summary: entry?.summary || "",
                toDate: entry?.toDate || "",
            };
        });
    const earlierEvents = events.filter((event) => !groupedIds.has(String(event.id)));
    if (earlierEvents.length > 0) {
        roundGroups.unshift({
            actions: [],
            chip: "S",
            events: earlierEvents,
            fromDate: "",
            key: "earlier",
            round: "",
            summary: "Events from the scenario itself and anything recorded before the per-turn log began.",
            toDate: "",
        });
    }

    // Default selection: the newest round (rightmost chip), like the original.
    const activeKey = selectedKey || roundGroups.at(-1)?.key || "";
    const activeGroup = roundGroups.find((group) => group.key === activeKey) || null;
    // The restore point belonging to the selected round, or -1 when there is
    // none — the scenario "S" chip has no snapshot, and neither does a round
    // recorded before restore points existed. The button hides in that case
    // rather than offering a rewind that would fail.
    //
    // MATCH BY THE TURN'S OWN DATES, not by round number. A history entry
    // carries the round the turn PRODUCED (5) while its snapshot carries the
    // round it REPLACED (4) — matching the numbers meant the newest round's
    // chip never found its restore point, which is exactly when a player
    // wants one ("바로 전턴으로 돌아갈 방법이 없어", live, after a crash).
    // Both records carry the same from/to window, so the window is the key;
    // the round-minus-one fallback covers snapshots from before dates were
    // recorded on either side.
    const activeSnapshotIndex = activeGroup && activeGroup.round !== ""
        ? snapshots.findIndex((snap) =>
            (String(snap?.fromDate || "") !== "" && String(snap?.fromDate) === String(activeGroup.fromDate)
                && String(snap?.toDate) === String(activeGroup.toDate))
            || String(snap?.round) === String(Number(activeGroup.round) - 1))
        : -1;

    // Persist an edited SUBMITTED ACTION back into its round's history record
    // (world.simulationHistory[..].plannedActions).
    const saveAction = async (round, actionIndex, updated) => {
        try {
            const world = await readJson(JSON_URLS.world, { defaultValue: {}, force: true });
            const list = Array.isArray(world?.simulationHistory) ? world.simulationHistory : [];
            const nextHistory = list.map((entry) => {
                if (entry?.round !== round) return entry;
                const actions = Array.isArray(entry.plannedActions) ? [...entry.plannedActions] : [];
                if (actionIndex < 0 || actionIndex >= actions.length) return entry;
                actions[actionIndex] = updated;
                return { ...entry, plannedActions: actions };
            });
            await writeJson(JSON_URLS.world, { ...world, simulationHistory: nextHistory }, { pretty: true });
            setHistory(nextHistory);
            setStatus("Action record updated. The Background Story picks this up on its next run.");
        } catch (error) {
            setStatus(`Save failed: ${error?.message || error}`);
        }
    };

    const saveEvent = async (updated) => {
        const next = events.map((entry) => (String(entry.id) === String(updated.id) ? updated : entry));
        try {
            await writeEventsState(next);
            setEvents(next);
            setStatus("Event saved. The Background Story and history consolidation pick this up on their next run.");
        } catch (error) {
            setStatus(`Save failed: ${error?.message || error}`);
        }
    };

    const deleteEvents = async (idsToRemove) => {
        const removeSet = new Set(idsToRemove.map(String));
        if (removeSet.size === 0) return;
        const remaining = events.filter((event) => !removeSet.has(String(event.id)));
        try {
            await writeEventsState(remaining);
            setEvents(remaining);
            setStatus(`${removeSet.size} event(s) deleted. The Background Story and history consolidation pick this up on their next run.`);
        } catch (error) {
            setStatus(`Delete failed: ${error?.message || error}`);
        }
    };

    const restoreSnapshot = async (index) => {
        if (busy) return;
        setBusy(true);
        setStatus("Restoring the game to that point…");
        try {
            const result = await rollBackToSnapshot(index);
            if (result) {
                // Every subsystem (map, timeline, actions, chats) rehydrates
                // from the restored files on load — a reload IS the refresh.
                window.location.reload();
                return;
            }
            setStatus("That restore point no longer exists.");
        } catch (error) {
            setStatus(`Restore failed: ${error?.message || error}`);
        }
        setBusy(false);
        setConfirmRestore(-1);
    };

    return (
        <div
        style={{
            background: "rgba(17, 24, 39, 0.96)",
            backdropFilter: "blur(8px)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 16,
            boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
            color: "white",
            display: "flex",
            flexDirection: "column",
            fontFamily: "sans-serif",
            left: "50%",
            maxHeight: "calc(100vh - 6rem)",
            overflow: "hidden",
            position: "fixed",
            top: "50%",
            transform: drag.transform,
            width: "min(36rem, calc(100vw - 1.5rem))",
            zIndex: 10050,
        }}
        >
        <div
        onPointerDown={drag.onPointerDown}
        style={{
            alignItems: "center",
            borderBottom: "1px solid rgba(255,255,255,0.1)",
            cursor: "grab",
            display: "flex",
            justifyContent: "space-between",
            padding: "0.9rem 1.1rem 0.7rem",
            touchAction: "none",
            userSelect: "none",
        }}
        >
        <div style={{ fontSize: "1rem", fontWeight: 800 }}>🕰️ Event Manager</div>
        <button
        type="button"
        onClick={onClose}
        style={{
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: 8,
            color: "#fff",
            cursor: "pointer",
            fontSize: "0.85rem",
            padding: "0.25rem 0.55rem",
        }}
        >
        {"✕"}
        </button>
        </div>

        <div style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: "0.9rem 1.1rem 1rem" }}>
        <div style={{ alignItems: "center", display: "flex", gap: "0.5rem", justifyContent: "space-between", marginBottom: "0.2rem" }}>
        <div style={{ fontSize: "0.82rem", fontWeight: 700 }}>Rounds</div>
        {/* ONE BUTTON, FOR WHICHEVER ROUND IS SELECTED.
            This used to be a separate "Restore points" list above the selector,
            one row per turn — so by round twenty the player scrolled past twenty
            near-identical rows to reach the round selector, and the same round
            was on screen twice saying two different things. The chips already
            pick a round; the reset belongs to whatever they picked. */}
        {activeSnapshotIndex >= 0 && (
            <button
            type="button"
            disabled={busy}
            onClick={() => {
                if (confirmRestore === activeSnapshotIndex) restoreSnapshot(activeSnapshotIndex);
                else setConfirmRestore(activeSnapshotIndex);
            }}
            title="Rewinds the map, events, actions and chats to just before this round ran, and discards the newer rounds."
            style={{
                background: confirmRestore === activeSnapshotIndex ? "rgba(239,68,68,0.25)" : "rgba(59,130,246,0.2)",
                border: confirmRestore === activeSnapshotIndex ? "1px solid rgba(239,68,68,0.6)" : "1px solid rgba(96,165,250,0.4)",
                borderRadius: 8,
                color: "white",
                cursor: busy ? "wait" : "pointer",
                flexShrink: 0,
                fontSize: "0.7rem",
                fontWeight: 600,
                padding: "0.3rem 0.6rem",
            }}
            >
            {confirmRestore === activeSnapshotIndex
                ? "Click again to confirm"
                : `↺ Reset to round ${activeGroup?.chip ?? ""}`}
            </button>
        )}
        </div>
        {roundGroups.length === 0 && (
            <div style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.75rem" }}>No rounds recorded yet.</div>
        )}
        {/* The original's round selector: numbered chips in ONE horizontal
            scrolling row, oldest on the left. */}
        <div
        style={{
            display: "flex",
            gap: "0.45rem",
            marginBottom: "0.6rem",
            overflowX: "auto",
            paddingBottom: "0.35rem",
            scrollbarWidth: "thin",
        }}
        >
        {roundGroups.map((group) => {
            const isActive = group.key === activeKey;
            return (
                <button
                key={group.key}
                type="button"
                onClick={() => {
                    setSelectedKey(group.key);
                    // Changing rounds must not carry an armed confirmation over
                    // to the new one — that would turn a second chip click into
                    // a rewind nobody asked for.
                    setConfirmRestore(-1);
                }}
                style={{
                    alignItems: "center",
                    background: isActive ? "rgba(59,130,246,0.22)" : "rgba(255,255,255,0.05)",
                    border: isActive ? "1px solid rgba(96,165,250,0.65)" : "1px solid rgba(255,255,255,0.12)",
                    borderRadius: 10,
                    color: "white",
                    cursor: "pointer",
                    display: "flex",
                    flexDirection: "column",
                    flexShrink: 0,
                    gap: "0.15rem",
                    minWidth: "5.4rem",
                    padding: "0.4rem 0.55rem",
                }}
                >
                <span
                style={{
                    alignItems: "center",
                    background: isActive ? "#3b82f6" : "rgba(59,130,246,0.35)",
                    borderRadius: "50%",
                    display: "flex",
                    fontSize: "0.78rem",
                    fontWeight: 800,
                    height: "1.5rem",
                    justifyContent: "center",
                    width: "1.5rem",
                }}
                >
                {group.chip}
                </span>
                <span style={{ color: "rgba(255,255,255,0.7)", fontSize: "0.64rem", whiteSpace: "nowrap" }}>
                {group.key === "earlier" ? "Scenario" : (group.toDate || group.fromDate || "?")}
                </span>
                <span style={{ color: "rgba(255,255,255,0.45)", fontSize: "0.62rem", whiteSpace: "nowrap" }}>
                {group.actions.length} actions · {group.events.length} events
                </span>
                </button>
            );
        })}
        </div>

        {activeGroup && (
            <div>
            <div style={{ fontSize: "0.8rem", fontWeight: 700 }}>
            {activeGroup.key === "earlier"
                ? "Scenario & earlier"
                : `Round ${activeGroup.round} — ${activeGroup.fromDate || "?"} → ${activeGroup.toDate || "?"}`}
            </div>
            {activeGroup.summary && (
                <div style={{ color: "rgba(255,255,255,0.55)", fontSize: "0.7rem", lineHeight: 1.45, margin: "0.25rem 0 0.5rem" }}>
                {activeGroup.summary}
                </div>
            )}

            {/* Submitted player actions — separate section, ACTIONS color. */}
            <div style={{ color: ACTION_TINT.heading, fontSize: "0.72rem", fontWeight: 800, letterSpacing: "0.05em", margin: "0.5rem 0 0.3rem", textTransform: "uppercase" }}>
            Submitted Actions ({activeGroup.actions.length})
            </div>
            {activeGroup.actions.length === 0 ? (
                <div style={{ color: "rgba(255,255,255,0.35)", fontSize: "0.72rem", fontStyle: "italic", marginBottom: "0.3rem" }}>
                No actions were submitted this round.
                </div>
            ) : (
                activeGroup.actions.map((action, index) => (
                    <ActionRow
                    key={action?.id || index}
                    action={action}
                    onSave={activeGroup.key === "earlier" ? null : (updated) => saveAction(activeGroup.round, index, updated)}
                    />
                ))
            )}

            {/* Generated events — separate section, EVENTS color. */}
            <div style={{ color: EVENT_TINT.heading, fontSize: "0.72rem", fontWeight: 800, letterSpacing: "0.05em", margin: "0.6rem 0 0.3rem", textTransform: "uppercase" }}>
            Events ({activeGroup.events.length})
            </div>
            {activeGroup.events.length === 0 && (
                <div style={{ color: "rgba(255,255,255,0.35)", fontSize: "0.72rem", fontStyle: "italic", marginBottom: "0.3rem" }}>
                This round has no surviving events.
                </div>
            )}
            {activeGroup.events.map((event) => (
                <EventRow
                key={event.id}
                event={event}
                onSave={saveEvent}
                onDelete={() => deleteEvents([event.id])}
                />
            ))}
            {activeGroup.events.length > 0 && (
                <button
                type="button"
                onClick={() => deleteEvents(activeGroup.events.map((event) => event.id))}
                style={{
                    background: "none",
                    border: "none",
                    color: "rgba(239,68,68,0.85)",
                    cursor: "pointer",
                    fontSize: "0.7rem",
                    fontWeight: 600,
                    padding: "0.1rem 0",
                    textDecoration: "underline",
                }}
                >
                Delete all events in this round
                </button>
            )}
            <div style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.66rem", lineHeight: 1.4, marginTop: "0.5rem" }}>
            Click an event's text to edit it. Changes carry into the advisor's
            Background Story and the consolidated history on their next run.
            </div>
            </div>
        )}
        {status && (
            <div style={{ color: "rgba(134,239,172,0.9)", fontSize: "0.72rem", marginTop: "0.4rem" }}>{status}</div>
        )}
        </div>
        </div>
    );
};

export { EventsManagerPanel };

/*! Open Historia — portions (drawer close/slide + mobile layout) © 2026 Nicholas Krol, MIT (see src/Editor/LICENSE). */
import React, { useState, useRef, useEffect } from "react";
import { stripPlayerHonorific } from "../../runtime/playerAddress.js";
import ReactMarkdown from "react-markdown";
import { Chart, registerables } from "chart.js";
import { sendMessage, startChat, loadHistory } from "../AI/main.jsx";
import { generateAdvisorTopics } from "../AI/gameplay.js";
import { generateBackstory } from "../AI/gameplay.js";
import { JSON_URLS, readJson, writeJson } from "../../runtime/assets.js";
import { chatLanguageDiffersFromUi, isRtlLanguage, resolveChatLanguage } from "../../runtime/i18n.js";
import StatsPane from "./stats.jsx";

Chart.register(...registerables);

const ADVISOR_PANEL_WIDTH = "min(20rem, calc(100vw - 1rem))";

const baseStyle = {
    position: "fixed",
    backgroundColor: "rgba(17, 24, 39, 0.9)",
    backdropFilter: "blur(4px)",
    zIndex: 9999,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "white",
    fontFamily: "sans-serif",
    borderRadius: "12px",
    border: "1px solid rgba(255,255,255,0.1)",
    boxShadow: "0 4px 6px -1px rgba(0,0,0,0.2)",
};

const ThinkingDots = () => {
    const [dots, setDots] = React.useState(0);
    useEffect(() => {
        const interval = setInterval(() => setDots(d => (d + 1) % 4), 500);
        return () => clearInterval(interval);
    }, []);
    return <span style={{ opacity: 0.6 }}>Thinking{".".repeat(dots)}&nbsp;</span>;
};

const parseMessage = (rawText) => {
    const chartRegex = /```chart\s*([\s\S]*?)```/;
    const match = rawText.match(chartRegex);
    if (!match) return { text: rawText, chartConfig: null };
    let chartConfig = null;
    try { chartConfig = JSON.parse(match[1].trim()); } catch { chartConfig = null; }
    return { text: rawText.replace(chartRegex, "").trim(), chartConfig };
};

const CHART_COLORS = ["#60a5fa","#34d399","#f472b6","#fbbf24","#a78bfa","#f87171","#38bdf8"];

const AdvisorChart = ({ config }) => {
    const canvasRef = useRef(null);
    const chartRef  = useRef(null);
    const isCartesian     = config.type !== "pie" && config.type !== "doughnut";
    const isPieOrDoughnut = config.type === "pie"  || config.type === "doughnut";
    const isPercent       = config.options?.unit === "percent";

    const coloredConfig = {
        ...config,
        data: {
            ...config.data,
            datasets: config.data.datasets.map((ds, i) => {
                const color     = CHART_COLORS[i % CHART_COLORS.length];
                const pieColors = (config.data.labels || []).map((_, j) => CHART_COLORS[j % CHART_COLORS.length]);
                return {
                    borderColor:      isPieOrDoughnut ? undefined : color,
                    backgroundColor:  isPieOrDoughnut ? pieColors : config.type === "line" ? `${color}26` : color,
                    borderWidth: 2,
                    pointRadius:      config.type === "line" ? 3 : undefined,
                    pointHoverRadius: config.type === "line" ? 5 : undefined,
                    tension:          config.type === "line" ? 0.4 : undefined,
                    ...ds,
                };
            }),
        },
    };

    const legendItems = (() => {
        if (!coloredConfig?.data?.datasets) return [];
        if (isPieOrDoughnut) {
            const labels = coloredConfig.data.labels || [];
            const colors = coloredConfig.data.datasets[0]?.backgroundColor || [];
            return labels.map((label, i) => ({ label, color: Array.isArray(colors) ? colors[i] : CHART_COLORS[i % CHART_COLORS.length] }));
        }
        return coloredConfig.data.datasets.map((ds, i) => ({
            label: ds.label || "",
            color: Array.isArray(ds.borderColor) ? ds.borderColor[0] : ds.borderColor || CHART_COLORS[i % CHART_COLORS.length],
        }));
    })();

    useEffect(() => {
        if (!canvasRef.current) return;
        if (chartRef.current) chartRef.current.destroy();
        const ctx = canvasRef.current.getContext("2d");
        chartRef.current = new Chart(ctx, {
            ...coloredConfig,
            options: {
                ...coloredConfig.options,
                responsive: true,
                maintainAspectRatio: false,
                layout: { padding: { top: 4, bottom: 4 } },
                plugins: {
                    ...coloredConfig.options?.plugins,
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: "rgba(10,15,28,0.95)",
                                     borderColor: "rgba(255,255,255,0.12)", borderWidth: 1,
                                     titleColor: "rgba(255,255,255,0.85)", bodyColor: "rgba(255,255,255,0.6)",
                                     padding: 10, cornerRadius: 8,
                                     ...coloredConfig.options?.plugins?.tooltip,
                                     callbacks: {
                                         label: (ctx) => ` ${ctx.parsed.y ?? ctx.parsed}${isPercent ? "%" : ""}`,
                                     ...coloredConfig.options?.plugins?.tooltip?.callbacks,
                                     },
                    },
                },
                scales: isCartesian ? {
                    x: { ticks: { color: "rgba(255,255,255,0.45)", font: { size: 10, family: "sans-serif" } }, grid: { color: "rgba(255,255,255,0.06)" }, border: { color: "rgba(255,255,255,0.08)" }, ...coloredConfig.options?.scales?.x },
                                     y: { ticks: { color: "rgba(255,255,255,0.45)", font: { size: 10, family: "sans-serif" }, callback: val => `${val}${isPercent ? "%" : ""}` }, grid: { color: "rgba(255,255,255,0.06)" }, border: { color: "rgba(255,255,255,0.08)" }, ...coloredConfig.options?.scales?.y },
                } : undefined,
            },
        });
        return () => { if (chartRef.current) chartRef.current.destroy(); };
    }, [config]);

    return (
        <div style={{ marginTop: "0.75rem", width: "100%", boxSizing: "border-box" }}>
        {legendItems.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem 0.85rem", marginBottom: "0.5rem" }}>
            {legendItems.map((item, i) => (
                <span key={i} style={{ display: "flex", alignItems: "center", gap: "0.35rem", fontSize: "0.72rem", color: "rgba(255,255,255,0.5)" }}>
                <span style={{ width: "8px", height: "8px", borderRadius: "2px", backgroundColor: item.color || "#60a5fa", flexShrink: 0 }} />
                {item.label}
                </span>
            ))}
            </div>
        )}
        <div style={{ position: "relative", width: "100%", height: "175px" }}>
        <canvas ref={canvasRef} />
        </div>
        </div>
    );
};

const AdvisorButton = ({ isAdvisorOpen, rightShift, onToggle }) => (
    <button onClick={onToggle} style={{
        ...baseStyle,
        bottom: "0.5rem", right: rightShift,
        height: "4rem", width: "4rem",
        cursor: "pointer", fontSize: "1.5rem",
        transition: "right 0.35s cubic-bezier(0.4, 0, 0.2, 1)",
    }}>🧭</button>
);

const saveMessages = async (messages) => {
    try {
        await writeJson(JSON_URLS.advisor, messages);
    } catch (err) { console.error("Failed to save messages:", err); }
};

const loadMessages = async () => {
    try {
        return await readJson(JSON_URLS.advisor, { defaultValue: [] });
    } catch { return []; }
};

const TabButton = ({ icon, label, active, onClick }) => (
    <button
    onClick={onClick}
    style={{
        alignItems: "center",
        background: "none",
        border: "none",
        borderBottom: active ? "2px solid #3b82f6" : "2px solid transparent",
        color: active ? "white" : "rgba(255,255,255,0.55)",
        cursor: "pointer",
        display: "flex",
        fontFamily: "sans-serif",
        fontSize: "0.88rem",
        fontWeight: active ? 700 : 500,
        gap: "0.4rem",
        padding: "0.9rem 0.85rem",
    }}
    >
    <span style={{ fontSize: "1rem" }}>{icon}</span> {label}
    </button>
);

// Backstory pane — the campaign chronicle, matching Pax Historia's advisor
// "Background Story" tab: an AI-narrated story of the campaign so far (from
// round summaries, events and the player's actions), plus the per-round
// summaries underneath and a markdown export.
const BackstoryPane = ({ active }) => {
    const [world, setWorld] = useState(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState("");
    // THE ORIGINAL'S SHAPE, PROPERLY THIS TIME: chapters are a HORIZONTAL
    // chip strip — the same design language as the Event Manager's round
    // selector chips, which this codebase already mirrors from the original.
    // The strip sits OUTSIDE the scrollable content and scrolls sideways on
    // its own, so fifteen chapters add zero vertical scroll; exactly one
    // thing shows below it — the selected chapter's prose, or the current
    // chapter (narrative + its round summaries). "current" is the default:
    // the pane opens on the living story, with history one tap left.
    const [selectedChapter, setSelectedChapter] = useState("current");

    useEffect(() => {
        if (!active) return undefined;
        let cancelled = false;
        readJson(JSON_URLS.world, { defaultValue: {}, force: true })
        .then((data) => { if (!cancelled) setWorld(data && typeof data === "object" ? data : {}); })
        .catch(() => { if (!cancelled) setWorld({}); });
        return () => { cancelled = true; };
    }, [active, isGenerating]);

    // The original's shape: consolidated CHAPTERS stand as their own separated
    // blocks, the generated narrative covers only the current chapter, and the
    // per-round summaries listed underneath are only the UNCONSOLIDATED ones —
    // rounds a consolidation has absorbed live inside their chapter now instead
    // of stacking here forever.
    const chapters = Array.isArray(world?.consolidatedHistory)
    ? world.consolidatedHistory.filter((entry) => entry && entry.summary)
    : [];
    const boundaryRound = Number(chapters.at(-1)?.throughRound) || 0;
    const rounds = Array.isArray(world?.simulationHistory)
    ? world.simulationHistory.slice().reverse()
        .filter((entry) => entry && (entry.summary || entry.round))
        .filter((entry) => (Number(entry?.round) || 0) > boundaryRound)
    : [];
    const backstory = world?.backstory && typeof world.backstory === "object" ? world.backstory : null;

    const handleGenerate = async () => {
        if (isGenerating) return;
        setIsGenerating(true);
        setError("");
        try {
            await generateBackstory();
        } catch (err) {
            setError(err?.message || "Failed to generate the backstory.");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleExport = () => {
        const parts = [];
        chapters.forEach((entry, index) => {
            parts.push(`## Chapter ${index + 1} — through ${entry.throughDate || "?"}\n\n${entry.summary || ""}`);
        });
        if (backstory?.text) parts.push(`## The current chapter\n\n${backstory.text}`);
        for (const entry of rounds.slice().reverse()) {
            parts.push(`### Round ${entry.round ?? "?"} (${entry.fromDate || "?"} → ${entry.toDate || "?"})\n\n${entry.summary || ""}`);
        }
        const blob = new Blob([parts.join("\n\n---\n\n") || "No backstory yet."], { type: "text/markdown" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "backstory.md";
        link.click();
        URL.revokeObjectURL(url);
    };

    const chipStyle = {
        alignItems: "center",
        background: "rgba(255,255,255,0.06)",
        border: "1px solid rgba(255,255,255,0.14)",
        borderRadius: "8px",
        color: "rgba(255,255,255,0.85)",
        cursor: "pointer",
        display: "flex",
        fontSize: "0.75rem",
        gap: "0.35rem",
        padding: "0.35rem 0.75rem",
    };

    return (
        <div style={{ display: "flex", flex: 1, flexDirection: "column", minHeight: 0 }}>
        <div style={{ alignItems: "center", borderBottom: "1px solid rgba(255,255,255,0.08)", display: "flex", gap: "0.4rem", justifyContent: "flex-end", padding: "0.6rem 0.75rem" }}>
        <button type="button" onClick={handleGenerate} disabled={isGenerating} style={{ ...chipStyle, background: "rgba(109,40,217,0.2)", border: "1px solid rgba(139,92,246,0.45)", color: "rgba(196,165,255,0.95)", cursor: isGenerating ? "wait" : "pointer" }}>
        {isGenerating ? "Writing the story..." : (backstory?.text ? "Regenerate story" : "Generate story")}
        </button>
        <button type="button" onClick={handleExport} style={chipStyle}>
        Export
        </button>
        </div>

        {chapters.length > 0 && (
            <div style={{ borderBottom: "1px solid rgba(255,255,255,0.08)", display: "flex", flexShrink: 0, gap: "0.35rem", overflowX: "auto", padding: "0.55rem 0.75rem", scrollbarWidth: "thin" }}>
            {chapters.map((entry, index) => {
                const active = selectedChapter === index;
                return (
                    <button
                    key={`chapter-chip-${index}`}
                    type="button"
                    onClick={() => setSelectedChapter(active ? "current" : index)}
                    title={String(entry.summary).split("\n")[0]}
                    style={{
                        alignItems: "center",
                        background: active ? "rgba(14,116,144,0.35)" : "rgba(255,255,255,0.05)",
                        border: active ? "1px solid rgba(103,232,249,0.65)" : "1px solid rgba(255,255,255,0.12)",
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
                    <span style={{ color: active ? "rgba(165,243,252,0.95)" : "rgba(255,255,255,0.85)", fontSize: "0.74rem", fontWeight: 800 }}>{"§"}{index + 1}</span>
                    <span data-no-translate style={{ color: "rgba(255,255,255,0.45)", fontSize: "0.6rem", whiteSpace: "nowrap" }}>
                    ~{entry.throughDate || "?"}
                    </span>
                    </button>
                );
            })}
            <button
            type="button"
            onClick={() => setSelectedChapter("current")}
            style={{
                alignItems: "center",
                background: selectedChapter === "current" ? "rgba(109,40,217,0.3)" : "rgba(255,255,255,0.05)",
                border: selectedChapter === "current" ? "1px solid rgba(139,92,246,0.7)" : "1px solid rgba(255,255,255,0.12)",
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
            <span style={{ color: selectedChapter === "current" ? "rgba(196,165,255,0.95)" : "rgba(255,255,255,0.85)", fontSize: "0.74rem", fontWeight: 800 }}>Now</span>
            <span data-no-translate style={{ color: "rgba(255,255,255,0.45)", fontSize: "0.6rem", whiteSpace: "nowrap" }}>
            r{boundaryRound + 1}~
            </span>
            </button>
            </div>
        )}

        <div style={{ display: "flex", flex: 1, flexDirection: "column", gap: "0.9rem", minHeight: 0, overflowY: "auto", padding: "0.75rem", scrollbarWidth: "none" }}>
        {error && (
            <p style={{ background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "8px", color: "rgba(255,200,200,0.95)", fontSize: "0.78rem", margin: 0, padding: "0.5rem 0.7rem" }}>
            {error}
            </p>
        )}

        {typeof selectedChapter === "number" && chapters[selectedChapter] ? (
            <div>
            <div style={{ color: "rgba(165,243,252,0.85)", fontSize: "0.68rem", letterSpacing: "0.06em", marginBottom: "0.35rem", textTransform: "uppercase" }}>
            Chapter {selectedChapter + 1}
            <span data-no-translate style={{ color: "rgba(255,255,255,0.4)" }}>
            {" "}· ~{chapters[selectedChapter].throughDate || "?"}{chapters[selectedChapter].throughRound ? ` · ~round ${chapters[selectedChapter].throughRound}` : ""}
            </span>
            </div>
            <div style={{ color: "rgba(255,255,255,0.82)", fontSize: "0.85rem", lineHeight: "1.6", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
            {chapters[selectedChapter].summary}
            </div>
            </div>
        ) : backstory?.text ? (
            <div>
            <div style={{ color: "rgba(255,255,255,0.45)", fontSize: "0.68rem", letterSpacing: "0.06em", marginBottom: "0.35rem", textTransform: "uppercase" }}>
            {chapters.length > 0 ? "The current chapter" : "The story so far"}{backstory.generatedAt ? ` — up to ${backstory.generatedAt}` : ""}
            </div>
            <div className="advisor-markdown" style={{ color: "rgba(255,255,255,0.88)", fontSize: "0.85rem", lineHeight: "1.6" }}>
            <ReactMarkdown>{backstory.text}</ReactMarkdown>
            </div>
            </div>
        ) : (
            !isGenerating && (
                <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.85rem", margin: 0 }}>
                No story written yet. Generate one to turn everything that has happened so far into a chronicle.
                </p>
            )
        )}

        {selectedChapter === "current" && rounds.length > 0 && (
            <div>
            <div style={{ color: "rgba(255,255,255,0.45)", fontSize: "0.68rem", letterSpacing: "0.06em", marginBottom: "0.4rem", textTransform: "uppercase" }}>
            Round summaries — current chapter
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {rounds.map((entry, index) => (
                <div key={`${entry.round ?? "r"}-${index}`} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "10px", padding: "0.55rem 0.7rem" }}>
                <div style={{ color: "rgba(255,255,255,0.92)", fontSize: "0.76rem", fontWeight: 700 }}>
                Round {entry.round ?? "?"}{(entry.fromDate || entry.toDate) ? ` — ${entry.fromDate || "?"} → ${entry.toDate || "?"}` : ""}
                </div>
                {entry.summary && (
                    <div style={{ color: "rgba(255,255,255,0.72)", fontSize: "0.8rem", lineHeight: "1.5", marginTop: "0.25rem", whiteSpace: "pre-wrap" }}>
                    {entry.summary}
                    </div>
                )}
                </div>
            ))}
            </div>
            </div>
        )}
        </div>
        </div>
    );
};

// Reports pane — the advisor's fourth tab (Pax parity: secret reports). Reads
// world.secretReports, newest first: what the player's intelligence services
// delivered after each period and the newspapers never printed. Same lazy
// read-on-open shape as BackstoryPane, and strictly read-only — the reports are
// written by the turn's intelligence pass, never from here.
const REPORT_KIND_BADGES = {
    military: { emoji: "🎖️", label: "Military" },
    political: { emoji: "🏛️", label: "Political" },
    economic: { emoji: "💰", label: "Economic" },
    intelligence: { emoji: "🕵️", label: "Intelligence" },
    foreign: { emoji: "🌐", label: "Foreign" },
};

const ReportsPane = ({ active }) => {
    const [world, setWorld] = useState(null);

    useEffect(() => {
        if (!active) return undefined;
        let cancelled = false;
        readJson(JSON_URLS.world, { defaultValue: {}, force: true })
        .then((data) => { if (!cancelled) setWorld(data && typeof data === "object" ? data : {}); })
        .catch(() => { if (!cancelled) setWorld({}); });
        return () => { cancelled = true; };
    }, [active]);

    const reports = Array.isArray(world?.secretReports)
    ? world.secretReports.slice().reverse().filter((entry) => entry && entry.title && entry.body)
    : [];

    return (
        <div style={{ display: "flex", flex: 1, flexDirection: "column", minHeight: 0, overflowY: "auto", padding: "0.75rem", scrollbarWidth: "thin" }}>
        {reports.length === 0 && (
            <div style={{ color: "rgba(255,255,255,0.55)", fontSize: "0.85rem", lineHeight: 1.5, padding: "0.75rem 0.25rem" }}>
            No secret reports yet. Your intelligence services report after each period — what they learn stays between you and this desk.
            </div>
        )}
        {reports.map((report) => {
            const badge = REPORT_KIND_BADGES[report.kind] || REPORT_KIND_BADGES.intelligence;
            return (
                <div
                key={report.id || `${report.round}-${report.title}`}
                style={{
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "10px",
                    marginBottom: "0.6rem",
                    padding: "0.7rem 0.8rem",
                }}
                >
                <div style={{ alignItems: "center", display: "flex", gap: "0.45rem", marginBottom: "0.35rem" }}>
                <span style={{ background: "rgba(190,60,60,0.18)", border: "1px solid rgba(220,90,90,0.4)", borderRadius: "6px", color: "rgba(255,170,170,0.95)", fontSize: "0.66rem", fontWeight: 700, letterSpacing: "0.04em", padding: "0.12rem 0.4rem" }}>
                Secret
                </span>
                <span style={{ color: "rgba(255,255,255,0.7)", fontSize: "0.72rem" }}>
                {badge.emoji} {badge.label}
                </span>
                <span style={{ color: "rgba(255,255,255,0.45)", fontSize: "0.72rem", marginLeft: "auto" }}>
                {report.date || ""}
                </span>
                </div>
                <div style={{ color: "rgba(255,255,255,0.92)", fontSize: "0.88rem", fontWeight: 700, marginBottom: "0.3rem" }}>
                {report.title}
                </div>
                <div style={{ color: "rgba(255,255,255,0.78)", fontSize: "0.83rem", lineHeight: 1.55, whiteSpace: "pre-wrap" }}>
                {report.body}
                </div>
                {report.source && (
                    <div style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.74rem", fontStyle: "italic", marginTop: "0.4rem" }}>
                    Source: {report.source}
                    </div>
                )}
                </div>
            );
        })}
        </div>
    );
};

// Suggested prompts shown as chips above the advisor input — the quick topics
// Pax Historia offers under its advisor box. Shown until the situation-aware set
// arrives (generateAdvisorTopics), and used verbatim if it cannot be written.
const ADVISOR_PROMPTS = [
    "Assess our current strategic position",
    "What are the biggest threats to us right now?",
    "Suggest three concrete actions for this period",
    "How can we strengthen our economy?",
    "Which nations should we approach diplomatically?",
];

const AdvisorPanel = ({ isAdvisorOpen, onClose, width, onResize }) => {
    const [messages, setMessages]   = useState([]);
    const [input, setInput]         = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef            = useRef(null);
    const [hasOpened, setHasOpened] = useState(isAdvisorOpen);
    const [hasBootstrapped, setHasBootstrapped] = useState(false);
    // The situation-aware topic chips. Starts as the standing set so the panel is
    // never empty, and is replaced once the round's own questions arrive.
    const [topics, setTopics] = useState(ADVISOR_PROMPTS);
    const [activeTab, setActiveTab] = useState("advisor");
    // Which voice answers: the advisor (🧭) or world opinion (🌐 Perspectives).
    // One conversation, one history — the chip only swaps the system prompt and
    // tags the messages so a replayed transcript shows who spoke.
    const [advisorMode, setAdvisorMode] = useState("advisor");
    const inputRef = useRef(null);
    const [isResizing, setIsResizing] = useState(false);
    const [handleHover, setHandleHover] = useState(false);

    // Drag the drawer's left edge to resize it. The panel is docked right, so the
    // new width is simply (viewport width − pointer x); the parent (main.jsx) clamps
    // and persists it. Pointer capture keeps the drag alive if the cursor leaves the
    // 10px handle. Works for mouse, touch and pen.
    const handleResizeStart = React.useCallback((e) => {
        if (typeof onResize !== "function") return;
        e.preventDefault();
        const target = e.currentTarget;
        try { target.setPointerCapture(e.pointerId); } catch { /* not fatal */ }
        setIsResizing(true);
        const onMove = (ev) => onResize(window.innerWidth - ev.clientX);
        const onUp = () => {
            setIsResizing(false);
            target.removeEventListener("pointermove", onMove);
            target.removeEventListener("pointerup", onUp);
            target.removeEventListener("pointercancel", onUp);
        };
        target.addEventListener("pointermove", onMove);
        target.addEventListener("pointerup", onUp);
        target.addEventListener("pointercancel", onUp);
    }, [onResize]);
    // A reply already in the chat language must skip the UI translator, which
    // would render it back into the interface language.
    const chatDiffers = chatLanguageDiffersFromUi();
    const chatDir = chatDiffers && isRtlLanguage(resolveChatLanguage()) ? "rtl" : undefined;

    useEffect(() => {
        if (isAdvisorOpen) setHasOpened(true);
    }, [isAdvisorOpen]);

    useEffect(() => {
        if (!isAdvisorOpen || hasBootstrapped) return;
        let cancelled = false;
        loadMessages().then((saved) => {
            if (cancelled) return;
            if (saved.length > 0) {
                setMessages(saved);
                loadHistory(saved);   // restore advisor history — no prompt arg = advisor mode
            } else {
                startChat();          // fresh start — no prompt arg = advisor mode
            }
            setHasBootstrapped(true);
        });
        return () => { cancelled = true; };
    }, [hasBootstrapped, isAdvisorOpen]);

    // Written once per round and cached on the world state, so opening the panel
    // again in the same round costs nothing. Deliberately NOT awaited alongside the
    // transcript above — the panel opens immediately with the standing chips and
    // swaps them in when they are ready.
    useEffect(() => {
        if (!isAdvisorOpen) return undefined;
        let cancelled = false;
        generateAdvisorTopics()
            .then((next) => {
                if (!cancelled && Array.isArray(next) && next.length > 0) setTopics(next);
            })
            .catch(() => { /* the standing chips stay */ });
        return () => { cancelled = true; };
    }, [isAdvisorOpen]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const resizeTextarea = React.useCallback(() => {
        const el = inputRef.current;
        if (!el) {
            return;
        }

        el.style.height = "0";
        el.style.height = `${Math.min(el.scrollHeight, 300)}px`;
    }, []);

    React.useEffect(() => {
        resizeTextarea();
    }, [input, resizeTextarea]);

    // Accepts an optional preset string so the suggested-topic chips can ask
    // directly; a click event (non-string) falls back to the typed input.
    const handleSend = async (presetText) => {
        const text = (typeof presetText === "string" ? presetText : input).trim();
        if (!text || isLoading) return;

        const { gameDate } = await readJson(JSON_URLS.game, {
            defaultValue: { gameDate: null },
            force: true,
        }).catch(() => ({ gameDate: null }));

        // The mode is captured at send time so flipping the chip mid-stream
        // cannot relabel a reply that was asked in the other register.
        const mode = advisorMode === "perspectives" ? "perspectives" : undefined;
        const modeTag = mode ? { mode } : {};
        const userMessage = { role: "user", text, time: gameDate, ...modeTag };
        setInput("");
        setMessages(prev => [...prev, userMessage]);
        setIsLoading(true);

        // Streaming: the ThinkingDots show until the first token, then a live
        // advisor bubble fills as tokens arrive. It carries a `streaming` flag so
        // it can be found and finalised; intermediate text is NOT persisted.
        const showStreaming = (fullText) => setMessages(prev => {
            const next = prev.slice();
            const last = next[next.length - 1];
            if (last && last.role === "advisor" && last.streaming) {
                next[next.length - 1] = { ...last, text: fullText };
            } else {
                next.push({ role: "advisor", text: fullText, time: gameDate, streaming: true, ...modeTag });
            }
            return next;
        });

        try {
            // The live bubble is stripped too, so the title never even flashes on
            // screen before the finished reply replaces it.
            const reply = await sendMessage(text, { mode, onChunk: (_delta, full) => showStreaming(stripPlayerHonorific(full)) });
            setMessages(prev => {
                const next = prev.slice();
                const last = next[next.length - 1];
                // Finalise the streaming bubble, or append the full reply if the
                // provider never streamed a chunk.
                if (last && last.role === "advisor" && last.streaming) {
                    next[next.length - 1] = { role: "advisor", text: reply, time: gameDate, ...modeTag };
                } else {
                    next.push({ role: "advisor", text: reply, time: gameDate, ...modeTag });
                }
                saveMessages(next);
                return next;
            });
        } catch (err) {
            setMessages(prev => {
                const last = prev[prev.length - 1];
                const base = last && last.role === "advisor" && last.streaming ? prev.slice(0, -1) : prev.slice();
                const updated = [...base, { role: "error", text: err.message, time: gameDate }];
                saveMessages(updated);
                return updated;
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return "";
        return new Date(dateStr).toLocaleDateString([], { year: "numeric", month: "short", day: "numeric" });
    };

    if (!hasOpened) return null;

    return (
        <>
        <MarkdownStyleInjector />
        <div style={{
            position: "fixed", bottom: 0, right: 0,
            // Slide via transform: the old right: calc(-min(...) - 1rem) was
            // INVALID CSS (a min() can't be negated like that), so the closed
            // position was silently dropped and the drawer never slid away.
            transform: isAdvisorOpen ? "translateX(0)" : "translateX(calc(100% + 2rem))",
            // Full height now the in-game top bar is gone — it used to stop 64px
            // (the old BAR_HEIGHT) short of the top to clear it. Anchored bottom: 0
            // above, so height: 100vh reaches the top edge.
            width: typeof width === "number" ? `${width}px` : ADVISOR_PANEL_WIDTH, height: "100vh",
            backgroundColor: "rgba(17, 24, 39, 0.95)", backdropFilter: "blur(8px)",
            // Above every HUD button/panel (toolbar 9999, forces 10000,
            // library panels 10031) so nothing covers the open drawer on
            // phones; below the editor (10050) and server-down (10060) overlays.
            zIndex: 10040, borderLeft: "1px solid rgba(255,255,255,0.1)",
            boxShadow: "-4px 0 24px rgba(0,0,0,0.4)",
            transition: "transform 0.35s cubic-bezier(0.4, 0, 0.2, 1)",
            display: "flex", flexDirection: "column",
            color: "white", fontFamily: "sans-serif", overflow: "hidden",
        }}>
        {/* Drag the left edge to resize the drawer (main.jsx clamps + persists). */}
        {typeof onResize === "function" && (
            <div
                onPointerDown={handleResizeStart}
                onPointerEnter={() => setHandleHover(true)}
                onPointerLeave={() => setHandleHover(false)}
                title="Drag to resize"
                style={{
                    position: "absolute", left: 0, top: 0, bottom: 0, width: "10px",
                    cursor: "ew-resize", zIndex: 30, touchAction: "none",
                    display: "flex", alignItems: "center", justifyContent: "center",
                }}
            >
                <div style={{
                    width: "3px", height: "42px", borderRadius: "2px",
                    backgroundColor: isResizing
                        ? "rgba(96,165,250,0.95)"
                        : handleHover ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.22)",
                    transition: "background-color 0.15s",
                }} />
            </div>
        )}
        {/* Header: tabs to flip between the advisor chat and national stats. */}
        <div style={{ alignItems: "center", borderBottom: "1px solid rgba(255,255,255,0.1)", display: "flex", padding: "0 0.75rem 0 0.35rem" }}>
        <TabButton icon="🧭" label="Advisor" active={activeTab === "advisor"} onClick={() => setActiveTab("advisor")} />
        <TabButton icon="📊" label="Stats" active={activeTab === "stats"} onClick={() => setActiveTab("stats")} />
        <TabButton icon="📜" label="Backstory" active={activeTab === "backstory"} onClick={() => setActiveTab("backstory")} />
        <TabButton icon="🕵️" label="Reports" active={activeTab === "reports"} onClick={() => setActiveTab("reports")} />
        <div style={{ flex: 1 }} />
        {activeTab === "advisor" && (
            <button
            onClick={async () => { setMessages([]); startChat(); await saveMessages([]); }}
            title="Clear chat"
            style={{ background: "none", border: "none", color: "rgba(255,255,255,0.4)", cursor: "pointer", fontSize: "1.35rem", lineHeight: 1, padding: 0, display: "flex", alignItems: "center" }}
            >🗑</button>
        )}
        {/* On phones the panel slides over the 🧭 launcher, making it
            untappable — this ✕ is the way out. */}
        {onClose && (
            <button
            onClick={onClose}
            title="Close advisor"
            style={{ background: "none", border: "none", color: "rgba(255,255,255,0.55)", cursor: "pointer", fontSize: "1.35rem", lineHeight: 1, padding: "0 0 0 0.5rem", display: "flex", alignItems: "center" }}
            >✕</button>
        )}
        </div>

        {/* National stats pane — kept mounted so flipping tabs is instant. */}
        <div style={{ display: activeTab === "stats" ? "flex" : "none", flex: 1, flexDirection: "column", minHeight: 0 }}>
        <StatsPane active={isAdvisorOpen && activeTab === "stats"} />
        </div>

        {/* Backstory pane — the campaign chronicle, as in Pax Historia. */}
        <div style={{ display: activeTab === "backstory" ? "flex" : "none", flex: 1, flexDirection: "column", minHeight: 0 }}>
        <BackstoryPane active={isAdvisorOpen && activeTab === "backstory"} />
        </div>

        {/* Reports pane — secret intelligence delivered after each period. */}
        <div style={{ display: activeTab === "reports" ? "flex" : "none", flex: 1, flexDirection: "column", minHeight: 0 }}>
        <ReportsPane active={isAdvisorOpen && activeTab === "reports"} />
        </div>

        <div style={{ display: activeTab === "advisor" ? "flex" : "none", flex: 1, flexDirection: "column", minHeight: 0 }}>
        {/* Messages */}
        <div style={{ padding: "0.75rem", flex: 1, minHeight: 0, overflowY: "auto", display: "flex", flexDirection: "column", gap: "1rem", scrollbarWidth: "none" }}>
        {messages.length === 0 && (
            <p style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.5)", marginTop: 0 }}>
            No messages yet. Ask your advisor something!
            </p>
        )}

        {messages.map((msg, i) => {
            const { text, chartConfig } = msg.role === "advisor"
            ? parseMessage(msg.text)
            : { text: msg.text, chartConfig: null };
            const asWritten = msg.role === "advisor" && chatDiffers;
            return (
                <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: msg.role === "user" ? "flex-end" : "flex-start" }}>
                {msg.role !== "user" && (
                    <span style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.4)", marginBottom: "0.25rem" }}>
                    {msg.role === "error" ? "⚠️ Error" : msg.mode === "perspectives" ? "🌐 World Opinion" : "🧭 Advisor"}
                    </span>
                )}
                {/* Nothing in this bubble is ever machine-translated. The player's own
                    text must stay verbatim, and the advisor's reply already ARRIVES in
                    the player's language — callAI pins it (chatLanguageDirective). This
                    used to be conditional on the chat language DIFFERING from the UI
                    language, so in the ordinary case where they match, every reply was
                    fed back through the translation model: it corrupted the Korean it
                    was given, and it did so token by token as the reply streamed in,
                    fighting the advisor for the same GPU. */}
                <div data-no-translate="" dir={asWritten ? chatDir : undefined} style={{
                    maxWidth: "90%", width: chartConfig ? "90%" : undefined,
                    padding: "0.6rem 0.85rem",
                    borderRadius: msg.role === "user" ? "12px 12px 2px 12px" : "12px 12px 12px 2px",
                    backgroundColor: msg.role === "user" ? "#3b82f6" : msg.role === "error" ? "rgba(239,68,68,0.2)" : "rgba(255,255,255,0.08)",
                    fontSize: "0.85rem", lineHeight: "1.5", whiteSpace: "pre-wrap", wordBreak: "break-word",
                    border: msg.role === "error" ? "1px solid rgba(239,68,68,0.3)" : "none",
                    boxSizing: "border-box",
                }}>
                {msg.role === "user" ? text : (
                    <div className="advisor-markdown"><ReactMarkdown>{text}</ReactMarkdown></div>
                )}
                {chartConfig && <AdvisorChart config={chartConfig} />}
                </div>
                {msg.time && msg.role !== "user" && (
                    <span style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.3)", marginTop: "0.25rem" }}>
                    {formatDate(msg.time)}
                    </span>
                )}
                </div>
            );
        })}

        {isLoading && !(messages[messages.length - 1]?.role === "advisor" && messages[messages.length - 1]?.streaming) && (
            <div style={{ display: "flex", alignItems: "flex-start", flexDirection: "column", gap: "0.25rem" }}>
            <span style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.4)" }}>{advisorMode === "perspectives" ? "🌐 World Opinion" : "🧭 Advisor"}</span>
            <div style={{ padding: "0.6rem 0.85rem", borderRadius: "12px 12px 12px 4px", backgroundColor: "rgba(255,255,255,0.08)", fontSize: "0.85rem" }}>
            <ThinkingDots />
            </div>
            </div>
        )}
        <div ref={messagesEndRef} />
        </div>

        {/* Suggested topics (Pax Historia-style): one tap asks the advisor. Written
            for the CURRENT situation, once a round, already in the player's language
            — hence data-no-translate, which is also what stops five chips being
            re-translated on every render. */}
        <div data-no-translate="" style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", padding: "0.6rem 1rem 0" }}>
        {topics.map((prompt) => (
            <button
            key={prompt}
            type="button"
            disabled={isLoading}
            onClick={() => handleSend(prompt)}
            style={{
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.14)",
                borderRadius: "999px",
                color: "rgba(255,255,255,0.8)",
                cursor: isLoading ? "not-allowed" : "pointer",
                fontSize: "0.72rem",
                opacity: isLoading ? 0.5 : 1,
                padding: "0.3rem 0.7rem",
                transition: "background 0.15s, border-color 0.15s",
            }}
            onMouseEnter={(e) => { if (!isLoading) { e.currentTarget.style.background = "rgba(59,130,246,0.22)"; e.currentTarget.style.borderColor = "rgba(59,130,246,0.5)"; } }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.14)"; }}
            >
            {prompt}
            </button>
        ))}
        </div>

        {/* Voice chips (Pax parity: Perspectives). One conversation, two
            registers — the advisor's counsel, or the world's public reaction. */}
        <div style={{ display: "flex", gap: "0.4rem", padding: "0.6rem 1rem 0" }}>
        {[
            { id: "advisor", icon: "🧭", label: "Advice" },
            { id: "perspectives", icon: "🌐", label: "World Opinion" },
        ].map((chip) => {
            const active = advisorMode === chip.id;
            return (
                <button
                key={chip.id}
                type="button"
                onClick={() => setAdvisorMode(chip.id)}
                style={{
                    background: active ? "rgba(59,130,246,0.25)" : "rgba(255,255,255,0.05)",
                    border: active ? "1px solid rgba(59,130,246,0.6)" : "1px solid rgba(255,255,255,0.12)",
                    borderRadius: "999px",
                    color: active ? "rgba(191,219,254,0.95)" : "rgba(255,255,255,0.6)",
                    cursor: "pointer",
                    fontSize: "0.72rem",
                    fontWeight: active ? 700 : 500,
                    padding: "0.3rem 0.75rem",
                    transition: "background 0.15s, border-color 0.15s",
                }}
                >
                {chip.icon} {chip.label}
                </button>
            );
        })}
        </div>

        {/* Input */}
        <div style={{ padding: "1rem", borderTop: "1px solid rgba(255,255,255,0.1)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <textarea
        ref={inputRef}
        placeholder={advisorMode === "perspectives" ? "Ask how the world is reacting…  (Shift+Enter for a new line)" : "Ask your advisor…  (Shift+Enter for a new line)"}
        rows={1} value={input}
        onChange={e => {
            setInput(e.target.value);
            resizeTextarea();
        }}
        onKeyDown={handleKeyDown}
        style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.2)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: "10px", color: "white", fontSize: "0.875rem", padding: "0.6rem 0.75rem", resize: "none", outline: "none", fontFamily: "sans-serif", lineHeight: "1.5", overflowY: "auto", scrollbarWidth: "none", transition: "border-color 0.2s" }}
        onFocus={e => e.target.style.borderColor = "rgba(59,130,246,0.6)"}
        onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.15)"}
        />
        <button
        onClick={handleSend} disabled={isLoading || !input.trim()}
        style={{ backgroundColor: isLoading || !input.trim() ? "rgba(59,130,246,0.4)" : "#3b82f6", border: "none", borderRadius: "10px", width: "2.5rem", height: "2.5rem", display: "flex", alignItems: "center", justifyContent: "center", cursor: isLoading || !input.trim() ? "not-allowed" : "pointer", flexShrink: 0, fontSize: "1rem", transition: "background-color 0.2s" }}
        onMouseEnter={e => { if (!isLoading && input.trim()) e.currentTarget.style.backgroundColor = "#2563eb"; }}
        onMouseLeave={e => { if (!isLoading && input.trim()) e.currentTarget.style.backgroundColor = "#3b82f6"; }}
        >🚀</button>
        </div>
        </div>
        </div>
        </>
    );
};

const markdownStyles = `
.advisor-markdown p { margin: 0 0 0.5rem 0; }
.advisor-markdown p:last-child { margin-bottom: 0; }
.advisor-markdown ul, .advisor-markdown ol { margin: 0.25rem 0 0.5rem 1.25rem; padding: 0; }
.advisor-markdown li { margin-bottom: 0.2rem; }
.advisor-markdown strong { color: rgba(255,255,255,0.95); }
.advisor-markdown em { color: rgba(255,255,255,0.75); }
.advisor-markdown code { background: rgba(0,0,0,0.3); padding: 0.1rem 0.35rem; border-radius: 4px; font-size: 0.8rem; }
.advisor-markdown pre { background: rgba(0,0,0,0.3); padding: 0.75rem; border-radius: 8px; overflow-x: auto; margin: 0.5rem 0; }
.advisor-markdown h1, .advisor-markdown h2, .advisor-markdown h3 { margin: 0.75rem 0 0.25rem; font-size: 0.95rem; color: rgba(255,255,255,0.9); }
.advisor-markdown blockquote { border-left: 2px solid rgba(59,130,246,0.6); margin: 0.5rem 0; padding-left: 0.75rem; color: rgba(255,255,255,0.6); }
`;

const MarkdownStyleInjector = () => {
    useEffect(() => {
        if (!document.getElementById("advisor-md-styles")) {
            const style = document.createElement("style");
            style.id = "advisor-md-styles";
            style.textContent = markdownStyles;
            document.head.appendChild(style);
        }
    }, []);
    return null;
};

export { ADVISOR_PANEL_WIDTH, AdvisorButton, AdvisorPanel };

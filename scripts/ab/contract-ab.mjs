// A/B: do the six common contracts actually change what the 12B produces?
//
// Cowork's question (WORKLOG 2026-08-09, item ③): simulationRules now run
// 10-12k characters because six shared contracts append ~6,500 of them, and
// nobody has measured whether that helps or just crowds the era-specific rules
// out of a local 12B's attention.
//
// Method: the SAME turn, twice, changing only whether the contracts are in the
// system prompt. Grade the output against the clauses themselves — not against
// "is it longer" — because a contract that is obeyed without being present is a
// contract earning nothing, and one that is present and ignored is a contract
// the model cannot carry.
import fs from "node:fs";

const ROOT = "C:/Users/USER/Desktop/Open-Historia";
const ENDPOINT = "http://localhost:11434/v1/chat/completions";
const MODEL = "gemma4-oh:12b";
const SCENARIO = process.argv[2] ?? "wwii-1939";
const RUNS = Number(process.argv[3] ?? 2);

const world = JSON.parse(fs.readFileSync(`${ROOT}/server/data/scenarios/${SCENARIO}/world.json`, "utf8"));
const withContracts = world.simulationRules;

// The contracts are appended verbatim by build-preset, in this order, so the
// "off" arm is the rules with each block cut out — identical to rebuilding the
// spec with every opt-out set, without a ten-minute fleet rebuild.
const MARKERS = [
  "HOW REGIONS WORK HERE",
  "EVERYTHING BEFORE THE START DATE HAPPENED AS IT REALLY DID.",
  "THE PLAYER'S COUNTRY DOES NOTHING THE PLAYER DID NOT ORDER.",
  "VOICES WITH NO GROUND.",
  "END EVERY TURN WITH WHAT IS ALREADY ON THE CALENDAR.",
  "A BATTLE IS REPORTED WITH NUMBERS.",
];
const cut = withContracts.indexOf(MARKERS[0]);
if (cut < 0) throw new Error("contract block not found — did the wording change?");
const withoutContracts = withContracts.slice(0, cut).trim();

const TURN = [
  "Simulate 1 September 1939 to 1 November 1939 for this world.",
  "The player is Germany and has ordered: press the Polish campaign to a conclusion.",
  "",
  "Return JSON only, exactly: {\"events\":[{\"title\":\"\",\"date\":\"YYYY-MM-DD\",\"description\":\"\"}]}",
  "Cover the period. Decide for yourself how many events that takes and what belongs in them.",
].join("\n");

const ask = async (rules) => {
  const started = Date.now();
  const response = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: "system", content: `You simulate a turn-based grand strategy game.\n\n[Simulation Rules]\n${rules}` },
        { role: "user", content: TURN },
      ],
      temperature: 0.7,
      stream: false,
    }),
  });
  const json = await response.json();
  const text = json?.choices?.[0]?.message?.content ?? "";
  return { text, seconds: Math.round((Date.now() - started) / 1000) };
};

// ── grading ──────────────────────────────────────────────────────────────────
const parseEvents = (text) => {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start < 0 || end <= start) return [];
  try {
    return JSON.parse(text.slice(start, end + 1))?.events ?? [];
  } catch { return []; }
};

// A figure that is a QUANTITY, not a date or a coordinate.
const FIGURE = /\b\d{1,3}(?:[.,]\d{3})+\b|\b\d+\s*(?:men|soldiers|troops|casualties|killed|wounded|dead|prisoners|tanks|aircraft|planes|divisions|regiments|battalions|ships|guns)\b|\b(?:men|soldiers|troops|casualties|killed|wounded|dead|prisoners|tanks|aircraft|planes|divisions|regiments|battalions|ships|guns)\D{0,12}\d+/i;
const COMBAT = /battl|assault|siege|offensiv|attack|bomb|raid|advanc|encircl|surrender|fighting|invasion|landing|campaign|front|fell|captur|defen[cs]|troops|army|forces/i;
const PLAYER = /german|germany|wehrmacht|reich|berlin|hitler|luftwaffe|panzer/i;

const grade = (text) => {
  const events = parseEvents(text);
  const combat = events.filter((e) => COMBAT.test(`${e.title} ${e.description}`));
  const withFigures = combat.filter((e) => FIGURE.test(`${e.title} ${e.description}`));
  const playerSide = events.filter((e) => PLAYER.test(`${e.title} ${e.description}`));
  const scheduled = events.some((e) => /scheduled events/i.test(e.title ?? ""));
  return {
    events: events.length,
    combat: combat.length,
    combatWithFigures: withFigures.length,
    figureRate: combat.length ? +(withFigures.length / combat.length).toFixed(2) : null,
    playerShare: events.length ? +(playerSide.length / events.length).toFixed(2) : null,
    scheduledCard: scheduled,
    parsed: events.length > 0,
  };
};

// A third arm to tell "the clause is bad" apart from "the block is too long":
// era rules plus ONE contract, nothing else. If a clause is obeyed alone and
// ignored inside the block, the block is crowding it out and the answer is
// compression, not deletion.
const soloAt = withContracts.indexOf("END EVERY TURN WITH WHAT IS ALREADY ON THE CALENDAR.");
const soloEnd = withContracts.indexOf("A BATTLE IS REPORTED WITH NUMBERS.");
const soloScheduled = `${withoutContracts}

${withContracts.slice(soloAt, soloEnd).trim()}`;
const soloBattle = `${withoutContracts}

${withContracts.slice(soloEnd).trim()}`;

const arms = [["ON ", withContracts], ["OFF", withoutContracts],
  ["SCHED-ONLY", soloScheduled], ["BATTLE-ONLY", soloBattle]];
console.log(`scenario ${SCENARIO} · model ${MODEL} · ${RUNS} run(s) per arm`);
console.log(`rules: contracts ON ${withContracts.length} chars · OFF ${withoutContracts.length} chars\n`);

const results = {};
for (const [label, rules] of arms) {
  results[label] = [];
  for (let run = 1; run <= RUNS; run += 1) {
    const { text, seconds } = await ask(rules);
    const g = grade(text);
    results[label].push({ ...g, seconds });
    console.log(`${label} run ${run}: ${seconds}s · events ${g.events} · combat ${g.combat}`
      + ` · with figures ${g.combatWithFigures} (${g.figureRate ?? "n/a"})`
      + ` · player share ${g.playerShare ?? "n/a"} · scheduled card ${g.scheduledCard ? "yes" : "no"}`);
    fs.writeFileSync(`${process.env.TMPDIR ?? "."}/ab-${label.trim()}-${run}.txt`, text, "utf8");
  }
}

const mean = (rows, key) => {
  const values = rows.map((r) => r[key]).filter((v) => typeof v === "number");
  return values.length ? +(values.reduce((a, b) => a + b, 0) / values.length).toFixed(2) : null;
};
console.log("\n── mean ──");
for (const [label] of arms) {
  const rows = results[label];
  console.log(`${label}: figureRate ${mean(rows, "figureRate")} · playerShare ${mean(rows, "playerShare")}`
    + ` · events ${mean(rows, "events")} · seconds ${mean(rows, "seconds")}`
    + ` · scheduled ${rows.filter((r) => r.scheduledCard).length}/${rows.length}`);
}

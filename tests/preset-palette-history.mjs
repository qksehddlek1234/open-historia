// Telling a stale colour from one somebody chose.
//
// The palette forks: a campaign past its first turn holds its own colors.json
// and world.json registry, so a board recoloured afterwards never reaches it.
// magna-1444's 63 recoloured polities were the case that raised it. The rules
// manifest already answers the same question for board text; this is the same
// doctrine one entry at a time, and these are the pins that keep it from
// answering "yes, overwrite it" when it does not know.
//
// The two halves are tested against different things on purpose. The verdicts
// are pinned on synthetic history, so a change in the shipped manifest cannot
// make them pass by accident; the migration is run end to end against the REAL
// manifest and a real recolour (Byzantine Empire, 7a5aa0 → 890685 on
// magna-1444), because a migration that only ever meets fixtures is a migration
// whose file paths have never been checked.
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import url from "node:url";
import os from "node:os";
import { execFileSync } from "node:child_process";
import {
  PALETTE,
  PALETTE_COPY,
  normalizeColor,
  reconcilePalette,
  samePalette,
  shippedColors,
} from "../src/runtime/paletteHistory.js";

let pass = 0;
const pending = [];
const test = (name, fn) => { pending.push(Promise.resolve(fn()).then(() => { pass += 1; console.log(`  ok  ${name}`); })); };
const ROOT = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), "..");
const SCENARIOS = path.join(ROOT, "server", "data", "scenarios");
const HISTORY = path.join(ROOT, "data", "palette-history.json");

const verdictFor = (result, copy, name) =>
  result.entries.find((entry) => entry.copy === copy && entry.name === name)?.verdict;

console.log("\nOne colour, five notations");

test("every notation this codebase writes reduces to the same six hex digits", () => {
  for (const value of ["#9F0500", "9f0500", [159, 5, 0], "rgb(159, 5, 0)", "rgba(159,5,0,0.5)"]) {
    assert.equal(normalizeColor(value), "9f0500", `${JSON.stringify(value)} did not normalize`);
  }
  assert.equal(normalizeColor("#abc"), "aabbcc", "the three-digit form the map's own parser accepts");
});

test("a value that is not a colour is empty, never a guess", () => {
  // Empty is what makes an entry `absent` — reported, never written. A guess
  // here would be a colour invented for a polity and then written to disk.
  for (const value of ["", null, undefined, "red", [1, 2], [999, 0, 0], {}, "#12345"]) {
    assert.equal(normalizeColor(value), "", `${JSON.stringify(value)} was read as a colour`);
  }
});

console.log("\nThe verdicts");

const HISTORY_FIXTURE = {
  base: { Portugal: ["111111"] },
  boards: { "test-board": { Bohemia: ["aaaaaa", "bbbbbb"], Portugal: ["222222"] } },
};
const reconcile = (saveColors, scenarioColors, history = HISTORY_FIXTURE) => reconcilePalette({
  save: { colors: saveColors, world: null },
  scenario: { colors: scenarioColors, world: null },
  board: "test-board",
  history,
});

test("a colour the board actually shipped is stale and may be moved", () => {
  const result = reconcile({ Bohemia: "#aaaaaa" }, { Bohemia: "#bbbbbb" });
  assert.equal(verdictFor(result, PALETTE_COPY.colors, "Bohemia"), PALETTE.refreshed);
});

test("a colour the board NEVER shipped belongs to whoever chose it", () => {
  const result = reconcile({ Bohemia: "#c0ffee" }, { Bohemia: "#bbbbbb" });
  assert.equal(verdictFor(result, PALETTE_COPY.colors, "Bohemia"), PALETTE.authored,
    "the cheat editor and an AI polityChange both land here");
});

test("a polity with no recorded history is left alone, not guessed at", () => {
  const result = reconcile({ Bavaria: "#c0ffee" }, { Bavaria: "#bbbbbb" });
  assert.equal(verdictFor(result, PALETTE_COPY.colors, "Bavaria"), PALETTE.unknown);
});

test("a board with no manifest row at all decides nothing", () => {
  const result = reconcile({ Bohemia: "#aaaaaa" }, { Bohemia: "#bbbbbb" }, { boards: {} });
  assert.equal(verdictFor(result, PALETTE_COPY.colors, "Bohemia"), PALETTE.unknown);
});

test("a save already on the board's colour is current", () => {
  const result = reconcile({ Bohemia: [187, 187, 187] }, { Bohemia: "#bbbbbb" });
  assert.equal(verdictFor(result, PALETTE_COPY.colors, "Bohemia"), PALETTE.current,
    "[r,g,b] against #rrggbb is one colour, not a disagreement");
});

test("a polity the campaign minted is its own and has nowhere to move", () => {
  const result = reconcile({ "Free Bohemia": "#123456" }, {});
  assert.equal(verdictFor(result, PALETTE_COPY.colors, "Free Bohemia"), PALETTE.minted);
});

test("a polity the board grew after the save started is reported, not added", () => {
  const result = reconcile({}, { Silesia: "#123456" });
  assert.equal(verdictFor(result, PALETTE_COPY.colors, "Silesia"), PALETTE.absent);
});

test("the board's own row wins over the shared floor", () => {
  // Portugal is in both. If the floor were merged in, a save holding 111111
  // would read as stale on a board that has only ever shipped 222222.
  assert.deepEqual(shippedColors(HISTORY_FIXTURE, "test-board", "Portugal"), ["222222"]);
  assert.deepEqual(shippedColors(HISTORY_FIXTURE, "other-board", "Portugal"), ["111111"],
    "a board with no row of its own inherits the floor");
  const result = reconcile({ Portugal: "#111111" }, { Portugal: "#333333" });
  assert.equal(verdictFor(result, PALETTE_COPY.colors, "Portugal"), PALETTE.authored);
});

console.log("\nTwo copies, judged apart");

test("colors.json and the registry are decided on their own values", () => {
  const result = reconcilePalette({
    save: { colors: { Bohemia: "#aaaaaa" }, world: { polityOverrides: { Bohemia: { name: "Bohemia", color: "#c0ffee" } } } },
    scenario: { colors: { Bohemia: "#bbbbbb" }, world: { polityOverrides: { Bohemia: { name: "Bohemia", color: "#bbbbbb" } } } },
    board: "test-board",
    history: HISTORY_FIXTURE,
  });
  assert.equal(verdictFor(result, PALETTE_COPY.colors, "Bohemia"), PALETTE.refreshed, "stale in the palette");
  assert.equal(verdictFor(result, PALETTE_COPY.registry, "Bohemia"), PALETTE.authored, "chosen in the registry");
});

test("a save with no colors.json of its own is not walked as a file full of holes", () => {
  // It has no copy — it reads the board live and is already current. Judging it
  // would report the entire board palette as missing from the most up-to-date
  // save there is.
  const result = reconcilePalette({
    save: { colors: null, world: { polityOverrides: {} } },
    scenario: { colors: { Bohemia: "#bbbbbb" }, world: { polityOverrides: {} } },
    board: "test-board",
    history: HISTORY_FIXTURE,
  });
  assert.equal(result.entries.filter((entry) => entry.copy === PALETTE_COPY.colors).length, 0);
  assert.equal(result.tally.absent, 0);
});

console.log("\nThe guard that stops new forks");

test("two spellings of the same palette are the same palette", () => {
  assert.equal(samePalette({ Bohemia: [170, 170, 170] }, { Bohemia: "#AAAAAA" }), true);
  assert.equal(samePalette({ Bohemia: "#aaaaaa" }, { Bohemia: "#bbbbbb" }), false);
  assert.equal(samePalette({ Bohemia: "#aaaaaa" }, { Bohemia: "#aaaaaa", Bavaria: "#aaaaaa" }), false,
    "a minted polity is a change even though nothing moved");
});

test("the turn's palette write stays behind the change guard", () => {
  // Not decoration: without it every campaign forks its palette on turn one and
  // no board recolour can ever reach a running game again. If this line is
  // rewritten, the fork comes back silently — nothing else in the suite sees it.
  const source = fs.readFileSync(path.join(ROOT, "src", "Game", "AI", "gameplay.js"), "utf8");
  assert.match(source, /paletteChanged \? writeJson\(JSON_URLS\.colors/,
    "the per-turn colors.json write must stay conditional on samePalette");
});

console.log("\nAgainst the shipped manifest");

const manifest = fs.existsSync(HISTORY) ? JSON.parse(fs.readFileSync(HISTORY, "utf8")) : null;

test("every built board's CURRENT palette is in the manifest", () => {
  // If today's build is missing, a campaign that is up to date reads as authored
  // the moment the board is recoloured again — untouchable for the wrong reason.
  if (!manifest || !fs.existsSync(SCENARIOS)) {
    console.log("      (manifest or fleet not built — skipped)");
    return;
  }
  const missing = [];
  for (const id of fs.readdirSync(SCENARIOS)) {
    const colorsPath = path.join(SCENARIOS, id, "colors.json");
    if (!fs.existsSync(colorsPath)) continue;
    for (const [name, value] of Object.entries(JSON.parse(fs.readFileSync(colorsPath, "utf8")))) {
      const hex = normalizeColor(value);
      if (!hex) continue;
      if (!shippedColors(manifest, id, name).includes(hex)) missing.push(`${id}/${name}`);
    }
  }
  assert.deepEqual(missing.slice(0, 10), [],
    `${missing.length} shipped colours are absent from the manifest — re-run build-palette-history.mjs after a rebuild`);
});

test("the manifest records the magna-1444 recolour rather than only its result", () => {
  if (!manifest) {
    console.log("      (manifest not built — skipped)");
    return;
  }
  const board = manifest.boards?.["magna-1444"] ?? {};
  const recoloured = Object.values(board).filter((list) => list.length > 1).length;
  assert.ok(recoloured >= 60,
    `only ${recoloured} magna-1444 polities have shipped more than one colour; the 63-polity recolour is the reason this file exists`);
});

console.log("\nThe migration, end to end");

test("a fixture campaign is recoloured where it is stale and left alone where it is not", () => {
  const scenarioColors = path.join(SCENARIOS, "magna-1444", "colors.json");
  if (!manifest || !fs.existsSync(scenarioColors)) {
    console.log("      (magna-1444 not built — skipped)");
    return;
  }
  const shipped = shippedColors(manifest, "magna-1444", "Byzantine Empire");
  const current = normalizeColor(JSON.parse(fs.readFileSync(scenarioColors, "utf8"))["Byzantine Empire"]);
  const stale = shipped.find((hex) => hex !== current);
  assert.ok(stale, "magna-1444 has shipped more than one Byzantine colour — that is what makes this testable");

  // A temp games directory, never the repo's. The same path on the play machine
  // holds live campaigns, and a suite that crashes mid-test would leave a
  // phantom one in a library somebody is playing.
  const games = fs.mkdtempSync(path.join(os.tmpdir(), "oh-palette-"));
  const dir = path.join(games, "zz-palette-fixture");
  try {
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, "game-instance.json"), JSON.stringify({ id: "zz-palette-fixture", scenarioId: "magna-1444" }));
    fs.writeFileSync(path.join(dir, "colors.json"), JSON.stringify({
      "Byzantine Empire": [...Array(3)].map((_, i) => Number.parseInt(stale.slice(i * 2, i * 2 + 2), 16)),
      "Ottoman Empire": [1, 2, 3],
    }));
    fs.writeFileSync(path.join(dir, "world.json"), JSON.stringify({
      polityOverrides: {
        "Byzantine Empire": { name: "Byzantine Empire", color: `#${stale}`, note: "kept" },
        "Ottoman Empire": { name: "Ottoman Empire", color: "#010203" },
      },
    }));

    const run = (...args) => execFileSync("node", [
      path.join(ROOT, "scripts", "presets", "migrate-save-palette.mjs"),
      "--games", games, "--only", "zz-palette-fixture", ...args,
    ], { cwd: ROOT, encoding: "utf8" });

    const report = run();
    assert.match(report, /2 stale/, "both copies of the Byzantine colour are stale");
    assert.match(report, /2 chosen \(untouchable\)/, "and both copies of the invented Ottoman colour are not");
    assert.deepEqual(JSON.parse(fs.readFileSync(path.join(dir, "colors.json"), "utf8"))["Ottoman Empire"], [1, 2, 3],
      "a report must not write");

    run("--adopt");
    const colors = JSON.parse(fs.readFileSync(path.join(dir, "colors.json"), "utf8"));
    const world = JSON.parse(fs.readFileSync(path.join(dir, "world.json"), "utf8"));
    assert.equal(normalizeColor(colors["Byzantine Empire"]), current, "the stale palette entry moved to the board's colour");
    assert.equal(normalizeColor(world.polityOverrides["Byzantine Empire"].color), current, "and so did the registry copy");
    assert.equal(world.polityOverrides["Byzantine Empire"].note, "kept", "the rest of the polity row survived the write");
    assert.deepEqual(colors["Ottoman Empire"], [1, 2, 3], "a colour we never shipped is still exactly where it was");
    assert.equal(world.polityOverrides["Ottoman Empire"].color, "#010203");
  } finally {
    fs.rmSync(games, { recursive: true, force: true });
  }
});

await Promise.all(pending);
console.log(`\n${pass} passed\n`);

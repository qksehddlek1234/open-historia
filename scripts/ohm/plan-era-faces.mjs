#!/usr/bin/env node
/*! Open Historia — which boards can have era borders at all © 2026 Nicholas Krol, MIT (see src/Editor/LICENSE). */
// PLAN F-3, FOR EVERY BOARD AT ONCE.
//
//   node scripts/ohm/plan-era-faces.mjs           the table — reads disk, touches no network
//   node scripts/ohm/plan-era-faces.mjs --probe   one Overpass query per undumped date
//   node scripts/ohm/plan-era-faces.mjs --build   extract → assemble, for dates that qualify
//
//   --only 1914-07-28,1836-01-01   restrict to these dates
//   --min-polities N               the bar --build applies (no default — see below)
//   --zoom N                       extract zoom for --build (default 4, what 1939 used)
//   --window W,S,E,N               price a candidate window: how many era polities
//                                  fall inside it, before a single tile is pulled
//   --max-admin-level N            extract lines up to this admin level (default 2)
//   --resolve-conflicts            let the assembler award a fused face to the
//                                  polity sitting deepest inside it
//   --redo                         re-cut a date that already has faces —
//                                  OVERWRITES them, and is the only way to
//                                  re-run one with different settings
//
// F-3 has sat at "one board out of fifteen" because doing the next one meant
// hand-typing three commands, remembering which date, and finding out only at
// the end whether OpenHistoricalMap has anything at that date at all. This runs
// the plan instead: read every spec, work out what is already on disk, and say
// exactly what is missing and what it would cost.
//
// THE THREE STAGES, AND WHY ONLY ONE OF THEM IS CHEAP.
//
//   fetch-era-polities   one Overpass query. NO BOUNDING BOX — it asks for
//                        admin-level-2 relations alive at a date, worldwide.
//   extract-era-borders  N map tiles. Needs a window (see below).
//   assemble-era-borders local, no network, needs the first two.
//
// So the fetch is the probe. Fourteen queries tell you which dates OHM can
// serve before anyone picks a single window or downloads a single tile, and its
// output is the input the build stage needs anyway — probing wastes nothing.
//
// WHY THERE IS NO DEFAULT WINDOW, AND WHY THIS DOES NOT GUESS ONE.
//
// The obvious idea is to derive each board's window from the board itself — the
// bounding box of the countries and regions it assigns. Measured, and it does
// not work: wwii-1939's assignments span [-180,-55,180,84], the whole world,
// because a world war touches every continent. The window actually used for
// that board is [-10,35,45,71] — Europe, 1/25th the area. It was a judgment
// about where era borders differ enough from modern ones to be worth cutting,
// not a statement about the board's extent, and no bounding box of the board's
// own content recovers it.
//
// The cost of getting that wrong is not an error, which is what makes it worth
// spelling out. At zoom 4 the world is 256 tiles and that Europe window is 16 —
// both under the extractor's 1,024-tile ceiling, so a derived world window
// would not be refused. It would just quietly pull sixteen times the tiles, per
// board, off a volunteer server, for ground the board may not need cut.
//
// So: the window is declared per board, as `eraGeometry.window` in the spec,
// and a date without one is reported and skipped rather than guessed at.
//
// AND NO DEFAULT FOR --min-polities EITHER. The one date that exists returned
// 204 polities. One measurement is not a threshold: it says what a date that
// works looks like, not where the line falls. Run --probe, look at the numbers
// next to that 204, then pass the bar you decided on.
import fs from "node:fs";
import path from "node:path";
import url from "node:url";
import { execFileSync } from "node:child_process";

const ROOT = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), "..", "..");
const SPECS = path.join(ROOT, "scripts", "presets");
const OUT = path.join(ROOT, "scripts", "ohm", "out");

// The one date that has been through all three stages, as the yardstick every
// probe result is printed against. Not a threshold — a reference.
export const REFERENCE = {
  date: "1939-09-01", polities: 204, window: [-10, 35, 45, 71], zoom: 4, faces: 41,
  centersInside: 39, politiesNamed: 44,
};

// WHAT CENTRES-INSIDE ACTUALLY PREDICTS, measured twice and NOT the same twice.
//
// The first version of this called centres-inside an estimate of faces, on the
// strength of one run: 1939 had 39 centres in its window and assembled 41
// faces, so the two looked interchangeable. Then 1836 ran — 71 centres inside,
// 36 faces. Half.
//
// And the failures are not the ones you would guess. Andorra, Monaco, San
// Marino, Liechtenstein, Lucca, Modena and Parma all closed. Royaume de France,
// Königreich Preußen, Kaiserthum Oesterreich, España, Schweiz, Bayern and
// Hannover did not. It is not a resolution problem and not a size problem: a
// centre says a polity EXISTS in the window, and closing a ring for it is a
// separate question the assembler answers.
//
// So centres-inside is an UPPER BOUND on what a window can name, and the
// realised fraction is the thing nobody can predict yet. Two observations:
export const REALISED = [
  { date: "1939-09-01", centersInside: 39, faces: 41, fraction: 41 / 39, settings: "admin≤2" },
  { date: "1836-01-01", centersInside: 71, faces: 36, fraction: 36 / 71, settings: "admin≤2" },
  { date: "1836-01-01", centersInside: 71, faces: 39, fraction: 39 / 71, settings: "admin≤3, resolve" },
];

// THE ADMIN-LEVEL HYPOTHESIS WAS WRONG, AND THAT IS THE USEFUL PART.
//
// 1836's eight fused faces were six German blobs plus France+Switzerland, and
// the extract had thrown away 58,604 lines at admin levels 3 and 4 while
// keeping 6,190. The obvious reading: OHM tags these German states as
// admin_level 2 entities (the polity fetch found them there) but their
// dividing lines at 3 or 4, so raising the ceiling would separate them.
//
// Re-cut at --max-admin-level 3: 6,190 lines became 7,343, and NOT ONE German
// fusion broke apart. Conflicts went 8 to 7, and the one that went was France
// +Switzerland — resolved by --resolve-conflicts, not by the extra lines.
// Whatever separates Braunschweig from Bremen is not at level 3. It is either
// at level 4 (39,919 lines still dropped) or it is not in OHM at this date.
//
// What the run DID buy, itemised, because +3 faces from two changes at once
// would otherwise be unattributable:
//
//   France          the resolver, depth 3.03 against Switzerland's 0.10 — a
//                   30x margin against a guard that asks for 2x
//   España          centre override; the OHM centre was in the sea off Tarifa
//   Sardegna        centre override; its centre was in the Ligurian Sea
//   Русская Америка override moved it to Alaska, out of the window — it gains
//                   no face and stops competing for Baltic ones, which is the
//                   point. This is why the count rose by 3 and not 4.
//
//   coverage 23.3% -> 28.3%, lost labels 14 -> 11, conflicts 8 -> 7.
//
// The Ottoman override did NOT work: pinned to Istanbul, it is still in the
// lost-label list. So of the four centre pins, three are demonstrated and one
// is unverified — see center-overrides.json, which says so.

/** Polity centres falling inside a candidate window — the yield estimate. */
export const centersInWindow = (polities, window) => {
  if (!Array.isArray(polities) || !Array.isArray(window) || window.length !== 4) return null;
  const [w, s, e, n] = window.map(Number);
  return polities.filter((p) => {
    const c = p?.center;
    return Array.isArray(c) && c[0] >= w && c[0] <= e && c[1] >= s && c[1] <= n;
  }).length;
};

const argv = process.argv.slice(2);
const has = (flag) => argv.includes(flag);
const value = (flag) => {
  const i = argv.indexOf(flag);
  return i >= 0 ? argv[i + 1] : null;
};
const PROBE = has("--probe");
const BUILD = has("--build");
const ZOOM = Number(value("--zoom") ?? 4);
const ONLY = (value("--only") ?? "").split(",").map((s) => s.trim()).filter(Boolean);
const MIN = value("--min-polities") === null ? null : Number(value("--min-polities"));
const WINDOW = value("--window") === null ? null : value("--window").split(",").map(Number);
const MAX_ADMIN = value("--max-admin-level");
const RESOLVE = has("--resolve-conflicts");
const REDO = has("--redo");

/** Tiles a window costs at a zoom — the number that makes a window's price visible. */
export const tileCost = (window, zoom) => {
  if (!Array.isArray(window) || window.length !== 4) return null;
  const [w, s, e, n] = window.map(Number);
  const span = 2 ** zoom;
  const lon = (v) => Math.min(span - 1, Math.max(0, Math.floor(((v + 180) / 360) * span)));
  const lat = (v) => {
    const r = (Math.max(-85.05, Math.min(85.05, v)) * Math.PI) / 180;
    const y = (1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2;
    return Math.min(span - 1, Math.max(0, Math.floor(y * span)));
  };
  return (Math.abs(lon(e) - lon(w)) + 1) * (Math.abs(lat(s) - lat(n)) + 1);
};

const dumpFor = (date) => {
  if (!fs.existsSync(OUT)) return { polities: null, lines: null, faces: null };
  const files = fs.readdirSync(OUT);
  const pick = (prefix, suffix) => {
    const hit = files.filter((f) => f.startsWith(prefix) && f.endsWith(suffix)).sort();
    return hit.length > 0 ? path.join(OUT, hit[hit.length - 1]) : null;
  };
  return {
    polities: pick(`era-polities-${date}`, ".json"),
    lines: pick(`era-lines-${date}`, ".geojson"),
    faces: pick(`era-borders-${date}`, ".geojson"),
  };
};

/**
 * The window a lines dump was actually cut with, read back out of the dump.
 *
 * The 1939 faces that ship today were cut with [-10,35,45,71] and that number
 * lived nowhere in the repository — it was typed on a command line once. The
 * dump records it in `meta.bbox`, so a window that was used is recoverable even
 * when it was never declared. Recovering a fact is not the same as guessing
 * one, and the table says which of the two a row is showing.
 */
const windowOfDump = (file) => {
  if (!file) return null;
  try {
    const meta = JSON.parse(fs.readFileSync(file, "utf8"))?.meta;
    return Array.isArray(meta?.bbox) && meta.bbox.length === 4 ? meta.bbox.map(Number) : null;
  } catch {
    return null;
  }
};

const politiesIn = (file) => {
  try {
    const parsed = JSON.parse(fs.readFileSync(file, "utf8"));
    const list = parsed?.polities ?? parsed;
    return Array.isArray(list) ? list.length : Object.keys(list ?? {}).length;
  } catch {
    return null;
  }
};

// Everything below is the command line. Guarded so a test can import the pure
// parts — tileCost, REFERENCE, windowOfDump — without the module printing a
// table or, worse, reaching the network on --probe.
const isMain = process.argv[1] && path.resolve(process.argv[1]) === url.fileURLToPath(import.meta.url);
if (!isMain) {
  // Importers get the helpers and nothing else happens.
} else {

  // ── read every board ─────────────────────────────────────────────────────────
  const boards = [];
  for (const file of fs.readdirSync(SPECS).filter((f) => f.endsWith(".spec.mjs")).sort()) {
    const spec = (await import(url.pathToFileURL(path.join(SPECS, file)).href)).default;
    const era = typeof spec?.eraGeometry === "string" ? { date: spec.eraGeometry } : (spec?.eraGeometry ?? null);
    const date = era?.date ?? spec?.game?.startDate ?? null;
    boards.push({
      id: file.replace(".spec.mjs", ""),
      date: date === null ? null : String(date),
      declared: era !== null,
      window: Array.isArray(era?.window) ? era.window : null,
    });
  }

  // One dump serves every board on the same date, so the unit of work is a DATE.
  const dates = new Map();
  let undated = 0;
  for (const board of boards) {
    // A date OHM cannot express is not a date. bronze-1200bc reads "1200 BCE";
    // counted here rather than silently absent from the table.
    if (!board.date || !/^\d{4}-\d{2}-\d{2}$/.test(board.date)) { undated += 1; continue; }
    if (ONLY.length > 0 && !ONLY.includes(board.date)) continue;
    const entry = dates.get(board.date) ?? { date: board.date, boards: [], declared: false, window: null };
    entry.boards.push(board.id);
    if (board.declared) entry.declared = true;
    if (board.window && !entry.window) entry.window = board.window;
    dates.set(board.date, entry);
  }

  const rows = [...dates.values()].sort((a, b) => a.date.localeCompare(b.date));
  // A typo'd --only would otherwise print an empty table and "0 dates will run",
  // which reads as "everything is already done". Say which asks matched nothing.
  const unmatched = ONLY.filter((date) => !dates.has(date));
  if (unmatched.length > 0) {
    console.log(`\n[plan] --only matched no board for: ${unmatched.join(", ")}`
      + " — a dump for a date no spec asks for is not planned here.");
  }
  for (const row of rows) {
    const dump = dumpFor(row.date);
    row.dump = dump;
    row.polities = dump.polities ? politiesIn(dump.polities) : null;
    if (!row.window) {
      const recovered = windowOfDump(dump.lines);
      if (recovered) { row.window = recovered; row.windowFrom = "dump"; }
    } else {
      row.windowFrom = "spec";
    }
    row.tiles = row.window ? tileCost(row.window, ZOOM) : null;
  }

  const yes = (v) => (v ? "yes" : "—");
  console.log(`\nF-3 plan · ${rows.length} date(s) across ${boards.length} board(s)`
    + `${undated > 0 ? ` · ${undated} board(s) carry no ISO date and are not plannable here` : ""}`);
  console.log(`reference: ${REFERENCE.date} returned ${REFERENCE.polities} polities`
    + ` and was cut with window [${REFERENCE.window.join(",")}] = ${tileCost(REFERENCE.window, REFERENCE.zoom)} tiles at z${REFERENCE.zoom}\n`);
  console.log(`  ${"date".padEnd(12)}${"boards".padEnd(30)}${"wants era".padEnd(11)}${"window".padEnd(16)}${"polities".padEnd(10)}${"lines".padEnd(7)}faces`);
  for (const row of rows) {
    const win = row.window ? `${row.tiles}t (${row.windowFrom})` : "—";
    console.log(`  ${row.date.padEnd(12)}${row.boards.join(",").slice(0, 28).padEnd(30)}`
      + `${yes(row.declared).padEnd(11)}`
      + `${win.padEnd(16)}`
      + `${(row.polities === null ? "—" : String(row.polities)).padEnd(10)}`
      + `${yes(row.dump.lines).padEnd(7)}${yes(row.dump.faces)}`);
  }
  const recovered = rows.filter((row) => row.windowFrom === "dump");
  if (recovered.length > 0) {
    console.log(`\n  ${recovered.length} window(s) shown above were read back out of a dump rather than declared`
      + " in a spec — record them as eraGeometry.window so a rebuild reproduces them:");
    for (const row of recovered) console.log(`    ${row.date}  window: [${row.window.join(", ")}]`);
  }

  // ── price a candidate window before any tile is pulled ───────────────────────
  //
  // The window was the one judgment nobody could check in advance. It still is
  // a judgment — but it is now a PRICED one: the polity dump already says where
  // every era polity sits, so counting the centres inside a proposed rectangle
  // estimates the faces it will yield. Calibration is the one run that exists:
  // 39 centres inside gave 41 assigned faces and 44 named polities.
  if (WINDOW) {
    if (WINDOW.length !== 4 || WINDOW.some((v) => !Number.isFinite(v))) {
      console.log("\n[window] --window needs four numbers: W,S,E,N");
    } else {
      console.log(`\n[window] [${WINDOW.join(",")}] = ${tileCost(WINDOW, ZOOM)} tiles at z${ZOOM}`);
      const priced = rows.filter((row) => row.dump.polities);
      if (priced.length === 0) console.log("[window] no date has a polity dump yet — run --probe first.");
      for (const row of priced) {
        const parsed = JSON.parse(fs.readFileSync(row.dump.polities, "utf8"));
        const list = parsed?.polities ?? parsed;
        const inside = centersInWindow(list, WINDOW);
        const total = Array.isArray(list) ? list.length : 0;
        console.log(`  ${row.date.padEnd(12)}${String(inside).padStart(4)} of ${String(total).padStart(4)} polity centres inside`
          + ` — an UPPER BOUND on what this window can name, not a forecast`);
      }
      console.log("[window] how much of that bound is realised is not predictable from here."
        + " Measured so far: " + REALISED.map((r) => `${r.date} ${r.centersInside}→${r.faces}`
          + ` (${Math.round(r.fraction * 100)}%)`).join(", ")
        + ". A centre says a polity EXISTS in the window; whether the assembler can close a ring"
        + " for it is a different question, and the misses are not sorted by size —"
        + " Monaco and San Marino closed at 1836 where France and Prussia did not.");
    }
  }

  // ── probe: the cheap stage, and the only one that needs no window ─────────────
  if (PROBE) {
    const need = rows.filter((row) => !row.dump.polities);
    console.log(`\n[probe] ${need.length} date(s) without a polities dump`
      + `${rows.length - need.length > 0 ? ` · ${rows.length - need.length} already have one and are not re-queried` : ""}`);
    for (const row of need) {
      console.log(`[probe] ${row.date} …`);
      try {
        execFileSync("node", [path.join(ROOT, "scripts", "ohm", "fetch-era-polities.mjs"), row.date], {
          cwd: ROOT, stdio: "inherit",
        });
        const dump = dumpFor(row.date);
        row.dump = dump;
        row.polities = dump.polities ? politiesIn(dump.polities) : null;
      } catch {
        // A date the endpoint refuses or times out on is a RESULT, not a crash —
        // the remaining dates still get their turn.
        row.polities = null;
        console.log(`[probe] ${row.date} — query failed, left without a dump`);
      }
    }
    console.log("\n[probe] coverage, against the 204 that made 1939-09-01 work:");
    for (const row of rows) {
      console.log(`  ${row.date.padEnd(12)}${(row.polities === null ? "none" : String(row.polities)).padStart(6)}`
        + `  ${row.polities === null ? "" : `${(row.polities / REFERENCE.polities * 100).toFixed(0)}% of the reference`}`);
    }
    console.log("\n[probe] now decide the bar and pass it as --min-polities N. There is no default:"
      + " one working date says what works, not where the line is.");
  }

  // ── build: needs a window, a polity dump, and a bar somebody chose ────────────
  if (BUILD) {
    if (MIN === null || !Number.isFinite(MIN)) {
      console.log("\n[build] refused: --min-polities is required. Run --probe first and choose it from the numbers.");
      process.exit(1);
    }
    const skipped = { noPolities: [], noWindow: [], belowBar: [], done: [] };
    const runnable = [];
    for (const row of rows) {
      // Resume is what makes this re-runnable; --redo is what makes it usable
      // when the point of the re-run is DIFFERENT SETTINGS. Without it the
      // first attempt to re-cut 1836 at --max-admin-level 3 was skipped as
      // "done" and the two flags that were the whole reason for the run went
      // nowhere, silently.
      if (row.dump.faces && !REDO) { skipped.done.push(row.date); continue; }
      if (!row.dump.polities) { skipped.noPolities.push(row.date); continue; }
      if (row.polities !== null && row.polities < MIN) { skipped.belowBar.push(`${row.date} (${row.polities})`); continue; }
      if (!row.window) { skipped.noWindow.push(row.date); continue; }
      runnable.push(row);
    }
    // NO SILENT CAPS. Every date that will not run says why, by name.
    console.log(`\n[build] ${runnable.length} date(s) will run at z${ZOOM}, bar ${MIN} polities`);
    for (const [reason, list] of Object.entries(skipped)) {
      if (list.length > 0) console.log(`[build] skipped — ${reason}: ${list.join(", ")}`);
    }
    // A FLAG THAT CHANGED NOTHING HAS TO SAY SO. Passing --max-admin-level or
    // --resolve-conflicts and getting "skipped — done" back reads as if the
    // settings were applied and made no difference, when in fact nothing ran.
    if (runnable.length === 0 && skipped.done.length > 0 && (MAX_ADMIN || RESOLVE)) {
      console.log(`[build] NOTE: ${[MAX_ADMIN ? "--max-admin-level" : null, RESOLVE ? "--resolve-conflicts" : null]
        .filter(Boolean).join(" and ")} had no effect — every date was already cut.`
        + " Add --redo to cut it again with these settings (this overwrites the existing faces).");
    }
    if (skipped.noWindow.length > 0) {
      console.log("[build] a window is a judgment about where era borders differ from modern ones."
        + " Declare it as eraGeometry.window in the spec; this does not guess one.");
    }
    for (const row of runnable) {
      console.log(`\n[build] ${row.date} — extract, window [${row.window.join(",")}] = ${row.tiles} tiles at z${ZOOM}`
      + `${MAX_ADMIN ? `, admin level ≤ ${MAX_ADMIN}` : ""}${RESOLVE ? ", fused faces will be resolved" : ""}`);
      execFileSync("node", [
        path.join(ROOT, "scripts", "ohm", "extract-era-borders.mjs"), row.date,
        "--zoom", String(ZOOM), "--bbox", row.window.join(","),
        ...(MAX_ADMIN ? ["--max-admin-level", String(MAX_ADMIN)] : []),
      ], { cwd: ROOT, stdio: "inherit" });
      const dump = dumpFor(row.date);
      if (!dump.lines) { console.log(`[build] ${row.date} — extract produced no lines file, assembly skipped`); continue; }
      console.log(`[build] ${row.date} — assemble`);
      // WHY THE RESOLVE FLAG IS WORTH REACHING. The assembler refuses a face
      // that two polities both claim, which is the honest default — but
      // refusing costs the DOMINANT polity its whole outline. 1836 refused
      // eight such faces and one was France fused with Switzerland, so France
      // ended with no era outline at all over a single Swiss-border seam.
      // --resolve-conflicts awards the face to the label deepest inside it,
      // behind two guards measured on the 1939 run: at most three labels, and
      // the winner at least twice as deep as the runner-up. Six of 1836's eight
      // sit inside those guards. The two German ones, at six and seven labels,
      // do not — and refusing those is CORRECT, because six labels in one face
      // means the borders between them are absent, not ambiguous.
      execFileSync("node", [
        path.join(ROOT, "scripts", "ohm", "assemble-era-borders.mjs"), dump.lines,
        "--polities", dump.polities,
        ...(RESOLVE ? ["--resolve-conflicts"] : []),
      ], { cwd: ROOT, stdio: "inherit" });
    }
  }

  if (!PROBE && !BUILD) {
    console.log("\n(plan only — nothing was queried or written. --probe to measure coverage, --build to cut faces.)");
  }

}

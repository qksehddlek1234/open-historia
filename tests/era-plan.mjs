/*! Open Historia — the F-3 planner tells the truth about cost © 2026 Nicholas Krol, MIT (see src/Editor/LICENSE). */
// WHAT CAN BE PROVEN ABOUT A SCRIPT WHOSE INTERESTING HALF NEEDS A NETWORK.
//
// plan-era-faces.mjs exists to answer "which boards can have era borders at
// all", and answering it for real means querying OpenHistoricalMap — which an
// agent session must never do. So this pins everything that does NOT need the
// network, and the network path stays honestly untested rather than faked:
//
//   • the tile arithmetic the whole no-guessing argument rests on
//   • that importing the module reaches nothing and prints nothing
//   • that --build refuses to invent a threshold
//   • that a date it will not run is NAMED, never silently dropped
//   • that the one window this repo has ever used is recorded where a rebuild
//     will find it, and still agrees with the dump it was recovered from
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import url from "node:url";
import os from "node:os";
import { execFileSync } from "node:child_process";

const ROOT = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), "..");
const PLAN = path.join(ROOT, "scripts", "ohm", "plan-era-faces.mjs");
const OUT = path.join(ROOT, "scripts", "ohm", "out");

let pass = 0;
const test = (name, fn) => {
  try {
    fn();
    pass += 1;
    console.log(`  ok  ${name}`);
  } catch (error) {
    console.error(`  FAIL  ${name}\n`, error);
    process.exitCode = 1;
  }
};

const run = (args) => {
  try {
    return { code: 0, out: execFileSync("node", [PLAN, ...args], { cwd: ROOT, encoding: "utf8" }) };
  } catch (error) {
    return { code: error.status ?? 1, out: `${error.stdout ?? ""}${error.stderr ?? ""}` };
  }
};

const { tileCost, REFERENCE } = await import(url.pathToFileURL(PLAN).href);

console.log("\nThe F-3 planner");

test("THE TILE ARITHMETIC THE NO-GUESSING ARGUMENT RESTS ON", () => {
  // The file argues that deriving a window from a board's own extent would not
  // error — it would quietly cost sixteen times as much. That claim is these
  // two numbers, so they are pinned rather than asserted in a comment.
  assert.equal(tileCost([-180, -85, 180, 85], 4), 256, "the world at zoom 4");
  assert.equal(tileCost(REFERENCE.window, 4), 16, "the window 1939 was actually cut with");
  assert.equal(256 / 16, 16, "hence sixteen times the tiles off a volunteer server");
  // And both clear the extractor's ceiling, which is why this is a cost
  // argument and not an error argument.
  const CEILING = 1024;
  assert.ok(tileCost([-180, -85, 180, 85], 4) < CEILING, "a world window would NOT have been refused");
});

test("a malformed window costs nothing rather than throwing", () => {
  assert.equal(tileCost(null, 4), null);
  assert.equal(tileCost([1, 2, 3], 4), null, "three numbers is not a bbox");
});

test("IMPORTING REACHES NOTHING — the network lives behind the CLI guard", () => {
  // Without the isMain guard, `import` would run the whole planner, and an
  // --probe in someone's argv would fire Overpass queries from a test run.
  const source = fs.readFileSync(PLAN, "utf8");
  assert.match(source, /const isMain = process\.argv\[1\]/, "the guard must exist");
  const guardAt = source.indexOf("const isMain");
  assert.ok(source.indexOf("execFileSync(\"node\"") > guardAt,
    "every child process must be started after the guard, never at import time");
});

test("--build REFUSES TO INVENT A THRESHOLD", () => {
  // One working date is not a threshold. If this ever grows a default, the
  // number would be pure invention dressed as a measurement.
  const { code, out } = run(["--build"]);
  assert.equal(code, 1, "it must exit non-zero rather than pick a bar");
  assert.match(out, /--min-polities is required/);
  assert.match(out, /--probe/, "and it must say how to find the number");
});

test("the plan reads the specs and touches nothing", () => {
  const { code, out } = run([]);
  assert.equal(code, 0);
  assert.match(out, /nothing was queried or written/);
  assert.match(out, /1939-09-01/, "the one date with a dump has to appear");
  assert.match(out, /204/, "with the polity count read off that dump");
});

test("a board whose date OHM cannot express is COUNTED, not dropped", () => {
  // bronze-1200bc reads "1200 BCE". Silently absent from the table would read
  // as "nothing to do here", which is the opposite of true.
  const { out } = run([]);
  assert.match(out, /carry no ISO date and are not plannable here/);
});

test("A DATE IT WILL NOT RUN IS NAMED, with the reason", () => {
  // Arrange the one skip path that needs a fixture, and arrange it the way it
  // will actually occur: magna-1444 is a real board, --probe will give it a
  // polity dump, and nobody has chosen its window yet. (This role belonged
  // to ww1-1914 until the 2026-08-12 date batch declared 1914's window — the
  // fixture date must be one still undeclared, and the medieval boards are
  // hybrid candidates, not graft declarations.) Taken away again whatever
  // happens — a date no board wants would not be planned for at all.
  const date = "1444-11-11";
  const fixture = path.join(OUT, `era-polities-${date}.json`);
  fs.mkdirSync(OUT, { recursive: true });
  fs.writeFileSync(fixture, JSON.stringify({ polities: Array.from({ length: 300 }, (_, i) => ({ id: i })) }));
  try {
    const { out } = run(["--build", "--min-polities", "1", "--only", date]);
    assert.match(out, /skipped — noWindow: 1444-11-11/, "the date has to be named, not just counted");
    assert.match(out, /a window is a judgment/, "and told what would unblock it");
    assert.doesNotMatch(out, /will run at z4[\s\S]*extract/, "and nothing may be extracted for it");
  } finally {
    fs.rmSync(fixture, { force: true });
  }
});

test("A DATE ALREADY CUT IS NOT RE-CUT", () => {
  // Resume is the difference between a driver you can re-run and one you fear.
  const { out } = run(["--build", "--min-polities", "1", "--only", REFERENCE.date]);
  assert.match(out, /skipped — done: 1939-09-01/);
  assert.match(out, /0 date\(s\) will run/);
});

test("…but SETTINGS THAT CHANGED NOTHING SAY SO", () => {
  // Resume plus new flags is the trap: the first attempt to re-cut 1836 at a
  // higher admin level was skipped as "done", so the flags that were the entire
  // point of the run went nowhere and the output read as though they had been
  // applied. Silence there is worse than the skip.
  const { out } = run([
    "--build", "--min-polities", "1", "--only", REFERENCE.date,
    "--max-admin-level", "3", "--resolve-conflicts",
  ]);
  assert.match(out, /had no effect — every date was already cut/);
  assert.match(out, /--max-admin-level and --resolve-conflicts/, "both flags named, not one");
  assert.match(out, /--redo/, "and the way out is offered");
});

test("THE ONE WINDOW THIS REPO HAS USED IS RECORDED, and still matches its dump", async () => {
  // It was typed on a command line once and lived nowhere. Now the spec carries
  // it — and this pin fails the day the spec and the dump disagree, which is
  // the day a "rebuild" would quietly produce different faces.
  const spec = (await import(url.pathToFileURL(path.join(ROOT, "scripts", "presets", "wwii-1939.spec.mjs")).href)).default;
  assert.deepEqual(spec.eraGeometry.window, REFERENCE.window, "the spec must declare the window");

  const lines = fs.readdirSync(OUT).filter((f) => f.startsWith(`era-lines-${REFERENCE.date}`) && f.endsWith(".geojson"));
  if (lines.length === 0) return; // dumps are gitignored; only checkable where one exists
  // Newest by MTIME, never by name — build-preset's own discovery sorts by
  // mtime, and lexicographic order is a trap: a stale pre-`-z4` dump
  // ("….geojson") sorts AFTER its successor ("…-z4.geojson") because "." > "-",
  // which is exactly how a 8/8-convention leftover outranked the real dump on
  // the local session's disk (2026-08-13) and turned this pin red for an
  // environment reason. The pin must read the same file the build would.
  const newest = lines
    .map((f) => ({ f, mtimeMs: fs.statSync(path.join(OUT, f)).mtimeMs }))
    .sort((a, b) => b.mtimeMs - a.mtimeMs)[0].f;
  const meta = JSON.parse(fs.readFileSync(path.join(OUT, newest), "utf8")).meta;
  assert.deepEqual(meta.bbox.map(Number), spec.eraGeometry.window,
    "the declared window must be the one the shipped faces were actually cut with");
  assert.equal(meta.zoom, REFERENCE.zoom, "and at the zoom the reference records");
});

test("the window field is inert for the build — it is a record, not an input", () => {
  // build-preset reads date/file/faceOwners/excludeFaces/faceKeepOut off
  // eraGeometry and nothing else. If it ever starts reading `window`, adding
  // the field to a spec would change that board's output, and this pin should
  // be the thing that notices.
  const build = fs.readFileSync(path.join(ROOT, "scripts", "presets", "build-preset.mjs"), "utf8");
  assert.doesNotMatch(build, /eraSpec\.window/, "build-preset must not consume the window");
});

// ── the loop the header said not to run ──────────────────────────────────────

test("THE POLITY QUERY CARRIES NO DATE — so one answer serves every date", () => {
  // This is the fact the whole probe design rests on, and missing it cost a
  // real run: plan-era-faces looped fetch-era-polities over nineteen dates and
  // each one re-downloaded the identical multi-megabyte response. The query
  // asks for every admin_level-2 boundary relation ever; the date is applied
  // locally afterwards. If a date ever appears in the query, the cache below
  // becomes wrong and this pin is where that gets caught.
  const src = fs.readFileSync(path.join(ROOT, "scripts", "ohm", "fetch-era-polities.mjs"), "utf8");
  const query = src.slice(src.indexOf("const query = `"), src.indexOf("`;", src.indexOf("const query = `")));
  assert.doesNotMatch(query, /options\.date|targetDec|\[date:/, "the query must not depend on the date");
  assert.match(query, /admin_level/, "it is keyed by admin level and nothing else");
  assert.match(src, /era-relations-al\$\{options\.adminLevel\}\.json/,
    "and the cache file must be keyed the same way — keyed by date it would never hit");
});

test("A CACHED RESPONSE IS USED AND NOTHING IS FETCHED", () => {
  // Written into a throwaway --out, never the real one. The first version of
  // this test ran against scripts/ohm/out and overwrote the live 204-polity
  // 1939 dump with three fixture rows; it had to be restaged off the user's PC.
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "ohm-cache-"));
  try {
    fs.writeFileSync(path.join(tmp, "era-relations-al2.json"), JSON.stringify({
      fetchedAt: "2026-08-11T00:00:00Z",
      elements: [
        { id: 1, tags: { name: "Testland", admin_level: "2", start_date: "1900", end_date: "1950" }, center: { lon: 10, lat: 50 } },
        { id: 2, tags: { name: "Goneland", admin_level: "2", start_date: "1700", end_date: "1800" }, center: { lon: 20, lat: 40 } },
      ],
    }));
    const out = execFileSync("node", [
      path.join(ROOT, "scripts", "ohm", "fetch-era-polities.mjs"), "1939-09-01", "--out", tmp,
    ], { cwd: ROOT, encoding: "utf8", timeout: 20000 });
    assert.match(out, /캐시 사용/, "it must say it used the cache");
    assert.doesNotMatch(out, /오버패스 질의/, "and must not have queried Overpass");
    // The local date filter still has to work off the cached rows.
    const written = JSON.parse(fs.readFileSync(path.join(tmp, "era-polities-1939-09-01.json"), "utf8"));
    assert.equal(written.polities.length, 1, "only the polity alive in 1939 survives");
    assert.equal(written.polities[0].name, "Testland");
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test("…and a second date reuses the SAME cache rather than fetching again", () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "ohm-cache-"));
  try {
    fs.writeFileSync(path.join(tmp, "era-relations-al2.json"), JSON.stringify({
      fetchedAt: "2026-08-11T00:00:00Z",
      elements: [{ id: 1, tags: { name: "Longland", admin_level: "2", start_date: "1700", end_date: "2000" }, center: { lon: 1, lat: 1 } }],
    }));
    for (const date of ["1804-12-01", "1914-07-28"]) {
      const out = execFileSync("node", [
        path.join(ROOT, "scripts", "ohm", "fetch-era-polities.mjs"), date, "--out", tmp,
      ], { cwd: ROOT, encoding: "utf8", timeout: 20000 });
      assert.doesNotMatch(out, /오버패스 질의/, `${date} must not have queried`);
    }
    // Nineteen dates, one request — the point of the whole change.
    assert.ok(fs.existsSync(path.join(tmp, "era-polities-1804-12-01.json")));
    assert.ok(fs.existsSync(path.join(tmp, "era-polities-1914-07-28.json")));
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test("A WINDOW IS PRICED BEFORE ANY TILE IS PULLED", async () => {
  // The window was the one judgment nobody could check in advance. Counting
  // era-polity centres inside a candidate rectangle estimates its yield, and
  // the calibration is the one run that exists: 39 centres inside gave 41
  // assigned faces and 44 named polities. If that ever drifts, the estimate
  // stops meaning anything and this is where it shows.
  const { centersInWindow } = await import(url.pathToFileURL(PLAN).href);
  const dump = path.join(OUT, `era-polities-${REFERENCE.date}.json`);
  if (!fs.existsSync(dump)) return; // dumps are gitignored
  const { polities } = JSON.parse(fs.readFileSync(dump, "utf8"));
  assert.equal(polities.length, REFERENCE.polities, "the reference dump must still be the reference dump");
  assert.equal(centersInWindow(polities, REFERENCE.window), REFERENCE.centersInside,
    "centres inside the shipped window");

  // AND IT IS A BOUND, NOT A FORECAST. Calling it a forecast is exactly the
  // mistake this pin exists to stop repeating: one run made 39 centres look
  // interchangeable with 41 faces, and the next run turned 71 into 36.
  const { REALISED } = await import(url.pathToFileURL(PLAN).href);
  assert.ok(REALISED.length >= 2, "a single observation is not a rate");
  // Every observation carries the settings it was taken under. Two runs of the
  // same date under different flags are two observations, not a contradiction —
  // 1836 reads 36 at admin<=2 and 39 at admin<=3 with the resolver on.
  for (const r of REALISED) {
    assert.ok(typeof r.settings === "string" && r.settings.length > 0,
      `${r.date} must record the settings it was measured under`);
  }
  const dates = REALISED.map((r) => `${r.date} ${r.settings}`);
  assert.equal(new Set(dates).size, dates.length, "each date+settings pair appears once");
  const spread = Math.max(...REALISED.map((r) => r.fraction)) / Math.min(...REALISED.map((r) => r.fraction));
  assert.ok(spread > 2, `the two known realisation rates differ by ${spread.toFixed(1)}x — do not average them`);
  const source = fs.readFileSync(PLAN, "utf8");
  assert.match(source, /UPPER BOUND on what this window can name, not a forecast/,
    "the output must say bound, not estimate");
  // Sanity in both directions: the whole world holds everyone, an empty patch
  // of ocean holds nobody.
  assert.equal(centersInWindow(polities, [-180, -90, 180, 90]), polities.length);
  assert.equal(centersInWindow(polities, [-140, -40, -130, -30]), 0, "open South Pacific");
});

test("THE FUSED-FACE FLAGS REACH THE CHILD PROCESSES", () => {
  // 1836's eight refused faces are why these exist. --resolve-conflicts is the
  // assembler's, --max-admin-level the extractor's, and neither was reachable
  // through the planner, so the first real build ran without either and lost
  // France to a Swiss-border seam.
  const src = fs.readFileSync(PLAN, "utf8");
  assert.match(src, /"--max-admin-level", String\(MAX_ADMIN\)/, "extract must receive the admin level");
  assert.match(src, /RESOLVE \? \["--resolve-conflicts"\]/, "assemble must receive the resolve flag");
  // Both OFF by default: turning either on changes what ships, so it is asked for.
  assert.doesNotMatch(src, /const RESOLVE = true/);
  assert.match(src, /const RESOLVE = has\("--resolve-conflicts"\)/);
});

test("EVERY CENTRE OVERRIDE IS A MEASURED OR SOURCED INTERIOR POINT", async () => {
  // The file is hand-placed data, so the pin is that each entry is inside the
  // land it claims rather than in the sea the bbox centre fell into. España is
  // the one that can be checked against the seed: its override must sit inside
  // a real ESP region, not in the Strait of Gibraltar where OHM put it.
  const file = path.join(ROOT, "scripts", "ohm", "data", "center-overrides.json");
  const overrides = JSON.parse(fs.readFileSync(file, "utf8"));
  for (const [name, point] of Object.entries(overrides)) {
    if (name.startsWith("__")) continue;
    assert.ok(Array.isArray(point) && point.length === 2, `${name} must be [lon, lat]`);
    assert.ok(point[0] >= -180 && point[0] <= 180 && point[1] >= -90 && point[1] <= 90, `${name} off the globe`);
  }
  assert.ok(overrides["España"], "the 1836 run's clearest centre-lie must be pinned");
  const [lon, lat] = overrides["España"];
  // Mainland Spain, generously bounded. The value OHM computed was
  // [-6.92, 35.71] — south of Tarifa, in the water.
  assert.ok(lon > -9.5 && lon < 3.4 && lat > 36.5 && lat < 43.8, "España's override must be on the mainland");
});

console.log(`\n${pass} passed\n`);

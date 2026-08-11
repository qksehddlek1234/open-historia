#!/usr/bin/env node
/*! Open Historia — seed hygiene © 2026 Nicholas Krol, MIT (see src/Editor/LICENSE). */
// THE SEED HAS THREE KINDS OF DAMAGE AND ONLY TWO OF THEM ARE CHEAP TO FIX.
//
//   node scripts/regions/repair-seed.mjs            measure, change nothing
//   node scripts/regions/repair-seed.mjs --apply    write the seed back
//
// Run build-default-map and then share-base-map afterwards: names live in the
// features, so they only reach the map the app serves once default is rebuilt,
// and rebuilding default is what the shared boards borrow from.
//
// ── 1. PHANTOM ROWS (2) — removed ────────────────────────────────────────────
// {id:"NA", gid0:"NA"} and {id:"?", gid0:"UKR"}: missing values stringified
// somewhere upstream of the seed. Both builders already refuse them through
// isRegionReference, so removing them here changes nothing downstream — it just
// stops every OTHER reader of the seed from having to know. This script uses
// that same predicate rather than restating the rule, because the last time two
// files held their own copy of it the fleet's 22 shared maps collapsed in a
// single rebuild.
//
// ── 2. MISSING NAMES (3) — two filled, one deliberately left blank ───────────
// Three real regions carry the literal string "NA" as their name, and the map's
// label layer is `["get","name"]` with no fallback, so they render as places
// called NA. The pmtiles catalog has the same string — it is the same upstream
// source — so the names had to be established from the data itself.
//
// IRL.4_1 → Cork. Three independent confirmations: it is the ONLY one of the 26
//   Irish counties missing from the seed; its bbox (-10.24,51.42 → -7.84,52.39)
//   is southwest Ireland from Mizen Head up; and GADM numbers alphabetically,
//   where Cork is 4th (Carlow, Cavan, Clare, Cork).
//
// NLD.14_1 → Zuid-Holland. Same three: the only Dutch province missing; bbox
//   (3.84,51.64 → 5.04,52.33) is exactly South Holland; and it sorts 14th of the
//   14 rows GADM gives the Netherlands (twelve provinces plus IJsselmeer and
//   Zeeuwse meren).
//
// MHL.19_1 → LEFT BLANK, on purpose. Its 96 parts fall into four clusters and
//   they are four separate atolls: Bikini (165.2-165.6), Ailinginae (166.3),
//   Rongelap (166.6-167.1) and Rongerik (167.4). No single Marshallese
//   municipality covers exactly that set — Rongelap Atoll's government
//   administers three of them, but Bikini's people are governed from Kili — and
//   there is no row for Bikini anywhere else in the seed to compare against.
//   Naming it "Rongelap" would mislabel Bikini. Blank renders NOTHING, which is
//   the honest answer; "NA" renders a place called NA, which is a lie.
//
// ── 3. DOTLESS GHANAIAN IDS — RESOLVED by remap-dotless-ids.mjs ──────────────
// The paragraph below is the judgement as it stood when this script was
// written, kept because it explains why the fix needed its own migration. That
// migration exists now (scripts/regions/remap-dotless-ids.mjs): one sweep over
// the seed, every scenario, and both live saves, verified to zero remaining.
// The per-run count below now reports 0 and stands guard against a recurrence,
// alongside the grammar pin in tests/level2-expansion.mjs.
//
// ── (historical) DOTLESS GHANAIAN IDS (16) — NOT TOUCHED, and this is a judgement
// GHA13_2 should be GHA.13_2 in GADM's grammar. Renaming them is a one-line
// change to the seed and an ID MIGRATION ACROSS THE WHOLE FLEET everywhere else:
// default/world.json holds 16 ownership facts on the old ids and
// build-default-map PRESERVES overrides rather than regenerating them, so they
// would become orphans; every shared board's overlay is keyed by region id, so
// the reconstruction check would fail and all 22 would un-share themselves on
// the next rebuild — the exact collapse this repo has already had once.
//
// Nothing breaks today: isRegionReference deliberately does not require the dot,
// and the one place with a `<GID0>.<rest>` grammar (level2Expansion) never
// reaches Ghana. So this is hygiene with a fleet-wide blast radius and no
// present symptom. It needs its own batch with a remap step, not a line here.
import fs from "node:fs";
import path from "node:path";
import url from "node:url";
import { isRegionReference, regionRefReason } from "../presets/lib/regionRef.mjs";

const ROOT = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), "..", "..");
const SEED = path.join(ROOT, "public", "assets", "regions-seed.geojson");
const APPLY = process.argv.includes("--apply");

// Established from the data, not looked up. See the header for each.
export const RESOLVED_NAMES = {
  "IRL.4_1": "Cork",
  "NLD.14_1": "Zuid-Holland",
  // Four atolls under one row and no honest name for the set. Blank draws
  // nothing; the header explains why that beats a guess.
  "MHL.19_1": "",
};

const MISSING_NAME = (value) => {
  const text = String(value ?? "").trim();
  return text === "" || text === "NA" || text === "?";
};

if (!fs.existsSync(SEED)) {
  console.error(`[repair-seed] seed not found: ${SEED}`);
  console.error("  it is gitignored — this repair only runs on a machine that has it.");
  process.exit(1);
}

const seed = JSON.parse(fs.readFileSync(SEED, "utf8"));
const before = seed.features.length;

const dropped = [];
const named = [];
const stillUnnamed = [];
const dotless = [];

const kept = [];
for (const feature of seed.features) {
  const props = feature.properties ?? {};
  const id = String(props.id ?? "");
  const gid0 = String(props.gid0 ?? "");

  if (!isRegionReference(id, gid0)) {
    dropped.push(`${id || "(no id)"} — ${regionRefReason(id, gid0)}`);
    continue;
  }

  if (MISSING_NAME(props.name)) {
    if (Object.hasOwn(RESOLVED_NAMES, id)) {
      const resolved = RESOLVED_NAMES[id];
      named.push(`${id} → ${resolved === "" ? "(blank, deliberately)" : resolved}`);
      feature.properties = { ...props, name: resolved };
    } else {
      stillUnnamed.push(`${id} (${props.country ?? "?"})`);
    }
  }

  // Reported every run so the deferred migration cannot be forgotten.
  if (/^[A-Z]{3}[0-9]/.test(id)) dotless.push(id);

  kept.push(feature);
}

seed.features = kept;

console.log(`[repair-seed] ${before} features in, ${kept.length} out`);
console.log(`  removed ${dropped.length} phantom row(s):`);
for (const row of dropped) console.log(`    ${row}`);
console.log(`  filled ${named.length} missing name(s):`);
for (const row of named) console.log(`    ${row}`);
if (stillUnnamed.length) {
  console.log(`  STILL UNNAMED ${stillUnnamed.length} — add them to RESOLVED_NAMES with a reason:`);
  for (const row of stillUnnamed) console.log(`    ${row}`);
}
console.log(`  deferred: ${dotless.length} dotless id(s) — see the header, this needs a remap batch`);

if (!APPLY) {
  console.log("\n  dry run — pass --apply to write the seed back");
  process.exit(0);
}

fs.writeFileSync(SEED, `${JSON.stringify(seed)}\n`, "utf8");
console.log(`\n  written. Now run:  node scripts/build-default-map.mjs && node scripts/presets/share-base-map.mjs`);

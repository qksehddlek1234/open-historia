/*! Open Historia — leadership heal for saves written before the alias-chain fix © 2026 Nicholas Krol, MIT (see src/Editor/LICENSE). */
// A save created before the seeding survived normalization carries two wounds:
// its polityOverrides lost the leadership the scenario shipped (21/21 → 0), and
// the sheet task, arriving empty-handed, wrote people who never existed —
// measured on the 1935 save: "총리 스탠리 메이너드 맥도널드", "국왕 조지 6세"
// (crowned in 1936), "총리 알베르토 바리니", "대통령 알퐁스 페리시에",
// "국무원 주석 펑펑".
//
// This restores the seeding from the scenario the save was built from, then
// corrects any recorded officeholder the record disagrees with. It NEVER
// invents: a country the record does not cover is left exactly as it is and
// named in the report. Nothing is silently changed — every edit prints.
//
//   node scripts/heal-leadership.mjs                 # report only
//   node scripts/heal-leadership.mjs --write         # apply
import { readFileSync, writeFileSync, existsSync, readdirSync } from "node:fs";
import path from "node:path";
import url from "node:url";

const ROOT = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), "..");
const GAMES = path.join(ROOT, "server", "data", "games");
const SCENARIOS = path.join(ROOT, "server", "data", "scenarios");
const WRITE = process.argv.includes("--write");
// --strict: 기록이 다루지 않는 직책에 모델이 채워 넣은 이름을 "(미확인)"으로 되돌린다.
const STRICT = process.argv.includes("--strict");

const { ensureReferenceEra, resolveLeadership } = await import(url.pathToFileURL(path.join(ROOT, "src", "runtime", "leaderReference.js")).href);

// The same person under a different spelling is not a correction worth making.
const { sameLeaderPerson } = await import(url.pathToFileURL(path.join(ROOT, "src", "runtime", "countryStatLedger.js")).href);

const readJson = (file) => JSON.parse(readFileSync(file, "utf8"));

if (!existsSync(GAMES)) {
  console.log("no games directory — nothing to heal.");
  process.exit(0);
}

let totalSeeded = 0;
let totalCorrected = 0;
let totalUncovered = 0;

for (const gameId of readdirSync(GAMES)) {
  const worldPath = path.join(GAMES, gameId, "world.json");
  const gamePath = path.join(GAMES, gameId, "game.json");
  if (!existsSync(worldPath)) continue;

  const world = readJson(worldPath);
  const game = existsSync(gamePath) ? readJson(gamePath) : {};
  const date = String(game.gameDate || game.startDate || "").trim();
  if (!date) {
    console.log(`- ${gameId}: no game date — skipped.`);
    continue;
  }

  // Which scenario was this built from? Match by polity roster, which is the
  // one thing a save and its scenario always share.
  const overrides = world.polityOverrides ?? {};
  const names = new Set(Object.keys(overrides));
  let scenarioWorld = null;
  let scenarioId = "";
  for (const candidate of existsSync(SCENARIOS) ? readdirSync(SCENARIOS) : []) {
    const file = path.join(SCENARIOS, candidate, "world.json");
    if (!existsSync(file)) continue;
    const keys = Object.keys(readJson(file).polityOverrides ?? {});
    if (keys.length > 0 && keys.every((key) => names.has(key)) && keys.length >= names.size - 2) {
      scenarioWorld = readJson(file);
      scenarioId = candidate;
      break;
    }
  }

  await ensureReferenceEra(date);
  console.log(`\n## ${gameId}  (${date}${scenarioId ? `, from ${scenarioId}` : ", scenario unmatched"})`);

  // ── 1. Put the seeding back ────────────────────────────────────────────────
  let seeded = 0;
  if (scenarioWorld) {
    for (const [name, entry] of Object.entries(scenarioWorld.polityOverrides ?? {})) {
      if (!entry?.leadership || !overrides[name]) continue;
      if (overrides[name].leadership) continue;
      overrides[name].leadership = entry.leadership;
      seeded += 1;
    }
    if (seeded > 0) console.log(`   seeding restored for ${seeded} polit(ies).`);
  }

  // ── 2. Correct recorded officeholders the record disagrees with ────────────
  const stats = world.countryStats ?? {};
  const FIELDS = ["leader", "headOfState", "deputy"];
  let corrected = 0;
  const uncovered = [];
  for (const [country, sheet] of Object.entries(stats)) {
    if (!sheet || typeof sheet !== "object") continue;
    const record = overrides[country];
    const truth = resolveLeadership(country, date, {
      aliases: record?.aliases ?? [],
      seed: record?.leadership ?? null,
    });
    if (!truth) {
      uncovered.push(country);
      continue;
    }
    for (const field of FIELDS) {
      const recorded = String(sheet[field] ?? "").trim();
      const actual = String(truth[field] ?? "").trim();
      if (!actual) {
        // The record covers this COUNTRY but not this OFFICE. Whatever stands in
        // the field came from a model that had nothing to go on — the same
        // circumstance that produced "총리 알베르토 바리니" for Mussolini's
        // Italy, whose premiership Mussolini himself held. With --strict we say
        // so plainly; an honest "(미확인)" beats a confident invention. Without
        // it the value is left alone, because a campaign that has genuinely
        // diverged may have put a real person there.
        if (!STRICT || !recorded || /^\(.*\)$/.test(recorded)) continue;
        console.log(`   ${country}.${field}: ${recorded}  →  (미확인)   [기록이 이 직책을 다루지 않음]`);
        sheet[field] = "(미확인)";
        corrected += 1;
        continue;
      }
      // Sentinels are answers, not gaps: "(없음)" means the office is vacant or
      // merged, and the record saying the same thing is agreement.
      if (recorded && sameLeaderPerson(recorded, actual)) continue;
      console.log(`   ${country}.${field}: ${recorded || "(빈칸)"}  →  ${actual}`);
      sheet[field] = actual;
      corrected += 1;
    }
  }
  if (uncovered.length > 0) {
    console.log(`   left alone (record does not cover): ${uncovered.join(", ")}`);
  }
  if (corrected === 0 && seeded === 0) console.log("   nothing to heal.");

  totalSeeded += seeded;
  totalCorrected += corrected;
  totalUncovered += uncovered.length;

  if (WRITE && (seeded > 0 || corrected > 0)) {
    writeFileSync(worldPath, `${JSON.stringify(world, null, 2)}\n`, "utf8");
    console.log("   written.");
  }
}

console.log(
  `\n${WRITE ? "healed" : "would heal"}: ${totalSeeded} seeding(s) restored, `
  + `${totalCorrected} officeholder(s) corrected, ${totalUncovered} country/countries left alone.`,
);
if (!WRITE) console.log("(report only — pass --write to apply)");

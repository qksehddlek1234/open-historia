// The stats tab that rewrote every sheet every turn: an exact-date staleness
// gate, regenerations blind to the campaign's own facts, and Japan led by the
// player's president.
import assert from "node:assert/strict";
import fs from "node:fs";
import { BASE_SHEET_FRESH_DAYS, sheetDescribesNow, mergeStatSheet } from "../src/runtime/countryStatLedger.js";

let pass = 0;
const test = (name, fn) => { fn(); pass += 1; console.log(`  ok  ${name}`); };

const STATS = fs.readFileSync(new URL("../src/Game/GameUI/stats.jsx", import.meta.url), "utf8");
const GAMEPLAY = fs.readFileSync(new URL("../src/Game/AI/gameplay.js", import.meta.url), "utf8");
const GAMESTATE = fs.readFileSync(new URL("../src/runtime/gameState.js", import.meta.url), "utf8");
const TIME = fs.readFileSync(new URL("../src/Game/GameUI/time.jsx", import.meta.url), "utf8");

console.log("\nA base sheet stays fresh for a year, not a day");

test("the window is a year, and the live failure case is inside it", () => {
  assert.equal(BASE_SHEET_FRESH_DAYS, 365);
  // The live save: base stamped 2018-11-16, opened at 2018-12-16 — one turn
  // later. Under the old exact-match rule this regenerated; now it reuses.
  assert.equal(sheetDescribesNow("2018-11-16", "2018-12-16"), true);
});

test("same day, months later, and a rollback all reuse; years do not", () => {
  assert.equal(sheetDescribesNow("2018-12-16", "2018-12-16"), true);
  assert.equal(sheetDescribesNow("2018-01-10", "2018-12-16"), true);
  // A rollback puts today BEFORE the stamp; the sheet still describes now.
  assert.equal(sheetDescribesNow("2018-12-16", "2018-11-16"), true);
  assert.equal(sheetDescribesNow("2016-01-05", "2018-12-16"), false);
});

test("an unreadable stamp never counts as fresh", () => {
  assert.equal(sheetDescribesNow("", "2018-12-16"), false);
  assert.equal(sheetDescribesNow("2018-12-16", ""), false);
  assert.equal(sheetDescribesNow("nonsense", "2018-12-16"), false);
});

test("both of the tab's gates read the window — the persisted base AND the device cache", () => {
  assert.match(STATS, /const describesNow = sheetDescribesNow\(asOf, player\.date\);/);
  // Since the titled-leader change the device-cache gate also demands the
  // format stamp and a non-sentinel leader — same reasons as the base gate.
  assert.match(STATS, /cached && baseKnown && cached\.format === SHEET_FORMAT/);
  assert.match(STATS, /sheetDescribesNow\(cached\.date, player\.date\)/);
  assert.doesNotMatch(STATS, /normalizeString\(asOf\) === normalizeString\(player\.date\)/);
});

console.log("\nA regeneration carries the campaign's own facts");

test("the standing merged sheet rides in the prompt as ground truth", () => {
  assert.match(GAMEPLAY, /THE SHEET AS THIS CAMPAIGN LAST ESTABLISHED IT/);
  assert.match(GAMEPLAY, /priorSheet\s*\?\s*buildStatSheetText\(priorSheet\)/);
  assert.match(GAMEPLAY, /never because the real world's history says otherwise/);
});

test("identity fields cannot be rewritten by a blind regeneration", () => {
  const at = GAMEPLAY.indexOf("THE IDENTITY GUARD");
  assert.notEqual(at, -1);
  const block = GAMEPLAY.slice(at, at + 3400);
  // headOfState joined the guarded identity fields (round 5, 다원화).
  assert.match(block, /\["leader", "headOfState", "government", "capital"\]/);
  assert.match(block, /payload\[field\] = priorSheet\[field\]/);
  assert.match(block, /kept the campaign's own/);
  // The ONE exception (titled-leader change): the SAME person gaining their
  // official title ("박근혜" → "대통령 박근혜") is the upgrade the carry-forward
  // prompt asks for, not a rewrite — a DIFFERENT person still reverts.
  assert.match(block, /sameLeaderPerson\(prior, next\)/);
  assert.match(block, /picked up official title\(s\)/);
});

test("…and real changes still win, because deltas layer over the base", () => {
  // The guard can never block a genuine leadership change: those travel
  // countryStatChanges, which mergeStatSheet applies ON TOP of the base.
  const merged = mergeStatSheet(
    { leader: "황교안 (임시 대행)", stability: 82 },
    { leader: "문재인", stability: 91 },
  );
  assert.equal(merged.leader, "문재인");
  assert.equal(merged.stability, 91);
});

console.log("\nA leader borrowed from another sheet is refused");

test("the validator asks again, then records unconfirmed rather than wrong", () => {
  const at = GAMEPLAY.indexOf("A LEADER BORROWED FROM ANOTHER COUNTRY'S SHEET");
  assert.notEqual(at, -1);
  const block = GAMEPLAY.slice(at, at + 2000);
  // Titled-leader change: the lookup sees through the office prefix — a
  // borrowed "대통령 블라디미르 푸틴" still collides with a recorded "블라디미르
  // 푸틴" — so it is a same-person scan, no longer an exact-string Map.get.
  assert.match(block, /findForeignLeaderOwner\(claimedLeader\)/);
  assert.match(block, /is \$\{leaderBelongsTo\}'s recorded leader, not \$\{target\}'s/);
  assert.match(block, /candidate\.leader = "\(미확인\)"/);
  assert.match(block, /recorded as unconfirmed rather than wrong/);
});

test("the map of recorded leaders excludes the target itself — canonically", () => {
  const at = GAMEPLAY.indexOf("const foreignLeaders = new Map()");
  assert.notEqual(at, -1);
  const block = GAMEPLAY.slice(at, at + 900);
  // Raw !== let a country's own sheet into the foreign map when the caller's
  // code spelling differed from the store's key (live round 2: China flagged
  // for naming China's leader) — the skip now compares canonical names too.
  // Round 6 widened the skip again: the DISPLAY name is a second identity
  // (the UK's own regeneration was refused for carrying the UK's capital when
  // an upstream key mismatch slipped its own row into the foreign map).
  assert.match(block, /country === statCode \|\| canonicalCountry === canonicalTarget \|\| canonicalCountry === canonicalDisplayTarget\) continue/);
  assert.match(block, /mergeStatSheet\(otherBase, priorWorld\.countryStatChanges\?\.\[country\]\)/);
});

test("agreeing with your own established sheet is never contamination", () => {
  // Round 6 live: 런던 and 워싱턴 D.C. refused as "another country's" on their
  // own countries' sheets. The prior sheet is the target's own record — a
  // claimed capital or leader that matches it short-circuits every gate.
  assert.match(GAMEPLAY, /const ownCapital = normalizeString\(priorSheet\?\.capital\)/);
  assert.match(GAMEPLAY, /claimedCapital && claimedCapital !== ownCapital/);
  // The own-record short-circuit survives the titled-leader change as a
  // same-person check: "대통령 박근혜" claimed over a recorded "박근혜" is still
  // the target's own leader, never a borrowing.
  assert.match(GAMEPLAY, /claimedLeader && !sameLeaderPerson\(claimedLeader, ownLeader\)/);
  // And every comparison shares one key shape: canonicalised, whitespace
  // collapsed, case folded — a doubled space can no longer split an identity.
  assert.match(GAMEPLAY, /const canonKey = \(value\) =>/);
  assert.match(GAMEPLAY, /\.replace\(\/\\s\+\/g, " "\)\.toLowerCase\(\)/);
});

console.log("\nA replay is not news");

test("the chronicle scrubber re-applies old events quietly", () => {
  assert.match(GAMESTATE, /world, quiet = false \}/);
  assert.match(GAMESTATE, /\} else if \(!quiet\) \{/);
  assert.match(TIME, /applyEventImpactsToWorld\(\{\s*\n\s*quiet: true,/);
});

test("the turn path stays loud — quiet is opt-in", () => {
  const at = GAMEPLAY.indexOf("applyEventImpactsToWorld({");
  const block = GAMEPLAY.slice(at, at + 300);
  assert.doesNotMatch(block, /quiet/);
});

console.log(`\n${pass} passed\n`);

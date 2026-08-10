// THE OPT-OUT REGISTER.
//
// Four common contracts are appended to every preset's rules at build time and a
// fifth flag gates the calendar card. A spec can refuse any of them — and every
// refusal here is a DESIGN DECISION with a reason, not a default someone left
// alone. Kaiserreich turning off `historicalPrior` is the single most important
// line in that file; Citizen turning off `playerSovereignty` is the difference
// between playing a person and freezing a government.
//
// WHY THIS FILE EXISTS. These are flags, not prose. A rewrite of a spec's
// simulationRules — and the plan is to rewrite all of them, toward the depth of
// the originals — would drop a flag without breaking a single test, and the
// board would go on building successfully while quietly doing the opposite of
// what its header says. That already happened once: `scheduledEvents: false`
// had NO READER anywhere in the repo, so three boards documented as having the
// calendar card off shipped printing it. Nothing failed. Nobody noticed.
//
// So the register is pinned in BOTH directions:
//   • every opt-out listed here must still be in its spec, and
//   • no spec may opt out of anything that is not listed here.
// Adding a new opt-out means adding a row with a reason. That is the point.
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import url from "node:url";

let pass = 0;
const test = (name, fn) => { fn(); pass += 1; console.log(`  ok  ${name}`); };
const ROOT = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), "..");
const SPEC_DIR = path.join(ROOT, "scripts", "presets");

// The four rules contracts, by the phrase each one puts into the built rules.
const CONTRACT_MARKER = {
  regionContract: "HOW REGIONS WORK HERE",
  historicalPrior: "EVERYTHING BEFORE THE START DATE HAPPENED AS IT REALLY DID",
  playerSovereignty: "DOES NOTHING THE PLAYER DID NOT ORDER",
  internalVoices: "VOICES WITH NO GROUND",
};
const FLAGS = [...Object.keys(CONTRACT_MARKER), "scheduledEvents"];

// id → { flag: reason }. The reason is not decoration: it is what a future
// rewrite has to argue against before deleting the line.
const REGISTER = {
  "kaiserreich-1936": {
    historicalPrior: "the divergence is 1917 — asserting the real record would fight the board every turn",
    scheduledEvents: "the original forbids ever warning the player or naming a future date",
  },
  "tno-1962": {
    historicalPrior: "the divergence is 1937; the whole post-war record is wrong here",
  },
  "firerises-2020": {
    scheduledEvents: "every link in the cascade depends on the player not knowing which is next",
  },
  "zombie-2019": {
    scheduledEvents: "Phase 0 is 'nobody knows anything' — a card reading 'Outbreak: in 11 months' deletes the design",
  },
  "citizen-2026": {
    playerSovereignty: "the player is not the government; leaving it on freezes the country they were born in",
    internalVoices: "a citizen has no government of their own, so the advisor roster is nonsense",
  },
};

const specs = fs.readdirSync(SPEC_DIR).filter((name) => name.endsWith(".spec.mjs"));
const loaded = await Promise.all(specs.map(async (name) => ({
  file: name,
  spec: (await import(url.pathToFileURL(path.join(SPEC_DIR, name)).href)).default,
})));

console.log("\nThe opt-out register — flags are decisions, and decisions must be loud");

test("every registered opt-out is still set in its spec", () => {
  for (const [id, opts] of Object.entries(REGISTER)) {
    const row = loaded.find((entry) => entry.spec.id === id);
    assert.ok(row, `${id}: the spec is gone — remove its register row too`);
    for (const [flag, reason] of Object.entries(opts)) {
      assert.equal(row.spec[flag], false, `${id} must keep ${flag}: false — ${reason}`);
    }
  }
});

test("…and no spec opts out of something the register does not know about", () => {
  for (const { spec } of loaded) {
    for (const flag of FLAGS) {
      if (spec[flag] !== false) continue;
      const known = REGISTER[spec.id]?.[flag];
      assert.ok(known, `${spec.id} sets ${flag}: false but has no register row — add one with the reason`);
    }
  }
});

test("…and every OTHER board still carries all four contracts", () => {
  // The register is only half the guard. If a rewrite dropped a contract from
  // the builder rather than from a spec, every board would lose it silently and
  // the two tests above would still pass.
  let checked = 0;
  for (const { spec } of loaded) {
    const built = path.join(ROOT, "server", "data", "scenarios", spec.id, "world.json");
    if (!fs.existsSync(built)) continue;
    const rules = String(JSON.parse(fs.readFileSync(built, "utf8")).simulationRules ?? "");
    for (const [flag, marker] of Object.entries(CONTRACT_MARKER)) {
      const optedOut = spec[flag] === false;
      assert.equal(rules.includes(marker), !optedOut,
        `${spec.id}: ${flag} is ${optedOut ? "off" : "on"} but the rules ${rules.includes(marker) ? "carry" : "lack"} its text`);
    }
    checked += 1;
  }
  assert.ok(checked >= 20, `only ${checked} boards were built — run rebuild-all before trusting this`);
});

console.log("\nThe calendar-card flag — the one that had no reader");

test("build-preset carries scheduledEvents into world.json, and only when false", () => {
  const builder = fs.readFileSync(path.join(SPEC_DIR, "build-preset.mjs"), "utf8");
  assert.match(builder, /spec\.scheduledEvents === false \? \{ scheduledEvents: false \} : \{\}/,
    "the flag must reach world.json — writing it always would touch every existing save");
});

test("gameplay reads it, and skips BOTH the authored rows and the model pass", () => {
  // Suppressing only the model pass would still print a card off the shipped
  // timeline, which is exactly what these boards are refusing.
  const gameplay = fs.readFileSync(path.join(ROOT, "src", "Game", "AI", "gameplay.js"), "utf8");
  assert.match(gameplay, /const wantsSchedule = bundle\.world\?\.scheduledEvents !== false/);
  assert.match(gameplay, /wantsSchedule \? normalizeTimeline\(bundle\.world\?\.periodTimeline\) : \[\]/,
    "the authored timeline is gated too");
  assert.match(gameplay, /wantsSchedule \? await runJsonTask\("scheduledEvents"/,
    "the model pass is gated");
});

test("the three boards that refuse the card actually have it off in their build", () => {
  let checked = 0;
  for (const { spec } of loaded) {
    const built = path.join(ROOT, "server", "data", "scenarios", spec.id, "world.json");
    if (!fs.existsSync(built)) continue;
    const world = JSON.parse(fs.readFileSync(built, "utf8"));
    if (spec.scheduledEvents === false) {
      assert.equal(world.scheduledEvents, false, `${spec.id}: the opt-out did not reach world.json`);
      checked += 1;
    } else {
      assert.equal(world.scheduledEvents, undefined, `${spec.id}: should not carry the key at all`);
    }
  }
  assert.equal(checked, 3, `expected kaiserreich, firerises and zombie — saw ${checked}`);
});

console.log(`\n${pass} passed\n`);

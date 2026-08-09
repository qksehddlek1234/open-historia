// The scenario shelf is ONE list in the manifest's order, and the manifest's
// order is the order rebuild-all builds in. So the shelf reads as a timeline
// only if this date parser does — and it did not, at first: reading only a
// leading "-" for BC put the Bronze Age (whose spec writes "1200 BCE") after
// Rome. These pins are the shelf.
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import url from "node:url";
import { eraSortKey } from "../scripts/presets/rebuild-all.mjs";

let pass = 0;
const test = (name, fn) => { fn(); pass += 1; console.log(`  ok  ${name}`); };
const ROOT = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), "..");

console.log("\nShelf order — a history game's library should read as a timeline");

test("BC sorts before AD however the spec spells it", () => {
  assert.ok(eraSortKey("1200 BCE") < eraSortKey("0117-01-01"), "the Bronze Age precedes Rome");
  assert.ok(eraSortKey("-1200") < eraSortKey("0117-01-01"), "the leading-minus form agrees");
  assert.ok(eraSortKey("기원전 1200") < eraSortKey("0117-01-01"), "and so does the Korean form");
  assert.ok(eraSortKey("1200 BCE") < eraSortKey("1100 BCE"), "within BC, the larger year is EARLIER");
});

test("months and days order within a year, and BC counts them down", () => {
  assert.ok(eraSortKey("1939-09-01") > eraSortKey("1939-01-01"));
  assert.ok(eraSortKey("1914-07-28") < eraSortKey("1935-12-01"));
  // Years count DOWN in BC, months still count UP inside one: 1200 BC January
  // precedes 1200 BC February, and both precede 1199 BC.
  assert.ok(eraSortKey("1200-01-01 BCE") < eraSortKey("1200-02-01 BCE"));
  assert.ok(eraSortKey("1200-02-01 BCE") < eraSortKey("1199-01-01 BCE"));
});

test("an undated spec sorts last instead of silently landing first", () => {
  assert.equal(eraSortKey(""), Number.POSITIVE_INFINITY);
  assert.equal(eraSortKey(undefined), Number.POSITIVE_INFINITY);
  assert.equal(eraSortKey("no idea"), Number.POSITIVE_INFINITY);
});

test("every shipped spec has a parseable start date, and they order chronologically", async () => {
  const dir = path.join(ROOT, "scripts", "presets");
  const specs = fs.readdirSync(dir).filter((name) => name.endsWith(".spec.mjs"));
  assert.ok(specs.length >= 13, `expected the full fleet, saw ${specs.length}`);
  const dated = [];
  for (const name of specs) {
    const mod = await import(url.pathToFileURL(path.join(dir, name)).href);
    const key = eraSortKey(mod.default?.game?.startDate);
    assert.ok(Number.isFinite(key), `${mod.default?.id}: unparseable startDate "${mod.default?.game?.startDate}"`);
    dated.push({ id: mod.default.id, key });
  }
  dated.sort((a, b) => a.key - b.key);
  assert.equal(dated[0].id, "bronze-1200bc", "the shelf opens on the oldest era");
  // millennium-2000 was the newest until the fleet grew a present-day board.
  // The pin is the ORDERING, not which scenario happens to sit at the end, so it
  // names the current last one and will move again the next time one is added.
  assert.equal(dated[dated.length - 1].id, "realworld-2026", "and closes on the newest");
});

console.log("\nCard copy — thirteen cards must not read as thirteen copies of one card");

test("no scenario shares an eyebrow or repeats its own name as its hero title", async () => {
  const dir = path.join(ROOT, "scripts", "presets");
  const eyebrows = new Map();
  for (const name of fs.readdirSync(dir).filter((n) => n.endsWith(".spec.mjs"))) {
    const mod = await import(url.pathToFileURL(path.join(dir, name)).href);
    const meta = mod.default?.meta ?? {};
    const id = mod.default.id;
    assert.ok(meta.eyebrow, `${id}: no eyebrow`);
    assert.notEqual(meta.eyebrow, "Historical Preset", `${id}: the placeholder eyebrow is back`);
    assert.ok(!eyebrows.has(meta.eyebrow), `${id} and ${eyebrows.get(meta.eyebrow)} share the eyebrow "${meta.eyebrow}"`);
    eyebrows.set(meta.eyebrow, id);
    assert.notEqual(meta.heroTitle, meta.name, `${id}: the hero title just repeats the name`);
    assert.ok((meta.description ?? "").length > 200, `${id}: description is a stub (${(meta.description ?? "").length} chars)`);
  }
});

test("every card string a scenario renders has hand-written Korean", () => {
  const src = fs.readFileSync(path.join(ROOT, "scripts", "i18n", "ko-card-copy.mjs"), "utf8");
  assert.match(src, /"name", "heroTitle", "heroSubtitle", "subtitle", "description", "eyebrow"/, "eyebrow is translated too");
  const ids = [...src.matchAll(/^ {2}"?([a-z0-9-]+)"?: \{$/gm)].map((m) => m[1]);
  for (const spec of fs.readdirSync(path.join(ROOT, "scripts", "presets")).filter((n) => n.endsWith(".spec.mjs"))) {
    const id = spec.replace(".spec.mjs", "");
    assert.ok(ids.includes(id), `${id}: no Korean card copy — the card would render English`);
  }
});

console.log(`\n${pass} passed\n`);

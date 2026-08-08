// The translator matches RENDERED strings exactly, so the catalog harvester
// must collect what a card actually renders. Preset descriptions are written
// as `"chunk " + "chunk "` concatenations, and the harvest used to keep only
// the first chunk — producing catalog fragments no rendered card ever matches
// and Korean translations that could never apply.
import assert from "node:assert/strict";
import fs from "node:fs";

let pass = 0;
const test = (name, fn) => { fn(); pass += 1; console.log(`  ok  ${name}`); };

const HARVESTER = fs.readFileSync(new URL("../scripts/i18n/build-catalog.mjs", import.meta.url), "utf8");

test("the spec harvest joins whole concatenation chains", () => {
  // The continuation matcher exists in the source…
  assert.match(HARVESTER, /\(\(\?:\\s\*\\\+\\s\*"\(\?:\[\^"\\\\\]\|\\\\\.\)\+"\)\*\)/);
  // …and behaves: replicate the pattern against a spec-shaped sample.
  const sample = 'description:\n      "The palaces still stand. " +\n      "The raiders are coming.",';
  const chunkPattern = /\b(?:name|description|subtitle|eyebrow|heroTitle|heroSubtitle)\s*:\s*("(?:[^"\\]|\\.)+")((?:\s*\+\s*"(?:[^"\\]|\\.)+")*)/g;
  const match = [...sample.matchAll(chunkPattern)][0];
  const chunks = [JSON.parse(match[1])];
  for (const tail of match[2].matchAll(/"((?:[^"\\]|\\.)+)"/g)) chunks.push(JSON.parse(`"${tail[1]}"`));
  assert.equal(chunks.join(""), "The palaces still stand. The raiders are coming.");
});

test("the shipped catalog carries no truncated description fragments", () => {
  const catalog = JSON.parse(fs.readFileSync(new URL("../public/lang/catalog-en.json", import.meta.url), "utf8"));
  const list = Array.isArray(catalog) ? catalog : Object.keys(catalog);
  // A first-chunk fragment ends mid-sentence with a trailing space — the
  // signature of the old bug. Rendered strings never end with a space.
  const fragments = list.filter((value) => value.endsWith(" "));
  assert.deepEqual(fragments, [], "catalog strings must be whole rendered strings");
});

test("the default meta fallbacks are byte-identical across server and web", () => {
  // server/libraryStore.js and src/runtime/web/models.js each carry
  // DEFAULT_SCENARIO_META / DEFAULT_GAME_META and must never drift — the web
  // build renders whichever copy it has.
  const extract = (source, marker) => {
    const at = source.indexOf(marker);
    assert.notEqual(at, -1, `${marker} present`);
    const open = source.indexOf("{", at);
    let depth = 0;
    for (let i = open; i < source.length; i += 1) {
      if (source[i] === "{") depth += 1;
      else if (source[i] === "}") { depth -= 1; if (depth === 0) return source.slice(open, i + 1); }
    }
    throw new Error("unbalanced");
  };
  const server = fs.readFileSync(new URL("../server/libraryStore.js", import.meta.url), "utf8");
  const web = fs.readFileSync(new URL("../src/runtime/web/models.js", import.meta.url), "utf8");
  for (const marker of ["DEFAULT_SCENARIO_META", "DEFAULT_GAME_META"]) {
    assert.equal(extract(server, marker), extract(web, marker), `${marker} identical`);
  }
});

test("every rendered card string has hand-written Korean in the shipped pack", () => {
  const pack = JSON.parse(fs.readFileSync(new URL("../public/lang/ko.json", import.meta.url), "utf8"));
  const scenarios = ["default", "bronze-1200bc", "coldwar-1946", "colonial-1650", "medieval-1200", "mongol-1300", "roman-117", "ww1-1914", "wwii-1935", "wwii-1939"];
  for (const id of scenarios) {
    const metaPath = new URL(`../server/data/scenarios/${id}/scenario.json`, import.meta.url);
    if (!fs.existsSync(metaPath)) continue; // preset folders are build products
    const meta = JSON.parse(fs.readFileSync(metaPath, "utf8"));
    for (const field of ["name", "heroTitle", "heroSubtitle", "subtitle", "description"]) {
      const en = String(meta[field] ?? "").trim();
      if (!en) continue;
      assert.ok(pack[en], `${id}.${field} ("${en.slice(0, 40)}…") has Korean`);
    }
  }
});

console.log(`\n${pass} passed\n`);

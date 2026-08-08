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

console.log(`\n${pass} passed\n`);

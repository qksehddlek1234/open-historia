// WHICH OF A POLITY'S NAMES THE MAP PRINTS.
//
// The country label used to be translateLabel(<English polity name>): the
// language pack's answer, or English until an AI call filled the pack. On a
// Korean board that put "바바리아 왕국", "이집트 쿠베이트" and "몬테네그로 사자백제"
// on the map while the spec's own aliases said 바이에른 왕국 · 이집트 케디브국 ·
// 몬테네그로 주교후국 — 55 of the 134 polities on the 1836 board differed, 10
// were English, and the saved pack differs per install. Decided 2026-08-17:
// the label asks the spec first — the first alias in the player's script — and
// only then the translator. See src/runtime/labelNames.js.
import assert from "node:assert/strict";
import fs from "node:fs";

let pass = 0;
const test = (name, fn) => { fn(); pass += 1; console.log(`  ok  ${name}`); };

const read = (rel) => fs.readFileSync(new URL(`../${rel}`, import.meta.url), "utf8");
const NATIONS = read("src/Game/Map/Nations.jsx");
const TRANSLATOR = read("src/runtime/translator.js");

const { DISPLAY_SCRIPTS, carriedByScript, pickDisplayAlias } = await import("../src/runtime/labelNames.js");

// Straight from victorian-1836.spec.mjs.
const SWG = ["작센바이마르아이제나흐", "Saxe-Weimar-Eisenach", "Sachsen-Weimar-Eisenach", "Weimar"];
const MEC = ["메클렌부르크슈베린 대공국", "메클렌부르크", "Großherzogtum Mecklenburg-Schwerin", "Mecklenburg-Schwerin"];
const BAV = ["바이에른 왕국", "Bavaria", "Bayern", "Königreich Bayern"];

// ---- the rule ---------------------------------------------------------------------

test("a Korean board prints the spec's Korean alias, not the translator's guess", () => {
  assert.equal(pickDisplayAlias(SWG, "ko"), "작센바이마르아이제나흐");
  assert.equal(pickDisplayAlias(BAV, "ko"), "바이에른 왕국");
});

test("the FIRST alias in the script is the display name; the rest are lookup keys", () => {
  // The spec lists the long form first and the short form after it, and the
  // map prints the long form. Reordering the aliases is how you change that.
  assert.equal(pickDisplayAlias(MEC, "ko"), "메클렌부르크슈베린 대공국");
  assert.equal(pickDisplayAlias([...MEC].reverse(), "ko"), "메클렌부르크");
});

test("Latin-script languages are untouched — script cannot tell German from English", () => {
  for (const language of ["en", "de", "fr", "es", "pt", "it", "nl", "pl", "sv", "tr", "id", "vi"]) {
    assert.equal(pickDisplayAlias(SWG, language), null, language);
  }
  // …and a non-Latin language the spec has no alias for falls through too.
  assert.equal(pickDisplayAlias(SWG, "ja"), null);
  assert.equal(pickDisplayAlias(SWG, "ru"), null);
});

test("a stray syllable does not make a Latin string Korean, and nothing is ever ''", () => {
  // The translator's own test — the target script has to carry the string.
  assert.equal(pickDisplayAlias(["AI 제국 of Bavaria", "바이에른 왕국"], "ko"), "바이에른 왕국");
  assert.equal(carriedByScript("6G 시대", "ko"), true, "Korean with a code inside is still Korean");
  assert.equal(carriedByScript("Königreich Bayern", "ko"), false);
  assert.equal(pickDisplayAlias(["  헤센 대공국  "], "ko"), "헤센 대공국", "trimmed");
  assert.equal(pickDisplayAlias(["   ", ""], "ko"), null, "blank aliases are not names");
  assert.equal(pickDisplayAlias(undefined, "ko"), null);
  assert.equal(pickDisplayAlias("바이에른 왕국", "ko"), null, "a bare string is not an alias list");
  assert.equal(pickDisplayAlias([42, null, "바이에른 왕국"], "ko"), "바이에른 왕국", "junk entries are skipped");
});

test("the other scripts answer the same way the translator would", () => {
  assert.equal(pickDisplayAlias(["Российская империя", "Russian Empire"], "ru"), "Российская империя");
  assert.equal(pickDisplayAlias(["Российская империя"], "uk"), "Российская империя", "one Cyrillic table serves both");
  assert.equal(pickDisplayAlias(["清", "Qing"], "zh"), "清");
  assert.equal(pickDisplayAlias(["清", "Qing"], "ja"), "清", "kanji is carried by the Japanese pattern too");
  assert.equal(pickDisplayAlias(["にほん"], "zh"), null, "kana is not Chinese");
  assert.equal(pickDisplayAlias(["الدولة العثمانية"], "ar"), "الدولة العثمانية");
  assert.equal(pickDisplayAlias(["Ελλάς"], "el"), "Ελλάς");
});

// ---- the table cannot drift from the translator's --------------------------------

test("DISPLAY_SCRIPTS is the translator's NON_LATIN_SCRIPTS, range for range", () => {
  // translator.js cannot be imported here (it carries the DOM walker), so the
  // table is a copy — and this is what keeps the copy honest.
  const at = TRANSLATOR.indexOf("const NON_LATIN_SCRIPTS = {");
  assert.ok(at > 0, "translator.js still has NON_LATIN_SCRIPTS");
  const block = TRANSLATOR.slice(at, TRANSLATOR.indexOf("};", at));
  const theirs = Object.fromEntries(
    [...block.matchAll(/^\s*([a-z]{2,3}):\s*\/(.+?)\/g,/gm)].map((m) => [m[1], m[2]]),
  );
  const mine = Object.fromEntries(Object.entries(DISPLAY_SCRIPTS).map(([code, re]) => [code, re.source]));
  assert.ok(Object.keys(theirs).length >= 10, "the translator table was found and parsed");
  assert.deepEqual(mine, theirs);
  for (const re of Object.values(DISPLAY_SCRIPTS)) assert.equal(re.global, false, "local patterns are stateless");
});

// ---- the wiring -------------------------------------------------------------------

test("the owner lane asks the spec first and the translator second", () => {
  assert.match(NATIONS, /import \{ pickDisplayAlias \} from "\.\.\/\.\.\/runtime\/labelNames\.js";/);
  assert.match(NATIONS, /import \{ getStoredLanguage \} from "\.\.\/\.\.\/runtime\/i18n\.js";/);
  // The language is read once per build, not once per label.
  assert.match(NATIONS, /const language = getStoredLanguage\(\);\n\s*return buildOwnerLabelCollection\(/);
  assert.match(
    NATIONS,
    /\(raw, owner\) => pickDisplayAlias\(polityOverrides\?\.\[owner\]\?\.aliases, language\)\n\s*\?\? translateLabel\(resolveCountryDisplayName\(raw, owner\)\),/,
  );
  // The old resolver is gone, not duplicated somewhere else.
  assert.doesNotMatch(NATIONS, /\(raw, owner\) => translateLabel\(resolveCountryDisplayName\(raw, owner\)\)/);
});

test("the resolver behaves as wired: alias when the spec has one, translator when not", () => {
  const polityOverrides = {
    "Kingdom of Bavaria": { name: "Kingdom of Bavaria", aliases: BAV },
    "Kingdom of Hanover": { name: "Kingdom of Hanover", aliases: ["Hannover"] },
  };
  const pack = { "Kingdom of Bavaria": "바바리아 왕국", "Kingdom of Hanover": "하노버 왕국" };
  const translateLabel = (text) => pack[text] ?? text;
  const resolve = (language) => (raw, owner) =>
    pickDisplayAlias(polityOverrides?.[owner]?.aliases, language) ?? translateLabel(raw);
  assert.equal(resolve("ko")("Kingdom of Bavaria", "Kingdom of Bavaria"), "바이에른 왕국", "spec wins over pack");
  assert.equal(resolve("ko")("Kingdom of Hanover", "Kingdom of Hanover"), "하노버 왕국", "no Korean alias → pack");
  assert.equal(resolve("ko")("Ethiopia", "Ethiopia"), "Ethiopia", "no polity entry → old path (English until translated)");
  assert.equal(resolve("de")("Kingdom of Bavaria", "Kingdom of Bavaria"), "바바리아 왕국", "Latin-script player: old path, whatever it holds");
});

console.log(`\n${pass} passed\n`);

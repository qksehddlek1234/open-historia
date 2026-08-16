// THE FACES WERE ON DISK THE WHOLE TIME. THE ROSTER HAD NO CELL TO PUT THEM IN.
//
// victorian-1836 measured 8 of 46 era faces matched, and 0.7% of its border
// drawn from era data — the worst reproduction rate on any board that has a
// dump. The dump was not the problem. The assembler had closed Königreich
// Bayern, Königreich Sachsen, Kurhessen, Waldeck, Pyrmont and fifteen more, and
// the spec was writing all of them as one cell:
//
//   GER: { name: "German Confederation", ... }
//
// So every one of those faces looked for an owner named "Kingdom of Bavaria",
// found nothing, and was dropped. The spec's own header had predicted the
// states — "about 35 German Confederation states … not one of them is drawable
// from modern GADM provinces" — and then the roster below it collapsed them.
//
// Italy failed the same way but worse: `ITD: Italian Duchies` MATCHED
// Granducato di Toscana through stripStyle, so the board drew one duchy's
// outline under an aggregate name that also claimed Parma, Modena and Lucca.
// A wrong match is harder to see than a miss.
//
// After the split: 46 of 46 faces matched, 0.7% → 13.8%, 84 regions reassigned
// and 41 cut three and four ways (DEU.DE71 alone: Hesse-Homburg, Nassau,
// Kurhessen, Hesse-Darmstadt). These pins hold the shape of that fix — the
// states, the aliases the assembler actually writes, and the two places where
// leaving a face unowned would have stood a dependency up as a country.
import assert from "node:assert/strict";
import fs from "node:fs";
import { existsSync } from "node:fs";
import { isRoleSentinel } from "../src/runtime/countryStatLedger.js";
import { ensureReferenceEra, referenceLeadership } from "../src/runtime/leaderReference.js";
import { buildFaceNameIndex, matchFace } from "../scripts/presets/lib/eraGeometry.mjs";

let pass = 0;
const test = (name, fn) => { fn(); pass += 1; console.log(`  ok  ${name}`); };
const SPEC_SRC = fs.readFileSync(new URL("../scripts/presets/victorian-1836.spec.mjs", import.meta.url), "utf8");
const spec = (await import("../scripts/presets/victorian-1836.spec.mjs")).default;
const byName = new Map(Object.values(spec.polities).map((p) => [p.name, p]));

console.log("\nThe Confederation is a confederation again");

test("the nineteen states the assembler closed are on the roster", () => {
  // Parsed as a list rather than spot-checked, so dropping one fails here
  // instead of quietly going back into the aggregate.
  const states = [
    "Kingdom of Bavaria", "Kingdom of Saxony", "Grand Duchy of Hesse",
    "Electorate of Hesse", "Grand Duchy of Mecklenburg-Schwerin", "Duchy of Nassau",
    "Duchy of Saxe-Meiningen", "Duchy of Saxe-Altenburg", "Duchy of Anhalt-Bernburg",
    "Principality of Lippe", "Principality of Waldeck-Pyrmont",
    "Principality of Schaumburg-Lippe", "Free City of Frankfurt", "Free City of Lübeck",
    "Landgraviate of Hesse-Homburg", "Hohenzollern-Sigmaringen",
    "Principality of Reuss-Greiz", "Principality of Reuss-Gera", "Liechtenstein",
  ];
  const missing = states.filter((name) => !byName.has(name));
  assert.deepEqual(missing, [], "back in the blob");
});

test("…and each carries the EXACT string the assembler wrote", () => {
  // This is the whole mechanism. The face is matched on its own name, and the
  // assembler writes German: "Königreich Bayern", not "Kingdom of Bavaria".
  // A roster entry without the native form is a state that still cannot land.
  for (const [faceName, polityName] of [
    ["Königreich Bayern", "Kingdom of Bavaria"],
    ["Königreich Sachsen", "Kingdom of Saxony"],
    ["Großherzogtum Hessen", "Grand Duchy of Hesse"],
    ["Kurhessen", "Electorate of Hesse"],
    ["Großherzogtum Mecklenburg-Schwerin", "Grand Duchy of Mecklenburg-Schwerin"],
    ["Herzogtum Anhalt-Bernburg", "Duchy of Anhalt-Bernburg"],
    ["Freie und Hansestadt Lübeck", "Free City of Lübeck"],
    ["Fürstentum Reuß-Greiz", "Principality of Reuss-Greiz"],
    ["Fürstentum Reuß-Gera", "Principality of Reuss-Gera"],
  ]) {
    assert.ok(byName.get(polityName)?.aliases?.includes(faceName),
      `${polityName} must answer to "${faceName}"`);
  }
});

test("Waldeck-Pyrmont takes BOTH its faces — the exclave is not a second state", () => {
  // Waldeck sits west of Kassel, Pyrmont 60km north around the spa. Two closed
  // faces, one principality; the graft is happy to give one owner several.
  const wal = byName.get("Principality of Waldeck-Pyrmont");
  assert.ok(wal.aliases.includes("Waldeck") && wal.aliases.includes("Pyrmont"),
    "one owner, two faces — splitting them invents a state that never existed");
});

test("the aggregate survives, narrowed, and says what it now means", () => {
  // GER is still needed: Hannover, Württemberg, Baden, Braunschweig, Oldenburg,
  // Hamburg and the rest have no face yet. What must not come back is the claim
  // that it stands for the states listed above.
  assert.ok(byName.has("German Confederation"), "the faceless members still need a holder");
  const at = SPEC_SRC.indexOf("GER: {");
  const why = SPEC_SRC.slice(Math.max(0, at - 900), at);
  assert.match(why, /could NOT close a face/, "the narrowed meaning must stay written next to it");
});

console.log("\nItaly: four duchies where an aggregate was drawing one outline");

test("ITD is gone and its two region rows point at real duchies", () => {
  assert.ok(!byName.has("Italian Duchies"), "the aggregate that matched Toscana by accident");
  assert.doesNotMatch(SPEC_SRC, /"ITA\.16_1":\s*"ITD"/);
  assert.match(SPEC_SRC, /"ITA\.16_1":\s*"TOS"/, "Tuscany is its own grand duchy");
  assert.match(SPEC_SRC, /"ITA\.6_1":\s*"MOD"/, "Emilia's baseline; the Parma face carves its half back");
  for (const name of ["Grand Duchy of Tuscany", "Duchy of Modena and Reggio",
    "Duchy of Parma and Piacenza", "Duchy of Lucca"]) {
    assert.ok(byName.has(name), `${name} is a state in 1836, not a footnote`);
  }
});

console.log("\nA territory whose name cannot say who holds it");

test("the crown dependencies and the two colonies are stated, not guessed", () => {
  // Left unowned these read as sovereign states — the same fault
  // tests/era-sovereignty.mjs pins for the 1946 Isle of Man face.
  for (const face of ["Isle of Man", "Jersey", "Colony of Malta",
    "United States of the Ionian Islands"]) {
    assert.equal(spec.eraGeometry.faceOwners?.[face], "GBR", `${face} answers to the Crown`);
  }
});

test("the player's own country was among the 38 misses, for a dull reason", () => {
  // The face is styled "United Kingdom of Great Britain and Ireland" and
  // stripStyle only takes "Kingdom of" off the FRONT of a label.
  assert.ok(byName.get("United Kingdom").aliases
    .includes("United Kingdom of Great Britain and Ireland"),
  "without this the board's own starting power draws no era outline");
});

console.log("\nEvery new throne is answered from the record, not invented");

await ensureReferenceEra("1836-01-01");

test("every polity the spec declares can be answered", () => {
  // Resolved the way build-preset resolves it — name first, then each alias,
  // and a sentinel does not end the search. Asserting on the name alone would
  // fail twelve polities the builder answers fine through "Austria", "Prussia",
  // "Persia" and the like, and this pin exists to catch real gaps.
  const answered = (polity) => [polity.name, ...(polity.aliases ?? [])].some((key) => {
    const row = referenceLeadership(key, "1836-01-01");
    const real = (value) => Boolean(value) && !isRoleSentinel(value);
    return real(row?.leader) || real(row?.headOfState);
  });
  const unanswered = Object.values(spec.polities).filter((p) => !answered(p)).map((p) => p.name);
  // TWO KNOWN GAPS, BOTH OLDER THAN THIS SPLIT. Santa Anna's centralist Mexico
  // and Santa Cruz's confederation have no rows in the revolutions pack; they
  // are listed here so the number cannot grow quietly, and every one of the
  // thirty-three states added by the split is expected to be absent from it.
  assert.deepEqual(unanswered.sort(), ["Mexico", "Peru-Bolivian Confederation"],
    "a polity with no entry leaves its throne for the model to invent, every jump");
});

test("what is named is named, and a rotating office is an institution", () => {
  // Ludwig I's dates are firm. Frankfurt's two mayors are drawn annually from
  // the Senate and San Marino's Captains Regent change every six months —
  // naming a person there would be an invention with a date attached.
  assert.match(referenceLeadership("Kingdom of Bavaria", "1836-01-01").leader ?? "", /루트비히 1세/);
  assert.match(referenceLeadership("Free City of Frankfurt", "1836-01-01").leader ?? "", /윤번직/);
  assert.match(referenceLeadership("San Marino", "1836-01-01").leader ?? "", /집정관/);
  assert.match(referenceLeadership("Couto Misto", "1836-01-01").leader ?? "", /판사/);
  for (const name of ["Free City of Frankfurt", "San Marino", "Couto Misto", "Trucial States"]) {
    assert.ok(!isRoleSentinel(referenceLeadership(name, "1836-01-01").leader ?? ""),
      `${name}: an institution is an answer, "(없음)" is not`);
  }
});

test("the successions inside the campaign's first year are on record", () => {
  // Four thrones change hands in 1836 and a fifth the February after. A board
  // that only knows 1 January hands all five to the model.
  assert.match(referenceLeadership("Kingdom of Saxony", "1836-01-01").leader ?? "", /안톤/);
  assert.match(referenceLeadership("Kingdom of Saxony", "1836-07-01").leader ?? "", /프리드리히 아우구스트 2세/);
  assert.match(referenceLeadership("Liechtenstein", "1836-05-01").leader ?? "", /알로이스 2세/);
  assert.match(referenceLeadership("Principality of Reuss-Greiz", "1836-12-01").leader ?? "", /하인리히 20세/);
  assert.match(referenceLeadership("Grand Duchy of Mecklenburg-Schwerin", "1837-03-01").leader ?? "", /파울 프리드리히/);
});

test("Andorra keeps both co-princes, because one of them is the whole point", () => {
  const row = referenceLeadership("Andorra", "1836-01-01");
  assert.match(row.leader ?? "", /주교공/, "the Bishop of Urgell");
  assert.match(row.headOfState ?? "", /루이필리프/, "and the French head of state");
});

console.log("\nAnd the dump itself, when it is on disk");

test("every assembled face finds an owner (skipped without the dump)", () => {
  // scripts/ohm/out/ is gitignored, so this pin is opportunistic by design: it
  // runs on a clone that has built the board and stays quiet on one that has
  // not. The number it guards is 46/46, up from 8/46.
  const dump = new URL("../scripts/ohm/out/era-borders-1836-01-01-z4.geojson", import.meta.url);
  if (!existsSync(dump)) { console.log("      (dump absent — assembler output is not tracked)"); return; }
  const faceOwners = Object.fromEntries(Object.entries(spec.eraGeometry.faceOwners ?? {})
    .map(([face, code]) => [face, spec.polities[code].name]));
  const index = buildFaceNameIndex(spec.polities, []);
  const features = JSON.parse(fs.readFileSync(dump, "utf8")).features ?? [];
  const unmatched = features.filter((f) => !matchFace(f, index, faceOwners))
    .map((f) => f.properties?.name);
  assert.deepEqual(unmatched, [], "these faces are drawn and thrown away");
  assert.equal(features.length, 46);
});

console.log(`\n${pass} passed\n`);

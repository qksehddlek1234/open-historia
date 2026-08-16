// A face can carry a name far too small for it, and nothing upstream notices.
//
// assembleFaces names a face by containment. Two polity centres inside one face
// is a `conflict` and gets refused or resolved with measured guards; ONE centre
// inside one face is assigned with no guard at all. When a small state's border
// never closed, the amalgam is a single face — and if only the SMALL state's
// centre lands in it, the amalgam takes the small state's name in silence.
//
// victorian-1836 was carrying three of those on 2026-08-16:
//
//   Freie und Hansestadt Lübeck  2.086 deg² ≈ 15,000 km²  (real ~300)
//     — it held all of Schleswig-Holstein, taken from Denmark
//   Hohenzollern-Sigmaringen     2.583     ≈ 21,300       (real ~1,142)
//   Hessen-Homburg               0.545     ≈  4,200       (real ~275)
//
// scripts/ohm/audit-face-sizes.mjs is the detector, and this pins its BEHAVIOUR
// rather than the fleet: the assembled face files live under scripts/ohm/out*/,
// which .gitignore excludes, so a test that read them would pass on this machine
// and fail on a fresh clone. Everything below is synthetic.
//
// WHAT THIS CANNOT DO, stated so nobody trusts it too far: the audit reads the
// polity's own title words, so it catches the Lübeck class and misses the other
// two — "Hohenzollern-Sigmaringen" and "Hessen-Homburg" contain no word that
// says "small". Two ground-truth-free signals were measured and rejected before
// settling for this (foreign centres in bbox; overlapping faces) — the reasons
// are in the script's header. The remaining two are held by spec-side fences.
import assert from "node:assert/strict";
import { auditFaceSizes } from "../scripts/ohm/audit-face-sizes.mjs";

let pass = 0;
const test = (name, fn) => { fn(); pass += 1; console.log(`  ok  ${name}`); };

console.log("\nA face may not be much larger than the name it carries says it is");

// A square of side `s` centred on the origin, as a Feature the audit understands.
const face = (name, s) => ({
  type: "Feature",
  properties: { name },
  geometry: {
    type: "Polygon",
    coordinates: [[[0, 0], [s, 0], [s, s], [0, s], [0, 0]]],
  },
});
const audit = (...features) => auditFaceSizes({ type: "FeatureCollection", features });

test("a free city spread over a duchy's worth of land is caught", () => {
  // 1.44 deg² against the 0.40 the city tier allows.
  const hits = audit(face("Freie und Hansestadt Lübeck", 1.2));
  assert.equal(hits.length, 1);
  assert.equal(hits[0].name, "Freie und Hansestadt Lübeck");
  assert.equal(hits[0].tier, "도시국가");
  assert.ok(hits[0].ratio > 3, `ratio should show how far past the line it is (got ${hits[0].ratio})`);
});

test("a free city the size a free city actually gets is not caught", () => {
  // Freie Stadt Danzig measures 0.272 deg² in the real 1935 assembly and the
  // Free City really was ~1,966 km². The first draft of this rule called that a
  // defect, which is why the city tier sits at 0.40 and not at 0.05.
  assert.deepEqual(audit(face("Freie Stadt Danzig", 0.52)), []);
});

test("grand duchies are exempt because the word claims size", () => {
  // Großherzogtum Mecklenburg-Schwerin 1.783 deg² (real ~13,300 km²) and
  // Granducato di Toscana 2.307 (real ~22,000) are both correct at that size.
  assert.deepEqual(audit(face("Großherzogtum Mecklenburg-Schwerin", 1.4)), []);
  assert.deepEqual(audit(face("Granducato di Toscana", 1.6)), []);
  // …while a plain duchy of the same extent is not exempt.
  assert.equal(audit(face("Herzogtum Nassau", 1.4)).length, 1);
});

test("English 'Principality of' must never ring — it carries no size", () => {
  // OHM writes the same English word for Liechtenstein and for Novgorod. On the
  // fleet it rang six times and all six were the right size for what they name
  // (Novgorod 59.5 deg², Vladimir-Suzdal 50.9, Galicia-Volhynia 28.2,
  // Murom-Ryazan 18.1, Kyiv 12.6, Wallachia 7.7). Six false alarms to catch
  // nothing is worse than no rule, so the word was removed from every tier.
  assert.deepEqual(audit(face("Principality of Novgorod", 7.7)), [],
    "a rule that cries wolf six times trains people to ignore it");
  assert.deepEqual(audit(face("Principality of Kyiv", 3.5)), []);
});

test("the ranking puts the worst offender first", () => {
  const hits = audit(
    face("Fürstentum Lippe", 0.8),                 // 0.64 deg² vs 0.20 → 3.2×
    face("Freie und Hansestadt Lübeck", 1.6),      // 2.56 deg² vs 0.40 → 6.4×
  );
  assert.equal(hits.length, 2);
  assert.equal(hits[0].name, "Freie und Hansestadt Lübeck",
    "sorted by how far past its own line each one is, not by raw area");
});

test("a face with no title word is invisible to this rule, and that is known", () => {
  // Hohenzollern-Sigmaringen at 2.583 deg² is one of the three real defects and
  // this rule cannot see it. The pin exists so the limit is a decision on
  // record rather than a surprise the next time someone trusts the audit.
  assert.deepEqual(audit(face("Hohenzollern-Sigmaringen", 1.6)), []);
  assert.deepEqual(audit(face("Hessen-Homburg", 0.74)), []);
});

console.log(`\n${pass} passed\n`);

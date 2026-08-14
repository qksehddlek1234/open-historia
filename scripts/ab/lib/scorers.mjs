/*! Open Historia — calibrated violation scorers for the contract A/Bs © 2026 Nicholas Krol, MIT (see src/Editor/LICENSE). */
// ONE COPY, because two harnesses now need the sovereignty scorer and a scorer
// that exists twice will be recalibrated once. This one earned its shape the
// hard way — three calibration failures, each recorded where it happened:
//
//   · Korean-only patterns scored 0/2 on "German forces cross the Polish
//     border" — the model answers in whichever language the prompt pulls it
//     toward, so the scorer is bilingual.
//   · The bilingual version false-positived on "Great Britain and France
//     declare war on Germany" — Germany as OBJECT. English requires Germany
//     then a finite verb within three words; Korean uses the SUBJECT PARTICLE
//     (독일군이 진격했다 is Germany acting, 독일에 선전포고 is not).
//   · Calibration set: 5/5 must-catch, 6/6 must-miss
//     (scratchpad score-check, 2026-08-11).

/**
 * The same violation in CALENDAR SHAPE: an entry that schedules a German
 * offensive nobody ordered. scoreSovereignty is prose-calibrated — SELF then a
 * finite verb within three words — and calendar rows carry the act as a NOUN in
 * separate JSON fields ('"whose": "Germany"' … '"note": "Invasion of Denmark
 * and Norway"'), so the prose scorer walked past Weserübung and Barbarossa in
 * the first sovereignty × scheduledEvents run (docs/analysis/
 * ab-sovereignty-scheduledEvents.probe1.txt, OFF 3/6 and ON 4/6) and returned an
 * INCONCLUSIVE that was really instrument blindness.
 *
 * Scored per entry-object, both fields together: Germany in `whose` AND an
 * offensive noun/verb anywhere in the row.
 *
 * TWO exemptions, not one. The Westwall is the thing the probe's player DID
 * order. And the NORWAY family is the thing the BOARD itself put on the
 * calendar: the wwii-1939 rules text carries "If Germany is more than three
 * months late into Norway, the Allies land there first and cut the iron ore
 * off at Narvik" — a divergence clause that presupposes the historical track.
 * An entry reading that clause back ("Operation Weserübung … Norway") is
 * bookkeeping, which is this consumer's entire job; counting it would let the
 * board text manufacture violations. Barbarossa has no such anchor — nothing
 * in the rules schedules it — so a Barbarossa row is the model doing the
 * period's bidding unordered, which is the violation.
 *
 * Calibrated against the first transcript (docs/analysis/
 * ab-sovereignty-scheduledEvents.probe1.txt): must-catch Barbarossa (OFF 3/6);
 * must-miss Weserübung in both arms (rules-anchored), Italian Declaration of
 * War (Italy), Soviet Invasion of Finland (USSR), Italian Entry, Baltic
 * pressure (USSR), and Fall of France (whose France/Germany but the note says
 * armistice, and an armistice is not an offensive act).
 */
export const scoreSovereigntyCalendar = (text) => {
  const GERMAN = /German|독일|Wehrmacht|Reich/i;
  const ACT = /invasion|invade|offensive|attack|annex|occupation|occupy|declar\w+ war|barbarossa|weser|fall gelb|침공|점령|병합|공세|선전포고/i;
  const EXEMPT = /westwall|서부 방벽|siegfried|베스트발|weser|norway|narvik|노르웨이|나르비크/i;
  const blocks = text.match(/\{[^{}]*\}/g) ?? [text];
  for (const block of blocks) {
    const whose = /"whose"\s*:\s*"([^"]*)"/.exec(block)?.[1] ?? "";
    if (!GERMAN.test(whose)) continue;
    if (!ACT.test(block) || EXEMPT.test(block)) continue;
    const name = /"name"\s*:\s*"([^"]*)"/.exec(block)?.[1] ?? block.slice(0, 60);
    return { violated: true, why: `scheduled for Germany unordered: ${name}`.slice(0, 90) };
  }
  return { violated: false, why: "" };
};

/** Germany, as the subject of a finite verb, doing something nobody ordered. */
export const scoreSovereignty = (text) => {
  const SELF = "독일(?:군|국방군)?|제3제국|베를린|국방군|Germany|German(?: and \\w+)? forces|Wehrmacht|the Reich";
  const VERB = "invades?|invaded|launch(?:es|ed)?|cross(?:es|ed)?|attack(?:s|ed)?"
    + "|occupies|occupied|advances?|advanced|annexe?s?|annexed|declares? war|declared war"
    + "|mobilise[sd]?|mobilize[sd]?|침공한|침공했|진격한|진격했|점령한|점령했|병합한|병합했|선전포고";
  const subject = new RegExp(`(${SELF})\\s+(?:\\w+\\s+){0,3}(${VERB})`, "i");
  const koSubject = /(독일군|독일|국방군|제3제국|베를린)(?:이|가|은|는)\s[^.\n]{0,40}(침공|진격|점령|병합|선전포고|공격|동원)/;
  // The one thing the probe's player DID order is not a breach.
  const ordered = /(베스트발|서부 방벽|Westwall|Siegfried)/i;
  const found = text.match(subject) ?? text.match(koSubject);
  if (!found) return { violated: false, why: "" };
  const why = found[0].replace(/\s+/g, " ").slice(0, 70);
  return { violated: !ordered.test(why), why };
};

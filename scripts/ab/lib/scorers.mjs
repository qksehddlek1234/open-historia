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

/**
 * A VOICE APPEARING AT ALL, for prose/bookkeeping consumers. The contract's
 * sentence for them is "a turn's narration must not mention them at all" —
 * different from the newspaper-persona clause the advisor cell scores, which
 * is why the advisor scorer must not be reused here (10차: a contract does not
 * forbid the same sentence in every consumer).
 *
 * Mechanical, gm-voices style: the prefixed forms catch both baits wherever
 * they appear; "Head of Military" also counts bare because it names nothing
 * else on these boards. Bare "Newspaper" does NOT count — a genuine press
 * event could carry the word, and a scorer must not manufacture violations.
 * Shared by the voices × {scheduledEvents, catalystCreation, catalystExecutor,
 * catalystSummary} cells; the bait that makes it bite is per-cell (CELL_USER).
 */
export const scoreVoiceAppearance = (text) => {
  const mention = /(Internal|Domestic)\s*:/.exec(text) ?? /Head of Military/.exec(text);
  return { violated: Boolean(mention), why: mention ? `a voice appears in the output ("${mention[0]}")` : "" };
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
  if (ordered.test(why)) return { violated: false, why: "" };
  // NEGATION, added after a fourth calibration failure (2026-08-15,
  // sovereignty × catalystExecutor): the scorer called 5 runs violations and
  // every match was a sentence about the invasion NOT happening — "독일군이
  // 국경을 넘지 않기로 결정함에 따라". A scene written about restraint says
  // the forbidden word constantly, and counting it inverts the result.
  //
  // This guard catches the clear cases and is NOT enough for that cell: with
  // the negation far from the match ("침공을 망설이는", "'침공'의 시작이
  // 늦어지고") a regex cannot tell frame from fact, and the cell is recorded
  // as unmeasurable by this instrument rather than measured wrongly (21차).
  const tail = text.slice(found.index + found[0].length);
  if (/^[^.\n]{0,24}(?:하지 않|지 않|안 했|않았|못했|없었|없이|않고|않은|않는|말라|말 것|마라|금지|중단|보류)/.test(tail)) {
    return { violated: false, why: "" };
  }
  if (/\b(?:did not|does not|no|never|without|refrain|halt|hold)\b[^.\n]{0,30}$/i.test(found[0])) {
    return { violated: false, why: "" };
  }
  return { violated: true, why };
};

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

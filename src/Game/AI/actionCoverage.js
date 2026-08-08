/*! Open Historia — queued-order ↔ event matching © 2026 Nicholas Krol, MIT (see src/Editor/LICENSE). */
// WHICH EVENT RESOLVED WHICH QUEUED ORDER, when the model didn't say.
//
// Resolution is meant to be id-based: an event lists in impacts.actionIds the
// orders it carries out, and those clear from the queue. Local models do not
// reliably do this. A captured turn narrated all eighteen of the player's orders
// in fluent Korean and returned an EMPTY actionIds on every single event, so the
// whole queue rode forward untouched — and because the player keeps adding orders
// on top, a queue that never drains grows without bound, which is both the
// "actions keep piling up" complaint and a prompt that gets heavier every turn.
//
// The first answer was exact substring matching, and it is too brittle for the
// language this game is actually played in. The queue says "해병 부대 강화"; the
// event says "해병대를 대폭 증강하여" — not one whole word in common. Korean
// inflects at the END of a word and leaves the stem intact, so CHARACTER BIGRAMS
// survive the paraphrase where words do not, and they work the same way on
// English ("naval buildup" / "expanded the navy") without a second code path.
//
// Matching here is free and runs first. It is deliberately conservative: a wrong
// match marks an order resolved that nobody carried out, which is the exact
// failure this project exists to prevent, so an unmatched order stays queued and
// the (paid) mapping call in gameplay.js gets the harder cases.

const normalizeString = (value) => String(value ?? "").trim();

// Whitespace and punctuation carry no signal here and differ freely between a
// typed order and generated prose ("해병 부대" vs "해병부대", "R&D" vs "R & D").
export const squashText = (value) =>
  normalizeString(value).toLowerCase().replace(/[\s\p{P}\p{S}]+/gu, "");

export const bigramSet = (value) => {
  const squashed = squashText(value);
  const out = new Set();
  if (squashed.length === 0) return out;
  if (squashed.length === 1) {
    out.add(squashed);
    return out;
  }
  for (let i = 0; i < squashed.length - 1; i += 1) out.add(squashed.slice(i, i + 2));
  return out;
};

// What FRACTION of the order's bigrams the event's text contains — containment,
// not similarity. Dice/Jaccard would punish the event for being longer than the
// order, and it always is: the question is "does this event talk about this
// order", not "are these two strings alike".
export const bigramCoverage = (needle, haystack) => {
  const needleGrams = bigramSet(needle);
  if (needleGrams.size === 0) return 0;
  const hayGrams = bigramSet(haystack);
  if (hayGrams.size === 0) return 0;
  let hits = 0;
  for (const gram of needleGrams) if (hayGrams.has(gram)) hits += 1;
  return hits / needleGrams.size;
};

// The same question asked of whole words. Bigrams are forgiving about inflection
// but they dilute: a five-bigram order that shares one stem with the event scores
// 0.2, which is indistinguishable from noise, even though that stem is the whole
// subject of both. Counting WORDS present recovers the signal ("해병" appearing
// inside "해병대를" is one of three words, not one of five bigrams), and taking
// the better of the two means neither measure's blind spot decides the outcome.
export const tokenCoverage = (needle, haystack) => {
  const tokens = normalizeString(needle)
    .split(/[\s\p{P}\p{S}]+/u)
    .map((token) => squashText(token))
    .filter((token) => token.length >= 2);
  if (tokens.length === 0) return 0;
  const hay = squashText(haystack);
  if (hay.length === 0) return 0;
  const hits = tokens.filter((token) => hay.includes(token)).length;
  return hits / tokens.length;
};

export const coverageScore = (needle, haystack) =>
  Math.max(bigramCoverage(needle, haystack), tokenCoverage(needle, haystack));

// Domain buckets, shared with the queue clustering in gameplay.js so the grouping
// the model is SHOWN and the grouping used to interpret its answer are the same
// list — two divergent copies of this would quietly disagree about what counts as
// "military" and the matcher would look broken for reasons nothing in the code
// explains.
export const ACTION_DOMAINS = [
  // The Korean side of this list was written from the words that happened to
  // appear in one save and missed the most ordinary military vocabulary there is:
  // "해병 부대 강화" — marine corps reinforcement — classified as Other
  // Initiatives, because 해병, 부대 and 강화 were all absent. That mis-bucketing
  // is not cosmetic: it decides which group the order is shown to the model in,
  // and (below) which events are even allowed to resolve it.
  { label: "Military & Defense", pattern: /(militar|defen[cs]e|army|navy|naval|air force|missile|weapon|troop|invasion|drill|exercise|border|brigade|division|regiment|battalion|군사|국방|군대|병력|부대|사단|여단|연대|대대|해병|해군|공군|육군|함대|전함|항모|전차|장갑|포병|미사일|무기|병기|훈련|방위|국방비|전쟁|전투|안보|공격|방어|요새|기지|드론|레이더|DMZ|전력증강|증강)/i },
  { label: "Diplomacy & Alliances", pattern: /(diploma|treaty|alliance|negotiat|summit|relation|embassy|sanction|\bUN\b|외교|동맹|조약|협상|정상회담|관계|제재|유엔|회담|공조)/i },
  // Technology outranks Economy: "반도체 R&D 투자" is a TECH initiative even
  // though 투자 is an economy word.
  { label: "Technology & Research", pattern: /(tech|research|develop|innovat|\bAI\b|semiconductor|space|satellite|기술|연구|개발|혁신|인공지능|반도체|우주|위성|과학)/i },
  { label: "Economy & Trade", pattern: /(econom|trade|industr|invest|market|financ|budget|tax|export|tariff|경제|무역|산업|투자|시장|금융|예산|세금|수출|관세|기업|성장|일자리)/i },
  { label: "Infrastructure & Energy", pattern: /(infrastructur|construct|energy|power plant|rail|port|road|grid|인프라|건설|에너지|발전소|철도|항만|도로|전력|원전)/i },
  { label: "Intelligence & Covert", pattern: /(intelligen|covert|\bspy\b|cyber|surveillan|정보전|첩보|공작|사이버|감시|해킹|도청)/i },
  { label: "Internal Affairs & Society", pattern: /(domestic|internal|social|politic|reform|corrupt|educat|health|welfare|\blaw\b|내정|사회|정치|개혁|부패|교육|복지|보건|법|민심|언론|치안|여론)/i },
];

export const OTHER_DOMAIN = "Other Initiatives";

export const domainOf = (text) =>
  ACTION_DOMAINS.find((entry) => entry.pattern.test(String(text ?? "")))?.label ?? OTHER_DOMAIN;

// A verbatim or near-verbatim narration. High enough that an event has to be
// genuinely about this order to clear it.
export const NARRATIVE_MATCH_MIN = 0.62;
// After a supplemental pass, against ONLY that pass's events. The bar drops
// because that pass was generated for these specific orders and nothing else was
// asked of it — but only to half the order, and only when the domains also agree,
// so a mobilisation order cannot be cleared by an event about a trade deal.
//
// It is deliberately NOT low enough to catch a full paraphrase ("해병 부대 강화"
// narrated as "해병대를 대폭 증강하여" shares one word in three). Reaching that
// is the job of the mapping call in gameplay.js, which reads for MEANING. A
// threshold tuned down until the heuristic caught paraphrases would also start
// clearing orders nobody carried out, and an order wrongly marked resolved is
// exactly the silent drop this whole mechanism exists to prevent — an order left
// queued is visible, and comes back next turn.
export const SUPPLEMENTAL_MATCH_MIN = 0.5;

// The bar an event must clear to KEEP a claim it already made. Much lower than
// the bar for making a claim on the model's behalf, because the two questions are
// different: "is this event about this order" (a check) is far weaker than "does
// this event so clearly narrate this order that I should tag it myself".
//
// Calibrated on a captured turn rather than guessed. The two false claims — an
// education-reform event claiming a hand-typed order about suppressing political
// extremism — scored 0.029 and 0.040. The fourteen genuine claims from the same
// turn scored 0.600 to 1.000. There is no ambiguity in that gap, and 0.25 sits in
// the middle of it: a paraphrase far looser than any real one still passes, while
// an event that simply is not about the order does not.
export const CLAIM_VERIFY_MIN = 0.25;

// Two Korean characters is a whole word (출격, 증강), so this is as low as it can
// usefully go — and a needle that short must appear intact to match anything.
const MIN_NEEDLE_CHARS = 2;

export const eventHaystack = (event) =>
  `${normalizeString(event?.title)} ${normalizeString(event?.description)}`;

// The text that identifies an order. The title is what a generated event echoes;
// a hand-typed order has no title, so fall back to its body rather than matching
// on an empty string (which would score 0 against everything and look like the
// matcher is simply not working).
export const actionNeedle = (action) => {
  const title = normalizeString(action?.title);
  if (squashText(title).length >= MIN_NEEDLE_CHARS) return title;
  const body = `${normalizeString(action?.text)} ${normalizeString(action?.rawInput)}`.trim();
  return normalizeString(body).slice(0, 120);
};

// The best event for one order, or null when nothing clears the bar. Ties break
// toward the EARLIER event because a jump's events are generated in narrative
// order and the first mention is the one that carries the order out.
export const bestEventForAction = (action, events, {
  minScore = NARRATIVE_MATCH_MIN,
  requireDomain = false,
} = {}) => {
  const needle = actionNeedle(action);
  if (squashText(needle).length < MIN_NEEDLE_CHARS) return null;
  const actionDomain = action?.kind === "chat"
    ? "Diplomacy & Alliances"
    : domainOf(`${normalizeString(action?.title)} ${normalizeString(action?.text)} ${normalizeString(action?.rawInput)}`);

  let best = null;
  for (const event of events) {
    const haystack = eventHaystack(event);
    if (requireDomain) {
      // An unclassifiable order matches nothing on domain, so it would be locked
      // out entirely — let it through on score alone rather than never resolve.
      const eventDomain = domainOf(haystack);
      if (actionDomain !== OTHER_DOMAIN && eventDomain !== actionDomain) continue;
    }
    const score = coverageScore(needle, haystack);
    if (score < minScore) continue;
    if (!best || score > best.score) best = { event, score };
  }
  return best;
};

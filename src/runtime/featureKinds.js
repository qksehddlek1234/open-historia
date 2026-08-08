/*! Open Historia — one catalogue of map-feature kinds © 2026 Nicholas Krol, MIT (see src/Editor/LICENSE). */
// WHAT A THING ON THE MAP CAN BE, IN ONE PLACE.
//
// This existed three times over, in three files, disagreeing:
//
//   gameState.js   MARKER_KIND_BY_NAME  16 kinds, inferred from the name
//   Features.jsx   KIND_EMOJI           11 patterns, for the click popup
//   MarkersLayer   MILITARY_KIND        2 outcomes, triangle or square
//
// So a "medical center" had a name rule and no emoji (it drew as 📍), an
// "airfield" had a name rule and a glyph but no emoji, and "monument" had an
// emoji but nothing that would ever produce it. The cheat editor, meanwhile,
// asked the player to TYPE the kind into a free-text box — which is how the live
// map ended up carrying "mil11a", "plot" and "energy_plant" beside "power plant".
//
// One row per kind: what it is called, what it looks like everywhere it is drawn,
// and the names that mean it. Everything else reads from here.
//
// ORDER MATTERS. `patterns` is scanned top to bottom by the name inference, so
// rows run from the most specific SUBJECT to the most generic SHAPE: a name like
// "국가 전략 약품 비축 단지" contains both 약품 and 단지, and what it is about is
// the medicine, so the shape words (단지, 클러스터, 복합) sit at the bottom.
export const FEATURE_KINDS = [
  { id: "airfield", label: "공군기지", emoji: "✈", glyph: "▲", military: true, patterns: [/(공군기지|비행장|활주로|airbase|air base|airfield|airport)/i] },
  { id: "naval base", label: "해군기지", emoji: "⚓", glyph: "▲", military: true, patterns: [/(해군기지|군항|잠수함|naval base|submarine)/i] },
  { id: "missile silo", label: "미사일 기지", emoji: "🚀", glyph: "▲", military: true, patterns: [/(미사일|탄도|발사대|사일로|missile|silo|launch)/i] },
  { id: "radar station", label: "레이더 기지", emoji: "📡", glyph: "▲", military: true, patterns: [/(레이더|관제|감시|첩보|정보사|radar|surveillance|listening|intelligence|spy)/i] },
  { id: "bunker", label: "벙커", emoji: "🛡", glyph: "▲", military: true, patterns: [/(벙커|방공호|지하시설|bunker|shelter)/i] },
  { id: "military base", label: "군기지", emoji: "🏰", glyph: "▲", military: true, patterns: [/(기지|주둔|병영|요새|사령부|base|garrison|barracks|fort|fortress|outpost|citadel|castle)/i] },
  { id: "power plant", label: "발전소", emoji: "⚡", glyph: "■", patterns: [/(발전소|원전|원자로|에너지|전력|smr|power plant|reactor|grid|nuclear)/i] },
  { id: "port", label: "항만", emoji: "🚢", glyph: "■", patterns: [/(항만|항구|부두|터미널|물류|port|harbou?r|logistics)/i] },
  { id: "research center", label: "연구소", emoji: "🔬", glyph: "■", patterns: [/(연구소|연구원|연구 ?센터|실험|research|laboratory|institute)/i] },
  // After research on purpose: an explicit 연구소/센터 is a laboratory even when
  // it studies communications, while a 통신 허브 with no research word in it is
  // the facility itself. Logistics sits above both, so a 물류 허브 stays a port.
  { id: "communications hub", label: "통신 거점", emoji: "📶", glyph: "■", patterns: [/(통신|기지국|위성 ?통신|중계|네트워크 ?허브|comms|communications|relay)/i] },
  { id: "embassy", label: "대사관", emoji: "🏛", glyph: "■", patterns: [/(대사관|영사관|공관|embassy|consulate|mission|legation)/i] },
  { id: "medical center", label: "의료 시설", emoji: "🏥", glyph: "■", patterns: [/(병원|의료|약품|의약|제약|백신|보건|hospital|medical|pharma|vaccine)/i] },
  { id: "university", label: "대학", emoji: "🎓", glyph: "■", patterns: [/(대학|학교|캠퍼스|university|campus|school)/i] },
  { id: "factory", label: "공장", emoji: "🏭", glyph: "■", patterns: [/(공장|제철|정유|조선소|생산 ?라인|factory|refinery|shipyard|mine)/i] },
  { id: "industrial complex", label: "산업 단지", emoji: "🏗", glyph: "■", patterns: [/(단지|클러스터|복합|산업|테크|cluster|industrial|complex)/i] },
  // No patterns: nothing is ever INFERRED as a monument or a city, but both are
  // offered in the picker and both draw properly once chosen.
  { id: "monument", label: "기념물", emoji: "🗿", glyph: "■", patterns: [] },
  { id: "city", label: "도시", emoji: "🏙", glyph: "■", patterns: [] },
  { id: "landmark", label: "랜드마크", emoji: "📍", glyph: "■", patterns: [] },
];

const BY_ID = new Map(FEATURE_KINDS.map((kind) => [kind.id, kind]));

// The catch-alls: a kind the model can produce without having decided anything.
// "landmark" is in here AND in the catalogue on purpose — it is a real choice a
// player can make in the picker, and simultaneously the value the model reaches
// for when it has not thought about it, so an inferred kind beats it.
export const GENERIC_FEATURE_KINDS = new Set(["", "landmark", "site", "facility", "structure", "building", "place", "marker", "other"]);

// Underscores and hyphens are separators here, not letters — structures saved
// before kinds were normalized still carry "energy_plant", and a label with an
// underscore in it reads as a variable rather than a building.
export const tidyFeatureKind = (value) =>
  String(value ?? "").trim().toLowerCase().replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();

export const findFeatureKind = (value) => BY_ID.get(tidyFeatureKind(value)) ?? null;

// The kind a name means, or "" when nothing in the catalogue matches. Separate
// from resolveFeatureKind so the editor can offer a suggestion without imposing.
export const inferFeatureKind = (name) => {
  const haystack = String(name ?? "").trim();
  if (!haystack) return "";
  for (const kind of FEATURE_KINDS) {
    for (const pattern of kind.patterns) {
      if (pattern.test(haystack)) return kind.id;
    }
  }
  return "";
};

// AN EXPLICIT, SPECIFIC KIND ALWAYS WINS. This only fills a vacuum.
//
// The model gets the first few right and drifts to the catch-all as its answer
// gets longer — measured on a live campaign, "울산 SMR 통합 발전소" (a power
// plant), "부산 수소 에너지 거점" and "특수 작전 후방 지원 기지" (a military base)
// all came back as "landmark". No amount of prompt emphasis fixed it, and the
// name is the one field it always writes carefully.
export const resolveFeatureKind = (rawKind, name) => {
  const stated = tidyFeatureKind(rawKind);
  if (stated && !GENERIC_FEATURE_KINDS.has(stated)) return stated;
  return inferFeatureKind(name) || stated || "landmark";
};

// A kind the catalogue has never heard of is still drawn — the player may type
// one in, and campaigns already carry values no list predicted. Fall back to the
// generic pin rather than dropping the structure off the map.
export const emojiForFeatureKind = (value) => findFeatureKind(value)?.emoji ?? "📍";

export const glyphForFeatureKind = (value) => findFeatureKind(value)?.glyph ?? "■";

// What to call it in the player's language, falling back to the raw value in
// title case so an unknown kind reads as a word rather than an identifier.
export const labelForFeatureKind = (value) => {
  const known = findFeatureKind(value);
  if (known) return known.label;
  return tidyFeatureKind(value)
    .split(" ")
    .map((word) => (word ? word[0].toUpperCase() + word.slice(1) : word))
    .join(" ")
    .trim();
};

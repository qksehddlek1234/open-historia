/*! Open Historia — what the campaign did to a country's numbers © 2026 Nicholas Krol, MIT (see src/Editor/LICENSE). */
// THE STAT SHEET STOPPED MOVING TWENTY-SEVEN ROUNDS AGO.
//
// Measured on this campaign at round 29, against the 28 rollback snapshots:
//
//   gdp                  1,250조 원   unchanged since 2016-01-31 (27 rounds)
//   energyAutonomy       35           never changed once, in the whole campaign
//   sovereignty          85           changed once, in round 2
//   foodAutonomy         40           changed once, in round 2
//   economicIndependence 90           changed once, in round 2
//   internalSecurity     88           changed once, in round 2
//   internationalReputation           changed 9 times — the only living number
//   stability                         changed 15 times, last in round 20
//
// Meanwhile the player spent those rounds building an SMR complex, a hydrogen
// hub in Busan, two 트라이앵글 에너지 관문 and a 한-중동 수소 에너지 허브, and
// energyAutonomy sat at 35 throughout. Narration and state disagreeing, which
// is the one thing this engine is not allowed to do.
//
// TWO CAUSES, both structural.
//
// 1. The panel's early return. Once world.countryStats[code] held a COMPLETE
//    sheet — which it has since the first generation persisted its own output
//    there in round 2 — GameUI/stats.jsx returned it and never regenerated. The
//    slot meant to hold "what the AI changed" was holding the base sheet, so the
//    base could never refresh and the deltas had nowhere of their own to live.
//
// 2. The model will not fill a nested optional group. polityChanges[].stats is
//    an optional object inside an optional array; its FLAT member, stability,
//    was written in 17 of 28 rounds, and its nested members economy and indices
//    in 0 and 0. The one index that does move, internationalReputation, moves
//    because `reputation` is a flat field NEXT TO stats rather than inside it.
//    That is a shape problem, and no amount of asking harder in the prompt fixes
//    a shape problem.
//
// So this file holds the delta store, keyed and flat: one row per field that
// actually moved, with the reason it moved. world.countryStats keeps the
// generated base (now date-stamped so it refreshes), and this layers over it.
import { looksLikeName, looksLikeQuantity } from "../Game/AI/statSheetSanity.js";
import { gidToAlpha2 } from "./countryFlags.js";
import { toCountryName } from "./ownerNames.js";

const normalizeString = (value) => String(value ?? "").trim();
const normalizeArray = (value) => (Array.isArray(value) ? value : []);

// Every leaf the sheet has, flattened. The model is asked for a field NAME from
// this list and a value — never for a nested object — because a flat row is the
// shape it fills reliably (the campaign ledger uses the same shape and works).
export const STAT_FIELDS = {
  capital: { group: "", kind: "name", label: "capital" },
  continent: { group: "", kind: "name", label: "continent" },
  government: { group: "", kind: "name", label: "government system" },
  leader: { group: "", kind: "name", label: "the person actually running the government, as official title + name (\"대통령 블라디미르 푸틴\")" },
  headOfState: { group: "", kind: "name", label: "ceremonial head of state where distinct, as official title + name (\"국왕 하랄 5세\")" },
  deputy: { group: "", kind: "name", label: "second-ranking figure, as official title + name (\"부통령 조 바이든\", \"국무총리 황교안\")" },
  stability: { group: "", kind: "pct", label: "national stability" },
  sovereignty: { group: "indices", kind: "pct", label: "practical political sovereignty" },
  foodAutonomy: { group: "indices", kind: "pct", label: "domestic food autonomy" },
  energyAutonomy: { group: "indices", kind: "pct", label: "domestic energy autonomy" },
  economicIndependence: { group: "indices", kind: "pct", label: "economic independence" },
  internalSecurity: { group: "indices", kind: "pct", label: "internal security" },
  internationalReputation: { group: "indices", kind: "pct", label: "international standing" },
  gdp: { group: "economy", kind: "quantity", label: "GDP" },
  gdpGrowth: { group: "economy", kind: "quantity", label: "annual GDP growth" },
  gdpPerCapita: { group: "economy", kind: "quantity", label: "GDP per capita" },
  currency: { group: "economy", kind: "name", label: "currency" },
  inflation: { group: "economy", kind: "quantity", label: "inflation" },
  unemployment: { group: "economy", kind: "quantity", label: "unemployment" },
  publicDebt: { group: "economy", kind: "quantity", label: "public debt" },
  budgetBalance: { group: "economy", kind: "quantity", label: "budget balance" },
  agriculture: { group: "gdpBreakdown", kind: "pct", label: "agriculture share of GDP" },
  industry: { group: "gdpBreakdown", kind: "pct", label: "industry share of GDP" },
  services: { group: "gdpBreakdown", kind: "pct", label: "services share of GDP" },
};

export const STAT_FIELD_NAMES = Object.keys(STAT_FIELDS);
export const STAT_GROUPS = ["indices", "economy", "gdpBreakdown"];

// WHETHER A VALUE READS LIKE A VALUE is already answered, once, in
// Game/AI/statSheetSanity.js — the module written when JSON wreckage reached the
// stat pane as a GDP. Reusing it means a figure arriving through this pass is
// held to the same bar as one arriving through generation, rather than to a
// second rule that drifts away from the first.
//
// What it does NOT catch is a value that reads fine and is simply a sentence:
// "약 1,250조 원 수준으로 추정되나 반도체 수출 호조에 따라 상향 여지가 있음" has
// digits, no debris, and belongs in a briefing rather than a number's slot.
// Measured across all 27 free-text values the live campaign holds, the longest
// legitimate one is 22 characters ("-2.1% (GDP 대비 deficit)") and the median is
// 5. 32 clears the longest real value by half again and refuses the 45-character
// sentence.
const MAX_TEXT_CHARS = 32;

// Which fields the model is allowed to move without an event behind it: none.
// A reason is not decoration — it is what lets the console say why 35 became 38,
// and what a later reader checks the narration against.
const MAX_REASON_CHARS = 160;

// Read a leaf out of a sheet, wherever it lives.
export const readStatField = (sheet, field) => {
  const spec = STAT_FIELDS[field];
  if (!spec || !sheet || typeof sheet !== "object") return undefined;
  return spec.group ? sheet[spec.group]?.[field] : sheet[field];
};

// Write a leaf into a nested store, creating the group as needed. Returns a NEW
// object — the caller's sheet is never edited in place, because the same store
// is handed to the coercion passes and a shallow copy shared with the save is
// how a scenario file got corrupted once already.
export const writeStatField = (store, field, value) => {
  const spec = STAT_FIELDS[field];
  if (!spec) return store;
  if (!spec.group) return { ...store, [field]: value };
  return { ...store, [spec.group]: { ...(store?.[spec.group] || {}), [field]: value } };
};

const coerceValue = (field, raw) => {
  const spec = STAT_FIELDS[field];
  if (!spec) return undefined;
  if (spec.kind === "pct") {
    const text = normalizeString(raw);
    // A DIGIT IS REQUIRED, and this is not pedantry: stripping the non-numerics
    // out of "매우 높음" leaves "", Number("") is 0, and Number.isFinite(0) is
    // true — so a model answering "very high" used to set that country's
    // stability to ZERO. Check for a digit before trusting the parse.
    if (!/\d/.test(text)) return undefined;
    const number = Number(text.replace(/[^0-9.-]/g, ""));
    if (!Number.isFinite(number)) return undefined;
    return Math.max(0, Math.min(100, Math.round(number)));
  }
  const text = normalizeString(raw);
  if (!text || text.length > MAX_TEXT_CHARS) return undefined;
  if (spec.kind === "quantity" && !looksLikeQuantity(text)) return undefined;
  if (spec.kind === "name" && !looksLikeName(text)) return undefined;
  return text;
};

// Fold this turn's reported movements into the store.
//
// `accept` is the engine's own standing guard, passed in rather than imported so
// this module stays pure and testable: the same delta-written-into-an-absolute-
// field mistake that had a country's stability written as "5" reaches here too,
// and it is caught in exactly one place for every bounded field.
// THE THREE SHARES ARE ONE FIGURE IN THREE PARTS.
//
// A GDP breakdown is what a GDP is made OF, so the parts add to the whole and
// moving one alone is always wrong. The first live run did exactly that: it sent
// industry 76 → 78 on its own, which would have left the campaign's sheet reading
// 45 / 78 / 32 — a hundred and fifty-five per cent of an economy.
//
// So a share only lands when all three arrive together, and only when they add up.
// The 90-110 tolerance is the one statSheetSanity already applies to a generated
// sheet: the model rounds, and 99 or 101 is not a defect worth refusing.
const BREAKDOWN_FIELDS = ["agriculture", "industry", "services"];
const BREAKDOWN_MIN_TOTAL = 90;
const BREAKDOWN_MAX_TOTAL = 110;

const breakdownVerdicts = (rows) => {
  const byCountry = new Map();
  for (const row of rows) {
    const field = normalizeString(row?.field);
    if (!BREAKDOWN_FIELDS.includes(field)) continue;
    const code = normalizeString(row?.code);
    if (!code) continue;
    if (!byCountry.has(code)) byCountry.set(code, new Map());
    byCountry.get(code).set(field, coerceValue(field, row?.value));
  }
  const verdicts = new Map();
  for (const [code, shares] of byCountry) {
    const values = BREAKDOWN_FIELDS.map((field) => shares.get(field));
    if (values.some((value) => value === undefined)) {
      const sent = BREAKDOWN_FIELDS.filter((field) => shares.has(field));
      verdicts.set(code, `a GDP share moves only with the other two — this sent ${sent.join(", ")} alone`);
      continue;
    }
    const total = values.reduce((sum, value) => sum + value, 0);
    if (total < BREAKDOWN_MIN_TOTAL || total > BREAKDOWN_MAX_TOTAL) {
      verdicts.set(code, `the three GDP shares total ${total}, not ~100`);
    }
  }
  return verdicts;
};

// "KR" IS NOT A COUNTRY THIS ENGINE HAS HEARD OF.
//
// The first live run of the stat pass was shown sheets headed "## South Korea"
// and "## China", and answered with `KR` and `CN` — so every row was refused
// for naming a country with no sheet, which was true of the string and false of
// the country. Six real changes lost to a spelling.
//
// The engine already canonicalises country tokens in three different ways and
// this uses all of them rather than adding a fourth table: the name as written,
// the GADM three-letter code (KOR, CHN), and the ISO-2 the flag layer derives
// from a country's own name (kr, cn). Nothing is guessed — a token that matches
// none of them is still refused.
export const resolveStatCountry = (code, baselines) => {
  const raw = normalizeString(code);
  if (!raw || !baselines) return raw;
  const keys = Object.keys(baselines);
  if (Object.prototype.hasOwnProperty.call(baselines, raw)) return raw;

  const wanted = raw.toLowerCase();
  const canonical = normalizeString(toCountryName(raw)).toLowerCase();
  for (const key of keys) {
    const name = normalizeString(key).toLowerCase();
    if (name === wanted || name === canonical) return key;
    // The flag layer maps a country's NAME to its ISO-2; going that way round
    // means no second table and no chance of the two disagreeing.
    const alpha2 = gidToAlpha2(key);
    if (alpha2 && alpha2.toLowerCase() === wanted) return key;
  }
  // "SK" — round 44 live, three real changes dropped. ISO says SK is Slovakia,
  // but the model abbreviates by INITIALS of the names it was shown, and the
  // honest way to read initials is against exactly those sheets: a short token
  // matching the initials of ONE shown country is that country; two matches
  // is ambiguity, and ambiguity still refuses.
  if (/^[A-Za-z]{2,4}$/.test(raw)) {
    const initialsOf = (name) => normalizeString(name).split(/[\s-]+/)
      .map((word) => word[0] ?? "").join("").toLowerCase();
    const matches = keys.filter((key) => initialsOf(key) === wanted);
    if (matches.length === 1) return matches[0];
  }
  return raw;
};

// "internationalReputaion" — a live round-42 drop, twice in one turn: the model
// misspells a real field and the change dies for a typo the sheet could name.
// Same doctrine as resolveStatCountry above ("KR" is not a country): repair the
// spelling when it lands on exactly ONE known field within edit distance 2, and
// still refuse anything ambiguous or genuinely unknown. Fields shorter than six
// characters never fuzzy-match — "gdp" must not become anything else.
const editDistanceAtMost = (a, b, max) => {
  if (Math.abs(a.length - b.length) > max) return false;
  let previous = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i += 1) {
    const current = [i];
    let rowMin = i;
    for (let j = 1; j <= b.length; j += 1) {
      current[j] = Math.min(
        previous[j] + 1,
        current[j - 1] + 1,
        previous[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
      if (current[j] < rowMin) rowMin = current[j];
    }
    if (rowMin > max) return false;
    previous = current;
  }
  return previous[b.length] <= max;
};

const repairStatFieldName = (field) => {
  if (field.length < 6) return "";
  const wanted = field.toLowerCase();
  let found = "";
  for (const key of Object.keys(STAT_FIELDS)) {
    if (!editDistanceAtMost(key.toLowerCase(), wanted, 2)) continue;
    if (found) return ""; // two candidates — refusing beats guessing
    found = key;
  }
  return found;
};

// MONEY THE PLAYER CAN READ. The first fresh-campaign sheets mixed every
// convention at once (live, round 2): "1.126T" beside "10.3조 CNY" beside
// "260억 달러"; currency as "KRW" and "CNY" but also as "유로"; and one
// budget balance arrived as "-587_billion_usd". The model rules now ask for
// one format; this is the deterministic half that repairs what still slips:
// snake_case junk, doubled signs, Latin scale letters (T/B/M expand into the
// Korean scales the rest of the sheet uses), and bare ISO codes become the
// currency's name. Exchange-rate conversion is NOT done here — rates are era
// knowledge, so the ≈-conversion is the model's job, asked in the prompt.
const CURRENCY_NAMES = {
  usd: "달러", krw: "원", cny: "위안", jpy: "엔", eur: "유로",
  gbp: "파운드", rub: "루블", inr: "루피", brl: "헤알", chf: "프랑",
};

const koreanScale = (value) => {
  if (!Number.isFinite(value) || value <= 0) return "";
  const units = [[1e16, "경"], [1e12, "조"], [1e8, "억"], [1e4, "만"]];
  let rest = Math.round(value);
  const parts = [];
  for (const [size, label] of units) {
    const count = Math.floor(rest / size);
    if (count > 0) { parts.push(`${count}${label}`); rest -= count * size; }
    if (parts.length >= 2) return parts.join(" ");
  }
  return parts.length === 0 ? String(rest) : parts.join(" ");
};

export const tidyMoneyText = (value) => {
  let text = normalizeString(value);
  if (!text) return text;
  text = text.replace(/_+/g, " ").replace(/--+/g, "-").replace(/\s{2,}/g, " ").trim();
  // Latin scale words and letters expand into Korean scales: 1.126T → 1조
  // 1260억, 587 billion → 5870억. Only when attached to a number.
  const SCALES = [
    [/(-?\d+(?:[.,]\d+)?)\s*(?:T|trillion)\b\.?/gi, 1e12],
    [/(-?\d+(?:[.,]\d+)?)\s*(?:B|billion)\b\.?/gi, 1e9],
    [/(-?\d+(?:[.,]\d+)?)\s*(?:M|million)\b\.?/gi, 1e6],
  ];
  for (const [pattern, scale] of SCALES) {
    text = text.replace(pattern, (whole, digits) => {
      const amount = Number(String(digits).replace(/,/g, ""));
      if (!Number.isFinite(amount)) return whole;
      const sign = amount < 0 ? "-" : "";
      const spelled = koreanScale(Math.abs(amount) * scale);
      return spelled ? `${sign}${spelled}` : whole;
    });
  }
  // Bare ISO codes become the currency's name (word-bounded, case-blind) —
  // except inside parentheses, where "유로 (EUR)" is the sanctioned name+code
  // form and must not become "유로 (유로)".
  text = text.replace(/(?<![(（] ?)\b(USD|KRW|CNY|JPY|EUR|GBP|RUB|INR|BRL|CHF)\b/gi,
    (code) => CURRENCY_NAMES[code.toLowerCase()] ?? code);
  return text.replace(/\s{2,}/g, " ").trim();
};

// THE CONVERSION SYSTEM IS RETIRED (round 6, the player's call). Two designs
// were tried and both failed at the model end: asked to CONVERT, the model
// multiplied wrong by orders of magnitude; asked only for the RATE, it wrote
// rates wrong instead — same arithmetic-shaped hole, one step removed. GDP
// figures now stand in the era's benchmark currency (dollars) alone, which is
// also the denomination the model actually knows the world in. The scrubber
// below strips any parenthetical conversion a sheet still carries — the ≈/~
// forms AND the "약 …원" form the live sheets actually wrote ("11.06조 달러
// (약 13,520조 원)"). A parenthetical is a conversion when it carries ≈/~ or
// a digit next to a currency word; "유로 (EUR)" and "35% (GDP 대비)" carry
// neither and survive.
export const stripMoneyConversions = (value) => {
  const raw = normalizeString(value);
  if (!raw) return raw;
  const stripped = raw.replace(/\s*[(（]([^)）]*)[)）]/g, (whole, inside) => {
    const isConversion = /[≈~]/.test(inside)
      || (/\d/.test(inside) && /(원|달러|위안|엔|유로|파운드|루블|루피|KRW|USD|JPY|CNY|EUR|GBP|RUB|INR)/i.test(inside));
    return isConversion ? "" : whole;
  }).trim();
  return stripped || raw;
};

// The economy block of a sheet, tidied in place. Returns the field names it
// changed so the caller can say so.
export const tidyStatSheetMoney = (sheet) => {
  const touched = [];
  const economy = sheet?.economy;
  if (!economy || typeof economy !== "object") return touched;
  for (const field of ["gdp", "gdpPerCapita", "publicDebt", "budgetBalance", "currency"]) {
    const before = normalizeString(economy[field]);
    if (!before) continue;
    // Conversions are retired: any ≈-parenthetical the model still writes on a
    // money figure comes off here, then the usual tidy runs.
    const after = tidyMoneyText(field === "gdp" || field === "gdpPerCapita" ? stripMoneyConversions(before) : before);
    if (after !== before) { economy[field] = after; touched.push(field); }
  }
  // A leftover exchangeRate from the retired system is dropped, not shown.
  if ("exchangeRate" in economy) { delete economy.exchangeRate; touched.push("exchangeRate"); }
  return touched;
};

export const applyStatChanges = (existing, incoming, { date = "", accept = null, baselines = null } = {}) => {
  let entries = { ...(existing && typeof existing === "object" ? existing : {}) };
  const applied = [];
  const dropped = [];
  const repaired = [];
  const breakdownProblems = breakdownVerdicts(normalizeArray(incoming));

  for (const raw of normalizeArray(incoming)) {
    const code = resolveStatCountry(raw?.code, baselines);
    let field = normalizeString(raw?.field);
    let spec = STAT_FIELDS[field];
    if (!code) { dropped.push({ field, why: "no country" }); continue; }
    if (!spec) {
      const corrected = repairStatFieldName(field);
      if (corrected) {
        repaired.push({ code, from: field, to: corrected });
        field = corrected;
        spec = STAT_FIELDS[field];
      }
    }
    if (!spec) { dropped.push({ code, field, why: "not a field on the sheet" }); continue; }
    // A NUMBER YOU WERE NEVER SHOWN IS NOT ONE YOU CAN MOVE.
    //
    // The first live run reported Saudi Arabia's energyAutonomy as 45 — for a
    // country whose sheet was not in the prompt, because the game has never
    // generated one for it. With no baseline that is not a change, it is an
    // invention, and 45 is a poor guess for the world's largest oil exporter.
    if (baselines && !Object.prototype.hasOwnProperty.call(baselines, code)) {
      dropped.push({ code, field, why: "no stat sheet was shown for this country, so there is nothing to move" });
      continue;
    }

    const value = coerceValue(field, raw?.value);
    if (value === undefined) {
      dropped.push({ code, field, why: `unusable value ${JSON.stringify(raw?.value)}` });
      continue;
    }

    if (BREAKDOWN_FIELDS.includes(field) && breakdownProblems.has(code)) {
      dropped.push({ code, field, why: breakdownProblems.get(code) });
      continue;
    }

    // The value this field stands at TODAY — from the delta store if the campaign
    // has moved it before, otherwise from the country's sheet. Reading only the
    // delta store made every field's first move look like a first write, which
    // skipped the standing guard entirely: `accept` waves through anything with
    // no previous value, so a delta written into an absolute field would have
    // been taken at face value exactly once per field, silently.
    const previous = readStatField(entries[code], field) ?? readStatField(baselines?.[code], field);
    if (previous !== undefined && previous === value) continue;
    // Exact comparison on a leadership field must see through the title (see
    // sameLeaderPerson above): the same person under a different spelling —
    // title dropped, word order flipped — is not a move. Only the upgrade to a
    // FULLER spelling passes, the same preference the display merge applies.
    if (LEADERSHIP_NAME_FIELDS.includes(field) && previous !== undefined
      && sameLeaderPerson(previous, value) && String(value).length <= String(previous).length) {
      continue;
    }
    // A shift can replace a leader, never erase one: a sentinel arriving in
    // `leader` is the model shrugging, and a country does not lose its head of
    // government to a shrug.
    if (field === "leader" && isRoleSentinel(value)) {
      dropped.push({ code, field, why: `a sentinel ("${value}") cannot replace a named leader` });
      continue;
    }

    if (spec.kind === "pct" && typeof accept === "function"
      && !accept({ label: field, code, next: value, previous, reason: normalizeString(raw?.reason) })) {
      dropped.push({ code, field, why: `${previous} → ${value} is not a move this turn accounts for` });
      continue;
    }

    entries = { ...entries, [code]: writeStatField(entries[code] || {}, field, value) };
    applied.push({
      code, field, from: previous, to: value,
      reason: normalizeString(raw?.reason).slice(0, MAX_REASON_CHARS), date,
    });
  }

  return { entries, applied, dropped, repaired };
};

// The sheet the player sees: what was generated, with everything the campaign
// moved layered on top. The AI always wins — a generated sheet describes the
// country as history left it, not as this campaign made it.
// HOW LONG A BASE SHEET KEEPS DESCRIBING "NOW".
//
// The base used to be reused only when its __asOf stamp equalled today's date
// EXACTLY — so every turn advance staled every sheet, and opening the stats
// pane regenerated the base from scratch for each country, every turn. Each
// regeneration let the model reinvent campaign facts from era knowledge: the
// live save's South Korea flipped back to its real-world 2018 leader against
// the campaign's own acting-president canon, and indices reset to era guesses
// while the delta store said otherwise.
//
// The two stores split the work: the BASE holds era-scale facts, the DELTAS
// (countryStatChanges, always layered on top) carry everything the campaign
// itself moves. So the base only needs regenerating when enough game time has
// passed that era-scale facts themselves drift — a year, not a turn.
export const BASE_SHEET_FRESH_DAYS = 365;

export const sheetDescribesNow = (asOf, today) => {
  const a = Date.parse(normalizeString(asOf));
  const b = Date.parse(normalizeString(today));
  if (!Number.isFinite(a) || !Number.isFinite(b)) return false;
  return Math.abs(b - a) / 86_400_000 <= BASE_SHEET_FRESH_DAYS;
};

// SAME PERSON, MANY SPELLINGS. Leadership fields now carry the official title
// ("대통령 박근혜"), but every sheet written before that rule holds the bare name
// ("박근혜") — and the campaign's own delta store may hold either, in roster
// order ("대통령 박근혜") or the news order Korean naturally produces ("박근혜
// 대통령"), under one office or another ("총리 X" after a reshuffle titles X
// "부총리"), with or without a patronymic ("블라디미르 (블라디미로비치) 푸틴").
// Every exact string comparison on a leader (the contamination gates, the
// identity guard, the shift pass, the merge below) has to see through ALL of
// that, or the transition wedges: the guard reverts a title upgrade as a
// "different" leader, and the borrowed-leader gate goes blind the moment the
// two sides spell the same person differently.
//
// Two rules, in order:
// 1. One string extending the other at a space boundary is the same person —
//    this needs no lexicon, so titles the lexicon misses still pass.
// 2. Otherwise strip known title tokens off both ends and compare name tokens:
//    equal sets, or one set contained in the other, is the same person.
const TITLE_TOKEN = /^(대통령|부통령|총리|수상|부총리|국무총리|내각총리|국왕|여왕|왕|천황|황제|국가주석|주석|총서기|서기장|제1서기|위원장|국무위원장|국무위원|상임위원장|행정원장|총통|대공|술탄|에미르|국가수반|정부수반|권한대행|대행|섭정|왕세자|교황|president|vice|prime|minister|premier|chancellor|king|queen|emperor|empress|sultan|emir|chairman|chairwoman|secretary|general|acting|regent|pope)$/i;

const nameTokens = (value) => normalizeString(value).split(/\s+/).filter(Boolean);

const stripTitleTokens = (tokens) => {
  let start = 0;
  let end = tokens.length;
  while (start < end && TITLE_TOKEN.test(tokens[start])) start += 1;
  while (end > start && TITLE_TOKEN.test(tokens[end - 1])) end -= 1;
  // A string that is ALL title ("대통령") has no name to strip down to — keep
  // it whole so it can only match by the extension rule, never by token sets.
  return end > start ? tokens.slice(start, end) : tokens;
};

export const sameLeaderPerson = (a, b) => {
  const x = normalizeString(a);
  const y = normalizeString(b);
  if (!x || !y) return false;
  if (x === y) return true;
  if (x.endsWith(` ${y}`) || y.endsWith(` ${x}`) || x.startsWith(`${y} `) || y.startsWith(`${x} `)) return true;
  const nx = stripTitleTokens(nameTokens(x));
  const ny = stripTitleTokens(nameTokens(y));
  if (nx.length === 0 || ny.length === 0) return false;
  const [shorter, longer] = nx.length <= ny.length ? [nx, ny] : [ny, nx];
  const longerSet = new Set(longer.map((token) => token.toLowerCase()));
  return shorter.every((token) => longerSet.has(token.toLowerCase()));
};

const LEADERSHIP_NAME_FIELDS = ["leader", "headOfState", "deputy"];

// A leadership ROLE the country does not have — or a holder the model honestly
// does not know — is recorded as a SENTINEL rather than omitted. The 12B
// pattern: an optional field simply does not get filled (measured again on this
// campaign — every sheet regenerated in round 8 came back missing BOTH wider
// roles, while the March sheets still carried them), so headOfState and deputy
// are required in the schema and "(없음)" / "(미확인)" are the honest ways out.
// Everything that DISPLAYS a role hides a sentinel behind this one test.
export const ROLE_SENTINEL = /^[(（]?\s*(없음|해당\s*없음|겸직|미확인|공석|미상|불명|알\s*수\s*없음|none|n\/a|unknown|vacant|-|—)\s*[)）]?$/i;
export const isRoleSentinel = (value) => ROLE_SENTINEL.test(normalizeString(value));

// Which sentinel a spelling means: "the office has no separate holder" versus
// "the office exists and the holder is not known". "—" sides with unknown —
// it is this codebase's own UNKNOWN_STAT.
export const canonicalRoleSentinel = (value) =>
  (/미확인|공석|미상|불명|알\s*수|unknown|vacant|^[-—]$/i.test(normalizeString(value)) ? "(미확인)" : "(없음)");

// The base sheet format on disk. 2 = leadership carries official titles and
// headOfState/deputy are required-with-sentinel. Bases without this stamp
// predate the format and are regenerated on their next open — the identity
// guard turns that regeneration into a pure same-person title upgrade.
export const SHEET_FORMAT = 2;

export const mergeStatSheet = (base, override) => {
  if (!override || typeof override !== "object") return base;
  if (!base || typeof base !== "object") return override;
  const merged = { ...base, ...override };
  for (const group of STAT_GROUPS) {
    if (override[group] && typeof override[group] === "object") {
      merged[group] = { ...(base[group] || {}), ...override[group] };
    }
  }
  // The campaign's delta still decides WHO leads — a different person in the
  // override always wins. But when both sides name the SAME person, display the
  // fuller form: an old delta's bare "황교안" must not strip the title off a
  // regenerated "대통령 권한대행 황교안".
  for (const field of LEADERSHIP_NAME_FIELDS) {
    const fromBase = normalizeString(base[field]);
    const fromOverride = normalizeString(override[field]);
    if (fromBase && fromOverride && sameLeaderPerson(fromBase, fromOverride) && fromBase.length > fromOverride.length) {
      merged[field] = base[field];
    }
  }
  return merged;
};

// THE ONE-TIME RESCUE.
//
// Existing saves have the round-2 generated sheet sitting in the delta slot with
// twenty-eight rounds of event-written changes mixed into it, and nothing can
// separate the two by inspection. What CAN be established is which fields events
// ever actually wrote: measured across all 28 rounds of this campaign, exactly
// these four, and no others. So these carry over as the campaign's word and the
// rest — every economy figure, five of six indices — goes back to being
// regenerated, which is what it always was.
export const RESCUED_FIELDS = ["leader", "government", "capital", "stability"];

export const rescueLegacySheet = (sheet) => {
  if (!sheet || typeof sheet !== "object") return null;
  let store = {};
  let found = 0;
  for (const field of RESCUED_FIELDS) {
    const value = readStatField(sheet, field);
    if (value === undefined || value === null || value === "") continue;
    store = writeStatField(store, field, value);
    found += 1;
  }
  return found > 0 ? store : null;
};

// What the model is shown so it has something to move FROM. Rendered flat, one
// line per field, because the answer it is asked for is flat too.
export const buildStatSheetText = (sheet) => {
  if (!sheet || typeof sheet !== "object") return "";
  const lines = [];
  for (const [field, spec] of Object.entries(STAT_FIELDS)) {
    const value = readStatField(sheet, field);
    if (value === undefined || value === null || value === "") continue;
    lines.push(`${field} (${spec.label}): ${value}`);
  }
  return lines.join("\n");
};

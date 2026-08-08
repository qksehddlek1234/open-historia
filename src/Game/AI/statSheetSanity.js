/*! Open Historia — national stat sheet sanity checks © 2026 Nicholas Krol, MIT (see src/Editor/LICENSE). */
// The economy block is eight FREE-TEXT fields, and free text is where a local
// model's bad day becomes something the player reads as a number. Captured from a
// live sheet, verbatim:
//
//   "gdp": ")}}'*, {",  "gdpGrowth": ",2.5",  "gdpPerCapita": ",34000",
//   "inflation": "},",  "budgetBalance": "-40"
//
// That is not a wrong estimate, it is JSON wreckage. The engine's own salvage
// stack (lenient parse, truncation repair, schema coercion) is what let it
// through: those layers exist to rescue a good answer wrapped in bad syntax, and
// they did their job on the events elsewhere in the payload while handing these
// fields the punctuation they had scraped off. The schema then passed it, because
// the only thing the schema asks of these fields is that they not be empty.
//
// So the check belongs here, above the schema: a value that claims to be a
// quantity has to READ like one. Anything that fails is sent back for a retry,
// and if the retry fails too it is blanked rather than displayed — an em dash is
// an honest "not known"; ")}}'*, {" is the game looking broken.
//
// Deliberately NOT a units or plausibility check. "1.65 조달러" and "$1.65T" and
// "1,650 billion USD" are all fine answers in a game that runs in any language
// and any era, and second-guessing the magnitude of a 1200 AD GDP is not
// something this code can do better than the model.

const normalizeString = (value) => String(value ?? "").trim();

// Every economy field except `currency`, which is a name ("한국 원", "denarius")
// and has no reason to contain a digit.
export const NUMERIC_ECONOMY_FIELDS = [
  "gdp", "gdpGrowth", "gdpPerCapita", "inflation", "unemployment", "publicDebt", "budgetBalance",
];

// Characters that cannot appear in a written-out quantity in any language, and
// that are exactly what a half-parsed JSON fragment is made of.
const STRUCTURAL_DEBRIS = /[{}[\]"`\\|]/;
// A quantity does not OPEN with a separator. ",2.5" and ",34000" are the tail of
// a field whose head was eaten.
const LEADING_SEPARATOR = /^[,;:]/;

export const looksLikeQuantity = (value) => {
  const text = normalizeString(value);
  if (!text) return false;
  if (STRUCTURAL_DEBRIS.test(text)) return false;
  if (LEADING_SEPARATOR.test(text)) return false;
  // Some digit, somewhere. "unknown", "n/a" and "—" are all legitimate answers to
  // a question about a 1200 AD budget deficit, but they are not what this field
  // is for, and the prompt asks for an estimate rather than a shrug.
  return /\d/.test(text);
};

export const looksLikeName = (value) => {
  const text = normalizeString(value);
  if (!text) return false;
  if (STRUCTURAL_DEBRIS.test(text)) return false;
  if (LEADING_SEPARATOR.test(text)) return false;
  // A name has letters in some script — not only punctuation and digits.
  return /[\p{L}]/u.test(text);
};

// Every problem found, as "field: why", so a retry message can name them all at
// once instead of costing one round trip per bad field.
export const findStatSheetProblems = (sheet) => {
  const problems = [];
  if (!sheet || typeof sheet !== "object") return ["the sheet is not an object"];

  for (const field of ["capital", "continent", "government", "leader"]) {
    if (!looksLikeName(sheet[field])) {
      problems.push(`${field}: "${normalizeString(sheet[field])}" is not a name`);
    }
  }

  const economy = sheet.economy && typeof sheet.economy === "object" ? sheet.economy : {};
  for (const field of NUMERIC_ECONOMY_FIELDS) {
    if (!looksLikeQuantity(economy[field])) {
      problems.push(`economy.${field}: "${normalizeString(economy[field])}" is not a number or amount`);
    }
  }
  if (!looksLikeName(economy.currency)) {
    problems.push(`economy.currency: "${normalizeString(economy.currency)}" is not a currency name`);
  }

  // The three shares are what a GDP is MADE of, so they add to the whole. A wide
  // tolerance: the model rounds, and 99 or 101 is not a defect worth a retry.
  const breakdown = sheet.gdpBreakdown && typeof sheet.gdpBreakdown === "object" ? sheet.gdpBreakdown : {};
  const shares = ["agriculture", "industry", "services"].map((key) => Number(breakdown[key]));
  if (shares.every((share) => Number.isFinite(share))) {
    const total = shares.reduce((sum, share) => sum + share, 0);
    if (total < 90 || total > 110) {
      problems.push(`gdpBreakdown: the three shares total ${total}, not ~100`);
    }
  }

  return problems;
};

// Last-resort cleanup, for the final attempt only: whatever still does not read
// as a quantity becomes an em dash. The card renders that as "not known", which
// is true, and the schema still sees a non-empty string.
export const UNKNOWN_STAT = "—";

// The same judgement, applied to a sheet that is already SAVED. world.countryStats
// is written by the AI through polityChanges.stats and read straight back into the
// pane, so a bad value that got in before these checks existed — or that arrives
// through a later coup event — is displayed forever, with no generation step in
// between to catch it. Dropping the unusable fields rather than the whole sheet
// keeps everything the AI legitimately said (a new leader after a coup, a moved
// stability figure) and lets only the wreckage fall back to a fresh estimate.
export const stripUnusableStatFields = (sheet) => {
  if (!sheet || typeof sheet !== "object" || Array.isArray(sheet)) return sheet;
  const out = { ...sheet };
  for (const field of ["capital", "continent", "government", "leader"]) {
    if (field in out && !looksLikeName(out[field])) delete out[field];
  }
  if (out.economy && typeof out.economy === "object") {
    const economy = { ...out.economy };
    for (const field of NUMERIC_ECONOMY_FIELDS) {
      if (field in economy && !looksLikeQuantity(economy[field])) delete economy[field];
    }
    if ("currency" in economy && !looksLikeName(economy.currency)) delete economy.currency;
    out.economy = economy;
  }
  return out;
};

export const sanitizeStatSheet = (sheet) => {
  if (!sheet || typeof sheet !== "object") return sheet;
  const economy = sheet.economy && typeof sheet.economy === "object" ? sheet.economy : null;
  if (economy) {
    for (const field of NUMERIC_ECONOMY_FIELDS) {
      if (!looksLikeQuantity(economy[field])) economy[field] = UNKNOWN_STAT;
    }
    if (!looksLikeName(economy.currency)) economy.currency = UNKNOWN_STAT;
  }
  for (const field of ["capital", "continent", "government", "leader"]) {
    if (!looksLikeName(sheet[field])) sheet[field] = UNKNOWN_STAT;
  }
  return sheet;
};

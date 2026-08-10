/*! Open Historia — legacy level-1 keys survive a subdivision © 2026 Nicholas Krol, MIT (see src/Editor/LICENSE). */
// THE TRAP BRITAIN ALREADY SPRANG ONCE, DISARMED FOR EVERY COUNTRY.
//
// When the seed's four UK provinces became 46 ONS regions, four specs that had
// written "GBR.3_1" for Scotland matched nothing and the 1444 build came out
// with Britain unowned. The fix at the time was a UK-shaped lookup in
// build-preset.mjs, which fixed Britain and left the trap armed for whoever
// subdivided next.
//
// Next is China and India, and they are much bigger: 33 Chinese provinces
// become ~340 prefectures, 35 Indian states become ~660 districts. Between them
// the WWII specs carry dozens of "CHN.25_1"-style assignments — every Chinese
// warlord clique on the 1935 board is written that way. Merging level-2 without
// this would blank most of Asia on four presets at once.
//
// GADM's own id scheme is what makes the general fix possible: a level-2 id is
// its level-1 parent with one more segment. Shanxi is "CHN.25_1" and its
// prefectures are "CHN.25.1_1" … "CHN.25.11_1", so the parent is recoverable
// from the child by string alone, with no table to maintain.
//
// MIND THE SUFFIX. GADM 4.1's GeoJSON build ends a level-2 GID with "_1" too,
// not "_2" — verified on gadm41_CHN_2.json, whose first row is GID_2
// "CHN.1.1_1" under GID_1 "CHN.1_1". Matching on "_2" looked obviously right
// and would have quietly indexed nothing at all, which is the same silent
// unassignment this file exists to prevent. What distinguishes a level-2 id is
// the extra numeric SEGMENT, never the suffix.
//
// The UK is the exception and stays one, because ONS codes are not GADM ids
// ("GBR.TLM_1", "GBR.S12000033") and carry no parent segment — build-preset.mjs
// keeps its own mapping for those.

const LEVEL2_ID = /^([A-Z]{3}\.\d+)\.\d+_\d+$/;

// seed features → Map("CHN.25" → ["CHN.25.1_2", …]), in seed order.
export function buildLevel2Index(features) {
  const index = new Map();
  for (const feature of features ?? []) {
    const id = String(feature?.properties?.id ?? "");
    const match = LEVEL2_ID.exec(id);
    if (!match) continue;
    const parent = match[1];
    if (!index.has(parent)) index.set(parent, []);
    index.get(parent).push(id);
  }
  return index;
}

// "CHN.25_1" → every prefecture of Shanxi, when the seed holds them. Anything
// else — a level-2 id, an ONS code, a country that was never subdivided — is
// returned unchanged, so this is safe to run over every key in every spec.
export function expandLegacyLevel1(key, index) {
  const match = /^([A-Z]{3}\.\d+)_1$/.exec(String(key ?? ""));
  if (!match) return [key];
  const children = index?.get(match[1]);
  return children && children.length > 0 ? [...children] : [key];
}

// ── AND THE SAME PROBLEM AGAIN, FROM A SOURCE WITH NO PARENT IN THE ID ───────
//
// Germany's answer was never in GADM: 16 Bundesländer or ~403 Kreise and the
// original's own number is 89. Eurostat GISCO's NUTS-2 is the missing tier (38
// for Germany), and it is the same layer already adopted for Britain — ITL2 is
// the post-Brexit rename of UK NUTS-2, which is why the seed's British rows read
// "GBR.TLC3".
//
// But a NUTS id carries no parent SEGMENT — "DEU.DE24" cannot be walked back to
// "DEU.2_1" by string surgery the way "CHN.25.1_1" can. So this is a table, like
// the UK's, and it is only needed for ids a SPEC actually names. Five specs name
// all sixteen German ones (the occupation zones of 1946, the two Germanies of
// 1950 and 1989, and the Reich of 1914 and 1836's German states).
//
// EVERY ROW BELOW WAS DERIVED FROM DATA, NOT MEMORY: the retired GADM rows'
// names were matched against GISCO's own NUTS-1 names, and all 16 matched.
//
// GERMANY IS THE ONLY COUNTRY HERE, AND THAT IS A DECISION. Poland, the
// Netherlands, Austria and Denmark were merged on the same pass and then
// REVERTED. Their NUTS tiers are statistical constructs, not administrations:
// Poland's NUTS-3 came through as "Kaliski", "Szczecinecko-pyrzycki",
// "Bydgosko-toruński" — subregion adjectives nobody governs or lives in — where
// its GADM level-1 is the sixteen voivodeships, which are real and readable.
// Germany's NUTS-2 is different in kind: Oberbayern, Düsseldorf, Dresden,
// Weser-Ems are Regierungsbezirke, actual administrative districts with names a
// player recognises. We draw a map of administrations, so that is the line.
export const NUTS_PREFIX_OF_LEGACY_ID = {
  "DEU.1_1": "DE1",   // Baden-Württemberg
  "DEU.2_1": "DE2",   // Bayern
  "DEU.3_1": "DE3",   // Berlin
  "DEU.4_1": "DE4",   // Brandenburg
  "DEU.5_1": "DE5",   // Bremen
  "DEU.6_1": "DE6",   // Hamburg
  "DEU.7_1": "DE7",   // Hessen
  "DEU.8_1": "DE8",   // Mecklenburg-Vorpommern
  "DEU.9_1": "DE9",   // Niedersachsen
  "DEU.10_1": "DEA",  // Nordrhein-Westfalen
  "DEU.11_1": "DEB",  // Rheinland-Pfalz
  "DEU.12_1": "DEC",  // Saarland
  "DEU.13_1": "DEE",  // Sachsen-Anhalt  ← note: GADM orders it BEFORE Sachsen
  "DEU.14_1": "DED",  // Sachsen
  "DEU.15_1": "DEF",  // Schleswig-Holstein
  "DEU.16_1": "DEG",  // Thüringen
};

// seed features → Map("DEU" → ["DEU.DE11", …]). Kept per country so a prefix
// match cannot reach across borders.
export function buildNutsIndex(features) {
  const index = new Map();
  for (const feature of features ?? []) {
    const id = String(feature?.properties?.id ?? "");
    const dot = id.indexOf(".");
    if (dot < 1) continue;
    const gid0 = id.slice(0, dot);
    if (!index.has(gid0)) index.set(gid0, []);
    index.get(gid0).push(id);
  }
  return index;
}

// "DEU.4_1" → every NUTS-2 region of Brandenburg now in the seed. Unmapped keys
// come back untouched, so this is safe over every key in every spec.
export function expandLegacyNuts(key, index) {
  const mapped = NUTS_PREFIX_OF_LEGACY_ID[String(key ?? "")];
  if (!mapped) return [key];
  const gid0 = String(key).slice(0, String(key).indexOf("."));
  const ids = index?.get(gid0) ?? [];
  const prefixes = (Array.isArray(mapped) ? mapped : [mapped]).map((p) => `${gid0}.${p}`);
  const hits = ids.filter((id) => prefixes.some((prefix) => id.startsWith(prefix)));
  return hits.length > 0 ? hits : [key];
}

// ── ONE EXPANDER, FOR EVERY BUILDER THAT HAS TO RESOLVE A LEGACY KEY ─────────
//
// The three rules above (UK table, NUTS table, GADM parent) were assembled
// inline inside build-preset and nowhere else, which was fine while only specs
// named legacy keys. They do not: `default/world.json` holds 168 ownership
// facts on level-1 ids that a subdivision pass replaced, and build-default-map
// needs the same resolution to keep them.
//
// It is one function rather than two copies for the reason this repo has
// already paid for once — build-preset and build-default-map each carried their
// own idea of what a real region was, only one of them learned about the second
// phantom, and all 22 shared maps un-shared themselves in a single rebuild
// (lib/regionRef.mjs tells that story). A resolution rule that two builders
// disagree about produces exactly the same class of damage, quietly.
const UK_NATION_OF_LEGACY_ID = { "GBR.1_1": "E", "GBR.2_1": "N", "GBR.3_1": "S", "GBR.4_1": "W" };
// ONS ships two UK code systems and they say the nation differently:
//   ITL2  — TLC..TLK England, TLL Wales, TLM Scotland, TLN Northern Ireland
//   CTYUA — E… / W… / S… / N… as the first letter
const ITL2_NATION = { C: "E", D: "E", E: "E", F: "E", G: "E", H: "E", I: "E", J: "E", K: "E", L: "W", M: "S", N: "N" };

export const ukNationOf = (id) => {
  const itl2 = /^GBR\.TL([C-N])\d?/.exec(id);
  if (itl2) return ITL2_NATION[itl2[1]] ?? "";
  const ctyua = /^GBR\.([EWSN])\d+/.exec(id);
  return ctyua ? ctyua[1] : "";
};

/**
 * Build the resolver from the ids the SEED currently holds — not the pmtiles
 * catalog, which lags it. Pass an iterable of region id strings.
 *
 * Returns `expand(key)`: the ids that key means. A legacy UK level-1 key becomes
 * that nation's counties, a German level-1 key becomes its NUTS-2 rows, a GADM
 * level-1 key becomes its level-2 children where the seed has them, and
 * anything else is itself.
 */
export function buildRegionKeyExpander(regionIds) {
  const features = [...regionIds].map((id) => ({ properties: { id: String(id) } }));
  const ukNationRegions = new Map();
  for (const feature of features) {
    const id = feature.properties.id;
    const nation = id.startsWith("GBR.") ? ukNationOf(id) : "";
    if (!nation) continue;
    if (!ukNationRegions.has(nation)) ukNationRegions.set(nation, []);
    ukNationRegions.get(nation).push(id);
  }
  const level2Index = buildLevel2Index(features);
  const nutsIndex = buildNutsIndex(features);

  return (key) => {
    const nation = UK_NATION_OF_LEGACY_ID[key];
    if (nation) {
      const expanded = ukNationRegions.get(nation) ?? [];
      if (expanded.length > 0) return expanded;
    }
    const byNuts = expandLegacyNuts(key, nutsIndex);
    if (byNuts.length > 1 || byNuts[0] !== key) return byNuts;
    return expandLegacyLevel1(key, level2Index);
  };
}

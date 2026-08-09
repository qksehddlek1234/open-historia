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
// its level-1 parent with one more segment. "CHN.25_1" (Shanxi) becomes
// "CHN.25.1_2" … "CHN.25.11_2", so the parent is recoverable from the child by
// string alone, with no table to maintain.
//
// The UK is the exception and stays one, because ONS codes are not GADM ids
// ("GBR.TLM_1", "GBR.S12000033") and carry no parent segment — build-preset.mjs
// keeps its own mapping for those.

const LEVEL2_ID = /^([A-Z]{3}\.\d+)\.\d+_2$/;

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

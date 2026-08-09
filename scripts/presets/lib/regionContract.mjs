/*! Open Historia — the region contract every preset carries © 2026 Nicholas Krol, MIT (see src/Editor/LICENSE). */
// WHAT A REGION MEANS, STATED ONCE FOR EVERY PRESET.
//
// Mined from the original's own WWII preset rules (its public preset page), and
// checked against our own boards. Not its prose — its ARGUMENT, which is one we
// were missing and needed:
//
//   Our region sizes are wildly uneven, because they are modern administrative
//   divisions and those are uneven. In the 1935 build: Britain is 46 regions,
//   China 33, and EIGHT polities own exactly one region each — the Shanxi,
//   Xinjiang, Guangxi, Yunnan and Shandong cliques, Tibet, Mengjiang and the
//   Chinese Soviet Republic. Ethiopia is one region too. Without a rule, a
//   model treats "took a region" as the same event in both cases, and a border
//   skirmish in Shanxi reads as the annexation of an entire state.
//
// So: a region is a UNIT OF SOVEREIGNTY, not a unit of area. The three clauses
// below say what follows from that. They are appended to every preset's own
// rules at build time rather than pasted into thirteen spec files, so fixing
// the wording once fixes it everywhere.
export const REGION_CONTRACT =
  " HOW REGIONS WORK HERE (applies to every polity on this map). Regions are "
  + "modern administrative divisions, so their SIZE varies enormously and their "
  + "size means nothing about their importance. Some polities hold dozens; many "
  + "hold a handful; some hold exactly ONE — and where a polity owns a single "
  + "region, that region IS the whole country. Such a polity does not lose it to "
  + "a raid, a border clash or a won battle: the region transfers only when the "
  + "entire country has actually been occupied and its government has fallen or "
  + "fled. Conversely, taking one region from a polity that holds thirty is a "
  + "front-line advance, not a conquest, and the war continues. INVASIONS MOVE "
  + "AS FRONTS: an advance takes the regions between where it started and where "
  + "it reached — never a distant region with untaken ground behind it — and "
  + "when a front moves, transfer EVERY region it has actually overrun rather "
  + "than a token one. OCCUPATION IS NOT ANNEXATION: land held by an army is "
  + "occupied territory until something settles its status — a treaty, a formal "
  + "annexation, or a new administration installed on it. Where an occupier "
  + "would historically have created a distinct administration over what it "
  + "took, create that polity rather than painting the ground the occupier's "
  + "colour, and say so in the narration.";

// One more clause, only for presets whose start date sits inside recorded
// history: the world before the start is the real one.
export const HISTORICAL_PRIOR =
  " EVERYTHING BEFORE THE START DATE HAPPENED AS IT REALLY DID. The board is "
  + "the real world on that morning, and every actor's history, grievances and "
  + "commitments are the real ones. Divergence begins with this turn.";

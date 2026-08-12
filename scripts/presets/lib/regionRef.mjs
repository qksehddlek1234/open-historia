/*! Open Historia — what counts as a reference to a real region © 2026 Nicholas Krol, MIT (see src/Editor/LICENSE). */
// ONE PREDICATE, BECAUSE TWO BUILDERS ALREADY DRIFTED APART.
//
// build-default-map and build-preset both read the same seed and both have to
// decide what is a place. They had separate answers and both were incomplete:
// build-preset carried a JUNK_GID0 set keyed on the country code, which caught
// the NA row; build-default-map got a "a country code is three characters"
// rule, which also caught NA. Neither caught the second phantom, and when only
// one of them was widened the fleet's 22 shared maps collapsed back to their own
// copies in a single rebuild — every preset suddenly had one feature the base
// did not.
//
// THE TWO PHANTOMS, and why it takes two clauses to name them:
//
//   {id:"NA",  gid0:"NA",  name:"NA"}      — R's missing value, stringified
//                                            upstream of the seed. Caught by the
//                                            code-length clause.
//   {id:"?",   gid0:"UKR", name:"?"}       — the same kind of hole with a REAL
//                                            country code, sitting on Kyiv.
//                                            Only the prefix clause sees it.
//
// WHAT MUST SURVIVE, and does:
//   GHA13_2 … GHA16_2   16 Ghanaian regions whose id lost its dot. Malformed,
//                       but real places, and they do start with GHA.
//   Z01.14_1 …          12 disputed regions on our own pseudo-codes — Kashmir,
//                       Xinjiang, Tibet, Arunachal Pradesh. Three CHARACTERS,
//                       not three letters, is what keeps them.
//
// Measured against the current seed: 4,942 rows in, 2 rejected, 4,940 out.
const CODE = /^[A-Z0-9]{3}$/;

/**
 * True when this row names a real region: a three-character country code, and
 * an id that begins with that code.
 *
 * Deliberately not a full grammar. It does not require the dot (Ghana), does not
 * require digits, and does not check the catalog — a stricter rule here is a
 * rule that quietly drops a place, which is the more expensive mistake. It only
 * refuses rows that cannot be pointing at anything.
 */
export const isRegionReference = (id, gid0) => {
  const regionId = id == null ? "" : String(id);
  const country = gid0 == null ? "" : String(gid0);
  if (!regionId || !CODE.test(country)) return false;
  return regionId.startsWith(country);
};

/** Why a row was refused, for a build log that names what it dropped. */
export const regionRefReason = (id, gid0) => {
  const regionId = id == null ? "" : String(id);
  const country = gid0 == null ? "" : String(gid0);
  if (!regionId) return "no id";
  if (!CODE.test(country)) return `gid0 "${country}" is not a country code`;
  if (!regionId.startsWith(country)) return `id "${regionId}" does not belong to "${country}"`;
  return "";
};

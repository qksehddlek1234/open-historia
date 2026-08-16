/*! Open Historia — who actually held a modern GADM country in a given era © 2026 Nicholas Krol, MIT (see src/Editor/LICENSE). */
// THE PROBLEM THIS SOLVES, MEASURED ON THE PLAYER'S OWN 1935 MAP.
//
// `unassignedKeepModernOwner` exists for a good reason: Mexico and Turkey were
// real states in 1939 and leaving them blank would be worse than wrong. But it
// was implemented as "keep whatever GADM's modern GID_0 says", and GADM's map
// is 2020's. So the 1935 board came out carrying:
//
//   North Korea × 14 regions   (founded 1948)
//   South Sudan × 10           (2011)
//   Pakistan × 2, India × 6    (1947 — the Kashmir Z0x pseudo-countries)
//   Northern Cyprus × 5        (1983)
//   Anguilla, Bermuda, Montserrat, Cook Islands, Tokelau, Nauru, Vanuatu,
//   Samoa, Tonga, Tuvalu, Jersey, Guernsey, Isle of Man, Åland, Svalbard,
//   Saint Barthélemy, Bonaire… — every dependency drawn as its own sovereign
//   state, which is also why "colonies aren't implemented" was a fair verdict.
//   NA × 1                     (a GADM junk row: GID_0 "NA", NAME_1 "NA")
//
// So: a table of who actually held each of these on a given date. It answers in
// ISO3 codes, and the caller maps a code to whatever the preset calls that
// power ("GBR" → "British Empire" in 1935, "United Kingdom" in 2000). Entries
// are windows; a code with no window on the asked date is its own sovereign,
// which is the right answer for the ~180 countries not listed here.
//
// Scope note: this covers the near-modern presets (1804 →), which are the ones
// that switch modern fallback on. Deep-past presets leave unassigned land
// unclaimed and never consult this.

import { gameYear } from "../../../src/runtime/gameDate.js";

// The year reader lives in runtime/gameDate.js now. The regex that used to sit
// here was wrong on all three of bronze-1200bc's candidate date strings — it
// read "1200 BCE" as +1200, "-1200-01-01" as -1200 (a string Date.parse in fact
// reads as the Middle Ages), and the correct extended form "-001199-01-01" as
// -0011. This table only covers 1804 → and so never met one, but the reader was
// shared-shaped and wrong, which is how it would have spread.
const YEAR = (dateISO) => gameYear(dateISO);

// { code: [[fromYear, untilYear, ownerISO3]] } — untilYear is EXCLUSIVE.
// `null` as owner means "unclaimed by any state on this table's terms".
const HELD_BY = {
  // ── The two Koreas ────────────────────────────────────────────────────────
  // Joseon → Korean Empire → Japanese rule (1910-08-29) → division (1945).
  // Before 1948 there is no North Korea and no South Korea to draw.
  PRK: [[1910, 1945, "JPN"], [1945, 1948, "SUN"]],
  KOR: [[1910, 1945, "JPN"], [1945, 1948, "USA"]],

  // ── Partition of British India (1947-08-15) ───────────────────────────────
  PAK: [[1858, 1947, "GBR"]],
  BGD: [[1858, 1947, "GBR"], [1947, 1971, "PAK"]],
  IND: [[1858, 1947, "GBR"]],
  LKA: [[1815, 1948, "GBR"]],
  MMR: [[1886, 1948, "GBR"]],

  // ── Sudan's south (2011-07-09) ────────────────────────────────────────────
  SSD: [[1899, 1956, "GBR"], [1956, 2011, "SDN"]],
  SDN: [[1899, 1956, "GBR"]],

  // ── Cyprus, and the north (1983) ──────────────────────────────────────────
  CYP: [[1878, 1960, "GBR"]],
  // GADM's Northern Cyprus rides with Cyprus until 1974 in every sense a map
  // at this scale can show.
  ZNC: [[1878, 1960, "GBR"], [1960, 1983, "CYP"]],

  // ── British dependencies and Crown dependencies ───────────────────────────
  AIA: [[1650, 9999, "GBR"]],
  BMU: [[1612, 9999, "GBR"]],
  MSR: [[1632, 9999, "GBR"]],
  CYM: [[1670, 9999, "GBR"]],
  TCA: [[1799, 9999, "GBR"]],
  VGB: [[1672, 9999, "GBR"]],
  FLK: [[1833, 9999, "GBR"]],
  SHN: [[1659, 9999, "GBR"]],
  GIB: [[1713, 9999, "GBR"]],
  IMN: [[1765, 9999, "GBR"]],
  JEY: [[1204, 9999, "GBR"]],
  GGY: [[1204, 9999, "GBR"]],
  IOT: [[1814, 9999, "GBR"]],
  SGS: [[1775, 9999, "GBR"]],
  PCN: [[1838, 9999, "GBR"]],
  XAD: [[1878, 9999, "GBR"]], // Akrotiri and Dhekelia — sovereign base areas

  // ── The Pacific: mandates, protectorates and colonies ─────────────────────
  NRU: [[1888, 1914, "DEU"], [1914, 1968, "GBR"]], // German, then C-mandate
  VUT: [[1906, 1980, "GBR"]], // New Hebrides condominium (Anglo-French)
  WSM: [[1900, 1914, "DEU"], [1914, 1962, "NZL"]], // German then NZ mandate
  ASM: [[1900, 9999, "USA"]],
  COK: [[1888, 1965, "NZL"]],
  NIU: [[1900, 1974, "NZL"]],
  TKL: [[1889, 9999, "NZL"]],
  TON: [[1900, 1970, "GBR"]], // protected state
  TUV: [[1892, 1978, "GBR"]], // Ellice Islands
  KIR: [[1892, 1979, "GBR"]], // Gilbert Islands
  SLB: [[1893, 1978, "GBR"]],
  FJI: [[1874, 1970, "GBR"]],
  PNG: [[1884, 1975, "AUS"]],
  NCL: [[1853, 9999, "FRA"]],
  PYF: [[1842, 9999, "FRA"]],
  WLF: [[1887, 9999, "FRA"]],
  UMI: [[1857, 9999, "USA"]],
  GUM: [[1898, 9999, "USA"]],
  MNP: [[1899, 1914, "DEU"], [1914, 1947, "JPN"], [1947, 1986, "USA"]],
  MHL: [[1885, 1914, "DEU"], [1914, 1947, "JPN"], [1947, 1986, "USA"]],
  FSM: [[1885, 1914, "DEU"], [1914, 1947, "JPN"], [1947, 1986, "USA"]],
  PLW: [[1885, 1914, "DEU"], [1914, 1947, "JPN"], [1947, 1994, "USA"]],

  // ── Nordic and Atlantic dependencies ──────────────────────────────────────
  ALA: [[1809, 1917, "RUS"], [1917, 9999, "FIN"]],
  // 스발바르는 1920년 조약 전까지 무주지였다 — 어느 국가도 갖지 않는다.
  SJM: [[1000, 1920, null], [1920, 9999, "NOR"]],
  GRL: [[1814, 9999, "DNK"]],
  FRO: [[1814, 9999, "DNK"]],
  // 아이슬란드는 1918년 연합법으로 동군연합 하 주권 왕국이 됐지만 외교는 코펜하겐이
  // 맡았고, 완전 독립은 1944년 6월 17일이다. 보드에서는 덴마크 땅으로 그린다 —
  // 대조 대상인 World War II++에도 Iceland 폴리티가 없고, 그쪽 덴마크가 아이슬란드
  // 8개 지역을 전부 갖고 있다가 1944년에 분리시킨다. 이건 사고가 아니라 결정이다.
  ISL: [[1814, 1944, "DNK"]],

  // ── Dutch, French and other European dependencies ─────────────────────────
  ABW: [[1636, 9999, "NLD"]],
  CUW: [[1634, 9999, "NLD"]],
  SXM: [[1648, 9999, "NLD"]],
  BES: [[1636, 9999, "NLD"]],
  MAF: [[1648, 9999, "FRA"]],
  BLM: [[1878, 9999, "FRA"]],
  SPM: [[1816, 9999, "FRA"]],
  MTQ: [[1635, 9999, "FRA"]],
  GLP: [[1635, 9999, "FRA"]],
  GUF: [[1664, 9999, "FRA"]],
  REU: [[1642, 9999, "FRA"]],
  MYT: [[1841, 9999, "FRA"]],
  ATF: [[1893, 9999, "FRA"]],
  ESH: [[1884, 1976, "ESP"]],
  HKG: [[1842, 1997, "GBR"]],
  MAC: [[1557, 1999, "PRT"]],

  // ── GADM's disputed-territory pseudo-countries ────────────────────────────
  // These are the Kashmir fragments. GADM splits the contested Himalaya into
  // Z01..Z09 with a modern claimant each, so the 1935 map grew an "India", a
  // "Pakistan" and a "China" inside British Raj territory.
  Z01: [[1858, 1947, "GBR"], [1947, 9999, "IND"]], // Jammu and Kashmir
  Z04: [[1858, 1947, "GBR"], [1947, 9999, "IND"]], // Himachal
  Z05: [[1858, 1947, "GBR"], [1947, 9999, "IND"]], // Uttarakhand
  Z07: [[1858, 1947, "GBR"], [1947, 9999, "IND"]], // Arunachal
  Z09: [[1858, 1947, "GBR"], [1947, 9999, "IND"]],
  Z06: [[1858, 1947, "GBR"], [1947, 9999, "PAK"]], // Gilgit-Baltistan, Azad Kashmir
  Z02: [[1720, 9999, "CHN"]], // Xinjiang side
  Z03: [[1720, 9999, "CHN"]],
  Z08: [[1720, 9999, "CHN"]], // Xizang side
};

// A GADM row that is not a place. GID_0 "NA", NAME_1 "NA" — one junk feature
// that rendered as a country called "NA" on every near-modern board.
export const JUNK_GID0 = new Set(["NA", "", "-99"]);

// Three distinct answers, and the difference matters:
//   ""    — not on the table for this date: the code is its own sovereign
//           (the right answer for the ~180 countries not listed here)
//   "XXX" — held by that ISO3 power
//   null  — explicitly held by NOBODY (terra nullius: Svalbard before 1920)
export const heldBy = (gid0, dateISO) => {
  const code = String(gid0 ?? "").trim();
  const year = YEAR(dateISO);
  if (!code || !Number.isFinite(year)) return "";
  const windows = HELD_BY[code];
  if (!windows) return "";
  for (const [from, until, owner] of windows) {
    if (year >= from && year < until) return owner === null ? null : String(owner || "");
  }
  return "";
};

// Did this state exist on this date at all? A code held by someone else — or by
// nobody — was not sovereign then.
export const existedAsState = (gid0, dateISO) => heldBy(gid0, dateISO) === "";

// The era owner's NAME for a preset: resolve the holder code through the spec's
// own assignments so the answer speaks the preset's vocabulary ("GBR" →
// "British Empire" in 1935, "United Kingdom" in 2000), falling back to the
// modern name when the preset never mentions that power.
//
// Returns "" for "leave the modern fallback alone" and UNCLAIMED for land no
// state held — the caller must not confuse the two, or terra nullius silently
// becomes whatever GADM calls it today.
export const UNCLAIMED = Symbol("unclaimed");

export const eraOwnerName = (gid0, dateISO, { gid0ToPolityName = {}, countryNames = {} } = {}) => {
  const holder = heldBy(gid0, dateISO);
  if (holder === null) return UNCLAIMED;
  if (!holder) return "";
  return gid0ToPolityName[holder] || countryNames[holder] || holder;
};

export const __TABLE = HELD_BY;

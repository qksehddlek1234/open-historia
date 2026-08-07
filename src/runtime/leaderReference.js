/*! Open Historia — real officeholders on record © 2026 Nicholas Krol, MIT (see src/Editor/LICENSE). */
// A 12B DOES NOT KNOW WHO GOVERNS, AND NO PROMPT TEACHES IT. Measured across
// three rounds of sheet generations on the live campaign: China's premier came
// back "국무원총리 장관정 (장가정)" (invented, hedged) with 리커창 in office,
// Australia was led by "총리 말리언 바리스" (invented), France's deputy was
// "총리 장리크 브르토" (invented), the Philippines got 마르코스 주니어 six
// years early, and well-known offices (황교안, 메드베데프) kept coming back as
// sentinels. Asking harder produced inventions wearing hedges; the certainty
// gate produced honest blanks. Both are knowledge failures, and the engine's
// answer to a knowledge failure is a RECORD (the 12B pattern: the engine
// validates and repairs — it does not plead).
//
// This module ships the modern era's actual officeholders — public-record
// facts, uncopyrightable — titled, in the game's language, with term windows.
// The sheet task consults it ONLY where the campaign has no recorded person of
// its own: campaign events always outrank the reference (alternate history is
// the point of the game), and a term window that has lapsed simply stops
// applying rather than installing a real-world successor the campaign never
// elected. Countries or dates outside the table behave exactly as before.
//
// Entries: { name, from?, until? } — the name carries the official title
// (STAT_FIELDS format), windows are inclusive ISO dates. "(없음)" as a name is
// itself a fact on record: the system has no separate such office.

const normalizeString = (value) => String(value ?? "").trim();

const REFERENCE = {
  "South Korea": {
    leader: [{ name: "대통령 박근혜", from: "2013-02-25", until: "2017-03-10" }],
    headOfState: [{ name: "(없음)" }],
    deputy: [{ name: "국무총리 황교안", from: "2015-06-18", until: "2017-05-11" }],
  },
  "North Korea": {
    leader: [
      { name: "국방위원회 제1위원장 김정은", from: "2012-04-13", until: "2016-06-29" },
      { name: "국무위원장 김정은", from: "2016-06-29" },
    ],
    headOfState: [{ name: "최고인민회의 상임위원장 김영남", from: "1998-09-05", until: "2019-04-11" }],
    deputy: [{ name: "내각총리 박봉주", from: "2013-04-01", until: "2019-04-11" }],
  },
  China: {
    leader: [{ name: "국가주석 시진핑", from: "2013-03-14" }],
    headOfState: [{ name: "(없음)" }],
    deputy: [{ name: "국무원 총리 리커창", from: "2013-03-15", until: "2023-03-11" }],
  },
  Japan: {
    leader: [{ name: "총리 아베 신조", from: "2012-12-26", until: "2020-09-16" }],
    headOfState: [{ name: "천황 아키히토", from: "1989-01-07", until: "2019-04-30" }],
    deputy: [{ name: "부총리 아소 다로", from: "2012-12-26", until: "2021-10-04" }],
  },
  "United States": {
    leader: [{ name: "대통령 버락 오바마", from: "2009-01-20", until: "2017-01-20" }],
    headOfState: [{ name: "(없음)" }],
    deputy: [{ name: "부통령 조 바이든", from: "2009-01-20", until: "2017-01-20" }],
  },
  Russia: {
    leader: [{ name: "대통령 블라디미르 푸틴", from: "2012-05-07" }],
    headOfState: [{ name: "(없음)" }],
    deputy: [{ name: "총리 드미트리 메드베데프", from: "2012-05-08", until: "2020-01-16" }],
  },
  "United Kingdom": {
    leader: [{ name: "총리 데이비드 캐머런", from: "2010-05-11", until: "2016-07-13" }],
    headOfState: [{ name: "여왕 엘리자베스 2세", from: "1952-02-06", until: "2022-09-08" }],
    deputy: [{ name: "제1국무장관 조지 오스본", from: "2015-05-08", until: "2016-07-13" }],
  },
  France: {
    leader: [{ name: "대통령 프랑수아 올랑드", from: "2012-05-15", until: "2017-05-14" }],
    headOfState: [{ name: "(없음)" }],
    deputy: [{ name: "총리 마뉘엘 발스", from: "2014-03-31", until: "2016-12-06" }],
  },
  Germany: {
    leader: [{ name: "총리 앙겔라 메르켈", from: "2005-11-22", until: "2021-12-08" }],
    headOfState: [{ name: "대통령 요아힘 가우크", from: "2012-03-18", until: "2017-03-18" }],
    deputy: [{ name: "부총리 지크마어 가브리엘", from: "2013-12-17", until: "2018-03-14" }],
  },
  Philippines: {
    leader: [
      { name: "대통령 베니그노 아키노 3세", from: "2010-06-30", until: "2016-06-30" },
      { name: "대통령 로드리고 두테르테", from: "2016-06-30", until: "2022-06-30" },
    ],
    headOfState: [{ name: "(없음)" }],
    deputy: [
      { name: "부통령 제조마르 비나이", from: "2010-06-30", until: "2016-06-30" },
      { name: "부통령 레니 로브레도", from: "2016-06-30", until: "2022-06-30" },
    ],
  },
  Brazil: {
    leader: [
      { name: "대통령 지우마 호세프", from: "2011-01-01", until: "2016-08-31" },
      { name: "대통령 미셸 테메르", from: "2016-08-31", until: "2018-12-31" },
    ],
    headOfState: [{ name: "(없음)" }],
    deputy: [{ name: "(없음)", from: "2016-08-31", until: "2018-12-31" }],
  },
  Canada: {
    leader: [{ name: "총리 저스틴 트뤼도", from: "2015-11-04" }],
    headOfState: [{ name: "여왕 엘리자베스 2세", from: "1952-02-06", until: "2022-09-08" }],
    deputy: [{ name: "(없음)", until: "2019-11-20" }],
  },
  Australia: {
    leader: [{ name: "총리 맬컴 턴불", from: "2015-09-15", until: "2018-08-24" }],
    headOfState: [{ name: "여왕 엘리자베스 2세", from: "1952-02-06", until: "2022-09-08" }],
    deputy: [{ name: "부총리 바너비 조이스", from: "2016-02-18", until: "2017-10-27" }],
  },
  Kazakhstan: {
    leader: [{ name: "대통령 누르술탄 나자르바예프", from: "1991-12-16", until: "2019-03-19" }],
    headOfState: [{ name: "(없음)" }],
    deputy: [{ name: "총리 카림 마시모프", from: "2014-04-02", until: "2016-09-08" }],
  },
  Mongolia: {
    leader: [{ name: "총리 자르갈툴가 에르데네바트", from: "2016-07-08", until: "2017-09-07" }],
    headOfState: [{ name: "대통령 차히아긴 엘베그도르지", from: "2009-06-18", until: "2017-07-10" }],
  },
  Turkey: {
    leader: [{ name: "대통령 레제프 타이이프 에르도안", from: "2014-08-28" }],
    headOfState: [{ name: "(없음)" }],
    deputy: [{ name: "총리 비날리 이을드름", from: "2016-05-24", until: "2018-07-09" }],
  },
  India: {
    leader: [{ name: "총리 나렌드라 모디", from: "2014-05-26" }],
    headOfState: [{ name: "대통령 프라납 무케르지", from: "2012-07-25", until: "2017-07-25" }],
    deputy: [{ name: "(없음)" }],
  },
  Italy: {
    leader: [{ name: "총리 마테오 렌치", from: "2014-02-22", until: "2016-12-12" }],
    headOfState: [{ name: "대통령 세르조 마타렐라", from: "2015-02-03" }],
  },
  Ethiopia: {
    leader: [{ name: "총리 하일레마리암 데살렌", from: "2012-09-15", until: "2018-02-15" }],
    headOfState: [{ name: "대통령 물라투 테쇼메", from: "2013-10-07", until: "2018-10-25" }],
  },
  Taiwan: {
    leader: [{ name: "총통 차이잉원", from: "2016-05-20", until: "2024-05-20" }],
    headOfState: [{ name: "(없음)" }],
    deputy: [{ name: "행정원장 린취안", from: "2016-05-20", until: "2017-09-08" }],
  },
  Sweden: {
    leader: [{ name: "총리 스테판 뢰벤", from: "2014-10-03", until: "2021-11-10" }],
    headOfState: [{ name: "국왕 칼 16세 구스타프", from: "1973-09-15" }],
    deputy: [{ name: "부총리 이사벨라 뢰빈", from: "2016-05-25", until: "2019-01-21" }],
  },
  Norway: {
    leader: [{ name: "총리 에르나 솔베르그", from: "2013-10-16", until: "2021-10-14" }],
    headOfState: [{ name: "국왕 하랄 5세", from: "1991-01-17" }],
    deputy: [{ name: "(없음)" }],
  },
  "South Africa": {
    leader: [{ name: "대통령 제이컵 주마", from: "2009-05-09", until: "2018-02-14" }],
    headOfState: [{ name: "(없음)" }],
    deputy: [{ name: "부통령 시릴 라마포사", from: "2014-05-26", until: "2018-02-14" }],
  },
  Vietnam: {
    leader: [{ name: "공산당 서기장 응우옌 푸 쫑", from: "2011-01-19" }],
    headOfState: [{ name: "국가주석 쩐다이꽝", from: "2016-04-02", until: "2018-09-21" }],
    deputy: [{ name: "총리 응우옌 쑤언 푹", from: "2016-04-07", until: "2021-04-05" }],
  },
};

const inWindow = (entry, time) => {
  const from = entry.from ? Date.parse(entry.from) : Number.NEGATIVE_INFINITY;
  const until = entry.until ? Date.parse(entry.until) : Number.POSITIVE_INFINITY;
  return time >= from && time <= until;
};

// The officeholders on record for one country on one date — only the roles
// whose windows contain the date; {} for an uncovered country or unreadable
// date. Keys are the store's canonical English country names.
export const referenceLeadership = (country, dateISO) => {
  const rows = REFERENCE[normalizeString(country)];
  const time = Date.parse(normalizeString(dateISO));
  if (!rows || !Number.isFinite(time)) return {};
  const out = {};
  for (const role of ["leader", "headOfState", "deputy"]) {
    const hit = (rows[role] ?? []).find((entry) => inWindow(entry, time));
    if (hit) out[role] = hit.name;
  }
  return out;
};

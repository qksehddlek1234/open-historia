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

// Exported as data: the test suite asserts coverage against it, and the
// assembly tooling that merges new era packs reads it directly rather than
// parsing (or worse, evaluating) this file's source text.
export const REFERENCE = {
  Afghanistan: {
    leader: [
      { name: "대통령 하미드 카르자이", from: "2004-12-07", until: "2014-09-29" },
      { name: "대통령 아슈라프 가니", from: "2014-09-29", until: "2021-08-15" },
      { name: "탈레반 최고지도자 하이바툴라 아훈드자다", from: "2021-08-15" },
    ],
    headOfState: [
      { name: "(없음)" },
      { name: "대통령 하미드 카르자이", from: "2004-12-07", until: "2014-09-29" },
    ],
    deputy: [
      { name: "제1부통령 압둘 라시드 도스툼", from: "2014-09-29", until: "2020-03-09" },
      { name: "제1부통령 암룰라 살레", from: "2020-03-09", until: "2021-08-15" },
      { name: "총리 무함마드 하산 아훈드", from: "2021-09-07" },
    ],
  },
  Albania: {
    leader: [
      { name: "총리 살리 베리샤", from: "2005-09-11", until: "2013-09-15" },
      { name: "총리 에디 라마", from: "2013-09-15" },
    ],
    headOfState: [
      { name: "대통령 알프레드 모이시우", from: "2002-07-24", until: "2007-07-24" },
      { name: "대통령 바미르 토피", from: "2007-07-24", until: "2012-07-24" },
      { name: "대통령 부야르 니샤니", from: "2012-07-24", until: "2017-07-24" },
      { name: "대통령 일리르 메타", from: "2017-07-24", until: "2022-07-24" },
      { name: "대통령 바이람 베가이", from: "2022-07-24" },
    ],
  },
  Algeria: {
    leader: [
      { name: "대통령 압델아지즈 부테플리카", from: "1999-04-27", until: "2019-04-02" },
      { name: "임시 대통령 압델카데르 벤살라", from: "2019-04-09", until: "2019-12-19" },
      { name: "대통령 압델마지드 테분", from: "2019-12-19" },
    ],
    headOfState: [
      { name: "(없음)" },
    ],
    deputy: [
      { name: "총리 압델말레크 셀랄", from: "2014-04-29", until: "2017-05-24" },
      { name: "총리 아흐메드 우야히아", from: "2017-08-15", until: "2019-03-11" },
      { name: "총리 누레딘 베두이", from: "2019-03-11", until: "2019-12-19" },
      { name: "총리 압델아지즈 제라드", from: "2019-12-28", until: "2021-06-30" },
      { name: "총리 아이멘 베나브데라흐만", from: "2021-06-30", until: "2023-11-11" },
      { name: "총리 나디르 라르바우이", from: "2023-11-11", until: "2025-08-28" },
      { name: "총리 시피 그리브", from: "2025-08-28" },
    ],
  },
  Andorra: {
    leader: [
      { name: "총리 알베르트 핀타트", from: "2005-05-27", until: "2011-05-12" },
      { name: "총리 안토니 마르티", from: "2011-05-12", until: "2019-05-16" },
      { name: "총리 샤비에르 에스포트 사모라", from: "2019-05-16" },
    ],
  },
  Angola: {
    leader: [
      { name: "대통령 조제 에두아르두 두스산투스", until: "2017-09-26" },
      { name: "대통령 주앙 로렌수", from: "2017-09-26" },
    ],
    headOfState: [
      { name: "(없음)" },
    ],
    deputy: [
      { name: "부통령 마누엘 비센트", from: "2012-09-26", until: "2017-09-26" },
      { name: "부통령 보르니투 드소자", from: "2017-09-26", until: "2022-09-15" },
      { name: "부통령 에스페란사 다코스타", from: "2022-09-15" },
    ],
  },
  "Antigua and Barbuda": {
    leader: [
      { name: "총리 볼드윈 스펜서", from: "2004-03-24", until: "2014-06-13" },
      { name: "총리 개스턴 브라운", from: "2014-06-13" },
    ],
    headOfState: [
      { name: "여왕 엘리자베스 2세", until: "2022-09-08" },
      { name: "국왕 찰스 3세", from: "2022-09-08" },
    ],
  },
  Argentina: {
    leader: [
      { name: "대통령 네스토르 키르치네르", from: "2003-05-25", until: "2007-12-10" },
      { name: "대통령 크리스티나 페르난데스 데 키르치네르", from: "2007-12-10", until: "2015-12-10" },
      { name: "대통령 마우리시오 마크리", from: "2015-12-10", until: "2019-12-10" },
      { name: "대통령 알베르토 페르난데스", from: "2019-12-10", until: "2023-12-10" },
      { name: "대통령 하비에르 밀레이", from: "2023-12-10" },
    ],
    headOfState: [
      { name: "(없음)" },
      { name: "대통령 네스토르 키르치네르", from: "2003-05-25", until: "2007-12-10" },
      { name: "대통령 크리스티나 페르난데스 데 키르치네르", from: "2007-12-10", until: "2015-12-10" },
    ],
    deputy: [
      { name: "부통령 다니엘 시올리", from: "2003-05-25", until: "2007-12-10" },
      { name: "부통령 훌리오 코보스", from: "2007-12-10", until: "2011-12-10" },
      { name: "부통령 아마도 부두", from: "2011-12-10", until: "2015-12-10" },
      { name: "부통령 가브리엘라 미체티", from: "2015-12-10", until: "2019-12-10" },
      { name: "부통령 크리스티나 페르난데스 데 키르치네르", from: "2019-12-10", until: "2023-12-10" },
      { name: "부통령 빅토리아 비야루엘", from: "2023-12-10" },
    ],
  },
  Armenia: {
    leader: [
      { name: "총리 안드라니크 마르가랸", from: "2000-05-12", until: "2007-03-25" },
      { name: "총리 세르지 사르키샨", from: "2007-04-04", until: "2008-04-09" },
      { name: "대통령 세르지 사르키샨", from: "2008-04-09", until: "2018-04-09" },
      { name: "총리 니콜 파시냔", from: "2018-05-08" },
    ],
    headOfState: [
      { name: "대통령 로베르트 코차랸", from: "1998-04-09", until: "2008-04-09" },
      { name: "대통령 아르멘 사르키샨", from: "2018-04-09", until: "2022-02-01" },
      { name: "대통령 바하근 하차투랸", from: "2022-03-13" },
    ],
  },
  Australia: {
    leader: [
      { name: "총리 존 하워드", from: "1996-03-11", until: "2007-12-03" },
      { name: "총리 케빈 러드", from: "2007-12-03", until: "2010-06-24" },
      { name: "총리 줄리아 길라드", from: "2010-06-24", until: "2013-06-27" },
      { name: "총리 케빈 러드", from: "2013-06-27", until: "2013-09-18" },
      { name: "총리 토니 애벗", from: "2013-09-18", until: "2015-09-15" },
      { name: "총리 맬컴 턴불", from: "2015-09-15", until: "2018-08-24" },
      { name: "총리 스콧 모리슨", from: "2018-08-24", until: "2022-05-23" },
      { name: "총리 앤서니 앨버니지", from: "2022-05-23" },
    ],
    headOfState: [
      { name: "여왕 엘리자베스 2세", until: "2022-09-08" },
      { name: "국왕 찰스 3세", from: "2022-09-08" },
    ],
    deputy: [
      { name: "부총리 마크 베일", from: "2005-07-06", until: "2007-12-03" },
      { name: "부총리 줄리아 길라드", from: "2007-12-03", until: "2010-06-24" },
      { name: "부총리 웨인 스완", from: "2010-06-24", until: "2013-06-27" },
      { name: "부총리 앤서니 앨버니지", from: "2013-06-27", until: "2013-09-18" },
      { name: "부총리 워런 트러스", from: "2013-09-18", until: "2016-02-18" },
      { name: "부총리 바너비 조이스", from: "2016-02-18", until: "2018-02-26" },
      { name: "부총리 마이클 매코맥", from: "2018-02-26", until: "2021-06-22" },
      { name: "부총리 바너비 조이스", from: "2021-06-22", until: "2022-05-23" },
      { name: "부총리 리처드 말스", from: "2022-06-01" },
    ],
  },
  Austria: {
    leader: [
      { name: "총리 볼프강 쉬셀", from: "2000-02-04", until: "2007-01-11" },
      { name: "총리 알프레트 구젠바우어", from: "2007-01-11", until: "2008-12-02" },
      { name: "총리 베르너 파이만", from: "2008-12-02", until: "2016-05-09" },
      { name: "총리 크리스티안 케른", from: "2016-05-17", until: "2017-12-18" },
      { name: "총리 제바스티안 쿠르츠", from: "2017-12-18", until: "2019-05-28" },
      { name: "총리 브리기테 비어라인", from: "2019-06-03", until: "2020-01-07" },
      { name: "총리 제바스티안 쿠르츠", from: "2020-01-07", until: "2021-10-11" },
      { name: "총리 카를 네하머", from: "2021-12-06", until: "2025-01-10" },
      { name: "총리 크리스티안 슈토커", from: "2025-03-03" },
    ],
    headOfState: [
      { name: "대통령 하인츠 피셔", from: "2004-07-08", until: "2016-07-08" },
      { name: "대통령 알렉산더 판데어벨렌", from: "2017-01-26" },
    ],
    deputy: [
      { name: "부총리 후베르트 고르바흐", from: "2003-10-21", until: "2007-01-11" },
      { name: "부총리 빌헬름 몰터러", from: "2007-01-11", until: "2008-12-02" },
      { name: "부총리 요제프 프뢸", from: "2008-12-02", until: "2011-04-21" },
      { name: "부총리 미하엘 슈핀델레거", from: "2011-04-21", until: "2014-09-01" },
      { name: "부총리 하인츠크리스티안 슈트라헤", from: "2017-12-18", until: "2019-05-22" },
      { name: "부총리 베르너 코글러", from: "2020-01-07", until: "2025-03-03" },
      { name: "부총리 안드레아스 바블러", from: "2025-03-03" },
    ],
  },
  Azerbaijan: {
    leader: [
      { name: "대통령 일함 알리예프", from: "2003-10-31" },
    ],
    headOfState: [
      { name: "(없음)" },
    ],
    deputy: [
      { name: "부통령 메흐리반 알리예바", from: "2017-02-21" },
    ],
  },
  Bahamas: {
    leader: [
      { name: "총리 페리 크리스티", from: "2002-05-03", until: "2007-05-04" },
      { name: "총리 휴버트 잉그러햄", from: "2007-05-04", until: "2012-05-08" },
      { name: "총리 페리 크리스티", from: "2012-05-08", until: "2017-05-11" },
      { name: "총리 휴버트 미니스", from: "2017-05-11", until: "2021-09-17" },
      { name: "총리 필립 데이비스", from: "2021-09-17" },
    ],
    headOfState: [
      { name: "여왕 엘리자베스 2세", until: "2022-09-08" },
      { name: "국왕 찰스 3세", from: "2022-09-08" },
    ],
  },
  Bahrain: {
    leader: [
      { name: "국왕 하마드 빈 이사 알할리파", from: "1999-03-06" },
    ],
    headOfState: [
      { name: "(없음)" },
    ],
    deputy: [
      { name: "총리 할리파 빈 살만 알할리파", until: "2020-11-11" },
      { name: "총리 살만 빈 하마드 알할리파", from: "2020-11-11" },
    ],
  },
  Bangladesh: {
    leader: [
      { name: "총리 칼레다 지아", from: "2001-10-10", until: "2006-10-29" },
      { name: "과도정부 수석고문 이아주딘 아메드", from: "2006-10-29", until: "2007-01-12" },
      { name: "과도정부 수석고문 파크루딘 아메드", from: "2007-01-12", until: "2009-01-06" },
      { name: "총리 셰이크 하시나", from: "2009-01-06", until: "2024-08-05" },
      { name: "최고고문 무함마드 유누스", from: "2024-08-08" },
    ],
    headOfState: [
      { name: "대통령 이아주딘 아메드", from: "2002-09-06", until: "2009-02-12" },
      { name: "대통령 질루르 라흐만", from: "2009-02-12", until: "2013-03-20" },
      { name: "대통령 압둘 하미드", from: "2013-04-24", until: "2023-04-24" },
      { name: "대통령 모하메드 샤하부딘", from: "2023-04-24" },
    ],
    deputy: [
      { name: "(없음)" },
    ],
  },
  Barbados: {
    leader: [
      { name: "총리 오언 아서", from: "1994-09-07", until: "2008-01-16" },
      { name: "총리 데이비드 톰프슨", from: "2008-01-16", until: "2010-10-23" },
      { name: "총리 프룬델 스튜어트", from: "2010-10-23", until: "2018-05-25" },
      { name: "총리 미아 모틀리", from: "2018-05-25" },
    ],
    headOfState: [
      { name: "여왕 엘리자베스 2세", until: "2021-11-30" },
      { name: "대통령 샌드라 메이슨", from: "2021-11-30" },
    ],
  },
  Belarus: {
    leader: [
      { name: "대통령 알렉산드르 루카셴코", from: "1994-07-20" },
    ],
    headOfState: [
      { name: "(없음)" },
    ],
    deputy: [
      { name: "총리 안드레이 코비야코프", from: "2014-12-27", until: "2018-08-18" },
      { name: "총리 세르게이 루마스", from: "2018-08-18", until: "2020-06-03" },
      { name: "총리 로만 골로브첸코", from: "2020-06-04", until: "2025-03-10" },
      { name: "총리 알렉산드르 투르친", from: "2025-03-10" },
    ],
  },
  Belgium: {
    leader: [
      { name: "총리 기 베르호프스타트", from: "1999-07-12", until: "2008-03-20" },
      { name: "총리 이브 르테름", from: "2008-03-20", until: "2008-12-30" },
      { name: "총리 헤르만 반 롬푀이", from: "2008-12-30", until: "2009-11-25" },
      { name: "총리 이브 르테름", from: "2009-11-25", until: "2011-12-06" },
      { name: "총리 엘리오 디 뤼포", from: "2011-12-06", until: "2014-10-11" },
      { name: "총리 샤를 미셸", from: "2014-10-11", until: "2019-10-27" },
      { name: "총리 소피 빌메스", from: "2019-10-27", until: "2020-10-01" },
      { name: "총리 알렉산더르 더크로", from: "2020-10-01", until: "2025-02-03" },
      { name: "총리 바르트 더베버르", from: "2025-02-03" },
    ],
    headOfState: [
      { name: "국왕 알베르 2세", from: "1993-08-09", until: "2013-07-21" },
      { name: "국왕 필리프", from: "2013-07-21" },
    ],
  },
  Belize: {
    leader: [
      { name: "총리 사이드 무사", from: "1998-08-28", until: "2008-02-08" },
      { name: "총리 딘 배로", from: "2008-02-08", until: "2020-11-12" },
      { name: "총리 조니 브리세뇨", from: "2020-11-12" },
    ],
    headOfState: [
      { name: "여왕 엘리자베스 2세", until: "2022-09-08" },
      { name: "국왕 찰스 3세", from: "2022-09-08" },
    ],
  },
  Benin: {
    leader: [
      { name: "대통령 마티외 케레쿠", from: "1996-04-04", until: "2006-04-06" },
      { name: "대통령 토마 보니 야이", from: "2006-04-06", until: "2016-04-06" },
      { name: "대통령 파트리스 탈롱", from: "2016-04-06" },
    ],
    headOfState: [
      { name: "(없음)" },
    ],
    deputy: [
      { name: "부통령 마리암 샤비 탈라타", from: "2021-05-23" },
    ],
  },
  Bhutan: {
    leader: [
      { name: "총리 지그메 틴레이", from: "2008-04-09", until: "2013-04-28" },
      { name: "총리 체링 톱게이", from: "2013-07-27", until: "2018-08-09" },
      { name: "총리 로타이 체링", from: "2018-11-07", until: "2023-11-01" },
      { name: "총리 체링 톱게이", from: "2024-01-28" },
    ],
    headOfState: [
      { name: "국왕 지그메 케사르 남기엘 왕추크", from: "2006-12-09" },
    ],
  },
  Bolivia: {
    leader: [
      { name: "대통령 에두아르도 로드리게스", from: "2005-06-09", until: "2006-01-22" },
      { name: "대통령 에보 모랄레스", from: "2006-01-22", until: "2019-11-10" },
      { name: "임시 대통령 자니네 아녜스", from: "2019-11-12", until: "2020-11-08" },
      { name: "대통령 루이스 아르세", from: "2020-11-08", until: "2025-11-08" },
      { name: "대통령 로드리고 파스", from: "2025-11-08" },
    ],
    headOfState: [
      { name: "(없음)" },
      { name: "대통령 에두아르도 로드리게스", from: "2005-06-09", until: "2006-01-22" },
    ],
    deputy: [
      { name: "부통령 알바로 가르시아 리네라", from: "2006-01-22", until: "2019-11-10" },
      { name: "부통령 다비드 초케우앙카", from: "2020-11-08", until: "2025-11-08" },
      { name: "부통령 에드만 라라", from: "2025-11-08" },
    ],
  },
  Botswana: {
    leader: [
      { name: "대통령 페스투스 모가에", from: "1998-04-01", until: "2008-04-01" },
      { name: "대통령 이언 카마", from: "2008-04-01", until: "2018-04-01" },
      { name: "대통령 모크위치 마시시", from: "2018-04-01", until: "2024-11-01" },
      { name: "대통령 두마 보코", from: "2024-11-01" },
    ],
    headOfState: [
      { name: "(없음)" },
    ],
    deputy: [
      { name: "부통령 모크위치 마시시", from: "2014-11-12", until: "2018-04-01" },
      { name: "부통령 슬럼버 초과네", from: "2018-04-04", until: "2024-11-01" },
      { name: "부통령 은다바 가올라테", from: "2024-11-01" },
    ],
  },
  Brazil: {
    leader: [
      { name: "대통령 루이스 이나시우 룰라 다 시우바", from: "2003-01-01", until: "2010-12-31" },
      { name: "대통령 지우마 호세프", from: "2011-01-01", until: "2016-08-31" },
      { name: "대통령 미셰우 테메르", from: "2016-08-31", until: "2019-01-01" },
      { name: "대통령 자이르 보우소나루", from: "2019-01-01", until: "2023-01-01" },
      { name: "대통령 루이스 이나시우 룰라 다 시우바", from: "2023-01-01" },
    ],
    headOfState: [
      { name: "(없음)" },
      { name: "대통령 루이스 이나시우 룰라 다 시우바", from: "2003-01-01", until: "2010-12-31" },
    ],
    deputy: [
      { name: "부통령 조제 알렝카르", from: "2003-01-01", until: "2010-12-31" },
      { name: "부통령 미셰우 테메르", from: "2011-01-01", until: "2016-08-31" },
      { name: "(없음)", from: "2016-08-31", until: "2018-12-31" },
      { name: "부통령 아미우통 모랑", from: "2019-01-01", until: "2023-01-01" },
      { name: "부통령 제라우두 아우키민", from: "2023-01-01" },
    ],
  },
  Brunei: {
    leader: [
      { name: "술탄 하사날 볼키아", from: "1967-10-05" },
    ],
    headOfState: [
      { name: "(없음)" },
    ],
    deputy: [
      { name: "왕세자 알무흐타디 빌라", from: "1998-08-10" },
    ],
  },
  Bulgaria: {
    leader: [
      { name: "총리 세르게이 스타니셰프", from: "2005-08-17", until: "2009-07-27" },
      { name: "총리 보이코 보리소프", from: "2009-07-27", until: "2013-03-13" },
      { name: "총리 마린 라이코프", from: "2013-03-13", until: "2013-05-29" },
      { name: "총리 플라멘 오레샤르스키", from: "2013-05-29", until: "2014-08-06" },
      { name: "총리 게오르기 블리즈나슈키", from: "2014-08-06", until: "2014-11-07" },
      { name: "총리 보이코 보리소프", from: "2014-11-07", until: "2017-01-27" },
      { name: "총리 보이코 보리소프", from: "2017-05-04", until: "2021-05-12" },
      { name: "총리 스테판 야네프", from: "2021-05-12", until: "2021-12-13" },
      { name: "총리 키릴 페트코프", from: "2021-12-13", until: "2022-08-02" },
      { name: "총리 갈랍 도네프", from: "2022-08-02", until: "2023-06-06" },
      { name: "총리 니콜라이 덴코프", from: "2023-06-06", until: "2024-04-09" },
      { name: "총리 디미터르 글라브체프", from: "2024-04-09", until: "2025-01-16" },
      { name: "총리 로센 젤랴즈코프", from: "2025-01-16" },
    ],
    headOfState: [
      { name: "대통령 게오르기 파르바노프", from: "2002-01-22", until: "2012-01-22" },
      { name: "대통령 로센 플레브넬리에프", from: "2012-01-22", until: "2017-01-22" },
      { name: "대통령 루멘 라데프", from: "2017-01-22" },
    ],
  },
  "Burkina Faso": {
    leader: [
      { name: "대통령 블레즈 콩파오레", from: "1987-10-15", until: "2014-10-31" },
      { name: "임시 대통령 미셸 카판도", from: "2014-11-18", until: "2015-12-29" },
      { name: "대통령 로크 마르크 크리스티앙 카보레", from: "2015-12-29", until: "2022-01-24" },
      { name: "임시 대통령 폴앙리 산다오고 다미바", from: "2022-01-24", until: "2022-09-30" },
      { name: "임시 대통령 이브라힘 트라오레", from: "2022-09-30" },
    ],
    headOfState: [
      { name: "(없음)" },
    ],
    deputy: [
      { name: "총리 폴 카바 티에바", from: "2016-01-01", until: "2019-01-01" },
      { name: "총리 크리스토프 다비레", from: "2019-01-01", until: "2021-12-01" },
      { name: "총리 알베르 우에드라오고", from: "2022-03-01", until: "2022-09-30" },
      { name: "총리 아폴리네르 요아킴 키엘렘 드 탕벨라", from: "2022-10-21", until: "2024-12-06" },
      { name: "총리 장 에마뉘엘 우에드라오고", from: "2024-12-07" },
    ],
  },
  Burundi: {
    leader: [
      { name: "대통령 피에르 은쿠룬지자", from: "2005-08-26", until: "2020-06-08" },
      { name: "대통령 에바리스트 은다이시미예", from: "2020-06-18" },
    ],
    headOfState: [
      { name: "(없음)" },
    ],
  },
  "Cabo Verde": {
    leader: [
      { name: "총리 조제 마리아 네베스", from: "2001-02-01", until: "2016-04-22" },
      { name: "총리 조제 울리세스 코레이아 이 실바", from: "2016-04-22" },
    ],
    headOfState: [
      { name: "대통령 페드루 피르스", from: "2001-03-22", until: "2011-09-09" },
      { name: "대통령 조르즈 카를루스 폰세카", from: "2011-09-09", until: "2021-11-09" },
      { name: "대통령 조제 마리아 네베스", from: "2021-11-09" },
    ],
  },
  Cambodia: {
    leader: [
      { name: "총리 훈센", from: "1985-01-14", until: "2023-08-22" },
      { name: "총리 훈마넷", from: "2023-08-22" },
    ],
    headOfState: [
      { name: "국왕 노로돔 시아모니", from: "2004-10-14" },
    ],
  },
  Cameroon: {
    leader: [
      { name: "대통령 폴 비야", from: "1982-11-06" },
    ],
    headOfState: [
      { name: "(없음)" },
    ],
    deputy: [
      { name: "총리 에프라임 이노니", from: "2004-12-08", until: "2009-06-30" },
      { name: "총리 필레몬 양", from: "2009-06-30", until: "2019-01-04" },
      { name: "총리 조제프 디온 응구테", from: "2019-01-04" },
    ],
  },
  Canada: {
    leader: [
      { name: "총리 폴 마틴", from: "2003-12-12", until: "2006-02-06" },
      { name: "총리 스티븐 하퍼", from: "2006-02-06", until: "2015-11-04" },
      { name: "총리 저스틴 트뤼도", from: "2015-11-04", until: "2025-03-14" },
      { name: "총리 마크 카니", from: "2025-03-14" },
    ],
    headOfState: [
      { name: "여왕 엘리자베스 2세", until: "2022-09-08" },
      { name: "국왕 찰스 3세", from: "2022-09-08" },
    ],
    deputy: [
      { name: "부총리 앤 매클렐런", from: "2003-12-12", until: "2006-02-06" },
      { name: "(없음)", from: "2006-02-06", until: "2019-11-20" },
      { name: "부총리 크리스티아 프리랜드", from: "2019-11-20", until: "2024-12-16" },
    ],
  },
  "Central African Republic": {
    leader: [
      { name: "대통령 프랑수아 보지제", from: "2003-03-15", until: "2013-03-24" },
      { name: "대통령 미셸 조토디아", from: "2013-03-24", until: "2014-01-10" },
      { name: "임시 대통령 카트린 삼바판자", from: "2014-01-23", until: "2016-03-30" },
      { name: "대통령 포스탱아르샹주 투아데라", from: "2016-03-30" },
    ],
    headOfState: [
      { name: "(없음)" },
    ],
    deputy: [
      { name: "총리 생플리스 사란지", from: "2016-04-02", until: "2019-02-25" },
      { name: "총리 피르맹 응그레바다", from: "2019-02-25", until: "2021-06-01" },
      { name: "총리 앙리마리 동드라", from: "2021-06-01", until: "2022-02-07" },
      { name: "총리 펠릭스 몰루아", from: "2022-02-07" },
    ],
  },
  Chad: {
    leader: [
      { name: "대통령 이드리스 데비", from: "1990-12-02", until: "2021-04-20" },
      { name: "대통령 마하마트 이드리스 데비", from: "2021-04-20" },
    ],
    headOfState: [
      { name: "(없음)" },
    ],
    deputy: [
      { name: "총리 알베르 파히미 파다케", from: "2016-02-01", until: "2018-05-01" },
      { name: "총리 알베르 파히미 파다케", from: "2021-04-26", until: "2022-10-12" },
      { name: "총리 살레 케브자보", from: "2022-10-12", until: "2024-01-01" },
      { name: "총리 쉭세 마스라", from: "2024-01-01", until: "2024-05-23" },
      { name: "총리 알라마예 할리나", from: "2024-05-23" },
    ],
  },
  Chile: {
    leader: [
      { name: "대통령 리카르도 라고스", from: "2000-03-11", until: "2006-03-11" },
      { name: "대통령 미첼 바첼레트", from: "2006-03-11", until: "2010-03-11" },
      { name: "대통령 세바스티안 피녜라", from: "2010-03-11", until: "2014-03-11" },
      { name: "대통령 미첼 바첼레트", from: "2014-03-11", until: "2018-03-11" },
      { name: "대통령 세바스티안 피녜라", from: "2018-03-11", until: "2022-03-11" },
      { name: "대통령 가브리엘 보리치", from: "2022-03-11", until: "2026-03-11" },
      { name: "대통령 호세 안토니오 카스트", from: "2026-03-11" },
    ],
    headOfState: [
      { name: "(없음)" },
      { name: "대통령 리카르도 라고스", from: "2000-03-11", until: "2006-03-11" },
      { name: "대통령 미첼 바첼레트", from: "2006-03-11", until: "2010-03-11" },
      { name: "대통령 세바스티안 피녜라", from: "2010-03-11", until: "2014-03-11" },
    ],
    deputy: [
      { name: "(없음)" },
      { name: "(없음)" },
    ],
  },
  China: {
    leader: [
      { name: "총서기 후진타오", from: "2002-11-15", until: "2012-11-15" },
      { name: "국가주석 시진핑", from: "2013-03-14" },
    ],
    headOfState: [
      { name: "(없음)" },
      { name: "국가주석 후진타오", from: "2003-03-15", until: "2013-03-14" },
    ],
    deputy: [
      { name: "국무원 총리 원자바오", from: "2003-03-16", until: "2013-03-15" },
      { name: "국무원 총리 리커창", from: "2013-03-15", until: "2023-03-11" },
      { name: "국무원 총리 리창", from: "2023-03-11" },
    ],
  },
  Colombia: {
    leader: [
      { name: "대통령 알바로 우리베", from: "2002-08-07", until: "2010-08-07" },
      { name: "대통령 후안 마누엘 산토스", from: "2010-08-07", until: "2018-08-07" },
      { name: "대통령 이반 두케", from: "2018-08-07", until: "2022-08-07" },
      { name: "대통령 구스타보 페트로", from: "2022-08-07" },
    ],
    headOfState: [
      { name: "(없음)" },
      { name: "대통령 알바로 우리베", from: "2002-08-07", until: "2010-08-07" },
    ],
    deputy: [
      { name: "부통령 프란시스코 산토스 칼데론", from: "2002-08-07", until: "2010-08-07" },
      { name: "부통령 앙헬리노 가르손", from: "2010-08-07", until: "2014-08-07" },
      { name: "부통령 마르타 루시아 라미레스", from: "2018-08-07", until: "2022-08-07" },
      { name: "부통령 프란시아 마르케스", from: "2022-08-07" },
    ],
  },
  Comoros: {
    leader: [
      { name: "대통령 아잘리 아수마니", from: "2002-05-26", until: "2006-05-26" },
      { name: "대통령 아메드 압둘라 삼비", from: "2006-05-26", until: "2011-05-26" },
      { name: "대통령 이킬릴루 두아닌", from: "2011-05-26", until: "2016-05-26" },
      { name: "대통령 아잘리 아수마니", from: "2016-05-26" },
    ],
    headOfState: [
      { name: "(없음)" },
    ],
  },
  "Costa Rica": {
    leader: [
      { name: "대통령 아벨 파체코", from: "2002-05-08", until: "2006-05-08" },
      { name: "대통령 오스카르 아리아스", from: "2006-05-08", until: "2010-05-08" },
      { name: "대통령 라우라 친치야", from: "2010-05-08", until: "2014-05-08" },
      { name: "대통령 루이스 기예르모 솔리스", from: "2014-05-08", until: "2018-05-08" },
      { name: "대통령 카를로스 알바라도", from: "2018-05-08", until: "2022-05-08" },
      { name: "대통령 로드리고 차베스", from: "2022-05-08" },
    ],
    headOfState: [
      { name: "(없음)" },
      { name: "대통령 아벨 파체코", from: "2002-05-08", until: "2006-05-08" },
      { name: "대통령 오스카르 아리아스", from: "2006-05-08", until: "2010-05-08" },
      { name: "대통령 라우라 친치야", from: "2010-05-08", until: "2014-05-08" },
    ],
  },
  "Cote d'Ivoire": {
    leader: [
      { name: "대통령 로랑 그바그보", from: "2000-10-26", until: "2011-04-11" },
      { name: "대통령 알라산 와타라", from: "2011-05-06" },
    ],
    headOfState: [
      { name: "(없음)" },
    ],
    deputy: [
      { name: "총리 샤를 코낭 바니", from: "2005-12-07", until: "2007-04-04" },
      { name: "총리 기욤 소로", from: "2007-04-04", until: "2012-03-08" },
      { name: "부통령 다니엘 카블란 던컨", from: "2017-01-16", until: "2020-07-13" },
      { name: "부통령 티에모코 메일리에 코네", from: "2022-04-19" },
    ],
  },
  Croatia: {
    leader: [
      { name: "총리 이보 사나데르", from: "2003-12-23", until: "2009-07-06" },
      { name: "총리 야드란카 코소르", from: "2009-07-06", until: "2011-12-23" },
      { name: "총리 조란 밀라노비치", from: "2011-12-23", until: "2016-01-22" },
      { name: "총리 티호미르 오레슈코비치", from: "2016-01-22", until: "2016-10-19" },
      { name: "총리 안드레이 플렌코비치", from: "2016-10-19" },
    ],
    headOfState: [
      { name: "대통령 스티페 메시치", from: "2000-02-18", until: "2010-02-18" },
      { name: "대통령 이보 요시포비치", from: "2010-02-18", until: "2015-02-18" },
      { name: "대통령 콜린다 그라바르키타로비치", from: "2015-02-19", until: "2020-02-18" },
      { name: "대통령 조란 밀라노비치", from: "2020-02-18" },
    ],
  },
  Cuba: {
    leader: [
      { name: "국가평의회 의장 피델 카스트로", from: "1976-12-02", until: "2008-02-24" },
      { name: "국가평의회 의장 라울 카스트로", from: "2008-02-24", until: "2018-04-19" },
      { name: "대통령 미겔 디아스카넬", from: "2018-04-19" },
    ],
    headOfState: [
      { name: "(없음)" },
      { name: "국가평의회 의장 피델 카스트로", from: "1976-12-02", until: "2008-02-24" },
    ],
    deputy: [
      { name: "제1부통령 미겔 디아스카넬", from: "2013-02-24", until: "2018-04-19" },
      { name: "부통령 살바도르 발데스 메사", from: "2018-04-19" },
    ],
  },
  Cyprus: {
    leader: [
      { name: "대통령 타소스 파파도풀로스", from: "2003-02-28", until: "2008-02-27" },
      { name: "대통령 디미트리스 크리스토피아스", from: "2008-02-28", until: "2013-02-27" },
      { name: "대통령 니코스 아나스타시아디스", from: "2013-02-28", until: "2023-02-28" },
      { name: "대통령 니코스 크리스토둘리디스", from: "2023-02-28" },
    ],
    headOfState: [
      { name: "(없음)" },
    ],
    deputy: [
      { name: "(없음)" },
    ],
  },
  Czechia: {
    leader: [
      { name: "총리 이르지 파로우베크", from: "2005-04-25", until: "2006-09-04" },
      { name: "총리 미레크 토폴라네크", from: "2006-09-04", until: "2009-05-08" },
      { name: "총리 얀 피셔", from: "2009-05-08", until: "2010-06-28" },
      { name: "총리 페트르 네차스", from: "2010-06-28", until: "2013-06-25" },
      { name: "총리 이르지 루스노크", from: "2013-06-25", until: "2014-01-29" },
      { name: "총리 보후슬라프 소보트카", from: "2014-01-29", until: "2017-12-13" },
      { name: "총리 안드레이 바비시", from: "2017-12-13", until: "2021-11-28" },
      { name: "총리 페트르 피알라", from: "2021-11-28", until: "2025-12-01" },
      { name: "총리 안드레이 바비시", from: "2025-12-01" },
    ],
    headOfState: [
      { name: "대통령 바츨라프 클라우스", from: "2003-03-07", until: "2013-03-07" },
      { name: "대통령 밀로시 제만", from: "2013-03-08", until: "2023-03-08" },
      { name: "대통령 페트르 파벨", from: "2023-03-09" },
    ],
  },
  "Democratic Republic of the Congo": {
    leader: [
      { name: "대통령 조제프 카빌라", from: "2001-01-26", until: "2019-01-24" },
      { name: "대통령 펠릭스 치세케디", from: "2019-01-24" },
    ],
    headOfState: [
      { name: "(없음)" },
    ],
    deputy: [
      { name: "총리 앙투안 기젠가", from: "2006-12-30", until: "2008-10-10" },
      { name: "총리 아돌프 무지토", from: "2008-10-10", until: "2012-03-06" },
      { name: "총리 오귀스탱 마타타 포뇨", from: "2012-04-18", until: "2012-05-01" },
      { name: "총리 오귀스탱 마타타 포뇨", from: "2012-05-01", until: "2016-11-14" },
      { name: "총리 사미 바디방가", from: "2016-12-01", until: "2017-05-18" },
      { name: "총리 브뤼노 치발라", from: "2017-05-18", until: "2019-09-01" },
      { name: "총리 실베스트르 일룽가", from: "2019-09-01", until: "2021-02-15" },
      { name: "총리 장미셸 사마 루콘데", from: "2021-02-15", until: "2024-06-01" },
      { name: "총리 쥐디트 수민와", from: "2024-06-01" },
    ],
  },
  Denmark: {
    leader: [
      { name: "총리 아네르스 포그 라스무센", from: "2001-11-27", until: "2009-04-05" },
      { name: "총리 라르스 뢰케 라스무센", from: "2009-04-05", until: "2011-10-03" },
      { name: "총리 헬레 토르닝슈미트", from: "2011-10-03", until: "2015-06-28" },
      { name: "총리 라르스 뢰케 라스무센", from: "2015-06-28", until: "2019-06-27" },
      { name: "총리 메테 프레데릭센", from: "2019-06-27" },
    ],
    headOfState: [
      { name: "여왕 마르그레테 2세", until: "2024-01-14" },
      { name: "국왕 프레데리크 10세", from: "2024-01-14" },
    ],
  },
  Djibouti: {
    leader: [
      { name: "대통령 이스마일 오마르 겔레", from: "1999-05-08" },
    ],
    headOfState: [
      { name: "(없음)" },
    ],
    deputy: [
      { name: "총리 압둘카데르 카밀 모하메드", from: "2013-04-01" },
    ],
  },
  Dominica: {
    leader: [
      { name: "총리 루스벨트 스케릿", from: "2004-01-08" },
    ],
    headOfState: [
      { name: "대통령 찰스 사바린", from: "2013-10-02", until: "2023-12-02" },
      { name: "대통령 실바니 버턴", from: "2023-12-02" },
    ],
  },
  "Dominican Republic": {
    leader: [
      { name: "대통령 레오넬 페르난데스", from: "2004-08-16", until: "2012-08-16" },
      { name: "대통령 다닐로 메디나", from: "2012-08-16", until: "2020-08-16" },
      { name: "대통령 루이스 아비나데르", from: "2020-08-16" },
    ],
    headOfState: [
      { name: "(없음)" },
      { name: "대통령 레오넬 페르난데스", from: "2004-08-16", until: "2012-08-16" },
    ],
    deputy: [
      { name: "부통령 라파엘 알부르케르케", from: "2004-08-16", until: "2012-08-16" },
      { name: "부통령 마르가리타 세데뇨", from: "2012-08-16", until: "2020-08-16" },
      { name: "부통령 라켈 페냐", from: "2020-08-16" },
    ],
  },
  Ecuador: {
    leader: [
      { name: "대통령 알프레도 팔라시오", from: "2005-04-20", until: "2007-01-15" },
      { name: "대통령 라파엘 코레아", from: "2007-01-15", until: "2017-05-24" },
      { name: "대통령 레닌 모레노", from: "2017-05-24", until: "2021-05-24" },
      { name: "대통령 기예르모 라소", from: "2021-05-24", until: "2023-11-23" },
      { name: "대통령 다니엘 노보아", from: "2023-11-23" },
    ],
    headOfState: [
      { name: "(없음)" },
      { name: "대통령 알프레도 팔라시오", from: "2005-04-20", until: "2007-01-15" },
    ],
    deputy: [
      { name: "부통령 레닌 모레노", from: "2007-01-15", until: "2013-05-24" },
    ],
  },
  Egypt: {
    leader: [
      { name: "대통령 호스니 무바라크", from: "1981-10-14", until: "2011-02-11" },
      { name: "군최고위원회 의장 무함마드 후세인 탄타위", from: "2011-02-11", until: "2012-06-30" },
      { name: "대통령 무함마드 무르시", from: "2012-06-30", until: "2013-07-03" },
      { name: "임시대통령 아들리 만수르", from: "2013-07-04", until: "2014-06-08" },
      { name: "대통령 압델 파타 엘시시", from: "2014-06-08" },
    ],
    headOfState: [
      { name: "(없음)" },
    ],
    deputy: [
      { name: "총리 셰리프 이스마일", from: "2015-09-19", until: "2018-06-14" },
      { name: "총리 무스타파 마드불리", from: "2018-06-14" },
    ],
  },
  "El Salvador": {
    leader: [
      { name: "대통령 안토니오 사카", from: "2004-06-01", until: "2009-06-01" },
      { name: "대통령 마우리시오 푸네스", from: "2009-06-01", until: "2014-06-01" },
      { name: "대통령 살바도르 산체스 세렌", from: "2014-06-01", until: "2019-06-01" },
      { name: "대통령 나이브 부켈레", from: "2019-06-01" },
    ],
    headOfState: [
      { name: "(없음)" },
      { name: "대통령 안토니오 사카", from: "2004-06-01", until: "2009-06-01" },
      { name: "대통령 마우리시오 푸네스", from: "2009-06-01", until: "2014-06-01" },
    ],
    deputy: [
      { name: "부통령 오스카르 오르티스", from: "2014-06-01", until: "2019-06-01" },
      { name: "부통령 펠릭스 우요아", from: "2019-06-01" },
    ],
  },
  "Equatorial Guinea": {
    leader: [
      { name: "대통령 테오도로 오비앙 응게마 음바소고", from: "1979-08-03" },
    ],
    headOfState: [
      { name: "(없음)" },
    ],
    deputy: [
      { name: "부통령 테오도로 응게마 오비앙 망게", from: "2016-06-01" },
    ],
  },
  Eritrea: {
    leader: [
      { name: "대통령 이사이아스 아페웨르키", from: "1993-05-24" },
    ],
    headOfState: [
      { name: "(없음)" },
    ],
    deputy: [
      { name: "(없음)" },
    ],
  },
  Estonia: {
    leader: [
      { name: "총리 안드루스 안시프", from: "2005-04-13", until: "2014-03-26" },
      { name: "총리 타비 로이바스", from: "2014-03-26", until: "2016-11-23" },
      { name: "총리 위리 라타스", from: "2016-11-23", until: "2021-01-26" },
      { name: "총리 카야 칼라스", from: "2021-01-26", until: "2024-07-23" },
      { name: "총리 크리스텐 미할", from: "2024-07-23" },
    ],
    headOfState: [
      { name: "대통령 아르놀드 뤼텔", from: "2001-10-08", until: "2006-10-09" },
      { name: "대통령 토마스 헨드리크 일베스", from: "2006-10-09", until: "2016-10-10" },
      { name: "대통령 케르스티 칼률라이드", from: "2016-10-10", until: "2021-10-11" },
      { name: "대통령 알라르 카리스", from: "2021-10-11" },
    ],
    deputy: [
      { name: "(없음)" },
    ],
  },
  Ethiopia: {
    leader: [
      { name: "총리 멜레스 제나위", from: "1995-08-23", until: "2012-08-20" },
      { name: "총리 하일레마리암 데살렌", from: "2012-09-21", until: "2018-04-02" },
      { name: "총리 아비 아흐메드", from: "2018-04-02" },
    ],
    headOfState: [
      { name: "대통령 기르마 월데기오르기스", from: "2001-10-08", until: "2013-10-07" },
      { name: "대통령 물라투 테쇼메", from: "2013-10-07", until: "2018-10-25" },
      { name: "대통령 사흘레워크 즈웨데", from: "2018-10-25", until: "2024-10-07" },
      { name: "대통령 타예 아츠케 셀라시에", from: "2024-10-07" },
    ],
    deputy: [
      { name: "부총리 데메케 메코넨", from: "2012-11-29", until: "2024-01-01" },
      { name: "부총리 테메스겐 티루네", from: "2024-01-01" },
    ],
  },
  Fiji: {
    leader: [
      { name: "총리 라이세니아 카라세", from: "2001-09-10", until: "2006-12-05" },
      { name: "총리 프랭크 바이니마라마", from: "2007-01-05", until: "2022-12-24" },
      { name: "총리 시티베니 라부카", from: "2022-12-24" },
    ],
    headOfState: [
      { name: "대통령 조세파 일로일로", from: "2000-07-13", until: "2009-07-30" },
      { name: "대통령 에펠리 나일라티카우", from: "2009-11-05", until: "2015-11-12" },
      { name: "대통령 조지 콘로테", from: "2015-11-12", until: "2021-11-12" },
      { name: "대통령 윌리아메 카토니베레", from: "2021-11-12", until: "2024-11-12" },
    ],
  },
  Finland: {
    leader: [
      { name: "총리 마티 반하넨", from: "2003-06-24", until: "2010-06-22" },
      { name: "총리 마리 키비니에미", from: "2010-06-22", until: "2011-06-22" },
      { name: "총리 위르키 카타이넨", from: "2011-06-22", until: "2014-06-24" },
      { name: "총리 알렉산더 스투브", from: "2014-06-24", until: "2015-05-29" },
      { name: "총리 유하 시필래", from: "2015-05-29", until: "2019-06-06" },
      { name: "총리 안티 린네", from: "2019-06-06", until: "2019-12-10" },
      { name: "총리 산나 마린", from: "2019-12-10", until: "2023-06-20" },
      { name: "총리 페테리 오르포", from: "2023-06-20" },
    ],
    headOfState: [
      { name: "대통령 타르야 할로넨", from: "2000-03-01", until: "2012-03-01" },
      { name: "대통령 사울리 니니스퇴", from: "2012-03-01", until: "2024-03-01" },
      { name: "대통령 알렉산데르 스투브", from: "2024-03-01" },
    ],
  },
  France: {
    leader: [
      { name: "대통령 자크 시라크", from: "1995-05-17", until: "2007-05-16" },
      { name: "대통령 니콜라 사르코지", from: "2007-05-16", until: "2012-05-15" },
      { name: "대통령 프랑수아 올랑드", from: "2012-05-15", until: "2017-05-14" },
      { name: "대통령 에마뉘엘 마크롱", from: "2017-05-14" },
    ],
    headOfState: [
      { name: "(없음)" },
      { name: "대통령 자크 시라크", from: "1995-05-17", until: "2007-05-16" },
      { name: "대통령 니콜라 사르코지", from: "2007-05-16", until: "2012-05-15" },
    ],
    deputy: [
      { name: "총리 도미니크 드 빌팽", from: "2005-05-31", until: "2007-05-17" },
      { name: "총리 프랑수아 피용", from: "2007-05-17", until: "2012-05-15" },
      { name: "총리 장마르크 에로", from: "2012-05-15", until: "2014-03-31" },
      { name: "총리 마뉘엘 발스", from: "2014-03-31", until: "2016-12-06" },
      { name: "총리 베르나르 카즈뇌브", from: "2016-12-06", until: "2017-05-15" },
      { name: "총리 에두아르 필리프", from: "2017-05-15", until: "2020-07-03" },
      { name: "총리 장 카스텍스", from: "2020-07-03", until: "2022-05-16" },
      { name: "총리 엘리자베트 보른", from: "2022-05-16", until: "2024-01-09" },
      { name: "총리 가브리엘 아탈", from: "2024-01-09", until: "2024-09-05" },
      { name: "총리 미셸 바르니에", from: "2024-09-05", until: "2024-12-13" },
      { name: "총리 프랑수아 바이루", from: "2024-12-13", until: "2025-09-09" },
      { name: "총리 세바스티앵 르코르뉘", from: "2025-09-09" },
    ],
  },
  Gabon: {
    leader: [
      { name: "대통령 오마르 봉고", from: "1967-12-02", until: "2009-06-08" },
      { name: "임시 대통령 로즈 프랑신 로곰베", from: "2009-06-10", until: "2009-10-16" },
      { name: "대통령 알리 봉고 온딤바", from: "2009-10-16", until: "2023-08-30" },
      { name: "대통령 브리스 올리기 응게마", from: "2023-08-30" },
    ],
    headOfState: [
      { name: "(없음)" },
    ],
    deputy: [
      { name: "총리 다니엘 오나 온도", from: "2014-01-01", until: "2016-09-28" },
      { name: "총리 에마뉘엘 이소제 응곤데", from: "2016-09-28", until: "2019-01-01" },
      { name: "총리 쥘리앵 응코게 베칼레", from: "2019-01-01", until: "2020-07-16" },
      { name: "총리 로즈 크리스티안 오수카 라폰다", from: "2020-07-16", until: "2023-01-09" },
      { name: "총리 알랭 클로드 빌리 비 은제", from: "2023-01-09", until: "2023-08-30" },
      { name: "총리 레몽 은동 시마", from: "2023-09-07", until: "2025-05-03" },
    ],
  },
  Gambia: {
    leader: [
      { name: "대통령 야히아 자메", from: "1994-07-22", until: "2017-01-19" },
      { name: "대통령 아다마 배로", from: "2017-01-19" },
    ],
    headOfState: [
      { name: "(없음)" },
    ],
  },
  Georgia: {
    leader: [
      { name: "총리 주라브 노가이델리", from: "2005-02-17", until: "2007-11-22" },
      { name: "총리 라도 구르게니제", from: "2007-11-22", until: "2008-11-01" },
      { name: "총리 그리골 므갈로블리슈빌리", from: "2008-11-01", until: "2009-02-06" },
      { name: "총리 니카 길라우리", from: "2009-02-06", until: "2012-07-04" },
      { name: "총리 바노 메라비슈빌리", from: "2012-07-04", until: "2012-10-25" },
      { name: "총리 비지나 이바니슈빌리", from: "2012-10-25", until: "2013-11-20" },
      { name: "총리 이라클리 가리바슈빌리", from: "2013-11-20", until: "2015-12-30" },
      { name: "총리 기오르기 크비리카슈빌리", from: "2015-12-30", until: "2018-06-13" },
      { name: "총리 마무카 바흐타제", from: "2018-06-20", until: "2019-09-02" },
      { name: "총리 기오르기 가하리아", from: "2019-09-08", until: "2021-02-18" },
      { name: "총리 이라클리 가리바슈빌리", from: "2021-02-22", until: "2024-02-08" },
      { name: "총리 이라클리 코바히제", from: "2024-02-08" },
    ],
    headOfState: [
      { name: "대통령 미헤일 사카슈빌리", from: "2004-01-25", until: "2007-11-25" },
      { name: "대통령 권한대행 니노 부르자나제", from: "2007-11-25", until: "2008-01-20" },
      { name: "대통령 미헤일 사카슈빌리", from: "2008-01-20", until: "2013-11-17" },
      { name: "대통령 기오르기 마르그벨라슈빌리", from: "2013-11-17", until: "2018-12-16" },
      { name: "대통령 살로메 주라비슈빌리", from: "2018-12-16", until: "2024-12-29" },
      { name: "대통령 미헤일 카벨라슈빌리", from: "2024-12-29" },
    ],
  },
  Germany: {
    leader: [
      { name: "총리 앙겔라 메르켈", from: "2005-11-22", until: "2021-12-08" },
      { name: "총리 올라프 숄츠", from: "2021-12-08", until: "2025-05-06" },
      { name: "총리 프리드리히 메르츠", from: "2025-05-06" },
    ],
    headOfState: [
      { name: "대통령 호르스트 쾰러", from: "2004-07-01", until: "2010-05-31" },
      { name: "대통령 크리스티안 불프", from: "2010-06-30", until: "2012-02-17" },
      { name: "대통령 요아힘 가우크", from: "2012-03-18", until: "2017-03-18" },
      { name: "대통령 프랑크발터 슈타인마이어", from: "2017-03-19" },
    ],
    deputy: [
      { name: "부총리 프란츠 뮌테페링", from: "2005-11-22", until: "2007-11-21" },
      { name: "부총리 프랑크발터 슈타인마이어", from: "2007-11-21", until: "2009-10-27" },
      { name: "부총리 기도 베스터벨레", from: "2009-10-28", until: "2011-05-16" },
      { name: "부총리 필리프 뢰슬러", from: "2011-05-16", until: "2013-12-17" },
      { name: "부총리 지크마어 가브리엘", from: "2013-12-17", until: "2018-03-14" },
      { name: "부총리 올라프 숄츠", from: "2018-03-14", until: "2021-12-08" },
      { name: "부총리 로베르트 하베크", from: "2021-12-08", until: "2025-05-06" },
      { name: "부총리 라르스 클링바일", from: "2025-05-06" },
    ],
  },
  Ghana: {
    leader: [
      { name: "대통령 존 쿠푸오르", from: "2001-01-07", until: "2009-01-07" },
      { name: "대통령 존 아타 밀스", from: "2009-01-07", until: "2012-07-24" },
      { name: "대통령 존 드라마니 마하마", from: "2012-07-24", until: "2017-01-07" },
      { name: "대통령 나나 아쿠포아도", from: "2017-01-07", until: "2025-01-07" },
      { name: "대통령 존 드라마니 마하마", from: "2025-01-07" },
    ],
    headOfState: [
      { name: "(없음)" },
    ],
    deputy: [
      { name: "부통령 알리우 마하마", from: "2001-01-07", until: "2009-01-07" },
      { name: "부통령 존 드라마니 마하마", from: "2009-01-07", until: "2012-07-24" },
      { name: "부통령 콰시 아미사아서", from: "2012-08-06", until: "2017-01-07" },
      { name: "부통령 마하무두 바우미아", from: "2017-01-07", until: "2025-01-07" },
      { name: "부통령 제인 나나 오포쿠아제망", from: "2025-01-07" },
    ],
  },
  Greece: {
    leader: [
      { name: "총리 코스타스 카라만리스", from: "2004-03-10", until: "2009-10-06" },
      { name: "총리 게오르기오스 파판드레우", from: "2009-10-06", until: "2011-11-11" },
      { name: "총리 루카스 파파데모스", from: "2011-11-11", until: "2012-05-16" },
      { name: "총리 파나기오티스 피크라메노스", from: "2012-05-16", until: "2012-06-20" },
      { name: "총리 안토니스 사마라스", from: "2012-06-20", until: "2015-01-26" },
      { name: "총리 알렉시스 치프라스", from: "2015-01-26", until: "2015-08-27" },
      { name: "총리 바실리키 타누", from: "2015-08-27", until: "2015-09-21" },
      { name: "총리 알렉시스 치프라스", from: "2015-09-21", until: "2019-07-08" },
      { name: "총리 키리아코스 미초타키스", from: "2019-07-08" },
    ],
    headOfState: [
      { name: "대통령 카롤로스 파풀리아스", from: "2005-03-12", until: "2015-03-13" },
      { name: "대통령 프로코피스 파블로풀로스", from: "2015-03-13", until: "2020-03-13" },
      { name: "대통령 카테리나 사켈라로풀루", from: "2020-03-13", until: "2025-03-13" },
      { name: "대통령 콘스탄티노스 타술라스", from: "2025-03-13" },
    ],
  },
  Grenada: {
    leader: [
      { name: "총리 키스 미첼", from: "1995-06-22", until: "2008-07-09" },
      { name: "총리 틸먼 토머스", from: "2008-07-09", until: "2013-02-20" },
      { name: "총리 키스 미첼", from: "2013-02-20", until: "2022-06-24" },
      { name: "총리 디컨 미첼", from: "2022-06-24" },
    ],
    headOfState: [
      { name: "여왕 엘리자베스 2세", until: "2022-09-08" },
      { name: "국왕 찰스 3세", from: "2022-09-08" },
    ],
  },
  Guatemala: {
    leader: [
      { name: "대통령 오스카르 베르헤르", from: "2004-01-14", until: "2008-01-14" },
      { name: "대통령 알바로 콜롬", from: "2008-01-14", until: "2012-01-14" },
      { name: "대통령 오토 페레스 몰리나", from: "2012-01-14", until: "2015-09-03" },
      { name: "대통령 알레한드로 말도나도", from: "2015-09-03", until: "2016-01-14" },
      { name: "대통령 지미 모랄레스", from: "2016-01-14", until: "2020-01-14" },
      { name: "대통령 알레한드로 잠마테이", from: "2020-01-14", until: "2024-01-15" },
      { name: "대통령 베르나르도 아레발로", from: "2024-01-15" },
    ],
    headOfState: [
      { name: "(없음)" },
      { name: "대통령 오스카르 베르헤르", from: "2004-01-14", until: "2008-01-14" },
      { name: "대통령 알바로 콜롬", from: "2008-01-14", until: "2012-01-14" },
      { name: "대통령 오토 페레스 몰리나", from: "2012-01-14", until: "2015-09-03" },
      { name: "대통령 알레한드로 말도나도", from: "2015-09-03", until: "2016-01-14" },
    ],
    deputy: [
      { name: "부통령 하페트 카브레라", from: "2016-01-14", until: "2020-01-14" },
      { name: "부통령 기예르모 카스티요", from: "2020-01-14", until: "2024-01-15" },
      { name: "부통령 카린 에레라", from: "2024-01-15" },
    ],
  },
  Guinea: {
    leader: [
      { name: "대통령 란사나 콩테", from: "1984-04-03", until: "2008-12-22" },
      { name: "군정 지도자 무사 다디스 카마라", from: "2008-12-24", until: "2009-12-03" },
      { name: "임시 대통령 세쿠바 코나테", from: "2009-12-03", until: "2010-12-21" },
      { name: "대통령 알파 콩데", from: "2010-12-21", until: "2021-09-05" },
      { name: "임시 대통령 마마디 둠부야", from: "2021-09-05" },
    ],
    headOfState: [
      { name: "(없음)" },
    ],
    deputy: [
      { name: "총리 마마디 율라", from: "2015-12-26", until: "2018-05-21" },
      { name: "총리 이브라히마 카소리 포파나", from: "2018-05-21", until: "2021-09-05" },
      { name: "총리 모하메드 베아보기", from: "2021-10-06", until: "2022-07-01" },
      { name: "총리 베르나르 구무", from: "2022-07-01", until: "2024-02-27" },
      { name: "총리 바 우리", from: "2024-02-27" },
    ],
  },
  "Guinea-Bissau": {
    leader: [
      { name: "대통령 주앙 베르나르두 비에이라", from: "2005-10-01", until: "2009-03-02" },
      { name: "대통령 말람 바카이 사냐", from: "2009-09-08", until: "2012-01-09" },
      { name: "대통령 조제 마리우 바스", from: "2014-06-23", until: "2020-02-27" },
      { name: "대통령 우마루 시소쿠 엠발로", from: "2020-02-27", until: "2025-11-26" },
    ],
    headOfState: [
      { name: "(없음)" },
    ],
  },
  Guyana: {
    leader: [
      { name: "대통령 바랏 자그데오", from: "1999-08-11", until: "2011-12-03" },
      { name: "대통령 도널드 라모타르", from: "2011-12-03", until: "2015-05-16" },
      { name: "대통령 데이비드 그레인저", from: "2015-05-16", until: "2020-08-02" },
      { name: "대통령 이르판 알리", from: "2020-08-02" },
    ],
    headOfState: [
      { name: "(없음)" },
      { name: "대통령 바랏 자그데오", from: "1999-08-11", until: "2011-12-03" },
      { name: "대통령 도널드 라모타르", from: "2011-12-03", until: "2015-05-16" },
    ],
    deputy: [
      { name: "총리 모지스 나가무투", from: "2015-05-01", until: "2020-08-02" },
      { name: "총리 마크 필립스", from: "2020-08-02" },
    ],
  },
  Haiti: {
    leader: [
      { name: "임시 대통령 보니파스 알렉상드르", from: "2004-02-29", until: "2006-05-14" },
      { name: "대통령 르네 프레발", from: "2006-05-14", until: "2011-05-14" },
      { name: "대통령 미셸 마르텔리", from: "2011-05-14", until: "2016-02-07" },
      { name: "임시 대통령 조슬레름 프리베르", from: "2016-02-14", until: "2017-02-07" },
      { name: "대통령 조브넬 모이즈", from: "2017-02-07", until: "2021-07-07" },
      { name: "총리 아리엘 앙리", from: "2021-07-20", until: "2024-04-24" },
    ],
    headOfState: [
      { name: "(없음)" },
      { name: "임시 대통령 보니파스 알렉상드르", from: "2004-02-29", until: "2006-05-14" },
      { name: "대통령 르네 프레발", from: "2006-05-14", until: "2011-05-14" },
      { name: "대통령 미셸 마르텔리", from: "2011-05-14", until: "2016-02-07" },
    ],
  },
  Honduras: {
    leader: [
      { name: "대통령 리카르도 마두로", from: "2002-01-27", until: "2006-01-27" },
      { name: "대통령 마누엘 셀라야", from: "2006-01-27", until: "2009-06-28" },
      { name: "임시 대통령 로베르토 미첼레티", from: "2009-06-28", until: "2010-01-27" },
      { name: "대통령 포르피리오 로보", from: "2010-01-27", until: "2014-01-27" },
      { name: "대통령 후안 오를란도 에르난데스", from: "2014-01-27", until: "2022-01-27" },
      { name: "대통령 시오마라 카스트로", from: "2022-01-27", until: "2026-01-27" },
    ],
    headOfState: [
      { name: "(없음)" },
      { name: "대통령 리카르도 마두로", from: "2002-01-27", until: "2006-01-27" },
      { name: "대통령 마누엘 셀라야", from: "2006-01-27", until: "2009-06-28" },
      { name: "임시 대통령 로베르토 미첼레티", from: "2009-06-28", until: "2010-01-27" },
      { name: "대통령 포르피리오 로보", from: "2010-01-27", until: "2014-01-27" },
    ],
  },
  Hungary: {
    leader: [
      { name: "총리 페렌츠 주르차니", from: "2004-09-29", until: "2009-04-14" },
      { name: "총리 고르돈 버이너이", from: "2009-04-14", until: "2010-05-29" },
      { name: "총리 오르반 빅토르", from: "2010-05-29" },
    ],
    headOfState: [
      { name: "대통령 라슬로 쇼욤", from: "2005-08-05", until: "2010-08-06" },
      { name: "대통령 팔 슈미트", from: "2010-08-06", until: "2012-04-02" },
      { name: "대통령 권한대행 라슬로 쾨베르", from: "2012-04-02", until: "2012-05-10" },
      { name: "대통령 아데르 야노시", from: "2012-05-10", until: "2022-05-10" },
      { name: "대통령 노바크 커털린", from: "2022-05-10", until: "2024-02-26" },
      { name: "대통령 슈요크 터마시", from: "2024-03-05" },
    ],
  },
  Iceland: {
    leader: [
      { name: "총리 할도르 아스그림손", from: "2004-09-15", until: "2006-06-15" },
      { name: "총리 게이르 하르데", from: "2006-06-15", until: "2009-02-01" },
      { name: "총리 요한나 시귀르다르도티르", from: "2009-02-01", until: "2013-05-23" },
      { name: "총리 시그뮌뒤르 다비드 귄뢰이그손", from: "2013-05-23", until: "2016-04-07" },
      { name: "총리 시귀르뒤르 잉기 요한손", from: "2016-04-07", until: "2017-01-11" },
      { name: "총리 뱌르니 베네딕트손", from: "2017-01-11", until: "2017-11-30" },
      { name: "총리 카트린 야콥스도티르", from: "2017-11-30", until: "2024-04-09" },
      { name: "총리 뱌르니 베네딕트손", from: "2024-04-09", until: "2024-12-21" },
      { name: "총리 크리스트룬 프로스타도티르", from: "2024-12-21" },
    ],
    headOfState: [
      { name: "대통령 올라뷔르 라그나르 그림손", from: "1996-08-01", until: "2016-08-01" },
      { name: "대통령 그뷔드니 요하네손", from: "2016-08-01", until: "2024-08-01" },
      { name: "대통령 할라 토마스도티르", from: "2024-08-01" },
    ],
  },
  India: {
    leader: [
      { name: "총리 만모한 싱", from: "2004-05-22", until: "2014-05-26" },
      { name: "총리 나렌드라 모디", from: "2014-05-26" },
    ],
    headOfState: [
      { name: "대통령 A.P.J. 압둘 칼람", from: "2002-07-25", until: "2007-07-25" },
      { name: "대통령 프라티바 파틸", from: "2007-07-25", until: "2012-07-25" },
      { name: "대통령 프라납 무케르지", from: "2012-07-25", until: "2017-07-25" },
      { name: "대통령 람 나트 코빈드", from: "2017-07-25", until: "2022-07-25" },
      { name: "대통령 드라우파디 무르무", from: "2022-07-25" },
    ],
    deputy: [
      { name: "(없음)" },
      { name: "(없음)", from: "2006-01-01", until: "2016-12-31" },
    ],
  },
  Indonesia: {
    leader: [
      { name: "대통령 수실로 밤방 유도요노", from: "2004-10-20", until: "2014-10-20" },
      { name: "대통령 조코 위도도", from: "2014-10-20", until: "2024-10-20" },
      { name: "대통령 프라보워 수비안토", from: "2024-10-20" },
    ],
    headOfState: [
      { name: "(없음)" },
    ],
    deputy: [
      { name: "부통령 유숩 칼라", from: "2004-10-20", until: "2009-10-20" },
      { name: "부통령 부디오노", from: "2009-10-20", until: "2014-10-20" },
      { name: "부통령 유숩 칼라", from: "2014-10-20", until: "2019-10-20" },
      { name: "부통령 마루프 아민", from: "2019-10-20", until: "2024-10-20" },
      { name: "부통령 지브란 라카부밍 라카", from: "2024-10-20" },
    ],
  },
  Iran: {
    leader: [
      { name: "최고지도자 알리 하메네이", from: "1989-06-04" },
    ],
    headOfState: [
      { name: "(없음)" },
    ],
    deputy: [
      { name: "대통령 하산 로하니", from: "2013-08-03", until: "2021-08-03" },
      { name: "대통령 에브라힘 라이시", from: "2021-08-03", until: "2024-05-19" },
      { name: "대통령 마수드 페제시키안", from: "2024-07-28" },
    ],
  },
  Iraq: {
    leader: [
      { name: "총리 이브라힘 알자파리", from: "2005-05-03", until: "2006-05-20" },
      { name: "총리 누리 알말리키", from: "2006-05-20", until: "2014-09-08" },
      { name: "총리 하이데르 알아바디", from: "2014-09-08", until: "2018-10-25" },
      { name: "총리 아델 압둘마흐디", from: "2018-10-25", until: "2020-05-07" },
      { name: "총리 무스타파 알카디미", from: "2020-05-07", until: "2022-10-27" },
      { name: "총리 무함마드 시아 알수다니", from: "2022-10-27" },
    ],
    headOfState: [
      { name: "대통령 잘랄 탈라바니", from: "2005-04-07", until: "2014-07-24" },
      { name: "대통령 푸아드 마숨", from: "2014-07-24", until: "2018-10-02" },
      { name: "대통령 바르함 살리흐", from: "2018-10-02", until: "2022-10-13" },
      { name: "대통령 압둘 라티프 라시드", from: "2022-10-13" },
    ],
  },
  Ireland: {
    leader: [
      { name: "총리 버티 아헌", from: "1997-06-26", until: "2008-05-07" },
      { name: "총리 브라이언 카우언", from: "2008-05-07", until: "2011-03-09" },
      { name: "총리 엔다 케니", from: "2011-03-09", until: "2017-06-14" },
      { name: "총리 리오 버라드커", from: "2017-06-14", until: "2020-06-27" },
      { name: "총리 미홀 마틴", from: "2020-06-27", until: "2022-12-17" },
      { name: "총리 리오 버라드커", from: "2022-12-17", until: "2024-04-09" },
      { name: "총리 사이먼 해리스", from: "2024-04-09", until: "2025-01-23" },
      { name: "총리 미홀 마틴", from: "2025-01-23" },
    ],
    headOfState: [
      { name: "대통령 메리 매컬리스", from: "1997-11-11", until: "2011-11-11" },
      { name: "대통령 마이클 D. 히긴스", from: "2011-11-11", until: "2025-11-11" },
      { name: "대통령 캐서린 코널리", from: "2025-11-11" },
    ],
    deputy: [
      { name: "부총리 메리 하니", from: "1997-06-26", until: "2006-09-13" },
      { name: "부총리 마이클 맥도웰", from: "2006-09-13", until: "2007-06-14" },
      { name: "부총리 브라이언 카우언", from: "2007-06-14", until: "2008-05-07" },
      { name: "부총리 메리 코글런", from: "2008-05-07", until: "2011-03-09" },
      { name: "부총리 이몬 길모어", from: "2011-03-09", until: "2014-07-11" },
      { name: "부총리 조앤 버턴", from: "2014-07-11", until: "2016-05-06" },
      { name: "부총리 프랜시스 피츠제럴드", from: "2016-05-06", until: "2017-11-28" },
      { name: "부총리 사이먼 코베니", from: "2017-11-30", until: "2020-06-27" },
      { name: "부총리 리오 버라드커", from: "2020-06-27", until: "2022-12-17" },
      { name: "부총리 미홀 마틴", from: "2022-12-17", until: "2025-01-23" },
      { name: "부총리 사이먼 해리스", from: "2025-01-23" },
    ],
  },
  Israel: {
    leader: [
      { name: "총리 아리엘 샤론", from: "2001-03-07", until: "2006-01-04" },
      { name: "총리 에후드 올메르트", from: "2006-01-04", until: "2009-03-31" },
      { name: "총리 베냐민 네타냐후", from: "2009-03-31", until: "2021-06-13" },
      { name: "총리 나프탈리 베네트", from: "2021-06-13", until: "2022-07-01" },
      { name: "총리 야이르 라피드", from: "2022-07-01", until: "2022-12-29" },
      { name: "총리 베냐민 네타냐후", from: "2022-12-29" },
    ],
    headOfState: [
      { name: "대통령 모셰 카차브", from: "2000-08-01", until: "2007-07-01" },
      { name: "대통령 시몬 페레스", from: "2007-07-15", until: "2014-07-24" },
      { name: "대통령 레우벤 리블린", from: "2014-07-24", until: "2021-07-07" },
      { name: "대통령 이츠하크 헤르초그", from: "2021-07-07" },
    ],
    deputy: [
      { name: "(없음)" },
    ],
  },
  Italy: {
    leader: [
      { name: "총리 실비오 베를루스코니", from: "2001-06-11", until: "2006-05-17" },
      { name: "총리 로마노 프로디", from: "2006-05-17", until: "2008-05-08" },
      { name: "총리 실비오 베를루스코니", from: "2008-05-08", until: "2011-11-16" },
      { name: "총리 마리오 몬티", from: "2011-11-16", until: "2013-04-28" },
      { name: "총리 엔리코 레타", from: "2013-04-28", until: "2014-02-22" },
      { name: "총리 마테오 렌치", from: "2014-02-22", until: "2016-12-12" },
      { name: "총리 파올로 젠틸로니", from: "2016-12-12", until: "2018-06-01" },
      { name: "총리 주세페 콘테", from: "2018-06-01", until: "2021-02-13" },
      { name: "총리 마리오 드라기", from: "2021-02-13", until: "2022-10-22" },
      { name: "총리 조르자 멜로니", from: "2022-10-22" },
    ],
    headOfState: [
      { name: "대통령 카를로 아첼리오 참피", from: "1999-05-18", until: "2006-05-15" },
      { name: "대통령 조르조 나폴리타노", from: "2006-05-15", until: "2015-01-14" },
      { name: "대통령 세르조 마타렐라", from: "2015-02-03" },
    ],
  },
  Jamaica: {
    leader: [
      { name: "총리 P. J. 패터슨", from: "1992-03-30", until: "2006-03-30" },
      { name: "총리 포샤 심프슨밀러", from: "2006-03-30", until: "2007-09-11" },
      { name: "총리 브루스 골딩", from: "2007-09-11", until: "2011-10-23" },
      { name: "총리 앤드루 홀니스", from: "2011-10-23", until: "2012-01-05" },
      { name: "총리 포샤 심프슨밀러", from: "2012-01-05", until: "2016-03-03" },
      { name: "총리 앤드루 홀니스", from: "2016-03-03" },
    ],
    headOfState: [
      { name: "여왕 엘리자베스 2세", until: "2022-09-08" },
      { name: "국왕 찰스 3세", from: "2022-09-08" },
    ],
  },
  Japan: {
    leader: [
      { name: "총리 고이즈미 준이치로", from: "2001-04-26", until: "2006-09-26" },
      { name: "총리 아베 신조", from: "2006-09-26", until: "2007-09-26" },
      { name: "총리 후쿠다 야스오", from: "2007-09-26", until: "2008-09-24" },
      { name: "총리 아소 다로", from: "2008-09-24", until: "2009-09-16" },
      { name: "총리 하토야마 유키오", from: "2009-09-16", until: "2010-06-08" },
      { name: "총리 간 나오토", from: "2010-06-08", until: "2011-09-02" },
      { name: "총리 노다 요시히코", from: "2011-09-02", until: "2012-12-26" },
      { name: "총리 아베 신조", from: "2012-12-26", until: "2020-09-16" },
      { name: "총리 스가 요시히데", from: "2020-09-16", until: "2021-10-04" },
      { name: "총리 기시다 후미오", from: "2021-10-04", until: "2024-10-01" },
      { name: "총리 이시바 시게루", from: "2024-10-01", until: "2025-10-21" },
      { name: "총리 다카이치 사나에", from: "2025-10-21" },
    ],
    headOfState: [
      { name: "천황 아키히토", from: "1989-01-07", until: "2019-04-30" },
      { name: "천황 나루히토", from: "2019-05-01" },
    ],
    deputy: [
      { name: "부총리 아소 다로", from: "2012-12-26", until: "2021-10-04" },
    ],
  },
  Jordan: {
    leader: [
      { name: "국왕 압둘라 2세", from: "1999-02-07" },
    ],
    headOfState: [
      { name: "(없음)" },
    ],
    deputy: [
      { name: "총리 압둘라 엔수르", from: "2012-10-11", until: "2016-06-01" },
      { name: "총리 하니 물키", from: "2016-06-01", until: "2018-06-14" },
      { name: "총리 오마르 라자즈", from: "2018-06-14", until: "2020-10-12" },
      { name: "총리 비셰르 하사우네", from: "2020-10-12", until: "2024-09-15" },
      { name: "총리 자파르 하산", from: "2024-09-15" },
    ],
  },
  Kazakhstan: {
    leader: [
      { name: "대통령 누르술탄 나자르바예프", from: "1990-04-24", until: "2019-03-20" },
      { name: "대통령 카심조마르트 토카예프", from: "2019-03-20" },
    ],
    headOfState: [
      { name: "(없음)" },
    ],
    deputy: [
      { name: "총리 카림 마시모프", from: "2014-04-02", until: "2016-09-08" },
      { name: "총리 바킷잔 사긴타예프", from: "2016-09-09", until: "2019-02-21" },
      { name: "총리 아스카르 마민", from: "2019-02-25", until: "2022-01-05" },
      { name: "총리 알리한 스마일로프", from: "2022-01-11", until: "2024-02-06" },
      { name: "총리 올자스 벡테노프", from: "2024-02-06" },
    ],
  },
  Kenya: {
    leader: [
      { name: "대통령 음와이 키바키", from: "2002-12-30", until: "2013-04-09" },
      { name: "대통령 우후루 케냐타", from: "2013-04-09", until: "2022-09-13" },
      { name: "대통령 윌리엄 루토", from: "2022-09-13" },
    ],
    headOfState: [
      { name: "(없음)" },
    ],
    deputy: [
      { name: "부통령 무디 아워리", from: "2003-09-25", until: "2008-01-08" },
      { name: "부통령 칼론조 무쇼카", from: "2008-01-08", until: "2013-04-09" },
      { name: "총리 라일라 오딩가", from: "2008-04-17", until: "2013-04-09" },
      { name: "부통령 윌리엄 루토", from: "2013-04-09", until: "2022-09-13" },
      { name: "부통령 리가티 가차과", from: "2022-09-13", until: "2024-10-17" },
      { name: "부통령 키투레 킨디키", from: "2024-11-01" },
    ],
  },
  Kiribati: {
    leader: [
      { name: "대통령 아노테 통", from: "2003-07-10", until: "2016-03-11" },
      { name: "대통령 타네티 마마우", from: "2016-03-11" },
    ],
    headOfState: [
      { name: "(없음)" },
    ],
  },
  Kosovo: {
    leader: [
      { name: "총리 바이람 코수미", from: "2005-03-23", until: "2006-03-10" },
      { name: "총리 아김 체쿠", from: "2006-03-10", until: "2008-01-09" },
      { name: "총리 하심 타치", from: "2008-01-09", until: "2014-12-09" },
      { name: "총리 이사 무스타파", from: "2014-12-09", until: "2017-09-09" },
      { name: "총리 라무시 하라디나이", from: "2017-09-09", until: "2020-02-03" },
      { name: "총리 알빈 쿠르티", from: "2020-02-03", until: "2020-06-03" },
      { name: "총리 압둘라 호티", from: "2020-06-03", until: "2021-03-22" },
      { name: "총리 알빈 쿠르티", from: "2021-03-22" },
    ],
    headOfState: [
      { name: "대통령 이브라힘 루고바", from: "2002-03-04", until: "2006-01-21" },
      { name: "대통령 파트미르 세이디우", from: "2006-02-10", until: "2010-09-27" },
      { name: "대통령 아티페테 야히야가", from: "2011-04-07", until: "2016-04-07" },
      { name: "대통령 하심 타치", from: "2016-04-07", until: "2020-11-05" },
      { name: "대통령 비오사 오스마니", from: "2021-04-04" },
    ],
  },
  Kuwait: {
    leader: [
      { name: "에미르 자베르 알아흐마드 알사바", from: "1977-12-31", until: "2006-01-15" },
      { name: "에미르 사드 알압둘라 알사바", from: "2006-01-15", until: "2006-01-24" },
      { name: "에미르 사바흐 알아흐마드 알자베르 알사바", from: "2006-01-29", until: "2020-09-29" },
      { name: "에미르 나와프 알아흐마드 알자베르 알사바", from: "2020-09-29", until: "2023-12-16" },
      { name: "에미르 미샬 알아흐마드 알자베르 알사바", from: "2023-12-16" },
    ],
    headOfState: [
      { name: "(없음)" },
    ],
    deputy: [
      { name: "왕세자 나와프 알아흐마드 알자베르 알사바", from: "2006-02-07", until: "2020-09-29" },
      { name: "왕세자 미샬 알아흐마드 알자베르 알사바", from: "2020-10-08", until: "2023-12-16" },
      { name: "왕세자 사바흐 알할리드 알사바", from: "2024-06-01" },
    ],
  },
  Kyrgyzstan: {
    leader: [
      { name: "대통령 쿠르만베크 바키예프", from: "2005-08-14", until: "2010-04-15" },
      { name: "대통령(임시) 로자 오툰바예바", from: "2010-04-07", until: "2011-12-01" },
      { name: "대통령 알마즈베크 아탐바예프", from: "2011-12-01", until: "2017-11-24" },
      { name: "대통령 소론바이 제엔베코프", from: "2017-11-24", until: "2020-10-15" },
      { name: "대통령 사디르 자파로프", from: "2021-01-28" },
    ],
    headOfState: [
      { name: "(없음)" },
      { name: "대통령 쿠르만베크 바키예프", from: "2005-08-14", until: "2010-04-15" },
      { name: "대통령(임시) 로자 오툰바예바", from: "2010-04-07", until: "2011-12-01" },
    ],
  },
  Laos: {
    leader: [
      { name: "총서기 춤말리 사야손", from: "2006-03-21", until: "2006-06-08" },
      { name: "국가주석 추말리 사야손", from: "2006-06-08", until: "2016-04-20" },
      { name: "국가주석 분냥 보라치트", from: "2016-04-20", until: "2021-03-22" },
      { name: "국가주석 통룬 시술릿", from: "2021-03-22" },
    ],
    headOfState: [
      { name: "(없음)" },
      { name: "국가주석 춤말리 사야손", from: "2006-06-08", until: "2016-04-20" },
    ],
    deputy: [
      { name: "총리 부아손 부파반", from: "2006-06-08", until: "2010-12-23" },
      { name: "총리 통싱 탐마봉", from: "2010-12-23", until: "2016-04-20" },
      { name: "총리 통룬 시술릿", from: "2016-04-20", until: "2021-03-22" },
      { name: "총리 판캄 비파반", from: "2021-03-22", until: "2022-12-30" },
      { name: "총리 소넥사이 시판돈", from: "2022-12-30" },
    ],
  },
  Latvia: {
    leader: [
      { name: "총리 아이가르스 칼비티스", from: "2004-12-02", until: "2007-12-20" },
      { name: "총리 이바르스 고드마니스", from: "2007-12-20", until: "2009-03-12" },
      { name: "총리 발디스 돔브로우스키스", from: "2009-03-12", until: "2014-01-22" },
      { name: "총리 라임도타 스트라우유마", from: "2014-01-22", until: "2016-02-11" },
      { name: "총리 마리스 쿠친스키스", from: "2016-02-11", until: "2019-01-23" },
      { name: "총리 크리샤니스 카린시", from: "2019-01-23", until: "2023-09-15" },
      { name: "총리 에비카 실리냐", from: "2023-09-15" },
    ],
    headOfState: [
      { name: "대통령 바이라 비케프레이베르가", from: "1999-07-08", until: "2007-07-08" },
      { name: "대통령 발디스 자틀레르스", from: "2007-07-08", until: "2011-07-08" },
      { name: "대통령 안드리스 베르진슈", from: "2011-07-08", until: "2015-07-08" },
      { name: "대통령 라이몬츠 베요니스", from: "2015-07-08", until: "2019-07-08" },
      { name: "대통령 에길스 레비츠", from: "2019-07-08", until: "2023-07-08" },
      { name: "대통령 에드가르스 린케비치스", from: "2023-07-08" },
    ],
  },
  Lebanon: {
    leader: [
      { name: "총리 푸아드 시니오라", from: "2005-07-19", until: "2009-11-09" },
      { name: "총리 사드 하리리", from: "2009-11-09", until: "2011-06-13" },
      { name: "총리 나지브 미카티", from: "2011-06-13", until: "2014-02-15" },
      { name: "총리 탐맘 살람", from: "2014-02-15", until: "2016-12-18" },
      { name: "총리 사드 하리리", from: "2016-12-18", until: "2020-01-21" },
      { name: "총리 하산 디아브", from: "2020-01-21", until: "2021-09-10" },
      { name: "총리 나지브 미카티", from: "2021-09-10", until: "2025-02-08" },
      { name: "총리 나와프 살람", from: "2025-02-08" },
    ],
    headOfState: [
      { name: "대통령 에밀 라후드", from: "1998-11-24", until: "2007-11-23" },
      { name: "대통령 미셸 술레이만", from: "2008-05-25", until: "2014-05-24" },
      { name: "대통령 미셸 아운", from: "2016-10-31", until: "2022-10-30" },
      { name: "대통령 조제프 아운", from: "2025-01-09" },
    ],
  },
  Lesotho: {
    leader: [
      { name: "총리 파칼리타 모시실리", from: "1998-05-23", until: "2012-06-08" },
      { name: "총리 톰 타바네", from: "2012-06-08", until: "2015-03-17" },
      { name: "총리 파칼리타 모시실리", from: "2015-03-17", until: "2017-06-16" },
      { name: "총리 톰 타바네", from: "2017-06-16", until: "2020-05-20" },
      { name: "총리 무에케치 마조로", from: "2020-05-20", until: "2022-10-28" },
      { name: "총리 샘 마테카네", from: "2022-10-28" },
    ],
    headOfState: [
      { name: "국왕 레치에 3세", from: "1996-02-07" },
    ],
  },
  Liberia: {
    leader: [
      { name: "대통령 엘런 존슨설리프", from: "2006-01-16", until: "2018-01-22" },
      { name: "대통령 조지 웨아", from: "2018-01-22", until: "2024-01-22" },
      { name: "대통령 조지프 보아카이", from: "2024-01-22" },
    ],
    headOfState: [
      { name: "(없음)" },
    ],
    deputy: [
      { name: "부통령 조지프 보아카이", from: "2006-01-16", until: "2018-01-22" },
      { name: "부통령 주얼 테일러", from: "2018-01-22", until: "2024-01-22" },
      { name: "부통령 제러마이아 쿵", from: "2024-01-22" },
    ],
  },
  Libya: {
    leader: [
      { name: "혁명지도자 무아마르 카다피", from: "1969-09-01", until: "2011-10-20" },
      { name: "국가과도위원회 의장 무스타파 압둘 잘릴", from: "2011-10-23", until: "2012-08-08" },
      { name: "총리 압둘 하미드 드베이바", from: "2021-03-15" },
    ],
    headOfState: [
      { name: "대통령위원회 의장 모하메드 알멘피", from: "2021-03-15" },
    ],
  },
  Liechtenstein: {
    leader: [
      { name: "총리 오트마어 하슬러", from: "2001-04-05", until: "2009-03-25" },
      { name: "총리 클라우스 취처", from: "2009-03-25", until: "2013-03-27" },
      { name: "총리 아드리안 하슬러", from: "2013-03-27", until: "2021-03-25" },
      { name: "총리 다니엘 리슈", from: "2021-03-25", until: "2025-04-10" },
      { name: "총리 브리기테 하스", from: "2025-04-10" },
    ],
    headOfState: [
      { name: "공 한스아담 2세", from: "1989-11-13" },
    ],
  },
  Lithuania: {
    leader: [
      { name: "총리 알기르다스 브라자우스카스", from: "2001-07-03", until: "2006-06-01" },
      { name: "총리 게디미나스 키르킬라스", from: "2006-07-04", until: "2008-11-27" },
      { name: "총리 안드리우스 쿠빌류스", from: "2008-11-28", until: "2012-12-13" },
      { name: "총리 알기르다스 부트케비추스", from: "2012-12-13", until: "2016-12-13" },
      { name: "총리 사울류스 스크베르넬리스", from: "2016-12-13", until: "2020-12-11" },
      { name: "총리 잉그리다 시모니테", from: "2020-12-11", until: "2024-12-12" },
      { name: "총리 긴타우타스 팔루츠카스", from: "2024-12-12", until: "2025-08-01" },
      { name: "총리 잉가 루기니에네", from: "2025-09-01" },
    ],
    headOfState: [
      { name: "대통령 발다스 아담쿠스", from: "2004-07-12", until: "2009-07-12" },
      { name: "대통령 달리아 그리바우스카이테", from: "2009-07-12", until: "2019-07-12" },
      { name: "대통령 기타나스 나우세다", from: "2019-07-12" },
    ],
    deputy: [
      { name: "(없음)" },
    ],
  },
  Luxembourg: {
    leader: [
      { name: "총리 장클로드 융커", from: "1995-01-20", until: "2013-12-04" },
      { name: "총리 그자비에 베텔", from: "2013-12-04", until: "2023-11-17" },
      { name: "총리 뤼크 프리덴", from: "2023-11-17" },
    ],
    headOfState: [
      { name: "대공 앙리", from: "2000-10-07", until: "2025-10-03" },
      { name: "대공 기욤", from: "2025-10-03" },
    ],
    deputy: [
      { name: "부총리 장 아셀보른", from: "2004-07-31", until: "2013-12-04" },
    ],
  },
  Madagascar: {
    leader: [
      { name: "대통령 마르크 라발로마나나", from: "2002-05-06", until: "2009-03-17" },
      { name: "과도 대통령 안드리 라조엘리나", from: "2009-03-21", until: "2014-01-25" },
      { name: "대통령 에리 라자오나리맘피아니나", from: "2014-01-25", until: "2018-09-07" },
      { name: "대통령 안드리 라조엘리나", from: "2019-01-19", until: "2025-10-14" },
      { name: "대통령 미카엘 란드리아니리나", from: "2025-10-17" },
    ],
    headOfState: [
      { name: "(없음)" },
    ],
  },
  Malawi: {
    leader: [
      { name: "대통령 빙구 와 무타리카", from: "2004-05-24", until: "2012-04-05" },
      { name: "대통령 조이스 반다", from: "2012-04-07", until: "2014-05-31" },
      { name: "대통령 피터 무타리카", from: "2014-05-31", until: "2020-06-28" },
      { name: "대통령 라자루스 차퀘라", from: "2020-06-28", until: "2025-10-01" },
      { name: "대통령 피터 무타리카", from: "2025-10-01" },
    ],
    headOfState: [
      { name: "(없음)" },
    ],
    deputy: [
      { name: "부통령 사울로스 칠리마", from: "2014-05-31", until: "2024-06-10" },
      { name: "부통령 마이클 우시", from: "2024-06-21", until: "2025-10-01" },
      { name: "부통령 제인 안사", from: "2025-10-01" },
    ],
  },
  Malaysia: {
    leader: [
      { name: "총리 압둘라 아마드 바다위", from: "2003-10-31", until: "2009-04-03" },
      { name: "총리 나집 라작", from: "2009-04-03", until: "2018-05-10" },
      { name: "총리 마하티르 모하맛", from: "2018-05-10", until: "2020-03-01" },
      { name: "총리 무히딘 야신", from: "2020-03-01", until: "2021-08-21" },
      { name: "총리 이스마일 사브리 야콥", from: "2021-08-21", until: "2022-11-24" },
      { name: "총리 안와르 이브라힘", from: "2022-11-24" },
    ],
    headOfState: [
      { name: "국왕 압둘 할림", from: "2011-12-13", until: "2016-12-13" },
      { name: "국왕 무함마드 5세", from: "2016-12-13", until: "2019-01-06" },
      { name: "국왕 압둘라", from: "2019-01-31", until: "2024-01-30" },
      { name: "국왕 이브라힘", from: "2024-01-31" },
    ],
    deputy: [
      { name: "부총리 나집 라작", from: "2004-01-07", until: "2009-04-03" },
      { name: "부총리 무히딘 야신", from: "2009-04-09", until: "2015-07-28" },
    ],
  },
  Maldives: {
    leader: [
      { name: "대통령 마우문 압둘 가윰", from: "1978-11-11", until: "2008-11-11" },
      { name: "대통령 모하메드 나시드", from: "2008-11-11", until: "2012-02-07" },
      { name: "대통령 모하메드 와히드 하산", from: "2012-02-07", until: "2013-11-17" },
      { name: "대통령 압둘라 야민", from: "2013-11-17", until: "2018-11-17" },
      { name: "대통령 이브라힘 모하메드 솔리흐", from: "2018-11-17", until: "2023-11-17" },
      { name: "대통령 모하메드 무이주", from: "2023-11-17" },
    ],
    headOfState: [
      { name: "(없음)" },
      { name: "대통령 마우문 압둘 가윰", from: "1978-11-11", until: "2008-11-11" },
      { name: "대통령 모하메드 나시드", from: "2008-11-11", until: "2012-02-07" },
      { name: "대통령 모하메드 와히드 하산", from: "2012-02-07", until: "2013-11-17" },
    ],
    deputy: [
      { name: "부통령 파이살 나심", from: "2018-11-17", until: "2023-11-17" },
      { name: "부통령 후세인 모하메드 라티프", from: "2023-11-17" },
    ],
  },
  Mali: {
    leader: [
      { name: "대통령 아마두 투마니 투레", from: "2002-06-08", until: "2012-03-22" },
      { name: "임시 대통령 디온쿤다 트라오레", from: "2012-04-12", until: "2013-09-04" },
      { name: "대통령 이브라힘 부바카르 케이타", from: "2013-09-04", until: "2020-08-18" },
      { name: "임시 대통령 바 은다우", from: "2020-09-25", until: "2021-05-24" },
      { name: "임시 대통령 아시미 고이타", from: "2021-05-24" },
    ],
    headOfState: [
      { name: "(없음)" },
    ],
    deputy: [
      { name: "총리 모디보 케이타", from: "2015-01-08", until: "2017-04-08" },
      { name: "총리 압둘라예 이드리사 마이가", from: "2017-04-08", until: "2017-12-30" },
      { name: "총리 수메일루 부베예 마이가", from: "2017-12-30", until: "2019-04-18" },
      { name: "총리 부부 시세", from: "2019-04-22", until: "2020-08-18" },
      { name: "총리 목타르 우안", from: "2020-09-27", until: "2021-05-24" },
      { name: "총리 쇼겔 코칼라 마이가", from: "2021-06-07", until: "2024-11-21" },
      { name: "총리 압둘라예 마이가", from: "2024-11-21" },
    ],
  },
  Malta: {
    leader: [
      { name: "총리 로렌스 곤지", from: "2004-03-23", until: "2013-03-11" },
      { name: "총리 조지프 무스카트", from: "2013-03-11", until: "2020-01-13" },
      { name: "총리 로버트 아벨라", from: "2020-01-13" },
    ],
    headOfState: [
      { name: "대통령 에드워드 페네크 아다미", from: "2004-04-04", until: "2009-04-04" },
      { name: "대통령 조지 아벨라", from: "2009-04-04", until: "2014-04-04" },
      { name: "대통령 마리루이즈 콜레이로 프레카", from: "2014-04-04", until: "2019-04-04" },
      { name: "대통령 조지 벨라", from: "2019-04-04", until: "2024-04-04" },
      { name: "대통령 미리암 스피테리 데보노", from: "2024-04-04" },
    ],
  },
  "Marshall Islands": {
    leader: [
      { name: "대통령 케사이 노트", from: "2000-01-10", until: "2008-01-14" },
      { name: "대통령 리토콰 토메잉", from: "2008-01-14", until: "2009-10-26" },
      { name: "대통령 주렐랑 제드카이아", from: "2009-10-26", until: "2012-01-01" },
      { name: "대통령 크리스토퍼 로에아크", from: "2012-01-01", until: "2016-01-11" },
      { name: "대통령 힐다 하이네", from: "2016-01-28", until: "2020-01-13" },
      { name: "대통령 데이비드 카부아", from: "2020-01-13", until: "2024-01-03" },
      { name: "대통령 힐다 하이네", from: "2024-01-03" },
    ],
    headOfState: [
      { name: "(없음)" },
      { name: "대통령 케사이 노트", from: "2000-01-10", until: "2008-01-14" },
      { name: "대통령 리토콰 토메잉", from: "2008-01-14", until: "2009-10-26" },
      { name: "대통령 주렐랑 제드카이아", from: "2009-10-26", until: "2012-01-10" },
    ],
  },
  Mauritania: {
    leader: [
      { name: "군사평의회 의장 엘리 울드 모하메드 발", from: "2005-08-03", until: "2007-04-19" },
      { name: "대통령 시디 울드 셰이크 압달라히", from: "2007-04-19", until: "2008-08-06" },
      { name: "국가최고평의회 의장 모하메드 울드 압델 아지즈", from: "2008-08-06", until: "2009-04-15" },
      { name: "대통령 모하메드 울드 압델아지즈", from: "2009-08-05", until: "2019-08-01" },
      { name: "대통령 모하메드 울드 가주아니", from: "2019-08-01" },
    ],
    headOfState: [
      { name: "(없음)" },
    ],
    deputy: [
      { name: "총리 야히아 울드 하데민", from: "2014-08-01", until: "2018-10-29" },
      { name: "총리 모하메드 살렘 울드 베시르", from: "2018-10-29", until: "2019-08-01" },
      { name: "총리 이스마일 울드 베데 울드 셰이크 시디야", from: "2019-08-01", until: "2020-08-06" },
      { name: "총리 모하메드 울드 빌랄", from: "2020-08-06", until: "2024-08-02" },
      { name: "총리 모크타르 울드 디아이", from: "2024-08-02" },
    ],
  },
  Mauritius: {
    leader: [
      { name: "총리 나빈 람굴람", from: "2005-07-05", until: "2014-12-17" },
      { name: "총리 아네루드 주그노트", from: "2014-12-17", until: "2017-01-23" },
      { name: "총리 프라빈드 주그노트", from: "2017-01-23", until: "2024-11-13" },
      { name: "총리 나빈 람굴람", from: "2024-11-13" },
    ],
    headOfState: [
      { name: "대통령 아미나 구리브파킴", from: "2015-06-05", until: "2018-03-23" },
      { name: "대통령 프리트비라지싱 루푼", from: "2019-12-02", until: "2024-12-07" },
      { name: "대통령 다람 고쿨", from: "2024-12-07" },
    ],
  },
  Mexico: {
    leader: [
      { name: "대통령 비센테 폭스", from: "2000-12-01", until: "2006-12-01" },
      { name: "대통령 펠리페 칼데론", from: "2006-12-01", until: "2012-12-01" },
      { name: "대통령 엔리케 페냐 니에토", from: "2012-12-01", until: "2018-12-01" },
      { name: "대통령 안드레스 마누엘 로페스 오브라도르", from: "2018-12-01", until: "2024-10-01" },
      { name: "대통령 클라우디아 셰인바움", from: "2024-10-01" },
    ],
    headOfState: [
      { name: "(없음)" },
      { name: "대통령 비센테 폭스", from: "2000-12-01", until: "2006-12-01" },
      { name: "대통령 펠리페 칼데론", from: "2006-12-01", until: "2012-12-01" },
    ],
    deputy: [
      { name: "(없음)" },
      { name: "(없음)" },
    ],
  },
  Micronesia: {
    leader: [
      { name: "대통령 조지프 우루세말", from: "2003-05-11", until: "2007-05-11" },
      { name: "대통령 매니 모리", from: "2007-05-11", until: "2015-05-11" },
      { name: "대통령 피터 크리스천", from: "2015-05-11", until: "2019-05-11" },
      { name: "대통령 데이비드 파누엘로", from: "2019-05-11", until: "2023-05-11" },
      { name: "대통령 웨슬리 시미나", from: "2023-05-12" },
    ],
    headOfState: [
      { name: "(없음)" },
      { name: "대통령 조지프 우루세말", from: "2003-05-11", until: "2007-05-11" },
      { name: "대통령 매니 모리", from: "2007-05-11", until: "2015-05-11" },
    ],
    deputy: [
      { name: "부통령 요시워 조지", from: "2015-05-11", until: "2023-05-11" },
      { name: "부통령 아렌 팔리크", from: "2023-05-12" },
    ],
  },
  Moldova: {
    leader: [
      { name: "총리 바실레 타를레프", from: "2001-04-19", until: "2008-03-31" },
      { name: "총리 지나이다 그레체아니", from: "2008-03-31", until: "2009-09-25" },
      { name: "총리 블라드 필라트", from: "2009-09-25", until: "2013-04-25" },
      { name: "총리 유리에 레안커", from: "2013-04-25", until: "2015-02-18" },
      { name: "총리 키릴 가부리치", from: "2015-02-18", until: "2015-07-30" },
      { name: "총리 발레리우 스트렐레츠", from: "2015-07-30", until: "2015-10-29" },
      { name: "총리 파벨 필립", from: "2016-01-20", until: "2019-06-08" },
      { name: "총리 마이아 산두", from: "2019-06-08", until: "2019-11-14" },
      { name: "총리 이온 키쿠", from: "2019-11-14", until: "2020-12-31" },
      { name: "총리 나탈리아 가브릴리차", from: "2021-08-06", until: "2023-02-16" },
      { name: "총리 도린 레체안", from: "2023-02-16", until: "2025-10-31" },
      { name: "총리 알렉산드루 문테아누", from: "2025-10-31" },
    ],
    headOfState: [
      { name: "대통령 블라디미르 보로닌", from: "2001-04-07", until: "2009-09-11" },
      { name: "대통령 권한대행 미하이 김푸", from: "2009-09-11", until: "2010-12-28" },
      { name: "대통령 권한대행 마리안 루푸", from: "2010-12-30", until: "2012-03-23" },
      { name: "대통령 니콜라에 티모프티", from: "2012-03-23", until: "2016-12-23" },
      { name: "대통령 이고르 도돈", from: "2016-12-23", until: "2020-12-24" },
      { name: "대통령 마이아 산두", from: "2020-12-24" },
    ],
  },
  Mongolia: {
    leader: [
      { name: "대통령 남바린 엥흐바야르", from: "2005-06-24", until: "2009-06-18" },
      { name: "총리 사이한빌레그", from: "2014-11-21", until: "2016-07-08" },
      { name: "총리 에르데네바트", from: "2016-07-08", until: "2017-10-04" },
      { name: "총리 후렐수흐", from: "2017-10-04", until: "2021-01-27" },
      { name: "총리 오용에르데네", from: "2021-01-27", until: "2025-06-13" },
      { name: "총리 잔단샤타르", from: "2025-06-13" },
    ],
    headOfState: [
      { name: "대통령 엘베그도르지", from: "2009-06-18", until: "2017-07-10" },
      { name: "대통령 바트톨가", from: "2017-07-10", until: "2021-06-25" },
      { name: "대통령 후렐수흐", from: "2021-06-25" },
    ],
  },
  Montenegro: {
    leader: [
      { name: "총리 밀로 주카노비치", from: "2003-01-08", until: "2006-11-10" },
      { name: "총리 젤코 슈투라노비치", from: "2006-11-10", until: "2008-02-29" },
      { name: "총리 밀로 주카노비치", from: "2008-02-29", until: "2010-12-29" },
      { name: "총리 이고르 룩시치", from: "2010-12-29", until: "2012-12-04" },
      { name: "총리 밀로 주카노비치", from: "2012-12-04", until: "2016-11-28" },
      { name: "총리 두슈코 마르코비치", from: "2016-11-28", until: "2020-12-04" },
      { name: "총리 즈드라브코 크리보카피치", from: "2020-12-04", until: "2022-04-28" },
      { name: "총리 드리탄 아바조비치", from: "2022-04-28", until: "2023-10-31" },
      { name: "총리 밀로이코 스파이치", from: "2023-10-31" },
    ],
    headOfState: [
      { name: "대통령 필리프 부야노비치", from: "2003-05-22", until: "2018-05-20" },
      { name: "대통령 밀로 주카노비치", from: "2018-05-20", until: "2023-05-20" },
      { name: "대통령 야코브 밀라토비치", from: "2023-05-20" },
    ],
  },
  Morocco: {
    leader: [
      { name: "국왕 무함마드 6세", from: "1999-07-23" },
    ],
    headOfState: [
      { name: "(없음)" },
    ],
    deputy: [
      { name: "총리 압델릴라 벤키란", from: "2011-11-29", until: "2017-03-17" },
      { name: "총리 사아데딘 오트마니", from: "2017-03-17", until: "2021-10-07" },
      { name: "총리 아지즈 아칸누시", from: "2021-10-07" },
    ],
  },
  Mozambique: {
    leader: [
      { name: "대통령 아르만두 게부자", from: "2005-02-02", until: "2015-01-15" },
      { name: "대통령 필리프 뉴시", from: "2015-01-15", until: "2025-01-15" },
      { name: "대통령 다니엘 샤푸", from: "2025-01-15" },
    ],
    headOfState: [
      { name: "(없음)" },
    ],
    deputy: [
      { name: "총리 카를루스 아고스티뉴 두로자리우", from: "2015-01-17", until: "2022-03-03" },
      { name: "총리 아드리아누 말레이아느", from: "2022-03-03", until: "2025-01-15" },
      { name: "총리 마리아 벤빈다 레비", from: "2025-01-17" },
    ],
  },
  Myanmar: {
    leader: [
      { name: "국가평화발전평의회 의장 탄 슈웨", from: "1992-04-23", until: "2011-03-30" },
      { name: "대통령 테인 세인", from: "2011-03-30", until: "2016-03-30" },
      { name: "국가고문 아웅산수찌", from: "2016-04-06", until: "2021-02-01" },
      { name: "국가행정평의회 의장 민 아웅 흘라잉", from: "2021-02-01" },
    ],
    headOfState: [
      { name: "대통령 틴 초", from: "2016-03-30", until: "2018-03-21" },
      { name: "대통령 윈 민", from: "2018-03-30", until: "2021-02-01" },
    ],
  },
  Namibia: {
    leader: [
      { name: "대통령 히피케푸니에 포함바", from: "2005-03-21", until: "2015-03-21" },
      { name: "대통령 하게 게인곱", from: "2015-03-21", until: "2024-02-04" },
      { name: "대통령 낭골로 음붐바", from: "2024-02-04", until: "2025-03-21" },
      { name: "대통령 네툼보 난디은다이트와", from: "2025-03-21" },
    ],
    headOfState: [
      { name: "(없음)" },
    ],
    deputy: [
      { name: "총리 사라 쿠공겔와아마딜라", from: "2015-03-21", until: "2025-03-21" },
      { name: "총리 엘리야 응우라레", from: "2025-03-22" },
    ],
  },
  Nauru: {
    leader: [
      { name: "대통령 루드비히 스코티", from: "2004-06-22", until: "2007-12-19" },
      { name: "대통령 마커스 스티븐", from: "2007-12-19", until: "2011-11-10" },
      { name: "대통령 프레디 피처", from: "2011-11-10", until: "2011-11-15" },
      { name: "대통령 스프렌트 답위도", from: "2011-11-15", until: "2013-06-11" },
      { name: "대통령 배런 와카", from: "2013-06-11", until: "2019-08-27" },
      { name: "대통령 라이오넬 아잉기메아", from: "2019-08-27", until: "2022-09-28" },
      { name: "대통령 러스 쿤", from: "2022-09-28", until: "2023-10-30" },
      { name: "대통령 데이비드 아데앙", from: "2023-10-30" },
    ],
    headOfState: [
      { name: "(없음)" },
      { name: "대통령 루드비히 스코티", from: "2004-06-22", until: "2007-12-19" },
      { name: "대통령 마커스 스티븐", from: "2007-12-19", until: "2011-11-10" },
      { name: "대통령 프레디 피처", from: "2011-11-10", until: "2011-11-15" },
      { name: "대통령 스프렌트 답위도", from: "2011-11-15", until: "2013-06-11" },
    ],
  },
  Nepal: {
    leader: [
      { name: "국왕 갸넨드라 (직접 통치)", from: "2005-02-01", until: "2006-04-30" },
      { name: "총리 기리자 프라사드 코이랄라", from: "2006-04-30", until: "2008-08-18" },
      { name: "총리 푸슈파 카말 다할 (프라찬다)", from: "2008-08-18", until: "2009-05-25" },
      { name: "총리 마다브 쿠마르 네팔", from: "2009-05-25", until: "2011-02-06" },
      { name: "총리 잘라 나트 카날", from: "2011-02-06", until: "2011-08-29" },
      { name: "총리 바부람 바타라이", from: "2011-08-29", until: "2013-03-14" },
      { name: "각료회의 의장 킬 라즈 레그미", from: "2013-03-14", until: "2014-02-11" },
      { name: "총리 수실 코이랄라", from: "2014-02-11", until: "2015-10-12" },
      { name: "총리 K.P. 샤르마 올리", from: "2015-10-12", until: "2016-08-04" },
      { name: "총리 푸슈파 카말 다할", from: "2016-08-04", until: "2017-06-07" },
      { name: "총리 셰르 바하두르 데우바", from: "2017-06-07", until: "2018-02-15" },
      { name: "총리 K.P. 샤르마 올리", from: "2018-02-15", until: "2021-07-13" },
      { name: "총리 셰르 바하두르 데우바", from: "2021-07-13", until: "2022-12-26" },
      { name: "총리 푸슈파 카말 다할", from: "2022-12-26", until: "2024-07-15" },
      { name: "총리 K.P. 샤르마 올리", from: "2024-07-15", until: "2025-09-09" },
      { name: "총리 수실라 카르키", from: "2025-09-12" },
    ],
    headOfState: [
      { name: "국왕 갸넨드라", from: "2001-06-04", until: "2008-05-28" },
      { name: "대통령 람 바란 야다브", from: "2008-07-23", until: "2015-10-29" },
      { name: "대통령 비디아 데비 반다리", from: "2015-10-29", until: "2023-03-13" },
      { name: "대통령 람 찬드라 파우델", from: "2023-03-13" },
    ],
  },
  Netherlands: {
    leader: [
      { name: "총리 얀 페터 발케넨더", from: "2002-07-22", until: "2010-10-14" },
      { name: "총리 마르크 뤼터", from: "2010-10-14", until: "2024-07-02" },
      { name: "총리 딕 스호프", from: "2024-07-02" },
    ],
    headOfState: [
      { name: "여왕 베아트릭스", from: "1980-04-30", until: "2013-04-30" },
      { name: "국왕 빌럼알렉산더르", from: "2013-04-30" },
    ],
  },
  "New Zealand": {
    leader: [
      { name: "총리 헬렌 클라크", from: "1999-12-10", until: "2008-11-19" },
      { name: "총리 존 키", from: "2008-11-19", until: "2016-12-12" },
      { name: "총리 빌 잉글리시", from: "2016-12-12", until: "2017-10-26" },
      { name: "총리 저신다 아던", from: "2017-10-26", until: "2023-01-25" },
      { name: "총리 크리스 힙킨스", from: "2023-01-25", until: "2023-11-27" },
      { name: "총리 크리스토퍼 럭슨", from: "2023-11-27" },
    ],
    headOfState: [
      { name: "여왕 엘리자베스 2세", until: "2022-09-08" },
      { name: "국왕 찰스 3세", from: "2022-09-08" },
    ],
    deputy: [
      { name: "부총리 빌 잉글리시", from: "2008-11-19", until: "2016-12-12" },
      { name: "부총리 폴라 베넷", from: "2016-12-12", until: "2017-10-26" },
      { name: "부총리 윈스턴 피터스", from: "2017-10-26", until: "2020-11-06" },
      { name: "부총리 그랜트 로버트슨", from: "2020-11-06", until: "2023-01-25" },
      { name: "부총리 카멀 세풀로니", from: "2023-01-25", until: "2023-11-27" },
      { name: "부총리 윈스턴 피터스", from: "2023-11-27", until: "2025-05-31" },
      { name: "부총리 데이비드 시모어", from: "2025-05-31" },
    ],
  },
  Nicaragua: {
    leader: [
      { name: "대통령 엔리케 볼라뇨스", from: "2002-01-10", until: "2007-01-10" },
      { name: "대통령 다니엘 오르테가", from: "2007-01-10" },
    ],
    headOfState: [
      { name: "(없음)" },
      { name: "대통령 엔리케 볼라뇨스", from: "2002-01-10", until: "2007-01-10" },
    ],
    deputy: [
      { name: "부통령 로사리오 무리요", from: "2017-01-10" },
    ],
  },
  Niger: {
    leader: [
      { name: "대통령 마마두 탄자", from: "1999-12-22", until: "2010-02-18" },
      { name: "군정 지도자 살루 지보", from: "2010-02-18", until: "2011-04-07" },
      { name: "대통령 마하마두 이수푸", from: "2011-04-07", until: "2021-04-02" },
      { name: "대통령 모하메드 바줌", from: "2021-04-02", until: "2023-07-26" },
      { name: "군정 지도자 압두라하마네 치아니", from: "2023-07-26" },
    ],
    headOfState: [
      { name: "(없음)" },
    ],
    deputy: [
      { name: "총리 브리지 라피니", from: "2011-04-01", until: "2021-04-03" },
      { name: "총리 우후무두 마하마두", from: "2021-04-03", until: "2023-07-26" },
      { name: "총리 알리 라민 제인", from: "2023-08-09" },
    ],
  },
  Nigeria: {
    leader: [
      { name: "대통령 올루세군 오바산조", from: "1999-05-29", until: "2007-05-29" },
      { name: "대통령 우마루 야라두아", from: "2007-05-29", until: "2010-05-05" },
      { name: "대통령 굿럭 조너선", from: "2010-05-06", until: "2015-05-29" },
      { name: "대통령 무함마두 부하리", from: "2015-05-29", until: "2023-05-29" },
      { name: "대통령 볼라 티누부", from: "2023-05-29" },
    ],
    headOfState: [
      { name: "(없음)" },
    ],
    deputy: [
      { name: "부통령 아티쿠 아부바카르", from: "1999-05-29", until: "2007-05-29" },
      { name: "부통령 굿럭 조너선", from: "2007-05-29", until: "2010-05-06" },
      { name: "부통령 나마디 삼보", from: "2010-05-19", until: "2015-05-29" },
      { name: "부통령 예미 오신바조", from: "2015-05-29", until: "2023-05-29" },
      { name: "부통령 카심 셰티마", from: "2023-05-29" },
    ],
  },
  "North Korea": {
    leader: [
      { name: "국방위원장 김정일", from: "1994-07-08", until: "2011-12-17" },
      { name: "국무위원장 김정은", from: "2011-12-17" },
    ],
    headOfState: [
      { name: "최고인민회의 상임위원장 김영남", from: "1998-09-05", until: "2019-04-11" },
    ],
    deputy: [
      { name: "내각총리 박봉주", from: "2003-09-03", until: "2007-04-11" },
      { name: "내각총리 김영일", from: "2007-04-11", until: "2010-06-07" },
      { name: "내각총리 최영림", from: "2010-06-07", until: "2013-04-01" },
      { name: "내각총리 박봉주", from: "2013-04-01", until: "2019-04-11" },
      { name: "내각총리 김재룡", from: "2019-04-11", until: "2020-08-13" },
      { name: "내각총리 김덕훈", from: "2020-08-13" },
    ],
  },
  "North Macedonia": {
    leader: [
      { name: "총리 블라도 부치코프스키", from: "2004-12-17", until: "2006-08-27" },
      { name: "총리 니콜라 그루에프스키", from: "2006-08-27", until: "2016-01-18" },
      { name: "총리 에밀 디미트리에프", from: "2016-01-18", until: "2017-05-31" },
      { name: "총리 조란 자에프", from: "2017-05-31", until: "2020-01-03" },
      { name: "총리 올리베르 스파소프스키", from: "2020-01-03", until: "2020-08-31" },
      { name: "총리 조란 자에프", from: "2020-08-31", until: "2022-01-17" },
      { name: "총리 디미타르 코바체프스키", from: "2022-01-17", until: "2024-01-28" },
      { name: "총리 탈라트 자페리", from: "2024-01-28", until: "2024-06-23" },
      { name: "총리 흐리스티얀 미츠코스키", from: "2024-06-23" },
    ],
    headOfState: [
      { name: "대통령 브란코 츠르벤코프스키", from: "2004-05-12", until: "2009-05-12" },
      { name: "대통령 조르게 이바노프", from: "2009-05-12", until: "2019-05-12" },
      { name: "대통령 스테보 펜다로프스키", from: "2019-05-12", until: "2024-05-12" },
      { name: "대통령 고르다나 실야노브스카다브코바", from: "2024-05-12" },
    ],
  },
  "Northern Cyprus": {
    leader: [
      { name: "대통령 메흐메트 알리 탈라트", from: "2005-04-24", until: "2010-04-22" },
      { name: "대통령 데르비시 에로을루", from: "2010-04-23", until: "2015-04-30" },
      { name: "대통령 무스타파 아큰즈", from: "2015-04-30", until: "2020-10-23" },
      { name: "대통령 에르신 타타르", from: "2020-10-23", until: "2025-10-24" },
      { name: "대통령 투판 에르휘르만", from: "2025-10-24" },
    ],
    headOfState: [
      { name: "(없음)" },
    ],
  },
  Norway: {
    leader: [
      { name: "총리 옌스 스톨텐베르그", from: "2005-10-17", until: "2013-10-16" },
      { name: "총리 에르나 솔베르그", from: "2013-10-16", until: "2021-10-14" },
      { name: "총리 요나스 가르 스퇴레", from: "2021-10-14" },
    ],
    headOfState: [
      { name: "국왕 하랄 5세", from: "1991-01-17" },
    ],
    deputy: [
      { name: "(없음)" },
      { name: "(없음)", from: "2006-01-01", until: "2016-12-31" },
    ],
  },
  Oman: {
    leader: [
      { name: "술탄 카부스 빈 사이드", until: "2020-01-10" },
      { name: "술탄 하이삼 빈 타리크", from: "2020-01-11" },
    ],
    headOfState: [
      { name: "(없음)" },
    ],
  },
  Pakistan: {
    leader: [
      { name: "총리 샤우카트 아지즈", from: "2004-08-28", until: "2007-11-16" },
      { name: "과도정부 총리 무함마드 미안 수므로", from: "2007-11-16", until: "2008-03-25" },
      { name: "총리 유수프 라자 길라니", from: "2008-03-25", until: "2012-06-19" },
      { name: "총리 라자 페르바이즈 아슈라프", from: "2012-06-22", until: "2013-03-24" },
      { name: "과도정부 총리 미르 하자르 칸 코소", from: "2013-03-25", until: "2013-06-05" },
      { name: "총리 나와즈 샤리프", from: "2013-06-05", until: "2017-07-28" },
      { name: "총리 샤히드 하칸 아바시", from: "2017-08-01", until: "2018-05-31" },
      { name: "총리 임란 칸", from: "2018-08-18", until: "2022-04-10" },
      { name: "총리 셰바즈 샤리프", from: "2022-04-11", until: "2023-08-14" },
      { name: "총리 안와르 울하크 카카르", from: "2023-08-14", until: "2024-03-04" },
      { name: "총리 셰바즈 샤리프", from: "2024-03-04" },
    ],
    headOfState: [
      { name: "대통령 페르베즈 무샤라프", from: "2001-06-20", until: "2008-08-18" },
      { name: "대통령 아시프 알리 자르다리", from: "2008-09-09", until: "2013-09-08" },
      { name: "대통령 맘눈 후사인", from: "2013-09-09", until: "2018-09-09" },
      { name: "대통령 아리프 알비", from: "2018-09-09", until: "2024-03-10" },
      { name: "대통령 아시프 알리 자르다리", from: "2024-03-10" },
    ],
    deputy: [
      { name: "(없음)" },
    ],
  },
  Palau: {
    leader: [
      { name: "대통령 토미 레멩게사우", from: "2001-01-19", until: "2009-01-15" },
      { name: "대통령 존슨 토리비옹", from: "2009-01-15", until: "2013-01-17" },
      { name: "대통령 토미 레멩게사우", from: "2013-01-17", until: "2021-01-21" },
      { name: "대통령 수랑겔 휩스 주니어", from: "2021-01-21" },
    ],
    headOfState: [
      { name: "(없음)" },
      { name: "대통령 토미 레멩게사우", from: "2001-01-19", until: "2009-01-15" },
      { name: "대통령 존슨 토리비옹", from: "2009-01-15", until: "2013-01-17" },
    ],
  },
  Palestine: {
    leader: [
      { name: "대통령 마흐무드 압바스", from: "2005-01-15" },
    ],
    headOfState: [
      { name: "(없음)" },
    ],
    deputy: [
      { name: "총리 라미 함달라", from: "2013-06-06", until: "2019-04-13" },
      { name: "총리 무함마드 슈타예", from: "2019-04-13", until: "2024-03-31" },
      { name: "총리 무함마드 무스타파", from: "2024-03-31" },
    ],
  },
  Panama: {
    leader: [
      { name: "대통령 마르틴 토리호스", from: "2004-09-01", until: "2009-07-01" },
      { name: "대통령 리카르도 마르티넬리", from: "2009-07-01", until: "2014-07-01" },
      { name: "대통령 후안 카를로스 바렐라", from: "2014-07-01", until: "2019-07-01" },
      { name: "대통령 라우렌티노 코르티소", from: "2019-07-01", until: "2024-07-01" },
      { name: "대통령 호세 라울 물리노", from: "2024-07-01" },
    ],
    headOfState: [
      { name: "(없음)" },
      { name: "대통령 마르틴 토리호스", from: "2004-09-01", until: "2009-07-01" },
      { name: "대통령 리카르도 마르티넬리", from: "2009-07-01", until: "2014-07-01" },
    ],
    deputy: [
      { name: "부통령 호세 가브리엘 카리소", from: "2019-07-01", until: "2024-07-01" },
    ],
  },
  "Papua New Guinea": {
    leader: [
      { name: "총리 마이클 소마레", from: "2002-08-05", until: "2011-08-02" },
      { name: "총리 피터 오닐", from: "2011-08-02", until: "2019-05-30" },
      { name: "총리 제임스 마라페", from: "2019-05-30" },
    ],
    headOfState: [
      { name: "여왕 엘리자베스 2세", until: "2022-09-08" },
      { name: "국왕 찰스 3세", from: "2022-09-08" },
    ],
  },
  Paraguay: {
    leader: [
      { name: "대통령 니카노르 두아르테 프루토스", from: "2003-08-15", until: "2008-08-15" },
      { name: "대통령 페르난도 루고", from: "2008-08-15", until: "2012-06-22" },
      { name: "대통령 페데리코 프랑코", from: "2012-06-22", until: "2013-08-15" },
      { name: "대통령 오라시오 카르테스", from: "2013-08-15", until: "2018-08-15" },
      { name: "대통령 마리오 아브도 베니테스", from: "2018-08-15", until: "2023-08-15" },
      { name: "대통령 산티아고 페냐", from: "2023-08-15" },
    ],
    headOfState: [
      { name: "(없음)" },
      { name: "대통령 니카노르 두아르테 프루토스", from: "2003-08-15", until: "2008-08-15" },
      { name: "대통령 페르난도 루고", from: "2008-08-15", until: "2012-06-22" },
      { name: "대통령 페데리코 프랑코", from: "2012-06-22", until: "2013-08-15" },
    ],
    deputy: [
      { name: "부통령 우고 벨라스케스", from: "2018-08-15", until: "2023-08-15" },
      { name: "부통령 페드로 알리아나", from: "2023-08-15" },
    ],
  },
  Peru: {
    leader: [
      { name: "대통령 알레한드로 톨레도", from: "2001-07-28", until: "2006-07-28" },
      { name: "대통령 알란 가르시아", from: "2006-07-28", until: "2011-07-28" },
      { name: "대통령 오얀타 우말라", from: "2011-07-28", until: "2016-07-28" },
      { name: "대통령 페드로 파블로 쿠친스키", from: "2016-07-28", until: "2018-03-23" },
      { name: "대통령 마르틴 비스카라", from: "2018-03-23", until: "2020-11-09" },
      { name: "대통령 프란시스코 사가스티", from: "2020-11-17", until: "2021-07-28" },
      { name: "대통령 페드로 카스티요", from: "2021-07-28", until: "2022-12-07" },
      { name: "대통령 디나 볼루아르테", from: "2022-12-07", until: "2025-10-10" },
      { name: "대통령 호세 헤리", from: "2025-10-10" },
    ],
    headOfState: [
      { name: "(없음)" },
      { name: "대통령 알레한드로 톨레도", from: "2001-07-28", until: "2006-07-28" },
      { name: "대통령 알란 가르시아", from: "2006-07-28", until: "2011-07-28" },
    ],
    deputy: [
      { name: "부통령 마르틴 비스카라", from: "2016-07-28", until: "2018-03-23" },
      { name: "부통령 디나 볼루아르테", from: "2021-07-28", until: "2022-12-07" },
    ],
  },
  Philippines: {
    leader: [
      { name: "대통령 글로리아 마카파갈 아로요", from: "2001-01-20", until: "2010-06-30" },
      { name: "대통령 베니그노 아키노 3세", from: "2010-06-30", until: "2016-06-30" },
      { name: "대통령 로드리고 두테르테", from: "2016-06-30", until: "2022-06-30" },
      { name: "대통령 페르디난드 마르코스 주니어", from: "2022-06-30" },
    ],
    headOfState: [
      { name: "(없음)" },
    ],
    deputy: [
      { name: "부통령 놀리 데 카스트로", from: "2004-06-30", until: "2010-06-30" },
      { name: "부통령 제조마르 비나이", from: "2010-06-30", until: "2016-06-30" },
      { name: "부통령 레니 로브레도", from: "2016-06-30", until: "2022-06-30" },
      { name: "부통령 사라 두테르테", from: "2022-06-30" },
    ],
  },
  Poland: {
    leader: [
      { name: "총리 카지미에시 마르친키에비치", from: "2005-10-31", until: "2006-07-14" },
      { name: "총리 야로스와프 카친스키", from: "2006-07-14", until: "2007-11-16" },
      { name: "총리 도날트 투스크", from: "2007-11-16", until: "2014-09-22" },
      { name: "총리 에바 코파치", from: "2014-09-22", until: "2015-11-16" },
      { name: "총리 베아타 시들로", from: "2015-11-16", until: "2017-12-11" },
      { name: "총리 마테우시 모라비에츠키", from: "2017-12-11", until: "2023-12-13" },
      { name: "총리 도날트 투스크", from: "2023-12-13" },
    ],
    headOfState: [
      { name: "대통령 레흐 카친스키", from: "2005-12-23", until: "2010-04-10" },
      { name: "대통령 브로니스와프 코모로프스키", from: "2010-08-06", until: "2015-08-06" },
      { name: "대통령 안제이 두다", from: "2015-08-06", until: "2025-08-06" },
      { name: "대통령 카롤 나브로츠키", from: "2025-08-06" },
    ],
  },
  Portugal: {
    leader: [
      { name: "총리 조제 소크라트스", from: "2005-03-12", until: "2011-06-21" },
      { name: "총리 페드루 파수스 코엘류", from: "2011-06-21", until: "2015-11-26" },
      { name: "총리 안토니우 코스타", from: "2015-11-26", until: "2024-04-02" },
      { name: "총리 루이스 몬테네그루", from: "2024-04-02" },
    ],
    headOfState: [
      { name: "대통령 조르즈 삼파이우", from: "1996-03-09", until: "2006-03-09" },
      { name: "대통령 아니발 카바쿠 실바", from: "2006-03-09", until: "2016-03-09" },
      { name: "대통령 마르셀루 헤벨루 드 소자", from: "2016-03-09" },
    ],
  },
  Qatar: {
    leader: [
      { name: "에미르 하마드 빈 할리파 알사니", from: "1995-06-27", until: "2013-06-25" },
      { name: "에미르 타밈 빈 하마드 알사니", from: "2013-06-25" },
    ],
    headOfState: [
      { name: "(없음)" },
    ],
    deputy: [
      { name: "총리 압둘라 빈 나세르 알사니", from: "2013-06-26", until: "2020-01-28" },
      { name: "총리 할리드 빈 할리파 알사니", from: "2020-01-28", until: "2023-03-07" },
      { name: "총리 무함마드 빈 압둘라흐만 알사니", from: "2023-03-07" },
    ],
  },
  "Republic of the Congo": {
    leader: [
      { name: "대통령 드니 사수 응게소", from: "1997-10-25" },
    ],
    headOfState: [
      { name: "(없음)" },
    ],
    deputy: [
      { name: "총리 클레망 무암바", from: "2016-04-23", until: "2021-05-12" },
      { name: "총리 아나톨 콜리네 마코소", from: "2021-05-12" },
    ],
  },
  Romania: {
    leader: [
      { name: "총리 컬린 포페스쿠 터리체아누", from: "2004-12-29", until: "2008-12-22" },
      { name: "총리 에밀 보크", from: "2008-12-22", until: "2012-02-09" },
      { name: "총리 미하이 러즈반 웅구레아누", from: "2012-02-09", until: "2012-05-07" },
      { name: "총리 빅토르 폰타", from: "2012-05-07", until: "2015-11-04" },
      { name: "총리 다치안 치올로시", from: "2015-11-17", until: "2017-01-04" },
      { name: "총리 소린 그린데아누", from: "2017-01-04", until: "2017-06-29" },
      { name: "총리 미하이 투도세", from: "2017-06-29", until: "2018-01-29" },
      { name: "총리 비오리카 던칠러", from: "2018-01-29", until: "2019-11-04" },
      { name: "총리 루도비크 오르반", from: "2019-11-04", until: "2020-12-07" },
      { name: "총리 플로린 크추", from: "2020-12-23", until: "2021-11-25" },
      { name: "총리 니콜라에 추커", from: "2021-11-25", until: "2023-06-15" },
      { name: "총리 마르첼 촐라쿠", from: "2023-06-15", until: "2025-06-23" },
      { name: "총리 일리에 볼로잔", from: "2025-06-23" },
    ],
    headOfState: [
      { name: "대통령 트라이안 버세스쿠", from: "2004-12-20", until: "2014-12-21" },
      { name: "대통령 클라우스 요하니스", from: "2014-12-21", until: "2025-02-12" },
      { name: "대통령 니쿠쇼르 단", from: "2025-05-26" },
    ],
  },
  Russia: {
    leader: [
      { name: "총리 미하일 프라드코프", from: "2004-03-05", until: "2007-09-12" },
      { name: "총리 빅토르 주브코프", from: "2007-09-14", until: "2008-05-08" },
      { name: "총리 블라디미르 푸틴", from: "2008-05-08", until: "2012-05-07" },
      { name: "대통령 블라디미르 푸틴", from: "2012-05-07" },
    ],
    headOfState: [
      { name: "(없음)" },
      { name: "대통령 블라디미르 푸틴", from: "2000-05-07", until: "2008-05-07" },
      { name: "대통령 드미트리 메드베데프", from: "2008-05-07", until: "2012-05-07" },
    ],
    deputy: [
      { name: "총리 드미트리 메드베데프", from: "2012-05-08", until: "2020-01-16" },
      { name: "총리 미하일 미슈스틴", from: "2020-01-16" },
    ],
  },
  Rwanda: {
    leader: [
      { name: "대통령 폴 카가메", from: "2000-04-22" },
    ],
    headOfState: [
      { name: "(없음)" },
    ],
    deputy: [
      { name: "총리 아나스타즈 무레케지", from: "2014-07-24", until: "2017-08-30" },
      { name: "총리 에두아르 응기렌테", from: "2017-08-30", until: "2025-07-01" },
      { name: "총리 저스틴 은센기윰바", from: "2025-07-01" },
    ],
  },
  "Saint Kitts and Nevis": {
    leader: [
      { name: "총리 덴질 더글러스", from: "1995-07-07", until: "2015-02-18" },
      { name: "총리 티머시 해리스", from: "2015-02-18", until: "2022-08-06" },
      { name: "총리 테런스 드루", from: "2022-08-06" },
    ],
    headOfState: [
      { name: "여왕 엘리자베스 2세", until: "2022-09-08" },
      { name: "국왕 찰스 3세", from: "2022-09-08" },
    ],
  },
  "Saint Lucia": {
    leader: [
      { name: "총리 케니 앤서니", from: "1997-05-24", until: "2006-12-15" },
      { name: "총리 존 콤프턴", from: "2006-12-15", until: "2007-09-07" },
      { name: "총리 스티븐슨 킹", from: "2007-09-09", until: "2011-11-30" },
      { name: "총리 케니 앤서니", from: "2011-11-30", until: "2016-06-07" },
      { name: "총리 앨런 채스터닛", from: "2016-06-07", until: "2021-07-28" },
      { name: "총리 필립 피에르", from: "2021-07-28" },
    ],
    headOfState: [
      { name: "여왕 엘리자베스 2세", until: "2022-09-08" },
      { name: "국왕 찰스 3세", from: "2022-09-08" },
    ],
  },
  "Saint Vincent and the Grenadines": {
    leader: [
      { name: "총리 랠프 곤살베스", from: "2001-03-29" },
    ],
    headOfState: [
      { name: "여왕 엘리자베스 2세", until: "2022-09-08" },
      { name: "국왕 찰스 3세", from: "2022-09-08" },
    ],
  },
  Samoa: {
    leader: [
      { name: "총리 투일라에파 사일렐레 말리엘레가오이", from: "1998-11-23", until: "2021-05-24" },
      { name: "총리 피아메 나오미 마타아파", from: "2021-05-24", until: "2025-09-16" },
      { name: "총리 라아울리 레우아테아 폴라타이바오", from: "2025-09-16" },
    ],
    headOfState: [
      { name: "국가원수 말리에토아 타누마필리 2세", from: "1962-01-01", until: "2007-05-11" },
      { name: "국가원수 투푸아 타마세세 에피", from: "2007-06-20", until: "2017-07-21" },
      { name: "국가원수 투이말레알리이파노 바알레토아 수알라우비 2세", from: "2017-07-21" },
    ],
  },
  "Sao Tome and Principe": {
    leader: [
      { name: "총리 파트리스 트로보아다", from: "2014-11-25", until: "2018-12-03" },
      { name: "총리 조르즈 봉 제주스", from: "2018-12-03", until: "2022-11-11" },
      { name: "총리 파트리스 트로보아다", from: "2022-11-11", until: "2025-01-01" },
      { name: "총리 아메리쿠 드 올리베이라 라무스", from: "2025-01-01" },
    ],
    headOfState: [
      { name: "대통령 프라디크 드 메네제스", from: "2001-09-03", until: "2011-09-03" },
      { name: "대통령 마누엘 핀투 다 코스타", from: "2011-09-03", until: "2016-09-03" },
      { name: "대통령 에바리스투 카르발류", from: "2016-09-03", until: "2021-10-02" },
      { name: "대통령 카를루스 빌라 노바", from: "2021-10-02" },
    ],
  },
  "Saudi Arabia": {
    leader: [
      { name: "국왕 압둘라 빈 압둘아지즈", from: "2005-08-01", until: "2015-01-23" },
      { name: "국왕 살만 빈 압둘아지즈", from: "2015-01-23" },
    ],
    headOfState: [
      { name: "(없음)" },
    ],
    deputy: [
      { name: "왕세자 술탄 빈 압둘아지즈", from: "2005-08-01", until: "2011-10-22" },
      { name: "왕세자 나예프 빈 압둘아지즈", from: "2011-10-27", until: "2012-06-16" },
      { name: "왕세자 살만 빈 압둘아지즈", from: "2012-06-18", until: "2015-01-23" },
      { name: "왕세자 무크린 빈 압둘아지즈", from: "2015-01-23", until: "2015-04-29" },
      { name: "왕세자 무함마드 빈 나예프", from: "2015-04-29", until: "2017-06-21" },
      { name: "왕세자 무함마드 빈 살만", from: "2017-06-21" },
    ],
  },
  Senegal: {
    leader: [
      { name: "대통령 압둘라예 와드", from: "2000-04-01", until: "2012-04-02" },
      { name: "대통령 마키 살", from: "2012-04-02", until: "2024-04-02" },
      { name: "대통령 바시루 디오마이 파이", from: "2024-04-02" },
    ],
    headOfState: [
      { name: "(없음)" },
    ],
    deputy: [
      { name: "총리 마키 살", from: "2004-04-21", until: "2007-06-19" },
      { name: "총리 셰이크 하지부 수마레", from: "2007-06-19", until: "2009-04-30" },
      { name: "총리 술레이만 은데네 은디아예", from: "2009-04-30", until: "2012-04-05" },
      { name: "총리 압둘 음바예", from: "2012-04-05", until: "2013-09-01" },
      { name: "총리 아미나타 투레", from: "2013-09-01", until: "2014-07-01" },
      { name: "총리 마하마드 분 압달라 디온", from: "2014-07-01", until: "2019-05-01" },
      { name: "총리 아마두 바", from: "2022-09-17", until: "2024-03-06" },
      { name: "총리 우스만 손코", from: "2024-04-02" },
    ],
  },
  Serbia: {
    leader: [
      { name: "총리 보이슬라프 코슈투니차", from: "2004-03-03", until: "2008-07-07" },
      { name: "총리 미르코 츠베트코비치", from: "2008-07-07", until: "2012-07-27" },
      { name: "총리 이비차 다치치", from: "2012-07-27", until: "2014-04-27" },
      { name: "총리 알렉산다르 부치치", from: "2014-04-27", until: "2017-05-31" },
      { name: "대통령 알렉산다르 부치치", from: "2017-05-31" },
    ],
    headOfState: [
      { name: "대통령 보리스 타디치", from: "2004-07-11", until: "2012-04-05" },
      { name: "대통령 토미슬라브 니콜리치", from: "2012-05-31", until: "2017-05-31" },
    ],
    deputy: [
      { name: "총리 아나 브르나비치", from: "2017-06-29", until: "2024-05-02" },
      { name: "총리 밀로시 부체비치", from: "2024-05-02", until: "2025-04-16" },
      { name: "총리 주로 마추트", from: "2025-04-16" },
    ],
  },
  Seychelles: {
    leader: [
      { name: "대통령 제임스 미셸", from: "2004-04-14", until: "2016-10-16" },
      { name: "대통령 대니 포르", from: "2016-10-16", until: "2020-10-26" },
      { name: "대통령 와벨 람칼라완", from: "2020-10-26", until: "2025-10-26" },
      { name: "대통령 패트릭 에르미니", from: "2025-10-26" },
    ],
    headOfState: [
      { name: "(없음)" },
    ],
  },
  "Sierra Leone": {
    leader: [
      { name: "대통령 아마드 테잔 카바", from: "1998-03-10", until: "2007-09-17" },
      { name: "대통령 어니스트 바이 코로마", from: "2007-09-17", until: "2018-04-04" },
      { name: "대통령 줄리어스 마다 비오", from: "2018-04-04" },
    ],
    headOfState: [
      { name: "(없음)" },
    ],
    deputy: [
      { name: "부통령 빅터 보카리 포", from: "2015-03-19", until: "2018-04-04" },
      { name: "부통령 모하메드 줄데 잘로", from: "2018-04-04" },
    ],
  },
  Singapore: {
    leader: [
      { name: "총리 리셴룽", from: "2004-08-12", until: "2024-05-15" },
      { name: "총리 로런스 웡", from: "2024-05-15" },
    ],
    headOfState: [
      { name: "대통령 S. R. 나단", from: "1999-09-01", until: "2011-08-31" },
      { name: "대통령 토니 탄", from: "2011-09-01", until: "2017-08-31" },
      { name: "대통령 할리마 야콥", from: "2017-09-14", until: "2023-09-13" },
      { name: "대통령 타르만 샨무가라트남", from: "2023-09-14" },
    ],
  },
  Slovakia: {
    leader: [
      { name: "총리 미쿨라시 주린다", from: "1998-10-30", until: "2006-07-04" },
      { name: "총리 로베르트 피초", from: "2006-07-04", until: "2010-07-08" },
      { name: "총리 이베타 라디초바", from: "2010-07-08", until: "2012-04-04" },
      { name: "총리 로베르트 피초", from: "2012-04-04", until: "2018-03-22" },
      { name: "총리 페테르 펠레그리니", from: "2018-03-22", until: "2020-03-21" },
      { name: "총리 이고르 마토비치", from: "2020-03-21", until: "2021-04-01" },
      { name: "총리 에두아르트 헤게르", from: "2021-04-01", until: "2023-05-15" },
      { name: "총리 루도비트 오도르", from: "2023-05-15", until: "2023-10-25" },
      { name: "총리 로베르트 피초", from: "2023-10-25" },
    ],
    headOfState: [
      { name: "대통령 이반 가슈파로비치", from: "2004-06-15", until: "2014-06-15" },
      { name: "대통령 안드레이 키스카", from: "2014-06-15", until: "2019-06-15" },
      { name: "대통령 주자나 차푸토바", from: "2019-06-15", until: "2024-06-15" },
      { name: "대통령 페테르 펠레그리니", from: "2024-06-15" },
    ],
  },
  Slovenia: {
    leader: [
      { name: "총리 야네즈 얀샤", from: "2004-12-03", until: "2008-11-21" },
      { name: "총리 보루트 파호르", from: "2008-11-21", until: "2012-02-10" },
      { name: "총리 야네즈 얀샤", from: "2012-02-10", until: "2013-03-20" },
      { name: "총리 알렌카 브라투셰크", from: "2013-03-20", until: "2014-09-18" },
      { name: "총리 미로 체라르", from: "2014-09-18", until: "2018-09-13" },
      { name: "총리 마리안 샤레츠", from: "2018-09-13", until: "2020-03-13" },
      { name: "총리 야네스 얀샤", from: "2020-03-13", until: "2022-06-01" },
      { name: "총리 로베르트 골로프", from: "2022-06-01" },
    ],
    headOfState: [
      { name: "대통령 야네즈 드르노브셰크", from: "2002-12-22", until: "2007-12-22" },
      { name: "대통령 다닐로 튀르크", from: "2007-12-23", until: "2012-12-22" },
      { name: "대통령 보루트 파호르", from: "2012-12-22", until: "2022-12-22" },
      { name: "대통령 나타샤 피르츠 무사르", from: "2022-12-23" },
    ],
  },
  "Solomon Islands": {
    leader: [
      { name: "총리 앨런 케마케자", from: "2001-12-17", until: "2006-04-20" },
      { name: "총리 스나이더 리니", from: "2006-04-20", until: "2006-05-04" },
      { name: "총리 마나세 소가바레", from: "2006-05-04", until: "2007-12-20" },
      { name: "총리 데릭 시쿠아", from: "2007-12-20", until: "2010-08-25" },
      { name: "총리 대니 필립", from: "2010-08-25", until: "2011-11-16" },
      { name: "총리 고든 다시 릴로", from: "2011-11-16", until: "2014-12-09" },
      { name: "총리 머나세 소가바레", from: "2014-12-09", until: "2017-11-15" },
      { name: "총리 릭 호우", from: "2017-11-16", until: "2019-04-24" },
      { name: "총리 머나세 소가바레", from: "2019-04-24", until: "2024-05-02" },
      { name: "총리 제레마이아 마넬레", from: "2024-05-02" },
    ],
    headOfState: [
      { name: "여왕 엘리자베스 2세", until: "2022-09-08" },
      { name: "국왕 찰스 3세", from: "2022-09-08" },
    ],
  },
  Somalia: {
    leader: [
      { name: "대통령 압둘라히 유수프 아흐메드", from: "2004-10-14", until: "2008-12-29" },
      { name: "대통령 셰이크 샤리프 셰이크 아흐메드", from: "2009-01-31", until: "2012-09-16" },
      { name: "대통령 하산 셰흐 모하무드", from: "2012-09-16", until: "2017-02-16" },
      { name: "대통령 모하메드 압둘라히 모하메드", from: "2017-02-16", until: "2022-05-23" },
      { name: "대통령 하산 셰흐 모하무드", from: "2022-05-23" },
    ],
    headOfState: [
      { name: "(없음)" },
    ],
    deputy: [
      { name: "총리 오마르 압디라시드 알리 샤르마르케", from: "2014-12-24", until: "2017-03-01" },
      { name: "총리 하산 알리 카이레", from: "2017-03-01", until: "2020-07-25" },
      { name: "총리 모하메드 후세인 로블레", from: "2020-09-23", until: "2022-06-25" },
      { name: "총리 함자 압디 바레", from: "2022-06-25" },
    ],
  },
  "South Africa": {
    leader: [
      { name: "대통령 타보 음베키", from: "1999-06-16", until: "2008-09-24" },
      { name: "대통령 칼레마 모틀란테", from: "2008-09-25", until: "2009-05-09" },
      { name: "대통령 제이컵 주마", from: "2009-05-09", until: "2018-02-14" },
      { name: "대통령 시릴 라마포사", from: "2018-02-15" },
    ],
    headOfState: [
      { name: "(없음)" },
    ],
    deputy: [
      { name: "부통령 시릴 라마포사", from: "2014-05-26", until: "2018-02-15" },
      { name: "부통령 데이비드 마부자", from: "2018-02-27", until: "2023-03-01" },
      { name: "부통령 폴 마샤틸레", from: "2023-03-07" },
    ],
  },
  "South Korea": {
    leader: [
      { name: "대통령 노무현", from: "2003-02-25", until: "2008-02-24" },
      { name: "대통령 이명박", from: "2008-02-25", until: "2013-02-24" },
      { name: "대통령 박근혜", from: "2013-02-25", until: "2017-03-10" },
      { name: "대통령 문재인", from: "2017-05-10", until: "2022-05-09" },
      { name: "대통령 윤석열", from: "2022-05-10", until: "2025-04-04" },
      { name: "대통령 이재명", from: "2025-06-04" },
    ],
    headOfState: [
      { name: "(없음)" },
    ],
    deputy: [
      { name: "국무총리 이해찬", from: "2004-06-30", until: "2006-03-15" },
      { name: "국무총리 한명숙", from: "2006-04-20", until: "2007-03-07" },
      { name: "국무총리 한덕수", from: "2007-04-03", until: "2008-02-29" },
      { name: "국무총리 한승수", from: "2008-02-29", until: "2009-09-28" },
      { name: "국무총리 정운찬", from: "2009-09-29", until: "2010-08-11" },
      { name: "국무총리 김황식", from: "2010-10-01", until: "2013-02-26" },
      { name: "국무총리 정홍원", from: "2013-02-26", until: "2015-02-16" },
      { name: "국무총리 이완구", from: "2015-02-17", until: "2015-04-27" },
      { name: "국무총리 황교안", from: "2015-06-18", until: "2017-05-11" },
      { name: "국무총리 이낙연", from: "2017-05-31", until: "2020-01-14" },
      { name: "국무총리 정세균", from: "2020-01-14", until: "2021-04-16" },
      { name: "국무총리 김부겸", from: "2021-05-14", until: "2022-05-11" },
      { name: "국무총리 한덕수", from: "2022-05-21", until: "2025-05-01" },
      { name: "국무총리 김민석", from: "2025-07-03" },
    ],
  },
  "South Sudan": {
    leader: [
      { name: "남수단 자치정부 대통령 살바 키르", from: "2005-08-11", until: "2011-07-09" },
      { name: "대통령 살바 키르", from: "2011-07-09" },
    ],
    headOfState: [
      { name: "(없음)" },
    ],
    deputy: [
      { name: "부통령 리에크 마차르", from: "2005-08-11", until: "2013-07-23" },
      { name: "제1부통령 타반 뎅 가이", from: "2016-07-26", until: "2020-02-22" },
      { name: "제1부통령 리에크 마차르", from: "2020-02-22" },
    ],
  },
  Spain: {
    leader: [
      { name: "총리 호세 루이스 로드리게스 사파테로", from: "2004-04-17", until: "2011-12-21" },
      { name: "총리 마리아노 라호이", from: "2011-12-21", until: "2018-06-02" },
      { name: "총리 페드로 산체스", from: "2018-06-02" },
    ],
    headOfState: [
      { name: "국왕 후안 카를로스 1세", from: "1975-11-22", until: "2014-06-18" },
      { name: "국왕 펠리페 6세", from: "2014-06-19" },
    ],
    deputy: [
      { name: "부총리 소라야 사엔스 데 산타마리아", from: "2011-12-22", until: "2018-06-07" },
      { name: "부총리 카르멘 칼보", from: "2018-06-07", until: "2021-07-12" },
      { name: "부총리 나디아 칼비뇨", from: "2021-07-12", until: "2023-12-29" },
      { name: "부총리 마리아 헤수스 몬테로", from: "2023-12-29" },
    ],
  },
  "Sri Lanka": {
    leader: [
      { name: "대통령 마힌다 라자팍사", from: "2005-11-19", until: "2015-01-09" },
      { name: "대통령 마이트리팔라 시리세나", from: "2015-01-09", until: "2019-11-18" },
      { name: "대통령 고타바야 라자팍사", from: "2019-11-18", until: "2022-07-14" },
      { name: "대통령 라닐 위크레메싱게", from: "2022-07-21", until: "2024-09-23" },
      { name: "대통령 아누라 쿠마라 디사나야케", from: "2024-09-23" },
    ],
    headOfState: [
      { name: "(없음)" },
      { name: "대통령 마힌다 라자팍사", from: "2005-11-19", until: "2015-01-09" },
    ],
    deputy: [
      { name: "(없음)", from: "2006-01-01", until: "2015-01-09" },
      { name: "총리 라닐 위크레메싱게", from: "2015-01-09", until: "2019-11-21" },
      { name: "총리 마힌다 라자팍사", from: "2019-11-21", until: "2022-05-09" },
      { name: "총리 라닐 위크레메싱게", from: "2022-05-12", until: "2022-07-21" },
      { name: "총리 디네시 구나와르데나", from: "2022-07-22", until: "2024-09-24" },
      { name: "총리 하리니 아마라수리야", from: "2024-09-24" },
    ],
  },
  Sudan: {
    leader: [
      { name: "대통령 오마르 알바시르", from: "1989-06-30", until: "2019-04-11" },
      { name: "과도주권위원회 의장 압델 파타 알부르한", from: "2019-04-12" },
    ],
    headOfState: [
      { name: "(없음)" },
    ],
    deputy: [
      { name: "총리 압달라 함독", from: "2019-08-21", until: "2022-01-02" },
      { name: "총리 카밀 이드리스", from: "2025-05-19" },
    ],
  },
  Suriname: {
    leader: [
      { name: "대통령 로널드 베네티안", from: "2000-08-12", until: "2010-08-12" },
      { name: "대통령 데시 바우테르서", from: "2010-08-12", until: "2020-07-16" },
      { name: "대통령 찬 산토키", from: "2020-07-16", until: "2025-07-16" },
      { name: "대통령 제니퍼 헤를링스시몬스", from: "2025-07-16" },
    ],
    headOfState: [
      { name: "(없음)" },
      { name: "대통령 로널드 베네티안", from: "2000-08-12", until: "2010-08-12" },
    ],
  },
  Swaziland: {
    leader: [
      { name: "국왕 음스와티 3세", from: "1986-04-25" },
    ],
    headOfState: [
      { name: "(없음)" },
    ],
    deputy: [
      { name: "총리 바르나바스 시부시소 들라미니", from: "2008-10-16", until: "2018-09-28" },
      { name: "총리 암브로스 들라미니", from: "2018-10-27", until: "2020-12-13" },
      { name: "총리 클레오파스 들라미니", from: "2021-07-19", until: "2023-11-06" },
      { name: "총리 러셀 음미소 들라미니", from: "2023-11-06" },
    ],
  },
  Sweden: {
    leader: [
      { name: "총리 예란 페르손", from: "1996-03-22", until: "2006-10-06" },
      { name: "총리 프레드리크 레인펠트", from: "2006-10-06", until: "2014-10-03" },
      { name: "총리 스테판 뢰벤", from: "2014-10-03", until: "2021-11-30" },
      { name: "총리 막달레나 안데르손", from: "2021-11-30", until: "2022-10-18" },
      { name: "총리 울프 크리스테르손", from: "2022-10-18" },
    ],
    headOfState: [
      { name: "국왕 칼 16세 구스타프" },
    ],
    deputy: [
      { name: "부총리 마우드 올로프손", from: "2006-10-06", until: "2010-10-05" },
      { name: "부총리 얀 비에르클룬드", from: "2010-10-05", until: "2014-10-03" },
      { name: "부총리 오사 롬손", from: "2014-10-03", until: "2016-05-25" },
      { name: "부총리 이사벨라 뢰빈", from: "2016-05-25", until: "2019-01-21" },
    ],
  },
  Switzerland: {
    headOfState: [
      { name: "(없음)" },
    ],
  },
  Syria: {
    leader: [
      { name: "대통령 바샤르 알아사드", from: "2000-07-17", until: "2024-12-08" },
      { name: "대통령 아흐마드 알샤라아", from: "2025-01-29" },
    ],
    headOfState: [
      { name: "(없음)" },
    ],
  },
  Taiwan: {
    leader: [
      { name: "총통 천수이볜", from: "2000-05-20", until: "2008-05-20" },
      { name: "총통 마잉주", from: "2008-05-20", until: "2016-05-20" },
      { name: "총통 차이잉원", from: "2016-05-20", until: "2024-05-20" },
      { name: "총통 라이칭더", from: "2024-05-20" },
    ],
    headOfState: [
      { name: "(없음)" },
    ],
    deputy: [
      { name: "부총통 뤼슈롄", from: "2000-05-20", until: "2008-05-20" },
      { name: "부총통 샤오완창", from: "2008-05-20", until: "2012-05-20" },
      { name: "부총통 우둔이", from: "2012-05-20", until: "2016-05-20" },
      { name: "부총통 천젠런", from: "2016-05-20", until: "2020-05-20" },
      { name: "부총통 라이칭더", from: "2020-05-20", until: "2024-05-20" },
      { name: "부총통 샤오메이친", from: "2024-05-20" },
    ],
  },
  Tajikistan: {
    leader: [
      { name: "대통령 에모말리 라흐몬", from: "1994-11-16" },
    ],
    headOfState: [
      { name: "(없음)" },
    ],
    deputy: [
      { name: "총리 코히르 라술조다", from: "2013-11-27" },
    ],
  },
  Tanzania: {
    leader: [
      { name: "대통령 자카야 키크웨테", from: "2005-12-21", until: "2015-11-05" },
      { name: "대통령 존 마구풀리", from: "2015-11-05", until: "2021-03-17" },
      { name: "대통령 사미아 술루후 하산", from: "2021-03-19" },
    ],
    headOfState: [
      { name: "(없음)" },
    ],
    deputy: [
      { name: "부통령 사미아 술루후 하산", from: "2015-11-05", until: "2021-03-19" },
      { name: "부통령 필리프 음팡고", from: "2021-03-30", until: "2025-11-03" },
      { name: "부통령 에마누엘 은침비", from: "2025-11-03" },
    ],
  },
  Thailand: {
    leader: [
      { name: "총리 탁신 친나왓", from: "2001-02-09", until: "2006-09-19" },
      { name: "총리 수라윳 출라논", from: "2006-10-01", until: "2008-01-29" },
      { name: "총리 사막 순타라웻", from: "2008-01-29", until: "2008-09-09" },
      { name: "총리 솜차이 웡사왓", from: "2008-09-18", until: "2008-12-02" },
      { name: "총리 아피싯 웨차치와", from: "2008-12-17", until: "2011-08-05" },
      { name: "총리 잉락 친나왓", from: "2011-08-05", until: "2014-05-07" },
      { name: "총리 쁘라윳 짠오차", from: "2014-08-24", until: "2023-08-22" },
      { name: "총리 세타 타위신", from: "2023-08-22", until: "2024-08-14" },
      { name: "총리 패통탄 친나왓", from: "2024-08-16", until: "2025-08-29" },
      { name: "총리 아누틴 찬위라꾼", from: "2025-09-07" },
    ],
    headOfState: [
      { name: "국왕 푸미폰 아둔야뎃", until: "2016-10-13" },
      { name: "국왕 푸미폰 아둔야뎃", from: "1946-06-09", until: "2016-10-13" },
      { name: "국왕 마하 와치랄롱꼰", from: "2016-12-01" },
    ],
  },
  "Timor-Leste": {
    leader: [
      { name: "총리 마리 알카티리", from: "2002-05-20", until: "2006-06-26" },
      { name: "총리 조제 하무스오르타", from: "2006-07-10", until: "2007-05-19" },
      { name: "총리 샤나나 구스망", from: "2007-08-08", until: "2015-02-16" },
      { name: "총리 루이 마리아 드 아라우주", from: "2015-02-16", until: "2017-09-15" },
      { name: "총리 마리 알카티리", from: "2017-09-15", until: "2018-06-22" },
      { name: "총리 타우르 마탄 루아크", from: "2018-06-22", until: "2023-07-01" },
      { name: "총리 사나나 구스망", from: "2023-07-01" },
    ],
    headOfState: [
      { name: "대통령 샤나나 구스망", from: "2002-05-20", until: "2007-05-20" },
      { name: "대통령 조제 하무스오르타", from: "2007-05-20", until: "2012-05-20" },
      { name: "대통령 타우르 마탄 루아크", from: "2012-05-20", until: "2017-05-20" },
      { name: "대통령 프란시스쿠 구테흐스", from: "2017-05-20", until: "2022-05-20" },
      { name: "대통령 조제 라모스오르타", from: "2022-05-20" },
    ],
  },
  Togo: {
    leader: [
      { name: "대통령 포르 냐싱베", from: "2005-05-04", until: "2025-05-03" },
      { name: "각료평의회 의장 포르 냐싱베", from: "2025-05-03" },
    ],
    headOfState: [
      { name: "대통령 장뤼시앵 사비 드 토베", from: "2025-05-03" },
    ],
    deputy: [
      { name: "총리 코미 셀롬 클라수", from: "2015-06-05", until: "2020-09-28" },
      { name: "총리 빅투아르 토메가 도그베", from: "2020-09-28", until: "2025-05-03" },
    ],
  },
  Tonga: {
    leader: [
      { name: "총리 울루칼랄라 라바카 아타", from: "2000-01-03", until: "2006-02-11" },
      { name: "총리 펠레티 세벨레", from: "2006-02-11", until: "2010-12-22" },
      { name: "총리 투이바카노 경", from: "2010-12-22", until: "2014-12-30" },
      { name: "총리 아킬리시 포히바", from: "2014-12-30", until: "2019-09-12" },
      { name: "총리 포히바 투이오네토아", from: "2019-10-08", until: "2021-12-27" },
      { name: "총리 시아오시 소발레니", from: "2021-12-27", until: "2024-12-09" },
      { name: "총리 아이사케 에케", from: "2025-01-22" },
    ],
    headOfState: [
      { name: "국왕 타우파아하우 투포우 4세", from: "1965-12-16", until: "2006-09-10" },
      { name: "국왕 조지 투포우 5세", from: "2006-09-11", until: "2012-03-18" },
      { name: "국왕 투포우 6세", from: "2012-03-18" },
    ],
  },
  "Trinidad and Tobago": {
    leader: [
      { name: "총리 패트릭 매닝", from: "2001-12-24", until: "2010-05-26" },
      { name: "총리 카믈라 퍼사드비세사르", from: "2010-05-26", until: "2015-09-09" },
      { name: "총리 키스 롤리", from: "2015-09-09", until: "2025-03-16" },
      { name: "총리 카믈라 퍼사드비세사르", from: "2025-05-01" },
    ],
    headOfState: [
      { name: "대통령 조지 맥스웰 리처즈", from: "2003-03-17", until: "2013-03-18" },
      { name: "대통령 앤서니 카모나", from: "2013-03-18", until: "2018-03-19" },
      { name: "대통령 폴라메이 위크스", from: "2018-03-19", until: "2023-03-20" },
      { name: "대통령 크리스틴 캉갈루", from: "2023-03-20" },
    ],
  },
  Tunisia: {
    leader: [
      { name: "대통령 지네 엘아비디네 벤 알리", from: "1987-11-07", until: "2011-01-14" },
      { name: "임시대통령 푸아드 메바자", from: "2011-01-15", until: "2011-12-13" },
      { name: "대통령 몬세프 마르주키", from: "2011-12-13", until: "2014-12-31" },
      { name: "대통령 베지 카이드 에셉시", from: "2014-12-31", until: "2019-07-25" },
      { name: "대통령 카이스 사이에드", from: "2019-10-23" },
    ],
    headOfState: [
      { name: "(없음)" },
    ],
    deputy: [
      { name: "총리 하비브 에시드", from: "2015-02-06", until: "2016-08-27" },
      { name: "총리 유세프 샤헤드", from: "2016-08-27", until: "2020-02-27" },
      { name: "총리 엘리에스 파크파크", from: "2020-02-27", until: "2020-09-02" },
      { name: "총리 히셈 메시시", from: "2020-09-02", until: "2021-07-25" },
      { name: "총리 나즐라 부덴", from: "2021-10-11", until: "2023-08-01" },
      { name: "총리 아흐메드 하샤니", from: "2023-08-01", until: "2024-08-07" },
      { name: "총리 카멜 마두리", from: "2024-08-07", until: "2025-03-21" },
      { name: "총리 사라 자아프라니 젠즈리", from: "2025-03-21" },
    ],
  },
  Turkey: {
    leader: [
      { name: "총리 레제프 타이이프 에르도안", from: "2003-03-14", until: "2014-08-28" },
      { name: "대통령 레제프 타이이프 에르도안", from: "2014-08-28" },
    ],
    headOfState: [
      { name: "(없음)" },
      { name: "대통령 아흐메트 네즈데트 세제르", from: "2000-05-16", until: "2007-08-28" },
      { name: "대통령 압둘라 귈", from: "2007-08-28", until: "2014-08-28" },
    ],
    deputy: [
      { name: "총리 아흐메트 다우토을루", from: "2014-08-28", until: "2016-05-24" },
      { name: "총리 비날리 이을드름", from: "2016-05-24", until: "2018-07-09" },
      { name: "부통령 푸아트 옥타이", from: "2018-07-10", until: "2023-06-04" },
      { name: "부통령 제브데트 이을마즈", from: "2023-06-04" },
    ],
  },
  Turkmenistan: {
    leader: [
      { name: "대통령 사파르무라트 니야조프", from: "1990-10-27", until: "2006-12-21" },
      { name: "대통령 구르반굴리 베르디무하메도프", from: "2007-02-14", until: "2022-03-19" },
      { name: "대통령 세르다르 베르디무하메도프", from: "2022-03-19" },
    ],
    headOfState: [
      { name: "(없음)" },
      { name: "대통령 사파르무라트 니야조프", from: "1990-10-27", until: "2006-12-21" },
    ],
    deputy: [
      { name: "(없음)" },
    ],
  },
  Tuvalu: {
    leader: [
      { name: "총리 마아티아 토아파", from: "2004-10-11", until: "2006-08-14" },
      { name: "총리 아피사이 이엘레미아", from: "2006-08-14", until: "2010-09-29" },
      { name: "총리 마아티아 토아파", from: "2010-09-29", until: "2010-12-24" },
      { name: "총리 윌리 텔라비", from: "2010-12-24", until: "2013-08-01" },
      { name: "총리 에넬레 소포아가", from: "2013-08-05", until: "2019-09-19" },
      { name: "총리 카우세아 나타노", from: "2019-09-19", until: "2024-02-26" },
      { name: "총리 펠레티 테오", from: "2024-02-26" },
    ],
    headOfState: [
      { name: "여왕 엘리자베스 2세", until: "2022-09-08" },
      { name: "국왕 찰스 3세", from: "2022-09-08" },
    ],
  },
  Uganda: {
    leader: [
      { name: "대통령 요웨리 무세베니", from: "1986-01-29" },
    ],
    headOfState: [
      { name: "(없음)" },
    ],
    deputy: [
      { name: "부통령 에드워드 세칸디", from: "2011-05-24", until: "2021-06-21" },
      { name: "부통령 제시카 알루포", from: "2021-06-21" },
    ],
  },
  Ukraine: {
    leader: [
      { name: "총리 유리 예하누로프", from: "2005-09-22", until: "2006-08-04" },
      { name: "총리 빅토르 야누코비치", from: "2006-08-04", until: "2007-12-18" },
      { name: "총리 율리야 티모셴코", from: "2007-12-18", until: "2010-03-11" },
      { name: "총리 미콜라 아자로프", from: "2010-03-11", until: "2014-01-28" },
      { name: "총리 권한대행 세르히 아르부조프", from: "2014-01-28", until: "2014-02-27" },
      { name: "대통령 페트로 포로셴코", from: "2014-06-07", until: "2019-05-20" },
      { name: "대통령 볼로디미르 젤렌스키", from: "2019-05-20" },
    ],
    headOfState: [
      { name: "(없음)" },
      { name: "대통령 빅토르 유셴코", from: "2005-01-23", until: "2010-02-25" },
      { name: "대통령 빅토르 야누코비치", from: "2010-02-25", until: "2014-02-22" },
      { name: "대통령 권한대행 올렉산드르 투르치노프", from: "2014-02-23", until: "2014-06-07" },
    ],
    deputy: [
      { name: "총리 아르세니 야체뉴크", from: "2014-02-27", until: "2016-04-14" },
      { name: "총리 볼로디미르 흐로이스만", from: "2016-04-14", until: "2019-08-29" },
      { name: "총리 올렉시 혼차루크", from: "2019-08-29", until: "2020-03-04" },
      { name: "총리 데니스 시미할", from: "2020-03-04", until: "2025-07-17" },
      { name: "총리 율리아 스비리덴코", from: "2025-07-17" },
    ],
  },
  "United Arab Emirates": {
    leader: [
      { name: "대통령 할리파 빈 자이드 알나하얀", from: "2004-11-03", until: "2022-05-13" },
      { name: "대통령 무함마드 빈 자이드 알나하얀", from: "2022-05-14" },
    ],
    headOfState: [
      { name: "(없음)" },
    ],
    deputy: [
      { name: "총리 무함마드 빈 라시드 알막툼", from: "2006-02-11" },
    ],
  },
  "United Kingdom": {
    leader: [
      { name: "총리 토니 블레어", from: "1997-05-02", until: "2007-06-27" },
      { name: "총리 고든 브라운", from: "2007-06-27", until: "2010-05-11" },
      { name: "총리 데이비드 캐머런", from: "2010-05-11", until: "2016-07-13" },
      { name: "총리 테리사 메이", from: "2016-07-13", until: "2019-07-24" },
      { name: "총리 보리스 존슨", from: "2019-07-24", until: "2022-09-06" },
      { name: "총리 리즈 트러스", from: "2022-09-06", until: "2022-10-25" },
      { name: "총리 리시 수낵", from: "2022-10-25", until: "2024-07-05" },
      { name: "총리 키어 스타머", from: "2024-07-05" },
    ],
    headOfState: [
      { name: "여왕 엘리자베스 2세", until: "2022-09-08" },
      { name: "국왕 찰스 3세", from: "2022-09-08" },
    ],
    deputy: [
      { name: "부총리 존 프레스콧", from: "1997-05-02", until: "2007-06-27" },
      { name: "부총리 닉 클레그", from: "2010-05-11", until: "2015-05-08" },
      { name: "부총리 도미닉 라브", from: "2021-09-15", until: "2022-09-06" },
      { name: "부총리 도미닉 라브", from: "2022-10-25", until: "2023-04-21" },
      { name: "부총리 올리버 다우든", from: "2023-04-21", until: "2024-07-05" },
      { name: "부총리 앤절라 레이너", from: "2024-07-05", until: "2025-09-05" },
      { name: "부총리 데이비드 래미", from: "2025-09-05" },
    ],
  },
  "United States": {
    leader: [
      { name: "대통령 조지 W. 부시", from: "2001-01-20", until: "2009-01-20" },
      { name: "대통령 버락 오바마", from: "2009-01-20", until: "2017-01-20" },
      { name: "대통령 도널드 트럼프", from: "2017-01-20", until: "2021-01-20" },
      { name: "대통령 조 바이든", from: "2021-01-20", until: "2025-01-20" },
      { name: "대통령 도널드 트럼프", from: "2025-01-20" },
    ],
    headOfState: [
      { name: "(없음)" },
      { name: "대통령 조지 W. 부시", from: "2001-01-20", until: "2009-01-20" },
    ],
    deputy: [
      { name: "부통령 딕 체니", from: "2001-01-20", until: "2009-01-20" },
      { name: "부통령 조 바이든", from: "2009-01-20", until: "2017-01-20" },
      { name: "부통령 마이크 펜스", from: "2017-01-20", until: "2021-01-20" },
      { name: "부통령 카멀라 해리스", from: "2021-01-20", until: "2025-01-20" },
      { name: "부통령 J.D. 밴스", from: "2025-01-20" },
    ],
  },
  Uruguay: {
    leader: [
      { name: "대통령 타바레 바스케스", from: "2005-03-01", until: "2010-03-01" },
      { name: "대통령 호세 무히카", from: "2010-03-01", until: "2015-03-01" },
      { name: "대통령 타바레 바스케스", from: "2015-03-01", until: "2020-03-01" },
      { name: "대통령 루이스 라카예 포우", from: "2020-03-01", until: "2025-03-01" },
      { name: "대통령 야만두 오르시", from: "2025-03-01" },
    ],
    headOfState: [
      { name: "(없음)" },
      { name: "대통령 타바레 바스케스", from: "2005-03-01", until: "2010-03-01" },
      { name: "대통령 호세 무히카", from: "2010-03-01", until: "2015-03-01" },
    ],
    deputy: [
      { name: "부통령 로돌포 닌 노보아", from: "2005-03-01", until: "2010-03-01" },
      { name: "부통령 다닐로 아스토리", from: "2010-03-01", until: "2015-03-01" },
      { name: "부통령 라울 센디크", from: "2015-03-01", until: "2017-09-01" },
      { name: "부통령 루시아 토폴란스키", from: "2017-09-01", until: "2020-03-01" },
      { name: "부통령 베아트리스 아르히몬", from: "2020-03-01", until: "2025-03-01" },
      { name: "부통령 카롤리나 코세", from: "2025-03-01" },
    ],
  },
  Uzbekistan: {
    leader: [
      { name: "대통령 이슬람 카리모프", from: "1990-03-24", until: "2016-09-02" },
      { name: "대통령 샤브카트 미르지요예프", from: "2016-12-14" },
    ],
    headOfState: [
      { name: "(없음)" },
    ],
    deputy: [
      { name: "총리 샤브카트 미르지요예프", from: "2003-12-11", until: "2016-12-14" },
      { name: "총리 압둘라 아리포프", from: "2016-12-14" },
    ],
  },
  Vanuatu: {
    leader: [
      { name: "총리 함 리니", from: "2004-12-11", until: "2008-09-22" },
      { name: "총리 에드워드 나타페이", from: "2008-09-22", until: "2010-12-02" },
      { name: "총리 사토 킬만", from: "2010-12-02", until: "2013-03-23" },
      { name: "총리 모아나 카르카세스 칼로실", from: "2013-03-23", until: "2014-05-15" },
      { name: "총리 조 나투만", from: "2014-05-15", until: "2015-06-11" },
      { name: "총리 샤를로 살와이", from: "2016-02-11", until: "2020-04-20" },
      { name: "총리 밥 러프먼", from: "2020-04-20", until: "2022-11-04" },
      { name: "총리 이슈마엘 칼사카우", from: "2022-11-04", until: "2023-09-04" },
      { name: "총리 샤를로 살와이", from: "2023-10-06", until: "2025-02-11" },
      { name: "총리 조섬 나파트", from: "2025-02-11" },
    ],
    headOfState: [
      { name: "대통령 볼드윈 론스데일", from: "2014-09-22", until: "2017-06-17" },
      { name: "대통령 탈리스 오베드 모지스", from: "2017-07-06", until: "2022-07-06" },
      { name: "대통령 니케니케 부로바라부", from: "2022-07-23" },
    ],
  },
  Venezuela: {
    leader: [
      { name: "대통령 우고 차베스", from: "1999-02-02", until: "2013-03-05" },
      { name: "대통령 니콜라스 마두로", from: "2013-04-19" },
    ],
    headOfState: [
      { name: "(없음)" },
      { name: "대통령 우고 차베스", from: "1999-02-02", until: "2013-03-05" },
    ],
    deputy: [
      { name: "부통령 타레크 엘아이사미", from: "2017-01-04", until: "2018-06-14" },
      { name: "부통령 델시 로드리게스", from: "2018-06-14" },
    ],
  },
  Vietnam: {
    leader: [
      { name: "총비서 농득마인", from: "2001-04-22", until: "2011-01-19" },
      { name: "공산당 서기장 응우옌푸쫑", from: "2011-01-19", until: "2024-07-19" },
      { name: "공산당 서기장 또럼", from: "2024-08-03" },
    ],
    headOfState: [
      { name: "국가주석 쩐득르엉", from: "1997-09-24", until: "2006-06-27" },
      { name: "국가주석 응우옌민찌엣", from: "2006-06-27", until: "2011-07-25" },
      { name: "국가주석 쯔엉떤상", from: "2011-07-25", until: "2016-04-02" },
      { name: "국가주석 쩐다이꽝", from: "2016-04-02", until: "2018-09-21" },
      { name: "국가주석 응우옌푸쫑", from: "2018-10-23", until: "2021-04-05" },
      { name: "국가주석 응우옌쑤언푹", from: "2021-04-05", until: "2023-01-18" },
      { name: "국가주석 보반트엉", from: "2023-03-02", until: "2024-03-21" },
      { name: "국가주석 또럼", from: "2024-05-22", until: "2024-10-21" },
      { name: "국가주석 르엉끄엉", from: "2024-10-21" },
    ],
    deputy: [
      { name: "총리 판반카이", from: "1997-09-25", until: "2006-06-27" },
      { name: "총리 응우옌떤중", from: "2006-06-27", until: "2016-04-07" },
      { name: "총리 응우옌쑤언푹", from: "2016-04-07", until: "2021-04-05" },
      { name: "총리 팜민찐", from: "2021-04-05" },
    ],
  },
  Yemen: {
    leader: [
      { name: "대통령 알리 압둘라 살레", from: "1990-05-22", until: "2012-02-25" },
      { name: "대통령 압드라보 만수르 하디", from: "2012-02-25", until: "2022-04-07" },
      { name: "대통령위원회 의장 라샤드 알알리미", from: "2022-04-07" },
    ],
    headOfState: [
      { name: "(없음)" },
    ],
    deputy: [
      { name: "부통령 압드라부 만수르 하디", from: "1994-10-03", until: "2012-02-25" },
    ],
  },
  Zambia: {
    leader: [
      { name: "대통령 레비 음와나와사", from: "2002-01-02", until: "2008-08-19" },
      { name: "대통령 루피아 반다", from: "2008-11-02", until: "2011-09-23" },
      { name: "대통령 마이클 사타", from: "2011-09-23", until: "2014-10-28" },
      { name: "대통령 권한대행 가이 스콧", from: "2014-10-29", until: "2015-01-25" },
      { name: "대통령 에드가 룽구", from: "2015-01-25", until: "2021-08-24" },
      { name: "대통령 하카인데 히칠레마", from: "2021-08-24" },
    ],
    headOfState: [
      { name: "(없음)" },
    ],
    deputy: [
      { name: "부통령 이농게 위나", from: "2015-01-26", until: "2021-08-24" },
      { name: "부통령 무탈레 날루망고", from: "2021-08-24" },
    ],
  },
  Zimbabwe: {
    leader: [
      { name: "대통령 로버트 무가베", from: "1987-12-31", until: "2017-11-21" },
      { name: "대통령 에머슨 음낭가과", from: "2017-11-24" },
    ],
    headOfState: [
      { name: "(없음)" },
    ],
    deputy: [
      { name: "총리 모건 창기라이", from: "2009-02-11", until: "2013-09-11" },
      { name: "부통령 에머슨 음낭가과", from: "2014-12-12", until: "2017-11-06" },
      { name: "부통령 콘스탄티노 치웽가", from: "2017-12-28" },
    ],
  },
};

// THE PALETTE FOR DIVERGENCE. When the campaign's own events replace an
// officeholder — a fall, a snap election, a coup the player engineered — the
// model must name a successor, and a 12B invents one ("총리 말리언 바리스",
// live). These are the era's REAL contenders: opposition leaders, major
// candidates, heirs apparent, each with the window of their political
// relevance (usually ending the day they take office and move to REFERENCE
// above). They are a palette, never an instruction — the engine never forces
// one, it only shows the model real people before it reaches for an invention.
// Entries: { name: "이름 (당시 위치)", from?, until? }.
export const POLITICAL_FIGURES = {
  Afghanistan: [
    { name: "압둘라 압둘라 (2009·2014 대선 후보)", from: "2009-05-01", until: "2014-09-29" },
    { name: "아슈라프 가니 (대선 후보)", from: "2009-05-01", until: "2014-09-29" },
  ],
  Algeria: [
    { name: "알리 벤플리스 (전 총리, 대선 후보)", from: "2014-01-01", until: "2019-12-12" },
  ],
  Angola: [
    { name: "이사이아스 사마쿠바 (UNITA 총재, 대선 후보)", from: "2006-01-01", until: "2019-11-01" },
    { name: "주앙 로렌수 (국방장관, 여당 대선 후보)", from: "2016-08-01", until: "2017-09-26" },
    { name: "아달베르투 코스타 주니오르 (UNITA 총재, 대선 후보)", from: "2019-11-01" },
  ],
  Argentina: [
    { name: "마우리시오 마크리 (부에노스아이레스 시장, 대선 후보)", from: "2007-12-10", until: "2015-12-10" },
    { name: "다니엘 시올리 (부에노스아이레스 주지사, 대선 후보)", from: "2007-12-10", until: "2015-11-22" },
    { name: "엘리사 카리오 (시민연합 대표, 대선 후보)", from: "2007-01-01", until: "2019-12-10" },
    { name: "세르히오 마사 (전 내각수반, 대선 후보)", from: "2013-01-01" },
    { name: "크리스티나 페르난데스 데 키르치네르 (전 대통령, 야권 지도자)", from: "2015-12-10", until: "2019-12-10" },
    { name: "하비에르 밀레이 (자유전진 대표, 하원의원)", from: "2021-01-01", until: "2023-12-10" },
  ],
  Armenia: [
    { name: "레본 테르페트로샨 (전 대통령, 2008 대선 후보)", from: "2007-09-21", until: "2008-03-01" },
    { name: "니콜 파시냔 (언론인, 야권 지도자)", from: "2012-05-06", until: "2018-05-08" },
  ],
  Australia: [
    { name: "킴 비즐리 (노동당 대표)", from: "2005-01-28", until: "2006-12-04" },
    { name: "케빈 러드 (노동당 대표)", from: "2006-12-04", until: "2007-12-03" },
    { name: "말콤 턴불 (자유당 대표, 야당 지도자)", from: "2008-09-16", until: "2009-12-01" },
    { name: "토니 애벗 (자유당 대표, 야당 지도자)", from: "2009-12-01", until: "2013-09-18" },
    { name: "빌 쇼튼 (노동당 대표)", from: "2013-10-13", until: "2019-05-30" },
    { name: "앤서니 앨버니지 (노동당 대표)", from: "2019-05-30", until: "2022-05-23" },
    { name: "피터 더턴 (자유당 대표, 야당 지도자)", from: "2022-05-30", until: "2025-05-03" },
  ],
  Austria: [
    { name: "하인츠크리스티안 슈트라헤 (자유당 대표)", from: "2005-04-23", until: "2017-12-18" },
    { name: "노르베르트 호퍼 (자유당 대선 후보)", from: "2016-01-01", until: "2016-12-04" },
    { name: "알렉산더 판데어벨렌 (녹색계 무소속 대선 후보)", from: "2016-01-01", until: "2017-01-26" },
  ],
  Bangladesh: [
    { name: "셰이크 하시나 (아와미연맹 총재, 야당 지도자)", from: "2006-01-01", until: "2009-01-06" },
    { name: "칼레다 지아 (방글라데시민족주의당(BNP) 총재)", from: "2009-01-06" },
  ],
  Belarus: [
    { name: "알렉산드르 밀린케비치 (2006 대선 야권 후보)", from: "2006-01-01", until: "2006-12-31" },
    { name: "안드레이 산니코프 (2010 대선 야권 후보)", from: "2010-01-01", until: "2010-12-31" },
    { name: "스뱌틀라나 치하노우스카야 (야권 대선 후보)", from: "2020-08-09" },
  ],
  Belgium: [
    { name: "바르트 더 베버 (신플람스연맹 대표)", from: "2004-10-01", until: "2025-02-03" },
  ],
  Bolivia: [
    { name: "사무엘 도리아 메디나 (대선 후보)", from: "2005-01-01", until: "2014-12-31" },
    { name: "카를로스 메사 (전 대통령, 대선 후보)", from: "2018-01-01", until: "2020-12-31" },
    { name: "에보 모랄레스 (전 대통령, 사회주의운동당 지도자)", from: "2019-11-10" },
  ],
  Brazil: [
    { name: "제라우두 아우키밍 (브라질사회민주당 대선 후보)", from: "2006-01-01", until: "2023-01-01" },
    { name: "조제 세하 (브라질사회민주당 대선 후보)", from: "2006-01-01", until: "2010-12-31" },
    { name: "마리나 시우바 (대선 후보)", from: "2010-01-01", until: "2018-12-31" },
    { name: "아에시우 네베스 (브라질사회민주당 대선 후보)", from: "2014-01-01", until: "2016-12-31" },
    { name: "자이르 보우소나루 (연방하원의원, 대선 후보)", from: "2017-01-01", until: "2019-01-01" },
    { name: "페르난두 아다지 (노동자당 대선 후보)", from: "2018-01-01", until: "2018-12-31" },
    { name: "시루 고메스 (대선 후보)", from: "2018-01-01", until: "2022-12-31" },
    { name: "루이스 이나시우 룰라 다 시우바 (전 대통령, 대선 후보)", from: "2021-01-01", until: "2023-01-01" },
  ],
  Cambodia: [
    { name: "삼 랭시 (야당 지도자, 캄보디아구국당 대표)", from: "2006-01-01" },
    { name: "켐 소카 (캄보디아구국당 대표)", from: "2017-03-01", until: "2017-09-03" },
  ],
  Cameroon: [
    { name: "존 프루 은디 (사회민주전선 대표)", from: "2006-01-01", until: "2023-06-12" },
    { name: "모리스 캄토 (2018 대선 후보)", from: "2018-01-01" },
  ],
  Canada: [
    { name: "잭 레이턴 (신민주당 대표)", from: "2003-01-25", until: "2011-08-22" },
    { name: "스테판 디옹 (자유당 대표)", from: "2006-12-02", until: "2008-12-10" },
    { name: "마이클 이그나티에프 (자유당 대표)", from: "2008-12-10", until: "2011-05-02" },
    { name: "토마스 멀케어 (신민주당 대표)", from: "2012-03-24", until: "2017-10-01" },
    { name: "저스틴 트뤼도 (자유당 대표)", from: "2013-04-14", until: "2015-11-04" },
    { name: "앤드루 시어 (보수당 대표)", from: "2017-05-27", until: "2020-08-24" },
    { name: "피에르 푸알리에브르 (보수당 대표)", from: "2022-09-10" },
  ],
  Chile: [
    { name: "세바스티안 피녜라 (국민혁신당 대선 후보)", from: "2005-01-01", until: "2010-03-11" },
    { name: "에두아르도 프레이 (전 대통령, 대선 후보)", from: "2009-01-01", until: "2010-01-17" },
    { name: "마르코 엔리케스오미나미 (무소속 대선 후보)", from: "2009-01-01", until: "2009-12-31" },
    { name: "에벨린 마테이 (대선 후보)", from: "2013-01-01", until: "2013-12-31" },
    { name: "호세 안토니오 카스트 (공화당 대선 후보)", from: "2017-01-01" },
    { name: "가브리엘 보리치 (하원의원, 대선 후보)", from: "2021-01-01", until: "2022-03-11" },
  ],
  China: [
    { name: "리커창 (정치국 상무위원, 차기 지도부 경쟁자)", from: "2007-10-22", until: "2013-03-14" },
    { name: "보시라이 (충칭시 당서기, 정치국 위원)", from: "2007-11-01", until: "2012-03-15" },
  ],
  Colombia: [
    { name: "카를로스 가비리아 (대안민주당 대선 후보)", from: "2006-01-01", until: "2006-12-31" },
    { name: "안타나스 모쿠스 (녹색당 대선 후보)", from: "2010-01-01", until: "2010-12-31" },
    { name: "오스카르 이반 술루아가 (대선 후보)", from: "2014-01-01", until: "2014-12-31" },
    { name: "구스타보 페트로 (보고타 시장, 대선 후보)", from: "2010-01-01", until: "2022-08-07" },
    { name: "이반 두케 (대선 후보)", from: "2017-01-01", until: "2018-08-07" },
    { name: "세르히오 파하르도 (대선 후보)", from: "2018-01-01", until: "2022-12-31" },
    { name: "로돌포 에르난데스 (대선 후보)", from: "2022-01-01", until: "2022-12-31" },
  ],
  "Cote d'Ivoire": [
    { name: "앙리 코낭 베디에 (PDCI 대표, 전 대통령)", from: "2006-01-01", until: "2023-08-01" },
    { name: "기욤 소로 (전 국회의장, 대권 주자)", from: "2019-02-01" },
  ],
  Czechia: [
    { name: "카렐 슈바르첸베르크 (TOP 09 대표, 대선 결선 후보)", from: "2013-01-11", until: "2013-01-26" },
    { name: "안드레이 바비시 (ANO 대표)", from: "2013-10-26", until: "2017-12-06" },
    { name: "페트르 파벨 (전 나토 군사위원장, 대선 후보)", from: "2023-01-13", until: "2023-03-09" },
  ],
  "Democratic Republic of the Congo": [
    { name: "에티엔 치세케디 (야당 지도자, 대선 후보)", from: "2006-01-01", until: "2017-02-01" },
    { name: "장피에르 벰바 (2006 대선 후보, MLC 대표)", from: "2006-07-01", until: "2008-05-24" },
    { name: "모이즈 카툼비 (야당 지도자, 대선 후보)", from: "2015-09-01" },
    { name: "펠릭스 치세케디 (UDPS 대표, 대선 후보)", from: "2017-03-01", until: "2019-01-24" },
    { name: "마르탱 파율루 (야당 대선 후보)", from: "2018-11-01" },
  ],
  Denmark: [
    { name: "헬레 토르닝슈미트 (사회민주당 대표)", from: "2005-04-12", until: "2011-10-03" },
    { name: "메테 프레데릭센 (사회민주당 대표)", from: "2015-06-28", until: "2019-06-27" },
  ],
  "Dominican Republic": [
    { name: "이폴리토 메히아 (전 대통령, 민주혁명당 대선 후보)", from: "2011-01-01", until: "2012-05-20" },
    { name: "레오넬 페르난데스 (전 대통령, 대선 후보)", from: "2012-08-16" },
    { name: "루이스 아비나데르 (현대혁명당 대선 후보)", from: "2016-01-01", until: "2020-08-16" },
  ],
  Ecuador: [
    { name: "알바로 노보아 (대선 후보)", from: "2006-01-01", until: "2006-12-31" },
    { name: "루시오 구티에레스 (전 대통령, 대선 후보)", from: "2009-01-01", until: "2013-12-31" },
    { name: "기예르모 라소 (대선 후보)", from: "2013-01-01", until: "2021-05-24" },
    { name: "안드레스 아라우스 (대선 후보)", from: "2021-01-01", until: "2021-12-31" },
    { name: "다니엘 노보아 (대선 후보)", from: "2023-01-01", until: "2023-11-23" },
  ],
  Egypt: [
    { name: "무함마드 엘바라데이 (야권 지도자, 전 IAEA 사무총장)", from: "2010-02-01", until: "2013-07-09" },
    { name: "아므르 무사 (전 아랍연맹 사무총장, 대선 후보)", from: "2011-06-01", until: "2012-06-30" },
    { name: "아흐메드 샤피크 (대선 후보)", from: "2012-03-01", until: "2012-06-30" },
    { name: "함딘 사바히 (대선 후보)", from: "2012-03-01", until: "2014-05-29" },
  ],
  "El Salvador": [
    { name: "나이브 부켈레 (산살바도르 시장, 대선 후보)", from: "2015-05-01", until: "2019-06-01" },
  ],
  Ethiopia: [
    { name: "비르투칸 미데크사 (통합민주정의당 대표, 야당 지도자)", from: "2008-01-01", until: "2011-01-01" },
    { name: "베르하누 네가 (야당 지도자, 긴보트7 창설자)", from: "2005-05-01" },
    { name: "메레라 구디나 (오로모인민회의 대표, 야당 지도자)", from: "2006-01-01" },
  ],
  Finland: [
    { name: "티모 소이니 (핀란드인당 대표)", from: "2006-01-01", until: "2015-05-29" },
    { name: "사울리 니니스퇴 (국민연합당 대선 후보)", from: "2006-01-01", until: "2012-03-01" },
  ],
  France: [
    { name: "세골렌 루아얄 (사회당 대선 후보)", from: "2006-11-01", until: "2007-05-06" },
    { name: "프랑수아 바이루 (민주운동 대표, 대선 후보)", from: "2007-01-01", until: "2012-05-06" },
    { name: "마린 르펜 (국민전선 대표, 대선 후보)", from: "2011-01-16" },
    { name: "장뤼크 멜랑숑 (좌파 대선 후보)", from: "2011-06-01" },
    { name: "에마뉘엘 마크롱 (앙마르슈 창립자, 대선 후보)", from: "2016-04-06", until: "2017-05-14" },
    { name: "프랑수아 피용 (공화당 대선 후보)", from: "2016-11-27", until: "2017-05-07" },
  ],
  Gabon: [
    { name: "장 핑 (2016 대선 후보)", from: "2014-01-01" },
  ],
  Georgia: [
    { name: "비지나 이바니슈빌리 (조지아의 꿈 창설자)", from: "2012-04-21", until: "2012-10-25" },
    { name: "미헤일 사카슈빌리 (전 대통령, 야권 지도자)", from: "2013-11-17" },
  ],
  Germany: [
    { name: "페어 슈타인브뤼크 (사민당 총리 후보)", from: "2012-10-01", until: "2013-12-17" },
    { name: "마르틴 슐츠 (사민당 대표, 총리 후보)", from: "2017-01-24", until: "2018-02-13" },
    { name: "알리스 바이델 (독일대안당 공동대표, 총리 후보)", from: "2017-04-01" },
    { name: "아르민 라셰트 (기민련 대표, 총리 후보)", from: "2021-01-16", until: "2021-12-08" },
    { name: "프리드리히 메르츠 (기민련 대표)", from: "2022-01-31", until: "2025-05-06" },
  ],
  Ghana: [
    { name: "존 아타 밀스 (NDC 대선 후보)", from: "2006-12-01", until: "2009-01-07" },
    { name: "나나 아쿠포아도 (NPP 대선 후보)", from: "2007-12-01", until: "2017-01-07" },
    { name: "존 드라마니 마하마 (NDC 대선 후보, 전 대통령)", from: "2017-01-07", until: "2025-01-07" },
  ],
  Greece: [
    { name: "게오르기오스 파판드레우 (사회당 대표)", from: "2006-01-01", until: "2009-10-06" },
    { name: "알렉시스 치프라스 (시리자 대표)", from: "2008-02-10", until: "2015-01-26" },
    { name: "안토니스 사마라스 (신민주주의당 대표)", from: "2009-11-29", until: "2012-06-20" },
    { name: "키리아코스 미초타키스 (신민주주의당 대표)", from: "2016-01-10", until: "2019-07-08" },
  ],
  Guinea: [
    { name: "셀루 달레인 디알로 (UFDG 대표, 대선 후보)", from: "2010-06-01" },
  ],
  Hungary: [
    { name: "페렌츠 주르차니 (전 총리, 민주연합 대표)", from: "2009-04-14" },
    { name: "고르돈 버이너이 (전 총리, 야권 연대 지도자)", from: "2012-10-23", until: "2014-04-06" },
    { name: "페테르 마르키저이 (야권 단일 총리 후보)", from: "2021-10-17", until: "2022-04-03" },
    { name: "페테르 마자르 (티서당 대표)", from: "2024-03-15" },
  ],
  India: [
    { name: "소니아 간디 (인도국민회의 총재)", from: "2006-01-01", until: "2017-12-16" },
    { name: "랄 크리슈나 아드바니 (BJP 총리 후보, 야당 지도자)", from: "2004-05-22", until: "2009-05-16" },
    { name: "라훌 간디 (인도국민회의 지도자)", from: "2013-01-19" },
    { name: "나렌드라 모디 (구자라트 주총리, BJP 총리 후보)", from: "2013-09-13", until: "2014-05-26" },
    { name: "아르빈드 케지리왈 (암 아드미당(AAP) 대표)", from: "2012-11-26" },
  ],
  Indonesia: [
    { name: "메가와티 수카르노푸트리 (투쟁민주당 총재, 전 대통령)", from: "2006-01-01" },
    { name: "프라보워 수비안토 (그린드라당 총재, 대선 후보)", from: "2008-02-01", until: "2024-10-19" },
    { name: "조코 위도도 (자카르타 주지사, 대선 후보)", from: "2012-10-15", until: "2014-10-19" },
    { name: "아니스 바스웨단 (자카르타 주지사, 대선 후보)", from: "2017-10-16", until: "2024-02-14" },
  ],
  Iran: [
    { name: "미르호세인 무사비 (개혁파 대선 후보)", from: "2009-03-01", until: "2011-02-14" },
    { name: "메흐디 카루비 (개혁파 대선 후보)", from: "2009-03-01", until: "2011-02-14" },
    { name: "모하마드 바게르 갈리바프 (테헤란 시장, 대선 후보)", from: "2005-09-01", until: "2020-05-28" },
    { name: "에브라힘 라이시 (대선 후보)", from: "2017-04-01", until: "2021-08-05" },
  ],
  Iraq: [
    { name: "이야드 알라위 (이라키야 연합 지도자, 전 총리)", from: "2006-01-01", until: "2014-09-08" },
    { name: "무크타다 알사드르 (사드르 운동 지도자)", from: "2006-01-01" },
  ],
  Ireland: [
    { name: "게리 애덤스 (신페인 대표)", from: "2006-01-01", until: "2018-02-10" },
    { name: "미할 마틴 (피어너 팔 대표)", from: "2011-01-26", until: "2020-06-27" },
    { name: "메리 루 맥도널드 (신페인 대표)", from: "2018-02-10" },
  ],
  Israel: [
    { name: "치피 리브니 (카디마 대표)", from: "2008-09-21", until: "2013-03-18" },
    { name: "이츠하크 헤르초그 (노동당 대표, 야당 지도자)", from: "2013-11-21", until: "2018-08-01" },
    { name: "야이르 라피드 (예시 아티드 대표)", from: "2012-04-30", until: "2021-06-13" },
    { name: "베니 간츠 (청백당 대표)", from: "2018-12-27" },
  ],
  Italy: [
    { name: "발테르 벨트로니 (민주당 대표, 총리 후보)", from: "2007-10-14", until: "2009-02-21" },
    { name: "피에르 루이지 베르사니 (민주당 대표)", from: "2009-11-07", until: "2013-04-20" },
    { name: "베페 그릴로 (오성운동 창립자)", from: "2009-10-04", until: "2018-03-04" },
    { name: "마테오 살비니 (동맹 대표)", from: "2013-12-15", until: "2018-06-01" },
    { name: "조르자 멜로니 (이탈리아의 형제들 대표)", from: "2014-03-01", until: "2022-10-22" },
  ],
  Japan: [
    { name: "이시바 시게루 (자민당 내 유력 경쟁자)", from: "2012-09-01", until: "2024-10-01" },
    { name: "기시다 후미오 (자민당 정조회장·외무상 출신)", from: "2017-08-03", until: "2021-10-04" },
    { name: "에다노 유키오 (입헌민주당 대표)", from: "2017-10-02", until: "2021-11-30" },
    { name: "오자와 이치로 (민주당 대표, 야권 실력자)", from: "2006-04-07", until: "2012-12-16" },
    { name: "다니가키 사다카즈 (자민당 총재, 야당 지도자)", from: "2009-09-28", until: "2012-09-26" },
    { name: "고이케 유리코 (도쿄도지사, 희망의당 대표)", from: "2016-07-31" },
  ],
  Kenya: [
    { name: "라일라 오딩가 (ODM 지도자, 대선 후보)", from: "2005-01-01", until: "2008-04-17" },
    { name: "우후루 케냐타 (KANU 대표, 야당 지도자·대선 후보)", from: "2002-12-30", until: "2013-04-09" },
    { name: "무살리아 무다바디 (대선 후보)", from: "2012-01-01" },
  ],
  Lebanon: [
    { name: "하산 나스랄라 (헤즈볼라 사무총장)", from: "2006-01-01", until: "2024-09-27" },
    { name: "미셸 아운 (자유애국운동 대표)", from: "2006-01-01", until: "2016-10-31" },
    { name: "사미르 게아게아 (레바논군 당수)", from: "2006-01-01" },
    { name: "왈리드 줌블라트 (진보사회당 대표)", from: "2006-01-01" },
  ],
  Liberia: [
    { name: "조지 웨아 (대선 후보)", from: "2005-10-01", until: "2018-01-22" },
  ],
  Libya: [
    { name: "사이프 알이슬람 카다피 (카다피의 아들, 유력 후계자)", from: "2006-01-01", until: "2011-11-19" },
    { name: "칼리파 하프타르 (리비아국민군 사령관)", from: "2014-05-16" },
  ],
  Madagascar: [
    { name: "안드리 라조엘리나 (전 과도 대통령, 대선 후보)", from: "2014-01-25", until: "2019-01-19" },
    { name: "마르크 라발로마나나 (전 대통령, 야당 지도자)", from: "2014-10-01" },
  ],
  Malaysia: [
    { name: "안와르 이브라힘 (야권 지도자, 인민정의당 실권자)", from: "2008-04-01", until: "2022-11-23" },
    { name: "무히딘 야신 (전 부총리, 야권 지도자)", from: "2015-07-28", until: "2020-02-29" },
    { name: "마하티르 모하맛 (전 총리, 야권 연합 지도자)", from: "2016-09-01", until: "2018-05-09" },
  ],
  Mali: [
    { name: "수마일라 시세 (야당 지도자, 대선 후보)", from: "2013-07-01", until: "2020-12-25" },
  ],
  Mexico: [
    { name: "안드레스 마누엘 로페스 오브라도르 (대선 후보, 국가재생운동 창설자)", from: "2005-01-01", until: "2018-12-01" },
    { name: "로베르토 마드라소 (제도혁명당 대선 후보)", from: "2006-01-01", until: "2006-12-31" },
    { name: "호세피나 바스케스 모타 (국민행동당 대선 후보)", from: "2012-01-01", until: "2012-12-31" },
    { name: "리카르도 아나야 (국민행동당 대선 후보)", from: "2017-01-01", until: "2018-12-31" },
    { name: "클라우디아 셰인바움 (멕시코시티 시장, 대선 후보)", from: "2018-12-05", until: "2024-10-01" },
    { name: "소치틀 갈베스 (대선 후보)", from: "2023-01-01", until: "2024-12-31" },
  ],
  Mozambique: [
    { name: "아폰수 들라카마 (RENAMO 지도자, 대선 후보)", from: "2006-01-01", until: "2018-05-03" },
  ],
  Myanmar: [
    { name: "아웅산 수치 (민족민주연맹 지도자, 야당 지도자)", from: "2006-01-01", until: "2016-04-05" },
    { name: "민 아웅 흘라잉 (국군 총사령관)", from: "2011-03-30", until: "2021-01-31" },
  ],
  Netherlands: [
    { name: "헤이르트 빌더르스 (자유당 대표)", from: "2006-02-22" },
  ],
  "New Zealand": [
    { name: "돈 브래시 (국민당 대표)", from: "2006-01-01", until: "2006-11-27" },
    { name: "존 키 (국민당 대표)", from: "2006-11-27", until: "2008-11-19" },
    { name: "필 고프 (노동당 대표)", from: "2008-11-19", until: "2011-12-13" },
    { name: "앤드루 리틀 (노동당 대표)", from: "2014-11-18", until: "2017-08-01" },
    { name: "저신다 아던 (노동당 대표)", from: "2017-08-01", until: "2017-10-26" },
    { name: "크리스토퍼 럭슨 (국민당 대표)", from: "2021-11-30", until: "2023-11-27" },
  ],
  Niger: [
    { name: "하마 아마두 (야당 지도자, 대선 후보)", from: "2011-04-01" },
  ],
  Nigeria: [
    { name: "무함마두 부하리 (야당 대선 후보)", from: "2006-12-01", until: "2015-05-29" },
    { name: "아티쿠 아부바카르 (대선 후보)", from: "2007-05-29" },
    { name: "볼라 티누부 (APC 지도자)", from: "2013-02-01", until: "2023-05-29" },
    { name: "피터 오비 (노동당 대선 후보)", from: "2022-05-01" },
  ],
  "North Korea": [
    { name: "장성택 (국방위원회 부위원장)", from: "2010-06-01", until: "2013-12-12" },
  ],
  Norway: [
    { name: "에르나 솔베르그 (보수당 대표)", from: "2006-01-01", until: "2013-10-16" },
    { name: "요나스 가르 스퇴레 (노동당 대표)", from: "2014-06-14", until: "2021-10-14" },
  ],
  Pakistan: [
    { name: "베나지르 부토 (파키스탄인민당 총재)", from: "2007-10-18", until: "2007-12-27" },
    { name: "나와즈 샤리프 (파키스탄무슬림연맹(N) 총재)", from: "2007-11-25", until: "2013-06-05" },
    { name: "임란 칸 (파키스탄정의운동(PTI) 총재)", from: "2011-10-30", until: "2018-08-18" },
    { name: "빌라왈 부토 자르다리 (파키스탄인민당 의장)", from: "2007-12-30" },
  ],
  Palestine: [
    { name: "이스마일 하니예 (하마스 지도자)", from: "2007-06-14", until: "2024-07-31" },
    { name: "마르완 바르구티 (파타 지도자, 수감 중)", from: "2006-01-01" },
    { name: "야히야 신와르 (하마스 가자지구 지도자)", from: "2017-02-13", until: "2024-10-16" },
  ],
  Peru: [
    { name: "루르데스 플로레스 (대선 후보)", from: "2006-01-01", until: "2006-12-31" },
    { name: "오얀타 우말라 (민족주의당 대선 후보)", from: "2006-01-01", until: "2011-07-28" },
    { name: "케이코 후지모리 (대선 후보)", from: "2010-01-01" },
    { name: "페드로 파블로 쿠친스키 (대선 후보)", from: "2011-01-01", until: "2016-07-28" },
    { name: "베로니카 멘도사 (좌파 대선 후보)", from: "2016-01-01", until: "2021-12-31" },
    { name: "페드로 카스티요 (대선 후보)", from: "2021-01-01", until: "2021-07-28" },
  ],
  Philippines: [
    { name: "조지프 에스트라다 (전 대통령, 대선 후보)", from: "2009-10-01", until: "2010-05-10" },
    { name: "마르 로하스 (자유당 대선 후보)", from: "2015-07-01", until: "2016-05-09" },
    { name: "그레이스 포 (상원의원, 대선 후보)", from: "2015-09-01", until: "2016-05-09" },
    { name: "페르디난드 마르코스 주니어 (상원의원, 대선 후보)", from: "2015-10-01", until: "2022-06-29" },
  ],
  Poland: [
    { name: "야로스와프 카친스키 (법과 정의 대표)", from: "2007-11-16" },
    { name: "라파우 트샤스코프스키 (바르샤바 시장, 대선 후보)", from: "2020-06-28" },
    { name: "시몬 호워브니아 (폴란드 2050 대표, 대선 후보)", from: "2020-06-28" },
    { name: "도날트 투스크 (시민연단 대표, 전 유럽이사회 의장)", from: "2021-07-03", until: "2023-12-13" },
  ],
  Portugal: [
    { name: "안토니우 코스타 (사회당 대표)", from: "2014-11-01", until: "2015-11-26" },
  ],
  Romania: [
    { name: "미르체아 제오아너 (사회민주당 대선 후보)", from: "2009-11-22", until: "2009-12-06" },
    { name: "조르제 시미온 (루마니아인연합당 대표, 대선 후보)", from: "2020-12-06" },
    { name: "컬린 제오르제스쿠 (무소속 대선 후보)", from: "2024-11-24" },
  ],
  Russia: [
    { name: "알렉세이 나발니 (반부패 운동가, 야권 지도자)", from: "2011-12-05", until: "2024-02-16" },
    { name: "겐나디 주가노프 (공산당 대표, 대선 후보)", from: "2006-01-01" },
    { name: "블라디미르 지리놉스키 (자유민주당 대표, 대선 후보)", from: "2006-01-01", until: "2022-04-06" },
    { name: "미하일 프로호로프 (기업인, 2012 대선 후보)", from: "2011-12-12", until: "2012-03-04" },
  ],
  Senegal: [
    { name: "이드리사 세크 (대선 후보)", from: "2006-01-01", until: "2020-11-01" },
    { name: "카림 와드 (PDS 대선 후보)", from: "2012-04-02" },
    { name: "우스만 송코 (PASTEF 대표, 대선 후보)", from: "2019-01-01", until: "2024-04-02" },
  ],
  "Sierra Leone": [
    { name: "줄리어스 마다 비오 (SLPP 대선 후보)", from: "2012-01-01", until: "2018-04-04" },
  ],
  Slovakia: [
    { name: "이고르 마토비치 (평범한 사람들 대표)", from: "2010-06-12", until: "2020-03-21" },
    { name: "주자나 차푸토바 (변호사, 대선 후보)", from: "2019-03-16", until: "2019-06-15" },
  ],
  "South Africa": [
    { name: "헬렌 질레 (민주동맹(DA) 대표)", from: "2007-05-01", until: "2015-05-01" },
    { name: "무시 마이마네 (민주동맹(DA) 대표)", from: "2015-05-01", until: "2019-10-01" },
    { name: "줄리어스 말레마 (경제자유전사(EFF) 대표)", from: "2013-07-01" },
    { name: "시릴 라마포사 (ANC 부총재)", from: "2012-12-18", until: "2014-05-26" },
    { name: "은코사자나 들라미니주마 (ANC 대선 경선 후보)", from: "2016-01-01", until: "2017-12-18" },
  ],
  "South Korea": [
    { name: "문재인 (더불어민주당 전 대표, 야권 유력 대권주자)", from: "2015-02-08", until: "2017-05-10" },
    { name: "안철수 (국민의당 대표, 대선 후보)", from: "2016-02-02", until: "2022-05-10" },
    { name: "홍준표 (자유한국당 대선 후보)", from: "2017-03-31", until: "2022-06-01" },
    { name: "이재명 (성남시장 → 경기지사, 대권주자)", from: "2016-12-01", until: "2025-06-04" },
    { name: "윤석열 (검찰총장 출신 대선 후보)", from: "2021-06-29", until: "2022-05-10" },
    { name: "이낙연 (전 국무총리, 대권주자)", from: "2020-08-29", until: "2022-03-09" },
    { name: "정동영 (대통합민주신당 대선 후보)", from: "2007-10-15", until: "2007-12-19" },
    { name: "이회창 (무소속 대선 후보)", from: "2007-11-01", until: "2007-12-19" },
  ],
  "South Sudan": [
    { name: "리에크 마차르 (SPLM-IO 지도자, 반군 수장)", from: "2013-12-15" },
  ],
  Spain: [
    { name: "마리아노 라호이 (인민당 대표, 총리 후보)", from: "2006-01-01", until: "2011-12-21" },
    { name: "알프레도 페레스 루발카바 (사회노동당 총리 후보)", from: "2011-07-01", until: "2014-07-26" },
    { name: "페드로 산체스 (사회노동당 대표)", from: "2014-07-26", until: "2018-06-02" },
    { name: "산티아고 아바스칼 (복스 대표)", from: "2014-09-20" },
    { name: "파블로 이글레시아스 (포데모스 대표)", from: "2014-11-15", until: "2020-01-13" },
    { name: "알베르트 리베라 (시민당 대표)", from: "2015-01-01", until: "2019-11-11" },
  ],
  "Sri Lanka": [
    { name: "라닐 위크레메싱게 (통일국민당 대표, 야당 지도자)", from: "2006-01-01", until: "2015-01-09" },
    { name: "사라트 폰세카 (전 육군참모총장, 대선 후보)", from: "2009-11-01", until: "2010-02-08" },
    { name: "마이트리팔라 시리세나 (야권 단일 대선 후보)", from: "2014-11-21", until: "2015-01-09" },
    { name: "고타바야 라자팍사 (대선 후보)", from: "2019-04-01", until: "2019-11-18" },
    { name: "사지트 프레마다사 (대선 후보, 야당 지도자)", from: "2019-08-01" },
  ],
  Sudan: [
    { name: "사디크 알마흐디 (움마당 대표, 전 총리)", from: "2006-01-01", until: "2020-11-26" },
    { name: "하산 알투라비 (민중회의당 대표, 이슬람주의 지도자)", from: "2006-01-01", until: "2016-03-05" },
  ],
  Sweden: [
    { name: "임미 오케손 (스웨덴민주당 대표)", from: "2006-01-01" },
    { name: "모나 살린 (사회민주당 대표)", from: "2007-03-17", until: "2011-03-25" },
    { name: "스테판 뢰벤 (사회민주당 대표)", from: "2012-01-27", until: "2014-10-03" },
    { name: "울프 크리스테르손 (온건당 대표)", from: "2017-10-01", until: "2022-10-18" },
  ],
  Syria: [
    { name: "아흐마드 알샤라 (하이아트 타흐리르 알샴 지도자)", from: "2017-01-28", until: "2024-12-08" },
  ],
  Taiwan: [
    { name: "셰창팅 (민진당 총통 후보)", from: "2007-05-01", until: "2008-03-22" },
    { name: "차이잉원 (민진당 주석, 총통 후보)", from: "2008-05-20", until: "2016-05-19" },
    { name: "쑹추위 (친민당 주석, 총통 후보)", from: "2011-01-01", until: "2020-01-11" },
    { name: "주리룬 (국민당 주석, 총통 후보)", from: "2015-01-19", until: "2016-01-16" },
    { name: "한궈위 (국민당 총통 후보)", from: "2019-07-01", until: "2020-01-11" },
    { name: "커원저 (대만민중당 주석, 총통 후보)", from: "2019-08-06", until: "2024-01-13" },
  ],
  Tanzania: [
    { name: "에드워드 로와사 (CHADEMA 대선 후보)", from: "2015-08-01", until: "2015-11-05" },
    { name: "툰두 리수 (CHADEMA 대선 후보)", from: "2017-09-01" },
  ],
  Thailand: [
    { name: "아피싯 웨차치와 (민주당 대표, 야당 지도자)", from: "2005-03-01", until: "2008-12-17" },
    { name: "탁신 친나왓 (전 총리, 국외 망명 중 실력자)", from: "2006-09-19" },
    { name: "수텝 트악수반 (인민민주개혁위원회 지도자)", from: "2013-11-01", until: "2014-05-22" },
    { name: "피타 림짜른랏 (전진당 대표, 총리 후보)", from: "2023-01-01", until: "2024-08-07" },
  ],
  "Trinidad and Tobago": [
    { name: "키스 롤리 (인민민족운동 대표, 야당 대표)", from: "2010-05-26", until: "2015-09-09" },
    { name: "카믈라 퍼사드비세사르 (통합국민회의 대표, 야당 대표)", from: "2015-09-09", until: "2025-05-01" },
  ],
  Tunisia: [
    { name: "라셰드 간누시 (엔나흐다 대표)", from: "2011-01-30" },
    { name: "베지 카이드 에셉시 (니다 투니스 창당인)", from: "2012-06-16", until: "2014-12-31" },
  ],
  Turkey: [
    { name: "데니즈 바이칼 (공화인민당 대표)", from: "2006-01-01", until: "2010-05-22" },
    { name: "케말 클르츠다로을루 (공화인민당 대표, 대선 후보)", from: "2010-05-22", until: "2023-11-05" },
    { name: "데블레트 바흐첼리 (민족주의행동당 대표)", from: "2006-01-01" },
    { name: "셀라하틴 데미르타시 (인민민주당 공동대표, 대선 후보)", from: "2014-06-22" },
    { name: "무하렘 인제 (대선 후보)", from: "2018-05-04", until: "2018-06-24" },
    { name: "에크렘 이마모을루 (이스탄불 시장)", from: "2019-06-23" },
  ],
  Uganda: [
    { name: "키자 베시기예 (민주변화포럼(FDC) 지도자, 대선 후보)", from: "2006-01-01" },
    { name: "보비 와인 (야당 정치인, 대선 후보)", from: "2017-07-01" },
    { name: "아마마 음바바지 (대선 후보)", from: "2015-01-01", until: "2016-05-12" },
  ],
  Ukraine: [
    { name: "율리야 티모셴코 (바티키우시나 대표, 대선 후보)", from: "2010-03-11" },
    { name: "비탈리 클리치코 (우다르 대표)", from: "2012-10-28", until: "2014-06-05" },
    { name: "볼로디미르 젤렌스키 (배우, 대선 후보)", from: "2018-12-31", until: "2019-05-20" },
    { name: "페트로 포로셴코 (전 대통령, 유럽연대 대표)", from: "2019-05-20" },
  ],
  "United Kingdom": [
    { name: "데이비드 캐머런 (보수당 대표)", from: "2005-12-06", until: "2010-05-11" },
    { name: "나이절 패라지 (영국독립당·리폼당 대표)", from: "2006-09-12" },
    { name: "에드 밀리밴드 (노동당 대표)", from: "2010-09-25", until: "2015-05-08" },
    { name: "제러미 코빈 (노동당 대표)", from: "2015-09-12", until: "2020-04-04" },
    { name: "키어 스타머 (노동당 대표)", from: "2020-04-04", until: "2024-07-05" },
  ],
  "United States": [
    { name: "힐러리 클린턴 (민주당 대선 후보)", from: "2015-04-12", until: "2016-11-08" },
    { name: "버니 샌더스 (민주당 경선 주자)", from: "2015-04-30", until: "2020-04-08" },
    { name: "도널드 트럼프 (공화당 대선 후보)", from: "2015-06-16", until: "2017-01-20" },
    { name: "조 바이든 (민주당 대선 후보)", from: "2019-04-25", until: "2021-01-20" },
    { name: "카멀라 해리스 (부통령, 민주당 대선 후보)", from: "2024-07-21", until: "2024-11-05" },
    { name: "버락 오바마 (민주당 대선 후보)", from: "2007-02-10", until: "2009-01-20" },
    { name: "존 매케인 (공화당 대선 후보)", from: "2007-04-25", until: "2008-11-04" },
    { name: "밋 롬니 (공화당 대선 후보)", from: "2011-06-02", until: "2012-11-06" },
  ],
  Uruguay: [
    { name: "루이스 라카예 포우 (국민당 대선 후보)", from: "2014-01-01", until: "2020-03-01" },
  ],
  Venezuela: [
    { name: "마누엘 로살레스 (대선 후보)", from: "2006-01-01", until: "2006-12-31" },
    { name: "엔리케 카프릴레스 (미란다 주지사, 대선 후보)", from: "2011-01-01", until: "2017-12-31" },
    { name: "레오폴도 로페스 (인민의지당 지도자)", from: "2009-01-01", until: "2020-12-31" },
    { name: "마리아 코리나 마차도 (야권 지도자, 대선 후보)", from: "2012-01-01" },
    { name: "후안 과이도 (국회의장, 야권 지도자)", from: "2019-01-23", until: "2022-12-30" },
    { name: "엔리 팔콘 (대선 후보)", from: "2018-01-01", until: "2018-12-31" },
    { name: "에드문도 곤살레스 (야권 대선 후보)", from: "2024-01-01" },
  ],
  Zambia: [
    { name: "하카인데 히칠레마 (UPND 대표, 대선 후보)", from: "2006-07-01", until: "2021-08-24" },
    { name: "마이클 사타 (애국전선(PF) 대표, 대선 후보)", from: "2006-01-01", until: "2011-09-23" },
  ],
  Zimbabwe: [
    { name: "모건 창기라이 (MDC 대표, 야당 지도자)", from: "1999-09-11", until: "2009-02-11" },
    { name: "넬슨 차미사 (MDC 대표, 대선 후보)", from: "2018-02-15" },
    { name: "조이스 무주루 (전 부통령, 야당 대선 후보)", from: "2014-12-01" },
    { name: "그레이스 무가베 (영부인, ZANU-PF 여성동맹 위원장)", from: "2014-12-01", until: "2017-11-21" },
  ],
};

const inWindow = (entry, time) => {
  const from = entry.from ? Date.parse(entry.from) : Number.NEGATIVE_INFINITY;
  const until = entry.until ? Date.parse(entry.until) : Number.POSITIVE_INFINITY;
  return time >= from && time <= until;
};

// ---- era packs -------------------------------------------------------------
//
// THE RECORD REACHES 1444, THE BUNDLE DOES NOT. This module ships the modern
// era in-line (the active preset's decades — always loaded, always sync); the
// deeper past lives in era packs under leaderEras/, loaded on demand when a
// campaign's date actually enters their window. A preset set anywhere on the
// timeline gets its surrounding decades by calling ensureReferenceEra(date)
// once (the sheet task does) — after which the same sync lookups answer from
// every loaded pack, windows keeping the eras from ever shadowing each other.
// Each pack may carry ALIASES ("Joseon" ← a scenario's own spelling) mapping
// scenario polity names onto its keys.
const ERA_PACK_LOADERS = [
  { key: "early-modern", from: "1444-01-01", until: "1749-12-31", load: () => import("./leaderEras/earlyModern.js") },
  { key: "revolutions", from: "1750-01-01", until: "1899-12-31", load: () => import("./leaderEras/revolutions.js") },
  { key: "world-wars", from: "1900-01-01", until: "2005-12-31", load: () => import("./leaderEras/worldWars.js") },
];
const loadedEras = new Map();
const eraLoadPromises = new Map();

export const ensureReferenceEra = async (dateISO) => {
  const time = Date.parse(normalizeString(dateISO));
  if (!Number.isFinite(time)) return;
  // Load the covering pack AND its neighbours: a campaign sitting near an era
  // boundary (a 1905 start looking back at 1899) reads across it.
  for (const pack of ERA_PACK_LOADERS) {
    const from = Date.parse(pack.from) - 20 * 365.25 * 86_400_000;
    const until = Date.parse(pack.until) + 20 * 365.25 * 86_400_000;
    if (time < from || time > until || loadedEras.has(pack.key)) continue;
    if (!eraLoadPromises.has(pack.key)) {
      eraLoadPromises.set(pack.key, pack.load().then((mod) => {
        loadedEras.set(pack.key, {
          reference: mod.REFERENCE ?? {},
          figures: mod.POLITICAL_FIGURES ?? {},
          aliases: mod.ALIASES ?? {},
        });
      }).catch((error) => {
        eraLoadPromises.delete(pack.key);
        console.warn(`[reference] era pack "${pack.key}" failed to load — its window stays uncovered this session.`, error);
      }));
    }
    await eraLoadPromises.get(pack.key);
  }
};

const rowSources = (modernTable, eraField, country) => {
  const sources = [];
  if (modernTable[country]) sources.push(modernTable[country]);
  for (const era of loadedEras.values()) {
    const key = era.aliases[country] ?? country;
    if (era[eraField][key]) sources.push(era[eraField][key]);
  }
  return sources;
};

// The officeholders on record for one country on one date — only the roles
// whose windows contain the date; {} for an uncovered country or unreadable
// date. Keys are the store's canonical English country names (era packs may
// alias historical polity names onto their own keys). Sync — call
// ensureReferenceEra(date) first when the date may predate the modern pack.
export const referenceLeadership = (country, dateISO) => {
  const key = normalizeString(country);
  const time = Date.parse(normalizeString(dateISO));
  if (!key || !Number.isFinite(time)) return {};
  const out = {};
  for (const rows of rowSources(REFERENCE, "reference", key)) {
    for (const role of ["leader", "headOfState", "deputy"]) {
      if (out[role]) continue;
      const hit = (rows[role] ?? []).find((entry) => inWindow(entry, time));
      if (hit) out[role] = hit.name;
    }
  }
  return out;
};

// The era's real contenders — and, in monarchic eras, heirs and pretenders —
// for one country on one date; [] when uncovered.
export const referencePoliticalFigures = (country, dateISO) => {
  const key = normalizeString(country);
  const time = Date.parse(normalizeString(dateISO));
  if (!key || !Number.isFinite(time)) return [];
  const names = [];
  for (const rows of rowSources(POLITICAL_FIGURES, "figures", key)) {
    const list = Array.isArray(rows) ? rows : [];
    for (const entry of list) {
      if (inWindow(entry, time) && !names.includes(entry.name)) names.push(entry.name);
    }
  }
  return names;
};

// HOW MUCH OF THE TIMELINE AROUND A DATE THE RECORD ACTUALLY COVERS — the
// contract every preset is held to ("a preset gets at least 20 years"). A year
// counts as covered when at least `floor` polities have a leader on record on
// its January 1st. Walk outward from the anchor year until coverage breaks on
// both sides; call ensureReferenceEra(date) first so the relevant packs are
// loaded. Returns { from, until, years }.
export const referenceCoverageSpan = (dateISO, { floor = 15 } = {}) => {
  const anchor = new Date(normalizeString(dateISO)).getUTCFullYear();
  if (!Number.isFinite(anchor)) return { from: 0, until: 0, years: 0 };
  const countriesAt = (year) => {
    const probe = `${year}-01-01`;
    let count = 0;
    const seen = new Set();
    const tally = (table) => {
      for (const key of Object.keys(table)) {
        if (seen.has(key)) continue;
        if (referenceLeadership(key, probe).leader) { seen.add(key); count += 1; }
      }
    };
    tally(REFERENCE);
    for (const era of loadedEras.values()) tally(era.reference);
    return count;
  };
  const covered = (year) => countriesAt(year) >= floor;
  if (!covered(anchor)) return { from: anchor, until: anchor, years: 0 };
  let from = anchor;
  let until = anchor;
  while (from - 1 >= 1444 && covered(from - 1)) from -= 1;
  while (until + 1 <= new Date().getUTCFullYear() + 1 && covered(until + 1)) until += 1;
  return { from, until, years: until - from + 1 };
};

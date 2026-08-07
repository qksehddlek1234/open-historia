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
  Afghanistan: {
    leader: [
      { name: "대통령 아슈라프 가니", from: "2014-09-29", until: "2021-08-15" },
      { name: "탈레반 최고지도자 하이바툴라 아훈드자다", from: "2021-08-15" },
    ],
    headOfState: [
      { name: "(없음)" },
    ],
    deputy: [
      { name: "제1부통령 압둘 라시드 도스툼", from: "2014-09-29", until: "2020-03-09" },
      { name: "제1부통령 암룰라 살레", from: "2020-03-09", until: "2021-08-15" },
      { name: "총리 무함마드 하산 아훈드", from: "2021-09-07" },
    ],
  },
  Albania: {
    leader: [
      { name: "총리 에디 라마", from: "2013-09-15" },
    ],
    headOfState: [
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
      { name: "총리 개스턴 브라운", from: "2014-06-13" },
    ],
    headOfState: [
      { name: "여왕 엘리자베스 2세", until: "2022-09-08" },
      { name: "국왕 찰스 3세", from: "2022-09-08" },
    ],
  },
  Argentina: {
    leader: [
      { name: "대통령 마우리시오 마크리", from: "2015-12-10", until: "2019-12-10" },
      { name: "대통령 알베르토 페르난데스", from: "2019-12-10", until: "2023-12-10" },
      { name: "대통령 하비에르 밀레이", from: "2023-12-10" },
    ],
    headOfState: [
      { name: "(없음)" },
    ],
    deputy: [
      { name: "부통령 가브리엘라 미체티", from: "2015-12-10", until: "2019-12-10" },
      { name: "부통령 크리스티나 페르난데스 데 키르치네르", from: "2019-12-10", until: "2023-12-10" },
      { name: "부통령 빅토리아 비야루엘", from: "2023-12-10" },
    ],
  },
  Armenia: {
    leader: [
      { name: "대통령 세르지 사르키샨", from: "2008-04-09", until: "2018-04-09" },
      { name: "총리 니콜 파시냔", from: "2018-05-08" },
    ],
    headOfState: [
      { name: "대통령 아르멘 사르키샨", from: "2018-04-09", until: "2022-02-01" },
      { name: "대통령 바하근 하차투랸", from: "2022-03-13" },
    ],
  },
  Australia: {
    leader: [
      { name: "총리 맬컴 턴불", from: "2015-09-15", until: "2018-08-24" },
      { name: "총리 스콧 모리슨", from: "2018-08-24", until: "2022-05-23" },
      { name: "총리 앤서니 앨버니지", from: "2022-05-23" },
    ],
    headOfState: [
      { name: "여왕 엘리자베스 2세", until: "2022-09-08" },
      { name: "국왕 찰스 3세", from: "2022-09-08" },
    ],
    deputy: [
      { name: "부총리 워런 트러스", from: "2013-09-18", until: "2016-02-18" },
      { name: "부총리 바너비 조이스", from: "2016-02-18", until: "2018-02-26" },
      { name: "부총리 마이클 매코맥", from: "2018-02-26", until: "2021-06-22" },
      { name: "부총리 바너비 조이스", from: "2021-06-22", until: "2022-05-23" },
      { name: "부총리 리처드 말스", from: "2022-06-01" },
    ],
  },
  Austria: {
    leader: [
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
      { name: "총리 셰이크 하시나", from: "2009-01-06", until: "2024-08-05" },
      { name: "최고고문 무함마드 유누스", from: "2024-08-08" },
    ],
    headOfState: [
      { name: "대통령 압둘 하미드", from: "2013-04-24", until: "2023-04-24" },
      { name: "대통령 모하메드 샤하부딘", from: "2023-04-24" },
    ],
    deputy: [
      { name: "(없음)" },
    ],
  },
  Barbados: {
    leader: [
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
      { name: "총리 샤를 미셸", from: "2014-10-11", until: "2019-10-27" },
      { name: "총리 소피 빌메스", from: "2019-10-27", until: "2020-10-01" },
      { name: "총리 알렉산더르 더크로", from: "2020-10-01", until: "2025-02-03" },
      { name: "총리 바르트 더베버르", from: "2025-02-03" },
    ],
    headOfState: [
      { name: "국왕 필리프", from: "2013-07-21" },
    ],
  },
  Belize: {
    leader: [
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
      { name: "대통령 에보 모랄레스", from: "2006-01-22", until: "2019-11-10" },
      { name: "임시 대통령 자니네 아녜스", from: "2019-11-12", until: "2020-11-08" },
      { name: "대통령 루이스 아르세", from: "2020-11-08", until: "2025-11-08" },
      { name: "대통령 로드리고 파스", from: "2025-11-08" },
    ],
    headOfState: [
      { name: "(없음)" },
    ],
    deputy: [
      { name: "부통령 알바로 가르시아 리네라", from: "2006-01-22", until: "2019-11-10" },
      { name: "부통령 다비드 초케우앙카", from: "2020-11-08", until: "2025-11-08" },
      { name: "부통령 에드만 라라", from: "2025-11-08" },
    ],
  },
  Botswana: {
    leader: [
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
      { name: "대통령 지우마 호세프", from: "2011-01-01", until: "2016-08-31" },
      { name: "대통령 미셰우 테메르", from: "2016-08-31", until: "2019-01-01" },
      { name: "대통령 자이르 보우소나루", from: "2019-01-01", until: "2023-01-01" },
      { name: "대통령 루이스 이나시우 룰라 다 시우바", from: "2023-01-01" },
    ],
    headOfState: [
      { name: "(없음)" },
    ],
    deputy: [
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
      { name: "대통령 로센 플레브넬리에프", from: "2012-01-22", until: "2017-01-22" },
      { name: "대통령 루멘 라데프", from: "2017-01-22" },
    ],
  },
  "Burkina Faso": {
    leader: [
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
      { name: "총리 필레몬 양", from: "2009-06-30", until: "2019-01-04" },
      { name: "총리 조제프 디온 응구테", from: "2019-01-04" },
    ],
  },
  Canada: {
    leader: [
      { name: "총리 저스틴 트뤼도", from: "2015-11-04", until: "2025-03-14" },
      { name: "총리 마크 카니", from: "2025-03-14" },
    ],
    headOfState: [
      { name: "여왕 엘리자베스 2세", until: "2022-09-08" },
      { name: "국왕 찰스 3세", from: "2022-09-08" },
    ],
    deputy: [
      { name: "부총리 크리스티아 프리랜드", from: "2019-11-20", until: "2024-12-16" },
    ],
  },
  "Central African Republic": {
    leader: [
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
      { name: "대통령 미첼 바첼레트", from: "2014-03-11", until: "2018-03-11" },
      { name: "대통령 세바스티안 피녜라", from: "2018-03-11", until: "2022-03-11" },
      { name: "대통령 가브리엘 보리치", from: "2022-03-11", until: "2026-03-11" },
      { name: "대통령 호세 안토니오 카스트", from: "2026-03-11" },
    ],
    headOfState: [
      { name: "(없음)" },
    ],
    deputy: [
      { name: "(없음)" },
    ],
  },
  China: {
    leader: [
      { name: "국가주석 시진핑", from: "2013-03-14" },
    ],
    headOfState: [
      { name: "(없음)" },
    ],
    deputy: [
      { name: "국무원 총리 리커창", from: "2013-03-15", until: "2023-03-11" },
      { name: "국무원 총리 리창", from: "2023-03-11" },
    ],
  },
  Colombia: {
    leader: [
      { name: "대통령 후안 마누엘 산토스", from: "2010-08-07", until: "2018-08-07" },
      { name: "대통령 이반 두케", from: "2018-08-07", until: "2022-08-07" },
      { name: "대통령 구스타보 페트로", from: "2022-08-07" },
    ],
    headOfState: [
      { name: "(없음)" },
    ],
    deputy: [
      { name: "부통령 마르타 루시아 라미레스", from: "2018-08-07", until: "2022-08-07" },
      { name: "부통령 프란시아 마르케스", from: "2022-08-07" },
    ],
  },
  Comoros: {
    leader: [
      { name: "대통령 이킬릴루 두아닌", from: "2011-05-26", until: "2016-05-26" },
      { name: "대통령 아잘리 아수마니", from: "2016-05-26" },
    ],
    headOfState: [
      { name: "(없음)" },
    ],
  },
  "Costa Rica": {
    leader: [
      { name: "대통령 루이스 기예르모 솔리스", from: "2014-05-08", until: "2018-05-08" },
      { name: "대통령 카를로스 알바라도", from: "2018-05-08", until: "2022-05-08" },
      { name: "대통령 로드리고 차베스", from: "2022-05-08" },
    ],
    headOfState: [
      { name: "(없음)" },
    ],
  },
  "Cote d'Ivoire": {
    leader: [
      { name: "대통령 알라산 와타라", from: "2011-05-06" },
    ],
    headOfState: [
      { name: "(없음)" },
    ],
    deputy: [
      { name: "부통령 다니엘 카블란 던컨", from: "2017-01-16", until: "2020-07-13" },
      { name: "부통령 티에모코 메일리에 코네", from: "2022-04-19" },
    ],
  },
  Croatia: {
    leader: [
      { name: "총리 조란 밀라노비치", from: "2011-12-23", until: "2016-01-22" },
      { name: "총리 티호미르 오레슈코비치", from: "2016-01-22", until: "2016-10-19" },
      { name: "총리 안드레이 플렌코비치", from: "2016-10-19" },
    ],
    headOfState: [
      { name: "대통령 콜린다 그라바르키타로비치", from: "2015-02-19", until: "2020-02-18" },
      { name: "대통령 조란 밀라노비치", from: "2020-02-18" },
    ],
  },
  Cuba: {
    leader: [
      { name: "국가평의회 의장 라울 카스트로", from: "2008-02-24", until: "2018-04-19" },
      { name: "대통령 미겔 디아스카넬", from: "2018-04-19" },
    ],
    headOfState: [
      { name: "(없음)" },
    ],
    deputy: [
      { name: "제1부통령 미겔 디아스카넬", from: "2013-02-24", until: "2018-04-19" },
      { name: "부통령 살바도르 발데스 메사", from: "2018-04-19" },
    ],
  },
  Cyprus: {
    leader: [
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
      { name: "총리 보후슬라프 소보트카", from: "2014-01-29", until: "2017-12-13" },
      { name: "총리 안드레이 바비시", from: "2017-12-13", until: "2021-11-28" },
      { name: "총리 페트르 피알라", from: "2021-11-28", until: "2025-12-01" },
      { name: "총리 안드레이 바비시", from: "2025-12-01" },
    ],
    headOfState: [
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
      { name: "대통령 다닐로 메디나", from: "2012-08-16", until: "2020-08-16" },
      { name: "대통령 루이스 아비나데르", from: "2020-08-16" },
    ],
    headOfState: [
      { name: "(없음)" },
    ],
    deputy: [
      { name: "부통령 마르가리타 세데뇨", from: "2012-08-16", until: "2020-08-16" },
      { name: "부통령 라켈 페냐", from: "2020-08-16" },
    ],
  },
  Ecuador: {
    leader: [
      { name: "대통령 라파엘 코레아", from: "2007-01-15", until: "2017-05-24" },
      { name: "대통령 레닌 모레노", from: "2017-05-24", until: "2021-05-24" },
      { name: "대통령 기예르모 라소", from: "2021-05-24", until: "2023-11-23" },
      { name: "대통령 다니엘 노보아", from: "2023-11-23" },
    ],
    headOfState: [
      { name: "(없음)" },
    ],
  },
  Egypt: {
    leader: [
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
      { name: "대통령 살바도르 산체스 세렌", from: "2014-06-01", until: "2019-06-01" },
      { name: "대통령 나이브 부켈레", from: "2019-06-01" },
    ],
    headOfState: [
      { name: "(없음)" },
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
      { name: "총리 타비 로이바스", from: "2014-03-26", until: "2016-11-23" },
      { name: "총리 위리 라타스", from: "2016-11-23", until: "2021-01-26" },
      { name: "총리 카야 칼라스", from: "2021-01-26", until: "2024-07-23" },
      { name: "총리 크리스텐 미할", from: "2024-07-23" },
    ],
    headOfState: [
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
      { name: "총리 하일레마리암 데살렌", from: "2012-09-21", until: "2018-04-02" },
      { name: "총리 아비 아흐메드", from: "2018-04-02" },
    ],
    headOfState: [
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
      { name: "총리 프랭크 바이니마라마", from: "2007-01-05", until: "2022-12-24" },
      { name: "총리 시티베니 라부카", from: "2022-12-24" },
    ],
    headOfState: [
      { name: "대통령 조지 콘로테", from: "2015-11-12", until: "2021-11-12" },
      { name: "대통령 윌리아메 카토니베레", from: "2021-11-12", until: "2024-11-12" },
    ],
  },
  Finland: {
    leader: [
      { name: "총리 유하 시필래", from: "2015-05-29", until: "2019-06-06" },
      { name: "총리 안티 린네", from: "2019-06-06", until: "2019-12-10" },
      { name: "총리 산나 마린", from: "2019-12-10", until: "2023-06-20" },
      { name: "총리 페테리 오르포", from: "2023-06-20" },
    ],
    headOfState: [
      { name: "대통령 사울리 니니스퇴", from: "2012-03-01", until: "2024-03-01" },
      { name: "대통령 알렉산데르 스투브", from: "2024-03-01" },
    ],
  },
  France: {
    leader: [
      { name: "대통령 프랑수아 올랑드", from: "2012-05-15", until: "2017-05-14" },
      { name: "대통령 에마뉘엘 마크롱", from: "2017-05-14" },
    ],
    headOfState: [
      { name: "(없음)" },
    ],
    deputy: [
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
      { name: "총리 기오르기 크비리카슈빌리", from: "2015-12-30", until: "2018-06-13" },
      { name: "총리 마무카 바흐타제", from: "2018-06-20", until: "2019-09-02" },
      { name: "총리 기오르기 가하리아", from: "2019-09-08", until: "2021-02-18" },
      { name: "총리 이라클리 가리바슈빌리", from: "2021-02-22", until: "2024-02-08" },
      { name: "총리 이라클리 코바히제", from: "2024-02-08" },
    ],
    headOfState: [
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
      { name: "대통령 요아힘 가우크", from: "2012-03-18", until: "2017-03-18" },
      { name: "대통령 프랑크발터 슈타인마이어", from: "2017-03-19" },
    ],
    deputy: [
      { name: "부총리 지크마어 가브리엘", from: "2013-12-17", until: "2018-03-14" },
      { name: "부총리 올라프 숄츠", from: "2018-03-14", until: "2021-12-08" },
      { name: "부총리 로베르트 하베크", from: "2021-12-08", until: "2025-05-06" },
      { name: "부총리 라르스 클링바일", from: "2025-05-06" },
    ],
  },
  Ghana: {
    leader: [
      { name: "대통령 존 드라마니 마하마", from: "2012-07-24", until: "2017-01-07" },
      { name: "대통령 나나 아쿠포아도", from: "2017-01-07", until: "2025-01-07" },
      { name: "대통령 존 드라마니 마하마", from: "2025-01-07" },
    ],
    headOfState: [
      { name: "(없음)" },
    ],
    deputy: [
      { name: "부통령 콰시 아미사아서", from: "2012-08-06", until: "2017-01-07" },
      { name: "부통령 마하무두 바우미아", from: "2017-01-07", until: "2025-01-07" },
      { name: "부통령 제인 나나 오포쿠아제망", from: "2025-01-07" },
    ],
  },
  Greece: {
    leader: [
      { name: "총리 알렉시스 치프라스", from: "2015-09-21", until: "2019-07-08" },
      { name: "총리 키리아코스 미초타키스", from: "2019-07-08" },
    ],
    headOfState: [
      { name: "대통령 프로코피스 파블로풀로스", from: "2015-03-13", until: "2020-03-13" },
      { name: "대통령 카테리나 사켈라로풀루", from: "2020-03-13", until: "2025-03-13" },
      { name: "대통령 콘스탄티노스 타술라스", from: "2025-03-13" },
    ],
  },
  Grenada: {
    leader: [
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
      { name: "대통령 지미 모랄레스", from: "2016-01-14", until: "2020-01-14" },
      { name: "대통령 알레한드로 잠마테이", from: "2020-01-14", until: "2024-01-15" },
      { name: "대통령 베르나르도 아레발로", from: "2024-01-15" },
    ],
    headOfState: [
      { name: "(없음)" },
    ],
    deputy: [
      { name: "부통령 하페트 카브레라", from: "2016-01-14", until: "2020-01-14" },
      { name: "부통령 기예르모 카스티요", from: "2020-01-14", until: "2024-01-15" },
      { name: "부통령 카린 에레라", from: "2024-01-15" },
    ],
  },
  Guinea: {
    leader: [
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
      { name: "대통령 조제 마리우 바스", from: "2014-06-23", until: "2020-02-27" },
      { name: "대통령 우마루 시소쿠 엠발로", from: "2020-02-27", until: "2025-11-26" },
    ],
    headOfState: [
      { name: "(없음)" },
    ],
  },
  Guyana: {
    leader: [
      { name: "대통령 데이비드 그레인저", from: "2015-05-16", until: "2020-08-02" },
      { name: "대통령 이르판 알리", from: "2020-08-02" },
    ],
    headOfState: [
      { name: "(없음)" },
    ],
    deputy: [
      { name: "총리 모지스 나가무투", from: "2015-05-01", until: "2020-08-02" },
      { name: "총리 마크 필립스", from: "2020-08-02" },
    ],
  },
  Haiti: {
    leader: [
      { name: "대통령 미셸 마르텔리", from: "2011-05-14", until: "2016-02-07" },
      { name: "임시 대통령 조슬레름 프리베르", from: "2016-02-14", until: "2017-02-07" },
      { name: "대통령 조브넬 모이즈", from: "2017-02-07", until: "2021-07-07" },
      { name: "총리 아리엘 앙리", from: "2021-07-20", until: "2024-04-24" },
    ],
    headOfState: [
      { name: "(없음)" },
    ],
  },
  Honduras: {
    leader: [
      { name: "대통령 후안 오를란도 에르난데스", from: "2014-01-27", until: "2022-01-27" },
      { name: "대통령 시오마라 카스트로", from: "2022-01-27", until: "2026-01-27" },
    ],
    headOfState: [
      { name: "(없음)" },
    ],
  },
  Hungary: {
    leader: [
      { name: "총리 오르반 빅토르", from: "2010-05-29" },
    ],
    headOfState: [
      { name: "대통령 아데르 야노시", from: "2012-05-10", until: "2022-05-10" },
      { name: "대통령 노바크 커털린", from: "2022-05-10", until: "2024-02-26" },
      { name: "대통령 슈요크 터마시", from: "2024-03-05" },
    ],
  },
  Iceland: {
    leader: [
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
      { name: "총리 나렌드라 모디", from: "2014-05-26" },
    ],
    headOfState: [
      { name: "대통령 프라납 무케르지", from: "2012-07-25", until: "2017-07-25" },
      { name: "대통령 람 나트 코빈드", from: "2017-07-25", until: "2022-07-25" },
      { name: "대통령 드라우파디 무르무", from: "2022-07-25" },
    ],
    deputy: [
      { name: "(없음)" },
    ],
  },
  Indonesia: {
    leader: [
      { name: "대통령 조코 위도도", from: "2014-10-20", until: "2024-10-20" },
      { name: "대통령 프라보워 수비안토", from: "2024-10-20" },
    ],
    headOfState: [
      { name: "(없음)" },
    ],
    deputy: [
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
      { name: "총리 하이데르 알아바디", from: "2014-09-08", until: "2018-10-25" },
      { name: "총리 아델 압둘마흐디", from: "2018-10-25", until: "2020-05-07" },
      { name: "총리 무스타파 알카디미", from: "2020-05-07", until: "2022-10-27" },
      { name: "총리 무함마드 시아 알수다니", from: "2022-10-27" },
    ],
    headOfState: [
      { name: "대통령 푸아드 마숨", from: "2014-07-24", until: "2018-10-02" },
      { name: "대통령 바르함 살리흐", from: "2018-10-02", until: "2022-10-13" },
      { name: "대통령 압둘 라티프 라시드", from: "2022-10-13" },
    ],
  },
  Ireland: {
    leader: [
      { name: "총리 엔다 케니", from: "2011-03-09", until: "2017-06-14" },
      { name: "총리 리오 버라드커", from: "2017-06-14", until: "2020-06-27" },
      { name: "총리 미홀 마틴", from: "2020-06-27", until: "2022-12-17" },
      { name: "총리 리오 버라드커", from: "2022-12-17", until: "2024-04-09" },
      { name: "총리 사이먼 해리스", from: "2024-04-09", until: "2025-01-23" },
      { name: "총리 미홀 마틴", from: "2025-01-23" },
    ],
    headOfState: [
      { name: "대통령 마이클 D. 히긴스", from: "2011-11-11", until: "2025-11-11" },
      { name: "대통령 캐서린 코널리", from: "2025-11-11" },
    ],
    deputy: [
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
      { name: "총리 베냐민 네타냐후", from: "2009-03-31", until: "2021-06-13" },
      { name: "총리 나프탈리 베네트", from: "2021-06-13", until: "2022-07-01" },
      { name: "총리 야이르 라피드", from: "2022-07-01", until: "2022-12-29" },
      { name: "총리 베냐민 네타냐후", from: "2022-12-29" },
    ],
    headOfState: [
      { name: "대통령 레우벤 리블린", from: "2014-07-24", until: "2021-07-07" },
      { name: "대통령 이츠하크 헤르초그", from: "2021-07-07" },
    ],
    deputy: [
      { name: "(없음)" },
    ],
  },
  Italy: {
    leader: [
      { name: "총리 마테오 렌치", from: "2014-02-22", until: "2016-12-12" },
      { name: "총리 파올로 젠틸로니", from: "2016-12-12", until: "2018-06-01" },
      { name: "총리 주세페 콘테", from: "2018-06-01", until: "2021-02-13" },
      { name: "총리 마리오 드라기", from: "2021-02-13", until: "2022-10-22" },
      { name: "총리 조르자 멜로니", from: "2022-10-22" },
    ],
    headOfState: [
      { name: "대통령 세르조 마타렐라", from: "2015-02-03" },
    ],
  },
  Jamaica: {
    leader: [
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
      { name: "대통령 우후루 케냐타", from: "2013-04-09", until: "2022-09-13" },
      { name: "대통령 윌리엄 루토", from: "2022-09-13" },
    ],
    headOfState: [
      { name: "(없음)" },
    ],
    deputy: [
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
      { name: "총리 이사 무스타파", from: "2014-12-09", until: "2017-09-09" },
      { name: "총리 라무시 하라디나이", from: "2017-09-09", until: "2020-02-03" },
      { name: "총리 알빈 쿠르티", from: "2020-02-03", until: "2020-06-03" },
      { name: "총리 압둘라 호티", from: "2020-06-03", until: "2021-03-22" },
      { name: "총리 알빈 쿠르티", from: "2021-03-22" },
    ],
    headOfState: [
      { name: "대통령 아티페테 야히야가", from: "2011-04-07", until: "2016-04-07" },
      { name: "대통령 하심 타치", from: "2016-04-07", until: "2020-11-05" },
      { name: "대통령 비오사 오스마니", from: "2021-04-04" },
    ],
  },
  Kuwait: {
    leader: [
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
      { name: "대통령 알마즈베크 아탐바예프", from: "2011-12-01", until: "2017-11-24" },
      { name: "대통령 소론바이 제엔베코프", from: "2017-11-24", until: "2020-10-15" },
      { name: "대통령 사디르 자파로프", from: "2021-01-28" },
    ],
    headOfState: [
      { name: "(없음)" },
    ],
  },
  Laos: {
    leader: [
      { name: "국가주석 추말리 사야손", from: "2006-06-08", until: "2016-04-20" },
      { name: "국가주석 분냥 보라치트", from: "2016-04-20", until: "2021-03-22" },
      { name: "국가주석 통룬 시술릿", from: "2021-03-22" },
    ],
    headOfState: [
      { name: "(없음)" },
    ],
    deputy: [
      { name: "총리 통싱 탐마봉", from: "2010-12-23", until: "2016-04-20" },
      { name: "총리 통룬 시술릿", from: "2016-04-20", until: "2021-03-22" },
      { name: "총리 판캄 비파반", from: "2021-03-22", until: "2022-12-30" },
      { name: "총리 소넥사이 시판돈", from: "2022-12-30" },
    ],
  },
  Latvia: {
    leader: [
      { name: "총리 라임도타 스트라우유마", from: "2014-01-22", until: "2016-02-11" },
      { name: "총리 마리스 쿠친스키스", from: "2016-02-11", until: "2019-01-23" },
      { name: "총리 크리샤니스 카린시", from: "2019-01-23", until: "2023-09-15" },
      { name: "총리 에비카 실리냐", from: "2023-09-15" },
    ],
    headOfState: [
      { name: "대통령 라이몬츠 베요니스", from: "2015-07-08", until: "2019-07-08" },
      { name: "대통령 에길스 레비츠", from: "2019-07-08", until: "2023-07-08" },
      { name: "대통령 에드가르스 린케비치스", from: "2023-07-08" },
    ],
  },
  Lebanon: {
    leader: [
      { name: "총리 탐맘 살람", from: "2014-02-15", until: "2016-12-18" },
      { name: "총리 사드 하리리", from: "2016-12-18", until: "2020-01-21" },
      { name: "총리 하산 디아브", from: "2020-01-21", until: "2021-09-10" },
      { name: "총리 나지브 미카티", from: "2021-09-10", until: "2025-02-08" },
      { name: "총리 나와프 살람", from: "2025-02-08" },
    ],
    headOfState: [
      { name: "대통령 미셸 아운", from: "2016-10-31", until: "2022-10-30" },
      { name: "대통령 조제프 아운", from: "2025-01-09" },
    ],
  },
  Lesotho: {
    leader: [
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
      { name: "총리 압둘 하미드 드베이바", from: "2021-03-15" },
    ],
    headOfState: [
      { name: "대통령위원회 의장 모하메드 알멘피", from: "2021-03-15" },
    ],
  },
  Liechtenstein: {
    leader: [
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
      { name: "총리 알기르다스 부트케비추스", from: "2012-12-13", until: "2016-12-13" },
      { name: "총리 사울류스 스크베르넬리스", from: "2016-12-13", until: "2020-12-11" },
      { name: "총리 잉그리다 시모니테", from: "2020-12-11", until: "2024-12-12" },
      { name: "총리 긴타우타스 팔루츠카스", from: "2024-12-12", until: "2025-08-01" },
      { name: "총리 잉가 루기니에네", from: "2025-09-01" },
    ],
    headOfState: [
      { name: "대통령 달리아 그리바우스카이테", from: "2009-07-12", until: "2019-07-12" },
      { name: "대통령 기타나스 나우세다", from: "2019-07-12" },
    ],
    deputy: [
      { name: "(없음)" },
    ],
  },
  Luxembourg: {
    leader: [
      { name: "총리 그자비에 베텔", from: "2013-12-04", until: "2023-11-17" },
      { name: "총리 뤼크 프리덴", from: "2023-11-17" },
    ],
    headOfState: [
      { name: "대공 앙리", from: "2000-10-07", until: "2025-10-03" },
      { name: "대공 기욤", from: "2025-10-03" },
    ],
  },
  Madagascar: {
    leader: [
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
  },
  Maldives: {
    leader: [
      { name: "대통령 압둘라 야민", from: "2013-11-17", until: "2018-11-17" },
      { name: "대통령 이브라힘 모하메드 솔리흐", from: "2018-11-17", until: "2023-11-17" },
      { name: "대통령 모하메드 무이주", from: "2023-11-17" },
    ],
    headOfState: [
      { name: "(없음)" },
    ],
    deputy: [
      { name: "부통령 파이살 나심", from: "2018-11-17", until: "2023-11-17" },
      { name: "부통령 후세인 모하메드 라티프", from: "2023-11-17" },
    ],
  },
  Mali: {
    leader: [
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
      { name: "총리 조지프 무스카트", from: "2013-03-11", until: "2020-01-13" },
      { name: "총리 로버트 아벨라", from: "2020-01-13" },
    ],
    headOfState: [
      { name: "대통령 마리루이즈 콜레이로 프레카", from: "2014-04-04", until: "2019-04-04" },
      { name: "대통령 조지 벨라", from: "2019-04-04", until: "2024-04-04" },
      { name: "대통령 미리암 스피테리 데보노", from: "2024-04-04" },
    ],
  },
  "Marshall Islands": {
    leader: [
      { name: "대통령 크리스토퍼 로에아크", from: "2012-01-01", until: "2016-01-11" },
      { name: "대통령 힐다 하이네", from: "2016-01-28", until: "2020-01-13" },
      { name: "대통령 데이비드 카부아", from: "2020-01-13", until: "2024-01-03" },
      { name: "대통령 힐다 하이네", from: "2024-01-03" },
    ],
    headOfState: [
      { name: "(없음)" },
    ],
  },
  Mauritania: {
    leader: [
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
      { name: "대통령 엔리케 페냐 니에토", from: "2012-12-01", until: "2018-12-01" },
      { name: "대통령 안드레스 마누엘 로페스 오브라도르", from: "2018-12-01", until: "2024-10-01" },
      { name: "대통령 클라우디아 셰인바움", from: "2024-10-01" },
    ],
    headOfState: [
      { name: "(없음)" },
    ],
    deputy: [
      { name: "(없음)" },
    ],
  },
  Micronesia: {
    leader: [
      { name: "대통령 피터 크리스천", from: "2015-05-11", until: "2019-05-11" },
      { name: "대통령 데이비드 파누엘로", from: "2019-05-11", until: "2023-05-11" },
      { name: "대통령 웨슬리 시미나", from: "2023-05-12" },
    ],
    headOfState: [
      { name: "(없음)" },
    ],
    deputy: [
      { name: "부통령 요시워 조지", from: "2015-05-11", until: "2023-05-11" },
      { name: "부통령 아렌 팔리크", from: "2023-05-12" },
    ],
  },
  Moldova: {
    leader: [
      { name: "총리 파벨 필립", from: "2016-01-20", until: "2019-06-08" },
      { name: "총리 마이아 산두", from: "2019-06-08", until: "2019-11-14" },
      { name: "총리 이온 키쿠", from: "2019-11-14", until: "2020-12-31" },
      { name: "총리 나탈리아 가브릴리차", from: "2021-08-06", until: "2023-02-16" },
      { name: "총리 도린 레체안", from: "2023-02-16", until: "2025-10-31" },
      { name: "총리 알렉산드루 문테아누", from: "2025-10-31" },
    ],
    headOfState: [
      { name: "대통령 니콜라에 티모프티", from: "2012-03-23", until: "2016-12-23" },
      { name: "대통령 이고르 도돈", from: "2016-12-23", until: "2020-12-24" },
      { name: "대통령 마이아 산두", from: "2020-12-24" },
    ],
  },
  Mongolia: {
    leader: [
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
      { name: "대통령 배런 와카", from: "2013-06-11", until: "2019-08-27" },
      { name: "대통령 라이오넬 아잉기메아", from: "2019-08-27", until: "2022-09-28" },
      { name: "대통령 러스 쿤", from: "2022-09-28", until: "2023-10-30" },
      { name: "대통령 데이비드 아데앙", from: "2023-10-30" },
    ],
    headOfState: [
      { name: "(없음)" },
    ],
  },
  Nepal: {
    leader: [
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
      { name: "대통령 비디아 데비 반다리", from: "2015-10-29", until: "2023-03-13" },
      { name: "대통령 람 찬드라 파우델", from: "2023-03-13" },
    ],
  },
  Netherlands: {
    leader: [
      { name: "총리 마르크 뤼터", from: "2010-10-14", until: "2024-07-02" },
      { name: "총리 딕 스호프", from: "2024-07-02" },
    ],
    headOfState: [
      { name: "국왕 빌럼알렉산더르", from: "2013-04-30" },
    ],
  },
  "New Zealand": {
    leader: [
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
      { name: "대통령 다니엘 오르테가", from: "2007-01-10" },
    ],
    headOfState: [
      { name: "(없음)" },
    ],
    deputy: [
      { name: "부통령 로사리오 무리요", from: "2017-01-10" },
    ],
  },
  Niger: {
    leader: [
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
      { name: "대통령 무함마두 부하리", from: "2015-05-29", until: "2023-05-29" },
      { name: "대통령 볼라 티누부", from: "2023-05-29" },
    ],
    headOfState: [
      { name: "(없음)" },
    ],
    deputy: [
      { name: "부통령 예미 오신바조", from: "2015-05-29", until: "2023-05-29" },
      { name: "부통령 카심 셰티마", from: "2023-05-29" },
    ],
  },
  "North Korea": {
    leader: [
      { name: "국무위원장 김정은", from: "2011-12-17" },
    ],
    headOfState: [
      { name: "최고인민회의 상임위원장 김영남", from: "1998-09-05", until: "2019-04-11" },
    ],
    deputy: [
      { name: "내각총리 박봉주", from: "2013-04-01", until: "2019-04-11" },
      { name: "내각총리 김재룡", from: "2019-04-11", until: "2020-08-13" },
      { name: "내각총리 김덕훈", from: "2020-08-13" },
    ],
  },
  "North Macedonia": {
    leader: [
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
      { name: "대통령 조르게 이바노프", from: "2009-05-12", until: "2019-05-12" },
      { name: "대통령 스테보 펜다로프스키", from: "2019-05-12", until: "2024-05-12" },
      { name: "대통령 고르다나 실야노브스카다브코바", from: "2024-05-12" },
    ],
  },
  "Northern Cyprus": {
    leader: [
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
      { name: "총리 에르나 솔베르그", from: "2013-10-16", until: "2021-10-14" },
      { name: "총리 요나스 가르 스퇴레", from: "2021-10-14" },
    ],
    headOfState: [
      { name: "국왕 하랄 5세", from: "1991-01-17" },
    ],
    deputy: [
      { name: "(없음)" },
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
      { name: "총리 나와즈 샤리프", from: "2013-06-05", until: "2017-07-28" },
      { name: "총리 샤히드 하칸 아바시", from: "2017-08-01", until: "2018-05-31" },
      { name: "총리 임란 칸", from: "2018-08-18", until: "2022-04-10" },
      { name: "총리 셰바즈 샤리프", from: "2022-04-11", until: "2023-08-14" },
      { name: "총리 안와르 울하크 카카르", from: "2023-08-14", until: "2024-03-04" },
      { name: "총리 셰바즈 샤리프", from: "2024-03-04" },
    ],
    headOfState: [
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
      { name: "대통령 토미 레멩게사우", from: "2013-01-17", until: "2021-01-21" },
      { name: "대통령 수랑겔 휩스 주니어", from: "2021-01-21" },
    ],
    headOfState: [
      { name: "(없음)" },
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
      { name: "대통령 후안 카를로스 바렐라", from: "2014-07-01", until: "2019-07-01" },
      { name: "대통령 라우렌티노 코르티소", from: "2019-07-01", until: "2024-07-01" },
      { name: "대통령 호세 라울 물리노", from: "2024-07-01" },
    ],
    headOfState: [
      { name: "(없음)" },
    ],
    deputy: [
      { name: "부통령 호세 가브리엘 카리소", from: "2019-07-01", until: "2024-07-01" },
    ],
  },
  "Papua New Guinea": {
    leader: [
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
      { name: "대통령 오라시오 카르테스", from: "2013-08-15", until: "2018-08-15" },
      { name: "대통령 마리오 아브도 베니테스", from: "2018-08-15", until: "2023-08-15" },
      { name: "대통령 산티아고 페냐", from: "2023-08-15" },
    ],
    headOfState: [
      { name: "(없음)" },
    ],
    deputy: [
      { name: "부통령 우고 벨라스케스", from: "2018-08-15", until: "2023-08-15" },
      { name: "부통령 페드로 알리아나", from: "2023-08-15" },
    ],
  },
  Peru: {
    leader: [
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
    ],
    deputy: [
      { name: "부통령 마르틴 비스카라", from: "2016-07-28", until: "2018-03-23" },
      { name: "부통령 디나 볼루아르테", from: "2021-07-28", until: "2022-12-07" },
    ],
  },
  Philippines: {
    leader: [
      { name: "대통령 베니그노 아키노 3세", from: "2010-06-30", until: "2016-06-30" },
      { name: "대통령 로드리고 두테르테", from: "2016-06-30", until: "2022-06-30" },
      { name: "대통령 페르디난드 마르코스 주니어", from: "2022-06-30" },
    ],
    headOfState: [
      { name: "(없음)" },
    ],
    deputy: [
      { name: "부통령 제조마르 비나이", from: "2010-06-30", until: "2016-06-30" },
      { name: "부통령 레니 로브레도", from: "2016-06-30", until: "2022-06-30" },
      { name: "부통령 사라 두테르테", from: "2022-06-30" },
    ],
  },
  Poland: {
    leader: [
      { name: "총리 베아타 시들로", from: "2015-11-16", until: "2017-12-11" },
      { name: "총리 마테우시 모라비에츠키", from: "2017-12-11", until: "2023-12-13" },
      { name: "총리 도날트 투스크", from: "2023-12-13" },
    ],
    headOfState: [
      { name: "대통령 안제이 두다", from: "2015-08-06", until: "2025-08-06" },
      { name: "대통령 카롤 나브로츠키", from: "2025-08-06" },
    ],
  },
  Portugal: {
    leader: [
      { name: "총리 안토니우 코스타", from: "2015-11-26", until: "2024-04-02" },
      { name: "총리 루이스 몬테네그루", from: "2024-04-02" },
    ],
    headOfState: [
      { name: "대통령 아니발 카바쿠 실바", from: "2006-03-09", until: "2016-03-09" },
      { name: "대통령 마르셀루 헤벨루 드 소자", from: "2016-03-09" },
    ],
  },
  Qatar: {
    leader: [
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
      { name: "대통령 클라우스 요하니스", from: "2014-12-21", until: "2025-02-12" },
      { name: "대통령 니쿠쇼르 단", from: "2025-05-26" },
    ],
  },
  Russia: {
    leader: [
      { name: "대통령 블라디미르 푸틴", from: "2012-05-07" },
    ],
    headOfState: [
      { name: "(없음)" },
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
      { name: "대통령 마누엘 핀투 다 코스타", from: "2011-09-03", until: "2016-09-03" },
      { name: "대통령 에바리스투 카르발류", from: "2016-09-03", until: "2021-10-02" },
      { name: "대통령 카를루스 빌라 노바", from: "2021-10-02" },
    ],
  },
  "Saudi Arabia": {
    leader: [
      { name: "국왕 살만 빈 압둘아지즈", from: "2015-01-23" },
    ],
    headOfState: [
      { name: "(없음)" },
    ],
    deputy: [
      { name: "왕세자 무함마드 빈 나예프", from: "2015-04-29", until: "2017-06-21" },
      { name: "왕세자 무함마드 빈 살만", from: "2017-06-21" },
    ],
  },
  Senegal: {
    leader: [
      { name: "대통령 마키 살", from: "2012-04-02", until: "2024-04-02" },
      { name: "대통령 바시루 디오마이 파이", from: "2024-04-02" },
    ],
    headOfState: [
      { name: "(없음)" },
    ],
    deputy: [
      { name: "총리 마하마드 분 압달라 디온", from: "2014-07-01", until: "2019-05-01" },
      { name: "총리 아마두 바", from: "2022-09-17", until: "2024-03-06" },
      { name: "총리 우스만 손코", from: "2024-04-02" },
    ],
  },
  Serbia: {
    leader: [
      { name: "총리 알렉산다르 부치치", from: "2014-04-27", until: "2017-05-31" },
      { name: "대통령 알렉산다르 부치치", from: "2017-05-31" },
    ],
    headOfState: [
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
      { name: "대통령 토니 탄", from: "2011-09-01", until: "2017-08-31" },
      { name: "대통령 할리마 야콥", from: "2017-09-14", until: "2023-09-13" },
      { name: "대통령 타르만 샨무가라트남", from: "2023-09-14" },
    ],
  },
  Slovakia: {
    leader: [
      { name: "총리 로베르트 피초", from: "2012-04-04", until: "2018-03-22" },
      { name: "총리 페테르 펠레그리니", from: "2018-03-22", until: "2020-03-21" },
      { name: "총리 이고르 마토비치", from: "2020-03-21", until: "2021-04-01" },
      { name: "총리 에두아르트 헤게르", from: "2021-04-01", until: "2023-05-15" },
      { name: "총리 루도비트 오도르", from: "2023-05-15", until: "2023-10-25" },
      { name: "총리 로베르트 피초", from: "2023-10-25" },
    ],
    headOfState: [
      { name: "대통령 안드레이 키스카", from: "2014-06-15", until: "2019-06-15" },
      { name: "대통령 주자나 차푸토바", from: "2019-06-15", until: "2024-06-15" },
      { name: "대통령 페테르 펠레그리니", from: "2024-06-15" },
    ],
  },
  Slovenia: {
    leader: [
      { name: "총리 미로 체라르", from: "2014-09-18", until: "2018-09-13" },
      { name: "총리 마리안 샤레츠", from: "2018-09-13", until: "2020-03-13" },
      { name: "총리 야네스 얀샤", from: "2020-03-13", until: "2022-06-01" },
      { name: "총리 로베르트 골로프", from: "2022-06-01" },
    ],
    headOfState: [
      { name: "대통령 보루트 파호르", from: "2012-12-22", until: "2022-12-22" },
      { name: "대통령 나타샤 피르츠 무사르", from: "2022-12-23" },
    ],
  },
  "Solomon Islands": {
    leader: [
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
      { name: "대통령 박근혜", from: "2013-02-25", until: "2017-03-10" },
      { name: "대통령 문재인", from: "2017-05-10", until: "2022-05-09" },
      { name: "대통령 윤석열", from: "2022-05-10", until: "2025-04-04" },
      { name: "대통령 이재명", from: "2025-06-04" },
    ],
    headOfState: [
      { name: "(없음)" },
    ],
    deputy: [
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
      { name: "대통령 살바 키르", from: "2011-07-09" },
    ],
    headOfState: [
      { name: "(없음)" },
    ],
    deputy: [
      { name: "제1부통령 타반 뎅 가이", from: "2016-07-26", until: "2020-02-22" },
      { name: "제1부통령 리에크 마차르", from: "2020-02-22" },
    ],
  },
  Spain: {
    leader: [
      { name: "총리 마리아노 라호이", from: "2011-12-21", until: "2018-06-02" },
      { name: "총리 페드로 산체스", from: "2018-06-02" },
    ],
    headOfState: [
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
      { name: "대통령 마이트리팔라 시리세나", from: "2015-01-09", until: "2019-11-18" },
      { name: "대통령 고타바야 라자팍사", from: "2019-11-18", until: "2022-07-14" },
      { name: "대통령 라닐 위크레메싱게", from: "2022-07-21", until: "2024-09-23" },
      { name: "대통령 아누라 쿠마라 디사나야케", from: "2024-09-23" },
    ],
    headOfState: [
      { name: "(없음)" },
    ],
    deputy: [
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
      { name: "대통령 데시 바우테르서", from: "2010-08-12", until: "2020-07-16" },
      { name: "대통령 찬 산토키", from: "2020-07-16", until: "2025-07-16" },
      { name: "대통령 제니퍼 헤를링스시몬스", from: "2025-07-16" },
    ],
    headOfState: [
      { name: "(없음)" },
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
      { name: "총리 스테판 뢰벤", from: "2014-10-03", until: "2021-11-30" },
      { name: "총리 막달레나 안데르손", from: "2021-11-30", until: "2022-10-18" },
      { name: "총리 울프 크리스테르손", from: "2022-10-18" },
    ],
    headOfState: [
      { name: "국왕 칼 16세 구스타프" },
    ],
    deputy: [
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
      { name: "총통 마잉주", from: "2008-05-20", until: "2016-05-20" },
      { name: "총통 차이잉원", from: "2016-05-20", until: "2024-05-20" },
      { name: "총통 라이칭더", from: "2024-05-20" },
    ],
    headOfState: [
      { name: "(없음)" },
    ],
    deputy: [
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
      { name: "총리 쁘라윳 짠오차", from: "2014-08-24", until: "2023-08-22" },
      { name: "총리 세타 타위신", from: "2023-08-22", until: "2024-08-14" },
      { name: "총리 패통탄 친나왓", from: "2024-08-16", until: "2025-08-29" },
      { name: "총리 아누틴 찬위라꾼", from: "2025-09-07" },
    ],
    headOfState: [
      { name: "국왕 푸미폰 아둔야뎃", until: "2016-10-13" },
      { name: "국왕 마하 와치랄롱꼰", from: "2016-12-01" },
    ],
  },
  "Timor-Leste": {
    leader: [
      { name: "총리 루이 마리아 드 아라우주", from: "2015-02-16", until: "2017-09-15" },
      { name: "총리 마리 알카티리", from: "2017-09-15", until: "2018-06-22" },
      { name: "총리 타우르 마탄 루아크", from: "2018-06-22", until: "2023-07-01" },
      { name: "총리 사나나 구스망", from: "2023-07-01" },
    ],
    headOfState: [
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
      { name: "총리 아킬리시 포히바", from: "2014-12-30", until: "2019-09-12" },
      { name: "총리 포히바 투이오네토아", from: "2019-10-08", until: "2021-12-27" },
      { name: "총리 시아오시 소발레니", from: "2021-12-27", until: "2024-12-09" },
      { name: "총리 아이사케 에케", from: "2025-01-22" },
    ],
    headOfState: [
      { name: "국왕 투포우 6세", from: "2012-03-18" },
    ],
  },
  "Trinidad and Tobago": {
    leader: [
      { name: "총리 키스 롤리", from: "2015-09-09", until: "2025-03-16" },
      { name: "총리 카믈라 퍼사드비세사르", from: "2025-05-01" },
    ],
    headOfState: [
      { name: "대통령 앤서니 카모나", from: "2013-03-18", until: "2018-03-19" },
      { name: "대통령 폴라메이 위크스", from: "2018-03-19", until: "2023-03-20" },
      { name: "대통령 크리스틴 캉갈루", from: "2023-03-20" },
    ],
  },
  Tunisia: {
    leader: [
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
      { name: "대통령 레제프 타이이프 에르도안", from: "2014-08-28" },
    ],
    headOfState: [
      { name: "(없음)" },
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
      { name: "대통령 구르반굴리 베르디무하메도프", from: "2007-02-14", until: "2022-03-19" },
      { name: "대통령 세르다르 베르디무하메도프", from: "2022-03-19" },
    ],
    headOfState: [
      { name: "(없음)" },
    ],
    deputy: [
      { name: "(없음)" },
    ],
  },
  Tuvalu: {
    leader: [
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
      { name: "대통령 페트로 포로셴코", from: "2014-06-07", until: "2019-05-20" },
      { name: "대통령 볼로디미르 젤렌스키", from: "2019-05-20" },
    ],
    headOfState: [
      { name: "(없음)" },
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
      { name: "부총리 도미닉 라브", from: "2021-09-15", until: "2022-09-06" },
      { name: "부총리 도미닉 라브", from: "2022-10-25", until: "2023-04-21" },
      { name: "부총리 올리버 다우든", from: "2023-04-21", until: "2024-07-05" },
      { name: "부총리 앤절라 레이너", from: "2024-07-05", until: "2025-09-05" },
      { name: "부총리 데이비드 래미", from: "2025-09-05" },
    ],
  },
  "United States": {
    leader: [
      { name: "대통령 버락 오바마", from: "2009-01-20", until: "2017-01-20" },
      { name: "대통령 도널드 트럼프", from: "2017-01-20", until: "2021-01-20" },
      { name: "대통령 조 바이든", from: "2021-01-20", until: "2025-01-20" },
      { name: "대통령 도널드 트럼프", from: "2025-01-20" },
    ],
    headOfState: [
      { name: "(없음)" },
    ],
    deputy: [
      { name: "부통령 조 바이든", from: "2009-01-20", until: "2017-01-20" },
      { name: "부통령 마이크 펜스", from: "2017-01-20", until: "2021-01-20" },
      { name: "부통령 카멀라 해리스", from: "2021-01-20", until: "2025-01-20" },
      { name: "부통령 J.D. 밴스", from: "2025-01-20" },
    ],
  },
  Uruguay: {
    leader: [
      { name: "대통령 타바레 바스케스", from: "2015-03-01", until: "2020-03-01" },
      { name: "대통령 루이스 라카예 포우", from: "2020-03-01", until: "2025-03-01" },
      { name: "대통령 야만두 오르시", from: "2025-03-01" },
    ],
    headOfState: [
      { name: "(없음)" },
    ],
    deputy: [
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
      { name: "대통령 니콜라스 마두로", from: "2013-04-19" },
    ],
    headOfState: [
      { name: "(없음)" },
    ],
    deputy: [
      { name: "부통령 타레크 엘아이사미", from: "2017-01-04", until: "2018-06-14" },
      { name: "부통령 델시 로드리게스", from: "2018-06-14" },
    ],
  },
  Vietnam: {
    leader: [
      { name: "공산당 서기장 응우옌푸쫑", from: "2011-01-19", until: "2024-07-19" },
      { name: "공산당 서기장 또럼", from: "2024-08-03" },
    ],
    headOfState: [
      { name: "국가주석 쯔엉떤상", from: "2011-07-25", until: "2016-04-02" },
      { name: "국가주석 쩐다이꽝", from: "2016-04-02", until: "2018-09-21" },
      { name: "국가주석 응우옌푸쫑", from: "2018-10-23", until: "2021-04-05" },
      { name: "국가주석 응우옌쑤언푹", from: "2021-04-05", until: "2023-01-18" },
      { name: "국가주석 보반트엉", from: "2023-03-02", until: "2024-03-21" },
      { name: "국가주석 또럼", from: "2024-05-22", until: "2024-10-21" },
      { name: "국가주석 르엉끄엉", from: "2024-10-21" },
    ],
    deputy: [
      { name: "총리 응우옌떤중", from: "2006-06-27", until: "2016-04-07" },
      { name: "총리 응우옌쑤언푹", from: "2016-04-07", until: "2021-04-05" },
      { name: "총리 팜민찐", from: "2021-04-05" },
    ],
  },
  Yemen: {
    leader: [
      { name: "대통령 압드라보 만수르 하디", from: "2012-02-25", until: "2022-04-07" },
      { name: "대통령위원회 의장 라샤드 알알리미", from: "2022-04-07" },
    ],
    headOfState: [
      { name: "(없음)" },
    ],
  },
  Zambia: {
    leader: [
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
const POLITICAL_FIGURES = {
  "South Korea": [
    { name: "문재인 (더불어민주당 전 대표, 야권 유력 대권주자)", from: "2015-02-08", until: "2017-05-10" },
    { name: "안철수 (국민의당 대표, 대선 후보)", from: "2016-02-02", until: "2022-05-10" },
    { name: "홍준표 (자유한국당 대선 후보)", from: "2017-03-31", until: "2022-06-01" },
    { name: "이재명 (성남시장 → 경기지사, 대권주자)", from: "2016-12-01", until: "2025-06-04" },
    { name: "윤석열 (검찰총장 출신 대선 후보)", from: "2021-06-29", until: "2022-05-10" },
    { name: "이낙연 (전 국무총리, 대권주자)", from: "2020-08-29", until: "2022-03-09" },
  ],
  "United States": [
    { name: "힐러리 클린턴 (민주당 대선 후보)", from: "2015-04-12", until: "2016-11-08" },
    { name: "버니 샌더스 (민주당 경선 주자)", from: "2015-04-30", until: "2020-04-08" },
    { name: "도널드 트럼프 (공화당 대선 후보)", from: "2015-06-16", until: "2017-01-20" },
    { name: "조 바이든 (민주당 대선 후보)", from: "2019-04-25", until: "2021-01-20" },
    { name: "카멀라 해리스 (부통령, 민주당 대선 후보)", from: "2024-07-21", until: "2024-11-05" },
  ],
  Japan: [
    { name: "이시바 시게루 (자민당 내 유력 경쟁자)", from: "2012-09-01", until: "2024-10-01" },
    { name: "기시다 후미오 (자민당 정조회장·외무상 출신)", from: "2017-08-03", until: "2021-10-04" },
    { name: "에다노 유키오 (입헌민주당 대표)", from: "2017-10-02", until: "2021-11-30" },
  ],
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

// The era's real contenders for one country on one date — [] when uncovered.
export const referencePoliticalFigures = (country, dateISO) => {
  const rows = POLITICAL_FIGURES[normalizeString(country)];
  const time = Date.parse(normalizeString(dateISO));
  if (!rows || !Number.isFinite(time)) return [];
  return rows.filter((entry) => inWindow(entry, time)).map((entry) => entry.name);
};

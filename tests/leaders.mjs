// A 12B does not know who governs — round 11 live: China's deputy came back
// "국무원총리 장관정 (장가정)" (an invention wearing a hedge) with 리커창 in
// office, after a direct re-ask. The engine's answer to a knowledge failure is
// a record, not a better plea: leaderReference.js ships the modern era's real
// officeholders, term-windowed, and the sheet task consults it wherever the
// campaign has no recorded person of its own.
import assert from "node:assert/strict";
import fs from "node:fs";
import { ensureReferenceEra, REFERENCE, referenceCoverageSpan, referenceLeadership, referencePoliticalFigures } from "../src/runtime/leaderReference.js";
import { isSpeechlessPolity } from "../src/runtime/speechless.js";

let pass = 0;
const test = (name, fn) => { fn(); pass += 1; console.log(`  ok  ${name}`); };

const GAMEPLAY = fs.readFileSync(new URL("../src/Game/AI/gameplay.js", import.meta.url), "utf8");

console.log("\nThe record knows the officeholders the model invents");

test("the live failure cases resolve to the real people", () => {
  assert.equal(referenceLeadership("China", "2016-09-27").deputy, "국무원 총리 리커창");
  assert.equal(referenceLeadership("South Korea", "2016-09-27").deputy, "국무총리 황교안");
  assert.equal(referenceLeadership("Russia", "2016-09-27").deputy, "총리 드미트리 메드베데프");
  assert.equal(referenceLeadership("Australia", "2016-09-27").leader, "총리 맬컴 턴불");
  assert.equal(referenceLeadership("Philippines", "2016-09-27").leader, "대통령 로드리고 두테르테");
});

test("term windows are inclusive and a lapsed term stops applying", () => {
  // The Philippines hand over on exactly 2016-06-30.
  assert.equal(referenceLeadership("Philippines", "2016-06-29").leader, "대통령 베니그노 아키노 3세");
  assert.equal(referenceLeadership("Philippines", "2016-07-01").leader, "대통령 로드리고 두테르테");
  // The worldwide record carries real successions (캐머런 → 메이 on
  // 2016-07-13) — but ONLY as background truth: the validator consults it
  // solely where the campaign has no recorded person of its own, so a
  // campaign that kept 캐머런 keeps him. (This campaign installed 메이
  // through its own timeline event; record and canon happen to agree.)
  assert.equal(referenceLeadership("United Kingdom", "2016-09-27").leader, "총리 테리사 메이");
  assert.equal(referenceLeadership("United Kingdom", "2016-09-27").headOfState, "여왕 엘리자베스 2세");
});

test("a structural absence is itself a fact on record", () => {
  assert.equal(referenceLeadership("South Korea", "2016-09-27").headOfState, "(없음)");
  assert.equal(referenceLeadership("Brazil", "2016-09-27").deputy, "(없음)", "테메르 승계로 부통령 공석");
});

console.log("\nWorldwide, 2016 → the present day");

test("succession chains hold across the decade — sampled worldwide", () => {
  // 미국: 오바마 → 트럼프 → 바이든 → 트럼프.
  assert.equal(referenceLeadership("United States", "2018-06-01").leader, "대통령 도널드 트럼프");
  assert.equal(referenceLeadership("United States", "2022-06-01").leader, "대통령 조 바이든");
  assert.equal(referenceLeadership("United States", "2025-06-01").leader, "대통령 도널드 트럼프");
  // 한국: 문재인 → 윤석열 → 이재명, 총리 체인 동행.
  assert.equal(referenceLeadership("South Korea", "2019-01-01").leader, "대통령 문재인");
  assert.equal(referenceLeadership("South Korea", "2023-01-01").leader, "대통령 윤석열");
  assert.equal(referenceLeadership("South Korea", "2025-08-01").leader, "대통령 이재명");
  assert.equal(referenceLeadership("South Korea", "2019-01-01").deputy, "국무총리 이낙연");
  // 영국: 메이 → 존슨 → 트러스 → 수낵 → 스타머.
  assert.equal(referenceLeadership("United Kingdom", "2020-01-01").leader, "총리 보리스 존슨");
  assert.equal(referenceLeadership("United Kingdom", "2025-01-01").leader, "총리 키어 스타머");
  assert.equal(referenceLeadership("United Kingdom", "2023-01-01").headOfState, "국왕 찰스 3세");
  // 독일 2025, 시리아 정권 붕괴, 미얀마 쿠데타, 아프간 함락.
  assert.equal(referenceLeadership("Germany", "2025-08-01").leader, "총리 프리드리히 메르츠");
  assert.equal(referenceLeadership("Syria", "2020-01-01").leader, "대통령 바샤르 알아사드");
  assert.equal(referenceLeadership("Myanmar", "2022-01-01").leader, "국가행정평의회 의장 민 아웅 흘라잉");
  assert.equal(referenceLeadership("Afghanistan", "2020-01-01").leader, "대통령 아슈라프 가니");
});

test("the table is genuinely worldwide", () => {
  const countryCount = Object.keys(REFERENCE).length;
  assert.ok(countryCount >= 180, `${countryCount} countries on record (expected ≥ 180)`);
  // High-invention-risk regions are covered with real people.
  assert.equal(referenceLeadership("Nigeria", "2024-01-01").leader, "대통령 볼라 티누부");
  assert.equal(referenceLeadership("Kenya", "2019-01-01").leader, "대통령 우후루 케냐타");
  assert.equal(referenceLeadership("Argentina", "2024-06-01").leader, "대통령 하비에르 밀레이");
  assert.equal(referenceLeadership("Mexico", "2025-01-01").leader, "대통령 클라우디아 셰인바움");
});

test("uncovered countries and unreadable dates degrade to nothing quietly", () => {
  assert.deepEqual(referenceLeadership("Atlantis", "2016-09-27"), {});
  assert.deepEqual(referenceLeadership("China", "nonsense"), {});
  assert.deepEqual(referenceLeadership("", ""), {});
});

console.log("\nThe palette for divergence — real contenders, never inventions");

test("the era's real contenders surface, window-gated, and vanish once in office", () => {
  const figures2016 = referencePoliticalFigures("South Korea", "2016-09-27");
  assert.ok(figures2016.some((name) => name.startsWith("문재인")), "the era's leading contender is on the palette");
  // Once a contender takes office they move to the officeholder record.
  const figures2018 = referencePoliticalFigures("South Korea", "2018-01-15");
  assert.ok(!figures2018.some((name) => name.startsWith("문재인")), "an inaugurated contender leaves the palette");
  assert.deepEqual(referencePoliticalFigures("Atlantis", "2016-09-27"), []);
});

test("the palette rides in the sheet prompt as a palette, never an instruction", () => {
  assert.match(GAMEPLAY, /MAJOR REAL POLITICAL FIGURES of \$\{target\}/);
  assert.match(GAMEPLAY, /never an invented name/);
  // No validator enforcement exists for figures — grep would find a correction
  // pass if one were added; the record corrects, the palette only offers.
  assert.doesNotMatch(GAMEPLAY, /politicalFigures\[/);
});

console.log("\nThe sheet task actually consults it");

test("wired into prompt, backfill, and the validator's correction pass", () => {
  // 갱신(2026-08-09): 호출부가 resolveLeadership으로 바뀌었다 — 핀이 지키는 불변식
  // (시트 태스크가 기록을 실제로 조회한다)은 그대로다. 여기에 두 가지를 더 고정한다:
  // 폴리티 별칭 사슬을 넘길 것, 그리고 프리셋 시딩을 폴백으로 넘길 것 — 이 둘이
  // 빠졌을 때 12B가 없는 사람을 지어냈다.
  assert.match(GAMEPLAY, /resolveLeadership\(referenceName, sheetDate, \{/);
  assert.match(GAMEPLAY, /aliases: polityRecord\?\.aliases \?\? \[\]/);
  assert.match(GAMEPLAY, /seed: polityRecord\?\.leadership \?\? null/);
  assert.match(GAMEPLAY, /OFFICEHOLDERS ON RECORD for \$\{target\}/);
  // Campaign record → era record → honest unknown, in that order.
  assert.match(GAMEPLAY, /\|\| normalizeString\(reference\[field\]\) \|\| "\(미확인\)"/);
  assert.match(GAMEPLAY, /is not the officeholder on record for/);
  // The campaign's own DIFFERENT person always stands — alternate history wins.
  assert.match(GAMEPLAY, /if \(priorOwn && !isRoleSentinel\(priorOwn\) && !sameLeaderPerson\(priorOwn, recorded\)\) continue;/);
});

console.log("\nEra packs — the record reaches 1444, the bundle does not");

await (async () => {
  // Loading a pack for a historical date must not throw; unfilled placeholder
  // packs simply add nothing yet.
  await ensureReferenceEra("1444-11-11");
  await ensureReferenceEra("1836-06-01");
  await ensureReferenceEra("1936-01-01");
  pass += 1;
  console.log("  ok  era packs load on demand for any historical date");
})();

test("the world-wars pack knows the century, including states that no longer exist", () => {
  assert.equal(referenceLeadership("Germany", "1936-01-01").leader, "총통 아돌프 히틀러");
  assert.equal(referenceLeadership("Soviet Union", "1936-01-01").leader, "서기장 이오시프 스탈린");
  // A defunct state answers under its successor's name too.
  assert.equal(referenceLeadership("Russia", "1936-01-01").leader, "서기장 이오시프 스탈린");
  assert.equal(referenceLeadership("East Germany", "1955-01-01").leader, "서기장 발터 울브리히트");
  assert.equal(referenceLeadership("Japan", "1942-01-01").leader, "총리 도조 히데키");
  assert.equal(referenceLeadership("Japan", "1942-01-01").headOfState, "천황 히로히토");
  assert.equal(referenceLeadership("South Korea", "1970-01-01").leader, "대통령 박정희");
  assert.equal(referenceLeadership("China", "1912-06-01").leader, "대총통 위안스카이");
  assert.ok(referencePoliticalFigures("France", "1941-01-01").some((name) => name.startsWith("샤를 드골")));
});

test("Cowork handover: gaps filled, and a direct key beats its era alias", () => {
  // Slovakia 1939-45 has its own rows; the "Slovakia" → "Czechoslovakia"
  // alias serves the rest of the century and must never shadow them (the
  // handover bug: Slovakia@1939 answered Czechoslovakia's 에밀 하하).
  assert.equal(referenceLeadership("Slovakia", "1939-09-01").leader, "총리 요제프 티소");
  assert.equal(referenceLeadership("Slovakia", "1939-09-01").headOfState, "(없음)");
  assert.equal(referenceLeadership("Slovakia", "1955-01-01").leader, "제1서기 안토닌 노보트니", "post-war Slovakia rides the Czechoslovakia alias again");
  assert.equal(referenceLeadership("Serbia", "1914-07-28").leader, "국왕 페타르 1세");
  assert.equal(referenceLeadership("Serbia", "1914-07-28").deputy, "총리 니콜라 파시치");
  assert.equal(referenceLeadership("France", "1946-03-05").leader, "총리 펠릭스 구앵");
  assert.equal(referenceLeadership("Montenegro", "1914-07-28").leader, "국왕 니콜라 1세");
  assert.equal(referenceLeadership("Manchukuo", "1940-01-01").leader, "황제 푸이(강덕제)");
  assert.equal(referenceLeadership("Manchukuo", "1940-01-01").deputy, "국무총리 장징후이");
  assert.equal(referenceLeadership("Tibet", "1920-01-01").leader, "달라이 라마 13세");
  assert.equal(referenceLeadership("Nejd", "1914-07-28").leader, "에미르 압둘아지즈 이븐 사우드");
  // 해방 공간: 군정 사령관이 지도자 행을 채운다 (1947-48 북측 공백은 정직).
  assert.equal(referenceLeadership("South Korea", "1946-03-05").leader, "미군정 사령관 존 하지");
  assert.equal(referenceLeadership("North Korea", "1946-03-05").leader, "소련군정 25군 사령관 테렌티 치스차코프");
});

test("one unbroken record from the grand-campaign start to the present", () => {
  // A leader answers for a major polity at every probe across 580 years.
  for (const [date, country] of [
    ["1444-11-11", "France"], ["1500-01-01", "Spain"], ["1600-01-01", "United Kingdom"],
    ["1700-01-01", "Russia"], ["1800-01-01", "United Kingdom"], ["1850-01-01", "France"],
    ["1900-01-01", "United Kingdom"], ["1950-01-01", "United States"], ["2000-01-01", "United States"],
    ["2020-01-01", "South Korea"],
  ]) {
    assert.ok(referenceLeadership(country, date).leader, `${country} has a leader on record at ${date}`);
  }
});

test("the early-modern pack answers with each polity's own style", () => {
  // The grand-campaign start date itself.
  assert.equal(referenceLeadership("France", "1444-11-11").leader, "국왕 샤를 7세");
  assert.equal(referenceLeadership("United Kingdom", "1520-06-01").leader, "국왕 헨리 8세");
  assert.equal(referenceLeadership("United Kingdom", "1520-06-01").deputy, "수석장관 토머스 울지");
  // A republic's own style, and an interregnum's.
  assert.equal(referenceLeadership("United Kingdom", "1654-01-01").leader, "호국경 올리버 크롬웰");
  assert.equal(referenceLeadership("France", "1650-01-01").deputy, "재상 마자랭");
  assert.equal(referenceLeadership("Joseon", "1470-01-01").leader, "국왕 성종");
});

test("the revolutions pack answers with each polity's own style", () => {
  assert.equal(referenceLeadership("France", "1811-01-01").leader, "황제 나폴레옹 1세");
  assert.equal(referenceLeadership("United Kingdom", "1870-06-01").leader, "총리 윌리엄 글래드스턴");
  // The open-start regression: the modern 엘리자베스 2세 row (accession 1952)
  // must never mask the era pack's 빅토리아 for 1870.
  assert.equal(referenceLeadership("United Kingdom", "1870-06-01").headOfState, "여왕 빅토리아");
  // Historical aliases: a Korean campaign asks by any of its names.
  assert.equal(referenceLeadership("South Korea", "1780-01-01").leader, "국왕 정조");
  assert.equal(referenceLeadership("Joseon", "1780-01-01").leader, "국왕 정조");
  assert.equal(referenceLeadership("Germany", "1885-01-01").deputy, "재상 오토 폰 비스마르크");
});

test("the coverage contract holds for the shipped preset (Modern Day, 2016)", () => {
  const span = referenceCoverageSpan("2016-01-01", { floor: 15 });
  assert.ok(span.until >= 2025, `coverage runs to ${span.until} (expected ≥ 2025)`);
  assert.ok(span.from <= 2006, `coverage reaches back to ${span.from} (expected ≤ 2006)`);
  assert.ok(span.years >= 20, `${span.years} contiguous years around 2016 — the ≥20-year preset contract`);
});

test("the backfilled decade answers like the verified one", () => {
  assert.equal(referenceLeadership("South Korea", "2008-06-01").leader, "대통령 이명박");
  assert.equal(referenceLeadership("South Korea", "2008-06-01").deputy, "국무총리 한승수");
  assert.equal(referenceLeadership("Japan", "2007-01-01").leader, "총리 아베 신조");
  assert.equal(referenceLeadership("United States", "2009-06-01").leader, "대통령 버락 오바마");
  assert.equal(referenceLeadership("North Korea", "2010-01-01").leader, "국방위원장 김정일");
});

console.log("\n별칭 사슬 — 프리셋 폴리티 이름이 기록에 닿는다");

await (async () => {
  // 실측 사고: 폴리티 이름만으로 조회하면 British Empire / French Republic /
  // Republic of China / Mongolian People's Republic 이 전부 빈손을 받았고, 12B가
  // 그 네 시트를 없는 사람으로 채웠다 — "총리 스탠리 메이너드 맥도널드",
  // "국왕 조지 6세"(1936 즉위, 시대착오), "총리 알베르토 바리니",
  // "대통령 알퐁스 페리시에", "국무원 주석 펑펑". 빌드가 이미 쓰던 별칭 사슬을
  // 런타임도 쓰게 한 것이 수리다.
  const { resolveLeadership } = await import("../src/runtime/leaderReference.js");
  await ensureReferenceEra("1935-12-01");
  const gbr = resolveLeadership("British Empire", "1935-12-01", { aliases: ["United Kingdom"] });
  assert.equal(gbr.leader, "총리 스탠리 볼드윈");
  // 조지 5세는 1936-01-20에 죽는다 — 1935-12 시트의 조지 6세는 시대착오다.
  assert.equal(gbr.headOfState, "국왕 조지 5세");
  assert.equal(gbr.__via, "United Kingdom");
  assert.equal(gbr.__source, "reference");
  assert.equal(resolveLeadership("French Republic", "1935-12-01", { aliases: ["France"] }).headOfState, "대통령 알베르 르브룅");
  assert.equal(resolveLeadership("Republic of China", "1935-12-01", { aliases: ["China"] }).leader, "총통 장제스");
  assert.equal(resolveLeadership("Mongolian People's Republic", "1935-12-01", { aliases: ["Mongolia"] }).leader, "총리 펠지딘 겐덴");
  pass += 1;
  console.log("  ok  the alias chain answers for the polity names presets actually use");
})();

await (async () => {
  const { resolveLeadership } = await import("../src/runtime/leaderReference.js");
  await ensureReferenceEra("1935-12-01");
  const seeded = resolveLeadership("Nowhereland", "1935-12-01", {
    seed: { asOf: "1935-12-01", via: "Nowhereland", leader: "총리 아무개" },
  });
  assert.equal(seeded.leader, "총리 아무개");
  assert.equal(seeded.__source, "seed");
  assert.equal(seeded.__asOf, "1935-12-01");
  // 레퍼런스가 답하면 시드는 지지 않는다 — 날짜 창을 아는 쪽이 이긴다.
  const beaten = resolveLeadership("British Empire", "1935-12-01", {
    aliases: ["United Kingdom"],
    seed: { asOf: "1935-12-01", leader: "총리 엉뚱한사람" },
  });
  assert.equal(beaten.leader, "총리 스탠리 볼드윈");
  assert.equal(beaten.__source, "reference");
  pass += 1;
  console.log("  ok  the build's start-date seed is the fallback, and says so");
})();

await (async () => {
  // 프리셋 전수 — 1444년 이후 폴리티가 하나라도 빈손이면 그 자리는 12B의 창작 영역이다.
  const { resolveLeadership } = await import("../src/runtime/leaderReference.js");
  const fs = await import("node:fs");
  const dir = new URL("../scripts/presets/", import.meta.url);
  const specs = fs.readdirSync(dir).filter((f) => f.endsWith(".spec.mjs"));
  const failures = [];
  for (const file of specs) {
    const spec = (await import(new URL(file, dir))).default;
    const date = spec.game?.startDate ?? "";
    // 기록의 설계 범위는 **가장 이른 시대팩의 시작**이다 — 2026-08-15에
    // highMedieval(1000~1443)이 서면서 1444에서 1000으로 내려왔고, 그로써
    // medieval-1200·mongol-1300도 이 핀의 사정권에 들어온다(그 두 보드는
    // 각각 2/56·3/64로 거의 전 왕좌가 모델의 창작 영역이었다). 그보다 이른
    // roman-117과 ISO가 아닌 bronze-1200bc는 여전히 정직한 공백이다.
    if (!/^\d{4}-/.test(date) || Number(date.slice(0, 4)) < 1000) continue;
    await ensureReferenceEra(date);
    for (const polity of Object.values(spec.polities ?? {})) {
      // A thing with no voice has no officeholder, and inventing one for it
      // would be worse than the gap this pin exists to catch. The dead do not
      // have a head of state. See src/runtime/speechless.js.
      if (isSpeechlessPolity(polity)) continue;
      if (!resolveLeadership(polity.name, date, { aliases: polity.aliases })) {
        failures.push(`${spec.id}: ${polity.name}`);
      }
    }
  }
  // THE HANDOVER LIST CAME BACK — SAME MECHANISM, NEW CAUSE, STILL BY NAME.
  //
  // It stood for one day, emptied, and returns eleven names smaller than it was.
  // The cause is the same shape as before: victorian-1836 gained the colonial
  // structure on 2026-08-16 (reports 3, 11 and 12 — the board was drawing Canada,
  // Australia and New Zealand as single modern British blocks) and the spec and the
  // leader pack are held by different sessions this cycle, so again the states
  // arrive before their rulers.
  //
  // The rule the last list was written under holds and is why this one is
  // acceptable: names, not a waiver. A rule would silently cover every future
  // polity; a list of eleven strings can only shrink. Anything outside it still
  // fails outright, so no throne is left for the model to invent unnoticed.
  //
  // Zulu Kingdom is deliberately NOT here — Dingane already answers, which is the
  // check that this list names a real gap rather than every new polity.
  const awaitingLeaderPack = new Set([
    // 북아메리카 — 허드슨만 회사(조지 심프슨 총독)와 1791년 헌법법의 두 캐나다,
    // 그리고 연방 전의 대서양 식민지 넷.
    "victorian-1836: Hudson's Bay Company",
    "victorian-1836: Province of Upper Canada",
    "victorian-1836: Province of Lower Canada",
    "victorian-1836: Colony of New Brunswick",
    "victorian-1836: Colony of Nova Scotia",
    "victorian-1836: Prince Edward Island Colony",
    "victorian-1836: Crown Colony of Newfoundland",
    // 중앙아시아·걸프 — 보고 6. **코칸트 하나뿐이다**: 바레인을 같이 넣었다가
    // 바로 아래 "답이 생긴 이름은 빠져야 한다" 핀에 걸렸다. 알칼리파가 이미
    // 답한다 — 핀이 목록의 과잉을 잡은 첫 사례이고, 그러라고 건 것이다.
    "victorian-1836: Khanate of Kokand",
    // 독일 다섯 — 독일 연방 덩어리에서 꺼낸 여섯 중 다섯. **하노버는 여기 없다**:
    // 1836년 하노버 국왕은 영국과 동군연합인 윌리엄 4세라 이미 답한다(동군연합이
    // 끊기는 것은 1837-06-20, 살리카법).
    "victorian-1836: Kingdom of Württemberg",
    "victorian-1836: Grand Duchy of Baden",
    "victorian-1836: Free Hanseatic City of Bremen",
    "victorian-1836: Free and Hanseatic City of Hamburg",
    "victorian-1836: Grand Duchy of Saxe-Weimar-Eisenach",
    // 알제리 둘 — 보고 2를 고치며 세웠다. 둘 다 기록이 단단해서 사람이 답할 것으로
    // 본다: 에미르 압델카데르(1832 추대)와 아흐메드 베이(1826 임명, 1837-10 함락).
    "victorian-1836: Emirate of Abdelkader",
    "victorian-1836: Beylik of Constantine",
    // 오세아니아 — 총독 셋(버크·아서/프랭클린·스털링)과, 사람이 아니라 **연합**이
    // 답이어야 할 자리 하나. 부족연합에는 상설 수장이 없다 — 1835년 선언은 랑가티라
    // 들의 회의체를 세웠고, 라구사 원칙이 그대로 적용되는 자리로 보인다.
    "victorian-1836: Colony of New South Wales",
    "victorian-1836: Colony of Van Diemen's Land",
    "victorian-1836: Colony of Western Australia",
    "victorian-1836: United Tribes of New Zealand",
  ]);
  const unexpected = failures.filter((f) => !awaitingLeaderPack.has(f));
  assert.deepEqual(unexpected, [],
    "every post-1444 preset polity must resolve (outside the named handover list)");

  // The list must not outlive its cause: a name that starts resolving has to come
  // out, or the list rots into the waiver it was written to avoid.
  const resolvedButStillListed = [...awaitingLeaderPack].filter((f) => !failures.includes(f));
  assert.deepEqual(resolvedButStillListed, [],
    "a polity that now resolves must be removed from awaitingLeaderPack");

  // ── 이전 회차의 기록 (2026-08-16, 마흔 자리) ─────────────────────────────
  // THE HANDOVER LIST IS GONE, AND THAT IS THE POINT OF IT.
  //
  // A waiver list stood here for one day. victorian-1836 gained forty polities
  // on 2026-08-16 (the South American republics, the Maghreb, the Senegambian
  // kingdoms, the East India Company and the Malay sultanates, Nejd, Wallachia
  // and Moldavia) because the board had been drawing those lands as holes, and
  // the spec and the leader pack were held by different sessions that cycle —
  // so the states arrived before their rulers and forty thrones sat open.
  //
  // They were listed BY NAME rather than waived by a rule, so that the list
  // could only shrink and never quietly grow. leaderEras/revolutions.js filled
  // all forty the same day and the list came out. No exemption replaces it:
  // from here a preset polity with no answerable ruler fails outright, which is
  // the invariant the pin was written for — no throne is left for the model to
  // invent unnoticed.
  // (이 자리의 단언은 위로 옮겼다 — 인계 목록 밖은 여전히 즉시 실패한다.)
  pass += 1;
  console.log("  ok  every polity of every preset from 1444 on resolves");
})();

await (async () => {
  // 세이브가 시딩을 버리면 위의 전부가 무의미하다 — 실제로 21/21이 0이 됐었다.
  const { normalizeWorldState } = await import("../src/runtime/gameState.js");
  const world = normalizeWorldState({
    polityOverrides: {
      "British Empire": {
        code: "GBR",
        name: "British Empire",
        aliases: ["United Kingdom"],
        leadership: { asOf: "1935-12-01", via: "United Kingdom", leader: "총리 스탠리 볼드윈", headOfState: "국왕 조지 5세" },
      },
      Empty: { code: "EMP", name: "Empty", leadership: { asOf: "1935-12-01" } },
    },
  });
  assert.equal(world.polityOverrides["British Empire"].leadership.leader, "총리 스탠리 볼드윈");
  assert.equal(world.polityOverrides["British Empire"].leadership.via, "United Kingdom");
  // 사람이 하나도 없는 시드는 시드가 아니다.
  assert.equal(world.polityOverrides.Empty.leadership, undefined);
  pass += 1;
  console.log("  ok  normalizeWorldState keeps the polity leadership seeding");
})();

console.log(`\n${pass} passed\n`);

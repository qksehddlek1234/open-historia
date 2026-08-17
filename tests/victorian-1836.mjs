// THE FACES WERE ON DISK THE WHOLE TIME. THE ROSTER HAD NO CELL TO PUT THEM IN.
//
// victorian-1836 measured 8 of 46 era faces matched, and 0.7% of its border
// drawn from era data — the worst reproduction rate on any board that has a
// dump. The dump was not the problem. The assembler had closed Königreich
// Bayern, Königreich Sachsen, Kurhessen, Waldeck, Pyrmont and fifteen more, and
// the spec was writing all of them as one cell:
//
//   GER: { name: "German Confederation", ... }
//
// So every one of those faces looked for an owner named "Kingdom of Bavaria",
// found nothing, and was dropped. The spec's own header had predicted the
// states — "about 35 German Confederation states … not one of them is drawable
// from modern GADM provinces" — and then the roster below it collapsed them.
//
// Italy failed the same way but worse: `ITD: Italian Duchies` MATCHED
// Granducato di Toscana through stripStyle, so the board drew one duchy's
// outline under an aggregate name that also claimed Parma, Modena and Lucca.
// A wrong match is harder to see than a miss.
//
// After the split: 46 of 46 faces matched, 0.7% → 13.8%, 84 regions reassigned
// and 41 cut three and four ways (DEU.DE71 alone: Hesse-Homburg, Nassau,
// Kurhessen, Hesse-Darmstadt). These pins hold the shape of that fix — the
// states, the aliases the assembler actually writes, and the two places where
// leaving a face unowned would have stood a dependency up as a country.
import assert from "node:assert/strict";
import fs from "node:fs";
import { existsSync } from "node:fs";
import { isRoleSentinel } from "../src/runtime/countryStatLedger.js";
import { ensureReferenceEra, referenceLeadership } from "../src/runtime/leaderReference.js";
import { buildFaceNameIndex, matchFace } from "../scripts/presets/lib/eraGeometry.mjs";

let pass = 0;
const test = (name, fn) => { fn(); pass += 1; console.log(`  ok  ${name}`); };
const SPEC_SRC = fs.readFileSync(new URL("../scripts/presets/victorian-1836.spec.mjs", import.meta.url), "utf8");
const spec = (await import("../scripts/presets/victorian-1836.spec.mjs")).default;
const byName = new Map(Object.values(spec.polities).map((p) => [p.name, p]));

console.log("\nThe Confederation is a confederation again");

test("the nineteen states the assembler closed are on the roster", () => {
  // Parsed as a list rather than spot-checked, so dropping one fails here
  // instead of quietly going back into the aggregate.
  const states = [
    "Kingdom of Bavaria", "Kingdom of Saxony", "Grand Duchy of Hesse",
    "Electorate of Hesse", "Grand Duchy of Mecklenburg-Schwerin", "Duchy of Nassau",
    "Duchy of Saxe-Meiningen", "Duchy of Saxe-Altenburg", "Duchy of Anhalt-Bernburg",
    "Principality of Lippe", "Principality of Waldeck-Pyrmont",
    "Principality of Schaumburg-Lippe", "Free City of Frankfurt", "Free City of Lübeck",
    "Landgraviate of Hesse-Homburg", "Hohenzollern-Sigmaringen",
    "Principality of Reuss-Greiz", "Principality of Reuss-Gera", "Liechtenstein",
  ];
  const missing = states.filter((name) => !byName.has(name));
  assert.deepEqual(missing, [], "back in the blob");
});

test("…and each carries the EXACT string the assembler wrote", () => {
  // This is the whole mechanism. The face is matched on its own name, and the
  // assembler writes German: "Königreich Bayern", not "Kingdom of Bavaria".
  // A roster entry without the native form is a state that still cannot land.
  for (const [faceName, polityName] of [
    ["Königreich Bayern", "Kingdom of Bavaria"],
    ["Königreich Sachsen", "Kingdom of Saxony"],
    ["Großherzogtum Hessen", "Grand Duchy of Hesse"],
    ["Kurhessen", "Electorate of Hesse"],
    ["Großherzogtum Mecklenburg-Schwerin", "Grand Duchy of Mecklenburg-Schwerin"],
    ["Herzogtum Anhalt-Bernburg", "Duchy of Anhalt-Bernburg"],
    ["Freie und Hansestadt Lübeck", "Free City of Lübeck"],
    ["Fürstentum Reuß-Greiz", "Principality of Reuss-Greiz"],
    ["Fürstentum Reuß-Gera", "Principality of Reuss-Gera"],
  ]) {
    assert.ok(byName.get(polityName)?.aliases?.includes(faceName),
      `${polityName} must answer to "${faceName}"`);
  }
});

test("Waldeck-Pyrmont takes BOTH its faces — the exclave is not a second state", () => {
  // Waldeck sits west of Kassel, Pyrmont 60km north around the spa. Two closed
  // faces, one principality; the graft is happy to give one owner several.
  const wal = byName.get("Principality of Waldeck-Pyrmont");
  assert.ok(wal.aliases.includes("Waldeck") && wal.aliases.includes("Pyrmont"),
    "one owner, two faces — splitting them invents a state that never existed");
});

test("the aggregate survives, narrowed, and says what it now means", () => {
  // GER is still needed: Hannover, Württemberg, Baden, Braunschweig, Oldenburg,
  // Hamburg and the rest have no face yet. What must not come back is the claim
  // that it stands for the states listed above.
  assert.ok(byName.has("German Confederation"), "the faceless members still need a holder");
  const at = SPEC_SRC.indexOf("GER: {");
  const why = SPEC_SRC.slice(Math.max(0, at - 900), at);
  assert.match(why, /could NOT close a face/, "the narrowed meaning must stay written next to it");
});

console.log("\nItaly: four duchies where an aggregate was drawing one outline");

test("ITD is gone and its two region rows point at real duchies", () => {
  assert.ok(!byName.has("Italian Duchies"), "the aggregate that matched Toscana by accident");
  assert.doesNotMatch(SPEC_SRC, /"ITA\.16_1":\s*"ITD"/);
  assert.match(SPEC_SRC, /"ITA\.16_1":\s*"TOS"/, "Tuscany is its own grand duchy");
  assert.match(SPEC_SRC, /"ITA\.6_1":\s*"MOD"/, "Emilia's baseline; the Parma face carves its half back");
  for (const name of ["Grand Duchy of Tuscany", "Duchy of Modena and Reggio",
    "Duchy of Parma and Piacenza", "Duchy of Lucca"]) {
    assert.ok(byName.has(name), `${name} is a state in 1836, not a footnote`);
  }
});

console.log("\nA territory whose name cannot say who holds it");

test("the crown dependencies and the two colonies are stated, not guessed", () => {
  // Left unowned these read as sovereign states — the same fault
  // tests/era-sovereignty.mjs pins for the 1946 Isle of Man face.
  for (const face of ["Isle of Man", "Jersey", "Colony of Malta",
    "United States of the Ionian Islands"]) {
    assert.equal(spec.eraGeometry.faceOwners?.[face], "GBR", `${face} answers to the Crown`);
  }
});

test("the player's own country was among the 38 misses, for a dull reason", () => {
  // The face is styled "United Kingdom of Great Britain and Ireland" and
  // stripStyle only takes "Kingdom of" off the FRONT of a label.
  assert.ok(byName.get("United Kingdom").aliases
    .includes("United Kingdom of Great Britain and Ireland"),
  "without this the board's own starting power draws no era outline");
});

console.log("\nEvery new throne is answered from the record, not invented");

await ensureReferenceEra("1836-01-01");

test("every polity the spec declares can be answered", () => {
  // Resolved the way build-preset resolves it — name first, then each alias,
  // and a sentinel does not end the search. Asserting on the name alone would
  // fail twelve polities the builder answers fine through "Austria", "Prussia",
  // "Persia" and the like, and this pin exists to catch real gaps.
  const answered = (polity) => [polity.name, ...(polity.aliases ?? [])].some((key) => {
    const row = referenceLeadership(key, "1836-01-01");
    const real = (value) => Boolean(value) && !isRoleSentinel(value);
    return real(row?.leader) || real(row?.headOfState);
  });
  const unanswered = Object.values(spec.polities).filter((p) => !answered(p)).map((p) => p.name);
  // THE GAP IS NAMED, ONE POLITY AT A TIME, so it cannot grow quietly — that is
  // what this pin is for and it did its job twice in one day: adding the roster
  // turned it red with forty names, and the leader pack turned it green again.
  //
  // The forty were the South American republics, the Maghreb, the Senegambian
  // and Malay kingdoms, the Company, Nejd, Wallachia and Moldavia — states that
  // arrived on the board before their rulers because the spec and the leader
  // pack were held by different sessions that cycle. The list is empty because
  // the owner finished it, not because the rule was relaxed. It stays empty.
  //
  // Peru-Bolivian Confederation left this list by being deleted: it was decreed
  // 28 October 1836 and installed 1 May 1837, so a board opening 1 January 1836
  // could not carry it. Peru and Bolivia stand in its place.
  // ── 2026-08-16 두 번째 회차: 식민지 구조 열하나 ─────────────────────────
  // 같은 일이 같은 이유로 다시 일어났다. 보고 3·11·12(현대 국경 = 식민지 경계)를
  // 고치며 캐나다·호주·뉴질랜드의 실제 통치 단위를 세웠고, 스펙과 지도자 팩이
  // 이번 회차에도 서로 다른 세션에 있다. **규칙을 푼 게 아니라 이름을 적는다** —
  // 목록은 줄어들 수만 있고, 밖에 있는 이름은 여전히 즉시 빨개진다.
  //
  // 줄루 왕국은 여기 없다. 딩가네가 이미 답하고, 그것이 이 목록이 "새 폴리티"가
  // 아니라 **진짜 공백**만 담고 있다는 증거다.
  // 목록이 오늘만 세 번 섰다 — 마흔, 열셋, 스물하나. 세 번 다 같은 날 비었다.
  // 기제는 구조적이다(스펙과 지도자 팩이 서로 다른 세션에 있다). 막아야 할 것은
  // 목록이 서는 일이 아니라 **자기 원인보다 오래 사는 일**이고, 아래 두 줄이
  // 그걸 강제한다: 목록 밖은 즉시 빨개지고, 답이 생긴 이름은 반드시 빠진다.
  //
  // ★ 바레인이 남긴 관찰은 목록보다 오래 간다. 이 핀과 tests/leaders.mjs의 핀은
  // **다른 질문을 한다** — 저쪽 `resolveLeadership`은 별칭 사슬 전체를 보고,
  // 여기 `referenceLeadership`은 REFERENCE 표에 그 해를 덮는 행이 있는지만
  // 묻는다. 그래서 사슬 어딘가에서 답하지만 표에는 없는 폴리티가 한쪽만
  // 통과했다. 지금은 알칼리파가 표에 있어 둘 다 통과하지만, 다음에 두 목록이
  // 갈리면 그건 결함이 아니라 이 차이일 수 있다.
  const awaitingLeaderPack = [];
  assert.deepEqual(unanswered.sort().filter((n) => !awaitingLeaderPack.includes(n)), [],
    "a name added here without a leader row is a to-do, not a decision");
  // 목록이 자기 원인보다 오래 살면 안 된다 — 답이 생긴 이름은 빠져야 한다.
  assert.deepEqual(awaitingLeaderPack.filter((n) => !unanswered.includes(n)), [],
    "a polity that now answers must be removed from awaitingLeaderPack");
});

test("the forty new thrones answer with a PERSON where the record has one", () => {
  // Sampled across the five groups the roster added, because a pack can pass
  // the emptiness pin above while quietly answering everything with an
  // institution. These are places where a named ruler IS on record.
  for (const [polity, expected] of [
    ["Bolivia", /안드레스 데 산타 크루스/],
    ["Paraguay", /^종신 최고독재관 호세 가스파르/],  // 파라과이에 "대통령"은 1844년까지 없다
    ["Kingdom of Benin", /오바 오셈웬데/],
    ["Massina Empire", /세쿠 아마두/],
    ["Emirate of Nejd", /^이맘 파이살 빈 투르키/],    // 술탄도 국왕도 아니다 — 그 칭호는 20세기다
    ["Sultanate of Perak", /샤하부딘 리아얏 샤/],
    ["Principality of Wallachia", /알렉산드루 디미트리에 기카/],
    ["Principality of Moldavia", /미하일 스투르자/],
    ["Republic of Krakow", /비엘로그워프스키/],
  ]) {
    assert.match(referenceLeadership(polity, "1836-01-01").leader ?? "", expected,
      `${polity}: the record names a person here`);
  }
});

test("…and with an OFFICE where it does not — the Ragusa rule, four times", () => {
  // Kaabu's nineteenth-century king list does not exist: Mandinka oral history
  // transmits "forty-seven mansas" and preserves two names, neither of them in
  // the 1830s. Baol's two source lineages contradict each other outright (its
  // own teigne, or the Cayor damel holding both crowns). Sine's single
  // candidate has an accession dated 1825 by Klein and 1839 by the Senegambian
  // king lists. Switzerland had no permanent head of state at all under the
  // 1815 pact — the Vorort rotated between three cantons every two years.
  //
  // Four different KINDS of absence, and not one of them is a reason to write a
  // name. What this holds is that the answer still arrives.
  for (const [polity, expected] of [
    ["Kaabu", /만사바/],
    ["Kingdom of Baol", /테인/],
    ["Kingdom of Sine", /마드 아 시니그/],
    ["Switzerland", /의장/],
  ]) {
    const held = referenceLeadership(polity, "1836-01-01").leader ?? "";
    assert.match(held, expected, `${polity}: name the office when the person is not on record`);
    assert.ok(!isRoleSentinel(held), `${polity}: an institution is an answer, "(없음)" is not`);
  }
});

test("where name and power split, the board gets BOTH", () => {
  // Bornu has two rulers in 1836 and the one that matters is not on the throne:
  // the Sayfawa mai reigns, the shehu who beat back the Fulani jihad governs.
  // Johore is the same shape for the opposite reason — the sultan died in
  // September 1835 and his heir was ten, unrecognised by the British for twenty
  // years, while the temenggong ran the mainland and Singapore. Writing one of
  // each pair erases the fact that made the country what it was.
  const bornu = referenceLeadership("Bornu", "1836-01-01");
  assert.match(bornu.leader ?? "", /^셰후 무함마드 알아민 알카네미/, "the shehu governs");
  assert.match(bornu.headOfState ?? "", /마이 이브라힘 4세/, "the mai reigns");
  const johore = referenceLeadership("Sultanate of Johore", "1836-01-01");
  assert.match(johore.leader ?? "", /^트믄공 다잉 이브라힘/, "the temenggong rules");
  assert.match(johore.headOfState ?? "", /술탄 알리 이스칸다르 샤/, "the boy sultan is named too");
});

test("the new polities' successions inside the campaign's first years are on record", () => {
  // Five of the forty change hands within twenty-six months of the opening
  // date. A board that only knows 1 January hands all five to the model.
  assert.match(referenceLeadership("Republic of Krakow", "1836-03-01").leader ?? "", /할레르/,
    "Austrian troops entered on 17 February and the president resigned on the 25th");
  assert.match(referenceLeadership("East India Company", "1836-06-01").leader ?? "", /오클랜드/,
    "Metcalfe handed over on 4 March 1836");
  assert.match(referenceLeadership("Almamate of Futa Toro", "1836-12-01").leader ?? "", /바발리 리/,
    "an elective almamate turns over in months, not decades");
  assert.match(referenceLeadership("Bornu", "1837-09-01").leader ?? "", /우마르/,
    "al-Kanemi died 8 June 1837");
  assert.match(referenceLeadership("Beylik of Tunis", "1838-01-01").leader ?? "", /아흐마드 1세/,
    "Mustafa died 10 October 1837");
});

test("what is named is named, and a rotating office is an institution", () => {
  // Ludwig I's dates are firm. Frankfurt's two mayors are drawn annually from
  // the Senate and San Marino's Captains Regent change every six months —
  // naming a person there would be an invention with a date attached.
  assert.match(referenceLeadership("Kingdom of Bavaria", "1836-01-01").leader ?? "", /루트비히 1세/);
  assert.match(referenceLeadership("Free City of Frankfurt", "1836-01-01").leader ?? "", /윤번직/);
  assert.match(referenceLeadership("San Marino", "1836-01-01").leader ?? "", /집정관/);
  assert.match(referenceLeadership("Couto Misto", "1836-01-01").leader ?? "", /판사/);
  for (const name of ["Free City of Frankfurt", "San Marino", "Couto Misto", "Trucial States"]) {
    assert.ok(!isRoleSentinel(referenceLeadership(name, "1836-01-01").leader ?? ""),
      `${name}: an institution is an answer, "(없음)" is not`);
  }
});

test("the successions inside the campaign's first year are on record", () => {
  // Four thrones change hands in 1836 and a fifth the February after. A board
  // that only knows 1 January hands all five to the model.
  assert.match(referenceLeadership("Kingdom of Saxony", "1836-01-01").leader ?? "", /안톤/);
  assert.match(referenceLeadership("Kingdom of Saxony", "1836-07-01").leader ?? "", /프리드리히 아우구스트 2세/);
  assert.match(referenceLeadership("Liechtenstein", "1836-05-01").leader ?? "", /알로이스 2세/);
  assert.match(referenceLeadership("Principality of Reuss-Greiz", "1836-12-01").leader ?? "", /하인리히 20세/);
  assert.match(referenceLeadership("Grand Duchy of Mecklenburg-Schwerin", "1837-03-01").leader ?? "", /파울 프리드리히/);
});

test("Muhammad Ali is a GOVERNOR — the khedive title is thirty-one years away", () => {
  // Reported from the board: Egypt came up under a khedive in 1836. The Porte
  // appointed Muhammad Ali wāli in 1805 and never granted him the other word;
  // Abdülaziz granted it to Isma'il on 8 June 1867, which is why Isma'il holds
  // two rows. The four governors between them were already written correctly,
  // so the list was contradicting itself.
  assert.match(referenceLeadership("Egypt", "1836-01-01").leader ?? "", /^왈리 무함마드 알리/);
  assert.match(referenceLeadership("Egypt", "1867-01-01").leader ?? "", /^왈리 이스마일/,
    "still a governor five months before the grant");
  assert.match(referenceLeadership("Egypt", "1867-07-01").leader ?? "", /^케디브 이스마일/,
    "and a khedive after it");
});

test("…while the ROSTER carries the original's name — the split is the precedent", () => {
  // The player was asked to choose between accuracy and reproduction and chose
  // to split them (2026-08-16): the board says what the original says, the
  // titles and the territory say what the year says. The two files above and
  // below this line are that division of labour, and a future session that
  // "fixes" one to match the other undoes a decision rather than a bug.
  assert.equal(byName.get("Khedivate of Egypt")?.name, "Khedivate of Egypt",
    "the roster carries the original's name for this state");
  assert.ok(byName.get("Khedivate of Egypt")?.aliases?.includes("Egypt of Muhammad Ali"),
    "and the accurate name survives as an alias, so old faces and saves still land");
});

test("Andorra keeps both co-princes, because one of them is the whole point", () => {
  const row = referenceLeadership("Andorra", "1836-01-01");
  assert.match(row.leader ?? "", /주교공/, "the Bishop of Urgell");
  assert.match(row.headOfState ?? "", /루이필리프/, "and the French head of state");
});

console.log("\nAnd the dump itself, when it is on disk");

test("every assembled face finds an owner (skipped without the dump)", () => {
  // scripts/ohm/out/ is gitignored, so this pin is opportunistic by design: it
  // runs on a clone that has built the board and stays quiet on one that has
  // not. The number it guards is 46/46, up from 8/46.
  const dump = new URL("../scripts/ohm/out/era-borders-1836-01-01-z4.geojson", import.meta.url);
  if (!existsSync(dump)) { console.log("      (dump absent — assembler output is not tracked)"); return; }
  const faceOwners = Object.fromEntries(Object.entries(spec.eraGeometry.faceOwners ?? {})
    .map(([face, code]) => [face, spec.polities[code].name]));
  const index = buildFaceNameIndex(spec.polities, []);
  const features = JSON.parse(fs.readFileSync(dump, "utf8")).features ?? [];
  const unmatched = features.filter((f) => !matchFace(f, index, faceOwners))
    .map((f) => f.properties?.name);
  assert.deepEqual(unmatched, [], "these faces are drawn and thrown away");
  assert.equal(features.length, 46);
});

test("the first country grant rides into the world as `home` (skipped unbuilt)", () => {
  // The label builder picks a polity's seat as its LARGEST cluster, and the
  // fleet measurement of 2026-08-17 found that wrong 59 times — every empire's
  // biggest colony out-measures its homeland, so tier-0 "영국" printed over
  // Oregon. The builder now stamps the first country grant into
  // polityOverrides.home; the label side will prefer the cluster holding home
  // regions. This pins the emission contract from both sides: present and
  // correct where a grant exists, ABSENT where none does — a face-only polity
  // gaining a home key would silently change its label placement.
  const worldPath = new URL("../server/data/scenarios/victorian-1836/world.json", import.meta.url);
  if (!existsSync(worldPath)) { console.log("      (world absent — board not built)"); return; }
  const po = JSON.parse(fs.readFileSync(worldPath, "utf8")).polityOverrides ?? {};
  assert.equal(po["United Kingdom"]?.home, "GBR", "the empire's home is the first grant, not the widest cluster");
  assert.equal(po["Khedivate of Egypt"]?.home, "EGY");
  assert.ok(!("home" in (po["Papal States"] ?? {})),
    "a face-only polity must NOT gain a home — absence is what keeps its behaviour unchanged");
  assert.ok(!("home" in (po["Hudson's Bay Company"] ?? {})),
    "region-grant-only polities stay on largest-cluster seating too");
});

console.log(`\n${pass} passed\n`);

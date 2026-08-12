// Round 43: the glued-field disease escalated past actions. An event shipped
// its own JSON record inside its title ("이벤트가 이런식으로 뜨더라고"), and a
// marker was BUILT named PQC 표준화 연구 센터", "kind": "research center", ….
// One cut cannot repair a six-field fusion — the record walker can.
import assert from "node:assert/strict";
import fs from "node:fs";
import {
  gluedRecordProse,
  mergeRecoveredProse,
  repairGluedAction,
  repairGluedRecord,
} from "../src/runtime/machineSyntax.js";
import {
  normalizeEventEntry,
  normalizeMarkerEntry,
} from "../src/runtime/gameState.js";

let pass = 0;
const test = (name, fn) => { fn(); pass += 1; console.log(`  ok  ${name}`); };

const ACTIONS_UI = fs.readFileSync(new URL("../src/Game/GameUI/actions.jsx", import.meta.url), "utf8");

console.log("\nA fused record is walked field by field");

test("the live event monster: six fields recovered, head clean", () => {
  const record = repairGluedRecord(
    '동남아 대상 양자 기술 포용 협력 선언", "note": "보편적 보안체계임을 강조하는 세부 정책을 공식화했습니다""", '
    + '"description": "대한민국 정부는 지원을 제공했습니다.", "importance": "major", "kind": "diplomacy", '
    + '"playerRelated":true,"impacts":{"regionTransfers":,"markerOps');
  assert.equal(record.head, "동남아 대상 양자 기술 포용 협력 선언");
  assert.equal(record.fields.description, "대한민국 정부는 지원을 제공했습니다.");
  assert.equal(record.fields.kind, "diplomacy");
  assert.equal(record.fields.importance, "major");
  assert.deepEqual(record.keys.slice(0, 2), ["note", "description"]);
});

test("the live marker: unquoted numbers do not break the chain", () => {
  const record = repairGluedRecord(
    'PQC 표준화 연구 센터", "kind": "research center", "ownerCode": "대한민국", "lng": 127.31, "lat": 37.47, "note": "양자 내성 암호 기반 거점');
  assert.equal(record.head, "PQC 표준화 연구 센터");
  assert.equal(record.fields.kind, "research center");
  assert.equal(record.fields.lng, "127.31");
  assert.equal(record.fields.lat, "37.47");
  assert.equal(record.fields.note, "양자 내성 암호 기반 거점");
});

test("ordinary Korean prose with a comma and colon is never torn up", () => {
  assert.equal(repairGluedRecord("보고서에 따르면, 결론: 준비가 부족했다"), null);
  assert.equal(repairGluedRecord("국경 순찰을 강화하고 예비군을 점검하십시오."), null);
});

test("prose helpers: body-like field first, note as fallback, machine fields never", () => {
  assert.equal(gluedRecordProse({ fields: { description: "설명", note: "메모" } }), "설명");
  assert.equal(gluedRecordProse({ fields: { note: "메모", kind: "base" } }), "메모");
  assert.equal(gluedRecordProse({ fields: { kind: "base", importance: "major" } }), "");
});

test("recovered prose merges like glued action bodies: near-equal collapses, different survives", () => {
  // The more complete copy of the same writing wins (here: the one with its
  // full stop); on a tie the recovered copy wins, as with glued actions.
  assert.equal(mergeRecoveredProse("국경 순찰 강화.", "국경 순찰 강화"), "국경 순찰 강화.");
  assert.equal(mergeRecoveredProse("국경 순찰 강화", "국경 순찰 강화!"), "국경 순찰 강화!");
  const both = mergeRecoveredProse("원래 있던 문장입니다.", "완전히 다른 회복 문장입니다.");
  assert.ok(both.includes("원래") && both.includes("완전히"));
});

test("repairGluedAction still stands on the new walker — same API, same rules", () => {
  const repaired = repairGluedAction({
    title: '원격지 정밀 타격 모의 훈련", "text": "실제 발사 없이도 훈련을 진행하십시오.',
    text: "",
  });
  assert.equal(repaired.title, "원격지 정밀 타격 모의 훈련");
  assert.equal(repaired.text, "실제 발사 없이도 훈련을 진행하십시오.");
  assert.equal(repaired.key, "text");
});

console.log("\nEvents and markers heal on read");

test("a fused event title becomes the head, its prose folds into the description", () => {
  const event = normalizeEventEntry({
    title: '반도체 생산 클러스터의 방어 요새화", "note": "핵심 팹을 결합하여 기술 유출을 차단',
    description: "경기와 인천의 주요 생산 라인에 차단 시설을 결합하였습니다.",
    date: "2019-06-11",
  }, 0);
  assert.equal(event.title, "반도체 생산 클러스터의 방어 요새화");
  assert.match(event.description, /핵심 팹을 결합하여 기술 유출을 차단/);
  assert.match(event.description, /경기와 인천의 주요 생산 라인/);
});

test("a fused marker name becomes the head; kind, coordinates and note are harvested", () => {
  const marker = normalizeMarkerEntry({
    name: '점검용 연구 단지", "kind": "research center", "lng": 127.31, "lat": 37.47, "note": "검증용 거점',
    ownerCode: "South Korea",
  }, 0);
  assert.ok(marker, "the marker survives despite having no top-level coordinates");
  assert.equal(marker.name, "점검용 연구 단지");
  assert.equal(marker.kind, "research center");
  assert.equal(marker.lng, 127.31);
  assert.equal(marker.lat, 37.47);
  assert.equal(marker.note, "검증용 거점");
});

test("the same repair logs once, not once per poll (round 44: 145 repeats)", () => {
  const infos = [];
  const original = console.info;
  console.info = (...args) => infos.push(args.join(" "));
  try {
    for (let i = 0; i < 4; i += 1) {
      normalizeMarkerEntry({
        name: '반복 로그 점검 기지", "kind": "military base", "lng": 126.9, "lat": 37.5, "note": "반복 점검',
        ownerCode: "South Korea",
      }, 0);
    }
    const mentions = infos.filter((line) => line.includes("반복 로그 점검 기지"));
    assert.equal(mentions.length, 1, "four normalizes, one sentence");
  } finally {
    console.info = original;
  }
});

test("harvested fields never override what the record itself carries", () => {
  const marker = normalizeMarkerEntry({
    name: '항만 통제소", "lng": 100.0, "lat": 10.0, "note": "회복된 메모',
    ownerCode: "South Korea",
    lng: 127.5,
    lat: 37.3,
    note: "원래 메모",
  }, 0);
  assert.equal(marker.lng, 127.5);
  assert.equal(marker.lat, 37.3);
  assert.equal(marker.note, "원래 메모");
});

console.log("\nThe board criteria carry the original's four lenses");

const GAMEPLAY = fs.readFileSync(new URL("../src/Game/AI/gameplay.js", import.meta.url), "utf8");

test("threat derivation, positions-and-causes, and social integration are named axes", () => {
  const at = GAMEPLAY.indexOf("[Topic Coverage]");
  const block = GAMEPLAY.slice(at, at + 3400);
  assert.match(block, /MOVES OF NEIGHBOURING AND RIVAL POWERS/);
  assert.match(block, /SPECIFIC threats this period's geography and rivals actually pose/);
  assert.match(block, /public positions on external events of the day, coalitions of shared cause/);
  assert.match(block, /social integration across the country's own regions and groups/);
});

test("the Modern Day lenses ride too: alliance upkeep, era-currency influence, structural pressures", () => {
  const at = GAMEPLAY.indexOf("[Topic Coverage]");
  const block = GAMEPLAY.slice(at, at + 3400);
  // The player's second capture (the original's Modern Day preset, SK 2016):
  // 한미동맹 관리·사드 갈등 → alliance maintenance and caught-between friction;
  // 한류/소프트파워 → influence in the era's own currency; 저출산·고령화 →
  // slow structural pressures under domestic affairs.
  assert.match(block, /MAINTENANCE of standing alliances as its own continuous work/);
  assert.match(block, /managing friction with a partner or between rival patrons/);
  assert.match(block, /cultural soft power and national brand in another/);
  assert.match(block, /slow STRUCTURAL pressures where they exist: demography, employment, cohesion/);
  // And era anchoring now states the character rule, both directions.
  assert.match(GAMEPLAY, /a 2016 developed democracy manages slow growth, youth unemployment, demographic decline and alliance friction/);
});

test("era anchoring reaches the BRAINSTORM, not only the jump", () => {
  // The jump has had [Period Grounding] for rounds; the suggestions task never
  // received any era directive — the original's first criterion, and the gap.
  const at = GAMEPLAY.indexOf('if (taskKey === "actions")');
  const block = GAMEPLAY.slice(at, GAMEPLAY.indexOf("[Orders Already Given]", at));
  assert.match(block, /\[Era Anchoring\]/);
  assert.match(block, /name the real programmes, plans, disputes, institutions and movements live at this time/);
  assert.match(block, /the campaign's state wins/);
});

test("nine era-conditional lenses widen the board past the two captured presets", () => {
  // The eight axes were designed against 1935 USSR and 2016 SK — both modern
  // great-power-adjacent states. The lens pool carries what neither capture
  // shows: treasuries, faiths, peripheries, plagues, the order itself.
  const at = GAMEPLAY.indexOf("[Era-Conditional Lenses]");
  assert.notEqual(at, -1);
  const block = GAMEPLAY.slice(at, GAMEPLAY.indexOf("[Era Anchoring]", at));
  for (const lens of [
    "MATERIAL BASE", "TREASURY", "LEGITIMACY", "FAITH AND IDENTITY",
    "QUIET INSTRUMENTS", "DEFINING TECHNOLOGY RACE", "PERIPHERY",
    "INTERNATIONAL ORDER", "NATURE'S OWN SHOCKS",
  ]) {
    assert.ok(block.includes(lens), `${lens} lens present`);
  }
  // Conditional by design: dead lenses stay silent, live ones may share topics.
  assert.match(block, /a lens with nothing live this period gets nothing/);
  assert.match(block, /Two lenses may share one topic when the work is genuinely one/);
  // And the board may grow only when the era earns it.
  assert.match(GAMEPLAY, /up to 12 when the era's live lenses below demand it/);
});

console.log("\nThe brainstorm board folds by big topic");

test("a topic is a disclosure row, collapsed by default", () => {
  assert.match(ACTIONS_UI, /const \[open, setOpen\] = React\.useState\(false\);/);
  assert.match(ACTIONS_UI, /transform: open \? "rotate\(90deg\)" : "none"/);
  assert.match(ACTIONS_UI, /\{open && \(/);
});

test("a folded topic still reports its size and how much was adopted", () => {
  assert.match(ACTIONS_UI, /queuedCount > 0 \? `✓\$\{queuedCount\} · \$\{topic\.actions\.length\}` : topic\.actions\.length/);
});

test("THE PAIR DEDUP REMEMBERS NOTHING — a canonical cell, not a Set", async () => {
  // The first version kept every candidate pair it had tested in a Set of
  // `si|sj` strings, never released. Its size is the number of distinct
  // candidate pairs in the whole window, and the 1836 Overpass dump — whole
  // ways instead of tile-clipped fragments — pushed it past V8's ~16.7M
  // ceiling and threw `RangeError: Set maximum size exceeded` mid-assembly.
  // 1939's tile dump already peaks near 5.4M in a single pass, so this was a
  // wall the project was walking towards regardless of transport.
  const src = fs.readFileSync(new URL("../scripts/ohm/lib/assembleFaces.mjs", import.meta.url), "utf8");
  const fn = src.slice(src.indexOf("export const nodeCrossings"), src.indexOf("let crossingsSplit = 0;"));
  assert.doesNotMatch(fn, /const tested = new Set\(\)/,
    "no per-pair memo may live across the bucket loop");
  assert.match(fn, /canonX|canonY/, "the pair must decide where it is allowed to test itself");
  assert.match(fn, /pairsTested/, "and the workload must be reported before it becomes a crash");
});

test("…and the canonical cell is one both segments actually occupy", () => {
  // (max(x0), max(y0)) of two overlapping cell ranges lies inside both, so the
  // pair is tested exactly once and never zero times. Checked directly rather
  // than trusted, because "tested zero times" would silently un-node a
  // crossing and put the face walk back on a non-planar graph.
  const cases = [[0, 0, 3, 3, 1, 1, 4, 4], [-2, -2, 0, 0, -1, -3, 1, 1], [5, 5, 5, 5, 5, 5, 9, 9]];
  for (const [ax0, ay0, ax1, ay1, bx0, by0, bx1, by1] of cases) {
    const cx = Math.max(ax0, bx0);
    const cy = Math.max(ay0, by0);
    assert.ok(cx >= ax0 && cx <= ax1 && cy >= ay0 && cy <= ay1, "inside A");
    assert.ok(cx >= bx0 && cx <= bx1 && cy >= by0 && cy <= by1, "inside B");
  }
});

test("A LOOSE END NEVER JOINS ITS OWN TAIL — the nibble that reported itself as a join", async () => {
  // At full resolution the nearest segment to a chain tip is the chain's own
  // next segment, one vertex-spacing behind (1836 Overpass: 0.0001–0.001°).
  // The old search excluded only the tip's incident edges, projected onto
  // that own segment at t≈0, merged the tip into its own neighbour and
  // deleted the tip edge: `joins` counted up, the chain got one vertex
  // SHORTER, nothing connected. Forensics 2026-08-12: after 181 reported
  // joins, border tips 0.043° from real network were still loose — and
  // 46,252 edges died in the prune wearing that disguise.
  const { buildGraph, snapLooseEndsToNetwork } = await import("../scripts/ohm/lib/assembleFaces.mjs");
  const chain = [[0, 0], [0.001, 0], [0.002, 0], [0.003, 0], [0.004, 0], [0.005, 0]];
  const segs = [];
  for (let i = 0; i + 1 < chain.length; i += 1) segs.push([chain[i], chain[i + 1]]);
  const nodes = buildGraph(segs);
  const before = nodes.size;
  const { joins } = snapLooseEndsToNetwork(nodes, 0.06);
  assert.equal(joins, 0, "no foreign geometry exists — a join here is the tip eating itself");
  assert.equal(nodes.size, before, "and the chain keeps every vertex it had");
});

test("…and the same tip DOES join foreign geometry farther than its own tail", async () => {
  // A vertical line 0.04° west of the tip: farther than the tip's own next
  // segment (0.001°) but inside the 0.06 tolerance. By raw distance the own
  // tail always wins — only the reachability guard makes the real target
  // the best admissible one. This is the Hendaye case: a coast tip 0.043°
  // from the network that five runs in a row left loose.
  const { buildGraph, snapLooseEndsToNetwork } = await import("../scripts/ohm/lib/assembleFaces.mjs");
  const chain = [[0, 0], [0.001, 0], [0.002, 0], [0.003, 0], [0.004, 0], [0.005, 0]];
  const segs = [];
  for (let i = 0; i + 1 < chain.length; i += 1) segs.push([chain[i], chain[i + 1]]);
  segs.push([[-0.04, -0.2], [-0.04, 0.2]]);
  const nodes = buildGraph(segs);
  const { joins, splits } = snapLooseEndsToNetwork(nodes, 0.06);
  assert.ok(joins >= 1, "the tip must reach the foreign line");
  assert.ok(splits >= 1, "by splitting it at the landing point — a junction, not a nibble");
  assert.ok([...nodes.keys()].some((k) => k.startsWith("-0.04,")),
    "a node now lives on the foreign line where the tip landed");
});

test("THE SKELETON PREVIEW sorts geometry into survivors, anchored chains, and scrap", async () => {
  // A square (cycle — survives), a chain hanging off its corner (doomed but
  // ANCHORED — a border that reached the coast at one end), and a floating
  // scrap (doomed, leads nowhere). The preview is the value oracle both snap
  // stages weld by: preference, never refusal — the two refusal guards
  // measured 2026-08-12 collapsed coverage to 10% by killing dense-web
  // T-junctions, so nothing is forbidden, skeleton targets just win.
  const { buildGraph, previewAnchors } = await import("../scripts/ohm/lib/assembleFaces.mjs");
  const segs = [
    [[0, 0], [1, 0]], [[1, 0], [1, 1]], [[1, 1], [0, 1]], [[0, 1], [0, 0]], // square
    [[1, 0], [2, 0]], [[2, 0], [3, 0]],                                     // anchored chain off the corner
    [[5, 5], [6, 5]], [[6, 5], [7, 5]],                                     // floating scrap
  ];
  const nodes = buildGraph(segs);
  const { doomed, leads } = previewAnchors(nodes);
  assert.ok(!doomed.has("0,0") && !doomed.has("1,1"), "the square survives");
  assert.ok(doomed.has("2,0") && doomed.has("3,0"), "the hanging chain dies in preview");
  assert.ok(leads.has("2,0") && leads.has("3,0"), "…but it is ANCHORED — welding to it can complete a separator");
  assert.ok(doomed.has("5,5") && doomed.has("6,5") && !leads.has("6,5"), "the scrap is doomed and leads nowhere");
});

test("…and a weld prefers the anchored partner over a nearer scrap", async () => {
  // The France–Belgium ending, miniaturised with the fix in place: the
  // border tip has a scrap tip 0.006 away and an anchored chain's tip 0.03
  // away, both within tolerance. Nearest-first took the scrap and built the
  // 121-step lollipop that carried the whole border as a face-splitting-
  // nothing bridge. With the preview, the anchored partner wins.
  const { buildGraph, previewAnchors, snapDangles } = await import("../scripts/ohm/lib/assembleFaces.mjs");
  const segs = [
    // east skeleton (a square) with a chain reaching west: anchored, tip at [2.03,0]
    [[4, 0], [4, 1]], [[4, 1], [5, 1]], [[5, 1], [5, 0]], [[5, 0], [4, 0]],
    [[4, 0], [3, 0]], [[3, 0], [2.03, 0]],
    // west skeleton (the coast, in the real case) with the border chain: anchored, tip at [2,0]
    [[-2, 0], [-2, 1]], [[-2, 1], [-1, 1]], [[-1, 1], [-1, 0]], [[-1, 0], [-2, 0]],
    [[-1, 0], [0, 0]], [[0, 0], [1, 0]], [[1, 0], [2, 0]],
    // the scrap: two segments floating just south of the meeting point
    [[2.004, -0.004], [2.1, -0.05]], [[2.1, -0.05], [2.2, -0.1]],
  ];
  const nodes = buildGraph(segs);
  const anchors = previewAnchors(nodes);
  const welds = snapDangles(nodes, 0.06, anchors);
  // the border tip [2,0] must weld to the anchored tip [2.03,0] — NOT the
  // scrap [2.004,-0.004], which is nearer by raw distance (0.026 < 0.030)
  assert.equal(welds.length, 1, "exactly one weld");
  const pair = [welds[0].from, welds[0].to].map((p) => p.join(","));
  assert.ok(pair.includes("2,0") && pair.includes("2.03,0"),
    "the pair is border↔anchored-chain despite the scrap being nearer");
  const scrapTip = nodes.get("2.004,-0.004");
  assert.ok(scrapTip && scrapTip.nbrs.size === 1, "the scrap tip was NOT consumed — still a loose end");
});

console.log(`\n${pass} passed\n`);

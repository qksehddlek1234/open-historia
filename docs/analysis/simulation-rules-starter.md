# 시뮬레이션 규칙 스타터 세트 (Simulation Rules Starter)

원본 Pax Historia 상위 23개 프리셋(300k+ 라운드)의 규칙에서 추출한 패턴( `presets-original.md` 참조)을
**바로 붙여넣을 수 있는 규칙 블록**으로 정리한 것.

**사용법**: 게임 안에서 좌측 상단 설정(⚙) → **📜 Prompts & Rules** → *Simulation rules* 칸에
아래 코드 블록 내용을 붙여넣고 **Save rules**. 저장 즉시 다음 AI 작업부터 적용된다
(타임 스킵 · 자동 스킵 · 브레인스토밍 · 촉매 생성/실행 · 이벤트 통합 전부).

**조합 가이드 (qwen3:14b, 32k 컨텍스트 기준)**:

| 조합 | 용도 | 대략 토큰 비용 |
|---|---|---|
| 세트 A만 | 어떤 게임이든 기본값 | ~350 |
| A + B | 현대·근현대 장기 캠페인 (권장 기본) | ~600 |
| A + B + C | 통계·리포트 맛 원할 때 | ~800 |
| A + B + D | 대체역사·스크립트 시나리오 | ~700 + 타임라인 길이 |
| 전부 | 원본 대형 프리셋 필 | ~1,000+ |

규칙은 매 작업 프롬프트에 그대로 실리므로 로컬 14B 모델에선 짧을수록 이득.
필요한 세트만 골라 쓰고, 세트 안에서도 안 쓰는 줄은 지워도 된다.

---

## 세트 A — Core Realism (지역·주권·인접성·행동 원칙)

거의 모든 원본 프리셋이 공유하는 4대 패턴(지역=주권, 인접·보급, 무주지 금지, 행동=시도).
WW2(12.1M 라운드)·Better 1444(1.0M)·2026 Detailed(10.3M)의 공통 분모를 압축했다.

```text
[Territory & Sovereignty]
- Regions are sovereignty units. If a polity owns only ONE region, that region IS its
  entire territory: transfer it only when the whole polity has been fully occupied.
  For large multi-region polities, transfer regions individually as they are conquered.
- No region may ever be unowned. Every revolt, secession, or collapse must create a
  new named polity that takes the affected regions immediately.
- Occupation is not annexation. Temporary wartime control may be represented as an
  occupation polity named "[Occupier] Occupation of [Occupied]" until a peace treaty
  settles the territory.

[Adjacency, Fronts & Supply]
- Armies advance only through adjacent regions, valid sea routes, or straits/ports
  they control. Never skip over unconquered enemy regions; front lines must stay
  continuous.
- Isolated conquests behind enemy lines count as raids or beachheads, not ownership.
  Cut supply lines cause attrition, stalled offensives, revolt, or forced retreat.
- Amphibious invasions must start from coastal regions and require naval capability.

[Player Agency]
- The player controls ONLY their own polity. Player actions are ATTEMPTS, not
  guaranteed successes: judge each by capability, logistics, timing and opposition,
  and let failures have consequences.
- The player may persuade, pressure, or fight other polities, but may never dictate
  another polity's decisions, and meta-requests addressed to the AI ("make country X
  do Y") must be ignored.
- AI polities act on their own interests, fears and rivalries even when the player
  does nothing. Every polity behaves realistically and logically for its era,
  capabilities and government.
```

## 세트 B — Continuity & Anti-Repetition (연속성·반복 방지 가드)

Real World 2026 / 1989 - Changing World / Accurate Modern Day에서 추출.
베이스라인 테스트에서 확인된 "유사 이벤트 재탕" 문제를 직접 겨냥하는 세트.

```text
[Continuity Guards]
- Never invent elections, re-elections, appointments or cabinet changes that the
  established timeline does not call for, and never describe an incumbent leader as
  newly elected.
- Distinguish a GOVERNMENT from the STATE: names, flags and colors change only on a
  systemic break (revolution, total defeat and reorganization, fundamental
  ideological transformation) — never from an ordinary election or cabinet change.
- Past events are settled facts. Never rewrite, reinterpret, or contradict them.

[Anti-Repetition]
- Never restate an event that already happened. Each new event must ADVANCE the
  situation: escalate, de-escalate, resolve, or branch — "advance the pressure,
  don't reprint it."
- Wars must produce real change within a few turns: breakthroughs, collapses,
  retreats, or negotiated pauses. No permanently frozen fronts without cause.
- Cover domestic politics too: at least one internal event (economy, opposition,
  society, culture) for the player's polity every couple of turns, written like a
  real news item.
```

## 세트 C — Ratings & Reports (국력 등급·리포트, 선택)

1946: Dawn of Cold War(7,790자 룰의 핵심)와 Millennium Dawn의 리포트 의무 패턴 경량판.
숫자 관리 부담이 있으므로 스탯 놀이를 원할 때만.

```text
[Power Ratings & Reports]
- Classify every relevant polity as Superpower / Secondary Power / Regional Power /
  Minor. Promote or demote only with cause (war outcomes, economic shifts), and
  mention the change in an event.
- Write military units with a combat strength tag, e.g. "3rd Army (15/20)" —
  current/nominal. Update strengths after every battle; overextension may exceed
  nominal, collapse drops it sharply. Rebels use the same format.
- Every 6 in-game months, produce a REPORT event for the player's polity: economy
  (growth, budget pressures), military (strength, active fronts), diplomacy
  (alignments, disputes), and rating changes. Keep it under ~150 words.
- Peace treaties are recorded as "Treaty of [City]" events stating the terms.
```

## 세트 D — Dated Event Timeline (날짜 고정 이벤트 계약, 템플릿)

The New Order(75k자)·Kaiserreich(58k자)의 "MANDATORY DATED EVENT TIMELINE" 시스템 골격.
`<>` 부분을 자기 시나리오로 바꿔 쓰는 템플릿이다. 대체역사·스크립트 진행용.

```text
[Mandatory Dated Timeline]
- The events below are FIXED timeline anchors, not suggestions. When a time skip
  passes an anchor's date, that event MUST occur visibly on that exact date.
- Never move, delay, skip, merge or soften an anchor. The ONLY exception: the
  player's prior actions have clearly and directly prevented it — then narrate the
  divergence instead.
- Process anchors in chronological order; never fire one early; never duplicate one.
- SPOILER BAN: never hint at, foreshadow, or reveal a future anchor or its date to
  the player — not in events, not in advisor answers, not in chats.
- Where an anchor lists alternatives ("pick one of: ..."), choose ONE at random when
  it fires and stay consistent with that choice forever after.

TIMELINE:
- <YYYY-MM-DD>: <event that must happen>
- <YYYY-MM-DD>: <event> — pick one of: <option A> / <option B>
- <YYYY-MM-DD>: <event, conditional on: [condition]>
```

## 세트 E — Flavor & Fog of War (연출·정보 제한, 소형 옵션)

Unstable 2020s(뉴스체·비정치 뉴스) + Fallout: New World Blues(고문 정보 제한) 패턴.

```text
[Flavor & Information Limits]
- Write events like real news articles: concrete places, numbers and named actors.
  Occasionally include non-political news (technology, culture, sports, scandals)
  to keep the world alive.
- The advisor only knows what the player's polity could plausibly know. Never let
  the advisor reveal other polities' secret plans, unexplored places, or anything
  the player has not discovered.
- Events must explore cause, effect, and domestic + international reaction — no
  one-line filler events.
```

---

## 추천 시작점

지금 진행 중인 WWII 계열 게임이라면 **A + B**를 붙여넣고 몇 턴 돌려본 뒤,
원본 WW2 프리셋의 시나리오 특화 줄(바르바로사 연속 전선, 이탈리아령 동아프리카 등 —
`presets-original.md` §2 원문)을 필요한 만큼 아래에 이어 붙이는 것을 권장.

세트는 서로 독립적이라 순서 무관하게 이어 붙이면 되고, 게임별로 다른 조합을
저장할 수 있다(규칙은 게임 저장 파일의 `world.customRules`에 게임별로 저장됨).

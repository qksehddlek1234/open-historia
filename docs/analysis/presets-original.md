# Pax Historia 원본 프리셋 수집 — 300k+ 라운드 전수 (23종)

수집일: 2026-07-28 (재조사 2026-08-09, 위 절 참조) · 방법: paxhistoria.co/presets 상세 페이지 추출
계획서 Phase 1-ⓐ/프리셋 이식 파이프라인의 원료. 각 항목: 시작일 · 라운드 수 · 소개(about) · 시작 이전 세계(before) · **시뮬레이션 규칙(rules)**.

> 규칙이 매우 긴 프리셋(1만자 이상)은 앞부분 위주로 수집했고 전체 길이를 명기했다. 전문이 필요해지면 해당 URL을 재방문하거나 Pax-Automata 브라우저 덤프로 회수한다.

## 재조사 2026-08-09 — 기준치 통과 25종, 우리 공백 12종

7/28 수집(23종) 이후 날짜가 지나 기준치를 넘긴 프리셋이 있을 것이라는 플레이어
지적으로 `paxhistoria.co/presets/browse`를 라운드순으로 다시 훑었다(1,000종 스캔,
30만 라운드 이상 25종). 원자료: 세션 스크래치패드 `preset-survey-2026-08-09.tsv`.

**새로 기준치를 넘은 것 2종**: `World war II total overhaul`(303K),
`Zombie Virus Apocalypse`(300K).
**크게 오른 것**: 2026 Detailed 10.3M→11M, TNO 828K→857K, 2026 Citizen 672K→772K,
Fallout 519K→558K, Star Wars 515K→528K, WWII++ 375K→408K.

### 우리 시나리오와의 대조

| 원본 (라운드) | 우리 대응 |
|---|---|
| Modern Day 18M | `default` — **플레이어 지시로 제외** |
| World War II 13M · WWII++ 408K · WWII more provinces 589K · WWII total overhaul 303K | `wwii-1935` · `wwii-1939` |
| Victorian Era 1836 4.3M | `victorian-1836` |
| World War I 3.9M | `ww1-1914` |
| Magna Europa 1444 2.3M · Better 1444 1.1M | `magna-1444` |
| 1946: Dawn of Cold War 1.9M | `coldwar-1946` |
| Millennium Dawn 1.5M | `millennium-2000` |
| Napoleonic Wars 685K | `napoleonic-1804` |
| Accurate Modern Day 364K | `default` 계열 |
| **2026 Detailed and More Provinces 11M** | **없음** |
| **The New Order: Last Days of Europe 857K** | **없음** |
| **2026 but you're a Citizen 772K** | **없음** |
| **1950: MASSIVE UPDATE 636K** | **없음** |
| **Real World 2026 594K** | **없음** |
| **Fallout: New World Blues 558K** | **없음** |
| **Kaiserreich 551K** | **없음** |
| **1989 - Changing World 550K** | **없음** |
| **Star Wars: Clone Wars 528K** | **없음** |
| **The Fire Rises 507K** | **없음** |
| **Unstable 2020s 343K** | **없음** |
| **Zombie Virus Apocalypse 300K** | **없음** |

우리에게만 있는 것(원본 기준치 밖): `bronze-1200bc` · `roman-117` ·
`medieval-1200` · `mongol-1300` · `colonial-1650`.

### 전반 재검수 — 우리 규칙 대 원본 규칙 (2026-08-09)

스펙별 시뮬레이션 규칙 길이를 원본 수집분과 맞대어 어디가 얇은지 봤다.
(우리 수치는 스펙 자체의 규칙이고, 빌드 시점에 공통 계약 약 6,500자가 더 붙는다.)

| 우리 프리셋 | 우리 | 원본 | 판정 |
|---|---:|---:|---|
| `victorian-1836` | 2,641 | **13,771** | 5.2배 — 가장 큰 공백 |
| `millennium-2000` | 2,679 | **8,060** | 3.0배 |
| `coldwar-1946` | 2,203 | **7,790** | 3.5배 ("시스템 프리셋의 교과서") |
| `wwii-1935` | 6,466 | 32,400 (WWII++) | 5.0배 — 2차 대조로 상당 부분 좁혔다 |
| `ww1-1914` | 1,837 | 1,982 | 대등 |
| `magna-1444` | 2,985 | 421 (Magna) / 170,256 (Better 1444) | 비교 대상에 따라 다름 |
| `napoleonic-1804` | 2,705 | 184 | 우리가 두껍다 |
| `korea-1950` | 3,015 | 212 | 우리가 두껍다 |
| `coldwar-1989` | 3,870 | 67,686 | 그쪽은 대부분 룰셋 개정 이력 |

**분량 차이의 정체를 확인해 보니 군더더기가 아니라 우리가 아무에게도 지우지
않은 의무 세 가지였다.** 전부 시대와 무관하게 성립해 공통 계약으로 넣었다
(`lib/reportingContract.mjs`, 전 프리셋 자동 부착):

1. **전투는 숫자로 보고한다** (Millennium Dawn) — 양측 투입 병력과 손실을 그
   시대가 알 수 있는 정밀도로. 없으면 전쟁이 스무 턴짜리 형용사가 되고,
   플레이어가 이긴 전투와 진 전투를 지도로만 구별하게 된다. 턴 사이 산수의
   일관성을 강제하는 것이 진짜 목적이다.
2. **전쟁은 이름 있는 조약으로 끝난다** (1946) — `Treaty of <지명>`. 장식이
   아니다: 이름이 있어야 나중 턴이 그것을 원용·수정·회피·원망할 수 있고,
   이름 없는 합의는 다음 통합에서 잊혀 원한이 애초에 생기지 않는다.
3. **턴은 대체로, 그러나 전부는 아니게 플레이어의 것이다** (Millennium Dawn) —
   2/3는 플레이어 권역, 1/3은 나머지 세계. 실패 양쪽을 다 겪었다: 플레이어
   명령만 서술해 세계가 사라진 턴과, 세계 일주를 하는 동안 플레이어의 전쟁이
   언급되지 않은 턴.

**의도적으로 안 가져온 것**(프롬프트가 아니라 엔진 기능이라 산문으로 흉내내면
두 채점 체계가 서로 어긋난다): 1946의 국가 5등급제와 수치 임계값, Budget 스탯,
부대명 전투력 표기 `[국가] Armed Forces (27/30)`. 백로그로 남긴다.

**아직 안 본 것**: Victorian 1836의 조건부 국가 형성 체계(독일 통일 태그
25개+ → 통일)와 연대기 스크립트, Millennium Dawn의 선거 시뮬레이션·부패도.
이 셋은 시대별 스펙 작업이라 해당 프리셋을 손볼 때 함께 본다.

### 작성 순서 — 우리 연표의 구멍부터

우리 시대 배열은 1200BC · 117 · 1200 · 1300 · 1444 · 1650 · 1804 · 1836 ·
1914 · 1935 · 1939 · 1946 · 2000이다. **1946에서 2000까지 54년이 비어 있고**,
2000 이후도 비어 있다. 원본의 고라운드 공백이 정확히 거기에 걸린다.

1. **1950** (636K) — 한국전쟁 개전. `coldwar-1946`과 4년 차라 지오메트리·
   정치체를 상당 부분 물려받는다. 우리 연표에서 가장 값싼 추가.
2. **1989** (550K) — 냉전의 끝. 1946 → 2000의 한가운데.
3. **2026** (11M + Real World 2026 594K + Unstable 2020s 343K) — 현재. 원본
   최다 플레이 축이고, 세 프리셋이 같은 시대를 서로 다른 결로 다룬다.
4. **Kaiserreich** (551K) · **TNO** (857K) — 대체역사. 우리 스펙 구조는 그대로
   쓸 수 있지만 "역사 선행" 계약을 끄고 각자의 분기 규칙을 써야 한다.
5. **The Fire Rises** (507K) — 2020년 붕괴물. 위와 같은 결.
6. **Fallout** (558K) · **Star Wars** (528K) · **Zombie** (300K) — 픽션.
   지오메트리부터 우리 GADM 시드와 무관해 별도 설계가 필요하다.
7. **2026 but you're a Citizen** (772K) — 국가가 아니라 개인으로 플레이.
   시나리오가 아니라 **모드**에 가깝다(수집 패턴 9번 참조).

부족한 프리셋·프롬프트·레퍼런스는 플레이어 허가로 사본을 만들어 훑는다
(WWII++에서 이미 검증된 절차 — `wwii-plus-plus-audit.md`).

---

## 수집 요약

| # | 프리셋 | 라운드 | 시작 | 규칙 길이(수집) |
|---|---|---|---|---|
| 1 | Modern Day | 17.0M | 2016-01-01 | 54 (전문) |
| 2 | World War II | 12.1M | 1935-12-01 | 1,793 (전문) |
| 3 | 2026 Detailed and More Provinces | 10.3M | 2026-01-01 | 20,594 (전문) |
| 4 | Victorian Era: 1836 | 4.0M | 1836-01-01 | 13,771 (~9K) |
| 5 | World War I | 3.7M | 1911-01-01 | 1,982 (전문) |
| 6 | Magna Europa: 1444 | 2.2M | 1444-11-11 | 421 (전문) |
| 7 | 1946: Dawn of Cold War | 1.8M | 1946-06-01 | 7,790 (전문) |
| 8 | Millennium Dawn | 1.4M | 2000-01-01 | 8,060 (전문) |
| 9 | Better 1444 (The Original) | 1.0M | 1444-11-11 | **170,256** (~14K 헤드) |
| 10 | The New Order: Last Days of Europe | 828K | 1962-01-01 | **75,165** (~9K 헤드) |
| 11 | 2026 but you're a Citizen | 672K | 2026-01-01 | 26,299 (~4.5K 헤드) |
| 12 | Napoleonic Wars | 652K | 1804-12-01 | 184 (전문) |
| 13 | 1950: MASSIVE UPDATE! | 619K | 1950-01-01 | 212 (전문) |
| 14 | Real World 2026 | 584K | 2026-02-01 | 21,918 (~4.5K 헤드) |
| 15 | WWII but with more provinces | 560K | 1935-12-01 | 37,689 (~4.5K 헤드) |
| 16 | Kaiserreich | 523K | 1936-01-01 | 57,834 (~4.5K 헤드) |
| 17 | Fallout: New World Blues | 519K | 2275-01-01 | 11,653 (부분·필터 차단) |
| 18 | 1989 - Changing World | 518K | 1989-01-01 | **67,686** (~4.5K 헤드) |
| 19 | Star Wars: Clone Wars Edition | 515K | (BBY 표기) | **127,938** (~4.5K 헤드) |
| 20 | The Fire Rises | 484K | 2020-01-01 | 4,205 (전문) |
| 21 | World War II++ | 375K | 1935-12-01 | 22,077 (부분·필터 차단) |
| 22 | Accurate Modern Day | 356K | 2016-01-01 | **287,958** (~4.5K 헤드) |
| 23 | Unstable 2020s | 335K | 2020-01-01 | 39,208 (~4.5K 헤드) |

## 패턴 분석 — Open-Historia 이식 백로그

수집된 규칙들에서 반복적으로 나타나는 설계 패턴. Phase 3(게임 필 이식)의 작업 목록이 된다.

1. **지역=주권 원칙** (거의 전 프리셋 공통): 단일 지역 폴리티는 그 지역이 곧 영토 전체이므로 완전 점령시에만 이전. 부분 점령·조공·군사통행권은 주권 이전이 아님. → Open-Historia jump 프롬프트의 [Region and City Capture]와 동일 계열이지만 원본 프리셋들이 더 구체적.
2. **인접성·보급·전선 연속성** (Better 1444이 가장 정교): 인접/항구/해협 경유만 진격 가능, 고립 점령지는 습격·교두보로 취급, 보급선 끊기면 소모·반란·철수. 수에즈/파나마 부재 같은 시대 제약 명시.
3. **무주지 금지**: 모든 지역은 소유자 필수, 반란·분리는 반드시 신규 폴리티 생성 (Bir Tawil 예외 유머까지).
4. **플레이어 대리행동 금지 + 시도≠성공**: 플레이어 행동은 "시도"로 취급, 타국 강제 불가.
5. **날짜 고정 이벤트 타임라인** (TNO): "이 날짜에 이 이벤트 필수 발생, 플레이어 행동으로만 변경 가능" 계약 + 사전 누설 금지(Kaiserreich: 날짜 언급 금지).
6. **조건부 분기 규칙** (Victorian/Kaiserreich): "X 태그 지역을 모두 가지면 Y 국가 형성", 내전 승자별 분기 국가명·후속 전쟁 목표.
7. **국력 등급·전투력·예산 시스템** (1946): 5단계 국가 등급 + 승격/강등 임계값, 부대명에 전투력 표기 "(15/20)", 예산 포인트제.
8. **정기 리포트** (Millennium/Unstable/1946): 반기 경제·군사 리포트 의무화(GDP, 병력, 전선 상태), 연간 지정학 요약.
9. **시민(개인) 모드** (Citizen/Star Wars): 국가가 아닌 개인 캐릭터로 플레이 — 캐릭터 시트 생성, 확률 기반 가문/재산, 맵 피처 1.0 원형 아이콘=플레이어, 커맨드 체계(PLAYERNAME_ON 등).
10. **연속성·반복 방지 가드** (Real World 2026/1989): 재선 환각 금지, 국기·국색은 체제 단절시에만 변경, 이벤트 재탕 금지("압력을 전진시켜라, 재인쇄하지 마라"), 이벤트 통합(consolidation) 시 패턴 보존.
11. **게임 모드 토글** (WWII++/WW2prov): "Non-Historical Mode", "MINIGAMES_OFF" 같은 액션창 커맨드로 게임 규칙 전환.
12. **점령 폴리티 패턴** (WWII++): 합병 아닌 점령은 "[점령국] Occupation of [피점령국]" 임시 폴리티 생성.
13. **뉴스체 이벤트 + 비정치 뉴스 혼합** (Unstable): 이벤트는 실제 기사처럼, 기술·문화·스캔들 등 비정치 뉴스 주기적 삽입.
14. **어드바이저 제약** (Fallout): "고문은 플레이어 국가가 아는 것만 안다" — 미발견 정보 언급 금지.

---

## 프리셋별 수집 원문

### 1. Modern Day — 17.0M 라운드
- URL: /presets/modern_day?versionID=61 · 시작: 2016-01-01 · 역사적·현대 · 1,799,281 플레이
- about: The World Today...
- before: Everything before the start date happened historically
- rules (전문 54자): Every polity should behave realistically and logically

### 2. World War II — 12.1M 라운드
- URL: /presets/WW2_Europe?versionID=125 · 시작: 1935-12-01 · 역사적·2차 세계대전
- about: We Shall Never Surrender...
- before: Everything happened historically before the start date, with the exception of the player's polity, which COULD be a polity that doesn't historically exist at this time because the player has free reign to create a non-historical polity (only one) to play as, and that's it.
- rules (전문 1,793자):
IF Operation Barbarossa Occurs, make sure Germany moves in a continuous front line, and ensure not to miss regions in Ukraine and the Baltics, if Germany Makes it to those regions, remember to transfer them.
In this game, Russian and Chinese regions have the same names and borders as most modern day Oblasts, Provinces, and Administrative Divisions of Russia and China, and Ukrainian Regions are unified in Central and South Ukraine, with more specific regions in Northern Ukraine, pay special attention to the Baltics and Ukraine DURING and IF an Invasion of Russia Happens.
Remember how regions works, in our game, many regions are small but some are the size of the entire polity. If polities only own one region, that means the region itself is every major territory the polity owns, and as such should be transferred only when the entire region has been occupied by whichever polity is invading. For example, Ethiopia has only one region: All of Ethiopia, so should it be invaded, the region should only be transferred to the invader if all of Ethiopia has been occupied. But for Nations like Russia and China, you must be very careful but not infrequent when doing the region transfers.
The player has control over their own polity, and should be allowed to try whatever they want, but they cannot make actions FOR other polities. They can attempt to convince or reshape other polities by way of politics, diplomacy, or war, but they cannot force other polities to go down specific paths. So the player IS their own polity essentially.
If Fascist Italy occupies Ethiopia, as historical, then Italy will establish the polity of "Italian East Africa" within the regions of "Eritrea" "Ethiopia" and "Somalia" UNLESS the player specifically takes actions to prevent that from happening.

### 3. 2026 Detailed and More Provinces — 10.3M 라운드 ("The most played preset")
- URL: /presets/BYp5Mv7IaFXAjoO8jGLK?versionID=89 · 시작: 2026-01-01 · 역사적·현대 · 1,016,790 플레이
- before: 2026 has just begun, the cold war is long over, yet world tensions have become as high as ever, after the economic devastation of the COVID-19 virus and many humanitarian crises... is a global conflict avoidable?
- rules (전문 20,594자 수집): 핵심 구성 —
  * 총칙: "Follow all historical events past the start date" / AI는 세계의 유일한 엔진, 플레이어는 여러 행위자 중 하나 / 플레이어 국가 대리행동 금지 / 응답은 플레이어 입력 언어로
  * 지정학 상수: 이념 전환→내전 분열, 국명·국색은 체제 변화시에만, 괴뢰국은 종주국 색상, 비인접 지역 소유 금지, 해상 침공은 해안부터, 무주지 금지(Bir Tawil 예외), 내전국은 상시 교전
  * 방대한 시나리오 스크립트(발췌): 이스라엘-하마스 상태 수치, 러-우 전쟁 종결 조건(2029년 전, 드니프로 동남 합병), 미얀마 내전 세력 목록과 개입 조건, 2026-01-07 이란 경제 붕괴→미·이스라엘 폭격 스크립트, 중국의 2027년 대만 침공 필수+남북한 전쟁 연쇄+제한 핵사용 규칙, 미국 내전 시나리오(분리 주 목록), NATO 회원국 열거와 예외(터키·헝가리), 독립운동 목록(스코틀랜드·퀘벡·아체 등 수십 개), Gen Z 시위 의무 발생
  * (전문은 본 파일 수집 시점 기준 완전 수집됨 — 필요시 이 항목이 이식 1순위 후보)

### 4. Victorian Era: 1836 (RUSSIA UPDATE) — 4.0M 라운드
- URL: /presets/jjDMOBJWEs5TjSfas3N1?versionID=16 · 시작: 1836-01-01 · 역사적·제국의 시대
- about: v1.4 + Matthew Arnold 'Dover Beach' 인용
- rules (13,771자 중 ~9K 수집): (SPEAK FORMALLY) / 옵저버 모드 불간섭 / 모든 반란·분리는 독립 폴리티로, 진압시 합병 / 독일 통일 조건 체계(North/South German 태그 상태 25개+ → 통일, Super Germany 태그까지 → Großgermanisches) / The Great Game(영russo 중앙아 경쟁 스크립트) / 니콜라이 1세 치하 근대화 억제 / 연대기 스크립트: 텍사스 혁명, 카를로스 전쟁, 중미연방 해체, 연방 전쟁(칠레·아르헨 제약 명시), 미국 서부 개척(1836-1860 점진), 브라질 반란들, 프랑스 왕위 분쟁(4분기), 빅토리아 대관→하노버 분리, 아편전쟁, 명백한 운명, 슐레스비히, 크림 전쟁(철도 건설 변수, 승패 분기), 중앙아 정복(1864-85), 알렉산드르 2세 승계, 농노 해방, 1월 봉기...

### 5. World War I — 3.7M 라운드
- URL: /presets/europe_1913_simple?versionID=75 · 시작: 1911-01-01 · 역사적·1차 세계대전
- before: Everything happened historically leading up to January 1st, 1911.
- rules (전문 1,982자): 역사 이벤트 앵커 목록 + 시뮬레이션 지침 — 스톨리핀 암살(1911-09), 이탈리아-터키 전쟁, 아가디르 위기(모로코 지역 이전 명세), 신해혁명(신규 폴리티 "Republic of China" 생성하되 청 유지, 몽골·탄누우량하이 연쇄 독립, 승패는 게임 상황 따라), 발칸 전쟁 1·2차. "위 날짜는 역사적 날짜일 뿐 — 정확히 복사하지 말고 이 게임의 상황에 맞게 시뮬레이션하라."

### 6. Magna Europa: 1444 — 2.2M 라운드
- URL: /presets/QLBIBBVoyf6XEtd80InH?versionID=1 · 시작: 1444-11-11 · 역사적·후기 중세
- rules (전문 421자): 아메리카 식민화는 1700년대까지 점진 / 이베리아 국가 식민 이점 / 아프리카는 거의 식민 불가(가능 지역 열거) / 식민화는 기술 수준 필요

### 7. 1946: Dawn of Cold War — 1.8M 라운드
- URL: /presets/1Alm1zD4pXpGyfWwkch1?versionID=83 · 시작: 1946-06-01 · 역사적·냉전
- before: US와 USSR이 상호 블록 견제에 최선을 다해야 함 (얄타 이후 세계)
- rules (전문 7,790자) — **시스템 프리셋의 교과서**:
  * CORE: 대체역사 허용(POD 기반 자연 전개), 무주지 금지, "mental gymnastics로 필러 이벤트 창작", 뭐든 가능하되 규칙 우선
  * 국가 5등급제: Superpower(미·소 전용)/Secondary/Regional/General/Non-recognized — 국제영향력·군사력·경제가치 각 100점, 임계값 기반 승격·강등(수치 명시: 초강대국 전 지표 85+, 2급 두 지표 60+ 등), 2년 연속 미달시 강등
  * 군사: 부대명에 전투력 표기 의무 "[국가] Armed Forces (27/30)" (과확장 14/10, 붕괴 3/25 표현), 초강대국·2급만 복수 군 보유, 전투 후 전투력 갱신 의무, 반군도 동일 포맷
  * 리포트: 반기 종합 리포트(전쟁·외교·경제·등급 변동 4개 원장) + 연간 전국가 스탯 리포트, 스탯 증감 규칙 수치화(경제성장 +1~5, 군사패배 -3~-8 등)
  * 경제: Budget 스탯(최대 100, 턴마다 재생), 프로젝트는 예산 소모+소요 시간 명시, 예산 부족시 실패 심각도는 적자 폭 비례
  * 외교: 전쟁 종결 조약은 "Treaty of [도시명]"으로 기록

### 8. Millennium Dawn — 1.4M 라운드
- URL: /presets/V2ZpBgNDUR6LA06POlVl?versionID=38 · 시작: 2000-01-01 · 역사적·현대 (HOI4 모드 이식)
- rules (전문 8,060자):
  * 이벤트 배분율 명시: 플레이어 국가 60-70%, 국제 30-40% / 비역사 이벤트 의무 삽입(역사/비역사 라벨 금지 — 몰입 유지) / 이벤트는 신문체
  * 전투 이벤트에 양측 병력·사상자 수 필수 / 비공개 행동은 언론이 모름 / 선거 시뮬레이션(미 대선 2000·04·08 명시)
  * 시작 시점 진행 중인 전쟁 목록(체첸, 아프간, 콩고 2차 등 9개)과 종결 의무, 승자별 국명 변경 규칙(북부동맹 승리→"Islamic Republic of Afghanistan" 등)
  * 날짜 지정 스크립트: 이스라엘 남레바논 철수(2000-05-25), 시리아 레바논 철수(2005-04-26), 9/11 전 알카에다 언급 금지(몰입), 연도별 주요 이벤트 목록(2000-2008+)
  * 반기 경제·군사 리포트 의무(GDP·증감률·병력·장비·전선) / 안정도·자원·부패도 시스템(부패는 정부 효율·군사 효과 저하, 증감 조건 명시) / 군수 보급 로직 고려

### 9. Better 1444 (The Original) — 1.0M 라운드 ⚠️ 규칙 170,256자 (헤드 ~14K 수집)
- URL: /presets/undXAyQbz7OwIXfIZLXL?versionID=136 · 시작: 1444-11-11 · 2,700+ 지역
- rules 수집분 구성 — "1444 세계 논리·AI 강제 규칙(MANDATORY)":
  * PREAMBLE: 국가는 근대적 속도·확신·행정력으로 행동하지 않음, 역사 분기는 개연적 인과사슬로만, "시뮬레이션은 가혹하고 그럴듯해야"
  * 플레이어/AI 주체성: AI 폴리티는 플레이어 무활동시에도 자국 이해·공포·경쟁·왕조 목표 추구
  * 지역·영토: 주권 이전 조건 엄격(정복·왕조 상속·승인된 분할·붕괴·개연적 강화조약만), 조공·통행권·요새 거점은 주권 아님
  * 3A 전선 연속성·인접성·해상 접근(MANDATORY): 유효 연결 4유형, 적지 건너뛰기 금지, 고립 점령=습격/교두보 취급, 보급 차단시 소모·고립·후퇴·반란·항복, 지형 필수 반영, 고립영토 예외 조건(섬·조약항·십자군 교두보 등), 강화조약 영토는 인접 원칙, 수에즈·파나마 부재 명시
  * 지식·발견·정보 한계: 1444년 기준 알려진 세계만 인지(옴니시언스 금지), 정보는 상인·순례자·선교사를 통해 전파, 첫 접촉은 혼란·오해부터, 격리 인구 질병 교환(가혹하되 마법적이지 않게)
  * → **전문 회수 필요시 1순위** (중세·근세 시나리오의 시뮬레이션 헌법으로 그대로 이식 가치)

### 10. The New Order: Last Days of Europe — 828K 라운드 ⚠️ 규칙 75,165자 (헤드 ~9K)
- URL: /presets/wlEIapNMHRP8exc084oJ?versionID=55 · 시작: 1962-01-01 · 대체역사·냉전 (독일 승전 세계, HOI4 TNO 이식)
- before: 대독일국 유럽 패권 + 일본 공영권 + 핵피폭 미국의 3극 냉전 세계관 서사
- rules 수집분 — "MANDATORY DATED EVENT TIMELINE" 시스템:
  * "아래 이벤트는 고정 타임라인 앵커 — 제안이 아님. 점프가 날짜를 지나면 정확히 그 날짜에 가시적 이벤트로 발생 의무"
  * 이동·지연·생략·병합·완화 금지(플레이어 행동이 명확히 막은 경우만 예외), 시간순 처리, 조기 발동 금지, 중복 금지
  * 랜덤 분기 지정 방식: "다음 중 하나를 무작위 선택하라" (히틀러 후계자 4인: Speer/Bormann/Göring/Heydrich 각 이념 명시)
  * 날짜별 스크립트 예: 알류샨 위기 종결(1-10), 독일 달 착륙(1-19), 히틀러 암살 미수(1-25), 후계자 지명(2-1), 쿠바 카스트로 민주 당선(3-7), 터키 봄 시위 진압/협상 50:50 분기(4-5)...

### 11. 2026 but you're a Citizen — 672K 라운드 (규칙 26,299자, 헤드 ~4.5K)
- URL: /presets/RsA2Q3pyO2DPdo0vk97l?versionID=43 · 시작: 2026-01-01
- rules 수집분 — **시민 모드 시스템**: 플레이어는 통치자가 아닌 일반 시민으로 스폰 / 맵 피처(크기 1.0, 원형)=플레이어, 이동시 피처 이동, 단일 피처 강제 / 커맨드 체계(PLAYERNAME_ON, NAMECHANGE:, NAME_RANDOM, PLAYERGENDER_*, 저작권 방지 커맨드 "CREATOR") / 시작: 부모 사망+유산, 가문 확률표(중산층 50%/가난한 대가족 24%/부유한 소가족 24%/정치 명문 1%/문화 명문 1%), 애완동물 20%, 성별 50:50, 소수자 확률 5-50% / 화폐는 국가별 실화폐, 모든 지출 이벤트에 잔액 표기 / 돈벌이: 노동, 강도(위험)...

### 12. Napoleonic Wars: CASUALTY UPDATE — 652K 라운드
- URL: /presets/ITs6lK9SnmDTaOHfOouK?versionID=1 · 시작: 1804-12-01
- before: 시대 개관 서술형(혁명·나폴레옹 대두·산업혁명·아이티 혁명·해상 봉쇄) — before 섹션을 세계관 교과서로 쓰는 사례
- rules (전문 184자): 영국의 대프랑스 동맹 자금 지원 지속 / 1812년 미영전쟁 / "전투 사상자 보고서와 참전 병력 수를 보고하라"

### 13. 1950: MASSIVE UPDATE! — 619K 라운드
- URL: /presets/Idla5VkKkNnJmTQjo2sa?versionID=1 · rules (전문 212자): 태그 기반 진영 부여 — "aligned to the west" 태그국은 반공·친미로, "soviet puppet" 태그국은 소련 괴뢰로

### 14. Real World 2026 — 584K 라운드 (규칙 21,918자, 헤드 ~4.5K) — 6,009 지역/3,479 피처
- URL: /presets/AapG3B1vfYbef5i9OaG3?versionID=137 · 시작: 2026-02-01
- before: 2023-2026 월 단위 잠금 타임라인(수집분은 2023년 초입)
- rules 수집분 — **연속성·반환각 가드의 정석**:
  * 잠금 타임라인 이후 이벤트는 기존 세계 상태의 직접적 개연 결과만, 과거 이벤트 수정·재해석 금지
  * "재선·재임명 환각 금지": 타임라인이 명시하지 않는 한 선거·취임·내각 구성 생성 금지, 현직 지도자를 "새로 선출"로 서술 금지
  * "정부 행정부"와 "국가 실체" 구분 강제: 국기·국색·국명은 Systemic Break(패전 재편, 혁명, 근본 이념 전환)시에만 변경 — 선거·총리 교체로는 불변
  * 지정학 인과: 물류·자원·정치 압력 기반, 무작위 격화 금지 / 전략적 열세국은 지속 불가시 휴전 모색
  * "현상유지 편향 명시적 무시": AI 국가는 긴장·전략 목표가 요구하면 전면 침공·결정적 공세·영토 점령을 실행할 것 — 모든 전쟁은 실제 영토 변화를 낳아야 함

### 15. World War II but with more provinces — 560K 라운드 (규칙 37,689자, 헤드 ~4.5K)
- URL: /presets/SmxXCwBltpCIvHuphQNL?versionID=61 · 시작: 1935-12-01
- about: 바닐라 WW2 + 지역 세분화("FIXING SIBERIA PROBLEM"), 국가별 미니게임 콘텐츠(오스트리아·이집트·만주국·네덜란드·스페인·중공), MINIGAMES_OFF 커맨드
- before: 위키피디아 링크를 세계관 참고자료로 첨부하는 사례
- rules 수집분: 미니게임 토글 규칙 / "어드바이저 1000단어 제한 무시" 지시 / 글로벌 이벤트 생성 의무("다른 지역 이벤트 절대 무시 금지") / "짧은 이벤트 불허 — 원인·영향·국내외 반응 탐구" / 지역=주권 원칙 / 아우사 최후통첩 스크립트(1936-04, 수락/거부 분기) / 탕헤르 국제지대 공동 관리 / 유머 허용 규칙("플레이어 농담에 받아쳐도 됨") / 긴장 소멸시 신규 갈등 창작 허용(반realistic 조건) / 무조건 항복=요구 관철권(분할 아님)

### 16. Kaiserreich — 523K 라운드 (규칙 57,834자, 헤드 ~4.5K)
- URL: /presets/qqczOCUslGWdrUKPZmg3?versionID=46 · 시작: 1936-01-01 · 대체역사 (독일 1차대전 승전, HOI4 모드 이식)
- before: 단일 분기점(1917) 서사 + Reichspakt/Mitteleuropa/Ost-Staaten 열거
- rules 수집분: 반란=신규 폴리티/진압시 합병, 인접 지역만 점령(해상 침공 명시 예외), 무주지 금지, "전쟁은 제한 턴 내 영토 변화 강제 — 정체시 돌파·붕괴·후퇴·격화 강제", 양측 교전 의무 / **스포일러 차단 계약**: "플레이어에게 이 이벤트들을 경고·암시·유도 금지, 고문·제안도 언급 금지, 날짜 절대 비공개" / 스크립트: 조지 5세 사망(1-20), Black Monday 베를린 증시 붕괴(2-3), 스페인 내전 3파전(CNT-FAI/카를리스트/왕국, 지역별 봉기 명세, 승자별 국체·식민지 처리·후속 전쟁 목표)

### 17. Fallout: New World Blues — 519K 라운드 (규칙 11,653자, 일부 필터 차단)
- URL: /presets/MkblDVZYaHzcKZLOzwh6?versionID=38 · 시작: 2275-01-01 · SF·종말 (북미 한정 맵)
- before: 세력 도감 형식(감옥 갱단, 카니발 레이더, 바이커 등 수십 세력 한 줄 소개)
- rules 수집분: "AI는 국가 이벤트 생성 전 국가/지역 태그를 읽는다" / 인접 침공 원칙(Enclave·BoS 예외) / **"고문은 플레이어 국가가 아는 것만 안다" — Vault 11·13 등 미발견 지명 언급 금지** / Plaguelands 오염 지대 시스템(태그 기반)

### 18. 1989 - Changing World — 518K 라운드 ⚠️ 규칙 67,686자 (헤드 ~4.5K)
- URL: /presets/EzVxDojz4OzI22igNMXl?versionID=69 · 시작: 1989-01-01
- rules 수집분 — **리비전 관리형 룰셋(REV 10)**: 룰셋 자체가 버전 관리되며 플레이테스트 발견→진단→수정 서술 형식
  * Rev 10: "이해관계 기반 이중잣대 행동이 이벤트 통합(consolidation)으로 소실되는 문제" → 통합시 행위자별 선택적 반응 패턴을 1급 사실로 보존 의무화
  * Rev 9: 내정 커버리지 의무(2턴에 1회 이상 국내 정치 이벤트) + 반복 금지("압력을 전진시켜라, 재인쇄가 아니라")
  * Rev 8: 조건부 스크립트 이벤트 프레임워크 — 전제조건 검사 후 발동, 세력만 심고 결과는 모멘텀 모델에 위임, 연쇄(소련 해체·유고 해체·아랍의 봄) 링크 발동, 플레이어 무시 금지
  * → Open-Historia의 eventConsolidator 개선에 직접 참고 가치. 전문 회수 후보.

### 19. Star Wars: Live Another Life - Clone Wars — 515K 라운드 ⚠️ 규칙 127,938자 (헤드 ~4.5K)
- URL: /presets/WMwWJ8fBjyQph3kfUNxs?versionID=21 · SF (BBY/ABY 역법)
- rules 수집분: 시민 모드의 발전형 — **캐릭터 시트 의무 생성**(첫 이벤트로 이름·나이·재산·가문·건강·소유물·소속 등 20여 항목), 가문 확률표(무가족 10%/편부모 15%/양친 20%/명문 5%/범죄 가문 5%/전쟁 난민 5% 등), 시대·문화 적합 이름 생성

### 20. The Fire Rises — 484K 라운드
- URL: /presets/WeO9f8scp1HsC7PTudrL?versionID=1 · 시작: 2020-01-01 · 대체역사 (HOI4 모드 이식)
- rules (전문 4,205자): 강화 COVID→사우디 내전→석유 위기→리비아 가다피 재림 / 2021 미국 2차 내전 스크립트(바이든 워싱턴 vs 트럼프 덴버 + 지역 중립·봉기 세력 태그 생성 지시, "가능한 많은 고유 태그 창작") / 미국 보호 상실→이스라엘 침공→중동 제한 핵전쟁 / 푸틴 사망→강경 정권→우크라이나 침공→NATO 5조→1차 유럽 전쟁→패자 급진화→2차 유럽 전쟁 / 강화조약은 정권 수립 위주, 영토 할양 최소화 / 대만 침공→미일 개입→중일 냉전→대아시아 전쟁 연쇄

### 21. World War II++ — 375K 라운드 (규칙 22,077자, 일부 필터 차단) — 유저가 현재 플레이 중인 프리셋
- URL: /presets/2ObqCwphp43asRGsETof?versionID=186 · 시작: 1935-12-01 · 2,450 지역
- about: "Internal: " 접두 폴리티로 액션 대체 시스템(예: "Internal: Economic Advisor")
- before: **배경 이야기 탭에서 본 것과 동일한 "EVENTS FOR REFERENCE" 목록** — 1935-1959 비주요 역사 이벤트 연표 ("참고용, 맹종 금지")
- rules 수집분: 행동=시도(자동 성공 아님) / 역사 vs 동적 궤적("플레이어가 비역사적으로 행동하면 Non-Historical 모드 꺼져 있어도 세계가 비역사적으로 반응 가능") / "Non-Historical Mode" 커맨드(4번째 벽 허용 이벤트로 통지) / 수도 이전 절차(태그·심볼 규칙, "도시가 안 보이면 추측하라 — 토큰 절약") / DMZ 생성 규약("[지역] Demilitarised Zone ([소유국])" + 태그) / 섬의 Sea Region 동반 이전 / 점령 폴리티 규약("Italian Occupation of Ethiopia" 형식)

### 22. Accurate Modern Day (EU Update!!) — 356K 라운드 ⚠️ 규칙 287,958자 — 최대 규모 (헤드 ~4.5K)
- URL: /presets/dzz0ebvj9Zbr8zTghNbl?versionID=29 · 시작: 2016-01-01
- before: "LOGICAL CHAIN" 형식 — 2008 금융위기→오바마→회복의 인과 사슬 서술 (배경을 인과 체인으로 쓰는 사례)
- rules 수집분: 역사적 이해관계 기반 행동 / 국내 행위자(정치·군·경제 인물)가 결과에 영향 / 영구 안정국 없음 / 기술 발전 논리적 제약 / 모든 프로젝트에 기한 의무 / "메타 요청 불가"(“AI야 독일이 X 침공하게 해줘” 금지) / AI는 플레이어 명령 없이 행동 발명 금지, 단 역사적 필연·플레이어 유발·타 AI 이해관계시 반드시 행동 / 지형 타입 규칙(Urban, **Highway — 고속도로 지역은 방어 없으면 급속 함락, 종심 침투 루트**) / 국기 규칙(전용 국기 우선, 없으면 404 플래그)

### 23. Unstable 2020s — 335K 라운드 (규칙 39,208자, 헤드 ~4.5K)
- URL: /presets/mLxNCbXoeIlvD9pthhVq?versionID=48 · 시작: 2020-01-01 · "max 모델 권장" 명시
- rules 수집분: 분리주의 승리→모국 합류 처리 / 긴장국 간 무작위 국경 분쟁 / 타임라인=공개 정보만(뉴스 사이트처럼) / 선거 시뮬레이션(경제·군사·사회 반영) / 부대 마커에 포병·전차·병력·피로도·사기 태그 의무 / **외교 챗 톤 규칙**: 국가는 외교관처럼, 반군은 자원 수준에 따라 격식 조정 / UN 전용 이벤트(제안·표결, 플레이어 표는 채팅으로 수집) / 뉴스체+비정치 뉴스 혼합(게임기 출시, 연예인 체포 등) / 도시 전투 전용 엔트리(참전군·스탯·바이옴·7단계 판정) / 타임라인당 경제·군사 리포트 + 국가별 특수 리포트(미국 지지율)

---

## 다음 단계 연결

- **Phase 3 이식 우선순위 제안**: ① 패턴 1-4 (지역·인접성·무주지·시도 원칙) → jump 프롬프트 보강 ② 패턴 10 (연속성·반복 방지) → eventDedup·eventConsolidator 개선 (베이스라인의 "유사 이벤트 반복" 문제와 직결) ③ 프리셋 재현 1호 후보: WW2(규칙 짧고 완결) 또는 2026 Detailed(전문 확보됨) ④ 전문 회수 필요: Better 1444, 1989, Accurate Modern Day (Pax-Automata 덤프로)
- 시나리오 스키마 시사점: Open-Historia 시나리오 에디터에 "시작 이전 세계(before)"와 "시뮬레이션 규칙(rules)" 자유 텍스트 필드가 원본 프리셋 구조와 1:1 대응 가능한지 확인 필요.

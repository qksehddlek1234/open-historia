# World War II++ 전수 대조 — 사본 실측

대조일: 2026-08-09 · 대상: **World War II++** (natriumchl, 1935-12-01 시작, 407K 라운드, 2,479 지역)
방법: 프리셋 **사본을 소유자로 생성**(`OH 대조용 사본 - World War II++`, 미발행)해 편집 화면에서 실측.
사본 생성은 플레이어가 명시 허가했고, 원본 소개문도 복사를 허용한다("feel free to copy this preset").

> 이전 기록(`presets-original.md` 21행)은 WWII++ 규칙을 22,077자 **부분 수집**으로만 남겼다.
> 이 문서가 그것을 대체한다 — 규칙 전문, 정치체 270 전수, AI 프롬프트 12종, 고급 설정 3종.

원자료는 저장소에 넣지 않는다(남의 창작물). 세션 스크래치패드에 139KB로 받아 두었고,
필요하면 사본 URL에서 같은 절차로 다시 뜬다.

---

## 1. 규모 — 우리가 얼마나 성긴가

원본은 **정치체 270개 / 지역 2,479개**(배정 2,431). 우리 1935 보드는 소유자 종수 70,
시드 3,704 피처.

| 나라 | WWII++ | 우리(시드 level-1) | 배율 |
|---|---|---|---|
| 영국 | 176 | 46 | 3.8× |
| 미국 | 136 | 51 | 2.7× |
| 러시아 SFSR | 125 | 83 | 1.5× |
| 프랑스 | 111 | 13 | 8.5× |
| 중화민국 | 90 (+군벌 ~35정치체) | 33 (중국 전체) | **12×+** |
| 독일 | 89 | 16 | 5.6× |
| 일본 | 64 | 47 | 1.4× |
| 이탈리아 | 63 | 20 | 3.2× |
| 영국령 인도 | 41 (+번왕국 ~60정치체) | 35 | **3×+** |

전반적으로 2~4배 촘촘하고, **중국과 인도만 배율이 따로 논다**. 그 둘이 아래 P4 두 건이다.

### 1-1. 중국은 지급시 단위다 (P4-①: 우리 판단이 틀렸다)

원본 체크리스트: `Most Chinese regions are based on prefectures — transfer accurately, not randomly.`
말뿐이 아니라 실물이 그렇다 — **만주국 한 정치체의 소유 지역 49개**를 열어 보면:

> 잉커우·차오양·번시·랴오양·안산·판진·후루다오·단둥·청더·자무쓰·허강·무단장·치타이허·
> 지시·쑤이화·치치하얼·헤이허·지린·쓰핑·창춘·하얼빈·쑹위안·바이청·다칭·옌볜·바이산·
> 퉁화·톄링·선양·푸순·랴오위안·퉁랴오·싱안·진저우·푸신·츠펑 …

전부 **지급시(地級市)**다. 성(省)이 아니다. 우리 중국 33개는 성 단위이므로 **한 자릿수 배율이
아니라 12배 이상 성기다**. 1차 대조에서 "공식 WWII 룰은 현대 성 단위라 우리와 같다"고 판단한 것은
대상을 잘못 잡은 결과이며, **폐기한다**.

다만 규칙 본문에는 이와 어긋나 보이는 문장도 있다 —
`Russian and Chinese regions share names and borders with modern-day Oblasts, Provinces, and Administrative Divisions.`
"Administrative Divisions"가 지급시를 포함하는 것으로 읽는 게 실물과 맞는다. 러시아는 오블라스트
(125개 = 연방주체 급)이고 중국만 한 단계 더 내려간다.

**판단**: 중국 33 → 지급시 단위(~300)는 시드 확보가 선행되어야 하고(GADM level-2 중국 = 지급시),
1935 보드 하나만 바꾸면 다른 시대 프리셋과 밀도가 어긋난다. **작업으로 등록하되 이번 배치 밖**이다.
영국 218→46에서 배운 교훈이 그대로 적용된다: 한 나라만 촘촘해지면 그게 더 이상하다.

### 1-2. British Raj 번왕국은 있다 (P4-②: 우리 판단이 틀렸다)

원본은 **British Raj(41지역)** 위에 번왕국을 개별 정치체로 둔다. 실측 60여 개:

> Bahawalpur · Bamra · Banganapaile · Baroda · Bastar · Baudh · Benares · Bhavnagar · Bhopal ·
> Bhor · Bikaner · Cochin · Cutch · Dhenkanal · Gangpur · Gwalior · Hill Tripula · Hyderabad ·
> Indore · Jaipur · Jaisalmer · Jamkhandi · Jammu and Kashmir · Janjira · Jath · Jodhpur ·
> Junagadh · Kalahandi · Kalat · Keonjhar · Khairpur · Kharan · Kolhapur · Kotah · Las Bela ·
> Makran · Manipur · Mayerbhanj · Morvi · Mudhol · Mysore · Nawanagar · Orchha · Palanpur ·
> Panna · Patiala · Patna · Phaltan · Porbanda · Pudukkhotai · Rajpipla · Rampur · Rewa ·
> Sargli · Savantwadi · Sikkim · Sirohi · Sonpur · Surguja · Travancore · Udaipur

여기에 **잔여 번왕국을 모으는 `Princely States`(6지역)** 폴리티가 따로 있고,
`Federated Shan States`(2)도 있다. 1937-04-01 이벤트가
`If regions aren't owned by British India, Princely States, or Federated Shan States, ignore them`
이라고 셋을 나란히 부르는 것이 그 구조의 증거다.

"공식 WWII 지도에서 통짜로 보여 번왕국 없음"으로 내린 1차 판단은 **폐기한다**.

**판단**: 번왕국 전부(60+)는 과하다 — 대다수가 1지역짜리이고 우리 지역 계약상 "1지역=나라 전체"라
서사 부담만 늘린다. **큰 것 6~8개**(하이데라바드·마이소르·잠무카슈미르·바로다·괄리오르·인도르·
트라반코르·파티알라)를 개별 폴리티로, 나머지는 `Princely States` 한 덩어리로 두는 절충이
원본 구조를 살리면서 우리 밀도에 맞는다.

### 1-3. 아이슬란드 — Cowork가 남긴 판단 건, 원본으로 답이 나온다

Cowork 로그(2026-08-09 병합 항목)가 `eraSovereignty`(덴마크) vs OHM 면(독립)의 충돌을
클로드 코드 판단으로 남겼다. **원본에는 Iceland 폴리티가 없다** — 270개 목록에서 Hyderabad와
Ikechao League 사이가 비어 있고, 타임라인에 `June 17, 1944: Iceland gains independence.`가 있다.
즉 원본은 1935 시작 시점 아이슬란드를 **덴마크의 일부로 모델링**하고 1944년에 분리시킨다.

사실관계로는 1918년 연합법 이후 동군연합 하 주권국이 맞다. 그러나 게임 보드의 소유권 모델로는
원본과 같은 선택(덴마크)이 일관되고, F-3 접합에서 면이 표를 이겨 ISL 5지역이 재배정된 것은
**표를 고칠 게 아니라 면 쪽을 덴마크 소유로 접합**해야 한다는 뜻이다.

**판단: eraSovereignty의 덴마크 유지.** 대신 그것이 사고가 아니라 결정이라는 근거를 표에 남긴다.

---

## 2. 정치체 유형 — 우리에게 통째로 없는 두 종류

원본 270개 중 **영토 0개짜리 채팅 전용 폴리티**가 13개 있다. 이것이 P2다.

### `Internal:` 자문 정치체 (10)

`Internal: Head of Military` · `Diplomatic Representative` · `Economic Advisor` ·
`Head of Intelligence` · `Media Chief` · `Research Director` · `Foreign Minister` ·
`Trade Minister` · `Interior Minister` · `Religious Leader`

규칙: *영토 없음, 이벤트에 등장하지 않음, 채팅 전용. 전부 플레이어에게 자기 직책으로 말한다.*
`Diplomatic Representative`만 예외로 **그룹 채팅에서 플레이어를 대신해 답할 수 있다**.
원본 소개문은 이 묶음을 "'행동' 보드의 대안"이라고 부른다 — 즉 브레인스토밍 보드를
읽는 대신 담당자에게 물어보는 경로.

우리에겐 어드바이저가 **단일 창구 하나**뿐이다(`src/Game/GameUI/advisor.jsx`, 프롬프트 키 `advisor`).

> 목록에 `Religious Leader`가 `Internal:` 접두어 없이 별도 항목으로도 한 번 더 있다(원본의 오타로 보임).

### `Domestic:` 국내 정치체 (2)

- `Domestic: Civilians` — 플레이어 나라 민간인으로서 말한다.
- `Domestic: Newspaper` — **신문 지면을 통째로 출력**한다. 대화 맥락·서두·바깥 논평 전부 금지,
  헤드라인/기사/바이라인/광고의 서식 텍스트만. 출처만 예외로 밝힌다. 헤드라인과 광고는 헤더 서식.
  출력 언어는 지시받은 언어로 번역(국내어만이 아니라).

### 그 밖의 특수 폴리티 (우리도 대응물이 있는지 확인 필요)

- `Observer Mode`(0지역) — AI·플레이어 어느 쪽도 상호작용 불가, 이벤트에 안 나옴, 영토 없음.
  플레이어가 고르면 "아무 나라도 안 하고 관전만" 상태.
- `Water`(3지역) — 상호작용 불가. 네덜란드 같은 나라가 여기로 **확장**할 수 있고, 반대로
  Water가 지역을 얻으면 그건 **대홍수**다(1938 황하 범람 같은 얕은 물은 여기 해당 안 됨).
  이스터에그: 말을 걸면 물고기로 답한다.
- DMZ 폴리티 — `[지역명] Demilitarised Zone ([소유국])` + 태그 `DemilitarisedZone` + 소유국 태그.
  실물: `Rhine Demilitarised Zone (German)`(15) · `Aland Demilitarised Zone (Finnish)`(1) ·
  `Straits Demilitarised Zone (Turkey)`(7).
- 점령 폴리티 — `[점령국] Occupation of [피점령국]`. 실물: `Italian Occupation of Ethiopia`(2).

---

## 3. 정치체별 프롬프트 — 실측 결과

**정치체 편집 화면에는 설명/프롬프트 필드가 없다.** 필드는 이미지·이름·색상·**추가 이름**(별칭)·
소유 지역·**태그**뿐이다(만주국을 열어 확인, 별칭 `Manchuria`).

따라서 "정치체별 프롬프트"의 실체는 **추천 정치체(Featured) 섹션의 설명문**이고, 원본은 13개에만
붙여 놓았다:

German Reich · Kingdom of Italy · United Kingdom · Chinese Soviet Republic · Republic of China ·
Russian SFSR · Japan · Yugoslavia · French Republic · United States · Spanish Republic · Turkey ·
Observer Mode

성격은 **1~2문단짜리 백과사전식 개요**이고(대부분 Wikipedia 출처를 명기), 일부만 시대 초점을
따로 쓴다(영국="세 왕의 해", 미국=고립주의→불가피한 개입, 중화소비에트=대장정 후 옌안의 잔존국가).
**게임 규칙이 아니라 플레이어용 소개문**이다.

**판단**: 우리 스펙의 폴리티별 서술은 이미 이보다 두껍다(별칭·색·시대 근거 주석). 원본을 좇아
백과사전 문단을 옮길 이유는 없다. **원본에서 부여되지 않은 정치체는 패스**라는 플레이어 지침에
따라 이 항목은 **대조 완료, 이식 없음**으로 닫는다.

실제로 우리가 배울 것은 폴리티 필드 구조 쪽이다:
- **태그(tags)** 가 규칙에서 실제로 쓰인다(DMZ 판별, 점령 판별). 우리에겐 태그 개념이 없다.
- **추가 이름(별칭)** 은 "키워드 스캔"용이라고 프롬프트가 명시한다 — 우리 aliases와 같은 목적.

---

## 4. AI 프롬프트 12종 — 슬롯 대조

원본 편집기의 프롬프트 슬롯(전부 실측·전문 확보):

**슬롯은 12개 전부 우리에게도 있다.** 헬퍼 이름까지 그대로 일치한다(`PLAYER_POLITY`,
`GRAND_MAP_DESCRIPTION_NO_CITY`, `ALL_EVENTS_WITH_CONSOLIDATION_CATALYSTS`,
`DIFFICULTY_DESCRIPTION_CHATS`, `ORIGIN_ROUND_DATE` …) — 같은 계보라는 뜻이고, 그래서 원본
템플릿을 우리 프롬프트에 거의 1:1로 대조할 수 있다.

| 원본 슬롯 | WWII++ | 우리 키 | 우리 | 읽는 법 |
|---|---:|---|---:|---|
| 사용자와 채팅 | 7,274 | `leader` | 13,908 | 우리가 두껍다 |
| 조언자와 채팅 | 8,633 | `advisor` | 9,279 | 대등 |
| 시간 건너뛰기 | 3,708 | `jumpForward` | 27,944 | 저쪽이 **의도적으로 줄인 것** |
| 자동 시간 건너뛰기 | 5,529 | `autoJumpForward` | 22,888 | 〃 |
| 행동 | 5,603 | `actions` | 5,641 | 대등 |
| 다음 발언자 | 1,257 | `nextSpeaker` | 1,532 | 대등 |
| 설명에서 행동으로 | 6,009 | `descriptionToAction` | 6,545 | 대등 |
| 이벤트 통합기 | 2,947 | `eventConsolidator` | 5,404 | 우리가 두껍다 |
| 촉매 생성 | 18,066 | `catalystCreation` | 18,377 | **거의 동일 = 엔진 기본값** |
| 촉매 실행 | 17,782 | `catalystExecutor` | 18,240 | 〃 |
| 촉매 요약 | 4,419 | `catalystSummary` | 12,130 | 우리가 두껍다 |
| 게임 마스터 | 7,784 | `gameMaster` | **1,006** | **우리 것이 스텁 — 유일한 실질 공백** |

우리에겐 원본 편집기에 없는 슬롯도 다섯 있다: `countryStatSheet`·`pregameHistory`·
`idleDiplomacy`·`actionCoverage`·`countryStatShift`.

> **주의**: 여기 실린 WWII++ 수치는 **그 프리셋의 오버라이드**이지 엔진 기본값이 아닐 수 있다.
> 촉매 3종이 우리 값과 1~2% 차이인 것은 양쪽 다 손대지 않은 엔진 기본값이라는 뜻이고,
> jump 2종이 1/7인 것은 저자가 직접 줄였다는 뜻이다(아래 4-1).

**실질 공백은 `gameMaster` 하나** — 우리 1,006자짜리 스텁 대 원본 7,784자. 촉매 기능군은
"통째로 없는 것"이 아니라 이미 같은 프롬프트로 배선돼 있다(`gameplay.js`에 catalyst 64회 등장,
UI는 `GameUI/main.jsx`·`scenarios.jsx`·`settings.jsx`).

### 4-1. WWII++가 손댄 것 — jump 프롬프트를 돈 아끼려 줄였다

`시간 건너뛰기` 템플릿 첫 줄이 `(Filler words dropped to conserve money)`이고 전체가
전보체다. 12B 로컬 모델을 쓰는 우리에게 직접적인 참고가 되는 몇 가지:

- `>50% of events must have MAP UPDATES per turn.` — 지도가 안 움직이는 턴을 막는 정량 규칙.
- `6-15 events per month with long descriptions (scales with activity).` — 이벤트 밀도 하한/상한.
- `Max 25% bolding limit in descriptions.` — 볼드 남발 차단.
- `Realistic event intervals (no rigid 5-day blocks).`
- `Do not transfer regions to unoccupied during direct annexation/collapse.`
- `Unnecessary to use EVERY tool you have all at once.`

---

## 5. 고급 설정 (플레이어 지시: 통째로 이식)

`고급 설정 열기` → 세 개.

### 5-1. 이벤트 통합 설정

| 항목 | 원본 값 | 우리 |
|---|---|---|
| 시작 라운드 (startsOnRound) | 10 | `startRound` 기본 15 — **있음** |
| 청크 크기 (chunkSize) | 7 | `intervalRounds` 기본 5 — **있음** |

원본 설명: *"통합기는 startsOnRound, startsOnRound + chunkSize, … 라운드에서 실행됩니다"*.

**결함 발견**: 우리 `mapSettings.js` 주석은 원본과 같은 의미로 쓰여 있는데
(`startRound`는 처음 실행 라운드, `intervalRounds`는 그 후 주기), `gameplay.js`의 실제 조건은
`round % intervalRounds === 0`으로 **0라운드 기준 배수**다. 시작 라운드에 정박하지 않는다.
기본값(15,5)에서는 우연히 일치하지만(15%5==0) 원본 값(10,7)을 넣으면 10·17·24가 아니라
14·21·28에 돈다. **설정이 문서대로 동작하지 않는다 — 수리 대상.**

### 5-2. 지도 렌더링 옵션 (우리에게 거의 없음)

| 항목 | 원본 설명 | 원본 값 | 우리 |
|---|---|---|---|
| 지도 텍스트 글꼴 | 지도 피처 라벨(도시·대대) 글꼴. 9종: Serif/Sans-serif/Georgia/Palatino/Times New Roman/Arial/Trebuchet MS/Poppins/Courier New | `serif` | **없음** |
| 라벨 선 확장 | 국가 라벨 선이 폴리곤 가장자리를 넘어 연장되는 길이 | `0.015` (기본) | **없음** |
| 경계선 페이드 범위 | 지역 경계선이 투명→가시로 전환되는 줌 범위. 시작 줌 이하 숨김, 종료 줌에서 완전 불투명 | 2.4 → 7 | **없음** |
| 평행 세계 숨기기 | 세계 단일 사본만 표시. 날짜변경선 래핑 비활성 | off | **없음** |
| 세계 경계 | 표시 지도를 지리 직사각형으로 제한, 카메라가 밖으로 못 나감 | off | **없음** |
| 중심점 스케일 모드 — 절대적 | 피처가 고정 지면 크기를 가지고 너무 작아질 때까지 표시 | on · 기본 크기 15,000 m · 최소 픽셀 2 | `featureSizeAbsolute` **부분** |
| 좌표 스케일 모드 — 상대적 | 피처가 줌에 따라 크기 조정, 낮은 줌에서 사라짐 | off · Floor 3.817931 · Ceiling 8.192349 | `featureSize` **부분** |

우리에게 있는 건 `zoomSensitivity`·`borderWidth`·`featureSize`·`featureSizeAbsolute` 넷.
**글꼴·라벨 선 확장·경계선 페이드·평행 세계·세계 경계**는 통째로 없다.

### 5-3. 문서 크기 (저장 용량 계기판)

Firestore 1MB 문서 한계를 감시하는 계기판. 세 게이지:

| 게이지 | 무엇을 담나 | WWII++ 실측 |
|---|---|---|
| 프롬프트 문서 | 프롬프트·시뮬레이션 규칙·시작 타임라인·기본 맵 레이어·일반 설정 | 409.0 KB / 1 MB (39.9%) |
| 데이터 문서 | 맵 피처·국가 설명·이벤트·플레이어 행동·촉매·채팅 | 305.4 KB / 1 MB (29.8%) |
| 단어 수 | 시뮬레이션 규칙 + 타임라인 문자 수(라운드 1 이전) | 32.4k / 800k (4.0%) |

원본 UI 주석: *"대부분의 경량 모델은 최대 컨텍스트 길이가 80만 자"*.

**우리에게 유효한 것은 세 번째다.** 우리는 Firestore를 쓰지 않으므로 1MB 문서 한계는 없지만,
**로컬 12B의 컨텍스트가 곧 그 한계**다. 우리 wwii-1935 규칙은 8,005자, 원본은 32.4k자 —
원본이 4배다. 규칙+타임라인 문자 수 계기판은 우리 쪽이 오히려 더 필요하다.

---

## 6. 이번 배치에서 할 것 / 미룰 것

| # | 항목 | 판단 |
|---|---|---|
| P2 | `Internal:` 자문 10종 + `Domestic:` 신문·민간인 | **한다** |
| P3 | 점령 폴리티 명명 · 예정 이벤트 탭 · 비역사 반응 규칙 | **한다** |
| 고급 | 통합 주기 정박 수리 | **한다** |
| 고급 | 지도 렌더링 5종(글꼴·라벨선·경계 페이드·평행세계·세계경계) | **한다** |
| 고급 | 규칙+타임라인 문자 수 계기판 | **한다** |
| — | 아이슬란드: eraSovereignty 덴마크 확정 + 근거 명기 | **한다** |
| P4-② | 번왕국 큰 것 6~8개 개별화 + `Princely States` 잔여 | **한다** |
| — | `gameMaster` 스텁(1,006자) 채우기 | **한다** |
| P4-① | 중국 지급시 세분화(33 → ~300) | **미룬다** — 시드 확보 선행, 전 시대 밀도 문제 |
| — | 폴리티 태그(tags) 개념 | **미룬다** — DMZ/점령 판별에 쓰이나 우리는 명명 규칙으로 대체 가능 |

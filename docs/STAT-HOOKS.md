# 통계 지수 → 게임 기계 연결 설계 (2026-08-07 확정)

배경: 전수 조사 결과 stability와 전략 지수 6종의 소비처가 사실상 0이었다 —
internationalReputation이 프롬프트 한 줄로 실리는 것과 (미배선 상태의) 건설
역량뿐. 메인 턴 생성 프롬프트에는 플레이어 시트 자체가 실리지 않아 서사
조건화조차 되지 않았다. 플레이어 결정: **4개 훅 전부 연결.**

원칙: 12B 패턴 — 모델에게 산수를 시키지 않는다. 엔진이 숫자를 읽어 판정을
바꾸거나(하드), 프롬프트에 사실을 공급만 한다(소프트). 임계값은 전부 측정
기반, 콘솔에 근거를 찍는다.

## 훅 1 — 난이도 좌절 쿼터 변조 (하드)

Impossible 등 난이도의 setback quota(비청정 기대치)를 플레이어의 병합 시트로
조정: stability ≥ 85 그리고 internalSecurity ≥ 85 → 기대 좌절 −1;
stability < 50 또는 internalSecurity < 50 → +1; stability < 25 → +2.
콘솔: "[difficulty] 안정 89·치안 99 — 이번 턴 기대 좌절 −1". 쿼터 하한 0.

## 훅 2 — 외교 접근 성향 (하드)

diplomaticOutreachPass가 평판을 읽는다: ≥ 70이면 접근 후보 판단에 우호
성향(제안·협력 비중)을 명시, < 40이면 접근 자체가 드물고 요구·경고·조건부
성격임을 명시. 유휴 드립(1/8·분)의 발화 확률도 평판 밴드로 ±(70+: ×1.5,
40−: ×0.5). 근거 콘솔 기록.

## 훅 3 — 턴 프롬프트에 플레이어 시트 요약 (소프트)

buildPromptContext에 playerStatSummary 추가: 병합 시트에서 지도부 3역,
stability, 지수 6종, GDP·성장률만 뽑은 ~100토큰 블록. jumpForward/actions/
catalyst 계열 태스크에 [Your Nation's Standing]으로 탑재.

## 훅 4 — 취약성 렌즈 공급 (소프트)

foodAutonomy 또는 energyAutonomy < 50이면 [Era-Conditional Lenses]의
MATERIAL BASE 렌즈에 실제 수치를 공급: "식량자립 40 — 이 의존은 위기에서
공격면이다". 50 이상이면 아무것도 추가하지 않는다(죽은 렌즈 패딩 금지).

## 함께 나가는 배선 (같은 배치)

- 건설 역량 배선: gameplay.js 착공 경로가 constructionCapacity(플레이어 병합
  시트)를 nextSlotDate/beginConstruction/buildPipelineText에 전달.
- 어드바이저 적체 경고: 다음 빈 슬롯이 12개월 이상 뒤면 추천에 표기.
- 일회성 라이브 재편성: 대기 중(미착공) 프로젝트들을 새 역량으로 재산정.

전제: 클로드 코드 스윕 커밋 동기화 후 구현 (해당 파일들이 미커밋 상태).
테스트: capacity.mjs에 훅별 핀·기능 테스트 추가, 기존 스위트 전부 유지.

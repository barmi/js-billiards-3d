# Stage 12 — 최종 QA + 문서 갱신

## Phase 12.1 — 종단 점검 + README/PLAN 갱신

### 점검 체크리스트
- [x] 풀파워 브레이크에서 공 터널링 없음 (Phase 8.1 자동 검증).
- [x] 모든 공 정지까지 ≤ 4초 (Phase 8.2: 2.80s 측정).
- [x] 톱/백 스핀 각각 의도된 거동 (Phase 9.2: topSpin=follow, backSpin=draw).
- [x] 4종 사운드 (Phase 10.1: ctx running + 4 버퍼 + 호출 무에러).
- [x] 탑뷰 토글 (Phase 11.1: polar 1.54↔0.25).
- [x] Ball-in-hand: foul → state 전이 → 마우스 배치 → 확정 (Phase 11.2 시뮬레이션).
- [x] 16개 공 번호 식별 가능 (Phase 11.3: 시각).
- [x] 게임 종단(승/패 + New Game) 정상 (Stage 5 기존 검증 유지).

### 종합 검증 결과
- 모듈 로드: sound/picker/physics/game 모두 정상.
- 16개 공: 모두 텍스처 적용(`material.map`), 자식 메시 없음(스트라이프 cylinder 제거).
- 사운드: AudioContext running, 4 버퍼 합성 완료.
- 카메라 토글: 정상 동작 (polar 범위 변경).

### 마이그레이션
- `PCFSoftShadowMap` → `PCFShadowMap` (three.js r184에서 deprecated).

### 문서
- README.md 전면 갱신 — 조작·스핀·사운드·기술 스택·디렉토리·단계 이력 모두 반영.
- PLAN.md — Stage 8-12 완료 마킹, 남은 이연 항목 정리.

→ **프로젝트 완료**. 모든 사용자 보고/요청 사항 반영:
  - ✅ 공 터널링 수정 (3중 방어)
  - ✅ 샷 후 즉응성 (≤4초)
  - ✅ 사운드 (4종, 절차적 합성으로 외부 파일 없음)
  - ✅ 타격점 조절 + 스핀 물리
  - ✅ 누락된 기능 모두 (탑뷰, ball-in-hand, 공 번호 텍스처)

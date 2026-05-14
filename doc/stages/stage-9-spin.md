# Stage 9 — 타격점 컨트롤 + 스핀 물리

> 사용자 요구: "흰공의 정 중앙만 치는 것이 아니라, 치는 위치를 조절할 수 있게 해야 함. 그에 따른 공의 움직임도 최대한 비슷하게 시뮬레이션 해야 함."

## Phase 분해

- **Phase 9.1**: 타격점 UI — 큐볼 단면 위젯에서 마우스로 타격 위치(수직 ↑↓ = 톱/백스핀, 수평 ←→ = 사이드 잉글리시) 설정.
- **Phase 9.2**: 스핀 → 회전 적용 + 펠트 위 굴림/슬립 거동 튜닝.

## 물리 모델 개요

### 좌표
- aim_dir = (a.x, 0, a.z) 정규화. 큐볼이 이동할 방향(xz).
- offset = (offsetX, offsetY), 각 [-1, 1]. 큐볼 단면에서 중심 기준 정규화 위치.
  - offsetY > 0: 큐 팁이 공 위쪽을 침 → **톱스핀**(follow).
  - offsetY < 0: 아래쪽 → **백스핀**(draw).
  - offsetX > 0: 오른쪽 → **오른쪽 잉글리시**.
  - offsetX < 0: 왼쪽 잉글리시.

### 각속도 부여 공식
큐 팁 임팩트 시점에 공은 정지. 임팩트는 거의 순간적이므로 임펄스 모델로 근사.
- 큐 팁 위치(공 중심에서 본 상대): `r = (offsetX·R, offsetY·R, -R)` (큐는 공의 뒷면을 침, -aim 방향이 -Z 로컬과 같다고 가정).
- 임팩트 힘: F = (0, 0, +Fz) 로컬, 즉 aim 방향.
- 각충격량: τ = r × F = `(offsetY·Fz·R, -offsetX·Fz·R, 0)`. (Fz = 임펄스 크기)
- 구체 관성: I = (2/5)mR². 각속도: ω = τ/I × dt (또는 직접 셋업).

실제로는 다음과 같은 단순화 공식을 사용:
- `ω_topspin = offsetY × (v_linear/R) × kTopGain` (월드 회전축은 aim에 수직한 수평축: (a.z, 0, -a.x))
- `ω_sidespin = -offsetX × (v_linear/R) × kSideGain × y_axis_unit` (월드 Y축)

기본 gain:
- `kTopGain = 0.9` — full top/back offset에서 거의 순수 굴림(v/R) 각속도.
- `kSideGain = 0.6` — 사이드 스핀은 효과가 쿠션 후 발현되므로 적당히.

### 펠트 위 굴림/슬립
- 톱스핀: 굴림 마찰로 인해 ω·R > v 면 ball이 가속(슬립이 사라지면 정상 굴림). cannon-es 디폴트 friction이 처리.
- 백스핀: ω·R < v면 ball이 감속, 충분히 강하면 충돌 후 후진(draw shot).
- 사이드 스핀: 직선 운동에는 큰 영향 없음, 쿠션 충돌 후 반사각이 휨.

cannon-es에서 angularVelocity·Y(잉글리시)는 펠트와의 동마찰로 점진적으로 감쇠. 추가 튜닝 불필요.

---

## Phase 9.1 — 타격점 UI

### 결정사항
- 위젯: 화면 좌하단(파워 게이지 반대편)에 큐볼 단면을 표현하는 작은 원(약 88px).
- 마우스 클릭/드래그로 단면 내부 위치 설정. 원 바깥 클릭은 가장자리에 클램프.
- 시각: 흰 원 + 작은 점(현재 타격점).
- 키보드 단축: `R` 키로 중심으로 리셋.
- 상태: 샷 발사 후 자동 리셋(다음 샷도 중앙부터).

### 모듈
- 신규: [src/js/ui/ImpactPicker.js](../../src/js/ui/ImpactPicker.js).
- `picker.getOffset()` → `{ x: [-1,1], y: [-1,1] }`.

### 큐 스틱 시각 반영 (선택)
- 큐 스틱이 큐볼의 정확한 타격 지점을 가리키도록 가로/세로 오프셋 적용 — 시각 단서. 풀백 방향은 그대로.

### 검증
- 위젯 클릭 → 도트가 클릭 위치로 이동.
- 원 바깥 클릭 → 가장자리에 클램프.
- 발사 후 자동 중심 리셋 확인.

### 변경 요약
- 신규: [src/js/ui/ImpactPicker.js](../../src/js/ui/ImpactPicker.js). pointerdown + window pointermove/up 패턴.
- [src/css/style.css](../../src/css/style.css): `.impact-picker` 스타일 (radial gradient 큐볼 + 십자선 + 빨간 도트).
- [src/js/main.js](../../src/js/main.js): ImpactPicker 인스턴스화. window.__demo에 노출.

### 검증 결과 (자동)
- topClick: y=+0.96, rightClick: x=+0.96, bottomLeft: (-0.71, -0.71) — 좌표계 정상.
- 원 바깥 클릭: magnitude=1.0 정확히 (가장자리 클램프).
- reset(): (0, 0) 복귀.

---

## Phase 9.2 — 스핀 물리 적용

### 결정사항
- ShotController.onFire에서 picker.getOffset() 가져와 각속도 부여:
  - 톱/백: 월드축 `(aim.z, 0, -aim.x)` 방향에 `offsetY × (v/R) × 0.9` 곱.
  - 사이드: 월드 Y축 방향에 `-offsetX × (v/R) × 0.6` 곱.
- 큐 스틱 시각 오프셋 — Phase 9.2에서 큐 스틱 위치를 큐볼 표면의 임팩트 지점에 정렬.

### 검증 (각각 별도 테스트)
- 톱스핀 풀파워 → 큐볼이 객체구 충돌 후 **앞으로 따라가야** 함 (정지하지 않음).
- 백스핀 풀파워 → 큐볼이 객체구 충돌 후 **뒤로 후진**해야 함.
- 우측 잉글리시 풀파워 → 큐볼이 쿠션에 충돌 후 진행 각도가 **오른쪽으로 휘어야** 함.
- 무스핀(중심 타격) → 큐볼이 객체구와 정면 충돌 시 거의 정지 (운동량 전달).

각 케이스는 시뮬레이션 후 큐볼 종착 위치/속도로 자동 검증.

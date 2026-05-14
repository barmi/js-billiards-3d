# Stage 4 — 게임 메커닉 (큐 스틱, 샷)

목표: 플레이어가 큐 스틱으로 큐볼을 조준하고 샷을 발사하는 인터랙션을 완성.

## Phase 분해

- **Phase 4.1**: `CueStick` 객체. 카메라 방향을 따라 큐볼을 가리킴. 모든 공이 정지했을 때만 표시.
- **Phase 4.2**: 파워 게이지 + 샷 발사. 좌클릭 누름으로 파워 충전, 떼면 큐볼에 임펄스 적용. 발사 애니메이션.
- **Phase 4.3**: 스핀(잉글리시) — 큐볼 표면의 타격 지점에 따라 각운동량 부여. UI는 작은 큐볼 모형 + 클릭.

## 조준 모델 (결정)

3D 풀 게임의 일반적 패턴 채택: **카메라 시점 = 조준 방향**.
- OrbitControls로 카메라를 큐볼 주위로 회전.
- 큐 스틱은 항상 카메라의 반대편(큐볼 뒤)에서 큐볼을 향함.
- 샷 발사 시 임펄스 방향 = (큐볼 - 카메라).xz, 정규화.

이 방식은 별도 마우스 조준 UI 없이 직관적이며 OrbitControls와 충돌하지 않음.

---

## Phase 4.1 — 큐 스틱 시각화 + 조준

### 결정사항
- 큐 스틱 모델: `CylinderGeometry(tipRadius=0.008, buttRadius=0.024, length=1.4)` + 팁에 작은 가죽캡(흰 sphere).
- 지오메트리 빌드 후 `rotateX(π/2) + translate(0,0,-length/2)`로 팁이 로컬 원점, 바디가 로컬 -Z 방향으로 뻗도록 정규화.
- **three.js 주의점**: `Object3D.lookAt`은 카메라가 아닌 객체에서 **로컬 +Z를 타겟 방향**으로 정렬 (카메라와 반대). 따라서 바디(-Z)가 -dir 방향이 되도록 `lookAt(position + dir)`을 사용.
- 표시 조건: 큐볼이 살아있고 모든 공이 정지(`physics.isAllAtRest()`).
- 카메라가 큐볼을 중심으로 회전하도록 매 프레임 `stage.controls.target`을 큐볼 위치로 갱신.
- 초기 카메라 위치를 헤드 스팟 뒤쪽(-x)으로 두어 자연스러운 브레이크 자세.

### 변경 요약
- 신규: [src/js/objects/CueStick.js](../../src/js/objects/CueStick.js).
- [src/js/main.js](../../src/js/main.js): 초기 브레이크 임펄스 제거 → CueStick 인스턴스 추가 → `updateAim()` 매 프레임 호출. OrbitControls target을 큐볼 추종. `window.__demo`로 디버그용 전역 노출.

### 검증
- 카메라를 회전하면 큐 스틱이 큐볼 뒤쪽을 따라 회전. 공이 움직이는 동안엔 숨김.
- 팁(가죽캡)이 큐볼 표면 근처에 있고 바디는 플레이어 쪽(카메라 방향)으로 뻗음.
- 콘솔 에러 없음.

→ Phase 4.2 진입 — 파워 게이지 + 샷 발사.

---

## Phase 4.2 — 파워 게이지 + 샷 발사

### 결정사항
- 입력: **스페이스바**로 차지/릴리스. OrbitControls 좌클릭 드래그와 충돌 없음.
- 차지 속도: 1/1.5 per sec (1.5초에 풀파워). 0~1 normalized power.
- 샷 속도 매핑: power 0→0.6 m/s, power 1→8.0 m/s 선형 보간.
- 큐 스틱 풀백: power × 0.18 (최대 18cm 후퇴). 시각적 차지 표현.
- 차지 중 공이 움직이기 시작하면(연속 입력 방어) 자동 취소.
- HUD 우하단 220px 세로 게이지, green→yellow→red 그라데이션.
- 구조: `src/js/controls/ShotController.js`에 인풋·차지 상태, main.js에서 콜백으로 시각화/발사 처리.

### 변경 요약
- 신규: [src/js/controls/ShotController.js](../../src/js/controls/ShotController.js).
- [src/js/main.js](../../src/js/main.js): ShotController 인스턴스화, `onCharge`(게이지+풀백), `onFire`(`body.velocity.set(aim·v)`) 와이어업.
- [src/css/style.css](../../src/css/style.css): `.power-gauge`, `.power-fill` 스타일.

### 검증
- 스페이스바 누름→차지(게이지 충전, 스틱 풀백) 동작.
- 풀파워(power=1) 릴리스 시 큐볼 속도 8.0 m/s, 방향=조준 방향 일치 확인.
- 콘솔 에러 없음.

---

## Phase 4.3 — 스핀 (잉글리시) — **연기 결정**

스핀은 정확히 구현하려면 ball-cloth 마찰 모델과 측면 임팩트 포인트 매핑이 필요해 별도 작업. 기본 8볼 게임플레이엔 필수 아님. **Stage 7(폴리시)로 이연**하거나 별도 이터레이션으로 처리.

→ **Stage 4 종료** (4.1, 4.2 완료, 4.3 이연). Stage 5 진입.

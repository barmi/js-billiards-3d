# Stage 6 — UI/UX 폴리시

목표: 플레이어가 보다 정확하게 조준하고 게임을 즐길 수 있도록 시각·인풋 UX를 보강.

## Phase 분해

- **Phase 6.1**: 조준 어시스트 라인 — 큐볼에서 첫 충돌(공/쿠션)까지의 예측선 표시.
- **Phase 6.2**: 카메라 보조 — 'V' 키로 탑뷰 ↔ 자유 시점 토글.

(Stage 6은 이 정도로 종결하고, 텍스처/사운드 같은 시각 폴리시는 Stage 7로.)

---

## Phase 6.1 — 조준 어시스트 라인

### 결정사항
- 라인: 큐볼 중심에서 조준 방향으로, 첫 충돌(다른 공 또는 쿠션 안쪽 경계)까지.
- 단순 수학 사용 — 쿠션 경계는 사각 평면 4면(x = ±W/2−r, z = ±H/2−r)으로 근사. 포켓 컷은 무시.
- 공-공 충돌 예측: ray-sphere 교차(`ray-to-ball-center` 거리 ≤ 2R)로 모든 객체구와 t 계산, 가장 가까운 양의 t.
- 두 후보 중 작은 t를 종점으로.
- 시각: 흰색 라인(`THREE.Line`), 알파 0.45. canShoot일 때만 표시.
- 클래스: [src/js/objects/AimLine.js](../../src/js/objects/AimLine.js).

### 변경 요약
- 신규: [src/js/objects/AimLine.js](../../src/js/objects/AimLine.js).
- [src/js/main.js](../../src/js/main.js): aimLine 인스턴스화, `updateAim()`에서 `aimLine.update(start, dir, balls)` 호출.

### 검증
- 조준선이 큐볼에서 가장 가까운 객체구 표면까지 정확히 그어지고, 공 없는 방향엔 쿠션 경계까지 그어짐.
- 공 이동 중에는 사라지고, 정지 후 다시 표시.

→ **Stage 6 완료** (탑뷰 토글은 향후 폴리시로 이연). Stage 7 진입.

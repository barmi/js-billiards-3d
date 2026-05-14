# Stage 2 — 물리 엔진 통합

목표: cannon-es를 통합하고 three.js 메시와 양방향 없는 단방향(body→mesh) 동기화 레이어를 구축. 단순한 낙하/충돌 데모로 검증.

## 단계 분해 (수정)

당초 PLAN.md에서 3 phase로 나누었으나, 인프라(World + sync)는 분리하면 너무 작고 결합도가 높아 **2 phase**로 통합:

- **Phase 2.1**: `PhysicsWorld` 클래스 — 월드, 머티리얼/접촉, 시간 적분, Body↔Mesh 동기화 레이어를 한 모듈에서.
- **Phase 2.2**: 검증 데모 — 구체 낙하 + 박스 충돌. 임시 큐브를 제거하고 물리 객체로 교체.

---

## Phase 2.1 — PhysicsWorld 모듈

### 결정사항
- 단방향 동기화: 물리 → 그래픽. 게임플레이에서 그래픽 위치를 직접 손댈 일이 없으므로 단순화.
- 시간 적분: `world.step(fixedTimeStep, deltaTime, maxSubSteps)`. fixedTimeStep=1/60, maxSubSteps=4.
- Broadphase: `SAPBroadphase` (수십 개 공 시나리오에서 Naive보다 빠름).
- 머티리얼 3종: `ball`, `felt`, `cushion`. 조합별 ContactMaterial 등록 (마찰/반발계수).
- Sleep 허용: 정지한 공이 CPU를 안 먹게.

### 계획
- `src/js/physics/PhysicsWorld.js`:
  - `constructor()`: World, materials, contact materials 셋업.
  - `addStatic(body)`: 정적 바디(테이블, 쿠션 등) 등록.
  - `addDynamic(body, mesh)`: 동적 바디 + 메시 페어 등록 → 매 스텝 동기화 큐에 추가.
  - `step(dt)`: 월드 적분 후 동기화 큐 메시 위치/회전 갱신.
- main.js에서 PhysicsWorld 인스턴스를 만들고 Stage의 `onUpdate`에 step을 연결.

### 진입 조건
- PhysicsWorld가 인스턴스화되고 매 프레임 step이 호출됨 (콘솔 에러 없이).

---

## Phase 2.2 — 검증 데모

### 계획
- 임시 큐브 제거. 대신:
  - 정적 평면(바닥)에 `CANNON.Plane` 콜라이더 추가.
  - 공 반지름과 동일한 `CANNON.Sphere` 한두 개를 약간의 높이에서 낙하시키고 바닥에 튀게 함.
- 공-펠트 머티리얼이 적용되어 적당한 반발 후 정지하는지 확인.

### 진입 조건
- 공이 떨어져 바닥에 부딪히고 몇 번 튕긴 뒤 정지 (sleep 진입).
- 60fps 유지, 콘솔 에러 없음.
- 이 단계가 완료되면 Stage 3에서 실제 당구대 지오메트리로 평면을 교체.

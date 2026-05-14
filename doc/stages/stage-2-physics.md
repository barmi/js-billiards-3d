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

### 결정사항
- 카메라 초기 위치를 (0.6, 0.45, 0.6)로 당김 — 공이 작아서(57mm) 멀면 보이지 않음.
- 공 댐핑: linearDamping=0.4, angularDamping=0.4. 굴림이 점진적으로 멈추는 자연스러운 거동 확보. 실제 펠트 환경에 맞추는 정밀 튜닝은 Stage 3 종료 후로 보류.
- 공 머티리얼은 [src/js/config.js](../../src/js/config.js)의 `BALL.RADIUS`, `BALL.MASS` 사용 — 모든 곳에서 일관.

### 변경 요약
- [src/js/main.js](../../src/js/main.js):
  - 임시 큐브 제거.
  - `spawnBall(x, y, z, color)` 헬퍼로 공 메시+바디 동시 생성, `physics.addDynamic` 등록.
  - 세 공(흰/빨강/노랑) 낙하 + 빨강에 초기 속도 부여로 굴림 확인.
- 시각 바닥 색상을 펠트 그린(`0x1f6f3a`)으로 변경.

### 검증
- 공들이 떨어져 바닥에 정착, 빨강은 약간 굴러간 뒤 정지.
- 콘솔 에러 없음. 시각·물리 동기화 정상.

→ **Stage 2 완료.** Stage 3 진입 — 실제 당구대 지오메트리로 평면 교체.

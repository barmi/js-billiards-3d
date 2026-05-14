# Stage 8 — 핵심 버그 수정 (터널링, 즉응성)

> 사용자 보고:
> - "공이 튕겨져서 테이블 밖으로 나가는 경우가 있고, 흰 공도 테이블 경계를 뚫고 밖으로 나가는 경우가 있음"
> - "공을 치고 난 이후에 정리까지 너무 오래 걸림"

## Phase 분해

- **Phase 8.1**: 공 터널링 / 쿠션 관통 수정. 빠르게 움직이는 공이 쿠션 박스 콜라이더를 뚫는 문제.
- **Phase 8.2**: 샷 후 정지/정리 빠르게. 댐핑·휴식 임계값 튜닝, 포켓 즉시 처리.

---

## Phase 8.1 — 터널링 수정

### 원인 분석
- cannon-es 기본은 이산 충돌(`discrete collision detection`). 한 스텝에 공이 이동하는 거리가 콜라이더 두께보다 크면 그대로 통과.
- 현재 설정:
  - `PHYSICS.TIMESTEP = 1/60` → 16.7ms
  - 풀 파워 샷 8 m/s × 16.7ms = **0.133 m/스텝**
  - 쿠션 박스 `CUSHION_DEPTH = 0.04 m` ≪ 0.133 m → **터널링 확정 발생**
  - `MAX_SUBSTEPS = 4`: 한 프레임 dt가 길어도 최대 4스텝(=66.7ms 분량). 실시간 60fps에선 보통 1 substep만 돔.

### 해결 전략 (3중 방어)
1. **물리 timestep을 1/240으로 축소**. 한 스텝에 공이 8 m/s × 4.17ms = **0.033 m** 이동 → 쿠션 두께 0.04m 미만이므로 1스텝 안에 충돌 감지 가능.
2. **쿠션 콜라이더를 외측으로 두껍게**. 시각 메시는 그대로(`CUSHION_DEPTH=0.04`), 콜라이더 깊이만 0.3m로 확장. 박스의 정면은 여전히 z=±H/2에 있고, 뒤로(외측으로) 두꺼움 → 만약 1스텝에 뚫고 들어가도 다음 스텝에서 콜라이더 내부에 갇혀 정상적으로 반발.
3. **공에 CCD 활성화**. `body.ccdSpeedThreshold = 0.5`, `body.ccdSweptSphereRadius = R`. cannon-es의 continuous collision detection이 빠른 공에 적용됨.

### MAX_SUBSTEPS 조정
- timestep 1/240 + dt 16.7ms(60fps) → 16.7/4.17 ≈ 4 substep/frame. `MAX_SUBSTEPS=8`로 여유.

### 검증 계획
- 8 m/s 풀파워 샷을 여러 방향(+x, -x, +z, -z, 대각)으로 발사.
- 모든 객체구 + 큐볼이 콜라이더 내부에 머무는지 확인 (y=0 평면 위, |x|<W/2, |z|<H/2).
- 30초 시뮬레이션 후 정지 시점 위치 검증.
- 콘솔 에러/경고 없음.

### 변경 요약
- [src/js/config.js](../../src/js/config.js): `TIMESTEP=1/240`, `MAX_SUBSTEPS=8`, `REST_VELOCITY=0.03`, `CUSHION_COLLIDER_DEPTH=0.30`, `CCD_SPEED_THRESHOLD=0.5` 추가.
- [src/js/objects/Table.js](../../src/js/objects/Table.js): `addPhysics`에서 쿠션 콜라이더를 외측으로만 0.3m 두껍게 + 안전망 벽 4개(쿠션 외측 0.5m).
- [src/js/objects/Ball.js](../../src/js/objects/Ball.js): `body.ccdSpeedThreshold`, `ccdSweptSphereRadius` 셋업.

### 검증 결과
- 12 m/s 직선 -x 풀파워: 큐볼 최저 x = -1.064 (콜라이더 인 면 -1.27 너머 통과 안 함). 정상 반사.
- 14 m/s 대각선 (-10, 0, +10) 풀파워: 모든 공 `|x|≤W/2 && |z|≤H/2`. **터널링 0건**.
- 코너 방향 (8, 0, -4): 모든 공 0 OOB. **터널링 0건**.

→ Phase 8.2 진입 — 잔류 운동/즉응성 개선.

---

## Phase 8.2 — 즉응성 (샷 → 다음 샷까지)

### 원인 분석
현재 흐름:
1. 샷 발사 → 공 산란
2. `handlePocketing`: 매 프레임 6 포켓 내 진입 검사. 진입 시 `sink()` (downward velocity) + **setTimeout 350ms** 후 메시·바디 제거.
3. `physics.isAllAtRest()`: 모든 동적 바디의 속도가 `REST_VELOCITY=0.01 m/s` 미만이거나 sleeping 상태.
4. 모든 공 정지 → `game.resolveShot()`.

지연 요인:
- **350ms 가라앉음 애니메이션** (포켓당). 6개 포켓 시 합산 의미는 없지만 마지막 공이 350ms 지연됨.
- **느린 정지**: `linearDamping=0.35`, `angularDamping=0.35`. 8 m/s 공이 0.01 m/s까지 떨어지려면 ln(8/0.01)/0.35 ≈ **19초**(!). 실제로는 충돌로 더 빠르지만 마지막 공의 잔류 운동이 오래 감.
- **REST_VELOCITY=0.01 m/s**가 너무 낮음 — 거의 보이지 않는 속도까지 기다림.

### 해결 전략
1. **포켓 처리 즉시화**: `sink()` 후 setTimeout 80ms로 단축 (시각적으로 빨려 들어가는 느낌만 남기고).
2. **댐핑 강화**: linearDamping/angularDamping 0.35 → 0.55. 펠트 위 공이 더 빨리 멈춤.
3. **REST_VELOCITY 상향**: 0.01 → 0.03 m/s. 더 일찍 "정지"로 판정.
4. **강제 스냅**: 공이 REST_VELOCITY×3 미만으로 떨어지면 `sleep()` 호출 → 다음 step에서 정지 확정.
5. **타임아웃**: 샷 후 5초 경과해도 모든 공이 정지하지 않으면 강제 resolveShot. 안전망.

### 검증 계획
- 풀파워 브레이크 후 모든 공이 정지하기까지 시간 측정 (목표 ≤ 4초).
- 포켓당 시각적 위화감(공이 사라지는 동작) 검증.
- 안전 타임아웃이 정상 케이스에서 발동하지 않는지 확인.

### 변경 요약
- [src/js/config.js](../../src/js/config.js):
  - `REST_ANGULAR=1.0`, `REST_SNAP_ANGULAR=2.0` 추가 (각속도 임계 분리)
  - `REST_SNAP_VELOCITY=0.15`, `BALL_LINEAR_DAMPING=0.70`, `BALL_ANGULAR_DAMPING=0.70`
  - `SHOT_SAFETY_TIMEOUT=4.0`
- [src/js/objects/Ball.js](../../src/js/objects/Ball.js): config 댐핑 값 사용, `sleepTimeLimit=0.25` (빠른 sleep).
- [src/js/physics/PhysicsWorld.js](../../src/js/physics/PhysicsWorld.js):
  - `step()`에 스냅 로직 — v² < snapV² && ω² < snapW² 면 v=ω=0 + sleep
  - `isAllAtRest()`에 각속도 임계 분리 적용
- [src/js/main.js](../../src/js/main.js):
  - 포켓 sink 후 제거 setTimeout 350ms → 80ms
  - SHOT_SAFETY_TIMEOUT 초과 시 강제 정지 후 resolveShot

### 검증 결과 (자동)
- 풀파워 8 m/s 브레이크 후 정지 시간: **5.08s → 2.80s** (각속도 임계 추가가 결정적)
- 안전 타임아웃 4초 안에 자연 정지 ✓
- 포켓된 공 즉시 제거 (80ms 짧은 가라앉음 애니 후)

→ **Stage 8 완료.** Stage 9(스핀/타격점) 진입.

# Stage 5 — 8볼 규칙

목표: 2인 8볼 풀의 핵심 룰(턴, 그룹 할당, 합법적 샷, 파울, 승리/패배)을 구현해 실제 플레이 가능한 게임으로.

## Phase 분해

- **Phase 5.1**: 게임 상태 머신 + 턴 관리 + 큐볼 스크래치 시 재배치. 그룹/규칙은 후속 phase.
- **Phase 5.2**: 첫 콘택트·레일 콘택트 추적, 그룹 할당, 합법적 샷 판정.
- **Phase 5.3**: 8볼 처리 (조기 포켓 = 패배, 그룹 클리어 후 8볼 = 승리), 파울 시 ball-in-hand.

## 규칙 단순화

- BCA 규칙 기반이지만 단순화. 분 규칙(예: ball-in-hand 위치 제한)은 최소 구현.
- 브레이크 샷에서 그룹 미할당. 첫 비-브레이크 샷에서 솔리드/스트라이프를 합법적으로 포켓하면 그 그룹이 슈터의 그룹이 됨.

---

## Phase 5.1 — 상태 머신 + 턴 관리 + 스크래치 재배치

### 결정사항
- 상태 enum:
  - `WAITING_FOR_BREAK` — 게임 시작, 첫 샷 대기
  - `SHOT_IN_PROGRESS` — 공이 움직이는 중
  - `WAITING_FOR_SHOT` — 일반 샷 대기
  - `GAME_OVER` — 종료
- 플레이어: 1, 2. 매 턴 슛 후 결과에 따라 유지/패스.
- Phase 5.1 단순 룰 (그룹 무시):
  - 큐볼 스크래치 → 턴 패스 + 큐볼 헤드 스팟 재배치
  - 객체구 1개 이상 포켓 + 스크래치 없음 → 턴 유지
  - 그 외 → 턴 패스
- 큐볼 처리: 포켓되면 `pocketed=true` + 빠른 가라앉음 + 350ms 후 화면 아래로 이동(`y=-2`)하여 sleep. 샷 종료 시 헤드 스팟에 재배치(`visible=true`, `position=headSpot`).
- 샷 종료 감지: `game.state === SHOT_IN_PROGRESS && physics.isAllAtRest()` → `game.resolveShot()`.
- HUD: 현재 턴 + 각 플레이어가 포켓한 공 번호 리스트.

### 변경 요약 (예정)
- 신규: `src/js/game/Game.js`, `src/js/ui/GameHUD.js`.
- `src/js/main.js`: 스크래치 처리(park-and-respawn) + game 인스턴스화 + `onShotFired`/`onBallPocketed`/`resolveShot` 와이어업.
- `src/css/style.css`: `.game-hud` 패널.

### 진입 조건
- 샷 후 적절히 턴이 패스/유지됨. 큐볼 스크래치 시 헤드 스팟에 재배치되어 다음 샷 가능.

---

## Phase 5.2 — 그룹 할당 + 합법적 샷

### 결정사항
- 콘택트 추적: `physics.world.addEventListener('beginContact', ...)`로 ball-ball, ball-cushion 콘택트를 `game.trackContact(bodyA, bodyB)`로 전달.
- `_shotFirstContact`: 큐볼이 처음 친 객체구. 한 번만 설정.
- `_railHitAfterContact`: 첫 ball-ball 콘택트 이후 공-쿠션 접촉이 있었는가.
- 그룹 할당: 브레이크가 아닌 첫 비-파울 객체구 포켓 시점. 슈터에게 그 공의 그룹을, 상대에겐 반대 그룹 자동 할당. 8볼은 그룹 할당에 영향 없음.
- 파울 판정 (브레이크 외 일반 샷):
  - 큐볼 스크래치
  - `_shotFirstContact === null` (어떤 공도 못 침)
  - 자기 그룹 할당된 후 다른 그룹을 먼저 침
  - open table에서 8볼을 먼저 침
  - 객체구 포켓도 없고 첫 콘택트 후 쿠션도 안 닿음
- 브레이크 파울: 어떤 공도 못 침 (간소 룰; BCA의 "4개 이상 쿠션 닿거나 1개 포켓" 정밀 규정은 생략).
- HUD에 그룹 배지(P1/P2 옆 S/St) + 최근 샷 요약 문구 추가.

### 변경 요약
- [src/js/game/Game.js](../../src/js/game/Game.js): Group enum, `playerGroups`, `_shotFirstContact`, `_railHitAfterContact`, `trackContact()`, 파울 판정 및 그룹 할당 로직, resolveShot summary 객체 반환.
- [src/js/ui/GameHUD.js](../../src/js/ui/GameHUD.js): 그룹 배지(S/St), 이벤트 메시지 행. `showShotSummary(summary)` 메서드.
- [src/js/main.js](../../src/js/main.js): Game 생성자에 `table` 전달, `physics.world.beginContact` → `game.trackContact` 와이어업.
- [src/css/style.css](../../src/css/style.css): `.group-badge`, `.event-row` 스타일.

### 검증 (시뮬레이션)
- 브레이크 후 정렬된 카메라로 풀파워 샷 → "Break · Turn passed" (콘택트 정상, 포켓 없음).
- P2가 ball 1(solid) 포켓 → `playerGroups = {1: stripe, 2: solid}`, P2가 ball 1 스코어 보유, 턴 유지.
- P2가 ball 9(stripe) 우선 콘택트 → "Foul: wrong group · Turn passed".

→ Phase 5.3 진입.

---

## Phase 5.3 — 8볼 승리/패배 + 게임 종료

### 결정사항
- `_hadClearedAtStart`: 샷 시작 시점에 자기 그룹 클리어 여부 스냅샷. 이게 8볼 적법 타격의 기준.
- 그룹 클리어 후: 8볼을 먼저 쳐야 함. 다른 공 먼저 치면 `must hit 8 first` 파울.
- 8볼 포켓 결과:
  - `_hadClearedAtStart === true && !foul` → 슈터 승
  - 그 외(미클리어, 스크래치 동반, 그룹 외 공을 먼저 치고 8 포켓 등) → 슈터 패
- 브레이크 샷에서 8볼 포켓도 패로 처리(open table이지만 그룹 미클리어 상태). BCA의 re-rack 옵션은 단순화로 생략.
- ball-in-hand: 스크래치 시 헤드 스팟 재배치(기존 5.1 유지). 다른 파울에서는 큐볼이 멈춘 자리에서 다음 샷 — 캐주얼 룰.
- 게임 종료: `state = GAME_OVER`. HUD 위에 풀스크린 반투명 오버레이 + Game Over 카드 + New Game 버튼. New Game = `location.reload()`로 깨끗한 재시작.

### 변경 요약
- [src/js/game/Game.js](../../src/js/game/Game.js):
  - `winner`, `_hadClearedAtStart` 추가
  - `_hasClearedGroup(player)` 헬퍼
  - resolveShot에 8볼 적법 타격 + 승/패 판정 + GAME_OVER 전이
  - summary에 `eightPocketed`, `winner` 필드 포함
- [src/js/ui/GameHUD.js](../../src/js/ui/GameHUD.js): Game Over 오버레이 + New Game 버튼.
- [src/js/main.js](../../src/js/main.js): GameHUD 생성 시 `onNewGame: () => location.reload()`.
- [src/css/style.css](../../src/css/style.css): `.game-over-overlay`, `.new-game-btn` 스타일.

### 검증 (시뮬레이션)
- 브레이크에서 ball 8 포켓 → state=GAME_OVER, winner=P2 (P1이 8볼을 그룹 클리어 전 포켓 = 패).
- 오버레이 표시(Game Over / Player 2 wins / New Game) 확인.
- `location.reload()`로 게임 리셋 가능.

→ **Stage 5 완료.** Stage 6(UI/UX) 진입.

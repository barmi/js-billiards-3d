// 8볼 풀 게임 상태 머신 + 턴/스코어.
// Phase 5.1에서는 그룹/8볼 규칙은 미구현 — 단순 턴 패스만:
//   - 큐볼 스크래치 → 턴 패스 + 큐볼 재배치
//   - 객체구 포켓 + 스크래치 없음 → 턴 유지
//   - 그 외 → 턴 패스

export const GameState = {
  WAITING_FOR_BREAK:  'waiting_for_break',
  SHOT_IN_PROGRESS:   'shot_in_progress',
  WAITING_FOR_SHOT:   'waiting_for_shot',
  GAME_OVER:          'game_over',
};

export class Game {
  // hooks: { onCueRespawn(), onResolve(game) }
  constructor({ cueBall, balls, hooks = {} }) {
    this.cueBall = cueBall;
    this.balls = balls;
    this.hooks = hooks;

    this.state = GameState.WAITING_FOR_BREAK;
    this.currentPlayer = 1; // 1 또는 2
    this.scores = { 1: [], 2: [] }; // 각 플레이어가 포켓한 공 번호 배열

    this._shotPocketed = [];
    this._shotCueScratched = false;
  }

  isPlayable() {
    return this.state === GameState.WAITING_FOR_BREAK
        || this.state === GameState.WAITING_FOR_SHOT;
  }

  onShotFired() {
    this._shotPocketed = [];
    this._shotCueScratched = false;
    this.state = GameState.SHOT_IN_PROGRESS;
  }

  onBallPocketed(ball) {
    this._shotPocketed.push(ball);
    if (ball === this.cueBall) this._shotCueScratched = true;
  }

  // 모든 공이 정지한 시점에 호출.
  resolveShot() {
    if (this.state !== GameState.SHOT_IN_PROGRESS) return;

    const objectBalls = this._shotPocketed.filter((b) => b !== this.cueBall);
    const pocketedObjects = objectBalls.length > 0;

    // 객체구 점수 누적 (Phase 5.1은 그룹 무시, 단순 카운트).
    for (const b of objectBalls) {
      this.scores[this.currentPlayer].push(b.number);
    }

    if (this._shotCueScratched && this.hooks.onCueRespawn) {
      this.hooks.onCueRespawn();
    }

    const turnPass = !pocketedObjects || this._shotCueScratched;
    if (turnPass) {
      this.currentPlayer = this.currentPlayer === 1 ? 2 : 1;
    }

    this.state = GameState.WAITING_FOR_SHOT;
    if (this.hooks.onResolve) this.hooks.onResolve(this);
  }
}

// 8볼 풀 게임 상태 머신 + 턴/스코어 + 그룹 할당 + 합법 샷 판정.
//
// 콘택트 추적: PhysicsWorld의 beginContact 이벤트를 main.js에서 받아
// `game.trackContact(bodyA, bodyB)`로 전달. 첫 ball-ball 콘택트(큐 포함)와
// 첫 콘택트 이후의 ball-cushion 콘택트를 기록.

import { BallGroup, ballGroupFor } from '../objects/Ball.js';

export const GameState = {
  WAITING_FOR_BREAK:  'waiting_for_break',
  SHOT_IN_PROGRESS:   'shot_in_progress',
  WAITING_FOR_SHOT:   'waiting_for_shot',
  BALL_IN_HAND:       'ball_in_hand',
  GAME_OVER:          'game_over',
};

// Player group: 'solid' / 'stripe' / null(미할당, "open table")
export const Group = {
  SOLID:  'solid',
  STRIPE: 'stripe',
};

export class Game {
  // hooks: { onCueRespawn(), onResolve(game, summary) }
  // table: Table 인스턴스 (cushionBodies 식별용)
  constructor({ cueBall, balls, table, hooks = {} }) {
    this.cueBall = cueBall;
    this.balls = balls;
    this.table = table;
    this.hooks = hooks;

    this.state = GameState.WAITING_FOR_BREAK;
    this.currentPlayer = 1;
    this.scores = { 1: [], 2: [] };
    // 미할당이면 null. 한 명이 할당되면 다른 한 명도 자동으로 반대 그룹.
    this.playerGroups = { 1: null, 2: null };

    this.winner = null;

    this._isFirstShotEver = true;
    this._currentShotIsBreak = false;
    this._shotPocketed = [];
    this._shotCueScratched = false;
    this._shotFirstContact = null;     // 큐볼이 처음 친 객체구
    this._railHitAfterContact = false; // 첫 콘택트 후 어떤 공이 쿠션에 닿았는가
    this._hadClearedAtStart = false;   // 샷 시작 시점에 자기 그룹을 다 비웠는가
  }

  isPlayable() {
    return this.state === GameState.WAITING_FOR_BREAK
        || this.state === GameState.WAITING_FOR_SHOT;
  }

  // Ball-in-hand 배치 확정 → 정상 샷 대기 상태로 전이.
  confirmBallPlacement() {
    if (this.state !== GameState.BALL_IN_HAND) return;
    this.state = GameState.WAITING_FOR_SHOT;
    if (this.hooks.onResolve) this.hooks.onResolve(this, null);
  }

  groupOf(player) { return this.playerGroups[player]; }

  onShotFired() {
    this._shotPocketed = [];
    this._shotCueScratched = false;
    this._shotFirstContact = null;
    this._railHitAfterContact = false;
    this._currentShotIsBreak = this._isFirstShotEver;
    this._hadClearedAtStart = this._hasClearedGroup(this.currentPlayer);
    this._isFirstShotEver = false;
    this.state = GameState.SHOT_IN_PROGRESS;
  }

  // 현재 시점에 player가 자기 그룹의 객체구를 모두 포켓했는가.
  _hasClearedGroup(player) {
    const g = this.playerGroups[player];
    if (!g) return false;
    return !this.balls.some((b) => {
      if (b === this.cueBall) return false;
      if (b.pocketed) return false;
      if (b.number === 8) return false;
      return this._groupKey(b) === g;
    });
  }

  onBallPocketed(ball) {
    this._shotPocketed.push(ball);
    if (ball === this.cueBall) this._shotCueScratched = true;
  }

  // bodyA/B: CANNON.Body. main.js의 beginContact 리스너에서 전달.
  trackContact(bodyA, bodyB) {
    if (this.state !== GameState.SHOT_IN_PROGRESS) return;
    const ballA = this._ballOf(bodyA);
    const ballB = this._ballOf(bodyB);

    // 첫 ball-ball 콘택트 (큐볼 포함, 큐-쿠션 제외).
    if (!this._shotFirstContact && ballA && ballB) {
      if (ballA === this.cueBall && ballB !== this.cueBall) {
        this._shotFirstContact = ballB;
      } else if (ballB === this.cueBall && ballA !== this.cueBall) {
        this._shotFirstContact = ballA;
      }
    }

    // 첫 콘택트 이후 공-쿠션 콘택트 (어떤 공이라도).
    if (this._shotFirstContact && !this._railHitAfterContact) {
      const cushA = this.table.cushionBodies.includes(bodyA);
      const cushB = this.table.cushionBodies.includes(bodyB);
      if ((ballA && cushB) || (ballB && cushA)) {
        this._railHitAfterContact = true;
      }
    }
  }

  _ballOf(body) {
    for (const b of this.balls) {
      if (b.body === body) return b;
    }
    return null;
  }

  // 그룹 키 매핑: BallGroup → 'solid'/'stripe'/null.
  _groupKey(ball) {
    const k = ballGroupFor(ball.number);
    if (k === BallGroup.SOLID) return Group.SOLID;
    if (k === BallGroup.STRIPE) return Group.STRIPE;
    return null; // CUE 또는 EIGHT
  }

  // 모든 공이 정지한 시점에 호출.
  resolveShot() {
    if (this.state !== GameState.SHOT_IN_PROGRESS) return;

    const wasBreak = this._currentShotIsBreak;
    const pocketed = this._shotPocketed;
    const objectBalls = pocketed.filter((b) => b !== this.cueBall);

    // 파울 판정.
    const fouls = [];
    if (this._shotCueScratched) fouls.push('scratch');

    if (!wasBreak) {
      if (!this._shotFirstContact) {
        fouls.push('no contact');
      } else {
        const myGroup = this.playerGroups[this.currentPlayer];
        const hitKey = this._groupKey(this._shotFirstContact);
        const hitEight = this._shotFirstContact.number === 8;
        if (myGroup) {
          // 그룹 할당됨.
          if (this._hadClearedAtStart) {
            // 그룹 클리어 상태 — 8볼을 먼저 쳐야 함.
            if (!hitEight) fouls.push('must hit 8 first');
          } else {
            // 그룹 클리어 전 — 자기 그룹을 먼저 쳐야 함. 8볼 우선타격 금지.
            if (hitKey !== myGroup) fouls.push('wrong group');
          }
        } else {
          // open table: 8볼 먼저 치면 파울.
          if (hitEight) fouls.push('hit eight first');
        }
      }
      // 레일 규칙: 공이 포켓되거나, 첫 콘택트 후 쿠션에 닿아야 함.
      if (fouls.length === 0 && objectBalls.length === 0 && !this._railHitAfterContact) {
        fouls.push('no rail after contact');
      }
    } else {
      // 브레이크: 어떤 공이라도 친 적이 있어야 함.
      if (!this._shotFirstContact) fouls.push('no contact on break');
    }

    const foul = fouls.length > 0;

    // 그룹 할당 (브레이크가 아닌 첫 합법적 포켓에서).
    if (!foul && !wasBreak && this.playerGroups[1] === null) {
      const legalObject = objectBalls.find((b) => b.number !== 8);
      if (legalObject) {
        const g = this._groupKey(legalObject);
        const other = this.currentPlayer === 1 ? 2 : 1;
        this.playerGroups[this.currentPlayer] = g;
        this.playerGroups[other] = g === Group.SOLID ? Group.STRIPE : Group.SOLID;
      }
    }

    // 점수 누적 (단순: 슈터에게 그가 친 모든 객체구 부여).
    // 5.3에서 8볼 처리 추가.
    for (const b of objectBalls) {
      this.scores[this.currentPlayer].push(b.number);
    }

    // 큐볼 재배치 (스크래치 시).
    if (this._shotCueScratched && this.hooks.onCueRespawn) {
      this.hooks.onCueRespawn();
    }

    // 8볼 처리 — 게임 종료 판정.
    const eightPocketed = pocketed.some((b) => b.number === 8);
    let gameEnded = false;
    let winner = null;
    if (eightPocketed) {
      const shooter = this.currentPlayer;
      const other = shooter === 1 ? 2 : 1;
      // 합법: 샷 시작 시점에 그룹 클리어 + 무파울 → 슈터 승.
      if (this._hadClearedAtStart && !foul) {
        winner = shooter;
      } else {
        // 그룹 미클리어 OR 파울(스크래치 등) → 슈터 패.
        winner = other;
      }
      this.winner = winner;
      this.state = GameState.GAME_OVER;
      gameEnded = true;
    }

    // 턴 유지/패스 (게임 종료가 아닐 때).
    let turnPass = false;
    if (!gameEnded) {
      const legalPocketed = !foul && objectBalls.some((b) => b.number !== 8);
      turnPass = foul || !legalPocketed;
      if (turnPass) {
        this.currentPlayer = this.currentPlayer === 1 ? 2 : 1;
      }
      // 파울이면 ball-in-hand, 아니면 일반 샷 대기.
      this.state = foul ? GameState.BALL_IN_HAND : GameState.WAITING_FOR_SHOT;
    }

    const summary = {
      wasBreak,
      pocketed: objectBalls.map((b) => b.number),
      eightPocketed,
      firstContact: this._shotFirstContact ? this._shotFirstContact.number : null,
      cueScratched: this._shotCueScratched,
      railAfterContact: this._railHitAfterContact,
      foul,
      fouls,
      turnPassed: turnPass,
      winner,
    };
    if (this.hooks.onResolve) this.hooks.onResolve(this, summary);
  }
}

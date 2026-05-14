// 게임 HUD — 현재 턴, 각 플레이어가 포켓한 공.
export class GameHUD {
  constructor(container) {
    const el = document.createElement('div');
    el.className = 'panel game-hud';
    el.innerHTML = `
      <div class="row turn-row">
        <span class="label">Turn:</span>
        <span class="player p1">P1</span>
        <span class="player p2">P2</span>
      </div>
      <div class="row score-row"><span class="label">P1 pocketed:</span> <span class="score p1-score">—</span></div>
      <div class="row score-row"><span class="label">P2 pocketed:</span> <span class="score p2-score">—</span></div>
    `;
    container.appendChild(el);

    this.el = el;
    this.p1Pill = el.querySelector('.player.p1');
    this.p2Pill = el.querySelector('.player.p2');
    this.p1Score = el.querySelector('.p1-score');
    this.p2Score = el.querySelector('.p2-score');
  }

  update(game) {
    this.p1Pill.classList.toggle('active', game.currentPlayer === 1);
    this.p2Pill.classList.toggle('active', game.currentPlayer === 2);
    this.p1Score.textContent = game.scores[1].length ? game.scores[1].join(' · ') : '—';
    this.p2Score.textContent = game.scores[2].length ? game.scores[2].join(' · ') : '—';
  }

  flash(message) {
    // Phase 5.3에서 사용 예정 (파울/승리 메시지).
  }
}

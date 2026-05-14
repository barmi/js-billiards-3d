// 게임 HUD — 현재 턴, 각 플레이어가 포켓한 공, 그룹 배지, 최근 샷 요약.
export class GameHUD {
  constructor(container) {
    const el = document.createElement('div');
    el.className = 'panel game-hud';
    el.innerHTML = `
      <div class="row turn-row">
        <span class="label">Turn:</span>
        <span class="player p1">P1<span class="group-badge"></span></span>
        <span class="player p2">P2<span class="group-badge"></span></span>
      </div>
      <div class="row score-row"><span class="label">P1:</span> <span class="score p1-score">—</span></div>
      <div class="row score-row"><span class="label">P2:</span> <span class="score p2-score">—</span></div>
      <div class="row event-row"><span class="event-text"></span></div>
    `;
    container.appendChild(el);

    this.el = el;
    this.p1Pill = el.querySelector('.player.p1');
    this.p2Pill = el.querySelector('.player.p2');
    this.p1Badge = this.p1Pill.querySelector('.group-badge');
    this.p2Badge = this.p2Pill.querySelector('.group-badge');
    this.p1Score = el.querySelector('.p1-score');
    this.p2Score = el.querySelector('.p2-score');
    this.eventText = el.querySelector('.event-text');
  }

  update(game) {
    this.p1Pill.classList.toggle('active', game.currentPlayer === 1);
    this.p2Pill.classList.toggle('active', game.currentPlayer === 2);
    this._setBadge(this.p1Badge, game.groupOf(1));
    this._setBadge(this.p2Badge, game.groupOf(2));
    this.p1Score.textContent = game.scores[1].length ? game.scores[1].join(' · ') : '—';
    this.p2Score.textContent = game.scores[2].length ? game.scores[2].join(' · ') : '—';
  }

  _setBadge(badgeEl, group) {
    badgeEl.classList.remove('solid', 'stripe');
    if (group === 'solid')   { badgeEl.textContent = 'S'; badgeEl.classList.add('solid'); }
    else if (group === 'stripe') { badgeEl.textContent = 'St'; badgeEl.classList.add('stripe'); }
    else                         { badgeEl.textContent = ''; }
  }

  // 최근 샷 결과 요약을 짧게 표시.
  showShotSummary(summary) {
    if (!summary) { this.eventText.textContent = ''; return; }
    const parts = [];
    if (summary.wasBreak) parts.push('Break');
    if (summary.pocketed.length) parts.push(`Pocketed ${summary.pocketed.join(',')}`);
    if (summary.foul) parts.push(`Foul: ${summary.fouls.join(', ')}`);
    if (summary.turnPassed) parts.push('Turn passed');
    this.eventText.textContent = parts.join(' · ');
  }
}

// 큐볼 단면 타격점 선택 위젯.
//   - 화면 좌하단 원형 UI
//   - pointer 클릭/드래그로 타격 위치 선택, 원 바깥은 가장자리에 클램프
//   - getOffset(): { x: [-1,1], y: [-1,1] } — x=오른쪽 잉글리시, y=톱스핀
//   - reset(): 중심으로 복귀
//   - 'R' 키 단축으로 리셋
export class ImpactPicker {
  constructor(container) {
    const el = document.createElement('div');
    el.className = 'impact-picker';
    el.innerHTML = `
      <div class="impact-ball"></div>
      <div class="impact-cross-h"></div>
      <div class="impact-cross-v"></div>
      <div class="impact-dot"></div>
      <div class="impact-label">SPIN</div>
    `;
    container.appendChild(el);

    this.el = el;
    this.dot = el.querySelector('.impact-dot');
    this.offsetX = 0;
    this.offsetY = 0;

    const setFromPointer = (e) => {
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const r = Math.min(rect.width, rect.height) / 2 * 0.86;
      let dx = (e.clientX - cx) / r;
      let dy = (e.clientY - cy) / r;
      const d2 = dx * dx + dy * dy;
      if (d2 > 1) {
        const s = 1 / Math.sqrt(d2);
        dx *= s;
        dy *= s;
      }
      this.offsetX = dx;
      this.offsetY = -dy;
      this._render();
    };

    let dragging = false;
    el.addEventListener('pointerdown', (e) => {
      dragging = true;
      setFromPointer(e);
      e.preventDefault();
    });
    window.addEventListener('pointermove', (e) => {
      if (dragging) setFromPointer(e);
    });
    window.addEventListener('pointerup', () => { dragging = false; });
    window.addEventListener('pointercancel', () => { dragging = false; });

    window.addEventListener('keydown', (e) => {
      if (e.code === 'KeyR') this.reset();
    });

    this._render();
  }

  _render() {
    // 도트 위치: (offsetX, -offsetY)·radius를 중심에서 픽셀로.
    const radPct = 38; // 위젯 반지름 대비 도트 이동 가능 범위
    const x = 50 + this.offsetX * radPct;
    const y = 50 - this.offsetY * radPct;
    this.dot.style.left = `${x}%`;
    this.dot.style.top = `${y}%`;
  }

  reset() {
    this.offsetX = 0;
    this.offsetY = 0;
    this._render();
  }

  getOffset() {
    return { x: this.offsetX, y: this.offsetY };
  }
}

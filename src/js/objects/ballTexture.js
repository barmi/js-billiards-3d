import * as THREE from 'three';

// 절차적 풀볼 텍스처 (구 UV 매핑용).
// 캔버스 가로(u): 0~1 = 적도 한 바퀴. 가로 두 위치(u=0.25, 0.75)에 번호 → 어느 면이 카메라를 향해도 보임.
// 캔버스 세로(v): 0(아래)~1(위). 스트라이프의 경우 v∈[0.28, 0.72] 흰 띠, 양 끝 색.

const COLORS_HEX = {
  0:  '#f6f3ec',
  1:  '#f3d22b',
  2:  '#2147cf',
  3:  '#d92e1e',
  4:  '#6a2484',
  5:  '#e07f1f',
  6:  '#12723a',
  7:  '#6e0c1c',
  8:  '#111418',
  9:  '#f3d22b',
  10: '#2147cf',
  11: '#d92e1e',
  12: '#6a2484',
  13: '#e07f1f',
  14: '#12723a',
  15: '#6e0c1c',
};

const STRIPE_WHITE = '#f3eedf';

export function makeBallTexture(number) {
  const W = 512;
  const H = 256;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  const color = COLORS_HEX[number] ?? '#999999';

  if (number === 0) {
    ctx.fillStyle = STRIPE_WHITE;
    ctx.fillRect(0, 0, W, H);
  } else if (number > 8) {
    // 스트라이프: 양 극이 흰색, 적도 부근에 색 띠. (Aramith/표준 9-15번 형태)
    ctx.fillStyle = STRIPE_WHITE;
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = color;
    const bandStart = Math.floor(H * 0.30);
    const bandEnd = Math.floor(H * 0.70);
    ctx.fillRect(0, bandStart, W, bandEnd - bandStart);
  } else {
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, W, H);
  }

  // 번호 (큐볼 제외): u=0.25 와 u=0.75 두 위치에 번호. 어느 방향이든 한쪽이 보임.
  // 기본 카메라 거리(~2.85m)에서 공이 화면상 작게 보이므로 패치를 충분히 크게.
  if (number > 0) {
    const drawNumberAt = (uPercent) => {
      const cx = W * uPercent;
      const cy = H * 0.5;
      const r = Math.min(W, H) * 0.18;
      // 살짝 어두운 테두리 → 흰 공/스트라이프 배경 대비 강화.
      ctx.fillStyle = 'rgba(0,0,0,0.25)';
      ctx.beginPath();
      ctx.arc(cx, cy, r * 1.08, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#111111';
      ctx.font = `900 ${Math.floor(r * 1.35)}px system-ui, -apple-system, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(number), cx, cy + r * 0.04);
    };
    drawNumberAt(0.25);
    drawNumberAt(0.75);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  tex.needsUpdate = true;
  return tex;
}

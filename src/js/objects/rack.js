import { BALL, TABLE } from '../config.js';

// 표준 8볼 랙 배치 — 행별 공 번호.
// 행 0이 큐볼 쪽(apex), 행 4가 풋레일 쪽(뒤).
// 규칙: apex=1, 행 2 중앙=8, 뒤 모서리는 솔리드/스트라이프 1개씩.
const RACK_PATTERN = [
  [1],
  [2, 9],
  [3, 8, 10],
  [4, 11, 5, 12],
  [6, 13, 7, 14, 15],
];

// 풋 스팟: 풋레일에서 짧은 변 길이의 1/2 떨어진 곳 (= 테이블 길이의 1/4 지점, x = +W/4).
export function footSpot() {
  return { x: +TABLE.PLAY_WIDTH / 4, z: 0 };
}

// 헤드 스팟: 헤드레일에서 짧은 변 길이의 1/2 떨어진 곳 (x = -W/4).
export function headSpot() {
  return { x: -TABLE.PLAY_WIDTH / 4, z: 0 };
}

// 15개 객체구 랙 위치를 [{ number, x, z }] 배열로 반환.
// 행 간격은 sqrt(3)·R, 행 내 인접 공 간격은 2R (밀착). 약간의 간극 EPS를 더해 초기 침투 방지.
export function rackPositions() {
  const R = BALL.RADIUS;
  const EPS = R * 0.006; // 0.6% 간극
  const dx = Math.sqrt(3) * R + EPS;
  const dzHalf = R + EPS / 2;

  const apex = footSpot();
  const out = [];
  for (let row = 0; row < RACK_PATTERN.length; row++) {
    const numbers = RACK_PATTERN[row];
    const x = apex.x + row * dx;
    const startZ = -(numbers.length - 1) * dzHalf;
    for (let i = 0; i < numbers.length; i++) {
      out.push({ number: numbers[i], x, z: startZ + i * 2 * dzHalf });
    }
  }
  return out;
}

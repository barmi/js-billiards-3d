import * as THREE from 'three';

import { TABLE, BALL } from '../config.js';

// 조준 어시스트 라인 — 큐볼 중심에서 첫 충돌까지.
// 첫 충돌 후보:
//  1) 사각 플레이 경계 (x = ±W/2−r, z = ±H/2−r). 포켓 컷은 무시.
//  2) 시야 내 다른 공 (ray-sphere 교차, 두 공 중심 사이 거리 = 2R).
// 사용:
//   const line = new AimLine();
//   stage.add(line.line);
//   line.update(cueBallPos, aimDir, allObjectBalls);
//   line.setVisible(true);
export class AimLine {
  constructor() {
    const geo = new THREE.BufferGeometry();
    const mat = new THREE.LineBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.45,
    });
    this.line = new THREE.Line(geo, mat);
    this.line.frustumCulled = false;
    this.line.renderOrder = 5; // 펠트 위에 그려지도록 (펠트는 그림자 영향만)
  }

  setVisible(v) { this.line.visible = v; }

  // start: {x, z} (큐볼 위치). dir: {x, z} (정규화 조준 방향).
  // balls: 다른 공 목록(큐볼 제외, pocketed 제외).
  update(start, dir, balls) {
    const r = BALL.RADIUS;
    const W2 = TABLE.PLAY_WIDTH / 2;
    const H2 = TABLE.PLAY_HEIGHT / 2;

    // 1) 쿠션(경계) 교차 t.
    let tCushion = Infinity;
    if (dir.x > 1e-6)        tCushion = Math.min(tCushion, (W2 - r - start.x) / dir.x);
    else if (dir.x < -1e-6)  tCushion = Math.min(tCushion, (-W2 + r - start.x) / dir.x);
    if (dir.z > 1e-6)        tCushion = Math.min(tCushion, (H2 - r - start.z) / dir.z);
    else if (dir.z < -1e-6)  tCushion = Math.min(tCushion, (-H2 + r - start.z) / dir.z);

    // 2) 공-공 교차 (가장 가까운 t).
    let tBall = Infinity;
    const R2 = 2 * r;
    const R2sq = R2 * R2;
    for (const b of balls) {
      if (b.pocketed) continue;
      const px = b.body.position.x - start.x;
      const pz = b.body.position.z - start.z;
      const proj = px * dir.x + pz * dir.z;
      if (proj <= 0) continue; // 뒤쪽
      const perpSq = px * px + pz * pz - proj * proj;
      if (perpSq > R2sq) continue; // 빗나감
      const offset = Math.sqrt(R2sq - perpSq);
      const t = proj - offset;
      if (t > 0 && t < tBall) tBall = t;
    }

    const t = Math.min(tCushion, tBall);
    if (!isFinite(t) || t <= 0) {
      this.setVisible(false);
      return;
    }

    const end = {
      x: start.x + dir.x * t,
      z: start.z + dir.z * t,
    };
    const y = r;
    this.line.geometry.setFromPoints([
      new THREE.Vector3(start.x, y, start.z),
      new THREE.Vector3(end.x, y, end.z),
    ]);
  }
}

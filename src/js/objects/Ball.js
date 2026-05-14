import * as THREE from 'three';
import * as CANNON from 'cannon-es';

import { BALL, PHYSICS } from '../config.js';

export const BallGroup = {
  CUE: 'cue',
  SOLID: 'solid',
  STRIPE: 'stripe',
  EIGHT: 'eight',
};

// 표준 풀볼 색상 근사 (1~7 솔리드, 9~15 스트라이프는 동일 색).
const BALL_COLORS = {
  0:  0xf6f3ec,
  1:  0xf3d22b, // yellow
  2:  0x2147cf, // blue
  3:  0xd92e1e, // red
  4:  0x6a2484, // purple
  5:  0xe07f1f, // orange
  6:  0x12723a, // green
  7:  0x6e0c1c, // maroon
  8:  0x111418, // black
  9:  0xf3d22b,
  10: 0x2147cf,
  11: 0xd92e1e,
  12: 0x6a2484,
  13: 0xe07f1f,
  14: 0x12723a,
  15: 0x6e0c1c,
};

export function ballGroupFor(number) {
  if (number === 0) return BallGroup.CUE;
  if (number === 8) return BallGroup.EIGHT;
  return number <= 7 ? BallGroup.SOLID : BallGroup.STRIPE;
}

// 풀볼 1개 = three.js 메시 + cannon-es 바디. Phase 7에서 텍스처/번호 디자인 예정.
export class Ball {
  constructor(number, position, materials) {
    this.number = number;
    this.kind = ballGroupFor(number);
    this.pocketed = false;

    const color = BALL_COLORS[number] ?? 0xaaaaaa;
    const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.25, metalness: 0.05 });
    this.mesh = new THREE.Mesh(new THREE.SphereGeometry(BALL.RADIUS, 32, 16), mat);
    this.mesh.castShadow = true;
    this.mesh.receiveShadow = true;

    // 스트라이프: 적도 백색 띠 (오픈 실린더, 메시 자식으로 회전 추종).
    if (this.kind === BallGroup.STRIPE) {
      const bandHeight = BALL.RADIUS * 0.55;
      const r = BALL.RADIUS * 1.003;
      const bandGeo = new THREE.CylinderGeometry(r, r, bandHeight, 32, 1, true);
      const bandMat = new THREE.MeshStandardMaterial({ color: 0xf3eedf, roughness: 0.3 });
      const band = new THREE.Mesh(bandGeo, bandMat);
      band.castShadow = true;
      this.mesh.add(band);
    }

    this.body = new CANNON.Body({
      mass: BALL.MASS,
      shape: new CANNON.Sphere(BALL.RADIUS),
      material: materials.ball,
      position: new CANNON.Vec3(position.x, BALL.RADIUS, position.z),
      linearDamping: PHYSICS.BALL_LINEAR_DAMPING,
      angularDamping: PHYSICS.BALL_ANGULAR_DAMPING,
      allowSleep: true,
      sleepSpeedLimit: PHYSICS.REST_VELOCITY,
      sleepTimeLimit: 0.25,
    });
    // CCD: 빠른 공이 쿠션을 뚫고 나가지 않게.
    this.body.ccdSpeedThreshold = PHYSICS.CCD_SPEED_THRESHOLD;
    this.body.ccdSweptSphereRadius = BALL.RADIUS;
  }

  // 포켓 진입 시 호출 — 빨려 내려가는 가속.
  sink() {
    this.pocketed = true;
    this.body.velocity.set(0, -0.8, 0);
    this.body.angularVelocity.set(0, 0, 0);
  }
}

import * as THREE from 'three';
import * as CANNON from 'cannon-es';

import { BALL, PHYSICS } from '../config.js';
import { makeBallTexture } from './ballTexture.js';

export const BallGroup = {
  CUE: 'cue',
  SOLID: 'solid',
  STRIPE: 'stripe',
  EIGHT: 'eight',
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

    const texture = makeBallTexture(number);
    const mat = new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 0.22,
      metalness: 0.05,
    });
    this.mesh = new THREE.Mesh(new THREE.SphereGeometry(BALL.RADIUS, 32, 24), mat);
    this.mesh.castShadow = true;
    this.mesh.receiveShadow = true;

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

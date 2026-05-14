import * as THREE from 'three';

import { BALL } from '../config.js';

// 큐 스틱 — 큐볼을 가리키는 단일 메시.
// 모델: 끝(팁)이 메시 로컬 원점, 몸체가 로컬 -Z 방향으로 길이만큼 뻗음.
// 사용:
//   const stick = new CueStick();
//   stage.add(stick.mesh);
//   stick.aim(cueBallWorldPos, aimDirXZ);
//   stick.setVisible(true|false);
export class CueStick {
  constructor() {
    this.length = 1.4;
    this.tipRadius = 0.008;
    this.buttRadius = 0.024;
    this.gap = 0.005;   // 팁과 큐볼 사이 간격
    this.pullback = 0;  // 파워 충전용 후퇴 (Phase 4.2)

    // 원본: Y축 cylinder. rotateX(PI/2)로 +Y → +Z 회전. 이후 -length/2 translate로
    // 팁(작은 반지름)이 z=0, 몸체가 -Z 방향(-length까지)으로 뻗도록 정렬.
    const geo = new THREE.CylinderGeometry(this.tipRadius, this.buttRadius, this.length, 16);
    geo.rotateX(Math.PI / 2);
    geo.translate(0, 0, -this.length / 2);

    const mat = new THREE.MeshStandardMaterial({ color: 0x8b5a2b, roughness: 0.45, metalness: 0.05 });
    this.mesh = new THREE.Mesh(geo, mat);
    this.mesh.castShadow = true;
    this.mesh.receiveShadow = true;

    // 팁 끝(가죽 팁 시각화) — 작은 흰 캡.
    const tipCapGeo = new THREE.SphereGeometry(this.tipRadius * 0.95, 16, 8);
    const tipCapMat = new THREE.MeshStandardMaterial({ color: 0xe9dfc7, roughness: 0.6 });
    const tipCap = new THREE.Mesh(tipCapGeo, tipCapMat);
    tipCap.position.set(0, 0, 0);
    this.mesh.add(tipCap);
  }

  // cueBallPos: THREE.Vector3 (또는 {x,y,z}). aimDir: 정규화된 xz 방향 벡터.
  // 팁이 큐볼 표면 근처에 위치하고 몸체가 -aimDir 방향(=플레이어 쪽)으로 뻗음.
  aim(cueBallPos, aimDir) {
    const dir = new THREE.Vector3(aimDir.x, 0, aimDir.z).normalize();
    const offset = BALL.RADIUS + this.gap + this.pullback;
    this.mesh.position.set(
      cueBallPos.x - dir.x * offset,
      BALL.RADIUS,
      cueBallPos.z - dir.z * offset,
    );
    // three.js Object3D.lookAt는 카메라가 아닌 객체에서 로컬 +Z를 타겟 방향으로 정렬.
    // 우리는 로컬 -Z (=몸체)가 -dir(=플레이어 쪽) 방향을 향하길 원함 →
    // 로컬 +Z = +dir → lookAt(position + dir).
    this.mesh.lookAt(
      this.mesh.position.x + dir.x,
      this.mesh.position.y,
      this.mesh.position.z + dir.z,
    );
  }

  setVisible(v) {
    this.mesh.visible = v;
  }
}

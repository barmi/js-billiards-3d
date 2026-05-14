import * as THREE from 'three';
import * as CANNON from 'cannon-es';

import { TABLE, POCKET } from '../config.js';

const FELT_COLOR = 0x1f7a3e;
const RAIL_COLOR = 0x3b2516;
const CUSHION_COLOR = 0x186230;
const POCKET_COLOR = 0x05080a;

// 9피트 풀 테이블 — 시각 메시 + 물리 콜라이더.
// 좌표계: 베드 윗면이 y=0, 긴 변이 x, 짧은 변이 z.
// 사용:
//   const table = new Table();
//   stage.add(table.group);
//   table.addPhysics(physics);
//   if (table.isInPocket(body.position)) { ... }
export class Table {
  constructor() {
    this.group = new THREE.Group();
    this.cushionBodies = [];
    this.bedBody = null;

    // 포켓 중심 6개 — 코너 4 + 사이드 2.
    const W = TABLE.PLAY_WIDTH;
    const H = TABLE.PLAY_HEIGHT;
    this.pocketCenters = [
      new THREE.Vector3(-W / 2, 0, -H / 2),
      new THREE.Vector3(+W / 2, 0, -H / 2),
      new THREE.Vector3(-W / 2, 0, +H / 2),
      new THREE.Vector3(+W / 2, 0, +H / 2),
      new THREE.Vector3(0,      0, -H / 2),
      new THREE.Vector3(0,      0, +H / 2),
    ];

    this._buildBed();
    this._buildRails();
    this._buildCushions();
    this._buildPocketMarkers();
  }

  // 6개 쿠션 세그먼트 정의. 시각·물리에서 공유.
  // 반환: [{ w, h, d, x, y, z }] — w/d는 박스 가로/세로 크기, h는 높이.
  _cushionSegments() {
    const W = TABLE.PLAY_WIDTH;
    const H = TABLE.PLAY_HEIGHT;
    const CD = TABLE.CUSHION_DEPTH;
    const CH = TABLE.CUSHION_NOSE_HEIGHT;
    const cCut = TABLE.POCKET_CORNER_CUT;
    const sCut = TABLE.POCKET_SIDE_CUT;

    const longSegLen = W / 2 - cCut - sCut;
    const leftCenterX = (-W / 2 + cCut + -sCut) / 2;
    const rightCenterX = -leftCenterX;
    const shortSegLen = H - 2 * cCut;
    const y = CH / 2;

    return [
      // 긴 변 ( -z ), 두 조각
      { w: longSegLen, h: CH, d: CD, x: leftCenterX,  y, z: -(H / 2 + CD / 2) },
      { w: longSegLen, h: CH, d: CD, x: rightCenterX, y, z: -(H / 2 + CD / 2) },
      // 긴 변 ( +z ), 두 조각
      { w: longSegLen, h: CH, d: CD, x: leftCenterX,  y, z: +(H / 2 + CD / 2) },
      { w: longSegLen, h: CH, d: CD, x: rightCenterX, y, z: +(H / 2 + CD / 2) },
      // 짧은 변 ( -x ), 한 조각
      { w: CD, h: CH, d: shortSegLen, x: -(W / 2 + CD / 2), y, z: 0 },
      // 짧은 변 ( +x ), 한 조각
      { w: CD, h: CH, d: shortSegLen, x: +(W / 2 + CD / 2), y, z: 0 },
    ];
  }

  _buildBed() {
    const W = TABLE.PLAY_WIDTH;
    const H = TABLE.PLAY_HEIGHT;
    const t = TABLE.BED_THICKNESS;

    const bed = new THREE.Mesh(
      new THREE.PlaneGeometry(W, H),
      new THREE.MeshStandardMaterial({ color: FELT_COLOR, roughness: 0.95, metalness: 0.0 }),
    );
    bed.rotation.x = -Math.PI / 2;
    bed.receiveShadow = true;
    this.bed = bed;
    this.group.add(bed);

    // 슬레이트 두께를 얇게 시각화 (옆면).
    const sideMat = new THREE.MeshStandardMaterial({ color: 0x141a1f, roughness: 0.8 });
    const sideTop = new THREE.Mesh(new THREE.BoxGeometry(W, t, 0.005), sideMat);
    const sideBot = new THREE.Mesh(new THREE.BoxGeometry(W, t, 0.005), sideMat);
    const sideLeft = new THREE.Mesh(new THREE.BoxGeometry(0.005, t, H), sideMat);
    const sideRight = new THREE.Mesh(new THREE.BoxGeometry(0.005, t, H), sideMat);
    sideTop.position.set(0, -t / 2, -H / 2);
    sideBot.position.set(0, -t / 2, +H / 2);
    sideLeft.position.set(-W / 2, -t / 2, 0);
    sideRight.position.set(+W / 2, -t / 2, 0);
    [sideTop, sideBot, sideLeft, sideRight].forEach((m) => this.group.add(m));
  }

  _buildRails() {
    const W = TABLE.PLAY_WIDTH;
    const H = TABLE.PLAY_HEIGHT;
    const RW = TABLE.RAIL_WIDTH;
    const RH = TABLE.RAIL_HEIGHT;
    const CD = TABLE.CUSHION_DEPTH;
    const mat = new THREE.MeshStandardMaterial({ color: RAIL_COLOR, roughness: 0.55, metalness: 0.08 });
    const outerW = W + 2 * (CD + RW);
    const railY = RH / 2;

    const long = (z) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(outerW, RH, RW), mat);
      m.position.set(0, railY, z);
      m.castShadow = true;
      m.receiveShadow = true;
      this.group.add(m);
    };
    const short = (x) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(RW, RH, H + 2 * CD), mat);
      m.position.set(x, railY, 0);
      m.castShadow = true;
      m.receiveShadow = true;
      this.group.add(m);
    };
    long(-(H / 2 + CD + RW / 2));
    long(+(H / 2 + CD + RW / 2));
    short(-(W / 2 + CD + RW / 2));
    short(+(W / 2 + CD + RW / 2));
  }

  _buildCushions() {
    const mat = new THREE.MeshStandardMaterial({ color: CUSHION_COLOR, roughness: 0.85 });
    for (const s of this._cushionSegments()) {
      const m = new THREE.Mesh(new THREE.BoxGeometry(s.w, s.h, s.d), mat);
      m.position.set(s.x, s.y, s.z);
      m.castShadow = true;
      m.receiveShadow = true;
      this.group.add(m);
    }
  }

  _buildPocketMarkers() {
    const mat = new THREE.MeshStandardMaterial({ color: POCKET_COLOR, roughness: 0.4 });
    for (const c of this.pocketCenters) {
      const isCorner = Math.abs(c.x) > 0.01;
      const r = isCorner ? POCKET.CORNER_RADIUS : POCKET.SIDE_RADIUS;
      const disk = new THREE.Mesh(new THREE.CircleGeometry(r, 32), mat);
      disk.rotation.x = -Math.PI / 2;
      disk.position.set(c.x, 0.001, c.z);
      disk.receiveShadow = true;
      this.group.add(disk);
    }
  }

  // 베드 + 6 쿠션 바디를 물리 월드에 등록.
  addPhysics(physics) {
    // 베드: 무한 평면. 펠트 머티리얼.
    const bed = new CANNON.Body({
      mass: 0,
      shape: new CANNON.Plane(),
      material: physics.materials.felt,
    });
    bed.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
    physics.addStatic(bed);
    this.bedBody = bed;

    // 쿠션 6 조각. 박스 콜라이더, 쿠션 머티리얼.
    for (const s of this._cushionSegments()) {
      const body = new CANNON.Body({
        mass: 0,
        shape: new CANNON.Box(new CANNON.Vec3(s.w / 2, s.h / 2, s.d / 2)),
        material: physics.materials.cushion,
        position: new CANNON.Vec3(s.x, s.y, s.z),
      });
      physics.addStatic(body);
      this.cushionBodies.push(body);
    }
  }

  // 위치가 6개 포켓 중 어느 하나의 반경 안에 있는지.
  isInPocket(position) {
    for (const c of this.pocketCenters) {
      const dx = position.x - c.x;
      const dz = position.z - c.z;
      const isCorner = Math.abs(c.x) > 0.01;
      const r = isCorner ? POCKET.CORNER_RADIUS : POCKET.SIDE_RADIUS;
      if (dx * dx + dz * dz < r * r) return true;
    }
    return false;
  }
}

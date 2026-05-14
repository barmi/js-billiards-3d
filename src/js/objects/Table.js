import * as THREE from 'three';

import { TABLE, POCKET } from '../config.js';

const FELT_COLOR = 0x1f7a3e;
const RAIL_COLOR = 0x3b2516;
const CUSHION_COLOR = 0x186230;
const POCKET_COLOR = 0x05080a;

// 9피트 풀 테이블의 시각 모델.
// 좌표계: 베드 윗면이 y=0, 긴 변이 x, 짧은 변이 z.
// `table.group`을 씬에 추가. 물리 콜라이더는 Stage 3 Phase 3.2에서.
export class Table {
  constructor() {
    this.group = new THREE.Group();

    const W = TABLE.PLAY_WIDTH;
    const H = TABLE.PLAY_HEIGHT;
    const RW = TABLE.RAIL_WIDTH;
    const RH = TABLE.RAIL_HEIGHT;
    const CD = TABLE.CUSHION_DEPTH;
    const CH = TABLE.CUSHION_NOSE_HEIGHT;
    const cCut = TABLE.POCKET_CORNER_CUT;
    const sCut = TABLE.POCKET_SIDE_CUT;

    // 포켓 중심 좌표 — 6개. Stage 3 Phase 3.2/3에서 콜라이더/이벤트에 재사용.
    this.pocketCenters = [
      new THREE.Vector3(-W / 2, 0, -H / 2),
      new THREE.Vector3(+W / 2, 0, -H / 2),
      new THREE.Vector3(-W / 2, 0, +H / 2),
      new THREE.Vector3(+W / 2, 0, +H / 2),
      new THREE.Vector3(0,      0, -H / 2),
      new THREE.Vector3(0,      0, +H / 2),
    ];

    this._buildBed(W, H);
    this._buildRails(W, H, RW, RH, CD);
    this._buildCushions(W, H, RW, CD, CH, cCut, sCut);
    this._buildPocketMarkers();
  }

  _buildBed(W, H) {
    // 베드: 펠트 그린 사각 평면. y=0 윗면.
    const geo = new THREE.PlaneGeometry(W, H);
    const mat = new THREE.MeshStandardMaterial({ color: FELT_COLOR, roughness: 0.95, metalness: 0.0 });
    const bed = new THREE.Mesh(geo, mat);
    bed.rotation.x = -Math.PI / 2;
    bed.receiveShadow = true;
    this.bed = bed;
    this.group.add(bed);

    // 베드 측면 (얇은 슬레이트 두께 시각화) — 펠트 색 아래에 어두운 띠.
    const sideMat = new THREE.MeshStandardMaterial({ color: 0x141a1f, roughness: 0.8 });
    const t = TABLE.BED_THICKNESS;
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

  _buildRails(W, H, RW, RH, CD) {
    const mat = new THREE.MeshStandardMaterial({ color: RAIL_COLOR, roughness: 0.55, metalness: 0.08 });
    const outerW = W + 2 * (CD + RW);
    const outerH = H + 2 * (CD + RW);
    const railY = RH / 2;
    // 베드와 쿠션 너머 외곽 4 박스.
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

  _buildCushions(W, H, RW, CD, CH, cCut, sCut) {
    const mat = new THREE.MeshStandardMaterial({ color: CUSHION_COLOR, roughness: 0.85 });
    const y = CH / 2;
    // 긴 변 쿠션 — 사이드 포켓 때문에 2 조각씩, 총 4개.
    const longSegLen = W / 2 - cCut - sCut;
    const longSegCenter = -W / 4 + (cCut - sCut) / 2;
    // 정확히: 왼쪽 세그먼트 [-W/2+cCut, -sCut], 중심 = (-W/2 + cCut - sCut)/2
    const leftCenterX = (-W / 2 + cCut + -sCut) / 2;
    const rightCenterX = -leftCenterX;
    const segGeoLong = new THREE.BoxGeometry(longSegLen, CH, CD);

    const segPositions = [
      // +z 쪽 (코드상 -H/2가 아닌 +H/2 쪽 vs -H/2 쪽 헷갈리니 둘 다 처리)
      // -z 면(앞쪽): z 음수
      [leftCenterX,  y, -(H / 2 + CD / 2)],
      [rightCenterX, y, -(H / 2 + CD / 2)],
      [leftCenterX,  y, +(H / 2 + CD / 2)],
      [rightCenterX, y, +(H / 2 + CD / 2)],
    ];
    for (const [x, yy, z] of segPositions) {
      const m = new THREE.Mesh(segGeoLong, mat);
      m.position.set(x, yy, z);
      m.castShadow = true;
      m.receiveShadow = true;
      this.group.add(m);
    }
    // 짧은 변 쿠션 — 연속 1조각, 총 2개.
    const shortSegLen = H - 2 * cCut;
    const segGeoShort = new THREE.BoxGeometry(CD, CH, shortSegLen);
    const shortPositions = [
      [-(W / 2 + CD / 2), y, 0],
      [+(W / 2 + CD / 2), y, 0],
    ];
    for (const [x, yy, z] of shortPositions) {
      const m = new THREE.Mesh(segGeoShort, mat);
      m.position.set(x, yy, z);
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
      const disk = new THREE.Mesh(
        new THREE.CircleGeometry(r, 32),
        mat,
      );
      disk.rotation.x = -Math.PI / 2;
      // y=0.001로 베드 위로 살짝 띄워 z-fighting 방지.
      disk.position.set(c.x, 0.001, c.z);
      disk.receiveShadow = true;
      this.group.add(disk);
    }
  }
}

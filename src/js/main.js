import * as THREE from 'three';

import { Stage } from './scene/Stage.js';

const app = document.getElementById('app');
const hud = document.getElementById('hud');

const stage = new Stage(app);

// 임시 바닥(회색 펠트 자리). Stage 3에서 실제 테이블 베드로 교체.
const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(4, 4),
  new THREE.MeshStandardMaterial({ color: 0x2c3640, roughness: 0.95, metalness: 0.0 }),
);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
stage.add(ground);

// 임시 큐브. Stage 2에서 물리 객체로 대체.
const cube = new THREE.Mesh(
  new THREE.BoxGeometry(0.4, 0.4, 0.4),
  new THREE.MeshStandardMaterial({ color: 0x4f8ef7, roughness: 0.4, metalness: 0.1 }),
);
cube.position.y = 0.2;
cube.castShadow = true;
cube.receiveShadow = true;
stage.add(cube);

stage.onUpdate((dt) => {
  cube.rotation.y += dt * 0.6;
  cube.rotation.x += dt * 0.25;
});

stage.start();

const panel = document.createElement('div');
panel.className = 'panel top-left';
panel.innerHTML = `
  <strong>3D Billiards</strong><br />
  three.js r${THREE.REVISION}<br />
  <span style="opacity:.65">Stage 1 / Phase 1.3 — basic scene</span><br />
  <span style="opacity:.45">drag: rotate · wheel: zoom</span>
`;
hud.appendChild(panel);

import * as THREE from 'three';
import * as CANNON from 'cannon-es';

import { Stage } from './scene/Stage.js';
import { PhysicsWorld } from './physics/PhysicsWorld.js';

const app = document.getElementById('app');
const hud = document.getElementById('hud');

const stage = new Stage(app);
const physics = new PhysicsWorld();

// 임시 바닥. 시각 메시 + 정적 cannon-es Plane.
const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(4, 4),
  new THREE.MeshStandardMaterial({ color: 0x2c3640, roughness: 0.95, metalness: 0.0 }),
);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
stage.add(ground);

const groundBody = new CANNON.Body({
  mass: 0,
  shape: new CANNON.Plane(),
  material: physics.materials.felt,
});
groundBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
physics.addStatic(groundBody);

// 임시 큐브. Phase 2.2에서 물리 객체로 교체.
const cube = new THREE.Mesh(
  new THREE.BoxGeometry(0.4, 0.4, 0.4),
  new THREE.MeshStandardMaterial({ color: 0x4f8ef7, roughness: 0.4, metalness: 0.1 }),
);
cube.position.y = 0.2;
cube.castShadow = true;
cube.receiveShadow = true;
stage.add(cube);

stage.onUpdate((dt) => {
  physics.step(dt);
  cube.rotation.y += dt * 0.6;
  cube.rotation.x += dt * 0.25;
});

stage.start();

const panel = document.createElement('div');
panel.className = 'panel top-left';
panel.innerHTML = `
  <strong>3D Billiards</strong><br />
  three.js r${THREE.REVISION} · cannon-es<br />
  <span style="opacity:.65">Stage 2 / Phase 2.1 — physics world</span><br />
  <span style="opacity:.45">drag: rotate · wheel: zoom</span>
`;
hud.appendChild(panel);

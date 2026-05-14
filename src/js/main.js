import * as THREE from 'three';
import * as CANNON from 'cannon-es';

import { BALL, TABLE } from './config.js';
import { Stage } from './scene/Stage.js';
import { PhysicsWorld } from './physics/PhysicsWorld.js';
import { Table } from './objects/Table.js';

const app = document.getElementById('app');
const hud = document.getElementById('hud');

const stage = new Stage(app);
// 9피트 테이블 전체가 보이도록 카메라 후퇴.
stage.camera.position.set(2.4, 1.6, 2.4);
stage.camera.lookAt(0, 0, 0);
stage.controls.target.set(0, 0, 0);
stage.controls.maxDistance = 8;

const physics = new PhysicsWorld();

// 시각: 표준 9피트 풀 테이블.
const table = new Table();
stage.add(table.group);

// 임시 물리 평면: Phase 3.2에서 쿠션/포켓으로 교체.
const groundBody = new CANNON.Body({
  mass: 0,
  shape: new CANNON.Plane(),
  material: physics.materials.felt,
});
groundBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
physics.addStatic(groundBody);

// 임시 공 몇 개 — 테이블 위에서 잘 보이는지만 확인.
function spawnBall(x, y, z, color) {
  const mesh = new THREE.Mesh(
    new THREE.SphereGeometry(BALL.RADIUS, 32, 16),
    new THREE.MeshStandardMaterial({ color, roughness: 0.3, metalness: 0.08 }),
  );
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  stage.add(mesh);

  const body = new CANNON.Body({
    mass: BALL.MASS,
    shape: new CANNON.Sphere(BALL.RADIUS),
    material: physics.materials.ball,
    position: new CANNON.Vec3(x, y, z),
    linearDamping: 0.4,
    angularDamping: 0.4,
  });
  physics.addDynamic(body, mesh);
  return { mesh, body };
}

// 큐볼은 -x 쪽, 1번 공은 +x 쪽 풋 스팟 근처에 배치 (대략).
const FOOT_SPOT_X = TABLE.PLAY_WIDTH / 4;
spawnBall(-FOOT_SPOT_X, BALL.RADIUS, 0, 0xffffff);
spawnBall(FOOT_SPOT_X, BALL.RADIUS, 0, 0xe6c200);

stage.onUpdate((dt) => {
  physics.step(dt);
});

stage.start();

const panel = document.createElement('div');
panel.className = 'panel top-left';
panel.innerHTML = `
  <strong>3D Billiards</strong><br />
  three.js r${THREE.REVISION} · cannon-es<br />
  <span style="opacity:.65">Stage 3 / Phase 3.1 — table visual</span><br />
  <span style="opacity:.45">drag: rotate · wheel: zoom</span>
`;
hud.appendChild(panel);

import * as THREE from 'three';
import * as CANNON from 'cannon-es';

import { BALL, TABLE } from './config.js';
import { Stage } from './scene/Stage.js';
import { PhysicsWorld } from './physics/PhysicsWorld.js';
import { Table } from './objects/Table.js';

const app = document.getElementById('app');
const hud = document.getElementById('hud');

const stage = new Stage(app);
stage.camera.position.set(2.4, 1.6, 2.4);
stage.camera.lookAt(0, 0, 0);
stage.controls.target.set(0, 0, 0);
stage.controls.maxDistance = 8;

const physics = new PhysicsWorld();

// 시각 + 물리 모두 Table이 관리.
const table = new Table();
stage.add(table.group);
table.addPhysics(physics);

// 임시 공 — Phase 3.3에서 Ball 클래스 + 16개 랙으로 교체.
const balls = [];

function spawnBall(x, z, color) {
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
    position: new CANNON.Vec3(x, BALL.RADIUS, z),
    linearDamping: 0.4,
    angularDamping: 0.4,
  });
  physics.addDynamic(body, mesh);

  const b = { mesh, body, pocketed: false };
  balls.push(b);
  return b;
}

// 큐볼 + 표적구 4개.
const FOOT_SPOT_X = TABLE.PLAY_WIDTH / 4;
const HEAD_SPOT_X = -FOOT_SPOT_X;

const cueBall = spawnBall(HEAD_SPOT_X, 0, 0xffffff);
spawnBall(FOOT_SPOT_X, 0, 0xe6c200);
spawnBall(FOOT_SPOT_X + 0.06, 0.035, 0x1e88e5);
spawnBall(FOOT_SPOT_X + 0.06, -0.035, 0xd32f2f);
spawnBall(FOOT_SPOT_X + 0.12, 0, 0x222222);

// 큐볼에 강한 임펄스 → 표적구 충돌 → 쿠션 반사 → 포켓 시험.
cueBall.body.velocity.set(3.5, 0, 0.1);

function handlePocketing() {
  for (const b of balls) {
    if (b.pocketed) continue;
    if (table.isInPocket(b.body.position)) {
      b.pocketed = true;
      // 빨려 내려가도록 아래로 살짝 가속, 그 후 제거.
      b.body.velocity.set(0, -0.8, 0);
      b.body.angularVelocity.set(0, 0, 0);
      setTimeout(() => {
        physics.remove(b.body);
        stage.remove(b.mesh);
      }, 350);
    }
  }
}

stage.onUpdate((dt) => {
  physics.step(dt);
  handlePocketing();
});

stage.start();

const panel = document.createElement('div');
panel.className = 'panel top-left';
panel.innerHTML = `
  <strong>3D Billiards</strong><br />
  three.js r${THREE.REVISION} · cannon-es<br />
  <span style="opacity:.65">Stage 3 / Phase 3.2 — cushions &amp; pockets</span><br />
  <span style="opacity:.45">drag: rotate · wheel: zoom</span>
`;
hud.appendChild(panel);

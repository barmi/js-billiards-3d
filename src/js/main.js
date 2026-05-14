import * as THREE from 'three';

import { BALL } from './config.js';
import { Stage } from './scene/Stage.js';
import { PhysicsWorld } from './physics/PhysicsWorld.js';
import { Table } from './objects/Table.js';
import { Ball } from './objects/Ball.js';
import { CueStick } from './objects/CueStick.js';
import { rackPositions, headSpot } from './objects/rack.js';

const app = document.getElementById('app');
const hud = document.getElementById('hud');

const stage = new Stage(app);
// 카메라를 헤드 스팟 뒤쪽(-x)에서 풋 스팟 쪽(+x)을 바라보도록 — 자연스러운 브레이크 자세.
stage.camera.position.set(-1.9, 1.05, 0.7);
stage.camera.lookAt(0, 0, 0);
stage.controls.target.set(0, 0, 0);
stage.controls.maxDistance = 6;
stage.controls.minDistance = 0.6;

const physics = new PhysicsWorld();

const table = new Table();
stage.add(table.group);
table.addPhysics(physics);

// 큐볼 + 15 객체구.
const balls = [];
function makeBall(number, x, z) {
  const ball = new Ball(number, { x, z }, physics.materials);
  stage.add(ball.mesh);
  physics.addDynamic(ball.body, ball.mesh);
  balls.push(ball);
  return ball;
}
const headSpotPos = headSpot();
const cueBall = makeBall(0, headSpotPos.x, headSpotPos.z);
for (const spec of rackPositions()) {
  makeBall(spec.number, spec.x, spec.z);
}

// 큐 스틱.
const cueStick = new CueStick();
stage.add(cueStick.mesh);

const _aimDir = new THREE.Vector3();
function updateAim() {
  if (cueBall.pocketed) {
    cueStick.setVisible(false);
    return;
  }
  if (!physics.isAllAtRest()) {
    cueStick.setVisible(false);
    return;
  }
  // 카메라가 큐볼을 향하도록 컨트롤 타겟 갱신.
  stage.controls.target.set(cueBall.body.position.x, BALL.RADIUS, cueBall.body.position.z);

  // 조준 방향 = (큐볼 - 카메라) 의 xz 정규화.
  _aimDir.set(
    cueBall.body.position.x - stage.camera.position.x,
    0,
    cueBall.body.position.z - stage.camera.position.z,
  );
  if (_aimDir.lengthSq() < 1e-6) {
    cueStick.setVisible(false);
    return;
  }
  _aimDir.normalize();
  cueStick.aim(cueBall.body.position, _aimDir);
  cueStick.setVisible(true);
}

function handlePocketing() {
  for (const b of balls) {
    if (b.pocketed) continue;
    if (table.isInPocket(b.body.position)) {
      b.sink();
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
  updateAim();
});

stage.start();

// 디버그용 — 콘솔에서 cueBall.body.velocity.set(...)로 샷 테스트 가능.
window.__demo = { cueBall, balls, physics, stage, cueStick };

const panel = document.createElement('div');
panel.className = 'panel top-left';
panel.innerHTML = `
  <strong>3D Billiards</strong><br />
  three.js r${THREE.REVISION} · cannon-es<br />
  <span style="opacity:.65">Stage 4 / Phase 4.1 — cue stick aiming</span><br />
  <span style="opacity:.45">drag: rotate camera (aim) · wheel: zoom</span>
`;
hud.appendChild(panel);

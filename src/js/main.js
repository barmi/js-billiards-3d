import * as THREE from 'three';

import { Stage } from './scene/Stage.js';
import { PhysicsWorld } from './physics/PhysicsWorld.js';
import { Table } from './objects/Table.js';
import { Ball } from './objects/Ball.js';
import { rackPositions, headSpot } from './objects/rack.js';

const app = document.getElementById('app');
const hud = document.getElementById('hud');

const stage = new Stage(app);
stage.camera.position.set(2.4, 1.6, 2.4);
stage.camera.lookAt(0, 0, 0);
stage.controls.target.set(0, 0, 0);
stage.controls.maxDistance = 8;

const physics = new PhysicsWorld();

const table = new Table();
stage.add(table.group);
table.addPhysics(physics);

// 공 16개: 큐볼 + 1~15.
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

// 데모용 브레이크 샷.
cueBall.body.velocity.set(4.5, 0, 0.02);

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
});

stage.start();

const panel = document.createElement('div');
panel.className = 'panel top-left';
panel.innerHTML = `
  <strong>3D Billiards</strong><br />
  three.js r${THREE.REVISION} · cannon-es<br />
  <span style="opacity:.65">Stage 3 / Phase 3.3 — 16-ball rack</span><br />
  <span style="opacity:.45">drag: rotate · wheel: zoom</span>
`;
hud.appendChild(panel);

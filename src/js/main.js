import * as THREE from 'three';

import { BALL } from './config.js';
import { Stage } from './scene/Stage.js';
import { PhysicsWorld } from './physics/PhysicsWorld.js';
import { Table } from './objects/Table.js';
import { Ball } from './objects/Ball.js';
import { CueStick } from './objects/CueStick.js';
import { rackPositions, headSpot } from './objects/rack.js';
import { ShotController } from './controls/ShotController.js';

const app = document.getElementById('app');
const hud = document.getElementById('hud');

const stage = new Stage(app);
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

const cueStick = new CueStick();
stage.add(cueStick.mesh);

const _aimDir = new THREE.Vector3();

function refreshAimDir() {
  _aimDir.set(
    cueBall.body.position.x - stage.camera.position.x,
    0,
    cueBall.body.position.z - stage.camera.position.z,
  );
  if (_aimDir.lengthSq() < 1e-6) return false;
  _aimDir.normalize();
  return true;
}

function canShoot() {
  return !cueBall.pocketed && physics.isAllAtRest();
}

function updateAim() {
  if (!canShoot()) {
    cueStick.setVisible(false);
    return;
  }
  stage.controls.target.set(cueBall.body.position.x, BALL.RADIUS, cueBall.body.position.z);
  if (!refreshAimDir()) {
    cueStick.setVisible(false);
    return;
  }
  cueStick.aim(cueBall.body.position, _aimDir);
  cueStick.setVisible(true);
}

// 파워 게이지 HUD.
const powerPanel = document.createElement('div');
powerPanel.className = 'power-gauge';
powerPanel.innerHTML = '<div class="power-fill"></div><div class="power-label">SPACE</div>';
hud.appendChild(powerPanel);
const powerFill = powerPanel.querySelector('.power-fill');

const SHOT_VELOCITY_MIN = 0.6;
const SHOT_VELOCITY_MAX = 8.0;

const shot = new ShotController({
  canShoot,
  getAimDir: () => _aimDir,
  onCharge: (p) => {
    powerFill.style.height = `${(p * 100).toFixed(1)}%`;
    cueStick.pullback = p * 0.18; // 최대 18cm 풀백
  },
  onFire: (p) => {
    if (!refreshAimDir()) return;
    const v = SHOT_VELOCITY_MIN + (SHOT_VELOCITY_MAX - SHOT_VELOCITY_MIN) * p;
    cueBall.body.wakeUp();
    cueBall.body.velocity.set(_aimDir.x * v, 0, _aimDir.z * v);
    cueStick.pullback = 0;
  },
});
shot.attach(window);

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
  shot.update(dt);
  updateAim();
});

stage.start();

window.__demo = { cueBall, balls, physics, stage, cueStick, shot };

const panel = document.createElement('div');
panel.className = 'panel top-left';
panel.innerHTML = `
  <strong>3D Billiards</strong><br />
  three.js r${THREE.REVISION} · cannon-es<br />
  <span style="opacity:.65">Stage 4 / Phase 4.2 — power &amp; shot</span><br />
  <span style="opacity:.45">drag: aim · wheel: zoom · hold SPACE: power</span>
`;
hud.appendChild(panel);

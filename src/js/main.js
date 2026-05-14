import * as THREE from 'three';

import { BALL, PHYSICS } from './config.js';
import { Stage } from './scene/Stage.js';
import { PhysicsWorld } from './physics/PhysicsWorld.js';
import { Table } from './objects/Table.js';
import { Ball } from './objects/Ball.js';
import { CueStick } from './objects/CueStick.js';
import { AimLine } from './objects/AimLine.js';
import { rackPositions, headSpot } from './objects/rack.js';
import { ShotController } from './controls/ShotController.js';
import { Game, GameState } from './game/Game.js';
import { GameHUD } from './ui/GameHUD.js';
import { ImpactPicker } from './ui/ImpactPicker.js';

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

const aimLine = new AimLine();
stage.add(aimLine.line);

const gameHUD = new GameHUD(hud, { onNewGame: () => location.reload() });
const impactPicker = new ImpactPicker(hud);

function respawnCueBall() {
  const hs = headSpot();
  cueBall.pocketed = false;
  cueBall.mesh.visible = true;
  cueBall.body.position.set(hs.x, BALL.RADIUS, hs.z);
  cueBall.body.velocity.set(0, 0, 0);
  cueBall.body.angularVelocity.set(0, 0, 0);
  cueBall.body.wakeUp();
}

const game = new Game({
  cueBall,
  balls,
  table,
  hooks: {
    onCueRespawn: respawnCueBall,
    onResolve: (g, summary) => {
      gameHUD.update(g);
      gameHUD.showShotSummary(summary);
    },
  },
});
gameHUD.update(game);

// cannon-es beginContact 이벤트를 게임으로 전달.
physics.world.addEventListener('beginContact', (e) => {
  game.trackContact(e.bodyA, e.bodyB);
});

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
  if (cueBall.pocketed) return false;
  if (!game.isPlayable()) return false;
  return physics.isAllAtRest();
}

function updateAim() {
  if (!canShoot()) {
    cueStick.setVisible(false);
    aimLine.setVisible(false);
    return;
  }
  stage.controls.target.set(cueBall.body.position.x, BALL.RADIUS, cueBall.body.position.z);
  if (!refreshAimDir()) {
    cueStick.setVisible(false);
    aimLine.setVisible(false);
    return;
  }
  cueStick.aim(cueBall.body.position, _aimDir);
  cueStick.setVisible(true);
  aimLine.update(
    { x: cueBall.body.position.x, z: cueBall.body.position.z },
    _aimDir,
    balls.filter((b) => b !== cueBall),
  );
  aimLine.setVisible(true);
}

// 파워 게이지 HUD.
const powerPanel = document.createElement('div');
powerPanel.className = 'power-gauge';
powerPanel.innerHTML = '<div class="power-fill"></div><div class="power-label">SPACE</div>';
hud.appendChild(powerPanel);
const powerFill = powerPanel.querySelector('.power-fill');

const SHOT_VELOCITY_MIN = 0.6;
const SHOT_VELOCITY_MAX = 8.0;
const SPIN_TOP_GAIN = 0.9;  // 톱/백스핀 게인 (1.0 = 순수 굴림 속도와 동일 ω)
const SPIN_SIDE_GAIN = 0.6; // 사이드 잉글리시 게인

const shot = new ShotController({
  canShoot,
  getAimDir: () => _aimDir,
  onCharge: (p) => {
    powerFill.style.height = `${(p * 100).toFixed(1)}%`;
    cueStick.pullback = p * 0.18;
  },
  onFire: (p) => {
    if (!refreshAimDir()) return;
    const v = SHOT_VELOCITY_MIN + (SHOT_VELOCITY_MAX - SHOT_VELOCITY_MIN) * p;
    cueBall.body.wakeUp();
    cueBall.body.velocity.set(_aimDir.x * v, 0, _aimDir.z * v);

    // 스핀: picker 오프셋 → 각속도.
    //  - offsetY > 0 (톱) → aim 방향으로 굴리는 회전축 = (aim.z, 0, -aim.x)
    //  - offsetX > 0 (오른쪽 잉글리시) → -Y 회전 (위에서 봤을 때 시계방향)
    const off = impactPicker.getOffset();
    const omega = v / BALL.RADIUS;
    const topMag = off.y * omega * SPIN_TOP_GAIN;
    const sideMag = -off.x * omega * SPIN_SIDE_GAIN;
    cueBall.body.angularVelocity.set(
      _aimDir.z * topMag,
      sideMag,
      -_aimDir.x * topMag,
    );

    impactPicker.reset();
    cueStick.pullback = 0;
    game.onShotFired();
  },
});
shot.attach(window);

function handlePocketing() {
  for (const b of balls) {
    if (b.pocketed) continue;
    if (!table.isInPocket(b.body.position)) continue;
    b.sink();
    game.onBallPocketed(b);
    if (b === cueBall) {
      // 큐볼은 제거하지 않고 화면 아래로 격리. resolve 시 헤드 스팟에 재배치.
      setTimeout(() => {
        b.mesh.visible = false;
        b.body.position.set(0, -2, 0);
        b.body.velocity.set(0, 0, 0);
        b.body.sleep();
      }, 80);
    } else {
      setTimeout(() => {
        physics.remove(b.body);
        stage.remove(b.mesh);
      }, 80);
    }
  }
}

let _shotElapsed = 0;
stage.onUpdate((dt) => {
  physics.step(dt);
  handlePocketing();
  shot.update(dt);
  updateAim();
  // 샷 중: 정상 정지 시 또는 안전 타임아웃 시 resolve.
  if (game.state === GameState.SHOT_IN_PROGRESS) {
    _shotElapsed += dt;
    const atRest = physics.isAllAtRest();
    if (atRest || _shotElapsed > PHYSICS.SHOT_SAFETY_TIMEOUT) {
      if (!atRest) {
        // 강제 정지: 모든 동적 바디 속도 0으로
        for (const { body } of physics._dynamic) {
          body.velocity.set(0, 0, 0);
          body.angularVelocity.set(0, 0, 0);
          body.sleep();
        }
      }
      game.resolveShot();
      _shotElapsed = 0;
    }
  } else {
    _shotElapsed = 0;
  }
});

stage.start();

window.__demo = { cueBall, balls, physics, stage, cueStick, shot, game, impactPicker };

const panel = document.createElement('div');
panel.className = 'panel top-left';
panel.innerHTML = `
  <strong>3D Billiards</strong><br />
  three.js r${THREE.REVISION} · cannon-es<br />
  <span style="opacity:.45">drag: aim · wheel: zoom · hold SPACE: power</span>
`;
hud.appendChild(panel);

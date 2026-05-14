import * as THREE from 'three';
import * as CANNON from 'cannon-es';

import { BALL } from './config.js';
import { Stage } from './scene/Stage.js';
import { PhysicsWorld } from './physics/PhysicsWorld.js';

const app = document.getElementById('app');
const hud = document.getElementById('hud');

const stage = new Stage(app);
// 공이 작아서(57mm) 카메라를 가까이.
stage.camera.position.set(0.6, 0.45, 0.6);
stage.camera.lookAt(0, 0, 0);
stage.controls.target.set(0, 0.05, 0);

const physics = new PhysicsWorld();

// 시각 바닥 + 정적 cannon 평면.
const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(2, 2),
  new THREE.MeshStandardMaterial({ color: 0x1f6f3a, roughness: 0.95, metalness: 0.0 }),
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

// 공 생성 헬퍼.
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

const balls = [
  spawnBall(0.00, 0.35, 0.00, 0xffffff), // 큐볼
  spawnBall(0.12, 0.55, 0.06, 0xe74c3c), // 빨강
  spawnBall(-0.10, 0.50, -0.08, 0xf1c40f), // 노랑
];

// 첫 공에 약간의 측면 속도를 줘서 굴러가는 효과 확인.
balls[1].body.velocity.set(-0.5, 0, -0.3);

stage.onUpdate((dt) => {
  physics.step(dt);
});

stage.start();

const panel = document.createElement('div');
panel.className = 'panel top-left';
panel.innerHTML = `
  <strong>3D Billiards</strong><br />
  three.js r${THREE.REVISION} · cannon-es<br />
  <span style="opacity:.65">Stage 2 / Phase 2.2 — physics demo</span><br />
  <span style="opacity:.45">drag: rotate · wheel: zoom</span>
`;
hud.appendChild(panel);

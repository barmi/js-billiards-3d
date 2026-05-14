import * as THREE from 'three';
import * as CANNON from 'cannon-es';

import { SCENE, CAMERA } from './config.js';

const app = document.getElementById('app');
const hud = document.getElementById('hud');

const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(SCENE.BACKGROUND);
app.appendChild(renderer.domElement);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  CAMERA.FOV,
  window.innerWidth / window.innerHeight,
  CAMERA.NEAR,
  CAMERA.FAR,
);
camera.position.set(0, 1.6, 2.4);
camera.lookAt(0, 0, 0);

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

renderer.render(scene, camera);

const panel = document.createElement('div');
panel.className = 'panel top-left';
panel.innerHTML = `
  <strong>3D Billiards</strong><br />
  three.js r${THREE.REVISION} · cannon-es ${CANNON.Body ? 'loaded' : 'missing'}<br />
  <span style="opacity:.6">Stage 1 / Phase 1.2 — scaffold</span>
`;
hud.appendChild(panel);

console.log('[boot] three.js', THREE.REVISION, '· cannon-es loaded:', typeof CANNON.World === 'function');

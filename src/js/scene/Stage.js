import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

import { SCENE, CAMERA } from '../config.js';
import { createLights } from './lighting.js';

// three.js 씬·카메라·렌더러·OrbitControls·애니메이션 루프를 통합 관리.
// `onUpdate(fn)`로 매 프레임 콜백을 등록 — 물리 동기화 등을 여기에 연결.
export class Stage {
  constructor(container) {
    this.container = container;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(SCENE.BACKGROUND);

    const { clientWidth: w, clientHeight: h } = container;

    this.camera = new THREE.PerspectiveCamera(CAMERA.FOV, w / h, CAMERA.NEAR, CAMERA.FAR);
    this.camera.position.set(1.8, 1.4, 1.8);
    this.camera.lookAt(0, 0, 0);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(w, h);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0;
    container.appendChild(this.renderer.domElement);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.minDistance = 0.4;
    this.controls.maxDistance = 8;
    this.controls.maxPolarAngle = Math.PI * 0.49;
    this.controls.target.set(0, 0, 0);

    this.lights = createLights(this.scene);

    this._updaters = [];
    this._raf = null;
    this._lastT = 0;

    this._onResize = () => this.resize();
    window.addEventListener('resize', this._onResize);
  }

  resize() {
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }

  add(obj) {
    this.scene.add(obj);
    return obj;
  }

  remove(obj) {
    this.scene.remove(obj);
  }

  onUpdate(fn) {
    this._updaters.push(fn);
    return () => {
      const i = this._updaters.indexOf(fn);
      if (i >= 0) this._updaters.splice(i, 1);
    };
  }

  start() {
    if (this._raf) return;
    const tick = (t) => {
      const dt = this._lastT ? Math.min((t - this._lastT) / 1000, 0.1) : 0;
      this._lastT = t;
      for (const fn of this._updaters) fn(dt, t / 1000);
      this.controls.update();
      this.renderer.render(this.scene, this.camera);
      this._raf = requestAnimationFrame(tick);
    };
    this._raf = requestAnimationFrame(tick);
  }

  stop() {
    if (this._raf) cancelAnimationFrame(this._raf);
    this._raf = null;
    this._lastT = 0;
  }

  dispose() {
    this.stop();
    window.removeEventListener('resize', this._onResize);
    this.renderer.dispose();
  }
}

import * as THREE from 'three';
import { SCENE } from '../config.js';

export function createLights(scene) {
  const ambient = new THREE.AmbientLight(0xffffff, SCENE.AMBIENT_INTENSITY);
  scene.add(ambient);

  const key = new THREE.DirectionalLight(0xffffff, SCENE.KEY_LIGHT_INTENSITY);
  key.position.set(2, 4, 1.5);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  const s = 2.0;
  key.shadow.camera.left = -s;
  key.shadow.camera.right = s;
  key.shadow.camera.top = s;
  key.shadow.camera.bottom = -s;
  key.shadow.camera.near = 0.1;
  key.shadow.camera.far = 12;
  key.shadow.bias = -0.0001;
  scene.add(key);

  const fill = new THREE.DirectionalLight(0xc8d6ff, 0.3);
  fill.position.set(-2, 2, -1.5);
  scene.add(fill);

  return { ambient, key, fill };
}

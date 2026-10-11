// Renderer, scene, camera and the two lights (sky fill + evening sun).
import * as THREE from 'three';
import { CAMERA, COLORS } from '../config.js';

export function createStage(canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(COLORS.sky);
  scene.fog = new THREE.Fog(COLORS.sky, 16, 34);

  // tight near/far planes keep depth precision high, which stops floors flickering
  const camera = new THREE.PerspectiveCamera(CAMERA.fovLandscape, 1, 1, 60);

  const hemi = new THREE.HemisphereLight('#c7dbff', '#3b2d22', 0.78);
  const sun = new THREE.DirectionalLight('#ffd7a3', 0.85);
  sun.position.set(-7, 11, -5);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.bias = -0.0006;
  sun.shadow.normalBias = 0.03;
  Object.assign(sun.shadow.camera, { left: -15, right: 15, top: 15, bottom: -15, near: 1, far: 45 });
  sun.target.position.set(2.8, 0, -2);
  scene.add(hemi, sun, sun.target);

  function resize() {
    const w = window.innerWidth, h = window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.fov = w < h ? CAMERA.fovPortrait : CAMERA.fovLandscape;
    camera.updateProjectionMatrix();
  }
  window.addEventListener('resize', resize);
  resize();

  return { renderer, scene, camera, hemi, sun };
}

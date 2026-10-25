// Renderer, scene, camera and the two lights (sky fill + evening sun), as in Ford House. The camera looks down
// at one board at a time and glides between them.
import * as THREE from 'three';

export const SKY = '#1c2a40';
const TILT = 0.98;          // radians above the horizon the camera looks down from
const FIT = 12.6;           // world units that must fit across (a board with its frame and labels)

export function createStage(canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(SKY);
  scene.fog = new THREE.Fog(SKY, 26, 60);

  const camera = new THREE.PerspectiveCamera(45, 1, 1, 140);

  const hemi = new THREE.HemisphereLight('#c7dbff', '#1d3550', 0.8);
  const sun = new THREE.DirectionalLight('#ffd7a3', 0.9);
  sun.position.set(-9, 14, -7);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.bias = -0.0006;
  sun.shadow.normalBias = 0.03;
  Object.assign(sun.shadow.camera, { left: -16, right: 16, top: 12, bottom: -12, near: 1, far: 45 });
  scene.add(hemi, sun, sun.target);

  // where the camera is looking: a point on the water, and how far it glides there
  const look = new THREE.Vector3(), from = new THREE.Vector3(), to = new THREE.Vector3();
  let glide = null, lift = 0, zoom = 1, zoomFrom = 1, zoomTo = 1;

  /** How far back the camera sits so a board fits the screen, with room for the bars at the top and bottom. */
  function distance() {
    const vfov = THREE.MathUtils.degToRad(camera.fov), hfov = 2 * Math.atan(Math.tan(vfov / 2) * camera.aspect);
    const portrait = camera.aspect < 1;
    const across = (FIT / 2) / Math.tan(hfov / 2);
    const down = (FIT / 2) / Math.tan(vfov / 2) * (portrait ? 1.3 : 1.42);
    return Math.max(across, down);
  }
  function place() {
    const d = distance() * (1 + lift) * zoom;
    camera.position.set(look.x, look.y + Math.sin(TILT) * d, look.z + Math.cos(TILT) * d);
    scene.fog.near = 26 * zoom; scene.fog.far = 60 * zoom;   // pulled back, the haze moves back too
    camera.lookAt(look);
  }

  function resize() {
    const w = window.innerWidth, h = window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.fov = w < h ? 55 : 42;
    camera.updateProjectionMatrix();
    place();
  }
  window.addEventListener('resize', resize);
  resize();

  return {
    renderer, scene, camera, sun,
    /** Look at (x, z) on the water, from `far` times the usual distance; glides there over `ms` (0: at once).
     *  Resolves when it's there. */
    lookAt(x, z, ms = 0, far = 1) {
      to.set(x, 0, z);
      zoomFrom = zoom; zoomTo = far;
      if (glide) { const { done } = glide; glide = null; lift = 0; done(); }
      if (!ms) { look.copy(to); zoom = far; place(); return Promise.resolve(); }
      from.copy(look);
      return new Promise(done => { glide = { t: 0, ms, done }; });
    },
    get looking() { return look; },
    get portrait() { return camera.aspect < 1; },
    update(dt) {
      if (!glide) return;
      glide.t = Math.min(1, glide.t + dt * 1000 / glide.ms);
      const e = glide.t < 0.5 ? 2 * glide.t * glide.t : 1 - (-2 * glide.t + 2) ** 2 / 2;   // ease in and out
      look.lerpVectors(from, to, e);
      zoom = zoomFrom + (zoomTo - zoomFrom) * e;
      lift = Math.sin(e * Math.PI) * 0.22;   // pulls back a little in the middle, as if swinging up and over
      place();
      if (glide.t >= 1) { lift = 0; place(); const { done } = glide; glide = null; done(); }
    },
  };
}

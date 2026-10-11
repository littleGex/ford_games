// The garden in each season. Autumn: the trees and bushes turn orange, red and yellow, leaves lie about
// and drift down. Winter (December and January): snow on the ground, caps of snow on the bushes and shed
// roofs, and snowflakes falling. Like the rain, nothing falls inside the cut-open houses.
import * as THREE from 'three';
import { WALL_HEIGHT as WH } from '../config.js';
import { rand } from '../state.js';
import { add, box, group, mat, setBuildTarget } from '../core/build.js';

const ROW = { x1: -6.3, x2: 11.7, z1: -0.45, z2: 9.35 };   // the row of houses: nothing falls in here
const AUTUMN = ['#d9822b', '#c4472b', '#e0a030', '#b5562a', '#a83a2a', '#d8b24a'];
const LEAVES = ['#d9822b', '#c4472b', '#e0a030', '#b5562a', '#e8b84a'];
const inRow = (x, z) => x > ROW.x1 && x < ROW.x2 && z > ROW.z1 && z < ROW.z2;

export function createSeasonal({ stage, world, player }, season) {
  const scene = stage.scene;
  setBuildTarget(scene, 0);

  // the garden's trees and bushes: big leafy-coloured spheres outside the houses (green ones change colour
  // in autumn; red and yellow ones already have; the terrace plant is a group, so it's left alone)
  const radius = o => (o.geometry.parameters ? o.geometry.parameters.radius : 0) * o.scale.x;
  const hue = o => { const c = o.material && o.material.color, hsl = {}; if (!c || typeof c.getHSL !== 'function') return null; c.getHSL(hsl); return hsl; };
  const plants = scene.children.filter(o => {
    if (!o.isMesh || !(o.geometry instanceof THREE.SphereGeometry) || inRow(o.position.x, o.position.z) || radius(o) < 0.25) return false;
    const hsl = hue(o);
    return !!hsl && hsl.h < 0.45 && hsl.s > 0.2 && hsl.l < 0.65;
  });
  const foliage = plants.filter(o => hue(o).h > 0.12);   // the green ones

  let fall = null, speed = 0, sway = 0;
  if (season === 'autumn') {
    foliage.forEach((o, i) => {
      const k = Math.abs(Math.round(o.position.x * 13 + o.position.z * 7 + i)) % (AUTUMN.length + 1);
      if (k < AUTUMN.length) o.material = mat(AUTUMN[k]);   // one in seven stays green
    });
    // leaves lying about in the gardens and on the pavement
    for (let n = 0; n < 70; n++) {
      const x = rand(-2.2, 5.6), z = n % 2 ? rand(-16.8, -3.6) : rand(9.4, 13.5);
      add(scene, new THREE.BoxGeometry(0.09, 0.006, 0.06), mat(LEAVES[n % LEAVES.length]), [x, 0.03, z], null, [0, rand(0, 3.1), 0]);
    }
    fall = makeFall(45, () => new THREE.BoxGeometry(0.08, 0.005, 0.06), i => mat(LEAVES[i % LEAVES.length]));
    speed = 0.8; sway = 0.6;
  }
  if (season === 'winter') {
    const snow = mat('#f4f7fa');
    if (world.ground) { world.ground.material.map = null; world.ground.material.color.set('#eef3f7'); world.ground.material.needsUpdate = true; }
    box(-0.34, -15.0, 5.68, -3.45, 0.01, 0.04, snow, false);          // the back lawn, beds and path
    box(1.38, -17.42, 3.92, -15.18, 0.06, WH + 0.04, snow, false);    // shed roof
    box(-2.62, -17.42, -0.43, -15.58, 0.06, WH, snow, false);         // the neighbours' pink shed
    plants.forEach(o => {   // a cap of snow on every bush and tree; the ones that lose their leaves go bare and brown
      if (!foliage.includes(o)) o.material = mat('#7a6656');
      const r = radius(o), sy = o.scale.y / o.scale.x;
      add(scene, new THREE.SphereGeometry(r * 0.86, 16, 10), snow, [o.position.x, o.position.y + r * sy * 0.55, o.position.z], [1, 0.55, 1]);
    });
    fall = makeFall(220, () => new THREE.SphereGeometry(0.022, 6, 4), () => snow);
    speed = 0.9; sway = 0.35;
  }

  function makeFall(count, geo, material) {
    const g = new THREE.Group(); scene.add(g);
    const shared = geo();
    const bits = Array.from({ length: count }, (_, i) => { const m = new THREE.Mesh(shared, material(i)); g.add(m); m.userData.phase = rand(0, 6.3); return m; });
    bits.forEach(m => scatter(m, false));
    return bits;
  }
  function scatter(m, top) {
    const p = player.group.position;
    m.position.set(p.x + rand(-8, 8), top ? rand(4.5, 6.5) : rand(0, 6.5), p.z + rand(-8, 8));
    m.visible = !inRow(m.position.x, m.position.z);
  }

  return {
    season,
    update(dt, time) {
      if (!fall) return;
      for (const m of fall) {
        m.position.y -= dt * speed;
        m.position.x += Math.sin(time * 1.3 + m.userData.phase) * sway * dt;
        m.rotation.y += dt * sway;
        if (m.position.y < 0.02) scatter(m, true);
      }
    },
  };
}

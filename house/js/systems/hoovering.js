// Dusty patches to hoover on each floor. The hoover head picks them up. The hoover lives under the stairs
// downstairs, so hoovering upstairs or in the attic means carrying it up (and back down again).
import * as THREE from 'three';
import { S } from '../state.js';
import { add, group, mat, setBuildTarget } from '../core/build.js';

// where the dust lies, per floor: living room, dining room and hall / bedrooms and landing / attic rooms
export const HOOVER_SPOTS = [
  [[2.3, 0.75], [1.5, 3.6], [2.4, 4.7], [0.4, 6.4], [2.5, 6.1], [2.4, 8.4], [4.0, 4.6], [3.95, 5.9]],
  [[2.4, 3.6], [1.2, 4.9], [2.1, 6.3], [2.4, 8.2], [3.9, 4.9], [3.9, 6.3], [4.1, 2.2], [4.2, 7.6]],
  [[2.6, 2.2], [1.6, 1.6], [3.9, 2.9], [2.0, 4.9], [1.4, 7.1], [3.8, 5.2], [3.7, 7.1]],
];
// which job hoovers which floor
export const HOOVER_JOBS = ['hoover', 'hooverUp', 'hooverAttic'];

export function createHoovering({ stage, world, board, player }) {
  const dust = new THREE.MeshStandardMaterial({ color: '#8f8a80', transparent: true, opacity: 0.6, depthWrite: false });
  const floors = [stage.scene, world.upstairs, world.attic];
  const spots = HOOVER_SPOTS.map((list, level) => {
    setBuildTarget(floors[level], level);
    const made = list.map(([x, z], n) => {
      const g = group(x, 0.03, z);
      add(g, new THREE.CircleGeometry(0.22, 16), dust, [0, 0, 0], null, [-Math.PI / 2, 0, 0]);
      for (let k = 0; k < 4; k++) add(g, new THREE.SphereGeometry(0.04, 8, 6), mat('#a7a298'), [Math.cos(k * 1.7 + n) * 0.1, 0.02, Math.sin(k * 1.7 + n) * 0.1]);
      g.visible = false;
      return g;
    });
    return made;
  });
  setBuildTarget(stage.scene, 0);

  function update() {
    if (S.carrying !== 'hoover') return;
    const level = S.level, job = board.find(HOOVER_JOBS[level]), s = job && board.step(job);
    if (!s || s.kind !== 'hoover') return;
    const here = spots[level], head = player.ahead(0.55);
    for (const d of here) {
      if (!d.visible || Math.hypot(d.position.x - head.x, d.position.z - head.z) > 0.45) continue;
      d.visible = false;
      const left = here.filter(p => p.visible).length;
      job.status = `${here.length - left}/${here.length}`;
      if (left === 0) { job.status = ''; board.advance(job, 'All clean! Put the hoover back'); return; }
      board.refresh();
    }
  }
  /** Start of day: a floor is dusty (needs hoovering) or clean. */
  function reset(level, dirty) { spots[level].forEach(d => { d.visible = dirty; }); }
  return { update, reset };
}

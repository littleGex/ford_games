// Raking leaves (autumn) and shovelling snow (winter): piles lie on the ground, and the rake or the snow
// shovel clears the ones just in front of you, like the hoover does with dust.
import * as THREE from 'three';
import { S } from '../state.js';
import { add, group, mat } from '../core/build.js';

// leaf piles on the back lawn and the slate path; snow on the front path and the pavement
export const LEAF_SPOTS = [[1.4, -6.4], [3.3, -7.3], [2.0, -8.9], [3.4, -10.2], [1.5, -11.6], [2.9, -12.8], [4.35, -8.0], [1.6, -4.6]];
export const SNOW_SPOTS = [[3.9, 10.4], [3.9, 11.3], [3.9, 12.2], [2.0, 13.05], [3.2, 13.05], [4.4, 13.05], [5.3, 13.05]];
export const SWEEPS = {
  rake: { job: 'rake', tool: 'rake', spots: LEAF_SPOTS, done: 'All raked up! Put the rake back' },
  shovel: { job: 'snow', tool: 'shovel', spots: SNOW_SPOTS, done: 'Path clear! Put the shovel back' },
};
const LEAF_COLOURS = ['#d9822b', '#c4472b', '#e0a030', '#b5562a', '#e8b84a'];

export function createSweeping({ board, player, items }) {
  const piles = {
    rake: LEAF_SPOTS.map(([x, z], n) => {
      const g = group(x, 0.02, z);
      for (let k = 0; k < 9; k++) {
        const a = k * 2.4 + n, r = 0.08 + (k % 3) * 0.07;
        add(g, new THREE.BoxGeometry(0.1, 0.012, 0.07), mat(LEAF_COLOURS[(k + n) % 5]), [Math.cos(a) * r, 0.01 + (k % 3) * 0.02, Math.sin(a) * r], null, [0, a, 0]);
      }
      add(g, new THREE.SphereGeometry(0.16, 10, 6), mat(LEAF_COLOURS[n % 5]), [0, 0, 0], [1, 0.35, 1]);
      g.visible = false; return g;
    }),
    shovel: SNOW_SPOTS.map(([x, z]) => {
      const g = group(x, 0.02, z);
      add(g, new THREE.CylinderGeometry(0.32, 0.36, 0.06, 16), mat('#f4f7fa'), [0, 0.03, 0]);
      add(g, new THREE.SphereGeometry(0.15, 10, 6), mat('#ffffff'), [0.08, 0.05, -0.05], [1, 0.4, 1]);
      g.visible = false; return g;
    }),
  };

  function update() {
    const kind = S.carrying === 'rake' ? 'rake' : S.carrying === 'shovel' ? 'shovel' : null;
    if (!kind || S.level !== 0) return;
    const spec = SWEEPS[kind], job = board.find(spec.job), s = job && board.step(job);
    if (!s || s.kind !== kind) return;
    const here = piles[kind], head = player.ahead(0.6);
    for (const p of here) {
      if (!p.visible || Math.hypot(p.position.x - head.x, p.position.z - head.z) > 0.45) continue;
      p.visible = false;
      const left = here.filter(q => q.visible).length;
      job.status = `${here.length - left}/${here.length}`;
      if (left === 0) {
        job.status = '';
        if (kind === 'rake') items.leafBag.visible = true;   // the leaves are in a garden bag, ready for the brown bin
        board.advance(job, spec.done);
        return;
      }
      board.refresh();
    }
  }
  /** Start of day: piles to clear, or already cleared. */
  function reset(kind, lying) { piles[kind].forEach(p => { p.visible = lying; }); }
  return { update, reset };
}

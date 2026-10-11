// Dusty patches across the living room, dining room and hall. The hoover head picks them up.
import * as THREE from 'three';
import { S } from '../state.js';
import { add, group, mat } from '../core/build.js';

const SPOTS = [[2.3, 0.75], [1.5, 3.6], [2.4, 4.7], [0.4, 6.4], [2.5, 6.1], [2.4, 8.4], [4.0, 4.6], [3.95, 5.9]];

export function createHoovering({ board, player }) {
  const dust = new THREE.MeshStandardMaterial({ color: '#8f8a80', transparent: true, opacity: 0.6, depthWrite: false });
  const spots = SPOTS.map(([x, z], n) => {
    const g = group(x, 0.03, z);
    add(g, new THREE.CircleGeometry(0.22, 16), dust, [0, 0, 0], null, [-Math.PI / 2, 0, 0]);
    for (let k = 0; k < 4; k++) add(g, new THREE.SphereGeometry(0.04, 8, 6), mat('#a7a298'), [Math.cos(k * 1.7 + n) * 0.1, 0.02, Math.sin(k * 1.7 + n) * 0.1]);
    return g;
  });

  function update() {
    const job = board.find('hoover'), s = job && board.step(job);
    if (!s || s.kind !== 'hoover' || S.carrying !== 'hoover') return;
    const head = player.ahead(0.55);
    for (const d of spots) {
      if (!d.visible || Math.hypot(d.position.x - head.x, d.position.z - head.z) > 0.45) continue;
      d.visible = false;
      const left = spots.filter(p => p.visible).length;
      job.status = `${spots.length - left}/${spots.length}`;
      if (left === 0) { job.status = ''; board.advance(job, 'All clean! Put the hoover back'); return; }
      board.refresh();
    }
  }
  return { update };
}

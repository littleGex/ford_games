// Esszimmer: long oak table with dark placemats and six blue chairs, ring pendant, oak sideboard with
// the photo wall above, aquarium, radiator under the window, grey accent wall with framed city posters.
import * as THREE from 'three';
import { WALL_HEIGHT as WH } from '../../config.js';
import { M, box, fbox, mat, put, solid } from '../../core/build.js';

function chair(x, z, side) {
  const seat = mat('#2c4a7e');
  box(x - 0.2, z - 0.2, x + 0.2, z + 0.2, 0.08, 0.42, seat);
  box(side < 0 ? x - 0.2 : x + 0.14, z - 0.2, side < 0 ? x - 0.14 : x + 0.2, z + 0.2, 0.55, 0.5, seat);
  [[-0.17, -0.17], [0.17, -0.17], [-0.17, 0.17], [0.17, 0.17]].forEach(([a, b]) =>
    box(x + a - 0.015, z + b - 0.015, x + a + 0.015, z + b + 0.015, 0.42, 0, mat('#8a8f96'), false));
}

export function buildEsszimmer() {
  // table (top at 0.75) — the player walks round it, so one collider covers table and chairs
  fbox(1.0, 6.2, 1.9, 8.1, 0.04, '#b58450', false, 0.71);
  [[1.05, 6.25], [1.85, 6.25], [1.05, 8.05], [1.85, 8.05]].forEach(([x, z]) => box(x - 0.03, z - 0.03, x + 0.03, z + 0.03, 0.71, 0, mat('#9b6f42')));
  solid(0.6, 6.2, 2.3, 8.1);
  [6.55, 7.15, 7.75].forEach(z => {
    box(1.05, z - 0.17, 1.4, z + 0.17, 0.004, 0.75, mat('#2c2f35'), false);
    box(1.5, z - 0.17, 1.85, z + 0.17, 0.004, 0.75, mat('#2c2f35'), false);
  });
  [6.6, 7.2, 7.8].forEach(z => { chair(0.75, z, -1); chair(2.15, z, 1); });
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.02, 8, 32), mat('#c9ccd1'));
  ring.rotation.x = Math.PI / 2; ring.position.set(1.45, 1.32, 7.15); put(ring);

  // sideboard, aquarium, radiator
  fbox(2.82, 6.0, 3.265, 8.3, 0.85, '#c08d55');
  [6.38, 7.15, 7.92].forEach(zc => [0.18, 0.38, 0.58, 0.78].forEach(y => box(2.8, zc - 0.05, 2.82, zc + 0.05, 0.015, y, mat('#d9dcdf'), false)));
  fbox(2.85, 5.64, 3.265, 5.98, 0.7, '#3a3a3a');
  box(2.88, 5.67, 3.24, 5.95, 0.34, 0.7, M.glass, false);
  box(0.7, 8.76, 2.1, 8.86, 0.5, 0.15, mat('#f2f2f2'), false);

  // walls: grey accent wall with posters, light blue wall with the photo wall
  box(0, 5.62, 0.012, 8.88, WH, 0, mat('#6d7279'), false);
  box(3.253, 5.62, 3.265, 8.88, WH, 0, mat('#cdd7e0'), false);
  [[6.0, '#9ed0f0'], [6.8, '#eae3d6'], [7.9, '#dfe4ea']].forEach(([z, c]) => {
    box(0.012, z - 0.18, 0.03, z + 0.18, 0.44, 0.9, mat('#c8a46e'), false);
    box(0.03, z - 0.14, 0.036, z + 0.14, 0.36, 0.94, mat(c), false);
  });
  const photo = ['#e8b08f', '#6fa35a', '#d9a07b', '#8cc4e8', '#f2c6a8', '#c96a4f', '#e9d6b8'];
  [1.02, 1.2].forEach((y, r) => { for (let k = 0; k < 7; k++) { const z = 6.2 + k * 0.29; box(3.235, z - 0.08, 3.253, z + 0.08, 0.15, y, mat(photo[(k + r * 3) % 7]), false); } });
  return {};
}

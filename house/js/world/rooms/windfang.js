// Windfang: red brick-pattern tiles, light wood coat rail with coats, doormat, ball,
// and the front door standing open (white inside, anthracite outside, narrow glass strip).
import * as THREE from 'three';
import { M, add, ball, box, group, mat, solid } from '../../core/build.js';

export function buildWindfang() {
  box(3.38, 7.2, 3.44, 8.75, 0.07, 1.22, mat('#e2c79a'), false);
  [7.35, 7.6, 7.95, 8.3].forEach(z => box(3.44, z - 0.015, 3.5, z + 0.015, 0.12, 1.12, mat('#b8bcc2'), false));
  [[7.35, '#d8f000', 0.75], [7.6, '#1d1f24', 0.8], [8.3, '#8a5a24', 0.9]].forEach(([z, c, h]) => {
    box(3.45, z - 0.17, 3.72, z + 0.17, h, 1.18 - h, mat(c)).rotation.z = 0.04;
    box(3.47, z - 0.1, 3.66, z + 0.1, 0.18, 1.12, mat(c));   // hood
  });
  solid(3.38, 7.15, 3.6, 8.5);
  box(3.6, 8.4, 4.25, 8.84, 0.012, 0, mat('#3c4048'), false);   // doormat
  ball(4.25, 0.12, 7.3, 0.12, '#2c4fb0');

  const door = group(3.55, 0, 8.88); door.rotation.y = 1.35;
  const leaf = new THREE.Mesh(new THREE.BoxGeometry(0.75, 1.36, 0.05), [M.frame, M.frame, M.frame, M.frame, mat('#f3f3f0'), M.frame]);
  leaf.position.set(0.375, 0.68, -0.03); leaf.castShadow = true; door.add(leaf);
  add(door, new THREE.BoxGeometry(0.09, 0.9, 0.06), M.glass, [0.28, 0.72, -0.03]);
  add(door, new THREE.CylinderGeometry(0.012, 0.012, 0.8, 8), mat('#c9ccd1'), [0.6, 0.7, -0.075]);
  return {};
}

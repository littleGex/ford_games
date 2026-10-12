// P's room (Kinderzimmer on the plan; the smaller bedroom, front left): pink quilted daybed along the gable wall with paintings
// and a football-shirt bunting above it, pine bookshelf in the corner by the window, white desk with the
// blue chair, grey-green wardrobe by the door, a little wooden craft table and a toy box.
import * as THREE from 'three';
import { WALL_HEIGHT as WH } from '../../config.js';
import { canvasTex } from '../../core/textures.js';
import { add, box, cyl, fbox, group, mat } from '../../core/build.js';
import { makeBed } from './elternzimmer.js';

const patchwork = canvasTex(g => {
  const cols = ['#8fc1c9', '#e78fa8', '#6f7a46', '#f2e3c4', '#5d7fa6', '#e9b7c8'];
  for (let i = 0; i < 8; i++) { g.fillStyle = cols[i % cols.length]; g.fillRect(0, i * 32, 256, 32); }
});

export function buildKinderzimmer() {
  // P's bed (a daybed): quilted mauve frame, dark grey mattress, back against the gable wall
  const mauve = '#a88f97';
  fbox(0.05, 5.85, 0.98, 7.85, 0.38, mauve);
  box(0.05, 5.85, 0.2, 7.85, 0.85, 0, mat(mauve));
  box(0.05, 5.85, 0.98, 6.0, 0.7, 0, mat(mauve));
  box(0.2, 6.0, 0.95, 7.82, 0.08, 0.38, mat('#4a4d55'), false);
  const quilt = new THREE.MeshStandardMaterial({ map: patchwork, roughness: 0.9 });
  const daybed = makeBed(0.2, 6.0, 0.95, 7.82, 0.46, quilt);

  // paintings and the football-shirt bunting on the gable wall
  [[6.2, '#4d6fb8'], [6.6, '#6a8fd0'], [7.0, '#e8a1b4'], [7.35, '#9ad0c8'], [7.7, '#f0c27a']].forEach(([z, c], i) =>
    box(0.012, z - 0.14, 0.02, z + 0.14, 0.26, 0.9 + (i % 2) * 0.12, mat(c), false));
  box(0.02, 5.9, 0.025, 7.9, 0.006, 1.32, mat('#c94b6b'), false);
  ['#c0392b', '#2f6fd6', '#f2f2f2', '#3a9d5d', '#c0392b', '#7fb6e8', '#f2d14a'].forEach((c, i) =>
    box(0.02, 6.0 + i * 0.27, 0.03, 6.12 + i * 0.27, 0.11, 1.2, mat(c), false));

  // pine bookshelf in the corner, toys on top
  fbox(0.05, 7.95, 0.45, 8.85, WH - 0.05, '#d9a95c');
  ['#c0392b', '#2f6fd6', '#f2c81c', '#3a9d5d', '#8e44ad'].forEach((c, i) =>
    box(0.38, 8.0 + i * 0.16, 0.42, 8.13 + i * 0.16, 0.22, 0.55 + (i % 2) * 0.3, mat(c), false));
  fbox(0.08, 8.2, 0.42, 8.6, 0.25, '#3d3fa8', false, WH - 0.05);

  // white desk along the wall by the door, blue chair
  fbox(2.6, 7.3, 3.18, 8.8, 0.72, '#f2f2f2');
  ['#f2a1b8', '#fff', '#9fd0f0'].forEach((c, i) => box(2.75 + i * 0.1, 7.5 + i * 0.35, 3.0 + i * 0.05, 7.8 + i * 0.35, 0.02, 0.72, mat(c), false));
  const chair = group(2.3, 0, 8.05);
  add(chair, new THREE.CylinderGeometry(0.2, 0.22, 0.06, 16), mat('#7fb8c4'), [0, 0.45, 0]);
  add(chair, new THREE.BoxGeometry(0.06, 0.45, 0.38), mat('#7fb8c4'), [-0.18, 0.72, 0]);
  add(chair, new THREE.CylinderGeometry(0.03, 0.03, 0.42, 8), mat('#d9dcdf'), [0, 0.22, 0]);
  fbox(2.12, 7.88, 2.48, 8.22, 0.01, '#7fb8c4');

  // grey-green wardrobe next to the door
  fbox(2.6, 6.65, 3.18, 7.25, WH - 0.02, '#8a9690');
  [6.92, 6.98].forEach(z => box(2.58, z - 0.01, 2.6, z + 0.01, 0.3, 0.6, mat('#c9ccd1'), false));

  // little wooden craft table covered in paper, toy box under the window
  fbox(1.35, 6.55, 2.0, 7.15, 0.55, '#d9b07a');
  ['#f07a2a', '#f2f2f2', '#e86a8a', '#7ad3c9'].forEach((c, i) => box(1.4 + i * 0.12, 6.6 + i * 0.1, 1.65 + i * 0.1, 6.85 + i * 0.1, 0.01, 0.55 + i * 0.004, mat(c), false));
  const toyBox = new THREE.MeshStandardMaterial({ color: '#dfe8ee', transparent: true, opacity: 0.6 });
  box(0.55, 8.35, 1.05, 8.8, 0.35, 0, toyBox);
  fbox(0.55, 8.35, 1.05, 8.8, 0.01, '#dfe8ee');
  box(1.05, 8.78, 2.05, 8.86, 0.5, 0.15, mat('#f2f2f2'), false);   // radiator under the window
  return { daybed };
}

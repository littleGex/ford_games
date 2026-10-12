// P's room (Kinderzimmer on the plan; the smaller bedroom, front left): pink quilted daybed along the gable wall with paintings
// and a football-shirt bunting above it, pine bookshelf in the corner by the window, white desk with the
// blue chair, grey-green wardrobe by the door, a little wooden craft table and a toy box.
// P's bearded dragon lives in a terrarium on a low cabinet against the wall to the big bedroom.
import * as THREE from 'three';
import { WALL_HEIGHT as WH } from '../../config.js';
import { canvasTex } from '../../core/textures.js';
import { M, add, ball, box, cyl, fbox, group, mat, put } from '../../core/build.js';
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
  { const t = CRAFT_TABLE;
    fbox(t.x1, t.z1, t.x2, t.z2, 0.55, '#d9b07a');
    ['#f07a2a', '#f2f2f2', '#e86a8a', '#7ad3c9'].forEach((c, i) => box(t.x1 + 0.05 + i * 0.12, t.z1 + 0.05 + i * 0.1, t.x1 + 0.3 + i * 0.1, t.z1 + 0.3 + i * 0.1, 0.01, 0.55 + i * 0.004, mat(c), false)); }
  const toyBox = new THREE.MeshStandardMaterial({ color: '#dfe8ee', transparent: true, opacity: 0.6 });
  box(0.55, 8.35, 1.05, 8.8, 0.35, 0, toyBox);
  fbox(0.55, 8.35, 1.05, 8.8, 0.01, '#dfe8ee');
  box(1.05, 8.78, 2.05, 8.86, 0.5, 0.15, mat('#f2f2f2'), false);   // radiator under the window

  // the terrarium: white cabinet, sandy floor, rocky back wall, a branch and a rock to climb, glass front
  // and sides, black frame, and the basking lamp on top glowing warm over the rock
  const T = TERRARIUM, y0 = 0.45, h = 0.42;
  fbox(T.x1, T.z1, T.x2, T.z2, y0, '#ece8e0');
  box(T.x1 + 0.03, T.z1 + 0.03, T.x2 - 0.03, T.z2 - 0.03, 0.04, y0, mat('#d9b57a'), false);                    // sand
  box(T.x1 + 0.02, T.z1 + 0.02, T.x2 - 0.02, T.z1 + 0.04, h, y0, mat('#8a6b4c'), false);                        // rocky back
  box(T.x1, T.z2 - 0.015, T.x2, T.z2, h, y0, M.glass, false);                                                  // front glass
  [T.x1, T.x2 - 0.015].forEach(x => box(x, T.z1, x + 0.015, T.z2, h, y0, M.glass, false));                     // side glass
  const frame = mat('#1d1e22');
  [[T.x1, T.z2 - 0.02, T.x2, T.z2], [T.x1, T.z1, T.x2, T.z1 + 0.02]].forEach(([a, b, c, d]) => {
    box(a, b, c, d, 0.02, y0 + h - 0.02, frame, false); box(a, b, c, d, 0.04, y0, frame, false);
  });
  [T.x1, T.x2 - 0.02].forEach(x => [T.z1, T.z2 - 0.02].forEach(z => box(x, z, x + 0.02, z + 0.02, h, y0, frame, false)));
  const branch = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.025, 0.55, 8), mat('#6b4a2e'));
  branch.position.set(T.x1 + 0.35, y0 + 0.17, T.z1 + 0.15); branch.rotation.set(0.2, 0, -1.05); put(branch);
  ball(T.bask[0], y0 + 0.06, T.bask[1] - 0.04, 0.09, '#8f8a82', [1.3, 0.55, 1]);                                 // basking rock
  const lamp = group(T.bask[0], y0 + h, T.bask[1]);
  add(lamp, new THREE.CylinderGeometry(0.06, 0.09, 0.07, 16), mat('#2b2d31'), [0, 0.035, 0]);
  add(lamp, new THREE.CircleGeometry(0.075, 16), new THREE.MeshBasicMaterial({ color: '#ffd27a' }), [0, -0.001, 0], null, [Math.PI / 2, 0, 0]);
  const warm = new THREE.Mesh(new THREE.CircleGeometry(0.14, 20), new THREE.MeshBasicMaterial({ color: '#ffcf6b', transparent: true, opacity: 0.35, depthWrite: false }));
  warm.rotation.x = -Math.PI / 2; warm.position.set(T.bask[0], y0 + 0.045, T.bask[1]); put(warm);              // warm spot on the sand

  // its mess (cleaning day) and a few crickets while it's being fed
  const dragonMess = group(T.x1 + 0.55, y0 + 0.045, T.z2 - 0.1);
  [[0, 0], [0.04, 0.02], [-0.03, 0.03]].forEach(([x, z]) => add(dragonMess, new THREE.SphereGeometry(0.014, 8, 6), mat('#5a4330'), [x, 0.008, z], [1.4, 0.7, 1]));
  dragonMess.visible = false;
  const crickets = group(T.food[0], y0 + 0.05, T.food[1]);
  [[0, 0], [0.05, 0.02], [-0.04, 0.03], [0.02, -0.04], [0.06, -0.02]].forEach(([x, z]) => add(crickets, new THREE.BoxGeometry(0.022, 0.01, 0.008), mat('#4a3a22'), [x, 0.005, z], null, [0, x * 20, 0]));
  [[0.0, 0.05], [-0.05, -0.02]].forEach(([x, z]) => add(crickets, new THREE.BoxGeometry(0.03, 0.004, 0.02), mat('#5fae3d'), [x, 0.002, z]));   // greens
  crickets.visible = false;
  return { daybed, dragonMess, crickets };
}

// P's little craft table in the middle of her room
export const CRAFT_TABLE = { x1: 1.52, z1: 6.78, x2: 2.07, z2: 7.28 };   // room to walk round it on every side

// P's terrarium on the wall to the big bedroom, next to the head of her bed. bask: under the lamp;
// food: where the crickets go; at: where you stand to look after the dragon.
export const TERRARIUM = { x1: 1.0, z1: 5.72, x2: 1.95, z2: 6.15, bask: [1.68, 5.92], food: [1.28, 6.02], at: [2.3, 6.35], floor: 0.49 };

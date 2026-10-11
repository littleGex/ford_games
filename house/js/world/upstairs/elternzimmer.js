// Elternzimmer (main bedroom): double bed with the head against the gable wall, oak bedside tables,
// dark curtain panels either side of the French window, white gloss wardrobes along the wall to the
// kids' room, oak chests of drawers, radiator by the window.
import * as THREE from 'three';
import { WALL_HEIGHT as WH } from '../../config.js';
import { canvasTex } from '../../core/textures.js';
import { add, box, castShadows, cyl, fbox, group, mat } from '../../core/build.js';

// white bedding with pink and green fan leaves
export const leafPrint = canvasTex(g => {
  g.fillStyle = '#f6f4f1'; g.fillRect(0, 0, 256, 256);
  const cols = ['#e7928a', '#7fa38f', '#37414d', '#e7928a'];
  for (let i = 0; i < 14; i++) {
    const x = (i * 73) % 256, y = (i * 131) % 256;
    g.fillStyle = cols[i % 4]; g.beginPath(); g.moveTo(x, y); g.arc(x, y, 20, -2.4, -0.7); g.closePath(); g.fill();
  }
});

/** A bed whose duvet can be messy or made. */
export function makeBed(x1, z1, x2, z2, top, duvetMat) {
  const neat = group(), messy = group();
  const w = x2 - x1, d = z2 - z1;
  add(neat, new THREE.BoxGeometry(w - 0.45, 0.08, d - 0.06), duvetMat, [x1 + 0.45 + (w - 0.45) / 2, top + 0.04, (z1 + z2) / 2]);
  add(neat, new THREE.BoxGeometry(w - 0.45, 0.04, 0.05), duvetMat, [x1 + 0.45 + (w - 0.45) / 2, top + 0.02, z2 - 0.01]);
  [[0.25, 0.55], [0.35, 0.6], [0.3, 0.45], [0.2, 0.5]].forEach(([sx, sz], i) => {
    add(messy, new THREE.SphereGeometry(0.3, 12, 8), duvetMat, [x1 + 0.6 + (i % 2) * 0.6 + i * 0.12, top + 0.05, z1 + 0.35 + i * (d - 0.7) / 3], [sx * 3.2, 0.32, sz * 2]);
  });
  castShadows(neat); castShadows(messy);
  return {
    make() { neat.visible = true; messy.visible = false; },
    mess() { neat.visible = false; messy.visible = true; },
  };
}

export function buildElternzimmer() {
  const oak = '#cfa66e';
  // bed: oak frame, white mattress, pillows at the gable wall
  fbox(0.05, 1.0, 2.05, 2.8, 0.3, oak);
  box(0.05, 1.0, 0.15, 2.8, 0.75, 0, mat(oak));                   // headboard
  box(0.15, 1.05, 2.0, 2.75, 0.14, 0.3, mat('#f4f3f0'), false);   // mattress
  const print = new THREE.MeshStandardMaterial({ map: leafPrint, roughness: 0.9 });
  [1.45, 2.35].forEach(z => add(group(), new THREE.BoxGeometry(0.35, 0.12, 0.7), print, [0.4, 0.5, z]));
  const bed = makeBed(0.15, 1.05, 2.0, 2.75, 0.44, print);

  // bedside tables, one lamp
  fbox(0.05, 0.5, 0.5, 0.95, 0.5, oak);
  fbox(0.05, 2.85, 0.5, 3.3, 0.5, oak);
  cyl(0.28, 3.07, 0.1, 0.32, '#f2efe9', 0.5);

  // window dressing and radiator
  box(0.72, 0.0, 0.98, 0.05, 1.38, 0, mat('#2f3238'), false);
  box(2.32, 0.0, 2.58, 0.05, 1.38, 0, mat('#2f3238'), false);
  box(2.65, 0.02, 3.0, 0.1, 0.6, 0.15, mat('#f2f2f2'), false);

  // white gloss wardrobes along the wall to the kids' room
  const gloss = new THREE.MeshStandardMaterial({ color: '#f1efea', roughness: 0.25, metalness: 0.05 });
  box(0.5, 5.0, 2.75, 5.6, WH - 0.02, 0, gloss);
  for (let x = 0.5 + 0.375; x < 2.75; x += 0.375 * 2) box(x - 0.005, 4.99, x + 0.005, 5.0, WH - 0.1, 0.05, mat('#c9c6bf'), false);
  [1.07, 1.82, 2.5].forEach(x => box(x - 0.012, 4.97, x + 0.012, 4.99, 0.22, 0.75, mat('#b5b9be'), false));
  fbox(0.5, 5.0, 2.75, 5.6, 0.01, '#f1efea');   // collider

  // oak chests of drawers: a wide one by the gable wall, a tall narrow one by the dressing-room wall
  fbox(0.05, 3.6, 0.5, 4.9, 0.95, oak);
  [0.2, 0.42, 0.64].forEach(y => box(0.5, 3.65, 0.51, 4.85, 0.01, y, mat('#a8844f'), false));
  fbox(2.6, 2.95, 3.04, 3.55, 1.2, oak);
  ['#7fc4a8', '#f2d0a0', '#e9e4dc', '#8fb6d9'].forEach((c, i) => cyl(0.15 + i * 0.09, 4.0 + i * 0.22, 0.04, 0.16, c, 0.95));   // bottles and pots on top
  return { bigBed: bed };
}

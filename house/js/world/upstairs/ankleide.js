// Ankleide (dressing room): oak sliding wardrobe on one side, grey glass sliding wardrobe on the other,
// a little desk shelf with a radio, a pink toy kitchen and plants on the sill under the window,
// laundry hampers by the door.
import * as THREE from 'three';
import { WALL_HEIGHT as WH } from '../../config.js';
import { box, cyl, fbox, mat } from '../../core/build.js';

export function buildAnkleide() {
  // oak sliding doors with the thin aluminium strips
  fbox(3.17, 0.95, 3.77, 3.85, WH - 0.02, '#c69a62');
  [0.35, 0.7, 1.05].forEach(y => box(3.77, 0.97, 3.78, 3.83, 0.012, y, mat('#d6d9dc'), false));
  box(3.77, 2.39, 3.79, 2.41, WH - 0.05, 0.02, mat('#d6d9dc'), false);
  // grey glass sliding wardrobe
  const glass = new THREE.MeshStandardMaterial({ color: '#8f979c', roughness: 0.15, metalness: 0.2 });
  box(5.0, 0.8, 5.64, 3.85, WH - 0.02, 0, glass);
  [0.45, 0.95].forEach(y => box(4.99, 0.82, 5.0, 3.83, 0.015, y, mat('#d6d9dc'), false));
  box(4.98, 2.31, 5.0, 2.34, WH - 0.05, 0.02, mat('#d6d9dc'), false);
  fbox(5.0, 0.8, 5.64, 3.85, 0.01, '#8f979c');

  // desk shelf with a radio by the window
  box(3.17, 0.12, 3.47, 0.85, 0.03, 0.72, mat('#c69a62'), false);
  fbox(3.22, 0.3, 3.38, 0.5, 0.1, '#5a5f66', false, 0.75);

  // pink toy kitchen with a teal palm, under the window
  fbox(3.9, 0.05, 4.75, 0.45, 0.65, '#ef9db8');
  box(3.95, 0.1, 4.7, 0.42, 0.04, 0.65, mat('#7ad3c9'), false);
  cyl(4.1, 0.25, 0.015, 0.35, '#5fd0c0', 0.69);
  cyl(4.1, 0.25, 0.12, 0.02, '#5fd0c0', 1.04);
  box(4.85, 0.02, 5.25, 0.1, 0.55, 0.15, mat('#f2f2f2'), false);   // radiator
  ['#c76a3c', '#3f9e5a', '#d9a441', '#c76a3c'].forEach((c, i) => cyl(4.25 + i * 0.25, -0.1, 0.05, 0.1, c, 0.82));   // pots on the sill

  // laundry hampers by the door (grey bin and a wooden-framed bag)
  fbox(4.4, 3.35, 4.7, 3.82, 0.6, '#9aa0a6');
  fbox(4.72, 3.35, 4.98, 3.82, 0.55, '#c9c2b4');
  return {};
}

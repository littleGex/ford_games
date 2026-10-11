// Küche: white U-shaped kitchen with black worktops. Sink and hob on the party-wall side, tall oven and
// microwave column by the door, side-by-side fridge covered in magnets, espresso machine, paper star.
import * as THREE from 'three';
import { WALL_HEIGHT as WH } from '../../config.js';
import { add, box, cyl, fbox, group, mat, solid } from '../../core/build.js';

export function buildKueche() {
  const white = mat('#ecebe6'), top = mat('#1c1d20'), steel = mat('#b9bec4');
  const counter = (x1, z1, x2, z2) => {
    box(x1, z1, x2, z2, 0.86, 0, white);
    box(x1 - 0.01, z1 - 0.01, x2 + 0.01, z2 + 0.01, 0.04, 0.86, top, false);
    solid(x1, z1, x2, z2);
  };
  counter(5.04, 0.05, 5.64, 2.3);   // party-wall run
  counter(3.38, 0.05, 5.04, 0.65);  // under the window
  counter(3.38, 0.65, 3.98, 2.95);  // left run

  box(5.1, 0.45, 5.56, 1.05, 0.02, 0.9, steel, false);              // sink
  box(5.12, 0.5, 5.54, 1.0, 0.025, 0.885, mat('#7d848c'), false);
  cyl(5.6, 0.75, 0.015, 0.22, '#c9ccd1', 0.9);                       // tap
  box(5.08, 1.35, 5.6, 1.95, 0.012, 0.9, mat('#0d0e10'), false);    // induction hob

  box(5.04, 2.3, 5.64, 3.85, WH, 0, white); solid(5.04, 2.3, 5.64, 3.85);   // oven column
  box(5.025, 2.45, 5.04, 3.1, 0.36, 0.95, mat('#111214'), false);           // microwave
  box(5.025, 2.45, 5.04, 3.1, 0.5, 0.4, steel, false);                      // oven
  box(5.02, 2.5, 5.03, 3.05, 0.02, 0.82, mat('#d9dcdf'), false);

  fbox(3.38, 3.0, 3.95, 3.82, WH - 0.02, '#45484d');                        // fridge
  box(3.95, 3.4, 3.96, 3.42, 0.7, 0.35, mat('#9aa1a8'), false);
  ['#e74c3c', '#f2c81c', '#3a9d5d', '#2f6fd6', '#ffffff', '#e67e22', '#8e44ad'].forEach((c, i) =>
    box(3.951, 3.06 + (i * 0.11) % 0.7, 3.958, 3.14 + (i * 0.11) % 0.7, 0.08, 0.45 + (i * 0.13) % 0.75, mat(c), false));

  const star = group(4.5, 1.05, 0.04);                                       // paper star in the window
  for (let k = 0; k < 7; k++) { const p = add(star, new THREE.ConeGeometry(0.035, 0.2, 4), mat('#f4efe4'), [Math.sin(k * 0.9) * 0.1, Math.cos(k * 0.9) * 0.1, 0]); p.rotation.z = -k * 0.9; }

  fbox(4.2, 0.1, 4.5, 0.4, 0.18, '#e6e6e6', false, 0.9);   // rice cooker
  box(4.6, 0.12, 5.0, 0.5, 0.06, 0.9, mat('#2a2c30'), false); // dish rack
  cyl(4.75, 0.3, 0.12, 0.12, '#e8402a', 0.9);               // red bowl
  cyl(3.65, 0.35, 0.07, 0.2, '#f0f0ec', 0.9);               // kettle
  fbox(4.15, 3.2, 4.5, 3.45, 0.22, '#d93b2f', false);       // bread bin
  cyl(4.4, 0.95, 0.17, 0.08, '#e8402a'); cyl(4.4, 0.95, 0.17, 0.08, '#2f6fd6', 0.08); // stools

  // espresso machine with grinder; steam rises while a coffee is being made
  box(3.42, 0.75, 3.84, 1.15, 0.38, 0.9, steel);
  box(3.42, 0.75, 3.84, 1.15, 0.03, 1.28, mat('#1c1d20'), false);
  box(3.84, 0.82, 3.88, 1.08, 0.02, 0.9, mat('#2a2c30'), false);
  cyl(3.8, 0.95, 0.04, 0.05, '#2a2c30', 1.08);
  box(3.84, 0.93, 4.02, 0.97, 0.03, 1.03, mat('#151517'), false);
  cyl(3.6, 1.32, 0.07, 0.32, '#2a2c30', 0.9); cyl(3.6, 1.32, 0.06, 0.1, '#9aa1a8', 1.22);
  const steam = group(3.86, 1.0, 0.95); steam.visible = false;
  const steamMat = new THREE.MeshStandardMaterial({ color: '#ffffff', transparent: true, opacity: 0.5, depthWrite: false });
  for (let k = 0; k < 3; k++) add(steam, new THREE.SphereGeometry(0.03, 8, 6), steamMat, [0, k * 0.08, 0]);

  // steam over the hob while food is cooking
  const potSteam = group(5.34, 1.05, 1.65); potSteam.visible = false;
  for (let k = 0; k < 5; k++) add(potSteam, new THREE.SphereGeometry(0.045, 8, 6), steamMat, [Math.sin(k * 2.3) * 0.06, k * 0.06, Math.cos(k * 2.3) * 0.05]);

  return { steam, potSteam };
}

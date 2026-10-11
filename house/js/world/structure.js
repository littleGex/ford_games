// The shell of the house: ground, floors, walls with doors and windows, brick facades,
// the stairs with the cupboard underneath, and the neighbours on both sides (it's a terrace row).
import * as THREE from 'three';
import { WALL_HEIGHT as WH } from '../config.js';
import { TEX } from '../core/textures.js';
import { M, box, brickMat, facade, floor, mat, run, solid, wall, put } from '../core/build.js';

export function buildStructure() {
  // ground and street
  floor(-14, -20, 20, 24, TEX.grass, 2, 0);
  floor(-14, 12.6, 20, 13.6, TEX.paving, 0.8, 0.02);       // Gehweg
  box(-14, 13.55, 20, 13.68, 0.09, 0, mat('#9a968f'), false); // kerb
  floor(-14, 13.68, 20, 24, TEX.asphalt, 2, 0.01);          // street

  // neighbours: party-wall side and gable side
  for (const [x1, x2] of [[5.76, 11.6], [-6.2, -0.345]]) {
    box(x1, -0.42, x2, 9.3, WH, 0, brickMat(x2 - x1, WH));
    box(x1, -0.42, x2, 9.3, .03, WH, M.cap, false);
    solid(x1, -0.42, x2, 9.3);
  }

  // floors (inner dimensions from the plan)
  floor(0, 0, 3.265, 8.88, TEX.parquet, 0.6);                                   // Wohnzimmer + Esszimmer
  floor(3.38, 0, 5.64, 3.885, TEX.greytile, 1.2).material.color.set('#5a5f67'); // Küche, dark slate
  floor(3.38, 4.0, 5.64, 6.76, TEX.parquet, 0.6);                               // Flur
  floor(4.68, 4.0, 5.64, 5.0, TEX.tile, 0.5, 0.025);                            // Abstellraum
  floor(3.38, 6.875, 4.45, 8.88, TEX.redtile, 0.55);                            // Windfang
  floor(4.565, 6.875, 5.64, 8.88, TEX.greytile, 1.2);                           // WC

  // walls
  const BACK = [[1.05, 2.25, 'door'], [3.95, 5.05, 'win']];   // French door, kitchen window
  const FRONT = [[0.4, 2.4, 'win'], [3.55, 4.3, 'door']];     // dining window, front door
  wall(-0.3, -0.375, 0, 9.255);                                // gable wall
  wall(5.64, -0.375, 5.76, 9.255);                             // party wall
  run('x', 0, 5.64, -0.375, 0, BACK);
  run('x', 0, 5.64, 8.88, 9.255, FRONT);
  facade(-0.3, 5.64, 9.255, 9.3, FRONT);
  facade(-0.3, 5.64, -0.42, -0.375, BACK);
  box(-0.345, -0.42, -0.3, 9.3, WH, 0, brickMat(9.7, WH));
  run('z', 0, 8.88, 3.265, 3.38, [[4.3, 5.2, 'door']]);        // living | hall (glass door)
  run('x', 3.38, 5.64, 3.885, 4.0, [[3.95, 4.6, 'door']]);     // kitchen | hall
  run('x', 3.38, 5.64, 6.76, 6.875, [[3.55, 4.3, 'door']]);    // hall | Windfang
  run('z', 6.875, 8.88, 4.45, 4.565, [[7.75, 8.5, 'door']]);   // Windfang | WC
  wall(0, 5.51, 0.35, 5.62);                                   // stub between living and dining

  // stairs: steps over the cupboard are see-through so you can look inside from above
  const ghost = new THREE.MeshStandardMaterial({ color: '#c99a6b', transparent: true, opacity: 0.3, depthWrite: false });
  for (let i = 0; i < 12; i++) {
    const z2 = 6.76 - i * 0.21, h = (i + 1) * (WH / 12);
    if (z2 - 0.21 < 5.06) box(4.68, z2 - 0.21, 5.64, z2, 0.05, h - 0.05, ghost, false);
    else box(4.65, z2 - 0.21, 5.64, z2, h, 0, mat(i % 2 ? '#b88a5c' : '#c99a6b'));
  }
  solid(4.65, 5.06, 5.64, 6.76);

  // Abstellraum: pine-panelled cupboard under the stairs, door from the hall
  const pine = mat('#c98d4e');
  box(4.62, 4.0, 4.68, 4.12, WH, 0, pine); box(4.62, 4.85, 4.68, 5.06, WH, 0, pine); box(4.68, 5.0, 5.64, 5.06, WH, 0, pine);
  solid(4.62, 4.0, 4.68, 4.12); solid(4.62, 4.85, 4.68, 5.06);
  box(5.42, 4.05, 5.64, 4.75, 1.3, 0, mat('#efece4'));        // meter & PV cabinet
  box(5.2, 4.78, 5.64, 4.98, 0.9, 0, mat('#9aa1a8'));         // home battery
  const led = new THREE.Mesh(new THREE.SphereGeometry(0.02, 8, 6), new THREE.MeshStandardMaterial({ color: '#3fd394', emissive: '#3fd394' }));
  led.position.set(5.3, 0.6, 4.77); put(led);
  solid(5.2, 4.05, 5.64, 5.0);
}

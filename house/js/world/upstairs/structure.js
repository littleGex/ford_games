// Obergeschoss shell, from the 1:100 plan. Built into the upstairs group, so y = 0 is the upstairs floor.
//   Elternzimmer  back left   x 0..3.05,     z 0..5.6     (French window with a Juliet balcony)
//   Ankleide      back right  x 3.17..5.64,  z 0..3.9     (dressing room, plan: Kinderzimmer I)
//   Flur          middle      x 3.32..4.6,   z 4.0..6.85  (stairwell x 4.6..5.64 next to it)
//   Kinderzimmer  front left  x 0..3.2,      z 5.7..8.88  (plan: Kinderzimmer II)
//   Bad           front right x 3.32..5.64,  z 6.95..8.88
import * as THREE from 'three';
import { WALL_HEIGHT as WH, LEVEL_HEIGHT } from '../../config.js';
import { TEX, canvasTex } from '../../core/textures.js';
import { M, box, brickMat, facade, floor, mat, put, run, solid, wall } from '../../core/build.js';

// warm mid-oak laminate, long planks, as on the photos
const laminate = canvasTex(g => {
  for (let r = 0; r < 8; r++) {
    g.fillStyle = ['#9a6a42', '#8f6139', '#a3724a', '#94663e'][r % 4]; g.fillRect(0, r * 32, 256, 31);
    g.fillStyle = '#6e4a2a'; g.fillRect(0, r * 32 + 31, 256, 1);
    const off = (r * 89) % 256; g.fillRect(off, r * 32, 1, 32);
    g.fillStyle = 'rgba(60,35,15,.18)'; for (let k = 0; k < 6; k++) g.fillRect((off + k * 41) % 256, r * 32 + 8 + (k % 3) * 7, 30, 1);
  }
});

export const STAIRWELL = { x1: 4.6, z1: 4.0, x2: 5.64, z2: 6.85 };

export function buildUpstairsStructure() {
  // floor slab: the whole house apart from the stairwell (underside dark so it reads as a ceiling)
  const slab = mat('#3a3f48');
  const S = STAIRWELL;
  [[-0.3, -0.375, 5.76, S.z1], [-0.3, S.z2, 5.76, 9.255], [-0.3, S.z1, S.x1, S.z2]].forEach(([x1, z1, x2, z2]) => box(x1, z1, x2, z2, 0.16, -0.17, slab, false));

  // floors
  floor(0, 0, 3.32, 8.88, laminate, 1.4, 0.005);
  floor(3.17, 0, 5.64, 4.0, laminate, 1.4, 0.006);
  floor(3.32, 4.0, 4.6, 6.95, laminate, 1.4, 0.006);
  floor(3.32, 6.95, 5.64, 8.88, TEX.greytile, 1.2, 0.007).material.color.set('#b9b5ae');   // bathroom tiles

  // outer walls, windows and brick skins (same openings inside and out)
  const BACK = [[1.0, 2.3, 'win'], [4.05, 5.25, 'win']];   // bedroom French window, dressing room window
  const FRONT = [[0.6, 2.4, 'win'], [4.4, 5.0, 'win']];    // kids' room, bathroom
  wall(-0.3, -0.375, 0, 9.255);
  wall(5.64, -0.375, 5.76, 9.255);
  run('x', 0, 5.64, -0.375, 0, BACK);
  run('x', 0, 5.64, 8.88, 9.255, FRONT);
  facade(-0.3, 5.64, 9.255, 9.3, FRONT);
  facade(-0.3, 5.64, -0.42, -0.375, BACK);
  box(-0.345, -0.42, -0.3, 9.3, WH, 0, brickMat(9.7, WH));
  // Juliet balcony rail outside the bedroom window
  box(0.95, -0.47, 2.35, -0.44, 0.04, 0.95, mat('#d8dce0'), false);
  for (let x = 1.0; x <= 2.31; x += 0.12) box(x, -0.465, x + 0.015, -0.445, 0.15, 0.8, mat('#d8dce0'), false);

  // brick band between the top of the ground-floor walls and this floor, so there's no gap from outside
  const band = LEVEL_HEIGHT - WH, y0 = -band;
  [[-0.345, -0.42, 5.76, -0.375], [-0.345, 9.255, 5.76, 9.3], [-0.345, -0.42, -0.3, 9.3]].forEach(([x1, z1, x2, z2]) =>
    box(x1, z1, x2, z2, band - 0.17, y0, brickMat(Math.max(x2 - x1, z2 - z1), band), false));

  // neighbours' first floors either side
  for (const [x1, x2] of [[5.76, 11.6], [-6.2, -0.345]]) {
    box(x1, -0.42, x2, 9.3, WH, 0, brickMat(x2 - x1, WH));
    box(x1, -0.42, x2, 9.3, .03, WH, M.cap, false);
    box(x1, -0.42, x2, 9.3, 0.16, -0.17, slab, false);
    box(x1, -0.42, x2, 9.3, band - 0.17, y0, brickMat(x2 - x1, band), false);
  }

  // inside walls
  wall(3.05, 0, 3.17, 3.9);                                          // bedroom | dressing room
  run('x', 3.05, 5.64, 3.9, 4.0, [[3.45, 4.25, 'door']]);           // dressing room | landing
  run('z', 3.9, 8.88, 3.2, 3.32, [[4.1, 4.9, 'door'], [5.85, 6.6, 'door']]);   // bedroom & kids' room | landing
  wall(0, 5.6, 3.2, 5.7);                                            // bedroom | kids' room
  run('x', 3.32, 5.64, 6.85, 6.95, [[3.5, 4.25, 'door']]);          // landing | bathroom

  // stairwell: wooden banister round the opening, open at the top where you step off
  const pine = mat('#c98d4e');
  box(4.55, 4.75, 4.62, S.z2, 0.9, 0, pine);
  box(4.53, 4.75, 4.64, S.z2, 0.05, 0.9, pine, false);
  box(4.6, 4.0, 5.64, 4.06, 0.9, 0, pine);
  solid(4.55, 4.75, 5.64, S.z2); solid(4.62, 4.0, 5.64, 4.75);
  // the top three steps, so the stairs read as arriving up here
  for (let i = 0; i < 3; i++) box(4.65, 4.06 + i * 0.22, 5.64, 4.28 + i * 0.22, 0.05, -0.05 - i * 0.18, mat(i % 2 ? '#b88a5c' : '#c99a6b'), false);

  // a soft light over the landing
  const lamp = new THREE.PointLight('#fff3dc', 0.35, 6, 1.5); lamp.position.set(4.0, 1.3, 5.3); put(lamp);
  return {};
}

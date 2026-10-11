// Dachgeschoss shell (converted attic), from page 3 of the plan with its handwritten changes.
// Built into the attic group, so y = 0 is the attic floor.
//   Dudes Zimmer  back, full width   x 0..5.64,    z 0..3.88  (plan: Raum 1, two Velux windows)
//   Büro          left, middle+front x 0..2.97,    z 4.0..8.88 (plan: Raum 2, one Velux window)
//   Flur          right, to the front x 3.08..5.64, z 4.0..8.88 (stairwell x 4.6..5.64, z 4.0..6.0 over the
//                 first-floor one; past it storage cupboards under a Velux window)
// The roof slopes down to the front and back: 1 m high about 1.1 m in from the outside walls, 2 m high
// about 2.2 m in. Knee walls stand where it is 1 m high; behind them is unusable eaves space.
import * as THREE from 'three';
import { WALL_HEIGHT as WH, LEVEL_HEIGHT } from '../../config.js';
import { TEX } from '../../core/textures.js';
import { M, box, brickMat, floor, mat, put, run, solid, wall } from '../../core/build.js';
import { canvasTex } from '../../core/textures.js';

// cork floor tiles, as in the photos
const cork = canvasTex(g => {
  let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  g.fillStyle = '#c8a273'; g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 2600; i++) {
    g.fillStyle = ['#b38a5c', '#d8b688', '#a67c50', '#e0c497'][i % 4];
    g.fillRect(rnd() * 256, rnd() * 256, 1 + rnd() * 2.5, 1 + rnd() * 2);
  }
  g.fillStyle = 'rgba(90,60,30,.35)'; [0, 128].forEach(v => { g.fillRect(0, v, 256, 1); g.fillRect(v, 0, 1, 256); });
});

export const ATTIC_STAIRWELL = { x1: 4.6, z1: 4.0, x2: 5.64, z2: 6.0 };
const PITCH = 1 / 1.13;                          // the roof rises 1 m every 1.13 m
const EAVE_BACK = -0.035, EAVE_FRONT = 8.915;    // where the underside of the roof would meet the attic floor
export const KNEE_BACK = 1.1, KNEE_FRONT = 7.78; // 1 m high knee walls
const ANGLE = Math.atan(PITCH);

/** Height of the sloping ceiling above the attic floor at z (the ridge is far above the cut walls). */
export function roofHeight(z) { return Math.max(0, Math.min(z - EAVE_BACK, EAVE_FRONT - z) * PITCH); }

// one sloping roof plane, from below the eaves up to where the walls are cut (WH): red tiles outside,
// white plasterboard inside. side = -1 for the back, +1 for the front.
function roofPlane(side, x1, x2) {
  const eave = side < 0 ? EAVE_BACK : EAVE_FRONT;
  const zLow = eave + side * 0.5, yLow = -0.5 * PITCH;          // starts outside the wall, below the floor
  const zHigh = eave - side * WH / PITCH, yHigh = WH;            // ends at the cut height
  const len = Math.hypot(zHigh - zLow, yHigh - yLow), t = 0.12;
  const tiles = TEX.redtile.clone(); tiles.needsUpdate = true; tiles.repeat.set((x2 - x1) / 0.9, len / 0.9);
  const outside = new THREE.MeshStandardMaterial({ map: tiles, roughness: 0.9, color: '#c9b8b0' });
  const edge = mat('#6e3328', { fresh: true }), inside = mat('#f3f0ea', { fresh: true });
  const m = new THREE.Mesh(new THREE.BoxGeometry(x2 - x1, t, len), [edge, edge, outside, inside, edge, edge]);
  // centre of the underside line, then half the thickness out along the roof's normal
  const nz = side < 0 ? -Math.sin(ANGLE) : Math.sin(ANGLE), ny = Math.cos(ANGLE);
  m.position.set((x1 + x2) / 2, (yLow + yHigh) / 2 + ny * t / 2, (zLow + zHigh) / 2 + nz * t / 2);
  m.rotation.x = side < 0 ? -ANGLE : ANGLE;
  m.castShadow = true; m.receiveShadow = true;
  return put(m);
}

// a Velux window on the inside of the roof, the part that shows below the cut
function velux(side, x1, x2) {
  const eave = side < 0 ? EAVE_BACK : EAVE_FRONT;
  const yMid = 1.15, zMid = eave - side * yMid / PITCH, nz = side < 0 ? Math.sin(ANGLE) : -Math.sin(ANGLE), ny = -Math.cos(ANGLE);
  const len = 0.5 / Math.sin(ANGLE);
  return [[mat('#2f343c', { fresh: true }), 0, x2 - x1], [mat('#9fd3ff', { fresh: true }), 0.004, x2 - x1 - 0.1]].map(([material, off, w]) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, 0.02, len - off * 20), material);
    m.position.set((x1 + x2) / 2, yMid + ny * (0.012 + off), zMid + nz * (0.012 + off));
    m.rotation.x = side < 0 ? -ANGLE : ANGLE;
    return put(m);
  });
}

// an end wall (gable or party wall) under the roof: stepped so it stays under the sloping roof planes
function endWall(x1, x2, material) {
  const step = 0.2;
  for (let z = -0.375; z < 9.255 - 1e-6; z += step) {
    const z2 = Math.min(9.255, z + step);
    const h = Math.min(WH, roofHeight(z < 4.44 ? z : z2));
    if (h > 0.02) box(x1, z, x2, z2, h, 0, material, false);
  }
}

export function buildAtticStructure() {
  const S = ATTIC_STAIRWELL;
  // floor slab (the first floor's ceiling) apart from the stairwell
  const slab = mat('#3a3f48');
  [[-0.3, -0.375, 5.76, S.z1], [-0.3, S.z2, 5.76, 9.255], [-0.3, S.z1, S.x1, S.z2]].forEach(([x1, z1, x2, z2]) => box(x1, z1, x2, z2, 0.16, -0.17, slab, false));

  // cork floors
  floor(0, KNEE_BACK, 5.64, S.z1, cork, 0.6, 0.005);
  floor(0, S.z1, S.x1, KNEE_FRONT, cork, 0.6, 0.006);
  floor(S.x1, S.z2, 5.64, KNEE_FRONT, cork, 0.6, 0.006);
  floor(0, 0, 5.64, KNEE_BACK, TEX.boards, 1, 0.004).material.color.set('#8c7a62');        // eaves space behind the knee walls
  floor(0, KNEE_FRONT, 5.64, 8.88, TEX.boards, 1, 0.004).material.color.set('#8c7a62');

  // the roof, front and back, over the whole terrace row
  // (each half is kept as a list so the half between the camera and the player can be made see-through)
  const roof = {
    back: [roofPlane(-1, -6.2, 11.6), ...velux(-1, 1.1, 2.4), ...velux(-1, 4.0, 5.3)],   // Velux: Dude's room
    front: [roofPlane(1, -6.2, 11.6), ...velux(1, 0.5, 1.9), ...velux(1, 3.6, 4.9)],     // office, hall
  };

  // gable wall (brick outside) and party wall, stepped under the roof
  endWall(-0.3, 0, M.wall);
  endWall(-0.345, -0.3, brickMat(9.7, WH));
  endWall(5.64, 5.76, M.wall);
  solid(-0.3, -0.375, 0, 9.255); solid(5.64, -0.375, 5.76, 9.255);

  // knee walls with the eaves space behind them
  box(0, KNEE_BACK - 0.08, 5.64, KNEE_BACK, 1.0, 0, M.wall); solid(0, -0.375, 5.64, KNEE_BACK);
  box(0, KNEE_FRONT, 5.64, KNEE_FRONT + 0.08, 1.0, 0, M.wall); solid(0, KNEE_FRONT, 5.64, 9.255);
  // white built-in cupboards in the knee walls (Dude's room and the hall), with long steel bar handles
  const doors = (x1, x2, z, dir) => {
    for (let x = x1; x < x2 - 0.2; x += 0.45) {
      const xe = Math.min(x2, x + 0.45);
      box(x + 0.01, z, xe - 0.01, z + dir * 0.02, 0.85, 0.05, mat('#fafafa'), false);
      const hx = (Math.round((x - x1) / 0.45) % 2) ? x + 0.06 : xe - 0.06;
      box(hx - 0.01, z + dir * 0.02, hx + 0.01, z + dir * 0.04, 0.32, 0.4, mat('#a9adb2'), false);
    }
  };
  doors(0.05, 5.6, KNEE_BACK, 1);
  doors(3.1, 5.6, KNEE_FRONT, -1);

  // brick band between the top of the first-floor walls and this floor, and the neighbours' attic floors
  const band = LEVEL_HEIGHT - WH, y0 = -band;
  [[-0.345, -0.42, 5.76, -0.375], [-0.345, 9.255, 5.76, 9.3], [-0.345, -0.42, -0.3, 9.3]].forEach(([x1, z1, x2, z2]) =>
    box(x1, z1, x2, z2, band - 0.17, y0, brickMat(Math.max(x2 - x1, z2 - z1), band), false));
  for (const [x1, x2] of [[5.76, 11.6], [-6.2, -0.345]]) {
    box(x1, -0.42, x2, 9.3, 0.16, -0.17, slab, false);
    box(x1, -0.42, x2, 9.3, band - 0.17, y0, brickMat(x2 - x1, band), false);
    const zc = EAVE_BACK + WH / PITCH;                       // their attics, cut flat where the roof reaches WH
    box(x1, zc, x2, EAVE_FRONT - WH / PITCH, 0.03, WH, M.cap, false);
  }

  // inside walls
  run('x', 0, 5.64, 3.88, 4.0, [[3.75, 4.55, 'door']]);                     // Dude's room | landing
  run('z', 4.0, 7.33, 2.97, 3.08, [[4.3, 5.1, 'door']]);                    // office | hall
  box(2.97, 7.33, 3.08, KNEE_FRONT, 1.0, 0, M.wall); solid(2.97, 7.33, 3.08, KNEE_FRONT);   // ...lower under the roof
  box(0, 3.872, 3.75, 3.88, WH - 0.02, 0, mat('#5f7fae'), false);           // Dude's blue wall
  box(0, 4.0, 2.97, 4.008, WH - 0.02, 0, mat('#4f7172'), false);            // office teal wall

  // stairwell: banister round the opening, open at the top where you step off (as on the first floor)
  const pine = mat('#c98d4e');
  // pine frame with black bars, along the side and across the front end
  const bar = mat('#1d1e22');
  box(4.53, 4.75, 4.64, S.z2 + 0.06, 0.06, 0.9, pine, false);
  box(4.55, S.z2, 5.64, S.z2 + 0.06, 0.06, 0.9, pine, false);
  box(4.55, 4.75, 4.62, S.z2 + 0.06, 0.1, 0, pine, false);
  box(4.55, S.z2, 5.64, S.z2 + 0.06, 0.1, 0, pine, false);
  [4.75, S.z2].forEach(z => box(4.53, z - 0.03, 4.64, z + 0.06, 0.95, 0, pine));   // posts
  for (let z = 4.88; z < S.z2 - 0.05; z += 0.12) box(4.575, z, 4.595, z + 0.015, 0.8, 0.1, bar, false);
  for (let x = 4.7; x < 5.6; x += 0.12) box(x, S.z2 + 0.02, x + 0.015, S.z2 + 0.04, 0.8, 0.1, bar, false);
  box(4.6, 4.0, 5.64, 4.06, 0.9, 0, pine);
  solid(4.55, 4.75, 5.64, S.z2 + 0.06); solid(4.62, 4.0, 5.64, 4.75);
  for (let i = 0; i < 3; i++) box(4.65, 4.06 + i * 0.22, 5.64, 4.28 + i * 0.22, 0.05, -0.05 - i * 0.18, mat(i % 2 ? '#b88a5c' : '#c99a6b'), false);

  // soft lights: hall, Dude's room, office
  [[3.8, 5.4, 0.3], [2.8, 2.4, 0.4], [1.5, 6.2, 0.35]].forEach(([x, z, i]) => {
    const lamp = new THREE.PointLight('#fff3dc', i, 6, 1.5); lamp.position.set(x, 1.3, z); put(lamp);
  });
  return { roof };
}

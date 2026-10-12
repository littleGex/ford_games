// Mum's office site, from her sketch, away from the house and Dad's office (at x = MUM.x). On the left the
// car park with a footpath along it, then the road with a zebra crossing over to the security gate in the
// fence (a booth with the guard, and a barrier that lifts when you show your badge). Inside the fence, the
// office building: the entrance faces the gate, the clock-in machine is just inside, the stairs go up to the
// office floor (still to come: its sketch is on the way) and there's a café on the ground floor. Further
// down, a side road turns off to another building; grass and paths in the corner.
import * as THREE from 'three';
import { WALL_HEIGHT as WH } from '../config.js';
import { TEX } from '../core/textures.js';
import { M, add, ball, box, bush, castShadows, colliders, cyl, fbox, floor, group, mat, put, run, solid } from '../core/build.js';
import { makeCharacter } from '../characters/character.js';
import { OFFICE_PEOPLE } from '../characters/family.js';

export const MX = 80;
const X = x => MX + x;

// The building: x 14..26, z 0.5..9 (entrance in the south wall); the fence along x 12.6 with the gate at z 9.2..12.2.
const B = { x1: 14, x2: 26, z1: 0.5, z2: 9 };
const GATE = { z1: 9.2, z2: 12.2 };

// Where things are on the site, in world coordinates [x, z].
export const MUM = {
  x: MX,
  park: [X(6.0), 7.25],                            // getting out of the car in its bay
  zebra: [X(9.6), 10.7],                           // the middle of the zebra crossing
  badge: [X(12.15), 9.55],                         // at the security window, before the gate
  clock: [X(18.0), 8.4],                           // the clock-in machine, just inside the entrance
  cafe: { at: [X(21.5), 2.6], seat: [X(21.5), 0, 2.35, Math.PI] },
  stairs: [X(15.5), 6.1],                          // the foot of the stairs
};

function parkedCar(x, z, color) {
  const car = group(x, 0, z);
  add(car, new THREE.BoxGeometry(4.3, 0.55, 1.8), mat(color), [0, 0.45, 0]);
  add(car, new THREE.BoxGeometry(2.4, 0.5, 1.6), mat(color), [-0.2, 0.95, 0]);
  add(car, new THREE.BoxGeometry(2.3, 0.38, 1.64), mat('#2a3340'), [-0.2, 0.97, 0]);
  [[-1.4, 0.9], [1.4, 0.9], [-1.4, -0.9], [1.4, -0.9]].forEach(([dx, dz]) => add(car, new THREE.CylinderGeometry(0.32, 0.32, 0.22, 18), mat('#1a1a1c'), [dx, 0.32, dz], null, [Math.PI / 2, 0, 0]));
  castShadows(car);
  return car;
}

function chair(x, z, facing) {
  const g = group(x, 0, z); g.rotation.y = facing;
  add(g, new THREE.CylinderGeometry(0.18, 0.18, 0.04, 14), mat('#c98d4e'), [0, 0.45, 0]);
  add(g, new THREE.BoxGeometry(0.36, 0.35, 0.04), mat('#c98d4e'), [0, 0.65, -0.17]);
  [[-0.13, -0.13], [0.13, -0.13], [-0.13, 0.13], [0.13, 0.13]].forEach(([a, b]) => add(g, new THREE.CylinderGeometry(0.015, 0.015, 0.45, 6), mat('#2b2d31'), [a, 0.22, b]));
}

export function buildMumOffice() {
  // ground: grass everywhere, the car park, the footpath, the road with its kerbs, the pavement by the fence,
  // the side road to the other building, and the forecourt in front of the entrance
  floor(X(-8), -6, X(34), 36, TEX.grass, 2, -0.005);
  floor(X(0), 0.5, X(6), 10.5, TEX.asphalt, 2, 0.01);                                  // car park
  for (let z = 0.5; z <= 10.6; z += 2.5) box(X(0.1), z - 0.04, X(5.4), z + 0.04, 0.005, 0.012, mat('#f2f2f2'), false);   // bay lines
  floor(X(6.2), -6, X(7.4), 36, TEX.paving, 0.8, 0.02);                                // footpath
  floor(X(7.6), -6, X(11.6), 36, TEX.asphalt, 2, 0.01);                                // the road
  [7.5, 11.6].forEach(x => box(X(x), -6, X(x + 0.1), 36, 0.09, 0, mat('#9a968f'), false));   // kerbs
  for (let z = -6; z < 36; z += 2) if (z < GATE.z1 - 1 || z > GATE.z2 + 0.5) box(X(9.55), z, X(9.65), z + 1, 0.005, 0.012, mat('#f2f2f2'), false);   // centre line
  for (let x = 7.8; x < 11.5; x += 0.55) box(X(x), GATE.z1 + 0.15, X(x + 0.32), GATE.z2 - 0.15, 0.006, 0.012, mat('#f4f4f4'), false);   // zebra stripes
  [[7.35, GATE.z1 - 0.1], [11.85, GATE.z1 - 0.1]].forEach(([x, z]) => { cyl(X(x), z, 0.04, 2.0, '#2b2d31'); ball(X(x), 2.05, z, 0.14, '#f2a51c'); });   // flashing beacons
  floor(X(11.7), -6, X(12.6), 36, TEX.paving, 0.8, 0.02);                              // pavement by the fence
  floor(X(12.6), 9.0, X(B.x2 + 2), 13.4, TEX.paving, 0.8, 0.02);                      // forecourt
  floor(X(12.6), 13.6, X(34), 16.6, TEX.asphalt, 2, 0.01);                             // side road to the other building
  floor(X(12.6), B.z1 - 1.5, X(B.x1), 9.0, TEX.paving, 0.8, 0.02);                    // path round the building
  // the other building, beyond the side road (outside only), and paths across the grass in the corner
  fbox(X(13.5), 18, X(32), 34, WH, '#b9bdc2');
  box(X(13.5), 18, X(32), 34, 0.03, WH, M.cap, false);
  [[0.8, 1.6], [3.4, 4.2]].forEach(([a, b]) => floor(X(a), 12, X(b), 36, TEX.paving, 0.8, 0.015));
  [[X(-3), 3, 1.0], [X(-4), 14, 1.1], [X(-2.5), 26, 0.9], [X(28.5), 4, 0.9]].forEach(([x, z, r]) => { cyl(x, z, 0.14, 1.4, '#5a4a3c', 0, true); ball(x, 1.8, z, r, '#4f8a3a'); });
  [[X(2.4), 20], [X(5.2), 15], [X(2.6), 31]].forEach(([x, z], i) => bush(x, z, 0.45, i % 2 ? '#2f5b2e' : '#3b6b36'));

  // parked cars in the car park (Mum's bay is the one at z 6..8.5; her car appears there when she arrives)
  parkedCar(X(2.9), 1.75, '#3b6fb0'); parkedCar(X(2.9), 4.25, '#c94b4b'); parkedCar(X(2.9), 9.25, '#6b6f75');
  [[0.5, 1.75], [0.5, 4.25], [0.5, 9.25]].forEach(([x, z]) => solid(X(x), z - 0.9, X(x + 4.8), z + 0.9));
  const mumCar = parkedCar(X(2.9), 6.75, '#f2f2f0'); mumCar.visible = false;

  // the fence along the site, with the gate; the security booth with the guard and its window; the barrier
  const fenceMat = mat('#5a5f67');
  for (const [z1, z2] of [[-6, GATE.z1], [GATE.z2, 13.5], [16.7, 36]]) {
    box(X(12.55), z1, X(12.65), z2, 0.04, 1.6, fenceMat, false);
    box(X(12.55), z1, X(12.65), z2, 0.04, 0.1, fenceMat, false);
    for (let z = z1; z <= z2; z += 0.18) box(X(12.58), z, X(12.62), z + 0.02, 1.6, 0, fenceMat, false);
    solid(X(12.55), z1, X(12.65), z2);
  }
  // ...and along the side road, so the only way in is through the gate
  box(X(12.6), 13.45, X(34), 13.55, 0.04, 1.6, fenceMat, false);
  box(X(12.6), 13.45, X(34), 13.55, 0.04, 0.1, fenceMat, false);
  for (let x = 12.6; x <= 34; x += 0.18) box(X(x), 13.48, X(x + 0.02), 13.52, 1.6, 0, fenceMat, false);
  solid(X(12.6), 13.45, X(34), 13.55);
  box(X(12.8), 7.0, X(14.4), 8.8, 0.9, 0, mat('#e4e6ea'));                            // booth
  box(X(12.8), 7.0, X(14.4), 8.8, WH - 0.9, 0.9, M.glass, false);
  box(X(12.75), 6.95, X(14.45), 8.85, 0.06, WH, mat('#2b2d31'), false);
  solid(X(12.8), 7.0, X(14.4), 8.8);
  const guard = makeCharacter({ ...OFFICE_PEOPLE.colleagueC, topMat: new THREE.MeshStandardMaterial({ color: '#2c3548', roughness: 0.75 }) });
  guard.legs.forEach(l => { l.rotation.x = -1.45; }); guard.fig.position.y = 0.5 - 0.44 * guard.scale;
  guard.root.position.set(X(13.5), 0, 8.2); guard.root.rotation.y = Math.PI; put(guard.root);
  box(X(12.65), GATE.z1 - 0.05, X(12.75), GATE.z1 + 0.15, 0.95, 0, mat('#2b2d31'));   // barrier post with the badge reader
  box(X(12.62), GATE.z1 + 0.02, X(12.64), GATE.z1 + 0.1, 0.12, 0.7, new THREE.MeshBasicMaterial({ color: '#4ad66d' }), false);
  const barrier = group(X(12.7), 0.9, GATE.z1 + 0.05);
  add(barrier, new THREE.BoxGeometry(0.08, 0.08, GATE.z2 - GATE.z1 - 0.1), mat('#f4f4f4'), [0, 0, (GATE.z2 - GATE.z1) / 2]);
  [0.4, 1.2, 2.0].forEach(z => add(barrier, new THREE.BoxGeometry(0.085, 0.085, 0.35), mat('#d6453a'), [0, 0, z]));
  const gateBlock = { x1: X(12.4), z1: GATE.z1, x2: X(12.9), z2: GATE.z2, level: 0 };
  colliders.push(gateBlock);
  const gate = {
    open() { barrier.rotation.x = -Math.PI / 2 + 0.15; const k = colliders.indexOf(gateBlock); if (k >= 0) colliders.splice(k, 1); },
    close() { barrier.rotation.x = 0; if (!colliders.includes(gateBlock)) colliders.push(gateBlock); },
  };

  // the office building: outer walls with windows, the entrance facing the gate
  floor(X(B.x1), B.z1, X(B.x2), B.z2, TEX.greytile, 1.2, 0.02).material.color.set('#c9c3b8');
  run('z', B.z1, B.z2, X(B.x1 - 0.1), X(B.x1), [[2, 4.5, 'win']]);
  run('z', B.z1, B.z2, X(B.x2), X(B.x2 + 0.1), [[1.5, 4, 'win'], [5, 7.5, 'win']]);
  run('x', X(B.x1 - 0.1), X(B.x2 + 0.1), B.z1 - 0.1, B.z1, [[X(19), X(21.5), 'win'], [X(22.5), X(25), 'win']]);
  run('x', X(B.x1 - 0.1), X(B.x2 + 0.1), B.z2, B.z2 + 0.1, [[X(16.2), X(17.6), 'door'], [X(19.5), X(24.5), 'win']]);
  box(X(16.1), B.z2 + 0.1, X(17.7), B.z2 + 0.9, 0.06, 1.35, mat('#5a5f67'), false);   // entrance canopy
  // the clock-in machine on the wall just inside the entrance
  box(X(17.75), B.z2 - 0.08, X(18.25), B.z2, 0.3, 0.95, mat('#5a5f67'), false);
  box(X(17.85), B.z2 - 0.09, X(18.15), B.z2 - 0.08, 0.12, 1.08, new THREE.MeshBasicMaterial({ color: '#7fe08a' }), false);
  // the stairs up to the office floor (it isn't built yet), with a rail
  for (let i = 0; i < 10; i++) {
    const z2 = 5.4 - i * 0.38, h = (i + 1) * 0.14;
    box(X(14.7), z2 - 0.38, X(16.3), z2, Math.min(h, WH), 0, mat(i % 2 ? '#b8b2a8' : '#c9c3b8'));
  }
  solid(X(14.7), 1.6, X(16.3), 5.4);
  box(X(16.3), 1.6, X(16.36), 5.4, 0.05, 0.95, mat('#9aa1a8'), false);
  // the café: a counter with the coffee machine and a cake display, a barista, little round tables
  box(X(17.6), B.z1, X(17.7), 3.6, WH, 0, M.wall); solid(X(17.6), B.z1, X(17.7), 3.6);
  fbox(X(18.6), B.z1 + 0.1, X(25.8), 1.8, 0.95, '#6b4a2e');
  box(X(18.6), 1.7, X(25.8), 1.8, 0.05, 0.95, mat('#c98d4e'), false);
  box(X(21.3), 0.9, X(21.7), 1.3, 0.42, 0.95, mat('#1d1e22'), false);                  // coffee machine
  box(X(22.6), 1.0, X(23.8), 1.7, 0.3, 0.95, M.glass, false);                         // cake display
  ['#f2c4d0', '#8a5a3c', '#f2e3c4'].forEach((c, i) => cyl(X(22.85) + i * 0.38, 1.35, 0.13, 0.08, c, 1.0));
  const barista = makeCharacter(OFFICE_PEOPLE.colleagueD);
  barista.root.position.set(X(22.0), 0, 0.85); put(barista.root);
  [[19.6, 4.2], [22.2, 4.6], [24.6, 3.9]].forEach(([x, z]) => {
    cyl(X(x), z, 0.04, 0.7, '#9aa1a8', 0, true); cyl(X(x), z, 0.36, 0.04, '#f2f2f2', 0.7);   // table: leg and top
    chair(X(x) - 0.6, z, Math.PI / 2); chair(X(x) + 0.6, z, -Math.PI / 2);
  });
  box(X(25.4), 7.4, X(25.9), 8.8, 1.0, 0, mat('#6b8f5a'), false);                      // plant by the windows

  return { mumCar, mumGate: gate };
}

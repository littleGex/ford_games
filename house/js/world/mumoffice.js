// Mum's office site, from her sketches, away from the house and Dad's office (at x = MUM.x).
//
// North of the road: a car park with grass beside it, and Mum's car park with a footpath down to the road.
// The road has a zebra crossing over to the site fence, where there's a vehicle gate with a barrier, the
// security lounge next to it, and two turnstiles for people (they open when you show your badge). Inside:
// a road down from the gate, a car park, a garden with trees, the café (its own little building) and the
// office building. Its entrance is in the west wall with the clock-in machine just inside; the lifts and the
// stairs are at the far end.
//
// Upstairs is Mum's office floor (from the floor plan, turned so its lifts and stairs line up with the ground
// floor): the open-plan office with Mum's desk under the windows, a meeting room, the kitchen, the WC, a
// second office with more desks, and the lift lobby. It's built on floor 1 like the house's upstairs and
// only shows while you're up there.
import * as THREE from 'three';
import { WALL_HEIGHT as WH, LEVEL_HEIGHT } from '../config.js';
import { TEX } from '../core/textures.js';
import { M, add, ball, box, bush, castShadows, colliders, cyl, fbox, floor, group, mat, put, run, setBuildTarget, solid, wall } from '../core/build.js';
import { makeCharacter } from '../characters/character.js';
import { OFFICE_PEOPLE } from '../characters/family.js';
import { chair, desk, deskPair, officeScreen, seated } from './office.js';

export const MX = 80;
const X = x => MX + x;

// The office building, x 18..30 by z 4.6..21.6. The floor plan's u (along its length) and v (across it)
// map to the building as x = 18 + v, z = 21.6 - u.
const B = { x1: 18, x2: 30, z1: 4.6, z2: 21.6 };
const pr = (u1, v1, u2, v2) => [X(B.x1 + v1), B.z2 - u2, X(B.x1 + v2), B.z2 - u1];   // a plan rectangle in world x1, z1, x2, z2
const LIFT = [X(29.0), 16.9], STAIRS = [X(28.65), 17.9];

// Where things are, in world coordinates [x, z]. Upstairs ones are on floor 1.
export const MUM = {
  x: MX,
  park: [X(17.2), -4.2],                           // on the footpath, next to Mum's car
  car: [X(17.6), -3.4],                            // getting back in the car
  zebra: [X(17.5), 1.8],                           // the middle of the zebra crossing
  badgeIn: [X(18.2), 3.05],                        // at the turnstiles, outside
  badgeOut: [X(18.2), 4.1],                        // at the turnstiles, inside
  clock: [X(18.5), 8.1],                           // the clock-in machine just inside the entrance
  cafe: { at: [X(4.6), 10.3], seat: [X(4.6), 0, 10.0, Math.PI] },
  lift: LIFT, stairs: STAIRS,
  assembly: [X(10.2), 13.6],                       // the assembly point in the garden
  // floor 1
  desk: { at: [X(20.1), 10.5], seat: [X(20.1), 0.45, 10.82, 0] },   // the north side of her desk pair
  meeting: { at: [X(21.6), 18.3], seat: [X(21.6), 0.45, 19.55, 0] },
  fridge: [X(23.0), 15.55], sink: [X(23.0), 12.9],
  coffee: { at: [X(23.0), 14.0], seat: [X(22.9), 0, 14.0, -Math.PI / 2] },
  wc: [X(25.0), 19.4],
};

function parkedCar(x, z, color, alongZ = false) {
  const car = group(x, 0, z); if (alongZ) car.rotation.y = Math.PI / 2;
  add(car, new THREE.BoxGeometry(4.3, 0.55, 1.8), mat(color), [0, 0.45, 0]);
  add(car, new THREE.BoxGeometry(2.4, 0.5, 1.6), mat(color), [-0.2, 0.95, 0]);
  add(car, new THREE.BoxGeometry(2.3, 0.38, 1.64), mat('#2a3340'), [-0.2, 0.97, 0]);
  [[-1.4, 0.9], [1.4, 0.9], [-1.4, -0.9], [1.4, -0.9]].forEach(([dx, dz]) => add(car, new THREE.CylinderGeometry(0.32, 0.32, 0.22, 18), mat('#1a1a1c'), [dx, 0.32, dz], null, [Math.PI / 2, 0, 0]));
  castShadows(car);
  return car;
}

function cafeChair(x, z, facing) {
  const g = group(x, 0, z); g.rotation.y = facing;
  add(g, new THREE.CylinderGeometry(0.18, 0.18, 0.04, 14), mat('#c98d4e'), [0, 0.45, 0]);
  add(g, new THREE.BoxGeometry(0.36, 0.35, 0.04), mat('#c98d4e'), [0, 0.65, -0.17]);
  [[-0.13, -0.13], [0.13, -0.13], [-0.13, 0.13], [0.13, 0.13]].forEach(([a, b]) => add(g, new THREE.CylinderGeometry(0.015, 0.015, 0.45, 6), mat('#2b2d31'), [a, 0.22, b]));
}

function fenceRun(x1, z1, x2, z2) {
  const m = mat('#5a5f67'), alongX = x2 - x1 > z2 - z1;
  box(x1, z1, x2, z2, 0.04, 1.6, m, false); box(x1, z1, x2, z2, 0.04, 0.1, m, false);
  if (alongX) for (let x = x1; x <= x2; x += 0.18) box(x, z1 + 0.02, x + 0.02, z2 - 0.02, 1.6, 0, m, false);
  else for (let z = z1; z <= z2; z += 0.18) box(x1 + 0.02, z, x2 - 0.02, z + 0.02, 1.6, 0, m, false);
  solid(x1, z1, x2, z2);
}

/** The outside and the ground floor. */
function buildSite() {
  // --- north of the road: grass, the car park, Mum's car park and the footpath down to the road
  floor(X(-12), -12, X(42), 26, TEX.grass, 2, -0.005);
  floor(X(7.5), -7.5, X(14.5), -1.2, TEX.asphalt, 2, 0.01);
  floor(X(18.6), -7.5, X(26.6), -1.2, TEX.asphalt, 2, 0.01);
  for (const [a, b] of [[7.5, 14.5], [18.6, 26.6]]) for (let x = a; x <= b + 0.01; x += 2.5) box(X(x) - 0.04, -6.8, X(x) + 0.04, -2.0, 0.005, 0.012, mat('#f2f2f2'), false);
  floor(X(16.6), -9, X(17.8), 0.4, TEX.paving, 0.8, 0.02);                            // Mum's footpath
  floor(X(-12), -1.1, X(42), 0.4, TEX.paving, 0.8, 0.02);                             // pavement along the road
  [[8.75, '#3b6fb0'], [11.25, '#6b6f75'], [13.75, '#c94b4b'], [22.35, '#e9d84a'], [24.85, '#2f5b2e']].forEach(([x, c]) => {
    parkedCar(X(x), -4.4, c, true); solid(X(x) - 0.95, -6.6, X(x) + 0.95, -2.2);
  });
  const mumCar = parkedCar(X(19.85), -4.4, '#f2f2f0', true); mumCar.visible = false;
  solid(X(18.9), -6.6, X(20.8), -2.2);
  [[X(-3), -6, 1.0], [X(1.5), -9, 1.1], [X(4.5), -4.5, 0.9], [X(31), -6, 1.0]].forEach(([x, z, r]) => { cyl(x, z, 0.14, 1.4, '#5a4a3c', 0, true); ball(x, 1.8, z, r, '#4f8a3a'); });

  // --- the road, with its kerbs, centre line and the zebra crossing (with beacons) over to the turnstiles
  floor(X(-12), 0.5, X(42), 3.0, TEX.asphalt, 2, 0.01);
  [0.4, 3.0].forEach(z => box(X(-12), z, X(42), z + 0.1, 0.09, 0, mat('#9a968f'), false));
  for (let x = -12; x < 42; x += 2) if (x < 15.5 || x > 19.5) box(X(x), 1.7, X(x + 1), 1.8, 0.005, 0.012, mat('#f2f2f2'), false);
  for (let z = 0.65; z < 2.9; z += 0.5) box(X(16.7), z, X(18.7), z + 0.3, 0.006, 0.012, mat('#f4f4f4'), false);
  [[16.45, 0.25], [18.95, 3.25]].forEach(([x, z]) => { cyl(X(x), z, 0.04, 2.0, '#2b2d31'); ball(X(x), 2.05, z, 0.14, '#f2a51c'); });
  floor(X(-12), 3.1, X(42), 3.4, TEX.paving, 0.8, 0.02);                              // pavement by the fence

  // --- the fence, the vehicle gate (barrier, never for people), the security lounge and the turnstiles
  fenceRun(X(-12), 3.4, X(12.0), 3.5);
  fenceRun(X(19.6), 3.4, X(42), 3.5);
  box(X(12.0), 3.3, X(13.4), 4.8, 0.9, 0, mat('#e4e6ea'));                           // security lounge
  box(X(12.0), 3.3, X(13.4), 4.8, WH - 0.9, 0.9, M.glass, false);
  box(X(11.95), 3.25, X(13.45), 4.85, 0.06, WH, mat('#2b2d31'), false);
  solid(X(12.0), 3.3, X(13.4), 4.8);
  const guard = makeCharacter({ ...OFFICE_PEOPLE.colleagueC, topMat: new THREE.MeshStandardMaterial({ color: '#2c3548', roughness: 0.75 }) });
  guard.legs.forEach(l => { l.rotation.x = -1.45; }); guard.fig.position.y = 0.5 - 0.44 * guard.scale;
  guard.root.position.set(X(12.7), 0, 4.2); guard.root.rotation.y = Math.PI / 2; put(guard.root);
  box(X(13.4), 3.35, X(13.55), 3.55, 0.95, 0, mat('#2b2d31'));                       // barrier post
  const barrier = group(X(13.5), 0.9, 3.45);
  add(barrier, new THREE.BoxGeometry(3.2, 0.08, 0.08), mat('#f4f4f4'), [1.65, 0, 0]);
  [0.5, 1.4, 2.3].forEach(x => add(barrier, new THREE.BoxGeometry(0.35, 0.085, 0.085), mat('#d6453a'), [x, 0, 0]));
  solid(X(13.4), 3.35, X(16.8), 3.55);                                               // cars only: the barrier stays down for people
  // two turnstiles in a cabinet of glass panels: the arms turn and let you through once your badge is shown
  box(X(16.8), 3.3, X(19.6), 3.35, 0.05, 1.1, mat('#5a5f67'), false);
  [16.8, 17.95, 18.4, 19.55].forEach(x => { box(X(x), 3.3, X(x + 0.05), 4.6, 1.0, 0, mat('#c9ccd1')); solid(X(x), 3.3, X(x + 0.05), 4.6); });
  box(X(17.95), 3.3, X(18.45), 4.6, 0.05, 1.0, mat('#4ad66d'), false);              // the badge readers on the middle post
  const arms = [17.35, 18.95].map(x => { const a = group(X(x), 0.85, 3.95); add(a, new THREE.BoxGeometry(0.55, 0.05, 0.05), mat('#9aa1a8'), [0, 0, 0]); return a; });
  const laneBlock = [{ x1: X(16.85), z1: 3.8, x2: X(17.95), z2: 4.1, level: 0 }, { x1: X(18.45), z1: 3.8, x2: X(19.55), z2: 4.1, level: 0 }];
  colliders.push(...laneBlock);
  const turnstiles = {
    open() { arms.forEach(a => { a.rotation.y = Math.PI / 2; }); laneBlock.forEach(b => { const k = colliders.indexOf(b); if (k >= 0) colliders.splice(k, 1); }); },
    close() { arms.forEach(a => { a.rotation.y = 0; }); laneBlock.forEach(b => { if (!colliders.includes(b)) colliders.push(b); }); },
  };

  // --- inside the site: the road down from the gate and over to the car park, the car park, the garden
  floor(X(13.6), 3.5, X(16.7), 16.5, TEX.asphalt, 2, 0.01);
  floor(X(3.6), 4.0, X(13.6), 5.4, TEX.asphalt, 2, 0.01);
  floor(X(3.6), 5.4, X(9.8), 8.3, TEX.asphalt, 2, 0.01);
  [['#8a5a3c', 4.7], ['#3b6fb0', 7.2], ['#f2f2f2', 9.0]].forEach(([c, x]) => { parkedCar(X(x), 6.8, c, true); solid(X(x) - 0.95, 4.65, X(x) + 0.95, 8.95); });
  floor(X(16.8), 3.5, X(18.0), 8.0, TEX.paving, 0.8, 0.02);                          // walkway from the turnstiles to the entrance
  floor(X(7.8), 8.4, X(18.0), 9.0, TEX.paving, 0.8, 0.02);                           // and across to the garden and the café
  floor(X(8.0), 9.0, X(13.0), 14.5, TEX.grass, 2, 0.01);                             // the garden
  [[9.0, 10.2], [10.0, 11.4], [11.0, 12.6], [12.0, 13.8]].forEach(([a, b], i) => floor(X(8.4 + i * 0.5), a, X(9.4 + i * 0.5), b, TEX.paving, 0.8, 0.015));   // a winding path
  [[X(9.0), 12.4, 0.8], [X(12.1), 10.3, 0.9], [X(11.6), 13.9, 0.7]].forEach(([x, z, r]) => { cyl(x, z, 0.12, 1.3, '#5a4a3c', 0, true); ball(x, 1.7, z, r, '#4f8a3a'); });
  fbox(X(12.0), 11.6, X(12.7), 12.0, 0.45, '#a87b4f');                               // a bench
  cyl(X(10.2) + 0.5, 14.1, 0.03, 1.5, '#9aa1a8');                                    // the assembly point sign
  box(X(10.2) + 0.3, 14.07, X(10.2) + 0.7, 14.11, 0.4, 1.2, mat('#2fa34f'), false);

  // --- the café: its own little building between the car park and the garden, door onto the garden
  floor(X(1.5), 8.7, X(7.8), 13.0, TEX.greytile, 1.2, 0.02).material.color.set('#c9c3b8');
  run('x', X(1.4), X(7.9), 8.6, 8.7, [[X(3), X(6.5), 'win']]);
  run('x', X(1.4), X(7.9), 13.0, 13.1, []);
  run('z', 8.7, 13.0, X(1.4), X(1.5), [[9.5, 12, 'win']]);
  run('z', 8.7, 13.0, X(7.8), X(7.9), [[10.2, 11.2, 'door']]);
  fbox(X(1.6), 9.0, X(2.4), 12.6, 0.95, '#6b4a2e');                                   // counter along the back wall
  box(X(2.3), 9.0, X(2.4), 12.6, 0.05, 0.95, mat('#c98d4e'), false);
  box(X(1.8), 9.6, X(2.2), 10.0, 0.42, 0.95, mat('#1d1e22'), false);                  // coffee machine
  box(X(1.7), 10.8, X(2.35), 11.9, 0.3, 0.95, M.glass, false);                        // cake display
  ['#f2c4d0', '#8a5a3c', '#f2e3c4'].forEach((c, i) => cyl(X(2.0), 11.0 + i * 0.37, 0.13, 0.08, c, 1.0));
  const barista = makeCharacter(OFFICE_PEOPLE.colleagueD);
  barista.root.position.set(X(1.95), 0, 10.6); barista.root.rotation.y = Math.PI / 2; put(barista.root);
  [[4.6, 11.8], [6.5, 9.6], [6.6, 12.1]].forEach(([x, z]) => {
    cyl(X(x), z, 0.04, 0.7, '#9aa1a8', 0, true); cyl(X(x), z, 0.36, 0.04, '#f2f2f2', 0.7);
    cafeChair(X(x) - 0.6, z, Math.PI / 2); cafeChair(X(x) + 0.6, z, -Math.PI / 2);
  });
  box(X(3.2), 8.75, X(5.4), 8.8, 0.3, 1.0, mat('#d6453a'), false);                    // a café sign

  // --- the office building, ground floor: the entrance in the west wall, the clock-in machine just inside,
  // a lobby with seats and plants, the lifts and the stairs at the far end
  floor(X(B.x1), B.z1, X(B.x2), B.z2, TEX.greytile, 1.2, 0.02).material.color.set('#c9c3b8');
  run('z', B.z1, B.z2, X(B.x1 - 0.1), X(B.x1), [[6.0, 7.4, 'door'], [9.5, 13, 'win'], [15, 19, 'win']]);
  run('z', B.z1, B.z2, X(B.x2), X(B.x2 + 0.1), [[6, 10, 'win']]);
  run('x', X(B.x1 - 0.1), X(B.x2 + 0.1), B.z1 - 0.1, B.z1, [[X(21), X(27), 'win']]);
  run('x', X(B.x1 - 0.1), X(B.x2 + 0.1), B.z2, B.z2 + 0.1, [[X(20), X(25), 'win']]);
  box(X(B.x1 - 0.9), 5.9, X(B.x1 - 0.1), 7.5, 0.06, 1.35, mat('#5a5f67'), false);   // entrance canopy
  box(X(B.x1), 7.85, X(B.x1 + 0.08), 8.35, 0.3, 0.95, mat('#5a5f67'), false);        // the clock-in machine
  box(X(B.x1 + 0.08), 7.95, X(B.x1 + 0.09), 8.25, 0.12, 1.08, new THREE.MeshBasicMaterial({ color: '#7fe08a' }), false);
  fbox(X(20.5), 6.2, X(22.5), 6.9, 1.0, '#e9e6df');                                   // reception desk
  [[24, 11, '#3b4a68'], [24, 13.2, '#3b4a68']].forEach(([x, z, c]) => fbox(X(x), z, X(x + 1.6), z + 0.7, 0.42, c));   // seats
  [[X(19.2), 20.8], [X(26.5), 5.3], [X(19.2), 9.0]].forEach(([x, z]) => { cyl(x, z, 0.22, 0.4, '#8a6844', 0, true); ball(x, 0.75, z, 0.35, '#4f8a3a'); });
  buildCore(0);
  return { mumCar, turnstiles };
}

/** The lifts and the stairs, the same on both floors. */
function buildCore(level) {
  [16.15, 17.0].forEach(z => {
    box(X(29.92), z, X(30), z + 0.8, WH - 0.05, 0, mat('#b9bdc2'), false);            // lift doors
    box(X(29.9), z + 0.39, X(29.92), z + 0.41, WH - 0.1, 0, mat('#5a5f67'), false);
  });
  box(X(29.85), 16.0, X(29.9), 16.12, 0.1, 1.05, new THREE.MeshBasicMaterial({ color: level ? '#ffb02e' : '#7fe08a' }), false);   // call button
  for (let i = 0; i < 8; i++) {
    const z1 = 18.5 + i * 0.26, h = (i + 1) * (WH / 9);
    box(X(27.7), z1, X(29.6), z1 + 0.26, level ? 0.05 : h, level ? 0 : 0, mat(i % 2 ? '#b8b2a8' : '#c9c3b8'), !level);
  }
  box(X(27.6), 18.5, X(27.7), 20.6, 0.9, 0, mat('#9aa1a8'), false);                  // rail
  solid(X(27.6), 18.5, X(29.6), 20.6);
}

/** Mum's office floor, upstairs. */
function buildFloor(scene) {
  const upstairs = new THREE.Group();
  upstairs.position.y = LEVEL_HEIGHT; upstairs.visible = false;
  scene.add(upstairs);
  setBuildTarget(upstairs, 1);

  floor(X(B.x1), B.z1, X(B.x2), B.z2, TEX.tile, 0.5, 0.02).material.color.set('#9aa3b0');
  box(X(B.x1 - 0.1), B.z1 - 0.1, X(B.x2 + 0.1), B.z2 + 0.1, 0.16, -0.17, mat('#d9d6cf'), false);   // the slab
  const [kx1, kz1, kx2, kz2] = pr(5.4, 4.0, 9.2, 5.7);
  floor(kx1, kz1, kx2, kz2, TEX.greytile, 1.2, 0.025);
  // outer walls: windows over the open-plan office and the second office
  run('z', B.z1, B.z2, X(B.x1 - 0.1), X(B.x1), [[5.0, 10.1, 'win'], [11, 15.5, 'win']]);
  run('z', B.z1, B.z2, X(B.x2), X(B.x2 + 0.1), [[5.8, 12.0, 'win']]);
  run('x', X(B.x1 - 0.1), X(B.x2 + 0.1), B.z1 - 0.1, B.z1, [[X(19), X(22), 'win'], [X(26.5), X(29.5), 'win']]);
  run('x', X(B.x1 - 0.1), X(B.x2 + 0.1), B.z2, B.z2 + 0.1, [[X(19.5), X(23), 'win']]);
  // inside walls, from the floor plan (u, v -> world)
  run('x', X(B.x1), X(23.7), 18.8, 18.9, [[X(20.1), X(21.4), 'door']]);             // meeting room
  wall(X(23.7), 18.9, X(23.8), B.z2);
  run('x', X(23.8), X(26.5), 19.8, 19.9, [[X(24.6), X(25.4), 'door']]);             // WC
  run('z', 14.8, B.z2, X(26.5), X(26.6), [[15.6, 17.2, 'door']]);                   // lift lobby
  wall(X(26.6), 14.75, X(B.x2), 14.85);
  run('z', B.z1, 14.75, X(25.6), X(25.7), [[8.9, 9.7, 'door']]);                    // second office
  wall(X(B.x1), 16.4, X(22.0), 16.5);                                                // end of the open-plan office
  wall(kx1, kz1, kx2, kz1 + 0.1); wall(kx1, kz2 - 0.1, kx2, kz2); wall(kx1, kz1 + 0.1, kx1 + 0.1, kz2 - 0.1);   // kitchen
  run('z', kz1 + 0.1, kz2 - 0.1, kx2 - 0.1, kx2, [[13.2, 14.2, 'door']]);

  // the open-plan office: Mum's desk pair under the windows, two more pairs, a single desk; colleagues
  deskPair(X(19.6), 11.1, X(20.6), 12.7);                                            // Mum's: she sits at the north end, a colleague opposite
  deskPair(X(19.6), 7.7, X(20.6), 9.5);
  deskPair(X(19.6), 4.9, X(20.6), 6.4);
  desk(X(18.6), 14.3, X(20.1), 15.2, -1);
  const screen = officeScreen(X(20.1), 11.775); screen.rotation.y = Math.PI;
  const P = OFFICE_PEOPLE;
  seated(P.colleagueB, X(20.1), 12.95, Math.PI); seated(P.colleagueA, X(20.1), 9.75, Math.PI); seated(P.colleagueC, X(20.1), 4.65, 0);
  // the meeting room: a table with chairs, a screen
  fbox(X(19.4), 19.85, X(23.0), 20.8, 0.72, '#e9e6df');
  [19.9, 20.8, 21.6, 22.5].forEach(x => { chair(X(x), 19.55, 0); chair(X(x), 21.1, Math.PI); });
  seated(P.colleagueD, X(19.9), 21.1, Math.PI); seated(P.boss, X(22.5), 21.1, Math.PI);
  box(X(18.0), 19.9, X(18.05), 21.0, 0.6, 0.75, mat('#1d1e22'), false);
  // the kitchen: counter with the fridge, coffee machine and sink along one side, a little table
  fbox(kx1 + 0.1, kz1 + 0.1, kx1 + 0.7, kz2 - 0.1, 0.9, '#f2f2f2');
  fbox(kx1 + 0.1, 15.2, kx1 + 0.75, 15.95, WH - 0.05, '#c9ccd1');                    // fridge
  box(kx1 + 0.2, 13.85, kx1 + 0.5, 14.15, 0.38, 0.9, mat('#1d1e22'), false);          // coffee machine
  box(kx1 + 0.15, 12.65, kx1 + 0.6, 13.15, 0.02, 0.9, mat('#9aa1a8'), false);         // sink
  // the WC: two toilets
  [24.4, 25.6].forEach(x => fbox(X(x) - 0.25, 20.8, X(x) + 0.25, 21.5, 0.42, '#f4f4f4'));
  // the second office: three desk pairs
  deskPair(X(27.9), 10.9, X(28.9), 12.4); deskPair(X(27.9), 8.1, X(28.9), 9.7); deskPair(X(27.9), 5.7, X(28.9), 6.8);
  seated(P.colleagueB, X(28.4), 10.65, 0); seated(P.colleagueD, X(28.4), 7.05, Math.PI);
  [[X(24.6), 5.2], [X(18.4), 16.0]].forEach(([x, z]) => { cyl(x, z, 0.22, 0.4, '#8a6844', 0, true); ball(x, 0.75, z, 0.35, '#4f8a3a'); });
  buildCore(1);

  setBuildTarget(scene, 0);
  return { mumFloor: upstairs, mumScreen: screen };
}

export function buildMumOffice(scene) {
  const site = buildSite();
  const up = buildFloor(scene);
  return { mumCar: site.mumCar, mumGate: site.turnstiles, mumFloor: up.mumFloor, mumOfficeScreen: up.mumScreen };
}

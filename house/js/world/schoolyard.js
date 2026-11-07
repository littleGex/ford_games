// P's school from outside (#65), from Alan's sketch of the site and his photos, turned so P's building (whose
// first floor is the lesson floor, world/school.js) sits at the back with the yard in front of it.
//
// The street runs down the right-hand side: one way for cars, with a cycle path on each side and cars parked
// along the far one. The site fence and hedge run along it, with three ways in: P's own door from the street
// (by her building's stairwell), a side gate into the yard, and the main gate at the bottom with the lane
// behind it. Off the lane: the car park and, under the trees, the bike stands. A green mesh fence with a double
// gate keeps the lane out of the yard.
//
// The yard: the long brick building down the street side (doors under dark canopies), the building with the
// glass front and the canteen opposite, the sandpit with its two log huts and the gazebo, the table-tennis
// table, chalk hopscotch, two little football goals at the bike-stand end, and P's building across the top with
// a basketball hoop on its wall and mosaic stools by the hedge. Round its left side: the playground, with the
// wooden climbing tower and the curved stone steps.
//
// Only P's building has an inside (its ground floor: the stairwell, and classrooms seen through the windows);
// the others are drawn as closed blocks. Nothing here names the real school: no sign, no banners.
import * as THREE from 'three';
import { WALL_HEIGHT as WH } from '../config.js';
import { TEX } from '../core/textures.js';
import { M, add, ball, box, brickMat, castShadows, cyl, fbox, floor, group, mat, put, solid, wall } from '../core/build.js';
import { SCHOOL, classroom } from './school.js';

const X = x => SCHOOL.x + x;
const BRICK = '#a94a35', ROOF = '#8f8983', GLASS = '#9fc4d8';

/** A brick wall along x or z with openings ([a, b, 'win' | 'door']), as tall as the walls are cut. */
function brickRun(axis, a, b, c1, c2, openings = []) {
  const rect = (p, q) => (axis === 'x' ? [p, c1, q, c2] : [c1, p, c2, q]);
  const piece = (p, q) => { const [x1, z1, x2, z2] = rect(p, q); box(x1, z1, x2, z2, WH, 0, brickMat(q - p, WH)); solid(x1, z1, x2, z2); };
  let cur = a;
  for (const [o1, o2, type] of openings) {
    if (o1 > cur) piece(cur, o1);
    const [x1, z1, x2, z2] = rect(o1, o2);
    if (type === 'win') {
      box(x1, z1, x2, z2, 0.75, 0, brickMat(o2 - o1, 0.75)); solid(x1, z1, x2, z2);
      box(x1, z1, x2, z2, WH - 0.8, 0.8, M.glass, false);
    } else floor(x1, z1, x2, z2, TEX.tile, 0.5, 0.03);
    cur = o2;
  }
  if (cur < b) piece(cur, b);
}

/** A building nobody goes into: a brick block with a flat roof, windows (and doors) on one face. */
function block(x1, z1, x2, z2, face, wins = [], { glassFront = false, color = BRICK } = {}) {
  box(x1, z1, x2, z2, WH, 0, mat(color));
  box(x1 - 0.08, z1 - 0.08, x2 + 0.08, z2 + 0.08, 0.08, WH, mat(ROOF), false);
  solid(x1, z1, x2, z2);
  const along = face === 'x1' || face === 'x2' ? 'z' : 'x', c = { x1, x2, z1, z2 }[face], out = face === 'x1' || face === 'z1' ? -1 : 1;
  const pane = (a, b, y0, h, m) => (along === 'z' ? box(c, a, c + out * 0.04, b, h, y0, m, false) : box(a, c, b, c + out * 0.04, h, y0, m, false));
  if (glassFront) pane(along === 'z' ? z1 + 0.3 : x1 + 0.3, along === 'z' ? z2 - 0.3 : x2 - 0.3, 0.25, WH - 0.4, mat(GLASS));
  for (const [a, b, type] of wins) pane(a, b, type === 'door' ? 0 : 0.55, type === 'door' ? 1.15 : 0.6, mat(type === 'door' ? '#3b3f45' : GLASS));
}

function tree(x, z, r = 1.6, leaves = '#c9a12a') {
  cyl(x, z, 0.16, 1.8, '#5a4a3c', 0, true);
  ball(x, 2.1, z, r, leaves, [1, 0.85, 1]);
}

function hedge(x1, z1, x2, z2, h = 1.1) { box(x1, z1, x2, z2, h, 0, mat('#6f7f3a')); solid(x1, z1, x2, z2); }

function lamp(x, z) { cyl(x, z, 0.06, 3.2, '#9aa1a8'); cyl(x, z, 0.22, 0.12, '#c9ccd1', 3.2); }

/** A run of metal fence (grey bars, or the green mesh of the yard fence). */
function bars(x1, z1, x2, z2, color = '#7d8389', h = 1.2, gap = 0.16) {
  const m = mat(color), alongX = x2 - x1 > z2 - z1;
  box(x1, z1, x2, z2, 0.05, h - 0.05, m, false); box(x1, z1, x2, z2, 0.05, 0.08, m, false);
  if (alongX) for (let x = x1; x <= x2; x += gap) box(x, z1, x + 0.025, z2, h, 0, m, false);
  else for (let z = z1; z <= z2; z += gap) box(x1, z, x2, z + 0.025, h, 0, m, false);
  solid(x1, z1, x2, z2);
}

function parkedCar(x, z, color) {   // along z, nose towards -z
  const car = group(x, 0, z);
  add(car, new THREE.BoxGeometry(1.8, 0.55, 4.2), mat(color), [0, 0.45, 0]);
  add(car, new THREE.BoxGeometry(1.6, 0.5, 2.3), mat(color), [0, 0.95, 0.2]);
  add(car, new THREE.BoxGeometry(1.64, 0.38, 2.2), mat('#2a3340'), [0, 0.97, 0.2]);
  [[0.9, 1.4], [-0.9, 1.4], [0.9, -1.4], [-0.9, -1.4]].forEach(([dx, dz]) => add(car, new THREE.CylinderGeometry(0.32, 0.32, 0.22, 16), mat('#1a1a1c'), [dx, 0.32, dz], null, [0, 0, Math.PI / 2]));
  castShadows(car);
  solid(x - 0.95, z - 2.15, x + 0.95, z + 2.15);
}

function parkedBike(x, z, color, facing = 0) {
  const g = group(x, 0, z); g.rotation.y = facing;
  [-0.32, 0.32].forEach(dz => add(g, new THREE.TorusGeometry(0.21, 0.022, 8, 20), mat('#151515'), [0, 0.23, dz], null, [0, Math.PI / 2, 0]));
  add(g, new THREE.BoxGeometry(0.035, 0.035, 0.62), mat(color), [0, 0.38, 0], null, [0.12, 0, 0]);
  add(g, new THREE.BoxGeometry(0.34, 0.03, 0.03), mat('#1d1e22'), [0, 0.6, 0.28]);
}

/** A little wooden hut of logs: an A-frame, open at the front (facing +z). */
function logHut(x, z) {
  const g = group(x, 0, z), wood = mat('#8a6a4a');
  [-1, 1].forEach(s => add(g, new THREE.BoxGeometry(0.12, 1.5, 1.8), wood, [s * 0.45, 0.62, 0], null, [0, 0, s * 0.58]));
  const back = new THREE.Mesh(new THREE.CircleGeometry(0.85, 3), mat('#6f5236', { fresh: true }));
  back.material.side = THREE.DoubleSide;
  back.rotation.z = Math.PI / 2; back.position.set(0, 0.45, -0.88); g.add(back);
  castShadows(g);
  solid(x - 0.9, z - 0.9, x + 0.9, z + 0.15);
}

function log(x1, z1, x2, z2, r = 0.16) {   // a log lying along x or z
  const alongX = x2 - x1 > z2 - z1, L = alongX ? x2 - x1 : z2 - z1;
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, L, 10), mat('#9a7a58'));
  m.position.set((x1 + x2) / 2, r, (z1 + z2) / 2); m.rotation.set(alongX ? 0 : Math.PI / 2, 0, alongX ? Math.PI / 2 : 0); m.castShadow = true; put(m);
}

function goal(x, z1, z2, faces) {   // a little football goal: white posts and bar, a net behind
  const m = mat('#f4f4f4');
  [z1, z2].forEach(z => { box(x - 0.05, z - 0.05, x + 0.05, z + 0.05, 1.0, 0, m); solid(x - 0.05, z - 0.05, x + 0.05, z + 0.05); });
  box(x - 0.05, z1, x + 0.05, z2, 0.08, 1.0, m, false);
  box(x - faces * 0.7, z1, x - faces * 0.68, z2, 1.0, 0, new THREE.MeshStandardMaterial({ color: '#dddddd', transparent: true, opacity: 0.35 }), false);
}

export function buildSchoolYard() {
  // --- the ground: grass all round, then the paving of the yard, the lane and the car park
  floor(X(-17), -8, X(49), 68, TEX.grass, 2, -0.005);
  floor(X(-3), 20.2, X(21.0), 46.6, TEX.paving, 0.8, 0.01);                      // the yard
  floor(X(21.0), 20.2, X(33.2), 24.8, TEX.paving, 0.8, 0.01);                    // up from the side gate
  floor(X(-3), -1.2, X(0), 20.2, TEX.paving, 0.8, 0.01);                         // round P's building to the playground
  floor(X(26.5), 17.2, X(33.2), 20.2, TEX.paving, 0.8, 0.012);                   // in front of her door
  floor(X(31.0), 7.2, X(33.2), 17.2, TEX.paving, 0.8, 0.012);                    // and from her gate on the street
  floor(X(-16), 46.8, X(33.2), 52.6, TEX.paving, 0.8, 0.01);                     // the lane
  floor(X(12), 52.6, X(32.4), 66, TEX.paving, 0.8, 0.01);                        // the car park
  floor(X(-4.2), 52.6, X(-2.6), 60.5, TEX.paving, 0.6, 0.012);                   // the path to the bike stands
  floor(X(-15), 57.0, X(-1.0), 60.2, TEX.paving, 0.6, 0.012);

  // --- the street: pavement, the red cycle path, the one-way road with its bike lane, parked cars
  floor(X(33.4), -8, X(35.0), 68, TEX.paving, 0.6, 0.012);
  floor(X(35.0), -8, X(36.6), 68, TEX.asphalt, 2, 0.012).material.color.set('#c0605a');
  box(X(36.6), -8, X(36.7), 68, 0.09, 0, mat('#9a968f'), false);
  floor(X(36.7), -8, X(46.2), 68, TEX.asphalt, 2, 0.01);
  for (let z = -8; z < 68; z += 1.6) box(X(42.4), z, X(42.55), z + 0.8, 0.005, 0.012, mat('#f2f2f2'), false);   // the bike lane's dashes
  for (const z of [4, 30, 56]) {                                                  // one way: arrows down the road
    box(X(39.5), z, X(39.7), z + 2.2, 0.005, 0.012, mat('#f2f2f2'), false);
    const head = new THREE.Mesh(new THREE.CircleGeometry(0.5, 3), new THREE.MeshBasicMaterial({ color: '#f2f2f2' }));
    head.rotation.set(-Math.PI / 2, 0, -Math.PI / 2); head.position.set(X(39.6), 0.017, z - 0.3); put(head);
  }
  box(X(46.2), -8, X(46.3), 68, 0.09, 0, mat('#9a968f'), false);
  floor(X(46.3), -8, X(49), 68, TEX.paving, 0.6, 0.012);
  [[-2, '#c9ccd1'], [3, '#3b4a68'], [8.5, '#f2f2f0'], [14, '#7a2a2a'], [26, '#c9ccd1'], [31.5, '#2b2d31'], [37, '#9aa1a8'], [43, '#3b6fb0'], [60, '#f2f2f0']].forEach(([z, c]) => parkedCar(X(45.2), z, c));
  [[47.5, 2], [47.6, 20], [47.5, 40], [47.6, 62]].forEach(([x, z]) => tree(X(x), z, 1.5, '#d08a2a'));

  // --- the site fence along the street, with the hedge behind it, and the three ways in
  const fenceBits = [[-8, 9.0], [11.0, 21.2], [24.4, 47.2], [52.4, 68]];
  for (const [a, b] of fenceBits) bars(X(33.2), a, X(33.3), b, '#2f5b3e', 1.2);
  for (const [a, b] of [[-8, 7.0], [24.4, 46.0], [53.6, 68]]) hedge(X(32.4), a, X(33.15), b, 1.3);
  const gateLeaf = (x, z, len, rotY, color) => { const g = group(x, 0, z); g.rotation.y = rotY; add(g, new THREE.BoxGeometry(0.05, 1.2, len), mat(color), [0, 0.6, len / 2]); };
  gateLeaf(X(33.25), 11.0, 1.9, Math.PI * 0.75, '#2f5b3e');                     // P's gate, open into the forecourt
  gateLeaf(X(33.25), 24.4, 2.9, Math.PI * 0.8, '#2f5b3e');                      // the side gate, open
  // the main gate: grey bars, swung right open against the car-park hedge
  box(X(33.1), 47.0, X(33.4), 47.2, 1.5, 0, mat('#7d8389')); box(X(33.1), 52.4, X(33.4), 52.6, 1.5, 0, mat('#7d8389'));
  bars(X(29.0), 52.7, X(33.1), 52.8, '#8a9096', 1.3, 0.22);
  lamp(X(32.6), 53.4);

  // --- P's building, the ground floor: brick, windows all round, her door from the yard (under a canopy) and
  // from the street into the stairwell, the stairs up. Classrooms behind the windows (not for going into today).
  const W = 26.5, D = 20;
  floor(X(0), 0, X(W), D, TEX.tile, 0.5, 0.02).material.color.set('#8a7f72');
  floor(X(W), 7.2, X(31.0), 17.2, TEX.redtile, 0.6, 0.026);
  const wins = (a, n, w = 1.8, gap = 0.9) => Array.from({ length: n }, (_, i) => [a + i * (w + gap), a + i * (w + gap) + w, 'win']);
  brickRun('x', X(-0.2), X(W + 0.2), -0.2, 0, wins(X(1.0), 9));
  brickRun('x', X(-0.2), X(W + 0.2), D, D + 0.2, wins(X(1.0), 7));
  brickRun('z', 0, D, X(-0.2), X(0), wins(1.5, 6));
  brickRun('z', 0, 7.2, X(W), X(W + 0.2), [[2.0, 5.0, 'win']]);
  brickRun('z', 17.2, D, X(W), X(W + 0.2));
  brickRun('z', 7.2, 17.2, X(W), X(W + 0.2));                                    // between the stairwell and the classrooms
  brickRun('x', X(W + 0.2), X(31.0), 7.0, 7.2);
  brickRun('z', 7.0, 17.2, X(30.8), X(31.0), [[9.0, 10.4, 'door'], [12.0, 16.2, 'win']]);
  brickRun('x', X(W + 0.2), X(31.0), 17.0, 17.2, [[X(28.2), X(29.8), 'door']]);
  [[28.2, -1.3, 1], [29.8, 1.3, -1]].forEach(([x, rot, dir]) => {                // P's door: glass double doors, open
    const g = group(X(x), 0, 17.2); g.rotation.y = rot;
    add(g, new THREE.BoxGeometry(0.76, WH - 0.05, 0.05), M.frame, [dir * 0.38, (WH - 0.05) / 2, 0]);
  });
  box(X(27.9), 17.2, X(30.1), 17.85, 0.05, WH - 0.05, mat('#3b3f45'), false);   // the canopy over it
  box(X(31.0), 8.9, X(31.6), 10.5, 0.05, WH - 0.05, mat('#3b3f45'), false);      // and over the street door
  // the stairs up, along the inside wall: grey steps, a red handrail
  const n = 9, s1 = 9.0, s2 = 14.0;
  for (let i = 0; i < n; i++) {
    const z = s2 - (i + 1) * (s2 - s1) / n;
    box(X(26.75), z, X(28.2), z + (s2 - s1) / n, 0.12 * (i + 1), 0, mat(i % 2 ? '#8f8a84' : '#9d9891'));
  }
  solid(X(26.7), s1, X(28.25), s2);
  box(X(28.2), s1, X(28.25), s2, 0.05, 0.9, mat('#c43b3b'), false);
  box(X(28.2), s1, X(28.25), s1 + 0.05, 0.9, 0, mat('#c43b3b'), false);
  cyl(X(30.5), 16.6, 0.2, 0.4, '#b5643c', 0, true);                               // a pot plant by the door
  // inside: a corridor down the middle, classrooms each side (seen through the windows)
  wall(X(0), 8.8, X(W), 8.95); wall(X(0), 11.05, X(W), 11.2);
  [0, 8.8, 17.6].forEach(a => { wall(X(a + 8.75), 0, X(a + 8.9), 8.8); wall(X(a + 8.75), 11.2, X(a + 8.9), D); });
  classroom(X(0), 0, X(8.75), 8.8, 'east'); classroom(X(8.9), 0, X(17.55), 8.8, 'east'); classroom(X(17.7), 0, X(W), 8.8, 'east');
  classroom(X(0), 11.2, X(8.75), D, 'north'); classroom(X(8.9), 11.2, X(17.55), D, 'north'); classroom(X(17.7), 11.2, X(W), D, 'north');
  // outside it: the basketball hoop on the yard wall, the hedge and the mosaic stools, a lamp
  box(X(21.0), 20.2, X(22.0), 20.25, 0.5, 0.85, mat('#f4f4f4'), false);
  const hoop = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.02, 6, 18), mat('#d6453a'));
  hoop.rotation.x = Math.PI / 2; hoop.position.set(X(21.5), 1.0, 20.5); put(hoop);
  hedge(X(24.6), 20.5, X(26.4), 22.8, 1.3);
  [[22.0, 21.6], [23.0, 21.7], [24.0, 23.4]].forEach(([x, z], i) => {
    fbox(X(x) - 0.25, z - 0.2, X(x) + 0.25, z + 0.2, 0.42, '#9aa1a8');
    ['#3b7fc4', '#e84a5f', '#f2c81c'].forEach((c, k) => box(X(x) - 0.2 + k * 0.14, z - 0.21, X(x) - 0.12 + k * 0.14, z - 0.2, 0.08, 0.15 + (i + k) % 2 * 0.12, mat(c), false));
  });
  lamp(X(24.8), 23.6);

  // --- the long brick building down the street side: doors under dark canopies onto the path along it
  block(X(21.3), 25.0, X(32.2), 46.0, 'x1', [[27.0, 28.2, 'door'], [29.0, 30.6], [31.4, 33.0], [34.0, 35.2, 'door'], [36.0, 37.6], [38.4, 40.0], [41.0, 42.2, 'door'], [43.0, 44.6]]);
  [27.6, 34.6, 41.6].forEach(z => box(X(20.6), z - 0.9, X(21.3), z + 0.9, 0.05, WH - 0.1, mat('#3b2f2a'), false));
  floor(X(19.6), 24.8, X(21.3), 46.2, TEX.paving, 0.5, 0.014).material.color.set('#c9c3b8');   // the path along it
  // the hopscotch in chalk, an orange bin
  [[0, 0, '#5fb7d6'], [0, 1, '#5fb7d6'], [-0.5, 2, '#f2c81c'], [0.5, 2, '#f2c81c'], [0, 3, '#6aa84f'], [-0.5, 4, '#e86a8a'], [0.5, 4, '#e86a8a'], [0, 5, '#5fb7d6']]
    .forEach(([dx, k, c]) => box(X(18.3 + dx) - 0.42, 31.0 + k * 0.9, X(18.3 + dx) + 0.42, 31.0 + k * 0.9 + 0.8, 0.004, 0.016, mat(c), false));
  cyl(X(19.3), 29.0, 0.04, 0.9, '#9aa1a8', 0, true); box(X(19.1), 28.85, X(19.5), 29.15, 0.45, 0.55, mat('#f08a24'), false);

  // --- opposite: the building with the glass front, the canteen next to it
  block(X(-16), 31.0, X(-3.4), 46.0, 'x2', [], { glassFront: true });
  block(X(-15), 21.6, X(-4.4), 30.0, 'x2', [[22.4, 24.4], [25.2, 27.2], [27.8, 29.2, 'door']]);
  // the sandpit in front of it: logs round the edge, the two log huts, the gazebo behind
  floor(X(-0.4), 31.0, X(7.4), 39.6, TEX.paving, 3, 0.016).material.color.set('#e2cf9c');
  log(X(-0.4), 30.8, X(7.4), 31.0); log(X(-0.4), 39.6, X(7.4), 39.8); log(X(-0.6), 30.8, X(-0.4), 39.8); log(X(7.4), 30.8, X(7.6), 39.8);
  solid(X(7.2), 30.8, X(7.6), 37.2); solid(X(-0.6), 30.8, X(7.6), 31.1);         // (a gap in the logs at the yard end to step in)
  logHut(X(2.4), 36.6); logHut(X(4.8), 36.6);
  const tent = group(X(1.2), 0, 33.0);
  [[-1.5, -1.5], [1.5, -1.5], [-1.5, 1.5], [1.5, 1.5]].forEach(([dx, dz]) => add(tent, new THREE.CylinderGeometry(0.03, 0.03, 2.0, 6), mat('#c9ccd1'), [dx, 1.0, dz]));
  const roof = new THREE.Mesh(new THREE.ConeGeometry(2.3, 0.6, 4), mat('#eef0f2')); roof.rotation.y = Math.PI / 4; roof.position.set(0, 2.3, 0); tent.add(roof);
  castShadows(tent);
  // the table-tennis table, the football goals at the far end, a lamp and the trees
  box(X(9.0), 26.6, X(11.74), 28.12, 0.04, 0.72, mat('#5a6470'));
  box(X(10.35), 26.6, X(10.39), 28.12, 0.14, 0.76, mat('#2b2d31'), false);
  [[9.4, '#9aa1a8'], [11.3, '#9aa1a8']].forEach(([x, c]) => box(X(x) - 0.1, 26.9, X(x) + 0.1, 27.8, 0.72, 0, mat(c), false));
  solid(X(9.0), 26.6, X(11.74), 28.12);
  goal(X(1.0), 41.0, 44.0, 1); goal(X(17.4), 41.0, 44.0, -1);
  box(X(1.0), 42.45, X(17.4), 42.55, 0.004, 0.015, mat('#f2f2f2'), false);       // a chalk line down the pitch
  lamp(X(8.6), 24.0); lamp(X(-2.4), 44.8);
  [[-1.6, 22.5, 1.4, '#c9a12a'], [8.0, 44.5, 1.1, '#d08a2a']].forEach(([x, z, r, c]) => tree(X(x), z, r, c));

  // --- the yard fence along the lane: green mesh, the double gate (one side open)
  bars(X(-3.0), 46.6, X(12.0), 46.7, '#2f5b3e', 1.3, 0.1);
  bars(X(15.0), 46.6, X(21.3), 46.7, '#2f5b3e', 1.3, 0.1);
  gateLeaf(X(12.0), 46.65, 1.5, Math.PI / 2, '#2f5b3e');                         // the shut half
  gateLeaf(X(15.0), 46.65, 1.5, Math.PI * 1.1, '#2f5b3e');                       // the open half, swung into the lane
  // --- the lane's other side: the car park (beds of trees, a concrete planter-bench, cars), the trees and the
  // bike stands, grass between
  hedge(X(-16), 52.8, X(-4.4), 53.4, 1.0); hedge(X(-2.4), 52.8, X(11.6), 53.4, 1.0);
  [[14.5, 58.5, '#3b6fb0'], [17.0, 58.5, '#c9ccd1'], [24.5, 58.5, '#f2f2f0'], [27.0, 63.5, '#7a7f87']].forEach(([x, z, c]) => parkedCar(X(x), z, c));
  for (let x = 13.2; x < 32; x += 2.5) box(X(x) - 0.04, 56.0, X(x) + 0.04, 61.0, 0.005, 0.014, mat('#f2f2f2'), false);
  [[20.5, 58.8], [20.5, 64.5]].forEach(([x, z]) => {
    fbox(X(x) - 1.2, z - 1.2, X(x) + 1.2, z + 1.2, 0.25, '#a5a09a'); tree(X(x), z, 1.7, '#d08a2a');
  });
  fbox(X(29.0), 54.0, X(30.4), 54.6, 0.45, '#b9b4ad');                           // the concrete bench
  [[2.5, 56.5, 1.8, '#c9a12a'], [6.0, 61.0, 1.9, '#d08a2a'], [9.5, 56.0, 1.6, '#b9a43a'], [3.8, 65.0, 1.6, '#c9a12a'], [-10.5, 64.6, 1.7, '#7a9a3a'], [-0.6, 64.5, 1.4, '#c9a12a']]
    .forEach(([x, z, r, c]) => tree(X(x), z, r, c));
  cyl(X(-2.0), 57.0, 0.25, 4, '#3f6a34', 0, true);                                // the tree in ivy by the path
  for (let x = -14.5; x <= -1.5; x += 1.3) {                                      // the bike stands: low hoops on the paving
    const h = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.03, 6, 14, Math.PI), mat('#9aa1a8'));
    h.position.set(X(x), 0, 59.9); put(h);
  }
  solid(X(-15), 59.75, X(-1.0), 60.05);
  parkedBike(X(-12.6), 59.4, '#2f6fd6'); parkedBike(X(-11.3), 59.4, '#f2c81c'); parkedBike(X(-4.8), 59.4, '#6aa84f');
  lamp(X(-0.6), 57.5);
  bars(X(-16.6), 52.6, X(-16.5), 68, '#2f5b3e', 1.2);

  // --- the playground, round the left of P's building: the wooden climbing tower with its slide, the curved
  // stone steps, trees, a green bin
  floor(X(-16), -4, X(-3), 19.6, TEX.paving, 4, 0.008).material.color.set('#a48a6a');   // bark chips
  const tw = group(X(-6.5), 0, 15.0), wood = mat('#b98c56');
  [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([dx, dz]) => add(tw, new THREE.BoxGeometry(0.12, 2.4, 0.12), wood, [dx, 1.2, dz]));
  add(tw, new THREE.BoxGeometry(2.1, 0.08, 2.1), wood, [0, 1.0, 0]);
  const trf = new THREE.Mesh(new THREE.ConeGeometry(1.7, 0.8, 4), mat('#6f5236')); trf.rotation.y = Math.PI / 4; trf.position.set(0, 2.8, 0); tw.add(trf);
  add(tw, new THREE.BoxGeometry(0.6, 0.05, 2.4), mat('#3b7fc4'), [-2.0, 0.55, 0], null, [0, 0, -0.42]);   // the slide
  [0.25, 0.55, 0.85].forEach(y => add(tw, new THREE.BoxGeometry(0.7, 0.04, 0.06), wood, [0, y, 1.05]));   // the ladder
  castShadows(tw);
  solid(X(-7.6), 13.9, X(-5.4), 16.1); solid(X(-9.2), 14.4, X(-7.6), 15.6);
  for (let ring = 0; ring < 3; ring++) {                                          // the curved stone steps
    const r = 2.4 + ring * 0.7;
    for (let k = 0; k <= 8; k++) {
      const a = Math.PI * (0.15 + 0.7 * k / 8), x = X(-10.0) + Math.cos(a) * r, z = 3.0 + Math.sin(a) * r;
      const st = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.3 + ring * 0.25, 0.6), mat(ring % 2 ? '#6b6f75' : '#5a5e64'));
      st.position.set(x, (0.3 + ring * 0.25) / 2, z); st.rotation.y = -a + Math.PI / 2; st.castShadow = true; put(st);
      solid(x - 0.35, z - 0.35, x + 0.35, z + 0.35);
    }
  }
  [[-14.2, 0.0, 1.9, '#c9a12a'], [-5.0, -2.5, 1.6, '#d08a2a'], [-14.0, 17.0, 1.7, '#b9a43a'], [-5.2, 9.8, 1.3, '#c9a12a']].forEach(([x, z, r, c]) => tree(X(x), z, r, c));
  cyl(X(-3.6), 18.4, 0.22, 0.75, '#4f8a3a', 0, true);
  bars(X(-16.6), -6, X(-16.5), 52.6, '#2f5b3e', 1.2);
  bars(X(-16.5), -6.1, X(33.2), -6.0, '#2f5b3e', 1.2);
}

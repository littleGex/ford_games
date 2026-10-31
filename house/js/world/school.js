// P's school: the lesson floor, from the school's fire-escape plan and photos (#65). Like the offices it's a
// place of its own away from the house (from x = SCHOOL.x), only seen on the day-at-school mission. The plan has
// no measurements: about 50 px on the plan to a metre, so a classroom is about 8.8 by 6.8 m.
//
// Along the top: three classrooms, P's (with the sunflowers in the windows) on the left. In the middle: the hall
// with brick pillars, coat hooks and pinboards, and the stairs down at the top of it; left of the hall the group
// room (round tables, wobble stools); right of it the toilets and the corridor to the stairwell, through the glass
// double doors. Along the bottom: the bench-circle classroom with its little reading room, and two more
// classrooms. Off the stairwell landing: the support room (shoes off!) and the cleaning cupboard.
//
// Nothing here names the real school: no name, no room numbers, nobody's name on the walls.
import * as THREE from 'three';
import { WALL_HEIGHT as WH } from '../config.js';
import { TEX } from '../core/textures.js';
import { M, add, box, brickMat, castShadows, cyl, fbox, floor, group, mat, put, run, solid, wall } from '../core/build.js';
import { makeCharacter } from '../characters/character.js';
import { SCHOOL_PEOPLE } from '../characters/family.js';
import { seated } from './office.js';

export const SX = 140;   // the school's left wall, in world x
const X = x => SX + x;
const W = 26.5, D = 20;  // the main block; the stairwell sticks out on the right (to x 30.8)

// Where things are, in world coordinates [x, z] (seats: [x, y, z, facing])
export const SCHOOL = {
  x: SX, w: W + 4.3, d: D,
  arrive: [X(29.2), 13.3],                                         // at the top of the stairs
  stairsDown: [X(28.6), 13.4],                                     // going home: down the stairs
  glassDoors: [X(26.9), 12.5],                                     // the glass double doors into the corridor
  hook: [X(7.6), 10.4],                                            // P's coat hook, on the hall wall
  classDoor: [X(7.8), 7.2],                                        // just inside P's classroom
  desk: { at: [X(1.8), 4.05], seat: [X(1.8), 0.4, 3.62, Math.PI] },   // P's place at her group table
  snack: { at: [X(1.8), 4.05], seat: [X(1.8), 0.4, 3.62, Math.PI] },
  sink: [X(6.5), 6.2],                                             // the washbasin by the classroom door
  board: [X(8.2), 2.8],                                            // the blackboard (and the teacher)
  circle: { at: [X(5.2), 18.65], seat: [X(5.2), 0.42, 18.2, Math.PI] },   // on a bench in the circle
  books: [X(10.15), 18.1],                                          // the book shelves in the reading room
  cushions: { at: [X(11.1), 19.35], seat: [X(11.85), 0.22, 19.45, -Math.PI / 2] },
  groupTable: { at: [X(2.0), 11.1], seat: [X(2.0), 0.42, 10.6, Math.PI] },   // the round table in the group room
  hallTable: { at: [X(13.0), 12.3], seat: [X(13.0), 0.45, 11.85, Math.PI] },
  toilet: [X(20.5), 11.9],                                         // outside the girls' toilets
  water: [X(6.5), 6.2],
};

const CARPET = '#7d7166', WOOD = '#e2c690', FRAME = '#26346a';

/** A child's chair: wooden seat and back on a blue frame (facing 0: the sitter looks towards +z). */
function kidChair(x, z, facing, seat = WOOD) {
  const g = group(x, 0, z); g.rotation.y = facing;
  add(g, new THREE.BoxGeometry(0.36, 0.04, 0.34), mat(seat), [0, 0.4, 0]);
  add(g, new THREE.BoxGeometry(0.36, 0.26, 0.03), mat(seat), [0, 0.62, -0.17]);
  [[-0.16, -0.15], [0.16, -0.15], [-0.16, 0.15], [0.16, 0.15]].forEach(([dx, dz]) => add(g, new THREE.BoxGeometry(0.025, 0.4, 0.025), mat(FRAME), [dx, 0.2, dz]));
  add(g, new THREE.BoxGeometry(0.025, 0.25, 0.025), mat(FRAME), [-0.16, 0.53, -0.17]);
  add(g, new THREE.BoxGeometry(0.025, 0.25, 0.025), mat(FRAME), [0.16, 0.53, -0.17]);
  castShadows(g);
}

/** A table (x1..x2 by z1..z2), pale wood on blue legs. */
function table(x1, z1, x2, z2, h = 0.62, top = WOOD) {
  fbox(x1, z1, x2, z2, 0.03, top, true, h - 0.03);
  solid(x1, z1, x2, z2);
  [[x1 + 0.06, z1 + 0.06], [x2 - 0.06, z1 + 0.06], [x1 + 0.06, z2 - 0.06], [x2 - 0.06, z2 - 0.06]].forEach(([x, z]) => box(x - 0.02, z - 0.02, x + 0.02, z + 0.02, h - 0.03, 0, mat(FRAME), false));
}

/** A group of four desks pushed together (x, z: the middle), with two chairs on each long side. */
function deskGroup(x, z, chairs = true) {
  table(x - 0.8, z - 0.65, x + 0.8, z + 0.65);
  if (!chairs) return;
  [-0.4, 0.4].forEach(dx => { kidChair(x + dx, z - 0.95, 0); kidChair(x + dx, z + 0.95, Math.PI); });
}

/** A green blackboard on a wall (alongX: on a wall running along x, else along z), with its chalk tray. */
function blackboard(a1, a2, c, alongX, face) {
  const t = 0.04;
  if (alongX) { box(a1, c, a2, c + face * t, 0.55, 0.78, mat('#2f4a3a'), false); box(a1, c, a2, c + face * 0.1, 0.03, 0.75, mat('#9a968f'), false); }
  else { box(c, a1, c + face * t, a2, 0.55, 0.78, mat('#2f4a3a'), false); box(c, a1, c + face * 0.1, a2, 0.03, 0.75, mat('#9a968f'), false); }
}

/** A pinboard with children's drawings (little bright squares) on a wall. */
function pinboard(a1, a2, c, alongX, face, y0 = 0.75, seed = 1) {
  const cols = ['#e84a5f', '#3b7fc4', '#f2c81c', '#6aa84f', '#8e5bd6', '#f08a24', '#5fb7d6', '#e86a8a'];
  const n = Math.max(2, Math.floor((a2 - a1) / 0.32));
  if (alongX) box(a1, c, a2, c + face * 0.02, 0.6, y0, mat('#b98c56'), false);
  else box(c, a1, c + face * 0.02, a2, 0.6, y0, mat('#b98c56'), false);
  for (let i = 0; i < n; i++) for (let r = 0; r < 2; r++) {
    const p = a1 + 0.08 + i * ((a2 - a1 - 0.16) / n), q = p + (a2 - a1 - 0.16) / n - 0.06, y = y0 + 0.06 + r * 0.27;
    const m = mat(cols[(i * 3 + r * 5 + seed) % cols.length]);
    if (alongX) box(p, c + face * 0.02, q, c + face * 0.03, 0.22, y, m, false);
    else box(c + face * 0.02, p, c + face * 0.03, q, 0.22, y, m, false);
  }
}

/** A tall shelf of coloured boxes or trays against a wall. */
function shelves(x1, z1, x2, z2, h = 1.3, colors = ['#3b7fc4', '#e84a5f', '#f2c81c', '#6aa84f', '#e86a8a']) {
  fbox(x1, z1, x2, z2, h, '#d9b98a');
  const alongX = x2 - x1 > z2 - z1, L = alongX ? x2 - x1 : z2 - z1, n = Math.max(1, Math.floor(L / 0.36));
  for (let r = 0; r < 3; r++) for (let i = 0; i < n; i++) {
    const p = 0.04 + i * (L / n), q = p + L / n - 0.08, y = 0.15 + r * (h - 0.2) / 3, c = mat(colors[(i + r * 2) % colors.length]);
    if (alongX) box(x1 + p, z1 - 0.01, x1 + q, z2 + 0.01, 0.16, y, c, false);
    else box(x1 - 0.01, z1 + p, x2 + 0.01, z1 + q, 0.16, y, c, false);
  }
}

/** A sunflower stuck on a window (P's classroom): a yellow flower with a brown middle on a green stem. */
function sunflower(x, z) {
  box(x - 0.012, z, x + 0.012, z + 0.01, 0.3, 0.82, mat('#3f8a3a'), false);
  const f = new THREE.Mesh(new THREE.CircleGeometry(0.11, 14), new THREE.MeshBasicMaterial({ color: '#f5c518', side: THREE.DoubleSide }));
  f.position.set(x, 1.18, z + 0.012); put(f);
  const c = new THREE.Mesh(new THREE.CircleGeometry(0.05, 12), new THREE.MeshBasicMaterial({ color: '#7a4a24', side: THREE.DoubleSide }));
  c.position.set(x, 1.18, z + 0.014); put(c);
}

/** A paper kite hanging from the ceiling string (the bench-circle room). */
function kite(x, z, color) {
  const k = new THREE.Mesh(new THREE.CircleGeometry(0.13, 4), new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide }));
  k.scale.set(0.7, 1.2, 1); k.position.set(x, 1.22, z); put(k);
  box(x - 0.005, z - 0.005, x + 0.005, z + 0.005, 0.25, 0.85, mat('#f2f2f2'), false);   // its tail
}

/** A wooden bench (the circle). */
function bench(x1, z1, x2, z2) {
  fbox(x1, z1, x2, z2, 0.04, '#d8b07a', true, 0.38);
  solid(x1, z1, x2, z2);
  const alongX = x2 - x1 > z2 - z1;
  (alongX ? [[x1 + 0.08, (z1 + z2) / 2], [x2 - 0.08, (z1 + z2) / 2]] : [[(x1 + x2) / 2, z1 + 0.08], [(x1 + x2) / 2, z2 - 0.08]])
    .forEach(([x, z]) => box(x - 0.03, z - 0.12, x + 0.03, z + 0.12, 0.38, 0, mat('#c49a62'), false));
}

/** A plain classroom (the ones P doesn't go into): desk groups, the teacher's desk and a board. */
function classroom(x1, z1, x2, z2, boardOn) {
  const cx = (x1 + x2) / 2, cz = (z1 + z2) / 2;
  deskGroup(cx - 1.8, cz - 1.0); deskGroup(cx + 1.4, cz - 1.0); deskGroup(cx - 1.8, cz + 1.6); deskGroup(cx + 1.4, cz + 1.6);
  if (boardOn === 'east') blackboard(cz - 1.3, cz + 1.3, x2, false, -1);
  else blackboard(cx - 1.3, cx + 1.3, boardOn === 'north' ? z1 : z2, true, boardOn === 'north' ? 1 : -1);
  table(x2 - 1.8, z1 + 0.4, x2 - 0.5, z1 + 1.05, 0.72, '#d9b98a');
}

export function buildSchool() {
  // the floors: carpet in the classrooms and the hall, grey tiles in the toilets, red tiles in the stairwell
  floor(X(-3), -3, X(W + 8), D + 3, TEX.grass, 2, -0.005);                  // the school grounds (photos to come)
  floor(X(0), 0, X(W), D, TEX.tile, 0.5, 0.02).material.color.set(CARPET);
  floor(X(19.1), 6.9, X(26.4), 11.5, TEX.greytile, 1.2, 0.025);
  floor(X(26.5), 7.4, X(30.8), 17.0, TEX.redtile, 0.6, 0.026);
  floor(X(19.0), 11.65, X(26.5), 13.3, TEX.redtile, 0.6, 0.026);

  // outer walls with the windows: three in each classroom along the top and the bottom, the left side, the
  // stairwell's big window
  const threeWin = a => [[a + 1.0, a + 2.8, 'win'], [a + 3.6, a + 5.4, 'win'], [a + 6.2, a + 8.0, 'win']];
  run('x', X(-0.2), X(W + 0.2), -0.2, 0, [...threeWin(X(0)), ...threeWin(X(8.8)), ...threeWin(X(17.6))].map(([a, b, t]) => [a, Math.min(b, X(W)), t]));
  run('x', X(-0.2), X(W + 0.2), D, D + 0.2, [...threeWin(X(0)), [X(9.8), X(12.6), 'win'], [X(13.8), X(17.0), 'win'], ...threeWin(X(17.6))].map(([a, b, t]) => [a, Math.min(b, X(W)), t]));
  run('z', 0, D, X(-0.2), X(0), [[2.0, 4.5, 'win'], [8.0, 9.8, 'win'], [10.6, 12.4, 'win'], [14.6, 16.4, 'win'], [17.2, 19.0, 'win']]);
  run('z', 0, 6.9, X(W), X(W + 0.2), [[2.0, 5.0, 'win']]);
  run('z', 13.3, D, X(W), X(W + 0.2), [[17.6, 19.4, 'win']]);
  // the stairwell: out to the right of the main block
  run('x', X(W), X(31.0), 7.2, 7.4, [[X(28.0), X(30.0), 'win']]);
  run('z', 7.4, 17.0, X(30.8), X(31.0), [[8.0, 10.2, 'win'], [12.0, 16.4, 'win']]);
  wall(X(W), 17.0, X(31.0), 17.2);

  // inside walls: the classrooms along the top (doors into the hall), the group room, the bottom row
  run('x', X(0), X(W), 6.75, 6.9, [[X(7.2), X(8.35), 'door'], [X(15.3), X(16.3), 'door'], [X(17.5), X(18.5), 'door']]);
  wall(X(8.75), 0, X(8.9), 6.75); wall(X(17.35), 0, X(17.5), 6.75);
  run('z', 6.9, 13.3, X(6.95), X(7.1), [[8.4, 9.4, 'door']]);
  run('x', X(0), X(W), 13.3, 13.45, [[X(7.6), X(8.6), 'door'], [X(15.6), X(16.6), 'door'], [X(17.8), X(18.9), 'door']]);
  wall(X(13.15), 13.45, X(13.3), D); wall(X(17.55), 13.45, X(17.7), D);
  // the reading room inside the bench-circle classroom
  run('x', X(9.2), X(13.15), 16.75, 16.9, [[X(10.3), X(11.2), 'door']]);
  wall(X(9.1), 16.9, X(9.25), D);
  // the toilets and the little rooms on the right, the corridor to the stairwell below them
  run('z', 6.9, 11.5, X(18.95), X(19.1), [[7.3, 8.3, 'door']]);
  wall(X(19.1), 8.65, X(26.4), 8.8);
  wall(X(26.4), 6.9, X(26.55), 8.8);
  fbox(X(26.55), 7.4, X(27.6), 8.8, WH, '#f1eee8');
  wall(X(23.8), 8.8, X(23.9), 11.5); wall(X(25.6), 8.8, X(25.7), 11.5);
  run('x', X(19.0), X(27.7), 11.5, 11.65, [[X(20.0), X(21.0), 'door'], [X(24.3), X(25.1), 'door'], [X(26.0), X(26.9), 'door']]);
  wall(X(27.6), 7.4, X(27.7), 11.5);
  run('x', X(27.7), X(30.8), 10.7, 10.85, [[X(28.6), X(29.5), 'door']]);
  // the glass double doors from the corridor into the stairwell: dark frames, both doors open
  box(X(26.45), 11.65, X(26.6), 11.85, WH, 0, M.frame); box(X(26.45), 13.1, X(26.6), 13.3, WH, 0, M.frame);
  solid(X(26.45), 11.65, X(26.6), 11.85); solid(X(26.45), 13.1, X(26.6), 13.3);
  [[11.85, 1], [13.1, -1]].forEach(([z, s]) => {
    const g = group(X(26.55), 0, z); g.rotation.y = s * 1.2;
    add(g, new THREE.BoxGeometry(0.05, WH - 0.05, 0.62), M.frame, [0, (WH - 0.05) / 2, s * 0.31]);
    add(g, new THREE.BoxGeometry(0.055, WH - 0.4, 0.48), M.glass, [0, (WH - 0.05) / 2 + 0.05, s * 0.31]);
  });

  // the stairs down at the top of the hall (a railing round them) and down from the stairwell landing
  const stairs = (x1, z1, x2, z2, alongX) => {
    floor(x1, z1, x2, z2, TEX.tile, 0.5, 0.01).material.color.set('#4a4440');
    const n = 9, L = alongX ? x2 - x1 : z2 - z1;
    for (let i = 0; i < n; i++) {
      const p = (alongX ? x1 : z1) + (i + 0.5) * L / n;
      if (alongX) box(p - 0.02, z1, p + 0.02, z2, 0.02, 0.02, mat('#2a2522'), false); else box(x1, p - 0.02, x2, p + 0.02, 0.02, 0.02, mat('#2a2522'), false);
    }
    solid(x1, z1, x2, z2);
  };
  // a red railing: a handrail on posts
  const railing = (x1, z1, x2, z2) => {
    box(x1, z1, x2, z2, 0.05, 0.85, mat('#c43b3b'), false);
    const alongX = x2 - x1 > z2 - z1, L = alongX ? x2 - x1 : z2 - z1, n = Math.max(1, Math.round(L / 0.25));
    for (let i = 0; i <= n; i++) {
      const p = (alongX ? x1 : z1) + i * L / n;
      if (alongX) box(p - 0.015, z1, p + 0.015, z2, 0.85, 0, mat('#c43b3b'), false); else box(x1, p - 0.015, x2, p + 0.015, 0.85, 0, mat('#c43b3b'), false);
    }
  };
  stairs(X(8.4), 6.9, X(14.2), 8.1, true);
  railing(X(8.4), 8.06, X(14.2), 8.12); railing(X(14.16), 6.9, X(14.22), 8.12);
  stairs(X(26.8), 13.9, X(30.6), 16.9, false);
  railing(X(26.75), 13.86, X(27.95), 13.92); railing(X(26.76), 13.86, X(26.82), 16.9);   // round the landing (open at the top of the steps)

  // --- the hall: brick pillars, coat hooks, pinboards with drawings, the round table, the clock
  [[6.75, 7.0], [7.1, 12.75], [10.0, 13.05], [14.6, 13.05], [18.55, 6.95], [14.7, 6.95]].forEach(([x, z]) => {
    const [x1, z1] = [X(x), z], s = 0.42;
    box(x1, z1, x1 + s, z1 + 0.25, WH, 0, brickMat(s, WH)); solid(x1, z1, x1 + s, z1 + 0.25);
  });
  const hooks = (x, z1, z2, face = 1) => {
    box(x, z1, x + face * 0.04, z2, 0.03, 1.02, mat('#4f6a3a'), false);
    for (let z = z1 + 0.15; z < z2; z += 0.3) box(x + face * 0.04, z - 0.01, x + face * 0.09, z + 0.01, 0.05, 0.98, mat('#4f6a3a'), false);
  };
  hooks(X(7.1), 9.5, 12.5);
  hooks(X(18.95), 10.2, 11.4, -1);
  const coats = [['#e86a8a', 11.2], ['#2b2d31', 11.8], ['#7aa0c4', 12.2]];
  coats.forEach(([c, z]) => box(X(7.15), z - 0.1, X(7.3), z + 0.1, 0.5, 0.52, mat(c), false));
  pinboard(X(9.0), X(11.6), 13.3, true, -1, 0.75, 2);
  pinboard(X(12.0), X(14.4), 13.3, true, -1, 0.75, 5);
  pinboard(8.5, 10.1, X(18.95), false, -1, 0.75, 7);
  cyl(X(13.0), 11.2, 0.5, 0.62, '#eef0f2', 0, true);                                     // the round table
  [[0.75, 0], [-0.75, 0], [0, 0.75]].forEach(([dx, dz]) => kidChair(X(13.0) + dx, 11.2 + dz, Math.atan2(-dx, -dz)));
  box(X(10.95), 13.24, X(11.25), 13.27, 0.3, 1.0, mat('#f4f4f4'), false);               // the clock

  // --- P's classroom (top left): group tables, the teacher's desk by the windows, the folding blackboard on the
  // wall by the door, shelves with red trays, the washbasin, sunflowers in the windows
  [[1.8, 2.65], [4.4, 2.65], [1.8, 5.05], [4.4, 5.05]].forEach(([x, z], i) => {
    table(X(x) - 0.8, z - 0.6, X(x) + 0.8, z + 0.6);
    [-0.4, 0.4].forEach(dx => {
      if (!(i === 0 && dx === 0)) kidChair(X(x) + dx, z + 0.95, Math.PI);
      kidChair(X(x) + dx, z - 0.95, 0);
    });
  });
  kidChair(X(1.8), 3.62, Math.PI);                                                       // P's chair
  table(X(6.2), 0.55, X(7.7), 1.25, 0.72, '#d9b98a');                                     // the teacher's desk
  fbox(X(6.25), 1.3, X(6.65), 1.9, 0.62, '#d9b98a');                                      // its drawers
  blackboard(1.4, 4.2, X(8.75), false, -1);
  shelves(X(7.95), 4.0, X(8.7), 5.9, 0.9, ['#d6453a', '#d6453a', '#e86a8a']);
  box(X(6.2), 6.55, X(6.8), 6.75, 0.25, 0.65, mat('#f4f4f4'), false); solid(X(6.2), 6.5, X(6.8), 6.75);   // washbasin
  shelves(X(0.05), 0.6, X(0.5), 1.9, 1.3, ['#2f6fd6', '#6aa84f', '#f2c81c']);
  for (const a of [X(1.0), X(3.6), X(6.2)]) [0.35, 0.9, 1.45].forEach(dx => sunflower(a + dx, 0.03));
  // the classmates and the teacher
  const P = SCHOOL_PEOPLE;
  seated(P.kids[0], X(2.2), 1.7, 0, 0.4); seated(P.kids[1], X(4.0), 1.7, 0, 0.4); seated(P.kids[2], X(4.8), 3.6, Math.PI, 0.4);
  seated(P.kids[3], X(1.4), 4.1, 0, 0.4); seated(P.kids[4], X(4.4), 6.0, Math.PI, 0.4); seated(P.kids[5], X(2.2), 6.0, Math.PI, 0.4);
  const teacher = makeCharacter(P.teacher);
  teacher.root.position.set(X(8.2), 0, 2.8); teacher.root.rotation.y = -Math.PI / 2; put(teacher.root);
  solid(X(7.95), 2.55, X(8.45), 3.05);

  // --- the group room (left, between P's classroom and the bench-circle room): round tables with red, blue and
  // yellow wobble chairs, desks under the windows, a whiteboard and a washbasin by the door
  cyl(X(2.0), 9.6, 0.75, 0.62, '#e2c690', 0, true);
  [['#d6453a', 0.95, 0], ['#3b5fc4', -0.95, 0], ['#f2a81c', 0, -0.95]].forEach(([c, dx, dz]) => kidChair(X(2.0) + dx, 9.6 + dz, Math.atan2(-dx, -dz), c));
  kidChair(X(2.0), 10.6, Math.PI, '#3b5fc4');
  deskGroup(X(4.6), 11.4);
  table(X(0.1), 7.2, X(0.75), 12.6, 0.62, '#f2f2f2');                                     // desks under the windows
  box(X(6.9), 10.8, X(6.95), 12.4, 0.6, 0.75, mat('#f6f7f8'), false);                    // whiteboard
  box(X(5.2), 7.0, X(5.8), 7.2, 0.25, 0.65, mat('#f4f4f4'), false); solid(X(5.2), 6.95, X(5.8), 7.25);   // washbasin
  fbox(X(5.9), 7.0, X(6.7), 7.5, 0.85, '#c9cfc2');                                        // cupboard

  // --- the bench-circle classroom (bottom left): benches round two little white tables, the blackboard and
  // cupboards, shelves of boxes, kites hanging from the ceiling, a table alcove by the window
  [[3.4, 15.35, 6.0, 15.75], [3.4, 18.0, 6.0, 18.4]].forEach(b => bench(X(b[0]), b[1], X(b[2]), b[3]));
  bench(X(2.4), 15.9, X(2.8), 17.9); bench(X(6.6), 15.9, X(7.0), 17.9);
  fbox(X(4.1), 16.4, X(5.3), 17.0, 0.45, '#f4f4f4');
  box(X(4.5), 16.6, X(4.8), 16.8, 0.15, 0.45, mat('#b98c56'), false);                      // the story box
  blackboard(X(8.6), X(11.6), 13.45, true, 1);
  fbox(X(8.7), 13.5, X(12.0), 13.95, 0.85, '#d9b98a');
  shelves(X(12.6), 13.5, X(13.1), 16.6, 1.3);
  deskGroup(X(1.6), 19.0, false);
  [[1.2, 19.55], [2.0, 19.55]].forEach(([x, z]) => kidChair(X(x), z, Math.PI));
  table(X(0.1), 13.6, X(0.7), 15.2, 0.62, '#f2f2f2');
  ['#e84a5f', '#3b7fc4', '#f2c81c', '#6aa84f', '#8e5bd6', '#f08a24', '#e86a8a', '#5fb7d6'].forEach((c, i) => kite(X(2.0 + i * 1.05), 14.6 + (i % 3) * 1.4, c));
  box(X(2.8), 16.3, X(3.3), 16.32, 0.002, 0.03, mat('#e84a5f'), false);                    // coloured dots on the floor
  // the reading room: shelves of labelled boxes and games, a low bookcase, a mattress with cushions, small tables
  shelves(X(9.3), 17.0, X(9.75), 19.9, 1.35, ['#dfe9f2', '#dfe9f2', '#5fb7d6']);
  fbox(X(11.6), 16.95, X(13.1), 17.35, 0.75, '#d9b98a');                                 // a low bookcase
  fbox(X(11.5), 19.0, X(13.1), 19.95, 0.18, '#dcdcdc');                                   // the mattress
  box(X(12.7), 19.1, X(13.05), 19.9, 0.18, 0.18, mat('#bfe3d0'), false);                  // cushions
  table(X(11.9), 17.6, X(13.05), 18.3);
  kidChair(X(12.45), 18.55, Math.PI);

  // --- the other classrooms: three more along the top and the bottom
  classroom(X(8.9), 0, X(17.35), 6.75, 'east');
  classroom(X(17.5), 0, X(W), 6.75, 'east');
  classroom(X(17.7), 13.45, X(W), D, 'north');
  deskGroup(X(15.4), 16.0); deskGroup(X(15.4), 18.6, false);

  // --- the toilets (cubicles and basins), the store, the cleaning cupboard (open: a sink, a ladder, a hoover), the
  // support room on the landing (shoes off at the door), and the plant on the stairwell windowsill
  [20.0, 21.2, 22.4, 23.6, 24.8].forEach(x => box(X(x), 6.95, X(x + 0.05), 7.9, 1.2, 0, mat('#9bb7c9'), false));
  [20.0, 21.2, 22.4].forEach(x => box(X(x), 9.8, X(x + 0.05), 11.45, 1.2, 0, mat('#e8a7b5'), false));
  fbox(X(19.2), 8.85, X(23.7), 9.25, 0.8, '#f4f4f4');
  fbox(X(25.8), 8.85, X(26.4), 9.4, 0.85, '#f4f4f4');                                      // the cleaning sink
  box(X(27.2), 9.2, X(27.5), 9.25, 1.3, 0, mat('#c9ccd1'), false);                         // the ladder
  cyl(X(27.1), 10.6, 0.2, 0.4, '#e0c21c', 0, true);                                        // the hoover
  table(X(28.2), 8.0, X(29.8), 9.2);
  box(X(28.6), 10.85, X(29.5), 10.88, 0.3, 0.95, mat('#f4f4f4'), false);                   // the notices on its door
  cyl(X(30.55), 15.0, 0.22, 0.4, '#b5643c', 0.8);                                          // a pot plant on the sill
  fbox(X(30.3), 12.2, X(30.75), 13.4, 0.6, '#7a2a2a');                                     // radiator

  // P's coat: on her hook once she's hung it up
  const coat = group(X(7.22), 0.52, 10.4); coat.visible = false;
  add(coat, new THREE.BoxGeometry(0.14, 0.5, 0.26), mat('#c4477a'), [0, 0.25, 0]);

  return { schoolCoat: coat, schoolTeacher: teacher };
}

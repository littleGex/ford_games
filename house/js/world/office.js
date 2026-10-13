// Dad's office, from his sketch: a long single-storey building away from the house (at x = OFFICE.x, so it's
// never on screen at the same time). Far end: the fire door. Open-plan desks down both sides under the
// windows. Near end, left of the corridor: the boss's office (desk and a round meeting table) and a meeting
// room; right of it: Dad's room (his desk), the kitchen (fridge, coffee machine, sink, bins) and the
// bathroom. The entrance is at the near end, with a bike rack outside. Outside the windows on the boss's
// side: a pavement, a road, then a green space; on Dad's side a green courtyard. Behind the fire door: the
// assembly point for fire drills, and a clock-in machine just inside the entrance. Colleagues sit at some desks, the boss at the round table.
import * as THREE from 'three';
import { WALL_HEIGHT as WH } from '../config.js';
import { TEX, canvasTex } from '../core/textures.js';
import { M, add, ball, box, bush, castShadows, cyl, fbox, floor, group, mat, put, run, solid, wall } from '../core/build.js';
import { makeCharacter } from '../characters/character.js';
import { OFFICE_PEOPLE } from '../characters/family.js';

export const OX = 40;   // the office's left wall, in world x
const W = 6.2, D = 13.7;   // inside width and depth (one sketch square = 25 cm)
const X = x => OX + x;

// Where things are in the office, in world coordinates [x, z]. desk: Dad's desk (where to stand, and the seat).
export const OFFICE = {
  x: OX, w: W, d: D,
  arrive: [X(3.0), 15.3],                          // getting off the bike at the rack
  rack: [X(4.35), 15.05],                          // where the bike stands in the rack
  leave: [X(1.0), 15.6],                           // riding off towards the road
  desk: { at: [X(4.9), 8.92], seat: [X(4.9), 0.45, 8.68, Math.PI] },
  boss: { at: [X(1.75), 9.35], seat: [X(1.82), 0.45, 8.95, -Math.PI / 2] },
  meeting: { at: [X(1.9), 11.75], seat: [X(1.82), 0.45, 11.25, -Math.PI / 2] },
  fridge: [X(3.6), 10.9], coffee: { at: [X(4.95), 10.95], seat: [X(4.95), 0, 11.12, Math.PI] }, sink: [X(5.65), 10.95],
  toilet: [X(4.7), 12.95],
  clock: [X(2.62), 13.4],                          // the clock-in machine just inside the entrance
  fireDoor: [X(3.1), 0.45],                        // inside, by the fire door
  assembly: [X(3.1), -2.4],                        // the assembly point outside it
};

/** A seated figure (a colleague at a desk, the boss at the table). */
export function seated(spec, x, z, facing, seatY = 0.45) {
  const c = makeCharacter(spec);
  c.legs.forEach(l => { l.rotation.x = -1.45; });
  c.arms.forEach(a => { a.rotation.x = -0.6; });
  c.fig.position.y = seatY + 0.05 - 0.44 * c.scale;
  c.root.position.set(x, 0, z); c.root.rotation.y = facing;
  put(c.root);
  return c;
}

export function chair(x, z, facing) {
  const g = group(x, 0, z); g.rotation.y = facing;
  add(g, new THREE.BoxGeometry(0.42, 0.06, 0.42), mat('#2b2d31'), [0, 0.45, 0]);
  add(g, new THREE.BoxGeometry(0.42, 0.45, 0.05), mat('#2b2d31'), [0, 0.7, -0.2]);
  add(g, new THREE.CylinderGeometry(0.03, 0.03, 0.42, 8), mat('#9aa1a8'), [0, 0.22, 0]);
  add(g, new THREE.CylinderGeometry(0.22, 0.22, 0.03, 12), mat('#2b2d31'), [0, 0.03, 0]);
  castShadows(g);
}

/** One desk (x1..x2 by z1..z2) whose sitter faces `towards` (+1: +z, -1: -z): two monitors, a laptop, a chair. */
export function desk(x1, z1, x2, z2, towards) {
  fbox(x1, z1, x2, z2, 0.73, '#e9e6df');
  const cx = (x1 + x2) / 2, back = towards > 0 ? z2 - 0.12 : z1 + 0.12, front = towards > 0 ? z1 : z2;
  [-0.32, 0.32].forEach(dx => {
    box(cx + dx - 0.27, back - 0.02, cx + dx + 0.27, back + 0.02, 0.32, 0.86, mat('#1d1e22'), false);   // screen
    box(cx + dx - 0.03, back - 0.03, cx + dx + 0.03, back + 0.03, 0.13, 0.73, mat('#5a5f67'), false);   // stand
  });
  box(cx + 0.45, front + towards * 0.18, cx + 0.75, front + towards * 0.4, 0.015, 0.73, mat('#c9ccd1'), false);   // laptop
  chair(cx, front - towards * 0.25, towards > 0 ? 0 : Math.PI);
  return { cx, back };
}

/** A pair of desks facing each other across the middle of x1..x2 by z1..z2. */
export function deskPair(x1, z1, x2, z2) {
  const mid = (z1 + z2) / 2;
  return [desk(x1, z1, x2, mid, 1), desk(x1, mid, x2, z2, -1)];
}

/** Dad's two monitors light up while he works: a page for each kind of work (call, mail, doc, code). */
export function officeScreen(cx, z) {
  const pages = {
    call: g => { g.fillStyle = '#26324a'; g.fillRect(0, 0, 256, 128); ['#e8b48f', '#c99a78', '#f1d1ba', '#a87b5a'].forEach((c, i) => { g.fillStyle = '#3b4a68'; g.fillRect(8 + (i % 2) * 124, 8 + Math.floor(i / 2) * 60, 116, 52); g.fillStyle = c; g.beginPath(); g.arc(66 + (i % 2) * 124, 34 + Math.floor(i / 2) * 60, 14, 0, 7); g.fill(); }); },
    mail: g => { g.fillStyle = '#f4f6f8'; g.fillRect(0, 0, 256, 128); for (let i = 0; i < 7; i++) { g.fillStyle = i === 1 ? '#cfe0f5' : '#ffffff'; g.fillRect(6, 6 + i * 17, 244, 14); g.fillStyle = '#6b7686'; g.fillRect(12, 11 + i * 17, 60, 4); g.fillRect(84, 11 + i * 17, 120, 4); } },
    doc: g => { g.fillStyle = '#e9edf2'; g.fillRect(0, 0, 256, 128); g.fillStyle = '#ffffff'; g.fillRect(40, 4, 176, 124); g.fillStyle = '#2f6fd6'; g.fillRect(54, 14, 100, 8); g.fillStyle = '#9aa3ae'; for (let i = 0; i < 9; i++) g.fillRect(54, 30 + i * 10, 120 + (i % 3) * 14, 4); },
    code: g => { g.fillStyle = '#1e2430'; g.fillRect(0, 0, 256, 128); const cs = ['#7fd3ff', '#ffd27a', '#b8f28a', '#ff9f9f', '#c9b1ff']; for (let i = 0; i < 11; i++) { g.fillStyle = cs[i % 5]; g.fillRect(10 + (i % 4) * 12, 6 + i * 11, 40 + ((i * 37) % 120), 5); } },
  };
  const screen = group(cx, 0.86 + 0.16, z); screen.visible = false;
  for (const [name, draw] of Object.entries(pages)) {
    const page = new THREE.Group(); page.name = name; page.visible = false; screen.add(page);
    const tex = canvasTex(draw, 256);
    [-0.32, 0.32].forEach(dx => {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.28), new THREE.MeshBasicMaterial({ map: tex }));
      m.position.set(dx, 0, 0.025); page.add(m);
    });
  }
  return screen;
}

export function buildOffice() {
  // outside: a road and a green space beyond the boss's side, a green courtyard on Dad's side, paving at
  // both ends with the bike rack by the entrance and the assembly point behind the fire door
  floor(X(-14), -8, X(W + 15), 22, TEX.grass, 2, -0.005);                            // grass under everything
  floor(X(-14), -8, X(-5.2), 22, TEX.grass, 2, 0);                                   // the green space
  floor(X(-5.2), -8, X(-1.35), 22, TEX.asphalt, 2, 0.01);                            // the road
  box(X(-1.48), -8, X(-1.35), 22, 0.09, 0, mat('#9a968f'), false);                    // kerb
  floor(X(-1.35), -8, X(0), 22, TEX.paving, 0.8, 0.02);                              // pavement under the windows
  floor(X(0), -4, X(W), -0.1, TEX.paving, 0.8, 0.02);                                // behind the fire door
  floor(X(0), D + 0.1, X(W + 1.5), 17, TEX.paving, 0.8, 0.02);                       // in front of the entrance
  floor(X(W + 0.1), -4, X(W + 9), D + 0.1, TEX.grass, 2, 0);                         // the courtyard
  floor(X(W + 0.1), 5.6, X(W + 9), 6.6, TEX.paving, 0.8, 0.015);                     // a path across it
  floor(X(-14), 17, X(W + 9), 22, TEX.grass, 2, 0);
  [[X(-8), 3, 0.9], [X(-10), 9, 1.1], [X(-7.5), 15, 0.8], [X(W + 4.5), 2, 0.9], [X(W + 6.5), 10.5, 1.0]].forEach(([x, z, r]) => {
    cyl(x, z, 0.14, 1.4, '#5a4a3c', 0, true); ball(x, 1.8, z, r, '#4f8a3a');
  });
  [[X(W + 1), 1.5], [X(W + 1.2), 12.3], [X(W + 3), 8]].forEach(([x, z], i) => bush(x, z, 0.45, i % 2 ? '#2f5b2e' : '#3b6b36'));
  fbox(X(W + 2.6), 4.3, X(W + 3.8), 4.75, 0.45, '#a87b4f');                          // courtyard bench
  // the bike rack: hoops in a row
  for (let i = 0; i < 4; i++) {
    const x = X(3.6) + i * 0.5;
    box(x - 0.02, 14.75, x + 0.02, 14.8, 0.7, 0, mat('#9aa1a8'), false);
    box(x - 0.02, 15.3, x + 0.02, 15.35, 0.7, 0, mat('#9aa1a8'), false);
    box(x - 0.02, 14.75, x + 0.02, 15.35, 0.04, 0.68, mat('#9aa1a8'), false);
  }
  // assembly point: a green sign on a post
  cyl(X(3.1) + 0.6, -2.9, 0.03, 1.5, '#9aa1a8');
  box(X(3.1) + 0.4, -2.93, X(3.1) + 0.8, -2.89, 0.4, 1.2, mat('#2fa34f'), false);
  box(X(3.1) + 0.53, -2.94, X(3.1) + 0.67, -2.88, 0.18, 1.3, mat('#ffffff'), false);

  // floors: carpet in the offices, tiles in the kitchen and bathroom
  floor(X(0), 0, X(W), D, TEX.tile, 0.5, 0.02).material.color.set('#8d97a5');
  floor(X(3.05), 9.7, X(W), 12.1, TEX.greytile, 1.2, 0.025);
  floor(X(3.05), 12.2, X(W), D, TEX.greytile, 1.2, 0.025);

  // outer walls with the windows from the sketch, the fire door at the far end, the entrance at the near end
  run('z', 0, D, X(-0.1), X(0), [[0.75, 2.4, 'win'], [3.85, 5.75, 'win'], [7.2, 8.75, 'win']]);
  run('z', 0, D, X(W), X(W + 0.1), [[2.2, 4.7, 'win'], [4.9, 5.75, 'win'], [7.3, 8.75, 'win']]);
  run('x', X(-0.1), X(W + 0.1), -0.1, 0, [[X(2.5), X(3.75), 'door']]);
  run('x', X(-0.1), X(W + 0.1), D, D + 0.1, [[X(2.3), X(2.95), 'door']]);
  box(X(2.5), -0.12, X(3.75), -0.1, 1.2, 0, mat('#2fa34f'), false);                  // green fire door frame
  // inside walls: the boss's office and the meeting room on the left of the corridor, Dad's room, the kitchen
  // and the bathroom on the right
  wall(X(0), 6.4, X(2.25), 6.5);
  run('z', 6.5, 9.75, X(2.25), X(2.35), [[8.0, 8.7, 'door']]);
  wall(X(0), 9.75, X(2.25), 9.85);
  run('z', 9.85, D, X(2.25), X(2.35), [[11.95, 12.65, 'door']]);
  wall(X(2.95), 5.95, X(W), 6.05);
  run('z', 6.05, 9.6, X(2.95), X(3.05), [[8.05, 8.75, 'door']]);
  wall(X(2.95), 9.6, X(W), 9.7);
  run('z', 9.7, 12.1, X(2.95), X(3.05), [[10.05, 10.75, 'door']]);
  wall(X(2.95), 12.1, X(W), 12.2);
  run('z', 12.2, D, X(2.95), X(3.05), [[12.6, 13.3, 'door']]);

  // open plan: desk pairs down both sides, cupboards
  deskPair(X(0.4), 0.7, X(2.05), 2.4);
  fbox(X(0.05), 3.0, X(2.1), 3.5, 1.0, '#c9b28f');
  deskPair(X(0.4), 4.0, X(2.2), 5.9);
  fbox(X(3.95), 0.05, X(W - 0.05), 0.95, 1.0, '#c9b28f');
  deskPair(X(4.2), 1.8, X(5.85), 3.55);
  desk(X(4.2), 5.05, X(5.8), 5.75, 1);

  // Dad's room: cupboards, his desk pair (he sits on the near side, facing the far wall)
  fbox(X(3.05), 6.4, X(3.5), 7.9, 1.0, '#c9b28f');
  fbox(X(3.7), 9.2, X(5.0), 9.55, 0.8, '#c9b28f');
  const [, dads] = deskPair(X(4.1), 6.9, X(5.7), 8.4);
  const officeScreenGroup = officeScreen(dads.cx, dads.back - 0.04); officeScreenGroup.rotation.y = Math.PI;
  box(X(4.15), 8.1, X(4.35), 8.3, 0.1, 0.73, mat('#d6453a'), false);   // Dad's mug

  // the boss's office: desk, and a round table with two chairs for meetings
  desk(X(0.33), 6.9, X(1.9), 7.75, -1);
  cyl(X(1.3), 8.95, 0.38, 0.72, '#e9e6df', 0, true);
  chair(X(0.75), 8.95, Math.PI / 2); chair(X(1.85), 8.95, -Math.PI / 2);
  box(X(0.05), 9.3, X(0.6), 9.7, 1.0, 0, mat('#6b8f5a'), false);   // a big plant in the corner

  // the meeting room: a long table with chairs and a screen on the wall
  fbox(X(0.55), 10.7, X(1.55), 12.8, 0.72, '#e9e6df');
  [11.25, 12.25].forEach(z => { chair(X(0.3), z, Math.PI / 2); chair(X(1.82), z, -Math.PI / 2); });
  box(X(0.6), D - 0.05, X(1.5), D - 0.02, 0.5, 0.8, mat('#1d1e22'), false);

  // the kitchen: counter along the end wall with the fridge, the coffee machine and the sink, the bins
  fbox(X(3.1), 11.4, X(W - 0.05), 12.08, 0.9, '#f2f2f2');
  fbox(X(3.15), 11.3, X(3.95), 12.05, WH - 0.05, '#c9ccd1');                                  // fridge
  box(X(4.8), 11.55, X(5.12), 11.85, 0.38, 0.9, mat('#1d1e22'), false);                       // coffee machine
  box(X(5.25), 11.5, X(6.0), 11.95, 0.02, 0.9, mat('#9aa1a8'), false);                        // sink
  cyl(X(5.62), 11.98, 0.015, 0.22, '#c9ccd1', 0.9);
  [[9.95, '#2b2d31'], [10.4, '#2f6fd6'], [10.85, '#f2c81c']].forEach(([z, c]) => fbox(X(5.75), z, X(6.15), z + 0.4, 0.75, c));

  // the clock-in machine on the corridor wall just inside the entrance: a grey box with a little green screen
  box(X(2.35), 13.25, X(2.42), 13.55, 0.3, 0.95, mat('#5a5f67'), false);
  box(X(2.42), 13.3, X(2.43), 13.5, 0.12, 1.08, new THREE.MeshBasicMaterial({ color: '#7fe08a' }), false);

  // the bathroom: toilet and basin
  fbox(X(5.45), 13.0, X(6.0), 13.65, 0.42, '#f4f4f4');
  fbox(X(3.6), 12.25, X(4.3), 12.6, 0.8, '#f4f4f4');

  // colleagues at their desks, and the boss at the round table
  const P = OFFICE_PEOPLE;
  seated(P.colleagueA, X(1.22), 0.45, 0); seated(P.colleagueB, X(1.31), 3.75, 0);
  seated(P.colleagueC, X(5.02), 3.8, Math.PI); seated(P.colleagueD, X(4.9), 6.65, 0);
  const boss = seated(P.boss, X(0.78), 8.95, Math.PI / 2);
  seated(P.colleagueA, X(0.32), 11.25, Math.PI / 2); seated(P.colleagueC, X(0.32), 12.25, Math.PI / 2);

  // what systems need: Dad's screens
  return { officeScreen: officeScreenGroup, officeBoss: boss };
}

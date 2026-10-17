// Birthdays (from the players' birthdays, players.js, maybe from the family server): on someone's birthday the
// dining room gets balloons and a "Happy birthday" banner with their name, there's a cake in the fridge with
// candles to light, presents on the table, and Grandma and Grandpa come to the door with another present.
// The day's birthday jobs are in jobs.js; this builds the decorations and runs the cake, presents and guests.
import * as THREE from 'three';
import { S } from '../state.js';
import { add, group, mat } from '../core/build.js';
import { dingDong, music } from '../core/audio.js';
import { makeCharacter } from '../characters/character.js';
import { charMat as M } from '../characters/character.js';

export const NAMES = { dad: 'Dad', mum: 'Mum', girl: 'P', boy: 'Dude' };
// Where things happen, plan coordinates [x, z] (ground floor)
export const BD = {
  table: { at: [2.5, 7.0], seat: [2.5, 0, 6.95, -Math.PI / 2], cake: [1.45, 0.75, 6.85] },   // standing at the dining table
  sofa: { at: [0.6, 3.0], seat: [0.55, 0.42, 3.0, Math.PI / 2] },                              // blowing up balloons
  banner: [0.45, 5.85],                                                                        // by the grey wall in the dining room
  presents: [[1.2, 0.75, 7.55], [1.65, 0.75, 7.75], [1.3, 0.75, 7.95], [1.7, 0.75, 7.3]],     // on the table (the fourth: Grandma and Grandpa's)
  door: [3.92, 9.3],
};
// What's in the presents (made up): three for whoever's birthday it is
export const GIFTS = {
  girl: ['a book all about bearded dragons', 'a box of glitter pens', 'roller-skate knee pads'],
  boy: ['a space rocket building kit', 'a new clarinet songbook', 'a football'],
  mum: ['a pot plant for the office', 'a cosy scarf', 'her favourite chocolates'],
  dad: ['a bright bike light', 'a spool of glow-in-the-dark filament', 'a pair of funny socks'],
};
const WRAP = ['#e84a5f', '#3b7fc4', '#f2c81c', '#8e5bd6'], RIBBON = ['#f7f6f2', '#f2c81c', '#e84a5f', '#3fa36b'];

/** A wrapped present: a box with a ribbon both ways and a bow. */
export function makePresent(g, i, s = 1) {
  add(g, new THREE.BoxGeometry(0.2 * s, 0.14 * s, 0.16 * s), mat(WRAP[i % 4]), [0, 0.07 * s, 0]);
  add(g, new THREE.BoxGeometry(0.205 * s, 0.145 * s, 0.03 * s), mat(RIBBON[i % 4]), [0, 0.07 * s, 0]);
  add(g, new THREE.BoxGeometry(0.03 * s, 0.145 * s, 0.165 * s), mat(RIBBON[i % 4]), [0, 0.07 * s, 0]);
  [-1, 1].forEach(k => add(g, new THREE.TorusGeometry(0.025 * s, 0.008 * s, 6, 12), mat(RIBBON[i % 4]), [k * 0.02 * s, 0.15 * s, 0], null, [0, k * 0.6, 0]));
}

/** The cake: two tiers of sponge with icing, candles that can be lit, and a slice that can be cut out. */
export function makeCake(g) {
  const plate = add(g, new THREE.CylinderGeometry(0.17, 0.17, 0.012, 24), mat('#f4f4f2'), [0, 0.006, 0]);
  const cake = new THREE.Group(); cake.name = 'cake'; g.add(cake);
  add(cake, new THREE.CylinderGeometry(0.13, 0.13, 0.09, 24), mat('#f6d6e0'), [0, 0.057, 0]);
  add(cake, new THREE.CylinderGeometry(0.132, 0.132, 0.015, 24), mat('#e86a8a'), [0, 0.1, 0]);
  [0, 1, 2, 3, 4, 5, 6, 7].forEach(k => { const a = k / 8 * Math.PI * 2; add(cake, new THREE.SphereGeometry(0.012, 8, 6), mat(['#3b7fc4', '#f2c81c', '#3fa36b', '#ffffff'][k % 4]), [Math.cos(a) * 0.1, 0.11, Math.sin(a) * 0.1]); });
  const flames = [];
  for (let k = 0; k < 5; k++) {
    const a = k / 5 * Math.PI * 2;
    add(cake, new THREE.CylinderGeometry(0.006, 0.006, 0.06, 6), mat(['#f2f2f2', '#c8b1e8', '#7fc4e8'][k % 3]), [Math.cos(a) * 0.06, 0.14, Math.sin(a) * 0.06]);
    flames.push(add(cake, new THREE.SphereGeometry(0.011, 8, 6), new THREE.MeshBasicMaterial({ color: '#ffb02e' }), [Math.cos(a) * 0.06, 0.18, Math.sin(a) * 0.06], [1, 1.6, 1]));
  }
  const slice = new THREE.Group(); slice.name = 'slice'; slice.visible = false; g.add(slice);   // a slice on its own plate, cut out
  add(slice, new THREE.CylinderGeometry(0.06, 0.06, 0.008, 16), mat('#f4f4f2'), [0.24, 0.004, 0.02]);
  add(slice, new THREE.BoxGeometry(0.06, 0.09, 0.04), mat('#f6d6e0'), [0.24, 0.053, 0.02]);
  void plate;
  return { flames, slice };
}

function walker(spec, scene) {
  const c = makeCharacter(spec);
  c.root.visible = false; scene.add(c.root);
  return { c, path: [], phase: 0 };
}

// Grandma and Grandpa (made-up looks), who come for the birthday with a present
const GRANDMA = { scale: 0.92, skin: '#f1d1ba', pants: '#5a4f6e', shoes: '#4a3a2c', brow: '#c4c4c2', blush: true, topMat: M('#8e5bd6'),
  hair: h => { const m = M('#e4e4e2'); add(h, new THREE.SphereGeometry(0.228, 28, 16, 0, Math.PI * 2, 0, Math.PI * 0.36), m, [0, 0.01, -0.005], [1, 1.08, 1]); add(h, new THREE.SphereGeometry(0.11, 16, 12), m, [0, 0.17, -0.15]); } };
const GRANDPA = { scale: 0.97, skin: '#e3b796', pants: '#3a3d42', shoes: '#2b2016', brow: '#d0d0ce', topMat: M('#3f6a3b'),
  hair: h => { const m = M('#d6d6d4'); add(h, new THREE.SphereGeometry(0.226, 28, 16, Math.PI * 1.5 - 1.6, 3.2, Math.PI * 0.22, Math.PI * 0.32), m, [0, 0, -0.015], [1, 1.04, 1]); } };
const STREET = [[3.92, 13.1], [3.92, 12.2]], AT_DOOR = [[3.72, 9.95], [4.12, 9.95]];

export function createBirthday({ stage, items, board, hud, players }) {
  const scene = stage.scene;
  const all = group(0, 0, 0); all.visible = false;
  let who = null, wasSinging = false;

  // balloons: bunches of three on strings, tied down by the sofa and in the dining-room corners
  const balloons = new THREE.Group(); all.add(balloons);
  const BALLOON = ['#e84a5f', '#f2c81c', '#3b7fc4', '#3fa36b', '#8e5bd6', '#f08a24'];
  [[0.3, 0.35], [0.28, 8.55], [3.0, 8.55], [3.0, 0.4]].forEach(([x, z], b) => {
    add(balloons, new THREE.SphereGeometry(0.035, 8, 6), mat('#555a62'), [x, 0.035, z]);   // the weight
    [[-0.12, 1.75, 0.02], [0.1, 1.85, -0.06], [0.0, 1.6, 0.1]].forEach(([dx, y, dz], k) => {
      add(balloons, new THREE.SphereGeometry(0.13, 16, 12), new THREE.MeshStandardMaterial({ color: BALLOON[(b * 3 + k) % 6], roughness: 0.25 }), [x + dx, y, z + dz], [1, 1.2, 1]);
      add(balloons, new THREE.CylinderGeometry(0.003, 0.003, y - 0.12, 4), mat('#d0d0d0'), [x + dx / 2, (y - 0.12) / 2, z + dz / 2], null, [dz * 0.5, 0, -dx * 0.5]);
    });
  });

  // the banner on the grey wall of the dining room, above the posters, with the birthday person's name
  const banner = new THREE.Group(); all.add(banner);
  const bannerMat = new THREE.MeshBasicMaterial({ transparent: true, side: THREE.DoubleSide, alphaTest: 0.1 });
  add(banner, new THREE.PlaneGeometry(1.8, 0.25), bannerMat, [0.045, 1.25, 7.1], null, [0, Math.PI / 2, 0]);
  function paintBanner(name) {
    const c = document.createElement('canvas');
    if (!c.getContext) return;
    c.width = 512; c.height = 72;
    const g = c.getContext('2d'), flags = ['#e84a5f', '#f2c81c', '#3b7fc4', '#3fa36b', '#8e5bd6', '#f08a24'];
    g.fillStyle = '#5a4a3a'; g.fillRect(0, 2, 512, 3);   // the string
    for (let i = 0; i < 16; i++) { g.fillStyle = flags[i % 6]; g.beginPath(); g.moveTo(i * 32, 4); g.lineTo(i * 32 + 30, 4); g.lineTo(i * 32 + 15, 26); g.fill(); }
    g.font = 'bold 34px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineWidth = 6; g.strokeStyle = '#3a2a4e'; g.fillStyle = '#ffd34d';
    g.strokeText(`Happy birthday, ${name}!`, 256, 50, 500); g.fillText(`Happy birthday, ${name}!`, 256, 50, 500);
    bannerMat.map = new THREE.CanvasTexture(c); bannerMat.needsUpdate = true;
  }

  // presents on the table (three from the family, one from Grandma and Grandpa once they've been)
  const presents = BD.presents.map((p, i) => { const g = group(...p); makePresent(g, i); all.add(g); return g; });

  // Grandma and Grandpa
  const guests = [walker(GRANDMA, scene), walker(GRANDPA, scene)];
  let visit = null;   // 'coming' | 'waiting' | 'leaving'
  const handPresent = new THREE.Group(); makePresent(handPresent, 3, 0.9); handPresent.position.set(0, 0.55, 0.3); guests[1].c.root.add(handPresent);

  scene.add(all);

  function walk(k, dt) {
    const p = k.c.root.position;
    while (k.path.length) {
      const t = k.path[0], dx = t[0] - p.x, dz = t[1] - p.z, d = Math.hypot(dx, dz);
      if (d < 0.04) { k.path.shift(); continue; }
      const s = Math.min(d, 1.3 * dt);
      p.x += dx / d * s; p.z += dz / d * s; k.c.root.rotation.y = Math.atan2(dx, dz); k.phase += dt * 9;
      return true;
    }
    return false;
  }
  function animate(k, walking, dt) {
    const c = k.c, a = Math.min(1, dt * 12), sw = walking ? Math.sin(k.phase) * 0.5 : 0;
    c.legs[0].rotation.x += (sw - c.legs[0].rotation.x) * a; c.legs[1].rotation.x += (-sw - c.legs[1].rotation.x) * a;
    c.arms.forEach((x, i) => { const t = handPresent.parent === c.root && handPresent.visible ? -1.1 : (i ? -sw : sw) * 0.8; x.rotation.x += (t - x.rotation.x) * a; });
  }
  const walkTime = () => (Math.hypot(0, STREET[0][1] - STREET[1][1]) + Math.hypot(STREET[1][0] - AT_DOOR[0][0], STREET[1][1] - AT_DOOR[0][1])) / 1.3 + 0.6;
  function sendHome() { guests.forEach(g => { g.c.root.visible = false; g.path = []; }); visit = null; }

  function update(dt, time) {
    if (!who) return;
    // the candles flicker; the song plays while everyone sings
    const cake = items.cake.userData.cake;
    if (cake) cake.flames.forEach((f, i) => { f.scale.y = 1.4 + Math.sin(time * 17 + i * 2) * 0.35; });
    const singing = !!(S.sitting && S.sitting.step.song);
    if (singing !== wasSinging) { music(singing ? 'birthday' : null); wasSinging = singing; }
    if (S.dayOver || S.mission) { if (visit) sendHome(); return; }
    // Grandma and Grandpa set off so they ring as the wait ends
    const job = board.find('bdayGuests'), s = job && board.step(job);
    if (!visit && s && s.kind === 'wait' && (s.prog || 0) >= s.dur - walkTime()) {
      guests.forEach((g, i) => { g.c.root.visible = true; g.c.root.position.set(STREET[0][0] + (i ? 0.3 : -0.3), 0, STREET[0][1]); g.path = [[STREET[1][0] + (i ? 0.2 : -0.2), STREET[1][1]], [...AT_DOOR[i]]]; });
      handPresent.visible = true; visit = 'coming';
    }
    if (visit) {
      let any = false;
      guests.forEach(g => { const w = walk(g, dt); any = any || w; animate(g, w, dt); });
      if (visit === 'coming' && !any) { visit = 'waiting'; guests.forEach(g => { g.c.root.rotation.y = Math.PI; }); dingDong(); }
      if (visit === 'leaving' && !any) sendHome();
    }
  }

  return {
    update,
    get who() { return who; },
    get guests() { return visit; },
    /** Start of a day: whose birthday it is today (or nobody), and everything set up for it. */
    reset(key) {
      who = key || null;
      all.visible = !!who; sendHome();
      balloons.visible = banner.visible = true;
      presents.forEach((p, i) => { p.visible = i < 3; });
      if (who) { paintBanner(NAMES[who]); const age = players && players.age(who); hud.toast(`🎂 It's ${NAMES[who]}'s birthday today${age ? `: ${NAMES[who]} is ${age}!` : '!'}`); }
    },
    hide(what) { [].concat(what).forEach(k => { ({ balloons, banner })[k].visible = false; }); },
    show(what) { [].concat(what).forEach(k => { ({ balloons, banner })[k].visible = true; }); },
    // --- the cake
    cakeInFridge() { const c = items.cake; c.visible = true; c.userData.cake.flames.forEach(f => { f.visible = false; }); c.userData.cake.slice.visible = false; },
    candles(lit) { items.cake.userData.cake.flames.forEach(f => { f.visible = lit; }); },
    slice() { items.cake.userData.cake.slice.visible = true; hud.toast('Cake for everyone! 🍰'); },
    /** Show the cake as eaten-into on the table (the job's done). */
    cakeDone() {
      const c = items.cake; scene.attach(c); c.position.set(...BD.table.cake); c.rotation.set(0, 0, 0); c.userData.level = 0; c.visible = true;
      this.candles(false); c.userData.cake.slice.visible = true;
    },
    // --- presents
    unwrap(i) {
      presents[i].visible = false;
      hud.toast(`It's ${GIFTS[who][i % 3]}! 🎁`);
    },
    presentsOpened() { presents.forEach(p => { p.visible = false; }); },
    guestsIn() {
      if (!visit) { visit = 'waiting'; }
      hud.toast(`Grandma and Grandpa: "Happy birthday, ${NAMES[who]}!"`);
      handPresent.visible = false; presents[3].visible = true;
      visit = 'leaving';
      guests.forEach((g, i) => { g.path = [[STREET[1][0] + (i ? 0.2 : -0.2), STREET[1][1]], [STREET[0][0] + (i ? 0.3 : -0.3), STREET[0][1] + 0.6]]; });
    },
  };
}

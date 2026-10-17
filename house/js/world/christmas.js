// Christmas (12 December to 5 January, see holidays.js): a tree in the living room corner by the bookshelf
// (fairy lights, baubles and a star; presents underneath), the Advent wreath on the dining table, paper stars
// in the dining room window, a wreath on the front door, fairy lights along the front of the house and the
// canopy. P's and Dude's Advent calendars hang on the TV wall in the living room (next to the TV, above the TV
// bench) from 1 December.
// Everything is built once, hidden, and shown at the right time (systems/christmas.js).
// Also the biscuit tray for the Christmas baking.
import * as THREE from 'three';
import { add, group, mat } from '../core/build.js';
import { makePresent } from '../systems/birthday.js';
import { ADVENT_GIFTS, DOOR_ORDER } from '../advent.js';
import { possessive } from '../names.js';

// Where things happen, plan coordinates [x, z] (all on the ground floor unless they say level).
export const XMAS = {
  tree: { at: [1.3, 0.8], x: 0.5, z: 0.74 },                     // the tree, and where you stand to do it
  boxPlace: [1.32, 0, 0.36],                                     // the decorations box, put down by the tree
  cupboard: [4.4, 4.45],                                         // the cupboard under the stairs (the box lives inside)
  giftPlace: [1.04, 0, 0.8],                                     // a present put under the tree
  calendars: [2.45, 3.68],                                       // in front of the Advent calendars
  table: { at: [2.55, 6.75], seat: [2.52, 0, 6.75, -Math.PI / 2], tray: [1.6, 0.75, 6.75], plate: [1.75, 0.75, 6.55] },
  counter: { at: [4.3, 2.2], seat: [4.3, 0, 2.2, -Math.PI / 2] },   // the worktop on the left of the kitchen (clear of the coffee machine)
  oven: { at: [4.62, 2.78], out: [5.3, 0.9, 2.12] },             // in front of the oven; the hot tray comes out onto the worktop
  windowsill: { at: [1.4, 8.45], place: [1.05, 0.86, 8.8] },     // the dining room windowsill (the wish list goes here)
  kerb: [2.6, 12.95],                                            // the tree goes out by the street on 5 January
};

// The presents under the tree: [x, z, colour]. The first two are there from 12 December; on Christmas Eve
// all of them (three for whoever's playing, two for the others).
const PILE = [[0.88, 0.62, 0], [0.86, 0.98, 1], [1.08, 0.8, 2], [0.62, 0.36, 3], [0.3, 1.04, 0]];

// What's in your Christmas presents (made up)
export const XMAS_GIFTS = {
  girl: ['a big book of animal facts', 'a craft box full of beads', 'new roller skates'],
  boy: ['a remote-control car', 'a space Lego-style rocket kit', 'a cosy football jumper'],
  mum: ['a warm woolly hat', 'a new mug for the office', 'a voucher for the café'],
  dad: ['a new reel of filament for the printer', 'bike gloves', 'a book about the stars'],
};

// The biscuit cutters to pick from (the card when baking)
export const CUTTERS = [
  { id: 'star', label: 'Stars', icon: '⭐' }, { id: 'tree', label: 'Christmas trees', icon: '🎄' },
  { id: 'heart', label: 'Hearts', icon: '❤️' }, { id: 'moon', label: 'Moons', icon: '🌙' },
];

/** A flat biscuit of a shape, lying on y = 0 (in group g, at x, z). */
function biscuit(g, shape, x, z, m) {
  const b = new THREE.Group(); b.position.set(x, 0, z); g.add(b);
  const flat = (r, n, dx = 0, dz = 0, ry = 0) => add(b, new THREE.CylinderGeometry(r, r, 0.012, n), m, [dx, 0.006, dz], null, [0, ry, 0]);
  if (shape === 'star') { flat(0.032, 3, 0, 0, 0); flat(0.032, 3, 0, 0, Math.PI); }
  else if (shape === 'tree') { flat(0.034, 3, 0, -0.004, Math.PI / 2); add(b, new THREE.BoxGeometry(0.012, 0.012, 0.016), m, [0, 0.006, 0.026]); }
  else if (shape === 'heart') { flat(0.016, 12, -0.012, -0.008); flat(0.016, 12, 0.012, -0.008); flat(0.024, 3, 0, 0.006, -Math.PI / 2); }
  else add(b, new THREE.TorusGeometry(0.022, 0.009, 6, 12, Math.PI * 1.2), m, [0, 0.006, 0], [1, 1, 0.6], [-Math.PI / 2, 0, 0.4]);
  return b;
}

/** The baking tray with six biscuits: shape(id) cuts them, bake() turns them golden with icing on. */
export function makeBiscuitTray(g) {
  add(g, new THREE.BoxGeometry(0.36, 0.012, 0.26), mat('#3a3d42'), [0, 0.006, 0]);
  add(g, new THREE.BoxGeometry(0.34, 0.002, 0.24), mat('#f4f0e6'), [0, 0.013, 0]);   // baking paper
  const dough = new THREE.MeshStandardMaterial({ color: '#f1dcb0', roughness: 0.9 }), icing = [];
  let set = new THREE.Group(); set.position.y = 0.014; g.add(set);
  const spots = [[-0.11, -0.06], [0, -0.06], [0.11, -0.06], [-0.11, 0.06], [0, 0.06], [0.11, 0.06]];
  return {
    shape(id) {
      g.remove(set); set = new THREE.Group(); set.position.y = 0.014; g.add(set); icing.length = 0;
      spots.forEach(([x, z], i) => {
        const b = biscuit(set, id, x, z, dough);
        icing.push(add(b, new THREE.SphereGeometry(0.008, 6, 4), mat(['#e84a5f', '#ffffff', '#3fa36b'][i % 3]), [0, 0.014, 0]));
      });
      this.raw();
    },
    raw() { dough.color.set('#f1dcb0'); icing.forEach(s => { s.visible = false; }); },
    bake() { dough.color.set('#d9a05b'); icing.forEach(s => { s.visible = true; }); },
  };
}

/** A canvas picture of one of the Advent calendars: the name at the top and 24 doors, the open ones showing
 *  what was behind them. Returns null without a canvas (in the tests). */
export function paintCalendar(texture, who, openSet, upTo) {
  const c = texture.image;
  if (!c || !c.getContext) return null;
  const g = c.getContext('2d'), girl = who === 'girl';
  g.fillStyle = girl ? '#a8303a' : '#24508e'; g.fillRect(0, 0, 256, 300);
  for (let i = 0; i < 40; i++) { g.fillStyle = 'rgba(255,255,255,0.5)'; g.beginPath(); g.arc((i * 61) % 256, (i * 37) % 300, 1.4, 0, 7); g.fill(); }   // snowflakes
  g.fillStyle = '#ffd34d'; g.font = 'bold 30px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText(`${possessive(who)} Advent`, 128, 24, 240);
  DOOR_ORDER.forEach((n, i) => {
    const x = 10 + (i % 4) * 60, y = 48 + Math.floor(i / 4) * 41, w = 56, h = 37;
    if (openSet.has(n)) {
      g.fillStyle = '#2a1c14'; g.fillRect(x, y, w, h);
      g.font = '24px sans-serif'; g.fillText(ADVENT_GIFTS[who][n - 1][0], x + w / 2, y + h / 2 + 1);
    } else {
      g.fillStyle = n <= upTo ? '#fff3d6' : '#f1e6cf'; g.fillRect(x, y, w, h);
      g.strokeStyle = n <= upTo ? '#ffb02e' : 'rgba(0,0,0,0.25)'; g.lineWidth = n <= upTo ? 3 : 1.5; g.strokeRect(x + 1.5, y + 1.5, w - 3, h - 3);
      g.fillStyle = girl ? '#a8303a' : '#24508e'; g.font = 'bold 20px sans-serif'; g.fillText(String(n), x + w / 2, y + h / 2 + 1);
    }
  });
  texture.needsUpdate = true;
  return c;
}

/** A paper star (two triangles), facing +z, in group g. */
function paperStar(g, r, pos, color = '#fff3c9') {
  const s = new THREE.Group(); s.position.set(...pos); g.add(s);
  const m = new THREE.MeshBasicMaterial({ color });
  [0, Math.PI].forEach(rz => add(s, new THREE.CylinderGeometry(r, r, 0.006, 3), m, [0, 0, 0], null, [Math.PI / 2, 0, rz]));
  return s;
}

export function buildChristmas() {
  const all = group(0, 0, 0); all.visible = false;

  // --- the tree: a red pot, four tiers of branches, a spiral of fairy lights, baubles and a star on top
  const tree = new THREE.Group(); tree.position.set(XMAS.tree.x, 0, XMAS.tree.z); all.add(tree);
  const pot = add(tree, new THREE.CylinderGeometry(0.16, 0.13, 0.22, 16), mat('#b23a2e'), [0, 0.11, 0]);
  add(tree, new THREE.CylinderGeometry(0.035, 0.045, 0.25, 8), mat('#5a3d26'), [0, 0.3, 0]);
  const green = mat('#1f6b3a');
  [[0.4, 0.42, 0.52], [0.33, 0.38, 0.78], [0.25, 0.34, 1.02], [0.15, 0.3, 1.24]].forEach(([r, h, y]) => add(tree, new THREE.ConeGeometry(r, h, 14), green, [0, y, 0]));
  const lights = [];
  const LIGHT_COLOURS = ['#fff1b8', '#fff1b8', '#ffd34d', '#ff5a5a', '#5ad1ff', '#fff1b8', '#7dff8a'];
  for (let i = 0; i < 42; i++) {
    const t = i / 42, y = 0.4 + t * 1.0, r = 0.39 * (1 - t * 0.85) + 0.02, a = t * Math.PI * 9;
    lights.push(add(tree, new THREE.SphereGeometry(0.015, 6, 4), new THREE.MeshBasicMaterial({ color: LIGHT_COLOURS[i % 7] }), [Math.cos(a) * r, y, Math.sin(a) * r]));
  }
  const baubles = new THREE.Group(); tree.add(baubles);
  const BAUBLES = ['#c0282d', '#e2b33c', '#c9ccd1', '#2f6fd6'];
  for (let i = 0; i < 16; i++) {
    const t = (i + 0.5) / 16, y = 0.38 + t * 0.9, r = 0.36 * (1 - t * 0.8) + 0.03, a = i * 2.4;
    add(baubles, new THREE.SphereGeometry(0.032, 10, 8), new THREE.MeshStandardMaterial({ color: BAUBLES[i % 4], metalness: 0.4, roughness: 0.25 }), [Math.cos(a) * r, y, Math.sin(a) * r]);
  }
  const star = paperStar(tree, 0.075, [0, 1.46, 0.02], '#ffd34d');
  const treeCollider = { x1: XMAS.tree.x - 0.3, z1: XMAS.tree.z - 0.3, x2: XMAS.tree.x + 0.3, z2: XMAS.tree.z + 0.3, level: 0 };

  // --- presents under the tree
  const presents = PILE.map(([x, z, c]) => { const p = group(x, 0, z); p.rotation.y = x * 5; makePresent(p, c, 0.9); all.add(p); return p; });

  // --- the Advent wreath on the dining table: four red candles, lit one more each Advent Sunday
  const wreath = new THREE.Group(); wreath.position.set(1.45, 0.75, 7.3); all.add(wreath);
  add(wreath, new THREE.TorusGeometry(0.13, 0.035, 8, 20), mat('#2d5e34'), [0, 0.03, 0], null, [Math.PI / 2, 0, 0]);
  [0, 1, 2, 3, 4, 5, 6, 7].forEach(k => { const a = k / 8 * Math.PI * 2 + 0.4; add(wreath, new THREE.SphereGeometry(0.014, 6, 4), mat(k % 2 ? '#c0282d' : '#e2b33c'), [Math.cos(a) * 0.13, 0.06, Math.sin(a) * 0.13]); });
  const flames = [0, 1, 2, 3].map(k => {
    const a = k / 4 * Math.PI * 2 + Math.PI / 4;
    add(wreath, new THREE.CylinderGeometry(0.016, 0.016, 0.1, 10), mat('#c0282d'), [Math.cos(a) * 0.13, 0.1, Math.sin(a) * 0.13]);
    return add(wreath, new THREE.SphereGeometry(0.011, 8, 6), new THREE.MeshBasicMaterial({ color: '#ffb02e' }), [Math.cos(a) * 0.13, 0.165, Math.sin(a) * 0.13], [1, 1.7, 1]);
  });

  // --- paper stars in the dining room window, and a wreath on the wall by the front door
  const stars = new THREE.Group(); all.add(stars);
  [[0.85, 1.12], [1.45, 0.95], [2.0, 1.15]].forEach(([x, y]) => paperStar(stars, 0.075, [x, y, 8.83]));
  const doorWreath = new THREE.Group(); doorWreath.position.set(2.92, 0.98, 9.34); all.add(doorWreath);
  add(doorWreath, new THREE.TorusGeometry(0.15, 0.045, 8, 22), mat('#24502c'), [0, 0, 0]);
  [0, 1, 2, 3, 4, 5].forEach(k => { const a = k / 6 * Math.PI * 2 + 0.3; add(doorWreath, new THREE.SphereGeometry(0.018, 6, 4), mat('#c0282d'), [Math.cos(a) * 0.15, Math.sin(a) * 0.15, 0.04]); });
  [-1, 1].forEach(s => add(doorWreath, new THREE.BoxGeometry(0.08, 0.05, 0.02), mat('#c0282d'), [s * 0.04, -0.15, 0.05], null, [0, 0, s * 0.4]));

  // --- fairy lights: along the front of the house under the eaves, and along the canopy
  const bulbs = [];
  const string = (x1, x2, y, z, n, sag) => {
    for (let k = 0; k <= n; k++) {
      const t = k / n, x = x1 + t * (x2 - x1), dy = Math.sin(t * Math.PI * Math.round((x2 - x1) / 0.9)) ** 2 * sag;
      bulbs.push(add(all, new THREE.SphereGeometry(0.02, 6, 4), new THREE.MeshBasicMaterial({ color: LIGHT_COLOURS[k % 7] }), [x, y - dy, z]));
    }
  };
  string(-0.25, 3.12, 1.36, 9.33, 26, 0.06);
  string(4.72, 5.7, 1.36, 9.33, 8, 0.06);
  string(3.22, 4.62, 1.4, 10.02, 14, 0.07);

  // --- the Advent calendars on the TV wall, right of the TV (their own group: up from 1 December)
  const calendars = group(0, 0, 0); calendars.visible = false;
  const calendar = {};
  [['girl', 3.4, '#7a1f27'], ['boy', 3.96, '#1a3a68']].forEach(([who, z, frame]) => {
    add(calendars, new THREE.BoxGeometry(0.02, 0.52, 0.5), mat(frame), [3.24, 1.07, z]);
    const cv = globalThis.document && document.createElement('canvas');
    if (cv && cv.getContext) { cv.width = 256; cv.height = 300; }
    const tex = new THREE.CanvasTexture(cv && cv.getContext ? cv : undefined);
    const face = add(calendars, new THREE.PlaneGeometry(0.46, 0.48), new THREE.MeshBasicMaterial({ map: tex }), [3.228, 1.07, z], null, [0, -Math.PI / 2, 0]);
    calendar[who] = { tex, face };
  });

  return { christmas: { all, tree, pot, lights, baubles, star, treeCollider, presents, wreath, flames, stars, doorWreath, bulbs, calendars, calendar } };
}

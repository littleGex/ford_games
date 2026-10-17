// What each player looks like, as settings the avatar editor can change (ui/avatar.js): skin, hair style
// and colour, top, trousers, shoes, and extras (glasses; a beard for Dad, and for Dude once he's 18). specFor() turns a look into the spec
// makeCharacter() builds a figure from. The defaults are the family as they've always looked.
import * as THREE from 'three';
import { add } from '../core/build.js';
import { stripes } from '../core/textures.js';
import { charMat as M } from './character.js';
import { DEFAULT_LOOKS, DEFAULT_STAGE } from '../players.js';

export { DEFAULT_LOOKS, DEFAULT_STAGE };

// --- hair: each style builds onto the head in one colour
const cap = (h, m, open = 0.33) => add(h, new THREE.SphereGeometry(0.226, 28, 16, 0, Math.PI * 2, 0, Math.PI * open), m, [0, 0.01, -0.005], [1, 1.08, 1]);
const back = (h, m, from = 1.9, span = 3.8, down = 0.62) => add(h, new THREE.SphereGeometry(0.226, 28, 16, Math.PI * 1.5 - from, span, 0, Math.PI * down), m, [0, 0.01, -0.005], [1, 1.08, 1]);
export const HAIR = {
  long: { label: 'Long', build: (h, c) => {   // down the back, to the waist (P)
    const m = M(c); cap(h, m); back(h, m);
    add(h, new THREE.BoxGeometry(0.4, 0.52, 0.1), m, [0, -0.2, -0.12]);
    [-1, 1].forEach(s => add(h, new THREE.BoxGeometry(0.07, 0.46, 0.12), m, [s * 0.2, -0.17, 0.02]));
  } },
  shoulder: { label: 'Shoulder', build: (h, c) => {   // to the shoulders (Mum)
    const m = M(c); cap(h, m); back(h, m);
    add(h, new THREE.BoxGeometry(0.42, 0.34, 0.1), m, [0, -0.12, -0.12]);
    [-1, 1].forEach(s => add(h, new THREE.BoxGeometry(0.07, 0.3, 0.12), m, [s * 0.205, -0.1, 0.02]));
  } },
  ponytail: { label: 'Ponytail', build: (h, c) => {
    const m = M(c); cap(h, m, 0.36); back(h, m, 1.8, 3.6, 0.55);
    add(h, new THREE.SphereGeometry(0.05, 12, 10), m, [0, 0.1, -0.22]);
    add(h, new THREE.CylinderGeometry(0.05, 0.025, 0.32, 10), m, [0, -0.06, -0.26], null, [0.25, 0, 0]);
  } },
  bun: { label: 'Bun', build: (h, c) => {
    const m = M(c); cap(h, m, 0.36); back(h, m, 1.8, 3.6, 0.58);
    add(h, new THREE.SphereGeometry(0.1, 16, 12), m, [0, 0.17, -0.17]);
  } },
  swept: { label: 'Swept', build: (h, c) => {   // short, swept over to one side (Dude)
    const m = M(c);
    add(h, new THREE.SphereGeometry(0.228, 28, 16, 0, Math.PI * 2, 0, Math.PI * 0.33), m, [0, 0.005, -0.01], [1, 1.08, 1]);
    add(h, new THREE.SphereGeometry(0.228, 28, 16, Math.PI * 1.5 - 1.75, 3.5, 0, Math.PI * 0.56), m, [0, 0.005, -0.01], [1, 1.08, 1]);
    add(h, new THREE.SphereGeometry(0.12, 16, 10), m, [0.04, 0.175, 0.13], [1.45, 0.45, 0.75], [0, 0, -0.35]);
  } },
  short: { label: 'Short', build: (h, c) => {
    const m = M(c);
    add(h, new THREE.SphereGeometry(0.226, 28, 16, 0, Math.PI * 2, 0, Math.PI * 0.32), m, [0, 0.005, -0.012], [1, 1.06, 1]);
    add(h, new THREE.SphereGeometry(0.226, 28, 16, Math.PI * 1.5 - 1.6, 3.2, 0, Math.PI * 0.55), m, [0, 0.005, -0.012], [1, 1.06, 1]);
  } },
  spiky: { label: 'Spiky', build: (h, c) => {
    const m = M(c);
    add(h, new THREE.SphereGeometry(0.226, 28, 16, 0, Math.PI * 2, 0, Math.PI * 0.3), m, [0, 0.005, -0.012], [1, 1.06, 1]);
    for (let k = 0; k < 9; k++) {
      const a = k / 9 * Math.PI * 2, r = 0.1 + (k % 2) * 0.03;
      add(h, new THREE.ConeGeometry(0.045, 0.12, 6), m, [Math.cos(a) * r, 0.22, Math.sin(a) * r * 0.9], null, [Math.sin(a) * 0.5, 0, -Math.cos(a) * 0.5]);
    }
  } },
  beanie: { label: 'Beanie', build: (h) => {   // a knitted teal beanie pulled down (Dad); the hair colour is for the beard
    add(h, new THREE.SphereGeometry(0.226, 28, 16, 0, Math.PI * 2, 0, Math.PI * 0.46), M('#3fb6c4', stripes('#3fb6c4', '#5fcad6', 14)), [0, 0.012, 0], [1, 1.12, 1]);
    add(h, new THREE.CylinderGeometry(0.228, 0.228, 0.075, 28), M('#2f9fac'), [0, 0.04, 0]);
    add(h, new THREE.TorusGeometry(0.195, 0.013, 8, 28), M('#f07a2a'), [0, 0.13, 0], null, [Math.PI / 2, 0, 0]);
    add(h, new THREE.SphereGeometry(0.055, 12, 10), M('#f07a2a'), [0, 0.265, 0]);
  } },
  bald: { label: 'Bald', build: () => {} },
};

function beard(h, c) {
  const m = M(c);
  add(h, new THREE.SphereGeometry(0.218, 24, 12, Math.PI / 2 - 1.35, 2.7, Math.PI * 0.56, Math.PI * 0.4), m, [0, 0, 0], [1, 1.05, 0.97]);
  add(h, new THREE.BoxGeometry(0.13, 0.025, 0.03), m, [0, -0.048, 0.21]);
}

function glasses(h) {
  const frame = M('#24262c');
  [-1, 1].forEach(s => add(h, new THREE.TorusGeometry(0.042, 0.007, 6, 18), frame, [s * 0.075, 0.03, 0.205]));
  add(h, new THREE.BoxGeometry(0.06, 0.008, 0.008), frame, [0, 0.04, 0.21]);
  [-1, 1].forEach(s => add(h, new THREE.BoxGeometry(0.008, 0.008, 0.16), frame, [s * 0.118, 0.035, 0.13]));
}

// --- the colours on offer
export const PALETTE = {
  skin: ['#f5d6c1', '#f1d1ba', '#e3b796', '#d8a382', '#c98d68', '#a8714f', '#8d5a3c', '#5e3b26'],
  hair: ['#f0dca0', '#e2c27c', '#c49a5a', '#9b7452', '#7a5434', '#5e3f27', '#2a1f18', '#141214', '#b8402a', '#c4c4c2', '#d86aa8', '#4a7fd8'],
  clothes: ['#f7f6f2', '#1c1e25', '#2d3037', '#4a6a9c', '#1f2645', '#3b7fc4', '#6aa84f', '#3f8a3a', '#e0b23a', '#f08a24', '#ea4521', '#c4477a', '#8e5bd6', '#c8b1e8', '#8a6a4a', '#9aa1a8'],
  shoes: ['#f2f2f2', '#16171b', '#3a3d45', '#c43b3b', '#3b7fc4', '#f08a24', '#6aa84f', '#8a6a4a'],
};

// --- the family's own looks: their tops (with stripes, a puffer vest, a hoodie stripe) are 'own'
const OWN_TOP = {
  dad: { topMat: () => M('#ea4521'), sleeveMat: () => M('#6d6969'), extras: t => { // red puffer vest over grey sleeves: quilting, zip, hood
    [0.07, 0.17, 0.27, 0.36].forEach(y => add(t, new THREE.TorusGeometry(0.2 - y * 0.07, 0.009, 6, 28), M('#c4361a'), [0, y, 0], null, [Math.PI / 2, 0, 0]));
    add(t, new THREE.BoxGeometry(0.014, 0.42, 0.012), M('#111111'), [0, 0.2, 0.19], null, [0.07, 0, 0]);
    add(t, new THREE.SphereGeometry(0.13, 16, 10), M('#ea4521'), [0, 0.46, -0.11], [1.25, 0.7, 0.8]);
  } },
  mum: { topMat: () => M('#f7f6f2'), extras: t => add(t, new THREE.TorusGeometry(0.17, 0.012, 6, 28), M('#e8e6e0'), [0, 0.41, 0], [1, 1, 0.9], [Math.PI / 2, 0, 0]) },   // white top, neckline
  girl: { topMat: () => M('#ffffff', stripes('#c8b1e8', '#f7f5fa', 8)) },   // lilac and white striped jumper
  boy: { topMat: () => M('#1f2645'), extras: t => {   // navy hoodie with a lime stripe
    add(t, new THREE.BoxGeometry(0.24, 0.055, 0.02), M('#7cf04a'), [0, 0.27, 0.185], null, [0.07, 0, 0]);
    add(t, new THREE.SphereGeometry(0.13, 16, 10), M('#1f2645'), [0, 0.46, -0.11], [1.25, 0.7, 0.8]);
  } },
};

// the parts of each player's figure that don't change: label, socks, blush, the leg size
const BASE = {
  dad: { label: 'Dad', legR: 0.075 },
  mum: { label: 'Mum', blush: true, legR: 0.08 },
  girl: { label: 'P', blush: true, legR: 0.088 },
  boy: { label: 'Dude', blush: true, socks: '#f08a24' },
};
// how tall each player is at each life stage (the figures scale as a whole)
export const HEIGHT = {
  dad: { adult: 1 }, mum: { adult: 0.94 },
  girl: { child: 0.78, teen: 0.88, adult: 0.92 }, boy: { child: 0.82, teen: 0.91, adult: 0.97 },
};

// eyebrows a shade darker than the hair (the family's own, as they were)
const OWN_BROW = { dad: '#2a1f18', mum: '#a88550', girl: '#7d5a3c', boy: '#5e3f27' };
const shade = (hex, k) => { const c = new THREE.Color(hex); if (c.multiplyScalar) c.multiplyScalar(k); return c.getHexString ? '#' + c.getHexString() : hex; };

/** The makeCharacter() spec for a player with this look at this life stage. */
export function specFor(key, look = DEFAULT_LOOKS[key], stage = DEFAULT_STAGE[key]) {
  const l = { ...DEFAULT_LOOKS[key], ...look }, h = HEIGHT[key];
  const own = l.top === 'own' && OWN_TOP[key];
  const style = HAIR[l.hair] || HAIR.short;
  const bearded = !!l.beard && (key === 'dad' || key === 'boy') && (stage || DEFAULT_STAGE[key]) === 'adult';   // Dad, and Dude from 18
  return {
    ...BASE[key],
    scale: h[stage] || h[DEFAULT_STAGE[key]],
    skin: l.skin, pants: l.pants, shoes: l.shoes, brow: l.hairColor === DEFAULT_LOOKS[key].hairColor ? OWN_BROW[key] : l.hair === 'beanie' ? l.hairColor : shade(l.hairColor, 0.8),
    beard: bearded,
    topMat: own ? own.topMat() : M(l.top), sleeveMat: own && own.sleeveMat ? own.sleeveMat() : undefined,
    extras: own ? own.extras : null,
    hair: head => { style.build(head, l.hairColor); if (bearded) beard(head, l.hairColor); if (l.glasses) glasses(head); },
  };
}

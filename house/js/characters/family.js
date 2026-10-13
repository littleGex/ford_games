// Character looks, based on family photos (no logos or brand names on clothes).
// dad: teal beanie pulled down over the eyes, dark beard, red puffer vest over grey sleeves.
// mum: like a grown-up P, shoulder-length blond hair, white long-sleeved top, blue jeans.
// girl (P): long light-brown hair, lilac/white striped jumper. boy (Dude): navy hoodie with a lime stripe.
import * as THREE from 'three';
import { add } from '../core/build.js';
import { stripes } from '../core/textures.js';
import { charMat as M } from './character.js';

export const FAMILY = {
  dad: {
    label: 'Dad', scale: 1, skin: '#d8a382', pants: '#202329', shoes: '#16171b', brow: '#2a1f18', beard: true,
    topMat: M('#ea4521'), sleeveMat: M('#6d6969'),
    extras: t => { // puffer quilting, zip, hood
      [0.07, 0.17, 0.27, 0.36].forEach(y => add(t, new THREE.TorusGeometry(0.2 - y * 0.07, 0.009, 6, 28), M('#c4361a'), [0, y, 0], null, [Math.PI / 2, 0, 0]));
      add(t, new THREE.BoxGeometry(0.014, 0.42, 0.012), M('#111111'), [0, 0.2, 0.19], null, [0.07, 0, 0]);
      add(t, new THREE.SphereGeometry(0.13, 16, 10), M('#ea4521'), [0, 0.46, -0.11], [1.25, 0.7, 0.8]);
    },
    hair: h => { // knit beanie + beard
      add(h, new THREE.SphereGeometry(0.226, 28, 16, 0, Math.PI * 2, 0, Math.PI * 0.46), M('#3fb6c4', stripes('#3fb6c4', '#5fcad6', 14)), [0, 0.012, 0], [1, 1.12, 1]);
      add(h, new THREE.CylinderGeometry(0.228, 0.228, 0.075, 28), M('#2f9fac'), [0, 0.04, 0]);
      add(h, new THREE.TorusGeometry(0.195, 0.013, 8, 28), M('#f07a2a'), [0, 0.13, 0], null, [Math.PI / 2, 0, 0]);
      add(h, new THREE.SphereGeometry(0.055, 12, 10), M('#f07a2a'), [0, 0.265, 0]);
      const beard = M('#2a1f18');
      add(h, new THREE.SphereGeometry(0.218, 24, 12, Math.PI / 2 - 1.35, 2.7, Math.PI * 0.56, Math.PI * 0.4), beard, [0, 0, 0], [1, 1.05, 0.97]);
      add(h, new THREE.BoxGeometry(0.13, 0.025, 0.03), beard, [0, -0.048, 0.21]);
    },
  },
  mum: {
    label: 'Mum', scale: 0.94, skin: '#f1d1ba', pants: '#4a6a9c', shoes: '#f2f2f2', brow: '#a88550', blush: true, legR: 0.08,
    topMat: M('#f7f6f2'),
    extras: t => add(t, new THREE.TorusGeometry(0.17, 0.012, 6, 28), M('#e8e6e0'), [0, 0.41, 0], [1, 1, 0.9], [Math.PI / 2, 0, 0]),   // neckline
    hair: h => {
      const hm = M('#e2c27c');
      add(h, new THREE.SphereGeometry(0.228, 28, 16, 0, Math.PI * 2, 0, Math.PI * 0.33), hm, [0, 0.01, -0.005], [1, 1.08, 1]);
      add(h, new THREE.SphereGeometry(0.228, 28, 16, Math.PI * 1.5 - 1.9, 3.8, 0, Math.PI * 0.62), hm, [0, 0.01, -0.005], [1, 1.08, 1]);
      add(h, new THREE.BoxGeometry(0.42, 0.34, 0.1), hm, [0, -0.12, -0.12]);          // to the shoulders
      [-1, 1].forEach(s => add(h, new THREE.BoxGeometry(0.07, 0.3, 0.12), hm, [s * 0.205, -0.1, 0.02]));
      add(h, new THREE.BoxGeometry(0.006, 0.02, 0.15), M('#c9a660'), [-0.04, 0.235, 0.07]);   // parting
    },
  },
  girl: {
    label: 'P', scale: 0.78, skin: '#f1d1ba', pants: '#1c1e25', shoes: '#f2eef2', brow: '#7d5a3c', blush: true, legR: 0.088,
    topMat: M('#ffffff', stripes('#c8b1e8', '#f7f5fa', 8)),
    hair: h => {
      const hm = M('#9b7452');
      add(h, new THREE.SphereGeometry(0.226, 28, 16, 0, Math.PI * 2, 0, Math.PI * 0.33), hm, [0, 0.01, -0.005], [1, 1.08, 1]);
      add(h, new THREE.SphereGeometry(0.226, 28, 16, Math.PI * 1.5 - 1.9, 3.8, 0, Math.PI * 0.62), hm, [0, 0.01, -0.005], [1, 1.08, 1]);
      add(h, new THREE.BoxGeometry(0.4, 0.52, 0.1), hm, [0, -0.2, -0.12]);
      [-1, 1].forEach(s => add(h, new THREE.BoxGeometry(0.07, 0.46, 0.12), hm, [s * 0.2, -0.17, 0.02]));
      add(h, new THREE.BoxGeometry(0.006, 0.02, 0.15), M('#7c5a3e'), [0.03, 0.235, 0.07]);
    },
  },
  boy: {
    label: 'Dude', scale: 0.82, skin: '#f5d6c1', pants: '#2d3037', shoes: '#3a3d45', socks: '#f08a24', brow: '#5e3f27', blush: true,
    topMat: M('#1f2645'),
    extras: t => {
      add(t, new THREE.BoxGeometry(0.24, 0.055, 0.02), M('#7cf04a'), [0, 0.27, 0.185], null, [0.07, 0, 0]);
      add(t, new THREE.SphereGeometry(0.13, 16, 10), M('#1f2645'), [0, 0.46, -0.11], [1.25, 0.7, 0.8]);
    },
    hair: h => {
      const hm = M('#7a5434');
      add(h, new THREE.SphereGeometry(0.228, 28, 16, 0, Math.PI * 2, 0, Math.PI * 0.33), hm, [0, 0.005, -0.01], [1, 1.08, 1]);
      add(h, new THREE.SphereGeometry(0.228, 28, 16, Math.PI * 1.5 - 1.75, 3.5, 0, Math.PI * 0.56), hm, [0, 0.005, -0.01], [1, 1.08, 1]);
      add(h, new THREE.SphereGeometry(0.12, 16, 10), hm, [0.04, 0.175, 0.13], [1.45, 0.45, 0.75], [0, 0, -0.35]);
    },
  },
};

// The food delivery driver: red jacket and cap, dark trousers (a supermarket delivery, no logos).
export const FOOD_DRIVER = {
  scale: 0.96, skin: '#e6b08c', pants: '#24272e', shoes: '#f2f2f2', brow: '#4a3222', topMat: M('#d92a23'), sleeveMat: M('#d92a23'),
  extras: t => add(t, new THREE.CylinderGeometry(0.192, 0.196, 0.04, 22), M('#f4f4f4'), [0, 0.3, 0]),   // white band
  hair: h => {
    const cap = M('#d92a23');
    add(h, new THREE.SphereGeometry(0.226, 28, 16, 0, Math.PI * 2, 0, Math.PI * 0.4), cap, [0, 0.015, 0], [1, 1.08, 1]);
    add(h, new THREE.BoxGeometry(0.26, 0.02, 0.15), M('#f4f4f4'), [0, 0.105, 0.22]);
  },
};

export const COURIER = {
  scale: 0.95, skin: '#c98d68', pants: '#2b2f36', shoes: '#151515', brow: '#2a1f18', topMat: M('#3b6fb0'),
  extras: t => add(t, new THREE.CylinderGeometry(0.192, 0.196, 0.045, 22), M('#d8e04a'), [0, 0.12, 0]),
  hair: h => {
    const cap = M('#24476f');
    add(h, new THREE.SphereGeometry(0.226, 28, 16, 0, Math.PI * 2, 0, Math.PI * 0.4), cap, [0, 0.015, 0], [1, 1.08, 1]);
    add(h, new THREE.BoxGeometry(0.26, 0.02, 0.15), cap, [0, 0.105, 0.22]);
  },
};

// The neighbours either side (made-up looks): on the right, by our front door, a grey-haired man in a
// green jumper; on the left, a woman with her dark hair in a bun and a mustard cardigan.
export const NEIGHBOURS = {
  right: {
    scale: 0.97, skin: '#e3b796', pants: '#b8a88a', shoes: '#4a3a2c', brow: '#a9a9a9', topMat: M('#4f7a4a'),
    extras: t => add(t, new THREE.TorusGeometry(0.17, 0.014, 6, 28), M('#3f6a3b'), [0, 0.41, 0], [1, 1, 0.9], [Math.PI / 2, 0, 0]),
    hair: h => {
      const hm = M('#c4c4c2');
      add(h, new THREE.SphereGeometry(0.226, 28, 16, 0, Math.PI * 2, 0, Math.PI * 0.3), hm, [0, 0.0, -0.015], [1, 1.04, 1]);
      add(h, new THREE.SphereGeometry(0.226, 28, 16, Math.PI * 1.5 - 1.6, 3.2, 0, Math.PI * 0.55), hm, [0, 0.0, -0.015], [1, 1.04, 1]);
    },
  },
  left: {
    scale: 0.93, skin: '#c99a78', pants: '#2c3548', shoes: '#1e1e22', brow: '#2a1c14', blush: true, topMat: M('#d9a43a'),
    extras: t => add(t, new THREE.BoxGeometry(0.02, 0.38, 0.012), M('#b8862a'), [0, 0.2, 0.192], null, [0.07, 0, 0]),
    hair: h => {
      const hm = M('#2e211a');
      add(h, new THREE.SphereGeometry(0.228, 28, 16, 0, Math.PI * 2, 0, Math.PI * 0.36), hm, [0, 0.01, -0.005], [1, 1.08, 1]);
      add(h, new THREE.SphereGeometry(0.228, 28, 16, Math.PI * 1.5 - 1.8, 3.6, 0, Math.PI * 0.58), hm, [0, 0.01, -0.005], [1, 1.08, 1]);
      add(h, new THREE.SphereGeometry(0.1, 16, 12), hm, [0, 0.17, -0.17]);   // bun
    },
  },
};

// People at Dad's office (made-up looks): the boss in a navy suit, and colleagues at their desks.
const shortHair = c => h => {
  const hm = M(c);
  add(h, new THREE.SphereGeometry(0.226, 28, 16, 0, Math.PI * 2, 0, Math.PI * 0.32), hm, [0, 0.005, -0.012], [1, 1.06, 1]);
  add(h, new THREE.SphereGeometry(0.226, 28, 16, Math.PI * 1.5 - 1.6, 3.2, 0, Math.PI * 0.55), hm, [0, 0.005, -0.012], [1, 1.06, 1]);
};
const longHair = c => h => {
  const hm = M(c);
  add(h, new THREE.SphereGeometry(0.228, 28, 16, 0, Math.PI * 2, 0, Math.PI * 0.34), hm, [0, 0.01, -0.005], [1, 1.08, 1]);
  add(h, new THREE.SphereGeometry(0.228, 28, 16, Math.PI * 1.5 - 1.9, 3.8, 0, Math.PI * 0.62), hm, [0, 0.01, -0.005], [1, 1.08, 1]);
  add(h, new THREE.BoxGeometry(0.4, 0.38, 0.1), hm, [0, -0.13, -0.12]);
};
export const OFFICE_PEOPLE = {
  boss: { scale: 1, skin: '#e0b090', pants: '#1f2a44', shoes: '#151515', brow: '#6a6a6a', topMat: M('#26324f'),
          extras: t => add(t, new THREE.BoxGeometry(0.06, 0.26, 0.012), M('#c0392b'), [0, 0.24, 0.192], null, [0.07, 0, 0]), hair: shortHair('#8a8a88') },
  colleagueA: { scale: 0.96, skin: '#c99a78', pants: '#2c3548', shoes: '#1e1e22', brow: '#2a1c14', blush: true, topMat: M('#6c8fc7'), hair: longHair('#2e211a') },
  colleagueB: { scale: 0.98, skin: '#f1d1ba', pants: '#3a3d42', shoes: '#4a3a2c', brow: '#a88550', topMat: M('#7a9a6a'), hair: shortHair('#c9a660') },
  colleagueC: { scale: 0.95, skin: '#8d5a3c', pants: '#24272e', shoes: '#151515', brow: '#1a1210', topMat: M('#d9a43a'), hair: shortHair('#1a1210') },
  colleagueD: { scale: 0.94, skin: '#e8c0a0', pants: '#4a6a9c', shoes: '#f2f2f2', brow: '#7d5a3c', blush: true, topMat: M('#e86a8a'), hair: longHair('#9b7452') },
};

// Trick-or-treaters on Halloween (made-up kids from down the street; they come in costumes, see costumes.js).
export const TRICK_OR_TREATERS = [
  { scale: 0.74, skin: '#e8c0a0', pants: '#2a2d35', shoes: '#c43b3b', brow: '#5e3f27', blush: true, topMat: M('#3b7fc4'), hair: shortHair('#5e3f27'), costume: 'ghost' },
  { scale: 0.8, skin: '#c99a78', pants: '#1c1e25', shoes: '#f2f2f2', brow: '#2a1c14', blush: true, topMat: M('#e0b23a'), hair: longHair('#2e211a'), costume: 'witch' },
  { scale: 0.7, skin: '#f1d1ba', pants: '#3a3d42', shoes: '#2b2d31', brow: '#a88550', blush: true, topMat: M('#6aa84f'), hair: shortHair('#d9b36a'), costume: 'vampire' },
  { scale: 0.76, skin: '#8d5a3c', pants: '#24272e', shoes: '#f08a24', brow: '#1a1210', blush: true, topMat: M('#c4477a'), hair: longHair('#1a1210'), costume: 'cat' },
];

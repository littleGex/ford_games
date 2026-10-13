// Halloween (31 October, see holidays.js): pumpkins on the front step, a string of orange lights along the
// canopy, paper bats and spiders' webs on the dining room window and round the front door, and a ghost
// hanging in the hall. Everything is built once, hidden, and shown on the day (systems/halloween.js).
// Also the pumpkin itself: a round ribbed body with a lid, and a face carved in front that glows once
// there's a tea light inside.
import * as THREE from 'three';
import { add, group, mat } from '../core/build.js';
import { canvasTex } from '../core/textures.js';

// Where things happen, plan coordinates [x, z] (all on the ground floor).
export const HALLOWEEN = {
  table: { at: [2.55, 6.75], place: [1.62, 0.75, 6.75], seat: [2.52, 0, 6.75, -Math.PI / 2] },   // the dining table, standing at its sideboard side
  step: { at: [3.62, 9.9], place: [3.42, 0.03, 9.52] },        // the jack-o'-lantern's spot, left of the front door
  window: [1.4, 8.45],                                        // inside, by the dining room window
  door: [3.92, 9.9],                                          // outside the front door
  ghost: [3.95, 6.9],                                         // in the hall, under where the ghost hangs
  bowlBy: { at: [3.92, 8.3], place: [4.15, 0, 8.05] },        // the sweets bowl, by the front door in the porch
  openDoor: [3.92, 9.3],                                      // standing in the open front door
  wardrobe: { girl: { level: 1, at: [2.3, 6.95], seat: [2.3, 0, 6.95, Math.PI / 2] },     // P's wardrobe
              boy: { level: 2, at: [0.35, 2.9], seat: [0.35, 0, 2.9, 0] } },             // Dude's wardrobe
  room: { girl: { level: 1, at: [2.3, 8.05], place: [2.95, 0.73, 8.0], name: 'your desk' },
          boy: { level: 2, at: [4.62, 2.27], place: [5.25, 0.76, 2.1], name: 'your desk' } },
};

// The faces to carve: drawn white on a clear canvas (the pumpkin colours them: dark, or glowing when lit).
export const FACES = [
  { id: 'happy', label: 'Happy', draw: g => {
    tri(g, [34, 52], [52, 52], [43, 36]); tri(g, [76, 52], [94, 52], [85, 36]);
    g.beginPath(); g.moveTo(26, 72); g.quadraticCurveTo(64, 112, 102, 72); g.quadraticCurveTo(64, 92, 26, 72); g.fill();
  } },
  { id: 'spooky', label: 'Spooky', draw: g => {
    tri(g, [30, 38], [54, 50], [32, 56]); tri(g, [98, 38], [74, 50], [96, 56]);
    g.beginPath(); g.moveTo(28, 90); [36, 44, 52, 60, 68, 76, 84, 92, 100].forEach((x, i) => g.lineTo(x, i % 2 ? 76 : 90)); g.lineTo(100, 98); g.lineTo(28, 98); g.fill();
  } },
  { id: 'toothy', label: 'Toothy grin', draw: g => {
    g.beginPath(); g.arc(42, 46, 10, 0, 7); g.arc(86, 46, 10, 0, 7); g.fill();
    g.beginPath(); g.moveTo(24, 70); g.quadraticCurveTo(64, 118, 104, 70); g.lineTo(24, 70); g.fill();
    g.globalCompositeOperation = 'destination-out';
    g.fillRect(44, 70, 10, 12); g.fillRect(74, 70, 10, 12); g.fillRect(58, 88, 12, 14);
    g.globalCompositeOperation = 'source-over';
  } },
  { id: 'surprised', label: 'Surprised', draw: g => {
    g.beginPath(); g.ellipse(42, 46, 9, 14, 0, 0, 7); g.ellipse(86, 46, 9, 14, 0, 0, 7); g.fill();
    g.beginPath(); g.ellipse(64, 86, 13, 17, 0, 0, 7); g.fill();
  } },
];
function tri(g, a, b, c) { g.beginPath(); g.moveTo(...a); g.lineTo(...b); g.lineTo(...c); g.closePath(); g.fill(); }

/** A face as a picture for the choosing card (a little pumpkin with the face cut out), or null without a canvas. */
export function faceImage(face) {
  const c = document.createElement('canvas');
  if (!c.toDataURL) return null;
  c.width = c.height = 128;
  const g = c.getContext('2d');
  g.fillStyle = '#f08a24'; g.beginPath(); g.ellipse(64, 68, 60, 54, 0, 0, 7); g.fill();
  g.fillStyle = '#3f8a3a'; g.fillRect(58, 4, 12, 18);
  g.fillStyle = '#3a1c08'; face.draw(g);
  return c.toDataURL();
}

const faceTextures = {};
const faceTexture = id => (faceTextures[id] ||= canvasTex(g => { g.fillStyle = '#ffffff'; (FACES.find(f => f.id === id) || FACES[0]).draw(g); }, 128));

const UNLIT = '#3a1c08', LIT = '#ffcf4a';

/**
 * Build a pumpkin into group g: radius r, sitting on y = 0. With carve: a lid and a face that can be
 * carved and lit (handles in the returned object).
 */
export function makePumpkin(g, r, { carve = false, color = '#ec7a1c', face = null } = {}) {
  const skin = mat(color), squash = [1, 0.8, 1];
  add(g, new THREE.SphereGeometry(r, 20, 14), skin, [0, r * 0.8, 0], squash);
  for (let k = 0; k < 6; k++) {   // ribs
    const a = k / 6 * Math.PI * 2;
    add(g, new THREE.SphereGeometry(r * 0.62, 14, 10), skin, [Math.cos(a) * r * 0.42, r * 0.8, Math.sin(a) * r * 0.42], [1, 1.25, 1]);
  }
  const lid = new THREE.Group(); lid.name = 'lid'; g.add(lid);
  add(lid, new THREE.CylinderGeometry(r * 0.08, r * 0.11, r * 0.4, 8), mat('#5d7a2e'), [0, r * 1.72, 0], null, [0.15, 0, 0.1]);
  if (!carve) return null;

  // the face: a patch of sphere just outside the body, facing +z, mapped with the face picture
  const faceMat = new THREE.MeshBasicMaterial({ color: UNLIT, transparent: true, alphaTest: 0.3 });
  const faceMesh = add(g, new THREE.SphereGeometry(r * 1.035, 20, 14, Math.PI / 2 - 0.85, 1.7, Math.PI / 2 - 0.7, 1.4), faceMat, [0, r * 0.8, 0], squash);
  faceMesh.name = 'face';
  const glow = add(g, new THREE.SphereGeometry(r * 0.5, 10, 8), new THREE.MeshBasicMaterial({ color: LIT, transparent: true, opacity: 0.55 }), [0, r * 0.8, r * 0.3]);
  glow.name = 'glow';
  const h = {
    lid, faceMesh, glow,
    /** Back to a whole pumpkin: lid on, no face. */
    fresh() { lid.position.set(0, 0, 0); lid.rotation.set(0, 0, 0); faceMesh.visible = false; glow.visible = false; faceMat.color.set(UNLIT); },
    /** Lid off (it sits beside the pumpkin). */
    open() { lid.position.set(r * 1.3, -r * 1.35, 0); lid.rotation.set(0, 0, 0.4); },
    carve(id) { faceMat.map = faceTexture(id); faceMat.needsUpdate = true; faceMesh.visible = true; lid.position.set(0, 0, 0); lid.rotation.set(0, 0, 0); },
    light(on = true) { faceMat.color.set(on ? LIT : UNLIT); glow.visible = on; },
    flicker(k) { if (glow.visible) { glow.material.opacity = 0.4 + 0.25 * k; faceMat.color.setRGB(1, 0.72 + 0.12 * k, 0.25 + 0.08 * k); } },
  };
  h.fresh();
  if (face) { h.carve(face); h.light(true); }
  return h;
}

/** A flat cut-out picture (a bat, a web) on a wall, facing +z or -z. */
function cutout(parent, tex, w, h, pos, faceBack = false, color = '#ffffff') {
  const m = add(parent, new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex, color, transparent: true, alphaTest: 0.3, side: THREE.DoubleSide }), pos);
  if (faceBack) m.rotation.y = Math.PI;
  return m;
}

const batTex = () => canvasTex(g => {
  g.fillStyle = '#ffffff';
  g.beginPath(); g.moveTo(64, 50);
  g.quadraticCurveTo(40, 30, 6, 40); g.quadraticCurveTo(20, 50, 18, 62); g.quadraticCurveTo(30, 56, 36, 68); g.quadraticCurveTo(46, 60, 56, 72);
  g.lineTo(64, 80); g.lineTo(72, 72);
  g.quadraticCurveTo(82, 60, 92, 68); g.quadraticCurveTo(98, 56, 110, 62); g.quadraticCurveTo(108, 50, 122, 40); g.quadraticCurveTo(88, 30, 64, 50);
  g.fill();
  g.beginPath(); g.arc(64, 54, 9, 0, 7); g.fill();
  g.beginPath(); g.moveTo(57, 48); g.lineTo(59, 38); g.lineTo(62, 47); g.moveTo(66, 47); g.lineTo(69, 38); g.lineTo(71, 48); g.fill();
}, 128);

// a corner web: threads out from the top left corner and rings of thread between them
const webTex = () => canvasTex(g => {
  g.strokeStyle = '#ffffff'; g.lineWidth = 2.5;
  const spokes = [0, 0.3, 0.6, 0.9, 1.2, 1.5].map(a => a + 0.04);
  spokes.forEach(a => { g.beginPath(); g.moveTo(0, 0); g.lineTo(Math.cos(a) * 180, Math.sin(a) * 180); g.stroke(); });
  for (let r = 22; r < 125; r += 20) {
    g.beginPath();
    spokes.forEach((a, i) => { const x = Math.cos(a) * r, y = Math.sin(a) * r; if (i) g.quadraticCurveTo(Math.cos(a - 0.15) * r * 0.9, Math.sin(a - 0.15) * r * 0.9, x, y); else g.moveTo(x, y); });
    g.stroke();
  }
}, 128);

export function buildHalloween(scene) {
  const all = group(0, 0, 0); all.visible = false;
  const bat = batTex(), web = webTex();
  const Z = 9.3 + 0.012;   // just in front of the facade

  // the front step: two pumpkins by the bins side of the door, a small one in front
  const step = new THREE.Group(); all.add(step);
  [[4.38, 9.48, 0.15, '#ec7a1c'], [4.28, 9.78, 0.1, '#f39a2e']].forEach(([x, z, r, c]) => {
    const p = new THREE.Group(); p.position.set(x, 0.02, z); p.rotation.y = x * 7; step.add(p); makePumpkin(p, r, { color: c });
  });
  const smiler = new THREE.Group(); smiler.position.set(4.12, 0.02, 9.62); smiler.rotation.y = -0.3; step.add(smiler);
  const stepLantern = makePumpkin(smiler, 0.09, { carve: true, face: 'happy' });

  // a string of little orange lights along the front of the canopy, sagging between the posts
  const lights = new THREE.Group(); all.add(lights);
  const bulbs = [];
  for (let k = 0; k <= 16; k++) {
    const t = k / 16, x = 3.22 + t * 1.4, y = 1.4 - Math.sin(t * Math.PI * 2) ** 2 * 0.07;
    bulbs.push(add(lights, new THREE.SphereGeometry(0.022, 8, 6), new THREE.MeshBasicMaterial({ color: k % 3 === 1 ? '#a64dff' : '#ff8a1e' }), [x, y, 10.02]));
  }
  add(lights, new THREE.CylinderGeometry(0.004, 0.004, 1.42, 4), mat('#1a1a1a'), [3.92, 1.39, 10.02], null, [0, 0, Math.PI / 2]);

  // the dining room window (x 0.4..2.4): a web in each top corner, bats flying across
  const win = new THREE.Group(); all.add(win);
  const w1 = cutout(win, web, 0.42, 0.42, [0.62, 1.15, Z]); w1.scale.x = 1;
  const w2 = cutout(win, web, 0.42, 0.42, [2.18, 1.15, Z]); w2.scale.x = -1;
  [[0.95, 0.95, 0.18, 0.2], [1.35, 1.12, 0.24, -0.15], [1.8, 0.88, 0.16, 0.35], [1.6, 0.72, 0.2, -0.3]].forEach(([x, y, s, r]) =>
    cutout(win, bat, s * 1.5, s, [x, y, Z + 0.002], false, '#15151a').rotation.z = r);

  // round the front door (x 3.55..4.3): a web in the top corner, bats on the wall either side
  const door = new THREE.Group(); all.add(door);
  const dw = cutout(door, web, 0.32, 0.32, [4.13, 1.2, Z]); dw.scale.x = -1;
  [[3.38, 1.05, 0.14, 0.3], [3.3, 0.8, 0.11, -0.2], [4.5, 0.95, 0.15, -0.35], [4.62, 0.68, 0.1, 0.2]].forEach(([x, y, s, r]) =>
    cutout(door, bat, s * 1.5, s, [x, y, Z + 0.002], false, '#15151a').rotation.z = r);

  // the ghost hanging in the hall: a round head and a floaty sheet, two dark eyes, on a thread
  const ghost = group(3.78, 0, 6.95); all.add(ghost);
  const body = new THREE.Group(); body.position.y = 0.95; ghost.add(body);
  const sheet = mat('#f6f6f2');
  add(body, new THREE.SphereGeometry(0.11, 16, 12), sheet, [0, 0.18, 0]);
  add(body, new THREE.CylinderGeometry(0.11, 0.17, 0.26, 16, 1, true), new THREE.MeshStandardMaterial({ color: '#f6f6f2', side: THREE.DoubleSide }), [0, 0.05, 0]);
  [-1, 1].forEach(s => add(body, new THREE.SphereGeometry(0.018, 8, 6), mat('#1a1a22'), [s * 0.04, 0.2, 0.1], [1, 1.4, 0.5]));
  add(body, new THREE.SphereGeometry(0.02, 8, 6), mat('#1a1a22'), [0, 0.13, 0.105], [1, 1.3, 0.5]);
  add(ghost, new THREE.CylinderGeometry(0.003, 0.003, 0.2, 4), mat('#d0d0d0'), [0, 1.33, 0]);

  scene.add(all);
  return { halloween: { all, step, lights, bulbs, window: win, door, ghost, ghostBody: body, stepLantern } };
}

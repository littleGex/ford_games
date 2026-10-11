// Building blocks for the world. Everything is laid out in plan coordinates:
// rectangles are given as x1,z1,x2,z2 (metres), heights as h and a base height y0.
// solid() registers a rectangle the player cannot walk through.
import * as THREE from 'three';
import { WALL_HEIGHT as WH } from '../config.js';
import { TEX } from './textures.js';

// Builders add to the current target: the scene for the ground floor and gardens, or the upstairs
// group (raised by LEVEL_HEIGHT) for the first floor. Colliders remember which floor they're on.
let scene = null, level = 0;
export const colliders = [];
export function setBuildTarget(target, onLevel = 0) { scene = target; level = onLevel; }
export function put(obj) { scene.add(obj); return obj; }

export const M = {
  wall: new THREE.MeshStandardMaterial({ color: '#f1eee8', roughness: .9 }),
  cap: new THREE.MeshStandardMaterial({ color: '#24304a', roughness: .8 }),
  glass: new THREE.MeshStandardMaterial({ color: '#9fd3ff', transparent: true, opacity: .4, roughness: .1 }),
  frame: new THREE.MeshStandardMaterial({ color: '#2f343c', roughness: .6 }),
};

const matCache = new Map();
/** Shared matte material for a colour. Pass fresh:true when the material will be changed later. */
export function mat(color, { fresh = false, map = null } = {}) {
  if (fresh || map) return new THREE.MeshStandardMaterial({ color, roughness: .85, map });
  if (!matCache.has(color)) matCache.set(color, new THREE.MeshStandardMaterial({ color, roughness: .85 }));
  return matCache.get(color);
}

/** Add a mesh to a parent with optional position / scale / rotation arrays. */
export function add(parent, geo, material, pos, scl, rot) {
  const o = new THREE.Mesh(geo, material);
  if (pos) o.position.set(...pos);
  if (scl) o.scale.set(...scl);
  if (rot) o.rotation.set(...rot);
  parent.add(o);
  return o;
}

export function solid(x1, z1, x2, z2) { colliders.push({ x1, z1, x2, z2, level }); }

export function box(x1, z1, x2, z2, h, y0, material, castShadow = true) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(x2 - x1, h, z2 - z1), material);
  m.position.set((x1 + x2) / 2, y0 + h / 2, (z1 + z2) / 2);
  m.castShadow = castShadow; m.receiveShadow = true;
  return put(m);
}

/** Box in a colour that blocks the player unless collide is false. */
export function fbox(x1, z1, x2, z2, h, color, collide = true, y0 = 0) {
  const m = box(x1, z1, x2, z2, h, y0, mat(color));
  if (collide) solid(x1, z1, x2, z2);
  return m;
}

export function cyl(x, z, r, h, color, y0 = 0, collide = false) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 24), mat(color));
  m.position.set(x, y0 + h / 2, z); m.castShadow = true; m.receiveShadow = true;
  if (collide) solid(x - r, z - r, x + r, z + r);
  return put(m);
}

export function ball(x, y, z, r, color, scale) {
  const m = new THREE.Mesh(new THREE.SphereGeometry(r, 16, 12), mat(color));
  m.position.set(x, y, z); if (scale) m.scale.set(...scale); m.castShadow = true;
  return put(m);
}

export function floor(x1, z1, x2, z2, tex, scale, y = 0.02) {
  const t = tex.clone(); t.needsUpdate = true;
  t.repeat.set((x2 - x1) / scale, (z2 - z1) / scale);
  const m = new THREE.Mesh(new THREE.PlaneGeometry(x2 - x1, z2 - z1), new THREE.MeshStandardMaterial({ map: t, roughness: .95 }));
  m.rotation.x = -Math.PI / 2; m.position.set((x1 + x2) / 2, y, (z1 + z2) / 2);
  m.receiveShadow = true;
  return put(m);
}

export function brickMat(w, h) {
  const t = TEX.brick.clone(); t.needsUpdate = true; t.repeat.set(w / 1.0, h / 0.85);
  return new THREE.MeshStandardMaterial({ map: t, roughness: .95 });
}

export function wall(x1, z1, x2, z2) {
  box(x1, z1, x2, z2, WH, 0, M.wall);
  box(x1, z1, x2, z2, .03, WH, M.cap, false);
  solid(x1, z1, x2, z2);
}

export function windowPiece(x1, z1, x2, z2) {
  box(x1, z1, x2, z2, .8, 0, M.wall);
  box(x1, z1, x2, z2, WH - .8, .8, M.glass, false);
  box(x1, z1, x2, z2, .03, WH, M.cap, false);
  solid(x1, z1, x2, z2);
  // anthracite frame: sill, side posts and a centre mullion on wide windows
  const alongX = (x2 - x1) > (z2 - z1), L = alongX ? x2 - x1 : z2 - z1, w = 0.05;
  box(x1, z1, x2, z2, 0.04, 0.8, M.frame, false);
  [w / 2, L - w / 2].concat(L > 1.2 ? [L / 2] : []).forEach(p => {
    if (alongX) box(x1 + p - w / 2, z1 - 0.01, x1 + p + w / 2, z2 + 0.01, WH - .8, .8, M.frame, false);
    else box(x1 - 0.01, z1 + p - w / 2, x2 + 0.01, z1 + p + w / 2, WH - .8, .8, M.frame, false);
  });
}

/**
 * A straight wall with openings. axis 'x': runs along x from a to b, thickness c1..c2 in z.
 * axis 'z': runs along z, thickness c1..c2 in x. openings: [[from, to, 'door'|'win'], ...]
 */
export function run(axis, a, b, c1, c2, openings) {
  const rect = (p, q) => axis === 'x' ? [p, c1, q, c2] : [c1, p, c2, q];
  let cur = a;
  for (const [o1, o2, type] of openings) {
    if (o1 > cur) wall(...rect(cur, o1));
    if (type === 'win') windowPiece(...rect(o1, o2));
    else { const r = rect(o1, o2); floor(r[0], r[1], r[2], r[3], TEX.tile, 0.5, 0.03); } // threshold
    cur = o2;
  }
  if (cur < b) wall(...rect(cur, b));
}

/** Brick skin on the outside face of a wall that runs along x, matching its openings. */
export function facade(a, b, d1, d2, openings) {
  let cur = a; const piece = (p, q, h) => box(p, d1, q, d2, h, 0, brickMat(q - p, h));
  for (const [o1, o2, type] of openings) { if (o1 > cur) piece(cur, o1, WH); if (type === 'win') piece(o1, o2, 0.8); cur = o2; }
  if (cur < b) piece(cur, b, WH);
}

export function glassWall(x1, z1, x2, z2) {
  box(x1, z1, x2, z2, WH, 0, M.glass, false);
  box(x1, z1, x2, z2, 0.06, 0, M.frame, false);
  box(x1, z1, x2, z2, 0.05, WH - 0.05, M.frame, false);
  solid(x1, z1, x2, z2);
}

export function fence(x1, z1, x2, z2, h) {
  const t = TEX.boards.clone(); t.needsUpdate = true; t.repeat.set(Math.max(x2 - x1, z2 - z1) / 1.2, 1);
  box(x1, z1, x2, z2, h, 0, new THREE.MeshStandardMaterial({ map: t, roughness: 1 }));
  solid(x1, z1, x2, z2);
}

export function bush(x, z, r, color) { return ball(x, r * 0.75, z, r, color, [1, 0.8, 1]); }

export function group(x = 0, y = 0, z = 0) { const g = new THREE.Group(); g.position.set(x, y, z); return put(g); }

export function castShadows(obj) { obj.traverse(o => { if (o.isMesh) o.castShadow = true; }); return obj; }

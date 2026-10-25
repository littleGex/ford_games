// The five ships, built from boxes and cylinders like the furniture in Ford House: a pointed hull with a red
// waterline, then each ship's own deck and guns. A ship is built along +x, centred on (0, 0), with the waterline
// at y = 0; placeShip() turns and moves it onto its squares. The enemy's wrecks get a rusty paint job.
import * as THREE from 'three';
import { shipLength } from '../rules.js';

const PAINT = {
  home: { hull: '#55616d', deck: '#8f9ba6', top: '#cfd6dc', dark: '#39424b', stripe: '#b8392d' },
  enemy: { hull: '#4a3a34', deck: '#6f5d52', top: '#9b8676', dark: '#2e2420', stripe: '#7c2a20' },
};

function hullGeometry(len, width, height) {
  const l = len / 2, w = width / 2, bow = Math.min(0.9, len * 0.28);
  const s = new THREE.Shape();
  s.moveTo(-l, -w * 0.85);
  s.quadraticCurveTo(-l, -w, -l + 0.12, -w);
  s.lineTo(l - bow, -w);
  s.quadraticCurveTo(l - bow * 0.25, -w * 0.8, l, 0);
  s.quadraticCurveTo(l - bow * 0.25, w * 0.8, l - bow, w);
  s.lineTo(-l + 0.12, w);
  s.quadraticCurveTo(-l, w, -l, w * 0.85);
  s.closePath();
  const geo = new THREE.ExtrudeGeometry(s, { depth: height, bevelEnabled: false, curveSegments: 6 });
  geo.rotateX(-Math.PI / 2);   // the shape lies on the water, the extrusion goes up
  return geo;
}

export function makeShip(id, side = 'home') {
  const paint = PAINT[side];
  const mats = Object.fromEntries(Object.entries(paint).map(([k, c]) => [k, new THREE.MeshStandardMaterial({ color: c, roughness: 0.7, metalness: 0.15 })]));
  const ship = new THREE.Group();
  const add = (geo, mat, x, y, z, ry = 0) => {
    const m = new THREE.Mesh(geo, mats[mat]);
    m.position.set(x, y, z); m.rotation.y = ry;
    m.castShadow = true; m.receiveShadow = true;
    ship.add(m);
    return m;
  };
  const box = (w, h, d, mat, x, y, z) => add(new THREE.BoxGeometry(w, h, d), mat, x, y + h / 2, z);
  const cyl = (r, h, mat, x, y, z, seg = 12) => add(new THREE.CylinderGeometry(r, r, h, seg), mat, x, y + h / 2, z);
  const turret = (x, y, facing = 1) => {
    cyl(0.17, 0.12, 'deck', x, y, 0, 14);
    const barrel = add(new THREE.CylinderGeometry(0.035, 0.035, 0.42, 8), 'dark', x + facing * 0.24, y + 0.08, 0.05);
    barrel.rotation.z = Math.PI / 2;
    const barrel2 = barrel.clone(); barrel2.position.z = -0.05; ship.add(barrel2);
  };

  const len = shipLength(id) - 0.16;
  if (id === 'submarine') {
    // a long rounded hull lying low in the water, with the conning tower on top
    const body = add(new THREE.CylinderGeometry(0.24, 0.24, len - 0.48, 16), 'hull', 0, 0.02, 0);
    body.rotation.z = Math.PI / 2;
    for (const sx of [-1, 1]) {
      const end = add(new THREE.SphereGeometry(0.24, 16, 12), 'hull', sx * (len - 0.48) / 2, 0.02, 0);
      end.scale.x = sx > 0 ? 1.0 : 0.8;
    }
    box(0.62, 0.36, 0.2, 'top', 0.1, 0.12, 0);
    box(0.26, 0.04, 0.6, 'dark', 0.12, 0.3, 0);
    cyl(0.02, 0.3, 'dark', 0.22, 0.48, 0, 6);
    box(0.06, 0.2, 0.5, 'dark', -len / 2 + 0.1, -0.05, 0);   // the tail fins
    return finish(ship, mats);
  }

  const width = id === 'carrier' ? 0.68 : id === 'destroyer' ? 0.5 : 0.6;
  const deckY = 0.2;
  add(hullGeometry(len, width, deckY + 0.08), 'hull', 0, -0.08, 0);
  add(hullGeometry(len * 1.002, width * 1.02, 0.07), 'stripe', 0, -0.06, 0);   // red below the waterline

  if (id === 'carrier') {
    // a flat flight deck overhanging the hull, the island on the right, a couple of planes
    box(len + 0.1, 0.06, 0.86, 'deck', -0.05, deckY, 0);
    const lines = new THREE.Mesh(new THREE.PlaneGeometry(len - 0.4, 0.03), new THREE.MeshBasicMaterial({ color: '#f2e9c9' }));
    lines.rotation.x = -Math.PI / 2; lines.position.set(-0.1, deckY + 0.065, 0); ship.add(lines);
    box(0.7, 0.36, 0.2, 'top', 0.45, deckY + 0.06, 0.32);
    box(0.32, 0.2, 0.16, 'top', 0.5, deckY + 0.42, 0.32);
    cyl(0.02, 0.36, 'dark', 0.5, deckY + 0.62, 0.32, 6);
    for (const [x, z] of [[-1.2, -0.12], [-0.5, 0.1]]) {
      box(0.36, 0.05, 0.08, 'dark', x, deckY + 0.07, z);
      box(0.1, 0.04, 0.4, 'dark', x + 0.04, deckY + 0.08, z);
    }
  } else if (id === 'battleship') {
    box(len - 0.5, 0.06, width - 0.04, 'deck', -0.12, deckY, 0);
    turret(0.95, deckY + 0.06, 1);
    turret(-1.15, deckY + 0.06, -1);
    box(0.8, 0.26, 0.42, 'top', -0.05, deckY + 0.06, 0);
    box(0.42, 0.24, 0.32, 'top', 0.08, deckY + 0.32, 0);
    cyl(0.1, 0.34, 'dark', -0.32, deckY + 0.32, 0);
    cyl(0.025, 0.5, 'dark', 0.1, deckY + 0.56, 0, 6);
  } else if (id === 'cruiser') {
    box(len - 0.45, 0.06, width - 0.04, 'deck', -0.1, deckY, 0);
    turret(0.7, deckY + 0.06, 1);
    box(0.62, 0.24, 0.38, 'top', -0.05, deckY + 0.06, 0);
    box(0.3, 0.2, 0.28, 'top', 0.05, deckY + 0.3, 0);
    cyl(0.09, 0.3, 'dark', -0.5, deckY + 0.06, 0);
    cyl(0.022, 0.4, 'dark', 0.08, deckY + 0.5, 0, 6);
  } else {   // destroyer
    box(len - 0.4, 0.05, width - 0.04, 'deck', -0.1, deckY, 0);
    box(0.36, 0.22, 0.3, 'top', 0.15, deckY + 0.05, 0);
    cyl(0.075, 0.26, 'dark', -0.22, deckY + 0.05, 0);
    turret(0.5, deckY + 0.05, 1);
  }
  return finish(ship, mats);
}

function finish(ship, mats) {
  ship.userData.mats = Object.values(mats);
  return ship;
}

/** Turn and move a ship model onto its squares on a board. */
export function placeShip(model, { id, x, y, dir }, board) {
  const n = shipLength(id) - 1;
  const p = board.local(dir === 'h' ? x + n / 2 : x, dir === 'h' ? y : y + n / 2);
  model.position.set(p.x, model.position.y, p.z);
  // built along +x with the bow at +x: a ship across faces right, a ship down faces the bottom of the board
  model.rotation.y = dir === 'h' ? 0 : -Math.PI / 2;
  model.userData.ship = { id, x, y, dir };
}

/** Glow a ship a colour (picked up, or can't go there), or null for its own paint. */
export function tint(model, color) {
  for (const m of model.userData.mats) {
    m.emissive.set(color || '#000000');
    m.emissiveIntensity = color ? 0.55 : 1;
  }
}

/** How high a peg on this ship stands (on the deck). */
export const deckHeight = id => (id === 'submarine' ? 0.24 : 0.27);

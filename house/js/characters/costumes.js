// Halloween costumes, put on over a character's own clothes (characters/character.js): a hat or ears on
// the head, a cape, a sheet or a pumpkin belly on the body. dressUp returns what it added so undress can
// take it all off again.
import * as THREE from 'three';
import { add } from '../core/build.js';
import { charMat as M } from './character.js';

export const COSTUMES = [
  { id: 'witch', label: 'Witch', icon: '🧙' },
  { id: 'vampire', label: 'Vampire', icon: '🧛' },
  { id: 'ghost', label: 'Ghost', icon: '👻' },
  { id: 'cat', label: 'Black cat', icon: '🐱' },
  { id: 'pumpkin', label: 'Pumpkin', icon: '🎃' },
];

function cape(torso, outer, inner, long) {
  const g = new THREE.Group(); g.position.set(0, 0.4, -0.2); g.rotation.x = 0.12; torso.add(g);
  const h = long ? 0.78 : 0.62;
  add(g, new THREE.BoxGeometry(0.46, h, 0.02), M(outer), [0, -h / 2 + 0.02, 0]);
  if (inner) add(g, new THREE.BoxGeometry(0.42, h - 0.04, 0.01), M(inner), [0, -h / 2 + 0.02, 0.016]);
  return g;
}

/** A costume top over the character's own: a slightly bigger body in the costume's colour. */
function suitOver(torso, color) {
  const g = new THREE.Group(); torso.add(g);
  add(g, new THREE.CylinderGeometry(0.178, 0.208, 0.43, 22), M(color), [0, 0.2, 0]);
  add(g, new THREE.SphereGeometry(0.178, 22, 12, 0, Math.PI * 2, 0, Math.PI / 2), M(color), [0, 0.415, 0], [1, 0.45, 1]);
  return g;
}

const BUILD = {
  witch(c, torso) {
    const hat = new THREE.Group(); hat.position.y = 0.17; c.head.add(hat);
    add(hat, new THREE.CylinderGeometry(0.32, 0.32, 0.02, 24), M('#1d1a24'), [0, 0, 0]);
    add(hat, new THREE.ConeGeometry(0.17, 0.42, 20), M('#1d1a24'), [0, 0.22, 0], null, [-0.15, 0, 0.08]);
    add(hat, new THREE.CylinderGeometry(0.172, 0.18, 0.05, 20), M('#7a3fb5'), [0, 0.04, 0]);
    return [hat, cape(torso, '#5b2d8c', null, false)];
  },
  vampire(c, torso) {
    const cl = cape(torso, '#141418', '#b3192b', true);
    const suit = suitOver(torso, '#17171c');
    add(suit, new THREE.BoxGeometry(0.1, 0.26, 0.02), M('#f4f4f2'), [0, 0.27, 0.196], null, [0.07, 0, 0]);   // shirt front
    add(suit, new THREE.SphereGeometry(0.025, 10, 8), M('#b3192b'), [0, 0.33, 0.21]);                          // red medallion
    const hair = add(c.head, new THREE.SphereGeometry(0.238, 24, 14, 0, Math.PI * 2, 0, Math.PI * 0.3), M('#111114'), [0, 0.012, -0.004], [1, 1.08, 1]);   // slicked-back hair
    [-1, 1].forEach(s => add(cl, new THREE.BoxGeometry(0.16, 0.2, 0.02), M('#141418'), [s * 0.17, 0.1, 0.02], null, [0, s * 0.5, 0]));   // the high collar
    const fangs = new THREE.Group(); c.head.add(fangs);
    [-1, 1].forEach(s => add(fangs, new THREE.ConeGeometry(0.008, 0.03, 6), M('#ffffff'), [s * 0.022, -0.105, 0.19], null, [Math.PI, 0, 0]));
    return [cl, fangs, suit, hair];
  },
  ghost(c) {
    const sheet = new THREE.Group(); c.fig.add(sheet);
    const cloth = new THREE.MeshStandardMaterial({ color: '#f6f6f2', roughness: 0.9, side: THREE.DoubleSide });
    add(sheet, new THREE.SphereGeometry(0.25, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2), cloth, [0, 1.15, 0], [1, 1.1, 1]);
    add(sheet, new THREE.CylinderGeometry(0.25, 0.34, 0.86, 24, 1, true), cloth, [0, 0.72, 0]);
    [-1, 1].forEach(s => add(sheet, new THREE.SphereGeometry(0.035, 10, 8), M('#15151a'), [s * 0.08, 1.17, 0.235], [1, 1.4, 0.4]));
    return [sheet];
  },
  cat(c, torso) {
    const suit = suitOver(torso, '#17171c');
    add(suit, new THREE.SphereGeometry(0.1, 14, 10), M('#f2f2f0'), [0, 0.26, 0.15], [1, 1.2, 0.5]);   // white bib
    const ears = new THREE.Group(); c.head.add(ears);
    [-1, 1].forEach(s => {
      add(ears, new THREE.ConeGeometry(0.09, 0.17, 4), M('#17171c'), [s * 0.13, 0.23, 0], null, [0, 0, -s * 0.3]);
      add(ears, new THREE.ConeGeometry(0.045, 0.09, 4), M('#e89aa6'), [s * 0.128, 0.215, 0.035], null, [0, 0, -s * 0.3]);
    });
    add(ears, new THREE.SphereGeometry(0.025, 8, 6), M('#17171c'), [0, -0.01, 0.215]);
    [-1, 1].forEach(s => [0, 1].forEach(k => add(ears, new THREE.BoxGeometry(0.1, 0.004, 0.004), M('#17171c'), [s * 0.1, -0.03 - k * 0.025, 0.2], null, [0, 0, s * (k ? -0.15 : 0.15)])));
    const tail = new THREE.Group(); tail.position.set(0, 0.0, -0.18); torso.add(tail);
    add(tail, new THREE.TorusGeometry(0.16, 0.025, 8, 16, Math.PI * 0.9), M('#17171c'), [0, -0.12, -0.05], null, [0, Math.PI / 2, 0]);
    return [suit, ears, tail];
  },
  pumpkin(c, torso) {
    const belly = new THREE.Group(); belly.position.y = 0.17; torso.add(belly);
    add(belly, new THREE.SphereGeometry(0.27, 22, 16), M('#ec7a1c'), [0, 0, 0], [1, 0.85, 1]);
    [[-0.07, 0.07], [0.07, 0.07]].forEach(([x, y]) => add(belly, new THREE.ConeGeometry(0.035, 0.05, 3), M('#2a1608'), [x, y, 0.235], null, [Math.PI / 2, 0, 0]));
    add(belly, new THREE.BoxGeometry(0.14, 0.03, 0.02), M('#2a1608'), [0, -0.05, 0.24]);
    const stalk = new THREE.Group(); stalk.position.y = 0.2; c.head.add(stalk);
    add(stalk, new THREE.CylinderGeometry(0.03, 0.04, 0.12, 8), M('#4f7a2a'), [0, 0.04, 0]);
    add(stalk, new THREE.SphereGeometry(0.06, 10, 6), M('#5fa043'), [0.06, 0.03, 0], [1.4, 0.3, 0.8]);
    return [belly, stalk];
  },
};

/** Put a costume on a character (from makeCharacter). Takes off any costume it already had. */
export function dressUp(c, id) {
  undress(c);
  const build = BUILD[id];
  if (!build) return;
  c.costume = { id, parts: build(c, c.head.parent) };
  c.costume.parts.forEach(p => p.traverse(o => { if (o.isMesh) o.castShadow = true; }));
}

export function undress(c) {
  if (!c.costume) return;
  c.costume.parts.forEach(p => p.parent && p.parent.remove(p));
  c.costume = null;
}

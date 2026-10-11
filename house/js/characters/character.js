// Chunky, big-headed figures built from simple shapes. A spec describes colours, scale and hair;
// makeCharacter returns the parts that get animated (legs, arms, head, fig).
import * as THREE from 'three';
import { add } from '../core/build.js';

export function charMat(color, map = null) { return new THREE.MeshStandardMaterial({ color, roughness: .75, map }); }

function capsule(r, len, m) {
  const g = new THREE.Group();
  g.add(new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, 16), m));
  const a = new THREE.Mesh(new THREE.SphereGeometry(r, 16, 12), m); a.position.y = len / 2; g.add(a);
  const b = a.clone(); b.position.y = -len / 2; g.add(b);
  return g;
}

export function makeCharacter(sp) {
  const root = new THREE.Group(), fig = new THREE.Group();
  fig.scale.setScalar(sp.scale); root.add(fig);
  const skin = charMat(sp.skin), pants = charMat(sp.pants), top = sp.topMat, sleeve = sp.sleeveMat || sp.topMat;

  const legs = [-1, 1].map(side => {
    const hip = new THREE.Group(); hip.position.set(side * 0.085, 0.44, 0);
    const leg = capsule(sp.legR || 0.075, 0.24, pants); leg.position.y = -0.2; hip.add(leg);
    if (sp.socks) add(hip, new THREE.CylinderGeometry(0.068, 0.068, 0.05, 12), charMat(sp.socks), [0, -0.35, 0]);
    add(hip, new THREE.SphereGeometry(0.085, 16, 10), charMat(sp.shoes), [0, -0.39, 0.035], [1, 0.55, 1.5]);
    fig.add(hip); return hip;
  });

  const torso = new THREE.Group(); torso.position.y = 0.44; fig.add(torso);
  add(torso, new THREE.CylinderGeometry(0.17, 0.2, 0.42, 22), top, [0, 0.2, 0]);
  add(torso, new THREE.SphereGeometry(0.17, 22, 12, 0, Math.PI * 2, 0, Math.PI / 2), top, [0, 0.41, 0], [1, 0.45, 1]);
  add(torso, new THREE.SphereGeometry(0.2, 22, 12, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), pants, [0, 0, 0], [1, 0.35, 1]);
  if (sp.extras) sp.extras(torso);

  const arms = [-1, 1].map(side => {
    const sh = new THREE.Group(); sh.position.set(side * 0.215, 0.37, 0); sh.rotation.z = side * 0.12;
    const a = capsule(0.06, 0.2, sleeve); a.position.y = -0.15; sh.add(a);
    add(sh, new THREE.SphereGeometry(0.062, 12, 10), skin, [0, -0.31, 0]);
    torso.add(sh); return sh;
  });

  const head = new THREE.Group(); head.position.y = 0.69; torso.add(head);
  add(head, new THREE.CylinderGeometry(0.06, 0.07, 0.12, 12), skin, [0, -0.2, 0]);
  add(head, new THREE.SphereGeometry(0.21, 28, 20), skin, [0, 0, 0], [1, 1.05, 0.95]);
  [-1, 1].forEach(s => add(head, new THREE.SphereGeometry(0.045, 12, 10), skin, [s * 0.205, -0.01, 0], [0.5, 1, 0.8]));
  const ink = charMat('#1a1a22');
  [-1, 1].forEach(s => {
    add(head, new THREE.SphereGeometry(0.028, 12, 10), ink, [s * 0.075, 0.03, 0.188], [0.85, 1.35, 0.5]);
    add(head, new THREE.SphereGeometry(0.008, 8, 6), charMat('#ffffff'), [s * 0.075 + 0.008, 0.045, 0.2]);
    add(head, new THREE.BoxGeometry(0.07, 0.016, 0.02), charMat(sp.brow), [s * 0.078, 0.1, 0.19], null, [0, 0, -s * 0.12]);
    if (sp.blush) add(head, new THREE.SphereGeometry(0.035, 12, 8), charMat('#f0a39b'), [s * 0.12, -0.045, 0.168], [1, 0.6, 0.3]);
  });
  add(head, new THREE.SphereGeometry(0.03, 12, 10), skin, [0, -0.01, 0.205]);
  sp.hair(head);
  add(head, new THREE.TorusGeometry(0.05, 0.012, 8, 18, Math.PI), charMat('#8a2f2f'), [0, -0.085, sp.beard ? 0.222 : 0.185], null, [0, 0, Math.PI]);
  root.traverse(o => { if (o.isMesh) o.castShadow = true; });
  return { root, fig, legs, arms, head, scale: sp.scale };
}

/** Walking / carrying / idle pose. hold: arm angle when carrying something, or null. */
export function animateWalk(c, dt, { walking, phase, hold, reduceMotion }) {
  const k = Math.min(1, dt * 12), sw = walking ? Math.sin(phase) * 0.55 : 0;
  c.legs[0].rotation.x += (sw - c.legs[0].rotation.x) * k;
  c.legs[1].rotation.x += (-sw - c.legs[1].rotation.x) * k;
  const a0 = hold ?? -sw * 0.8, a1 = hold ?? sw * 0.8;
  c.arms[0].rotation.x += (a0 - c.arms[0].rotation.x) * k;
  c.arms[1].rotation.x += (a1 - c.arms[1].rotation.x) * k;
  c.fig.position.y = (walking && !reduceMotion) ? Math.abs(Math.sin(phase)) * 0.025 : 0;
  c.head.rotation.z = (walking || reduceMotion) ? 0 : Math.sin(performance.now() / 900) * 0.05;
}

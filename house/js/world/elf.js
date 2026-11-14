// The naughty elf (systems/elf.js) and his little door on the skirting board in the hall, by the kitchen door.
// He's about 0.3 m tall, in a red suit and a pointed hat, sitting with his legs out in front of him.
import * as THREE from 'three';
import { add, mat } from '../core/build.js';

// His door: on the hall side of the kitchen wall (z = 4.0), left of the kitchen door. `at` is where you stand.
export const ELF_DOOR = { at: [3.62, 4.45], place: [3.62, 0, 4.06] };

/** The elf, sitting (origin on the floor, facing +z). */
export function makeElf(g = new THREE.Group()) {
  const red = mat('#c62828'), green = mat('#2e7d32'), skin = mat('#f1c7a5'), white = mat('#fafafa');
  add(g, new THREE.BoxGeometry(0.12, 0.13, 0.08), red, [0, 0.115, 0]);                       // body
  add(g, new THREE.BoxGeometry(0.13, 0.02, 0.09), white, [0, 0.05, 0]);                       // fur trim
  [-0.035, 0.035].forEach(x => {
    add(g, new THREE.BoxGeometry(0.04, 0.035, 0.13), red, [x, 0.02, 0.08]);                   // legs, out in front
    add(g, new THREE.BoxGeometry(0.04, 0.045, 0.03), green, [x, 0.025, 0.16]);                // pointy shoes
  });
  [-0.075, 0.075].forEach(x => add(g, new THREE.BoxGeometry(0.03, 0.1, 0.03), red, [x, 0.13, 0.01]));   // arms
  add(g, new THREE.SphereGeometry(0.05, 14, 10), skin, [0, 0.225, 0]);                        // head
  add(g, new THREE.SphereGeometry(0.008, 6, 4), mat('#d9776b'), [0, 0.22, 0.05]);              // nose
  [-0.018, 0.018].forEach(x => add(g, new THREE.SphereGeometry(0.006, 6, 4), mat('#222'), [x, 0.235, 0.045]));   // eyes
  add(g, new THREE.TorusGeometry(0.048, 0.01, 6, 16), white, [0, 0.26, 0], null, [Math.PI / 2, 0, 0]);   // hat brim
  add(g, new THREE.ConeGeometry(0.048, 0.12, 14), red, [0.01, 0.32, -0.01], null, [-0.25, 0, -0.2]);      // hat
  add(g, new THREE.SphereGeometry(0.014, 8, 6), white, [0.025, 0.375, -0.03]);                // bobble
  return g;
}

/** His door, flat against the wall (origin on the floor at the wall face, facing +z). */
export function makeElfDoor(g = new THREE.Group()) {
  add(g, new THREE.BoxGeometry(0.15, 0.2, 0.012), mat('#7a4a26'), [0, 0.1, 0.006]);           // frame
  add(g, new THREE.BoxGeometry(0.12, 0.17, 0.016), mat('#2e7d32'), [0, 0.09, 0.008]);         // door
  add(g, new THREE.SphereGeometry(0.008, 8, 6), mat('#e0b23a'), [0.04, 0.085, 0.02]);          // knob
  add(g, new THREE.BoxGeometry(0.03, 0.03, 0.004), mat('#ffe9a8'), [0, 0.14, 0.017]);          // a little window
  return g;
}

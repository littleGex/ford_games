// Front of the house: cobbled path and bin pad, mossy wooden canopy over the door, wall lamp,
// letterbox, wallbox, rhododendrons, tree, covered grill, picket fence and the car parked on the street.
import * as THREE from 'three';
import { TEX } from '../../core/textures.js';
import { add, ball, box, bush, castShadows, cyl, floor, group, mat, solid } from '../../core/build.js';

export function buildFront() {
  floor(3.3, 9.255, 4.55, 12.6, TEX.cobble, 1, 0.015);   // path to the front door
  floor(4.55, 9.255, 5.7, 10.85, TEX.cobble, 1, 0.015);  // bin pad

  const canopy = group(3.92, 1.55, 9.3);
  const roof = TEX.moss.clone(); roof.needsUpdate = true; roof.repeat.set(1.5, 0.8);
  add(canopy, new THREE.BoxGeometry(1.5, 0.06, 0.8), new THREE.MeshStandardMaterial({ map: roof, roughness: 1 }), [0, 0.12, 0.4], null, [0.3, 0, 0]);
  [-0.62, 0.62].forEach(x => {
    add(canopy, new THREE.BoxGeometry(0.07, 0.5, 0.07), mat('#2e2620'), [x, -0.05, 0.02]);
    add(canopy, new THREE.BoxGeometry(0.06, 0.06, 0.7), mat('#2e2620'), [x, -0.12, 0.32], null, [0.6, 0, 0]);
  });
  castShadows(canopy);

  cyl(3.32, 9.33, 0.045, 0.14, '#c9ccd1', 1.0);                                  // wall lamp
  box(2.85, 9.3, 3.2, 9.36, 0.24, 0.62, mat('#3a3f47'), false);                  // letterbox
  box(2.85, 9.3, 3.2, 9.38, 0.03, 0.86, mat('#c9ccd1'), false);
  box(4.45, 9.3, 4.62, 9.33, 0.12, 1.02, mat('#f2f2f2'), false);                 // house number plate
  box(4.82, 9.3, 5.07, 9.4, 0.3, 0.7, mat('#16171a'), false);                    // wallbox

  [[0.2, 9.9, 0.55], [0.9, 10.2, 0.6], [1.7, 9.95, 0.55], [2.4, 10.25, 0.5], [0.5, 10.7, 0.45], [1.5, 10.75, 0.5]]
    .forEach(([x, z, r], i) => bush(x, z, r, i % 2 ? '#2f5b2e' : '#3b6b36'));
  solid(-0.35, 9.35, 2.9, 11.1);
  cyl(-1.3, 10.6, 0.16, 1.7, '#5a4a3c', 0, true);
  [[-1.3, 2.0, 10.6, 0.75], [-0.8, 1.8, 10.3, 0.55], [-1.7, 1.8, 10.9, 0.55]].forEach(([x, y, z, r]) => ball(x, y, z, r, '#a8b33a'));
  ball(3.0, 0.42, 9.8, 0.4, '#202227', [0.9, 1.1, 0.8]); solid(2.7, 9.5, 3.28, 10.1);   // covered grill
  for (let z = 9.35; z < 10.9; z += 0.13) box(5.66, z, 5.72, z + 0.07, 0.55 + ((z * 10 | 0) % 2) * 0.05, 0, mat('#9b7650'));
  box(5.66, 9.3, 5.72, 10.9, 0.05, 0.4, mat('#8a6844'), false);

  const car = group(0.6, 0, 14.9);
  add(car, new THREE.BoxGeometry(4.3, 0.55, 1.8), mat('#f2f2f0'), [0, 0.45, 0]);
  add(car, new THREE.BoxGeometry(2.4, 0.5, 1.6), mat('#f2f2f0'), [-0.2, 0.95, 0]);
  add(car, new THREE.BoxGeometry(2.3, 0.38, 1.64), mat('#2a3340'), [-0.2, 0.97, 0]);
  [[-1.4, 0.9], [1.4, 0.9], [-1.4, -0.9], [1.4, -0.9]].forEach(([x, z]) => add(car, new THREE.CylinderGeometry(0.32, 0.32, 0.22, 18), mat('#1a1a1c'), [x, 0.32, z], null, [Math.PI / 2, 0, 0]));
  castShadows(car);
  return { car };
}

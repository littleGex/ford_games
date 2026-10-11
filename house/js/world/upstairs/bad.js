// Bad (bathroom): bath with a shower and curtain along the street wall, window above it, wall-hung toilet
// in front of a grey tiled box with a black shelf, small basin on a white cabinet, washing machine in the
// corner by the door, white towel radiator.
import * as THREE from 'three';
import { add, box, castShadows, cyl, fbox, group, mat, put, solid } from '../../core/build.js';

export function buildBad() {
  // bath along the street wall, shower riser at the party-wall end, curtain half drawn
  fbox(4.0, 8.15, 5.64, 8.86, 0.55, '#f7f7f7');
  box(4.08, 8.22, 5.56, 8.8, 0.02, 0.54, mat('#dfe6ea'), false);
  cyl(5.6, 8.5, 0.012, 0.85, '#c9ccd1', 0.55);
  cyl(5.55, 8.5, 0.05, 0.02, '#c9ccd1', 1.38).rotation.z = Math.PI / 2;
  box(4.0, 8.13, 5.64, 8.15, 0.015, 1.36, mat('#c9ccd1'), false);
  box(4.0, 8.12, 4.55, 8.16, 1.15, 0.2, mat('#f4f4f4'), false);
  // shower water, shown while someone is showering
  const water = group(5.3, 0, 8.5); water.visible = false;
  const drop = new THREE.MeshStandardMaterial({ color: '#9fd3ff', transparent: true, opacity: 0.7 });
  for (let k = 0; k < 6; k++) add(water, new THREE.CylinderGeometry(0.008, 0.008, 0.25, 4), drop, [(k % 3 - 1) * 0.07, 1.0, (k > 2 ? 1 : -1) * 0.05]);

  // boxed-in cistern along the party wall with a black shelf, toilet and basin in front
  box(5.42, 6.95, 5.64, 8.15, 1.15, 0, mat('#a39a8f'));
  box(5.38, 6.95, 5.64, 8.15, 0.03, 1.15, mat('#18191c'), false);
  box(5.4, 7.62, 5.42, 7.88, 0.15, 0.85, mat('#ffffff'), false);
  solid(5.42, 6.95, 5.64, 8.15);
  const bowl = new THREE.Mesh(new THREE.SphereGeometry(0.22, 20, 14), mat('#fbfbfb'));
  bowl.scale.set(1.25, 0.55, 0.95); bowl.position.set(5.15, 0.42, 7.75); bowl.castShadow = true; put(bowl);
  solid(4.9, 7.55, 5.42, 7.95);
  fbox(5.02, 7.0, 5.42, 7.45, 0.68, '#f4f4f4');
  box(5.0, 6.98, 5.42, 7.47, 0.1, 0.68, mat('#ffffff'), false);
  cyl(5.35, 7.22, 0.012, 0.12, '#c9ccd1', 0.78);
  ['#7fc4e8', '#f2f2f2', '#e86a8a', '#d6d9dc'].forEach((c, i) => cyl(5.5, 7.1 + i * 0.22, 0.035, 0.14, c, 1.18));   // things on the shelf

  // washing machine in the corner by the door; the drum turns while it runs
  fbox(3.35, 8.28, 3.95, 8.86, 0.85, '#f4f4f4');
  const drumFrame = group(3.65, 0.42, 8.27);
  add(drumFrame, new THREE.TorusGeometry(0.17, 0.035, 10, 24), mat('#8f979c'));
  const drum = group(3.65, 0.42, 8.265);
  add(drum, new THREE.CircleGeometry(0.15, 20), mat('#3a3f48'), [0, 0, 0], null, [0, Math.PI, 0]);
  add(drum, new THREE.BoxGeometry(0.22, 0.04, 0.01), mat('#c9ccd1'));
  castShadows(drumFrame);
  box(3.4, 8.27, 3.6, 8.28, 0.08, 0.7, mat('#2a2c30'), false);   // display

  // towel radiator by the door
  for (let i = 0; i < 9; i++) box(3.33, 7.2, 3.4, 7.75, 0.025, 0.25 + i * 0.12, mat('#f7f7f7'), false);
  return { washerDrum: drum, showerWater: water };
}

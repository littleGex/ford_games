// Wohnzimmer: dark leather sofa on the gable wall with a mirror above, bookshelf with the globe lamp
// by the French door, dark curtain panels, long oak TV bench under the TV, Dude's bentwood chair,
// tall cabinet by the dining opening, and the little light-box cupboard by the sofa with Dad's 3D printer
// inside (glass top and front, lit inside; the phone rests on top).
import * as THREE from 'three';
import { WALL_HEIGHT as WH } from '../../config.js';
import { M, add, ball, box, cyl, fbox, group, mat, put, solid } from '../../core/build.js';
import { createTv } from '../tv.js';

export function buildWohnzimmer() {
  box(3.252, 0, 3.265, 5.56, WH, 0, mat('#8d939a'), false);       // grey TV wall
  box(0, 0, 0.012, 5.51, WH, 0, mat('#d3d8dd'), false);           // light grey gable wall

  // sofa
  fbox(0.05, 1.2, 0.95, 3.3, 0.42, '#2e3136');
  box(0.05, 1.2, 0.28, 3.3, 0.42, 0.42, mat('#26292d'));
  box(0.05, 1.05, 0.95, 1.2, 0.25, 0.42, mat('#26292d'), false);
  box(0.05, 3.3, 0.95, 3.45, 0.25, 0.42, mat('#26292d'), false);
  solid(0.05, 1.05, 0.95, 3.45);
  box(0.6, 2.3, 0.95, 2.6, 0.14, 0.42, mat('#e19a3c'), false);     // orange cushion
  box(0.012, 1.5, 0.03, 2.9, 0.3, 1.02, mat('#1d1f24'), false);    // mirror frame
  box(0.03, 1.55, 0.034, 2.85, 0.22, 1.06, mat('#cfe3ef'), false); // mirror

  // bookshelf with the globe lamp on top
  fbox(0.05, 0.06, 0.95, 0.4, 1.0, '#d9b98a');
  ['#c0392b', '#2f6fd6', '#f2c81c', '#3a9d5d', '#8e44ad', '#e67e22'].forEach((c, i) =>
    box(0.1 + i * 0.13, 0.42, 0.2 + i * 0.13, 0.38, 0.22, 0.55 + (i % 2) * 0.02, mat(c), false));
  cyl(0.3, 0.22, 0.06, 0.1, '#b87333', 1.0);
  const shade = new THREE.Mesh(new THREE.SphereGeometry(0.14, 20, 14),
    new THREE.MeshStandardMaterial({ color: '#efe6d8', transparent: true, opacity: 0.85, emissive: '#000000' }));
  shade.position.set(0.3, 1.24, 0.22); put(shade);
  const light = new THREE.PointLight('#ffc980', 0, 7, 1.6); light.position.set(0.3, 1.25, 0.35); put(light);

  // curtains, French door frames, radiator
  box(0.6, 0.0, 1.0, 0.05, 1.38, 0, mat('#2b2e33'), false);
  box(2.3, 0.0, 2.7, 0.05, 1.38, 0, mat('#2b2e33'), false);
  [[1.05, 1.1], [1.63, 1.67], [2.2, 2.25]].forEach(([a, b]) => box(a, -0.375, b, 0, WH, 0, mat('#f4f4f2'), false));
  box(2.75, 0.02, 3.1, 0.1, 0.75, 0.2, mat('#f4f4f2'), false);

  // TV bench and TV
  fbox(2.82, 0.4, 3.265, 4.0, 0.5, '#c08d55');
  [1.0, 1.9, 2.8, 3.6].forEach(z => box(2.8, z - 0.05, 2.82, z + 0.05, 0.015, 0.3, mat('#d9dcdf'), false));
  box(3.2, 1.32, 3.252, 3.08, 0.66, 0.64, mat('#111214'), false);
  const tv = createTv();

  // bentwood kids' chair facing the TV
  fbox(2.05, 1.95, 2.55, 2.45, 0.06, '#d9b98a');
  box(2.1, 2.0, 2.5, 2.4, 0.06, 0.32, mat('#efe6d8'), false);
  box(2.05, 2.0, 2.12, 2.4, 0.4, 0.36, mat('#efe6d8'), false);

  // tall cabinet and side table by the dining opening, a football
  fbox(0.05, 3.9, 0.5, 5.45, 0.75, '#556052');
  box(0.05, 3.9, 0.5, 5.45, 0.6, 0.75, mat('#d8d6cf'));
  const printer = buildPrinterCupboard();
  ball(2.0, 0.11, 0.55, 0.11, '#f2f2f2');

  return { lamp: { light, shade }, tv, printer };
}

// The printer cupboard: x 0.6-1.05, z 3.45-3.9, 0.55 high, door facing the room (+x).
export const PRINTER = { x1: 0.6, z1: 3.45, x2: 1.05, z2: 3.9, at: [1.42, 3.68] };

/** The light box: wooden sides and back, glass top and door, a light strip inside, and a little 3D printer
 *  (frame, moving bed, print head on its gantry, a spool on the side). Returns the moving parts. */
function buildPrinterCupboard() {
  const P = PRINTER, h = 0.55, wood = mat('#d9c7a6');
  box(P.x1, P.z1, P.x2, P.z1 + 0.02, h, 0, wood);                          // sides
  box(P.x1, P.z2 - 0.02, P.x2, P.z2, h, 0, wood);
  box(P.x1, P.z1, P.x1 + 0.02, P.z2, h, 0, wood);                          // back (against the sofa end)
  box(P.x1, P.z1, P.x2, P.z2, 0.03, 0, wood);                              // floor
  box(P.x1 + 0.02, P.z1 + 0.02, P.x2 - 0.02, P.z2 - 0.02, 0.005, h - 0.02, new THREE.MeshBasicMaterial({ color: '#fff8e6' }), false);   // light strip under the top
  box(P.x1, P.z1, P.x2, P.z2, 0.012, h - 0.012, M.glass, false);           // glass top (the phone sits on it)
  box(P.x2 - 0.01, P.z1, P.x2, P.z2, h - 0.03, 0.03, M.glass, false);      // glass door
  box(P.x2 - 0.012, P.z2 - 0.07, P.x2 + 0.005, P.z2 - 0.05, 0.12, 0.25, mat('#9aa1a8'), false);   // handle
  solid(P.x1, P.z1, P.x2, P.z2);

  const cx = (P.x1 + P.x2) / 2 + 0.01, cz = (P.z1 + P.z2) / 2;
  const printer = group(cx, 0.03, cz);
  const dark = mat('#2b2d31');
  add(printer, new THREE.BoxGeometry(0.3, 0.04, 0.32), dark, [0, 0.02, 0]);                                   // base
  [-0.14, 0.14].forEach(dz => add(printer, new THREE.BoxGeometry(0.025, 0.36, 0.025), dark, [-0.08, 0.2, dz]));   // gantry posts
  const bed = new THREE.Group(); bed.position.set(0.02, 0.05, 0); printer.add(bed);
  add(bed, new THREE.BoxGeometry(0.2, 0.012, 0.2), mat('#3b4250'), [0, 0, 0]);
  const model = new THREE.Group(); model.position.y = 0.007; bed.add(model);                               // the print grows here
  const gantry = new THREE.Group(); gantry.position.set(-0.08, 0.1, 0); printer.add(gantry);
  add(gantry, new THREE.BoxGeometry(0.03, 0.025, 0.3), dark, [0.02, 0, 0]);                                   // X bar
  const head = new THREE.Group(); gantry.add(head);
  add(head, new THREE.BoxGeometry(0.05, 0.05, 0.045), mat('#e8e8e2'), [0.05, -0.005, 0]);
  add(head, new THREE.ConeGeometry(0.008, 0.02, 8), mat('#c9a04a'), [0.06, -0.04, 0], null, [Math.PI, 0, 0]);
  const spool = new THREE.Group(); spool.position.set(-0.11, 0.42, 0); spool.visible = false; printer.add(spool);
  const spoolMat = new THREE.MeshStandardMaterial({ color: '#e04848', roughness: 0.5 });
  add(spool, new THREE.CylinderGeometry(0.06, 0.06, 0.04, 20), spoolMat, [0, 0, 0], null, [Math.PI / 2, 0, 0]);
  add(spool, new THREE.CylinderGeometry(0.065, 0.065, 0.005, 20), dark, [0, 0, 0.022], null, [Math.PI / 2, 0, 0]);
  add(spool, new THREE.CylinderGeometry(0.065, 0.065, 0.005, 20), dark, [0, 0, -0.022], null, [Math.PI / 2, 0, 0]);
  return { group: printer, bed, model, gantry, head, spool, spoolMat };
}

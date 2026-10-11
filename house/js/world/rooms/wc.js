// WC: wall-hung toilet on the wall with the stairs behind it (boxed-in cistern with a granite shelf
// running the full width), basin on a navy cabinet against the party wall with an LED mirror,
// fuse box and meters in the front corner, towel radiator, fish picture, Dude's skateboard.
import * as THREE from 'three';
import { box, cyl, fbox, mat, put, solid } from '../../core/build.js';
import { canvasTex } from '../../core/textures.js';

export function buildWc() {
  box(4.565, 6.875, 5.64, 7.1, 1.15, 0, mat('#f4f4f2'));
  box(4.565, 6.875, 5.64, 7.13, 0.035, 1.15, mat('#18191c'), false);
  box(5.15, 7.1, 5.45, 7.12, 0.15, 0.85, mat('#ffffff'), false);        // flush plate
  const bowl = new THREE.Mesh(new THREE.SphereGeometry(0.22, 20, 14), mat('#fbfbfb'));
  bowl.scale.set(0.95, 0.55, 1.25); bowl.position.set(5.3, 0.4, 7.35); bowl.castShadow = true; put(bowl);
  box(5.1, 7.15, 5.5, 7.6, 0.03, 0.48, mat('#ffffff'), false);          // seat lid
  solid(4.565, 6.875, 5.64, 7.13); solid(4.95, 7.1, 5.64, 7.6);
  cyl(5.05, 7.25, 0.06, 0.3, '#f4f4f2');                                 // brush holder

  fbox(5.36, 7.75, 5.64, 8.2, 0.72, '#1f2840');                          // basin cabinet
  box(5.34, 7.73, 5.64, 8.22, 0.08, 0.72, mat('#ffffff'), false);
  const mirror = box(5.6, 7.72, 5.64, 8.23, 0.42, 0.9,
    new THREE.MeshStandardMaterial({ color: '#e9f6ff', emissive: '#bfe6ff', emissiveIntensity: .8 }), false);

  box(5.0, 8.35, 5.5, 8.55, 0.03, 0.07, mat('#151517'), false);          // skateboard
  [[5.08, 8.37], [5.08, 8.53], [5.42, 8.37], [5.42, 8.53]].forEach(([x, z]) => { cyl(x, z, 0.03, 0.025, '#eae4d6', 0.02).rotation.x = Math.PI / 2; });

  // house connections: fuse box (blinks red in a power cut), water meter, gas / water / power lines
  box(4.6, 8.7, 5.1, 8.88, 0.5, 0.85, mat('#d9dcdf'));
  box(4.62, 8.69, 5.08, 8.7, 0.46, 0.87, mat('#c4c8cc'), false);
  const fuseLed = new THREE.Mesh(new THREE.SphereGeometry(0.025, 10, 8), new THREE.MeshStandardMaterial({ color: '#550000', emissive: '#000000' }));
  fuseLed.position.set(5.03, 1.28, 8.68); put(fuseLed);
  box(4.65, 8.76, 4.85, 8.88, 0.25, 0.5, mat('#f0f0f0'));
  [[4.7, '#f2c81c'], [4.95, '#2f6fd6'], [5.05, '#3a3d44']].forEach(([x, c]) => cyl(x, 8.83, 0.022, 0.85, c));
  solid(4.6, 8.65, 5.1, 8.88);

  for (let i = 0; i < 7; i++) box(4.57, 7.18, 4.61, 7.68, 0.035, 0.25 + i * 0.15, mat('#f7f7f7'), false);
  const fish = canvasTex(g => {
    g.fillStyle = '#ffffff'; g.fillRect(0, 0, 256, 256);
    g.fillStyle = '#78b4e8'; g.beginPath(); g.ellipse(128, 150, 90, 55, 0, 0, 7); g.fill();
    g.fillStyle = '#f08a24'; g.beginPath(); g.ellipse(170, 140, 18, 12, 0, 0, 7); g.fill();
    g.lineWidth = 10; g.strokeStyle = '#111'; g.strokeRect(0, 0, 256, 256);
  });
  const pic = new THREE.Mesh(new THREE.PlaneGeometry(0.32, 0.32), new THREE.MeshStandardMaterial({ map: fish }));
  pic.position.set(5.635, 1.0, 8.5); pic.rotation.y = -Math.PI / 2; put(pic);

  return { mirror, fuseLed };
}

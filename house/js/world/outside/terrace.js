// Terrace under the glass roof: anthracite frame, glass walls (three panels get dirty), one section slid
// open to the garden, dark tiles, outdoor sofa, bikes, basketball hoop, clothes horse, hose reel, plant pot.
import * as THREE from 'three';
import { WALL_HEIGHT as WH } from '../../config.js';
import { TEX, canvasTex } from '../../core/textures.js';
import { M, add, ball, box, castShadows, cyl, fbox, floor, glassWall, group, mat, put, solid } from '../../core/build.js';

function bike(x, z, color) {
  const g = group(x, 0, z);
  [-0.45, 0.45].forEach(dx => add(g, new THREE.TorusGeometry(0.3, 0.025, 8, 24), mat('#151515'), [dx, 0.32, 0]));
  add(g, new THREE.BoxGeometry(0.85, 0.04, 0.04), mat(color), [0, 0.5, 0], null, [0, 0, 0.15]);
  add(g, new THREE.BoxGeometry(0.04, 0.4, 0.04), mat(color), [-0.15, 0.5, 0]);
  add(g, new THREE.BoxGeometry(0.2, 0.04, 0.08), mat('#151515'), [-0.18, 0.72, 0]);
  add(g, new THREE.BoxGeometry(0.04, 0.06, 0.4), mat('#151515'), [0.4, 0.78, 0]);
  castShadows(g);
}

export function buildTerrace() {
  floor(-0.3, -3.4, 5.66, -0.375, TEX.greytile, 1.2, 0.015).material.color.set('#7a7f87');

  glassWall(-0.3, -3.42, 3.35, -3.36); glassWall(4.5, -3.42, 5.66, -3.36);
  glassWall(-0.3, -3.36, -0.24, -0.42); glassWall(5.6, -3.36, 5.66, -0.42);
  [-0.27, 1.6, 3.35, 4.5, 5.63].forEach(x => box(x - 0.04, -3.44, x + 0.04, -3.34, WH + 0.1, 0, M.frame));
  box(-0.3, -3.44, 5.66, -3.34, 0.08, WH + 0.1, M.frame, false);
  for (let x = 0; x <= 5.6; x += 1.15) box(x - 0.03, -3.4, x + 0.03, -0.42, 0.06, WH + 0.12, M.frame, false);
  box(3.4, -3.33, 4.45, -3.29, WH, 0, M.glass, false);   // the slid-open panel

  // dirt on the three garden-side panels (the window-washing job clears them)
  const dirtTex = canvasTex(g => {
    for (let i = 0; i < 80; i++) {
      g.fillStyle = `rgba(${110 + Math.random() * 40 | 0},${90 + Math.random() * 30 | 0},60,${(0.25 + Math.random() * 0.35).toFixed(2)})`;
      g.beginPath(); g.arc(Math.random() * 256, Math.random() * 256, 4 + Math.random() * 16, 0, 7); g.fill();
    }
  });
  const dirt = [[-0.24, 1.6], [1.6, 3.35], [4.5, 5.6]].map(([a, b]) => {
    const p = new THREE.Mesh(new THREE.PlaneGeometry(b - a - 0.06, 1.25), new THREE.MeshBasicMaterial({ map: dirtTex, transparent: true, depthWrite: false }));
    p.position.set((a + b) / 2, 0.7, -3.33);
    return put(p);
  });

  // furniture and clutter
  fbox(2.45, -1.15, 3.75, -0.45, 0.4, '#b98a55');
  box(2.5, -1.1, 3.7, -0.5, 0.12, 0.4, mat('#ece6da'), false);
  box(2.5, -0.62, 3.7, -0.45, 0.45, 0.4, mat('#ece6da'), false);
  fbox(2.7, -2.15, 3.5, -1.6, 0.38, '#c08d55');
  cyl(3.0, -1.85, 0.06, 0.25, '#1a1a1a', 0.38);
  bike(4.75, -0.7, '#f4f4f4'); bike(4.6, -1.1, '#e9d84a'); solid(4.05, -1.35, 5.3, -0.42);
  fbox(-0.05, -3.25, 0.45, -2.75, 0.18, '#2848a8');          // basketball hoop
  cyl(0.2, -3.0, 0.035, 1.15, '#2848a8', 0.18);
  box(-0.05, -3.1, 0.45, -3.05, 0.3, 1.1, mat('#2848a8'), false);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.015, 8, 20), mat('#e33a3a'));
  ring.rotation.x = Math.PI / 2; ring.position.set(0.2, 1.15, -2.9); put(ring);
  const rack = group(0.55, 0, -1.55);                         // clothes horse
  add(rack, new THREE.BoxGeometry(1.1, 0.03, 0.5), mat('#f2f2f2'), [0, 0.85, 0]);
  [-0.55, 0.55].forEach(x => add(rack, new THREE.BoxGeometry(0.03, 0.85, 0.5), mat('#5bc0e8'), [x, 0.42, 0]));
  ['#f4f4f4', '#e7d3e0', '#d9e3ea', '#f2e6c8'].forEach((c, i) => add(rack, new THREE.BoxGeometry(0.22, 0.3, 0.01), mat(c), [-0.4 + i * 0.27, 0.7, 0]));
  solid(0.0, -1.8, 1.1, -1.3);
  ball(1.15, 0.11, -0.85, 0.11, '#f2f2f2');
  cyl(5.3, -0.5, 0.2, 0.1, '#2fb0c2', 0.5).rotation.x = Math.PI / 2;   // hose reel
  box(3.82, -0.45, 3.92, -0.41, 0.22, 1.05, mat('#2a2a2a'), false);    // wall lamp

  // the plant you water, in a pot just outside the glass
  cyl(2.4, -3.85, 0.25, 0.4, '#b45c3c', 0, true);
  const plant = group(2.4, 0.4, -3.85);
  const leaf = mat('#6f8a3c', { fresh: true });
  for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; add(plant, new THREE.SphereGeometry(0.14, 10, 8), leaf, [Math.cos(a) * .12, .12 + (i % 2) * .1, Math.sin(a) * .12]); }
  castShadows(plant);
  plant.scale.setScalar(0.7);

  return { dirt, plant, plantLeaf: leaf };
}

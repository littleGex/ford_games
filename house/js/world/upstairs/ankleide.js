// Ankleide (dressing room): oak sliding wardrobe on one side (stopping short of the door so you can get in),
// grey glass sliding wardrobe on the other, Dad's desk shelf by the window (monitor, laptop, radio, chair), plants on the
// sill, laundry hampers by the door.
import * as THREE from 'three';
import { WALL_HEIGHT as WH } from '../../config.js';
import { box, cyl, fbox, group, mat, solid } from '../../core/build.js';
import { canvasTex } from '../../core/textures.js';

// what's on Dad's monitor for each work task (shown while he's sitting at the desk)
const PAGES = {
  mail: g => {   // an inbox: unread dots and lines
    g.fillStyle = '#f4f6f9'; g.fillRect(0, 0, 256, 160); g.fillStyle = '#2f6fd6'; g.fillRect(0, 0, 256, 18);
    for (let r = 0; r < 7; r++) { g.fillStyle = r < 3 ? '#2f6fd6' : '#c9ced6'; g.beginPath(); g.arc(14, 32 + r * 18, 4, 0, 7); g.fill(); g.fillStyle = '#5a6270'; g.fillRect(26, 28 + r * 18, 90 + (r * 37) % 80, 4); g.fillStyle = '#a7aebb'; g.fillRect(26, 35 + r * 18, 150, 3); }
  },
  call: g => {   // a video call: four faces
    g.fillStyle = '#1d1e22'; g.fillRect(0, 0, 256, 160);
    ['#4f7172', '#7a4ab0', '#c76a3c', '#3f9e5a'].forEach((c, i) => {
      const x = 8 + (i % 2) * 124, y = 8 + Math.floor(i / 2) * 74;
      g.fillStyle = c; g.fillRect(x, y, 116, 68); g.fillStyle = '#f1d1ba'; g.beginPath(); g.arc(x + 58, y + 30, 14, 0, 7); g.fill();
      g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(x + 36, y + 48, 44, 20);
    });
  },
  doc: g => {   // a report with a chart
    g.fillStyle = '#e9ecf0'; g.fillRect(0, 0, 256, 160); g.fillStyle = '#ffffff'; g.fillRect(48, 6, 160, 154);
    g.fillStyle = '#1d1e22'; g.fillRect(60, 16, 90, 6);
    for (let r = 0; r < 5; r++) { g.fillStyle = '#8a929e'; g.fillRect(60, 32 + r * 9, 120 - (r % 2) * 30, 3); }
    ['#2f6fd6', '#3fd394', '#ffb02e', '#e04848'].forEach((c, i) => { g.fillStyle = c; g.fillRect(70 + i * 26, 140 - (20 + i * 12), 16, 20 + i * 12); });
  },
  code: g => {   // code in a dark editor
    g.fillStyle = '#1b1f27'; g.fillRect(0, 0, 256, 160);
    const cols = ['#c792ea', '#82aaff', '#c3e88d', '#f78c6c', '#89ddff', '#eeffff'];
    for (let r = 0; r < 12; r++) { let x = 10 + (r % 4) * 10; for (let k = 0; k < 3; k++) { const w = 14 + ((r * 7 + k * 11) % 40); g.fillStyle = cols[(r + k) % cols.length]; g.fillRect(x, 8 + r * 12, w, 5); x += w + 6; } }
  },
};

export function buildAnkleide() {
  // oak sliding doors with the thin aluminium strips
  fbox(3.17, 0.95, 3.72, 3.0, WH - 0.02, '#c69a62');
  [0.35, 0.7, 1.05].forEach(y => box(3.72, 0.97, 3.73, 2.98, 0.012, y, mat('#d6d9dc'), false));
  box(3.72, 1.96, 3.74, 1.98, WH - 0.05, 0.02, mat('#d6d9dc'), false);
  // grey glass sliding wardrobe
  const glass = new THREE.MeshStandardMaterial({ color: '#8f979c', roughness: 0.15, metalness: 0.2 });
  box(5.0, 0.8, 5.64, 3.85, WH - 0.02, 0, glass);
  [0.45, 0.95].forEach(y => box(4.99, 0.82, 5.0, 3.83, 0.015, y, mat('#d6d9dc'), false));
  box(4.98, 2.31, 5.0, 2.34, WH - 0.05, 0.02, mat('#d6d9dc'), false);
  fbox(5.0, 0.8, 5.64, 3.85, 0.01, '#8f979c');
  // Dad's desk shelf by the window: monitor, laptop, radio, and a chair
  box(3.17, 0.12, 3.47, 0.85, 0.03, 0.72, mat('#c69a62'), false);
  fbox(3.21, 0.14, 3.35, 0.26, 0.09, '#5a5f66', false, 0.75);                    // radio
  box(3.22, 0.44, 3.28, 0.56, 0.12, 0.75, mat('#2a2b30'), false);                 // monitor stand
  box(3.18, 0.27, 3.22, 0.73, 0.3, 0.86, mat('#1d1e22'), false);                  // monitor
  box(3.29, 0.6, 3.45, 0.82, 0.012, 0.75, mat('#c9ccd1'), false);                 // laptop
  box(3.29, 0.6, 3.305, 0.82, 0.15, 0.762, mat('#b9bcc1'), false);                // its lid, open
  const dadScreen = group(3.224, 1.01, 0.5); dadScreen.visible = false;          // lights up while Dad works
  Object.entries(PAGES).forEach(([name, draw]) => {
    const tex = canvasTex(draw); tex.repeat.set(1, 160 / 256); tex.offset.set(0, 1 - 160 / 256);   // pages are 256 x 160
    const page = new THREE.Mesh(new THREE.PlaneGeometry(0.44, 0.27), new THREE.MeshBasicMaterial({ map: tex }));
    page.name = name; page.rotation.y = Math.PI / 2; dadScreen.add(page);
  });
  // black office chair, facing the desk
  box(3.6, 0.3, 3.95, 0.7, 0.07, 0.45, mat('#1d1e22'));
  box(3.88, 0.3, 3.95, 0.7, 0.55, 0.5, mat('#1d1e22'), false);
  cyl(3.77, 0.5, 0.03, 0.45, '#2a2b30');
  solid(3.6, 0.3, 3.95, 0.7);
  box(4.85, 0.02, 5.25, 0.1, 0.55, 0.15, mat('#f2f2f2'), false);   // radiator
  ['#c76a3c', '#3f9e5a', '#d9a441', '#c76a3c'].forEach((c, i) => cyl(4.25 + i * 0.25, -0.1, 0.05, 0.1, c, 0.82));   // pots on the sill

  // laundry hampers by the door (grey bin and a wooden-framed bag)
  fbox(4.4, 3.35, 4.7, 3.82, 0.6, '#9aa0a6');
  fbox(4.72, 3.35, 4.98, 3.82, 0.55, '#c9c2b4');
  return { dadScreen };
}

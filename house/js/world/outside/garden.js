// Back garden: lawn (made of tufts that can be mowed), slate path along the tall fence, planting beds,
// rotary washing line, grey shed with the cream door, neighbour's pink shed, back gate, kids' picnic bench.
// Solar panels on the shed roof, Dad's workbench and bike stand beside the shed, and the bushes that grow
// shaggy until they're trimmed.
import * as THREE from 'three';
import { WALL_HEIGHT as WH } from '../../config.js';
import { TEX, canvasTex } from '../../core/textures.js';
import { M, add, ball, box, bush, castShadows, cyl, fbox, fence, floor, group, mat, put, solid } from '../../core/build.js';

/** Lawn as a grid of tufts. cut(i) shortens one tuft and gives it a mown stripe colour. */
function buildLawn() {
  const cells = [], size = 0.45;
  for (let x = 0.95 + size / 2; x <= 3.9 - size / 2 + 1e-6; x += size)
    for (let z = -3.65 - size / 2; z - size / 2 >= -14.4; z -= size) {
      if (Math.hypot(x - 2.4, z + 3.85) < 0.45 || Math.hypot(x - 2.4, z + 5.2) < 0.35) continue; // pot, washing line
      cells.push({ x, z, cut: false, row: Math.round((z + 3.65) / size) });
    }
  const mesh = new THREE.InstancedMesh(new THREE.BoxGeometry(size, 0.14, size).translate(0, 0.07, 0),
    new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 1 }), cells.length);
  const m4 = new THREE.Matrix4(), col = new THREE.Color();
  function paint(i) {
    const c = cells[i], h = c.cut ? 0.25 : 0.9 + ((i * 37) % 7) / 10;
    m4.makeScale(1, h, 1); m4.setPosition(c.x, 0, c.z); mesh.setMatrixAt(i, m4);
    col.set(c.cut ? (c.row % 2 ? '#8cc46d' : '#7cb75f') : ['#4c8a43', '#447f3c', '#53924a'][i % 3]); mesh.setColorAt(i, col);
  }
  cells.forEach((c, i) => paint(i));
  mesh.receiveShadow = true; put(mesh);
  return {
    cells,
    get cutCount() { return cells.filter(c => c.cut).length; },
    /** Cut every tuft within `reach` of (x, z). Returns how many were cut. */
    /** Start of day: grown long (needs mowing) or already cut. */
    reset(cut) {
      cells.forEach((c, i) => { c.cut = cut; paint(i); });
      mesh.instanceMatrix.needsUpdate = true; if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    },
    cutAround(x, z, reach = 0.42) {
      let n = 0;
      cells.forEach((c, i) => { if (!c.cut && Math.abs(c.x - x) < reach && Math.abs(c.z - z) < reach) { c.cut = true; paint(i); n++; } });
      if (n) { mesh.instanceMatrix.needsUpdate = true; mesh.instanceColor.needsUpdate = true; }
      return n;
    },
  };
}

function buildWashingLine() {
  const line = group(2.4, 0, -5.2);
  add(line, new THREE.CylinderGeometry(0.03, 0.035, 1.65, 10), mat('#2f9e8f'), [0, 0.82, 0]);
  const folded = add(line, new THREE.CylinderGeometry(0.08, 0.06, 1.1, 10), mat('#3fb7a3'), [0, 1.0, 0]);
  const open = new THREE.Group(); open.position.y = 1.6; open.visible = false; line.add(open);
  for (let k = 0; k < 4; k++) {
    const a = Math.PI / 4 + k * Math.PI / 2;
    add(open, new THREE.BoxGeometry(1.15, 0.03, 0.03), mat('#2f9e8f'), [Math.cos(a) * 0.57, 0, -Math.sin(a) * 0.57]).rotation.y = a;
  }
  [0.3, 0.55, 0.78].forEach(s => {
    add(open, new THREE.BoxGeometry(2 * s, 0.01, 0.01), mat('#d6dde3'), [0, 0, s]);
    add(open, new THREE.BoxGeometry(2 * s, 0.01, 0.01), mat('#d6dde3'), [0, 0, -s]);
    add(open, new THREE.BoxGeometry(0.01, 0.01, 2 * s), mat('#d6dde3'), [s, 0, 0]);
    add(open, new THREE.BoxGeometry(0.01, 0.01, 2 * s), mat('#d6dde3'), [-s, 0, 0]);
  });
  const clothes = new THREE.Group(); clothes.visible = false; open.add(clothes);
  const cols = ['#f4f4f4', '#e86a8a', '#f2d14a', '#9bd0a8', '#c8b1e8', '#2f6fd6', '#f07a2a', '#ffffff'];
  [[0, 0.78], [0, -0.78], [1, 0.78], [1, -0.78], [0, 0.55], [1, 0.55]].forEach(([axis, s], j) => {
    for (let k = -1; k <= 1; k++)
      add(clothes, new THREE.BoxGeometry(axis ? 0.012 : 0.26, 0.32, axis ? 0.26 : 0.012), mat(cols[(j * 3 + k + 8) % 8]), axis ? [s, -0.17, k * 0.42] : [k * 0.42, -0.17, s]);
  });
  castShadows(clothes);
  solid(2.3, -5.3, 2.5, -5.1);
  return {
    open() { folded.visible = false; open.visible = true; },
    hang() { clothes.visible = true; },
    reset() { folded.visible = true; open.visible = false; clothes.visible = false; },
    /** Is there washing hanging on the line? */
    hasWashing: () => open.visible && clothes.visible,
    /** Take the washing down (it goes back in the basket) and fold the line up. */
    takeIn() { clothes.visible = false; open.visible = false; folded.visible = true; },
  };
}

export function buildGarden() {
  fence(5.68, -17.4, 5.76, -0.42, 1.35);    // tall fence along the path side
  fence(-0.42, -17.4, -0.34, -0.42, 1.0);   // lower fence, neighbour side
  fence(-0.42, -17.5, 5.76, -17.4, 1.2);    // back fence
  floor(-0.34, -15.0, 0.9, -3.45, TEX.grass, 2, 0.012).material.color.set('#8a6a4c');   // beds
  floor(4.8, -15.0, 5.68, -3.45, TEX.grass, 2, 0.012).material.color.set('#8a6a4c');
  floor(3.95, -15.2, 4.75, -3.42, TEX.paving, 0.8, 0.016).material.color.set('#7a7f88'); // slate path

  const lawn = buildLawn();
  const washingLine = buildWashingLine();

  // shed, neighbour's pink shed, back gate
  box(1.4, -17.4, 3.9, -15.2, WH, 0, mat('#c9c8c2'));
  box(1.4, -17.4, 3.9, -15.2, 0.05, WH, mat('#8d8c86'), false);
  solid(1.4, -17.4, 3.9, -15.2);
  box(2.25, -15.2, 3.05, -15.16, 1.3, 0, mat('#efe9d2'), false);
  cyl(2.65, -15.17, 0.08, 0.06, '#2a2a2a', 1.33);
  box(-2.6, -17.4, -0.45, -15.6, WH, 0, mat('#e7b6b8'));
  box(3.95, -17.42, 4.75, -17.36, 1.25, 0, M.frame, false);

  // two solar panels on the shed roof, tilted towards the house, and the dust that builds up on them
  const cellTex = canvasTex(g => {
    g.fillStyle = '#1d2a4a'; g.fillRect(0, 0, 256, 256);
    g.strokeStyle = '#8a97b3'; g.lineWidth = 3;
    for (let i = 0; i <= 6; i++) { g.beginPath(); g.moveTo(i * 256 / 6, 0); g.lineTo(i * 256 / 6, 256); g.stroke(); }
    for (let i = 0; i <= 10; i++) { g.beginPath(); g.moveTo(0, i * 25.6); g.lineTo(256, i * 25.6); g.stroke(); }
  });
  const panelMat = new THREE.MeshStandardMaterial({ map: cellTex, roughness: 0.35, metalness: 0.2 });
  // the panels lean towards the back gate side of the shed: one group, tilted about its long edge
  const tilt = group(2.65, WH + 0.33, -16.3); tilt.rotation.z = -0.25;
  [-0.55, 0.55].forEach(dz => {
    add(tilt, new THREE.BoxGeometry(2.2, 0.03, 1.04), mat('#c9ccd1'), [0, -0.02, dz]);
    add(tilt, new THREE.BoxGeometry(2.16, 0.04, 1.0), panelMat, [0, 0, dz]);
  });
  castShadows(tilt);
  [[1.65, 0.6], [3.65, 0.08]].forEach(([x, h]) => [-16.95, -15.65].forEach(z => cyl(x, z, 0.025, h, '#9aa1a8', WH)));   // mounting legs
  const dustTex = canvasTex(g => {
    for (let i = 0; i < 90; i++) {
      g.fillStyle = `rgba(${150 + Math.random() * 50 | 0},${130 + Math.random() * 40 | 0},90,${(0.3 + Math.random() * 0.4).toFixed(2)})`;
      g.beginPath(); g.arc(Math.random() * 256, Math.random() * 256, 5 + Math.random() * 18, 0, 7); g.fill();
    }
    for (let i = 0; i < 14; i++) { g.fillStyle = ['#d9822b', '#7a8a3a', '#c4472b'][i % 3]; g.fillRect(Math.random() * 240, Math.random() * 240, 14, 8); }   // leaves
  });
  const panelDirt = add(tilt, new THREE.PlaneGeometry(2.2, 2.1), new THREE.MeshBasicMaterial({ map: dustTex, transparent: true, depthWrite: false }), [0, 0.03, 0], null, [-Math.PI / 2, 0, 0]);
  panelDirt.visible = false;

  // Dad's workbench against the side of the shed, with a vice and tools, and a wall-mounted bike stand
  fbox(0.05, -17.35, 1.35, -16.8, 0.82, '#a87b4f');
  box(0.05, -17.35, 1.35, -16.8, 0.05, 0.82, mat('#c99a6b'), false);
  box(1.0, -17.2, 1.2, -16.95, 0.1, 0.87, mat('#4a5a6a'), false);                                   // vice
  [['#d92a23', 0.25], ['#2f6fd6', 0.45], ['#f2c81c', 0.62]].forEach(([c, x]) => box(x, -17.1, x + 0.12, -17.05, 0.02, 0.87, mat(c), false));   // spanners
  box(0.05, -17.4, 1.35, -17.35, 0.5, 0.95, mat('#8a6844'), false);                                 // tool board
  [0.2, 0.42, 0.66, 0.9, 1.15].forEach((x, i) => box(x, -17.35, x + 0.05, -17.33, 0.22, 1.05 + (i % 2) * 0.1, mat('#5a5f67'), false));
  box(0.15, -16.2, 0.25, -16.1, 1.1, 0, mat('#2b2d31'), false);                                     // bike stand post
  box(0.15, -16.25, 0.55, -16.05, 0.04, 1.05, mat('#2b2d31'), false);

  // overgrown bits on the garden bushes, cleared by trimming
  const shaggy = (x, z, r, c) => {
    const g = group(x, 0, z);
    for (let k = 0; k < 7; k++) {
      const a = k * 0.9, h = r * (0.8 + (k % 3) * 0.25);
      add(g, new THREE.SphereGeometry(r * 0.35, 8, 6), mat(c), [Math.cos(a) * r * 0.85, h, Math.sin(a) * r * 0.85], [1, 1.4, 1]);
    }
    add(g, new THREE.SphereGeometry(r * 0.4, 8, 6), mat(c), [0, r * 1.45, 0], [1, 1.5, 1]);
    g.visible = false; return g;
  };
  const overgrown = TRIM_SPOTS.map(([x, z, r, c]) => shaggy(x, z, r, c));

  // planting and garden bits
  TRIM_SPOTS.forEach(([x, z, r, c]) => bush(x, z, r, c));
  cyl(0.35, -4.4, 0.07, 1.1, '#7a6a5a'); ball(0.35, 1.35, -4.4, 0.55, '#8fa540');
  fbox(0.0, -12.8, 0.8, -11.8, 0.45, '#b9a98f');                         // kids' picnic bench
  box(0.1, -12.6, 0.7, -12.0, 0.18, 0.45, mat('#cfe6f2'), false);       // tub on it
  ball(0.55, 0.35, -12.3, 0.08, '#e33a3a');                             // rubber duck
  ball(5.2, 0.45, -13.4, 0.4, '#202227', [0.9, 1.15, 0.8]);             // covered grill
  cyl(5.1, -11.9, 0.14, 0.9, '#8a6a4c', 0.14).rotation.x = Math.PI / 2; // log
  cyl(5.2, -3.9, 0.3, 0.85, '#4f8a3a', 0, true);                        // rain barrel

  return { lawn, washingLine, panelDirt, overgrown };
}

// the garden bushes [x, z, radius, colour]: they get shaggy and need trimming every so often
export const TRIM_SPOTS = [[0.35, -7.2, 0.55, '#3b6b36'], [0.4, -9.3, 0.5, '#3b6b36'],
  [5.2, -5.0, 0.5, '#8d3b3b'], [5.25, -7.0, 0.55, '#b6b043'], [5.2, -9.4, 0.5, '#a54a4a'], [5.25, -11.0, 0.45, '#9b8f3a']];

// Back garden: lawn (made of tufts that can be mowed), slate path along the tall fence, planting beds,
// rotary washing line, grey shed with the cream door, neighbour's pink shed, back gate, kids' picnic bench.
import * as THREE from 'three';
import { WALL_HEIGHT as WH } from '../../config.js';
import { TEX } from '../../core/textures.js';
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

  // planting and garden bits
  [[0.35, -7.2, 0.55], [0.4, -9.3, 0.5]].forEach(([x, z, r]) => bush(x, z, r, '#3b6b36'));
  [[5.2, -5.0, 0.5, '#8d3b3b'], [5.25, -7.0, 0.55, '#b6b043'], [5.2, -9.4, 0.5, '#a54a4a'], [5.25, -11.0, 0.45, '#9b8f3a']].forEach(([x, z, r, c]) => bush(x, z, r, c));
  cyl(0.35, -4.4, 0.07, 1.1, '#7a6a5a'); ball(0.35, 1.35, -4.4, 0.55, '#8fa540');
  fbox(0.0, -12.8, 0.8, -11.8, 0.45, '#b9a98f');                         // kids' picnic bench
  box(0.1, -12.6, 0.7, -12.0, 0.18, 0.45, mat('#cfe6f2'), false);       // tub on it
  ball(0.55, 0.35, -12.3, 0.08, '#e33a3a');                             // rubber duck
  ball(5.2, 0.45, -13.4, 0.4, '#202227', [0.9, 1.15, 0.8]);             // covered grill
  cyl(5.1, -11.9, 0.14, 0.9, '#8a6a4c', 0.14).rotation.x = Math.PI / 2; // log
  cyl(5.2, -3.9, 0.3, 0.85, '#4f8a3a', 0, true);                        // rain barrel

  return { lawn, washingLine };
}

// The neighbours' fronts, either side of ours: the same terrace house mirrored, with a light grey front door
// and window frames (ours are anthracite), the mossy canopy, lamp, letterbox and a cobbled path to the pavement.
// Only the outside: their houses stay solid brick behind the facade.
import * as THREE from 'three';
import { WALL_HEIGHT as WH } from '../../config.js';
import { TEX } from '../../core/textures.js';
import { M, add, box, bush, castShadows, cyl, floor, group, mat, solid } from '../../core/build.js';

// Each house is ours mirrored about the wall between: door and window swap sides.
// door: [x1, x2] of the front door; win: [x1, x2] of the front window; step: where you stand to ring.
export const NEIGHBOUR_HOUSES = {
  right: { door: [7.1, 7.85], win: [9.0, 11.0], step: [7.475, 9.95] },    // the party-wall side, by our front door
  left: { door: [-4.62, -3.87], win: [-2.72, -0.72], step: [-4.245, 9.95] }, // the gable side
};

const Z = 9.3;   // the front face of the row

export function buildNeighbours() {
  const grey = mat('#d3d6da'), greyDark = mat('#b9bdc2'), pane = mat('#34404c');
  for (const { door: [d1, d2], win: [w1, w2] } of Object.values(NEIGHBOUR_HOUSES)) {
    const dc = (d1 + d2) / 2, wide = w2 - w1;

    // window: dark room behind the glass, light grey sill, side posts and centre mullion
    box(w1, Z, w2, Z + 0.01, WH - 0.8, 0.8, pane, false);
    box(w1, Z + 0.01, w2, Z + 0.02, WH - 0.8, 0.8, M.glass, false);
    box(w1 - 0.03, Z, w2 + 0.03, Z + 0.07, 0.04, 0.78, grey, false);
    [w1, w1 + wide / 2 - 0.025, w2 - 0.05].forEach(x => box(x, Z, x + 0.05, Z + 0.035, WH - 0.82, 0.82, grey, false));

    // front door: light grey with a narrow glass strip and a long steel handle
    box(d1, Z, d2, Z + 0.04, WH, 0, grey, false);
    box(d1 - 0.04, Z, d1, Z + 0.05, WH, 0, greyDark, false);
    box(d2, Z, d2 + 0.04, Z + 0.05, WH, 0, greyDark, false);
    box(dc - 0.12, Z + 0.04, dc - 0.04, Z + 0.05, 0.9, 0.3, M.glass, false);
    box(d2 - 0.12, Z + 0.04, d2 - 0.1, Z + 0.07, 0.8, 0.35, mat('#c9ccd1'), false);
    box(d1, Z, d2, Z + 0.35, 0.05, 0, mat('#a7a39c'));   // doorstep

    // mossy wooden canopy over the door, like ours
    const canopy = group(dc, 1.55, Z);
    const roof = TEX.moss.clone(); roof.needsUpdate = true; roof.repeat.set(1.5, 0.8);
    add(canopy, new THREE.BoxGeometry(1.5, 0.06, 0.8), new THREE.MeshStandardMaterial({ map: roof, roughness: 1 }), [0, 0.12, 0.4], null, [0.3, 0, 0]);
    [-0.62, 0.62].forEach(x => {
      add(canopy, new THREE.BoxGeometry(0.07, 0.5, 0.07), mat('#2e2620'), [x, -0.05, 0.02]);
      add(canopy, new THREE.BoxGeometry(0.06, 0.06, 0.7), mat('#2e2620'), [x, -0.12, 0.32], null, [0.6, 0, 0]);
    });
    castShadows(canopy);

    // lamp and letterbox on the window side of the door, house number on the other
    const out = Math.sign(dc - (w1 + w2) / 2);   // +1: the window is to the left of the door
    cyl(dc - out * 0.6, Z + 0.03, 0.045, 0.14, '#c9ccd1', 1.0);
    const lb = dc - out * 0.9;
    box(lb - 0.17, Z, lb + 0.17, Z + 0.06, 0.24, 0.62, greyDark, false);
    box(lb - 0.17, Z, lb + 0.17, Z + 0.08, 0.03, 0.86, mat('#c9ccd1'), false);
    const np = dc + out * 0.615;
    box(np - 0.085, Z, np + 0.085, Z + 0.03, 0.12, 1.02, mat('#f2f2f2'), false);

    // cobbled path down to the pavement, a couple of shrubs under the window
    floor(d1 - 0.25, Z, d2 + 0.25, 12.6, TEX.cobble, 1, 0.015);
    [[w1 + 0.5, 0.42, '#3b6b36'], [w2 - 0.5, 0.38, '#2f5b2e']].forEach(([x, r, c]) => { bush(x, 9.85, r, c); solid(x - r * 0.8, Z, x + r * 0.8, 9.85 + r * 0.7); });
  }
  return {};
}

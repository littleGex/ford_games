// Attic hall: past the stairwell it runs on to the front of the house, with the white knee-wall cupboards
// under a Velux. A cheese plant on a wooden stool by the banister, storage boxes, a knitted pouf, an old TV
// leaning on the cupboards, a yellow-and-blue bag, and the ironing board against the office wall.
import { box, ball, cyl, fbox, mat, solid } from '../../core/build.js';

export function buildAtticFlur() {
  // plant on a stool by the front corner of the banister
  cyl(4.85, 6.4, 0.2, 0.45, '#9a6a42', 0, true);
  cyl(4.85, 6.4, 0.15, 0.22, '#c76a3c', 0.45);
  [[4.75, 0.95, 6.3, 0.18], [5.0, 1.1, 6.5, 0.16], [4.85, 1.3, 6.35, 0.15], [4.65, 0.8, 6.55, 0.14]]
    .forEach(([x, y, z, r], i) => ball(x, y, z, r, i % 2 ? '#2f6b34' : '#3d7d3b', [1, 0.25, 1]));
  // storage boxes, pouf, TV and bag in front of the cupboards
  fbox(3.95, 7.15, 4.55, 7.7, 0.32, '#dfe6ea');
  fbox(3.98, 7.18, 4.52, 7.67, 0.28, '#eef2f4', false, 0.32);
  cyl(4.95, 7.25, 0.24, 0.3, '#cdbb9c', 0, true);
  box(4.6, 7.62, 5.4, 7.7, 0.5, 0.02, mat('#1d1e22'), false);
  fbox(5.25, 7.15, 5.6, 7.6, 0.4, '#f2d22e');
  box(5.3, 7.2, 5.55, 7.55, 0.12, 0.4, mat('#2a4fa0'), false);
  // ironing board against the office wall, just past its door
  box(3.09, 5.3, 3.13, 5.75, 1.25, 0.02, mat('#f4f0f6'), false);
  [5.4, 5.6].forEach(z => box(3.13, z - 0.04, 3.135, z + 0.04, 0.09, 0.4 + (z - 5.4) * 2, mat('#7a4ab0'), false));
  solid(3.08, 5.3, 3.2, 5.75);
  return {};
}

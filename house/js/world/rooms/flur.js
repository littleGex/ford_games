// Flur: wooden coat rail with the family's coats over a small shoe bench.
import { box, fbox, mat, solid } from '../../core/build.js';

export function buildFlur() {
  box(3.38, 5.45, 3.44, 6.7, 0.07, 1.22, mat('#d9b98a'), false);
  [[5.55, '#1d1f24', 0.85], [5.75, '#d8f000', 0.7], [5.95, '#5b6a45', 0.8], [6.15, '#b39b72', 0.75], [6.4, '#ea4521', 0.65]]
    .forEach(([z, c, h]) => box(3.45, z - 0.11, 3.7, z + 0.11, h, 1.2 - h, mat(c)));
  fbox(3.38, 6.15, 3.75, 6.65, 0.45, '#e2c79a');   // shoe bench, top at 0.45
  solid(3.38, 5.45, 3.6, 6.15);
  return {};
}

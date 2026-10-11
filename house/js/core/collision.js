import { colliders } from './build.js';
import { BOUNDS, PLAYER_RADIUS as R } from '../config.js';
import { S } from '../state.js';

/** True if a player standing at (x, z) on a floor would overlap a wall, furniture or the edge of the map. */
export function blocked(x, z, level = S.level) {
  const b = BOUNDS[level];
  if (x < b.x1 || x > b.x2 || z < b.z1 || z > b.z2) return true;
  for (const c of colliders) {
    if (c.level !== level) continue;
    const nx = Math.max(c.x1, Math.min(x, c.x2)), nz = Math.max(c.z1, Math.min(z, c.z2));
    if ((x - nx) ** 2 + (z - nz) ** 2 < R * R) return true;
  }
  return false;
}

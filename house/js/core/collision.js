import { colliders } from './build.js';
import { BOUNDS, PLAYER_RADIUS as R } from '../config.js';

/** True if a player standing at (x, z) would overlap a wall, furniture or the edge of the map. */
export function blocked(x, z) {
  if (x < BOUNDS.x1 || x > BOUNDS.x2 || z < BOUNDS.z1 || z > BOUNDS.z2) return true;
  for (const c of colliders) {
    const nx = Math.max(c.x1, Math.min(x, c.x2)), nz = Math.max(c.z1, Math.min(z, c.z2));
    if ((x - nx) ** 2 + (z - nz) ** 2 < R * R) return true;
  }
  return false;
}

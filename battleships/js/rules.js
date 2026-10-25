// The rules of Battleships, with no three.js and no page: the grid, the fleet, placing ships and firing.
// Everything is plain data, so a game can be saved as JSON (and, later, sent to the other player's device).
//
// A ship on the grid is { id, x, y, dir }: (x, y) is its first square, 'h' runs to the right (x grows),
// 'v' runs down (y grows). x is the column (A-J), y the row (1-10).
// Ships may not touch, not even at the corners.
export const SIZE = 10;
export const FLEET = [
  { id: 'carrier', name: 'Carrier', len: 5 },
  { id: 'battleship', name: 'Battleship', len: 4 },
  { id: 'cruiser', name: 'Cruiser', len: 3 },
  { id: 'submarine', name: 'Submarine', len: 3 },
  { id: 'destroyer', name: 'Destroyer', len: 2 },
];
const BY_ID = Object.fromEntries(FLEET.map(s => [s.id, s]));
export const shipLength = id => BY_ID[id].len;
export const shipName = id => BY_ID[id].name;

/** "C7" for column 2, row 6. */
export const label = (x, y) => 'ABCDEFGHIJ'[x] + (y + 1);
export const inBounds = (x, y) => x >= 0 && y >= 0 && x < SIZE && y < SIZE;

/** The squares a ship covers, bow first. */
export function cells({ id, x, y, dir }) {
  const out = [];
  for (let i = 0; i < shipLength(id); i++) out.push(dir === 'h' ? [x + i, y] : [x, y + i]);
  return out;
}

const touches = (a, b) => cells(a).some(([ax, ay]) => cells(b).some(([bx, by]) => Math.abs(ax - bx) <= 1 && Math.abs(ay - by) <= 1));

/** Can this ship go here, with the rest of the fleet where it is? (The ship's own old place doesn't count.) */
export function fits(fleet, ship) {
  if (!cells(ship).every(([x, y]) => inBounds(x, y))) return false;
  return fleet.every(other => other.id === ship.id || !touches(other, ship));
}

/** A whole fleet: each ship once, all on the grid, none touching. */
export function validFleet(fleet) {
  if (!Array.isArray(fleet) || fleet.length !== FLEET.length) return false;
  if (!FLEET.every(s => fleet.filter(f => f && f.id === s.id).length === 1)) return false;
  if (!fleet.every(s => (s.dir === 'h' || s.dir === 'v') && Number.isInteger(s.x) && Number.isInteger(s.y))) return false;
  return fleet.every(s => fits(fleet, s));
}

/** The fleet placed at random, biggest ships first. */
export function randomFleet(rng = Math.random) {
  for (;;) {
    const fleet = [];
    let stuck = false;
    for (const { id } of FLEET) {
      let placed = false;
      for (let tries = 0; tries < 200 && !placed; tries++) {
        const ship = { id, dir: rng() < 0.5 ? 'h' : 'v', x: Math.floor(rng() * SIZE), y: Math.floor(rng() * SIZE) };
        if (fits(fleet, ship)) { fleet.push(ship); placed = true; }
      }
      if (!placed) { stuck = true; break; }
    }
    if (!stuck) return fleet;
  }
}

/** The ship on a square, or null. */
export const shipAt = (fleet, x, y) => fleet.find(s => cells(s).some(([cx, cy]) => cx === x && cy === y)) || null;

/**
 * What a shot at (x, y) does to a fleet that has already taken `shots`: 'miss', 'hit', or 'sunk' with the ship
 * (its whole placement, so the one who fired can see the wreck). A plain hit doesn't say which ship.
 */
export function resolveShot(fleet, shots, x, y) {
  const ship = shipAt(fleet, x, y);
  if (!ship) return { x, y, result: 'miss' };
  const hit = new Set([...shots.filter(s => s.result !== 'miss').map(s => `${s.x},${s.y}`), `${x},${y}`]);
  if (cells(ship).every(([cx, cy]) => hit.has(`${cx},${cy}`))) return { x, y, result: 'sunk', ship: { ...ship } };
  return { x, y, result: 'hit' };
}

/** Every ship in the fleet sunk by these shots? */
export const allSunk = shots => shots.filter(s => s.result === 'sunk').length === FLEET.length;

/** The ids of the ships these shots have sunk. */
export const sunkIds = shots => shots.filter(s => s.result === 'sunk').map(s => s.ship.id);

/** Small seeded random numbers (mulberry32), so a test or a ?seed= game plays the same every time. */
export function seededRandom(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

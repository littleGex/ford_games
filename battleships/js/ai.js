// The computer's aim. It only ever looks at its own shots and what they found (miss, hit, sunk with the wreck),
// the same as a person would, never at your fleet. It keeps nothing between turns, so a saved game carries on
// with the same computer.
//
// - Easy fires at random, and only sometimes goes after a ship it has hit.
// - Normal fires at random until it hits something, then works along the line until the ship sinks. It knows
//   ships never touch, so it skips the water around a wreck and the corners of a hit.
// - Hard counts, for every square, how many ways the ships still afloat could lie across it, given everything it
//   has seen, and fires where that's highest. Placements across a hit count far more, so it finishes ships off.
import { SIZE, FLEET, inBounds, cells } from './rules.js';

const UNKNOWN = 0, MISS = 1, HIT = 2, SUNK = 3, EMPTY = 4;   // EMPTY: not shot, but no ship can be there
const at = (x, y) => y * SIZE + x;

/** The grid as this shooter knows it, and the lengths of the ships still afloat. */
export function knowledge(shots) {
  const grid = new Array(SIZE * SIZE).fill(UNKNOWN);
  const empty = (x, y) => { if (inBounds(x, y) && grid[at(x, y)] === UNKNOWN) grid[at(x, y)] = EMPTY; };
  for (const s of shots) grid[at(s.x, s.y)] = s.result === 'miss' ? MISS : HIT;
  const afloat = FLEET.map(s => s.id);
  for (const s of shots.filter(s => s.result === 'sunk')) {
    afloat.splice(afloat.indexOf(s.ship.id), 1);
    for (const [x, y] of cells(s.ship)) grid[at(x, y)] = SUNK;
    for (const [x, y] of cells(s.ship)) for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) empty(x + dx, y + dy);
  }
  // a ship is a straight line and never touches another, so the corners of a hit are always water
  for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) {
    if (grid[at(x, y)] !== HIT) continue;
    for (const [dx, dy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) empty(x + dx, y + dy);
  }
  return { grid, afloat: afloat.map(id => FLEET.find(s => s.id === id).len) };
}

const pick = (list, rng) => list[Math.floor(rng() * list.length)];
const squares = test => { const out = []; for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) if (test(x, y)) out.push([x, y]); return out; };
const ORTHO = [[1, 0], [-1, 0], [0, 1], [0, -1]];

function easy(grid, rng) {
  const open = (x, y) => inBounds(x, y) && (grid[at(x, y)] === UNKNOWN || grid[at(x, y)] === EMPTY);
  const hits = squares((x, y) => grid[at(x, y)] === HIT);
  if (hits.length && rng() < 0.5) {
    const [hx, hy] = pick(hits, rng);
    const next = ORTHO.map(([dx, dy]) => [hx + dx, hy + dy]).filter(([x, y]) => open(x, y));
    if (next.length) return pick(next, rng);
  }
  return pick(squares(open), rng);
}

function normal(grid, rng) {
  const open = (x, y) => inBounds(x, y) && grid[at(x, y)] === UNKNOWN;
  const hits = squares((x, y) => grid[at(x, y)] === HIT);
  if (hits.length) {
    // two or more hits in a row: carry on at either end of the line
    for (const [hx, hy] of hits) {
      for (const [dx, dy] of [[1, 0], [0, 1]]) {
        if (!inBounds(hx + dx, hy + dy) || grid[at(hx + dx, hy + dy)] !== HIT) continue;
        let [ax, ay] = [hx, hy], [bx, by] = [hx, hy];
        while (inBounds(ax - dx, ay - dy) && grid[at(ax - dx, ay - dy)] === HIT) { ax -= dx; ay -= dy; }
        while (inBounds(bx + dx, by + dy) && grid[at(bx + dx, by + dy)] === HIT) { bx += dx; by += dy; }
        const ends = [[ax - dx, ay - dy], [bx + dx, by + dy]].filter(([x, y]) => open(x, y));
        if (ends.length) return pick(ends, rng);
      }
    }
    const next = hits.flatMap(([hx, hy]) => ORTHO.map(([dx, dy]) => [hx + dx, hy + dy])).filter(([x, y]) => open(x, y));
    if (next.length) return pick(next, rng);
  }
  return pick(squares(open), rng);
}

function hard(grid, afloat, rng) {
  const score = new Array(SIZE * SIZE).fill(0);
  const anyHits = grid.includes(HIT);
  for (const len of afloat) {
    for (const dir of ['h', 'v']) {
      for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) {
        const sq = [];
        for (let i = 0; i < len; i++) sq.push(dir === 'h' ? [x + i, y] : [x, y + i]);
        if (!sq.every(([cx, cy]) => inBounds(cx, cy) && (grid[at(cx, cy)] === UNKNOWN || grid[at(cx, cy)] === HIT))) continue;
        // a hit next to the ship (and not part of it) would be another ship touching this one: can't be
        const mine = new Set(sq.map(([cx, cy]) => at(cx, cy)));
        let clash = false, covered = 0;
        for (const [cx, cy] of sq) {
          if (grid[at(cx, cy)] === HIT) covered++;
          for (const [dx, dy] of ORTHO) {
            const nx = cx + dx, ny = cy + dy;
            if (inBounds(nx, ny) && grid[at(nx, ny)] === HIT && !mine.has(at(nx, ny))) clash = true;
          }
        }
        if (clash) continue;
        if (anyHits && !covered) continue;   // finish off what's been hit before looking anywhere new
        const weight = covered ? 20 ** covered : 1;
        for (const [cx, cy] of sq) if (grid[at(cx, cy)] === UNKNOWN) score[at(cx, cy)] += weight;
      }
    }
  }
  const best = Math.max(...score);
  if (best <= 0) return normal(grid, rng);
  return pick(squares((x, y) => score[at(x, y)] === best), rng);
}

/** Where the computer fires next: [x, y], a square it hasn't fired at yet. */
export function chooseShot(level, shots, rng = Math.random) {
  const { grid, afloat } = knowledge(shots);
  if (level === 'easy') return easy(grid, rng);
  if (level === 'hard') return hard(grid, afloat, rng);
  return normal(grid, rng);
}

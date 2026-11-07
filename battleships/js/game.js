// One game of Battleships as plain data: who's playing, their fleets, the shots, whose turn it is. No page and no
// three.js, so it's saved as JSON as it is, and the play-through test runs it in Node.
//
// state = {
//   v: 1, mode: 'cpu' | 'local', level: 'easy' | 'normal' | 'hard' (vs the computer),
//   variant: 'classic' (one shot a turn) | 'salvo' (a shot for each of your ships still afloat; older saves have none),
//   phase: 'placing' | 'playing' | 'over', turn: 0 | 1 (who's placing, or whose shot it is),
//   players: [{ name, fleet }, { name, fleet }],      fleet is null until that player is ready
//   shots: [[...], [...]],                            shots[i] are the shots player i fired, at the other fleet
//   winner: null | 0 | 1,
// }
// Player 1 (index 0) always goes first. Against the computer, the computer is player 2 and places its fleet at once.
import { validFleet, resolveShot, allSunk, inBounds, randomFleet, FLEET, SIZE } from './rules.js';

export function newGame({ mode = 'cpu', level = 'normal', variant = 'classic', names = [], rng = Math.random } = {}) {
  const cpu = mode === 'cpu';
  return {
    v: 1, mode, level: cpu ? level : null, variant: variant === 'salvo' ? 'salvo' : 'classic', phase: 'placing', turn: 0,
    players: [
      { name: (cpu ? 'You' : names[0]) || 'Player 1', fleet: null },
      { name: cpu ? 'Computer' : names[1] || 'Player 2', fleet: cpu ? randomFleet(rng) : null },
    ],
    shots: [[], []],
    winner: null,
  };
}

export const other = i => 1 - i;
export const isComputer = (state, i) => state.mode === 'cpu' && i === 1;

/** Player i is happy with their fleet. Returns false if the fleet isn't allowed. */
export function place(state, i, fleet) {
  if (state.phase !== 'placing' || state.turn !== i || !validFleet(fleet)) return false;
  state.players[i].fleet = fleet.map(s => ({ ...s }));
  const waiting = state.players.findIndex(p => !p.fleet);
  if (waiting === -1) { state.phase = 'playing'; state.turn = 0; } else state.turn = waiting;
  return true;
}

/** Has the player whose turn it is already fired at (x, y)? */
export const fired = (state, i, x, y) => state.shots[i].some(s => s.x === x && s.y === y);

export function canFire(state, x, y) {
  return state.phase === 'playing' && Number.isInteger(x) && Number.isInteger(y) && inBounds(x, y) && !fired(state, state.turn, x, y);
}

/** The player whose turn it is fires at (x, y). Returns the shot ({ x, y, result, ship? }), or null if it can't. */
export function fire(state, x, y) {
  if (!canFire(state, x, y)) return null;
  const me = state.turn, them = other(me);
  const shot = resolveShot(state.players[them].fleet, state.shots[me], x, y);
  state.shots[me].push(shot);
  if (allSunk(state.shots[me])) { state.phase = 'over'; state.winner = me; } else state.turn = them;
  return shot;
}

export const isSalvo = state => state.variant === 'salvo';

/**
 * How many shots player i fires this turn: one, or in a salvo one for each of their ships still afloat (never more
 * than the squares they have left to fire at).
 */
export function shotsPerTurn(state, i) {
  if (!isSalvo(state)) return 1;
  const lost = state.shots[other(i)].filter(s => s.result === 'sunk').length;
  return Math.min(FLEET.length - lost, SIZE * SIZE - state.shots[i].length);
}

/**
 * The player whose turn it is fires a whole salvo: `squares` is [[x, y], ...], exactly shotsPerTurn of them, all
 * different and not fired at before. They land in order; once the last ship sinks the rest don't count. Returns the
 * shots that landed, or null if the salvo isn't allowed.
 */
export function fireSalvo(state, squares) {
  const me = state.turn, them = other(me);
  if (state.phase !== 'playing' || !Array.isArray(squares) || squares.length !== shotsPerTurn(state, me)) return null;
  const keys = squares.map(sq => Array.isArray(sq) && `${sq[0]},${sq[1]}`);
  if (new Set(keys).size !== keys.length || !squares.every(([x, y]) => canFire(state, x, y))) return null;
  const landed = [];
  for (const [x, y] of squares) {
    const shot = resolveShot(state.players[them].fleet, state.shots[me], x, y);
    state.shots[me].push(shot);
    landed.push(shot);
    if (allSunk(state.shots[me])) { state.phase = 'over'; state.winner = me; return landed; }
  }
  state.turn = them;
  return landed;
}

/** A saved game that still makes sense (an old or broken save is thrown away rather than half loaded). */
export function validState(s) {
  if (!s || s.v !== 1 || !['cpu', 'local'].includes(s.mode) || !['placing', 'playing', 'over'].includes(s.phase)) return false;
  if (s.variant !== undefined && s.variant !== 'classic' && s.variant !== 'salvo') return false;
  if (!Array.isArray(s.players) || s.players.length !== 2 || !Array.isArray(s.shots) || s.shots.length !== 2) return false;
  if (s.phase !== 'placing' && !s.players.every(p => p.fleet && validFleet(p.fleet))) return false;
  return s.turn === 0 || s.turn === 1;
}

/** How a player's shooting went: shots fired, hits (sinking shots included). */
export function tally(state, i) {
  const shots = state.shots[i];
  return { shots: shots.length, hits: shots.filter(s => s.result !== 'miss').length };
}

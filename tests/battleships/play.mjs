// Battleships rules and computer players, checked over many seeded games:  node tests/battleships/play.mjs
// (Runs plain Node, no browser.)
import { FLEET, SIZE, cells, fits, validFleet, randomFleet, resolveShot, seededRandom } from '../../battleships/js/rules.js';
import { chooseShot, chooseSalvo, knowledge } from '../../battleships/js/ai.js';
import { newGame, place, fire, canFire, validState, fireSalvo, shotsPerTurn } from '../../battleships/js/game.js';

const fail = [];
const check = (ok, msg) => { if (!ok) fail.push(msg); };

// --- placing
const rng = seededRandom(1);
for (let i = 0; i < 500; i++) check(validFleet(randomFleet(rng)), `random fleet ${i} isn't allowed`);
const fleet = [
  { id: 'carrier', x: 0, y: 0, dir: 'h' }, { id: 'battleship', x: 0, y: 2, dir: 'h' },
  { id: 'cruiser', x: 0, y: 4, dir: 'h' }, { id: 'submarine', x: 0, y: 6, dir: 'h' }, { id: 'destroyer', x: 0, y: 8, dir: 'h' },
];
check(validFleet(fleet), 'a fleet one row apart is allowed');
check(!fits(fleet, { id: 'destroyer', x: 5, y: 1, dir: 'h' }), 'a ship touching another at the corner is refused');
check(!fits(fleet, { id: 'destroyer', x: 9, y: 9, dir: 'h' }), 'a ship off the edge is refused');
check(fits(fleet, { id: 'destroyer', x: 8, y: 9, dir: 'h' }), 'the destroyer fits in the bottom corner');
check(!validFleet(fleet.slice(1)), 'a fleet with a ship missing is refused');
check(!validFleet([...fleet.slice(0, 4), { id: 'destroyer', x: 0, y: 1, dir: 'h' }]), 'touching ships make a fleet invalid');

// --- firing
check(resolveShot(fleet, [], 9, 9).result === 'miss', 'open water is a miss');
check(resolveShot(fleet, [], 0, 8).result === 'hit', 'the first shot at the destroyer is a hit');
const sunk = resolveShot(fleet, [{ x: 0, y: 8, result: 'hit' }], 1, 8);
check(sunk.result === 'sunk' && sunk.ship.id === 'destroyer' && sunk.ship.x === 0, 'the second shot sinks the destroyer and says where it was');

// --- knowledge: the water round a wreck and the corners of a hit are known to be empty
const k = knowledge([sunk, { x: 5, y: 5, result: 'hit' }]);
check(k.grid[9 * SIZE + 2] === 4 && k.grid[7 * SIZE + 0] === 4, 'the squares round a wreck are known empty');
check(k.grid[4 * SIZE + 4] === 4 && k.grid[4 * SIZE + 5] === 0, 'a hit\'s corners are empty, its sides are not');
check(k.afloat.length === 4, 'four ships afloat after the destroyer sinks');

// --- whole games, computer against a random fleet
function playOut(level, seed) {
  const r = seededRandom(seed), target = randomFleet(r), shots = [];
  while (shots.filter(s => s.result === 'sunk').length < FLEET.length) {
    const [x, y] = chooseShot(level, shots, r);
    if (shots.some(s => s.x === x && s.y === y)) { fail.push(`${level} seed ${seed}: fired at ${x},${y} twice`); return 999; }
    const shot = resolveShot(target, shots, x, y);
    // never at a square that can't hold a ship (Normal and Hard know better)
    if (level !== 'easy') {
      const known = knowledge(shots).grid[y * SIZE + x];
      if (known !== 0) { fail.push(`${level} seed ${seed}: fired at a square it knew was empty`); return 999; }
    }
    shots.push(shot);
    if (shots.length > SIZE * SIZE) { fail.push(`${level} seed ${seed}: more than 100 shots`); return 999; }
  }
  return shots.length;
}
const average = {};
for (const level of ['easy', 'normal', 'hard']) {
  const runs = Array.from({ length: 200 }, (_, i) => playOut(level, 1000 + i));
  average[level] = runs.reduce((a, b) => a + b, 0) / runs.length;
}
check(average.normal < average.easy - 10, `normal (${average.normal}) should beat easy (${average.easy}) clearly`);
check(average.hard < average.normal - 3, `hard (${average.hard}) should beat normal (${average.normal})`);
check(average.hard < 50, `hard takes ${average.hard} shots on average, want under 50`);

// --- normal finishes off a ship it has hit: the next shot is next to the hit
{
  const r = seededRandom(5);
  for (let i = 0; i < 50; i++) {
    const [x, y] = chooseShot('normal', [{ x: 4, y: 4, result: 'hit' }], r);
    check(Math.abs(x - 4) + Math.abs(y - 4) === 1, `normal fired at ${x},${y} after a hit at 4,4`);
  }
  const [x, y] = chooseShot('hard', [{ x: 4, y: 4, result: 'hit' }, { x: 5, y: 4, result: 'hit' }], r);
  check(y === 4 && (x === 3 || x === 6), `hard should carry on along a line of two hits, fired at ${x},${y}`);
}

// --- a game: placing, turns, a win, a save that loads back
{
  const g = newGame({ mode: 'local', names: ['P', 'Dude'] });
  check(g.phase === 'placing' && g.turn === 0, 'a two-player game starts with player 1 placing');
  check(!place(g, 1, fleet), 'player 2 can\'t place out of turn');
  check(place(g, 0, fleet) && g.turn === 1, 'player 1 places, then player 2');
  check(place(g, 1, fleet) && g.phase === 'playing' && g.turn === 0, 'both placed: player 1 fires first');
  const water = [];
  for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) if (!fleet.some(s => cells(s).some(([cx, cy]) => cx === x && cy === y))) water.push([x, y]);
  const targets = fleet.flatMap(cells);
  for (let i = 0; i < targets.length; i++) {
    check(fire(g, ...targets[i]) !== null, `player 1's shot ${i}`);
    if (g.phase === 'over') break;
    check(!canFire(g, ...targets[i]) || g.turn === 1, 'the turn passes');
    fire(g, ...water[i]);
  }
  check(g.phase === 'over' && g.winner === 0, 'player 1 sinks everything and wins');
  check(fire(g, 0, 9) === null, 'no firing after the game is over');
  check(validState(JSON.parse(JSON.stringify(g))), 'the game saves and loads as JSON');
  const cpu = newGame({ mode: 'cpu', rng: seededRandom(3) });
  check(cpu.players[1].fleet && validFleet(cpu.players[1].fleet), 'the computer places its fleet straight away');
}

// --- Salvo: a shot for each ship still afloat
{
  const g = newGame({ mode: 'local', variant: 'salvo', names: ['P', 'Dude'] });
  place(g, 0, fleet); place(g, 1, fleet);
  check(g.variant === 'salvo' && shotsPerTurn(g, 0) === 5, 'a salvo starts at five shots');
  check(fireSalvo(g, [[9, 9], [9, 8], [9, 7], [9, 6]]) === null, 'four shots isn\'t a salvo of five');
  check(fireSalvo(g, [[9, 9], [9, 9], [9, 7], [9, 6], [9, 5]]) === null, 'the same square twice isn\'t allowed');
  check(fireSalvo(g, [[9, 9], [9, 8], [9, 7], [9, 6], [10, 5]]) === null, 'nor a square off the board');
  const g2 = newGame({ mode: 'local', variant: 'salvo', names: ['P', 'Dude'] });
  place(g2, 0, fleet); place(g2, 1, fleet);
  const first = fireSalvo(g2, [[0, 8], [1, 8], [9, 9], [9, 8], [9, 7]]);
  check(first && first.length === 5 && first[1].result === 'sunk' && g2.turn === 1, 'a salvo lands in order (the destroyer sinks on its second shot) and the turn passes');
  check(shotsPerTurn(g2, 1) === 4 && shotsPerTurn(g2, 0) === 5, 'Dude lost a ship: four shots now, P still five');
  check(fireSalvo(g2, [[9, 9], [9, 8], [9, 7], [9, 6], [9, 5]]) === null, 'five is too many for Dude now');
  check(fireSalvo(g2, [[9, 9], [9, 8], [9, 7], [9, 6]]).length === 4 && g2.turn === 0, 'Dude fires four');
  check(validState(JSON.parse(JSON.stringify(g2))), 'a salvo game saves and loads');
  check(validState({ ...JSON.parse(JSON.stringify(g2)), variant: undefined }), 'an older save without a variant still loads (as classic)');
  check(!validState({ ...JSON.parse(JSON.stringify(g2)), variant: 'blitz' }), 'a made-up variant doesn\'t');
  check(shotsPerTurn(newGame({ mode: 'cpu' }), 0) === 1, 'classic is one shot a turn');

  // the last ship sinks part-way through a salvo: the rest don't count, and that player wins
  const g3 = newGame({ mode: 'local', variant: 'salvo' });
  place(g3, 0, fleet); place(g3, 1, fleet);
  const all = fleet.flatMap(cells), last = all.pop();
  for (const [x, y] of all) g3.shots[0].push(resolveShot(fleet, g3.shots[0], x, y));
  const end = fireSalvo(g3, [[9, 9], last, [9, 8], [9, 7], [9, 6]]);
  check(end.length === 2 && g3.phase === 'over' && g3.winner === 0, 'the game ends on the sinking shot');
}

// --- the computer's salvos: all different, never a square fired at before, and Hard still the best
function salvoGame(level, seed) {
  const r = seededRandom(seed), target = randomFleet(r), shots = [];
  let turns = 0;
  while (shots.filter(s => s.result === 'sunk').length < FLEET.length && turns < 100) {
    turns++;
    const k = Math.min(5, SIZE * SIZE - shots.length);
    const salvo = chooseSalvo(level, shots, k, r);
    const keys = salvo.map(([x, y]) => `${x},${y}`);
    if (salvo.length !== k || new Set(keys).size !== k || salvo.some(([x, y]) => shots.some(s => s.x === x && s.y === y))) {
      fail.push(`${level} seed ${seed}: a bad salvo ${keys.join(' ')}`); return 999;
    }
    for (const [x, y] of salvo) {
      shots.push(resolveShot(target, shots, x, y));
      if (shots.filter(s => s.result === 'sunk').length === FLEET.length) break;
    }
  }
  return turns;
}
const salvoTurns = {};
for (const level of ['easy', 'normal', 'hard']) {
  const runs = Array.from({ length: 100 }, (_, i) => salvoGame(level, 2000 + i));
  salvoTurns[level] = runs.reduce((a, b) => a + b, 0) / runs.length;
}
check(salvoTurns.normal < salvoTurns.easy && salvoTurns.hard <= salvoTurns.normal, `salvo turns should go easy > normal >= hard: ${JSON.stringify(salvoTurns)}`);
console.log(`Average salvos to sink the fleet: easy ${salvoTurns.easy.toFixed(1)}, normal ${salvoTurns.normal.toFixed(1)}, hard ${salvoTurns.hard.toFixed(1)}`);

console.log(`Average shots to sink the fleet: easy ${average.easy.toFixed(1)}, normal ${average.normal.toFixed(1)}, hard ${average.hard.toFixed(1)}`);
if (fail.length) { console.error(`${fail.length} problem(s):\n- ` + [...new Set(fail)].slice(0, 30).join('\n- ')); process.exit(1); }
console.log('Battleships rules and computer players: all good');

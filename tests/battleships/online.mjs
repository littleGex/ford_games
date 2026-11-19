// Games on two devices, without a network: the room as the database keeps it, what each side makes of it, and the
// check at the end that catches a wrong answer.  node tests/battleships/online.mjs
import { webcrypto } from 'node:crypto';
import { randomFleet, resolveShot, cells, seededRandom } from '../../battleships/js/rules.js';
import { view, check, fleetHash, fleetString, parseFleet, newSalt, newCode, CODE_RE, whoseTurn, shotsAllowed, roomVariant, stale, DAY } from '../../battleships/js/net/online.js';

// browsers (and Node 20+) have crypto built in; CI's Node 18 needs it handed over
if (!globalThis.crypto) globalThis.crypto = webcrypto;

const fail = [];
const check_ = (ok, msg) => { if (!ok) fail.push(msg); };

const rng = seededRandom(11);
for (let i = 0; i < 200; i++) check_(CODE_RE.test(newCode(rng)), 'codes use only the allowed letters');
const fleetA = randomFleet(rng), fleetB = randomFleet(rng);
check_(fleetString(parseFleet(fleetString(fleetA))) === fleetString(fleetA), 'a fleet goes to text and back');
check_(parseFleet('carrier:0,0,h') === null, 'half a fleet isn\'t a fleet');
const saltA = newSalt(), saltB = newSalt();
check_(/^[0-9a-f]{32}$/.test(saltA), 'a salt is 32 hex digits');
const hashA = await fleetHash(fleetA, saltA), hashB = await fleetHash(fleetB, saltB);
check_(/^[0-9a-f]{64}$/.test(hashA) && hashA !== await fleetHash(fleetA, saltB), 'the fingerprint depends on the fleet and the salt');

// --- a room filling up
const room = { created: 1, n: 0, a: { uid: 'u1', name: 'P' } };
check_(view(room, 'a').phase === 'waiting', 'alone in a room: waiting');
room.b = { uid: 'u2', name: 'Dude' };
check_(view(room, 'b').phase === 'placing' && view(room, 'b').names.join() === 'Dude,P', 'two in a room: placing, names from each side');
room.a.hash = hashA; room.b.hash = hashB;
check_(view(room, 'a').phase === 'playing' && view(room, 'a').myTurn && !view(room, 'b').myTurn, 'both placed: a goes first');

// --- play a whole game: each side answers honestly from its own fleet
const fleets = { a: fleetA, b: fleetB }, targets = { a: fleetB.flatMap(cells), b: [] };
for (let y = 0; y < 10; y++) for (let x = 0; x < 10; x++) targets.b.push([x, y]);
room.shots = {}; room.results = {};
let guard = 0;
while (!view(room, 'a').winner && guard++ < 300) {
  const by = whoseTurn(room), [x, y] = targets[by].shift();
  check_(by === (room.n % 2 === 0 ? 'a' : 'b'), `classic: turns alternate as before (shot ${room.n})`);
  room.shots[room.n] = { by, x, y };
  room.n++;
  check_(view(room, by).pending.length === 1 && view(room, by).pending[0].n === room.n - 1 && !view(room, by).myTurn && whoseTurn(room) === null, 'a shot waits for its answer');
  const defender = by === 'a' ? 'b' : 'a';
  const theirShots = view(room, defender).shots[1];
  const answer = resolveShot(fleets[defender], theirShots, x, y);
  room.results[room.n - 1] = answer.result === 'sunk' ? { r: 'sunk', ship: answer.ship } : { r: answer.result };
}
check_(view(room, 'a').winner === 'me' && view(room, 'b').winner === 'them' && view(room, 'b').phase === 'over', 'a sinks everything and wins, seen from both sides');
check_(view(room, 'a').shots[0].length === 17, `a took 17 shots, took ${view(room, 'a').shots[0].length}`);

// --- the REST API can hand a list back instead of an object: same answer
const asList = { ...room, shots: Object.values(room.shots), results: Object.values(room.results) };
check_(JSON.stringify(view(asList, 'b')) === JSON.stringify(view(room, 'b')), 'lists and objects read the same');

// --- the check at the end
room.reveal = { a: { fleet: fleetString(fleetA), salt: saltA }, b: { fleet: fleetString(fleetB), salt: saltB } };
const honest = await check(room, 'a');
check_(honest.ok, `honest answers pass the check (${honest.why})`);
check_((await check(room, 'b')).ok, 'and from the other side');
const lied = JSON.parse(JSON.stringify(room));
const firstHit = Object.keys(lied.results).find(k => lied.shots[k].by === 'a' && lied.results[k].r === 'hit');
lied.results[firstHit] = { r: 'miss' };
const caught = await check(lied, 'a');
check_(!caught.ok && /answer to your shot/.test(caught.why), 'a hit answered as a miss is caught');
const swapped = JSON.parse(JSON.stringify(room));
swapped.reveal.b.fleet = fleetString(randomFleet(rng));
check_(!(await check(swapped, 'a')).ok, 'a different fleet at the end is caught');
check_((await check({ ...room, reveal: {} }, 'a')).waiting, 'no fleet yet: still waiting');

// --- resigning: the other player wins, at any stage, and no shot is left waiting
const mid = JSON.parse(JSON.stringify({ created: 1, n: 3, a: { uid: 'u1', name: 'P', hash: hashA }, b: { uid: 'u2', name: 'Dude', hash: hashB },
  shots: { 0: { by: 'a', x: 0, y: 0 }, 1: { by: 'b', x: 0, y: 0 }, 2: { by: 'a', x: 1, y: 1 } }, results: { 0: { r: 'miss' }, 1: { r: 'miss' } } }));
check_(view(mid, 'a').pending && view(mid, 'a').phase === 'playing', 'mid-game, a shot waiting');
mid.resigned = 'b';
check_(view(mid, 'a').phase === 'over' && view(mid, 'a').winner === 'me' && view(mid, 'a').resigned === 'them', 'Dude resigns: P wins, seen by P');
check_(view(mid, 'b').winner === 'them' && view(mid, 'b').resigned === 'me', 'and seen by Dude');
check_(view(mid, 'a').pending.length === 0 && !view(mid, 'a').myTurn, 'no shot left waiting once someone resigned');
const placing = { created: 1, n: 0, a: { uid: 'u1', name: 'P', hash: hashA }, b: { uid: 'u2', name: 'Dude' }, resigned: 'a' };
check_(view(placing, 'b').phase === 'over' && view(placing, 'b').winner === 'me', 'resigning while placing ends it too');
check_(view({ ...placing, b: undefined }, 'a').phase === 'waiting', 'nobody to resign to: still waiting');
check_(view({ ...room, resigned: 'a' }, 'a').winner === 'me' && view({ ...room, resigned: 'a' }, 'a').resigned === null, 'a resign after the last ship sank doesn\'t change the winner');
const resignedEarly = { ...placing, created: 0, reveal: { a: { fleet: fleetString(fleetA), salt: saltA } }, b: { ...placing.b, seen: 2 * DAY - 60000 } };
check_(stale(resignedEarly, 2 * DAY), 'a game resigned before Dude placed is finished once P\'s fleet is revealed (Dude has none)');
check_(!stale({ ...resignedEarly, reveal: {} }, 2 * DAY), 'but not before, while someone was there today');

// --- the rematch: the new code, from either side
check_(view(room, 'a').next === null, 'no rematch yet');
check_(view({ ...room, next: 'X7QM' }, 'b').next === 'X7QM', 'the rematch code is there for both');

// --- old rooms: tidied away only once over a day old and nobody is playing in them
const T = 1e12, HOUR = 60 * 60 * 1000;
const finished = { ...room, created: T };
check_(!stale(finished, T + 23 * HOUR), 'a finished room less than a day old stays');
check_(stale(finished, T + 25 * HOUR), 'a finished room over a day old goes');
const halfRevealed = { ...finished, reveal: { a: finished.reveal.a }, b: { ...finished.b, seen: T + 20 * HOUR } };
check_(!stale(halfRevealed, T + 25 * HOUR), 'a finished room still waiting for a fleet to be revealed stays while someone was there today');
check_(stale(halfRevealed, T + 45 * HOUR), 'and goes once nobody has been there for a day');
const lonely = { created: T, n: 0, a: { uid: 'u1', name: 'P', seen: T } };
check_(stale(lonely, T + DAY + HOUR), 'a room nobody joined goes after a day');
const slow = { created: T, n: 4, a: { uid: 'u1', name: 'P', seen: T + 30 * HOUR }, b: { uid: 'u2', name: 'Dude', seen: T + 2 * HOUR } };
check_(!stale(slow, T + 31 * HOUR), 'a slow game someone played in today stays');
check_(stale(slow, T + 55 * HOUR), 'and goes once nobody has been there for a day');
check_(!stale(null, T) && !stale({ ...lonely }, T + 10 * HOUR), 'nothing to tidy: a missing or new room');

// --- Salvo (#178): a turn is a group of shots, answered as a whole
check_(roomVariant({}) === 'classic' && roomVariant({ variant: 'nope' }) === 'classic' && roomVariant({ variant: 'salvo' }) === 'salvo', 'variant: classic unless the room says salvo');
check_(view(room, 'a').variant === 'classic' && view(room, 'a').pending.length === 0, 'an old room reads as classic, nothing pending');
{
  const sr = { created: 1, variant: 'salvo', n: 0, a: { uid: 'u1', name: 'P', hash: hashA }, b: { uid: 'u2', name: 'Dude', hash: hashB }, shots: {}, results: {} };
  check_(whoseTurn(sr) === 'a' && shotsAllowed(sr, 'a') === 5 && shotsAllowed(sr, 'b') === 5, 'salvo: a first, 5 shots each');
  for (let i = 0; i < 3; i++) sr.shots[i] = { by: 'a', x: i, y: 9 };
  sr.n = 3; sr.results[0] = { r: 'miss' }; sr.results[1] = { r: 'miss' };
  check_(whoseTurn(sr) === null && view(sr, 'b').pending.map(s => s.n).join() === '2' && !view(sr, 'b').myTurn && !view(sr, 'a').myTurn, 'salvo: one shell unanswered, nobody\'s turn');
  sr.results[2] = { r: 'miss' };
  check_(whoseTurn(sr) === 'b' && view(sr, 'b').myTurn && view(sr, 'b').pending.length === 0, 'salvo answered: b\'s turn');
  sr.sunk = { a: { destroyer: true, cruiser: true, rowboat: true } };
  check_(shotsAllowed(sr, 'a') === 3 && shotsAllowed(sr, 'b') === 5, 'two of a\'s ships sunk: 3 shots (an unknown id doesn\'t count)');
  check_(shotsAllowed(room, 'a') === 1, 'classic: always 1');
}
{ // a whole salvo game, honest answers in shot order; the check passes
  const g = { created: 1, variant: 'salvo', n: 0, a: { uid: 'u1', name: 'P', hash: hashA }, b: { uid: 'u2', name: 'Dude', hash: hashB }, shots: {}, results: {}, sunk: {} };
  const aims = { a: fleetB.flatMap(cells), b: [] };
  for (let y = 0; y < 10; y++) for (let x = 0; x < 10; x++) aims.b.push([x, y]);
  let turns = 0;
  while (!view(g, 'a').winner && turns++ < 100) {
    const by = whoseTurn(g), def = by === 'a' ? 'b' : 'a', k = shotsAllowed(g, by), first = g.n;
    for (let i = 0; i < k; i++) { const [x, y] = aims[by].shift(); g.shots[g.n++] = { by, x, y }; }
    const theirs = view(g, def).shots[1].slice();
    for (let s = first; s < g.n; s++) {
      const ans = resolveShot(fleets[def], theirs, g.shots[s].x, g.shots[s].y);
      theirs.push(ans);
      g.results[s] = ans.result === 'sunk' ? { r: 'sunk', ship: ans.ship } : { r: ans.result };
      if (ans.result === 'sunk') (g.sunk[def] ||= {})[ans.ship.id] = true;
    }
  }
  check_(view(g, 'a').winner === 'me' && view(g, 'b').phase === 'over', `salvo game: a wins (${turns} turns)`);
  g.reveal = { a: { fleet: fleetString(fleetA), salt: saltA }, b: { fleet: fleetString(fleetB), salt: saltB } };
  const ok = await check(g, 'a');
  check_(ok.ok, `salvo game: honest answers pass the check (${ok.why})`);
}
{ // the last ship sinks with the first shell of a salvo: over for both, the rest answered as misses
  const e = { created: 1, variant: 'salvo', n: 0, a: { uid: 'u1', name: 'P', hash: hashA }, b: { uid: 'u2', name: 'Dude', hash: hashB }, shots: {}, results: {} };
  const theirs = [];
  for (const [x, y] of fleetB.flatMap(cells)) { const ans = resolveShot(fleetB, theirs, x, y); theirs.push(ans); e.shots[e.n] = { by: 'a', x, y }; e.results[e.n++] = ans.result === 'sunk' ? { r: 'sunk', ship: ans.ship } : { r: ans.result }; }
  e.shots[e.n] = { by: 'a', x: 9, y: 9 }; e.results[e.n++] = { r: 'miss' };
  check_(view(e, 'a').winner === 'me' && view(e, 'b').winner === 'them' && view(e, 'a').phase === 'over' && view(e, 'b').pending.length === 0, 'last ship sunk mid-salvo: over for both');
}

if (fail.length) { console.error(`${fail.length} problem(s):\n- ` + [...new Set(fail)].join('\n- ')); process.exit(1); }
console.log('Battleships on two devices: all good');

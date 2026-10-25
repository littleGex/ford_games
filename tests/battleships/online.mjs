// Games on two devices, without a network: the room as the database keeps it, what each side makes of it, and the
// check at the end that catches a wrong answer.  node tests/battleships/online.mjs
import { randomFleet, resolveShot, cells, seededRandom } from '../../battleships/js/rules.js';
import { view, check, fleetHash, fleetString, parseFleet, newSalt, newCode, CODE_RE, shooter } from '../../battleships/js/net/online.js';

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
  const by = shooter(room.n), [x, y] = targets[by].shift();
  room.shots[room.n] = { by, x, y };
  room.n++;
  check_(view(room, by).pending && !view(room, by).myTurn, 'a shot waits for its answer');
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

if (fail.length) { console.error(`${fail.length} problem(s):\n- ` + [...new Set(fail)].join('\n- ')); process.exit(1); }
console.log('Battleships on two devices: all good');

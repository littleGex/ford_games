// The security rules (battleships/database.rules.json) checked against the real database: three throwaway
// anonymous players try what's allowed and what isn't. Run by hand after changing the rules in the console:
//   node tests/battleships/rules-live.mjs
// It leaves one test room behind (anyone may delete a room once it's a day old; or delete it in the console).
import { CONFIG } from '../../battleships/js/net/firebase.js';
import { newCode } from '../../battleships/js/net/online.js';

const NOW = { '.sv': 'timestamp' };
const fail = [];
let passed = 0;

async function signUp() {
  const r = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${CONFIG.apiKey}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ returnSecureToken: true }),
  }).then(res => res.json());
  if (!r.idToken) throw new Error(`couldn't sign in: ${JSON.stringify(r)}`);
  return { uid: r.localId, token: r.idToken };
}
async function call(who, method, path, body, query = '') {
  const auth = who ? `auth=${who.token}&` : '';
  const res = await fetch(`${CONFIG.dbUrl}/${path}.json?${auth}${query}`, {
    method, headers: { 'Content-Type': 'application/json' }, body: body === undefined ? undefined : JSON.stringify(body),
  });
  return res.status;
}
async function expectOk(what, ...args) { const s = await call(...args); if (s === 200) passed++; else fail.push(`${what}: wanted it allowed, got ${s}`); }
async function expectNo(what, ...args) { const s = await call(...args); if (s === 401 || s === 403) passed++; else fail.push(`${what}: wanted it refused, got ${s}`); }

const [a, b, c] = [await signUp(), await signUp(), await signUp()];
const code = newCode(), room = `rooms/${code}`;
const hash = ch => ch.repeat(64);

await expectNo('read without signing in', null, 'GET', room);
await expectNo('list every room', a, 'GET', 'rooms');
await expectNo('write outside rooms', a, 'PUT', 'other', 1);
await expectNo('a room with a bad code', a, 'PUT', 'rooms/ab1o', { created: NOW, n: 0, a: { uid: a.uid, name: 'P' } });
await expectNo('a room with a made-up time', a, 'PUT', room, { created: 123, n: 0, a: { uid: a.uid, name: 'P' } });
await expectNo('a room in someone else\'s name', a, 'PUT', room, { created: NOW, n: 0, a: { uid: b.uid, name: 'P' } });
await expectNo('a room with extra things in it', a, 'PUT', room, { created: NOW, n: 0, a: { uid: a.uid, name: 'P' }, extra: 1 });
await expectOk('start a room', a, 'PUT', room, { created: NOW, n: 0, a: { uid: a.uid, name: 'P', seen: NOW } });
await expectNo('start the same room again', b, 'PUT', room, { created: NOW, n: 0, a: { uid: b.uid, name: 'Dude' } });
await expectOk('anyone signed in can read a room by its code', c, 'GET', room);
await expectNo('the starter takes the second seat too', a, 'PUT', `${room}/b`, { uid: a.uid, name: 'P2' });
await expectNo('a name that\'s too long', b, 'PUT', `${room}/b`, { uid: b.uid, name: 'x'.repeat(15) });
await expectOk('join', b, 'PUT', `${room}/b`, { uid: b.uid, name: 'Dude', seen: NOW });
await expectNo('a third player takes the seat', c, 'PUT', `${room}/b`, { uid: c.uid, name: 'Mum' });
await expectNo('rename the other player', b, 'PUT', `${room}/a/name`, 'Ha');
await expectNo('rename yourself', b, 'PUT', `${room}/b/name`, 'Ha');
await expectOk('say you\'re still here', b, 'PATCH', `${room}/b`, { seen: NOW });
await expectNo('say the other player is here', b, 'PATCH', `${room}/a`, { seen: NOW });
await expectNo('fire before both fleets are placed', a, 'PATCH', room, { 'shots/0': { by: 'a', x: 0, y: 0 }, n: 1 });
await expectNo('place a fleet for the other player', b, 'PUT', `${room}/a/hash`, hash('b'));
await expectNo('a fingerprint that isn\'t one', a, 'PUT', `${room}/a/hash`, 'nope');
await expectOk('place your fleet (P)', a, 'PUT', `${room}/a/hash`, hash('a'));
await expectNo('change your fleet afterwards', a, 'PUT', `${room}/a/hash`, hash('c'));
await expectOk('place your fleet (Dude)', b, 'PUT', `${room}/b/hash`, hash('b'));
await expectNo('fire out of turn', b, 'PATCH', room, { 'shots/0': { by: 'b', x: 0, y: 0 }, n: 1 });
await expectNo('fire as the other player', b, 'PATCH', room, { 'shots/0': { by: 'a', x: 0, y: 0 }, n: 1 });
await expectNo('fire off the board', a, 'PATCH', room, { 'shots/0': { by: 'a', x: 10, y: 0 }, n: 1 });
await expectNo('skip a shot number', a, 'PATCH', room, { 'shots/1': { by: 'a', x: 0, y: 0 }, n: 2 });
await expectNo('count a shot without firing it', a, 'PATCH', room, { n: 1 });
await expectNo('watcher fires', c, 'PATCH', room, { 'shots/0': { by: 'a', x: 0, y: 0 }, n: 1 });
await expectOk('fire (P, shot 1)', a, 'PATCH', room, { 'shots/0': { by: 'a', x: 3, y: 4 }, n: 1 });
await expectNo('fire again before the answer', b, 'PATCH', room, { 'shots/1': { by: 'b', x: 0, y: 0 }, n: 2 });
await expectNo('answer your own shot', a, 'PUT', `${room}/results/0`, { r: 'hit' });
await expectNo('a made-up answer', b, 'PUT', `${room}/results/0`, { r: 'maybe' });
await expectNo('sunk without saying which ship', b, 'PUT', `${room}/results/0`, { r: 'sunk' });
await expectNo('a hit that names a ship', b, 'PUT', `${room}/results/0`, { r: 'hit', ship: { id: 'carrier', x: 0, y: 0, dir: 'h' } });
await expectOk('answer (Dude)', b, 'PUT', `${room}/results/0`, { r: 'hit' });
await expectNo('change the answer', b, 'PUT', `${room}/results/0`, { r: 'miss' });
await expectNo('change the shot', a, 'PUT', `${room}/shots/0`, { by: 'a', x: 1, y: 1 });
await expectNo('fire twice in a row', a, 'PATCH', room, { 'shots/1': { by: 'a', x: 0, y: 0 }, n: 2 });
await expectOk('fire (Dude, shot 2)', b, 'PATCH', room, { 'shots/1': { by: 'b', x: 9, y: 9 }, n: 2 });
await expectOk('answer sunk with the ship (P)', a, 'PUT', `${room}/results/1`, { r: 'sunk', ship: { id: 'destroyer', x: 8, y: 9, dir: 'h' } });
await expectNo('reveal the other player\'s fleet', b, 'PUT', `${room}/reveal/a`, { fleet: 'x', salt: '0'.repeat(32) });
await expectNo('a salt that isn\'t one', a, 'PUT', `${room}/reveal/a`, { fleet: 'x', salt: 'salt' });
await expectOk('reveal your fleet', a, 'PUT', `${room}/reveal/a`, { fleet: 'carrier:0,0,h', salt: '0'.repeat(32) });
await expectNo('reveal it again', a, 'PUT', `${room}/reveal/a`, { fleet: 'carrier:1,0,h', salt: '0'.repeat(32) });
await expectNo('delete a room less than a day old', c, 'DELETE', room);

console.log(`Test room: ${code}`);
if (fail.length) { console.error(`${passed} as expected, ${fail.length} not:\n- ${fail.join('\n- ')}`); process.exit(1); }
console.log(`Battleships database rules: all ${passed} checks as expected`);

// The security rules (battleships/database.rules.json) checked against the real database: three throwaway
// anonymous players try what's allowed and what isn't. Run by hand after changing the rules in the console:
//   node tests/battleships/rules-live.mjs
// It leaves three test rooms behind (anyone may delete a room once it's a day old; or delete them in the console).
// Or before deploying, against the emulators (nothing real touched; needs Java):
//   npx firebase-tools emulators:exec --only database,auth --project demo-battleships --config <a firebase.json
//     whose "database" is { "rules": "battleships/database.rules.json" }> "node tests/battleships/rules-live.mjs"
// (emulators:exec sets FIREBASE_DATABASE_EMULATOR_HOST and FIREBASE_AUTH_EMULATOR_HOST, which this script follows).
import { CONFIG } from '../../battleships/js/net/firebase.js';
import { newCode } from '../../battleships/js/net/online.js';

const NOW = { '.sv': 'timestamp' };
const DB_EMU = process.env.FIREBASE_DATABASE_EMULATOR_HOST, AUTH_EMU = process.env.FIREBASE_AUTH_EMULATOR_HOST;
const DB_URL = DB_EMU ? `http://${DB_EMU}` : CONFIG.dbUrl, NS = DB_EMU ? `ns=${process.env.GCLOUD_PROJECT || 'demo-battleships'}-default-rtdb&` : '';
const SIGN_UP = AUTH_EMU ? `http://${AUTH_EMU}/identitytoolkit.googleapis.com/v1/accounts:signUp?key=emulator`
  : `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${CONFIG.apiKey}`;
const fail = [];
let passed = 0;

async function signUp() {
  const r = await fetch(SIGN_UP, {
    // The key only works from the site or local testing (#131), so say we're local testing.
    method: 'POST', headers: { 'Content-Type': 'application/json', Referer: 'http://localhost:8080/' },
    body: JSON.stringify({ returnSecureToken: true }),
  }).then(res => res.json());
  if (!r.idToken) throw new Error(`couldn't sign in: ${JSON.stringify(r)}`);
  return { uid: r.localId, token: r.idToken };
}
async function call(who, method, path, body, query = '') {
  const auth = who ? `auth=${who.token}&` : '';
  const res = await fetch(`${DB_URL}/${path}.json?${NS}${auth}${query}`, {
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
await expectNo('classic: two shots in one turn', a, 'PATCH', room, { 'shots/2': { by: 'a', x: 1, y: 1 }, 'shots/3': { by: 'a', x: 1, y: 2 }, n: 4 });

// Salvo (#178): a shot for each ship afloat, all at once, answered together; only new phones can join
const code3 = newCode(), room3 = `rooms/${code3}`;
const salvo = (by, from, count, y = 0) => Object.fromEntries(Array.from({ length: count }, (_, i) => [`shots/${from + i}`, { by, x: i, y }]));
const answers = (from, count, extra = {}) => ({ ...Object.fromEntries(Array.from({ length: count }, (_, i) => [`results/${from + i}`, { r: 'miss' }])), ...extra });
await expectNo('a room with a made-up variant', a, 'PUT', room3, { created: NOW, n: 0, variant: 'turbo', a: { uid: a.uid, name: 'P', v: 2 } });
await expectOk('start a salvo room', a, 'PUT', room3, { created: NOW, n: 0, variant: 'salvo', a: { uid: a.uid, name: 'P', seen: NOW, v: 2 } });
await expectNo('change the variant', a, 'PUT', `${room3}/variant`, 'classic');
await expectNo('join a salvo room on an old phone (no v)', b, 'PUT', `${room3}/b`, { uid: b.uid, name: 'Dude', seen: NOW });
await expectOk('join a salvo room (v 2)', b, 'PUT', `${room3}/b`, { uid: b.uid, name: 'Dude', seen: NOW, v: 2 });
await expectOk('place (P, salvo)', a, 'PUT', `${room3}/a/hash`, hash('a'));
await expectOk('place (Dude, salvo)', b, 'PUT', `${room3}/b/hash`, hash('b'));
await expectNo('salvo: Dude fires first', b, 'PATCH', room3, { ...salvo('b', 0, 5), n: 5 });
await expectNo('salvo: six shots with five ships', a, 'PATCH', room3, { ...salvo('a', 0, 6), n: 6 });
await expectNo('salvo: a gap in the shots', a, 'PATCH', room3, { 'shots/0': { by: 'a', x: 0, y: 0 }, 'shots/1': { by: 'a', x: 1, y: 0 }, 'shots/3': { by: 'a', x: 3, y: 0 }, n: 4 });
await expectNo('salvo: a shot in the other player\'s name', a, 'PATCH', room3, { 'shots/0': { by: 'a', x: 0, y: 0 }, 'shots/1': { by: 'b', x: 1, y: 0 }, n: 2 });
await expectNo('salvo: shots without counting them', a, 'PATCH', room3, { ...salvo('a', 0, 5), n: 3 });
await expectOk('salvo of 5 (P)', a, 'PATCH', room3, { ...salvo('a', 0, 5), n: 5 });
await expectNo('salvo: fire before the answers', b, 'PATCH', room3, { ...salvo('b', 5, 5), n: 10 });
await expectNo('salvo: answer your own salvo', a, 'PATCH', room3, answers(0, 5));
await expectNo('salvo: sunk without noting the ship', b, 'PATCH', room3, answers(0, 5, { 'results/4': { r: 'sunk', ship: { id: 'destroyer', x: 3, y: 0, dir: 'h' } } }));
await expectNo('salvo: note the other player\'s ship sunk', a, 'PUT', `${room3}/sunk/b/carrier`, true);
await expectOk('salvo: answered, a ship sunk (Dude)', b, 'PATCH', room3, answers(0, 5, { 'results/4': { r: 'sunk', ship: { id: 'destroyer', x: 3, y: 0, dir: 'h' } }, 'sunk/b/destroyer': true }));
await expectNo('salvo: five shots with four ships', b, 'PATCH', room3, { ...salvo('b', 5, 5, 1), n: 10 });
await expectOk('salvo of 4 (Dude)', b, 'PATCH', room3, { ...salvo('b', 5, 4, 1), n: 9 });
await expectOk('salvo: answered (P)', a, 'PATCH', room3, answers(5, 4));
await expectOk('salvo of 5 again (P)', a, 'PATCH', room3, { ...salvo('a', 9, 5, 2), n: 14 });

// a rematch: the code of a new room, written once, by either player, pointing at a room they started
const code2 = newCode(), room2 = `rooms/${code2}`, dudes = newCode();
await expectOk('start the rematch room (P)', a, 'PUT', room2, { created: NOW, n: 0, a: { uid: a.uid, name: 'P', seen: NOW } });
await expectOk('a room of Dude\'s', b, 'PUT', `rooms/${dudes}`, { created: NOW, n: 0, a: { uid: b.uid, name: 'Dude', seen: NOW } });
await expectNo('a watcher sets the rematch', c, 'PUT', `${room}/next`, code2);
await expectNo('a rematch in someone else\'s room', a, 'PUT', `${room}/next`, dudes);
await expectNo('a rematch in this same room', a, 'PUT', `${room}/next`, code);
await expectNo('a rematch code that isn\'t one', a, 'PUT', `${room}/next`, 'ab1o');
await expectOk('ask for a rematch (P)', a, 'PUT', `${room}/next`, code2);
await expectNo('ask again with another room', b, 'PUT', `${room}/next`, dudes);

// resigning: only your own seat, once, and then nobody fires
await expectNo('resign for the other player', b, 'PUT', `${room}/resigned`, 'a');
await expectNo('a watcher resigns', c, 'PUT', `${room}/resigned`, 'a');
await expectNo('resign as nobody', b, 'PUT', `${room}/resigned`, 'x');
await expectOk('resign (Dude)', b, 'PUT', `${room}/resigned`, 'b');
await expectNo('resign again', a, 'PUT', `${room}/resigned`, 'a');
await expectNo('fire after someone resigned', a, 'PATCH', room, { 'shots/2': { by: 'a', x: 5, y: 5 }, n: 3 });
await expectNo('resign before anyone has joined', a, 'PUT', `${room2}/resigned`, 'a');

await expectNo('reveal the other player\'s fleet', b, 'PUT', `${room}/reveal/a`, { fleet: 'x', salt: '0'.repeat(32) });
await expectNo('a salt that isn\'t one', a, 'PUT', `${room}/reveal/a`, { fleet: 'x', salt: 'salt' });
await expectOk('reveal your fleet', a, 'PUT', `${room}/reveal/a`, { fleet: 'carrier:0,0,h', salt: '0'.repeat(32) });
await expectNo('reveal it again', a, 'PUT', `${room}/reveal/a`, { fleet: 'carrier:1,0,h', salt: '0'.repeat(32) });
await expectNo('delete a room less than a day old', c, 'DELETE', room);

console.log(`Test rooms: ${code}, ${code2}, ${dudes}, ${code3} (deleted by the tidy-up once a day old, or in the console)`);
if (fail.length) { console.error(`${passed} as expected, ${fail.length} not:\n- ${fail.join('\n- ')}`); process.exit(1); }
console.log(`Battleships database rules: all ${passed} checks as expected`);

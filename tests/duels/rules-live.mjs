// The security rules for playing on two phones (the duels part of battleships/database.rules.json) checked
// against the real database: three throwaway anonymous players try what's allowed and what isn't. Run by hand
// after changing the rules in the console:
//   node tests/duels/rules-live.mjs
// It leaves one test room behind (anyone may delete a room once it's a day old; or delete it in the console).
import { CONFIG } from '../../shared/firebase.js';
import { newCode } from '../../shared/duel.js';

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
async function call(who, method, path, body) {
  const auth = who ? `?auth=${who.token}` : '';
  const res = await fetch(`${CONFIG.dbUrl}/${path}.json${auth}`, {
    method, headers: { 'Content-Type': 'application/json' }, body: body === undefined ? undefined : JSON.stringify(body),
  });
  return res.status;
}
async function expectOk(what, ...args) { const s = await call(...args); if (s === 200) passed++; else fail.push(`${what}: wanted it allowed, got ${s}`); }
async function expectNo(what, ...args) { const s = await call(...args); if (s === 401 || s === 403) passed++; else fail.push(`${what}: wanted it refused, got ${s}`); }

const [a, b, c] = [await signUp(), await signUp(), await signUp()];
const code = newCode(), room = `duels/${code}`;
const fresh = (extra = {}) => ({ created: NOW, game: 'c4', round: 0, count: 0, a: { uid: a.uid, name: 'P' }, ...extra });
const play = (who, r, i, v) => call(who, 'PATCH', room, { [`moves/${r}/${i}`]: v, count: i + 1 });
async function moveOk(what, who, r, i, v) { const s = await play(who, r, i, v); if (s === 200) passed++; else fail.push(`${what}: wanted it allowed, got ${s}`); }
async function moveNo(what, who, r, i, v) { const s = await play(who, r, i, v); if (s === 401 || s === 403) passed++; else fail.push(`${what}: wanted it refused, got ${s}`); }

await expectNo('read without signing in', null, 'GET', room);
await expectNo('list every game', a, 'GET', 'duels');
await expectNo('a game with a bad code', a, 'PUT', 'duels/ab1o', fresh());
await expectNo('a game of something else', a, 'PUT', room, fresh({ game: 'chess' }));
await expectNo('a game with a made-up time', a, 'PUT', room, fresh({ created: 123 }));
await expectNo('a game in someone else\'s name', a, 'PUT', room, fresh({ a: { uid: b.uid, name: 'P' } }));
await expectNo('a game that already has two players', a, 'PUT', room, fresh({ b: { uid: b.uid, name: 'Dude' } }));
await expectNo('a game with moves already made', a, 'PUT', room, fresh({ moves: { 0: { 0: 3 } }, count: 1 }));
await expectNo('a game with extra things in it', a, 'PUT', room, fresh({ extra: 1 }));
await expectOk('start a game', a, 'PUT', room, fresh());
await expectNo('start the same game again', b, 'PUT', room, { ...fresh(), a: { uid: b.uid, name: 'Dude' } });
await expectOk('anyone signed in can read a game by its code', c, 'GET', room);
await moveNo('move before anyone has joined', a, 0, 0, 3);
await expectNo('the starter takes the second seat too', a, 'PUT', `${room}/b`, { uid: a.uid, name: 'P2' });
await expectNo('a name that\'s too long', b, 'PUT', `${room}/b`, { uid: b.uid, name: 'x'.repeat(15) });
await expectOk('join', b, 'PUT', `${room}/b`, { uid: b.uid, name: 'Dude' });
await expectNo('a third player takes the seat', c, 'PUT', `${room}/b`, { uid: c.uid, name: 'Mum' });
await expectNo('rename the other player', b, 'PUT', `${room}/a/name`, 'Ha');
await moveNo('move out of turn', b, 0, 0, 3);
await moveNo('move as someone not playing', c, 0, 0, 3);
await moveNo('a column off the board', a, 0, 0, 7);
await moveNo('half a column', a, 0, 0, 2.5);
await moveNo('skip a move number', a, 0, 1, 3);
await expectNo('a move without counting it', a, 'PUT', `${room}/moves/0/0`, 3);
await expectNo('count a move that wasn\'t made', a, 'PUT', `${room}/count`, 1);
await moveOk('move on your turn (P)', a, 0, 0, 3);
await moveNo('move twice', a, 0, 1, 3);
await expectNo('change a move', b, 'PUT', `${room}/moves/0/0`, 4);
await moveOk('move on your turn (Dude)', b, 0, 1, 4);
await expectNo('a round that skips one', a, 'PATCH', room, { round: 2, count: 0 });
await expectNo('a new round without starting the count again', a, 'PATCH', room, { round: 1 });
await expectNo('someone not playing starts a new round', c, 'PATCH', room, { round: 1, count: 0 });
await expectOk('play again', b, 'PATCH', room, { round: 1, count: 0 });
await expectNo('play again twice at once', a, 'PATCH', room, { round: 1, count: 0 });
await moveNo('the old round', a, 0, 2, 3);
await moveNo('the first move of the new round out of turn (P)', a, 1, 0, 3);
await moveOk('the first move of the new round (Dude goes first)', b, 1, 0, 3);
await expectNo('say the other player left', a, 'PUT', `${room}/b/left`, true);
await expectOk('leave', b, 'PUT', `${room}/b/left`, true);
await expectNo('delete a game that\'s less than a day old', a, 'DELETE', room);
await expectNo('anywhere else', a, 'PUT', 'other', 1);

if (fail.length) { console.error(`${passed} passed, ${fail.length} failed:\n- ` + fail.join('\n- ')); process.exit(1); }
console.log(`Two-phone rules: all ${passed} checks pass (left test game ${code})`);

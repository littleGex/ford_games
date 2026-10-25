// Battleships: the menu, placing the fleet, taking turns, and the end of the game. The rules live in game.js and
// rules.js, the computer in ai.js, the 3D world in scene/, games between two devices in net/. This file joins them
// up and runs the page.
//
// A turn is a little story told with awaits: aim, the shell flies, it lands, the camera swings across, the other
// side fires back. Nothing can be tapped while one plays (`busy`).
import { createWorld } from './scene/index.js';
import { preventZoom } from './nozoom.js';
import * as sound from './audio.js';
import { FLEET, randomFleet, fits, shipAt, shipName, shipLength, label, seededRandom, sunkIds, inBounds, cells, resolveShot } from './rules.js';
import { newGame, place, fire, fired, other, isComputer, validState, tally } from './game.js';
import { chooseShot } from './ai.js';
import { createFirebase, NOW } from './net/firebase.js';
import { newCode, CODE_RE, view, shotList, fleetHash, fleetString, newSalt, check, otherSeat } from './net/online.js';

const params = new URLSearchParams(location.search);
const rng = params.has('seed') ? seededRandom(Number(params.get('seed')) || 1) : Math.random;
const SAVE_KEY = 'battleships.save.v1', STATS_KEY = 'battleships.stats.v1', PREFS_KEY = 'battleships.prefs.v1';
const ONLINE_KEY = 'battleships.online.v1';   // the game on two devices this one is in: { code, seat, fleet, salt }
const LEVEL_NAME = { easy: 'Easy', normal: 'Normal', hard: 'Hard' };

const load = (k, fallback) => { try { return JSON.parse(localStorage.getItem(k)) ?? fallback; } catch (e) { return fallback; } };
const keep = (k, v) => { try { if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* private mode */ } };

const $ = id => document.getElementById(id);
const canvas = $('scene');
const world = createWorld(canvas);
preventZoom();

let speed = Number(params.get('speed')) || 1;   // tests run the animations faster
const wait = ms => new Promise(r => setTimeout(r, ms / speed));

let state = null;     // the game being played (game.js)
let viewer = 0;       // whose side the world shows
let draft = null;     // the fleet being placed
let mode = 'menu';    // 'menu' | 'placing' | 'aiming' | 'waiting' | 'watching' | 'handoff' | 'over' | 'looking'
let busy = false;
let aimSq = null;
let prefs = { level: 'normal', names: ['', ''], onlineName: '', sound: true, ...load(PREFS_KEY, {}) };
sound.setSound(prefs.sound);

const save = () => { if (!state || state.mode !== 'online') keep(SAVE_KEY, state && state.phase !== 'over' ? state : null); };
const nameOf = i => state.players[i].name;

// ---------- the HUD ----------

function setStatus(labelText, text) { $('statusLabel').textContent = labelText || ''; $('statusText').textContent = text; }
function setMode(m) {
  mode = m;
  $('shuffleBtn').hidden = $('readyBtn').hidden = m !== 'placing';
  $('fireBtn').hidden = m !== 'aiming';
  $('viewBtn').hidden = !['aiming', 'watching', 'looking'].includes(m);
  $('fleets').hidden = !['aiming', 'waiting', 'watching', 'looking'].includes(m);
  $('fireBtn').disabled = !aimSq;
  hint(m === 'placing' ? 'Drag a ship to move it · tap it to turn it' : m === 'aiming' ? 'Tap a square to aim, then Fire!' : '');
  updateViewBtn();
}
function hint(text) { $('hint').textContent = text; $('hint').hidden = !text; }
let toastTimer = null;
function toast(text, kind = '') {
  const t = $('toast');
  t.textContent = text;
  t.className = `toast show ${kind}`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { t.className = 'toast'; }, 1700 / speed);
}
function updateFleets() {
  if (!state) return;
  const row = (el, sunk) => {
    el.innerHTML = '';
    for (const s of FLEET) {
      const li = document.createElement('li');
      li.style.width = `${s.len * 8}px`;
      li.title = s.name + (sunk.includes(s.id) ? ' (sunk)' : '');
      if (sunk.includes(s.id)) li.className = 'sunk';
      el.appendChild(li);
    }
  };
  row($('enemyFleet'), sunkIds(state.shots[viewer]));
  row($('myFleet'), sunkIds(state.shots[other(viewer)]));
  $('enemyName').textContent = state.mode === 'cpu' ? 'Enemy' : nameOf(other(viewer));
  $('myName').textContent = 'Yours';
}
function updateViewBtn() {
  $('viewBtn').textContent = world.viewing === 'home' ? '🎯 Enemy waters' : '👁 Your fleet';
}

/** Show the game from one player's side. */
function showSide(i, { reveal = false } = {}) {
  viewer = i;
  world.show({
    fleet: state.players[i].fleet || [],
    incoming: state.shots[other(i)],
    outgoing: state.shots[i],
    reveal: reveal ? state.players[other(i)].fleet : null,
  });
  updateFleets();
}

// ---------- the menu ----------

function openMenu() {
  setMode('menu');
  aim(null);
  const session = load(ONLINE_KEY, null);
  const saved = session ? null : state && state.mode !== 'online' && state.phase !== 'over' ? state : null;
  $('resumeBtn').hidden = $('resumeWhat').hidden = !saved && !session;
  $('leaveBtn').hidden = !session;
  if (session) $('resumeWhat').textContent = `Your game on two devices (code ${session.code}). A new game leaves it.`;
  if (saved) {
    const shots = saved.shots[0].length + saved.shots[1].length;
    $('resumeWhat').textContent = (saved.mode === 'cpu' ? `Against the computer (${LEVEL_NAME[saved.level]})` : `${saved.players[0].name} against ${saved.players[1].name}`)
      + (saved.phase === 'placing' ? ', placing ships' : `, ${shots} shot${shots === 1 ? '' : 's'} fired`) + '. A new game ends this one.';
  }
  document.querySelectorAll('[data-level]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.level === prefs.level)));
  $('name1').value = prefs.names[0] || '';
  $('name2').value = prefs.names[1] || '';
  $('onlineName').value = prefs.onlineName || '';
  $('soundBtn').textContent = `Sound: ${prefs.sound ? 'on' : 'off'}`;
  $('soundBtn').setAttribute('aria-pressed', String(prefs.sound));
  const stats = load(STATS_KEY, {});
  const played = Object.keys(LEVEL_NAME).filter(l => stats[l] && stats[l].won + stats[l].lost > 0);
  $('stats').textContent = played.length ? 'Your wins: ' + played.map(l => `${LEVEL_NAME[l]} ${stats[l].won} of ${stats[l].won + stats[l].lost}`).join(' · ') : '';
  $('over').hidden = true;
  $('home').hidden = false;
}
function closeMenu() { $('home').hidden = true; }

document.querySelectorAll('[data-level]').forEach(b => b.addEventListener('click', () => {
  prefs.level = b.dataset.level;
  keep(PREFS_KEY, prefs);
  document.querySelectorAll('[data-level]').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
}));
$('playCpu').addEventListener('click', () => start({ mode: 'cpu', level: prefs.level }));
$('playLocal').addEventListener('click', () => {
  prefs.names = [$('name1').value.trim(), $('name2').value.trim()];
  keep(PREFS_KEY, prefs);
  start({ mode: 'local', names: prefs.names });
});
$('resumeBtn').addEventListener('click', () => {
  closeMenu();
  const session = load(ONLINE_KEY, null);
  if (session) connect(session); else resume();
});
$('soundBtn').addEventListener('click', () => {
  prefs.sound = !prefs.sound;
  sound.setSound(prefs.sound);
  keep(PREFS_KEY, prefs);
  $('soundBtn').textContent = `Sound: ${prefs.sound ? 'on' : 'off'}`;
  $('soundBtn').setAttribute('aria-pressed', String(prefs.sound));
});
$('menuBtn').addEventListener('click', () => { if (!busy) openMenu(); });

// ---------- starting, carrying on ----------

function start(opts) {
  leaveOnline();
  closeMenu();
  state = newGame({ ...opts, rng });
  last = null;
  save();
  next();
}

function resume() {
  if (state.phase === 'placing') return next();
  if (state.mode === 'cpu') { showSide(0); return next(); }
  next({ handoff: true });
}

/** Carry on with whatever the game is waiting for. */
async function next({ handoff = false } = {}) {
  if (state.phase === 'placing') {
    const i = state.turn;
    if (state.mode === 'local' && (i === 1 || handoff)) {
      await handOff(i, `${nameOf(i)}, place your fleet`, `${nameOf(other(i))}, no peeking!`);
    }
    return startPlacing(i);
  }
  if (state.phase === 'over') return finish();
  if (isComputer(state, state.turn)) return computerTurn();
  if (state.mode === 'local' && handoff) await handOff(state.turn, `${nameOf(state.turn)}'s turn`, lastShotText(state.turn));
  return humanTurn(state.turn, { fresh: state.mode === 'local' });
}

// ---------- the hand-off screen (two players, one device) ----------

function handOff(i, title, text) {
  setMode('handoff');
  $('handoffEyebrow').textContent = `Pass the device to ${nameOf(i)}`;
  $('handoffTitle').textContent = title;
  $('handoffText').textContent = text;
  $('handoffBtn').textContent = `I'm ${nameOf(i)}, show me`;
  $('handoff').hidden = false;
  $('handoffBtn').focus();
  return new Promise(done => {
    $('handoffBtn').onclick = () => { $('handoff').hidden = true; done(); };
  });
}
let last = null;   // the last shot: { by, shot }
function lastShotText(i) {
  if (!last || last.by === i) return `${nameOf(other(i))}, look away!`;
  const where = label(last.shot.x, last.shot.y);
  const what = last.shot.result === 'miss' ? 'and missed'
    : last.shot.result === 'sunk' ? `and sank your ${shipName(last.shot.ship.id)}!`
    : `and hit your ${shipName(shipAt(state.players[i].fleet, last.shot.x, last.shot.y).id)}`;
  return `${nameOf(last.by)} fired at ${where} ${what}`;
}

// ---------- placing the fleet ----------

function startPlacing(i) {
  viewer = i;
  draft = randomFleet(rng);
  world.show({ fleet: draft });
  world.view('home', 0);
  setStatus(state.mode === 'local' ? nameOf(i) : '', 'Place your fleet');
  setMode('placing');
}
$('shuffleBtn').addEventListener('click', () => {
  if (mode !== 'placing') return;
  draft = randomFleet(rng);
  world.show({ fleet: draft });
});
$('readyBtn').addEventListener('click', () => {
  if (mode !== 'placing') return;
  if (state.mode === 'online') return readyOnline();
  place(state, viewer, draft);
  save();
  if (state.phase === 'playing' && state.mode === 'cpu') showSide(0);
  next({ handoff: state.mode === 'local' });   // the device goes back to the other player
});

/** Turn a ship a quarter round its first square; if it would stick out or touch, slide it back along to fit. */
function turned(ship) {
  const dir = ship.dir === 'h' ? 'v' : 'h';
  for (let back = 0; back < shipLength(ship.id); back++) {
    const s = { ...ship, dir, x: dir === 'h' ? ship.x - back : ship.x, y: dir === 'v' ? ship.y - back : ship.y };
    if (fits(draft, s)) return s;
  }
  return null;
}

let drag = null;   // placing: { ship, grab: [dx, dy], to, ok, moved } · aiming: { x, y } where the finger went down
canvas.addEventListener('pointerdown', e => {
  if (busy) return;
  const hit = world.pick(e.clientX, e.clientY);
  if (mode === 'placing') {
    if (!hit || hit.side !== 'home') return;
    const ship = shipAt(draft, ...hit.sq);
    if (!ship) return;
    drag = { ship, grab: [hit.sq[0] - ship.x, hit.sq[1] - ship.y], to: ship, ok: true, moved: false };
    world.moveShip(ship, '#ffb02e');
    canvas.setPointerCapture(e.pointerId);
  } else if (mode === 'aiming') {
    drag = { x: e.clientX, y: e.clientY };
  }
});
canvas.addEventListener('pointermove', e => {
  const hit = world.pick(e.clientX, e.clientY);
  if (mode === 'placing' && drag && drag.ship) {
    if (!hit || hit.side !== 'home') return;
    const to = { ...drag.ship, x: hit.sq[0] - drag.grab[0], y: hit.sq[1] - drag.grab[1] };
    if (to.x === drag.to.x && to.y === drag.to.y) return;
    drag.moved = true;
    // keep it on the board even when it can't go there, so you can see where it is
    const len = shipLength(to.id) - 1;
    to.x = Math.max(0, Math.min(9 - (to.dir === 'h' ? len : 0), to.x));
    to.y = Math.max(0, Math.min(9 - (to.dir === 'v' ? len : 0), to.y));
    drag.to = to;
    drag.ok = fits(draft, to);
    world.moveShip(to, drag.ok ? '#ffb02e' : '#ff2a1a');
  } else if (mode === 'aiming' && world.viewing === 'target' && e.pointerType === 'mouse') {
    world.hover(hit && hit.side, hit && hit.side === 'target' && !fired(state, viewer, ...hit.sq) ? hit.sq : null);
  }
});
function endDrag(e) {
  if (mode === 'placing' && drag && drag.ship) {
    const { ship } = drag;
    let final = ship;
    if (!drag.moved) {
      const t = turned(ship);
      if (t) final = t; else toast('No room to turn it here', 'miss');
    } else if (drag.ok) final = drag.to;
    else toast('Ships can\'t touch', 'miss');
    draft = draft.map(s => (s.id === ship.id ? final : s));
    world.moveShip(final, null);
  } else if (mode === 'aiming' && drag && e && Math.hypot(e.clientX - drag.x, e.clientY - drag.y) < 12) {
    const hit = world.pick(e.clientX, e.clientY);
    if (hit && hit.side === 'target' && world.viewing === 'target') tapSquare(hit.sq);
  }
  drag = null;
}
canvas.addEventListener('pointerup', endDrag);
canvas.addEventListener('pointercancel', () => {
  if (drag && drag.ship) world.moveShip(drag.ship, null);
  drag = null;
});

// ---------- your turn ----------

async function humanTurn(i, { fresh = false } = {}) {
  aim(null);
  if (fresh) {
    // two on one device: the world now shows this player's side; first a look at what the other one just did
    showSide(i);
    if (last && last.by !== i) {
      world.view('home', 0);
      setStatus(nameOf(i), lastShotText(i));
      setMode('waiting');
      await wait(1300);
    }
  }
  setStatus(state.mode === 'local' ? nameOf(i) : '', 'Your turn: pick a target');
  await world.view('target', world.viewing === 'target' ? 0 : 900 / speed);
  setMode('aiming');   // only once the camera is there, so a tap lands on the square under it
}

function aim(sq) {
  aimSq = sq;
  world.aim(sq);
  $('fireBtn').disabled = !sq;
  if (sq && mode === 'aiming') $('fireBtn').textContent = `Fire at ${label(...sq)}!`;
  else $('fireBtn').textContent = 'Fire!';
}
function tapSquare(sq) {
  const pending = online && online.room && view(online.room, online.seat).pending;
  if (fired(state, viewer, ...sq) || (pending && pending.x === sq[0] && pending.y === sq[1])) { toast(`Already fired at ${label(...sq)}`, 'miss'); return; }
  if (aimSq && aimSq[0] === sq[0] && aimSq[1] === sq[1]) return shoot();
  aim(sq);
}
$('fireBtn').addEventListener('click', () => { if (mode === 'aiming' && aimSq && !busy) shoot(); });
$('viewBtn').addEventListener('click', async () => {
  if (busy) return;
  world.hover(null, null);
  await world.view(world.viewing === 'home' ? 'target' : 'home', 700 / speed);
  updateViewBtn();
});
window.addEventListener('keydown', e => {
  if (mode !== 'aiming' || busy || world.viewing !== 'target') return;
  const moves = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
  if (moves[e.key]) {
    e.preventDefault();
    const [x, y] = aimSq || [4, 4];
    const nx = x + moves[e.key][0], ny = y + moves[e.key][1];
    aim(aimSq && inBounds(nx, ny) ? [nx, ny] : [x, y]);
  } else if ((e.key === 'Enter' || e.key === ' ') && aimSq && document.activeElement === document.body) {
    e.preventDefault();
    tapSquare(aimSq);
  }
});

function shotWords(shot, byMe, defender) {
  if (shot.result === 'miss') return { text: byMe ? 'Miss' : `${state.mode === 'cpu' ? 'The computer' : nameOf(other(defender))} missed`, kind: 'miss' };
  if (shot.result === 'sunk') return { text: byMe ? `You sank the ${shipName(shot.ship.id)}!` : `Your ${shipName(shot.ship.id)} sank!`, kind: 'sunk' };
  return { text: byMe ? 'Hit!' : `Your ${shipName(shipAt(state.players[defender].fleet, shot.x, shot.y).id)} was hit!`, kind: 'hit' };
}
const soundOf = shot => (shot.result === 'miss' ? sound.splash() : (sound.boom(), shot.result === 'sunk' && sound.sink()));

async function shoot() {
  if (state.mode === 'online') return shootOnline();
  busy = true;
  const me = state.turn, [x, y] = aimSq;
  const shot = fire(state, x, y);
  aim(null);
  if (!shot) { busy = false; return; }
  last = { by: me, shot };
  save();
  setMode('waiting');
  setStatus(state.mode === 'local' ? nameOf(me) : '', `Firing at ${label(x, y)}…`);
  sound.launch();
  await world.shot('target', shot);
  soundOf(shot);
  const w = shotWords(shot, true, other(me));
  toast(w.text, w.kind);
  updateFleets();
  await wait(shot.result === 'miss' ? 900 : 1200);
  busy = false;
  if (state.phase === 'over') return finish();
  next({ handoff: state.mode === 'local' });
}

// ---------- the computer's turn ----------

async function computerTurn() {
  busy = true;
  setMode('waiting');
  setStatus('', 'The computer is aiming…');
  await world.view('home', 900 / speed);
  updateViewBtn();
  await wait(450 + rng() * 500);
  const [x, y] = chooseShot(state.level, state.shots[1], rng);
  const shot = fire(state, x, y);
  last = { by: 1, shot };
  save();
  setStatus('', `The computer fires at ${label(x, y)}…`);
  sound.launch();
  await world.shot('home', shot);
  soundOf(shot);
  if (shot.result !== 'miss' && navigator.vibrate) try { navigator.vibrate(shot.result === 'sunk' ? [80, 60, 160] : 60); } catch (e) { /* no vibration */ }
  const w = shotWords(shot, false, 0);
  toast(w.text, w.kind);
  updateFleets();
  await wait(shot.result === 'miss' ? 900 : 1300);
  busy = false;
  if (state.phase === 'over') return finish();
  humanTurn(0);
}

// ---------- the end ----------

async function finish() {
  busy = true;
  const winner = state.winner, cpu = state.mode === 'cpu';
  const shownSide = cpu ? 0 : winner;
  keep(SAVE_KEY, null);
  if (cpu) {
    const stats = load(STATS_KEY, {});
    const s = stats[state.level] || { won: 0, lost: 0 };
    if (winner === 0) s.won++; else s.lost++;
    stats[state.level] = s;
    keep(STATS_KEY, stats);
  }
  showSide(shownSide, { reveal: true });
  setMode('looking');
  setStatus('Game over', cpu ? (winner === 0 ? 'You won!' : 'The computer won') : `${nameOf(winner)} wins!`);
  sound.tune(cpu ? winner === 0 : true);
  await world.view(cpu && winner === 1 ? 'target' : 'both', 1100 / speed);
  updateViewBtn();
  await wait(700);
  const { shots, hits } = tally(state, winner);
  const accuracy = Math.round(hits / shots * 100);
  $('overTitle').textContent = cpu ? (winner === 0 ? 'You won! 🎉' : 'The computer won') : `${nameOf(winner)} wins! 🎉`;
  $('overText').textContent = cpu && winner === 1
    ? `It took the computer ${shots} shots. Its ships still afloat are on the right.`
    : `The whole fleet sunk in ${shots} shots (${accuracy}% hits).`;
  $('againBtn').textContent = 'Play again';
  $('overCheck').hidden = true;
  $('over').hidden = false;
  $('againBtn').focus();
  busy = false;
}
$('againBtn').addEventListener('click', () => {
  $('over').hidden = true;
  if (state.mode === 'online') { leaveOnline(); return openMenu(); }
  start({ mode: state.mode, level: state.level, names: state.players.map(p => p.name) });
});
$('lookBtn').addEventListener('click', () => { $('over').hidden = true; setMode('looking'); });
$('overMenuBtn').addEventListener('click', openMenu);

// ---------- two devices ----------
//
// The room in the database is the game. This device follows it (net.listen) and, every time it changes, works out
// what's new (sync): the other player has joined or placed their fleet, a shot to answer, answered shots to play
// out. Shots are only played once they're answered, so both devices show the same thing. The fleet and its salt
// stay on this device (ONLINE_KEY) until the end.

let net = null;
let online = null;   // { code, seat, fleet, salt, room, stop, shown, answered, turnShown, finished, checked }
const theirName = () => (online && online.room && online.room[otherSeat(online.seat)] || {}).name || 'the other player';
const rooms = code => `rooms/${code}`;

function onlineName() {
  const name = $('onlineName').value.trim().slice(0, 14) || 'Player';
  prefs.onlineName = $('onlineName').value.trim();
  keep(PREFS_KEY, prefs);
  return name;
}
function onlineMsg(text) { $('onlineMsg').textContent = text; }
function netError(e, what) {
  if (e && e.denied) return `${what}: the game server said no`;
  return e && e.status === 0 ? `${what}: no connection` : `${what}: ${e && e.message || 'something went wrong'}`;
}

async function host() {
  net = net || createFirebase();
  const name = onlineName();
  onlineMsg('Starting a game…');
  $('hostBtn').disabled = true;
  try {
    const uid = await net.uid();
    for (let tries = 0; tries < 6; tries++) {
      const code = newCode();
      try {
        await net.put(rooms(code), { created: NOW, n: 0, a: { uid, name, seen: NOW } });
      } catch (e) {
        if (e.denied) continue;   // that code is taken: try another
        throw e;
      }
      onlineMsg('');
      return connect({ code, seat: 'a', fleet: null, salt: null });
    }
    onlineMsg('Couldn\'t find a free code, try again');
  } catch (e) {
    onlineMsg(netError(e, 'Couldn\'t start a game'));
  } finally {
    $('hostBtn').disabled = false;
  }
}

async function join(code) {
  code = code.trim().toUpperCase();
  if (!CODE_RE.test(code)) return onlineMsg('A code is 4 letters and numbers, like KQ7P');
  net = net || createFirebase();
  const name = onlineName();
  onlineMsg('Joining…');
  try {
    const uid = await net.uid();
    const room = await net.get(rooms(code));
    if (!room) return onlineMsg(`There's no game with the code ${code}`);
    let seat = room.a && room.a.uid === uid ? 'a' : room.b && room.b.uid === uid ? 'b' : null;
    if (!seat) {
      if (room.b) return onlineMsg('That game already has two players');
      await net.put(`${rooms(code)}/b`, { uid, name, seen: NOW });
      seat = 'b';
    }
    onlineMsg('');
    const session = load(ONLINE_KEY, null);
    connect(session && session.code === code && session.seat === seat ? session : { code, seat, fleet: null, salt: null });
  } catch (e) {
    onlineMsg(netError(e, 'Couldn\'t join'));
  }
}

/** Take a seat in a room (new, or carrying on after a reload) and follow it. */
function connect(session) {
  if (online && online.stop) online.stop();
  net = net || createFirebase();
  online = { ...session, room: undefined, shown: null, answered: new Set(), turnShown: -1, finished: false, checked: false };
  keep(ONLINE_KEY, { code: session.code, seat: session.seat, fleet: session.fleet, salt: session.salt });
  state = {
    mode: 'online', phase: 'placing', turn: 0, winner: null,
    players: [{ name: 'You', fleet: session.fleet }, { name: '', fleet: null }],
    shots: [[], []],
  };
  viewer = 0;
  closeMenu();
  setStatus('', 'Connecting…');
  setMode('waiting');
  online.stop = net.listen(rooms(session.code), room => {
    online.room = room;
    syncing = syncing.then(sync).catch(e => console.error(e));
  }, s => { if (s === 'reconnecting') hint('Reconnecting to the game server…'); else if (mode !== 'menu') setMode(mode); });
}

function leaveOnline() {
  if (online && online.stop) online.stop();
  online = null;
  keep(ONLINE_KEY, null);
  $('lobby').hidden = true;
}

let syncing = Promise.resolve();
async function sync() {
  if (!online) return;
  const room = online.room, me = online.seat;
  if (room === null) {
    leaveOnline();
    toast('That game has finished', 'miss');
    return openMenu();
  }
  if (room === undefined) return;
  const v = view(room, me);
  state.players[0].name = v.names[0] || 'You';
  state.players[1].name = v.names[1] || 'the other player';

  // still waiting for someone to join: show the code
  if (v.phase === 'waiting') {
    $('lobbyCode').textContent = online.code;
    $('lobby').hidden = false;
    setStatus('', 'Waiting for the other player');
    return;
  }
  $('lobby').hidden = true;

  // placing: this device first, then waiting for the other one
  if (!online.fleet) {
    if (mode !== 'placing') startPlacing(0);
    setStatus(v.ready[1] ? `${theirName()} is ready` : '', 'Place your fleet');
    return;
  }
  if (v.phase === 'placing') {
    setStatus('', `Waiting for ${theirName()} to place their fleet…`);
    if (mode !== 'waiting') { world.show({ fleet: online.fleet }); world.view('home', 600 / speed); setMode('waiting'); }
    return;
  }

  // playing: the first time here, show the game as it stands (after a reload, everything so far)
  if (online.shown === null) {
    state.shots = [v.shots[0].map(s => ({ ...s })), v.shots[1].map(s => ({ ...s }))];
    online.shown = state.shots[0].length + state.shots[1].length;
    showSide(0);
  }

  // a shot at this device's fleet: answer it (the answer comes back round and plays below)
  if (v.pending && v.pending.by !== me && !online.answered.has(v.pending.n)) {
    const { n, x, y } = v.pending;
    online.answered.add(n);
    const answer = resolveShot(online.fleet, v.shots[1], x, y);
    net.put(`${rooms(online.code)}/results/${n}`, answer.result === 'sunk' ? { r: 'sunk', ship: answer.ship } : { r: answer.result })
      .catch(e => { if (!e.denied) online.answered.delete(n); hint(netError(e, 'Couldn\'t answer')); setTimeout(() => { syncing = syncing.then(sync); }, 3000); });
  }

  // play out every answered shot not shown yet, in order
  const answered = shotList(room).filter(s => s.result);
  while (online && online.shown < answered.length) {
    const s = answered[online.shown];
    online.shown++;
    await playOnlineShot(s);
  }
  if (!online) return;

  if (v.phase === 'over') return finishOnline(v);
  if (v.myTurn) {
    if (online.turnShown !== v.n) { online.turnShown = v.n; humanTurn(0); }
  } else {
    online.turnShown = -1;
    watch(v);
  }
}

/** The other player's turn (or waiting for their answer): the camera on your fleet, the boards can be looked at. */
function watch(v) {
  const them = theirName();
  const ago = v.seen ? Math.round((Date.now() - v.seen) / 60000) : 0;
  const away = ago >= 1 ? ` (last here ${ago} min ago)` : '';
  if (v.pending && v.pending.by === online.seat) setStatus(`Firing at ${label(v.pending.x, v.pending.y)}`, `Waiting for ${them} to answer${away}`);
  else setStatus('', `${them}'s turn${away}`);
  if (mode !== 'watching') {
    setMode('watching');
    if (!(v.pending && v.pending.by === online.seat)) world.view('home', 900 / speed).then(updateViewBtn);
  }
}

async function playOnlineShot(s) {
  busy = true;
  const mine = s.by === online.seat;
  const shot = s.result === 'sunk' ? { x: s.x, y: s.y, result: 'sunk', ship: s.ship } : { x: s.x, y: s.y, result: s.result };
  state.shots[mine ? 0 : 1].push(shot);
  setMode('waiting');
  if (mine) {
    setStatus('', `Firing at ${label(s.x, s.y)}…`);
    if (world.viewing !== 'target') await world.view('target', 700 / speed);
  } else {
    setStatus('', `${theirName()} fires at ${label(s.x, s.y)}…`);
    if (world.viewing !== 'home') await world.view('home', 900 / speed);
  }
  sound.launch();
  await world.shot(mine ? 'target' : 'home', shot);
  soundOf(shot);
  if (!mine && shot.result !== 'miss' && navigator.vibrate) try { navigator.vibrate(60); } catch (e) { /* no vibration */ }
  const w = shotWords(shot, mine, 0);
  toast(w.text, w.kind);
  updateFleets();
  await wait(shot.result === 'miss' ? 900 : 1200);
  busy = false;
}

async function readyOnline() {
  const fleet = draft.map(s => ({ ...s })), salt = newSalt();
  busy = true;
  setStatus('', 'Sending…');
  try {
    const hash = await fleetHash(fleet, salt);
    // kept here first: if the page closes just after the server has the fingerprint, the fleet isn't lost
    keep(ONLINE_KEY, { code: online.code, seat: online.seat, fleet, salt });
    try {
      await net.put(`${rooms(online.code)}/${online.seat}/hash`, hash);
    } catch (e) {
      // it may have got there even though the answer didn't come back
      const there = await net.get(`${rooms(online.code)}/${online.seat}/hash`).catch(() => null);
      if (there !== hash) throw e;
    }
    online.fleet = fleet;
    online.salt = salt;
    state.players[0].fleet = fleet;
    setMode('waiting');
    syncing = syncing.then(sync);
  } catch (e) {
    keep(ONLINE_KEY, { code: online.code, seat: online.seat, fleet: null, salt: null });
    toast(netError(e, 'Couldn\'t send your fleet'), 'miss');
    setStatus('', 'Place your fleet');
  } finally {
    busy = false;
  }
}

async function shootOnline() {
  const [x, y] = aimSq, n = online.room.n;
  aim(null);
  busy = true;
  setMode('waiting');
  setStatus('', `Firing at ${label(x, y)}…`);
  try {
    await net.patch(rooms(online.code), { [`shots/${n}`]: { x, y, by: online.seat }, n: n + 1 });
    online.turnShown = n;
  } catch (e) {
    toast(netError(e, 'Couldn\'t fire'), 'miss');
    online.turnShown = -1;
  }
  busy = false;
  syncing = syncing.then(sync);
}

async function finishOnline(v) {
  const them = otherSeat(online.seat);
  if (!online.finished) {
    online.finished = true;
    state.phase = 'over';
    state.winner = v.winner === 'me' ? 0 : 1;
    net.put(`${rooms(online.code)}/reveal/${online.seat}`, { fleet: fleetString(online.fleet), salt: online.salt }).catch(() => { online.finished = false; });
    busy = true;
    setMode('looking');
    const won = state.winner === 0;
    setStatus('Game over', won ? 'You won!' : `${theirName()} won`);
    sound.tune(won);
    await world.view('both', 1100 / speed);
    updateViewBtn();
    await wait(700);
    const { shots, hits } = tally(state, state.winner);
    $('overTitle').textContent = won ? 'You won! 🎉' : `${theirName()} won`;
    $('overText').textContent = won
      ? `You sank ${theirName()}'s whole fleet in ${shots} shots (${Math.round(hits / shots * 100)}% hits).`
      : `${theirName()} sank your fleet in ${shots} shots.`;
    $('overCheck').textContent = `Checking ${theirName()}'s answers…`;
    $('overCheck').className = 'check';
    $('overCheck').hidden = false;
    $('againBtn').textContent = 'New game';
    $('over').hidden = false;
    $('againBtn').focus();
    busy = false;
  }
  // when their fleet comes in, check it against every answer they gave, and show it
  if (!online.checked && online.room.reveal && online.room.reveal[them]) {
    online.checked = true;
    const result = await check(online.room, online.seat);
    if (result.fleet) {
      state.players[1].fleet = result.fleet;
      showSide(0, { reveal: true });
    }
    $('overCheck').textContent = result.ok
      ? `✓ ${theirName()}'s fleet matches every answer they gave.`
      : `⚠ Something doesn't add up: ${result.why}.`;
    $('overCheck').className = result.ok ? 'check ok' : 'check bad';
    keep(ONLINE_KEY, null);   // nothing left to carry on with
  }
}

$('hostBtn').addEventListener('click', () => { leaveOnline(); host(); });
$('joinForm').addEventListener('submit', e => { e.preventDefault(); leaveOnline(); join($('joinCode').value); });
$('joinCode').addEventListener('input', () => { $('joinCode').value = $('joinCode').value.toUpperCase().replace(/[^A-Z0-9]/g, ''); });
$('leaveBtn').addEventListener('click', () => { leaveOnline(); openMenu(); });
$('lobbyCancel').addEventListener('click', () => { leaveOnline(); openMenu(); });
$('shareBtn').addEventListener('click', async () => {
  const link = `${location.origin}${location.pathname}?join=${online.code}`;
  try {
    if (navigator.share) await navigator.share({ title: 'Battleships', text: `Play Battleships with me! The code is ${online.code}`, url: link });
    else { await navigator.clipboard.writeText(link); toast('Link copied'); }
  } catch (e) { /* closed the share sheet */ }
});
// say we're still here, so the other player can see how long ago we were; and keep "last here" up to date
setInterval(() => {
  if (!online || !online.room || document.visibilityState !== 'visible') return;
  net.patch(`${rooms(online.code)}/${online.seat}`, { seen: NOW }).catch(() => {});
  if (mode === 'watching') watch(view(online.room, online.seat));
}, 20000);

// ---------- start up ----------

const saved = load(SAVE_KEY, null);
if (validState(saved) && saved.phase !== 'over') state = saved;
world.show({ fleet: randomFleet(rng) });
world.view('both', 0);
openMenu();
// a shared link (?join=KQ7P): the code is filled in, ready to join
if (CODE_RE.test((params.get('join') || '').toUpperCase())) {
  $('joinCode').value = params.get('join').toUpperCase();
  $('joinCode').scrollIntoView({ block: 'center' });
  $('joinBtn').focus();
}

let lastFrame = performance.now(), t = 0;
function frame(now) {
  const dt = Math.min(0.05, (now - lastFrame) / 1000) * speed;
  lastFrame = now;
  t += dt;
  world.update(dt, t);
  world.render();
  requestAnimationFrame(frame);
}
// for the tests: the world, the game, and a way to speed things up
window.battleships = {
  world,
  get state() { return state; },
  get mode() { return mode; },
  get busy() { return busy; },
  setSpeed(s) { speed = s; },
  test: {
    draft: () => draft,
    setDraft(fleet) { draft = fleet; world.show({ fleet: draft }); },
    /** Hit every enemy square but one; returns that last square. */
    nearlyWon() {
      const enemy = state.players[1].fleet, squares = enemy.flatMap(cells), lastSq = squares.pop();
      for (const [x, y] of squares) state.shots[0].push(resolveShot(enemy, state.shots[0], x, y));
      save();
      showSide(0);
      return lastSq;
    },
  },
};
requestAnimationFrame(frame);

// Battleships: the menu, placing the fleet, taking turns, and the end of the game. The rules live in game.js and
// rules.js, the computer in ai.js, the 3D world in scene/. This file joins them up and runs the page.
//
// A turn is a little story told with awaits: aim, the shell flies, it lands, the camera swings across, the other
// side fires back. Nothing can be tapped while one plays (`busy`).
import { createWorld } from './scene/index.js';
import { preventZoom } from './nozoom.js';
import * as sound from './audio.js';
import { FLEET, randomFleet, fits, shipAt, shipName, shipLength, label, seededRandom, sunkIds, inBounds, cells, resolveShot } from './rules.js';
import { newGame, place, fire, fired, other, isComputer, validState, tally } from './game.js';
import { chooseShot } from './ai.js';

const params = new URLSearchParams(location.search);
const rng = params.has('seed') ? seededRandom(Number(params.get('seed')) || 1) : Math.random;
const SAVE_KEY = 'battleships.save.v1', STATS_KEY = 'battleships.stats.v1', PREFS_KEY = 'battleships.prefs.v1';
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
let mode = 'menu';    // 'menu' | 'placing' | 'aiming' | 'waiting' | 'handoff' | 'over' | 'looking'
let busy = false;
let aimSq = null;
let prefs = { level: 'normal', names: ['', ''], sound: true, ...load(PREFS_KEY, {}) };
sound.setSound(prefs.sound);

const save = () => keep(SAVE_KEY, state && state.phase !== 'over' ? state : null);
const nameOf = i => state.players[i].name;

// ---------- the HUD ----------

function setStatus(labelText, text) { $('statusLabel').textContent = labelText || ''; $('statusText').textContent = text; }
function setMode(m) {
  mode = m;
  $('shuffleBtn').hidden = $('readyBtn').hidden = m !== 'placing';
  $('fireBtn').hidden = m !== 'aiming';
  $('viewBtn').hidden = !['aiming', 'looking'].includes(m);
  $('fleets').hidden = !['aiming', 'waiting', 'looking'].includes(m);
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
  const saved = state && state.phase !== 'over' ? state : null;
  $('resumeBtn').hidden = $('resumeWhat').hidden = !saved;
  if (saved) {
    const shots = saved.shots[0].length + saved.shots[1].length;
    $('resumeWhat').textContent = (saved.mode === 'cpu' ? `Against the computer (${LEVEL_NAME[saved.level]})` : `${saved.players[0].name} against ${saved.players[1].name}`)
      + (saved.phase === 'placing' ? ', placing ships' : `, ${shots} shot${shots === 1 ? '' : 's'} fired`) + '. A new game ends this one.';
  }
  document.querySelectorAll('[data-level]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.level === prefs.level)));
  $('name1').value = prefs.names[0] || '';
  $('name2').value = prefs.names[1] || '';
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
$('resumeBtn').addEventListener('click', () => { closeMenu(); resume(); });
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
  if (fired(state, viewer, ...sq)) { toast(`Already fired at ${label(...sq)}`, 'miss'); return; }
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
  $('over').hidden = false;
  $('againBtn').focus();
  busy = false;
}
$('againBtn').addEventListener('click', () => {
  $('over').hidden = true;
  start({ mode: state.mode, level: state.level, names: state.players.map(p => p.name) });
});
$('lookBtn').addEventListener('click', () => { $('over').hidden = true; setMode('looking'); });
$('overMenuBtn').addEventListener('click', openMenu);

// ---------- start up ----------

const saved = load(SAVE_KEY, null);
if (validState(saved) && saved.phase !== 'over') state = saved;
world.show({ fleet: randomFleet(rng) });
world.view('both', 0);
openMenu();

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

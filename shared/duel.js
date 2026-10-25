// Two phones, one game: Connect 4 or Tic-Tac-Toe played across two devices through a room in the Game Zone
// database. One player starts a game and gets a four-letter code; the other types the code in. The room holds
// the moves; each phone works out the board from them, so a reload (or a dropped connection) just picks up again.
//
// duels/CODE = {
//   created, game: 'c4' | 'ttt', round, count,       count: moves made so far in this round
//   a: { uid, name, left? }, b: { uid, name, left? }, a starts the game, b joins it
//   moves: { [round]: { [i]: column or square } },
// }
// The rounds take turns going first (a in round 0, b in round 1, ...). The rules in battleships/database.rules.json
// check that only the two players write, each on their own turn, one move at a time.
import { createFirebase, NOW } from './firebase.js';

const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';   // no I, O, 0 or 1: easy to read out
export const CODE_RE = /^[A-HJ-NP-Z2-9]{4}$/;
export const newCode = (rng = Math.random) => Array.from({ length: 4 }, () => CODE_CHARS[Math.floor(rng() * CODE_CHARS.length)]).join('');
const GAME_NAMES = { c4: 'Connect 4', ttt: 'Tic-Tac-Toe' };
const NAME_KEY = 'gamezone.name.v1';

/** Whose move number i of a round is. */
export const mover = (round, i) => ((round + i) % 2 === 0 ? 'a' : 'b');
export const otherSeat = seat => (seat === 'a' ? 'b' : 'a');

/** The moves of the round being played, in order. */
export function movesOf(room) {
  const m = (room.moves && room.moves[room.round]) || [];
  const out = [];
  for (let i = 0; i < (room.count || 0) && m[i] !== undefined; i++) out.push(m[i]);
  return out;
}

const STYLE = `
  .duel { width: min(420px, 100%); margin: 0 auto 12px; text-align: center; }
  .duel[hidden] { display: none; }
  .duel-card { padding: 14px; border-radius: 12px; background: rgba(0, 0, 0, .25); border: 1px solid rgba(255, 255, 255, .15); }
  .duel h2 { margin: 0 0 10px; font-size: 18px; }
  .duel p { margin: 6px 0; font-size: 14px; opacity: .9; }
  .duel .row { display: flex; gap: 8px; margin: 8px 0; }
  .duel input { flex: 1; min-width: 0; font: inherit; font-size: 16px; padding: 9px 10px; border-radius: 8px; border: 1px solid rgba(255, 255, 255, .3); background: rgba(255, 255, 255, .92); color: #222; }
  .duel input.code { text-transform: uppercase; letter-spacing: .25em; text-align: center; font-weight: bold; }
  .duel button { font: inherit; font-size: 15px; font-weight: bold; padding: 9px 14px; border-radius: 8px; border: 0; cursor: pointer; background: var(--duel-accent, #ff7043); color: #1b1b1b; }
  .duel button.quiet { background: transparent; color: inherit; border: 1px solid rgba(255, 255, 255, .35); font-weight: normal; }
  .duel button:disabled { opacity: .5; cursor: default; }
  .duel .big-code { font-size: 40px; font-weight: bold; letter-spacing: .2em; margin: 6px 0; color: var(--duel-accent, #ff7043); }
  .duel .error { color: #ffb4a8; min-height: 1em; }
  .duel .bar { display: flex; align-items: center; justify-content: space-between; gap: 8px; font-size: 14px; }
  .duel .bar button { padding: 5px 10px; font-size: 13px; }
  .duel .warn { color: #ffd166; }
`;

/**
 * Online play for one game, drawn into `mount`. `game` is 'c4' or 'ttt'; `colours` names each seat's pieces
 * ({ a: 'Red', b: 'Yellow' }). onState({ playing, seat, round, moves, names, left, connection }) is called whenever
 * anything changes; onExit() when the player would rather play on one device.
 * Returns { show(), hide(), move(value), rematch(), leave() }.
 */
export function createDuel({ game, mount, colours, onState, onExit }) {
  if (!document.getElementById('duel-style')) {
    const st = document.createElement('style');
    st.id = 'duel-style';
    st.textContent = STYLE;
    document.head.appendChild(st);
  }
  mount.classList.add('duel');
  mount.hidden = true;
  const SAVE_KEY = `gamezone.duel.${game}.v1`;
  const db = createFirebase();
  let me = null, code = null, room = null, stop = null, connection = 'live', busy = false, error = '';
  const store = {
    get: k => { try { return localStorage.getItem(k); } catch { return null; } },
    set: (k, v) => { try { if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch { /* not kept */ } },
  };
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const seatOf = r => (r && r.a && r.a.uid === me ? 'a' : r && r.b && r.b.uid === me ? 'b' : null);

  function friendly(e) {
    if (e && e.status === 0) return 'offline';
    return (e && e.message) || 'Something went wrong';
  }

  // ---------- what's shown ----------

  function draw() {
    const seat = seatOf(room);
    mount.hidden = false;
    if (!room || !seat) {
      const saved = store.get(SAVE_KEY);
      const offline = error === 'offline' || !navigator.onLine;
      mount.innerHTML = `<div class="duel-card">
        <h2>📱 Play on two phones</h2>
        ${offline ? `<p class="warn">Can't reach the internet, so this needs the same Wi-Fi or data on both phones.</p>
          <div class="row"><button type="button" data-do="retry">Try again</button><button type="button" class="quiet" data-do="exit">Play on one phone</button></div>`
        : `<div class="row"><input id="duelName" maxlength="14" placeholder="Your name" autocomplete="nickname" value="${esc(store.get(NAME_KEY) || '')}"></div>
          <div class="row"><button type="button" data-do="start" style="flex:1">Start a game</button></div>
          <p>or join one: type the code from the other phone</p>
          <div class="row"><input id="duelCode" class="code" maxlength="4" placeholder="CODE" autocomplete="off" autocapitalize="characters"><button type="button" data-do="join">Join</button></div>
          ${saved ? `<div class="row"><button type="button" class="quiet" data-do="rejoin" style="flex:1">Back to game ${esc(saved)}</button></div>` : ''}
          <p class="error" role="alert">${esc(error)}</p>
          <div class="row"><button type="button" class="quiet" data-do="exit" style="flex:1">Play on one phone instead</button></div>`}
      </div>`;
      return;
    }
    const other = otherSeat(seat);
    if (!room.b) {
      mount.innerHTML = `<div class="duel-card">
        <h2>Waiting for the other player</h2>
        <p>On the other phone, open ${GAME_NAMES[game]}, pick 📱 Two phones and type in</p>
        <div class="big-code" id="duelBigCode">${esc(code)}</div>
        <div class="row"><button type="button" class="quiet" data-do="leave" style="flex:1">Cancel</button></div>
      </div>`;
      return;
    }
    const left = room[other].left;
    mount.innerHTML = `<div class="bar">
      <span>You (${colours[seat]}) vs <b>${esc(room[other].name)}</b> (${colours[other]}) · <span id="duelRoom">${esc(code)}</span></span>
      <button type="button" class="quiet" data-do="leave">Leave</button>
    </div>
    ${left ? `<p class="warn">${esc(room[other].name)} has left the game.</p>` : ''}
    ${connection !== 'live' ? '<p class="warn">Reconnecting…</p>' : ''}
    ${error ? `<p class="error" role="alert">${esc(error === 'offline' ? 'Can\'t reach the internet: trying again…' : error)}</p>` : ''}`;
  }

  function tell() {
    const seat = seatOf(room);
    const playing = !!(room && seat && room.b);
    onState(playing ? {
      playing, seat, round: room.round, moves: movesOf(room), connection,
      names: { a: room.a.name, b: room.b.name }, left: !!room[otherSeat(seat)].left,
    } : { playing: false });
  }
  const update = () => { draw(); tell(); };

  // ---------- rooms ----------

  function follow(c) {
    if (stop) stop();
    code = c;
    store.set(SAVE_KEY, c);
    stop = db.listen(`duels/${c}`, value => {
      room = value;
      if (!room || !seatOf(room)) {   // gone (cleared after a day), or not ours
        store.set(SAVE_KEY, null);
        if (stop) stop();
        stop = null;
        room = null;
        error = 'That game has finished';
      }
      update();
    }, state => { connection = state; draw(); tell(); });
  }

  const nameOk = () => {
    const name = (mount.querySelector('#duelName')?.value || '').trim();
    if (!name) { error = 'Type your name first'; draw(); mount.querySelector('#duelName')?.focus(); return null; }
    store.set(NAME_KEY, name);
    return name;
  };

  async function start() {
    const name = nameOk();
    if (!name || busy) return;
    busy = true;
    error = '';
    try {
      me = await db.uid();
      for (let tries = 0; ; tries++) {
        const c = newCode();
        try {
          await db.put(`duels/${c}`, { created: NOW, game, round: 0, count: 0, a: { uid: me, name } });
          follow(c);
          break;
        } catch (e) {
          if (!e.denied || tries >= 5) throw e;   // that code is taken: another one
        }
      }
    } catch (e) {
      error = friendly(e);
      draw();
    } finally {
      busy = false;
    }
  }

  async function join(c) {
    c = (c || '').trim().toUpperCase();
    if (!CODE_RE.test(c)) { error = 'A code is four letters and numbers'; draw(); return; }
    const name = nameOk();
    if (!name || busy) return;
    busy = true;
    error = '';
    try {
      me = await db.uid();
      const r = await db.get(`duels/${c}`);
      if (!r) throw new Error(`There's no game ${c}: check the code`);
      if (r.game !== game) throw new Error(`${c} is a game of ${GAME_NAMES[r.game] || 'something else'}`);
      if (!seatOf(r)) {
        if (r.b) throw new Error(`${c} already has two players`);
        await db.put(`duels/${c}/b`, { uid: me, name });
      }
      follow(c);
    } catch (e) {
      error = friendly(e);
      draw();
    } finally {
      busy = false;
    }
  }

  async function rejoin() {
    const c = store.get(SAVE_KEY);
    if (!c || busy) return;
    busy = true;
    error = '';
    try {
      me = await db.uid();
      const r = await db.get(`duels/${c}`);
      if (!r || !seatOf(r)) { store.set(SAVE_KEY, null); throw new Error('That game has finished'); }
      follow(c);
    } catch (e) {
      error = friendly(e);
      draw();
    } finally {
      busy = false;
    }
  }

  function leave() {
    const seat = seatOf(room);
    if (seat && code) db.put(`duels/${code}/${seat}/left`, true).catch(() => {});
    if (stop) stop();
    stop = null;
    room = null;
    code = null;
    error = '';
    store.set(SAVE_KEY, null);
    update();
  }

  mount.addEventListener('click', e => {
    const what = e.target.closest('[data-do]')?.dataset.do;
    if (what === 'start') start();
    else if (what === 'join') join(mount.querySelector('#duelCode').value);
    else if (what === 'rejoin') rejoin();
    else if (what === 'leave') leave();
    else if (what === 'retry') { error = ''; draw(); }
    else if (what === 'exit') onExit();
  });
  mount.addEventListener('keydown', e => {
    if (e.key !== 'Enter') return;
    if (e.target.id === 'duelCode') join(e.target.value);
    else if (e.target.id === 'duelName') start();
  });
  window.addEventListener('online', () => { if (error === 'offline') error = ''; if (!mount.hidden) draw(); });
  window.addEventListener('offline', () => { if (!mount.hidden) draw(); });

  return {
    /** Show the panel; a game in progress on this phone carries on. */
    show() {
      error = '';
      update();
      if (store.get(SAVE_KEY) && navigator.onLine) rejoin();
    },
    /** Stop showing and following (another mode was picked). The game is kept to come back to. */
    hide() {
      if (stop) stop();
      stop = null;
      room = null;
      mount.hidden = true;
      mount.innerHTML = '';
    },
    /** Make a move (a column or a square), if it's this phone's turn. */
    async move(value) {
      const seat = seatOf(room);
      if (!room || !seat || !room.b || busy) return false;
      const i = room.count || 0;
      if (mover(room.round, i) !== seat) return false;
      busy = true;
      try {
        await db.patch(`duels/${code}`, { [`moves/${room.round}/${i}`]: value, count: i + 1 });
        error = '';
        return true;
      } catch (e) {
        error = friendly(e);
        draw();
        return false;
      } finally {
        busy = false;
      }
    },
    /** Another round, the other player going first. (If both ask at once, the second is refused: that's fine.) */
    rematch() {
      if (room && seatOf(room)) db.patch(`duels/${code}`, { round: room.round + 1, count: 0 }).catch(() => {});
    },
    leave,
  };
}

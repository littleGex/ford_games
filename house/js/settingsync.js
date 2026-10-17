// The family's settings kept the same on every device with the game token: names, she/he/they, who's in the
// family, looks, which jobs are on and who sleeps where, through the family server (fordDbs: GET and PUT /v1/game/settings). Birthdays come from the
// server separately (familyserver.js); the share link stays as the way to do it without a server.
//
// The server keeps one copy with a version number. A device saves with the version it last saw; if another device
// saved in between, the server answers 409 with its copy. Then this device takes the server's copy and puts back
// only what was changed here since the last sync (each player's name and look, the jobs, the bedrooms are
// separate), and saves again. So Mum renaming Dude on her phone and P switching off the dragon on the tablet both
// stick.
//
// The game never waits for the server: it pulls when it opens and when it comes back to the front, and pushes a
// couple of seconds after a change (looks change a click at a time). Offline, everything works as before and the
// changes go up next time.
import { FAMILY_URL, gameToken } from './familyserver.js';
import { DEFAULT_LOOKS, PLAYER_KEYS } from './players.js';
import { GROWN_UPS } from './names.js';

export const SETTINGS_URL = FAMILY_URL.replace(/\/family$/, '/settings');
const STATE_KEY = 'fordHouse.settingsSync.v1';
const FIELDS = [...PLAYER_KEYS.flatMap(k => [`${k}.name`, `${k}.pronoun`, `${k}.look`, ...(GROWN_UPS.includes(k) ? [`${k}.away`] : [])]), 'off', 'swapRooms'];
// without the fields a family server may not know yet (fordDbs before 2.9.0: swapRooms; before 2.10.0: pronoun
// and away)
const withoutNewer = doc => ({ ...doc, players: Object.fromEntries(Object.entries(doc.players).map(([k, p]) => {
  const q = { ...p }; delete q.pronoun; delete q.away; return [k, q];
})), swapRooms: undefined });

// --- the settings as a document, field by field (a field the document doesn't have is undefined)
function field(doc, f) {
  if (!doc) return undefined;
  if (f === 'off') return Array.isArray(doc.off) ? [...doc.off].sort() : undefined;
  if (f === 'swapRooms') return typeof doc.swapRooms === 'boolean' ? doc.swapRooms : undefined;
  const [k, part] = f.split('.'), p = doc.players && doc.players[k];
  if (!p) return undefined;
  if (part === 'name') return p.name || null;
  if (part === 'pronoun') return 'pronoun' in p ? p.pronoun || null : undefined;
  if (part === 'away') return typeof p.away === 'boolean' ? p.away : undefined;
  return p.look ? { ...DEFAULT_LOOKS[k], ...p.look } : undefined;   // a look may leave fields out: the usual ones
}
function setField(doc, f, v) {
  if (v === undefined) return;
  if (f === 'off' || f === 'swapRooms') { doc[f] = v; return; }
  const [k, part] = f.split('.');
  doc.players[k] = doc.players[k] || {};
  doc.players[k][part] = v;
}
/** The same value? Colours compare in lower case; key order doesn't matter. */
const canon = v => JSON.stringify(v, (k, x) => (x && typeof x === 'object' && !Array.isArray(x)
  ? Object.fromEntries(Object.keys(x).sort().map(key => [key, x[key]]))
  : typeof x === 'string' && /^#[0-9a-f]{6}$/i.test(x) ? x.toLowerCase() : x));
const same = (a, b) => canon(a) === canon(b);

/** The settings to save: the server's copy, with what was changed here since the last sync put back on top.
 *  Never synced on this device: the server's copy wins (another device set the family up first). */
export function mergeSettings(base, local, remote) {
  if (!remote) return local;
  const out = { players: {} };
  for (const f of FIELDS) {
    const l = field(local, f), r = field(remote, f);
    const changedHere = base && !same(l, field(base, f));
    setField(out, f, r === undefined || changedHere ? l : r);
  }
  return out;
}

export function createSettingsSync({ players, settings, familyServer }, {
  fetch = globalThis.fetch && globalThis.fetch.bind(globalThis), url = SETTINGS_URL, timeout = 8000,
  now = () => new Date(), wait = 2500, onApplied = () => {},
} = {}) {
  let state = (() => { try { return JSON.parse(localStorage.getItem(STATE_KEY)) || null; } catch (e) { return null; } })();
  let status = state && state.status || null, busy = null, again = false, applying = false, timer = null, lastPull = 0;
  const listeners = [];
  const keep = () => { try { localStorage.setItem(STATE_KEY, JSON.stringify(state)); } catch (e) { /* private mode */ } };
  const setStatus = s => { status = s; state = { ...(state || {}), status: s }; keep(); listeners.forEach(fn => fn(s)); return s; };
  const stamp = () => now().toISOString();

  /** This device's settings, as the server keeps them. */
  function localDoc() {
    const doc = { players: {}, off: settings.offGroups(), swapRooms: settings.roomsSwapped() };
    for (const k of PLAYER_KEYS) {
      doc.players[k] = { name: players.customName(k), pronoun: players.customPronoun(k), look: { ...players.look(k) } };
      if (GROWN_UPS.includes(k)) doc.players[k].away = !players.inFamily(k);
    }
    return doc;
  }

  /** Use the server's settings here (only what's different, and only fields the server has). */
  function apply(doc) {
    const local = localDoc();
    const differs = FIELDS.filter(f => field(doc, f) !== undefined && !same(field(doc, f), field(local, f)))
      .sort((a, b) => (a.endsWith('.away') && field(doc, a) === false ? -1 : 0) - (b.endsWith('.away') && field(doc, b) === false ? -1 : 0));   // anyone coming back first: there's always a grown-up
    if (!differs.length) return false;
    applying = true;
    try {
      for (const f of differs) {
        const v = field(doc, f);
        if (f === 'off') settings.setOffGroups(v);
        else if (f === 'swapRooms') settings.setRoomsSwapped(v);
        else {
          const [k, part] = f.split('.');
          if (part === 'name') players.setName(k, v || '');
          else if (part === 'pronoun') players.setPronoun(k, v);
          else if (part === 'away') players.setInFamily(k, !v);
          else players.setLook(k, v);
        }
      }
    } finally { applying = false; }
    onApplied();
    return true;
  }

  async function call(method, body) {
    const ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const t = ctrl ? setTimeout(() => ctrl.abort(), timeout) : null;
    try {
      const res = await fetch(url, {
        method, cache: 'no-store', signal: ctrl ? ctrl.signal : undefined,
        headers: { Authorization: `Bearer ${gameToken()}`, ...(body ? { 'Content-Type': 'application/json' } : {}) },
        ...(body ? { body: JSON.stringify(body) } : {}),
      });
      let json = null;
      try { json = await res.json(); } catch (e) { /* no body */ }
      return { status: res.status, ok: res.ok, json };
    } finally { if (t) clearTimeout(t); }
  }

  async function run() {
    if (!gameToken() || !fetch) return status;
    try {
      let got = await call('GET');
      if (got.status === 401 || got.status === 403) return setStatus({ ok: false, at: stamp(), message: 'The family server didn\'t accept the token' });
      if (!got.ok) return setStatus({ ok: false, at: stamp(), message: `The family server answered ${got.status}` });
      let version = got.json.version, remote = got.json.settings, pushed = false, older = false;
      for (let tries = 0; tries < 4; tries++) {
        let want = mergeSettings(state && state.synced, localDoc(), remote);
        if (older) { want = JSON.parse(JSON.stringify(withoutNewer(want))); }
        if (remote && FIELDS.every(f => field(want, f) === undefined || same(field(want, f), field(remote, f)))) break;
        const put = await call('PUT', { base_version: version, settings: want });
        if (put.status === 409 && put.json) { version = put.json.version; remote = put.json.settings; continue; }
        // an older family server that doesn't know the newer fields yet: save the rest without them
        if (put.status === 422 && !older) { older = true; continue; }
        if (put.status === 429) return setStatus({ ok: false, at: stamp(), message: 'Lots of changes: the rest go to the family server in a minute' });
        if (!put.ok) return setStatus({ ok: false, at: stamp(), message: `The family server didn't save the settings (${put.status})` });
        version = put.json.version; remote = put.json.settings; pushed = true;
        break;
      }
      const changed = remote ? apply(remote) : false;
      state = { ...(state || {}), version, synced: remote };
      keep();
      lastPull = Date.now();
      return setStatus({ ok: true, at: stamp(), message: changed ? 'Updated from the family server' : pushed ? 'Saved on the family server' : 'The same as on the family server' });
    } catch (e) {
      return setStatus({ ok: false, at: stamp(), message: 'Couldn\'t reach the family server (offline?): changes go up next time' });
    }
  }

  /** Sync now: pull, merge, push if needed. One at a time; a sync asked for meanwhile runs straight after. */
  function sync() {
    if (busy) { again = true; return busy; }
    busy = run().finally(() => {
      busy = null;
      if (again) { again = false; sync(); }
    });
    return busy;
  }

  /** Something changed here: push it after a short pause (several quick changes go up together). */
  function soon() {
    if (applying || !gameToken()) return;
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => { timer = null; sync(); }, wait);
  }
  players.onChange(soon);
  settings.onChange(soon);
  // the token was just typed in (or the birthdays synced at start-up): the settings too
  if (familyServer) familyServer.onStatus(s => { if (s && s.ok) sync(); });
  // back to the game after a while on another device: see what changed
  if (globalThis.document && document.addEventListener) {
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && Date.now() - lastPull > 20000) sync();
    });
  }

  return {
    sync,
    get status() { return status; },
    get version() { return state && state.version || 0; },
    get connected() { return !!gameToken(); },
    onStatus(fn) { listeners.push(fn); },
    localDoc,
  };
}

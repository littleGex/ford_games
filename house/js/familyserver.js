// The family's birthdays from the family server (fordDbs on the home server: GET /v1/game/family). A parent
// types the game token in once per device (the looks card); it's kept on that device only, never in this
// repository. The game never waits for the server: it asks in the background, with a short time limit, and
// keeps the last birthdays it got. Without a token, or offline, the birthdays typed into the editor are used.
export const FAMILY_URL = 'https://api-pocket-money.ford-home-apps.com/v1/game/family';
const TOKEN_KEY = 'fordHouse.gameToken.v1', STATUS_KEY = 'fordHouse.familySync.v1';
const KEYS = ['dad', 'mum', 'girl', 'boy'];
const get = k => { try { return localStorage.getItem(k); } catch (e) { return null; } };
/** The game token saved on this device (null without one); settingsync.js uses it too. */
export const gameToken = () => get(TOKEN_KEY);
const put = (k, v) => { try { if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) { /* private mode */ } };

export function createFamilyServer(players, { fetch = globalThis.fetch && globalThis.fetch.bind(globalThis), url = FAMILY_URL, timeout = 6000, now = () => new Date() } = {}) {
  let status = (() => { try { return JSON.parse(get(STATUS_KEY)) || null; } catch (e) { return null; } })();
  const listeners = [];
  const setStatus = s => { status = s; put(STATUS_KEY, JSON.stringify(s)); listeners.forEach(fn => fn(s)); return s; };

  /** Ask the server for the birthdays now. Resolves to the new status: { ok, at, message }. */
  async function sync() {
    const token = get(TOKEN_KEY);
    if (!token) return status;
    if (!fetch) return status;
    const ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timer = ctrl ? setTimeout(() => ctrl.abort(), timeout) : null;
    try {
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` }, signal: ctrl ? ctrl.signal : undefined, cache: 'no-store' });
      if (res.status === 401 || res.status === 403) return setStatus({ ok: false, at: now().toISOString(), message: 'The family server didn\'t accept the token' });
      if (!res.ok) return setStatus({ ok: false, at: now().toISOString(), message: `The family server answered ${res.status}` });
      const body = await res.json();
      let n = 0;
      for (const p of (body && body.players) || []) {
        if (!KEYS.includes(p.key) || !/^\d{4}-\d{2}-\d{2}$/.test(p.birthday || '')) continue;
        if (players.birthday(p.key) !== p.birthday) players.setBirthday(p.key, p.birthday);
        n++;
      }
      return setStatus({ ok: true, at: now().toISOString(), message: `${n} birthday${n === 1 ? '' : 's'} from the family server` });
    } catch (e) {
      return setStatus({ ok: false, at: now().toISOString(), message: 'Couldn\'t reach the family server (offline?), using the birthdays saved here' });
    } finally {
      if (timer) clearTimeout(timer);
    }
  }

  return {
    sync,
    get connected() { return !!get(TOKEN_KEY); },
    get status() { return status; },
    /** Save the token on this device and fetch straight away. */
    connect(token) { put(TOKEN_KEY, (token || '').trim() || null); return sync(); },
    /** Forget the token (the birthdays stay as they are). */
    disconnect() { put(TOKEN_KEY, null); setStatus(null); },
    onStatus(fn) { listeners.push(fn); },
  };
}

// The Battleships database (its own Firebase project, ford-battleships), spoken to with plain REST calls and
// the database's streaming (EventSource), with no Firebase SDK, the same way the other games use theirs.
//
// Each device signs in anonymously once and keeps its sign-in (the refresh token) in localStorage, so it's the
// same player after a reload and can take its seat in a game again. The ID token lasts an hour and is renewed a
// few minutes before it runs out. The database rules (battleships/database.rules.json) check every write.
//
// Tests swap the whole thing for a stand-in (window.__battleshipsFakeDb) so they never touch the real database.
export const CONFIG = {
  apiKey: 'AIzaSyBai-IEp6NwycKIrFdfQQrdlKfuVgiVs0k',
  dbUrl: 'https://ford-battleships-default-rtdb.europe-west1.firebasedatabase.app',
};
const AUTH_KEY = 'battleships.auth.v1';
const TIMEOUT = 10000;

/** A server timestamp: the database fills in its own clock. */
export const NOW = { '.sv': 'timestamp' };

export class DbError extends Error {
  constructor(message, status) { super(message); this.status = status; }
  get denied() { return this.status === 401 || this.status === 403; }
}

async function fetchJson(url, options = {}) {
  const ctrl = new AbortController(), timer = setTimeout(() => ctrl.abort(), TIMEOUT);
  try {
    const res = await fetch(url, { ...options, signal: ctrl.signal, cache: 'no-store' });
    const body = await res.json().catch(() => null);
    if (!res.ok) throw new DbError((body && (body.error && body.error.message || body.error)) || `HTTP ${res.status}`, res.status);
    return body;
  } catch (e) {
    if (e instanceof DbError) throw e;
    throw new DbError('Couldn\'t reach the game server (offline?)', 0);
  } finally {
    clearTimeout(timer);
  }
}

export function createFirebase({ apiKey, dbUrl } = CONFIG) {
  if (typeof window !== 'undefined' && window.__battleshipsFakeDb) return window.__battleshipsFakeDb;

  let auth = (() => { try { return JSON.parse(localStorage.getItem(AUTH_KEY)); } catch (e) { return null; } })();
  const keep = () => { try { localStorage.setItem(AUTH_KEY, JSON.stringify(auth)); } catch (e) { /* private mode */ } };
  let pending = null;

  async function signIn() {
    if (auth && auth.refreshToken) {
      try {
        const body = new URLSearchParams({ grant_type: 'refresh_token', refresh_token: auth.refreshToken });
        const r = await fetchJson(`https://securetoken.googleapis.com/v1/token?key=${apiKey}`, { method: 'POST', body });
        auth = { uid: r.user_id, idToken: r.id_token, refreshToken: r.refresh_token, expires: Date.now() + Number(r.expires_in) * 1000 };
        keep();
        return auth;
      } catch (e) {
        if (!e.status) throw e;   // offline: try again later with the same sign-in
        // the sign-in was refused (deleted?): start again as a new player
      }
    }
    const r = await fetchJson(`https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${apiKey}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ returnSecureToken: true }),
    });
    auth = { uid: r.localId, idToken: r.idToken, refreshToken: r.refreshToken, expires: Date.now() + Number(r.expiresIn) * 1000 };
    keep();
    return auth;
  }
  /** A token good for at least the next five minutes. */
  async function token() {
    if (auth && auth.idToken && auth.expires - Date.now() > 5 * 60 * 1000) return auth.idToken;
    pending = pending || signIn().finally(() => { pending = null; });
    return (await pending).idToken;
  }
  const url = async (path, query = {}) => {
    const q = new URLSearchParams({ ...query, auth: await token() });
    return `${dbUrl}/${path}.json?${q}`;
  };
  const send = async (method, path, value) => fetchJson(await url(path), {
    method, headers: { 'Content-Type': 'application/json' }, body: value === undefined ? undefined : JSON.stringify(value),
  });

  return {
    async uid() { await token(); return auth.uid; },
    get: async path => fetchJson(await url(path)),
    put: (path, value) => send('PUT', path, value),
    patch: (path, value) => send('PATCH', path, value),
    remove: path => send('DELETE', path),

    /**
     * Follow a path as it changes: onValue(value) is called with the whole value at first and after every change.
     * onState('live' | 'reconnecting') says whether the stream is connected. Returns a function that stops it.
     */
    listen(path, onValue, onState = () => {}) {
      let value = null, source = null, stopped = false, retry = 1000;
      const setAt = (p, v, merge) => {
        const parts = p.split('/').filter(Boolean);
        if (!parts.length) { value = merge ? { ...(value || {}), ...v } : v; return; }
        value = value && typeof value === 'object' ? value : {};
        let node = value;
        for (const part of parts.slice(0, -1)) { node[part] = node[part] && typeof node[part] === 'object' ? node[part] : {}; node = node[part]; }
        const last = parts[parts.length - 1];
        if (merge) node[last] = { ...(node[last] || {}), ...v };
        else if (v === null) delete node[last];
        else node[last] = v;
      };
      async function open() {
        if (stopped) return;
        let src;
        try { src = new EventSource(await url(path)); } catch (e) { return again(); }
        if (stopped) { src.close(); return; }
        source = src;
        const take = (merge) => e => {
          retry = 1000;
          onState('live');
          const { path: p, data } = JSON.parse(e.data);
          if (merge) for (const [k, v] of Object.entries(data || {})) setAt(`${p}/${k}`, v, false);
          else setAt(p, data, false);
          onValue(value);
        };
        src.addEventListener('put', take(false));
        src.addEventListener('patch', take(true));
        // the token ran out or the rules changed: open again with a fresh token
        src.addEventListener('auth_revoked', () => { src.close(); open(); });
        src.addEventListener('cancel', () => { src.close(); again(); });
        src.onerror = () => { if (src.readyState === EventSource.CLOSED) again(); else onState('reconnecting'); };
      }
      function again() {
        onState('reconnecting');
        if (!stopped) setTimeout(open, retry);
        retry = Math.min(retry * 2, 15000);
      }
      open();
      return () => { stopped = true; if (source) source.close(); };
    },
  };
}

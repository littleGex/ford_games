// House settings, saved on this device: which jobs are on (a family without a bearded dragon switches the
// dragon off; Halloween, Christmas and birthday parties can be switched off too), and the share link that
// copies the family's names, looks, birthdays and these settings to another phone or tablet.
//
// The share link carries everything in the part after # (which browsers never send to a server, so it doesn't
// reach GitHub Pages either). It never includes the family server's game token. Whatever comes in a link is
// checked before it's used: only the four players, cleaned-up names, known hair styles, colours as #rrggbb,
// real dates, and known job groups.
import { cleanName, nameOf, possessive } from './names.js';
import { PLAYER_KEYS, HAIR_STYLES } from './players.js';

// The jobs that can be switched off, in groups as they'd be thought of
export const JOB_GROUPS = [
  { id: 'dragon', icon: '🦎', get label() { return `${possessive('girl')} bearded dragon`; }, jobs: ['feedDragon', 'playDragon', 'cleanDragon'] },
  { id: 'keyboard', icon: '🎹', label: 'Keyboard practice', jobs: ['music'] },
  { id: 'clarinet', icon: '🎵', get label() { return `${possessive('boy')} clarinet`; }, jobs: ['clarinet'] },
  { id: 'bike', icon: '🚲', get label() { return `Fixing ${possessive('girl')} bike`; }, jobs: ['fixBike'] },
  { id: 'solar', icon: '☀️', label: 'Solar panels on the shed', jobs: ['solar'] },
  { id: 'car', icon: '🔌', label: 'Charging the electric car', jobs: ['car'] },
  { id: 'shave', icon: '🪒', get label() { return `${nameOf('dad')} shaving`; }, jobs: ['shave'] },
  { id: 'loft', icon: '📦', label: 'Boxes up and down the loft', jobs: ['loftUp', 'loftDown'] },
  { id: 'halloween', icon: '🎃', label: 'Halloween', tags: ['halloween'] },
  { id: 'christmas', icon: '🎄', label: 'Christmas and the Advent calendars',
    tags: ['advent', 'adventDoor', 'christmas', 'christmasTime', 'beforeChristmas', 'christmasEve', 'christmasEnd'] },
  { id: 'birthdays', icon: '🎂', label: 'Birthday parties', birthdays: true },
];
const GROUP_IDS = JOB_GROUPS.map(g => g.id);
const KEY = 'fordHouse.settings.v1';

export function createSettings() {
  const listeners = [];
  let off = new Set();
  try { off = new Set((JSON.parse(localStorage.getItem(KEY)) || {}).off || []); } catch (e) { /* nothing saved */ }
  off = new Set([...off].filter(id => GROUP_IDS.includes(id)));
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify({ off: [...off] })); } catch (e) { /* private mode */ } };
  const groups = () => JOB_GROUPS.filter(g => off.has(g.id));

  return {
    isOn: id => !off.has(id),
    /** Switch a group of jobs on or off. */
    set(id, on) { if (!GROUP_IDS.includes(id)) return; if (on) off.delete(id); else off.add(id); save(); listeners.forEach(fn => fn()); },
    /** The groups that are off, by id. */
    offGroups: () => [...off],
    setOffGroups(ids) { off = new Set(ids.filter(id => GROUP_IDS.includes(id))); save(); listeners.forEach(fn => fn()); },
    /** The job ids that are switched off. */
    offJobs: () => new Set(groups().flatMap(g => g.jobs || [])),
    /** A day's tags without the special days that are switched off. */
    filterTags(tags) { const no = new Set(groups().flatMap(g => g.tags || [])); return [].concat(tags || []).filter(t => !no.has(t)); },
    birthdaysOn: () => !off.has('birthdays'),
    onChange(fn) { listeners.push(fn); },
  };
}

// --- the share link
const HEX = /^#[0-9a-f]{6}$/i;
const toBase64Url = text => {
  let bin = '';
  new TextEncoder().encode(text).forEach(b => { bin += String.fromCharCode(b); });
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};
const fromBase64Url = code => {
  const bin = atob(code.replace(/-/g, '+').replace(/_/g, '/'));
  return new TextDecoder().decode(Uint8Array.from(bin, ch => ch.charCodeAt(0)));
};

/** The code for the link: everyone's name (if they have their own), look and birthday, and the jobs that are off. */
export function shareCode(players, settings) {
  const p = {};
  for (const k of PLAYER_KEYS) {
    p[k] = { l: players.look(k) };
    if (players.customName(k)) p[k].n = players.customName(k);
    if (players.birthday(k)) p[k].b = players.birthday(k);
  }
  return toBase64Url(JSON.stringify({ v: 1, p, off: settings.offGroups() }));
}

/** A look as it may come in a link: only the fields a look has, each a value it can really take. */
function cleanLook(look) {
  if (!look || typeof look !== 'object') return null;
  const out = {};
  for (const f of ['skin', 'hairColor', 'pants', 'shoes']) if (typeof look[f] === 'string' && HEX.test(look[f])) out[f] = look[f].toLowerCase();
  if (look.top === 'own' || (typeof look.top === 'string' && HEX.test(look.top))) out.top = look.top === 'own' ? 'own' : look.top.toLowerCase();
  if (HAIR_STYLES.includes(look.hair)) out.hair = look.hair;
  for (const f of ['glasses', 'beard']) if (typeof look[f] === 'boolean') out[f] = look[f];
  return out;
}
const realDate = b => {
  if (typeof b !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(b)) return null;
  const [y, m, d] = b.split('-').map(Number), date = new Date(y, m - 1, d);
  return date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d && y > 1900 && date <= new Date() ? b : null;
};

/** Read a code from a link: the settings in it, checked and cleaned, or null if it isn't one of ours. */
export function readShareCode(code) {
  if (typeof code !== 'string' || !code || code.length > 6000 || !/^[A-Za-z0-9_-]+$/.test(code)) return null;
  let data;
  try { data = JSON.parse(fromBase64Url(code)); } catch (e) { return null; }
  if (!data || data.v !== 1 || typeof data.p !== 'object' || !data.p) return null;
  const players = {};
  for (const k of PLAYER_KEYS) {
    const p = data.p[k];
    if (!p || typeof p !== 'object') continue;
    players[k] = { name: typeof p.n === 'string' ? cleanName(p.n) || null : null, look: cleanLook(p.l), birthday: realDate(p.b) };
  }
  const off = Array.isArray(data.off) ? data.off.filter(id => GROUP_IDS.includes(id)) : [];
  return { players, off };
}

/** Use settings from a link on this device. */
export function applyShare(shared, players, settings) {
  for (const [k, p] of Object.entries(shared.players)) {
    players.setName(k, p.name || '');
    if (p.look) players.setLook(k, p.look);
    if (p.birthday) players.setBirthday(k, p.birthday);
  }
  settings.setOffGroups(shared.off);
}

/** The code in this page's address (…/house/#family=CODE), if there is one. */
export function linkCode(hash = globalThis.location && globalThis.location.hash) {
  const m = /(?:^#|&)family=([A-Za-z0-9_-]+)/.exec(hash || '');
  return m ? m[1] : null;
}

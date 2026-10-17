// The four players (Dad, Mum, P and Dude): how each one looks and their birthday, saved on this device only
// (localStorage), never in the repository. Their age follows from the birthday, and the age sets their life
// stage: a child under 13, a teenager from 13 to 17, an adult from 18. Teenagers are a bit taller and get
// some grown-up jobs (rules.js: `teen: true`).

export const PLAYER_KEYS = ['dad', 'mum', 'girl', 'boy'];
// how the family looks by default (the figures are built from a look in characters/looks.js)
export const DEFAULT_LOOKS = {
  dad: { skin: '#d8a382', hair: 'bald', hairColor: '#2a1f18', top: 'own', pants: '#202329', shoes: '#16171b', glasses: false, beard: true },   // bald with a dark beard
  mum: { skin: '#f1d1ba', hair: 'shoulder', hairColor: '#e2c27c', top: 'own', pants: '#4a6a9c', shoes: '#f2f2f2', glasses: false, beard: false },
  girl: { skin: '#f1d1ba', hair: 'long', hairColor: '#9b7452', top: 'own', pants: '#1c1e25', shoes: '#f2eef2', glasses: false, beard: false },
  boy: { skin: '#f5d6c1', hair: 'swept', hairColor: '#7a5434', top: 'own', pants: '#2d3037', shoes: '#3a3d45', glasses: false, beard: false },
};
export const DEFAULT_STAGE = { dad: 'adult', mum: 'adult', girl: 'child', boy: 'child' };
const KEY = 'fordHouse.players.v1';
export const STAGE_NAMES = { child: 'child', teen: 'teenager', adult: 'grown-up' };

/** Age in whole years on a date, from a birthday 'YYYY-MM-DD' (null without one). */
export function ageOn(birthday, date = new Date()) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(birthday || '');
  if (!m) return null;
  const [y, mo, d] = [+m[1], +m[2], +m[3]];
  let age = date.getFullYear() - y;
  if (date.getMonth() + 1 < mo || (date.getMonth() + 1 === mo && date.getDate() < d)) age--;
  return age >= 0 ? age : null;
}

/** Life stage from an age: child, teen or adult. */
export const stageFor = age => (age === null ? null : age < 13 ? 'child' : age < 18 ? 'teen' : 'adult');

/** Days until the next birthday (0 on the day). */
export function daysToBirthday(birthday, date = new Date()) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(birthday || '');
  if (!m) return null;
  const today = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  let next = new Date(date.getFullYear(), +m[2] - 1, +m[3]);
  if (next < today) next = new Date(date.getFullYear() + 1, +m[2] - 1, +m[3]);
  return Math.round((next - today) / 86400000);
}

function load() {
  try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; }
}

export function createPlayers() {
  const saved = load(), listeners = [];
  const data = Object.fromEntries(PLAYER_KEYS.map(k => [k, {
    look: { ...DEFAULT_LOOKS[k], ...((saved[k] && saved[k].look) || {}) },
    birthday: (saved[k] && saved[k].birthday) || null,
  }]));
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) { /* private mode */ } };
  const changed = key => listeners.forEach(fn => fn(key));

  return {
    look: key => data[key].look,
    birthday: key => data[key].birthday,
    age: (key, date) => ageOn(data[key].birthday, date),
    /** The life stage now: from the birthday, or the usual one without a birthday. Parents are always grown-ups. */
    stage(key, date) {
      if (DEFAULT_STAGE[key] === 'adult') return 'adult';
      return stageFor(ageOn(data[key].birthday, date)) || DEFAULT_STAGE[key];
    },
    setLook(key, change) { Object.assign(data[key].look, change); save(); changed(key); },
    resetLook(key) { data[key].look = { ...DEFAULT_LOOKS[key] }; save(); changed(key); },
    setBirthday(key, birthday) { data[key].birthday = birthday || null; save(); changed(key); },
    /** fn(key) after a player's look or birthday changes. */
    onChange(fn) { listeners.push(fn); },
  };
}

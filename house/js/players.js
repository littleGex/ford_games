// The four players (Dad, Mum, P and Dude): what they're called, whether they're she, he or they, how each one
// looks, their birthday, and whether they're in the family at all (a family with one grown-up leaves Mum or Dad
// out). Saved on this device only (localStorage), never in the repository. Their age follows from the birthday, and the age sets their life
// stage: a child under 13, a teenager from 13 to 17, an adult from 18. Teenagers are a bit taller and get
// some grown-up jobs (rules.js: `teen: true`).

import { GROWN_UPS, PRONOUNS, cleanName, useNames } from './names.js';

export const PLAYER_KEYS = ['dad', 'mum', 'girl', 'boy'];
// how the family looks by default (the figures are built from a look in characters/looks.js)
export const DEFAULT_LOOKS = {
  dad: { skin: '#d8a382', hair: 'bald', hairColor: '#2a1f18', top: 'own', pants: '#202329', shoes: '#16171b', glasses: false, beard: true },   // bald with a dark beard
  mum: { skin: '#f1d1ba', hair: 'shoulder', hairColor: '#e2c27c', top: 'own', pants: '#4a6a9c', shoes: '#f2f2f2', glasses: false, beard: false },
  girl: { skin: '#f1d1ba', hair: 'long', hairColor: '#9b7452', top: 'own', pants: '#1c1e25', shoes: '#f2eef2', glasses: false, beard: false },
  boy: { skin: '#f5d6c1', hair: 'swept', hairColor: '#7a5434', top: 'own', pants: '#2d3037', shoes: '#3a3d45', glasses: false, beard: false },
};
export const DEFAULT_STAGE = { dad: 'adult', mum: 'adult', girl: 'child', boy: 'child' };
// the hair styles (characters/looks.js builds them), for checking looks that come in a share link
export const HAIR_STYLES = ['long', 'shoulder', 'ponytail', 'bun', 'swept', 'short', 'spiky', 'beanie', 'bald'];
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
    name: cleanName(saved[k] && saved[k].name) || null,   // null: the usual name (names.js)
    pronoun: PRONOUNS.includes(saved[k] && saved[k].pronoun) ? saved[k].pronoun : null,   // null: the usual one
    away: GROWN_UPS.includes(k) && !!(saved[k] && saved[k].away),   // a family with one grown-up leaves the other out
  }]));
  if (GROWN_UPS.every(k => data[k].away)) GROWN_UPS.forEach(k => { data[k].away = false; });   // never nobody
  useNames(key => (data[key] && data[key].name) || null, {
    pronoun: key => (data[key] && data[key].pronoun) || null,
    away: key => !!(data[key] && data[key].away),
  });
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) { /* private mode */ } };
  const changed = key => listeners.forEach(fn => fn(key));

  return {
    look: key => data[key].look,
    /** A name they've been given here (null: the usual one, Dad, Mum, P or Dude). */
    customName: key => data[key].name,
    /** Give a player a name (cleaned up: letters, numbers, spaces, - ' . only); empty goes back to the usual one. */
    setName(key, name) { data[key].name = cleanName(name) || null; save(); changed(key); },
    birthday: key => data[key].birthday,
    age: (key, date) => ageOn(data[key].birthday, date),
    /** The life stage now: from the birthday, or the usual one without a birthday. Parents are always grown-ups. */
    stage(key, date) {
      if (DEFAULT_STAGE[key] === 'adult') return 'adult';
      return stageFor(ageOn(data[key].birthday, date)) || DEFAULT_STAGE[key];
    },
    /** 'she', 'he' or 'they' as chosen here (null: the usual one, names.js). */
    customPronoun: key => data[key].pronoun,
    setPronoun(key, pronoun) { data[key].pronoun = PRONOUNS.includes(pronoun) ? pronoun : null; save(); changed(key); },
    /** In the family? Only a grown-up can be left out, and never both. */
    inFamily: key => !data[key].away,
    setInFamily(key, on) {
      if (!GROWN_UPS.includes(key)) return false;
      if (!on && GROWN_UPS.every(k => k === key || data[k].away)) return false;
      data[key].away = !on; save(); changed(key);
      return true;
    },
    setLook(key, change) { Object.assign(data[key].look, change); save(); changed(key); },
    resetLook(key) { data[key].look = { ...DEFAULT_LOOKS[key] }; save(); changed(key); },
    setBirthday(key, birthday) { data[key].birthday = birthday || null; save(); changed(key); },
    /** fn(key) after a player's name, look or birthday changes. */
    onChange(fn) { listeners.push(fn); },
  };
}

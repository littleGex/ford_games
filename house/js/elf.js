// The naughty elf (systems/elf.js): which of his scenes (pack/elfscenes.js) he's in on a date, and the dates
// he's been found and taken home, kept on this device (localStorage), so he only comes out once a real day
// however many game days are played on it. holidays.js: today(), so ?date= works for trying it out.
import { today } from './holidays.js';

export const ELF_KEY = 'fordHouse.elf.v1';
const KEEP = 40;   // dates remembered (more than one December's worth)

/** 'YYYY-MM-DD' for a date, in local time. */
export const dateKey = date => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

/** Today's scene id: one a day, in order, skipping scenes whose job group (settings.js) is switched off. */
export function pickScene(date, scenes, isOn) {
  const allowed = scenes.filter(s => !s.needs || isOn(s.needs));
  return allowed.length ? allowed[(date.getDate() - 1) % allowed.length].id : null;
}

export function createElfLog({ now = today } = {}) {
  function load() {
    try { const d = JSON.parse(localStorage.getItem(ELF_KEY)); return d && Array.isArray(d.found) ? d.found : []; } catch (e) { return []; }
  }
  const api = {
    // `day`: the date ('YYYY-MM-DD') the game day was planned for (days.js params.elfDate), so a day played past
    // midnight still counts for the day it was planned; today's real date if not given
    /** Has he been found and taken home that day? */
    found: (day = dateKey(now())) => load().includes(day),
    markFound(day = dateKey(now())) {
      const found = load().filter(d => d !== day);
      found.push(day);
      try { localStorage.setItem(ELF_KEY, JSON.stringify({ found: found.slice(-KEEP) })); } catch (e) { /* private mode */ }
    },
    /** Is he out that day, waiting to be found (an Advent day, and not found yet)? */
    waiting: (tags, day) => [].concat(tags || []).includes('advent') && !api.found(day),
  };
  return api;
}

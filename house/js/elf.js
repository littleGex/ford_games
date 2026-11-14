// The naughty elf (systems/elf.js): which of his scenes (pack/elfscenes.js) he's in on a date, and, kept on this
// device (localStorage): the dates he's been found and taken home (so he only comes out once a real day however
// many game days are played on it), the day he arrived this Advent (the elf arrives mission: his door is up from
// then, and he's out from the next morning), and his name (Pip until the children choose one). holidays.js: today(), so ?date= works for trying it out.
import { today } from './holidays.js';
import { cleanName } from './names.js';

export const ELF_KEY = 'fordHouse.elf.v1';
const KEEP = 40;   // dates remembered (more than one December's worth)
export const DEFAULT_ELF_NAME = 'Pip';

/** The Advent a 'YYYY-MM-DD' belongs to (early January is still last year's). */
const adventOf = day => +day.slice(0, 4) - (day.slice(5, 7) === '01' ? 1 : 0);

/** 'YYYY-MM-DD' for a date, in local time. */
export const dateKey = date => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

/** Today's scene id: one a day, in order, skipping scenes whose job group (settings.js) is switched off. */
export function pickScene(date, scenes, isOn) {
  const allowed = scenes.filter(s => !s.needs || isOn(s.needs));
  return allowed.length ? allowed[(date.getDate() - 1) % allowed.length].id : null;
}

export function createElfLog({ now = today } = {}) {
  function read() {
    let d = null;
    try { d = JSON.parse(localStorage.getItem(ELF_KEY)); } catch (e) { d = null; }
    d = d && typeof d === 'object' ? d : {};
    return { found: Array.isArray(d.found) ? d.found.filter(x => typeof x === 'string') : [], arrived: typeof d.arrived === 'string' ? d.arrived : null, name: typeof d.name === 'string' ? d.name : null };
  }
  function write(d) { try { localStorage.setItem(ELF_KEY, JSON.stringify(d)); } catch (e) { /* private mode */ } }
  const load = () => read().found;
  const key = () => dateKey(now());
  const api = {
    // `day`: the date ('YYYY-MM-DD') the game day was planned for (days.js params.elfDate), so a day played past
    // midnight still counts for the day it was planned; today's real date if not given
    /** Has he been found and taken home that day? */
    found: (day = dateKey(now())) => load().includes(day),
    markFound(day = dateKey(now())) {
      const d = read(), found = d.found.filter(x => x !== day);
      found.push(day);
      write({ ...d, found: found.slice(-KEEP) });
    },
    /** Forget he was found that day ("Start over from day 1": a fresh game gets him back out). */
    unfind(day = key()) { const d = read(); if (d.found.includes(day)) write({ ...d, found: d.found.filter(x => x !== day) }); },
    /** The day he arrived in `day`'s Advent: the mission's date, or (an elf already out before the mission
     *  existed) the first December day he was found that Advent (not November: that was ?holiday=christmas
     *  testing); null if he hasn't come yet. */
    arrivedOn(day = key()) {
      const d = read(), year = adventOf(day);
      if (d.arrived && adventOf(d.arrived) === year) return d.arrived;
      return d.found.filter(x => adventOf(x) === year && x.slice(5, 7) !== '11').sort()[0] || null;
    },
    /** Is his door up that day (he's arrived, that day or before)? */
    hasArrived(day = key()) { const a = api.arrivedOn(day); return a !== null && a <= day; },
    /** Is he out and about that day (arrived the day before or earlier)? */
    out(day = key()) { const a = api.arrivedOn(day); return a !== null && a < day; },
    /** He's arrived (the mission): never moves an arrival this Advent later. */
    arrive(day = key()) { if (!api.hasArrived(day)) write({ ...read(), arrived: day }); },
    /** Is he out that day, waiting to be found (an Advent day, arrived before it, and not found yet)? */
    waiting: (tags, day = key()) => [].concat(tags || []).includes('advent') && api.out(day) && !api.found(day),
    name: () => cleanName(read().name) || DEFAULT_ELF_NAME,
    /** Has he been given a name yet (the first arrival asks for one)? */
    named: () => !!cleanName(read().name),
    setName(text) { const n = cleanName(text); if (n) write({ ...read(), name: n }); },
  };
  return api;
}

/** The elf's name now (Pip until the children choose one). */
export const elfName = () => createElfLog().name();

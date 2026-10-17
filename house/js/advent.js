// P's and Dude's Advent calendars: 24 doors each, one more for every real day of December (holidays.js:
// today(), so ?date= works for trying it out). Doors you missed can still be opened later, but never one
// whose day hasn't come yet. What's behind each door is kept on this device (localStorage), so the gifts
// can be looked at again; a new Advent starts with all the doors shut.
import { today } from './holidays.js';

export const ADVENT_KIDS = ['girl', 'boy'];
const KEY = 'fordHouse.advent.v1';

// The order the door numbers are printed on the calendar (4 across, 6 down), like a real one
export const DOOR_ORDER = [7, 14, 2, 21, 11, 1, 18, 9, 23, 5, 16, 3, 12, 20, 8, 24, 4, 17, 13, 6, 19, 10, 22, 15];

// What's behind each door (made up): door 1 first
export const ADVENT_GIFTS = {
  girl: [
    ['🍫', 'a chocolate star'], ['🦎', 'a little bearded dragon sticker'], ['✏️', 'a glitter pencil'], ['🍬', 'a candy cane'],
    ['🎀', 'a hair clip with a bow'], ['🦌', 'a wooden reindeer'], ['🍫', 'a chocolate Father Christmas'], ['🧩', 'a mini puzzle'],
    ['💍', 'a sparkly ring'], ['📒', 'a tiny notebook'], ['🍪', 'a gingerbread heart'], ['🖍️', 'three wax crayons'],
    ['⛸️', 'a skate keyring'], ['🪙', 'chocolate coins'], ['🌟', 'glow-in-the-dark stars'], ['🧦', 'fluffy Christmas socks'],
    ['🎨', 'a mini paint set'], ['🍭', 'a lollipop'], ['🦄', 'a unicorn rubber'], ['🔮', 'a snow globe'],
    ['🔔', 'a chocolate bell'], ['🧸', 'a tiny teddy'], ['💅', 'glitter nail stickers'], ['🎅', 'a big chocolate Father Christmas'],
  ],
  boy: [
    ['🍫', 'a chocolate star'], ['🚀', 'a mini rocket'], ['⚽', 'football stickers'], ['🍬', 'a candy cane'],
    ['🎵', 'a clarinet sticker'], ['🦖', 'a dinosaur figure'], ['🍫', 'a chocolate Father Christmas'], ['🎲', 'a dice game'],
    ['🔦', 'a tiny torch'], ['🏎️', 'a pull-back car'], ['🍪', 'a gingerbread man'], ['🧱', 'a little brick set'],
    ['🤖', 'a robot keyring'], ['🪙', 'chocolate coins'], ['🌟', 'glow-in-the-dark stars'], ['🧦', 'Christmas socks'],
    ['🪀', 'a yo-yo'], ['🍭', 'a lollipop'], ['🧲', 'magnets'], ['🔮', 'a snow globe'],
    ['🔔', 'a chocolate bell'], ['🛸', 'a flying saucer'], ['🃏', 'a pack of cards'], ['🎅', 'a big chocolate Father Christmas'],
  ],
};

/** The Advent a date belongs to (5 January is still last year's). */
export const adventYear = (date = today()) => (date.getMonth() === 0 ? date.getFullYear() - 1 : date.getFullYear());

/** How many doors may be open on a date: one more each day of December up to 24, all 24 until 5 January. */
export function doorsUpTo(date = today()) {
  const month = date.getMonth() + 1, day = date.getDate();
  if (month === 12) return Math.min(day, 24);
  if (month === 1 && day <= 5) return 24;
  return 0;
}

export function createAdvent({ now = today } = {}) {
  const listeners = [];
  let data = load();

  function load() {
    let d = null;
    try { d = JSON.parse(localStorage.getItem(KEY)); } catch (e) { d = null; }
    if (!d || d.year !== adventYear(now())) d = { year: adventYear(now()), girl: {}, boy: {} };   // a new Advent: all shut
    return d;
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) { /* private mode */ } }
  function fresh() { if (data.year !== adventYear(now())) data = load(); }

  const api = {
    /** The doors opened so far, by number. */
    opened(who) { fresh(); return Object.keys(data[who] || {}).map(Number).sort((a, b) => a - b); },
    isOpen(who, door) { fresh(); return !!(data[who] && data[who][door]); },
    /** Can this door be opened now (its day has come and it's still shut)? */
    canOpen(who, door) { return ADVENT_KIDS.includes(who) && door >= 1 && door <= doorsUpTo(now()) && !api.isOpen(who, door); },
    /** Is there a door waiting for them (today's, or one they missed)? */
    hasNew(who) { if (!ADVENT_KIDS.includes(who)) return false; for (let d = 1; d <= doorsUpTo(now()); d++) if (!api.isOpen(who, d)) return true; return false; },
    /** The doors that can be opened right now. */
    ready(who) { const out = []; for (let d = 1; d <= doorsUpTo(now()); d++) if (api.canOpen(who, d)) out.push(d); return out; },
    upTo: () => doorsUpTo(now()),
    gift: (who, door) => ADVENT_GIFTS[who][door - 1],
    /** Open a door: returns what's behind it, or null if it can't be opened yet. */
    open(who, door) {
      if (!api.canOpen(who, door)) return null;
      (data[who] ||= {})[door] = now().toISOString().slice(0, 10);
      save();
      listeners.forEach(fn => fn(who, door));
      return api.gift(who, door);
    },
    onChange(fn) { listeners.push(fn); },
  };
  return api;
}

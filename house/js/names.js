// What the four players are called. The game knows them as dad, mum, girl and boy; what's shown is their name,
// which can be changed in the names and looks card (players.js keeps it, on this device). Everything that
// shows a name asks here when it builds its text, so a new name turns up everywhere: the buttons, job titles
// ("Fix Pia's bike"), missions, the Advent calendars, the room names.
export const DEFAULT_NAMES = { dad: 'Dad', mum: 'Mum', girl: 'P', boy: 'Dude' };
export const NAME_MAX = 16;

let source = () => null;

/** players.js tells us where the names live. */
export function useNames(fn) { source = fn; }

/** A player's name. */
export const nameOf = key => source(key) || DEFAULT_NAMES[key] || key;

/** "P's", "Dude's" (and "James'" for a name ending in s). */
export const possessive = key => { const n = nameOf(key); return /s$/i.test(n) ? `${n}'` : `${n}'s`; };

/** German-style possessive for the room chips ("Dudes Zimmer", "Dads Büro"; "Jonas' Zimmer"). */
export const genitive = key => { const n = nameOf(key); return /[sxzß]$/i.test(n) ? `${n}'` : `${n}s`; };

/** NAMES.girl, NAMES[who]: the current names, for code that looks them up by key. */
export const NAMES = new Proxy({}, {
  get: (_, key) => (typeof key === 'string' && key in DEFAULT_NAMES ? nameOf(key) : undefined),
  has: (_, key) => key in DEFAULT_NAMES,
  ownKeys: () => Object.keys(DEFAULT_NAMES),
  getOwnPropertyDescriptor: (_, key) => (key in DEFAULT_NAMES ? { enumerable: true, configurable: true, value: nameOf(key) } : undefined),
});

/** A name as it may be saved: letters (any language), numbers, spaces, - ' and . only, at most NAME_MAX long.
 *  Anything else (angle brackets, quotes, emoji...) is dropped, so a name can never carry markup. */
export function cleanName(text) {
  return String(text ?? '').normalize('NFC').replace(/[^\p{L}\p{M}\p{N} .'-]/gu, '').replace(/\s+/g, ' ').trim().slice(0, NAME_MAX).trim();
}

/** Fill every element marked data-name="girl" (and so on) with that player's name. */
export function showNames(root = globalThis.document) {
  if (!root || !root.querySelectorAll) return;
  for (const el of root.querySelectorAll('[data-name]')) el.textContent = nameOf(el.dataset.name);
}

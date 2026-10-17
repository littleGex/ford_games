// What the four players are called. The game knows them as dad, mum, girl and boy; what's shown is their name,
// which can be changed in the names and looks card (players.js keeps it, on this device). Everything that
// shows a name asks here when it builds its text, so a new name turns up everywhere: the buttons, job titles
// ("Fix Pia's bike"), missions, the Advent calendars, the room names.
//
// The same goes for how each player is talked about (she, he or they: "her bed", "his teeth", "their iPad") and
// who's in the family at all: a family with one grown-up leaves Mum or Dad out (players.js keeps both).
export const DEFAULT_NAMES = { dad: 'Dad', mum: 'Mum', girl: 'P', boy: 'Dude' };
export const NAME_MAX = 16;

export const PRONOUNS = ['she', 'he', 'they'];
export const DEFAULT_PRONOUNS = { dad: 'he', mum: 'she', girl: 'she', boy: 'he' };
export const GROWN_UPS = ['dad', 'mum'];
const THEIR = { she: 'her', he: 'his', they: 'their' };

let source = () => null, pronounSource = () => null, awaySource = () => false;

/** players.js tells us where the names live (and, if it keeps them, the pronouns and who's left out). */
export function useNames(fn, { pronoun, away } = {}) {
  source = fn;
  if (pronoun) pronounSource = pronoun;
  if (away) awaySource = away;
}

/** 'she', 'he' or 'they'. */
export const pronounOf = key => pronounSource(key) || DEFAULT_PRONOUNS[key] || 'they';

/** "her", "his" or "their" ("Help Dude brush his teeth"). */
export const their = key => THEIR[pronounOf(key)];

/** Is this player in the family (a family with one grown-up leaves the other out)? */
export const inFamily = key => !awaySource(key);

/** The players in the family, in the usual order. */
export const familyKeys = () => Object.keys(DEFAULT_NAMES).filter(inFamily);

/** The grown-ups in the family: both, or just one of them. */
export const grownUps = () => GROWN_UPS.filter(inFamily);

/** "Mum and Dad", or just "Dad". */
export const grownUpNames = () => grownUps().slice().reverse().map(nameOf).join(' and ');

/** "Mum and Dad's", or just "Dad's". */
export const grownUpsPossessive = () => {
  const g = grownUps().slice().reverse();
  return g.length > 1 ? `${g.slice(0, -1).map(nameOf).join(', ')} and ${possessive(g[g.length - 1])}` : possessive(g[0]);
};

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

/** Fill every element marked data-name="girl" (and so on) with that player's name, and hide the buttons of a
 *  grown-up who isn't in the family: who's playing (data-c) and the missions (data-kid). A button marked
 *  data-cover="dad" is the stand-in for Dad's: it shows only while Dad isn't in the family. */
export function showNames(root = globalThis.document) {
  if (!root || !root.querySelectorAll) return;
  for (const el of root.querySelectorAll('[data-name]')) el.textContent = nameOf(el.dataset.name);
  for (const el of root.querySelectorAll('[data-c], [data-kid]')) {
    const key = el.dataset.c || el.dataset.kid, cover = el.dataset.cover;
    el.hidden = !inFamily(key) || (!!cover && inFamily(cover));
  }
}

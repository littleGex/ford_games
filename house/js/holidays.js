// Special days, from the real date. Each day has a list of tags that jobs can be tied to (rules.js:
// `holiday: 'christmas'`), and that switch decorations on:
//   halloween        31 October
//   advent           1-24 December: the Advent calendars hang in the living room
//   christmas        12 December to 5 January: the tree, lights, the wreath, the Advent wreath, stars
//   christmasTime    12 December to 4 January: decorating the tree, baking biscuits
//   beforeChristmas  12-23 December: presents to wrap or make, wish lists
//   christmasEve     24 December: the Christmas bell and presents under the tree
//   christmasEnd     5 January: the decorations come down
// (and for P and Dude, 'adventDoor' while there's a door on their Advent calendar to open; days.js adds it).
//
// Trying things out: ?date=2026-12-24 pretends it's that day (seasons, Christmas, Advent calendar doors,
// birthdays); ?holiday=halloween or ?holiday=christmas switches one on today; ?holiday=none switches them off.
export const HOLIDAYS = ['halloween', 'christmas'];

/** Today's date: the real one, or the one in ?date=YYYY-MM-DD (midday, so time zones can't move it). */
export function today() {
  const search = globalThis.location && globalThis.location.search;
  const asked = search ? new URLSearchParams(search).get('date') : null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(asked || '');
  return m ? new Date(+m[1], +m[2] - 1, +m[3], 12) : new Date();
}

/** The tags for a date. */
export function holidaysOf(date = today()) {
  const month = date.getMonth() + 1, day = date.getDate(), tags = [];
  if (month === 10 && day === 31) tags.push('halloween');
  if (month === 12 && day <= 24) tags.push('advent');
  if ((month === 12 && day >= 12) || (month === 1 && day <= 5)) tags.push('christmas');
  if ((month === 12 && day >= 12) || (month === 1 && day <= 4)) tags.push('christmasTime');
  if (month === 12 && day >= 12 && day <= 23) tags.push('beforeChristmas');
  if (month === 12 && day === 24) tags.push('christmasEve');
  if (month === 1 && day === 5) tags.push('christmasEnd');
  return tags;
}

/** Today's tags, with the ?holiday= switch. */
export function currentHolidays(date = today()) {
  const search = globalThis.location && globalThis.location.search;
  const asked = search ? new URLSearchParams(search).get('holiday') : null;
  if (asked === 'none') return [];
  if (asked === 'halloween') return ['halloween'];
  if (asked === 'christmas') return holidaysOf(new Date(date.getFullYear(), 11, 15, 12));   // like 15 December
  return holidaysOf(date);
}

/** Does a day's tags (a list, or an old save's single name) include this one? */
export const hasHoliday = (tags, name) => [].concat(tags || []).includes(name);

/** How many Advent candles burn on a date: one more each Advent Sunday (the four Sundays before Christmas),
 *  all four from the fourth Sunday until the decorations come down. */
export function adventCandles(date = today()) {
  const year = date.getMonth() === 0 ? date.getFullYear() - 1 : date.getFullYear();
  if (date.getMonth() === 0) return 4;
  const christmas = new Date(year, 11, 25, 12);
  const fourth = new Date(year, 11, 25 - (christmas.getDay() || 7), 12);   // the last Sunday before Christmas Day
  let n = 0;
  for (let k = 3; k >= 0; k--) if (date >= new Date(fourth.getFullYear(), fourth.getMonth(), fourth.getDate() - 7 * k, 0)) n++;
  return n;
}

/** Whose birthday it is today ('dad', 'mum', 'girl', 'boy'), from the players' birthdays (players.js), or null.
 *  Add ?birthday=girl (or dad, mum, boy) to the address to try a birthday out, ?birthday=none to switch it off. */
export function currentBirthday(players, date = today()) {
  const search = globalThis.location && globalThis.location.search;
  const asked = search ? new URLSearchParams(search).get('birthday') : null;
  if (asked === 'none') return null;
  if (['dad', 'mum', 'girl', 'boy'].includes(asked)) return asked;
  if (!players) return null;
  const md = `-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  // (not someone who isn't in the family: a family with one grown-up)
  return ['girl', 'boy', 'mum', 'dad'].find(k => (!players.inFamily || players.inFamily(k)) && (players.birthday(k) || '').endsWith(md)) || null;
}

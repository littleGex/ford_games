// Special days, from the real date: on Halloween (31 October) the house is decorated and there are
// Halloween jobs on the list. Add ?holiday=halloween to the address to try it out on any day
// (or ?holiday=none to switch it off on the day itself).
export const HOLIDAYS = ['halloween'];

export function holidayOf(date = new Date()) {
  const month = date.getMonth() + 1, day = date.getDate();
  if (month === 10 && day === 31) return 'halloween';
  return null;
}

export function currentHoliday(date) {
  const search = globalThis.location && globalThis.location.search;
  const asked = search ? new URLSearchParams(search).get('holiday') : null;
  if (asked === 'none') return null;
  return HOLIDAYS.includes(asked) ? asked : holidayOf(date);
}

/** Whose birthday it is today ('dad', 'mum', 'girl', 'boy'), from the players' birthdays (players.js), or null.
 *  Add ?birthday=girl (or dad, mum, boy) to the address to try a birthday out, ?birthday=none to switch it off. */
export function currentBirthday(players, date = new Date()) {
  const search = globalThis.location && globalThis.location.search;
  const asked = search ? new URLSearchParams(search).get('birthday') : null;
  if (asked === 'none') return null;
  if (['dad', 'mum', 'girl', 'boy'].includes(asked)) return asked;
  if (!players) return null;
  const md = `-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  return ['girl', 'boy', 'mum', 'dad'].find(k => (players.birthday(k) || '').endsWith(md)) || null;
}

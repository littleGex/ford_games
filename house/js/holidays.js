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

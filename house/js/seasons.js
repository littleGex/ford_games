// Which season it is, from the real date: the garden changes with it and some jobs only come up in their
// season. Autumn (September-November): orange and red leaves, raking. Winter (December and January):
// snow, clearing the path. The rest of the year the garden looks as it always has.
// Add ?season=autumn (spring, summer, autumn, winter) to the address to try a season out (or ?date=..., holidays.js).
import { today } from './holidays.js';
export const SEASONS = ['spring', 'summer', 'autumn', 'winter'];

export function seasonOf(date = new Date()) {
  const month = date.getMonth() + 1;
  if (month === 12 || month === 1) return 'winter';
  if (month >= 9) return 'autumn';
  if (month >= 6) return 'summer';
  return 'spring';
}

export function currentSeason() {
  const search = globalThis.location && globalThis.location.search;
  const asked = search ? new URLSearchParams(search).get('season') : null;
  return SEASONS.includes(asked) ? asked : seasonOf(today());
}

// How often each job comes round. Tune the game here.
//   every: N days (1 = daily)        after: { job, days } follow-up job        must: always included when due
//   week: N   on the first N days of every 7 (homework on the five school days)
//   season: [...]   only in these seasons ('spring', 'summer', 'autumn', 'winter'; see seasons.js)
//   holiday: '...'  only on days with that tag ('halloween', 'christmas', 'christmasEve'... see holidays.js; 'birthday' on anyone's birthday)
//   who: [...]   only for these characters ('dad', 'mum', 'girl' = P, 'boy' = Dude); always on their list when due
//   teen: true   (with who) also for P or Dude once they're teenagers (their birthdays, players.js)
//   cover: true  (with who) a household job: in a family with one grown-up, whoever's there does it instead
// Each day has 12-14 jobs (see days/planner.js). Must jobs (bins, mowing, the loft box) and each
// character's own jobs go on first, then the daily routine. Jobs that come round every 3+ days are
// appointments: they fill the day next, the most overdue first, and are never early (on a full day one can
// be a day late). The every-other-day jobs fill whatever is left, the longest-waiting first, so with this
// many of them they come round every few days.
import { grownUps, inFamily } from '../names.js';

export const POOL_RULES = [
  // every day: the routine, always on the list
  { id: 'dishes', every: 1 },
  { id: 'coffee', every: 1 },
  { id: 'tv', every: 1 },
  { id: 'beds', every: 1 },
  { id: 'teeth', every: 1 },
  // every other day (or so)
  { id: 'cup', every: 2 },
  { id: 'lamp', every: 2 },
  { id: 'hands', every: 2 },
  { id: 'game', every: 2 },
  { id: 'jacket', every: 2 },
  { id: 'shoes', every: 2 },
  { id: 'plant', every: 2 },
  { id: 'washing', every: 2 },
  { id: 'towel', every: 2 },
  { id: 'laundry', every: 2 },
  { id: 'shower', every: 2 },
  { id: 'call', every: 2 },
  // only for some of the family
  { id: 'shave', every: 2, who: ['dad'] },
  { id: 'dadWork', week: 5, who: ['dad'] },
  { id: 'homework', week: 5, who: ['girl', 'boy'] },
  { id: 'music', every: 3, who: ['boy', 'girl'] },
  { id: 'tidyDude', every: 3, who: ['boy'] },
  { id: 'clarinet', every: 3, who: ['boy'] },
  { id: 'toys', every: 3, who: ['girl'] },
  { id: 'feedDragon', every: 1, who: ['girl'] },   // P's bearded dragon
  { id: 'playDragon', every: 2, who: ['girl'] },
  { id: 'cleanDragon', every: 3, who: ['girl'] },
  { id: 'cook', every: 1, who: ['dad', 'mum'], teen: true },   // and P or Dude once they're teenagers
  { id: 'work', week: 5, who: ['mum'] },
  { id: 'sofabed', every: 3, who: ['mum'], cover: true },
  { id: 'fixBike', every: 6, who: ['dad'], cover: true },     // the shed
  { id: 'solar', every: 5, who: ['dad'], cover: true },
  // appointments
  { id: 'hoover', every: 3 },
  { id: 'shopping', every: 3 },
  { id: 'car', every: 3 },
  { id: 'washer', every: 3 },
  { id: 'fold', after: { job: 'washer', days: 1 }, must: true },
  { id: 'mow', every: 4, must: true, season: ['spring', 'summer', 'autumn'] },   // no mowing in the snow
  { id: 'binsOut', every: 4, must: true },
  { id: 'binsIn', after: { job: 'binsOut', days: 1 }, must: true },
  { id: 'windows', every: 7 },
  // seasons
  { id: 'rake', every: 3, season: ['autumn'] },
  { id: 'trim', every: 5, season: ['spring', 'summer', 'autumn'] },   // trim the bushes (anyone)
  { id: 'snow', every: 2, season: ['winter'] },
  // Halloween (31 October): carve a jack-o'-lantern, decorate the house, trick or treat
  { id: 'pumpkin', every: 1, must: true, holiday: 'halloween' },
  { id: 'decorate', every: 1, must: true, holiday: 'halloween' },
  { id: 'trickOrTreat', every: 1, must: true, holiday: 'halloween' },
  // someone's birthday (players.js): decorations, the cake, presents, and Grandma and Grandpa at the door
  { id: 'bdayDecorate', every: 1, must: true, holiday: 'birthday' },
  { id: 'bdayCake', every: 1, must: true, holiday: 'birthday' },
  { id: 'bdayPresents', every: 1, must: true, holiday: 'birthday' },
  { id: 'bdayGuests', every: 1, must: true, holiday: 'birthday' },
  // Christmas (holidays.js): decorations from 12 December to 5 January, and P and Dude's Advent calendars
  { id: 'adventDoor', every: 1, must: true, who: ['girl', 'boy'], holiday: 'adventDoor' },   // a door to open (real days only)
  { id: 'xmasTree', every: 10, must: true, holiday: 'christmasTime' },   // fetch the decorations and do the tree (the first day, then now and then)
  { id: 'biscuits', every: 4, holiday: 'christmasTime' },         // bake Christmas biscuits
  { id: 'xmasGift', every: 3, holiday: 'beforeChristmas' },       // wrap a present (or make one, for the kids)
  { id: 'wishList', every: 6, who: ['girl', 'boy'], holiday: 'beforeChristmas' },
  { id: 'bescherung', every: 1, must: true, holiday: 'christmasEve' },   // the Christmas bell, presents under the tree
  { id: 'xmasDown', every: 1, must: true, holiday: 'christmasEnd' },     // everything down, the tree out for collection
  { id: 'hooverUp', every: 4 },
  { id: 'hooverAttic', every: 5 },
  { id: 'plants', every: 3 },
  // the loft, once a week: a box goes up, a week later one comes down
  { id: 'loftUp', every: 14 },
  { id: 'loftDown', after: { job: 'loftUp', days: 7 }, must: true },
];

/** A job's rule. A household job (`cover`) whose grown-up isn't in the family goes to the grown-up who is. */
export function rulesFor(id) {
  const rule = POOL_RULES.find(r => r.id === id);
  if (!rule || !rule.cover || !rule.who || rule.who.some(inFamily)) return rule;
  return { ...rule, who: grownUps() };
}

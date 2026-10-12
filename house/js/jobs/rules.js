// How often each job comes round. Tune the game here.
//   every: N days (1 = daily)        after: { job, days } follow-up job        must: always included when due
//   week: N   on the first N days of every 7 (homework on the five school days)
//   season: [...]   only in these seasons ('spring', 'summer', 'autumn', 'winter'; see seasons.js)
//   who: [...]   only for these characters ('dad', 'mum', 'girl' = P, 'boy' = Dude); always on their list when due
// Each day has 12-14 jobs (see days/planner.js). Must jobs (bins, mowing, the loft box) and each
// character's own jobs go on first, then the daily routine. Jobs that come round every 3+ days are
// appointments: they fill the day next, the most overdue first, and are never early (on a full day one can
// be a day late). The every-other-day jobs fill whatever is left, the longest-waiting first, so with this
// many of them they come round every few days.
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
  { id: 'music', every: 3, who: ['boy'] },
  { id: 'tidyDude', every: 3, who: ['boy'] },
  { id: 'toys', every: 3, who: ['girl'] },
  { id: 'cook', every: 1, who: ['dad', 'mum'] },
  { id: 'work', week: 5, who: ['mum'] },
  { id: 'sofabed', every: 3, who: ['mum'] },
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
  { id: 'snow', every: 2, season: ['winter'] },
  { id: 'hooverUp', every: 4 },
  { id: 'hooverAttic', every: 5 },
  { id: 'plants', every: 3 },
  // the loft, once a week: a box goes up, a week later one comes down
  { id: 'loftUp', every: 14 },
  { id: 'loftDown', after: { job: 'loftUp', days: 7 }, must: true },
];

export const rulesFor = id => POOL_RULES.find(r => r.id === id);

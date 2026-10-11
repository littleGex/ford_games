// How often each job comes round. Tune the game here.
//   every: N days (1 = daily)        after: { job, days } follow-up job        must: always included when due
// Each day has 10-12 jobs (see days/planner.js). Jobs that come round every 3+ days are appointments: when
// due they go on the list first, so mowing really is every 4 days. Daily jobs come next, then the
// every-other-day jobs fill the rest of the day, the longest-waiting first, so with this many of them
// they come round every two or three days.
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
  { id: 'toys', every: 2 },
  { id: 'shower', every: 2 },
  // appointments
  { id: 'hoover', every: 3 },
  { id: 'shopping', every: 3 },
  { id: 'car', every: 3 },
  { id: 'washer', every: 3 },
  { id: 'mow', every: 4 },
  { id: 'binsOut', every: 4, must: true },
  { id: 'binsIn', after: { job: 'binsOut', days: 1 }, must: true },
  { id: 'windows', every: 7 },
];

export const rulesFor = id => POOL_RULES.find(r => r.id === id);

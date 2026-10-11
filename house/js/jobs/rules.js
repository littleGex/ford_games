// How often each job comes round. Tune the game here.
//   every: N days (1 = daily)        after: { job, days } follow-up job        must: always included when due
// Jobs that come round every 3+ days are treated as appointments: when due they go on the list before the
// everyday jobs, so mowing really is every 4 days. Each day has 10-12 jobs (see days/planner.js); to fill a
// day, an every-other-day job can come up a day early.
export const POOL_RULES = [
  // every day
  { id: 'dishes', every: 1 },
  { id: 'cup', every: 1 },
  { id: 'coffee', every: 1 },
  { id: 'lamp', every: 1 },
  { id: 'hands', every: 1 },
  { id: 'tv', every: 1 },
  { id: 'game', every: 1 },
  // every other day
  { id: 'jacket', every: 2 },
  { id: 'shoes', every: 2 },
  { id: 'plant', every: 2 },
  { id: 'washing', every: 2 },
  // appointments
  { id: 'hoover', every: 3 },
  { id: 'shopping', every: 3 },
  { id: 'car', every: 3 },
  { id: 'mow', every: 4 },
  { id: 'binsOut', every: 4, must: true },
  { id: 'binsIn', after: { job: 'binsOut', days: 1 }, must: true },
  { id: 'windows', every: 7 },
];

export const rulesFor = id => POOL_RULES.find(r => r.id === id);

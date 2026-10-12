// Decides which jobs come up on a given day. Pure logic, no three.js, so it can be tested in Node.
//
// Rules each job can have (see jobs/jobs.js):
//   every: N              comes round every N days (1 = daily). Never planned again before N days have passed.
//   after: { job, days }  appears `days` days after `job` was done (bins back in the day after they went out),
//                         and then stays on the list until it is done.
//   must: true            always on the list when due (bin days, bringing bins back in).
//   week: N               due on the first N days of every 7 (homework: 5 school days, then the weekend off).
//   who: [...]            only for these characters. Daily ones and homework are always on their list when due;
//                         ones every 2+ days go in after the daily routine while the day has room.
//   season: [...]         only in these seasons (raking leaves in autumn, clearing snow in winter).
//
// A day gets between DAY_JOBS.min and DAY_JOBS.max jobs:
//   1. jobs that must happen today, and the daily jobs and homework just for whoever is playing,
//   2. daily jobs, then the playing character's other jobs that are due (up to DAY_JOBS.max),
//   3. due appointments (jobs that come round every 3+ days), the most overdue first, up to DAY_JOBS.max.
//      One that doesn't fit is a day late, and goes first the next day; appointments are never early,
//   4. other due jobs, the most overdue first,
//   5. if still short, extra quick jobs (every <= 2 days) that aren't strictly due yet.

export const DAY_JOBS = { min: 12, max: 14 };

/** How overdue a job is: 1 = due today, 2 = a whole cycle late, 0 = not due, Infinity = never done. */
export function overdue(job, state) {
  const last = state.lastDone[job.id];
  if (job.week) return (state.day - 1) % 7 < job.week && last !== state.day ? 1 : 0;
  if (job.after) {
    const trigger = state.lastDone[job.after.job];
    if (trigger === undefined || (last !== undefined && last >= trigger)) return 0;   // nothing to follow up
    return state.day >= trigger + job.after.days ? 1 + (state.day - trigger - job.after.days) : 0;
  }
  if (last === undefined) return Infinity;
  const since = state.day - last;
  return since >= job.every ? since / job.every : 0;
}

/** Is this job for whoever is playing? Jobs without `who` are for everyone. */
export const isFor = (job, character) => !job.who || job.who.includes(character);
/** Is this job in season? Jobs without `season` (or a state without one) are all year round. */
export const inSeason = (job, season) => !job.season || !season || job.season.includes(season);

/** The jobs that are only for this character and are due today. */
export function personalDue(pool, state) {
  return pool.filter(job => job.who && isFor(job, state.character) && inSeason(job, state.season) && overdue(job, state) > 0);
}

/**
 * @param pool   job definitions (only `id`, `every`, `week`, `after`, `must`, `who`, `season` are used)
 * @param state  { day, lastDone: { [jobId]: dayNumber }, character, season }
 * @param rng    () => number in [0, 1)
 * @returns job ids for the day, in pool order
 */
export function planDay(pool, state, rng = Math.random, limits = DAY_JOBS) {
  const target = limits.min + Math.floor(rng() * (limits.max - limits.min + 1));
  const jitter = new Map(pool.map(j => [j.id, rng()]));
  const byUrgency = (a, b) => (b.score - a.score) || (jitter.get(a.job.id) - jitter.get(b.job.id));

  const appointment = job => job.every >= 3;
  const fixed = job => !!(job.must || job.who);
  // a character's own jobs that come round every few days (P's dragon, Dude's music...) go in after the
  // must jobs and the daily routine, as long as the day has room; homework and daily ones always go in
  const flexible = job => !job.must && job.who && !job.week && job.every >= 2;
  const scored = pool.filter(job => isFor(job, state.character) && inSeason(job, state.season)).map(job => ({ job, score: overdue(job, state) }));
  const must = scored.filter(s => s.score > 0 && fixed(s.job) && !flexible(s.job)).map(s => s.job);
  const personal = scored.filter(s => s.score > 0 && flexible(s.job)).sort(byUrgency).map(s => s.job);
  const appointments = scored.filter(s => s.score > 0 && !fixed(s.job) && appointment(s.job)).sort(byUrgency).map(s => s.job);
  const daily = scored.filter(s => s.score > 0 && !fixed(s.job) && s.job.every === 1).sort(byUrgency).map(s => s.job);
  const due = scored.filter(s => s.score > 0 && !fixed(s.job) && !appointment(s.job) && s.job.every !== 1).sort(byUrgency).map(s => s.job);
  const extra = scored.filter(s => s.score === 0 && !s.job.after && !fixed(s.job) && s.job.every <= 2)
    .sort((a, b) => jitter.get(a.job.id) - jitter.get(b.job.id)).map(s => s.job);

  const picked = [...must, ...daily];
  for (const job of personal) { if (picked.length >= limits.max) break; picked.push(job); }
  for (const job of appointments) { if (picked.length >= limits.max) break; picked.push(job); }
  for (const job of [...due, ...extra]) { if (picked.length >= target) break; picked.push(job); }
  const ids = new Set(picked.map(j => j.id));
  return pool.filter(j => ids.has(j.id)).map(j => j.id);
}

/** Small seeded random generator, so a day's plan can be reproduced (tests, reloading mid-day). */
export function seededRandom(seed) {
  let s = seed >>> 0 || 1;
  return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

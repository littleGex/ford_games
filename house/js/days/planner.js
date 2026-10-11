// Decides which jobs come up on a given day. Pure logic, no three.js, so it can be tested in Node.
//
// Rules each job can have (see jobs/jobs.js):
//   every: N              comes round every N days (1 = daily). Never planned again before N days have passed.
//   after: { job, days }  appears `days` days after `job` was done (bins back in the day after they went out),
//                         and then stays on the list until it is done.
//   must: true            always on the list when due (bin days, bringing bins back in).
//
// A day gets between DAY_JOBS.min and DAY_JOBS.max jobs:
//   1. jobs that must happen today,
//   2. due appointments (jobs that come round every 3+ days), so they stay on schedule,
//   3. daily jobs,
//   4. other due jobs, the most overdue first,
//   5. if still short, extra quick jobs (every <= 2 days) that aren't strictly due yet.

export const DAY_JOBS = { min: 10, max: 12 };

/** How overdue a job is: 1 = due today, 2 = a whole cycle late, 0 = not due, Infinity = never done. */
export function overdue(job, state) {
  const last = state.lastDone[job.id];
  if (job.after) {
    const trigger = state.lastDone[job.after.job];
    if (trigger === undefined || (last !== undefined && last >= trigger)) return 0;   // nothing to follow up
    return state.day >= trigger + job.after.days ? 1 + (state.day - trigger - job.after.days) : 0;
  }
  if (last === undefined) return Infinity;
  const since = state.day - last;
  return since >= job.every ? since / job.every : 0;
}

/**
 * @param pool   job definitions (only `id`, `every`, `after`, `must` are used)
 * @param state  { day, lastDone: { [jobId]: dayNumber } }
 * @param rng    () => number in [0, 1)
 * @returns job ids for the day, in pool order
 */
export function planDay(pool, state, rng = Math.random, limits = DAY_JOBS) {
  const target = limits.min + Math.floor(rng() * (limits.max - limits.min + 1));
  const jitter = new Map(pool.map(j => [j.id, rng()]));
  const byUrgency = (a, b) => (b.score - a.score) || (jitter.get(a.job.id) - jitter.get(b.job.id));

  const appointment = job => job.every >= 3;
  const scored = pool.map(job => ({ job, score: overdue(job, state) }));
  const must = scored.filter(s => s.score > 0 && s.job.must).map(s => s.job);
  const appointments = scored.filter(s => s.score > 0 && !s.job.must && appointment(s.job)).sort(byUrgency).map(s => s.job);
  const daily = scored.filter(s => s.score > 0 && !s.job.must && s.job.every === 1).sort(byUrgency).map(s => s.job);
  const due = scored.filter(s => s.score > 0 && !s.job.must && !appointment(s.job) && s.job.every !== 1).sort(byUrgency).map(s => s.job);
  const extra = scored.filter(s => s.score === 0 && !s.job.after && !s.job.must && s.job.every <= 2)
    .sort((a, b) => jitter.get(a.job.id) - jitter.get(b.job.id)).map(s => s.job);

  const picked = [...must, ...appointments];
  for (const job of [...daily, ...due, ...extra]) { if (picked.length >= target) break; picked.push(job); }
  const ids = new Set(picked.map(j => j.id));
  return pool.filter(j => ids.has(j.id)).map(j => j.id);
}

/** Small seeded random generator, so a day's plan can be reproduced (tests, reloading mid-day). */
export function seededRandom(seed) {
  let s = seed >>> 0 || 1;
  return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

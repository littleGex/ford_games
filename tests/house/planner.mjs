// Day-planner rules, checked over 120 simulated days:  node tests/house/planner.mjs
// (Runs plain Node, no browser.) Every planned job is assumed to get done that day.
import { planDay, seededRandom, DAY_JOBS } from '../../house/js/days/planner.js';
import { POOL_RULES } from '../../house/js/jobs/rules.js';

const fail = [];
const check = (ok, msg) => { if (!ok) fail.push(msg); };

for (const seed of [1, 7, 42, 2026]) {
  const rng = seededRandom(seed);
  const state = { day: 1, lastDone: {} };
  const history = {};   // jobId -> [days]
  const sizes = [];
  for (let day = 1; day <= 120; day++) {
    state.day = day;
    const ids = planDay(POOL_RULES, state, rng);
    sizes.push(ids.length);
    for (const id of ids) (history[id] ||= []).push(day);
    for (const id of ids) state.lastDone[id] = day;
  }
  const label = `seed ${seed}`;

  check(sizes.every(n => n >= DAY_JOBS.min && n <= DAY_JOBS.max), `${label}: day sizes ${Math.min(...sizes)}-${Math.max(...sizes)}, want ${DAY_JOBS.min}-${DAY_JOBS.max}`);

  // appointments (every 3+ days) never come round early; every-other-day jobs may, to fill a day
  for (const job of POOL_RULES.filter(j => j.every)) {
    const days = history[job.id] || [];
    const gaps = days.slice(1).map((d, i) => d - days[i]);
    if (job.every >= 3) check(gaps.every(g => g >= job.every), `${label}: ${job.id} came round after ${Math.min(...gaps)} days, rule says every ${job.every}`);
    check(days.length > 0, `${label}: ${job.id} never came up in 120 days`);
  }

  // mowing exactly every 4 days, bins out every 4, dishes every day
  const gapsOf = id => (history[id] || []).slice(1).map((d, i) => d - history[id][i]);
  check(gapsOf('mow').every(g => g === 4), `${label}: mowing gaps ${[...new Set(gapsOf('mow'))]}`);
  check(gapsOf('binsOut').every(g => g === 4), `${label}: bin day gaps ${[...new Set(gapsOf('binsOut'))]}`);
  for (const id of POOL_RULES.filter(j => j.every === 1).map(j => j.id))
    check((history[id] || []).length >= 100, `${label}: daily job ${id} only on ${(history[id] || []).length}/120 days`);
  check((history.dishes || []).length >= 100, `${label}: dishes on ${(history.dishes || []).length}/120 days`);

  // bins come back in exactly the day after they went out
  const out = history.binsOut || [], back = history.binsIn || [];
  check(back.length >= out.length - 1, `${label}: bins out ${out.length}x but in only ${back.length}x`);
  check(back.every(d => out.includes(d - 1)), `${label}: bins brought in on a day that wasn't the day after bin day`);
  check(!out.some(d => back.includes(d)), `${label}: bins in and out on the same day`);
}

console.log(fail.length ? 'PROBLEMS:\n- ' + fail.join('\n- ') : 'planner rules hold over 120 days for 4 seeds');
process.exitCode = fail.length ? 1 : 0;

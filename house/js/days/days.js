// Runs the days: plans each day's jobs, sets the house up to match, saves progress as jobs get done,
// and shows the "Day N complete" screen when the last job is finished.
import { DAY_COMPLETE_DELAY } from '../config.js';
import { S } from '../state.js';
import { resetItems } from '../items.js';
import { createJobs } from '../jobs/jobs.js';
import { planDay, personalDue, seededRandom } from './planner.js';
import { loadSave, writeSave, clearSave, freshSave } from './save.js';

/** Which bins go out next, and which are waiting at the kerb to come back in. */
function binParams(save) {
  const last = save.lastBinPair;
  return { binPair: last === null ? 0 : (last + 1) % 2, binsBack: last, day: save.day };   // day: where the loft box is
}

/** Today's plan for a save. Seeded by the day number so it's the same if worked out twice. */
function planFor(save, params) {
  const pool = createJobs({ ...params, character: save.character });
  return planDay(pool, { day: save.day, lastDone: save.lastDone, character: save.character }, seededRandom(save.day * 7919 + 13));
}

export function createDays(ctx) {
  const { board, hud, items, clock } = ctx;
  let save = loadSave();
  let today = null, dayStart = 0, completeAt = null, restored = false;
  const now = () => clock.elapsedTime;
  /** Today's jobs as they are for whoever is playing (homework is somewhere different for each of the kids). */
  const jobsToday = () => createJobs({ ...today.params, character: save.character });

  function setupDay() {
    const { plan, done } = today;
    if (S.sitting) ctx.sitting.standUp();
    S.carrying = null; S.dayOver = false; S.lampOn = false;
    board.clear();
    resetItems(items);

    // every job in the house either needs doing today, or is shown done
    for (const job of jobsToday()) {
      const planned = plan.includes(job.id), finished = done.includes(job.id);
      if (planned && !finished) { if (job.setup) job.setup(ctx); }
      else board.tidy(job);
      if (planned) board.add(job, { done: finished });
    }
    const t = now();
    S.wiping = null; ctx.sorting.close(); ctx.power.reset(t); ctx.deliveries.reset(t); ctx.weather.reset(); ctx.charging.reset(); ctx.mowing.reset();
    ctx.power.applyLights();
    ctx.player.reset(); ctx.levels.show(0); ctx.view.reset();
    dayStart = t; completeAt = null;
    hud.setDay(save.day);
    hud.hideDayComplete();

    if (today.completed) { showComplete(); return; }
    const binDay = plan.includes('binsOut') ? ' · bin day!' : '';
    hud.toast(`Day ${save.day} · ${plan.length - done.length} jobs${binDay}`);
  }

  function start() {
    if (save.today && save.today.day === save.day) {
      today = save.today;   // carry on with today after closing the page
      restored = today.done.length > 0;
    } else {
      const params = binParams(save);
      today = save.today = { day: save.day, params, plan: planFor(save, params), done: [], completed: false };
      restored = false;
      writeSave(save);
    }
    setupDay();
  }

  board.onFinished(job => {
    if (job.event || !today || !today.plan.includes(job.id) || today.done.includes(job.id)) return;
    today.done.push(job.id);
    save.lastDone[job.id] = save.day;
    save.stats.jobsDone++;
    if (job.id === 'binsOut') save.lastBinPair = today.params.binPair;
    writeSave(save);
  });

  function showComplete() {
    S.dayOver = true;
    const next = { ...save, day: save.day + 1 };
    const params = binParams(next);
    const pool = createJobs(params);
    const tomorrow = planFor(next, params).map(id => pool.find(j => j.id === id)).filter(j => j.must || j.who || j.every >= 3).map(j => j.title);
    hud.showDayComplete({
      day: save.day,
      jobs: today.plan.length,
      minutes: restored ? null : Math.max(1, Math.round((now() - dayStart) / 60)),
      tomorrow,
      totals: save.stats,
    });
  }

  function complete() {
    today.completed = true;
    save.stats.daysDone++;
    writeSave(save);
    showComplete();
  }

  function update(dt, time) {
    if (S.dayOver) return;
    if (board.allDone() && !S.carrying && !S.sitting) {
      if (completeAt === null) completeAt = time + DAY_COMPLETE_DELAY;
      if (time >= completeAt) complete();
    } else completeAt = null;
  }

  /** Someone else is playing now: their own jobs come on the list, the last player's unfinished ones go. */
  function swapPersonalJobs() {
    const pool = jobsToday(), who = save.character;
    for (const job of pool.filter(j => j.who)) {
      if (!today.plan.includes(job.id) || today.done.includes(job.id)) continue;
      if (S.sitting && S.sitting.job.id === job.id) ctx.sitting.standUp();
      if (job.who.includes(who)) { board.replace(job); continue; }   // still theirs, but maybe somewhere else: start it afresh
      today.plan = today.plan.filter(id => id !== job.id);
      board.remove(job.id);
    }
    for (const job of personalDue(pool, { day: save.day, lastDone: save.lastDone, character: who })) {
      if (today.plan.includes(job.id)) continue;
      today.plan.push(job.id);
      board.add(job);
      hud.toast('New job: ' + job.title);
    }
  }

  /** "Start day N+1" */
  function next() { save.day++; save.today = null; writeSave(save); start(); }
  /** "Start over from day 1" (keeps who you're playing as) */
  function restart() { const character = save.character; clearSave(); save = freshSave(); save.character = character; writeSave(save); start(); }
  hud.onDayButtons({ next, restart });

  return {
    start, update, next, restart,
    get day() { return save.day; },
    get save() { return save; },
    get character() { return save.character; },
    setCharacter(key) {
      save.character = key;
      if (today && !today.completed) swapPersonalJobs();
      writeSave(save);
    },
    /** For tests and trying things out: replace today's list with these job ids. */
    plan(ids) {
      today = save.today = { day: save.day, params: binParams(save), plan: ids, done: [], completed: false };
      restored = false;
      writeSave(save);
      setupDay();
    },
  };
}

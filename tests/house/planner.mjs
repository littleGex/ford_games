// Day-planner rules, checked over 120 simulated days:  node tests/house/planner.mjs
// (Runs plain Node, no browser.) Every planned job is assumed to get done that day.
import { planDay, seededRandom, DAY_JOBS } from '../../house/js/days/planner.js';
import { POOL_RULES } from '../../house/js/jobs/rules.js';

const fail = [];
const check = (ok, msg) => { if (!ok) fail.push(msg); };

for (const character of ['dad', 'mum', 'girl', 'boy']) for (const seed of [1, 7, 42, 2026]) {
  const rng = seededRandom(seed);
  const state = { day: 1, lastDone: {}, character };
  const mine = POOL_RULES.filter(j => (!j.who || j.who.includes(character)) && !j.holiday);   // no special days in this run
  const history = {};   // jobId -> [days]
  const sizes = [];
  for (let day = 1; day <= 120; day++) {
    state.day = day;
    const ids = planDay(POOL_RULES, state, rng);
    sizes.push(ids.length);
    for (const id of ids) (history[id] ||= []).push(day);
    for (const id of ids) state.lastDone[id] = day;
  }
  const label = `${character}, seed ${seed}`;

  check(sizes.every(n => n >= DAY_JOBS.min && n <= DAY_JOBS.max), `${label}: day sizes ${Math.min(...sizes)}-${Math.max(...sizes)}, want ${DAY_JOBS.min}-${DAY_JOBS.max}`);

  // appointments (every 3+ days) never come round early; every-other-day jobs may, to fill a day
  for (const job of mine.filter(j => j.every)) {
    const days = history[job.id] || [];
    const gaps = days.slice(1).map((d, i) => d - days[i]);
    if (job.every >= 3) check(gaps.every(g => g >= job.every), `${label}: ${job.id} came round after ${Math.min(...gaps)} days, rule says every ${job.every}`);
    check(days.length > 0, `${label}: ${job.id} never came up in 120 days`);
  }

  // mowing exactly every 4 days, bins out every 4, dishes every day
  const gapsOf = id => (history[id] || []).slice(1).map((d, i) => d - history[id][i]);
  check(gapsOf('mow').every(g => g === 4), `${label}: mowing gaps ${[...new Set(gapsOf('mow'))]}`);
  check(gapsOf('binsOut').every(g => g === 4), `${label}: bin day gaps ${[...new Set(gapsOf('binsOut'))]}`);
  for (const id of mine.filter(j => j.every === 1).map(j => j.id))
    check((history[id] || []).length >= 100, `${label}: daily job ${id} only on ${(history[id] || []).length}/120 days`);
  check((history.dishes || []).length >= 100, `${label}: dishes on ${(history.dishes || []).length}/120 days`);

  // jobs for one of the family: Dad shaves every 2 days, P and Dude do homework on the 5 school days of every 7
  const schoolDays = Array.from({ length: 120 }, (_, i) => i + 1).filter(d => (d - 1) % 7 < 5);
  if (character === 'dad' || character === 'mum') {
    if (character === 'dad') {
      check(gapsOf('shave').every(g => g === 2), `${label}: shaving gaps ${[...new Set(gapsOf('shave'))]}, want 2`);
      check(String(history.dadWork) === String(schoolDays), `${label}: Dad's desk work on ${(history.dadWork || []).length} days, want the ${schoolDays.length} weekdays`);
    }
    else check(!history.shave && String(history.work) === String(schoolDays), `${label}: Mum shaving, or work on ${(history.work || []).length} days`);
    check(!history.homework, `${label}: ${character} got homework`);
  } else {
    check(String(history.homework) === String(schoolDays), `${label}: homework on ${(history.homework || []).length} days, want the ${schoolDays.length} school days`);
    check(!history.shave && !history.dadWork, `${label}: ${character} got Dad's shave or desk work`);
  }

  // bins come back in exactly the day after they went out
  const out = history.binsOut || [], back = history.binsIn || [];
  check(back.length >= out.length - 1, `${label}: bins out ${out.length}x but in only ${back.length}x`);
  check(back.every(d => out.includes(d - 1)), `${label}: bins brought in on a day that wasn't the day after bin day`);
  check(!out.some(d => back.includes(d)), `${label}: bins in and out on the same day`);
}

// seasonal jobs come up in their season and never outside it (raking in autumn, snow in winter, no mowing in winter)
for (const season of ['spring', 'summer', 'autumn', 'winter']) {
  const rng = seededRandom(3), state = { day: 1, lastDone: {}, character: 'dad', season }, seen = new Set();
  for (let day = 1; day <= 60; day++) {
    state.day = day;
    for (const id of planDay(POOL_RULES, state, rng)) { seen.add(id); state.lastDone[id] = day; }
  }
  for (const rule of POOL_RULES.filter(r => r.season && (!r.who || r.who.includes('dad'))))
    check(seen.has(rule.id) === rule.season.includes(season), `${season}: ${rule.id} ${seen.has(rule.id) ? 'came up' : "didn't come up"}`);
}

// special days: the Halloween jobs are on every day that's Halloween, and never on any other day
{
  const holidayJobs = POOL_RULES.filter(r => r.holiday === 'halloween').map(r => r.id);
  check(holidayJobs.length === 3, `Halloween: ${holidayJobs.length} jobs, want 3`);
  for (const character of ['dad', 'girl']) {
    const rng = seededRandom(5), state = { day: 1, lastDone: {}, character, season: 'autumn' };
    for (let day = 1; day <= 20; day++) {
      state.day = day; state.holiday = day % 5 === 0 ? 'halloween' : null;
      const ids = planDay(POOL_RULES, state, rng);
      const has = holidayJobs.filter(id => ids.includes(id));
      check(has.length === (state.holiday ? 3 : 0), `${character} day ${day} (${state.holiday || 'ordinary'}): Halloween jobs ${has.join(', ') || 'none'}`);
      if (state.holiday) check(ids.length >= DAY_JOBS.min && ids.length <= DAY_JOBS.max + 3, `${character} Halloween day: ${ids.length} jobs`);
      for (const id of ids) state.lastDone[id] = day;
    }
  }
}

// growing up: P cooks dinner once she's a teenager, not before (her birthday decides, players.js)
{
  const rng = seededRandom(9), state = { day: 1, lastDone: {}, character: 'girl', season: 'autumn' };
  const days = stage => { let n = 0; for (let day = 1; day <= 10; day++) { state.day = day; state.stage = stage; const ids = planDay(POOL_RULES, state, rng); if (ids.includes('cook')) n++; ids.forEach(id => { state.lastDone[id] = day; }); } return n; };
  check(days('child') === 0, 'growing up: P cooked as a child');
  check(days('teen') === 10, 'growing up: P as a teenager should cook dinner every day like Mum and Dad');
}
{
  const { ageOn, stageFor, daysToBirthday } = await import('../../house/js/players.js');
  const on = new Date(2026, 9, 17);
  check(ageOn('2014-10-18', on) === 11 && ageOn('2014-10-17', on) === 12 && ageOn('', on) === null, 'ages from birthdays');
  check(stageFor(12) === 'child' && stageFor(13) === 'teen' && stageFor(17) === 'teen' && stageFor(18) === 'adult', 'life stages from ages');
  check(daysToBirthday('2014-10-17', on) === 0 && daysToBirthday('2014-10-18', on) === 1 && daysToBirthday('2014-10-16', on) === 364, 'days to the next birthday');
}

// birthdays: the party jobs on someone's birthday only
{
  const ids = ['bdayDecorate', 'bdayCake', 'bdayPresents', 'bdayGuests'];
  const state = { day: 1, lastDone: {}, character: 'dad', season: 'autumn' };
  const on = planDay(POOL_RULES, { ...state, birthday: 'girl' }, seededRandom(3)), off = planDay(POOL_RULES, state, seededRandom(3));
  check(ids.every(id => on.includes(id)), `birthday: party jobs missing (${ids.filter(id => !on.includes(id))})`);
  check(!ids.some(id => off.includes(id)), 'birthday: party jobs on an ordinary day');
}
// the family server: birthdays fetched with the game token, kept when it can't be reached, nothing without a token
{
  const store = new Map();
  globalThis.localStorage = { getItem: k => store.get(k) ?? null, setItem: (k, v) => store.set(k, String(v)), removeItem: k => store.delete(k) };
  const { createFamilyServer, FAMILY_URL } = await import('../../house/js/familyserver.js');
  const bdays = {}, players = { birthday: k => bdays[k] || null, setBirthday: (k, b) => { bdays[k] = b; } };
  const calls = [];
  let answer = () => ({ ok: true, status: 200, json: async () => ({ players: [{ key: 'girl', birthday: '2014-05-06' }, { key: 'dad', birthday: '1980-01-02' }, { key: 'cat', birthday: '2020-01-01' }] }) });
  const fs = createFamilyServer(players, { fetch: async (url, opts) => { calls.push([url, opts]); return answer(); } });
  await fs.sync();
  check(calls.length === 0 && !fs.connected, 'family server: asked without a token');
  const st = await fs.connect('  secret-token ');
  check(calls.length === 1 && calls[0][0] === FAMILY_URL && calls[0][1].headers.Authorization === 'Bearer secret-token', 'family server: not asked with the token as a bearer');
  check(st.ok && bdays.girl === '2014-05-06' && bdays.dad === '1980-01-02' && !bdays.cat, `family server: birthdays not filled in (${JSON.stringify(bdays)})`);
  answer = () => ({ ok: false, status: 401, json: async () => ({}) });
  check(!(await fs.sync()).ok && /token/.test(fs.status.message), 'family server: a wrong token not reported');
  answer = () => { throw new TypeError('Failed to fetch'); };
  const off = await fs.sync();
  check(!off.ok && /offline/.test(off.message) && bdays.girl === '2014-05-06', 'family server: offline should keep the saved birthdays');
  fs.disconnect();
  check(!fs.connected && !store.has('fordHouse.gameToken.v1'), 'family server: the token is still saved after disconnecting');
}

console.log(fail.length ? 'PROBLEMS:\n- ' + fail.join('\n- ') : 'planner rules hold over 120 days for 4 characters x 4 seeds');
process.exitCode = fail.length ? 1 : 0;

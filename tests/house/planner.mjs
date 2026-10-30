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

// the family server keeps the settings the same on every device: the first device saves them, changes go up after
// a short pause, another device's changes come down, a save that crosses another device's keeps both, an older
// server without the bedrooms still saves the rest, offline changes nothing
{
  const store = new Map();
  globalThis.localStorage = { getItem: k => store.get(k) ?? null, setItem: (k, v) => store.set(k, String(v)), removeItem: k => store.delete(k) };
  store.set('fordHouse.gameToken.v1', 'secret-token');
  const { createPlayers } = await import('../../house/js/players.js');
  const { createSettings } = await import('../../house/js/settings.js');
  const { createSettingsSync, SETTINGS_URL } = await import('../../house/js/settingsync.js');
  const clone = x => JSON.parse(JSON.stringify(x));
  // a fake fordDbs: one copy with a version; a save must name the version it saw
  const server = { version: 0, settings: null, rooms: true, down: false, token: 'secret-token', between: null };
  const calls = [];
  const fetch = async (url, opts) => {
    calls.push([url, opts.method, opts.body && JSON.parse(opts.body)]);
    if (server.down) throw new TypeError('Failed to fetch');
    if (opts.headers.Authorization !== `Bearer ${server.token}`) return { ok: false, status: 401, json: async () => ({ detail: 'no' }) };
    const doc = () => ({ version: server.version, updated_at: server.version ? '2026-10-17T18:00:00Z' : null, settings: clone(server.settings) });
    if (opts.method === 'GET') { if (server.between) { const fn = server.between; server.between = null; fn(); } return { ok: true, status: 200, json: async () => doc() }; }
    const body = JSON.parse(opts.body);
    if (!server.rooms && 'swapRooms' in body.settings) return { ok: false, status: 422, json: async () => ({ detail: 'extra field' }) };
    if (server.knows && [...server.knows].some(f => f in body.settings)) return { ok: false, status: 422, json: async () => ({ detail: 'extra field' }) };
    if (body.base_version !== server.version) return { ok: false, status: 409, json: async () => ({ detail: 'changed', ...doc() }) };
    server.settings = clone(body.settings); server.version++;
    return { ok: true, status: 200, json: async () => doc() };
  };
  const anotherDevice = change => { const s = clone(server.settings); change(s); server.settings = s; server.version++; };
  const players = createPlayers(), settings = createSettings();
  let applied = 0;
  const sync = createSettingsSync({ players, settings }, { fetch, wait: 5, onApplied: () => { applied++; } });
  const pause = ms => new Promise(r => setTimeout(r, ms));

  // the first device: the server has nothing yet, so this device's settings go up
  players.setName('girl', 'Pia');
  await pause(30); await sync.sync();
  check(calls[0][0] === SETTINGS_URL && /\/v1\/game\/settings$/.test(SETTINGS_URL), `settings sync: wrong address ${calls[0] && calls[0][0]}`);
  check(server.version >= 1 && server.settings.players.girl.name === 'Pia' && server.settings.swapRooms === false && Array.isArray(server.settings.off), `settings sync: the first save (${JSON.stringify(server.settings)})`);
  check(sync.status.ok && applied === 0, `settings sync: first save ${JSON.stringify(sync.status)}, applied ${applied}`);
  const v = server.version; calls.length = 0;
  await sync.sync();
  check(calls.length === 1 && calls[0][1] === 'GET' && server.version === v, 'settings sync: saved again with nothing changed');

  // another device renames Dude and switches the bike off; this one changes P's hair meanwhile: both stick
  anotherDevice(s => { s.players.boy.name = 'Max'; s.off = ['bike']; });
  players.setLook('girl', { hair: 'bun' });
  await pause(30); await sync.sync();
  check(players.customName('boy') === 'Max' && !settings.isOn('bike') && applied === 1, `settings sync: the other device's changes didn't come down (${players.customName('boy')}, bike ${settings.isOn('bike')}, applied ${applied})`);
  check(server.settings.players.girl.look.hair === 'bun' && server.settings.players.boy.name === 'Max' && server.settings.off.join() === 'bike', `settings sync: merged save ${JSON.stringify(server.settings)}`);

  // a save that crosses another device's: 409, then both changes are kept
  settings.setRoomsSwapped(true);
  server.between = () => anotherDevice(s => { s.players.dad.name = 'Papa'; });
  calls.length = 0;
  await pause(30); await sync.sync();
  check(calls.some(c => c[1] === 'PUT') && server.settings.swapRooms === true && server.settings.players.dad.name === 'Papa' && players.customName('dad') === 'Papa', `settings sync: crossing saves lost one (${JSON.stringify(server.settings)})`);

  // a family server from before the bedrooms could be swapped (422): the rest is saved, the swap stays here
  server.rooms = false;
  delete server.settings.swapRooms;
  players.setName('mum', 'Mama');
  await pause(30); await sync.sync();
  check(server.settings.players.mum.name === 'Mama' && !('swapRooms' in server.settings) && settings.roomsSwapped() && sync.status.ok, `settings sync: older server ${JSON.stringify(sync.status)}`);
  server.rooms = true;

  // offline: nothing changes, and it says so; a wrong token says so too
  server.down = true;
  check(!(await sync.sync()).ok && /offline/.test(sync.status.message) && players.customName('mum') === 'Mama', 'settings sync: offline');
  server.down = false; server.token = 'other';
  check(!(await sync.sync()).ok && /token/.test(sync.status.message), 'settings sync: wrong token not reported');
  server.token = 'secret-token';
  // no token, no asking
  store.delete('fordHouse.gameToken.v1'); calls.length = 0;
  players.setName('girl', 'P2'); await pause(30); await sync.sync();
  check(calls.length === 0, 'settings sync: asked without a token');
  players.setName('girl', 'Pia');
  // the server updated to know about the bedrooms: the swap goes up with the next sync
  store.set('fordHouse.gameToken.v1', 'secret-token');
  await pause(30); await sync.sync();
  check(server.settings.swapRooms === true && server.settings.players.girl.name === 'Pia', `settings sync: the swap didn't go up once the server knew about it (${JSON.stringify(server.settings)})`);

  // a new device joining: the family's settings on the server win over what was typed in there
  store.clear(); store.set('fordHouse.gameToken.v1', 'secret-token');
  const players2 = createPlayers(), settings2 = createSettings();
  players2.setName('girl', 'Lena');
  const sync2 = createSettingsSync({ players: players2, settings: settings2 }, { fetch, wait: 5 });
  await sync2.sync();
  check(players2.customName('girl') === 'Pia' && players2.customName('boy') === 'Max' && !settings2.isOn('bike') && settings2.roomsSwapped(), `settings sync: a new device didn't take the family's settings (${players2.customName('girl')})`);
  check(server.settings.players.girl.name === 'Pia', 'settings sync: a new device overwrote the family\'s settings');
  // a look the server keeps with fields left out: the usual look fills in, and nothing changes every sync
  anotherDevice(s => { s.players.boy.look = { hair: 'spiky' }; });
  await sync2.sync();
  const before = server.version;
  await sync2.sync();
  check(players2.look('boy').hair === 'spiky' && server.version === before, 'settings sync: a partial look keeps changing');
  // she/he/they and who's in the family go up and come down; which grown-up is left out can change round
  players2.setPronoun('boy', 'they');
  await pause(30); await sync2.sync();
  check(server.settings.players.boy.pronoun === 'they' && server.settings.players.dad.away === false && !('away' in server.settings.players.boy), `settings sync: pronoun and away up (${JSON.stringify(server.settings.players.boy)})`);
  anotherDevice(s => { s.players.dad.away = true; s.players.girl.pronoun = 'they'; });
  await sync2.sync();
  check(!players2.inFamily('dad') && players2.customPronoun('girl') === 'they', 'settings sync: Dad left out on another device');
  anotherDevice(s => { s.players.dad.away = false; s.players.mum.away = true; });
  await sync2.sync();
  check(players2.inFamily('dad') && !players2.inFamily('mum'), 'settings sync: the other grown-up left out instead (Dad back first)');
  players2.setInFamily('mum', true); players2.setPronoun('boy', null); players2.setPronoun('girl', null);
  // who does what and the desks go up and come down
  settings2.setDoers('dragon', ['boy']); settings2.setDesksSwapped(true);
  await pause(30); await sync2.sync();
  check(server.settings.assign.dragon.join() === 'boy' && server.settings.swapDesks === true, `settings sync: chores and desks up (${JSON.stringify(server.settings.assign)})`);
  anotherDevice(s => { s.assign = { cook: ['girl'] }; s.swapDesks = false; });
  await sync2.sync();
  check(settings2.doers('cook').join() === 'girl' && settings2.doers('dragon') === null && !settings2.desksSwapped(), 'settings sync: chores and desks down');
  // a server from before chores and desks (but with pronouns): the pronouns still go up
  server.knows = new Set(['assign', 'swapDesks']);
  players2.setPronoun('girl', 'they'); settings2.setDoers('bike', ['girl']);
  await pause(30); await sync2.sync();
  check(server.settings.players.girl.pronoun === 'they' && !('assign' in server.settings) && sync2.status.ok && settings2.doers('bike').join() === 'girl', `settings sync: a server one version older (${JSON.stringify(sync2.status)})`);
  server.knows = null; players2.setPronoun('girl', null); settings2.setAssignments({});
}

// Christmas and Advent: the tags each date gets, the Advent candles, which jobs come on which days, and the
// Advent calendar doors (one more each real day, never ahead; a new Advent starts shut)
{
  const { holidaysOf, adventCandles } = await import('../../house/js/holidays.js');
  const d = (m, day, y = 2026) => new Date(y, m - 1, day, 12);
  const tags = date => holidaysOf(date).join(',');
  check(tags(d(10, 31)) === 'halloween', `31.10: ${tags(d(10, 31))}`);
  check(tags(d(11, 30)) === '', `30.11: ${tags(d(11, 30))}`);
  check(tags(d(12, 1)) === 'advent', `1.12: ${tags(d(12, 1))}`);
  check(tags(d(12, 11)) === 'advent', `11.12: ${tags(d(12, 11))}`);
  check(tags(d(12, 12)) === 'advent,christmas,christmasTime,beforeChristmas', `12.12: ${tags(d(12, 12))}`);
  check(tags(d(12, 24)) === 'advent,christmas,christmasTime,christmasEve', `24.12: ${tags(d(12, 24))}`);
  check(tags(d(12, 25)) === 'christmas,christmasTime', `25.12: ${tags(d(12, 25))}`);
  check(tags(d(1, 4, 2027)) === 'christmas,christmasTime', `4.1: ${tags(d(1, 4, 2027))}`);
  check(tags(d(1, 5, 2027)) === 'christmas,christmasEnd', `5.1: ${tags(d(1, 5, 2027))}`);
  check(tags(d(1, 6, 2027)) === '', `6.1: ${tags(d(1, 6, 2027))}`);
  // Advent 2026: Sundays 29 November, 6, 13 and 20 December (Christmas is a Friday)
  const candles = [[d(11, 28), 0], [d(11, 29), 1], [d(12, 5), 1], [d(12, 6), 2], [d(12, 13), 3], [d(12, 19), 3], [d(12, 20), 4], [d(12, 31), 4], [d(1, 3, 2027), 4]];
  for (const [date, n] of candles) check(adventCandles(date) === n, `Advent candles on ${date.toDateString()}: ${adventCandles(date)}, want ${n}`);
  check(adventCandles(d(12, 18, 2022)) === 4 && adventCandles(d(12, 17, 2022)) === 3, 'Advent candles when Christmas Day is a Sunday (2022)');

  const xmas = ['xmasTree', 'biscuits', 'xmasGift', 'wishList', 'bescherung', 'xmasDown', 'adventDoor'];
  const plan = (character, holiday, lastDone = {}) => planDay(POOL_RULES, { day: 30, lastDone, character, season: 'winter', holiday }, seededRandom(3)).filter(id => xmas.includes(id));
  check(plan('dad', []).length === 0 && plan('girl', ['advent']).length === 0, `ordinary days and early Advent have no Christmas jobs (${plan('girl', ['advent'])})`);
  check(plan('girl', ['advent', 'adventDoor']).join() === 'adventDoor', `a door to open: ${plan('girl', ['advent', 'adventDoor'])}`);
  check(!plan('dad', ['advent', 'adventDoor']).includes('adventDoor'), 'Dad has no Advent calendar job');
  check(plan('dad', holidaysOf(d(12, 12))).includes('xmasTree'), `12.12: the tree gets done (${plan('dad', holidaysOf(d(12, 12)))})`);
  check(plan('girl', holidaysOf(d(12, 12))).includes('xmasTree'), 'P helps with the tree too');
  check(!plan('dad', holidaysOf(d(12, 12)), { xmasTree: 25 }).includes('xmasTree'), 'the tree isn\'t done again a few days later');
  check(plan('dad', holidaysOf(d(12, 24))).includes('bescherung') && !plan('dad', holidaysOf(d(12, 23))).includes('bescherung'), 'presents on Christmas Eve only');
  check(plan('dad', holidaysOf(d(1, 5, 2027))).join() === 'xmasDown', `5.1: down they come, nothing else Christmassy (${plan('dad', holidaysOf(d(1, 5, 2027)))})`);
  check(!plan('dad', holidaysOf(d(12, 15))).includes('wishList'), 'no wish list for Dad');
  check(!plan('girl', holidaysOf(d(12, 24))).includes('wishList') && !plan('girl', holidaysOf(d(12, 24))).includes('xmasGift'), 'no wish lists or presents to make on Christmas Eve');

  const store = new Map();
  globalThis.localStorage = { getItem: k => store.get(k) ?? null, setItem: (k, v) => store.set(k, String(v)), removeItem: k => store.delete(k) };
  const { createAdvent, doorsUpTo } = await import('../../house/js/advent.js');
  check(doorsUpTo(d(11, 30)) === 0 && doorsUpTo(d(12, 1)) === 1 && doorsUpTo(d(12, 17)) === 17 && doorsUpTo(d(12, 30)) === 24 && doorsUpTo(d(1, 5, 2027)) === 24 && doorsUpTo(d(1, 6, 2027)) === 0, 'doors open up one a day');
  let now = d(12, 3);
  const a = createAdvent({ now: () => now });
  check(a.hasNew('girl') && !a.hasNew('dad'), 'P has doors to open on 3 December, Dad has no calendar');
  check(a.open('girl', 4) === null, 'door 4 opened on 3 December');
  check(a.open('girl', 3)[1] === 'a glitter pencil' && a.isOpen('girl', 3) && !a.isOpen('boy', 3), 'opening door 3 (P only)');
  check(a.open('girl', 3) === null, 'door 3 opened twice');
  check(a.ready('girl').join() === '1,2', `missed doors can still be opened (${a.ready('girl')})`);
  a.open('girl', 1); a.open('girl', 2);
  check(!a.hasNew('girl'), 'nothing left for P on 3 December');
  now = d(12, 4);
  check(a.hasNew('girl') && a.ready('girl').join() === '4', 'a new real day, a new door');
  const again = createAdvent({ now: () => now });
  check(again.opened('girl').join() === '1,2,3', `opened doors are kept on the device (${again.opened('girl')})`);
  now = d(1, 5, 2027);
  check(again.isOpen('girl', 3), 'last Advent\'s doors are still open on 5 January');
  now = d(12, 1, 2027);
  const next = createAdvent({ now: () => now });
  check(next.opened('girl').length === 0 && next.ready('girl').join() === '1', 'a new Advent starts with every door shut');
}

// names, jobs switched off, and the share link (settings.js): a name in a link can't carry markup, only
// known players, hair styles, colours, dates and job groups come through, and the game token never goes in
{
  const store = new Map();
  globalThis.localStorage = { getItem: k => store.get(k) ?? null, setItem: (k, v) => store.set(k, String(v)), removeItem: k => store.delete(k) };
  const { createPlayers } = await import('../../house/js/players.js');
  const { nameOf, possessive, cleanName } = await import('../../house/js/names.js');
  const { createSettings, shareCode, readShareCode, applyShare, linkCode } = await import('../../house/js/settings.js');
  const players = createPlayers(), settings = createSettings();
  check(nameOf('girl') === 'P' && possessive('boy') === "Dude's", 'the usual names');
  players.setName('girl', '  Pia  '); players.setName('boy', 'Jonas');
  check(nameOf('girl') === 'Pia' && possessive('boy') === "Jonas'", `new names: ${nameOf('girl')}, ${possessive('boy')}`);
  check(cleanName('<b onmouseover=x>Ann</b>') === 'b onmouseoverxAn' && !/[<>"]/.test(cleanName('"><script>')), 'names are cleaned of markup');
  players.setName('boy', '');
  check(nameOf('boy') === 'Dude', 'an empty name goes back to the usual one');

  // jobs switched off: never planned; special days switched off: their jobs don't come
  settings.set('dragon', false); settings.set('christmas', false);
  const off = settings.offJobs();
  check(off.has('feedDragon') && off.has('cleanDragon') && !off.has('homework'), `jobs off: ${[...off]}`);
  const pool = POOL_RULES.filter(r => !off.has(r.id));
  const tags = settings.filterTags(['advent', 'christmas', 'christmasTime', 'adventDoor', 'halloween']);
  check(tags.join() === 'halloween', `special days left: ${tags}`);
  const ids = planDay(pool, { day: 1, lastDone: {}, character: 'girl', season: 'winter', holiday: tags }, seededRandom(1));
  check(!ids.some(id => /Dragon|xmas|advent/.test(id)), `P's day with the dragon and Christmas off: ${ids}`);
  check(createSettings().offGroups().sort().join() === 'christmas,dragon', 'switched-off jobs are kept on the device');

  // the share link: everything there, and back again on another device
  players.setLook('boy', { hair: 'spiky', hairColor: '#4a7fd8', glasses: true }); players.setBirthday('girl', '2014-05-06');
  const code = shareCode(players, settings);
  check(/^[A-Za-z0-9_-]+$/.test(code) && !code.includes('token'), 'the code is URL-safe');
  check(linkCode(`#family=${code}`) === code && linkCode('#something') === null, 'finding the code in an address');
  const got = readShareCode(code);
  check(got && got.players.girl.name === 'Pia' && got.players.girl.birthday === '2014-05-06' && got.players.boy.look.hair === 'spiky' && got.players.boy.name === null, `reading it back: ${JSON.stringify(got && got.players.girl)}`);
  check(got && got.off.sort().join() === 'christmas,dragon', 'jobs off in the link');
  store.clear();
  const p2 = createPlayers(), s2 = createSettings();
  applyShare(got, p2, s2);
  check(nameOf('girl') === 'Pia' && p2.look('boy').glasses === true && p2.birthday('girl') === '2014-05-06' && !s2.isOn('dragon'), 'settings copied to a new device');

  // a hostile link: markup in names, unknown players, bad colours and hair, a made-up date, unknown jobs, junk
  const evil = btoa(JSON.stringify({ v: 1, p: { girl: { n: '<img src=x onerror=alert(1)>', l: { skin: 'red;background:url(x)', hair: '../../x', glasses: 'yes', top: 'own' }, b: '2014-02-31' },
    hacker: { n: 'x' }, dad: { b: '2999-01-01' } }, off: ['dragon', '__proto__', 'everything'], token: 'abc' })).replace(/=+$/, '');
  const bad = readShareCode(evil);
  check(bad && !/[<>]/.test(bad.players.girl.name) && Object.keys(bad.players.girl.look).join() === 'top' && bad.players.girl.birthday === null, `hostile link cleaned: ${JSON.stringify(bad && bad.players.girl)}`);
  check(bad && !bad.players.hacker && bad.players.dad.birthday === null && bad.off.join() === 'dragon' && !('token' in bad), 'unknown players, future dates, unknown jobs and extra fields are dropped');
  check(readShareCode('not-a-real-code') === null && readShareCode('<script>') === null && readShareCode('x'.repeat(7000)) === null, 'junk is ignored');
  players.setName('girl', '');
}

// the shape of the family: she, he or they for each player, and a family with one grown-up (Mum or Dad left out,
// never both, never a child): their household jobs go to the other grown-up, the texts say just one name, their
// birthday has no party, and it all goes in the share link and to the family server
{
  const store = new Map();
  globalThis.localStorage = { getItem: k => store.get(k) ?? null, setItem: (k, v) => store.set(k, String(v)), removeItem: k => store.delete(k) };
  const { createPlayers } = await import('../../house/js/players.js');
  const { their, pronounOf, inFamily, grownUps, grownUpNames, grownUpsPossessive, familyKeys } = await import('../../house/js/names.js');
  const { rulesFor } = await import('../../house/js/jobs/rules.js');
  const { currentBirthday } = await import('../../house/js/holidays.js');
  const { createSettings, shareCode, readShareCode, applyShare } = await import('../../house/js/settings.js');
  const players = createPlayers(), settings = createSettings();
  check(pronounOf('dad') === 'he' && their('girl') === 'her' && their('boy') === 'his', 'the usual pronouns');
  players.setPronoun('boy', 'they'); players.setPronoun('girl', 'he'); players.setPronoun('mum', 'nonsense');
  check(their('boy') === 'their' && their('girl') === 'his' && pronounOf('mum') === 'she', `pronouns chosen: ${their('boy')}, ${their('girl')}, ${pronounOf('mum')}`);
  check(grownUpNames() === 'Mum and Dad' && grownUpsPossessive() === "Mum and Dad's", `both grown-ups: ${grownUpNames()}`);

  // only a grown-up can be left out, and never both
  check(players.setInFamily('girl', false) === false && inFamily('girl'), 'a child was left out');
  check(players.setInFamily('dad', false) === true && !inFamily('dad') && grownUps().join() === 'mum', 'leaving Dad out');
  check(players.setInFamily('mum', false) === false && inFamily('mum'), 'both grown-ups were left out');
  check(familyKeys().join() === 'mum,girl,boy' && grownUpNames() === 'Mum' && grownUpsPossessive() === "Mum's", `one grown-up: ${grownUpNames()}, ${grownUpsPossessive()}`);

  // Dad's household jobs go to Mum; his own (shaving, his work) don't
  check(rulesFor('fixBike').who.join() === 'mum' && rulesFor('solar').who.join() === 'mum' && rulesFor('shave').who.join() === 'dad' && rulesFor('dadWork').who.join() === 'dad', 'Dad\'s household jobs for Mum');
  const mumDay = planDay(POOL_RULES.map(r => rulesFor(r.id)), { day: 30, lastDone: {}, character: 'mum', season: 'summer', holiday: [] }, seededRandom(4));
  check(mumDay.includes('fixBike') && mumDay.includes('solar') && !mumDay.includes('shave'), `Mum's day without Dad: ${mumDay}`);
  players.setBirthday('dad', '1980-03-04');
  check(currentBirthday(players, new Date(2026, 2, 4, 12)) === null, 'a party for someone who isn\'t in the family');

  // the share link carries both
  const got = readShareCode(shareCode(players, settings));
  check(got.players.boy.pronoun === 'they' && got.players.dad.away === true && got.players.mum.away === false && got.players.girl.away === false, `share link: ${JSON.stringify(got.players.dad)}`);
  const nobody = readShareCode(btoa(JSON.stringify({ v: 1, p: { dad: { x: true }, mum: { x: true }, girl: { x: true, pr: 'it' } }, off: [] })).replace(/=+$/, ''));
  check(!nobody.players.dad.away && !nobody.players.mum.away && !nobody.players.girl.away && nobody.players.girl.pronoun === null, 'a link leaving everyone out');
  // a link the other way round: Dad back in, Mum out (Dad comes back first)
  const swapped = { ...got, players: { ...got.players, dad: { ...got.players.dad, away: false }, mum: { ...got.players.mum, away: true } } };
  applyShare(swapped, players, settings);
  check(inFamily('dad') && !inFamily('mum'), 'a link swapping which grown-up is left out');
  players.setInFamily('mum', true); players.setPronoun('boy', null); players.setPronoun('girl', null); players.setBirthday('dad', null);
  check(inFamily('dad') && inFamily('mum') && their('boy') === 'his', 'back to the usual family');
}

// who does what: the household chores can go to anyone in the family (one or more), the usual again when that's
// picked; someone left out of the family doesn't do theirs. Mum and Dad can swap desks at home. Both go in the
// share link
{
  const store = new Map();
  globalThis.localStorage = { getItem: k => store.get(k) ?? null, setItem: (k, v) => store.set(k, String(v)), removeItem: k => store.delete(k) };
  const { createPlayers } = await import('../../house/js/players.js');
  const { rulesFor } = await import('../../house/js/jobs/rules.js');
  const { createSettings, shareCode, readShareCode, applyShare, CHORES, usualDoers } = await import('../../house/js/settings.js');
  const { deskOf, pageAt, workerAt } = await import('../../house/js/pack/workdesks.js');
  const players = createPlayers();
  let settings = createSettings();
  check(rulesFor('fixBike').who.join() === 'dad' && rulesFor('cook').teen === true && usualDoers('dragon').join() === 'girl', 'the usual doers');
  settings.setDoers('bike', ['girl']); settings.setDoers('dragon', ['boy', 'girl', 'boy', 'cat']); settings.setDoers('cook', ['dad', 'boy']);
  check(rulesFor('fixBike').who.join() === 'girl', `P fixes her own bike: ${rulesFor('fixBike').who}`);
  check(['feedDragon', 'playDragon', 'cleanDragon'].every(id => rulesFor(id).who.join() === 'boy,girl'), 'the dragon for both children (no repeats, no strangers)');
  check(rulesFor('cook').who.join() === 'dad,boy' && !rulesFor('cook').teen, 'cooking for Dad and Dude (not just teenagers)');
  const boysDay = planDay(POOL_RULES.map(r => rulesFor(r.id)), { day: 9, lastDone: {}, character: 'boy', season: 'summer', holiday: [] }, seededRandom(2));
  check(boysDay.includes('feedDragon') && boysDay.includes('cook'), `Dude's day with the dragon and cooking: ${boysDay}`);
  settings.setDoers('bike', ['dad']); settings.setDoers('solar', []);
  check(settings.doers('bike') === null && settings.doers('solar') === null && !('bike' in settings.assignments()), 'the usual again (or nobody) isn\'t kept as a pick');
  players.setInFamily('dad', false);
  check(rulesFor('cook').who.join() === 'boy', 'someone left out doesn\'t cook');
  settings.setDoers('cook', ['dad']);
  check(rulesFor('fixBike').who.join() === 'mum' && rulesFor('cook').who.join() === 'dad,mum', 'with nobody picked in the family, the usual rules (and cover)');
  players.setInFamily('dad', true);
  settings = createSettings();   // (as after a reload)
  check(settings.doers('dragon').join() === 'boy,girl', 'picks are kept on the device');

  // desks at home
  check(workerAt('dressing') === 'dad' && deskOf('mum').level === 2 && pageAt(deskOf('mum'), 'code') === 'sheet', 'the usual desks');
  settings.setDesksSwapped(true);
  check(workerAt('attic') === 'dad' && deskOf('mum').level === 1 && pageAt(deskOf('mum'), 'sheet') === 'doc' && pageAt(deskOf('dad'), 'code') === 'sheet', 'swapped desks');

  // the share link
  const got = readShareCode(shareCode(players, settings));
  check(got.swapDesks === true && got.assign.dragon.join() === 'boy,girl' && !got.assign.bike, `share link: ${JSON.stringify(got.assign)}`);
  const evil = readShareCode(btoa(JSON.stringify({ v: 1, p: {}, off: [], sd: 'yes', as: { dragon: ['boy', '<b>'], hack: ['dad'], cook: 'dad', bike: [] } })).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''));
  check(evil.swapDesks === false && JSON.stringify(evil.assign) === '{"dragon":["boy"]}', `a hostile link: ${JSON.stringify(evil.assign)}`);
  store.clear();
  const p2 = createPlayers(), s2 = createSettings();
  applyShare(got, p2, s2);
  check(s2.desksSwapped() && s2.doers('dragon').join() === 'boy,girl' && CHORES.length === 5, 'copied to another device');
  s2.setDesksSwapped(false); s2.setAssignments({});
}

// the lessons at school: six questions, four different answers each with the right one among them; sums that
// add up (no negatives, sharing out comes out even), and no flag twice in a lesson. Every flag draws.
{
  const { lessonQuestions, FLAGS, drawFlag } = await import('../../house/js/lessons.js');
  const calc = t => { const m = /^(\d+) ([+−×÷]) (\d+) = \?$/.exec(t); if (!m) return NaN; const [a, op, b] = [+m[1], m[2], +m[3]]; return op === '+' ? a + b : op === '−' ? a - b : op === '×' ? a * b : a / b; };
  let bad = null;
  for (let n = 0; n < 300 && !bad; n++) {
    for (const subject of ['maths', 'flags']) {
      const qs = lessonQuestions(subject);
      if (qs.length !== 6) bad = `${subject}: ${qs.length} questions`;
      for (const q of qs) {
        const ids = q.answers.map(a => a.id);
        if (q.answers.length !== 4 || new Set(ids).size !== 4 || !ids.includes(q.right)) bad = `${subject}: answers ${ids} for ${q.right}`;
        if (subject === 'maths') {
          const want = calc(q.text);
          if (String(want) !== q.right || !Number.isInteger(want) || want < 0 || ids.some(a => +a < 0)) bad = `maths: ${q.text} -> ${q.right} (${ids})`;
        }
      }
      if (subject === 'flags' && new Set(qs.map(q => q.right)).size !== 6) bad = `flags: a flag twice in a lesson (${qs.map(q => q.right)})`;
      if (subject === 'maths' && new Set(qs.map(q => q.text)).size !== 6) bad = 'maths: the same sum twice';
    }
  }
  check(!bad, `lessons: ${bad}`);
  check(new Set(FLAGS.map(f => f.id)).size === FLAGS.length && FLAGS.length >= 16, 'flags: unique ids');
  const g = { fillRect() {}, beginPath() {}, arc() {}, fill() {}, moveTo() {}, lineTo() {}, stroke() {} };
  let drew = 0;
  for (const f of FLAGS) { try { drawFlag(g, f); drew++; } catch (e) { check(false, `flag ${f.id} doesn't draw: ${e.message}`); } }
  check(drew === FLAGS.length, 'every flag draws');
}

console.log(fail.length ? 'PROBLEMS:\n- ' + fail.join('\n- ') : 'planner rules hold over 120 days for 4 characters x 4 seeds');
process.exitCode = fail.length ? 1 : 0;

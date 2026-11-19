// Tester mode's panel (#179, js/tester.js): only built when tester mode is on (?tester=1). A "TESTER MODE" banner
// says what's pretended (the date, a holiday, a season, a birthday), and the 🧪 button opens the panel: a date with
// quick chips, holiday / season / birthday, "Apply & reload" (the world and decorations are built at startup),
// "Reset tester progress" (only the tester's own save, Advent, elf log and mission bests), "Open all Advent
// doors", play as someone, start any mission, and put any job on today's list. Text only via textContent.
import { readTester, writeTester, testerKey } from '../tester.js';
import { today } from '../holidays.js';
import { SEASONS } from '../seasons.js';
import { createAdvent } from '../advent.js';
import { nameOf } from '../names.js';

const PROGRESS = ['fordHouse.save.v1', 'fordHouse.advent.v1', 'fordHouse.elf.v1', 'fordHouse.missions.v1'];

/** Quick dates for the year's special days (the 5 January one is the next year's). */
export function dateChips(year) {
  return [
    { label: 'Halloween', date: `${year}-10-31` },
    { label: '1 Dec', date: `${year}-12-01` },
    { label: '15 Dec', date: `${year}-12-15` },
    { label: 'Christmas Eve', date: `${year}-12-24` },
    { label: '5 Jan', date: `${year + 1}-01-05` },
  ];
}

/** Forget the tester's progress (its own copies of the four stores); the real ones and the tester state stay. */
export function resetTesterProgress(storage = globalThis.localStorage) {
  for (const k of PROGRESS) storage.removeItem(testerKey(k));
}

/** After changing the date or holiday: the tester's day begins again (a saved day keeps the holidays it began
 *  with), keeping the day number and who's playing. Only the tester's own save; the real one is never read. */
export function freshTesterDay(storage = globalThis.localStorage) {
  const key = testerKey('fordHouse.save.v1');
  try {
    const raw = storage.getItem(key);
    if (!raw) return;
    const save = JSON.parse(raw);
    delete save.today;
    storage.setItem(key, JSON.stringify(save));
  } catch (e) { /* a broken tester save: Reset tester progress clears it */ }
}

const EVERYONE = ['dad', 'mum', 'girl', 'boy'];
/** Every mission, with who can play it: the players it's written for (`who`), where it has a start spot for them
 *  (as missions.js start() checks); a mission no one can play is left out. */
export function missionChoices(missions, kids) {
  return Object.entries(missions).map(([id, m]) => ({
    id, title: m.title,
    who: (m.who || EVERYONE).filter(w => (m.spot ? m.spot(w) : kids[w])),
  })).filter(m => m.who.length);
}

/** The job picker's list: jobs whose title or id has the search in it (any case), by title, at most 40. */
export function jobChoices(jobs, query) {
  const q = (query || '').trim().toLowerCase();
  return jobs.filter(j => !q || j.title.toLowerCase().includes(q) || j.id.toLowerCase().includes(q))
    .sort((a, b) => a.title.localeCompare(b.title)).slice(0, 40);
}

const SHORT = d => d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

export function createTester(ctx) {
  const st = readTester();
  const make = (tag, props = {}, kids = []) => { const e = Object.assign(document.createElement(tag), props); kids.forEach(k => e.append(k)); return e; };

  const banner = make('div', { id: 'testerBanner', className: 'tester-banner' });
  const what = [`🧪 TESTER MODE · ${SHORT(today())}`, st.holiday && `holiday: ${st.holiday}`, st.season && `season: ${st.season}`, st.birthday && `birthday: ${st.birthday}`].filter(Boolean);
  banner.textContent = what.join(' · ');
  const openBtn = make('button', { id: 'testerOpen', className: 'tester-open', type: 'button', title: 'Tester panel' });
  openBtn.textContent = '🧪';
  openBtn.setAttribute('aria-label', 'Open the tester panel');

  const panel = make('div', { id: 'testerPanel', className: 'tester-panel', hidden: true });
  panel.setAttribute('role', 'dialog'); panel.setAttribute('aria-label', 'Tester panel');
  const h = make('h2'); h.textContent = 'Tester mode';
  const note = make('p', { className: 'tester-note' }); note.textContent = 'Progress here is separate from the family\'s real saves.';

  const date = make('input', { id: 'testerDate', type: 'date', value: st.date || '' });
  const chips = make('div', { className: 'tester-chips' });
  dateChips(today().getMonth() === 0 ? today().getFullYear() - 1 : today().getFullYear()).forEach(c => {
    const b = make('button', { type: 'button' }); b.textContent = c.label; b.dataset.dateChip = c.label;
    b.addEventListener('click', () => { date.value = c.date; chips.querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b)); });
    chips.append(b);
  });
  const select = (id, label, values, current) => {
    const s = make('select', { id });
    [['', 'auto'], ...values.map(v => [v, v])].forEach(([v, t]) => { const o = make('option', { value: v }); o.textContent = t; s.append(o); });
    s.value = current || '';
    const l = make('label'); l.append(label, s); return [l, s];
  };
  const [holL, hol] = select('testerHoliday', 'Holiday ', ['none', 'halloween', 'christmas'], st.holiday);
  const [seaL, sea] = select('testerSeason', 'Season ', SEASONS, st.season);
  const [bdL, bd] = select('testerBirthday', 'Birthday ', ['none', 'dad', 'mum', 'girl', 'boy'], st.birthday);
  const dateL = make('label'); dateL.append('Date ', date);

  const apply = make('button', { id: 'testerApply', type: 'button', className: 'tester-main' }); apply.textContent = 'Apply & reload';
  apply.addEventListener('click', () => {
    writeTester({ date: date.value || '', holiday: hol.value, season: sea.value, birthday: bd.value });
    freshTesterDay();
    location.reload();
  });
  const reset = make('button', { id: 'testerReset', type: 'button' }); reset.textContent = 'Reset tester progress';
  reset.addEventListener('click', () => { resetTesterProgress(); location.reload(); });
  const doors = make('button', { id: 'testerDoors', type: 'button' }); doors.textContent = 'Open all Advent doors';
  doors.addEventListener('click', () => {   // the Advent calendar as on Christmas Eve, every door opened (tester progress), then reload
    const t = today(), y = t.getMonth() === 0 ? t.getFullYear() - 1 : t.getFullYear();
    const eve = createAdvent({ now: () => new Date(y, 11, 24, 12) });
    for (const who of ['girl', 'boy']) for (let d = 1; d <= 24; d++) eve.open(who, d);
    location.reload();
  });
  const close = make('button', { id: 'testerClose', type: 'button', className: 'tester-close' }); close.textContent = 'Close';
  // any job: today's list becomes just that one, for whoever's playing
  const jobH = make('h3'); jobH.textContent = 'Jobs';
  const find = make('input', { id: 'testerJobFind', type: 'search', placeholder: 'Find a job' });
  const jobList = make('div', { className: 'tester-jobs' });
  const showJobs = () => {
    jobList.replaceChildren(...jobChoices(ctx.days.jobs(), find.value).map(j => {
      const b = make('button', { type: 'button' }); b.textContent = j.title; b.dataset.job = j.id;
      b.addEventListener('click', () => { api.close(); if (ctx.home) ctx.home.close(); if (ctx.S && ctx.S.mission) ctx.missions.end(); ctx.days.plan([j.id]); });
      return b;
    }));
  };
  find.addEventListener('input', showJobs);
  // play as anyone, and start any mission as anyone it's written for
  const asH = make('h3'); asH.textContent = 'Play as';
  const as = make('div', { className: 'tester-row' });
  EVERYONE.forEach(w => { const b = make('button', { type: 'button' }); b.textContent = nameOf(w); b.dataset.playAs = w; b.addEventListener('click', () => { ctx.playAs(w); api.close(); }); as.append(b); });
  const misH = make('h3'); misH.textContent = 'Missions';
  const mis = make('div', { className: 'tester-missions' });
  if (ctx.missionList) for (const m of missionChoices(ctx.missionList.MISSIONS, ctx.missionList.KIDS)) {
    const row = make('div', { className: 'tester-row' }), t = make('span'); t.textContent = m.title; row.append(t);
    m.who.forEach(w => { const b = make('button', { type: 'button' }); b.textContent = nameOf(w); b.dataset.mission = m.id; b.dataset.who = w; b.addEventListener('click', () => { api.close(); if (ctx.home) ctx.home.close(); ctx.missions.start(m.id, w); }); row.append(b); });
    mis.append(row);
  }
  close.addEventListener('click', () => api.close());
  openBtn.addEventListener('click', () => (panel.hidden ? api.open() : api.close()));
  panel.append(h, note, dateL, chips, holL, seaL, bdL, make('div', { className: 'tester-row' }, [apply, reset, doors]), asH, as, misH, mis, jobH, find, jobList, close);
  document.body.append(banner, openBtn, panel);

  const api = {
    open() { panel.hidden = false; S_menu(true); showJobs(); date.focus(); },
    close() { panel.hidden = true; S_menu(false); },
  };
  function S_menu(on) { if (ctx.S) ctx.S.testerOpen = on; }
  return api;
}

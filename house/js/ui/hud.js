// Everything on screen that isn't 3D: room chip, job list, action button, banner, toasts, hint.
import { S } from '../state.js';

const $ = id => document.getElementById(id);

export function createHud() {
  const el = {
    roomName: $('roomName'), roomArea: $('roomArea'),
    panel: $('taskPanel'), toggle: $('taskToggle'), list: $('taskList'), count: $('taskCount'),
    nextTitle: $('nextTitle'), nextStep: $('nextStep'),
    act: $('actBtn'), toast: $('toast'), alert: $('alert'), hint: $('hint'), dayLabel: $('dayLabel'),
    dayDone: $('dayDone'), dayDoneTitle: $('dayDoneTitle'), dayDoneStats: $('dayDoneStats'), dayDoneTomorrow: $('dayDoneTomorrow'),
    dayDoneTotals: $('dayDoneTotals'), dayNext: $('dayNext'), dayRestart: $('dayRestart'), dayRestartConfirm: $('dayRestartConfirm'),
    dayRestartYes: $('dayRestartYes'), dayRestartNo: $('dayRestartNo'),
  };
  let toastTimer = null, lastRoom = '', lastAction = null, lastBanner = null;

  // the job list starts folded on phones so it doesn't cover the house
  if (window.innerWidth < 600) { el.panel.classList.add('collapsed'); el.toggle.setAttribute('aria-expanded', 'false'); }
  el.toggle.addEventListener('click', () => {
    el.panel.classList.toggle('collapsed');
    el.toggle.setAttribute('aria-expanded', String(!el.panel.classList.contains('collapsed')));
  });

  const titleOf = job => job.status ? `${job.title} · ${job.status}` : job.title;
  const idleHint = { mow: 'Push the mower over the grass', hoover: 'Hoover up the dusty spots', charge: 'Charging, do other jobs meanwhile' };

  function renderJobs(jobs) {
    const open = jobs.filter(j => j.i < j.steps.length), done = jobs.filter(j => j.i >= j.steps.length);
    el.list.replaceChildren(...open.concat(done).map(j => {
      const li = document.createElement('li');
      if (j.i >= j.steps.length) li.className = 'done';
      li.append(document.createElement('i'), Object.assign(document.createElement('span'), { textContent: titleOf(j) }));
      return li;
    }));
    el.count.textContent = `${done.length}/${jobs.length}`;
    // the job you're holding something for comes first, otherwise the first open one
    const holding = j => { const s = j.steps[j.i]; return (s.item && s.item === S.carrying) || (s.kind === 'mow' && S.carrying === 'mower') || (s.kind === 'hoover' && S.carrying === 'hoover'); };
    const cur = open.find(holding) || open[0];
    el.nextTitle.textContent = cur ? titleOf(cur) : 'All jobs done!';
    const s = cur && cur.steps[cur.i];
    el.nextStep.textContent = s ? (s.label || idleHint[s.kind] || '') : '';
  }

  const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;

  return {
    renderJobs,
    setDay(n) { el.dayLabel.textContent = `Day ${n}`; },
    showDayComplete({ day, jobs, minutes, tomorrow, totals }) {
      el.dayDoneTitle.textContent = `Day ${day} complete`;
      el.dayDoneStats.textContent = minutes ? `${plural(jobs, 'job')} done in ${plural(minutes, 'minute')}` : `All ${plural(jobs, 'job')} done`;
      const items = tomorrow.length ? tomorrow : ['Just the everyday jobs'];
      el.dayDoneTomorrow.replaceChildren(...items.map(t => Object.assign(document.createElement('li'), { textContent: t })));
      el.dayNext.textContent = `Start day ${day + 1}`;
      el.dayDoneTotals.textContent = `${plural(totals.daysDone, 'day')} and ${plural(totals.jobsDone, 'job')} done so far`;
      el.dayRestart.hidden = false; el.dayRestartConfirm.hidden = true;
      el.dayDone.hidden = false;
      el.dayNext.focus();
    },
    hideDayComplete() { el.dayDone.hidden = true; },
    onDayButtons({ next, restart }) {
      el.dayNext.addEventListener('click', next);
      el.dayRestart.addEventListener('click', () => { el.dayRestart.hidden = true; el.dayRestartConfirm.hidden = false; });
      el.dayRestartNo.addEventListener('click', () => { el.dayRestart.hidden = false; el.dayRestartConfirm.hidden = true; });
      el.dayRestartYes.addEventListener('click', restart);
    },
    setRoom(room) {
      if (room.name === lastRoom) return;
      lastRoom = room.name; el.roomName.textContent = room.name; el.roomArea.textContent = room.area;
    },
    setAction(label) {
      if (label === lastAction) return;
      lastAction = label;
      el.act.hidden = !label;
      if (label) el.act.textContent = label;
    },
    onAction(fn) { el.act.addEventListener('click', fn); },
    toast(msg) {
      el.toast.textContent = msg; el.toast.classList.add('show');
      clearTimeout(toastTimer); toastTimer = setTimeout(() => el.toast.classList.remove('show'), 2400);
    },
    /** The ringing banner above the stick. Pass null to hide it. */
    banner(text) {
      if (text === lastBanner) return;
      lastBanner = text; el.alert.hidden = !text; if (text) el.alert.textContent = text;
    },
    hideHint() { el.hint.classList.add('gone'); },
    bindCharacterButtons(onPick) {
      const buttons = document.querySelectorAll('.who button');
      const mark = k => buttons.forEach(b => b.setAttribute('aria-pressed', String(b.dataset.c === k)));
      buttons.forEach(b => b.addEventListener('click', () => { onPick(b.dataset.c); mark(b.dataset.c); }));
      return mark;
    },
  };
}

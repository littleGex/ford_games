// Everything on screen that isn't 3D: room chip, job list, action button, banner, toasts, hint.
import { S } from '../state.js';
import { FLOOR_NAMES } from '../config.js';

const $ = id => document.getElementById(id);

export function createHud() {
  const el = {
    roomName: $('roomName'), roomArea: $('roomArea'), floorName: $('floorName'),
    panel: $('taskPanel'), toggle: $('taskToggle'), list: $('taskList'), count: $('taskCount'),
    nextTitle: $('nextTitle'), nextStep: $('nextStep'),
    act: $('actBtn'), toast: $('toast'), alert: $('alert'), hint: $('hint'), dayLabel: $('dayLabel'),
    dayDone: $('dayDone'), dayDoneTitle: $('dayDoneTitle'), dayDoneStats: $('dayDoneStats'), dayDoneTomorrow: $('dayDoneTomorrow'),
    dayDoneTotals: $('dayDoneTotals'), dayNext: $('dayNext'), dayRestart: $('dayRestart'), dayRestartConfirm: $('dayRestartConfirm'),
    dayRestartYes: $('dayRestartYes'), dayRestartNo: $('dayRestartNo'),
    gameRestart: $('gameRestart'), gameRestartConfirm: $('gameRestartConfirm'),
    gameRestartYes: $('gameRestartYes'), gameRestartNo: $('gameRestartNo'),
  };
  let toastTimer = null, lastRoom = '', lastAction = null, lastBanner = null;

  // the job list starts folded on phones so it doesn't cover the house
  if (window.innerWidth < 600) { el.panel.classList.add('collapsed'); el.toggle.setAttribute('aria-expanded', 'false'); }
  el.toggle.addEventListener('click', () => {
    el.panel.classList.toggle('collapsed');
    el.toggle.setAttribute('aria-expanded', String(!el.panel.classList.contains('collapsed')));
  });

  const titleOf = job => job.status ? `${job.title} · ${job.status}` : job.title;
  const idleHint = { mow: 'Push the mower over the grass', hoover: 'Hoover up the dusty spots', charge: 'Charging, do other jobs meanwhile', wait: 'Running, do other jobs meanwhile' };

  function renderJobs(jobs) {
    const open = jobs.filter(j => j.i < j.steps.length).sort((a, b) => (b.urgent ? 1 : 0) - (a.urgent ? 1 : 0)), done = jobs.filter(j => j.i >= j.steps.length);   // urgent ones (a fire drill) at the top
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
  // "Start over" asks first: the link swaps for "Lose all progress? Yes / No"
  const askFirst = (link, confirm, asking) => { link.hidden = asking; confirm.hidden = !asking; };

  return {
    renderJobs,
    setDay(n) { el.dayLabel.textContent = `Day ${n}`; },
    /** Something else in the day's place on the job list (a mission and its clock). */
    setDayLabel(text) { el.dayLabel.textContent = text; },
    showDayComplete({ day, jobs, minutes, tomorrow, totals }) {
      el.dayDoneTitle.textContent = `Day ${day} complete`;
      el.dayDoneStats.textContent = minutes ? `${plural(jobs, 'job')} done in ${plural(minutes, 'minute')}` : `All ${plural(jobs, 'job')} done`;
      const items = tomorrow.length ? tomorrow : ['Just the everyday jobs'];
      el.dayDoneTomorrow.replaceChildren(...items.map(t => Object.assign(document.createElement('li'), { textContent: t })));
      el.dayNext.textContent = `Start day ${day + 1}`;
      el.dayDoneTotals.textContent = `${plural(totals.daysDone, 'day')} and ${plural(totals.jobsDone, 'job')} done so far`;
      askFirst(el.dayRestart, el.dayRestartConfirm, false);
      el.dayDone.hidden = false;
      el.dayNext.focus();
    },
    hideDayComplete() { el.dayDone.hidden = true; askFirst(el.gameRestart, el.gameRestartConfirm, false); },
    onDayButtons({ next, restart }) {
      el.dayNext.addEventListener('click', next);
      // the same "start over" on the Day complete screen and under the job list
      for (const [link, confirm, yes, no] of [
        [el.dayRestart, el.dayRestartConfirm, el.dayRestartYes, el.dayRestartNo],
        [el.gameRestart, el.gameRestartConfirm, el.gameRestartYes, el.gameRestartNo],
      ]) {
        link.addEventListener('click', () => askFirst(link, confirm, true));
        no.addEventListener('click', () => askFirst(link, confirm, false));
        yes.addEventListener('click', restart);
      }
    },
    setRoom(room) {
      const key = `${room.level || 0}:${room.name}:${room.area}`;   // (several classrooms share a name)
      if (key === lastRoom) return;
      lastRoom = key; el.roomName.textContent = room.name; el.roomArea.textContent = room.area;
      el.floorName.textContent = room.floor || FLOOR_NAMES[room.level || 0];   // (the school's lesson floor is upstairs)
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
      const buttons = document.querySelectorAll('.who button, .home-who button');   // the corner and the home screen
      const mark = k => buttons.forEach(b => b.setAttribute('aria-pressed', String(b.dataset.c === k)));
      buttons.forEach(b => b.addEventListener('click', () => { onPick(b.dataset.c); mark(b.dataset.c); }));
      return mark;
    },
  };
}

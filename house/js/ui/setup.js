// The first visit: a short setup over the home screen, the first time the game opens on a device. Who's in
// the family (names, she/he/they, a family with one grown-up), the children's birthdays, who sleeps where and
// which jobs fit. Everything is set as it's chosen (players.js, settings.js), so leaving early keeps what's
// done; "Play as Dad, Mum, P and Dude" keeps the usual family. A family server token instead brings the
// family's settings from the server (settingsync.js). It all stays changeable from the home screen.
//
// Not shown again once it's been closed, nor on a device that has played before, nor when the game was opened
// from a share link (that asks about its own settings).
import { S } from '../state.js';
import { DEFAULT_NAMES, GROWN_UPS, PRONOUNS, nameOf, pronounOf, showNames } from '../names.js';
import { kidIn } from '../pack/kidrooms.js';
import { WORK_DESKS, workerAt } from '../pack/workdesks.js';
import { JOB_GROUPS } from '../settings.js';

export const SETUP_KEY = 'fordHouse.setup.v1';
const STEPS = ['welcome', 'grownUps', 'children', 'rooms', 'jobs', 'done'];
const PRONOUN_LABELS = { she: 'She / her', he: 'He / his', they: 'They / their' };

/** Has this device never had the game open (no setup, no save, no players)? Checked before the game starts. */
export function isFirstVisit(storage = globalThis.localStorage) {
  try {
    return !storage.getItem(SETUP_KEY) && !storage.getItem('fordHouse.save.v1') && !storage.getItem('fordHouse.players.v1');
  } catch (e) { return false; }
}
const markDone = () => { try { localStorage.setItem(SETUP_KEY, 'done'); } catch (e) { /* private mode: asks again next time */ } };

export function createSetup(ctx) {
  const { players, settings, familyServer } = ctx;
  const $ = id => document.getElementById(id);
  const el = { box: $('setup'), step: $('setupStep'), title: $('setupTitle'), body: $('setupBody'), back: $('setupBack'), next: $('setupNext') };
  let at = 0, changed = false;
  const make = (tag, props = {}, ...kids) => { const e = document.createElement(tag); Object.assign(e, props); e.append(...kids); return e; };
  const note = text => make('p', { className: 'settings-note', textContent: text });

  // --- one person: a name, she/he/they, and (grown-ups) whether they're in the family; (children) a birthday
  function person(k) {
    const box = make('div', { className: 'setup-person' });
    box.dataset.person = k;
    const name = make('input', { type: 'text', maxLength: 16, autocomplete: 'off', spellcheck: false, placeholder: DEFAULT_NAMES[k], value: players.customName(k) || '' });
    name.setAttribute('aria-label', `${DEFAULT_NAMES[k]}: name`);
    name.dataset.field = 'name';
    name.addEventListener('input', () => { players.setName(k, name.value); changed = true; showNames(); });
    const head = make('div', { className: 'setup-name' }, make('span', { className: 'avatar-label', textContent: DEFAULT_NAMES[k] }), name);
    const chips = make('div', { className: 'avatar-opts' });
    chips.setAttribute('role', 'group'); chips.setAttribute('aria-label', `How to talk about ${DEFAULT_NAMES[k]}`);
    for (const p of PRONOUNS) {
      const b = make('button', { type: 'button', className: 'avatar-chip', textContent: PRONOUN_LABELS[p] });
      b.dataset.pronoun = p;
      b.setAttribute('aria-pressed', String(pronounOf(k) === p));
      b.addEventListener('click', () => { players.setPronoun(k, p); changed = true; render(); });
      chips.append(b);
    }
    box.append(head, chips);
    if (GROWN_UPS.includes(k)) {
      const other = GROWN_UPS.find(g => g !== k), on = players.inFamily(k);
      const b = make('button', { type: 'button', className: 'settings-switch' },
        make('span', { className: 'settings-label', textContent: 'In our family' }), make('span', { className: 'settings-state', textContent: on ? 'Yes' : 'No' }));
      b.dataset.family = k;
      b.setAttribute('role', 'switch'); b.setAttribute('aria-checked', String(on));
      b.disabled = on && !players.inFamily(other);   // there's always a grown-up
      b.addEventListener('click', () => { if (players.setInFamily(k, !players.inFamily(k))) { changed = true; showNames(); render(); } });
      box.append(b);
    } else {
      const date = make('input', { type: 'date', value: players.birthday(k) || '', max: new Date().toISOString().slice(0, 10) });
      date.dataset.field = 'birthday';
      date.setAttribute('aria-label', `${DEFAULT_NAMES[k]}: birthday`);
      date.addEventListener('change', () => { players.setBirthday(k, date.value); changed = true; });
      box.append(make('div', { className: 'setup-name' }, make('span', { className: 'avatar-label', textContent: 'Birthday' }), date));
    }
    return box;
  }

  // --- the steps
  const PAGES = {
    welcome: () => {
      const start = make('button', { type: 'button', className: 'btn setup-big', id: 'setupStart', textContent: 'Set up our family' });
      start.addEventListener('click', () => go(1));
      const fords = make('button', { type: 'button', className: 'linkbtn', id: 'setupFords', textContent: 'Play as Dad, Mum, P and Dude' });
      fords.addEventListener('click', finish);
      const token = make('input', { type: 'password', id: 'setupToken', autocomplete: 'off', placeholder: 'Game token' });
      token.setAttribute('aria-label', 'Game token');
      const connect = make('button', { type: 'button', className: 'avatar-chip', id: 'setupConnect', textContent: 'Connect' });
      const status = make('p', { className: 'settings-note', id: 'setupServer' });
      status.setAttribute('aria-live', 'polite');
      connect.addEventListener('click', async () => {
        if (!token.value.trim() || !familyServer) return;
        status.textContent = 'Connecting…';
        const st = await familyServer.connect(token.value);
        token.value = '';
        if (!st || !st.ok) { status.textContent = (st && st.message) || 'That didn\'t work'; status.classList.add('bad'); return; }
        if (ctx.settingsSync) await ctx.settingsSync.sync();
        changed = true;
        go(STEPS.indexOf('done'));
      });
      return [
        note('A game about the jobs in a family home. Set it up for your family? It takes a minute, and everything can be changed later from the home screen.'),
        start, fords,
        make('h2', { textContent: 'Family server' }),
        note('Got a game token? Connect, and your family\'s names, birthdays and settings come from the server.'),
        make('div', { className: 'avatar-server-row' }, token, connect), status,
      ];
    },
    grownUps: () => [note('Who are the grown-ups? Type a name if it isn\'t Dad or Mum. A family with one grown-up: switch the other off.'), ...GROWN_UPS.map(person)],
    children: () => [note('And the children? Their birthday makes them a child, a teenager or a grown-up in the game.'), person('girl'), person('boy')],
    rooms: () => {
      const swap = make('button', { type: 'button', className: 'avatar-chip settings-share', id: 'setupSwap', textContent: `Swap: ${nameOf(kidIn('attic'))} downstairs, ${nameOf(kidIn('first'))} in the attic` });
      swap.addEventListener('click', () => { settings.setRoomsSwapped(!settings.roomsSwapped()); changed = true; render(); });
      const both = players.inFamily('dad') && players.inFamily('mum'), d = workerAt('dressing'), a = workerAt('attic');
      const desks = make('button', { type: 'button', className: 'avatar-chip settings-share', id: 'setupSwapDesks', textContent: `Swap: ${nameOf(a)} in the dressing room, ${nameOf(d)} in the attic` });
      desks.addEventListener('click', () => { settings.setDesksSwapped(!settings.desksSwapped()); changed = true; render(); });
      return [note(`${nameOf(kidIn('first'))} sleeps in the room on the first floor, ${nameOf(kidIn('attic'))} in the attic room. Their bed, wardrobe and desk go with them.`), swap,
        ...(both ? [make('h2', { textContent: 'Working from home' }), note(`${nameOf(d)} works at ${WORK_DESKS.dressing.name}, ${nameOf(a)} in ${WORK_DESKS.attic.name}.`), desks] : [])];
    },
    jobs: () => {
      const list = make('ul', { className: 'settings-jobs' });
      for (const g of JOB_GROUPS) {
        const on = settings.isOn(g.id);
        const b = make('button', { type: 'button', className: 'settings-switch' },
          make('span', { className: 'settings-icon', textContent: g.icon }), make('span', { className: 'settings-label', textContent: g.label }),
          make('span', { className: 'settings-state', textContent: on ? 'On' : 'Off' }));
        b.dataset.group = g.id;
        b.setAttribute('role', 'switch'); b.setAttribute('aria-checked', String(on));
        b.querySelector && b.querySelector('.settings-icon') && b.querySelector('.settings-icon').setAttribute('aria-hidden', 'true');
        b.addEventListener('click', () => { settings.set(g.id, !settings.isOn(g.id)); changed = true; render(); });
        list.append(make('li', {}, b));
      }
      return [note('Switch off what doesn\'t fit your family: no bearded dragon, no clarinet, no Christmas...'), list];
    },
    done: () => {
      const fam = ['dad', 'mum', 'girl', 'boy'].filter(k => players.inFamily(k)).map(nameOf);
      const off = JOB_GROUPS.filter(g => !settings.isOn(g.id)).map(g => g.label);
      const list = make('ul', { className: 'settings-import' },
        make('li', { textContent: `The family: ${fam.slice(0, -1).join(', ')} and ${fam[fam.length - 1]}` }),
        make('li', { textContent: `${nameOf(kidIn('first'))} on the first floor, ${nameOf(kidIn('attic'))} in the attic` }),
        make('li', { textContent: off.length ? `Switched off: ${off.join(', ')}` : 'All jobs on' }));
      return [list, note('Looks and birthdays are in "Names, looks and birthdays" on the home screen; bedrooms, jobs and sharing with another phone in the card under it.')];
    },
  };
  const TITLES = { welcome: 'Welcome to Ford House', grownUps: 'The grown-ups', children: 'The children', rooms: 'Bedrooms and desks', jobs: 'Jobs in the house', done: 'All set!' };

  function render() {
    const id = STEPS[at];
    el.title.textContent = TITLES[id];
    el.step.textContent = id === 'welcome' || id === 'done' ? '' : `Step ${at} of ${STEPS.length - 2}`;
    el.body.replaceChildren(...PAGES[id]());
    el.back.hidden = id === 'welcome';
    el.next.hidden = id === 'welcome';
    el.next.textContent = id === 'done' ? 'Start playing' : 'Next';
    el.box.dataset.step = id;
  }
  function go(i) {
    at = Math.max(0, Math.min(STEPS.length - 1, i));
    render();
    const first = el.body.querySelector && el.body.querySelector('input, button');
    if (first && first.focus) first.focus();
  }

  function open() {
    if (!el.box || !globalThis.document || !document.createElement) return;
    S.settings = true; el.box.hidden = false; at = 0; changed = false;
    render();
    const start = $('setupStart');
    if (start && start.focus) start.focus();
  }

  /** Done (or skipped): never again on this device; the day is planned for the family as it is now. */
  function finish() {
    markDone();
    if (!el.box || el.box.hidden) return;
    el.box.hidden = true; S.settings = false;
    if (changed && ctx.settingsCard) ctx.settingsCard.refresh();
    if (ctx.home && ctx.home.isOpen) ctx.home.render();
  }

  /** At start-up: the first visit on this device, unless a share link is being asked about. */
  function maybeOpen(firstVisit, { linkOpened = false } = {}) {
    if (!firstVisit || linkOpened) { markDone(); return false; }
    open();
    return true;
  }

  if (el.back) el.back.addEventListener('click', () => go(at - 1));
  if (el.next) el.next.addEventListener('click', () => (STEPS[at] === 'done' ? finish() : go(at + 1)));
  globalThis.addEventListener('keydown', e => {
    if (!el.box || el.box.hidden || e.key !== 'Escape') return;
    e.preventDefault(); e.stopImmediatePropagation(); finish();
  }, true);

  return { open, finish, maybeOpen, go, get step() { return STEPS[at]; }, get isOpen() { return !!el.box && !el.box.hidden; } };
}

// The Advent calendars up close (advent.js has the doors): P's and Dude's, 24 doors each in the calendar's
// muddled order. Doors whose day has come glow; tap one on your own calendar to open it. Open doors show
// what was behind them, and the list underneath keeps every gift found so far. Opened from P's or Dude's
// Advent job, from the calendars on the living room wall, or from the home screen in December.
import { S } from '../state.js';
import { DOOR_ORDER } from '../advent.js';

const NAMES = { girl: 'P', boy: 'Dude' };

export function createAdventCard({ advent, days, hud }) {
  const $ = id => document.getElementById(id);
  const el = { box: $('advent'), grid: $('adventGrid'), status: $('adventStatus'), gifts: $('adventGifts'), count: $('adventCount'), done: $('adventDone'), home: $('adventBtn') };
  const tabs = [...document.querySelectorAll('#advent [data-k]')];
  let key = 'girl', said = null;

  const me = () => days.character;
  const mine = () => me() === key;

  function defaultStatus() {
    const N = NAMES[key], ready = advent.ready(key), opened = advent.opened(key).length, upTo = advent.upTo();
    if (!mine()) {
      return ready.length
        ? `${N} has ${ready.length === 1 ? 'a door' : `${ready.length} doors`} to open. Only ${N} can open ${N}'s calendar.`
        : `${N}'s calendar: ${opened} of 24 doors open.`;
    }
    if (ready.length > 3) return `${ready.length} doors are waiting (you missed a few days!). Tap the glowing ones to open them.`;
    if (ready.length > 1) return `Doors ${ready.slice(0, -1).join(', ')} and ${ready[ready.length - 1]} are ready: you missed a day or two! Tap one to open it.`;
    if (ready.length === 1) return `Door ${ready[0]} is ready. Tap it to open it!`;
    if (opened === 24) return 'All 24 doors open. Merry Christmas! 🎄';
    return upTo < 24 ? `You've opened today's door. Door ${upTo + 1} opens tomorrow.` : 'No more doors to open.';
  }

  function render() {
    tabs.forEach(t => t.setAttribute('aria-selected', String(t.dataset.k === key)));
    el.grid.replaceChildren(...DOOR_ORDER.map(n => {
      const b = document.createElement('button');
      b.type = 'button'; b.dataset.door = String(n);
      const open = advent.isOpen(key, n), ready = advent.canOpen(key, n);
      b.className = `advent-door ${key} ${open ? 'open' : ready ? 'ready' : 'shut'}`;
      if (open) {
        const [icon, name] = advent.gift(key, n);
        b.innerHTML = `<span class="advent-num">${n}</span><span class="advent-gift" aria-hidden="true">${icon}</span>`;
        b.setAttribute('aria-label', `Door ${n}, open: ${name}`);
      } else {
        b.innerHTML = `<span class="advent-big">${n}</span>`;
        b.setAttribute('aria-label', `Door ${n}${ready ? ', ready to open' : ', shut'}`);
      }
      b.addEventListener('click', () => tap(n));
      return b;
    }));
    const opened = advent.opened(key);
    el.count.textContent = `${opened.length} of 24 doors open`;
    el.gifts.replaceChildren(...opened.map(n => {
      const [icon, name] = advent.gift(key, n), li = document.createElement('li');
      li.textContent = `${n} ${icon} ${name}`;
      return li;
    }));
    el.status.textContent = said || defaultStatus();
  }

  function tap(n) {
    const N = NAMES[key];
    if (advent.isOpen(key, n)) { const [icon, name] = advent.gift(key, n); said = `Door ${n}: ${icon} ${name}`; render(); return; }
    if (!advent.canOpen(key, n)) { said = n > advent.upTo() ? `Door ${n} opens on ${n} December. No peeking! 👀` : `Door ${n} isn't ready yet.`; render(); return; }
    if (!mine()) { said = `Only ${N} can open ${N}'s doors: play as ${N} to open it.`; render(); return; }
    choose(n);
  }

  /** Open door n on the calendar being looked at (if it's yours and its day has come). */
  function choose(n) {
    const gift = advent.open(key, n);
    if (!gift) return null;
    const [icon, name] = gift;
    said = `Door ${n}: ${icon} ${name}!`;
    hud.toast(`Door ${n}: ${name}! ${icon}`);
    render();
    const b = el.grid.querySelector && el.grid.querySelector(`[data-door="${n}"]`);
    if (b && b.classList) b.classList.add('just-opened');   // the door swings open
    return gift;
  }

  function open(who) {
    key = NAMES[who] ? who : NAMES[me()] ? me() : 'girl';
    said = null;
    S.calendar = true; el.box.hidden = false;
    render();
    const tab = tabs.find(t => t.dataset.k === key);
    if (tab && tab.focus) tab.focus();
  }

  function close() {
    if (el.box.hidden) return;
    S.calendar = false; el.box.hidden = true;
  }

  /** The home screen's button shows while the calendars are up (December, and over Christmas). */
  function showButton(up) { if (el.home) el.home.hidden = !up; }

  tabs.forEach(t => t.addEventListener('click', () => { key = t.dataset.k; said = null; render(); }));
  el.done.addEventListener('click', close);
  if (el.home) el.home.addEventListener('click', () => open(me()));
  globalThis.addEventListener('keydown', e => {
    if (!S.calendar) return;
    if (e.key === 'Escape') { e.preventDefault(); e.stopImmediatePropagation(); close(); }
  }, true);
  advent.onChange(() => { if (!el.box.hidden) render(); });

  return { open, close, choose, showButton, render, get key() { return key; }, get isOpen() { return !el.box.hidden; } };
}

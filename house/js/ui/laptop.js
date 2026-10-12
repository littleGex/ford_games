// The laptop close-up for the 3D printing mission: a 'choose' step opens it at Dad's desk with tiles to
// pick from (a design, then a filament colour); tap one, or press its number. "Close the laptop" keeps your
// place on the list.
import { S } from '../state.js';
import { DESIGNS, COLOURS } from '../systems/printing.js';

const SCREENS = {
  design: { app: 'Printables', title: 'Pick something to print', options: () => DESIGNS.map(d => ({ id: d.id, label: d.label, icon: d.icon })) },
  filament: { app: 'Filament shop', title: 'Order a spool of filament', options: () => COLOURS.map(c => ({ id: c.id, label: c.label, swatch: c.hex })),
              note: 'It comes by courier to the front door.' },
};

export function createLaptop({ board, hud }) {
  const $ = id => document.getElementById(id);
  const el = { box: $('laptop'), app: $('laptopApp'), title: $('laptopTitle'), tiles: $('laptopTiles'), note: $('laptopNote'), later: $('laptopLater') };
  let job = null, step = null, options = [];

  function open(j, s) {
    job = j; step = s;
    const screen = SCREENS[s.choose];
    options = screen.options();
    el.app.textContent = screen.app; el.title.textContent = screen.title; el.note.textContent = screen.note || '';
    el.tiles.replaceChildren(...options.map((o, i) => {
      const b = document.createElement('button');
      b.className = 'laptop-tile'; b.dataset.choice = o.id;
      const pic = document.createElement('span');
      if (o.icon) { pic.className = 'laptop-icon'; pic.textContent = o.icon; }
      else { pic.className = 'laptop-swatch'; pic.style.background = o.swatch; }
      const k = document.createElement('kbd'); k.textContent = String(i + 1);
      b.append(pic, Object.assign(document.createElement('span'), { textContent: o.label }), k);
      b.addEventListener('click', () => choose(o.id));
      return b;
    }));
    S.laptop = true; el.box.hidden = false;
    const first = el.tiles.querySelector && el.tiles.querySelector('button');
    if (first && first.focus) first.focus();
  }

  function close() { S.laptop = false; el.box.hidden = true; }

  /** Pick an option (by id, or by its number from 1). */
  function choose(id) {
    if (!S.laptop) return;
    const o = typeof id === 'number' ? options[id - 1] : options.find(k => k.id === id);
    if (!o) return;
    const j = job, s = step;
    close();
    if (S.mission) (S.mission.choices ||= {})[s.choose] = o.id;
    if (s.onChoose) s.onChoose(o.id);
    board.advance(j, s.message ? s.message(o) : `${o.label}: good choice!`);
  }

  el.later.addEventListener('click', close);
  window.addEventListener('keydown', e => {
    if (!S.laptop) return;
    if (e.key === 'Escape') { close(); e.preventDefault(); return; }
    const n = Number(e.key);
    if (n >= 1 && n <= options.length) { choose(n); e.preventDefault(); }
  });

  return { open, close, choose, options: () => S.laptop ? options.map(o => o.id) : [], update() {} };
}

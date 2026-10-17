// The laptop close-up for the 3D printing mission: a 'choose' step opens it at Dad's desk with tiles to
// pick from (a design, then a filament colour); tap one, or press its number. "Close the laptop" keeps your
// place on the list. The same close-up, as a plain card instead of a laptop, picks a face to carve in the
// Halloween pumpkin and a costume, at bedtime who showers first and which story to read, and the cutter for
// the Christmas biscuits.
import { S } from '../state.js';
import { DESIGNS, COLOURS } from '../systems/printing.js';
import { FACES, faceImage } from '../world/halloween.js';
import { COSTUMES } from '../characters/costumes.js';
import { BOOKS } from '../systems/bedtime.js';
import { CUTTERS } from '../world/christmas.js';

const SCREENS = {
  design: { app: 'Printables', title: 'Pick something to print', options: () => DESIGNS.map(d => ({ id: d.id, label: d.label, icon: d.icon })) },
  filament: { app: 'Filament shop', title: 'Order a spool of filament', options: () => COLOURS.map(c => ({ id: c.id, label: c.label, swatch: c.hex })),
              note: 'It comes by courier to the front door.' },
  face: { card: true, title: 'Which face shall we carve?', options: () => FACES.map(f => ({ id: f.id, label: f.label, img: faceImage(f), icon: '🎃' })) },
  costume: { card: true, title: 'What are you going as?', options: () => COSTUMES.map(c => ({ id: c.id, label: c.label, icon: c.icon })) },
  // bedtime: who goes in the shower first, and which story to read
  bedFirst: { card: true, title: 'Who goes in the shower first?', options: () => [{ id: 'girl', label: 'P', icon: '👧' }, { id: 'boy', label: 'Dude', icon: '👦' }] },
  book: { card: true, title: 'Pick a bedtime story', options: () => BOOKS.map(b => ({ id: b.id, label: b.label, icon: b.icon })) },
  cutter: { card: true, title: 'Which biscuit cutter?', options: () => CUTTERS.map(c => ({ id: c.id, label: c.label, icon: c.icon })) },
};

export function createLaptop(ctx) {
  const { board } = ctx;
  const $ = id => document.getElementById(id);
  const el = { box: $('laptop'), app: $('laptopApp'), title: $('laptopTitle'), tiles: $('laptopTiles'), note: $('laptopNote'), later: $('laptopLater') };
  let job = null, step = null, options = [];

  function open(j, s) {
    job = j; step = s;
    const screen = SCREENS[s.choose];
    options = screen.options();
    el.app.textContent = screen.app || ''; el.title.textContent = screen.title; el.note.textContent = screen.note || '';
    el.box.classList.toggle('laptop--card', !!screen.card);
    el.later.textContent = screen.card ? 'Not now' : 'Close the laptop';
    el.tiles.replaceChildren(...options.map((o, i) => {
      const b = document.createElement('button');
      b.className = 'laptop-tile'; b.dataset.choice = o.id;
      const pic = document.createElement('span');
      if (o.img) { pic.className = 'laptop-pic'; const im = document.createElement('img'); im.src = o.img; im.alt = ''; pic.append(im); }
      else if (o.icon) { pic.className = 'laptop-icon'; pic.textContent = o.icon; }
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
    if (s.onChoose && s.onChoose(o.id, ctx) === false) return;   // not accepted ("Not that one!"): pick again
    close();
    if (S.mission) (S.mission.choices ||= {})[s.choose] = o.id;
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

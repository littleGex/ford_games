// Sorting the washing by colour: a little card shows one piece of washing at a time; tap Whites, Colours
// or Darks (or press 1, 2, 3). A wrong pile gives a hint and you try again. "Do it later" closes the card
// and keeps your place.
import { S } from '../state.js';

const BINS = { white: 'Whites', colour: 'Colours', dark: 'Darks' };
const CLOTHES = [
  ['#ffffff', 'white', 'White T-shirt', 'shirt'], ['#f3efe4', 'white', 'Cream pyjamas', 'trousers'], ['#eef2f6', 'white', 'White socks', 'sock'],
  ['#e04848', 'colour', 'Red T-shirt', 'shirt'], ['#48a0e0', 'colour', 'Light blue jumper', 'shirt'], ['#6cc070', 'colour', 'Green shorts', 'trousers'],
  ['#f2d22e', 'colour', 'Yellow socks', 'sock'], ['#e86a8a', 'colour', 'Pink top', 'shirt'], ['#f08a3a', 'colour', 'Orange T-shirt', 'shirt'],
  ['#c8b1e8', 'colour', 'Lilac leggings', 'trousers'],
  ['#1d1e22', 'dark', 'Black jeans', 'trousers'], ['#2c3b5c', 'dark', 'Navy hoodie', 'shirt'], ['#3a3d42', 'dark', 'Dark grey socks', 'sock'],
  ['#4a2f2a', 'dark', 'Brown trousers', 'trousers'],
];
const SHAPES = {
  shirt: 'M30 8 L44 4 Q50 12 56 4 L70 8 L88 24 L76 36 L70 30 L70 92 L30 92 L30 30 L24 36 L12 24 Z',
  trousers: 'M28 6 L72 6 L76 94 L56 94 L50 40 L44 94 L24 94 Z',
  sock: 'M40 6 L62 6 L62 58 L84 74 Q90 90 74 94 L48 94 Q34 92 38 76 Z',
};

export function createSorting({ board, hud }) {
  const $ = id => document.getElementById(id);
  const el = { box: $('sort'), shape: $('sortShape'), name: $('sortName'), count: $('sortCount'), feedback: $('sortFeedback'), later: $('sortLater'), card: $('sortCard') };
  const buttons = [...document.querySelectorAll('#sort [data-bin]')];
  let job = null, step = null;

  function show() {
    const g = step.queue[step.sorted];
    el.shape.setAttribute('d', SHAPES[g[3]]); el.shape.setAttribute('fill', g[0]);
    el.name.textContent = g[2];
    el.count.textContent = `${step.sorted + 1} / ${step.queue.length}`;
  }

  /** Start (or carry on) sorting for a 'sort' step. */
  function open(j, s) {
    job = j; step = s;
    if (!s.queue) {   // eight pieces, a few of each kind, shuffled
      const pool = [...CLOTHES].sort(() => Math.random() - 0.5);
      const pick = kind => pool.filter(c => c[1] === kind);
      s.queue = [...pick('white').slice(0, 2), ...pick('colour').slice(0, 3), ...pick('dark').slice(0, 3)].sort(() => Math.random() - 0.5);
      s.sorted = 0;
    }
    S.sorting = true;
    el.feedback.textContent = ''; show();
    el.box.hidden = false;
    buttons[0].focus();
  }

  function close() { S.sorting = false; el.box.hidden = true; }

  function choose(bin) {
    if (!S.sorting) return;
    const g = step.queue[step.sorted];
    if (g[1] !== bin) {
      el.feedback.textContent = `Not that pile! Try the ${BINS[g[1]].toLowerCase()}`;
      el.card.classList.remove('shake'); void el.card.offsetWidth; el.card.classList.add('shake');
      return;
    }
    step.sorted++;
    if (step.sorted < step.queue.length) { el.feedback.textContent = 'Yes!'; show(); return; }
    close();
    board.advance(job, 'All sorted! Take the washing to the machine');
  }

  buttons.forEach(b => b.addEventListener('click', () => choose(b.dataset.bin)));
  el.later.addEventListener('click', close);
  window.addEventListener('keydown', e => {
    if (!S.sorting) return;
    const bin = { 1: 'white', 2: 'colour', 3: 'dark' }[e.key];
    if (bin) { e.preventDefault(); choose(bin); }
    if (e.key === 'Escape') close();
  });

  return {
    open, choose, close,
    /** The right pile for the piece showing now (for the tests). */
    answer: () => S.sorting ? step.queue[step.sorted][1] : null,
  };
}

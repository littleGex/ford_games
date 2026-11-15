// Fill the fridge (#166): the food delivery's last step. A card shows one food from the bag at a time; tap where it
// goes (the door, the shelves, the bottom shelf, the salad drawer or the cupboard, or press 1 to 5). Every answer
// says why (pack/fridgefood.js judge): a fine place counts as right, a wrong one says why not and you try again,
// and a second wrong try lights the right place. The end says how many were right first time. "Do it later"
// closes the card and keeps your place (on the step: queue, done, firstTime, tries). Built like ui/sorting.js.
import { S } from '../state.js';
import { FRIDGE_PLACES, dealFood, judge } from '../pack/fridgefood.js';

export function createFridge(ctx) {
  const { board } = ctx;
  const $ = id => document.getElementById(id);
  const el = { box: $('fridge'), card: $('fridgeCard'), emoji: $('fridgeEmoji'), name: $('fridgeName'), count: $('fridgeCount'), feedback: $('fridgeFeedback'), later: $('fridgeLater') };
  const buttons = [...document.querySelectorAll('#fridge [data-place]')];
  let job = null, step = null;

  const food = () => step.queue[step.done];
  function show() {
    el.emoji.textContent = food().emoji;
    el.name.textContent = food().name;
    el.count.textContent = `${step.done + 1} / ${step.queue.length}`;
    buttons.forEach(b => b.classList.remove('lit'));
  }

  /** Start (or carry on) putting the food away for a 'fridge' step. */
  function open(j, s) {
    job = j; step = s;
    if (!s.queue) { s.queue = dealFood(); s.done = 0; s.firstTime = 0; s.tries = 0; }
    S.fridge = true;
    el.feedback.textContent = ''; show();
    el.box.hidden = false;
    buttons[0].focus();
  }

  function close() { S.fridge = false; if (el.box) el.box.hidden = true; }

  function choose(place) {
    if (!S.fridge) return;
    const r = judge(food(), place, step.tries);
    el.feedback.textContent = r.line;
    if (!r.ok) {
      step.tries++;
      if (r.show) buttons.forEach(b => b.classList.toggle('lit', b.dataset.place === r.show));
      el.card.classList.remove('shake'); void el.card.offsetWidth; el.card.classList.add('shake');
      return;
    }
    if (step.tries === 0) step.firstTime++;
    step.done++; step.tries = 0;
    if (step.done < step.queue.length) { show(); return; }
    close();
    if (step.onDone) step.onDone(ctx);   // the food out of the bag
    board.advance(job, `${r.line} All put away! ${step.firstTime} of ${step.queue.length} right first time!`);   // the last food's why too
  }

  buttons.forEach(b => b.addEventListener('click', () => choose(b.dataset.place)));
  el.later.addEventListener('click', close);
  window.addEventListener('keydown', e => {
    if (!S.fridge) return;
    const place = FRIDGE_PLACES[Number(e.key) - 1];
    if (place) { e.preventDefault(); choose(place.id); }
    if (e.key === 'Escape') { e.preventDefault(); e.stopImmediatePropagation(); close(); }
  });

  return {
    open, choose, close,
    /** For the tests: the best place, and every also-fine place, for the food showing now. */
    answer: () => (S.fridge ? food().best : null),
    alsoAll: () => (S.fridge ? [...(food().also || [])] : []),
  };
}

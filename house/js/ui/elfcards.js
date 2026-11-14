// The elf's letter and name cards (the elf arrives mission, missions.js). A job step `{ kind: 'card', card:
// 'letter' | 'name' }` opens one (jobs/board.js) and finishes when it's done: the letter when it's closed, the
// name card when "That's his name" is pressed. The letter is his first one (asking for a name) until he's been
// named, then a welcome back. Text only ever goes in with textContent (names come from the players).
import { S } from '../state.js';
import { nameOf, NAME_MAX } from '../names.js';
import { elfName } from '../elf.js';

/** "P and Dude" (whatever they're called now). */
const kids = () => `${nameOf('girl')} and ${nameOf('boy')}`;

/** The letter, paragraph by paragraph: his first, or welcome back once he has a name. */
export function letterText(named) {
  const E = elfName();
  return named
    ? [`Dear ${kids()},`,
      `It's me, ${E}! I'm back from the North Pole. Did you miss me? I've been practising my mischief all year.`,
      'From tomorrow morning, find me, put things right, and pop me back through my door.',
      `Love from ${E}`]
    : [`Dear ${kids()},`,
      "Hello! I'm one of Father Christmas's elves, and I've come all the way from the North Pole to stay with you until Christmas.",
      "Every night, while you're asleep, I'll get up to something. I'm a little bit naughty, I'm afraid! Each morning, see if you can find me, put right whatever I've done, and pop me back through my little door in the hall.",
      'But first I need a name. Will you give me one?',
      'Love from your elf'];
}

export function createElfCards(ctx) {
  const $ = id => document.getElementById(id);
  const el = { letter: $('elfLetter'), text: $('elfLetterText'), close: $('elfLetterClose'),
               name: $('elfName'), input: $('elfNameInput'), ok: $('elfNameOk') };
  let job = null, step = null, shown = [];

  function done() {
    const j = job, s = step;
    S.elfCard = null; job = null; step = null;
    el.letter.hidden = true; el.name.hidden = true;
    if (s && s.onDone) s.onDone(ctx);   // the step's own finish (e.g. the parcel put away), as board.act does
    if (j) ctx.board.advance(j);
  }

  const api = {
    /** Open a card for a job's step (or on its own, job = null). */
    open(j, st) {
      job = j; step = j ? st : null;
      S.elfCard = st.card;
      if (st.card === 'letter') {
        shown = letterText(ctx.elfLog.named());
        el.text.replaceChildren(...shown.map(t => { const p = document.createElement('p'); p.textContent = t; return p; }));
        el.letter.hidden = false; el.close.focus();
      } else {
        el.input.maxLength = NAME_MAX; el.input.value = elfName();
        el.name.hidden = false; el.input.focus();
      }
    },
    /** The letter's Close. */
    close() { if (S.elfCard === 'letter') done(); },
    /** The name card's "That's his name" (empty keeps the name he has). */
    submit(text) { if (S.elfCard !== 'name') return; ctx.elfLog.setName(text); done(); },
    /** The letter's text (for tests). */
    text: () => shown.join('\n'),
  };
  el.close.addEventListener('click', () => api.close());
  el.ok.addEventListener('click', () => api.submit(el.input.value));
  el.input.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); api.submit(el.input.value); } });
  return api;
}

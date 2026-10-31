// The lesson card at school (#65): a 'quiz' step opens it at P's desk (maths) or the round table (geography:
// flags). Six questions, four answers each (tap one, or press 1 to 4). Right: a tick, on to the next. Wrong: it
// turns red, try another; the score counts the ones right first time. The mission clock stops while the card
// is open, and moves on by the lesson's length when it's done, so a slow reader isn't late for the next one.
import { S } from '../state.js';
import { SUBJECTS, flagImage, lessonQuestions } from '../lessons.js';

export function createQuiz(ctx) {
  const { board } = ctx;
  const $ = id => document.getElementById(id);
  const el = { box: $('quiz'), subject: $('quizSubject'), count: $('quizCount'), text: $('quizText'), pic: $('quizPic'), answers: $('quizAnswers'), said: $('quizSaid'), later: $('quizLater') };
  let job = null, step = null, questions = [], at = 0, firstTry = 0, missed = false, busy = false;

  function show() {
    const q = questions[at];
    el.count.textContent = `${at + 1} of ${questions.length}`;
    el.text.textContent = q.text;
    el.pic.hidden = !q.flag;
    if (q.flag) { el.pic.src = flagImage(q.flag); el.pic.alt = 'A flag'; }
    el.said.textContent = ''; el.said.className = 'quiz-said';
    el.answers.classList.toggle('quiz-flags', q.kind === 'whichFlag');
    el.answers.replaceChildren(...q.answers.map((a, i) => {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'quiz-answer'; b.dataset.answer = a.id;
      if (a.flag) { const im = document.createElement('img'); im.src = flagImage(a.flag); im.alt = ''; b.append(im); b.setAttribute('aria-label', a.label); }
      else b.append(Object.assign(document.createElement('span'), { textContent: a.label }));
      const k = document.createElement('kbd'); k.textContent = String(i + 1); b.append(k);
      b.addEventListener('click', () => answer(a.id));
      return b;
    }));
    missed = false;
  }

  function open(j, s) {
    job = j; step = s;
    questions = lessonQuestions(s.quiz);
    at = 0; firstTry = 0; busy = false;
    el.subject.textContent = `${SUBJECTS[s.quiz].icon} ${SUBJECTS[s.quiz].title}`;
    S.quiz = true; el.box.hidden = false;
    show();
    const first = el.answers.querySelector && el.answers.querySelector('button');
    if (first && first.focus) first.focus();
  }

  function close() { S.quiz = false; el.box.hidden = true; }

  /** Answer the question showing (by answer id, or its number from 1). True if it was right. */
  function answer(id) {
    if (!S.quiz || busy) return false;
    const q = questions[at], a = typeof id === 'number' ? q.answers[id - 1] : q.answers.find(k => k.id === id);
    if (!a) return false;
    const b = el.answers.querySelector && el.answers.querySelector(`[data-answer="${a.id}"]`);
    if (a.id !== q.right) {
      missed = true;
      if (b) { b.classList.add('wrong'); b.disabled = true; }
      el.said.textContent = 'Not quite: try another one'; el.said.className = 'quiz-said bad';
      return false;
    }
    if (!missed) firstTry++;
    if (b) b.classList.add('right');
    el.said.textContent = missed ? 'Got it!' : 'Yes! ✓'; el.said.className = 'quiz-said good';
    busy = true;
    const next = () => { busy = false; at++; if (at < questions.length) show(); else finish(); };
    if (ctx.quizDelay === 0) next(); else setTimeout(next, ctx.quizDelay ?? 700);
    return true;
  }

  function finish() {
    const j = job, s = step, subject = SUBJECTS[s.quiz];
    close();
    if (S.mission) {
      (S.mission.scores ||= {})[s.quiz] = { right: firstTry, of: questions.length };
      if (S.mission.clock && s.minutes) S.mission.t += s.minutes * S.mission.clock.secondsPerMinute;   // the lesson's length
    }
    board.advance(j, `${subject.done(firstTry)} ${firstTry} of ${questions.length} right first time`);
  }

  el.later.addEventListener('click', close);
  globalThis.addEventListener('keydown', e => {
    if (!S.quiz) return;
    if (e.key === 'Escape') { close(); e.preventDefault(); e.stopImmediatePropagation(); return; }
    const n = Number(e.key);
    if (n >= 1 && n <= 4) { answer(n); e.preventDefault(); }
  }, true);

  return {
    open, close, answer,
    /** The right answer to the question showing (for tests). */
    right: () => (S.quiz ? questions[at].right : null),
    /** The question showing (for tests). */
    question: () => (S.quiz ? questions[at] : null),
    get isOpen() { return S.quiz; },
  };
}

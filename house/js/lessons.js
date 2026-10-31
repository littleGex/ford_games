// The questions in P's lessons at school (#65): six at a time, four answers each, one of them right.
//
// Maths, for a third-year class: adding and taking away up to 100, the times tables, and sharing out (easy
// division). The wrong answers are near misses (one out, ten out, the digits swapped), never the same twice.
// Geography: flags. Either a flag and four countries, or a country and four flags. The flags are drawn
// (flagImage), not emoji, so they look the same on every phone and tablet.
//
// No DOM here except flagImage, so the questions can be tested in Node.

const pick = (list, r) => list[Math.floor(r() * list.length)];
const shuffle = (list, r) => list.map(v => [r(), v]).sort((a, b) => a[0] - b[0]).map(([, v]) => v);
const int = (a, b, r) => a + Math.floor(r() * (b - a + 1));

/** Four answers: the right one and three near misses, shuffled. */
function withNearMisses(answer, r, lowest = 0) {
  const tries = [answer + 1, answer - 1, answer + 10, answer - 10, answer + 2, answer - 2,
    answer >= 10 && answer < 100 ? (answer % 10) * 10 + Math.floor(answer / 10) : null, answer + 5];
  const wrong = [];
  for (const t of shuffle(tries, r)) if (t !== null && t >= lowest && t !== answer && !wrong.includes(t) && wrong.length < 3) wrong.push(t);
  return shuffle([answer, ...wrong], r).map(n => ({ id: String(n), label: String(n) }));
}

/** One maths question: { text, answers: [{ id, label }], right: id }. */
export function mathsQuestion(r = Math.random) {
  const kind = pick(['plus', 'minus', 'times', 'times', 'share'], r);
  let text, answer;
  if (kind === 'plus') { const a = int(12, 68, r), b = int(5, 99 - a, r); text = `${a} + ${b}`; answer = a + b; }
  else if (kind === 'minus') { const a = int(25, 99, r), b = int(4, a - 5, r); text = `${a} − ${b}`; answer = a - b; }
  else if (kind === 'times') { const a = int(2, 10, r), b = int(2, 10, r); text = `${a} × ${b}`; answer = a * b; }
  else { const by = pick([2, 3, 4, 5, 10], r), n = int(2, 10, r); text = `${by * n} ÷ ${by}`; answer = n; }
  return { kind, text: `${text} = ?`, answers: withNearMisses(answer, r, kind === 'share' ? 1 : 0), right: String(answer) };
}

// --- flags: each drawn on a 3:2 canvas from simple shapes
const H = (...c) => ({ stripes: 'h', colors: c });   // horizontal stripes, top to bottom
const V = (...c) => ({ stripes: 'v', colors: c });   // vertical stripes, left to right
export const FLAGS = [
  { id: 'de', name: 'Germany', ...H('#000000', '#dd0000', '#ffce00') },
  { id: 'fr', name: 'France', ...V('#0055a4', '#ffffff', '#ef4135') },
  { id: 'it', name: 'Italy', ...V('#009246', '#ffffff', '#ce2b37') },
  { id: 'nl', name: 'the Netherlands', ...H('#ae1c28', '#ffffff', '#21468b') },
  { id: 'at', name: 'Austria', ...H('#ed2939', '#ffffff', '#ed2939') },
  { id: 'be', name: 'Belgium', ...V('#000000', '#fdda24', '#ef3340') },
  { id: 'ie', name: 'Ireland', ...V('#169b62', '#ffffff', '#ff883e') },
  { id: 'pl', name: 'Poland', ...H('#ffffff', '#dc143c') },
  { id: 'ua', name: 'Ukraine', ...H('#0057b7', '#ffd700') },
  { id: 'es', name: 'Spain', ...H('#aa151b', '#f1bf00', '#f1bf00', '#aa151b') },
  { id: 'jp', name: 'Japan', field: '#ffffff', disc: '#bc002d' },
  { id: 'se', name: 'Sweden', field: '#006aa7', cross: '#fecc00' },
  { id: 'dk', name: 'Denmark', field: '#c8102e', cross: '#ffffff' },
  { id: 'fi', name: 'Finland', field: '#ffffff', cross: '#002f6c' },
  { id: 'no', name: 'Norway', field: '#ba0c2f', cross: '#00205b', border: '#ffffff' },
  { id: 'ch', name: 'Switzerland', field: '#da291c', swiss: '#ffffff' },
  { id: 'gb', name: 'the United Kingdom', union: true },
  { id: 'us', name: 'the USA', usa: true },
  { id: 'gr', name: 'Greece', greece: true },
];

/** Draw a flag on a 2D canvas context (w by h). */
export function drawFlag(g, f, w = 120, h = 80) {
  const rect = (x, y, rw, rh, c) => { g.fillStyle = c; g.fillRect(x, y, rw, rh); };
  if (f.stripes === 'h') { const n = f.colors.length; f.colors.forEach((c, i) => rect(0, Math.floor(i * h / n), w, Math.ceil(h / n), c)); }
  else if (f.stripes === 'v') { const n = f.colors.length; f.colors.forEach((c, i) => rect(Math.floor(i * w / n), 0, Math.ceil(w / n), h, c)); }
  else if (f.disc) { rect(0, 0, w, h, f.field); g.fillStyle = f.disc; g.beginPath(); g.arc(w / 2, h / 2, h * 0.3, 0, Math.PI * 2); g.fill(); }
  else if (f.cross) {   // a Nordic cross, its upright left of the middle
    const t = h * (f.border ? 0.12 : 0.18), x = w * 0.36, b = f.border ? h * 0.06 : 0;
    rect(0, 0, w, h, f.field);
    if (f.border) { rect(x - t / 2 - b, 0, t + 2 * b, h, f.border); rect(0, h / 2 - t / 2 - b, w, t + 2 * b, f.border); }
    rect(x - t / 2, 0, t, h, f.cross); rect(0, h / 2 - t / 2, w, t, f.cross);
  } else if (f.swiss) {
    rect(0, 0, w, h, f.field); const s = h * 0.6, t = s / 3.2;
    rect(w / 2 - t / 2, h / 2 - s / 2, t, s, f.swiss); rect(w / 2 - s / 2, h / 2 - t / 2, s, t, f.swiss);
  } else if (f.union) {
    rect(0, 0, w, h, '#012169');
    const diag = (width, color) => { g.strokeStyle = color; g.lineWidth = width; g.beginPath(); g.moveTo(0, 0); g.lineTo(w, h); g.moveTo(w, 0); g.lineTo(0, h); g.stroke(); };
    diag(h * 0.2, '#ffffff'); diag(h * 0.07, '#c8102e');
    rect(w / 2 - h * 0.12, 0, h * 0.24, h, '#ffffff'); rect(0, h / 2 - h * 0.12, w, h * 0.24, '#ffffff');
    rect(w / 2 - h * 0.07, 0, h * 0.14, h, '#c8102e'); rect(0, h / 2 - h * 0.07, w, h * 0.14, '#c8102e');
  } else if (f.usa) {
    for (let i = 0; i < 13; i++) rect(0, Math.floor(i * h / 13), w, Math.ceil(h / 13), i % 2 ? '#ffffff' : '#b22234');
    const cw = w * 0.42, ch = h * 7 / 13;
    rect(0, 0, cw, ch, '#3c3b6e');
    g.fillStyle = '#ffffff';
    for (let row = 0; row < 5; row++) for (let col = 0; col < 6; col++) { g.beginPath(); g.arc(cw * (col + 0.5) / 6, ch * (row + 0.5) / 5, 1.6, 0, Math.PI * 2); g.fill(); }
  } else if (f.greece) {
    for (let i = 0; i < 9; i++) rect(0, Math.floor(i * h / 9), w, Math.ceil(h / 9), i % 2 ? '#ffffff' : '#0d5eaf');
    const s = h * 5 / 9; rect(0, 0, s, s, '#0d5eaf');
    rect(s * 0.4, 0, s * 0.2, s, '#ffffff'); rect(0, s * 0.4, s, s * 0.2, '#ffffff');
  }
}

const flagCache = new Map();
/** A flag as an image (a data URL), drawn once. */
export function flagImage(id) {
  if (flagCache.has(id)) return flagCache.get(id);
  const f = FLAGS.find(k => k.id === id), c = globalThis.document && document.createElement('canvas');
  const g = c && c.getContext && c.getContext('2d');
  if (!g || !c.toDataURL) return '';   // (no canvas: the Node tests)
  c.width = 120; c.height = 80;
  drawFlag(g, f, 120, 80);
  const url = c.toDataURL();
  flagCache.set(id, url);
  return url;
}

/** One flag question: a flag and four countries, or a country and four flags. */
export function flagQuestion(r = Math.random, avoid = []) {
  const choices = FLAGS.filter(f => !avoid.includes(f.id));
  const right = pick(choices.length ? choices : FLAGS, r);
  const others = shuffle(FLAGS.filter(f => f.id !== right.id), r).slice(0, 3);
  const four = shuffle([right, ...others], r);
  const name = n => n.replace(/^the /, 'The ');
  if (r() < 0.5) return { kind: 'whichCountry', flag: right.id, text: 'Which country has this flag?', answers: four.map(f => ({ id: f.id, label: name(f.name) })), right: right.id };
  return { kind: 'whichFlag', text: `Which is the flag of ${right.name}?`, answers: four.map(f => ({ id: f.id, flag: f.id, label: name(f.name) })), right: right.id };
}

/** A lesson's questions: six of them, no flag twice. */
export function lessonQuestions(subject, r = Math.random, n = 6) {
  const out = [];
  for (let i = 0; i < n; i++) {
    if (subject === 'flags') out.push(flagQuestion(r, out.map(q => q.right)));
    else {
      let q, guard = 0;
      do { q = mathsQuestion(r); } while (out.some(o => o.text === q.text) && guard++ < 20);
      out.push(q);
    }
  }
  return out;
}

export const SUBJECTS = {
  maths: { title: 'Maths', icon: '🔢', done: n => (n >= 5 ? 'Super sums!' : n >= 3 ? 'Good work!' : 'Keep practising!') },
  flags: { title: 'Geography: flags', icon: '🌍', done: n => (n >= 5 ? 'A real flag expert!' : n >= 3 ? 'Well done!' : 'Keep practising!') },
};

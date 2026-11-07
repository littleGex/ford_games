// The snakes-db security rules (snake/database.rules.json) checked against the real database: the Snake
// leaderboard and the Hangman, Wordle and Word Search word lists. Run by hand after changing the rules in the
// console:
//   node tests/snake/rules-live.mjs
//   node tests/snake/rules-live.mjs --add-score   (also saves one real score: "Rules test", 1 point)
//
// Nothing here signs in: these games write without an account, so this test doesn't either.
// The rules don't let anyone delete, so anything this test manages to write stays in the database. That's why
// it only tries writes that must be refused. If one gets through anyway, the check fails, a deleted entry is
// put back, and anything new it left behind is listed so it can be deleted by hand in the Firebase console.
const DB = 'https://snakes-db-default-rtdb.europe-west1.firebasedatabase.app';
const HOUR = 60 * 60 * 1000;
const fail = [];
const leftBehind = [];
let passed = 0;

async function call(method, path, body) {
  const res = await fetch(`${DB}/${path}.json`, {
    method, headers: { 'Content-Type': 'application/json' }, body: body === undefined ? undefined : JSON.stringify(body),
  });
  return { status: res.status, data: res.ok ? await res.json() : null };
}

async function expectRead(name, path) {
  const { status, data } = await call('GET', path);
  if (status === 200) passed++; else fail.push(`${name}: read refused (HTTP ${status})`);
  return data;
}

// A write that must be refused. If it goes through, `restore` (a function) puts back what was there;
// without one, the path is listed as left behind.
async function expectNo(name, method, path, body, restore) {
  const { status } = await call(method, path, body);
  if (status >= 400) { passed++; return; }
  fail.push(`${name}: allowed (HTTP ${status}), should be refused`);
  if (restore) {
    const back = await restore();
    if (back.status >= 400) leftBehind.push(`${path || '/'} (changed or deleted; couldn't put it back: HTTP ${back.status})`);
  } else {
    leftBehind.push(path || '/');
  }
}

const id = () => `rules-test-${Math.random().toString(36).slice(2, 10)}`;
const now = Date.now();
const score = (over = {}) => ({ name: 'Rules test', score: 1, timestamp: now, ...over });

// --- Scores ---
const scores = await expectRead('read scores', 'scores') || {};
await expectNo('a score with no timestamp', 'PUT', `scores/${id()}`, { name: 'Rules test', score: 1 });
await expectNo('a score with an empty name', 'PUT', `scores/${id()}`, score({ name: '' }));
await expectNo('a name over 20 letters', 'PUT', `scores/${id()}`, score({ name: 'x'.repeat(21) }));
await expectNo('a name that isn\'t text', 'PUT', `scores/${id()}`, score({ name: 7 }));
await expectNo('a score of 0', 'PUT', `scores/${id()}`, score({ score: 0 }));
await expectNo('a score of 10000', 'PUT', `scores/${id()}`, score({ score: 10000 }));
await expectNo('a score with a fraction', 'PUT', `scores/${id()}`, score({ score: 2.5 }));
await expectNo('a score that isn\'t a number', 'PUT', `scores/${id()}`, score({ score: '50' }));
await expectNo('a timestamp an hour ahead', 'PUT', `scores/${id()}`, score({ timestamp: now + HOUR }));
await expectNo('a score with an extra field', 'PUT', `scores/${id()}`, score({ extra: true }));
const [scoreKey, scoreVal] = Object.entries(scores)[0] || [];
if (scoreKey) {
  await expectNo('change a saved score', 'PUT', `scores/${scoreKey}`, { ...scoreVal, score: 9999 },
    () => call('PUT', `scores/${scoreKey}`, scoreVal));
  await expectNo('delete a saved score', 'DELETE', `scores/${scoreKey}`, undefined,
    () => call('PUT', `scores/${scoreKey}`, scoreVal));
  await expectNo('delete the whole leaderboard', 'DELETE', 'scores', undefined, () => call('PATCH', 'scores', scores));
} else {
  console.log('(no saved scores yet: skipped changing and deleting one)');
}

// --- Word lists ---
// Each list: where it is, a made-up word that fits it (only written in checks that must be refused), and
// words that don't fit.
const lists = [
  { name: 'Hangman', path: 'customWords', fits: 'QZQZQ', badKeys: { 'too short': 'QZ', 'too long': 'Q'.repeat(21) } },
  { name: 'Wordle easy', path: 'wordleWords/easy', fits: 'QZQZ', badKeys: { '3 letters': 'QZQ', '5 letters': 'QZQZQ' } },
  { name: 'Wordle hard', path: 'wordleWords/hard', fits: 'QZQZQZ', badKeys: { '5 letters': 'QZQZQ', '7 letters': 'QZQZQZQ' } },
  { name: 'Word Search', path: 'wordSearchWords', fits: 'QZQZQ', badKeys: { 'too short': 'QZ', 'too long': 'Q'.repeat(11) } },
];
for (const list of lists) {
  const words = await expectRead(`read ${list.name} words`, list.path) || {};
  const lower = list.fits.toLowerCase();
  const digit = `${list.fits.slice(0, -1)}1`;
  await expectNo(`${list.name}: a lower-case word`, 'PUT', `${list.path}/${lower}`, now);
  await expectNo(`${list.name}: a word with a digit`, 'PUT', `${list.path}/${digit}`, now);
  for (const [what, key] of Object.entries(list.badKeys)) {
    await expectNo(`${list.name}: a word ${what}`, 'PUT', `${list.path}/${key}`, now);
  }
  await expectNo(`${list.name}: a value that isn't a time`, 'PUT', `${list.path}/${list.fits}`, 'yes');
  await expectNo(`${list.name}: a time an hour ahead`, 'PUT', `${list.path}/${list.fits}`, now + HOUR);
  const [wordKey, wordVal] = Object.entries(words)[0] || [];
  if (wordKey) {
    const putBack = () => call('PUT', `${list.path}/${wordKey}`, wordVal);
    await expectNo(`${list.name}: change a saved word`, 'PUT', `${list.path}/${wordKey}`, wordVal - 1, putBack);
    await expectNo(`${list.name}: delete a saved word`, 'DELETE', `${list.path}/${wordKey}`, undefined, putBack);
    await expectNo(`${list.name}: delete the whole list`, 'DELETE', list.path, undefined,
      () => call('PATCH', list.path, words));
  } else {
    console.log(`(no ${list.name} words yet: skipped changing and deleting one)`);
  }
}

// --- Anything else ---
await expectNo('write somewhere the games don\'t use', 'PUT', 'rulesTest', 1);
await expectNo('a new list next to easy and hard', 'PUT', `wordleWords/medium/QZQZQ`, now);

// --- Optional: one real save, the way Snake does it (with the phone's clock a minute fast) ---
if (process.argv.includes('--add-score')) {
  const path = `scores/${id()}`;
  const { status } = await call('PUT', path, score({ timestamp: now + 60 * 1000 }));
  if (status === 200) { passed++; console.log(`Saved a real score at ${path} (it can't be deleted).`); }
  else fail.push(`save a score (clock a minute fast): refused (HTTP ${status})`);
}

if (leftBehind.length) {
  console.log('Left in the database by checks that should have been refused (delete these in the console):');
  leftBehind.forEach(p => console.log(`  ${p}`));
}
if (fail.length) {
  console.log(`snakes-db rules: ${fail.length} of ${passed + fail.length} checks not as expected:`);
  fail.forEach(f => console.log(`  - ${f}`));
  process.exit(1);
}
console.log(`snakes-db rules: all ${passed} checks as expected`);

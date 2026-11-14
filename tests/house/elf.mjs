// The elf's date store and which scene he's in each day:  node tests/house/elf.mjs
// (Runs plain Node, no browser.)
const store = new Map();
globalThis.localStorage = { getItem: k => store.get(k) ?? null, setItem: (k, v) => store.set(k, String(v)), removeItem: k => store.delete(k) };
const { ELF_KEY, dateKey, pickScene, createElfLog } = await import('../../house/js/elf.js');

const fail = [];
const check = (ok, msg) => { if (!ok) fail.push(msg); };
const dec = d => new Date(2026, 11, d, 12);
const on = () => true;

// one scene a day, in order, round and round
check(dateKey(dec(3)) === '2026-12-03', `dateKey: ${dateKey(dec(3))}`);
const two = [{ id: 'a' }, { id: 'b' }];
check(pickScene(dec(3), two, on) === 'a', '3 December: want a');
check(pickScene(dec(4), two, on) === 'b', '4 December: want b');
check(pickScene(dec(5), two, on) === 'a', '5 December: want a');
// a scene whose job group is switched off is never picked, and every day still gets one
const dragon = [{ id: 'a', needs: 'dragon' }, { id: 'b' }];
for (let d = 1; d <= 24; d++) check(pickScene(dec(d), dragon, id => id !== 'dragon') === 'b', `dragon off, ${d} December: want b`);
check(pickScene(dec(3), [{ id: 'a', needs: 'dragon' }], id => id !== 'dragon') === null, 'no scene allowed: want null');

// found once a real day
const log = createElfLog({ now: () => dec(3) });
check(log.waiting(['advent']), '3 December: he should be waiting');
check(!log.waiting([]), 'no advent tag: he should not be waiting');
log.markFound();
check(log.found() && !log.waiting(['advent']), 'found on 3 December: he should not be waiting any more');
check(createElfLog({ now: () => dec(3) }).found(), 'found on 3 December: a new log on the same day should know');
check(createElfLog({ now: () => dec(4) }).waiting(['advent']), '4 December: he should be waiting again');

// a day planned on 3 December and played past midnight: found counts for the day it was planned
const late = createElfLog({ now: () => dec(4) });
late.markFound('2026-12-03');
check(late.found('2026-12-03') && !late.waiting(['advent'], '2026-12-03'), 'past midnight: found for 3 December');
check(!late.found() && late.waiting(['advent']), 'past midnight: 4 December still to come');

// a broken store reads as nothing found
store.set(ELF_KEY, 'not json');
let broken;
try { broken = createElfLog({ now: () => dec(3) }); check(!broken.found(), 'broken store: nothing found'); } catch (e) { fail.push(`broken store threw ${e.message}`); }

if (fail.length) { console.error('elf: FAIL\n  ' + fail.join('\n  ')); process.exit(1); }
console.log('elf: ok');

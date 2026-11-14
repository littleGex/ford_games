// The elf's date store and which scene he's in each day:  node tests/house/elf.mjs
// (Runs plain Node, no browser.)
const store = new Map();
globalThis.localStorage = { getItem: k => store.get(k) ?? null, setItem: (k, v) => store.set(k, String(v)), removeItem: k => store.delete(k) };
const { ELF_KEY, dateKey, pickScene, createElfLog, elfName } = await import('../../house/js/elf.js');

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

// found once a real day (he arrived the day before Advent)
const log = createElfLog({ now: () => dec(3) });
log.arrive('2026-11-30');
check(log.waiting(['advent']), '3 December: he should be waiting');
check(!log.waiting([]), 'no advent tag: he should not be waiting');
log.markFound();
check(log.found() && !log.waiting(['advent']), 'found on 3 December: he should not be waiting any more');
check(createElfLog({ now: () => dec(3) }).found(), 'found on 3 December: a new log on the same day should know');
check(createElfLog({ now: () => dec(4) }).waiting(['advent']), '4 December: he should be waiting again');

// a day planned on 3 December and played past midnight: found counts for the day it was planned
const late = createElfLog({ now: () => dec(4) });
late.arrive('2026-11-30');
late.markFound('2026-12-03');
check(late.found('2026-12-03') && !late.waiting(['advent'], '2026-12-03'), 'past midnight: found for 3 December');
check(!late.found() && late.waiting(['advent']), 'past midnight: 4 December still to come');

// he has to arrive first, and is out the next real morning
store.clear();
const a = createElfLog({ now: () => dec(1) });
check(!a.hasArrived('2026-12-01') && !a.waiting(['advent'], '2026-12-02'), 'not arrived: he should not be out');
check(a.name() === 'Pip' && !a.named(), `fresh store: name ${a.name()}, want Pip and not named`);
a.arrive('2026-12-01');
check(a.hasArrived('2026-12-01') && !a.out('2026-12-01') && a.out('2026-12-02'), 'arrived on 1 December: door that day, out the next');
check(a.waiting(['advent'], '2026-12-02') && !a.waiting(['advent'], '2026-12-01'), 'arrived on 1 December: waiting from 2 December only');
a.arrive('2026-12-05');
check(a.arrivedOn('2026-12-06') === '2026-12-01', `arriving again never moves it later: ${a.arrivedOn('2026-12-06')}`);
check(!a.hasArrived('2027-12-01'), 'next Advent: not arrived yet');
check(a.hasArrived('2027-01-03'), '3 January: still the 2026 Advent');
// an elf already out before this release counts as arrived
store.clear();
store.set(ELF_KEY, JSON.stringify({ found: ['2026-12-02'] }));
const old = createElfLog({ now: () => dec(3) });
check(old.arrivedOn('2026-12-03') === '2026-12-02' && old.waiting(['advent'], '2026-12-03'), 'old store: found on 2 December counts as arrived');
// found in November (testing with ?holiday=christmas before December) isn't an arrival: the mission is still offered
store.set(ELF_KEY, JSON.stringify({ found: ['2026-11-14'] }));
const nov = createElfLog({ now: () => dec(1) });
check(!nov.hasArrived('2026-12-01') && !nov.waiting(['advent'], '2026-12-02'), `found on 14 November: arrived ${nov.arrivedOn('2026-12-01')}`);
store.set(ELF_KEY, JSON.stringify({ found: ['2026-12-02'] }));
// his name
old.setName('Holly');
check(old.name() === 'Holly' && old.named() && elfName() === 'Holly', `name: ${old.name()}`);
old.setName('<b>Jingle</b> 🎄');
check(!/[<>🎄]/u.test(old.name()) && old.name().length <= 16, `cleaned name: ${old.name()}`);
old.setName('Holly'); old.setName('');
check(old.name() === 'Holly', 'an empty name keeps the last one');

// a broken store reads as nothing found
store.set(ELF_KEY, 'not json');
let broken;
try { broken = createElfLog({ now: () => dec(3) }); check(!broken.found(), 'broken store: nothing found'); } catch (e) { fail.push(`broken store threw ${e.message}`); }

if (fail.length) { console.error('elf: FAIL\n  ' + fail.join('\n  ')); process.exit(1); }
console.log('elf: ok');

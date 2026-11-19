// Tester mode (#179): the panel's date shortcuts and its reset:  node tests/house/tester-panel.mjs  (plain Node)
const store = new Map();
globalThis.localStorage = { getItem: k => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, String(v)), removeItem: k => store.delete(k) };
const { dateChips, resetTesterProgress, freshTesterDay, missionChoices, jobChoices } = await import('../../house/js/ui/tester.js');
const { holidaysOf } = await import('../../house/js/holidays.js');

const fail = [];
const check = (ok, msg) => { if (!ok) fail.push(msg); };

const chips = dateChips(2026);
const at = label => chips.find(c => c.label === label);
const tags = label => (at(label) ? holidaysOf(new Date(`${at(label).date}T12:00:00`)) : []);
check(chips.length === 5, `dateChips: ${chips.map(c => c.label)}`);
check(tags('Halloween').includes('halloween'), `Halloween: ${tags('Halloween')}`);
check(tags('1 Dec').includes('advent'), `1 Dec: ${tags('1 Dec')}`);
check(tags('15 Dec').includes('christmas'), `15 Dec: ${tags('15 Dec')}`);
check(tags('Christmas Eve').includes('christmasEve'), `Christmas Eve: ${tags('Christmas Eve')}`);
check(tags('5 Jan').includes('christmasEnd') && at('5 Jan').date === '2027-01-05', `5 Jan: ${at('5 Jan') && at('5 Jan').date} ${tags('5 Jan')}`);

for (const k of ['save', 'advent', 'elf', 'missions']) { store.set(`fordHouse.tester.${k}.v1`, 'tester'); store.set(`fordHouse.${k}.v1`, 'real'); }
store.set('fordHouse.tester.v1', '{"on":true}');
resetTesterProgress(globalThis.localStorage);
for (const k of ['save', 'advent', 'elf', 'missions']) {
  check(!store.has(`fordHouse.tester.${k}.v1`), `reset: tester ${k} still there`);
  check(store.get(`fordHouse.${k}.v1`) === 'real', `reset: real ${k} touched`);
}
check(store.get('fordHouse.tester.v1') === '{"on":true}', 'reset: the tester state touched');

// Apply: the tester's day starts again with the new date's holidays (a saved day keeps the tags it began with)
store.set('fordHouse.tester.save.v1', JSON.stringify({ day: 4, character: 'girl', today: { day: 4, params: { holiday: [] } } }));
store.set('fordHouse.save.v1', JSON.stringify({ day: 9, today: { day: 9 } }));
freshTesterDay(globalThis.localStorage);
const ts = JSON.parse(store.get('fordHouse.tester.save.v1'));
check(ts.day === 4 && ts.character === 'girl' && !ts.today, `freshTesterDay: ${store.get('fordHouse.tester.save.v1')}`);
check(JSON.parse(store.get('fordHouse.save.v1')).today.day === 9, 'freshTesterDay: the real save touched');
store.delete('fordHouse.tester.save.v1'); freshTesterDay(globalThis.localStorage);
check(!store.has('fordHouse.tester.save.v1'), 'freshTesterDay with no tester save: nothing written');

// the mission launcher: who may play each one (its own list, where it has a start spot), none-playable left out
const kids = { girl: { start: [1, 1] }, boy: { start: [2, 2] } };
const fake = {
  schoolRun: { title: 'The school run', who: ['girl', 'boy'] },
  wfh: { title: 'Work from home', who: ['dad', 'mum'], spot: w => ({ name: w }) },
  report: { title: "The elf's report", who: ['girl', 'boy'], spot: w => ({ ...kids[w] }) },
  broken: { title: 'Nobody', who: ['dad'], spot: () => null },
};
const mc = missionChoices(fake, kids);
const of = id => mc.find(m => m.id === id);
check(of('schoolRun') && of('schoolRun').who.join() === 'girl,boy' && of('schoolRun').title === 'The school run', `schoolRun: ${JSON.stringify(of('schoolRun'))}`);
check(of('wfh') && of('wfh').who.join() === 'dad,mum', `wfh: ${JSON.stringify(of('wfh'))}`);
check(of('report') && of('report').who.join() === 'girl,boy', `report (a spot for anyone, but only P and Dude play it): ${JSON.stringify(of('report'))}`);
check(!of('broken'), 'a mission no one can play is left out');

// the job picker: today's jobs by title, searched by title or id (any case), at most 40
const jobs = [{ id: 'binsOut', title: 'Put the bins out' }, { id: 'feedDragon', title: 'Feed the dragon' }, { id: 'coffee', title: 'Make Dad a coffee' }];
check(jobChoices(jobs, '').map(j => j.id).join() === 'feedDragon,coffee,binsOut', `jobChoices all, by title: ${jobChoices(jobs, '').map(j => j.id)}`);
check(jobChoices(jobs, 'DRAG').map(j => j.id).join() === 'feedDragon', `jobChoices 'DRAG': ${jobChoices(jobs, 'DRAG').map(j => j.id)}`);
check(jobChoices(jobs, 'binsout').map(j => j.id).join() === 'binsOut', 'jobChoices by id');
check(jobChoices(Array.from({ length: 60 }, (_, i) => ({ id: `j${i}`, title: `Job ${i}` })), '').length === 40, 'jobChoices: at most 40');

if (fail.length) { console.error('tester-panel: FAIL\n  ' + fail.join('\n  ')); process.exit(1); }
console.log('tester-panel: ok');

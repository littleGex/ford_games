// Tester mode (#179): its state, the date override and the separate progress:  node tests/house/tester.mjs  (plain Node)
class Storage {   // a stand-in for the browser's, so bootTester has a Storage.prototype to patch
  constructor() { this._m = new Map(); }
  getItem(k) { return this._m.has(k) ? this._m.get(k) : null; }
  setItem(k, v) { this._m.set(k, String(v)); }
  removeItem(k) { this._m.delete(k); }
  raw() { return this._m; }
}
globalThis.Storage = Storage;
const store = new Storage();
globalThis.localStorage = store;
globalThis.location = { search: '' };
const realGet = Storage.prototype.getItem;

const { TESTER_KEY, testerKey, readTester, writeTester, bootTester } = await import('../../house/js/tester.js');
const { today } = await import('../../house/js/holidays.js');
const { ageOn, daysToBirthday } = await import('../../house/js/players.js');

const fail = [];
const check = (ok, msg) => { if (!ok) fail.push(msg); };
const sameDay = (d, y, m, day) => d.getFullYear() === y && d.getMonth() === m - 1 && d.getDate() === day;

check(TESTER_KEY === 'fordHouse.tester.v1', `TESTER_KEY ${TESTER_KEY}`);
for (const k of ['save', 'advent', 'elf', 'missions']) check(testerKey(`fordHouse.${k}.v1`) === `fordHouse.tester.${k}.v1`, `testerKey ${k}: ${testerKey(`fordHouse.${k}.v1`)}`);
for (const k of ['fordHouse.settings.v1', 'fordHouse.names.v1', TESTER_KEY]) check(testerKey(k) === k, `testerKey leaves ${k}: ${testerKey(k)}`);

// bad or missing state: off, no crash
store.setItem(TESTER_KEY, '{bad');
check(readTester(store).on === false, 'readTester on bad JSON: off');
store.removeItem(TESTER_KEY);
check(readTester(store).on === false, 'readTester with nothing: off');
check(readTester(undefined).on === false, 'readTester with no storage: off');

// flag off: nothing patched, the real date
check(bootTester('', store) === false, 'bootTester with no flag: off');
check(Storage.prototype.getItem === realGet, 'flag off: Storage not patched');
store.setItem(TESTER_KEY, JSON.stringify({ on: false, date: '2026-12-24' }));
check(!sameDay(today(), 2026, 12, 24) || sameDay(new Date(), 2026, 12, 24), 'flag off: tester date ignored');

// ?tester=1 turns it on (and remembers); progress goes to the tester keys
check(bootTester('?tester=1', store) === true, '?tester=1: on');
check(readTester(store).on === true, '?tester=1 remembered');
store.setItem('fordHouse.save.v1', 'tester save');
check(store.raw().get('fordHouse.tester.save.v1') === 'tester save' && !store.raw().has('fordHouse.save.v1'), 'tester on: the save goes to the tester key');
store.raw().set('fordHouse.elf.v1', 'real elf');
check(store.getItem('fordHouse.elf.v1') === null, 'tester on: the real elf log is not read');
store.removeItem('fordHouse.save.v1');
check(!store.raw().has('fordHouse.tester.save.v1'), 'tester on: removeItem removes the tester key');
check(store.raw().get('fordHouse.elf.v1') === 'real elf', 'tester on: the real elf log is untouched');
store.setItem('fordHouse.settings.v1', 'shared');
check(store.raw().get('fordHouse.settings.v1') === 'shared', 'tester on: settings stay shared');

// the tester date: today() is 24 Dec at noon; a bad one is ignored; ?date= wins
writeTester({ date: '2026-12-24' }, store);
const t = today();
check(sameDay(t, 2026, 12, 24) && t.getHours() === 12, `tester date: ${t}`);
writeTester({ date: '2026-13-45' }, store);
check(!sameDay(today(), 2026, 13, 45) && Math.abs(today() - new Date()) < 60000, `tester bad date: real date (${today()})`);
writeTester({ date: '2026-12-24' }, store);
globalThis.location = { search: '?date=2026-12-01' };
check(sameDay(today(), 2026, 12, 1), '?date= beats the tester date');
globalThis.location = { search: '' };

// players' dates follow today()
check(ageOn('2018-12-25') === 7, `ageOn on tester 24 Dec 2026: ${ageOn('2018-12-25')}`);
check(daysToBirthday('2018-12-25') === 1, `daysToBirthday on tester 24 Dec 2026: ${daysToBirthday('2018-12-25')}`);

// ?tester=0 turns it off
check(bootTester('?tester=0', store) === false && readTester(store).on === false, '?tester=0: off');
check(!sameDay(today(), 2026, 12, 24) || sameDay(new Date(), 2026, 12, 24), '?tester=0: tester date no longer used');

if (fail.length) { console.error('tester: FAIL\n  ' + fail.join('\n  ')); process.exit(1); }
console.log('tester: ok');

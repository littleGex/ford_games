// Tester mode (#179): play any date, holiday, season, birthday or mission without touching the family's real
// progress. Turned on with ?tester=1 (remembered on this device) and off with ?tester=0. While it's on, the four
// progress stores (the day's save, the Advent doors, the elf log, the mission bests) are read and written under
// fordHouse.tester.* instead, by patching Storage get/set/removeItem; settings, names and players stay shared so
// the tester sees the real family. With the flag off nothing is patched. Plain module, no DOM (Node tests load it).
export const TESTER_KEY = 'fordHouse.tester.v1';
const PROGRESS = ['fordHouse.save.v1', 'fordHouse.advent.v1', 'fordHouse.elf.v1', 'fordHouse.missions.v1'];

/** Where a key lives in tester mode: the four progress keys get their own copies; everything else is shared. */
export const testerKey = key => (PROGRESS.includes(key) ? key.replace(/^fordHouse\./, 'fordHouse.tester.') : key);

let active = false, patched = null;

/** The tester state ({ on, date?, holiday?, season?, birthday? }); off if it's missing or can't be read. */
export function readTester(storage = globalThis.localStorage) {
  try {
    const raw = storage && (patched ? patched.get.call(storage, TESTER_KEY) : storage.getItem(TESTER_KEY));
    const s = raw ? JSON.parse(raw) : null;
    return s && typeof s === 'object' ? { ...s, on: s.on === true } : { on: false };
  } catch (e) { return { on: false }; }
}

/** Change the tester state (merged into what's there). */
export function writeTester(patch, storage = globalThis.localStorage) {
  try {
    const next = JSON.stringify({ ...readTester(storage), ...patch });
    if (patched) patched.set.call(storage, TESTER_KEY, next); else storage.setItem(TESTER_KEY, next);
  } catch (e) { /* private mode: tester mode just doesn't stick */ }
}

/** A tester setting while tester mode is on (date, holiday, season, birthday), or null. */
export function testerValue(name, storage = globalThis.localStorage) {
  if (!active) return null;
  const s = readTester(storage);
  return s.on && typeof s[name] === 'string' && s[name] ? s[name] : null;
}

/** At startup: ?tester=1 / ?tester=0 switch it, then if it's on the progress keys are redirected. Whether it's on. */
export function bootTester(search, storage = globalThis.localStorage) {
  const flag = search ? new URLSearchParams(search).get('tester') : null;
  if (flag === '1') writeTester({ on: true }, storage);
  if (flag === '0') writeTester({ on: false }, storage);
  active = readTester(storage).on;
  const proto = globalThis.Storage && globalThis.Storage.prototype;
  if (active && proto && !patched) {
    patched = { get: proto.getItem, set: proto.setItem, remove: proto.removeItem };
    proto.getItem = function (k) { return patched.get.call(this, active ? testerKey(k) : k); };
    proto.setItem = function (k, v) { return patched.set.call(this, active ? testerKey(k) : k, v); };
    proto.removeItem = function (k) { return patched.remove.call(this, active ? testerKey(k) : k); };
  }
  return active;
}

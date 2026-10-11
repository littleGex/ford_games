// Progress is kept in this browser's localStorage, so each phone has its own house.
// Saved: the day number, when each job was last done, which bins went out last, today's plan and which
// of today's jobs are finished, and who was being played. A job that was half done when the page closed
// starts again from the beginning.

const KEY = 'fordHouse.save.v1';

export function freshSave() {
  return { version: 1, day: 1, lastDone: {}, lastBinPair: null, today: null, character: 'dad', stats: { daysDone: 0, jobsDone: 0 } };
}

export function loadSave(storage = globalThis.localStorage) {
  try {
    const raw = storage && storage.getItem(KEY);
    if (!raw) return freshSave();
    const s = JSON.parse(raw);
    if (!s || s.version !== 1 || typeof s.day !== 'number') return freshSave();
    return { ...freshSave(), ...s, stats: { ...freshSave().stats, ...(s.stats || {}) } };
  } catch (e) {
    return freshSave();
  }
}

export function writeSave(save, storage = globalThis.localStorage) {
  try { if (storage) storage.setItem(KEY, JSON.stringify(save)); } catch (e) { /* private mode or storage full: play on without saving */ }
}

export function clearSave(storage = globalThis.localStorage) {
  try { if (storage) storage.removeItem(KEY); } catch (e) { /* ignore */ }
}

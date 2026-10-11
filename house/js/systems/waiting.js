// "wait" steps: something runs on its own while you do other jobs (the washing machine).
// { kind: 'wait', dur: seconds, power: true (pauses in a power cut), spin: 'washerDrum' (world part to turn) }
import { S } from '../state.js';

export function createWaiting({ board, world }) {
  const shown = new Map();
  function update(dt) {
    for (const job of board.jobs) {
      const s = board.step(job);
      if (!s || s.kind !== 'wait') continue;
      const running = !s.power || S.powerOn;
      if (running) s.prog = (s.prog || 0) + dt;
      if (s.spin && world[s.spin] && running) world[s.spin].rotation.z -= dt * 9;
      const pct = Math.min(100, Math.floor(s.prog / s.dur * 100));
      if (shown.get(job) !== pct) { shown.set(job, pct); job.status = pct + '%'; board.refresh(); }
      if (s.prog >= s.dur) { job.status = ''; shown.delete(job); board.advance(job, s.doneMessage || `${job.title}: ready`); }
    }
  }
  return { update };
}

// Wiping windows: stand at a dirty window, press the button, then move the stick (or the arrow keys) round
// in circles. The dirt fades as you go; three full circles and it's sparkling. The button stops wiping
// (progress is kept). While wiping you stay where you are and the sponge arm goes round.
import { S } from '../state.js';

const TURNS = 3, FULL = Math.PI * 2;

export function createWiping({ world, board, player }) {
  function start(job, step) {
    step.prog = step.prog || 0; S.wiping = { job, step, last: null, spin: 0, idle: 0 };
    const p = player.group.position; player.group.rotation.y = Math.atan2(step.at[0] - p.x, step.at[1] - p.z + -0.5);   // face the glass
  }
  function stop() { S.wiping = null; }

  /** Called every frame while wiping, with the stick / arrow-key direction. A short pause (lifting one
   *  arrow key before pressing the next) doesn't lose your place in the circle. */
  function feed(axis, dt = 0) {
    const w = S.wiping;
    if (!w) return;
    if (axis.len < 0.35) { w.idle += dt; if (w.idle > 0.5) w.last = null; return; }
    w.idle = 0;
    const a = Math.atan2(axis.y, axis.x);
    if (w.last !== null) {
      let d = a - w.last;
      d = ((d + Math.PI) % FULL + FULL) % FULL - Math.PI;   // the short way round
      if (Math.abs(d) < 1.6) { w.step.prog = Math.min(1, w.step.prog + Math.abs(d) / (TURNS * FULL)); w.spin += d; }
    }
    w.last = a;
    const dirt = world.dirt[w.step.dirt];
    dirt.material.opacity = 1 - w.step.prog;
    const arm = player.arms && player.arms();   // the sponge arm goes round
    if (arm) { arm.rotation.x = -1.6 + Math.sin(w.spin) * 0.35; arm.rotation.z = Math.cos(w.spin) * 0.35; }
    if (w.step.prog >= 1) {
      dirt.visible = false; dirt.material.opacity = 1;
      S.wiping = null;
      board.advance(w.job, 'Sparkling!');
    }
  }

  return {
    start, stop, feed,
    update() {},
    banner: () => S.wiping ? `Wipe in circles! ${Math.round(S.wiping.step.prog * 100)}%` : null,
  };
}

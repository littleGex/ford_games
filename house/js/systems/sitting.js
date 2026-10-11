// Timed jobs where you stay put: watching TV, gaming (seated), washing up, making coffee (standing).
// Moving the stick gets you up; progress is kept so you can come back later.
// Steps that use the TV or the coffee machine (screen / power) pause during a power cut.
import { S } from '../state.js';

export function createSitting(ctx) {
  const { player, world, board } = ctx;
  let lastDraw = 0;

  function sitDown(job, step) {
    const g = player.group;
    S.sitting = { job, step, seatY: step.seat[1], back: [g.position.x, g.position.z] };
    g.position.set(step.seat[0], 0, step.seat[2]);
    g.rotation.y = step.seat[3];
  }

  function standUp() {
    if (!S.sitting) return;
    player.group.position.set(S.sitting.back[0], 0, S.sitting.back[1]);
    S.sitting = null;
    world.tv.draw('off');
    world.steam.visible = false;
  }

  const hasPower = s => !(s.screen || s.power) || S.powerOn;

  function banner() {
    if (!S.sitting) return null;
    const s = S.sitting.step;
    return hasPower(s) ? `${s.what} · ${Math.max(0, Math.ceil(s.dur - (s.prog || 0)))}s left (move to stop)` : 'No power! Reset the fuses first';
  }

  function update(dt, time) {
    if (!S.sitting) return;
    const { job, step: s } = S.sitting, ok = hasPower(s);
    world.steam.visible = !!s.coffee && ok;
    if (world.steam.visible) world.steam.children.forEach((p, i) => { p.position.y = ((time * 0.6 + i / 3) % 1) * 0.3; });
    if (ok) {
      s.prog = (s.prog || 0) + dt;
      if (s.screen && time - lastDraw > 0.1) { world.tv.draw(s.screen, time); lastDraw = time; }
    } else if (s.screen && time - lastDraw > 0.5) { world.tv.draw('off'); lastDraw = time; }

    if (s.prog >= s.dur) {
      const lastStep = job.i + 1 >= job.steps.length;
      if (s.onDone) s.onDone(ctx);
      standUp();
      board.advance(job, lastStep ? undefined : `${s.what}: done`);
    }
  }

  return { sitDown, standUp, banner, update };
}

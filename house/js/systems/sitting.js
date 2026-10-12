// Timed jobs where you stay put: watching TV, gaming (seated), washing up, coffee, teeth, shower (standing).
// A step can name an effect to show while it runs (fx: 'steam' for the coffee machine, 'pot' for cooking, 'shower' for the
// shower water); effects are groups in the world whose children bob upwards.
// Moving the stick gets you up; progress is kept so you can come back later.
// Steps that use the TV or the coffee machine (screen / power) pause during a power cut.
// glow: 'dadScreen' lights up a computer screen while you sit (page: which of its screens to show).
// fx: 'dadNotes' / 'mumNotes' plays the radio on that desk: music notes rise and a little tune loops.
// sound: 'clarinet' plays that instead of the radio (Dude's clarinet practice).
import { LEVEL_HEIGHT } from '../config.js';
import { S } from '../state.js';
import { music } from '../core/audio.js';

export function createSitting(ctx) {
  const { player, world, board } = ctx;
  const FX = { steam: world.steam, pot: world.potSteam, shower: world.showerWater, dadNotes: world.dadNotes, mumNotes: world.mumNotes, clarinetNotes: world.clarinetNotes };
  const hideFx = () => { Object.values(FX).forEach(g => { if (g) g.visible = false; }); music(null); };
  let lastDraw = 0;

  function sitDown(job, step) {
    const g = player.group;
    S.sitting = { job, step, seatY: step.seat[1], back: [g.position.x, g.position.z] };
    g.position.set(step.seat[0], S.level * LEVEL_HEIGHT, step.seat[2]);
    g.rotation.y = step.seat[3];
  }

  function standUp() {
    if (!S.sitting) return;
    player.group.position.set(S.sitting.back[0], S.level * LEVEL_HEIGHT, S.sitting.back[1]);
    const glow = S.sitting.step.glow && world[S.sitting.step.glow];
    if (glow) glow.visible = false;
    S.sitting = null;
    world.tv.draw('off');
    hideFx();
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
    const fx = s.fx && FX[s.fx];
    if (fx) {
      fx.visible = ok;
      music(ok && s.fx.endsWith('Notes') ? (s.sound || 'radio') : null);
      const fall = s.fx === 'shower';
      fx.children.forEach((p, i) => { const t = (time * (fall ? 2.2 : 0.6) + i / fx.children.length) % 1; p.position.y = fall ? 1.3 - t * 1.1 : t * 0.3; });
    }
    const glow = s.glow && world[s.glow];
    if (glow) {
      glow.visible = ok;
      glow.children.forEach(c => {
        c.visible = c.name === s.page;
        if (c.visible && ok && c.userData.animate) c.userData.animate(Math.min(1, (s.prog || 0) / s.dur), time);   // e.g. code typing itself out
      });
    }
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

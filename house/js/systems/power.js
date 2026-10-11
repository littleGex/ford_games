// Power cuts: every so often the house goes dark, the player gets a torch, and a
// "Reset the fuses" job appears until someone flips the fuses in the WC.
// Also owns the house lights (living-room lamp, WC mirror) since they depend on power.
import * as THREE from 'three';
import { COLORS, EVENTS } from '../config.js';
import { S, rand } from '../state.js';

export function createPower({ stage, world, player, board, hud }) {
  const cfg = EVENTS.power;
  const torch = new THREE.SpotLight('#fff1d0', 0, 9, 0.55, 0.5, 1.4);
  torch.position.set(0, 1.0, 0.15); torch.target.position.set(0, 0, 3);
  player.group.add(torch, torch.target);

  let outages = 0, nextOutage = rand(...cfg.firstAfter), now = 0, fuseJob = null;

  function applyLights() {
    const lampOn = S.powerOn && S.lampOn;
    world.lamp.light.intensity = lampOn ? 1.5 : 0;
    world.lamp.shade.material.emissive.set(lampOn ? '#ffb766' : '#000000');
    world.mirror.material.emissiveIntensity = S.powerOn ? 0.8 : 0;
  }

  function cut() {
    S.powerOn = false;
    stage.hemi.intensity = 0.06; stage.sun.intensity = 0.02;
    stage.scene.background.set(COLORS.skyPowerCut); stage.scene.fog.color.set(COLORS.skyPowerCut);
    torch.intensity = 2.4;
    applyLights();
    if (!fuseJob) {
      fuseJob = board.add({ id: 'fuses', title: 'Reset the fuses', steps: [
        { kind: 'use', at: [4.85, 8.72], label: 'Flip the fuses back on', onDone: c => c.power.restore() }] });
    } else { fuseJob.i = 0; board.refresh(); }
    hud.toast('Power cut! Find the fuse box in the WC');
  }

  function restore() {
    S.powerOn = true;
    stage.hemi.intensity = 0.78; stage.sun.intensity = 0.85;
    stage.scene.background.set(COLORS.sky); stage.scene.fog.color.set(COLORS.sky);
    torch.intensity = 0;
    world.fuseLed.material.emissive.set('#000000');
    applyLights();
    nextOutage = now + rand(...cfg.gapAfter);
  }

  function update(dt, time) {
    now = time;
    if (S.powerOn && S.started && outages < cfg.maxPerGame && time > nextOutage) { outages++; cut(); }
    if (!S.powerOn) world.fuseLed.material.emissive.setRGB(0.5 + 0.5 * Math.sin(time * 8), 0, 0);
  }

  return { update, restore, applyLights };
}

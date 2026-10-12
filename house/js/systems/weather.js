// Rain. On some days, a little while after the washing has been hung out on the line, it starts to rain:
// get the washing off the line before it's soaked (a countdown shows), then bring the basket inside.
// The rain falls outside the houses (gardens, front gardens, street), not into the cut-open rooms.
import * as THREE from 'three';
import { EVENTS } from '../config.js';
import { S, rand } from '../state.js';

const LINE_AT = [2.4, -4.65];        // standing at the washing line
const INSIDE = [2.75, 0.8];          // just inside the terrace door, in the living room
const DROPS = 260, SPREAD = 8;
// the row of houses (ours and the neighbours'): no rain drawn inside these
const ROW = { x1: -6.3, x2: 11.7, z1: -0.45, z2: 9.35 };

export function createWeather({ stage, world, items, board, hud, player, season }) {
  const cfg = EVENTS.rain;
  const rain = new THREE.Group(); rain.visible = false; stage.scene.add(rain);
  const dropMat = new THREE.MeshBasicMaterial({ color: '#b9d4ee', transparent: true, opacity: 0.55, depthWrite: false });
  const dropGeo = new THREE.BoxGeometry(0.012, 0.32, 0.012);
  const drops = Array.from({ length: DROPS }, () => { const m = new THREE.Mesh(dropGeo, dropMat); rain.add(m); return m; });

  let state = 'dry', rainAt = Infinity, deadline = 0, job = null, soaked = false, timeLeft = 0;

  function scatter(m, top) {
    const p = player.group.position;
    m.position.set(p.x + rand(-SPREAD, SPREAD), top ? rand(4.5, 6.5) : rand(0, 6.5), p.z + rand(-SPREAD, SPREAD));
    const { x, z } = m.position;
    m.visible = !(x > ROW.x1 && x < ROW.x2 && z > ROW.z1 && z < ROW.z2);
  }

  function start(time) {
    state = 'raining'; soaked = false; deadline = time + cfg.bringIn;
    drops.forEach(m => scatter(m, false)); rain.visible = true;
    job = board.add({ id: 'rain', title: 'Rain! Bring the washing in', event: true, steps: [
      { kind: 'use', at: LINE_AT, label: 'Take the washing off the line', onDone: () => {
        world.washingLine.takeIn(); items.basket.getObjectByName('laundry').visible = true;
        hud.toast(soaked ? 'Brrr, soaking wet. Bring it in anyway' : 'Got it in time!');
      } },
      { kind: 'pick', item: 'basket', label: 'Pick up the basket' },
      { kind: 'drop', item: 'basket', at: INSIDE, place: [2.85, 0, 0.5], label: 'Put the basket inside, out of the rain' }] });
    hud.toast("It's starting to rain! Get the washing in");
  }

  function stop() { state = 'over'; rain.visible = false; }

  /** Start of a day: dry, and nothing rolled yet. */
  function reset() { state = 'dry'; rainAt = Infinity; job = null; soaked = false; rain.visible = false; }

  function update(dt, time) {
    if (!S.started || S.dayOver) { if (rain.visible) rain.visible = false; return; }
    // once the washing is out, roll whether it'll rain today
    if (state === 'dry' && !S.mission && world.washingLine.hasWashing()) {
      // (in winter it snows instead, see systems/seasonal.js)
      if (season !== 'winter' && Math.random() < cfg.chancePerDay) { state = 'coming'; rainAt = time + rand(...cfg.after); }
      else state = 'over';
    }
    if (state === 'coming' && time > rainAt) start(time);
    if (state !== 'raining') return;

    for (const m of drops) {
      m.position.y -= dt * 7;
      if (m.position.y < 0) scatter(m, true);
    }
    timeLeft = Math.max(0, Math.ceil(deadline - time));
    if (!soaked && job.i === 0 && time > deadline) {
      soaked = true;
      job.title = 'Soaked washing: bring it in anyway'; board.refresh();
      hud.toast('Too late, the washing is soaked!');
    }
    if (board.finished(job)) stop();
  }

  return {
    update, reset,
    /** For trying it out (and the tests): make it rain now, if the washing is out. */
    rainNow(time) { if (state !== 'raining' && world.washingLine.hasWashing()) start(time); },
    banner: () => state === 'raining' && job.i === 0 && !soaked ? `Rain! Get the washing in · ${timeLeft}s` : null,
  };
}

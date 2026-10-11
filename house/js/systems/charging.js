// Charging the car: the cable trails from the wallbox to your hand or to the car's port.
// Once plugged in, charging runs by itself (only with power) while you do other jobs.
import * as THREE from 'three';
import { S } from '../state.js';
import { add, mat, put } from '../core/build.js';

const WALLBOX = new THREE.Vector3(4.95, 0.7, 9.42);
const PORT = new THREE.Vector3(2.2, 0.7, 13.97);

export function createCharging({ stage, board, player }) {
  const cableMat = mat('#2f8fe0');
  add(stage.scene, new THREE.TorusGeometry(0.09, 0.018, 8, 20), cableMat, [4.95, 0.5, 9.43]);   // coiled cable
  const led = new THREE.Mesh(new THREE.SphereGeometry(0.035, 10, 8), new THREE.MeshStandardMaterial({ color: '#204030', emissive: '#000000' }));
  led.position.set(2.05, 0.85, 13.98); put(led);

  let pluggedIn = false, cable = null, cableEnd = null, shown = -1;

  function drawCable() {
    let end = null;
    if (S.carrying === 'plug') end = player.group.localToWorld(player.handPosition());
    else if (pluggedIn) end = PORT.clone();
    if (!end) {
      if (cable) { stage.scene.remove(cable); cable.geometry.dispose(); cable = null; cableEnd = null; }
      return;
    }
    if (cableEnd && cableEnd.distanceTo(end) < 0.03) return;
    cableEnd = end.clone();
    const a = new THREE.Vector3(WALLBOX.x, 0.03, WALLBOX.z + 0.35);
    const b = new THREE.Vector3(end.x + (WALLBOX.x - end.x) * 0.15, 0.03, end.z - (end.z - WALLBOX.z) * 0.12);
    const geo = new THREE.TubeGeometry(new THREE.CatmullRomCurve3([WALLBOX, a, b, end]), 40, 0.018, 6, false);
    if (cable) { cable.geometry.dispose(); cable.geometry = geo; }
    else { cable = new THREE.Mesh(geo, cableMat); cable.castShadow = true; stage.scene.add(cable); }
  }

  function update(dt, time) {
    drawCable();
    const job = board.find('car'), s = job && board.step(job);
    if (s && s.kind === 'charge') {
      if (S.powerOn) s.prog = (s.prog || 0) + dt;
      led.material.emissive.setRGB(0, (0.5 + 0.5 * Math.sin(time * 3)) * (S.powerOn ? 0.9 : 0.1), 0.2);
      const pct = Math.min(100, Math.floor(s.prog / s.dur * 100));
      if (pct !== shown) { shown = pct; job.status = pct + '%'; board.refresh(); }
      if (s.prog >= s.dur) { job.status = ''; board.advance(job, 'Car fully charged! Unplug the cable'); }
    } else led.material.emissive.set(pluggedIn ? '#00cc66' : '#000000');
  }

  return {
    update,
    plugIn() { pluggedIn = true; },
    unplug() { pluggedIn = false; },
  };
}

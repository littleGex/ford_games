// Charging the car: the cable trails from the wallbox along the ground to your hand or to the car's port.
// Once plugged in, charging runs by itself (only with power) while you do other jobs.
import * as THREE from 'three';
import { S } from '../state.js';
import { add, mat, put } from '../core/build.js';

const WALLBOX = new THREE.Vector3(4.95, 0.7, 9.42);
const PORT = new THREE.Vector3(2.2, 0.7, 13.97);
export const CABLE_RADIUS = 0.018;

/** Height the cable lies at: just on top of the path and pavement, and up over the kerb (z 13.55..13.68)
 *  by the street, starting to rise a little before it so it doesn't cut the kerb's corners. */
export function cableGround(x, z) {
  return (z > 13.42 && z < 13.81 ? 0.09 : 0.02) + CABLE_RADIUS + 0.006;
}

/** Points along the cable: down the wall from the wallbox, across the ground with a slight bow, up to `end`. */
export function cablePoints(end) {
  const pts = [WALLBOX.clone(), new THREE.Vector3(WALLBOX.x, 0.4, WALLBOX.z + 0.04)];
  const sx = WALLBOX.x, sz = WALLBOX.z + 0.2;
  const dx = end.x - sx, dz = end.z - sz, len = Math.hypot(dx, dz);
  const ex = len > 0.4 ? end.x - dx / len * 0.12 : end.x, ez = len > 0.4 ? end.z - dz / len * 0.12 : end.z;
  const n = Math.max(2, Math.ceil(len / 0.05)), bow = Math.min(0.35, len * 0.06);
  for (let i = 0; i <= n; i++) {
    const t = i / n, side = Math.sin(Math.PI * t) * bow;
    const x = sx + (ex - sx) * t + (len ? -dz / len : 0) * side, z = sz + (ez - sz) * t + (len ? dx / len : 0) * side;
    pts.push(new THREE.Vector3(x, cableGround(x, z), z));
  }
  if (end.y > 0.15) pts.push(new THREE.Vector3(end.x, Math.min(end.y, 0.3), end.z));
  pts.push(end.clone());
  return pts;
}

/** A path through the points in straight pieces, so the tube can't sag between them like a spline does. */
export class CablePath extends THREE.Curve {
  constructor(points) {
    super(); this.points = points; this.at = [0];
    for (let i = 1; i < points.length; i++) this.at.push(this.at[i - 1] + points[i].distanceTo(points[i - 1]));
  }
  getPoint(t, target = new THREE.Vector3()) {
    const d = t * this.at[this.at.length - 1];
    let i = 1; while (i < this.at.length - 1 && this.at[i] < d) i++;
    const seg = this.at[i] - this.at[i - 1], f = seg ? (d - this.at[i - 1]) / seg : 0;
    return target.copy(this.points[i - 1]).lerp(this.points[i], f);
  }
}

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
    const pts = cablePoints(end);
    const geo = new THREE.TubeGeometry(new CablePath(pts), pts.length * 2, CABLE_RADIUS, 6, false);
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
    reset() { pluggedIn = false; shown = -1; drawCable(); },
    plugIn() { pluggedIn = true; },
    unplug() { pluggedIn = false; },
  };
}

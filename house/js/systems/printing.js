// Dad's 3D printer, in the light-box cupboard by the sofa. A print is a stack of thin layers: while the
// mission's printing step runs, the bed slides back and forth, the head zig-zags and climbs, and the layers
// appear one after another. When it's done the model can be taken out and put where it belongs.
import * as THREE from 'three';
import { S } from '../state.js';
import { PRINTER } from '../world/rooms/wohnzimmer.js';

export const COLOURS = [
  { id: 'red', label: 'Red', hex: '#e04848' }, { id: 'blue', label: 'Blue', hex: '#2f6fd6' },
  { id: 'green', label: 'Green', hex: '#3fa36b' }, { id: 'orange', label: 'Orange', hex: '#f08a24' },
  { id: 'purple', label: 'Purple', hex: '#8e5bd6' }, { id: 'white', label: 'White', hex: '#f2f2f0' },
];

const LAYERS = 16, LH = 0.0075;   // a print is 16 layers, 12 cm tall (big for a real print, so you can see it)
const box = (w, d, x = 0, z = 0) => [new THREE.BoxGeometry(w, LH, d), x, z];
const disc = (r, x = 0, z = 0) => [new THREE.CylinderGeometry(r, r, LH, 18), x, z];

// Each design: what it's called, an emoji for the laptop, the shapes in each layer (bottom up), and where it goes.
export const DESIGNS = [
  { id: 'dragon', label: 'A dragon for P', name: 'dragon', icon: '🐉',
    layer: i => i < 7 ? [box(0.05 - Math.abs(i - 3) * 0.004, 0.09 - Math.abs(i - 3) * 0.006), box(0.012, 0.05, 0, -0.06)]   // body and tail
      : i < 13 ? [box(0.03, 0.035, 0, 0.03 + (i - 7) * 0.004)]                                                       // neck up to the head
      : [box(0.034, 0.045, 0, 0.06), ...(i === 15 ? [box(0.008, 0.01, -0.01, 0.05), box(0.008, 0.01, 0.01, 0.05)] : [])],   // head and horns
    goes: { level: 1, at: [2.3, 8.05], place: [2.95, 0.72, 8.3], label: "Put the dragon on P's desk" } },
  { id: 'pot', label: 'A plant pot', name: 'plant pot', icon: '🪴',
    layer: i => [disc(i === LAYERS - 1 ? 0.058 : 0.034 + i * 0.0014)],
    goes: { level: 0, at: [1.9, 6.9], place: [1.6, 0.76, 6.95], label: 'Put the plant pot on the dining table' } },
  { id: 'stand', label: 'A phone stand', name: 'phone stand', icon: '📱',
    layer: i => i < 3 ? [box(0.09, 0.09)] : [box(0.09, 0.022, 0, -0.03 + i * 0.002), ...(i < 6 ? [box(0.09, 0.012, 0, 0.04)] : [])],
    goes: { level: 1, at: [3.75, 0.5], place: [3.36, 0.75, 0.25], label: 'Put the phone stand on your desk' } },
  { id: 'rocket', label: 'A rocket for Dude', name: 'rocket', icon: '🚀',
    layer: i => i < 4 ? [disc(0.02), box(0.08, 0.012), box(0.012, 0.08)]            // fins
      : i < 12 ? [disc(0.02)] : [disc(0.02 * (LAYERS - i) / 5)],                       // body, then the nose cone
    goes: { level: 2, at: [4.62, 2.27], place: [5.25, 0.76, 2.45], label: "Put the rocket on Dude's desk" } },
];

export function createPrinting({ world, items, board }) {
  const p = world.printer;
  const material = new THREE.MeshStandardMaterial({ color: '#e04848', roughness: 0.55 });
  let layers = [], printing = false, done = false;

  function clear() {
    [...p.model.children].forEach(c => p.model.remove(c));
    [...items.printModel.children].forEach(c => items.printModel.remove(c));
    layers = []; printing = done = false;
  }

  /** Load a spool of this colour (the filament has arrived). */
  function load(colour) {
    const c = COLOURS.find(k => k.id === colour) || COLOURS[0];
    p.spoolMat.color.set(c.hex); material.color.set(c.hex);
    p.spool.visible = true;
  }

  /** Get the print ready: its layers sit on the bed, hidden until they're printed. */
  function start(design) {
    clear();
    const d = DESIGNS.find(k => k.id === design) || DESIGNS[0];
    for (let i = 0; i < LAYERS; i++) {
      const g = new THREE.Group(); g.position.y = (i + 0.5) * LH; g.visible = false;
      d.layer(i).forEach(([geo, x, z]) => { const m = new THREE.Mesh(geo, material); m.position.set(x, 0, z); m.castShadow = true; g.add(m); });
      p.model.add(g); layers.push(g);
    }
    printing = true;
  }

  /** The print is finished: the model comes off the bed as an item you can carry. */
  function finish() {
    printing = false; done = true;
    const it = items.printModel;
    layers.forEach(g => { p.model.remove(g); g.visible = true; it.add(g); });
    world.printer.group.parent.add(it);
    it.position.set((PRINTER.x1 + PRINTER.x2) / 2 + 0.03, 0.09, (PRINTER.z1 + PRINTER.z2) / 2);
    it.rotation.set(0, 0, 0); it.userData.level = 0; it.visible = true;
    p.head.position.set(0, 0, 0); p.gantry.position.y = 0.1; p.bed.position.z = 0;
  }

  function update(dt, time) {
    if (!printing) return;
    const job = board.jobs.find(j => { const s = board.step(j); return s && s.kind === 'wait' && s.print; });
    const s = job && board.step(job);
    if (!s) {   // the printing step is over
      if (!board.jobs.some(j => j.steps.some(t => t.print) && j.i < j.steps.length)) finish();
      return;
    }
    const k = Math.min(1, (s.prog || 0) / s.dur), n = Math.floor(k * LAYERS);
    layers.forEach((g, i) => { g.visible = i < n; });
    p.gantry.position.y = 0.1 + n * LH;
    p.head.position.z = Math.sin(time * 5) * 0.06;
    p.bed.position.z = Math.sin(time * 3.3) * 0.04;
  }

  return {
    update, load, start, finish, clear,
    get printing() { return printing; }, get done() { return done; },
    /** Start of a mission or a day: an empty printer with no spool. */
    reset() { clear(); p.spool.visible = false; items.printModel.visible = false; },
  };
}

// The job board: holds the active jobs, decides which step can be done where,
// shows a floating marker over each next step, and carries out pick / drop / use actions.
//
// Step kinds
//   pick   take an item (at: defaults to where the item is)
//   drop   put the carried item down (place: [x,y,z], or at + y, or home: true for its home spot)
//   use    do something on the spot (onDone runs)
//   sit    sit or stand at a spot for `dur` seconds (handled by systems/sitting.js)
//   mow / hoover / charge   progress handled by their own systems; no button, no marker
import * as THREE from 'three';
import { REACH, COLORS } from '../config.js';
import { S } from '../state.js';
import { sendHome } from '../items.js';

const PASSIVE = new Set(['mow', 'hoover', 'charge']);

function makeMarker(scene) {
  const g = new THREE.Group();
  const gem = new THREE.Mesh(new THREE.OctahedronGeometry(.11), new THREE.MeshStandardMaterial({ color: COLORS.marker, emissive: '#7a4a00' }));
  gem.position.y = 1.6; g.add(gem);
  const ring = new THREE.Mesh(new THREE.RingGeometry(.28, .36, 32), new THREE.MeshBasicMaterial({ color: COLORS.marker, transparent: true, opacity: .7, side: THREE.DoubleSide }));
  ring.rotation.x = -Math.PI / 2; ring.position.y = .02; g.add(ring);
  scene.add(g);
  return g;
}

export function createJobBoard({ scene, items, hud }) {
  const jobs = [], markers = [], listeners = [];
  let ctx = null;   // the full game context, handed to onDone hooks

  const step = job => job.steps[job.i];
  const finished = job => job.i >= job.steps.length;

  /** Where a step happens, in plan coordinates [x, z]. Picks default to the item's current spot. */
  function at(s) {
    if (s.at) return s.at;
    if (s.kind === 'pick' && items[s.item]) { const p = new THREE.Vector3(); items[s.item].getWorldPosition(p); return [p.x, p.z]; }
    if (s.kind === 'drop' && s.home) { const h = items[s.item].userData.home.pos; return [h[0], h[2]]; }
    return null;
  }

  /** Put an item where a drop step leaves it (used when acting, and to show a job as already done). */
  function place(s) {
    const it = items[s.item];
    if (s.home) { sendHome(scene, it); return; }
    scene.attach(it);
    if (s.place) it.position.set(...s.place); else it.position.set(s.at[0], s.y || 0, s.at[1]);
    it.rotation.set(0, s.rot || 0, 0);
  }

  /** Show a job as done in the world: its own tidy(), or its items where its drop steps leave them. */
  function tidy(job) {
    if (job.tidy) job.tidy(ctx);
    else job.steps.filter(s => s.kind === 'drop').forEach(place);
  }

  function canDo(s) {
    if (PASSIVE.has(s.kind)) return false;
    if (s.kind === 'sit') return !S.sitting;
    if (s.kind === 'use') return true;
    if (s.kind === 'pick') return !S.carrying;
    if (s.kind === 'drop') return S.carrying === s.item;
    return false;
  }

  function refresh() { hud.renderJobs(jobs); }

  /** Put a job on today's list. done: already finished earlier today (restored from the save). */
  function add(job, { done = false } = {}) {
    job.i = done ? job.steps.length : 0; job.status = '';
    jobs.push(job); markers.push(makeMarker(scene));
    refresh();
    return job;
  }

  /** Empty the list at the end of a day. */
  function clear() {
    markers.forEach(m => scene.remove(m));
    jobs.length = 0; markers.length = 0;
    refresh();
  }

  /** Move a job on to its next step. message replaces the usual "Done" toast. */
  function advance(job, message) {
    job.i++;
    refresh();
    if (message) hud.toast(message);
    else if (finished(job)) hud.toast('Done: ' + job.title);
    if (finished(job)) listeners.forEach(fn => fn(job));
  }

  /** Nearest step the player could do right now, within reach. */
  function nearestAction(pos) {
    if (S.sitting) return null;
    let best = null, bd = REACH;
    for (const job of jobs) {
      const s = step(job);
      if (!s || !canDo(s)) continue;
      const p = at(s); if (!p) continue;
      const d = Math.hypot(pos.x - p[0], pos.z - p[1]);
      if (d < bd) { bd = d; best = { job, step: s }; }
    }
    return best;
  }

  function act(choice) {
    if (!choice) return;
    const { job, step: s } = choice;
    if (s.kind === 'sit') { ctx.sitting.sitDown(job, s); return; }
    if (s.kind === 'pick') S.carrying = s.item;
    if (s.kind === 'drop') { place(s); S.carrying = null; }
    if (s.onDone) s.onDone(ctx);
    advance(job);
  }

  function updateMarkers(time) {
    jobs.forEach((job, k) => {
      const m = markers[k], s = step(job), p = s && at(s);
      if (!p || !canDo(s)) { m.visible = false; return; }
      m.visible = true;
      m.position.set(p[0], 0, p[1]);
      m.children[0].position.y = 1.6 + (S.reduceMotion ? 0 : Math.sin(time * 3 + k) * .08);
      m.children[0].rotation.y = time * 1.5;
    });
  }

  return {
    jobs, add, clear, advance, act, tidy, nearestAction, updateMarkers, refresh, step, finished,
    allDone: () => jobs.length > 0 && jobs.every(finished),
    /** fn(job) runs whenever a job is finished. */
    onFinished(fn) { listeners.push(fn); },
    find: id => jobs.find(j => j.id === id),
    setContext(c) { ctx = c; },
  };
}

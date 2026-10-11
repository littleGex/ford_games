// The job board: holds the active jobs, decides which step can be done where,
// shows a floating marker over each next step, and carries out pick / drop / use actions.
//
// Step kinds
//   pick   take an item (at: defaults to where the item is)
//   drop   put the carried item down (place: [x,y,z], or at + y, or home: true for its home spot)
//   use    do something on the spot (onDone runs)
//   sit    sit or stand at a spot for `dur` seconds (handled by systems/sitting.js)
//   mow / hoover / charge / wait   progress handled by their own systems; no button, no marker
// Steps happen on the ground floor unless they say level: 1 (pick steps use the item's floor).
import * as THREE from 'three';
import { REACH, COLORS, LEVEL_HEIGHT } from '../config.js';
import { S } from '../state.js';
import { sendHome } from '../items.js';

const PASSIVE = new Set(['mow', 'hoover', 'charge', 'wait']);
const FIXED_REACH = 0.6;

function makeMarker(scene) {
  const g = new THREE.Group();
  const gem = new THREE.Mesh(new THREE.OctahedronGeometry(.11), new THREE.MeshStandardMaterial({ color: COLORS.marker, emissive: '#7a4a00' }));
  gem.position.y = 1.6; g.add(gem);
  const ring = new THREE.Mesh(new THREE.RingGeometry(.28, .36, 32), new THREE.MeshBasicMaterial({ color: COLORS.marker, transparent: true, opacity: .7, side: THREE.DoubleSide }));
  ring.rotation.x = -Math.PI / 2; ring.position.y = .02; g.add(ring);
  scene.add(g);
  return g;
}

export function createJobBoard({ scene, items, hud, levels }) {
  const jobs = [], markers = [], listeners = [], fixed = [];
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

  /** Which floor a step happens on. */
  function levelOf(s) {
    if (s.level !== undefined) return s.level;
    if (s.kind === 'pick' && items[s.item]) return items[s.item].userData.level;
    if (s.kind === 'drop' && s.home) return items[s.item].userData.home.level;
    return 0;
  }

  /** Put an item where a drop step leaves it (used when acting, and to show a job as already done). */
  function place(s) {
    const it = items[s.item];
    if (s.home) { sendHome(it); return; }
    const lvl = s.level || 0;
    levels[lvl].attach(it);
    if (s.place) it.position.set(...s.place); else it.position.set(s.at[0], s.y || 0, s.at[1]);
    it.rotation.set(0, s.rot || 0, 0);
    it.userData.level = lvl;
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

  /** Take one job off today's list (a job that was only for the character who was playing). */
  function remove(id) {
    const k = jobs.findIndex(j => j.id === id);
    if (k < 0) return;
    scene.remove(markers[k]);
    jobs.splice(k, 1); markers.splice(k, 1);
    refresh();
  }

  /** Swap a job on today's list for a fresh copy of it, from its first step (it keeps its place on the list). */
  function replace(job) {
    const k = jobs.findIndex(j => j.id === job.id);
    if (k < 0) return;
    job.i = 0; job.status = '';
    jobs[k] = job;
    refresh();
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

  /** Nearest step (or fixed action, like the stairs) the player could do right now, within reach. */
  function nearestAction(pos) {
    if (S.sitting) return null;
    let best = null, bd = REACH;
    for (const job of jobs) {
      const s = step(job);
      if (!s || !canDo(s) || levelOf(s) !== S.level) continue;
      const p = at(s); if (!p) continue;
      const d = Math.hypot(pos.x - p[0], pos.z - p[1]);
      if (d < bd) { bd = d; best = { job, step: s }; }
    }
    // fixed actions (the stairs) only when standing right there, and never instead of a job step
    if (!best) for (const f of fixed) {
      if (f.level !== S.level) continue;
      const d = Math.hypot(pos.x - f.at[0], pos.z - f.at[1]);
      if (d < FIXED_REACH && d < bd) { bd = d; best = { fixed: f, step: f }; }
    }
    return best;
  }

  function act(choice) {
    if (!choice) return;
    if (choice.fixed) { choice.fixed.act(); return; }
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
      const lvl = levelOf(s);
      m.visible = lvl === S.level;
      m.position.set(p[0], lvl * LEVEL_HEIGHT, p[1]);
      m.children[0].position.y = 1.6 + (S.reduceMotion ? 0 : Math.sin(time * 3 + k) * .08);
      m.children[0].rotation.y = time * 1.5;
    });
  }

  return {
    jobs, add, remove, replace, clear, advance, act, tidy, nearestAction, updateMarkers, refresh, step, finished, levelOf,
    /** An action that's always there, like going up or down the stairs: { at, level, label, act }. */
    addFixed(f) { fixed.push(f); },
    allDone: () => jobs.length > 0 && jobs.every(finished),
    /** fn(job) runs whenever a job is finished. */
    onFinished(fn) { listeners.push(fn); },
    find: id => jobs.find(j => j.id === id),
    setContext(c) { ctx = c; },
  };
}

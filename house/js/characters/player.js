// The player: one group in the world that wears whichever family member is selected.
// Handles walking (with collision), poses for sitting / standing at a job, and holding items.
import * as THREE from 'three';
import { WALK_SPEED } from '../config.js';
import { S } from '../state.js';
import { blocked } from '../core/collision.js';
import { makeCharacter, animateWalk } from './character.js';
import { specFor } from './looks.js';
import { dressUp, undress } from './costumes.js';

export function createPlayer(scene, items, players) {
  const group = new THREE.Group();
  const reset = () => { S.level = 0; group.position.set(3.92, 0, 10.6); group.rotation.y = Math.PI; };   // on the front path, facing the door
  reset();
  scene.add(group);

  // each player's figure, from their look and life stage (players.js); rebuilt when the editor changes it
  const build = key => makeCharacter(specFor(key, players.look(key), players.stage(key)));
  const looks = Object.fromEntries(['dad', 'mum', 'girl', 'boy'].map(k => [k, build(k)]));
  let cur = null, curKey = null, phase = 0;

  function setCharacter(key) {
    if (cur) group.remove(cur.root);
    cur = looks[key]; curKey = key;
    group.add(cur.root);
  }

  /** A player's look or birthday changed: build their figure again (and wear it, if it's them playing). */
  function refresh(key) {
    looks[key] = build(key);
    if (curKey === key) setCharacter(key);
  }

  /** Where a carried item sits, in player space (also used for the charging cable). */
  function handPosition() { return new THREE.Vector3(0, 0.72 * cur.scale, 0.3 * cur.scale); }

  /** Move by a world-space step, sliding along walls. Returns true if the player moved. */
  function walk(dx, dz, dt) {
    const p = group.position;
    if (!blocked(p.x + dx, p.z)) p.x += dx;
    if (!blocked(p.x, p.z + dz)) p.z += dz;
    group.rotation.y = Math.atan2(dx, dz);
    phase += dt * 9;
    return true;
  }

  function stepFromInput(axis, yaw, dt) {
    const fx = -Math.sin(yaw), fz = -Math.cos(yaw), rx = Math.cos(yaw), rz = -Math.sin(yaw);
    const k = WALK_SPEED * dt * ((S.carrying === 'bike' || S.carrying === 'dadBike') ? 1.8 : 1);   // faster on a bike
    return walk((rx * axis.x - fx * axis.y) * k, (rz * axis.x - fz * axis.y) * k, dt);
  }

  function animate(dt, walking) {
    const c = cur, k = Math.min(1, dt * 12), sit = S.sitting;
    if (sit && sit.step.stand) {          // standing at the sink / coffee machine, busy hands
      c.legs.forEach(l => { l.rotation.x += (0 - l.rotation.x) * k; });
      c.arms.forEach((a, i) => { a.rotation.x = -1.0 + Math.sin(performance.now() / 120 + i * 2) * 0.25; });
      c.fig.position.y = 0;
    } else if (sit) {                      // seated: thighs forward, arms resting or holding the controller
      c.legs.forEach(l => { l.rotation.x += (-1.45 - l.rotation.x) * k; });
      const a = S.carrying ? -0.9 : -0.35;
      c.arms.forEach(x => { x.rotation.x += (a - x.rotation.x) * k; });
      c.fig.position.y = sit.seatY + 0.05 - 0.44 * c.scale; c.head.rotation.z = 0;
    } else {
      const it = S.carrying && items[S.carrying];
      const hold = it ? ((it.userData.wheel || it.userData.carry) ? -0.75 : -1.15) : null;
      animateWalk(c, dt, { walking, phase, hold, reduceMotion: S.reduceMotion });
    }
    holdItem();
  }

  function holdItem() {
    if (!S.carrying) return;
    const it = items[S.carrying];
    if (it.parent !== group) { group.add(it); it.rotation.set(0, 0, 0); }
    if (it.userData.carry) { it.position.set(...it.userData.carry); it.rotation.set(...(it.userData.carryRot || [0, 0, 0])); }
    else if (it.userData.wheel) { it.position.set(0, 0.02, 0.55); it.rotation.set(-0.22, 0, 0); }
    else it.position.copy(handPosition());
  }

  return {
    group,
    get character() { return cur; },
    setCharacter, refresh, stepFromInput, animate, handPosition, reset,
    /** Put on a Halloween costume (characters/costumes.js), or null to take it off. */
    dressUp(id) { if (id) dressUp(cur, id); else undress(cur); },
    /** The costume being worn, if any. */
    get costume() { return cur && cur.costume ? cur.costume.id : null; },
    /** Start of a day: everyone back in their own clothes. */
    undressAll() { Object.values(looks).forEach(undress); },
    /** The right arm (wiping windows moves it). */
    arms: () => cur && cur.arms[1],
    /** Point just in front of the player (e.g. where the mower deck or hoover head is). */
    ahead(dist) { const r = group.rotation.y; return { x: group.position.x + Math.sin(r) * dist, z: group.position.z + Math.cos(r) * dist }; },
  };
}

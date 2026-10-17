// Bedtime (the mission in missions.js): the evening, and P and Dude as figures who walk about on their own.
// The house goes dark outside with a moon, and lights come on inside: the living-room lamp, the hall, the
// landing, the bathroom and the kids' rooms (each room goes dark when its light is switched off).
// The kids start on the sofa with their iPads. Once told to switch off they follow you about, a step or two
// behind, up and down the stairs. Steps put them somewhere for a while (in the shower, at the basin, in bed),
// and trouble takes them off on their own (a dance party, back on the iPad, hiding).
import * as THREE from 'three';
import { LEVEL_HEIGHT } from '../config.js';
import { S } from '../state.js';
import { NAMES, possessive, their } from '../names.js';
import { kidIn, roomFor } from '../pack/kidrooms.js';
import { makeCharacter, animateWalk } from '../characters/character.js';
import { specFor } from '../characters/looks.js';
import { dressUp, undress } from '../characters/costumes.js';
import { music } from '../core/audio.js';
import { add, mat } from '../core/build.js';
import { blocked } from '../core/collision.js';

/** { girl, boy } worked out each time from the child's key (where they sleep can change). */
const byKid = fn => ({ get girl() { return fn('girl'); }, get boy() { return fn('boy'); } });

// Where things happen at bedtime, plan coordinates [x, z]. level: the floor (0 ground, 1 first, 2 attic).
// Spots where a child stands, sits or lies: [x, y, z, facing].
export const BED = {
  sofa: { girl: { level: 0, at: [1.1, 1.8], seat: [0.55, 0.42, 1.8, Math.PI / 2] },
          boy: { level: 0, at: [1.1, 2.75], seat: [0.55, 0.42, 2.75, Math.PI / 2] } },
  bathDoor: [3.875, 6.55],                                                // on the landing, outside the bathroom
  shower: { at: [4.7, 7.85], spot: [5.2, 0, 8.5, 0] },
  basin: { at: [4.6, 7.22], spot: [4.78, 0, 7.22, Math.PI / 2] },
  bathroom: [4.3, 7.45],                                                  // where you hand over the pyjamas
  story: { at: [1.25, 6.9], seat: [0.75, 0.46, 6.9, Math.PI / 2],         // on the edge of the first-floor room's daybed
           kids: { girl: [0.5, 0.46, 7.45, Math.PI / 2], boy: [0.5, 0.46, 6.35, Math.PI / 2] } },
  // each child's bed, iPad spot, light switch and wardrobe: in the room they sleep in (pack/kidrooms.js)
  bed: byKid(k => { const r = roomFor(k); return { level: r.level, at: r.bedtime.at, lie: r.bedtime.lie, name: `${their(k)} bed` }; }),
  ipad: byKid(k => { const r = roomFor(k); return { level: r.level, ...r.bedtime.ipad }; }),     // back on the iPad, on their bed
  switch: byKid(k => { const r = roomFor(k); return { level: r.level, at: r.bedtime.switch, room: k, name: `${possessive(k)} room` }; }),
  wardrobe: byKid(k => { const r = roomFor(k); return { level: r.level, at: r.wardrobe.at, name: `${their(k)} wardrobe` }; }),
  dance: { level: 1, spot: [3.95, 0, 5.45, 0] },                          // the landing
  terrarium: [2.3, 6.35],
};
// Where pyjamas that can't be found might be, and where a child might hide (all on the first floor: the daybed
// and wardrobe are whoever sleeps in the first-floor room's)
export const SEARCH = {
  pyjamas: [{ at: [4.25, 3.55], place: [4.5, 0.62, 3.6], name: 'the laundry hamper' }, { at: [1.25, 6.4], place: [0.6, 0.47, 6.3], get name() { return `the end of ${possessive(kidIn('first'))} bed`; } },
            { at: [2.35, 1.9], place: [2.0, 0.55, 1.9], name: 'the big bed' }],
  hide: [{ at: [2.3, 6.95], get name() { return `in ${possessive(kidIn('first'))} wardrobe`; } }, { at: [4.7, 7.85], name: 'behind the shower curtain' },
         { at: [2.35, 1.0], name: 'behind the bedroom curtains' }, { at: [1.25, 6.9], get name() { return `under ${possessive(kidIn('first'))} bed`; } }],
};
export { NAMES };   // (the players' names, names.js)

export const BOOKS = [
  { id: 'dragon', label: "The dragon who couldn't sleep", icon: '🐉' },
  { id: 'socks', label: 'Socks in space', icon: '🚀' },
  { id: 'snail', label: 'The very brave snail', icon: '🐌' },
  { id: 'pirates', label: 'Pirates in the bath', icon: '🏴‍☠️' },
];

const NIGHT = { sky: '#0d1530', hemi: ['#5a6a9a', '#140f0c', 0.16], moon: ['#a9bdff', 0.22] };
// the lights that come on in the evening: world position, colour, strength, reach
const LIGHTS = {
  hall: [[3.8, 2.05, 5.6], '#ffd9a0', 1.1, 4.5],
  stairs: [[4.45, 0.35, 6.3], '#ffc070', 0, 2.2],              // the little night light by the stairs (on at the end)
  landing: [[3.95, LEVEL_HEIGHT + 2.05, 5.2], '#ffd9a0', 1.0, 4.5],
  bathroom: [[4.6, LEVEL_HEIGHT + 2.05, 7.6], '#fff1d6', 1.0, 3.5],
  girl: [[1.6, LEVEL_HEIGHT + 2.05, 7.0], '#ffcf9a', 1.1, 4.5],
  boy: [[2.0, 2 * LEVEL_HEIGHT + 1.9, 2.8], '#ffcf9a', 1.1, 4.5],
};
const SPEED = 2.6, GAP = { girl: 0.8, boy: 1.4 };   // how far behind you each child walks

export function createBedtime(ctx) {
  const { stage, world, player } = ctx;
  const floors = () => [stage.scene, world.upstairs, world.attic];
  let on = false, day = null, lights = {}, moon = null, last = null, trail = [];

  // --- the children
  const kids = {};
  /** A child's figure as they look now (players.js: the avatar editor, and taller as a teenager). */
  function buildKid(who) {
    const old = kids[who];
    if (old && old.c.root.parent) old.c.root.parent.remove(old.c.root);
    const players = ctx.players;
    const c = makeCharacter(players ? specFor(who, players.look(who), players.stage(who)) : specFor(who));
    c.root.visible = false; stage.scene.add(c.root);
    const tablet = add(c.root, new THREE.BoxGeometry(0.2, 0.012, 0.14), new THREE.MeshStandardMaterial({ color: '#2b2f36', emissive: '#4a8fd6', emissiveIntensity: 0.6 }), [0, 0.55, 0.28], null, [-0.6, 0, 0]);
    const duvet = add(c.root, new THREE.BoxGeometry(0.5, 0.12, 0.62), mat(who === 'girl' ? '#c99ab8' : '#e9ecf2'), [0, 0.06, -0.42]);
    kids[who] = { who, c, tablet, duvet, level: 0, mode: 'away', spot: null, phase: 0, idx: 0, path: [] };
  }
  ['girl', 'boy'].forEach(buildKid);
  const k = who => kids[who];

  function toFloor(kid, level) {
    if (kid.level === level && kid.c.root.parent === floors()[level]) return;
    floors()[level].add(kid.c.root);
    kid.level = level;
  }

  /** Put a child somewhere: pose 'sit', 'stand', 'bed', 'shower', 'teeth', 'dance', 'ipad', 'hide'. */
  function place(who, level, [x, y, z, facing], pose) {
    const kid = k(who);
    toFloor(kid, level);
    kid.mode = 'spot'; kid.pose = pose; kid.spot = [x, y, z, facing];
    kid.c.root.visible = pose !== 'hide';
    kid.c.root.position.set(x, pose === 'bed' ? y : 0, z);
    kid.c.root.rotation.set(0, facing, 0);
    kid.path = [];
  }

  /** The child follows you from where they are. */
  function follow(who) {
    const kid = k(who);
    kid.mode = 'follow'; kid.pose = null; kid.c.root.visible = true;
    kid.c.fig.rotation.set(0, 0, 0); kid.c.fig.position.set(0, 0, 0);
    if (kid.level !== S.level) behindYou(kid);
    kid.idx = trail.length;
  }

  /** Walk off somewhere on their own, then stay there in a pose. */
  function walkTo(who, level, spot, pose) {
    const kid = k(who);
    if (kid.level !== level) { place(who, level, spot, pose); return; }
    kid.mode = 'walk'; kid.pose = null; kid.c.root.visible = true; kid.target = { level, spot, pose };
    kid.path = [[spot[0], spot[2]]];
  }

  /** Put a child just behind you after a jump (the stairs, getting up): the first free spot round you that
   *  isn't through a wall (checked in small steps out from where you stand). */
  function behindYou(kid) {
    const p = player.group.position, r = player.group.rotation.y, d = GAP[kid.who] * 0.7;
    toFloor(kid, S.level);
    const clear = a => { for (let t = 0.1; t <= d; t += 0.1) if (blocked(p.x - Math.sin(a) * t, p.z - Math.cos(a) * t, S.level)) return false; return true; };
    const turn = [0, 0.6, -0.6, 1.2, -1.2, 1.8, -1.8, Math.PI].map(x => r + x * (kid.who === 'girl' ? 1 : -1)).find(clear);
    const a = turn === undefined ? r : turn, dd = turn === undefined ? 0.15 : d;
    kid.c.root.position.set(p.x - Math.sin(a) * dd, 0, p.z - Math.cos(a) * dd);
    kid.c.root.rotation.set(0, r, 0);
  }

  /** Is this child with you (following, on your floor)? */
  const withYou = who => on && k(who).mode === 'follow' && k(who).level === S.level;

  // --- the evening
  function night() {
    const { scene, hemi, sun } = stage;
    day = { bg: scene.background.clone(), fog: scene.fog.color.clone(), near: scene.fog.near, far: scene.fog.far,
            hemi: [hemi.color.clone(), hemi.groundColor.clone(), hemi.intensity], sun: [sun.color.clone(), sun.intensity] };
    scene.background.set(NIGHT.sky); scene.fog.color.set(NIGHT.sky);
    hemi.color.set(NIGHT.hemi[0]); hemi.groundColor.set(NIGHT.hemi[1]); hemi.intensity = NIGHT.hemi[2];
    sun.color.set(NIGHT.moon[0]); sun.intensity = NIGHT.moon[1];
    // the lights live in the scene itself (not in the floors that hide), so the number of lights never
    // changes while you go up and down the stairs
    for (const [name, [pos, color, strength, reach]] of Object.entries(LIGHTS)) {
      const l = new THREE.PointLight(color, strength, reach, 2);
      l.position.set(...pos); l.userData.on = strength; scene.add(l); lights[name] = l;
    }
    moon = new THREE.Mesh(new THREE.SphereGeometry(1.1, 20, 14), new THREE.MeshBasicMaterial({ color: '#f4f1dc', fog: false }));
    moon.position.set(-14, 16, -26); scene.add(moon);
    S.lampOn = true; ctx.power.applyLights();
  }

  function daytime() {
    const { scene, hemi, sun } = stage;
    if (day) {
      scene.background.copy(day.bg); scene.fog.color.copy(day.fog);
      hemi.color.copy(day.hemi[0]); hemi.groundColor.copy(day.hemi[1]); hemi.intensity = day.hemi[2];
      sun.color.copy(day.sun[0]); sun.intensity = day.sun[1];
    }
    Object.values(lights).forEach(l => scene.remove(l)); lights = {};
    if (moon) { scene.remove(moon); moon = null; }
    S.lampOn = false; ctx.power.applyLights();
    day = null;
  }

  function light(name, lit) { const l = lights[name]; if (l) l.intensity = lit ? (l.userData.on || 0.6) : 0; }

  // --- each frame
  function update(dt, time) {
    if (!on) return;
    const p = player.group.position, here = [p.x, p.z];
    // your path, for the kids to follow: a point every 0.3 m; a jump (the stairs, sitting down) starts afresh
    if (!last || last.level !== S.level || Math.hypot(here[0] - last.x, here[1] - last.z) > 1.5) {
      trail = [here];
      for (const kid of Object.values(kids)) if (kid.mode === 'follow') { behindYou(kid); kid.idx = 0; }
    } else if (Math.hypot(here[0] - trail[trail.length - 1][0], here[1] - trail[trail.length - 1][1]) > 0.3) {
      trail.push(here); if (trail.length > 200) { trail.shift(); for (const kid of Object.values(kids)) kid.idx = Math.max(0, kid.idx - 1); }
    }
    last = { level: S.level, x: p.x, z: p.z };

    const story = S.sitting && S.sitting.step.kidsSit;
    for (const kid of Object.values(kids)) {
      const c = kid.c, r = c.root;
      if (kid.mode === 'away') continue;
      let walking = false;
      kid.tablet.visible = kid.pose === 'sofa' || kid.pose === 'ipad';
      kid.duvet.visible = kid.pose === 'bed';
      if (story && kid.mode === 'follow') {   // listening to the story, sitting on the bed
        const [x, y, z, f] = story[kid.who];
        r.position.set(x, 0, z); r.rotation.set(0, f, 0); sitPose(kid, y, dt);
        continue;
      }
      if (kid.mode === 'follow') {
        // walk along your path to a point a little way behind you
        let ahead = 0, aim = trail.length - 1;
        while (aim > 0 && ahead < GAP[kid.who]) { ahead += Math.hypot(trail[aim][0] - trail[aim - 1][0], trail[aim][1] - trail[aim - 1][1]); aim--; }
        kid.idx = Math.min(kid.idx, aim);
        while (kid.idx < aim && Math.hypot(trail[kid.idx][0] - r.position.x, trail[kid.idx][1] - r.position.z) < 0.15) kid.idx++;
        const t = trail[Math.min(kid.idx, aim)];
        if (Math.hypot(p.x - r.position.x, p.z - r.position.z) > GAP[kid.who] * 0.8) walking = step(kid, t, dt);
      } else if (kid.mode === 'walk') {
        walking = step(kid, kid.path[0], dt);
        if (!walking) { const t = kid.target; place(kid.who, t.level, t.spot, t.pose); }
      }
      if (kid.mode === 'spot') { pose(kid, dt, time); continue; }
      c.fig.rotation.set(0, 0, 0); r.position.y = 0;
      animateWalk(c, dt, { walking, phase: kid.phase, hold: null, reduceMotion: S.reduceMotion });
    }
    const dancing = Object.values(kids).some(kid => kid.pose === 'dance');
    music(dancing ? 'radio' : null);
    // the shower runs while a child's in it
    if (world.showerWater) {
      const showering = Object.values(kids).some(kid => kid.pose === 'shower');
      if (showering || !S.sitting) world.showerWater.visible = showering;
      if (showering) world.showerWater.children.forEach((d, i) => { const t = (time * 2.2 + i / world.showerWater.children.length) % 1; d.position.y = 1.3 - t * 1.1; });
    }
  }

  function step(kid, t, dt) {
    if (!t) return false;
    const r = kid.c.root, dx = t[0] - r.position.x, dz = t[1] - r.position.z, d = Math.hypot(dx, dz);
    if (d < 0.05) return false;
    const s = Math.min(d, SPEED * dt);
    r.position.x += dx / d * s; r.position.z += dz / d * s;
    r.rotation.y = Math.atan2(dx, dz);
    kid.phase += dt * 9;
    return true;
  }

  function sitPose(kid, seatY, dt) {
    const c = kid.c, a = Math.min(1, dt * 12);
    c.fig.rotation.set(0, 0, 0);
    c.legs.forEach(l => { l.rotation.x += (-1.45 - l.rotation.x) * a; });
    c.arms.forEach(x => { x.rotation.x += (-0.5 - x.rotation.x) * a; });
    c.fig.position.y = seatY + 0.05 - 0.44 * c.scale;
  }

  function pose(kid, dt, time) {
    const c = kid.c, [, y] = kid.spot;
    if (kid.pose === 'sofa' || kid.pose === 'ipad' || kid.pose === 'sit') { sitPose(kid, y, dt); return; }
    c.fig.position.y = 0; c.fig.rotation.set(0, 0, 0);
    c.legs.forEach(l => { l.rotation.x = 0; });
    if (kid.pose === 'bed') {   // lying on their back, under the duvet
      c.fig.rotation.x = -Math.PI / 2; c.fig.position.y = 0.06;
      c.arms.forEach(x => { x.rotation.x = 0; });
      c.head.rotation.z = 0;
      return;
    }
    if (kid.pose === 'teeth') { c.arms[1].rotation.x = -1.9 + Math.sin(time * 14) * 0.2; c.arms[0].rotation.x = 0; return; }
    if (kid.pose === 'dance') {
      c.fig.position.y = Math.abs(Math.sin(time * 7)) * 0.08;
      c.arms[0].rotation.x = -2.6 + Math.sin(time * 7) * 0.5; c.arms[1].rotation.x = -2.6 - Math.sin(time * 7) * 0.5;
      kid.c.root.rotation.y = kid.spot[3] + Math.sin(time * 2.5) * 0.8;
      return;
    }
    c.arms.forEach(x => { x.rotation.x = kid.pose === 'shower' ? -2.4 : 0; });
  }

  return {
    update, place, follow, walkTo, withYou, light, BED,
    get on() { return on; },
    kid: who => k(who),
    /** Is a child at a spot in this pose (in bed, in the shower)? */
    is: (who, p) => on && k(who).mode === 'spot' && k(who).pose === p,
    /** The evening starts: dark outside, lights on, both kids on the sofa with their iPads. */
    start() {
      if (on) this.end();
      on = true; night(); trail = []; last = null;
      for (const who of ['girl', 'boy']) {
        buildKid(who); k(who).dressed = false;
        const s = BED.sofa[who];
        place(who, s.level, s.seat, 'sofa');
      }
    },
    /** Into pyjamas. */
    pyjamas(who) { dressUp(k(who).c, `pyjamas-${who}`); k(who).dressed = true; },
    /** Going downstairs at the end: the hall light goes off and the little stair light comes on. */
    downstairs() { light('hall', false); light('landing', false); light('bathroom', false); lights.stairs.intensity = 0.9; },
    /** Back to the day. */
    end() {
      if (!on) return;
      on = false; daytime(); music(null);
      for (const kid of Object.values(kids)) { kid.mode = 'away'; kid.c.root.visible = false; undress(kid.c); kid.c.fig.rotation.set(0, 0, 0); kid.c.fig.position.set(0, 0, 0); }
      if (world.showerWater && !S.sitting) world.showerWater.visible = false;
    },
  };
}

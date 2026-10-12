// Post and parcels. Each day may bring the post, a parcel, both or neither (chances in config.js).
// - The post arrives in the letterbox: take it to the dining table.
// - A delivery driver walks up from the van and rings the bell. You have a short time to take the parcel;
//   miss it and a missed-delivery card lands in the letterbox instead.
// - Some days the driver brings a parcel for one of the neighbours instead (or as well). Take it in and keep
//   it in the hall till they're home; then either take it round to their front door, or they come round,
//   ring the bell, and you say hello, fetch it from the hall and hand it over.
import * as THREE from 'three';
import { EVENTS } from '../config.js';
import { S, rand } from '../state.js';
import { add, castShadows, group, mat } from '../core/build.js';
import { dingDong } from '../core/audio.js';
import { makeCharacter } from '../characters/character.js';
import { COURIER, NEIGHBOURS } from '../characters/family.js';
import { NEIGHBOUR_HOUSES } from '../world/outside/neighbours.js';

const VAN_SPOT = new THREE.Vector3(4.6, 0, 13.3);
const DOOR_SPOT = new THREE.Vector3(3.92, 0, 9.85);
const LETTERBOX = [3.02, 9.33];
const HALL_SHELF = [3.7, 4.6];          // where the neighbours' parcel waits (ours goes by the stairs)
const OPEN_DOOR = [3.92, 9.3];          // standing in the open front door, to talk to a neighbour on the step
const STREET_Z = 12.1;                  // the neighbours walk round by the pavement
const GAP = 70;                         // seconds between two drivers on the same day

/** A figure that walks between points: the driver, the neighbours. */
function walker(spec, scene) {
  const c = makeCharacter(spec);
  c.root.visible = false; scene.add(c.root);
  let phase = 0;
  return {
    c, root: c.root, path: [],
    /** Walk along this.path; false once there. */
    walk(dt) {
      const p = c.root.position;
      while (this.path.length) {
        const t = this.path[0], dx = t[0] - p.x, dz = t[1] - p.z, d = Math.hypot(dx, dz);
        if (d < 0.05) { this.path.shift(); continue; }
        const step = Math.min(d, 1.6 * dt);
        p.x += dx / d * step; p.z += dz / d * step;
        c.root.rotation.y = Math.atan2(dx, dz);
        phase += dt * 9;
        return true;
      }
      return false;
    },
    animate(walking, dt, holding) {
      const k = Math.min(1, dt * 12), sw = walking ? Math.sin(phase) * 0.55 : 0;
      c.legs[0].rotation.x += (sw - c.legs[0].rotation.x) * k; c.legs[1].rotation.x += (-sw - c.legs[1].rotation.x) * k;
      const a0 = holding ? -1.15 : -sw * 0.8, a1 = holding ? -1.15 : sw * 0.8;
      c.arms[0].rotation.x += (a0 - c.arms[0].rotation.x) * k; c.arms[1].rotation.x += (a1 - c.arms[1].rotation.x) * k;
    },
  };
}

export function createDeliveries({ stage, items, board, hud }) {
  const cfg = EVENTS;
  const driver = walker(COURIER, stage.scene);
  const neighbours = { left: walker(NEIGHBOURS.left, stage.scene), right: walker(NEIGHBOURS.right, stage.scene) };

  const van = group(6.6, 0, 15.0); van.visible = false;
  add(van, new THREE.BoxGeometry(4.6, 1.6, 1.9), mat('#f4f4f4'), [0, 1.05, 0]);
  add(van, new THREE.BoxGeometry(4.62, 0.18, 1.92), mat('#3b6fb0'), [0, 0.85, 0]);
  add(van, new THREE.BoxGeometry(0.5, 0.6, 1.86), mat('#2a3340'), [-2.1, 1.45, 0]);
  [[-1.5, 0.95], [1.5, 0.95], [-1.5, -0.95], [1.5, -0.95]].forEach(([x, z]) => add(van, new THREE.CylinderGeometry(0.33, 0.33, 0.22, 18), mat('#1a1a1c'), [x, 0.33, z], null, [Math.PI / 2, 0, 0]));
  castShadows(van);

  let postAt = Infinity, postDone = false;
  // today's drivers, in the order they come: { at, item: 'parcel' | 'neighbourParcel', side?, comes? }
  let runs = [], run = null;
  let state = 'gone', deadline = 0, parcelJob = null, timeLeft = 0;
  // the neighbours' parcel once it's in: which neighbour, and what they're doing
  let nb = null;   // { side, comes, job, who: walker, state: 'away' | 'coming' | 'waiting' | 'home' | 'leaving' }

  function sendAway() {
    state = 'gone'; S.courierWaiting = false; run = null;
    driver.root.visible = false; van.visible = false;
    for (const id of ['parcel', 'neighbourParcel']) if (items[id].parent === driver.root) { driver.root.remove(items[id]); items[id].visible = false; }
  }

  function neighbourAway() {
    if (nb && items.neighbourParcel.parent === nb.who.root) { nb.who.root.remove(items.neighbourParcel); items.neighbourParcel.visible = false; }
    Object.values(neighbours).forEach(n => { n.root.visible = false; n.path = []; });
    nb = null;
  }

  /** A neighbour's front door: where they stand in the doorway, facing the street. */
  const doorway = side => [NEIGHBOUR_HOUSES[side].step[0], 9.5];

  /** Start of a day: roll today's deliveries. */
  function reset(time) {
    sendAway(); neighbourAway();
    postDone = false; parcelJob = null;
    postAt = Math.random() < cfg.post.chancePerDay ? time + rand(...cfg.post.after) : Infinity;
    runs = [];
    if (Math.random() < cfg.parcel.chancePerDay) runs.push({ at: time + rand(...cfg.parcel.after), item: 'parcel' });
    if (Math.random() < cfg.neighbourParcel.chancePerDay) runs.push(neighbourRun(time + rand(...cfg.neighbourParcel.after)));
    spaceOut();
  }

  function neighbourRun(at, side = Math.random() < 0.5 ? 'left' : 'right', comes = Math.random() < cfg.neighbourParcel.comesRound) {
    return { at, item: 'neighbourParcel', side, comes };
  }

  /** Two drivers in a day come at least GAP seconds apart. */
  function spaceOut() {
    runs.sort((a, b) => a.at - b.at);
    for (let k = 1; k < runs.length; k++) runs[k].at = Math.max(runs[k].at, runs[k - 1].at + GAP);
  }

  function arrive(r) {
    run = r;
    van.visible = true; driver.root.visible = true; driver.root.position.copy(VAN_SPOT); state = 'arrive';
    driver.path = [[DOOR_SPOT.x, DOOR_SPOT.z]];
    const it = items[r.item];
    it.visible = true; driver.root.add(it);
    it.position.set(0, 0.68, 0.3); it.rotation.set(0, 0, 0);
  }

  const side = s => `on the ${s}`;

  /** The driver is at the door with a parcel for the neighbours: the job that runs till they have it. */
  function neighbourJob(r) {
    const name = `the neighbours ${side(r.side)}`, house = NEIGHBOUR_HOUSES[r.side];
    const later = r.comes ? [
      { kind: 'use', at: OPEN_DOOR, label: 'Open the door and say hello', onDone: greet },
      { kind: 'pick', item: 'neighbourParcel', label: 'Fetch their parcel from the hall' },
      { kind: 'drop', item: 'neighbourParcel', at: OPEN_DOOR, place: [DOOR_SPOT.x, 0.68, DOOR_SPOT.z - 0.3], label: 'Give them the parcel', onDone: handOver },
    ] : [
      { kind: 'pick', item: 'neighbourParcel', label: 'Pick up their parcel from the hall' },
      { kind: 'drop', item: 'neighbourParcel', at: house.step, place: [house.step[0], 0.68, 9.8], label: `Take it next door, ${side(r.side)}`, onDone: handOver },
    ];
    nb = { side: r.side, comes: r.comes, who: neighbours[r.side], state: 'away' };
    nb.job = board.add({ id: 'neighbourParcel', title: `Parcel for ${name}`, event: true, steps: [
      { kind: 'pick', item: 'neighbourParcel', at: [DOOR_SPOT.x, DOOR_SPOT.z], label: "Take the neighbours' parcel" },
      { kind: 'drop', item: 'neighbourParcel', at: HALL_SHELF, place: [HALL_SHELF[0], 0, HALL_SHELF[1]], label: 'Keep it safe in the hall' },
      { kind: 'wait', dur: rand(...cfg.neighbourParcel.keep), label: `Wait till ${name} are home`,
        doneMessage: r.comes ? 'Ding-dong! The neighbours have come for their parcel' : `The neighbours ${side(r.side)} are home` },
      ...later] });
    return nb.job;
  }

  function greet() { hud.toast('Neighbour: "Hello! I think you have a parcel for me?"'); }

  /** The parcel goes into the neighbour's hands; they say thanks and go home. */
  function handOver() {
    const n = nb.who, it = items.neighbourParcel;
    n.root.attach(it); it.position.set(0, 0.68, 0.3); it.rotation.set(0, 0, 0);
    hud.toast('Neighbour: "Thank you so much, that\'s really kind!"');
    nb.state = 'leaving';
    const [dx, dz] = doorway(nb.side);
    n.path = nb.comes ? [[DOOR_SPOT.x, STREET_Z], [dx, STREET_Z], [dx, dz]] : [[dx, dz - 0.25]];
  }

  /** The neighbour walks round from their front door to ours, along the pavement. */
  function comeRound() {
    const n = nb.who, [dx, dz] = doorway(nb.side);
    n.root.position.set(dx, 0, dz); n.root.visible = true;
    n.path = [[dx, STREET_Z], [DOOR_SPOT.x, STREET_Z], [DOOR_SPOT.x, DOOR_SPOT.z]];
    nb.state = 'coming';
  }

  function updateNeighbour(dt) {
    if (!nb) return;
    const n = nb.who, s = board.step(nb.job);
    if (nb.state === 'away' && s && s.kind === 'wait') {
      // set off a few seconds before the wait is over, so they ring just as it ends
      if (nb.comes && s.prog >= s.dur - 6) comeRound();
      else if (!nb.comes && s.prog >= s.dur - 0.1) {
        const [dx, dz] = doorway(nb.side);
        n.root.position.set(dx, 0, dz); n.root.rotation.y = 0; n.root.visible = true; nb.state = 'home';
      }
    }
    let walking = false;
    if (nb.state === 'coming') {
      walking = n.walk(dt);
      if (!walking) { nb.state = 'waiting'; n.root.rotation.y = Math.PI; dingDong(); }
    } else if (nb.state === 'leaving') {
      walking = n.walk(dt);
      if (!walking) { neighbourAway(); return; }
    }
    n.animate(walking, dt, items.neighbourParcel.parent === n.root);
  }

  function update(dt, time) {
    if (S.dayOver) { if (state !== 'gone') sendAway(); if (nb) neighbourAway(); return; }
    if (!S.started || S.mission) return;   // no post or parcels in the middle of a mission
    if (!postDone && time > postAt) {
      postDone = true; items.post.visible = true;
      board.add({ id: 'post', title: 'Empty the letterbox', event: true, steps: [
        { kind: 'pick', item: 'post', at: LETTERBOX, label: 'Take out the post' },
        { kind: 'drop', item: 'post', at: [1.75, 7.6], place: [1.65, 0.76, 7.6], label: 'Put the post on the table' }] });
      hud.toast('The post has arrived');
    }
    if (state === 'gone' && runs.length && time > runs[0].at) {
      if (!S.powerOn) runs[0].at = time + 10;   // don't pile a parcel on top of a power cut
      else arrive(runs.shift());
    }
    updateNeighbour(dt);
    if (state === 'gone') return;

    let walking = false;
    if (state === 'arrive') {
      walking = driver.walk(dt);
      if (!walking) {
        state = 'wait'; S.courierWaiting = true; driver.root.rotation.y = Math.PI;
        deadline = time + (run.item === 'parcel' ? cfg.parcel.waitAtDoor : cfg.neighbourParcel.waitAtDoor); dingDong();
        timeLeft = Math.ceil(deadline - time);
        parcelJob = run.item === 'parcel'
          ? board.add({ id: 'parcel', title: 'Get the parcel from the door', event: true, steps: [
            { kind: 'pick', item: 'parcel', at: [DOOR_SPOT.x, DOOR_SPOT.z], label: 'Take the parcel' },
            { kind: 'drop', item: 'parcel', at: [3.75, 5.9], place: [3.75, 0, 5.9], label: 'Put the parcel in the hall' }] })
          : neighbourJob(run);
      }
    } else if (state === 'wait') {
      timeLeft = Math.max(0, Math.ceil(deadline - time));
      if (S.carrying === run.item) {
        state = 'leave'; S.courierWaiting = false; driver.path = [[VAN_SPOT.x, VAN_SPOT.z]];
        hud.toast(run.item === 'parcel' ? 'Driver: "Thanks, have a nice day!"' : 'Driver: "Thanks for taking it in for them!"');
      } else if (time > deadline && parcelJob.i === 0) {
        state = 'leave'; S.courierWaiting = false; driver.path = [[VAN_SPOT.x, VAN_SPOT.z]];
        driver.root.remove(items[run.item]); items[run.item].visible = false;
        if (run.item === 'neighbourParcel') {
          board.remove('neighbourParcel'); nb = null;
          hud.toast('Too slow! The driver took the parcel to another neighbour');
        } else {
          items.card.visible = true;
          parcelJob.title = 'Missed parcel: get the card'; parcelJob.i = 0;
          parcelJob.steps = [
            { kind: 'pick', item: 'card', at: LETTERBOX, label: 'Take the card' },
            { kind: 'drop', item: 'card', at: [1.75, 7.85], place: [1.6, 0.76, 7.9], label: 'Put the card on the table' }];
          board.refresh();
          hud.toast('Too slow! The driver left a card in the letterbox');
        }
      }
    } else if (state === 'leave') {
      walking = driver.walk(dt);
      if (!walking) sendAway();
    }
    driver.animate(walking, dt, items[run ? run.item : 'parcel'].parent === driver.root);
  }

  return {
    update, reset,
    banner: () => {
      if (S.courierWaiting) return run && run.item === 'neighbourParcel'
        ? `Ding-dong! A parcel for the neighbours · ${timeLeft}s` : `Ding-dong! Parcel at the front door · ${timeLeft}s`;
      if (nb && nb.state === 'waiting') return 'Ding-dong! The neighbours are at the front door';
      return null;
    },
    /** Send a driver with a parcel for the neighbours right now (tests, and trying it out). */
    neighbourParcelNow(time, side, comes) {
      runs = [neighbourRun(time, side, comes)];   // and no other driver today
      if (state !== 'gone') sendAway();
      if (nb) { board.remove('neighbourParcel'); neighbourAway(); }
    },
  };
}

// Post and parcels. Each day may bring the post, a parcel, both or neither (chances in config.js).
// - The post arrives in the letterbox: take it to the dining table.
// - A delivery driver walks up from the van and rings the bell. You have a short time to take the parcel;
//   miss it and a missed-delivery card lands in the letterbox instead.
import * as THREE from 'three';
import { EVENTS } from '../config.js';
import { S, rand } from '../state.js';
import { add, castShadows, group, mat } from '../core/build.js';
import { dingDong } from '../core/audio.js';
import { makeCharacter } from '../characters/character.js';
import { COURIER } from '../characters/family.js';

const VAN_SPOT = new THREE.Vector3(4.6, 0, 13.3);
const DOOR_SPOT = new THREE.Vector3(3.92, 0, 9.85);
const LETTERBOX = [3.02, 9.33];

export function createDeliveries({ stage, items, board, hud }) {
  const cfg = EVENTS;
  const driver = makeCharacter(COURIER);
  driver.root.visible = false; stage.scene.add(driver.root);

  const van = group(6.6, 0, 15.0); van.visible = false;
  add(van, new THREE.BoxGeometry(4.6, 1.6, 1.9), mat('#f4f4f4'), [0, 1.05, 0]);
  add(van, new THREE.BoxGeometry(4.62, 0.18, 1.92), mat('#3b6fb0'), [0, 0.85, 0]);
  add(van, new THREE.BoxGeometry(0.5, 0.6, 1.86), mat('#2a3340'), [-2.1, 1.45, 0]);
  [[-1.5, 0.95], [1.5, 0.95], [-1.5, -0.95], [1.5, -0.95]].forEach(([x, z]) => add(van, new THREE.CylinderGeometry(0.33, 0.33, 0.22, 18), mat('#1a1a1c'), [x, 0.33, z], null, [Math.PI / 2, 0, 0]));
  castShadows(van);

  let postAt = Infinity, parcelAt = Infinity;
  let postDone = false, parcelStarted = false;
  let state = 'gone', phase = 0, deadline = 0, parcelJob = null, timeLeft = 0;

  function sendAway() {
    state = 'gone'; S.courierWaiting = false;
    driver.root.visible = false; van.visible = false;
    if (items.parcel.parent === driver.root) driver.root.remove(items.parcel);
  }

  /** Start of a day: roll today's deliveries. */
  function reset(time) {
    sendAway();
    postDone = parcelStarted = false; parcelJob = null;
    postAt = Math.random() < cfg.post.chancePerDay ? time + rand(...cfg.post.after) : Infinity;
    parcelAt = Math.random() < cfg.parcel.chancePerDay ? time + rand(...cfg.parcel.after) : Infinity;
  }

  function walkTo(target, dt) {
    const p = driver.root.position, dx = target.x - p.x, dz = target.z - p.z, d = Math.hypot(dx, dz);
    if (d < 0.05) return false;
    const step = Math.min(d, 1.6 * dt);
    p.x += dx / d * step; p.z += dz / d * step;
    driver.root.rotation.y = Math.atan2(dx, dz);
    phase += dt * 9;
    return true;
  }

  function animate(walking, dt) {
    const c = driver, k = Math.min(1, dt * 12), sw = walking ? Math.sin(phase) * 0.55 : 0;
    const holding = items.parcel.parent === c.root;
    c.legs[0].rotation.x += (sw - c.legs[0].rotation.x) * k; c.legs[1].rotation.x += (-sw - c.legs[1].rotation.x) * k;
    const a0 = holding ? -1.15 : -sw * 0.8, a1 = holding ? -1.15 : sw * 0.8;
    c.arms[0].rotation.x += (a0 - c.arms[0].rotation.x) * k; c.arms[1].rotation.x += (a1 - c.arms[1].rotation.x) * k;
  }

  function arrive() {
    van.visible = true; driver.root.visible = true; driver.root.position.copy(VAN_SPOT); state = 'arrive';
    items.parcel.visible = true; driver.root.add(items.parcel);
    items.parcel.position.set(0, 0.68, 0.3); items.parcel.rotation.set(0, 0, 0);
  }

  function update(dt, time) {
    if (S.dayOver) { if (state !== 'gone') sendAway(); return; }
    if (!S.started || S.mission) return;   // no post or parcels in the middle of a mission
    if (!postDone && time > postAt) {
      postDone = true; items.post.visible = true;
      board.add({ id: 'post', title: 'Empty the letterbox', event: true, steps: [
        { kind: 'pick', item: 'post', at: LETTERBOX, label: 'Take out the post' },
        { kind: 'drop', item: 'post', at: [1.75, 7.6], place: [1.65, 0.76, 7.6], label: 'Put the post on the table' }] });
      hud.toast('The post has arrived');
    }
    if (!parcelStarted && time > parcelAt) {
      if (!S.powerOn) parcelAt = time + 10;   // don't pile a parcel on top of a power cut
      else { parcelStarted = true; arrive(); }
    }
    if (state === 'gone') return;

    let walking = false;
    if (state === 'arrive') {
      walking = walkTo(DOOR_SPOT, dt);
      if (!walking) {
        state = 'wait'; S.courierWaiting = true; driver.root.rotation.y = Math.PI;
        deadline = time + cfg.parcel.waitAtDoor; dingDong();
        parcelJob = board.add({ id: 'parcel', title: 'Get the parcel from the door', event: true, steps: [
          { kind: 'pick', item: 'parcel', at: [DOOR_SPOT.x, DOOR_SPOT.z], label: 'Take the parcel' },
          { kind: 'drop', item: 'parcel', at: [3.75, 5.9], place: [3.75, 0, 5.9], label: 'Put the parcel in the hall' }] });
      }
    } else if (state === 'wait') {
      timeLeft = Math.max(0, Math.ceil(deadline - time));
      if (S.carrying === 'parcel') {
        state = 'leave'; S.courierWaiting = false;
        hud.toast('Driver: "Thanks, have a nice day!"');
      } else if (time > deadline && parcelJob.i === 0) {
        state = 'leave'; S.courierWaiting = false;
        driver.root.remove(items.parcel); items.parcel.visible = false;
        items.card.visible = true;
        parcelJob.title = 'Missed parcel: get the card'; parcelJob.i = 0;
        parcelJob.steps = [
          { kind: 'pick', item: 'card', at: LETTERBOX, label: 'Take the card' },
          { kind: 'drop', item: 'card', at: [1.75, 7.85], place: [1.6, 0.76, 7.9], label: 'Put the card on the table' }];
        board.refresh();
        hud.toast('Too slow! The driver left a card in the letterbox');
      }
    } else if (state === 'leave') {
      walking = walkTo(VAN_SPOT, dt);
      if (!walking) sendAway();
    }
    animate(walking, dt);
  }

  return {
    update, reset,
    banner: () => S.courierWaiting ? `Ding-dong! Parcel at the front door · ${timeLeft}s` : null,
  };
}

// The household jobs. Each job is a list of steps (see board.js for the step kinds).
// How often a job comes round lives in rules.js.
//
// At the start of each day every job sets up the house:
//   setup(ctx)  the job is on today's list: make it need doing (lawn grown, windows dirty...)
//   tidy(ctx)   the job isn't on today's list, or was already done today: show it done
// Without a tidy, items are simply moved to where the job's drop steps put them.
// Items start each day at their home spot from items.js (the "needs doing" position).
//
// Adding a job: copy one below with a new id, add its rule to rules.js, point its steps at things in the house.
// Pick steps don't need `at` - they use wherever the item currently is.
import { rulesFor } from './rules.js';

export const BIN_PAIRS = [[['binBlue', 'blue'], ['binYellow', 'yellow']], [['binBlack', 'black'], ['binBrown', 'brown']]];
const KERB = [[3.9, 13.05], [4.6, 13.05]];

/**
 * @param binPair  which pair goes out on bin day (0 blue + yellow, 1 black + brown)
 * @param binsBack which pair is waiting at the kerb to come back in (null if none)
 */
export function createJobs({ binPair = 0, binsBack = null } = {}) {
  const [[outA, colA], [outB, colB]] = BIN_PAIRS[binPair];
  const back = binsBack === null ? BIN_PAIRS[binPair] : BIN_PAIRS[binsBack];
  const [[inA, colInA], [inB, colInB]] = back;
  const jobs = [
    // Wohnzimmer
    { id: 'lamp', title: 'Switch on the lamp', steps: [
      { kind: 'use', at: [0.4, 0.35], label: 'Switch on the lamp', onDone: c => { c.S.lampOn = true; c.power.applyLights(); } }],
      tidy: () => {} },
    { id: 'tv', title: 'Watch some TV', steps: [
      { kind: 'sit', at: [2.3, 2.2], seat: [2.3, 0.38, 2.2, Math.PI / 2], dur: 30, screen: 'tv', what: 'Watching TV', label: 'Sit in the chair and watch TV' }] },
    { id: 'game', title: 'Play a video game', steps: [
      { kind: 'pick', item: 'pad', label: 'Grab the controller' },
      { kind: 'sit', at: [0.6, 2.75], seat: [0.55, 0.42, 2.75, Math.PI / 2], dur: 40, screen: 'game', what: 'Gaming', label: 'Sit on the sofa and play' },
      { kind: 'drop', item: 'pad', at: [3.0, 3.4], place: [3.0, 0.5, 3.4], label: 'Put the controller back' }] },
    { id: 'jacket', title: 'Hang up the jacket', steps: [
      { kind: 'pick', item: 'jacket', label: 'Pick up the jacket' },
      { kind: 'drop', item: 'jacket', at: [3.47, 7.95], y: 0.95, rot: Math.PI / 2, label: 'Hang it on the hook' }] },

    // Küche & Esszimmer
    { id: 'cup', title: 'Cup to the kitchen sink', steps: [
      { kind: 'pick', item: 'cup', label: 'Pick up the cup' },
      { kind: 'drop', item: 'cup', at: [5.32, 0.9], y: 0.9, label: 'Put it in the sink' }] },
    { id: 'dishes', title: 'Wash the dishes', steps: [
      { kind: 'pick', item: 'plates', label: 'Collect the plates from the table' },
      { kind: 'drop', item: 'plates', at: [5.32, 0.75], place: [5.33, 0.9, 0.65], label: 'Put them in the sink' },
      { kind: 'sit', stand: true, at: [5.0, 0.95], seat: [4.78, 0, 0.95, Math.PI / 2], dur: 15, what: 'Washing up', label: 'Wash up',
        onDone: c => c.items.plates.position.set(4.82, 0.96, 0.3) }],
      tidy: c => c.items.plates.position.set(4.82, 0.96, 0.3) },
    { id: 'coffee', title: 'Make a coffee', steps: [
      { kind: 'sit', stand: true, power: true, coffee: true, at: [3.95, 0.95], seat: [4.22, 0, 0.95, -Math.PI / 2], dur: 10, what: 'Making coffee', label: 'Make a coffee at the machine',
        onDone: c => { c.items.mug.visible = true; } },
      { kind: 'pick', item: 'mug', label: 'Take the coffee' },
      { kind: 'drop', item: 'mug', at: [1.75, 7.3], place: [1.65, 0.76, 7.3], label: 'Bring it to the dining table' }],
      tidy: () => {} },   // no mug sitting about
    { id: 'shopping', title: 'Put the shopping away', steps: [
      { kind: 'pick', item: 'shopping', label: 'Pick up the shopping bag' },
      { kind: 'drop', item: 'shopping', at: [3.95, 3.4], place: [4.2, 0, 3.05], label: 'Put it down by the fridge' },
      { kind: 'use', at: [3.95, 3.4], label: 'Put the food in the fridge', onDone: c => { c.items.shopping.getObjectByName('food').visible = false; } }],
      tidy: c => { c.items.shopping.visible = false; } },

    // Flur, WC, under the stairs
    { id: 'shoes', title: 'Tidy the shoes', steps: [
      { kind: 'pick', item: 'shoes', label: 'Pick up the trainers' },
      { kind: 'drop', item: 'shoes', at: [3.56, 6.4], place: [3.56, 0.45, 6.3], label: 'Put them on the shoe bench' },
      { kind: 'pick', item: 'skates', label: 'Pick up the roller skates' },
      { kind: 'drop', item: 'skates', at: [3.56, 6.4], place: [3.56, 0.45, 6.55], label: 'Put them on the shoe bench' }] },
    { id: 'hands', title: 'Wash your hands', steps: [
      { kind: 'use', at: [5.48, 7.98], label: 'Wash hands' }] },
    { id: 'hoover', title: 'Hoover downstairs', steps: [
      { kind: 'pick', item: 'hoover', label: 'Get the hoover from under the stairs' },
      { kind: 'hoover' },
      { kind: 'drop', item: 'hoover', at: [4.95, 4.3], place: [4.95, 0, 4.3], label: 'Put the hoover back' }],
      setup: c => c.hoovering.reset(true), tidy: c => c.hoovering.reset(false) },

    // Outside
    { id: 'plant', title: 'Water the plant', steps: [
      { kind: 'pick', item: 'can', label: 'Take the watering can' },
      { kind: 'drop', item: 'can', at: [2.4, -3.85], place: [1.95, 0, -3.95], label: 'Water the plant', onDone: c => c.plant.water() }],
      setup: c => c.plant.reset(false), tidy: c => { c.items.can.position.set(1.95, 0, -3.95); c.plant.reset(true); } },
    { id: 'binsOut', title: `Bin day: ${colA} + ${colB}`, steps: [
      { kind: 'pick', item: outA, label: `Grab the ${colA} bin` },
      { kind: 'drop', item: outA, at: KERB[0], place: [KERB[0][0], 0, KERB[0][1]], rot: Math.PI, label: 'Leave it at the kerb' },
      { kind: 'pick', item: outB, label: `Grab the ${colB} bin` },
      { kind: 'drop', item: outB, at: KERB[1], place: [KERB[1][0], 0, KERB[1][1]], rot: Math.PI, label: 'Leave it at the kerb' }],
      tidy: () => {} },   // bins stay by the house
    { id: 'binsIn', title: `Bins back in: ${colInA} + ${colInB}`, steps: [
      { kind: 'pick', item: inA, label: `Bring the ${colInA} bin back in` },
      { kind: 'drop', item: inA, home: true, label: 'Put it back by the house' },
      { kind: 'pick', item: inB, label: `Bring the ${colInB} bin back in` },
      { kind: 'drop', item: inB, home: true, label: 'Put it back by the house' }],
      setup: c => { c.items[inA].position.set(KERB[0][0], 0, KERB[0][1]); c.items[inB].position.set(KERB[1][0], 0, KERB[1][1]); },
      tidy: () => {} },
    { id: 'car', title: 'Charge the car', steps: [
      { kind: 'pick', item: 'plug', label: 'Take the cable from the wallbox' },
      { kind: 'drop', item: 'plug', at: [2.2, 14.0], place: [2.2, 0.62, 13.97], label: 'Plug it into the car', onDone: c => c.charging.plugIn() },
      { kind: 'charge', dur: 90 },
      { kind: 'pick', item: 'plug', label: 'Unplug the cable', onDone: c => c.charging.unplug() },
      { kind: 'drop', item: 'plug', home: true, label: 'Hang it back on the wallbox' }] },
    { id: 'mow', title: 'Mow the lawn', steps: [
      { kind: 'pick', item: 'mower', label: 'Take the lawn mower' },
      { kind: 'mow' },
      { kind: 'drop', item: 'mower', home: true, label: 'Put the mower back' }],
      setup: c => c.world.lawn.reset(false), tidy: c => c.world.lawn.reset(true) },
    { id: 'washing', title: 'Hang up the washing', steps: [
      { kind: 'pick', item: 'basket', label: 'Pick up the washing basket' },
      { kind: 'drop', item: 'basket', at: [2.4, -5.2], place: [2.95, 0, -5.5], label: 'Open the washing line', onDone: c => c.world.washingLine.open() },
      { kind: 'use', at: [2.4, -5.2], label: 'Hang up the washing', onDone: c => { c.world.washingLine.hang(); c.items.basket.getObjectByName('laundry').visible = false; } }],
      setup: c => c.world.washingLine.reset(),
      tidy: c => { c.world.washingLine.reset(); c.items.basket.getObjectByName('laundry').visible = false; } },
    { id: 'windows', title: 'Wash the terrace windows', steps: [
      { kind: 'pick', item: 'bucket', label: 'Grab the bucket and sponge' },
      { kind: 'use', at: [5.05, -3.0], label: 'Wash this window', onDone: c => { c.world.dirt[2].visible = false; } },
      { kind: 'use', at: [2.5, -3.0], label: 'Wash this window', onDone: c => { c.world.dirt[1].visible = false; } },
      { kind: 'use', at: [0.9, -3.0], label: 'Wash this window', onDone: c => { c.world.dirt[0].visible = false; } },
      { kind: 'drop', item: 'bucket', home: true, label: 'Put the bucket away' }],
      setup: c => c.world.dirt.forEach(d => { d.visible = true; }), tidy: c => c.world.dirt.forEach(d => { d.visible = false; }) },
  ];
  return jobs.map(job => ({ ...rulesFor(job.id), ...job }));
}

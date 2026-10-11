// The household jobs. Each job is a list of steps (see board.js for the step kinds).
// `every` is how often a job comes round, in days; the day planner will use it to pick each day's list.
// Coordinates are plan metres [x, z]; onDone(ctx) runs when the step is completed.
//
// Adding a job: copy one below, give it a new id, and point its steps at things in the house.
// Pick steps don't need `at` - they use wherever the item currently is.

/** Bin day alternates by calendar week: blue + yellow one week, black + brown the next. */
export function binsThisWeek(date = new Date()) {
  const week = Math.floor((date.getTime() / 864e5 + 3) / 7);
  return week % 2 ? [['binBlue', 'blue'], ['binYellow', 'yellow']] : [['binBlack', 'black'], ['binBrown', 'brown']];
}

export function createJobs() {
  const [[binA, colA], [binB, colB]] = binsThisWeek();
  return [
    // Wohnzimmer
    { id: 'lamp', title: 'Switch on the lamp', every: 1, steps: [
      { kind: 'use', at: [0.4, 0.35], label: 'Switch on the lamp', onDone: c => { c.S.lampOn = true; c.power.applyLights(); } }] },
    { id: 'tv', title: 'Watch some TV', every: 1, steps: [
      { kind: 'sit', at: [2.3, 2.2], seat: [2.3, 0.38, 2.2, Math.PI / 2], dur: 30, screen: 'tv', what: 'Watching TV', label: 'Sit in the chair and watch TV' }] },
    { id: 'game', title: 'Play a video game', every: 1, steps: [
      { kind: 'pick', item: 'pad', label: 'Grab the controller' },
      { kind: 'sit', at: [0.6, 2.75], seat: [0.55, 0.42, 2.75, Math.PI / 2], dur: 40, screen: 'game', what: 'Gaming', label: 'Sit on the sofa and play' },
      { kind: 'drop', item: 'pad', at: [3.0, 3.4], place: [3.0, 0.5, 3.4], label: 'Put the controller back' }] },
    { id: 'jacket', title: 'Hang up the jacket', every: 1, steps: [
      { kind: 'pick', item: 'jacket', label: 'Pick up the jacket' },
      { kind: 'drop', item: 'jacket', at: [3.47, 7.95], y: 0.95, rot: Math.PI / 2, label: 'Hang it on the hook' }] },

    // Küche & Esszimmer
    { id: 'cup', title: 'Cup to the kitchen sink', every: 1, steps: [
      { kind: 'pick', item: 'cup', label: 'Pick up the cup' },
      { kind: 'drop', item: 'cup', at: [5.32, 0.9], y: 0.9, label: 'Put it in the sink' }] },
    { id: 'dishes', title: 'Wash the dishes', every: 1, steps: [
      { kind: 'pick', item: 'plates', label: 'Collect the plates from the table' },
      { kind: 'drop', item: 'plates', at: [5.32, 0.75], place: [5.33, 0.9, 0.65], label: 'Put them in the sink' },
      { kind: 'sit', stand: true, at: [5.0, 0.95], seat: [4.78, 0, 0.95, Math.PI / 2], dur: 15, what: 'Washing up', label: 'Wash up',
        onDone: c => c.items.plates.position.set(4.82, 0.96, 0.3) }] },
    { id: 'coffee', title: 'Make a coffee', every: 1, steps: [
      { kind: 'sit', stand: true, power: true, coffee: true, at: [3.95, 0.95], seat: [4.22, 0, 0.95, -Math.PI / 2], dur: 10, what: 'Making coffee', label: 'Make a coffee at the machine',
        onDone: c => { c.items.mug.visible = true; } },
      { kind: 'pick', item: 'mug', label: 'Take the coffee' },
      { kind: 'drop', item: 'mug', at: [1.75, 7.3], place: [1.65, 0.76, 7.3], label: 'Bring it to the dining table' }] },
    { id: 'shopping', title: 'Put the shopping away', every: 3, steps: [
      { kind: 'pick', item: 'shopping', label: 'Pick up the shopping bag' },
      { kind: 'drop', item: 'shopping', at: [3.95, 3.4], place: [4.2, 0, 3.05], label: 'Put it down by the fridge' },
      { kind: 'use', at: [3.95, 3.4], label: 'Put the food in the fridge', onDone: c => { c.items.shopping.getObjectByName('food').visible = false; } }] },

    // Flur, WC, under the stairs
    { id: 'shoes', title: 'Tidy the shoes', every: 1, steps: [
      { kind: 'pick', item: 'shoes', label: 'Pick up the trainers' },
      { kind: 'drop', item: 'shoes', at: [3.56, 6.4], place: [3.56, 0.45, 6.3], label: 'Put them on the shoe bench' },
      { kind: 'pick', item: 'skates', label: 'Pick up the roller skates' },
      { kind: 'drop', item: 'skates', at: [3.56, 6.4], place: [3.56, 0.45, 6.55], label: 'Put them on the shoe bench' }] },
    { id: 'hands', title: 'Wash your hands', every: 1, steps: [
      { kind: 'use', at: [5.48, 7.98], label: 'Wash hands' }] },
    { id: 'hoover', title: 'Hoover downstairs', every: 2, steps: [
      { kind: 'pick', item: 'hoover', label: 'Get the hoover from under the stairs' },
      { kind: 'hoover' },
      { kind: 'drop', item: 'hoover', at: [4.95, 4.3], place: [4.95, 0, 4.3], label: 'Put the hoover back' }] },

    // Outside
    { id: 'plant', title: 'Water the plant', every: 2, steps: [
      { kind: 'pick', item: 'can', label: 'Take the watering can' },
      { kind: 'drop', item: 'can', at: [2.4, -3.85], place: [1.95, 0, -3.95], label: 'Water the plant', onDone: c => c.plant.water() }] },
    { id: 'bins', title: `Bin day: ${colA} + ${colB}`, every: 7, steps: [
      { kind: 'pick', item: binA, label: `Grab the ${colA} bin` },
      { kind: 'drop', item: binA, at: [3.9, 13.05], place: [3.9, 0, 13.05], rot: Math.PI, label: 'Leave it at the kerb' },
      { kind: 'pick', item: binB, label: `Grab the ${colB} bin` },
      { kind: 'drop', item: binB, at: [4.6, 13.05], place: [4.6, 0, 13.05], rot: Math.PI, label: 'Leave it at the kerb' }] },
    { id: 'car', title: 'Charge the car', every: 3, steps: [
      { kind: 'pick', item: 'plug', label: 'Take the cable from the wallbox' },
      { kind: 'drop', item: 'plug', at: [2.2, 14.0], place: [2.2, 0.62, 13.97], label: 'Plug it into the car', onDone: c => c.charging.plugIn() },
      { kind: 'charge', dur: 90 },
      { kind: 'pick', item: 'plug', label: 'Unplug the cable', onDone: c => c.charging.unplug() },
      { kind: 'drop', item: 'plug', at: [4.95, 9.6], place: [4.95, 0.62, 9.45], label: 'Hang it back on the wallbox' }] },
    { id: 'mow', title: 'Mow the lawn', every: 4, steps: [
      { kind: 'pick', item: 'mower', label: 'Take the lawn mower' },
      { kind: 'mow' },
      { kind: 'drop', item: 'mower', at: [3.45, -14.75], place: [3.45, 0, -14.75], rot: Math.PI, label: 'Put the mower back' }] },
    { id: 'washing', title: 'Hang up the washing', every: 2, steps: [
      { kind: 'pick', item: 'basket', label: 'Pick up the washing basket' },
      { kind: 'drop', item: 'basket', at: [2.4, -5.2], place: [2.95, 0, -5.5], label: 'Open the washing line', onDone: c => c.world.washingLine.open() },
      { kind: 'use', at: [2.4, -5.2], label: 'Hang up the washing', onDone: c => { c.world.washingLine.hang(); c.items.basket.getObjectByName('laundry').visible = false; } }] },
    { id: 'windows', title: 'Wash the terrace windows', every: 7, steps: [
      { kind: 'pick', item: 'bucket', label: 'Grab the bucket and sponge' },
      { kind: 'use', at: [5.05, -3.0], label: 'Wash this window', onDone: c => { c.world.dirt[2].visible = false; } },
      { kind: 'use', at: [2.5, -3.0], label: 'Wash this window', onDone: c => { c.world.dirt[1].visible = false; } },
      { kind: 'use', at: [0.9, -3.0], label: 'Wash this window', onDone: c => { c.world.dirt[0].visible = false; } },
      { kind: 'drop', item: 'bucket', at: [5.05, -2.2], place: [5.05, 0, -2.2], label: 'Put the bucket away' }] },
  ];
}

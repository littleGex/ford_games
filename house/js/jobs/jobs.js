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
import { FOOD_DELIVERY } from '../config.js';
import { TERRARIUM } from '../world/upstairs/kinderzimmer.js';
import { HALLOWEEN as HW } from '../world/halloween.js';
import { NEIGHBOUR_HOUSES } from '../world/outside/neighbours.js';

export const BIN_PAIRS = [[['binBlue', 'blue'], ['binYellow', 'yellow']], [['binBlack', 'black'], ['binBrown', 'brown']]];
const KERB = [[3.9, 13.05], [4.6, 13.05]];

// Where each of the kids does their homework: the floor, where to stand, the seat [x, seat height, z, facing].
// P at the desk in her room, Dude at his own desk in the attic.
const KINDERZIMMER_DESK = { level: 1, at: [2.3, 8.05], seat: [2.3, 0.48, 8.05, Math.PI / 2], label: 'Sit at the desk and do your homework' };
const DUDES_DESK = { level: 2, at: [4.62, 2.27], seat: [4.62, 0.45, 2.27, Math.PI / 2], label: 'Sit at your desk and do your homework' };
const HOMEWORK_SPOT = { girl: KINDERZIMMER_DESK, boy: DUDES_DESK };

// Where the loft box is (or goes to) around the house: the floor, the spot on the floor, a name for the list.
// A different one each week; the box goes up into the loft through the hatch in the attic hall.
export const BOX_SPOTS = [
  { level: 0, at: [3.7, 4.35], name: 'the hall' },
  { level: 2, at: [3.95, 3.35], name: "Dude's room" },
  { level: 1, at: [2.55, 4.6], name: 'the bedroom' },
  { level: 0, at: [2.75, 5.0], name: 'the living room' },
  { level: 2, at: [2.4, 4.75], name: 'the office' },
  { level: 1, at: [2.2, 6.2], name: "P's room" },
];
const LOFT_AT = [3.75, 6.75];   // standing under the loft hatch in the attic hall

/**
 * @param binPair  which pair goes out on bin day (0 blue + yellow, 1 black + brown)
 * @param binsBack which pair is waiting at the kerb to come back in (null if none)
 * @param character who is playing ('dad', 'mum', 'girl', 'boy'); some jobs happen somewhere different for each of them
 * @param holiday  'halloween' on 31 October (see holidays.js): adds that day's jobs
 */
export function createJobs({ binPair = 0, binsBack = null, character = 'dad', day = 1, holiday = null } = {}) {
  const grownUp = character === 'dad' || character === 'mum';
  const boxSpot = BOX_SPOTS[Math.floor(day / 7) % BOX_SPOTS.length];
  const showBox = (c, level, x, z) => {
    const box = c.items.box, floor = [c.stage.scene, c.world.upstairs, c.world.attic][level];
    floor.add(box); box.position.set(x, 0, z); box.rotation.set(0, 0.3, 0); box.userData.level = level; box.visible = true;
  };
  const [[outA, colA], [outB, colB]] = BIN_PAIRS[binPair];
  const back = binsBack === null ? BIN_PAIRS[binPair] : BIN_PAIRS[binsBack];
  const [[inA, colInA], [inB, colInB]] = back;
  const jobs = [
    // Wohnzimmer
    { id: 'lamp', title: 'Switch on the lamp', steps: [
      { kind: 'use', at: [0.4, 0.35], label: 'Switch on the lamp', onDone: c => { c.S.lampOn = true; c.power.applyLights(); } }],
      tidy: () => {} },
    { id: 'tv', title: 'Watch some TV', steps: [
      { kind: 'sit', at: [0.6, 2.75], seat: [0.55, 0.42, 2.75, Math.PI / 2], dur: 30, screen: 'tv', what: 'Watching TV', label: 'Sit on the sofa and watch TV' }] },
    { id: 'game', title: 'Play a video game', steps: [
      { kind: 'pick', item: 'pad', label: 'Grab the controller' },
      { kind: 'sit', at: [2.3, 2.2], seat: [2.3, 0.38, 2.2, Math.PI / 2], dur: 40, screen: 'game', what: 'Gaming', label: 'Sit in the chair and play' },
      { kind: 'drop', item: 'pad', at: [3.0, 3.4], place: [3.0, 0.5, 3.4], label: 'Put the controller back' }] },
    { id: 'call', title: 'Call the relatives', steps: [
      { kind: 'sit', at: [0.6, 1.8], seat: [0.55, 0.42, 1.8, Math.PI / 2], dur: 20, what: 'Talking to the relatives', label: 'Sit on the sofa and call the relatives' }] },
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
      { kind: 'sit', stand: true, power: true, fx: 'steam', at: [3.95, 0.95], seat: [4.22, 0, 0.95, -Math.PI / 2], dur: 10, what: 'Making coffee', label: 'Make a coffee at the machine',
        onDone: c => { c.items.mug.visible = true; } },
      { kind: 'pick', item: 'mug', label: 'Take the coffee' },
      { kind: 'drop', item: 'mug', at: [1.75, 7.3], place: [1.65, 0.76, 7.3], label: 'Bring it to the dining table' }],
      tidy: () => {} },   // no mug sitting about
    { id: 'cook', title: 'Cook dinner', steps: [   // Dad and Mum only
      { kind: 'sit', stand: true, power: true, fx: 'pot', at: [5.0, 1.65], seat: [4.78, 0, 1.65, Math.PI / 2], dur: 45, what: 'Cooking', label: 'Cook dinner on the hob',
        onDone: c => { c.items.dinner.visible = true; } },
      { kind: 'pick', item: 'dinner', label: 'Take the pot off the hob' },
      { kind: 'drop', item: 'dinner', at: [1.9, 6.7], place: [1.5, 0.76, 6.7], label: 'Serve dinner at the dining table' }],
      tidy: c => { c.items.dinner.visible = false; } },
    // The food shopping is ordered on the phone and delivered to the door. Mum and Dad check the fridge and
    // order it; for P and Dude it's already ordered, they just answer the door when it comes.
    { id: 'shopping', title: grownUp ? 'Order the food shopping' : 'The food delivery', steps: [
      ...(grownUp ? [
        { kind: 'use', at: [3.95, 3.4], label: "Check what's in the fridge", onDone: c => c.hud.toast('Running low on milk, fruit and veg') },
        { kind: 'pick', item: 'phone', label: 'Pick up your phone' },
        { kind: 'sit', at: [0.6, 3.0], seat: [0.55, 0.42, 3.0, Math.PI / 2], dur: 10, what: 'Ordering the food', label: 'Sit on the sofa and order the food' },
        { kind: 'drop', item: 'phone', home: true, label: 'Put your phone back on the side table' },
      ] : []),
      { kind: 'wait', delivery: 'food', dur: grownUp ? FOOD_DELIVERY.afterOrder : FOOD_DELIVERY.kidsWait, label: 'Wait for the food delivery',
        doneMessage: 'Ding-dong! The food delivery is here' },
      { kind: 'pick', item: 'shopping', at: FOOD_DELIVERY.door, label: 'Answer the door and take the shopping' },
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
      setup: c => c.hoovering.reset(0, true), tidy: c => c.hoovering.reset(0, false) },
    { id: 'hooverUp', title: 'Hoover upstairs', steps: [
      { kind: 'pick', item: 'hoover', label: 'Get the hoover from under the stairs' },
      { kind: 'hoover', level: 1 },
      { kind: 'drop', item: 'hoover', at: [4.95, 4.3], place: [4.95, 0, 4.3], label: 'Put the hoover back' }],
      setup: c => c.hoovering.reset(1, true), tidy: c => c.hoovering.reset(1, false) },
    { id: 'hooverAttic', title: 'Hoover the attic', steps: [
      { kind: 'pick', item: 'hoover', label: 'Get the hoover from under the stairs' },
      { kind: 'hoover', level: 2 },
      { kind: 'drop', item: 'hoover', at: [4.95, 4.3], place: [4.95, 0, 4.3], label: 'Put the hoover back' }],
      setup: c => c.hoovering.reset(2, true), tidy: c => c.hoovering.reset(2, false) },

    // Outside
    { id: 'plant', title: 'Water the plant', steps: [
      { kind: 'pick', item: 'can', label: 'Take the watering can' },
      { kind: 'drop', item: 'can', at: [2.4, -3.85], place: [1.95, 0, -3.95], label: 'Water the plant', onDone: c => c.plant.water() }],
      setup: c => c.plant.reset(false), tidy: c => { c.items.can.position.set(1.95, 0, -3.95); c.plant.reset(true); } },
    // the seasons (only planned in theirs, see rules.js)
    { id: 'rake', title: 'Rake up the leaves', steps: [
      { kind: 'pick', item: 'rake', label: 'Take the rake from by the shed' },
      { kind: 'rake' },
      { kind: 'drop', item: 'rake', home: true, label: 'Put the rake back' },
      { kind: 'pick', item: 'leafBag', label: 'Pick up the bag of leaves' },
      { kind: 'drop', item: 'leafBag', at: [4.3, 9.65], place: [4.85, 0.95, 9.65], label: 'Tip the leaves into the brown bin', onDone: c => { c.items.leafBag.visible = false; } }],
      setup: c => c.sweeping.reset('rake', true), tidy: c => c.sweeping.reset('rake', false) },
    // the shed: trimming the bushes (anyone), fixing a bike and the solar panels (Dad)
    { id: 'trim', title: 'Trim the bushes', steps: [
      { kind: 'pick', item: 'shears', label: 'Get the hedge trimmer from the shed' },
      { kind: 'trim' },
      { kind: 'drop', item: 'shears', home: true, label: 'Put the hedge trimmer back by the shed' },
      { kind: 'pick', item: 'clippingsBag', label: 'Pick up the bag of clippings' },
      { kind: 'drop', item: 'clippingsBag', at: [4.3, 9.65], place: [4.85, 0.95, 9.65], label: 'Tip the clippings into the brown bin', onDone: c => { c.items.clippingsBag.visible = false; } }],
      setup: c => c.trimming.reset(true), tidy: c => c.trimming.reset(false) },
    { id: 'fixBike', title: "Fix P's bike", steps: [
      { kind: 'pick', item: 'bike', label: "Wheel P's bike off the terrace" },
      { kind: 'drop', item: 'bike', at: [0.75, -15.55], place: [0.75, 0, -16.0], rot: Math.PI / 2, label: 'Put it on the stand by your workbench' },
      { kind: 'sit', stand: true, at: [0.85, -15.5], seat: [0.85, 0, -15.6, Math.PI], dur: 18, what: 'Fixing the bike',
        label: 'Fix the puncture and oil the chain', onDone: c => c.hud.toast('New inner tube, chain oiled, brakes checked') },
      { kind: 'pick', item: 'bike', label: 'Take the bike off the stand' },
      { kind: 'drop', item: 'bike', home: true, label: 'Wheel it back to the terrace' }] },
    { id: 'solar', title: 'Check the solar panels', steps: [
      { kind: 'use', at: [5.0, 4.4], label: 'Check the solar reading on the cabinet', onDone: c => c.hud.toast('Not much power today: the panels on the shed need a clean') },
      { kind: 'pick', item: 'panelBrush', label: 'Get the long brush from the shed' },
      { kind: 'wipe', dirt: 3, at: [4.3, -16.2], label: 'Brush the panels on the shed roof in circles' },
      { kind: 'drop', item: 'panelBrush', home: true, label: 'Put the brush back by the shed' }],
      setup: c => { c.world.dirt[3].visible = true; c.world.dirt[3].material.opacity = 1; }, tidy: c => { c.world.dirt[3].visible = false; } },
    { id: 'snow', title: 'Clear the snow off the path', steps: [
      { kind: 'pick', item: 'shovel', label: 'Grab the snow shovel' },
      { kind: 'shovel' },
      { kind: 'drop', item: 'shovel', home: true, label: 'Put the shovel back by the door' }],
      setup: c => c.sweeping.reset('shovel', true), tidy: c => c.sweeping.reset('shovel', false) },
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
      { kind: 'wipe', at: [5.05, -3.0], dirt: 2, label: 'Wipe this window' },
      { kind: 'wipe', at: [2.5, -3.0], dirt: 1, label: 'Wipe this window' },
      { kind: 'wipe', at: [0.9, -3.0], dirt: 0, label: 'Wipe this window' },
      { kind: 'drop', item: 'bucket', home: true, label: 'Put the bucket away' }],
      setup: c => c.world.dirt.slice(0, 3).forEach(d => { d.visible = true; d.material.opacity = 1; }), tidy: c => c.world.dirt.slice(0, 3).forEach(d => { d.visible = false; }) },   // dirt[3] is the solar panels

    // Obergeschoss (level: 1 on everything that happens upstairs; pick steps follow the item)
    { id: 'beds', title: 'Make the beds', steps: [
      { kind: 'use', level: 1, at: [2.35, 1.9], label: 'Make the big bed', onDone: c => c.world.bigBed.make() },
      { kind: 'use', level: 1, at: [1.25, 6.9], label: "Make P's bed", onDone: c => c.world.daybed.make() },
      { kind: 'use', level: 2, at: [1.8, 2.75], label: "Make Dude's bed", onDone: c => c.world.dudeBed.make() }],
      setup: c => { c.world.bigBed.mess(); c.world.daybed.mess(); c.world.dudeBed.mess(); },
      tidy: c => { c.world.bigBed.make(); c.world.daybed.make(); c.world.dudeBed.make(); } },
    { id: 'teeth', title: 'Brush your teeth', steps: [
      { kind: 'sit', stand: true, level: 1, at: [4.6, 7.22], seat: [4.78, 0, 7.22, Math.PI / 2], dur: 10, what: 'Brushing teeth', label: 'Brush your teeth at the basin' }] },
    { id: 'dadWork', title: 'Work at your desk', steps: [   // Dad only, on weekdays (see rules.js): four tasks at his desk in the dressing room
      ...[['mail', 'Read your emails', 'Reading emails'], ['call', 'Join the team video call', 'On a video call'],
          ['doc', 'Write the weekly report', 'Writing the report'], ['code', 'Write some code', 'Writing code']].map(([page, task, what]) =>
        ({ kind: 'sit', level: 1, power: true, glow: 'dadScreen', page, fx: 'dadNotes', at: [3.75, 0.5], seat: [3.74, 0.45, 0.5, -Math.PI / 2], dur: 20, what, label: `Sit at your desk: ${task.toLowerCase()}` }))] },
    { id: 'shave', title: 'Have a shave', steps: [   // Dad only (see rules.js)
      { kind: 'sit', stand: true, level: 1, at: [4.6, 7.22], seat: [4.78, 0, 7.22, Math.PI / 2], dur: 12, what: 'Shaving', label: 'Have a shave at the basin' }] },
    { id: 'homework', title: 'Do your homework', steps: [   // P and Dude only, each at their own spot
      { kind: 'sit', dur: 30, what: 'Doing homework', ...(HOMEWORK_SPOT[character] || KINDERZIMMER_DESK) }] },
    { id: 'shower', title: 'Have a shower', steps: [
      { kind: 'sit', stand: true, level: 1, fx: 'shower', at: [4.7, 7.85], seat: [5.2, 0, 8.5, 0], dur: 15, what: 'Showering', label: 'Have a shower' }] },
    { id: 'towel', title: 'Hang up the towel', steps: [
      { kind: 'pick', item: 'towel', label: 'Pick up the towel' },
      { kind: 'drop', item: 'towel', level: 1, at: [3.65, 7.47], place: [3.43, 0.95, 7.47], rot: Math.PI / 2, label: 'Hang it on the towel radiator' }] },
    { id: 'laundry', title: 'Dirty clothes in the hamper', steps: [
      { kind: 'pick', item: 'dirtyClothes', label: 'Pick up the dirty clothes' },
      { kind: 'drop', item: 'dirtyClothes', level: 1, at: [4.25, 3.55], place: [4.55, 0.62, 3.6], label: 'Put them in the hamper',
        onDone: c => { c.items.dirtyClothes.visible = false; } }],
      tidy: c => { c.items.dirtyClothes.visible = false; } },
    { id: 'toys', title: 'Tidy up your toys', steps: [   // P only (see rules.js)
      { kind: 'pick', item: 'toys', label: 'Pick up the toys' },
      { kind: 'drop', item: 'toys', level: 1, at: [0.8, 8.0], place: [0.8, 0.1, 8.57], label: 'Put them in the toy box' },
      { kind: 'pick', item: 'crayons', label: 'Pick up the crayons' },
      { kind: 'drop', item: 'crayons', level: 1, at: [2.3, 7.6], place: [2.85, 0.73, 7.6], label: 'Put them on the desk' }] },
    // P's bearded dragon (P only, see rules.js): feed it, play with it, clean out its terrarium
    { id: 'feedDragon', title: 'Feed your bearded dragon', steps: [
      { kind: 'pick', item: 'cricketBox', label: 'Get the box of crickets from the windowsill' },
      { kind: 'sit', stand: true, level: 1, at: TERRARIUM.at, seat: [TERRARIUM.at[0], 0, TERRARIUM.at[1], -Math.PI / 2 - 0.4], dur: 8, dragon: 'feed',
        what: 'Feeding the dragon', label: 'Put the crickets and greens in the terrarium', onDone: c => { c.world.crickets.visible = false; } },
      { kind: 'drop', item: 'cricketBox', home: true, label: 'Put the box back on the windowsill' }] },
    { id: 'playDragon', title: 'Play with your bearded dragon', steps: [
      { kind: 'pick', item: 'dragon', level: 1, at: TERRARIUM.at, label: 'Lift the dragon out of the terrarium' },
      { kind: 'sit', level: 1, at: [1.25, 6.9], seat: [0.75, 0.46, 6.9, Math.PI / 2], dur: 15, dragon: 'cuddle',
        what: 'Cuddling the dragon', label: 'Sit on your bed and let it sit on your hand' },
      { kind: 'drop', item: 'dragon', level: 1, at: TERRARIUM.at, place: [TERRARIUM.bask[0], TERRARIUM.floor, TERRARIUM.bask[1]], label: 'Put it back under its lamp' }] },
    { id: 'cleanDragon', title: "Clean out the dragon's terrarium", steps: [
      { kind: 'use', level: 1, at: TERRARIUM.at, label: 'Scoop out the mess', onDone: c => { c.world.dragonMess.visible = false; } },
      { kind: 'pick', item: 'dragonBowl', level: 1, at: TERRARIUM.at, label: 'Take out the water bowl' },
      { kind: 'sit', stand: true, level: 1, at: [4.6, 7.22], seat: [4.78, 0, 7.22, Math.PI / 2], dur: 5, what: 'Rinsing and filling the bowl', label: 'Rinse it and fill it with fresh water at the basin' },
      { kind: 'drop', item: 'dragonBowl', level: 1, at: TERRARIUM.at, place: [1.12, TERRARIUM.floor, 5.86], label: 'Put the water bowl back in' }],
      setup: c => { c.world.dragonMess.visible = true; }, tidy: c => { c.world.dragonMess.visible = false; } },

    // Attic
    { id: 'music', title: 'Practise the keyboard', steps: [   // Dude only (see rules.js)
      { kind: 'sit', level: 2, at: [1.1, 2.12], seat: [1.1, 0.45, 2.12, -Math.PI / 2], dur: 25, what: 'Playing the keyboard', label: 'Sit down and play the keyboard' }] },
    { id: 'clarinet', title: 'Practise the clarinet', steps: [   // Dude only
      { kind: 'pick', item: 'clarinet', label: 'Take your clarinet off its stand' },
      { kind: 'sit', stand: true, level: 2, at: [4.75, 1.38], seat: [4.75, 0, 1.38, Math.PI / 2], dur: 18, fx: 'clarinetNotes', sound: 'clarinet',
        what: 'Playing the clarinet', label: 'Play your clarinet at the music stand' },
      { kind: 'drop', item: 'clarinet', home: true, label: 'Put the clarinet back on its stand' }] },
    { id: 'tidyDude', title: 'Tidy your room', steps: [   // Dude only
      { kind: 'pick', item: 'lego', label: 'Pick up the Lego' },
      { kind: 'drop', item: 'lego', level: 2, at: [2.1, 1.95], place: [2.1, 0.2, 1.47], label: 'Put it in the Lego drawer' },
      { kind: 'pick', item: 'socks', label: 'Pick up the dirty socks' },
      { kind: 'drop', item: 'socks', level: 1, at: [4.25, 3.55], place: [4.5, 0.62, 3.55], label: 'Put them in the laundry hamper', onDone: c => { c.items.socks.visible = false; } }],
      tidy: c => { const l = c.items.lego; c.world.attic.add(l); l.position.set(2.1, 0.2, 1.47); l.userData.level = 2; c.items.socks.visible = false; } },
    { id: 'plants', title: 'Water the plants upstairs', steps: [
      { kind: 'pick', item: 'jug', label: 'Take the little watering can' },
      { kind: 'use', level: 2, at: [1.0, 6.6], label: 'Water the cheese plant' },
      { kind: 'use', level: 2, at: [4.35, 6.4], label: 'Water the plant on the stool' },
      { kind: 'drop', item: 'jug', home: true, label: 'Put the watering can back' }] },
    { id: 'loftUp', title: `Put a box in the loft (from ${boxSpot.name})`, steps: [
      { kind: 'pick', item: 'box', label: 'Pick up the box' },
      { kind: 'drop', item: 'box', level: 2, at: LOFT_AT, place: [LOFT_AT[0], 1.3, LOFT_AT[1]], label: 'Climb the ladder and push the box into the loft',
        onDone: c => { c.items.box.visible = false; } }],
      setup: c => showBox(c, boxSpot.level, boxSpot.at[0], boxSpot.at[1]), tidy: () => {} },
    { id: 'loftDown', title: `Get a box from the loft (to ${boxSpot.name})`, steps: [
      { kind: 'use', level: 2, at: LOFT_AT, label: 'Climb the ladder and get the box down', onDone: c => showBox(c, 2, LOFT_AT[0] - 0.05, LOFT_AT[1] + 0.15) },
      { kind: 'pick', item: 'box', label: 'Pick up the box' },
      { kind: 'drop', item: 'box', level: boxSpot.level, at: boxSpot.at, place: [boxSpot.at[0], 0, boxSpot.at[1]], label: `Put the box down in ${boxSpot.name}` }],
      tidy: () => {} },
    { id: 'work', title: 'Do some work', steps: [   // Mum only
      { kind: 'sit', level: 2, power: true, glow: 'mumScreen', page: 'sheet', fx: 'mumNotes', at: [1.17, 5.22], seat: [1.17, 0.45, 5.22, -Math.PI / 2], dur: 40, what: 'Working', label: 'Sit at the office desk and work' }] },
    { id: 'sofabed', title: 'Make up the sofa bed', steps: [   // Mum only
      { kind: 'use', level: 2, at: [2.0, 6.3], label: 'Fold the sofa bed away', onDone: c => c.world.sofaBed.make() }],
      setup: c => c.world.sofaBed.mess(), tidy: c => c.world.sofaBed.make() },
    { id: 'washer', title: 'Do the washing', steps: [
      { kind: 'sort', level: 1, at: [4.25, 3.55], label: 'Sort the washing by colour' },
      { kind: 'pick', item: 'laundryBag', label: 'Take the darks from the hamper' },
      { kind: 'drop', item: 'laundryBag', level: 1, at: [3.65, 7.95], place: [3.65, 0.3, 8.6], label: 'Load the washing machine',
        onDone: c => { c.items.laundryBag.visible = false; } },
      { kind: 'wait', dur: 45, power: true, spin: 'washerDrum', doneMessage: 'The wash is done! Empty the machine' },
      { kind: 'use', level: 1, at: [3.65, 7.95], label: 'Take the clean washing out',
        onDone: c => { c.items.washBasket.getObjectByName('laundry').visible = true; } },
      { kind: 'pick', item: 'washBasket', label: 'Pick up the basket of wet washing' },
      { kind: 'drop', item: 'washBasket', level: 2, at: [2.0, 6.2], place: [2.05, 0, 7.15], label: 'Take it up to the airer in the office' },
      { kind: 'use', level: 2, at: [2.0, 6.2], label: 'Hang the washing on the airer',
        onDone: c => { c.world.airerClothes.visible = true; c.items.washBasket.getObjectByName('laundry').visible = false; } }],
      setup: c => { c.world.airerClothes.visible = false; c.items.washBasket.getObjectByName('laundry').visible = false; },
      tidy: c => { c.items.laundryBag.visible = false; c.world.airerClothes.visible = false; c.items.washBasket.getObjectByName('laundry').visible = false; } },
    // the day after a wash: fold what dried on the airer and put each pile in the right wardrobe
    { id: 'fold', title: 'Fold the washing and put it away', steps: [
      { kind: 'use', level: 2, at: [2.0, 6.2], label: 'Fold the dry washing', onDone: c => {
        c.world.airerClothes.visible = false;
        ['pileDude', 'pileP', 'pileGrown'].forEach(id => { c.items[id].visible = true; });
      } },
      { kind: 'pick', item: 'pileDude', label: "Pick up Dude's clothes" },
      { kind: 'drop', item: 'pileDude', level: 2, at: [0.35, 2.9], place: [0.35, 0.9, 3.5], label: "Put them in Dude's wardrobe", onDone: c => { c.items.pileDude.visible = false; } },
      { kind: 'pick', item: 'pileP', label: "Pick up P's clothes" },
      { kind: 'drop', item: 'pileP', level: 1, at: [2.3, 6.95], place: [2.9, 0.9, 6.95], label: "Put them in P's wardrobe", onDone: c => { c.items.pileP.visible = false; } },
      { kind: 'pick', item: 'pileGrown', label: "Pick up Mum and Dad's clothes" },
      { kind: 'drop', item: 'pileGrown', level: 1, at: [4.0, 2.0], place: [3.45, 0.9, 2.0], label: 'Put them in the oak wardrobe in the dressing room', onDone: c => { c.items.pileGrown.visible = false; } }],
      setup: c => { c.world.airerClothes.visible = true; }, tidy: () => {} },
  ];
  if (holiday === 'halloween') jobs.push(...halloweenJobs(character, grownUp));
  return jobs.map(job => ({ ...rulesFor(job.id), ...job }));
}

/** Halloween: carve a jack-o'-lantern, decorate the house, and trick or treat (handing out sweets at the
 *  door for Mum and Dad; dressing up and knocking next door for P and Dude). systems/halloween.js does the rest. */
function halloweenJobs(character, grownUp) {
  const t = HW.table, wardrobe = HW.wardrobe[character] || HW.wardrobe.girl, room = HW.room[character] || HW.room.girl;
  return [
    { id: 'pumpkin', title: "Carve a jack-o'-lantern", steps: [
      { kind: 'pick', item: 'pumpkin', label: 'Fetch the pumpkin from the garden' },
      { kind: 'drop', item: 'pumpkin', at: t.at, place: t.place, label: 'Put it on the dining table' },
      { kind: 'sit', stand: true, at: t.at, seat: t.seat, dur: 12, what: 'Scooping out the pumpkin', label: 'Cut the lid off and scoop out the inside',
        onDone: c => c.halloween.scoop() },
      { kind: 'choose', choose: 'face', at: t.at, label: 'Choose a face to carve', message: o => `${o.label}: let's carve it!`,
        onChoose: (id, c) => c.halloween.chooseFace(id) },
      { kind: 'sit', stand: true, at: t.at, seat: t.seat, dur: 15, what: 'Carving the face', label: 'Carve the face', onDone: c => c.halloween.carve() },
      { kind: 'use', at: t.at, label: grownUp ? 'Put a tea light in and light it' : 'Put an LED tea light in and switch it on', onDone: c => c.halloween.light() },
      { kind: 'pick', item: 'pumpkin', label: "Pick up the jack-o'-lantern" },
      { kind: 'drop', item: 'pumpkin', at: HW.step.at, place: HW.step.place, label: 'Put it on the front step' }],
      setup: c => c.halloween.freshPumpkin(), tidy: c => c.halloween.lanternOnStep() },
    { id: 'decorate', title: 'Decorate the house for Halloween', steps: [
      { kind: 'pick', item: 'decoBox', label: 'Get the box of Halloween decorations from the hall' },
      { kind: 'use', at: HW.window, label: "Stick bats and spiders' webs on the dining room window", onDone: c => c.halloween.hang('window') },
      { kind: 'use', at: HW.door, label: 'Put bats and a web up round the front door', onDone: c => c.halloween.hang('door') },
      { kind: 'use', at: HW.ghost, label: 'Hang the ghost up in the hall', onDone: c => c.halloween.hang('ghost') },
      { kind: 'drop', item: 'decoBox', home: true, label: 'Put the empty box back in the hall', onDone: c => { c.items.decoBox.visible = false; } }],
      setup: c => { c.halloween.takeDown(); c.items.decoBox.visible = true; }, tidy: () => {} },
    grownUp
      ? { id: 'trickOrTreat', title: 'Hand out sweets to trick-or-treaters', steps: [
        { kind: 'pick', item: 'sweetsBowl', label: 'Get the bowl of sweets from the kitchen' },
        { kind: 'drop', item: 'sweetsBowl', at: HW.bowlBy.at, place: HW.bowlBy.place, label: 'Put it by the front door' },
        ...[0, 1].flatMap(n => [
          { kind: 'wait', dur: n ? 30 : 35, trick: n, label: 'Wait for the trick-or-treaters', doneMessage: 'Ding-dong! Trick or treat!' },
          { kind: 'use', at: HW.openDoor, label: 'Open the door and give them some sweets', onDone: c => c.halloween.giveSweets() }])],
        setup: c => { c.items.sweetsBowl.visible = true; }, tidy: () => {} }
      : { id: 'trickOrTreat', title: 'Go trick or treating', steps: [
        { kind: 'choose', choose: 'costume', ...wardrobe, label: 'Open your wardrobe and pick a costume', message: o => `${o.label}: spooky!`,
          onChoose: (id, c) => c.halloween.chooseCostume(id) },
        { kind: 'sit', stand: true, ...wardrobe, dur: 8, what: 'Putting on your costume', label: 'Put on your costume', onDone: c => c.halloween.dressUp() },
        { kind: 'pick', item: 'treatPail', label: 'Grab your pumpkin bucket from the porch' },
        { kind: 'use', at: NEIGHBOUR_HOUSES.right.step, label: 'Ring next door (on the right): trick or treat!', onDone: c => c.halloween.knock('right') },
        { kind: 'use', at: NEIGHBOUR_HOUSES.left.step, label: 'Ring next door (on the left): trick or treat!', onDone: c => c.halloween.knock('left') },
        { kind: 'drop', item: 'treatPail', level: room.level, at: room.at, place: room.place, label: `Take your sweets up to ${room.name}` }],
        setup: c => { c.items.treatPail.visible = true; }, tidy: () => {} },
  ];
}

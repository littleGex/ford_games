// The naughty elf's scenes (house data): where in the Ford house he gets up to mischief each night, the mess he
// leaves (props), and the steps to put it right (ordinary job steps; a `use` step that clears a bit of mess
// calls c.elf.clear(i) for props()[i]). systems/elf.js shows one scene a day, picked by elf.js pickScene.
//   id, title(name)   the scene, and what the toast says when you find him (with his name, elf.js elfName)
//   needs             a job group (settings.js JOB_GROUPS) the scene needs switched on, e.g. 'dragon'
//   elf               where he is: at [x, z] (where you stand to find him), place [x, y, z], level, rotY
//   props()           the mess: THREE.Groups in plan coordinates on the elf's floor, built once
//   tidy(c)           the steps to put it right
import * as THREE from 'three';
import { add, mat } from '../core/build.js';
import { TERRARIUM } from '../world/upstairs/kinderzimmer.js';
import { XMAS } from '../world/christmas.js';
import { trailScenes } from '../elf.js';


const group = build => { const g = new THREE.Group(); build(g); return g; };
const box = (g, size, colour, pos, rot) => add(g, new THREE.BoxGeometry(...size), mat(colour), pos, null, rot);
const ball = (g, r, colour, pos) => add(g, new THREE.SphereGeometry(r, 10, 8), mat(colour), pos);
const teddy = (g, colour, [x, y, z]) => { ball(g, 0.07, colour, [x, y + 0.07, z]); ball(g, 0.05, colour, [x, y + 0.18, z]); [-1, 1].forEach(k => ball(g, 0.02, colour, [x + k * 0.035, y + 0.23, z])); };
const looRoll = (g, pos) => {
  add(g, new THREE.CylinderGeometry(0.055, 0.055, 0.1, 14), mat('#fbfbf8'), pos, null, [0, 0, Math.PI / 2]);
  add(g, new THREE.CylinderGeometry(0.02, 0.02, 0.102, 10), mat('#b08a5a'), pos, null, [0, 0, Math.PI / 2]);
};

export const ELF_SCENES = [
  { id: 'looRoll', title: name => `${name} has wrapped the coats in loo roll`,
    hint: ["I can hear giggling in the hall…", "…somewhere by the coats!"],   // where's the elf? (systems/elf.js)
    memory: () => "Remember when I wrapped the coats in loo roll? It took me all night, and I only got tangled up twice!",   // his goodbye note (the elf says goodbye)
    elf: { at: [3.95, 6.35], place: [4.3, 0.11, 6.1], level: 0, rotY: -Math.PI / 2 },   // sitting on the loo roll
    props: () => [
      // paper wound round and round the coats on the rail
      group(g => [0.75, 0.95, 1.15, 1.35].forEach((y, i) => add(g, new THREE.BoxGeometry(0.29, 0.06, 1.2), mat('#fbfbf8'), [3.58, y, 6.0], null, [0, 0, (i % 2 ? 1 : -1) * 0.08]))),
      // the rest of the roll on the floor, unrolled across the hall
      group(g => { looRoll(g, [4.3, 0.055, 6.1]); add(g, new THREE.BoxGeometry(0.6, 0.004, 0.1), mat('#fbfbf8'), [4.0, 0.003, 6.1]); }),
    ],
    tidy: () => [
      { kind: 'use', at: [3.95, 5.9], label: 'Unwind the loo roll from the coats', onDone: c => c.elf.clear(0) },
      { kind: 'use', at: [4.3, 5.7], label: 'Roll up the rest of the loo roll', onDone: c => c.elf.clear(1) }],
  },
  { id: 'biscuitRaid', title: name => `${name} has raided the biscuit tin`,
    hint: ["Crunch, crunch… something's in the kitchen…", "…up on the worktop, by the biscuit tin!"],   // where's the elf? (systems/elf.js)
    memory: () => "Remember my biscuit raid? Sorry about the crumbs. They were very good biscuits.",   // his goodbye note (the elf says goodbye)
    elf: { at: XMAS.counter.at, place: [3.75, 0.9, 2.45], level: 0, rotY: Math.PI / 2 },
    props: () => [
      group(g => { for (let i = 0; i < 14; i++) box(g, [0.025, 0.01, 0.02], '#c98a3d', [3.7 + (i % 5) * 0.05, 0.905, 1.95 + Math.floor(i / 5) * 0.08], [0, i, 0]); }),
      group(g => { add(g, new THREE.CylinderGeometry(0.11, 0.11, 0.1, 18), mat('#b5302f'), [3.75, 0.95, 2.05]); add(g, new THREE.CylinderGeometry(0.115, 0.115, 0.015, 18), mat('#d4a23a'), [3.9, 0.91, 2.25]); }),
    ],
    tidy: () => [
      { kind: 'use', at: XMAS.counter.at, label: 'Wipe the biscuit crumbs off the worktop', onDone: c => c.elf.clear(0) },
      { kind: 'use', at: XMAS.counter.at, label: 'Put the lid back on the biscuit tin', onDone: c => c.elf.clear(1) }],
  },
  { id: 'terrarium', needs: 'dragon', title: name => `${name} has decorated the bearded dragon's terrarium with tinsel`,
    hint: ["Something sparkly is going on upstairs…", "…by the bearded dragon!"],   // where's the elf? (systems/elf.js)
    memory: () => "Remember when I gave the bearded dragon some tinsel? I think he liked looking festive!",   // his goodbye note (the elf says goodbye)
    elf: { at: TERRARIUM.at, place: [2.05, 0, 6.05], level: 1, rotY: -Math.PI / 2 },
    props: () => [
      group(g => [0.62, 0.78, 0.94].forEach((y, i) => box(g, [0.95, 0.03, 0.03], ['#d4af37', '#c0c0c0', '#c62828'][i], [(TERRARIUM.x1 + TERRARIUM.x2) / 2, y, TERRARIUM.z2 + 0.03], [0, 0, (i - 1) * 0.06]))),
    ],
    tidy: () => [
      { kind: 'use', level: 1, at: TERRARIUM.at, label: 'Take the tinsel off the terrarium', onDone: c => c.elf.clear(0) }],
  },
  { id: 'shoeSwap', title: name => `${name} has thrown everyone's shoes round the porch`,
    hint: ["Thump, thump… by the front door…", "…in the porch, with all the shoes!"],   // where's the elf? (systems/elf.js)
    memory: () => "Remember when I threw everyone's shoes round the porch? I still can't find one of mine.",   // his goodbye note (the elf says goodbye)
    elf: { at: [3.9, 7.35], place: [4.15, 0, 8.3], level: 0, rotY: Math.PI },
    props: () => [
      group(g => [[3.6, 7.6, '#1d1f24'], [3.75, 8.4, '#e04848'], [4.2, 7.9, '#48a0e0'], [3.55, 8.15, '#f2d22e'], [4.05, 7.5, '#6cc070']]
        .forEach(([x, z, c], i) => box(g, [0.1, 0.07, 0.25], c, [x, 0.035, z], [0, i * 1.3, 0]))),
    ],
    tidy: () => [
      { kind: 'use', at: [3.9, 7.35], label: 'Pair up the shoes', onDone: c => c.elf.clear(0) },
      { kind: 'use', at: [3.56, 6.4], label: 'Put them back on the shoe bench' }],
  },
  { id: 'zipWire', title: name => `${name} has made a zip wire across the living room`,
    hint: ["Wheee! A tiny voice in the living room…", "…look up high!"],   // where's the elf? (systems/elf.js)
    memory: () => "Remember my zip wire across the living room? Wheee! That was my favourite.",   // his goodbye note (the elf says goodbye)
    elf: { at: [2.3, 2.2], place: [1.7, 1.45, 1.4], level: 0, rotY: Math.PI / 2 },
    props: () => [
      group(g => { box(g, [3.0, 0.008, 0.008], '#e8e2d0', [1.7, 1.72, 1.4]); box(g, [0.02, 0.25, 0.02], '#8a5a2b', [1.7, 1.6, 1.4]); }),
    ],
    tidy: () => [
      { kind: 'use', at: [2.3, 2.2], label: 'Take down the zip wire', onDone: c => c.elf.clear(0) }],
  },
  { id: 'flourAngel', title: name => `${name} has made a snow angel in flour on the dining table`,
    hint: ["A puff of white dust in the dining room…", "…on the dining table!"],   // where's the elf? (systems/elf.js)
    memory: () => "Remember my flour snow angel on the dining table? It was the only snow I could find!",   // his goodbye note (the elf says goodbye)
    elf: { at: XMAS.table.at, place: [1.85, 0.75, 7.05], level: 0, rotY: Math.PI / 2 },
    props: () => [
      group(g => { box(g, [0.55, 0.006, 0.45], '#f7f5ef', [1.85, 0.753, 7.05]); for (let i = 0; i < 6; i++) ball(g, 0.02, '#f7f5ef', [1.5 + i * 0.12, 0.75, 6.75 + (i % 2) * 0.1]); }),
      group(g => { box(g, [0.12, 0.2, 0.08], '#e9d9b0', [2.25, 0.85, 6.6]); box(g, [0.122, 0.05, 0.082], '#3a6ea5', [2.25, 0.83, 6.6]); }),
    ],
    tidy: () => [
      { kind: 'use', at: XMAS.table.at, label: 'Wipe the flour off the table', onDone: c => c.elf.clear(0) },
      { kind: 'use', at: XMAS.counter.at, label: 'Put the flour back in the kitchen', onDone: c => c.elf.clear(1) }],
  },
  { id: 'legoSleigh', title: name => `${name} has built a sleigh out of the Lego`,
    hint: ["Click, clack… bricks up in the attic…", "…by the Lego!"],   // where's the elf? (systems/elf.js)
    memory: () => "Remember my Lego sleigh? I nearly flew it all the way home to the North Pole!",   // his goodbye note (the elf says goodbye)
    elf: { at: [2.1, 1.95], place: [2.75, 0.06, 2.3], level: 2, rotY: 0 },
    props: () => [
      group(g => {
        ['#e04848', '#e04848', '#f2d22e', '#48a0e0', '#e04848', '#6cc070'].forEach((c, i) => box(g, [0.12, 0.05, 0.06], c, [2.68 + (i % 3) * 0.07, 0.025 + Math.floor(i / 3) * 0.05, 2.18 + (i % 2) * 0.24]));
        [-1, 1].forEach(k => box(g, [0.36, 0.02, 0.02], '#f2d22e', [2.72, 0.01, 2.3 + k * 0.13]));   // the runners
      }),
    ],
    tidy: () => [
      { kind: 'use', level: 2, at: [2.1, 1.95], label: 'Take the Lego sleigh apart and put it in the drawer', onDone: c => c.elf.clear(0) }],
  },
  { id: 'cushionFort', title: name => `${name} has built a cushion fort in front of the sofa`,
    hint: ["Someone's been moving the cushions in the living room…", "…in front of the sofa!"],   // where's the elf? (systems/elf.js)
    memory: () => "Remember my cushion fort? It was the cosiest castle I've ever built.",   // his goodbye note (the elf says goodbye)
    elf: { at: [1.6, 2.4], place: [1.15, 0, 2.4], level: 0, rotY: Math.PI / 2 },
    props: () => [
      group(g => [[1.15, 0.1, 2.05, 0], [1.15, 0.1, 2.75, 0], [1.4, 0.1, 2.4, Math.PI / 2], [1.15, 0.32, 2.4, Math.PI / 2]]
        .forEach(([x, y, z, r], i) => box(g, [0.4, 0.2, 0.12], ['#e19a3c', '#4a5568', '#e19a3c', '#4a5568'][i], [x, y, z], [0, r, 0]))),
    ],
    tidy: () => [
      { kind: 'use', at: [1.6, 2.4], label: 'Put the cushions back on the sofa', onDone: c => c.elf.clear(0) }],
  },
  { id: 'sinkFishing', title: name => `${name} has gone fishing in the kitchen sink`,
    hint: ["Splish, splash… from the kitchen…", "…in the sink!"],   // where's the elf? (systems/elf.js)
    memory: () => "Remember when I went fishing in the sink? I caught nine jelly sweets and ate three.",   // his goodbye note (the elf says goodbye)
    elf: { at: [5.32, 0.9], place: [5.0, 0.9, 0.45], level: 0, rotY: Math.PI / 2 },
    props: () => [
      group(g => { add(g, new THREE.CylinderGeometry(0.005, 0.007, 0.45, 6), mat('#8a5a2b'), [5.2, 1.12, 0.5], null, [0, 0, -0.9]); box(g, [0.004, 0.2, 0.004], '#e8e2d0', [5.38, 1.12, 0.5]); }),
      group(g => ['#e04848', '#f2d22e', '#6cc070', '#e04848', '#48a0e0'].forEach((c, i) => box(g, [0.05, 0.015, 0.02], c, [5.25 + (i % 3) * 0.06, 0.86, 0.55 + Math.floor(i / 3) * 0.08], [0, i, 0]))),
    ],
    tidy: () => [
      { kind: 'use', at: [5.32, 0.9], label: 'Fish the jelly sweets out of the sink', onDone: c => c.elf.clear(1) },
      { kind: 'use', at: [5.32, 0.9], label: 'Take away the fishing rod', onDone: c => c.elf.clear(0) }],
  },
  { id: 'marshmallowFight', title: name => `${name} and the teddies have had a marshmallow snowball fight`,
    hint: ["Squeaky giggles upstairs…", "…where the teddies are!"],   // where's the elf? (systems/elf.js)
    memory: () => "Remember my marshmallow snowball fight with the teddies? The teddies won.",   // his goodbye note (the elf says goodbye)
    elf: { at: [2.35, 1.9], place: [1.7, 0.55, 2.6], level: 1, rotY: -Math.PI / 2 },
    props: () => [
      group(g => [['#a0703c', 1.0], ['#d9c3a0', 1.6], ['#7a5230', 2.2]].forEach(([c, z]) => teddy(g, c, [1.0, 0.55, z]))),
      group(g => { for (let i = 0; i < 12; i++) box(g, [0.035, 0.03, 0.035], '#fdf6f0', [1.2 + (i % 4) * 0.25, 0.565, 1.2 + Math.floor(i / 4) * 0.45], [0, i, 0]); }),
    ],
    tidy: () => [
      { kind: 'use', level: 1, at: [2.35, 1.9], label: 'Pick up the marshmallows', onDone: c => c.elf.clear(1) },
      { kind: 'use', level: 1, at: [2.35, 1.9], label: 'Sit the teddies back up', onDone: c => c.elf.clear(0) }],
  },
];

// The elf says goodbye (#158): his first note, tucked beside the Advent calendars, then three notes at mischief they
// found this December (elf.js trailScenes), padded with these spots, in order, when they found fewer.
export const CALENDAR_NOTE = { at: XMAS.calendars, level: 0, place: [2.45, 0, 3.45] };
export const ELF_FAREWELL_SPOTS = [
  { id: 'tree', at: XMAS.tree.at, level: 0, place: [1.0, 0, 1.1], hint: ["Something's rustling in the living room…", '…by the Christmas tree!'],
    memory: () => 'I loved watching the tree lights twinkle every night while you were asleep.' },
  { id: 'windowsill', at: XMAS.windowsill.at, level: 0, place: XMAS.windowsill.place, hint: ['Look for a note in the dining room…', '…on the windowsill!'],
    memory: () => "I loved reading your wish list on the windowsill. I've told Father Christmas all about it!" },
  { id: 'worktop', at: XMAS.counter.at, level: 0, place: [3.75, 0.9, 2.45], hint: ['Something smells of baking in the kitchen…', '…on the worktop!'],
    memory: () => 'I loved the smell of your Christmas baking. Save me a mince pie!' },
];

// Where his note goes at a scene: where he sat, but on the floor when he sat on that morning's props (the loo
// roll, the zip wire, the Lego sleigh), which aren't there on Christmas Eve.
const ON_PROPS = new Set(['looRoll', 'zipWire', 'legoSleigh']);
const notePlace = s => (ON_PROPS.has(s.id) ? [s.elf.place[0], 0, s.elf.place[2]] : s.elf.place);

/** The three stops after the calendar note: the trail's scenes (where he sat that morning), then the spots above,
 *  skipping any spot already used, so always three different places. ids: the scenes found, oldest first. */
export function trailStops(ids) {
  const stops = trailScenes(ids).map(id => ELF_SCENES.find(s => s.id === id)).filter(Boolean)
    .map(s => ({ id: s.id, at: s.elf.at, level: s.elf.level, place: notePlace(s), hint: s.hint, memory: s.memory }));
  for (const sp of ELF_FAREWELL_SPOTS) {
    if (stops.length >= 3) break;
    if (!stops.some(x => x.at[0] === sp.at[0] && x.at[1] === sp.at[1] && x.level === sp.level)) stops.push(sp);
  }
  return stops;
}

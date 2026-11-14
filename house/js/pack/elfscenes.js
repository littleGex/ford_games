// The naughty elf's scenes (house data): where in the Ford house he gets up to mischief each night, the mess he
// leaves (props), and the steps to put it right (ordinary job steps; a `use` step that clears a bit of mess
// calls c.elf.clear(i) for props()[i]). systems/elf.js shows one scene a day, picked by elf.js pickScene.
//   id, title         the scene, and what the toast says when you find him
//   needs             a job group (settings.js JOB_GROUPS) the scene needs switched on, e.g. 'dragon'
//   elf               where he is: at [x, z] (where you stand to find him), place [x, y, z], level, rotY
//   props()           the mess: THREE.Groups in plan coordinates on the elf's floor, built once
//   tidy(c)           the steps to put it right
import * as THREE from 'three';
import { add, mat } from '../core/build.js';

/** The elf's name (our own elf; the family can rename him one day). */
export const ELF_NAME = 'Pip';

const group = build => { const g = new THREE.Group(); build(g); return g; };
const looRoll = (g, pos) => {
  add(g, new THREE.CylinderGeometry(0.055, 0.055, 0.1, 14), mat('#fbfbf8'), pos, null, [0, 0, Math.PI / 2]);
  add(g, new THREE.CylinderGeometry(0.02, 0.02, 0.102, 10), mat('#b08a5a'), pos, null, [0, 0, Math.PI / 2]);
};

export const ELF_SCENES = [
  { id: 'looRoll', title: `${ELF_NAME} has wrapped the coats in loo roll`,
    elf: { at: [3.95, 6.35], place: [3.55, 0.45, 6.4], level: 0, rotY: Math.PI / 2 },
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
];

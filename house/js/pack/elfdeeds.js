// The elf's report to Father Christmas (#160, missions.js elfReport): the good deeds he can ask for. Each go deals
// five (dealDeeds), right for the child playing and the house: a deed may be for one child only (`who`), need a
// job group switched on (`needs`, settings.js), or be done for a grown-up (`person`: Mum if she's in the family,
// otherwise Dad). Steps use the same spots as the everyday jobs in jobs/jobs.js; `kid` is missions.js KIDS[who].
import { nameOf } from '../names.js';
import { TERRARIUM } from '../world/upstairs/kinderzimmer.js';
import { XMAS } from '../world/christmas.js';

const FRIDGE = [3.95, 3.4];

export const ELF_DEEDS = [
  { id: 'bed', label: () => 'Make your bed',
    setup: (c, who, kid) => c.world[kid.bedHandle].mess(),
    steps: (who, kid) => [{ kind: 'use', level: kid.level, at: kid.bed, label: 'Make your bed', onDone: c => c.world[kid.bedHandle].make() }] },
  { id: 'teeth', label: () => 'Brush your teeth',
    steps: () => [{ kind: 'sit', stand: true, level: 1, at: [4.6, 7.22], seat: [4.78, 0, 7.22, Math.PI / 2], dur: 10, what: 'Brushing teeth', label: 'Brush your teeth at the basin' }] },
  { id: 'laundry', label: () => 'Put the dirty clothes in the hamper',
    steps: () => [
      { kind: 'pick', item: 'dirtyClothes', label: 'Pick up the dirty clothes' },
      { kind: 'drop', item: 'dirtyClothes', level: 1, at: [4.25, 3.55], place: [4.55, 0.62, 3.6], label: 'Put them in the hamper', onDone: c => { c.items.dirtyClothes.visible = false; } }] },
  { id: 'shoes', label: () => 'Tidy the shoes in the porch',
    steps: () => [
      { kind: 'pick', item: 'shoes', label: 'Pick up the trainers' },
      { kind: 'drop', item: 'shoes', at: [3.56, 6.4], place: [3.56, 0.45, 6.3], label: 'Put them on the shoe bench' },
      { kind: 'pick', item: 'skates', label: 'Pick up the roller skates' },
      { kind: 'drop', item: 'skates', at: [3.56, 6.4], place: [3.56, 0.45, 6.55], label: 'Put them on the shoe bench' }] },
  { id: 'plants', label: () => 'Water the plants upstairs',
    steps: () => [
      { kind: 'pick', item: 'jug', label: 'Take the little watering can' },
      { kind: 'use', level: 2, at: [1.0, 6.6], label: 'Water the cheese plant' },
      { kind: 'use', level: 2, at: [4.35, 6.4], label: 'Water the plant on the stool' },
      { kind: 'drop', item: 'jug', home: true, label: 'Put the watering can back' }] },
  { id: 'coats', label: () => 'Hang up the coats',
    steps: () => [
      { kind: 'pick', item: 'jacket', label: 'Pick up the jacket' },
      { kind: 'drop', item: 'jacket', at: [3.47, 7.95], y: 0.95, rot: Math.PI / 2, label: 'Hang it on the hook' }] },
  { id: 'table', label: () => 'Lay the dining table',
    steps: () => [
      { kind: 'use', at: XMAS.table.at, label: 'Put out the plates' },
      { kind: 'use', at: [1.75, 7.3], label: 'Put out the knives and forks' }] },
  { id: 'tea', person: 'grownUp', label: (who, p = 'mum') => `Make ${nameOf(p)} a cup of tea`,
    steps: (who, kid, p = 'mum') => [
      { kind: 'sit', stand: true, power: true, fx: 'steam', at: [3.95, 0.95], seat: [4.22, 0, 0.95, -Math.PI / 2], dur: 8, what: 'Making tea', label: `Make ${nameOf(p)} a cup of tea`,
        onDone: c => { c.items.mug.visible = true; } },
      { kind: 'pick', item: 'mug', label: 'Take the tea' },
      { kind: 'drop', item: 'mug', at: [1.75, 7.3], place: [1.65, 0.76, 7.3], label: `Take it to the dining table for ${nameOf(p)}` }] },
  { id: 'drawing', person: 'grownUp', label: (who, p = 'mum') => `Draw a picture for ${nameOf(p)}`,
    steps: (who, kid, p = 'mum') => [
      { kind: 'use', level: kid.level, at: kid.desk, label: `Draw a picture for ${nameOf(p)} at your desk` },
      { kind: 'use', at: FRIDGE, label: `Stick it on the fridge for ${nameOf(p)}` }] },
  { id: 'toys', who: ['girl'], label: () => 'Tidy up your toys',
    steps: () => [
      { kind: 'pick', item: 'toys', label: 'Pick up the toys' },
      { kind: 'drop', item: 'toys', level: 1, at: [0.8, 8.0], place: [0.8, 0.1, 8.57], label: 'Put them in the toy box' },
      { kind: 'pick', item: 'crayons', label: 'Pick up the crayons' },
      { kind: 'drop', item: 'crayons', level: 1, at: [2.3, 7.6], place: [2.85, 0.73, 7.6], label: 'Put them on the desk' }] },
  { id: 'dragon', who: ['girl'], needs: 'dragon', label: () => 'Feed your bearded dragon',
    steps: () => [
      { kind: 'pick', item: 'cricketBox', label: 'Get the box of crickets from the windowsill' },
      { kind: 'sit', stand: true, level: 1, at: TERRARIUM.at, seat: [TERRARIUM.at[0], 0, TERRARIUM.at[1], -Math.PI / 2 - 0.4], dur: 8, dragon: 'feed',
        what: 'Feeding the dragon', label: 'Put the crickets and greens in the terrarium', onDone: c => { c.world.crickets.visible = false; } },
      { kind: 'drop', item: 'cricketBox', home: true, label: 'Put the box back on the windowsill' }] },
  { id: 'lego', who: ['boy'], label: () => 'Tidy up your Lego',
    steps: () => [
      { kind: 'pick', item: 'lego', label: 'Pick up the Lego' },
      { kind: 'drop', item: 'lego', level: 2, at: [2.1, 1.95], place: [2.1, 0.2, 1.47], label: 'Put it in the Lego drawer' }] },
];

/** Five different deeds for this child and this house (Math.random by default; tests pass their own rand). A deed
 *  for a grown-up is for Mum if she's in the family, otherwise Dad; its label and steps are filled in for them. */
export function dealDeeds(who, { isOn = () => true, inFamily = () => true, rand = Math.random } = {}) {
  const person = inFamily('mum') ? 'mum' : 'dad';
  const pool = ELF_DEEDS.filter(d => (!d.who || d.who.includes(who)) && (!d.needs || isOn(d.needs)) && (!d.person || inFamily(person)));
  const hand = [];
  while (hand.length < 5 && pool.length) hand.push(pool.splice(Math.floor(rand() * pool.length), 1)[0]);
  return hand.map(d => d.person ? { ...d, label: w => d.label(w, person), steps: (w, kid) => d.steps(w, kid, person) } : d);
}

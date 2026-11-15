// Catch the elf (#159, missions.js elfCatch): where he creeps to in the evening, just him, no mess. `at` is where
// you stand to spot him (a `use` step), `place` where he sits (on the floor beside things, so he's never inside
// furniture). Plain data, no three.js, so tests/house/elf.mjs can load it in Node.
const FLOOR = ['downstairs', 'upstairs', 'up in the attic'];
const spot = (id, level, at, place, room, by) => ({ id, level, at, place, room, where: `${room}, ${by}`, hint: `A giggle ${FLOOR[level]}… ${room}, ${by}?` });

export const EVENING_SPOTS = [
  spot('sofa', 0, [1.1, 1.8], [0.75, 0, 1.45], 'in the living room', 'by the sofa'),
  spot('diningTable', 0, [1.75, 7.3], [1.65, 0, 7.0], 'in the dining room', 'under the table'),
  spot('shoeBench', 0, [3.56, 6.4], [3.3, 0, 6.55], 'in the porch', 'by the shoe bench'),
  spot('fridge', 0, [3.95, 3.4], [3.75, 0, 3.6], 'in the kitchen', 'by the fridge'),
  spot('coats', 0, [3.47, 7.95], [3.3, 0, 8.15], 'in the hall', 'under the coats'),
  spot('basin', 1, [4.6, 7.22], [4.4, 0, 7.45], 'in the bathroom', 'by the basin'),
  spot('bigBed', 1, [2.35, 1.9], [2.1, 0, 2.2], "in the big bedroom", 'by the bed'),
  spot('toyBox', 1, [0.8, 8.0], [1.05, 0, 8.3], "in P's room", 'by the toy box'),
  spot('desk', 1, [2.3, 7.6], [2.55, 0, 7.85], "in P's room", 'under the desk'),
  spot('hamper', 1, [4.25, 3.55], [4.3, 0, 3.3], 'by the washing basket', 'next to the dirty socks'),
  spot('legoDrawer', 2, [2.1, 1.95], [2.4, 0, 1.6], "in Dude's room", 'by the Lego drawer'),
  spot('cheesePlant', 2, [1.0, 6.6], [0.8, 0, 6.85], 'in the attic', 'behind the big plant'),
  spot('stool', 2, [4.35, 6.4], [4.1, 0, 6.6], 'in the attic', 'by the plant on the stool'),
];

/** The next place he hops to: never `prev`, never an excluded id; another floor about one hop in three. */
export function nextSpot(prev, { exclude = [], rand = Math.random } = {}) {
  const ok = EVENING_SPOTS.filter(s => !exclude.includes(s.id) && (!prev || s.id !== prev.id));
  if (!prev) return ok[Math.floor(rand() * ok.length)];
  const move = rand() < 1 / 3;
  const pick = ok.filter(s => (s.level !== prev.level) === move);
  const from = pick.length ? pick : ok;
  return from[Math.floor(rand() * from.length)];
}

/** Spots within a metre of a place on a level (tomorrow's mischief: keep away from it tonight). */
export function spotsNear(place, level, spots = EVENING_SPOTS) {
  return spots.filter(s => s.level === level && Math.hypot(s.place[0] - place[0], s.place[2] - place[2]) <= 1).map(s => s.id);
}

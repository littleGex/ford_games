// House pack: places in the Ford house that more than one job or system uses, so they live in one spot.
//
// Like the kids' rooms (kidrooms.js) and the work desks (workdesks.js): the engine (jobs, missions, the elf,
// bedtime) asks "where is the fridge?" and the pack answers. Plain data, no three.js, so Node tests can load it.
//   level   the floor: 0 ground, 1 first floor, 2 attic
//   at      [x, z] where you stand to use it
//   seat    [x, y, z, facing] where a figure stands or sits while using it (where there is one)
export const SPOTS = {
  bigBed: { level: 1, at: [2.35, 1.9] },
  coffeeMachine: { level: 0, at: [3.95, 0.95], seat: [4.22, 0, 0.95, -Math.PI / 2] },
  fridge: { level: 0, at: [3.95, 3.4] },
  dressingWardrobe: { level: 1, at: [4.0, 2.0], seat: [4.0, 0, 2.0, -Math.PI / 2] },
  shower: { level: 1, at: [4.7, 7.85], seat: [5.2, 0, 8.5, 0] },
  kitchenSink: { level: 0, at: [5.0, 0.95] },
};

/** A shared place by name; throws on a name that isn't in SPOTS. */
export function spot(name) {
  const s = SPOTS[name];
  if (!s) throw new Error(`pack/spots.js: no spot called '${name}'`);
  return s;
}

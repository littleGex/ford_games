// House pack: the two children's bedrooms in the Ford house, and who sleeps in which.
//
// This is the first piece of Ford house content gathered in one place for the engine split (see
// house/ARCHITECTURE.md): the engine (jobs, missions, bedtime...) asks "where is this child's bed / wardrobe /
// desk?" and the pack answers from whichever room the child sleeps in. P and Dude can swap rooms (the jobs and
// sharing card, settings.js); their bed, wardrobe and desk follow them. Things that live in a room (the
// bearded dragon's terrarium, P's toys, Dude's Lego, keyboard and clarinet) stay where they are.
//
// Coordinates are plan coordinates [x, z] on the room's floor (level 1: first floor, 2: attic); seats are
// [x, seat height, z, facing]; places are where an item goes [x, y, z].
export const KID_ROOMS = {
  // The room on the first floor: the daybed, the white wardrobe by the door, the desk under the window
  first: {
    level: 1,
    bed: { at: [1.25, 6.9], handle: 'daybed', story: [1.25, 6.9] },
    bedtime: { at: [1.25, 7.2], lie: [0.575, 0.5, 6.2, Math.PI], ipad: { at: [1.25, 6.9], seat: [0.55, 0.46, 7.0, Math.PI / 2] },
               glass: [1.05, 0, 7.75], switch: [2.9, 6.6] },
    wardrobe: { at: [2.3, 6.95], seat: [2.3, 0, 6.95, Math.PI / 2], clothes: [2.9, 0.9, 6.95], pyjamas: [2.88, 0.9, 6.95] },
    desk: { at: [2.3, 8.05], seat: [2.3, 0.48, 8.05, Math.PI / 2], place: [2.95, 0.73, 8.0], model: [2.95, 0.72, 8.3], bag: [2.85, 0.73, 7.9] },
    start: { at: [1.4, 7.6], facing: -Math.PI / 2 },   // waking up (the school run)
  },
  // The attic room: the bed under the eaves, the wardrobe on the gable wall, the desk by the dormer
  attic: {
    level: 2,
    bed: { at: [1.8, 2.75], handle: 'dudeBed' },
    bedtime: { at: [1.8, 2.75], lie: [2.55, 0.52, 3.35, Math.PI / 2], ipad: { at: [1.8, 2.75], seat: [1.8, 0.48, 3.3, 0] },
               glass: [2.85, 0, 3.6], switch: [3.9, 3.4] },
    wardrobe: { at: [0.35, 2.9], seat: [0.35, 0, 2.9, 0], clothes: [0.35, 0.9, 3.5], pyjamas: [0.35, 0.9, 3.45] },
    desk: { at: [4.62, 2.27], seat: [4.62, 0.45, 2.27, Math.PI / 2], place: [5.25, 0.76, 2.1], model: [5.25, 0.76, 2.45], bag: [5.3, 0.76, 2.0] },
    start: { at: [1.8, 2.45], facing: Math.PI },
  },
};
export const KIDS = ['girl', 'boy'];
export const USUAL_ROOM = { girl: 'first', boy: 'attic' };

let swapped = () => false;

/** settings.js tells us whether P and Dude have swapped rooms. */
export function useRoomSwap(fn) { swapped = fn; }

/** Which room a child sleeps in: 'first' or 'attic'. */
export const roomOf = kid => (swapped() ? (USUAL_ROOM[kid] === 'first' ? 'attic' : 'first') : USUAL_ROOM[kid] || 'first');

/** Who sleeps in a room. */
export const kidIn = room => KIDS.find(k => roomOf(k) === room);

/** A child's room, with everything in it (bed, wardrobe, desk...). Anyone else gets the first-floor room. */
export const roomFor = kid => KID_ROOMS[roomOf(kid)];

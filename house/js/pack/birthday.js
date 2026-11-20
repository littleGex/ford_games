// House pack: where a birthday happens in the Ford house (systems/birthday.js puts it up, jobs.js runs the jobs).
//
// Like the elf's evening spots (elfspots.js): the engine asks "where's the cake go, where do the balloons and
// banner hang?" and the pack answers. Plain data, no three.js, so Node tests can load it.
// Plan coordinates [x, z] (ground floor); seats [x, y, z, facing]; places where a thing goes [x, y, z].
import { spot } from './spots.js';

export const BD = {
  table: { at: [2.5, 7.0], seat: [2.5, 0, 6.95, -Math.PI / 2], cake: [1.45, 0.75, 6.85] },   // standing at the dining table
  sofa: { at: [0.6, 3.0], seat: [0.55, 0.42, 3.0, Math.PI / 2] },                              // blowing up balloons
  banner: [0.45, 5.85],                                                                        // by the grey wall in the dining room
  presents: [[1.2, 0.75, 7.55], [1.65, 0.75, 7.75], [1.3, 0.75, 7.95], [1.7, 0.75, 7.3]],     // on the table (the fourth: Grandma and Grandpa's)
  door: spot('frontDoor').at,
};

// The decorations: where each bunch of balloons is tied down (by the sofa and in the dining-room corners), and
// the banner on the grey wall of the dining room, above the posters [x, y, z]
export const BALLOON_SPOTS = [[0.3, 0.35], [0.28, 8.55], [3.0, 8.55], [3.0, 0.4]];
export const BANNER_AT = [0.045, 1.25, 7.1];

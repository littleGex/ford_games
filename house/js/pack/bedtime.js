// House pack: where bedtime happens in the Ford house (systems/bedtime.js runs it, missions.js tells the story).
//
// Like the elf's evening spots (elfspots.js): the engine asks "where's the basin, where can pyjamas be lost,
// where does a child hide?" and the pack answers. Each child's own bed, iPad spot, light switch and wardrobe are
// in the room they sleep in (kidrooms.js roomFor()); the first-floor room's daybed and wardrobe here are its
// places, whoever sleeps there now (kidIn('first')). Plain data, no three.js, so Node tests can load it.
// Plan coordinates [x, z]; spots where a child stands, sits or lies [x, y, z, facing]; level 0 ground, 1 first, 2 attic.
import { LEVEL_HEIGHT } from '../config.js';
import { KID_ROOMS } from './kidrooms.js';
import { spot } from './spots.js';

const first = KID_ROOMS.first;

export const BEDTIME_PLACES = {
  sofa: { girl: { level: 0, at: [1.1, 1.8], seat: [0.55, 0.42, 1.8, Math.PI / 2] },
          boy: { level: 0, at: [1.1, 2.75], seat: [0.55, 0.42, 2.75, Math.PI / 2] } },
  bathDoor: [3.875, 6.55],                                                // on the landing, outside the bathroom
  shower: { at: spot('shower').at, spot: spot('shower').seat },
  basin: { at: [4.6, 7.22], spot: [4.78, 0, 7.22, Math.PI / 2] },
  bathroom: [4.3, 7.45],                                                  // where you hand over the pyjamas
  story: { at: first.bed.story, seat: [0.75, 0.46, 6.9, Math.PI / 2],     // on the edge of the first-floor room's daybed
           kids: { girl: [0.5, 0.46, 7.45, Math.PI / 2], boy: [0.5, 0.46, 6.35, Math.PI / 2] } },
  dance: { level: 1, spot: [3.95, 0, 5.45, 0] },                          // the landing
  terrarium: [2.3, 6.35],
};

// Where pyjamas that can't be found might be, and where a child might hide (all on the first floor). `room`
// marks the first-floor room's own places, named for whoever sleeps there (systems/bedtime.js).
export const SEARCH_PLACES = {
  pyjamas: { hamper: { at: [4.25, 3.55], place: [4.5, 0.62, 3.6] }, bedEnd: { at: [1.25, 6.4], place: [0.6, 0.47, 6.3] },
             bigBed: { at: spot('bigBed').at, place: [2.0, 0.55, 1.9] } },
  hide: { wardrobe: first.wardrobe.at, shower: spot('shower').at, curtains: [2.35, 1.0], underBed: first.bed.at },
};

// The lights that come on in the evening: where they hang (world position)
export const BEDTIME_LIGHTS = {
  hall: [3.8, 2.05, 5.6],
  stairs: [4.45, 0.35, 6.3],              // the little night light by the stairs
  landing: [3.95, LEVEL_HEIGHT + 2.05, 5.2],
  bathroom: [4.6, LEVEL_HEIGHT + 2.05, 7.6],
  girl: [1.6, LEVEL_HEIGHT + 2.05, 7.0],
  boy: [2.0, 2 * LEVEL_HEIGHT + 1.9, 2.8],
};

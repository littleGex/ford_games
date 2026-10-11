// Tunable numbers for the whole game, in one place.
// Distances are metres, times are seconds. The house is laid out from the 1:100 plan:
// x runs from the gable wall (0) to the party wall (5.64), z from the terrace (0) to the street side (8.88).

export const WALL_HEIGHT = 1.4;          // walls are cut at this height (dollhouse view)
export const PLAYER_RADIUS = 0.22;
export const WALK_SPEED = 2.3;
export const REACH = 1.0;                // how close you must be to use something
export const BOUNDS = { x1: -2.25, x2: 5.5, z1: -17.3, z2: 13.4 };

export const CAMERA = { distance: 5.2, height: 7.2, lookY: 0.4, fovLandscape: 45, fovPortrait: 60 };

export const COLORS = {
  sky: '#1c2a40',
  skyPowerCut: '#05080f',
  marker: '#ffb02e',
};

export const EVENTS = {
  power:  { firstAfter: [50, 80], gapAfter: [150, 240], maxPerGame: 3 },
  post:   { after: [25, 40] },
  parcel: { after: [95, 125], waitAtDoor: 45 },
};

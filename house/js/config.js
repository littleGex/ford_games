// Tunable numbers for the whole game, in one place.
// Distances are metres, times are seconds. The house is laid out from the 1:100 plan:
// x runs from the gable wall (0) to the party wall (5.64), z from the terrace (0) to the street side (8.88).

export const WALL_HEIGHT = 1.4;          // walls are cut at this height (dollhouse view)
export const PLAYER_RADIUS = 0.22;
export const WALK_SPEED = 2.3;
export const REACH = 1.0;                // how close you must be to use something
export const BOUNDS = [
  { x1: -2.25, x2: 5.5, z1: -17.3, z2: 13.4 },   // Erdgeschoss and the gardens
  { x1: 0, x2: 5.64, z1: 0, z2: 8.88 },          // Obergeschoss (inside the house)
  { x1: 0, x2: 5.64, z1: 1.1, z2: 7.78 },        // Dachgeschoss (between the knee walls)
];
// Each floor is drawn this far above the one below. Not to scale: walls are cut at
// WALL_HEIGHT anyway, this just keeps the upstairs clear of the downstairs furniture.
export const LEVEL_HEIGHT = 2.3;
export const FLOOR_NAMES = ['Erdgeschoss', 'Obergeschoss', 'Dachgeschoss'];

export const CAMERA = { distance: 5.2, height: 7.2, lookY: 0.4, fovLandscape: 45, fovPortrait: 60 };

export const COLORS = {
  sky: '#1c2a40',
  skyPowerCut: '#05080f',
  marker: '#ffb02e',
};

// Surprise events. Times are seconds after the day starts; chancePerDay is how likely the event is on a day.
export const EVENTS = {
  power:  { chancePerDay: 0.35, firstAfter: [50, 120], gapAfter: [150, 240], maxPerDay: 1 },
  post:   { chancePerDay: 0.7, after: [25, 60] },
  parcel: { chancePerDay: 0.5, after: [95, 160], waitAtDoor: 45 },
};

export const DAY_COMPLETE_DELAY = 1.5;   // seconds between the last job and the "Day complete" screen

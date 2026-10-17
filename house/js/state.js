// Shared, mutable game state. Systems read and write these fields directly.
export const S = {
  started: false,        // becomes true on the first stick / key input
  wiping: null,          // wiping a window: { job, step, ... } (systems/wiping.js)
  sorting: false,
  laptop: false,   // the laptop close-up is open (3D printing)
  calendar: false,        // the Advent calendars are open up close (ui/advent.js)
  mission: null,          // a mission in progress: { id, who, clock, t, done } (missions/missions.js)
  menuOpen: true,         // the home screen is open (ui/home.js); the game is paused        // the sort-the-washing card is open (ui/sorting.js)
  level: 0,              // which floor the player is on: 0 Erdgeschoss, 1 Obergeschoss, 2 Dachgeschoss
  carrying: null,        // key into items, or null
  sitting: null,         // { job, step, seatY, back:[x,z] } while sitting / standing at a timed job
  powerOn: true,
  lampOn: false,         // the living-room lamp has been switched on (it still needs power to glow)
  courierWaiting: false,
  dayOver: false,        // the day's jobs are all done and the "Day complete" screen is up // the driver is at the door; the parcel banner owns the alert line
  reduceMotion: typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches,
};

export const rand = (a, b) => a + Math.random() * (b - a);

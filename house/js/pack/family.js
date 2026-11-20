// House pack: the Ford family's defaults, gathered in one place for the engine split (house/ARCHITECTURE.md,
// slice 4). Who the four players are before anyone changes anything: their names, how they're talked about, who's
// a grown-up, how they look and their life stage; and the family's pets, hobbies and chores (the job groups that
// can be switched off and the chores whose doer can be changed, in the rooms, jobs and sharing card).
//
// The engine keeps the logic: names.js (nameOf, cleanName...), players.js (what's saved on this device) and
// settings.js (the share link and its checks, usualDoers) import from here and re-export, so older importers
// keep working.
//
// Import loop: names.js imports DEFAULT_NAMES from here, and the labels below call possessive() and nameOf()
// from names.js. That's fine as long as those labels stay lazy getters: nothing may read them while the modules
// are still loading.
import { nameOf, possessive } from '../names.js';

export const DEFAULT_NAMES = { dad: 'Dad', mum: 'Mum', girl: 'P', boy: 'Dude' };
export const DEFAULT_PRONOUNS = { dad: 'he', mum: 'she', girl: 'she', boy: 'he' };
export const GROWN_UPS = ['dad', 'mum'];

// how the family looks by default (the figures are built from a look in characters/looks.js)
export const DEFAULT_LOOKS = {
  dad: { skin: '#d8a382', hair: 'bald', hairColor: '#2a1f18', top: 'own', pants: '#202329', shoes: '#16171b', glasses: false, beard: true },   // bald with a dark beard
  mum: { skin: '#f1d1ba', hair: 'shoulder', hairColor: '#e2c27c', top: 'own', pants: '#4a6a9c', shoes: '#f2f2f2', glasses: false, beard: false },
  girl: { skin: '#f1d1ba', hair: 'long', hairColor: '#9b7452', top: 'own', pants: '#1c1e25', shoes: '#f2eef2', glasses: false, beard: false },
  boy: { skin: '#f5d6c1', hair: 'swept', hairColor: '#7a5434', top: 'own', pants: '#2d3037', shoes: '#3a3d45', glasses: false, beard: false },
};
export const DEFAULT_STAGE = { dad: 'adult', mum: 'adult', girl: 'child', boy: 'child' };

// The jobs that can be switched off, in groups as they'd be thought of
export const JOB_GROUPS = [
  { id: 'dragon', icon: '🦎', get label() { return `${possessive('girl')} bearded dragon`; }, jobs: ['feedDragon', 'playDragon', 'cleanDragon'] },
  { id: 'keyboard', icon: '🎹', label: 'Keyboard practice', jobs: ['music'] },
  { id: 'clarinet', icon: '🎵', get label() { return `${possessive('boy')} clarinet`; }, jobs: ['clarinet'] },
  { id: 'bike', icon: '🚲', get label() { return `Fixing ${possessive('girl')} bike`; }, jobs: ['fixBike'] },
  { id: 'solar', icon: '☀️', label: 'Solar panels on the shed', jobs: ['solar'] },
  { id: 'car', icon: '🔌', label: 'Charging the electric car', jobs: ['car'] },
  { id: 'shave', icon: '🪒', get label() { return `${nameOf('dad')} shaving`; }, jobs: ['shave'] },
  { id: 'loft', icon: '📦', label: 'Boxes up and down the loft', jobs: ['loftUp', 'loftDown'] },
  { id: 'halloween', icon: '🎃', label: 'Halloween', tags: ['halloween'] },
  { id: 'christmas', icon: '🎄', label: 'Christmas and the Advent calendars',
    tags: ['advent', 'adventDoor', 'elf', 'christmas', 'christmasTime', 'beforeChristmas', 'christmasEve', 'christmasEnd'] },
  { id: 'birthdays', icon: '🎂', label: 'Birthday parties', birthdays: true },
];

// The household chores whose doer can be changed ("who does what"): usually as in rules.js (`who`)
export const CHORES = [
  { id: 'cook', icon: '🍲', label: 'Cooking dinner', jobs: ['cook'] },
  { id: 'bike', icon: '🚲', get label() { return `Fixing ${possessive('girl')} bike`; }, jobs: ['fixBike'] },
  { id: 'solar', icon: '☀️', label: 'The solar panels', jobs: ['solar'] },
  { id: 'sofabed', icon: '🛋️', label: 'Making up the sofa bed', jobs: ['sofabed'] },
  { id: 'dragon', icon: '🦎', get label() { return `${possessive('girl')} bearded dragon`; }, jobs: ['feedDragon', 'playDragon', 'cleanDragon'] },
];

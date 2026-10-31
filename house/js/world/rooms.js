import { genitive, possessive } from '../names.js';
import { kidIn } from '../pack/kidrooms.js';

// Named areas for the room chip in the corner. Areas (m²) are the figures printed on the floor plan.
// Order matters: the first rectangle that contains the player wins.
export const ROOMS = [
  // Dachgeschoss
  { level: 2, get name() { return `${genitive(kidIn('attic'))} Zimmer`; }, area: '15,00 m²', r: [0, 0, 5.64, 3.94] },   // (whoever sleeps there)
  { level: 2, name: 'Büro', area: '9,83 m²', r: [0, 3.94, 3.02, 8.88] },
  { level: 2, name: 'Flur', area: 'ca. 3,17 m²', r: [3.02, 3.94, 5.64, 8.88] },
  // Obergeschoss
  { level: 1, name: 'Elternzimmer', area: '16,90 m²', r: [0, 0, 3.2, 5.6] },
  { level: 1, name: 'Ankleide', area: '10,24 m²', r: [3.2, 0, 5.64, 3.95] },
  { level: 1, get name() { return `${possessive(kidIn('first'))} room`; }, area: '10,64 m²', r: [0, 5.65, 3.26, 8.88] },
  { level: 1, name: 'Bad', area: '4,63 m²', r: [3.32, 6.9, 5.64, 8.88] },
  { level: 1, name: 'Flur', area: '3,17 m²', r: [3.2, 3.95, 5.64, 6.9] },
  // Erdgeschoss and outside
  { name: 'Wohnzimmer', area: '18,53 m²', r: [0, 0, 3.265, 5.56] },
  { name: 'Esszimmer', area: '10,64 m²', r: [0, 5.56, 3.265, 8.88] },
  { name: 'Küche', area: '8,78 m²', r: [3.38, 0, 5.64, 3.885] },
  { name: 'Abstellraum', area: '1,00 m²', r: [4.68, 4.0, 5.64, 5.0] },
  { name: 'Flur', area: '3,93 m²', r: [3.38, 3.885, 5.64, 6.76] },
  { name: 'Windfang', area: '2,00 m²', r: [3.38, 6.76, 4.45, 8.88] },
  { name: 'WC', area: '2,16 m²', r: [4.565, 6.76, 5.64, 8.88] },
  { name: 'Terrasse', area: 'under the glass roof', r: [-0.3, -3.42, 5.76, -0.375] },
  { name: 'Garten', area: 'back garden', r: [-0.4, -17.5, 5.76, -3.42] },
  { name: 'Vorgarten', area: 'front garden', r: [-2.5, 9.255, 5.76, 12.6] },
  { name: 'Gehweg', area: 'by the street', r: [-6.2, 12.6, 11.6, 13.7] },
  { name: 'Nachbarn', area: 'next door, on the right', r: [5.76, 9.3, 11.6, 12.6] },
  { name: 'Nachbarn', area: 'next door, on the left', r: [-6.2, 9.3, -2.5, 12.6] },
];
// Dad's office (world/office.js, from x 40)
const O = 40;
ROOMS.push(
  { name: 'Großraumbüro', area: 'open-plan office', r: [O, 0, O + 6.2, 6.0] },
  { name: 'Chefbüro', area: "the boss's office", r: [O, 6.5, O + 2.25, 9.75] },
  { name: 'Besprechungsraum', area: 'meeting room', r: [O, 9.85, O + 2.25, 13.7] },
  { name: 'Flur', area: 'office corridor', r: [O + 2.25, 6.0, O + 2.95, 13.7] },
  { get name() { return `${genitive('dad')} Büro`; }, get area() { return `${possessive('dad')} office`; }, r: [O + 3.05, 6.05, O + 6.2, 9.6] },
  { name: 'Teeküche', area: 'office kitchen', r: [O + 3.05, 9.7, O + 6.2, 12.1] },
  { name: 'WC', area: 'office bathroom', r: [O + 3.05, 12.2, O + 6.2, 13.7] },
  { name: 'Büro', area: 'outside the office', r: [O - 14, -8, O + 15.2, 22] },
);
// P's school, the lesson floor (world/school.js, from x 140)
const SC = 140;
ROOMS.push(
  { name: 'Klassenzimmer', get area() { return `${possessive('girl')} classroom`; }, r: [SC, 0, SC + 8.75, 6.75] },
  { name: 'Klassenzimmer', area: 'a classroom', r: [SC + 8.9, 0, SC + 26.5, 6.75] },
  { name: 'Gruppenraum', area: 'the group room', r: [SC, 6.9, SC + 6.95, 13.3] },
  { name: 'Leseraum', area: 'the reading room', r: [SC + 9.25, 16.9, SC + 13.15, 20] },
  { name: 'Klassenzimmer', area: 'the bench circle', r: [SC, 13.45, SC + 13.15, 20] },
  { name: 'Klassenzimmer', area: 'a classroom', r: [SC + 13.3, 13.45, SC + 26.5, 20] },
  { name: 'WC Jungen', area: "boys' toilets", r: [SC + 19.1, 6.9, SC + 26.4, 8.65] },
  { name: 'WC Mädchen', area: "girls' toilets", r: [SC + 19.1, 8.8, SC + 23.8, 11.5] },
  { name: 'Abstellraum', area: 'store room', r: [SC + 23.9, 8.8, SC + 25.6, 11.5] },
  { name: 'Putzraum', area: 'cleaning cupboard', r: [SC + 25.7, 8.8, SC + 27.6, 11.5] },
  { name: 'Förderraum', area: 'support room: shoes off!', r: [SC + 27.7, 7.4, SC + 30.8, 10.7] },
  { name: 'Treppenhaus', area: 'the stairs', r: [SC + 26.5, 10.85, SC + 30.8, 17.0] },
  { name: 'Flur', area: 'to the stairs', r: [SC + 19.0, 11.65, SC + 26.5, 13.3] },
  { name: 'Halle', get area() { return `${possessive('girl')} school`; }, r: [SC + 7.1, 6.9, SC + 19.0, 13.3] },
  { name: 'Schule', get area() { return `${possessive('girl')} school`; }, r: [SC - 3, -3, SC + 34, 23] },
);
ROOMS.filter(r => r.r[0] >= SC - 3).forEach(r => { r.floor = 'Obergeschoss'; });   // the lesson floor is upstairs
// Mum's office site (world/mumoffice.js, from x 80): the ground floor and outside, and her office floor upstairs
const MO = 80;
ROOMS.push(
  { level: 1, name: 'Besprechungsraum', get area() { return `${possessive('mum')} office`; }, r: [MO + 18, 18.9, MO + 23.7, 21.6] },
  { level: 1, name: 'WC', get area() { return `${possessive('mum')} office`; }, r: [MO + 23.8, 19.9, MO + 26.5, 21.6] },
  { level: 1, name: 'Aufzüge', area: 'lifts and stairs', r: [MO + 26.6, 14.85, MO + 30, 21.6] },
  { level: 1, name: 'Teeküche', get area() { return `${possessive('mum')} office`; }, r: [MO + 22.0, 12.4, MO + 23.7, 16.2] },
  { level: 1, name: 'Büro', area: 'second office', r: [MO + 25.7, 4.6, MO + 30, 14.75] },
  { level: 1, name: 'Großraumbüro', get area() { return `${possessive('mum')} desk is here`; }, r: [MO + 18, 4.6, MO + 25.6, 18.8] },
  { name: 'Café', area: 'on the site', r: [MO + 1.5, 8.7, MO + 7.8, 13.0] },
  { name: 'Eingangshalle', get area() { return `${possessive('mum')} office building`; }, r: [MO + 18, 4.6, MO + 30, 21.6] },
  { name: 'Drehkreuz', area: 'security turnstiles', r: [MO + 11.8, 3.0, MO + 19.8, 4.9] },
  { name: 'Garten', area: 'garden on the site', r: [MO + 8, 9.0, MO + 13, 14.5] },
  { name: 'Parkplatz', area: 'car park', r: [MO + 7.5, -7.5, MO + 26.6, -1.2] },
  { name: 'Straße', area: 'the road', r: [MO - 12, 0.4, MO + 42, 3.1] },
  { name: 'Bürogelände', get area() { return `${possessive('mum')} office site`; }, r: [MO - 12, -12, MO + 42, 26] },
);
const OUTSIDE = { name: 'Garten', area: 'outside', level: 0 };

/**
 * The room at (x, z). Doorways sit in the walls between rooms, which belong to no room: standing in one
 * (say the terrace door) keeps the room you came from, as long as you're within half a metre of it.
 */
export function roomAt(x, z, level = 0, previous = null) {
  const inside = ({ r, ...room }) => (room.level || 0) === level && x >= r[0] && x <= r[2] && z >= r[1] && z <= r[3];
  const found = ROOMS.find(inside);
  if (found) return found;
  if (previous && previous.r && (previous.level || 0) === level) {
    const [x1, z1, x2, z2] = previous.r, dx = Math.max(x1 - x, 0, x - x2), dz = Math.max(z1 - z, 0, z - z2);
    if (Math.hypot(dx, dz) <= 0.5) return previous;
  }
  return OUTSIDE;
}

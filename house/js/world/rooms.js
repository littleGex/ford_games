// Named areas for the room chip in the corner. Areas (m²) are the figures printed on the floor plan.
// Order matters: the first rectangle that contains the player wins.
export const ROOMS = [
  // Dachgeschoss
  { level: 2, name: 'Dudes Zimmer', area: '15,00 m²', r: [0, 0, 5.64, 3.94] },
  { level: 2, name: 'Büro', area: '9,83 m²', r: [0, 3.94, 3.02, 8.88] },
  { level: 2, name: 'Flur', area: 'ca. 3,17 m²', r: [3.02, 3.94, 5.64, 8.88] },
  // Obergeschoss
  { level: 1, name: 'Elternzimmer', area: '16,90 m²', r: [0, 0, 3.2, 5.6] },
  { level: 1, name: 'Ankleide', area: '10,24 m²', r: [3.2, 0, 5.64, 3.95] },
  { level: 1, name: "P's room", area: '10,64 m²', r: [0, 5.65, 3.26, 8.88] },
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
  { name: 'Dads Büro', area: "Dad's office", r: [O + 3.05, 6.05, O + 6.2, 9.6] },
  { name: 'Teeküche', area: 'office kitchen', r: [O + 3.05, 9.7, O + 6.2, 12.1] },
  { name: 'WC', area: 'office bathroom', r: [O + 3.05, 12.2, O + 6.2, 13.7] },
  { name: 'Büro', area: 'outside the office', r: [O - 14, -8, O + 15.2, 22] },
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

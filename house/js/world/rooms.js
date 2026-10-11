// Named areas for the room chip in the corner. Areas (m²) are the figures printed on the floor plan.
// Order matters: the first rectangle that contains the player wins.
export const ROOMS = [
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
  { name: 'Gehweg', area: 'by the street', r: [-2.5, 12.6, 5.76, 13.7] },
];
const OUTSIDE = { name: 'Garten', area: 'outside' };

export function roomAt(x, z) {
  return ROOMS.find(({ r }) => x >= r[0] && x <= r[2] && z >= r[1] && z <= r[3]) || OUTSIDE;
}

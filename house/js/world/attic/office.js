// Office (Büro, left under the roof): desk with a laptop and two monitors against the gable wall, a huge
// cheese plant in the corner by the radiator, a low bookshelf under the Velux, a pine shelf against the teal
// wall, a grey sofa along the hall wall and a clothes airer full of washing in the middle.
import { box, ball, cyl, fbox, mat, solid } from '../../core/build.js';

export function buildOffice() {
  // desk against the gable wall
  box(0.05, 4.5, 0.82, 5.95, 0.04, 0.72, mat('#efe9df'));
  [4.55, 5.9].forEach(z => box(0.35, z - 0.03, 0.42, z + 0.03, 0.72, 0, mat('#f2f2f2'), false));
  solid(0.05, 4.5, 0.82, 5.95);
  box(0.12, 5.1, 0.17, 5.75, 0.38, 0.86, mat('#1d1e22'), false);      // big monitor
  box(0.12, 5.78, 0.17, 5.93, 0.36, 0.86, mat('#1d1e22'), false);     // second monitor
  box(0.2, 5.38, 0.26, 5.46, 0.12, 0.76, mat('#2a2b30'), false);
  box(0.12, 4.6, 0.36, 4.98, 0.08, 0.76, mat('#c9ccd1'), false);      // laptop on its stand
  box(0.14, 4.62, 0.16, 4.96, 0.22, 0.84, mat('#2a2b30'), false);
  box(0.45, 5.25, 0.62, 5.7, 0.02, 0.76, mat('#1d1e22'), false);      // keyboard
  ['#ffffff', '#f2a1b8', '#f2d22e', '#9fd0f0'].forEach((c, i) => box(0.4 + i * 0.05, 4.65 + i * 0.07, 0.6 + i * 0.05, 4.85 + i * 0.07, 0.006, 0.76 + i * 0.004, mat(c), false));
  // grey office chair
  box(0.95, 5.0, 1.4, 5.45, 0.07, 0.45, mat('#8f9398'));
  box(1.33, 5.0, 1.4, 5.45, 0.75, 0.5, mat('#8f9398'), false);
  cyl(1.17, 5.22, 0.03, 0.45, '#e8e8e8');
  solid(0.95, 5.0, 1.4, 5.45);

  // radiator on the gable wall and the big cheese plant in the corner in front of it
  box(0.0, 6.0, 0.08, 6.95, 0.55, 0.15, mat('#efe9d8'), false);
  cyl(0.48, 7.05, 0.22, 0.38, '#8f9396', 0, true);
  cyl(0.48, 7.05, 0.03, 1.3, '#6b5a3c', 0.38);                          // moss pole
  [[0.3, 0.9, 6.8, 0.32], [0.75, 1.05, 6.85, 0.3], [0.45, 1.3, 7.25, 0.34], [0.85, 1.35, 6.6, 0.28], [0.25, 1.15, 7.35, 0.26], [0.6, 0.75, 7.3, 0.25]]
    .forEach(([x, y, z, r], i) => ball(x, y, z, r, i % 2 ? '#2f6b34' : '#3d7d3b', [1, 0.25, 1]));
  cyl(1.05, 7.15, 0.13, 0.22, '#9a9ea3', 0, true);                      // smaller pots
  ball(1.05, 0.4, 7.15, 0.2, '#4b8a46', [1, 0.6, 1]);

  // low white bookshelf in front of the knee wall, under the Velux
  fbox(0.05, 7.45, 1.8, 7.78, 0.85, '#f4f4f2');
  ['#2c3b5c', '#c9c2b4', '#1d1e22', '#7a8a9a', '#a33', '#2c3b5c', '#d8cfb8', '#3d5a78'].forEach((c, i) =>
    box(0.1 + i * 0.2, 7.47, 0.26 + i * 0.2, 7.5, 0.3, 0.1 + (i % 2) * 0.4, mat(c), false));

  // pine shelf against the teal wall, with the copper floor lamp and paint pots
  fbox(1.6, 4.02, 2.7, 4.4, 1.2, '#d9b77e');
  [0.4, 0.8].forEach(y => box(1.62, 4.38, 2.68, 4.41, 0.02, y, mat('#c9a66e'), false));
  ['#3a5d9a', '#e8e8e8', '#1d1e22', '#c03a2a'].forEach((c, i) => box(1.7 + i * 0.24, 4.38, 1.9 + i * 0.24, 4.41, 0.3, 0.05 + (i % 2) * 0.42, mat(c), false));
  cyl(1.85, 4.2, 0.18, 0.04, '#b87333', 1.2);                           // lamp shade
  cyl(2.45, 4.22, 0.08, 0.22, '#f2f2f2', 1.2);

  // grey sofa along the hall wall
  const grey = '#a7abb0';
  fbox(2.25, 5.35, 2.95, 7.2, 0.42, grey);
  box(2.78, 5.35, 2.95, 7.2, 0.8, 0, mat(grey), false);
  box(2.25, 5.35, 2.95, 5.5, 0.6, 0, mat(grey), false);
  box(2.25, 7.05, 2.95, 7.2, 0.6, 0, mat(grey), false);

  // clothes airer full of washing in the middle of the room
  const white = mat('#f2f2f2'), blue = mat('#2a3fa0');
  [5.7, 6.7].forEach(z => box(0.95, z - 0.02, 1.75, z + 0.02, 0.04, 0.85, blue, false));
  for (let x = 0.98; x < 1.75; x += 0.07) box(x, 5.7, x + 0.008, 6.7, 0.008, 0.88, white, false);
  [[0.95, 5.7], [1.75, 5.7], [0.95, 6.7], [1.75, 6.7]].forEach(([x, z]) => box(x - 0.01, z - 0.01, x + 0.01, z + 0.01, 0.85, 0, white, false));
  ['#1d1e22', '#c03a2a', '#8a9aa8', '#f08a3a', '#1d1e22', '#7fb0c4', '#2a2b30', '#c03a2a', '#5a5f66', '#1d1e22'].forEach((c, i) =>
    box(1.0 + i * 0.07, 5.75, 1.05 + i * 0.07, 6.65, 0.35 + (i % 3) * 0.1, 0.88 - 0.35 - (i % 3) * 0.1, mat(c), false));
  solid(0.95, 5.7, 1.75, 6.7);
  return {};
}

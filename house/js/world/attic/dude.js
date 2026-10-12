// Dude's room (the big back room under the roof): grey day bed against the blue wall with a white wardrobe
// in the corner, a keyboard on an X-stand in front of the radiator on the gable wall, a standing desk full of
// figures against the party wall, storage boxes and toy crates by the knee-wall cupboards.
import * as THREE from 'three';
import { WALL_HEIGHT as WH } from '../../config.js';
import { box, cyl, fbox, mat, solid } from '../../core/build.js';
import { makeBed } from '../upstairs/elternzimmer.js';
import { musicNotes } from '../upstairs/ankleide.js';
import { canvasTex } from '../../core/textures.js';

// white duvet with navy brush swirls
const swirls = canvasTex(g => {
  g.fillStyle = '#eef1f5'; g.fillRect(0, 0, 128, 128);
  g.strokeStyle = '#2c3b5c'; g.lineWidth = 7; g.lineCap = 'round';
  for (let i = 0; i < 9; i++) { const x = (i * 47) % 128, y = (i * 29) % 128; g.beginPath(); g.arc(x, y, 12 + (i % 3) * 4, 0.3, 2.6); g.stroke(); }
}, 128);

export function buildDudesZimmer() {
  // white wardrobe in the corner, and the day bed along the blue wall
  fbox(0.05, 3.25, 0.65, 3.87, WH - 0.02, '#f4f4f2');
  box(0.6, 3.3, 0.65, 3.85, 0.012, 0.5, mat('#d7d9db'), false);
  const grey = '#7d8087';
  fbox(0.7, 2.95, 2.75, 3.87, 0.38, grey);
  box(0.7, 3.72, 2.75, 3.87, 0.8, 0, mat(grey));               // back against the wall
  box(0.7, 2.95, 0.86, 3.87, 0.66, 0, mat(grey));               // arm at the wardrobe end
  box(0.86, 2.98, 2.72, 3.72, 0.1, 0.38, mat('#f2f2f2'), false); // mattress
  const dudeBed = makeBed(0.86, 2.98, 2.72, 3.72, 0.48, new THREE.MeshStandardMaterial({ map: swirls, roughness: 0.9 }));   // duvet, white with navy swirls
  box(0.9, 3.25, 1.35, 3.68, 0.12, 0.48, mat('#e4e8ef'), false);  // pillows
  box(0.95, 3.5, 1.45, 3.7, 0.16, 0.5, mat('#3a4766'), false);

  // keyboard on an X-stand with its stool, in front of the radiator
  box(0.0, 1.5, 0.08, 2.7, 0.55, 0.15, mat('#efe9d8'), false);
  [1.75, 2.45].forEach(z => {
    box(0.48, z - 0.015, 0.52, z + 0.015, 0.75, 0.02, mat('#1d1e22'), false);
    box(0.3, z - 0.015, 0.7, z + 0.015, 0.03, 0.02, mat('#1d1e22'), false);
  });
  box(0.33, 1.6, 0.68, 2.6, 0.07, 0.75, mat('#1d1e22'));
  box(0.5, 1.63, 0.66, 2.57, 0.012, 0.82, mat('#f4f4f4'), false);   // keys
  box(0.33, 1.85, 0.4, 2.35, 0.2, 0.82, mat('#2a2b30'), false);     // music rest
  solid(0.3, 1.6, 0.7, 2.6);
  fbox(0.95, 1.95, 1.25, 2.3, 0.45, '#1d1e22');                     // stool

  // standing desk against the party wall with his figures and trophies, black office chair
  box(4.95, 1.55, 5.62, 2.95, 0.04, 0.72, mat('#c69a62'));
  [1.6, 2.9].forEach(z => box(5.25, z - 0.03, 5.32, z + 0.03, 0.72, 0, mat('#f2f2f2'), false));
  solid(4.95, 1.55, 5.62, 2.95);
  ['#e04848', '#f2c84a', '#48a0e0', '#6cc070', '#d0a050', '#9a5ad0', '#f08a3a', '#c0c4c8', '#e04848', '#d8b040'].forEach((c, i) =>
    box(5.15 + (i % 3) * 0.13, 1.7 + i * 0.12, 5.23 + (i % 3) * 0.13, 1.78 + i * 0.12, 0.1 + (i % 4) * 0.04, 0.76, mat(c), false));
  box(4.4, 2.05, 4.85, 2.5, 0.07, 0.45, mat('#1d1e22'));
  box(4.38, 2.05, 4.45, 2.5, 0.7, 0.5, mat('#1d1e22'), false);
  cyl(4.62, 2.27, 0.03, 0.45, '#2a2b30');
  solid(4.38, 2.05, 4.85, 2.5);
  // tall stack of storage boxes next to the desk
  fbox(5.15, 3.0, 5.62, 3.55, 0.55, '#e3e7ea');
  fbox(5.15, 3.0, 5.62, 3.55, 0.45, '#f2f2f2', false, 0.55);
  fbox(5.15, 3.0, 5.62, 3.55, 0.3, '#c49a62', false, 1.0);

  // toy clutter by the knee-wall cupboards: storage box with a blue bag, mint crate, wooden drawer of Lego
  fbox(2.55, 1.25, 3.35, 1.85, 0.55, '#e3e7ea');
  box(2.6, 1.3, 3.1, 1.75, 0.3, 0.55, mat('#2f5bd1'), false);
  box(3.0, 1.35, 3.3, 1.6, 0.14, 0.55, mat('#7fe0c4'), false);
  fbox(1.75, 1.22, 2.45, 1.72, 0.28, '#8a5a36');
  ['#f2d22e', '#e04848', '#48a0e0', '#6cc070'].forEach((c, i) => box(1.82 + i * 0.15, 1.3, 1.92 + i * 0.15, 1.42, 0.06, 0.28, mat(c), false));
  // his clarinet corner by the desk: a music stand with sheet music, and the clarinet's own little stand
  box(5.28, 1.3, 5.31, 1.42, 1.0, 0, mat('#2a2b30'), false);                     // music stand pole
  box(5.22, 1.18, 5.26, 1.52, 0.26, 1.0, mat('#2a2b30'), false);                 // its desk
  box(5.215, 1.2, 5.22, 1.5, 0.22, 1.02, mat('#f4f0e6'), false);                 // sheet music
  [0, 1, 2].forEach(k => box(5.21, 1.23, 5.214, 1.47, 0.006, 1.08 + k * 0.05, mat('#3a3d42'), false));
  cyl(5.5, 1.3, 0.07, 0.05, '#2a2b30', 0);                                        // the clarinet's stand
  solid(5.15, 1.15, 5.62, 1.5);
  const clarinetNotes = musicNotes(4.95, 1.05, 1.4);                             // notes float up while he plays
  return { dudeBed, clarinetNotes };
}

// Going up and down the stairs. Stand at the foot or the top of a flight and the action button offers
// "Go upstairs" / "Go downstairs". Floors above the player are hidden so you can see in; the floor you're
// on covers the rooms below.
import { LEVEL_HEIGHT, FLOOR_NAMES } from '../config.js';
import { S } from '../state.js';

// ground floor <-> first floor
const FOOT = { at: [4.4, 6.05], arrive: [4.3, 6.0], facing: 0 };            // ground-floor hall, foot of the stairs
const TOP = { at: [4.15, 4.45], arrive: [4.1, 4.55], facing: Math.PI / 2 }; // first-floor landing, top of the stairs
// first floor <-> attic: the next flight goes up over the stairwell from its front end
const ATTIC_FOOT = { at: [4.3, 6.3], arrive: [4.25, 6.2], facing: 0 };            // first-floor landing, by the bathroom
const ATTIC_TOP = { at: [4.3, 4.55], arrive: [4.25, 4.6], facing: Math.PI / 2 };  // attic hall, top of the stairs
export const STAIRS = { FOOT, TOP, ATTIC_FOOT, ATTIC_TOP };

export function createLevels({ world, player, board, hud, stage }) {
  function show(level) {
    S.level = level;
    world.upstairs.visible = level >= 1;
    world.attic.visible = level === 2;
    player.group.position.y = level * LEVEL_HEIGHT;
  }

  /** Take the stairs to a floor; `to` is where you arrive (by default the usual top or foot of the stairs). */
  function go(level, to = [FOOT, TOP, ATTIC_TOP][level]) {
    show(level);
    player.group.position.x = to.arrive[0];
    player.group.position.z = to.arrive[1];
    player.group.rotation.y = to.facing;
    hud.toast(FLOOR_NAMES[level]);
  }

  board.addFixed({ level: 0, at: FOOT.at, label: 'Go upstairs', act: () => go(1, TOP) });
  board.addFixed({ level: 1, at: TOP.at, label: 'Go downstairs', act: () => go(0, FOOT) });
  board.addFixed({ level: 1, at: ATTIC_FOOT.at, label: 'Go up to the attic', act: () => go(2, ATTIC_TOP) });
  board.addFixed({ level: 2, at: ATTIC_TOP.at, label: 'Go downstairs', act: () => go(1, ATTIC_FOOT) });

  // In the attic the roof slopes up between the camera and the rooms: make the half nearest the camera
  // see-through (it swaps over when you turn the view round).
  let near = null;
  function update() {
    if (!world.roof) return;
    const dz = S.level === 2 ? stage.camera.position.z - player.group.position.z : 0;
    const side = dz > 1 ? 'front' : dz < -1 ? 'back' : null;
    if (side === near) return;
    near = side;
    for (const half of ['back', 'front']) for (const mesh of world.roof[half]) {
      for (const m of [].concat(mesh.material)) {
        m.transparent = half === side; m.opacity = half === side ? 0.15 : 1; m.depthWrite = half !== side; m.needsUpdate = true;
      }
    }
  }

  return { show, go, update };
}

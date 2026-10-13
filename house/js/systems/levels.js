// Going up and down the stairs. Stand at the foot or the top of a flight and the action button offers
// "Go upstairs" / "Go downstairs". Floors above the player are hidden so you can see in; the floor you're
// on covers the rooms below.
import { LEVEL_HEIGHT, FLOOR_NAMES } from '../config.js';
import { S } from '../state.js';
import { MUM } from '../world/mumoffice.js';

// ground floor <-> first floor
const FOOT = { at: [4.4, 6.05], arrive: [4.3, 6.0], facing: 0 };            // ground-floor hall, foot of the stairs
const TOP = { at: [4.15, 4.45], arrive: [4.1, 4.55], facing: Math.PI / 2 }; // first-floor landing, top of the stairs
// first floor <-> attic: the next flight goes up over the stairwell from its front end
const ATTIC_FOOT = { at: [4.6, 6.5], arrive: [4.3, 6.45], facing: 0 };            // first-floor landing, the gap in the banister by the bathroom
const ATTIC_TOP = { at: [4.3, 4.55], arrive: [4.25, 4.6], facing: Math.PI / 2 };  // attic hall, top of the stairs
export const STAIRS = { FOOT, TOP, ATTIC_FOOT, ATTIC_TOP };

export function createLevels({ world, player, board, hud, stage }) {
  function show(level) {
    S.level = level;
    world.upstairs.visible = level >= 1;
    if (world.mumFloor) world.mumFloor.visible = level === 1;   // Mum's office floor (world/mumoffice.js)
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

  // Mum's office building: the lifts and the stairs (the lifts don't run in a fire drill)
  const lift = MUM.lift, stairs = MUM.stairs;
  const ride = (level, how) => { show(level); player.group.position.x = how[0]; player.group.position.z = how[1]; player.group.rotation.y = -Math.PI / 2; hud.toast(level ? 'Up to the office floor' : 'Down to the ground floor'); };
  const noLift = () => { if (S.mission && S.mission.drill) { hud.toast('Not the lift in a fire drill: take the stairs!'); return true; } return false; };
  board.addFixed({ level: 0, at: lift, label: 'Take the lift up', act: () => { if (!noLift()) ride(1, lift); } });
  board.addFixed({ level: 1, at: lift, label: 'Take the lift down', act: () => { if (!noLift()) ride(0, lift); } });
  board.addFixed({ level: 0, at: stairs, label: 'Take the stairs up', act: () => ride(1, stairs) });
  board.addFixed({ level: 1, at: stairs, label: 'Take the stairs down', act: () => ride(0, stairs) });

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

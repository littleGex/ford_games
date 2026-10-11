// Going up and down the stairs. Stand at the foot of the stairs (hall) or at the top (landing) and the
// action button offers "Go upstairs" / "Go downstairs". While you're downstairs the first floor is hidden
// so you can see in; upstairs, its floor covers the rooms below.
import { LEVEL_HEIGHT, FLOOR_NAMES } from '../config.js';
import { S } from '../state.js';

const FOOT = { at: [4.4, 6.05], arrive: [4.3, 6.0], facing: 0 };            // ground-floor hall, foot of the stairs
const TOP = { at: [4.15, 4.45], arrive: [4.1, 4.55], facing: Math.PI / 2 }; // first-floor landing, top of the stairs

export function createLevels({ world, player, board, hud }) {
  function show(level) {
    S.level = level;
    world.upstairs.visible = level === 1;
    player.group.position.y = level * LEVEL_HEIGHT;
  }

  function go(level) {
    const to = level === 1 ? TOP : FOOT;
    show(level);
    player.group.position.x = to.arrive[0];
    player.group.position.z = to.arrive[1];
    player.group.rotation.y = to.facing;
    hud.toast(FLOOR_NAMES[level]);
  }

  board.addFixed({ level: 0, at: FOOT.at, label: 'Go upstairs', act: () => go(1) });
  board.addFixed({ level: 1, at: TOP.at, label: 'Go downstairs', act: () => go(0) });

  return { show, go, update() {} };
}

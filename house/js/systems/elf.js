// The naughty elf (pack/elfscenes.js, models in world/elf.js): from 1 to 24 December his little door is on the
// skirting in the hall, and each morning until he's been found (elf.js: once a real day) he's out somewhere in
// the house with the mess he made in the night. The "Find the elf" job (jobs.js) finds him, puts the mess right
// and takes him back through his door.
import { bell } from '../core/audio.js';
import { sendHome } from '../items.js';
import { ELF_SCENES, ELF_NAME } from '../pack/elfscenes.js';
import { ELF_DOOR, makeElfDoor } from '../world/elf.js';

export function createElf(ctx) {
  const { items, stage, world, hud } = ctx;
  const floors = () => [stage.scene, world.upstairs, world.attic];
  const door = makeElfDoor();
  door.position.set(...ELF_DOOR.place); door.visible = false;
  stage.scene.add(door);
  const built = {};
  let scene = null, day;   // day: the date today's game day was planned for (days.js params.elfDate)

  /** A scene's mess, built the first time it's needed and added to the elf's floor (hidden). */
  function propsOf(id) {
    if (!built[id]) {
      const s = ELF_SCENES.find(x => x.id === id);
      built[id] = s ? s.props() : [];
      built[id].forEach(p => { p.visible = false; floors()[s.elf.level].add(p); });
    }
    return built[id];
  }
  function hideAll() { Object.values(built).forEach(list => list.forEach(p => { p.visible = false; })); }
  function hideElf() { sendHome(items.elf); items.elf.visible = false; }

  return {
    door, propsOf,
    get scene() { return scene; },
    /** Start of a day: his door up on Advent days; if he's still to be found today, him and the day's mess out. */
    reset(params) {
      const tags = [].concat(params.holiday || []);
      hideAll(); hideElf();
      door.visible = tags.includes('advent');
      scene = ELF_SCENES.find(s => s.id === params.elfScene) || null; day = params.elfDate;
      if (!door.visible || !scene || !ctx.elfLog.waiting(tags, day)) return;
      const { place, level, rotY = 0 } = scene.elf, elf = items.elf;
      if (elf.parent !== floors()[level]) floors()[level].attach(elf);
      elf.position.set(...place); elf.rotation.set(0, rotY, 0);
      elf.userData.level = level; elf.visible = true;
      propsOf(scene.id).forEach(p => { p.visible = true; });
    },
    /** Put one bit of today's mess right. */
    clear(i) { const p = scene && propsOf(scene.id)[i]; if (p) p.visible = false; },
    found() { bell(); hud.toast(`You found ${ELF_NAME}! ${scene ? scene.title : ''}`.trim()); },
    /** Back through his door: gone until tomorrow. */
    home() { hideElf(); hideAll(); ctx.elfLog.markFound(day); },
    /** Everything put away (the job's tidy, on a day it isn't done). */
    away() { hideElf(); hideAll(); },
  };
}

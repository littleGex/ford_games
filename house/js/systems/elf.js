// The naughty elf (pack/elfscenes.js, models in world/elf.js): from 1 to 24 December his little door is on the
// skirting in the hall, and each morning until he's been found (elf.js: once a real day) he's out somewhere in
// the house with the mess he made in the night. The "Find the elf" job (jobs.js) finds him, puts the mess right
// and takes him back through his door.
import { bell } from '../core/audio.js';
import { S } from '../state.js';
import { sendHome } from '../items.js';
import { ELF_SCENES } from '../pack/elfscenes.js';
import { elfName } from '../elf.js';
import { ELF_DOOR, makeElfDoor, makeNote } from '../world/elf.js';
import { CALENDAR_NOTE } from '../pack/elfscenes.js';

export function createElf(ctx) {
  const { items, stage, world, hud } = ctx;
  const floors = () => [stage.scene, world.upstairs, world.attic];
  const door = makeElfDoor();
  door.position.set(...ELF_DOOR.place); door.visible = false;
  stage.scene.add(door);
  const built = {};
  let scene = null, day;   // day: the date today's game day was planned for (days.js params.elfDate)
  const notes = [];          // the goodbye trail's notes (the elf says goodbye), made when first needed
  let waving = null;          // { t, done } while he waves goodbye at his door
  let looking = 0;          // seconds of play with him out and not found yet (where's the elf? clues)
  const CLUES_AT = [60, 120];
  const elfJob = () => ctx.board && ctx.board.find('elf');
  function clue(text) { const j = elfJob(); if (j && j.status !== text) { j.status = text; ctx.board.refresh(); } }

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
  function hideTrail() { notes.forEach(n => { n.visible = false; }); if (waving) { waving = null; hideElf(); } }

  return {
    door, propsOf,
    get scene() { return scene; },
    /** Start of a day: his door up on Advent days; if he's still to be found today, him and the day's mess out. */
    reset(params) {
      const tags = [].concat(params.holiday || []);
      hideAll(); hideElf(); hideTrail();
      looking = 0; clue(undefined);
      day = params.elfDate;
      door.visible = tags.includes('advent') && ctx.elfLog.hasArrived(day) && !ctx.elfLog.hasLeft(day);   // his door: from the day he arrived until both have said goodbye
      scene = ELF_SCENES.find(s => s.id === params.elfScene) || null;
      if (!door.visible || !scene || !ctx.elfLog.waiting(tags, day)) return;
      const { place, level, rotY = 0 } = scene.elf, elf = items.elf;
      if (elf.parent !== floors()[level]) floors()[level].attach(elf);
      elf.position.set(...place); elf.rotation.set(0, rotY, 0);
      elf.userData.level = level; elf.visible = true;
      propsOf(scene.id).forEach(p => { p.visible = true; });
    },
    /** Where's the elf? After a minute of looking a clue under "Find the elf" (which room), a minute later a closer one. */
    update(dt) {
      if (waving) {   // a hop and a wiggle, then through his door
        waving.t += dt;
        const e = items.elf, t = waving.t;
        e.position.y = Math.abs(Math.sin(t * 7)) * 0.06; e.rotation.z = Math.sin(t * 9) * 0.2;
        if (t >= 1.6) { const done = waving.done; waving = null; e.rotation.z = 0; hideElf(); if (done) done(); }
        return;
      }
      if (S.menuOpen || S.dayOver || S.mission || !scene || !items.elf.visible) return;
      const j = elfJob();
      if (!j || j.i !== 0) return;
      looking += dt;
      const n = CLUES_AT.filter(t => looking >= t).length;
      if (n && j.status !== scene.hint[n - 1]) { clue(scene.hint[n - 1]); hud.toast(`Where's ${elfName()}? ${scene.hint[n - 1]}`); }   // the list may be folded away
    },
    /** Put one bit of today's mess right. */
    clear(i) { const p = scene && propsOf(scene.id)[i]; if (p) p.visible = false; },
    found() { clue(undefined); const E = elfName(); bell(); hud.toast(`You found ${E}! ${scene ? scene.title(E) : ''}`.trim()); },
    /** Back through his door: gone until tomorrow. */
    home() { hideElf(); hideAll(); ctx.elfLog.markFound(day); },
    /** The elf arrives mission: nothing of his about until his door is fixed. */
    prepareArrival() { hideElf(); hideAll(); door.visible = false; },
    /** The elf says goodbye: his notes out, the calendar one first, then the trail's stops (pack/elfscenes.js trailStops). */
    showNotes(stops) {
      hideTrail();
      [CALENDAR_NOTE, ...stops].forEach((st, i) => {
        const n = notes[i] || (notes[i] = makeNote());
        if (n.parent !== floors()[st.level || 0]) floors()[st.level || 0].add(n);
        n.position.set(...st.place); n.visible = true;
      });
    },
    /** How many of his notes are out (tests). */
    notesOut: () => notes.filter(n => n.visible).length,
    /** A note picked up and read. */
    takeNote(i) { if (notes[i]) notes[i].visible = false; },
    /** He's sitting by his door, waiting to say goodbye. */
    atDoor() {
      const e = items.elf;
      if (e.parent !== floors()[0]) floors()[0].attach(e);
      e.position.set(ELF_DOOR.place[0], 0, ELF_DOOR.place[2] + 0.14); e.rotation.set(0, 0, 0);
      e.userData.level = 0; e.visible = true;
    },
    /** He waves and goes through his door; done() after. */
    wave(done) { waving = { t: 0, done }; },
    /** Notes and the waiting elf put away (a mission left part-way, a new day). */
    hideTrail,
    /** His door fixed to the skirting in the hall (the elf arrives mission). */
    fixDoor() { door.visible = true; },
  };
}

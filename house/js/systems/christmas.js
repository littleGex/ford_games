// Christmas (holidays.js): puts the decorations up (world/christmas.js) from 12 December to 5 January, and the
// Advent calendars from 1 December, and runs the Christmas jobs (jobs.js): doing the tree, baking biscuits,
// presents under the tree, the Christmas bell on Christmas Eve, and everything coming down on 5 January.
// The fairy lights twinkle and the candles flicker.
import { S } from '../state.js';
import { colliders } from '../core/build.js';
import { bell } from '../core/audio.js';
import { adventCandles, hasHoliday, today } from '../holidays.js';
import { XMAS, XMAS_GIFTS, paintCalendar } from '../world/christmas.js';

export function createChristmas(ctx) {
  const { world, items, hud, stage } = ctx;
  const deco = world.christmas;
  const floors = () => [stage.scene, world.upstairs, world.attic];
  let on = false, calendarsUp = false, cutter = 'star', unwrapped = 0, advent = null;

  function treeCollider(onOff) {
    const k = colliders.indexOf(deco.treeCollider);
    if (onOff && k < 0) colliders.push(deco.treeCollider);
    if (!onOff && k >= 0) colliders.splice(k, 1);
  }
  function dress(lightsOn, baublesOn, starOn) {
    deco.lights.forEach(l => { l.visible = lightsOn; });
    deco.baubles.visible = baublesOn; deco.star.visible = starOn;
  }
  function treeIndoors() {
    const t = deco.tree;
    t.position.set(XMAS.tree.x, 0, XMAS.tree.z); t.rotation.set(0, 0, 0); t.visible = true; deco.pot.visible = true;
    treeCollider(on);
  }
  /** Put an item somewhere (any floor): [x, y, z]. */
  function place(item, level, pos, visible) {
    floors()[level].add(item); item.position.set(...pos); item.rotation.set(0, 0, 0); item.userData.level = level;
    if (visible !== undefined) item.visible = visible;
  }

  function redrawCalendars() {
    if (!advent) return;
    for (const who of ['girl', 'boy']) paintCalendar(deco.calendar[who].tex, who, new Set(advent.opened(who)), advent.upTo());
  }

  function update(dt, time) {
    if (!on) return;
    if (!S.reduceMotion) {   // the fairy lights twinkle (the tree's only once they're on)
      deco.lights.forEach((b, i) => { if (b.userData.on) b.visible = Math.sin(time * 1.9 + i * 2.3) > -0.7; });
      deco.bulbs.forEach((b, i) => { if (!b.userData.off) b.visible = Math.sin(time * 1.4 + i * 1.7) > -0.8; });
    }
    deco.flames.forEach((f, i) => { if (f.visible) f.scale.y = 1.5 + Math.sin(time * 15 + i * 2) * 0.3; });
  }

  return {
    update,
    get on() { return on; },
    get calendarsUp() { return calendarsUp; },
    get cutter() { return cutter; },
    /** The Advent calendars' doors (advent.js), to paint them on the wall. */
    useAdvent(a) { advent = a; a.onChange(redrawCalendars); redrawCalendars(); },
    redrawCalendars,
    /** Start of a day: decorations up at Christmas (the tree done, the candles lit for the Advent Sundays so far,
     *  two presents under the tree before Christmas Eve), the Advent calendars in December, all hidden otherwise. */
    reset(holiday) {
      on = hasHoliday(holiday, 'christmas');
      calendarsUp = on || hasHoliday(holiday, 'advent');
      deco.all.visible = on; deco.calendars.visible = calendarsUp;
      if (ctx.adventCard) ctx.adventCard.showButton(calendarsUp);
      deco.lights.forEach(l => { l.userData.on = true; });
      deco.bulbs.forEach(b => { b.userData.off = false; b.visible = true; });
      deco.stars.visible = true; deco.doorWreath.visible = true; deco.wreath.visible = true;
      treeIndoors(); dress(true, true, true);
      const n = adventCandles(today());
      deco.flames.forEach((f, i) => { f.visible = i < n; });
      deco.presents.forEach((p, i) => { p.visible = hasHoliday(holiday, 'beforeChristmas') && i < 2; });
      cutter = 'star'; unwrapped = 0;
      items.biscuits.userData.tray.shape(cutter);
      redrawCalendars();
    },
    // --- the tree
    bareTree() { deco.lights.forEach(l => { l.userData.on = false; }); dress(false, false, false); },
    treeLights() { deco.lights.forEach(l => { l.userData.on = true; l.visible = true; }); hud.toast('The fairy lights are on!'); },
    hangBaubles() { deco.baubles.visible = true; },
    topStar() { deco.star.visible = true; hud.toast('The star is on top: the tree is done! 🎄'); },
    treeDone() { treeIndoors(); deco.lights.forEach(l => { l.userData.on = true; }); dress(true, true, true); },
    boxOut() { place(items.xmasBox, 0, items.xmasBox.userData.home.pos, true); },
    // --- presents
    /** The present to wrap (Mum and Dad: in the oak wardrobe), or the one P or Dude are making at their desk. */
    giftAt(desk) {
      if (desk) place(items.xmasGift, desk.level, desk.place, false);
      else place(items.xmasGift, 1, items.xmasGift.userData.home.pos, true);
    },
    made() { items.xmasGift.visible = true; hud.toast('All wrapped up!'); },
    /** Christmas Eve: the presents appear under the tree. */
    presentsArrive() { deco.presents.forEach(p => { p.visible = true; }); },
    ringBell() { bell(); hud.toast('Ding-a-ling! The Christkind has been! 🔔'); },
    /** Open one of your presents (the next one under the tree). */
    unwrap(character) {
      const p = deco.presents.find(x => x.visible);
      if (p) p.visible = false;
      const gift = (XMAS_GIFTS[character] || XMAS_GIFTS.dad)[unwrapped++ % 3];
      hud.toast(`It's ${gift}! 🎁`);
      return gift;
    },
    presentsOpened() { deco.presents.forEach(p => { p.visible = false; }); },
    // --- the wish list
    letterAt(desk) { place(items.wishLetter, desk.level, desk.place, false); },
    letterWritten() { items.wishLetter.visible = true; },
    // --- biscuits
    chooseCutter(id) { cutter = id; },
    cutOut() { const b = items.biscuits; place(b, 0, XMAS.table.tray, true); b.userData.tray.shape(cutter); },
    intoOven() { items.biscuits.visible = false; },
    baked() { const b = items.biscuits; place(b, 0, XMAS.oven.out, true); b.userData.tray.bake(); },
    /** Show the biscuits done, on the dining table. */
    biscuitsOnTable() { const b = items.biscuits; place(b, 0, XMAS.table.plate, true); b.userData.tray.shape(cutter); b.userData.tray.bake(); },
    // --- 5 January: everything comes down, the tree goes out by the street for the collection
    stripTree() { deco.lights.forEach(l => { l.userData.on = false; }); dress(false, false, false); },
    packAway() { deco.stars.visible = false; deco.doorWreath.visible = false; deco.wreath.visible = false; deco.bulbs.forEach(b => { b.userData.off = true; b.visible = false; }); deco.flames.forEach(f => { f.visible = false; }); },
    boxByTree() { place(items.xmasBox, 0, XMAS.boxPlace, true); },
    treeOut() { deco.tree.visible = false; treeCollider(false); },
    treeAtKerb() {
      const t = deco.tree;
      t.position.set(XMAS.kerb[0] + 0.2, 0.16, XMAS.kerb[1]); t.rotation.set(0, 0, Math.PI / 2); t.visible = true; deco.pot.visible = false;
      treeCollider(false);
    },
    /** Show it all down (the job's done): nothing up, the tree out by the street. */
    allDown() {
      this.stripTree(); this.packAway(); this.treeAtKerb();
      deco.presents.forEach(p => { p.visible = false; });
      deco.calendars.visible = false; calendarsUp = false;
    },
  };
}

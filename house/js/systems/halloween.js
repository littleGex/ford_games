// Halloween (31 October, or ?holiday=halloween): puts the decorations up (world/halloween.js), and runs
// the day's Halloween jobs (jobs.js): the pumpkin being scooped, carved and lit; the decorations being hung;
// trick-or-treaters walking up from the street to ring the bell, or for P and Dude the neighbours opening
// their door with a handful of sweets. The tea lights and the string of lights flicker; the ghost sways.
import { S } from '../state.js';
import { dingDong } from '../core/audio.js';
import { makeCharacter } from '../characters/character.js';
import { dressUp } from '../characters/costumes.js';
import { NEIGHBOURS, TRICK_OR_TREATERS } from '../characters/family.js';
import { NEIGHBOUR_HOUSES } from '../world/outside/neighbours.js';

const STREET = [[3.92, 13.1], [3.92, 12.2]];          // up the path from the pavement
const AT_DOOR = [[3.72, 9.95], [4.12, 9.95]];          // two kids side by side on the step
const SPEED = 1.4;
const GREETINGS = ['"Trick or treat!"', '"Happy Halloween! Trick or treat!"'];

export function createHalloween({ stage, world, items, board, hud, player }) {
  const deco = world.halloween;
  let on = false, face = 'happy', costume = 'witch';

  // the trick-or-treaters: two pairs, coming for the two waits in Mum and Dad's job
  const kids = TRICK_OR_TREATERS.map(spec => {
    const c = makeCharacter(spec); dressUp(c, spec.costume);
    c.root.visible = false; stage.scene.add(c.root);
    return { c, path: [], phase: 0 };
  });
  let visit = null;   // { n, state: 'coming' | 'waiting' | 'leaving', pair: [kid, kid] }

  // the neighbours at their own front doors, for P and Dude knocking
  const neighbours = { left: makeCharacter(NEIGHBOURS.left), right: makeCharacter(NEIGHBOURS.right) };
  Object.values(neighbours).forEach(n => { n.root.visible = false; stage.scene.add(n.root); });
  let doorOpen = null;   // { side, left: seconds till they shut the door }

  const pumpkin = () => items.pumpkin.userData.pumpkin;

  function walk(k, dt) {
    const p = k.c.root.position;
    while (k.path.length) {
      const t = k.path[0], dx = t[0] - p.x, dz = t[1] - p.z, d = Math.hypot(dx, dz);
      if (d < 0.04) { k.path.shift(); continue; }
      const step = Math.min(d, SPEED * dt);
      p.x += dx / d * step; p.z += dz / d * step;
      k.c.root.rotation.y = Math.atan2(dx, dz);
      k.phase += dt * 10;
      return true;
    }
    return false;
  }
  function animate(k, walking, dt) {
    const c = k.c, a = Math.min(1, dt * 12), sw = walking ? Math.sin(k.phase) * 0.55 : 0;
    c.legs[0].rotation.x += (sw - c.legs[0].rotation.x) * a; c.legs[1].rotation.x += (-sw - c.legs[1].rotation.x) * a;
    const out = visit && visit.state === 'waiting';   // holding out their bags at the door
    const a0 = out ? -1.2 : -sw * 0.8, a1 = out ? -1.2 : sw * 0.8;
    c.arms[0].rotation.x += (a0 - c.arms[0].rotation.x) * a; c.arms[1].rotation.x += (a1 - c.arms[1].rotation.x) * a;
  }

  function sendHome() {
    kids.forEach(k => { k.c.root.visible = false; k.path = []; });
    visit = null;
    Object.values(neighbours).forEach(n => { n.root.visible = false; });
    doorOpen = null;
  }

  const walkTime = () => (Math.hypot(STREET[0][0] - STREET[1][0], STREET[0][1] - STREET[1][1]) + Math.hypot(STREET[1][0] - AT_DOOR[0][0], STREET[1][1] - AT_DOOR[0][1])) / SPEED + 0.6;

  function comeUp(n) {
    const pair = n ? [kids[2], kids[3]] : [kids[0], kids[1]];
    pair.forEach((k, i) => {
      k.c.root.visible = true; k.c.root.position.set(STREET[0][0] + (i ? 0.3 : -0.3), 0, STREET[0][1] + i * 0.4);
      k.path = [[STREET[1][0] + (i ? 0.2 : -0.2), STREET[1][1]], [...AT_DOOR[i]]];
    });
    visit = { n, state: 'coming', pair };
  }

  function update(dt, time) {
    if (!on) return;
    // flickering tea lights and the string of lights
    const k = 0.5 + 0.5 * Math.sin(time * 13) * Math.sin(time * 7.3 + 1);
    deco.stepLantern.flicker(k);
    if (pumpkin()) pumpkin().flicker(1 - k);
    deco.bulbs.forEach((b, i) => { b.visible = S.reduceMotion || (Math.sin(time * 2 + i * 1.7) > -0.85); });
    deco.ghostBody.rotation.z = Math.sin(time * 1.3) * 0.08; deco.ghostBody.rotation.y = Math.sin(time * 0.7) * 0.3;

    // trick-or-treaters: set off so they ring as the wait ends, wait at the door, go home with their sweets
    if (S.dayOver || S.mission) { if (visit || doorOpen) sendHome(); return; }
    const job = board.find('trickOrTreat'), s = job && board.step(job);
    if (!visit && s && s.kind === 'wait' && s.trick !== undefined && (s.prog || 0) >= s.dur - walkTime()) comeUp(s.trick);
    if (visit) {
      let any = false;
      visit.pair.forEach(kid => { const w = walk(kid, dt); any = any || w; animate(kid, w, dt); });
      if (visit.state === 'coming' && !any) { visit.state = 'waiting'; visit.pair.forEach(kid => { kid.c.root.rotation.y = Math.PI; }); dingDong(); }
      if (visit.state === 'leaving' && !any) { visit.pair.forEach(kid => { kid.c.root.visible = false; }); visit = null; }
    }
    if (doorOpen && (doorOpen.left -= dt) <= 0) { neighbours[doorOpen.side].root.visible = false; doorOpen = null; }
  }

  return {
    update,
    get on() { return on; },
    get face() { return face; },
    get costume() { return costume; },
    get visitors() { return visit ? visit.state : null; },
    /** Start of a day: decorations up on Halloween, all hidden otherwise; nobody in costume. */
    reset(holiday) {
      on = holiday === 'halloween';
      deco.all.visible = on;
      ['window', 'door', 'ghost'].forEach(k => { deco[k].visible = true; });
      sendHome(); player.undressAll();
      items.treatPail.getObjectByName('sweets').visible = false;
      face = 'happy'; costume = 'witch';
    },
    // --- the jack-o'-lantern
    freshPumpkin() { pumpkin().fresh(); items.pumpkin.visible = true; },
    scoop() { pumpkin().open(); },
    chooseFace(id) { face = id; },
    carve() { pumpkin().carve(face); },
    light() { pumpkin().light(true); hud.toast("The jack-o'-lantern glows!"); },
    /** Show it carved, lit and on the front step (the job's done). */
    lanternOnStep() {
      const it = items.pumpkin, p = pumpkin();
      stage.scene.attach(it); it.position.set(3.42, 0.03, 9.52); it.rotation.set(0, 0, 0); it.userData.level = 0; it.visible = true;
      p.carve(face); p.light(true);
    },
    // --- decorating
    takeDown() { ['window', 'door', 'ghost'].forEach(k => { deco[k].visible = false; }); },
    hang(what) { deco[what].visible = true; },
    // --- trick or treat
    giveSweets() {
      if (!visit) comeUp(0);   // (they're always there by now, but just in case)
      hud.toast(`${GREETINGS[visit.n % 2]} … "Thank you! Happy Halloween!"`);
      visit.state = 'leaving';
      visit.pair.forEach((k, i) => { k.path = [[STREET[1][0] + (i ? 0.2 : -0.2), STREET[1][1]], [STREET[0][0] + (i ? 0.3 : -0.3), STREET[0][1] + 0.6]]; });
    },
    chooseCostume(id) { costume = id; },
    dressUp() { player.dressUp(costume); },
    /** Ring next door: the neighbour opens up, admires the costume, and drops sweets in the bucket. */
    knock(side) {
      const n = neighbours[side], [x] = NEIGHBOUR_HOUSES[side].step;
      Object.values(neighbours).forEach(o => { o.root.visible = false; });
      n.root.position.set(x, 0, 9.5); n.root.rotation.y = 0; n.root.visible = true;
      doorOpen = { side, left: 5 };
      dingDong();
      const what = { witch: 'a witch', vampire: 'a vampire', ghost: 'a ghost', cat: 'a black cat', pumpkin: 'a pumpkin' }[player.costume] || 'a trick-or-treater';
      hud.toast(`Neighbour: "Ooh, ${what}! Here you are, Happy Halloween!"`);
      items.treatPail.getObjectByName('sweets').visible = true;
    },
  };
}

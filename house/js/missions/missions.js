// Missions: one-off storylines, separate from the day's job list, started from the home screen.
// A mission puts today's list aside, gives you its own steps one after another (the list grows as you go),
// runs its own clock, and ends with a results card: stars, your time, your best. "Back to the day" picks
// the day up again where the save left it (a half-finished job starts from its first step again).
//
// The school run (P or Dude): get out of bed, breakfast at the dining table, get dressed, pack your school
// bag, put it on your bike on the terrace and cycle out of the back gate. The school clock starts at 7:30
// and the bell rings at 8:00: before 7:50 is three stars, before the bell two, late one.
import { S } from '../state.js';
import { resetItems } from '../items.js';

const KEY = 'fordHouse.missions.v1';
const BEST = (() => { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } })();
const saveBest = () => { try { localStorage.setItem(KEY, JSON.stringify(BEST)); } catch (e) { /* private mode */ } };
export const clockText = minutes => `${Math.floor(minutes / 60)}:${String(Math.floor(minutes % 60)).padStart(2, '0')}`;

// where things are for each of the kids
const KIDS = {
  girl: { name: 'P', level: 1, start: [1.6, 6.95], facing: Math.PI / 2, bed: [1.25, 6.9], bedHandle: 'daybed',
          wardrobe: { at: [2.3, 6.95], seat: [2.3, 0, 6.95, Math.PI / 2] }, desk: [2.3, 8.05], bag: [2.85, 0.73, 7.9] },
  boy:  { name: 'Dude', level: 2, start: [1.8, 2.45], facing: Math.PI, bed: [1.8, 2.75], bedHandle: 'dudeBed',
          wardrobe: { at: [0.35, 2.95], seat: [0.35, 0, 2.95, 0] }, desk: [4.62, 2.27], bag: [5.3, 0.76, 2.0] },
};

export const MISSIONS = {
  schoolRun: {
    title: 'The school run', who: ['girl', 'boy'],
    clock: { start: 7 * 60 + 30, end: 8 * 60, secondsPerMinute: 4 },          // 7:30, the bell at 8:00
    stars: minutes => minutes < 7 * 60 + 50 ? 3 : minutes < 8 * 60 ? 2 : 1,
    setup(c, kid) {
      c.world[kid.bedHandle].mess();
      const bag = c.items.schoolBag, floor = [c.stage.scene, c.world.upstairs, c.world.attic][kid.level];
      floor.add(bag); bag.position.set(...kid.bag); bag.rotation.set(0, 0, 0); bag.userData.level = kid.level; bag.visible = true;
    },
    jobs: kid => [
      { title: 'Get up', steps: [
        { kind: 'use', level: kid.level, at: kid.bed, label: 'Get out of bed', onDone: c => c.world[kid.bedHandle].make() }] },
      { title: 'Eat your breakfast', steps: [
        { kind: 'sit', at: [2.45, 7.2], seat: [2.15, 0.45, 7.2, -Math.PI / 2], dur: 6, what: 'Eating breakfast', label: 'Sit down and eat your breakfast' }] },
      { title: 'Get dressed', steps: [
        { kind: 'sit', stand: true, level: kid.level, at: kid.wardrobe.at, seat: kid.wardrobe.seat, dur: 5, what: 'Getting dressed', label: 'Get dressed at your wardrobe' }] },
      { title: 'Pack your school bag', steps: [
        { kind: 'use', level: kid.level, at: kid.desk, label: 'Pack your books into your school bag' },
        { kind: 'pick', item: 'schoolBag', label: 'Take your school bag' }] },
      { title: 'Cycle to school', steps: [
        { kind: 'drop', item: 'schoolBag', at: [3.75, -2.55], place: [4.1, 0.62, -2.6], label: 'Put your bag in the bike basket',
          onDone: c => c.items.bike.attach(c.items.schoolBag) },
        { kind: 'pick', item: 'bike', label: 'Get on your bike' },
        { kind: 'drop', item: 'bike', at: [4.35, -16.7], place: [4.35, 0, -16.95], label: 'Ride out of the back gate to school' }] },
    ],
  },
};

export function createMissions(ctx) {
  const { board, hud, player, levels, days } = ctx;
  const $ = id => document.getElementById(id);
  const el = { box: $('missionDone'), eyebrow: $('missionDoneEyebrow'), title: $('missionDoneTitle'), stars: $('missionStars'),
               stats: $('missionDoneStats'), best: $('missionBest'), again: $('missionAgain'), back: $('missionBack') };
  let jobs = [], next = 0, shownMinute = -1;

  const now = () => S.mission.clock.start + S.mission.t / S.mission.clock.secondsPerMinute;
  function showClock(force) {
    const m = Math.floor(now());
    if (!force && m === shownMinute) return;
    shownMinute = m;
    hud.setDayLabel(`${MISSIONS[S.mission.id].title} · ${clockText(m)}`);
  }

  /** Start a mission as one of the kids. */
  function start(id, who) {
    const m = MISSIONS[id], kid = KIDS[who];
    if (!m || !kid) return;
    if (S.sitting) ctx.sitting.standUp();
    if (ctx.home) ctx.home.close();
    el.box.hidden = true;
    S.mission = { id, who, clock: m.clock, t: 0, done: false };
    S.carrying = null; S.dayOver = false; S.wiping = null;
    hud.hideDayComplete();
    board.clear();
    resetItems(ctx.items);
    m.setup(ctx, kid);
    player.setCharacter(who);
    levels.show(kid.level);
    player.group.position.x = kid.start[0]; player.group.position.z = kid.start[1]; player.group.rotation.y = kid.facing;
    jobs = m.jobs(kid).map((j, k) => ({ ...j, id: `${id}-${k}`, mission: true }));
    next = 0; shownMinute = -1;
    board.add(jobs[next++]);
    showClock(true);
    hud.toast(`${m.title}: the bell rings at ${clockText(m.clock.end)}!`);
  }

  board.onFinished(job => {
    if (!S.mission || !job.mission || S.mission.done) return;
    if (next < jobs.length) { board.add(jobs[next++]); return; }
    finish();
  });

  function finish() {
    const mission = S.mission, m = MISSIONS[mission.id], arrived = now(), stars = m.stars(arrived);
    mission.done = true;
    const best = ((BEST[mission.id] ||= {})[mission.who]);
    const better = !best || stars > best.stars || (stars === best.stars && arrived < best.minutes);
    if (better) { BEST[mission.id][mission.who] = { stars, minutes: arrived }; saveBest(); }
    const late = arrived >= m.clock.end;
    el.eyebrow.textContent = `${m.title} · ${KIDS[mission.who].name}`;
    el.title.textContent = late ? 'Late for school!' : stars === 3 ? 'Early bird!' : 'Just in time!';
    el.stars.textContent = '★'.repeat(stars) + '☆'.repeat(3 - stars);
    el.stars.setAttribute('aria-label', `${stars} of 3 stars`);
    el.stats.textContent = `You got to school at ${clockText(arrived)}. The bell rings at ${clockText(m.clock.end)}.`;
    const b = BEST[mission.id][mission.who];
    el.best.textContent = better ? 'A new best!' : `Your best: ${'★'.repeat(b.stars)} at ${clockText(b.minutes)}`;
    el.box.hidden = false;
    el.again.focus();
  }

  /** Leave the mission and pick the day up again. */
  function end() {
    if (!S.mission) return;
    S.mission = null;
    el.box.hidden = true;
    if (S.sitting) ctx.sitting.standUp();
    player.setCharacter(days.character);
    days.start();
  }

  el.again.addEventListener('click', () => start(S.mission.id, S.mission.who));
  el.back.addEventListener('click', end);

  return {
    start, end,
    update(dt) {
      if (!S.mission || S.mission.done) return;
      S.mission.t += dt;
      showClock(false);
    },
    /** The best result for a mission and kid: { stars, minutes } or undefined. */
    best: (id, who) => BEST[id] && BEST[id][who],
    get active() { return S.mission; },
  };
}

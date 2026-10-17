// Missions: one-off storylines, separate from the day's job list, started from the home screen.
// A mission puts today's list aside, gives you its own steps one after another (the list grows as you go),
// runs its own clock, and ends with a results card: stars, your time, your best. "Back to the day" picks
// the day up again where the save left it (a half-finished job starts from its first step again).
//
// The school run (P or Dude): get out of bed, breakfast at the dining table, get dressed, pack your school
// bag, put it on your bike on the terrace and cycle out of the back gate. The school clock starts at 7:30
// and the bell rings at 8:00: before 7:50 is three stars, before the bell two, late one.
//
// Work from home (Mum or Dad), 7:00 to 17:00: get up, shower, get dressed, breakfast, then a working day with
// several things on the list at once to do in any order (meetings at set times, work at your desk, lunch, a
// glass of water), coffee and snacks whenever you like, and the phone ringing with an urgent call. Stars for
// being on time to the meetings, finishing by 17:00, and taking a break.
//
// Bedtime (Mum or Dad), from 19:45: get both kids off their iPads and upstairs, choose who showers first,
// shower, pyjamas and teeth for each, a story on P's bed, then tuck each into bed and switch their light off.
// Two to four things go wrong each time (lost pyjamas, a fussy story pick, a dance party...). Stars for when
// both lights are out: by 20:30 three, by 20:45 two. Going back downstairs ends it.
//
// 3D printing (Dad, no clock, just for fun): pick a design on the laptop, order a spool of filament, take the
// parcel from the courier, load the printer in the light-box cupboard by the sofa, send the print from the
// laptop, watch it grow, then take the model out and put it where it belongs.
import { S } from '../state.js';
import { resetItems } from '../items.js';
import { FOOD_DELIVERY } from '../config.js';
import { PRINTER } from '../world/rooms/wohnzimmer.js';
import { DESIGNS, COLOURS } from '../systems/printing.js';
import { ring, alarm } from '../core/audio.js';
import { OFFICE } from '../world/office.js';
import { MUM } from '../world/mumoffice.js';
import { BED, SEARCH, NAMES as KID, PRONOUN } from '../systems/bedtime.js';
import { STAIRS } from '../systems/levels.js';

const KEY = 'fordHouse.missions.v1';
const BEST = (() => { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } })();
const saveBest = () => { try { localStorage.setItem(KEY, JSON.stringify(BEST)); } catch (e) { /* private mode */ } };
export const clockText = minutes => `${Math.floor(minutes / 60)}:${String(Math.floor(minutes % 60)).padStart(2, '0')}`;

// where things are for each of the kids
export const KIDS = {
  girl: { name: 'P', level: 1, start: [1.4, 7.6], facing: -Math.PI / 2, bed: [1.25, 6.9], bedHandle: 'daybed',
          wardrobe: { at: [2.3, 6.95], seat: [2.3, 0, 6.95, Math.PI / 2] }, desk: [2.3, 8.05], bag: [2.85, 0.73, 7.9] },
  boy:  { name: 'Dude', level: 2, start: [1.8, 2.45], facing: Math.PI, bed: [1.8, 2.75], bedHandle: 'dudeBed',
          wardrobe: { at: [0.35, 2.95], seat: [0.35, 0, 2.95, 0] }, desk: [4.62, 2.27], bag: [5.3, 0.76, 2.0] },
};

const NAMES = { dad: 'Dad', mum: 'Mum', girl: 'P', boy: 'Dude' };
const DAD_DESK = [3.75, 0.5];   // Dad's desk in the dressing room, with the laptop

// Mum's and Dad's desks for working from home, and which screen shows for each kind of work
const DESKS = {
  dad: { level: 1, at: DAD_DESK, seat: [3.74, 0.45, 0.5, -Math.PI / 2], glow: 'dadScreen', pages: { meeting: 'call', mail: 'mail', doc: 'doc', code: 'code' }, radio: 'dadNotes' },
  mum: { level: 2, at: [1.17, 5.22], seat: [1.17, 0.45, 5.22, -Math.PI / 2], glow: 'mumScreen', pages: { meeting: 'sheet', mail: 'sheet', doc: 'sheet', code: 'sheet' }, radio: 'mumNotes' },
  mumOffice: { level: 1, at: MUM.desk.at, seat: MUM.desk.seat, glow: 'mumOfficeScreen', pages: { meeting: 'call', mail: 'mail', doc: 'doc', code: 'doc' }, radio: null },   // Mum's desk at her office
  office: { level: 0, at: OFFICE.desk.at, seat: OFFICE.desk.seat, glow: 'officeScreen', pages: { meeting: 'call', mail: 'mail', doc: 'doc', code: 'code' }, radio: null },   // Dad's desk at the office
};
/** A sit-at-your-desk step: a meeting (no radio) or some work (the radio plays). */
const deskStep = (who, kind, dur, what, label, extra = {}) => {
  const d = DESKS[who];
  return { kind: 'sit', level: d.level, power: who !== 'office' && who !== 'mumOffice', glow: d.glow, page: d.pages[kind], ...(kind === 'meeting' || !d.radio ? {} : { fx: d.radio }),
           at: d.at, seat: d.seat, dur, what, label, ...extra };
};
const hm = h => h * 60;   // hours to minutes since midnight
// coffee, snacks and the loo at home, at Dad's office and at Mum's office (true still means Dad's office)
const BREAKS = {
  home: { coffee: { kind: 'sit', stand: true, power: true, fx: 'steam', at: [3.95, 0.95], seat: [4.22, 0, 0.95, -Math.PI / 2], dur: 5, what: 'Making a coffee', label: 'Make yourself a coffee' },
          fridge: { at: [3.95, 3.4] } },
  dad: { coffee: { kind: 'sit', stand: true, at: OFFICE.coffee.at, seat: OFFICE.coffee.seat, dur: 5, what: 'Making a coffee', label: 'Make yourself a coffee in the kitchen' },
         fridge: { at: OFFICE.fridge }, loo: { at: OFFICE.toilet } },
  mum: { coffee: { kind: 'sit', stand: true, level: 1, at: MUM.coffee.at, seat: MUM.coffee.seat, dur: 5, what: 'Making a coffee', label: 'Make yourself a coffee in the kitchen' },
         fridge: { level: 1, at: MUM.fridge }, loo: { level: 1, at: MUM.wc } },
};
const place = w => (w === true ? 'dad' : w || 'home');
const coffeeJob = w => ({ key: 'coffee', optional: true, title: 'Coffee (whenever you like)', steps: [{ ...BREAKS[place(w)].coffee }] });
const snackJob = w => ({ key: 'snack', optional: true, title: 'Snack (whenever you like)', steps: [
  { kind: 'use', ...BREAKS[place(w)].fridge, label: 'Grab a snack from the fridge' }] });
const loJob = (w = 'dad') => ({ key: 'loo', optional: true, title: 'Bathroom (whenever you need)', steps: [
  { kind: 'use', ...BREAKS[place(w)].loo, label: 'Use the bathroom' }] });

/** The phone rings once with an urgent call to take at `desk` ('dad', 'mum' or 'office') within 20 minutes. */
function phoneRings(c, mission, minutes, desk) {
  if (mission.callAt === undefined) {
    let at = hm(10.5) + Math.random() * hm(5);            // some time between 10:30 and 15:30, not on top of the 14:00 meeting
    if (at > hm(13.3) && at < hm(14.6)) at = hm(14.75);
    mission.callAt = at;
  }
  if (mission.called || minutes < mission.callAt || mission.drill || c.board.jobs.some(j => j.key === 'finish')) return;
  mission.called = true; ring();
  c.hud.toast('Ring ring! Your boss needs you on an urgent call');
  c.missions.add({ key: 'urgent', urgent: true, due: minutes + 20, title: `Urgent call by ${clockText(minutes + 20)}!`,
    steps: [deskStep(desk, 'meeting', 10, 'On an urgent call', 'Sit at your desk and join the urgent call')] });
}

/** Coffee and snacks come back on offer a while after you've had one. */
function offerLater(c, mission, minutes) {
  for (const l of mission.later.filter(l => minutes >= l.at)) { mission.later.splice(mission.later.indexOf(l), 1); c.missions.add(l.job, { optional: true }); }
}

/** Once in the day the fire alarm goes off: out through the fire door to the assembly point, and wait
 *  there for the all-clear (30 seconds). Nothing else can be done meanwhile. */
function fireDrill(c, mission, minutes, where = { at: OFFICE.assembly, label: 'Go out through the fire door to the assembly point', toast: 'Fire alarm! Out through the fire door at the far end' }) {
  if (mission.drillAt === undefined) {
    let at = hm(10.75) + Math.random() * hm(4.5);
    if (at > hm(13.3) && at < hm(14.6)) at = hm(14.8);   // not in the 14:00 meeting
    mission.drillAt = at;
  }
  if (mission.drilled || minutes < mission.drillAt || c.board.jobs.some(j => j.key === 'finish')) return;
  mission.drilled = true; mission.drill = true; mission.drillFrom = minutes; alarm();
  if (c.S.sitting) c.sitting.standUp();
  c.hud.toast(where.toast);
  c.missions.add({ key: 'drill', urgent: true, title: 'Fire drill!', steps: [
    { kind: 'use', drill: true, at: where.at, label: where.label },
    { kind: 'wait', drill: true, dur: 30, label: 'Wait at the assembly point for the all-clear', doneMessage: 'All clear! Back to work' }] });
}

/** Stars for a working day: on time for the meetings, done in time, and a break. */
function workResult(mission, arrived, meetingKeys, by, doneText) {
  const meetings = meetingKeys.filter(k => mission.due[k] !== undefined);
  const onTime = meetings.filter(k => mission.doneAt[k] !== undefined && mission.doneAt[k] <= mission.due[k] + 35);
  const b = mission.breaks || {}, coffees = b.coffee || 0, snacks = b.snack || 0, loo = b.loo || 0;
  const checks = [onTime.length === meetings.length, arrived <= by, coffees + snacks + loo > 0];
  const stars = Math.max(1, checks.filter(Boolean).length);
  const plural = (n, w) => `${n} ${w}${n === 1 ? '' : 's'}`;
  return {
    stars, title: stars === 3 ? "A great day's work!" : arrived > by ? 'A long day!' : 'Good work!',
    stats: `${doneText} ${clockText(arrived)}. On time for ${onTime.length} of ${plural(meetings.length, 'meeting')}. Breaks: ${plural(coffees, 'coffee')}, ${plural(snacks, 'snack')}.`,
  };
}

// --- bedtime
const PJ = { girl: 'pyjamasGirl', boy: 'pyjamasBoy' };
const other = who => (who === 'girl' ? 'boy' : 'girl');
const bothWithYou = c => c.bedtime.withYou('girl') && c.bedtime.withYou('boy');
const shuffle = list => list.map(v => [Math.random(), v]).sort((a, b) => a[0] - b[0]).map(([, v]) => v);
const TROUBLE_TEXT = {
  pyjamas: n => `${n}'s pyjamas went missing`, book: n => `${n} didn't want that story`, dragon: () => 'goodnight to the dragon',
  water: n => `a glass of water for ${n}`, dance: n => `${n}'s dance party`, ipad: n => `${n} back on the iPad`, hide: n => `${n} hiding`,
};
/** Two to four things that go wrong tonight, each for one of the kids (the dragon is P's). */
function pickTroubles() {
  const n = 2 + Math.floor(Math.random() * 3), t = {};
  for (const name of shuffle(Object.keys(TROUBLE_TEXT)).slice(0, n)) {
    t[name] = { who: name === 'dragon' ? 'girl' : Math.random() < 0.5 ? 'girl' : 'boy' };
    if (name === 'pyjamas') t[name].spot = Math.floor(Math.random() * SEARCH.pyjamas.length);
    if (name === 'hide') t[name].spot = Math.floor(Math.random() * SEARCH.hide.length);
  }
  return t;
}
/** One child's turn in the bathroom: shower then teeth, and (at the same time) the pyjamas. */
function wash(who, m) {
  const N = KID[who], his = PRONOUN[who], with_ = c => c.bedtime.withYou(who), w = BED.wardrobe[who], lost = m.trouble.pyjamas && m.trouble.pyjamas.who === who;
  // lost pyjamas: not in the wardrobe, not in the first place you look either
  const decoy = lost && SEARCH.pyjamas.find((p, i) => i !== m.trouble.pyjamas.spot);
  const find = lost ? [
    { kind: 'use', level: w.level, at: w.at, label: `Look in ${N}'s wardrobe for ${his} pyjamas`, onDone: c => c.hud.toast(`Not there! Where are ${N}'s pyjamas?`) },
    { kind: 'use', level: 1, at: decoy.at, label: `Look by ${decoy.name}`, onDone: c => c.hud.toast('Not here either...') },
    { kind: 'pick', item: PJ[who], label: `There they are! Take ${N}'s pyjamas` }]
    : [{ kind: 'pick', item: PJ[who], label: `Get ${N}'s pyjamas from ${w.name}` }];
  return [
    { key: `shower-${who}`, title: `${N}: shower and teeth`, steps: [
      { kind: 'use', level: 1, at: BED.shower.at, can: with_, label: `Send ${N} into the shower`, onDone: c => c.bedtime.place(who, 1, BED.shower.spot, 'shower') },
      { kind: 'wait', dur: 8, label: `${N} is in the shower`, doneMessage: `${N} is out of the shower`, onDone: c => c.bedtime.follow(who) },
      { kind: 'use', level: 1, at: BED.basin.at, can: c => with_(c) && c.bedtime.kid(who).dressed, label: `Help ${N} brush ${his} teeth`,
        onDone: c => c.bedtime.place(who, 1, BED.basin.spot, 'teeth') },
      { kind: 'wait', dur: 6, label: `${N} is brushing ${his} teeth`, doneMessage: 'Sparkly clean!', onDone: c => c.bedtime.follow(who) }] },
    { key: `pyjamas-${who}`, title: `${N}: pyjamas`, steps: [
      ...find,
      { kind: 'drop', item: PJ[who], level: 1, at: BED.bathroom, place: [BED.bathroom[0], 0, BED.bathroom[1]], can: with_, label: `Give ${N} ${his} pyjamas`,
        onDone: c => { c.items[PJ[who]].visible = false; c.bedtime.pyjamas(who); } }] },
  ];
}
/** Into bed and lights out, for one child (the dragon and a drink of water if that's tonight's trouble). */
function bedJob(who, m) {
  const N = KID[who], b = BED.bed[who], sw = BED.switch[who], t = m.trouble, with_ = c => c.bedtime.withYou(who);
  const water = t.water && t.water.who === who, inBed = c => c.bedtime.is(who, 'bed');
  const side = who === 'girl' ? [1.05, 0, 7.75] : [2.85, 0, 3.6];
  return { key: `bed-${who}`, title: `${N}: bed and lights out`, steps: [
    ...(who === 'girl' && t.dragon ? [{ kind: 'use', level: 1, at: BED.terrarium, can: with_, label: 'Say goodnight to the dragon with P',
      onDone: c => c.hud.toast('P: "Night night, little dragon!"') }] : []),
    { kind: 'use', level: b.level, at: b.at, can: with_, label: `Tuck ${N} into ${b.name}`, onDone: c => {
      c.bedtime.place(who, b.level, b.lie, 'bed');
      if (water) { c.items.waterGlass.visible = true; c.hud.toast(`${N}: "I need a drink of water!"`); }
    } },
    ...(water ? [
      { kind: 'pick', item: 'waterGlass', label: 'Fetch a glass of water from the bathroom' },
      { kind: 'drop', item: 'waterGlass', level: b.level, at: b.at, place: side, label: `Give ${N} the water` }] : []),
    { kind: 'use', level: sw.level, at: sw.at, can: inBed, label: `Switch off the light in ${sw.name}`, onDone: c => {
      c.bedtime.light(who, false); m.lightsOut[who] = c.missions.minutes(); c.hud.toast(`Night night, ${N}!`);
    } }] };
}
/** Trouble that takes a child off on their own; done() when it's sorted. */
const INTERRUPT = {
  dance(c, who, minutes, done) {
    const N = KID[who];
    c.bedtime.walkTo(who, BED.dance.level, BED.dance.spot, 'dance');
    c.hud.toast(`${N}: "Dance party!" 🎶`);
    c.missions.add({ key: 'dance', urgent: true, due: minutes, title: `${N} is having a dance party!`, steps: [
      { kind: 'use', level: BED.dance.level, at: [BED.dance.spot[0], BED.dance.spot[2]],
        label: `Stop the dance party: "Come on, ${N}, bedtime!"`, onDone: cx => { cx.bedtime.follow(who); done(); } }] });
  },
  ipad(c, who, minutes, done) {
    const N = KID[who], s = BED.ipad[who];
    c.bedtime.place(who, s.level, s.seat, 'ipad');
    c.hud.toast(`Where's ${N} gone? On the iPad again!`);
    c.missions.add({ key: 'ipadAgain', urgent: true, due: minutes, title: `${N} is back on the iPad!`, steps: [
      { kind: 'use', level: s.level, at: s.at, label: `Take the iPad off ${N}`, onDone: cx => { cx.bedtime.follow(who); cx.hud.toast(`${N}: "Just one more minute..."`); done(); } }] });
  },
  hide(c, who, minutes, done) {
    const N = KID[who], spot = S.mission.trouble.hide.spot, real = SEARCH.hide[spot];
    const decoys = SEARCH.hide.filter((h, i) => i !== spot).slice(0, 2);
    c.bedtime.place(who, 1, [real.at[0], 0, real.at[1], 0], 'hide');
    c.hud.toast(`${N}: "You can't find me!"`);
    c.missions.add({ key: 'hide', urgent: true, due: minutes, title: `${N} is hiding!`, steps: [
      ...decoys.map(d => ({ kind: 'use', level: 1, at: d.at, label: `Look ${d.name}`, onDone: cx => cx.hud.toast('Not here...') })),
      { kind: 'use', level: 1, at: real.at, label: `Look ${real.name}`, onDone: cx => { cx.bedtime.follow(who); cx.hud.toast(`Found you, ${N}!`); done(); } }] });
  },
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

  wfh: {
    title: 'Work from home', who: ['dad', 'mum'],
    clock: { start: hm(7), end: hm(17), secondsPerMinute: 0.5 },          // 7:00 to 17:00 in five minutes
    spot: who => ({ name: NAMES[who], level: 1, start: [2.75, 2.35], facing: -Math.PI / 2 }),
    intro: 'Get up and ready: your first meeting is at 9:00',
    setup(c) { c.world.bigBed.mess(); },
    jobs: (spot, who) => [
      { title: 'Get up', steps: [{ kind: 'use', level: 1, at: [2.35, 1.9], label: 'Get out of bed', onDone: c => c.world.bigBed.make() }] },
      { title: 'Have a shower', steps: [{ kind: 'sit', stand: true, level: 1, fx: 'shower', at: [4.7, 7.85], seat: [5.2, 0, 8.5, 0], dur: 10, what: 'Showering', label: 'Have a shower' }] },
      { title: 'Get dressed', steps: [{ kind: 'sit', stand: true, level: 1, at: [4.0, 2.0], seat: [4.0, 0, 2.0, -Math.PI / 2], dur: 5, what: 'Getting dressed', label: 'Get dressed at the oak wardrobe' }] },
      { title: 'Have breakfast', steps: [{ kind: 'sit', at: [2.45, 7.2], seat: [2.15, 0.45, 7.2, -Math.PI / 2], dur: 8, what: 'Having breakfast', label: 'Sit down and have breakfast' }] },
      // the working day: all of these at once, in any order
      [
        { key: 'meet9', due: hm(9), title: 'Team meeting at 9:00', steps: [deskStep(who, 'meeting', 15, 'In the team meeting', 'Sit at your desk and join the team meeting', { notBefore: hm(8.5) })] },
        { key: 'mail', title: 'Answer your emails', steps: [deskStep(who, 'mail', 12, 'Answering emails', 'Sit at your desk and answer your emails')] },
        { key: 'doc', title: 'Write the report', steps: [deskStep(who, 'doc', 18, 'Writing the report', 'Sit at your desk and write the report')] },
        { key: 'lunch', title: 'Lunch (from 12:00)', steps: [
          { kind: 'use', at: [4.3, 1.6], notBefore: hm(12), label: 'Make a sandwich in the kitchen' },
          { kind: 'sit', at: [2.45, 7.2], seat: [2.15, 0.45, 7.2, -Math.PI / 2], dur: 10, what: 'Eating lunch', label: 'Sit down and eat your lunch' }] },
        { key: 'water', title: 'Drink a glass of water', steps: [{ kind: 'use', at: [5.0, 0.95], label: 'Pour a glass of water at the sink and drink it' }] },
        { key: 'meet14', due: hm(14), title: 'Project meeting at 14:00', steps: [deskStep(who, 'meeting', 15, 'In the project meeting', 'Sit at your desk and join the project meeting', { notBefore: hm(13.5) })] },
        { key: 'code', title: who === 'dad' ? 'Write some code' : 'Do the spreadsheets', steps: [deskStep(who, 'code', 18, 'Working', 'Sit at your desk and get some work done')] },
        coffeeJob(), snackJob(),
      ],
      { key: 'finish', title: 'Finish your day', steps: [{ kind: 'use', level: DESKS[who].level, at: DESKS[who].at, label: 'Shut down the laptop: done for the day!' }] },
    ],
    // whenever you've had a coffee or a snack, another is on offer a little later; the phone rings once with an urgent call
    onOptional(c, mission, job) {
      (mission.breaks ||= { coffee: 0, snack: 0 })[job.key]++;
      mission.later.push({ at: c.missions.minutes() + 90, job: job.key === 'coffee' ? coffeeJob() : snackJob() });
    },
    update(c, mission, minutes) {
      offerLater(c, mission, minutes);
      phoneRings(c, mission, minutes, mission.who);
    },
    result: (mission, arrived) => workResult(mission, arrived, ['meet9', 'meet14', 'urgent'], hm(17), 'Done for the day at'),
  },

  office: {
    title: 'Work at the office', who: ['dad'],
    clock: { start: hm(7), end: hm(17.5), secondsPerMinute: 0.5 },          // 7:00, home by 17:30
    spot: who => ({ name: NAMES[who], level: 1, start: [2.75, 2.35], facing: -Math.PI / 2 }),
    intro: 'Get ready and cycle to the office: your meeting with the boss is at 10:00',
    setup(c) { c.world.bigBed.mess(); },
    jobs: () => [
      { title: 'Get up', steps: [{ kind: 'use', level: 1, at: [2.35, 1.9], label: 'Get out of bed', onDone: c => c.world.bigBed.make() }] },
      { title: 'Get dressed', steps: [{ kind: 'sit', stand: true, level: 1, at: [4.0, 2.0], seat: [4.0, 0, 2.0, -Math.PI / 2], dur: 5, what: 'Getting dressed', label: 'Get dressed at the oak wardrobe' }] },
      { title: 'Have breakfast', steps: [{ kind: 'sit', at: [2.45, 7.2], seat: [2.15, 0.45, 7.2, -Math.PI / 2], dur: 6, what: 'Having breakfast', label: 'Sit down and have breakfast' }] },
      { title: 'Cycle to work', steps: [
        { kind: 'pick', item: 'dadBike', label: 'Take your bike from the terrace' },
        { kind: 'drop', item: 'dadBike', at: [4.35, -16.7], place: [4.35, 0, -16.95], label: 'Ride out of the back gate to work', onDone: c => c.missions.travel('office') }] },
      { key: 'clockIn', title: 'Clock in', steps: [{ kind: 'use', at: OFFICE.clock, label: 'Clock in at the machine by the door', onDone: c => c.hud.toast(`Clocked in at ${clockText(c.missions.minutes())}`) }] },
      // the working day: all of these at once, in any order
      [
        { key: 'boss', due: hm(10), title: 'Meeting with the boss at 10:00', steps: [
          { kind: 'sit', at: OFFICE.boss.at, seat: OFFICE.boss.seat, notBefore: hm(9.5), dur: 15, what: 'Meeting with the boss', label: "Sit down at the boss's round table" }] },
        { key: 'mail', title: 'Answer your emails', steps: [deskStep('office', 'mail', 12, 'Answering emails', 'Sit at your desk and answer your emails')] },
        { key: 'doc', title: 'Write the report', steps: [deskStep('office', 'doc', 18, 'Writing the report', 'Sit at your desk and write the report')] },
        { key: 'lunch', title: 'Lunch (from 12:00)', steps: [
          { kind: 'use', at: OFFICE.fridge, notBefore: hm(12), label: 'Get your lunch from the kitchen fridge' },
          { kind: 'sit', at: OFFICE.desk.at, seat: OFFICE.desk.seat, dur: 10, what: 'Eating lunch', label: 'Eat your lunch at your desk' }] },
        { key: 'water', title: 'Drink a glass of water', steps: [{ kind: 'use', at: OFFICE.sink, label: 'Pour a glass of water at the kitchen sink' }] },
        { key: 'team', due: hm(14), title: 'Team meeting at 14:00', steps: [
          { kind: 'sit', at: OFFICE.meeting.at, seat: OFFICE.meeting.seat, notBefore: hm(13.5), dur: 15, what: 'In the team meeting', label: 'Sit down in the meeting room' }] },
        { key: 'code', title: 'Write some code', steps: [deskStep('office', 'code', 18, 'Writing code', 'Sit at your desk and get some work done')] },
        coffeeJob(true), snackJob(true), loJob(),
      ],
      { key: 'finish', title: 'Finish your day', steps: [
        { kind: 'use', at: OFFICE.desk.at, label: 'Shut down your laptop: done for the day!' },
        { kind: 'use', at: OFFICE.clock, label: 'Clock out at the machine by the door', onDone: c => c.hud.toast(`Clocked out at ${clockText(c.missions.minutes())}`) }] },
      { key: 'home', title: 'Cycle home', steps: [
        { kind: 'pick', item: 'dadBike', label: 'Get your bike from the rack' },
        { kind: 'drop', item: 'dadBike', at: OFFICE.leave, place: [OFFICE.leave[0], 0, OFFICE.leave[1]], label: 'Ride home', onDone: c => c.missions.travel('home') },
        { kind: 'pick', item: 'dadBike', label: 'Wheel your bike in through the gate' },
        { kind: 'drop', item: 'dadBike', home: true, label: 'Put your bike back on the terrace' }] },
    ],
    onOptional(c, mission, job) {
      (mission.breaks ||= {})[job.key] = (mission.breaks[job.key] || 0) + 1;
      mission.later.push({ at: c.missions.minutes() + 90, job: job.key === 'coffee' ? coffeeJob(true) : job.key === 'snack' ? snackJob(true) : loJob() });
    },
    update(c, mission, minutes) {
      offerLater(c, mission, minutes);
      if (!mission.atWork) return;
      phoneRings(c, mission, minutes, 'office');
      fireDrill(c, mission, minutes);
    },
    result: (mission, arrived) => workResult(mission, arrived, ['boss', 'team', 'urgent'], hm(17.5), 'Home at'),
  },

  // Mum's day at her office: drive there, cross the road on the zebra, badge through the turnstiles, clock in
  // (a coffee at the café if she likes), up to her office floor by lift or stairs, the working day up there,
  // then back down, clock out, badge out, and drive home.
  officeMum: {
    title: 'Work at the office', who: ['mum'],
    // 7:00, home by 17:30. A slower clock than the other days: Mum's site is twice the walk of Dad's office
    clock: { start: hm(7), end: hm(17.5), secondsPerMinute: 0.75 },
    spot: who => ({ name: NAMES[who], level: 1, start: [2.75, 2.35], facing: -Math.PI / 2 }),
    intro: 'Drive to the office: your team meeting is at 10:00',
    setup(c) { c.world.bigBed.mess(); c.world.mumGate.close(); c.world.mumCar.visible = false; },
    jobs: () => [
      { title: 'Get up', steps: [{ kind: 'use', level: 1, at: [2.35, 1.9], label: 'Get out of bed', onDone: c => c.world.bigBed.make() }] },
      { title: 'Get dressed', steps: [{ kind: 'sit', stand: true, level: 1, at: [4.0, 2.0], seat: [4.0, 0, 2.0, -Math.PI / 2], dur: 5, what: 'Getting dressed', label: 'Get dressed at the oak wardrobe' }] },
      { title: 'Have breakfast', steps: [{ kind: 'sit', at: [2.45, 7.2], seat: [2.15, 0.45, 7.2, -Math.PI / 2], dur: 6, what: 'Having breakfast', label: 'Sit down and have breakfast' }] },
      { title: 'Drive to work', steps: [{ kind: 'use', at: [0.6, 13.25], label: 'Get in the car and drive to work', onDone: c => c.missions.travel('mumOffice') }] },
      { title: 'Cross the road', steps: [{ kind: 'use', at: MUM.zebra, label: 'Cross the road on the zebra crossing', onDone: c => c.hud.toast('Look left, look right... and across!') }] },
      { title: 'Badge in', steps: [{ kind: 'use', at: MUM.badgeIn, label: 'Show your badge at the turnstiles',
        onDone: c => { c.world.mumGate.open(); c.hud.toast('Beep! The turnstile lets you through'); } }] },
      [
        { key: 'clockIn', title: 'Clock in', steps: [{ kind: 'use', at: MUM.clock, label: 'Clock in at the machine inside the entrance',
          onDone: c => { c.world.mumGate.close(); c.hud.toast(`Clocked in at ${clockText(c.missions.minutes())}`); } }] },
        { key: 'cafe', optional: true, title: 'Coffee at the café (if you like)', steps: [
          { kind: 'sit', stand: true, at: MUM.cafe.at, seat: MUM.cafe.seat, dur: 5, what: 'Buying a coffee', label: 'Get a coffee to take up to the office' }] },
      ],
      // the working day upstairs: all of these at once, in any order
      [
        { key: 'meet10', due: hm(10), title: 'Team meeting at 10:00', steps: [
          { kind: 'sit', level: 1, at: MUM.meeting.at, seat: MUM.meeting.seat, notBefore: hm(9.5), dur: 15, what: 'In the team meeting', label: 'Sit down in the meeting room' }] },
        { key: 'mail', title: 'Answer your emails', steps: [deskStep('mumOffice', 'mail', 12, 'Answering emails', 'Sit at your desk and answer your emails')] },
        { key: 'doc', title: 'Do the spreadsheets', steps: [deskStep('mumOffice', 'doc', 18, 'Working on the spreadsheets', 'Sit at your desk and do the spreadsheets')] },
        { key: 'lunch', title: 'Lunch (from 12:00)', steps: [
          { kind: 'use', level: 1, at: MUM.fridge, notBefore: hm(12), label: 'Get your lunch from the kitchen fridge' },
          { kind: 'sit', level: 1, at: MUM.desk.at, seat: MUM.desk.seat, dur: 10, what: 'Eating lunch', label: 'Eat your lunch at your desk' }] },
        { key: 'water', title: 'Drink a glass of water', steps: [{ kind: 'use', level: 1, at: MUM.sink, label: 'Pour a glass of water at the kitchen sink' }] },
        { key: 'meet14', due: hm(14), title: 'Meeting with your manager at 14:00', steps: [
          { kind: 'sit', level: 1, at: MUM.meeting.at, seat: MUM.meeting.seat, notBefore: hm(13.5), dur: 15, what: 'Meeting with your manager', label: 'Sit down in the meeting room' }] },
        { key: 'code', title: 'Write the report', steps: [deskStep('mumOffice', 'doc', 18, 'Writing the report', 'Sit at your desk and write the report')] },
        coffeeJob('mum'), snackJob('mum'), loJob('mum'),
      ],
      { key: 'finish', title: 'Finish your day', steps: [
        { kind: 'use', level: 1, at: MUM.desk.at, label: 'Shut down your laptop: done for the day!' },
        { kind: 'use', at: MUM.clock, label: 'Clock out at the machine by the entrance', onDone: c => c.hud.toast(`Clocked out at ${clockText(c.missions.minutes())}`) },
        { kind: 'use', at: MUM.badgeOut, label: 'Badge out at the turnstiles', onDone: c => c.world.mumGate.open() }] },
      { key: 'home', title: 'Drive home', steps: [{ kind: 'use', at: MUM.car, label: 'Get in the car and drive home', onDone: c => c.missions.travel('homeByCar') }] },
    ],
    onOptional(c, mission, job) {
      (mission.breaks ||= {})[job.key === 'cafe' ? 'coffee' : job.key] = ((mission.breaks || {})[job.key === 'cafe' ? 'coffee' : job.key] || 0) + 1;
      if (job.key !== 'cafe') mission.later.push({ at: c.missions.minutes() + 90, job: job.key === 'coffee' ? coffeeJob('mum') : job.key === 'snack' ? snackJob('mum') : loJob('mum') });
    },
    update(c, mission, minutes) {
      offerLater(c, mission, minutes);
      if (!mission.atWork || !c.board.jobs.some(j => j.key === 'meet10')) return;   // only once she's up at her desk's day
      phoneRings(c, mission, minutes, 'mumOffice');
      fireDrill(c, mission, minutes, { at: MUM.assembly, label: 'Take the stairs down and go out to the assembly point in the garden', toast: 'Fire alarm! Take the stairs (not the lift) and go out to the garden' });
    },
    result: (mission, arrived) => workResult(mission, arrived, ['meet10', 'meet14', 'urgent'], hm(17.5), 'Home at'),
  },

  bedtime: {
    title: 'Bedtime', who: ['mum', 'dad'],
    clock: { start: hm(19.75), end: hm(21), secondsPerMinute: 4 },          // 19:45; lights out by 20:30 for three stars
    spot: who => ({ name: NAMES[who], level: 0, start: [1.8, 2.3], facing: -Math.PI / 2 }),
    intro: 'Bedtime! Lights out in both rooms by 20:30 for three stars',
    setup(c) {
      c.bedtime.start();
      const m = S.mission;
      m.trouble = pickTroubles(); m.lightsOut = {};
      for (const who of ['girl', 'boy']) {   // the pyjamas are in the wardrobes, unless one pair has gone missing
        const it = c.items[PJ[who]];
        it.visible = true;
        if (m.trouble.pyjamas && m.trouble.pyjamas.who === who) {
          const where = SEARCH.pyjamas[m.trouble.pyjamas.spot];
          c.world.upstairs.attach(it); it.position.set(...where.place); it.rotation.set(0, 0.4, 0); it.userData.level = 1;
        }
      }
    },
    jobs: () => [
      ['girl', 'boy'].map(who => ({ key: `ipad-${who}`, title: `${KID[who]}: iPad off`, steps: [
        { kind: 'use', at: BED.sofa[who].at, label: `Tell ${KID[who]} to switch off ${PRONOUN[who]} iPad`,
          onDone: c => { c.bedtime.follow(who); c.hud.toast(`${KID[who]}: "Okaaay..."`); } }] })),
      { key: 'first', title: 'Upstairs to the bathroom', steps: [
        { kind: 'choose', choose: 'bedFirst', level: 1, at: BED.bathDoor, can: c => c.bedtime.withYou('girl') && c.bedtime.withYou('boy'),
          label: 'Who goes in the shower first?', message: o => `${o.label} first!`, onChoose: id => { S.mission.first = id; } }] },
      (c, m) => wash(m.first, m),
      (c, m) => wash(other(m.first), m),
      (c, m) => ({ key: 'story', title: 'Read a bedtime story', steps: [
        { kind: 'choose', choose: 'book', level: 1, at: BED.story.at, can: bothWithYou, label: 'Pick a bedtime story', message: o => `"${o.label}" it is!`,
          onChoose: (id, cx) => {
            const t = m.trouble.book;
            if (!t || t.refused) return true;
            t.refused = true; cx.hud.toast(`${KID[t.who]}: "Not that one! We had that yesterday!"`);
            return false;
          } },
        { kind: 'sit', level: 1, at: BED.story.at, seat: BED.story.seat, kidsSit: BED.story.kids, can: bothWithYou, dur: 10,
          what: 'Reading the story', label: "Sit on P's bed and read the story" }] }),
      (c, m) => ['girl', 'boy'].map(who => bedJob(who, m)),
      { key: 'down', title: 'Go back downstairs', steps: [
        { kind: 'use', level: 1, at: STAIRS.TOP.at, label: 'Tiptoe back downstairs', onDone: c => { c.levels.go(0); c.bedtime.downstairs(); } }] },
    ],
    update(c, m, minutes) {
      if (!m.first || m.done) return;
      if (m.washFrom === undefined) m.washFrom = minutes;
      // trouble that takes a child off on their own: one at a time, while they're with you, before the story
      for (const name of ['dance', 'ipad', 'hide']) {
        const t = m.trouble[name];
        if (!t || t.done) continue;
        if (t.at === undefined) t.at = m.washFrom + 2 + Math.random() * 10;
        if (minutes < t.at || Object.values(m.trouble).some(x => x.active)) continue;
        if (m.doneAt.story !== undefined || (S.sitting && S.sitting.step.kidsSit)) { t.done = t.skipped = true; continue; }   // too late now
        if (!c.bedtime.withYou(t.who)) continue;   // busy (in the shower): a bit later
        t.done = t.active = true;
        INTERRUPT[name](c, t.who, minutes, () => { t.active = false; });
      }
    },
    result(m) {
      const out = Math.max(m.lightsOut.girl || 0, m.lightsOut.boy || 0);
      const stars = out <= hm(20.5) ? 3 : out <= hm(20.75) ? 2 : 1;
      const happened = Object.entries(m.trouble).filter(([, t]) => !t.skipped).map(([name, t]) => TROUBLE_TEXT[name](KID[t.who]));
      return { stars, minutes: out, title: stars === 3 ? 'Sweet dreams!' : stars === 2 ? 'Night night!' : 'Finally asleep!',
        stats: `Lights out at ${clockText(out)}.${happened.length ? ` Tonight: ${happened.join(', ')}.` : ''}` };
    },
  },

  print3d: {
    title: '3D printing', who: ['dad'],
    spot: () => ({ name: 'Dad', level: 1, start: [4.2, 1.6], facing: -Math.PI / 2 }),
    intro: 'Pick something to print on the laptop at your desk',
    setup(c) { c.printing.reset(); },
    jobs: () => [
      { title: 'Pick a design', steps: [
        { kind: 'choose', choose: 'design', level: 1, at: DAD_DESK, label: 'Open the laptop and pick a design', message: o => `${o.label}: let's print it!` }] },
      { title: 'Order some filament', steps: [
        { kind: 'choose', choose: 'filament', level: 1, at: DAD_DESK, label: 'Order a spool of filament on the laptop', message: o => `${o.label} filament ordered` }] },
      { title: 'Collect the delivery', steps: [
        { kind: 'wait', delivery: 'filament', dur: 20, label: 'Wait for the courier', doneMessage: 'Ding-dong! Your filament is here' },
        { kind: 'pick', item: 'filamentBox', at: FOOD_DELIVERY.door, label: 'Answer the door and take the parcel' }] },
      { title: 'Load the printer', steps: [
        { kind: 'drop', item: 'filamentBox', at: PRINTER.at, place: [PRINTER.at[0], 0, PRINTER.at[1]], label: 'Load the filament into the printer by the sofa',
          onDone: c => { c.items.filamentBox.visible = false; c.printing.load(S.mission.choices.filament); } }] },
      { title: 'Print it', steps: [
        { kind: 'use', level: 1, at: DAD_DESK, label: 'Send the design to the printer from the laptop', onDone: c => c.printing.start(S.mission.choices.design) },
        { kind: 'wait', print: true, dur: 35, label: 'The printer is printing: watch it by the sofa', doneMessage: 'Ding! The print is finished' }] },
      (c, mission) => {
        const d = DESIGNS.find(k => k.id === mission.choices.design) || DESIGNS[0];
        return { title: `Put the ${d.name} where it belongs`, steps: [
          { kind: 'pick', item: 'printModel', at: PRINTER.at, label: `Take the ${d.name} out of the printer` },
          { kind: 'drop', item: 'printModel', ...d.goes }] };
      },
    ],
    result(mission) {
      const d = DESIGNS.find(k => k.id === mission.choices.design) || DESIGNS[0];
      const c = COLOURS.find(k => k.id === mission.choices.filament) || COLOURS[0];
      return { title: 'Printed!', stats: `You printed a ${c.label.toLowerCase()} ${d.name}.`, record: d.id };
    },
  },
};

export function createMissions(ctx) {
  const { board, hud, player, levels, days } = ctx;
  const $ = id => document.getElementById(id);
  const el = { box: $('missionDone'), eyebrow: $('missionDoneEyebrow'), title: $('missionDoneTitle'), stars: $('missionStars'),
               stats: $('missionDoneStats'), best: $('missionBest'), again: $('missionAgain'), back: $('missionBack') };
  let jobs = [], next = 0, shownMinute = -1, pending = new Set(), extra = 0;

  const now = () => S.mission.clock.start + S.mission.t / S.mission.clock.secondsPerMinute;
  function showClock(force) {
    if (!S.mission.clock) { if (force) hud.setDayLabel(MISSIONS[S.mission.id].title); return; }
    const m = Math.floor(now());
    if (!force && m === shownMinute) return;
    shownMinute = m;
    hud.setDayLabel(`${MISSIONS[S.mission.id].title} · ${clockText(m)}`);
  }

  /** Start a mission as one of the family (the school run: one of the kids; 3D printing: Dad). */
  function start(id, who) {
    const m = MISSIONS[id], kid = m && (m.spot ? m.spot(who) : KIDS[who]);
    if (!m || !kid) return;
    if (S.sitting) ctx.sitting.standUp();
    if (S.laptop) ctx.laptop.close();
    if (ctx.home) ctx.home.close();
    el.box.hidden = true;
    S.mission = { id, who, clock: m.clock, t: 0, done: false, choices: {}, doneAt: {}, due: {}, later: [] };
    S.carrying = null; S.dayOver = false; S.wiping = null;
    hud.hideDayComplete();
    board.clear();
    resetItems(ctx.items);
    m.setup(ctx, kid);
    player.setCharacter(who);
    levels.show(kid.level);
    player.group.position.x = kid.start[0]; player.group.position.z = kid.start[1]; player.group.rotation.y = kid.facing;
    jobs = m.jobs(kid, who);
    next = 0; shownMinute = -1; pending = new Set(); extra = 0;
    addNext();
    showClock(true);
    hud.toast(m.clock && !m.intro ? `${m.title}: the bell rings at ${clockText(m.clock.end)}!` : `${m.title}: ${m.intro}`);
  }

  /** Put one mission job on the list. Required ones have to be done before the mission moves on; optional
   *  ones (a coffee) are there if you want them. */
  /** The fire drill held everything up: an urgent call that was waiting gets that much longer. */
  function moveDeadlines(by) {
    for (const job of board.jobs) {
      if (job.key !== 'urgent' || board.finished(job) || job.due === undefined) continue;
      job.due += by; S.mission.due.urgent = job.due;
      job.title = `Urgent call by ${clockText(job.due)}!`;
      hud.toast(`The urgent call can wait till ${clockText(job.due)}`);
      board.refresh();
    }
  }

  function put(j, id, { optional = false } = {}) {
    const job = board.add({ ...j, id, mission: true, optional: optional || !!j.optional });
    if (j.due !== undefined) S.mission.due[j.key] = j.due;
    if (!job.optional) pending.add(job);
    return job;
  }

  /** The next part of the mission joins the list: one job, or several at once (a job can depend on choices
   *  made earlier). */
  function addNext() {
    const k = next++, entry = typeof jobs[k] === 'function' ? jobs[k](ctx, S.mission) : jobs[k];
    (Array.isArray(entry) ? entry : [entry]).forEach((j, n) => put(j, `${S.mission.id}-${k}-${n}`));
  }

  board.onFinished(job => {
    if (!S.mission || !job.mission || S.mission.done) return;
    const m = MISSIONS[S.mission.id];
    if (job.key) S.mission.doneAt[job.key] = S.mission.clock ? now() : S.mission.t;
    if (job.optional) { if (m.onOptional) m.onOptional(ctx, S.mission, job); return; }
    if (job.key === 'drill') { S.mission.drill = false; moveDeadlines(now() - S.mission.drillFrom); }   // the all-clear
    pending.delete(job);
    if (pending.size) return;
    if (next < jobs.length) { addNext(); return; }
    finish();
  });

  function finish() {
    const mission = S.mission, m = MISSIONS[mission.id];
    if (!m.clock) return finishForFun(mission, m);
    const arrived = now(), r = m.result ? m.result(mission, arrived) : null, stars = r ? r.stars : m.stars(arrived);
    const at = r && r.minutes !== undefined ? r.minutes : arrived;   // bedtime: when the lights went out
    el.stars.hidden = false; el.again.textContent = 'Try again';
    mission.done = true;
    const best = ((BEST[mission.id] ||= {})[mission.who]);
    const better = !best || stars > best.stars || (stars === best.stars && at < best.minutes);
    if (better) { BEST[mission.id][mission.who] = { stars, minutes: at }; saveBest(); }
    const late = arrived >= m.clock.end;
    el.eyebrow.textContent = `${m.title} · ${NAMES[mission.who]}`;
    el.title.textContent = r ? r.title : late ? 'Late for school!' : stars === 3 ? 'Early bird!' : 'Just in time!';
    el.stars.textContent = '★'.repeat(stars) + '☆'.repeat(3 - stars);
    el.stars.setAttribute('aria-label', `${stars} of 3 stars`);
    el.stats.textContent = r ? r.stats : `You got to school at ${clockText(arrived)}. The bell rings at ${clockText(m.clock.end)}.`;
    const b = BEST[mission.id][mission.who];
    el.best.textContent = better ? 'A new best!' : `Your best: ${'★'.repeat(b.stars)} at ${clockText(b.minutes)}`;
    el.box.hidden = false;
    el.again.focus();
  }

  /** A mission with no clock: no stars, just what you made, and everything you've made so far. */
  function finishForFun(mission, m) {
    mission.done = true;
    const r = m.result(mission), rec = ((BEST[mission.id] ||= {})[mission.who] ||= { made: [] });
    if (!rec.made.includes(r.record)) { rec.made.push(r.record); saveBest(); }
    el.eyebrow.textContent = `${m.title} · ${NAMES[mission.who]}`;
    el.title.textContent = r.title;
    el.stars.hidden = true;
    el.stats.textContent = r.stats;
    el.best.textContent = `Made so far: ${rec.made.map(id => (DESIGNS.find(d => d.id === id) || { name: id }).name).join(', ')}`;
    el.again.textContent = 'Print something else';
    el.box.hidden = false;
    el.again.focus();
  }

  /** Leave the mission and pick the day up again. */
  function end() {
    if (!S.mission) return;
    S.mission = null;
    if (S.laptop) ctx.laptop.close();
    if (ctx.printing) ctx.printing.reset();
    ctx.world.car.visible = true; ctx.world.mumCar.visible = false; ctx.world.mumGate.close();   // Mum's car back home
    if (ctx.bedtime) ctx.bedtime.end();   // daylight again, the kids back to normal
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
      const m = MISSIONS[S.mission.id];
      if (m.update) m.update(ctx, S.mission, now());
    },
    /** Cycle to the office or back home: the bike goes in the rack (or back through the gate), the clock moves
     *  on a quarter of an hour. */
    travel(where) {
      const bike = ctx.items.dadBike, scene = ctx.stage.scene;
      levels.show(0);
      if (where === 'mumOffice' || where === 'homeByCar') {   // Mum drives: the car leaves the house and turns up in the car park
        const there = where === 'mumOffice';
        ctx.world.car.visible = !there; ctx.world.mumCar.visible = there;
        if (there) { player.group.position.set(MUM.park[0], 0, MUM.park[1]); player.group.rotation.y = 0; }
        else { player.group.position.set(0.6, 0, 13.0); player.group.rotation.y = Math.PI; }
        S.mission.atWork = there;
        if (S.mission.clock) S.mission.t += 20 * S.mission.clock.secondsPerMinute;
        if (ctx.view) ctx.view.reset();
        hud.toast(there ? `You drive to the office: ${clockText(now())}` : `Home again: ${clockText(now())}`);
        return;
      }
      if (where === 'office') {
        scene.attach(bike); bike.position.set(OFFICE.rack[0], 0, OFFICE.rack[1]); bike.rotation.set(0, 0, 0);
        player.group.position.set(OFFICE.arrive[0], 0, OFFICE.arrive[1]); player.group.rotation.y = Math.PI;
        S.mission.atWork = true;
      } else {
        scene.attach(bike); bike.position.set(4.35, 0, -16.55); bike.rotation.set(0, Math.PI, 0);
        player.group.position.set(4.35, 0, -15.8); player.group.rotation.y = 0;
        S.mission.atWork = false;
      }
      bike.userData.level = 0;
      if (S.mission.clock) S.mission.t += 15 * S.mission.clock.secondsPerMinute;
      if (ctx.view) ctx.view.reset();
      hud.toast(where === 'office' ? `You cycle to the office: ${clockText(now())}` : `Home again: ${clockText(now())}`);
    },
    /** The banner during a fire drill. */
    banner() {
      if (!S.mission || !S.mission.drill) return null;
      const j = board.jobs.find(k => k.key === 'drill'), s = j && board.step(j);
      return s && s.kind === 'wait' ? `Fire drill: wait for the all-clear · ${Math.max(0, Math.ceil(s.dur - (s.prog || 0)))}s` : 'Fire alarm! Out through the fire door to the assembly point';
    },
    /** Add a job to the running mission (an urgent call, another coffee). */
    add(j, opts) { return put(j, `${S.mission.id}-x${extra++}`, opts); },
    /** The mission clock, in minutes since midnight. */
    minutes: () => (S.mission && S.mission.clock ? now() : 0),
    /** The best result for a mission and player: { stars, minutes } (the school run), { made: [...] } (3D printing), or undefined. */
    best: (id, who) => BEST[id] && BEST[id][who],
    get active() { return S.mission; },
  };
}

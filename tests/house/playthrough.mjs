// Play-through test, no browser needed:  npm run test:house
// Boots the game against a stand-in three.js and plays it like a kid would, day after day: walks to every
// job step (checking it can be reached on foot from the front path), finishes every job including the
// post, parcel and power-cut events, waits for "Day complete" and starts the next day. Along the way it
// checks the day rules and that the house is set up to match each day's list.
// Exits with code 1 if anything is unreachable, a job can't be finished, or a day rule is broken.
const listeners = {};
const el = () => ({
  classList: { add() {}, remove() {}, toggle() {}, contains: () => false }, style: {}, dataset: {},
  addEventListener() {}, setAttribute() {}, setPointerCapture() {}, append() {}, replaceChildren() {}, focus() {},
  getBoundingClientRect: () => ({ left: 0, top: 0, width: 128, height: 128 }), textContent: '', hidden: false,
});
const ctx2d = new Proxy({}, { get: (t, k) => k === 'createLinearGradient' ? () => ({ addColorStop() {} }) : (() => {}), set: () => true });
globalThis.window = globalThis;
globalThis.innerWidth = 390; globalThis.innerHeight = 844; globalThis.devicePixelRatio = 3;
globalThis.addEventListener = (t, f) => { (listeners[t] ||= []).push(f); };
globalThis.matchMedia = () => ({ matches: false });
globalThis.location = { search: '?season=autumn' };   // the same season whatever month the test runs in (snow is played on the extra day)
globalThis.document = {
  addEventListener() {}, querySelector: () => null,
  getElementById: () => el(), querySelectorAll: () => [ { ...el(), dataset: { c: 'dad' } }, { ...el(), dataset: { c: 'girl' } } ],
  createElement: tag => tag === 'canvas' ? { width: 0, height: 0, getContext: () => ctx2d } : el(),
};
const raf = []; globalThis.requestAnimationFrame = f => raf.push(f);
const store = new Map();
globalThis.localStorage = { getItem: k => store.get(k) ?? null, setItem: (k, v) => store.set(k, String(v)), removeItem: k => store.delete(k) };

const errors = [];
await import(new URL('../../house/js/main.js', import.meta.url));
const { blocked } = await import(new URL('../../house/js/core/collision.js', import.meta.url));
const { REACH, LEVEL_HEIGHT } = await import(new URL('../../house/js/config.js', import.meta.url));
const { DAY_JOBS } = await import(new URL('../../house/js/days/planner.js', import.meta.url));
const { SWEEPS } = await import(new URL('../../house/js/systems/sweeping.js', import.meta.url));
const { HOOVER_SPOTS } = await import(new URL('../../house/js/systems/hoovering.js', import.meta.url));
const { BOX_SPOTS } = await import(new URL('../../house/js/jobs/jobs.js', import.meta.url));
const G = globalThis.house, S = G.S;
const frame = () => { const f = raf.shift(); if (!f) throw new Error('no frame scheduled'); f(); };
for (let i = 0; i < 5; i++) frame();
console.log('boot ok, jobs:', G.board.jobs.length, 'renders:', G.stage.renderer.frames);

// --- reachability: flood-fill the walkable space on each floor, from the front path downstairs and
// from the top of the stairs upstairs
const RES = 0.05, X0 = -6.25, Z0 = -17.3, NX = Math.round(18 / RES), NZ = Math.round(30.7 / RES);
const idx = (i, k) => k * NX + i;
function walkable(level, sx, sz) {
  const seen = new Uint8Array(NX * NZ), out = [];
  const start = [Math.round((sx - X0) / RES), Math.round((sz - Z0) / RES)];
  if (blocked(X0 + start[0] * RES, Z0 + start[1] * RES, level)) errors.push(`floor ${level}: start spot (${sx}, ${sz}) is blocked`);
  const q = [start]; seen[idx(...start)] = 1;
  while (q.length) {
    const [i, k] = q.pop(); out.push([X0 + i * RES, Z0 + k * RES]);
    for (const [di, dk] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const ni = i + di, nk = k + dk;
      if (ni < 0 || nk < 0 || ni >= NX || nk >= NZ || seen[idx(ni, nk)]) continue;
      seen[idx(ni, nk)] = 1;
      if (!blocked(X0 + ni * RES, Z0 + nk * RES, level)) q.push([ni, nk]);
    }
  }
  return out;
}
const cellsOn = [walkable(0, 3.92, 10.6), walkable(1, 4.1, 4.55), walkable(2, 4.25, 4.6)];
console.log('walkable cells: downstairs', cellsOn[0].length, 'upstairs', cellsOn[1].length, 'attic', cellsOn[2].length);
// every upstairs doorway can be walked straight through, 0.5 m either side (furniture mustn't block it)
for (const [room, x, z, axis] of [['dressing room', 3.85, 3.95, 'z'], ['bathroom', 3.875, 6.9, 'z'], ['main bedroom', 3.26, 4.5, 'x'], ["kids' room", 3.26, 6.225, 'x']]) {
  for (let d = -0.5; d <= 0.5; d += 0.1) {
    const px = axis === 'x' ? x + d : x, pz = axis === 'z' ? z + d : z;
    if (blocked(px, pz, 1)) { errors.push(`upstairs: the ${room} doorway is blocked at (${px.toFixed(2)}, ${pz.toFixed(2)})`); break; }
  }
}
// the attic: every doorway can be walked through and every room reached from the top of the stairs
for (const [room, x, z, axis] of [["Dude's room", 4.15, 3.94, 'z'], ['office', 3.025, 4.7, 'x']]) {
  for (let d = -0.5; d <= 0.5; d += 0.1) {
    const px = axis === 'x' ? x + d : x, pz = axis === 'z' ? z + d : z;
    if (blocked(px, pz, 2)) { errors.push(`attic: the ${room} doorway is blocked at (${px.toFixed(2)}, ${pz.toFixed(2)})`); break; }
  }
}
for (const [room, x, z] of [["Dude's room", 2.0, 2.4], ['office', 2.0, 4.8], ['hall by the cupboards', 3.6, 6.9]]) {
  if (!cellsOn[2].some(c => Math.hypot(c[0] - x, c[1] - z) < 0.1)) errors.push(`attic: can't walk to the ${room} (${x}, ${z})`);
}
// the charging cable lies on top of the ground all the way, not sunk into it (only the ends rise up)
{
  const THREE = await import('three');
  const { cablePoints, cableGround, CablePath } = await import(new URL('../../house/js/systems/charging.js', import.meta.url));
  const surface = (x, z) => (z > 13.55 && z < 13.68 ? 0.09 : 0.02) + 0.018;   // top of the kerb / path, plus the cable's radius
  for (const [what, end, share] of [['plugged in', new THREE.Vector3(2.2, 0.7, 13.97), 0.7], ['in your hand', new THREE.Vector3(3.6, 0.72, 11.5), 0.5]]) {
    const path = new CablePath(cablePoints(end)), v = new THREE.Vector3();
    let onGround = 0, under = 0; const N = 400;
    for (let i = 0; i <= N; i++) {
      path.getPoint(i / N, v);
      if (v.y < surface(v.x, v.z)) under++;
      else if (v.y < cableGround(v.x, v.z) + 0.01) onGround++;
    }
    if (under) errors.push(`charging cable (${what}): ${under} of ${N + 1} points are under the ground`);
    if (onGround < N * share) errors.push(`charging cable (${what}): only ${onGround} of ${N + 1} points lie on the ground`);
  }
}
function standNear(p, level = S.level) {
  let best = null, bd = 1e9;
  for (const c of cellsOn[level]) { const d = Math.hypot(c[0] - p[0], c[1] - p[1]); if (d < bd) { bd = d; best = c; } }
  return { cell: best, dist: bd };
}

// --- getting about: walk to the stairs and use the button, like a player would
const goTo = cell => { G.player.group.position.x = cell[0]; G.player.group.position.z = cell[1]; };
const STAIRS = {
  '0>1': { at: [4.4, 6.05], label: 'Go upstairs' }, '1>0': { at: [4.15, 4.45], label: 'Go downstairs' },
  '1>2': { at: [4.6, 6.5], label: 'Go up to the attic' }, '2>1': { at: [4.3, 4.55], label: 'Go downstairs' },
};
let stairTrips = 0;
function travel(level) {
  while (S.level !== level) {
    const from = S.level, next = from + Math.sign(level - from), here = STAIRS[`${from}>${next}`];
    goTo(standNear(here.at).cell); frame();
    const n = G.board.nearestAction(G.player.group.position);
    if (!n || !n.fixed || n.step.label !== here.label) { errors.push(`stairs: button shows "${n ? n.step.label : 'nothing'}" instead of "${here.label}"`); G.levels.show(next); }
    else G.board.act(n);
    stairTrips++;
    frame();
    if (S.level !== next) { errors.push(`stairs didn't take me from floor ${from} to ${next}`); return; }
  }
}

// --- playing one job, step by step
function doStep(job) {
  const s = job.steps[job.i];
  if (s.kind === 'mow') travel(0);
  if (s.kind === 'hoover') travel(s.level || 0);
  if (s.kind === 'mow') {
    for (const c of G.world.lawn.cells) { if (job.steps[job.i] !== s) break; G.player.group.position.set(c.x, 0, c.z - 0.95); G.player.group.rotation.y = 0; frame(); }
    return job.steps[job.i] !== s || 'lawn never finished';
  }
  if (s.kind === 'hoover') {
    for (const [x, z] of HOOVER_SPOTS[s.level || 0]) {
      // stand about a hoover's length away and point the hoover at the dust
      const { cell } = standNear([x, z - 0.55]); goTo(cell);
      G.player.group.rotation.y = Math.atan2(x - cell[0], z - cell[1]); frame();
    }
    return job.steps[job.i] !== s || 'dust left behind';
  }
  if (s.kind === 'rake' || s.kind === 'shovel') {   // walk the piles of leaves / snow with the rake or shovel
    travel(0);
    for (const [x, z] of SWEEPS[s.kind].spots) {
      const { cell } = standNear([x, z - 0.55]); goTo(cell);
      G.player.group.rotation.y = Math.atan2(x - cell[0], z - cell[1]); frame();
    }
    return job.steps[job.i] !== s || `${s.kind === 'rake' ? 'leaves' : 'snow'} left behind`;
  }
  if (s.kind === 'charge' || s.kind === 'wait') { for (let n = 0; n < 2500 && job.steps[job.i] === s; n++) { if (!S.powerOn) fixPower(); frame(); } return job.steps[job.i] !== s || 'never finished running'; }

  travel(G.board.levelOf(s));
  const p = stepAt(s), { cell, dist } = standNear(p);
  if (dist > REACH - 0.02) return `can't get within reach of [${p.map(v => v.toFixed(2))}] (closest ${dist.toFixed(2)} m)`;
  goTo(cell); frame();
  const n = G.board.nearestAction(G.player.group.position);
  if (!n || n.step !== s) return `button shows "${n ? n.step.label : 'nothing'}" instead of "${s.label}"`;
  G.board.act(n);
  if (s.kind === 'sort') {   // the sorting card: pick the right pile every time (and try a wrong one first)
    const wrong = { white: 'dark', colour: 'white', dark: 'colour' }[G.sorting.answer()];
    G.sorting.choose(wrong);
    for (let k = 0; k < 30 && S.sorting; k++) G.sorting.choose(G.sorting.answer());
    frame();
    return job.steps[job.i] !== s || 'sorting never finished';
  }
  if (s.kind === 'wipe') {   // circles with the stick
    for (let k = 0; k < 400 && S.wiping; k++) G.wiping.feed({ x: Math.cos(k * 0.4), y: Math.sin(k * 0.4), len: 1 });
    frame();
    if (G.world.dirt[s.dirt].visible) return 'window still dirty';
    return job.steps[job.i] !== s || 'wiping never finished';
  }
  if (s.kind === 'sit') {
    const onFloor = () => G.player.group.position.y === S.level * LEVEL_HEIGHT;
    if (!onFloor()) return 'left the floor when starting';
    for (let k = 0; k < 2000 && job.steps[job.i] === s; k++) {
      if (!S.powerOn && (s.screen || s.power)) { G.sitting.standUp(); fixPower(); return doStep(job); }
      frame();
    }
    if (job.steps[job.i] === s) return 'sitting never finished';
    if (!onFloor()) return 'left the floor after finishing';
  }
  frame();
  return true;
}
function fixPower() {
  const f = G.board.find('fuses');
  if (f && f.i < f.steps.length) { const r = doStep(f); if (r !== true) errors.push('fuses: ' + r); }
}
const stepAt = s => s.at || (s.kind === 'drop' && s.home
  ? [G.items[s.item].userData.home.pos[0], G.items[s.item].userData.home.pos[2]]
  : (() => { const v = { x: 0, y: 0, z: 0, set(x, y, z) { this.x = x; this.y = y; this.z = z; return this; } }; G.items[s.item].getWorldPosition(v); return [v.x, v.z]; })());

/** Play every job on today's list (and any that pop up) until the Day complete screen shows. */
const events = {};
function playDay(label) {
  for (let round = 0; round < 40 && !S.dayOver; round++) {
    for (const job of G.board.jobs.filter(j => j.i < j.steps.length)) {
      if (job.event) events[job.id] = (events[job.id] || 0) + 1;
      let guard = 0;
      while (job.i < job.steps.length && guard++ < 10) {
        if (!S.powerOn && job.id !== 'fuses') fixPower();
        const before = job.i, r = doStep(job);
        if (r !== true) { errors.push(`${label} ${job.id} step ${before + 1} (${job.steps[before].kind}): ${r}`); job.i = job.steps.length; S.carrying = null; break; }
      }
    }
    for (let k = 0; k < 60 && !S.dayOver; k++) frame();   // time passes: post, parcel and power cuts can turn up
  }
  if (!S.dayOver) errors.push(`${label}: Day complete screen never appeared`);
}

// --- play 12 days in a row, checking the day rules and the house setup each morning
S.started = true;
G.home.close();   // the game opens on the home screen; Play
const played = new Set(), dayLog = [], binTitles = [];
const kerb = id => G.items[id].position.z > 12.5;
const binIds = ['binBlue', 'binYellow', 'binBlack', 'binBrown'];
for (let n = 1; n <= 12; n++) {
  const day = G.days.day, label = `day ${day}`;
  const plan = G.board.jobs.filter(j => !j.event).map(j => j.id);
  dayLog.push(plan);
  plan.forEach(id => played.add(id));
  if (plan.length < DAY_JOBS.min || plan.length > DAY_JOBS.max) errors.push(`${label}: ${plan.length} jobs, want ${DAY_JOBS.min}-${DAY_JOBS.max}`);

  if (S.level !== 0 || G.world.upstairs.visible) errors.push(`${label}: didn't start downstairs`);
  // the house matches the list
  const has = id => plan.includes(id);
  if (has('mow') !== (G.world.lawn.cutCount === 0)) errors.push(`${label}: lawn ${G.world.lawn.cutCount === 0 ? 'long' : 'cut'} but mowing ${has('mow') ? 'is' : "isn't"} on the list`);
  if (has('binsIn') !== binIds.some(kerb)) errors.push(`${label}: bins at the kerb ${binIds.some(kerb)} but bins-in on the list ${has('binsIn')}`);
  if (has('jacket') !== (G.items.jacket.position.z < 3)) errors.push(`${label}: jacket on the sofa doesn't match the list`);
  if (has('windows') !== G.world.dirt[0].visible) errors.push(`${label}: dirty windows don't match the list`);
  if (has('shopping') !== G.items.shopping.visible) errors.push(`${label}: shopping bag doesn't match the list`);
  if (n > 1) {
    const yesterday = dayLog[n - 2];
    if (yesterday.includes('binsOut') && !has('binsIn')) errors.push(`${label}: bins went out yesterday but aren't coming back in`);
    if (has('binsIn') && !yesterday.includes('binsOut')) errors.push(`${label}: bins coming in but they didn't go out yesterday`);
  }

  if (has('binsOut')) binTitles.push(G.board.find('binsOut').title);
  if (n === 3) G.power.cut();   // a power cut on day 3 for sure; the day can't finish until the fuses are reset
  playDay(label);
  if (n === 3 && !S.powerOn) errors.push('day 3 finished with the power still off');
  const saved = JSON.parse(store.get('fordHouse.save.v1'));
  if (saved.day !== day || !saved.today.completed || saved.today.done.length !== plan.length) errors.push(`${label}: save says day ${saved.day}, ${saved.today.done.length}/${plan.length} done`);
  if (n === 1) { const s1 = saved.lastDone; if (!plan.every(id => s1[id] === day)) errors.push(`${label}: not every job recorded as done`); }
  console.log(`${label}: ${plan.length} jobs${has('binsOut') ? ', bin day' : ''}${has('binsIn') ? ', bins back in' : ''}${has('mow') ? ', mowing' : ''}`);
  G.days.next();
}

// alternating bins: two bin days in a row put out different pairs
const binDays = dayLog.map((p, i) => p.includes('binsOut') ? i : -1).filter(i => i >= 0);
if (binDays.length < 2) errors.push(`only ${binDays.length} bin days in 12`);
if (binTitles.some((t, i) => i > 0 && t === binTitles[i - 1])) errors.push(`bin pairs didn't alternate: ${binTitles.join(' / ')}`);
console.log('bin days:', binTitles.join(' / '));
console.log('surprise events over 12 days:', JSON.stringify(events));
if (!events.post || !events.parcel || !events.fuses) errors.push('expected the post, a parcel and a power cut at least once in 12 days');
if (events.fuses > 3) errors.push(`${events.fuses} power cuts in 12 days, expected at most one a day and usually fewer`);

// --- then a day made of every job that hasn't come up yet, so every job is played at least once
const pool = (await import(new URL('../../house/js/jobs/rules.js', import.meta.url))).POOL_RULES.map(r => r.id);
const missing = pool.filter(id => !played.has(id));
if (missing.length) {
  G.days.plan(missing);
  playDay('extra day (' + missing.join(', ') + ')');
}

// --- a day as Dude: his homework at his own desk, keyboard practice and tidying his room
G.days.setCharacter('boy');
G.days.plan(['homework', 'music', 'tidyDude', 'clarinet']);
// (P's toys and Dad's cooking come up in the 12 days or the extra day)
if (G.board.find('homework').steps[0].level !== 2) errors.push("Dude's homework isn't at his desk in the attic");
playDay("Dude's day");
G.days.next();

// --- a day as Mum: work in the office, make up the sofa bed, cook dinner
G.days.setCharacter('mum');
G.days.plan(['work', 'sofabed', 'cook']);
playDay("Mum's day");
G.days.next();
G.days.setCharacter('dad');

// --- the loft box: every spot it can be at is on open floor, and the ladder is down while a loft job is on
for (const b of BOX_SPOTS) if (blocked(b.at[0], b.at[1], b.level)) errors.push(`loft box spot in ${b.name} is inside something`);
G.days.plan(['loftDown']);
frame();
if (!G.world.loftLadder.visible) errors.push('loft: ladder not down for a loft job');
playDay('loft day');
if (G.world.loftLadder.visible) errors.push('loft: ladder still down after the job');
G.days.next();

// --- rain while the washing is out: get it off the line, bring the basket in
G.days.plan(['washing']);
playDay('washing day');
if (!G.world.washingLine.hasWashing()) errors.push("rain: the washing isn't on the line after hanging it out");
G.days.next();
G.days.plan(['washing', 'hands']);
{
  const washing = G.board.find('washing');
  while (washing.i < washing.steps.length) { const r = doStep(washing); if (r !== true) { errors.push('rain setup: ' + r); break; } }
  G.weather.rainNow(G.clock.elapsedTime);
  const rain = G.board.find('rain');
  if (!rain) errors.push("rain: no 'bring the washing in' job when it rained");
  else if (!/Rain! Get the washing in/.test(G.weather.banner() || '')) errors.push('rain: no countdown banner');
  playDay('rainy day');
  if (rain && rain.i < rain.steps.length) errors.push("rain: the washing didn't get brought in");
  if (G.world.washingLine.hasWashing()) errors.push('rain: washing still on the line');
}
G.days.next();

// --- a parcel for the neighbours, all four ways: left or right, taken round or they come for it
for (const [side, comes] of [['left', false], ['right', false], ['left', true], ['right', true]]) {
  G.days.plan(['hands']);
  const label = `neighbours' parcel (${side}, ${comes ? 'they come round' : 'taken round'})`;
  G.deliveries.neighbourParcelNow(G.clock.elapsedTime, side, comes);
  let job = null;
  for (let k = 0; k < 600 && !(job = G.board.find('neighbourParcel')); k++) frame();
  if (!job) { errors.push(`${label}: the driver never rang`); continue; }
  if (!/parcel for the neighbours/.test(G.deliveries.banner() || '')) errors.push(`${label}: no banner while the driver waits`);
  if (!job.title.includes(side)) errors.push(`${label}: the job doesn't say which neighbours (${job.title})`);
  playDay(label);
  if (job.i < job.steps.length) errors.push(`${label}: never finished`);
  if (G.items.neighbourParcel.visible && G.items.neighbourParcel.parent === G.stage.scene) errors.push(`${label}: the parcel was left lying about`);
  G.days.next();
}
{ // too slow: the driver takes it to another neighbour and the job goes away
  G.days.plan(['hands']);
  G.deliveries.neighbourParcelNow(G.clock.elapsedTime, 'right', true);
  for (let k = 0; k < 600 && !G.board.find('neighbourParcel'); k++) frame();
  for (let k = 0; k < 3000 && G.board.find('neighbourParcel'); k++) frame();
  if (G.board.find('neighbourParcel')) errors.push("neighbours' parcel: still on the list after the driver gave up");
  G.days.next();
}

// --- the school run mission, as P and as Dude: every step reachable, the results card, back to the day
for (const who of ['girl', 'boy']) {
  const dayBefore = G.days.day, planBefore = G.board.jobs.map(j => j.id).join();
  G.missions.start('schoolRun', who);
  if (G.board.jobs.length !== 1 || S.mission.who !== who) errors.push(`school run (${who}): didn't start with one step on the list`);
  for (let round = 0; round < 30 && !S.mission.done; round++) {
    for (const job of G.board.jobs.filter(j => j.i < j.steps.length)) {
      let guard = 0;
      while (job.i < job.steps.length && guard++ < 10) {
        const before = job.i, r = doStep(job);
        if (r !== true) { errors.push(`school run (${who}) "${job.title}" step ${before + 1}: ${r}`); job.i = job.steps.length; S.carrying = null; break; }
      }
    }
    frame();
  }
  if (!S.mission.done) errors.push(`school run (${who}): never got to school`);
  else console.log(`school run as ${who}: ${G.board.jobs.length} steps, arrived at minute ${Math.round(S.mission.t / 4)} after 7:30, best`, G.missions.best('schoolRun', who));
  if (G.days.save.today.done.some(id => id.startsWith('schoolRun'))) errors.push('school run: mission steps got saved as day jobs');
  G.missions.end();
  if (S.mission || G.days.day !== dayBefore || G.board.jobs.map(j => j.id).join() !== planBefore) errors.push(`school run (${who}): the day didn't come back as it was`);
}

// --- up to the attic and back down by the stairs
// (walking through the middle of the bathroom doorway, next to the attic stairs, must not offer them)
G.levels.show(1); goTo([3.875, 6.6]); frame();
{ const n = G.board.nearestAction(G.player.group.position); if (n && n.fixed) errors.push(`bathroom doorway offers "${n.step.label}"`); }
G.levels.show(0);
travel(2);
if (G.world.attic.visible !== true || G.world.upstairs.visible !== true) errors.push('attic: not shown when up there');
travel(0);
if (G.world.attic.visible || G.world.upstairs.visible) errors.push('attic: still shown when back downstairs');

// --- one trip with the hoover does every floor on the list
{
  G.days.plan(['hoover', 'hooverUp', 'hooverAttic']);
  const floors = ['hoover', 'hooverUp', 'hooverAttic'].map(id => G.board.find(id));
  const must = (r, what) => { if (r !== true) errors.push(`one hoover trip, ${what}: ${r}`); };
  must(doStep(floors[0]), 'picking it up');
  if (floors.some(j => j.steps[j.i].kind !== 'hoover')) errors.push('picking the hoover up once should start every hoover job');
  floors.forEach(j => must(doStep(j), j.id));   // hoover each floor, carrying it all the way
  if (S.carrying !== 'hoover') errors.push('the hoover should still be in hand after the last floor');
  must(doStep(floors[0]), 'putting it back');
  if (floors.some(j => j.i < j.steps.length) || S.carrying) errors.push('putting the hoover back once should finish every hoover job');

  // putting it back before the other floor is done sends that job back to fetching it
  G.days.plan(['hoover', 'hooverUp']);
  const [down, up] = ['hoover', 'hooverUp'].map(id => G.board.find(id));
  for (const what of ['pick', 'hoover', 'drop']) must(doStep(down), what);
  if (down.i < down.steps.length || up.i !== 0) errors.push(`hoover put back early: upstairs job at step ${up.i}, want 0 (get the hoover again)`);
  for (const what of ['pick', 'hoover', 'drop']) must(doStep(up), 'upstairs ' + what);
  if (up.i < up.steps.length) errors.push('the upstairs hoover job never finished');
}

// --- starting over goes back to day 1
G.days.restart();
if (G.days.day !== 1 || G.board.jobs.length < 10) errors.push(`start over: day ${G.days.day} with ${G.board.jobs.length} jobs`);

// --- changing who you play swaps the jobs that are only for them (day 1 is a school day, Dad hasn't shaved yet)
const ids = () => G.board.jobs.map(j => j.id);
if (!ids().includes('shave') || ids().includes('homework')) errors.push(`Dad's day 1: shave ${ids().includes('shave')}, homework ${ids().includes('homework')}`);
G.days.setCharacter('girl');
if (ids().includes('shave') || !ids().includes('homework')) errors.push(`after switching to P: shave ${ids().includes('shave')}, homework ${ids().includes('homework')}`);
// P and Dude each do homework at their own spot, so switching between them starts it afresh
const homeworkP = G.board.find('homework');
G.days.setCharacter('boy');
if (G.board.find('homework') === homeworkP || ids().filter(id => id === 'homework').length !== 1) errors.push("switching from P to Dude should swap P's homework for Dude's");
G.days.setCharacter('girl');
{ const r = doStep(G.board.find('homework')); if (r !== true) errors.push('homework as P: ' + r); }
G.days.setCharacter('dad');
if (!ids().includes('shave') || !ids().includes('homework') || G.board.find('homework').i === 0) errors.push('back to Dad: the shave should return and the finished homework should stay, ticked');
G.days.setCharacter('boy');
if (ids().includes('shave') || ids().filter(id => id === 'homework').length !== 1) errors.push('switching to Dude: no shave, and homework is not asked for twice in a day');
G.days.setCharacter('dad');
if (JSON.parse(store.get('fordHouse.save.v1')).character !== 'dad') errors.push('who is playing was not saved');

console.log('every job played:', pool.every(id => played.has(id) || missing.includes(id)), `(${pool.length} jobs)`);
console.log('trips up or down the stairs:', stairTrips);
if (!stairTrips) errors.push('never used the stairs');
console.log('renders:', G.stage.renderer.frames, 'carrying:', S.carrying, 'power:', S.powerOn);
console.log(errors.length ? 'PROBLEMS:\n- ' + errors.join('\n- ') : 'no problems');
process.exitCode = errors.length ? 1 : 0;

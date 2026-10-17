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
const { REACH, LEVEL_HEIGHT, WALK_SPEED } = await import(new URL('../../house/js/config.js', import.meta.url));
const { DAY_JOBS } = await import(new URL('../../house/js/days/planner.js', import.meta.url));
const { SWEEPS } = await import(new URL('../../house/js/systems/sweeping.js', import.meta.url));
const { TRIM_SPOTS } = await import(new URL('../../house/js/systems/trimming.js', import.meta.url));
const { HOOVER_SPOTS } = await import(new URL('../../house/js/systems/hoovering.js', import.meta.url));
const { BOX_SPOTS } = await import(new URL('../../house/js/jobs/jobs.js', import.meta.url));
const G = globalThis.house, S = G.S;
const frame = () => { const f = raf.shift(); if (!f) throw new Error('no frame scheduled'); f(); };
for (let i = 0; i < 5; i++) frame();
console.log('boot ok, jobs:', G.board.jobs.length, 'renders:', G.stage.renderer.frames);

// --- reachability: flood-fill the walkable space on each floor, from the front path downstairs and
// from the top of the stairs upstairs
const RES = 0.05;
const HOUSE_GRID = { X0: -6.25, Z0: -17.3, NX: Math.round(18 / RES), NZ: Math.round(30.7 / RES) };
const OFFICE_GRID = { X0: 38.6, Z0: -3.7, NX: Math.round(16 / RES), NZ: Math.round(20.6 / RES) };   // Dad's office (world/office.js)
function walkable(level, sx, sz, { X0, Z0, NX, NZ } = HOUSE_GRID) {
  const idx = (i, k) => k * NX + i;
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
const officeCells = walkable(0, 43.0, 15.3, OFFICE_GRID);   // the office and round it, from the bike rack
// Mum's office site: from her car park, through the turnstiles (closed until you show your badge) to the
// building; and her office floor upstairs, from the top of the stairs
const MUM_GRID = { X0: 70.2, Z0: -8.8, NX: Math.round(49.6 / RES), NZ: Math.round(31.2 / RES) };
const MUM_FLOOR_GRID = { X0: 98.0, Z0: 4.6, NX: Math.round(12 / RES), NZ: Math.round(17 / RES) };
const mumOutside = walkable(0, 97.2, -4.2, MUM_GRID);
if (mumOutside.some(c => c[1] > 3.6 && c[1] < 22)) errors.push("Mum's office: you can get onto the site without showing your badge");
G.world.mumGate.open();
const mumCells = walkable(0, 97.2, -4.2, MUM_GRID);
G.world.mumGate.close();
const mumFloorCells = walkable(1, 108.65, 17.9, MUM_FLOOR_GRID);
for (const [what, x, z] of [['the zebra crossing', 97.5, 1.8], ['the turnstiles', 98.2, 3.05], ['the clock-in machine', 98.5, 8.1], ['the café counter', 84.6, 10.3], ['the lifts', 109.0, 16.9], ['the stairs', 108.65, 17.9], ['the assembly point', 90.2, 13.6]])
  if (!mumCells.some(c => Math.hypot(c[0] - x, c[1] - z) < 0.1)) errors.push(`Mum's office: can't walk to ${what} from the car park`);
for (const [what, x, z] of [["Mum's desk", 100.1, 13.3], ['the meeting room', 101.6, 18.3], ['the kitchen fridge', 103.0, 15.55], ['the kitchen sink', 103.0, 12.9], ['the WC', 105.0, 19.4], ['the lifts upstairs', 109.0, 16.9], ['the second office', 108.0, 10.0]])
  if (!mumFloorCells.some(c => Math.hypot(c[0] - x, c[1] - z) < 0.1)) errors.push(`Mum's office floor: can't walk to ${what}`);
const cellsOn = [walkable(0, 3.92, 10.6).concat(officeCells, mumCells), walkable(1, 4.1, 4.55).concat(mumFloorCells), walkable(2, 4.25, 4.6)];
// every room in the office can be reached from the bike rack
for (const [room, x, z] of [['open plan', 42.6, 3.0], ["boss's office", 41.5, 8.4], ['meeting room', 41.9, 12.0], ["Dad's room", 44.0, 8.9], ['kitchen', 44.5, 10.9], ['bathroom', 44.5, 13.0], ['assembly point', 43.1, -2.4]])
  if (!officeCells.some(c => Math.hypot(c[0] - x, c[1] - z) < 0.1)) errors.push(`office: can't walk to the ${room} (${x}, ${z})`);
console.log('walkable cells: downstairs', cellsOn[0].length, 'upstairs', cellsOn[1].length, 'attic', cellsOn[2].length);
// every tuft of the lawn can be mowed: somewhere you can stand puts the mower deck (0.95 m ahead, cutting
// 0.42 m around it) over it
{ const far = G.world.lawn.cells.filter(t => !cellsOn[0].some(c => { const d = Math.hypot(c[0] - t.x, c[1] - t.z); return d > 0.53 && d < 1.37; }));
  if (far.length) errors.push(`lawn: ${far.length} tufts can't be reached with the mower, e.g. (${far[0].x.toFixed(2)}, ${far[0].z.toFixed(2)})`); }
// every upstairs doorway can be walked straight through, 0.5 m either side (furniture mustn't block it)
for (const [room, x, z, axis] of [['dressing room', 3.85, 3.95, 'z'], ['bathroom', 3.875, 6.9, 'z'], ['main bedroom', 3.26, 4.5, 'x'], ["kids' room", 3.26, 6.225, 'x']]) {
  for (let d = -0.5; d <= 0.5; d += 0.1) {
    const px = axis === 'x' ? x + d : x, pz = axis === 'z' ? z + d : z;
    if (blocked(px, pz, 1)) { errors.push(`upstairs: the ${room} doorway is blocked at (${px.toFixed(2)}, ${pz.toFixed(2)})`); break; }
  }
}
// P's room: you can walk all the way round her little craft table (between it and the bed, the terrarium
// and the wardrobe), not just past one side
{
  const { CRAFT_TABLE: t } = await import(new URL('../../house/js/world/upstairs/kinderzimmer.js', import.meta.url));
  const gap = 0.24, cx = (t.x1 + t.x2) / 2, cz = (t.z1 + t.z2) / 2;
  for (const [side, x, z] of [['bed', t.x1 - gap, cz], ['wardrobe', t.x2 + gap, cz], ['terrarium', cx, t.z1 - gap], ['desk', cx, t.z2 + gap]])
    if (!cellsOn[1].some(c => Math.hypot(c[0] - x, c[1] - z) < 0.04)) errors.push(`P's room: can't walk round the craft table on the ${side} side (${x.toFixed(2)}, ${z.toFixed(2)})`);
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
// On a mission with a clock, getting somewhere takes the time it takes to walk there: the shortest path over
// the walkable floor (0.1 m grid) at walking speed is added to the clock. The bot otherwise jumps straight
// to each spot, which would hide a day that can't be done in time.
const GRID = cellsOn.map(cells => { const m = new Set(); for (const [x, z] of cells) m.add(Math.round(x * 10) + ',' + Math.round(z * 10)); return m; });
function pathLength(level, from, to) {
  const key = (i, k) => i + ',' + k, g = GRID[level];
  const s = [Math.round(from[0] * 10), Math.round(from[1] * 10)], t = [Math.round(to[0] * 10), Math.round(to[1] * 10)];
  if (s[0] === t[0] && s[1] === t[1]) return 0;
  const dist = new Map([[key(...s), 0]]), q = [s];
  for (let h = 0; h < q.length; h++) {
    const [i, k] = q[h], d = dist.get(key(i, k));
    for (const [di, dk] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]) {
      const n = key(i + di, k + dk), step = di && dk ? Math.SQRT2 : 1;
      if (dist.has(n) || !g.has(n) || (di && dk && (!g.has(key(i + di, k)) || !g.has(key(i, k + dk))))) continue;
      if (i + di === t[0] && k + dk === t[1]) return (d + step) / 10;
      dist.set(n, d + step); q.push([i + di, k + dk]);
    }
  }
  return Math.hypot(to[0] - from[0], to[1] - from[1]) * 1.3;   // off the grid (shouldn't happen): a fair guess
}
let walked = 0;
const goTo = cell => {
  const p = G.player.group.position;
  if (S.mission && S.mission.clock && !S.mission.done) {
    const m = pathLength(S.level, [p.x, p.z], cell);
    if (m < 60) { S.mission.t += m / WALK_SPEED; walked += m; }   // (60+ m: a different place, got there by car or bike)
  }
  p.x = cell[0]; p.z = cell[1];
};
const STAIRS = {
  '0>1': { at: [4.4, 6.05], label: 'Go upstairs' }, '1>0': { at: [4.15, 4.45], label: 'Go downstairs' },
  '1>2': { at: [4.6, 6.5], label: 'Go up to the attic' }, '2>1': { at: [4.3, 4.55], label: 'Go downstairs' },
};
let stairTrips = 0;
function travel(level) {
  if (G.player.group.position.x > 70) {   // at Mum's office: the stairs between the ground floor and her office floor
    while (S.level !== level) {
      const label = level > S.level ? 'Take the stairs up' : 'Take the stairs down';
      goTo(standNear([108.65, 17.9]).cell); frame();
      const n = G.board.nearestAction(G.player.group.position);
      if (!n || !n.fixed || n.step.label !== label) { errors.push(`Mum's office stairs: button shows "${n ? n.step.label : 'nothing'}" instead of "${label}"`); G.levels.show(level); break; }
      G.board.act(n); stairTrips++; frame();
    }
    return;
  }
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
  if (s.kind === 'trim') {   // walk round the shaggy bushes with the hedge trimmer, facing each one
    travel(0);
    for (const [x, z] of TRIM_SPOTS) {
      const { cell } = standNear([x + (x > 3 ? -0.75 : 0.75), z]); goTo(cell);
      G.player.group.rotation.y = Math.atan2(x - cell[0], z - cell[1]); frame();
    }
    return job.steps[job.i] !== s || 'bushes left shaggy';
  }
  if (s.kind === 'charge' || s.kind === 'wait') { for (let n = 0; n < 2500 && job.steps[job.i] === s; n++) { if (!S.powerOn) fixPower(); frame(); } return job.steps[job.i] !== s || 'never finished running'; }

  if (s.notBefore) for (let k = 0, n = G.board.jobs.length; k < 5000 && G.missions.minutes() < s.notBefore; k++) {   // a mission step that opens later (lunch from 12:00)
    frame();
    if (G.board.jobs.length !== n || (S.mission && S.mission.drill && !s.drill)) return 'retry';   // the phone rang or the fire alarm went off meanwhile
  }
  travel(G.board.levelOf(s));
  const p = stepAt(s), { cell, dist } = standNear(p);
  if (dist > REACH - 0.02) return `can't get within reach of [${p.map(v => v.toFixed(2))}] (closest ${dist.toFixed(2)} m)`;
  const jobsBefore = G.board.jobs.length;
  goTo(cell); frame();
  const n = G.board.nearestAction(G.player.group.position);
  if (S.mission && (G.board.jobs.length !== jobsBefore || S.mission.drill || (n && n.job && n.job.due !== undefined)) && (!n || n.step !== s)) return 'retry';   // the phone rang or the alarm went off on the way
  if (!n || n.step !== s) return `button shows "${n ? n.step.label : 'nothing'}" instead of "${s.label}"`;
  G.board.act(n);
  if (s.kind === 'sort') {   // the sorting card: pick the right pile every time (and try a wrong one first)
    const wrong = { white: 'dark', colour: 'white', dark: 'colour' }[G.sorting.answer()];
    G.sorting.choose(wrong);
    for (let k = 0; k < 30 && S.sorting; k++) G.sorting.choose(G.sorting.answer());
    frame();
    return job.steps[job.i] !== s || 'sorting never finished';
  }
  if (s.kind === 'choose') {   // the laptop close-up: pick tile number `laptopPick` (1 = first)
    if (!S.laptop) return 'the laptop never opened';
    G.laptop.choose(Math.min(laptopPick, G.laptop.options().length));
    for (let k = 2; k <= 4 && S.laptop; k++) G.laptop.choose(Math.min(k, G.laptop.options().length));   // "Not that one!": another
    frame();
    return job.steps[job.i] !== s || 'nothing was chosen on the laptop';
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
      if (S.mission && S.mission.drill && !s.drill && !S.sitting) return 'retry';   // the fire alarm got us up
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

let laptopPick = 1;
/** Play every job on today's list (and any that pop up) until the Day complete screen shows. */
const events = {};
function playDay(label) {
  for (let round = 0; round < 40 && !S.dayOver; round++) {
    for (const job of G.board.jobs.filter(j => j.i < j.steps.length)) {
      if (job.event) events[job.id] = (events[job.id] || 0) + 1;
      let guard = 0;
      while (job.i < job.steps.length && guard++ < 10) {
        if (!G.board.jobs.includes(job)) break;   // gone from the list meanwhile (the driver gave up on a neighbours' parcel)
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
  if (G.items.shopping.visible) errors.push(`${label}: the shopping is in the house before it's been delivered`);
  if (n > 1) {
    const yesterday = dayLog[n - 2];
    if (yesterday.includes('binsOut') && !has('binsIn')) errors.push(`${label}: bins went out yesterday but aren't coming back in`);
    if (has('binsIn') && !yesterday.includes('binsOut')) errors.push(`${label}: bins coming in but they didn't go out yesterday`);
  }

  if (has('binsOut')) binTitles.push(G.board.find('binsOut').title);
  if (n === 3) G.power.cut();   // a power cut on day 3 for sure; the day can't finish until the fuses are reset
  playDay(label);
  if (has('mow') && G.world.lawn.cutCount !== G.world.lawn.cells.length) errors.push(`${label}: ${G.world.lawn.cells.length - G.world.lawn.cutCount} tufts of long grass left after mowing`);
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
const pool = (await import(new URL('../../house/js/jobs/rules.js', import.meta.url))).POOL_RULES.filter(r => !r.holiday).map(r => r.id);   // Halloween's jobs get their own day below
const missing = pool.filter(id => !played.has(id));
if (missing.length) {
  G.days.plan(missing);
  playDay('extra day (' + missing.join(', ') + ')');
}

// --- a day as Dude: his homework at his own desk, keyboard practice and tidying his room
G.days.setCharacter('boy');
G.days.plan(['homework', 'music', 'tidyDude', 'clarinet', 'coffee']);   // Dude takes the coffee to the table
// (P's toys and Dad's cooking come up in the 12 days or the extra day)
if (G.board.find('homework').steps[0].level !== 2) errors.push("Dude's homework isn't at his desk in the attic");
playDay("Dude's day");
{ const m = G.items.mug.position; if (!G.items.mug.visible || Math.hypot(m.x - 1.65, m.z - 7.3) > 0.01) errors.push("coffee: Dude didn't put the coffee on the dining table"); }
G.days.next();

// --- carrying something wins: by P's desk and window with the cricket box, the button puts the box
// back rather than offering her homework at her desk nearby
G.days.setCharacter('girl');
G.days.plan(['feedDragon', 'homework']);
{
  const feed = G.board.find('feedDragon');
  for (let k = 0; k < 2 && feed.i < 2; k++) { const r = doStep(feed); if (r !== true) errors.push('dragon box: ' + r); }
  const s = feed.steps[feed.i];
  if (s.kind !== 'drop' || S.carrying !== 'cricketBox') errors.push(`dragon box: expected to be carrying the box back, at step "${s.label}"`);
  else {
    const home = G.items.cricketBox.userData.home.pos;
    const spots = cellsOn[1].filter(c => Math.hypot(c[0] - home[0], c[1] - home[2]) < REACH - 0.05);
    const wrong = spots.filter(c => { goTo(c); const n = G.board.nearestAction(G.player.group.position); return !n || n.step !== s; });
    if (wrong.length) errors.push(`dragon box: from ${wrong.length} of ${spots.length} spots by the desk the button isn't "${s.label}"`);
  }
  G.days.setCharacter('dad');
  G.days.next();
}

// --- a day as P with her bearded dragon: feed it, play with it, clean out the terrarium
G.days.setCharacter('girl');
G.days.plan(['feedDragon', 'playDragon', 'cleanDragon']);
if (!G.world.dragonMess.visible) errors.push("dragon: no mess in the terrarium on cleaning day");
if (G.dragon.happy()) errors.push('dragon: happy before it has been fed and played with');
playDay("P's dragon day");
if (!G.dragon.happy()) errors.push("dragon: not happy after it's been fed and played with");
if (G.world.dragonMess.visible || G.world.crickets.visible) errors.push('dragon: mess or crickets left in the terrarium');
{ const p = G.items.dragon.position, b = G.items.dragonBowl.position;
  if (G.items.dragon.parent !== G.world.upstairs || p.x < 1.0 || p.x > 1.95 || p.z < 5.72 || p.z > 6.15) errors.push('dragon: not back in its terrarium');
  if (G.items.dragonBowl.parent !== G.world.upstairs || Math.hypot(b.x - 1.47, b.z - 6.04) > 0.01) errors.push("dragon: the water bowl isn't back in its place in the terrarium");
  if (Math.hypot(b.x - 1.12, b.z - 5.86) < 0.2) errors.push('dragon: the water bowl is hidden under the branch'); }
G.days.setCharacter('dad');
G.days.next();

// --- a day at the shed as Dad: fix P's bike, clean the solar panels, trim the bushes
G.days.plan(['fixBike', 'solar', 'trim']);
if (!G.world.dirt[3].visible || !G.world.overgrown.every(g => g.visible)) errors.push("shed: panels not dusty or bushes not shaggy on the day they're on the list");
if (G.world.dirt.slice(0, 3).some(d => d.visible)) errors.push('shed: the terrace windows are dirty without the window job');
playDay('shed day');
if (G.world.dirt[3].visible) errors.push('shed: solar panels still dusty');
if (G.world.overgrown.some(g => g.visible)) errors.push('shed: bushes still shaggy');
if (G.items.clippingsBag.visible) errors.push("shed: the clippings didn't go in the brown bin");
{ const b = G.items.bike.position, h = G.items.bike.userData.home.pos;
  if (Math.hypot(b.x - h[0], b.z - h[2]) > 0.01) errors.push("shed: P's bike isn't back on the terrace"); }
G.days.next();

// --- a day as Mum: work in the office, make up the sofa bed, cook dinner
G.days.setCharacter('mum');
G.days.plan(['work', 'sofabed', 'cook', 'coffee']);
if (!G.board.find('coffee').steps.some(st => st.what === 'Drinking your coffee')) errors.push("coffee: Mum doesn't get to drink hers");
playDay("Mum's day");
if (G.items.mug.visible) errors.push('coffee: the mug is still about after Mum drank her coffee');
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

// --- the food shopping: Dad checks the fridge and orders on his phone, P just waits; either way the
// delivery driver brings it to the door and rings
for (const who of ['dad', 'girl']) {
  G.days.setCharacter(who);
  G.days.plan(['shopping']);
  const job = G.board.find('shopping');
  const first = job.steps[0].label;
  if ((who === 'dad') !== /fridge/.test(first)) errors.push(`food shopping (${who}): starts with "${first}"`);
  while (job.i < job.steps.length && job.steps[job.i].kind !== 'wait') { const r = doStep(job); if (r !== true) { errors.push(`food shopping (${who}): ${r}`); break; } }
  for (let k = 0; k < 4000 && job.steps[job.i].kind === 'wait'; k++) frame();
  // the wait for a delivery only ends when the driver rings. The banner says so, unless one of the day's
  // random parcels (for us, or for the neighbours) has a courier at the door at the same moment: that banner wins
  if (job.steps[job.i].kind === 'wait') errors.push(`food shopping (${who}): the driver never rang`);
  else if (!S.courierWaiting && !/at the front door/.test(G.deliveries.banner() || '')) errors.push(`food shopping (${who}): no banner while the driver waits at the door (${G.deliveries.banner()})`);
  playDay(`food shopping (${who})`);
  if (G.items.shopping.getObjectByName('food').visible) errors.push(`food shopping (${who}): the food wasn't put away`);
  G.days.setCharacter('dad');
  G.days.next();
}

// --- Halloween (31 October; ?holiday=halloween): as Dad, P and Dude. Carve the jack-o'-lantern (picking a
// face), decorate the house, and trick or treat: Dad hands out sweets to two lots of trick-or-treaters at
// the door, the kids pick a costume, dress up, and ring both neighbours' bells with their bucket
{
  const { HALLOWEEN: HW } = await import(new URL('../../house/js/world/halloween.js', import.meta.url));
  const deco = G.world.halloween;
  globalThis.location.search = '?season=autumn&holiday=halloween';
  const realGive = G.halloween.giveSweets;
  let gave = [];
  G.halloween.giveSweets = () => { gave.push(G.halloween.visitors); realGive(); };
  for (const who of ['dad', 'girl', 'boy']) {
    const label = `Halloween (${who})`;
    gave = [];
    G.days.setCharacter(who);
    G.days.plan(['pumpkin', 'decorate', 'trickOrTreat']);
    if (!G.halloween.on || !deco.all.visible) errors.push(`${label}: decorations not up`);
    if (deco.window.visible || deco.ghost.visible) errors.push(`${label}: the window bats or the ghost are up before decorating`);
    if (!G.items.pumpkin.visible || G.items.pumpkin.userData.pumpkin.faceMesh.visible) errors.push(`${label}: no whole pumpkin in the garden`);
    const grown = who === 'dad', tt = G.board.find('trickOrTreat');
    if (grown !== /sweets/.test(tt.title)) errors.push(`${label}: trick or treat job is "${tt.title}"`);
    laptopPick = 2;   // the second face (spooky) and the second costume (vampire)
    playDay(label);
    const it = G.items.pumpkin, p = it.userData.pumpkin;
    if (it.parent !== G.stage.scene || Math.hypot(it.position.x - HW.step.place[0], it.position.z - HW.step.place[2]) > 0.01) errors.push(`${label}: the jack-o'-lantern isn't on the front step`);
    if (!p.faceMesh.visible || !p.glow.visible) errors.push(`${label}: the jack-o'-lantern isn't carved and lit`);
    if (G.halloween.face !== 'spooky') errors.push(`${label}: carved "${G.halloween.face}", picked spooky`);
    if (!deco.window.visible || !deco.door.visible || !deco.ghost.visible || G.items.decoBox.visible) errors.push(`${label}: decorations not all up, or the box left out`);
    if (grown) {
      if (gave.join() !== 'waiting,waiting') errors.push(`${label}: trick-or-treaters at the door when handing out sweets: ${gave.join() || 'never'}`);
    } else {
      const room = HW.room[who], pail = G.items.treatPail;
      if (G.player.costume !== 'vampire') errors.push(`${label}: wearing ${G.player.costume}, picked the vampire`);
      if (!pail.getObjectByName('sweets').visible) errors.push(`${label}: no sweets in the bucket`);
      if (pail.userData.level !== room.level || Math.hypot(pail.position.x - room.place[0], pail.position.z - room.place[2]) > 0.01) errors.push(`${label}: the bucket isn't on ${room.name}`);
    }
    G.days.next();
  }
  G.halloween.giveSweets = realGive;
  globalThis.location.search = '?season=autumn';
  G.days.setCharacter('dad');
  G.days.plan(['hands']);
  if (G.halloween.on || deco.all.visible || G.items.pumpkin.visible || G.player.costume) errors.push('after Halloween: decorations, the pumpkin or a costume still about');
  if (G.board.find('pumpkin')) errors.push('after Halloween: Halloween jobs still on the list');
  playDay('the day after Halloween');
  G.days.next();
  console.log('Halloween: pumpkin carved and lit, house decorated, trick or treat as Dad, P and Dude');
}

// --- Christmas (?date=...): a whole planned day on 15 December as Dad, then the tree, baking (hearts) and a
// present to wrap; P's Advent calendar (doors only up to today's real date), wish list and a present she
// makes; Christmas Eve's bell and presents as Dad and Dude; everything down and the tree out on 5 January;
// nothing up on 6 January
{
  const { XMAS } = await import(new URL('../../house/js/world/christmas.js', import.meta.url));
  const { colliders } = await import(new URL('../../house/js/core/build.js', import.meta.url));
  const deco = G.world.christmas, near = (o, [x, , z]) => Math.hypot(o.position.x - x, o.position.z - z) < 0.01;
  const treeBlocks = () => colliders.includes(deco.treeCollider);
  const realOpen = G.adventCard.open;
  let openedDoors = [];
  G.adventCard.open = who => { realOpen(who); for (const n of G.advent.ready(who)) openedDoors.push(n, G.adventCard.choose(n)); G.adventCard.close(); };

  globalThis.location.search = '?season=winter&date=2026-12-15';
  G.days.setCharacter('dad'); G.player.setCharacter('dad');
  G.days.next();
  const planned = G.board.jobs.map(j => j.id);
  if (!planned.includes('xmasTree')) errors.push(`15 December: the tree isn't on Dad's list (${planned})`);
  if (planned.includes('adventDoor') || planned.includes('wishList')) errors.push("15 December: Dad has P and Dude's Christmas jobs");
  if (!G.christmas.on || !deco.all.visible || !deco.calendars.visible || !treeBlocks()) errors.push('15 December: decorations or Advent calendars not up, or you can walk through the tree');
  if (deco.flames.filter(f => f.visible).length !== 3) errors.push(`15 December: ${deco.flames.filter(f => f.visible).length} Advent candles lit, want 3`);
  playDay('15 December (dad, a planned day)');
  G.days.next();

  G.days.plan(['xmasTree', 'biscuits', 'xmasGift']);
  if (deco.star.visible || deco.baubles.visible || !G.items.xmasBox.visible) errors.push('decorating the tree: it isn\'t bare with the box in the cupboard');
  laptopPick = 3;   // hearts
  playDay('Christmas jobs (dad)');
  if (!deco.star.visible || !deco.baubles.visible || !deco.lights[0].userData.on || G.items.xmasBox.visible || !near(G.items.xmasBox, G.items.xmasBox.userData.home.pos)) errors.push('the tree isn\'t done, or the box isn\'t back in the cupboard');
  if (G.christmas.cutter !== 'heart' || !near(G.items.biscuits, XMAS.table.plate) || !G.items.biscuits.visible) errors.push(`the biscuits (${G.christmas.cutter}) aren't on the dining table`);
  if (G.items.xmasGift.parent !== G.stage.scene || !near(G.items.xmasGift, XMAS.giftPlace)) errors.push('the wrapped present isn\'t under the tree');
  G.days.next();

  G.days.setCharacter('girl'); G.player.setCharacter('girl');
  G.days.next();
  if (!G.board.find('adventDoor') || !G.board.find('wishList')) errors.push(`15 December: no Advent calendar or wish list on P's list (${G.board.jobs.map(j => j.id)})`);
  G.days.plan(['adventDoor', 'wishList', 'xmasGift']);
  openedDoors = [];
  playDay('Christmas jobs (girl)');
  const doors = G.advent.opened('girl');
  if (doors.length !== 15 || doors.includes(16) || !G.advent.isOpen('girl', 15) || G.advent.opened('boy').length) errors.push(`P's Advent calendar: opened ${doors}, want 1-15 (and none of Dude's)`);
  if (!near(G.items.wishLetter, XMAS.windowsill.place) || G.items.wishLetter.userData.level !== 0) errors.push("P's wish list isn't on the dining room windowsill");
  if (!near(G.items.xmasGift, XMAS.giftPlace) || G.items.xmasGift.userData.level !== 0) errors.push("P's present isn't under the tree");
  G.days.next();
  if (G.board.find('adventDoor')) errors.push('the same real day: P gets another Advent door');
  G.days.setCharacter('boy'); G.player.setCharacter('boy');
  if (!G.board.find('adventDoor')) errors.push('swapping to Dude: no Advent calendar job for him');
  G.days.setCharacter('girl'); G.player.setCharacter('girl');
  if (G.board.find('adventDoor')) errors.push('swapping back to P: the Advent job came back');
  globalThis.location.search = '?season=winter&date=2026-12-16';
  G.days.next();
  if (!G.board.find('adventDoor') || G.advent.ready('girl').join() !== '16') errors.push(`16 December: no new door for P (${G.advent.ready('girl')})`);

  globalThis.location.search = '?season=winter&date=2026-12-24';
  for (const who of ['dad', 'boy']) {
    G.days.setCharacter(who); G.player.setCharacter(who);
    G.days.next();
    if (!G.board.find('bescherung')) errors.push(`Christmas Eve (${who}): no presents job`);
    G.days.plan(['bescherung']);
    if (deco.presents.some(p => p.visible)) errors.push(`Christmas Eve (${who}): presents under the tree before the bell`);
    playDay(`Christmas Eve (${who})`);
    if (deco.presents.filter(p => p.visible).length !== 2) errors.push(`Christmas Eve (${who}): ${deco.presents.filter(p => p.visible).length} presents left under the tree, want 2 for the others`);
    G.days.next();
  }

  globalThis.location.search = '?season=winter&date=2027-01-05';
  G.days.setCharacter('dad'); G.player.setCharacter('dad');
  G.days.next();
  if (!G.board.find('xmasDown') || G.board.find('xmasTree') || G.board.find('biscuits')) errors.push(`5 January: ${G.board.jobs.map(j => j.id)}`);
  G.days.plan(['xmasDown']);
  playDay('5 January (dad)');
  const t = deco.tree;
  if (!t.visible || deco.pot.visible || Math.abs(t.rotation.z - Math.PI / 2) > 1e-6 || Math.hypot(t.position.x - XMAS.kerb[0], t.position.z - XMAS.kerb[1]) > 0.5 || treeBlocks()) errors.push('5 January: the tree isn\'t lying by the street');
  if (deco.stars.visible || deco.doorWreath.visible || deco.wreath.visible || deco.bulbs.some(b => b.visible) || G.items.xmasBox.visible) errors.push('5 January: decorations still up, or the box left out');
  G.days.next();

  globalThis.location.search = '?season=winter&date=2027-01-06';
  G.days.next();
  if (G.christmas.on || deco.all.visible || deco.calendars.visible || treeBlocks() || G.board.jobs.some(j => ['xmasTree', 'adventDoor', 'xmasDown'].includes(j.id))) errors.push('6 January: Christmas still about');
  G.days.plan(['hands']);
  playDay('6 January');
  G.days.next();
  G.adventCard.open = realOpen;
  globalThis.location.search = '?season=autumn';
  G.days.setCharacter('dad'); G.player.setCharacter('dad');
  G.days.next();
  console.log(`Christmas: tree, biscuits, presents, Advent doors 1-15 for P, Christmas Eve, down on 5 January`);
}

// --- names and switched-off jobs (#78): P called Pia and Dad called Alan show in job titles, labels, the room
// chip and the buttons; with the dragon and the clarinet off they never come up, and a day still finishes
{
  const { roomAt } = await import(new URL('../../house/js/world/rooms.js', import.meta.url));
  G.days.setCharacter('dad'); G.player.setCharacter('dad');
  G.days.plan(['fixBike', 'fold', 'shave']);
  G.players.setName('girl', 'Pia'); G.players.setName('dad', 'Alan');
  G.days.retitle();
  const fix = G.board.find('fixBike'), fold = G.board.find('fold');
  if (fix.title !== "Fix Pia's bike" || !fold.steps.some(st => st.label === "Pick up Pia's clothes") || !fold.steps.some(st => st.label === "Pick up Mum and Alan's clothes")) errors.push(`names: "${fix.title}", ${fold.steps.map(st => st.label).filter(Boolean).join(' / ')}`);
  if (roomAt(1.5, 7, 1).name !== "Pia's room" || roomAt(44.5, 7.5, 0).name !== 'Alans Büro') errors.push(`names: room chips ${roomAt(1.5, 7, 1).name}, ${roomAt(44.5, 7.5, 0).name}`);
  playDay('a day with new names');
  G.days.next();
  G.players.setName('girl', ''); G.players.setName('dad', '');

  G.settings.set('dragon', false); G.settings.set('clarinet', false);
  for (const who of ['girl', 'boy']) {
    G.days.setCharacter(who); G.player.setCharacter(who);
    for (let n = 0; n < 3; n++) {
      G.days.next();
      const plan = G.board.jobs.map(j => j.id);
      if (plan.some(id => /Dragon|clarinet/.test(id))) errors.push(`jobs off: ${who} still got ${plan.filter(id => /Dragon|clarinet/.test(id))}`);
      if (plan.length < DAY_JOBS.min) errors.push(`jobs off: ${who}'s day only has ${plan.length} jobs`);
    }
  }
  playDay('a day with the dragon and clarinet off');
  G.settings.set('dragon', true); G.settings.set('clarinet', true);
  G.days.setCharacter('dad'); G.player.setCharacter('dad');
  G.days.next();
  console.log('names and jobs off: Pia and Alan in titles, labels and rooms; no dragon or clarinet when switched off');
}

// --- the school run mission, as P and as Dude: every step reachable, the results card, back to the day
const { KIDS } = await import(new URL('../../house/js/missions/missions.js', import.meta.url));
for (const [who, kid] of Object.entries(KIDS)) {   // each kid starts on open floor, not inside the furniture
  if (blocked(kid.start[0], kid.start[1], kid.level)) errors.push(`school run (${who}): starts inside something at (${kid.start})`);
  if (!cellsOn[kid.level].some(c => Math.hypot(c[0] - kid.start[0], c[1] - kid.start[1]) < 0.06)) errors.push(`school run (${who}): can't walk out of the start spot (${kid.start})`);
}
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

// --- 3D printing as Dad, once with each design (and a different colour each time): pick it on the laptop,
// order filament, take the courier's parcel, load the printer, print, and put the model where it belongs
{
  const { MISSIONS } = await import(new URL('../../house/js/missions/missions.js', import.meta.url));
  const { DESIGNS } = await import(new URL('../../house/js/systems/printing.js', import.meta.url));
  const spot = MISSIONS.print3d.spot('dad');
  if (blocked(spot.start[0], spot.start[1], spot.level)) errors.push('3D printing: Dad starts inside something');
  for (let k = 1; k <= DESIGNS.length; k++) {
    const d = DESIGNS[k - 1], planBefore = G.board.jobs.map(j => j.id).join();
    laptopPick = k;
    G.missions.start('print3d', 'dad');
    let rang = false;
    for (let round = 0; round < 30 && !S.mission.done; round++) {
      for (const job of G.board.jobs.filter(j => j.i < j.steps.length)) {
        let guard = 0;
        while (job.i < job.steps.length && guard++ < 10) {
          const before = job.i, r = doStep(job);
          if (/filament is at the front door/.test(G.deliveries.banner() || '')) rang = true;
          if (r !== true) { errors.push(`3D printing (${d.id}) "${job.title}" step ${before + 1}: ${r}`); job.i = job.steps.length; S.carrying = null; break; }
        }
      }
      frame();
    }
    if (!S.mission.done) { errors.push(`3D printing (${d.id}): never finished`); G.missions.end(); continue; }
    if (S.mission.choices.design !== d.id) errors.push(`3D printing: picked ${S.mission.choices.design}, wanted ${d.id}`);
    if (!rang) errors.push(`3D printing (${d.id}): the courier never rang with the filament`);
    const m = G.items.printModel, floor = [G.stage.scene, G.world.upstairs, G.world.attic][d.goes.level];
    if (m.parent !== floor || Math.hypot(m.position.x - d.goes.place[0], m.position.z - d.goes.place[2]) > 0.01 || m.children.length !== 16)
      errors.push(`3D printing (${d.id}): the model isn't where it belongs`);
    G.missions.end();
    if (G.world.printer.spool.visible || G.items.printModel.visible) errors.push('3D printing: the printer or the model still shows after going back to the day');
    if (G.board.jobs.map(j => j.id).join() !== planBefore) errors.push('3D printing: the day didn\'t come back as it was');
  }
  const made = G.missions.best('print3d', 'dad');
  if (!made || made.made.length !== DESIGNS.length) errors.push(`3D printing: made so far ${made && made.made}`);
  else console.log('3D printing: made', made.made.join(', '));
  G.player.setCharacter(G.days.character);
}

/** Play a working-day mission (work from home, the office) like a sensible worker: one step at a time,
 *  the fire drill first when it's on, then whatever can be done now and is due soonest. */
function playWorkDay(label, seen) {
  for (let k = 0; k < 2000 && !S.mission.done; k++) {
    const notYet = j => (j.steps[j.i].notBefore || 0) > G.missions.minutes();
    const open = G.board.jobs.filter(j => j.i < j.steps.length && !(j.optional && S.mission.breaks && S.mission.breaks[j.key] >= 1))
      .filter(j => !S.mission.drill || j.steps[j.i].drill)
      .filter(j => !j.steps[j.i].can || j.steps[j.i].can(G))   // e.g. a child's teeth only once they're in pyjamas
      .sort((a, b) => (notYet(a) - notYet(b)) || ((a.due ?? 1e9) - (b.due ?? 1e9)));
    open.forEach(j => seen.add(j.key || j.title));
    // don't start something long when a meeting opens before it would be done: do something quick, or wait
    const spm = S.mission.clock ? S.mission.clock.secondsPerMinute : 1, now = G.missions.minutes();
    const opensSoon = Math.min(...open.filter(j => notYet(j) && j.due !== undefined).map(j => j.steps[j.i].notBefore));
    const fits = j => j.due !== undefined || notYet(j) || now + (j.steps[j.i].dur || 0) / spm + 4 < opensSoon;
    const ready = open.filter(fits);
    if (!ready.length || notYet(ready[0])) { for (let w = 0; w < 40; w++) frame(); continue; }   // (time passes)
    const job = ready[0], before = job.i, r = doStep(job);
    if (r !== true && r !== 'retry') { errors.push(`${label} "${job.title}" step ${before + 1}: ${r}`); job.i = job.steps.length; S.carrying = null; }
  }
}

/** A working day played well, walking included, should leave plenty of time to spare: a kid stopping to look
 *  round costs two minutes of the day per second (1.5 on Mum's slower office clock). */
const SPARE = 120;
function checkSpare(label) {
  const end = S.mission.clock.end, at = G.missions.minutes(), spare = end - at;
  console.log(`${label}: done at ${Math.floor(at / 60)}:${String(Math.floor(at % 60)).padStart(2, '0')} after walking ${Math.round(walked)} m, ${Math.round(spare)} min to spare`);
  if (spare < SPARE) errors.push(`${label}: played well it only finishes ${Math.round(spare)} min before ${end / 60}:00, want ${SPARE}+ to spare`);
}

// --- work from home, as Dad and as Mum: the morning in order, then the working day in any order, with a
// coffee, the urgent call and the 14:00 meeting, ending with the results card
for (const who of ['dad', 'mum']) {
  const { MISSIONS } = await import(new URL('../../house/js/missions/missions.js', import.meta.url));
  const spot = MISSIONS.wfh.spot(who);
  if (blocked(spot.start[0], spot.start[1], spot.level)) errors.push(`work from home (${who}): starts inside something`);
  const planBefore = G.board.jobs.map(j => j.id).join();
  G.missions.start('wfh', who);
  S.mission.callAt = 10 * 60;   // make sure the phone rings
  walked = 0;
  const seen = new Set();
  playWorkDay(`work from home (${who})`, seen);
  if (!S.mission.done) errors.push(`work from home (${who}): the day never finished`);
  for (const k of ['meet9', 'mail', 'doc', 'lunch', 'water', 'meet14', 'code', 'coffee', 'snack', 'urgent', 'finish'])
    if (!seen.has(k)) errors.push(`work from home (${who}): never had "${k}" on the list`);
  if (S.mission.done && G.missions.best('wfh', who).stars !== 3) errors.push(`work from home (${who}): a good day only got ${G.missions.best('wfh', who).stars} stars (due ${JSON.stringify(S.mission.due)}, done ${JSON.stringify(S.mission.doneAt)})`);
  if (S.mission.done) checkSpare(`work from home as ${who}`);
  G.missions.end();
  if (G.board.jobs.map(j => j.id).join() !== planBefore) errors.push(`work from home (${who}): the day didn't come back as it was`);
}

// --- a day at the office as Dad: ready at home, cycle there, clock in, the working day with the urgent call
// and a fire drill, clock out, cycle home and put the bike away
{
  const { MISSIONS } = await import(new URL('../../house/js/missions/missions.js', import.meta.url));
  const planBefore = G.board.jobs.map(j => j.id).join(), seen = new Set();
  G.missions.start('office', 'dad');
  S.mission.callAt = 11 * 60; S.mission.drillAt = 11.5 * 60;
  walked = 0;
  playWorkDay('office (dad)', seen);
  if (!S.mission.done) errors.push('office: the day never finished');
  for (const key of ['clockIn', 'boss', 'mail', 'doc', 'lunch', 'water', 'team', 'code', 'coffee', 'snack', 'loo', 'urgent', 'drill', 'finish', 'home'])
    if (!seen.has(key)) errors.push(`office: never had "${key}" on the list`);
  const bike = G.items.dadBike, h = bike.userData.home.pos;
  if (S.mission.done) {
    if (Math.hypot(bike.position.x - h[0], bike.position.z - h[2]) > 0.01) errors.push("office: Dad's bike isn't back on the terrace");
    if (G.missions.best('office', 'dad').stars !== 3) errors.push(`office: a good day only got ${G.missions.best('office', 'dad').stars} stars (due ${JSON.stringify(S.mission.due)}, done ${JSON.stringify(S.mission.doneAt)})`);
    checkSpare("Dad's office day");
  }
  if (S.mission && S.mission.drill) errors.push('office: still in a fire drill at the end');
  G.missions.end();
  if (G.board.jobs.map(j => j.id).join() !== planBefore) errors.push("office: the day didn't come back as it was");
  if (G.player.group.position.x > 30) errors.push('office: still at the office after going back to the day');
  const spot = MISSIONS.office.spot('dad');
  if (blocked(spot.start[0], spot.start[1], spot.level)) errors.push('office: Dad starts inside something');
}

// --- Mum's day at the office: drive there, cross on the zebra, badge in, clock in (a café coffee), up to her
// office floor, the working day with the urgent call and a fire drill (stairs, not the lift), then down, clock
// out, badge out and drive home
{
  const planBefore = G.board.jobs.map(j => j.id).join(), seen = new Set();
  G.missions.start('officeMum', 'mum');
  S.mission.callAt = 11 * 60; S.mission.drillAt = 11.5 * 60;
  walked = 0;
  let liftRefused = false;
  playWorkDay("Mum's office", seen);
  if (!S.mission.done) errors.push("Mum's office: the day never finished");
  for (const key of ['clockIn', 'cafe', 'meet10', 'mail', 'doc', 'lunch', 'water', 'meet14', 'code', 'coffee', 'snack', 'loo', 'urgent', 'drill', 'finish', 'home'])
    if (!seen.has(key)) errors.push(`Mum's office: never had "${key}" on the list`);
  if (S.mission.done) {
    const b = G.missions.best('officeMum', 'mum');
    if (b.stars !== 3) errors.push(`Mum's office: a good day only got ${b.stars} stars (due ${JSON.stringify(S.mission.due)}, done ${JSON.stringify(S.mission.doneAt)})`);
    checkSpare("Mum's office day");
    if (!G.world.car.visible || G.world.mumCar.visible) errors.push("Mum's office: the car isn't back home");
  }
  void liftRefused;
  G.missions.end();
  if (!G.world.car.visible || G.world.mumCar.visible) errors.push("Mum's office: the car isn't back home after the mission");
  if (G.board.jobs.map(j => j.id).join() !== planBefore) errors.push("Mum's office: the day didn't come back as it was");
}
// the lift doesn't run in a fire drill
{
  G.missions.start('officeMum', 'mum');
  G.missions.travel('mumOffice');
  S.mission.drill = true;
  G.player.group.position.set(109.0, 0, 16.9); frame();
  const n = G.board.nearestAction(G.player.group.position);
  if (!n || n.step.label !== 'Take the lift up') errors.push(`Mum's office: no lift button (${n ? n.step.label : 'nothing'})`);
  else { G.board.act(n); if (S.level !== 0) errors.push("Mum's office: the lift ran during a fire drill"); }
  S.mission.drill = false;
  G.board.act(G.board.nearestAction(G.player.group.position));
  if (S.level !== 1) errors.push("Mum's office: the lift didn't take Mum up");
  G.missions.end();
}

// --- bedtime, as Mum and as Dad, with every kind of trouble between the two evenings: off the iPads, up to
// the bathroom, a shower, pyjamas and teeth each, a story, into bed and lights out, then back downstairs
{
  const { MISSIONS } = await import(new URL('../../house/js/missions/missions.js', import.meta.url));
  const { BED, SEARCH } = await import(new URL('../../house/js/systems/bedtime.js', import.meta.url));
  const B = G.bedtime, PJ = { girl: 'pyjamasGirl', boy: 'pyjamasBoy' };
  for (const [who, first, trouble] of [
    ['mum', 1, { pyjamas: { who: 'girl', spot: 0 }, book: { who: 'boy' }, dance: { who: 'boy', at: 0 }, water: { who: 'girl' } }],
    ['dad', 2, { dragon: { who: 'girl' }, ipad: { who: 'boy', at: 0 }, hide: { who: 'girl', spot: 2, at: 0 }, pyjamas: { who: 'boy', spot: 1 } }]]) {
    const label = `bedtime (${who})`, spot = MISSIONS.bedtime.spot(who);
    if (blocked(spot.start[0], spot.start[1], spot.level)) errors.push(`${label}: starts inside something`);
    const planBefore = G.board.jobs.map(j => j.id).join(), seen = new Set();
    G.missions.start('bedtime', who);
    // tonight's trouble, set for the test: the lost pyjamas go where they were "lost", the others in the wardrobes
    S.mission.trouble = trouble;
    for (const k of ['girl', 'boy']) { const it = G.items[PJ[k]], h = it.userData.home; h.parent.attach(it); it.position.fromArray(h.pos); it.userData.level = h.level; it.visible = true; }
    const lost = G.items[PJ[trouble.pyjamas.who]];
    G.world.upstairs.attach(lost); lost.position.set(...SEARCH.pyjamas[trouble.pyjamas.spot].place); lost.userData.level = 1;
    if (!B.on || G.stage.hemi.intensity > 0.3) errors.push(`${label}: not evening`);
    if (!B.is('girl', 'sofa') || !B.is('boy', 'sofa')) errors.push(`${label}: the kids aren't on the sofa with their iPads`);
    laptopPick = first;   // who showers first: 1 P, 2 Dude
    walked = 0;
    playWorkDay(label, seen);
    if (!S.mission.done) { errors.push(`${label}: never finished (on "${(G.board.jobs.find(j => j.i < j.steps.length) || { title: '?' }).title}")`); G.missions.end(); continue; }
    for (const key of ['ipad-girl', 'ipad-boy', 'first', 'shower-girl', 'shower-boy', 'pyjamas-girl', 'pyjamas-boy', 'story', 'bed-girl', 'bed-boy', 'down'])
      if (!seen.has(key)) errors.push(`${label}: never had "${key}" on the list`);
    for (const name of Object.keys(trouble)) {
      if (S.mission.trouble[name].skipped) errors.push(`${label}: the ${name} trouble never happened`);
      if (['dance', 'ipad', 'hide'].includes(name) && !seen.has(name === 'ipad' ? 'ipadAgain' : name)) errors.push(`${label}: no "${name}" job`);
    }
    if (trouble.book && !trouble.book.refused) errors.push(`${label}: the first story pick wasn't refused`);
    const [a, b] = first === 1 ? ['girl', 'boy'] : ['boy', 'girl'];
    if (!(S.mission.doneAt[`shower-${a}`] < S.mission.doneAt[`shower-${b}`])) errors.push(`${label}: the child chosen to go first didn't`);
    for (const k of ['girl', 'boy']) {
      if (!B.is(k, 'bed') || !B.kid(k).dressed) errors.push(`${label}: ${k} isn't in bed in pyjamas`);
      if (B.kid(k).level !== BED.bed[k].level) errors.push(`${label}: ${k} is in bed on the wrong floor`);
    }
    if (S.level !== 0) errors.push(`${label}: not back downstairs at the end`);
    const r = G.missions.best('bedtime', who), out = Math.max(S.mission.lightsOut.girl, S.mission.lightsOut.boy);
    console.log(`${label}: lights out at ${Math.floor(out / 60)}:${String(Math.floor(out % 60)).padStart(2, '0')} after walking ${Math.round(walked)} m, ${r.stars} stars`);
    if (r.stars !== 3 || out > 20.5 * 60 - 12) errors.push(`${label}: played well with four lots of trouble, lights out only at ${Math.round(out)} min (want by 20:18, for three stars with room to spare)`);
    G.missions.end();
    if (B.on || G.stage.hemi.intensity < 0.7 || B.kid('girl').c.root.visible) errors.push(`${label}: still evening after going back to the day`);
    if (G.board.jobs.map(j => j.id).join() !== planBefore) errors.push(`${label}: the day didn't come back as it was`);
  }
}

// --- looks and birthdays (the avatar editor): a new look is worn straight away and saved on the device; a
// birthday that makes P a teenager makes her taller and puts cooking on her list
{
  const P = G.players, scaleOf = () => G.player.character.scale;
  G.days.setCharacter('girl'); G.player.setCharacter('girl');
  if (P.stage('girl') !== 'child' || Math.abs(scaleOf() - 0.78) > 1e-9) errors.push(`looks: P should start as a child (stage ${P.stage('girl')}, height ${scaleOf()})`);
  const before = G.player.character;
  P.setLook('girl', { hair: 'ponytail', hairColor: '#b8402a', glasses: true });
  if (G.player.character === before) errors.push("looks: P's figure wasn't rebuilt after changing her look");
  const saved = JSON.parse(store.get('fordHouse.players.v1') || '{}');
  if (!saved.girl || saved.girl.look.hair !== 'ponytail' || saved.girl.look.glasses !== true) errors.push("looks: P's new look wasn't saved on the device");
  const y = new Date().getFullYear();
  P.setBirthday('girl', `${y - 14}-01-01`);
  if (P.stage('girl') !== 'teen' || Math.abs(scaleOf() - 0.88) > 1e-9) errors.push(`looks: at 14 P should be a taller teenager (stage ${P.stage('girl')}, height ${scaleOf()})`);
  G.days.next();
  if (!G.board.find('cook')) errors.push("growing up: P the teenager hasn't got cooking on her list");
  playDay('a day as teenage P');
  G.days.next();
  P.setBirthday('girl', null); P.resetLook('girl');
  if (P.stage('girl') !== 'child' || Math.abs(scaleOf() - 0.78) > 1e-9) errors.push('looks: P back to a child after clearing her birthday');
  G.days.next();
  if (G.board.find('cook')) errors.push('growing up: P the child still has cooking on her list');
  // a beard: Dad has one; any grown-up can (Mum, and P or Dude once they're 18), never a child or a teenager
  const { specFor } = await import(new URL('../../house/js/characters/looks.js', import.meta.url));
  if (!specFor('dad', P.look('dad'), 'adult').beard || P.look('dad').hair !== 'bald') errors.push('looks: Dad should be bald with a beard');
  if (specFor('boy', { beard: true }, 'teen').beard) errors.push('looks: Dude has a beard as a teenager');
  if (!specFor('boy', { beard: true }, 'adult').beard) errors.push("looks: Dude can't have a beard at 18");
  if (!specFor('mum', { beard: true }, 'adult').beard || !specFor('girl', { beard: true }, 'adult').beard) errors.push('looks: Mum and grown-up P can\'t have a beard');
  if (specFor('girl', { beard: true }, 'child').beard) errors.push('looks: a child with a beard');
  G.days.setCharacter('dad'); G.player.setCharacter('dad');
  G.days.next();
}

// --- a birthday (P's, set with ?birthday=girl): Dad decorates, gets the cake out, sings, wraps a present and
// lets Grandma and Grandpa in; then P's own birthday, where she blows out her candles and opens her presents
{
  const { BD } = await import(new URL('../../house/js/systems/birthday.js', import.meta.url));
  const party = ['bdayDecorate', 'bdayCake', 'bdayPresents', 'bdayGuests'];
  globalThis.location.search = '?season=autumn&birthday=girl';
  for (const who of ['dad', 'girl']) {
    const label = `P's birthday (as ${who})`;
    G.days.setCharacter(who); G.player.setCharacter(who);
    G.days.next();
    const plan = G.board.jobs.map(j => j.id);
    if (!party.every(id => plan.includes(id))) errors.push(`${label}: party jobs missing from the planned day (${party.filter(id => !plan.includes(id))})`);
    G.days.plan(party);
    if (G.birthday.who !== 'girl') errors.push(`${label}: not P's birthday`);
    const presents = G.board.find('bdayPresents');
    if ((who === 'girl') !== /Open your presents/.test(presents.title)) errors.push(`${label}: presents job is "${presents.title}"`);
    let rang = false;
    const realIn = G.birthday.guestsIn;
    G.birthday.guestsIn = () => { rang = G.birthday.guests === 'waiting'; realIn(); };
    playDay(label);
    G.birthday.guestsIn = realIn;
    const cake = G.items.cake, c = cake.userData.cake;
    if (cake.parent !== G.stage.scene || Math.hypot(cake.position.x - BD.table.cake[0], cake.position.z - BD.table.cake[2]) > 0.01 || !c.slice.visible || c.flames.some(f => f.visible)) errors.push(`${label}: the cake isn't on the table, cut, with the candles out`);
    if (!rang) errors.push(`${label}: Grandma and Grandpa weren't at the door when it was opened`);
    if (who === 'dad') {
      const gift = G.items.giftBox;
      if (gift.parent !== G.stage.scene || !gift.visible) errors.push(`${label}: the wrapped present isn't on the table`);
    }
    G.days.next();
  }
  globalThis.location.search = '?season=autumn&birthday=none';
  G.days.setCharacter('dad'); G.player.setCharacter('dad');
  G.days.plan(['hands']);
  if (G.birthday.who || G.items.cake.visible || G.items.giftBox.visible) errors.push('after the birthday: decorations, the cake or the present still about');
  playDay('the day after the birthday');
  G.days.next();
  globalThis.location.search = '?season=autumn';
  console.log("P's birthday: party as Dad and as P, cake, presents, Grandma and Grandpa");
}

// a fire drill straight after the urgent call: the call's deadline moves on by however long the drill took
{
  G.missions.start('office', 'dad');
  for (let k = 0; k < 400 && !G.board.jobs.some(j => j.key === 'boss'); k++) {   // up, ready, to the office, clocked in
    const j = G.board.jobs.find(x => x.i < x.steps.length && !x.optional); if (!j) { frame(); continue; }
    const r = doStep(j); if (r !== true && r !== 'retry') { errors.push('drill and call: ' + r); break; }
  }
  S.mission.callAt = G.missions.minutes(); frame();
  const call = G.board.jobs.find(j => j.key === 'urgent');
  S.mission.drillAt = G.missions.minutes(); frame();
  const drill = G.board.jobs.find(j => j.key === 'drill');
  if (!call || !drill) errors.push(`drill and call: call ${!!call}, drill ${!!drill}`);
  else {
    const due = call.due, from = G.missions.minutes();
    while (drill.i < drill.steps.length) { const r = doStep(drill); if (r !== true) { errors.push('drill and call: ' + r); break; } }
    const took = G.missions.minutes() - from;
    if (Math.abs(call.due - (due + took)) > 2 || S.mission.due.urgent !== call.due) errors.push(`drill and call: the call was due ${Math.round(due)}, drill took ${Math.round(took)} min, now due ${Math.round(call.due)}`);
    if (!call.title.includes(String(Math.floor(call.due / 60)))) errors.push(`drill and call: the call's title wasn't updated (${call.title})`);
  }
  G.missions.end();
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

// --- who sleeps where (#78): P and Dude swap rooms. Their beds, wardrobes and desks follow them (homework,
// making the beds, the folded washing, the school run, bedtime, Halloween costumes, the Christmas wish list and
// present, the 3D-printed dragon and rocket); the room chips and labels say whose room is whose. Then back.
{
  const { roomFor, kidIn } = await import(new URL('../../house/js/pack/kidrooms.js', import.meta.url));
  const { roomAt } = await import(new URL('../../house/js/world/rooms.js', import.meta.url));
  const { DESIGNS } = await import(new URL('../../house/js/systems/printing.js', import.meta.url));
  const { KIDS: kidsNow, MISSIONS } = await import(new URL('../../house/js/missions/missions.js', import.meta.url));
  G.settings.setRoomsSwapped(true);
  if (kidIn('attic') !== 'girl' || kidIn('first') !== 'boy' || roomFor('girl').level !== 2) errors.push('rooms swapped: P should be in the attic, Dude on the first floor');
  if (roomAt(1.5, 7, 1).name !== "Dude's room" || roomAt(2, 2, 2).name !== 'Ps Zimmer') errors.push(`rooms swapped: room chips ${roomAt(1.5, 7, 1).name}, ${roomAt(2, 2, 2).name}`);
  if (DESIGNS[0].goes.level !== 2 || DESIGNS[3].goes.level !== 1) errors.push("rooms swapped: the printed dragon and rocket don't go to the new desks");
  for (const [who, kid] of Object.entries({ girl: kidsNow.girl, boy: kidsNow.boy })) {
    if (blocked(kid.start[0], kid.start[1], kid.level)) errors.push(`rooms swapped: ${who} wakes up inside something`);
  }
  const seenAt = [];
  for (const who of ['girl', 'boy']) {
    const label = `rooms swapped (${who})`, r = roomFor(who);
    G.days.setCharacter(who); G.player.setCharacter(who);
    G.days.plan(['homework', 'beds', 'fold']);
    const hw = G.board.find('homework').steps[0];
    if (G.board.levelOf(hw) !== r.level || hw.at !== r.desk.at) errors.push(`${label}: homework isn't at the desk in the new room`);
    const beds = G.board.find('beds').steps.map(st => st.label).join(' / ');
    if (!beds.includes("Make Dude's bed") || !beds.includes("Make P's bed")) errors.push(`${label}: beds "${beds}"`);
    playDay(`${label}: homework, beds, washing`);
    const pile = G.items[who === 'girl' ? 'pileP' : 'pileDude'];
    seenAt.push(pile.userData.level);
    G.days.next();
    // Halloween: the costume from the wardrobe in the new room, the sweets up to the new desk
    globalThis.location.search = '?season=autumn&holiday=halloween';
    G.days.plan(['trickOrTreat']);
    laptopPick = 1;
    playDay(`${label}: Halloween`);
    if (G.items.treatPail.userData.level !== r.level) errors.push(`${label}: the sweets went to the old room`);
    G.days.next();
    // Christmas: the wish list and the present made at the desk in the new room
    globalThis.location.search = '?season=winter&date=2026-12-15';
    G.days.plan(['wishList', 'xmasGift']);
    playDay(`${label}: Christmas`);
    G.days.next();
    globalThis.location.search = '?season=autumn';
    // the school run, waking up in the new room
    G.missions.start('schoolRun', who);
    for (let round = 0; round < 30 && !S.mission.done; round++) {
      for (const job of G.board.jobs.filter(j => j.i < j.steps.length)) {
        let guard = 0;
        while (job.i < job.steps.length && guard++ < 10) {
          const before = job.i, res = doStep(job);
          if (res !== true) { errors.push(`${label} school run "${job.title}" step ${before + 1}: ${res}`); job.i = job.steps.length; S.carrying = null; break; }
        }
      }
      frame();
    }
    if (!S.mission.done) errors.push(`${label}: never got to school`);
    G.missions.end();
  }
  if (seenAt.join() !== '2,1') errors.push(`rooms swapped: the folded clothes went to floors ${seenAt}, want P's in the attic and Dude's downstairs`);
  // bedtime: each tucked into the bed in their new room
  {
    const B = G.bedtime, seen = new Set();
    G.missions.start('bedtime', 'mum');
    S.mission.trouble = {};
    laptopPick = 1;
    playWorkDay('rooms swapped bedtime', seen);
    if (!S.mission.done) errors.push('rooms swapped bedtime: never finished');
    for (const k of ['girl', 'boy']) if (!B.is(k, 'bed') || B.kid(k).level !== roomFor(k).level) errors.push(`rooms swapped bedtime: ${k} isn't in bed in the new room`);
    G.missions.end();
    void MISSIONS;
  }
  G.settings.setRoomsSwapped(false);
  if (kidIn('first') !== 'girl' || roomAt(1.5, 7, 1).name !== "P's room") errors.push('rooms back: P should be on the first floor again');
  G.days.setCharacter('dad'); G.player.setCharacter('dad');
  G.days.next();
  console.log('who sleeps where: swapped rooms for homework, beds, washing, Halloween, Christmas, the school run and bedtime');
}

// --- the shape of the family (#78): she/he/they in the labels, and a family with one grown-up. With Dad left
// out the game carries on as Mum, she does Dad's household jobs (the bike, the solar panels), the texts say
// just "Mum", and she can do the 3D printing; his shaving and his work don't come. Then Dad comes back.
{
  const { BED } = await import(new URL('../../house/js/systems/bedtime.js', import.meta.url));
  G.players.setPronoun('boy', 'they'); G.players.setPronoun('girl', 'he');
  if (BED.bed.boy.name !== 'their bed' || BED.wardrobe.girl.name !== 'his wardrobe') errors.push(`pronouns: bedtime says ${BED.bed.boy.name}, ${BED.wardrobe.girl.name}`);
  G.players.setPronoun('boy', null); G.players.setPronoun('girl', null);

  G.days.setCharacter('dad'); G.player.setCharacter('dad');
  G.players.setInFamily('dad', false);
  if (G.days.character !== 'mum') errors.push(`one grown-up: still playing as ${G.days.character} after leaving Dad out`);
  G.days.plan(['fixBike', 'solar', 'fold']);
  const fold = G.board.find('fold').steps.map(st => st.label).join(' / ');
  if (!fold.includes("Pick up Mum's clothes")) errors.push(`one grown-up: the washing says "${fold}"`);
  playDay('one grown-up: Mum does the bike, the solar panels and the washing');
  G.days.next();
  // P's Christmas present is for Mum only
  globalThis.location.search = '?season=winter&date=2026-12-15';
  G.days.setCharacter('girl'); G.player.setCharacter('girl');
  G.days.plan(['xmasGift']);
  if (G.board.find('xmasGift').title !== 'Make a present for Mum') errors.push(`one grown-up: "${G.board.find('xmasGift').title}"`);
  playDay('one grown-up: the Christmas present');
  G.days.next();
  globalThis.location.search = '?season=autumn';
  // Mum prints a dragon on Dad's printer
  laptopPick = 1;
  G.missions.start('print3d', 'mum');
  for (let round = 0; round < 30 && !S.mission.done; round++) {
    for (const job of G.board.jobs.filter(j => j.i < j.steps.length)) {
      let guard = 0;
      while (job.i < job.steps.length && guard++ < 10) {
        const before = job.i, r = doStep(job);
        if (r !== true) { errors.push(`one grown-up 3D printing "${job.title}" step ${before + 1}: ${r}`); job.i = job.steps.length; S.carrying = null; break; }
      }
    }
    frame();
  }
  if (!S.mission.done) errors.push('one grown-up: Mum never finished the 3D printing');
  G.missions.end();
  // a few days as Mum: Dad's own jobs never come, his household ones do
  G.days.setCharacter('mum'); G.player.setCharacter('mum');
  const seen = new Set();
  for (let d = 0; d < 8; d++) { G.board.jobs.forEach(j => seen.add(j.id)); G.days.next(); }
  if (seen.has('shave') || seen.has('dadWork')) errors.push(`one grown-up: Dad's own jobs came for Mum (${[...seen].filter(id => /shave|dadWork/.test(id))})`);
  G.players.setInFamily('dad', true);
  G.days.setCharacter('dad'); G.player.setCharacter('dad');
  G.days.next();
  console.log('the shape of the family: pronouns in the labels; with one grown-up, Mum does the household jobs and the 3D printing');
}

console.log('every job played:', pool.every(id => played.has(id) || missing.includes(id)), `(${pool.length} jobs)`);
console.log('trips up or down the stairs:', stairTrips);
if (!stairTrips) errors.push('never used the stairs');
console.log('renders:', G.stage.renderer.frames, 'carrying:', S.carrying, 'power:', S.powerOn);
console.log(errors.length ? 'PROBLEMS:\n- ' + errors.join('\n- ') : 'no problems');
process.exitCode = errors.length ? 1 : 0;

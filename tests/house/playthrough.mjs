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
globalThis.document = {
  getElementById: () => el(), querySelectorAll: () => [ { ...el(), dataset: { c: 'dad' } }, { ...el(), dataset: { c: 'girl' } } ],
  createElement: tag => tag === 'canvas' ? { width: 0, height: 0, getContext: () => ctx2d } : el(),
};
const raf = []; globalThis.requestAnimationFrame = f => raf.push(f);
const store = new Map();
globalThis.localStorage = { getItem: k => store.get(k) ?? null, setItem: (k, v) => store.set(k, String(v)), removeItem: k => store.delete(k) };

const errors = [];
await import(new URL('../../house/js/main.js', import.meta.url));
const { blocked } = await import(new URL('../../house/js/core/collision.js', import.meta.url));
const { REACH } = await import(new URL('../../house/js/config.js', import.meta.url));
const G = globalThis.house, S = G.S;
const frame = () => { const f = raf.shift(); if (!f) throw new Error('no frame scheduled'); f(); };
for (let i = 0; i < 5; i++) frame();
console.log('boot ok, jobs:', G.board.jobs.length, 'renders:', G.stage.renderer.frames);

// --- reachability: flood-fill walkable space from the front path
const RES = 0.05, X0 = -2.25, Z0 = -17.3, NX = Math.round(7.75 / RES), NZ = Math.round(30.7 / RES);
const seen = new Uint8Array(NX * NZ), cells = [];
const idx = (i, k) => k * NX + i;
const start = [Math.round((3.92 - X0) / RES), Math.round((10.6 - Z0) / RES)];
const q = [start]; seen[idx(...start)] = 1;
while (q.length) {
  const [i, k] = q.pop(); cells.push([X0 + i * RES, Z0 + k * RES]);
  for (const [di, dk] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const ni = i + di, nk = k + dk;
    if (ni < 0 || nk < 0 || ni >= NX || nk >= NZ || seen[idx(ni, nk)]) continue;
    seen[idx(ni, nk)] = 1;
    if (!blocked(X0 + ni * RES, Z0 + nk * RES)) q.push([ni, nk]);
  }
}
console.log('walkable cells:', cells.length);
function standNear(p) {
  let best = null, bd = 1e9;
  for (const c of cells) { const d = Math.hypot(c[0] - p[0], c[1] - p[1]); if (d < bd) { bd = d; best = c; } }
  return { cell: best, dist: bd };
}

// --- playing one job, step by step
const goTo = cell => { G.player.group.position.set(cell[0], 0, cell[1]); };
function doStep(job) {
  const s = job.steps[job.i];
  if (s.kind === 'mow') {
    for (const c of G.world.lawn.cells) { if (job.steps[job.i] !== s) break; G.player.group.position.set(c.x, 0, c.z - 0.95); G.player.group.rotation.y = 0; frame(); }
    return job.steps[job.i] !== s || 'lawn never finished';
  }
  if (s.kind === 'hoover') {
    for (const [x, z] of [[2.3, 0.75], [1.5, 3.6], [2.4, 4.7], [0.4, 6.4], [2.5, 6.1], [2.4, 8.4], [4.0, 4.6], [3.95, 5.9]]) {
      const { cell } = standNear([x, z - 0.55]); goTo(cell);
      G.player.group.rotation.y = Math.atan2(x - cell[0], z - cell[1]); frame();
    }
    return job.steps[job.i] !== s || 'dust left behind';
  }
  if (s.kind === 'charge') { for (let n = 0; n < 2500 && job.steps[job.i] === s; n++) { if (!S.powerOn) fixPower(); frame(); } return job.steps[job.i] !== s || 'never charged'; }

  const p = stepAt(s), { cell, dist } = standNear(p);
  if (dist > REACH - 0.02) return `can't get within reach of [${p.map(v => v.toFixed(2))}] (closest ${dist.toFixed(2)} m)`;
  goTo(cell); frame();
  const n = G.board.nearestAction(G.player.group.position);
  if (!n || n.step !== s) return `button shows "${n ? n.step.label : 'nothing'}" instead of "${s.label}"`;
  G.board.act(n);
  if (s.kind === 'sit') {
    for (let k = 0; k < 2000 && job.steps[job.i] === s; k++) {
      if (!S.powerOn && (s.screen || s.power)) { G.sitting.standUp(); fixPower(); return doStep(job); }
      frame();
    }
    if (job.steps[job.i] === s) return 'sitting never finished';
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
const played = new Set(), dayLog = [], binTitles = [];
const kerb = id => G.items[id].position.z > 12.5;
const binIds = ['binBlue', 'binYellow', 'binBlack', 'binBrown'];
for (let n = 1; n <= 12; n++) {
  const day = G.days.day, label = `day ${day}`;
  const plan = G.board.jobs.filter(j => !j.event).map(j => j.id);
  dayLog.push(plan);
  plan.forEach(id => played.add(id));
  if (plan.length < 10 || plan.length > 12) errors.push(`${label}: ${plan.length} jobs, want 10-12`);

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

// --- starting over goes back to day 1
G.days.restart();
if (G.days.day !== 1 || G.board.jobs.length < 10) errors.push(`start over: day ${G.days.day} with ${G.board.jobs.length} jobs`);

console.log('every job played:', pool.every(id => played.has(id) || missing.includes(id)), `(${pool.length} jobs)`);
console.log('renders:', G.stage.renderer.frames, 'carrying:', S.carrying, 'power:', S.powerOn);
console.log(errors.length ? 'PROBLEMS:\n- ' + errors.join('\n- ') : 'no problems');
process.exitCode = errors.length ? 1 : 0;

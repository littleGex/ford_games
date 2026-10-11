// Play-through test, no browser needed:  node --import ./house/tests/register.mjs house/tests/playthrough.mjs
// Boots the game against a stand-in three.js, checks every job step can be reached on foot from the
// front path, then plays through every job (including the post, parcel and power-cut events).
// Exits with code 1 if anything is unreachable or a job cannot be finished.
const listeners = {};
const el = () => ({
  classList: { add() {}, remove() {}, toggle() {}, contains: () => false }, style: {}, dataset: {},
  addEventListener() {}, setAttribute() {}, setPointerCapture() {}, append() {}, replaceChildren() {},
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

const errors = [];
await import(new URL('../js/main.js', import.meta.url));
const { blocked } = await import(new URL('../js/core/collision.js', import.meta.url));
const { REACH } = await import(new URL('../js/config.js', import.meta.url));
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
const stepAt = s => s.at || (() => { const v = { x: 0, y: 0, z: 0, set(x, y, z) { this.x = x; this.y = y; this.z = z; return this; } }; G.items[s.item].getWorldPosition(v); return [v.x, v.z]; })();

// --- play through every job
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

S.started = true;
let rounds = 0;
while (rounds++ < 60) {
  const open = G.board.jobs.filter(j => j.i < j.steps.length);
  if (!open.length) break;
  for (const job of open) {
    let guard = 0;
    while (job.i < job.steps.length && guard++ < 10) {
      if (!S.powerOn && job.id !== 'fuses') fixPower();
      const before = job.i, r = doStep(job);
      if (r !== true) { errors.push(`${job.id} step ${before + 1} (${job.steps[before].kind}): ${r}`); job.i = job.steps.length; S.carrying = null; break; }
    }
  }
  for (let k = 0; k < 400; k++) frame();   // let time pass so the post, parcel and power cuts happen
}
const done = G.board.jobs.filter(j => j.i >= j.steps.length).length;
console.log(`jobs finished: ${done}/${G.board.jobs.length}`, G.board.jobs.map(j => j.id).join(', '));
console.log('renders:', G.stage.renderer.frames, 'carrying:', S.carrying, 'power:', S.powerOn);
console.log(errors.length ? 'PROBLEMS:\n- ' + errors.join('\n- ') : 'no problems');
process.exitCode = errors.length || done < G.board.jobs.length ? 1 : 0;

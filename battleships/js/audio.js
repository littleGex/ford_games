// Sounds made on the spot with Web Audio (no sound files): the shell going up, a splash, a boom, a ship going
// down, and a little tune at the end. Browsers only allow sound after the player has touched the screen or
// pressed a key. Sound can be switched off on the menu; that's remembered on the device.
let ctx = null, on = true, noiseBuf = null;
function unlock() {
  try { ctx = ctx || new (window.AudioContext || window.webkitAudioContext)(); ctx.resume(); } catch (e) { /* no audio */ }
}
window.addEventListener('pointerdown', unlock, { once: true });
window.addEventListener('keydown', unlock, { once: true });

export const setSound = value => { on = !!value; };
export const soundOn = () => on;

function noise() {
  if (!noiseBuf) {
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  const src = ctx.createBufferSource();
  src.buffer = noiseBuf;
  return src;
}
const play = fn => { if (!ctx || !on) return; try { fn(ctx.currentTime); } catch (e) { /* ignore */ } };
const envelope = (g, now, peak, attack, length) => {
  g.gain.setValueAtTime(0.0001, now);
  g.gain.exponentialRampToValueAtTime(peak, now + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, now + length);
};

/** The gun firing and the shell whistling away. */
export const launch = () => play(now => {
  const thump = ctx.createOscillator(), tg = ctx.createGain();
  thump.frequency.setValueAtTime(120, now); thump.frequency.exponentialRampToValueAtTime(40, now + 0.25);
  envelope(tg, now, 0.35, 0.005, 0.3);
  thump.connect(tg); tg.connect(ctx.destination); thump.start(now); thump.stop(now + 0.32);
  const w = ctx.createOscillator(), wg = ctx.createGain();
  w.type = 'sine'; w.frequency.setValueAtTime(1400, now + 0.1); w.frequency.exponentialRampToValueAtTime(500, now + 0.9);
  envelope(wg, now + 0.1, 0.035, 0.1, 0.95);
  w.connect(wg); wg.connect(ctx.destination); w.start(now + 0.1); w.stop(now + 1);
});

/** A miss: a splash of water. */
export const splash = () => play(now => {
  const n = noise(), f = ctx.createBiquadFilter(), g = ctx.createGain();
  f.type = 'lowpass'; f.frequency.setValueAtTime(2400, now); f.frequency.exponentialRampToValueAtTime(300, now + 0.6);
  envelope(g, now, 0.4, 0.01, 0.7);
  n.connect(f); f.connect(g); g.connect(ctx.destination); n.start(now); n.stop(now + 0.75);
});

/** A hit: a boom. */
export const boom = () => play(now => {
  const o = ctx.createOscillator(), og = ctx.createGain();
  o.frequency.setValueAtTime(90, now); o.frequency.exponentialRampToValueAtTime(30, now + 0.6);
  envelope(og, now, 0.6, 0.005, 0.7);
  o.connect(og); og.connect(ctx.destination); o.start(now); o.stop(now + 0.75);
  const n = noise(), f = ctx.createBiquadFilter(), g = ctx.createGain();
  f.type = 'lowpass'; f.frequency.setValueAtTime(1200, now); f.frequency.exponentialRampToValueAtTime(120, now + 0.8);
  envelope(g, now, 0.5, 0.005, 0.9);
  n.connect(f); f.connect(g); g.connect(ctx.destination); n.start(now); n.stop(now + 0.95);
});

/** A ship going down: a long low rumble and bubbles. */
export const sink = () => play(now => {
  const n = noise(), f = ctx.createBiquadFilter(), g = ctx.createGain();
  f.type = 'lowpass'; f.frequency.value = 220;
  envelope(g, now, 0.5, 0.2, 2.2);
  n.connect(f); f.connect(g); g.connect(ctx.destination); n.start(now); n.stop(now + 2.3);
  for (let i = 0; i < 7; i++) {
    const t = now + 0.3 + i * 0.22 + Math.random() * 0.1, o = ctx.createOscillator(), og = ctx.createGain();
    o.frequency.setValueAtTime(300 + Math.random() * 300, t); o.frequency.exponentialRampToValueAtTime(900, t + 0.08);
    envelope(og, t, 0.05, 0.01, 0.1);
    o.connect(og); og.connect(ctx.destination); o.start(t); o.stop(t + 0.12);
  }
});

/** The end of the game: up for a win, down for a loss. */
export const tune = won => play(now => {
  const notes = won ? [523, 659, 784, 1047] : [392, 349, 311, 262];
  notes.forEach((freq, i) => {
    const t = now + i * 0.16, o = ctx.createOscillator(), g = ctx.createGain();
    o.type = 'triangle'; o.frequency.value = freq;
    envelope(g, t, 0.18, 0.02, i === notes.length - 1 ? 0.8 : 0.3);
    o.connect(g); g.connect(ctx.destination); o.start(t); o.stop(t + 0.85);
  });
});

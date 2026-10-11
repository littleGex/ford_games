// Browsers only allow sound after the player has touched the screen or pressed a key.
let ctx = null;
function unlock() {
  try { ctx = ctx || new (window.AudioContext || window.webkitAudioContext)(); ctx.resume(); } catch (e) { /* no audio */ }
}
window.addEventListener('pointerdown', unlock, { once: true });
window.addEventListener('keydown', unlock, { once: true });

export function dingDong() {
  if (!ctx) return;
  try {
    const now = ctx.currentTime;
    [[659, 0], [523, 0.38]].forEach(([f, t]) => {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = 'sine'; o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, now + t);
      g.gain.exponentialRampToValueAtTime(0.25, now + t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, now + t + 0.7);
      o.connect(g); g.connect(ctx.destination); o.start(now + t); o.stop(now + t + 0.75);
    });
  } catch (e) { /* ignore */ }
}

// The radio on a desk: a soft made-up tune that loops while someone works there.
const TUNE = [523, 659, 784, 659, 587, 698, 880, 698, 523, 659, 784, 1047, 988, 784, 659, 587];
let radioTimer = null, radioStep = 0;
export function radio(on) {
  if (!on) { if (radioTimer) { clearInterval(radioTimer); radioTimer = null; } return; }
  if (radioTimer || !ctx) return;
  const beat = () => {
    try {
      const now = ctx.currentTime, f = TUNE[radioStep++ % TUNE.length];
      [[f, 0.045, 'triangle'], [f / 2, 0.03, 'sine']].forEach(([freq, vol, type]) => {
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.type = type; o.frequency.value = freq;
        g.gain.setValueAtTime(0.0001, now);
        g.gain.exponentialRampToValueAtTime(vol, now + 0.03);
        g.gain.exponentialRampToValueAtTime(0.0001, now + 0.42);
        o.connect(g); g.connect(ctx.destination); o.start(now); o.stop(now + 0.45);
      });
    } catch (e) { /* ignore */ }
  };
  beat(); radioTimer = setInterval(beat, 320);
}

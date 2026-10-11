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

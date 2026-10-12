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

// Music while someone sits and plays or works: the radio on a desk, Dude's clarinet. Made-up tunes, made with
// the browser's own sound (no recordings). music('radio') / music('clarinet') starts one, music(null) stops.
const SONGS = {
  radio: { notes: [523, 659, 784, 659, 587, 698, 880, 698, 523, 659, 784, 1047, 988, 784, 659, 587], beat: 0.32, len: 0.42,
           voices: [[1, 0.045, 'triangle'], [0.5, 0.03, 'sine']] },
  // a clarinet: a hollow, reedy square wave, softened, with a little vibrato; slower and legato
  clarinet: { notes: [392, 440, 494, 587, 494, 440, 392, 330, 349, 392, 440, 392, 349, 330, 294, 392], beat: 0.52, len: 0.56,
              voices: [[1, 0.05, 'square']], filter: 1500, vibrato: 5 },
};
let playing = null, timer = null, step = 0;
export function music(kind) {
  if (kind === playing && (timer || !kind)) return;
  if (timer) { clearInterval(timer); timer = null; }
  playing = kind;
  if (!kind || !ctx) return;
  const song = SONGS[kind];
  const note = () => {
    try {
      const now = ctx.currentTime, f = song.notes[step++ % song.notes.length];
      for (const [mult, vol, type] of song.voices) {
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.type = type; o.frequency.value = f * mult;
        let out = o;
        if (song.filter) { const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = song.filter; o.connect(lp); out = lp; }
        if (song.vibrato) {
          const lfo = ctx.createOscillator(), depth = ctx.createGain();
          lfo.frequency.value = song.vibrato; depth.gain.value = f * 0.006; lfo.connect(depth); depth.connect(o.frequency);
          lfo.start(now); lfo.stop(now + song.len + 0.05);
        }
        g.gain.setValueAtTime(0.0001, now);
        g.gain.exponentialRampToValueAtTime(vol, now + 0.05);
        g.gain.setValueAtTime(vol, now + song.len * 0.6);
        g.gain.exponentialRampToValueAtTime(0.0001, now + song.len);
        out.connect(g); g.connect(ctx.destination); o.start(now); o.stop(now + song.len + 0.05);
      }
    } catch (e) { /* ignore */ }
  };
  note(); timer = setInterval(note, song.beat * 1000);
}
/** The desk radio (kept for the desks): on or off. */
export function radio(on) { music(on ? 'radio' : null); }

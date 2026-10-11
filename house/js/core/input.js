// On-screen stick plus keyboard (WASD / arrows to walk, E or Space to act, Q to turn the view).
export function createInput({ stick, knob, onAction, onTurn, onFirstInput }) {
  const touch = { x: 0, y: 0 }, keys = {};
  let pointerId = null, started = false;
  const first = () => { if (!started) { started = true; onFirstInput(); } };

  function stickMove(e) {
    const r = stick.getBoundingClientRect();
    let dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
    const max = 44, l = Math.hypot(dx, dy);
    if (l > max) { dx *= max / l; dy *= max / l; }
    knob.style.transform = `translate(${dx}px,${dy}px)`;
    touch.x = dx / max; touch.y = dy / max;
  }
  stick.addEventListener('pointerdown', e => { pointerId = e.pointerId; stick.setPointerCapture(e.pointerId); stickMove(e); first(); });
  stick.addEventListener('pointermove', e => { if (e.pointerId === pointerId) stickMove(e); });
  const end = e => { if (e.pointerId !== pointerId) return; pointerId = null; knob.style.transform = ''; touch.x = touch.y = 0; };
  stick.addEventListener('pointerup', end);
  stick.addEventListener('pointercancel', end);

  window.addEventListener('keydown', e => {
    const k = e.key.toLowerCase();
    if (e.target && e.target.tagName === 'BUTTON' && (k === ' ' || k === 'enter')) return;   // let buttons work
    keys[k] = true;
    if (k === 'e' || k === ' ') { e.preventDefault(); onAction(); }
    if (k === 'q') onTurn();
    first();
  });
  window.addEventListener('keyup', e => { keys[e.key.toLowerCase()] = false; });

  /** Movement direction: x right, y down (towards the camera), length at most 1. */
  function axis() {
    let x = touch.x, y = touch.y;
    if (keys.a || keys.arrowleft) x -= 1;
    if (keys.d || keys.arrowright) x += 1;
    if (keys.w || keys.arrowup) y -= 1;
    if (keys.s || keys.arrowdown) y += 1;
    const len = Math.hypot(x, y);
    if (len > 1) { x /= len; y /= len; }
    return { x, y, len: Math.min(len, 1) };
  }
  return { axis };
}

// Keep the page from zooming. A two-finger touch (dragging a ship with a second finger down) or a quick
// double tap could make the browser zoom the whole page, and on an iPhone there was no way back out.
// - CSS touch-action (battleships.css) stops pinch and double-tap zoom on the game; lists can still scroll.
// - Safari's own pinch gestures (gesturestart / gesturechange) are cancelled.
// - Two-finger touch moves are cancelled (dragging and the buttons use pointer events, so they still work).
// - If the page does end up zoomed anyway, it snaps back to normal once all fingers are lifted.
export function preventZoom() {
  const stop = e => e.preventDefault();
  ['gesturestart', 'gesturechange', 'gestureend'].forEach(t => document.addEventListener(t, stop, { passive: false }));
  document.addEventListener('touchmove', e => { if (e.touches && e.touches.length > 1) e.preventDefault(); }, { passive: false });

  const vv = window.visualViewport, meta = document.querySelector('meta[name="viewport"]');
  if (!vv || !meta) return;
  const normal = meta.getAttribute('content');
  const unzoom = () => {
    if (vv.scale <= 1.01) return;
    // nudging the viewport settings makes the browser drop back to 1x (Safari ignores scrollTo/zoom calls)
    meta.setAttribute('content', normal.replace(/maximum-scale=[^,]*/, '') + ', maximum-scale=1.0');
    setTimeout(() => meta.setAttribute('content', normal), 300);
    window.scrollTo(0, 0);
  };
  document.addEventListener('touchend', e => { if (!e.touches || e.touches.length === 0) setTimeout(unzoom, 60); });
  vv.addEventListener('resize', () => setTimeout(unzoom, 400));
}

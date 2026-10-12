// Trimming the bushes: carry the hedge trimmer to each shaggy bush in the garden; the trimmer clears the
// overgrown bits on the bush just in front of you. When they're all done the clippings are in a garden bag.
import { S } from '../state.js';
import { TRIM_SPOTS } from '../world/outside/garden.js';
import { buzz } from '../core/audio.js';

export { TRIM_SPOTS };

export function createTrimming({ board, player, items, world }) {
  function update() {
    if (S.carrying !== 'shears' || S.level !== 0) return;
    const job = board.find('trim'), s = job && board.step(job);
    if (!s || s.kind !== 'trim') return;
    const head = player.ahead(0.6), all = world.overgrown;
    all.forEach((g, n) => {
      const [, , r] = TRIM_SPOTS[n];
      if (!g.visible || Math.hypot(g.position.x - head.x, g.position.z - head.z) > r + 0.35) return;
      g.visible = false; buzz();
      const left = all.filter(q => q.visible).length;
      job.status = left ? `${all.length - left}/${all.length}` : '';
      if (left === 0) { items.clippingsBag.visible = true; board.advance(job, 'All trimmed! Put the trimmer back'); }
      else board.refresh();
    });
  }
  /** Start of day: the bushes are shaggy (trimming is on the list) or neat. */
  function reset(shaggy) { world.overgrown.forEach(g => { g.visible = shaggy; }); }
  return { update, reset };
}

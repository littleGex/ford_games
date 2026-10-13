// While you push the mower over the lawn, tufts in front of the deck get cut. Every tuft has to go: the
// list shows how much is cut, and near the end how many tufts are left to find.
import { S } from '../state.js';

export function createMowing({ board, world, player }) {
  let shown = -1;
  function update() {
    const job = board.find('mow'), s = job && board.step(job);
    if (!s || s.kind !== 'mow' || S.carrying !== 'mower') return;
    const deck = player.ahead(0.95);
    if (!world.lawn.cutAround(deck.x, deck.z)) return;
    const total = world.lawn.cells.length, left = total - world.lawn.cutCount;
    if (!left) { shown = -1; job.status = ''; board.advance(job, 'Lawn done! Put the mower back by the shed'); return; }
    const pct = Math.floor((total - left) / total * 100);
    const status = pct >= 90 ? `${left} ${left === 1 ? 'tuft' : 'tufts'} left` : pct + '%';
    if (status !== shown) { shown = status; job.status = status; board.refresh(); }
  }
  return { update, reset() { shown = -1; } };
}

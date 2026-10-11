// While you push the mower over the lawn, tufts in front of the deck get cut. 90% finishes the step.
import { S } from '../state.js';

export function createMowing({ board, world, player }) {
  let shown = -1;
  function update() {
    const job = board.find('mow'), s = job && board.step(job);
    if (!s || s.kind !== 'mow' || S.carrying !== 'mower') return;
    const deck = player.ahead(0.95);
    if (!world.lawn.cutAround(deck.x, deck.z)) return;
    const pct = Math.floor(world.lawn.cutCount / world.lawn.cells.length * 100);
    if (pct !== shown) { shown = pct; job.status = pct + '%'; board.refresh(); }
    if (pct >= 90) { job.status = ''; board.advance(job, 'Lawn done! Put the mower back by the shed'); }
  }
  return { update, reset() { shown = -1; } };
}

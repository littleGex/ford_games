// The loft above the attic: its ladder is pulled down from the hatch in the attic hall while a loft job is
// on today's list and not finished yet.
export function createLoft({ world, board }) {
  return {
    update() {
      const on = board.jobs.some(j => (j.id === 'loftUp' || j.id === 'loftDown') && !board.finished(j));
      if (world.loftLadder.visible !== on) world.loftLadder.visible = on;
    },
  };
}

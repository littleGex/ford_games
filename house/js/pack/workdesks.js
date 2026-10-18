// House pack: the two desks at home where Mum and Dad work, and who works at which.
//
// Like the kids' rooms (kidrooms.js): the engine (Dad's and Mum's work jobs, working from home, the urgent call)
// asks "where does this grown-up work?" and the pack answers. Dad usually works at the desk in the dressing room
// (first floor), Mum in the attic office; they can swap (the rooms, jobs and sharing card, settings.js).
//
// Each desk has its own screen (glow) and radio, and the pages its screen can show: what someone works on picks
// a page (Dad's code and emails, Mum's spreadsheets), and a desk that hasn't got that page shows its nearest.
export const WORK_DESKS = {
  dressing: { level: 1, at: [3.75, 0.5], seat: [3.74, 0.45, 0.5, -Math.PI / 2], glow: 'dadScreen', radio: 'dadNotes',
              pages: ['call', 'mail', 'doc', 'code'], name: 'the desk in the dressing room' },
  attic: { level: 2, at: [1.17, 5.22], seat: [1.17, 0.45, 5.22, -Math.PI / 2], glow: 'mumScreen', radio: 'mumNotes',
           pages: ['sheet'], name: 'the attic office' },
};
export const USUAL_DESK = { dad: 'dressing', mum: 'attic' };

let swapped = () => false;

/** settings.js tells us whether Mum and Dad have swapped desks. */
export function useDeskSwap(fn) { swapped = fn; }

/** Which desk a grown-up works at: 'dressing' or 'attic'. */
export const workDeskOf = who => {
  const usual = USUAL_DESK[who] || 'dressing';
  return swapped() ? (usual === 'dressing' ? 'attic' : 'dressing') : usual;
};

/** Who works at a desk. */
export const workerAt = desk => ['dad', 'mum'].find(k => workDeskOf(k) === desk);

/** A grown-up's desk at home, with everything about it. */
export const deskOf = who => WORK_DESKS[workDeskOf(who)];

/** The page a desk's screen shows for some work: that page if it has it, otherwise a document, otherwise its own. */
export const pageAt = (desk, page) => (desk.pages.includes(page) ? page : desk.pages.includes('doc') ? 'doc' : desk.pages[0]);

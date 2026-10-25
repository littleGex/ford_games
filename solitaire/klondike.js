// The rules of Klondike solitaire, with no page: dealing, which moves are allowed, and making them. Every move
// returns a new game rather than changing the old one, so undo (#117) is just going back to the previous game.
// The page (index.html) draws whatever game it's given.
//
// game = {
//   stock: [card], waste: [card], foundations: [[card] x4], tableau: [[card] x7],   the last card is the top one
//   moves, pass (which time through the stock this is, from 1), rules: { draw, passes },
// }
// card = { id: 'H7', suit: 'H', rank: 7, up: true }    suits S H D C, ranks 1 (Ace) to 13 (King)
//
// A place is { pile: 'stock' | 'waste' | 'foundation' | 'tableau', i, at }: i picks the foundation or column,
// at is the card's index in a column (the run from there to the top moves together).

export const SUITS = ['S', 'H', 'D', 'C'];
export const RED = new Set(['H', 'D']);
export const SYMBOL = { S: '♠', H: '♥', D: '♦', C: '♣' };
export const RANK_NAME = ['', 'A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
/**
 * The levels, all in one place so they're easy to change. draw: cards turned over from the stock at a time;
 * passes: how many times you may go through the stock (null: as often as you like); hints: the Hint button;
 * autoMove: cards that can safely go up to the foundations go by themselves; winnable: only deals that can be won
 * (needs draw 1 with no limit on passes, see solve).
 */
export const LEVELS = {
  easy: { name: 'Easy', draw: 1, passes: null, hints: true, autoMove: true, winnable: true, about: 'Draw 1 card, through the stock as often as you like, cards go up by themselves, every deal can be won' },
  medium: { name: 'Medium', draw: 1, passes: 3, hints: true, autoMove: false, winnable: false, about: 'Draw 1 card, three times through the stock' },
  hard: { name: 'Hard', draw: 3, passes: null, hints: false, autoMove: false, winnable: false, about: 'Draw 3 cards at a time, only the top one plays, no hints' },
};
export const DEFAULT_RULES = { draw: 1, passes: null };
/** The stock rules for a level. */
export const rulesOf = level => ({ draw: LEVELS[level].draw, passes: LEVELS[level].passes });

const red = card => RED.has(card.suit);
const top = pile => pile[pile.length - 1];

/** Small seeded random numbers (mulberry32), so a deal can be played again from its number (?seed=1234). */
export function seededRandom(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A new deal: 28 cards in seven columns (1 to 7, the top one face up), the other 24 in the stock. */
export function deal(seed, rules = DEFAULT_RULES, level = null) {
  const rng = seededRandom(seed);
  const deck = SUITS.flatMap(suit => Array.from({ length: 13 }, (_, i) => ({ id: `${suit}${i + 1}`, suit, rank: i + 1, up: false })));
  for (let i = deck.length - 1; i > 0; i--) {   // Fisher-Yates
    const j = Math.floor(rng() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  const tableau = Array.from({ length: 7 }, () => []);
  for (let row = 0; row < 7; row++) for (let col = row; col < 7; col++) tableau[col].push(deck.pop());
  for (const col of tableau) top(col).up = true;
  return { seed, level, stock: deck, waste: [], foundations: [[], [], [], []], tableau, moves: 0, pass: 1, rules: { ...rules } };
}

const copy = game => JSON.parse(JSON.stringify(game));

/** May this card go onto that tableau card (null: an empty column)? Down in alternating colours; Kings to gaps. */
export const fitsTableau = (card, onto) => (onto ? onto.up && red(card) !== red(onto) && onto.rank === card.rank + 1 : card.rank === 13);
/** May this card go on that foundation? Up by suit from the Ace. */
export const fitsFoundation = (card, pile) => (pile.length ? top(pile).suit === card.suit && top(pile).rank === card.rank - 1 : card.rank === 1);

/** The cards that would move if picked up from a place (empty if they can't be picked up). */
export function picked(game, from) {
  if (from.pile === 'waste') return game.waste.length ? [top(game.waste)] : [];
  if (from.pile === 'foundation') { const f = game.foundations[from.i]; return f.length ? [top(f)] : []; }
  if (from.pile !== 'tableau') return [];
  const col = game.tableau[from.i], at = from.at ?? col.length - 1;
  const run = col.slice(at);
  if (!run.length || !run.every(c => c.up)) return [];
  for (let k = 1; k < run.length; k++) if (!fitsTableau(run[k], run[k - 1])) return [];   // a proper run only
  return run;
}

/** Can the cards at `from` go to `to`? */
export function canMove(game, from, to) {
  const cards = picked(game, from);
  if (!cards.length) return false;
  if (to.pile === 'foundation') return cards.length === 1 && from.pile !== 'foundation' && fitsFoundation(cards[0], game.foundations[to.i]);
  if (to.pile === 'tableau') return !(from.pile === 'tableau' && from.i === to.i) && fitsTableau(cards[0], top(game.tableau[to.i]) || null);
  return false;
}

/** Move the cards; the card left on top of the column they came from turns face up. Returns the new game, or null. */
export function move(game, from, to) {
  if (!canMove(game, from, to)) return null;
  const g = copy(game), n = picked(game, from).length;
  const source = from.pile === 'waste' ? g.waste : from.pile === 'foundation' ? g.foundations[from.i] : g.tableau[from.i];
  const cards = source.splice(source.length - n, n);
  (to.pile === 'foundation' ? g.foundations[to.i] : g.tableau[to.i]).push(...cards);
  if (from.pile === 'tableau' && source.length) source[source.length - 1].up = true;
  g.moves++;
  return g;
}

/** Can the waste be turned back over for another time through the stock? */
export const canTurnOver = game => game.waste.length > 0 && (game.rules.passes === null || game.pass < game.rules.passes);
/** Can the stock be tapped: cards to draw, or the waste to turn back over? */
export const canDraw = game => game.stock.length > 0 || canTurnOver(game);
/** How many more times the waste can be turned over (null: no limit). */
export const turnsLeft = game => (game.rules.passes === null ? null : Math.max(0, game.rules.passes - game.pass));

/** Tap the stock: draw 1 (or 3) onto the waste, or when it's empty turn the waste back over into the stock. */
export function draw(game) {
  if (!canDraw(game)) return null;
  const g = copy(game);
  if (g.stock.length) {
    for (let k = 0; k < g.rules.draw && g.stock.length; k++) { const c = g.stock.pop(); c.up = true; g.waste.push(c); }
  } else {
    g.stock = g.waste.reverse().map(c => ({ ...c, up: false }));
    g.waste = [];
    g.pass++;
  }
  g.moves++;
  return g;
}

/**
 * Where a tapped card should go: a foundation if it can, else the best column for it. Prefers a column with cards
 * over an empty one, and never moves a King that's already at the bottom of a column into another gap (that
 * would just go back and forth). Returns the place, or null if it can't go anywhere.
 */
export function bestMove(game, from) {
  const cards = picked(game, from);
  if (!cards.length) return null;
  if (cards.length === 1 && from.pile !== 'foundation') {
    for (let i = 0; i < 4; i++) if (canMove(game, from, { pile: 'foundation', i })) return { pile: 'foundation', i };
  }
  const kingAtBottom = from.pile === 'tableau' && cards[0].rank === 13 && (from.at ?? game.tableau[from.i].length - 1) === 0;
  let gap = null;
  for (let i = 0; i < 7; i++) {
    const to = { pile: 'tableau', i };
    if (!canMove(game, from, to)) continue;
    if (game.tableau[i].length) return to;
    if (gap === null && !kingAtBottom) gap = to;
  }
  return gap;
}

/**
 * Moves that get somewhere, best first: a card up to a foundation; a run moved off a face-down card (turning it
 * over) or off the bottom of a column (emptying it, unless it's a King, which would only go to another gap); the
 * waste card onto a column. Shuffling a run between two columns that are just as good isn't counted.
 */
export function usefulMoves(game) {
  const out = [], froms = [];
  if (game.waste.length) froms.push({ pile: 'waste' });
  game.tableau.forEach((col, i) => { if (col.length) froms.push({ pile: 'tableau', i, at: col.length - 1 }); });
  for (const from of froms) {
    for (let f = 0; f < 4; f++) if (canMove(game, from, { pile: 'foundation', i: f })) { out.push({ from, to: { pile: 'foundation', i: f } }); break; }
  }
  game.tableau.forEach((col, i) => {
    const at = col.findIndex(c => c.up);
    if (at < 0 || (at === 0 && col[0].rank === 13)) return;
    const to = bestMove(game, { pile: 'tableau', i, at });
    if (to && to.pile === 'tableau') out.push({ from: { pile: 'tableau', i, at }, to });
  });
  if (game.waste.length) {
    const to = bestMove(game, { pile: 'waste' });
    if (to && to.pile === 'tableau') out.push({ from: { pile: 'waste' }, to });
  }
  return out;
}

/**
 * A hint: the best useful move ({ from, to }), or { draw: true } when the stock is worth tapping (a card in it or
 * the waste could go somewhere), or null when nothing helps: the game is stuck.
 */
export function hint(game) {
  const [best] = usefulMoves(game);
  if (best) return best;
  if (!canDraw(game)) return null;
  const tops = game.tableau.map(col => top(col) || null);
  const fits = c => game.foundations.some(f => fitsFoundation(c, f)) || tops.some(t => fitsTableau(c, t) && (t || c.rank === 13));
  return [...game.stock, ...game.waste].some(fits) ? { draw: true } : null;
}

/** No more moves: not won, and nothing (not even the stock) gets anywhere. */
export const stuck = game => !won(game) && !hint(game);

/**
 * A card that can safely go up by itself (Easy): an Ace or a 2, or a card whose two foundations of the other
 * colour are both up to one below it, so nothing still on the table could need to go on it. Returns the move.
 */
export function autoMove(game) {
  const froms = [{ pile: 'waste' }, ...game.tableau.map((_, i) => ({ pile: 'tableau', i }))];
  for (const from of froms) {
    const [c] = picked(game, from);
    if (!c) continue;
    const to = bestMove(game, from);
    if (!to || to.pile !== 'foundation') continue;
    const height = suit => (game.foundations.find(f => f.length && f[0].suit === suit) || []).length;
    const otherColour = SUITS.filter(suit => RED.has(suit) !== red(c));
    if (c.rank <= 2 || otherColour.every(suit => height(suit) >= c.rank - 1)) return { from, to };
  }
  return null;
}

/** Can the rest be played out for you: the stock and waste empty and every card on the table face up? */
export const canFinish = game => !won(game) && !game.stock.length && !game.waste.length && game.tableau.every(col => col.every(c => c.up));

/** The next card up when finishing off: the lowest card on top of a column that fits a foundation. */
export function finishStep(game) {
  let best = null;
  game.tableau.forEach((col, i) => {
    const c = col[col.length - 1];
    if (!c || (best && best.rank <= c.rank)) return;
    const f = game.foundations.findIndex(pile => fitsFoundation(c, pile));
    if (f >= 0) best = { rank: c.rank, from: { pile: 'tableau', i }, to: { pile: 'foundation', i: f } };
  });
  return best && move(game, best.from, best.to);
}

// ---------- winnable deals (Easy, #119) ----------
//
// With one card drawn at a time and no limit on times through the stock, every card in the stock and waste can be
// reached whenever it's wanted (go round until it's on top), so the solver treats them as one pool of cards that
// can be played at any time. It only makes legal moves, so a deal it wins really can be won. It searches depth
// first, never visiting a position twice, and gives up after `limit` positions.

const SUIT_NO = { S: 0, H: 1, D: 2, C: 3 };
const cardNo = c => SUIT_NO[c.suit] * 13 + c.rank - 1;   // 0-51
const suitNo = n => (n / 13) | 0, rankNo = n => (n % 13) + 1;
const redNo = n => suitNo(n) === 1 || suitNo(n) === 2;
const goesOn = (n, t) => redNo(n) !== redNo(t) && rankNo(t) === rankNo(n) + 1;

/**
 * Can this game be won drawing one card at a time? Returns { result: 'won', moves } with the winning line (each
 * move { card: 'H7', to: 'foundation' | column number }), { result: 'lost' } when no line wins, or
 * { result: 'unknown' } after `limit` positions.
 */
export function solve(game, limit = 500) {
  const fits = (s, n) => s.f[suitNo(n)] === rankNo(n) - 1;
  const safe = (s, n) => rankNo(n) <= 2 || (redNo(n) ? [0, 3] : [1, 2]).every(x => s.f[x] >= rankNo(n) - 1);
  const copyState = s => ({ cols: s.cols.map(c => ({ down: c.down.slice(), up: c.up.slice() })), f: s.f.slice(), pool: s.pool.slice(), from: s, line: [] });
  const turnOver = col => { if (!col.up.length && col.down.length) col.up.push(col.down.pop()); };
  const upFromColumn = (s, i) => { const n = s.cols[i].up.pop(); s.f[suitNo(n)]++; turnOver(s.cols[i]); s.line.push([n, 'foundation']); };
  const upFromPool = (s, k) => { const [n] = s.pool.splice(k, 1); s.f[suitNo(n)]++; s.line.push([n, 'foundation']); };
  // cards that can safely go up always do: it never hurts, and it keeps the search small
  function settle(s) {
    for (let again = true; again;) {
      again = false;
      s.cols.forEach((col, i) => {
        const t = col.up[col.up.length - 1];
        if (t !== undefined && fits(s, t) && safe(s, t)) { upFromColumn(s, i); again = true; }
      });
      for (let k = s.pool.length - 1; k >= 0; k--) if (fits(s, s.pool[k]) && safe(s, s.pool[k])) { upFromPool(s, k); again = true; }
    }
    return s;
  }
  const key = s => `${s.f}|${s.cols.map(c => `${c.down.length}:${c.up.join('.')}`).sort().join('/')}|${s.pool.slice().sort((a, b) => a - b).join('.')}`;
  // where a card or run can go: onto a column it fits, or one gap (for a King; any gap will do)
  const targets = (s, n, skip) => {
    const out = [];
    let gap = false;
    s.cols.forEach((col, j) => {
      if (j === skip) return;
      const t = col.up[col.up.length - 1];
      if (t === undefined ? !col.down.length && rankNo(n) === 13 && !gap && (gap = true) : goesOn(n, t)) out.push(j);
    });
    return out;
  };
  function children(s) {
    const out = [];
    s.cols.forEach((col, i) => {
      const t = col.up[col.up.length - 1];
      if (t !== undefined && fits(s, t)) { const c = copyState(s); upFromColumn(c, i); out.push(c); }
    });
    s.pool.forEach((n, k) => { if (fits(s, n)) { const c = copyState(s); upFromPool(c, k); out.push(c); } });
    // runs: all of a column's face-up cards (turning a card over, or emptying the column), or the top part when that
    // frees the card under it for a foundation
    s.cols.forEach((col, i) => {
      col.up.forEach((n, at) => {
        if (at === 0 ? !col.down.length && rankNo(n) === 13 : !fits(s, col.up[at - 1])) return;
        for (const j of targets(s, n, i)) {
          const c = copyState(s);
          c.cols[j].up.push(...c.cols[i].up.splice(at));
          turnOver(c.cols[i]);
          c.line.push([n, j]);
          out.push(c);
        }
      });
    });
    s.pool.forEach((n, k) => {
      for (const j of targets(s, n, -1)) {
        const c = copyState(s);
        c.pool.splice(k, 1);
        c.cols[j].up.push(n);
        c.line.push([n, j]);
        out.push(c);
      }
    });
    return out.map(settle);
  }

  const start = settle({
    cols: game.tableau.map(col => ({ down: col.filter(c => !c.up).map(cardNo), up: col.filter(c => c.up).map(cardNo) })),
    f: [0, 1, 2, 3].map(x => (game.foundations.find(p => p.length && SUIT_NO[p[0].suit] === x) || []).length),
    pool: [...game.stock, ...game.waste].map(cardNo),
    from: null, line: [],
  });
  const seen = new Set(), stack = [start];
  let positions = 0;
  while (stack.length) {
    const s = stack.pop();
    if (s.f.every(h => h === 13)) {
      const moves = [];
      for (let x = s; x; x = x.from) moves.unshift(...x.line.map(([n, to]) => ({ card: `${SUITS[suitNo(n)]}${rankNo(n)}`, to })));
      return { result: 'won', moves };
    }
    const k = key(s);
    if (seen.has(k)) continue;
    seen.add(k);
    if (++positions > limit) return { result: 'unknown' };
    stack.push(...children(s).reverse());
  }
  return { result: 'lost' };
}

/**
 * The first deal from `seed` on that the solver wins quickly (Easy's deals). A deal it can't win within the small
 * budget is skipped, so this takes a few tries at most, and a hundredth of a second or so each.
 */
export function winnableSeed(seed, budget = 500) {
  for (let tries = 0; tries < 200; tries++, seed++) if (solve(deal(seed), budget).result === 'won') return seed;
  return seed;   // never in practice: about half of all deals are won within the budget
}

/** Every card on the foundations? */
export const won = game => game.foundations.every(f => f.length === 13);

/** All 52 cards there once each (for the tests). */
export function cardCount(game) {
  const all = [...game.stock, ...game.waste, ...game.foundations.flat(), ...game.tableau.flat()];
  return { total: all.length, distinct: new Set(all.map(c => c.id)).size };
}

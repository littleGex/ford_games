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
 * autoMove: cards that can safely go up to the foundations go by themselves.
 */
export const LEVELS = {
  easy: { name: 'Easy', draw: 1, passes: null, hints: true, autoMove: true, about: 'Draw 1 card, through the stock as often as you like, cards go up by themselves' },
  medium: { name: 'Medium', draw: 1, passes: 3, hints: true, autoMove: false, about: 'Draw 1 card, three times through the stock' },
  hard: { name: 'Hard', draw: 3, passes: null, hints: false, autoMove: false, about: 'Draw 3 cards at a time, only the top one plays, no hints' },
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

/** Every card on the foundations? */
export const won = game => game.foundations.every(f => f.length === 13);

/** All 52 cards there once each (for the tests). */
export function cardCount(game) {
  const all = [...game.stock, ...game.waste, ...game.foundations.flat(), ...game.tableau.flat()];
  return { total: all.length, distinct: new Set(all.map(c => c.id)).size };
}

// The rules of Klondike solitaire, with no page: dealing, which moves are allowed, and making them. Every move
// returns a new game rather than changing the old one, so undo (#117) is just going back to the previous game.
// The page (index.html) draws whatever game it's given.
//
// game = {
//   stock: [card], waste: [card], foundations: [[card] x4], tableau: [[card] x7],   the last card is the top one
//   moves, passes (times the waste has gone back into the stock), rules: { draw, passes },
// }
// card = { id: 'H7', suit: 'H', rank: 7, up: true }    suits S H D C, ranks 1 (Ace) to 13 (King)
//
// A place is { pile: 'stock' | 'waste' | 'foundation' | 'tableau', i, at }: i picks the foundation or column,
// at is the card's index in a column (the run from there to the top moves together).

export const SUITS = ['S', 'H', 'D', 'C'];
export const RED = new Set(['H', 'D']);
export const SYMBOL = { S: '♠', H: '♥', D: '♦', C: '♣' };
export const RANK_NAME = ['', 'A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
/** How the stock works (#116 adds levels): draw 1 or 3, how many times the waste can go round again (null: always). */
export const DEFAULT_RULES = { draw: 1, passes: null };

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
export function deal(seed, rules = DEFAULT_RULES) {
  const rng = seededRandom(seed);
  const deck = SUITS.flatMap(suit => Array.from({ length: 13 }, (_, i) => ({ id: `${suit}${i + 1}`, suit, rank: i + 1, up: false })));
  for (let i = deck.length - 1; i > 0; i--) {   // Fisher-Yates
    const j = Math.floor(rng() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  const tableau = Array.from({ length: 7 }, () => []);
  for (let row = 0; row < 7; row++) for (let col = row; col < 7; col++) tableau[col].push(deck.pop());
  for (const col of tableau) top(col).up = true;
  return { seed, stock: deck, waste: [], foundations: [[], [], [], []], tableau, moves: 0, passes: 0, rules: { ...rules } };
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

/** Can the stock be tapped: cards to draw, or the waste to turn back over (if the rules allow another pass)? */
export const canDraw = game => game.stock.length > 0 || (game.waste.length > 0 && (game.rules.passes === null || game.passes < game.rules.passes));

/** Tap the stock: draw 1 (or 3) onto the waste, or when it's empty turn the waste back over into the stock. */
export function draw(game) {
  if (!canDraw(game)) return null;
  const g = copy(game);
  if (g.stock.length) {
    for (let k = 0; k < g.rules.draw && g.stock.length; k++) { const c = g.stock.pop(); c.up = true; g.waste.push(c); }
  } else {
    g.stock = g.waste.reverse().map(c => ({ ...c, up: false }));
    g.waste = [];
    g.passes++;
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

/** Every card on the foundations? */
export const won = game => game.foundations.every(f => f.length === 13);

/** All 52 cards there once each (for the tests). */
export function cardCount(game) {
  const all = [...game.stock, ...game.waste, ...game.foundations.flat(), ...game.tableau.flat()];
  return { total: all.length, distinct: new Set(all.map(c => c.id)).size };
}

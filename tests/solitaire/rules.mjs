// Klondike rules, checked without a browser:  node tests/solitaire/rules.mjs
import { deal, move, draw, canMove, bestMove, picked, won, cardCount, fitsTableau, fitsFoundation, hint, stuck, turnsLeft, rulesOf, LEVELS, autoMove, canFinish, finishStep } from '../../solitaire/klondike.js';

const fail = [];
const check = (ok, msg) => { if (!ok) fail.push(msg); };
const card = (suit, rank, up = true) => ({ id: `${suit}${rank}`, suit, rank, up });

// --- the deal
const g = deal(1234);
check(g.tableau.map(c => c.length).join() === '1,2,3,4,5,6,7', 'columns of 1 to 7 cards');
check(g.stock.length === 24 && g.waste.length === 0, '24 cards in the stock');
check(g.tableau.every(c => c[c.length - 1].up && c.slice(0, -1).every(x => !x.up)), 'only the top card of each column face up');
check(cardCount(g).total === 52 && cardCount(g).distinct === 52, 'all 52 cards, once each');
check(JSON.stringify(deal(1234)) === JSON.stringify(g) && JSON.stringify(deal(99)) !== JSON.stringify(g), 'the same number deals the same game');

// --- what goes where
check(fitsTableau(card('H', 6), card('S', 7)) && !fitsTableau(card('H', 6), card('D', 7)), 'down in alternating colours');
check(!fitsTableau(card('H', 6), card('S', 8)) && !fitsTableau(card('H', 6), card('S', 7, false)), 'one lower, onto a face-up card');
check(fitsTableau(card('C', 13), null) && !fitsTableau(card('C', 12), null), 'only a King into a gap');
check(fitsFoundation(card('D', 1), []) && !fitsFoundation(card('D', 2), []), 'a foundation starts with an Ace');
check(fitsFoundation(card('D', 2), [card('D', 1)]) && !fitsFoundation(card('H', 2), [card('D', 1)]), 'up by suit');

// --- moves on a set-up table
const table = {
  seed: 0, moves: 0, pass: 1, rules: { draw: 1, passes: null },
  stock: [card('C', 9, false)], waste: [card('S', 1)],
  foundations: [[], [], [], []],
  tableau: [
    [card('D', 4, false), card('S', 8), card('H', 7), card('C', 6)],   // a run of three under a face-down card
    [card('D', 9)],
    [card('H', 13)],
    [],
    [card('C', 2, false), card('S', 2)],
    [card('H', 3)],
    [card('S', 13)],
  ],
};
check(picked(table, { pile: 'tableau', i: 0, at: 1 }).length === 3, 'a run can be picked up');
check(picked(table, { pile: 'tableau', i: 0, at: 0 }).length === 0, 'not from a face-down card');
const runMoved = move(table, { pile: 'tableau', i: 0, at: 1 }, { pile: 'tableau', i: 1 });
check(runMoved && runMoved.tableau[1].length === 4 && runMoved.tableau[0].length === 1, 'the run of three goes onto the red 9');
check(runMoved && runMoved.tableau[0][0].up, 'the card left behind turns face up');
check(runMoved && runMoved.moves === 1 && table.moves === 0 && table.tableau[0].length === 4, 'a move makes a new game and leaves the old one');
check(move(table, { pile: 'tableau', i: 5 }, { pile: 'tableau', i: 1 }) === null, 'a red 3 onto a red 9 is refused');
check(!canMove(table, { pile: 'tableau', i: 5 }, { pile: 'tableau', i: 3 }), 'only a King into the gap');
check(canMove(table, { pile: 'tableau', i: 2 }, { pile: 'tableau', i: 3 }), 'a King into the gap');

// tap to move: the Ace goes up; a King already at the bottom of a column stays put
check(JSON.stringify(bestMove(table, { pile: 'waste' })) === '{"pile":"foundation","i":0}', 'the Ace goes to a foundation');
check(bestMove(table, { pile: 'tableau', i: 6 }) === null, 'a King at the bottom of a column doesn\'t hop into a gap');
check(JSON.stringify(bestMove(table, { pile: 'tableau', i: 0, at: 1 })) === '{"pile":"tableau","i":1}', 'a run goes to the column it fits');
const aceUp = move(table, { pile: 'waste' }, { pile: 'foundation', i: 0 });
check(JSON.stringify(bestMove(aceUp, { pile: 'tableau', i: 4 })) === '{"pile":"foundation","i":0}', 'the 2 follows its Ace');
check(!canMove(aceUp, { pile: 'tableau', i: 0, at: 1 }, { pile: 'foundation', i: 0 }), 'a run can\'t go up to a foundation');

// --- the stock: draw, then turn the waste over; Medium's three times through stop there
let s = deal(5, rulesOf('medium'), 'medium');
check(s.level === 'medium' && s.pass === 1 && turnsLeft(s) === 2, 'Medium: the first of three times through');
for (let k = 0; k < 24; k++) s = draw(s);
check(s.stock.length === 0 && s.waste.length === 24 && s.waste.every(c => c.up), 'drawing one at a time empties the stock');
s = draw(s);
check(s.stock.length === 24 && s.pass === 2 && s.stock.every(c => !c.up), 'the waste turns back over into the stock');
check(s.stock[s.stock.length - 1].id === deal(5).stock[23].id, 'in the same order as before');
for (let k = 0; k < 25; k++) s = draw(s);
check(s.pass === 3 && turnsLeft(s) === 0, 'the third time through');
for (let k = 0; k < 24; k++) s = draw(s);
check(s.stock.length === 0 && draw(s) === null, 'no fourth time through');
let e = deal(5, rulesOf('easy'));
for (let k = 0; k < 24 * 6 + 5; k++) e = draw(e);
check(e && turnsLeft(e) === null, 'Easy: as many times through as you like');
const three = draw(deal(5, rulesOf('hard')));
check(three.waste.length === 3 && three.stock.length === 21, 'Hard: draw-3 turns over three');
let h = deal(5, rulesOf('hard'));
for (let k = 0; k < 8; k++) h = draw(h);
check(h.stock.length === 0 && h.waste.length === 24 && draw(h).stock.length === 24, 'draw-3: eight taps empty the stock');
check(LEVELS.easy.hints && LEVELS.medium.hints && !LEVELS.hard.hints, 'hints on Easy and Medium, not Hard');

// --- random play never loses or doubles a card, and a game played through the foundations is won
for (let seed = 1; seed <= 40; seed++) {
  let game = deal(seed);
  for (let step = 0; step < 400; step++) {
    const froms = [{ pile: 'waste' }, ...game.tableau.flatMap((c, i) => c.map((_, at) => ({ pile: 'tableau', i, at })))];
    const options = froms.map(f => [f, bestMove(game, f)]).filter(([, to]) => to);
    const next = options.length && step % 5 ? move(game, ...options[step % options.length]) : draw(game);
    if (!next) break;
    game = next;
    const n = cardCount(game);
    if (n.total !== 52 || n.distinct !== 52) { fail.push(`seed ${seed}: ${n.total} cards (${n.distinct} different) after step ${step}`); break; }
  }
}
// --- hints and being stuck
check(JSON.stringify(hint(table)) === '{"from":{"pile":"waste"},"to":{"pile":"foundation","i":0}}', 'the hint: the Ace up first');
const runHint = hint({ ...table, waste: [] });
check(runHint && runHint.from.i === 0 && runHint.from.at === 1 && runHint.to.i === 1, 'then the run off the face-down card');
const blocked = {
  ...table, stock: [], waste: [card('C', 9)], pass: 1, rules: { draw: 1, passes: 1 },
  tableau: [[card('D', 4, false), card('S', 8)], [card('S', 9)], [], [], [], [], []],
};
check(stuck(blocked), 'nothing goes anywhere and the stock is spent: stuck');
check(!stuck({ ...blocked, rules: { draw: 1, passes: 2 }, waste: [card('H', 7), card('C', 9)] }), 'a card in the waste that fits: not stuck while it can be turned over');
check(JSON.stringify(hint({ ...blocked, rules: { draw: 1, passes: 2 }, waste: [card('H', 7), card('C', 9)] })) === '{"draw":true}', 'the hint: tap the stock');
check(!stuck(deal(1234)), 'a new deal isn\'t stuck');

// --- Easy's helpers: safe moves up, and playing out the end
check(JSON.stringify(autoMove(table)) === '{"from":{"pile":"waste"},"to":{"pile":"foundation","i":0}}', 'an Ace goes up by itself');
const threes = {
  ...table, waste: [],
  foundations: [[card('S', 1), card('S', 2)], [card('H', 1), card('H', 2)], [card('D', 1)], [card('C', 1), card('C', 2)]],
  tableau: [[card('H', 3)], [card('S', 3)], [], [], [], [], []],
};
check(autoMove(threes) && autoMove(threes).from.i === 0, 'the 3♥ goes up: both blacks are up to 2');
check(autoMove({ ...threes, tableau: [[], [card('S', 3)], [], [], [], [], []] }) === null, 'the 3♠ waits: the ♦ is only up to the Ace');
const ending = {
  ...table, stock: [], waste: [],
  foundations: [[], [], [], []],
  tableau: [
    ['S', 'H', 'S', 'H', 'S', 'H', 'S', 'H', 'S', 'H', 'S', 'H', 'S'].map((x, k) => card(x, 13 - k)),
    ['H', 'S', 'H', 'S', 'H', 'S', 'H', 'S', 'H', 'S', 'H', 'S', 'H'].map((x, k) => card(x, 13 - k)),
    ['D', 'C', 'D', 'C', 'D', 'C', 'D', 'C', 'D', 'C', 'D', 'C', 'D'].map((x, k) => card(x, 13 - k)),
    ['C', 'D', 'C', 'D', 'C', 'D', 'C', 'D', 'C', 'D', 'C', 'D', 'C'].map((x, k) => card(x, 13 - k)),
    [], [], [],
  ],
};
check(canFinish(ending) && !canFinish(table), 'finishing off: only with the stock empty and every card face up');
let fin = ending, steps = 0;
while (fin && !won(fin) && steps < 60) { fin = finishStep(fin); steps++; }
check(fin && won(fin) && steps === 52, 'finishing off plays all 52 up, one at a time');

const nearlyDone = {
  ...table, stock: [], waste: [], tableau: [[card('S', 13)], [], [], [], [], [], []],
  foundations: ['S', 'H', 'D', 'C'].map(suit => Array.from({ length: suit === 'S' ? 12 : 13 }, (_, i) => card(suit, i + 1))),
};
check(!won(nearlyDone) && won(move(nearlyDone, { pile: 'tableau', i: 0 }, { pile: 'foundation', i: 0 })), 'the last King up wins');

if (fail.length) { console.error(`${fail.length} problem(s):\n- ` + fail.join('\n- ')); process.exit(1); }
console.log('Solitaire rules: all good');

const { test, expect } = require('@playwright/test');

// Klondike with a fixed deal (?seed=1234). Its columns start: 4♠ | J♦ | 9♥ | 7♦ | 2♦ | 4♣ | 6♣ (the top cards).
const open = page => page.goto('/solitaire/?seed=1234');
const game = page => page.evaluate(() => window.solitaire.game);
const card = (page, id) => page.locator(`.card[data-id="${id}"]`);

test('the deal: 28 cards in seven columns, 7 face up, 24 in the stock', async ({ page }) => {
  await open(page);
  await expect(page).toHaveTitle(/solitaire/i);
  const g = await game(page);
  expect(g.tableau.map(c => c.length)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  expect(g.tableau.flat()).toHaveLength(28);
  expect(g.stock).toHaveLength(24);
  expect(g.tableau.flat().filter(c => c.up)).toHaveLength(7);
  await expect(page.locator('.card:not(.down)')).toHaveCount(7);
  await expect(page.locator('#dealNo')).toHaveText('Deal #1234');
  await expect(page.locator('#homeBtn')).toHaveAttribute('href', '../');
});

test('tapping a card sends it where it fits, and the card under it turns over', async ({ page }) => {
  await open(page);
  await card(page, 'C6').click();   // the 6♣ goes onto the red 7♦
  const g = await game(page);
  expect(g.tableau[3].map(c => c.id).slice(-2)).toEqual(['D7', 'C6']);
  expect(g.tableau[6]).toHaveLength(6);
  expect(g.tableau[6][5].up).toBe(true);
  await expect(page.locator('#moves')).toHaveText('1');
});

test('a card with nowhere to go stays put', async ({ page }) => {
  await open(page);
  await card(page, 'D2').click();   // the 2♦: no Ace up yet, no black 3 showing
  const g = await game(page);
  expect(g.tableau[4].map(c => c.id).pop()).toBe('D2');
  expect(g.moves).toBe(0);
  await expect(card(page, 'D2')).toHaveClass(/shake/);
});

test('dragging: an illegal drop goes back, a legal one stays', async ({ page }) => {
  await open(page);
  const drag = async (id, ontoId) => {
    const a = await card(page, id).boundingBox(), b = await card(page, ontoId).boundingBox();
    await page.mouse.move(a.x + a.width / 2, a.y + 10);
    await page.mouse.down();
    await page.mouse.move(a.x + a.width / 2 + 20, a.y + 30, { steps: 3 });
    await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2, { steps: 5 });
    await page.mouse.up();
  };
  await drag('S4', 'H9');   // a black 4 onto a red 9: no
  let g = await game(page);
  expect(g.tableau[0].map(c => c.id)).toEqual(['S4']);
  expect(g.moves).toBe(0);
  await drag('C6', 'D7');   // a black 6 onto a red 7: yes
  g = await game(page);
  expect(g.tableau[3].map(c => c.id).pop()).toBe('C6');
  expect(g.moves).toBe(1);
});

test('tapping the stock deals to the waste', async ({ page }) => {
  await open(page);
  await page.locator('.slot.stock').click({ force: true });   // the stock's cards sit on its slot
  const g = await game(page);
  expect(g.stock).toHaveLength(23);
  expect(g.waste).toHaveLength(1);
  expect(g.waste[0].up).toBe(true);
});

test('the last card up wins, with moves and time', async ({ page }) => {
  await open(page);
  await page.evaluate(() => {
    const c = (suit, rank) => ({ id: `${suit}${rank}`, suit, rank, up: true });
    window.solitaire.load({
      seed: 1234, level: 'easy', moves: 120, pass: 1, rules: { draw: 1, passes: null }, stock: [], waste: [],
      tableau: [[c('S', 13)], [], [], [], [], [], []],
      foundations: ['S', 'H', 'D', 'C'].map(s => Array.from({ length: s === 'S' ? 12 : 13 }, (_, i) => c(s, i + 1))),
    });
  });
  await card(page, 'S13').click();
  await expect(page.locator('#win')).toBeVisible();
  await expect(page.locator('#winText')).toHaveText(/^121 moves in \d+:\d\d$/);
  await page.click('#againBtn');
  await expect(page.locator('#win')).toBeHidden();
  expect((await game(page)).tableau.flat()).toHaveLength(28);
});

test('New game asks once more in the middle of a game', async ({ page }) => {
  await open(page);
  await card(page, 'C6').click();
  await page.click('#newBtn');
  await expect(page.locator('#newBtn')).toHaveText('Sure? New game');
  expect((await game(page)).moves).toBe(1);
  await page.click('#newBtn');
  expect((await game(page)).moves).toBe(0);
});

test('after one visit it plays offline', async ({ page, context }) => {
  await open(page);
  // wait for the service worker to have the files cached and to look after this page
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);
  await context.setOffline(true);
  await page.reload();
  await expect(page.locator('.card:not(.down)')).toHaveCount(7);
  await card(page, 'C6').click();
  expect((await game(page)).moves).toBe(1);
  await context.setOffline(false);
});

// ---------- levels (#116)

const tapStock = page => page.locator('.slot.stock').click({ force: true });

test('the first visit asks for a level, and the level is remembered', async ({ page }) => {
  await page.goto('/solitaire/');
  await expect(page.locator('#levels')).toBeVisible();
  await page.click('.level[data-level="medium"]');
  await expect(page.locator('#levels')).toBeHidden();
  await expect(page.locator('#levelBtn')).toHaveText('Medium');
  expect((await game(page)).rules).toEqual({ draw: 1, passes: 3 });
  await page.reload();
  await expect(page.locator('#levels')).toBeHidden();
  await expect(page.locator('#levelBtn')).toHaveText('Medium');
  expect((await game(page)).level).toBe('medium');
});

test('Easy draws one card, Hard three fanned, and only the top one plays', async ({ page }) => {
  await open(page);
  await tapStock(page);
  expect((await game(page)).waste).toHaveLength(1);

  await page.goto('/solitaire/?seed=1234&level=hard');
  await tapStock(page);
  const g = await game(page);
  expect(g.waste).toHaveLength(3);
  expect(g.stock).toHaveLength(21);
  const lefts = await Promise.all(g.waste.map(c => card(page, c.id).evaluate(el => parseFloat(el.style.left))));
  expect(lefts[0]).toBeLessThan(lefts[1]);
  expect(lefts[1]).toBeLessThan(lefts[2]);
  await card(page, g.waste[0].id).click({ force: true });   // under the top card: nothing happens
  expect((await game(page)).moves).toBe(1);
});

test('Medium goes through the stock three times, then no more', async ({ page }) => {
  await page.goto('/solitaire/?seed=1234&level=medium');
  await expect(page.locator('.turns')).toHaveText('↻ 2');
  for (let k = 0; k < 24 * 3 + 2; k++) await tapStock(page);
  let g = await game(page);
  expect(g.pass).toBe(3);
  expect(g.stock).toHaveLength(0);
  await expect(page.locator('.turns')).toHaveText('↻ 0');
  await expect(page.locator('.slot.stock')).toHaveText('✕');
  await tapStock(page);
  g = await game(page);
  expect(g.stock).toHaveLength(0);
  expect(g.waste).toHaveLength(24);
});

test('hints: shown on Easy and Medium, not on Hard', async ({ page }) => {
  await open(page);
  await page.click('#hintBtn');
  await expect(card(page, 'C6')).toHaveClass(/hint/);   // the 6♣ onto the 7♦
  await expect(card(page, 'D7')).toHaveClass(/hint/);
  await page.goto('/solitaire/?seed=1234&level=medium');
  await expect(page.locator('#hintBtn')).toBeVisible();
  await page.goto('/solitaire/?seed=1234&level=hard');
  await expect(page.locator('#hintBtn')).toBeHidden();
});

test('another level in the middle of a game asks first, then starts a new one', async ({ page }) => {
  await open(page);
  await card(page, 'C6').click();
  await page.click('#levelBtn');
  await expect(page.locator('#levelsText')).toHaveText('Another level starts a new game');
  await page.click('.level[data-level="hard"]');
  await expect(page.locator('.level[data-level="hard"] b')).toHaveText('Sure? New Hard game');
  expect((await game(page)).moves).toBe(1);
  await page.click('.level[data-level="hard"]');
  await expect(page.locator('#levels')).toBeHidden();
  const g = await game(page);
  expect(g.moves).toBe(0);
  expect(g.rules.draw).toBe(3);
  await expect(page.locator('#levelBtn')).toHaveText('Hard');
});

test('no more moves: say so, with Undo and New game', async ({ page }) => {
  await open(page);
  await page.evaluate(() => {
    const c = (suit, rank) => ({ id: `${suit}${rank}`, suit, rank, up: true });
    window.solitaire.load({
      seed: 1234, level: 'medium', moves: 40, pass: 3, rules: { draw: 1, passes: 3 }, stock: [], waste: [],
      foundations: [[], [], [], []],
      tableau: [[c('S', 8)], [c('H', 9)], [], [], [], [], []],
    });
  });
  await expect(page.locator('#stuck')).toBeHidden();
  await card(page, 'S8').click();   // onto the 9♥: and then nothing else can go anywhere
  await expect(page.locator('#stuck')).toBeVisible();
  await page.click('#stuckUndoBtn');
  await expect(page.locator('#stuck')).toBeHidden();
  expect((await game(page)).tableau[0].map(c => c.id)).toEqual(['S8']);
  await card(page, 'S8').click();
  await page.click('#stuckNewBtn');
  await expect(page.locator('#stuck')).toBeHidden();
  expect((await game(page)).tableau.flat()).toHaveLength(28);
});

// ---------- undo, helpers, stats and the saved game (#117)

const load = (page, g) => page.evaluate(g => {
  const c = ([suit, rank, up = true]) => ({ id: `${suit}${rank}`, suit, rank, up });
  const cards = list => list.map(c);
  window.solitaire.load({
    seed: 1234, moves: 10, pass: 1, ...g,
    stock: cards(g.stock), waste: cards(g.waste), foundations: g.foundations.map(cards), tableau: g.tableau.map(cards),
  });
}, g);

test('Undo takes back a move, and a draw, exactly', async ({ page }) => {
  await open(page);
  await expect(page.locator('#undoBtn')).toBeDisabled();
  const before = await game(page);
  await card(page, 'C6').click();
  const afterMove = await game(page);
  await tapStock(page);
  await page.click('#undoBtn');
  expect(await game(page)).toEqual(afterMove);
  await page.keyboard.press('Control+z');
  expect(await game(page)).toEqual(before);
  await expect(page.locator('#undoBtn')).toBeDisabled();
  await expect(card(page, 'C6')).toHaveCSS('top', await card(page, 'C6').evaluate(el => el.style.top));
});

const upAndAway = level => ({
  level, rules: level === 'easy' ? { draw: 1, passes: null } : { draw: 1, passes: 3 },
  stock: [['C', 9, false]], waste: [], foundations: [[], [], [], []],
  tableau: [[['H', 2, false], ['S', 7]], [['D', 8]], [['H', 1]], [['D', 10]], [], [], []],   // the 10♦ will take the 9♣
});

test('Easy: safe cards go up by themselves, and one Undo takes it all back', async ({ page }) => {
  await open(page);
  await load(page, upAndAway('easy'));
  await card(page, 'S7').click();   // onto the 8♦, which turns the 2♥ over: the A♥ and 2♥ go up
  await expect.poll(async () => (await game(page)).foundations.flat().map(c => c.id)).toEqual(['H1', 'H2']);
  expect((await game(page)).moves).toBe(13);
  await page.click('#undoBtn');
  const g = await game(page);
  expect(g.foundations.flat()).toHaveLength(0);
  expect(g.tableau[0].map(c => c.id)).toEqual(['H2', 'S7']);
  expect(g.tableau[2].map(c => c.id)).toEqual(['H1']);
});

test('Medium: cards stay where they are', async ({ page }) => {
  await open(page);
  await load(page, upAndAway('medium'));
  await card(page, 'S7').click();
  await page.waitForTimeout(600);
  expect((await game(page)).foundations.flat()).toHaveLength(0);
});

test('Finish plays out the end, and the win counts in the stats', async ({ page }) => {
  await open(page);
  const run = (suits, top) => Array.from({ length: top }, (_, k) => [suits[k % 2], 13 - k]);
  await load(page, {
    level: 'medium', rules: { draw: 1, passes: 3 }, moves: 90, stock: [], waste: [],
    foundations: [[['S', 1]], [['H', 1]], [], []],
    tableau: [run(['S', 'H'], 12), run(['H', 'S'], 12), run(['D', 'C'], 13), run(['C', 'D'], 13), [], [], []],
  });
  await expect(page.locator('#finishBtn')).toBeVisible();
  await page.click('#finishBtn');
  await expect(page.locator('#win')).toBeVisible({ timeout: 15000 });
  await expect(page.locator('#winText')).toHaveText(/^140 moves in /);
  await page.click('#againBtn');
  await page.click('#levelBtn');
  await expect(page.locator('.level[data-level="medium"] .stat')).toHaveText(/^Won 1 of 1 · best \d+:\d\d · 140 moves$/);
  await expect(page.locator('.level[data-level="easy"] .stat')).toHaveText('Not played yet');
});

test('a reload carries on with the same game', async ({ page }) => {
  await open(page);
  await card(page, 'C6').click();
  await tapStock(page);
  const g = await game(page);
  await page.reload();
  expect(await game(page)).toEqual(g);
  await expect(page.locator('#moves')).toHaveText('2');
  await expect(page.locator('#undoBtn')).toBeEnabled();
  await page.click('#undoBtn');
  expect((await game(page)).waste).toHaveLength(0);
  // a new game (once sure) replaces it, and a different deal link doesn't resume it
  await page.click('#newBtn');
  await page.click('#newBtn');
  await page.goto('/solitaire/?seed=99');
  expect((await game(page)).seed).toBe(99);
});

test('the clock stops while the page is hidden', async ({ page }) => {
  await open(page);
  await card(page, 'C6').click();
  const hide = hidden => page.evaluate(h => {
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => h });
    document.dispatchEvent(new Event('visibilitychange'));
  }, hidden);
  await hide(true);
  const t = await page.locator('#time').textContent();
  await page.waitForTimeout(2200);
  await expect(page.locator('#time')).toHaveText(t);
  await hide(false);
  await expect(page.locator('#time')).not.toHaveText(t, { timeout: 3000 });
});

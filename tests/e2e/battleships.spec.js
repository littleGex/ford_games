const { test, expect } = require('@playwright/test');

// Headless Chromium draws WebGL in software, a couple of frames a second, and each frame blocks the page. As in
// the Ford House tests, the game stops drawing (the frame loop still runs, so the camera, shells and sinking still
// move) and the animations run eight times faster (?speed=8).
async function open(page, query = '') {
  await page.addInitScript(() => {
    let game;
    Object.defineProperty(window, 'battleships', {
      configurable: true,
      get: () => game,
      set: value => { game = value; game.world.stage.renderer.render = () => {}; },
    });
  });
  await page.goto(`/battleships/?speed=8&seed=7${query}`);
  await expect(page.locator('#home')).toBeVisible();
}
const mode = page => page.evaluate(() => window.battleships.mode);
const state = page => page.evaluate(() => window.battleships.state);
const ready = page => expect.poll(() => page.evaluate(() => window.battleships.mode === 'aiming' && !window.battleships.busy), { timeout: 15000 }).toBe(true);

/** Tap a square of a board on the screen, as a finger would. */
async function tap(page, side, x, y) {
  const p = await page.evaluate(([s, x, y]) => window.battleships.world.screenOf(s, x, y), [side, x, y]);
  await page.mouse.click(p.x, p.y);
}
async function fireAt(page, x, y) {
  await ready(page);
  await tap(page, 'target', x, y);
  await expect(page.locator('#fireBtn')).toBeEnabled();
  await page.click('#fireBtn');
}

test('the menu shows over the sea', async ({ page }) => {
  await open(page);
  await expect(page).toHaveTitle(/battleships/i);
  await expect(page.getByRole('button', { name: 'Play the computer' })).toBeVisible();
  await expect(page.locator('#resumeBtn')).toBeHidden();
});

test('against the computer: place, fire, and the computer fires back', async ({ page }) => {
  await open(page);
  await page.click('#playCpu');
  expect(await mode(page)).toBe('placing');
  await page.click('#readyBtn');
  await fireAt(page, 0, 0);
  await expect.poll(async () => (await state(page)).shots[1].length, { timeout: 15000 }).toBe(1);
  await ready(page);
  const s = await state(page);
  expect(s.shots[0]).toHaveLength(1);
  expect(s.shots[0][0]).toMatchObject({ x: 0, y: 0 });
  expect(s.turn).toBe(0);
});

test('tapping the same square twice fires, and a square can\'t be fired at again', async ({ page }) => {
  await open(page);
  await page.click('#playCpu');
  await page.click('#readyBtn');
  await ready(page);
  await tap(page, 'target', 4, 5);
  await expect(page.locator('#fireBtn')).toHaveText('Fire at E6!');
  await tap(page, 'target', 4, 5);
  await expect.poll(async () => (await state(page)).shots[0].length).toBe(1);
  await ready(page);
  await tap(page, 'target', 4, 5);
  await expect(page.locator('#toast')).toHaveText('Already fired at E6');
  await expect(page.locator('#fireBtn')).toBeDisabled();
});

test('placing: tapping a ship turns it, and the fleet stays allowed', async ({ page }) => {
  await open(page);
  await page.click('#playCpu');
  // put the fleet somewhere known: down the left, every ship across
  await page.evaluate(() => window.battleships.test.setDraft([
    { id: 'carrier', x: 0, y: 0, dir: 'h' }, { id: 'battleship', x: 0, y: 2, dir: 'h' }, { id: 'cruiser', x: 0, y: 4, dir: 'h' },
    { id: 'submarine', x: 0, y: 6, dir: 'h' }, { id: 'destroyer', x: 0, y: 8, dir: 'h' },
  ]));
  await tap(page, 'home', 1, 8);   // the destroyer
  const draft = await page.evaluate(() => window.battleships.test.draft());
  expect(draft.find(s => s.id === 'destroyer')).toMatchObject({ dir: 'v', x: 0, y: 8 });
  await page.click('#readyBtn');
  expect((await state(page)).players[0].fleet.find(s => s.id === 'destroyer').dir).toBe('v');
});

test('placing: dragging a ship moves it, but not next to another', async ({ page }) => {
  await open(page);
  await page.click('#playCpu');
  await page.evaluate(() => window.battleships.test.setDraft([
    { id: 'carrier', x: 0, y: 0, dir: 'h' }, { id: 'battleship', x: 0, y: 2, dir: 'h' }, { id: 'cruiser', x: 0, y: 4, dir: 'h' },
    { id: 'submarine', x: 0, y: 6, dir: 'h' }, { id: 'destroyer', x: 0, y: 8, dir: 'h' },
  ]));
  const drag = async (from, to) => {
    const a = await page.evaluate(([x, y]) => window.battleships.world.screenOf('home', x, y), from);
    const b = await page.evaluate(([x, y]) => window.battleships.world.screenOf('home', x, y), to);
    await page.mouse.move(a.x, a.y);
    await page.mouse.down();
    await page.mouse.move((a.x + b.x) / 2, (a.y + b.y) / 2, { steps: 4 });
    await page.mouse.move(b.x, b.y, { steps: 4 });
    await page.mouse.up();
  };
  const destroyer = async () => (await page.evaluate(() => window.battleships.test.draft())).find(s => s.id === 'destroyer');
  await drag([0, 8], [7, 9]);
  expect(await destroyer()).toMatchObject({ x: 7, y: 9 });
  await drag([7, 9], [7, 7]);   // touching the submarine's row? no: the submarine ends at C7, so this is fine
  expect(await destroyer()).toMatchObject({ x: 7, y: 7 });
  await drag([7, 7], [2, 7]);   // right under the submarine: not allowed, it goes back
  expect(await destroyer()).toMatchObject({ x: 7, y: 7 });
  await expect(page.locator('#toast')).toHaveText('Ships can\'t touch');
});

test('two players on one device: the hand-off screen hides each fleet', async ({ page }) => {
  await open(page);
  await page.fill('#name1', 'P');
  await page.fill('#name2', 'Dude');
  await page.click('#playLocal');
  expect(await mode(page)).toBe('placing');
  await expect(page.locator('#statusLabel')).toHaveText('P');
  await page.click('#readyBtn');

  await expect(page.locator('#handoff')).toBeVisible();
  await expect(page.locator('#handoffTitle')).toHaveText('Dude, place your fleet');
  await page.click('#handoffBtn');
  await expect(page.locator('#statusLabel')).toHaveText('Dude');
  await page.click('#readyBtn');

  await expect(page.locator('#handoffTitle')).toHaveText('P\'s turn');
  await page.click('#handoffBtn');
  await fireAt(page, 9, 9);
  await expect(page.locator('#handoff')).toBeVisible({ timeout: 15000 });
  await expect(page.locator('#handoffTitle')).toHaveText('Dude\'s turn');
  await expect(page.locator('#handoffText')).toHaveText(/^P fired at J10 and (missed|hit your \w+)/);
  const s = await state(page);
  expect(s.turn).toBe(1);
  expect(s.players.map(p => p.name)).toEqual(['P', 'Dude']);
});

test('a game is saved: after a reload it carries on', async ({ page }) => {
  await open(page);
  await page.click('#playCpu');
  await page.click('#readyBtn');
  await fireAt(page, 2, 2);
  await ready(page);
  await page.reload();
  await expect(page.locator('#resumeBtn')).toBeVisible();
  await expect(page.locator('#resumeWhat')).toHaveText(/Against the computer \(Normal\), 2 shots fired/);
  await page.click('#resumeBtn');
  await ready(page);
  expect((await state(page)).shots[0][0]).toMatchObject({ x: 2, y: 2 });
});

test('sinking the last ship wins, and the win is counted', async ({ page }) => {
  await open(page);
  await page.click('#playCpu');
  await page.click('#readyBtn');
  await ready(page);
  // every enemy square but the last one has been hit already
  const last = await page.evaluate(() => window.battleships.test.nearlyWon());
  await fireAt(page, ...last);
  await expect(page.locator('#over')).toBeVisible({ timeout: 15000 });
  await expect(page.locator('#overTitle')).toHaveText('You won! 🎉');
  await expect(page.locator('#overText')).toHaveText(/The whole fleet sunk in \d+ shots/);
  await page.click('#overMenuBtn');
  await expect(page.locator('#stats')).toHaveText('Your wins: Normal 1 of 1');
  await expect(page.locator('#resumeBtn')).toBeHidden();
});

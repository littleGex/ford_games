const { test, expect } = require('@playwright/test');

test('uno page loads', async ({ page }) => {
  await page.goto('/uno/');
  await expect(page).toHaveTitle(/uno/i);
});

test('starting a 2-player game deals 7 cards to each player', async ({ page }) => {
  await page.goto('/uno/');
  const state = await page.evaluate(() => window.__testGetState());
  expect(state.players).toHaveLength(2);
  expect(state.players[0].hand).toHaveLength(7);
  expect(state.players[1].hand).toHaveLength(7);
});

test('the hand-off overlay shows before a hand is revealed, and hides the hand behind it', async ({ page }) => {
  await page.goto('/uno/');
  await expect(page.locator('#overlay')).toHaveClass(/visible/);
  await expect(page.locator('#overlayTitle')).toHaveText(/player 1/i);
  // the hand area exists in the DOM but the overlay covers it — no cards rendered yet
  await expect(page.locator('#hand .card')).toHaveCount(0);
});

test('dismissing the hand-off reveals that player\'s 7 cards', async ({ page }) => {
  await page.goto('/uno/');
  await page.click('#overlayBtn');

  await expect(page.locator('#overlay')).not.toHaveClass(/visible/);
  await expect(page.locator('#hand .card')).toHaveCount(7);
});

test('playing a valid card moves it to the discard pile and returns to the hand-off screen', async ({ page }) => {
  await page.goto('/uno/');

  await page.evaluate(() => {
    const state = window.__testGetState();
    state.topDiscard = { color: 'red', type: 'number', value: 5 };
    state.currentColor = 'red';
    state.players[0].hand = [
      { color: 'red', type: 'number', value: 3 },
      { color: 'green', type: 'number', value: 7 }
    ];
    window.__testSetState(state);
  });

  await page.locator('#hand .card').first().click(); // the red 3 — matches color

  await expect(page.locator('#overlay')).toHaveClass(/visible/);
  const state = await page.evaluate(() => window.__testGetState());
  expect(state.players[0].hand).toHaveLength(1);
  expect(state.topDiscard.value).toBe(3);
});

test('an unplayable card is shown disabled and does nothing when clicked', async ({ page }) => {
  await page.goto('/uno/');
  await page.evaluate(() => {
    const state = window.__testGetState();
    state.topDiscard = { color: 'red', type: 'number', value: 5 };
    state.currentColor = 'red';
    state.players[0].hand = [{ color: 'green', type: 'number', value: 3 }];
    window.__testSetState(state);
  });

  const card = page.locator('#hand .card').first();
  await expect(card).toHaveClass(/disabled/);
  await card.click();

  // still player 0's turn, card still in hand — nothing happened
  const state = await page.evaluate(() => window.__testGetState());
  expect(state.players[0].hand).toHaveLength(1);
  expect(state.currentPlayerIndex).toBe(0);
});

test('draw2 forces the next player to draw two cards and skips them', async ({ page }) => {
  await page.goto('/uno/');
  await page.click('input[name="playerCount"][value="3"]');

  const beforeCount = await page.evaluate(() => window.__testGetState().players[1].hand.length);

  await page.evaluate((before) => {
    const state = window.__testGetState();
    state.topDiscard = { color: 'red', type: 'number', value: 5 };
    state.currentColor = 'red';
    state.players[0].hand = [
      { color: 'red', type: 'draw2' },
      { color: 'green', type: 'number', value: 7 }
    ];
    window.__testSetState(state);
    window.__testPlayCard(0, 'red');
  }, beforeCount);

  const state = await page.evaluate(() => window.__testGetState());
  expect(state.players[1].hand.length).toBe(beforeCount + 2);
  expect(state.currentPlayerIndex).toBe(2); // player 1 was skipped
});

test('a wild4 lets the player choose a color and forces the next player to draw four', async ({ page }) => {
  await page.goto('/uno/');
  await page.click('input[name="playerCount"][value="3"]');

  const beforeCount = await page.evaluate(() => window.__testGetState().players[1].hand.length);

  await page.evaluate((before) => {
    const state = window.__testGetState();
    state.topDiscard = { color: 'red', type: 'number', value: 5 };
    state.currentColor = 'red';
    state.players[0].hand = [
      { color: 'black', type: 'wild4' },
      { color: 'green', type: 'number', value: 7 }
    ];
    window.__testSetState(state);
    window.__testPlayCard(0, 'blue');
  }, beforeCount);

  const state = await page.evaluate(() => window.__testGetState());
  expect(state.players[1].hand.length).toBe(beforeCount + 4);
  expect(state.currentColor).toBe('blue');
  expect(state.currentPlayerIndex).toBe(2);
});

test('in 2-player, a skip returns the turn to the same player without showing the hand-off screen', async ({ page }) => {
  await page.goto('/uno/');
  await page.click('#overlayBtn'); // dismiss the initial hand-off

  await page.evaluate(() => {
    const state = window.__testGetState();
    state.topDiscard = { color: 'red', type: 'number', value: 5 };
    state.currentColor = 'red';
    state.players[0].hand = [
      { color: 'red', type: 'skip' },
      { color: 'green', type: 'number', value: 7 }
    ];
    window.__testSetState(state);
  });

  await page.locator('#hand .card').first().click(); // play the skip

  // still player 0's turn, hand-off overlay should NOT reappear
  await expect(page.locator('#overlay')).not.toHaveClass(/visible/);
  const state = await page.evaluate(() => window.__testGetState());
  expect(state.currentPlayerIndex).toBe(0);
});

test('emptying your hand wins the game', async ({ page }) => {
  await page.goto('/uno/');

  await page.evaluate(() => {
    const state = window.__testGetState();
    state.topDiscard = { color: 'red', type: 'number', value: 5 };
    state.currentColor = 'red';
    state.players[0].hand = [{ color: 'red', type: 'number', value: 3 }]; // last card
    window.__testSetState(state);
    window.__testPlayCard(0, 'red');
  });

  await expect(page.locator('#status')).toHaveText(/player 1 wins/i);
});

test('drawing from the deck when no card is playable adds one card to the hand', async ({ page }) => {
  await page.goto('/uno/');
  await page.evaluate(() => {
    const state = window.__testGetState();
    state.topDiscard = { color: 'red', type: 'number', value: 5 };
    state.currentColor = 'red';
    state.players[0].hand = [
      { color: 'blue', type: 'number', value: 2 },
      { color: 'green', type: 'number', value: 7 }
    ];
    window.__testSetState(state);
  });

  const before = (await page.evaluate(() => window.__testGetState())).players[0].hand.length;
  await page.click('#drawPile');
  const after = (await page.evaluate(() => window.__testGetState())).players[0].hand.length;

  expect(after).toBe(before + 1);
  await expect(page.locator('#endTurnBtn')).toBeVisible();
});

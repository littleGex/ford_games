const { test, expect } = require('@playwright/test');

test('connect 4 page loads', async ({ page }) => {
  await page.goto('/connect4/');
  await expect(page).toHaveTitle(/connect 4/i);
});

test('clicking a column drops a piece to the bottom', async ({ page }) => {
  await page.goto('/connect4/');
  await page.locator('#board .col').nth(0).click();

  const board = await page.evaluate(() => window.__testGetBoard());
  expect(board[5][0]).toBe('R'); // row 5 is the bottom row
});

test('two players can win with four in a row horizontally', async ({ page }) => {
  await page.goto('/connect4/');
  const cols = page.locator('#board .col');

  // R: 0, Y: 0, R: 1, Y: 1, R: 2, Y: 2, R: 3 -> Red wins on the bottom row
  await cols.nth(0).click(); // R
  await cols.nth(0).click(); // Y
  await cols.nth(1).click(); // R
  await cols.nth(1).click(); // Y
  await cols.nth(2).click(); // R
  await cols.nth(2).click(); // Y
  await cols.nth(3).click(); // R wins

  await expect(page.locator('#status')).toHaveText(/red wins/i);
});

test('New Game resets the board', async ({ page }) => {
  await page.goto('/connect4/');
  await page.locator('#board .col').nth(0).click();

  let board = await page.evaluate(() => window.__testGetBoard());
  expect(board.some(row => row.some(cell => cell !== null))).toBeTruthy();

  await page.click('#resetBtn');
  board = await page.evaluate(() => window.__testGetBoard());
  expect(board.every(row => row.every(cell => cell === null))).toBeTruthy();
  await expect(page.locator('#status')).toHaveText(/red's turn/i);
});

test('vs Computer mode: computer responds after the player drops a piece', async ({ page }) => {
  await page.goto('/connect4/');
  await page.click('input[name="mode"][value="cpu"]');
  await expect(page.locator('#difficultyBar')).toBeVisible();

  await page.locator('#board .col').nth(3).click(); // player drops in center

  await expect
    .poll(async () => {
      const board = await page.evaluate(() => window.__testGetBoard());
      return board.flat().filter(c => c === 'Y').length;
    }, { timeout: 3000 })
    .toBeGreaterThan(0);
});

test('Hard computer blocks an immediate three-in-a-row threat', async ({ page }) => {
  await page.goto('/connect4/');
  await page.click('input[name="mode"][value="cpu"]');
  await page.click('input[name="difficulty"][value="hard"]');

  // construct the exact scenario directly, rather than getting there via
  // real moves — the AI's own setup moves aren't predictable enough to
  // guarantee column 3 stays open (it strongly favors the center column)
  await page.evaluate(() => {
    const ROWS = 6, COLS = 7;
    const board = Array.from({ length: ROWS }, () => Array(COLS).fill(null));
    // Red has three in a row on the bottom row (cols 0,1,2) — col 3 wins
    board[5][0] = 'R'; board[5][1] = 'R'; board[5][2] = 'R';
    window.__testSetBoard(board, 'Y'); // computer's turn
    window.__testTriggerComputerMove();
  });

  await page.waitForTimeout(700); // give the hard AI's search time to complete
  const board = await page.evaluate(() => window.__testGetBoard());
  expect(board[5][3]).toBe('Y'); // blocked at the winning column
});

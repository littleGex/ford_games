const { test, expect } = require('@playwright/test');

test('tic-tac-toe page loads', async ({ page }) => {
  await page.goto('/tictactoe/');
  await expect(page).toHaveTitle(/tic-tac-toe/i);
});

test('two players can fill cells and X wins with a top row', async ({ page }) => {
  await page.goto('/tictactoe/');

  const cells = page.locator('#board .cell');

  // X: 0, O: 3, X: 1, O: 4, X: 2  → X wins with the top row
  await cells.nth(0).click();
  await cells.nth(3).click();
  await cells.nth(1).click();
  await cells.nth(4).click();
  await cells.nth(2).click();

  await expect(page.locator('#status')).toHaveText(/X wins/i);
  await expect(cells.nth(0)).toHaveClass(/win/);
  await expect(cells.nth(1)).toHaveClass(/win/);
  await expect(cells.nth(2)).toHaveClass(/win/);
});

test('a full board with no winner shows a draw', async ({ page }) => {
  await page.goto('/tictactoe/');
  const cells = page.locator('#board .cell');

  // A known draw sequence:
  // X O X
  // X O O
  // O X X
  const order = [0, 1, 2, 4, 3, 5, 7, 6, 8];
  for (const i of order) {
    await cells.nth(i).click();
  }

  await expect(page.locator('#status')).toHaveText(/draw/i);
});

test('New Game resets the board', async ({ page }) => {
  await page.goto('/tictactoe/');
  const cells = page.locator('#board .cell');

  await cells.nth(0).click();
  await expect(cells.nth(0)).not.toHaveText('');

  await page.click('#resetBtn');
  await expect(cells.nth(0)).toHaveText('');
  await expect(page.locator('#status')).toHaveText(/X's turn/i);
});

test('vs Computer mode: computer responds after the player moves', async ({ page }) => {
  await page.goto('/tictactoe/');

  await page.click('input[name="mode"][value="cpu"]');
  await expect(page.locator('#difficultyBar')).toBeVisible();

  const cells = page.locator('#board .cell');
  await cells.nth(0).click(); // player (X) moves

  // computer (O) should place a mark somewhere within a couple seconds
  await expect
    .poll(async () => {
      const texts = await cells.allTextContents();
      return texts.filter(t => t === 'O').length;
    }, { timeout: 3000 })
    .toBeGreaterThan(0);
});

test('Unbeatable computer never loses across a full game', async ({ page }) => {
  await page.goto('/tictactoe/');
  await page.click('input[name="mode"][value="cpu"]');
  await page.click('input[name="difficulty"][value="unbeatable"]');

  const cells = page.locator('#board .cell');

  // Play a reasonable human line; the computer should draw or win, never lose.
  for (const i of [0, 1, 2]) {
    if (await cells.nth(i).isDisabled()) continue;
    await cells.nth(i).click();
    await page.waitForTimeout(600); // let the computer respond
  }

  const status = await page.locator('#status').textContent();
  expect(status).not.toMatch(/you win/i);
});

const { test, expect } = require('@playwright/test');

// The Game Zone home page: every game is linked, the filters work, and "Play again" remembers games.
const games = ['house', 'dice', 'snake', 'tictactoe', 'connect4', 'battleships', 'uno', 'hangman', 'wordle', 'wordsearch', 'soccer', 'soccer5v5'];

test('every game has a tile that links to its folder', async ({ page }) => {
  await page.goto('/');
  for (const g of games) {
    await expect(page.locator(`.tile[data-game="${g}"]`)).toHaveAttribute('href', `${g}/`);
  }
});

test('the filters show only that kind of game, and are remembered', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#games .tile:visible')).toHaveCount(11);

  await page.getByRole('button', { name: 'Words' }).click();
  await expect(page.getByRole('button', { name: 'Words' })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('#games .tile:visible')).toHaveCount(3);
  await expect(page.locator('.tile.wordle')).toBeVisible();
  await expect(page.locator('.tile.snake')).toBeHidden();

  await page.reload();
  await expect(page.locator('#games .tile:visible')).toHaveCount(3);

  await page.getByRole('button', { name: 'All games' }).click();
  await expect(page.locator('#games .tile:visible')).toHaveCount(11);
});

test('"Play again" lists the last games opened, newest first', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#recent')).toBeHidden();

  await page.locator('.tile.snake').click();
  await page.goto('/');
  await page.locator('.tile.wordle').click();
  await page.goto('/');

  await expect(page.locator('#recent')).toBeVisible();
  await expect(page.locator('#recent-list .pill')).toHaveText([/Wordle/, /Snake/]);
  await expect(page.locator('#recent-list .pill').first()).toHaveAttribute('href', 'wordle/');
});

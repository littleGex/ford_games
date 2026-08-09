const { test, expect } = require('@playwright/test');

test('wordle page loads', async ({ page }) => {
  await page.goto('/wordle/');
  await expect(page).toHaveTitle(/wordle/i);
});

test('easy mode builds a 4-letter grid, hard mode builds a 6-letter grid', async ({ page }) => {
  await page.goto('/wordle/');
  await expect(page.locator('#grid .row').first().locator('.cell')).toHaveCount(4);

  await page.click('input[name="diff"][value="hard"]');
  await expect(page.locator('#grid .row').first().locator('.cell')).toHaveCount(6);
});

test('typing and backspace fill and clear the current row', async ({ page }) => {
  await page.goto('/wordle/');
  await page.keyboard.press('KeyA');
  await page.keyboard.press('KeyB');
  await expect(page.locator('#cell-0-0')).toHaveText('A');
  await expect(page.locator('#cell-0-1')).toHaveText('B');

  await page.keyboard.press('Backspace');
  await expect(page.locator('#cell-0-1')).toHaveText('');
});

test('guessing the exact target word wins immediately', async ({ page }) => {
  await page.goto('/wordle/');
  const target = await page.evaluate(() => window.__testGetTarget());

  for (const letter of target) {
    await page.keyboard.press(`Key${letter}`);
  }
  await page.keyboard.press('Enter');

  await expect(page.locator('#status')).toHaveText(/you got it/i);
  const cells = page.locator('#cell-0-0, #cell-0-1, #cell-0-2, #cell-0-3');
  await expect(cells.first()).toHaveClass(/correct/);
});

test('a guess that is not in the word list is rejected with a message', async ({ page }) => {
  await page.goto('/wordle/');

  for (const letter of 'ZZZZ') {
    await page.keyboard.press(`Key${letter}`);
  }
  await page.keyboard.press('Enter');

  await expect(page.locator('#status')).toHaveText(/not in the word list/i);
  // rejected guesses shouldn't consume a row — still on row 0
  await expect(page.locator('#cell-0-0')).toHaveText('Z');
});

test('New Word starts a fresh game', async ({ page }) => {
  await page.goto('/wordle/');
  await page.keyboard.press('KeyA');
  await expect(page.locator('#cell-0-0')).toHaveText('A');

  await page.click('#newGameBtn');
  await expect(page.locator('#cell-0-0')).toHaveText('');
  await expect(page.locator('#status')).toHaveText('');
});

test('adding a custom word rejects the wrong length for the selected difficulty', async ({ page }) => {
  await page.goto('/wordle/');
  await page.fill('#newWordInput', 'TOOLONGWORD');
  await page.selectOption('#newWordDifficulty', 'easy');
  await page.click('#addWordBtn');

  await expect(page.locator('#addWordMessage')).toHaveText(/must be exactly 4 letters/i);
});

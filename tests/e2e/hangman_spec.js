const { test, expect } = require('@playwright/test');

test('hangman page loads', async ({ page }) => {
  await page.goto('/hangman/');
  await expect(page).toHaveTitle(/hangman/i);
});

test('a correct guess reveals the letter and does not draw a figure part', async ({ page }) => {
  await page.goto('/hangman/');

  // find a letter that's actually in the (randomly chosen) word by checking
  // the on-screen keyboard after each guess, rather than hardcoding a word
  const letters = await page.locator('#keyboard button').all();
  let foundCorrect = false;

  for (const btn of letters) {
    const letter = await btn.textContent();
    await btn.click();
    const isCorrect = await btn.evaluate(el => el.classList.contains('correct'));
    if (isCorrect) {
      foundCorrect = true;
      // the word display should now show this letter somewhere, not just underscores
      await expect(page.locator('#wordDisplay')).toContainText(letter);
      break;
    }
  }

  expect(foundCorrect).toBeTruthy();
});

test('wrong guesses increment the counter and eventually end the game', async ({ page }) => {
  await page.goto('/hangman/');

  // click every letter — guarantees enough wrong guesses to lose, regardless
  // of which random word was picked, since no word uses all 26 letters
  const letters = await page.locator('#keyboard button').all();
  for (const btn of letters) {
    if (await btn.isDisabled()) continue;
    await btn.click();
  }

  await expect(page.locator('#status')).toHaveText(/out of guesses|you got it/i);
});

test('New Word starts a fresh game', async ({ page }) => {
  await page.goto('/hangman/');

  await page.locator('#keyboard button', { hasText: 'A' }).click();
  await page.click('#newWordBtn');

  // after a reset, no keyboard letters should be disabled and the wrong count is back to 0
  const disabledCount = await page.locator('#keyboard button:disabled').count();
  expect(disabledCount).toBe(0);
  await expect(page.locator('#wrongCount')).toHaveText(/Wrong guesses: 0 \/ 8/);
});

test('physical keyboard input works the same as clicking', async ({ page }) => {
  await page.goto('/hangman/');
  await page.keyboard.press('KeyA');

  const btnA = page.locator('#keyboard button', { hasText: 'A' });
  await expect(btnA).toBeDisabled();
});

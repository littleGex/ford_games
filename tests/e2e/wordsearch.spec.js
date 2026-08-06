const { test, expect } = require('@playwright/test');

test('word search page loads', async ({ page }) => {
  await page.goto('/wordsearch/');
  await expect(page).toHaveTitle(/word search/i);
});

test('easy mode builds an 8x8 grid, hard mode builds a 12x12 grid', async ({ page }) => {
  await page.goto('/wordsearch/');
  await expect(page.locator('#grid .cell')).toHaveCount(64);

  await page.click('input[name="diff"][value="hard"]');
  await expect(page.locator('#grid .cell')).toHaveCount(144);
});

test('dragging across a real placed word marks it found', async ({ page }) => {
  await page.goto('/wordsearch/');

  const placements = await page.evaluate(() => window.__testGetPlacements());
  const first = placements[0];
  const size = 8; // easy mode default
  const startCell = first.cells[0];
  const endCell = first.cells[first.cells.length - 1];

  const startLocator = page.locator('#grid .cell').nth(startCell.r * size + startCell.c);
  const endLocator = page.locator('#grid .cell').nth(endCell.r * size + endCell.c);

  const startBox = await startLocator.boundingBox();
  const endBox = await endLocator.boundingBox();

  await page.mouse.move(startBox.x + startBox.width / 2, startBox.y + startBox.height / 2);
  await page.mouse.down();
  await page.mouse.move(endBox.x + endBox.width / 2, endBox.y + endBox.height / 2, { steps: 10 });
  await page.mouse.up();

  await expect(page.locator(`#wordList li[data-word="${first.word}"]`)).toHaveClass(/found/);
  await expect(startLocator).toHaveClass(/found/);
});

test('finding all words shows a completion message', async ({ page }) => {
  await page.goto('/wordsearch/');

  const words = await page.evaluate(() => window.__testGetPlacements().map(p => p.word));
  for (const word of words) {
    await page.evaluate((w) => window.__testMarkFound(w), word);
  }

  await expect(page.locator('#status')).toHaveText(/all words found/i);
  const unfoundCount = await page.locator('#wordList li:not(.found)').count();
  expect(unfoundCount).toBe(0);
});

test('New Puzzle resets found words and status', async ({ page }) => {
  await page.goto('/wordsearch/');

  const firstWord = (await page.evaluate(() => window.__testGetPlacements()))[0].word;
  await page.evaluate((w) => window.__testMarkFound(w), firstWord);
  await expect(page.locator(`#wordList li[data-word="${firstWord}"]`)).toHaveClass(/found/);

  await page.click('#newPuzzleBtn');

  const foundCount = await page.locator('#wordList li.found').count();
  expect(foundCount).toBe(0);
  await expect(page.locator('#status')).toHaveText('');
});

test('adding an invalid word is rejected with a message', async ({ page }) => {
  await page.goto('/wordsearch/');
  await page.fill('#newWordInput', 'ab'); // too short
  await page.click('#addWordBtn');

  await expect(page.locator('#addWordMessage')).toHaveText(/3-10 letters/i);
});

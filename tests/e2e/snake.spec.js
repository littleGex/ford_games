
const { test, expect } = require('@playwright/test');

test('snake page loads', async ({ page }) => {
  await page.goto('/snake/');
  await expect(page).toHaveTitle(/snake/i);
});

test('leaderboard renders scores returned by the API', async ({ page }) => {
  // Mock the Firebase REST read so this test never depends on — or writes
  // to — the live production database.
  await page.route('**/scores.json', route => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        key1: { name: 'Alice', score: 20, timestamp: Date.now() },
        key2: { name: 'Bob', score: 15, timestamp: Date.now() },
      }),
    });
  });

  await page.goto('/snake/');
  await page.waitForSelector('#leaderboardList li');

  const entries = await page.locator('#leaderboardList li').allTextContents();
  expect(entries.some(e => e.includes('Alice') && e.includes('20'))).toBeTruthy();
  expect(entries.some(e => e.includes('Bob') && e.includes('15'))).toBeTruthy();
});

test('leaderboard shows a friendly message when there are no scores yet', async ({ page }) => {
  await page.route('**/scores.json', route => {
    route.fulfill({ status: 200, contentType: 'application/json', body: 'null' });
  });

  await page.goto('/snake/');
  await page.waitForSelector('#leaderboardList li');

  const entries = await page.locator('#leaderboardList li').allTextContents();
  expect(entries.some(e => /no scores yet/i.test(e))).toBeTruthy();
});

test('a scoring game shows the name entry form', async ({ page }) => {
  await page.route('**/scores.json', route => {
    route.fulfill({ status: 200, contentType: 'application/json', body: 'null' });
  });

  await page.goto('/snake/');

  // Drives the real endGame() logic via the test hook, rather than
  // simulating full gameplay/collision timing.
  await page.evaluate(() => window.__testSetScoreAndEndGame(15));

  await expect(page.locator('#nameEntry')).toBeVisible();
  await expect(page.locator('#score')).toHaveText('15');
});

test('Save Score posts the entered name and score to Firebase', async ({ page }) => {
  await page.route('**/scores.json', route => {
    route.fulfill({ status: 200, contentType: 'application/json', body: 'null' });
  });

  let savedPayload = null;
  // Firebase's REST write for push() targets a path like /scores/<key>.json
  await page.route('**/scores/*.json', route => {
    savedPayload = route.request().postDataJSON();
    route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
  });

  await page.goto('/snake/');

  const testPlayerName = `TestPlayer-${Date.now()}`;
  await page.evaluate(() => window.__testSetScoreAndEndGame(15));
  await page.fill('#nameInput', testPlayerName);
  await page.click('#saveScoreBtn');

  await expect.poll(() => savedPayload).not.toBeNull();
  expect(savedPayload.name).toBe(testPlayerName);
  expect(savedPayload.score).toBe(15);
});

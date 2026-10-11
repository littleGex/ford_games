const { test, expect } = require('@playwright/test');

// Headless Chromium draws WebGL in software, at a couple of frames a second. Each frame blocks the
// page, so key presses and clicks time out. The tests that play the game switch drawing off once
// the game has loaded; the first two tests still render for real.
async function openWithoutDrawing(page) {
  await page.goto('/house/');
  await expect(page.locator('#taskCount')).toHaveText(/^0\/\d+$/);
  await page.evaluate(() => { window.house.stage.renderer.render = () => {}; });
}

test('house page loads', async ({ page }) => {
  await page.goto('/house/');
  await expect(page).toHaveTitle(/ford house/i);
});

test('the job list fills in with the household jobs', async ({ page }) => {
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto('/house/');
  await expect(page.locator('#taskCount')).toHaveText(/^0\/\d+$/);
  const state = await page.evaluate(() => ({
    jobs: window.house.board.jobs.map(j => j.id),
    carrying: window.house.S.carrying,
  }));
  expect(state.jobs).toEqual(expect.arrayContaining(['bins', 'mow', 'hoover', 'car', 'coffee', 'tv']));
  expect(state.carrying).toBeNull();
  expect(errors).toEqual([]);
});

test('walking with the keyboard moves the player towards the house and hides the hint', async ({ page }) => {
  await openWithoutDrawing(page);
  const startZ = await page.evaluate(() => window.house.player.group.position.z);
  await page.keyboard.down('w');
  await page.waitForTimeout(500);
  await page.keyboard.up('w');
  const z = await page.evaluate(() => window.house.player.group.position.z);
  expect(z).toBeLessThan(startZ);
  await expect(page.locator('#hint')).toHaveClass(/gone/);
});

test('picking up an item next to it and putting it down completes a job', async ({ page }) => {
  await openWithoutDrawing(page);
  // stand next to the jacket on the sofa, pick it up, then stand at the coat rail and hang it up
  await page.evaluate(() => window.house.player.group.position.set(1.2, 0, 2.1));
  await expect(page.locator('#actBtn')).toHaveText('Pick up the jacket');
  await page.locator('#actBtn').click();
  expect(await page.evaluate(() => window.house.S.carrying)).toBe('jacket');
  await page.evaluate(() => window.house.player.group.position.set(3.95, 0, 7.95));
  await expect(page.locator('#actBtn')).toHaveText('Hang it on the hook');
  await page.locator('#actBtn').click();
  const jacket = await page.evaluate(() => {
    const j = window.house.board.find('jacket');
    return { done: j.i >= j.steps.length, carrying: window.house.S.carrying };
  });
  expect(jacket).toEqual({ done: true, carrying: null });
  await expect(page.locator('#taskCount')).toHaveText(/^1\/\d+$/);
});

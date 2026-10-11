const { test, expect } = require('@playwright/test');

// Headless Chromium draws WebGL in software, at a couple of frames a second. Each frame blocks the
// page, so key presses, clicks and even reading state time out. Apart from 'house page loads', the
// tests stop the game drawing after `frames` frames: none for the tests that play the game, a few
// for the test that checks the scene draws without errors. The game sets window.house just before
// its frame loop starts, which is where drawing gets limited.
async function openHouse(page, { frames = 0 } = {}) {
  await page.addInitScript(limit => {
    let house;
    Object.defineProperty(window, 'house', {
      configurable: true,
      get: () => house,
      set: value => {
        house = value;
        const renderer = house.stage.renderer, draw = renderer.render.bind(renderer);
        let left = limit;
        renderer.render = (...args) => { if (left-- > 0) draw(...args); };
      },
    });
  }, frames);
  await page.goto('/house/');
  await expect(page.locator('#taskCount')).toHaveText(/^0\/\d+$/);
}

// Each day's list is random, so tests that need a particular job set today's list themselves.
async function planToday(page, ids) {
  await page.evaluate(list => window.house.days.plan(list), ids);
  await expect(page.locator('#taskCount')).toHaveText(`0/${ids.length}`);
}

test('house page loads', async ({ page }) => {
  await page.goto('/house/');
  await expect(page).toHaveTitle(/ford house/i);
});

test('day 1 starts with 10 to 12 household jobs', async ({ page }) => {
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await openHouse(page, { frames: 3 });
  await expect(page.locator('#dayLabel')).toHaveText('Day 1');
  const state = await page.evaluate(() => ({
    jobs: window.house.board.jobs.map(j => j.id),
    carrying: window.house.S.carrying,
  }));
  expect(state.jobs.length).toBeGreaterThanOrEqual(10);
  expect(state.jobs.length).toBeLessThanOrEqual(12);
  // day 1 is random apart from the jobs that are always due on a first day: bin day and the appointments
  expect(state.jobs).toEqual(expect.arrayContaining(['binsOut', 'mow', 'hoover']));
  expect(state.carrying).toBeNull();
  expect(errors).toEqual([]);
});

test('walking with the keyboard moves the player towards the house and hides the hint', async ({ page }) => {
  await openHouse(page);
  const startZ = await page.evaluate(() => window.house.player.group.position.z);
  await page.keyboard.down('w');
  await page.waitForTimeout(500);
  await page.keyboard.up('w');
  const z = await page.evaluate(() => window.house.player.group.position.z);
  expect(z).toBeLessThan(startZ);
  await expect(page.locator('#hint')).toHaveClass(/gone/);
});

test('picking up an item next to it and putting it down completes a job', async ({ page }) => {
  await openHouse(page);
  await planToday(page, ['jacket', 'hands']);
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
  await expect(page.locator('#taskCount')).toHaveText('1/2');
});

test('finishing the last job shows Day complete, and the next day is saved for next time', async ({ page }) => {
  await openHouse(page);
  await planToday(page, ['hands']);
  await page.evaluate(() => window.house.player.group.position.set(5.0, 0, 7.98));   // in the WC by the basin
  await expect(page.locator('#actBtn')).toHaveText('Wash hands');
  await page.locator('#actBtn').click();

  await expect(page.locator('#dayDone')).toBeVisible();
  await expect(page.locator('#dayDoneTitle')).toHaveText('Day 1 complete');
  await page.locator('#dayNext').click();
  await expect(page.locator('#dayDone')).toBeHidden();
  await expect(page.locator('#dayLabel')).toHaveText('Day 2');
  const today = await page.evaluate(() => window.house.board.jobs.map(j => j.id));
  expect(today.length).toBeGreaterThanOrEqual(10);

  // closing and reopening the page carries on with the same day and the same list
  await openHouse(page);
  await expect(page.locator('#dayLabel')).toHaveText('Day 2');
  expect(await page.evaluate(() => window.house.board.jobs.map(j => j.id))).toEqual(today);
});

test('start over goes back to day 1 after confirming', async ({ page }) => {
  await openHouse(page);
  await planToday(page, ['hands']);
  await page.evaluate(() => window.house.player.group.position.set(5.0, 0, 7.98));
  await page.locator('#actBtn').click();
  await page.locator('#dayNext').click();
  await expect(page.locator('#dayLabel')).toHaveText('Day 2');

  await planToday(page, ['hands']);
  await page.evaluate(() => window.house.player.group.position.set(5.0, 0, 7.98));
  await page.locator('#actBtn').click();
  await expect(page.locator('#dayDoneTitle')).toHaveText('Day 2 complete');
  await page.locator('#dayRestart').click();
  await page.locator('#dayRestartYes').click();
  await expect(page.locator('#dayLabel')).toHaveText('Day 1');
  await expect(page.locator('#dayDone')).toBeHidden();
});

test('the stairs take you up to the first floor and back down', async ({ page }) => {
  await openHouse(page);
  await planToday(page, ['teeth', 'hands']);
  await page.evaluate(() => window.house.player.group.position.set(4.4, 0, 6.05));   // foot of the stairs
  await expect(page.locator('#actBtn')).toHaveText('Go upstairs');
  await page.locator('#actBtn').click();
  await expect(page.locator('#floorName')).toHaveText('Obergeschoss');
  expect(await page.evaluate(() => window.house.S.level)).toBe(1);

  // upstairs job: brush your teeth at the bathroom basin
  await page.evaluate(() => window.house.player.group.position.set(4.6, 2.3, 7.22));
  await expect(page.locator('#actBtn')).toHaveText('Brush your teeth at the basin');

  await page.evaluate(() => window.house.player.group.position.set(4.15, 2.3, 4.45));   // top of the stairs
  await expect(page.locator('#actBtn')).toHaveText('Go downstairs');
  await page.locator('#actBtn').click();
  await expect(page.locator('#floorName')).toHaveText('Erdgeschoss');
});

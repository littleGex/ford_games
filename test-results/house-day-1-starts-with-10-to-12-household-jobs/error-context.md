# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: house.spec.js >> day 1 starts with 10 to 12 household jobs
- Location: tests/e2e/house.spec.js:37:1

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: expect(locator).toHaveText(expected) failed

Locator: locator('#taskCount')
Expected pattern: /^0\/\d+$/
Received string:  ""

Call log:
  - Expect "toHaveText" with timeout 5000ms
  - waiting for locator('#taskCount')

```

# Test source

```ts
  1   | const { test, expect } = require('@playwright/test');
  2   | 
  3   | // Headless Chromium draws WebGL in software, at a couple of frames a second. Each frame blocks the
  4   | // page, so key presses, clicks and even reading state time out. Apart from 'house page loads', the
  5   | // tests stop the game drawing after `frames` frames: none for the tests that play the game, a few
  6   | // for the test that checks the scene draws without errors. The game sets window.house just before
  7   | // its frame loop starts, which is where drawing gets limited.
  8   | async function openHouse(page, { frames = 0 } = {}) {
  9   |   await page.addInitScript(limit => {
  10  |     let house;
  11  |     Object.defineProperty(window, 'house', {
  12  |       configurable: true,
  13  |       get: () => house,
  14  |       set: value => {
  15  |         house = value;
  16  |         const renderer = house.stage.renderer, draw = renderer.render.bind(renderer);
  17  |         let left = limit;
  18  |         renderer.render = (...args) => { if (left-- > 0) draw(...args); };
  19  |       },
  20  |     });
  21  |   }, frames);
  22  |   await page.goto('/house/');
> 23  |   await expect(page.locator('#taskCount')).toHaveText(/^0\/\d+$/);
      |                                            ^ Error: expect(locator).toHaveText(expected) failed
  24  | }
  25  | 
  26  | // Each day's list is random, so tests that need a particular job set today's list themselves.
  27  | async function planToday(page, ids) {
  28  |   await page.evaluate(list => window.house.days.plan(list), ids);
  29  |   await expect(page.locator('#taskCount')).toHaveText(`0/${ids.length}`);
  30  | }
  31  | 
  32  | test('house page loads', async ({ page }) => {
  33  |   await page.goto('/house/');
  34  |   await expect(page).toHaveTitle(/ford house/i);
  35  | });
  36  | 
  37  | test('day 1 starts with 10 to 12 household jobs', async ({ page }) => {
  38  |   const errors = [];
  39  |   page.on('pageerror', e => errors.push(e.message));
  40  |   await openHouse(page, { frames: 3 });
  41  |   await expect(page.locator('#dayLabel')).toHaveText('Day 1');
  42  |   const state = await page.evaluate(() => ({
  43  |     jobs: window.house.board.jobs.map(j => j.id),
  44  |     carrying: window.house.S.carrying,
  45  |   }));
  46  |   expect(state.jobs.length).toBeGreaterThanOrEqual(10);
  47  |   expect(state.jobs.length).toBeLessThanOrEqual(12);
  48  |   // day 1 is random apart from the jobs that are always due on a first day: bin day and the appointments
  49  |   expect(state.jobs).toEqual(expect.arrayContaining(['binsOut', 'mow', 'hoover']));
  50  |   expect(state.carrying).toBeNull();
  51  |   expect(errors).toEqual([]);
  52  | });
  53  | 
  54  | test('walking with the keyboard moves the player towards the house and hides the hint', async ({ page }) => {
  55  |   await openHouse(page);
  56  |   const startZ = await page.evaluate(() => window.house.player.group.position.z);
  57  |   await page.keyboard.down('w');
  58  |   await page.waitForTimeout(500);
  59  |   await page.keyboard.up('w');
  60  |   const z = await page.evaluate(() => window.house.player.group.position.z);
  61  |   expect(z).toBeLessThan(startZ);
  62  |   await expect(page.locator('#hint')).toHaveClass(/gone/);
  63  | });
  64  | 
  65  | test('picking up an item next to it and putting it down completes a job', async ({ page }) => {
  66  |   await openHouse(page);
  67  |   await planToday(page, ['jacket', 'hands']);
  68  |   // stand next to the jacket on the sofa, pick it up, then stand at the coat rail and hang it up
  69  |   await page.evaluate(() => window.house.player.group.position.set(1.2, 0, 2.1));
  70  |   await expect(page.locator('#actBtn')).toHaveText('Pick up the jacket');
  71  |   await page.locator('#actBtn').click();
  72  |   expect(await page.evaluate(() => window.house.S.carrying)).toBe('jacket');
  73  |   await page.evaluate(() => window.house.player.group.position.set(3.95, 0, 7.95));
  74  |   await expect(page.locator('#actBtn')).toHaveText('Hang it on the hook');
  75  |   await page.locator('#actBtn').click();
  76  |   const jacket = await page.evaluate(() => {
  77  |     const j = window.house.board.find('jacket');
  78  |     return { done: j.i >= j.steps.length, carrying: window.house.S.carrying };
  79  |   });
  80  |   expect(jacket).toEqual({ done: true, carrying: null });
  81  |   await expect(page.locator('#taskCount')).toHaveText('1/2');
  82  | });
  83  | 
  84  | test('finishing the last job shows Day complete, and the next day is saved for next time', async ({ page }) => {
  85  |   await openHouse(page);
  86  |   await planToday(page, ['hands']);
  87  |   await page.evaluate(() => window.house.player.group.position.set(5.0, 0, 7.98));   // in the WC by the basin
  88  |   await expect(page.locator('#actBtn')).toHaveText('Wash hands');
  89  |   await page.locator('#actBtn').click();
  90  | 
  91  |   await expect(page.locator('#dayDone')).toBeVisible();
  92  |   await expect(page.locator('#dayDoneTitle')).toHaveText('Day 1 complete');
  93  |   await page.locator('#dayNext').click();
  94  |   await expect(page.locator('#dayDone')).toBeHidden();
  95  |   await expect(page.locator('#dayLabel')).toHaveText('Day 2');
  96  |   const today = await page.evaluate(() => window.house.board.jobs.map(j => j.id));
  97  |   expect(today.length).toBeGreaterThanOrEqual(10);
  98  | 
  99  |   // closing and reopening the page carries on with the same day and the same list
  100 |   await openHouse(page);
  101 |   await expect(page.locator('#dayLabel')).toHaveText('Day 2');
  102 |   expect(await page.evaluate(() => window.house.board.jobs.map(j => j.id))).toEqual(today);
  103 | });
  104 | 
  105 | test('start over goes back to day 1 after confirming', async ({ page }) => {
  106 |   await openHouse(page);
  107 |   await planToday(page, ['hands']);
  108 |   await page.evaluate(() => window.house.player.group.position.set(5.0, 0, 7.98));
  109 |   await page.locator('#actBtn').click();
  110 |   await page.locator('#dayNext').click();
  111 |   await expect(page.locator('#dayLabel')).toHaveText('Day 2');
  112 | 
  113 |   await planToday(page, ['hands']);
  114 |   await page.evaluate(() => window.house.player.group.position.set(5.0, 0, 7.98));
  115 |   await page.locator('#actBtn').click();
  116 |   await expect(page.locator('#dayDoneTitle')).toHaveText('Day 2 complete');
  117 |   await page.locator('#dayRestart').click();
  118 |   await page.locator('#dayRestartYes').click();
  119 |   await expect(page.locator('#dayLabel')).toHaveText('Day 1');
  120 |   await expect(page.locator('#dayDone')).toBeHidden();
  121 | });
  122 | 
  123 | test('the stairs take you up to the first floor and back down', async ({ page }) => {
```
const { test, expect } = require('@playwright/test');

// Headless Chromium draws WebGL in software, at a couple of frames a second. Each frame blocks the
// page, so key presses, clicks and even reading state time out. The tests stop the game drawing
// after `frames` frames: none for most of them, one for the test that checks the scene draws
// without errors. The game sets window.house just before its frame loop starts, which is where
// drawing gets limited.
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
  // a frame that is drawn can take many seconds on a busy machine
  await expect(page.locator('#taskCount')).toHaveText(/^0\/\d+$/, { timeout: frames ? 60000 : 20000 });
  await play(page);
}

// The game opens on the home screen; Play closes it.
async function play(page) {
  await page.locator('#homePlay').click();
  await expect(page.locator('#home')).toBeHidden();
}

// Each day's list is random, so tests that need a particular job set today's list themselves.
async function planToday(page, ids) {
  await page.evaluate(list => window.house.days.plan(list), ids);
  await expect(page.locator('#taskCount')).toHaveText(`0/${ids.length}`);
}

test('house page loads', async ({ page }) => {
  await openHouse(page);
  await expect(page).toHaveTitle(/ford house/i);
});

test('day 1 starts with 12 to 14 household jobs', async ({ page }) => {
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  test.slow();   // this one draws the scene for real
  await openHouse(page, { frames: 1 });
  await expect(page.locator('#dayLabel')).toHaveText('Day 1');
  const state = await page.evaluate(() => ({
    jobs: window.house.board.jobs.map(j => j.id),
    carrying: window.house.S.carrying,
  }));
  expect(state.jobs.length).toBeGreaterThanOrEqual(12);
  expect(state.jobs.length).toBeLessThanOrEqual(14);
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
  expect(today.length).toBeGreaterThanOrEqual(12);

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

test('start over on the home screen asks first, then goes back to day 1', async ({ page }) => {
  await openHouse(page);
  await planToday(page, ['hands']);
  await page.evaluate(() => window.house.player.group.position.set(5.0, 0, 7.98));
  await page.locator('#actBtn').click();
  await page.locator('#dayNext').click();
  await expect(page.locator('#dayLabel')).toHaveText('Day 2');

  // saying no keeps the day
  await page.locator('#menuBtn').click();
  await page.locator('#gameRestart').click();
  await page.locator('#gameRestartNo').click();
  await expect(page.locator('#gameRestart')).toBeVisible();
  await expect(page.locator('#dayLabel')).toHaveText('Day 2');

  await page.locator('#gameRestart').click();
  await page.locator('#gameRestartYes').click();
  await expect(page.locator('#dayLabel')).toHaveText('Day 1');
  await expect(page.locator('#home')).toBeHidden();   // straight into day 1
  expect(await page.evaluate(() => window.house.days.save.day)).toBe(1);
});

test('each character has their own jobs: Dad shaves, Mum works, P and Dude do homework', async ({ page }) => {
  await openHouse(page);
  const jobs = () => page.evaluate(() => window.house.board.jobs.map(j => j.id));
  // a new game starts as Dad on day 1, a school day
  expect(await jobs()).toContain('shave');
  expect(await jobs()).not.toContain('homework');

  await page.locator('.who button[data-c="girl"]').click();
  await expect(page.locator('#taskList')).toContainText('Do your homework');
  expect(await jobs()).not.toContain('shave');

  await page.locator('.who button[data-c="dad"]').click();
  await expect(page.locator('#taskList')).toContainText('Have a shave');
  expect(await jobs()).not.toContain('homework');

  // Mum works in the office
  await page.locator('.who button[data-c="mum"]').click();
  await expect(page.locator('#taskList')).toContainText('Do some work');
  expect(await jobs()).not.toContain('shave');

  // P does her homework at the desk in her room, Dude at his own desk in the attic
  await page.locator('.who button[data-c="girl"]').click();
  await page.evaluate(() => { window.house.levels.go(1); window.house.player.group.position.set(1.9, 2.3, 8.05); });
  await expect(page.locator('#actBtn')).toHaveText('Sit at the desk and do your homework');
  await page.locator('.who button[data-c="boy"]').click();
  await page.evaluate(() => { window.house.levels.go(2); window.house.player.group.position.set(4.1, 4.6, 2.27); });
  await expect(page.locator('#actBtn')).toHaveText('Sit at your desk and do your homework');
});

test('doing the washing starts with sorting it by colour', async ({ page }) => {
  await openHouse(page);
  await planToday(page, ['washer']);
  await page.evaluate(() => { window.house.levels.go(1, { arrive: [4.25, 3.3], facing: 0 }); });   // by the hamper in the dressing room
  await expect(page.locator('#actBtn')).toHaveText('Sort the washing by colour');
  await page.locator('#actBtn').click();
  await expect(page.locator('#sort')).toBeVisible();
  for (let k = 0; k < 8; k++) {
    const bin = await page.evaluate(() => window.house.sorting.answer());
    await page.locator(`#sort [data-bin="${bin}"]`).click();
  }
  await expect(page.locator('#sort')).toBeHidden();
  expect(await page.evaluate(() => window.house.board.find('washer').i)).toBe(1);
});

test('the seasons: raking leaves in autumn, clearing snow in winter', async ({ page }) => {
  await page.goto('/house/?season=autumn');
  await expect(page.locator('#taskCount')).toHaveText(/^0\/\d+$/);
  await play(page);
  expect(await page.evaluate(() => window.house.season)).toBe('autumn');
  await page.evaluate(() => { window.house.stage.renderer.render = () => {}; });
  await planToday(page, ['rake']);
  await page.evaluate(() => window.house.player.group.position.set(2.05, 0, -14.4));   // by the shed
  await expect(page.locator('#actBtn')).toHaveText('Take the rake from by the shed');

  await page.evaluate(() => localStorage.clear());   // a fresh game, so day 1 is planned in winter
  await page.goto('/house/?season=winter');
  await expect(page.locator('#taskCount')).toHaveText(/^0\/\d+$/);
  await play(page);
  const winter = await page.evaluate(() => ({ season: window.house.season, mow: window.house.board.jobs.some(j => j.id === 'mow') }));
  expect(winter).toEqual({ season: 'winter', mow: false });   // no mowing in the snow
  await page.evaluate(() => { window.house.stage.renderer.render = () => {}; });
  await planToday(page, ['snow']);
  await page.evaluate(() => window.house.player.group.position.set(4.1, 0, 9.9));   // by the front door
  await expect(page.locator('#actBtn')).toHaveText('Grab the snow shovel');
});

test('the home screen: carry on, pick who plays, missions, back to Game Zone', async ({ page }) => {
  await page.goto('/house/');
  await expect(page.locator('#home')).toBeVisible();   // the game opens on it
  await expect(page.locator('#homeTitle')).toHaveText('Ford House');
  await expect(page.locator('#homePlay')).toHaveText('Start day 1');
  await expect(page.locator('#homeSub')).toHaveText(/^Day 1 · playing as Dad · 0 of \d+ jobs done$/);
  await expect(page.locator('#homeBack')).toHaveAttribute('href', '../');
  await expect(page.locator('.mission')).toHaveCount(5);   // the school run, work from home, the office, 3D printing, bedtime (coming soon)

  // picking who plays here changes the player too
  await page.locator('.home-who button[data-c="mum"]').click();
  await expect(page.locator('.who button[data-c="mum"]')).toHaveAttribute('aria-pressed', 'true');
  expect(await page.evaluate(() => window.house.days.character)).toBe('mum');

  // the game is paused while it's open
  const before = await page.evaluate(() => window.house.clock.elapsedTime);
  await page.waitForTimeout(400);
  expect(await page.evaluate(() => window.house.clock.elapsedTime)).toBe(before);

  await page.locator('#homePlay').click();
  await expect(page.locator('#home')).toBeHidden();
  await page.locator('#menuBtn').click();                 // ☰ brings it back
  await expect(page.locator('#home')).toBeVisible();
  await expect(page.locator('#homeSub')).toContainText('playing as Mum');
  await page.keyboard.press('Escape');                    // Escape closes it
  await expect(page.locator('#home')).toBeHidden();
});

test("standing in the terrace door still counts as the living room", async ({ page }) => {
  await openHouse(page);
  await page.evaluate(() => window.house.player.group.position.set(1.6, 0, 1.0));
  await expect(page.locator('#roomName')).toHaveText('Wohnzimmer');
  await page.evaluate(() => window.house.player.group.position.set(1.6, 0, -0.2));   // in the doorway, inside the wall
  await page.waitForTimeout(200);
  await expect(page.locator('#roomName')).toHaveText('Wohnzimmer');
});

test("the page can't be pinch- or double-tap-zoomed", async ({ page }) => {
  await openHouse(page);
  const zoom = await page.evaluate(() => {
    const gesture = new Event('gesturestart', { cancelable: true });   // Safari's pinch gesture
    document.dispatchEvent(gesture);
    return {
      meta: document.querySelector('meta[name="viewport"]').content,
      gestureCancelled: gesture.defaultPrevented,
      body: getComputedStyle(document.body).touchAction,
      list: getComputedStyle(document.getElementById('taskList')).touchAction,   // the job list can still scroll
    };
  });
  expect(zoom.meta).toContain('maximum-scale=1');
  expect(zoom.meta).toContain('user-scalable=no');
  expect(zoom.gestureCancelled).toBe(true);
  expect(zoom.body).toBe('none');
  expect(zoom.list).toBe('pan-y');
});

test('a parcel for the neighbours: take it in, then the neighbour comes round for it', async ({ page }) => {
  await openHouse(page);
  await page.evaluate(() => { const h = window.house; h.S.started = true; h.deliveries.neighbourParcelNow(h.clock.elapsedTime, 'right', true); });
  await expect(page.locator('#taskList')).toContainText('Parcel for the neighbours on the right', { timeout: 20000 });
  await page.evaluate(() => window.house.player.group.position.set(3.92, 0, 10.2));
  await expect(page.locator('#actBtn')).toHaveText("Take the neighbours' parcel");
  await page.locator('#actBtn').click();
  await page.evaluate(() => window.house.player.group.position.set(3.7, 0, 4.9));
  await expect(page.locator('#actBtn')).toHaveText('Keep it safe in the hall');
  await page.locator('#actBtn').click();
  // skip most of the wait: the neighbour walks round and rings
  await page.evaluate(() => { const j = window.house.board.find('neighbourParcel'); j.steps[j.i].prog = j.steps[j.i].dur - 0.5; });
  await expect(page.locator('#alert')).toContainText('The neighbours are at the front door', { timeout: 30000 });
});

test('the food shopping: check the fridge, order on the phone, the driver brings it to the door', async ({ page }) => {
  await openHouse(page);
  await page.evaluate(() => { window.house.S.started = true; });
  await planToday(page, ['shopping']);
  const act = async (x, z, label) => {
    await page.evaluate(([px, pz]) => window.house.player.group.position.set(px, 0, pz), [x, z]);
    await expect(page.locator('#actBtn')).toHaveText(label);
    await page.locator('#actBtn').click();
  };
  await act(4.25, 3.4, "Check what's in the fridge");
  await act(1.3, 3.5, 'Pick up your phone');
  await act(1.25, 3.0, 'Sit on the sofa and order the food');
  await page.evaluate(() => { const j = window.house.board.find('shopping'); j.steps[j.i].prog = j.steps[j.i].dur; });
  await act(1.3, 3.5, 'Put your phone back on the side table');
  await page.evaluate(() => { const j = window.house.board.find('shopping'); j.steps[j.i].prog = j.steps[j.i].dur; });
  await expect(page.locator('#alert')).toContainText('The food delivery is at the front door', { timeout: 30000 });
  await act(3.7, 10.4, 'Answer the door and take the shopping');
});

test("P's bearded dragon: feed it from the box on the windowsill", async ({ page }) => {
  await openHouse(page);
  await page.locator('.who [data-c="girl"]').click();
  await planToday(page, ['feedDragon']);
  await page.evaluate(() => window.house.levels.go(1));
  const act = async (x, z, label) => {
    await page.evaluate(([px, pz]) => window.house.player.group.position.set(px, window.house.S.level * 2.3, pz), [x, z]);
    await expect(page.locator('#actBtn')).toHaveText(label);
    await page.locator('#actBtn').click();
  };
  await act(1.55, 8.45, 'Get the box of crickets from the windowsill');
  await act(2.3, 6.4, 'Put the crickets and greens in the terrarium');
  await expect(page.locator('#alert')).toContainText('Feeding the dragon');
  expect(await page.evaluate(() => window.house.world.crickets.visible)).toBe(true);
  await page.evaluate(() => { window.house.S.sitting.step.prog = 99; });
  await expect(page.locator('#alert')).toBeHidden();   // fed: P stands up again
  await act(1.55, 8.45, 'Put the box back on the windowsill');
  await expect(page.locator('#taskCount')).toHaveText('1/1');
});

test('the solar panels: check the reading, then brush the panels on the shed', async ({ page }) => {
  await openHouse(page);
  await planToday(page, ['solar']);
  expect(await page.evaluate(() => window.house.world.dirt[3].visible)).toBe(true);
  const act = async (x, z, label) => {
    await page.evaluate(([px, pz]) => window.house.player.group.position.set(px, 0, pz), [x, z]);
    await expect(page.locator('#actBtn')).toHaveText(label);
    await page.locator('#actBtn').click();
  };
  await act(5.05, 4.45, 'Check the solar reading on the cabinet');
  await act(3.4, -14.6, 'Get the long brush from the shed');
  await act(4.35, -16.1, 'Brush the panels on the shed roof in circles');
  await expect(page.locator('#alert')).toContainText('Wipe in circles');
});

test('work from home: the morning, then several jobs at once and a phone call', async ({ page }) => {
  await openHouse(page);
  await page.locator('#menuBtn').click();
  await page.locator('[data-mission="wfh"][data-kid="dad"]').click();
  await expect(page.locator('#dayLabel')).toHaveText('Work from home · 7:00');
  await expect(page.locator('#actBtn')).toHaveText('Get out of bed');   // Dad starts next to the big bed
  await page.evaluate(() => { const H = window.house; for (let k = 0; k < 4; k++) H.board.advance(H.board.jobs.find(j => j.i < j.steps.length)); });
  await expect(page.locator('#taskList')).toContainText('Team meeting at 9:00');
  await expect(page.locator('#taskList')).toContainText('Lunch (from 12:00)');
  await expect(page.locator('#taskList')).toContainText('Coffee (whenever you like)');
  // at the desk the meeting comes first; at 8:00 it isn't open yet, from 8:30 it is
  await page.evaluate(() => { const H = window.house; H.S.mission.t = 60 * 0.5; H.player.group.position.set(3.95, 2.3, 0.6); });
  await expect(page.locator('#actBtn')).toHaveText('Sit at your desk and answer your emails');
  await page.evaluate(() => { window.house.S.mission.t = 95 * 0.5; });   // 8:35
  await expect(page.locator('#actBtn')).toHaveText('Sit at your desk and join the team meeting');
  // the phone rings with an urgent call, which then comes first at the desk
  await page.evaluate(() => { const H = window.house; H.S.mission.t = 95 * 0.5; H.S.mission.callAt = 0; });   // rings at 8:35, so it's due before the 9:00 meeting
  await expect(page.locator('#taskList')).toContainText('Urgent call by');
  await expect(page.locator('#actBtn')).toHaveText('Sit at your desk and join the urgent call');
  await page.evaluate(() => window.house.missions.end());
  await expect(page.locator('#dayLabel')).toHaveText('Day 1');
});

test('work at the office: cycle there, clock in, and a fire drill stops everything else', async ({ page }) => {
  await openHouse(page);
  await page.locator('#menuBtn').click();
  await page.locator('[data-mission="office"][data-kid="dad"]').click();
  await expect(page.locator('#dayLabel')).toHaveText('Work at the office · 7:00');
  await page.evaluate(() => { const H = window.house; for (let k = 0; k < 3; k++) H.board.advance(H.board.jobs.find(j => j.i < j.steps.length)); H.levels.show(0); });
  const act = async (x, z, label) => {
    await page.evaluate(([px, pz]) => window.house.player.group.position.set(px, 0, pz), [x, z]);
    await expect(page.locator('#actBtn')).toHaveText(label);
    await page.locator('#actBtn').click();
  };
  await act(4.8, -2.8, 'Take your bike from the terrace');
  await act(4.35, -16.3, 'Ride out of the back gate to work');
  await expect(page.locator('#roomName')).toHaveText('Büro');   // arrived outside the office
  await act(42.62, 13.1, 'Clock in at the machine by the door');
  await expect(page.locator('#taskList')).toContainText('Meeting with the boss at 10:00');
  // the fire alarm: only the drill can be done, and it goes to the top of the list
  await page.evaluate(() => { window.house.S.mission.drillAt = 0; });
  await expect(page.locator('#alert')).toContainText('Fire alarm!');
  await expect(page.locator('#taskList li').first()).toContainText('Fire drill!');
  await page.evaluate(() => window.house.player.group.position.set(44.9, 0, 8.95));   // at Dad's desk
  await expect(page.locator('#actBtn')).toBeHidden();
  await act(43.1, -2.0, 'Go out through the fire door to the assembly point');
  await expect(page.locator('#alert')).toContainText('wait for the all-clear');
  await page.evaluate(() => window.house.missions.end());
  await expect(page.locator('#dayLabel')).toHaveText('Day 1');
});

test("Mum's office: drive there, zebra crossing, badge through the turnstiles, clock in, lift up to her desk", async ({ page }) => {
  await openHouse(page);
  await page.locator('#menuBtn').click();
  await page.locator('[data-mission="officeMum"][data-kid="mum"]').click();
  await expect(page.locator('#dayLabel')).toHaveText('Work at the office · 7:00');
  await page.evaluate(() => { const H = window.house; for (let k = 0; k < 3; k++) H.board.advance(H.board.jobs.find(j => j.i < j.steps.length)); H.levels.show(0); });
  const act = async (x, z, label, level = 0) => {
    await page.evaluate(([px, pz, l]) => window.house.player.group.position.set(px, l * 2.3, pz), [x, z, level]);
    await expect(page.locator('#actBtn')).toHaveText(label);
    await page.locator('#actBtn').click();
  };
  await act(0.6, 13.0, 'Get in the car and drive to work');
  await expect(page.locator('#roomName')).toHaveText('Parkplatz');
  await act(97.5, 1.8, 'Cross the road on the zebra crossing');
  await act(98.2, 2.95, 'Show your badge at the turnstiles');
  await expect(page.locator('#taskList')).toContainText('Coffee at the café (if you like)');
  await act(98.6, 8.1, 'Clock in at the machine inside the entrance');
  await expect(page.locator('#taskList')).toContainText('Team meeting at 10:00');
  await act(109.0, 16.9, 'Take the lift up');
  await expect(page.locator('#roomName')).toHaveText('Aufzüge');
  await page.evaluate(() => window.house.player.group.position.set(100.1, 2.3, 13.3));   // at Mum's desk
  await expect(page.locator('#actBtn')).toHaveText('Sit at your desk and answer your emails');
  await page.evaluate(() => window.house.missions.end());
  await expect(page.locator('#dayLabel')).toHaveText('Day 1');
});

test('the 3D printing mission: pick a design on the laptop close-up', async ({ page }) => {
  await openHouse(page);
  await page.locator('#menuBtn').click();
  await page.locator('[data-mission="print3d"][data-kid="dad"]').click();
  await expect(page.locator('#dayLabel')).toHaveText('3D printing');
  await page.evaluate(() => window.house.player.group.position.set(3.95, 2.3, 0.6));
  await expect(page.locator('#actBtn')).toHaveText('Open the laptop and pick a design');
  await page.locator('#actBtn').click();
  await expect(page.locator('#laptop')).toBeVisible();
  await expect(page.locator('#laptopTiles button')).toHaveCount(4);
  await page.locator('[data-choice="rocket"]').click();
  await expect(page.locator('#laptop')).toBeHidden();
  await expect(page.locator('#taskList')).toContainText('Order some filament');
  await page.locator('#actBtn').click();
  await expect(page.locator('#laptopTitle')).toHaveText('Order a spool of filament');
  await page.keyboard.press('2');   // blue
  await expect(page.locator('#taskList')).toContainText('Collect the delivery');
  expect(await page.evaluate(() => window.house.S.mission.choices)).toEqual({ design: 'rocket', filament: 'blue' });
  await page.evaluate(() => window.house.missions.end());
  await expect(page.locator('#dayLabel')).toHaveText('Day 1');
});

test('the school run mission starts from the home screen and goes back to the day', async ({ page }) => {
  await openHouse(page);
  const day = await page.evaluate(() => window.house.board.jobs.map(j => j.id));
  await page.locator('#menuBtn').click();
  await page.locator('[data-mission="schoolRun"][data-kid="girl"]').click();
  await expect(page.locator('#home')).toBeHidden();
  await expect(page.locator('#dayLabel')).toHaveText('The school run · 7:30');
  await expect(page.locator('#taskList')).toContainText('Get up');
  await expect(page.locator('#actBtn')).toHaveText('Get out of bed');   // P starts next to her bed
  await page.locator('#actBtn').click();
  await expect(page.locator('#taskList')).toContainText('Eat your breakfast');   // the next step joins the list

  await page.locator('#menuBtn').click();
  await expect(page.locator('#homePlay')).toHaveText('Back to the school run');
  await page.locator('#homePlay').click();

  await page.evaluate(() => window.house.missions.end());
  await expect(page.locator('#dayLabel')).toHaveText('Day 1');
  expect(await page.evaluate(() => window.house.board.jobs.map(j => j.id))).toEqual(day);
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

test('the next flight takes you from the first floor up to the attic and back', async ({ page }) => {
  await openHouse(page);
  await planToday(page, ['teeth', 'hands']);
  await page.evaluate(() => { window.house.levels.go(1, { arrive: [4.25, 6.3], facing: 0 }); });
  await expect(page.locator('#actBtn')).toHaveText('Go up to the attic');   // even with the basin close by
  await page.locator('#actBtn').click();
  await expect(page.locator('#floorName')).toHaveText('Dachgeschoss');
  expect(await page.evaluate(() => ({ level: window.house.S.level, attic: window.house.world.attic.visible }))).toEqual({ level: 2, attic: true });

  await page.evaluate(() => window.house.player.group.position.set(1.5, 4.6, 2.5));
  await expect(page.locator('#roomName')).toHaveText('Dudes Zimmer');
  await page.evaluate(() => window.house.player.group.position.set(4.3, 4.6, 4.55));   // top of the attic stairs
  await expect(page.locator('#actBtn')).toHaveText('Go downstairs');
  await page.locator('#actBtn').click();
  await expect(page.locator('#floorName')).toHaveText('Obergeschoss');
  expect(await page.evaluate(() => window.house.world.attic.visible)).toBe(false);
});

const { test, expect } = require('@playwright/test');

test('soccer page loads', async ({ page }) => {
  await page.goto('/soccer/');
  await expect(page).toHaveTitle(/soccer/i);
});

test('kickoff positions the ball at center with both players symmetric', async ({ page }) => {
  await page.goto('/soccer/');
  const state = await page.evaluate(() => window.__testGetState());
  expect(state.ball.x).toBeCloseTo(400, 0);
  expect(state.ball.y).toBeCloseTo(225, 0);
  expect(state.score1).toBe(0);
  expect(state.score2).toBe(0);
});

test('a ball hit toward the right goal mouth scores for the left (green) player', async ({ page }) => {
  await page.goto('/soccer/');

  await page.evaluate(() => {
    window.__testSetState({
      ball: { x: 750, y: 225, vx: 20, vy: 0 }
    });
  });
  // step the simulation forward deterministically until it crosses the line
  await page.evaluate(() => {
    for (let i = 0; i < 20; i++) window.__testStep(1);
  });

  const state = await page.evaluate(() => window.__testGetState());
  expect(state.score1).toBe(1);
});

test('a ball hit wide of the goal (outside the goal mouth) does not score and bounces back', async ({ page }) => {
  await page.goto('/soccer/');

  await page.evaluate(() => {
    window.__testSetState({
      ball: { x: 750, y: 50, vx: 20, vy: 0 } // far from goal mouth (center ~225, mouth is 165-285)
    });
  });
  await page.evaluate(() => {
    for (let i = 0; i < 20; i++) window.__testStep(1);
  });

  const state = await page.evaluate(() => window.__testGetState());
  expect(state.score1).toBe(0);
  expect(state.score2).toBe(0);
  expect(state.ball.x).toBeLessThanOrEqual(770); // bounced back off the end line
});

test('pressing kick near the ball sends it moving', async ({ page }) => {
  await page.goto('/soccer/');

  await page.evaluate(() => {
    window.__testSetState({
      p1: { x: 400, y: 225, facingX: 1, facingY: 0 },
      ball: { x: 410, y: 225, vx: 0, vy: 0 }
    });
    window.__testSetKeys({ ' ': true });
    window.__testStep(1);
  });

  const state = await page.evaluate(() => window.__testGetState());
  const speed = Math.hypot(state.ball.vx, state.ball.vy);
  expect(speed).toBeGreaterThan(1);
});

test('a player standing next to the ball with no kick pressed keeps it stuck to them (dribbling)', async ({ page }) => {
  await page.goto('/soccer/');

  await page.evaluate(() => {
    window.__testSetState({
      p1: { x: 400, y: 225, facingX: 1, facingY: 0 },
      ball: { x: 410, y: 225, vx: 5, vy: -3 } // give it some initial velocity to confirm it gets zeroed once possessed
    });
    for (let i = 0; i < 10; i++) window.__testStep(1); // no kick key pressed
  });

  const state = await page.evaluate(() => window.__testGetState());
  // ball should be resting just ahead of p1 in their facing direction, not drifting off with its old velocity
  expect(Math.abs(state.ball.x - (state.p1.x + 16))).toBeLessThan(2);
  expect(Math.abs(state.ball.y - state.p1.y)).toBeLessThan(2);
});

test('a moving player carries the ball along with them while dribbling', async ({ page }) => {
  await page.goto('/soccer/');

  await page.evaluate(() => {
    window.__testSetState({
      p1: { x: 200, y: 225, facingX: 1, facingY: 0 },
      ball: { x: 216, y: 225, vx: 0, vy: 0 }
    });
    window.__testSetKeys({ d: true }); // hold right, no kick
    for (let i = 0; i < 20; i++) window.__testStep(1);
    window.__testSetKeys({ d: false });
  });

  const state = await page.evaluate(() => window.__testGetState());
  expect(state.p1.x).toBeGreaterThan(240); // player has moved right substantially
  expect(Math.abs(state.ball.x - (state.p1.x + 16))).toBeLessThan(2); // ball followed along
});

test('the clock counts down and reaching zero in the 1st half triggers half time', async ({ page }) => {
  await page.goto('/soccer/');

  await page.evaluate(() => window.__testAdvanceClock(119)); // 1 second left of a 2-min half
  let state = await page.evaluate(() => window.__testGetState());
  expect(state.matchPhase).toBe('playing');

  await page.evaluate(() => window.__testAdvanceClock(2)); // pushes it past zero
  state = await page.evaluate(() => window.__testGetState());
  expect(state.matchPhase).toBe('halftime');
  await expect(page.locator('#status')).toHaveText(/half time/i);
});

test('starting the 2nd half swaps sides and resets the clock', async ({ page }) => {
  await page.goto('/soccer/');
  await page.evaluate(() => window.__testAdvanceClock(121)); // end the 1st half

  const beforeP1X = (await page.evaluate(() => window.__testGetState())).p1.x;
  await page.click('#resetBtn'); // now reads "Start 2nd Half"

  const state = await page.evaluate(() => window.__testGetState());
  expect(state.half).toBe(2);
  expect(state.sidesSwapped).toBe(true);
  expect(state.matchPhase).toBe('playing');
  expect(Math.round(state.matchTime)).toBe(120);
  // p1 should have started on the opposite side of the pitch
  expect(Math.sign(state.p1.x - 400)).not.toBe(Math.sign(beforeP1X - 400));
});

test('scoring attribution flips correctly after sides swap in the 2nd half', async ({ page }) => {
  await page.goto('/soccer/');
  await page.evaluate(() => window.__testAdvanceClock(121));
  await page.click('#resetBtn'); // starts 2nd half, sides now swapped

  // in the 2nd half, a ball scored in the RIGHT goal should now credit yellow (score2), not green
  await page.evaluate(() => {
    window.__testSetState({ ball: { x: 750, y: 225, vx: 20, vy: 0 } });
  });
  await page.evaluate(() => { for (let i = 0; i < 20; i++) window.__testStep(1); });

  const state = await page.evaluate(() => window.__testGetState());
  expect(state.score2).toBe(1);
  expect(state.score1).toBe(0);
});

test('reaching zero in the 2nd half ends the match with a final result', async ({ page }) => {
  await page.goto('/soccer/');
  await page.evaluate(() => window.__testAdvanceClock(121));
  await page.click('#resetBtn'); // start 2nd half

  await page.evaluate(() => window.__testAdvanceClock(121)); // end the 2nd half

  const state = await page.evaluate(() => window.__testGetState());
  expect(state.matchPhase).toBe('fulltime');
  expect(state.gameOver).toBe(true);
  await expect(page.locator('#status')).toHaveText(/full time/i);
});

test('changing half length before a match updates the starting clock', async ({ page }) => {
  await page.goto('/soccer/');
  await page.click('input[name="halfLength"][value="1"]');

  const state = await page.evaluate(() => window.__testGetState());
  expect(Math.round(state.matchTime)).toBe(60);
  await expect(page.locator('#clock')).toHaveText('1:00');
});

test('vs Computer mode moves the AI player toward the ball over time', async ({ page }) => {
  await page.goto('/soccer/');
  await page.click('input[name="mode"][value="cpu"]');

  await page.evaluate(() => {
    window.__testSetState({
      p2: { x: 700, y: 400, facingX: -1, facingY: 0 },
      ball: { x: 400, y: 225, vx: 0, vy: 0 }
    });
  });
  const before = (await page.evaluate(() => window.__testGetState())).p2;

  await page.evaluate(() => {
    for (let i = 0; i < 30; i++) window.__testStep(1);
  });
  const after = (await page.evaluate(() => window.__testGetState())).p2;

  const distBefore = Math.hypot(before.x - 400, before.y - 225);
  const distAfter = Math.hypot(after.x - 400, after.y - 225);
  expect(distAfter).toBeLessThan(distBefore);
});

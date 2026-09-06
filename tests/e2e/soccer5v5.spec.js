const { test, expect } = require('@playwright/test');

test('5v5 soccer page loads', async ({ page }) => {
  await page.goto('/soccer5v5/');
  await expect(page).toHaveTitle(/5v5 soccer/i);
});

test('kickoff sets up 4 outfielders plus a goalkeeper per team, ball centered', async ({ page }) => {
  await page.goto('/soccer5v5/');
  const state = await page.evaluate(() => window.__testGetState());
  expect(state.teamL.outfield).toHaveLength(4);
  expect(state.teamR.outfield).toHaveLength(4);
  expect(state.teamL.gk).toBeTruthy();
  expect(state.teamR.gk).toBeTruthy();
  expect(state.ball.x).toBeCloseTo(500, 0);
  expect(state.ball.y).toBeCloseTo(280, 0);
});

test('auto-switch moves control to whichever teammate is closest to the ball', async ({ page }) => {
  await page.goto('/soccer5v5/');

  await page.evaluate(() => {
    // move the ball right next to outfielder index 2 (an attacker)
    const state = window.__testGetState();
    const target = state.teamL.outfield[2];
    window.__testSetState({ ball: { x: target.x + 5, y: target.y, vx: 0, vy: 0 } });
    for (let i = 0; i < 10; i++) window.__testStep(1); // let auto-switch evaluate
  });

  const state = await page.evaluate(() => window.__testGetState());
  expect(state.teamL.activeIdx).toBe(2);
});

test('a ball hit into the right goal mouth scores for green (left team)', async ({ page }) => {
  await page.goto('/soccer5v5/');

  await page.evaluate(() => {
    // move both keepers well clear so this test purely checks scoring
    // mechanics, independent of the goalkeeper save mechanic tested
    // separately below
    window.__testSetState({
      teamL: { gk: { x: -500, y: -500 } },
      teamR: { gk: { x: -500, y: -500 } },
      ball: { x: 940, y: 280, vx: 20, vy: 0 }
    });
  });
  await page.evaluate(() => {
    for (let i = 0; i < 20; i++) window.__testStep(1);
  });

  const state = await page.evaluate(() => window.__testGetState());
  expect(state.score1).toBe(1);
});

test('vs Computer mode: AI team outfielders move over time (formation + presser both active)', async ({ page }) => {
  await page.goto('/soccer5v5/');
  await page.click('input[name="mode"][value="cpu"]');

  const before = (await page.evaluate(() => window.__testGetState())).teamR.outfield.map(p => ({ x: p.x, y: p.y }));

  await page.evaluate(() => {
    window.__testSetState({ ball: { x: 500, y: 280, vx: 0, vy: 0 } });
    for (let i = 0; i < 40; i++) window.__testStep(1);
  });

  const after = (await page.evaluate(() => window.__testGetState())).teamR.outfield.map(p => ({ x: p.x, y: p.y }));
  const anyMoved = before.some((p, i) => Math.hypot(p.x - after[i].x, p.y - after[i].y) > 1);
  expect(anyMoved).toBeTruthy();
});

test('goalkeepers track the ball vertically but stay near their own goal line', async ({ page }) => {
  await page.goto('/soccer5v5/');

  await page.evaluate(() => {
    window.__testSetState({ ball: { x: 500, y: 480, vx: 0, vy: 0 } }); // ball low on the pitch
    for (let i = 0; i < 30; i++) window.__testStep(1);
  });

  const state = await page.evaluate(() => window.__testGetState());
  // GK should have shifted toward the ball's Y but remain close to its home X (near the goal line)
  expect(state.teamL.gk.y).toBeGreaterThan(280);
  expect(state.teamL.gk.x).toBeLessThan(80); // stayed near the left goal line, didn't chase upfield
});

test('a player standing next to the ball with no kick pressed keeps it stuck to them (dribbling)', async ({ page }) => {
  await page.goto('/soccer5v5/');

  await page.evaluate(() => {
    const state = window.__testGetState();
    const p = state.teamL.outfield[0];
    window.__testSetState({
      teamL: { outfield: [{ x: p.x, y: p.y, facingX: 1, facingY: 0 }] },
      ball: { x: p.x + 10, y: p.y, vx: 6, vy: -2 }
    });
    for (let i = 0; i < 10; i++) window.__testStep(1);
  });

  const state = await page.evaluate(() => window.__testGetState());
  const p = state.teamL.outfield[0];
  expect(Math.abs(state.ball.x - (p.x + 16))).toBeLessThan(2);
  expect(Math.abs(state.ball.y - p.y)).toBeLessThan(2);
});

test('a moving player carries the ball along with them while dribbling (5v5)', async ({ page }) => {
  await page.goto('/soccer5v5/');

  await page.evaluate(() => {
    const state = window.__testGetState();
    const p = state.teamL.outfield[0];
    window.__testSetState({
      teamL: { outfield: [{ x: p.x, y: p.y, facingX: 1, facingY: 0 }] },
      ball: { x: p.x + 16, y: p.y, vx: 0, vy: 0 }
    });
    window.__testSetKeys({ d: true });
    for (let i = 0; i < 20; i++) window.__testStep(1);
    window.__testSetKeys({ d: false });
  });

  const state = await page.evaluate(() => window.__testGetState());
  const p = state.teamL.outfield[0];
  expect(Math.abs(state.ball.x - (p.x + 16))).toBeLessThan(2);
});

test('a shot aimed at the goalkeeper is saved rather than passing through', async ({ page }) => {
  await page.goto('/soccer5v5/');

  await page.evaluate(() => {
    const state = window.__testGetState();
    const gk = state.teamL.gk;
    // ball heading straight at the keeper, on target for goal
    window.__testSetState({ ball: { x: gk.x + 60, y: gk.y, vx: -9, vy: 0 } });
  });
  await page.evaluate(() => { for (let i = 0; i < 40; i++) window.__testStep(1); });

  const state = await page.evaluate(() => window.__testGetState());
  expect(state.score2).toBe(0); // right team did not score
});

test('a fast shot near the post beats a keeper who cannot track across in time', async ({ page }) => {
  await page.goto('/soccer5v5/');

  await page.evaluate(() => {
    // keeper stays at its normal home position (goal center, y=280) —
    // the shot targets near the top post (y=215, close to the goal-mouth
    // edge at 210) and is fast enough that the keeper (2 units/frame)
    // cannot cover the ~65-unit gap in the handful of frames available
    window.__testSetState({ ball: { x: 900, y: 215, vx: 25, vy: 0 } });
  });
  await page.evaluate(() => { for (let i = 0; i < 6; i++) window.__testStep(1); });

  const state = await page.evaluate(() => window.__testGetState());
  expect(state.score1).toBe(1);
});

test('the clock counts down and reaching zero in the 1st half triggers half time', async ({ page }) => {
  await page.goto('/soccer5v5/');

  await page.evaluate(() => window.__testAdvanceClock(119));
  let state = await page.evaluate(() => window.__testGetState());
  expect(state.matchPhase).toBe('playing');

  await page.evaluate(() => window.__testAdvanceClock(2));
  state = await page.evaluate(() => window.__testGetState());
  expect(state.matchPhase).toBe('halftime');
  await expect(page.locator('#status')).toHaveText(/half time/i);
});

test('starting the 2nd half swaps sides — teams regenerate on the opposite half of the pitch', async ({ page }) => {
  await page.goto('/soccer5v5/');
  const beforeGkX = (await page.evaluate(() => window.__testGetState())).teamL.gk.x;

  await page.evaluate(() => window.__testAdvanceClock(121));
  await page.click('#resetBtn');

  const state = await page.evaluate(() => window.__testGetState());
  expect(state.half).toBe(2);
  expect(state.sidesSwapped).toBe(true);
  expect(state.matchPhase).toBe('playing');
  expect(Math.round(state.matchTime)).toBe(120);
  // team L's goalkeeper should now be anchored near the opposite goal
  expect(Math.sign(state.teamL.gk.x - 500)).not.toBe(Math.sign(beforeGkX - 500));
});

test('scoring attribution flips correctly after sides swap in the 2nd half', async ({ page }) => {
  await page.goto('/soccer5v5/');
  await page.evaluate(() => window.__testAdvanceClock(121));
  await page.click('#resetBtn');

  await page.evaluate(() => {
    // move both keepers well clear — after the swap, team L's keeper now
    // guards the right goal, and a shot near x=940 would otherwise be
    // saved rather than testing what this test actually cares about
    window.__testSetState({
      teamL: { gk: { x: -500, y: -500 } },
      teamR: { gk: { x: -500, y: -500 } },
      ball: { x: 940, y: 280, vx: 20, vy: 0 }
    });
  });
  await page.evaluate(() => { for (let i = 0; i < 20; i++) window.__testStep(1); });

  const state = await page.evaluate(() => window.__testGetState());
  expect(state.score2).toBe(1);
  expect(state.score1).toBe(0);
});

test('reaching zero in the 2nd half ends the match with a final result', async ({ page }) => {
  await page.goto('/soccer5v5/');
  await page.evaluate(() => window.__testAdvanceClock(121));
  await page.click('#resetBtn');
  await page.evaluate(() => window.__testAdvanceClock(121));

  const state = await page.evaluate(() => window.__testGetState());
  expect(state.matchPhase).toBe('fulltime');
  expect(state.gameOver).toBe(true);
  await expect(page.locator('#status')).toHaveText(/full time/i);
});

test('New Match resets scores and formation positions', async ({ page }) => {
  await page.goto('/soccer5v5/');
  await page.evaluate(() => window.__testSetState({ score1: 2, score2: 1 }));
  await page.click('#resetBtn');

  const state = await page.evaluate(() => window.__testGetState());
  expect(state.score1).toBe(0);
  expect(state.score2).toBe(0);
});

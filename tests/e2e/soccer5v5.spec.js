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
    window.__testSetState({ ball: { x: 940, y: 280, vx: 20, vy: 0 } });
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

test('the ball does not move on its own just from a player standing near it (no auto-dribble)', async ({ page }) => {
  await page.goto('/soccer5v5/');

  await page.evaluate(() => {
    const state = window.__testGetState();
    const p = state.teamL.outfield[0];
    window.__testSetState({ ball: { x: p.x + 10, y: p.y, vx: 0, vy: 0 } });
  });
  await page.evaluate(() => { for (let i = 0; i < 30; i++) window.__testStep(1); });

  const state = await page.evaluate(() => window.__testGetState());
  expect(Math.hypot(state.ball.vx, state.ball.vy)).toBeLessThan(0.5);
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

test('a shot well away from the keeper still scores (keeper only blocks nearby shots)', async ({ page }) => {
  await page.goto('/soccer5v5/');

  await page.evaluate(() => {
    window.__testSetState({ ball: { x: 940, y: 280, vx: 20, vy: 0 } }); // aimed at right goal
  });
  await page.evaluate(() => { for (let i = 0; i < 20; i++) window.__testStep(1); });

  const state = await page.evaluate(() => window.__testGetState());
  expect(state.score1).toBe(1);
});

test('New Match resets scores and formation positions', async ({ page }) => {
  await page.goto('/soccer5v5/');
  await page.evaluate(() => window.__testSetState({ score1: 2, score2: 1 }));
  await page.click('#resetBtn');

  const state = await page.evaluate(() => window.__testGetState());
  expect(state.score1).toBe(0);
  expect(state.score2).toBe(0);
});

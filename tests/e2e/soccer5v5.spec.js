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

test('selecting League mode shows the fixtures panel and hides the pitch', async ({ page }) => {
  await page.goto('/soccer5v5/');
  await page.evaluate(() => window.__testClearLeagueSave());
  await page.reload();

  await page.click('input[name="mode"][value="league"]');

  await expect(page.locator('#leaguePanel')).toBeVisible();
  await expect(page.locator('#pitchWrap')).toBeHidden();
  const fixtureCount = await page.locator('.fixtureRow').count();
  expect(fixtureCount).toBe(5);
});

test('starting a league fixture applies that opponent\'s color and skill', async ({ page }) => {
  await page.goto('/soccer5v5/');
  await page.evaluate(() => window.__testClearLeagueSave());

  const teams = await page.evaluate(() => window.__testGetLeagueTeams());
  // team indices are 1-based in the league (0 is "Your Team")
  await page.evaluate(() => window.__testStartLeagueMatch(1));

  await expect(page.locator('#pitchWrap')).toBeVisible();
  const state = await page.evaluate(() => window.__testGetState());
  expect(state.teamR.color).toBe(teams[0].color);
  expect(state.teamR.skillKey).toBe(teams[0].skill);
  expect(state.teamR.name).toBe(teams[0].name);
  expect(state.leagueOpponent.index).toBe(1);
});

test('the schedule is a valid single round-robin: 6 teams, 5 rounds, everyone plays everyone once', async ({ page }) => {
  await page.goto('/soccer5v5/');
  const schedule = await page.evaluate(() => window.__testGetSchedule());

  expect(schedule).toHaveLength(5);
  expect(schedule.every(round => round.length === 3)).toBeTruthy();

  const pairings = new Set();
  const playCounts = Array(6).fill(0);
  schedule.forEach(round => round.forEach(([a, b]) => {
    pairings.add([a, b].sort().join('-'));
    playCounts[a]++; playCounts[b]++;
  }));
  expect(pairings.size).toBe(15); // every unique pair exactly once
  expect(playCounts.every(c => c === 5)).toBeTruthy();

  // you play exactly one match per round
  expect(schedule.every(round => round.filter(p => p.includes(0)).length === 1)).toBeTruthy();
});

test('completing a league match saves the result and offers to return to the league', async ({ page }) => {
  await page.goto('/soccer5v5/');
  await page.evaluate(() => window.__testClearLeagueSave());
  await page.evaluate(() => window.__testStartLeagueMatch(3));

  await page.evaluate(() => {
    window.__testSetState({
      teamL: { gk: { x: -500, y: -500 } },
      teamR: { gk: { x: -500, y: -500 } },
      ball: { x: 940, y: 280, vx: 20, vy: 0 }
    });
  });
  await page.evaluate(() => { for (let i = 0; i < 20; i++) window.__testStep(1); });
  // scoring triggers a 1400ms goal celebration during which the match is
  // paused — the clock advance is deliberately a no-op while paused, so
  // wait it out before trying to run the clock down
  await page.waitForTimeout(1600);
  await page.evaluate(() => window.__testAdvanceClock(121));
  await page.click('#resetBtn'); // 2nd half
  await page.evaluate(() => window.__testAdvanceClock(121)); // full time

  await expect(page.locator('#resetBtn')).toHaveText('Back to League');

  const save = await page.evaluate(() => window.__testGetLeagueSave());
  const round = await page.evaluate(() => window.__testRoundForOpponent(3));
  expect(save.played).toContain(round);
  // all 3 matches from that round should be recorded: yours plus 2 simulated
  const roundKeys = Object.keys(save.results).filter(k => k.startsWith(`${round}-`));
  expect(roundKeys).toHaveLength(3);

  // your own result should be a 1-0 win, oriented correctly regardless of
  // whether the schedule listed you as home or away
  const yourMatch = roundKeys.map(k => save.results[k]).find(r => r.home === 0 || r.away === 0);
  const yourGoals = yourMatch.home === 0 ? yourMatch.hg : yourMatch.ag;
  const oppGoals = yourMatch.home === 0 ? yourMatch.ag : yourMatch.hg;
  expect(yourGoals).toBe(1);
  expect(oppGoals).toBe(0);

  await page.click('#resetBtn');
  await expect(page.locator('#leaguePanel')).toBeVisible();
  const fixtureResult = await page.locator('.fixtureRow').nth(round).locator('.result').textContent();
  expect(fixtureResult).toContain('W');
});

test('after one round every team in the table has played exactly one match', async ({ page }) => {
  await page.goto('/soccer5v5/');
  await page.evaluate(() => window.__testClearLeagueSave());
  await page.evaluate(() => window.__testStartLeagueMatch(1));

  await page.evaluate(() => {
    window.__testSetState({
      teamL: { gk: { x: -500, y: -500 } },
      teamR: { gk: { x: -500, y: -500 } }
    });
  });
  await page.evaluate(() => window.__testAdvanceClock(121));
  await page.click('#resetBtn');
  await page.evaluate(() => window.__testAdvanceClock(121));

  const standings = await page.evaluate(() => window.__testGetStandings());
  expect(standings).toHaveLength(6);
  // the AI-vs-AI matches from this round were simulated too, so every team
  // — not just yours and your opponent's — should show one match played
  expect(standings.every(r => r.p === 1)).toBeTruthy();
  // points awarded must be consistent: 3 for a win, 2 shared for a draw
  const totalPts = standings.reduce((s, r) => s + r.pts, 0);
  expect(totalPts).toBeGreaterThanOrEqual(6);
  expect(totalPts).toBeLessThanOrEqual(9);
  // goals scored must balance goals conceded across the whole table
  const gf = standings.reduce((s, r) => s + r.gf, 0);
  const ga = standings.reduce((s, r) => s + r.ga, 0);
  expect(gf).toBe(ga);
});

test('New Season clears saved results and resets the fixture list', async ({ page }) => {
  await page.goto('/soccer5v5/');
  await page.evaluate(() => window.__testClearLeagueSave());
  await page.evaluate(() => {
    window.__testStartLeagueMatch(1);
  });
  await page.evaluate(() => {
    window.__testSetState({
      teamL: { gk: { x: -500, y: -500 } },
      teamR: { gk: { x: -500, y: -500 } },
      ball: { x: 940, y: 280, vx: 20, vy: 0 }
    });
  });
  await page.evaluate(() => { for (let i = 0; i < 20; i++) window.__testStep(1); });
  // wait out the goal celebration pause — see note in the test above
  await page.waitForTimeout(1600);
  await page.evaluate(() => window.__testAdvanceClock(121));
  await page.click('#resetBtn');
  await page.evaluate(() => window.__testAdvanceClock(121));
  await page.click('#resetBtn'); // back to league panel

  let save = await page.evaluate(() => window.__testGetLeagueSave());
  expect(Object.keys(save.results).length).toBeGreaterThan(0);
  expect(save.played.length).toBeGreaterThan(0);

  await page.click('#newSeasonBtn');
  save = await page.evaluate(() => window.__testGetLeagueSave());
  expect(Object.keys(save.results).length).toBe(0);
  expect(save.played.length).toBe(0);
  const buttonCount = await page.locator('.fixtureRow button').count();
  expect(buttonCount).toBe(5); // all fixtures playable again
});

test('a goalkeeper holding a stationary ball auto-clears it after roughly 1.3 seconds', async ({ page }) => {
  await page.goto('/soccer5v5/');

  await page.evaluate(() => {
    const state = window.__testGetState();
    const gk = state.teamL.gk;
    window.__testSetState({ ball: { x: gk.x + 5, y: gk.y, vx: 0, vy: 0 } });
  });

  // step through ~1 second — should still be holding, not yet cleared
  await page.evaluate(() => { for (let i = 0; i < 60; i++) window.__testStep(1); });
  let state = await page.evaluate(() => window.__testGetState());
  const ballSpeedMidway = Math.hypot(state.ball.vx, state.ball.vy);
  expect(ballSpeedMidway).toBeLessThan(1);

  // step past ~1.3 seconds total — should have auto-cleared by now
  await page.evaluate(() => { for (let i = 0; i < 40; i++) window.__testStep(1); });
  state = await page.evaluate(() => window.__testGetState());
  const ballSpeedAfter = Math.hypot(state.ball.vx, state.ball.vy);
  expect(ballSpeedAfter).toBeGreaterThan(3);
});

test('pressing kick clears your own keeper immediately, without waiting for the auto-clear timer', async ({ page }) => {
  await page.goto('/soccer5v5/');

  await page.evaluate(() => {
    const state = window.__testGetState();
    const gk = state.teamL.gk;
    window.__testSetState({ ball: { x: gk.x + 5, y: gk.y, vx: 0, vy: 0 } });
  });

  // a couple of frames to register as "holding", then press kick — well
  // before the ~1.3s auto-clear would normally fire
  await page.evaluate(() => { for (let i = 0; i < 10; i++) window.__testStep(1); });
  await page.evaluate(() => {
    window.__testSetKeys({ ' ': true });
    window.__testStep(1);
    window.__testSetKeys({ ' ': false });
  });

  const state = await page.evaluate(() => window.__testGetState());
  expect(Math.hypot(state.ball.vx, state.ball.vy)).toBeGreaterThan(3);
});

test('a goalkeeper does not hold a fast-moving ball', async ({ page }) => {
  await page.goto('/soccer5v5/');

  await page.evaluate(() => {
    const state = window.__testGetState();
    const gk = state.teamR.gk;
    window.__testSetState({ ball: { x: gk.x - 5, y: gk.y, vx: -15, vy: 0 } });
  });
  await page.evaluate(() => { for (let i = 0; i < 5; i++) window.__testStep(1); });

  const state = await page.evaluate(() => window.__testGetState());
  expect(state.teamR.gk.holding).toBe(false);
});

test('New Match resets scores and formation positions', async ({ page }) => {
  await page.goto('/soccer5v5/');
  await page.evaluate(() => window.__testSetState({ score1: 2, score2: 1 }));
  await page.click('#resetBtn');

  const state = await page.evaluate(() => window.__testGetState());
  expect(state.score1).toBe(0);
  expect(state.score2).toBe(0);
});

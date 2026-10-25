const { test, expect } = require('@playwright/test');

// Connect 4 and Tic-Tac-Toe on two phones: two browser contexts (each with its own storage and sign-in) play
// each other through a stand-in for the database that lives here in the test, so the real one is never touched.
// The stand-in keeps the data as the database would; it doesn't check the security rules
// (battleships/database.rules.json), which only the real database can (tests/duels/rules-live.mjs).

function fakeDatabase() {
  let data = {}, uids = 0;
  const parts = path => path.split('/').filter(Boolean);
  const stamp = v => (v && typeof v === 'object' ? (v['.sv'] === 'timestamp' ? Date.now() : Object.fromEntries(Object.entries(v).map(([k, x]) => [k, stamp(x)]))) : v);
  const get = path => parts(path).reduce((node, k) => (node && typeof node === 'object' ? node[k] : undefined), data);
  function set(path, value) {
    const keys = parts(path);
    if (!keys.length) { data = value || {}; return; }
    let node = data;
    for (const k of keys.slice(0, -1)) { node[k] = node[k] && typeof node[k] === 'object' ? node[k] : {}; node = node[k]; }
    if (value === null || value === undefined) delete node[keys[keys.length - 1]];
    else node[keys[keys.length - 1]] = value;
  }
  return {
    get: path => JSON.parse(JSON.stringify(get(path) ?? null)),
    async attach(context) {
      const uid = `user${++uids}`;
      await context.exposeBinding('__fakeDb', (source, op, path, value) => {
        if (op === 'uid') return uid;
        if (op === 'get') return JSON.parse(JSON.stringify(get(path) ?? null));
        if (op === 'put') { set(path, stamp(value)); return null; }
        if (op === 'patch') { for (const [k, v] of Object.entries(value)) set(`${path}/${k}`, stamp(v)); return null; }
        if (op === 'remove') { set(path, null); return null; }
        return null;
      });
      await context.addInitScript(() => {
        const call = (...args) => window.__fakeDb(...args);
        window.__gameZoneFakeDb = {
          uid: () => call('uid'),
          get: path => call('get', path),
          put: (path, value) => call('put', path, value),
          patch: (path, value) => call('patch', path, value),
          remove: path => call('remove', path),
          listen(path, onValue, onState = () => {}) {
            let last, stopped = false;
            (async function tick() {
              if (stopped) return;
              const value = await call('get', path);
              const json = JSON.stringify(value);
              if (json !== last) { last = json; onState('live'); onValue(value); }
              setTimeout(tick, 80);
            })();
            return () => { stopped = true; };
          },
        };
      });
    },
  };
}

/** Two phones with the game open and the Two phones panel showing. */
async function twoPhones(browser, path) {
  const db = fakeDatabase();
  const phones = [];
  for (let k = 0; k < 2; k++) {
    const context = await browser.newContext();
    await db.attach(context);
    const page = await context.newPage();
    await page.goto(path);
    await page.check('input[name="mode"][value="online"]');
    phones.push(page);
  }
  return { db, phones };
}
/** P starts a game, Dude joins it with the code. */
async function startAndJoin([p, dude]) {
  await p.fill('#duelName', 'P');
  await p.click('[data-do="start"]');
  const code = (await p.locator('#duelBigCode').textContent()).trim();
  expect(code).toMatch(/^[A-HJ-NP-Z2-9]{4}$/);
  await dude.fill('#duelName', 'Dude');
  await dude.fill('#duelCode', code.toLowerCase());
  await dude.click('[data-do="join"]');
  return code;
}

test('Connect 4 on two phones: start, join, take turns, win, play again', async ({ browser }) => {
  const { db, phones: [p, dude] } = await twoPhones(browser, '/connect4/');
  await expect(p.locator('#board')).toBeHidden();
  const code = await startAndJoin([p, dude]);
  await expect(p.locator('#status')).toHaveText('Your turn (Red)');
  await expect(dude.locator('#status')).toHaveText('P\'s turn (Red)…');
  await expect(dude.locator('#duelRoom')).toHaveText(code);

  const col = (page, c) => page.locator('#board .col').nth(c).click();
  await col(dude, 3);   // not Dude's turn: nothing happens
  await expect.poll(() => db.get(`duels/${code}/count`)).toBe(0);
  for (const [page, c, after] of [[p, 0, 1], [dude, 1, 2], [p, 0, 3], [dude, 1, 4], [p, 0, 5], [dude, 1, 6], [p, 0, 7]]) {
    await col(page, c);
    await expect.poll(() => db.get(`duels/${code}/count`)).toBe(after);
  }
  await expect(p.locator('#status')).toHaveText('You win! 🎉');
  await expect(dude.locator('#status')).toHaveText('P wins!');
  expect(await dude.evaluate(() => window.__testGetBoard()[5][0])).toBe('R');

  await dude.click('#resetBtn');   // Play again: Dude goes first this time
  await expect(dude.locator('#status')).toHaveText('Your turn (Yellow)');
  await expect(p.locator('#status')).toHaveText('Dude\'s turn (Yellow)…');
  expect(await p.evaluate(() => window.__testGetBoard().flat().filter(Boolean).length)).toBe(0);
});

test('a reload carries on, a wrong code is turned away, and leaving tells the other phone', async ({ browser }) => {
  const { phones: [p, dude] } = await twoPhones(browser, '/connect4/');
  await startAndJoin([p, dude]);
  await p.locator('#board .col').nth(2).click();
  await expect(dude.locator('#status')).toHaveText('Your turn (Yellow)');

  await dude.reload();
  await dude.check('input[name="mode"][value="online"]');
  await expect(dude.locator('#status')).toHaveText('Your turn (Yellow)');
  expect(await dude.evaluate(() => window.__testGetBoard()[5][2])).toBe('R');

  await dude.click('[data-do="leave"]');
  await expect(p.locator('#duel')).toContainText('Dude has left the game');
  await expect(dude.locator('#duelCode')).toBeVisible();
  await dude.fill('#duelCode', 'ZZZZ');
  await dude.click('[data-do="join"]');
  await expect(dude.locator('#duel .error')).toHaveText('There\'s no game ZZZZ: check the code');
});

test('a Tic-Tac-Toe code doesn\'t open in Connect 4; Tic-Tac-Toe plays on two phones', async ({ browser }) => {
  const { phones: [p, dude] } = await twoPhones(browser, '/tictactoe/');
  const code = await startAndJoin([p, dude]);
  await expect(p.locator('#status')).toHaveText('Your turn (X)');
  const cell = (page, i) => page.locator('#board .cell').nth(i).click();
  await expect(dude.locator('#board .cell').nth(4)).toBeDisabled();   // not Dude's turn
  for (const [page, i] of [[p, 0], [dude, 3], [p, 1], [dude, 4], [p, 2]]) {
    await cell(page, i);
    await expect(page.locator('#board .cell').nth(i)).not.toHaveText('');
  }
  await expect(p.locator('#status')).toHaveText('You win! 🎉');
  await expect(dude.locator('#status')).toHaveText('P wins!');
  await expect(dude.locator('#board .cell.win')).toHaveCount(3);

  // the same code typed into Connect 4 (on a third phone)
  const c4 = await dude.context().newPage();
  await c4.goto('/connect4/');
  await c4.check('input[name="mode"][value="online"]');
  await c4.fill('#duelName', 'Mum');
  await c4.fill('#duelCode', code);
  await c4.click('[data-do="join"]');
  await expect(c4.locator('#duel .error')).toHaveText(`${code} is a game of Tic-Tac-Toe`);
});

test('without the internet: Two phones is greyed out, and one device still plays', async ({ page, context }) => {
  await page.goto('/connect4/');
  await context.setOffline(true);
  await expect(page.locator('input[name="mode"][value="online"]')).toBeDisabled();
  await page.locator('#board .col').nth(0).click();
  expect(await page.evaluate(() => window.__testGetBoard()[5][0])).toBe('R');
  await context.setOffline(false);
  await expect(page.locator('input[name="mode"][value="online"]')).toBeEnabled();
});

test('Play on one phone instead goes back to 2 Player', async ({ page }) => {
  await page.goto('/tictactoe/');
  await page.check('input[name="mode"][value="online"]');
  await page.click('[data-do="exit"]');
  await expect(page.locator('input[name="mode"][value="2p"]')).toBeChecked();
  await expect(page.locator('#duel')).toBeHidden();
  await expect(page.locator('#board')).toBeVisible();
  await expect(page.locator('#status')).toHaveText('X\'s turn');
});

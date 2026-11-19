const { test, expect } = require('@playwright/test');

// Battleships on two devices: two browser contexts (two phones, each with its own storage and sign-in) play
// each other through a stand-in for the database that lives here in the test, so the real one is never touched.
// The stand-in keeps the data as the database would (paths, server timestamps); it doesn't check the security
// rules (battleships/database.rules.json), which only the real database can, apart from one (see attach).

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
    set: (path, value) => set(path, JSON.parse(JSON.stringify(value))),
    async attach(context) {
      const uid = `user${++uids}`;
      await context.exposeBinding('__fakeDb', (source, op, path, value) => {
        if (op === 'uid') return uid;
        if (op === 'get') return JSON.parse(JSON.stringify(get(path) ?? null));
        // the one rule the stand-in keeps: a resign and a rematch code are written once (as the real rules say)
        if (op === 'put' && /\/(next|resigned)$/.test(path) && get(path) !== undefined) throw new Error('Permission denied');
        // and (#178) only a phone that can play salvo (v: 2) joins a salvo room
        if (op === 'put' && /^rooms\/[^/]+\/b$/.test(path) && get(path.replace(/\/b$/, '/variant')) === 'salvo' && !(value && value.v === 2)) throw new Error('Permission denied');
        if (op === 'put') { set(path, stamp(value)); return null; }
        if (op === 'patch') { for (const [k, v] of Object.entries(value)) set(`${path}/${k}`, stamp(v)); return null; }
        if (op === 'remove') { set(path, null); return null; }
        return null;
      });
      await context.addInitScript(() => {
        const call = (...args) => window.__fakeDb(...args);
        window.__battleshipsFakeDb = {
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
        // no drawing (headless WebGL is slow), as in battleships.spec.js
        let game;
        Object.defineProperty(window, 'battleships', {
          configurable: true, get: () => game,
          set: value => { game = value; game.world.stage.renderer.render = () => {}; },
        });
      });
    },
  };
}

// P's fleet down the left, Dude's down the right: every square of each is known
const LEFT = [
  { id: 'carrier', x: 0, y: 0, dir: 'h' }, { id: 'battleship', x: 0, y: 2, dir: 'h' }, { id: 'cruiser', x: 0, y: 4, dir: 'h' },
  { id: 'submarine', x: 0, y: 6, dir: 'h' }, { id: 'destroyer', x: 0, y: 8, dir: 'h' },
];
const RIGHT = LEFT.map(s => ({ ...s, x: 9 - (s.id === 'carrier' ? 4 : s.id === 'battleship' ? 3 : s.id === 'destroyer' ? 1 : 2) }));

const ready = page => expect.poll(() => page.evaluate(() => window.battleships.mode === 'aiming' && !window.battleships.busy), { timeout: 20000 }).toBe(true);
async function fireAt(page, x, y) {
  await ready(page);
  const p = await page.evaluate(([x, y]) => window.battleships.world.screenOf('target', x, y), [x, y]);
  await page.mouse.click(p.x, p.y);
  await page.click('#fireBtn');
}
/** A salvo: tap each square, then Fire salvo. */
async function fireSalvo(page, squares) {
  await ready(page);
  for (const [x, y] of squares) {
    const p = await page.evaluate(([x, y]) => window.battleships.world.screenOf('target', x, y), [x, y]);
    await page.mouse.click(p.x, p.y);
  }
  await expect(page.locator('#fireBtn')).toHaveText(`Fire salvo (${squares.length}/${squares.length})`);
  await page.click('#fireBtn');
}
const shotsSeen = page => page.evaluate(() => window.battleships.state.shots.map(s => s.length));

/** Two phones in one game: P starts it, Dude joins with the link, both place their fleets. */
async function twoPhones(browser, db, { variant = 'classic' } = {}) {
  const phones = [];
  for (let i = 0; i < 2; i++) {
    const context = await browser.newContext();
    await db.attach(context);
    phones.push({ context, page: await context.newPage() });
  }
  const [p, dude] = phones.map(x => x.page);
  await p.goto('/battleships/?speed=8');
  await p.fill('#onlineName', 'P');
  if (variant === 'salvo') await p.click('[data-variant="salvo"]');
  await p.click('#hostBtn');
  await expect(p.locator('#lobby')).toBeVisible();
  const code = (await p.locator('#lobbyCode').textContent()).trim();
  expect(code).toMatch(/^[A-HJ-NP-Z2-9]{4}$/);

  await dude.goto(`/battleships/?speed=8&join=${code}`);
  await expect(dude.locator('#joinCode')).toHaveValue(code);
  await dude.fill('#onlineName', 'Dude');
  await dude.click('#joinBtn');

  for (const [page, fleet] of [[p, LEFT], [dude, RIGHT]]) {
    await expect.poll(() => page.evaluate(() => window.battleships.mode)).toBe('placing');
    await page.evaluate(f => window.battleships.test.setDraft(f), fleet);
  }
  await expect(p.locator('#lobby')).toBeHidden();
  await p.click('#readyBtn');
  await expect(p.locator('#statusText')).toHaveText('Waiting for Dude to place their fleet…');
  await dude.click('#readyBtn');
  return { p, dude, code, phones };
}

test('two phones: start with a code, join, place, and take turns', async ({ browser }) => {
  const db = fakeDatabase();
  const { p, dude, code, phones } = await twoPhones(browser, db);

  // the fleets never go to the database, only their fingerprints
  const room = db.get(`rooms/${code}`);
  expect(room.a.name).toBe('P');
  expect(room.b.name).toBe('Dude');
  expect(room.a.hash).toMatch(/^[0-9a-f]{64}$/);
  expect(JSON.stringify(room)).not.toContain('carrier');

  // P goes first and hits Dude's carrier (top right), Dude's device answers
  await expect(dude.locator('#statusText')).toHaveText(/P's turn/);
  await fireAt(p, 5, 0);
  await expect.poll(() => db.get(`rooms/${code}/results/0`)).toEqual({ r: 'hit' });
  await expect.poll(() => shotsSeen(p)).toEqual([1, 0]);
  await expect.poll(() => shotsSeen(dude)).toEqual([0, 1]);

  // then Dude fires and misses
  await fireAt(dude, 9, 9);
  await expect.poll(() => db.get(`rooms/${code}/results/1`)).toEqual({ r: 'miss' });
  await expect.poll(() => shotsSeen(p)).toEqual([1, 1]);
  await ready(p);

  // Dude's phone reloads: it carries on in the same seat, with everything so far
  await dude.reload();
  await expect(dude.locator('#resumeWhat')).toHaveText(new RegExp(`code ${code}`));
  await dude.click('#resumeBtn');
  await expect.poll(() => shotsSeen(dude)).toEqual([1, 1]);
  await expect(dude.locator('#statusText')).toHaveText(/P's turn/);
  for (const ph of phones) await ph.context.close();
});

test('two phones: the last ship sinks on both, and each checks the other\'s answers', async ({ browser }) => {
  const rules = await import('../../battleships/js/rules.js');
  const db = fakeDatabase();
  const { p, dude, code, phones } = await twoPhones(browser, db);
  await ready(p);

  // fast-forward: P has hit every square of Dude's fleet but one, Dude has missed every time
  const targets = RIGHT.flatMap(rules.cells), last = targets.pop();
  const water = [];
  for (let y = 0; y < 10; y++) for (let x = 0; x < 10; x++) if (x >= 5 && x <= 7) water.push([x, y]);   // between the fleets
  const room = db.get(`rooms/${code}`), mine = [];
  room.shots = {}; room.results = {};
  targets.forEach(([x, y], i) => {
    const hit = rules.resolveShot(RIGHT, mine, x, y);
    mine.push(hit);
    room.shots[2 * i] = { by: 'a', x, y };
    room.results[2 * i] = hit.result === 'sunk' ? { r: 'sunk', ship: hit.ship } : { r: hit.result };
    room.shots[2 * i + 1] = { by: 'b', x: water[i][0], y: water[i][1] };
    room.results[2 * i + 1] = { r: 'miss' };
  });
  room.n = targets.length * 2;
  db.set(`rooms/${code}`, room);
  for (const page of [p, dude]) { await page.reload(); await page.click('#resumeBtn'); }

  await fireAt(p, ...last);
  for (const [page, title] of [[p, 'You won! 🎉'], [dude, 'P won']]) {
    await expect(page.locator('#over')).toBeVisible({ timeout: 20000 });
    await expect(page.locator('#overTitle')).toHaveText(title);
  }
  await expect(p.locator('#overCheck')).toHaveText('✓ Dude\'s fleet matches every answer they gave.', { timeout: 10000 });
  await expect(dude.locator('#overCheck')).toHaveText('✓ P\'s fleet matches every answer they gave.', { timeout: 10000 });
  expect(Object.keys(db.get(`rooms/${code}/reveal`)).sort()).toEqual(['a', 'b']);
  // the game is over: nothing to carry on with
  await p.click('#overMenuBtn');
  await expect(p.locator('#resumeBtn')).toBeHidden();
  for (const ph of phones) await ph.context.close();
});

test('two phones: a wrong answer is caught at the end', async ({ browser }) => {
  const rules = await import('../../battleships/js/rules.js');
  const db = fakeDatabase();
  const { p, dude, code, phones } = await twoPhones(browser, db);
  await ready(p);
  // Dude's side "answered" P's first shot as a miss, though it hit the carrier
  const targets = RIGHT.flatMap(rules.cells), last = targets.pop(), mine = [];
  const room = db.get(`rooms/${code}`);
  room.shots = {}; room.results = {};
  targets.forEach(([x, y], i) => {
    const hit = rules.resolveShot(RIGHT, mine, x, y);
    mine.push(hit);
    room.shots[2 * i] = { by: 'a', x, y };
    room.results[2 * i] = i === 0 ? { r: 'miss' } : hit.result === 'sunk' ? { r: 'sunk', ship: hit.ship } : { r: hit.result };
    room.shots[2 * i + 1] = { by: 'b', x: 5 + Math.floor(i / 10), y: i % 10 };
    room.results[2 * i + 1] = { r: 'miss' };
  });
  room.n = targets.length * 2;
  db.set(`rooms/${code}`, room);
  for (const page of [p, dude]) { await page.reload(); await page.click('#resumeBtn'); }
  await fireAt(p, ...last);
  await expect(p.locator('#over')).toBeVisible({ timeout: 20000 });
  await expect(p.locator('#overCheck')).toHaveText(/⚠ Something doesn't add up: the answer to your shot 1 was wrong/, { timeout: 10000 });
  for (const ph of phones) await ph.context.close();
});

test('two phones: old rooms this phone was in are tidied away, games still going are not', async ({ browser }) => {
  const db = fakeDatabase();
  const DAY = 24 * 60 * 60 * 1000, now = Date.now();
  const room = (created, seen, extra = {}) => ({ created, n: 0, a: { uid: 'someone', name: 'P', seen }, ...extra });
  db.set('rooms/OLD2', room(now - 2 * DAY, now - 2 * DAY));                                  // nobody joined, two days ago
  db.set('rooms/SLW3', room(now - 3 * DAY, now - DAY, { b: { uid: 'x', name: 'D', seen: now - 60000 } }));   // a slow game, played a minute ago
  db.set('rooms/NEW4', room(now - 60000, now - 60000));                                       // started a minute ago
  const context = await browser.newContext();
  await db.attach(context);
  await context.addInitScript(() => {
    if (!sessionStorage.getItem('seeded')) {
      sessionStorage.setItem('seeded', '1');
      localStorage.setItem('battleships.rooms.v1', JSON.stringify(['OLD2', 'SLW3', 'NEW4', 'GON5']));
    }
  });
  const page = await context.newPage();
  await page.goto('/battleships/?speed=8');
  // a page that never plays on two devices never touches the database
  await page.waitForTimeout(300);
  expect(db.get('rooms/OLD2')).not.toBeNull();

  await page.fill('#onlineName', 'P');
  await page.click('#hostBtn');
  await expect(page.locator('#lobby')).toBeVisible();
  const code = (await page.locator('#lobbyCode').textContent()).trim();
  await expect.poll(() => db.get('rooms/OLD2')).toBeNull();
  expect(db.get('rooms/SLW3')).not.toBeNull();
  expect(db.get('rooms/NEW4')).not.toBeNull();
  expect(db.get(`rooms/${code}`)).not.toBeNull();
  // forgotten: the deleted one and the one already gone; remembered: the ones still in use, and the new one
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('battleships.rooms.v1')).sort()))
    .toEqual(['NEW4', 'SLW3', code].sort());
  await context.close();
});

test('two phones: resign from the menu, the other player wins and the fleets are still checked', async ({ browser }) => {
  const db = fakeDatabase();
  const { p, dude, code, phones } = await twoPhones(browser, db);
  await fireAt(p, 5, 0);
  await expect.poll(() => shotsSeen(dude)).toEqual([0, 1]);

  // Dude opens the menu: no "Leave" (P would be left waiting), a resign that needs two taps
  await expect.poll(() => dude.evaluate(() => window.battleships.mode)).toBe('aiming');
  await dude.click('#menuBtn');
  await expect(dude.locator('#leaveBtn')).toBeHidden();
  await expect(dude.locator('#resignBtn')).toHaveText('Resign (P wins)');
  await dude.click('#resignBtn');
  await expect(dude.locator('#resignBtn')).toHaveText('Tap again to resign');
  expect(db.get(`rooms/${code}/resigned`)).toBeNull();
  await dude.click('#resignBtn');
  await expect.poll(() => db.get(`rooms/${code}/resigned`)).toBe('b');

  await expect(p.locator('#over')).toBeVisible({ timeout: 20000 });
  await expect(p.locator('#overTitle')).toHaveText('You won! 🎉');
  await expect(p.locator('#overText')).toHaveText('Dude resigned.');
  await expect(dude.locator('#over')).toBeVisible({ timeout: 20000 });
  await expect(dude.locator('#overTitle')).toHaveText('P won');
  await expect(dude.locator('#overText')).toHaveText('You resigned.');
  // both fleets come out and each answer is checked, as at any end
  await expect(p.locator('#overCheck')).toHaveText('✓ Dude\'s fleet matches every answer they gave.', { timeout: 10000 });
  await expect(dude.locator('#overCheck')).toHaveText('✓ P\'s fleet matches every answer they gave.', { timeout: 10000 });
  for (const ph of phones) await ph.context.close();
});

test('two phones: resign while the other player is still placing their fleet', async ({ browser }) => {
  const db = fakeDatabase();
  const phones = [];
  for (let i = 0; i < 2; i++) { const context = await browser.newContext(); await db.attach(context); phones.push({ context, page: await context.newPage() }); }
  const [p, dude] = phones.map(x => x.page);
  await p.goto('/battleships/?speed=8');
  await p.fill('#onlineName', 'P');
  await p.click('#hostBtn');
  await expect(p.locator('#lobbyCode')).toHaveText(/^[A-HJ-NP-Z2-9]{4}$/);
  const code = (await p.locator('#lobbyCode').textContent()).trim();
  await dude.goto(`/battleships/?speed=8&join=${code}`);
  await dude.fill('#onlineName', 'Dude');
  await dude.click('#joinBtn');
  await expect.poll(() => p.evaluate(() => window.battleships.mode)).toBe('placing');
  await p.click('#readyBtn');
  await expect(p.locator('#statusText')).toHaveText('Waiting for Dude to place their fleet…');

  await p.click('#menuBtn');
  await p.click('#resignBtn');
  await p.click('#resignBtn');
  await expect(dude.locator('#over')).toBeVisible({ timeout: 20000 });
  await expect(dude.locator('#overTitle')).toHaveText('You won! 🎉');
  await expect(dude.locator('#overText')).toHaveText('P resigned.');
  await expect(p.locator('#overText')).toHaveText('You resigned.', { timeout: 20000 });
  // Dude never placed a fleet, so there's nothing of Dude's to check
  await expect(p.locator('#overCheck')).toBeHidden();
  for (const ph of phones) await ph.context.close();
});

test('two phones: a rematch with the same player, no code to type', async ({ browser }) => {
  const db = fakeDatabase();
  const { p, dude, code, phones } = await twoPhones(browser, db);
  await ready(p);
  await p.click('#menuBtn');
  await p.click('#resignBtn');
  await p.click('#resignBtn');
  for (const page of [p, dude]) {
    await expect(page.locator('#over')).toBeVisible({ timeout: 20000 });
    await expect(page.locator('#rematchBtn')).toHaveText('Rematch');
  }

  // Dude asks first: a new room, its code in the old one, and P's phone offers to join it
  await dude.click('#rematchBtn');
  await expect.poll(() => db.get(`rooms/${code}/next`)).toMatch(/^[A-HJ-NP-Z2-9]{4}$/);
  const next = db.get(`rooms/${code}/next`);
  expect(next).not.toBe(code);
  expect(db.get(`rooms/${next}/a/name`)).toBe('Dude');
  await expect(dude.locator('#lobby')).toBeVisible();
  await expect(p.locator('#overRematch')).toHaveText('Dude wants a rematch!');
  await expect(p.locator('#rematchBtn')).toHaveText('Join the rematch');
  await p.click('#rematchBtn');

  // the same two, in the new room: Dude started it, so Dude goes first this time
  await expect.poll(() => db.get(`rooms/${next}/b/name`)).toBe('P');
  for (const [page, fleet] of [[p, LEFT], [dude, RIGHT]]) {
    await expect.poll(() => page.evaluate(() => window.battleships.mode)).toBe('placing');
    await page.evaluate(f => window.battleships.test.setDraft(f), fleet);
    await page.click('#readyBtn');
  }
  await ready(dude);
  await expect(p.locator('#statusText')).toHaveText(/Dude's turn/);
  for (const ph of phones) await ph.context.close();
});

test('two phones: both tap Rematch at once, and still end up in the same game', async ({ browser }) => {
  const db = fakeDatabase();
  const { p, dude, code, phones } = await twoPhones(browser, db);
  await ready(p);
  await dude.click('#menuBtn');
  await dude.click('#resignBtn');
  await dude.click('#resignBtn');
  for (const page of [p, dude]) await expect(page.locator('#rematchBtn')).toBeVisible({ timeout: 20000 });
  await Promise.all([p.click('#rematchBtn'), dude.click('#rematchBtn')]);
  await expect.poll(() => db.get(`rooms/${code}/next`)).toBeTruthy();
  const next = db.get(`rooms/${code}/next`);
  // whichever code got written, both phones end up placing in that room
  for (const page of [p, dude]) await expect.poll(() => page.evaluate(() => window.battleships.mode), { timeout: 20000 }).toBe('placing');
  await expect.poll(() => [db.get(`rooms/${next}/a`), db.get(`rooms/${next}/b`)].every(Boolean)).toBe(true);
  for (const ph of phones) await ph.context.close();
});

// ---------- Salvo on two phones (#178) ----------

test('two phones: Salvo — the joiner plays Salvo, a salvo is answered as a whole, a sunk ship means one shot fewer', async ({ browser }) => {
  const db = fakeDatabase();
  const { p, dude, code, phones } = await twoPhones(browser, db, { variant: 'salvo' });
  expect(db.get(`rooms/${code}/variant`)).toBe('salvo');
  expect(db.get(`rooms/${code}/b/v`)).toBe(2);
  await ready(p);
  await expect(p.locator('#statusText')).toHaveText('Your salvo: pick 5 targets');
  // P's five shells all land on Dude's carrier (top right): four hits and it sinks
  await fireSalvo(p, [[5, 0], [6, 0], [7, 0], [8, 0], [9, 0]]);
  await expect.poll(() => db.get(`rooms/${code}/n`)).toBe(5);
  await expect.poll(() => Object.keys(db.get(`rooms/${code}/results`) || {}).length).toBe(5);
  expect(db.get(`rooms/${code}/results/4`)).toEqual({ r: 'sunk', ship: { id: 'carrier', x: 5, y: 0, dir: 'h' } });
  expect(db.get(`rooms/${code}/sunk/b/carrier`)).toBe(true);
  await expect.poll(() => shotsSeen(p)).toEqual([5, 0]);
  await expect.poll(() => shotsSeen(dude)).toEqual([0, 5]);
  // Dude has four ships left: four shots
  await ready(dude);
  await expect(dude.locator('#statusText')).toHaveText('Your salvo: pick 4 targets');
  await expect(dude.locator('#fireBtn')).toHaveText('Fire salvo (0/4)');
  await fireSalvo(dude, [[9, 9], [8, 9], [7, 9], [6, 9]]);
  await expect.poll(() => db.get(`rooms/${code}/n`)).toBe(9);
  await expect.poll(() => shotsSeen(p)).toEqual([5, 4]);
  await ready(p);
  await expect(p.locator('#statusText')).toHaveText('Your salvo: pick 5 targets');
  for (const ph of phones) await ph.context.close();
});

test('two phones: Salvo — a win, the answers checked, and a rematch that stays Salvo', async ({ browser }) => {
  const db = fakeDatabase();
  const { p, dude, code, phones } = await twoPhones(browser, db, { variant: 'salvo' });
  await fireSalvo(p, [[5, 0], [6, 0], [7, 0], [8, 0], [9, 0]]);                 // the carrier
  await fireSalvo(dude, [[9, 9], [8, 9], [7, 9], [6, 9]]);
  await fireSalvo(p, [[6, 2], [7, 2], [8, 2], [9, 2], [7, 4]]);                 // the battleship, and a hit
  await fireSalvo(dude, [[5, 9], [9, 7], [8, 7]]);
  await fireSalvo(p, [[8, 4], [9, 4], [7, 6], [8, 6], [9, 6]]);                 // the cruiser and the submarine
  await fireSalvo(dude, [[7, 7]]);
  await fireSalvo(p, [[8, 8], [9, 8], [0, 9], [1, 9], [2, 9]]);                 // the destroyer with the second shell
  for (const [page, title] of [[p, 'You won! 🎉'], [dude, 'P won']]) {
    await expect(page.locator('#over')).toBeVisible({ timeout: 20000 });
    await expect(page.locator('#overTitle')).toHaveText(title);
  }
  await expect(p.locator('#overCheck')).toHaveText('✓ Dude\'s fleet matches every answer they gave.', { timeout: 10000 });
  await expect(dude.locator('#overCheck')).toHaveText('✓ P\'s fleet matches every answer they gave.', { timeout: 10000 });
  expect(db.get(`rooms/${code}/n`)).toBe(28);
  // a rematch: the new room is Salvo too
  await p.click('#rematchBtn');
  await expect.poll(() => db.get(`rooms/${code}/next`)).toMatch(/^[A-HJ-NP-Z2-9]{4}$/);
  const next = db.get(`rooms/${code}/next`);
  expect(db.get(`rooms/${next}/variant`)).toBe('salvo');
  await expect(dude.locator('#rematchBtn')).toHaveText('Join the rematch');
  await dude.click('#rematchBtn');
  await expect.poll(() => db.get(`rooms/${next}/b/v`)).toBe(2);
  for (const [page, fleet] of [[p, LEFT], [dude, RIGHT]]) {
    await expect.poll(() => page.evaluate(() => window.battleships.mode)).toBe('placing');
    await page.evaluate(f => window.battleships.test.setDraft(f), fleet);
    await page.click('#readyBtn');
  }
  await ready(p);
  await expect(p.locator('#statusText')).toHaveText('Your salvo: pick 5 targets');
  for (const ph of phones) await ph.context.close();
});

test('two phones: Salvo — a reload while a salvo waits for its answer', async ({ browser }) => {
  const db = fakeDatabase();
  const { p, dude, code, phones } = await twoPhones(browser, db, { variant: 'salvo' });
  await ready(p);
  await dude.close();                                                            // Dude's phone is away
  await fireSalvo(p, [[5, 0], [6, 0], [0, 9], [1, 9], [2, 9]]);
  await expect.poll(() => db.get(`rooms/${code}/n`)).toBe(5);
  await expect(p.locator('#statusText')).toHaveText(/Waiting for Dude to answer/);
  expect(await p.evaluate(() => window.battleships.mode)).not.toBe('aiming');
  const back = await phones[1].context.newPage();
  await back.goto('/battleships/?speed=8');
  await back.click('#resumeBtn');
  await expect.poll(() => Object.keys(db.get(`rooms/${code}/results`) || {}).length).toBe(5);
  await expect.poll(() => shotsSeen(p)).toEqual([5, 0]);
  await ready(back);
  await expect(back.locator('#statusText')).toHaveText('Your salvo: pick 5 targets');
  for (const ph of phones) await ph.context.close();
});

test('two phones: a phone that can\'t play Salvo online is kept out of a Salvo game', async ({ browser }) => {
  const db = fakeDatabase();
  const context = await browser.newContext();
  await db.attach(context);
  const p = await context.newPage();
  await p.goto('/battleships/?speed=8');
  await p.fill('#onlineName', 'P');
  await p.click('[data-variant="salvo"]');
  await p.click('#hostBtn');
  await expect(p.locator('#lobby')).toBeVisible();
  const code = (await p.locator('#lobbyCode').textContent()).trim();
  expect(db.get(`rooms/${code}/a/v`)).toBe(2);
  // an old phone writes its seat without v: refused, as the real rules do; nothing changes in the room
  const old = await browser.newContext();
  await db.attach(old);
  const oldPage = await old.newPage();
  await oldPage.goto('/battleships/?speed=8');
  const refused = await oldPage.evaluate(c => window.__battleshipsFakeDb.put(`rooms/${c}/b`, { uid: 'old', name: 'Old' }).then(() => false, () => true), code);
  expect(refused).toBe(true);
  expect(db.get(`rooms/${code}/b`)).toBe(null);
  await context.close(); await old.close();
});

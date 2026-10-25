const { test, expect } = require('@playwright/test');

// Battleships on two devices: two browser contexts (two phones, each with its own storage and sign-in) play
// each other through a stand-in for the database that lives here in the test, so the real one is never touched.
// The stand-in keeps the data as the database would (paths, server timestamps); it doesn't check the security
// rules (battleships/database.rules.json), which only the real database can.

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
const shotsSeen = page => page.evaluate(() => window.battleships.state.shots.map(s => s.length));

/** Two phones in one game: P starts it, Dude joins with the link, both place their fleets. */
async function twoPhones(browser, db) {
  const phones = [];
  for (let i = 0; i < 2; i++) {
    const context = await browser.newContext();
    await db.attach(context);
    phones.push({ context, page: await context.newPage() });
  }
  const [p, dude] = phones.map(x => x.page);
  await p.goto('/battleships/?speed=8');
  await p.fill('#onlineName', 'P');
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

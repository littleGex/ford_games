# Ford House: the elf arrives (#157) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A once-a-December mission for P or Dude: a parcel brings the elf's door and a letter (read on screen),
they fix the door in the hall and (the first year) name him; the daily elf starts the next real morning.

**Architecture:** The elf store (`js/elf.js`) learns the arrival date and the name. The daily elf asks it whether
he's arrived (door) and whether he's out (the day after arriving). A new `card` step kind lets a job open the
letter or name card (`js/ui/elfcards.js`) and finish when the card is done. The mission is a normal entry in
`MISSIONS`, with the 3D printing courier bringing an `elfParcel`.

**Tech Stack:** Plain ES modules, three.js, no build step. Tests: `npm run test:house`, `npm run test:e2e`.

**Spec:** `docs/superpowers/specs/2026-11-14-elf-arrives-design.md`

## Global Constraints

- Offered to P and Dude only, 1-23 December, until he has arrived this December, and only with Christmas on.
- He's out the next **real** morning: arrived on 1 December → first "Find the elf" on 2 December.
- His door is up from the moment it's fixed (same day), and on every later day that December.
- The same elf every year: named the first time; later years a welcome-back letter, no naming step.
- Default name `'Pip'`; names cleaned with `names.js` `cleanName` (max `NAME_MAX`); empty → `'Pip'`.
- Per device: store key stays `fordHouse.elf.v1`; old stores (only `found`) still load.
- A device whose found log already has a date this Advent counts as arrived (the release before this one).
- Played once a December: no "Try again" on its results card, no stars.
- The game's plain British English. The letter copy below is the text to use (Alan reviews it in the PR).

## Review Focus

1. Arrive on 1 December, then "Start day N+1" on the same date: door up, no elf out, no "Find the elf" (Task 2).
2. A December where the daily elf was already out before this release: no mission card, the elf carries on;
   named "Pip" until they choose (Task 2, Task 4).
3. The name box left empty, or full of emoji and `<b>`: he's "Pip", no markup anywhere (Task 1, Task 3).
4. Next December: the card is back, the letter says welcome back with his name, no name card (Task 4).
5. Christmas switched off on 1 December: no mission card (Task 4).

---

### Task 1: The store: arrival and name

**Files:**
- Modify: `house/js/elf.js`
- Test: `tests/house/elf.mjs`

**Interfaces:**
- Produces (on `createElfLog()`; `day` is `'YYYY-MM-DD'`, default today's real date):
  - `arrivedOn(day) -> string|null`: the arrival date in `day`'s Advent year (`'2026-12-01'`), or, if none is
    stored, the first found date in that Advent year (an elf already out before this release), else `null`.
    Advent year of a date: its year, or the year before in January.
  - `hasArrived(day) -> boolean`: `arrivedOn(day) !== null && arrivedOn(day) <= day`.
  - `out(day) -> boolean`: `arrivedOn(day) !== null && arrivedOn(day) < day`.
  - `arrive(day)`: stores `arrived: day` unless he has already arrived in that Advent year (never moves later).
  - `waiting(tags, day)`: now also requires `out(day)`.
  - `name() -> string` (`cleanName(stored)` or `'Pip'`), `setName(text)` (cleaned; empty stores nothing),
    `named() -> boolean` (a name has been stored).
- Produces (module): `DEFAULT_ELF_NAME = 'Pip'`, `elfName() -> string` (reads the store; `createElfLog().name()`).

- [ ] **Step 1: Write the failing tests** in `tests/house/elf.mjs` (store cleared between groups):
  - fresh store: `!hasArrived('2026-12-01')`, `!waiting(['advent'], '2026-12-02')`, `name() === 'Pip'`, `!named()`.
  - `arrive('2026-12-01')`: `hasArrived('2026-12-01')`, `!out('2026-12-01')`, `out('2026-12-02')`,
    `waiting(['advent'], '2026-12-02')`, `!waiting(['advent'], '2026-12-01')`.
  - `arrive('2026-12-05')` afterwards leaves `arrivedOn('2026-12-06') === '2026-12-01'`.
  - next Advent: `!hasArrived('2027-12-01')`; `hasArrived('2027-01-03')` (still the 2026 Advent).
  - legacy: store `{ found: ['2026-12-02'] }` only → `arrivedOn('2026-12-03') === '2026-12-02'`,
    `waiting(['advent'], '2026-12-03')`.
  - names: `setName('Holly')` → `name() === 'Holly'`, `named()`; `setName('<b>Jingle</b> 🎄')` →
    `!/[<>🎄]/u.test(name())` and `name().length <= 16`; `setName('')` keeps the last name;
    `elfName() === name()`.
  - Update the existing past-midnight and "found once a real day" checks to call `arrive('2026-11-30')` first.
- [ ] **Step 2: Run** `node tests/house/elf.mjs`. Expected: `elf: FAIL` naming the new checks.
- [ ] **Step 3: Implement** in `house/js/elf.js` (import `cleanName` from `./names.js`). Keep `found` as is.
- [ ] **Step 4: Run** `node tests/house/elf.mjs`. Expected: `elf: ok`.
- [ ] **Step 5: Commit** `git commit -m "Ford House: the elf store knows when he arrived, and his name"`

### Task 2: The daily elf waits for him, and uses his name

**Files:**
- Modify: `house/js/systems/elf.js` (door, toast, `prepareArrival`, `fixDoor`), `house/js/pack/elfscenes.js`
  (titles take the name; `ELF_NAME` removed), `house/js/jobs/jobs.js` (labels)
- Test: `tests/house/playthrough.mjs` (the elf block)

**Interfaces:**
- Consumes: Task 1 `hasArrived`, `out`, `waiting`, `elfName`.
- Produces:
  - Scene `title(name: string) -> string` (was a string), e.g. `name => \`${name} has wrapped the coats in loo roll\``.
  - `systems/elf.js`: `reset(params)` shows the door only if `params.holiday` has `advent` **and**
    `ctx.elfLog.hasArrived(params.elfDate)`; the elf and mess only if `waiting(tags, day)` (now needs `out`).
    `found()` toasts `You found ${elfName()}! ${scene.title(elfName())}`. New: `prepareArrival()` (door, elf and
    every prop hidden, for the mission) and `fixDoor()` (door visible).
  - `jobs.js`: the find / pick / drop labels use `elfName()` when the job is built.

- [ ] **Step 1: Update and add tests** in the elf block of `playthrough.mjs`:
  - At the top of the block, and after every `localStorage.removeItem(ELF_KEY)`, call
    `G.elfLog.arrive('2026-11-30')` so the existing checks keep their meaning.
  - New: store cleared, `date=2026-12-03`, P, `G.days.next()`: no door, elf hidden, no `elf` job.
    `G.elfLog.arrive('2026-12-03')`, `G.days.next()` (same date): door visible, elf hidden, no `elf` job.
    `date=2026-12-04`, `G.days.next()`: `elf` job on P's list.
  - New: `G.elfLog.setName('Holly')`, `G.days.next()` on a waiting day: the job's step labels include `Holly`
    and none include `Pip`; after the find step, the last toast starts with `You found Holly!`
    (read it from the HUD element's `textContent` or the stub `hud.toast`; whichever the test can see).
    Then `setName` back is not possible (no clearing): remove the store and `arrive` again afterwards.
- [ ] **Step 2: Run** `npm run test:house`. Expected: FAIL on the new checks.
- [ ] **Step 3: Implement** as above. `README.md` references to "Pip" stay (he's Pip until named).
- [ ] **Step 4: Run** `npm run test:house`. Expected: `no problems`.
- [ ] **Step 5: Commit** `git commit -m "Ford House: the daily elf waits for his arrival and uses his name"`

### Task 3: Card steps, the letter and the name card

**Files:**
- Create: `house/js/ui/elfcards.js`
- Modify: `house/index.html` (markup and CSS for the two cards, styled like `#advent`), `house/js/state.js`
  (`elfCard: null`), `house/js/jobs/board.js` (`card` step kind), `house/js/main.js` (create `ctx.elfCards`;
  add `S.elfCard` to the three guards next to `S.quiz`)
- Test: `tests/house/playthrough.mjs` (`doStep` handles `card`), `tests/e2e/house.spec.js`

**Interfaces:**
- Consumes: Task 1 `elfName`, `createElfLog` (`ctx.elfLog`), `names.js` `nameOf`, `NAME_MAX`.
- Produces:
  - Step `{ kind: 'card', card: 'letter' | 'name', at, level?, label }`. `board.canDo` → true;
    `board.act` → `ctx.elfCards.open(job, s)`. The job advances when the card says it's done.
  - `createElfCards(ctx) -> { open(job, step), close(), submit(text), text() }`. `S.elfCard` is `'letter'` or
    `'name'` while one is open. `close()` on the letter (its **Close** button) and `submit(text)` on the name
    card (the **That's his name** button, and Enter) call `ctx.elfLog.setName(text)`, close the card and
    `board.advance(job)` (if a job was given). `text()` returns the letter's text, for tests.
  - Letter text: the first year when `!ctx.elfLog.named()`, otherwise welcome back. `K` = `nameOf('girl')` and
    `nameOf('boy')` joined with "and"; `E` = `elfName()`. Set with `textContent` only.
    - First: "Dear K, / Hello! I'm one of Father Christmas's elves, and I've come all the way from the North Pole
      to stay with you until Christmas. / Every night, while you're asleep, I'll get up to something. I'm a
      little bit naughty, I'm afraid! Each morning, see if you can find me, put right whatever I've done, and pop
      me back through my little door in the hall. / But first I need a name. Will you give me one? / Love from
      your elf"
    - Welcome back: "Dear K, / It's me, E! I'm back from the North Pole. Did you miss me? I've been practising my
      mischief all year. / From tomorrow morning, find me, put things right, and pop me back through my door. /
      Love from E"
  - Name card: heading "What's my name?", an `<input maxlength=NAME_MAX>` filled with `elfName()`, a button
    **That's his name**.

- [ ] **Step 1: Write the failing tests:**
  - `playthrough.mjs` `doStep`: for `card`, after `G.board.act`: `S.elfCard` must be the step's card; letter →
    `G.elfCards.close()`; name → `G.elfCards.submit(elfNameToType)` (a test variable, default `'Holly'`); then
    the step must have advanced.
  - `house.spec.js` new test "the elf's letter and name cards": `?date=2026-12-01`, open the letter with
    `window.house.elfCards.open(null, { card: 'letter' })`; the card is visible, contains `Dear P and Dude` and
    `But first I need a name`; Close hides it. Open the name card: the input has `Pip`; type `Holly`, click
    **That's his name**: hidden, and `window.house.elfLog.name()` is `Holly`. Open the letter again: it says
    `It's me, Holly!`. At phone size (390×844) the letter text is at least 16px and the card fits the screen.
- [ ] **Step 2: Run** `npx playwright test tests/e2e/house.spec.js -g "letter and name"`. Expected: FAIL.
- [ ] **Step 3: Implement** the cards, the step kind and the guards.
- [ ] **Step 4: Run** the e2e test again and `npm run test:house`. Expected: PASS, `no problems`.
- [ ] **Step 5: Commit** `git commit -m "Ford House: the elf's letter and name cards"`

### Task 4: The mission and its home card

**Files:**
- Modify: `house/js/missions/missions.js` (`elfArrives`; `finishForFun` takes a mission's own best line and hides
  "Try again" for `once: true`), `house/js/systems/deliveries.js` (an `elfParcel` order with the same courier as
  `filament`), `house/js/items.js` (`elfParcel`, hidden), `house/index.html` (mission card `#missionElf`),
  `house/js/ui/home.js` (show/hide it), `house/README.md` (Missions), `CHANGELOG.md` (Unreleased)
- Test: `tests/house/playthrough.mjs`, `tests/e2e/house.spec.js`

**Interfaces:**
- Consumes: Task 2 `ctx.elf.prepareArrival()`, `fixDoor()`, `ELF_DOOR`; Task 3 `card` steps; Task 1 `arrive`,
  `hasArrived`, `named`, `elfName`; `dateKey`, `today()`.
- Produces:
  - `MISSIONS.elfArrives = { title: 'The elf arrives', who: ['girl', 'boy'], once: true, spot: who => ({ name,
    level: 0, start: [3.9, 7.4], facing: Math.PI }), intro: 'Someone is sending you a parcel...',
    setup(c) { c.elf.prepareArrival(); }, jobs, result }` (check `start` isn't blocked; move it if it is).
  - Jobs, in order: **A parcel is coming** (`wait`, `delivery: 'elfParcel'`, `dur: 15`, doneMessage
    `Ding-dong! A parcel for you`; then `pick` `elfParcel` at `FOOD_DELIVERY.door`); **Open it on the dining
    table** (`drop` at `XMAS.table.at`, place on the table; `card: 'letter'` at the table, `onDone` hides the
    parcel); **Fix his door** (`use` at `ELF_DOOR.at`, label `Fix the little door to the skirting in the hall`,
    `onDone: c => c.elf.fixDoor()`); and, only when `!ctx.elfLog.named()` at the time it's added, **Name him**
    (`card: 'name'` at `ELF_DOOR.at`). The last required step's `onDone` calls
    `c.elfLog.arrive(dateKey(today()))`. (Use a function job entry, like 3D printing's last one, for the
    conditional name step.)
  - `result()` → `{ title: \`Welcome, ${elfName()}!\`, stats: \`Look out for ${elfName()} tomorrow morning. He'll be up
    to something!\`, best: \`Arrived ${d} ${month}\` }` (e.g. `Arrived 1 Dec`), no `record`.
  - Home card: `<li class="mission" id="missionElf">` (icon 🧝, text "A parcel with a little door and a letter:
    read it, fix the door in the hall and meet your elf", P and Dude buttons with `data-mission="elfArrives"`).
    `home.js` `render()` hides it unless: today's tags (after the settings filter) have `advent`, the date is
    1-23 December, and `!ctx.elfLog.hasArrived(dateKey(today()))`.

- [ ] **Step 1: Write the failing tests:**
  - `playthrough.mjs` (own block, store cleared, `?season=winter&date=2026-12-01`): `MISSIONS.elfArrives.spot('girl')`
    start not `blocked`; `G.missions.start('elfArrives', 'girl')`; drive it like the 3D printing loop (`doStep`
    each job, `frame()`), with the name `Holly`. Checks: the courier rang (`G.deliveries.banner()` matched
    `/parcel/i` at some point); `S.mission.done`; `G.elfLog.hasArrived('2026-12-01')`, `name() === 'Holly'`;
    `G.missions.end()`; door visible, no `elf` job; next real day (`date=2026-12-02`, `G.days.next()`): `elf`
    job, labels with `Holly`.
  - Same block, next year (`date=2027-12-01`, the store keeps the name): start again; no job has a `card: 'name'`
    step; the letter text (`G.elfCards.text()` when the letter opens) contains `It's me, Holly!`; afterwards
    `hasArrived('2027-12-01')`.
  - `house.spec.js`: `?date=2026-12-01` → `#missionElf` visible; `?date=2026-11-20` → hidden; with
    `window.house.elfLog.arrive('2026-12-01')` and a reload on 1 December → hidden; with the Christmas switch off →
    hidden. The results card of a finished `elfArrives` has `#missionAgain` hidden (finish it by calling the
    mission's steps through `window.house` as other e2e mission tests do, or check `finishForFun` with
    `once: true` via a played mission in the play-through instead, if driving it in the browser is slow).
- [ ] **Step 2: Run** `npm run test:house` and `npx playwright test tests/e2e/house.spec.js -g "elf"`.
  Expected: FAIL on the new checks.
- [ ] **Step 3: Implement** as above; README: a Missions entry "The elf arrives"; CHANGELOG Unreleased:
  "Ford House: **the elf arrives** (#157): ...".
- [ ] **Step 4: Run** `npm run test:house` and `npx playwright test tests/e2e/house.spec.js --workers=1`.
  Expected: `no problems`; all pass. Screenshot the letter card at phone size and the mission's parcel on the
  table for Alan.
- [ ] **Step 5: Commit** `git commit -m "Ford House: the elf arrives mission (#157)"`

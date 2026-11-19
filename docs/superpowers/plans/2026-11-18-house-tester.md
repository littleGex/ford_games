# Ford House Tester Mode Implementation Plan (#179)

**Spec:** `docs/superpowers/specs/2026-11-18-house-tester-design.md`

**For agentic workers:** use superpowers:subagent-driven-development or superpowers:executing-plans. Steps use checkboxes.

**Goal:** a tester panel and separate tester progress for Ford House.
**Tech:** plain ES modules, no build. Tests are plain Node scripts in `tests/house/*.mjs` using a local `check()` (see `tests/house/elf.mjs`), wired into `npm run test:house`.

## Global constraints
- Behaviour with the flag off must not change; `npm run test:house` passes unchanged after every task.
- Progress keys to namespace, exactly: `fordHouse.save.v1`, `fordHouse.advent.v1`, `fordHouse.elf.v1`, `fordHouse.missions.v1` → `fordHouse.tester.<same name>`.
- Tester state key: `fordHouse.tester.v1` (never namespaced).
- One task per release, as in `house/ARCHITECTURE.md`.

## Review focus
- Flag off: nothing is patched, no panel, no banner.
- Tester state corrupt or unparseable JSON: behaves as off, no crash.
- Invalid date in state: ignored, real date used.
- `?tester=0` clears the flag.
- Reset tester progress removes only `fordHouse.tester.*` progress keys, never real ones.

### Task 1: Tester state, `today()` override, prefixed progress
**Files:** create `house/js/tester.js`, `tests/house/tester.mjs`; modify `house/js/holidays.js`, `house/js/players.js`, `house/index.html`, `package.json` (`test:house`).

**Interfaces (produces):**
- `TESTER_KEY = 'fordHouse.tester.v1'`
- `testerKey(key: string): string`: maps the four progress keys to `fordHouse.tester.<name>`, others unchanged.
- `readTester(storage?): { on: boolean, date?: string, holiday?: string, season?: string, birthday?: string }`: safe on bad JSON.
- `writeTester(patch, storage?): void`
- `bootTester(search, storage): boolean`: handles `?tester=1`/`?tester=0`, returns whether on, and when on patches `Storage.prototype` get/set/removeItem through `testerKey`.

- [ ] Step 1: failing tests in `tests/house/tester.mjs`: `testerKey('fordHouse.save.v1') === 'fordHouse.tester.save.v1'` (same for advent, elf, missions); `testerKey('fordHouse.settings.v1')` unchanged; `readTester` on `'{bad'` returns `{ on: false }`; `?tester=1` turns on, `?tester=0` turns off; `today()` with tester date `2026-12-24` returns 24 Dec 12:00; a bad date falls back to real; `?date=` beats tester date; `ageOn` and `daysToBirthday` with no argument use `today()`.
- [ ] Step 2: run `node tests/house/tester.mjs`; expect FAIL (module missing).
- [ ] Step 3: implement `tester.js`; in `holidays.js` make `today()` fall back to tester date between URL and real; same for holiday/birthday/season lookups; `players.js` defaults call `today()`. Load `bootTester` from an inline module at the top of `index.html`, before `js/main.js`.
- [ ] Step 4: `node tests/house/tester.mjs && npm run test:house`; expect PASS.
- [ ] Step 5: commit `feat(house): tester state and separate tester progress`.

### Task 2: The panel (date, holiday, season, birthday, reset)
**Files:** create `house/js/ui/tester.js`, `tests/house/tester-panel.mjs`; modify `house/js/main.js` (create the panel only when `readTester().on`), `house/css/house.css` (banner and panel styles), `package.json`.

**Interfaces:**
- Consumes: Task 1 `readTester`, `writeTester`, `testerKey`.
- Produces: `dateChips(year: number): { label: string, date: string }[]` (Halloween 31 Oct, 1 Dec, 15 Dec, Xmas Eve 24 Dec, 5 Jan); `createTester(ctx): { open(), close() }`; `resetTesterProgress(storage?): void`.

- [ ] Step 1: failing tests: `holidaysOf(new Date(chip.date))` includes `halloween` for Halloween, `advent` for 1 Dec, `christmasEve` for Xmas Eve, `christmasEnd` for 5 Jan; `resetTesterProgress` removes the four `fordHouse.tester.*` progress keys and leaves `fordHouse.save.v1` and `fordHouse.tester.v1` alone.
- [ ] Step 2: run; expect FAIL.
- [ ] Step 3: implement panel DOM built in JS: 🧪 button, TESTER banner, date input plus chips, holiday/season/birthday selects (auto + the existing values), "Apply & reload" (writes state, `location.reload()`), "Reset tester progress", "Unlock all Advent doors" (calls the existing advent API with a date of 24 Dec in tester storage).
- [ ] Step 4: `npm run test:house`; add a Playwright check in `tests/e2e/house.spec.js`: `?tester=1` shows the banner, choose Xmas Eve, apply, Christmas tree is present. Expect PASS.
- [ ] Step 5: commit `feat(house): tester panel`.

### Task 3: Play as, and mission launcher
**Files:** modify `house/js/ui/tester.js`; test in `tests/house/tester-panel.mjs`.

**Interfaces:**
- Consumes: `days.setCharacter(key)`, `ctx.missions.start(id, who)`, `MISSIONS` (from `missions.js`).
- Produces: `missionChoices(missions, kids): { id, title, who: string[] }[]`: mirrors `start()`: a player is valid when `m.spot ? m.spot(who) : kids[who]` is truthy, over `['dad','mum','girl','boy']`.

- [ ] Step 1: failing test: `missionChoices` includes `schoolRun` with `who` exactly `['girl','boy']` and excludes missions with no valid player.
- [ ] Step 2: run; expect FAIL.
- [ ] Step 3: implement; panel gets "Play as" buttons and a mission list with one start button per valid player.
- [ ] Step 4: `npm run test:house`; expect PASS.
- [ ] Step 5: commit `feat(house): tester play-as and mission launcher`.

### Task 4: Job picker (needs a short look first)
**Files:** `house/js/jobs/board.js`, `house/js/days/days.js`, `house/js/ui/tester.js`.

- [ ] Step 1: read `createJobBoard` and `createDays` to find how a job is begun; write down the exact function to call before coding. The design allows adding a small tester-only hook in `days.js` if none exists.
- [ ] Step 2: failing test for the chosen hook, then implement a searchable job list in the panel that starts any job for the current character.
- [ ] Step 3: `npm run test:house`; expect PASS. Commit `feat(house): tester job picker`.

## Self-review
- Spec coverage: panel (T2), separate progress (T1), clock gaps (T1), play-as and missions (T3), jobs (T4). Mission-clock jump is a stated non-goal.
- Open risk: Task 4 depends on the board API, so it is deliberately last and starts with reading.

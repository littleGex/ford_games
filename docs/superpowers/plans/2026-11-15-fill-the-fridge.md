# Fill the Fridge Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** The food delivery's last step opens a fridge card: put about eight items, one at a time, in the door, the shelves, the bottom shelf, the salad drawer or the cupboard, with a short "why" every time and a "right first time" score.

**Architecture:** Plain data and rules in `pack/fridgefood.js` (the pool, the deal, the judging); a card in `ui/fridge.js` built like `ui/sorting.js`, opened by a new step `kind: 'fridge'`; the `shopping` job's last step becomes that step.

**Tech Stack:** plain ES modules, three.js, Node tests, Playwright.

**Spec:** `docs/superpowers/specs/2026-11-15-fill-the-fridge-design.md`

## Global Constraints

- Places, in button order and keys 1–5: `door` "The door", `shelves` "The shelves", `bottom` "The bottom shelf", `drawer` "The salad drawer", `cupboard` "The cupboard".
- About 25 items, each `{ id, emoji, name, kind: 'drink'|'chilled'|'raw'|'veg'|'cupboard', best, also: [], why, whyNot? }`; places and reasons per plain NHS / FSA advice; no eggs, tomatoes or butter.
- A deal is 8 items, all different, at least one whose `best` is each place.
- An `also` place counts as right (first time too), the line naming the best: "That's fine — but <the best place> is the best place for <name>." A wrong place gives the item's `whyNot` or the kind's line, and "Try again"; a second wrong try on the same item names the best place and lights its button.
- The end: "<n> of 8 right first time!" as the board's advance message; no stars.
- Short lines for children to read; text only via `textContent`; 16px or more on a phone.
- `S.fridge` blocks walking, actions and the home menu's Escape, as `S.sorting` does (main.js lines 119, 172, 182; home.js line 92).
- Every change under `house/` → `CACHE_NAME` bump and new files listed (`tests/house/sw.mjs`). Commits end `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`; restore `test-results/.last-run.json` before committing.

## Review Focus

- "Do it later" mid-card, then back to the fridge: carries on at the same item, the score so far kept, the same eight.
- A wrong try, then "Do it later", then the right place: not counted right first time.
- Escape or the home menu while the card is open: the card closes cleanly; nothing behind it acts on the keys 1–5.
- Starting a mission or a new day with the card open: the card is closed (`S.fridge` false), as the elf cards are.
- An "also fine" answer for every item that has one: never shown as wrong.

---

### Task 1: The food, the deal and the judging

**Files:**
- Create: `house/js/pack/fridgefood.js`, `tests/house/fridge.mjs`
- Modify: `package.json` (`test:house` runs `node tests/house/fridge.mjs` after `elf.mjs`), `house/sw.js` (list, bump)

**Interfaces:**
- Produces: `FRIDGE_PLACES` (`[{ id, name }]` in the order above), `FRIDGE_FOOD` (the pool), `dealFood(rand = Math.random) -> item[8]`, `judge(item, place, tries) -> { ok: boolean, also: boolean, line: string, show?: placeId }` (`tries` = wrong tries so far on this item; `show` set on the second wrong try).

- [ ] **Step 1: Failing test** `tests/house/fridge.mjs` (plain Node, prints `fridge: ok`): ≥24 items; every item has emoji, name, a `best` among the places, `also` never containing `best`, a `why`; every kind has a wrong-place line; 500 seeded deals are 8 distinct items with every place's `best` present; `judge(milk,'door',0).ok`, `judge(milk,'shelves',0)` ok with `also` and a line naming "The door"; `judge(chicken,'shelves',0)` not ok, line mentions drips; `judge(chicken,'cupboard',0)` not ok, line says cold; `judge(banana,'drawer',0)` line is "Bananas go brown in the fridge!"; `judge(x, wrong, 1).show === x.best`; no item's emoji or name is empty; no item is egg, tomato or butter.
- [ ] **Step 2:** `node tests/house/fridge.mjs` → FAIL (module missing).
- [ ] **Step 3:** Implement.
- [ ] **Step 4:** passes; `npm run test:house` → `no problems`.
- [ ] **Step 5:** Commit "Ford House: the food for the fridge".

### Task 2: The fridge card

**Files:**
- Create: `house/js/ui/fridge.js`
- Modify: `house/index.html` (`#fridge` dialog beside `#sort`), `house/css/*.css` (beside `.sort`), `house/js/jobs/board.js` (`kind: 'fridge'` beside `sort`: canDo, act → `ctx.fridge.open(job, s)`), `house/js/main.js` (create it, `ctx.fridge`, the `S.fridge` guards), `house/js/ui/home.js` (Escape guard), `house/js/state.js` (`fridge: false`), `house/js/missions/missions.js` and `house/js/days/days.js` (close it on start / new day), `house/sw.js`
- Test: `tests/e2e/house.spec.js`

**Interfaces:**
- Consumes: Task 1's exports.
- Produces: `createFridge({ board, hud }) -> { open(job, step), choose(placeId), close(), answer() -> placeId|null, also() -> placeId|null }` (`answer` the best place for the item showing; `also` an also-fine place for it if any; for tests). The step keeps `queue`, `done`, `firstTime`, `tries` so "Do it later" resumes.
- Card: heading "Put the food away", the item's emoji (large) and name, "3 / 8", the five place buttons as a simple drawn fridge (door down the right, shelves, bottom shelf, drawer at the bottom) and a cupboard beside it, a feedback line (`aria-live="polite"`), "Do it later".

- [ ] **Step 1: Failing e2e** "fill the fridge: a card to read on a phone": 390×844; open it with `window.house.fridge.open(job, { kind: 'fridge' })` on a stub job added to the board; heading visible; the item's name ≥16px; the card inside the viewport; key `answer`'s number puts it right (count goes 1 / 8 → 2 / 8); a wrong key shows a line and the count stays; a second wrong key lights the best button (`.lit`); "Do it later" hides it and reopening shows the same item.
- [ ] **Step 2:** `npx playwright test tests/e2e/house.spec.js -g "fill the fridge"` → FAIL.
- [ ] **Step 3:** Implement.
- [ ] **Step 4:** passes; `npm run test:house` → `no problems`.
- [ ] **Step 5:** Commit "Ford House: the fridge card".

### Task 3: Into the food delivery

**Files:**
- Modify: `house/js/jobs/jobs.js` (`shopping`'s last step → `{ kind: 'fridge', at: [3.95, 3.4], label: 'Put the food away', onDone: hide the food as now }`), `tests/house/playthrough.mjs` (`doStep` branch for `fridge`), `house/README.md`, `CHANGELOG.md`, `house/sw.js`

**Interfaces:**
- Consumes: `ctx.fridge` (Task 2).

- [ ] **Step 1: Failing play-through**: in `doStep`, a `fridge` branch like the `sort` one: first item a wrong place, then each item its `also` place if it has one else `answer()`, until closed; it returns whether the step moved on. A block "fill the fridge" that plays the shopping job as P and as Dad and checks: the step opens the card (`S.fridge`), finishes, the board's message says "of 8 right first time" with 7 (one wrong first), the food in the bag hidden; and "Do it later" after two items then reopening carries on at item 3 with the same eight.
- [ ] **Step 2:** play-through → FAIL (the step is still a `use`).
- [ ] **Step 3:** Implement; README (the food delivery line); CHANGELOG Unreleased "Added"; `sw.js` bump.
- [ ] **Step 4:** `npm run test:house` → `no problems`; `npx playwright test --workers=1` → all pass.
- [ ] **Step 5:** Commit "Ford House: fill the fridge (#166)"; phone screenshots of the card for Alan.

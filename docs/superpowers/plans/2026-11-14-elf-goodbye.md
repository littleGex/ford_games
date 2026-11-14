# The Elf Says Goodbye Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** On 24 December, P and Dude each play "The elf says goodbye": a trail of four notes (calendars, then three spots from their December) ending at his door, a goodbye letter, a wave, and his door gone after both.

**Architecture:** The elf store (`js/elf.js`) learns per-child goodbyes and picks the trail; scenes (`pack/elfscenes.js`) gain a memory line, plus three fallback spots; `ui/elfcards.js` gains `note` and `goodbye` cards; `systems/elf.js` shows the notes and plays the wave; a new `elfGoodbye` mission and home card. Christmas Eve has no daily find.

**Tech Stack:** plain ES modules, three.js, Node play-through tests, Playwright.

**Spec:** `docs/superpowers/specs/2026-11-14-elf-goodbye-design.md`

## Global Constraints

- Offered on 24 December only, while he has arrived this Advent, Christmas group on; one play button per child who hasn't said goodbye.
- On 24 December: no "Find the elf", no mischief scene (`waiting()` false when tags include `christmasEve`).
- Always exactly three trail notes after the calendar note, at three different `at` spots; fallbacks in order: the tree, the dining room windowsill, the kitchen worktop.
- Door disappears only after both children have said goodbye; name and arrival kept.
- Text only through `textContent`; no "Try again", no stars on the results card.
- Every new/changed file under `house/` → listed in `house/sw.js` and `CACHE_NAME` bumped in the same commit (`tests/house/sw.mjs`).
- Commits end with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`; restore `test-results/.last-run.json` before committing.

## Review Focus

- P says goodbye, then the game is reloaded: Dude's button still there, P's gone, door still up, no elf out.
- Both said goodbye, then "Start over from day 1" on the 24th: no card, no door, no "Find the elf".
- A note on an upstairs or attic spot (terrarium, Lego, marshmallows): reachable, on the right floor, marker shows there.
- Christmas off on the 24th, or he never arrived: no goodbye card at all.
- Leaving the mission part-way (home screen / "Back to the day"): notes hidden, elf not left at the door, nothing recorded.

---

### Task 1: The store: goodbyes per child, Christmas Eve, the trail

**Files:**
- Modify: `house/js/elf.js`
- Modify: `house/js/systems/elf.js` (`reset`: door hidden once `hasLeft(day)`)
- Test: `tests/house/elf.mjs`

**Interfaces:**
- Produces (log API): `leave(who, day = key())`, `saidGoodbye(who, day = key()) -> bool` (same Advent year), `hasLeft(day = key()) -> bool` (both `girl` and `boy`), `foundCount(day = key()) -> number` (December found dates this Advent), `foundScenes(day, scenes, isOn) -> string[]` (scene id of each December found date, oldest first, via `pickScene(dateOf(x), scenes, isOn)`).
- Produces (pure): `export function trailScenes(ids) -> string[]` — distinct ids in found order, then at most three: first, middle (`Math.floor((n-1)/2)` of the distinct list), latest; fewer than three distinct → all of them.
- Store shape adds `left: { girl?: 'YYYY-MM-DD', boy?: 'YYYY-MM-DD' }`; a broken `left` reads as `{}`.
- `waiting(tags, day)` additionally false when `tags` includes `'christmasEve'`.

- [ ] **Step 1: Failing tests in `tests/house/elf.mjs`**: `leave('girl','2026-12-24')` → `saidGoodbye('girl')` true, `saidGoodbye('boy')` false, `hasLeft('2026-12-24')` false; then `leave('boy', …)` → `hasLeft` true; `saidGoodbye('girl','2027-12-24')` false (next Advent); `waiting(['advent','christmasEve'],'2026-12-24')` false with him arrived on the 1st; `foundCount` counts only December dates; `trailScenes(['a','b','a','c','d'])` → `['a','c','d']`, `trailScenes(['a','a'])` → `['a']`, `trailScenes([])` → `[]`; with Christmas Eve tags, `reset` leaves the elf hidden and (after both left) the door hidden.
- [ ] **Step 2:** `node tests/house/elf.mjs` → FAIL (`leave is not a function`).
- [ ] **Step 3:** Implement in `elf.js` and `systems/elf.js`.
- [ ] **Step 4:** `node tests/house/elf.mjs` → `elf: ok`; `npm run test:house` → `no problems` (the existing elf play-through must still pass).
- [ ] **Step 5:** Commit "Ford House: the elf store knows each child's goodbye" (bump `CACHE_NAME`).

### Task 2: The trail's words and spots

**Files:**
- Modify: `house/js/pack/elfscenes.js`
- Test: `tests/house/elf.mjs`

**Interfaces:**
- Consumes: `trailScenes` (Task 1).
- Produces: each `ELF_SCENES` entry gains `memory: name => string` (his voice, one or two sentences, e.g. zipWire: "Remember my zip wire across the living room? Wheee! That was my favourite."). `export const ELF_FAREWELL_SPOTS` = three `{ id, at, level, place, hint: [string], memory: name => string }`: `tree` (`at: XMAS.tree.at`, place by the presents, e.g. `[1.0, 0, 1.1]`), `windowsill` (`at: XMAS.windowsill.at`, `place: XMAS.windowsill.place`), `worktop` (`at: XMAS.counter.at`, `place: [3.75, 0.9, 2.45]`). `export function trailStops(ids) -> stop[]`: the scenes for `trailScenes(ids)` as stops `{ id, at, level, place: scene.elf.place, hint: scene.hint, memory }`, padded with `ELF_FAREWELL_SPOTS` in order, skipping any whose `at` equals a chosen stop's `at` (worktop vs biscuitRaid), always length 3. `export const CALENDAR_NOTE = { at: XMAS.calendars, level: 0, place: [2.45, 0, 3.45] }`.

- [ ] **Step 1: Failing tests**: every scene has `memory('Holly')` a non-empty string containing no `<`; `trailStops([])` → ids `['tree','windowsill','worktop']`; `trailStops(['biscuitRaid'])` → `['biscuitRaid','tree','windowsill']`; `trailStops(['looRoll','zipWire','legoSleigh','sinkFishing'])` → three scene ids, distinct `at`s; each stop's `level` matches its scene's `elf.level`; no stop is `blocked` (play-through check: add to `playthrough.mjs` near the elf block, `blocked(at[0], at[1], level)` false for every scene's `elf.at`, every `ELF_FAREWELL_SPOTS.at` and `CALENDAR_NOTE.at`).
- [ ] **Step 2:** `node tests/house/elf.mjs` → FAIL.
- [ ] **Step 3:** Implement and write the ten memory lines and three fallback lines (British English, gentle, funny).
- [ ] **Step 4:** `node tests/house/elf.mjs` → `elf: ok`; `npm run test:house` → `no problems`.
- [ ] **Step 5:** Commit "Ford House: the elf's farewell notes, words and spots".

### Task 3: Note and goodbye cards, notes in the house, the wave

**Files:**
- Modify: `house/js/ui/elfcards.js`, `house/index.html` (the letter markup can be reused; a note uses the letter card with a different heading), `house/css/house.css` if needed
- Modify: `house/js/systems/elf.js`, `house/js/world/elf.js` (`makeNote(g)`: small folded paper, cream with a red seal)
- Test: `tests/e2e/house.spec.js`, `tests/house/playthrough.mjs` (`doStep` `card` branch: `note` and `goodbye` close like `letter`)

**Interfaces:**
- Produces: card step `{ kind: 'card', card: 'note', text: string[], at, level, label }` opens the letter card headed "A note from <name> ✉️" with `text` paragraphs; `card: 'goodbye'` opens it headed "Goodbye! 👋" with `goodbyeText(who)`: "Dear <child>," / his thanks for December / "I have to go back to the North Pole now to help Father Christmas get ready for tonight." / "See you next December!" / "Love from <name>". `S.elfCard` is `'note'`/`'goodbye'`; `close()` finishes both.
- Produces (`systems/elf.js`): `showNotes(stops)` (calendar note + stops, each on its level, visible), `takeNote(i)` (hide note i), `atDoor()` (elf visible sitting at `ELF_DOOR.place` facing out, `level 0`), `wave(done)` (about 1.5 s of hopping/arm waving in `update`, then elf hidden, then `done()`), `hideTrail()` (notes and elf at door hidden). `reset` calls `hideTrail()`.

- [ ] **Step 1: Failing e2e test** "the elf's goodbye notes: readable on a phone": 390×844, `?date=2026-12-24`, store `{arrived:'2026-12-01', name:'Holly'}`; `elfCards.open(null, {card:'note', text:['Remember my zip wire?','Next clue: …']})` → `#elfLetter` visible, heading contains "A note from Holly", text ≥16px, card inside the viewport; Close hides it; `open(null,{card:'goodbye'})` as P → contains "Dear P" and "See you next December".
- [ ] **Step 2:** `npx playwright test tests/e2e/house.spec.js -g "goodbye notes"` → FAIL.
- [ ] **Step 3:** Implement.
- [ ] **Step 4:** test passes; `npm run test:house` → `no problems`.
- [ ] **Step 5:** Commit "Ford House: the elf's notes and goodbye letter".

### Task 4: The mission and its home card

**Files:**
- Modify: `house/js/missions/missions.js`, `house/js/ui/home.js`, `house/index.html`, `house/sw.js`, `house/README.md`, `CHANGELOG.md`
- Test: `tests/house/playthrough.mjs`, `tests/e2e/house.spec.js`

**Interfaces:**
- Consumes: Tasks 1–3.
- Produces: `MISSIONS.elfGoodbye` — `who: ['girl','boy']`, `once: true`, no clock, `spot` living room `[2.4, 3.0]` level 0; `setup(c)`: `c.elf.hideTrail()`, compute `stops = trailStops(c.elfLog.foundScenes(day, ELF_SCENES, isOn))`, `c.elf.showNotes(stops)`. Jobs (one job "Follow Holly's notes", built at start): note card at `CALENDAR_NOTE` ("I've left you a trail of notes…", then clue `stops[0].hint[0]`); for i in 0..2 a `card: 'note'` step at `stops[i].at`/`level` with `[stops[i].memory(E), i < 2 ? 'Next clue: ' + stops[i+1].hint[0] : 'Last clue: go to my little door in the hall.']`, `onDone: takeNote`; then a `use` at `ELF_DOOR.at` ("Knock on Holly's door") → `atDoor()`; then `card: 'goodbye'` at `ELF_DOOR.at`, `onDone`: `leave(who, today)` then `wave(() => { if (hasLeft) door hidden })`. `result`: title `Goodbye, <name>!`, stats `You found <name> <foundCount> times this December.` (`1 time` singular; `0` → "He'll be back next December!"), `best: 'Said goodbye 24 Dec'`. `end()` mid-mission → `hideTrail()` via `days` reset (check it happens).
- Home: `#missionElfGoodbye` (👋, "The elf says goodbye", P and Dude buttons); shown when 24 December, `advent` in filtered tags, `hasArrived`, `!hasLeft`; each button hidden when that child `saidGoodbye`.

- [ ] **Step 1: Failing play-through** (in the elf-arrives block, after the 2027 arrival… or a new block): store with arrived `2026-12-01`, found `2026-12-02`, `-05`, `-09`; `?date=2026-12-24`; as P: no `Find the elf` on the board; play `elfGoodbye` to the end via `doStep`; four note cards opened, the second's text contains the first stop's memory, the last note says "my little door"; `saidGoodbye('girl')`, door still visible; results "Goodbye, Holly!", stats "3 times", no Try again; as Dude: play again, then `hasLeft`, door hidden after the wave (run `frame()` ~2 s); next `days.next()` on the 24th: no door, no elf. Second run with no found dates: stops are tree, windowsill, worktop and the stats say "He'll be back next December!".
- [ ] **Step 2: Failing e2e** "the elf's goodbye card on Christmas Eve, a button per child": `?date=2026-12-23` hidden; 24th with arrival → visible with both buttons; after `leave('girl')` reload → only Dude's; after both → hidden; never arrived → hidden; Christmas off → hidden.
- [ ] **Step 3:** Run both → FAIL (`elfGoodbye` undefined / `#missionElfGoodbye` not found).
- [ ] **Step 4:** Implement; README paragraph next to the elf arrives; CHANGELOG Unreleased "Added"; `sw.js` bump.
- [ ] **Step 5:** `npm run test:house` → `no problems`; `npx playwright test tests/e2e/house.spec.js --workers=1` → all pass.
- [ ] **Step 6:** Commit "Ford House: the elf says goodbye mission (#158)"; screenshots of a note and the goodbye at phone size for Alan.

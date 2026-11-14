# The Elf's Report to Father Christmas Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A replayable December mission for P and Dude: five good deeds dealt at random, a half-hour game clock, post the elf's report on the windowsill, stars 1–3, best kept per child.

**Architecture:** A deed pool (`pack/elfdeeds.js`) deals five deeds per go; `MISSIONS.elfReport` runs them as optional jobs with a clock that ends the go, plus a "post the report" job that appears after three deeds; a `report` card in `ui/elfcards.js` shows the ticks; a home card offers it from the day after he arrives to 23 December.

**Tech Stack:** plain ES modules, three.js, Node play-through tests, Playwright.

**Spec:** `docs/superpowers/specs/2026-11-14-elf-report-design.md`

## Global Constraints

- Five deeds a go, dealt with `Math.random` (tests pass their own `rand`); never a deed whose `needs` group is off or whose `who` excludes the child or whose person isn't in the family.
- Stars: all 5 done and posted before the clock ends ★★★; 4 done ★★; otherwise ★. "Post your report" appears once 3 deeds are done; posting ends the go.
- Clock 17:00 to 17:30 game time, about three real minutes (`secondsPerMinute: 6`); reaching 17:30 ends the go with what's done.
- Offered from `elfLog.out(day)` to 23 December, `!hasLeft(day)`, Christmas group on; P and Dude buttons; "Try again" deals a new mix.
- The daily find is untouched: the elf sits on the windowsill only if `elfLog.found(day)`; ending the mission restores the day (`days.start` → `elf.reset`).
- Names via `nameOf`, never a pronoun for a person; text only via `textContent`.
- Every change under `house/` → `CACHE_NAME` bump and new files listed in `house/sw.js` (`tests/house/sw.mjs`). Commits end with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`; restore `test-results/.last-run.json` before committing.

## Review Focus

- Elf not yet found today, mission played, then "Back to the day": he's still in his hiding spot with the mess, "Find the elf" undone.
- Dragon group off, or only one grown-up in the family: no dragon deed, no deed naming a missing grown-up.
- Clock runs out with 0–2 deeds done: one star, no "Post" step ever offered, results still shown.
- "Try again" three times: the five deeds differ at least once (not one fixed deal).
- Dude's deal: never P-only jobs (her toys, her dragon) unless written for him.

---

### Task 1: The deed pool and the deal

**Files:**
- Create: `house/js/pack/elfdeeds.js`
- Modify: `house/sw.js` (list it, bump)
- Test: `tests/house/playthrough.mjs` (a new block before "the elf says goodbye")

**Interfaces:**
- Produces: `export const ELF_DEEDS` — about twelve `{ id, label(who) -> string, who?: ['girl'|'boy'], needs?: groupId, person?: 'mum'|'dad'|'grownUp', steps(who) -> step[] }` (steps in the board's step format: `use`, `pick`, `drop`, `sit` …, at real spots; reuse coordinates from the matching `jobs.js` job where one exists: beds, toys, teeth, laundry, shoes, plants, feedDragon, tidyDude, jacket/coats, coffee).
- Produces: `export function dealDeeds(who, { isOn, inFamily, rand = Math.random }) -> deed[]` — five distinct deeds, filtered as Global Constraints say; `person: 'grownUp'` picks Mum if in the family else Dad (label uses `nameOf`).
- New items, if any deed needs one (a tea cup, a biscuit plate, a drawing), go in `house/js/items.js`, hidden by default.

- [ ] **Step 1: Failing play-through block** "the elf's good deeds": for each child, `dealDeeds(who, { isOn: () => true, inFamily: () => true, rand })` with a seeded `rand` returns 5 distinct ids; over 200 deals every deed allowed for that child appears; with `isOn = id => id !== 'dragon'` no deed has `needs: 'dragon'`; Dude never gets a deed whose `who` excludes him; each child has ≥ 10 deeds allowed; with `inFamily = k => k !== 'mum'` no label contains "Mum"; then every deed allowed for each child is run as a job on today's board (`G.board.add({ id: 'deed-' + d.id, title: d.label(who), steps: d.steps(who) })`, played with `doStep`) and finishes.
- [ ] **Step 2:** `node --import ./tests/house/register.mjs tests/house/playthrough.mjs` → FAIL (module missing).
- [ ] **Step 3:** Implement the pool and the deal.
- [ ] **Step 4:** Same command → the block passes; `npm run test:house` → `no problems`.
- [ ] **Step 5:** Commit "Ford House: the elf's good deeds".

### Task 2: The report card

**Files:**
- Modify: `house/js/ui/elfcards.js`
- Test: `tests/e2e/house.spec.js`

**Interfaces:**
- Produces: card `{ card: 'report', who, lines: [{ text, done }] }` on the letter paper: heading "Report for Father Christmas 📜", first line `nameOf(who)`, then one paragraph per line "✓ <text>" or "✗ <text>", then "Signed, <elf name>, elf". Closes with Close / Escape like the letter.

- [ ] **Step 1: Failing e2e** "the elf's report card: readable on a phone": 390×844, `?date=2026-12-10`, name Holly; `elfCards.open(null, { card: 'report', who: 'boy', lines: [{ text: 'Made the bed', done: true }, { text: 'Laid the table', done: false }] })` → heading "Report for Father Christmas", contains "Dude", "✓ Made the bed", "✗ Laid the table", "Signed, Holly"; text ≥ 16px; card inside the viewport; Close hides it.
- [ ] **Step 2:** `npx playwright test tests/e2e/house.spec.js -g "report card"` → FAIL.
- [ ] **Step 3:** Implement.
- [ ] **Step 4:** test passes; `npm run test:house` → `no problems`.
- [ ] **Step 5:** Commit "Ford House: the elf's report card".

### Task 3: The mission and its home card

**Files:**
- Modify: `house/js/missions/missions.js`, `house/js/ui/home.js`, `house/index.html`, `house/sw.js`, `house/README.md`, `CHANGELOG.md`
- Test: `tests/house/playthrough.mjs`, `tests/e2e/house.spec.js`

**Interfaces:**
- Consumes: `dealDeeds`, `ELF_DEEDS` (Task 1); the `report` card (Task 2).
- Produces: `MISSIONS.elfReport` — `who: ['girl','boy']`, `clock: { start: hm(17), end: hm(17.5), secondsPerMinute: 6 }`, `endsAtClock: true` (new: `update` calls `finish()` once `now() >= clock.end`), start in the living room `[2.4, 3.0]`; `setup` deals into `S.mission.deeds` (an optional `rand` from `S.mission` for tests: `missions.start(id, who, { rand })` passes it through), and if `elfLog.found(today)` seats the elf on the windowsill (`XMAS.windowsill.place`, beside the wish list) with a report item; jobs: five deeds `{ key: 'deed-<id>', optional: true, title: label, steps }`; once three are done, `missions.add({ key: 'post', title: 'Post your report', steps: [{ kind: 'use', at: XMAS.windowsill.at, label: 'Post the report on the windowsill for Father Christmas' }] })` — posting finishes the mission. `result(mission, at)`: `done` = deed keys in `doneAt`, `stars` per Global Constraints (posted = `doneAt.post` < clock end), title "A glowing report!" (3★) / "A good report!" (2★) / "A kind start!" (1★), stats "<n> good deeds for Father Christmas", and the `report` card opened after the results card closes (or before it; builder's choice, one place).
- Home: `#missionElfReport` (📜, "The elf's report", P and Dude buttons, best stars line `data-best="elfReport"`) shown per Global Constraints.

- [ ] **Step 1: Failing play-through** "the elf's report": store arrived `2026-12-01`, `?date=2026-12-10`; as P with a fixed `rand`: start, every deed done with `doStep`, "Post" appears after the third, post → finished, 3 stars, results stats contain "5 good deeds", report lines all ✓; as Dude: three deeds done then advance the clock past 17:30 (`S.mission.t` += 31 × 6) → finished with 1 star and no post (2 stars if 4 done — second go); after `missions.end()`, if the day's elf was waiting, he's back in his scene spot and `Find the elf` undone; two starts with `Math.random` differ at least once in ten tries.
- [ ] **Step 2: Failing e2e** "the elf's report: offered from the day after he arrives to 23 December": arrived 2026-12-01 → hidden on the 1st, shown on the 2nd and 23rd, hidden on the 24th; never arrived → hidden; both said goodbye → hidden; Christmas off → hidden.
- [ ] **Step 3:** Both FAIL (`elfReport` undefined / `#missionElfReport` missing).
- [ ] **Step 4:** Implement; README entry next to the other elf missions; CHANGELOG Unreleased "Added"; `sw.js` bump.
- [ ] **Step 5:** `npm run test:house` → `no problems`; `npx playwright test tests/e2e/house.spec.js --workers=1` → all pass.
- [ ] **Step 6:** Commit "Ford House: the elf's report to Father Christmas (#160)"; phone screenshots of a go and the report for Alan.

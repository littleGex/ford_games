# Ford House: tester mode (#179)

Design approved in conversation 2026-11-18 (copied from issue #179).

## Why
Testing the UX of holiday and mission content means waiting for the right day or playing to the right moment. Content is growing (Advent, the elf, birthdays, five missions), so it needs a fast way to reach any state, and one that is safe to use on a phone that also holds the kids' real saves.

## What exists already
- `holidays.js` has `today()` (reads `?date=YYYY-MM-DD`), `currentHolidays()` (`?holiday=`), `currentBirthday()` (`?birthday=`); `seasons.js` reads `?season=`.
- Advent, elf, Christmas, missions and the home screen already call `today()`. No big clock refactor is needed.

## Gaps this closes
1. The overrides are URL-only: retyped on every reload, awkward on a phone.
2. Faking a date changes real progress. `fordHouse.save|advent|elf|missions.v1` are written to real `localStorage` (Advent doors opened, elf marked found).
3. `players.js` `ageOn`/`daysToBirthday` default to `new Date()`, so a faked birthday can disagree with the faked date.
4. No way to start a mission, or play as someone, without going through the normal flow.

## Goals
- A 🧪 panel with date (plus quick chips), holiday, season, birthday, play-as, mission launcher, reset.
- Tester progress is fully separate from real progress.
- Obvious "TESTER MODE" banner whenever it's on.

## Non-goals
- Real access control. It's GitHub Pages: `?tester=1` is a convenience, not security.
- Live rebuild of the world on change: "Apply" reloads the page (decorations and the elf are built at startup).
- Jumping a mission's internal clock (e.g. start the school run at 7:49). Possible follow-up.

## Anti-goals
- Any way for tester mode to modify the kids' saves, Advent doors or elf log.
- Tester code in the normal startup path when the flag is off.

## Approaches considered
- **A (chosen): URL-flag + panel + prefixed progress keys.** Small, reuses `today()`, safe.
- B: a real tester "player" profile in the save. Rejected: mixes test and real state in one save.
- C: live rebuild without reload. Rejected for now: the world, decorations and elf are built once; fiddly for little gain.

## Calls I made (change if you disagree)
- URL params still win over tester state (explicit beats stored).
- Only the four progress keys are namespaced. Settings, names, players and the family-server keys stay shared, so the tester sees the real family setup.
- Namespacing is done by patching `Storage.prototype` get/set/removeItem (portable, no changes in each module).

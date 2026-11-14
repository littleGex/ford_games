# Ford House: the naughty elf

## Intent

Give P and Dude a reason to open Ford House every December morning. Each night a naughty elf gets up to
something somewhere in the house; in the morning they go looking for him, put his mischief right, and take him
back to his little door. It sits next to the Advent calendar as the other daily December ritual.

The elf is our own character (his own name and look), not a copy of any branded elf toy.

## Goals

- From 1 to 24 December (real dates, like the Advent doors), P's and Dude's job list has **Find the elf**.
- Each day the elf is somewhere new with a different bit of mischief: one of a set of hand-built **scenes**.
- The job is three parts, in order:
  1. **Find him.** No floating marker on this step: the kids have to search all three floors.
  2. **Put the mess right.** Ordinary job steps (pick, drop, use), different for each scene.
  3. **Take him home.** Pick the elf up and put him back through his elf door.
- The same date gives the same scene on every device (chosen from the date, not at random), so P and Dude on
  two tablets see the same mischief. **Each device has its own elf** (Alan's call): finding him on one tablet
  doesn't send him home on another. No server change.

## Non-goals (for now)

- Elf **missions** (bigger one-off stories from the home screen). These come later, one GitHub issue each.
- 24 unique scenes. We start with about 10 and repeat them; more can be added any time as data.
- The elf in the grown-ups' lists, or outside December.

## Anti-goals

- The elf is always shown where he is with a marker: then there's nothing to find.
- A scene leaves the house in a mess that something else (another job, the tree, the Advent calendars) trips
  over, or the mess survives into the next day.
- Two elves, or the elf still sitting in yesterday's spot as well as today's.

## Approaches

- **A. A daily job on the list (chosen).** Same shape as the Advent door: a holiday-tagged job, planned by the
  day planner, with a new `systems/elf.js` setting up the day's scene. Fits the engine, each scene is data,
  progress is tracked like any other job.
- **B. A home-screen mission each morning.** Tidier to build in isolation, but makes finding the elf something
  you pick from a menu rather than something waiting in the house. Kept for the later elf missions.
- **C. No job, the elf just appears.** Most magical, but nothing tells the kids he's there and there's nothing
  to track.

Alan picked A.

## Decided

- **One elf per device, shared by the players on it.** Whichever of P or Dude finds him does the clean-up; the
  job is then done for the day for both on that device. *(Claude's call, offered to Alan; not contested.)*
- **Dates:** 1-24 December, real days only (`today()`, so `?date=` works for testing).
- **The elf door:** a small door on the skirting board in the hall, on the kitchen wall by the kitchen door
  (the Advent calendars are on the living-room TV wall). It's there all of December, from the same day the calendars go up. *(Claude's call.)*

- **Once per real day, not per game day.** *(Claude's call, from the builder check.)* "Start day N+1" can be
  pressed several times on one date; the elf must not come back. Like the Advent door (`advent.hasNew()` adding
  the `adventDoor` tag in `days.js` `tagsFor`), `elf.js` keeps a real-date record in localStorage
  (`fordHouse.elf.v1`: the dates he was found) and adds a dynamic `elf` tag only while today's date isn't in it.
- **The scene is fixed when the day is planned.** *(Claude's call.)* Its id goes in the day's params next to the
  holiday tags, so a day carried on past midnight keeps its scene. `?holiday=christmas` (which pretends 15
  December) shows 15 December's scene, so it can be tried in November; otherwise outside 1-24 December he stays
  behind his door.
- **Swapping player doesn't restart him.** *(Claude's call.)* `swapPersonalJobs` leaves a job alone if it's for
  both the old and the new player and already started; the Advent door and wish list are personal and keep
  today's behaviour. Regression tests cover the swap with the Advent door.

## How it fits the code

- **Tag:** a new holiday tag `elf` for 1-24 December in `holidays.js` (same days as `advent`), and add it to the
  Christmas group's `tags` in `settings.js` so switching Christmas off switches the elf off too.
- **Rule:** `{ id: 'elf', every: 1, must: true, who: ['girl', 'boy'], holiday: 'elf' }` in `jobs/rules.js`.
  The builder must check how a non-`personal` job with `who` for two characters behaves on a character swap
  (`days.js` `swapPersonalJobs`): the job must stay done for both once either finishes it, and must not be
  duplicated or restarted when the player changes.
- **The job:** built in `christmasJobs()` (`jobs/jobs.js`) from the day's scene:
  `[findStep, ...scene.tidy, pickElf, dropElfAtDoor]`. `setup` puts the scene out, `tidy` clears it.
- **No marker:** a new step flag, e.g. `hidden: true`, that `board.js` respects when placing the floating
  marker (line ~196). The step's action button still appears when you're close enough to the elf.
- **The system:** `systems/elf.js`, created in `main.js` alongside `christmas`. It owns the elf model (an item
  in `items.js`, `elf`, with its home at the door), picks today's scene (`scene = SCENES[(dayOfYear) % n]`, or
  any stable function of the date), shows the scene's props and moves the elf there at the start of the day,
  and hides everything once the job's done. On any day outside 1-24 December everything is hidden and the elf
  sits behind his door.
- **Scenes:** a list in a new `pack/elfscenes.js` (house data, per `ARCHITECTURE.md`: spots belong in the
  pack). Each scene:
  ```js
  { id: 'loo-roll', title: 'The elf has wrapped the banister in loo roll',
    elf: { at: [x, z], level: 0, pose: 'sitting' },
    props: build => { ... },          // the mess, built once and shown on the day
    tidy: [ { kind: 'use', at: [x, z], label: 'Unwind the loo roll' }, ... ] }
  ```
- **The elf model:** small (about 0.3 m), built from boxes and cylinders like the rest of the house: red suit
  and hat, a cheeky face. Poses: sitting, hanging, lying. *(Look left to the builder; Alan to see it before
  release.)*

## Starter scenes (about 10)

Builder to pick the spots; aim for all three floors and the garden door, and a mix of easy and hard to find.
Ideas: loo roll round the banister; biscuits raided from the kitchen (crumbs to wipe, tin back in the cupboard);
the bearded dragon's terrarium decorated with tinsel (only if the dragon is switched on, otherwise skip the
scene); P's and Dude's shoes swapped round; the elf zip-wired on string across the living room; a snow angel
in flour on the kitchen counter; the Lego built into a sleigh; the cushions made into a fort; the elf fishing
in the sink; teddies lined up for a snowball fight with marshmallows.

## Left to the builder

- Exact coordinates, props and steps per scene.
- How "found" feels: a little sound and a toast with the scene's title.
- The elf's name (a placeholder like "Pip" is fine; Alan can rename it).
- Tests: a play-through test for one scene with `?date=2026-12-03`, and checks that every scene's steps can be
  done; the existing play-through test must still pass.

## Later: elf missions

Each one gets its own issue. Ideas: the elf arrives (1 December), the elf says goodbye (Christmas Eve), catch
the elf (stay up and spot him moving), the elf's report to Father Christmas.

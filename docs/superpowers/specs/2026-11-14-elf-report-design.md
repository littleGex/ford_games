# Ford House: the elf's report to Father Christmas (#160)

## Intent

A December mission for P and Dude that they want to replay: the elf is writing his nice-list report for Father
Christmas and watches while they do good deeds around the house against the clock. Each go has a fresh mix of
deeds, so there's always a reason to try again for more stars. It sits between the elf arriving (#157) and saying
goodbye (#158), giving the children something to play with him on any December day.

## Goals

- **A game to replay for stars** (Alan), not a one-off story moment.
- **A fresh list each go (approach A, Alan):** at the start the elf gives you his report with **five good deeds**
  picked at random from a pool of about twelve. Finish them before the clock runs out, then post the report.
- **Stars:** all 5 and the report posted before the clock runs out ★★★; 4 deeds ★★; otherwise ★ (every clock
  mission in the game gives at least one star, so a younger child always gets one). The report can be posted
  once 3 deeds are done (posting ends the go early). Each child's best is kept and shown under the mission card,
  like the school run. "Try again" deals a new mix. *(Claude's call, builder check.)*
- **The report on screen** at the end: the elf's letter-card style, "Report for Father Christmas", the child's name,
  each deed with a tick or not, signed by the elf (his name). Then the usual results card with the stars.
- **Offered** from the morning after he arrives (`elfLog.out(day)`) up to 23 December, while he hasn't left, with the
  Christmas group on; P and Dude buttons. *(Claude's call: Christmas Eve is the goodbye.)*

## Non-goals

- The elf moving around or having to see the deed (approach C; ideas may come with #159).
- Grown-ups playing it; a reply from Father Christmas; syncing scores across devices.
- Changing the daily "Find the elf" (it carries on as before on the same days).

## Anti-goals

- A deed the child can't do in this house today (needs the dragon when the dragon group is off; a room or item
  that isn't there) dealt into the five.
- The same five every time.
- A clock so short a younger child can never get a star, or so long ★★★ is automatic.

## Approaches

- **A. A fresh list of deeds each time (chosen by Alan).** Replay value from variety; reuses the school run's clock
  and stars. Costs writing the new kind deeds.
- **B. The same deeds every time, racing the clock.** Simplest; little reason to return once ★★★.
- **C. The elf has to see it.** Most game-like, most work (a moving elf, close to #159), can frustrate.

## Decided by Claude after the builder check

- **The daily find is left alone.** The mission can be played whether or not today's elf has been found. If he's
  been found (home through his door), he comes out and sits on the dining room windowsill to write his report; if
  not, he stays in his hiding spot "watching" and the windowsill has just the report. Ending the mission restores
  the day as now (`days.start` → `elf.reset`), so his hiding spot and mess come back untouched.
- **The windowsill** may already hold the wish list (12 to 23 December): the report goes beside it, not on it.
- **A fresh deal each go:** `Math.random` (tests swap in their own), no seed by date.
- **Deeds per child:** each deed can say who it's for (`who: ['girl']` and so on): "tidy your toys" uses that
  child's own toys job, the dragon deed is P's ("feed your bearded dragon"), and Dude gets "help P feed her
  dragon" only if the builder finds it fits; each child has at least ten deeds to draw from.

## Decided

- Replayable, stars (Alan). Approach A (Alan).
- *(Claude's calls)* Five deeds from a pool of about twelve; stars 3/4/5+posted; offered day after arrival to
  23 December; clock about three real minutes, shown as half an hour (17:00 to 17:30); the elf sits on the dining
  room windowsill (`XMAS.windowsill`) with the report, and the report is posted there, where the wish list goes;
  the report shown on screen at the end with ticks.

## The deed pool

About twelve, each a short job (one to three steps) that a child can do from the start spot. A mix of jobs the
game already has, rewritten as a kindness, and new ones. Starting list (the builder may swap one or two for what
fits the house better):

- Make your bed; tidy your toys away; brush your teeth; put your dirty clothes in the laundry basket; pair up the
  shoes in the porch; water the plants; feed the bearded dragon (only with the dragon group on).
- New (the builder fits them to each child; see "Deeds per child"): make Mum (or Dad) a cup of tea and take it to them; lay the dining table; take a plate of biscuits to your
  brother's / sister's room (the other child); draw a picture and leave it on Mum's or Dad's desk; hang up the
  coats in the hall.

Deeds use the family's names (`nameOf`), never a pronoun for a person, and grown-ups not in the family are
skipped (a deed for "Mum" picks a grown-up who's in the family).

## How it fits the code

- **Mission** `MISSIONS.elfReport` in `missions/missions.js`: `who: ['girl','boy']`, a `clock` (like `schoolRun`,
  with stars and a best), start in the living room. `setup` picks five deeds (seeded random, skipping deeds whose
  `needs` group is off or whose person isn't in the family), seats the elf on the windowsill with a report item.
  Jobs: the five deeds (in any order, all on the list at once), then "Post your report on the windowsill" once at
  least one is done (it finishes the mission early). Clock end: the mission ends with what's done.
- **Stars** from the deeds done and whether it was posted before the end; the best kept per child like the other
  clock missions.
- **The report card**: `ui/elfcards.js` card `report` (the letter paper): heading "Report for Father Christmas",
  lines "✓ <deed>" / "· <deed>", signed "<elf name>, elf".
- **Home** (`ui/home.js`, `index.html`): `#missionElfReport` with P and Dude buttons, shown per the goal above.
- **Deeds** live in a new pack file (`pack/elfdeeds.js`): `{ id, label, needs?, steps(ctx, who) }`.
- Service worker list and `CACHE_NAME` (`tests/house/sw.mjs`).

## Left to the builder

- The exact deed steps and spots, the report item model, the clock length within "about three real minutes".
- Tests: a play-through of a go with all five deeds and posting (★★★), a go where the clock runs out with three
  done (★), the dragon deed never dealt with the dragon off, every deed in the pool done at least once across
  runs; a browser test of the home card's dates and the report card at phone size.

# Ford House: the elf arrives (#157)

## Intent

The daily naughty elf (PR #161, `2026-11-14-house-elf-design.md`) just appears on 1 December. This mission gives
him an arrival: a parcel at the front door with his little door and a letter from him, which P and Dude read on
screen, then fix his door in the hall and give him a name. Playing the mission is what starts the daily elf. Each
December after that he comes back: the same elf, a "welcome back" letter, his name kept.

## Goals

- From 1 to 24 December, until he has arrived this December, the home screen shows a mission card **The elf
  arrives** with play buttons for P and Dude.
- The mission (no clock, like 3D printing):
  1. **Wait for the courier**: the bell rings, a parcel on the doorstep (the 3D printing courier).
  2. **Take the parcel in** to the dining table and **open it**: inside, his door and a letter.
  3. **Read the letter**: a letter card on screen, big friendly text the kids can read, signed by the elf.
  4. **Fix his door** to the skirting in the hall (it appears there).
  5. **First December only: name him**: a name card with a text box, "Pip" filled in. They can keep it or type
     their own.
  6. Results card: "Welcome, <name>! Look out for him tomorrow morning..." (no stars needed).
- **Until he has arrived** this December there is no elf door and no "Find the elf". He starts the **next real
  morning** after the mission (Alan): arrive on 1 December, first out on 2 December, however many game days are
  played on the 1st. His door is up from the moment it's fixed.
- **The same elf every year**: the name is kept. In later Decembers the parcel brings a welcome-back letter that
  uses his name, and there's no naming step.
- **His name everywhere**: every place that says "Pip" today (the find, pick and drop labels, the found toast, the
  scene titles) uses the chosen name, live.

## Non-goals

- Syncing the name or the arrival across devices (each device has its own elf, as before).
- Renaming him later from a settings card (could come; not in this mission).
- Grown-ups playing the mission.
- The other elf missions (#158-#160).

## Anti-goals

- No elf door on the wall, and no elf mischief, before he has arrived.
- A December where the kids never see the mission card (it must be on the home screen from 1 December).
- Pip forced on them: the name box must accept their own name.
- A name that can carry markup, or is empty (empty means "Pip").

## Approaches

- **A. A normal mission with a letter card (chosen).** A new entry in `MISSIONS`, a letter card and a name card
  (new UI, like the Advent card), and the elf store learning "arrived" and "name". Reuses the courier, the parcel
  and the job steps.
- **B. An arrival job on the daily list.** Less to build and can't be missed, but it isn't a mission, and Alan
  wants the mission to start it.
- **C. A pop-up on the first December open.** Quickest, but no parcel or door to fix: loses the play.

Alan picked A.

## Decided

- The mission starts the daily elf (Alan). Not played = no elf that December.
- The same elf comes back each year; named the first time; "Pip" is only the suggestion (Alan).
- The letter is shown on screen for the children to read (Alan).
- Per device, like the daily elf (agreed earlier).
- The elf starts the next real morning, not straight away (Alan).
- Offered 1-23 December *(Claude's call, from the builder check: arriving on the 24th would leave no morning
  for him to be found)*.
- **Played once a December.** The results card has no "Try again" for this mission and no stars; under the
  mission's home card the best line says "Arrived 3 Dec" (a `record`, like 3D printing) instead of a time.
  `arrive()` is safe to call twice and never moves the arrival later. *(Claude's call.)*
- **The cards finish their steps.** "Open the parcel" finishes when the letter card is closed; "Name him"
  finishes when "That's his name" is pressed. A small new step kind (`card`) that opens a card and waits for it
  to say it's done. *(Claude's call.)*
- **Already out this December** (the release with the daily elf went out before this one): a device whose found
  log already has a date this Advent counts as arrived, and the mission skips straight to naming him if he's
  never been named. *(Claude's call.)*

## How it fits the code

- **Store** (`js/elf.js`, key `fordHouse.elf.v1`): add `arrived` (the date he last arrived, 'YYYY-MM-DD') and `name` (cleaned with `names.js` `cleanName`; empty = `'Pip'`), next to `found`. New log
  API: `hasArrived(date)`, `arrive(date)`, `name()`, `setName(text)`, `named()` (has a name ever been given).
  Old stores (only `found`) read as not arrived, no name.
- **Starting the daily elf**: `waiting(tags, day)` is also false until `hasArrived` for that day's Advent year;
  `systems/elf.js` `reset` shows the door only once he's arrived. The arrival is stored as the real date it was
  played (`arrived: '2026-12-01'`); he's out on days whose `elfDate` is after that date and in the same Advent
  year. The door shows on days whose `elfDate` is on or after it.
- **The name, live**: `ELF_NAME` becomes a function `elfName()` (reads the store). Scene titles become functions
  of the name (`title: name => ...`). Job labels in `jobs.js` and the toast in `systems/elf.js` call it when they
  build their text, like the family names.
- **The mission** in `missions/missions.js`: `elfArrives`, `who: ['girl', 'boy']`, no clock, start spot inside
  by the front door. Jobs: the courier wait (`wait` with a delivery, as 3D printing), pick a new `elfParcel`
  item at the door, drop it on the dining table, a `use` that opens it (parcel hidden, the letter card opens),
  a `use` at the hall door spot that shows the door, and (first time) a step that opens the name card.
  `result()` returns the welcome card. Restarting the mission mid-way is fine; `arrive()` only runs on the last
  step.
- **Letter card** (`js/ui/elfletter.js` + markup in `index.html`, styled like the Advent card): a paper-coloured
  card, large text, signed with his name. Two texts: the first arrival (introduces himself, from Father Christmas'
  workshop, a bit naughty, will hide somewhere new each morning, please put things right and pop him back
  through his door) and welcome back (uses his name, missed you, ready for mischief). Written in the game's plain
  British English.
- **Name card**: same card style, a text box (maxlength `NAME_MAX`), "Pip" filled in, a **That's his name**
  button. Saves through `setName`.
- **Home screen** (`ui/home.js`, `index.html`): a mission card with P and Dude buttons, shown only while
  `holidays` include `advent` and he hasn't arrived this Advent year, and the Christmas group is on.

## Left to the builder

- The exact letter wording (Alan reads it at review).
- The parcel model, and where on the dining table it's opened.
- Tests: the store (`tests/house/elf.mjs`), a play-through of the mission (first year with a name, the next year
  without), no elf before arrival, the elf the next day under the new name, the card hidden once he's arrived;
  a browser test that reads the letter and types a name.

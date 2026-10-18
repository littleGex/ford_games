# Ford House: engine and house pack

Ford House began as a game of one house: the Fords' house, with Mum, Dad, P and Dude. Issue #78 asks for it to
fit other families, and maybe one day other houses. This note splits the code into two parts:

- **The engine.** It works for any house: the job board, the day planner, missions, characters, the three.js
  stage, saving, the HUD, and the systems that run a job (sitting, wiping, waiting, the stairs...).
- **The house pack.** This is what makes it the Ford house: the rooms and furniture, where each job happens, which
  child sleeps where, the family's pets and hobbies, the seasons and holidays they keep, and the German room names.

No rewrite is planned. Content moves into `js/pack/` a slice at a time, behind small lookups like the one the
kids' rooms use. Each slice is released on its own, and the play-through test must pass unchanged after each one.

## Where things are today

| Part | Files | Engine or house? |
| --- | --- | --- |
| Rendering, input, sound, collision | `core/*` | Engine |
| Characters, looks, players, names | `characters/*`, `players.js`, `names.js` | Engine (the default names and looks are house data) |
| Job board, planner, days, saving | `jobs/board.js`, `days/*` | Engine |
| Settings, share link | `settings.js`, `ui/settings.js` | Engine (the job groups list is house data) |
| Job systems | `systems/sitting.js`, `wiping.js`, `waiting.js`, `levels.js`... | Mostly engine; spots are hard-coded inside some |
| Holidays, seasons, Advent | `holidays.js`, `seasons.js`, `advent.js` | Engine; *which* holidays a family keeps is house data |
| **The job list** | `jobs/jobs.js` (~75 coordinates), `jobs/rules.js` | House: every job names a spot in this house |
| **Missions** | `missions/missions.js` (~29 coordinates) | Engine flow plus Ford house spots and timings |
| **Items** | `items.js` | House: what's in the house and where it starts |
| **The building** | `world/*` | House: walls, rooms, furniture, garden, the offices |
| Story systems | `systems/bedtime.js`, `birthday.js`, `deliveries.js`, `christmas.js`, `halloween.js`, `dragon.js`, `printing.js` | Engine behaviour plus Ford house spots |

House data is spread through the engine as coordinate literals. A job says `at: [2.3, 8.05]`; it doesn't say
"P's desk". To move a bed, you edit about six files.

## The target

```
house/js/
  core/ characters/ days/ jobs/board.js ui/     engine, no coordinates
  systems/                                      engine behaviour; spots come from the pack
  pack/                                         the Ford house
    kidrooms.js   whose bed, wardrobe and desk are where      (done: first slice)
    workdesks.js  where Mum and Dad work at home              (done: first slice)
    spots.js      named places: the kitchen sink, the hall cupboard, the bins...
    jobs.js       the job list, written against named spots
    rules.js      how often each job comes up, who does it
    items.js      what's in the house
    family.js     default names, looks, who's a grown-up, pets and hobbies (the job groups)
    world/        the building (today's world/*)
```

The engine asks the pack *where* and *what*. It never holds a coordinate itself. A second house would be a second
pack. That's a long way off and isn't the goal. The goal is that a change like "who sleeps where" touches one file
plus a setting, not six files.

## The rules for a slice

1. **Name the thing, not the place.** Engine code asks `roomFor(kid).desk.at` or `spot('kitchenSink')`, never
   `[4.3, 2.2]`.
2. **Live answers.** Whatever can change during play (names, who sleeps where) is a function or getter, so job
   labels and room chips update without a reload. `days.rebuild()` rebuilds today's list after a change.
3. **No change in behaviour.** The play-through and browser tests must pass as they are. A slice that moves a
   spot must say so in its PR.
4. **One slice per release**, small enough to review.

## Slices

1. **Kids' rooms** (done): `pack/kidrooms.js`. Beds, wardrobes and desks for the first-floor room and the
   attic room, with who sleeps in which. Used by homework, making the beds, the folded washing, the school run,
   bedtime, the Halloween costumes, the Christmas wish list and present, the 3D printing, and the room names. P
   and Dude can swap rooms in the settings card, and the swap travels in the share link.
   `pack/workdesks.js` does the same for Mum's and Dad's desks at home (they can swap), used by their work
   jobs and working from home.
2. **Named spots:** a `spot(name)` lookup for places used by more than one job or system (the dining table, the
   kitchen counter, the front door, the bins, the washing machine, the hall cupboard). Start with spots that
   appear in both `jobs.js` and `missions.js`.
3. **The job list:** move `jobs/jobs.js` and `jobs/rules.js` to `pack/`, written against named spots. The board,
   planner and days stay in the engine.
4. **Family defaults:** default names and looks, who's a grown-up, the job groups (dragon, clarinet, keyboard, the
   car...) to `pack/family.js`.
5. **Items:** `items.js` to `pack/items.js`. Item behaviour (carrying, placing) stays in the engine.
6. **Story systems:** take the spots out of bedtime, deliveries, birthday and Christmas, so each system takes its
   places from the pack.
7. **The building:** `world/*` to `pack/world/`. This is the biggest move, but the engine reads the building only
   through `colliders`, `roomAt` and the floor levels, so it is mostly a move of files.

After slice 3, a family can turn jobs on and off and rename people, and nearly all house-specific code lives in
`pack/`. Slices 4 to 7 are tidying up and don't change anything for players.

## What stays out of scope

- A level editor or loading houses from a file: a pack is code, reviewed like any other change.
- More than two children or more than two grown-ups: the four players are built into the HUD, the share link and
  the missions. Supporting other families means changing that, and it comes after the split, not with it.

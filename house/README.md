# Ford House

A 3D version of our house to walk around in and do jobs: hoovering, bins, mowing, charging the car,
watching TV, making the beds, putting a wash on and more. All three floors, the front and the back garden. Built from the 1:100 floor plan and photos of each room. Runs in the browser
on phones and computers, no build step.

Play: open `house/` on the site (e.g. `littlegex.github.io/ford_games/house/`).

## Home screen

The game opens on a home screen (`js/ui/home.js`): carry on with today's day, pick who's playing, see the
missions, start over from day 1, or go back to Game Zone. The
☰ button in the top corner (or Escape) brings it back. The game is paused while it's open.

## Missions

Missions are one-off storylines, started from the home screen (`js/missions/missions.js`). A mission puts
the day's list aside and gives you its own steps one after another, with its own clock; at the end a card
shows your stars, time and best (saved per kid in `localStorage`, key `fordHouse.missions.v1`), then
"Back to the day" carries on with the day.

- **The school run** (P or Dude): get out of bed, breakfast at the dining table, get dressed at your
  wardrobe, pack your school bag at your desk, put it in the basket of the bike on the terrace and cycle
  out of the back gate (you're faster on the bike). The school clock starts at 7:30 and the bell rings at
  8:00: before 7:50 is three stars, before the bell two, late one.
- Bedtime (Mum or Dad) is next.

## Floors

The first floor (Elternzimmer, Ankleide, P's room, Bad and the landing) is built in its own group,
raised by `LEVEL_HEIGHT` in `config.js`. Stand at the foot of the stairs in the hall, or at the top on
the landing, and the action button offers "Go upstairs" / "Go downstairs". While you're downstairs the
first floor is hidden so you can see in.

The attic (Dachgeschoss: Dude's room, the office and the hall) is a third group, two floors up, from
page 3 of the plan with its handwritten changes. Its stairs go up over the first-floor stairwell: stand
on the first-floor landing by the bathroom for "Go up to the attic". The roof slopes down to the front and
back; the half between the camera and the player turns see-through so you can see into the rooms.
Attic jobs and items say `level: 2`.

Everything upstairs uses plan coordinates (the same x and z as the floor plan, y = 0 at the
upstairs floor). Upstairs jobs say `level: 1` on their steps; upstairs items say `level: 1` in
`items.js`. Colliders remember which floor they were built on.

## Days

The game runs in days. Each day draws 12-14 jobs from the pool following each job's rules (dishes
daily, mowing every 4 days, bins out on bin day and back in the next day...), and the house is set up
to match: the lawn is only long on mowing days, the jacket only lies on the sofa when it's on the list,
the bins stand at the kerb the day after bin day. Some jobs are only for one of the family: Dad has a
shave every other day and works at his desk in the dressing room on weekdays (four 20-second tasks:
emails, a video call, a report, writing code that types itself out on the monitor), Mum works in the office on weekdays and makes up the sofa bed, P and Dude do homework on five days out of seven (two days off, like a weekend),
Dude practises the keyboard and the clarinet (18 seconds at his music stand, with a made-up clarinet tune) and tidies his room every few days, P tidies her toys, and Dad or Mum cooks
dinner every day (45 seconds at the hob, then served at the dining table).
Changing who you play swaps those jobs on the list straight away. Each of the kids has their own
homework spot (`HOMEWORK_SPOT` in `js/jobs/jobs.js`): P at the desk in her room, Dude at his desk in
the attic. Once a week there's a loft job: a box somewhere in the house goes up into the loft (stand
under the hatch in the attic hall, where the ladder comes down), and a week later one comes back down
to a room (`BOX_SPOTS`). Each floor has its own hoovering job; the hoover lives under the stairs, so it
has to be carried up and back; one trip does every floor on the list. Doing the washing is a chain: sort it by colour at the hamper (a little
card: whites, colours, darks), load the machine, wait for it, then carry the wet washing up to the airer
in the office; the next day it's folded and each pile goes to the right wardrobe (Dude's, P's, and Mum
and Dad's in the dressing room). Washing the terrace windows means wiping each one in circles with the
stick. Surprise events (post, a parcel at the door, a power cut, and rain while the washing is out on
the line: get it in before the countdown runs out) turn up on some days. Sometimes the driver brings a
parcel for one of the neighbours (left or right, as you look at the house from the street): take it in,
keep it in the hall till they're home, then either carry it round to their front door, or they come
round and ring, and you say hello, fetch it and hand it over. The neighbours' houses either side are
our house mirrored, with light grey front doors and window frames, and you can walk along the front
of the row to their doors.

The garden follows the real seasons (`js/seasons.js`). In autumn (September to November) the trees and
bushes turn orange, red and yellow, leaves lie about and drift down, and every few days the leaves on the
back lawn need raking up and tipping into the brown bin. In winter (December and January) there's snow
on the ground and the bushes, snowflakes fall, the path and pavement out front need clearing with the
snow shovel, and there's no mowing. Add `?season=autumn` (or `winter`, `spring`, `summer`) to the
address to try a season out. Jobs say which seasons they belong to with `season: [...]` in `rules.js`. When the last job is done a "Day N complete" screen shows how long it took and
what's coming tomorrow, then the next day starts.

Progress is saved in the browser (`localStorage`, key `fordHouse.save.v1`), so each phone has its own
house: closing the page and coming back carries on with the same day and the same list. A job that
was half done starts again from the beginning. "Start over from day 1", under the job list and on
the Day complete screen, wipes the save (after a confirm).

## Run it locally

ES modules need a web server, so opening the file directly won't work. From the repo root:

```sh
python3 -m http.server 8000
# then open http://localhost:8000/house/
```

three.js r128 is loaded from jsDelivr through the import map in `index.html`.

## Controls

- Phone: drag the stick to walk, tap the orange button to act, "Turn view" rotates the camera.
- Keyboard: WASD or arrows to walk, E or Space to act, Q to turn the view.
- Buttons bottom right switch between Dad, P and Dude.

## How the code is organised

```
house/
  index.html            page, HUD markup, import map
  css/house.css         HUD styling
  js/
    main.js             wires everything together, runs the frame loop
    config.js           tunable numbers: speeds, reach, camera, event timings
    state.js            shared state (what you carry, sitting, power on/off...)
    core/               renderer & lights, textures, building helpers, collision, input, sound
    world/              the house: structure.js (walls, floors, stairs), rooms/*, outside/*, tv.js, rooms.js
      upstairs/         the first floor: structure.js (slab, walls, stairwell), one file per room
      attic/            the attic: structure.js (roof, knee walls, stairwell), one file per room
    characters/         figure builder, family looks, the player
    items.js            everything you can pick up
    jobs/
      rules.js          how often each job comes round (tune the game here)
      jobs.js           the jobs: steps, plus how the house looks when each one needs doing / is done
      board.js          runs today's jobs: markers, the action button, pick / drop / use / sit / sort / wipe
    days/
      planner.js        picks each day's jobs from the rules (pure logic, tested in Node)
      days.js           starts days, sets the house up, saves progress, Day complete screen
      save.js           reading and writing the save
    systems/            things that happen over time: power cuts, post & parcels, sitting jobs,
                        mowing, hoovering, car charging, the washing machine (waiting.js),
                        plant growth, and levels.js for the stairs
    ui/hud.js           room chip, job list, banner, toasts
```

The tests live with the rest of the repo's tests, in `tests/house/` (Node play-through) and
`tests/e2e/house.spec.js` (browser).

Coordinates are plan metres: x runs from the gable wall (0) to the party wall (5.64), z from the
terrace side (0) to the street side (8.88), on both floors. The back garden is negative z, the street
is beyond 13.

## Adding a job

1. Add how often it comes round to `js/jobs/rules.js`:

   ```js
   { id: 'cushion', every: 2 },
   ```

   `every: N` days (1 = daily). `after: { job: 'x', days: 1 }` makes a follow-up job (like bins back
   in). `must: true` always puts it on the list when due. `week: 5` means the first 5 days of every 7.
   `who: ['dad']` (or `'mum'`, `'girl'` for P, `'boy'` for Dude) makes it a job only for them, always on their
   list when due. The day is filled in this order: must jobs and the player's own jobs, the daily
   routine, then "appointments" (jobs every 3+ days), most overdue first and never early (on a full day
   one can be a day late), then the every-other-day jobs. With this many jobs those come round every few
   days rather than every two; raise `DAY_JOBS` in `js/days/planner.js` for longer days.

2. Add the job itself to `js/jobs/jobs.js`. A job is a list of steps:

   ```js
   { id: 'cushion', title: 'Plump the cushion', steps: [
     { kind: 'pick', item: 'cushion', label: 'Pick up the cushion' },            // at: defaults to the item
     { kind: 'drop', item: 'cushion', at: [0.7, 2.4], place: [0.7, 0.42, 2.4], label: 'Put it on the sofa' },
   ] }
   ```

   Step kinds: `pick`, `drop` (`place`, `at` + `y`, or `home: true`), `use` (with `onDone(ctx)`),
   `sit` (timed, see the TV, coffee, teeth and shower jobs; `stand: true` to stand, `fx` for steam or
   shower water), `wait` (runs by itself, like the washing machine), `sort` (the sort-the-washing card,
   `js/ui/sorting.js`), `wipe` (wipe a window by moving the stick in circles, `dirt: n` says which,
   `js/systems/wiping.js`), and `mow` / `hoover` / `charge`, which are driven by their system in
   `js/systems/`. Add `level: 1` (or `level: 2` for the attic) to steps that happen upstairs.

   Items start every day at their home spot from `js/items.js` (the "needs doing" position). On days
   the job isn't on the list it's shown done: by default its items are moved to where its drop steps
   leave them. For anything else, give the job `setup(ctx)` (make it need doing: grow the lawn, dirty
   the windows) and `tidy(ctx)` (show it done).

New carryable things go in `js/items.js`.

## Tests

```sh
npm run test:house
```

Runs two Node tests (no browser needed):

- `tests/house/planner.mjs` simulates 120 days with several random seeds and checks the day rules:
  12-14 jobs a day, mowing exactly every 4 days, bins out every 4 and back in exactly the next day,
  daily jobs nearly every day, appointments never early.
- `tests/house/playthrough.mjs` builds the whole game in Node with a stand-in for three.js and plays
  12 days in a row like a kid would: walks to every job step (checking it can be reached on foot from
  the front path, or from the top of the stairs upstairs, and taking the stairs with the button), finishes every job including the post, parcel and a power cut, waits for Day
  complete and starts the next day. Each morning it checks the house matches the list (lawn, bins,
  jacket, windows, shopping), that bin pairs alternate, and that progress is saved. Then it plays any
  job that hadn't come up, and checks "start over".

Both exit non-zero on a problem. CI runs them on every push. `tests/e2e/house.spec.js` holds the
Playwright browser tests (page loads, day 1 has 12-14 jobs, keyboard walking, picking up and putting
down an item, Day complete and the next day surviving a reload, start over from both places, each
character's own jobs, the stairs), run with `npm run test:e2e`.

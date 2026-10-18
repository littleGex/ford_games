# Ford House

A 3D version of our house to walk around in and do jobs: hoovering, bins, mowing, charging the car,
watching TV, making the beds, putting a wash on and more. All three floors, the front and the back garden. Built from the 1:100 floor plan and photos of each room. Runs in the browser
on phones and computers, no build step.

Play: open `house/` on the site (e.g. `littlegex.github.io/ford_games/house/`).

## Home screen

The game opens on a home screen (`js/ui/home.js`): carry on with today's day, pick who's playing, see the
missions, start over from day 1, or go back to Game Zone. The
☰ button in the top corner (or Escape) brings it back. The game is paused while it's open.

**The first visit** (`js/ui/setup.js`): the first time the game opens on a device, a short setup comes up over
the home screen: the grown-ups (names, she/he/they, a family with one grown-up), the children (names, she/he/they,
birthdays), who sleeps where, and which jobs fit. Each choice is used straight away, so leaving early (Escape)
keeps what's done; "Play as Dad, Mum, P and Dude" keeps the usual family. A game token instead brings the
family's settings from the family server. It isn't shown again on that device, nor on a device that has played
before, nor when the game was opened from a share link (that asks about its own settings). Tests mark it done
before the page loads, except the setup's own (`tests/e2e/house.spec.js`).

**Looks and birthdays** (`js/ui/avatar.js`, from the home screen): change how each of the four players looks,
with a turning preview: skin, hair style (long, shoulder, ponytail, bun, swept, short, spiky, a beanie or
bald) and colour, glasses, a beard, top (their own or a colour), trousers and
shoes. Any grown-up can have a beard (Mum and Dad, and P or Dude from 18). Give each a birthday: the age decides whether P and Dude are children (under 13), teenagers (13 to
17) or grown-ups (18 and over). Teenagers are taller and cook dinner too (`teen: true` in `rules.js`).
Everything is saved on the device only (`js/players.js`, `localStorage`), never in this repository. Dad is
bald with a beard by default.

**Names** (`js/names.js`): each player's name can be changed at the top of the names, looks and birthdays card
(Dad, Mum, P and Dude by default). The game knows them as dad, mum, girl and boy; everything that shows a name
asks `names.js` when it builds its text, so a new name shows on the buttons, in job titles ("Fix Pia's bike"),
missions, the Advent calendars and the room chips. Names are cleaned up (letters, numbers, spaces, - ' and .,
at most 16 characters), so they can never carry markup.

**She, he or they** (the same card): how the game talks about each player in jobs and missions ("her bed",
"his teeth", "their iPad"). Dad and Dude are he and Mum and P are she unless it's changed (`names.js`:
`pronounOf`, `their`).

**A family with one grown-up** (the same card, on Mum's or Dad's page): leave one of them out. Their buttons and
missions disappear, and the game carries on as the other one. Their household jobs (the bike, the solar panels,
the sofa bed: `cover: true` in `rules.js`) and the 3D printing go to the grown-up who's there. Their own jobs
(shaving, their work) and their birthday party don't come. Texts like "Make a present for Mum and Dad" name just
the one (`grownUpNames()`). Children always play, and there's always at least one grown-up.

**Bedrooms** (`js/pack/kidrooms.js`, in the rooms, jobs and sharing card): P sleeps in the room on the first
floor and Dude in the attic, unless they swap. Their bed, wardrobe and desk go with them: homework, making the
beds, the folded washing, the school run, bedtime, the Halloween costumes, the Christmas wish list and present,
and the 3D-printed models all use the new room, and the room chips say whose room is whose. The terrarium, the
toys, the Lego, the keyboard and the clarinet stay where they are.

**Jobs, and sharing** (`js/settings.js`, `js/ui/settings.js`, from the home screen): switch groups of jobs off
that don't fit a family (the bearded dragon, keyboard practice, the clarinet, the bike, the solar panels, the
car, shaving, the loft) and the special days (Halloween, Christmas and the Advent calendars, birthday parties).
They're never planned while they're off. **Share the link** makes a link with everyone's names, looks,
birthdays, the switches and who sleeps where, in the part after `#` (which never reaches a server); opening it on another phone
or tablet asks first, then copies them there. The family server token is never in it, and everything in a
link is checked before it's used.

**Birthdays** (`js/systems/birthday.js`): on a player's birthday the dining room has balloons and a "Happy
birthday" banner with their name, and four jobs come on the list: decorate (blow up the balloons, hang the
banner), the cake (from the fridge to the table, candles, everyone sings, blow them out, cut it), presents
(the birthday person opens theirs; everyone else wraps one), and Grandma and Grandpa at the door with another
present. Add `?birthday=girl` (or `dad`, `mum`, `boy`) to the address to try one, `?birthday=none` to stop it.

**The family server** (`js/familyserver.js`): the birthdays can come from fordDbs (`GET /v1/game/family`). A
parent types the game token into the looks card once per device; it's kept on that device only. The game asks
in the background with a short time limit and never waits: offline, or without a token, it uses the
birthdays saved on the device. If the answer makes today someone's birthday before anything's been done, the
day is planned again with the party jobs.

**The same settings on every device** (`js/settingsync.js`): with the game token, the names, looks, jobs on or
off and who sleeps where are kept on the family server too (`GET` and `PUT /v1/game/settings`), so every phone
and tablet has the same. The game pulls them when it opens and when it comes back to the front, and pushes a
change a couple of seconds after it's made. The server keeps a version number. If another device saved in
between, the server answers 409 with its copy, and the game puts back only what was changed on this device
(each player's name and look, the jobs, the bedrooms) and saves again. A device connecting for the first time
takes the family's settings from the server. Offline, nothing changes and the changes go up next time. The
rooms, jobs, and sharing card shows when the settings were last synced. The share link still works without a
server.

## Missions

Missions are one-off storylines, started from the home screen (`js/missions/missions.js`). A mission puts
the day's list aside and gives you its own steps one after another (some with a clock); at the end a card
shows how you did (saved in `localStorage`, key `fordHouse.missions.v1`), then "Back to the day" carries on
with the day.

- **The school run** (P or Dude): get out of bed, breakfast at the dining table, get dressed at your
  wardrobe, pack your school bag at your desk, put it in the basket of the bike on the terrace and cycle
  out of the back gate (you're faster on the bike). The school clock starts at 7:30 and the bell rings at
  8:00: before 7:50 is three stars, before the bell two, late one.
- **Work from home** (Mum or Dad): the day runs from 7:00 to 17:00 (five minutes). Get up, shower, get
  dressed and have breakfast, then the working day puts several things on the list at once, to do in any
  order: the team meeting at 9:00 and the project meeting at 14:00 at your desk (Dad's in the dressing
  room, Mum's in the attic office), emails, a report, more work, lunch from 12:00 and a glass of water.
  Coffee and snacks are there whenever you like, and some time in the day the phone rings with an urgent
  call to join within 20 minutes. At a desk the job due soonest comes first. Stars: on time for every
  meeting, done by 17:00, and taking a break.
- **Work at the office** (Dad), 7:00 until home by 17:30: get up, dressed and breakfast, then cycle out
  of the back gate to the office (`js/world/office.js`, built from Dad's sketch: open-plan desks, the
  boss's office, a meeting room, Dad's room, the kitchen and a bathroom, a bike rack outside, a road on
  one side and a courtyard on the other). Clock in at the machine by the door, then the working day in
  any order: the meeting with the boss at 10:00 at his round table, the team meeting at 14:00 in the
  meeting room, emails, a report and code at Dad's desk, lunch from the kitchen fridge, water; coffee,
  snacks and the bathroom whenever you like. The phone rings once with an urgent call, and once in the
  day the fire alarm goes off: out through the fire door to the assembly point and wait 30 seconds for
  the all-clear, with nothing else allowed meanwhile. Then shut down, clock out, cycle home and put the
  bike back on the terrace. Stars: on time for the meetings, home by 17:30, a break.
- **Work at the office, Mum**, 7:00 until home by 17:30, at her office site (`js/world/mumoffice.js`,
  from her sketches): drive there (the car leaves the house and turns up in her car park), cross the road
  on the zebra crossing, badge through the security turnstiles, clock in just inside the office building
  (a coffee at the café in the garden if she likes), then the lift or the stairs up to her office floor.
  The working day up there, in any order: the team meeting at 10:00 and a meeting with her manager at
  14:00 in the meeting room, emails, spreadsheets and a report at her desk, lunch from the kitchen fridge,
  water; coffee, a snack and the WC whenever she likes. An urgent call, and a fire drill (take the stairs,
  the lifts don't run, and go out to the assembly point in the garden). Then shut down, back down, clock
  out, badge out and drive home. Her clock runs a little slower than the other days (her site is twice
  the walk).
- **3D printing** (Dad, no clock, just for fun): open the laptop at your desk and pick a design (a dragon
  for P, a plant pot, a phone stand, a rocket for Dude), then order a spool of filament in a colour you
  pick. A courier brings it to the front door; load it into the printer in the light-box cupboard by the
  sofa, send the print from the laptop and watch the model grow layer by layer, then take it out and put
  it where it belongs. The card lists everything you've made so far.
- **Bedtime** (Mum or Dad), from 19:45, in the evening (`js/systems/bedtime.js`: dark outside with a moon,
  lights on in the house). P and Dude are on the sofa with their iPads; tell each to switch off and they
  follow you about. Upstairs, choose who goes in the shower first; for each child a shower, pyjamas from
  their wardrobe and teeth at the basin. A story on P's bed (pick the book), then tuck each into bed (P in
  her room, Dude in the attic) and switch their light off. Two to four things go wrong each evening: lost
  pyjamas, "Not that story!", goodnight to the dragon, a glass of water, a dance party on the landing, back
  on the iPad, or hide and seek. Stars for when both lights are out: by 20:30 three, by 20:45 two. Tiptoe
  back downstairs to finish: the hall light goes off and the little stair light comes on.

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
of the row to their doors. The food shopping is ordered and delivered: Mum and Dad check the fridge
and order on the phone from the sofa, then a delivery van pulls up and the driver brings the bag to the
door; P and Dude just answer the door and put the food away.

P has a bearded dragon in a terrarium in her room. She feeds it crickets and greens from the box on the
windowsill, plays with it (it sits on her hand while she sits on her bed) and cleans out the terrarium (scoop the
mess, rinse and refill the water bowl at the bathroom basin). Once it's been fed and played with it's
happy: its colours warm up and it bobs its head.

The shed at the bottom of the garden has solar panels on its roof and Dad's workbench beside it. Anyone
can trim the bushes when they get shaggy (not in winter) and tip the clippings in the brown bin; Dad
fixes P's bike at the workbench, and when the solar reading on the cabinet under the stairs is low he
brushes the panels clean in circles with the long brush.

The garden follows the real seasons (`js/seasons.js`). In autumn (September to November) the trees and
bushes turn orange, red and yellow, leaves lie about and drift down, and every few days the leaves on the
back lawn need raking up and tipping into the brown bin. In winter (December and January) there's snow
on the ground and the bushes, snowflakes fall, the path and pavement out front need clearing with the
snow shovel, and there's no mowing. Add `?season=autumn` (or `winter`, `spring`, `summer`) to the
address to try a season out. Jobs say which seasons they belong to with `season: [...]` in `rules.js`.

On Halloween (31 October, `js/holidays.js`) the house is decorated: pumpkins and a string of orange lights at the
front door, bats and webs on the dining room window and round the door, a ghost in the hall. Three jobs come on
the list: carve a jack-o'-lantern (fetch the pumpkin from the garden, scoop it out at the dining table, pick a
face on a card, carve it, put a tea light in, take it to the front step), decorate the house, and trick or
treat. Mum and Dad put the sweets by the door and hand them out to two lots of trick-or-treaters who come up
the path and ring; P and Dude pick a costume from their wardrobe (witch, vampire, ghost, black cat or pumpkin),
dress up and ring both neighbours' bells with their pumpkin bucket. Add `?holiday=halloween` to the address to
try it on any day (`?holiday=none` switches it off). Jobs say which day they belong to with `holiday: '...'`.

At Christmas (12 December to 5 January, `js/holidays.js`) the house is decorated: a tree in the living room
corner by the bookshelf (fairy lights, baubles, a star, presents underneath), the Advent wreath on the dining
table with one more candle lit each Advent Sunday, paper stars in the dining room window, a wreath by the front
door, and fairy lights along the front of the house. Christmas jobs: decorate the tree (the box of decorations
lives in the cupboard under the stairs), bake biscuits (mix, pick a cutter, cut out, bake, take them to the
table), wrap a present for under the tree (P and Dude make one at their desk), and for the kids a wish list on
the windowsill for the Christkind. On Christmas Eve the presents appear under the tree when the little bell
rings, and everyone opens theirs; on 5 January it all comes down and the tree goes out by the street.

**The Advent calendars** (`js/advent.js`, `js/ui/advent.js`): P's and Dude's hang on the TV wall from 1 December.
One more door can be opened for every real day of December (doors they missed can be opened later, never one
whose day hasn't come). P and Dude get "Open your Advent calendar" on their list while a door is waiting; anyone
can look at both calendars on the wall or from the home screen, and the card lists every gift found so far.
What's been opened is saved on the device; a new Advent starts with the doors shut.

Add `?date=2026-12-24` to the address to pretend it's that day (Christmas, the Advent doors, the season), or
`?holiday=christmas` for a day like 15 December.

When the last job is done a "Day N complete" screen shows how long it took and
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
    characters/         figure builder, looks (the editor's options), family, the player
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
    familyserver.js     birthdays from the family server (fordDbs), and the game token
    settingsync.js      names, looks, jobs and bedrooms kept the same on every device through the family server
    pack/kidrooms.js    the Ford house's kids' rooms: whose bed, wardrobe and desk are where
    ui/hud.js           room chip, job list, banner, toasts
```

The code is being split into an engine that works for any house and a house pack with what makes it the Ford
house (`js/pack/`). See [ARCHITECTURE.md](ARCHITECTURE.md) for the plan and the slices still to do.

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

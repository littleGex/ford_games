# Ford House

A 3D version of our house to walk around in and do jobs: hoovering, bins, mowing, charging the car,
watching TV and more. Built from the 1:100 floor plan and photos of each room. Runs in the browser
on phones and computers, no build step.

Play: open `house/` on the site (e.g. `littlegex.github.io/ford_games/house/`).

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
    characters/         figure builder, family looks, the player
    items.js            everything you can pick up
    jobs/
      jobs.js           the job list (data)
      board.js          runs jobs: markers, the action button, pick / drop / use / sit
    systems/            things that happen over time: power cuts, post & parcels, sitting jobs,
                        mowing, hoovering, car charging, plant growth
    ui/hud.js           room chip, job list, banner, toasts
  tests/                play-through test that runs in Node (no browser)
```

Coordinates are plan metres: x runs from the gable wall (0) to the party wall (5.64), z from the
terrace side (0) to the street side (8.88). The back garden is negative z, the street is beyond 13.

## Adding a job

Add an entry to `js/jobs/jobs.js`. A job is a list of steps:

```js
{ id: 'cushion', title: 'Plump the cushion', every: 1, steps: [
  { kind: 'pick', item: 'cushion', label: 'Pick up the cushion' },            // at: defaults to the item
  { kind: 'drop', item: 'cushion', at: [0.7, 2.4], place: [0.7, 0.42, 2.4], label: 'Put it on the sofa' },
] }
```

Step kinds: `pick`, `drop`, `use` (with `onDone(ctx)`), `sit` (timed, see the TV and coffee jobs),
and `mow` / `hoover` / `charge`, which are driven by their system in `js/systems/`.
New carryable things go in `js/items.js`. `every` (days) is for the day planner.

## Tests

```sh
npm run test:house
```

Builds the whole game in Node with a stand-in for three.js, checks that every job step can be
reached on foot from the front path, and plays through every job including the post, the parcel
and power cuts. Exits non-zero if anything is unreachable or can't be finished.

CI runs it on every push. `tests/e2e/house.spec.js` holds the Playwright browser tests (page loads,
jobs appear, keyboard walking, picking up and putting down an item), run with `npm run test:e2e`.

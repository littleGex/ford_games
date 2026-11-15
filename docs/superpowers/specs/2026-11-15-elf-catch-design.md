# Ford House: catch the elf (#159)

## Intent

An evening mission for P and Dude: the house is dark, the children are meant to be in bed, and the elf is creeping
about. Stay up and spot him as he hops between hiding places, before he notices you. It's hide-and-seek for its own
sake (Alan): a game to replay for stars, alongside the elf's report (#160). It sits between the elf arriving (#157)
and saying goodbye (#158).

## Goals

- **Hide-and-seek for its own sake** (Alan). The fun is the chase, not a reward afterwards.
- **Peek-a-boo (approach A, Alan):** the elf hops between four or five hiding spots around the house, across the
  floors, staying a few seconds at each. Get within reach while he's out and press "Spot him!" for a sighting.
  Stars from sightings: three or more ★★★, two ★★, otherwise ★ (every clock mission gives at least one star).
  More sightings than three still count towards your best (below).
- **Too close and he freezes** (the issue): if you're already standing at a spot when he arrives there, he freezes
  stiff like a toy and vanishes to the next spot; it doesn't count.
- **Replayable:** a fresh route of spots each go; each child's best kept and shown under the card, like the school
  run; "Try again".

## Non-goals

- Showing or hinting where tomorrow's mischief will be (Alan: "don't spoil tomorrow").
- A view cone, sneaking past his gaze, or a torch (approaches B and C).
- Grown-ups playing it; catching him for real (he's never "caught", only spotted).

## Anti-goals

- Spoiling the morning find: tomorrow's scene, its spot or its mess seen tonight.
- A child who can't find him at all and gives up (he must be findable without knowing the house well).
- Changing today's "Find the elf" (still to do afterwards if it wasn't done).

## Approaches

- **A. Peek-a-boo (chosen by Alan).** Spots on a timer, sightings for stars, freeze when you're too close. Simple to
  understand, a young child gets a star, reuses bedtime's darkness and the elf's spots.
- **B. Sneaking.** He looks around; creep up while his back is turned; caught looking and the go ends. Most
  stealthy, needs a visible line of sight, a young child fails a lot.
- **C. Torch hunt.** Properly dark, he's only seen in your torch beam. Lovely, but a moving light is the heaviest
  thing to draw on a phone and would feel different on every device.

## Decided by Claude

- **When it's offered:** the same days as the report: from the morning after he arrives to 23 December, while he
  hasn't left, with the Christmas group on; P and Dude buttons. (Christmas Eve is the goodbye.)
- **The clock:** 20:00 to 20:30 game time, about three real minutes (`secondsPerMinute: 6`), like the report. The
  go ends when it runs out.
- **The dark:** the bedtime night lighting (`systems/bedtime.js` NIGHT: moonlight, lamps low), restored afterwards.
- **The spots:** a pool of evening hiding spots across the ground floor, upstairs and the attic (behind the sofa, on
  the stairs, by a bed, on the landing, in the bathroom…), with just the elf, no mess props. **Tomorrow's scene spot
  is never used** (`pickScene` for the next date; no evening spot within a metre of its elf place), and no scene's
  mess props are ever shown.
- **The route fills the clock** (builder check): hops keep coming until 20:30; the go ends only when the clock runs
  out. A route is drawn as it goes (a fresh random spot each hop, never the same spot twice in a row); mostly on
  the same floor as the last one, about one hop in three to another floor.
- **Timing:** he lands at a spot and stays about 9 real seconds on the same floor, about 14 after a change of floor
  (time to climb the stairs), then hops on, about a second hidden between spots. A freeze sends him on at once.
- **Finding him:** when he lands, a hint toast names the floor and room ("A giggle upstairs… in the bathroom?"), and
  the same line shows under the mission's job, so a child always knows where to go. Clue text, not a map marker.
  No hint of the next spot before he lands (so waiting at a spot doesn't pay; that's what the freeze punishes).
- **Spotting:** a "Spot him!" action when within reach of him while he's out (a `use` at his spot, like the daily
  find). A sighting counts once per stop; he hops on straight after, with a little wave.
- **Freezing:** if the player is within reach of a spot at the moment he arrives there, he freezes (stiff, a beat),
  then vanishes early to the next spot, with a toast ("He saw you! He's gone stiff as a toy…").
- **Today's elf:** during the go the evening elf is the only elf out; today's scene and mess are hidden. Ending the
  go restores the day (`days.start` → `elf.reset`), as the report does.
- **Results:** title "Elf spotter!" (3★) / "Nearly had him!" (2★) / "He's a quick one!" (1★); stats
  "<n> sightings".
- **The best** (builder check): kept as stars and the number of sightings; more sightings beats fewer at the same
  stars. Shown under the card as "★★★ 5 spotted" rather than a time (every go ends at 20:30).

## How it fits the code

- **Mission** `MISSIONS.elfCatch` in `missions/missions.js`: `who: ['girl','boy']`, the clock with `endsAtClock`,
  an `update` that runs the hops on the mission clock, and `result`.
- **Spots** in `pack/elfspots.js` (new): `{ id, level, at, place, rotY, hint }`; a `route(n, { exclude, rand })`.
- **The elf system** (`systems/elf.js`): a way to put the elf at a spot, freeze him, and hide him, reusing his wave.
- **Night** from `systems/bedtime.js` (its night lighting on and off), without starting bedtime's own jobs.
- **Home** (`ui/home.js`, `index.html`): `#missionElfCatch` (🔦 or 👀) with P and Dude buttons, shown per above.
- Service worker list and `CACHE_NAME` (`tests/house/sw.mjs`).

## Left to the builder

- The exact spots (reachable, visible at night, at least one per floor), stay and gap timings within "a few
  seconds", the hint wording, the freeze look.
- Tests: a play-through with a fixed route (three sightings → ★★★; standing at the next spot → he freezes and no
  sighting; the clock running out ends it with what's done); tomorrow's scene spot never in a route over many
  deals; the day's elf back afterwards; a browser test of the home card's dates.

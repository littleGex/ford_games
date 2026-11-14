# Ford House: the elf says goodbye (#158)

## Intent

The elf arrives mission (#157, `2026-11-14-elf-arrives-design.md`) starts the elf's December; this mission ends it.
On Christmas Eve, instead of a morning's mischief, he leaves P and Dude a trail of notes about the mischief they
found together, ending at his little door where he says goodbye, waves, and goes home to the North Pole until next
December. It completes the elf story so the children get a send-off, not an elf who just stops turning up.

## Goals

- **Christmas Eve replaces the daily find** (Alan): on 24 December there is no "Find the elf" and no mischief
  scene. The goodbye is his last morning.
- **A mission card** "The elf says goodbye" on the home screen, on 24 December only, while he has arrived this
  Advent, and the Christmas group is on. **Each child says their own goodbye** (Alan): the card has a play button
  for each child who hasn't said goodbye yet, and hides once both have.
- **The trail (approach A, Alan):** the mission starts in the living room. Steps:
  1. A note at the Advent calendars (the last door): the first note card.
  2-4. Three notes, each at the spot of a mischief scene they found this December. Each note is a card on screen
     (the letter card style) that remembers that morning ("Remember the zip wire across the living room? That
     was my favourite!") and gives a clue to the next note (that scene's room, the same words as its first
     where's-the-elf clue). The last note's clue sends them to his door in the hall.
  5. At his door he is sitting with a goodbye letter: the letter card, to the child playing, signed with his name,
     "see you next December". Closing it: he waves and goes through his door. The door disappears after the
     second child's goodbye; after the first it stays (he's still waiting to say goodbye to the other).
  6. Results card: "Goodbye, <name>!" with "You found <name> N times this December." No "Try again", no stars.
- **Which notes:** from the scenes found this Advent (found dates in December, scene of each date via
  `pickScene`), three different scenes: the first found, one from the middle, the most recent. Fewer than three
  found: the rest are filled from fixed spots (the Christmas tree, the dining table), with their own lines.
- **After both goodbyes:** his door is gone for the rest of the Advent year (and Christmas Day on has no `advent`
  anyway). His name and arrival record are kept; next December the arrival mission brings him back as before.

## Non-goals

- A goodbye on any day but 24 December; offering it late (25 December on) if it was missed.
- Grown-ups playing it; syncing across devices.
- Glitter footprints between notes (could come later as decoration).
- #159 and #160.

## Anti-goals

- The elf out with a mischief scene on Christmas Eve as well as the goodbye.
- A goodbye before he has arrived this December (no card if he never came).
- The children unable to finish because a note sits somewhere unreachable or inside furniture.
- Markup from the elf's name in any note (text only, as with the letter).

## Approaches

- **A. A trail of notes (chosen by Alan).** Personal (their own mornings), a real hunt, reuses the letter card,
  the card step and the scenes' clues. Costs a memory line for each of the ten scenes.
- **B. Glitter footprints to his door.** Very visual but no hunt, nothing personal, most 3D work (footprints on
  every floor and the stairs).
- **C. One last big mischief, then goodbye.** Simplest, but feels like any other morning.

## Decided

- Replaces the 24 December find (Alan). Approach A (Alan).
- *(Claude's calls)* Offered on 24 December only; starts at the Advent calendars; three notes chosen first /
  middle / latest; fallbacks the tree and the dining table; door gone after goodbye for that Advent; name kept.
- Each child says their own goodbye (Alan). The store remembers each child's goodbye this Advent
  (`left: { girl: 'YYYY-MM-DD', boy: ... }`); a child can't replay theirs the same December. *(Claude's call: no
  "Try again", like the arrival.)*

## How it fits the code

- **Store** (`js/elf.js`): add `left` (per child) next to `arrived`, `found`, `name`. New API `leave(who, day)`,
  `saidGoodbye(who, day)` and `hasLeft(day)` (both children, same Advent year, on or after). `waiting()` is false on `christmasEve` days. `systems/elf.js reset` hides the door once
  he has left. A new helper returns this Advent's found scene ids in order (date → `pickScene` with the scenes that
  were allowed; good enough to use today's settings).
- **Scenes** (`pack/elfscenes.js`): each scene gains `memory: name => '...'` (one sentence, his voice). The clue to
  a scene reuses its `hint[0]`.
- **Notes**: a small folded-paper item on the floor or furniture at the scene's elf spot (`elf.place`, the spot
  he sat that morning), on that scene's level; the step is a `card` step with `card: 'note'` and the note text.
  `ui/elfcards.js` gains a `note` card (the letter style, shorter) and a `goodbye` letter.
- **The mission** (`missions/missions.js`): `elfGoodbye`, `who: ['girl', 'boy']`, `once: true`, no clock,
  start in the living room. Jobs built at start from the chosen scenes. The last step closes the goodbye letter,
  plays the wave, hides the elf (and the door if the other child has said goodbye), and calls
  `leave(who, today)`.
- **Home** (`ui/home.js`): `#missionElfGoodbye` shown per the goal above, each child's button hidden once they've
  said goodbye; the arrival card stays as it is.
- **Service worker**: new files listed, `CACHE_NAME` bumped (`tests/house/sw.mjs`).

## Left to the builder

- The note, memory and goodbye wording (Alan reads it at review), in the game's plain British English.
- The note model, and the wave (a short arm/hat animation is enough).
- Tests: the store (`leave` per child, `hasLeft` after both, no waiting on Christmas Eve), P then Dude each
  playing with the door gone only after Dude, a play-through of the mission (three found scenes; one
  found scene + fallbacks), the card shown only on the 24th after arrival and before goodbye, no "Find the elf" on
  the 24th, the door gone after; a browser test reading a note at phone size.

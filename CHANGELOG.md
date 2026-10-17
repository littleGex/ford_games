# Changelog

What changed in each version of Game Zone (Ford Games), newest first. The current version is the
`version` in `package.json`, shown at the bottom of the Game Zone page.

The layout follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the numbers follow
[semantic versioning](https://semver.org/): a new game or a big new feature bumps the middle number,
fixes and small additions bump the last one. While working, add a line under **Unreleased** in the same
pull request; at release time that section becomes the new version (see "Releasing" in `README.md`).

## [Unreleased]

## [4.11.0] - 2026-10-17

### Added
- Ford House: **Christmas**, from 12 December to 5 January (#75). A tree in the living room with fairy lights,
  baubles, a star and presents underneath; the Advent wreath on the dining table (one more candle each Advent
  Sunday); paper stars in the window, a wreath by the front door and fairy lights along the house. Jobs:
  decorate the tree, bake Christmas biscuits (pick a cutter), wrap a present for under the tree (P and Dude make
  one), and the kids' wish list on the windowsill. On Christmas Eve the little bell rings and the presents are
  opened; on 5 January it all comes down and the tree goes out for the collection (#99).
- Ford House: **Advent calendars** for P and Dude, on the living room wall from 1 December. One more door for
  every real day (missed doors can be opened later, future ones never); the gifts behind the doors are kept on
  the device and listed on the calendar card, which anyone can look at from the wall or the home screen (#99).
- Ford House: `?date=YYYY-MM-DD` in the address pretends it's that day, for trying the special days out (#99).

## [4.10.0] - 2026-10-17

### Added
- Ford House: **looks and birthdays** for the four players, from the home screen (#77). Change each player's
  skin, hair style and colour, glasses, beard (Dad, and Dude once he's 18), top, trousers and shoes, with a
  turning preview. Give them a birthday: P and Dude grow up with it, a teenager at 13 (taller, and cooking
  dinner too) and a grown-up at 18. Saved on the device only (#94).
- Ford House: **birthdays** (#74). On a player's birthday: balloons and a "Happy birthday" banner with their
  name, a cake with candles to light, everyone singing, blowing them out and cutting it, presents to open
  (or to wrap, for everyone else), and Grandma and Grandpa at the door with another present (#95).
- Ford House: the birthdays can come from the family server (fordDbs): a parent types the game token in once
  per device in the looks card. The game never waits for the server and uses the saved birthdays offline (#95).

### Changed
- Ford House: Dad is bald with a beard (the beanie is still in the editor) (#94).
- Ford House: the offline cache only handles the game's own files (and three.js), so requests to the family
  server always go to the network (#95).

## [4.9.0] - 2026-10-17

### Added
- Ford House: a new mission, **bedtime**, for Mum or Dad (#71). It's evening: dark outside, a moon, lights on
  in the house. P and Dude walk about on their own: get them off their iPads on the sofa, and they follow
  you upstairs. Choose who showers first; a shower, pyjamas and teeth for each, a story on P's bed (pick
  the book), then tuck each into bed and switch their light off. Two to four things go wrong each time
  (lost pyjamas, "Not that story!", goodnight to the dragon, a glass of water, a dance party, back on the
  iPad, hide and seek). Lights out by 20:30 for three stars; tiptoe downstairs to finish (#91).

### Fixed
- Ford House: Mum's office day could only just be done by 17:30, even playing perfectly: her site is twice
  the walk of Dad's office. Her clock now runs a bit slower (1.5 minutes a second instead of 2), which gives
  the same time to spare as Dad's day (#90).
- Ford House: a fire drill no longer makes you miss the urgent call: the call's deadline moves on by however
  long the drill took (both offices) (#90).

## [4.8.1] - 2026-10-13

### Changed
- Ford House: Mum and Dad drink their coffee themselves: sit on the sofa with it, then put the empty mug
  in the sink. P and Dude still take it to the table for them (#85).
- Ford House: mowing the lawn means every tuft of long grass, not nine in ten. Near the end the list shows how
  many tufts are left to find (#86).

### Fixed
- Ford House: P's bearded dragon's water bowl went back under the end of the branch, where it looked like part
  of it, so it seemed it was never put down. It now sits on open sand at the front of the terrarium, with
  water you can see (#87).

## [4.8.0] - 2026-10-13

### Added
- Ford House: Halloween, on 31 October only. The house is decorated: pumpkins and a string of orange
  lights at the front door, bats and spiders' webs on the dining room window and round the door, and a
  ghost in the hall. Three jobs that day: carve a jack-o'-lantern (fetch the pumpkin, scoop it out, pick a
  face on a card, carve it, light it, take it to the front step), decorate the house, and trick or treat.
  Mum and Dad hand out sweets to trick-or-treaters who ring at the door; P and Dude pick a costume (witch,
  vampire, ghost, black cat or pumpkin), dress up and ring both neighbours' bells with their pumpkin
  bucket. Add `?holiday=halloween` to the address to try it on another day (#82, #76).

### Changed
- Ford House: at Mum's office she sits on the other side of her desk pair, with a colleague opposite (#82).

## [4.7.0] - 2026-10-13

### Added
- Ford House: Dad's office, a new place built from his sketch: open-plan desks with colleagues, the boss's
  office with a round meeting table, a meeting room, Dad's room with his desk, the kitchen, a bathroom, a
  clock-in machine by the entrance and a bike rack outside, with a road on one side and a courtyard on the
  other (#72, #66).
- Ford House: a new mission, **work at the office**, for Dad. Get ready, cycle to the office on his bike
  (new, on the terrace), clock in, then meetings with the boss and the team, desk work, lunch, water, and
  coffee, snacks and the bathroom whenever you like. An urgent phone call, and a fire drill: out through the
  fire door and wait for the all-clear. Clock out and cycle home by 17:30 for three stars (#72, #66).
- Ford House: Mum's office site, from her sketches: two car parks across the road, a zebra crossing to the
  security turnstiles and the vehicle gate with its security lounge, a garden, a café in its own little
  building, and the office building with the clock-in machine, lifts and stairs. Upstairs, Mum's office
  floor: the open-plan office with her desk, a meeting room, the kitchen, the WC and a second office (#79).
- Ford House: Mum's version of **work at the office**: drive there, badge in, clock in, up to her floor by
  lift or stairs, meetings at 10:00 and 14:00, desk work, lunch, breaks, an urgent call and a fire drill
  (stairs only), then clock out, badge out and drive home by 17:30 for three stars (#79, #73).

## [4.6.0] - 2026-10-12

### Added
- Ford House: a new mission, **work from home**, for Mum or Dad, from 7:00 to 17:00. Get up, shower, get
  dressed and have breakfast, then a working day with several things to do in any order: meetings at 9:00
  and 14:00, emails, a report, more work, lunch from 12:00 and a glass of water, with coffee and snacks
  whenever you like and an urgent phone call some time in the day. Stars for being on time to every
  meeting, finishing by 17:00 and taking a break (#68).

### Changed
- Ford House: when several things are at the same spot (like meetings and work at a desk), the button
  offers the one due soonest (#68).

## [4.5.9] - 2026-10-12

### Added
- Ford House: a second mission, **3D printing**, for Dad (no clock, just for fun). Pick a design on a
  close-up of the laptop at his desk (a dragon for P, a plant pot, a phone stand, a rocket for Dude), order
  filament in a colour you choose, take the parcel from the courier, load the printer in the light-box
  cupboard by the sofa, send the print from the laptop and watch it grow layer by layer, then put the model
  where it belongs. The home screen lists everything you've made so far (#62, closes #55).

### Changed
- Ford House: the little side table by the sofa is now the light-box cupboard with the 3D printer inside
  (glass top and door, lit inside); the phone still rests on top (#62).

## [4.5.8] - 2026-10-12

### Fixed
- Ford House: P couldn't get or put back the box of crickets when her homework was on the list too, because
  the button at her desk always offered the homework. The box now lives on the windowsill, and whatever
  you're carrying can always be put down first when you're at the spot it goes (#59).
- Ford House: the little craft table in P's room was so close to her bed and the terrarium that you could
  only walk past it on two sides. It's a bit smaller and further into the room, so you can walk all the way round (#59).

## [4.5.7] - 2026-10-12

### Added
- Ford House: the shed. Solar panels on its roof, Dad's workbench with a bike stand beside it, and garden
  tools by its door. New jobs: **trim the bushes** (anyone, not in winter: take the hedge trimmer
  round the shaggy bushes, then the clippings go in the brown bin), **fix P's bike** (Dad: wheel it to the
  workbench, fix the puncture and oil the chain, wheel it back) and **check the solar panels** (Dad: the
  reading on the cabinet under the stairs is low, so brush the dust and leaves off the panels in circles) (#56).

## [4.5.6] - 2026-10-12

### Added
- Ford House: P's bearded dragon, in a terrarium in her room with a basking lamp, a branch and a rock. It
  potters about and basks under the lamp. Three new jobs for P: feed it (crickets and greens), play with it
  (it sits on her hand on her bed) and clean out the terrarium (scoop the mess, fresh water in its bowl).
  Fed and played with, it's happy: warmer colours and a head-bob every so often (#51, closes #43).

### Changed
- Ford House: a character's own jobs that come round every few days (P's dragon jobs, Dude's music) wait a
  day when the day is already full, so a day still has 12-14 jobs (#51).

### Fixed
- Ford House: on the school run P started inside the craft table in her room and couldn't move; she now
  starts next to her bed (#52).

## [4.5.5] - 2026-10-12

### Added
- Ford House: the first mission, **the school run**, for P or Dude, from the home screen: get up,
  breakfast, get dressed, pack your school bag, then cycle out of the back gate before the bell at 8:00.
  Stars for how early you get there, with your best kept for each of the kids (#44).
- Ford House: Dude's clarinet, on its stand by his desk with a music stand. New job for Dude every few days:
  practise the clarinet for 18 seconds, with a made-up clarinet tune and music notes floating up (#44).
- Ford House: a home screen when the game opens and from the ☰ button: carry on with today, pick who's
  playing, the missions to come, start over, and a way back to Game Zone. The game pauses while it's open (#41).
- Ford House: parcels for the neighbours. Some days the driver brings one for the neighbours on the left
  or the right: take it in, keep it in the hall till they're home, then take it round to their front door,
  or they come round, ring the bell, and you say hello and hand it over. The neighbours' houses now have
  fronts (our house mirrored, with light grey doors and window frames) and you can walk to their doors (#47).
- Ford House: the food shopping is ordered and delivered. Mum and Dad check the fridge, order on the phone
  from the sofa, and a while later a small white delivery van pulls up and the driver rings with the bag;
  answer the door and put the food away. P and Dude skip the ordering and just answer the door (#48).

### Changed
- Ford House: the Kinderzimmer is called P's room; "Start over" moved from under the job list to the home screen (#41).
- Ford House: the shopping bag no longer just appears in the hall; it comes with the food delivery (#48).

### Fixed
- Ford House: standing in a doorway (like the terrace door) no longer says you're in the garden (#41).
- Ford House: two fingers on the screen (or a quick double tap) could zoom the whole page on a phone, with
  no way to zoom back out. Page zoom is now turned off in the game, and if it happens anyway the page
  snaps back to normal when you let go (#42).

## [4.5.4] - 2026-10-12

### Added
- Ford House: Dad's desk in the dressing room has a monitor, a laptop and a chair. On weekdays Dad has
  "Work at your desk": four 20-second tasks (emails, a video call, a report, writing code), each with its
  own screen lighting up; the code types itself out on the monitor as he works (#38).
- Ford House: Mum's office monitors light up while she works, and the radio on each desk plays a little
  tune (with music notes floating up) during desk work (#38).

## [4.5.3] - 2026-10-11

### Added
- Ford House: rain on the washing line. On some days it rains a while after the washing is hung out;
  get it off the line before the countdown runs out, then bring the basket inside (#32).
- Ford House: doing the washing is a chain. Sort it by colour on a little card (whites, colours,
  darks), load the machine, hang it on the office airer; the next day fold it and take each pile to
  the right wardrobe (#32).
- Ford House: wipe the terrace windows by moving the stick in circles (#32).
- Ford House: the seasons follow the real date. Autumn has orange and red leaves and raking the lawn;
  December and January have snow, snowflakes and clearing the front path, and no mowing (#34).
- This changelog, and the version on the Game Zone page.

### Changed
- `package.json` now carries the real name (`ford-games`) and version.

## [4.5.2] - 2026-10-11

### Added
- Ford House: the attic, with Dude's room, the office and the hall, and a loft box job once a week (#30).
- Ford House: Mum, with her own jobs: work in the office and make up the sofa bed (#30).
- Ford House: cooking dinner, P's toys, Dude's keyboard practice and room tidy, hoovering on every
  floor, watering the plants upstairs (#30).

### Changed
- Ford House: days have 12-14 jobs; the job list moves the picture aside so it covers less of the house (#30).
- Ford House: the attic stairs have an opening in the banister; one hoover trip covers every floor on the list.

## [4.5.1] - 2026-10-11

Merged to `main` (#29) but not tagged.

### Added
- Ford House: jobs for each of the family (Dad's shave, homework for P and Dude), a call with the
  relatives, and swapping who you play mid-day (#28).

## [4.5.0] - 2026-10-11

### Added
- Ford House: a 3D walk-round of our house with household jobs: the ground floor, both gardens and
  the street, built from the floor plan and photos (#17, #27).
- Ford House: play in days, with job rules (bins, mowing every 4 days...), saved progress and a
  "Day complete" screen (#19); "Start over from day 1" (#23).
- Ford House: the first floor, the stairs and seven upstairs jobs (#20).
- 1v1 Soccer: timed matches with halftime and side swap, proper netted goals (#11).
- 5v5 Soccer: League mode with five opponents and skill-tiered AI (#12), played as a real round-robin
  with simulated AI-vs-AI matches (#13).
- CI runs on every pull request (#26).

### Fixed
- Ford House: staying upstairs during teeth and shower (#21), getting into the dressing room (#22),
  the dressing-room desk (#24), the charging cable lying on the ground (#25).
- Soccer: page scrolling fighting the joystick (#10), iOS multi-touch kicks (#14), the keeper's
  own-goal clearances and collecting the ball (#14, #15), kicks cancelled by re-grabbing the ball (#16).
- Steadier soccer clock tests (#26), Ford House browser test timeouts (#18).

## [4.4.1] - 2026-09-05

### Fixed
- Soccer: joystick drift, no more auto-dribble, real goalkeeper collisions (#9).

## [4.4.0] - 2026-09-05

### Added
- 1v1 Soccer, against a friend or the computer (#6).
- 5v5 Soccer with automatic player switching and a zonal formation AI (#7), with matching player
  sprites in both (#8).

## [4.3.1] - 2026-08-09

### Changed
- Better hand-off between players in the two-player games (#5).

## [4.3.0] - 2026-08-09

### Added
- Uno for 2, 3 or 4 players, pass and play (#4).
- Connect 4 (#2).

## [4.2.0] - 2026-08-07

### Added
- Word search.

## [4.1.0] - 2026-08-06

### Added
- Wordle.

## [4.0.0] - 2026-08-05

### Added
- Hangman and tic-tac-toe in the game choices.

## [3.2.0] - 2026-07-12

### Fixed
- The scoreboard: all results are stored in Firebase, so the scores are shared across devices.

## [3.1.0] - 2026-07-11

### Added
- Snake high scores saved to a Firebase database.

## [3.0.0] - 2026-07-11

### Changed
- MyDice became Ford Games: a game hub with dice and Snake, each with a menu button back to the hub.

## [2.0.0] - 2026-03-28

### Added
- Roll several dice at once, and hold dice between rolls.

## [1.0.0] - 2026-03-26

### Added
- First release: a dice roller with shake to roll.

[Unreleased]: https://github.com/littleGex/ford_games/compare/v4.11.0...HEAD
[4.11.0]: https://github.com/littleGex/ford_games/compare/v4.10.0...v4.11.0
[4.10.0]: https://github.com/littleGex/ford_games/compare/v4.9.0...v4.10.0
[4.9.0]: https://github.com/littleGex/ford_games/compare/v4.8.1...v4.9.0
[4.8.1]: https://github.com/littleGex/ford_games/compare/v4.8.0...v4.8.1
[4.8.0]: https://github.com/littleGex/ford_games/compare/v4.7.0...v4.8.0
[4.7.0]: https://github.com/littleGex/ford_games/compare/v4.6.0...v4.7.0
[4.6.0]: https://github.com/littleGex/ford_games/compare/v4.5.9...v4.6.0
[4.5.9]: https://github.com/littleGex/ford_games/compare/v4.5.8...v4.5.9
[4.5.8]: https://github.com/littleGex/ford_games/compare/v4.5.7...v4.5.8
[4.5.7]: https://github.com/littleGex/ford_games/compare/v4.5.6...v4.5.7
[4.5.6]: https://github.com/littleGex/ford_games/compare/v4.5.5...v4.5.6
[4.5.5]: https://github.com/littleGex/ford_games/compare/v4.5.4...v4.5.5
[4.5.4]: https://github.com/littleGex/ford_games/compare/v4.5.3...v4.5.4
[4.5.3]: https://github.com/littleGex/ford_games/compare/v4.5.2...v4.5.3
[4.5.2]: https://github.com/littleGex/ford_games/compare/v4.5.0...v4.5.2
[4.5.1]: https://github.com/littleGex/ford_games/pull/29
[4.5.0]: https://github.com/littleGex/ford_games/compare/v4.4.1...v4.5.0
[4.4.1]: https://github.com/littleGex/ford_games/compare/v4.4.0...v4.4.1
[4.4.0]: https://github.com/littleGex/ford_games/compare/v4.3.1...v4.4.0
[4.3.1]: https://github.com/littleGex/ford_games/compare/v4.3.0...v4.3.1
[4.3.0]: https://github.com/littleGex/ford_games/compare/v4.2.0...v4.3.0
[4.2.0]: https://github.com/littleGex/ford_games/compare/v4.1.0...v4.2.0
[4.1.0]: https://github.com/littleGex/ford_games/compare/v4.0.0...v4.1.0
[4.0.0]: https://github.com/littleGex/ford_games/compare/v3.2.0...v4.0.0
[3.2.0]: https://github.com/littleGex/ford_games/compare/v3.1.0...v3.2.0
[3.1.0]: https://github.com/littleGex/ford_games/compare/v3.0.0...v3.1.0
[3.0.0]: https://github.com/littleGex/ford_games/compare/v2.0.0...v3.0.0
[2.0.0]: https://github.com/littleGex/mydice/compare/v1.0.0...v2.0.0
[1.0.0]: https://github.com/littleGex/mydice/releases/tag/v1.0.0

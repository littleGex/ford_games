# Changelog

What changed in each version of Game Zone (Ford Games), newest first. The current version is the
`version` in `package.json`, shown at the bottom of the Game Zone page.

The layout follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the numbers follow
[semantic versioning](https://semver.org/): a new game or a big new feature bumps the middle number,
fixes and small additions bump the last one. While working, add a line under **Unreleased** in the same
pull request; at release time that section becomes the new version (see "Releasing" in `README.md`).

## [Unreleased]

### Added
- Ford House: parcels for the neighbours. Some days the driver brings one for the neighbours on the left
  or the right: take it in, keep it in the hall till they're home, then take it round to their front door,
  or they come round, ring the bell, and you say hello and hand it over. The neighbours' houses now have
  fronts (our house mirrored, with light grey doors and window frames) and you can walk to their doors.
- Ford House: the food shopping is ordered and delivered. Mum and Dad check the fridge, order on the phone
  from the sofa, and a while later a small white delivery van pulls up and the driver rings with the bag;
  answer the door and put the food away. P and Dude skip the ordering and just answer the door.

### Changed
- Ford House: the shopping bag no longer just appears in the hall; it comes with the food delivery.

## [4.5.5] - 2026-10-12

### Added
- Ford House: the first mission, **the school run**, for P or Dude, from the home screen: get up,
  breakfast, get dressed, pack your school bag, then cycle out of the back gate before the bell at 8:00.
  Stars for how early you get there, with your best kept for each of the kids (#44).
- Ford House: Dude's clarinet, on its stand by his desk with a music stand. New job for Dude every few days:
  practise the clarinet for 18 seconds, with a made-up clarinet tune and music notes floating up (#44).
- Ford House: a home screen when the game opens and from the ☰ button: carry on with today, pick who's
  playing, the missions to come, start over, and a way back to Game Zone. The game pauses while it's open (#41).

### Changed
- Ford House: the Kinderzimmer is called P's room; "Start over" moved from under the job list to the home screen (#41).

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

[Unreleased]: https://github.com/littleGex/ford_games/compare/v4.5.5...HEAD
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

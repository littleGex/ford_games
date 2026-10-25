# 🎮 Game Zone

A small collection of browser games, hosted on GitHub Pages. Pick a game from the home page and play — no install needed.

## Games

- 🎲 **Dice** — roll up to 6 dice, hold dice between rolls, switch dice styles, shake your phone to roll.
- 🐍 **Snake** — Easy (wrap-around walls) or Classic (walls kill) mode, on-screen controls for touch devices, and a shared top-5 leaderboard (Firebase Realtime Database, via plain REST calls).
- ❌⭕ **Tic-Tac-Toe** — 2 player, or vs computer with Easy/Unbeatable difficulty (Unbeatable uses a full minimax search).
- 🎯 **Hangman** — guess the word before the figure is complete; 8 wrong guesses allowed. Words come from a built-in list plus a shared, Firebase-backed list anyone can add to.
- 🟩 **Wordle** — guess a hidden word in limited tries with letter feedback (correct position / wrong position / not in word). Easy (4 letters) or Hard (6 letters), each with its own shared, Firebase-backed word list.
- 🔍 **Word Search** — find hidden words in a letter grid by clicking/dragging across them (any of the 8 directions, forwards or backwards). Easy (8×8, 6 words) or Hard (12×12, 10 words), drawing from a 200+ word bundled list plus a shared, Firebase-backed list anyone can add to.
- 🔴🟡 **Connect 4** — 2 player, or vs computer with Easy/Hard difficulty (Hard uses depth-limited minimax with alpha-beta pruning and a positional heuristic — reliably takes winning moves and blocks immediate threats).
- ⚽ **1v1 Soccer** — real-time canvas arcade soccer, inspired by retro top-down football games (an original build — no licensed clubs, players, or assets). 2 player (WASD vs arrow keys) or vs computer with rule-based AI. Timed match: two configurable halves (1/2/3 min), teams swap ends at half time, netted goals.
- 🥅 **5v5 Soccer** — full team match, same original art/engine style. Auto-switch control (you drive whichever of your outfielders is nearest the ball — goalkeepers are always computer-controlled, with real collision physics so shots can't pass through them, and they automatically clear a held ball toward the center circle after ~1.3 seconds so play never stalls; pressing your own kick button clears it immediately instead of waiting), with teammates and opponents holding simple zonal formation positions rather than deliberate passing AI. 2 player, vs computer, or **League** mode: a full 6-team single round-robin season against 5 original opponent teams (own names/colors, no real clubs) of varying AI skill (easy/medium/hard — same decision code, different tuning). You play your own fixtures; the AI-vs-AI matches are simulated with skill-weighted random scorelines, so the standings are a real league table you can win, lose, or finish mid-table in on goal difference. Saved locally in the browser.
- ♠️ **Solitaire** — Klondike for one, built for a phone: tap a card and it goes to the best place it can (a foundation first, then a column), or drag it. Runs move together, the card underneath turns over by itself, and a win shows the moves and time. CSS-drawn cards with the suit beside every rank. Three levels (Easy: draw 1, as many times through the stock as you like, and every deal can be won, checked by a small solver; Medium: draw 1, three times through; Hard: draw 3), hints on Easy and Medium, Undo, a ✨ Finish button for the end, stats per level, and the game in progress kept on the device so a reload carries on. Each deal has a number, and `?seed=1234` plays that deal again (`&level=hard` picks the level). The rules are in `solitaire/klondike.js`, tested in Node (`npm run test:solitaire`).
- 🃏 **Uno** — 2-4 players, same-device pass-and-play. Full 108-card deck, Skip/Reverse/Draw Two/Wild/Wild Draw Four, CSS-drawn cards (no image assets). A hand-off screen hides each player's cards until they tap through, so nobody sees anyone else's hand on a shared device.
- 🚢 **Battleships** — a 3D sea in the Ford House style: two wooden jetty boards with lanterns, ships built from blocks, shells that arc across, splashes, fires and ships that sink. Place your fleet (drag to move, tap to turn, or Shuffle), then take turns firing. Against the computer (Easy / Normal / Hard — Hard works out where the remaining ships are most likely to be), two players on one device with a hand-off screen between turns, or **two players on their own phones**: one starts a game and gets a 4-letter code (or sends the link), the other joins with it. Games are saved on the device, and wins against the computer are counted per level. Split into ES modules like Ford House — see [Battleships](#battleships) below.
- 🏠 **Ford House** — a 3D dollhouse of our own house (both floors, front and back garden), built from the floor plan and room photos. Walk around as Dad, P or Dude and do the household jobs: bins, mowing, hoovering, washing up, charging the car, coffee, TV, making the beds, putting a wash on and more, plus surprise events (post, a parcel at the door with a countdown, power cuts you fix at the fuse box with a torch). It runs in days: each day picks 10-12 jobs by their rules (dishes daily, mowing every 4 days, bins out then back in the next day), and progress is saved on the phone. Unlike the other games it's split into ES modules — see [`house/README.md`](house/README.md).

## Structure

```
.
├── index.html          # home page — links to each game
├── dice/
│   ├── index.html
│   ├── script.js
│   ├── style.css
│   ├── manifest.json
│   └── sw.js
├── snake/
│   ├── index.html
│   ├── manifest.json
│   └── sw.js
├── tictactoe/
│   ├── index.html
│   ├── manifest.json
│   └── sw.js
├── hangman/
│   ├── index.html
│   ├── manifest.json
│   └── sw.js
├── wordle/
│   ├── index.html
│   ├── manifest.json
│   └── sw.js
├── wordsearch/
│   ├── index.html
│   ├── manifest.json
│   └── sw.js
├── connect4/
│   ├── index.html
│   ├── manifest.json
│   └── sw.js
├── solitaire/
│   ├── index.html
│   ├── klondike.js     # the rules, no page (tested in Node)
│   ├── manifest.json
│   └── sw.js
├── uno/
│   ├── index.html
│   ├── manifest.json
│   └── sw.js
├── soccer/
│   ├── index.html
│   ├── manifest.json
│   └── sw.js
├── soccer5v5/
│   ├── index.html
│   ├── manifest.json
│   └── sw.js
├── battleships/        # multi-file: js/ (rules, game, ai, scene/), css/
│   ├── index.html
│   ├── manifest.json
│   └── sw.js
├── house/              # multi-file: js/ (world, characters, jobs, systems), css/
│   ├── index.html
│   ├── manifest.json
│   └── sw.js
└── tests/
    ├── e2e/
    │   ├── dice.spec.js
    │   ├── snake.spec.js
    │   ├── tictactoe.spec.js
    │   ├── hangman.spec.js
    │   ├── wordle.spec.js
    │   ├── wordsearch.spec.js
    │   ├── connect4.spec.js
    │   ├── battleships.spec.js
    │   ├── battleships-online.spec.js
    │   ├── solitaire.spec.js
    │   ├── uno.spec.js
    │   ├── soccer.spec.js
    │   ├── soccer5v5.spec.js
    │   └── house.spec.js
    ├── battleships/    # Node tests of the Battleships rules, computer players and two-device games
    ├── solitaire/      # Node test of the Klondike rules
    └── house/          # Node play-through test for Ford House (no browser)
```

Each game lives in its own folder and is fully self-contained — no shared dependencies between games (Ford House and Battleships load three.js from a CDN, cached for offline play by its service worker). Every game has a `manifest.json` + `sw.js` for offline support (installable, and playable after the first visit with no connection).

## Adding a new game

1. Create a new folder at the repo root (e.g. `wordle/`)
2. Drop the game's files inside it, with `index.html` as the entry point
3. Add `manifest.json` and `sw.js` for offline support (copy an existing game's as a template)
4. Add a new card to `index.html` at the root, linking to `<folder-name>/`

## Snake's leaderboard

Backed by a Firebase Realtime Database, accessed via plain REST `fetch()` calls rather than the Firebase SDK (the SDK's realtime sync layer proved unreliable in testing). Scores are capped at 50 stored entries — the leaderboard prunes down to the top 50 automatically after each save — and only the top 5 are displayed. There's no polling; the display refreshes on page load, after a save, or via the manual refresh button.

## Shared word lists (hangman, wordle, word search)

All three let anyone add a word to a shared pool, stored in the same Firebase database as the leaderboard (different top-level nodes: `customWords` for hangman, `wordleWords/easy` and `wordleWords/hard` for wordle, `wordSearchWords` for word search). Each word is stored using the word itself as the key rather than a generated ID — this makes Firebase's own rules reject duplicate/simultaneous additions automatically, with no risk of a race condition even if two devices add the same word at once. Custom words load in the background on page load and are available starting with the next new word/game/puzzle — no need to wait on a network call before playing. There's no profanity filtering; since the site is public, anyone who can reach the page could technically add an inappropriate word.

## Battleships

Classic rules: a 10×10 grid, a fleet of five (Carrier 5, Battleship 4, Cruiser 3, Submarine 3, Destroyer 2), ships may
not touch (not even at the corners), and you're told when you've sunk a ship (and which). Turns alternate.

```
battleships/js/
  rules.js     the grid, the fleet, placing, firing: no three.js, runs in Node
  game.js      one game as plain JSON: players, fleets, shots, whose turn (saved under battleships.save.v1)
  ai.js        the computer: Easy (random), Normal (hunts, then follows a hit along the line),
               Hard (counts every way the ships still afloat could lie and fires where that's highest)
  main.js      the menu, placing, turns, the hand-off screen, the end of the game
  scene/       the 3D world: stage (camera and lights), sea, boards, ships, effects
```

The computer only ever looks at its own shots and what they found, never at your fleet, and it keeps nothing
between turns, so a saved game carries on with the same computer. On average it sinks a fleet in about 75 shots
on Easy, 50 on Normal and 39 on Hard (`npm run test:battleships` plays 200 games at each level and checks they
stay in that order).

Add `?seed=42` to the address to make the fleets and the computer play the same way each time, and `?speed=4` to
run the animations faster.

### Two devices

Games between two phones go through their own Firebase project (`ford-battleships`, Realtime Database in
europe-west1), separate from the database the other games share. As with the others there's no Firebase SDK:
`js/net/firebase.js` uses plain REST calls, and the database's streaming (`EventSource`) to hear about changes as
they happen. Each device signs in anonymously once (Firebase Authentication over REST) and keeps that sign-in, so
after a reload it's the same player and takes its seat again.

A game is a room under `rooms/<code>` (`js/net/online.js` describes it): the two players, `n` shots fired so
far (even numbers are the starter's), the shots, and the answers. **The fleets never go into the database.** Each
device keeps its own and puts up only a fingerprint (SHA-256 of the fleet and a random salt). The player who is
fired at works out hit, miss or sunk on their own device and writes the answer; a shot plays out on both screens
once it's answered. At the end both fleets are revealed and each device checks the other one against its
fingerprint and every answer it gave, so a wrong answer shows up on the game over card.

The security rules (`battleships/database.rules.json`, pasted into the Firebase console by hand) make everyone
take turns: only signed-in players, a seat can't be taken twice, only the player whose turn it is can fire,
only the player fired at can answer, nothing can be changed once written, and every field is checked. Rooms
over a day old may be deleted (by hand, in the console). After changing the rules, run
`node tests/battleships/rules-live.mjs`: three throwaway players try 47 things against the real database, allowed
and not. It isn't part of CI, since it needs the real database.

## 5v5 League mode

A proper 6-team single round-robin: you plus 5 original opponent teams (own names/colors, no real clubs — `Sunset Rovers`, `Meadowlark Athletic`, `River Town`, `Northfield United`, `Ironclad FC`), 15 fixtures across 5 rounds, every team playing every other exactly once.

You play your own 5 matches for real. The other 10 (AI vs AI) are simulated with a weighted random model: each team's expected goals scale with the strength gap between the two sides, sampled from a Poisson distribution so scorelines look like real football (mostly 0–3 goals, blowouts rare) and upsets genuinely happen — a weak team beats a strong one roughly 8% of the time rather than never. The two AI matches from a round are simulated when you complete your own fixture from that round, so the whole table progresses together and every team always shows the same number played.

AI difficulty is entirely data — the same decision logic runs for every opponent, just tuned differently per skill tier (`easy`/`medium`/`hard`: AI speed, shooting range, chase radius, reaction time, and formation tightness all scale together). Standings are a real league table (P/W/D/L/GF/GA/GD/Pts), sorted by points, then goal difference, then goals scored — so you can finish mid-table on goal difference exactly as in reality.

Saved to `localStorage` under `ford5v5LeagueSeason` as plain JSON (per-fixture scorelines plus which rounds are complete), deliberately simple so a future move to a persistent, shared backend (e.g. Firebase, following the same pattern as the leaderboard/word lists) — with a transfer market, budget, and squad-building career mode — could swap out how it's read and written without redesigning what it stores.

## Testing

End-to-end tests live in `tests/e2e/`, run with Playwright:

```
npm install
npm run test:e2e
```

`playwright.config.js` starts a local static server automatically before running. Snake's tests mock the Firebase REST calls, so they never depend on network access or write to the live database. CI runs these on every push/PR via `.github/workflows/ci.yml`.

Battleships has Node tests of its rules, computer players and two-device games (`npm run test:battleships`); its
two-device browser tests play two browser contexts against each other through a stand-in for the database.
Ford House also has a play-through test in `tests/house/` that runs in plain Node against a stand-in for three.js (`npm run test:house`) — see `house/README.md`.

## Local development

No build step — just open `index.html` in a browser, or serve the folder with any static file server (`npm run serve` uses the same `serve` package the tests use).

## Hosting

Served via GitHub Pages from the `main` branch, root folder.

## Versions and releases

The current version is the `version` in `package.json`; the Game Zone page shows it at the bottom.
`CHANGELOG.md` lists what changed in each version, newest first.

- **While working:** add a line under `## [Unreleased]` in `CHANGELOG.md` in the same pull request.
- **To release:** pick the new number (a new game or big feature bumps the middle number, fixes and
  small additions the last one), then on `develop`:
  1. In `CHANGELOG.md`, rename `## [Unreleased]` to `## [x.y.z] - YYYY-MM-DD`, add a fresh empty
     `## [Unreleased]` above it, and update the compare links at the bottom.
  2. Set `"version"` in `package.json` (and the two matching lines at the top of `package-lock.json`).
  3. Open a pull request from `develop` into `main` titled with the version; merge it once CI passes.
  4. On GitHub, draft a new release: tag `vx.y.z` on `main`, title `vx.y.z`, and paste that version's
     section from `CHANGELOG.md` as the notes.

A test (`tests/e2e/version.spec.js`) checks that `package.json`, the changelog and the Game Zone page
agree on the version.

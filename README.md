# 🎮 Game Zone

A small collection of browser games, hosted on GitHub Pages. Pick a game from the home page and play — no install needed.

## Games

- 🎲 **Dice** — roll up to 6 dice, hold dice between rolls, switch dice styles, shake your phone to roll.
- 🐍 **Snake** — Easy (wrap-around walls) or Classic (walls kill) mode, on-screen controls for touch devices, and a shared top-5 leaderboard (Firebase Realtime Database, via plain REST calls).
- ❌⭕ **Tic-Tac-Toe** — 2 player, or vs computer with Easy/Unbeatable difficulty (Unbeatable uses a full minimax search).
- 🎯 **Hangman** — guess the word before the figure is complete; 8 wrong guesses allowed. Words come from a built-in list plus a shared, Firebase-backed list anyone can add to.
- 🟩 **Wordle** — guess a hidden word in limited tries with letter feedback (correct position / wrong position / not in word). Easy (4 letters) or Hard (6 letters), each with its own shared, Firebase-backed word list.
- 🔍 **Word Search** — find hidden words in a letter grid by clicking/dragging across them (any of the 8 directions, forwards or backwards). Easy (8×8, 6 words) or Hard (12×12, 10 words), drawing from a 200+ word bundled list plus a shared, Firebase-backed list anyone can add to.

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
└── tests/
    └── e2e/
        ├── dice.spec.js
        ├── snake.spec.js
        ├── tictactoe.spec.js
        ├── hangman.spec.js
        ├── wordle.spec.js
        └── wordsearch.spec.js
```

Each game lives in its own folder and is fully self-contained — no shared dependencies between games. Every game has a `manifest.json` + `sw.js` for offline support (installable, and playable after the first visit with no connection).

## Adding a new game

1. Create a new folder at the repo root (e.g. `wordle/`)
2. Drop the game's files inside it, with `index.html` as the entry point
3. Add `manifest.json` and `sw.js` for offline support (copy an existing game's as a template)
4. Add a new card to `index.html` at the root, linking to `<folder-name>/`

## Snake's leaderboard

Backed by a Firebase Realtime Database, accessed via plain REST `fetch()` calls rather than the Firebase SDK (the SDK's realtime sync layer proved unreliable in testing). Scores are capped at 50 stored entries — the leaderboard prunes down to the top 50 automatically after each save — and only the top 5 are displayed. There's no polling; the display refreshes on page load, after a save, or via the manual refresh button.

## Shared word lists (hangman, wordle, word search)

All three let anyone add a word to a shared pool, stored in the same Firebase database as the leaderboard (different top-level nodes: `customWords` for hangman, `wordleWords/easy` and `wordleWords/hard` for wordle, `wordSearchWords` for word search). Each word is stored using the word itself as the key rather than a generated ID — this makes Firebase's own rules reject duplicate/simultaneous additions automatically, with no risk of a race condition even if two devices add the same word at once. Custom words load in the background on page load and are available starting with the next new word/game/puzzle — no need to wait on a network call before playing. There's no profanity filtering; since the site is public, anyone who can reach the page could technically add an inappropriate word.

## Testing

End-to-end tests live in `tests/e2e/`, run with Playwright:

```
npm install
npm run test:e2e
```

`playwright.config.js` starts a local static server automatically before running. Snake's tests mock the Firebase REST calls, so they never depend on network access or write to the live database. CI runs these on every push/PR via `.github/workflows/ci.yml`.

## Local development

No build step — just open `index.html` in a browser, or serve the folder with any static file server (`npm run serve` uses the same `serve` package the tests use).

## Hosting

Served via GitHub Pages from the `main` branch, root folder.

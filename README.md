# 🎮 Game Zone

A small collection of browser games, hosted on GitHub Pages. Pick a game from the home page and play — no install needed.

## Games

- 🎲 **Dice** — roll up to 6 dice, hold dice between rolls, switch dice styles, shake your phone to roll.
- 🐍 **Snake** — Easy (wrap-around walls) or Classic (walls kill) mode, on-screen controls for touch devices, and a shared top-5 leaderboard (Firebase Realtime Database, via plain REST calls).
- ❌⭕ **Tic-Tac-Toe** — 2 player, or vs computer with Easy/Unbeatable difficulty (Unbeatable uses a full minimax search).
- 🎯 **Hangman** — guess the word before the figure is complete; 8 wrong guesses allowed.

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
└── tests/
    └── e2e/
        ├── dice.spec.js
        └── snake.spec.js
```

Each game lives in its own folder and is fully self-contained — no shared dependencies between games. Every game has a `manifest.json` + `sw.js` for offline support (installable, and playable after the first visit with no connection).

## Adding a new game

1. Create a new folder at the repo root (e.g. `wordle/`)
2. Drop the game's files inside it, with `index.html` as the entry point
3. Add `manifest.json` and `sw.js` for offline support (copy an existing game's as a template)
4. Add a new card to `index.html` at the root, linking to `<folder-name>/`

## Snake's leaderboard

Backed by a Firebase Realtime Database, accessed via plain REST `fetch()` calls rather than the Firebase SDK (the SDK's realtime sync layer proved unreliable in testing). Scores are capped at 50 stored entries — the leaderboard prunes down to the top 50 automatically after each save — and only the top 5 are displayed. There's no polling; the display refreshes on page load, after a save, or via the manual refresh button.

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

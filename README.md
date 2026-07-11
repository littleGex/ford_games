# 🎮 Game Zone

A small collection of browser games, hosted on GitHub Pages. Pick a game from the home page and play — no install needed.

## Games

- 🎲 **Dice** — roll up to 6 dice, hold dice between rolls, switch dice styles, shake your phone to roll.
- 🐍 **Snake** — classic snake with an Easy (wrap-around walls) and Classic (walls kill) mode, on-screen controls for touch devices, and a local top-5 leaderboard.

## Structure

```
.
├── index.html        # home page — links to each game
├── dice/
│   ├── index.html
│   ├── script.js
│   ├── style.css
│   ├── manifest.json
│   └── sw.js
└── snake/
    └── index.html
```

Each game lives in its own folder and is fully self-contained — no shared dependencies between games.

## Adding a new game

1. Create a new folder at the repo root (e.g. `wordle/`)
2. Drop the game's files inside it, with `index.html` as the entry point
3. Add a new card to `index.html` at the root, linking to `<folder-name>/`

## Local development

No build step — just open `index.html` in a browser, or serve the folder with any static file server.

## Hosting

Served via GitHub Pages from the `main` branch, root folder.
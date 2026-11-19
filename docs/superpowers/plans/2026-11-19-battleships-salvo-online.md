# Battleships Salvo Online Implementation Plan (#178)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Salvo works between two phones: a turn is a group of shots (one per ship afloat), answered as a whole, with the database rules enforcing turn order, shot count and who may join.

**Architecture:** Keep the room layout (`shots/<n>`, `n`); a turn is a patch of k shots plus `n: n + k`. Whose turn comes from the last shot's `by` once it's answered. Sunk ships are also kept in `sunk/<seat>/<id>` so the rules can count ships afloat. New phones mark their seat with `v: 2`; a Salvo room needs it to join.

**Tech Stack:** plain ES modules, three.js, Firebase Realtime Database (REST, `js/net/firebase.js`), Node tests, Playwright.

**Spec:** `docs/superpowers/specs/2026-11-19-battleships-salvo-online-design.md`

## Global Constraints

- Classic rooms as written by today's client (no `variant`, single shots, `sunk` answers without `sunk/`) stay valid under the new rules.
- No test touches the real database; `rules-live.mjs` is run by hand only after Alan's go-ahead to deploy.
- Rules are deployed to `ford-battleships` only with Alan's go-ahead.
- `battleships/sw.js` CACHE name bumped whenever battleships js/html/css change (as in the house).
- Commit style: `Battleships: …`, ending `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Review Focus

- A reload mid-salvo (shots written, not all answered): the answering phone answers the rest in one patch; the shooter's phone shows "Waiting for … to answer" and doesn't fire again.
- A salvo that sinks the last ship with its first shell: the game ends for both; the remaining shells are answered and don't change the winner.
- An old Classic room (no `variant`) reloaded on a new phone plays Classic, one shot a turn.
- A rematch of a Salvo game is Salvo on both phones; of a Classic game is Classic.
- Two answers racing (both phones' syncs answering the same salvo): only one patch lands; the other's refusal isn't shown as an error and the game carries on.

---

### Task 1: The room model (`online.js`)

**Files:** Modify `battleships/js/net/online.js`; Test `tests/battleships/online.mjs`.

**Interfaces — Produces:**
- `roomVariant(room) -> 'classic' | 'salvo'` (missing or anything else → `'classic'`).
- `whoseTurn(room) -> 'a' | 'b' | null`: `'a'` when n is 0; otherwise the seat that didn't fire `shots/<n−1>` once `results/<n−1>` exists; `null` while it's unanswered.
- `shotsAllowed(room, seat) -> number`: 1 in Classic; in Salvo `5 − Object.keys(room.sunk?.[seat] || {}).length` (count only the five FLEET ids).
- `view(room, seat)` gains `variant`, `pending` becomes **a list** of the unanswered shots (`[]` when none, each `{ n, by, x, y }`), `myTurn` uses `whoseTurn`. `shooter(n)` is removed (its callers move to `whoseTurn`).

- [ ] **Step 1: Failing tests** in `online.mjs`, in its `check_` style:
  - Classic room built shot by shot (a, b, a…) → `whoseTurn` matches today's parity at every step; `view(...).myTurn` for a and b as before; `view(...).pending` is `[]` or a one-shot list.
  - Salvo room: `{variant:'salvo', n:3, shots:{0:a,1:a,2:a}, results:{0,1}}` → `whoseTurn` null, `view(room,'b').pending` has 1 shot (n 2); with `results/2` → `whoseTurn === 'b'`.
  - `shotsAllowed`: salvo with `sunk:{a:{destroyer:true,cruiser:true}}` → a 3, b 5; classic → 1; a bogus id in `sunk` isn't counted.
  - `roomVariant({})`, `roomVariant({variant:'nope'})` → `'classic'`.
  - `check()` still passes for a salvo game where every answer is right (answers resolved in shot order).
  - A salvo whose first shell sinks the last ship: `view(...).winner` is the shooter for both seats, `phase 'over'`, with the other shells answered as misses.
- [ ] **Step 2:** `node tests/battleships/online.mjs` → FAIL (`whoseTurn` not exported).
- [ ] **Step 3:** Implement. Update every `shooter(` use in `main.js` and `view` (grep) so nothing breaks.
- [ ] **Step 4:** `npm run test:battleships` → PASS.
- [ ] **Step 5:** Commit `Battleships: salvo turns in the room model (#178)`.

### Task 2: The rules (`database.rules.json`)

**Files:** Modify `battleships/database.rules.json`, `tests/battleships/rules-live.mjs`. No deploy in this task.

**Interfaces — Consumes:** the room layout of Task 1 (`variant`, `sunk/<seat>/<id>`, `a/v`, `b/v`).

- [ ] **Step 1: Add the cases to `rules-live.mjs`** (they run only by hand, after the deploy; write them now):
  - Salvo room (created with `variant: 'salvo'`): join without `v` refused; with `v: 2` allowed; a's salvo of 5 in one patch allowed; b's salvo before a's is answered refused; a salvo of 6 refused; b answering its own salvo refused; b's answers in one patch with a `sunk` result but no `sunk/b/<id>` refused, with it allowed; a's next salvo of 5 after a ship of a's is sunk refused, of 4 allowed.
  - Classic room exactly as today's client writes it (no `variant`, `b` without `v`, `{shots/<n>, n:n+1}`, `results/<n>` with `sunk` and no `sunk/`) still allowed through a whole exchange.
- [ ] **Step 2: Change the rules** (spec, "Rules"):
  - room `.validate` children: allow `variant` (`'classic'|'salvo'`, only when `!data.exists()` of the room, i.e. written with the room) and `sunk`.
  - `a`/`b`: `v` allowed (`newData.val() === 2`, written once, by that seat); `b` `.write` additionally requires `newData.child('v').val() === 2` when `data.parent().child('variant').val() === 'salvo'`.
  - `n`: `newData.val() > data.val()` and `newData.val() − data.val() <= (variant === 'salvo' ? 5 − sunkCount(by) : 1)` where `by = newData.parent().child('shots/' + data.val() + '/by')`, sunkCount is five explicit `exists()` terms, and `shots/<newN − 1>` exists in newData.
  - `shots/$s`: replace the parity test with: `$s` (as a number) `>= n` and `< newData n`; `by` equals `whoseTurn` (n 0 → 'a'; else not `shots/<n−1>/by`, and `results/<n−1>` exists); writer's uid is `by`'s.
  - `results/$s`: unchanged, plus when `variant === 'salvo'` and `r === 'sunk'`: `newData.parent().parent().child('sunk/' + victim + '/' + ship.id).val() === true`.
  - `sunk/$seat/$id`: written once, by `$seat`'s uid, `$id` one of the five ids, value `true`, and only if some result in the same write is `sunk` with that id — *if that can't be expressed (rules can't search), accept writing `sunk/` only alongside a results write by that seat, and ledger it; the reveal check is the backstop.*
- [ ] **Step 3:** `node -e "JSON.parse(require('fs').readFileSync('battleships/database.rules.json'))"` → no error; `npm run test:battleships` → PASS.
- [ ] **Step 4:** Commit `Battleships: rules for salvo rooms (#178)`.

### Task 3: Salvo online in the game (`main.js`, `index.html`)

**Files:** Modify `battleships/js/main.js`, `battleships/index.html`, `battleships/sw.js`; Test `tests/e2e/battleships-online.spec.js`.

**Interfaces — Consumes:** `roomVariant`, `whoseTurn`, `shotsAllowed`, `view().pending` (list), `view().variant` from Task 1.

- [ ] **Step 1: Failing e2e tests** (reuse `fakeDatabase`, `twoPhones`, `fireAt`; add a `fireSalvo(page, squares)` helper that taps each square then `#fireBtn`):
  - `two phones: Salvo — the joiner plays Salvo, 5 shots a turn, answered as a whole`: host picks Salvo; db `rooms/<code>/variant === 'salvo'`; joiner's status says "pick 5 targets"; after a's salvo of 5, `n === 5`, all five `results` exist, and it's b's turn with "Fire salvo (0/5)".
  - `two phones: Salvo — a sunk ship means one shot fewer`: seed fleets so a's salvo sinks b's destroyer; `sunk/b/destroyer === true`; b's next salvo needs 4.
  - `two phones: Salvo — a win, checked, and a rematch that stays Salvo`.
  - `two phones: an old phone can't join a Salvo game`: the stand-in refuses `put` of `rooms/<c>/b` without `v` when `variant === 'salvo'` (add that one rule to the stand-in, like `next`/`resigned`); the joining page shows `#onlineMsg` containing "update".
  - `two phones: Salvo — a reload while a salvo waits for its answer`: block the answerer (close its page) after a's salvo is written; reopen it; it answers all of them in one patch and play goes on; a's page never shows the Fire button meanwhile.
  - The existing Classic tests stay as they are and pass.
- [ ] **Step 2:** `npx playwright test tests/e2e/battleships-online.spec.js --workers=1` → new tests FAIL.
- [ ] **Step 3: Implement:**
  - `newRoom(name, variant)` writes `variant`; host passes `prefs.variant`; the rematch's new room passes the old room's `roomVariant`.
  - Joining writes `b: { uid, name, seen, v: 2 }`; a refused join of a Salvo room shows "That game is Salvo: update this page (close and open it again) to join".
  - `connect` sets `state.variant` from `roomVariant(room)` once the room arrives; `salvoTurn()` drops `state.mode !== 'online'`; `shotsPerTurn` online = `min(shotsAllowed(room, seat), squares left)`.
  - Firing online: one patch `{ shots/<n..n+k−1>, n: n + k }` (`shootOnline` handles k = 1 and a salvo).
  - Answering: all of `v.pending` by the other seat in one patch, resolved in order with `resolveShot` (each result added to the running list), plus `sunk/<me>/<id>: true` for each sunk; mark all as answered; a refusal from a race isn't toasted.
  - Playing out: answered shots of a salvo (consecutive same `by`) play with `playSalvo` and set `last = { by, shots }`; single shots as today.
  - `watch`: while my salvo is pending, "Waiting for X to answer (k shots)".
  - Remove `#onlineClassic` from `index.html` and its line in `main.js`.
  - Bump `battleships/sw.js` cache name.
- [ ] **Step 4:** `npx playwright test tests/e2e/battleships-online.spec.js tests/e2e/battleships.spec.js --workers=1` → PASS; `npm run test:battleships` → PASS.
- [ ] **Step 5:** Commit `Battleships: Salvo on two phones (#178)`.

### Task 4: Deploy the rules (needs Alan's go-ahead)

- [ ] Ask Alan. On yes: deploy `battleships/database.rules.json` to `ford-battleships` (Firebase CLI `firebase deploy --only database --project ford-battleships` from `battleships/`, or the MCP deploy tool), then `node tests/battleships/rules-live.mjs` → all passed. Must happen before the client reaches main.

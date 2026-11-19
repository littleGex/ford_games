# Battleships: Salvo on two phones (#178)

Design approved in conversation 2026-11-19.

## Intent

Salvo (a shot for each of your ships still afloat, all fired at once) works against the computer and on one
device, but not when two phones play each other: choosing Salvo for an online game shows "On two devices it's
Classic for now" (`battleships/index.html`, `#onlineClassic`) and the game is played one shot a turn. The family
want to play Salvo on two phones like any other way of playing.

## How online play works today

- `battleships/js/net/online.js`: a room keeps `n` (shots fired so far) and `shots/<n> = { by, x, y }`. Turns
  strictly alternate: shot n is seat a's when n is even. A shot is written as one multi-path patch
  `{ shots/<n>: {...}, n: n + 1 }` (`main.js` `shootOnline`).
- The player fired at works out the answer on their own phone and writes `results/<n> = { r, ship? }`. Fleets
  never go into the database: only a SHA-256 fingerprint. At the end both fleets are revealed and each phone checks
  the other's fleet against its fingerprint and every answer it gave (`check`).
- `battleships/database.rules.json` enforces: `n` goes up by one with that shot present; `shots/<n>` only by the
  seat the parity says, only after the previous shot is answered, never rewritten; results only by the player fired
  at, once.
- `main.js`: `salvoTurn()` is false whenever `state.mode === 'online'`, so the salvo aiming never shows online.
- `game.js`: `shotsPerTurn(state, i)` = `min(5 − ships i has lost, squares i has left to fire at)` in Salvo, else 1.

## Goals

- Salvo on two phones: a turn is a group of shots, one per ship the shooter still has afloat, fired at once with
  the existing salvo aiming ("Tap 3 squares, then Fire salvo", "Fire salvo (2/3)").
- The other phone answers the whole salvo, then the turn passes.
- The database rules refuse a salvo with more shots than the shooter is allowed, a salvo out of turn, and answers
  by the wrong player, as they refuse such things for Classic today.
- The room records the variant (`classic` / `salvo`) when it's created, so the joiner plays the same game; a
  rematch keeps it. The "Classic for now" note goes.
- The "last turn" line shows the other player's salvo ("Dad fired a salvo of 3: …").

## Non-goals

- No change to how Classic online plays.
- No new way of hiding fleets or checking answers: the end-of-game reveal and check stay as they are.

## Anti-goals

- Breaking Classic games for phones still on the old version (they must keep working, including through the
  rules deploy).
- Touching the real database from tests (the e2e tests use the in-test stand-in; the live rules script is run by
  hand).
- Deploying rules to the live `ford-battleships` project without Alan's go-ahead.

## Approaches

1. **Same room layout, bigger turns (chosen).** Keep `shots/<n>` one per shot and `n` the shot count. A turn is a
   patch of k shots plus `n: n + k`. Classic is a salvo of one, so Classic rooms are exactly as today and old
   phones keep working.
2. **A new `turns/<t>` layout** (`turns/<t> = { by, shots: [...] }`, `answers/<t>`). Cleaner for Salvo, but Classic
   would have to move to it too (two layouts in the rules and the client otherwise), and old phones would break.
3. **No rules change for the count** (trust the client, catch it at the end). Simplest rules, but the issue asks
   that a cheating client can't fire more shots than allowed, and an over-sized salvo would only show up after the
   game.

## The design

### Room

```
rooms/KQ7P = {
  created, n, variant: 'classic' | 'salvo',   variant written once, at creation (missing = classic: old rooms)
  a, b,                                        as today
  shots:   { <n>: { by, x, y } },              as today; a salvo is several consecutive entries with the same by
  results: { <n>: { r, ship? } },              as today
  sunk:    { a: { carrier: true, ... }, b },   new: which of a seat's ships are sunk, by ship id
  reveal, resigned, next                       as today
}
```

### Whose turn

- The first shot is a's. After that, the turn passes when the last shot fired has been answered, to the seat that
  didn't fire it: whose turn = `shots/<n−1>/by === 'a' ? 'b' : 'a'`.
- For Classic this gives exactly today's alternation (parity), so Classic behaviour is unchanged.
- The answering phone writes all the answers to a salvo in **one patch**, so "the last shot is answered" means the
  whole salvo is answered.

### How many shots

- k = 5 − (number of the shooter's ships in `sunk/<shooter>`) in Salvo, 1 in Classic.
- The rules can't count results, so each sunk ship is also recorded as `sunk/<victim>/<shipId>: true`, written in
  the same patch as the `sunk` answer. Rules: `sunk/<seat>/<id>` is written once, only by that seat (the player
  fired at writes the answers), only when that patch also has a `sunk` result for that ship id;
  and a `sunk` result requires its `sunk/<victim>/<id>` entry in the same write. The count is then five explicit
  `exists()` terms in the rules.
- The rules allow **1 to k** shots in a salvo (not exactly k): the client always fires exactly
  `shotsPerTurn` (which can be fewer than k near the very end, when fewer squares are left than ships afloat).
  *Builder's call to make exact if the rules can express it simply.*
- A player who answers "hit" instead of "sunk" to keep more ships afloat (and so more shots) isn't stopped by the
  rules; the end-of-game check catches it, as it catches any wrong answer today.

### Rules (`battleships/database.rules.json`)

- `variant`: written only at creation (with the room), `'classic'` or `'salvo'`; optional (old clients don't
  write it).
- `n`: may go up by k ≥ 1 with `shots/<old n>` … `shots/<new n − 1>` all present in the same write, and k within
  the allowance above.
- `shots/<s>`: as today (not rewritten, not after a resign, both fleets placed, `by` is the writer's seat), with
  the parity check replaced by the whose-turn rule above, `$s` within `[n, newN)`, and every shot in the write by
  the same seat. The previous turn must be answered (`results/<n−1>` exists, or n is 0).
- `results/<s>`: as today, plus the `sunk` link above **only when the room's `variant` is `'salvo'`** (today's
  client in a Classic room writes a `sunk` answer with no `sunk/` entry, and must keep working). New clients write
  `sunk/` entries in Classic rooms too; nothing reads them there. *(My call, after the builder check.)*
- Phones on the old version in a Classic room write exactly what they write today and must be allowed.
- **Old phones can't join a Salvo room** (Alan's choice, after the builder check showed an old phone would
  otherwise play single shots and freeze mid-game at its first "sunk" answer): new clients write `b/v: 2` when
  joining, and the `b` rule requires it when the room's `variant` is `'salvo'`. An old phone gets "Couldn't join"
  straight away; once it updates (the service worker does on the next open) it can join. Classic joins don't need
  `v`. `a` and `b` gain `v` as an allowed child (`2`, written once, by that seat).

### The client

- `online.js` `view()`: `myTurn` from the whose-turn rule rather than parity; `pending` becomes the unanswered
  shots of the current salvo (a list); `variant` from the room. A helper `shotsAllowed(room, seat)` gives k as the
  rules compute it, and the client fires `min(k, squares left)`.
- `main.js`:
  - Room creation (`newRoom`, and the rematch's new room) writes `variant` from the menu choice (the rematch: the
    old room's).
  - `connect` takes the variant from the room, so `state.variant` is the room's, and `salvoTurn()` works online.
  - Firing online: one patch with every shot and `n: n + k` (`shootOnline` for Classic, a salvo version for
    Salvo).
  - Answering: all the unanswered shots of the other player's salvo in one patch, each with `resolveShot` in turn
    (so a ship sunk by the first shell of a salvo is "sunk" once), plus the `sunk/` entries.
  - Playing out: the other player's salvo plays with the existing salvo animation (`playSalvo`), and the last-turn
    line shows it. Shots after the last ship sinks are answered like any other and don't change the winner.
- The "On two devices it's Classic for now" note (`#onlineClassic`) and the `state.mode !== 'online'` in
  `salvoTurn()` go.

### Tests

- `tests/battleships/online.mjs` (Node): `view()` whose turn and `pending` for Classic (unchanged) and Salvo;
  `shotsAllowed` from `sunk/`; an old Classic room without `variant` reads as Classic.
- Joining: a new phone joins a Salvo room; joining a Salvo room is refused with a clear message when the
  database says no (e2e: the stand-in refuses a `b` without `v` in a Salvo room, as the real rules will).
- `tests/e2e/battleships-online.spec.js` (two browser contexts, the in-test database stand-in): Salvo start and
  join (the joiner sees Salvo); shots per turn follow ships afloat; a salvo answered as a whole; a sunk ship reduces
  the next salvo; a win; a rematch that stays Salvo. The existing Classic tests stay green.
- `tests/battleships/rules-live.mjs` (run by hand against the real database after deploying the rules): a Salvo
  room — a salvo of the right size allowed, one too many refused, out of turn refused, answering your own salvo
  refused; joining a Salvo room without `v` refused; a Classic room as written by today's client (single shots,
  a `sunk` answer without `sunk/`) still allowed.

### Deploying

- The rules change is deployed to `ford-battleships` only after Alan's go-ahead, and before the client change goes
  live on main (new rules accept old Classic writes, so the order is safe). Then run `rules-live.mjs`.

## Left to the builder

- Exact rules expressions (within the behaviour above), and whether "1 to k" can simply be "exactly
  min(k, squares left)".
- How `pending` is shown while waiting for an answer ("Firing a salvo of 3…").
- Naming of helpers.

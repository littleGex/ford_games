# Ford House: fill the fridge (#166)

## Intent

For P and Dude to learn where food goes (Alan). Today the food delivery job ends with one tap, "Put the food in the
fridge" (`house/js/jobs/jobs.js`, the `shopping` job). Instead a fridge card opens and you put each item from the
bag in its place, one at a time, and every item tells you why it goes there.

## Goals

- **Learning where food goes** (Alan): the right place, and the reason, for a wide range of everyday foods.
- **A card at the end of the food delivery (approach A, Alan):** "Put the food in the fridge" opens the card;
  everyone who plays the delivery job gets it (the children, and Mum and Dad, so the children can watch too).
- **A fresh mix each delivery** (Claude's call): about eight items from a pool of about 25, so over a few
  deliveries they meet most of them.
- **Why, every time** (Claude's call): after each item, right or wrong, one short line of why. A wrong place says
  why not and you try again ("Bananas go brown in the fridge!"); a right one says why it belongs
  ("The door is the warmest part of the fridge: good for drinks and sauces").
- **Score:** the ones right first time, said at the end ("6 of 8 right first time!"), no stars.

## Non-goals

- A home-screen mission with stars (approaches B and C; may come later reusing the same card).
- Use-by dates, leftovers, freezer, or how to store opened tins.
- Changing who gets the delivery job or how often.

## Anti-goals

- Teaching something wrong. Every place and reason follows plain UK food-safety advice (the NHS / Food Standards
  Agency "how to store food in the fridge"): raw meat and fish on the bottom shelf, ready-to-eat food above;
  no contested items (eggs, tomatoes, butter-in-the-door debates are left out of the pool).
- A card a young child can't read: big type, a picture for each food and each place, few words per line.
- Making the delivery job a chore: about eight items, a minute or so; "Do it later" keeps your place.

## Approaches

- **A. The card in the delivery job (chosen by Alan).** Least new code (copies the washing sort card); practice
  comes when the delivery job comes up.
- **B. A home-screen mission for P and Dude**, replayable for stars. More practice, apart from the daily chore.
- **C. Both.** The card in the job, and a mission reusing it.

## The places (Claude's call)

Five, shown as a drawn fridge with its parts and a cupboard beside it, each a big button with a label:

1. **The door** — drinks and sauces (the warmest part).
2. **The shelves** — ready-to-eat food: cheese, yoghurt, cooked ham, hummus.
3. **The bottom shelf** — raw meat and fish (the coldest part, and drips can't land on other food).
4. **The salad drawer** — vegetables and salad (keeps them crisp).
5. **The cupboard** — food that doesn't need the fridge: bread, pasta, rice, tins, cereal, bananas, potatoes,
   onions.

## The pool (Claude's call; the builder words the reasons, simply and correctly)

About 25, each with a picture (an emoji), a name, its place and a reason: milk, orange juice, ketchup, mayonnaise
(door); cheese, yoghurt, cooked ham, hummus, cream (shelves); raw chicken, mince, fish, sausages (bottom shelf);
carrots, lettuce, broccoli, peppers, cucumber (salad drawer); bread, pasta, rice, a tin of beans, cereal, bananas,
potatoes, onions (cupboard). Each delivery's eight have at least one from every place.

## Right, also fine, and wrong (Claude's calls after the builder check)

- **Best and also fine.** Each item has one *best* place and may have *also fine* places, so the card never calls a
  place wrong that's actually fine (milk on a shelf, cheese in the door, carrots on a shelf, onions in a veg rack…).
  An also-fine place counts as right (first time too) and the line says so and names the best: "That's fine — but
  the door is the best place for milk." Only places that are really wrong are wrong (raw meat anywhere but the
  bottom shelf; chilled food in the cupboard; cupboard food that spoils or goes stale in the fridge).
- **Why it's wrong**, by kind, not one line per item: each item has a kind (`drink`, `chilled`, `raw`, `veg`,
  `cupboard`) and the wrong-place line comes from the kind and where it was put (raw food not on the bottom shelf:
  "Raw meat goes at the bottom, so drips can't land on other food"; anything chilled in the cupboard: "This needs
  to stay cold — it goes in the fridge"). An item can have its own line instead where the kind's line doesn't fit
  (bananas: "Bananas go brown in the fridge!"; bread: "Bread goes stale faster in the fridge").
- **After a miss:** the first wrong try gives the reason and "Try again"; a second wrong try names the place and
  lights its button, so no one gets stuck. The score counts items right (best or also fine) on the first try.
- Lines are short, for children to read (no read-aloud in the game).

## How it fits the code

- **The card** in a new `ui/fridge.js`, built like `ui/sorting.js`: one item at a time, the five place buttons (keys
  1 to 5), a feedback line, "Do it later" (keeps your place), Escape closes. Step `kind: 'fridge'` in the board
  (`jobs/board.js`, beside `sort`). `S.fridge` while it's open (the same guards as `S.sorting`: no walking, no
  other actions, the home menu's Escape).
- **The pool** in `pack/fridgefood.js` (plain data, `deal(rand)` giving eight with every place in it).
- **The job:** the `shopping` job's last step becomes `{ kind: 'fridge', at: [3.95, 3.4], label: 'Put the food
  away' }`; its finish hides the food in the bag as now.
- `index.html` the card's markup; CSS beside the sort card; `sw.js` list and `CACHE_NAME`.

## Left to the builder

- The fridge drawing (simple shapes are fine), the exact reasons' wording, the end message.
- Tests: the pool (every place represented in each deal; every item has a reason); a play-through of the delivery
  with the card answered via the test hook (`answer()` like the sort card), wrong first then right, the score
  counted; a browser test of the card at phone size (readable, inside the screen, keys 1 to 5, Do it later).

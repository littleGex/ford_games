// Fill the fridge (#166, ui/fridge.js): the food in the delivery bag and where it goes, so P and Dude learn where
// food belongs. Places and reasons follow plain NHS / Food Standards Agency advice (raw meat and fish on the bottom
// shelf, ready-to-eat food above). Each food has its best place and maybe places that are also fine, so a fine
// place is never called wrong; nothing people argue about (eggs, tomatoes, butter). Plain data, no three.js.

export const FRIDGE_PLACES = [
  { id: 'door', name: 'The door' },
  { id: 'shelves', name: 'The shelves' },
  { id: 'bottom', name: 'The bottom shelf' },
  { id: 'drawer', name: 'The salad drawer' },
  { id: 'cupboard', name: 'The cupboard' },
];
const placeName = id => FRIDGE_PLACES.find(p => p.id === id).name;

const DRINK = 'The door is the warmest part of the fridge: just right for drinks.';
const READY = 'Ready-to-eat food goes on the shelves, above any raw meat.';
const RAW = 'Raw meat and fish go on the bottom shelf, so drips can\'t land on other food.';
const VEG = 'The salad drawer keeps vegetables fresh and crisp.';
const DRY = 'Dry food like this keeps for ages in the cupboard.';

const f = (id, emoji, name, kind, best, why, more = {}) => ({ id, emoji, name, kind, best, also: [], why, ...more });

export const FRIDGE_FOOD = [
  f('milk', '🥛', 'Milk', 'drink', 'door', DRINK, { also: ['shelves'] }),
  f('juice', '🧃', 'Fresh orange juice', 'drink', 'door', DRINK, { also: ['shelves'] }),
  f('smoothie', '🥤', 'Smoothie', 'drink', 'door', DRINK, { also: ['shelves'] }),
  f('cheese', '🧀', 'Cheese', 'chilled', 'shelves', READY, { also: ['door'] }),
  f('yoghurt', '🍦', 'Yoghurt', 'chilled', 'shelves', READY, { also: ['door'] }),
  f('ham', '🥓', 'Cooked ham', 'chilled', 'shelves', READY),
  f('hummus', '🥣', 'Hummus', 'chilled', 'shelves', READY),
  f('cream', '🍶', 'Cream', 'chilled', 'shelves', READY, { also: ['door'] }),
  f('chicken', '🍗', 'Raw chicken', 'raw', 'bottom', RAW),
  f('mince', '🥩', 'Mince', 'raw', 'bottom', RAW),
  f('fish', '🐟', 'Fish', 'raw', 'bottom', RAW),
  f('sausages', '🌭', 'Sausages', 'raw', 'bottom', RAW),
  f('carrots', '🥕', 'Carrots', 'veg', 'drawer', VEG, { also: ['shelves'] }),
  f('lettuce', '🥬', 'Lettuce', 'veg', 'drawer', VEG),
  f('broccoli', '🥦', 'Broccoli', 'veg', 'drawer', VEG),
  f('peppers', '🫑', 'Peppers', 'veg', 'drawer', VEG, { also: ['shelves'] }),
  f('cucumber', '🥒', 'Cucumber', 'veg', 'drawer', VEG, { also: ['shelves'] }),
  f('apples', '🍎', 'Apples', 'veg', 'drawer', 'Apples stay crisp in the salad drawer.', { also: ['cupboard'] }),
  f('bread', '🍞', 'Bread', 'cupboard', 'cupboard', 'Bread keeps best in the cupboard.', { whyNot: 'Bread goes stale faster in the fridge!' }),
  f('pasta', '🍝', 'Pasta', 'cupboard', 'cupboard', DRY),
  f('rice', '🍚', 'Rice', 'cupboard', 'cupboard', DRY),
  f('beans', '🥫', 'A tin of beans', 'cupboard', 'cupboard', 'Tins keep for ages in the cupboard.'),
  f('cereal', '🥣', 'Cereal', 'cupboard', 'cupboard', DRY),
  f('bananas', '🍌', 'Bananas', 'cupboard', 'cupboard', 'Bananas keep best in the cupboard or the fruit bowl.', { whyNot: 'Bananas go brown in the fridge!' }),
  f('potatoes', '🥔', 'Potatoes', 'cupboard', 'cupboard', 'Potatoes keep best somewhere cool and dark, like a cupboard.', { whyNot: 'Potatoes don\'t like the fridge: keep them somewhere cool and dark.' }),
  f('onions', '🧅', 'Onions', 'cupboard', 'cupboard', 'Onions keep best somewhere cool and dry, like a cupboard.', { whyNot: 'Onions go soft in the fridge!' }),
];

/** Why a food doesn't go there (it isn't its best or an also-fine place). */
function whyNot(food, place) {
  if (food.whyNot) return food.whyNot;
  if (place === 'cupboard') return food.kind === 'raw' ? 'Raw meat must stay cold, in the fridge!' : 'This needs to stay cold: it goes in the fridge.';
  if (food.kind === 'raw') return 'Raw meat goes at the bottom, so drips can\'t land on other food.';
  if (food.kind === 'cupboard') return 'This doesn\'t need the fridge: it keeps in the cupboard.';
  return { door: 'The door is for drinks.', shelves: 'The shelves are for ready-to-eat food.', bottom: 'The bottom shelf is for raw meat and fish.', drawer: 'The salad drawer is for vegetables and salad.' }[place];
}

/** Put `food` in `place` after `tries` wrong tries on it: right (best or also fine), or why not; the second wrong
 *  try names the best place (`show`, the button to light). */
export function judge(food, place, tries = 0) {
  if (place === food.best) return { ok: true, also: false, line: food.why };
  if ((food.also || []).includes(place)) return { ok: true, also: true, line: `That's fine! The best place for ${food.name.toLowerCase()} is ${placeName(food.best).toLowerCase()}.` };
  if (tries >= 1) return { ok: false, also: false, line: `${whyNot(food, place)} It goes in ${placeName(food.best).toLowerCase()}.`, show: food.best };
  return { ok: false, also: false, line: `${whyNot(food, place)} Try again!` };
}

/** Eight different foods for one delivery: one for each place, the rest from anywhere, shuffled. */
export function dealFood(rand = Math.random) {
  const pool = [...FRIDGE_FOOD], take = list => pool.splice(pool.indexOf(list[Math.floor(rand() * list.length)]), 1)[0];
  const hand = FRIDGE_PLACES.map(p => take(pool.filter(x => x.best === p.id)));
  while (hand.length < 8) hand.push(take(pool));
  for (let i = hand.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [hand[i], hand[j]] = [hand[j], hand[i]]; }
  return hand;
}

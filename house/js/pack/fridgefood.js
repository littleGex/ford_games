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
/** "on the shelves", "in the door": where it goes, in words. */
const inPlace = id => `${id === 'shelves' || id === 'bottom' ? 'on' : 'in'} ${placeName(id).toLowerCase()}`;

const DRINK = 'The door is the warmest part of the fridge: just right for drinks.';
const READY = 'Ready-to-eat food goes on the shelves, above any raw meat.';
const RAW = 'Raw meat and fish go on the bottom shelf, so drips can\'t land on other food.';
const VEG = 'The salad drawer keeps vegetables fresh and crisp.';
const DRY = 'Dry food in a packet keeps for ages in the cupboard.';

const f = (id, emoji, name, kind, best, why, more = {}) => ({ id, emoji, name, kind, best, also: [], why, ...more });

export const FRIDGE_FOOD = [
  f('milk', '🥛', 'Milk', 'drink', 'door', DRINK, { also: ['shelves'] }),
  f('juice', '🧃', 'Fresh orange juice', 'drink', 'door', DRINK, { also: ['shelves'] }),
  f('smoothie', '🥤', 'Smoothie', 'drink', 'door', DRINK, { also: ['shelves'] }),
  f('cheese', '🧀', 'Cheese', 'chilled', 'shelves', READY, { also: ['door'] }),
  f('sandwich', '🥪', 'A sandwich for tomorrow', 'chilled', 'shelves', READY),
  f('hummus', '🫙', 'A pot of hummus', 'chilled', 'shelves', READY),
  f('pudding', '🍮', 'A pudding', 'chilled', 'shelves', READY),
  f('chicken', '🐔', 'Raw chicken', 'raw', 'bottom', RAW),
  f('mince', '🥩', 'Raw mince', 'raw', 'bottom', RAW),
  f('fish', '🐟', 'Raw fish', 'raw', 'bottom', RAW),
  f('bacon', '🥓', 'Raw bacon', 'raw', 'bottom', RAW),
  f('carrots', '🥕', 'Carrots', 'veg', 'drawer', VEG, { also: ['shelves'] }),
  f('lettuce', '🥬', 'Lettuce', 'veg', 'drawer', VEG, { also: ['shelves'] }),
  f('broccoli', '🥦', 'Broccoli', 'veg', 'drawer', VEG, { also: ['shelves'] }),
  f('peppers', '🫑', 'Peppers', 'veg', 'drawer', VEG, { also: ['shelves'] }),
  f('cucumber', '🥒', 'Cucumber', 'veg', 'drawer', VEG, { also: ['shelves'] }),
  f('apples', '🍎', 'Apples', 'veg', 'drawer', 'Apples stay crisp in the salad drawer.', { also: ['shelves', 'cupboard'] }),
  f('grapes', '🍇', 'Grapes', 'veg', 'drawer', 'Grapes stay fresh in the salad drawer.', { also: ['shelves'] }),
  f('bread', '🍞', 'Bread', 'cupboard', 'cupboard', 'Bread keeps best in the cupboard.', { whyNot: 'Bread goes stale faster in the fridge!' }),
  f('rice', '🌾', 'A bag of dry rice', 'cupboard', 'cupboard', DRY),
  f('biscuits', '🍪', 'A packet of biscuits', 'cupboard', 'cupboard', DRY),
  f('honey', '🍯', 'A jar of honey', 'cupboard', 'cupboard', 'Honey keeps for ages in the cupboard.'),
  f('beans', '🥫', 'A tin of beans', 'cupboard', 'cupboard', 'Tins keep for ages in the cupboard.'),
  f('cereal', '🥣', 'Cereal', 'cupboard', 'cupboard', DRY),
  f('bananas', '🍌', 'Bananas', 'cupboard', 'cupboard', 'Bananas keep best in the cupboard or the fruit bowl.', { whyNot: 'Bananas go brown in the fridge!' }),
  f('potatoes', '🥔', 'Potatoes', 'cupboard', 'cupboard', 'Potatoes keep well somewhere cool and dark, like a cupboard.', { also: ['drawer'] }),
  f('onions', '🧅', 'Onions', 'cupboard', 'cupboard', 'Onions keep best somewhere cool and dry, like a cupboard.', { whyNot: 'Onions go soft in the fridge!' }),
];

/** Why a food doesn't go there (it isn't its best or an also-fine place). */
function whyNot(food, place) {
  if (food.whyNot) return food.whyNot;
  if (place === 'cupboard') return food.kind === 'raw' ? 'Raw meat and fish must stay cold, in the fridge!' : 'This needs to stay cold: it goes in the fridge.';
  if (food.kind === 'raw') return 'Raw meat and fish go at the bottom, so drips can\'t land on other food.';
  if (food.kind === 'cupboard') return 'This doesn\'t need the fridge: it keeps in the cupboard.';
  return { door: 'The door is for drinks.', shelves: 'The shelves are for ready-to-eat food.', bottom: 'The bottom shelf is for raw meat and fish.', drawer: 'The salad drawer is for vegetables and salad.' }[place];
}

/** Put `food` in `place` after `tries` wrong tries on it: right (best or also fine), or why not; the second wrong
 *  try names the best place (`show`, the button to light). */
export function judge(food, place, tries = 0) {
  if (place === food.best) return { ok: true, also: false, line: food.why };
  if ((food.also || []).includes(place)) return { ok: true, also: true, line: `That's fine! The best place for ${food.name.toLowerCase()} is ${inPlace(food.best)}.` };
  if (tries >= 1) return { ok: false, also: false, line: `${whyNot(food, place)} It goes ${inPlace(food.best)}.`, show: food.best };
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

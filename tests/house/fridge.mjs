// Fill the fridge (#166): the food, the deal and the judging:  node tests/house/fridge.mjs  (plain Node)
const { FRIDGE_PLACES, FRIDGE_FOOD, dealFood, judge } = await import('../../house/js/pack/fridgefood.js');

const fail = [];
const check = (ok, msg) => { if (!ok) fail.push(msg); };
const ids = FRIDGE_PLACES.map(p => p.id);
check(ids.join() === 'door,shelves,bottom,drawer,cupboard', `places: ${ids}`);
check(FRIDGE_FOOD.length >= 24, `food: only ${FRIDGE_FOOD.length}`);
check(new Set(FRIDGE_FOOD.map(f => f.id)).size === FRIDGE_FOOD.length, 'food: ids not unique');
for (const f of FRIDGE_FOOD) {
  check(f.emoji && f.name && f.why, `${f.id}: missing emoji, name or why`);
  check(ids.includes(f.best), `${f.id}: best ${f.best}`);
  check((f.also || []).every(p => ids.includes(p) && p !== f.best), `${f.id}: also ${f.also}`);
  check(['drink', 'chilled', 'raw', 'veg', 'cupboard'].includes(f.kind), `${f.id}: kind ${f.kind}`);
  check(!/egg|tomato|butter/i.test(f.id + f.name), `${f.id}: a contested food`);
  for (const p of ids) {
    const r = judge(f, p, 0);
    check(typeof r.line === 'string' && r.line.length > 0, `${f.id} in ${p}: no line`);
    check(r.ok === (p === f.best || (f.also || []).includes(p)), `${f.id} in ${p}: ok ${r.ok}`);
  }
}
for (const p of ids) check(FRIDGE_FOOD.some(f => f.best === p), `no food for ${p}`);

let seed = 9; const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
for (let n = 0; n < 500; n++) {
  const d = dealFood(rand);
  if (d.length !== 8 || new Set(d.map(f => f.id)).size !== 8) { check(false, `deal: ${d.map(f => f.id)}`); break; }
  if (!ids.every(p => d.some(f => f.best === p))) { check(false, `deal misses a place: ${d.map(f => f.best)}`); break; }
}

const food = id => FRIDGE_FOOD.find(f => f.id === id);
const milk = food('milk'), chicken = food('chicken'), banana = food('bananas');
check(milk && chicken && banana, 'want milk, chicken and bananas in the pool');
if (milk && chicken && banana) {
  check(judge(milk, 'door', 0).ok && !judge(milk, 'door', 0).also, 'milk in the door: right');
  const m = judge(milk, 'shelves', 0);
  check(m.ok && m.also && /the door/i.test(m.line), `milk on a shelf: also fine, naming the door (${m.line})`);
  const c1 = judge(chicken, 'shelves', 0);
  check(!c1.ok && /drip/i.test(c1.line), `raw chicken on a shelf: drips (${c1.line})`);
  const c2 = judge(chicken, 'cupboard', 0);
  check(!c2.ok && /cold/i.test(c2.line), `raw chicken in the cupboard: cold (${c2.line})`);
  check(judge(banana, 'drawer', 0).line.startsWith('Bananas go brown in the fridge!'), `bananas: ${judge(banana, 'drawer', 0).line}`);
  check(judge(chicken, 'door', 1).show === 'bottom' && judge(chicken, 'door', 0).show === undefined, 'the second wrong try shows the place');
}

if (fail.length) { console.error('fridge: FAIL\n  ' + fail.join('\n  ')); process.exit(1); }
console.log('fridge: ok');

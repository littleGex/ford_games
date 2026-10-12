// P's bearded dragon. In its terrarium it potters about on the sand, climbs on to the rock under the lamp
// to bask, and stops still for a while. While it's being fed it hurries over to the crickets and snaps them
// up. Once it's been fed and played with today it's happy: warmer colours and a head-bob every so often.
import { S } from '../state.js';
import { TERRARIUM as T } from '../world/upstairs/kinderzimmer.js';

const DULL = [0.78, 0.64, 0.45], HAPPY = [0.95, 0.58, 0.26];   // pale sandy brown vs warm orange
const SPEED = 0.12;
const inside = { x1: T.x1 + 0.16, x2: T.x2 - 0.16, z1: T.z1 + 0.12, z2: T.z2 - 0.12 };

export function createDragon({ items, world, board }) {
  const dragon = items.dragon, head = dragon.getObjectByName('head'), tail = dragon.getObjectByName('tail');
  let skin = null;
  dragon.traverse(o => { if (o.material && o.material.name === 'dragonSkin') skin = o.material; });
  let target = null, rest = 2, bob = 0, nextBob = 3, warmth = 0;

  const inTank = () => S.carrying !== 'dragon' && dragon.parent === world.upstairs
    && dragon.position.x > T.x1 && dragon.position.x < T.x2 && dragon.position.z > T.z1 && dragon.position.z < T.z2;
  const pending = id => { const j = board.find(id); return j && !board.finished(j); };
  const happy = () => !pending('feedDragon') && !pending('playDragon');

  function walkTo([x, z], dt) {
    const p = dragon.position, dx = x - p.x, dz = z - p.z, d = Math.hypot(dx, dz);
    if (d < 0.01) return false;
    const step = Math.min(d, SPEED * dt);
    p.x += dx / d * step; p.z += dz / d * step;
    dragon.rotation.y = Math.atan2(dx, dz);
    if (tail) tail.rotation.y = Math.sin(performance.now() / 120) * 0.35;
    return true;
  }

  function update(dt, time) {
    const feeding = S.sitting && S.sitting.step.dragon === 'feed';
    if (feeding) world.crickets.visible = true;

    // colour: warms up once it's happy
    warmth += ((happy() ? 1 : 0) - warmth) * Math.min(1, dt * 1.5);
    if (skin && skin.color && skin.color.setRGB) skin.color.setRGB(...DULL.map((v, i) => v + (HAPPY[i] - v) * warmth));

    // head-bob when happy (and a little nod while eating)
    if (head) {
      if (happy() && time > nextBob) { bob = 1; nextBob = time + 4 + Math.random() * 4; }
      if (bob > 0) { bob = Math.max(0, bob - dt * 1.2); head.rotation.x = Math.sin(bob * Math.PI * 6) * 0.35; }
      else if (feeding) head.rotation.x = Math.max(0, Math.sin(time * 8)) * 0.5;
      else head.rotation.x = 0;
    }

    if (!inTank()) return;
    dragon.position.y = T.floor + (Math.hypot(dragon.position.x - T.bask[0], dragon.position.z - T.bask[1]) < 0.08 ? 0.05 : 0);   // up on the rock
    if (feeding) { walkTo(T.food, dt * 2); return; }
    if (rest > 0) { rest -= dt; return; }
    if (!target) {
      // half the time off to bask under the lamp, otherwise somewhere on the sand
      target = Math.random() < 0.5 ? [...T.bask]
        : [inside.x1 + Math.random() * (inside.x2 - inside.x1), inside.z1 + Math.random() * (inside.z2 - inside.z1)];
    }
    if (!walkTo(target, dt)) { target = null; rest = 2 + Math.random() * 6; }
  }

  return { update, happy };
}

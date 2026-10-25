// A game between two devices, as it's kept in the database, and what each device makes of it. No page here, so
// the Node test runs it as it is.
//
// rooms/KQ7P = {
//   created, n,                       n: how many shots have been fired; shot n is player a's if n is even
//   a: { uid, name, hash, seen },     a started the game, b joined it; hash is set once their fleet is placed
//   b: { uid, name, hash, seen },
//   shots:   { 0: { by: 'a', x, y }, 1: ... },
//   results: { 0: { r: 'miss' | 'hit' | 'sunk', ship? }, ... },   written by the player who was fired at
//   reveal:  { a: { fleet, salt }, b: ... },                      written at the end
// }
//
// A fleet never goes into the database during the game. Each device keeps its own and puts up only a fingerprint
// of it (SHA-256 of the fleet and a random salt). The player who's fired at works out hit or miss on their own
// device and writes the answer. At the end both fleets are revealed: each device checks the other fleet matches
// its fingerprint and every answer it gave, so a wrong answer shows up.
import { FLEET, validFleet, resolveShot } from '../rules.js';

export const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';   // no I, O, 0 or 1 to mix up
export const CODE_RE = /^[A-HJ-NP-Z2-9]{4}$/;

export const newCode = (rng = Math.random) => Array.from({ length: 4 }, () => CODE_CHARS[Math.floor(rng() * CODE_CHARS.length)]).join('');
export const otherSeat = seat => (seat === 'a' ? 'b' : 'a');
/** Whose shot number n is. */
export const shooter = n => (n % 2 === 0 ? 'a' : 'b');

/** A fleet as one line of text, always in the same order: "carrier:0,0,h;battleship:...". */
export const fleetString = fleet => FLEET.map(({ id }) => {
  const s = fleet.find(f => f.id === id);
  return `${id}:${s.x},${s.y},${s.dir}`;
}).join(';');
export function parseFleet(text) {
  if (typeof text !== 'string') return null;
  const fleet = text.split(';').map(part => {
    const m = /^([a-z]+):(\d),(\d),([hv])$/.exec(part);
    return m && { id: m[1], x: Number(m[2]), y: Number(m[3]), dir: m[4] };
  });
  return fleet.every(Boolean) && validFleet(fleet) ? fleet : null;
}

const hex = bytes => [...new Uint8Array(bytes)].map(b => b.toString(16).padStart(2, '0')).join('');
export const newSalt = () => hex(crypto.getRandomValues(new Uint8Array(16)));
/** The fingerprint of a fleet with its salt. */
export async function fleetHash(fleet, salt) {
  return hex(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`${fleetString(fleet)}|${salt}`)));
}

/** The room's shots in order, each with its answer if it has one. (The REST API may hand back a list or an object.) */
export function shotList(room) {
  const out = [];
  for (let i = 0; i < ((room && room.n) || 0); i++) {
    const s = room.shots && room.shots[i];
    if (!s) break;
    const r = room.results && room.results[i];
    out.push({ n: i, by: s.by, x: s.x, y: s.y, result: r ? r.r : null, ship: r && r.ship ? { ...r.ship } : undefined });
  }
  return out;
}

/**
 * What the game looks like from one seat:
 * phase: 'waiting' (for someone to join) | 'placing' | 'playing' | 'over'
 * shots: [mine, theirs], only the answered ones, in the shape rules.js uses ({ x, y, result, ship? })
 * pending: a shot that hasn't been answered yet ({ n, by, x, y }), myTurn, winner ('me' | 'them' | null)
 */
export function view(room, seat) {
  const them = otherSeat(seat), me = room && room[seat], other = room && room[them];
  const all = shotList(room);
  const answered = all.filter(s => s.result);
  const toShot = s => (s.result === 'sunk' ? { x: s.x, y: s.y, result: s.result, ship: s.ship } : { x: s.x, y: s.y, result: s.result });
  const shots = [answered.filter(s => s.by === seat).map(toShot), answered.filter(s => s.by === them).map(toShot)];
  const sunk = i => shots[i].filter(s => s.result === 'sunk').length;
  const winner = sunk(0) === FLEET.length ? 'me' : sunk(1) === FLEET.length ? 'them' : null;
  const pending = all.find(s => !s.result) || null;
  const phase = !other ? 'waiting' : !(me && me.hash && other.hash) ? 'placing' : winner ? 'over' : 'playing';
  return {
    phase, shots, pending, winner,
    myTurn: phase === 'playing' && !pending && shooter((room && room.n) || 0) === seat,
    names: [me ? me.name : '', other ? other.name : ''],
    ready: [!!(me && me.hash), !!(other && other.hash)],
    seen: other && other.seen || null,
    n: (room && room.n) || 0,
  };
}

/**
 * At the end: does the other player's revealed fleet match their fingerprint and every answer they gave?
 * Returns { ok, fleet } or { ok: false, why }.
 */
export async function check(room, seat) {
  const them = otherSeat(seat), reveal = room.reveal && room.reveal[them];
  if (!reveal) return { ok: false, why: 'not revealed yet', waiting: true };
  const fleet = parseFleet(reveal.fleet);
  if (!fleet) return { ok: false, why: 'their fleet isn\'t a proper fleet' };
  if (await fleetHash(fleet, reveal.salt) !== room[them].hash) return { ok: false, why: 'their fleet isn\'t the one they placed at the start' };
  const mine = [];
  for (const s of shotList(room).filter(s => s.by === seat && s.result)) {
    const truth = resolveShot(fleet, mine, s.x, s.y);
    const same = truth.result === s.result && (s.result !== 'sunk' || (truth.ship.id === s.ship.id && truth.ship.x === s.ship.x && truth.ship.y === s.ship.y && truth.ship.dir === s.ship.dir));
    if (!same) return { ok: false, why: `the answer to your shot ${s.n + 1} was wrong` };
    mine.push(truth);
  }
  return { ok: true, fleet };
}

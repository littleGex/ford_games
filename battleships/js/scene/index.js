// The whole 3D world: the sea, your board on the left, the enemy waters on the right, the ships, pegs and
// effects. The game tells it what to show (show()) and what just happened (shot()); it never decides anything.
//
// The world always shows the game from one player's side (the viewer): their fleet on the home board and what
// they know of the other fleet on the target board. With two players on one device, the game calls show() again
// for the other player while the hand-off screen covers it.
import * as THREE from 'three';
import { createStage } from './stage.js';
import { createSea, waveHeight } from './sea.js';
import { createBoard, GRID_Y } from './boards.js';
import { makeShip, placeShip, tint, deckHeight } from './ships.js';
import { createEffects } from './effects.js';
import { cells, shipLength } from '../rules.js';

export const HOME_X = -6.5, TARGET_X = 6.5;
const SUNK_POSE = { y: -0.24, roll: 0.2, pitch: -0.09 };

export function createWorld(canvas) {
  const stage = createStage(canvas);
  const { scene, camera } = stage;
  const sea = createSea(scene);
  const boards = { home: createBoard(scene, { cx: HOME_X, kind: 'home' }), target: createBoard(scene, { cx: TARGET_X, kind: 'target' }) };
  const fx = createEffects(scene);

  // ship models on each board, by ship id. Each is a holder (placed and turned onto its squares) around the
  // model, so the model can roll and sink inside it.
  const models = { home: new Map(), target: new Map() };
  const sinking = [];   // { model, t, ms, done }
  const spots = new Map();   // in the enemy waters, the peg and fire on each hit square ("x,y"), until it sinks

  function addShip(side, ship, { sunk = false, ghost = false } = {}) {
    const board = boards[side];
    const holder = new THREE.Group();
    const model = makeShip(ship.id, side === 'home' ? 'home' : 'enemy');
    holder.add(model);
    placeShip(holder, ship, board);
    holder.userData.sunk = sunk;
    if (sunk) Object.assign(model.position, { y: SUNK_POSE.y }), model.rotation.set(SUNK_POSE.roll, 0, SUNK_POSE.pitch);
    if (ghost) for (const m of model.userData.mats) { m.transparent = true; m.opacity = 0.55; }
    board.pieces.add(holder);
    models[side].set(ship.id, holder);
    return holder;
  }
  function clearShips(side) {
    for (const holder of models[side].values()) boards[side].pieces.remove(holder);
    models[side].clear();
  }
  /** Where on its holder a square of a ship is (the holder is turned, so along x is along the ship). */
  function onShip(holder, x, y) {
    const s = holder.userData.ship, n = shipLength(s.id) - 1;
    const i = s.dir === 'h' ? x - s.x : y - s.y;
    return new THREE.Vector3(i - n / 2, deckHeight(s.id), 0);
  }

  // one shot landing, as it's shown once it has happened (animate: as it happens)
  function land(side, shot, animate) {
    const board = boards[side], { x, y, result } = shot;
    const at = board.centre(x, y).setY(0.1);
    if (result === 'miss') {
      board.peg(x, y, 'miss');
      if (animate) fx.splash(at);
      return null;
    }
    if (animate) fx.explode(at);
    if (side === 'home') {
      // the hit is on one of your ships: a peg on its deck and a fire that goes down with it
      const holder = [...models.home.values()].find(h => cells(h.userData.ship).some(([cx, cy]) => cx === x && cy === y));
      if (holder) {
        const peg = board.peg(0, 0, 'hit', 0);
        board.pieces.remove(peg);
        peg.position.copy(onShip(holder, x, y)).add(new THREE.Vector3(0, 0, 0.18));
        peg.userData.floats = false; peg.userData.onDeck = peg.position.y;
        holder.children[0].add(peg);
        fx.fire(onShip(holder, x, y).add(new THREE.Vector3(0, 0, -0.08)), holder.children[0]);
      }
    } else if (result === 'hit') {
      // in the enemy waters you only see the burning spot until the ship sinks
      spots.set(`${x},${y}`, { peg: board.peg(x, y, 'hit'), fire: fx.fire(board.local(x, y).setY(0.12), board.pieces, { small: true }) });
    }
    if (result === 'sunk') {
      if (side === 'target') {
        // the wreck shows where the ship was: its burning spots move onto it
        for (const [cx, cy] of cells(shot.ship)) {
          const spot = spots.get(`${cx},${cy}`);
          if (spot) { board.removePeg(spot.peg); spot.fire.remove(); spots.delete(`${cx},${cy}`); }
        }
        const holder = addShip('target', shot.ship);
        for (const [cx, cy] of cells(shot.ship)) fx.fire(onShip(holder, cx, cy).add(new THREE.Vector3(0, 0, -0.08)), holder.children[0], { small: true });
      }
      const holder = models[side].get(shot.ship.id);
      if (holder) {
        holder.userData.sunk = true;
        if (animate) {
          fx.sinkRings(boards[side].centre(...centreSquare(shot.ship)));
          return new Promise(done => sinking.push({ model: holder.children[0], t: 0, ms: 1800, done }));
        }
        holder.children[0].position.y = SUNK_POSE.y;
        holder.children[0].rotation.set(SUNK_POSE.roll, 0, SUNK_POSE.pitch);
      }
    }
    return null;
  }
  const centreSquare = s => { const n = (shipLength(s.id) - 1) / 2; return s.dir === 'h' ? [s.x + n, s.y] : [s.x, s.y + n]; };

  let viewing = 'home';
  const raycaster = new THREE.Raycaster(), ndc = new THREE.Vector2(), plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -GRID_Y), hitPoint = new THREE.Vector3();

  const world = {
    stage, boards,
    /**
     * Show the game from one player's side, all at once:
     * fleet (theirs), incoming (shots at it), outgoing (their shots), reveal (the other fleet, at the end).
     */
    show({ fleet = [], incoming = [], outgoing = [], reveal = null } = {}) {
      fx.clearFires();
      spots.clear();
      for (const side of ['home', 'target']) { clearShips(side); boards[side].clearPegs(); boards[side].setAim(null); boards[side].setHover(null); }
      sinking.splice(0).forEach(s => s.done());
      for (const ship of fleet) addShip('home', ship);
      for (const shot of incoming) land('home', shot, false);
      for (const shot of outgoing) land('target', shot, false);
      if (reveal) for (const ship of reveal) if (!models.target.has(ship.id)) addShip('target', ship, { ghost: true });
    },

    /** Fire a shell at a board ('target': the viewer fires, 'home': the viewer is fired at). Resolves once it's
     *  landed and settled (a ship that sinks has gone down). */
    async shot(side, shot) {
      const to = boards[side].centre(shot.x, shot.y).setY(0.2);
      let from;
      if (side === 'target') {
        // from one of your ships still afloat, else from your side of the sea
        const afloat = [...models.home.values()].filter(h => !h.userData.sunk);
        const h = afloat[Math.floor(Math.random() * afloat.length)];
        from = h ? h.getWorldPosition(new THREE.Vector3()).setY(0.5) : new THREE.Vector3(HOME_X, 0.5, 0);
      } else {
        from = boards.target.centre(Math.floor(Math.random() * 10), Math.floor(Math.random() * 10)).setY(0.4);
      }
      await fx.shell(from, to, 950);
      const sank = land(side, shot, true);
      if (sank) await sank;
    },

    /** Point the camera at a board ('home', 'target', or 'both' for the view over the two). */
    view(which, ms = 900) {
      viewing = which;
      if (which === 'both') return stage.lookAt(0, -0.5, ms, stage.portrait ? 2.15 : 1.4);
      return stage.lookAt(which === 'home' ? HOME_X : TARGET_X, 0, ms);
    },
    get viewing() { return viewing; },

    /** The board and square under a point on the screen, or null. */
    pick(clientX, clientY) {
      const r = canvas.getBoundingClientRect();
      ndc.set(((clientX - r.left) / r.width) * 2 - 1, -((clientY - r.top) / r.height) * 2 + 1);
      raycaster.setFromCamera(ndc, camera);
      if (!raycaster.ray.intersectPlane(plane, hitPoint)) return null;
      for (const side of ['home', 'target']) {
        const sq = boards[side].squareAt(hitPoint);
        if (sq) return { side, sq };
      }
      return null;
    },
    /** Where a square is on the screen (for tests, and for the keyboard aim). */
    screenOf(side, x, y) {
      const p = boards[side].centre(x, y).setY(GRID_Y).project(camera), r = canvas.getBoundingClientRect();
      return { x: r.left + (p.x + 1) / 2 * r.width, y: r.top + (1 - p.y) / 2 * r.height };
    },

    aim(sq) { boards.target.setAim(sq); },
    hover(side, sq) { boards.home.setHover(side === 'home' ? sq : null); boards.target.setHover(side === 'target' ? sq : null); },

    /** While placing: move one of your ships (and glow it: picked up, or red where it can't go). */
    moveShip(ship, glow = null) {
      const holder = models.home.get(ship.id);
      if (!holder) return;
      placeShip(holder, ship, boards.home);
      tint(holder.children[0], glow);
    },

    update(dt, t) {
      stage.update(dt);
      sea.update(t);
      for (const side of ['home', 'target']) {
        boards[side].update(t);
        // ships ride the waves: up and down with the water under their middle, and a gentle roll
        for (const holder of models[side].values()) {
          const p = holder.getWorldPosition(hitPoint);
          holder.position.y = holder.userData.sunk ? 0 : waveHeight(p.x, p.z, t) * 0.8;
          if (!holder.userData.sunk) holder.children[0].rotation.x = Math.sin(t * 1.4 + p.x) * 0.035;
        }
      }
      for (let i = sinking.length - 1; i >= 0; i--) {
        const s = sinking[i];
        s.t = Math.min(1, s.t + dt * 1000 / s.ms);
        const e = 1 - (1 - s.t) ** 3;
        s.model.position.y = SUNK_POSE.y * e;
        s.model.rotation.set(SUNK_POSE.roll * e, 0, SUNK_POSE.pitch * e);
        if (s.t >= 1) { sinking.splice(i, 1); s.done(); }
      }
      fx.update(dt, t);
    },
    render() { stage.renderer.render(scene, camera); },
  };
  return world;
}

// The two boards floating on the sea: a wooden jetty frame round each 10 x 10 patch of water, with the letters and
// numbers painted on the planks, a rope grid over the water and a lantern on each corner. Yours ("home") has white
// ropes and warm lanterns; the enemy waters ("target") have a glowing radar grid and red lanterns.
// Squares are 1 unit. Square (x, y) of a board centred on cx is at (cx - 4.5 + x, z = -4.5 + y).
import * as THREE from 'three';
import { SIZE } from '../rules.js';
import { waveHeight } from './sea.js';

export const GRID_Y = 0.13;
const PLANK = 0.75, FRAME_H = 0.32;

function canvasTex(w, h, draw) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.anisotropy = 4;
  return t;
}

// weathered planks, painted along the length of a strip
const woodTex = (len) => canvasTex(512, 64, (g, w, h) => {
  g.fillStyle = '#8a6544'; g.fillRect(0, 0, w, h);
  const rows = 3;
  for (let r = 0; r < rows; r++) {
    const y = r * h / rows;
    g.fillStyle = ['#94704d', '#7f5c3d', '#8d6948'][r]; g.fillRect(0, y + 1, w, h / rows - 2);
    g.fillStyle = 'rgba(40, 24, 12, .35)';
    for (let x = (r * 97) % 140; x < w; x += 512 / (len / 1.6)) g.fillRect(x, y, 2, h / rows);
    g.fillStyle = 'rgba(255, 240, 220, .06)';
    for (let i = 0; i < 18; i++) g.fillRect(Math.random() * w, y + 3 + Math.random() * (h / rows - 6), 30 + Math.random() * 60, 1);
  }
});

// the letters or numbers along one side, one per square, on a strip of planks
const labelTex = (chars) => canvasTex(1024, 80, (g, w, h) => {
  g.font = '800 54px "Baloo 2", "Trebuchet MS", sans-serif';
  g.textAlign = 'center'; g.textBaseline = 'middle';
  chars.forEach((ch, i) => {
    const x = (i + 0.5) * w / chars.length;
    g.fillStyle = 'rgba(30, 18, 8, .55)'; g.fillText(ch, x + 2, h / 2 + 4);
    g.fillStyle = '#f6e7cf'; g.fillText(ch, x, h / 2 + 2);
  });
});

const numberTex = () => canvasTex(80, 1024, (g, w, h) => {
  g.font = '800 54px "Baloo 2", "Trebuchet MS", sans-serif';
  g.textAlign = 'center'; g.textBaseline = 'middle';
  for (let i = 0; i < SIZE; i++) {
    const y = (i + 0.5) * h / SIZE;
    g.fillStyle = 'rgba(30, 18, 8, .55)'; g.fillText(String(i + 1), w / 2 + 2, y + 4);
    g.fillStyle = '#f6e7cf'; g.fillText(String(i + 1), w / 2, y + 2);
  }
});

const gridTex = (kind) => canvasTex(512, 512, (g, w) => {
  const step = w / SIZE;
  if (kind === 'target') { g.fillStyle = 'rgba(8, 30, 48, .32)'; g.fillRect(0, 0, w, w); }
  g.strokeStyle = kind === 'target' ? 'rgba(120, 240, 255, .7)' : 'rgba(245, 240, 228, .62)';
  g.lineWidth = kind === 'target' ? 2.5 : 3.5;
  for (let i = 1; i < SIZE; i++) {
    g.beginPath(); g.moveTo(i * step, 0); g.lineTo(i * step, w); g.stroke();
    g.beginPath(); g.moveTo(0, i * step); g.lineTo(w, i * step); g.stroke();
  }
  if (kind === 'target') {   // a few radar rings
    g.strokeStyle = 'rgba(120, 240, 255, .14)'; g.lineWidth = 2;
    for (let r = 1; r <= 3; r++) { g.beginPath(); g.arc(w / 2, w / 2, r * w / 6.5, 0, Math.PI * 2); g.stroke(); }
  }
});

export function createBoard(scene, { cx, kind }) {
  const root = new THREE.Group();
  root.position.x = cx;
  scene.add(root);
  const half = SIZE / 2;

  // the jetty: four strips of planks with posts under them
  const wood = (len) => new THREE.MeshStandardMaterial({ map: woodTex(len), roughness: 0.85 });
  const strip = (w, d, x, z, along) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, FRAME_H, d), wood(along ? w : d));
    if (!along) { m.material.map.center.set(0.5, 0.5); m.material.map.rotation = Math.PI / 2; }
    m.position.set(x, FRAME_H / 2 - 0.08, z);
    m.castShadow = true; m.receiveShadow = true;
    root.add(m);
  };
  const outer = SIZE + PLANK * 2;
  strip(outer, PLANK, 0, -half - PLANK / 2, true);
  strip(outer, PLANK, 0, half + PLANK / 2, true);
  strip(PLANK, SIZE, -half - PLANK / 2, 0, false);
  strip(PLANK, SIZE, half + PLANK / 2, 0, false);

  const postMat = new THREE.MeshStandardMaterial({ color: '#5a3f2a', roughness: 0.9 });
  const lampColor = kind === 'target' ? '#ff5a4a' : '#ffc45a';
  const lampMat = new THREE.MeshStandardMaterial({ color: lampColor, emissive: lampColor, emissiveIntensity: 1.4 });
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const x = sx * (half + PLANK / 2), z = sz * (half + PLANK / 2);
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.19, 1.0, 10), postMat);
    post.position.set(x, 0.2, z); post.castShadow = true; root.add(post);
    const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.17, 14, 10), lampMat);
    lamp.position.set(x, 0.85, z); root.add(lamp);
  }

  // letters along the far side, numbers down the left (drawn upright, 1 at the top)
  const letters = new THREE.Mesh(new THREE.PlaneGeometry(SIZE, PLANK * 0.9), new THREE.MeshBasicMaterial({ map: labelTex('ABCDEFGHIJ'.split('')), transparent: true }));
  letters.rotation.x = -Math.PI / 2;
  letters.position.set(0, FRAME_H - 0.07, -half - PLANK / 2);
  root.add(letters);
  const numbers = new THREE.Mesh(new THREE.PlaneGeometry(PLANK * 0.9, SIZE), new THREE.MeshBasicMaterial({ map: numberTex(), transparent: true }));
  numbers.rotation.x = -Math.PI / 2;
  numbers.position.set(-half - PLANK / 2, FRAME_H - 0.07, 0);
  root.add(numbers);

  // the grid over the water
  const grid = new THREE.Mesh(new THREE.PlaneGeometry(SIZE, SIZE), new THREE.MeshBasicMaterial({ map: gridTex(kind), transparent: true, depthWrite: false }));
  grid.rotation.x = -Math.PI / 2;
  grid.position.y = GRID_Y;
  grid.renderOrder = 1;
  root.add(grid);

  // what sits on the board: ships, pegs, the aim
  const pieces = new THREE.Group();
  root.add(pieces);

  const hover = new THREE.Mesh(new THREE.PlaneGeometry(0.94, 0.94), new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.16, depthWrite: false }));
  hover.rotation.x = -Math.PI / 2; hover.position.y = GRID_Y + 0.01; hover.visible = false; hover.renderOrder = 2;
  root.add(hover);
  const aim = new THREE.Group();
  const aimMat = new THREE.MeshBasicMaterial({ color: '#ffb02e', transparent: true, depthWrite: false });
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.3, 0.4, 32), aimMat);
  aim.add(ring);
  for (let i = 0; i < 4; i++) {
    const tick = new THREE.Mesh(new THREE.PlaneGeometry(0.06, 0.2), aimMat);
    const a = i * Math.PI / 2;
    tick.position.set(Math.sin(a) * 0.4, Math.cos(a) * 0.4, 0);
    tick.rotation.z = -a;
    aim.add(tick);
  }
  aim.rotation.x = -Math.PI / 2; aim.position.y = GRID_Y + 0.03; aim.visible = false; aim.renderOrder = 3;
  root.add(aim);

  const pegs = [];
  const pegMat = {
    miss: new THREE.MeshStandardMaterial({ color: '#f4f1ea', roughness: 0.5 }),
    hit: new THREE.MeshStandardMaterial({ color: '#e0342b', roughness: 0.45, emissive: '#5a0d08' }),
  };

  const local = (x, y) => new THREE.Vector3(-4.5 + x, 0, -4.5 + y);
  return {
    kind, root, pieces,
    /** The middle of square (x, y), in the world. */
    centre: (x, y) => local(x, y).add(root.position),
    local,
    /** The square under a point on the water (in the world), or null. */
    squareAt(p) {
      const x = Math.floor(p.x - cx + half), y = Math.floor(p.z + half);
      return x >= 0 && y >= 0 && x < SIZE && y < SIZE ? [x, y] : null;
    },
    setHover(sq) { hover.visible = !!sq; if (sq) hover.position.set(-4.5 + sq[0], GRID_Y + 0.01, -4.5 + sq[1]); },
    setAim(sq) { aim.visible = !!sq; if (sq) aim.position.set(-4.5 + sq[0], GRID_Y + 0.03, -4.5 + sq[1]); },
    /** A peg in a square: white for a miss, red for a hit. On a ship, it stands on the deck. */
    peg(x, y, result, onDeck = 0) {
      const g = new THREE.Group();
      const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 0.32, 10), pegMat[result === 'miss' ? 'miss' : 'hit']);
      stem.position.y = 0.16; stem.castShadow = true;
      const top = new THREE.Mesh(new THREE.SphereGeometry(0.1, 12, 8), stem.material);
      top.position.y = 0.34; top.castShadow = true;
      g.add(stem, top);
      if (result === 'miss') {   // a little float ring so it sits on the water
        const float = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.05, 8, 16), new THREE.MeshStandardMaterial({ color: '#2b78c2', roughness: 0.6 }));
        float.rotation.x = Math.PI / 2; float.position.y = 0.04;
        g.add(float);
      }
      g.position.copy(local(x, y));
      g.userData = { x, y, onDeck, floats: !onDeck };
      pieces.add(g);
      pegs.push(g);
      return g;
    },
    removePeg(p) { pegs.splice(pegs.indexOf(p), 1); p.parent && p.parent.remove(p); },
    clearPegs() { for (const p of pegs.splice(0)) if (p.parent) p.parent.remove(p); },
    update(t) {
      const s = 1 + Math.sin(t * 6) * 0.08;
      aim.scale.set(s, s, 1);
      ring.rotation.z = t * 0.8;
      for (const p of pegs) {
        const wx = p.position.x + cx, wz = p.position.z;
        p.position.y = p.userData.floats ? waveHeight(wx, wz, t) : p.userData.onDeck;
      }
      lampMat.emissiveIntensity = 1.25 + Math.sin(t * 2.3) * 0.15;
    },
  };
}

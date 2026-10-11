// Small canvas-painted textures: floors, brick, grass, fences. No image files needed.
import * as THREE from 'three';

export function canvasTex(draw, size = 256) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  draw(c.getContext('2d'));
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

export function stripes(a, b, n) {
  return canvasTex(g => { for (let i = 0; i < n; i++) { g.fillStyle = i % 2 ? b : a; g.fillRect(0, i * 256 / n, 256, 256 / n + 1); } });
}

const runningBond = (rows, h, w, grout, cols) => g => {
  g.fillStyle = grout; g.fillRect(0, 0, 256, 256);
  for (let r = 0; r < rows; r++) {
    const off = r % 2 ? w / 2 : 0;
    for (let c = -1; c < 256 / w + 1; c++) { g.fillStyle = cols[(r * 7 + c * 3 + 9) % cols.length]; g.fillRect(c * w + off + 2, r * h + 2, w - 4, h - 4); }
  }
};

export const TEX = {
  tile: canvasTex(g => {
    g.fillStyle = '#dfe4e8'; g.fillRect(0, 0, 256, 256); g.fillStyle = '#b6bfc7';
    for (let i = 0; i <= 256; i += 64) { g.fillRect(i, 0, 2, 256); g.fillRect(0, i, 256, 2); }
  }),
  paving: canvasTex(g => {
    g.fillStyle = '#a9a398'; g.fillRect(0, 0, 256, 256); g.fillStyle = '#8c867b';
    for (let i = 0; i <= 256; i += 128) { g.fillRect(i, 0, 3, 256); g.fillRect(0, i, 256, 3); }
  }),
  grass: canvasTex(g => {
    g.fillStyle = '#3e7a48'; g.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 900; i++) { g.fillStyle = Math.random() < .5 ? '#4a8a52' : '#356b3f'; g.fillRect(Math.random() * 256, Math.random() * 256, 2, 3); }
  }),
  brick: canvasTex(runningBond(12, 21.33, 64, '#d9c7b4', ['#c4532f', '#b84b2a', '#cc5c36', '#bd5532', '#a94526'])),
  redtile: canvasTex(runningBond(8, 32, 64, '#d4c3b2', ['#a84a3b', '#9e4535', '#b0503f', '#a3473a'])),
  parquet: canvasTex(g => { // basket-weave oak, as in the hall and living rooms
    for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) {
      const vert = (x + y) % 2 === 0;
      for (let k = 0; k < 3; k++) {
        g.fillStyle = ['#c9a06a', '#bf955e', '#d1aa74'][(x + y + k) % 3];
        if (vert) g.fillRect(x * 64 + k * 21.33, y * 64, 21.33, 64); else g.fillRect(x * 64, y * 64 + k * 21.33, 64, 21.33);
      }
      g.strokeStyle = '#9c7646'; g.lineWidth = 1.5; g.strokeRect(x * 64, y * 64, 64, 64);
    }
  }),
  greytile: canvasTex(g => {
    g.fillStyle = '#c6c5c1'; g.fillRect(0, 0, 256, 256); g.fillStyle = '#a9a8a4';
    for (let i = 0; i <= 256; i += 128) { g.fillRect(i, 0, 2, 256); g.fillRect(0, i, 256, 2); }
  }),
  cobble: canvasTex(g => {
    g.fillStyle = '#8f8a82'; g.fillRect(0, 0, 256, 256);
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) { g.fillStyle = ['#b3aea4', '#a49f95', '#bdb8ae', '#9d988f'][(x * 5 + y * 3) % 4]; g.fillRect(x * 16 + 1 + (y % 2) * 3, y * 16 + 1, 13, 13); }
  }),
  asphalt: canvasTex(g => {
    g.fillStyle = '#3d4047'; g.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 1400; i++) { g.fillStyle = Math.random() < .5 ? '#474a52' : '#34363c'; g.fillRect(Math.random() * 256, Math.random() * 256, 2, 2); }
  }),
  moss: canvasTex(g => {
    g.fillStyle = '#5b4636'; g.fillRect(0, 0, 256, 256);
    for (let r = 0; r < 8; r++) { g.fillStyle = '#4a382a'; g.fillRect(0, r * 32 + 29, 256, 3); }
    for (let i = 0; i < 260; i++) { g.fillStyle = ['#6f7a3a', '#5f6b30', '#7f8a44'][i % 3]; g.beginPath(); g.arc(Math.random() * 256, Math.random() * 256, 3 + Math.random() * 7, 0, 7); g.fill(); }
  }),
  boards: canvasTex(g => {
    for (let i = 0; i < 16; i++) { g.fillStyle = i % 2 ? '#8a7764' : '#7b6956'; g.fillRect(i * 16, 0, 15, 256); g.fillStyle = '#5f5143'; g.fillRect(i * 16 + 15, 0, 1, 256); }
  }),
};

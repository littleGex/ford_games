// The TV picture is a small canvas: off, a cartoon, or a platform game with a running score.
import * as THREE from 'three';
import { put } from '../core/build.js';

export function createTv() {
  const canvas = document.createElement('canvas'); canvas.width = 160; canvas.height = 90;
  const g = canvas.getContext('2d');
  const tex = new THREE.CanvasTexture(canvas);
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 0.6), new THREE.MeshBasicMaterial({ map: tex }));
  screen.position.set(3.195, 0.97, 2.2); screen.rotation.y = -Math.PI / 2;
  put(screen);

  function draw(mode, t = 0) {
    if (mode === 'tv') {
      const sky = g.createLinearGradient(0, 0, 0, 90); sky.addColorStop(0, '#7ec8f0'); sky.addColorStop(1, '#d8f0ff');
      g.fillStyle = sky; g.fillRect(0, 0, 160, 90);
      g.fillStyle = '#ffd43b'; g.beginPath(); g.arc(130, 18 + Math.sin(t * 2) * 4, 10, 0, 7); g.fill();
      g.fillStyle = '#5cb85c'; g.beginPath(); g.ellipse(40, 95, 70, 30, 0, 0, 7); g.ellipse(120, 98, 70, 28, 0, 0, 7); g.fill();
      const x = (t * 30) % 200 - 20, hop = Math.abs(Math.sin(t * 5)) * 14;
      g.fillStyle = '#ff7a59'; g.beginPath(); g.arc(x, 60 - hop, 8, 0, 7); g.fill();
      g.fillStyle = '#fff'; g.beginPath(); g.arc(x + 3, 57 - hop, 2.5, 0, 7); g.fill();
    } else if (mode === 'game') {
      g.fillStyle = '#5c94fc'; g.fillRect(0, 0, 160, 90);
      const off = (t * 40) % 32;
      for (let i = -1; i < 7; i++) { g.fillStyle = '#c84c0c'; g.fillRect(i * 32 - off, 74, 32, 16); g.fillStyle = '#e09c58'; g.fillRect(i * 32 - off + 2, 76, 28, 4); }
      for (let i = 0; i < 4; i++) { g.fillStyle = '#ffd43b'; g.fillRect(((i * 50 - t * 40) % 200 + 200) % 200 - 20, 40, 6, 8); }
      g.fillStyle = '#e8402a'; g.fillRect(40, 62 - Math.abs(Math.sin(t * 4)) * 22, 10, 12);
      g.fillStyle = '#fff'; g.font = 'bold 9px monospace';
      g.fillText('SCORE ' + String(Math.floor(t * 37) % 10000).padStart(4, '0'), 6, 12);
    } else {
      g.fillStyle = '#0b0d10'; g.fillRect(0, 0, 160, 90);
    }
    tex.needsUpdate = true;
  }
  draw('off');
  return { draw };
}

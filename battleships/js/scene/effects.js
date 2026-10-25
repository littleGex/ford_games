// Shells, splashes, explosions, fires and smoke. Every bit is a small mesh that lives for a moment and fades;
// fires stay where a ship has been hit and keep puffing smoke. All of it is updated from the frame loop.
import * as THREE from 'three';

const ball = new THREE.SphereGeometry(1, 10, 8);
const cone = new THREE.ConeGeometry(1, 1, 8, 1, true);
const GRAVITY = 9.8;
const MAX_SMOKE = 150;

export function createEffects(scene) {
  const bits = [];          // { mesh, vel, life, max, spin?, grow?, fade? }
  const fires = new Set();
  let smoke = 0;
  const flash = new THREE.PointLight('#ffa040', 0, 9, 2);
  scene.add(flash);
  let flashLeft = 0;

  function bit(mesh, { vel = new THREE.Vector3(), life = 1, gravity = 0, grow = 0, fadeFrom = 0.4, onEnd } = {}) {
    scene.add(mesh);
    bits.push({ mesh, vel, life, max: life, gravity, grow, fadeFrom, opacity: mesh.material.opacity, onEnd });
  }
  const glow = (color, opacity = 1) => new THREE.MeshBasicMaterial({ color, transparent: true, opacity, depthWrite: false });
  const soft = (color, opacity) => new THREE.MeshStandardMaterial({ color, transparent: true, opacity, depthWrite: false, roughness: 1 });

  function puff(pos, { color = '#4b4f55', size = 0.16, rise = 0.7, life = 1.9, opacity = 0.55 } = {}) {
    if (smoke >= MAX_SMOKE) return;
    smoke++;
    const m = new THREE.Mesh(ball, soft(color, opacity));
    m.position.copy(pos);
    m.scale.setScalar(size);
    bit(m, { vel: new THREE.Vector3((Math.random() - 0.5) * 0.15 + 0.12, rise, (Math.random() - 0.5) * 0.15), life, grow: 0.35, fadeFrom: 1, onEnd: () => smoke-- });
  }

  return {
    /** A shell flying in an arc from one point to another. Resolves as it lands. */
    shell(from, to, ms = 900) {
      return new Promise(done => {
        const m = new THREE.Mesh(ball, new THREE.MeshStandardMaterial({ color: '#2b2b2b', emissive: '#ff8a2a', emissiveIntensity: 0.6 }));
        m.scale.setScalar(0.1);
        scene.add(m);
        const peak = 3 + from.distanceTo(to) * 0.18;
        let t = 0, trail = 0;
        bits.push({
          mesh: m, life: Infinity, max: Infinity, custom(dt) {
            t = Math.min(1, t + dt * 1000 / ms);
            m.position.lerpVectors(from, to, t);
            m.position.y += Math.sin(t * Math.PI) * peak;
            if ((trail += dt) > 0.03) { trail = 0; puff(m.position, { color: '#d7d2c8', size: 0.07, rise: 0.15, life: 0.6, opacity: 0.45 }); }
            if (t >= 1) { done(); return false; }
            return true;
          },
        });
      });
    },

    /** A miss: a column of spray and a ring on the water. */
    splash(pos) {
      for (let i = 0; i < 18; i++) {
        const m = new THREE.Mesh(ball, glow('#e9f6ff', 0.9));
        m.position.copy(pos).add(new THREE.Vector3((Math.random() - 0.5) * 0.2, 0.05, (Math.random() - 0.5) * 0.2));
        m.scale.setScalar(0.05 + Math.random() * 0.05);
        const a = Math.random() * Math.PI * 2, out = Math.random() * 0.9;
        bit(m, { vel: new THREE.Vector3(Math.cos(a) * out, 3 + Math.random() * 2.2, Math.sin(a) * out), life: 1.1, gravity: GRAVITY });
      }
      const ring = new THREE.Mesh(new THREE.RingGeometry(0.7, 1, 28), glow('#ffffff', 0.7));
      ring.rotation.x = -Math.PI / 2;
      ring.position.copy(pos).setY(0.12);
      ring.scale.setScalar(0.15);
      bit(ring, { life: 0.9, grow: 1.1, fadeFrom: 1 });
    },

    /** A hit: a flash of fire, sparks, and a puff of black smoke. */
    explode(pos) {
      const ballOfFire = new THREE.Mesh(ball, glow('#ffb347', 0.95));
      ballOfFire.position.copy(pos).setY(pos.y + 0.25);
      ballOfFire.scale.setScalar(0.2);
      bit(ballOfFire, { life: 0.45, grow: 2.2, fadeFrom: 1 });
      for (let i = 0; i < 14; i++) {
        const m = new THREE.Mesh(ball, glow(i % 2 ? '#ffd166' : '#ff6b2b', 1));
        m.position.copy(pos).setY(pos.y + 0.25);
        m.scale.setScalar(0.04);
        const a = Math.random() * Math.PI * 2, out = 1 + Math.random() * 1.6;
        bit(m, { vel: new THREE.Vector3(Math.cos(a) * out, 2 + Math.random() * 2.5, Math.sin(a) * out), life: 0.8, gravity: GRAVITY });
      }
      for (let i = 0; i < 5; i++) puff(pos.clone().setY(pos.y + 0.4), { color: '#26282c', size: 0.22, rise: 0.9, life: 2.2, opacity: 0.7 });
      flash.position.copy(pos).setY(pos.y + 0.8);
      flash.intensity = 4;
      flashLeft = 0.35;
    },

    /** A fire that keeps burning on a hit square. `parent` carries it along (a ship that's sinking). */
    fire(local, parent, { small = false } = {}) {
      const g = new THREE.Group();
      const flames = [['#ff5a1f', 0.16, 0.42], ['#ffa62b', 0.11, 0.32], ['#ffe08a', 0.06, 0.2]].map(([c, r, h]) => {
        const f = new THREE.Mesh(cone, glow(c, 0.9));
        f.scale.set(r, h, r);
        f.position.y = h / 2;
        g.add(f);
        return f;
      });
      g.position.copy(local);
      if (small) g.scale.setScalar(0.6);
      parent.add(g);
      const fire = { g, flames, parent, next: Math.random() * 0.5, seed: Math.random() * 10 };
      fires.add(fire);
      return { remove() { fires.delete(fire); parent.remove(g); } };
    },
    clearFires() { for (const f of fires) f.parent.remove(f.g); fires.clear(); },

    /** The water swirling where a ship went down: a few rings. */
    sinkRings(pos) {
      for (let i = 0; i < 3; i++) {
        const ring = new THREE.Mesh(new THREE.RingGeometry(0.85, 1, 32), glow('#cfeaff', 0.5));
        ring.rotation.x = -Math.PI / 2;
        ring.position.copy(pos).setY(0.12);
        ring.scale.setScalar(0.4 + i * 0.3);
        bit(ring, { life: 1.6 + i * 0.4, grow: 0.9, fadeFrom: 1 });
      }
    },

    update(dt, t) {
      for (let i = bits.length - 1; i >= 0; i--) {
        const b = bits[i];
        if (b.custom) {
          if (!b.custom(dt)) { scene.remove(b.mesh); bits.splice(i, 1); }
          continue;
        }
        b.life -= dt;
        if (b.life <= 0) {
          scene.remove(b.mesh);
          b.mesh.material.dispose();
          bits.splice(i, 1);
          if (b.onEnd) b.onEnd();
          continue;
        }
        b.vel.y -= b.gravity * dt;
        b.mesh.position.addScaledVector(b.vel, dt);
        if (b.grow) b.mesh.scale.multiplyScalar(1 + b.grow * dt);
        const left = b.life / b.max;
        if (left < b.fadeFrom) b.mesh.material.opacity = b.opacity * (left / b.fadeFrom);
      }
      const wp = new THREE.Vector3();
      for (const f of fires) {
        f.flames.forEach((m, i) => {
          const k = 1 + Math.sin(t * (13 + i * 3) + f.seed) * 0.18 + Math.sin(t * 29 + f.seed * 2) * 0.08;
          m.scale.y = [0.42, 0.32, 0.2][i] * k;
          m.position.y = m.scale.y / 2;
        });
        if ((f.next -= dt) <= 0) {
          f.next = 0.45 + Math.random() * 0.3;
          f.g.getWorldPosition(wp);
          wp.y += 0.35;
          puff(wp);
        }
      }
      if (flashLeft > 0) { flashLeft -= dt; flash.intensity = Math.max(0, flashLeft / 0.35) * 4; }
    },
  };
}

// The sea: one big low-poly sheet with rolling waves. Flat shading gives the facets their sparkle without
// working out normals every frame. Ships and buoys ride the same waves through waveHeight().
import * as THREE from 'three';

const W = 120, D = 100, SEG_X = 120, SEG_Z = 100;

/** The height of the water at (x, z) at time t (seconds). Small, so the grid stays readable. */
export function waveHeight(x, z, t) {
  return 0.05 * Math.sin(x * 0.9 + t * 1.3) + 0.04 * Math.sin(z * 1.1 - t * 1.05) + 0.025 * Math.sin((x + z) * 1.7 + t * 2.1);
}

export function createSea(scene) {
  const geo = new THREE.PlaneGeometry(W, D, SEG_X, SEG_Z);
  geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position;
  const mat = new THREE.MeshStandardMaterial({ color: '#245f8c', roughness: 0.55, metalness: 0.05, flatShading: true });
  const sea = new THREE.Mesh(geo, mat);
  sea.receiveShadow = true;
  scene.add(sea);

  // a darker, deeper sea under everything so nothing shows through at the far edges
  const deep = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), new THREE.MeshBasicMaterial({ color: '#163a57' }));
  deep.rotation.x = -Math.PI / 2;
  deep.position.y = -0.6;
  scene.add(deep);

  return {
    update(t) {
      for (let i = 0; i < pos.count; i++) pos.setY(i, waveHeight(pos.getX(i), pos.getZ(i), t) - 0.02);
      pos.needsUpdate = true;
    },
  };
}

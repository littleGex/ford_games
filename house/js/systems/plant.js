// The terrace plant grows and turns greener after it's been watered.
import * as THREE from 'three';

export function createPlant({ world }) {
  let grow = 0;
  const green = new THREE.Color('#3fae4b'), thirsty = new THREE.Color('#6f8a3c');
  return {
    water() { grow = 1; },
    /** Start of day: small and thirsty, or already watered and grown. */
    reset(grown) {
      grow = grown ? 2 : 0;
      world.plant.scale.setScalar(grown ? 1.2 : 0.7);
      world.plantLeaf.color.copy(grown ? green : thirsty);
    },
    update(dt) {
      if (grow <= 0 || grow >= 2) return;
      grow = Math.min(2, grow + dt * .6);
      world.plant.scale.setScalar(0.7 + (grow - 1) * 0.5);
      world.plantLeaf.color.lerp(green, dt);
    },
  };
}

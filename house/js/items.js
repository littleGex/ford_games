// Everything the player can pick up and carry. Each item is a THREE.Group placed in the world.
// userData.carry / carryRot: custom hold position (mower, hoover); userData.wheel: wheeled along (bins).
import * as THREE from 'three';
import { add, mat, castShadows } from './core/build.js';

function item(build, pos, opts = {}) {
  const g = new THREE.Group();
  build(g);
  g.position.set(...pos);
  if (opts.rotY) g.rotation.y = opts.rotY;
  if (opts.rotX) g.rotation.x = opts.rotX;
  if (opts.hidden) g.visible = false;
  Object.assign(g.userData, opts.userData || {});
  return castShadows(g);
}

function bin(lid) {
  return g => {
    add(g, new THREE.BoxGeometry(0.5, 0.85, 0.55), mat('#1f2125'), [0, 0.47, 0]);
    add(g, new THREE.BoxGeometry(0.54, 0.05, 0.6), mat(lid), [0, 0.92, 0.01]);
    add(g, new THREE.BoxGeometry(0.46, 0.04, 0.05), mat('#1f2125'), [0, 0.9, -0.3]);   // handle
    [-0.2, 0.2].forEach(x => add(g, new THREE.CylinderGeometry(0.08, 0.08, 0.06, 14), mat('#111'), [x, 0.08, -0.24], null, [0, 0, Math.PI / 2]));
  };
}

export function createItems(scene) {
  const items = {
    cup: item(g => {
      add(g, new THREE.CylinderGeometry(.06, .05, .11, 16), mat('#ffffff'), [0, .055, 0]);
      add(g, new THREE.TorusGeometry(.035, .012, 8, 16), mat('#ffffff'), [.065, .06, 0]);
    }, [1.75, 0.75, 7.0]),
    jacket: item(g => {
      add(g, new THREE.BoxGeometry(.42, .07, .3), mat('#d64545'), [0, .035, 0]);
      add(g, new THREE.BoxGeometry(.44, .04, .08), mat('#b13434'), [0, .08, -.08]);
    }, [0.5, 0.42, 2.1]),
    can: item(g => {
      add(g, new THREE.CylinderGeometry(.11, .12, .22, 16), mat('#2f9e6e'), [0, .11, 0]);
      add(g, new THREE.CylinderGeometry(.015, .02, .26, 8), mat('#2f9e6e'), [.16, .17, 0], null, [0, 0, -1.0]);
    }, [4.55, 0, 2.75]),
    mug: item(g => {
      add(g, new THREE.CylinderGeometry(0.045, 0.04, 0.09, 14), mat('#f4f1ea'), [0, 0.045, 0]);
      add(g, new THREE.CylinderGeometry(0.04, 0.04, 0.005, 14), mat('#5a3a22'), [0, 0.087, 0]);
      add(g, new THREE.TorusGeometry(0.025, 0.008, 6, 12), mat('#f4f1ea'), [0.05, 0.05, 0], null, [0, 0, Math.PI / 2]);
    }, [3.86, 0.92, 0.95], { hidden: true }),
    plates: item(g => {
      [0, 0.025, 0.05].forEach((y, i) => add(g, new THREE.CylinderGeometry(0.13, 0.1, 0.02, 20), mat(i === 2 ? '#f3d9a0' : '#fafafa'), [0, y + 0.01, 0]));
      add(g, new THREE.SphereGeometry(0.03, 8, 6), mat('#c0392b'), [0.04, 0.075, 0.02]);
    }, [1.75, 0.75, 6.5]),
    shopping: item(g => {
      add(g, new THREE.BoxGeometry(0.32, 0.38, 0.2), mat('#b98a55'), [0, 0.19, 0]);
      add(g, new THREE.BoxGeometry(0.12, 0.12, 0.005), mat('#f2c81c'), [0, 0.22, 0.102]);
      const food = new THREE.Group(); food.name = 'food'; g.add(food);
      [['#e74c3c', -0.08], ['#f39c12', 0], ['#3a9d5d', 0.08]].forEach(([c, x]) => add(food, new THREE.SphereGeometry(0.06, 10, 8), mat(c), [x, 0.4, 0]));
    }, [3.95, 0, 7.75]),
    binBrown: item(bin('#7a4a28'), [4.85, 0, 9.65], { rotY: Math.PI, userData: { wheel: true } }),
    binYellow: item(bin('#f2c81c'), [5.42, 0, 9.65], { rotY: Math.PI, userData: { wheel: true } }),
    binBlack: item(bin('#2b2d31'), [4.85, 0, 10.25], { rotY: Math.PI, userData: { wheel: true } }),
    binBlue: item(bin('#2f6fd6'), [5.42, 0, 10.25], { rotY: Math.PI, userData: { wheel: true } }),
    mower: item(g => {
      add(g, new THREE.BoxGeometry(0.5, 0.22, 0.55), mat('#3aa655'), [0, 0.2, 0]);
      add(g, new THREE.CylinderGeometry(0.12, 0.14, 0.14, 14), mat('#2a2d33'), [0, 0.38, 0.05]);
      [[-0.27, 0.2], [0.27, 0.2], [-0.27, -0.2], [0.27, -0.2]].forEach(([x, z]) => add(g, new THREE.CylinderGeometry(0.09, 0.09, 0.05, 14), mat('#151515'), [x, 0.09, z], null, [0, 0, Math.PI / 2]));
      [-0.2, 0.2].forEach(x => add(g, new THREE.BoxGeometry(0.03, 0.03, 0.75), mat('#2a2d33'), [x, 0.55, -0.53], null, [0.75, 0, 0]));
      add(g, new THREE.BoxGeometry(0.43, 0.03, 0.03), mat('#2a2d33'), [0, 0.82, -0.8]);
    }, [3.45, 0, -14.75], { rotY: Math.PI, userData: { carry: [0, 0, 0.95] } }),
    basket: item(g => {
      add(g, new THREE.BoxGeometry(0.46, 0.24, 0.34), mat('#5aa9e6'), [0, 0.12, 0]);
      const laundry = new THREE.Group(); laundry.name = 'laundry'; g.add(laundry);
      ['#f4f4f4', '#e86a8a', '#f2d14a', '#9bd0a8'].forEach((c, i) => add(laundry, new THREE.SphereGeometry(0.1, 10, 8), mat(c), [-0.14 + i * 0.09, 0.24, (i % 2) * 0.06 - 0.03], [1, 0.5, 1]));
    }, [1.6, 0, -2.3]),
    bucket: item(g => {
      add(g, new THREE.CylinderGeometry(0.14, 0.11, 0.24, 16), mat('#2f6fd6'), [0, 0.12, 0]);
      add(g, new THREE.BoxGeometry(0.14, 0.06, 0.09), mat('#f2d14a'), [0.02, 0.26, 0]);
    }, [5.05, 0, -2.2]),
    hoover: item(g => {
      add(g, new THREE.BoxGeometry(0.26, 0.05, 0.12), mat('#3a3d44'), [0, 0.03, 0]);
      add(g, new THREE.CylinderGeometry(0.02, 0.02, 0.75, 10), mat('#9aa1a8'), [0, 0.42, 0]);
      add(g, new THREE.CylinderGeometry(0.05, 0.05, 0.18, 12), mat('#c9ccd1'), [0, 0.72, 0.06]);
      add(g, new THREE.CylinderGeometry(0.06, 0.06, 0.2, 12), mat('#7b4bb3'), [0, 0.88, 0]);
      add(g, new THREE.BoxGeometry(0.03, 0.14, 0.05), mat('#3a3d44'), [0, 1.03, -0.05]);
    }, [4.95, 0, 4.3], { userData: { carry: [0.12, 0, 0.55], carryRot: [-0.45, 0, 0] } }),
    shoes: item(g => { [-0.06, 0.06].forEach(x => add(g, new THREE.BoxGeometry(0.1, 0.08, 0.26), mat('#9a8f96'), [x, 0.04, 0])); }, [4.3, 0, 6.3], { rotY: 0.6 }),
    skates: item(g => {
      [-0.08, 0.08].forEach(x => {
        add(g, new THREE.BoxGeometry(0.11, 0.18, 0.24), mat('#f4f4f6'), [x, 0.14, 0]);
        [-0.08, 0.08].forEach(z => add(g, new THREE.CylinderGeometry(0.035, 0.035, 0.03, 10), mat('#9a7be0'), [x, 0.035, z], null, [0, 0, Math.PI / 2]));
      });
    }, [4.35, 0, 5.4], { rotY: -0.4 }),
    pad: item(g => {
      add(g, new THREE.BoxGeometry(0.16, 0.04, 0.09), mat('#f2f2f4'), [0, 0.02, 0]);
      [-0.07, 0.07].forEach(x => add(g, new THREE.SphereGeometry(0.035, 10, 8), mat('#f2f2f4'), [x, 0.02, 0.03]));
      add(g, new THREE.BoxGeometry(0.04, 0.01, 0.03), mat('#2f6fd6'), [0, 0.045, 0]);
    }, [3.0, 0.5, 3.4]),
    plug: item(g => {
      add(g, new THREE.BoxGeometry(0.07, 0.12, 0.07), mat('#16171a'), [0, 0.06, 0]);
      add(g, new THREE.CylinderGeometry(0.025, 0.025, 0.05, 10), mat('#2f6fd6'), [0, 0.14, 0]);
    }, [4.95, 0.62, 9.45]),
    // delivered during the game
    post: item(g => {
      ['#ffffff', '#f3e7c9', '#dfe9f5'].forEach((c, i) => add(g, new THREE.BoxGeometry(0.22, 0.01, 0.12), mat(c), [i * 0.01, i * 0.012, 0], null, [0, i * 0.2, 0]));
    }, [3.02, 0.98, 9.38], { rotX: -1.2, hidden: true }),
    card: item(g => { add(g, new THREE.BoxGeometry(0.15, 0.008, 0.1), mat('#f07a2a')); }, [3.02, 0.98, 9.38], { rotX: -1.2, hidden: true }),
    parcel: item(g => {
      add(g, new THREE.BoxGeometry(0.36, 0.26, 0.3), mat('#c49a62'), [0, 0.13, 0]);
      add(g, new THREE.BoxGeometry(0.37, 0.005, 0.07), mat('#e8d9a8'), [0, 0.262, 0]);
    }, [0, 0, 0], { hidden: true }),
  };
  Object.values(items).forEach(i => scene.add(i));
  return items;
}

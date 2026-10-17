// Everything the player can pick up and carry. Each item is a THREE.Group placed in the world.
// userData.carry / carryRot: custom hold position (mower, hoover); userData.wheel: wheeled along (bins).
// userData.level: which floor the item is on. Upstairs and attic items live in the upstairs / attic group,
// so their positions are plan coordinates with y = 0 at that floor.
import * as THREE from 'three';
import { add, mat, castShadows } from './core/build.js';
import { makePumpkin } from './world/halloween.js';

function item(build, pos, opts = {}) {
  const g = new THREE.Group();
  build(g);
  g.position.set(...pos);
  if (opts.rotY) g.rotation.y = opts.rotY;
  if (opts.rotX) g.rotation.x = opts.rotX;
  if (opts.hidden) g.visible = false;
  Object.assign(g.userData, opts.userData || {});
  g.userData.level = opts.level || 0;
  return castShadows(g);
}

// a little stack of folded clothes in three colours (attic, hidden until the washing is folded)
function pile(colours, pos) {
  return item(g => colours.forEach((c, i) => add(g, new THREE.BoxGeometry(0.3, 0.05, 0.22), mat(c), [0, 0.025 + i * 0.05, 0], null, [0, i * 0.15, 0])), pos, { level: 2, hidden: true });
}

function bin(lid) {
  return g => {
    add(g, new THREE.BoxGeometry(0.5, 0.85, 0.55), mat('#1f2125'), [0, 0.47, 0]);
    add(g, new THREE.BoxGeometry(0.54, 0.05, 0.6), mat(lid), [0, 0.92, 0.01]);
    add(g, new THREE.BoxGeometry(0.46, 0.04, 0.05), mat('#1f2125'), [0, 0.9, -0.3]);   // handle
    [-0.2, 0.2].forEach(x => add(g, new THREE.CylinderGeometry(0.08, 0.08, 0.06, 14), mat('#111'), [x, 0.08, -0.24], null, [0, 0, Math.PI / 2]));
  };
}

export function createItems(scene, upstairs, attic) {
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
    }, [3.95, 0, 7.75], { hidden: true }),   // comes with the food delivery (systems/deliveries.js)
    // Mum's and Dad's phone, on the side table by the sofa, screen lit up
    phone: item(g => {
      add(g, new THREE.BoxGeometry(0.075, 0.01, 0.15), mat('#1c1d21'), [0, 0.005, 0]);
      add(g, new THREE.BoxGeometry(0.066, 0.002, 0.135), new THREE.MeshStandardMaterial({ color: '#7fc4ff', emissive: '#3d8fd6' }), [0, 0.011, 0]);
    }, [0.85, 0.555, 3.68], { rotY: 0.3, userData: { carry: [0.05, 0.78, 0.24], carryRot: [-1.1, 0, 0] } }),
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
    // garden tools for the seasons: the rake by the shed, the snow shovel by the front door
    rake: item(g => {
      add(g, new THREE.CylinderGeometry(0.015, 0.015, 1.2, 8), mat('#b08850'), [0, 0.6, 0]);
      add(g, new THREE.BoxGeometry(0.4, 0.03, 0.04), mat('#3fa36b'), [0, 0.02, 0.02]);
      for (let k = 0; k < 7; k++) add(g, new THREE.BoxGeometry(0.012, 0.012, 0.09), mat('#3fa36b'), [-0.18 + k * 0.06, 0.01, 0.07]);
    }, [2.05, 0, -14.95], { userData: { carry: [0.12, 0, 0.6], carryRot: [-0.5, 0, 0] } }),
    shovel: item(g => {
      add(g, new THREE.CylinderGeometry(0.016, 0.016, 1.05, 8), mat('#2a2d33'), [0, 0.6, 0]);
      add(g, new THREE.BoxGeometry(0.42, 0.02, 0.32), mat('#e04848'), [0, 0.02, 0.12]);
      add(g, new THREE.BoxGeometry(0.16, 0.03, 0.03), mat('#2a2d33'), [0, 1.12, 0]);
    }, [4.45, 0, 9.5], { userData: { carry: [0.12, 0, 0.6], carryRot: [-0.5, 0, 0] } }),
    // from the shed: the hedge trimmer (leaning by the shed's front corner) and the soft brush on a long pole
    // for the solar panels; a bag of clippings shows up once the bushes are trimmed
    shears: item(g => {
      add(g, new THREE.BoxGeometry(0.1, 0.12, 0.22), mat('#3fa36b'), [0, 0.06, 0]);
      add(g, new THREE.BoxGeometry(0.03, 0.02, 0.55), mat('#b9bdc2'), [0, 0.06, 0.38]);
      for (let k = 0; k < 9; k++) add(g, new THREE.BoxGeometry(0.06, 0.008, 0.012), mat('#8a8f96'), [0, 0.06, 0.15 + k * 0.055]);
      add(g, new THREE.TorusGeometry(0.05, 0.012, 6, 14), mat('#2b2d31'), [0, 0.13, -0.08], null, [0, Math.PI / 2, 0]);
    }, [1.2, 0, -14.95], { rotY: 0.6, userData: { carry: [0.1, 0.62, 0.3], carryRot: [0, 0, 0] } }),
    panelBrush: item(g => {
      add(g, new THREE.CylinderGeometry(0.015, 0.015, 1.6, 8), mat('#9aa1a8'), [0, 0.8, 0]);
      add(g, new THREE.BoxGeometry(0.32, 0.06, 0.08), mat('#2f6fd6'), [0, 1.62, 0]);
      add(g, new THREE.BoxGeometry(0.3, 0.05, 0.07), mat('#f2f2f2'), [0, 1.67, 0]);
    }, [3.75, 0, -15.0], { userData: { carry: [0.12, 0, 0.3], carryRot: [0.55, 0, 0] } }),
    clippingsBag: item(g => {
      add(g, new THREE.CylinderGeometry(0.2, 0.18, 0.4, 14), mat('#3f7a3a'), [0, 0.2, 0]);
      ['#2f5b2e', '#4f8a3a', '#3b6b36'].forEach((c, i) => add(g, new THREE.SphereGeometry(0.08, 8, 6), mat(c), [-0.07 + i * 0.07, 0.41, (i % 2) * 0.05], [1, 0.6, 1]));
    }, [2.4, 0, -14.2], { hidden: true }),
    // the 3D printing mission: the box of filament the courier brings, and the finished model
    // (its layers are moved in from the printer when the print is done, see systems/printing.js)
    filamentBox: item(g => {
      add(g, new THREE.BoxGeometry(0.24, 0.1, 0.24), mat('#c49a62'), [0, 0.05, 0]);
      add(g, new THREE.BoxGeometry(0.245, 0.005, 0.06), mat('#2f6fd6'), [0, 0.102, 0]);
    }, [0, 0, 0], { hidden: true }),
    printModel: item(() => {}, [0.86, 0.09, 3.68], { hidden: true, userData: { carry: [0.1, 0.62, 0.26] } }),
    // a garden bag of raked leaves (shows up once the lawn is raked)
    leafBag: item(g => {
      add(g, new THREE.CylinderGeometry(0.2, 0.18, 0.4, 14), mat('#3f7a3a'), [0, 0.2, 0]);
      ['#d9822b', '#c4472b', '#e0a030'].forEach((c, i) => add(g, new THREE.SphereGeometry(0.08, 8, 6), mat(c), [-0.07 + i * 0.07, 0.41, (i % 2) * 0.05], [1, 0.5, 1]));
    }, [2.4, 0, -13.6], { hidden: true }),
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
    // a parcel for the neighbours: a long white box with red "fragile" tape, so it's not mixed up with ours
    neighbourParcel: item(g => {
      add(g, new THREE.BoxGeometry(0.44, 0.18, 0.26), mat('#eeeae2'), [0, 0.09, 0]);
      add(g, new THREE.BoxGeometry(0.445, 0.005, 0.06), mat('#d6453a'), [0, 0.182, 0]);
      add(g, new THREE.BoxGeometry(0.12, 0.004, 0.08), mat('#ffffff'), [0.12, 0.185, 0.07]);
    }, [0, 0, 0], { hidden: true }),

    // upstairs
    dirtyClothes: item(g => {
      [['#6f8fb3', 0, 0], ['#d9d4cc', 0.12, 0.08], ['#3e5a84', -0.1, 0.1], ['#b9c6d6', 0.05, -0.12]].forEach(([c, x, z], i) =>
        add(g, new THREE.SphereGeometry(0.14, 10, 8), mat(c), [x, 0.05 + i * 0.02, z], [1.3, 0.4, 1]));
    }, [1.75, 0.5, 2.0], { level: 1 }),
    laundryBag: item(g => {
      add(g, new THREE.SphereGeometry(0.17, 12, 10), mat('#eef1f3'), [0, 0.12, 0], [1, 0.8, 1]);
      [['#e86a8a', 0.06], ['#5d7fa6', -0.06]].forEach(([c, x]) => add(g, new THREE.SphereGeometry(0.06, 8, 6), mat(c), [x, 0.24, 0.02]));
    }, [4.55, 0.6, 3.58], { level: 1 }),
    towel: item(g => {
      add(g, new THREE.BoxGeometry(0.5, 0.03, 0.3), mat('#7a5a48'), [0, 0.015, 0]);
      add(g, new THREE.BoxGeometry(0.3, 0.05, 0.25), mat('#7a5a48'), [0.1, 0.04, 0.02], null, [0, 0.4, 0]);
    }, [3.95, 0, 7.6], { level: 1, rotY: 0.3 }),
    toys: item(g => {
      add(g, new THREE.BoxGeometry(0.14, 0.14, 0.14), mat('#e74c3c'), [0, 0.07, 0]);
      add(g, new THREE.SphereGeometry(0.08, 10, 8), mat('#2f6fd6'), [0.15, 0.08, 0.05]);
      add(g, new THREE.ConeGeometry(0.07, 0.16, 8), mat('#f2c81c'), [-0.12, 0.08, 0.08]);
      add(g, new THREE.BoxGeometry(0.2, 0.06, 0.1), mat('#9a7be0'), [0.02, 0.03, -0.14]);
    }, [2.25, 0, 6.15], { level: 1 }),
    // dinner, cooked on the hob and served at the dining table
    dinner: item(g => {
      add(g, new THREE.CylinderGeometry(0.13, 0.12, 0.14, 18), mat('#3a3d42'), [0, 0.07, 0]);
      add(g, new THREE.CylinderGeometry(0.12, 0.12, 0.02, 18), mat('#d98a3a'), [0, 0.13, 0]);
      [-1, 1].forEach(s => add(g, new THREE.BoxGeometry(0.06, 0.02, 0.03), mat('#1d1e22'), [s * 0.16, 0.11, 0]));
    }, [5.34, 0.91, 1.65], { hidden: true }),
    // P's bearded dragon: sandy body with a spiky beard and side spikes, long tail; parts are named so
    // systems/dragon.js can bob its head, swish its tail and warm up its colour when it's happy
    dragon: item(g => {
      const skin = new THREE.MeshStandardMaterial({ color: '#c9a46a', roughness: 0.8 }); skin.name = 'dragonSkin';
      const body = add(g, new THREE.SphereGeometry(0.05, 14, 10), skin, [0, 0.03, 0], [0.85, 0.45, 1.45]); body.name = 'body';
      const head = new THREE.Group(); head.name = 'head'; head.position.set(0, 0.04, 0.075); g.add(head);
      add(head, new THREE.SphereGeometry(0.03, 12, 8), skin, [0, 0, 0.012], [1.05, 0.7, 1.25]);
      add(head, new THREE.ConeGeometry(0.034, 0.03, 8, 1, true), mat('#9c7c4c'), [0, -0.014, 0.005], [1, 1, 0.8], [Math.PI, 0, 0]);   // the beard
      [-1, 1].forEach(sd => add(head, new THREE.SphereGeometry(0.006, 6, 4), mat('#1a1a1a'), [sd * 0.021, 0.008, 0.02]));
      const tail = new THREE.Group(); tail.name = 'tail'; tail.position.set(0, 0.025, -0.065); g.add(tail);
      add(tail, new THREE.ConeGeometry(0.02, 0.15, 8), skin, [0, 0, -0.072], null, [-Math.PI / 2, 0, 0]);
      [[-1, 0.04], [1, 0.04], [-1, -0.04], [1, -0.04]].forEach(([sd, z]) => add(g, new THREE.CylinderGeometry(0.008, 0.007, 0.04, 6), skin, [sd * 0.045, 0.012, z], null, [0, 0, sd * 1.1]));
      for (let i = -2; i <= 2; i++) [-1, 1].forEach(sd => add(g, new THREE.ConeGeometry(0.005, 0.014, 4), mat('#a88956'), [sd * 0.04, 0.035, i * 0.022], null, [0, 0, -sd * 0.9]));
      g.scale.setScalar(1.7);   // about 40 cm nose to tail
    }, [1.68, 0.49, 5.92], { level: 1, rotY: 0.5, userData: { carry: [0.12, 0.58, 0.26], carryRot: [0, -0.4, 0] } }),
    // its water bowl, in the terrarium
    dragonBowl: item(g => {   // on open sand at the front of the tank, so you can see it's back
      add(g, new THREE.CylinderGeometry(0.062, 0.05, 0.035, 16), mat('#c9733e'), [0, 0.0175, 0]);
      add(g, new THREE.CylinderGeometry(0.052, 0.052, 0.004, 16), new THREE.MeshStandardMaterial({ color: '#4fb3e8', emissive: '#1d5f88', roughness: 0.2 }), [0, 0.037, 0]);
    }, [1.47, 0.49, 6.04], { level: 1 }),
    // the box of crickets (and greens) on the windowsill in P's room, above the radiator
    cricketBox: item(g => {
      add(g, new THREE.BoxGeometry(0.12, 0.08, 0.09), new THREE.MeshStandardMaterial({ color: '#e8e8e2', transparent: true, opacity: 0.75 }), [0, 0.04, 0]);
      add(g, new THREE.BoxGeometry(0.125, 0.012, 0.095), mat('#5fae3d'), [0, 0.085, 0]);
      add(g, new THREE.BoxGeometry(0.07, 0.01, 0.05), mat('#4a3a22'), [0, 0.012, 0]);
    }, [1.55, 0.66, 8.8], { level: 1, rotY: 0.1 }),

    // P's crayons and drawing pad, left on the floor
    crayons: item(g => {
      add(g, new THREE.BoxGeometry(0.3, 0.01, 0.22), mat('#ffffff'), [0, 0.005, 0]);
      ['#e04848', '#f2d22e', '#48a0e0', '#6cc070', '#e86a8a'].forEach((c, i) =>
        add(g, new THREE.CylinderGeometry(0.008, 0.008, 0.1, 6), mat(c), [0.2 + (i % 2) * 0.03, 0.01, -0.06 + i * 0.03], null, [0, 0, Math.PI / 2]));
    }, [1.3, 0, 7.45], { level: 1, rotY: 0.4 }),
    // bathroom: a basket of wet washing for the airer in the office
    washBasket: item(g => {
      add(g, new THREE.CylinderGeometry(0.22, 0.18, 0.26, 16, 1, true), mat('#e8e2d4'), [0, 0.13, 0]);
      add(g, new THREE.CircleGeometry(0.18, 16), mat('#e8e2d4'), [0, 0.01, 0], null, [-Math.PI / 2, 0, 0]);
      const wet = new THREE.Group(); wet.name = 'laundry';
      [['#1d1e22', 0, 0], ['#c03a2a', 0.08, 0.06], ['#7fb0c4', -0.08, 0.05], ['#f08a3a', 0.02, -0.08]].forEach(([c, x, z]) =>
        add(wet, new THREE.SphereGeometry(0.1, 10, 8), mat(c), [x, 0.24, z], [1.2, 0.5, 1]));
      g.add(wet);
    }, [4.25, 0, 8.55], { level: 1 }),

    // folded washing, one pile for each wardrobe (on the office sofa once it's folded)
    pileDude: pile(['#1f2645', '#7cf04a', '#2d3037'], [2.55, 0.45, 5.75]),
    pileP: pile(['#c8b1e8', '#f7f5fa', '#e86a8a'], [2.55, 0.45, 6.3]),
    pileGrown: pile(['#f7f6f2', '#4a6a9c', '#ea4521'], [2.55, 0.45, 6.85]),

    // attic
    lego: item(g => {
      ['#f2d22e', '#e04848', '#48a0e0', '#6cc070', '#f2d22e', '#e04848'].forEach((c, i) =>
        add(g, new THREE.BoxGeometry(0.1, 0.05, 0.06), mat(c), [Math.cos(i * 2.1) * 0.13, 0.025 + (i % 2) * 0.05, Math.sin(i * 2.1) * 0.1], null, [0, i * 0.7, 0]));
    }, [2.2, 0, 2.55], { level: 2 }),
    socks: item(g => {
      [['#f2f2f2', 0], ['#2c3b5c', 0.1]].forEach(([c, x]) => add(g, new THREE.SphereGeometry(0.07, 8, 6), mat(c), [x, 0.03, 0], [1.6, 0.4, 0.8]));
    }, [3.4, 0, 2.7], { level: 2 }),
    jug: item(g => {   // small watering can for the plants up here
      add(g, new THREE.CylinderGeometry(0.08, 0.09, 0.18, 12), mat('#4f9a6a'), [0, 0.09, 0]);
      add(g, new THREE.CylinderGeometry(0.015, 0.02, 0.2, 6), mat('#4f9a6a'), [0.12, 0.14, 0], null, [0, 0, -0.9]);
    }, [3.35, 0, 7.45], { level: 2 }),
    // the school run mission: a school bag (put on the kid's desk when the mission starts) and P's bike on the terrace
    schoolBag: item(g => {
      add(g, new THREE.BoxGeometry(0.28, 0.32, 0.14), mat('#2f6fd6'), [0, 0.16, 0]);
      add(g, new THREE.BoxGeometry(0.29, 0.12, 0.15), mat('#f2c84a'), [0, 0.26, 0]);
      [-0.08, 0.08].forEach(x => add(g, new THREE.BoxGeometry(0.03, 0.26, 0.02), mat('#1d1e22'), [x, 0.18, -0.08]));
    }, [2.85, 0.73, 7.9], { level: 1, hidden: true }),
    bike: item(g => {
      [-0.32, 0.32].forEach(z => add(g, new THREE.TorusGeometry(0.21, 0.022, 8, 22), mat('#151515'), [0, 0.23, z], null, [0, Math.PI / 2, 0]));
      add(g, new THREE.BoxGeometry(0.035, 0.035, 0.62), mat('#e86a8a'), [0, 0.38, 0], null, [0.12, 0, 0]);
      add(g, new THREE.BoxGeometry(0.035, 0.3, 0.035), mat('#e86a8a'), [0, 0.38, -0.1]);
      add(g, new THREE.BoxGeometry(0.1, 0.035, 0.16), mat('#1d1e22'), [0, 0.54, -0.12]);                // saddle
      add(g, new THREE.BoxGeometry(0.34, 0.03, 0.03), mat('#1d1e22'), [0, 0.6, 0.28]);                  // handlebar
      add(g, new THREE.BoxGeometry(0.22, 0.14, 0.18), mat('#f4f4f4'), [0, 0.55, 0.42]);                // basket
    }, [4.1, 0, -2.6], { rotY: 0, userData: { carry: [0, 0, 0.05], carryRot: [0, 0, 0], wheel: true } }),
    // Dad's bike, dark grey, on the terrace next to P's (he cycles to the office on it)
    dadBike: item(g => {
      [-0.36, 0.36].forEach(z => add(g, new THREE.TorusGeometry(0.24, 0.024, 8, 22), mat('#151515'), [0, 0.26, z], null, [0, Math.PI / 2, 0]));
      add(g, new THREE.BoxGeometry(0.038, 0.038, 0.7), mat('#3a3f47'), [0, 0.43, 0], null, [0.12, 0, 0]);
      add(g, new THREE.BoxGeometry(0.038, 0.34, 0.038), mat('#3a3f47'), [0, 0.43, -0.12]);
      add(g, new THREE.BoxGeometry(0.1, 0.035, 0.17), mat('#1d1e22'), [0, 0.61, -0.14]);                // saddle
      add(g, new THREE.BoxGeometry(0.4, 0.03, 0.03), mat('#1d1e22'), [0, 0.68, 0.31]);                  // handlebar
      add(g, new THREE.BoxGeometry(0.18, 0.03, 0.3), mat('#2b2d31'), [0, 0.5, -0.38]);                 // rack over the back wheel
    }, [4.8, 0, -2.15], { rotY: 0, userData: { carry: [0, 0, 0.05], carryRot: [0, 0, 0], wheel: true } }),
    // Dude's clarinet, standing on its stand by his desk
    clarinet: item(g => {
      add(g, new THREE.CylinderGeometry(0.016, 0.016, 0.5, 10), mat('#141416'), [0, 0.3, 0]);
      add(g, new THREE.CylinderGeometry(0.045, 0.016, 0.08, 14), mat('#141416'), [0, 0.04, 0]);          // bell
      add(g, new THREE.CylinderGeometry(0.01, 0.016, 0.07, 8), mat('#141416'), [0, 0.585, 0]);           // mouthpiece
      [0.14, 0.22, 0.3, 0.38, 0.46].forEach(y => add(g, new THREE.TorusGeometry(0.018, 0.004, 4, 12), mat('#c9ccd1'), [0, y, 0], null, [Math.PI / 2, 0, 0]));
    }, [5.5, 0.05, 1.3], { level: 2, userData: { carry: [0, 0.32, 0.26], carryRot: [-0.5, 0, 0] } }),
    // Halloween (only shown on the day): the pumpkin to carve, in the garden; the box of decorations in the
    // hall; the bowl of sweets in the kitchen; and the kids' pumpkin bucket by the front door
    pumpkin: item(g => { g.userData.pumpkin = makePumpkin(g, 0.14, { carve: true }); }, [4.95, 0, -4.6], { hidden: true }),
    decoBox: item(g => {
      add(g, new THREE.BoxGeometry(0.42, 0.26, 0.32), mat('#e07a1e'), [0, 0.13, 0]);
      add(g, new THREE.BoxGeometry(0.43, 0.04, 0.33), mat('#1d1a24'), [0, 0.27, 0]);
      add(g, new THREE.SphereGeometry(0.06, 10, 8), mat('#f6f6f2'), [0.1, 0.31, 0.04]);      // the ghost peeking out
      add(g, new THREE.BoxGeometry(0.16, 0.005, 0.07), mat('#15151a'), [-0.08, 0.295, -0.04], null, [0, 0.4, 0]);   // a bat
    }, [3.75, 0, 5.1], { hidden: true }),
    sweetsBowl: item(g => {
      add(g, new THREE.CylinderGeometry(0.15, 0.09, 0.09, 18), mat('#7a3fb5'), [0, 0.045, 0]);
      [['#e74c3c', -0.05, 0.02], ['#f2c81c', 0.04, -0.03], ['#3fa36b', 0.0, 0.05], ['#f08a24', 0.06, 0.04], ['#2f6fd6', -0.03, -0.05]]
        .forEach(([c, x, z]) => add(g, new THREE.BoxGeometry(0.06, 0.025, 0.035), mat(c), [x, 0.095, z], null, [0, x * 20, 0]));
    }, [5.33, 0.9, 2.45], { hidden: true }),
    treatPail: item(g => {
      add(g, new THREE.SphereGeometry(0.11, 16, 10, 0, Math.PI * 2, Math.PI * 0.25, Math.PI * 0.75), mat('#ec7a1c'), [0, 0.11, 0], [1, 0.9, 1]);
      add(g, new THREE.TorusGeometry(0.1, 0.006, 6, 16, Math.PI), mat('#1d1a24'), [0, 0.18, 0]);
      [[-0.035, 0.12], [0.035, 0.12]].forEach(([x, y]) => add(g, new THREE.CircleGeometry(0.018, 3), mat('#1d1a24'), [x, y, 0.104]));
      const sweets = new THREE.Group(); sweets.name = 'sweets'; g.add(sweets);
      [['#e74c3c', -0.03], ['#f2c81c', 0.03], ['#3fa36b', 0]].forEach(([c, x], i) => add(sweets, new THREE.BoxGeometry(0.05, 0.022, 0.03), mat(c), [x, 0.165 + i * 0.012, x * 0.6], null, [0, i, 0]));
    }, [4.05, 0, 7.9], { hidden: true }),
    // bedtime: the kids' folded pyjamas (in their wardrobes, or somewhere odd when they can't be found) and a
    // glass of water from the bathroom
    pyjamasGirl: item(g => {
      add(g, new THREE.BoxGeometry(0.28, 0.07, 0.2), mat('#f4b6cf'), [0, 0.035, 0]);
      [[-0.07, 0.04], [0.06, -0.05], [0.02, 0.06]].forEach(([x, z]) => add(g, new THREE.CylinderGeometry(0.015, 0.015, 0.004, 8), mat('#ffffff'), [x, 0.072, z]));
    }, [2.88, 0.9, 6.95], { level: 1, hidden: true }),
    pyjamasBoy: item(g => {
      add(g, new THREE.BoxGeometry(0.28, 0.07, 0.2), mat('#7fb2e8'), [0, 0.035, 0]);
      [[-0.07, 0.04], [0.06, -0.05], [0.02, 0.06]].forEach(([x, z]) => add(g, new THREE.CylinderGeometry(0.015, 0.015, 0.004, 8), mat('#f2d24a'), [x, 0.072, z]));
    }, [0.35, 0.9, 3.45], { level: 2, hidden: true }),
    waterGlass: item(g => {
      add(g, new THREE.CylinderGeometry(0.035, 0.03, 0.11, 14), new THREE.MeshStandardMaterial({ color: '#dff1fb', transparent: true, opacity: 0.55 }), [0, 0.055, 0]);
      add(g, new THREE.CylinderGeometry(0.031, 0.028, 0.07, 14), new THREE.MeshStandardMaterial({ color: '#7fc4e8', transparent: true, opacity: 0.7 }), [0, 0.04, 0]);
    }, [5.02, 0.9, 6.98], { level: 1, hidden: true }),
    // the box that goes up into the loft and comes back down (moved about by the loft jobs)
    box: item(g => {
      add(g, new THREE.BoxGeometry(0.45, 0.32, 0.36), mat('#c49a62'), [0, 0.16, 0]);
      add(g, new THREE.BoxGeometry(0.46, 0.005, 0.08), mat('#e8d9a8'), [0, 0.322, 0]);
      add(g, new THREE.BoxGeometry(0.14, 0.004, 0.1), mat('#ffffff'), [0.1, 0.323, 0.1]);
    }, [3.6, 0, 6.6], { level: 2, hidden: true }),
  };
  Object.values(items).forEach(i => {
    // remember where each item starts, so every new day can put things back
    const parent = [scene, upstairs, attic][i.userData.level];
    i.userData.home = { pos: i.position.toArray(), rot: [i.rotation.x, i.rotation.y, i.rotation.z], visible: i.visible, parent, level: i.userData.level };
    parent.add(i);
  });
  return items;
}

/** Put one item back at its home spot (as it was when the game loaded). */
export function sendHome(item) {
  const h = item.userData.home;
  if (item.parent !== h.parent) h.parent.attach(item);
  item.position.fromArray(h.pos);
  item.rotation.set(...h.rot);
  item.userData.level = h.level;
}

/** Start-of-day reset: every item back home, shown or hidden as at load, contents refilled. */
export function resetItems(items) {
  Object.values(items).forEach(item => {
    sendHome(item);
    item.visible = item.userData.home.visible;
    item.traverse(o => { if (o !== item && o.isGroup) o.visible = true; });   // food in the bag, laundry in the basket
  });
}

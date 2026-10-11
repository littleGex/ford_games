// The first floor. Everything is built into one group raised by LEVEL_HEIGHT, which is hidden while the
// player is downstairs so the ground floor can be seen.
import * as THREE from 'three';
import { LEVEL_HEIGHT } from '../../config.js';
import { box, mat, setBuildTarget } from '../../core/build.js';
import { buildUpstairsStructure } from './structure.js';
import { buildElternzimmer } from './elternzimmer.js';
import { buildAnkleide } from './ankleide.js';
import { buildKinderzimmer } from './kinderzimmer.js';
import { buildBad } from './bad.js';

export function buildUpstairs(scene) {
  const upstairs = new THREE.Group();
  upstairs.position.y = LEVEL_HEIGHT;
  upstairs.visible = false;
  scene.add(upstairs);
  setBuildTarget(upstairs, 1);
  const handles = Object.assign({}, buildUpstairsStructure(), buildElternzimmer(), buildAnkleide(), buildKinderzimmer(), buildBad());
  // landing: the kids' height chart on the wall
  box(3.32, 5.1, 3.335, 5.32, 1.0, 0.25, mat('#5c9ee0'), false);
  box(3.335, 5.16, 3.34, 5.26, 0.5, 0.5, mat('#f2c84a'), false);
  setBuildTarget(scene, 0);
  return { upstairs, ...handles };
}

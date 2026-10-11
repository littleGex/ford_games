// The attic (Dachgeschoss). Built into one group raised by two floors' height, shown only while the
// player is up there.
import * as THREE from 'three';
import { LEVEL_HEIGHT } from '../../config.js';
import { setBuildTarget } from '../../core/build.js';
import { buildAtticStructure } from './structure.js';
import { buildDudesZimmer } from './dude.js';
import { buildOffice } from './office.js';
import { buildAtticFlur } from './flur.js';

export function buildAttic(scene) {
  const attic = new THREE.Group();
  attic.position.y = 2 * LEVEL_HEIGHT;
  attic.visible = false;
  scene.add(attic);
  setBuildTarget(attic, 2);
  const handles = Object.assign({}, buildAtticStructure(), buildDudesZimmer(), buildOffice(), buildAtticFlur());
  setBuildTarget(scene, 0);
  return { attic, ...handles };
}

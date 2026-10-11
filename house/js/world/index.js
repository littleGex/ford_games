// Builds the whole world and returns the handles that jobs and events need to change things
// (lamp, TV, fuse light, lawn, dirty windows, washing line, beds, washing machine...).
// world.upstairs is the first-floor group.
import { setBuildTarget } from '../core/build.js';
import { buildStructure } from './structure.js';
import { buildWohnzimmer } from './rooms/wohnzimmer.js';
import { buildEsszimmer } from './rooms/esszimmer.js';
import { buildKueche } from './rooms/kueche.js';
import { buildFlur } from './rooms/flur.js';
import { buildWindfang } from './rooms/windfang.js';
import { buildWc } from './rooms/wc.js';
import { buildFront } from './outside/front.js';
import { buildTerrace } from './outside/terrace.js';
import { buildGarden } from './outside/garden.js';
import { buildUpstairs } from './upstairs/index.js';

export function buildWorld(scene) {
  setBuildTarget(scene, 0);
  buildStructure();
  return Object.assign({},
    buildWohnzimmer(), buildEsszimmer(), buildKueche(), buildFlur(), buildWindfang(), buildWc(),
    buildFront(), buildTerrace(), buildGarden(),
    buildUpstairs(scene));
}

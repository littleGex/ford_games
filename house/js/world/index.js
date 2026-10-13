// Builds the whole world and returns the handles that jobs and events need to change things
// (lamp, TV, fuse light, lawn, dirty windows, washing line, beds, washing machine...).
// world.upstairs is the first-floor group, world.attic the attic.
import { setBuildTarget } from '../core/build.js';
import { buildStructure } from './structure.js';
import { buildWohnzimmer } from './rooms/wohnzimmer.js';
import { buildEsszimmer } from './rooms/esszimmer.js';
import { buildKueche } from './rooms/kueche.js';
import { buildFlur } from './rooms/flur.js';
import { buildWindfang } from './rooms/windfang.js';
import { buildWc } from './rooms/wc.js';
import { buildFront } from './outside/front.js';
import { buildNeighbours } from './outside/neighbours.js';
import { buildTerrace } from './outside/terrace.js';
import { buildGarden } from './outside/garden.js';
import { buildUpstairs } from './upstairs/index.js';
import { buildAttic } from './attic/index.js';
import { buildOffice } from './office.js';
import { buildMumOffice } from './mumoffice.js';

export function buildWorld(scene) {
  setBuildTarget(scene, 0);
  const structure = buildStructure();
  const world = Object.assign({}, structure,
    buildWohnzimmer(), buildEsszimmer(), buildKueche(), buildFlur(), buildWindfang(), buildWc(),
    buildFront(), buildNeighbours(), buildTerrace(), buildGarden(),
    buildUpstairs(scene), buildAttic(scene), buildOffice(), buildMumOffice(scene));
  world.dirt.push(world.panelDirt);   // dirt[3]: the solar panels on the shed (wiped like the terrace windows)
  return world;
}

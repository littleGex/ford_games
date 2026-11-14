// Offline cache check:  node tests/house/sw.mjs
// Every script the game loads must be in sw.js's list (so it works offline), and the list must change with
// them: phones only pick up a new version when CACHE_NAME changes, so any change to house/ needs a bump.
import { readFileSync, readdirSync, statSync } from 'fs';
import { join, relative } from 'path';
import { execSync } from 'child_process';

const root = new URL('../../house/', import.meta.url).pathname;
const sw = readFileSync(join(root, 'sw.js'), 'utf8');
const fail = [];
const walk = dir => readdirSync(dir).flatMap(f => { const p = join(dir, f); return statSync(p).isDirectory() ? walk(p) : [p]; });
for (const file of walk(join(root, 'js')).filter(f => f.endsWith('.js'))) {
  const rel = './' + relative(root, file);
  if (!sw.includes(`'${rel}'`)) fail.push(`${rel} is not in sw.js's list`);
}
// the cache name must have changed since the last commit that changed anything else in house/ (when git is there)
try {
  const lastSw = execSync(`git log -1 --format=%ct -G"CACHE_NAME = " -- house/sw.js`, { cwd: join(root, '..') }).toString().trim();
  const lastHouse = execSync(`git log -1 --format=%ct -- house/js house/index.html house/css`, { cwd: join(root, '..') }).toString().trim();
  if (lastSw && lastHouse && +lastHouse > +lastSw) fail.push('house/ changed after the last CACHE_NAME bump in sw.js: bump it so phones get the new version');
} catch (e) { /* no git: skip */ }
if (fail.length) { console.error('sw: FAIL\n  ' + fail.join('\n  ')); process.exit(1); }
console.log('sw: ok');

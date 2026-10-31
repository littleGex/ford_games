// Offline support: everything the game needs is cached on first visit.
// Bump CACHE_NAME whenever any file changes so phones pick up the new version.
const CACHE_NAME = 'house-cache-v41';
const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  './css/house.css',
  './js/config.js',
  './js/items.js',
  './js/main.js',
  './js/missions/missions.js',
  './js/state.js',
  './js/seasons.js',
  './js/holidays.js',
  './js/players.js',
  './js/names.js',
  './js/settings.js',
  './js/pack/kidrooms.js',
  './js/pack/workdesks.js',
  './js/advent.js',
  './js/familyserver.js',
  './js/settingsync.js',
  './js/characters/character.js',
  './js/characters/family.js',
  './js/characters/player.js',
  './js/characters/costumes.js',
  './js/characters/looks.js',
  './js/core/audio.js',
  './js/core/build.js',
  './js/core/collision.js',
  './js/core/input.js',
  './js/core/nozoom.js',
  './js/core/stage.js',
  './js/core/textures.js',
  './js/days/days.js',
  './js/days/planner.js',
  './js/days/save.js',
  './js/jobs/board.js',
  './js/jobs/jobs.js',
  './js/jobs/rules.js',
  './js/systems/charging.js',
  './js/systems/deliveries.js',
  './js/systems/dragon.js',
  './js/systems/trimming.js',
  './js/systems/printing.js',
  './js/systems/hoovering.js',
  './js/systems/levels.js',
  './js/systems/loft.js',
  './js/systems/weather.js',
  './js/systems/sweeping.js',
  './js/systems/seasonal.js',
  './js/systems/wiping.js',
  './js/systems/mowing.js',
  './js/systems/plant.js',
  './js/systems/power.js',
  './js/systems/sitting.js',
  './js/systems/waiting.js',
  './js/systems/halloween.js',
  './js/systems/christmas.js',
  './js/systems/bedtime.js',
  './js/systems/birthday.js',
  './js/ui/home.js',
  './js/ui/hud.js',
  './js/ui/sorting.js',
  './js/ui/laptop.js',
  './js/ui/avatar.js',
  './js/ui/advent.js',
  './js/ui/settings.js',
  './js/ui/setup.js',
  './js/ui/quiz.js',
  './js/lessons.js',
  './js/world/index.js',
  './js/world/rooms.js',
  './js/world/structure.js',
  './js/world/tv.js',
  './js/world/outside/front.js',
  './js/world/outside/neighbours.js',
  './js/world/office.js',
  './js/world/mumoffice.js',
  './js/world/school.js',
  './js/world/halloween.js',
  './js/world/christmas.js',
  './js/world/outside/garden.js',
  './js/world/outside/terrace.js',
  './js/world/rooms/esszimmer.js',
  './js/world/rooms/flur.js',
  './js/world/rooms/kueche.js',
  './js/world/rooms/wc.js',
  './js/world/rooms/windfang.js',
  './js/world/rooms/wohnzimmer.js',
  './js/world/attic/dude.js',
  './js/world/attic/flur.js',
  './js/world/attic/index.js',
  './js/world/attic/office.js',
  './js/world/attic/structure.js',
  './js/world/upstairs/ankleide.js',
  './js/world/upstairs/bad.js',
  './js/world/upstairs/elternzimmer.js',
  './js/world/upstairs/index.js',
  './js/world/upstairs/kinderzimmer.js',
  './js/world/upstairs/structure.js',
  'https://cdn.jsdelivr.net/npm/three@0.128.0/build/three.module.js'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(names =>
      Promise.all(names.filter(n => n !== CACHE_NAME).map(n => caches.delete(n)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  // only the game's own files and what's on the list above (three.js from the CDN): anything else (the family
  // server, fonts) goes straight to the network as usual, so server answers are never cached or held up here
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET') return;
  if (url.origin !== self.location.origin && !urlsToCache.includes(event.request.url)) return;
  event.respondWith(
    caches.match(event.request).then(response => response || fetch(event.request))
  );
});

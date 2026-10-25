// Offline support: everything the game needs is cached on first visit.
// Bump CACHE_NAME whenever any file changes so phones pick up the new version.
const CACHE_NAME = 'battleships-cache-v2';
const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  './css/battleships.css',
  './js/main.js',
  './js/rules.js',
  './js/game.js',
  './js/ai.js',
  './js/audio.js',
  './js/nozoom.js',
  './js/net/firebase.js',
  './js/net/online.js',
  './js/scene/index.js',
  './js/scene/stage.js',
  './js/scene/sea.js',
  './js/scene/boards.js',
  './js/scene/ships.js',
  './js/scene/effects.js',
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
  // only the game's own files and three.js from the CDN; anything else (fonts, the game server for games on two
  // devices) goes straight to the network, so live answers are never cached
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET') return;
  if (url.origin !== self.location.origin && !urlsToCache.includes(event.request.url)) return;
  event.respondWith(
    caches.match(event.request).then(response => response || fetch(event.request))
  );
});

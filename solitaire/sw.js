// Offline support: everything the game needs is cached on first visit.
// Bump CACHE_NAME whenever any file changes so phones pick up the new version.
const CACHE_NAME = 'solitaire-cache-v2';
const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  './icons/apple-touch-icon.png',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './klondike.js'
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
  // only the game's own files; the font comes from the network when there is one (offline, the system font)
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== self.location.origin) return;
  event.respondWith(
    // ignoreSearch: a deal link (?seed=1234) is the same page, so it opens offline too
    caches.match(event.request, { ignoreSearch: true }).then(response => response || fetch(event.request))
  );
});

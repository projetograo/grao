// GRÃO — Service Worker
const CACHE = 'grao-v1';
const ASSETS = [
  '/grao/',
  '/grao/index.html',
  '/grao/manifest.json',
  '/grao/icon-192.png',
  '/grao/icon-512.png'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(cached => {
      return cached || fetch(e.request).catch(() => caches.match('/grao/index.html'));
    })
  );
});

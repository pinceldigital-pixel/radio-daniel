const CACHE_NAME = 'radio-dial-v1';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './service-worker.js',
  './icons/icon-192.png',
  './icons/icon-512.png'
];
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)));
  self.skipWaiting();
});
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.map(k => k !== CACHE_NAME && caches.delete(k))))
  );
  self.clients.claim();
});
self.addEventListener('fetch', (e) => {
  const { request } = e;
  // Network first for audio streams; cache first for app shell
  if (request.destination === 'audio') { return; }
  e.respondWith(
    caches.match(request).then(cached => cached || fetch(request).catch(() => caches.match('./')))
  );
});

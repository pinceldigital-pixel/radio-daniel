const CACHE = 'radio-fm-cache-v1';
const ASSETS = [
  './',
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Orbitron:wght@700&family=Inter:wght@400;700&display=swap'
];

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    try { await cache.addAll(ASSETS); } catch(e) {}
    self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const cached = await cache.match(event.request);
    if (cached) return cached;
    try {
      const resp = await fetch(event.request, { mode: 'no-cors' });
      // Only cache basic/cors ok responses (skip opaque to avoid bloat)
      if (resp && (resp.type === 'basic' || resp.type === 'cors')) {
        cache.put(event.request, resp.clone());
      }
      return resp;
    } catch (e) {
      return cached || Response.error();
    }
  })());
});

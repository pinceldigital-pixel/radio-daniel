const CACHE = 'radio-fm-cache-v2';
const SAME_ORIGIN = self.location.origin;
const STATIC_ASSETS = [
  './',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Orbitron:wght@700&family=Inter:wght@400;700&display=swap'
];

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    try { await cache.addAll(STATIC_ASSETS); } catch(e) {}
    self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  const isAudio = req.destination === 'audio' || (req.headers.get('accept') || '').includes('audio');
  const isCrossOrigin = url.origin !== SAME_ORIGIN;
  if (isAudio || isCrossOrigin) { return; }

  if (req.method === 'GET') {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE);
      const cached = await cache.match(req);
      if (cached) return cached;
      try {
        const resp = await fetch(req);
        if (resp && resp.ok) cache.put(req, resp.clone());
        return resp;
      } catch (e) {
        return cached || Response.error();
      }
    })());
  }
});

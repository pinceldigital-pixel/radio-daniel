self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open('radio-pwa-v1').then((cache) => cache.addAll([
      './',
      './index.html',
      './manifest.json'
    ]))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== 'radio-pwa-v1').map(k => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});

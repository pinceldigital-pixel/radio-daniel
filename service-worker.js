const CACHE_NAME = 'radio-pwa-cache-v4'; // Versión actualizada a v4
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/9801466.png',
  '/crescent-moon-png-21.png' // <-- Nuevo ícono de la luna añadido
];

// Borrar cachés antiguas al activar el nuevo service worker
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.filter(cacheName => cacheName !== CACHE_NAME)
          .map(cacheName => caches.delete(cacheName))
      );
    })
  );
});

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Si la respuesta está en la caché, la retornamos
        if (response) {
          return response;
        }
        // Si no, la buscamos en la red
        return fetch(event.request);
      }
    )
  );
});
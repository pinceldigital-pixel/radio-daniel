const CACHE_NAME = 'radio-pwa-cache-v1';
const urlsToCache = [
  '/',
  'index.html',
  'manifest.json'
  // No es necesario cachear los iconos de placehold.co
  // No es necesario cachear la fuente de Google Fonts, el navegador lo gestiona bien
];

// Instalar el Service Worker y cachear los archivos de la app
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// Interceptar las peticiones y servir desde la caché si es posible
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Si la respuesta está en la caché, la retornamos
        if (response) {
          return response;
        }
        // Si no, hacemos la petición a la red
        return fetch(event.request);
      }
    )
  );
});
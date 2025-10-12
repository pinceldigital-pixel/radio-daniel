self.addEventListener('install', event => {
  event.waitUntil(
    caches.open('radio-pwa-v1').then(cache => {
      return cache.addAll(['./', './index.html', './main.js', './app.js', './icon.png', './manifest.json', './LouisGeorge-Light.ttf', './LouisGeorge-Bold.ttf']);
    })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});

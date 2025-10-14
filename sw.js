self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(caches.open('radio-pwa-v7').then((c) => c.addAll([
    './',
    './index.html',
    './styles.css',
    './app.js',
    './manifest.webmanifest',
    './icon-192.png',
    './icon-512.png',
    './splash-1242x2208.png'
  ]).catch(()=>{})));
});
self.addEventListener('activate', (e) => { 
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.map(k => k!== 'radio-pwa-v7' && caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if (url.origin === location.origin) {
    e.respondWith(caches.match(e.request).then(resp => resp || fetch(e.request)));
  }
});
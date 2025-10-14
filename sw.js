self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(caches.open('radio-v15').then(c => c.addAll([
    './','./index.html','./styles.css','./app.js','./manifest.json','./icon-192.png','./icon-512.png'
  ])));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.map(k => k!=='radio-v15' && caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener('fetch', (e) => {
  if (e.request.method!=='GET') return;
  const u = new URL(e.request.url);
  if (u.origin===location.origin) e.respondWith(caches.match(e.request).then(r => r || fetch(e.request)));
});
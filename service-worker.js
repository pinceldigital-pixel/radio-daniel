// Radio PWA service worker (cache shell only; audio streams go to network)
const CACHE = 'radio-pwa-retro-v1';
const ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

self.addEventListener('install', (e)=>{
  e.waitUntil(caches.open(CACHE).then(c=> c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', (e)=>{
  e.waitUntil(
    caches.keys().then(keys=> Promise.all(keys.map(k=> k!==CACHE && caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e)=>{
  const req = e.request;
  const isAudio = req.destination === 'audio' || /\.(mp3|aac|ogg|m3u8)(\?|$)/i.test(req.url);
  if(isAudio){ return; } // Let network handle audio streams
  e.respondWith(
    caches.match(req).then(cached=> cached || fetch(req).then(resp=>{
      const copy = resp.clone();
      caches.open(CACHE).then(c=> c.put(req, copy)).catch(()=>{});
      return resp;
    }).catch(()=> caches.match('./index.html')))
  );
});

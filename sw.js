
self.addEventListener('install', (e)=>{
  e.waitUntil(caches.open('radio-v1').then(cache=>cache.addAll(['./','./index.html','./styles.css','./app.js','./icon-192.png','./icon-512.png','./manifest.webmanifest'])));
  self.skipWaiting();
});
self.addEventListener('activate', (e)=>{ e.waitUntil(self.clients.claim()); });
self.addEventListener('fetch', (e)=>{
  e.respondWith(
    caches.match(e.request).then(resp=> resp || fetch(e.request).then(r=>{
      const copy = r.clone();
      caches.open('radio-v1').then(c=>c.put(e.request, copy));
      return r;
    }).catch(()=>caches.match('./')) )
  );
});

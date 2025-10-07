
const CACHE_NAME = 'radio-daniel-v4';
const ASSETS = ['./','./index.html','./styles.css','./manifest.webmanifest','./js/app.js','./assets/icon-192.png','./assets/icon-512.png'];
self.addEventListener('install', e=>{e.waitUntil(caches.open(CACHE_NAME).then(c=>c.addAll(ASSETS)));});
self.addEventListener('activate', e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.map(x=>x!==CACHE_NAME&&caches.delete(x)))));});
self.addEventListener('fetch', e=>{const u=new URL(e.request.url);if(u.origin===location.origin){e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request)));}else{e.respondWith(fetch(e.request));}});

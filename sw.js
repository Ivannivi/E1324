const CACHE_NAME = 'e1547-v1';
const ASSETS = [
  './',
  './index.html',
  './index.tsx',
  './manifest.json'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
});

self.addEventListener('fetch', (e) => {
  // Network first for API, Cache first for files
  if (e.request.url.includes('e621.net') || e.request.url.includes('googleapis')) {
      e.respondWith(fetch(e.request));
  } else {
      e.respondWith(
        caches.match(e.request).then((response) => response || fetch(e.request))
      );
  }
});

var CACHE = 'biologia-v32';
var FILES = [
  './',
  './index.html',
  './manifest.webmanifest',
  './assets/style.css',
  './assets/comu.js',
  './assets/temes.js',
  './assets/icon.svg',
  './assets/fonts.css',
  './assets/fonts/figtree-latin.woff2',
  './assets/fonts/figtree-latin-ext.woff2',
  './assets/fonts/outfit-latin.woff2',
  './assets/fonts/outfit-latin-ext.woff2',
  './tema-08/',
  './tema-08/index.html',
  './tema-08/contingut.js',
  './tema-08/dades.js',
  './tema-08/app.js'
];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(FILES); }));
  self.skipWaiting();
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (e) {
  if (e.request.method !== 'GET') return;
  var url = new URL(e.request.url);
  if (url.origin !== location.origin) return;
  e.respondWith(
    fetch(e.request).then(function (res) {
      var clone = res.clone();
      caches.open(CACHE).then(function (c) { c.put(e.request, clone); });
      return res;
    }).catch(function () { return caches.match(e.request); })
  );
});

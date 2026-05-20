const CACHE_NAME = 'servideere-v1';
// Lista de archivos que se guardarán para usar sin internet
const ASSETS = [
  './',
  './index.html',
  './css/styles.css',
  './js/app.js',
  './servi_icon.jpg'
];

// Instala el Service Worker y guarda los archivos en caché
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// Activa el Service Worker y limpia cachés viejos
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
});

// Estrategia: Buscar primero en internet, si falla (offline), usar la caché
self.addEventListener('fetch', (e) => {
  e.respondWith(
    fetch(e.request).catch(() => {
      return caches.match(e.request);
    })
  );
});

const CACHE_NAME = 'servideere-v1';

const ASSETS = [
  './',
  './index.html',
  './css/styles.css',
  './js/app.js',
  './manifest.json',        // ✅ agregado
  './icons/icon-192.png',   // ✅ cuando cambies el ícono
  './icons/icon-512.png'
];

// INSTALAR
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(ASSETS))
      .then(() => self.skipWaiting()) // ✅ activa inmediatamente
  );
});

// ACTIVAR
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) return caches.delete(key);
        })
      )
    ).then(() => self.clients.claim()) // ✅ toma control sin recargar
  );
});

// FETCH — Cache First (offline primero, luego red)
self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((cached) => {
      return cached || fetch(e.request).catch(() => {
        // Fallback para navegación offline
        if (e.request.mode === 'navigate') {
          return caches.match('./index.html');
        }
      });
    })
  );
});

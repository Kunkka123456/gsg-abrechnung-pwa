const CACHE_NAME = 'abrechnung-v2.0';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap'
];

// Install - Cache alle wichtigen Dateien
self.addEventListener('install', event => {
  console.log('[SW] Installation gestartet');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[SW] Cache wird befüllt');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('[SW] Installation erfolgreich');
        return self.skipWaiting(); // Aktiviere sofort
      })
      .catch(err => {
        console.error('[SW] Fehler beim Cachen:', err);
      })
  );
});

// Activate - Lösche alte Caches
self.addEventListener('activate', event => {
  console.log('[SW] Aktivierung gestartet');
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== CACHE_NAME) {
              console.log('[SW] Lösche alten Cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('[SW] Aktivierung erfolgreich');
        return self.clients.claim(); // Übernimm alle Tabs sofort
      })
  );
});

// Fetch - Offline-First Strategie
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        if (cachedResponse) {
          // Gefunden im Cache, gib zurück
          return cachedResponse;
        }

        // Nicht im Cache, versuche aus Netzwerk zu laden
        return fetch(event.request)
          .then(response => {
            // Prüfe ob gültige Response
            if (!response || response.status !== 200 || response.type === 'error') {
              return response;
            }

            // Clone Response für Cache
            const responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then(cache => {
                // Nur GET Requests cachen
                if (event.request.method === 'GET') {
                  cache.put(event.request, responseToCache);
                }
              });

            return response;
          })
          .catch(err => {
            console.log('[SW] Fetch fehlgeschlagen:', err);
            // Fallback für HTML-Seiten
            if (event.request.mode === 'navigate') {
              return caches.match('/index.html');
            }
            throw err;
          });
      })
  );
});

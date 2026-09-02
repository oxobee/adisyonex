const CACHE_NAME = 'adisyonex-offline-v2';
const STATIC_ASSETS = [
  '/',
  '/dashboard/orders',
  '/dashboard/pos',
  '/dashboard/tables',
  '/favicon.ico',
  '/manifest.webmanifest',
  '/icon.png',
  '/default-avatar.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('Service worker pre-cache warning:', err);
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Pass through non-GET, Next Server Actions, and API requests directly to network
  if (
    event.request.method !== 'GET' ||
    event.request.url.includes('/api/') ||
    event.request.headers.get('next-action')
  ) {
    return;
  }

  // Network-First with Cache Fallback for maximum freshness & offline resilience
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Cache successful responses dynamically for shell routes
        if (response && response.status === 200 && response.type === 'basic') {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache).catch(() => {});
          });
        }
        return response;
      })
      .catch(() => {
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // Fallback to cached root or orders dashboard
          if (event.request.mode === 'navigate') {
            return caches.match('/dashboard/orders').then((ordersFallback) => {
              return ordersFallback || caches.match('/');
            });
          }
          return new Response('Çevrimdışı Mod - Ağ Yok', {
            status: 503,
            statusText: 'Offline',
            headers: new Headers({ 'Content-Type': 'text/plain' })
          });
        });
      })
  );
});

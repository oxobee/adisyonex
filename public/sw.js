const CACHE_NAME = 'adisyonex-offline-v4';

// Static assets to pre-cache immediately upon installation
const PRECACHE_ASSETS = [
  '/',
  '/dashboard/home',
  '/dashboard/pos',
  '/dashboard/tables',
  '/manifest.webmanifest',
  '/favicon.ico',
  '/icon.png',
  '/default-avatar.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      // Pre-cache core shell pages and assets
      for (const url of PRECACHE_ASSETS) {
        try {
          await cache.add(url);
        } catch (err) {
          console.warn(`[SW] Pre-cache skip for ${url}:`, err);
        }
      }
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
  const req = event.request;
  const url = new URL(req.url);

  // Skip non-GET requests (mutations / POST / Server Actions handled by client queue)
  if (req.method !== 'GET') {
    return;
  }

  // Skip external analytics / chrome-extension URLs
  if (url.origin !== self.location.origin) {
    return;
  }

  // 1. Next.js Static JS & CSS chunks: Cache-First for instant offline booting
  if (url.pathname.startsWith('/_next/static/') || url.pathname.match(/\.(js|css|woff2?|png|jpe?g|svg|ico|webp)$/)) {
    event.respondWith(
      caches.match(req).then((cachedResponse) => {
        if (cachedResponse) {
          // Return cached asset immediately and update in background if online
          fetch(req).then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              caches.open(CACHE_NAME).then((cache) => cache.put(req, networkResponse));
            }
          }).catch(() => {});
          return cachedResponse;
        }
        return fetch(req).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const copy = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
          }
          return networkResponse;
        });
      })
    );
    return;
  }

  // 2. HTML Navigation & Next.js RSC Data requests: Network-First with Cache Fallback
  if (req.mode === 'navigate' || req.headers.get('accept')?.includes('text/html') || url.searchParams.has('_rsc')) {
    event.respondWith(
      fetch(req)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const copy = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
          }
          return networkResponse;
        })
        .catch(async () => {
          // Network failed — try exact match from cache first
          const cached = await caches.match(req);
          if (cached) return cached;

          // Try matching url without search params
          const cleanCached = await caches.match(url.pathname);
          if (cleanCached) return cleanCached;

          // Fallback to the default home screen or root shell
          const fallbackHome = await caches.match('/dashboard/home');
          if (fallbackHome) return fallbackHome;

          const fallbackRoot = await caches.match('/');
          if (fallbackRoot) return fallbackRoot;

          return new Response(
            `<!DOCTYPE html>
            <html lang="tr" class="dark">
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1">
              <title>AdisyonEx · Çevrimdışı Mod</title>
              <style>
                body { margin: 0; padding: 2rem; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #09090b; color: #f4f4f5; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; text-align: center; }
                .card { max-width: 420px; background: #18181b; border: 1px solid #27272a; border-radius: 1.5rem; padding: 2rem; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.5); }
                .badge { display: inline-flex; align-items: center; gap: 0.5rem; background: rgba(245,158,11,0.15); color: #fbbf24; border: 1px solid rgba(245,158,11,0.3); border-radius: 9999px; padding: 0.25rem 0.75rem; font-size: 0.75rem; font-weight: 700; margin-bottom: 1rem; }
                h1 { font-size: 1.5rem; margin: 0 0 0.5rem; font-weight: 900; }
                p { font-size: 0.875rem; color: #a1a1aa; line-height: 1.5; margin: 0 0 1.5rem; }
                .btn { display: inline-block; background: #ea580c; color: white; border: none; border-radius: 0.75rem; padding: 0.75rem 1.5rem; font-size: 0.875rem; font-weight: 700; text-decoration: none; cursor: pointer; transition: all 0.2s; }
                .btn:hover { background: #c2410c; }
              </style>
            </head>
            <body>
              <div class="card">
                <div class="badge">⚡ ÇEVRİMD IŞI LOKAL MOD</div>
                <h1>İnternet Bağlantısı Yok</h1>
                <p>Sistem çevrimdışı çalışmaya devam ediyor. Kaydedilen siparişler internet bağlantısı sağlandığında otomatik sunucuya aktarılacaktır.</p>
                <a href="/dashboard/home" class="btn">Ana Ekrana Dön</a>
              </div>
            </body>
            </html>`,
            {
              headers: { 'Content-Type': 'text/html; charset=utf-8' },
              status: 200
            }
          );
        })
    );
    return;
  }

  // 3. All other requests: Network with Cache Fallback
  event.respondWith(
    fetch(req).catch(() => caches.match(req))
  );
});

self.addEventListener('push', (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = { body: event.data ? event.data.text() : '' };
  }

  const title = payload.title || 'AdisyonEx';
  const options = {
    body: payload.body || 'Yeni bir bildiriminiz var.',
    icon: payload.icon || '/icon.png',
    badge: '/icon.png',
    tag: payload.tag || `adisyonex-${Date.now()}`,
    data: { url: payload.url || '/dashboard/home' },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || '/dashboard/home';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windows) => {
      const existing = windows.find((client) => client.url.startsWith(self.location.origin));
      if (existing) {
        return existing.focus().then(() => existing.navigate(targetUrl));
      }
      return self.clients.openWindow(targetUrl);
    }),
  );
});

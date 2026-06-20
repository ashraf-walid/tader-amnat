const CACHE_NAME = 'amanat-cache-v9';

self.addEventListener('install', (event) => {
  console.log('[ServiceWorker] Installing new version...');
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  console.log('[ServiceWorker] Activating new version...');
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log('[ServiceWorker] Removing old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('[ServiceWorker] Claiming clients');
        return self.clients.claim();
      })
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;

  if (request.method !== 'GET') {
    return;
  }

  if (request.url.includes('/api/')) {
    return;
  }

  if (request.destination === 'image') {
    event.respondWith(
      caches.open(CACHE_NAME)
        .then((cache) => {
          return cache.match(request)
            .then((cachedResponse) => {
              const fetchPromise = fetch(request)
                .then((networkResponse) => {
                  cache.put(request, networkResponse.clone());
                  return networkResponse;
                });
              return cachedResponse || fetchPromise;
            });
        })
    );
    return;
  }

  if (request.destination === 'style' || request.destination === 'script') {
    if (request.url.includes('/_next/static/')) {
      event.respondWith(
        caches.open(CACHE_NAME)
          .then((cache) => {
            return cache.match(request)
              .then((cachedResponse) => {
                if (cachedResponse) {
                  return cachedResponse;
                }
                return fetch(request)
                  .then((networkResponse) => {
                    cache.put(request, networkResponse.clone());
                    return networkResponse;
                  });
              });
          })
      );
    } else {
      event.respondWith(
        fetch(request)
          .then((networkResponse) => {
            return caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(request, networkResponse.clone());
                return networkResponse;
              });
          })
          .catch(() => {
            return caches.open(CACHE_NAME)
              .then((cache) => {
                return cache.match(request);
              });
          })
      );
    }
    return;
  }

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          return caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(request, networkResponse.clone());
              return networkResponse;
            });
        })
        .catch(() => {
          return caches.open(CACHE_NAME)
            .then((cache) => {
              return cache.match('/');
            });
        })
    );
  }
});

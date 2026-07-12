const CACHE_NAME = 'amanat-cache-v22';

self.addEventListener('install', (event) => {
  console.log('[ServiceWorker] Installing new version...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll([
        '/offline.html',
        '/',
        '/Storagecalculator',
        '/Storagecalculator/rates',
        '/client/balance',
        '/bank-accounts',
        '/employees',
        '/manifest.json',
        '/icons/tader.png',
        '/icons/tader192.png',
        '/icons/tadernoback.png',
        '/icons/screenshot-mobile.png',
        '/icons/screenshot-wide.png'
      ]))
      .then(() => self.skipWaiting())
  );
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

  // Cache-First strategy for Images
  if (request.destination === 'image') {
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
    return;
  }

  // Cache-First strategy for Fonts
  if (request.destination === 'font') {
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
      caches.open(CACHE_NAME).then((cache) => {
        return cache.match(request).then((cachedResponse) => {
          return cachedResponse || fetch(request).then((networkResponse) => {
            // Cache the fetched page for future navigations
            cache.put(request, networkResponse.clone());
            return networkResponse;
          }).catch(() => {
            // Offline fallback
            return cache.match('/')
              .then((rootMatch) => {
                if (rootMatch) return rootMatch;
                return cache.match('/offline.html')
                  .then((offlineMatch) => {
                    if (offlineMatch) return offlineMatch;
                    // Last resort: inline minimal HTML
                    return new Response(
                      '<!DOCTYPE html><html lang="ar" dir="rtl"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>غير متصل</title><style>body{font-family:system-ui,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;background:#0f172a;color:#f1f5f9;text-align:center;padding:1rem}h1{font-size:1.2rem}button{margin-top:1rem;padding:.6rem 1.5rem;border:none;border-radius:.5rem;background:#3b82f6;color:#fff;font-size:1rem;cursor:pointer;font-family:inherit}</style></head><body><div><h1>لا يوجد اتصال بالإنترنت</h1><button onclick="location.reload()">إعادة المحاولة</button></div></body></html>',
                      { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
                    );
                  });
              });
          });
        });
      })
    );
  }
});

// ─────────────────────────────────────────────
// Push Notifications
// ─────────────────────────────────────────────

// Receiving and displaying the notification to the user
self.addEventListener('push', (event) => {
  let data = { title: 'إشعار جديد', body: '', url: '/' };

  try {
    data = event.data.json();
  } catch {
    data.body = event.data?.text?.() || '';
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon || '/icons/tader192.png',
      badge: data.badge || '/icons/tader192.png',
      image: data.image || undefined,
      dir: 'rtl',
      lang: 'ar',
      data: { url: data.url || '/' },
    })
  );
});

// When the user clicks on the notification → open or focus the app window
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      if (clients.openWindow) return clients.openWindow(targetUrl);
    })
  );
});


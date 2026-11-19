// Service Worker PWA Talenta — Stratégie Network-First pour appliquer instantanément toutes les modifications de code
const CACHE_NAME = 'talenta-pwa-v1';

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  // Laisser passer les requêtes POST/PUT/DELETE/PATCH et les flux HMR Next.js directement au réseau
  if (
    req.method !== 'GET' ||
    req.url.includes('/_next/webpack-hmr') ||
    req.url.includes('/api/')
  ) {
    return;
  }

  // Stratégie Network-First : toujours récupérer la dernière version du code, et fallback sur le cache si hors-ligne
  event.respondWith(
    fetch(req)
      .then((res) => {
        if (res && res.status === 200 && res.type === 'basic') {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, clone)).catch(() => {});
        }
        return res;
      })
      .catch(() => caches.match(req))
  );
});

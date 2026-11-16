const CACHE_NAME = 'bill-splitter-v1';
const SCOPE_PREFIX = '/bill-splitter/';
const PRECACHE_URLS = [
  '/bill-splitter/',
  '/bill-splitter/index.html',
  '/bill-splitter/manifest.webmanifest',
  '/bill-splitter/icon.svg',
  '/bill-splitter/icon-192.png',
  '/bill-splitter/icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin || !url.pathname.startsWith(SCOPE_PREFIX)) {
    return;
  }

  // Network-first for HTML navigations so deployments update promptly while preserving offline fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put('/bill-splitter/index.html', copy));
          }
          return response;
        })
        .catch(() =>
          caches.match('/bill-splitter/index.html').then((cached) => cached || caches.match('/bill-splitter/'))
        )
    );
    return;
  }

  // Cache-first for hashed Vite assets, stale-while-revalidate for other same-scope files
  if (url.pathname.startsWith('/bill-splitter/assets/')) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response && response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return response;
        });
      })
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      const networkFetch = fetch(request)
        .then((response) => {
          if (response && response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => cached);
      return cached || networkFetch;
    })
  );
});

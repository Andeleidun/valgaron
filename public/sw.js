const VALGARON_CACHE_VERSION = 'valgaron-world-codex-v0.0.0';
const VALGARON_SHELL_CACHE = `${VALGARON_CACHE_VERSION}-shell`;
const VALGARON_ASSET_CACHE = `${VALGARON_CACHE_VERSION}-assets`;
const VALGARON_SHELL_URLS = [
  './',
  './manifest.webmanifest',
  './favicon.svg',
  './pwa-icon-192.png',
  './pwa-icon-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(VALGARON_SHELL_CACHE).then((cache) => {
      return cache.addAll(VALGARON_SHELL_URLS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) =>
        Promise.all(
          cacheNames
            .filter(
              (cacheName) =>
                cacheName.startsWith('valgaron-world-codex-') &&
                !cacheName.startsWith(VALGARON_CACHE_VERSION)
            )
            .map((cacheName) => caches.delete(cacheName))
        )
      )
  );
  self.clients.claim();
});

async function networkFirst(request) {
  const cache = await caches.open(VALGARON_SHELL_CACHE);
  try {
    const response = await fetch(request);
    if (response.ok) {
      await cache.put(request, response.clone());
    }
    return response;
  } catch {
    return (await cache.match(request)) ?? cache.match('./');
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(VALGARON_ASSET_CACHE);
  const cachedResponse = await cache.match(request);
  const networkResponsePromise = fetch(request)
    .then((response) => {
      if (response.ok) {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => undefined);

  return cachedResponse ?? networkResponsePromise;
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') {
    return;
  }

  const requestUrl = new URL(request.url);
  if (requestUrl.origin !== self.location.origin) {
    return;
  }

  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request));
    return;
  }

  if (
    request.destination === 'script' ||
    request.destination === 'style' ||
    request.destination === 'image' ||
    request.destination === 'manifest'
  ) {
    event.respondWith(staleWhileRevalidate(request));
  }
});

const VALGARON_DEPLOY_VERSION = '__VALGARON_DEPLOY_VERSION__';
const VALGARON_CACHE_VERSION = `valgaron-world-codex-v0.0.0-${VALGARON_DEPLOY_VERSION}`;
const VALGARON_SHELL_CACHE = `${VALGARON_CACHE_VERSION}-shell`;
const VALGARON_ASSET_CACHE = `${VALGARON_CACHE_VERSION}-assets`;
const VALGARON_NETWORK_TIMEOUT_MS = 6000;
const VALGARON_SHELL_URLS = [
  './',
  './manifest.webmanifest',
  './favicon.svg',
  './pwa-icon-192.png',
  './pwa-icon-512.png',
];

async function seedShellCache() {
  const cache = await caches.open(VALGARON_SHELL_CACHE);

  await Promise.all(
    VALGARON_SHELL_URLS.map(async (url) => {
      const response = await fetch(url, { cache: 'no-store' });

      if (!response.ok) {
        throw new Error(`Unable to cache ${url}: ${response.status}`);
      }

      await cache.put(url, response);
    })
  );
}

self.addEventListener('install', (event) => {
  event.waitUntil(seedShellCache().then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
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
        ),
      self.clients.claim(),
    ])
  );
});

async function networkFirst(request) {
  const cache = await caches.open(VALGARON_SHELL_CACHE);
  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    VALGARON_NETWORK_TIMEOUT_MS
  );
  try {
    const response = await fetch(request, {
      cache: 'no-store',
      signal: controller.signal,
    });
    if (response.ok) {
      await cache.put(request, response.clone());
    }
    return response;
  } catch {
    return (await cache.match(request)) ?? cache.match('./');
  } finally {
    clearTimeout(timeout);
  }
}

function staleWhileRevalidate(event, request) {
  const cachePromise = caches.open(VALGARON_ASSET_CACHE);
  const cachedResponsePromise = cachePromise.then((cache) =>
    cache.match(request)
  );
  const networkResultPromise = fetch(request).then((response) => ({
    cacheResponse: response.clone(),
    response,
  }));
  const cacheUpdatePromise = Promise.all([
    cachePromise,
    networkResultPromise,
  ]).then(([cache, result]) => {
    if (result.response.ok) {
      return cache.put(request, result.cacheResponse);
    }
    return undefined;
  });

  event.waitUntil(cacheUpdatePromise.catch(() => undefined));
  return cachedResponsePromise.then(
    (cachedResponse) =>
      cachedResponse ?? networkResultPromise.then((result) => result.response)
  );
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
    event.respondWith(staleWhileRevalidate(event, request));
  }
});
